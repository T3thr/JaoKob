// JaoKob · five-act balance model (design evidence for ADR-P0-032 v2.0 D5 and ADR-P0-033 D2/D5).
// Usage:  node docs/design-system/evidence/five-act-balance-model.mjs [--examples]
//
// Enumerates every choice that changes the game state across Acts 1–5: story choices, the
// Four Keys at every obstacle, every Shelter Camp allocation, both pouch decisions, both
// Act 2 routes, both Act 4 plans, and every reachable outcome of the five Light vs. Shadow
// clashes (each clash is enumerated move by move by tactical-clash-engine.mjs). Identical
// states are merged after each node. At A5-11 it evaluates the three ending predicates and
// checks the fairness invariants listed at the bottom. Exit code 1 if any invariant fails.
//
// Every number here is mirrored in the node tables of the five act blueprints.

import { pathToFileURL } from 'node:url';
import { enterClash, terminals, playStrategy, smart, mash, listActions, step, ACTIONS, METER_MAX, BOND_MAX, softDec, GRACE_FLOOR } from './tactical-clash-engine.mjs';
const ACTIONS_KIND = Object.fromEntries(Object.entries(ACTIONS).map(([k, v]) => [k, v.kind]));

// The model keeps, after every node, only the states that no other state of the same class
// beats on every axis. Every kept state is genuinely reachable, so each "reachable" claim
// comes with a witness path. Safety claims that hold by construction (rest floors, the
// fallback ending, the full pouch) are checked structurally and by the probes below.
export const MODE = 'best';

export const ITEM_SIDE = {
  seeds: 'roots', guard: 'roots', gear: 'friend', button: 'core', whistle: 'promise', ribbon: 'promise',
};
export const ITEM_ID = {
  seeds: 'item_kib_glowing_seeds', guard: 'item_kab_bark_guard', gear: 'item_pkam_tin_gear',
  button: 'item_teuk_peuak_button', whistle: 'item_teuk_whistle_charm', ribbon: 'item_fiw_sun_ribbon',
};
export const POUCH_CAP = 4;

// --------------------------------------------------------------------------------------
// State helpers
// --------------------------------------------------------------------------------------
const M = (v) => Math.max(0, Math.min(METER_MAX, v));
const B = (v) => Math.max(0, Math.min(BOND_MAX, v));
const has = (s, x) => s.items.includes(x);
const flag = (s, f) => s.flags.includes(f);
const setFlag = (s, f) => { if (!flag(s, f)) s.flags.push(f); };
const clone = (s) => ({ ...s, items: [...s.items], flags: [...s.flags], ready: [...s.ready], path: s.path });

function start() {
  return {
    act: 1, route: null, plan: null, major: null,
    hp: 5, mind: 4, sta: 5, fsu: 0, sr: 0, streak: 0, homesick: 0,
    bk: 0, bf: 0, bt: 0, tempo: 0,
    items: [], ready: [], flags: [],
    grit: false, grace: false, graceNoGrit: false, regroups: 0,
    path: '',
  };
}

// Family-skill use outside the clash. Acts 2–5 count and can strain; Act 1 is practice.
function family(s) {
  if (s.act >= 2) {
    s.fsu += 1;
    if (s.streak >= 1) {
      s.mind = softDec(s.mind, 1);
      s.sta = softDec(s.sta, 1);
      s.homesick += 1;
    }
  }
  s.streak += 1;
}
const own = (s) => { s.streak = 0; };

// Grit: always available, HP −1 and STA −2; emptying a meter triggers Grace (2/2/2).
function gritFx(s) {
  own(s);
  s.grit = true;
  if (s.act >= 2) s.sr += 1;
  s.hp = M(s.hp - 1);
  s.sta = M(s.sta - 2);
  if (s.hp <= 0 || s.mind <= 0 || s.sta <= 0) {
    s.hp = Math.max(s.hp, GRACE_FLOOR);
    s.mind = Math.max(s.mind, GRACE_FLOOR);
    s.sta = Math.max(s.sta, GRACE_FLOOR);
    s.grace = true;
  }
}

const floor = (s, f) => { s.hp = Math.max(s.hp, f[0]); s.mind = Math.max(s.mind, f[1]); s.sta = Math.max(s.sta, f[2]); };

// --------------------------------------------------------------------------------------
// Node constructors. Each node returns the list of options visible in state s.
// An option is { key, fx(s) }.
// --------------------------------------------------------------------------------------
const story = (id, fx) => ({ id, type: 'story', options: () => [{ key: '·', fx: fx || (() => {}) }] });
const ma = (id, fx) => ({ id, type: 'micro', options: () => [{ key: 'tap', fx: fx || (() => {}) }] });
const choice = (id, opts) => ({
  id, type: 'choice',
  options: (s) => opts.filter((o) => !o.when || o.when(s)).map((o) => ({ key: o.key, fx: o.fx })),
});

