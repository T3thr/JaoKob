import test from "node:test";
import assert from "node:assert/strict";

import {
  CHOICE_ERROR_CODES,
  CHOICE_OUTCOMES,
  CRISIS_REASONS,
  ChoiceTransactionError,
  evaluateCondition,
  resolveChoiceTransaction,
} from "../../src/core/use-cases/choice-transaction.js";

const COMMITTED_AT = "2026-09-01T15:30:00+07:00";

const FLAG_DEFINITIONS = Object.freeze([
  Object.freeze({
    id: "bond.accepted",
    valueType: "boolean",
    defaultValue: false,
  }),
  Object.freeze({
    id: "counter.observations",
    valueType: "integer",
    defaultValue: 0,
  }),
  Object.freeze({
    id: "route.mode",
    valueType: "string",
    defaultValue: "unset",
  }),
]);

const FLAG_POLICIES = Object.freeze({
  "bond.accepted": Object.freeze({ kind: "marker", reversible: false }),
  "counter.observations": Object.freeze({
    kind: "counter",
    min: 0,
    max: 20,
    overflow: "saturate",
  }),
  "route.mode": Object.freeze({ kind: "event", reversible: true }),
});

function makeSnapshot(overrides = {}) {
  return {
    state: "Decision",
    revision: 7,
    currentTreeId: "tree.act1",
    currentNodeId: "node.first-decision",
    metrics: { hp: 80, sanity: 70, bond: 0 },
    flags: [
      { id: "route.mode", value: "reeds" },
      { id: "counter.observations", value: 19 },
      { id: "bond.accepted", value: false },
    ],
    eventOccurrences: [],
    history: [],
    rng: { algorithm: "xorshift32-v1", seed: 1, state: 1 },
    ...overrides,
  };
}

function makeCommand(overrides = {}) {
  return {
    id: "command-0001",
    expectedRevision: 7,
    choiceId: "choice.wait",
    committedAt: COMMITTED_AT,
    ...overrides,
  };
}

function makeChoice(overrides = {}) {
  return {
    id: "choice.wait",
    condition: { kind: "always" },
    effects: [],
    nextNodeId: "node.after-choice",
    ...overrides,
  };
}

function makeTarget(overrides = {}) {
  return {
    id: "node.after-choice",
    type: "cutscene",
    entryConditionMet: true,
    ...overrides,
  };
}

function makeRequest(overrides = {}) {
  return {
    snapshot: makeSnapshot(),
    command: makeCommand(),
    choice: makeChoice(),
    flagDefinitions: FLAG_DEFINITIONS,
    flagPolicies: FLAG_POLICIES,
    target: makeTarget(),
    inputLocked: false,
    storyAssistEnabled: false,
    recoveryTarget: {
      id: "node.recovery",
      type: "cutscene",
      entryConditionMet: true,
    },
    crisisTarget: {
      id: "node.game-over",
      type: "game-over",
      entryConditionMet: true,
    },
    ...overrides,
  };
}

function assertChoiceFailure(result, expectedCode, originalSnapshot) {
  assert.equal(result.ok, false);
  assert.equal(result.error.code, expectedCode);
  assert.strictEqual(result.snapshot, originalSnapshot);
  assert.equal(Object.isFrozen(result), true);
  assert.equal(Object.isFrozen(result.error), true);
  assert.equal(Object.isFrozen(result.error.details), true);
}

