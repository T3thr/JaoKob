// JaoKob · five-act runtime ledger (design evidence for ADR-P0-031 retained runtime rule and
// ADR-P0-033 interactive modes).
// Usage:  node docs/design-system/evidence/five-act-runtime-ledger.mjs [--detail]
//
// Reads the script of every node from the five act blueprints and measures how long a
// player spends on each path: reading, line advances, silences, decisions, clash turns,
// camp choices, micro-actions and CG viewing. Also cross-checks that every node id in the
// blueprints matches the balance model exactly. Exit code 1 if any check fails.

import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { NODE_IDS } from './five-act-balance-model.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const DOCS = join(here, '..');

// Timing model (seconds). Reading is measured in Thai base characters (combining vowels and
// tone marks are not counted), at a visual-novel pace with click-to-advance.
export const RATE = { read: 12, line: 0.8, decide: 5, option: 0.3, turn: 10, drop: 5, cg: 3 };
const SPEED = { base: { read: 1, act: 1 }, slow: { read: 0.8, act: 1.3 }, fast: { read: 1.25, act: 0.8 } };
const ACT_RANGE = [8, 10];
const TOTAL_RANGE = [42, 48];

const COMBINING = /[ัิ-ฺ็-๎]/g;
const baseChars = (s) => s.replace(COMBINING, '').replace(/\s+/g, '').length;

// --- Parse a blueprint into nodes ---------------------------------------------------------
function parse(file) {
  const nodes = new Map();
  if (!existsSync(join(DOCS, file))) return nodes;
  const text = readFileSync(join(DOCS, file), 'utf8');
  let cur = null;
  let inScript = false;
  for (const raw of text.split('\n')) {
    if (raw.startsWith('## ')) { inScript = raw.startsWith('## 3.'); cur = null; continue; }
    if (!inScript) continue;
    const h = raw.match(/^### ((?:A\d[AB]?-\d+)|(?:E-[A-Z]+-\d)) · (.+)$/);
    if (h) { cur = { id: h[1], title: h[2], meta: {}, lines: [], options: [], activities: [] }; nodes.set(h[1], cur); continue; }
    if (!cur) continue;
    if (/^`[a-z]+:/.test(raw)) {
      for (const m of raw.matchAll(/`([a-zA-Z0-9]+): ([^`]*)`/g)) cur.meta[m[1]] = m[2].trim();
      continue;
    }
    const line = raw.trim();
    if (line.startsWith('>')) {
      let body = line.replace(/^>\s*/, '');
      let tags = null;
      const t = body.match(/^\{([^}]+)\}\s*/);
      if (t) { tags = t[1]; body = body.slice(t[0].length); }
      const speech = body.replace(/^[^:：]{1,24}[:：]\s*/, '');
      cur.lines.push({ tags, chars: baseChars(speech) });
      continue;
    }
    const opt = raw.match(/^\d+\. \*\*(.+?)\*\*/);
    if (opt) { cur.options.push(baseChars(opt[1])); continue; }
    const act = raw.match(/^- \*\*(.+?)\*\*/);
    if (act) cur.activities.push(baseChars(act[1]));
  }
  return nodes;
}

// A tag group matches a path when any alternative matches; "!x" matches when x is absent.
function visible(tags, pathTags) {
  if (!tags) return true;
  return tags.split('|').some((alt) => {
    const a = alt.trim();
    if (a === 'resp' || /^t\d$/.test(a)) return true;
    if (a.startsWith('!')) return !pathTags.has(a.slice(1));
    return pathTags.has(a);
  });
}

function nodeSeconds(node, pathTags, speed) {
  let read = 0;
  let lines = 0;
  for (const l of node.lines) {
    if (!visible(l.tags, pathTags)) continue;
    read += l.chars / (RATE.read * speed.read);
    lines += 1;
  }
  let act = lines * RATE.line;
  const mode = node.meta.mode || 'vn';
  if (['choice', 'obstacle', 'pouch', 'ending'].includes(mode)) {
    act += RATE.decide + node.options.length * RATE.option;
    read += node.options.reduce((a, c) => a + c, 0) / (RATE.read * speed.read);
  }
  if (mode === 'clash') act += Number(node.meta.turns || 0) * RATE.turn;
  if (mode === 'camp') {
    act += Number(node.meta.drops || 0) * RATE.drop;
    read += node.activities.reduce((a, c) => a + c, 0) / (RATE.read * speed.read);
  }
  if (node.meta.duration) act += parseFloat(node.meta.duration);
  if (node.meta.cg && node.meta.cg !== '—') act += RATE.cg;
  const silence = parseFloat(node.meta.silence || '0');
  return read + act * speed.act + silence;
}

