import test from "node:test";
import assert from "node:assert/strict";
import { createWebAudioAdapter } from "../../src/ui/audio/web-audio-adapter.js";
import { createSilentAudioAdapter } from "../../src/ui/audio/silent-audio-adapter.js";
import { assertAudioPort } from "../../src/core/ports/audio-port.js";

const flush = async () => { for (let index = 0; index < 20; index += 1) await Promise.resolve(); };
const deferred = () => { let resolve, reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; };
const pcm = (frames = 100, channels = 1) => ({ length: frames, numberOfChannels: channels });
const bytes = (decodedBytes = 400) => ({ bytes: new ArrayBuffer(8), decodedBytes, frames: decodedBytes / 4, channels: 1, sampleRate: 44100 });
const state = (updates = {}) => ({ sessionId: "session-1", bgmAssetId: "asset.audio.music", ambientAssetId: "asset.audio.pond", volumes: { master: 0.8, music: 0.6, ambience: 0.4, effects: 0.5 }, reducedIntensity: false, ...updates });

class Parameter {
  constructor() { this.value = 1; this.calls = []; }
  cancelScheduledValues(time) { this.calls.push(["cancel", time]); }
  cancelAndHoldAtTime(time) { this.calls.push(["hold", time]); }
  setValueAtTime(value, time) { this.value = value; this.calls.push(["set", value, time]); }
  linearRampToValueAtTime(value, time) { this.calls.push(["ramp", value, time]); }
}
class Node {
  constructor() { this.connections = []; this.disconnected = false; }
  connect(target) { this.connections.push(target); }
  disconnect() { this.disconnected = true; }
}
class Source extends Node {
  constructor(context) { super(); this.context = context; this.starts = []; this.stops = []; }
  start(time = 0) { this.starts.push(time); if (this.context.failStart) throw Error("start failure"); }
  stop(time) { this.stops.push(time); }
  end() { this.onended?.(); }
}
class FakeContext {
  constructor() { this.state = "suspended"; this.currentTime = 10; this.sampleRate = 44100; this.gains = []; this.sources = []; this.destination = {}; this.resumes = 0; this.suspends = 0; this.closes = 0; this.decodes = 0; }
  createGain() { const node = new Node(); node.gain = new Parameter(); this.gains.push(node); return node; }
  createBufferSource() { const node = new Source(this); this.sources.push(node); return node; }
  resume() { this.resumes += 1; if (this.deny) return Promise.reject(Error("autoplay denied")); this.state = "running"; return Promise.resolve(); }
  suspend() { this.suspends += 1; this.state = "suspended"; return Promise.resolve(); }
  close() { this.closes += 1; this.state = "closed"; return Promise.resolve(); }
  decodeAudioData(data) { this.decodes += 1; assert.ok(data instanceof ArrayBuffer); return this.decode ? this.decode(data) : Promise.resolve(pcm()); }
}
function harness(options = {}) {
  const context = new FakeContext(), loads = [], statuses = [];
  const adapter = createWebAudioAdapter({ createContext: () => context, loadAudioBytes: async (id, opts) => { loads.push({ id, ...opts }); return bytes(); }, onStatus: (value) => statuses.push(value), ...options });
  return { context, adapter, loads, statuses };
}
async function started(h, desired = state()) { h.adapter.reconcile(desired); assert.equal((await h.adapter.unlock()).status, "ready"); }

test("TC-S3-AUDIO-001 unlock creates one four-bus graph and resumes synchronously before awaiting", async () => {
  let created = 0; const context = new FakeContext();
  const { adapter } = harness({ createContext: () => { created += 1; return context; } });
  assertAudioPort(adapter); assert.equal(created, 0);
  assert.equal(adapter.reconcile(state()).status, "blocked"); assert.equal(created, 0);
  const pending = adapter.unlock();
  assert.equal(created, 1); assert.equal(context.resumes, 1); assert.equal(context.gains.length, 4);
  assert.deepEqual(context.gains[0].connections, [context.destination]);
  for (const bus of context.gains.slice(1)) assert.deepEqual(bus.connections, [context.gains[0]]);
  assert.equal((await pending).status, "ready"); await adapter.unlock(); assert.equal(created, 1);
  assert.deepEqual(adapter.inspect().voices, { music: 1, ambience: 1, effects: 0 }); await adapter.dispose();
});

