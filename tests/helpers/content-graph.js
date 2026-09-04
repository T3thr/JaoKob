/**
 * Test-only Act 1 model checker, not an application/content executor.
 * Trace: NAR-BRN-004, FR-CNT-004/005, FR-ENG-002, CR-0002 D3.
 * Reuses Core arithmetic, condition, transaction and transition rules. Models
 * node-entered events explicitly; unsupported execution capabilities fail closed.
 */
import { validateContentPackage } from "../../src/data/validation/content-validator.js";
import { applyMetricEffects } from "../../src/core/domain/meters.js";
import { evaluateCondition, resolveChoiceTransaction } from "../../src/core/use-cases/choice-transaction.js";
import { planGameStateTransition } from "../../src/core/state-machine/game-state.js";

const STATES = Object.freeze({ cutscene: "Cutscene", exploration: "Exploration", decision: "Decision", "game-over": "GameOver", ending: "Ending" });
const TIME = "2026-09-04T00:00:00.000Z";

export class GraphVerificationError extends Error {
  constructor(code, path, message) {
    super(`${code} at ${path}: ${message}`);
    this.name = "GraphVerificationError";
    this.code = code;
    this.path = path;
  }
}

function fail(code, path, message) { throw new GraphVerificationError(code, path, message); }

/** Extract ALL declared edge kinds, including conservative event sources. */
export function declaredEdges(data) {
  const nodes = data.narrativeTrees.flatMap((tree) => tree.nodes);
  const edges = [];
  for (const node of nodes) {
    if (node.nextNodeId) edges.push({ id: `${node.id}.next`, from: node.id, to: node.nextNodeId, kind: "next" });
    if (node.retryNodeId) edges.push({ id: `${node.id}.retry`, from: node.id, to: node.retryNodeId, kind: "retry" });
    for (const key of ["choices", "interactions"]) for (const action of node[key] ?? []) {
      edges.push({ id: action.id, from: node.id, to: action.nextNodeId, kind: key === "choices" ? "choice" : "interaction", action });
    }
  }
  for (const event of data.events.events) {
    if (!event.resolution.nextNodeId) continue;
    const trigger = event.trigger;
    // Flag/metric triggers may follow effects in other events. Conservatively
    // retain every possible source here; dynamic support is checked separately.
    const sources = trigger.type === "node-entered" ? nodes.filter((n) => n.id === trigger.nodeId)
      : trigger.type === "choice-committed" ? nodes.filter((n) => n.choices?.some((c) => c.id === trigger.choiceId))
        : trigger.type === "state-entered" ? nodes.filter((n) => STATES[n.type] === trigger.state) : nodes;
    for (const source of sources) edges.push({ id: `${event.id}@${source.id}`, from: source.id, to: event.resolution.nextNodeId, kind: "event", event });
  }
  return edges;
}

function reachable(startIds, adjacency) {
  const seen = new Set(startIds);
  const queue = [...seen];
  for (let i = 0; i < queue.length; i += 1) for (const target of adjacency.get(queue[i]) ?? []) {
    if (!seen.has(target)) { seen.add(target); queue.push(target); }
  }
  return seen;
}

/** Tarjan SCCs distinguish harmless exploration loops from closed components. */
function components(ids, adjacency) {
  const indices = new Map(), low = new Map(), stack = [], active = new Set(), result = [];
  function visit(id) {
    indices.set(id, indices.size); low.set(id, indices.get(id)); stack.push(id); active.add(id);
    for (const next of adjacency.get(id) ?? []) {
      if (!indices.has(next)) { visit(next); low.set(id, Math.min(low.get(id), low.get(next))); }
      else if (active.has(next)) low.set(id, Math.min(low.get(id), indices.get(next)));
    }
    if (low.get(id) === indices.get(id)) {
      const group = [];
      let member;
      do { member = stack.pop(); active.delete(member); group.push(member); } while (member !== id);
      result.push(group.sort());
    }
  }
  for (const id of ids) if (!indices.has(id)) visit(id);
  return result;
}

