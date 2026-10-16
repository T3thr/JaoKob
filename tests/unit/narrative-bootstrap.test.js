import test from "node:test";
import assert from "node:assert/strict";
import { createGameApplication } from "../../src/bootstrap/index.js";
import { createLocalStorageAdapter, LOCAL_STORAGE_KEYS as KEYS } from "../../src/data/persistence/local-storage-adapter.js";
import { MemoryStorage, FakeDocument } from "../helpers/application-harness.js";
import { candidate, candidateTestIds, travel, FULL_PLAN, save2, story } from "../helpers/narrative-session.js";
import { walk as legacyWalk, envelope as legacyEnvelope } from "../helpers/act1-session.js";
import { migrateSave1To2 } from "../../src/data/persistence/save-1-to-2.js";

function harness(snapshot) {
  const document = new FakeDocument(), root = document.createElement("div");
  const raw = JSON.stringify(save2(snapshot)), memory = new MemoryStorage({ [KEYS.canonical]: raw });
  const app = createGameApplication({ document, root, content: candidate, testReferenceIds: candidateTestIds,
    clock: () => "2026-10-16T03:00:00+07:00", mediaEnabled: false, storage: createLocalStorageAdapter(memory) });
  return { app, memory, raw };
}
const choose = async (app, choiceId) => {
  const result = await app.dispatch({ type: "SELECT_CHOICE", choiceId });
  assert.equal(result.ok, true, JSON.stringify(result.error));
};

test("TC-S4-SAVE-001 candidate exact saved secret page restores without any write", async () => {
  for (const key of ["dew", "lotus", "rain"]) {
    const snapshot = travel({ dew: "leave", lotus: "leave", rain: "leave" }).snapshots.find(s => s.currentNodeId === `node.act1.secret-${key}` && story.facts(s).cursor === 1);
    const { app, memory, raw } = harness(snapshot);
    assert.equal((await app.boot()).ok, true); await choose(app, "application.resume");
    assert.deepEqual(app.getSnapshot(), snapshot); assert.equal(memory.raw(KEYS.canonical), raw);
    assert.equal(memory.calls.filter(c => c.method !== "getItem").length, 0); app.dispose();
  }
});

test("TC-S4-GRAPH-001 actual candidate confirmation cancel retains full pouch; accepted replacement saves once", async () => {
  const snapshot = travel(FULL_PLAN, { stop: s => s.currentNodeId === "node.act1.river-offer" }).snapshot;
  const { app, memory, raw } = harness(snapshot);
  await app.boot(); await choose(app, "application.resume");
  await choose(app, "choice.act1.exchange-leaf"); assert.equal(app.getStatus().mode, "choice-confirmation");
  assert.deepEqual(app.getSnapshot(), snapshot); assert.equal(memory.raw(KEYS.canonical), raw);
  await choose(app, "application.cancel-choice"); assert.deepEqual(app.getSnapshot(), snapshot);
  await choose(app, "choice.act1.exchange-leaf"); await choose(app, "application.confirm-choice");
  const saved = JSON.parse(memory.raw(KEYS.canonical));
  assert.equal(saved.contentVersion, "3.0.0"); assert.equal(saved.saveFormatVersion, 2);
  assert.equal(saved.revision, snapshot.revision + 1); assert.equal(saved.payload.pouch.held.length, 4);
  assert.ok(saved.payload.pouch.released.includes("item_leaf")); assert.ok(saved.payload.pouch.held.includes("item_river_shell"));
  assert.deepEqual(saved.payload.metrics, snapshot.metrics);
  assert.equal(memory.raw(KEYS.backup), raw); app.dispose();
});

test("TC-S4-SAVE-001 candidate protects old content instead of guessing a cursor or writing an empty pouch", async () => {
  const snapshot = travel().snapshot, { app, memory } = harness(snapshot);
  const old = migrateSave1To2(legacyEnvelope(legacyWalk().at(-1))).value.envelope;
  memory.setItem(KEYS.canonical, JSON.stringify(old)); const raw = memory.raw(KEYS.canonical); memory.calls.length = 0;
  await app.boot(); assert.equal(app.getStatus().hasResumeCandidate, false);
  assert.equal(memory.raw(KEYS.canonical), raw); assert.equal(memory.calls.filter(c => c.method !== "getItem").length, 0); app.dispose();
});