// --- Paths --------------------------------------------------------------------------------
const FILES = {
  1: 'act1-living-keepsake-rewrite-blueprint.md',
  2: 'act2-living-keepsake-rewrite-blueprint.md',
  3: 'act3-living-keepsake-rewrite-blueprint.md',
  4: 'act4-living-keepsake-rewrite-blueprint.md',
  5: 'act5-living-keepsake-rewrite-blueprint.md',
};
const ENDS = { home: ['E-HOME-1', 'E-HOME-2'], pond: ['E-POND-1', 'E-POND-2'], dawn: ['E-DAWN-1', 'E-DAWN-2'] };
export const PATHS = [
  { act: 1, name: 'Act 1 · ฟังฝน · ผ่านด่านด้วยทักษะ · ชนะขาด · สาย A', nodes: NODE_IDS.act1, tags: ['major:rain', 'o:rain', 'c:eat', 'c:mother', 'decisive', 'route:A'] },
  { act: 1, name: 'Act 1 · ผ่าลม · ยันไว้ได้ · สาย B', nodes: NODE_IDS.act1, tags: ['major:wind', 'o:wind', 'c:kab', 'c:kib', 'hold', 'route:B'] },
  { act: 1, name: 'Act 1 · ส่องเงา · ยืนหยัดเอง · เฉียด · สาย A', nodes: NODE_IDS.act1, tags: ['major:eye', 'o:alone', 'c:eat', 'c:kib', 'narrow', 'route:A'] },
  { act: 2, name: 'Act 2 สาย A · ท่าผสานช่วยพี่ก้าม · ชนะขาด', nodes: NODE_IDS.act2A, tags: ['route:A', 'o:item', 'snack:share', 'listen:quiet', 'save:combo', 'c:kam', 'c:fiw', 'c:bugs', 'decisive'] },
  { act: 2, name: 'Act 2 สาย A · ยืนหยัดเอง · ยันไว้ได้', nodes: NODE_IDS.act2A, tags: ['route:A', 'o:alone', 'snack:eat', 'listen:notall', 'save:alone', 'c:tend', 'c:quiet', 'c:ready', 'hold'] },
  { act: 2, name: 'Act 2 สาย B · ท่าผสานไฟเมล็ด · ชนะขาด', nodes: NODE_IDS.act2B, tags: ['route:B', 'o:item', 'fiw:count', 'save:combo', 'push:help', 'c:kam', 'c:fiw', 'c:bugs', 'decisive'] },
  { act: 2, name: 'Act 2 สาย B · ทักษะ · เฉียด', nodes: NODE_IDS.act2B, tags: ['route:B', 'o:skill', 'fiw:lead', 'save:skill', 'push:let', 'c:tend', 'c:quiet', 'c:ready', 'narrow'] },
  { act: 3, name: 'Act 3 · ช่วยด้วยพี่ก้าม · ท่าผสานกับเตื๊อก · รับนกหวีด', nodes: NODE_IDS.act3, tags: ['gutter:friend', 'bottle:friend', 'kamtears', 'torch:combo', 'decisive', 'c:splint', 'c:teuk', 'c:bugs', 'whistle:take', 'bt3'] },
  { act: 3, name: 'Act 3 · ยืนหยัดเอง · ปฏิเสธนกหวีด', nodes: NODE_IDS.act3, tags: ['gutter:alone', 'bottle:alone', 'torch:alone', 'hold', 'c:cloth', 'c:kam', 'c:fiw', 'whistle:refuse'] },
  { act: 4, name: 'Act 4 · แผน A · รับริบบิ้น · มีนกหวีด', nodes: NODE_IDS.act4, tags: ['wall:friend', 'answer:roots', 'c:kab', 'c:fiw', 'c:bugs', 'ribbon:take', 'plan:A', 'whistle', 'decisive', 'fiwtrusted'] },
  { act: 4, name: 'Act 4 · แผน B · ปฏิเสธริบบิ้น · ไม่มีนกหวีด', nodes: NODE_IDS.act4, tags: ['wall:alone', 'answer:self', 'c:kam', 'c:kib', 'c:tend', 'ribbon:refuse', 'plan:B', 'nowhistle', 'hold'] },
  { act: 5, name: 'Act 5 · E-HOME', nodes: [...NODE_IDS.act5.filter((id) => !id.startsWith('E-')), ...ENDS.home], tags: ['climb:rain', 'gear', 'seeds', 'whistle', 'calm', 'decisive', 'end:home'] },
  { act: 5, name: 'Act 5 · E-POND', nodes: [...NODE_IDS.act5.filter((id) => !id.startsWith('E-')), ...ENDS.pond], tags: ['climb:alone', 'guard', 'ribbon', 'calm', 'hold', 'end:pond'] },
  { act: 5, name: 'Act 5 · E-DAWN', nodes: [...NODE_IDS.act5.filter((id) => !id.startsWith('E-')), ...ENDS.dawn], tags: ['climb:wind', 'guard', 'whistle', 'ribbon', 'calm', 'decisive', 'end:dawn', 'bt3'] },
];

