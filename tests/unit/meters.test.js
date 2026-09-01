import test from "node:test";
import assert from "node:assert/strict";

import {
  METER_MAX,
  METER_MIN,
  METER_NAMES,
  MeterInvariantError,
  applyMetricDeltas,
  applyMetricEffects,
  clampMeter,
  createMetrics,
  isMeterName,
} from "../../src/core/domain/meters.js";

const BASE_METRICS = Object.freeze({ hp: 80, sanity: 70, bond: 0 });

function assertMeterError(expectedCode) {
  return (error) => {
    assert.ok(error instanceof MeterInvariantError);
    assert.equal(error.code, expectedCode);
    return true;
  };
}

test("FR-ENG-001 exposes the canonical immutable meter contract", () => {
  assert.equal(METER_MIN, 0);
  assert.equal(METER_MAX, 100);
  assert.deepEqual(METER_NAMES, ["hp", "sanity", "bond"]);
  assert.equal(Object.isFrozen(METER_NAMES), true);
  assert.equal(isMeterName("hp"), true);
  assert.equal(isMeterName("sanity"), true);
  assert.equal(isMeterName("bond"), true);
  assert.equal(isMeterName("HP"), false);
  assert.equal(isMeterName("unknown"), false);
  assert.equal(isMeterName(null), false);
});

test("FR-ENG-001 clamps every normative acceptance boundary", () => {
  const cases = new Map([
    [-100, 0],
    [0, 0],
    [1, 1],
    [99, 99],
    [100, 100],
    [200, 100],
  ]);

  for (const [input, expected] of cases) {
    assert.equal(clampMeter(input), expected, `clampMeter(${input})`);
  }
});

test("FR-ENG-001 rejects non-safe-integer meter values without coercion", () => {
  const invalidValues = [
    Number.NaN,
    Number.POSITIVE_INFINITY,
    Number.NEGATIVE_INFINITY,
    1.5,
    "50",
    null,
    undefined,
    Number.MAX_SAFE_INTEGER + 1,
  ];

  for (const value of invalidValues) {
    assert.throws(
      () => clampMeter(value),
      assertMeterError("INVALID_METER_VALUE"),
    );
  }
});

test("FR-STA-004 creates the immutable 80/70/0 baseline without aliasing input", () => {
  const source = { hp: 80, sanity: 70, bond: 0 };
  const metrics = createMetrics(source);

  assert.deepEqual(metrics, BASE_METRICS);
  assert.notStrictEqual(metrics, source);
  assert.equal(Object.isFrozen(metrics), true);
  assert.deepEqual(source, BASE_METRICS);
});

test("FR-ENG-001 rejects incomplete, unknown, mistyped, and out-of-range snapshots", () => {
  assert.throws(
    () => createMetrics({ hp: 80, sanity: 70 }),
    assertMeterError("MISSING_METER"),
  );
  assert.throws(
    () => createMetrics({ hp: 80, sanity: 70, bond: 0, morale: 10 }),
    assertMeterError("UNKNOWN_METER"),
  );
  assert.throws(
    () => createMetrics({ hp: "80", sanity: 70, bond: 0 }),
    assertMeterError("INVALID_METRIC_VALUE"),
  );
  assert.throws(
    () => createMetrics({ hp: -1, sanity: 70, bond: 0 }),
    assertMeterError("METER_OUT_OF_RANGE"),
  );
  assert.throws(
    () => createMetrics({ hp: 80, sanity: 101, bond: 0 }),
    assertMeterError("METER_OUT_OF_RANGE"),
  );
  assert.throws(
    () => createMetrics(null),
    assertMeterError("INVALID_METRIC_SNAPSHOT"),
  );
});

test("FR-ENG-001 applies simultaneous deltas and clamps each result", () => {
  const source = { ...BASE_METRICS };
  const deltas = { hp: -100, sanity: 100, bond: 200 };
  const result = applyMetricDeltas(source, deltas);

  assert.deepEqual(result, { hp: 0, sanity: 100, bond: 100 });
  assert.equal(Object.isFrozen(result), true);
  assert.deepEqual(source, BASE_METRICS);
  assert.deepEqual(deltas, { hp: -100, sanity: 100, bond: 200 });
  assert.deepEqual(applyMetricDeltas(BASE_METRICS, {}), BASE_METRICS);
});

