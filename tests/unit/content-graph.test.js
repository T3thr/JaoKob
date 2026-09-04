import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { analyzeStructure, createGraphModel, declaredEdges, eligibleVariant, flagValue, GraphVerificationError, verifyContentGraph } from "../helpers/content-graph.js";
import { validateContentPackage } from "../../src/data/validation/content-validator.js";
import { evaluateCondition, resolveChoiceTransaction } from "../../src/core/use-cases/choice-transaction.js";
import { planGameStateTransition } from "../../src/core/state-machine/game-state.js";

const json = async (path) => JSON.parse(await readFile(new URL(path, import.meta.url), "utf8"));
const [content, catalog, expected] = await Promise.all([
  json("../../src/data/content/packages/act-01.json"),
  json("../../src/data/content/packages/act-01-test-catalog.json"),
  json("../fixtures/content/graph/act-01-expectations.json"),
]);
const graph = verifyContentGraph(content, catalog, expected.variantSlots);
const model = graph.model;
const node = (data, id) => data.narrativeTrees[0].nodes.find((n) => n.id === `node.act1.${id}`);
const profiles = { none: [], some: ["roots", "mother"], all: ["lily", "roots", "shadows", "mother"] };
const always = { kind: "always" };
const focus = (value) => ({ kind: "flag", flagId: "memory.home_focus", operator: "eq", value });

function expectError(fn, code, path) {
  assert.throws(fn, (error) => error instanceof GraphVerificationError && error.code === code && error.path.includes(path));
}

function withFlags(snapshot, overrides) {
  return { ...structuredClone(snapshot), flags: snapshot.flags.map((flag) => ({ ...flag, value: Object.hasOwn(overrides, flag.id) ? overrides[flag.id] : flag.value })) };
}

function followWitness(witness, selectedModel = model) {
  let result = selectedModel.enter(selectedModel.seed());
  for (const edge of witness) result = selectedModel.step(result.snapshot, edge);
  return result;
}

function playRoute(home, coping, keepsake, hotspots, selectedModel = model) {
  let result = selectedModel.enter(selectedModel.seed());
  const snapshots = [result.snapshot], steps = [], emitted = [...result.emitted], dialogueIds = [...result.dialogueIds];
  const pending = [...hotspots];
  for (let count = 0; count < 200; count += 1) {
    const current = selectedModel.nodes.get(result.snapshot.currentNodeId);
    if (current.completion) return { snapshot: result.snapshot, snapshots, steps, emitted, dialogueIds };
    const options = selectedModel.outgoing(result.snapshot);
    let edgeId;
    if (current.id === "node.act1.nursery") edgeId = pending.length ? `interaction.act1.observe-${pending.shift()}` : "interaction.act1.join-family";
    else if (current.id === "node.act1.home-focus") edgeId = `choice.act1.focus-${home}`;
    else if (current.id === "node.act1.survival") edgeId = coping === "call" ? "choice.act1.call-family" : "choice.act1.seek-safety";
    else if (current.id === "node.act1.keepsake") edgeId = keepsake === "keep" ? "choice.act1.keep-fragment" : "choice.act1.release-fragment";
    else { assert.equal(options.length, 1, current.id); edgeId = options[0].id; }
    const before = result.snapshot;
    result = selectedModel.step(before, edgeId);
    steps.push({ ...result, before }); snapshots.push(result.snapshot);
    emitted.push(...result.emitted); dialogueIds.push(...result.dialogueIds);
  }
  assert.fail("Route did not terminate within the explicit input budget.");
}

