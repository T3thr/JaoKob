/**
 * Conditions of the closed vocabulary (schema 3.0.0 `$defs/condition`): whether a line
 * shows, a choice is offered or a camp activity is open. A condition is data, never code
 * (ADR-P0-034 D4.3). Unknown shapes are a package defect.
 *
 * Trace: ADR-P0-034 D4, journey-common.schema.json#/$defs/condition, TC-S5-STATE-001.
 */

import { JOURNEY_ERROR_CODES, JourneyError } from "./journey-errors.js";

/**
 * @param {object} condition A condition of the closed vocabulary.
 * @param {object} journey A JourneyState.
 * @returns {boolean}
 */
export function holds(condition, journey) {
  const [kind, ...extra] = condition !== null && typeof condition === "object" ? Object.keys(condition) : [];
  const value = kind === undefined ? undefined : condition[kind];
  if (extra.length === 0) {
    switch (kind) {
      case "all": if (Array.isArray(value) && value.length > 0) return value.every((c) => holds(c, journey)); break;
      case "any": if (Array.isArray(value) && value.length > 0) return value.some((c) => holds(c, journey)); break;
      case "not": return !holds(value, journey);
      case "hasItem": return journey.pouch.held.includes(value);
      case "flag": return journey.flags.includes(value);
      case "meterAtLeast": if (Object.hasOwn(journey.meters, value?.meter)) return journey.meters[value.meter] >= value.value; break;
      case "bondAtLeast": if (Object.hasOwn(journey.bonds, value?.bond)) return journey.bonds[value.bond] >= value.value; break;
      case "counterAtLeast": if (["familySkillUses", "selfReliance"].includes(value?.counter)) return journey.counters[value.counter] >= value.value; break;
      case "major": return journey.major === value;
      case "route": return journey.route === value;
      case "plan": return journey.plan === value;
      default: break;
    }
  }
  throw new JourneyError(JOURNEY_ERROR_CODES.PACKAGE_INVALID, `unknown condition ${JSON.stringify(condition)}`, { condition: JSON.stringify(condition) });
}

/** A missing condition always holds. */
export const allows = (condition, journey) => condition === undefined || holds(condition, journey);

/**
 * The entries of a line list whose `when` holds, in order.
 *
 * @param {{text:string, when?:object}[]} lines @param {object} journey
 * @returns {{text:string, when?:object}[]}
 */
export const visibleLines = (lines, journey) => lines.filter((line) => allows(line.when, journey));
