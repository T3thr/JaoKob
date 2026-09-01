import {
  METER_NAMES,
  MeterInvariantError,
  applyMetricEffects,
  createMetrics,
} from "../domain/meters.js";
import { planGameStateTransition } from "../state-machine/game-state.js";

/**
 * Atomic, deterministic resolver for a single choice command.
 *
 * The resolver has no port, clock, random, browser, storage, or renderer
 * dependency. The caller supplies committedAt and performs the final
 * compare-and-swap of the returned revision. A failure returns the original
 * snapshot reference and never exposes a partially changed candidate.
 *
 * Trace: FR-ENG-002, FR-ENG-003, FR-STA-003, TR-012..TR-015, ADR-P0-004.
 */

const IDENTIFIER_PATTERN = /^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)*$/;
const MAX_FLAGS = 5000;
const MAX_EFFECTS = 64;
const MAX_HISTORY = 200;
const MAX_CONDITION_DEPTH = 64;
const MAX_CONDITION_NODES = 4096;
const FLAG_INTEGER_MIN = -1000000;
const FLAG_INTEGER_MAX = 1000000;

export const CHOICE_ERROR_CODES = Object.freeze({
  INVALID_REQUEST: "INVALID_REQUEST",
  INVALID_SNAPSHOT: "INVALID_SNAPSHOT",
  INVALID_STATE: "INVALID_STATE",
  INPUT_LOCKED: "INPUT_LOCKED",
  INVALID_COMMAND: "INVALID_COMMAND",
  REVISION_MISMATCH: "REVISION_MISMATCH",
  REVISION_OVERFLOW: "REVISION_OVERFLOW",
  INVALID_CHOICE: "INVALID_CHOICE",
  CHOICE_MISMATCH: "CHOICE_MISMATCH",
  CHOICE_UNAVAILABLE: "CHOICE_UNAVAILABLE",
  INVALID_CONDITION: "INVALID_CONDITION",
  INVALID_EFFECT: "INVALID_EFFECT",
  EFFECT_CONFLICT: "EFFECT_CONFLICT",
  INVALID_FLAG_REGISTRY: "INVALID_FLAG_REGISTRY",
  INVALID_FLAG_SNAPSHOT: "INVALID_FLAG_SNAPSHOT",
  UNKNOWN_FLAG: "UNKNOWN_FLAG",
  FLAG_TYPE_MISMATCH: "FLAG_TYPE_MISMATCH",
  FLAG_POLICY_REQUIRED: "FLAG_POLICY_REQUIRED",
  FLAG_NOT_REVERSIBLE: "FLAG_NOT_REVERSIBLE",
  FLAG_OVERFLOW: "FLAG_OVERFLOW",
  INVALID_TARGET: "INVALID_TARGET",
  TARGET_MISMATCH: "TARGET_MISMATCH",
  TARGET_GUARD_REJECTED: "TARGET_GUARD_REJECTED",
  INVALID_TRANSITION: "INVALID_TRANSITION",
  CHECKPOINT_CONTEXT_REQUIRED: "CHECKPOINT_CONTEXT_REQUIRED",
  NON_JSON_DOMAIN_VALUE: "NON_JSON_DOMAIN_VALUE",
});

export const CHOICE_OUTCOMES = Object.freeze({
  CONTINUE: "continue",
  CRISIS: "crisis",
  RECOVERY: "recovery",
  ENDING: "ending",
});

export const CRISIS_REASONS = Object.freeze({
  PHYSICAL_COLLAPSE: "physical_collapse",
  EMOTIONAL_OVERWHELM: "emotional_overwhelm",
});

/**
 * Typed error used internally and by the standalone condition evaluator.
 */
export class ChoiceTransactionError extends Error {
  /**
   * @param {string} code Stable machine-readable error code.
   * @param {string} message Developer-facing explanation.
   * @param {Readonly<Record<string, unknown>>} [details]
   */
  constructor(code, message, details = {}) {
    super(message);
    this.name = "ChoiceTransactionError";
    this.code = code;
    this.details = Object.freeze({ ...details });
  }
}

/**
 * Evaluate a common.schema.json condition against one pre-choice snapshot.
 * This function is pure and evaluates every branch so malformed trailing
 * branches cannot be hidden by boolean short-circuiting.
 *
 * @param {unknown} condition
 * @param {unknown} snapshot Snapshot containing schema-compatible metrics and flags.
 * @returns {boolean}
 * @throws {ChoiceTransactionError} When the condition or snapshot is malformed.
 */