test("FR-SET-004 saved zero volumes are retained without any media request and later enable loads only its bus", async () => {
  const h = harness(), zero = state({ volumes: { master: 1, music: 0, ambience: 0, effects: 0 } });
  await started(h, zero); assert.equal(h.loads.length, 0); assert.equal(h.context.sources.length, 0);
  assert.deepEqual(h.context.gains.map((gain) => gain.gain.value), [1, 0, 0, 0]);
  await h.adapter.reconcile({ ...zero, volumes: { ...zero.volumes, ambience: 0.3 } });
  assert.deepEqual(h.loads.map((load) => load.id), ["asset.audio.pond"]);
  assert.equal(h.adapter.inspect().desired.volumes.music, 0);
  await h.adapter.reconcile({ ...zero, volumes: { master: 0, music: 1, ambience: 1, effects: 1 } });
  assert.equal(h.context.gains[0].gain.value, 0); await h.adapter.dispose();
});

test("TC-S3-AUDIO-001 identical desired loops across pages/settings never restart or decode twice", async () => {
  const h = harness(); await started(h);
  for (let i = 0; i < 8; i += 1) await h.adapter.reconcile(state({ volumes: { master: 0.6, music: 0.2, ambience: 0.1, effects: 0 } }));
  assert.equal(h.context.sources.length, 2); assert.equal(h.context.decodes, 2); assert.equal(h.loads.length, 2);
  assert.deepEqual(h.context.gains.slice(0, 4).map((gain) => gain.gain.value), [0.6, 0.2, 0.1, 0]);
  await h.adapter.dispose();
});

test("TC-S3-AUDIO-001 replacement crossfades exactly 1.5 seconds with at most two voices per loop bus", async () => {
  const h = harness(); await started(h, state({ ambientAssetId: undefined }));
  const old = h.context.sources[0];
  await h.adapter.reconcile(state({ bgmAssetId: "asset.audio.second", ambientAssetId: undefined }));
  assert.equal(h.adapter.inspect().voices.music, 2); assert.deepEqual(old.stops, [11.5]);
  assert.ok(h.context.gains[4].gain.calls.some((call) => call[0] === "ramp" && call[1] === 0 && call[2] === 11.5));
  assert.ok(h.context.gains[5].gain.calls.some((call) => call[0] === "ramp" && call[1] === 1 && call[2] === 11.5));
  await h.adapter.reconcile(state({ bgmAssetId: "asset.audio.third", ambientAssetId: undefined }));
  assert.equal(h.adapter.inspect().voices.music, 2); assert.ok(old.disconnected); assert.equal(old.buffer, null);
  h.context.sources[1].end(); assert.equal(h.adapter.inspect().voices.music, 1);
  await h.adapter.reconcile(state({ bgmAssetId: undefined, ambientAssetId: undefined }));
  h.context.sources[2].end(); assert.equal(h.adapter.inspect().voices.music, 0); await h.adapter.dispose();
});

test("TC-S3-AUDIO-001 missing target becomes silence and does not retry until explicit unlock", async () => {
  let attempts = 0;
  const h = harness({ loadAudioBytes: async (id) => { if (id === "asset.audio.missing") { attempts += 1; throw Error("404 private URL"); } return bytes(); } });
  await started(h, state({ ambientAssetId: undefined }));
  const desired = state({ bgmAssetId: "asset.audio.missing", ambientAssetId: undefined });
  assert.deepEqual(await h.adapter.reconcile(desired), { status: "unavailable", code: "AUDIO_LOAD" });
  assert.deepEqual(h.context.sources[0].stops, [11.5]);
  assert.deepEqual(await h.adapter.reconcile(desired), { status: "unavailable", code: "AUDIO_LOAD" });
  assert.deepEqual(await h.adapter.reconcile(desired), { status: "unavailable", code: "AUDIO_LOAD" });
  assert.equal(h.adapter.inspect().status, "unavailable"); assert.equal(attempts, 1);
  await h.adapter.unlock(); assert.equal(attempts, 2); await h.adapter.dispose();
});

test("TC-S3-AUDIO-002 reduced intensity halves chosen loop gains and disables pending/active SFX without changing settings", async () => {
  const h = harness(); await started(h);
  await h.adapter.playEffect({ assetId: "asset.audio.click", actionToken: "revision-1-choice" });
  assert.equal(h.adapter.inspect().voices.effects, 1);
  await h.adapter.reconcile(state({ reducedIntensity: true }));
  assert.deepEqual(h.context.gains.slice(0, 4).map((gain) => gain.gain.value), [0.8, 0.3, 0.2, 0]);
  assert.equal(h.adapter.inspect().voices.effects, 0);
  await h.adapter.playEffect({ assetId: "asset.audio.click", actionToken: "revision-2-choice" });
  assert.equal(h.adapter.inspect().voices.effects, 0); assert.equal(h.adapter.inspect().desired.volumes.effects, 0.5);
  await h.adapter.reconcile(state()); assert.equal(h.context.gains[1].gain.value, 0.6); await h.adapter.dispose();
});

