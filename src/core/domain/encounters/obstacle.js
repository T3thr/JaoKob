/**
 * Obstacles: the Four Keys, rushing ahead, waiting for the moment, and grit (master plan
 * §2.2–§2.4). Every obstacle offers at least one way that costs no stamina, and grit is
 * always the last way, so no obstacle can block the journey.
 *
 *   skill · sibling   free; leaning on home (counts and can make the frog homesick from Act 2)
 *   item · combo      free with the keepsake; a combo is the golden Item × Bond option
 *   friend            free when the companion's bond reaches the option's minimum
 *   alone             แรง −1 or −2; needs ใจ ≥ 3 and enough stamina left; selfReliance +1
 *   rush              แรง −2; needs แรง ≥ 3; next clash opens one light higher (max +2); selfReliance +1
 *   wait              free; next clash opens one light lower (min −1)
 *   grit              กาย −1 · แรง −2; always open; selfReliance +1; may end in Grace
 *
 * A combo or friend option in the package asserts that the companion stands there; the
 * balance model proves the story places each one only where the companion is present.
 *
 * Trace: master plan §2.2–§2.4 · §2.7 · §2.10, ADR-P0-034 D4.1, TC-S5-STATE-001.
 */

import { affordable, applyEffects } from "../journey/effects.js";
import {
  COUNTED_FROM_ACT, bumpCounter, catchWithGrace, clampMeter, clampTempo, leanOnFamily, payGrit, standOnOwn,
} from "../journey/journey-rules.js";

export const METHODS = Object.freeze(["skill", "sibling", "item", "combo", "friend", "alone", "rush", "wait", "grit"]);
/** Standing alone needs a steady mind. */
export const ALONE_MIN_MIND = 3;
export const RUSH_MIN_STA = 3;
export const RUSH_COST_STA = 2;

/**
 * Why an option is closed now, or null when it is open.
 *
 * @param {object} option Obstacle option from the package. @param {object} journey
 * @returns {null|"item-missing"|"bond-low"|"mind-low"|"sta-low"}
 */
export function obstacleBlock(option, journey) {
  const m = option.method;
  switch (m.kind) {
    case "item":
    case "combo":
      if (!journey.pouch.held.includes(m.item)) return "item-missing";
      break;
    case "friend":
      if (journey.bonds[m.ally] < m.minBond) return "bond-low";
      break;
    case "alone":
      if (journey.meters.mind < ALONE_MIN_MIND) return "mind-low";
      if (journey.meters.sta < m.needSta) return "sta-low";
      break;
    case "rush":
      if (journey.meters.sta < RUSH_MIN_STA) return "sta-low";
      break;
    default:
      break;
  }
  return affordable(option.effects, journey) ? null : "sta-low";
}

/** Stamina pips the method costs (the view shows them; grit also costs one body). */
export function methodCost(method) {
  switch (method.kind) {
    case "alone": return { sta: method.sta };
    case "rush": return { sta: RUSH_COST_STA };
    case "grit": return { hp: 1, sta: 2 };
    default: return {};
  }
}

/** Whether pressing the option now would make the frog homesick (the "ซ้ำ" warning). */
export const obstacleHomesick = (option, journey) => (option.method.kind === "skill" || option.method.kind === "sibling")
  && journey.act >= COUNTED_FROM_ACT && journey.counters.homeStreak >= 1;

/**
 * Resolve the chosen option on a mutable JourneyState draft: the method first, then the
 * option's own effects. The caller has checked that the option is open.
 *
 * @param {object} draft @param {object} option @param {import("../journey/effects.js").EffectRules} rules
 * @returns {{homesick: boolean, grace: boolean}}
 */
export function resolveObstacle(draft, option, rules) {
  const m = option.method;
  const counted = draft.act >= COUNTED_FROM_ACT;
  let homesick = false;
  let grace = false;
  switch (m.kind) {
    case "skill":
    case "sibling":
      homesick = leanOnFamily(draft.meters, draft.counters, draft.act) > 0;
      if (homesick) draft.counters.homesickCount = bumpCounter(draft.counters.homesickCount);
      break;
    case "alone":
      standOnOwn(draft.counters);
      draft.meters.sta = clampMeter(draft.meters.sta - m.sta);
      if (counted) draft.counters.selfReliance = bumpCounter(draft.counters.selfReliance);
      break;
    case "rush":
      standOnOwn(draft.counters);
      draft.meters.sta = clampMeter(draft.meters.sta - RUSH_COST_STA);
      draft.counters.tempo = clampTempo(draft.counters.tempo + 1);
      if (counted) draft.counters.selfReliance = bumpCounter(draft.counters.selfReliance);
      break;
    case "wait":
      standOnOwn(draft.counters);
      draft.counters.tempo = clampTempo(draft.counters.tempo - 1);
      break;
    case "grit":
      standOnOwn(draft.counters);
      if (counted) draft.counters.selfReliance = bumpCounter(draft.counters.selfReliance);
      payGrit(draft.meters);
      grace = catchWithGrace(draft.meters);
      break;
    default:
      standOnOwn(draft.counters);
      break;
  }
  applyEffects(draft, option.effects, rules);
  return { homesick, grace };
}