export function evaluateCondition(condition, snapshot) {
  if (!isRecord(snapshot)) {
    throw choiceError("INVALID_SNAPSHOT", "Condition snapshot must be an object.");
  }
  let metrics;
  try {
    metrics = createMetrics(snapshot.metrics);
  } catch (error) {
    throw wrapMeterError(error);
  }
  const flags = readFlagEntries(snapshot.flags, null);
  const budget = { nodes: 0 };
  return evaluateConditionNode(condition, metrics, flags, 0, budget);
}

/**
 * Resolve one choice as an all-or-nothing immutable transaction.
 *
 * Expected request fields:
 * - snapshot: domain snapshot in Decision with revision, currentNodeId,
 *   metrics, flags, and history.
 * - command: {id, expectedRevision, choiceId, committedAt}.
 * - choice: normalized schema choice with id, condition, effects, nextNodeId.
 * - flagDefinitions: schema flag definitions; all defaults must be materialized
 *   in snapshot.flags.
 * - flagPolicies: optional trusted semantic policy keyed by flag ID.
 * - target: declared next-node facts. Crisis and Story Assist recovery require
 *   crisisTarget and recoveryTarget respectively.
 *
 * @param {unknown} request
 * @returns {
 *   Readonly<{ok: true, value: Readonly<Record<string, unknown>>}> |
 *   Readonly<{ok: false, error: Readonly<Record<string, unknown>>, snapshot: unknown}>
 * }
 */
export function resolveChoiceTransaction(request) {
  const originalSnapshot = isRecord(request) ? request.snapshot : undefined;

  try {
    assertRecord(request, "INVALID_REQUEST", "request");
    const snapshot = validateSnapshot(request.snapshot);
    const inputLocked = request.inputLocked === undefined ? false : request.inputLocked;
    if (typeof inputLocked !== "boolean") {
      throw choiceError("INVALID_REQUEST", "inputLocked must be a boolean.");
    }
    if (inputLocked) {
      throw choiceError("INPUT_LOCKED", "A choice transaction is already active.");
    }

    const storyAssistEnabled = request.storyAssistEnabled === undefined
      ? false
      : request.storyAssistEnabled;
    if (typeof storyAssistEnabled !== "boolean") {
      throw choiceError("INVALID_REQUEST", "storyAssistEnabled must be a boolean.");
    }

    const command = validateCommand(request.command);
    if (command.expectedRevision !== snapshot.revision) {
      throw choiceError(
        "REVISION_MISMATCH",
        "Command expectedRevision does not match the current snapshot.",
        { expectedRevision: command.expectedRevision, actualRevision: snapshot.revision },
      );
    }
    if (snapshot.revision === Number.MAX_SAFE_INTEGER) {
      throw choiceError("REVISION_OVERFLOW", "Snapshot revision cannot be incremented.");
    }

    const choice = validateChoice(request.choice);
    if (command.choiceId !== choice.id) {
      throw choiceError(
        "CHOICE_MISMATCH",
        "Command choiceId does not match the resolved choice.",
        { commandChoiceId: command.choiceId, choiceId: choice.id },
      );
    }

    const registry = buildFlagRegistry(request.flagDefinitions);
    const policies = validateFlagPolicies(request.flagPolicies);
    const preFlags = readFlagEntries(snapshot.flags, registry);

    const conditionSnapshot = { metrics: snapshot.metrics, flags: snapshot.flags };
    if (!evaluateCondition(choice.condition, conditionSnapshot)) {
      throw choiceError(
        "CHOICE_UNAVAILABLE",
        "Choice condition is false for the pre-choice snapshot.",
        { choiceId: choice.id },
      );
    }

    const effectPlan = planEffects(choice.effects);
    let metricsAfterEffects;
    try {
      metricsAfterEffects = applyMetricEffects(snapshot.metrics, effectPlan.metricEffects);
    } catch (error) {
      throw wrapMeterError(error);
    }

    const flagsAfterEffects = applyFlagEffects(
      preFlags,
      effectPlan.flagEffects,
      registry,
      policies,
    );

    const crisisReason = resolveCrisisReason(metricsAfterEffects);
    const assistedMetrics = crisisReason !== null && storyAssistEnabled
      ? createMetrics({
        hp: Math.max(1, metricsAfterEffects.hp),
        sanity: Math.max(1, metricsAfterEffects.sanity),
        bond: metricsAfterEffects.bond,
      })
      : metricsAfterEffects;

    const outcomeSelection = selectOutcome({
      choice,
      target: request.target,
      crisisTarget: request.crisisTarget,
      recoveryTarget: request.recoveryTarget,
      crisisReason,
      storyAssistEnabled,
    });

    const transitionSnapshot = {
      ...snapshot,
      metrics: assistedMetrics,
      flags: flagsAfterEffects,
    };
    const transitionResult = planGameStateTransition({
      snapshot: transitionSnapshot,
      event: outcomeSelection.event,
      context: outcomeSelection.context,
    });
    if (!transitionResult.ok) {
      throw choiceError(
        "INVALID_TRANSITION",
        "Choice outcome did not satisfy the normative transition guard.",
        {
          transitionCode: transitionResult.error.code,
          transitionReason: transitionResult.error.reason,
        },
      );
    }

    const nextRevision = snapshot.revision + 1;
    const history = appendHistory(
      snapshot.history,
      snapshot.currentNodeId,
      choice.id,
      command.committedAt,
      assistedMetrics,
    );

    const candidate = {
      ...snapshot,
      state: transitionResult.value.target,
      revision: nextRevision,
      currentNodeId: outcomeSelection.target.id,
      metrics: assistedMetrics,
      flags: flagsAfterEffects,
      history,
    };

    if (effectPlan.checkpointId !== null) {
      candidate.checkpoint = createCheckpoint(
        effectPlan.checkpointId,
        command.committedAt,
        candidate,
      );
    }

    const value = cloneAndFreezeJson({
      commandId: command.id,
      choiceId: choice.id,
      snapshot: candidate,
      transitionPlan: transitionResult.value,
      outcome: {
        kind: outcomeSelection.kind,
        crisisReason: outcomeSelection.kind === CHOICE_OUTCOMES.CRISIS
          ? crisisReason
          : null,
      },
      effectSummary: buildEffectSummary(
        snapshot.metrics,
        assistedMetrics,
        preFlags,
        flagsAfterEffects,
        effectPlan.checkpointId,
      ),
    });

    return Object.freeze({ ok: true, value });
  } catch (error) {
    if (error instanceof ChoiceTransactionError) {
      return Object.freeze({
        ok: false,
        error: Object.freeze({
          code: error.code,
          reason: error.message,
          details: error.details,
        }),
        snapshot: originalSnapshot,
      });
    }
    throw error;
  }
}

