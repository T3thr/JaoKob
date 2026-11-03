// JaoKob · five-act balance model (design evidence for ADR-P0-032 v2.0 D5 and ADR-P0-033 D2/D5).
// Usage:  node docs/design-system/evidence/five-act-balance-model.mjs [--examples] [--nodes]
//
// Enumerates every choice that changes the game state across Acts 1–5: story choices, the
// Four Keys at every obstacle, every Shelter Camp allocation, both pouch decisions, both
// Act 2 routes, both Act 4 plans, and every reachable outcome of the five Light vs. Shadow
// clashes (each clash explored move by move on the Core kernel). Identical states are merged
// after each node. At A5-11 it evaluates the three endings and checks the fairness
// invariants listed at the bottom. Exit code 1 if any invariant fails.
//
// Since checkpoint C2 every rule comes from Core (ADR-P0-034 D5): meters, grit and Grace,
// homesick, the Four Keys, camps, pouch offers, clashes and endings. Act 1 is read from the
// compiled package exactly as the journey session plays it. Acts 2–5 stay as tables in this
// file, in the package's own vocabulary, until their mechanics specs are compiled (S2–S3);
// the few conditional effects the 3.0.0 vocabulary cannot express yet are marked "S2".

import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { ACTIONS, KEEPSAKES } from '../../../src/core/domain/clash/clash-rules.js';
import { clashContext, enterClash } from '../../../src/core/domain/clash/clash-kernel.js';
import { clashActions, closeClash, openClash, playClashTurn } from '../../../src/core/domain/clash/clash-engine.js';
import { activityBlock, openCamp, pickActivity, readyCandidates } from '../../../src/core/domain/encounters/camp.js';
import { obstacleBlock, resolveObstacle } from '../../../src/core/domain/encounters/obstacle.js';
import { offerBlock, offerChoices, resolveOffer } from '../../../src/core/domain/encounters/pouch-offer.js';
import { allows, holds } from '../../../src/core/domain/journey/conditions.js';
import { affordable, applyEffects } from '../../../src/core/domain/journey/effects.js';
import { evaluateEndings } from '../../../src/core/domain/journey/endings.js';
import { clampTempo } from '../../../src/core/domain/journey/journey-rules.js';
import { beginAct, createJourneyState } from '../../../src/core/domain/journey/journey-state.js';
import { coreTerminals } from './tactical-clash-engine.mjs';

const json = (path) => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));
const PACKAGE = json('../../../src/data/content/journey/story-jaokob-core.json');
const ROUND_SPECS = new Map(json('../mechanics/story.json').rounds.map((r) => [r.id, r]));
const RULES = { lockedItems: new Set(PACKAGE.items.filter((i) => i.locked).map((i) => i.id)) };

// The model keeps, after every node, only the states that no other state of the same class
// beats on every axis. Every kept state is genuinely reachable, so each "reachable" claim
// comes with a witness path. Safety claims that hold by construction (rest floors, the
// fallback ending, the full pouch) are checked structurally and by the probes below.
export const MODE = 'best';

export const ITEM_ID = { ...KEEPSAKES };
const K = KEEPSAKES;
const SHORT = Object.fromEntries(Object.entries(K).map(([short, id]) => [id, short]));
export const ITEM_SIDE = Object.fromEntries(PACKAGE.items.map((i) => [SHORT[i.id], i.side]));

// --------------------------------------------------------------------------------------
// State: a Core JourneyState plus the proof's own bookkeeping.
// --------------------------------------------------------------------------------------
const clone = (s) => ({ ...s, j: structuredClone(s.j) });
// The witness path is a shared linked list, so millions of intermediate states do not each
// carry a copy of their history; it is spelled out only for --examples.
const extend = (s, step) => ({ prev: s.trail, step });
const pathOf = (s) => { const steps = []; for (let t = s.trail; t; t = t.prev) steps.push(t.step); return steps.reverse().join(' '); };
const held = (s, id) => s.j.pouch.held.includes(id);
const flagged = (s, f) => s.j.flags.includes(f);

function start() {
  const j = createJourneyState({ act: 1, meters: PACKAGE.start.meters });
  return { j, grit: false, grace: false, graceNoGrit: false, regroups: 0, trail: null };
}

// Who stands where in the story. The runtime takes a combo or friend option in the package as
// the author's word that the companion is there; this proof checks that word on every state.
function present(s, ally) {
  if (ally === 'pkam') return flagged(s, 'met_pkam');
  if (ally === 'fiw') return flagged(s, 'met_fiw');
  if (ally === 'teuk') return flagged(s, 'met_teuk') && s.j.act === 3;
  return false;
}

// --------------------------------------------------------------------------------------
// Effects in the package vocabulary.
// --------------------------------------------------------------------------------------
const bond = (b, amount) => ({ op: 'bond.add', bond: b, amount });
const flag = (f) => ({ op: 'flag.set', flag: f });
const add = (meter, amount) => ({ op: 'meter.add', meter, amount });
const hazard = (meter, amount) => ({ op: 'meter.hazard', meter, amount });
const spend = (meter, amount) => ({ op: 'meter.spend', meter, amount });
const grant = (item) => ({ op: 'item.grant', item });
const release = (item) => ({ op: 'item.release', item });
const rest = (hp, mind, sta) => ({ op: 'floor.rest', meters: { hp, mind, sta } });

// --------------------------------------------------------------------------------------
// Node constructors. Each node returns the options visible in state s, as
// { key, kind, apply(x) } where x is a clone of s. Clash nodes expand instead.
// --------------------------------------------------------------------------------------
/** A story beat with effects in the package vocabulary, and S2 conditional effects. */
const story = (id, effects = [], conditional = []) => ({
  id, type: 'story',
  options: () => [{ key: '·', kind: 'story', apply: (x) => {
    applyEffects(x.j, effects, RULES);
    for (const c of conditional) if (holds(c.when, x.j)) (c.effects ? applyEffects(x.j, c.effects, RULES) : c.apply(x.j));
  } }],
});
const ma = (id) => ({ id, type: 'micro', options: () => [{ key: 'tap', kind: 'micro', apply: () => {} }] });

/** The state after a node's own effects, which apply before its options (as in the session). */
const settled = (s, nodeEffects) => {
  if (!nodeEffects.length) return s;
  const x = clone(s);
  applyEffects(x.j, nodeEffects, RULES);
  return x;
};

/** A choice: options {key, when?, effects, extra?(j)}; node effects apply first (rest floors). */
const choice = (id, options, nodeEffects = []) => ({
  id, type: 'choice',
  options: (s) => {
    const t = settled(s, nodeEffects);
    return options.filter((o) => allows(o.when, t.j) && affordable(o.effects, t.j)).map((o) => ({
      key: o.key, kind: 'choice', effects: o.effects,
      apply: (x) => { applyEffects(x.j, nodeEffects, RULES); applyEffects(x.j, o.effects, RULES); o.extra?.(x.j); },
    }));
  },
});

