/**
 * Effects of the closed vocabulary (schema 3.0.0 `$defs/effect`) applied to a JourneyState
 * draft, in order. The meaning of every word lives here (ADR-P0-034 D4.1); the package only
 * says which words a node uses.
 *
 *   meter.set     set all three meters (the frog grows up at A1-04)
 *   meter.add     gain, up to 5
 *   meter.spend   a voluntary cost; it may never empty a meter, so an option whose cost
 *                 would is not offered (see affordable)
 *   meter.hazard  a story hazard; never below the soft floor
 *   floor.rest    the rest floor at the end of an act
 *   bond.add      bond with a companion, up to 4; bonds never drop
 *   flag.set      a registered story flag
 *   pick.major · pick.route · pick.plan
 *   item.grant    a new keepsake into a free slot (ADR-P0-020)
 *   item.release  hand a keepsake on; a locked keepsake (the button) never leaves
 *   item.ready    the keepsake pushes one more light on its first use in the next clash
 *
 * Trace: master plan §2.1 · §2.5 · §2.6 · §2.9, ADR-P0-020, ADR-P0-034 D3/D4, TC-S5-STATE-001.
 */

import { collectItem, releaseItem } from "../keepsake-pouch.js";
import { JOURNEY_ERROR_CODES, JourneyError } from "./journey-errors.js";
import { METERS, SOFT_FLOOR, clampBond, clampMeter, raiseToFloor, softDecrease } from "./journey-rules.js";
import { READY_MAX } from "./journey-state.js";
import { cloneData } from "./plain-data.js";

/**
 * @typedef {object} EffectRules Package facts the effects need.
 * @property {ReadonlySet<string>} lockedItems Keepsakes that can never be released.
 */

const failed = (effect, reason) => new JourneyError(JOURNEY_ERROR_CODES.EFFECT_FAILED, `${effect.op} cannot apply: ${reason}`, { op: effect.op, item: effect.item ?? null, reason });

function pouchAfter(result, effect) {
  if (!result.ok) throw failed(effect, result.error.code);
  return cloneData(result.value);
}

/**
 * Apply one effect to a mutable JourneyState draft.
 *
 * @param {object} draft @param {object} effect @param {EffectRules} rules
 */
export function applyEffect(draft, effect, rules) {
  switch (effect?.op) {
    case "meter.set":
      for (const name of METERS) draft.meters[name] = effect.meters[name];
      return;
    case "meter.add":
      draft.meters[effect.meter] = clampMeter(draft.meters[effect.meter] + effect.amount);
      return;
    case "meter.spend": {
      const left = draft.meters[effect.meter] - effect.amount;
      if (left < SOFT_FLOOR) throw failed(effect, "a cost may never empty a meter");
      draft.meters[effect.meter] = left;
      return;
    }
    case "meter.hazard":
      draft.meters[effect.meter] = softDecrease(draft.meters[effect.meter], effect.amount);
      return;
    case "floor.rest":
      raiseToFloor(draft.meters, effect.meters);
      return;
    case "bond.add":
      draft.bonds[effect.bond] = clampBond(draft.bonds[effect.bond] + effect.amount);
      return;
    case "flag.set":
      if (!draft.flags.includes(effect.flag)) draft.flags.push(effect.flag);
      return;
    case "pick.major":
      draft.major = effect.value;
      return;
    case "pick.route":
      draft.route = effect.value;
      return;
    case "pick.plan":
      draft.plan = effect.value;
      return;
    case "item.grant":
      draft.pouch = pouchAfter(collectItem(draft.pouch, effect.item), effect);
      return;
    case "item.release":
      if (rules.lockedItems.has(effect.item)) throw failed(effect, "the keepsake is locked");
      draft.pouch = pouchAfter(releaseItem(draft.pouch, effect.item), effect);
      return;
    case "item.ready":
      if (!draft.ready.includes(effect.item)) {
        if (draft.ready.length >= READY_MAX) throw failed(effect, "four keepsakes are ready already");
        draft.ready.push(effect.item);
      }
      return;
    default:
      throw new JourneyError(JOURNEY_ERROR_CODES.PACKAGE_INVALID, `unknown effect ${JSON.stringify(effect)}`, { effect: JSON.stringify(effect) });
  }
}

/**
 * Apply effects in order to a mutable draft.
 *
 * @param {object} draft @param {object[]|undefined} effects @param {EffectRules} rules
 */
export function applyEffects(draft, effects, rules) {
  for (const effect of effects ?? []) applyEffect(draft, effect, rules);
}

/**
 * What a list of effects gives, for the card that offers it (UX §0.2 "บอกก่อนเก็บ", §4.1.3):
 * meters it adds, bonds it ties, keepsakes it readies, takes in or hands on. Voluntary costs
 * are read through `affordable` and the cost pips; flags, picks, floors and hazards are story
 * state that no card shows. The meaning of each word stays here, so the screen only names it.
 *
 * @param {object[]|undefined} effects
 * @returns {{meters: Record<string, number>, bonds: Record<string, number>, ready: string[], grant: string[], release: string[]}}
 */
export function effectSummary(effects) {
  const summary = { meters: {}, bonds: {}, ready: [], grant: [], release: [] };
  for (const effect of effects ?? []) {
    if (effect.op === "meter.add") summary.meters[effect.meter] = (summary.meters[effect.meter] ?? 0) + effect.amount;
    else if (effect.op === "bond.add") summary.bonds[effect.bond] = (summary.bonds[effect.bond] ?? 0) + effect.amount;
    else if (effect.op === "item.ready") summary.ready.push(effect.item);
    else if (effect.op === "item.grant") summary.grant.push(effect.item);
    else if (effect.op === "item.release") summary.release.push(effect.item);
  }
  return summary;
}

/**
 * Whether every voluntary cost in `effects` leaves each meter at one or more.
 *
 * @param {object[]|undefined} effects @param {object} journey
 * @returns {boolean}
 */
export function affordable(effects, journey) {
  const spent = { hp: 0, mind: 0, sta: 0 };
  for (const effect of effects ?? []) if (effect.op === "meter.spend") spent[effect.meter] += effect.amount;
  return METERS.every((name) => journey.meters[name] - spent[name] >= SOFT_FLOOR);
}
