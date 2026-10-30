// JaoKob · Light vs. Shadow Tactical Clash engine (design evidence for ADR-P0-033 D1).
// Pure and deterministic: no DOM, no clock, no random. The same rules are meant to move
// into src/core/ later; this file is the executable specification used by the proofs.
//
// Board: one integer "light front" P on 0..10. P ≥ 10 ends the round as a decisive win.
// Each turn the shadow shows its intent first (telegraphed), the player answers with one
// action, then the intent resolves unless the action countered it.

export const METER_MAX = 5;
export const BOND_MAX = 4;
export const P_WIN = 10;
export const HOLD_AT = 7; // final P ≥ 7 → "ยันไว้ได้" (hold); lower → "เฉียด" (narrow)
export const GRACE_FLOOR = 2;

const clampMeter = (v) => Math.max(0, Math.min(METER_MAX, v));
// Story hazards and enemy hits never take a meter below 1. Only grit can reach 0.
export const softDec = (v, n = 1) => (v <= 1 ? v : Math.max(1, v - n));

// ---------------------------------------------------------------------------------------
// Intents. Effect applies at the end of the turn unless the player's action answered it.
//   grow     เงาขยาย     P −2 (guard halves to −1)
//   lash     ฟาดผ้าคลุม   กาย −1 and P −1
//   taunt    กระซิบขู่     ใจ −1 and P −1
//   whisper  กระซิบฝันร้าย ใจ −1 and P −1 (Act 5, aimed at เปี๊ยก)
//   dim      ดับแสง       next turn every positive gain −1
//   illusion เงาลวง       P −1, and aimed actions this turn hit nothing
//   gather   สูดความมืด   next intent doubles; on the last turn it is "กลืนห้อง" P −3
// ---------------------------------------------------------------------------------------
export const INTENTS = {
  grow: { th: 'เงาขยาย' },
  lash: { th: 'ฟาดผ้าคลุม' },
  taunt: { th: 'กระซิบขู่' },
  whisper: { th: 'กระซิบฝันร้าย' },
  dim: { th: 'ดับแสง' },
  illusion: { th: 'เงาลวง' },
  gather: { th: 'สูดความมืด' },
};

// Rounds. allies = who stands with the frog this round; siblings = family members present.
export const ROUNDS = {
  R1: {
    act: 1, node: 'A1-08', turns: 3, p0: 5, intents: ['grow', 'lash', 'taunt'],
    allies: [], siblings: ['kab', 'kib'], combos: [], light: false,
    th: 'ศึกแรกริมฝาย',
  },
  R2: {
    act: 2, node: 'A2-10', turns: 4, p0: 3, intents: ['taunt', 'grow', 'lash', 'gather'],
    allies: ['pkam', 'fiw'], siblings: [], combos: ['gear_pkam', 'seeds_fiw'], light: true,
    events: { 3: { p: 1, id: 'code_rope', th: 'เชือกถ่วงหย่อนตามรหัสสามจังหวะ' } },
    th: 'ศึกบัลลังก์เงา',
  },
  R3: {
    act: 3, node: 'A3-11', turns: 4, p0: 3, intents: ['dim', 'illusion', 'lash', 'grow'],
    allies: ['pkam', 'fiw', 'teuk'], siblings: [], combos: ['button_teuk'], light: true,
    th: 'ศึกใต้ชายคาศาลา',
  },
  R4A: {
    act: 4, node: 'A4-09', plan: 'A', turns: 4, p0: 3, intents: ['grow', 'lash', 'gather', 'grow'],
    allies: ['pkam', 'fiw', 'teuk'], siblings: ['kab', 'kib'], combos: ['whistle_teuk', 'ribbon_fiw'], light: true,
    th: 'ทะยานร่อนฝ่าสายฟ้า',
  },
  R4B: {
    act: 4, node: 'A4-09', plan: 'B', turns: 4, p0: 3, intents: ['lash', 'grow', 'taunt', 'gather'],
    allies: ['pkam', 'fiw', 'teuk'], siblings: ['kab', 'kib'], combos: ['whistle_teuk', 'gear_pkam_b'], light: true,
    th: 'ป้อมปราการก้ามเหล็กและสปริงพี่ใหญ่',
  },
  R5: {
    act: 5, node: 'A5-07', turns: 4, p0: 2, intents: ['whisper', 'dim', 'grow', 'gather'],
    allies: ['pkam', 'fiw'], siblings: ['kab', 'kib'], combos: [], light: true, territory: true,
    finisher: true, finisherFrom: 3, th: 'ศึกอัศวินเงาข้างโคมไฟ',
  },
};