test("tc.act1.structure NAR-BRN-004: 7 scenes, 14/14 nodes, 21/21 edges with feasible witnesses", (t) => {
  assert.equal(content.contentVersion, expected.contentVersion);
  assert.equal(content.schemaVersion, expected.schemaVersion);
  assert.equal(Object.keys(expected.scenes).length, 7);
  const sceneNodes = Object.values(expected.scenes).flat();
  assert.equal(new Set(sceneNodes).size, sceneNodes.length);
  assert.deepEqual(sceneNodes.sort(), [...model.nodes.keys()].sort());
  assert.equal(model.nodes.size, expected.nodeCount);
  assert.equal(graph.nodeWitnesses.size, expected.nodeCount);
  assert.equal(model.edges.length, expected.edgeCount);
  assert.equal(graph.edgeWitnesses.size, expected.edgeCount);
  for (const [id, witness] of graph.nodeWitnesses) assert.equal(followWitness(witness).snapshot.currentNodeId, id);
  for (const [id, witness] of graph.edgeWitnesses) assert.equal(followWitness(witness).edge.id, id);
  for (const edge of model.edges) {
    const result = followWitness(graph.edgeWitnesses.get(edge.id));
    assert.equal(result.transition.source, edge.sourceState);
    assert.equal(result.transition.target, edge.targetState);
    assert.match(result.transition.transitionId, /^TR-\d{3}$/);
  }
  t.diagnostic(`GRAPH-GATE: nodes ${graph.nodeWitnesses.size}/${model.nodes.size}; edges ${graph.edgeWitnesses.size}/${model.edges.length}; ${graph.snapshots.length} reachable quotient states; ${graph.terminalSnapshots.length} terminal states.`);
});

test("tc.act1.structure every reachable state has a feasible continuation to rest; SCC exploration has an exit", () => {
  const cyclic = model.sccs.filter((scc) => scc.length > 1);
  assert.equal(cyclic.length, 1);
  assert.equal(cyclic[0].length, 5);
  assert.ok(cyclic[0].includes("node.act1.nursery"));
  assert.ok(model.edges.some((edge) => cyclic[0].includes(edge.from) && !cyclic[0].includes(edge.to)));
  // Every subset of the four optional observations reaches all twelve outcomes.
  const seen = new Set(graph.terminalSnapshots.map((s) => JSON.stringify([
    ["lily", "roots", "shadows", "mother"].map((id) => s.eventOccurrences[`event.act1.observed-${id}`] ?? 0),
    flagValue(s, "memory.home_focus"), flagValue(s, "coping.called_for_family"), flagValue(s, "keepsake.lily_fragment"),
  ])));
  assert.equal(seen.size, 16 * 12);
  assert.equal(graph.terminalSnapshots.length, seen.size);
  for (const snapshot of graph.snapshots) {
    assert.equal(snapshot.state, model.nodes.get(snapshot.currentNodeId).type === "decision" ? "Decision" : model.nodes.get(snapshot.currentNodeId).type === "cutscene" ? "Cutscene" : "Exploration");
    assert.ok(snapshot.metrics.hp > 0 && snapshot.metrics.sanity > 0);
    assert.equal(snapshot.metrics.bond, 0);
    assert.ok(flagValue(snapshot, "exploration.safe_observations") <= 4);
    for (const [id, count] of Object.entries(snapshot.eventOccurrences)) assert.ok(count <= content.events.events.find((e) => e.id === id).maxOccurrences);
  }
});

for (const home of ["mother", "roots", "siblings"]) for (const coping of ["call", "safety"]) for (const keepsake of ["keep", "release"]) {
  for (const [profile, hotspots] of Object.entries(profiles)) test(`tc.act1.routes NAR-SC-A1-001..007: ${home}/${coping}/${keepsake}, exploration=${profile}`, () => {
    const result = playRoute(home, coping, keepsake, hotspots);
    assert.deepEqual(result.snapshot.metrics, { hp: coping === "call" ? 75 : 85, sanity: (coping === "call" ? 60 : 65) + (keepsake === "keep" ? 10 : 5), bond: 0 });
    assert.equal(flagValue(result.snapshot, "memory.home_focus"), home);
    assert.equal(flagValue(result.snapshot, "coping.called_for_family"), coping === "call");
    assert.equal(flagValue(result.snapshot, "coping.sought_safety"), coping === "safety");
    assert.equal(flagValue(result.snapshot, "keepsake.lily_fragment"), keepsake === "keep");
    assert.equal(flagValue(result.snapshot, "coping.let_go_early"), keepsake === "release");
    assert.equal(flagValue(result.snapshot, "exploration.safe_observations"), hotspots.length);
    assert.equal(flagValue(result.snapshot, "story.storm_survived"), true);
    assert.equal(flagValue(result.snapshot, "story.act1_complete"), true);
    assert.equal(result.snapshot.currentNodeId, "node.act1.rest");
    const visited = new Set(result.snapshots.map((s) => s.currentNodeId));
    for (const scene of Object.values(expected.scenes)) assert.ok(scene.some((id) => visited.has(id)));
    assert.ok(result.emitted.includes(`event.act1.home-${home}`));
    assert.ok(result.emitted.includes(`event.act1.coping-${coping}`));
    assert.ok(!result.emitted.some((id) => id.endsWith("-default")));
    const commits = result.steps.filter((step) => step.edge.kind === "choice");
    assert.equal(commits.length, 3);
    assert.equal(result.snapshot.history.length, 3);
    for (const step of commits) { assert.ok(step.feedback.th.trim()); assert.equal(step.snapshot.revision, step.before.revision + 1); }
    assert.deepEqual(commits[0].snapshot.metrics, { hp: 80, sanity: 70, bond: 0 });
    const survivalCommit = commits[1];
    assert.equal(flagValue(survivalCommit.before, "coping.called_for_family"), false);
    assert.equal(flagValue(survivalCommit.before, "coping.sought_safety"), false);
    assert.ok(survivalCommit.emitted.includes(`event.act1.coping-${coping}`));
    assert.equal(survivalCommit.transition.transitionId, "TR-013");
    assert.equal(commits[2].transition.transitionId, "TR-012");
    assert.equal(result.snapshot.eventOccurrences["event.act1.discovered-fragment"], 1);
    if (keepsake === "release") {
      const afterRelease = commits[2].dialogueIds.map((id) => content.dialogues.dialogues.find((d) => d.id === id).text.th).join(" ");
      assert.doesNotMatch(afterRelease, /(?:ประคอง|พก|แนบตัว|ใต้ท้อง).*เศษใบบัว|เศษใบบัว.*(?:แนบตัว|ใต้ท้อง)/);
    }
  });
}

