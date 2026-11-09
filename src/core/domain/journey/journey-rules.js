/**
 * Journey rules shared by every encounter: the three meters and their soft floor, grit
 * and Grace, rest floors, the homesick rule for leaning on family, bonds and how the
 * companions address the frog, and tempo.
 *
 * Pure and deterministic: no clock, no randomness, no browser or storage access. The
 * functions that take a record mutate only the working draft they are given; callers
 * own copying and freezing. Numbers are frozen for T2 (Sprint 5 SSOT §1.2 Q2); changing
 * one needs the PO and a rerun of the proofs in docs/design-system/evidence/.
 *
 * Trace: master plan §2.1–§2.5, ADR-P0-034 D3/D4, TC-S5-STATE-001.
 */

export const METERS = Object.freeze(["hp", "mind", "sta"]);
export const METER_MIN = 0;
export const METER_MAX = 5;
/** Story hazards and enemy hits never take a meter below this. */
export const SOFT_FLOOR = 1;
/** When grit empties a meter, someone catches the frog and every meter returns to at least this. */
export const GRACE_FLOOR = 2;

export const BONDS = Object.freeze(["pkam", "fiw", "teuk"]);
export const BOND_MIN = 0;
export const BOND_MAX = 4;
/** The family bond is full once Act 1 ends and never drops; it is derived, never saved. */
export const FAMILY_BOND = 4;
/** Bond level from which a companion's assist unlocks (once per clash). */
export const ASSIST_BOND = 3;

/** familySkillUses, selfReliance and the homesick penalty start counting in Act 2. */
export const COUNTED_FROM_ACT = 2;
export const COUNTER_MAX = 99;
export const TEMPO_MIN = -1;
export const TEMPO_MAX = 2;

export const GRIT_COST = Object.freeze({ hp: 1, sta: 2 });
export const HOMESICK_COST = Object.freeze({ mind: 1, sta: 1 });
export const FINAL_ACT = 5;

/** @param {number} value @returns {number} */
export const clampMeter = (value) => Math.max(METER_MIN, Math.min(METER_MAX, value));
/** @param {number} value @returns {number} */
export const clampBond = (value) => Math.max(BOND_MIN, Math.min(BOND_MAX, value));
/** @param {number} value @returns {number} */
export const clampTempo = (value) => Math.max(TEMPO_MIN, Math.min(TEMPO_MAX, value));
/** @param {number} value @returns {number} */
export const bumpCounter = (value) => Math.min(COUNTER_MAX, value + 1);

/**
 * A hazard or an enemy hit: lower a meter by `amount` but never below the soft floor.
 * A meter already at or below the floor (only grit can put it there) stays as it is.
 *
 * @param {number} value @param {number} [amount] @returns {number}
 */
export const softDecrease = (value, amount = 1) => (value <= SOFT_FLOOR ? value : Math.max(SOFT_FLOOR, value - amount));

/**
 * Pay for grit (กาย −1 · แรง −2). This is the only payment that may empty a meter.
 *
 * @param {{hp:number, sta:number}} meters Working draft, mutated.
 */
export function payGrit(meters) {
  meters.hp = clampMeter(meters.hp - GRIT_COST.hp);
  meters.sta = clampMeter(meters.sta - GRIT_COST.sta);
}

/**
 * Narrative Grace: when any meter is empty, someone catches the frog and every meter
 * returns to at least two.
 *
 * @param {{hp:number, mind:number, sta:number}} meters Working draft, mutated.
 * @returns {boolean} Whether Grace happened.
 */
export function catchWithGrace(meters) {
  if (meters.hp > METER_MIN && meters.mind > METER_MIN && meters.sta > METER_MIN) return false;
  meters.hp = Math.max(meters.hp, GRACE_FLOOR);
  meters.mind = Math.max(meters.mind, GRACE_FLOOR);
  meters.sta = Math.max(meters.sta, GRACE_FLOOR);
  return true;
}

/**
 * Rest floor at the end of an act: raise each meter to at least the floor value.
 *
 * @param {{hp:number, mind:number, sta:number}} meters Working draft, mutated.
 * @param {{hp:number, mind:number, sta:number}} floor
 */
export function raiseToFloor(meters, floor) {
  for (const name of METERS) meters[name] = Math.max(meters[name], floor[name]);
}

/**
 * One use of a family skill or of a sibling's help. From Act 2 it counts as a family
 * skill use, and a use right after another one makes the frog homesick (ใจ −1 · แรง −1,
 * never below the soft floor). The streak counts across obstacles and clash turns.
 *
 * @param {{mind:number, sta:number}} meters Working draft, mutated.
 * @param {{familySkillUses:number, homeStreak:number}} counters Working draft, mutated.
 * @param {number} act
 * @returns {number} How many family uses came right before this one when it made the frog
 *   homesick (the clash weakens a repeated skill by two light per repeat), otherwise 0.
 */
export function leanOnFamily(meters, counters, act) {
  let repeats = 0;
  if (act >= COUNTED_FROM_ACT) {
    counters.familySkillUses = bumpCounter(counters.familySkillUses);
    if (counters.homeStreak >= 1) {
      meters.mind = softDecrease(meters.mind, HOMESICK_COST.mind);
      meters.sta = softDecrease(meters.sta, HOMESICK_COST.sta);
      repeats = counters.homeStreak;
    }
  }
  counters.homeStreak = Math.min(COUNTER_MAX, counters.homeStreak + 1);
  return repeats;
}

/**
 * Any other way of acting (an item, a companion, standing alone, guarding, resting)
 * ends the run of family help, so the next family use is free again.
 *
 * @param {{homeStreak:number}} counters Working draft, mutated.
 */
export function standOnOwn(counters) {
  counters.homeStreak = 0;
}

/**
 * How a companion addresses the frog at a bond level: tier 1 at 0–1, tier 2 at 2 and
 * tier 3 at 3–4 (master plan §2.5). The words of each tier live in the blueprints.
 *
 * @param {number} bond @returns {1|2|3}
 */
export const addressTier = (bond) => (bond >= ASSIST_BOND ? 3 : bond === 2 ? 2 : 1);
