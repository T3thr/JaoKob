import test from "node:test";
import assert from "node:assert/strict";
import { createSessionHistory, reduceSessionHistory as reduce, SESSION_HISTORY_BUDGET } from "../../src/core/use-cases/session-history.js";

const create = () => createSessionHistory({ sessionId: "session.test", contentVersion: "2.1.0" });
const record = (text = "น้ำไหวเบา ๆ") => ({ nodeId: "node.test", sceneId: "node.test", sourceId: "dialogue.test", speakerId: "character.mother", locale: "th",
  text, sceneLabel: "ใต้ใบบัว", speakerLabel: "แม่กบ", voiceRole: "speech" });
const begin = (s, id, returning = false) => reduce(s, { type: "PRESENTATION_STARTED", presentationId: id, returning });
const say = (s, text = "น้ำไหวเบา ๆ", part = "scene") => reduce(s, { type: "DIALOGUE_PRESENTED", presentationId: s.presentationId, part, record: record(text) });
const act = (s, revision, kind = "choice") => reduce(s, { type: "ACTION_COMMITTED", revision, kind, record: { ...record(`ทางที่ ${revision}`), voiceRole: "player" } });

test("FR-ENG-009 TC-S4-LOG-001 independent FIFO retains exactly latest50 dialogue AND50 actions", () => {
  let state = create();
  for (let i = 1; i <= 60; i++) { state = act(state, i, ["choice", "interaction", "keepsake-action"][i % 3]); state = say(begin(state, i), `บทที่ ${i}`); }
  assert.equal(state.dialogues.length, 50); assert.equal(state.actions.length, 50);
  assert.deepEqual(state.dialogues.map(e => e.text), Array.from({ length: 50 }, (_, i) => `บทที่ ${i + 11}`));
  assert.deepEqual(state.actions.map(e => e.revision), Array.from({ length: 50 }, (_, i) => i + 11));
  const actions = state.actions;
  for (let i = 61; i <= 120; i++) state = say(begin(state, i), `บทที่ ${i}`);
  assert.equal(state.actions, actions); assert.equal(state.actions.length, 50); assert.equal(state.dialogues.length, 50);
  const dialogues = state.dialogues;
  for (let i = 61; i <= 120; i++) state = act(state, i);
  assert.equal(state.dialogues, dialogues); assert.equal(state.actions[0].revision, 71);
});
test("TC-S4-LOG-001 action precedes response and repeated IDs remain distinct occurrences", () => {
  let state = say(begin(create(), 1)); state = act(state, 4); state = say(begin(state, 2, true));
  assert.deepEqual([...state.actions, ...state.dialogues].sort((a, b) => a.sequence - b.sequence).map(e => e.kind), ["dialogue", "choice", "dialogue"]);
  assert.equal(state.dialogues[0].sourceId, state.dialogues[1].sourceId); assert.notEqual(state.dialogues[0].entryId, state.dialogues[1].entryId);
  assert.equal(state.dialogues[1].returning, true); assert.notEqual(state.dialogues[0].visit, state.dialogues[1].visit);
});
test("TC-S4-LOG-001 displayed pages extend one frozen prefix; no full unseen text or duplicate render", () => {
  const started = begin(create(), 1), first = say(started, "น้ำ"), later = say(first, "น้ำไหวเบา ๆ");
  assert.equal(first.dialogues[0].text, "น้ำ"); assert.equal(started.dialogues.length, 0);
  assert.equal(later.dialogues.length, 1); assert.equal(later.nextSequence, first.nextSequence); assert.equal(later.dialogues[0].entryId, first.dialogues[0].entryId);
  assert.equal(say(later), later); assert.equal(say(later, "น้ำ"), later); assert.equal(say(later, "ข้อความอื่น"), later);
  assert.equal(Object.isFrozen(later.dialogues[0]), true); assert.throws(() => later.dialogues.push({}), TypeError);
  const feedback = say(later, "ตอบกลับ", "feedback"); assert.equal(feedback.dialogues.length, 2);
  assert.equal(first.dialogues[0].text, "น้ำ");
});
for (const event of [null, {}, { type: "RENDER" }, { type: "PRELOAD" }, { type: "CANCEL" }, { type: "REJECTED" },
  { type: "PRESENTATION_STARTED", presentationId: 0 }, { type: "PRESENTATION_STARTED", presentationId: 1 },
  { type: "PRESENTATION_STARTED", presentationId: 2.5 }, { type: "PRESENTATION_STARTED", presentationId: 2, returning: "yes" },
  { type: "DIALOGUE_PRESENTED", presentationId: 0, part: "scene", record: record() },
  { type: "DIALOGUE_PRESENTED", presentationId: 9, part: "scene", record: record() },
  { type: "DIALOGUE_PRESENTED", presentationId: 1, part: "preload", record: record() },
  { type: "DIALOGUE_PRESENTED", presentationId: 1, part: "scene", record: null },
  { type: "ACTION_COMMITTED", revision: 0, kind: "choice", record: record() },
  { type: "ACTION_COMMITTED", revision: 2, kind: "cancel", record: record() },
]) test(`TC-S4-LOG-001 rejects non-occurrence ${JSON.stringify(event)}`, () => {
  const state = say(begin(create(), 1)); assert.equal(reduce(state, event), state);
});
for (const [key, value] of [["nodeId", ""], ["sceneId", "a".repeat(97)], ["sourceId", null], ["speakerId", undefined], ["locale", "a".repeat(36)],
  ["text", ""], ["text", "ก".repeat(24001)], ["sceneLabel", "ก".repeat(241)], ["speakerLabel", "ก".repeat(241)], ["voiceRole", "unknown"], ["voiceRole", "player"]]) {
  test(`TC-S4-LOG-001 rejects malformed dialogue ${key}/${String(value).length}`, () => {
    const state = begin(create(), 1); assert.equal(reduce(state, { type: "DIALOGUE_PRESENTED", presentationId: 1, part: "scene", record: { ...record(), [key]: value } }), state);
  });
}
test("TC-S4-LOG-001 duplicate/stale action revisions and changed frozen metadata are no-ops", () => {
  const state = act(say(begin(create(), 1)), 5);
  assert.equal(act(state, 5), state); assert.equal(act(state, 4), state);
  assert.equal(reduce(state, { type: "ACTION_COMMITTED", revision: 6, kind: "choice", record: record() }), state);
  assert.equal(reduce(state, { type: "DIALOGUE_PRESENTED", presentationId: 1, part: "scene", record: { ...record("น้ำไหวเบา ๆ ต่อ"), speakerLabel: "คนอื่น" } }), state);
});
test("NFR-PE TC-S4-LOG-001 schema-maximum50+50 survives within8MiB without truncation", () => {
  let state = create();
  const max = { ...record(), nodeId: "n".repeat(96), sceneId: "s".repeat(96), sourceId: "d".repeat(96), speakerId: "c".repeat(96), locale: "l".repeat(35),
    sceneLabel: "\u0001".repeat(240), speakerLabel: "\u0001".repeat(240) };
  for (let i = 1; i <= 50; i++) {
    state = reduce(state, { type: "ACTION_COMMITTED", revision: i, kind: "choice", record: { ...max, voiceRole: "player", text: "\u0001".repeat(999) + "ก" } });
    state = begin(state, i);
    state = reduce(state, { type: "DIALOGUE_PRESENTED", presentationId: i, part: "scene", record: { ...max, text: "\u0001".repeat(23999) + "ก" } });
  }
  assert.equal(state.dialogues.length, 50); assert.equal(state.actions.length, 50);
  assert.ok(state.dialogues.every(e => e.text.length === 24000)); assert.ok(Buffer.byteLength(JSON.stringify(state)) < SESSION_HISTORY_BUDGET);
});
test("TC-S4-LOG-001 creation/reset is deterministic and independent of input references", () => {
  assert.deepEqual(create(), create());
  const input = record(), before = JSON.stringify(input); const state = reduce(begin(create(), 1), { type: "DIALOGUE_PRESENTED", presentationId: 1, part: "scene", record: input });
  assert.equal(JSON.stringify(input), before); input.text = "แก้ข้างนอก"; assert.equal(state.dialogues[0].text, "น้ำไหวเบา ๆ");
  assert.equal(create().dialogues.length, 0); assert.equal(reduce(null, {}), null);
  for (const patch of [{ sessionId: "" }, { contentVersion: "" }, { continued: 1 }]) assert.throws(() => createSessionHistory({ sessionId: "test", contentVersion: "2.1.0", ...patch }), /INVALID_SESSION_HISTORY/);
});
test("TC-S4-LOG-001 bounded counters fail closed without wrapping identities", () => {
  const state = begin(create(), 1), full = Object.freeze({ ...state, nextSequence: Number.MAX_SAFE_INTEGER });
  assert.equal(say(full), full); assert.equal(act(full, 4), full);
  const visits = Object.freeze({ ...state, visit: Number.MAX_SAFE_INTEGER - 1 });
  assert.equal(begin(visits, 2), visits);
});