/** An obstacle: package options {key, method, effects}; node effects apply first. */
const obstacle = (id, options, nodeEffects = []) => ({
  id, type: 'obstacle',
  options: (s) => {
    const t = settled(s, nodeEffects);
    for (const o of options) {
      if ((o.method.kind === 'combo' || o.method.kind === 'friend') && obstacleBlock(o, t.j) === null && !present(t, o.method.ally)) {
        ANOMALIES.push(`ally not present at ${id}: ${o.key}`);
      }
    }
    return options.filter((o) => obstacleBlock(o, t.j) === null).map((o) => ({
      key: o.key, kind: o.method.kind,
      apply: (x) => {
        applyEffects(x.j, nodeEffects, RULES);
        if (o.method.kind === 'grit') x.grit = true;
        if (resolveObstacle(x.j, o, RULES).grace) x.grace = true;
      },
    }));
  },
});

/**
 * Old obstacle notation → package options, in the order the runtime shows them:
 * skills · siblings · item · combo · friend · alone · rush · wait · grit.
 */
function keys(spec) {
  const out = [];
  for (const skill of spec.skills ?? []) out.push({ key: skill, method: { kind: 'skill', skill }, effects: spec.onSkill ?? [] });
  for (const sibling of spec.siblings ?? []) out.push({ key: sibling, method: { kind: 'sibling', sibling }, effects: [] });
  if (spec.item) out.push({ key: 'item', method: { kind: 'item', item: spec.item }, effects: [] });
  if (spec.combo) out.push({ key: 'combo', method: { kind: 'combo', item: spec.combo.item, ally: spec.combo.ally }, effects: spec.combo.effects });
  if (spec.friend) out.push({ key: 'friend', method: { kind: 'friend', ally: spec.friend.ally, minBond: spec.friend.min ?? 0 }, effects: spec.friend.effects ?? [] });
  if (spec.alone) out.push({ key: 'alone', method: { kind: 'alone', sta: spec.alone.sta, needSta: spec.alone.needSta ?? spec.alone.sta + 1 }, effects: spec.alone.effects ?? [] });
  if (spec.rush) out.push({ key: 'rush', method: { kind: 'rush' }, effects: [] });
  if (spec.wait) out.push({ key: 'wait', method: { kind: 'wait' }, effects: [] });
  out.push({ key: 'grit', method: { kind: 'grit' }, effects: spec.grit ?? [] });
  return out;
}

/**
 * A Shelter Camp: pick exactly `drops` distinct activities (fewer if fewer are open), at most
 * one per exclusive group, readying one keepsake at most. Openness is judged on arrival; the
 * activities commute and the runtime can always take the ones that need a keepsake first, so
 * this enumerates exactly the outcomes the runtime can reach.
 */
const camp = (id, drops, activities) => ({
  id, type: 'camp',
  options: (s) => {
    const node = { camp: 'C', drops, activities };
    const arrival = openCamp(node);
    const open = [];
    for (const a of activities) {
      if (a.ready === true) {
        // Keepsakes in their canonical order, so the enumeration does not depend on slots.
        const candidates = readyCandidates(s.j);
        if (activityBlock(a, node, s.j, arrival) === null) for (const item of Object.values(K).filter((id) => candidates.includes(id))) open.push({ a, item, key: `ready_${SHORT[item]}`, group: '·ready' });
      } else if (activityBlock(a, node, s.j, arrival) === null) open.push({ a, key: a.key, group: a.group });
    }
    const k = Math.min(drops, open.length);
    const out = [];
    const rec = (from, chosen) => {
      if (chosen.length === k) {
        const groups = chosen.map((c) => c.group).filter(Boolean);
        if (new Set(groups).size !== groups.length) return;
        out.push({
          key: 'camp:' + chosen.map((c) => c.key).join('+'), kind: 'camp',
          apply: (x) => { let enc = openCamp(node); for (const c of chosen) enc = pickActivity(x.j, c.a, enc, RULES, c.item); },
        });
        return;
      }
      for (let i = from; i < open.length; i++) rec(i + 1, [...chosen, open[i]]);
    };
    rec(0, []);
    return out;
  },
});

/** A pouch offer (ADR-P0-020): take, take by handing one on, or refuse. */
const pouch = (id, offer) => ({
  id, type: 'pouch',
  options: (s) => offerChoices(offer).filter((e) => offerBlock(e, s.j, RULES.lockedItems) === null)
    .map((e) => ({ key: e.choice.key, kind: 'pouch', apply: (x) => resolveOffer(x.j, offer, e, RULES) })),
});
const offer = (item, takeEffects, releases) => ({
  item,
  take: { key: 'take', label: 'take', effects: takeEffects, responses: [] },
  releases: Object.entries(releases).map(([short, effects]) => ({ key: `release-${short}`, release: K[short], label: short, effects: [flag(`released_${short}`), ...effects, ...takeEffects], responses: [] })),
  refuse: { key: 'refuse', label: 'refuse', effects: [], responses: [] },
});

