/**
 * Clash kernel: the rules of one Light vs. Shadow clash as pure functions on plain data.
 *
 * The kernel does not validate and does not freeze, so the design proofs can enumerate
 * every action sequence quickly (ADR-P0-034 D2.1). It never mutates its inputs: each
 * turn returns a new position. Runtime callers go through clash-engine.js, which checks
 * every input, rejects with stable error codes and deep-freezes what it returns.
 *
 * A position holds what changes turn by turn. The live meters, bonds and the two family
 * counters are the frog's own journey values while the clash runs; the rest is the
 * encounter state that Save Format 2 stores beside the journey (ADR-P0-034 D3/D7).
 *
 * Parity: every action sequence from the eighteen entry states of the clash simulator
 * gives the same state, step by step, as the proved evidence engine (TC-S5-CLASH-001).
 *
 * Trace: master plan §2.8, ADR-P0-033 D1, ADR-P0-034 D2–D5.
 */

import {
  ASSIST_BOND, BOND_MAX, FINAL_ACT, catchWithGrace, clampBond, clampMeter, leanOnFamily, payGrit, softDecrease, standOnOwn,
} from "../journey/journey-rules.js";
import {
  ACTIONS, ACTION_IDS, COMBO_MIN_BOND, GATHER_LAST_TURN_LOSS, GRACE_LIGHT_LOSS, GUARD_MIN_STA, HOLD_AT, LIGHT_MAX, LIGHT_MIN,
  NO_INTENT, OPENING_LIGHT_MAX, OPENING_LIGHT_MIN, REGROUP_LIGHT, RULE_FLAGS, STRAIN_PER_REPEAT, STRIKE_MIN_STA,
  TERRITORY_IN_HAND, USED_ITEM, territoryOf,
} from "./clash-rules.js";

/**
 * @typedef {object} ClashRound Round spec from the package (journey-package.schema.json#/$defs/round).
 * @property {string} id @property {number} act @property {number} turns @property {number} p0
 * @property {string[]} intents @property {string[]} allies @property {string[]} siblings
 * @property {string[]} combos @property {boolean} light
 * @property {{turn:number, light:number, id:string}[]} events @property {boolean} territory
 * @property {number} [finisherFrom]
 *
 * @typedef {object} ClashJourney The journey facts a clash reads (a JourneyState is one).
 * @property {{hp:number, mind:number, sta:number}} meters
 * @property {{pkam:number, fiw:number, teuk:number}} bonds
 * @property {{familySkillUses:number, homeStreak:number, tempo:number}} counters
 * @property {"rain"|"wind"|"eye"|null} major
 * @property {{held:string[]}} pouch @property {string[]} ready @property {string[]} flags
 *
 * @typedef {object} ClashContext Facts that stay fixed for the whole clash.
 * @property {ClashRound} round @property {number} act @property {string|null} major
 * @property {ReadonlySet<string>} held @property {ReadonlySet<string>} ready
 * @property {{dimOff:boolean, growHalf:boolean, gatherOff:boolean, whisperOff:boolean}} territory
 * @property {{kab:boolean, kib:boolean}} peace @property {boolean} intel
 * @property {ReadonlyMap<number, number>} events Light gained by story events, by turn.
 *
 * @typedef {object} ClashPosition
 * @property {string} round @property {number} turn @property {number} light
 * @property {number} hp @property {number} mind @property {number} sta
 * @property {number} pkam @property {number} fiw @property {number} teuk
 * @property {number} familySkillUses @property {number} homeStreak
 * @property {string[]} used Keepsakes (`item:<id>`) and once-per-clash helpers already used.
 * @property {boolean} dim @property {boolean} charged @property {boolean} weak
 * @property {boolean} regroup @property {boolean} grace @property {boolean} gritUsed
 * @property {number} homesick @property {string|null} lastAction
 * @property {"decisive"|"hold"|"narrow"|null} outcome
 */

/**
 * @param {ClashRound} round @param {ClashJourney} journey
 * @returns {ClashContext}
 */
export function clashContext(round, journey) {
  const held = new Set(journey.pouch.held);
  const flags = new Set(journey.flags);
  return {
    round,
    act: round.act,
    major: journey.major,
    held,
    ready: new Set(journey.ready),
    territory: territoryOf(round, held),
    peace: { kab: flags.has(RULE_FLAGS.kabPeace), kib: flags.has(RULE_FLAGS.kibPeace) },
    intel: flags.has(RULE_FLAGS.teukIntel),
    events: new Map(round.events.map((event) => [event.turn, event.light])),
  };
}

/**
 * Opening light: the round's p0, plus tempo from the obstacles before it, plus Act 5
 * territory (gear +1) and Teuk's intel (+1), kept inside 1..9.
 *
 * @param {ClashContext} ctx @param {number} tempo @returns {number}
 */