/** @param {unknown} snapshot */
function validateSnapshot(snapshot) {
  assertRecord(snapshot, "INVALID_SNAPSHOT", "snapshot");
  if (snapshot.state !== "Decision") {
    throw choiceError(
      "INVALID_STATE",
      "Choice transactions are accepted only in Decision state.",
      { state: snapshot.state },
    );
  }
  if (!Number.isSafeInteger(snapshot.revision) || snapshot.revision < 1) {
    throw choiceError("INVALID_SNAPSHOT", "snapshot.revision must be a positive safe integer.");
  }
  assertIdentifier(snapshot.currentNodeId, "snapshot.currentNodeId");
  try {
    createMetrics(snapshot.metrics);
  } catch (error) {
    throw wrapMeterError(error);
  }
  if (!Array.isArray(snapshot.flags) || snapshot.flags.length > MAX_FLAGS) {
    throw choiceError("INVALID_FLAG_SNAPSHOT", "snapshot.flags must be a bounded array.");
  }
  if (!Array.isArray(snapshot.history) || snapshot.history.length > MAX_HISTORY) {
    throw choiceError("INVALID_SNAPSHOT", "snapshot.history must be an array of at most 200 entries.");
  }
  validateExistingHistory(snapshot.history);
  return snapshot;
}

/** @param {unknown} command */
function validateCommand(command) {
  assertRecord(command, "INVALID_COMMAND", "command");
  if (typeof command.id !== "string" || command.id.length < 1 || command.id.length > 128) {
    throw choiceError("INVALID_COMMAND", "command.id must be a non-empty string of at most 128 characters.");
  }
  if (!Number.isSafeInteger(command.expectedRevision) || command.expectedRevision < 1) {
    throw choiceError("INVALID_COMMAND", "command.expectedRevision must be a positive safe integer.");
  }
  assertIdentifier(command.choiceId, "command.choiceId");
  if (!isDateTime(command.committedAt)) {
    throw choiceError("INVALID_COMMAND", "command.committedAt must be an RFC 3339 date-time string.");
  }
  return command;
}

/** @param {unknown} choice */
function validateChoice(choice) {
  assertRecord(choice, "INVALID_CHOICE", "choice");
  assertIdentifier(choice.id, "choice.id");
  assertIdentifier(choice.nextNodeId, "choice.nextNodeId");
  if (!Array.isArray(choice.effects) || choice.effects.length > MAX_EFFECTS) {
    throw choiceError("INVALID_CHOICE", "choice.effects must be an array of at most 64 effects.");
  }
  if (!isRecord(choice.condition)) {
    throw choiceError("INVALID_CHOICE", "choice.condition must be an object.");
  }
  return choice;
}

