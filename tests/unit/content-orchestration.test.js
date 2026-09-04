import test from "node:test";
import assert from "node:assert/strict";
import { createContentOrchestrator } from "../../src/core/use-cases/content-orchestration.js";
import { validateSaveEnvelope } from "../../src/data/validation/save-envelope-validator.js";
import { loadGameContent } from "../../src/data/content/content-runtime.js";
import { content, testReferenceIds, loaded, engine, AT, flag, unwrap, start, command, ROUTES, walk, envelope } from "../helpers/act1-session.js";

for (const route of ROUTES) test(`CR-0002 D3 real executor / ${route.home} / ${route.coping} / ${route.keepsake}: pages, variants, Resume and flags`, () => {
  for (const hotspots of [[], ["roots"], ["lily", "roots", "shadows", "mother"]]) {
    const snapshots = walk(route, hotspots);
    const final = snapshots.at(-1);
    assert.deepEqual(final.metrics, { hp: route.coping === "call-family" ? 75 : 85,
      sanity: 70 - (route.coping === "call-family" ? 10 : 5) + (route.keepsake === "keep-fragment" ? 10 : 5), bond: 0 });
    assert.equal(flag(final, "memory.home_focus"), route.home);
    assert.equal(flag(final, "coping.called_for_family"), route.coping === "call-family");
    assert.equal(flag(final, "coping.sought_safety"), route.coping === "seek-safety");
    assert.equal(flag(final, "keepsake.lily_fragment"), route.keepsake === "keep-fragment");
    assert.equal(flag(final, "coping.let_go_early"), route.keepsake === "release-fragment");
    assert.equal(flag(final, "exploration.safe_observations"), hotspots.length);
    assert.equal(final.checkpoint.nodeId, "node.act1.rest");
    assert.deepEqual(final.checkpoint.metrics, final.metrics);
    assert.deepEqual(final.checkpoint.eventOccurrences, final.eventOccurrences);
    assert.deepEqual(final.progress.unlockedEndingIds, []);
    const expectedVariant = `dialogue.act1.home-${route.home}`;
    assert.ok(final.progress.viewedDialogueIds.includes(expectedVariant));
    for (const [index, snapshot] of snapshots.entries()) {
      assert.equal(snapshot.revision, index + 1);
      assert.equal(snapshot.metrics.bond, 0);
      assert.equal(Object.isFrozen(snapshot.flags[0]), true);
      assert.equal(validateSaveEnvelope(envelope(snapshot)).valid, true);
      const resumed = engine.resume(structuredClone(snapshot));
      assert.equal(resumed.ok, true, `${snapshot.currentNodeId}: ${JSON.stringify(resumed.error)}`);
      assert.deepEqual(resumed.value.snapshot, snapshot, "Resume must preserve all fields, including cursor and occurrence counts");
      assert.deepEqual(engine.facts(resumed.value.snapshot), engine.facts(snapshot));
      assert.equal(resumed.value.transitions[0].transitionId, "TR-003");
    }
  }
});

test("FR-ENG-008 repeated hotspots neither farm counters nor lose a saved dialogue cursor", () => {
  const snapshots = walk(ROUTES[0], ["lily", "lily", "roots", "roots", "mother", "shadows"]);
  assert.equal(flag(snapshots.at(-1), "exploration.safe_observations"), 4);
  for (const snapshot of snapshots) assert.deepEqual(unwrap(engine.resume(snapshot)), snapshot);
  assert.ok(snapshots.filter((s) => s.currentNodeId === "node.act1.observe-lily" && engine.facts(s).cursor === 0).length === 2);
});

