/**
 * Deterministic finite-state transition planner.
 *
 * This module implements the normative TR-001..TR-020 table. It evaluates
 * guards and returns a plan only; it never applies domain actions, renders,
 * persists, or mutates the supplied snapshot.
 *
 * Trace: FR-STA-002, FR-STA-003, TR-001..TR-020, ADR-P0-004.
 */

export const INITIAL_SOURCE = "Initial";

export const GAME_STATES = Object.freeze([
  "Title",
  "Cutscene",
  "Exploration",
  "Decision",
  "GameOver",
  "Ending",
]);

export const GAME_EVENTS = Object.freeze([
  "BOOT_COMPLETED",
  "NEW_GAME",
  "CONTINUE",
  "ADVANCE_BEAT",
  "OPEN_EXPLORATION",
  "REQUEST_DECISION",
  "CRISIS_DETECTED",
  "ENDING_RESOLVED",
  "EVENT_TRIGGERED",
  "EXIT_AREA",
  "DECISION_READY",
  "COMMIT_CHOICE",
  "RETRY_CHECKPOINT",
  "ENABLE_ASSIST_AND_RETRY",
  "RETURN_TITLE",
  "EPILOGUE_COMPLETE",
  "CHAPTER_REPLAY",
]);

export const TRANSITION_ERROR_CODES = Object.freeze({
  INVALID_REQUEST: "INVALID_REQUEST",
  INVALID_STATE: "INVALID_STATE",
  INVALID_EVENT: "INVALID_EVENT",
  INVALID_CONTEXT: "INVALID_CONTEXT",
  INVALID_TRANSITION: "INVALID_TRANSITION",
  AMBIGUOUS_TRANSITION: "AMBIGUOUS_TRANSITION",
});

const RULES = Object.freeze([
  rule("TR-001", INITIAL_SOURCE, "BOOT_COMPLETED", "Title", (snapshot, context) =>
    context.contentValid === true && context.applicationComposed === true),
  rule("TR-002", "Title", "NEW_GAME", "Cutscene", (snapshot, context) =>
    context.confirmationComplete === true && context.entryReferencesValid === true),
  rule("TR-003", "Title", "CONTINUE", "Cutscene", (snapshot, context) =>
    context.compatibleRecoveredSave === true),
  rule("TR-004", "Cutscene", "ADVANCE_BEAT", "Cutscene", (snapshot, context) =>
    context.hasRemainingBeat === true && context.inputUnlocked === true),
  rule("TR-005", "Cutscene", "OPEN_EXPLORATION", "Exploration", (snapshot, context) =>
    context.targetNodeType === "exploration"
      && context.entryConditionMet === true
      && context.targetNodeValid === true),
  rule("TR-006", "Cutscene", "REQUEST_DECISION", "Decision", (snapshot, context) =>
    context.targetNodeType === "decision"
      && context.entryConditionMet === true
      && Number.isSafeInteger(context.eligibleChoiceCount)
      && context.eligibleChoiceCount >= 2),
  rule("TR-007", "Cutscene", "CRISIS_DETECTED", "GameOver", (snapshot, context) =>
    context.storyAssistEnabled === false && metricsIndicateCrisis(snapshot)),
  rule("TR-008", "Cutscene", "ENDING_RESOLVED", "Ending", (snapshot, context) =>
    context.finalContext === true && isNonEmptyString(context.endingId)),
  rule("TR-009", "Exploration", "EVENT_TRIGGERED", "Cutscene", (snapshot, context) =>
    context.eventEligible === true
      && context.occurrenceBelowMax === true
      && context.targetNodeType === "cutscene"
      && context.targetNodeValid === true),
  rule("TR-010", "Exploration", "EXIT_AREA", "Cutscene", (snapshot, context) =>
    context.exitGuardMet === true
      && context.targetNodeType === "cutscene"
      && context.targetNodeValid === true),
  rule("TR-011", "Exploration", "DECISION_READY", "Decision", (snapshot, context) =>
    context.targetNodeType === "decision"
      && context.entryConditionMet === true
      && context.targetNodeValid === true),
  rule("TR-012", "Decision", "COMMIT_CHOICE", "Cutscene", (snapshot, context) =>
    choiceCommitGuard(context, "cutscene")),
  rule("TR-013", "Decision", "COMMIT_CHOICE", "Exploration", (snapshot, context) =>
    choiceCommitGuard(context, "exploration")),
  rule("TR-014", "Decision", "CRISIS_DETECTED", "GameOver", (snapshot, context) =>
    context.storyAssistEnabled === false && metricsIndicateCrisis(snapshot)),
  rule("TR-015", "Decision", "ENDING_RESOLVED", "Ending", (snapshot, context) =>
    context.finalGatePassed === true || context.repairCompleted === true),
  rule("TR-016", "GameOver", "RETRY_CHECKPOINT", "Cutscene", (snapshot, context) =>
    context.checkpointValid === true && context.contentReferencesCompatible === true),
  rule("TR-017", "GameOver", "ENABLE_ASSIST_AND_RETRY", "Cutscene", (snapshot, context) =>
    context.settingsPersisted === true || context.memorySettingAccepted === true),
  rule("TR-018", "GameOver", "RETURN_TITLE", "Title", (snapshot, context) =>
    context.activeTransaction === false),
  rule("TR-019", "Ending", "EPILOGUE_COMPLETE", "Title", (snapshot, context) =>
    context.endingProgressCommitted === true),
  rule("TR-020", "Ending", "CHAPTER_REPLAY", "Cutscene", (snapshot, context) =>
    context.approvedReplayCheckpointExists === true),
]);