// Clash node: expands into the frontier of distinct exits reachable from this entry state.
const clashMemo = new Map();
const exitVec = (e) => [e.hp, e.mind, e.sta, e.pkam, e.fiw, e.teuk, Math.min(e.familySkillUses, 3), -Math.min(e.homeStreak, 2), -Math.min(e.homesick, 3)];
function frontier(list, vecOf, classOf) {
  const byClass = new Map();
  for (const x of list) {
    const k = classOf(x);
    if (!byClass.has(k)) byClass.set(k, []);
    byClass.get(k).push(x);
  }
  const out = [];
  for (const group of byClass.values()) {
    const uniq = new Map();
    for (const x of group) { const v = vecOf(x); const k = v.join(','); if (!uniq.has(k)) uniq.set(k, { x, v, sum: v.reduce((a, b) => a + b, 0) }); }
    const arr = [...uniq.values()];
    arr.sort((a, b) => (MODE === 'best' ? b.sum - a.sum : a.sum - b.sum));
    const kept = [];
    for (const c of arr) {
      const ge = (a, b) => a.every((ai, i) => ai >= b[i]);
      const drop = kept.some((k) => (MODE === 'best' ? ge(k.v, c.v) : ge(c.v, k.v)));
      if (!drop) kept.push(c);
    }
    out.push(...kept.map((k) => k.x));
  }
  return out;
}
export const CLASH_STATS = {};
const CLASH_FLAGS = ['teuk_intel', 'kab_peace', 'kib_peace'];
function clashNode(id, roundOf) {
  return {
    id, type: 'clash',
    expand: (s) => {
      const rid = typeof roundOf === 'function' ? roundOf(s) : roundOf;
      const j = s.j;
      // A home streak of two or more behaves exactly like two (a third family use in a row
      // pushes no light), and the family-skill count never changes a clash, so both are folded
      // out of the memo key and the count is carried as a difference.
      const key = rid + '|' + JSON.stringify([j.meters, Math.min(j.counters.homeStreak, 2), j.bonds, [...j.pouch.held].sort(), j.major, j.counters.tempo, [...j.ready].sort(), CLASH_FLAGS.filter((f) => j.flags.includes(f))]);
      let exits = clashMemo.get(key);
      if (!exits) {
        const entry = structuredClone(j);
        entry.counters.familySkillUses = 0;
        entry.counters.homeStreak = Math.min(j.counters.homeStreak, 2);
        const ctx = clashContext(ROUND_SPECS.get(rid), entry);
        const all = coreTerminals(ctx, enterClash(ctx, entry), MODE);
        const st = (CLASH_STATS[rid] ||= { entries: 0, terminals: 0, decisiveReachable: 0, graceOnlyWithGrit: true, endsWithin: true });
        st.entries += 1;
        st.terminals += all.length;
        if (all.some((e) => e.outcome === 'decisive')) st.decisiveReachable += 1;
        if (all.some((e) => e.grace && !e.gritUsed)) st.graceOnlyWithGrit = false;
        // Keep only what leaves the clash, so the memo stays small.
        exits = frontier(all, exitVec, (e) => `${e.grace}|${e.gritUsed}`).map((e) => ({
          hp: e.hp, mind: e.mind, sta: e.sta, pkam: e.pkam, fiw: e.fiw, teuk: e.teuk, familySkillUses: e.familySkillUses,
          homeStreak: e.homeStreak, homesick: e.homesick, grace: e.grace, gritUsed: e.gritUsed, regroup: e.regroup, outcome: e.outcome,
        }));
        clashMemo.set(key, exits);
      }
      return exits.map((end) => {
        const x = clone(s);
        x.j.meters = { hp: end.hp, mind: end.mind, sta: end.sta };
        x.j.bonds = { pkam: end.pkam, fiw: end.fiw, teuk: end.teuk };
        x.j.counters.familySkillUses = Math.min(99, j.counters.familySkillUses + end.familySkillUses);
        x.j.counters.homeStreak = end.homeStreak;
        x.j.counters.homesickCount = Math.min(99, j.counters.homesickCount + end.homesick);
        x.j = structuredClone(closeClash(x.j, { kind: 'clash', outcome: end.outcome }));
        if (end.grace) { x.grace = true; if (!end.gritUsed && !x.grit) x.graceNoGrit = true; }
        if (end.gritUsed) x.grit = true;
        if (end.regroup) x.regroups += 1;
        x.trail = extend(s, `[${rid}:${end.outcome}]`);
        return x;
      });
    },
  };
}

// --------------------------------------------------------------------------------------
// Act 1: the compiled package, node for node, as the journey session plays it.
// --------------------------------------------------------------------------------------
function fromPackage(act) {
  return PACKAGE.nodes.filter((n) => n.act === act).map((n) => {
    const id = n.id.toUpperCase();
    switch (n.type) {
      case 'vn': return story(id, n.effects ?? []);
      case 'micro': return { ...ma(id), options: () => [{ key: 'tap', kind: 'micro', apply: (x) => applyEffects(x.j, n.effects, RULES) }] };
      case 'choice': return choice(id, n.options, n.effects ?? []);
      case 'obstacle': return obstacle(id, n.options, n.effects ?? []);
      case 'clash': return clashNode(id, n.round);
      case 'camp': return camp(id, n.drops, n.activities);
      default: throw new Error(`Act ${act} node ${n.id}: ${n.type} has no model yet`);
    }
  });
}
export const ACT1 = fromPackage(1);

// --------------------------------------------------------------------------------------
// Acts 2–5: node ids match the blueprint headings exactly (the runtime ledger cross-checks).
// --------------------------------------------------------------------------------------
const ready = { key: 'ready', label: 'ready', ready: true, effects: [], responses: [] };
const act = (key, effects, extra = {}) => ({ key, label: key, effects, responses: [], ...extra });

const ACT2A = [
  obstacle('A2A-01', keys({ skills: ['wind'], item: K.guard, alone: { sta: 1 }, rush: true })),
  story('A2A-02', [flag('met_pkam')]),
  choice('A2A-03', [{ key: 'eat', effects: [add('sta', 1)] }, { key: 'share', effects: [bond('pkam', 1)] }]),
  choice('A2A-04', [{ key: 'listen', effects: [bond('pkam', 1)] }, { key: 'shirt', effects: [bond('pkam', 1)] }, { key: 'not_all', effects: [flag('kam_not_all')] }]),
  obstacle('A2A-05', keys({
    skills: ['wind', 'eye'], onSkill: [bond('pkam', 1)], combo: { item: K.guard, ally: 'pkam', effects: [bond('pkam', 2)] },
    alone: { sta: 2, effects: [bond('pkam', 1)] }, grit: [bond('pkam', 1)],
  })),
  story('A2A-06', [grant(K.gear), flag('met_fiw')]),
];

const ACT2B = [
  obstacle('A2B-01', keys({ skills: ['eye'], item: K.seeds, alone: { sta: 1 }, rush: true })),
  story('A2B-02', [flag('met_fiw')]),
  choice('A2B-03', [
    { key: 'count', effects: [bond('fiw', 1), flag('fiw_count')] }, { key: 'shelter', effects: [bond('fiw', 1), flag('fiw_warm')] }, { key: 'lead', effects: [flag('fiw_trusted')] },
  ]),
  story('A2B-04'),
  obstacle('A2B-05', keys({
    skills: ['wind', 'rain'], onSkill: [bond('fiw', 1)], combo: { item: K.seeds, ally: 'fiw', effects: [bond('fiw', 2)] },
    alone: { sta: 1, effects: [bond('fiw', 2)] }, grit: [bond('fiw', 1)],
  })),
  choice('A2B-06', [
    { key: 'push', effects: [flag('met_pkam'), spend('sta', 1), bond('pkam', 1), grant(K.gear)] },
    { key: 'let', effects: [flag('met_pkam'), grant(K.gear)] },
  ]),
];

