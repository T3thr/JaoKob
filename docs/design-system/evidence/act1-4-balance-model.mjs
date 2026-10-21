// JaoKob Act 1–4 balance model (design evidence for ADR-P0-031; not production code).
// Usage:  node docs/design-system/evidence/act1-4-balance-model.mjs [--grace-detail]
// Enumerates every metric-relevant choice in Acts 1–4, applies clamps, rest floors,
// courage gates and Grace Beats, then reports the end-of-act envelope of HP / ใจ / STA / Bond
// and checks the fairness invariants of ADR-P0-031 §D4. Exit code 1 if any invariant fails.
// Every number here mirrors the node tables in docs/design-system/act1..act4 blueprints.

const clamp = (v) => Math.max(0, Math.min(100, v));
const GRACE_FLOOR = { hp: 25, mind: 30, sta: 30 };

function start() {
  return {
    hp: 80, mind: 70, sta: 100, bs: 0, br: 0, cling: 0, resil: 0, seeds: 0,
    triad: null, route: null, road: null, items: [], flags: [], grace: [], path: [],
  };
}
const clone = (s) => ({ ...s, items: [...s.items], flags: [...s.flags], grace: [...s.grace], path: [...s.path] });
const has = (s, x) => s.items.includes(x);
const flag = (s, f) => s.flags.includes(f);
// add(): additive deltas; keys ending in "Min" raise a metric to at least that floor (rest).
function add(s, d) {
  for (const [k, v] of Object.entries(d)) {
    if (k.endsWith('Min')) { const m = k.slice(0, -3); s[m] = Math.max(s[m], v); continue; }
    if (k === 'cling' || k === 'resil' || k === 'seeds') s[k] = Math.max(0, s[k] + v);
    else s[k] = clamp(s[k] + v);
  }
}
const setFlag = (s, f) => { if (!flag(s, f)) s.flags.push(f); };
const take = (s, item) => { if (!has(s, item)) s.items.push(item); };
const drop = (s, item) => { s.items = s.items.filter((x) => x !== item); };
function graceCheck(s, act, stepId) {
  if (s.hp <= 0 || s.mind <= 0 || s.sta <= 0) {
    s.hp = Math.max(s.hp, GRACE_FLOOR.hp);
    s.mind = Math.max(s.mind, GRACE_FLOOR.mind);
    s.sta = Math.max(s.sta, GRACE_FLOOR.sta);
    s.grace.push(`${act}@${stepId}`);
  }
}

// Option helpers --------------------------------------------------------------
const opt = (key, fx, req = () => true) => ({ key, fx, req });
const only = (fx) => [opt('auto', fx)];
const SEEDED = (s) => has(s, 'item_lotus_pod') && s.seeds > 0;
// Memory Willpower is offered when ใจ ≤ 50 (ADR-028 D4); "ยืนหยัดเอง" is its pair.
const willpowerOpts = (base = () => {}) => [
  opt('willpower', (s) => { base(s); add(s, { mind: 15, cling: 1 }); }, (s) => s.mind <= 50),
  opt('stand-alone', (s) => { base(s); add(s, { sta: -10, mind: 10, resil: 1 }); }, (s) => s.mind <= 50),
];
// Courage gate: free when ใจ ≥ 30, otherwise one key must be spent (never a lock).
function courageGate(s) {
  if (s.mind >= 30) return [opt('gate-pass', () => {})];
  return [
    opt('gate-breath', (x) => add(x, { mind: 5 }), (x) => x.triad === 'mother'),
    opt('gate-friend', (x) => add(x, { mind: 10 }), (x) => Math.max(x.bs, x.br) >= 30 && x.flags.includes('a4.friends_back')),
    opt('gate-willpower', (x) => add(x, { mind: 15, cling: 1 })),
    opt('gate-stand', (x) => add(x, { sta: -10, mind: 10, resil: 1 })),
  ];
}