// The Four Keys + grit. spec fields:
//   skills: ['rain'|'wind'|'eye', ...]   free, fsu +1 (Acts 2–5), strain on consecutive use
//   item:   { id, fx }                    free when held
//   combo:  { item, ally, fx }            Item × Bond Combo (golden option)
//   friend: { ally, fx, min }             free, needs the companion present
//   alone:  { sta, needSta, fx }          STA −sta, needs ใจ ≥ 3 and STA ≥ needSta, sr +1
//   rush:   { fx }                        STA −2, tempo +1, sr +1, needs STA ≥ 3
//   wait:   { fx }                        free, tempo −1
//   all:    fx applied to every option (e.g. the rescue always happens)
function obstacle(id, spec) {
  return {
    id, type: 'obstacle',
    options: (s) => {
      const out = [];
      const all = spec.all || (() => {});
      for (const k of spec.skills || []) {
        out.push({ key: 'skill:' + k, fx: (x) => { family(x); spec.onSkill?.(x, k); all(x); } });
      }
      for (const k of spec.siblings || []) {
        out.push({ key: 'sibling:' + k, fx: (x) => { family(x); all(x); } });
      }
      if (spec.item && has(s, spec.item.id)) out.push({ key: 'item:' + spec.item.id, fx: (x) => { own(x); spec.item.fx?.(x); all(x); } });
      if (spec.combo && has(s, spec.combo.item) && present(s, spec.combo.ally)) {
        out.push({ key: 'combo:' + spec.combo.item + '×' + spec.combo.ally, fx: (x) => { own(x); spec.combo.fx(x); all(x); } });
      }
      if (spec.friend && present(s, spec.friend.ally) && bondOf(s, spec.friend.ally) >= (spec.friend.min || 0)) {
        out.push({ key: 'friend:' + spec.friend.ally, fx: (x) => { own(x); spec.friend.fx?.(x); all(x); } });
      }
      if (spec.alone && s.mind >= 3 && s.sta >= (spec.alone.needSta ?? spec.alone.sta + 1)) {
        out.push({ key: 'alone', fx: (x) => { own(x); x.sta = M(x.sta - spec.alone.sta); if (x.act >= 2) x.sr += 1; spec.alone.fx?.(x); all(x); } });
      }
      if (spec.rush && s.sta >= 3) {
        out.push({ key: 'rush', fx: (x) => { own(x); x.sta = M(x.sta - 2); x.tempo = Math.min(2, x.tempo + 1); if (x.act >= 2) x.sr += 1; spec.rush.fx?.(x); all(x); } });
      }
      if (spec.wait) out.push({ key: 'wait', fx: (x) => { own(x); x.tempo = Math.max(-1, x.tempo - 1); spec.wait.fx?.(x); all(x); } });
      out.push({ key: 'grit', fx: (x) => { gritFx(x); spec.grit?.(x); all(x); } });
      return out;
    },
  };
}

const ALLY_BOND = { pkam: 'bk', fiw: 'bf', teuk: 'bt' };
const bondOf = (s, ally) => s[ALLY_BOND[ally]];
function present(s, ally) {
  if (ally === 'pkam') return flag(s, 'met_pkam');
  if (ally === 'fiw') return flag(s, 'met_fiw');
  if (ally === 'teuk') return flag(s, 'met_teuk') && s.act === 3;
  return false;
}

// Shelter Camp: pick exactly `budget` distinct activities (fewer if fewer are eligible).
// Activities sharing a `group` are mutually exclusive.
function camp(id, budget, acts) {
  return {
    id, type: 'camp',
    options: (s) => {
      const eligible = acts.filter((a) => !a.when || a.when(s));
      const k = Math.min(budget, eligible.length);
      const out = [];
      const rec = (startIdx, chosen) => {
        if (chosen.length === k) {
          const groups = chosen.map((a) => a.group).filter(Boolean);
          if (new Set(groups).size !== groups.length) return;
          out.push({
            key: 'camp:' + chosen.map((a) => a.key).join('+'),
            fx: (x) => { for (const a of chosen) a.fx(x); },
          });
          return;
        }
        for (let i = startIdx; i < eligible.length; i++) rec(i + 1, [...chosen, eligible[i]]);
      };
      rec(0, []);
      return out;
    },
  };
}

// Pouch decision when a new keepsake is offered (ADR-P0-020: collect / replace / refuse → memory).
// releases: { item: (s) => fx } describes where a released keepsake goes (story meaning).
function pouch(id, item, releases, onTake, onRefuse) {
  return {
    id, type: 'pouch',
    options: (s) => {
      const out = [];
      if (s.items.length < POUCH_CAP) {
        out.push({ key: 'take', fx: (x) => { x.items.push(item); onTake?.(x); } });
      } else {
        for (const [rel, fx] of Object.entries(releases)) {
          if (!has(s, rel)) continue;
          out.push({
            key: `take(release ${rel})`,
            fx: (x) => { x.items = x.items.filter((i) => i !== rel); x.items.push(item); setFlag(x, `released_${rel}`); fx?.(x); onTake?.(x); },
          });
        }
      }
      out.push({ key: 'refuse', fx: (x) => { setFlag(x, `memory_${item}`); onRefuse?.(x); } });
      return out;
    },
  };
}

// Clash node: expands into the frontier of distinct exits reachable from this entry state.
const clashMemo = new Map();
const exitVec = (e) => [e.hp, e.mind, e.sta, e.bk, e.bf, e.bt, Math.min(e.fsu, 3), -Math.min(e.streak, 1), -Math.min(e.homesick, 3)];
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
function clashNode(id, roundOf) {
  return {
    id, type: 'clash',
    expand: (s) => {
      const rid = typeof roundOf === 'function' ? roundOf(s) : roundOf;
      const key = rid + '|' + JSON.stringify([s.hp, s.mind, s.sta, Math.min(s.streak, 1), s.bk, s.bf, s.bt, [...s.items].sort(), s.major, s.tempo, [...s.ready].sort(), s.flags.includes('teuk_intel'), s.flags.includes('kab_peace'), s.flags.includes('kib_peace')]);
      let exits = clashMemo.get(key);
      if (!exits) {
        const cs0 = enterClash({ ...s, fsu: 0, streak: Math.min(s.streak, 1) }, rid);
        const all = terminals(cs0, MODE);
        const st = (CLASH_STATS[rid] ||= { entries: 0, terminals: 0, decisiveReachable: 0, graceOnlyWithGrit: true, endsWithin: true });
        st.entries += 1;
        st.terminals += all.length;
        if (all.some((e) => e.outcome === 'decisive')) st.decisiveReachable += 1;
        if (all.some((e) => e.grace && !e.gritUsed)) st.graceOnlyWithGrit = false;
        exits = frontier(all, exitVec, (e) => `${e.grace}|${e.gritUsed}`);
        clashMemo.set(key, exits);
      }
      return exits.map((end) => {
        const x = clone(s);
        x.hp = end.hp; x.mind = end.mind; x.sta = end.sta;
        x.fsu = s.fsu + end.fsu; x.streak = end.streak;
        x.bk = end.bk; x.bf = end.bf; x.bt = end.bt;
        x.homesick = s.homesick + end.homesick;
        x.tempo = 0; x.ready = [];
        if (end.grace) { x.grace = true; if (!end.gritUsed && !x.grit) x.graceNoGrit = true; }
        if (end.gritUsed) x.grit = true;
        if (end.regroup) x.regroups += 1;
        x.path = s.path + ` [${rid}:${end.outcome}]`;
        return x;
      });
    },
  };
}

