import test from "node:test";
import assert from "node:assert/strict";

import {
  GAME_EVENTS,
  GAME_STATES,
  INITIAL_SOURCE,
  TRANSITION_ERROR_CODES,
  TRANSITION_TABLE,
  planGameStateTransition,
} from "../../src/core/state-machine/game-state.js";

function snapshot(state, overrides = {}) {
  return {
    state,
    revision: 7,
    metrics: { hp: 80, sanity: 70, bond: 0 },
    ...overrides,
  };
}

function assertFailure(result, code, originalSnapshot) {
  assert.equal(result.ok, false);
  assert.equal(result.error.code, code);
  assert.strictEqual(result.snapshot, originalSnapshot);
  assert.equal(Object.isFrozen(result), true);
  assert.equal(Object.isFrozen(result.error), true);
}

function deepFreeze(value) {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const nested of Object.values(value)) {
      deepFreeze(nested);
    }
    Object.freeze(value);
  }
  return value;
}

const POSITIVE_TRANSITIONS = [
  {
    id: "TR-001",
    snapshot: null,
    event: "BOOT_COMPLETED",
    context: { contentValid: true, applicationComposed: true },
    target: "Title",
  },
  {
    id: "TR-002",
    snapshot: snapshot("Title"),
    event: "NEW_GAME",
    context: { confirmationComplete: true, entryReferencesValid: true },
    target: "Cutscene",
  },
  {
    id: "TR-003",
    snapshot: snapshot("Title"),
    event: "CONTINUE",
    context: { compatibleRecoveredSave: true },
    target: "Cutscene",
  },
  {
    id: "TR-004",
    snapshot: snapshot("Cutscene"),
    event: "ADVANCE_BEAT",
    context: { hasRemainingBeat: true, inputUnlocked: true },
    target: "Cutscene",
  },
  {
    id: "TR-005",
    snapshot: snapshot("Cutscene"),
    event: "OPEN_EXPLORATION",
    context: {
      targetNodeType: "exploration",
      entryConditionMet: true,
      targetNodeValid: true,
    },
    target: "Exploration",
  },
  {
    id: "TR-006",
    snapshot: snapshot("Cutscene"),
    event: "REQUEST_DECISION",
    context: {
      targetNodeType: "decision",
      entryConditionMet: true,
      eligibleChoiceCount: 2,
    },
    target: "Decision",
  },
  {
    id: "TR-007",
    snapshot: snapshot("Cutscene", {
      metrics: { hp: 0, sanity: 70, bond: 0 },
    }),
    event: "CRISIS_DETECTED",
    context: { storyAssistEnabled: false },
    target: "GameOver",
  },
  {
    id: "TR-008",
    snapshot: snapshot("Cutscene"),
    event: "ENDING_RESOLVED",
    context: { finalContext: true, endingId: "end-home" },
    target: "Ending",
  },
  {
    id: "TR-009",
    snapshot: snapshot("Exploration"),
    event: "EVENT_TRIGGERED",
    context: {
      eventEligible: true,
      occurrenceBelowMax: true,
      targetNodeType: "cutscene",
      targetNodeValid: true,
    },
    target: "Cutscene",
  },
  {
    id: "TR-010",
    snapshot: snapshot("Exploration"),
    event: "EXIT_AREA",
    context: {
      exitGuardMet: true,
      targetNodeType: "cutscene",
      targetNodeValid: true,
    },
    target: "Cutscene",
  },
  {
    id: "TR-011",
    snapshot: snapshot("Exploration"),
    event: "DECISION_READY",
    context: {
      targetNodeType: "decision",
      entryConditionMet: true,
      targetNodeValid: true,
    },
    target: "Decision",
  },
  {
    id: "TR-012",
    snapshot: snapshot("Decision"),
    event: "COMMIT_CHOICE",
    context: {
      choiceEligible: true,
      commandFresh: true,
      revisionMatches: true,
      targetNodeType: "cutscene",
      targetNodeValid: true,
      crisisDetected: false,
      endingResolved: false,
    },
    target: "Cutscene",
  },
  {
    id: "TR-013",
    snapshot: snapshot("Decision"),
    event: "COMMIT_CHOICE",
    context: {
      choiceEligible: true,
      commandFresh: true,
      revisionMatches: true,
      targetNodeType: "exploration",
      targetNodeValid: true,
      crisisDetected: false,
      endingResolved: false,
    },
    target: "Exploration",
  },
  {
    id: "TR-014",
    snapshot: snapshot("Decision", {
      metrics: { hp: 80, sanity: 0, bond: 0 },
    }),
    event: "CRISIS_DETECTED",
    context: { storyAssistEnabled: false },
    target: "GameOver",
  },
  {
    id: "TR-015",
    snapshot: snapshot("Decision"),
    event: "ENDING_RESOLVED",
    context: { finalGatePassed: true, repairCompleted: false },
    target: "Ending",
  },
  {
    id: "TR-016",
    snapshot: snapshot("GameOver"),
    event: "RETRY_CHECKPOINT",
    context: { checkpointValid: true, contentReferencesCompatible: true },
    target: "Cutscene",
  },
  {
    id: "TR-017",
    snapshot: snapshot("GameOver"),
    event: "ENABLE_ASSIST_AND_RETRY",
    context: { settingsPersisted: true, memorySettingAccepted: false },
    target: "Cutscene",
  },
  {
    id: "TR-018",
    snapshot: snapshot("GameOver"),
    event: "RETURN_TITLE",
    context: { activeTransaction: false },
    target: "Title",
  },
  {
    id: "TR-019",
    snapshot: snapshot("Ending"),
    event: "EPILOGUE_COMPLETE",
    context: { endingProgressCommitted: true },
    target: "Title",
  },
  {
    id: "TR-020",
    snapshot: snapshot("Ending"),
    event: "CHAPTER_REPLAY",
    context: { approvedReplayCheckpointExists: true },
    target: "Cutscene",
  },
];