/** @param {unknown} definitions */
function buildFlagRegistry(definitions) {
  if (!Array.isArray(definitions) || definitions.length > MAX_FLAGS) {
    throw choiceError("INVALID_FLAG_REGISTRY", "flagDefinitions must be a bounded array.");
  }
  const registry = new Map();
  for (let index = 0; index < definitions.length; index += 1) {
    const definition = definitions[index];
    assertRecord(definition, "INVALID_FLAG_REGISTRY", `flagDefinitions[${index}]`);
    assertIdentifier(definition.id, `flagDefinitions[${index}].id`);
    if (registry.has(definition.id)) {
      throw choiceError(
        "INVALID_FLAG_REGISTRY",
        "Flag registry contains a duplicate ID.",
        { flagId: definition.id },
      );
    }
    if (!["boolean", "integer", "string"].includes(definition.valueType)) {
      throw choiceError(
        "INVALID_FLAG_REGISTRY",
        "Flag definition has an unsupported valueType.",
        { flagId: definition.id, valueType: definition.valueType },
      );
    }
    assertFlagValue(definition.defaultValue, definition.valueType, definition.id);
    registry.set(definition.id, definition);
  }
  return registry;
}

/** @param {unknown} policies */
function validateFlagPolicies(policies) {
  if (policies === undefined) {
    return {};
  }
  assertRecord(policies, "INVALID_FLAG_REGISTRY", "flagPolicies");
  return policies;
}

/**
 * @param {unknown} entries
 * @param {Map<string, Record<string, unknown>> | null} registry
 */
function readFlagEntries(entries, registry) {
  if (!Array.isArray(entries) || entries.length > MAX_FLAGS) {
    throw choiceError("INVALID_FLAG_SNAPSHOT", "flags must be a bounded array.");
  }
  const flags = new Map();
  for (let index = 0; index < entries.length; index += 1) {
    const entry = entries[index];
    assertRecord(entry, "INVALID_FLAG_SNAPSHOT", `flags[${index}]`);
    assertIdentifier(entry.id, `flags[${index}].id`);
    if (flags.has(entry.id)) {
      throw choiceError(
        "INVALID_FLAG_SNAPSHOT",
        "Flag snapshot contains a duplicate ID.",
        { flagId: entry.id },
      );
    }
    if (registry !== null) {
      const definition = registry.get(entry.id);
      if (definition === undefined) {
        throw choiceError("UNKNOWN_FLAG", "Snapshot contains an unregistered flag.", { flagId: entry.id });
      }
      assertFlagValue(entry.value, definition.valueType, entry.id);
    } else {
      assertSchemaFlagValue(entry.value, entry.id);
    }
    flags.set(entry.id, entry.value);
  }

  if (registry !== null) {
    for (const flagId of registry.keys()) {
      if (!flags.has(flagId)) {
        throw choiceError(
          "INVALID_FLAG_SNAPSHOT",
          "All registry defaults must be materialized in the snapshot.",
          { flagId },
        );
      }
    }
  }
  return flags;
}

/** @param {unknown} effects */
function planEffects(effects) {
  const metricEffects = [];
  const flagEffects = [];
  const seenFlagOperations = new Set();
  let checkpointId = null;

  for (let index = 0; index < effects.length; index += 1) {
    const effect = effects[index];
    assertRecord(effect, "INVALID_EFFECT", `effects[${index}]`);
    switch (effect.type) {
      case "adjust-metric":
      case "set-metric":
        metricEffects.push(effect);
        break;
      case "set-flag":
      case "adjust-flag":
      case "clear-flag":
        assertIdentifier(effect.flagId, `effects[${index}].flagId`);
        if (seenFlagOperations.has(effect.flagId)) {
          throw choiceError(
            "EFFECT_CONFLICT",
            "A transaction may declare only one flag operation per flag.",
            { flagId: effect.flagId },
          );
        }
        seenFlagOperations.add(effect.flagId);
        flagEffects.push(effect);
        break;
      case "set-checkpoint":
        assertIdentifier(effect.checkpointId, `effects[${index}].checkpointId`);
        if (checkpointId !== null) {
          throw choiceError(
            "EFFECT_CONFLICT",
            "A transaction may declare at most one checkpoint effect.",
          );
        }
        checkpointId = effect.checkpointId;
        break;
      default:
        throw choiceError(
          "INVALID_EFFECT",
          "Effect type is not in the schema allowlist.",
          { index, type: effect.type },
        );
    }
  }
  return { metricEffects, flagEffects, checkpointId };
}