function transitionEvent(source, target, kind) {
  if (kind === "retry" && source.type === "game-over" && target.type === "cutscene") return "RETRY_CHECKPOINT";
  if (source.type === "cutscene") return { cutscene: "ADVANCE_BEAT", exploration: "OPEN_EXPLORATION", decision: "REQUEST_DECISION" }[target.type];
  if (source.type === "exploration") return target.type === "decision" ? "DECISION_READY" : target.type === "cutscene" ? kind === "event" ? "EVENT_TRIGGERED" : "EXIT_AREA" : undefined;
  if (source.type === "decision" && ["cutscene", "exploration"].includes(target.type)) return "COMMIT_CHOICE";
  return undefined;
}

/** Validate structure before traversal, without inventing missing targets. */
export function analyzeStructure(input, testReferenceIds) {
  const checked = validateContentPackage(input, { testReferenceIds });
  if (!checked.valid) {
    const error = checked.errors[0];
    fail(error.code, error.path, error.message);
  }
  const data = checked.packageData;
  const nodes = new Map(data.narrativeTrees.flatMap((t) => t.nodes).map((n) => [n.id, n]));
  const entry = data.narrativeTrees.find((t) => t.treeId === data.entryTreeId).entryNodeId;
  const edges = declaredEdges(data);
  const adjacency = new Map([...nodes.keys()].map((id) => [id, []]));
  const reverse = new Map([...nodes.keys()].map((id) => [id, []]));
  for (const edge of edges) {
    if (!nodes.has(edge.to) || !nodes.has(edge.from)) fail("GRAPH_MISSING_TARGET", edge.id, "Edge endpoint is not declared.");
    const source = nodes.get(edge.from), target = nodes.get(edge.to);
    const event = transitionEvent(source, target, edge.kind);
    if (!event) fail("GRAPH_TRANSITION", edge.id, `${STATES[source.type]} -> ${STATES[target.type]} is not supported by the state table.`);
    Object.assign(edge, { sourceState: STATES[source.type], targetState: STATES[target.type], transitionEvent: event });
    adjacency.get(edge.from).push(edge.to); reverse.get(edge.to).push(edge.from);
  }
  const reached = reachable([entry], adjacency);
  for (const id of nodes.keys()) if (!reached.has(id)) fail("GRAPH_ORPHAN", id, "No path from the declared entry.");
  const boundaries = [...nodes.values()].filter((n) => n.completion?.kind === "act-rest").map((n) => n.id);
  if (!boundaries.length) fail("GRAPH_BOUNDARY", entry, "Act 1 has no declared rest boundary.");
  const canRest = reachable(boundaries, reverse);
  const sccs = components(nodes.keys(), adjacency);
  for (const scc of sccs) if (scc.some((id) => !canRest.has(id))) fail("GRAPH_CLOSED_COMPONENT", scc.join(","), "This component cannot reach an Act 1 rest boundary.");
  return { data, nodes, edges, entry, boundaries, reached, sccs };
}

export function flagValue(snapshot, id) { return snapshot.flags.find((flag) => flag.id === id)?.value; }

/** Reference arithmetic for adapter-owned effects; no I/O, no hidden flags. */
function projectEffects(snapshot, effects, definitions) {
  const projected = structuredClone(snapshot);
  projected.metrics = applyMetricEffects(snapshot.metrics, effects.filter((e) => e.type.endsWith("metric")));
  for (const effect of effects) {
    if (!effect.flagId) continue;
    const record = projected.flags.find((f) => f.id === effect.flagId);
    const def = definitions.find((d) => d.id === effect.flagId);
    if (effect.type === "set-flag") record.value = effect.value;
    else if (effect.type === "clear-flag") record.value = def.defaultValue;
    else if (effect.type === "adjust-flag") {
      const sum = record.value + effect.amount;
      if (def.policy.overflow === "reject" && (sum < def.policy.min || sum > def.policy.max)) fail("GRAPH_FLAG_OVERFLOW", effect.flagId, "Counter exceeds its declared bounds.");
      record.value = Math.min(def.policy.max, Math.max(def.policy.min, sum));
    } else fail("GRAPH_CAPABILITY", effect.flagId, "Unmodelled flag effect.");
  }
  return projected;
}

