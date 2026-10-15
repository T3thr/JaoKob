import test from "node:test";
import assert from "node:assert/strict";
import { projectSessionHistory, projectHistoryAction, projectHistoryPassages } from "../../src/data/content/history-projection.js";
import { createSessionHistory, reduceSessionHistory as reduce } from "../../src/core/use-cases/session-history.js";
import { createContentOrchestrator } from "../../src/core/use-cases/content-orchestration.js";
import { loaded, walk, SESSION_ID, AT } from "../helpers/act1-session.js";

const settings = loaded.catalog.defaults.settings, engine = createContentOrchestrator(loaded.catalog), snapshot = walk()[0];
const create = (continued = false) => createSessionHistory({ sessionId: SESSION_ID, contentVersion: "2.1.0", continued });
const actionId = "choice.act1.keep-fragment";
test("TC-S4-LOG-001 empty/reload projection is warm, truthful and contains no speculative prose", () => {
  const empty = projectSessionHistory(null), resumed = projectSessionHistory(create(true));
  assert.equal(empty.entries.length, 0); assert.match(empty.emptyText, /เมื่อคุณเริ่มอ่าน/); assert.match(resumed.note, /ครั้งก่อน/);
  assert.equal(Object.isFrozen(empty), true); assert.doesNotMatch(JSON.stringify(empty), /dialogue\.act1/);
});
test("FR-LOC-001 TC-S4-LOG-001 action uses accepted Thai label and pre-transaction scene", () => {
  const projected = projectHistoryAction({ loaded, snapshot, settings, actionId });
  assert.equal(projected.record.text, loaded.indexes.choices[actionId].label.th); assert.equal(projected.kind, "choice");
  assert.equal(projected.record.sceneLabel, loaded.indexes.nodes[snapshot.currentNodeId].title.th);
  const interaction = Object.keys(loaded.indexes.interactions)[0];
  assert.equal(projectHistoryAction({ loaded, snapshot, settings, actionId: interaction }).kind, "interaction");
  assert.throws(() => projectHistoryAction({ loaded, snapshot, settings, actionId: "unknown" }), /HISTORY_ACTION/);
});
for (const type of ["collect", "refuse", "release", "use", "replace"]) test(`TC-S4-LOG-001 localized Pouch ${type} records committed item meaning`, () => {
  const result = projectHistoryAction({ loaded, snapshot, settings, pouchCommand: { action: type, itemId: "item_leaf", oldItemId: "item_leaf", opportunityId: "opportunity.test" } });
  assert.equal(result.kind, "keepsake-action"); assert.match(result.record.text, /เศษใบบัว/); assert.doesNotMatch(result.record.text, /{{|item_leaf/);
});
test("TC-S4-LOG-001 unknown Pouch metadata fails instead of inventing a label", () => {
  for (const patch of [{ itemId: "item_unknown" }, { action: "bad" }, { action: "replace", oldItemId: "item_unknown" }]) {
    assert.throws(() => projectHistoryAction({ loaded, snapshot, settings, pouchCommand: { action: "release", itemId: "item_leaf", opportunityId: "opportunity.test", ...patch } }), /HISTORY_ACTION/);
  }
});
test("TC-S4-LOG-001 exact feedback then dialogue context, narration and approved inner voice", () => {
  const facts = engine.facts(snapshot), scene = { dialogue: loaded.indexes.dialogues[facts.dialogueId].text.th, speaker: "ผู้บรรยาย" };
  const input = { loaded, snapshot, facts, settings, scene, presentationId: 1 };
  const projected = projectHistoryPassages({ ...input, feedback: "คำตอบ", feedbackActionId: actionId, feedbackNodeId: "node.act1.keepsake" });
  assert.deepEqual(projected.parts.map(p => p.id), ["feedback", "scene"]); assert.equal(projected.parts[0].nodeId, "node.act1.keepsake");
  assert.equal(projected.parts[1].voiceRole, "narration"); assert.equal(projected.parts[1].text, scene.dialogue);
  const inner = projectHistoryPassages({ ...input, facts: { ...facts, dialogueId: "dialogue.act1.voice-of-home" } });
  assert.equal(inner.parts[0].voiceRole, "inner-voice");
  assert.equal(projectHistoryPassages({ ...input, facts: { ...facts, complete: true, dialogueId: null } }).parts[0].voiceRole, "completion");
  assert.equal(projectHistoryPassages({ ...input, scene: { dialogue: "" } }).parts.length, 0);
  assert.throws(() => projectHistoryPassages({ ...input, snapshot: { currentNodeId: "unknown" } }), /HISTORY_CONTEXT/);
});
test("TC-S4-LOG-001 merge retains accepted order, occurrence contexts and frozen exact strings", () => {
  const action = projectHistoryAction({ loaded, snapshot, settings, actionId });
  let state = reduce(create(), { type: "ACTION_COMMITTED", ...action, revision: 1 });
  state = reduce(state, { type: "PRESENTATION_STARTED", presentationId: 1, returning: true });
  const record = projectHistoryPassages({ loaded, snapshot, facts: engine.facts(snapshot), settings, scene: { dialogue: "<b>น้ำ</b>" }, presentationId: 1 }).parts[0];
  state = reduce(state, { type: "DIALOGUE_PRESENTED", presentationId: 1, part: "scene", record });
  const before = JSON.stringify(state), view = projectSessionHistory(state);
  assert.deepEqual(view.entries.map(e => e.kind), ["choice", "dialogue"]); assert.equal(view.entries[1].text, "<b>น้ำ</b>");
  assert.equal(view.entries[1].contextStart, true); assert.equal(view.entries[0].kindLabel, "คุณเลือก");
  assert.equal(JSON.stringify(state), before); assert.equal(Object.isFrozen(view.entries[0]), true);
});
test("TC-S4-LOG-001 actual Core checkpoint retry retains transcript and records returned passage as a new visit", () => {
  const source = walk().find(s => s.currentNodeId === "node.act1.storm"), facts = engine.facts(source);
  const project = value => projectHistoryPassages({ loaded, snapshot: value, facts: engine.facts(value), settings,
    scene: { dialogue: loaded.indexes.dialogues[engine.facts(value).dialogueId].text.th }, presentationId: 1 }).parts[0];
  let history = reduce(create(), { type: "PRESENTATION_STARTED", presentationId: 1 });
  history = reduce(history, { type: "DIALOGUE_PRESENTED", presentationId: 1, part: "scene", record: project(source) });
  const retry = engine.retry({ ...source, state: "GameOver" }, { expectedRevision: source.revision, at: AT });
  assert.equal(retry.ok, true);
  history = reduce(history, { type: "PRESENTATION_STARTED", presentationId: 2, returning: true });
  history = reduce(history, { type: "DIALOGUE_PRESENTED", presentationId: 2, part: "scene", record: project(retry.value.snapshot) });
  assert.equal(history.dialogues.length, 2); assert.equal(history.dialogues[0].sourceId, facts.dialogueId);
  assert.equal(history.dialogues[1].sourceId, facts.dialogueId); assert.equal(history.dialogues[1].returning, true);
  assert.notEqual(history.dialogues[0].entryId, history.dialogues[1].entryId);
});