// ACT 1 · บ้านที่นับเราเป็นหนึ่งในนั้น --------------------------------------------
const ITEMS1 = ['item_reed_whistle', 'item_dewdrop_stone', 'item_lotus_pod'];
const SHORT = { item_reed_whistle: 'whistle', item_dewdrop_stone: 'stone', item_lotus_pod: 'pod' };
const carrySets = [[], ...ITEMS1.map((i) => [i]),
  [ITEMS1[0], ITEMS1[1]], [ITEMS1[0], ITEMS1[2]], [ITEMS1[1], ITEMS1[2]]];

const ACT1 = [
  { id: 'A1-03', options: () => ['father', 'mother', 'siblings'].map((t) => opt(`triad-${t}`, (s) => { s.triad = t; })) },
  { id: 'A1-04', options: () => only((s) => add(s, { mind: 5 })) },
  { id: 'A1-06', options: () => only((s) => { s.seeds = 3; }) },
  { id: 'A1-08', options: () => only((s) => add(s, { mind: 5 })) },
  { id: 'A1-10', options: () => only((s) => add(s, { mind: 5 })) },
  { id: 'A1-13', options: () => only((s) => add(s, { sta: -5 })) },
  { id: 'A1-14', options: () => carrySets.map((set) => opt(`carry-${set.length ? set.map((i) => SHORT[i]).join('+') : 'none'}`, (s) => {
    set.forEach((i) => take(s, i));
    ITEMS1.filter((i) => !set.includes(i)).forEach((i) => setFlag(s, `a1.left_at_nest.${SHORT[i]}`));
    if (!set.includes('item_lotus_pod')) s.seeds = 0;
  })) },
  { id: 'A1-15', options: () => only((s) => add(s, { sta: -20, mind: -10 })) },
  { id: 'A1-16', options: () => only((s) => add(s, {
    hp: has(s, 'item_lotus_pod') ? -15 : -20,
    sta: -35,
    mind: has(s, 'item_dewdrop_stone') ? -15 : -20,
  })) },
  { id: 'A1-17', options: () => only((s) => { add(s, { hp: -15, mind: -20 }); setFlag(s, 'family.bond_thread.frozen'); }) },
  { id: 'A1-18', options: () => [
    opt('eat-left-food', (s) => add(s, { hp: 10, mind: 5, sta: 10 })),
    opt('hunt', (s) => add(s, { hp: 10, mind: 5, sta: s.triad === 'father' ? 10 : 0 })),
    opt('save-snack', (s) => { add(s, { hp: 5, sta: 5, mind: 5 }); setFlag(s, 'a1.saved_snack'); }),
  ] },
  { id: 'A1-19', options: () => [
    opt('count-or-touch', (s) => add(s, { mind: 5 })),
    opt('wring-shirt', (s) => add(s, { sta: -5, hp: 5 })),
    ...willpowerOpts(),
  ] },
  { id: 'A1-20', options: () => only((s) => add(s, { mind: -5, staMin: 55 })) },
  { id: 'A1-21', options: () => [
    opt('follow-water', (s) => add(s, { resil: 1 })),
    opt('look-back', (s) => add(s, { cling: 1 })),
  ] },
];