test("tc.act1.observations NAR-SC-A1-002: all 24 hotspot orders commute without a completion prerequisite", () => {
  const permutations = (items) => items.length ? items.flatMap((item, i) => permutations(items.filter((_, j) => i !== j)).map((tail) => [item, ...tail])) : [[]];
  const orders = permutations(profiles.all);
  assert.equal(orders.length, 24);
  const expectedResult = playRoute("mother", "safety", "release", profiles.all).snapshot;
  for (const order of orders) {
    const actual = playRoute("mother", "safety", "release", order).snapshot;
    assert.deepEqual(actual.metrics, expectedResult.metrics);
    assert.deepEqual(actual.flags, expectedResult.flags);
    assert.deepEqual(actual.eventOccurrences, expectedResult.eventOccurrences);
  }
});

for (const startingCount of [0, 19, 20]) test(`tc.act1.observations counter boundary ${startingCount}, repeat entry and revisit cannot farm`, () => {
  let snapshot = withFlags(model.seed({ currentNodeId: "node.act1.observe-roots" }), { "exploration.safe_observations": startingCount });
  const first = model.enter(snapshot);
  snapshot = first.snapshot;
  assert.equal(flagValue(snapshot, "exploration.safe_observations"), Math.min(20, startingCount + 1));
  assert.equal(first.emitted.filter((id) => id === "event.act1.observed-roots").length, 1);
  for (let repeat = 0; repeat < 100; repeat += 1) {
    const replayed = model.enter(snapshot); // Repeated delivery of the same node-entered notification.
    assert.deepEqual(replayed.emitted, []);
    const nursery = model.step(replayed.snapshot, "node.act1.observe-roots.next");
    snapshot = model.step(nursery.snapshot, "interaction.act1.observe-roots").snapshot;
    assert.equal(snapshot.eventOccurrences["event.act1.observed-roots"], 1);
    assert.equal(flagValue(snapshot, "exploration.safe_observations"), Math.min(20, startingCount + 1));
    assert.deepEqual(snapshot.metrics, { hp: 80, sanity: 70, bond: 0 });
  }
});

test("tc.act1.observations D2: only declared first-observation events increment the counter", () => {
  for (const n of model.nodes.values()) {
    assert.ok(!n.onEnterEffects.some((e) => e.flagId === "exploration.safe_observations"));
    for (const action of [...(n.interactions ?? []), ...(n.choices ?? [])]) assert.ok(!action.effects.some((e) => e.flagId === "exploration.safe_observations"));
  }
  const counters = content.events.events.filter((event) => event.resolution.effects.some((e) => e.flagId === "exploration.safe_observations"));
  assert.equal(counters.length, 4);
  for (const event of counters) {
    assert.equal(event.maxOccurrences, 1);
    assert.deepEqual(event.resolution.effects, [{ type: "adjust-flag", flagId: "exploration.safe_observations", amount: 1 }]);
  }
});