test("FR-ENG-001 rejects malformed deltas and safe-integer overflow", () => {
  assert.throws(
    () => applyMetricDeltas(BASE_METRICS, { morale: 1 }),
    assertMeterError("UNKNOWN_METER"),
  );
  assert.throws(
    () => applyMetricDeltas(BASE_METRICS, { hp: 0.5 }),
    assertMeterError("INVALID_METRIC_DELTA"),
  );
  assert.throws(
    () => applyMetricDeltas(BASE_METRICS, []),
    assertMeterError("INVALID_METRIC_DELTAS"),
  );
  assert.throws(
    () => applyMetricDeltas(BASE_METRICS, { hp: Number.MAX_SAFE_INTEGER }),
    assertMeterError("METER_ARITHMETIC_OVERFLOW"),
  );
});

test("FR-ENG-001 aggregates adjustments before clamp and is effect-order invariant", () => {
  const source = { hp: 50, sanity: 50, bond: 50 };
  const effects = [
    { type: "adjust-metric", metric: "hp", amount: 80 },
    { type: "adjust-metric", metric: "hp", amount: -40 },
  ];

  const forward = applyMetricEffects(source, effects);
  const reverse = applyMetricEffects(source, [...effects].reverse());

  assert.deepEqual(forward, { hp: 90, sanity: 50, bond: 50 });
  assert.deepEqual(reverse, forward);
  assert.deepEqual(source, { hp: 50, sanity: 50, bond: 50 });
  assert.deepEqual(effects, [
    { type: "adjust-metric", metric: "hp", amount: 80 },
    { type: "adjust-metric", metric: "hp", amount: -40 },
  ]);
});

test("FR-ENG-001 applies independent set and adjust effects atomically", () => {
  const result = applyMetricEffects(BASE_METRICS, [
    { type: "set-metric", metric: "hp", value: 12 },
    { type: "adjust-metric", metric: "sanity", amount: -100 },
    { type: "adjust-metric", metric: "bond", amount: 15 },
  ]);

  assert.deepEqual(result, { hp: 12, sanity: 0, bond: 15 });
  assert.equal(Object.isFrozen(result), true);
  assert.deepEqual(applyMetricEffects(BASE_METRICS, []), BASE_METRICS);
});

test("FR-ENG-002 rejects every set/adjust conflict, including a zero adjustment", () => {
  const conflicts = [
    [
      { type: "set-metric", metric: "hp", value: 50 },
      { type: "adjust-metric", metric: "hp", amount: 1 },
    ],
    [
      { type: "adjust-metric", metric: "hp", amount: 1 },
      { type: "set-metric", metric: "hp", value: 50 },
    ],
    [
      { type: "adjust-metric", metric: "hp", amount: 0 },
      { type: "set-metric", metric: "hp", value: 50 },
    ],
    [
      { type: "set-metric", metric: "hp", value: 50 },
      { type: "set-metric", metric: "hp", value: 50 },
    ],
  ];

  for (const effects of conflicts) {
    assert.throws(
      () => applyMetricEffects(BASE_METRICS, effects),
      assertMeterError("METRIC_EFFECT_CONFLICT"),
    );
  }
});

test("FR-ENG-001 rejects malformed metric effects without changing pre-state", () => {
  const source = { ...BASE_METRICS };
  const invalidCases = [
    {
      effects: null,
      code: "INVALID_METRIC_EFFECTS",
    },
    {
      effects: [{ type: "set-flag", flagId: "story.started", value: true }],
      code: "INVALID_METRIC_EFFECT",
    },
    {
      effects: [{ type: "adjust-metric", metric: "morale", amount: 1 }],
      code: "UNKNOWN_METER",
    },
    {
      effects: [{ type: "adjust-metric", metric: "hp", amount: 0.5 }],
      code: "INVALID_METRIC_DELTA",
    },
    {
      effects: [{ type: "set-metric", metric: "hp", value: 101 }],
      code: "METER_OUT_OF_RANGE",
    },
  ];

  for (const { effects, code } of invalidCases) {
    assert.throws(
      () => applyMetricEffects(source, effects),
      assertMeterError(code),
    );
    assert.deepEqual(source, BASE_METRICS);
  }
});

test("ADR-P0-004 returns the same immutable metrics for repeated fixed inputs", () => {
  const effects = Object.freeze([
    Object.freeze({ type: "adjust-metric", metric: "hp", amount: -12 }),
    Object.freeze({ type: "adjust-metric", metric: "sanity", amount: 7 }),
    Object.freeze({ type: "set-metric", metric: "bond", value: 22 }),
  ]);
  const expected = { hp: 68, sanity: 77, bond: 22 };

  for (let iteration = 0; iteration < 100; iteration += 1) {
    assert.deepEqual(applyMetricEffects(BASE_METRICS, effects), expected);
  }
});