const ACT2C = [
  camp('A2-07', 3, [act('bugs', [add('sta', 2)]), act('tend', [add('hp', 1)]), act('kam', [bond('pkam', 1)]), act('fiw', [bond('fiw', 1)]), act('quiet', [add('mind', 1)]), ready]),
  story('A2-08', [hazard('mind', 1)]),
  ma('A2-09'),
  clashNode('A2-10', 'R2'),
  story('A2-11', [grant(K.button)]),
  story('A2-12', [add('mind', 1), rest(2, 2, 2)]),
];

export const ACT3 = [
  story('A3-01'),
  obstacle('A3-02', keys({ skills: ['wind'], friend: { ally: 'pkam', effects: [bond('pkam', 1)] }, alone: { sta: 2, needSta: 4 }, wait: true })),
  obstacle('A3-03', keys({ skills: ['eye'], item: K.seeds, friend: { ally: 'pkam', effects: [bond('pkam', 1), flag('kam_saw_tears')] }, alone: { sta: 1 } })),
  story('A3-04', [], [{ when: { flag: 'kam_saw_tears' }, effects: [bond('pkam', 1)] }]), // S2: conditional effect
  story('A3-05'),
  story('A3-06', [flag('met_teuk')]),
  obstacle('A3-07', keys({
    skills: ['eye'], onSkill: [bond('teuk', 1)], combo: { item: K.seeds, ally: 'teuk', effects: [bond('teuk', 2)] },
    friend: { ally: 'pkam', effects: [bond('pkam', 1), bond('teuk', 1)] }, alone: { sta: 1, effects: [bond('teuk', 1)] }, grit: [bond('teuk', 1)],
  })),
  ma('A3-08'),
  story('A3-09'),
  story('A3-10'),
  clashNode('A3-11', 'R3'),
  camp('A3-12', 3, [
    act('splint', [release(K.guard), flag('released_guard'), flag('teuk_splint'), bond('teuk', 1)], { group: 'ankle', when: { hasItem: K.guard } }),
    act('cloth', [bond('teuk', 1)], { group: 'ankle' }),
    act('teuk', [bond('teuk', 1)]), act('kam', [bond('pkam', 1)]), act('fiw', [bond('fiw', 1)]), act('bugs', [add('sta', 2)]), act('tend', [add('hp', 1)]), ready,
  ]),
  // Teuk shares the secrets of เปี๊ยก's room once the bond reaches 3 (applied after the camp).
  story('A3-13·intel', [], [{ when: { bondAtLeast: { bond: 'teuk', value: 3 } }, effects: [flag('teuk_intel')] }]), // S2: conditional effect
  pouch('A3-13', offer(K.whistle, [bond('teuk', 1)], { seeds: [flag('seeds_to_teuk')], guard: [flag('teuk_splint')], gear: [flag('gear_to_lantern')] })),
  story('A3-14', [rest(2, 2, 2)]),
];

export const ACT4 = [
  story('A4-01', [], [{ when: { flag: 'fiw_trusted' }, effects: [bond('fiw', 1)] }]), // S2: conditional effect
  story('A4-02'),
  obstacle('A4-03', keys({ skills: ['wind'], siblings: ['kab'], friend: { ally: 'fiw', effects: [bond('fiw', 1)] }, alone: { sta: 1 } })),
  story('A4-04', [hazard('mind', 1)]),
  choice('A4-05', [{ key: 'answer:roots', effects: [flag('answer_roots')] }, { key: 'answer:self', effects: [flag('answer_self')] }, { key: 'answer:friends', effects: [flag('answer_friends')] }]),
  camp('A4-06', 3, [
    act('kab', [flag('kab_peace')]), act('kib', [flag('kib_peace')]), act('kam', [bond('pkam', 1)]), act('fiw', [bond('fiw', 1)]),
    act('bugs', [add('sta', 2)]), act('tend', [add('hp', 1)]), act('quiet', [add('mind', 1)]), ready,
  ]),
  pouch('A4-07', offer(K.ribbon, [bond('fiw', 1)], { seeds: [flag('seeds_to_kib')], guard: [flag('guard_to_kab')], gear: [flag('gear_to_pkam')], whistle: [flag('whistle_to_teuk')] })),
  // S2: the splint lets Teuk arrive earlier, so the clash opens one light higher (a tempo effect).
  choice('A4-08', ['A', 'B'].map((plan) => ({
    key: `plan:${plan}`, effects: [{ op: 'pick.plan', value: plan }],
    extra: (j) => { if (j.flags.includes('teuk_splint')) j.counters.tempo = clampTempo(j.counters.tempo + 1); },
  }))),
  clashNode('A4-09', (s) => (s.j.plan === 'A' ? 'R4A' : 'R4B')),
  story('A4-10', [rest(2, 2, 2)]),
  story('A4-11'),
];

export const ACT5 = [
  story('A5-01'),
  obstacle('A5-02', keys({ skills: ['rain', 'wind'], alone: { sta: 1 } })),
  ma('A5-03'),
  story('A5-04'),
  story('A5-05', [], [{ when: { all: [{ not: { hasItem: K.ribbon } }, { not: { hasItem: K.whistle } }] }, effects: [hazard('mind', 1)] }]), // S2: conditional effect
  story('A5-06'),
  clashNode('A5-07', 'R5'),
  story('A5-08'),
  story('A5-09'),
  story('A5-10'),
];

/** Ending predicates of Core (master plan §2.13) in the old evidence shape, for the v3 harness. */
export function endings(s) {
  const j = createJourneyState({ act: 5, meters: { hp: s.hp, mind: s.mind, sta: s.sta } });
  j.bonds = { pkam: s.bk, fiw: s.bf, teuk: s.bt };
  j.counters.familySkillUses = s.fsu;
  j.counters.selfReliance = s.sr;
  for (const name of s.items) { j.pouch.held.push(K[name]); j.pouch.acquired.push(K[name]); j.pouch.remembered.push(K[name]); }
  return endingsOf(j);
}
function endingsOf(j) {
  const e = evaluateEndings(j);
  return { home: e.endings['e-home'].open, pond: e.endings['e-pond'].open, dawn: e.endings['e-dawn'].open, fallback: e.fallback };
}

// --------------------------------------------------------------------------------------
// Runner
// --------------------------------------------------------------------------------------
// Flags that change later rules. Story-only flags (who received a released keepsake, which
// words were said) choose script variants and are tracked by the blueprints, not here.
const MECH_FLAGS = new Set(['met_pkam', 'met_fiw', 'met_teuk', 'teuk_splint', 'teuk_intel', 'kab_peace', 'kib_peace', 'kam_saw_tears']);
const classKey = (s) => JSON.stringify([
  s.j.act, s.j.route, s.j.plan, s.j.major, [...s.j.pouch.held].sort(), [...s.j.ready].sort(),
  s.j.flags.filter((f) => MECH_FLAGS.has(f)).sort(), s.grit, s.grace, s.graceNoGrit,
]);
const stateVec = (s) => {
  const { meters: m, bonds: b, counters: c } = s.j;
  return [m.hp, m.mind, m.sta, b.pkam, b.fiw, b.teuk, Math.min(c.familySkillUses, 3), Math.min(c.selfReliance, 4), c.tempo, -Math.min(c.homeStreak, 2), -Math.min(c.homesickCount, 3)];
};