// ---------------------------------------------------------------------------------------
// Actions. kind: base | family | item | assist | sibling | combo | finisher
//   gain        P gained before the intent resolves
//   aimed       wasted by an unrevealed illusion
//   cancels     intents that do not happen this turn
//   negates     intents whose damage the frog avoids this turn
//   halves      grow becomes −1
//   reveals     answers an illusion (no P −1, aimed actions keep their gain)
// ---------------------------------------------------------------------------------------
export const ACTIONS = {
  strike: { kind: 'base', th: 'รุก', cost: { sta: 2 }, gain: 2, aimed: true, cancels: ['grow', 'gather'] },
  grit: { kind: 'base', th: 'ฝืนรุก', gain: 2, aimed: true, cancels: ['grow', 'gather'], grit: true },
  guard: { kind: 'base', th: 'ตั้งรับ', cost: { sta: 1 }, gain: 0, negates: ['lash', 'taunt', 'whisper'], halves: ['grow'] },
  rest: { kind: 'base', th: 'สูดหายใจ', gain: 0, restore: { sta: 2 } },

  rain: { kind: 'family', skill: 'rain', th: 'ตั้งสติฟังฝน', gain: 1, negates: ['taunt', 'whisper'], reveals: true, revealBonus: 1, preview: true },
  wind: { kind: 'family', skill: 'wind', th: 'ดีดตัวผ่าลม', gain: 2, aimed: true, negates: ['lash'], cancels: ['grow', 'gather'] },
  eye: { kind: 'family', skill: 'eye', th: 'ตาส่องเงามืด', gain: 1, reveals: true, revealBonus: 1, cancels: ['gather'], weakPoint: true },

  seeds: { kind: 'item', item: 'seeds', th: 'เมล็ดต้อยติ่งเรืองแสง', gain: 2, reveals: true, cancels: ['grow', 'gather', 'illusion'] },
  guardItem: { kind: 'item', item: 'guard', th: 'สนับข้อมือเปลือกไม้', gain: 1, negates: ['lash'] },
  gear: { kind: 'item', item: 'gear', th: 'เฟืองสังกะสีไขลาน', gain: 2, cancels: ['dim'], restore: { mind: 1 } },
  button: { kind: 'item', item: 'button', th: 'กระดุมทองเหลือง ต.♡ป.', gain: 2, cancels: ['dim'], needsLight: true, notIn: ['R5'] },
  ribbon: { kind: 'item', item: 'ribbon', th: 'ริบบิ้นเหลืองกลิ่นแดด', gain: 1, restore: { mind: 1, sta: 1 } },

  a_pkam: { kind: 'assist', ally: 'pkam', bond: 'bk', th: 'โล่กระป๋องเหล็กคู่ใจ', gain: 1, negates: ['lash', 'taunt', 'whisper'], halves: ['grow'] },
  a_fiw: { kind: 'assist', ally: 'fiw', bond: 'bf', th: 'โฉบคว้ากลางเวหา', gain: 2, restore: { sta: 1 } },
  a_teuk: { kind: 'assist', ally: 'teuk', bond: 'bt', th: 'ลำแสงสัญญาจากนอกรั้ว', gain: 3, cancels: ['dim'] },

  s_kab: { kind: 'sibling', sib: 'kab', th: 'สปริงพี่ใหญ่', gain: 2, negates: ['lash'] },
  s_kib: { kind: 'sibling', sib: 'kib', th: 'ห่าเมล็ดเรือง', gain: 2, reveals: true, cancels: ['grow', 'gather', 'illusion'] },

  gear_pkam: { kind: 'combo', item: 'gear', ally: 'pkam', bond: 'bk', th: 'ล็อกสลิงถ่วงประตูน้ำ', gain: 3, cancels: ['grow', 'gather'] },
  seeds_fiw: { kind: 'combo', item: 'seeds', ally: 'fiw', bond: 'bf', th: 'ไฟเมล็ดนำร่อง', gain: 3, reveals: true, cancels: ['grow', 'gather', 'illusion'] },
  button_teuk: { kind: 'combo', item: 'button', ally: 'teuk', bond: 'bt', th: 'ลำแสงสะท้อนกระดุมคู่', gain: 3, reveals: true, cancels: ['dim', 'illusion'] },
  whistle_teuk: { kind: 'combo', item: 'whistle', ally: 'teuk', bond: 'bt', bondMin: 0, th: 'นกหวีดเรียกลำแสง', gain: 3, cancels: ['grow', 'dim'] },
  ribbon_fiw: { kind: 'combo', item: 'ribbon', ally: 'fiw', bond: 'bf', th: 'ผ้าพันคอนำลม', gain: 3, negates: ['lash'], restore: { mind: 1, sta: 1 } },
  gear_pkam_b: { kind: 'combo', item: 'gear', ally: 'pkam', bond: 'bk', th: 'ล็อกท่อรางน้ำ', gain: 3, negates: ['lash'], cancels: ['grow'] },

  hem: { kind: 'finisher', th: 'ชูชายเสื้อรับแสง', gain: 3, capeAt: 6, capeBonus: 1 },
};