function ordered(events) { return [...events].sort((a, b) => b.priority - a.priority || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)); }

/** Variant slots come from the reviewed test manifest, not inferred text. */
export function eligibleVariant(data, slot, snapshot) {
  const candidates = slot.eventIds.map((id) => data.events.events.find((e) => e.id === id));
  if (candidates.some((e) => !e)) fail("GRAPH_VARIANT_REFERENCE", slot.id, "Variant event is missing.");
  const eligible = ordered(candidates.filter((e) => evaluateCondition(e.conditions, snapshot)));
  if (!eligible.length) fail("GRAPH_VARIANT_FALLBACK", slot.id, "No variant or default is eligible.");
  if (eligible.length > 1 && eligible[0].priority === eligible[1].priority) fail("GRAPH_VARIANT_AMBIGUOUS", slot.id, "Equal-priority variants overlap without a tie contract.");
  // Act 1 uses disjoint predicates so an ordinary event dispatcher also emits
  // exactly one variant. A new overlapping priority scheme needs D3 review.
  if (eligible.length > 1) fail("GRAPH_VARIANT_OVERLAP", slot.id, "Act 1 variant predicates must be disjoint.");
  return eligible[0];
}

/** Build a bounded Act 1 snapshot model. Unsupported features are errors. */
export function createGraphModel(input, testReferenceIds, variantSlots = []) {
  const graph = analyzeStructure(input, testReferenceIds);
  const { data, nodes, edges } = graph;
  if (nodes.get(graph.entry).type !== "cutscene") fail("GRAPH_ENTRY_STATE", graph.entry, "NEW_GAME must enter Cutscene through TR-002.");
  for (const node of nodes.values()) if (!["cutscene", "decision", "exploration"].includes(node.type)) {
    fail("GRAPH_CAPABILITY", node.id, "Crisis/retry are verified with separate Core fault fixtures, not Canon routes.");
  }
  for (const event of data.events.events) {
    if (event.trigger.type !== "node-entered") fail("GRAPH_CAPABILITY", event.id, "This scoped model executes node-entered events only.");
    if (event.resolution.effects.some((e) => e.flagId === "exploration.safe_observations") && event.maxOccurrences !== 1) {
      fail("GRAPH_OBSERVATION_POLICY", event.id, "Unique observations must be occurrence-bounded to one.");
    }
  }
  const policies = Object.fromEntries(data.flagDefinitions.map((d) => [d.id, d.policy]));

  function seed(overrides = {}) {
    return { currentNodeId: graph.entry, state: "Cutscene", revision: 1, history: [], metrics: structuredClone(data.gameDefaults.metrics), flags: data.flagDefinitions.map((d) => ({ id: d.id, value: d.defaultValue })), eventOccurrences: {}, pendingEventId: null, ...structuredClone(overrides) };
  }

  function enter(snapshot) {
    const node = nodes.get(snapshot.currentNodeId);
    if (!node || !evaluateCondition(node.entryCondition, snapshot)) fail("GRAPH_ENTRY_GUARD", snapshot.currentNodeId, "Entry condition is false before on-enter effects.");
    let current = projectEffects(snapshot, node.onEnterEffects, data.flagDefinitions);
    current.pendingEventId = null;
    for (const slot of variantSlots.filter((s) => s.nodeId === node.id)) eligibleVariant(data, slot, current);
    const triggered = ordered(data.events.events.filter((e) => e.trigger.nodeId === node.id));
    const emitted = [], dialogueIds = [], redirects = [];
    for (const event of triggered) {
      if ((current.eventOccurrences[event.id] ?? 0) >= event.maxOccurrences || !evaluateCondition(event.conditions, current)) continue;
      current = projectEffects(current, event.resolution.effects, data.flagDefinitions);
      current.eventOccurrences[event.id] = (current.eventOccurrences[event.id] ?? 0) + 1;
      emitted.push(event.id); dialogueIds.push(...(event.resolution.dialogueIds ?? []));
      if (event.resolution.nextNodeId) redirects.push(event.id);
    }
    if (redirects.length > 1) fail("GRAPH_EVENT_AMBIGUOUS", node.id, "Multiple redirects on one entry.");
    current.pendingEventId = redirects[0] ?? null;
    dialogueIds.push(...(node.dialogueIds ?? []));
    return { snapshot: current, emitted, dialogueIds };
  }

  function outgoing(snapshot) {
    const edgesHere = edges.filter((e) => e.from === snapshot.currentNodeId);
    return snapshot.pendingEventId ? edgesHere.filter((e) => e.event?.id === snapshot.pendingEventId)
      : edgesHere.filter((e) => e.kind !== "event" && (!e.action || evaluateCondition(e.action.condition, snapshot)));
  }

  function step(snapshot, edgeId) {
    const edge = outgoing(snapshot).find((e) => e.id === edgeId);
    if (!edge) fail("GRAPH_ACTION_GUARD", edgeId, "Action is not eligible in the pre-state.");
    const target = nodes.get(edge.to);
    const projected = projectEffects(snapshot, edge.action?.effects ?? [], data.flagDefinitions);
    const entryConditionMet = evaluateCondition(target.entryCondition, projected);
    if (!entryConditionMet) fail("GRAPH_TARGET_GUARD", edge.id, "Target guard is false in the post-effect candidate.");
    const eligibleChoiceCount = (target.choices ?? []).filter((c) => evaluateCondition(c.condition, projected)).length;
    let candidate, transition;
    if (edge.kind === "choice") {
      const result = resolveChoiceTransaction({ snapshot, command: { id: `command.graph.r${snapshot.revision}`, expectedRevision: snapshot.revision, choiceId: edge.action.id, committedAt: TIME }, choice: edge.action, flagDefinitions: data.flagDefinitions, flagPolicies: policies, target: { id: target.id, type: target.type, entryConditionMet } });
      if (!result.ok) fail("GRAPH_CHOICE_TRANSACTION", edge.id, result.error.code);
      candidate = structuredClone(result.value.snapshot); transition = result.value.transitionPlan;
      const actualFlags = Object.fromEntries(candidate.flags.map((f) => [f.id, f.value]));
      if (Object.entries(projected.metrics).some(([key, value]) => candidate.metrics[key] !== value) || projected.flags.some((f) => actualFlags[f.id] !== f.value)) {
        fail("GRAPH_ATOMIC_MISMATCH", edge.id, "Core transaction differs from the candidate used for target evaluation.");
      }
    } else {
      const result = planGameStateTransition({ snapshot: projected, event: edge.transitionEvent, context: {
        targetNodeType: target.type, targetNodeValid: nodes.has(target.id), entryConditionMet, eligibleChoiceCount,
        hasRemainingBeat: Boolean(target.dialogueIds?.length), inputUnlocked: true,
        exitGuardMet: !edge.action || evaluateCondition(edge.action.condition, snapshot),
        eventEligible: edge.kind === "event" && snapshot.pendingEventId === edge.event.id,
        occurrenceBelowMax: edge.kind === "event" && snapshot.eventOccurrences[edge.event.id] <= edge.event.maxOccurrences,
      } });
      if (!result.ok) fail("GRAPH_TRANSITION_GUARD", edge.id, result.error.reason);
      transition = result.value;
      candidate = { ...projected, currentNodeId: target.id, state: transition.target, revision: snapshot.revision + 1 };
    }
    const entered = enter(candidate);
    return { ...entered, edge, transition, feedback: edge.action?.immediateFeedback };
  }
  return { ...graph, seed, enter, outgoing, step };
}