const T0 = Date.now();
const NODE_LOG = [];
const ANOMALIES = [];

/**
 * The same Pareto frontier as frontier(), built one state at a time so only kept states stay in
 * memory. Equal vectors keep their first state; the final order (class of first appearance,
 * then larger vector sums first, then arrival) is exactly the order frontier() produces.
 */
class StreamFrontier {
  constructor(vecOf, classOf) { this.vecOf = vecOf; this.classOf = classOf; this.groups = new Map(); this.seen = 0; }
  add(x) {
    const k = this.classOf(x);
    const v = this.vecOf(x);
    let g = this.groups.get(k);
    if (!g) { g = []; this.groups.set(k, g); }
    const ge = (a, b) => a.every((ai, i) => ai >= b[i]);
    const order = this.seen++;
    if (MODE === 'best') {
      if (g.some((kept) => ge(kept.v, v))) return;
      for (let i = g.length - 1; i >= 0; i--) if (ge(v, g[i].v)) g.splice(i, 1);
    } else {
      if (g.some((kept) => ge(v, kept.v))) return;
      for (let i = g.length - 1; i >= 0; i--) if (ge(g[i].v, v)) g.splice(i, 1);
    }
    g.push({ x, v, sum: v.reduce((a, b) => a + b, 0), order });
  }
  values() {
    const out = [];
    for (const g of this.groups.values()) {
      g.sort((a, b) => (MODE === 'best' ? b.sum - a.sum : a.sum - b.sum) || a.order - b.order);
      out.push(...g.map((k) => k.x));
    }
    return out;
  }
}

function runNodes(states, nodes, label) {
  for (const node of nodes) {
    const next = new StreamFrontier(stateVec, classKey);
    let candidates = 0;
    let deadEnds = 0;
    for (const s of states) {
      let produced;
      if (node.type === 'clash') {
        produced = node.expand(s);
      } else {
        const opts = node.options(s);
        if (!opts.length) { deadEnds += 1; continue; }
        produced = opts.map((o) => {
          const x = clone(s);
          o.apply(x);
          if (o.key !== '·' && o.key !== 'tap') x.trail = extend(s, `${node.id}=${o.key}`);
          return x;
        });
      }
      for (const x of produced) {
        const { meters: m, pouch: p } = x.j;
        if (p.held.length > 4) ANOMALIES.push(`pouch>4 at ${node.id}: ${pathOf(x)}`);
        if (m.hp < 0 || m.mind < 0 || m.sta < 0) ANOMALIES.push(`negative meter at ${node.id}`);
        if (p.held.includes(K.button) && !s.j.pouch.held.includes(K.button) && node.id !== 'A2-11') ANOMALIES.push(`button appeared outside A2-11 at ${node.id}`);
        if (s.j.pouch.held.includes(K.button) && !p.held.includes(K.button)) ANOMALIES.push(`button released at ${node.id}`);
        next.add(x);
        candidates += 1;
      }
    }
    states = next.values();
    NODE_LOG.push({ act: label, id: node.id, type: node.type, states: states.length, deadEnds });
    if (process.env.JK_PROGRESS) process.stderr.write(`${label} ${node.id} ${node.type} ${candidates} → ${states.length} (${((Date.now() - T0) / 1000).toFixed(1)}s)\n`);
    if (deadEnds) ANOMALIES.push(`dead end at ${node.id} (${deadEnds} states)`);
  }
  return states;
}

const nextAct = (states, act) => states.map((s) => { const x = clone(s); beginAct(x.j, act); return x; });
const env = (states) => {
  const r = (get) => [Math.min(...states.map(get)), Math.max(...states.map(get))].join('–');
  return `กาย ${r((s) => s.j.meters.hp)} · ใจ ${r((s) => s.j.meters.mind)} · แรง ${r((s) => s.j.meters.sta)} · สายใยก้าม ${r((s) => s.j.bonds.pkam)} · ฟิ้ว ${r((s) => s.j.bonds.fiw)} · เตื๊อก ${r((s) => s.j.bonds.teuk)} · fsu ${r((s) => s.j.counters.familySkillUses)} · sr ${r((s) => s.j.counters.selfReliance)}`;
};

export function runModel() {
  const report = { acts: {}, checks: [] };
  // Act 1 ends at A1-13, whose node effects carry the Act 1 rest floor (กาย 4 · ใจ 3 · แรง 4).
  const s1 = runNodes([start()], ACT1, 'Act 1');
  report.acts.act1 = { states: s1.length, env: env(s1), graceAct1: s1.filter((s) => s.grace).length };

  const s2in = nextAct(s1, 2);
  const s2a = runNodes(s2in.filter((s) => s.j.route === 'A'), [...ACT2A, ...ACT2C], 'Act 2A');
  const s2b = runNodes(s2in.filter((s) => s.j.route === 'B'), [...ACT2B, ...ACT2C], 'Act 2B');
  const s2 = [...s2a, ...s2b];
  report.acts.act2 = { states: s2.length, env: env(s2), A: env(s2a), B: env(s2b) };

  const s3 = runNodes(nextAct(s2, 3), ACT3, 'Act 3');
  report.acts.act3 = { states: s3.length, env: env(s3) };
  const s4 = runNodes(nextAct(s3, 4), ACT4, 'Act 4');
  report.acts.act4 = { states: s4.length, env: env(s4) };
  const s5 = runNodes(nextAct(s4, 5), ACT5, 'Act 5');
  report.acts.act5 = { states: s5.length, env: env(s5) };
  return { report, s1, s2, s3, s4, s5 };
}