// The order players see in the HUD; also the enumeration order (deterministic).
export const ACTION_ORDER = [
  'strike', 'grit', 'guard', 'rest', 'rain', 'wind', 'eye',
  'seeds', 'guardItem', 'gear', 'button', 'ribbon',
  'a_pkam', 'a_fiw', 'a_teuk', 's_kab', 's_kib',
  'gear_pkam', 'seeds_fiw', 'button_teuk', 'whistle_teuk', 'ribbon_fiw', 'gear_pkam_b', 'hem',
];

const BOND_OF = { pkam: 'bk', fiw: 'bf', teuk: 'bt' };

// ---------------------------------------------------------------------------------------
// Entry: build a clash state from the story state.
// story: { hp, mind, sta, fsu, streak, bk, bf, bt, items[], major, tempo, ready[], flags[] }
// ---------------------------------------------------------------------------------------
export function enterClash(story, roundId) {
  const r = ROUNDS[roundId];
  const flags = new Set(story.flags || []);
  let p0 = r.p0 + (story.tempo || 0);
  const territory = { dimOff: false, growHalf: false, gatherOff: false, whisperOff: false };
  if (r.territory) {
    const has = (x) => story.items.includes(x);
    if (has('gear')) { territory.dimOff = true; p0 += 1; }
    if (has('seeds')) territory.growHalf = true;
    if (has('guard')) territory.gatherOff = true;
    if (has('whistle') || has('ribbon')) territory.whisperOff = true;
    if (flags.has('teuk_intel')) p0 += 1;
  }
  return {
    round: roundId, t: 1, P: Math.max(1, Math.min(P_WIN - 1, p0)),
    hp: story.hp, mind: story.mind, sta: story.sta,
    fsu: story.fsu, streak: story.streak, bk: story.bk, bf: story.bf, bt: story.bt,
    items: [...story.items], major: story.major, ready: [...(story.ready || [])],
    used: [], dim: false, charged: false, weak: false,
    regroup: false, grace: false, gritUsed: false, homesick: 0, ended: false, outcome: null,
    // Act 4 camp talks with the siblings: each makes that sibling's assist push +1 light.
    peace: { kab: flags.has('kab_peace'), kib: flags.has('kib_peace') },
    territory, log: [],
  };
}