export function openingLight(ctx, tempo) {
  let light = ctx.round.p0 + tempo;
  if (ctx.round.territory) {
    if (ctx.territory.dimOff) light += 1;
    if (ctx.intel) light += 1;
  }
  return Math.max(OPENING_LIGHT_MIN, Math.min(OPENING_LIGHT_MAX, light));
}

/**
 * @param {ClashContext} ctx @param {ClashJourney} journey
 * @returns {ClashPosition}
 */
export function enterClash(ctx, journey) {
  return {
    round: ctx.round.id,
    turn: 1,
    light: openingLight(ctx, journey.counters.tempo),
    hp: journey.meters.hp,
    mind: journey.meters.mind,
    sta: journey.meters.sta,
    pkam: journey.bonds.pkam,
    fiw: journey.bonds.fiw,
    teuk: journey.bonds.teuk,
    familySkillUses: journey.counters.familySkillUses,
    homeStreak: journey.counters.homeStreak,
    used: [],
    dim: false,
    charged: false,
    weak: false,
    regroup: false,
    grace: false,
    gritUsed: false,
    homesick: 0,
    lastAction: null,
    outcome: null,
  };
}

/**
 * The intent of a turn after Act 5 territory: a neutralised dim, gather or whisper
 * becomes NO_INTENT. A halved grow stays grow (the halving happens when it resolves).
 *
 * @param {ClashContext} ctx @param {number} turn @returns {string}
 */
export function effectiveIntent(ctx, turn) {
  const intent = ctx.round.intents[turn - 1];
  const t = ctx.territory;
  if ((intent === "dim" && t.dimOff) || (intent === "gather" && t.gatherOff) || (intent === "whisper" && t.whisperOff)) return NO_INTENT;
  return intent;
}

/**
 * Every action the frog can take this turn, in tray order. Never empty: rest is always legal.
 *
 * @param {ClashContext} ctx @param {ClashPosition} cs @returns {string[]}
 */
export function legalActions(ctx, cs) {
  const r = ctx.round;
  const out = [];
  for (const id of ACTION_IDS) {
    const a = ACTIONS[id];
    // Normal costs never empty a meter; when strike is out of reach, grit takes its place.
    if (id === "strike" && cs.sta < STRIKE_MIN_STA) continue;
    if (id === "grit" && cs.sta >= STRIKE_MIN_STA) continue;
    if (id === "guard" && cs.sta < GUARD_MIN_STA) continue;
    switch (a.kind) {
      case "item":
        if (!ctx.held.has(a.item) || cs.used.includes(USED_ITEM + a.item)) continue;
        if (a.needsLight && !r.light) continue;
        if (r.territory && !TERRITORY_IN_HAND.includes(a.item)) continue;
        break;
      case "assist":
        if (!r.allies.includes(a.ally) || cs[a.ally] < ASSIST_BOND || cs.used.includes(id)) continue;
        break;
      case "sibling":
        if (!r.siblings.includes(a.sibling) || cs.used.includes(id)) continue;
        break;
      case "combo":
        if (!r.combos.includes(id) || !ctx.held.has(a.item) || cs.used.includes(USED_ITEM + a.item)) continue;
        if (!r.allies.includes(a.ally) || cs[a.ally] < (a.bondMin ?? COMBO_MIN_BOND)) continue;
        break;
      case "finisher":
        if (r.finisherFrom === undefined || cs.used.includes(id) || cs.turn < r.finisherFrom) continue;
        break;
      default:
        break;
    }
    out.push(id);
  }
  return out;
}

/**
 * Resolve one turn: pay, act, push light, then the shown intent resolves unless the
 * action answered it, then story events, Grace and the end checks. The caller must pass
 * a legal action for an unfinished position (the shell guarantees it).
 *
 * @param {ClashContext} ctx @param {ClashPosition} before @param {string} actionId
 * @returns {ClashPosition} A new position; `before` is not mutated.
 */