// ACT 2 · สองป่า หนึ่งคำลา ------------------------------------------------------
const ACT2_OPEN = [
  { id: 'A2-01', options: () => [
    opt('walk-slow', (s) => add(s, { sta: -5 })),
    opt('jump-branch', (s) => add(s, { sta: -10, mind: 5 })),
    opt('listen-wind', () => {}),
  ] },
  { id: 'A2-02', options: () => [opt('blocked', (s) => add(s, { mind: -5 })), ...willpowerOpts((s) => add(s, { mind: -5 }))] },
  { id: 'A2-03', options: () => [opt('route-A', (s) => { s.route = 'A'; }), opt('route-B', (s) => { s.route = 'B'; })] },
];
const ROUTE_A = [
  { id: 'A2-A1', options: () => [
    opt('greet', (s) => { s.bs = 20; add(s, { mind: 5 }); }),
    opt('whistle', (s) => { s.bs = 25; add(s, { mind: 5 }); setFlag(s, 'whistle.sparrow_promise'); }, (s) => has(s, 'item_reed_whistle')),
    opt('share-snack', (s) => { s.bs = 25; add(s, { mind: 5 }); setFlag(s, 'a2.snack_clue'); }, (s) => flag(s, 'a1.saved_snack')),
  ] },
  { id: 'A2-A2', options: () => only((s) => add(s, { hp: 10, sta: s.triad === 'father' ? 0 : -5, bs: 10 })) },
  { id: 'A2-A3', options: () => only((s) => add(s, { mind: -10 })) },
  { id: 'A2-A3g', gate: true },
  { id: 'A2-A4', options: () => [
    opt('hunter-knot', (s) => add(s, { sta: -5, bs: 15 }), (s) => s.triad === 'father'),
    opt('calm-breath', (s) => add(s, { sta: -10, bs: 15 }), (s) => s.triad === 'mother'),
    opt('keen-shell', (s) => add(s, { sta: -10, bs: 15 }), (s) => s.triad === 'siblings'),
    opt('stone-glint', (s) => add(s, { sta: -5, bs: 15 }), (s) => has(s, 'item_dewdrop_stone')),
    opt('whistle-egret', (s) => add(s, { sta: -10, bs: 15 }), (s) => has(s, 'item_reed_whistle')),
    opt('pod-rattle-calm', (s) => add(s, { sta: -10, bs: 15 }), SEEDED),
    opt('grit-bare-hands', (s) => { add(s, { hp: -5, sta: -15, bs: 15 }); setFlag(s, 'sparrow.wing_scraped'); }),
  ] },
  { id: 'A2-A5', options: () => [
    opt('check-wing', (s) => add(s, { mind: 10, bs: 5 })),
    opt('share-seed', (s) => add(s, { mind: 10, bs: 5, seeds: -1 }), SEEDED),
    opt('sit-quiet', (s) => add(s, { mind: 10, bs: 5 })),
  ] },
  { id: 'A2-A6', options: () => only((s) => add(s, { mind: 5 })) },
  { id: 'A2-A7', options: () => only((s) => add(s, { hp: 10, sta: 20, mind: 5, bs: 5 })) },
];
const ROUTE_B = [
  { id: 'A2-B1', options: () => [
    opt('breath-dark', (x) => add(x, { sta: -5, mind: -5 }), (x) => x.triad === 'mother'),
    opt('stone-light', (x) => add(x, { sta: -5 }), (x) => has(x, 'item_dewdrop_stone')),
    opt('whistle-echo', (x) => add(x, { sta: -5 }), (x) => has(x, 'item_reed_whistle')),
    opt('grit-dark', (x) => add(x, { sta: -5, mind: -10 })),
  ] },
  { id: 'A2-B1g', gate: true },
  { id: 'A2-B2', options: () => [
    opt('revive', (s) => { s.br = 25; add(s, { mind: 5 }); }),
    opt('share-snack', (s) => { s.br = 25; add(s, { mind: 5 }); setFlag(s, 'a2.snack_clue'); }, (s) => flag(s, 'a1.saved_snack')),
    opt('whistle', (s) => { s.br = 25; add(s, { mind: 5 }); setFlag(s, 'whistle.rat_promise'); }, (s) => has(s, 'item_reed_whistle')),
  ] },
  { id: 'A2-B4', options: () => only((s) => add(s, { mind: s.triad === 'mother' ? -7 : -15 })) },
  { id: 'A2-B5', options: () => only((s) => { add(s, { br: 10, resil: 1 }); setFlag(s, 'a2.stood_guard'); }) },
  { id: 'A2-B6', options: () => [
    opt('rat-route', (s) => add(s, { sta: -5 }), (s) => s.br >= 30),
    opt('keen-flicker', (s) => add(s, { sta: -5 }), (s) => s.triad === 'siblings'),
    opt('shadow-leap', (s) => add(s, { sta: -15 })),
    opt('stone-beam', () => {}, (s) => has(s, 'item_dewdrop_stone')),
    opt('whistle-startle', (s) => add(s, { sta: -5 }), (s) => has(s, 'item_reed_whistle')),
    opt('pod-rattle', (s) => add(s, { sta: -5 }), SEEDED),
    opt('grit-push', (s) => add(s, { sta: -15 })),
  ] },
  { id: 'A2-B7', options: () => only((s) => add(s, { mind: 5 })) },
  { id: 'A2-B9', options: () => [
    opt('share-seed', (s) => { add(s, { seeds: -1, mind: 10, br: 10 }); setFlag(s, 'boss.reformed_beacon'); }, SEEDED),
    opt('show-or-sit', (s) => { add(s, { mind: 10, br: 10 }); setFlag(s, 'boss.reformed_beacon'); }),
    opt('chase-away', (s) => add(s, { mind: -5, sta: -5, br: 5 })),
  ] },
  { id: 'A2-B11', options: () => only((s) => add(s, { mind: 5 })) },
  { id: 'A2-B12', options: () => [
    opt('drink-rest', (s) => add(s, { hp: 20, sta: 20, mind: 5, br: 5 })),
    opt('wash-shirt-rest', (s) => add(s, { hp: 15, sta: 25, mind: 5, br: 5 })),
  ] },
];
const ACT2_CLOSE = [
  { id: 'A2-08', options: () => only((s) => { if (s.route === 'A') s.br = 20; else s.bs = 20; }) },
  { id: 'A2-09', options: () => only((s) => add(s, { mind: 15, mindMin: 55, bs: 10, br: 10, staMin: 70, hpMin: 65 })) },
  { id: 'A2-10', options: () => [
    opt('look-back', (s) => add(s, { mind: -10, cling: 1 })),
    opt('look-ahead', (s) => add(s, { mind: -10, resil: 1 })),
  ] },
];

