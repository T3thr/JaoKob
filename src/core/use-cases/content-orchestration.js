import { applyMetricEffects } from "../domain/meters.js";
import { evaluateCondition, resolveChoiceTransaction } from "./choice-transaction.js";
import { planGameStateTransition } from "../state-machine/game-state.js";

/** Pure content progression. Trace: CR-0002 D3, ADR-P0-014, FR-ENG-002/008. */
const STATES = Object.freeze({ cutscene: "Cutscene", exploration: "Exploration", decision: "Decision" });

class ContentSessionError extends Error {
  constructor(code) { super(code); this.code = code; }
}
const reject = (code) => { throw new ContentSessionError(code); };
const requireFact = (condition, code) => { if (!condition) reject(code); };
const flagValue = (snapshot, id) => snapshot.flags.find((flag) => flag.id === id)?.value;
const occurrences = (snapshot, id) => snapshot.eventOccurrences.find((entry) => entry.eventId === id)?.count ?? 0;

/** JSON-compatible domain values only; no serialization, adapter or I/O. */
function copy(value) {
  if (Array.isArray(value)) return value.map(copy);
  if (value !== null && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, copy(item)]));
  return value;
}
function freeze(value) {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    Object.values(value).forEach(freeze); Object.freeze(value);
  }
  return value;
}
function attempt(snapshot, operation) {
  try { return freeze({ ok: true, value: operation() }); }
  catch (error) {
    return Object.freeze({ ok: false, error: Object.freeze({ code: error.code ?? "CONTENT_SESSION" }), snapshot });
  }
}

/**
 * Immutable normalized catalog is supplied by the composition boundary.
 * Each operation is deterministic; time, session ID and revision come from
 * its caller. No mutable session is held in this closure.
 */