// --- Run -----------------------------------------------------------------------------------
function main() {
  const out = [];
  const say = (x = '') => out.push(x);
  let ok = true;
  const check = (name, pass, detail = '') => { if (!pass) ok = false; say(`${pass ? 'ผ่าน' : 'ไม่ผ่าน'} · ${name}${detail ? ' · ' + detail : ''}`); };

  const parsed = {};
  for (const [act, file] of Object.entries(FILES)) parsed[act] = parse(file);

  say('JaoKob five-act runtime ledger');
  say(`อัตรา: อ่าน ${RATE.read} ตัวอักษรฐานต่อวินาที · เลื่อนบรรทัด ${RATE.line} วินาที · ตัดสินใจ ${RATE.decide} วินาที · เทิร์นศึก ${RATE.turn} วินาที · หยดแคมป์ ${RATE.drop} วินาที`);
  say('');

  // Cross-check node ids with the balance model.
  const expect = { 1: NODE_IDS.act1, 2: [...new Set([...NODE_IDS.act2A, ...NODE_IDS.act2B])], 3: NODE_IDS.act3, 4: NODE_IDS.act4, 5: NODE_IDS.act5 };
  for (const act of Object.keys(FILES)) {
    const have = [...parsed[act].keys()];
    const missing = expect[act].filter((id) => !have.includes(id));
    const extra = have.filter((id) => !expect[act].includes(id));
    check(`Act ${act}: รหัสโหนดในบทตรงกับแบบจำลองสมดุลทุกตัว (${have.length} โหนด)`, !missing.length && !extra.length, [missing.length ? 'ขาด ' + missing.join(',') : '', extra.length ? 'เกิน ' + extra.join(',') : ''].filter(Boolean).join(' · '));
  }
  say('');

  const results = [];
  for (const p of PATHS) {
    const nodes = parsed[p.act];
    const tags = new Set(p.tags);
    const t = {};
    for (const [k, sp] of Object.entries(SPEED)) {
      t[k] = p.nodes.reduce((a, id) => a + (nodes.has(id) ? nodeSeconds(nodes.get(id), tags, sp) : 0), 0) / 60;
    }
    results.push({ ...p, t });
    say(`${p.name}: ${t.base.toFixed(1)} นาที (ช้า ${t.slow.toFixed(1)} · เร็ว ${t.fast.toFixed(1)})`);
    if (process.argv.includes('--detail')) {
      for (const id of p.nodes) if (nodes.has(id)) say(`    ${id} ${(nodeSeconds(nodes.get(id), tags, SPEED.base)).toFixed(0)} วินาที`);
    }
  }
  say('');
  for (const r of results) check(`${r.name} อยู่ในช่วง ${ACT_RANGE[0]}–${ACT_RANGE[1]} นาที`, r.t.base >= ACT_RANGE[0] && r.t.base <= ACT_RANGE[1], `${r.t.base.toFixed(1)}`);

  const byAct = (a) => results.filter((r) => r.act === a).map((r) => r.t.base);
  const lo = [1, 2, 3, 4, 5].reduce((s, a) => s + Math.min(...byAct(a)), 0);
  const hi = [1, 2, 3, 4, 5].reduce((s, a) => s + Math.max(...byAct(a)), 0);
  const slowHi = [1, 2, 3, 4, 5].reduce((s, a) => s + Math.max(...results.filter((r) => r.act === a).map((r) => r.t.slow)), 0);
  const fastLo = [1, 2, 3, 4, 5].reduce((s, a) => s + Math.min(...results.filter((r) => r.act === a).map((r) => r.t.fast)), 0);
  say('');
  check(`รวมทั้ง 5 องก์ที่อัตราปกติอยู่ในช่วง ${TOTAL_RANGE[0]}–${TOTAL_RANGE[1]} นาที`, lo >= TOTAL_RANGE[0] && hi <= TOTAL_RANGE[1], `${lo.toFixed(1)}–${hi.toFixed(1)} นาที (ช้าสุด ${slowHi.toFixed(1)} · เร็วสุด ${fastLo.toFixed(1)})`);
  say(ok ? 'ผลรวม: ผ่านทุกข้อ' : 'ผลรวม: มีข้อที่ไม่ผ่าน');
  console.log(out.join('\n'));
  process.exitCode = ok ? 0 : 1;
}

main();