// ACT 3 · เมืองที่ไม่มีใครนับเรา ---------------------------------------------------
const ACT3 = [
  { id: 'A3-01', options: () => only((s) => add(s, { mind: -5 })) },
  { id: 'A3-02', options: () => only((s) => add(s, { mind: -5, hp: -5, sta: s.triad === 'siblings' ? 0 : -5 })) },
  { id: 'A3-03', options: () => [
    opt('breath-steady', (s) => add(s, { sta: -5 }), (s) => s.triad === 'mother'),
    opt('whistle-kids', (s) => add(s, { sta: -5, mind: -5 }), (s) => has(s, 'item_reed_whistle')),
    opt('keen-gap', (s) => add(s, { sta: -5, mind: -5 }), (s) => s.triad === 'siblings'),
    opt('grit-run', (s) => add(s, { sta: -10, mind: -10, hp: -5 })),
  ] },
  { id: 'A3-04', options: () => [
    opt('sit-beside', (s) => add(s, { mind: -10 })),
    opt('get-up-now', (s) => add(s, { mind: -10, sta: -5, resil: 1 })),
    opt('willpower-beside', (s) => add(s, { mind: 5, cling: 1 }), (s) => s.mind - 10 <= 50),
  ] },
  { id: 'A3-05', options: () => only((s) => add(s, { mind: 5 })) },
  { id: 'A3-06', options: () => only((s) => { add(s, { mind: 15, sta: 10, hpMin: 75 }); take(s, 'item_red_yarn'); }) },
  { id: 'A3-08', options: () => [
    opt('keen-or-whistle', (s) => add(s, { sta: -5 }), (s) => s.triad === 'siblings' || has(s, 'item_reed_whistle')),
    opt('grit-run', (s) => add(s, { sta: -10 })),
  ] },
  { id: 'A3-11', options: () => [
    opt('accept-marble', (s) => { add(s, { mind: 10 }); take(s, 'item_glass_marble'); }, (s) => s.items.length < 4),
    opt('trade-seed', (s) => { add(s, { mind: 10, seeds: -1 }); take(s, 'item_glass_marble'); setFlag(s, 'a3.seed_to_kid'); }, (s) => s.items.length < 4 && SEEDED(s)),
    opt('decline-marble', (s) => { add(s, { mind: 10 }); setFlag(s, 'refused_glass_marble'); }),
  ] },
  { id: 'A3-12', options: () => only((s) => add(s, { mind: 10 })) },
  { id: 'A3-13', options: () => only((s) => add(s, { mind: 5 })) },
  { id: 'A3-14', options: () => [
    opt('half-for-unseen', (s) => { add(s, { mind: -5, hp: 5, bs: 5, br: 5 }); setFlag(s, 'a3.left_food_for_unseen'); }),
    opt('eat-all', (s) => add(s, { mind: -5, hp: 10 })),
  ] },
  { id: 'A3-15', options: () => [
    opt('bus-with-teuk', (s) => { add(s, { staMin: 70 }); setFlag(s, 'a3.bus_with_teuk'); }),
    opt('walk-alone', (s) => add(s, { hp: -5, staMin: 55, resil: 1 })),
  ] },
];

