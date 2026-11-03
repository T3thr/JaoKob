/**
 * Shelter camps (master plan §2.9, UX §4): a budget of water drops, one activity per drop,
 * no activity twice, at most one activity from each exclusive group (the splint or the
 * wrap), and "ready a keepsake" that makes one held keepsake push one more light on its
 * first use in the next clash. The frog leaves once the drops are spent, or earlier only
 * when nothing is left to do.
 *
 * The camp encounter of Save Format 2 is `{kind: "camp", camp, dropsLeft, chosen}`; the
 * journey changes as each activity is picked, and leaving clears the encounter
 * (exitCamp, ADR-P0-034 D3.3).
 *
 * Trace: master plan §2.9, UX §4.1, ADR-P0-034 D3/D7, TC-S5-STATE-001.
 */

import { affordable, applyEffects } from "../journey/effects.js";
import { allows } from "../journey/conditions.js";

/** @param {object} node Camp node. @returns {object} The camp encounter at arrival. */
export const openCamp = (node) => ({ kind: "camp", camp: node.camp, dropsLeft: node.drops, chosen: [] });

/** Keepsakes the "ready" activity may pick now: held and not ready yet. */
export const readyCandidates = (journey) => journey.pouch.held.filter((item) => !journey.ready.includes(item));

/**
 * Why an activity is closed now, or null when it can be picked.
 *
 * @param {object} activity @param {object} node @param {object} journey @param {object} camp Camp encounter.
 * @returns {null|"chosen"|"no-drops"|"group-taken"|"not-now"|"nothing-to-ready"|"sta-low"}
 */
export function activityBlock(activity, node, journey, camp) {
  if (camp.chosen.includes(activity.key)) return "chosen";
  if (camp.dropsLeft <= 0) return "no-drops";
  if (activity.group !== undefined && camp.chosen.some((key) => node.activities.find((a) => a.key === key)?.group === activity.group)) return "group-taken";
  if (!allows(activity.when, journey)) return "not-now";
  if (activity.ready === true && readyCandidates(journey).length === 0) return "nothing-to-ready";
  return affordable(activity.effects, journey) ? null : "sta-low";
}

/** Whether the frog may leave: no drops left, or no activity can be picked any more. */
export const campFinished = (node, journey, camp) => camp.dropsLeft === 0
  || node.activities.every((activity) => activityBlock(activity, node, journey, camp) !== null);

/**
 * Pick an open activity on a mutable JourneyState draft. For the ready activity, `item`
 * names the held keepsake to ready. The caller has checked the activity and the item.
 *
 * @returns {object} The camp encounter after the pick.
 */
export function pickActivity(draft, activity, camp, rules, item) {
  applyEffects(draft, activity.effects, rules);
  if (activity.ready === true) applyEffects(draft, [{ op: "item.ready", item }], rules);
  return { kind: "camp", camp: camp.camp, dropsLeft: camp.dropsLeft - 1, chosen: [...camp.chosen, activity.key] };
}