test("FR-STA-002 publishes only the six schema-compatible states", () => {
  assert.deepEqual(GAME_STATES, [
    "Title",
    "Cutscene",
    "Exploration",
    "Decision",
    "GameOver",
    "Ending",
  ]);
  assert.equal(GAME_STATES.includes(INITIAL_SOURCE), false);
  assert.equal(Object.isFrozen(GAME_STATES), true);
  assert.equal(new Set(GAME_STATES).size, GAME_STATES.length);
});

test("FR-STA-003 publishes a unique immutable TR-001..TR-020 table", () => {
  const expectedIds = Array.from(
    { length: 20 },
    (_, index) => `TR-${String(index + 1).padStart(3, "0")}`,
  );

  assert.deepEqual(TRANSITION_TABLE.map(({ id }) => id), expectedIds);
  assert.equal(new Set(TRANSITION_TABLE.map(({ id }) => id)).size, 20);
  assert.equal(Object.isFrozen(TRANSITION_TABLE), true);
  for (const transition of TRANSITION_TABLE) {
    assert.equal(Object.isFrozen(transition), true);
    assert.equal(GAME_EVENTS.includes(transition.event), true);
    assert.equal(
      transition.source === INITIAL_SOURCE || GAME_STATES.includes(transition.source),
      true,
    );
    assert.equal(GAME_STATES.includes(transition.target), true);
  }
});

test("TR-001..TR-020 each produce exactly one deterministic transition plan", async (t) => {
  assert.equal(POSITIVE_TRANSITIONS.length, 20);

  for (const scenario of POSITIVE_TRANSITIONS) {
    await t.test(scenario.id, () => {
      const result = planGameStateTransition({
        snapshot: scenario.snapshot,
        event: scenario.event,
        context: scenario.context,
      });

      assert.equal(result.ok, true);
      assert.deepEqual(result.value, {
        transitionId: scenario.id,
        source: scenario.snapshot === null ? INITIAL_SOURCE : scenario.snapshot.state,
        event: scenario.event,
        target: scenario.target,
      });
      assert.equal(Object.isFrozen(result), true);
      assert.equal(Object.isFrozen(result.value), true);
    });
  }
});