// ACT 4 · เขาวงกตหลังโรงช่างไม้ ----------------------------------------------------
function rescueTier(s) {
  const best = Math.max(s.bs, s.br);
  let tier = best >= 60 ? 2 : best >= 30 ? 1 : 0;
  if (flag(s, 'a4.whistle_blown')) tier = Math.min(2, tier + 1);
  return tier; // 2 ทันที · 1 ช้าไปหนึ่งจังหวะ · 0 เอาตัวรอดเอง
}
const ACT4 = [
  { id: 'A4-01g', gate: true },
  { id: 'A4-01', options: () => [
    opt('whistle-cat', (s) => add(s, { sta: -5, mind: -10 }), (s) => has(s, 'item_reed_whistle')),
    opt('stone-flash', (s) => add(s, { sta: -5, mind: -10 }), (s) => has(s, 'item_dewdrop_stone')),
    opt('keen-gap', (s) => add(s, { sta: -10, mind: -10 }), (s) => s.triad === 'siblings'),
    opt('grit-run', (s) => add(s, { sta: -20, mind: -10 })),
  ] },
  { id: 'A4-02', options: () => [
    opt('keen-stack', (s) => add(s, { hp: -5 }), (s) => s.triad === 'siblings'),
    opt('marble-level', (s) => add(s, { hp: -5 }), (s) => has(s, 'item_glass_marble')),
    opt('hunter-wait', (s) => add(s, { hp: -5, sta: -5 }), (s) => s.triad === 'father'),
    opt('grit-climb', (s) => add(s, { hp: -15, sta: -10 })),
  ] },
  { id: 'A4-03', options: () => {
    const fall = { hp: -10, mind: -10, sta: -10 };
    return [
      opt('blow-whistle', (s) => { add(s, fall); setFlag(s, 'a4.whistle_blown'); }, (s) => has(s, 'item_reed_whistle')),
      opt('hold-thread', (s) => add(s, { ...fall, sta: -20 })),
      opt('willpower-hum', (s) => { add(s, fall); add(s, { mind: 15, cling: 1 }); }, (s) => s.mind - 10 <= 50),
      opt('stand-alone', (s) => { add(s, fall); add(s, { sta: -10, mind: 10, resil: 1 }); }, (s) => s.mind - 10 <= 50),
    ];
  } },
  { id: 'A4-04', options: () => only((s) => {
    const tier = rescueTier(s);
    if (tier === 1) add(s, { sta: -10 });
    if (tier === 0) add(s, { sta: -15, hp: -10 });
    add(s, { staMin: 40 });
    setFlag(s, ['a4.rescue_self', 'a4.rescue_late', 'a4.rescue_instant'][tier]);
    setFlag(s, 'a4.friends_back');
    add(s, { mind: 15, bs: 5, br: 5 });
  }) },
  { id: 'A4-05', options: () => [
    opt('high-road', (s) => { s.road = 'H'; add(s, { bs: 5 }); }),
    opt('low-road', (s) => { s.road = 'L'; add(s, { br: 5 }); }),
  ] },
  { id: 'A4-R1', options: (s) => (s.road === 'H' ? [
    opt('marble-beam', (x) => add(x, { sta: -10 }), (x) => has(x, 'item_glass_marble')),
    opt('keen-beam', (x) => add(x, { sta: -10 }), (x) => x.triad === 'siblings'),
    opt('sparrow-scout', (x) => add(x, { sta: -5 }), (x) => x.bs >= 30),
    opt('grit-jump', (x) => add(x, { sta: -25 })),
  ] : [
    opt('light-item', (x) => add(x, { sta: -5 }), (x) => has(x, 'item_dewdrop_stone') || has(x, 'item_glass_marble')),
    opt('whistle-echo', (x) => add(x, { sta: -5, mind: -5 }), (x) => has(x, 'item_reed_whistle')),
    opt('pod-calm-rat', (x) => add(x, { sta: -5, mind: -5 }), SEEDED),
    opt('grit-grope', (x) => add(x, { sta: -5, hp: -5, mind: -15 })),
  ]) },
  { id: 'A4-R2', options: (s) => (s.road === 'H'
    ? only((x) => { add(x, { mind: 10, hp: -5 }); setFlag(x, 'a4.saw_lit_window'); })
    : only((x) => {
      const light = has(x, 'item_dewdrop_stone') || has(x, 'item_glass_marble') || flag(x, 'boss.reformed_beacon');
      add(x, { mind: light ? 10 : 0 });
      if (light) setFlag(x, 'a4.chalk_drawing_seen');
      if (x.route === 'A') add(x, { br: 5, resil: 1 });
    })) },
  { id: 'A4-06', options: () => {
    const surge = { hp: -10, mind: -10, br: 10 };
    return [
      opt('pod-float', (s) => add(s, { ...surge, sta: -10 }), (s) => has(s, 'item_lotus_pod')),
      opt('sacrifice-stone', (s) => { add(s, { ...surge, sta: -5 }); drop(s, 'item_dewdrop_stone'); setFlag(s, 'a4.sacrificed_item'); }, (s) => has(s, 'item_dewdrop_stone')),
      opt('sacrifice-marble', (s) => { add(s, { ...surge, sta: -5 }); drop(s, 'item_glass_marble'); setFlag(s, 'a4.sacrificed_item'); }, (s) => has(s, 'item_glass_marble')),
      opt('thread-lasso', (s) => add(s, { ...surge, sta: -15 })),
      opt('sparrow-pull', (s) => add(s, { ...surge, sta: -10 }), (s) => s.bs >= 30),
      opt('grit-jump-in', (s) => add(s, { ...surge, hp: -30, sta: -25 })),
    ];
  } },
  { id: 'A4-07', options: (s) => {
    const rest = (x) => add(x, { hpMin: 60, staMin: 55, mind: 10, bs: 5, br: 5 });
    const list = [];
    if (s.items.length < 4) list.push(opt('take-cloth', (x) => { rest(x); add(x, { mind: 20 }); take(x, 'item_scented_cloth'); }));
    else {
      for (const old of s.items.filter((i) => i !== 'item_red_yarn')) {
        list.push(opt(`replace-${old}`, (x) => { rest(x); add(x, { mind: 20 }); drop(x, old); take(x, 'item_scented_cloth'); setFlag(x, 'a4.left_under_bench'); }));
      }
    }
    list.push(opt('remember-scent', (x) => { rest(x); add(x, { mind: 10 }); setFlag(x, 'refused_scented_cloth'); }));
    return list;
  } },
];