/**
 * @param {Map<string, unknown>} preFlags
 * @param {Array<Record<string, unknown>>} effects
 * @param {Map<string, Record<string, unknown>>} registry
 * @param {Record<string, unknown>} policies
 */
function applyFlagEffects(preFlags, effects, registry, policies) {
  const next = new Map(preFlags);
  for (const effect of effects) {
    const definition = registry.get(effect.flagId);
    if (definition === undefined) {
      throw choiceError("UNKNOWN_FLAG", "Effect references an unregistered flag.", { flagId: effect.flagId });
    }
    const policy = Object.prototype.hasOwnProperty.call(policies, effect.flagId)
      ? policies[effect.flagId]
      : undefined;
    const current = next.get(effect.flagId);

    if (effect.type === "set-flag") {
      assertFlagValue(effect.value, definition.valueType, effect.flagId);
      assertMarkerMutationAllowed(current, effect.value, definition, policy);
      next.set(effect.flagId, effect.value);
      continue;
    }

    if (effect.type === "clear-flag") {
      assertFlagClearAllowed(current, definition, policy);
      next.set(effect.flagId, definition.defaultValue);
      continue;
    }

    if (definition.valueType !== "integer" || !Number.isSafeInteger(current)) {
      throw choiceError(
        "FLAG_TYPE_MISMATCH",
        "adjust-flag requires an integer flag.",
        { flagId: effect.flagId },
      );
    }
    if (!Number.isSafeInteger(effect.amount)) {
      throw choiceError(
        "FLAG_TYPE_MISMATCH",
        "adjust-flag amount must be a safe integer.",
        { flagId: effect.flagId },
      );
    }
    const counterPolicy = validateCounterPolicy(policy, effect.flagId);
    const arithmetic = current + effect.amount;
    if (!Number.isSafeInteger(arithmetic)) {
      throw choiceError("FLAG_OVERFLOW", "Flag arithmetic exceeded safe integer range.", { flagId: effect.flagId });
    }
    let adjusted = arithmetic;
    if (arithmetic < counterPolicy.min || arithmetic > counterPolicy.max) {
      if (counterPolicy.overflow === "reject") {
        throw choiceError(
          "FLAG_OVERFLOW",
          "Counter policy rejected an out-of-range result.",
          { flagId: effect.flagId },
        );
      }
      adjusted = Math.min(counterPolicy.max, Math.max(counterPolicy.min, arithmetic));
    }
    assertFlagValue(adjusted, "integer", effect.flagId);
    next.set(effect.flagId, adjusted);
  }

  return Object.freeze(
    [...next.entries()]
      .sort(([left], [right]) => codePointCompare(left, right))
      .map(([id, value]) => Object.freeze({ id, value })),
  );
}

/** @param {unknown} policy @param {string} flagId */
function validateCounterPolicy(policy, flagId) {
  if (!isRecord(policy) || policy.kind !== "counter") {
    throw choiceError(
      "FLAG_POLICY_REQUIRED",
      "adjust-flag requires an explicit counter policy.",
      { flagId },
    );
  }
  if (!Number.isSafeInteger(policy.min)
    || !Number.isSafeInteger(policy.max)
    || policy.min < FLAG_INTEGER_MIN
    || policy.max > FLAG_INTEGER_MAX
    || policy.min > policy.max
    || !["saturate", "reject"].includes(policy.overflow)) {
    throw choiceError(
      "FLAG_POLICY_REQUIRED",
      "Counter policy must define valid min, max, and overflow semantics.",
      { flagId },
    );
  }
  return policy;
}

/**
 * @param {unknown} current
 * @param {unknown} next
 * @param {Record<string, unknown>} definition
 * @param {unknown} policy
 */
function assertMarkerMutationAllowed(current, next, definition, policy) {
  if (!isRecord(policy) || policy.kind !== "marker") {
    return;
  }
  if (definition.valueType !== "boolean") {
    throw choiceError("FLAG_POLICY_REQUIRED", "Marker policy requires a boolean flag.", { flagId: definition.id });
  }
  if (current === true && next !== true && policy.reversible !== true) {
    throw choiceError("FLAG_NOT_REVERSIBLE", "A monotonic marker cannot be unset.", { flagId: definition.id });
  }
}

/**
 * @param {unknown} current
 * @param {Record<string, unknown>} definition
 * @param {unknown} policy
 */
function assertFlagClearAllowed(current, definition, policy) {
  if (isRecord(policy) && policy.kind === "marker") {
    if (definition.valueType !== "boolean") {
      throw choiceError("FLAG_POLICY_REQUIRED", "Marker policy requires a boolean flag.", { flagId: definition.id });
    }
  }
  if (current !== definition.defaultValue
    && (!isRecord(policy) || policy.reversible !== true)) {
    throw choiceError(
      "FLAG_NOT_REVERSIBLE",
      "A flag cannot be reset without an explicit reversible policy.",
      { flagId: definition.id },
    );
  }
}

