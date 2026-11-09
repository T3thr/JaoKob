// JaoKob · Light vs. Shadow Tactical Clash · evidence adapter over Core (ADR-P0-034 D5.2).
//
// Since checkpoint C2 the rules live in src/core/domain/clash/ and this file holds no rule of
// its own. It keeps the API the design proofs and the v3 mockup harness were written against
// (`enterClash(story, roundId)` · `listActions(cs)` · `step(cs, id)` with the short field names
// t, P, fsu, streak, bk, bf, bt and short keepsake names), translates to and from the Core
// kernel, and adds the analysis helpers the proofs need (terminals, enumerate, strategies).
// The parity gate proves this API still replays every action sequence of the original engine
// step for step (tools/clash/clash-parity.mjs · tests/unit/journey-clash.test.js).
//
// Rounds come from the mechanics source (docs/design-system/mechanics/story.json) and Thai
// names from the compiled package's lexicon, so words and assembly have one source each.

import { readFileSync } from 'node:fs';
import { clashContext, effectiveIntent, enterClash as enterCore, legalActions, resolveTurn } from '../../../src/core/domain/clash/clash-kernel.js';
import { ACTIONS as CORE_ACTIONS, ACTION_IDS, HOLD_AT as CORE_HOLD_AT, INTENTS as CORE_INTENTS, KEEPSAKES, LIGHT_MAX, USED_ITEM } from '../../../src/core/domain/clash/clash-rules.js';
import { BOND_MAX as CORE_BOND_MAX, GRACE_FLOOR as CORE_GRACE_FLOOR, METER_MAX as CORE_METER_MAX, softDecrease } from '../../../src/core/domain/journey/journey-rules.js';

export const METER_MAX = CORE_METER_MAX;
export const BOND_MAX = CORE_BOND_MAX;
export const P_WIN = LIGHT_MAX;
export const HOLD_AT = CORE_HOLD_AT;
export const GRACE_FLOOR = CORE_GRACE_FLOOR;
export const softDec = softDecrease;

const json = (path) => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));
const story = json('../mechanics/story.json');
const pkg = json('../../../src/data/content/journey/story-jaokob-core.json');
const textOf = new Map(pkg.texts.map((t) => [t.id, t.body]));

/** Thai names from the package lexicon. */
export const INTENTS = Object.fromEntries(CORE_INTENTS.map((id) => [id, { th: textOf.get(pkg.lexicon.intents[id]) }]));
export const ACTIONS = Object.fromEntries(ACTION_IDS.map((id) => [id, { ...CORE_ACTIONS[id], th: textOf.get(pkg.lexicon.actions[id]) }]));
export const ACTION_ORDER = ACTION_IDS;

/**
 * Round specs from the mechanics source in the evidence shape. The map is mutable on purpose:
 * the simulator adds a neutral test round for its homesick proof.
 */
export const ROUNDS = Object.fromEntries(story.rounds.map((r) => [r.id, {
  act: r.act, turns: r.turns, p0: r.p0, intents: [...r.intents], allies: [...r.allies], siblings: [...r.siblings], combos: [...r.combos],
  light: r.light, events: Object.fromEntries(r.events.map((e) => [e.turn, { p: e.light, id: e.id }])), territory: r.territory,
  finisher: r.finisherFrom !== undefined, finisherFrom: r.finisherFrom,
}]));

const SHORT = Object.fromEntries(Object.entries(KEEPSAKES).map(([short, id]) => [id, short]));
const fullItem = (name) => KEEPSAKES[name];
const fullUsed = (u) => (u.startsWith(USED_ITEM) ? USED_ITEM + fullItem(u.slice(USED_ITEM.length)) : u);
const shortUsed = (u) => (u.startsWith(USED_ITEM) ? USED_ITEM + SHORT[u.slice(USED_ITEM.length)] : u);
const CTX = Symbol('core clash context');

/** A Core round spec from an evidence round (looked up at call time). */
function coreRound(roundId) {
  const r = ROUNDS[roundId];
  return {
    id: roundId, act: r.act, turns: r.turns, p0: r.p0, intents: r.intents, allies: r.allies, siblings: r.siblings, combos: r.combos,
    light: r.light, events: Object.entries(r.events ?? {}).map(([turn, e]) => ({ turn: Number(turn), light: e.p, id: e.id })),
    territory: Boolean(r.territory), ...(r.finisher ? { finisherFrom: r.finisherFrom } : {}),
  };
}