// --------------------------------------------------------------------------------------
// Strategy probes: one whole playthrough each, decided by a fixed policy and played on the
// Core runtime (clashes go turn by turn through the clash shell). These show in plain terms
// what a style of play can reach (the enumeration above proves the limits).
// --------------------------------------------------------------------------------------
const PREF = {
  family: ['skill', 'sibling', 'combo', 'friend', 'item', 'alone', 'wait', 'rush', 'grit'],
  never: ['combo', 'friend', 'item', 'alone', 'wait', 'rush', 'grit'],
  alone: ['alone', 'rush', 'combo', 'friend', 'item', 'skill', 'wait', 'grit'],
  lonely: ['alone', 'rush', 'item', 'skill', 'wait', 'grit'],
  grit: ['grit'],
};
function pickObstacle(opts, s, style, override) {
  let order = PREF[style] || PREF.family;
  if (style === 'balanced') order = s.j.counters.homeStreak >= 1 ? ['combo', 'friend', 'item', 'alone', 'rush', 'wait', 'grit'] : ['skill', 'combo', 'friend', 'item', 'alone', 'wait', 'grit'];
  if (override) order = [override, ...order];
  for (const kind of order) { const o = opts.find((x) => x.kind === kind); if (o) return o; }
  return opts[opts.length - 1];
}
const CAMP_PREF = {
  bond: ['teuk', 'kam', 'fiw', 'cloth', 'kab', 'kib', 'mother', 'quiet', 'bugs', 'tend', 'eat'],
  rest: ['bugs', 'tend', 'eat', 'quiet', 'mother', 'kab', 'kib'],
  talk: ['kam', 'fiw', 'teuk', 'cloth', 'kab', 'kib', 'mother'],
};
function pickCamp(opts, style, s) {
  // A sensible player eats when tired, whatever else they came to the camp for.
  const want = style === 'bond' && s.j.meters.sta <= 3 ? ['bugs', ...CAMP_PREF.bond] : CAMP_PREF[style];
  let best = opts[0]; let bestScore = -Infinity;
  for (const o of opts) {
    const parts = o.key.replace('camp:', '').split('+');
    const score = parts.reduce((a, p) => a + (want.includes(p) ? 20 - want.indexOf(p) : p.startsWith('ready_') ? 0 : -30), 0);
    if (score > bestScore) { bestScore = score; best = o; }
  }
  return best;
}

// Clash policies on the Core shell: (round, journey, encounter, legal) → action.
const FAMILY_ACTS = ['rain', 'wind', 'eye', 's_kab', 's_kib'];
const TEUK_ACTS = ['a_teuk', 'button_teuk', 'whistle_teuk'];
function valueAfter(round, j, enc, id) {
  const r = playClashTurn(round, j, enc, id);
  let score = r.encounter.light * 3 + r.journey.meters.hp + r.journey.meters.mind + r.journey.meters.sta * 0.5 - r.encounter.homesick * 2;
  if (r.encounter.outcome) score += r.encounter.outcome === 'decisive' ? 40 : r.encounter.outcome === 'hold' ? 10 : -10;
  return score;
}
function smartAmong(round, j, enc, allowed) {
  let best = allowed[0]; let bestScore = -Infinity;
  for (const id of allowed) { const sc = valueAfter(round, j, enc, id); if (sc > bestScore) { bestScore = sc; best = id; } }
  return best;
}
const CLASH_POLICY = {
  smart: (r, j, e, legal) => smartAmong(r, j, e, legal),
  mash: (r, j, e, legal) => (legal.includes('strike') ? 'strike' : 'rest'),
  familyFirst: (r, j, e, legal) => FAMILY_ACTS.find((a) => legal.includes(a)) || smartAmong(r, j, e, legal),
  noFamily: (r, j, e, legal) => smartAmong(r, j, e, legal.filter((a) => !FAMILY_ACTS.includes(a))),
  smartNoTeuk: (r, j, e, legal) => smartAmong(r, j, e, legal.filter((a) => !TEUK_ACTS.includes(a))),
  noFamilyNoTeuk: (r, j, e, legal) => smartAmong(r, j, e, legal.filter((a) => !FAMILY_ACTS.includes(a) && !TEUK_ACTS.includes(a))),
  lonely: (r, j, e, legal) => smartAmong(r, j, e, legal.filter((a) => !['assist', 'combo'].includes(ACTIONS[a].kind))),
};
const CLASH_ROUND = { 'A1-08': 'R1', 'A2-10': 'R2', 'A3-11': 'R3', 'A5-07': 'R5' };

export function probe({ name, major = 'wind', route = 'A', plan = 'A', obstacle: style = 'balanced', campStyle = 'bond', clash = 'smart', whistle = 'release-gear', ribbon = 'release-seeds', overrides = {}, noSkills = false }) {
  let s = start();
  const snaps = {};
  const picks = (o, op, value) => o.effects?.some((e) => e.op === op && e.value === value);
  const run = (nodes) => {
    for (const node of nodes) {
      if (node.type === 'clash') {
        const rid = node.id === 'A4-09' ? (s.j.plan === 'A' ? 'R4A' : 'R4B') : CLASH_ROUND[node.id];
        const round = ROUND_SPECS.get(rid);
        let j = s.j;
        let enc = openClash(round, j);
        while (enc.outcome === null) ({ journey: j, encounter: enc } = playClashTurn(round, j, enc, CLASH_POLICY[clash](round, j, enc, clashActions(round, j, enc))));
        if (enc.gritUsed) s.grit = true;
        if (enc.grace) s.grace = true;
        s = { ...s, j: structuredClone(closeClash(j, enc)), trail: extend(s, `[${rid}:${enc.outcome}]`) };
        continue;
      }
      const opts = node.options(s);
      let o;
      if (node.type === 'obstacle') o = pickObstacle(noSkills ? opts.filter((x) => x.kind !== 'skill' && x.kind !== 'sibling') : opts, s, style, overrides[node.id]);
      else if (node.type === 'camp') o = pickCamp(opts, campStyle, s);
      else if (node.type === 'pouch') o = opts.find((x) => x.key === (node.id === 'A3-13' ? whistle : ribbon)) || opts.find((x) => x.key === 'take') || opts[opts.length - 1];
      else if (overrides[node.id]) o = opts.find((x) => x.key.startsWith(overrides[node.id])) || opts[0];
      else if (node.id === 'A1-03') o = opts.find((x) => picks(x, 'pick.major', major));
      else if (node.id === 'A1-13') o = opts.find((x) => picks(x, 'pick.route', route));
      else if (node.id === 'A4-08') o = opts.find((x) => picks(x, 'pick.plan', plan));
      else o = opts[0];
      const x = clone(s); o.apply(x); x.trail = extend(s, `${node.id}=${o.key}`); s = x;
    }
  };
  const snap = (k) => { snaps[k] = `กาย ${s.j.meters.hp} ใจ ${s.j.meters.mind} แรง ${s.j.meters.sta}`; };
  const next = (act) => { const x = clone(s); beginAct(x.j, act); s = x; };
  run(ACT1); snap('Act 1'); next(2);
  run(route === 'A' ? [...ACT2A, ...ACT2C] : [...ACT2B, ...ACT2C]); snap('Act 2');
  next(3); run(ACT3); snap('Act 3');
  next(4); run(ACT4); snap('Act 4');
  next(5); run(ACT5);
  return { name, s, e: endingsOf(s.j), snaps };
}

