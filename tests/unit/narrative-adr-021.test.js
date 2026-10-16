import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { design, choicesAt, flagAt, seedDesign, commitDesign, endingOf, walkDesign, enumerateDesign } from "../helpers/ending-design-graph.js";

for (const witness of design.witnesses) test(`ADR-P0-021 D1 reachable choices: ${witness.id}`, () => {
  for (const leaf of ["unseen", "held", "released", "refused"]) {
    const { snapshot, trace, ending } = walkDesign(witness.choices, { leaf });
    assert.deepEqual(trace.map(t => t.metrics.bond), witness.bondTrace);
    assert.equal(snapshot.metrics.bond, witness.expectedBond);
    assert.equal(ending, witness.expectedEnding);
    assert.ok(snapshot.metrics.hp > 0 && snapshot.metrics.sanity > 0);
    if (ending === "END-DAWN") assert.ok(trace.every(t => t.metrics.bond < 30));
  }
});

test("ADR-P0-021 D1 every reachable Act4–5 design branch terminates; all three endings remain reachable without a keepsake", () => {
  const ids = new Set(design.nodes.map(n => n.id)), edges = new Set(), reached = new Set();
  assert.equal(ids.size, design.nodes.length);
  for (const node of design.nodes) for (const choice of node.choices)
    assert.ok(ids.has(choice.nextNodeId) || choice.nextNodeId === design.resolverNodeId);
  for (const leaf of ["unseen", "held", "released", "refused"]) for (const minimum of [false, true]) {
    const paths = enumerateDesign({ leaf, ...(minimum ? { metrics: { hp: 1, sanity: 1, bond: 0 } } : {}) });
    assert.deepEqual([...new Set(paths.map(p => p.ending))].sort(), ["END-DAWN", "END-HOME", "END-NEARBY"]);
    for (const path of paths) {
      assert.ok(path.snapshot.metrics.hp > 0 && path.snapshot.metrics.sanity > 0);
      assert.equal(path.trace.length, design.nodes.length);
      assert.equal(path.trace.filter(t => t.anchor === "A5-006").length, 1);
      for (const t of path.trace) { reached.add(t.anchor); edges.add(t.choiceId); }
    }
  }
  assert.deepEqual([...reached].sort(), [...ids].sort());
  assert.deepEqual([...edges].sort(), design.nodes.flatMap(n => n.choices.map(c => c.id)).sort());
});

test("ADR-P0-021 D1 original A/B effects and cautious compensation retain their approved budgets", () => {
  const expected = {
    "GDD-DEC-A4-001-A": [0,10,15], "GDD-DEC-A4-001-B": [0,5,5],
    "GDD-DEC-A4-002-A": [10,5,20], "GDD-DEC-A4-002-B": [10,0,10], "GDD-CHO-007": [0,0,10],
    "GDD-DEC-A4-003-A": [5,0,10], "GDD-DEC-A4-003-B": [0,5,10],
    "GDD-DEC-A5-001-A": [0,5,15], "GDD-DEC-A5-001-B": [0,10,15],
    "GDD-DEC-A5-002-A": [10,10,20], "GDD-DEC-A5-002-B": [5,10,10],
  };
  const all = design.nodes.flatMap(n => n.choices);
  assert.equal(new Set(all.map(c => c.id)).size, all.length);
  for (const [id, deltas] of Object.entries(expected)) {
    const choice = all.find(c => c.id === id);
    assert.ok(choice, id);
    assert.deepEqual(["hp", "sanity", "bond"].map(m => choice.effects.find(e => e.type === "adjust-metric" && e.metric === m)?.amount ?? 0), deltas, id);
  }
  for (const choice of all.filter(c => c.id.includes("draft.choice.a4.") || c.id.includes("draft.choice.a5.") && !c.id.includes("repair")))
    assert.equal(choice.effects.some(e => e.type === "adjust-metric" && e.metric === "bond"), false, choice.id);
  const solitary = walkDesign(design.witnesses[0].choices).snapshot;
  assert.equal(flagAt(solitary, "humanity.cautious_observer"), false);
  assert.equal(flagAt(solitary, "humanity.compassion_observed"), true);
  const cautious = walkDesign(design.witnesses[1].choices);
  assert.equal(cautious.trace[2].choiceId, "GDD-CHO-007");
  assert.equal(cautious.trace[2].metrics.bond - cautious.trace[1].metrics.bond, 10);
});