/**
 * @param {Record<string, unknown>} input
 */
function selectOutcome(input) {
  const {
    choice,
    target,
    crisisTarget,
    recoveryTarget,
    crisisReason,
    storyAssistEnabled,
  } = input;

  if (crisisReason !== null && storyAssistEnabled === false) {
    const selected = validateTarget(crisisTarget, ["game-over"], "crisisTarget");
    return {
      kind: CHOICE_OUTCOMES.CRISIS,
      event: "CRISIS_DETECTED",
      target: selected,
      context: { storyAssistEnabled: false },
    };
  }

  if (crisisReason !== null && storyAssistEnabled === true) {
    const selected = validateTarget(recoveryTarget, ["cutscene"], "recoveryTarget");
    return {
      kind: CHOICE_OUTCOMES.RECOVERY,
      event: "COMMIT_CHOICE",
      target: selected,
      context: choiceCommitContext(selected, false),
    };
  }

  const selected = validateTarget(target, ["cutscene", "exploration", "ending"], "target");
  if (selected.id !== choice.nextNodeId) {
    throw choiceError(
      "TARGET_MISMATCH",
      "Resolved target does not match choice.nextNodeId.",
      { expectedTargetId: choice.nextNodeId, targetId: selected.id },
    );
  }

  if (selected.type === "ending") {
    return {
      kind: CHOICE_OUTCOMES.ENDING,
      event: "ENDING_RESOLVED",
      target: selected,
      context: {
        finalGatePassed: selected.finalGatePassed === true,
        repairCompleted: selected.repairCompleted === true,
      },
    };
  }

  return {
    kind: CHOICE_OUTCOMES.CONTINUE,
    event: "COMMIT_CHOICE",
    target: selected,
    context: choiceCommitContext(selected, false),
  };
}

/** @param {Record<string, unknown>} target @param {boolean} endingResolved */
function choiceCommitContext(target, endingResolved) {
  return {
    choiceEligible: true,
    commandFresh: true,
    revisionMatches: true,
    targetNodeType: target.type,
    targetNodeValid: true,
    crisisDetected: false,
    endingResolved,
  };
}

/** @param {unknown} target @param {string[]} allowedTypes @param {string} field */
function validateTarget(target, allowedTypes, field) {
  assertRecord(target, "INVALID_TARGET", field);
  assertIdentifier(target.id, `${field}.id`);
  if (!allowedTypes.includes(target.type)) {
    throw choiceError(
      "INVALID_TARGET",
      `${field}.type is incompatible with this outcome.`,
      { field, type: target.type },
    );
  }
  if (target.entryConditionMet !== true) {
    throw choiceError(
      "TARGET_GUARD_REJECTED",
      `${field} entry condition was not satisfied by the candidate snapshot.`,
      { field, targetId: target.id },
    );
  }
  return target;
}

/** @param {Readonly<{hp:number, sanity:number, bond:number}>} metrics */
function resolveCrisisReason(metrics) {
  if (metrics.hp === 0) {
    return CRISIS_REASONS.PHYSICAL_COLLAPSE;
  }
  if (metrics.sanity === 0) {
    return CRISIS_REASONS.EMOTIONAL_OVERWHELM;
  }
  return null;
}

/**
 * @param {unknown[]} history
 * @param {string} nodeId
 * @param {string} actionId
 * @param {string} committedAt
 * @param {Readonly<Record<string, number>>} metricsAfter
 */
function appendHistory(history, nodeId, actionId, committedAt, metricsAfter) {
  const lastSequence = history.length === 0 ? 0 : history[history.length - 1].sequence;
  if (lastSequence === Number.MAX_SAFE_INTEGER) {
    throw choiceError("REVISION_OVERFLOW", "History sequence cannot be incremented.");
  }
  const entry = {
    sequence: lastSequence + 1,
    nodeId,
    actionId,
    committedAt,
    metricsAfter,
  };
  return Object.freeze([
    ...history.slice(-(MAX_HISTORY - 1)),
    Object.freeze(entry),
  ]);
}

/** @param {unknown[]} history */
function validateExistingHistory(history) {
  let previous = 0;
  for (let index = 0; index < history.length; index += 1) {
    const entry = history[index];
    assertRecord(entry, "INVALID_SNAPSHOT", `history[${index}]`);
    if (!Number.isSafeInteger(entry.sequence) || entry.sequence <= previous) {
      throw choiceError("INVALID_SNAPSHOT", "History sequence must be strictly increasing.", { index });
    }
    previous = entry.sequence;
  }
}