const actOf = (cs) => ROUNDS[cs.round].act;

// What the player can press this turn. Never empty: rest is always legal.
export function listActions(cs) {
  const r = ROUNDS[cs.round];
  const out = [];
  for (const id of ACTION_ORDER) {
    const a = ACTIONS[id];
    if (a.notIn && a.notIn.includes(cs.round)) continue;
    // Normal costs never empty a meter: รุก needs แรง ≥ 3, ตั้งรับ needs แรง ≥ 2.
    // When รุก is out of reach, ฝืนรุก (grit) takes its place.
    if (id === 'strike' && cs.sta < 3) continue;
    if (id === 'grit' && cs.sta >= 3) continue;
    if (id === 'guard' && cs.sta < 2) continue;
    if (a.kind === 'item') {
      if (!cs.items.includes(a.item) || cs.used.includes('item:' + a.item)) continue;
      if (a.needsLight && !r.light) continue;
      if (r.territory && a.item !== 'ribbon') continue; // Act 5 items are placed as territory
    }
    if (a.kind === 'assist') {
      if (!r.allies.includes(a.ally) || cs[a.bond] < 3 || cs.used.includes(id)) continue;
    }
    if (a.kind === 'sibling') {
      if (!r.siblings.includes(a.sib) || cs.used.includes(id)) continue;
    }
    if (a.kind === 'combo') {
      if (!r.combos.includes(id)) continue;
      if (!cs.items.includes(a.item) || cs.used.includes('item:' + a.item)) continue;
      if (!r.allies.includes(a.ally)) continue;
      if (cs[a.bond] < (a.bondMin ?? 1)) continue;
    }
    if (a.kind === 'finisher' && (!r.finisher || cs.used.includes(id) || cs.t < r.finisherFrom)) continue;
    out.push(id);
  }
  return out;
}

const isFamily = (a) => a.kind === 'family' || a.kind === 'sibling';

// Resolve one turn. Returns a new state; the input is not mutated.
const copy = (c) => ({ ...c, used: [...c.used], log: c.noLog ? c.log : [...c.log] });

