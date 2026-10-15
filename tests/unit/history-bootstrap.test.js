import test from "node:test";
import assert from "node:assert/strict";
import { createGameApplication } from "../../src/bootstrap/index.js";
import { createDomRenderer } from "../../src/ui/renderers/dom/dom-renderer.js";
import { createSilentAudioAdapter } from "../../src/ui/audio/silent-audio-adapter.js";
import { MemoryStorage, FakeDocument, findByAttribute as find } from "../helpers/application-harness.js";
import { LOCAL_STORAGE_KEYS as KEYS } from "../../src/data/persistence/local-storage-adapter.js";
import { content, testReferenceIds, walk, envelope, AT, SESSION_ID } from "../helpers/act1-session.js";

const writes = memory => memory.calls.filter(c => c.method !== "getItem");
function harness(snapshot = null, overrides = {}) {
  const memory = overrides.rawStorage ?? new MemoryStorage(snapshot ? { [KEYS.canonical]: JSON.stringify(envelope(snapshot)) } : {});
  const document = overrides.document ?? new FakeDocument(), root = overrides.root ?? document.createElement("div");
  const app = createGameApplication({ root, document, rawStorage: memory, content, testReferenceIds, clock: () => AT, sessionIdFactory: () => SESSION_ID, ...overrides });
  return { app, root, document, memory };
}
const choose = (h, choiceId) => h.app.dispatch({ type: "SELECT_CHOICE", choiceId });
async function click(h, attr, value) { find(h.root, attr, value).dispatchEvent({ type: "click" }); return h.app.whenIdle(); }
async function start(h) { assert.equal((await h.app.boot()).ok, true); assert.equal((await choose(h, "application.new-game")).ok, true); }
test("FR-ENG-009 TC-S4-LOG-001 Title empty, accepted New Game first passage, no render/settings duplicates", async () => {
  const h = harness(); await h.app.boot(); assert.equal(h.app.getSessionHistory(), null);
  await choose(h, "application.history"); assert.match(find(h.root, "data-jk-role", "history-empty").textContent, /หน้ากระดาษ/);
  await choose(h, "application.close-history"); assert.equal(writes(h.memory).length, 0);
  await choose(h, "application.new-game"); const first = h.app.getSessionHistory();
  assert.equal(first.dialogues.length, 1); assert.equal(first.actions.length, 0); assert.equal(first.continued, false);
  await choose(h, "application.settings"); await h.app.dispatch({ type: "SETTINGS_CHANGED", setting: "fontScale", value: 1.5 }); await choose(h, "application.close-settings");
  assert.equal(h.app.getSessionHistory(), first); await choose(h, "application.advance"); assert.equal(h.app.getSessionHistory().dialogues.length, 2); h.app.dispose();
});
test("TC-S4-LOG-001 confirmation/cancel/rejected/stale inputs absent; commit before response", async () => {
  const source = walk().find(s => s.currentNodeId === "node.act1.keepsake");
  const h = harness(source); await h.app.boot(); await choose(h, "application.resume");
  const prior = h.app.getSessionHistory(), choice = "choice.act1.keep-fragment";
  await choose(h, choice); assert.equal(h.app.getStatus().mode, "choice-confirmation"); assert.equal(h.app.getSessionHistory(), prior);
  assert.equal((await choose(h, "application.history")).ok, false); await choose(h, "application.cancel-choice"); assert.equal(h.app.getSessionHistory(), prior);
  assert.equal((await h.app.dispatch({ type: "SELECT_CHOICE", choiceId: choice, viewRevision: 0 })).ok, false);
  await choose(h, choice); assert.equal((await choose(h, "application.confirm-choice")).ok, true);
  const history = h.app.getSessionHistory(), committed = history.actions.at(-1), response = history.dialogues.find(e => e.part === "feedback");
  assert.equal(history.actions.length, 1); assert.equal(committed.sourceId, choice); assert.equal(committed.nodeId, source.currentNodeId);
  assert.ok(committed.sequence < response.sequence); assert.equal(response.nodeId, source.currentNodeId); h.app.dispose();
});
test("TC-S4-LOG-001 repeated nursery visits keep separate occurrences and return label", async () => {
  const source = walk().find(s => s.currentNodeId === "node.act1.nursery");
  const h = harness(source); await h.app.boot(); await choose(h, "application.resume");
  const original = h.app.getSessionHistory().dialogues[0];
  await choose(h, "interaction.act1.observe-mother");
  while (h.app.getSnapshot().currentNodeId !== "node.act1.nursery") { assert.equal((await choose(h, "application.advance")).ok, true); }
  const returns = h.app.getSessionHistory().dialogues.filter(e => e.sourceId === original.sourceId);
  assert.equal(returns.length, 2); assert.notEqual(returns[0].entryId, returns[1].entryId); assert.equal(returns[1].returning, true);
  assert.equal(h.app.getSessionHistory().actions[0].kind, "interaction"); h.app.dispose();
});
test("TC-S4-LOG-002 open/close is exact snapshot/save/history/audio invariance and blocks background writes", async () => {
  const calls = [], silent = createSilentAudioAdapter(), audio = { ...silent,
    reconcile(value) { calls.push(["reconcile", value]); return silent.reconcile(value); },
    unlock() { calls.push(["unlock"]); return silent.unlock(); }, playEffect(value) { calls.push(["effect", value]); return silent.playEffect(value); } };
  const h = harness(null, { audio, mediaEnabled: false }); await start(h);
  const before = { snapshot: h.app.getSnapshot(), history: h.app.getSessionHistory(), bytes: [...h.memory.entries], writes: writes(h.memory).length, audio: calls.length };
  await click(h, "data-choice-id", "application.history");
  for (const intent of [{ type: "SETTINGS_CHANGED", setting: "fontScale", value: 2 }, { type: "SELECT_CHOICE", choiceId: "application.advance" }, { type: "SELECT_CHOICE", choiceId: "application.settings" }, { type: "POUCH_ACTION", confirmed: true }]) {
    assert.equal((await h.app.dispatch(intent)).ok, false);
  }
  await choose(h, "application.close-history");
  assert.equal(h.app.getSnapshot(), before.snapshot); assert.equal(h.app.getSessionHistory(), before.history); assert.deepEqual([...h.memory.entries], before.bytes);
  assert.equal(writes(h.memory).length, before.writes); assert.equal(calls.length, before.audio);
  assert.equal(h.document.activeElement.getAttribute("data-choice-id"), "application.history"); h.app.dispose();
});
test("TC-S4-LOG-001 committed Pouch release logged once; inspection/cancel/duplicate not recorded", async () => {
  const h = harness(walk().at(-1)); await h.app.boot(); await choose(h, "application.resume"); const prior = h.app.getSessionHistory();
  await choose(h, "application.pouch"); await click(h, "data-item-id", "item_leaf"); await click(h, "data-pouch-action", "release"); await click(h, "data-jk-role", "pouch-cancel");
  assert.equal(h.app.getSessionHistory(), prior); await click(h, "data-pouch-action", "release");
  assert.equal((await click(h, "data-jk-role", "pouch-confirm")).ok, true);
  const after = h.app.getSessionHistory(); assert.equal(after.actions.length, 1); assert.equal(after.actions[0].kind, "keepsake-action"); assert.match(after.actions[0].text, /ส่งต่อ เศษใบบัว/);
  assert.equal(after.dialogues, prior.dialogues); assert.equal((await h.app.dispatch({ type: "POUCH_ACTION", action: "release", confirmed: true })).ok, false);
  assert.equal(h.app.getSessionHistory(), after); h.app.dispose();
});
test("TC-S4-LOG-001 same-page Title/Resume preserves log; reload starts fresh without saved transcript", async () => {
  const h = harness(walk().at(-1)); await h.app.boot(); await choose(h, "application.resume"); const history = h.app.getSessionHistory();
  assert.equal(history.dialogues.length, 1); assert.equal(history.actions.length, 0); assert.equal(history.continued, true);
  await choose(h, "application.finish"); await choose(h, "application.new-game"); await choose(h, "application.cancel-replace");
  assert.equal(h.app.getSessionHistory(), history); await choose(h, "application.resume"); assert.equal(h.app.getSessionHistory(), history);
  const memory = h.memory; h.app.dispose(); const next = harness(null, { rawStorage: memory }); await next.app.boot(); await choose(next, "application.resume");
  assert.equal(next.app.getSessionHistory().dialogues.length, 1); assert.equal(writes(memory).length, 0);
  await choose(next, "application.history"); assert.match(next.app.getViewModel().history.note, /ครั้งก่อน/); next.app.dispose();
});
test("TC-S4-LOG-001 confirmed New Game clears prior choices and occurrences", async () => {
  const h = harness(walk().at(-1)); await h.app.boot(); await choose(h, "application.resume"); await choose(h, "application.finish");
  await choose(h, "application.new-game"); await choose(h, "application.confirm-replace"); const history = h.app.getSessionHistory();
  assert.equal(history.continued, false); assert.equal(history.actions.length, 0); assert.equal(history.dialogues.length, 1); assert.equal(history.dialogues[0].sourceId, "dialogue.act1.first-light");
  const raw = JSON.parse(h.memory.raw(KEYS.canonical)); assert.equal(raw.saveFormatVersion, 2); assert.equal(raw.payload.history.length, 0);
  for (const value of [raw, raw.payload, raw.payload.checkpoint]) assert.equal(Object.hasOwn(value, "sessionHistory"), false);
  h.app.dispose(); assert.equal(h.app.getSessionHistory(), null);
});
test("TC-S4-LOG-001 failed render cannot log unseen response; committed action retained; retry acknowledges once", async () => {
  const document = new FakeDocument(), root = document.createElement("div"), base = createDomRenderer({ document, root }); let fail = false;
  const renderer = { ...base, render(view) { return fail ? { ok: false, error: { code: "RENDER_FAILURE" } } : base.render(view); } };
  const h = harness(walk().find(s => s.currentNodeId === "node.act1.keepsake"), { document, root, renderer });
  await h.app.boot(); await choose(h, "application.resume"); await choose(h, "choice.act1.keep-fragment"); const prior = h.app.getSessionHistory();
  fail = true; assert.equal((await choose(h, "application.confirm-choice")).ok, false);
  assert.equal(h.app.getSessionHistory().actions.length, 1); assert.equal(h.app.getSessionHistory().dialogues, prior.dialogues);
  fail = false; assert.equal((await h.app.dispatch({ type: "RETRY_RENDER" })).ok, true);
  const after = h.app.getSessionHistory(); assert.ok(after.dialogues.length > prior.dialogues.length);
  await h.app.dispatch({ type: "RETRY_RENDER" }); assert.equal(h.app.getSessionHistory(), after); h.app.dispose();
});
test("TC-S4-LOG-001 host without presentation acknowledgements never guesses displayed dialogue", async () => {
  const success = () => ({ ok: true }), renderer = { render: success, setBusy: success, announce: success, applyFocusDirective: success, showFatalShell: success };
  const h = harness(null, { renderer }); await start(h); assert.equal(h.app.getSessionHistory().dialogues.length, 0); h.app.dispose();
});