/**
 * @param {string} checkpointId
 * @param {string} capturedAt
 * @param {Record<string, unknown>} candidate
 */
function createCheckpoint(checkpointId, capturedAt, candidate) {
  if (!isIdentifier(candidate.currentTreeId)
    || !Array.isArray(candidate.eventOccurrences)
    || !isRecord(candidate.rng)) {
    throw choiceError(
      "CHECKPOINT_CONTEXT_REQUIRED",
      "Checkpoint effect requires currentTreeId, eventOccurrences, and rng.",
      { checkpointId },
    );
  }
  return {
    id: checkpointId,
    capturedAt,
    treeId: candidate.currentTreeId,
    nodeId: candidate.currentNodeId,
    state: candidate.state,
    metrics: candidate.metrics,
    flags: candidate.flags,
    eventOccurrences: candidate.eventOccurrences,
    rng: candidate.rng,
  };
}

/**
 * @param {Readonly<Record<string, number>>} beforeMetrics
 * @param {Readonly<Record<string, number>>} afterMetrics
 * @param {Map<string, unknown>} beforeFlags
 * @param {ReadonlyArray<Readonly<{id:string, value:unknown}>>} afterFlags
 * @param {string | null} checkpointId
 */
function buildEffectSummary(beforeMetrics, afterMetrics, beforeFlags, afterFlags, checkpointId) {
  const metricChanges = METER_NAMES
    .filter((name) => beforeMetrics[name] !== afterMetrics[name])
    .map((name) => ({
      metric: name,
      before: beforeMetrics[name],
      after: afterMetrics[name],
      delta: afterMetrics[name] - beforeMetrics[name],
    }));
  const flagChanges = afterFlags
    .filter(({ id, value }) => beforeFlags.get(id) !== value)
    .map(({ id, value }) => ({ id, before: beforeFlags.get(id), after: value }));
  return { metricChanges, flagChanges, checkpointId };
}

/**
 * @param {unknown} condition
 * @param {Readonly<Record<string, number>>} metrics
 * @param {Map<string, unknown>} flags
 * @param {number} depth
 * @param {{nodes:number}} budget
 */
function evaluateConditionNode(condition, metrics, flags, depth, budget) {
  if (depth > MAX_CONDITION_DEPTH || budget.nodes >= MAX_CONDITION_NODES) {
    throw choiceError("INVALID_CONDITION", "Condition exceeds deterministic evaluation limits.");
  }
  budget.nodes += 1;
  assertRecord(condition, "INVALID_CONDITION", "condition");

  if (Object.prototype.hasOwnProperty.call(condition, "all")) {
    assertConditionArray(condition.all, "all");
    const results = condition.all.map((item) =>
      evaluateConditionNode(item, metrics, flags, depth + 1, budget));
    return results.every((value) => value === true);
  }
  if (Object.prototype.hasOwnProperty.call(condition, "any")) {
    assertConditionArray(condition.any, "any");
    const results = condition.any.map((item) =>
      evaluateConditionNode(item, metrics, flags, depth + 1, budget));
    return results.some((value) => value === true);
  }
  if (Object.prototype.hasOwnProperty.call(condition, "not")) {
    return !evaluateConditionNode(condition.not, metrics, flags, depth + 1, budget);
  }

  switch (condition.kind) {
    case "always":
      return true;
    case "metric":
      if (!METER_NAMES.includes(condition.metric)
        || !Number.isSafeInteger(condition.value)
        || condition.value < 0
        || condition.value > 100) {
        throw choiceError("INVALID_CONDITION", "Metric condition is malformed.");
      }
      return compare(condition.operator, metrics[condition.metric], condition.value);
    case "flag": {
      assertIdentifier(condition.flagId, "condition.flagId");
      if (condition.operator === "exists") {
        return flags.has(condition.flagId);
      }
      if (condition.operator === "not-exists") {
        return !flags.has(condition.flagId);
      }
      if (condition.operator !== "eq" && condition.operator !== "neq") {
        throw choiceError("INVALID_CONDITION", "Flag condition operator is invalid.");
      }
      assertSchemaFlagValue(condition.value, condition.flagId);
      if (!flags.has(condition.flagId)) {
        return false;
      }
      return condition.operator === "eq"
        ? flags.get(condition.flagId) === condition.value
        : flags.get(condition.flagId) !== condition.value;
    }
    default:
      throw choiceError("INVALID_CONDITION", "Condition is not in the schema allowlist.");
  }
}