test("ADR-P0-021 D1 physical leaf, water, repeated care and trust guards are enforced by the real predicate evaluator", () => {
  const at = (nodeId, options = {}) => seedDesign({ nodeId, ...options });
  const available = s => choicesAt(s).map(c => c.id);
  for (const leaf of ["released", "refused", "unseen"])
    assert.deepEqual(available(at("A5-003", { leaf })), ["draft.choice.a5.keep-natural-cover"]);
  assert.ok(available(at("A5-003", { leaf: "held" })).includes("GDD-DEC-A5-001-B"));
  assert.equal(available(at("A5-003", { leaf: "held", flags: { "keepsake.lily_fragment": false } })).includes("GDD-DEC-A5-001-B"), false);
  for (const [bond, voice, help] of [[29,false,false],[30,true,false],[49,true,false],[50,true,true]]) {
    const metrics = { hp: 1, sanity: 1, bond };
    assert.equal(available(at("A5-003", { metrics })).includes("GDD-DEC-A5-001-A"), voice);
    assert.equal(available(at("A5-005", { metrics })).includes("GDD-DEC-A5-002-A"), help);
  }
  assert.deepEqual(available(at("A4-005", { flags: { "draft.humanity.safe_distance_seen": false } })), ["draft.choice.a4.drink-rainwater"]);
  assert.deepEqual(available(at("A4-008")), ["draft.choice.a4.follow-watercourse"]);
});

test("ADR-P0-021 D1 repair is conditional, optional and cannot be harvested twice", () => {
  const before = seedDesign({ nodeId: "A5-006", metrics: { hp: 1, sanity: 1, bond: 50 }, flags: { "humanity.compassion_observed": true } });
  assert.deepEqual(choicesAt(before).map(c => c.id), ["draft.choice.a5.repair-accept", "draft.choice.a5.repair-decline"]);
  for (const choice of choicesAt(before)) {
    const after = commitDesign(before, choice);
    assert.equal(flagAt(after, "draft.ending.repair_offered"), true);
    assert.equal(endingOf(after), choice.id.endsWith("accept") ? "END-HOME" : "END-NEARBY");
    const revisit = { ...after, currentNodeId: before.currentNodeId };
    assert.deepEqual(choicesAt(revisit).map(c => c.id), ["draft.event.a5.resolve"]);
  }
  for (const flags of [{ "humanity.compassion_observed": false }, { "bond.accepted_safe_help": true }, { "draft.ending.repair_offered": true }]) {
    const snapshot = seedDesign({ nodeId: "A5-006", metrics: before.metrics, flags: { "humanity.compassion_observed": true, ...flags } });
    assert.deepEqual(choicesAt(snapshot).map(c => c.id), ["draft.event.a5.resolve"]);
  }
});

test("ADR-P0-021 D1 ending order handles 29/30, 59/60 and crisis before any gift gate", () => {
  for (const [bond, compassion, safeHelp, expected] of [
    [0,true,false,"END-DAWN"], [29,true,false,"END-DAWN"], [30,true,false,"END-NEARBY"],
    [59,true,true,"END-NEARBY"], [60,true,true,"END-HOME"], [60,false,true,"END-NEARBY"], [100,true,false,"END-NEARBY"],
  ]) {
    const options = { metrics: { hp: 1, sanity: 1, bond }, flags: { "humanity.compassion_observed": compassion, "bond.accepted_safe_help": safeHelp } };
    assert.equal(endingOf(seedDesign(options)), expected);
    for (const [hp,sanity] of [[0,1],[1,0],[0,0]]) {
      const crisis = seedDesign({ ...options, nodeId: "A5-006", metrics: { hp, sanity, bond } });
      assert.equal(endingOf(crisis), "GameOver");
      assert.deepEqual(choicesAt(crisis), []);
    }
  }
});

test("ADR-P0-021 D2 authored narration and action results have zero duplicate blocks or storm system commentary", () => {
  const raw = readFileSync(new URL("../../src/data/content/packages/act-01.json", import.meta.url), "utf8"), p = JSON.parse(raw);
  const blocks = [...p.dialogues.dialogues.map(d => [d.id, d.text.th]),
    ...p.narrativeTrees.flatMap(t => t.nodes.flatMap(n => [...(n.choices ?? []), ...(n.interactions ?? [])].map(a => [a.id, a.immediateFeedback.th])))];
  const seen = new Map();
  for (const [id,text] of blocks) {
    const normalized = text.normalize("NFC").replace(/\s+/gu, "").replace(/[“”‘’".,!?…]/gu, "");
    assert.ok(!seen.has(normalized), `${id} duplicates ${seen.get(normalized)}`);
    seen.set(normalized, id);
  }
  assert.doesNotMatch(blocks.map(b => b[1]).join("\n"), /ไม่ว่าเช้านั้น|เลือกอะไร.*พายุ|ความจุ|คะแนน|ครบทุกชิ้น|ผู้เล่น/);
  // An editorial repetition budget for this revision, not a literary-quality score.
  assert.ok((raw.match(/หยุด/gu) ?? []).length <= 10);
});
