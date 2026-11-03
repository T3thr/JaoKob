// JaoKob · clash parity gate (ADR-P0-034 D5.2 · TC-S5-CLASH-001).
//
// Walks every action sequence from the eighteen entry states of the clash simulator, in
// tray order, and hashes every position on the way (state plus the legal actions). Two
// implementations agree only when every step of every sequence agrees.
//
//   node tools/clash/clash-parity.mjs --check                  core kernel vs the recorded trace
//   node tools/clash/clash-parity.mjs --check --engine <file>  an engine module vs the recorded trace
//   node tools/clash/clash-parity.mjs --write --engine <file>  record the trace of an engine module
//
// The recorded trace came from the proved evidence engine before Core existed. To verify it
// again from history:
//   git show d586f46:docs/design-system/evidence/tactical-clash-engine.mjs > /tmp/engine-d586f46.mjs
//   node tools/clash/clash-parity.mjs --check --engine /tmp/engine-d586f46.mjs

import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { ENTRIES } from '../../docs/design-system/evidence/tactical-clash-simulator.mjs';
import { clashContext, enterClash, legalActions, resolveTurn } from '../../src/core/domain/clash/clash-kernel.js';
import { KEEPSAKES, USED_ITEM } from '../../src/core/domain/clash/clash-rules.js';

export const GOLDEN_FILE = new URL('../../tests/fixtures/journey/clash-parity-golden.json', import.meta.url);
const STORY_FILE = new URL('../../docs/design-system/mechanics/story.json', import.meta.url);

/** The simulator's entry states use short keepsake names; Core uses full item IDs. */
const fullItem = (name) => KEEPSAKES[name] ?? (() => { throw new Error(`unknown keepsake ${name}`); })();

/** A simulator entry state as the JourneyState fields a clash reads. */
export function journeyOfEntry(entry) {
  return {
    meters: { hp: entry.hp, mind: entry.mind, sta: entry.sta },
    bonds: { pkam: entry.bk, fiw: entry.bf, teuk: entry.bt },
    counters: { familySkillUses: entry.fsu, homeStreak: entry.streak, tempo: entry.tempo },
    major: entry.major,
    pouch: { held: entry.items.map(fullItem) },
    ready: entry.ready.map(fullItem),
    flags: [...entry.flags],
  };
}

const canonical = (s) => JSON.stringify([s.round, s.turn, s.light, s.hp, s.mind, s.sta, s.familySkillUses, s.homeStreak,
  s.pkam, s.fiw, s.teuk, s.used, s.dim, s.charged, s.weak, s.regroup, s.grace, s.gritUsed, s.homesick, s.outcome]);

/** Depth-first walk in action order; hashes `state|actions` for every position. */
function walk(root, { view, actions, step, ended }) {
  const hash = createHash('sha256');
  const outcomes = { decisive: 0, hold: 0, narrow: 0 };
  let positions = 0;
  const stack = [root];
  while (stack.length) {
    const position = stack.pop();
    positions += 1;
    const done = ended(position);
    const next = done ? [] : actions(position);
    hash.update(`${canonical(view(position))}|${next.join(',')}\n`);
    if (done) { outcomes[view(position).outcome] += 1; continue; }
    for (let i = next.length - 1; i >= 0; i -= 1) stack.push(step(position, next[i]));
  }
  const sequences = outcomes.decisive + outcomes.hold + outcomes.narrow;
  return { positions, sequences, outcomes, digest: hash.digest('hex') };
}

/** Trace of the Core kernel, with the rounds from the mechanics source. */
export function traceKernel(rounds) {
  const out = [];
  for (const [roundId, entries] of Object.entries(ENTRIES)) {
    const round = rounds.find((r) => r.id === roundId);
    entries.forEach((entry, index) => {
      const journey = journeyOfEntry(entry);
      const ctx = clashContext(round, journey);
      out.push({ round: roundId, entry: index, ...walk(enterClash(ctx, journey), {
        view: (cs) => cs,
        actions: (cs) => legalActions(ctx, cs),
        step: (cs, id) => resolveTurn(ctx, cs, id),
        ended: (cs) => cs.outcome !== null,
      }) });
    });
  }
  return out;
}

/** Trace of a module with the evidence engine API (enterClash · listActions · step). */
export function traceEngine(engine) {
  const shortToFull = (used) => (used.startsWith(USED_ITEM) ? USED_ITEM + fullItem(used.slice(USED_ITEM.length)) : used);
  const view = (c) => ({
    round: c.round, turn: c.t, light: c.P, hp: c.hp, mind: c.mind, sta: c.sta, familySkillUses: c.fsu, homeStreak: c.streak,
    pkam: c.bk, fiw: c.bf, teuk: c.bt, used: c.used.map(shortToFull), dim: c.dim, charged: c.charged, weak: c.weak,
    regroup: c.regroup, grace: c.grace, gritUsed: c.gritUsed, homesick: c.homesick, outcome: c.outcome,
  });
  const out = [];
  for (const [roundId, entries] of Object.entries(ENTRIES)) {
    entries.forEach((entry, index) => {
      const root = { ...engine.enterClash(entry, roundId), noLog: true };
      out.push({ round: roundId, entry: index, ...walk(root, { view, actions: engine.listActions, step: engine.step, ended: (c) => c.ended }) });
    });
  }
  return out;
}

export async function loadRounds() {
  return JSON.parse(await readFile(STORY_FILE, 'utf8')).rounds;
}

export async function loadGolden() {
  return JSON.parse(await readFile(GOLDEN_FILE, 'utf8'));
}

const summarise = (trace) => trace.reduce((s, t) => ({ positions: s.positions + t.positions, sequences: s.sequences + t.sequences }), { positions: 0, sequences: 0 });

async function main() {
  const args = process.argv.slice(2);
  const enginePath = args.includes('--engine') ? args[args.indexOf('--engine') + 1] : null;
  const trace = enginePath ? traceEngine(await import(pathToFileURL(enginePath).href)) : traceKernel(await loadRounds());
  const total = summarise(trace);
  if (args.includes('--write')) {
    if (!enginePath) throw new Error('--write records the trace of an engine module: pass --engine <file>');
    const golden = { source: 'docs/design-system/evidence/tactical-clash-engine.mjs at d586f46 (ADR-P0-033 evidence engine)', entries: trace, total };
    await writeFile(GOLDEN_FILE, `${JSON.stringify(golden, null, 2)}\n`);
    console.log(`บันทึก trace แล้ว · ${total.sequences} ลำดับ · ${total.positions} ตำแหน่ง`);
    return;
  }
  const golden = await loadGolden();
  const differ = trace.filter((t, i) => JSON.stringify(t) !== JSON.stringify(golden.entries[i]));
  if (differ.length || trace.length !== golden.entries.length) {
    for (const d of differ) console.log(`ไม่ตรง · ${d.round} จุดเข้าศึก ${d.entry}`);
    process.exitCode = 1;
    return;
  }
  console.log(`ตรงกับ trace ที่บันทึกไว้ทุกก้าว · ${trace.length} จุดเข้าศึก · ${total.sequences} ลำดับ · ${total.positions} ตำแหน่ง`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
