// JaoKob · Light vs. Shadow Tactical Clash proof (design evidence for ADR-P0-033 D1).
// Usage:  node docs/design-system/evidence/tactical-clash-simulator.mjs
//
// For each of the five rounds (Act 4 has two plans) it builds three representative entry
// states (ready / middling / worn out), enumerates EVERY action sequence exactly, and checks:
//   1. every sequence ends inside the turn limit, no meter goes below 0, nobody "dies";
//   2. Grace happens only on sequences that used grit;
//   3. a decisive win exists from every entry state, including the worn-out one;
//   4. reading the intent matters: the greedy reader wins decisively, pressing รุก every turn
//      never does, and no single action repeated every turn wins decisively;
//   5. consecutive family actions always cost ใจ −1 and แรง −1 (homesick strain);
// and prints the counter table (which actions answer which intent) used by the HUD.

import {
  ROUNDS, ACTIONS, INTENTS, enterClash, enumerate, listActions, step,
  playStrategy, mash, smart, P_WIN,
} from './tactical-clash-engine.mjs';

const base = (o) => ({ hp: 4, mind: 4, sta: 4, fsu: 0, streak: 0, bk: 1, bf: 1, bt: 1, items: [], major: 'wind', tempo: 0, ready: [], flags: [], ...o });

// Representative entries per round: ready, middling, worn out. Items follow the pouch
// timeline (Act 1 none, Act 2 seeds+guard+gear, Act 3 +button, Act 4–5 four keepsakes).
const ENTRIES = {
  R1: [
    base({ hp: 5, mind: 4, sta: 5, major: 'wind' }),
    base({ hp: 5, mind: 4, sta: 5, major: 'rain' }),
    base({ hp: 4, mind: 3, sta: 4, major: 'eye' }),
  ],
  R2: [
    base({ hp: 5, mind: 5, sta: 5, bk: 3, bf: 3, items: ['seeds', 'guard', 'gear'], ready: ['seeds'], tempo: 1 }),
    base({ hp: 4, mind: 3, sta: 4, bk: 2, bf: 1, items: ['seeds', 'guard', 'gear'] }),
    base({ hp: 2, mind: 2, sta: 2, bk: 0, bf: 0, items: ['seeds', 'guard', 'gear'], major: 'eye' }),
  ],
  R3: [
    base({ hp: 5, mind: 5, sta: 5, bk: 3, bf: 3, bt: 3, items: ['seeds', 'guard', 'gear', 'button'] }),
    base({ hp: 4, mind: 3, sta: 3, bk: 2, bf: 2, bt: 2, items: ['seeds', 'guard', 'gear', 'button'] }),
    base({ hp: 2, mind: 2, sta: 2, bk: 0, bf: 0, bt: 1, items: ['seeds', 'guard', 'gear', 'button'], major: 'rain' }),
  ],
  R4A: [
    base({ hp: 5, mind: 5, sta: 5, bk: 3, bf: 4, bt: 3, items: ['button', 'whistle', 'ribbon', 'seeds'], flags: ['kab_peace', 'kib_peace'] }),
    base({ hp: 3, mind: 3, sta: 3, bk: 2, bf: 2, bt: 2, items: ['button', 'whistle', 'guard', 'seeds'] }),
    base({ hp: 2, mind: 2, sta: 2, bk: 1, bf: 0, bt: 0, items: ['button', 'gear', 'guard', 'seeds'], major: 'eye' }),
  ],
  R4B: [
    base({ hp: 5, mind: 5, sta: 5, bk: 4, bf: 3, bt: 3, items: ['button', 'whistle', 'gear', 'guard'], flags: ['kab_peace'] }),
    base({ hp: 3, mind: 3, sta: 3, bk: 2, bf: 2, bt: 2, items: ['button', 'whistle', 'gear', 'seeds'] }),
    base({ hp: 2, mind: 2, sta: 2, bk: 0, bf: 1, bt: 0, items: ['button', 'ribbon', 'guard', 'seeds'], major: 'rain' }),
  ],
  R5: [
    base({ hp: 5, mind: 5, sta: 5, bk: 3, bf: 3, items: ['button', 'gear', 'whistle', 'seeds'], flags: ['teuk_intel'] }),
    base({ hp: 3, mind: 3, sta: 3, bk: 2, bf: 2, items: ['button', 'guard', 'ribbon', 'seeds'] }),
    base({ hp: 2, mind: 2, sta: 2, bk: 1, bf: 0, items: ['button', 'gear', 'whistle', 'ribbon'], major: 'eye' }),
  ],
};
const LABEL = ['พร้อม', 'กลาง', 'อ่อนล้า'];

