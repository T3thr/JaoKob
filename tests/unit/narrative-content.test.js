import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { validateContentPackage } from "../../src/data/validation/content-validator.js";
import { validateSaveEnvelope } from "../../src/data/validation/save-envelope-validator.js";
import { migrateSave1To2 } from "../../src/data/persistence/save-1-to-2.js";
import { projectKeepsakePouch } from "../../src/data/content/keepsake-view-model.js";
import { evaluateCondition } from "../../src/core/use-cases/choice-transaction.js";
import { createContentOrchestrator } from "../../src/core/use-cases/content-orchestration.js";
import { candidate, candidateTestIds, narrative, story, fresh, value, cmd, save2, travel, FULL_PLAN } from "../helpers/narrative-session.js";

const node = (data, key) => data.narrativeTrees[0].nodes.find(n => n.id === `node.act1.${key}`);
const at = (key, plan = {}) => travel(plan, { stop: s => s.currentNodeId === `node.act1.${key}` && !story.facts(s).canAdvance }).snapshot;
const flag = (s, id) => s.flags.find(f => f.id === id).value;
const hash = bytes => createHash("sha256").update(bytes).digest("hex");

test("TC-S4-NARRATIVE-001 all seven scene anchors have actual fresh prose; exact 2.1 archive retained", () => {
  const legacy = JSON.parse(readFileSync(new URL("../../src/data/content/compatibility/act-01-2.1.0.json", import.meta.url)));
  const source = readFileSync(new URL("../fixtures/narrative/legacy-content-sha256.json", import.meta.url), "utf8");
  assert.equal(hash(readFileSync(new URL("../../src/data/content/compatibility/act-01-2.1.0.json", import.meta.url))), JSON.parse(source).sha256);
  for (const prior of legacy.dialogues.dialogues) assert.notEqual(narrative.indexes.dialogues[prior.id].text.th, prior.text.th, prior.id);
  assert.equal(candidate.contentVersion, "3.0.0"); assert.equal(candidate.schemaVersion, "2.0.0");
  assert.equal(candidate.keepsakes.length, 5); assert.equal(candidate.secretMoments.length, 3);
  assert.deepEqual(candidate.flagDefinitions, legacy.flagDefinitions);
  assert.deepEqual(candidate.gameDefaults, legacy.gameDefaults);
  for (const key of ["focus-mother", "focus-roots", "focus-siblings", "call-family", "seek-safety", "keep-fragment", "release-fragment"]) {
    const previous = legacy.narrativeTrees[0].nodes.flatMap(n => n.choices ?? []).find(c => c.id === `choice.act1.${key}`);
    assert.deepEqual(narrative.indexes.choices[previous.id].effects, previous.effects);
  }
  const prose = JSON.stringify(candidate.dialogues);
  assert.doesNotMatch(prose, /[\u2013\u2014]|ตุ๊กตา|เด็กหญิง|เด็กสาว|ผี|เสียชีวิต|เลือด|คะแนน|ชนะ|แพ้/);
  assert.equal(candidate.characters.characters.find(c => c.narrativeRole === "protagonist").visualProfile.lifeStage, "tadpole");
});

for (const [label, change] of [
  ["unknown item", p => { node(p, "dew-offer").choices[0].pouchEffect.itemId = "item_unregistered"; }],
  ["duplicate item", p => { p.keepsakes.push(p.keepsakes[0]); }],
  ["unknown effect action", p => { node(p, "dew-offer").choices[0].pouchEffect.action = "execute"; }],
  ["unknown effect property", p => { node(p, "dew-offer").choices[0].pouchEffect.code = "run"; }],
  ["unknown predicate state", p => { node(p, "dew-offer").choices[0].condition.all[0].state = "equipped"; }],
  ["unknown predicate item", p => { node(p, "dew-offer").choices[0].condition.all[0].itemId = "item_unknown"; }],
  ["null item registry", p => { p.keepsakes = null; }],
  ["missing old replacement item", p => { delete node(p, "river-offer").choices[2].pouchEffect.oldItemId; }],
  ["new item stat reward", p => { node(p, "dew-offer").choices[0].effects.push({ type: "adjust-metric", metric: "hp", amount: 1 }); }],
  ["unknown completion reference", p => { node(p, "nursery").interactions[4].condition.not.nodeId = "node.missing"; }],
  ["secret too short", p => { node(p, "secret-dew").dialogueIds = node(p, "secret-dew").dialogueIds.slice(0, 1); }],
  ["secret entry reward", p => { node(p, "secret-dew").onEnterEffects.push({ type: "adjust-metric", metric: "hp", amount: 1 }); }],
  ["unknown secret return", p => { p.secretMoments[0].returnNodeId = "node.missing"; }],
  ["secret bypasses return", p => { node(p, "dew-return").nextNodeId = "node.act1.storm"; }],
  ["secret cyclic return", p => { node(p, "dew-return").nextNodeId = "node.act1.dew-offer"; }],
  ["duplicate secret node", p => { p.secretMoments[1].nodeId = p.secretMoments[0].nodeId; }],
  ["self replacement", p => { node(p, "river-offer").choices[2].pouchEffect.oldItemId = "item_river_shell"; }],
]) test(`TC-S4-CONTRACT-001 schema2 rejects ${label}`, () => {
  const p = structuredClone(candidate); change(p);
  assert.equal(validateContentPackage(p, { testReferenceIds: candidateTestIds }).valid, false);
});