export function step(cs0, actionId) {
  const cs = copy(cs0);
  const r = ROUNDS[cs.round];
  const a = ACTIONS[actionId];
  const act = actOf(cs);
  let intent = r.intents[cs.t - 1];
  const last = cs.t === r.turns;

  // Territory (Act 5) cancels whole intent types before the turn starts.
  if (intent === 'dim' && cs.territory.dimOff) intent = 'none';
  if (intent === 'gather' && cs.territory.gatherOff) intent = 'none';
  if (intent === 'whisper' && cs.territory.whisperOff) intent = 'none';

  // Costs and restores.
  if (a.cost?.sta) cs.sta = clampMeter(cs.sta - a.cost.sta);
  if (a.grit) {
    cs.hp = clampMeter(cs.hp - 1);
    cs.sta = clampMeter(cs.sta - 2);
    cs.gritUsed = true;
  }
  if (a.restore?.sta) cs.sta = clampMeter(cs.sta + a.restore.sta);
  if (a.restore?.mind) cs.mind = clampMeter(cs.mind + a.restore.mind);

  // Family use: count (Acts 2–5), homesick on consecutive use (Acts 2–5). A strained skill
  // still answers the intent (its counters work), but it barely pushes: −2 light on the 2nd
  // use in a row, −4 on the 3rd. Alternating is always better than leaning on home.
  let strain = 0;
  if (isFamily(a)) {
    if (act >= 2) {
      cs.fsu += 1;
      if (cs.streak >= 1) {
        cs.mind = softDec(cs.mind, 1);
        cs.sta = softDec(cs.sta, 1);
        cs.homesick += 1;
        strain = 2 * cs.streak;
      }
    }
    cs.streak += 1;
  } else {
    cs.streak = 0;
  }

  // Bond growth from combos.
  if (a.kind === 'combo') {
    const b = a.bond;
    cs[b] = Math.min(BOND_MAX, cs[b] + 1);
  }

  // Bookkeeping of once-per-round uses.
  if (a.item) cs.used.push('item:' + a.item);
  if (a.kind === 'assist' || a.kind === 'sibling' || a.kind === 'finisher') cs.used.push(actionId);

  // Gain.
  const revealed = !!a.reveals || (a.cancels || []).includes('illusion');
  let gain = a.gain || 0;
  if (a.kind === 'family' && a.skill === cs.major) gain += 1;
  if (a.kind === 'item' && cs.ready.includes(a.item)) gain += 1;
  if (a.kind === 'assist' && cs[a.bond] >= 4) gain += 1;
  if (a.kind === 'sibling' && cs.peace?.[a.sib]) gain += 1;
  if (a.kind === 'finisher' && cs.P >= a.capeAt) gain += a.capeBonus;
  if (intent === 'illusion' && revealed && a.revealBonus) gain += a.revealBonus;
  if (intent === 'illusion' && a.aimed && !revealed) gain = 0;
  if (cs.weak && gain > 0 && a.kind !== 'base') { gain += 1; cs.weak = false; }
  if (strain) gain = Math.max(0, gain - strain);
  if (cs.dim && gain > 0) gain -= 1;
  cs.dim = false;
  if (a.weakPoint) cs.weak = true;
  cs.P += gain;

  // Intent resolution.
  const mult = cs.charged ? 2 : 1;
  cs.charged = false;
  const negated = (x) => (a.negates || []).includes(x);
  const canceled = (x) => (a.cancels || []).includes(x);
  switch (intent) {
    case 'grow':
      if (!canceled('grow')) {
        let d = (a.halves || []).includes('grow') || cs.territory.growHalf ? 1 : 2;
        cs.P -= d * mult;
      }
      break;
    case 'lash':
      if (!negated('lash')) { cs.hp = softDec(cs.hp, mult); cs.P -= mult; }
      break;
    case 'taunt':
      if (!negated('taunt')) { cs.mind = softDec(cs.mind, mult); cs.P -= mult; }
      break;
    case 'whisper':
      if (!negated('whisper')) { cs.mind = softDec(cs.mind, mult); cs.P -= mult; }
      break;
    case 'dim':
      if (!canceled('dim')) cs.dim = true;
      break;
    case 'illusion':
      if (!revealed) cs.P -= mult;
      break;
    case 'gather':
      if (!canceled('gather')) {
        if (last) cs.P -= 3; else cs.charged = true;
      }
      break;
    default:
      break;
  }

  // Story event on this turn (e.g. the siblings' rope in Act 2).
  const ev = r.events?.[cs.t];
  if (ev) cs.P += ev.p;

  // Grace: only grit can empty a meter. Someone catches the frog (meters back to 2),
  // but the shadow gains while he is down (P −2), so falling is never a shortcut.
  if (cs.hp <= 0 || cs.mind <= 0 || cs.sta <= 0) {
    cs.hp = Math.max(cs.hp, GRACE_FLOOR);
    cs.mind = Math.max(cs.mind, GRACE_FLOOR);
    cs.sta = Math.max(cs.sta, GRACE_FLOOR);
    cs.P -= 2;
    cs.grace = true;
  }

  if (!cs.noLog) cs.log.push(`${intent}:${actionId}`);

  // End checks.
  if (cs.P >= P_WIN) { cs.P = P_WIN; return finish(cs, 'decisive'); }
  if (cs.P <= 0) {
    if (!cs.regroup) {
      cs.regroup = true;
      cs.P = 3;
      cs.mind = softDec(cs.mind, 1);
    } else {
      cs.P = 0;
      return finish(cs, 'narrow');
    }
  }
  if (last) return finish(cs, cs.P >= HOLD_AT ? 'hold' : 'narrow');
  cs.t += 1;
  return cs;
}