// --------------------------------------------------------------------------------------
// Acts. Node ids match the blueprint headings exactly (the runtime ledger cross-checks).
// --------------------------------------------------------------------------------------
const readyActs = ['seeds', 'guard', 'gear', 'button', 'whistle', 'ribbon'].map((it) => ({
  key: 'ready_' + it, group: 'ready', when: (s) => has(s, it), fx: (s) => { if (!s.ready.includes(it)) s.ready.push(it); },
}));

export const ACT1 = [
  story('A1-01'),
  story('A1-02'),
  choice('A1-03', [
    { key: 'major:rain', fx: (s) => { s.major = 'rain'; } },
    { key: 'major:wind', fx: (s) => { s.major = 'wind'; } },
    { key: 'major:eye', fx: (s) => { s.major = 'eye'; } },
  ]),
  story('A1-04', (s) => { s.hp = 5; s.mind = 4; s.sta = 5; }),
  story('A1-05'),
  obstacle('A1-06', {
    skills: ['rain', 'wind', 'eye'],
    friend: null,
    alone: { sta: 1 },
  }),
  story('A1-07'),
  clashNode('A1-08', 'R1'),
  story('A1-09'),
  camp('A1-10', 2, [
    { key: 'eat', fx: (s) => { s.hp = M(s.hp + 1); s.sta = M(s.sta + 1); } },
    { key: 'kab', fx: (s) => { if (!s.ready.includes('guard')) s.ready.push('guard'); } },
    { key: 'kib', fx: (s) => { if (!s.ready.includes('seeds')) s.ready.push('seeds'); } },
    { key: 'mother', fx: (s) => { s.mind = M(s.mind + 1); } },
  ]),
  story('A1-11', (s) => { s.items.push('seeds', 'guard'); }),
  ma('A1-12'),
  choice('A1-13', [
    { key: 'route:A', fx: (s) => { s.route = 'A'; } },
    { key: 'route:B', fx: (s) => { s.route = 'B'; } },
  ]),
];
// A1-13 also applies the Act 1 rest floor and opens Act 2 (see runAct).

const ACT2A = [
  obstacle('A2A-01', {
    skills: ['wind'],
    item: { id: 'guard' },
    alone: { sta: 1 },
    rush: {},
  }),
  story('A2A-02', (s) => { setFlag(s, 'met_pkam'); }),
  choice('A2A-03', [
    { key: 'eat', fx: (s) => { s.sta = M(s.sta + 1); } },
    { key: 'share', fx: (s) => { s.bk = B(s.bk + 1); } },
  ]),
  choice('A2A-04', [
    { key: 'listen', fx: (s) => { s.bk = B(s.bk + 1); } },
    { key: 'shirt', fx: (s) => { s.bk = B(s.bk + 1); } },
    { key: 'not_all', fx: (s) => { setFlag(s, 'kam_not_all'); } },
  ]),
  obstacle('A2A-05', {
    skills: ['wind', 'eye'],
    onSkill: (s) => { s.bk = B(s.bk + 1); },
    combo: { item: 'guard', ally: 'pkam', fx: (s) => { s.bk = B(s.bk + 2); } },
    alone: { sta: 2, fx: (s) => { s.bk = B(s.bk + 1); } },
    grit: (s) => { s.bk = B(s.bk + 1); },
  }),
  story('A2A-06', (s) => { s.items.push('gear'); setFlag(s, 'met_fiw'); }),
];

const ACT2B = [
  obstacle('A2B-01', {
    skills: ['eye'],
    item: { id: 'seeds' },
    alone: { sta: 1 },
    rush: {},
  }),
  story('A2B-02', (s) => { setFlag(s, 'met_fiw'); }),
  choice('A2B-03', [
    { key: 'count', fx: (s) => { s.bf = B(s.bf + 1); setFlag(s, 'fiw_count'); } },
    { key: 'shelter', fx: (s) => { s.bf = B(s.bf + 1); setFlag(s, 'fiw_warm'); } },
    { key: 'lead', fx: (s) => { setFlag(s, 'fiw_trusted'); } },
  ]),
  story('A2B-04'),
  obstacle('A2B-05', {
    skills: ['wind', 'rain'],
    onSkill: (s) => { s.bf = B(s.bf + 1); },
    combo: { item: 'seeds', ally: 'fiw', fx: (s) => { s.bf = B(s.bf + 2); } },
    alone: { sta: 1, fx: (s) => { s.bf = B(s.bf + 2); } },
    grit: (s) => { s.bf = B(s.bf + 1); },
  }),
  choice('A2B-06', [
    { key: 'push', when: (s) => s.sta >= 2, fx: (s) => { setFlag(s, 'met_pkam'); s.sta = M(s.sta - 1); s.bk = B(s.bk + 1); s.items.push('gear'); } },
    { key: 'let', fx: (s) => { setFlag(s, 'met_pkam'); s.items.push('gear'); } },
  ]),
];

