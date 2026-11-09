/**
 * Stable error codes of the Journey runtime (ADR-P0-034 D2.1).
 *
 * Shells and the journey session reject bad input with one of these codes and never
 * mutate their inputs. Codes are part of the contract with the UI and the tests; add
 * new codes, never rename or reuse one.
 *
 * Trace: ADR-P0-034 D2/D9, TC-S5-CLASH-001, TC-S5-STATE-001.
 */

export const JOURNEY_ERROR_CODES = Object.freeze({
  /** The package breaks a rule the runtime relies on that the schema cannot express. */
  PACKAGE_INVALID: "JOURNEY_PACKAGE_INVALID",
  /** A journey state, cursor or encounter is malformed or inconsistent. */
  STATE_INVALID: "JOURNEY_STATE_INVALID",
  /** A command was issued for an older revision of the session. */
  REVISION: "JOURNEY_REVISION",
  /** The command does not belong to the current beat. */
  BEAT: "JOURNEY_BEAT",
  /** The command names an option, activity or ending the node does not have. */
  OPTION_UNKNOWN: "JOURNEY_OPTION_UNKNOWN",
  /** The option exists but cannot be taken in this state. */
  OPTION_UNAVAILABLE: "JOURNEY_OPTION_UNAVAILABLE",
  /** An effect cannot apply (for example a grant into a full pouch). Content defect. */
  EFFECT_FAILED: "JOURNEY_EFFECT_FAILED",
  /** The camp still has drops and activities left. */
  CAMP_UNFINISHED: "JOURNEY_CAMP_UNFINISHED",
  /** No act-start snapshot exists for the requested act. */
  REPLAY_UNAVAILABLE: "JOURNEY_REPLAY_UNAVAILABLE",
  /** A command was malformed (wrong type or missing field). */
  COMMAND_INVALID: "JOURNEY_COMMAND_INVALID",
  CLASH_ROUND_UNKNOWN: "CLASH_ROUND_UNKNOWN",
  CLASH_ROUND_INVALID: "CLASH_ROUND_INVALID",
  CLASH_STATE_INVALID: "CLASH_STATE_INVALID",
  CLASH_ACTION_UNKNOWN: "CLASH_ACTION_UNKNOWN",
  CLASH_ACTION_ILLEGAL: "CLASH_ACTION_ILLEGAL",
  CLASH_ENDED: "CLASH_ENDED",
  CLASH_NOT_ENDED: "CLASH_NOT_ENDED",
});

const CODES = new Set(Object.values(JOURNEY_ERROR_CODES));

/** Typed rejection. `details` is frozen plain data safe to show in a developer console. */
export class JourneyError extends Error {
  /**
   * @param {string} code One of JOURNEY_ERROR_CODES.
   * @param {string} message Developer-facing explanation.
   * @param {Record<string, unknown>} [details]
   */
  constructor(code, message, details = {}) {
    if (!CODES.has(code)) throw new TypeError(`Unknown journey error code ${code}`);
    super(message);
    this.name = "JourneyError";
    this.code = code;
    this.details = Object.freeze({ ...details });
  }
}

/**
 * @param {unknown} condition @param {string} code @param {string} message
 * @param {Record<string, unknown>} [details]
 * @returns {asserts condition}
 */
export function ensure(condition, code, message, details) {
  if (!condition) throw new JourneyError(code, message, details);
}