/** @param {unknown} value @param {string} key */
function assertConditionArray(value, key) {
  if (!Array.isArray(value) || value.length < 1 || value.length > 32) {
    throw choiceError("INVALID_CONDITION", `${key} condition must contain 1..32 children.`);
  }
}

/** @param {unknown} operator @param {number} left @param {number} right */
function compare(operator, left, right) {
  switch (operator) {
    case "eq": return left === right;
    case "neq": return left !== right;
    case "gt": return left > right;
    case "gte": return left >= right;
    case "lt": return left < right;
    case "lte": return left <= right;
    default:
      throw choiceError("INVALID_CONDITION", "Metric condition operator is invalid.");
  }
}

/** @param {unknown} value @param {unknown} valueType @param {string} flagId */
function assertFlagValue(value, valueType, flagId) {
  if (valueType === "boolean" && typeof value === "boolean") {
    return;
  }
  if (valueType === "integer"
    && Number.isSafeInteger(value)
    && value >= FLAG_INTEGER_MIN
    && value <= FLAG_INTEGER_MAX) {
    return;
  }
  if (valueType === "string" && typeof value === "string" && value.length <= 240) {
    return;
  }
  throw choiceError(
    "FLAG_TYPE_MISMATCH",
    "Flag value does not match its registered schema type.",
    { flagId, valueType },
  );
}

/** @param {unknown} value @param {string} flagId */
function assertSchemaFlagValue(value, flagId) {
  if (typeof value === "boolean") {
    return;
  }
  if (Number.isSafeInteger(value) && value >= FLAG_INTEGER_MIN && value <= FLAG_INTEGER_MAX) {
    return;
  }
  if (typeof value === "string" && value.length <= 240) {
    return;
  }
  throw choiceError("FLAG_TYPE_MISMATCH", "Flag value is outside the schema union.", { flagId });
}

/** @param {unknown} value @param {string} field */
function assertIdentifier(value, field) {
  if (!isIdentifier(value)) {
    throw choiceError("INVALID_REQUEST", `${field} must be a stable identifier.`, { field });
  }
}

/** @param {unknown} value */
function isIdentifier(value) {
  return typeof value === "string"
    && value.length <= 96
    && IDENTIFIER_PATTERN.test(value);
}

/** @param {unknown} value */
function isDateTime(value) {
  if (typeof value !== "string"
    || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(value)) {
    return false;
  }
  return !Number.isNaN(Date.parse(value));
}

/** @param {unknown} value @param {string} code @param {string} field */
function assertRecord(value, code, field) {
  if (!isRecord(value)) {
    throw choiceError(code, `${field} must be an object.`, { field });
  }
}

/** @param {unknown} value */
function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

/** @param {string} code @param {string} message @param {Readonly<Record<string, unknown>>} [details] */
function choiceError(code, message, details = {}) {
  return new ChoiceTransactionError(code, message, details);
}

/** @param {unknown} error */
function wrapMeterError(error) {
  if (error instanceof MeterInvariantError) {
    return choiceError(
      error.code === "METRIC_EFFECT_CONFLICT" ? "EFFECT_CONFLICT" : "INVALID_EFFECT",
      error.message,
      { meterCode: error.code, ...error.details },
    );
  }
  return error;
}

/** @param {string} left @param {string} right */
function codePointCompare(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

/**
 * Clone and deeply freeze JSON-domain data without structuredClone or browser
 * APIs. Cycles, undefined, functions, symbols, bigint, non-finite numbers, and
 * non-plain objects are rejected.
 *
 * @param {unknown} value
 * @param {WeakSet<object>} [ancestors]
 * @returns {unknown}
 */
function cloneAndFreezeJson(value, ancestors = new WeakSet()) {
  if (value === null || typeof value === "string" || typeof value === "boolean") {
    return value;
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw choiceError("NON_JSON_DOMAIN_VALUE", "Domain data contains a non-finite number.");
    }
    return value;
  }
  if (typeof value !== "object") {
    throw choiceError("NON_JSON_DOMAIN_VALUE", "Domain data contains a non-JSON value.");
  }
  if (ancestors.has(value)) {
    throw choiceError("NON_JSON_DOMAIN_VALUE", "Domain data contains a cycle.");
  }
  ancestors.add(value);

  let clone;
  if (Array.isArray(value)) {
    clone = value.map((item) => cloneAndFreezeJson(item, ancestors));
  } else {
    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) {
      throw choiceError("NON_JSON_DOMAIN_VALUE", "Domain data contains a non-plain object.");
    }
    clone = {};
    for (const key of Object.keys(value).sort(codePointCompare)) {
      clone[key] = cloneAndFreezeJson(value[key], ancestors);
    }
  }

  ancestors.delete(value);
  return Object.freeze(clone);
}
