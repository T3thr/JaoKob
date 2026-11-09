/**
 * Clash shell: the validated API the journey session uses (ADR-P0-034 D2.1).
 *
 * Every function checks its inputs, rejects with a stable JourneyError code, never
 * mutates what it receives and returns deep-frozen values. The rules themselves live in
 * clash-kernel.js; this module only translates between the saved shapes (JourneyState and
 * the clash encounter of Save Format 2) and the kernel's position, and reports each turn.
 *
 * Merging the two states is explicit (ADR-P0-034 D3.3): each committed turn writes the
 * live meters, bonds and family counters back to the journey, and closeClash() is the
 * only way out of a finished clash (tempo returns to 0 and readied keepsakes are spent).
 *
 * Trace: ADR-P0-034 D2/D3/D7, TC-S5-CLASH-001.
 */

import { assertJourneyState, IDENTIFIER, ITEM_ID, SIBLINGS } from "../journey/journey-state.js";
import { BONDS, COUNTER_MAX } from "../journey/journey-rules.js";
import { JOURNEY_ERROR_CODES as CODES, ensure } from "../journey/journey-errors.js";
import { cloneData, deepFreeze } from "../journey/plain-data.js";
import {
  ACTIONS, COMBO_IDS, INTENTS, LIGHT_MAX, LIGHT_MIN, HOLD_AT, NO_INTENT, OUTCOMES, USED_ITEM, answersIntent,
} from "./clash-rules.js";
import { clashContext, effectiveIntent, enterClash, legalActions, resolveTurn } from "./clash-kernel.js";

const ROUND_KEYS = new Set(["id", "act", "turns", "p0", "intents", "allies", "siblings", "combos", "light", "events", "territory", "finisherFrom"]);
const ENCOUNTER_KEYS = Object.freeze(["kind", "round", "turn", "light", "used", "dim", "charged", "weak", "regroup", "grace", "gritUsed", "homesick", "lastAction", "outcome"]);
const ONCE_PER_CLASH = new Set(["a_pkam", "a_fiw", "a_teuk", "s_kab", "s_kib", "hem"]);
const HOMESICK_PER_CLASH_MAX = 8;

const isPlainObject = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const isInt = (value, min, max) => Number.isSafeInteger(value) && value >= min && value <= max;
const isSubset = (list, allowed, max) => Array.isArray(list) && list.length <= max && new Set(list).size === list.length && list.every((x) => allowed.includes(x));

/**
 * Throw CLASH_ROUND_INVALID unless `round` is a round spec the kernel can run. Besides the
 * schema shape this checks what JSON Schema cannot: one intent per turn, events and the
 * finisher inside the round, and every combo fought beside its companion.
 *
 * @param {unknown} round
 */
export function assertRound(round) {
  const bad = (rule) => ensure(false, CODES.CLASH_ROUND_INVALID, `round ${round?.id ?? "?"} ${rule}`, { round: round?.id ?? null, rule });
  if (!isPlainObject(round) || Object.keys(round).some((key) => !ROUND_KEYS.has(key))) bad("must be a round spec");
  if (typeof round.id !== "string" || !/^R[1-5][AB]?$/.test(round.id)) bad("needs an id like R1 or R4A");
  if (!isInt(round.act, 1, 5)) bad("needs an act 1..5");
  if (!isInt(round.turns, 3, 4)) bad("needs 3 or 4 turns");
  if (!isInt(round.p0, 1, 9)) bad("needs an opening light 1..9");
  if (!Array.isArray(round.intents) || round.intents.length !== round.turns || !round.intents.every((x) => INTENTS.includes(x))) bad("needs one known intent per turn");
  if (!isSubset(round.allies, BONDS, 3)) bad("allies must be distinct companions");
  if (!isSubset(round.siblings, SIBLINGS, 2)) bad("siblings must be kab and/or kib");
  if (!isSubset(round.combos, COMBO_IDS, 2)) bad("combos must be distinct combo actions");
  if (round.combos.some((id) => !round.allies.includes(ACTIONS[id].ally))) bad("every combo needs its companion among the allies");
  if (typeof round.light !== "boolean" || typeof round.territory !== "boolean") bad("light and territory must be booleans");
  if (!Array.isArray(round.events) || round.events.length > 2) bad("events must be a list of at most two");
  for (const event of round.events) {
    if (!isPlainObject(event) || Object.keys(event).length !== 3 || !isInt(event.turn, 1, round.turns) || !isInt(event.light, 1, 3)
      || typeof event.id !== "string" || !IDENTIFIER.test(event.id)) bad("has a malformed event");
  }
  if (new Set(round.events.map((event) => event.turn)).size !== round.events.length) bad("has two events on one turn");
  if (round.finisherFrom !== undefined && !isInt(round.finisherFrom, 1, round.turns)) bad("finisherFrom must be a turn of the round");
}

