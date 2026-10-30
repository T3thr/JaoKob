// JaoKob · UX mockup v3 screen-state check (interactive-gameplay-ux-ui-specification.md §8.3).
// Usage:  node docs/design-system/evidence/ux-v3-screen-states-check.mjs
//
// Every clash screen Astra draws must be a state the engine can actually reach.
// This script rebuilds each screen from its story state and button presses, then checks
// the light level, the turn, which cards exist, and where the "แก้ทาง" and "ซ้ำ" tags go.

import { ROUNDS, ACTIONS, enterClash, listActions, step } from './tactical-clash-engine.mjs';

// A card answers an intent when it cancels, negates or halves it (or reveals an illusion).
const answers = (id, intent) => {
  const a = ACTIONS[id];
  return [...(a.cancels || []), ...(a.negates || []), ...(a.halves || [])].includes(intent) || (intent === 'illusion' && !!a.reveals);
};
const isFamily = (id) => ['family', 'sibling'].includes(ACTIONS[id].kind);

function screen(cs) {
  const r = ROUNDS[cs.round];
  const intent = r.intents[cs.t - 1];
  const t = cs.territory;
  const neutral = (intent === 'dim' && t.dimOff) || (intent === 'gather' && t.gatherOff) || (intent === 'whisper' && t.whisperOff);
  const cards = listActions(cs);
  return {
    turn: cs.t, light: cs.P, intent, neutral, cards,
    counter: neutral ? [] : cards.filter((id) => answers(id, intent)),
    repeat: r.act >= 2 && cs.streak >= 1 ? cards.filter(isFamily) : [],
  };
}

const same = (a, b) => a.length === b.length && [...a].sort().every((x, i) => x === [...b].sort()[i]);
const base = { hp: 5, mind: 4, sta: 4, fsu: 3, streak: 0, major: null, ready: [], tempo: 0 };
const rows = [];
function check(id, text, cs, want) {
  const s = screen(cs);
  const fails = [];
  for (const [k, v] of Object.entries(want)) {
    const got = s[k];
    if (Array.isArray(v) ? !same(got, v) : got !== v) fails.push(`${k}: ได้ ${JSON.stringify(got)} ต้องการ ${JSON.stringify(v)}`);
  }
  rows.push({ id, text, s, fails });
}

// จอ 3 · R5 เทิร์น 1 · ของทุกชิ้นวางเป็นอาณาเขต ยกเว้นกระดุมที่เย็บแล้ว ไม่มีริบบิ้น จึงกระซิบฝันร้ายยังมีผล
const r5 = enterClash({ ...base, bk: 3, bf: 3, bt: 3, items: ['button', 'seeds', 'guard', 'gear'], flags: ['teuk_intel'] }, 'R5');
check('จอ 3', 'R5 เทิร์น 1 · แสง 4 · กระซิบฝันร้ายมีผล · ไม่มีท่าปิดศึก', r5, {
  turn: 1, light: 4, intent: 'whisper', neutral: false,
  cards: ['strike', 'guard', 'rest', 'rain', 'wind', 'eye', 'a_pkam', 'a_fiw', 's_kab', 's_kib'],
  counter: ['guard', 'rain', 'a_pkam'], repeat: [],
});

// จอ 4 · R5 เทิร์น 3 หลังใช้โล่กระป๋องแล้วตั้งสติฟังฝน
check('จอ 4', 'R5 เทิร์น 3 · แสง 6 · ท่าปิดศึกเปิด · ครอบครัวทั้งห้าใบมีป้ายซ้ำ', step(step(r5, 'a_pkam'), 'rain'), {
  turn: 3, light: 6, intent: 'grow',
  cards: ['strike', 'guard', 'rest', 'rain', 'wind', 'eye', 'a_fiw', 's_kab', 's_kib', 'hem'],
  counter: ['strike', 'guard', 'wind', 's_kib'], repeat: ['rain', 'wind', 'eye', 's_kab', 's_kib'],
});

// จอ 11 · R4A เทิร์น 1 · ดามข้อเท้าเตื๊อกที่ C3 จึงได้แสงเริ่ม +1 · กรณีการ์ดมากที่สุดของทั้งเกม
check('จอ 11', 'R4A เทิร์น 1 · แสง 4 · การ์ดครบ 16 ใบ', enterClash({ ...base, bk: 3, bf: 3, bt: 3, items: ['button', 'ribbon', 'seeds', 'gear'], flags: ['teuk_splint'], tempo: 1 }, 'R4A'), {
  turn: 1, light: 4, intent: 'grow',
  cards: ['strike', 'guard', 'rest', 'rain', 'wind', 'eye', 'seeds', 'gear', 'button', 'ribbon', 'a_pkam', 'a_fiw', 'a_teuk', 's_kab', 's_kib', 'ribbon_fiw'],
  counter: ['strike', 'guard', 'wind', 'seeds', 'a_pkam', 's_kib'], repeat: [],
});

// จอ 12 · R2 เทิร์น 2 หลังใช้ตั้งสติฟังฝน
check('จอ 12', 'R2 เทิร์น 2 · แสง 4 · ท่าผสานสองใบแก้ทาง · ทักษะครอบครัวมีป้ายซ้ำ', step(enterClash({ ...base, fsu: 0, bk: 2, bf: 1, bt: 0, items: ['seeds', 'guard', 'gear'], flags: [] }, 'R2'), 'rain'), {
  turn: 2, light: 4, intent: 'grow',
  cards: ['strike', 'guard', 'rest', 'rain', 'wind', 'eye', 'seeds', 'guardItem', 'gear', 'gear_pkam', 'seeds_fiw'],
  counter: ['strike', 'guard', 'wind', 'seeds', 'gear_pkam', 'seeds_fiw'], repeat: ['rain', 'wind', 'eye'],
});

// ภาพ v2 จอ 3–4 วางริบบิ้นในกระเป๋าพร้อมกระซิบฝันร้าย: ยืนยันว่าเกิดไม่ได้
const v2 = screen(enterClash({ ...base, bk: 3, bf: 3, bt: 3, items: ['button', 'ribbon', 'seeds', 'guard'], flags: [] }, 'R5'));
rows.push({ id: 'v2', text: 'ภาพ v2: มีริบบิ้นแล้วกระซิบฝันร้ายต้องไม่มีผล', s: v2, fails: v2.neutral ? [] : ['กระซิบฝันร้ายยังมีผลทั้งที่มีริบบิ้น'] });

const th = (ids) => ids.map((id) => ACTIONS[id].th).join(' · ') || '(ไม่มี)';
console.log('JaoKob UX v3 screen-state check');
let ok = true;
for (const { id, text, s, fails } of rows) {
  ok &&= fails.length === 0;
  console.log(`${fails.length ? 'ไม่ผ่าน' : 'ผ่าน'} · ${id} · ${text} · การ์ด ${s.cards.length} ใบ`);
  if (id !== 'v2') console.log(`    แก้ทาง: ${th(s.counter)}\n    ซ้ำ: ${th(s.repeat)}`);
  for (const f of fails) console.log(`    ${f}`);
}
console.log(ok ? 'ผลรวม: ผ่านทุกข้อ' : 'ผลรวม: มีข้อที่ไม่ผ่าน');
process.exitCode = ok ? 0 : 1;