test("TC-S3-AUDIO-002 suspend silences immediately, resume reconciles latest desired and disposal releases all resources", async () => {
  const h = harness(); await started(h); const first = [...h.context.sources];
  const pending = h.adapter.suspend(); assert.ok(first.every((source) => source.disconnected));
  assert.equal(h.context.gains[0].gain.value, 0); await pending;
  assert.equal(h.context.state, "suspended"); assert.equal(h.adapter.inspect().voices.music, 0);
  await h.adapter.reconcile(state({ volumes: { master: 0.2, music: 0.1, ambience: 0, effects: 0 } }));
  assert.equal(h.context.state, "running"); assert.equal(h.adapter.inspect().voices.music, 1);
  assert.equal(h.context.gains[0].gain.value, 0.2); assert.equal(h.loads.length, 2);
  await h.adapter.dispose(); await h.adapter.dispose(); assert.equal(h.context.closes, 1);
  assert.equal(h.adapter.inspect().decodedBytes, 0); assert.equal(h.adapter.inspect().cachedAssets.length, 0);
  assert.ok(h.context.gains.every((gain) => gain.disconnected));
  assert.deepEqual(h.adapter.unlock(), { status: "unavailable", code: "AUDIO_DISPOSED" });
});

test("TC-S3-AUDIO-001 denied activation is typed nonfatal and retries preserve zero consent levels", async () => {
  const h = harness(); h.context.deny = true; h.adapter.reconcile(state({ volumes: { master: 0, music: 0, ambience: 0, effects: 0 } }));
  assert.deepEqual(await h.adapter.unlock(), { status: "blocked", code: "AUDIO_GESTURE_REQUIRED" });
  assert.equal(h.loads.length, 0); h.context.deny = false;
  assert.equal((await h.adapter.unlock()).status, "ready"); assert.equal(h.loads.length, 0);
  assert.deepEqual(h.adapter.inspect().desired.volumes, { master: 0, music: 0, ambience: 0, effects: 0 }); await h.adapter.dispose();
});

test("TC-S3-AUDIO-001 unsupported/throwing platforms and silent adapter complete safely", async () => {
  for (const createContext of [() => null, () => { throw Error("unsupported"); }]) {
    const h = harness({ createContext }); assert.equal((await h.adapter.unlock()).status, "unavailable");
    assert.equal(h.loads.length, 0); await h.adapter.dispose();
  }
  const silent = createSilentAudioAdapter(); assertAudioPort(silent);
  for (const method of ["unlock", "reconcile", "playEffect"]) assert.equal((await silent[method]()).status, "unavailable");
  for (const method of ["suspend", "dispose"]) assert.equal((await silent[method]()).status, "ready");
});

test("TC-S3-AUDIO-001 stale decode cannot revive old scene/session or leak retained memory after dispose", async () => {
  const waits = [], h = harness(); h.context.decode = () => { const wait = deferred(); waits.push(wait); return wait.promise; };
  h.adapter.reconcile(state({ ambientAssetId: undefined })); const first = h.adapter.unlock(); await flush(); assert.equal(waits.length, 1);
  const second = h.adapter.reconcile(state({ sessionId: "session-2", bgmAssetId: "asset.audio.next", ambientAssetId: undefined }));
  await flush(); assert.equal(waits.length, 2);
  waits[1].resolve(pcm()); await second; assert.equal(h.context.sources.length, 1);
  waits[0].resolve(pcm()); await first; assert.equal(h.context.sources.length, 1);
  assert.deepEqual(h.adapter.inspect().cachedAssets, ["asset.audio.next"]);
  const final = h.adapter.reconcile(state({ sessionId: "session-3", bgmAssetId: "asset.audio.final", ambientAssetId: undefined })); await flush();
  await h.adapter.dispose(); waits[2].resolve(pcm()); await final;
  assert.equal(h.adapter.inspect().decodedBytes, 0); assert.equal(h.adapter.inspect().reservedBytes, 0);
});