function finish(cs, outcome) {
  cs.ended = true;
  cs.outcome = outcome;
  if (outcome === 'decisive') cs.mind = clampMeter(cs.mind + 1);
  if (outcome === 'narrow') {
    if (cs.round === 'R5') cs.sta = softDec(cs.sta, 1);
    else cs.hp = softDec(cs.hp, 1);
  }
  return cs;
}

// Exit projection used by the story model (what carries out of the clash).
export const exitOf = (cs) => ({
  hp: cs.hp, mind: cs.mind, sta: cs.sta, fsu: cs.fsu, streak: cs.streak,
  bk: cs.bk, bf: cs.bf, bt: cs.bt, grace: cs.grace, outcome: cs.outcome,
  regroup: cs.regroup, homesick: cs.homesick,
});

// Every distinct terminal state reachable from an entry state. Positions reached by
// different move orders are merged turn by turn, so this is exhaustive but fast.
const posKey = (c) => [c.t, c.P, c.hp, c.mind, c.sta, Math.min(c.streak, 1), c.fsu, c.bk, c.bf, c.bt,
  [...c.used].sort().join('.'), c.dim, c.charged, c.weak, c.regroup, c.grace, c.gritUsed, c.homesick].join(',');
const endKey = (c) => [c.hp, c.mind, c.sta, Math.min(c.streak, 1), c.fsu, c.bk, c.bf, c.bt, c.grace, c.gritUsed, c.outcome, c.homesick, c.regroup].join(',');

// mode 'exact' keeps every position. 'best' keeps, per turn and per discrete situation,
// only positions no other position beats on every axis (used by the story model to prove
// what is reachable); 'worst' keeps only positions that beat no other (proves the floor).
const posClass = (c) => [c.t, [...c.used].sort().join('.'), c.dim, c.charged, c.weak, c.regroup, c.grace, c.gritUsed].join('|');
const posVec = (c) => [c.P, c.hp, c.mind, c.sta, c.bk, c.bf, c.bt, c.fsu, -Math.min(c.streak, 1), -Math.min(c.homesick, 3)];
function prunePositions(map, mode) {
  if (mode === 'exact') return map;
  const groups = new Map();
  for (const c of map.values()) {
    const k = posClass(c);
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push({ c, v: posVec(c) });
  }
  const out = new Map();
  const ge = (a, b) => a.every((ai, i) => ai >= b[i]);
  for (const g of groups.values()) {
    g.sort((x, y) => { const sx = x.v.reduce((a, b) => a + b, 0); const sy = y.v.reduce((a, b) => a + b, 0); return mode === 'best' ? sy - sx : sx - sy; });
    const kept = [];
    for (const x of g) {
      if (!kept.some((k) => (mode === 'best' ? ge(k.v, x.v) : ge(x.v, k.v)))) kept.push(x);
    }
    for (const k of kept) out.set(posKey(k.c), k.c);
  }
  return out;
}

export function terminals(entry0, mode = 'exact') {
  const entry = { ...entry0, noLog: true };
  let layer = new Map([[posKey(entry), entry]]);
  const ends = new Map();
  while (layer.size) {
    const next = new Map();
    for (const cs of layer.values()) {
      for (const id of listActions(cs)) {
        const nx = step(cs, id);
        if (nx.ended) { const k = endKey(nx); if (!ends.has(k)) ends.set(k, nx); }
        else { const k = posKey(nx); if (!next.has(k)) next.set(k, nx); }
      }
    }
    layer = prunePositions(next, mode);
  }
  return [...ends.values()];
}

// Enumerate every action sequence from an entry state. Returns all terminal states
// (one per sequence). Used for sequence statistics; terminals() is used for reachability.
export function enumerate(entry) {
  const done = [];
  const stack = [entry];
  while (stack.length) {
    const cs = stack.pop();
    for (const id of listActions(cs)) {
      const nx = step(cs, id);
      if (nx.ended) done.push(nx); else stack.push(nx);
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
  // Greedy one-step lookahead with a light penalty for meter loss and homesick.
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