function assertChoiceThrow(expectedCode) {
  return (error) => {
    assert.ok(error instanceof ChoiceTransactionError);
    assert.equal(error.code, expectedCode);
    return true;
  };
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

function assertDeepFrozen(value) {
  if (value === null || typeof value !== "object") {
    return;
  }
  assert.equal(Object.isFrozen(value), true);
  for (const nested of Object.values(value)) {
    assertDeepFrozen(nested);
  }
}

test("FR-ENG-002 exports immutable outcome, crisis, and error vocabularies", () => {
  assert.deepEqual(CHOICE_OUTCOMES, {
    CONTINUE: "continue",
    CRISIS: "crisis",
    RECOVERY: "recovery",
    ENDING: "ending",
  });
  assert.deepEqual(CRISIS_REASONS, {
    PHYSICAL_COLLAPSE: "physical_collapse",
    EMOTIONAL_OVERWHELM: "emotional_overwhelm",
  });
  assert.equal(Object.isFrozen(CHOICE_OUTCOMES), true);
  assert.equal(Object.isFrozen(CRISIS_REASONS), true);
  assert.equal(Object.isFrozen(CHOICE_ERROR_CODES), true);
  assert.equal(CHOICE_ERROR_CODES.REVISION_MISMATCH, "REVISION_MISMATCH");
  assert.equal(CHOICE_ERROR_CODES.EFFECT_CONFLICT, "EFFECT_CONFLICT");
});

test("FR-ENG-002 evaluates every metric comparison operator at its boundary", () => {
  const conditionSnapshot = makeSnapshot();
  const cases = [
    ["eq", 80, true],
    ["neq", 80, false],
    ["gt", 79, true],
    ["gte", 80, true],
    ["lt", 81, true],
    ["lte", 80, true],
  ];

  for (const [operator, value, expected] of cases) {
    assert.equal(
      evaluateCondition({ kind: "metric", metric: "hp", operator, value }, conditionSnapshot),
      expected,
      `${operator} ${value}`,
    );
  }
});

test("FR-ENG-002 evaluates flag, compound all/any/not, and always conditions", () => {
  const conditionSnapshot = makeSnapshot();

  assert.equal(evaluateCondition({ kind: "always" }, conditionSnapshot), true);
  assert.equal(evaluateCondition({
    kind: "flag",
    flagId: "bond.accepted",
    operator: "exists",
  }, conditionSnapshot), true);
  assert.equal(evaluateCondition({
    kind: "flag",
    flagId: "missing.flag",
    operator: "not-exists",
  }, conditionSnapshot), true);
  assert.equal(evaluateCondition({
    kind: "flag",
    flagId: "route.mode",
    operator: "eq",
    value: "reeds",
  }, conditionSnapshot), true);
  assert.equal(evaluateCondition({
    kind: "flag",
    flagId: "route.mode",
    operator: "neq",
    value: "drain",
  }, conditionSnapshot), true);

  const compound = {
    all: [
      { kind: "metric", metric: "hp", operator: "gte", value: 80 },
      {
        any: [
          { kind: "flag", flagId: "bond.accepted", operator: "eq", value: true },
          { not: { kind: "flag", flagId: "route.mode", operator: "eq", value: "drain" } },
        ],
      },
    ],
  };
  assert.equal(evaluateCondition(compound, conditionSnapshot), true);
});

test("FR-ENG-002 validates every compound branch rather than hiding malformed trailing input", () => {
  const conditionSnapshot = makeSnapshot();

  assert.throws(
    () => evaluateCondition({
      all: [
        { kind: "metric", metric: "hp", operator: "lt", value: 1 },
        { kind: "unsupported" },
      ],
    }, conditionSnapshot),
    assertChoiceThrow("INVALID_CONDITION"),
  );
  assert.throws(
    () => evaluateCondition({
      any: [
        { kind: "always" },
        { kind: "metric", metric: "hp", operator: "approximately", value: 80 },
      ],
    }, conditionSnapshot),
    assertChoiceThrow("INVALID_CONDITION"),
  );
});

test("FR-ENG-002 rejects malformed condition snapshots, operators, arrays, and excessive depth", () => {
  assert.throws(
    () => evaluateCondition({ kind: "always" }, { metrics: {}, flags: [] }),
    assertChoiceThrow("INVALID_EFFECT"),
  );
  assert.throws(
    () => evaluateCondition({ all: [] }, makeSnapshot()),
    assertChoiceThrow("INVALID_CONDITION"),
  );
  assert.throws(
    () => evaluateCondition({
      kind: "metric",
      metric: "hp",
      operator: "approximately",
      value: 80,
    }, makeSnapshot()),
    assertChoiceThrow("INVALID_CONDITION"),
  );

  let excessiveDepth = { kind: "always" };
  for (let depth = 0; depth < 66; depth += 1) {
    excessiveDepth = { not: excessiveDepth };
  }
  assert.throws(
    () => evaluateCondition(excessiveDepth, makeSnapshot()),
    assertChoiceThrow("INVALID_CONDITION"),
  );
});

test("FR-ENG-002 commits metric and typed flag effects atomically to a Cutscene", () => {
  const request = makeRequest({
    choice: makeChoice({
      effects: [
        { type: "adjust-metric", metric: "hp", amount: -10 },
        { type: "adjust-metric", metric: "bond", amount: 15 },
        { type: "set-flag", flagId: "bond.accepted", value: true },
        { type: "adjust-flag", flagId: "counter.observations", amount: 5 },
        { type: "clear-flag", flagId: "route.mode" },
      ],
    }),
  });
  const original = structuredClone(request.snapshot);
  const result = resolveChoiceTransaction(request);

  assert.equal(result.ok, true);
  assert.equal(result.value.commandId, request.command.id);
  assert.equal(result.value.choiceId, request.choice.id);
  assert.deepEqual(result.value.transitionPlan, {
    transitionId: "TR-012",
    source: "Decision",
    event: "COMMIT_CHOICE",
    target: "Cutscene",
  });
  assert.deepEqual(result.value.outcome, { kind: "continue", crisisReason: null });
  assert.equal(result.value.snapshot.state, "Cutscene");
  assert.equal(result.value.snapshot.revision, 8);
  assert.equal(result.value.snapshot.currentNodeId, "node.after-choice");
  assert.deepEqual(result.value.snapshot.metrics, { hp: 70, sanity: 70, bond: 15 });
  assert.deepEqual(result.value.snapshot.flags, [
    { id: "bond.accepted", value: true },
    { id: "counter.observations", value: 20 },
    { id: "route.mode", value: "unset" },
  ]);
  assert.deepEqual(result.value.snapshot.history, [{
    sequence: 1,
    nodeId: "node.first-decision",
    actionId: "choice.wait",
    committedAt: COMMITTED_AT,
    metricsAfter: { hp: 70, sanity: 70, bond: 15 },
  }]);
  assert.deepEqual(request.snapshot, original);
  assertDeepFrozen(result);
});

test("TR-013 resolves an eligible choice to Exploration", () => {
  const result = resolveChoiceTransaction(makeRequest({
    choice: makeChoice({ nextNodeId: "node.explore" }),
    target: makeTarget({ id: "node.explore", type: "exploration" }),
  }));

  assert.equal(result.ok, true);
  assert.equal(result.value.snapshot.state, "Exploration");
  assert.equal(result.value.snapshot.currentNodeId, "node.explore");
  assert.equal(result.value.transitionPlan.transitionId, "TR-013");
  assert.equal(result.value.outcome.kind, CHOICE_OUTCOMES.CONTINUE);
});

test("TR-015 resolves an approved final gate to Ending only after effects", () => {
  const result = resolveChoiceTransaction(makeRequest({
    choice: makeChoice({
      nextNodeId: "ending.home",
      effects: [{ type: "set-flag", flagId: "bond.accepted", value: true }],
    }),
    target: makeTarget({
      id: "ending.home",
      type: "ending",
      finalGatePassed: true,
      repairCompleted: false,
    }),
  }));

  assert.equal(result.ok, true);
  assert.equal(result.value.snapshot.state, "Ending");
  assert.equal(result.value.transitionPlan.transitionId, "TR-015");
  assert.equal(result.value.outcome.kind, CHOICE_OUTCOMES.ENDING);
  assert.deepEqual(result.value.snapshot.flags[0], {
    id: "bond.accepted",
    value: true,
  });
});

test("FR-ENG-002 resolves HP before Sanity when both reach zero", () => {
  const request = makeRequest({
    choice: makeChoice({
      effects: [
        { type: "set-metric", metric: "hp", value: 0 },
        { type: "set-metric", metric: "sanity", value: 0 },
        { type: "adjust-metric", metric: "bond", amount: 10 },
        { type: "set-flag", flagId: "bond.accepted", value: true },
      ],
    }),
  });
  const result = resolveChoiceTransaction(request);

  assert.equal(result.ok, true);
  assert.equal(result.value.transitionPlan.transitionId, "TR-014");
  assert.equal(result.value.snapshot.state, "GameOver");
  assert.equal(result.value.snapshot.currentNodeId, "node.game-over");
  assert.deepEqual(result.value.snapshot.metrics, { hp: 0, sanity: 0, bond: 10 });
  assert.deepEqual(result.value.outcome, {
    kind: CHOICE_OUTCOMES.CRISIS,
    crisisReason: CRISIS_REASONS.PHYSICAL_COLLAPSE,
  });
  assert.equal(result.value.snapshot.flags[0].value, true);
});

test("FR-ENG-002 distinguishes a Sanity-only crisis", () => {
  const result = resolveChoiceTransaction(makeRequest({
    choice: makeChoice({
      effects: [{ type: "set-metric", metric: "sanity", value: 0 }],
    }),
  }));

  assert.equal(result.ok, true);
  assert.equal(result.value.outcome.kind, CHOICE_OUTCOMES.CRISIS);
  assert.equal(
    result.value.outcome.crisisReason,
    CRISIS_REASONS.EMOTIONAL_OVERWHELM,
  );
});

test("FR-ENG-002 Story Assist clamps crisis meters at one and preserves Bond and flags", () => {
  const result = resolveChoiceTransaction(makeRequest({
    storyAssistEnabled: true,
    choice: makeChoice({
      effects: [
        { type: "set-metric", metric: "hp", value: 0 },
        { type: "set-metric", metric: "sanity", value: 0 },
        { type: "set-metric", metric: "bond", value: 35 },
        { type: "set-flag", flagId: "bond.accepted", value: true },
      ],
    }),
  }));

  assert.equal(result.ok, true);
  assert.equal(result.value.outcome.kind, CHOICE_OUTCOMES.RECOVERY);
  assert.equal(result.value.outcome.crisisReason, null);
  assert.equal(result.value.transitionPlan.transitionId, "TR-012");
  assert.equal(result.value.snapshot.currentNodeId, "node.recovery");
  assert.deepEqual(result.value.snapshot.metrics, { hp: 1, sanity: 1, bond: 35 });
  assert.equal(result.value.snapshot.flags[0].value, true);
});

test("FR-ENG-002 evaluates guards only from the immutable pre-choice snapshot", () => {
  const request = makeRequest({
    choice: makeChoice({
      condition: {
        kind: "flag",
        flagId: "bond.accepted",
        operator: "eq",
        value: true,
      },
      effects: [{ type: "set-flag", flagId: "bond.accepted", value: true }],
    }),
  });
  const original = structuredClone(request.snapshot);
  const result = resolveChoiceTransaction(request);

  assertChoiceFailure(result, CHOICE_ERROR_CODES.CHOICE_UNAVAILABLE, request.snapshot);
  assert.deepEqual(request.snapshot, original);
});

test("FR-ENG-003 rejects locked, stale, and mismatched commands atomically", async (t) => {
  const scenarios = [
    {
      name: "input locked",
      request: makeRequest({ inputLocked: true }),
      code: CHOICE_ERROR_CODES.INPUT_LOCKED,
    },
    {
      name: "stale revision",
      request: makeRequest({ command: makeCommand({ expectedRevision: 6 }) }),
      code: CHOICE_ERROR_CODES.REVISION_MISMATCH,
    },
    {
      name: "choice ID mismatch",
      request: makeRequest({ command: makeCommand({ choiceId: "choice.other" }) }),
      code: CHOICE_ERROR_CODES.CHOICE_MISMATCH,
    },
  ];

  for (const scenario of scenarios) {
    await t.test(scenario.name, () => {
      const original = structuredClone(scenario.request.snapshot);
      const result = resolveChoiceTransaction(scenario.request);
      assertChoiceFailure(result, scenario.code, scenario.request.snapshot);
      assert.deepEqual(scenario.request.snapshot, original);
    });
  }
});

test("FR-ENG-003 replayed duplicate and competing submits cannot commit against the current snapshot", () => {
  const firstRequest = makeRequest();
  const first = resolveChoiceTransaction(firstRequest);
  assert.equal(first.ok, true);
  assert.equal(first.value.snapshot.revision, 8);
  assert.equal(first.value.snapshot.history.length, 1);

  const duplicate = resolveChoiceTransaction(makeRequest({
    snapshot: first.value.snapshot,
    command: firstRequest.command,
  }));
  assertChoiceFailure(
    duplicate,
    CHOICE_ERROR_CODES.INVALID_STATE,
    first.value.snapshot,
  );

  const competing = resolveChoiceTransaction(makeRequest({
    snapshot: first.value.snapshot,
    command: makeCommand({ id: "command-0002", expectedRevision: 7 }),
  }));
  assertChoiceFailure(
    competing,
    CHOICE_ERROR_CODES.INVALID_STATE,
    first.value.snapshot,
  );
  assert.equal(first.value.snapshot.revision, 8);
  assert.equal(first.value.snapshot.history.length, 1);
});

test("FR-ENG-002 rejects metric, flag, and checkpoint effect conflicts with full rollback", async (t) => {
  const scenarios = [
    {
      name: "set and adjust same metric",
      effects: [
        { type: "set-metric", metric: "hp", value: 50 },
        { type: "adjust-metric", metric: "hp", amount: 0 },
      ],
    },
    {
      name: "two operations on one flag",
      effects: [
        { type: "set-flag", flagId: "bond.accepted", value: true },
        { type: "clear-flag", flagId: "bond.accepted" },
      ],
    },
    {
      name: "two checkpoint effects",
      effects: [
        { type: "set-checkpoint", checkpointId: "checkpoint.one" },
        { type: "set-checkpoint", checkpointId: "checkpoint.two" },
      ],
    },
  ];

  for (const scenario of scenarios) {
    await t.test(scenario.name, () => {
      const request = makeRequest({
        choice: makeChoice({ effects: scenario.effects }),
      });
      const original = structuredClone(request.snapshot);
      const result = resolveChoiceTransaction(request);
      assertChoiceFailure(result, CHOICE_ERROR_CODES.EFFECT_CONFLICT, request.snapshot);
      assert.deepEqual(request.snapshot, original);
    });
  }
});

test("FR-ENG-002 enforces registered flag types and fully materialized defaults", async (t) => {
  const scenarios = [
    {
      name: "unknown effect flag",
      request: makeRequest({
        choice: makeChoice({
          effects: [{ type: "set-flag", flagId: "unknown.flag", value: true }],
        }),
      }),
      code: CHOICE_ERROR_CODES.UNKNOWN_FLAG,
    },
    {
      name: "wrong set value type",
      request: makeRequest({
        choice: makeChoice({
          effects: [{ type: "set-flag", flagId: "bond.accepted", value: "yes" }],
        }),
      }),
      code: CHOICE_ERROR_CODES.FLAG_TYPE_MISMATCH,
    },
    {
      name: "missing materialized default",
      request: makeRequest({
        snapshot: makeSnapshot({
          flags: [
            { id: "route.mode", value: "reeds" },
            { id: "counter.observations", value: 19 },
          ],
        }),
      }),
      code: CHOICE_ERROR_CODES.INVALID_FLAG_SNAPSHOT,
    },
    {
      name: "duplicate flag snapshot ID",
      request: makeRequest({
        snapshot: makeSnapshot({
          flags: [
            { id: "bond.accepted", value: false },
            { id: "bond.accepted", value: false },
            { id: "counter.observations", value: 19 },
            { id: "route.mode", value: "reeds" },
          ],
        }),
      }),
      code: CHOICE_ERROR_CODES.INVALID_FLAG_SNAPSHOT,
    },
  ];

  for (const scenario of scenarios) {
    await t.test(scenario.name, () => {
      const original = structuredClone(scenario.request.snapshot);
      const result = resolveChoiceTransaction(scenario.request);
      assertChoiceFailure(result, scenario.code, scenario.request.snapshot);
      assert.deepEqual(scenario.request.snapshot, original);
    });
  }
});

test("FR-ENG-002 requires explicit counter policy and applies saturate or reject deterministically", () => {
  const effect = {
    type: "adjust-flag",
    flagId: "counter.observations",
    amount: 5,
  };
  const noPolicyRequest = makeRequest({
    flagPolicies: {},
    choice: makeChoice({ effects: [effect] }),
  });
  assertChoiceFailure(
    resolveChoiceTransaction(noPolicyRequest),
    CHOICE_ERROR_CODES.FLAG_POLICY_REQUIRED,
    noPolicyRequest.snapshot,
  );

  const saturated = resolveChoiceTransaction(makeRequest({
    choice: makeChoice({ effects: [effect] }),
  }));
  assert.equal(saturated.ok, true);
  assert.deepEqual(
    saturated.value.snapshot.flags.find(({ id }) => id === "counter.observations"),
    { id: "counter.observations", value: 20 },
  );

  const rejectRequest = makeRequest({
    choice: makeChoice({ effects: [effect] }),
    flagPolicies: {
      ...FLAG_POLICIES,
      "counter.observations": {
        kind: "counter",
        min: 0,
        max: 20,
        overflow: "reject",
      },
    },
  });
  assertChoiceFailure(
    resolveChoiceTransaction(rejectRequest),
    CHOICE_ERROR_CODES.FLAG_OVERFLOW,
    rejectRequest.snapshot,
  );
});

test("FR-ENG-002 protects monotonic markers while allowing an explicit reversible policy", () => {
  const trueMarkerSnapshot = makeSnapshot({
    flags: [
      { id: "bond.accepted", value: true },
      { id: "counter.observations", value: 19 },
      { id: "route.mode", value: "reeds" },
    ],
  });
  const nonReversible = makeRequest({
    snapshot: trueMarkerSnapshot,
    choice: makeChoice({
      effects: [{ type: "set-flag", flagId: "bond.accepted", value: false }],
    }),
  });
  assertChoiceFailure(
    resolveChoiceTransaction(nonReversible),
    CHOICE_ERROR_CODES.FLAG_NOT_REVERSIBLE,
    trueMarkerSnapshot,
  );

  const reversible = resolveChoiceTransaction(makeRequest({
    snapshot: trueMarkerSnapshot,
    choice: makeChoice({
      effects: [{ type: "clear-flag", flagId: "bond.accepted" }],
    }),
    flagPolicies: {
      ...FLAG_POLICIES,
      "bond.accepted": { kind: "marker", reversible: true },
    },
  }));
  assert.equal(reversible.ok, true);
  assert.deepEqual(reversible.value.snapshot.flags[0], {
    id: "bond.accepted",
    value: false,
  });
});

test("GDD-FLG-002 rejects a clear that lacks an explicit reversible policy", () => {
  const request = makeRequest({
    choice: makeChoice({
      effects: [{ type: "clear-flag", flagId: "route.mode" }],
    }),
    flagPolicies: {
      "bond.accepted": FLAG_POLICIES["bond.accepted"],
      "counter.observations": FLAG_POLICIES["counter.observations"],
    },
  });

  assertChoiceFailure(
    resolveChoiceTransaction(request),
    CHOICE_ERROR_CODES.FLAG_NOT_REVERSIBLE,
    request.snapshot,
  );
});

test("FR-ENG-002 validates target identity, type, entry guard, and Ending guard", async (t) => {
  const scenarios = [
    {
      name: "target ID mismatch",
      request: makeRequest({ target: makeTarget({ id: "node.other" }) }),
      code: CHOICE_ERROR_CODES.TARGET_MISMATCH,
    },
    {
      name: "target type invalid",
      request: makeRequest({ target: makeTarget({ type: "decision" }) }),
      code: CHOICE_ERROR_CODES.INVALID_TARGET,
    },
    {
      name: "entry guard false",
      request: makeRequest({ target: makeTarget({ entryConditionMet: false }) }),
      code: CHOICE_ERROR_CODES.TARGET_GUARD_REJECTED,
    },
    {
      name: "ending gate false",
      request: makeRequest({
        choice: makeChoice({ nextNodeId: "ending.home" }),
        target: makeTarget({
          id: "ending.home",
          type: "ending",
          finalGatePassed: false,
          repairCompleted: false,
        }),
      }),
      code: CHOICE_ERROR_CODES.INVALID_TRANSITION,
    },
  ];

  for (const scenario of scenarios) {
    await t.test(scenario.name, () => {
      const original = structuredClone(scenario.request.snapshot);
      const result = resolveChoiceTransaction(scenario.request);
      assertChoiceFailure(result, scenario.code, scenario.request.snapshot);
      assert.deepEqual(scenario.request.snapshot, original);
    });
  }
});

test("FR-ENG-002 creates a schema-shaped checkpoint only with complete checkpoint context", () => {
  const checkpointChoice = makeChoice({
    effects: [{ type: "set-checkpoint", checkpointId: "checkpoint.after-choice" }],
  });
  const success = resolveChoiceTransaction(makeRequest({ choice: checkpointChoice }));

  assert.equal(success.ok, true);
  assert.deepEqual(success.value.snapshot.checkpoint, {
    id: "checkpoint.after-choice",
    capturedAt: COMMITTED_AT,
    treeId: "tree.act1",
    nodeId: "node.after-choice",
    state: "Cutscene",
    metrics: { hp: 80, sanity: 70, bond: 0 },
    flags: [
      { id: "bond.accepted", value: false },
      { id: "counter.observations", value: 19 },
      { id: "route.mode", value: "reeds" },
    ],
    eventOccurrences: [],
    rng: { algorithm: "xorshift32-v1", seed: 1, state: 1 },
  });

  const missingContextSnapshot = makeSnapshot({ currentTreeId: undefined });
  const failure = resolveChoiceTransaction(makeRequest({
    snapshot: missingContextSnapshot,
    choice: checkpointChoice,
  }));
  assertChoiceFailure(
    failure,
    CHOICE_ERROR_CODES.CHECKPOINT_CONTEXT_REQUIRED,
    missingContextSnapshot,
  );
});

test("FR-ENG-002 keeps history bounded and increments sequence and revision exactly once", () => {
  const history = Array.from({ length: 200 }, (_, index) => ({
    sequence: index + 1,
    nodeId: "node.previous",
    actionId: "choice.previous",
    committedAt: COMMITTED_AT,
    metricsAfter: { hp: 80, sanity: 70, bond: 0 },
  }));
  const result = resolveChoiceTransaction(makeRequest({
    snapshot: makeSnapshot({ history }),
  }));

  assert.equal(result.ok, true);
  assert.equal(result.value.snapshot.revision, 8);
  assert.equal(result.value.snapshot.history.length, 200);
  assert.equal(result.value.snapshot.history[0].sequence, 2);
  assert.equal(result.value.snapshot.history.at(-1).sequence, 201);
  assert.equal(result.value.snapshot.history.at(-1).actionId, "choice.wait");
});

test("FR-ENG-002 rejects revision and history sequence overflow without commit", () => {
  const revisionOverflowSnapshot = makeSnapshot({ revision: Number.MAX_SAFE_INTEGER });
  const revisionOverflow = resolveChoiceTransaction(makeRequest({
    snapshot: revisionOverflowSnapshot,
    command: makeCommand({ expectedRevision: Number.MAX_SAFE_INTEGER }),
  }));
  assertChoiceFailure(
    revisionOverflow,
    CHOICE_ERROR_CODES.REVISION_OVERFLOW,
    revisionOverflowSnapshot,
  );

  const historyOverflowSnapshot = makeSnapshot({
    history: [{ sequence: Number.MAX_SAFE_INTEGER }],
  });
  const historyOverflow = resolveChoiceTransaction(makeRequest({
    snapshot: historyOverflowSnapshot,
  }));
  assertChoiceFailure(
    historyOverflow,
    CHOICE_ERROR_CODES.REVISION_OVERFLOW,
    historyOverflowSnapshot,
  );
});

test("FR-ENG-002 rejects malformed snapshot, command, and untrusted JSON values atomically", async (t) => {
  const scenarios = [
    {
      name: "wrong state",
      request: makeRequest({ snapshot: makeSnapshot({ state: "Cutscene" }) }),
      code: CHOICE_ERROR_CODES.INVALID_STATE,
    },
    {
      name: "invalid snapshot revision",
      request: makeRequest({ snapshot: makeSnapshot({ revision: 0 }) }),
      code: CHOICE_ERROR_CODES.INVALID_SNAPSHOT,
    },
    {
      name: "invalid metric snapshot",
      request: makeRequest({
        snapshot: makeSnapshot({ metrics: { hp: 101, sanity: 70, bond: 0 } }),
      }),
      code: CHOICE_ERROR_CODES.INVALID_EFFECT,
    },
    {
      name: "invalid committedAt",
      request: makeRequest({ command: makeCommand({ committedAt: "today" }) }),
      code: CHOICE_ERROR_CODES.INVALID_COMMAND,
    },
    {
      name: "non JSON domain value",
      request: makeRequest({ snapshot: makeSnapshot({ unsafe: new Date(COMMITTED_AT) }) }),
      code: CHOICE_ERROR_CODES.NON_JSON_DOMAIN_VALUE,
    },
  ];

  for (const scenario of scenarios) {
    await t.test(scenario.name, () => {
      const result = resolveChoiceTransaction(scenario.request);
      assertChoiceFailure(result, scenario.code, scenario.request.snapshot);
    });
  }
});

test("ADR-P0-004 accepts deeply frozen inputs and returns deterministic deep-frozen output", () => {
  const request = deepFreeze(makeRequest({
    choice: makeChoice({
      effects: [
        { type: "adjust-metric", metric: "hp", amount: -3 },
        { type: "adjust-flag", flagId: "counter.observations", amount: 1 },
      ],
    }),
  }));
  const expected = resolveChoiceTransaction(request);
  assert.equal(expected.ok, true);
  assertDeepFrozen(expected);

  for (let iteration = 0; iteration < 100; iteration += 1) {
    assert.deepEqual(resolveChoiceTransaction(request), expected);
  }
});