const usedEntryValid = (entry) => typeof entry === "string"
  && (ONCE_PER_CLASH.has(entry) || (entry.startsWith(USED_ITEM) && ITEM_ID.test(entry.slice(USED_ITEM.length))));

/**
 * Throw CLASH_STATE_INVALID unless `encounter` is a clash encounter of this round whose
 * fields agree with each other (an unfinished clash rests at light 1..9, a decisive one
 * at 10, a held one at 7..9 and a narrow one at 0..6).
 *
 * @param {object} round A valid round spec. @param {unknown} encounter
 */
export function assertClashEncounter(round, encounter) {
  const bad = (rule) => ensure(false, CODES.CLASH_STATE_INVALID, `clash encounter ${rule}`, { rule });
  if (!isPlainObject(encounter) || Object.keys(encounter).length !== ENCOUNTER_KEYS.length || !ENCOUNTER_KEYS.every((key) => Object.hasOwn(encounter, key))) bad("must have exactly the clash fields");
  if (encounter.kind !== "clash") bad("kind must be clash");
  if (encounter.round !== round.id) bad(`belongs to ${encounter.round}, not ${round.id}`);
  if (!isInt(encounter.turn, 1, round.turns)) bad("turn is outside the round");
  if (!isInt(encounter.light, LIGHT_MIN, LIGHT_MAX)) bad("light must be 0..10");
  if (!Array.isArray(encounter.used) || encounter.used.length > 24 || new Set(encounter.used).size !== encounter.used.length || !encounter.used.every(usedEntryValid)) bad("used is malformed");
  for (const key of ["dim", "charged", "weak", "regroup", "grace", "gritUsed"]) if (typeof encounter[key] !== "boolean") bad(`${key} must be a boolean`);
  if (!isInt(encounter.homesick, 0, HOMESICK_PER_CLASH_MAX)) bad("homesick must be 0..8");
  if (encounter.lastAction !== null && !Object.hasOwn(ACTIONS, encounter.lastAction)) bad("lastAction is unknown");
  if (encounter.outcome !== null && !OUTCOMES.includes(encounter.outcome)) bad("outcome is unknown");
  if ((encounter.lastAction === null) !== (encounter.turn === 1 && encounter.outcome === null)) bad("lastAction must be set after the first turn");
  const light = encounter.light;
  const restsWell = encounter.outcome === null ? light >= 1 && light <= 9
    : encounter.outcome === "decisive" ? light === LIGHT_MAX
      : encounter.outcome === "hold" ? light >= HOLD_AT && light < LIGHT_MAX : light < HOLD_AT;
  if (!restsWell) bad(`light ${light} does not fit outcome ${encounter.outcome}`);
}

/**
 * The kernel position of a saved clash (no validation; callers check first).
 *
 * @param {object} journey @param {object} encounter @returns {object}
 */
export function clashPosition(journey, encounter) {
  return {
    round: encounter.round,
    turn: encounter.turn,
    light: encounter.light,
    hp: journey.meters.hp,
    mind: journey.meters.mind,
    sta: journey.meters.sta,
    pkam: journey.bonds.pkam,
    fiw: journey.bonds.fiw,
    teuk: journey.bonds.teuk,
    familySkillUses: journey.counters.familySkillUses,
    homeStreak: journey.counters.homeStreak,
    used: encounter.used.slice(),
    dim: encounter.dim,
    charged: encounter.charged,
    weak: encounter.weak,
    regroup: encounter.regroup,
    grace: encounter.grace,
    gritUsed: encounter.gritUsed,
    homesick: encounter.homesick,
    lastAction: encounter.lastAction,
    outcome: encounter.outcome,
  };
}

/** The saved clash encounter of a kernel position. */
function encounterOf(cs) {
  return {
    kind: "clash",
    round: cs.round,
    turn: cs.turn,
    light: cs.light,
    used: cs.used.slice(),
    dim: cs.dim,
    charged: cs.charged,
    weak: cs.weak,
    regroup: cs.regroup,
    grace: cs.grace,
    gritUsed: cs.gritUsed,
    homesick: cs.homesick,
    lastAction: cs.lastAction,
    outcome: cs.outcome,
  };
}

