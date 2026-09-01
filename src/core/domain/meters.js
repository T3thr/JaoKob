/**
 * Pure metric-domain operations for HP, sanity, and bond.
 *
 * The module performs no coercion and has no browser, storage, clock, or
 * localization dependency. Invalid inputs raise a typed programming/domain
 * error; callers that process untrusted data must validate it at the boundary
 * before invoking these operations.
 *
 * Trace: FR-ENG-001, FR-STA-004, GDD-MEC-001, ADR-P0-004.
 */

export const METER_MIN = 0;
export const METER_MAX = 100;
export const METER_NAMES = Object.freeze(["hp", "sanity", "bond"]);

const METER_NAME_SET = new Set(METER_NAMES);

/**
 * Typed error for a malformed metric snapshot or effect set.
 */
export class MeterInvariantError extends TypeError {
  /**
   * @param {string} code Stable machine-readable error code.
   * @param {string} message Developer-facing explanation.
   * @param {Readonly<Record<string, unknown>>} [details]
   */
  constructor(code, message, details = {}) {
    super(message);
    this.name = "MeterInvariantError";
    this.code = code;
    this.details = Object.freeze({ ...details });
  }
}

/**
 * @param {unknown} value
 * @returns {value is "hp" | "sanity" | "bond"}
 */
export function isMeterName(value) {
  return typeof value === "string" && METER_NAME_SET.has(value);
}

/**
 * Clamp a safe integer to the normative metric range.
 *
 * @param {number} value
 * @returns {number} Integer in the inclusive range 0..100.
 * @throws {MeterInvariantError} When value is not a safe integer.
 */
export function clampMeter(value) {
  assertSafeInteger(value, "INVALID_METER_VALUE", "value");
  return Math.min(METER_MAX, Math.max(METER_MIN, value));
}

/**
 * Validate and create an immutable metric snapshot.
 *
 * Unlike effect application, this constructor does not repair an invalid
 * pre-state by clamping it. Save and content boundaries must reject such data.
 *
 * @param {unknown} source
 * @returns {Readonly<{hp: number, sanity: number, bond: number}>}
 * @throws {MeterInvariantError} When shape, type, or range is invalid.
 */
export function createMetrics(source) {
  assertRecord(source, "INVALID_METRIC_SNAPSHOT", "metrics");
  assertExactMetricKeys(source);

  const metrics = {};
  for (const name of METER_NAMES) {
    const value = source[name];
    assertSafeInteger(value, "INVALID_METRIC_VALUE", name);
    if (value < METER_MIN || value > METER_MAX) {
      throw new MeterInvariantError(
        "METER_OUT_OF_RANGE",
        `Metric ${name} must be in the inclusive range ${METER_MIN}..${METER_MAX}.`,
        { metric: name, value },
      );
    }
    metrics[name] = value;
  }

  return Object.freeze(metrics);
}

/**
 * Apply one already-aggregated delta per metric from the same pre-state.
 * Missing metric keys mean a zero delta. Unknown keys and non-safe-integer
 * deltas are rejected. All results are clamped after the simultaneous update.
 *
 * @param {unknown} metrics
 * @param {unknown} deltas
 * @returns {Readonly<{hp: number, sanity: number, bond: number}>}
 * @throws {MeterInvariantError}
 */
export function applyMetricDeltas(metrics, deltas) {
  const preState = createMetrics(metrics);
  assertRecord(deltas, "INVALID_METRIC_DELTAS", "deltas");

  for (const name of Object.keys(deltas)) {
    if (!isMeterName(name)) {
      throw new MeterInvariantError(
        "UNKNOWN_METER",
        `Unknown metric key: ${name}.`,
        { metric: name },
      );
    }
    assertSafeInteger(deltas[name], "INVALID_METRIC_DELTA", name);
  }

  const next = {};
  for (const name of METER_NAMES) {
    const delta = Object.prototype.hasOwnProperty.call(deltas, name)
      ? deltas[name]
      : 0;
    next[name] = clampMeter(safeAdd(preState[name], delta, name));
  }

  return Object.freeze(next);
}

/**
 * Apply schema-compatible metric effects atomically.
 *
 * Multiple `adjust-metric` effects for one metric are added before clamping.
 * A metric may not have more than one `set-metric`, and set/adjust may not be
 * mixed for the same metric in one transaction. Effect ordering therefore
 * cannot change the result.
 *
 * @param {unknown} metrics
 * @param {unknown} effects Array containing only adjust-metric/set-metric effects.
 * @returns {Readonly<{hp: number, sanity: number, bond: number}>}
 * @throws {MeterInvariantError} For malformed or conflicting effects.
 */