test("TC-S4-POUCH-001 nested predicates distinguish held/acquired/released/refused/unseen and reject malformed inputs", () => {
  const s = at("quiet-bank", { leaf: "keep-fragment", dew: "leave" });
  const p = (itemId, state) => ({ kind: "pouch", itemId, state });
  assert.equal(evaluateCondition({ all: [p("item_leaf", "held"), { not: p("item_leaf", "unseen") }, { any: [p("item_dew_stone", "remembered"), p("item_leaf", "released")] }] }, s), true);
  assert.equal(evaluateCondition(p("item_dew_stone", "acquired"), s), false);
  assert.equal(evaluateCondition(p("item_dew_stone", "released"), s), false);
  assert.equal(evaluateCondition(p("item_lotus_shell", "unseen"), s), true);
  assert.equal(evaluateCondition({ kind: "node-completed", nodeId: "node.act1.secret-dew" }, s), true);
  for (const c of [p("bad", "held"), p("item_leaf", "equipped"), { kind: "pouch-capacity", state: "overflow" }]) assert.throws(() => evaluateCondition(c, s), { code: "INVALID_CONDITION" });
  assert.throws(() => evaluateCondition(p("item_leaf", "held"), { ...s, pouch: null }), { code: "INVALID_CONDITION" });
});

for (const suffix of ["leaf", "dew_stone", "lotus_shell", "rain_petal"]) test(`TC-S4-GRAPH-001 fifth real offering atomically replaces item_${suffix}`, () => {
  const s = at("river-offer", FULL_PLAN), before = structuredClone(s);
  assert.equal(s.pouch.held.length, 4);
  const choices = story.facts(s).actions.filter(a => a.eligible).map(a => a.id);
  assert.equal(choices.includes("choice.act1.collect-river-offer"), false);
  assert.equal(choices.length, 5);
  const after = value(story.act(s, cmd(s, `choice.act1.exchange-${suffix}`)));
  assert.deepEqual(after.metrics, s.metrics); assert.deepEqual(after.flags, s.flags);
  assert.equal(after.pouch.held.length, 4); assert.ok(after.pouch.held.includes("item_river_shell"));
  assert.ok(after.pouch.released.includes(`item_${suffix}`)); assert.ok(after.pouch.acquired.includes(`item_${suffix}`));
  assert.ok(after.pouch.remembered.includes(`item_${suffix}`)); assert.deepEqual(s, before);
  assert.equal(flag(after, "keepsake.lily_fragment"), true);
  const stale = story.act(after, cmd(s, `choice.act1.exchange-${suffix}`));
  assert.equal(stale.ok, false); assert.equal(stale.snapshot, after);
});

test("TC-S4-GRAPH-001 full offering can retain all four by refusal, and free pouch can acquire fifth", () => {
  const full = at("river-offer", FULL_PLAN);
  const after = value(story.act(full, cmd(full, "choice.act1.leave-river-offer")));
  assert.deepEqual(after.pouch.held, full.pouch.held); assert.ok(after.pouch.memory.includes("refused_river_shell"));
  const free = at("river-offer", { fifth: "collect" });
  const gained = value(story.act(free, cmd(free, "choice.act1.collect-river-offer")));
  assert.deepEqual(gained.pouch.held, ["item_river_shell"]);
  const rejected = story.act(full, cmd(full, "choice.act1.collect-river-offer"));
  assert.equal(rejected.ok, false); assert.equal(rejected.snapshot, full);
});