/** Check a round, a journey and (when given) a clash encounter of that round. */
export function checkClashInputs(round, journey, encounter) {
  assertRound(round);
  assertJourneyState(journey);
  if (encounter !== undefined) assertClashEncounter(round, encounter);
}

/**
 * Open a clash for the journey as it stands at the clash node.
 *
 * @param {object} round Round spec from the package. @param {object} journey JourneyState.
 * @returns {Readonly<object>} The clash encounter at turn 1.
 */
export function openClash(round, journey) {
  checkClashInputs(round, journey);
  return deepFreeze(encounterOf(enterClash(clashContext(round, journey), journey)));
}

/**
 * The actions the frog can take now, in tray order. Empty once the clash has ended.
 *
 * @returns {readonly string[]}
 */
export function clashActions(round, journey, encounter) {
  checkClashInputs(round, journey, encounter);
  if (encounter.outcome !== null) return Object.freeze([]);
  return Object.freeze(legalActions(clashContext(round, journey), clashPosition(journey, encounter)));
}

/**
 * Commit one turn. Rejects an unknown action (CLASH_ACTION_UNKNOWN), a finished clash
 * (CLASH_ENDED) and an action that is not legal now (CLASH_ACTION_ILLEGAL).
 *
 * @param {object} round @param {object} journey @param {object} encounter @param {string} actionId
 * @returns {Readonly<{journey: object, encounter: object, report: object}>}
 */
export function playClashTurn(round, journey, encounter, actionId) {
  checkClashInputs(round, journey, encounter);
  ensure(typeof actionId === "string" && Object.hasOwn(ACTIONS, actionId), CODES.CLASH_ACTION_UNKNOWN, `unknown clash action ${String(actionId)}`, { action: String(actionId) });
  ensure(encounter.outcome === null, CODES.CLASH_ENDED, "the clash has already ended", { outcome: encounter.outcome });
  const ctx = clashContext(round, journey);
  const before = clashPosition(journey, encounter);
  const legal = legalActions(ctx, before);
  ensure(legal.includes(actionId), CODES.CLASH_ACTION_ILLEGAL, `${actionId} cannot be used now`, { action: actionId, legal });
  const after = resolveTurn(ctx, before, actionId);

  const next = cloneData(journey);
  next.meters = { hp: after.hp, mind: after.mind, sta: after.sta };
  next.bonds = { pkam: after.pkam, fiw: after.fiw, teuk: after.teuk };
  next.counters.familySkillUses = after.familySkillUses;
  next.counters.homeStreak = after.homeStreak;
  next.counters.homesickCount = Math.min(COUNTER_MAX, next.counters.homesickCount + after.homesick - before.homesick);

  const intent = round.intents[before.turn - 1];
  const effective = effectiveIntent(ctx, before.turn);
  const report = {
    turn: before.turn,
    action: actionId,
    intent,
    neutralized: effective === NO_INTENT,
    doubled: before.charged,
    answered: effective !== NO_INTENT && answersIntent(actionId, effective),
    light: { before: before.light, after: after.light },
    meters: { before: { ...journey.meters }, after: { ...next.meters } },
    homesick: after.homesick > before.homesick,
    regrouped: after.regroup && !before.regroup,
    grace: after.grace && !before.grace,
    event: ctx.events.get(before.turn) ?? 0,
    outcome: after.outcome,
  };
  return deepFreeze({ journey: next, encounter: encounterOf(after), report });
}

/**
 * Leave a finished clash (ADR-P0-034 D3.3): tempo from the obstacles is spent and the
 * keepsakes readied at camp lose their first-use bonus.
 *
 * @param {object} journey @param {object} encounter A finished clash encounter.
 * @returns {Readonly<object>} The journey after the clash.
 */
export function closeClash(journey, encounter) {
  assertJourneyState(journey);
  ensure(isPlainObject(encounter) && encounter.kind === "clash", CODES.CLASH_STATE_INVALID, "not a clash encounter", { rule: "kind must be clash" });
  ensure(encounter.outcome !== null, CODES.CLASH_NOT_ENDED, "the clash has not ended", { turn: encounter.turn });
  const next = cloneData(journey);
  next.counters.tempo = 0;
  next.ready = [];
  return deepFreeze(next);
}