test("FR-SAV-009 on-enter resume is idempotent even with a nonzero entry delta", () => {
  const catalog = structuredClone(loaded.catalog);
  catalog.nodes[catalog.entryNodeId].onEnterEffects.push({ type: "adjust-metric", metric: "hp", amount: -5 });
  const altered = createContentOrchestrator(catalog);
  const first = unwrap(altered.start({ sessionId: start().sessionId, at: AT }));
  assert.equal(first.metrics.hp, 75);
  assert.equal(first.checkpoint.metrics.hp, 80, "before-node checkpoint precedes entry effects");
  for (let repeat = 0; repeat < 3; repeat += 1) assert.deepEqual(unwrap(altered.resume(first)), first);
  const retry = unwrap(altered.retry({ ...first, state: "GameOver", metrics: { ...first.metrics, hp: 0 } }, command(first)));
  assert.equal(retry.metrics.hp, 75, "retry enters once from pre-entry checkpoint");
  assert.equal(engine.facts(retry).cursor, 0);
  assert.equal(altered.retry(first, command(first)).ok, false, "retry remains guarded by GameOver state");
});

test("CR-0002 D1 final rest checkpoint waits for the last-page acknowledgement", () => {
  const snapshots = walk(), completed = snapshots.at(-1), before = snapshots.at(-2);
  assert.equal(flag(before, "story.act1_complete"), true);
  assert.equal(engine.facts(before).complete, false);
  assert.notEqual(before.checkpoint.nodeId, "node.act1.rest");
  assert.equal(engine.facts(completed).complete, true);
  assert.equal(completed.checkpoint.nodeId, "node.act1.rest");
  assert.equal(engine.advance(completed, command(completed)).error.code, "CONTENT_ACTION_UNAVAILABLE");
});

test("FR-ENG-002 stale commands and unavailable actions preserve the original frozen snapshot", () => {
  const snapshot = start();
  for (const result of [engine.advance(snapshot, { ...command(snapshot), expectedRevision: 0 }), engine.act(snapshot, command(snapshot, "choice.act1.call-family"))]) {
    assert.equal(result.ok, false); assert.equal(result.snapshot, snapshot);
  }
  assert.equal(engine.advance(snapshot, { ...command(snapshot), at: "invalid" }).error.code, "INVALID_COMMAND");
  const overflow = { ...snapshot, revision: Number.MAX_SAFE_INTEGER };
  assert.equal(engine.advance(overflow, command(overflow)).error.code, "REVISION_OVERFLOW");
});

test("FR-ENG-002 target guard evaluates post-choice effects while precondition evaluates pre-state", () => {
  const catalog = structuredClone(loaded.catalog), target = catalog.nodes["node.act1.home-reflection"];
  target.entryCondition = { kind: "flag", flagId: "memory.home_focus", operator: "eq", value: "mother" };
  const altered = createContentOrchestrator(catalog), decision = walk().find((s) => s.currentNodeId === "node.act1.home-focus");
  assert.equal(flag(decision, "memory.home_focus"), "unset");
  assert.equal(altered.act(decision, command(decision, "choice.act1.focus-mother")).ok, true);
  const rejected = altered.act(decision, command(decision, "choice.act1.focus-roots"));
  assert.equal(rejected.error.code, "CONTENT_TARGET_GUARD"); assert.equal(rejected.snapshot, decision);
});

for (const [name, mutate, code] of [
  ["unknown node", (s) => { s.currentNodeId = "node.unknown"; }, "CONTENT_SAVE_REFERENCE"],
  ["state mismatch", (s) => { s.state = "Decision"; }, "CONTENT_SAVE_REFERENCE"],
  ["nonzero Bond", (s) => { s.metrics.bond = 1; }, "CONTENT_SAVE_METRICS"],
  ["invalid enum", (s) => { s.flags.find((f) => f.id === "memory.home_focus").value = "unknown"; }, "CONTENT_FLAG_POLICY"],
  ["unknown progress ID", (s) => { s.progress.viewedDialogueIds.push("dialogue.unknown"); }, "CONTENT_SAVE_REFERENCE"],
  ["foreign cursor", (s) => { s.progress.viewedDialogueIds.push("dialogue.act1.rest-rain"); }, "CONTENT_CURSOR"],
  ["checkpoint mismatch", (s) => { s.checkpoint.nodeId = "node.act1.rest"; }, "CONTENT_CHECKPOINT"],
  ["future event", (s) => { s.eventOccurrences.push({ eventId: "event.unknown", count: 1 }); }, "CONTENT_EVENT_REFERENCE"],
]) test(`FR-SAV-006 content semantic recovery rejects ${name}`, () => {
  const snapshot = structuredClone(start()); mutate(snapshot);
  assert.equal(engine.resume(snapshot).error.code, code);
});