let ok = true;
const out = [];
const say = (x = '') => out.push(x);
const check = (name, pass, detail = '') => { if (!pass) ok = false; say(`${pass ? 'ผ่าน' : 'ไม่ผ่าน'} · ${name}${detail ? ' · ' + detail : ''}`); };

say('JaoKob Light vs. Shadow Tactical Clash · ตรวจทุกลำดับการกดแบบครบถ้วน');
say('');

const summary = [];
for (const [rid, entries] of Object.entries(ENTRIES)) {
  const r = ROUNDS[rid];
  say(`ยก ${rid} · ${r.th} · ${r.turns} เทิร์น · เจตนาที่เห็นล่วงหน้า: ${r.intents.map((i) => INTENTS[i].th).join(' → ')}`);
  entries.forEach((st, i) => {
    const e = enterClash(st, rid);
    const all = enumerate(e);
    const c = { decisive: 0, hold: 0, narrow: 0 };
    for (const x of all) c[x.outcome] += 1;
    const n = all.length;
    const pct = (k) => ((100 * c[k]) / n).toFixed(1) + '%';
    const m = playStrategy(e, mash);
    const s = playStrategy(e, smart);
    const badMeter = all.some((x) => x.hp < 1 || x.mind < 1 || x.sta < 0);
    const graceNoGrit = all.some((x) => x.grace && !x.gritUsed);
    const overrun = all.some((x) => x.t > r.turns);
    // Same action pressed every turn (when legal) never wins decisively.
    const repeated = [];
    for (const id of Object.keys(ACTIONS)) {
      let cs = e; let legal = true;
      while (!cs.ended) {
        const acts = listActions(cs);
        if (!acts.includes(id)) { legal = false; break; }
        cs = step(cs, id);
      }
      if (legal && cs.outcome === 'decisive') repeated.push(id);
    }
    say(`  ${LABEL[i]} (เริ่มแสง ${e.P}/${P_WIN} · กาย ${st.hp} ใจ ${st.mind} แรง ${st.sta}): ${n} ลำดับ · ชนะขาด ${pct('decisive')} · ยันไว้ได้ ${pct('hold')} · เฉียด ${pct('narrow')}`);
    say(`    ผู้อ่านเจตนา: ${s.outcome} ด้วย ${s.log.join(' → ')} · กดรุกอย่างเดียว: ${m.outcome}`);
    summary.push({ rid, i, n, c, m, s, badMeter, graceNoGrit, overrun, repeated });
  });
  say('');
}

say('ข้อพิสูจน์:');
check('ทุกลำดับจบภายในจำนวนเทิร์นของยก และไม่มีค่าสถานะต่ำกว่าเกณฑ์ (ไม่มี Game Over)', summary.every((x) => !x.badMeter && !x.overrun));
check('Grace เกิดเฉพาะลำดับที่ใช้ฝืนรุก', summary.every((x) => !x.graceNoGrit));
check('ทุกจุดเข้าศึก รวมถึงสภาพอ่อนล้า มีทางชนะขาด', summary.every((x) => x.c.decisive > 0));
const RANK = { narrow: 0, hold: 1, decisive: 2 };
check('ผู้อ่านเจตนาชนะขาดทุกจุดเข้าศึกที่ "พร้อม" และ "กลาง"', summary.filter((x) => x.i < 2).every((x) => x.s.outcome === 'decisive'));
check('ผู้อ่านเจตนาไม่เคยแย่กว่าการกดรุกอย่างเดียว และดีกว่าชัดเจนอย่างน้อยสองในสามของจุดเข้าศึก',
  summary.every((x) => RANK[x.s.outcome] >= RANK[x.m.outcome]) && summary.filter((x) => RANK[x.s.outcome] > RANK[x.m.outcome]).length >= (2 * summary.length) / 3,
  `ดีกว่า ${summary.filter((x) => RANK[x.s.outcome] > RANK[x.m.outcome]).length}/${summary.length}`);