const GUARD_REJECTIONS = [
  ["TR-001 content invalid", null, "BOOT_COMPLETED", { contentValid: false, applicationComposed: true }],
  ["TR-001 application not composed", null, "BOOT_COMPLETED", { contentValid: true, applicationComposed: false }],
  ["TR-002 confirmation incomplete", snapshot("Title"), "NEW_GAME", { confirmationComplete: false, entryReferencesValid: true }],
  ["TR-002 entry references invalid", snapshot("Title"), "NEW_GAME", { confirmationComplete: true, entryReferencesValid: false }],
  ["TR-003 no compatible save", snapshot("Title"), "CONTINUE", { compatibleRecoveredSave: false }],
  ["TR-004 no remaining beat", snapshot("Cutscene"), "ADVANCE_BEAT", { hasRemainingBeat: false, inputUnlocked: true }],
  ["TR-004 input locked", snapshot("Cutscene"), "ADVANCE_BEAT", { hasRemainingBeat: true, inputUnlocked: false }],
  ["TR-005 wrong target type", snapshot("Cutscene"), "OPEN_EXPLORATION", { targetNodeType: "decision", entryConditionMet: true, targetNodeValid: true }],
  ["TR-005 entry condition false", snapshot("Cutscene"), "OPEN_EXPLORATION", { targetNodeType: "exploration", entryConditionMet: false, targetNodeValid: true }],
  ["TR-005 target invalid", snapshot("Cutscene"), "OPEN_EXPLORATION", { targetNodeType: "exploration", entryConditionMet: true, targetNodeValid: false }],
  ["TR-006 wrong target type", snapshot("Cutscene"), "REQUEST_DECISION", { targetNodeType: "exploration", entryConditionMet: true, eligibleChoiceCount: 2 }],
  ["TR-006 entry condition false", snapshot("Cutscene"), "REQUEST_DECISION", { targetNodeType: "decision", entryConditionMet: false, eligibleChoiceCount: 2 }],
  ["TR-006 fewer than two choices", snapshot("Cutscene"), "REQUEST_DECISION", { targetNodeType: "decision", entryConditionMet: true, eligibleChoiceCount: 1 }],
  ["TR-006 invalid choice count", snapshot("Cutscene"), "REQUEST_DECISION", { targetNodeType: "decision", entryConditionMet: true, eligibleChoiceCount: 2.5 }],
  ["TR-007 assist enabled", snapshot("Cutscene", { metrics: { hp: 0, sanity: 70, bond: 0 } }), "CRISIS_DETECTED", { storyAssistEnabled: true }],
  ["TR-007 no crisis", snapshot("Cutscene"), "CRISIS_DETECTED", { storyAssistEnabled: false }],
  ["TR-007 invalid metrics", snapshot("Cutscene", { metrics: { hp: "0", sanity: 70, bond: 0 } }), "CRISIS_DETECTED", { storyAssistEnabled: false }],
  ["TR-008 not final", snapshot("Cutscene"), "ENDING_RESOLVED", { finalContext: false, endingId: "end-home" }],
  ["TR-008 no ending", snapshot("Cutscene"), "ENDING_RESOLVED", { finalContext: true, endingId: "" }],
  ["TR-009 event ineligible", snapshot("Exploration"), "EVENT_TRIGGERED", { eventEligible: false, occurrenceBelowMax: true, targetNodeType: "cutscene", targetNodeValid: true }],
  ["TR-009 occurrence at max", snapshot("Exploration"), "EVENT_TRIGGERED", { eventEligible: true, occurrenceBelowMax: false, targetNodeType: "cutscene", targetNodeValid: true }],
  ["TR-009 wrong target type", snapshot("Exploration"), "EVENT_TRIGGERED", { eventEligible: true, occurrenceBelowMax: true, targetNodeType: "decision", targetNodeValid: true }],
  ["TR-009 target invalid", snapshot("Exploration"), "EVENT_TRIGGERED", { eventEligible: true, occurrenceBelowMax: true, targetNodeType: "cutscene", targetNodeValid: false }],
  ["TR-010 exit guard false", snapshot("Exploration"), "EXIT_AREA", { exitGuardMet: false, targetNodeType: "cutscene", targetNodeValid: true }],
  ["TR-010 wrong target type", snapshot("Exploration"), "EXIT_AREA", { exitGuardMet: true, targetNodeType: "decision", targetNodeValid: true }],
  ["TR-010 target invalid", snapshot("Exploration"), "EXIT_AREA", { exitGuardMet: true, targetNodeType: "cutscene", targetNodeValid: false }],
  ["TR-011 wrong target type", snapshot("Exploration"), "DECISION_READY", { targetNodeType: "cutscene", entryConditionMet: true, targetNodeValid: true }],
  ["TR-011 entry condition false", snapshot("Exploration"), "DECISION_READY", { targetNodeType: "decision", entryConditionMet: false, targetNodeValid: true }],
  ["TR-011 target invalid", snapshot("Exploration"), "DECISION_READY", { targetNodeType: "decision", entryConditionMet: true, targetNodeValid: false }],
  ["TR-012/013 choice ineligible", snapshot("Decision"), "COMMIT_CHOICE", { choiceEligible: false, commandFresh: true, revisionMatches: true, targetNodeType: "cutscene", targetNodeValid: true, crisisDetected: false, endingResolved: false }],
  ["TR-012/013 stale command", snapshot("Decision"), "COMMIT_CHOICE", { choiceEligible: true, commandFresh: false, revisionMatches: true, targetNodeType: "cutscene", targetNodeValid: true, crisisDetected: false, endingResolved: false }],
  ["TR-012/013 revision mismatch", snapshot("Decision"), "COMMIT_CHOICE", { choiceEligible: true, commandFresh: true, revisionMatches: false, targetNodeType: "cutscene", targetNodeValid: true, crisisDetected: false, endingResolved: false }],
  ["TR-012/013 unsupported target", snapshot("Decision"), "COMMIT_CHOICE", { choiceEligible: true, commandFresh: true, revisionMatches: true, targetNodeType: "decision", targetNodeValid: true, crisisDetected: false, endingResolved: false }],
  ["TR-012/013 invalid target", snapshot("Decision"), "COMMIT_CHOICE", { choiceEligible: true, commandFresh: true, revisionMatches: true, targetNodeType: "cutscene", targetNodeValid: false, crisisDetected: false, endingResolved: false }],
  ["TR-012/013 crisis wins", snapshot("Decision"), "COMMIT_CHOICE", { choiceEligible: true, commandFresh: true, revisionMatches: true, targetNodeType: "cutscene", targetNodeValid: true, crisisDetected: true, endingResolved: false }],
  ["TR-012/013 ending wins", snapshot("Decision"), "COMMIT_CHOICE", { choiceEligible: true, commandFresh: true, revisionMatches: true, targetNodeType: "cutscene", targetNodeValid: true, crisisDetected: false, endingResolved: true }],
  ["TR-014 assist enabled", snapshot("Decision", { metrics: { hp: 0, sanity: 70, bond: 0 } }), "CRISIS_DETECTED", { storyAssistEnabled: true }],
  ["TR-014 no crisis", snapshot("Decision"), "CRISIS_DETECTED", { storyAssistEnabled: false }],
  ["TR-015 neither gate nor repair", snapshot("Decision"), "ENDING_RESOLVED", { finalGatePassed: false, repairCompleted: false }],
  ["TR-016 checkpoint invalid", snapshot("GameOver"), "RETRY_CHECKPOINT", { checkpointValid: false, contentReferencesCompatible: true }],
  ["TR-016 references incompatible", snapshot("GameOver"), "RETRY_CHECKPOINT", { checkpointValid: true, contentReferencesCompatible: false }],
  ["TR-017 no accepted setting", snapshot("GameOver"), "ENABLE_ASSIST_AND_RETRY", { settingsPersisted: false, memorySettingAccepted: false }],
  ["TR-018 active transaction", snapshot("GameOver"), "RETURN_TITLE", { activeTransaction: true }],
  ["TR-019 progress not committed", snapshot("Ending"), "EPILOGUE_COMPLETE", { endingProgressCommitted: false }],
  ["TR-020 replay checkpoint absent", snapshot("Ending"), "CHAPTER_REPLAY", { approvedReplayCheckpointExists: false }],
];