// Engine ----------------------------------------------------------------------
const SIGNATURE_FLAGS = ['a1.saved_snack', 'boss.reformed_beacon', 'a3.bus_with_teuk', 'a4.whistle_blown', 'a4.friends_back'];
function signature(s) {
  return JSON.stringify([s.triad, s.route, s.road, [...s.items].sort(), s.seeds,
    SIGNATURE_FLAGS.filter((f) => s.flags.includes(f)), s.grace.length > 0]);
}
const METRICS = ['hp', 'mind', 'sta', 'bs', 'br', 'cling', 'resil'];
// Keep only the extreme states (min and max of every metric) per structural signature.
// Every effect is monotone in these metrics, so the extremes bound the full envelope.
function prune(states) {
  const groups = new Map();
  for (const s of states) {
    const k = signature(s);
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(s);
  }
  const kept = [];
  for (const list of groups.values()) {
    const pick = new Set();
    for (const m of METRICS) {
      let lo = list[0]; let hi = list[0];
      for (const s of list) { if (s[m] < lo[m]) lo = s; if (s[m] > hi[m]) hi = s; }
      pick.add(lo); pick.add(hi);
    }
    kept.push(...pick);
  }
  return kept;
}
function runSteps(states, steps, act) {
  for (const step of steps) {
    const next = [];
    for (const s of states) {
      const options = step.gate ? courageGate(s) : step.options(s);
      const avail = options.filter((o) => o.req(s));
      if (avail.length === 0) throw new Error(`ทางตันที่ ${step.id}`);
      for (const o of avail) {
        const n = clone(s);
        n.path.push(`${step.id}:${o.key}`);
        o.fx(n);
        graceCheck(n, act, step.id);
        if (n.items.length > 4) throw new Error(`กระเป๋าล้นที่ ${step.id}`);
        next.push(n);
      }
    }
    states = prune(next);
  }
  return states;
}
function runAct2(states) {
  states = runSteps(states, ACT2_OPEN, 'a2');
  const a = runSteps(states.filter((s) => s.route === 'A'), ROUTE_A, 'a2');
  const b = runSteps(states.filter((s) => s.route === 'B'), ROUTE_B, 'a2');
  return runSteps([...a, ...b], ACT2_CLOSE, 'a2');
}
const range = (list, f) => { const v = list.map(f); return [Math.min(...v), Math.max(...v)]; };
function summarize(label, states, groupBy) {
  const groups = new Map();
  for (const s of states) {
    const g = groupBy ? groupBy(s) : 'ทุกเส้นทาง';
    if (!groups.has(g)) groups.set(g, []);
    groups.get(g).push(s);
  }
  return [...groups].map(([g, list]) => ({
    act: label, group: g, n: list.length,
    hp: range(list, (s) => s.hp), mind: range(list, (s) => s.mind), sta: range(list, (s) => s.sta),
    bs: range(list, (s) => s.bs), br: range(list, (s) => s.br), items: range(list, (s) => s.items.length),
    grace: list.filter((s) => s.grace.length).length,
  }));
}