export function applyMetricEffects(metrics, effects) {
  const preState = createMetrics(metrics);
  if (!Array.isArray(effects)) {
    throw new MeterInvariantError(
      "INVALID_METRIC_EFFECTS",
      "Metric effects must be an array.",
    );
  }

  const plans = Object.fromEntries(
    METER_NAMES.map((name) => [
      name,
      { adjustment: 0, adjustSeen: false, setSeen: false, setValue: 0 },
    ]),
  );

  for (let index = 0; index < effects.length; index += 1) {
    const effect = effects[index];
    assertRecord(effect, "INVALID_METRIC_EFFECT", `effects[${index}]`);

    if (effect.type !== "adjust-metric" && effect.type !== "set-metric") {
      throw new MeterInvariantError(
        "INVALID_METRIC_EFFECT",
        `Unsupported metric effect type at index ${index}.`,
        { index, type: effect.type },
      );
    }

    if (!isMeterName(effect.metric)) {
      throw new MeterInvariantError(
        "UNKNOWN_METER",
        `Unknown metric key at effect index ${index}.`,
        { index, metric: effect.metric },
      );
    }

    const plan = plans[effect.metric];
    if (effect.type === "set-metric") {
      assertSafeInteger(effect.value, "INVALID_METRIC_VALUE", `effects[${index}].value`);
      if (effect.value < METER_MIN || effect.value > METER_MAX) {
        throw new MeterInvariantError(
          "METER_OUT_OF_RANGE",
          `set-metric value at index ${index} must be in range 0..100.`,
          { index, metric: effect.metric, value: effect.value },
        );
      }
      if (plan.setSeen || plan.adjustSeen) {
        throw metricEffectConflict(effect.metric);
      }
      plan.setSeen = true;
      plan.setValue = effect.value;
      continue;
    }

    assertSafeInteger(effect.amount, "INVALID_METRIC_DELTA", `effects[${index}].amount`);
    if (plan.setSeen) {
      throw metricEffectConflict(effect.metric);
    }
    plan.adjustSeen = true;
    plan.adjustment = safeAdd(plan.adjustment, effect.amount, effect.metric);
  }

  const next = {};
  for (const name of METER_NAMES) {
    const plan = plans[name];
    next[name] = plan.setSeen
      ? plan.setValue
      : clampMeter(safeAdd(preState[name], plan.adjustment, name));
  }

  return Object.freeze(next);
}

/** @param {unknown} value @param {string} code @param {string} field */
function assertSafeInteger(value, code, field) {
  if (!Number.isSafeInteger(value)) {
    throw new MeterInvariantError(
      code,
      `${field} must be a safe integer without coercion.`,
      { field, value },
    );
  }
}

/** @param {unknown} value @param {string} code @param {string} field */
function assertRecord(value, code, field) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new MeterInvariantError(code, `${field} must be an object.`, { field });
  }
}

/** @param {Record<string, unknown>} source */
function assertExactMetricKeys(source) {
  const keys = Object.keys(source);
  for (const name of METER_NAMES) {
    if (!Object.prototype.hasOwnProperty.call(source, name)) {
      throw new MeterInvariantError(
        "MISSING_METER",
        `Metric snapshot is missing ${name}.`,
        { metric: name },
      );
    }
  }
  for (const key of keys) {
    if (!isMeterName(key)) {
      throw new MeterInvariantError(
        "UNKNOWN_METER",
        `Metric snapshot contains unknown key: ${key}.`,
        { metric: key },
      );
    }
  }
}

/** @param {number} left @param {number} right @param {string} metric */
function safeAdd(left, right, metric) {
  const result = left + right;
  if (!Number.isSafeInteger(result)) {
    throw new MeterInvariantError(
      "METER_ARITHMETIC_OVERFLOW",
      `Metric arithmetic overflow for ${metric}.`,
      { metric },
    );
  }
  return result;
}

/** @param {string} metric */
function metricEffectConflict(metric) {
  return new MeterInvariantError(
    "METRIC_EFFECT_CONFLICT",
    `Conflicting metric effects for ${metric}.`,
    { metric },
  );
}