test("TC-S4-STATE-001 target guards see the atomic post-pouch candidate and rejection preserves all facts", () => {
  const catalog = structuredClone(narrative.catalog);
  catalog.nodes["node.act1.dew-return"].entryCondition = { kind: "pouch", itemId: "item_dew_stone", state: "held" };
  const guarded = createContentOrchestrator(catalog, { pouchEnabled: true }), s = at("dew-offer", { dew: "collect" });
  const accepted = guarded.act(s, cmd(s, "choice.act1.collect-dew-offer"));
  assert.equal(accepted.ok, true); assert.ok(accepted.value.snapshot.pouch.held.includes("item_dew_stone"));
  const rejected = guarded.act(s, cmd(s, "choice.act1.leave-dew-offer"));
  assert.equal(rejected.ok, false); assert.equal(rejected.error.code, "CONTENT_TARGET_GUARD"); assert.equal(rejected.snapshot, s);
  assert.deepEqual(s.pouch.held, []);
});

test("TC-S4-CALLBACK-001 no collection and release-all routes get complete truthful comfort and same baseline metrics", () => {
  const empty = travel(); assert.deepEqual(empty.snapshot.pouch.held, []);
  assert.ok(empty.snapshots.some(s => story.facts(s).dialogueId === "dialogue.act1.memory-refused-1"));
  const released = travel({ ...FULL_PLAN, fifth: "collect" }, { release: candidate.keepsakes.map(i => i.id) });
  assert.deepEqual(released.snapshot.pouch.held, []);
  assert.equal(released.snapshot.pouch.acquired.length, 5);
  assert.equal(released.snapshot.pouch.released.length, 5);
  assert.ok(released.snapshots.some(s => story.facts(s).dialogueId === "dialogue.act1.memory-released-1"));
  for (const s of released.snapshots.filter(s => s.currentNodeId === "node.act1.rest-memory")) assert.doesNotMatch(story.facts(s).dialogueId, /memory-held/);
  assert.equal(flag(released.snapshot, "keepsake.lily_fragment"), true);
  const projection = projectKeepsakePouch({ pouch: released.snapshot.pouch });
  assert.equal(projection.used, 0); assert.equal(projection.memories.length, 5);
  assert.ok(projection.memories.every(i => i.status === "released" && i.actions.every(a => !a.enabled)));
});

for (const moment of candidate.secretMoments) test(`TC-S4-GRAPH-001 ${moment.id} acknowledges completion at last beat, resumes exactly and returns`, () => {
  const plan = { dew: "leave", lotus: "leave", rain: "leave" };
  const sequence = travel(plan).snapshots.filter(s => s.currentNodeId === moment.nodeId);
  assert.equal(sequence.length, 3);
  for (const s of sequence) {
    assert.equal(s.progress.completedNodeIds.includes(moment.nodeId), false);
    assert.deepEqual(value(story.resume(s)), s);
    assert.equal(validateSaveEnvelope(save2(s)).valid, true);
  }
  const final = sequence.at(-1), after = value(story.advance(final, cmd(final)));
  assert.ok(after.progress.completedNodeIds.includes(moment.nodeId));
  assert.deepEqual(after.metrics, final.metrics);
  const continuation = travel(plan, { initial: after });
  assert.ok(continuation.snapshots.some(s => s.currentNodeId === moment.returnNodeId));
});

test("TC-S4-SAVE-001/002 every candidate cursor is valid Save2 and resumes without replay or migration", () => {
  const samples = [travel({ ...FULL_PLAN, fifth: "exchange-leaf" }), travel(), travel(FULL_PLAN),
    travel({ ...FULL_PLAN, fifth: "collect" }, { release: candidate.keepsakes.map(i => i.id) })].flatMap(result => result.snapshots);
  for (const key of ["lily", "roots", "shadows", "mother"]) {
    const nursery = at("nursery");
    const observed = value(story.act(nursery, cmd(nursery, `interaction.act1.observe-${key}`)));
    samples.push(...travel({}, { initial: observed }).snapshots);
  }
  let largest = 0;
  for (const s of samples) {
    const envelope = save2(s), before = structuredClone(envelope);
    assert.equal(validateSaveEnvelope(envelope).valid, true, s.currentNodeId);
    const result = migrateSave1To2(envelope);
    assert.equal(result.ok, true); assert.equal(result.value.migrated, false);
    assert.deepEqual(result.value.envelope, before);
    assert.deepEqual(value(story.resume(envelope.payload ? { ...envelope.payload, revision: envelope.revision } : null)), s);
    assert.deepEqual(envelope, before);
    largest = Math.max(largest, Buffer.byteLength(JSON.stringify(envelope)));
  }
  assert.ok(largest < 250_000, largest);
  const bad = structuredClone(save2(samples[0])); bad.saveFormatVersion = 1; delete bad.payload.pouch; delete bad.payload.checkpoint.pouch;
  assert.equal(migrateSave1To2(bad).ok, false);
});

