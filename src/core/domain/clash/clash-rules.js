/**
 * Light vs. Shadow clash: what every intent and action means (ADR-P0-034 D4.1).
 *
 * Ported from the proved evidence engine of ADR-P0-033 D1 with Thai labels replaced by
 * keys and keepsakes named by their full item IDs (ADR-P0-034 D5.1). The package owns
 * how a round is assembled (turns, opening light, intent order, who fights, combos,
 * events, territory, finisher); this module owns what those words do. The Thai names
 * come from the package lexicon and the scene labels of each blueprint.
 *
 * Trace: master plan §2.3 · §2.5–§2.8, ADR-P0-033 D1–D3, TC-S5-CLASH-001.
 */

export const LIGHT_MIN = 0;
/** Reaching this ends the round as a decisive win. */
export const LIGHT_MAX = 10;
/** A round that runs to its last turn holds at this light or more, otherwise it is narrow. */
export const HOLD_AT = 7;
/** The opening light is kept inside 1..9 so no round is decided before the first turn. */
export const OPENING_LIGHT_MIN = 1;
export const OPENING_LIGHT_MAX = 9;
/** The first time the light falls to 0 the frog regroups at this light (ใจ −1). */
export const REGROUP_LIGHT = 3;
/** The shadow gains while the frog is caught by Grace. */
export const GRACE_LIGHT_LOSS = 2;
/** A repeated family skill pushes this much less light per repeat. */
export const STRAIN_PER_REPEAT = 2;
/** Swallow-the-room: an unanswered gather on the last turn. */
export const GATHER_LAST_TURN_LOSS = 3;
/** Normal costs never empty a meter: strike needs this much stamina, guard one less. */
export const STRIKE_MIN_STA = 3;
export const GUARD_MIN_STA = 2;
/** Combos need this bond unless the action says otherwise. */
export const COMBO_MIN_BOND = 1;

export const OUTCOMES = Object.freeze(["decisive", "hold", "narrow"]);
export const INTENTS = Object.freeze(["grow", "lash", "taunt", "whisper", "dim", "illusion", "gather"]);
/** An intent that Act 5 territory switched off for the whole clash. */
export const NO_INTENT = "none";

/** The six keepsakes whose meaning the clash knows. */
export const KEEPSAKES = Object.freeze({
  seeds: "item_kib_glowing_seeds",
  guard: "item_kab_bark_guard",
  gear: "item_pkam_tin_gear",
  button: "item_teuk_peuak_button",
  whistle: "item_teuk_whistle_charm",
  ribbon: "item_fiw_sun_ribbon",
});

/** Story flags with a clash meaning. */
export const RULE_FLAGS = Object.freeze({
  /** Teuk shared the secrets of เปี๊ยก's room (bond ≥ 3 after camp C3): Act 5 opens one light higher. */
  teukIntel: "teuk_intel",
  /** An open talk at camp C4 makes that sibling's help push one more light. */
  kabPeace: "kab_peace",
  kibPeace: "kib_peace",
});

/** Prefix of the once-per-clash record of a keepsake that was used. */
export const USED_ITEM = "item:";

const action = (spec) => Object.freeze(Object.fromEntries(Object.entries(spec).map(([key, value]) => [
  key,
  Array.isArray(value) ? Object.freeze(value) : value && typeof value === "object" ? Object.freeze({ ...value }) : value,
])));

/**
 * kind: base | family | item | assist | sibling | combo | finisher
 *   gain        light pushed before the intent resolves
 *   cost        stamina paid; restore: meters gained
 *   aimed       wasted by an illusion that was not revealed
 *   cancels     intents that do not happen this turn
 *   negates     intents whose harm the frog avoids this turn
 *   halves      grow takes one light instead of two
 *   reveals     answers an illusion; revealBonus is extra light when it does
 *   weakPoint   the next non-base action that pushes light pushes one more
 *   preview     shows the next two intents (view model only)
 *   needsLight  only in rounds with a light source
 */