for (const home of ["unset", "mother", "roots", "siblings"]) test(`tc.act1.variants home-focus ${home}: one expression including synthetic default`, () => {
  const snapshot = withFlags(model.seed({ currentNodeId: "node.act1.home-reflection" }), { "memory.home_focus": home });
  const id = `event.act1.home-${home === "unset" ? "default" : home}`;
  assert.equal(eligibleVariant(content, expected.variantSlots[0], snapshot).id, id);
  const entered = model.enter(snapshot);
  assert.deepEqual(entered.emitted, [id]);
  assert.equal(model.enter(entered.snapshot).emitted.length, 0);
});

for (const called of [false, true]) for (const safe of [false, true]) test(`tc.act1.variants coping flags ${called}/${safe}: exclusive predicates and safe default`, () => {
  const snapshot = withFlags(model.seed({ currentNodeId: "node.act1.lily-fragment", state: "Exploration" }), { "story.storm_survived": true, "coping.called_for_family": called, "coping.sought_safety": safe });
  const id = called !== safe ? `event.act1.coping-${called ? "call" : "safety"}` : "event.act1.coping-default";
  assert.equal(eligibleVariant(content, expected.variantSlots[1], snapshot).id, id);
  const entered = model.enter(snapshot);
  assert.deepEqual(entered.emitted, [id]);
  assert.equal(model.enter(entered.snapshot).emitted.length, 0);
});

test("tc.act1.variants all 46 dialogue records and 13 events have Canon or synthetic-default witnesses", (t) => {
  const events = new Set(graph.eventWitnesses.keys()), dialogues = new Set(graph.dialogueWitnesses.keys());
  assert.equal(events.size, 11);
  assert.equal(dialogues.size, 44);
  for (const slot of expected.variantSlots) {
    assert.ok(!events.has(slot.defaultEventId));
    const snapshot = withFlags(model.seed({ currentNodeId: slot.nodeId }), { "story.storm_survived": true });
    const result = model.enter(snapshot);
    result.emitted.forEach((id) => events.add(id)); result.dialogueIds.forEach((id) => dialogues.add(id));
  }
  assert.deepEqual([...events].sort(), content.events.events.map((e) => e.id).sort());
  assert.deepEqual([...dialogues].sort(), content.dialogues.dialogues.map((d) => d.id).sort());
  for (const [id, prototype] of Object.entries(expected.prototypes)) assert.equal(content.dialogues.dialogues.find((d) => d.id === id).text.th, prototype);
  const thought = content.dialogues.dialogues.find((d) => d.id === "dialogue.act1.voice-of-home");
  assert.ok(thought.tags.includes("role.thought"));
  assert.equal(thought.accessibilityDescription.th, "ความคิดภายในของเจ้ากบ");
  t.diagnostic(`Dialogue coverage: Canon 44/46 + synthetic defaults 2/46; events: Canon 11/13 + synthetic defaults 2/13. Future-act callbacks are deferred, not runtime edges.`);
});

test("tc.act1.preconditions NAR-SC-A1-006: discovery dominates keepsake; no extra progress flags", () => {
  const withoutDiscovery = new Set([model.entry]);
  for (let changed = true; changed;) {
    changed = false;
    for (const edge of model.edges) if (edge.to !== "node.act1.leaf-discovery" && withoutDiscovery.has(edge.from) && !withoutDiscovery.has(edge.to)) { withoutDiscovery.add(edge.to); changed = true; }
  }
  assert.ok(!withoutDiscovery.has("node.act1.keepsake"));
  const choices = graph.snapshots.filter((s) => s.currentNodeId === "node.act1.keepsake");
  assert.ok(choices.length > 0);
  for (const snapshot of choices) {
    assert.equal(snapshot.eventOccurrences["event.act1.discovered-fragment"], 1);
    assert.equal(flagValue(snapshot, "story.storm_survived"), true);
    assert.ok(node(content, "keepsake").choices.every((c) => evaluateCondition(c.condition, snapshot)));
  }
  assert.equal(content.flagDefinitions.length, 8);
});