export function createContentOrchestrator(catalog) {
  const { nodes, events, flags: definitions } = catalog;
  const policies = Object.fromEntries(definitions.map((def) => [def.id, def.policy]));
  const nodeFor = (snapshot) => nodes[snapshot.currentNodeId];

  function eligibleEvents(snapshot) {
    const matching = events.filter((event) => event.trigger.nodeId === snapshot.currentNodeId && evaluateCondition(event.conditions, snapshot));
    const voiced = matching.filter((event) => event.resolution.dialogueIds?.length);
    const sorted = [...voiced].sort((a, b) => b.priority - a.priority);
    requireFact(sorted.length < 2 || sorted[0].priority !== sorted[1].priority, "CONTENT_VARIANT_AMBIGUOUS");
    return matching.filter((event) => !event.resolution.dialogueIds?.length || event.id === sorted[0]?.id)
      .sort((a, b) => b.priority - a.priority || (a.id < b.id ? -1 : 1));
  }

  function dialogueSequence(snapshot) {
    const node = nodeFor(snapshot);
    return [...eligibleEvents(snapshot).filter((event) => occurrences(snapshot, event.id) > 0).flatMap((event) => event.resolution.dialogueIds ?? []), ...(node.dialogueIds ?? [])];
  }

  function display(snapshot, dialogueId) {
    if (!dialogueId) return;
    const viewed = snapshot.progress.viewedDialogueIds;
    snapshot.progress.viewedDialogueIds = [...viewed.filter((id) => id !== dialogueId), dialogueId];
  }

  function facts(snapshot) {
    const node = nodeFor(snapshot);
    const sequence = dialogueSequence(snapshot);
    const last = snapshot.progress.viewedDialogueIds.at(-1);
    const cursor = sequence.length ? sequence.indexOf(last) : -1;
    requireFact(!sequence.length || cursor >= 0, "CONTENT_CURSOR");
    const complete = Boolean(node.completion && snapshot.progress.completedNodeIds.includes(node.id));
    const hasNextPage = cursor >= 0 && cursor < sequence.length - 1;
    const ready = !complete && node.type !== "cutscene" && !hasNextPage;
    return freeze({ nodeId: node.id, dialogueId: complete ? null : sequence[cursor] ?? null, cursor,
      pageCount: sequence.length, hasNextPage, complete, canAdvance: !complete && (node.type === "cutscene" || hasNextPage),
      actions: ready ? [...(node.choices ?? []), ...(node.interactions ?? [])].map((action) => ({ id: action.id, eligible: evaluateCondition(action.condition, snapshot) })) : [],
    });
  }

  function applyEffects(snapshot, effects) {
    const next = copy(snapshot);
    next.metrics = copy(applyMetricEffects(snapshot.metrics, effects.filter((effect) => effect.type.endsWith("metric"))));
    for (const effect of effects) {
      if (!effect.flagId) continue;
      const def = definitions.find((flag) => flag.id === effect.flagId);
      const record = next.flags.find((flag) => flag.id === effect.flagId);
      requireFact(def && record, "CONTENT_FLAG_REFERENCE");
      let value = record.value;
      if (effect.type === "set-flag") value = effect.value;
      else if (effect.type === "clear-flag") {
        requireFact(def.policy.reversible === true, "CONTENT_FLAG_POLICY");
        value = def.defaultValue;
      } else if (effect.type === "adjust-flag") {
        requireFact(def.policy.kind === "counter" && (!def.policy.monotonic || effect.amount >= 0), "CONTENT_FLAG_POLICY");
        value += effect.amount;
        requireFact(Number.isSafeInteger(value), "CONTENT_FLAG_POLICY");
        if (def.policy.overflow === "saturate") value = Math.max(def.policy.min, Math.min(def.policy.max, value));
      } else reject("CONTENT_CAPABILITY");
      requireFact(validFlag(def, value), "CONTENT_FLAG_POLICY");
      requireFact(def.policy.kind !== "marker" || record.value !== true || value === true, "CONTENT_FLAG_POLICY");
      record.value = value;
    }
    requireFact(next.metrics.hp > 0 && next.metrics.sanity > 0, "CONTENT_CRISIS_UNSUPPORTED");
    requireFact(nodeFor(next).act !== 1 || next.metrics.bond === 0, "CONTENT_BOND_INVARIANT");
    return next;
  }

  function capture(snapshot, node, at) {
    return { id: node.checkpointId, capturedAt: at, treeId: snapshot.currentTreeId, nodeId: node.id,
      state: STATES[node.type], metrics: copy(snapshot.metrics), flags: copy(snapshot.flags),
      eventOccurrences: copy(snapshot.eventOccurrences), rng: copy(snapshot.rng) };
  }

  function enter(snapshot, at) {
    const node = nodeFor(snapshot);
    requireFact(node && evaluateCondition(node.entryCondition, snapshot), "CONTENT_TARGET_GUARD");
    let next = copy(snapshot);
    if (node.checkpointPolicy === "before-node") next.checkpoint = capture(next, node, at);
    next = applyEffects(next, node.onEnterEffects);
    const eligible = eligibleEvents(next);
    for (const event of eligible) {
      if (occurrences(next, event.id) >= event.maxOccurrences) continue;
      next = applyEffects(next, event.resolution.effects);
      const record = next.eventOccurrences.find((item) => item.eventId === event.id);
      if (record) record.count += 1;
      else next.eventOccurrences.push({ eventId: event.id, count: 1 });
    }
    display(next, dialogueSequence(next)[0]);
    const ready = facts(next);
    if (node.type !== "cutscene") requireFact(ready.hasNextPage || ready.actions.some((action) => action.eligible), "CONTENT_DEADLOCK");
    return next;
  }

  function plan(snapshot, event, target, extra = {}) {
    const entryConditionMet = evaluateCondition(target.entryCondition, snapshot);
    const result = planGameStateTransition({ snapshot, event, context: {
      targetNodeType: target.type, targetNodeValid: Boolean(nodes[target.id]), entryConditionMet,
      eligibleChoiceCount: (target.choices ?? []).filter((choice) => evaluateCondition(choice.condition, snapshot)).length,
      hasRemainingBeat: Boolean(target.dialogueIds?.length), inputUnlocked: true, ...extra,
    } });
    requireFact(result.ok, "CONTENT_TRANSITION");
    return result.value;
  }

  function markComplete(snapshot) {
    if (!snapshot.progress.completedNodeIds.includes(snapshot.currentNodeId)) snapshot.progress.completedNodeIds.push(snapshot.currentNodeId);
  }

  function commandSnapshot(snapshot, command) {
    requireFact(command?.expectedRevision === snapshot.revision, "REVISION_MISMATCH");
    requireFact(Number.isSafeInteger(snapshot.revision) && snapshot.revision >= 1 && snapshot.revision < Number.MAX_SAFE_INTEGER, "REVISION_OVERFLOW");
    requireFact(typeof command.at === "string" && Number.isFinite(Date.parse(command.at)), "INVALID_COMMAND");
    requireFact(command.elapsedMs === undefined || (Number.isSafeInteger(command.elapsedMs) && command.elapsedMs >= 0), "INVALID_COMMAND");
    const next = copy(snapshot);
    next.revision += 1;
    next.playTimeMs = Math.min(315576000000, next.playTimeMs + (command.elapsedMs ?? 0));
    return next;
  }

  function start({ sessionId, at, revision = 1, rng = { algorithm: "xorshift32-v1", seed: 1, state: 1 } }) {
    return attempt(null, () => {
      requireFact(Number.isSafeInteger(revision) && revision > 0, "REVISION_OVERFLOW");
      const admission = planGameStateTransition({ snapshot: { state: "Title" }, event: "NEW_GAME", context: { confirmationComplete: true, entryReferencesValid: Boolean(nodes[catalog.entryNodeId]) } });
      requireFact(admission.ok, "CONTENT_TRANSITION");
      const snapshot = { sessionId, startedAt: at, playTimeMs: 0, revision, state: admission.value.target,
        currentTreeId: catalog.entryTreeId, currentNodeId: catalog.entryNodeId, metrics: copy(catalog.defaults.metrics),
        flags: definitions.map((def) => ({ id: def.id, value: def.defaultValue })).sort((a, b) => a.id < b.id ? -1 : 1),
        eventOccurrences: [], progress: { completedNodeIds: [], viewedDialogueIds: [], unlockedEndingIds: [] }, history: [], rng: copy(rng) };
      requireFact(nodes[snapshot.currentNodeId].checkpointPolicy === "before-node", "CONTENT_CHECKPOINT");
      return { snapshot: freeze(enter(snapshot, at)), transition: admission.value };
    });
  }

  function advance(snapshot, command) {
    return attempt(snapshot, () => {
      const current = facts(snapshot), node = nodeFor(snapshot);
      requireFact(current.canAdvance, "CONTENT_ACTION_UNAVAILABLE");
      let next = commandSnapshot(snapshot, command), transition = null;
      if (current.hasNextPage) {
        // Dialogue prefaces are presentation within the same domain node.
        if (node.type === "cutscene") transition = plan(snapshot, "ADVANCE_BEAT", node);
        display(next, dialogueSequence(snapshot)[current.cursor + 1]);
      } else {
        markComplete(next);
        if (node.completion) {
          next.checkpoint = capture(next, node, command.at);
        } else {
          const target = nodes[node.nextNodeId];
          requireFact(target, "CONTENT_TARGET_REFERENCE");
          const event = { cutscene: "ADVANCE_BEAT", exploration: "OPEN_EXPLORATION", decision: "REQUEST_DECISION" }[target.type];
          transition = plan(next, event, target);
          next.currentNodeId = target.id; next.currentTreeId = catalog.treeByNode[target.id]; next.state = transition.target;
          next = enter(next, command.at);
        }
      }
      return { snapshot: freeze(next), transition, reason: node.completion && !current.hasNextPage ? "checkpoint" : "lifecycle-suspend" };
    });
  }

  function act(snapshot, command) {
    return attempt(snapshot, () => {
      const current = facts(snapshot), node = nodeFor(snapshot);
      const action = [...(node.choices ?? []), ...(node.interactions ?? [])].find((item) => item.id === command.actionId);
      requireFact(current.actions.some((item) => item.id === command.actionId && item.eligible), "CONTENT_ACTION_UNAVAILABLE");
      const nextBase = commandSnapshot(snapshot, command);
      const projected = applyEffects(snapshot, action.effects), target = nodes[action.nextNodeId];
      requireFact(target && evaluateCondition(target.entryCondition, projected), "CONTENT_TARGET_GUARD");
      let next, transition;
      if (node.type === "decision") {
        const resolved = resolveChoiceTransaction({ snapshot, command: { id: `command.r${snapshot.revision}`, expectedRevision: command.expectedRevision, choiceId: action.id, committedAt: command.at },
          choice: action, flagDefinitions: definitions, flagPolicies: policies,
          target: { id: target.id, type: target.type, entryConditionMet: evaluateCondition(target.entryCondition, projected) },
        });
        requireFact(resolved.ok, resolved.error?.code ?? "CONTENT_TRANSACTION");
        next = copy(resolved.value.snapshot); transition = resolved.value.transitionPlan;
        next.playTimeMs = nextBase.playTimeMs;
      } else {
        const event = target.type === "cutscene" ? "EXIT_AREA" : target.type === "decision" ? "DECISION_READY" : null;
        transition = plan(projected, event, target, { exitGuardMet: evaluateCondition(action.condition, snapshot) });
        next = { ...projected, revision: nextBase.revision, playTimeMs: nextBase.playTimeMs, state: transition.target, currentNodeId: target.id };
      }
      if (!next.progress.completedNodeIds.includes(node.id)) next.progress.completedNodeIds.push(node.id);
      next.currentTreeId = catalog.treeByNode[target.id];
      next = enter(next, command.at);
      return { snapshot: freeze(next), transition, feedbackActionId: action.id, reason: "choice-committed" };
    });
  }

  function validateSnapshot(snapshot) {
    return attempt(snapshot, () => {
      const node = nodeFor(snapshot);
      requireFact(node && snapshot.state === STATES[node.type] && snapshot.currentTreeId === catalog.treeByNode[node.id], "CONTENT_SAVE_REFERENCE");
      validateFacts(snapshot);
      for (const id of snapshot.progress.completedNodeIds) requireFact(nodes[id], "CONTENT_SAVE_REFERENCE");
      for (const id of snapshot.progress.viewedDialogueIds) requireFact(catalog.dialogues[id], "CONTENT_SAVE_REFERENCE");
      requireFact(snapshot.progress.unlockedEndingIds.length === 0, "CONTENT_SAVE_REFERENCE");
      for (const entry of snapshot.history) {
        const owner = nodes[entry.nodeId];
        requireFact(owner?.choices?.some((choice) => choice.id === entry.actionId), "CONTENT_SAVE_REFERENCE");
      }
      requireFact(evaluateCondition(node.entryCondition, snapshot), "CONTENT_TARGET_GUARD");
      for (const effect of node.onEnterEffects.filter((effect) => effect.type === "set-flag")) {
        requireFact(flagValue(snapshot, effect.flagId) === effect.value, "CONTENT_ENTRY_NOT_APPLIED");
      }
      for (const event of events) {
        if (catalog.dominators[node.id].includes(event.trigger.nodeId) && evaluateCondition(event.conditions, snapshot)) {
          requireFact(occurrences(snapshot, event.id) > 0, "CONTENT_EVENT_PREREQUISITE");
        }
      }
      const checkpoint = snapshot.checkpoint, owner = nodes[checkpoint.nodeId];
      requireFact(owner && owner.checkpointId === checkpoint.id && checkpoint.treeId === catalog.treeByNode[owner.id] && checkpoint.state === STATES[owner.type], "CONTENT_CHECKPOINT");
      requireFact(catalog.dominators[node.id].includes(owner.id), "CONTENT_CHECKPOINT");
      validateFacts(checkpoint);
      const presentation = facts(snapshot);
      if (presentation.complete) {
        requireFact(presentation.cursor === presentation.pageCount - 1 && checkpoint.nodeId === node.id, "CONTENT_CURSOR");
      }
      if (owner.checkpointPolicy === "after-node") requireFact(presentation.complete && owner.id === node.id, "CONTENT_CHECKPOINT");
      requireFact(presentation.canAdvance || presentation.complete || presentation.actions.some((action) => action.eligible), "CONTENT_DEADLOCK");
      return { snapshot: freeze(copy(snapshot)), facts: presentation };
    });
  }

  function validateFacts(snapshot) {
    requireFact(snapshot.metrics.hp > 0 && snapshot.metrics.sanity > 0 && snapshot.metrics.bond === 0, "CONTENT_SAVE_METRICS");
    requireFact(snapshot.flags.length === definitions.length && new Set(snapshot.flags.map((flag) => flag.id)).size === definitions.length, "CONTENT_FLAG_POLICY");
    for (const def of definitions) requireFact(validFlag(def, flagValue(snapshot, def.id)), "CONTENT_FLAG_POLICY");
    const ids = new Set();
    for (const record of snapshot.eventOccurrences) {
      const event = events.find((item) => item.id === record.eventId);
      requireFact(event && !ids.has(record.eventId) && Number.isInteger(record.count) && record.count >= 1 && record.count <= event.maxOccurrences, "CONTENT_EVENT_REFERENCE");
      ids.add(record.eventId);
    }
  }

  function resume(snapshot) {
    return attempt(snapshot, () => {
      const checked = validateSnapshot(snapshot);
      requireFact(checked.ok, checked.error?.code ?? "CONTENT_SAVE_REFERENCE");
      const admission = planGameStateTransition({ snapshot: { state: "Title" }, event: "CONTINUE", context: { compatibleRecoveredSave: true } });
      requireFact(admission.ok, "CONTENT_TRANSITION");
      const node = nodeFor(snapshot), transitions = [admission.value];
      if (node.type !== "cutscene") {
        transitions.push(plan({ state: admission.value.target, metrics: snapshot.metrics, flags: snapshot.flags }, node.type === "decision" ? "REQUEST_DECISION" : "OPEN_EXPLORATION", node));
      }
      return { snapshot: checked.value.snapshot, transitions };
    });
  }

  function retry(snapshot, command) {
    return attempt(snapshot, () => {
      const next = commandSnapshot(snapshot, command), checkpoint = snapshot.checkpoint, target = nodes[checkpoint.nodeId];
      requireFact(target && checkpoint.id === target.checkpointId, "CONTENT_CHECKPOINT");
      const admission = planGameStateTransition({ snapshot, event: "RETRY_CHECKPOINT", context: { checkpointValid: true, contentReferencesCompatible: true } });
      requireFact(admission.ok, "CONTENT_TRANSITION");
      Object.assign(next, { currentNodeId: target.id, currentTreeId: checkpoint.treeId, state: STATES[target.type], metrics: copy(checkpoint.metrics), flags: copy(checkpoint.flags), eventOccurrences: copy(checkpoint.eventOccurrences), rng: copy(checkpoint.rng) });
      if (target.checkpointPolicy === "before-node") {
        // Read-history remains historical; completion after this checkpoint
        // must be acknowledged again, including the final rest boundary.
        const descendants = new Set([target.id]), queue = [target.id];
        for (const id of queue) {
          const node = nodes[id];
          const targets = [node.nextNodeId, ...(node.choices ?? []).map((choice) => choice.nextNodeId), ...(node.interactions ?? []).map((action) => action.nextNodeId)].filter(Boolean);
          for (const nextId of targets) if (!descendants.has(nextId)) { descendants.add(nextId); queue.push(nextId); }
        }
        next.progress.completedNodeIds = next.progress.completedNodeIds.filter((id) => !descendants.has(id));
      }
      if (target.type !== "cutscene") plan({ ...next, state: "Cutscene" }, target.type === "decision" ? "REQUEST_DECISION" : "OPEN_EXPLORATION", target);
      const restored = target.checkpointPolicy === "before-node" ? enter(next, command.at) : next;
      return { snapshot: freeze(restored), transition: admission.value, reason: "checkpoint" };
    });
  }

  function touch(snapshot, command) {
    return attempt(snapshot, () => ({ snapshot: freeze(commandSnapshot(snapshot, command)) }));
  }

  return Object.freeze({ start, advance, act, resume, retry, facts, validateSnapshot, touch });
}

function validFlag(def, value) {
  if (def.valueType === "boolean") return typeof value === "boolean";
  if (def.valueType === "string") return typeof value === "string" && def.policy.values.includes(value);
  return Number.isSafeInteger(value) && value >= def.policy.min && value <= def.policy.max;
}