test("FR-STA-003 rejects every declared guard-false scenario without mutation", async (t) => {
  for (const [name, currentSnapshot, event, context] of GUARD_REJECTIONS) {
    await t.test(name, () => {
      const snapshotBefore = structuredClone(currentSnapshot);
      const contextBefore = structuredClone(context);
      const result = planGameStateTransition({
        snapshot: currentSnapshot,
        event,
        context,
      });

      assertFailure(result, TRANSITION_ERROR_CODES.INVALID_TRANSITION, currentSnapshot);
      assert.equal(result.error.reason, "GUARD_REJECTED");
      assert.deepEqual(currentSnapshot, snapshotBefore);
      assert.deepEqual(context, contextBefore);
    });
  }
});

test("FR-STA-003 rejects all 84 forbidden active-state/event pairs", () => {
  const allowedPairs = new Set(
    TRANSITION_TABLE
      .filter(({ source }) => source !== INITIAL_SOURCE)
      .map(({ source, event }) => `${source}:${event}`),
  );
  let forbiddenCount = 0;

  for (const state of GAME_STATES) {
    for (const event of GAME_EVENTS) {
      const pair = `${state}:${event}`;
      if (allowedPairs.has(pair)) {
        continue;
      }

      forbiddenCount += 1;
      const currentSnapshot = snapshot(state);
      const result = planGameStateTransition({
        snapshot: currentSnapshot,
        event,
        context: {},
      });
      assertFailure(
        result,
        TRANSITION_ERROR_CODES.INVALID_TRANSITION,
        currentSnapshot,
      );
      assert.equal(result.error.reason, "NO_TRANSITION", pair);
    }
  }

  assert.equal(forbiddenCount, 84);
});