const ACT2C = [
  camp('A2-07', 3, [
    { key: 'bugs', fx: (s) => { s.sta = M(s.sta + 2); } },
    { key: 'tend', fx: (s) => { s.hp = M(s.hp + 1); } },
    { key: 'kam', fx: (s) => { s.bk = B(s.bk + 1); } },
    { key: 'fiw', fx: (s) => { s.bf = B(s.bf + 1); } },
    { key: 'quiet', fx: (s) => { s.mind = M(s.mind + 1); } },
    ...readyActs,
  ]),
  story('A2-08', (s) => { s.mind = softDec(s.mind, 1); }),
  ma('A2-09'),
  clashNode('A2-10', 'R2'),
  story('A2-11', (s) => { s.items.push('button'); }),
  story('A2-12', (s) => { s.mind = M(s.mind + 1); floor(s, [2, 2, 2]); }),
];

export const ACT3 = [
  story('A3-01'),
  obstacle('A3-02', {
    skills: ['wind'],
    friend: { ally: 'pkam', fx: (s) => { s.bk = B(s.bk + 1); } },
    alone: { sta: 2, needSta: 4 },
    wait: {},
  }),
  obstacle('A3-03', {
    skills: ['eye'],
    item: { id: 'seeds' },
    friend: { ally: 'pkam', fx: (s) => { s.bk = B(s.bk + 1); setFlag(s, 'kam_saw_tears'); } },
    alone: { sta: 1 },
  }),
  story('A3-04', (s) => { if (flag(s, 'kam_saw_tears')) s.bk = B(s.bk + 1); }),
  story('A3-05'),
  story('A3-06', (s) => { setFlag(s, 'met_teuk'); }),
  obstacle('A3-07', {
    skills: ['eye'],
    onSkill: (s) => { s.bt = B(s.bt + 1); },
    combo: { item: 'seeds', ally: 'teuk', fx: (s) => { s.bt = B(s.bt + 2); } },
    friend: { ally: 'pkam', fx: (s) => { s.bk = B(s.bk + 1); s.bt = B(s.bt + 1); } },
    alone: { sta: 1, fx: (s) => { s.bt = B(s.bt + 1); } },
    grit: (s) => { s.bt = B(s.bt + 1); },
  }),
  ma('A3-08'),
  story('A3-09'),
  story('A3-10'),
  clashNode('A3-11', 'R3'),
  camp('A3-12', 3, [
    { key: 'splint', group: 'ankle', when: (s) => has(s, 'guard'), fx: (s) => { s.items = s.items.filter((i) => i !== 'guard'); setFlag(s, 'released_guard'); setFlag(s, 'teuk_splint'); s.bt = B(s.bt + 1); } },
    { key: 'cloth', group: 'ankle', fx: (s) => { s.bt = B(s.bt + 1); } },
    { key: 'teuk', fx: (s) => { s.bt = B(s.bt + 1); } },
    { key: 'kam', fx: (s) => { s.bk = B(s.bk + 1); } },
    { key: 'fiw', fx: (s) => { s.bf = B(s.bf + 1); } },
    { key: 'bugs', fx: (s) => { s.sta = M(s.sta + 2); } },
    { key: 'tend', fx: (s) => { s.hp = M(s.hp + 1); } },
    ...readyActs,
  ]),
  // Teuk shares the secrets of เปี๊ยก's room once the bond reaches 3 (applied after the camp).
  story('A3-13·intel', (s) => { if (s.bt >= 3) setFlag(s, 'teuk_intel'); }),
  pouch('A3-13', 'whistle', {
    seeds: (s) => setFlag(s, 'seeds_to_teuk'),
    guard: (s) => { setFlag(s, 'teuk_splint'); },
    gear: (s) => setFlag(s, 'gear_to_lantern'),
  }, (s) => { s.bt = B(s.bt + 1); }, () => {}),
  story('A3-14', (s) => { floor(s, [2, 2, 2]); }),
];

export const ACT4 = [
  story('A4-01', (s) => { if (flag(s, 'fiw_trusted')) s.bf = B(s.bf + 1); }),
  story('A4-02'),
  obstacle('A4-03', {
    skills: ['wind'],
    siblings: ['kab'],
    friend: { ally: 'fiw', fx: (s) => { s.bf = B(s.bf + 1); } },
    alone: { sta: 1 },
  }),
  story('A4-04', (s) => { s.mind = softDec(s.mind, 1); }),
  choice('A4-05', [
    { key: 'answer:roots', fx: (s) => setFlag(s, 'answer_roots') },
    { key: 'answer:self', fx: (s) => setFlag(s, 'answer_self') },
    { key: 'answer:friends', fx: (s) => setFlag(s, 'answer_friends') },
  ]),
  camp('A4-06', 3, [
    { key: 'kab', fx: (s) => setFlag(s, 'kab_peace') },
    { key: 'kib', fx: (s) => setFlag(s, 'kib_peace') },
    { key: 'kam', fx: (s) => { s.bk = B(s.bk + 1); } },
    { key: 'fiw', fx: (s) => { s.bf = B(s.bf + 1); } },
    { key: 'bugs', fx: (s) => { s.sta = M(s.sta + 2); } },
    { key: 'tend', fx: (s) => { s.hp = M(s.hp + 1); } },
    { key: 'quiet', fx: (s) => { s.mind = M(s.mind + 1); } },
    ...readyActs,
  ]),
  pouch('A4-07', 'ribbon', {
    seeds: (s) => setFlag(s, 'seeds_to_kib'),
    guard: (s) => setFlag(s, 'guard_to_kab'),
    gear: (s) => setFlag(s, 'gear_to_pkam'),
    whistle: (s) => setFlag(s, 'whistle_to_teuk'),
  }, (s) => { s.bf = B(s.bf + 1); }, () => {}),
  choice('A4-08', [
    { key: 'plan:A', fx: (s) => { s.plan = 'A'; if (flag(s, 'teuk_splint')) s.tempo = Math.min(2, s.tempo + 1); } },
    { key: 'plan:B', fx: (s) => { s.plan = 'B'; if (flag(s, 'teuk_splint')) s.tempo = Math.min(2, s.tempo + 1); } },
  ]),
  clashNode('A4-09', (s) => (s.plan === 'A' ? 'R4A' : 'R4B')),
  story('A4-10', (s) => { floor(s, [2, 2, 2]); }),
  story('A4-11'),
];

