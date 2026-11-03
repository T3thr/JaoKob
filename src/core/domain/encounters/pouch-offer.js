/**
 * A new keepsake is offered (ADR-P0-020 D5, UX §7): take it into a free slot, or, when all
 * four slots are full, take it by handing one keepsake on to its receiver in the story, or
 * refuse it and keep it as a memory. The button (`locked`) can never be handed on. Nothing
 * is ever deleted: handed-on and refused keepsakes stay in the pouch's memory.
 *
 * Trace: ADR-P0-020, master plan §2.6, UX §7, ADR-P0-034 D3.1, TC-S5-STATE-001.
 */

import { POUCH_CAPACITY, collectItem, refuseItem, replaceItem } from "../keepsake-pouch.js";
import { JOURNEY_ERROR_CODES, JourneyError } from "../journey/journey-errors.js";
import { affordable, applyEffects } from "../journey/effects.js";
import { cloneData } from "../journey/plain-data.js";

/**
 * Every choice of the offer, in package order: take, each hand-on, refuse.
 *
 * @param {object} offer The node's offer. @returns {{kind: "take"|"release"|"refuse", choice: object}[]}
 */
export const offerChoices = (offer) => [
  { kind: "take", choice: offer.take },
  ...offer.releases.map((choice) => ({ kind: "release", choice })),
  { kind: "refuse", choice: offer.refuse },
];

/**
 * Why a choice is closed now, or null when it is open.
 *
 * @returns {null|"pouch-full"|"pouch-not-full"|"not-held"|"locked"|"sta-low"}
 */
export function offerBlock(entry, journey, lockedItems) {
  const full = journey.pouch.held.length >= POUCH_CAPACITY;
  if (entry.kind === "take" && full) return "pouch-full";
  if (entry.kind === "release") {
    if (lockedItems.has(entry.choice.release)) return "locked";
    if (!full) return "pouch-not-full";
    if (!journey.pouch.held.includes(entry.choice.release)) return "not-held";
  }
  return affordable(entry.choice.effects, journey) ? null : "sta-low";
}

/**
 * Resolve an open choice on a mutable JourneyState draft: the pouch first, then the
 * choice's own effects.
 */
export function resolveOffer(draft, offer, entry, rules) {
  const result = entry.kind === "take" ? collectItem(draft.pouch, offer.item)
    : entry.kind === "release" ? replaceItem(draft.pouch, entry.choice.release, offer.item)
      : refuseItem(draft.pouch, offer.item);
  if (!result.ok) {
    throw new JourneyError(JOURNEY_ERROR_CODES.EFFECT_FAILED, `the offer cannot ${entry.kind}: ${result.error.code}`, { item: offer.item, reason: result.error.code });
  }
  draft.pouch = cloneData(result.value);
  applyEffects(draft, entry.choice.effects, rules);
}

/** Whether the offer at this node has been decided (the offered keepsake is in memory). */
export const offerDecided = (offer, journey) => journey.pouch.remembered.includes(offer.item);
