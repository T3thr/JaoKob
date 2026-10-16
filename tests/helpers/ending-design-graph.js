import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createPouch, collectItem, releaseItem, refuseItem } from "../../src/core/domain/keepsake-pouch.js";
import { evaluateCondition, resolveChoiceTransaction } from "../../src/core/use-cases/choice-transaction.js";

// S5 design witness only. Acknowledged, effect-free cutscenes between decisions
// are folded into edges; this does not implement later-act application content.
export const design = JSON.parse(readFileSync(new URL("../fixtures/narrative/act-04-05-design-graph.json", import.meta.url)));
const coreId = id => `design.${id.toLowerCase()}`;
const policies = Object.fromEntries(design.flagDefinitions.map(f => [f.id, { kind: "marker", reversible: false }]));
export const nodeAt = snapshot => design.nodes.find(n => coreId(n.id) === snapshot.currentNodeId);
const inCrisis = snapshot => snapshot.metrics.hp === 0 || snapshot.metrics.sanity === 0;
export const choicesAt = snapshot => inCrisis(snapshot) ? [] : nodeAt(snapshot).choices.filter(c => evaluateCondition(c.condition, snapshot));
export const flagAt = (snapshot, id) => snapshot.flags.find(f => f.id === id).value;

export function seedDesign({ leaf = "unseen", metrics = design.initialMetrics, flags = {}, nodeId = design.entryNodeId } = {}) {
  let pouch = createPouch();
  if (["held", "released"].includes(leaf)) pouch = collectItem(pouch, "item_leaf").value;
  if (leaf === "released") pouch = releaseItem(pouch, "item_leaf").value;
  if (leaf === "refused") pouch = refuseItem(pouch, "item_leaf").value;
  const values = { ...design.initialFlags, "keepsake.lily_fragment": ["held", "released"].includes(leaf), ...flags };
  return { state: "Decision", revision: 1, currentTreeId: "tree.design", currentNodeId: coreId(nodeId),
    metrics: { ...metrics }, flags: design.flagDefinitions.map(f => ({ id: f.id, value: values[f.id] ?? f.defaultValue })),
    pouch, history: [] };
}

export function commitDesign(snapshot, choice) {
  assert.ok(nodeAt(snapshot).choices.some(c => c.id === choice.id), "Choice belongs to the current anchor");
  assert.ok(!inCrisis(snapshot), "Crisis takes precedence over ordinary or repair choices");
  const result = resolveChoiceTransaction({ snapshot,
    command: { id: `design-command-${snapshot.revision}`, expectedRevision: snapshot.revision,
      choiceId: coreId(choice.id), committedAt: "2026-10-16T12:00:00+07:00" },
    choice: { ...choice, id: coreId(choice.id), nextNodeId: coreId(choice.nextNodeId) },
    flagDefinitions: design.flagDefinitions, flagPolicies: policies,
    target: { id: coreId(choice.nextNodeId), type: "cutscene", entryConditionMet: true },
    crisisTarget: { id: "design.crisis", type: "game-over", entryConditionMet: true },
    recoveryTarget: { id: "design.recovery", type: "cutscene", entryConditionMet: true } });
  assert.equal(result.ok, true, JSON.stringify(result.error));
  // The harness acknowledges the intervening cutscene before the next choice.
  return { ...result.value.snapshot, state: "Decision" };
}

export function endingOf(snapshot) {
  if (inCrisis(snapshot)) return "GameOver";
  return design.endings.find(e => evaluateCondition(e.condition, snapshot))?.id;
}

export function walkDesign(plan, options) {
  let snapshot = seedDesign(options), cursor = 0;
  const trace = [];
  while (snapshot.currentNodeId !== coreId(design.resolverNodeId)) {
    assert.ok(trace.length < design.nodes.length, "The design graph cannot cycle or farm repair");
    const node = nodeAt(snapshot), available = choicesAt(snapshot);
    assert.ok(available.length > 0, `No eligible onward choice at ${node.id}`);
    const forced = node.kind === "automatic" || node.kind === "repair" && available.length === 1;
    const requestedId = forced ? available[0].id : plan[cursor++];
    const choice = available.find(c => c.id === requestedId);
    assert.ok(choice, `Ineligible or missing witness choice at ${node.id}`);
    snapshot = commitDesign(snapshot, choice);
    trace.push({ anchor: node.id, choiceId: choice.id, metrics: snapshot.metrics });
  }
  assert.equal(cursor, plan.length, "Witness has no unused/unreachable choices");
  return { snapshot, trace, ending: endingOf(snapshot) };
}

export function enumerateDesign(options) {
  const paths = [];
  function visit(snapshot, trace) {
    assert.ok(trace.length <= design.nodes.length, "No design cycle");
    if (snapshot.currentNodeId === coreId(design.resolverNodeId)) {
      paths.push({ snapshot, trace, ending: endingOf(snapshot) }); return;
    }
    const node = nodeAt(snapshot), available = choicesAt(snapshot);
    assert.ok(available.length > 0, `No onward path at ${node.id}`);
    if (node.kind === "automatic") assert.equal(available.length, 1, "Automatic branches are exhaustive and exclusive");
    for (const choice of available) visit(commitDesign(snapshot, choice), [...trace, { anchor: node.id, choiceId: choice.id }]);
  }
  visit(seedDesign(options), []);
  return paths;
}