test("TC-S3-PERF-001 decoder capacity remains two even when obsolete decodes ignore cancellation", async () => {
  const waits = [], h = harness(); h.context.decode = () => { const wait = deferred(); waits.push(wait); return wait.promise; };
  h.adapter.reconcile(state()); const first = h.adapter.unlock(); await flush(); assert.equal(waits.length, 2);
  const next = h.adapter.reconcile(state({ bgmAssetId: "asset.audio.newmusic", ambientAssetId: "asset.audio.newpond" })); await flush();
  assert.equal(waits.length, 2); assert.equal(h.adapter.inspect().runningLoads, 2); assert.equal(h.adapter.inspect().queuedLoads, 2);
  waits[0].resolve(pcm()); waits[1].resolve(pcm()); await flush(); assert.equal(waits.length, 4);
  waits[2].resolve(pcm()); waits[3].resolve(pcm()); await Promise.all([first, next]);
  assert.equal(h.context.sources.length, 2); assert.equal(h.adapter.inspect().decodedBytes, 800); await h.adapter.dispose();
});

test("TC-S3-PERF-001 PCM LRU counts channels and frames including active/fading pins and evicts inactive buffers", async () => {
  const h = harness({ maxDecodedBytes: 1200 }); await started(h, state({ ambientAssetId: undefined }));
  for (const id of ["second", "third"]) await h.adapter.reconcile(state({ bgmAssetId: `asset.audio.${id}`, ambientAssetId: undefined }));
  assert.equal(h.adapter.inspect().decodedBytes, 1200); assert.equal(h.adapter.inspect().voices.music, 2);
  await h.adapter.reconcile(state({ bgmAssetId: "asset.audio.fourth", ambientAssetId: undefined }));
  assert.equal(h.adapter.inspect().decodedBytes, 1200);
  assert.ok(!h.adapter.inspect().cachedAssets.includes("asset.audio.music")); await h.adapter.dispose();
  const small = harness({ maxDecodedBytes: 800 }); await started(small, state({ ambientAssetId: undefined }));
  await small.adapter.reconcile(state({ bgmAssetId: "asset.audio.second", ambientAssetId: undefined }));
  const outcome = await small.adapter.reconcile(state({ bgmAssetId: "asset.audio.third", ambientAssetId: undefined }));
  assert.equal(outcome.code, "AUDIO_BUDGET"); assert.ok(small.adapter.inspect().decodedBytes <= 800); assert.equal(small.context.decodes, 2); await small.adapter.dispose();
});

test("TC-S3-PERF-001 oversize/invalid buffers and estimates fail silently before retaining extra PCM", async () => {
  const h = harness({ maxDecodedBytes: 800, loadAudioBytes: async () => bytes(1200) });
  h.adapter.reconcile(state({ ambientAssetId: undefined })); assert.equal((await h.adapter.unlock()).code, "AUDIO_BUDGET");
  assert.equal(h.context.decodes, 0); assert.equal(h.adapter.inspect().decodedBytes, 0); await h.adapter.dispose();
  const actual = harness({ maxDecodedBytes: 800 }); actual.context.decode = async () => pcm(101, 2);
  actual.adapter.reconcile(state({ ambientAssetId: undefined })); assert.equal((await actual.adapter.unlock()).code, "AUDIO_BUDGET");
  assert.equal(actual.adapter.inspect().decodedBytes, 0); await actual.adapter.dispose();
});

test("TC-S3-AUDIO-001 effects dedupe per session and never replay missed muted/blocked actions", async () => {
  const h = harness(); const input = { assetId: "asset.audio.click", actionToken: "revision-1-confirm" };
  h.adapter.reconcile(state()); await h.adapter.playEffect(input); await h.adapter.unlock();
  await h.adapter.playEffect(input); assert.equal(h.adapter.inspect().voices.effects, 0);
  await h.adapter.playEffect({ ...input, actionToken: "revision-2-confirm" });
  await h.adapter.playEffect({ ...input, actionToken: "revision-2-confirm" }); assert.equal(h.adapter.inspect().voices.effects, 1);
  h.context.sources.at(-1).end(); assert.equal(h.adapter.inspect().voices.effects, 0);
  await h.adapter.reconcile(state({ sessionId: "session-2" })); await h.adapter.playEffect(input);
  assert.equal(h.adapter.inspect().voices.effects, 1); await h.adapter.dispose();
});

test("TC-S3-PERF-001 effect dedupe and voice/request sets are bounded during repeated actions", async () => {
  const h = harness(); await started(h, state({ bgmAssetId: undefined, ambientAssetId: undefined }));
  for (let index = 0; index < 150; index += 1) await h.adapter.playEffect({ assetId: "asset.audio.click", actionToken: `action-${index}` });
  assert.equal(h.adapter.inspect().dedupeTokens, 128); assert.equal(h.adapter.inspect().voices.effects, 4);
  assert.equal(h.context.decodes, 1); await h.adapter.dispose();
});

