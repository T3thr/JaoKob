// JaoKob · compile the journey package from the act blueprints and the mechanics specs (ADR-P0-034 D6).
// Usage:  node tools/content/compile-journey.mjs          write the package, receipts and report
//         node tools/content/compile-journey.mjs --check  exit 1 when a committed output is stale
//
// Sources:  docs/design-system/act*-living-keepsake-rewrite-blueprint.md  (words, staging, labels)
//           docs/design-system/mechanics/story.json + act*.json          (rules, in the closed vocabulary)
// Outputs:  src/data/content/journey/story-jaokob-core.json               (runtime package)
//           src/data/content/journey/story-jaokob-core.receipts.json      (source line of every text; not loaded at runtime)
//           docs/design-system/mechanics/compile-report.json              (findings for review)
// The compiler is deterministic and fails closed: unknown speakers, tags, modes or option mismatches stop the build.

import { readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { JOURNEY_SCHEMA_CATALOG } from '../../src/data/validation/journey-schema-catalog.js';
import { createContentSchemaValidator } from '../../src/data/validation/content-schema-validator.js';

export const DESIGN_DIR = new URL('../../docs/design-system/', import.meta.url);
export const MECHANICS_DIR = new URL('mechanics/', DESIGN_DIR);
export const OUTPUT_FILES = {
  package: new URL('../../src/data/content/journey/story-jaokob-core.json', import.meta.url),
  receipts: new URL('../../src/data/content/journey/story-jaokob-core.receipts.json', import.meta.url),
  report: new URL('compile-report.json', MECHANICS_DIR),
};
const MANIFEST = new URL('../../assets/images/asset-manifest-v2.json', import.meta.url);
const PACKAGE_SCHEMA_ID = 'https://t3thr.github.io/JaoKob/specs/schemas/v3.0.0/journey-package.schema.json';

export class CompileError extends Error {}
const fail = (where, message) => { throw new CompileError(`${where}: ${message}`); };

const NODE_ID = /^(?:A\d[AB]?-\d{2}|E-[A-Z]+-\d)$/;
const nodeId = (id) => id.toLowerCase();
const actOf = (id) => (id.startsWith('E-') ? 5 : Number(id[1]));
const SLOT = /^(far-left|left|center|right|far-right) · `([a-z0-9_]+)` · (right|left)$/;
const FORBIDDEN_TEXT = /[–—]|\p{Extended_Pictographic}/u;
const DESCRIPTIVE_META = new Set(['mode', 'bg', 'cg', 'silence', 'clue', 'sets', 'set', 'stage', 'act1', 'round', 'turns', 'camp', 'drops', 'pouch', 'ma', 'duration', 'rest', 'physics', 'hazard', 'effect', 'timer']);
const SUPPORTED_MODES = new Set(['vn', 'choice', 'obstacle', 'clash', 'camp', 'micro']);
const OUTCOMES = ['decisive', 'hold', 'narrow'];

// ---------------------------------------------------------------------------------------
// Blueprint parsing: headings, metadata, the staging table (§2) and the script (§3).
// ---------------------------------------------------------------------------------------
export function parseBlueprint(text, file) {
  const lines = text.split('\n');
  const title = lines[0].match(/^# .*?Act \d · (.+?) \(Version [^)]+\)$/)?.[1] ?? fail(file, 'H1 must be "# … Act N · title (Version x)"');
  const table = new Map();
  const nodes = [];
  let section = null;
  let current = null;
  lines.forEach((raw, index) => {
    const line = index + 1;
    if (raw.startsWith('## ')) { section = raw.slice(3).split(' ')[0]; current = null; return; }
    if (section === '2.') {
      const row = raw.match(/^\| (A\d[AB]?-\d{2}|E-[A-Z]+-\d) \| [^|]+ \| [^|]+ \| [^|]+ \| (.+) \|$/);
      if (row) table.set(row[1], { cast: row[2].trim(), line });
      return;
    }
    if (section !== '3.') return;
    const heading = raw.match(/^### (\S+) · (.+)$/);
    if (heading) {
      if (!NODE_ID.test(heading[1])) fail(`${file}:${line}`, `unrecognised node id ${heading[1]}`);
      current = { id: heading[1], title: heading[2].trim(), line, meta: {}, body: [] };
      nodes.push(current);
      return;
    }
    if (!current) return;
    if (/^`[a-zA-Z0-9]+: /.test(raw)) {
      for (const m of raw.matchAll(/`([a-zA-Z0-9]+): ([^`]*)`/g)) {
        if (!DESCRIPTIVE_META.has(m[1])) fail(`${file}:${line}`, `unknown metadata key ${m[1]}`);
        current.meta[m[1]] = m[2].trim();
      }
      return;
    }
    current.body.push({ raw, line });
  });
  return { file, title, table, nodes };
}

function parseScriptLine(raw, where, speakers) {
  let body = raw.trim().replace(/^>\s*/, '');
  let tag = null;
  const t = body.match(/^\{(!?)([a-z0-9_]+)(?::([A-Za-z0-9_]+))?\}\s*/);
  if (t) { tag = { negated: t[1] === '!', name: t[2], value: t[3] ?? null }; body = body.slice(t[0].length); }
  const s = body.match(/^([^:：]{1,24})[:：]\s*(.+)$/);
  if (!s) fail(where, 'script line needs "speaker: text"');
  const label = s[1].trim();
  if (!Object.hasOwn(speakers, label)) fail(where, `unknown speaker ${label}`);
  const text = s[2].trim();
  if (FORBIDDEN_TEXT.test(text)) fail(where, 'Thai text must not contain en or em dashes or emoji');
  if (Array.from(text).length > 600) fail(where, 'text longer than 600 characters');
  return { tag, speaker: speakers[label], text };
}
const tagKey = (tag) => (tag.value === null ? tag.name : `${tag.name}:${tag.value}`);

// ---------------------------------------------------------------------------------------
// Compilation of one act.
// ---------------------------------------------------------------------------------------
function compileAct(ctx, blueprint, spec) {
  const out = [];
  const bpIds = blueprint.nodes.map((n) => n.id);
  const specIds = Object.keys(spec.nodes);
  if (JSON.stringify(bpIds) !== JSON.stringify(specIds)) fail(spec.file, `node ids differ from the blueprint: blueprint ${bpIds.join(',')} · mechanics ${specIds.join(',')}`);
  for (const node of blueprint.nodes) out.push(compileNode(ctx, blueprint, node, spec.nodes[node.id], spec.act));
  return out;
}

function compileNode(ctx, blueprint, node, spec, act) {
  const where = `${blueprint.file}:${node.line} ${node.id}`;
  const mode = node.meta.mode;
  if (!SUPPORTED_MODES.has(mode)) fail(where, `mode ${mode} is not supported by this compiler version`);
  if (actOf(node.id) !== act) fail(where, 'node id belongs to another act');
  const id = nodeId(node.id);
  const text = (suffix, speaker, body, line) => ctx.text(`${id}.${suffix}`, speaker, body, blueprint.file, line);
  const scriptLines = node.body.filter((b) => /^\s*>/.test(b.raw)).map((b) => ({ ...b, indented: /^\s+>/.test(b.raw), parsed: parseScriptLine(b.raw, `${blueprint.file}:${b.line}`, ctx.speakers) }));
  const result = { id, type: mode, act, title: node.title, stage: stageOf(ctx, blueprint, node, spec, where) };
  const lineRefs = (items, prefix) => items.map((item, i) => {
    const ref = { text: text(`${prefix}${i + 1}`, item.parsed.speaker, item.parsed.text, item.line) };
    if (item.parsed.tag) ref.when = ctx.condition(item.parsed.tag, `${blueprint.file}:${item.line}`);
    return ref;
  });

  if (mode === 'clash') return Object.assign(result, compileClash(ctx, blueprint, node, spec, scriptLines, text, where));

  const topLevel = [];
  const options = [];
  for (const b of node.body) {
    const opt = b.raw.match(/^(\d+)\. \*\*(.+?)\*\*/);
    const act2 = b.raw.match(/^- \*\*(.+?)\*\*/);
    if (opt || act2) { options.push({ label: (opt ? opt[2] : act2[1]).trim(), line: b.line, responses: [] }); continue; }
    const s = scriptLines.find((x) => x.line === b.line);
    if (!s) continue;
    if (s.indented) {
      if (!options.length) fail(`${blueprint.file}:${b.line}`, 'response line before any option');
      options.at(-1).responses.push(s);
    } else {
      if (options.length) fail(`${blueprint.file}:${b.line}`, 'narration after options must be indented under an option');
      topLevel.push(s);
    }
  }
  result.lines = lineRefs(topLevel, 'l');
  if (spec.effects?.length) result.effects = spec.effects;

  if (mode === 'vn' || mode === 'micro') {
    if (options.length) fail(where, `${mode} node cannot have options`);
    if (mode === 'micro' || node.meta.ma) result.micro = microOf(ctx, blueprint, node, spec, text, where);
    result.next = ctx.next(spec.next, where);
    return result;
  }

  // choice · obstacle · camp: every blueprint option must have exactly one mechanics entry by tag.
  const specOptions = mode === 'camp' ? spec.activities : spec.options;
  if (!specOptions) fail(where, `${mode} node needs ${mode === 'camp' ? 'activities' : 'options'} in the mechanics spec`);
  const seen = new Set();
  const compiled = options.map((o, i) => {
    const tags = new Set(o.responses.map((r) => (r.parsed.tag ? tagKey(r.parsed.tag) : null)));
    if (tags.size !== 1 || tags.has(null)) fail(`${blueprint.file}:${o.line}`, 'every option needs response lines that share one tag');
    const tag = [...tags][0];
    const mech = specOptions[tag] ?? fail(`${blueprint.file}:${o.line}`, `no mechanics entry for option tag ${tag}`);
    if (seen.has(tag)) fail(`${blueprint.file}:${o.line}`, `duplicate option tag ${tag}`);
    seen.add(tag);
    const key = tag.includes(':') ? tag.split(':')[1].toLowerCase() : tag;
    const prefix = mode === 'camp' ? 'a' : 'o';
    const entry = { key };
    if (mode === 'obstacle') entry.method = mech.method ?? fail(`${blueprint.file}:${o.line}`, 'obstacle option needs a method');
    entry.label = ctx.text(`${id}.${prefix}${i + 1}`, 'narrator', o.label, blueprint.file, o.line);
    if (mode === 'camp') {
      if (mech.group) entry.group = mech.group;
      if (mech.ready) entry.ready = true;
    }
    if (mech.when) entry.when = mech.when;
    entry.effects = mech.effects ?? [];
    entry.responses = o.responses.map((r, j) => ({ text: ctx.text(`${id}.${prefix}${i + 1}.r${j + 1}`, r.parsed.speaker, r.parsed.text, blueprint.file, r.line) }));
    if (mech.next) entry.next = ctx.next(mech.next, `${blueprint.file}:${o.line}`);
    return entry;
  });
  const unused = Object.keys(specOptions).filter((tag) => !seen.has(tag));
  if (unused.length) fail(where, `mechanics entries without a blueprint option: ${unused.join(', ')}`);
  if (mode === 'camp') {
    result.camp = node.meta.camp ?? fail(where, 'camp node needs camp metadata');
    result.drops = Number(node.meta.drops ?? fail(where, 'camp node needs drops metadata'));
    result.activities = compiled;
  } else {
    result.options = compiled;
  }
  if (spec.next) result.next = ctx.next(spec.next, where);
  else if (mode !== 'choice' || compiled.some((o) => !o.next)) fail(where, 'node needs next (or every choice option needs next)');
  if (node.meta.ma) result.micro = microOf(ctx, blueprint, node, spec, text, where);
  return result;
}

function stageOf(ctx, blueprint, node, spec, where) {
  const stage = { bg: node.meta.bg ?? fail(where, 'missing bg metadata') };
  if (node.meta.cg && node.meta.cg !== '—') stage.cg = node.meta.cg;
  if (spec.stage?.slots) {
    stage.slots = spec.stage.slots;
  } else {
    const row = blueprint.table.get(node.id) ?? fail(where, 'no row in the staging table (§2)');
    const parts = row.cast.split(' / ').map((part) => part.trim().match(SLOT));
    if (parts.some((m) => !m)) fail(`${blueprint.file}:${row.line}`, `staging cell is prose; give stage.slots in the mechanics spec for ${node.id}`);
    stage.slots = parts.map((m) => ({ slot: m[1], asset: m[2], facing: m[3] }));
  }
  const silence = node.meta.silence?.match(/^(\d+(?:\.\d+)?)s$/) ?? fail(where, 'silence must look like "2s"');
  stage.silenceMs = Math.round(Number(silence[1]) * 1000);
  stage.bg = ctx.asset(stage.bg, where);
  if (stage.cg) stage.cg = ctx.asset(stage.cg, where);
  stage.slots = stage.slots.map((s) => ({ ...s, asset: ctx.asset(s.asset, where) }));
  return stage;
}

function microOf(ctx, blueprint, node, spec, text, where) {
  const mech = spec.micro ?? fail(where, 'micro needs kind and hint in the mechanics spec');
  const ma = node.meta.ma ?? fail(where, 'micro needs ma metadata');
  const duration = node.meta.duration?.match(/^(\d+)s$/) ?? fail(where, 'micro needs duration metadata like "6s"');
  const paragraph = node.body.find((b) => b.raw.startsWith(`**${ma}:**`)) ?? fail(where, `no **${ma}:** paragraph to take the hint from`);
  if (!paragraph.raw.includes(mech.hint)) fail(`${blueprint.file}:${paragraph.line}`, 'micro hint must be quoted from the micro paragraph');
  return { kind: mech.kind, ma, durationMs: Number(duration[1]) * 1000, hint: text('h', 'narrator', mech.hint, paragraph.line) };
}

function compileClash(ctx, blueprint, node, spec, scriptLines, text, where) {
  const round = ctx.round(spec.round ?? fail(where, 'clash node needs round'), where);
  if (node.meta.round !== round.id || Number(node.meta.turns) !== round.turns) fail(where, 'round and turns metadata must match the mechanics round');
  const labelsLine = node.body.find((b) => b.raw.startsWith('**ชื่อปุ่มในศึกนี้:**')) ?? fail(where, 'missing **ชื่อปุ่มในศึกนี้:** line');
  const scene = new Map();
  for (const m of labelsLine.raw.matchAll(/(\S+) = `([^`]+)`/g)) {
    const action = ctx.lexicon.sceneButtons[m[1]] ?? fail(`${blueprint.file}:${labelsLine.line}`, `unknown button role ${m[1]}`);
    scene.set(m[2], action);
  }
  const labels = {};
  for (const [label, action] of scene) if (label !== ctx.lexicon.actions[action]) labels[action] = text(`k.${action.toLowerCase()}`, 'narrator', label, labelsLine.line);

  const intro = [];
  const intents = Array.from({ length: round.turns }, () => []);
  const outcome = { decisive: [], hold: [], narrow: [] };
  const outro = [];
  let phase = 'intro';
  for (const s of scriptLines) {
    const tag = s.parsed.tag;
    if (!tag) { (phase === 'intro' ? intro : phase === 'outcome' ? outro : fail(`${blueprint.file}:${s.line}`, 'untagged line between turns')).push(s); continue; }
    const turn = tag.name.match(/^t([1-4])$/);
    if (turn && !tag.value) { const n = Number(turn[1]); if (n > round.turns) fail(`${blueprint.file}:${s.line}`, 'turn beyond the round'); intents[n - 1].push(s); phase = 'turns'; continue; }
    if (tag.name === 'resp') { phase = 'turns'; continue; }
    if (OUTCOMES.includes(tag.name)) { outcome[tag.name].push(s); phase = 'outcome'; continue; }
    fail(`${blueprint.file}:${s.line}`, `unknown clash tag ${tagKey(tag)}`);
  }
  if (intents.some((t) => !t.length)) fail(where, 'every turn needs a {tN} line');
  if (OUTCOMES.some((o) => !outcome[o].length)) fail(where, 'every outcome needs a line');

  const responses = {};
  const rows = node.body.filter((b) => /^\| /.test(b.raw) && !/^\|\s*(?:ท่าที่เลือก|---)/.test(b.raw));
  for (const row of rows) {
    const m = row.raw.match(/^\| (.+?) \| (.+) \|$/) ?? fail(`${blueprint.file}:${row.line}`, 'response row must be "| label | text |"');
    const label = m[1].trim();
    const action = scene.get(label) ?? ctx.actionByName(label) ?? fail(`${blueprint.file}:${row.line}`, `unknown action name ${label}`);
    if (responses[action]) fail(`${blueprint.file}:${row.line}`, `second response for ${action}`);
    if (!scene.has(label) && label !== ctx.lexicon.actions[action]) labels[action] = text(`k.${action.toLowerCase()}`, 'narrator', label, row.line);
    const body = m[2].trim();
    if (FORBIDDEN_TEXT.test(body)) fail(`${blueprint.file}:${row.line}`, 'Thai text must not contain en or em dashes or emoji');
    responses[action] = text(`p.${action.toLowerCase()}`, 'narrator', body, row.line);
  }
  for (const action of possibleActions(round)) if (!responses[action]) ctx.warn('clash-response-missing', `${node.id} ${round.id} has no response line for ${action} (${ctx.lexicon.actions[action]})`);

  const lineRefs = (items, prefix) => items.map((item, i) => ({ text: text(`${prefix}${i + 1}`, item.parsed.speaker, item.parsed.text, item.line) }));
  return {
    lines: lineRefs(intro, 'l'),
    round: round.id,
    labels,
    intentLines: intents.map((turnLines, t) => lineRefs(turnLines, `i${t + 1}.l`)),
    responses,
    outcome: { decisive: lineRefs(outcome.decisive, 'd'), hold: lineRefs(outcome.hold, 'h'), narrow: lineRefs(outcome.narrow, 'w') },
    outroLines: lineRefs(outro, 'x'),
    next: ctx.next(spec.next, where),
  };
}

// Actions a round can offer regardless of the pouch (items depend on the journey, so they are not listed).
function possibleActions(round) {
  const out = ['strike', 'grit', 'guard', 'rest', 'rain', 'wind', 'eye'];
  for (const ally of round.allies) out.push(`a_${ally}`);
  for (const sib of round.siblings) out.push(`s_${sib}`);
  out.push(...round.combos);
  if (round.finisherFrom) out.push('hem');
  return out;
}

// ---------------------------------------------------------------------------------------
// Whole package.
// ---------------------------------------------------------------------------------------
/** Default sources read from the repository. Tests pass in-memory sources with the same shape. */
export async function loadSources() {
  return {
    story: JSON.parse(await readFile(new URL('story.json', MECHANICS_DIR), 'utf8')),
    manifest: JSON.parse(await readFile(MANIFEST, 'utf8')),
    blueprint: (file) => readFile(new URL(file, DESIGN_DIR), 'utf8'),
    mechanics: async (file) => JSON.parse(await readFile(new URL(file, MECHANICS_DIR), 'utf8')),
  };
}

export async function compileJourney(sources) {
  const src = sources ?? await loadSources();
  const story = structuredClone(src.story);
  const manifest = src.manifest;
  const known = new Set(Object.values(manifest.categories).flatMap((c) => (Array.isArray(c) ? c : Object.values(c))).map((a) => a.assetId));
  const texts = new Map();
  const receipts = {};
  const warnings = [];
  const missingAssets = new Set();
  // PO decision 2026-11-04: an asset the blueprint names but manifest v2 does not hold yet may
  // point at an existing image until Astra delivers it. Aliases fail closed in both directions.
  const aliases = new Map(Object.entries(story.assetAliases ?? {}));
  const aliasUses = new Map();
  for (const [design, existing] of aliases) {
    if (known.has(design)) fail('mechanics/story.json', `asset ${design} is in manifest v2 now; remove its alias`);
    if (!known.has(existing)) fail('mechanics/story.json', `alias target ${existing} for ${design} is not in manifest v2`);
  }
  const boundaries = new Map();
  const compiledIds = new Set();
  const acts = [];
  const actionNames = new Map(Object.entries(story.lexicon.actions).map(([id, name]) => [name, id]));
  for (const [alias, id] of Object.entries(story.lexicon.aliases)) actionNames.set(alias, id);

  const ctx = {
    speakers: story.speakers,
    lexicon: story.lexicon,
    text(id, speaker, body, file, line) {
      if (texts.has(id)) fail(`${file}:${line}`, `duplicate text id ${id}`);
      if (FORBIDDEN_TEXT.test(body)) fail(`${file}:${line}`, 'Thai text must not contain en or em dashes or emoji');
      if (Array.from(body).length > 600) fail(`${file}:${line}`, 'text longer than 600 characters');
      texts.set(id, { id, speaker, body });
      receipts[id] = { file, line };
      return id;
    },
    asset(id, where) {
      if (known.has(id)) return id;
      if (!aliases.has(id)) { missingAssets.add(id); return id; }
      const node = where.split(' ').pop().toLowerCase();
      aliasUses.set(id, [...new Set([...(aliasUses.get(id) ?? []), node])]);
      return aliases.get(id);
    },
    round(id, where) { return story.rounds.find((r) => r.id === id) ?? fail(where, `unknown round ${id}`); },
    actionByName(name) { return actionNames.get(name) ?? null; },
    condition(tag, where) {
      let base;
      if (['major', 'route', 'plan'].includes(tag.name) && tag.value) base = { [tag.name]: tag.value };
      else fail(where, `tag ${tagKey(tag)} has no condition mapping in this compiler version`);
      return tag.negated ? { not: base } : base;
    },
    pendingNext: [],
    next(target, where) {
      if (!target) fail(where, 'missing next');
      if (!NODE_ID.test(target)) fail(where, `next ${target} is not a node id`);
      ctx.pendingNext.push({ target, where });
      return nodeId(target);
    },
    warn(kind, message) { warnings.push({ kind, message }); },
  };

  const nodes = [];
  for (const entry of story.acts) {
    const file = entry.blueprint;
    const blueprint = parseBlueprint(await src.blueprint(file), file);
    const spec = { ...structuredClone(await src.mechanics(entry.mechanics)), file: `mechanics/${entry.mechanics}` };
    if (spec.act !== entry.act) fail(spec.file, 'act number differs from story.json');
    const actNodes = compileAct(ctx, blueprint, spec);
    actNodes.forEach((n) => compiledIds.add(n.id));
    nodes.push(...actNodes);
    acts.push({ act: entry.act, title: blueprint.title, entry: actNodes[0].id, flags: spec.flags ?? [] });
  }
  for (const { target, where } of ctx.pendingNext) {
    if (compiledIds.has(nodeId(target))) continue;
    const act = actOf(target);
    if (acts.some((a) => a.act === act)) fail(where, `next ${target} is in a compiled act but does not exist`);
    boundaries.set(nodeId(target), act);
  }
  if (!compiledIds.has(nodeId(story.start.node))) fail('mechanics/story.json', 'start node is not compiled');
  for (const design of aliases.keys()) if (!aliasUses.has(design)) fail('mechanics/story.json', `alias for ${design} is not used by any compiled node`);

  const lexiconTexts = [];
  const lexicon = { intents: {}, actions: {} };
  for (const [id, name] of Object.entries(story.lexicon.intents)) { lexicon.intents[id] = `lex.intent.${id}`; lexiconTexts.push({ id: `lex.intent.${id}`, speaker: 'narrator', body: name }); receipts[`lex.intent.${id}`] = { file: 'mechanics/story.json', line: null }; }
  for (const [id, name] of Object.entries(story.lexicon.actions)) { const t = `lex.action.${id.toLowerCase()}`; lexicon.actions[id] = t; lexiconTexts.push({ id: t, speaker: 'narrator', body: name }); receipts[t] = { file: 'mechanics/story.json', line: null }; }

  const usedRounds = new Set(nodes.filter((n) => n.type === 'clash').map((n) => n.round));
  const characters = [];
  for (const [label, id] of Object.entries(story.speakers)) if (id !== 'narrator' && !characters.some((c) => c.id === id)) characters.push({ id, name: label });
  const pkg = {
    schemaVersion: '3.0.0',
    profile: 'journey',
    package: story.package,
    sourceLocale: story.sourceLocale,
    start: { node: nodeId(story.start.node), meters: story.start.meters },
    acts: acts.map(({ act, title, entry }) => ({ act, title, entry })),
    characters,
    items: story.items,
    flags: [...new Set(acts.flatMap((a) => a.flags))].map((id) => ({ id })),
    rounds: story.rounds.filter((r) => usedRounds.has(r.id)),
    lexicon,
    boundaries: [...boundaries].sort(([a], [b]) => (a < b ? -1 : 1)).map(([node, act]) => ({ node, act })),
    texts: [...lexiconTexts, ...texts.values()],
    nodes,
  };

  // Schema, then every reference the schema annotates.
  const result = createContentSchemaValidator(JOURNEY_SCHEMA_CATALOG).validate(pkg, PACKAGE_SCHEMA_ID);
  if (result.errors.length) fail('package', `schema errors: ${JSON.stringify(result.errors.slice(0, 5))}`);
  const sets = {
    'journey-node': new Set([...pkg.nodes.map((n) => n.id), ...pkg.boundaries.map((b) => b.node)]),
    'journey-text': new Set(pkg.texts.map((t) => t.id)),
    'journey-item': new Set(pkg.items.map((i) => i.id)),
    'journey-flag': new Set(pkg.flags.map((f) => f.id)),
    'journey-round': new Set(pkg.rounds.map((r) => r.id)),
    'journey-character': new Set(pkg.characters.map((c) => c.id)),
  };
  for (const ref of result.references) {
    if (ref.namespace === 'journey-asset') continue;
    if (!sets[ref.namespace]?.has(ref.value)) fail('package', `unresolved ${ref.namespace} reference ${ref.value} at ${ref.path}`);
  }
  const report = {
    package: pkg.package.id,
    contentVersion: pkg.package.contentVersion,
    acts: pkg.acts.map((a) => a.act),
    nodes: pkg.nodes.length,
    texts: pkg.texts.length,
    boundaries: pkg.boundaries.map((b) => b.node),
    assetsMissingFromManifestV2: [...missingAssets].sort(),
    assetAliases: [...aliases].map(([design, uses]) => ({ design, uses, nodes: aliasUses.get(design) })),
    warnings,
  };
  return { package: pkg, receipts, report };
}

export function renderOutputs(compiled) {
  return {
    package: `${JSON.stringify(compiled.package, null, 2)}\n`,
    receipts: `${JSON.stringify(compiled.receipts, null, 2)}\n`,
    report: `${JSON.stringify(compiled.report, null, 2)}\n`,
  };
}

async function main() {
  const rendered = renderOutputs(await compileJourney());
  if (process.argv.includes('--check')) {
    const stale = [];
    for (const [key, url] of Object.entries(OUTPUT_FILES)) {
      let actual = '';
      try { actual = await readFile(url, 'utf8'); } catch { actual = ''; }
      if (actual !== rendered[key]) stale.push(key);
    }
    if (stale.length) { console.error(`ผลของ compiler ไม่ตรงกับไฟล์ที่ commit: ${stale.join(', ')} · รัน node tools/content/compile-journey.mjs`); process.exit(1); }
    console.log('แพ็กเกจ ใบเสร็จ และรายงาน ตรงกับต้นทาง');
    return;
  }
  for (const [key, url] of Object.entries(OUTPUT_FILES)) await writeFile(url, rendered[key], 'utf8');
  console.log('เขียนแพ็กเกจ ใบเสร็จ และรายงานแล้ว');
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  try { await main(); } catch (error) {
    if (error instanceof CompileError) { console.error(`compile ไม่ผ่าน · ${error.message}`); process.exit(1); }
    throw error;
  }
}
