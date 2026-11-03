import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { CompileError, compileJourney, loadSources, renderOutputs, OUTPUT_FILES, DESIGN_DIR } from "../../tools/content/compile-journey.mjs";
import { ACTION_IDS, INTENTS } from "../../src/core/domain/clash/clash-rules.js";
import { assertRound } from "../../src/core/domain/clash/clash-engine.js";
import { NODE_IDS } from "../../docs/design-system/evidence/five-act-balance-model.mjs";

/** Trace: TC-S5-CONTENT-001, TC-S5-CLASH-001 (round tables), ADR-P0-034 D5/D6, UX §0 rule 7. */
const compiled = await compileJourney();
const pkg = compiled.package;
const textsById = new Map(pkg.texts.map((t) => [t.id, t]));

test("TC-S5-CONTENT-001 committed package, receipts and report equal a fresh compile (drift gate)", async () => {
  const rendered = renderOutputs(compiled);
  for (const [key, url] of Object.entries(OUTPUT_FILES)) assert.equal(await readFile(url, "utf8"), rendered[key], key);
});

test("TC-S5-CONTENT-001 every story text is quoted verbatim from the blueprint line its receipt names", async () => {
  const cache = new Map();
  const lines = async (file) => {
    if (!cache.has(file)) cache.set(file, (await readFile(new URL(file, DESIGN_DIR), "utf8")).split("\n"));
    return cache.get(file);
  };
  let checked = 0;
  for (const [id, receipt] of Object.entries(compiled.receipts)) {
    const text = textsById.get(id);
    assert.ok(text, `receipt without text ${id}`);
    if (receipt.line === null) continue;
    const source = (await lines(receipt.file))[receipt.line - 1];
    assert.ok(source.includes(text.body), `${id} not found at ${receipt.file}:${receipt.line}`);
    checked++;
  }
  assert.equal(Object.keys(compiled.receipts).length, pkg.texts.length);
  assert.ok(checked > 100);
});

test("TC-S5-CONTENT-001 the lexicon names every Core intent and action once, in Thai from the mechanics source", () => {
  assert.deepEqual(Object.keys(pkg.lexicon.intents), [...INTENTS]);
  assert.deepEqual(Object.keys(pkg.lexicon.actions), [...ACTION_IDS]);
  for (const textId of [...Object.values(pkg.lexicon.intents), ...Object.values(pkg.lexicon.actions)]) assert.match(textsById.get(textId).body, /^[\u0E00-\u0E7F][\u0E00-\u0E7F .♡]*$/u, textId);
});

test("TC-S5-CLASH-001 the six rounds of the mechanics source are rounds Core can run (the parity trace pins their behaviour)", async () => {
  const { story } = await loadSources();
  assert.deepEqual(story.rounds.map((r) => r.id), ["R1", "R2", "R3", "R4A", "R4B", "R5"]);
  for (const round of story.rounds) assert.doesNotThrow(() => assertRound(round), round.id);
  assert.deepEqual(pkg.rounds, story.rounds.filter((r) => r.id === "R1"), "the package carries the rounds its nodes use");
});