test("TC-S3-AUDIO-001 aborted pending effects cannot play on return from hidden or reduced intensity", async () => {
  const wait = deferred(); const h = harness({ loadAudioBytes: async (id) => id === "asset.audio.click" ? wait.promise : bytes() });
  await started(h); const effect = h.adapter.playEffect({ assetId: "asset.audio.click", actionToken: "choice-1" });
  await flush(); await h.adapter.suspend(); wait.resolve(bytes()); await effect;
  await h.adapter.reconcile(state()); assert.equal(h.adapter.inspect().voices.effects, 0); await h.adapter.dispose();
});

test("TC-S3-ASSET-001 hung media fetch times out at 10 seconds and never rejects story-facing callers", async () => {
  const timers = []; const h = harness({ loadAudioBytes: () => new Promise(() => {}), setTimer: (fn, delay) => { timers.push({ fn, delay }); return timers.length; }, clearTimer: () => {} });
  h.adapter.reconcile(state({ ambientAssetId: undefined })); const pending = h.adapter.unlock(); await flush();
  assert.equal(timers[0].delay, 10000); timers[0].fn();
  assert.deepEqual(await pending, { status: "unavailable", code: "AUDIO_LOAD" }); await flush();
  assert.equal(h.adapter.inspect().runningLoads, 0); assert.equal(h.adapter.inspect().pendingLoads, 0);
  assert.equal(h.context.sources.length, 0); await h.adapter.dispose();
});

test("TC-S3-AUDIO-001 malformed desires, decode errors, start errors and notification errors stay nonfatal", async () => {
  const h = harness({ onStatus: () => { throw Error("notification"); } });
  assert.equal(h.adapter.reconcile({ volumes: {} }).code, "AUDIO_CONTRACT");
  h.context.decode = async () => { throw Error("bad encoding private detail"); };
  h.adapter.reconcile(state()); assert.equal((await h.adapter.unlock()).code, "AUDIO_LOAD"); await h.adapter.dispose();
  const start = harness(); start.context.failStart = true; start.adapter.reconcile(state());
  assert.equal((await start.adapter.unlock()).code, "AUDIO_LOAD"); assert.equal(start.adapter.inspect().voices.music, 0);
  assert.ok(start.context.sources.every((source) => source.disconnected)); await start.adapter.dispose();
});

test("TC-S3-ASSET-001 preload requires existing activation and nonzero consent without creating a context", async () => {
  let created = 0;
  const context = new FakeContext(), h = harness({ createContext: () => { created += 1; return context; } });
  h.adapter.reconcile(state({ bgmAssetId: undefined, ambientAssetId: undefined }));
  assert.equal((await h.adapter.preload("asset.audio.next")).error.code, "AUDIO_GESTURE_REQUIRED");
  assert.equal(created, 0); assert.equal(h.loads.length, 0);
  await h.adapter.unlock(); assert.equal(created, 1);
  await h.adapter.reconcile(state({ volumes: { master: 1, music: 0, ambience: 0, effects: 0 } }));
  assert.equal((await h.adapter.preload("asset.audio.next")).error.code, "AUDIO_MUTED");
  await h.adapter.reconcile(state({ volumes: { master: 0, music: 1, ambience: 1, effects: 1 } }));
  assert.equal((await h.adapter.preload("asset.audio.next")).error.code, "AUDIO_MUTED");
  assert.equal(h.loads.length, 0); assert.equal(context.sources.length, 0);
  await h.adapter.suspend();
  assert.equal((await h.adapter.preload("asset.audio.next")).error.code, "AUDIO_GESTURE_REQUIRED");
  await h.adapter.dispose();
  assert.equal((await h.adapter.preload("asset.audio.next")).error.code, "AUDIO_DISPOSED");
});