export const ACT5 = [
  story('A5-01'),
  obstacle('A5-02', {
    skills: ['rain', 'wind'],
    alone: { sta: 1 },
  }),
  ma('A5-03'),
  story('A5-04'),
  story('A5-05', (s) => { if (!has(s, 'ribbon') && !has(s, 'whistle')) s.mind = softDec(s.mind, 1); }),
  story('A5-06'),
  clashNode('A5-07', 'R5'),
  story('A5-08'),
  story('A5-09'),
  story('A5-10'),
];

// Ending predicates (ADR-P0-032 D5.4). The button is the mission core: it never counts
// as the "human promise" keepsake, so E-DAWN needs whistle or ribbon beside it.
export function endings(s) {
  const roots = has(s, 'seeds') || has(s, 'guard');
  const promise = has(s, 'whistle') || has(s, 'ribbon');
  const home = has(s, 'button') && (s.bt >= 2 || promise) && s.mind >= 2;
  const pondRaw = (s.fsu >= 2 || roots) && s.hp >= 2 && s.sta >= 2;
  const dawn = s.fsu >= 3 && s.sr >= 4 && s.mind >= 3 && s.sta >= 3
    && s.bk >= 2 && s.bf >= 2 && s.bt >= 2 && Math.max(s.bk, s.bf, s.bt) >= 3
    && roots && promise;
  const fallback = !pondRaw && !home && !dawn;
  return { home, pond: pondRaw || fallback, dawn, fallback };
}

// --------------------------------------------------------------------------------------
// Runner
// --------------------------------------------------------------------------------------
// Flags that change later rules. Story-only flags (who received a released keepsake, which
// words were said) choose script variants and are tracked by the blueprints, not here.
const MECH_FLAGS = new Set(['met_pkam', 'met_fiw', 'met_teuk', 'teuk_splint', 'teuk_intel', 'kab_peace', 'kib_peace', 'kam_saw_tears']);
const classKey = (s) => JSON.stringify([
  s.act, s.route, s.plan, s.major, [...s.items].sort(), [...s.ready].sort(),
  s.flags.filter((f) => MECH_FLAGS.has(f)).sort(), s.grit, s.grace, s.graceNoGrit,
]);
const stateVec = (s) => [s.hp, s.mind, s.sta, s.bk, s.bf, s.bt, Math.min(s.fsu, 3), Math.min(s.sr, 4), s.tempo, -Math.min(s.streak, 1), -Math.min(s.homesick, 3)];

const T0 = Date.now();
const NODE_LOG = [];
const ANOMALIES = [];

function runNodes(states, nodes, label) {
  for (const node of nodes) {
    const next = new Map();
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
          o.fx(x);
          if (o.key !== '·' && o.key !== 'tap') x.path = s.path + ` ${node.id}=${o.key}`;
          return x;
        });
      }
      for (const x of produced) {
        if (x.items.length > POUCH_CAP) ANOMALIES.push(`pouch>4 at ${node.id}: ${x.path}`);
        if (x.hp < 0 || x.mind < 0 || x.sta < 0) ANOMALIES.push(`negative meter at ${node.id}`);
        if (x.items.includes('button') && s.items.includes('button') === false && node.id !== 'A2-11') ANOMALIES.push(`button appeared outside A2-11 at ${node.id}`);
        if (s.items.includes('button') && !x.items.includes('button')) ANOMALIES.push(`button released at ${node.id}`);
        next.set(next.size, x);
      }
    }
    const pruned = frontier([...next.values()], stateVec, classKey);
    next.clear();
    pruned.forEach((x, i) => next.set(i, x));
    NODE_LOG.push({ act: label, id: node.id, type: node.type, states: next.size, deadEnds });
    if (process.env.JK_PROGRESS) process.stderr.write(`${label} ${node.id} ${node.type} → ${next.size} (${((Date.now() - T0) / 1000).toFixed(1)}s)\n`);
    if (deadEnds) ANOMALIES.push(`dead end at ${node.id} (${deadEnds} states)`);
    states = [...next.values()];
  }
  return states;
}

const nextAct = (states, act, extra) => states.map((s) => { const x = clone(s); x.act = act; x.streak = 0; extra?.(x); return x; });
const env = (states) => {
  const r = (k) => [Math.min(...states.map((s) => s[k])), Math.max(...states.map((s) => s[k]))].join('–');
  return `กาย ${r('hp')} · ใจ ${r('mind')} · แรง ${r('sta')} · สายใยก้าม ${r('bk')} · ฟิ้ว ${r('bf')} · เตื๊อก ${r('bt')} · fsu ${r('fsu')} · sr ${r('sr')}`;
};