test("TC-S5-BALANCE-001 the balance model plays Act 1 from the compiled package, in blueprint order", async () => {
  const blueprint = await readFile(new URL("act1-living-keepsake-rewrite-blueprint.md", DESIGN_DIR), "utf8");
  const headings = [...blueprint.matchAll(/^### (A1-\d{2}) · /gm)].map((m) => m[1]);
  assert.deepEqual(pkg.nodes.filter((n) => n.act === 1).map((n) => n.id.toUpperCase()), headings);
  assert.deepEqual(NODE_IDS.act1, headings);
});

test("TC-S5-CONTENT-001 Act 1 prototype ends at the two Act 2 entry boundaries with no open findings", () => {
  assert.deepEqual(pkg.boundaries, [{ node: "a2a-01", act: 2 }, { node: "a2b-01", act: 2 }]);
  assert.deepEqual(compiled.report.warnings, []);
  assert.deepEqual(compiled.report.assetsMissingFromManifestV2, []);
  assert.ok(pkg.texts.some((t) => t.id === "a1-08.p.grit"), "R1 answers ฝืนรุก (PO decision 2026-11-04)");
});

test("TC-S5-CONTENT-001 interim asset aliases are exactly the four the PO allowed and point at delivered images", async () => {
  const { manifest } = await loadSources();
  const known = new Set(Object.values(manifest.categories).flat().map((a) => a.assetId));
  assert.deepEqual(compiled.report.assetAliases.map(({ design, uses }) => [design, uses]), [
    ["cg_act1_three_siblings_weir", "cg_act1_three_siblings_blue_shirt"],
    ["char_cockroach_man_boast_button", "char_cockroach_man_shadow_boast"],
    ["char_jao_kab_child_neutral", "char_jao_kab_neutral_proud"],
    ["char_jao_kib_child_neutral", "char_jao_kib_neutral_cheerful"],
  ]);
  const staged = pkg.nodes.flatMap((n) => [n.stage.bg, n.stage.cg, ...n.stage.slots.map((s) => s.asset)].filter(Boolean));
  for (const id of staged) assert.ok(known.has(id), `${id} is staged but not in manifest v2`);
  for (const { design } of compiled.report.assetAliases) assert.ok(!staged.includes(design), `${design} must be aliased in the package`);
});

// ---------------------------------------------------------------------------------------
// Fail-closed behaviour on in-memory sources.
// ---------------------------------------------------------------------------------------
const base = await loadSources();
const blueprintText = await base.blueprint("act1-living-keepsake-rewrite-blueprint.md");
const act1 = await base.mechanics("act1.json");
async function compileWith({ blueprint = blueprintText, mechanics = act1, story = base.story, manifest = base.manifest } = {}) {
  return compileJourney({ ...base, story, manifest, blueprint: async () => blueprint, mechanics: async () => mechanics });
}
const withStory = (mutate) => { const st = structuredClone(base.story); mutate(st); return st; };
const mutatedSpec = (mutate) => { const spec = structuredClone(act1); mutate(spec); return spec; };

const failures = [
  ["an unknown speaker", { blueprint: blueprintText.replace("> กิบ: กิ๊บ-กิ๊บ!", "> คนแปลกหน้า: กิ๊บ-กิ๊บ!") }, /unknown speaker/],
  ["an em dash in story text", { blueprint: blueprintText.replace("ฝนเพิ่งซาที่บึงน้ำใส", "ฝนเพิ่งซา—ที่บึงน้ำใส") }, /dashes or emoji/],
  ["an unknown clash tag", { blueprint: blueprintText.replace("> {t2} บรรยาย: ผ้าคลุมพองลม", "> {t9} บรรยาย: ผ้าคลุมพองลม") }, /unknown clash tag|turn beyond/],
  ["an unknown metadata key", { blueprint: blueprintText.replace("`mode: vn` `bg: bg_act1_willow_roots`", "`mode: vn` `music: storm` `bg: bg_act1_willow_roots`") }, /unknown metadata key/],
  ["a node mode the compiler does not support yet", { blueprint: blueprintText.replace("### A1-09 · ด้ายที่ขาดกับกระดุมที่หาย\n`mode: vn`", "### A1-09 · ด้ายที่ขาดกับกระดุมที่หาย\n`mode: pouch`") }, /not supported/],
  ["a blueprint option without a mechanics entry", { mechanics: mutatedSpec((s) => { delete s.nodes["A1-03"].options["major:eye"]; }) }, /no mechanics entry/],
  ["a mechanics entry without a blueprint option", { mechanics: mutatedSpec((s) => { s.nodes["A1-06"].options["o:rush"] = { method: { kind: "rush" } }; }) }, /without a blueprint option/],
  ["prose staging without a slots override", { mechanics: mutatedSpec((s) => { delete s.nodes["A1-08"].stage; }) }, /staging cell is prose/],
  ["a micro hint that is not quoted from the blueprint", { mechanics: mutatedSpec((s) => { s.nodes["A1-12"].micro.hint = "เคาะเร็ว ๆ"; }) }, /must be quoted/],
  ["next into a compiled act that does not exist", { mechanics: mutatedSpec((s) => { s.nodes["A1-05"].next = "A1-99"; }) }, /does not exist/],
  ["mechanics nodes out of blueprint order", { mechanics: mutatedSpec((s) => { const n = s.nodes; const { "A1-01": first, ...rest } = n; s.nodes = { ...rest, "A1-01": first }; }) }, /node ids differ/],
  ["an alias kept after the real asset reached manifest v2", { manifest: (() => { const m = structuredClone(base.manifest); m.categories.cinematicCGs.push({ assetId: "cg_act1_three_siblings_weir" }); return m; })() }, /remove its alias/],
  ["an alias that points at an image manifest v2 does not hold", { story: withStory((st) => { st.assetAliases.char_jao_kab_child_neutral = "char_jao_kab_child_missing"; }) }, /is not in manifest v2/],
  ["an alias no compiled node uses", { story: withStory((st) => { st.assetAliases.bg_act2_unused = "bg_act1_willow_roots"; }) }, /not used by any compiled node/],
  ["a round that disagrees with the clash metadata", { story: (() => { const st = structuredClone(base.story); st.rounds.find((r) => r.id === "R1").turns = 4; st.rounds.find((r) => r.id === "R1").intents.push("grow"); return st; })() }, /must match the mechanics round/],
];
for (const [name, input, pattern] of failures) {
  test(`TC-S5-CONTENT-001 compiler fails closed on ${name}`, async () => {
    await assert.rejects(compileWith(input), (error) => error instanceof CompileError && pattern.test(error.message));
  });
}