test("tc.act1.preconditions FR-ENG-002: action guard uses pre-state and target guard uses post-effect candidate", () => {
  const data = structuredClone(content);
  node(data, "home-reflection").entryCondition = { not: focus("unset") };
  const guarded = createGraphModel(data, catalog, expected.variantSlots);
  for (const home of ["mother", "roots", "siblings"]) assert.equal(flagValue(playRoute(home, "call", "keep", [], guarded).snapshot, "memory.home_focus"), home);
  node(data, "home-focus").choices[0].condition = focus("mother");
  const preGuarded = createGraphModel(data, catalog, expected.variantSlots);
  const snapshot = followWitness(graph.nodeWitnesses.get("node.act1.home-focus"), preGuarded).snapshot;
  const before = structuredClone(snapshot);
  expectError(() => preGuarded.step(snapshot, "choice.act1.focus-mother"), "GRAPH_ACTION_GUARD", "choice.act1.focus-mother");
  assert.deepEqual(snapshot, before);
});

test("tc.act1.boundary D1: explicit checkpoint/rest contract, no Ending or Act 2 placeholder", () => {
  const rest = node(content, "rest");
  assert.deepEqual(model.boundaries, [rest.id]);
  assert.equal(rest.completion.kind, "act-rest");
  assert.equal(rest.completion.flagId, "story.act1_complete");
  assert.ok(rest.completion.message.th.includes("พักสายตา"));
  assert.equal(rest.completion.actionLabel.th, "บันทึกและกลับหน้าหลัก");
  assert.equal(rest.checkpointPolicy, "after-node");
  assert.equal(Object.hasOwn(rest, "nextNodeId"), false);
  const checkpoints = [...model.nodes.values()].filter((n) => n.checkpointId);
  assert.equal(checkpoints.length, 5);
  assert.equal(new Set(checkpoints.map((n) => n.checkpointId)).size, 5);
  assert.equal(node(content, "keepsake").checkpointPolicy, "before-node");
  assert.equal(node(content, "survival").checkpointPolicy, "before-node");
  for (const n of model.nodes.values()) { assert.equal(n.act, 1); assert.ok(!["ending", "game-over"].includes(n.type)); assert.ok(!Object.hasOwn(n, "endingId")); }
  const result = playRoute("mother", "call", "release", []);
  const repeated = model.enter(result.snapshot);
  assert.deepEqual(repeated.snapshot.metrics, result.snapshot.metrics);
  assert.deepEqual(repeated.snapshot.flags, result.snapshot.flags);
  assert.deepEqual(repeated.emitted, []);
  assert.deepEqual(model.outgoing(repeated.snapshot), []);
});

test("tc.act1.boundary Bond=0, notice precedes storm, and storm/rest effects add no damage", () => {
  assert.deepEqual(content.gameDefaults.metrics, { hp: 80, sanity: 70, bond: 0 });
  for (const def of content.flagDefinitions) if (def.valueType === "boolean") assert.equal(def.defaultValue, false);
  for (const n of model.nodes.values()) for (const e of [...n.onEnterEffects, ...(n.choices ?? []).flatMap((c) => c.effects), ...(n.interactions ?? []).flatMap((a) => a.effects)]) assert.notEqual(e.metric, "bond");
  for (const event of content.events.events) for (const effect of event.resolution.effects) assert.notEqual(effect.metric, "bond");
  assert.deepEqual(node(content, "storm").onEnterEffects, [{ type: "set-flag", flagId: "story.storm_survived", value: true }]);
  assert.deepEqual(node(content, "rest").onEnterEffects, [{ type: "set-flag", flagId: "story.act1_complete", value: true }]);
  assert.deepEqual(node(content, "storm").contentWarningIds, ["warning.act1.storm-separation"]);
  assert.ok(content.contentWarnings[0].detail.th.includes("หยุดพัก"));
  assert.equal(content.assets.length, 0);
});

for (const [fixture, code, path] of [["invalid-orphan", "GRAPH_ORPHAN", "node.fixture.orphan"], ["invalid-cycle", "GRAPH_CLOSED_COMPONENT", "node.fixture.loop"]]) test(`GRAPH-GATE negative JSON fixture: ${fixture}`, async () => {
  const broken = await json(`../fixtures/content/graph/${fixture}.json`);
  assert.equal(validateContentPackage(broken, { testReferenceIds: ["tc.content.fixture"] }).valid, true);
  expectError(() => analyzeStructure(broken, ["tc.content.fixture"]), code, path);
});