// The first probe is a witness that reaches E-DAWN. Each later probe changes exactly one
// habit of that run, which shows that every ingredient of E-DAWN is really needed.
export const PROBES = [
  { id: 'dawn', name: 'ต้นแบบ: สลับทักษะครอบครัวกับการยืนหยัดเอง · คุยกับเพื่อนที่แคมป์ · อ่านเจตนาศัตรู (สาย A · แผน A)', obstacle: 'alone' },
  { id: 'dawnBB', name: 'ต้นแบบ · สาย B · แผน B · วิชาเอกตั้งสติฟังฝน', obstacle: 'alone', route: 'B', plan: 'B', major: 'rain' },
  { id: 'dawnAB', name: 'ต้นแบบ · สาย A · แผน B · วิชาเอกตาส่องเงามืด', obstacle: 'alone', route: 'A', plan: 'B', major: 'eye' },
  { id: 'dawnBA', name: 'ต้นแบบ · สาย B · แผน A', obstacle: 'alone', route: 'B', plan: 'A' },
  { id: 'spam', name: 'ต่างจากต้นแบบข้อเดียว: พึ่งทักษะครอบครัวทุกด่านและทุกเทิร์น', obstacle: 'family', clash: 'familyFirst' },
  { id: 'never', name: 'ต่างจากต้นแบบข้อเดียว: ไม่ใช้ทักษะครอบครัวเลย', obstacle: 'alone', clash: 'noFamily', overrides: {}, noSkills: true },
  { id: 'leaning', name: 'ต่างจากต้นแบบข้อเดียว: แทบไม่ยืนหยัดเอง (ให้เพื่อนกับไอเทมช่วยแทน)', obstacle: 'balanced' },
  { id: 'lonely', name: 'ต่างจากต้นแบบข้อเดียว: เดินทางคนเดียว ไม่คุย ไม่ใช้ท่าผสาน ไม่เรียกเพื่อน', obstacle: 'lonely', campStyle: 'rest', clash: 'lonely' },
  { id: 'mash', name: 'ต่างจากต้นแบบข้อเดียว: ในศึกกดรุกอย่างเดียว ไม่อ่านเจตนา', obstacle: 'alone', clash: 'mash' },
  { id: 'noRoots', name: 'ต่างจากต้นแบบข้อเดียว: สละเมล็ดต้อยติ่งและสนับข้อมือ (ไม่เหลือของจากบ้าน)', obstacle: 'alone', whistle: 'release-seeds', ribbon: 'release-guard' },
  { id: 'noPromise', name: 'ต่างจากต้นแบบข้อเดียว: ปฏิเสธนกหวีดและริบบิ้น (ไม่เหลือของแทนคำสัญญา)', obstacle: 'alone', whistle: 'refuse', ribbon: 'refuse' },
  { id: 'homeOnly', name: 'เส้นทางที่เปิด E-HOME แต่ปิด E-POND: ไม่ใช้ทักษะครอบครัว · สละของจากบ้านทั้งสองชิ้น', obstacle: 'never', clash: 'noFamily', whistle: 'release-seeds', ribbon: 'release-guard' },
  { id: 'pondOnly', name: 'เส้นทางที่เปิด E-POND แต่ปิด E-HOME: ไม่สนิทกับเตื๊อก · ปฏิเสธนกหวีดและริบบิ้น', obstacle: 'balanced', clash: 'smartNoTeuk', campStyle: 'rest', whistle: 'refuse', ribbon: 'refuse', overrides: { 'A3-07': 'skill' } },
  { id: 'pessimist', name: 'เส้นทางที่เล่นแย่ที่สุด: ฝืนเอาทุกด่าน · คุยอย่างเดียวไม่พัก · กดรุกในศึก · ปฏิเสธของขวัญ', obstacle: 'grit', campStyle: 'talk', clash: 'mash', whistle: 'refuse', ribbon: 'refuse' },
];