test("TC-S3-ASSET-001 preload warms shared PCM once without voices, tokens or status changes", async () => {
  const h = harness(); await started(h, state({ bgmAssetId: undefined, ambientAssetId: undefined }));
  const before = structuredClone(h.adapter.inspect()), notifications = h.statuses.length;
  assert.deepEqual(await h.adapter.preload("asset.audio.next"), { ok: true });
  assert.deepEqual(await h.adapter.preload("asset.audio.next"), { ok: true });
  assert.equal(h.context.decodes, 1); assert.equal(h.loads.length, 1); assert.equal(h.context.sources.length, 0);
  assert.equal(h.adapter.inspect().pendingPreloads, 0); assert.equal(h.adapter.inspect().dedupeTokens, 0);
  assert.deepEqual(h.adapter.inspect().desired, before.desired); assert.equal(h.statuses.length, notifications);
  await h.adapter.reconcile(state({ bgmAssetId: "asset.audio.next", ambientAssetId: undefined }));
  assert.equal(h.context.decodes, 1); assert.equal(h.context.sources.length, 1);
  assert.equal(h.adapter.inspect().voices.music, 1); await h.adapter.dispose();
});

test("TC-S3-ASSET-001 cancelling one preload consumer preserves shared current playback and other consumers", async () => {
  const wait = deferred(), h = harness(); h.context.decode = () => wait.promise;
  await started(h, state({ bgmAssetId: undefined, ambientAssetId: undefined }));
  const controller = new AbortController();
  const aborted = h.adapter.preload("asset.audio.shared", { signal: controller.signal });
  const retained = h.adapter.preload("asset.audio.shared");
  await flush(); assert.equal(h.context.decodes, 1);
  const playing = h.adapter.reconcile(state({ bgmAssetId: "asset.audio.shared", ambientAssetId: undefined }));
  controller.abort();
  assert.equal((await aborted).error.code, "AUDIO_CANCELLED");
  assert.equal(h.loads[0].signal.aborted, false);
  assert.equal(h.adapter.inspect().reservedBytes, 400); assert.equal(h.adapter.inspect().runningLoads, 1);
  wait.resolve(pcm()); assert.deepEqual(await retained, { ok: true }); await playing;
  assert.equal(h.context.decodes, 1); assert.equal(h.context.sources.length, 1);
  assert.equal(h.adapter.inspect().pendingPreloads, 0); await h.adapter.dispose();
});

test("TC-S3-PERF-001 cancelled decode keeps its slot and reservation while two-slot queue prioritizes playback", async () => {
  const waits = [], h = harness(); h.context.decode = () => { const wait = deferred(); waits.push(wait); return wait.promise; };
  await started(h, state({ bgmAssetId: undefined, ambientAssetId: undefined }));
  const controller = new AbortController();
  const first = h.adapter.preload("asset.audio.first", { signal: controller.signal });
  const second = h.adapter.preload("asset.audio.second");
  const third = h.adapter.preload("asset.audio.third"); await flush();
  assert.equal(waits.length, 2); assert.equal(h.adapter.inspect().runningLoads, 2); assert.equal(h.adapter.inspect().reservedBytes, 800);
  controller.abort(); assert.equal((await first).error.code, "AUDIO_CANCELLED");
  assert.equal(h.adapter.inspect().runningLoads, 2); assert.equal(h.adapter.inspect().reservedBytes, 800);
  const playing = h.adapter.reconcile(state({ bgmAssetId: "asset.audio.current", ambientAssetId: undefined })); await flush();
  assert.equal(h.adapter.inspect().queuedLoads, 2);
  waits[0].resolve(pcm()); await flush();
  assert.equal(h.loads[2].id, "asset.audio.current"); assert.equal(h.adapter.inspect().runningLoads, 2);
  assert.equal(h.adapter.inspect().cachedAssets.includes("asset.audio.first"), false);
  waits[1].resolve(pcm()); await flush();
  assert.equal(h.loads[3].id, "asset.audio.third");
  waits[2].resolve(pcm()); waits[3].resolve(pcm());
  await Promise.all([second, third, playing]);
  assert.equal(h.adapter.inspect().reservedBytes, 0); assert.equal(h.adapter.inspect().decodedBytes, 1200);
  assert.equal(h.context.sources.length, 1); await h.adapter.dispose();
});

test("TC-S3-PERF-001 cancelled queued preload never fetches and duplicate preload consumers stay bounded", async () => {
  const waits = [], h = harness(); h.context.decode = () => { const wait = deferred(); waits.push(wait); return wait.promise; };
  await started(h, state({ bgmAssetId: undefined, ambientAssetId: undefined }));
  const pending = [h.adapter.preload("asset.audio.first"), h.adapter.preload("asset.audio.second")];
  const controller = new AbortController();
  const queued = h.adapter.preload("asset.audio.queued", { signal: controller.signal }); await flush();
  controller.abort(); assert.equal((await queued).error.code, "AUDIO_CANCELLED");
  for (let index = 0; index < 14; index += 1) pending.push(h.adapter.preload("asset.audio.first"));
  assert.equal((await h.adapter.preload("asset.audio.first")).error.code, "AUDIO_QUEUE_FULL");
  assert.equal(h.adapter.inspect().pendingPreloads, 16); assert.equal(h.adapter.inspect().runningLoads, 2);
  waits[0].resolve(pcm()); waits[1].resolve(pcm()); await Promise.all(pending);
  assert.equal(h.loads.length, 2); assert.equal(h.context.sources.length, 0); await h.adapter.dispose();
});