check('กดรุกอย่างเดียวไม่เคยชนะขาด', summary.every((x) => x.m.outcome !== 'decisive'), summary.filter((x) => x.m.outcome === 'decisive').map((x) => `${x.rid}#${x.i}`).join(' '));
// Act 1 is exempt on purpose: at home the family skills carry no strain, so the tutorial
// lets the player feel how strong home is before the journey starts to charge for it.
const journey = summary.filter((x) => x.rid !== 'R1');
check('ระหว่างการเดินทาง (Act 2–5) ไม่มีปุ่มเดียวที่กดซ้ำทุกเทิร์นแล้วชนะขาด', journey.every((x) => x.repeated.length === 0), journey.filter((x) => x.repeated.length).map((x) => `${x.rid}#${x.i}:${x.repeated}`).join(' '));
check('Act 1 (ยังอยู่บ้าน) ใช้ดีดตัวผ่าลมซ้ำได้ชนะขาด เพื่อให้รู้สึกว่าบ้านแข็งแรงแค่ไหน', summary.filter((x) => x.rid === 'R1').every((x) => x.repeated.includes('wind')));
check('ชนะขาดเป็นผลของการวางแผน ไม่ใช่ผลปกติ (ไม่เกิน 30% ของลำดับทั้งหมดในทุกจุด)', summary.every((x) => x.c.decisive / x.n <= 0.3));

// Homesick strain: two family actions in a row (Acts 2–5) cost ใจ −1 and แรง −1.
{
  // A neutral test round: the intents only dim the light, so any meter change is the strain.
  ROUNDS.TEST = { act: 2, turns: 4, p0: 3, intents: ['dim', 'dim', 'dim', 'dim'], allies: [], siblings: [], combos: [], light: true, th: 'ทดสอบ' };
  const e = enterClash(base({ hp: 5, mind: 5, sta: 5, items: [] }), 'TEST');
  const a = step(e, 'wind');
  const b = step(a, 'eye');
  const strainOk = a.mind === 5 && a.sta === 5 && b.mind === 4 && b.sta === 4 && b.homesick === 1 && b.fsu === 2;
  const c = step(step(e, 'wind'), 'guard');
  const d = step(c, 'rain');
  const resetOk = d.homesick === 0 && d.fsu === 2;
  delete ROUNDS.TEST;
  check('ใช้ทักษะครอบครัวสองเทิร์นติดกันเสีย ใจ −1 และ แรง −1 ทันที', strainOk, `ใจ ${a.mind}→${b.mind} · แรง ${a.sta}→${b.sta}`);
  check('สลับไปทำวิธีอื่นหนึ่งเทิร์นแล้วกลับมาใช้ทักษะได้โดยไม่เสียค่า', resetOk);
  const r1 = enterClash(base({ hp: 5, mind: 4, sta: 5 }), 'R1');
  const r1b = step(step(r1, 'wind'), 'rain');
  check('Act 1 ยังอยู่บ้าน: ใช้ทักษะติดกันไม่เกิดอาการโหยหาบ้านและไม่นับ fsu', r1b.homesick === 0 && r1b.fsu === 0);
}

// Counter table for the HUD: for every intent, which actions answer it.
say('');
say('ตารางแก้ทาง (HUD แสดงป้าย "แก้ทาง" บนปุ่มที่ตอบเจตนาปัจจุบัน):');
const answers = {
  grow: (a) => (a.cancels || []).includes('grow') || (a.halves || []).includes('grow'),
  lash: (a) => (a.negates || []).includes('lash'),
  taunt: (a) => (a.negates || []).includes('taunt'),
  whisper: (a) => (a.negates || []).includes('whisper'),
  dim: (a) => (a.cancels || []).includes('dim'),
  illusion: (a) => !!a.reveals || (a.cancels || []).includes('illusion'),
  gather: (a) => (a.cancels || []).includes('gather'),
};
for (const [intent, f] of Object.entries(answers)) {
  const list = Object.entries(ACTIONS).filter(([, a]) => f(a)).map(([, a]) => a.th);
  say(`  ${INTENTS[intent].th}: ${list.join(' · ')}`);
}

say('');
say(ok ? 'ผลรวม: ผ่านทุกข้อ' : 'ผลรวม: มีข้อที่ไม่ผ่าน');
console.log(out.join('\n'));
process.exitCode = ok ? 0 : 1;