/** The JourneyState fields a clash reads, from an evidence story state. */
export function journeyOf(s) {
  return {
    meters: { hp: s.hp, mind: s.mind, sta: s.sta },
    bonds: { pkam: s.bk, fiw: s.bf, teuk: s.bt },
    counters: { familySkillUses: s.fsu, homeStreak: s.streak, tempo: s.tempo || 0 },
    major: s.major,
    pouch: { held: s.items.map(fullItem) },
    ready: (s.ready || []).map(fullItem),
    flags: s.flags || [],
  };
}

const corePosition = (cs) => ({
  round: cs.round, turn: cs.t, light: cs.P, hp: cs.hp, mind: cs.mind, sta: cs.sta, pkam: cs.bk, fiw: cs.bf, teuk: cs.bt,
  familySkillUses: cs.fsu, homeStreak: cs.streak, used: cs.used.map(fullUsed), dim: cs.dim, charged: cs.charged, weak: cs.weak,
  regroup: cs.regroup, grace: cs.grace, gritUsed: cs.gritUsed, homesick: cs.homesick, lastAction: null, outcome: cs.outcome,
});

/** The evidence shape of a Core position, with the fixed facts of the clash beside it. */
function evidenceState(ctx, pos, fixed, log) {
  const cs = {
    round: pos.round, t: pos.turn, P: pos.light, hp: pos.hp, mind: pos.mind, sta: pos.sta, fsu: pos.familySkillUses, streak: pos.homeStreak,
    bk: pos.pkam, bf: pos.fiw, bt: pos.teuk, items: fixed.items, major: fixed.major, ready: fixed.ready, used: pos.used.map(shortUsed),
    dim: pos.dim, charged: pos.charged, weak: pos.weak, regroup: pos.regroup, grace: pos.grace, gritUsed: pos.gritUsed,
    homesick: pos.homesick, ended: pos.outcome !== null, outcome: pos.outcome, peace: fixed.peace, territory: fixed.territory, log,
  };
  if (fixed.noLog) cs.noLog = true;
  cs[CTX] = ctx;
  return cs;
}
const fixedOf = (cs) => ({ items: cs.items, major: cs.major, ready: cs.ready, peace: cs.peace, territory: cs.territory, noLog: cs.noLog });

/** Build a clash state from an evidence story state. */
export function enterClash(storyState, roundId) {
  const journey = journeyOf(storyState);
  const ctx = clashContext(coreRound(roundId), journey);
  const fixed = {
    items: [...storyState.items], major: storyState.major, ready: [...(storyState.ready || [])],
    peace: { kab: ctx.peace.kab, kib: ctx.peace.kib }, territory: { ...ctx.territory },
  };
  return evidenceState(ctx, enterCore(ctx, journey), fixed, []);
}

export const listActions = (cs) => legalActions(cs[CTX], corePosition(cs));

export function step(cs, actionId) {
  const ctx = cs[CTX];
  const next = resolveTurn(ctx, corePosition(cs), actionId);
  const log = cs.noLog ? cs.log : [...cs.log, `${effectiveIntent(ctx, cs.t)}:${actionId}`];
  return evidenceState(ctx, next, fixedOf(cs), log);
}

export const exitOf = (cs) => ({
  hp: cs.hp, mind: cs.mind, sta: cs.sta, fsu: cs.fsu, streak: cs.streak, bk: cs.bk, bf: cs.bf, bt: cs.bt,
  grace: cs.grace, outcome: cs.outcome, regroup: cs.regroup, homesick: cs.homesick,
});

// ---------------------------------------------------------------------------------------
// Analysis on Core positions (no translation per step).
// A home streak of two or more behaves exactly like two: a third family use in a row
// already pushes no light, so positions are merged on min(streak, 2).
// ---------------------------------------------------------------------------------------
const streakClass = (p) => Math.min(p.homeStreak, 2);
const posKey = (p) => [p.turn, p.light, p.hp, p.mind, p.sta, streakClass(p), p.familySkillUses, p.pkam, p.fiw, p.teuk,
  [...p.used].sort().join('.'), p.dim, p.charged, p.weak, p.regroup, p.grace, p.gritUsed, p.homesick].join(',');