export function runModel() {
  const report = { acts: {}, checks: [] };
  let s1 = runNodes([start()], ACT1, 'Act 1');
  // Act 1 rest floor (departure): กาย 4 · ใจ 3 · แรง 4.
  s1 = s1.map((s) => { const x = clone(s); floor(x, [4, 3, 4]); return x; });
  report.acts.act1 = { states: s1.length, env: env(s1), graceAct1: s1.filter((s) => s.grace).length };

  let s2in = nextAct(s1, 2);
  const s2a = runNodes(s2in.filter((s) => s.route === 'A'), [...ACT2A, ...ACT2C], 'Act 2A');
  const s2b = runNodes(s2in.filter((s) => s.route === 'B'), [...ACT2B, ...ACT2C], 'Act 2B');
  let s2 = [...s2a, ...s2b];
  report.acts.act2 = { states: s2.length, env: env(s2), A: env(s2a), B: env(s2b) };

  let s3 = runNodes(nextAct(s2, 3), ACT3, 'Act 3');
  report.acts.act3 = { states: s3.length, env: env(s3) };
  let s4 = runNodes(nextAct(s3, 4), ACT4, 'Act 4');
  report.acts.act4 = { states: s4.length, env: env(s4) };
  let s5 = runNodes(nextAct(s4, 5), ACT5, 'Act 5');
  report.acts.act5 = { states: s5.length, env: env(s5) };
  return { report, s1, s2, s3, s4, s5 };
}

// --------------------------------------------------------------------------------------
// Strategy probes: one whole playthrough each, decided by a fixed policy. These show in
// plain terms what a style of play can reach (the enumeration above proves the limits).
// --------------------------------------------------------------------------------------
const PREF = {
  family: ['skill:', 'sibling:', 'combo:', 'friend:', 'item:', 'alone', 'wait', 'rush', 'grit'],
  never: ['combo:', 'friend:', 'item:', 'alone', 'wait', 'rush', 'grit'],
  alone: ['alone', 'rush', 'combo:', 'friend:', 'item:', 'skill:', 'wait', 'grit'],
  lonely: ['alone', 'rush', 'item:', 'skill:', 'wait', 'grit'],
  grit: ['grit'],
};
function pickObstacle(opts, s, style, override) {
  let order = PREF[style] || PREF.family;
  if (style === 'balanced') order = s.streak >= 1 ? ['combo:', 'friend:', 'item:', 'alone', 'rush', 'wait', 'grit'] : ['skill:', 'combo:', 'friend:', 'item:', 'alone', 'wait', 'grit'];
  if (override) order = [override, ...order];
  for (const pre of order) { const o = opts.find((x) => x.key.startsWith(pre)); if (o) return o; }
  return opts[opts.length - 1];
}
const CAMP_PREF = {
  bond: ['teuk', 'kam', 'fiw', 'cloth', 'kab', 'kib', 'mother', 'quiet', 'bugs', 'tend', 'eat'],
  rest: ['bugs', 'tend', 'eat', 'quiet', 'mother', 'kab', 'kib'],
  talk: ['kam', 'fiw', 'teuk', 'cloth', 'kab', 'kib', 'mother'],
};
function pickCamp(opts, style, s) {
  // A sensible player eats when tired, whatever else they came to the camp for.
  const want = style === 'bond' && s.sta <= 3 ? ['bugs', ...CAMP_PREF.bond] : CAMP_PREF[style];
  let best = opts[0]; let bestScore = -Infinity;
  for (const o of opts) {
    const parts = o.key.replace('camp:', '').split('+');
    const score = parts.reduce((a, p) => a + (want.includes(p) ? 20 - want.indexOf(p) : p.startsWith('ready_') ? 0 : -30), 0);
    if (score > bestScore) { bestScore = score; best = o; }
  }
  return best;
}
const FAMILY_ACTS = ['rain', 'wind', 'eye', 's_kab', 's_kib'];
const TEUK_ACTS = ['a_teuk', 'button_teuk', 'whistle_teuk'];
const familyFirst = (cs) => FAMILY_ACTS.find((a) => listActions(cs).includes(a)) || smart(cs);
function smartAmong(cs, allowed) {
  let best = allowed[0]; let bestScore = -Infinity;
  for (const id of allowed) {
    const nx = step(cs, id);
    let sc = nx.P * 3 + nx.hp + nx.mind + nx.sta * 0.5 - nx.homesick * 2;
    if (nx.ended) sc += nx.outcome === 'decisive' ? 40 : nx.outcome === 'hold' ? 10 : -10;
    if (sc > bestScore) { bestScore = sc; best = id; }
  }
  return best;
}
const noFamily = (cs) => smartAmong(cs, listActions(cs).filter((a) => !FAMILY_ACTS.includes(a)));
const smartNoTeuk = (cs) => smartAmong(cs, listActions(cs).filter((a) => !TEUK_ACTS.includes(a)));
const noFamilyNoTeuk = (cs) => smartAmong(cs, listActions(cs).filter((a) => !FAMILY_ACTS.includes(a) && !TEUK_ACTS.includes(a)));
const lonely = (cs) => smartAmong(cs, listActions(cs).filter((a) => !['assist', 'combo'].includes(ACTIONS_KIND[a])));
const CLASH_POLICY = { smart, mash, familyFirst, noFamily, smartNoTeuk, noFamilyNoTeuk, lonely };