// --------------------------------------------------------------------------------------
// Proof
// --------------------------------------------------------------------------------------
function main() {
  const t0 = Date.now();
  const { report, s4, s5 } = runModel();
  const lines = [];
  const say = (x = '') => lines.push(x);
  let ok = true;
  const check = (name, pass, detail = '') => { if (!pass) ok = false; say(`${pass ? 'ผ่าน' : 'ไม่ผ่าน'} · ${name}${detail ? ' · ' + detail : ''}`); };

  say('JaoKob five-act balance model · ADR-P0-032 v2.0 · ADR-P0-033');
  say(`ปลาย Act 1: ${report.acts.act1.env}`);
  say(`ปลาย Act 2: ${report.acts.act2.env}`);
  say(`  สาย A: ${report.acts.act2.A}`);
  say(`  สาย B: ${report.acts.act2.B}`);
  say(`ปลาย Act 3: ${report.acts.act3.env}`);
  say(`ปลาย Act 4: ${report.acts.act4.env}`);
  say(`ก่อนเลือกฉากจบ (A5-11): ${report.acts.act5.env}`);

  const ends = s5.map((s) => ({ s, e: endingsOf(s.j) }));
  const some = (f) => ends.some(f);
  say('');
  say('ข้อพิสูจน์โครงสร้าง:');
  check('ไม่มีทางตันในทุกโหนด (ทุกสถานะมีตัวเลือกอย่างน้อย 1 ทาง)', !ANOMALIES.some((a) => a.startsWith('dead end')), ANOMALIES.filter((a) => a.startsWith('dead end')).slice(0, 3).join('; '));
  check('กระเป๋าไม่เกิน 4 ช่องตลอดเกม', !ANOMALIES.some((a) => a.startsWith('pouch')));
  check('ค่าสถานะไม่ติดลบ', !ANOMALIES.some((a) => a.startsWith('negative')));
  check('กระดุมทองเหลือง ต.♡ป. ไม่เคยถูกสละหลังได้คืน และอยู่ในกระเป๋าทุกเส้นทางเมื่อเข้า Act 5', !ANOMALIES.some((a) => a.startsWith('button')) && s4.every((s) => held(s, K.button)));
  check('ปลาย Act 4 ทุกค่า ≥ 2 (Rest Floor)', s4.every((s) => s.j.meters.hp >= 2 && s.j.meters.mind >= 2 && s.j.meters.sta >= 2));
  check('Grace เกิดเฉพาะเส้นทางที่เคยฝืนเอา', ends.every((x) => !x.s.graceNoGrit) && Object.values(CLASH_STATS).every((c) => c.graceOnlyWithGrit));
  check('ทุกสถานะปลายทางมีฉากจบให้เลือกอย่างน้อย 1 ทาง', ends.every((x) => x.e.home || x.e.pond || x.e.dawn));
  check('สหายและท่าผสานที่ด่านเปิดเฉพาะเมื่อสหายอยู่ตรงนั้นจริง', !ANOMALIES.some((a) => a.startsWith('ally')), ANOMALIES.filter((a) => a.startsWith('ally')).slice(0, 3).join('; '));
  for (const [rid, c] of Object.entries(CLASH_STATS)) {
    check(`ศึก ${rid}: ทุกจุดเข้าศึกมีทางชนะขาด`, c.decisiveReachable === c.entries, `${c.decisiveReachable}/${c.entries} จุดเข้าศึก`);
  }

  const pairs = [['A', 'A'], ['A', 'B'], ['B', 'A'], ['B', 'B']];
  say('');
  say('สิ่งที่ไปถึงได้ (ทุกข้อมีเส้นทางพยานจริง):');
  for (const [r, p] of pairs) {
    const sub = ends.filter((x) => x.s.j.route === r && x.s.j.plan === p);
    check(`สาย ${r} × แผน ${p}: เปิด E-HOME · E-POND · E-DAWN ได้ครบ`, sub.some((x) => x.e.home) && sub.some((x) => x.e.pond && !x.e.fallback) && sub.some((x) => x.e.dawn));
  }
  check('E-DAWN ไปถึงได้โดยไม่เคยฝืนเอา', some((x) => x.e.dawn && !x.s.grit));
  check('E-DAWN ไปถึงได้โดยไม่เคยเกิดอาการโหยหาบ้าน', some((x) => x.e.dawn && x.s.j.counters.homesickCount === 0));
  check('ทุกวิชาเอกจาก Act 1 ไปถึง E-DAWN ได้', ['rain', 'wind', 'eye'].every((m) => some((x) => x.s.j.major === m && x.e.dawn)));

  say('');
  say('ผลการเล่นจำลองตามสไตล์ (หนึ่งเส้นทางต่อสไตล์):');
  const R = {};
  for (const pr of PROBES) {
    const r = probe(pr);
    R[pr.id] = r;
    const { meters: m, bonds: b, counters: c } = r.s.j;
    const open = ['home', 'pond', 'dawn'].filter((k) => r.e[k]).map((k) => 'E-' + k.toUpperCase()).join(' · ') || '—';
    say(`  ${r.name}`);
    const items = Object.values(K).filter((id) => r.s.j.pouch.held.includes(id)).map((id) => SHORT[id]).join(',');
    say(`    เปิด: ${open}${r.e.fallback ? ' (ผ่าน Safety Fallback)' : ''} · กาย ${m.hp} ใจ ${m.mind} แรง ${m.sta} · ก้าม ${b.pkam} ฟิ้ว ${b.fiw} เตื๊อก ${b.teuk} · fsu ${c.familySkillUses} · sr ${c.selfReliance} · โหยหาบ้าน ${c.homesickCount} · ของ ${items}`);
    if (pr.id === 'pessimist' || pr.id === 'spam') say(`    ค่าปลายองก์: ${Object.entries(r.snaps).map(([k, v]) => `${k} ${v}`).join(' · ')}`);
    if (process.argv.includes('--examples')) say(`    ${pathOf(r.s)}`);
  }
  const fsu = (k) => R[k].s.j.counters.familySkillUses;
  const sr = (k) => R[k].s.j.counters.selfReliance;
  say('');
  say('ข้อพิสูจน์จากการเล่นจำลอง:');
  check('ต้นแบบไปถึง E-DAWN ได้ทั้ง 4 คู่สาย × แผน', ['dawn', 'dawnBB', 'dawnAB', 'dawnBA'].every((k) => R[k].e.dawn));
  check('พึ่งทักษะครอบครัวทุกครั้งไปไม่ถึง E-DAWN (อาการโหยหาบ้านกินใจและแรง)', !R.spam.e.dawn);
  check('ไม่ใช้ทักษะครอบครัวเลยไปไม่ถึง E-DAWN (fsu < 3)', !R.never.e.dawn && fsu('never') < 3);
  check('แทบไม่ยืนหยัดเองไปไม่ถึง E-DAWN (selfReliance < 4)', !R.leaning.e.dawn && sr('leaning') < 4);
  check('เดินทางคนเดียวไม่สร้างสายใยไปไม่ถึง E-DAWN', !R.lonely.e.dawn);
  check('กดรุกอย่างเดียวในศึกไปไม่ถึง E-DAWN', !R.mash.e.dawn);
  check('ไม่เหลือของจากบ้านไปไม่ถึง E-DAWN', !R.noRoots.e.dawn);
  check('ไม่เหลือของแทนคำสัญญาไปไม่ถึง E-DAWN', !R.noPromise.e.dawn);
  check('มีเส้นทางที่เปิด E-HOME แต่ปิด E-POND (เงื่อนไขรากเหง้ามีความหมาย)', R.homeOnly.e.home && !R.homeOnly.e.pond);
  check('มีเส้นทางที่เปิด E-POND แต่ปิด E-HOME (เงื่อนไขคำสัญญามีความหมาย)', R.pondOnly.e.pond && !R.pondOnly.e.home);
  check('เส้นทางที่เล่นแย่ที่สุดยังเลือกฉากจบได้ (Safety Fallback ของ E-POND)', R.pessimist.e.pond, R.pessimist.e.fallback ? 'fallback ทำงาน' : 'ไม่ต้องใช้ fallback');
  say('');
  say(`โหนด ${NODE_LOG.length} · จุดเข้าศึกที่ต่างกัน ${clashMemo.size} · ${((Date.now() - t0) / 1000).toFixed(1)} วินาที`);
  if (process.argv.includes('--nodes')) for (const l of NODE_LOG) say(`  ${l.act} ${l.id} (${l.type}) → ${l.states}`);
  say(ok ? 'ผลรวม: ผ่านทุกข้อ' : 'ผลรวม: มีข้อที่ไม่ผ่าน');
  console.log(lines.join('\n'));
  process.exitCode = ok ? 0 : 1;
}

export const NODE_IDS = {
  act1: ACT1.map((n) => n.id),
  act2A: [...ACT2A, ...ACT2C].map((n) => n.id),
  act2B: [...ACT2B, ...ACT2C].map((n) => n.id),
  act3: ACT3.map((n) => n.id).filter((id) => !id.includes('·')),
  act4: ACT4.map((n) => n.id),
  act5: [...ACT5.map((n) => n.id), 'A5-11', 'E-HOME-1', 'E-HOME-2', 'E-POND-1', 'E-POND-2', 'E-DAWN-1', 'E-DAWN-2'],
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