let states = [start()];
const a1 = (states = runSteps(states, ACT1, 'a1'));
const a2 = (states = runAct2(states));
const a3 = (states = runSteps(states, ACT3, 'a3'));
const a4 = (states = runSteps(states, ACT4, 'a4'));

const fmt = ([lo, hi]) => (lo === hi ? `${lo}` : `${lo}–${hi}`);
const rows = [
  ...summarize('จบ Act 1', a1),
  ...summarize('จบ Act 2', a2, (s) => `เส้นทาง${s.route === 'A' ? 'กออ้อ' : 'ท่อ'}`),
  ...summarize('จบ Act 3', a3, (s) => (flag(s, 'a3.bus_with_teuk') ? 'นั่งรถเมล์' : 'เดินเอง')),
  ...summarize('จบ Act 4', a4, (s) => `ทาง${s.road === 'H' ? 'บน' : 'ล่าง'}`),
];
console.log('| จุด | กลุ่ม | สถานะสุดขั้วที่ตรวจ | HP | ใจ | STA | Bond นก | Bond หนู | ของในกระเป๋า | สถานะที่ใช้ Grace |');
console.log('|---|---|---|---|---|---|---|---|---|---|');
for (const r of rows) {
  console.log(`| ${r.act} | ${r.group} | ${r.n} | ${fmt(r.hp)} | ${fmt(r.mind)} | ${fmt(r.sta)} | ${fmt(r.bs)} | ${fmt(r.br)} | ${fmt(r.items)} | ${r.grace} |`);
}