export function probe({ name, major = 'wind', route = 'A', plan = 'A', obstacle = 'balanced', campStyle = 'bond', clash = 'smart', whistle = 'take(release gear)', ribbon = 'take(release seeds)', overrides = {}, noSkills = false }) {
  let s = start();
  const snaps = {};
  const run = (nodes) => {
    for (const node of nodes) {
      if (node.type === 'clash') {
        const rid = node.id === 'A4-09' ? (s.plan === 'A' ? 'R4A' : 'R4B') : { 'A1-08': 'R1', 'A2-10': 'R2', 'A3-11': 'R3', 'A5-07': 'R5' }[node.id];
        const cs = playStrategy(enterClash({ ...s, fsu: 0 }, rid), CLASH_POLICY[clash]);
        s.hp = cs.hp; s.mind = cs.mind; s.sta = cs.sta; s.fsu += cs.fsu; s.streak = cs.streak;
        s.bk = cs.bk; s.bf = cs.bf; s.bt = cs.bt; s.homesick += cs.homesick; s.tempo = 0; s.ready = [];
        if (cs.gritUsed) s.grit = true;
        if (cs.grace) s.grace = true;
        s.path += ` [${rid}:${cs.outcome}]`;
        continue;
      }
      const opts = node.options(s);
      let o;
      if (node.type === 'obstacle') o = pickObstacle(noSkills ? opts.filter((x) => !x.key.startsWith('skill:') && !x.key.startsWith('sibling:')) : opts, s, obstacle, overrides[node.id]);
      else if (node.type === 'camp') o = pickCamp(opts, campStyle, s);
      else if (node.type === 'pouch') o = opts.find((x) => x.key === (node.id === 'A3-13' ? whistle : ribbon)) || opts.find((x) => x.key === 'take') || opts[opts.length - 1];
      else if (overrides[node.id]) o = opts.find((x) => x.key.startsWith(overrides[node.id])) || opts[0];
      else if (node.id === 'A1-03') o = opts.find((x) => x.key === 'major:' + major);
      else if (node.id === 'A1-13') o = opts.find((x) => x.key === 'route:' + route);
      else if (node.id === 'A4-08') o = opts.find((x) => x.key === 'plan:' + plan);
      else o = opts[0];
      const x = clone(s); o.fx(x); x.path = s.path + ` ${node.id}=${o.key}`; s = x;
    }
  };
  const snap = (k) => { snaps[k] = `กาย ${s.hp} ใจ ${s.mind} แรง ${s.sta}`; };
  run(ACT1); floor(s, [4, 3, 4]); snap('Act 1'); s.act = 2; s.streak = 0;
  run(route === 'A' ? [...ACT2A, ...ACT2C] : [...ACT2B, ...ACT2C]); snap('Act 2');
  s.act = 3; s.streak = 0; run(ACT3); snap('Act 3');
  s.act = 4; s.streak = 0; run(ACT4); snap('Act 4');
  s.act = 5; s.streak = 0; run(ACT5);
  return { name, s, e: endings(s), snaps };
}

