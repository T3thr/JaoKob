/**
 * JourneyState: everything the frog carries from node to node (ADR-P0-034 D3.1).
 *
 * Shape and ranges match `journeyState` in specs/schemas/v3.0.0/journey-save.schema.json.
 * The schema guards untrusted bytes at the data boundary; this module guards the domain
 * so core never runs on a state it did not expect (pouch relations, exact keys, ranges).
 *
 * Trace: ADR-P0-034 D3/D7, ADR-P0-020, TC-S5-STATE-001.
 */

import { POUCH_CAPACITY, createPouch, validatePouch } from "../keepsake-pouch.js";
import { JOURNEY_ERROR_CODES, ensure } from "./journey-errors.js";
import {
  BONDS, BOND_MAX, BOND_MIN, COUNTER_MAX, METERS, METER_MAX, METER_MIN, TEMPO_MAX, TEMPO_MIN,
} from "./journey-rules.js";
import { cloneData } from "./plain-data.js";

export const ACTS = Object.freeze([1, 2, 3, 4, 5]);
export const SKILLS = Object.freeze(["rain", "wind", "eye"]);
export const BRANCHES = Object.freeze(["A", "B"]);
export const SIBLINGS = Object.freeze(["kab", "kib"]);
export const COUNTERS = Object.freeze(["familySkillUses", "selfReliance", "homeStreak", "homesickCount", "tempo"]);
export const READY_MAX = 4;
export const FLAGS_MAX = 256;
export const POUCH_LIST_MAX = 32;
export const ID_MAX = 48;
export const ITEM_ID = /^item_[a-z0-9]+(?:_[a-z0-9]+)*$/;
export const IDENTIFIER = /^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)*$/;

const STATE_KEYS = Object.freeze(["act", "meters", "bonds", "counters", "route", "plan", "major", "pouch", "ready", "flags"]);
const POUCH_LISTS = Object.freeze(["held", "acquired", "released", "remembered", "memory"]);

/**
 * The state at New Game: the package's starting meters, no bonds, empty pouch.
 *
 * @param {{act:number, meters:{hp:number, mind:number, sta:number}}} start
 * @returns {object} A fresh, mutable JourneyState.
 */
export function createJourneyState(start) {
  const state = {
    act: start.act,
    meters: { hp: start.meters.hp, mind: start.meters.mind, sta: start.meters.sta },
    bonds: { pkam: 0, fiw: 0, teuk: 0 },
    counters: { familySkillUses: 0, selfReliance: 0, homeStreak: 0, homesickCount: 0, tempo: 0 },
    route: null,
    plan: null,
    major: null,
    pouch: cloneData({ ...createPouch() }),
    ready: [],
    flags: [],
  };
  assertJourneyState(state);
  return state;
}

/**
 * A new act begins (master plan §2.3): the act number moves on and the homesick streak
 * starts over after the act-end rest. Mutates the draft.
 *
 * @param {object} draft A JourneyState draft. @param {number} act
 */
export function beginAct(draft, act) {
  draft.act = act;
  draft.counters.homeStreak = 0;
}

const isPlainObject = (value) => value !== null && typeof value === "object" && !Array.isArray(value)
  && (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);
const isInt = (value, min, max) => Number.isSafeInteger(value) && value >= min && value <= max;
const sameKeys = (value, keys) => Object.keys(value).length === keys.length && keys.every((key) => Object.hasOwn(value, key));
const isId = (value, pattern) => typeof value === "string" && value.length <= ID_MAX && pattern.test(value);
const uniqueList = (value, max, check) => Array.isArray(value) && value.length <= max && new Set(value).size === value.length && value.every(check);

/**
 * Throw JOURNEY_STATE_INVALID unless `value` is a well-formed JourneyState.
 *
 * @param {unknown} value @param {string} [where] Path prefix for the error details.
 */
export function assertJourneyState(value, where = "journey") {
  const invalid = (path, rule) => ensure(false, JOURNEY_ERROR_CODES.STATE_INVALID, `${where}.${path} ${rule}`, { path: `${where}.${path}`, rule });
  if (!isPlainObject(value) || !sameKeys(value, STATE_KEYS)) invalid("", "must have exactly the JourneyState fields");
  if (!ACTS.includes(value.act)) invalid("act", "must be 1..5");
  if (!isPlainObject(value.meters) || !sameKeys(value.meters, METERS)) invalid("meters", "must be {hp, mind, sta}");
  for (const name of METERS) if (!isInt(value.meters[name], METER_MIN, METER_MAX)) invalid(`meters.${name}`, "must be an integer 0..5");
  if (!isPlainObject(value.bonds) || !sameKeys(value.bonds, BONDS)) invalid("bonds", "must be {pkam, fiw, teuk}");
  for (const name of BONDS) if (!isInt(value.bonds[name], BOND_MIN, BOND_MAX)) invalid(`bonds.${name}`, "must be an integer 0..4");
  if (!isPlainObject(value.counters) || !sameKeys(value.counters, COUNTERS)) invalid("counters", "must have the five counters");
  for (const name of COUNTERS) {
    const [min, max] = name === "tempo" ? [TEMPO_MIN, TEMPO_MAX] : [0, COUNTER_MAX];
    if (!isInt(value.counters[name], min, max)) invalid(`counters.${name}`, `must be an integer ${min}..${max}`);
  }
  if (value.route !== null && !BRANCHES.includes(value.route)) invalid("route", "must be null, A or B");
  if (value.plan !== null && !BRANCHES.includes(value.plan)) invalid("plan", "must be null, A or B");
  if (value.major !== null && !SKILLS.includes(value.major)) invalid("major", "must be null, rain, wind or eye");
  const pouch = value.pouch;
  if (!isPlainObject(pouch) || pouch.capacity !== POUCH_CAPACITY) invalid("pouch", "must be a four-slot pouch");
  for (const list of POUCH_LISTS) if (!Array.isArray(pouch[list]) || pouch[list].length > POUCH_LIST_MAX) invalid(`pouch.${list}`, `must be a list of at most ${POUCH_LIST_MAX}`);
  const checked = validatePouch(pouch);
  if (!checked.valid) invalid("pouch", `breaks ${checked.issue.reason}`);
  if (!uniqueList(value.ready, READY_MAX, (id) => isId(id, ITEM_ID))) invalid("ready", "must be at most four distinct item ids");
  if (!uniqueList(value.flags, FLAGS_MAX, (id) => isId(id, IDENTIFIER))) invalid("flags", "must be distinct identifiers");
}
