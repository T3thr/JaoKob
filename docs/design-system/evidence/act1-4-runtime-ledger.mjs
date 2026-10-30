// SUPERSEDED · หลักฐานประวัติของ ADR-P0-031 ยุคก่อน ADR-P0-032 อ้างเรื่องและกติกาที่ระงับแล้ว ห้ามใช้ออกแบบต่อ
// เครื่องมือปัจจุบัน: five-act-balance-model.mjs · five-act-runtime-ledger.mjs · tactical-clash-simulator.mjs
// ผลเดิมรันซ้ำได้โดย checkout commit 0f97a48 · แฟล็ก --historical บังคับรันบนพิมพ์เขียวปัจจุบัน ซึ่งจะไม่ผ่านเพราะเรื่องเปลี่ยนแล้ว
if (!process.argv.includes('--historical')) {
  console.log('SUPERSEDED: เครื่องมือนี้เป็นหลักฐานของ ADR-P0-031 ให้ใช้ five-act-balance-model.mjs และ five-act-runtime-ledger.mjs แทน (ผลเดิมรันซ้ำได้โดย checkout commit 0f97a48)');
  process.exit(0);
}

// JaoKob Act 1–4 runtime ledger (design evidence for ADR-P0-031; not production code).
// Usage:  node docs/design-system/evidence/act1-4-runtime-ledger.mjs [--detail]
// Reads the authored script inside the four act blueprints, walks representative paths,
// and estimates real reading time. Exit code 1 if any path falls outside 8–10 minutes
// at the base reading rate.
//
// Method (ADR-P0-031 §D9):
//   reading  = Thai characters read (whitespace excluded) ÷ rate
//   taps     = 0.5 s per VN line shown
//   decide   = 6 s per choice node
//   CG dwell = 3 s per node with a CG
//   silence  = authored seconds
// Base rate 800 characters/minute; slow 650; fast 1000. Calibrate with a real PO read-through.

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const FILES = {
  1: 'act1-living-keepsake-rewrite-blueprint.md',
  2: 'act2-living-keepsake-rewrite-blueprint.md',
  3: 'act3-living-keepsake-rewrite-blueprint.md',
  4: 'act4-living-keepsake-rewrite-blueprint.md',
};
const RATES = { base: 800, slow: 650, fast: 1000 };
const TAP_S = 0.5; const DECIDE_S = 6; const CG_S = 3;

