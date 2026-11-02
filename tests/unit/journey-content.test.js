import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { CompileError, compileJourney, loadSources, renderOutputs, OUTPUT_FILES, DESIGN_DIR } from "../../tools/content/compile-journey.mjs";
import { INTENTS, ACTIONS, ROUNDS } from "../../docs/design-system/evidence/tactical-clash-engine.mjs";
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

test("TC-S5-CONTENT-001 lexicon names equal the proved engine names", () => {
  for (const [id, textId] of Object.entries(pkg.lexicon.intents)) assert.equal(textsById.get(textId).body, INTENTS[id].th, id);
  for (const [id, textId] of Object.entries(pkg.lexicon.actions)) assert.equal(textsById.get(textId).body, ACTIONS[id].th, id);
  assert.deepEqual(Object.keys(pkg.lexicon.intents).sort(), Object.keys(INTENTS).sort());
  assert.deepEqual(Object.keys(pkg.lexicon.actions).sort(), Object.keys(ACTIONS).sort());
});

test("TC-S5-CLASH-001 every round in the mechanics spec equals the proved engine round", async () => {
  const { story } = await loadSources();
  assert.deepEqual(story.rounds.map((r) => r.id).sort(), Object.keys(ROUNDS).sort());
  for (const round of story.rounds) {
    const engine = ROUNDS[round.id];
    for (const key of ["act", "turns", "p0", "intents", "allies", "siblings", "combos", "light"]) assert.deepEqual(round[key], engine[key], `${round.id}.${key}`);
    assert.equal(round.territory, Boolean(engine.territory), `${round.id}.territory`);
    assert.equal(round.finisherFrom, engine.finisher ? engine.finisherFrom : undefined, `${round.id}.finisherFrom`);
    assert.deepEqual(round.events, Object.entries(engine.events ?? {}).map(([turn, e]) => ({ turn: Number(turn), light: e.p, id: e.id })), `${round.id}.events`);
  }
});

test("TC-S5-CONTENT-001 Act 1 nodes follow the balance model order exactly", () => {
  assert.deepEqual(pkg.nodes.filter((n) => n.act === 1).map((n) => n.id.toUpperCase()), NODE_IDS.act1);
});

test("TC-S5-CONTENT-001 Act 1 prototype ends at the two Act 2 entry boundaries and reports its open findings", () => {
  assert.deepEqual(pkg.boundaries, [{ node: "a2a-01", act: 2 }, { node: "a2b-01", act: 2 }]);
  assert.deepEqual(compiled.report.warnings.map((w) => w.kind), ["clash-response-missing"]);
  assert.ok(compiled.report.assetsMissingFromManifestV2.length > 0);
});

// ---------------------------------------------------------------------------------------
// Fail-closed behaviour on in-memory sources.
// ---------------------------------------------------------------------------------------
const base = await loadSources();
const blueprintText = await base.blueprint("act1-living-keepsake-rewrite-blueprint.md");
const act1 = await base.mechanics("act1.json");
async function compileWith({ blueprint = blueprintText, mechanics = act1, story = base.story } = {}) {
  return compileJourney({ ...base, story, blueprint: async () => blueprint, mechanics: async () => mechanics });
}
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
  ["a round that disagrees with the clash metadata", { story: (() => { const st = structuredClone(base.story); st.rounds.find((r) => r.id === "R1").turns = 4; st.rounds.find((r) => r.id === "R1").intents.push("grow"); return st; })() }, /must match the mechanics round/],
];
for (const [name, input, pattern] of failures) {
  test(`TC-S5-CONTENT-001 compiler fails closed on ${name}`, async () => {
    await assert.rejects(compileWith(input), (error) => error instanceof CompileError && pattern.test(error.message));
  });
}