const endKey = (p) => [p.hp, p.mind, p.sta, streakClass(p), p.familySkillUses, p.pkam, p.fiw, p.teuk, p.grace, p.gritUsed, p.outcome, p.homesick, p.regroup].join(',');
const posClass = (p) => [p.turn, [...p.used].sort().join('.'), p.dim, p.charged, p.weak, p.regroup, p.grace, p.gritUsed].join('|');
const posVec = (p) => [p.light, p.hp, p.mind, p.sta, p.pkam, p.fiw, p.teuk, p.familySkillUses, -streakClass(p), -Math.min(p.homesick, 3)];

// mode 'exact' keeps every position. 'best' keeps, per turn and per discrete situation, only
// positions no other position beats on every axis (proves what is reachable); 'worst' keeps
// only positions that beat no other (proves the floor).
function prune(map, mode) {
  if (mode === 'exact') return map;
  const groups = new Map();
  for (const p of map.values()) {
    const k = posClass(p);
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push({ p, v: posVec(p) });
  }
  const out = new Map();
  const ge = (a, b) => a.every((ai, i) => ai >= b[i]);
  for (const g of groups.values()) {
    g.sort((x, y) => { const sx = x.v.reduce((a, b) => a + b, 0); const sy = y.v.reduce((a, b) => a + b, 0); return mode === 'best' ? sy - sx : sx - sy; });
    const kept = [];
    for (const x of g) if (!kept.some((k) => (mode === 'best' ? ge(k.v, x.v) : ge(x.v, k.v)))) kept.push(x);
    for (const k of kept) out.set(posKey(k.p), k.p);
  }
  return out;
}

/** Every distinct terminal Core position reachable from an entry position. */
export function coreTerminals(ctx, entry, mode = 'exact') {
  let layer = new Map([[posKey(entry), entry]]);
  const ends = new Map();
  while (layer.size) {
    const next = new Map();
    for (const p of layer.values()) {
      for (const id of legalActions(ctx, p)) {
        const nx = resolveTurn(ctx, p, id);
        if (nx.outcome !== null) { const k = endKey(nx); if (!ends.has(k)) ends.set(k, nx); } else { const k = posKey(nx); if (!next.has(k)) next.set(k, nx); }
      }
    }
    layer = prune(next, mode);
  }
  return [...ends.values()];
}

/** Every terminal state reachable from an evidence entry state (evidence shape). */
export function terminals(entry, mode = 'exact') {
  const ctx = entry[CTX];
  return coreTerminals(ctx, corePosition(entry), mode).map((p) => evidenceState(ctx, p, { ...fixedOf(entry), noLog: true }, entry.log));
}

/** One terminal state per action sequence (for sequence statistics). */
export function enumerate(entry) {
  const ctx = entry[CTX];
  const fixed = { ...fixedOf(entry), noLog: true };
  const done = [];
  const stack = [corePosition(entry)];
  while (stack.length) {
    const p = stack.pop();
    for (const id of legalActions(ctx, p)) {
      const nx = resolveTurn(ctx, p, id);
      if (nx.outcome !== null) done.push(evidenceState(ctx, nx, fixed, entry.log)); else stack.push(nx);
    }
  }
  return done;
}

// Reference strategies used by the proofs.
//   mash:  strike when affordable, otherwise rest (never reads the intent)
//   smart: pick the action with the best one-turn value against the shown intent
export function playStrategy(entry, chooser) {
  let cs = entry;
  while (!cs.ended) cs = step(cs, chooser(cs));
  return cs;
}

export const mash = (cs) => (listActions(cs).includes('strike') ? 'strike' : 'rest');

export function smart(cs) {
  let best = null;
  let bestScore = -Infinity;
  for (const id of listActions(cs)) {
    const nx = step(cs, id);
    let score = nx.P * 3 + nx.hp + nx.mind + nx.sta * 0.5 - nx.homesick * 2;
    if (nx.ended) score += nx.outcome === 'decisive' ? 40 : nx.outcome === 'hold' ? 10 : -10;
    if (score > bestScore) { bestScore = score; best = id; }
  }
  return best;
}
