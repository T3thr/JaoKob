// JaoKob · UX mockup v3 screen-state check (interactive-gameplay-ux-ui-specification.md §8.3).
// Usage:  node docs/design-system/evidence/ux-v3-screen-states-check.mjs
//
// Every clash screen Astra draws must be a state the engine can actually reach. Since C2 this
// script plays each screen on the Core runtime (openClash · playClashTurn) and reads the
// cards, the "แก้ทาง" and the "ซ้ำ" tags from Core's own view model (projectClash), so the
// check holds no rule of its own (ADR-P0-034 D5.2 · D9.2).

import { readFileSync } from 'node:fs';
import { KEEPSAKES, TRAY_GROUPS } from '../../../src/core/domain/clash/clash-rules.js';
import { openClash, playClashTurn } from '../../../src/core/domain/clash/clash-engine.js';
import { projectClash } from '../../../src/core/domain/clash/clash-tray.js';
import { createJourneyState } from '../../../src/core/domain/journey/journey-state.js';
import { ACTIONS, ACTION_ORDER } from './tactical-clash-engine.mjs';

const story = JSON.parse(readFileSync(new URL('../mechanics/story.json', import.meta.url), 'utf8'));
const roundOf = (id) => story.rounds.find((r) => r.id === id);

/** A JourneyState at a clash, from the short story fields the v3 screens were specified with. */
function journey(act, { hp, mind, sta, fsu = 0, bk = 0, bf = 0, bt = 0, items = [], flags = [], tempo = 0 }) {
  const j = createJourneyState({ act, meters: { hp, mind, sta } });
  j.bonds = { pkam: bk, fiw: bf, teuk: bt };
  j.counters.familySkillUses = fsu;
  j.counters.tempo = tempo;
  for (const name of items) { const id = KEEPSAKES[name]; j.pouch.held.push(id); j.pouch.acquired.push(id); j.pouch.remembered.push(id); }
  j.flags = [...flags];
  return j;
}

/** Open the round's clash and press the given cards. */
function play(roundId, state, presses = []) {
  const round = roundOf(roundId);
  let result = { journey: state, encounter: openClash(round, state) };
  for (const id of presses) result = playClashTurn(round, result.journey, result.encounter, id);
  return { round, ...result };
}

function screen({ round, journey: j, encounter }) {
  const view = projectClash(round, j, encounter);
  // Report in the HUD order of the action table, as the v3 review lists the cards.
  const cards = TRAY_GROUPS.flatMap((g) => view.groups[g]).sort((a, b) => ACTION_ORDER.indexOf(a.id) - ACTION_ORDER.indexOf(b.id));
  return {
    turn: view.turn, light: view.light, intent: view.intent.id, neutral: view.intent.neutralized,
    cards: cards.map((c) => c.id), counter: cards.filter((c) => c.answers).map((c) => c.id), repeat: cards.filter((c) => c.homesick).map((c) => c.id),
  };
}

const same = (a, b) => a.length === b.length && [...a].sort().every((x, i) => x === [...b].sort()[i]);
const base = { hp: 5, mind: 4, sta: 4, fsu: 3 };
const rows = [];
function check(id, text, clash, want) {
  const s = screen(clash);
  const fails = [];
  for (const [k, v] of Object.entries(want)) {
    const got = s[k];
    if (Array.isArray(v) ? !same(got, v) : got !== v) fails.push(`${k}: ได้ ${JSON.stringify(got)} ต้องการ ${JSON.stringify(v)}`);
  }
  rows.push({ id, text, s, fails });
}

// จอ 3 · R5 เทิร์น 1 · ของทุกชิ้นวางเป็นอาณาเขต ยกเว้นกระดุมที่เย็บแล้ว ไม่มีริบบิ้น จึงกระซิบฝันร้ายยังมีผล
const r5 = journey(5, { ...base, bk: 3, bf: 3, bt: 3, items: ['button', 'seeds', 'guard', 'gear'], flags: ['teuk_intel'] });
check('จอ 3', 'R5 เทิร์น 1 · แสง 4 · กระซิบฝันร้ายมีผล · ไม่มีท่าปิดศึก', play('R5', r5), {
  turn: 1, light: 4, intent: 'whisper', neutral: false,
  cards: ['strike', 'guard', 'rest', 'rain', 'wind', 'eye', 'a_pkam', 'a_fiw', 's_kab', 's_kib'],
  counter: ['guard', 'rain', 'a_pkam'], repeat: [],
});

// จอ 4 · R5 เทิร์น 3 หลังใช้โล่กระป๋องแล้วตั้งสติฟังฝน
check('จอ 4', 'R5 เทิร์น 3 · แสง 6 · ท่าปิดศึกเปิด · ครอบครัวทั้งห้าใบมีป้ายซ้ำ', play('R5', r5, ['a_pkam', 'rain']), {
  turn: 3, light: 6, intent: 'grow',
  cards: ['strike', 'guard', 'rest', 'rain', 'wind', 'eye', 'a_fiw', 's_kab', 's_kib', 'hem'],
  counter: ['strike', 'guard', 'wind', 's_kib'], repeat: ['rain', 'wind', 'eye', 's_kab', 's_kib'],
});

// จอ 11 · R4A เทิร์น 1 · ดามข้อเท้าเตื๊อกที่ C3 จึงได้แสงเริ่ม +1 · กรณีการ์ดมากที่สุดของทั้งเกม
check('จอ 11', 'R4A เทิร์น 1 · แสง 4 · การ์ดครบ 16 ใบ', play('R4A', journey(4, { ...base, bk: 3, bf: 3, bt: 3, items: ['button', 'ribbon', 'seeds', 'gear'], flags: ['teuk_splint'], tempo: 1 })), {
  turn: 1, light: 4, intent: 'grow',
  cards: ['strike', 'guard', 'rest', 'rain', 'wind', 'eye', 'seeds', 'gear', 'button', 'ribbon', 'a_pkam', 'a_fiw', 'a_teuk', 's_kab', 's_kib', 'ribbon_fiw'],
  counter: ['strike', 'guard', 'wind', 'seeds', 'a_pkam', 's_kib'], repeat: [],
});

// จอ 12 · R2 เทิร์น 2 หลังใช้ตั้งสติฟังฝน
check('จอ 12', 'R2 เทิร์น 2 · แสง 4 · ท่าผสานสองใบแก้ทาง · ทักษะครอบครัวมีป้ายซ้ำ', play('R2', journey(2, { ...base, fsu: 0, bk: 2, bf: 1, bt: 0, items: ['seeds', 'guard', 'gear'] }), ['rain']), {
  turn: 2, light: 4, intent: 'grow',
  cards: ['strike', 'guard', 'rest', 'rain', 'wind', 'eye', 'seeds', 'guardItem', 'gear', 'gear_pkam', 'seeds_fiw'],
  counter: ['strike', 'guard', 'wind', 'seeds', 'gear_pkam', 'seeds_fiw'], repeat: ['rain', 'wind', 'eye'],
});

// ภาพ v2 จอ 3–4 วางริบบิ้นในกระเป๋าพร้อมกระซิบฝันร้าย: ยืนยันว่าเกิดไม่ได้
const v2 = screen(play('R5', journey(5, { ...base, bk: 3, bf: 3, bt: 3, items: ['button', 'ribbon', 'seeds', 'guard'] })));
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