test("FR-STA-002 rejects invalid states and keeps Initial out of persisted state", () => {
  const invalidSnapshots = [
    undefined,
    [],
    {},
    { state: "Initial" },
    { state: "title" },
    { state: "Unknown" },
  ];

  for (const currentSnapshot of invalidSnapshots) {
    const result = planGameStateTransition({
      snapshot: currentSnapshot,
      event: "NEW_GAME",
      context: {},
    });
    assertFailure(result, TRANSITION_ERROR_CODES.INVALID_STATE, currentSnapshot);
  }
});

test("FR-STA-003 rejects unknown events, malformed requests, and malformed context", () => {
  const currentSnapshot = snapshot("Title");

  assertFailure(
    planGameStateTransition({ snapshot: currentSnapshot, event: "new-game" }),
    TRANSITION_ERROR_CODES.INVALID_EVENT,
    currentSnapshot,
  );
  assertFailure(
    planGameStateTransition({ snapshot: currentSnapshot, event: null }),
    TRANSITION_ERROR_CODES.INVALID_EVENT,
    currentSnapshot,
  );

  const invalidRequest = planGameStateTransition(null);
  assert.equal(invalidRequest.ok, false);
  assert.equal(invalidRequest.error.code, TRANSITION_ERROR_CODES.INVALID_REQUEST);

  assertFailure(
    planGameStateTransition({
      snapshot: currentSnapshot,
      event: "NEW_GAME",
      context: [],
    }),
    TRANSITION_ERROR_CODES.INVALID_CONTEXT,
    currentSnapshot,
  );
});

test("TR-007 and TR-014 recognize both crisis meters at their zero boundary", () => {
  for (const state of ["Cutscene", "Decision"]) {
    for (const metrics of [
      { hp: 0, sanity: 1, bond: 0 },
      { hp: 1, sanity: 0, bond: 0 },
      { hp: 0, sanity: 0, bond: 0 },
    ]) {
      const result = planGameStateTransition({
        snapshot: snapshot(state, { metrics }),
        event: "CRISIS_DETECTED",
        context: { storyAssistEnabled: false },
      });
      assert.equal(result.ok, true, `${state} ${JSON.stringify(metrics)}`);
      assert.equal(result.value.target, "GameOver");
    }

    const noCrisis = snapshot(state, {
      metrics: { hp: 1, sanity: 1, bond: 0 },
    });
    assertFailure(
      planGameStateTransition({
        snapshot: noCrisis,
        event: "CRISIS_DETECTED",
        context: { storyAssistEnabled: false },
      }),
      TRANSITION_ERROR_CODES.INVALID_TRANSITION,
      noCrisis,
    );
  }
});

test("TR-012 and TR-013 are mutually exclusive for one COMMIT_CHOICE request", () => {
  const matchingRows = TRANSITION_TABLE.filter(
    ({ source, event }) => source === "Decision" && event === "COMMIT_CHOICE",
  );
  assert.deepEqual(
    matchingRows.map(({ id, target }) => ({ id, target })),
    [
      { id: "TR-012", target: "Cutscene" },
      { id: "TR-013", target: "Exploration" },
    ],
  );

  for (const scenario of POSITIVE_TRANSITIONS.filter(
    ({ id }) => id === "TR-012" || id === "TR-013",
  )) {
    const result = planGameStateTransition({
      snapshot: scenario.snapshot,
      event: scenario.event,
      context: scenario.context,
    });
    assert.equal(result.ok, true);
    assert.equal(result.value.transitionId, scenario.id);
  }
});

test("ADR-P0-004 leaves frozen input unchanged and plans deterministically", () => {
  const currentSnapshot = deepFreeze(snapshot("Decision"));
  const context = deepFreeze({
    choiceEligible: true,
    commandFresh: true,
    revisionMatches: true,
    targetNodeType: "cutscene",
    targetNodeValid: true,
    crisisDetected: false,
    endingResolved: false,
  });
  const request = deepFreeze({
    snapshot: currentSnapshot,
    event: "COMMIT_CHOICE",
    context,
  });
  const expected = planGameStateTransition(request);

  for (let iteration = 0; iteration < 100; iteration += 1) {
    assert.deepEqual(planGameStateTransition(request), expected);
  }

  assert.deepEqual(currentSnapshot, {
    state: "Decision",
    revision: 7,
    metrics: { hp: 80, sanity: 70, bond: 0 },
  });
});
