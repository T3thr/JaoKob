import test from "node:test";
import assert from "node:assert/strict";
import { setImmediate as nextTurn } from "node:timers/promises";
import { createAssetPreloader, selectPresentationAssets } from "../../src/data/assets/asset-preloader.js";

const ref = (id) => ({ assetId: `asset.${id}`, contentVersion: "2.1.0" });
test("TC-S3-ASSET-001: prioritize current, cap concurrency at two and deduplicate updates", async () => {
  const started = [], finish = [], signals = [];
  let released = 0;
  const preloader = createAssetPreloader({ concurrency: 99, load: (reference, options) => {
    started.push(reference.assetId); signals.push(options.signal);
    return new Promise((resolve) => finish.push(() => resolve({ release() { released += 1; } })));
  } });
  preloader.update({ current: [ref("a"), ref("b")], next: [ref("a"), ref("c"), ref("d")] });
  await nextTurn();
  assert.deepEqual(new Set(started), new Set(["asset.a", "asset.b"]));
  assert.equal(preloader.stats().active, 2);
  preloader.update({ current: [ref("a"), ref("b")], next: [ref("c")] });
  await nextTurn();
  assert.equal(started.length, 2);
  finish.shift()(); await nextTurn();
  assert.equal(started[2], "asset.c");
  finish.shift()(); finish.shift()(); await nextTurn();
  assert.equal(released, 3);
  preloader.update({ current: [ref("a")], next: [ref("c")] });
  await nextTurn();
  assert.equal(started.length, 3);
  preloader.dispose();
});
test("TC-S3-ASSET-001: obsolete generations abort jobs, discard queue and release late leases", async () => {
  const calls = [], finish = [];
  let released = 0;
  const preloader = createAssetPreloader({ load: (reference, { signal }) => {
    calls.push({ reference, signal });
    return new Promise((resolve) => finish.push(() => resolve({ release() { released += 1; } })));
  } });
  preloader.update({ current: [ref("a")], next: [ref("b"), ref("c")] });
  await nextTurn();
  preloader.update({ current: [ref("d")] });
  assert.ok(calls.every((call) => call.signal.aborted));
  assert.equal(preloader.stats().active, 2);
  finish.shift()(); finish.shift()(); await nextTurn();
  assert.deepEqual(calls.map((call) => call.reference.assetId), ["asset.a", "asset.b", "asset.d"]);
  assert.equal(released, 2);
  finish.shift()(); await nextTurn(); preloader.dispose();
});
test("TC-S3-ASSET-001: failures do not retry automatically and explicit retry remains bounded", async () => {
  let calls = 0;
  const preloader = createAssetPreloader({ load: async () => { calls += 1; return null; } });
  preloader.update({ current: [ref("a")] }); await nextTurn();
  assert.equal(preloader.stats().completed, 0); assert.equal(preloader.stats().failed, 1);
  preloader.update({ current: [ref("a")] }); await nextTurn(); assert.equal(calls, 1);
  preloader.retry(); await nextTurn(); assert.equal(calls, 2);
  preloader.dispose();
});
test("TC-S3-ASSET-001: noncooperating timeout cannot exceed physical concurrency", async () => {
  const finishes = [], signals = [];
  const preloader = createAssetPreloader({ timeoutMs: 5, load: (_, { signal }) => {
    signals.push(signal); return new Promise((resolve) => finishes.push(resolve));
  } });
  preloader.update({ current: [ref("a"), ref("b"), ref("c")] });
  await new Promise((resolve) => setTimeout(resolve, 12));
  assert.ok(signals.every((signal) => signal.aborted));
  assert.equal(preloader.stats().active, 2); assert.equal(signals.length, 2);
  preloader.dispose(); for (const finish of finishes) finish(null); await nextTurn();
  assert.equal(preloader.stats().active, 0);
});
test("TC-S3-ASSET-001: data saving drops speculative requests and queue stays bounded", async () => {
  const refs = Array.from({ length: 100 }, (_, i) => ref(i));
  const preloader = createAssetPreloader({ load: async () => ({ ok: true }) });
  preloader.update({ current: refs, next: refs });
  assert.ok(preloader.stats().queued + preloader.stats().active <= 16);
  await nextTurn();
  preloader.update({ current: [ref("current")], next: refs, dataSaving: true });
  assert.equal(preloader.stats().queued, 0); assert.equal(preloader.stats().active, 1);
  await nextTurn(); preloader.dispose();
});
test("TC-S3-ASSET-001: one-hop selection only uses accepted eligible actions and never traverses their targets", () => {
  const environment = (id) => ({ backgroundAssetId: `asset.${id}`, bgmAssetId: "asset.music", ambientAssetId: "asset.water" });
  const loaded = { catalog: { version: "2.1.0" }, indexes: {
    assets: { "asset.music": { type: "audio" }, "asset.water": { type: "audio" } }, nodes: {
      current: { id: "current", type: "decision", environment: environment("current"), choices: [{ id: "yes", nextNodeId: "next" }, { id: "no", nextNodeId: "locked" }] },
      next: { id: "next", type: "cutscene", environment: environment("next"), nextNodeId: "beyond" },
      locked: { id: "locked", environment: environment("locked") }, beyond: { id: "beyond", environment: environment("beyond") },
    },
  } };
  const visual = { nodeId: "current", imageRequests: [ref("current"), ref("sprite")] };
  const facts = { nodeId: "current", actions: [{ id: "yes", eligible: true }, { id: "no", eligible: false }] };
  const before = JSON.stringify({ loaded, visual, facts });
  const result = selectPresentationAssets({ loaded, visual, facts });
  assert.deepEqual(result.current.map((item) => item.assetId), ["asset.current", "asset.sprite"]);
  assert.deepEqual(result.next.map((item) => item.assetId), ["asset.next"]);
  const sounding = selectPresentationAssets({ loaded, visual, facts, soundRequested: true });
  assert.deepEqual(sounding.current.map((item) => item.assetId), ["asset.current", "asset.sprite", "asset.music", "asset.water"]);
  assert.equal(selectPresentationAssets({ loaded, visual, facts, dataSaving: true }).next.length, 0);
  assert.equal(selectPresentationAssets({ loaded, visual, facts: { ...facts, nodeId: "stale" } }).next.length, 0);
  assert.equal(JSON.stringify({ loaded, visual, facts }), before);
});