/**
 * Public, immutable transition matrix without executable guard functions.
 */
export const TRANSITION_TABLE = Object.freeze(
  RULES.map(({ id, source, event, target }) =>
    Object.freeze({ id, source, event, target })),
);

/**
 * @typedef {object} TransitionPlan
 * @property {string} transitionId
 * @property {string} source
 * @property {string} event
 * @property {string} target
 */

/**
 * Plan one state transition from an immutable snapshot.
 *
 * `snapshot` must be `null` only for TR-001. `Initial` is a pseudo-source and
 * is deliberately absent from GAME_STATES and every persisted state contract.
 * Context contains already validated facts; content never supplies functions.
 *
 * @param {unknown} request
 * @returns {
 *   Readonly<{ok: true, value: Readonly<TransitionPlan>}> |
 *   Readonly<{ok: false, error: Readonly<Record<string, unknown>>, snapshot: unknown}>
 * }
 */
export function planGameStateTransition(request) {
  if (!isRecord(request)) {
    return rejection(
      TRANSITION_ERROR_CODES.INVALID_REQUEST,
      "REQUEST_NOT_OBJECT",
      undefined,
      undefined,
      undefined,
    );
  }

  const { snapshot, event } = request;
  const context = request.context === undefined ? {} : request.context;
  if (!isRecord(context)) {
    return rejection(
      TRANSITION_ERROR_CODES.INVALID_CONTEXT,
      "CONTEXT_NOT_OBJECT",
      snapshot,
      sourceFromSnapshot(snapshot),
      event,
    );
  }

  const source = sourceFromSnapshot(snapshot);
  if (source === null) {
    return rejection(
      TRANSITION_ERROR_CODES.INVALID_STATE,
      "STATE_NOT_IN_ENUM",
      snapshot,
      snapshotState(snapshot),
      event,
    );
  }

  if (!GAME_EVENTS.includes(event)) {
    return rejection(
      TRANSITION_ERROR_CODES.INVALID_EVENT,
      "EVENT_NOT_IN_ENUM",
      snapshot,
      source,
      event,
    );
  }

  const candidates = RULES.filter(
    (transition) => transition.source === source && transition.event === event,
  );
  if (candidates.length === 0) {
    return rejection(
      TRANSITION_ERROR_CODES.INVALID_TRANSITION,
      "NO_TRANSITION",
      snapshot,
      source,
      event,
    );
  }

  const matches = candidates.filter((transition) => transition.guard(snapshot, context));
  if (matches.length === 0) {
    return rejection(
      TRANSITION_ERROR_CODES.INVALID_TRANSITION,
      "GUARD_REJECTED",
      snapshot,
      source,
      event,
      { transitionIds: Object.freeze(candidates.map(({ id }) => id)) },
    );
  }

  if (matches.length > 1) {
    return rejection(
      TRANSITION_ERROR_CODES.AMBIGUOUS_TRANSITION,
      "MULTIPLE_GUARDS_MATCHED",
      snapshot,
      source,
      event,
      { transitionIds: Object.freeze(matches.map(({ id }) => id)) },
    );
  }

  const selected = matches[0];
  return Object.freeze({
    ok: true,
    value: Object.freeze({
      transitionId: selected.id,
      source: selected.source,
      event: selected.event,
      target: selected.target,
    }),
  });
}

/**
 * @param {string} id
 * @param {string} source
 * @param {string} event
 * @param {string} target
 * @param {(snapshot: unknown, context: Record<string, unknown>) => boolean} guard
 */
function rule(id, source, event, target, guard) {
  return Object.freeze({ id, source, event, target, guard });
}

/** @param {Record<string, unknown>} context @param {string} targetNodeType */
function choiceCommitGuard(context, targetNodeType) {
  return context.choiceEligible === true
    && context.commandFresh === true
    && context.revisionMatches === true
    && context.targetNodeType === targetNodeType
    && context.targetNodeValid === true
    && context.crisisDetected === false
    && context.endingResolved === false;
}

/** @param {unknown} snapshot */
function metricsIndicateCrisis(snapshot) {
  if (!isRecord(snapshot) || !isRecord(snapshot.metrics)) {
    return false;
  }
  const { hp, sanity } = snapshot.metrics;
  return Number.isSafeInteger(hp)
    && Number.isSafeInteger(sanity)
    && (hp === 0 || sanity === 0);
}

/** @param {unknown} snapshot */
function sourceFromSnapshot(snapshot) {
  if (snapshot === null) {
    return INITIAL_SOURCE;
  }
  if (!isRecord(snapshot) || !GAME_STATES.includes(snapshot.state)) {
    return null;
  }
  return snapshot.state;
}

/** @param {unknown} snapshot */
function snapshotState(snapshot) {
  return isRecord(snapshot) ? snapshot.state : undefined;
}

/**
 * @param {string} code
 * @param {string} reason
 * @param {unknown} snapshot
 * @param {unknown} source
 * @param {unknown} event
 * @param {Readonly<Record<string, unknown>>} [details]
 */
function rejection(code, reason, snapshot, source, event, details = {}) {
  return Object.freeze({
    ok: false,
    error: Object.freeze({ code, reason, source, event, ...details }),
    snapshot,
  });
}

/** @param {unknown} value */
function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

/** @param {unknown} value */
function isNonEmptyString(value) {
  return typeof value === "string" && value.length > 0;
}