test("TC-S3-PERF-001 preload declines pinned PCM overflow and evicts only inactive decoded cache entries", async () => {
  const h = harness({ maxDecodedBytes: 800 }); await started(h, state({ ambientAssetId: undefined }));
  assert.deepEqual(await h.adapter.preload("asset.audio.next"), { ok: true });
  assert.equal(h.adapter.inspect().decodedBytes, 800);
  assert.deepEqual(await h.adapter.preload("asset.audio.later"), { ok: true });
  assert.deepEqual(h.adapter.inspect().cachedAssets, ["asset.audio.music", "asset.audio.later"]);
  await h.adapter.reconcile(state({ bgmAssetId: "asset.audio.later", ambientAssetId: undefined }));
  const statuses = h.statuses.length;
  assert.equal((await h.adapter.preload("asset.audio.overflow")).error.code, "AUDIO_BUDGET");
  assert.equal(h.context.decodes, 3); assert.equal(h.adapter.inspect().decodedBytes, 800);
  assert.equal(h.statuses.length, statuses); assert.equal(h.adapter.inspect().status, "ready"); await h.adapter.dispose();
});

test("TC-S3-ASSET-001 cancelled, timed-out and failed preload never changes playback status or leaks resources", async () => {
  const timers = [];
  const h = harness({ loadAudioBytes: () => new Promise(() => {}), setTimer: (fn) => { timers.push(fn); return timers.length; }, clearTimer: () => {} });
  await started(h, state({ bgmAssetId: undefined, ambientAssetId: undefined }));
  const controller = new AbortController(); controller.abort();
  assert.equal((await h.adapter.preload("asset.audio.cancelled", { signal: controller.signal })).error.code, "AUDIO_CANCELLED");
  assert.equal(timers.length, 0);
  assert.equal((await h.adapter.preload("../escape")).error.code, "AUDIO_CONTRACT");
  const pending = h.adapter.preload("asset.audio.timeout"); await flush(); timers[0]();
  assert.equal((await pending).error.code, "AUDIO_TIMEOUT"); await flush();
  assert.equal(h.adapter.inspect().pendingLoads, 0); assert.equal(h.adapter.inspect().runningLoads, 0);
  assert.equal(h.adapter.inspect().pendingPreloads, 0); assert.equal(h.adapter.inspect().status, "ready"); await h.adapter.dispose();
  const broken = harness({ loadAudioBytes: async () => { throw Error("private failure detail"); } });
  await started(broken, state({ bgmAssetId: undefined, ambientAssetId: undefined }));
  assert.deepEqual(await broken.adapter.preload("asset.audio.broken"), { ok: false, error: { code: "AUDIO_LOAD" } });
  assert.equal(broken.adapter.inspect().status, "ready"); await broken.adapter.dispose();
});

test("TC-S3-ASSET-001 session change and dispose discard speculative late PCM without voices", async () => {
  const waits = [], h = harness(); h.context.decode = () => { const wait = deferred(); waits.push(wait); return wait.promise; };
  await started(h, state({ bgmAssetId: undefined, ambientAssetId: undefined }));
  const first = h.adapter.preload("asset.audio.obsolete"); await flush();
  await h.adapter.reconcile(state({ sessionId: "session-2", bgmAssetId: undefined, ambientAssetId: undefined }));
  waits[0].resolve(pcm()); assert.equal((await first).error.code, "AUDIO_CANCELLED");
  assert.equal(h.adapter.inspect().decodedBytes, 0);
  const last = h.adapter.preload("asset.audio.disposed"); await flush(); await h.adapter.dispose();
  waits[1].resolve(pcm()); assert.equal((await last).error.code, "AUDIO_CANCELLED");
  assert.equal(h.adapter.inspect().decodedBytes, 0); assert.equal(h.adapter.inspect().reservedBytes, 0);
  assert.equal(h.context.sources.length, 0);
});