export const ACTIONS = Object.freeze({
  strike: action({ kind: "base", cost: { sta: 2 }, gain: 2, aimed: true, cancels: ["grow", "gather"] }),
  grit: action({ kind: "base", gain: 2, aimed: true, cancels: ["grow", "gather"], grit: true }),
  guard: action({ kind: "base", cost: { sta: 1 }, gain: 0, negates: ["lash", "taunt", "whisper"], halves: ["grow"] }),
  rest: action({ kind: "base", gain: 0, restore: { sta: 2 } }),

  rain: action({ kind: "family", skill: "rain", gain: 1, negates: ["taunt", "whisper"], reveals: true, revealBonus: 1, preview: true }),
  wind: action({ kind: "family", skill: "wind", gain: 2, aimed: true, negates: ["lash"], cancels: ["grow", "gather"] }),
  eye: action({ kind: "family", skill: "eye", gain: 1, reveals: true, revealBonus: 1, cancels: ["gather"], weakPoint: true }),

  seeds: action({ kind: "item", item: KEEPSAKES.seeds, gain: 2, reveals: true, cancels: ["grow", "gather", "illusion"] }),
  guardItem: action({ kind: "item", item: KEEPSAKES.guard, gain: 1, negates: ["lash"] }),
  gear: action({ kind: "item", item: KEEPSAKES.gear, gain: 2, cancels: ["dim"], restore: { mind: 1 } }),
  button: action({ kind: "item", item: KEEPSAKES.button, gain: 2, cancels: ["dim"], needsLight: true }),
  ribbon: action({ kind: "item", item: KEEPSAKES.ribbon, gain: 1, restore: { mind: 1, sta: 1 } }),

  a_pkam: action({ kind: "assist", ally: "pkam", gain: 1, negates: ["lash", "taunt", "whisper"], halves: ["grow"] }),
  a_fiw: action({ kind: "assist", ally: "fiw", gain: 2, restore: { sta: 1 } }),
  a_teuk: action({ kind: "assist", ally: "teuk", gain: 3, cancels: ["dim"] }),

  s_kab: action({ kind: "sibling", sibling: "kab", gain: 2, negates: ["lash"] }),
  s_kib: action({ kind: "sibling", sibling: "kib", gain: 2, reveals: true, cancels: ["grow", "gather", "illusion"] }),

  gear_pkam: action({ kind: "combo", item: KEEPSAKES.gear, ally: "pkam", gain: 3, cancels: ["grow", "gather"] }),
  seeds_fiw: action({ kind: "combo", item: KEEPSAKES.seeds, ally: "fiw", gain: 3, reveals: true, cancels: ["grow", "gather", "illusion"] }),
  button_teuk: action({ kind: "combo", item: KEEPSAKES.button, ally: "teuk", gain: 3, reveals: true, cancels: ["dim", "illusion"] }),
  whistle_teuk: action({ kind: "combo", item: KEEPSAKES.whistle, ally: "teuk", bondMin: 0, gain: 3, cancels: ["grow", "dim"] }),
  ribbon_fiw: action({ kind: "combo", item: KEEPSAKES.ribbon, ally: "fiw", gain: 3, negates: ["lash"], restore: { mind: 1, sta: 1 } }),
  gear_pkam_b: action({ kind: "combo", item: KEEPSAKES.gear, ally: "pkam", gain: 3, negates: ["lash"], cancels: ["grow"] }),

  hem: action({ kind: "finisher", gain: 3, capeAt: 6, capeBonus: 1 }),
});

/** The order players see in the tray; also the deterministic enumeration order. */
export const ACTION_IDS = Object.freeze([
  "strike", "grit", "guard", "rest", "rain", "wind", "eye",
  "seeds", "guardItem", "gear", "button", "ribbon",
  "a_pkam", "a_fiw", "a_teuk", "s_kab", "s_kib",
  "gear_pkam", "seeds_fiw", "button_teuk", "whistle_teuk", "ribbon_fiw", "gear_pkam_b", "hem",
]);

export const COMBO_IDS = Object.freeze(ACTION_IDS.filter((id) => ACTIONS[id].kind === "combo"));

/**
 * In a territory round (Act 5) the keepsakes are placed around the room instead of held;
 * only the ribbon stays in hand. The button is sewn back at A5-03, so it never acts here.
 */
export const TERRITORY_IN_HAND = Object.freeze([KEEPSAKES.ribbon]);

export const NO_TERRITORY = Object.freeze({ dimOff: false, growHalf: false, gatherOff: false, whisperOff: false });

/**
 * Act 5 territory: which placed keepsake neutralises which intent for the whole clash
 * (gear: dim · seeds: grow halves · guard: gather · whistle or ribbon: whisper).
 *
 * @param {{territory:boolean}} round @param {ReadonlySet<string>} held
 */
export function territoryOf(round, held) {
  if (!round.territory) return NO_TERRITORY;
  return Object.freeze({
    dimOff: held.has(KEEPSAKES.gear),
    growHalf: held.has(KEEPSAKES.seeds),
    gatherOff: held.has(KEEPSAKES.guard),
    whisperOff: held.has(KEEPSAKES.whistle) || held.has(KEEPSAKES.ribbon),
  });
}

/** @returns {boolean} Whether the action answers the intent (the tray's "แก้ทาง" tag). */
export function answersIntent(actionId, intent) {
  const a = ACTIONS[actionId];
  if (intent === "illusion" && a.reveals === true) return true;
  return [a.cancels, a.negates, a.halves].some((list) => list !== undefined && list.includes(intent));
}

/** Family skills and siblings' help are the "lean on home" actions. */
export const isFamilyAction = (actionId) => ACTIONS[actionId].kind === "family" || ACTIONS[actionId].kind === "sibling";

/**
 * The four tray groups of UX §3.3 and their capacity. Every group fits a 2×3 grid without
 * paging; the basic row (strike or grit, guard, rest, finisher) is always on screen.
 */
export const TRAY_GROUPS = Object.freeze(["basic", "family", "friends", "pouch"]);
export const TRAY_CAPACITY = Object.freeze({ basic: 4, family: 5, friends: 3, pouch: 6 });
const GROUP_OF_KIND = Object.freeze({ base: "basic", finisher: "basic", family: "family", sibling: "family", assist: "friends", item: "pouch", combo: "pouch" });
/** @returns {"basic"|"family"|"friends"|"pouch"} */
export const trayGroupOf = (actionId) => GROUP_OF_KIND[ACTIONS[actionId].kind];