test("FR-SAV-006 missing discovery occurrence and unapplied storm effects cannot resume", () => {
  const snapshots = walk();
  const leaf = structuredClone(snapshots.find((s) => s.currentNodeId === "node.act1.keepsake"));
  leaf.eventOccurrences = [];
  assert.equal(engine.resume(leaf).error.code, "CONTENT_EVENT_PREREQUISITE");
  const storm = structuredClone(snapshots.find((s) => s.currentNodeId === "node.act1.storm"));
  storm.flags.find((f) => f.id === "story.storm_survived").value = false;
  assert.equal(engine.resume(storm).error.code, "CONTENT_ENTRY_NOT_APPLIED");
});

test("CR-0002 D3 unsupported executor capability fails before session creation", async () => {
  const data = structuredClone(content);
  data.narrativeTrees[0].nodes[0].act = 2;
  const rejected = await loadGameContent({ content: data, testReferenceIds });
  assert.equal(rejected.valid, false);
  assert.equal(rejected.errors[0].code, "CONTENT_CAPABILITY");
});

test("FR-SAV-009 forged early completion and future checkpoints cannot skip the reading boundary", () => {
  const snapshots = walk(), final = snapshots.at(-1), early = structuredClone(snapshots.find((s) => s.currentNodeId === "node.act1.rest"));
  early.progress.completedNodeIds.push("node.act1.rest"); early.checkpoint = structuredClone(final.checkpoint);
  assert.equal(engine.resume(early).error.code, "CONTENT_CURSOR");
  const opening = structuredClone(start()); opening.checkpoint = structuredClone(final.checkpoint);
  assert.equal(engine.resume(opening).error.code, "CONTENT_CHECKPOINT");
});

test("FR-SAV-009 retry removes completion after a before-node checkpoint but retains reading history", () => {
  const snapshots = walk(), checkpoint = snapshots.find((s) => s.currentNodeId === "node.act1.keepsake").checkpoint;
  const interrupted = { ...snapshots.at(-1), checkpoint, state: "GameOver" };
  const restored = unwrap(engine.retry(interrupted, command(interrupted)));
  assert.equal(restored.currentNodeId, "node.act1.keepsake");
  assert.equal(restored.progress.completedNodeIds.includes("node.act1.rest"), false);
  assert.ok(restored.progress.viewedDialogueIds.includes("dialogue.act1.rest-tomorrow"));
  const entered = unwrap(engine.act(restored, command(restored, "choice.act1.keep-fragment")));
  assert.equal(engine.facts(entered).complete, false);
  assert.equal(engine.facts(entered).cursor, 0);
});

test("FR-ENG-002 failed entry effects roll back the entire choice transaction", () => {
  const catalog = structuredClone(loaded.catalog);
  catalog.nodes["node.act1.home-reflection"].onEnterEffects.push({ type: "set-flag", flagId: "memory.home_focus", value: "invalid" });
  const altered = createContentOrchestrator(catalog), decision = walk().find((s) => s.currentNodeId === "node.act1.home-focus");
  const result = altered.act(decision, command(decision, "choice.act1.focus-mother"));
  assert.equal(result.error.code, "CONTENT_FLAG_POLICY"); assert.equal(result.snapshot, decision);
  assert.equal(flag(decision, "memory.home_focus"), "unset"); assert.equal(decision.history.length, 0);
});