test("GRAPH-GATE detects a state-closed cycle even when structural SCC has an exit", async () => {
  const broken = await json("../fixtures/content/graph/invalid-cycle.json");
  const pool = broken.narrativeTrees[0].nodes.find((n) => n.id === "node.fixture.pool");
  pool.interactions.push({ ...structuredClone(pool.interactions[0]), id: "interaction.fixture.exit", condition: focus("mother"), nextNodeId: "node.fixture.rest" });
  assert.doesNotThrow(() => analyzeStructure(broken, ["tc.content.fixture"]));
  expectError(() => verifyContentGraph(broken, ["tc.content.fixture"]), "GRAPH_STATE_DEADLOCK", "node.fixture.loop");
});

const negativeCases = [
  ["missing node target", (d) => { node(d, "opening").nextNodeId = "node.absent"; }, "CONTENT_REFERENCE", "nextNodeId"],
  ["duplicate ID", (d) => { node(d, "nursery").interactions[0].id = "choice.act1.call-family"; }, "CONTENT_DUPLICATE_ID", "interactions[0].id"],
  ["missing Thai", (d) => { delete node(d, "rest").completion.message.th; }, "CONTENT_SCHEMA", "message.th"],
  ["invalid checkpoint", (d) => { node(d, "rest").checkpointPolicy = "none"; }, "CONTENT_SCHEMA", "checkpointPolicy"],
  ["missing callback", (d) => { node(d, "home-focus").choices[0].callbackEventIds = ["event.absent"]; }, "CONTENT_REFERENCE", "callbackEventIds"],
  ["impossible action guard", (d) => { for (const c of node(d, "home-focus").choices) c.condition = { all: [focus("mother"), focus("roots")] }; }, "GRAPH_STATE_DEADLOCK", "node.act1.home-focus"],
  ["impossible target guard", (d) => { node(d, "home-reflection").entryCondition = focus("unset"); }, "GRAPH_TARGET_GUARD", "choice.act1.focus-mother"],
  ["unreachable declared action", (d) => { node(d, "home-focus").choices[2].condition = { not: always }; }, "GRAPH_EDGE_UNREACHABLE", "choice.act1.focus-siblings"],
  ["Decision to Decision", (d) => { node(d, "home-focus").choices[0].nextNodeId = "node.act1.survival"; }, "GRAPH_TRANSITION", "choice.act1.focus-mother"],
  ["observation farming", (d) => { d.events.events[0].maxOccurrences = 2; }, "GRAPH_OBSERVATION_POLICY", "event.act1.observed-lily"],
  ["missing event redirect", (d) => { d.events.events[0].resolution.nextNodeId = "node.absent"; }, "CONTENT_REFERENCE", "nextNodeId"],
  ["unmodelled trigger fails closed", (d) => { d.events.events[0].trigger = { type: "flag-changed", flagId: "memory.home_focus" }; }, "GRAPH_CAPABILITY", "event.act1.observed-lily"],
  ["automatic cutscene loop", (d) => { node(d, "home-reflection").nextNodeId = "node.act1.home-reflection"; }, "CONTENT_SEMANTIC", "nextNodeId"],
];
for (const [name, mutate, code, path] of negativeCases) test(`GRAPH-GATE negative mutation: ${name}`, () => {
  const broken = structuredClone(content); mutate(broken);
  expectError(() => verifyContentGraph(broken, catalog, expected.variantSlots), code, path);
});

test("GRAPH-GATE catches ambiguous priority and missing variant fallback", () => {
  const broken = structuredClone(content), slot = expected.variantSlots[0];
  broken.events.events.find((e) => e.id === "event.act1.home-roots").conditions = focus("mother");
  expectError(() => eligibleVariant(broken, slot, withFlags(model.seed(), { "memory.home_focus": "mother" })), "GRAPH_VARIANT_AMBIGUOUS", slot.id);
  broken.events.events.find((e) => e.id === "event.act1.home-default").conditions = focus("siblings");
  expectError(() => eligibleVariant(broken, slot, model.seed()), "GRAPH_VARIANT_FALLBACK", slot.id);
});