test("TC-S4-RETRY-001 opening checkpoint removes optional acknowledgements and newly acquired items", () => {
  const s = at("home-focus", { dew: "collect", lotus: "collect" });
  assert.equal(s.pouch.held.length, 2); assert.ok(s.progress.completedNodeIds.includes("node.act1.secret-dew"));
  const retried = value(story.retry({ ...s, state: "GameOver" }, cmd(s)));
  assert.deepEqual(retried.pouch.held, []); assert.equal(retried.currentNodeId, "node.act1.opening");
  assert.equal(retried.progress.completedNodeIds.includes("node.act1.secret-dew"), false);
});

test("TC-S4-RETRY-001 final checkpoint retains independent full-pouch replacement and released memory", () => {
  const s = travel({ ...FULL_PLAN, fifth: "exchange-leaf" }).snapshot;
  assert.deepEqual(s.checkpoint.pouch, s.pouch);
  const opportunity = story.pouchOpportunity(s);
  const changed = value(story.pouchAction(s, { ...cmd(s), opportunityId: opportunity.id, action: "release", itemId: "item_river_shell" }));
  const retried = value(story.retry({ ...changed, state: "GameOver" }, cmd(changed)));
  assert.deepEqual(retried.pouch, s.checkpoint.pouch);
  assert.equal(story.facts(retried).complete, true);
});

test("TC-S4-GRAPH-001 new graph witnesses every authored node/edge and all 12 legacy emotional directions", () => {
  const reached = new Set(), witnessed = new Set(), metricOutcomes = new Set();
  const visit = result => {
    result.snapshots.forEach(s => reached.add(s.currentNodeId));
    result.edges.forEach(e => witnessed.add(`${e.from}|${e.actionId ?? "advance"}|${e.to}`));
    assert.equal(story.facts(result.snapshot).complete, true);
    assert.equal(result.snapshot.metrics.bond, 0);
    metricOutcomes.add(JSON.stringify(result.snapshot.metrics));
  };
  for (const home of ["mother", "roots", "siblings"]) for (const coping of ["call-family", "seek-safety"]) for (const leaf of ["keep-fragment", "release-fragment"])
    for (const dew of [null, "leave", "collect"]) for (const lotus of [null, "leave", "collect"]) for (const rain of [null, "leave", "collect"]) {
      const plan = { home, coping, leaf, dew, lotus, rain };
      visit(travel(plan)); visit(travel({ ...plan, fifth: "leave" }));
      if (leaf !== "keep-fragment" || dew !== "collect" || lotus !== "collect" || rain !== "collect") visit(travel({ ...plan, fifth: "collect" }));
    }
  for (const item of ["leaf", "dew_stone", "lotus_shell", "rain_petal"]) visit(travel({ ...FULL_PLAN, fifth: `exchange-${item}` }));
  // Existing repeatable nursery observations remain source witnesses too.
  for (const key of ["lily", "roots", "shadows", "mother"]) {
    const nursery = at("nursery"), observation = value(story.act(nursery, cmd(nursery, `interaction.act1.observe-${key}`)));
    witnessed.add(`node.act1.nursery|interaction.act1.observe-${key}|node.act1.observe-${key}`);
    visit(travel({}, { initial: observation }));
  }
  const all = candidate.narrativeTrees[0].nodes;
  assert.deepEqual(reached, new Set(all.map(n => n.id)));
  const expected = all.flatMap(n => n.nextNodeId ? [`${n.id}|advance|${n.nextNodeId}`] : [...(n.choices ?? []), ...(n.interactions ?? [])].map(a => `${n.id}|${a.id}|${a.nextNodeId}`));
  assert.deepEqual([...witnessed].sort(), expected.sort());
  assert.equal(metricOutcomes.size, 4);
});