const chars = (t) => Array.from(t.replace(/[*_`]/g, '').replace(/\s+/g, '')).length;

// Parse "### ID · title" blocks into { meta, main: [{tags,text}], options: [{label, out:[{tags,text}]}] }.
function parse(md) {
  const nodes = new Map();
  let cur = null; let opt = null;
  for (const raw of md.split('\n')) {
    const h = raw.match(/^### (A\d-[0-9A-Z]+) · (.+)$/);
    if (h) { cur = { id: h[1], title: h[2], meta: null, main: [], options: [] }; nodes.set(cur.id, cur); opt = null; continue; }
    if (!cur) continue;
    if (/^## /.test(raw)) { cur = null; continue; }
    const m = raw.match(/`pace: (\w+)` `emotion: (\w+)` `CG: ([^`]+)` `silence: (\d+)s`/);
    if (m && !cur.meta) { cur.meta = { pace: m[1], emotion: m[2], cg: m[3].trim() !== '—', silence: Number(m[4]) }; continue; }
    const o = raw.match(/^\d+\. \*\*(.+?)\*\*(.*)$/);
    if (o) {
      const cond = o[2].match(/แสดงเมื่อ \{([!a-z_,]+)\}/);
      opt = { label: o[1].replace(/^[ก-ฮ] · /, ''), tags: cond ? cond[1].split(',') : [], out: [] };
      cur.options.push(opt); continue;
    }
    const line = (text) => {
      const t = text.match(/^\{([!a-z_,]+)\} (.*)$/);
      return t ? { tags: t[1].split(','), text: t[2] } : { tags: [], text };
    };
    const ol = raw.match(/^ {3}> (.*)$/);
    if (ol && opt) { opt.out.push(line(ol[1])); continue; }
    const ml = raw.match(/^> (.*)$/);
    if (ml) { cur.main.push(line(ml[1])); opt = null; }
  }
  return nodes;
}
const visible = (l, tags) => l.tags.every((t) => (t.startsWith('!') ? !tags.includes(t.slice(1)) : tags.includes(t)));

function measure(nodes, path) {
  let read = 0; let lines = 0; let decide = 0; let cg = 0; let silence = 0; const missing = [];
  for (const [id, pick] of path.steps) {
    const n = nodes.get(id);
    if (!n) { missing.push(id); continue; }
    for (const l of n.main) if (visible(l, path.tags)) { read += chars(l.text); lines += 1; }
    if (n.options.length) {
      decide += 1;
      for (const o of n.options) if (visible(o, path.tags)) read += chars(o.label);
      const chosen = n.options[(pick || 1) - 1];
      if (chosen) for (const l of chosen.out) if (visible(l, path.tags)) { read += chars(l.text); lines += 1; }
    }
    if (n.meta?.cg) cg += 1;
    silence += n.meta?.silence || 0;
  }
  const overhead = lines * TAP_S + decide * DECIDE_S + cg * CG_S + silence;
  const minutes = Object.fromEntries(Object.entries(RATES).map(([k, r]) => [k, (read / r) + overhead / 60]));
  return { read, lines, decide, cg, silence, minutes, missing };
}

// Representative paths -------------------------------------------------------
const A1_COMMON = (triadNode, triadPick, extra = {}) => [
  ['A1-01', extra.a01 || 1], ['A1-03', triadPick], [triadNode],
  ['A1-05', extra.a05 || 2], ['A1-06', 2], ['A1-08', 1], ['A1-09', 1], ['A1-10', extra.a10 || 2],
  ['A1-11', 1], ['A1-13'], ['A1-14', extra.a14 || 1], ...(extra.skip14b ? [] : [['A1-14B', extra.a14b || 2]]),
  ['A1-15', 3], ['A1-16'], ['A1-17'], ['A1-18', extra.a18 || 2], ['A1-19', 3], ['A1-20'], ['A1-21', 1],
];
const PATHS = {
  1: [
    { name: 'ตามพ่อ · พกนกหวีด+หินใส', tags: ['father', 'whistle', 'stone', 'carried'], steps: A1_COMMON('A1-04F', 1) },
    { name: 'ตามแม่ · พกฝักบัวชิ้นเดียว', tags: ['mother', 'pod', 'carried'], steps: A1_COMMON('A1-04M', 2, { a14: 3, a14b: 4 }) },
    { name: 'ตามพี่ ๆ · ไม่พกอะไร · นอนข้างพ่อ', tags: ['siblings', 'none', 'belief_father'], steps: A1_COMMON('A1-04S', 3, { a14: 4, skip14b: true, a10: 1, a18: 3 }) },
  ],
  2: [
    { name: 'กออ้อ · พกนกหวีด+หินใส', tags: ['father', 'whistle', 'stone', 'carried', 'route_a'], steps: [
      ['A2-01', 1], ['A2-02', 1], ['A2-03', 1], ['A2-A1', 2], ['A2-A2', 1], ['A2-A3'], ['A2-A4', 1], ['A2-A5', 1], ['A2-A6'], ['A2-A7', 1],
      ['A2-08'], ['A2-09'], ['A2-10', 2], ['A2-11']] },
    { name: 'ท่อ · พกฝักบัว (ตามแม่)', tags: ['mother', 'pod', 'seeds', 'carried', 'route_b', 'reformed'], steps: [
      ['A2-01', 1], ['A2-02', 1], ['A2-03', 2], ['A2-B1', 1], ['A2-B2', 1], ['A2-B3'], ['A2-B4'], ['A2-B5', 1], ['A2-B6', 1], ['A2-B7'],
      ['A2-B8'], ['A2-B9', 1], ['A2-B10'], ['A2-B11'], ['A2-B12', 1], ['A2-08'], ['A2-09'], ['A2-10', 1], ['A2-11']] },
  ],
  3: [
    { name: 'นั่งรถเมล์กับเตื๊อก · มีนกหวีด+หินใส', tags: ['father', 'whistle', 'stone', 'carried', 'bus'], steps: [
      ['A3-01'], ['A3-02'], ['A3-03', 2], ['A3-04', 1], ['A3-05', 1], ['A3-06'], ['A3-07'], ['A3-08', 2], ['A3-09'], ['A3-10'],
      ['A3-11', 1], ['A3-12', 2], ['A3-13'], ['A3-14', 1], ['A3-15', 1], ['A3-16']] },
    { name: 'เดินเอง · มีฝักบัว (ตามแม่)', tags: ['mother', 'pod', 'seeds', 'carried', 'walk'], steps: [
      ['A3-01'], ['A3-02'], ['A3-03', 1], ['A3-04', 2], ['A3-05', 2], ['A3-06'], ['A3-07'], ['A3-08', 3], ['A3-09'], ['A3-10'],
      ['A3-11', 2], ['A3-12', 3], ['A3-13'], ['A3-14', 2], ['A3-15', 2], ['A3-16']] },
  ],
  4: [
    { name: 'ทางบน · นกหวีด+ลูกแก้ว · นั่งรถเมล์ (กออ้อ)', tags: ['father', 'whistle', 'marble', 'carried', 'bus', 'route_a', 'instant', 'saw_follower', 'left_food', 'cloth', 'lit_window'], steps: [
      ['A4-01', 1], ['A4-02', 2], ['A4-03', 1], ['A4-04', 1], ['A4-05', 1], ['A4-H1', 1], ['A4-H2'], ['A4-06', 5], ['A4-07', 1], ['A4-08']] },
    { name: 'ทางล่าง · หินใส · เดินเอง (ท่อ)', tags: ['mother', 'stone', 'carried', 'walk', 'route_b', 'reformed', 'instant', 'light', 'sacrificed_stone', 'cloth'], steps: [
      ['A4-01', 2], ['A4-02', 4], ['A4-03', 2], ['A4-04', 2], ['A4-05', 2], ['A4-L1', 1], ['A4-L2'], ['A4-06', 2], ['A4-07', 1], ['A4-08']] },
  ],
};

const acts = process.argv.slice(2).filter((a) => /^\d$/.test(a)).map(Number);
const run = acts.length ? acts : [1, 2, 3, 4];
const detail = process.argv.includes('--detail');
let failed = 0;
console.log('| องก์ | เส้นทาง | ตัวอักษรที่อ่าน | หน้าจอ | การตัดสินใจ | CG | เงียบ (วิ) | นาที (ช้า / ปกติ / เร็ว) |');
console.log('|---|---|---|---|---|---|---|---|');
for (const act of run) {
  let md;
  try { md = readFileSync(join(here, '..', FILES[act]), 'utf8'); } catch { console.log(`| ${act} | (ยังไม่มีไฟล์) | | | | | | |`); continue; }
  const nodes = parse(md);
  for (const p of PATHS[act]) {
    const r = measure(nodes, p);
    const ok = r.minutes.base >= 8 && r.minutes.base <= 10 && !r.missing.length;
    if (!ok) failed += 1;
    const f = (x) => x.toFixed(1);
    console.log(`| ${act} | ${p.name} | ${r.read} | ${r.lines} | ${r.decide} | ${r.cg} | ${r.silence} | ${f(r.minutes.slow)} / **${f(r.minutes.base)}** / ${f(r.minutes.fast)}${ok ? '' : ' ✗'} |`);
    if (r.missing.length) console.log(`|  | ไม่พบโหนด: ${r.missing.join(', ')} | | | | | | |`);
    if (detail) {
      for (const [id] of p.steps) {
        const n = nodes.get(id); if (!n) continue;
        const sub = measure(nodes, { tags: p.tags, steps: [[id, (p.steps.find((s) => s[0] === id) || [])[1]]] });
        console.log(`|  | ${id} ${n.title} | ${sub.read} | ${sub.lines} | | | | ${(sub.minutes.base * 60).toFixed(0)} วิ |`);
      }
    }
  }
}
if (failed) { console.log(`\nมี ${failed} เส้นทางที่ไม่อยู่ในช่วง 8–10 นาที (อัตราปกติ)`); process.exitCode = 1; }
else console.log('\nทุกเส้นทางอยู่ในช่วง 8–10 นาทีที่อัตราอ่านปกติ');