export function resolveTurn(ctx, before, actionId) {
  const cs = { ...before, used: before.used.slice() };
  const r = ctx.round;
  const a = ACTIONS[actionId];
  const intent = effectiveIntent(ctx, cs.turn);
  const last = cs.turn === r.turns;

  // Costs and restores.
  if (a.cost !== undefined) cs.sta = clampMeter(cs.sta - a.cost.sta);
  if (a.grit === true) {
    payGrit(cs);
    cs.gritUsed = true;
  }
  if (a.restore !== undefined) {
    if (a.restore.sta !== undefined) cs.sta = clampMeter(cs.sta + a.restore.sta);
    if (a.restore.mind !== undefined) cs.mind = clampMeter(cs.mind + a.restore.mind);
  }

  // Leaning on home: a repeated family skill still answers the intent but pushes less.
  let strain = 0;
  if (a.kind === "family" || a.kind === "sibling") {
    const repeats = leanOnFamily(cs, cs, ctx.act);
    if (repeats > 0) {
      cs.homesick += 1;
      strain = STRAIN_PER_REPEAT * repeats;
    }
  } else {
    standOnOwn(cs);
  }

  if (a.kind === "combo") cs[a.ally] = clampBond(cs[a.ally] + 1);
  if (a.item !== undefined) cs.used.push(USED_ITEM + a.item);
  if (a.kind === "assist" || a.kind === "sibling" || a.kind === "finisher") cs.used.push(actionId);

  // Light pushed by the action.
  const revealed = a.reveals === true || (a.cancels !== undefined && a.cancels.includes("illusion"));
  let gain = a.gain;
  if (a.kind === "family" && a.skill === ctx.major) gain += 1;
  if (a.kind === "item" && ctx.ready.has(a.item)) gain += 1;
  if (a.kind === "assist" && cs[a.ally] >= BOND_MAX) gain += 1;
  if (a.kind === "sibling" && ctx.peace[a.sibling]) gain += 1;
  if (a.kind === "finisher" && cs.light >= a.capeAt) gain += a.capeBonus;
  if (intent === "illusion" && revealed && a.revealBonus !== undefined) gain += a.revealBonus;
  if (intent === "illusion" && a.aimed === true && !revealed) gain = 0;
  if (cs.weak && gain > 0 && a.kind !== "base") {
    gain += 1;
    cs.weak = false;
  }
  if (strain > 0) gain = Math.max(0, gain - strain);
  if (cs.dim && gain > 0) gain -= 1;
  cs.dim = false;
  if (a.weakPoint === true) cs.weak = true;
  cs.light += gain;

  // The intent resolves unless the action answered it.
  const mult = cs.charged ? 2 : 1;
  cs.charged = false;
  const cancels = (x) => a.cancels !== undefined && a.cancels.includes(x);
  const negates = (x) => a.negates !== undefined && a.negates.includes(x);
  switch (intent) {
    case "grow":
      if (!cancels("grow")) {
        const halved = (a.halves !== undefined && a.halves.includes("grow")) || ctx.territory.growHalf;
        cs.light -= (halved ? 1 : 2) * mult;
      }
      break;
    case "lash":
      if (!negates("lash")) {
        cs.hp = softDecrease(cs.hp, mult);
        cs.light -= mult;
      }
      break;
    case "taunt":
    case "whisper":
      if (!negates(intent)) {
        cs.mind = softDecrease(cs.mind, mult);
        cs.light -= mult;
      }
      break;
    case "dim":
      if (!cancels("dim")) cs.dim = true;
      break;
    case "illusion":
      if (!revealed) cs.light -= mult;
      break;
    case "gather":
      if (!cancels("gather")) {
        if (last) cs.light -= GATHER_LAST_TURN_LOSS;
        else cs.charged = true;
      }
      break;
    default:
      break;
  }

  // A story event on this turn (the siblings' rope in Act 2).
  const event = ctx.events.get(cs.turn);
  if (event !== undefined) cs.light += event;

  // Grace: only grit can empty a meter. Someone catches the frog, and the shadow gains
  // while he is down, so falling is never a shortcut.
  if (catchWithGrace(cs)) {
    cs.light -= GRACE_LIGHT_LOSS;
    cs.grace = true;
  }

  cs.lastAction = actionId;
  if (cs.light >= LIGHT_MAX) {
    cs.light = LIGHT_MAX;
    return finish(ctx, cs, "decisive");
  }
  if (cs.light <= LIGHT_MIN) {
    if (!cs.regroup) {
      cs.regroup = true;
      cs.light = REGROUP_LIGHT;
      cs.mind = softDecrease(cs.mind, 1);
    } else {
      cs.light = LIGHT_MIN;
      return finish(ctx, cs, "narrow");
    }
  }
  if (last) return finish(ctx, cs, cs.light >= HOLD_AT ? "hold" : "narrow");
  cs.turn += 1;
  return cs;
}

/** Decisive: ใจ +1 · narrow: กาย −1 (Act 5: แรง −1) · hold: nothing. */
function finish(ctx, cs, outcome) {
  cs.outcome = outcome;
  if (outcome === "decisive") cs.mind = clampMeter(cs.mind + 1);
  if (outcome === "narrow") {
    if (ctx.act === FINAL_ACT) cs.sta = softDecrease(cs.sta, 1);
    else cs.hp = softDecrease(cs.hp, 1);
  }
  return cs;
}