// Fairness invariants (ADR-P0-031 §D4) ------------------------------------------
const BANDS = {
  'จบ Act 1': { hp: [50, 65], mind: [35, 60], sta: [55, 65] },
  'จบ Act 2': { hp: [65, 90], mind: [45, 90], sta: [70, 90] },
  'จบ Act 3': { hp: [70, 95], mind: [45, 95], sta: [55, 90] },
  'จบ Act 4': { hp: [50, 85], mind: [45, 100], sta: [55, 90] },
};
const failures = [];
for (const r of rows) {
  const band = BANDS[r.act];
  for (const m of ['hp', 'mind', 'sta']) {
    if (r[m][0] < band[m][0] || r[m][1] > band[m][1]) failures.push(`${r.act}/${r.group}: ${m} ${fmt(r[m])} นอกช่วง ${band[m].join('–')}`);
  }
}
const graceSteps = {};
for (const s of a4) for (const g of s.grace) graceSteps[g] = (graceSteps[g] || 0) + 1;
for (const g of Object.keys(graceSteps)) if (!g.startsWith('a4@')) failures.push(`Grace เกิดนอก Act 4: ${g}`);
const tiers = { instant: 0, late: 0, self: 0 };
for (const s of a4) for (const t of Object.keys(tiers)) if (flag(s, `a4.rescue_${t}`)) tiers[t] += 1;

console.log(`\nจุดที่เกิด Grace (นับสถานะสุดขั้วปลาย Act 4): ${JSON.stringify(graceSteps)}`);
console.log(`ระดับการช่วยชีวิตที่ A4-04 (นับสถานะสุดขั้ว): ${JSON.stringify(tiers)}`);
const nonGritGrace = a4.filter((s) => s.grace.length && !s.path.some((p) => p.includes('grit')));
console.log(`สถานะที่ใช้ Grace โดยไม่เคยเลือกทาง "ฝืนเอา" เลย: ${nonGritGrace.length}`);
if (nonGritGrace.length) failures.push('มีเส้นทางที่ไม่เคยฝืนแต่ยังต้องใช้ Grace');

if (process.argv.includes('--grace-detail')) {
  for (const s of a4.filter((x) => x.grace.length).slice(0, 2)) {
    console.log(JSON.stringify({ grace: s.grace, end: { hp: s.hp, mind: s.mind, sta: s.sta }, path: s.path.join(' → ') }, null, 1));
  }
}
if (failures.length) {
  console.log(`\nไม่ผ่าน ${failures.length} ข้อ:\n- ${failures.join('\n- ')}`);
  process.exitCode = 1;
} else {
  console.log('\nผ่านทุกข้อ: ช่วงค่าปลายองก์อยู่ในเกณฑ์ · Grace เกิดเฉพาะใน Act 4 และเฉพาะเส้นทางที่เลือก "ฝืนเอา"');
}
