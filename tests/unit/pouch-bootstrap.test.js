import test from "node:test";
import assert from "node:assert/strict";
import { createGameApplication } from "../../src/bootstrap/index.js";
import { MemoryStorage, FakeDocument, findByAttribute as find } from "../helpers/application-harness.js";
import { LOCAL_STORAGE_KEYS as KEYS } from "../../src/data/persistence/local-storage-adapter.js";
import { content, testReferenceIds, walk, envelope, AT, SESSION_ID } from "../helpers/act1-session.js";
import { act1PouchPolicy } from "../../src/data/content/act1-pouch-policy.js";
import { loaded } from "../helpers/act1-session.js";
const writes = memory => memory.calls.filter(c => c.method !== "getItem");
function harness(snapshot = walk().at(-1), overrides = {}) {
  const raw = JSON.stringify(envelope(snapshot)), memory = new MemoryStorage({ [KEYS.canonical]: raw });
  const document = new FakeDocument(), root = document.createElement("div");
  const app = createGameApplication({ root, document, rawStorage: memory, content, testReferenceIds, clock: () => AT, sessionIdFactory: () => SESSION_ID, ...overrides });
  return { app, root, document, memory, raw };
}
const choose = (h, choiceId) => h.app.dispatch({ type: "SELECT_CHOICE", choiceId });
async function open(h) { assert.equal((await h.app.boot()).ok, true); assert.equal((await choose(h, "application.resume")).ok, true); assert.equal((await click(h, "data-choice-id", "application.pouch")).ok, true); }
async function click(h, attribute, value) { find(h.root, attribute, value).dispatchEvent({ type: "click" }); return h.app.whenIdle(); }

test("TC-S4-STATE-001 open/inspect/close has no story/save/audio/history effects and restores opener", async () => {
  const h = harness(); await open(h); const snapshot = h.app.getSnapshot(), count = writes(h.memory).length;
  assert.equal(h.app.getViewModel().overlay, "pouch");
  await click(h, "data-item-id", "item_leaf");
  assert.equal(h.app.getSnapshot(), snapshot); assert.equal(writes(h.memory).length, count); assert.equal(h.memory.raw(KEYS.canonical), h.raw);
  assert.equal((await choose(h, "application.settings")).ok, false);
  await choose(h, "application.close-pouch"); assert.equal(h.app.getSnapshot(), snapshot);
  assert.equal(h.document.activeElement.getAttribute("data-choice-id"), "application.pouch");
  assert.equal(h.memory.raw(KEYS.canonical), h.raw); assert.equal(writes(h.memory).length, count); h.app.dispose();
});
test("TC-S4-POUCH-002 cancel retains leaf; confirmed release persists exactly once and reloads remembered", async () => {
  const h = harness(); await open(h); const before = h.app.getSnapshot();
  await click(h, "data-item-id", "item_leaf"); await click(h, "data-pouch-action", "release");
  await click(h, "data-jk-role", "pouch-cancel"); assert.equal(h.app.getSnapshot(), before); assert.equal(writes(h.memory).length, 0);
  await click(h, "data-pouch-action", "release"); assert.equal((await click(h, "data-jk-role", "pouch-confirm")).ok, true);
  const after = h.app.getSnapshot(); assert.deepEqual(after.pouch.held, []); assert.deepEqual(after.pouch.released, ["item_leaf"]); assert.deepEqual(after.pouch.remembered, ["item_leaf"]);
  assert.equal(after.revision, before.revision + 1); assert.deepEqual(after.metrics, before.metrics); assert.deepEqual(after.flags, before.flags); assert.deepEqual(after.history, before.history);
  assert.equal(h.memory.raw(KEYS.backup), h.raw); assert.equal(JSON.parse(h.memory.raw(KEYS.canonical)).saveFormatVersion, 2);
  await choose(h, "application.pouch"); await click(h, "data-memory-id", "item_leaf"); assert.match(h.root.textContent, /ส่งต่อแล้ว/);
  await choose(h, "application.close-pouch"); await choose(h, "application.finish"); await choose(h, "application.resume"); assert.deepEqual(h.app.getSnapshot(), after);
  h.app.dispose();
});
test("TC-S4-POUCH-001 forged/stale/unconfirmed actions never mutate or save", async () => {
  const h = harness(); await open(h); const before = h.app.getSnapshot(), view = h.app.getViewModel();
  const base = { type: "POUCH_ACTION", action: "release", itemId: "item_leaf", opportunityId: "opportunity.act1.rest.release", confirmed: true, expectedRevision: before.revision, viewRevision: view.viewRevision };
  for (const patch of [{ expectedRevision: before.revision - 1 }, { viewRevision: 0 }, { confirmed: false }, { opportunityId: "forged" }, { itemId: "item_unknown" }, { action: "use" }, { expectedRevision: undefined }]) {
    assert.equal((await h.app.dispatch({ ...base, ...patch })).ok, false); assert.equal(h.app.getSnapshot(), before); assert.equal(writes(h.memory).length, 0);
  }
  const first = h.app.dispatch(base), second = h.app.dispatch(base);
  assert.equal((await first).ok, true); assert.equal((await second).error.code, "APPLICATION_BUSY");
  assert.equal(h.app.getSnapshot().revision, before.revision + 1); h.app.dispose();
});
test("TC-S4-POUCH-001 early reading shows disabled release and Core rejects forged utility", async () => {
  const snapshot = walk().find(s => s.flags.find(f => f.id === "keepsake.lily_fragment").value && s.progress.viewedDialogueIds.at(-1) !== "dialogue.act1.rest-tomorrow");
  const h = harness(snapshot); await open(h); const before = h.app.getSnapshot();
  await click(h, "data-item-id", "item_leaf"); assert.equal(find(h.root, "data-pouch-action", "release").disabled, true);
  const result = await h.app.dispatch({ type: "POUCH_ACTION", action: "release", itemId: "item_leaf", opportunityId: "opportunity.act1.rest.release", confirmed: true, expectedRevision: before.revision, viewRevision: h.app.getViewModel().viewRevision });
  assert.equal(result.ok, false); assert.equal(h.app.getSnapshot(), before); assert.equal(h.memory.raw(KEYS.canonical), h.raw); h.app.dispose();
});
test("TC-S4-SAVE-002 quota during accepted release remains playable with visible memory-only notice", async () => {
  const h = harness(); await open(h); const before = h.app.getSnapshot();
  h.memory.setItem = () => { throw Object.assign(new Error("quota"), { name: "QuotaExceededError" }); };
  await click(h, "data-item-id", "item_leaf"); await click(h, "data-pouch-action", "release");
  assert.equal((await click(h, "data-jk-role", "pouch-confirm")).ok, true);
  assert.equal(h.app.getSnapshot().revision, before.revision + 1); assert.equal(h.app.getStatus().persistenceDegraded, true);
  assert.match(h.app.getViewModel().notice.text, /บันทึก|อุปกรณ์|หน่วยความจำ/); assert.equal(h.memory.raw(KEYS.canonical), h.raw); h.app.dispose();
});
test("TC-S4-CONTRACT-001 legacy leaf bridge is explicit and immutable; changed behavior has no inferred policy", () => {
  assert.equal(Object.isFrozen(loaded.catalog.pouchPolicy.opportunities[0]), true);
  assert.equal(act1PouchPolicy({ ...content, contentVersion: "3.0.0" }, loaded.indexes), null);
  const indexes = structuredClone(loaded.indexes); indexes.choices["choice.act1.keep-fragment"].effects = [];
  assert.equal(act1PouchPolicy(content, indexes), null);
});