test("TC-S3-AUDIO-001 partial graph construction is released and explicit activation can retry", async () => {
  const broken = new FakeContext(), healthy = new FakeContext();
  const createGain = broken.createGain.bind(broken);
  broken.createGain = () => { if (broken.gains.length === 2) throw Error("gain unavailable"); return createGain(); };
  let attempt = 0;
  const h = harness({ createContext: () => ++attempt === 1 ? broken : healthy });
  h.adapter.reconcile(state({ ambientAssetId: undefined }));
  assert.equal((await h.adapter.unlock()).status, "unavailable");
  assert.ok(broken.gains.every((gain) => gain.disconnected)); assert.equal(broken.closes, 1);
  assert.equal(h.adapter.inspect().contextState, "uninitialized");
  assert.equal((await h.adapter.unlock()).status, "ready");
  assert.equal(healthy.sources.length, 1); await h.adapter.dispose();
  assert.equal(healthy.closes, 1);
});

test("TC-S3-PERF-001 source 44.1kHz PCM reserves host 48kHz size before either concurrent decode", async () => {
  const waits = [], h = harness({ maxDecodedBytes: 3840, loadAudioBytes: async () => bytes(1764) });
  h.context.sampleRate = 48000;
  h.context.decode = () => { const wait = deferred(); waits.push(wait); return wait.promise; };
  h.adapter.reconcile(state()); const playing = h.adapter.unlock(); await flush();
  assert.equal(waits.length, 2);
  assert.equal(h.adapter.inspect().reservedBytes, 3840, "two 441-frame sources each become 480 host frames");
  assert.equal(h.adapter.inspect().decodedBytes, 0);
  waits[0].resolve(pcm(480)); await flush();
  assert.equal(h.adapter.inspect().reservedBytes, 1920); assert.equal(h.adapter.inspect().decodedBytes, 1920);
  waits[1].resolve(pcm(480)); assert.equal((await playing).status, "ready");
  assert.equal(h.adapter.inspect().decodedBytes, 3840); assert.equal(h.adapter.inspect().reservedBytes, 0);
  assert.equal((await h.adapter.preload("asset.audio.extra")).error.code, "AUDIO_BUDGET");
  assert.equal(h.context.decodes, 2); await h.adapter.dispose();
});

test("TC-S3-PERF-001 host-rate reservation declines overflow before decode and rounds partial frames up", async () => {
  const small = harness({ maxDecodedBytes: 1800, loadAudioBytes: async () => bytes(1764) });
  small.context.sampleRate = 48000;
  small.adapter.reconcile(state({ ambientAssetId: undefined }));
  assert.equal((await small.adapter.unlock()).code, "AUDIO_BUDGET");
  assert.equal(small.context.decodes, 0); assert.equal(small.adapter.inspect().reservedBytes, 0); await small.adapter.dispose();
  const wait = deferred(), rounded = harness({ maxDecodedBytes: 436 });
  rounded.context.sampleRate = 48000; rounded.context.decode = () => wait.promise;
  rounded.adapter.reconcile(state({ ambientAssetId: undefined })); const playing = rounded.adapter.unlock(); await flush();
  assert.equal(rounded.adapter.inspect().reservedBytes, 436, "100 * 48000 / 44100 needs a 109-frame bound");
  wait.resolve(pcm(109)); assert.equal((await playing).status, "ready");
  assert.equal(rounded.adapter.inspect().decodedBytes, 436); await rounded.adapter.dispose();
});

test("TC-S3-PERF-001 missing PCM rate metadata reserves full capacity and rejects larger-than-reserved outputs", async () => {
  const wait = deferred(), h = harness({ maxDecodedBytes: 1000, loadAudioBytes: async () => ({ bytes: new ArrayBuffer(8), decodedBytes: 400 }) });
  h.context.sampleRate = 48000; h.context.decode = () => wait.promise;
  h.adapter.reconcile(state({ ambientAssetId: undefined })); const playing = h.adapter.unlock(); await flush();
  assert.equal(h.adapter.inspect().reservedBytes, 1000);
  wait.resolve(pcm(109)); assert.equal((await playing).status, "ready");
  assert.equal(h.adapter.inspect().decodedBytes, 436); await h.adapter.dispose();
  const inconsistent = harness({ maxDecodedBytes: 1200 }); inconsistent.context.decode = async () => pcm(200);
  inconsistent.adapter.reconcile(state({ ambientAssetId: undefined }));
  assert.equal((await inconsistent.adapter.unlock()).code, "AUDIO_BUDGET");
  assert.equal(inconsistent.adapter.inspect().decodedBytes, 0); assert.equal(inconsistent.adapter.inspect().reservedBytes, 0);
  await inconsistent.adapter.dispose();
});
