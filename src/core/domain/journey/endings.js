/**
 * The three endings at A5-11 and the Safety Fallback (master plan §2.13, UX §6.2).
 *
 *   E-HOME  button ∧ (Teuk bond ≥ 2 ∨ whistle ∨ ribbon) ∧ ใจ ≥ 2
 *   E-POND  (familySkillUses ≥ 2 ∨ seeds ∨ guard) ∧ กาย ≥ 2 ∧ แรง ≥ 2
 *           or opened by the Safety Fallback when no ending is open at all
 *   E-DAWN  familySkillUses ≥ 3 ∧ selfReliance ≥ 4 ∧ ใจ ≥ 3 ∧ แรง ≥ 3
 *           ∧ every companion bond ≥ 2 ∧ one bond ≥ 3 ∧ (seeds ∨ guard) ∧ (whistle ∨ ribbon)
 *
 * The button is the mission's heart and never counts as the human-promise keepsake. Only
 * the journey decides: settings, audio and accessibility never change which ending opens.
 * A locked ending shows the in-story line of its first missing condition, in the order the
 * package lists them; the lock reasons of each ending are fixed by Core.
 *
 * Trace: master plan §2.13, UX §6.2, ADR-P0-032 D5.4, ADR-P0-034 D4.1, TC-S5-ENDING-001.
 */

import { KEEPSAKES } from "../clash/clash-rules.js";
import { BONDS } from "./journey-rules.js";

export const ENDINGS = Object.freeze(["e-home", "e-pond", "e-dawn"]);

const has = (journey, item) => journey.pouch.held.includes(item);
const roots = (j) => has(j, KEEPSAKES.seeds) || has(j, KEEPSAKES.guard);
const promise = (j) => has(j, KEEPSAKES.whistle) || has(j, KEEPSAKES.ribbon);

/** What each lock reason checks, as "this part is satisfied". */
const SATISFIED = Object.freeze({
  mind: (j) => j.meters.mind >= 2,
  promise: (j) => has(j, KEEPSAKES.button) && (j.bonds.teuk >= 2 || promise(j)),
  legs: (j) => j.meters.hp >= 2 && j.meters.sta >= 2,
  roots: (j) => j.counters.familySkillUses >= 2 || roots(j),
  "family-skill": (j) => j.counters.familySkillUses >= 3,
  "self-reliance": (j) => j.counters.selfReliance >= 4,
  "mind-sta": (j) => j.meters.mind >= 3 && j.meters.sta >= 3,
  bonds: (j) => BONDS.every((b) => j.bonds[b] >= 2) && BONDS.some((b) => j.bonds[b] >= 3),
  "two-worlds": (j) => roots(j) && promise(j),
});

/** The lock reasons that make up each ending's condition. */
export const ENDING_REASONS = Object.freeze({
  "e-home": Object.freeze(["mind", "promise"]),
  "e-pond": Object.freeze(["legs", "roots"]),
  "e-dawn": Object.freeze(["family-skill", "self-reliance", "mind-sta", "bonds", "two-worlds"]),
});

/**
 * The strands drawn on each ending card (UX §6.2). A twisted pair lights when either of
 * its threads lights.
 */
function strandsOf(j) {
  return {
    "e-home": { heart: j.meters.mind >= 2, promise: j.bonds.teuk >= 2 || promise(j), button: has(j, KEEPSAKES.button) },
    "e-pond": { legs: j.meters.hp >= 2 && j.meters.sta >= 2, roots: j.counters.familySkillUses >= 2 || roots(j) },
    "e-dawn": {
      core: j.meters.mind >= 3 && j.meters.sta >= 3 && j.counters.selfReliance >= 4,
      bonds: j.counters.familySkillUses >= 3 && SATISFIED.bonds(j),
      worlds: roots(j) && promise(j),
    },
  };
}

/**
 * Evaluate the three endings for a journey.
 *
 * @param {object} journey A JourneyState.
 * @returns {{fallback: boolean, endings: Record<string, {open: boolean, missing: string[], strands: Record<string, boolean>}>}}
 *   `missing` lists the unsatisfied lock reasons in Core order; the session orders them by
 *   the package. E-POND is open when its own condition holds or through the fallback.
 */
export function evaluateEndings(journey) {
  const strands = strandsOf(journey);
  const endings = {};
  for (const id of ENDINGS) {
    const missing = ENDING_REASONS[id].filter((reason) => !SATISFIED[reason](journey));
    endings[id] = { open: missing.length === 0, missing, strands: strands[id] };
  }
  const fallback = ENDINGS.every((id) => !endings[id].open);
  if (fallback) endings["e-pond"].open = true;
  return { fallback, endings };
}