test("GRAPH-GATE adjacency includes event redirects for all triggers and retry edges", () => {
  const data = structuredClone(content);
  const original = data.events.events[0];
  const triggers = [original.trigger, { type: "choice-committed", choiceId: "choice.act1.call-family" }, { type: "state-entered", state: "Exploration" }, { type: "flag-changed", flagId: "memory.home_focus" }, { type: "metric-threshold", metric: "hp", operator: "lt", value: 50 }];
  data.events.events = triggers.map((trigger, i) => ({ ...original, id: `event.fixture.redirect-${i}`, trigger, resolution: { effects: [], nextNodeId: "node.act1.rest" } }));
  data.narrativeTrees[0].nodes.push({ id: "node.fixture.crisis", type: "game-over", retryNodeId: "node.act1.opening" });
  const edges = declaredEdges(data);
  for (const event of data.events.events) assert.ok(edges.some((edge) => edge.kind === "event" && edge.event.id === event.id && edge.to === "node.act1.rest"));
  assert.ok(edges.some((edge) => edge.kind === "retry" && edge.from === "node.fixture.crisis" && edge.to === "node.act1.opening"));
});

test("FR-ENG-002 TR-014/016 fault fixture: crisis precedes normal target and retry remains guarded", () => {
  const snapshot = withFlags(model.seed({ currentNodeId: "node.act1.survival", state: "Decision", metrics: { hp: 5, sanity: 10, bond: 0 } }), { "story.storm_survived": true });
  const choice = node(content, "survival").choices[0];
  const request = { snapshot, command: { id: "command.fixture.crisis", expectedRevision: snapshot.revision, choiceId: choice.id, committedAt: "2026-09-04T00:00:00.000Z" }, choice, flagDefinitions: content.flagDefinitions, flagPolicies: Object.fromEntries(content.flagDefinitions.map((d) => [d.id, d.policy])), target: { id: choice.nextNodeId, type: "exploration", entryConditionMet: false }, crisisTarget: { id: "node.fixture.crisis", type: "game-over", entryConditionMet: true }, recoveryTarget: { id: "node.fixture.recovery", type: "cutscene", entryConditionMet: true } };
  const crisis = resolveChoiceTransaction(request);
  assert.equal(crisis.ok, true, JSON.stringify(crisis.error));
  assert.equal(crisis.value.transitionPlan.transitionId, "TR-014");
  assert.deepEqual(crisis.value.snapshot.metrics, { hp: 0, sanity: 0, bond: 0 });
  assert.equal(crisis.value.outcome.crisisReason, "physical_collapse");
  const retry = (checkpointValid) => planGameStateTransition({ snapshot: crisis.value.snapshot, event: "RETRY_CHECKPOINT", context: { checkpointValid, contentReferencesCompatible: true } });
  assert.equal(retry(false).ok, false);
  assert.equal(retry(true).value.transitionId, "TR-016");
  const assisted = resolveChoiceTransaction({ ...request, storyAssistEnabled: true });
  assert.equal(assisted.ok, true);
  assert.equal(assisted.value.outcome.kind, "recovery");
  assert.deepEqual(assisted.value.snapshot.metrics, { hp: 1, sanity: 1, bond: 0 });
  assert.equal(assisted.value.snapshot.state, "Cutscene");
  assert.deepEqual(snapshot.metrics, { hp: 5, sanity: 10, bond: 0 });
});

test("NAR-BRN-002 major choices have immediate feedback and deferred callback ledger trace", async () => {
  const matrix = await readFile(new URL("../../docs/traceability/sprint-02-content-matrix.md", import.meta.url), "utf8");
  assert.equal(expected.deferredCallbacks.length, 4);
  const majorChoices = [...model.nodes.values()].flatMap((n) => n.choices ?? []).filter((c) => c.impact !== "standard");
  assert.deepEqual(expected.deferredCallbacks.map((c) => c.setupChoiceId).sort(), majorChoices.map((c) => c.id).sort());
  for (const callback of expected.deferredCallbacks) {
    const choice = majorChoices.find((c) => c.id === callback.setupChoiceId);
    assert.ok(choice.immediateFeedback.th.trim());
    assert.ok(choice.effects.some((e) => e.type === "set-flag" && e.flagId === callback.flagId && e.value === true));
    for (const text of Object.values(callback)) assert.ok(matrix.includes(text), `Missing ledger field: ${text}`);
  }
  // Future payoffs are documentation only; all executable references resolve now.
  assert.equal(validateContentPackage(content, { testReferenceIds: catalog }).valid, true);
});
