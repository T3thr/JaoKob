import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createMediaComposition } from "../../src/bootstrap/media-composition.js";
import { loaded, engine, start } from "../helpers/act1-session.js";
import { projectContentPresentation } from "../../src/data/content/content-presentation.js";
const registry = JSON.parse(readFileSync(new URL("../../assets/provenance/benchmark-assets.json", import.meta.url)));
const desired = () => { const snapshot = start(), facts = engine.facts(snapshot); return { ...projectContentPresentation({ loaded, snapshot, facts, settings: loaded.catalog.defaults.settings, mode: "game" }), facts }; };
const turn = () => new Promise((resolve) => setTimeout(resolve, 0));
function harness(extra = {}) {
  const calls = [], listeners = new Map();
  const document = { visibilityState: "visible", addEventListener: (name, callback) => listeners.set(name, callback), removeEventListener: (name) => listeners.delete(name) };
  const audio = Object.fromEntries(["unlock", "reconcile", "playEffect", "suspend", "dispose"].map((method) => [method, (...args) => { calls.push({ method, args }); return { status: "ready" }; }]));
  const composition = createMediaComposition({ document, audio, assetRegistry: registry, applicationBaseUrl: "https://game.test/JaoKob/", imageCache: { acquire: async () => ({ url: "blob:test", release() {} }), stats: () => ({}), dispose() {} }, ...extra });
  return { composition, calls, document, listeners };
}
test("TC-S3-AUDIO-001 visibility suspends and forbids hidden activation/reconcile/effects; visible resumes latest desire", async () => {
  const { composition: media, calls, document, listeners } = harness();
  await media.initialize(loaded); const next = desired(); media.accept(next); media.activate(); await turn();
  document.visibilityState = "hidden"; listeners.get("visibilitychange")();
  assert.equal(calls.at(-1).method, "suspend"); const count = calls.length;
  media.activate(); media.accept(next); media.effect("audio.act1.click", "once"); assert.equal(calls.length, count);
  assert.equal(media.inspect().queue.queued, 0);
  document.visibilityState = "visible"; listeners.get("visibilitychange")();
  assert.equal(calls.at(-1).method, "reconcile"); assert.deepEqual(calls.at(-1).args[0], next.audio);
  media.dispose(); assert.equal(listeners.size, 0); assert.equal(calls.at(-1).method, "dispose");
});
test("TC-S3-ASSET-001 malformed registry fails silently and explicit retry fetches corrected metadata", async () => {
  let calls = 0;
  const { composition: media } = harness({ assetRegistry: undefined, imageCache: undefined, fetch: async () => {
    calls++; return new Response(JSON.stringify(calls === 1 ? { registryVersion: 999 } : registry), { headers: { "content-type": "application/json; charset=utf-8" } });
  } });
  await media.initialize(loaded); assert.equal(media.status().mediaStatus, "unavailable");
  media.retry(); await media.whenReady(); assert.equal(media.status().mediaStatus, "ready"); assert.equal(calls, 2); media.dispose();
});
test("TC-S3-ASSET-001 oversized registry stream is cancelled before full consumption", async () => {
  let cancelled = false, pulls = 0;
  const { composition: media } = harness({ assetRegistry: undefined, imageCache: undefined, fetch: async () => new Response(new ReadableStream({
    pull(controller) { pulls++; controller.enqueue(new Uint8Array(64001)); }, cancel() { cancelled = true; },
  }), { headers: { "content-type": "application/json" } }) });
  await media.initialize(loaded); assert.equal(media.status().mediaStatus, "unavailable"); assert.equal(cancelled, true); assert.ok(pulls <= 3); media.dispose();
});
test("TC-S3-ASSET-001 wrong MIME registry is rejected without consuming its body", async () => {
  let bodyAccessed = false;
  const { composition: media } = harness({ assetRegistry: undefined, imageCache: undefined, fetch: async () => ({ ok: true, headers: new Headers({ "content-type": "text/html" }), get body() { bodyAccessed = true; throw new Error("untrusted body"); } }) });
  await media.initialize(loaded); assert.equal(media.status().mediaStatus, "unavailable"); assert.equal(bodyAccessed, false); media.dispose();
});
test("TC-S3-AUDIO-001 all zero channels suppress speculative audio and user gesture does not alter desires", async () => {
  const { composition: media, calls } = harness(); await media.initialize(loaded);
  const next = desired(); next.audio = { ...next.audio, volumes: { master: 1, music: 0, ambience: 0, effects: 0 } };
  media.accept(next); media.activate(); await turn();
  assert.deepEqual(calls.find((call) => call.method === "reconcile").args[0].volumes, next.audio.volumes);
  assert.ok(media.inspect().queue.completed <= 2); media.dispose();
});
