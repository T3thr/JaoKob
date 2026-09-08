import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createGameApplication } from "../../src/bootstrap/index.js";
import { createLocalStorageAdapter, createLocalSettingsAdapter, LOCAL_STORAGE_KEYS as KEYS } from "../../src/data/persistence/local-storage-adapter.js";
import { createContentVersionMigration } from "../../src/data/migrations/content-2-0-0-to-2-1-0.js";
import { MemoryStorage, FakeDocument } from "../helpers/application-harness.js";
import { content, testReferenceIds, AT, SESSION_ID, ROUTES, walk, envelope } from "../helpers/act1-session.js";
const source = JSON.parse(readFileSync(new URL("../../src/data/content/compatibility/act-01-2.0.0.json", import.meta.url)));
const legacy = (snapshot, settings) => ({ ...envelope(snapshot, settings), contentVersion: "2.0.0" });
const writes = (memory) => memory.calls.filter((call) => call.method !== "getItem");
function harness(memory = new MemoryStorage(), options = {}) {
  const document = new FakeDocument(), root = document.createElement("div");
  const app = createGameApplication({ document, root, rawStorage: memory, clock: () => AT, sessionIdFactory: () => SESSION_ID,
    content, testReferenceIds, migrationSourcePackage: source, ...options });
  return { app, root, document, memory };
}
async function select(app, choiceId) { const result = await app.dispatch({ type: "SELECT_CHOICE", choiceId }); assert.equal(result.ok, true, JSON.stringify(result)); }

for (const route of ROUTES) test(`TC-S3-SAVE-001 bootstrap migration retains every cursor ${Object.values(route).join("/")}`, async () => {
  const settings = { ...content.gameDefaults.settings, masterVolume: 0, musicVolume: .2, fontScale: 2, reducedIntensityAudio: true };
  for (const snapshot of walk(route, ["lily", "roots", "shadows", "mother"])) {
    const raw = JSON.stringify(legacy(snapshot, settings)), { app, memory } = harness(new MemoryStorage({ [KEYS.canonical]: raw }));
    assert.equal((await app.boot()).ok, true);
    await select(app, "application.resume");
    assert.deepEqual(app.getSnapshot(), snapshot);
    assert.deepEqual(app.getViewModel().settings, settings);
    assert.equal(memory.raw(KEYS.canonical), raw); assert.equal(writes(memory).length, 0);
    if (app.getViewModel().choices.some((c) => c.id === "application.advance")) {
      await select(app, "application.advance");
      const saved = JSON.parse(memory.raw(KEYS.canonical));
      assert.equal(saved.contentVersion, "2.1.0"); assert.equal(saved.revision, snapshot.revision + 1);
      assert.equal(memory.raw(KEYS.backup), raw); assert.deepEqual(saved.settings, settings);
    }
    app.dispose();
  }
});

for (const slot of ["canonical", "staging", "backup"]) test(`TC-S3-SAVE-001 migration protects incompatible ${slot}`, async () => {
  const good = JSON.stringify(legacy(walk()[3]));
  const bad = JSON.stringify({ ...legacy(walk()[4]), contentVersion: "999.0.0" });
  const memory = new MemoryStorage({ [KEYS.backup]: good, [KEYS[slot]]: bad });
  const before = [...memory.entries], { app } = harness(memory);
  await app.boot();
  if (slot !== "backup") { await select(app, "application.resume"); await select(app, "application.advance"); }
  assert.equal(app.getStatus().persistenceDegraded, true);
  assert.deepEqual([...memory.entries], before); assert.equal(writes(memory).length, 0); app.dispose();
});

test("TC-S3-SAVE-001 failed source proof cannot authorize old saves", async () => {
  const changed = structuredClone(source); changed.dialogues.dialogues[0].text.th += " เปลี่ยน";
  const raw = JSON.stringify(legacy(walk()[1])), { app, memory } = harness(new MemoryStorage({ [KEYS.canonical]: raw }), { migrationSourcePackage: changed });
  await app.boot(); assert.equal(app.getStatus().hasResumeCandidate, false);
  assert.equal(memory.raw(KEYS.canonical), raw); assert.equal(writes(memory).length, 0); app.dispose();
});

for (const phase of ["stage", "commit"]) for (const slot of ["canonical", "staging", "backup"]) test(`TC-S3-SAVE-001 ${phase} guards recheck late ${slot} raw changes`, () => {
  const old = legacy(walk()[1]), next = envelope(walk()[3]);
  const memory = new MemoryStorage({ [KEYS.canonical]: JSON.stringify(old) });
  const policy = createContentVersionMigration({ sourcePackage: source, targetPackage: content, testReferenceIds }).value;
  let armed = false;
  const adapter = createLocalStorageAdapter({ storage: memory, canReplaceExistingEnvelope(candidate) {
    const accepted = policy.canReplaceExisting(candidate);
    if (armed && candidate.contentVersion === "2.0.0") { armed = false; memory.entries.set(KEYS[slot], "{late corruption"); }
    return accepted;
  } });
  if (phase === "commit") assert.equal(adapter.stage(next).ok, true);
  const count = writes(memory).length; armed = true;
  const result = phase === "stage" ? adapter.stage(next) : adapter.commit({ expectedRevision: next.revision });
  assert.equal(result.ok, false); assert.equal(memory.raw(KEYS[slot]), "{late corruption");
  assert.equal(writes(memory).length, count);
});