// The condition DSL cannot inspect revision/history/time/checkpoint/cursor.
// Quotient states therefore retain node, metrics, ALL flags and event counts,
// plus the pending redirect. Ignoring these last two would hide replay bugs.
function stateKey(snapshot) {
  return JSON.stringify([snapshot.currentNodeId, snapshot.metrics, [...snapshot.flags].sort((a, b) => a.id < b.id ? -1 : 1), Object.entries(snapshot.eventOccurrences).sort(([a], [b]) => a < b ? -1 : 1), snapshot.pendingEventId]);
}

/** Exhaust every reachable quotient state, retaining shortest route witnesses. */
export function verifyContentGraph(input, testReferenceIds, variantSlots = []) {
  const model = createGraphModel(input, testReferenceIds, variantSlots);
  const initial = model.enter(model.seed());
  const queue = [{ ...initial, path: [] }];
  const known = new Map([[stateKey(initial.snapshot), 0]]);
  const reverse = new Map([[0, []]]), terminalIds = [];
  const nodeWitnesses = new Map(), edgeWitnesses = new Map(), eventWitnesses = new Map(), dialogueWitnesses = new Map();
  for (let index = 0; index < queue.length; index += 1) {
    if (queue.length > 10000) fail("GRAPH_STATE_LIMIT", model.entry, "State-space bound exceeded; verification is incomplete.");
    const item = queue[index], nodeId = item.snapshot.currentNodeId;
    if (!nodeWitnesses.has(nodeId)) nodeWitnesses.set(nodeId, item.path);
    for (const id of item.emitted) if (!eventWitnesses.has(id)) eventWitnesses.set(id, item.path);
    for (const id of item.dialogueIds) if (!dialogueWitnesses.has(id)) dialogueWitnesses.set(id, item.path);
    const nextEdges = model.outgoing(item.snapshot);
    if (model.nodes.get(nodeId).completion && !item.snapshot.pendingEventId) {
      terminalIds.push(index);
      if (nextEdges.length) fail("GRAPH_BOUNDARY", nodeId, "Rest boundary has an outgoing edge.");
    } else if (!nextEdges.length) fail("GRAPH_STATE_DEADLOCK", nodeId, "Reachable non-boundary state has no eligible continuation.");
    for (const edge of nextEdges) {
      const next = model.step(item.snapshot, edge.id), path = [...item.path, edge.id];
      if (!edgeWitnesses.has(edge.id)) edgeWitnesses.set(edge.id, path);
      // Incoming observations must be recorded even when the target state was
      // already visited, otherwise an equivalent route can hide event coverage.
      for (const id of next.emitted) if (!eventWitnesses.has(id)) eventWitnesses.set(id, path);
      for (const id of next.dialogueIds) if (!dialogueWitnesses.has(id)) dialogueWitnesses.set(id, path);
      const key = stateKey(next.snapshot);
      if (!known.has(key)) { known.set(key, queue.length); reverse.set(queue.length, []); queue.push({ ...next, path }); }
      reverse.get(known.get(key)).push(index);
    }
  }
  const canFinish = reachable(terminalIds, reverse);
  if (canFinish.size !== queue.length) {
    const trapped = queue.find((_, i) => !canFinish.has(i));
    fail("GRAPH_STATE_DEADLOCK", trapped.snapshot.currentNodeId, "Reachable state belongs to a component with no feasible exit to rest.");
  }
  for (const id of model.nodes.keys()) if (!nodeWitnesses.has(id)) fail("GRAPH_NODE_UNREACHABLE", id, "Structurally reachable node has no state-feasible witness.");
  for (const edge of model.edges) if (!edgeWitnesses.has(edge.id)) fail("GRAPH_EDGE_UNREACHABLE", edge.id, "Declared edge has no state-feasible witness.");
  return { model, snapshots: queue.map((q) => q.snapshot), terminalSnapshots: terminalIds.map((i) => queue[i].snapshot), nodeWitnesses, edgeWitnesses, eventWitnesses, dialogueWitnesses };
}