// The first probe is a witness that reaches E-DAWN. Each later probe changes exactly one
// habit of that run, which shows that every ingredient of E-DAWN is really needed.
export const PROBES = [
  { id: 'dawn', name: 'ต้นแบบ: สลับทักษะครอบครัวกับการยืนหยัดเอง · คุยกับเพื่อนที่แคมป์ · อ่านเจตนาศัตรู (สาย A · แผน A)', obstacle: 'alone' },
  { id: 'dawnBB', name: 'ต้นแบบ · สาย B · แผน B · วิชาเอกตั้งสติฟังฝน', obstacle: 'alone', route: 'B', plan: 'B', major: 'rain' },
  { id: 'dawnAB', name: 'ต้นแบบ · สาย A · แผน B · วิชาเอกตาส่องเงามืด', obstacle: 'alone', route: 'A', plan: 'B', major: 'eye' },
  { id: 'dawnBA', name: 'ต้นแบบ · สาย B · แผน A', obstacle: 'alone', route: 'B', plan: 'A' },
  { id: 'spam', name: 'ต่างจากต้นแบบข้อเดียว: พึ่งทักษะครอบครัวทุกด่านและทุกเทิร์น', obstacle: 'family', clash: 'familyFirst' },
  { id: 'never', name: 'ต่างจากต้นแบบข้อเดียว: ไม่ใช้ทักษะครอบครัวเลย', obstacle: 'alone', clash: 'noFamily', overrides: {} , noSkills: true },
  { id: 'leaning', name: 'ต่างจากต้นแบบข้อเดียว: แทบไม่ยืนหยัดเอง (ให้เพื่อนกับไอเทมช่วยแทน)', obstacle: 'balanced' },
  { id: 'lonely', name: 'ต่างจากต้นแบบข้อเดียว: เดินทางคนเดียว ไม่คุย ไม่ใช้ท่าผสาน ไม่เรียกเพื่อน', obstacle: 'lonely', campStyle: 'rest', clash: 'lonely' },
  { id: 'mash', name: 'ต่างจากต้นแบบข้อเดียว: ในศึกกดรุกอย่างเดียว ไม่อ่านเจตนา', obstacle: 'alone', clash: 'mash' },
  { id: 'noRoots', name: 'ต่างจากต้นแบบข้อเดียว: สละเมล็ดต้อยติ่งและสนับข้อมือ (ไม่เหลือของจากบ้าน)', obstacle: 'alone', whistle: 'take(release seeds)', ribbon: 'take(release guard)' },
  { id: 'noPromise', name: 'ต่างจากต้นแบบข้อเดียว: ปฏิเสธนกหวีดและริบบิ้น (ไม่เหลือของแทนคำสัญญา)', obstacle: 'alone', whistle: 'refuse', ribbon: 'refuse' },
  { id: 'homeOnly', name: 'เส้นทางที่เปิด E-HOME แต่ปิด E-POND: ไม่ใช้ทักษะครอบครัว · สละของจากบ้านทั้งสองชิ้น', obstacle: 'never', clash: 'noFamily', whistle: 'take(release seeds)', ribbon: 'take(release guard)' },
  { id: 'pondOnly', name: 'เส้นทางที่เปิด E-POND แต่ปิด E-HOME: ไม่สนิทกับเตื๊อก · ปฏิเสธนกหวีดและริบบิ้น', obstacle: 'balanced', clash: 'smartNoTeuk', campStyle: 'rest', whistle: 'refuse', ribbon: 'refuse', overrides: { 'A3-07': 'skill:' } },
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

  const ends = s5.map((s) => ({ s, e: endings(s) }));
  const some = (f) => ends.some(f);
  say('');
  say('ข้อพิสูจน์โครงสร้าง:');
  check('ไม่มีทางตันในทุกโหนด (ทุกสถานะมีตัวเลือกอย่างน้อย 1 ทาง)', !ANOMALIES.some((a) => a.startsWith('dead end')), ANOMALIES.filter((a) => a.startsWith('dead end')).slice(0, 3).join('; '));
  check('กระเป๋าไม่เกิน 4 ช่องตลอดเกม', !ANOMALIES.some((a) => a.startsWith('pouch')));
  check('ค่าสถานะไม่ติดลบ', !ANOMALIES.some((a) => a.startsWith('negative')));
  check('กระดุมทองเหลือง ต.♡ป. ไม่เคยถูกสละหลังได้คืน และอยู่ในกระเป๋าทุกเส้นทางเมื่อเข้า Act 5', !ANOMALIES.some((a) => a.startsWith('button')) && s4.every((s) => s.items.includes('button')));
  check('ปลาย Act 4 ทุกค่า ≥ 2 (Rest Floor)', s4.every((s) => s.hp >= 2 && s.mind >= 2 && s.sta >= 2));
  check('Grace เกิดเฉพาะเส้นทางที่เคยฝืนเอา', ends.every((x) => !x.s.graceNoGrit) && Object.values(CLASH_STATS).every((c) => c.graceOnlyWithGrit));
  check('ทุกสถานะปลายทางมีฉากจบให้เลือกอย่างน้อย 1 ทาง', ends.every((x) => x.e.home || x.e.pond || x.e.dawn));
  for (const [rid, c] of Object.entries(CLASH_STATS)) {
    check(`ศึก ${rid}: ทุกจุดเข้าศึกมีทางชนะขาด`, c.decisiveReachable === c.entries, `${c.decisiveReachable}/${c.entries} จุดเข้าศึก`);
  }

  const pairs = [['A', 'A'], ['A', 'B'], ['B', 'A'], ['B', 'B']];
  say('');
  say('สิ่งที่ไปถึงได้ (ทุกข้อมีเส้นทางพยานจริง):');
  for (const [r, p] of pairs) {
    const sub = ends.filter((x) => x.s.route === r && x.s.plan === p);
    check(`สาย ${r} × แผน ${p}: เปิด E-HOME · E-POND · E-DAWN ได้ครบ`, sub.some((x) => x.e.home) && sub.some((x) => x.e.pond && !x.e.fallback) && sub.some((x) => x.e.dawn));
  }
  check('E-DAWN ไปถึงได้โดยไม่เคยฝืนเอา', some((x) => x.e.dawn && !x.s.grit));
  check('E-DAWN ไปถึงได้โดยไม่เคยเกิดอาการโหยหาบ้าน', some((x) => x.e.dawn && x.s.homesick === 0));
  check('ทุกวิชาเอกจาก Act 1 ไปถึง E-DAWN ได้', ['rain', 'wind', 'eye'].every((m) => some((x) => x.s.major === m && x.e.dawn)));

  say('');
  say('ผลการเล่นจำลองตามสไตล์ (หนึ่งเส้นทางต่อสไตล์):');
  const R = {};
  for (const pr of PROBES) {
    const r = probe(pr);
    R[pr.id] = r;
    const open = ['home', 'pond', 'dawn'].filter((k) => r.e[k]).map((k) => 'E-' + k.toUpperCase()).join(' · ') || '—';
    say(`  ${r.name}`);
    say(`    เปิด: ${open}${r.e.fallback ? ' (ผ่าน Safety Fallback)' : ''} · กาย ${r.s.hp} ใจ ${r.s.mind} แรง ${r.s.sta} · ก้าม ${r.s.bk} ฟิ้ว ${r.s.bf} เตื๊อก ${r.s.bt} · fsu ${r.s.fsu} · sr ${r.s.sr} · โหยหาบ้าน ${r.s.homesick} · ของ ${r.s.items.join(',')}`);
    if (pr.id === 'pessimist' || pr.id === 'spam') say(`    ค่าปลายองก์: ${Object.entries(r.snaps).map(([k, v]) => `${k} ${v}`).join(' · ')}`);
    if (process.argv.includes('--examples')) say(`    ${r.s.path}`);
  }
  say('');
  say('ข้อพิสูจน์จากการเล่นจำลอง:');
  check('ต้นแบบไปถึง E-DAWN ได้ทั้ง 4 คู่สาย × แผน', ['dawn', 'dawnBB', 'dawnAB', 'dawnBA'].every((k) => R[k].e.dawn));
  check('พึ่งทักษะครอบครัวทุกครั้งไปไม่ถึง E-DAWN (อาการโหยหาบ้านกินใจและแรง)', !R.spam.e.dawn);
  check('ไม่ใช้ทักษะครอบครัวเลยไปไม่ถึง E-DAWN (fsu < 3)', !R.never.e.dawn && R.never.s.fsu < 3);
  check('แทบไม่ยืนหยัดเองไปไม่ถึง E-DAWN (selfReliance < 4)', !R.leaning.e.dawn && R.leaning.s.sr < 4);
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