test("TC-S3-SETTINGS-001 Title preferences persist separately and survive Resume", async () => {
  const snapshot = walk()[2], raw = JSON.stringify(legacy(snapshot)), memory = new MemoryStorage({ [KEYS.canonical]: raw });
  let { app } = harness(memory); await app.boot(); await select(app, "application.settings");
  for (const [setting, value] of [["masterVolume", 0], ["musicVolume", .35], ["reducedIntensityAudio", true], ["fontScale", 2], ["highContrast", true]]) {
    assert.equal((await app.dispatch({ type: "SETTINGS_CHANGED", setting, value, viewRevision: app.getViewModel().viewRevision })).ok, true);
  }
  const settings = app.getViewModel().settings;
  assert.deepEqual(JSON.parse(memory.raw(KEYS.settings)), settings); assert.equal(memory.raw(KEYS.canonical), raw);
  app.dispose(); ({ app } = harness(memory)); await app.boot(); await select(app, "application.resume");
  assert.deepEqual(app.getSnapshot(), snapshot); assert.deepEqual(app.getViewModel().settings, settings);
  await select(app, "application.advance"); assert.deepEqual(JSON.parse(memory.raw(KEYS.canonical)).settings, settings); app.dispose();
});

for (const raw of ["{bad", JSON.stringify({ futureVersion: 9 }), "x".repeat(10001)]) test("TC-S3-SETTINGS-001 malformed settings are preserved and never replace save slots", () => {
  const memory = new MemoryStorage({ [KEYS.settings]: raw, [KEYS.canonical]: "original" }), adapter = createLocalSettingsAdapter(memory);
  assert.equal(adapter.load().ok, false); assert.equal(adapter.save(content.gameDefaults.settings).ok, false);
  assert.equal(memory.raw(KEYS.settings), raw); assert.equal(memory.raw(KEYS.canonical), "original"); assert.equal(writes(memory).length, 0);
});

test("TC-S3-SETTINGS-001 invalid, stale and out-of-settings intents never write", async () => {
  const { app, memory } = harness(); await app.boot();
  assert.equal((await app.dispatch({ type: "SETTINGS_CHANGED", setting: "masterVolume", value: 0 })).ok, false);
  await select(app, "application.settings");
  const revision = app.getViewModel().viewRevision;
  for (const [setting, value] of [["masterVolume", 3], ["musicVolume", "0.3"], ["fontScale", .2], ["locale", "en"], ["__proto__", {}]]) {
    assert.equal((await app.dispatch({ type: "SETTINGS_CHANGED", setting, value })).ok, false);
  }
  assert.equal((await app.dispatch({ type: "SETTINGS_CHANGED", setting: "masterVolume", value: 0, viewRevision: revision - 1 })).error.code, "REVISION_MISMATCH");
  assert.equal(writes(memory).length, 0); app.dispose();
});

test("TC-S3-AUDIO-001 trusted unlock runs synchronously before asynchronous story dispatch; failure stays playable", async () => {
  const calls = [], audio = Object.fromEntries(["unlock", "reconcile", "playEffect", "suspend", "dispose"].map((method) => [method, (...args) => {
    calls.push({ method, args }); if (method === "unlock") throw new Error("simulated optional adapter failure");
    return { status: "unavailable", code: "AUDIO_UNSUPPORTED" };
  }]));
  const { app, root } = harness(undefined, { audio, mediaEnabled: true, assetRegistry: { registryVersion: 1, contentVersion: "2.1.0", assets: [] } });
  await app.boot();
  root.dispatchEvent({ type: "pointerdown", isTrusted: false }); assert.equal(calls.filter((c) => c.method === "unlock").length, 0);
  root.dispatchEvent({ type: "pointerdown", isTrusted: true });
  assert.equal(calls.at(-1).method, "unlock", "no awaited boundary before unlock");
  await select(app, "application.new-game"); await select(app, "application.advance");
  assert.equal(app.getSnapshot().revision, 2); assert.equal(app.getStatus().fatal, false);
  const desires = calls.filter((c) => c.method === "reconcile").map((c) => c.args[0]);
  assert.equal(desires[0].sessionId, null); assert.equal(desires.at(-1).sessionId, SESSION_ID);
  assert.ok(desires.at(-1).bgmAssetId); app.dispose();
});
