import test from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { loadContentPackage, loadContentPackageFromJson } from "../../src/data/content/content-loader.js";
import { validateContentPackage } from "../../src/data/validation/content-validator.js";
import { CONTENT_SCHEMA_CATALOG } from "../../src/data/validation/content-schema-catalog.js";
import { createContentSchemaValidator } from "../../src/data/validation/content-schema-validator.js";

const options = { testReferenceIds: ["tc.content.fixture"] };
const fixture = async (name = "valid-minimal-package") => JSON.parse(await readFile(new URL(`../fixtures/content/${name}.json`, import.meta.url), "utf8"));
const text = (th = "ข้อมูลทดสอบ") => ({ th });
const first = (data) => data.narrativeTrees[0].nodes[0];

test("tc.act1.schema FR-CNT-001/002: canonical Act 1 loads from JSON and object with immutable indexes", async () => {
  const [source, catalogText] = await Promise.all([
    readFile(new URL("../../src/data/content/packages/act-01.json", import.meta.url), "utf8"),
    readFile(new URL("../../src/data/content/packages/act-01-test-catalog.json", import.meta.url), "utf8"),
  ]);
  const actOptions = { testReferenceIds: JSON.parse(catalogText), expectedContentVersion: "2.0.0" };
  const input = JSON.parse(source);
  const before = structuredClone(input);
  const fromJson = loadContentPackageFromJson(source, actOptions);
  const fromObject = await loadContentPackage(input, actOptions);
  for (const result of [fromJson, fromObject]) {
    assert.equal(result.valid, true, JSON.stringify(result.errors));
    assert.equal(result.packageData.schemaVersion, "1.1.0");
    assert.equal(result.entry.tree.treeId, "tree.act1");
    assert.equal(result.entry.node.id, "node.act1.opening");
    assert.equal(Object.keys(result.indexes.nodes).length, 14);
    assert.equal(result.indexes.nodes["node.act1.rest"].completion.kind, "act-rest");
    const walk = (value) => { if (value && typeof value === "object") { assert.ok(Object.isFrozen(value)); Object.values(value).forEach(walk); } };
    walk(result);
    assert.throws(() => { result.indexes.choices["choice.act1.keep-fragment"].effects[0].amount = 100; }, TypeError);
  }
  assert.deepEqual(input, before);
  input.dialogues.dialogues[0].text.th = "เปลี่ยนต้นฉบับภายหลัง";
  assert.notEqual(input.dialogues.dialogues[0].text.th, fromObject.packageData.dialogues.dialogues[0].text.th);
  expectFailure(validateContentPackage(before), "CONTENT_REFERENCE", "testReferenceIds");
  expectFailure(validateContentPackage(before, { ...actOptions, expectedContentVersion: "1.0.0" }), "CONTENT_VERSION", "contentVersion");
});

for (const prefix of ["/", "/JaoKob/"]) test(`tc.act1.schema canonical JSON same-origin load at ${prefix}`, async () => {
  const source = await readFile(new URL("../../src/data/content/packages/act-01.json", import.meta.url), "utf8");
  const testReferenceIds = JSON.parse(await readFile(new URL("../../src/data/content/packages/act-01-test-catalog.json", import.meta.url), "utf8"));
  let requested;
  const result = await loadContentPackage("src/data/content/packages/act-01.json", { testReferenceIds, baseUrl: `https://example.test${prefix}index.html`, fetch: async (url) => {
    requested = url;
    return { ok: true, redirected: false, url, text: async () => source };
  } });
  assert.equal(result.valid, true, JSON.stringify(result.errors));
  assert.equal(String(requested), `https://example.test${prefix}src/data/content/packages/act-01.json`);
  assert.equal(result.entry.node.id, "node.act1.opening");
});

function expectFailure(result, code, path = "$") {
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => e.code === code && e.path.includes(path)), JSON.stringify(result.errors));
  assert.equal(Object.hasOwn(result, "packageData"), false);
  assert.equal(Object.hasOwn(result, "indexes"), false);
  assert.ok(Object.isFrozen(result));
  assert.ok(Object.isFrozen(result.errors));
  for (const e of result.errors) {
    assert.ok(Object.isFrozen(e));
    assert.equal(typeof e.message, "string");
  }
}

async function richFixture() {
  const data = await fixture();
  const rest = first(data);
  const base = { act: 1, title: text(), entryCondition: { kind: "always" }, contentWarningIds: [], checkpointPolicy: "none", testReferenceIds: options.testReferenceIds, onEnterEffects: [] };
  const action = (id) => ({ id, label: text(), condition: { kind: "always" }, unavailableBehavior: "disabled", disabledReason: text(), impact: "standard", effects: [], immediateFeedback: text(), nextNodeId: rest.id });
  const intro = { ...base, id: "node.fixture.intro", type: "cutscene", dialogueIds: ["dialogue.fixture.line"], nextNodeId: "node.fixture.explore" };
  const exploration = { ...base, id: "node.fixture.explore", type: "exploration", description: text(), interactions: [{ ...action("interaction.fixture.observe"), nextNodeId: "node.fixture.decision" }] };
  const decision = { ...base, id: "node.fixture.decision", type: "decision", prompt: text(), choices: [action("choice.fixture.mother"), action("choice.fixture.roots")] };
  decision.choices[0].effects = [{ type: "set-flag", flagId: "memory.home_focus", value: "mother" }];
  decision.choices[0].callbackEventIds = ["event.fixture.callback"];
  data.events.events.push({ id: "event.fixture.callback", category: "observation", title: text(), priority: 10,
    trigger: { type: "choice-committed", choiceId: "choice.fixture.mother" }, conditions: { all: [{ kind: "flag", flagId: "memory.home_focus", operator: "eq", value: "mother" }, { not: { kind: "metric", metric: "hp", operator: "lt", value: 1 } }] }, maxOccurrences: 1,
    resolution: { effects: [{ type: "adjust-flag", flagId: "exploration.safe_observations", amount: 1 }], dialogueIds: ["dialogue.fixture.line"], nextNodeId: rest.id } });
  data.narrativeTrees[0].entryNodeId = intro.id;
  data.narrativeTrees[0].nodes = [intro, exploration, decision, rest];
  return data;
}

test("FR-CNT-001/002 valid object/JSON yield separate deeply immutable records and indexes", async () => {
  const input = await richFixture();
  const before = structuredClone(input);
  const result = await loadContentPackage(input, options);
  assert.equal(result.valid, true, JSON.stringify(result.errors));
  assert.deepEqual(input, before);
  assert.equal(Object.isFrozen(input), false);
  assert.notEqual(result.packageData, input);
  assert.equal(result.entry.tree, result.indexes.trees["tree.fixture"]);
  assert.equal(result.entry.node, result.indexes.nodes["node.fixture.intro"]);
  assert.equal(result.indexes.choices["choice.fixture.mother"].effects[0].value, "mother");
  assert.ok(result.indexes.checkpoints["checkpoint.fixture.rest"]);
  const walk = (v) => { if (v && typeof v === "object") { assert.ok(Object.isFrozen(v)); Object.values(v).forEach(walk); } };
  walk(result);
  assert.throws(() => { result.entry.node.title.th = "changed"; }, TypeError);
  assert.throws(() => { result.indexes.nodes.injected = {}; }, TypeError);
  first(input).title.th = "input changed";
  assert.notEqual(result.entry.node.title.th, first(input).title.th);
  assert.deepEqual(loadContentPackageFromJson(JSON.stringify(before), options).packageData, result.packageData);
});

for (const [name, code, path] of [
  ["invalid-missing-fields", "CONTENT_SCHEMA", "gameDefaults"],
  ["invalid-dangling-reference", "CONTENT_REFERENCE", "dialogueIds"],
  ["invalid-duplicate-id", "CONTENT_DUPLICATE_ID", "dialogues"],
  ["invalid-flag-policy", "CONTENT_FLAG_POLICY", "defaultValue"],
]) test(`FR-CNT-001/002 fixture ${name} fails with code and path`, async () => {
  expectFailure(await loadContentPackage(await fixture(name), options), code, path);
});

const invalidCases = [
  ["future package version", (p) => { p.schemaVersion = "2.0.0"; }, "CONTENT_VERSION", "schemaVersion"],
  ["numeric package version", (p) => { p.schemaVersion = 1.1; }, "CONTENT_VERSION", "schemaVersion"],
  ["mixed tree schema version", (p) => { p.narrativeTrees[0].schemaVersion = "1.0.0"; }, "CONTENT_VERSION", "schemaVersion"],
  ["future nested catalog version", (p) => { p.events.schemaVersion = "2.0.0"; }, "CONTENT_VERSION", "events.schemaVersion"],
  ["invalid content semver", (p) => { p.contentVersion = "release"; }, "CONTENT_SCHEMA", "contentVersion"],
  ["missing schema version", (p) => { delete p.schemaVersion; }, "CONTENT_SCHEMA", "schemaVersion"],
  ["missing Thai", (p) => { delete p.dialogues.dialogues[0].text.th; }, "CONTENT_SCHEMA", ".text.th"],
  ["missing nested settings", (p) => { delete p.gameDefaults.settings.locale; }, "CONTENT_SCHEMA", "settings.locale"],
  ["numeric string meter", (p) => { p.gameDefaults.metrics.hp = "80"; }, "CONTENT_SCHEMA", "metrics.hp"],
  ["fractional meter", (p) => { p.gameDefaults.metrics.hp = 80.5; }, "CONTENT_SCHEMA", "metrics.hp"],
  ["meter bounds", (p) => { p.gameDefaults.metrics.hp = 101; }, "CONTENT_SCHEMA", "metrics.hp"],
  ["settings boolean coercion", (p) => { p.gameDefaults.settings.storyAssist = 1; }, "CONTENT_SCHEMA", "storyAssist"],
  ["settings numeric bounds", (p) => { p.gameDefaults.settings.fontScale = 3; }, "CONTENT_SCHEMA", "fontScale"],
  ["unknown root property", (p) => { p.script = "execute"; }, "CONTENT_SCHEMA", ".script"],
  ["unknown dialogue variant field", (p) => { p.dialogues.dialogues[0].variants = []; }, "CONTENT_SCHEMA", ".variants"],
  ["unknown effect", (p) => { first(p).onEnterEffects = [{ type: "execute", source: "untrusted" }]; }, "CONTENT_SCHEMA", "onEnterEffects"],
  ["wrong condition type", (p) => { first(p).entryCondition = "hp > 0"; }, "CONTENT_SCHEMA", "entryCondition"],
  ["bad locale key", (p) => { first(p).title.Thai = "wrong"; }, "CONTENT_SCHEMA", ".title.Thai"],
  ["blank Thai", (p) => { first(p).title.th = "  "; }, "CONTENT_SEMANTIC", ".title.th"],
  ["HTML injection", (p) => { first(p).title.th = '<img src=x onerror="alert(1)">'; }, "CONTENT_SEMANTIC", ".title.th"],
  ["missing Thai supported locale", (p) => { p.supportedLocales = ["en"]; }, "CONTENT_SCHEMA", "supportedLocales"],
  ["unsupported default locale", (p) => { p.gameDefaults.settings.locale = "en"; }, "CONTENT_SEMANTIC", "settings.locale"],
  ["duplicate locales", (p) => { p.supportedLocales.push("th"); }, "CONTENT_SCHEMA", "supportedLocales"],
  ["wrong catalog object shape", (p) => { p.characters = []; }, "CONTENT_SCHEMA", "characters"],
  ["missing character", (p) => { p.characters.characters = []; }, "CONTENT_SCHEMA", "characters"],
  ["character enum", (p) => { p.characters.characters[0].visualProfile.lifeStage = "dragon"; }, "CONTENT_SCHEMA", "lifeStage"],
  ["unequal localized lists", (p) => { p.characters.characters[0].traits.en = ["one", "two"]; }, "CONTENT_SEMANTIC", "traits"],
  ["missing speaker", (p) => { p.dialogues.dialogues[0].speakerCharacterId = "character.absent"; }, "CONTENT_REFERENCE", "speakerCharacterId"],
  ["missing entry tree", (p) => { p.entryTreeId = "tree.absent"; }, "CONTENT_REFERENCE", "entryTreeId"],
  ["missing node", (p) => { p.narrativeTrees[0].entryNodeId = "node.absent"; }, "CONTENT_REFERENCE", "entryNodeId"],
  ["duplicate node", (p) => { p.narrativeTrees[0].nodes.push(structuredClone(first(p))); }, "CONTENT_DUPLICATE_ID", "nodes[1]"],
  ["duplicate cross-catalog ID", (p) => { p.characters.characters[0].id = p.dialogues.dialogues[0].id; }, "CONTENT_DUPLICATE_ID", "dialogues"],
  ["missing warning", (p) => { first(p).contentWarningIds = ["warning.absent"]; }, "CONTENT_REFERENCE", "contentWarningIds"],
  ["missing portrait", (p) => { p.characters.characters[0].visualProfile.defaultPortraitAssetId = "asset.absent"; }, "CONTENT_REFERENCE", "defaultPortraitAssetId"],
  ["dialogue delivery enum", (p) => { p.dialogues.dialogues[0].delivery.emotion = "unknown"; }, "CONTENT_SCHEMA", "emotion"],
  ["missing test reference", (p) => { first(p).testReferenceIds = ["tc.absent"]; }, "CONTENT_REFERENCE", "testReferenceIds"],
  ["checkpoint none with ID", (p) => { first(p).checkpointPolicy = "none"; delete first(p).completion; first(p).nextNodeId = "node.missing"; }, "CONTENT_SEMANTIC", "checkpointId"],
  ["rest needs checkpoint", (p) => { delete first(p).checkpointId; }, "CONTENT_SCHEMA", "checkpointId"],
  ["rest cannot also target a node", (p) => { first(p).nextNodeId = first(p).id; }, "CONTENT_SCHEMA", "nodes[0]"],
  ["rest cannot claim Act 2", (p) => { first(p).act = 2; }, "CONTENT_SCHEMA", "nodes[0]"],
  ["rest needs marker effect", (p) => { first(p).onEnterEffects = []; }, "CONTENT_SEMANTIC", "completion.flagId"],
  ["rest cannot be fake ending", (p) => { first(p).type = "ending"; }, "CONTENT_SCHEMA", "nodes[0]"],
  ["flag default type", (p) => { p.flagDefinitions[0].defaultValue = "false"; }, "CONTENT_FLAG_POLICY", "defaultValue"],
  ["marker must start false", (p) => { p.flagDefinitions[0].defaultValue = true; }, "CONTENT_FLAG_POLICY", "defaultValue"],
  ["missing explicit policy", (p) => { delete p.flagDefinitions[1].policy; }, "CONTENT_SCHEMA", "policy"],
  ["counter bounds inverted", (p) => { p.flagDefinitions[1].policy.min = 30; }, "CONTENT_FLAG_POLICY", "policy"],
  ["counter must saturate", (p) => { p.flagDefinitions[1].policy.overflow = "reject"; }, "CONTENT_FLAG_POLICY", "policy"],
  ["counter must be monotonic", (p) => { p.flagDefinitions[1].policy.monotonic = false; }, "CONTENT_FLAG_POLICY", "policy"],
  ["unknown enum default", (p) => { p.flagDefinitions[2].defaultValue = "other"; }, "CONTENT_FLAG_POLICY", "defaultValue"],
  ["enum missing unset default", (p) => { p.flagDefinitions[2].policy.values.shift(); }, "CONTENT_FLAG_POLICY", "policy"],
  ["unknown policy field", (p) => { p.flagDefinitions[2].policy.script = true; }, "CONTENT_SCHEMA", "policy"],
  ["flag condition type", (p) => { first(p).entryCondition = { kind: "flag", flagId: "keepsake.lily_fragment", operator: "eq", value: "false" }; }, "CONTENT_FLAG_POLICY", "entryCondition.value"],
  ["unknown flag reference", (p) => { first(p).onEnterEffects[0].flagId = "flag.absent"; }, "CONTENT_REFERENCE", "flagId"],
  ["marker reset", (p) => { first(p).onEnterEffects[0].value = false; }, "CONTENT_FLAG_POLICY", "onEnterEffects"],
  ["monotonic counter decrease", (p) => { first(p).onEnterEffects.push({ type: "adjust-flag", flagId: "exploration.safe_observations", amount: -1 }); }, "CONTENT_FLAG_POLICY", "onEnterEffects"],
  ["counter direct assignment", (p) => { first(p).onEnterEffects.push({ type: "set-flag", flagId: "exploration.safe_observations", value: 5 }); }, "CONTENT_FLAG_POLICY", "onEnterEffects"],
  ["unknown enum assignment", (p) => { first(p).onEnterEffects.push({ type: "set-flag", flagId: "memory.home_focus", value: "other" }); }, "CONTENT_FLAG_POLICY", ".value"],
  ["non-reversible clear", (p) => { first(p).onEnterEffects.push({ type: "clear-flag", flagId: "keepsake.lily_fragment" }); }, "CONTENT_FLAG_POLICY", "onEnterEffects"],
  ["boolean cannot increment", (p) => { first(p).onEnterEffects.push({ type: "adjust-flag", flagId: "keepsake.lily_fragment", amount: 1 }); }, "CONTENT_FLAG_POLICY", "onEnterEffects"],
  ["Act 1 Bond effect", (p) => { first(p).onEnterEffects.push({ type: "adjust-metric", metric: "bond", amount: 1 }); }, "CONTENT_SEMANTIC", "onEnterEffects"],
  ["conflicting metric effects", (p) => { first(p).onEnterEffects.push({ type: "set-metric", metric: "hp", value: 80 }, { type: "adjust-metric", metric: "hp", amount: 5 }); }, "CONTENT_SEMANTIC", "onEnterEffects"],
  ["conflicting flag effects", (p) => { first(p).onEnterEffects.push(structuredClone(first(p).onEnterEffects[0])); }, "CONTENT_SEMANTIC", "onEnterEffects"],
  ["missing checkpoint target", (p) => { first(p).onEnterEffects.push({ type: "set-checkpoint", checkpointId: "checkpoint.absent" }); }, "CONTENT_REFERENCE", "checkpointId"],
];
for (const [name, mutate, code, path] of invalidCases) test(`FR-CNT-001/002 DR-* rejects ${name}`, async () => {
  const data = await fixture(); mutate(data);
  expectFailure(validateContentPackage(data, options), code, path);
});

const richInvalid = [
  ["dangling next node", (p) => { first(p).nextNodeId = "node.absent"; }, "CONTENT_REFERENCE", "nextNodeId"],
  ["unguarded cutscene cycle", (p) => { first(p).nextNodeId = first(p).id; }, "CONTENT_SEMANTIC", "nextNodeId"],
  ["disabled reason", (p) => { delete p.narrativeTrees[0].nodes[2].choices[0].disabledReason; }, "CONTENT_SEMANTIC", "disabledReason"],
  ["duplicate interaction/choice", (p) => { p.narrativeTrees[0].nodes[1].interactions[0].id = "choice.fixture.mother"; }, "CONTENT_DUPLICATE_ID", "interactions"],
  ["missing callback event", (p) => { p.narrativeTrees[0].nodes[2].choices[0].callbackEventIds = ["event.absent"]; }, "CONTENT_REFERENCE", "callbackEventIds"],
  ["missing trigger choice", (p) => { p.events.events[0].trigger.choiceId = "choice.absent"; }, "CONTENT_REFERENCE", "choiceId"],
  ["event unknown condition flag", (p) => { p.events.events[0].conditions = { kind: "flag", flagId: "flag.absent", operator: "exists" }; }, "CONTENT_REFERENCE", "flagId"],
  ["event bounds", (p) => { p.events.events[0].maxOccurrences = 0; }, "CONTENT_SCHEMA", "maxOccurrences"],
  ["event bad effect", (p) => { p.events.events[0].resolution.effects[0].amount = "1"; }, "CONTENT_SCHEMA", "effects"],
  ["node-only field on choice", (p) => { p.narrativeTrees[0].nodes[2].choices[0].checkpointPolicy = "none"; }, "CONTENT_SCHEMA", "checkpointPolicy"],
  ["duplicate checkpoint", (p) => { first(p).checkpointId = "checkpoint.fixture.rest"; first(p).checkpointPolicy = "before-node"; }, "CONTENT_DUPLICATE_ID", "checkpointId"],
  ["checkpoint policy without ID", (p) => { first(p).checkpointPolicy = "before-node"; }, "CONTENT_SEMANTIC", "checkpointId"],
];
for (const [name, mutate, code, path] of richInvalid) test(`FR-CNT-002 nested ${name}`, async () => {
  const p = await richFixture(); mutate(p); expectFailure(validateContentPackage(p, options), code, path);
});

test("CR-0002 D2 permits initial unset, known enum choices and positive saturating counter adjustments", async () => {
  const p = await richFixture();
  p.events.events[0].resolution.effects[0].amount = 30;
  assert.equal(validateContentPackage(p, options).valid, true);
  // This layer validates, never applies the increment or advances a marker.
  assert.equal(p.flagDefinitions[1].defaultValue, 0);
});

test("FR-CNT-004 wrong requested content version cannot silently load", async () => {
  expectFailure(await loadContentPackage(await fixture(), { ...options, expectedContentVersion: "9.0.0" }), "CONTENT_VERSION", "contentVersion");
});

test("DR-001 test-reference catalog is external, required and rejects duplicates", async () => {
  expectFailure(await loadContentPackage(await fixture()), "CONTENT_REFERENCE", "testReferenceIds");
  expectFailure(await loadContentPackage(await fixture(), { testReferenceIds: ["tc.content.fixture", "tc.content.fixture"] }), "CONTENT_REFERENCE", "$options");
});

for (const bad of [null, [], 1, true, undefined, () => true, NaN, Infinity, 1n, Symbol("value")]) {
  test(`NFR-SE-002 non-JSON/root type ${String(bad)} is rejected without coercion`, () => {
    expectFailure(validateContentPackage(bad, options), "CONTENT_SCHEMA");
  });
}

test("NFR-SE-002 getters/toJSON/custom prototypes/sparse arrays/cycles fail without running accessors", async () => {
  let called = 0;
  const getter = await fixture(); Object.defineProperty(getter, "trap", { enumerable: true, get() { called += 1; throw Error(); } });
  const toJson = await fixture(); toJson.toJSON = () => { called += 1; return {}; };
  const cycle = await fixture(); cycle.extra = cycle;
  const sparse = await fixture(); sparse.assets = Array(2);
  const exotic = await fixture(); exotic.extra = new Date();
  const forgedFailure = new Proxy({}, { ownKeys() { throw { valid: false, errors: ["untrusted forged outcome"] }; } });
  for (const value of [getter, toJson, cycle, sparse, exotic, forgedFailure]) expectFailure(validateContentPackage(value, options), "CONTENT_SCHEMA");
  assert.equal(called, 0);
});

test("NFR-SE-002 cyclic/deep hostile input is bounded, diagnostics never echo content", async () => {
  const p = await fixture(); let cursor = p;
  for (let i = 0; i < 100; i += 1) { cursor.extra = {}; cursor = cursor.extra; }
  expectFailure(validateContentPackage(p, options), "CONTENT_LIMIT");
  const malformed = loadContentPackageFromJson('{"private": "do-not-echo"');
  expectFailure(malformed, "CONTENT_PARSE");
  assert.equal(JSON.stringify(malformed).includes("do-not-echo"), false);
});

test("NFR-SE-002 __proto__ cannot pollute indexes or records", () => {
  const p = JSON.parse('{"schemaVersion":"1.1.0","__proto__":{"polluted":true}}');
  expectFailure(validateContentPackage(p, options), "CONTENT_SCHEMA");
  assert.equal({}.polluted, undefined);
});

test("CR-0002 D4 frozen catalog exactly matches all local content schema sources", async () => {
  const root = new URL("../../specs/schemas/", import.meta.url);
  const rootFiles = (await readdir(root)).filter((name) => name.endsWith(".json") && name !== "save-state.schema.json");
  const versioned = (await readdir(new URL("v1.1.0/", root))).map((name) => `v1.1.0/${name}`);
  assert.deepEqual(Object.keys(CONTENT_SCHEMA_CATALOG).sort(), [...rootFiles, ...versioned].sort());
  for (const [path, schema] of Object.entries(CONTENT_SCHEMA_CATALOG)) {
    assert.deepEqual(schema, JSON.parse(await readFile(new URL(path, root), "utf8")), path);
    assert.ok(Object.isFrozen(schema));
  }
});

test("CR-0002 D1 old 1.0 schema remains supported and never accepts the new rest fields", async () => {
  const p = await fixture(); p.schemaVersion = "1.0.0"; p.narrativeTrees[0].schemaVersion = "1.0.0";
  expectFailure(validateContentPackage(p, options), "CONTENT_SCHEMA");
  p.flagDefinitions = [];
  const n = first(p); delete n.completion; delete n.dialogueIds;
  n.type = "game-over"; n.onEnterEffects = []; n.summary = text(); n.retryNodeId = "node.fixture.retry";
  n.checkpointPolicy = "none"; delete n.checkpointId;
  p.narrativeTrees[0].nodes.push({ ...n, id: "node.fixture.retry", type: "cutscene", dialogueIds: ["dialogue.fixture.line"], nextNodeId: n.id, checkpointPolicy: "none" });
  const retry = p.narrativeTrees[0].nodes[1]; delete retry.summary; delete retry.retryNodeId; delete retry.checkpointId;
  assert.equal(validateContentPackage(p, options).valid, true);
});

test("Draft 2020-12 local refs apply sibling assertions, Unicode lengths and conditional required fields", () => {
  const id = "https://example.invalid/local.schema.json";
  const checker = createContentSchemaValidator({ test: { $id: id, $defs: { word: { type: "string", minLength: 1 } }, type: "object",
    properties: { name: { $ref: "#/$defs/word", maxLength: 1 }, image: { type: "boolean" }, alt: { type: "string" } }, additionalProperties: false,
    allOf: [{ if: { properties: { image: { const: true } }, required: ["image"] }, then: { required: ["alt"] } }] } });
  assert.equal(checker.validate({ name: "🐸" }, id).errors.length, 0);
  assert.ok(checker.validate({ name: "ab" }, id).errors.length);
  assert.ok(checker.validate({ image: true }, id).errors.some((e) => e.path === "$.alt"));
  assert.equal(checker.validate({ image: false }, id).errors.length, 0);
});

test("CR-0002 D4 unknown keywords, unsupported formats and non-local refs fail closed", () => {
  for (const schema of [{ $ref: "https://external.invalid/schema" }, { unevaluatedProperties: false }, { format: "email" }]) {
    assert.throws(() => createContentSchemaValidator({ bad: { $id: "https://example.invalid/schema", ...schema } }), TypeError);
  }
});

test("Draft 2020-12 oneOf/anyOf/not/arrays enforce exact alternatives and structural uniqueness", () => {
  const id = "https://example.invalid/local.schema.json";
  const cases = [
    [{ oneOf: [{ type: "integer" }, { type: "number" }] }, 1, false],
    [{ oneOf: [{ type: "integer" }, { type: "number" }] }, 1.5, true],
    [{ anyOf: [{ type: "integer" }, { type: "number" }] }, 1, true],
    [{ not: { const: "forbidden" } }, "forbidden", false],
    [{ type: "array", minItems: 2, maxItems: 3, items: { type: "boolean" } }, [true], false],
    [{ type: "array", maxItems: 1 }, [true, false], false],
    [{ uniqueItems: true }, [{ a: 1, b: 2 }, { b: 2, a: 1 }], false],
    [{ type: "string", minLength: 2, maxLength: 2 }, "🐸ก", true],
    [{ type: "string", maxLength: 1 }, "🐸ก", false],
    [{ type: "integer" }, true, false],
    [{ type: "number", minimum: 0, maximum: 1 }, 0.5, true],
    [{ type: "object", properties: { th: { type: "string" } }, patternProperties: { "^th$": { minLength: 2 } }, additionalProperties: false }, { th: "a" }, false],
  ];
  for (const [s, value, valid] of cases) {
    const checker = createContentSchemaValidator({ test: { $id: id, ...s } });
    assert.equal(checker.validate(value, id).errors.length === 0, valid, JSON.stringify({ s, value }));
  }
  assert.throws(() => createContentSchemaValidator({ bad: { $id: id, $ref: "#/$defs/missing" } }), TypeError);
});

test("FR-CNT-006 assets require provenance and conditional image alt; relative paths and URI formats are asserted", async () => {
  const p = await fixture();
  p.assets.push({ id: "asset.fixture.portrait", type: "image", path: "assets/fixture.png", alt: text(), rights: { origin: "original", licenseId: "fixture-license", sourceUrl: "https://example.test/source" } });
  p.characters.characters[0].visualProfile.defaultPortraitAssetId = "asset.fixture.portrait";
  assert.equal(validateContentPackage(p, options).valid, true);
  for (const mutate of [
    (x) => { delete x.assets[0].alt; },
    (x) => { delete x.assets[0].rights.licenseId; },
    (x) => { x.assets[0].rights.origin = "unknown"; },
    (x) => { x.assets[0].path = "../escape.png"; },
    (x) => { x.assets[0].path = "/absolute.png"; },
    (x) => { x.assets[0].path = "https://other.test/file.png"; },
    (x) => { x.assets[0].rights.sourceUrl = "not a URI"; },
    (x) => { x.assets[0].rights.sourceUrl = "https://example.test/%bad%escape"; },
    (x) => { x.assets[0].rights.sourceUrl = "https://example.test/path[invalid]"; },
  ]) {
    const copy = structuredClone(p); mutate(copy);
    expectFailure(validateContentPackage(copy, options), "CONTENT_SCHEMA", "assets[0]");
  }
});

for (const base of ["https://example.test/", "https://example.test/JaoKob/"]) test(`NFR-PO-002 same-origin JSON fetch resolves below ${base}`, async () => {
  const data = await fixture(); const calls = [];
  const result = await loadContentPackage("src/data/content/packages/act-01.json", { ...options, baseUrl: base,
    fetch: async (url, init) => { calls.push({ url, init }); return { ok: true, url, redirected: false, text: async () => JSON.stringify(data) }; } });
  assert.equal(result.valid, true);
  assert.equal(calls[0].url, `${base}src/data/content/packages/act-01.json`);
  assert.deepEqual(calls[0].init, { credentials: "omit", redirect: "error", mode: "same-origin" });
});

for (const source of ["https://other.test/data.json", "//other.test/data.json", "file:///tmp/package.json", "data:application/json,{}", "javascript:alert(1)", "https://user:pass@example.test/data.json", "/data.json#fragment"]) test(`NFR-SE-002 rejects URL ${source} before reading`, async () => {
  let called = false;
  expectFailure(await loadContentPackage(source, { ...options, baseUrl: "https://example.test/JaoKob/", fetch: async () => { called = true; } }), "CONTENT_ORIGIN");
  assert.equal(called, false);
});

for (const [name, response, code] of [
  ["HTTP error", { ok: false }, "CONTENT_LOAD"],
  ["redirect", { ok: true, redirected: true }, "CONTENT_ORIGIN"],
  ["cross-origin response", { ok: true, url: "https://other.test/data" }, "CONTENT_ORIGIN"],
  ["invalid JSON", { ok: true, text: async () => "{" }, "CONTENT_PARSE"],
  ["read error", { ok: true, text: async () => { throw Error("do-not-echo"); } }, "CONTENT_LOAD"],
]) test(`FR-CNT-001 load fault ${name} returns typed failure without partial data`, async () => {
  expectFailure(await loadContentPackage("data.json", { ...options, baseUrl: "https://example.test/", fetch: async () => response }), code);
});

test("FR-CNT-001 rejected fetch is recoverable and JSON reader rejects non-text input", async () => {
  expectFailure(await loadContentPackage("data.json", { ...options, baseUrl: "https://example.test/", fetch: async () => { throw Error("network private detail"); } }), "CONTENT_LOAD");
  expectFailure(loadContentPackageFromJson({}), "CONTENT_PARSE");
  expectFailure(await loadContentPackage("data.json", { baseUrl: "not a URL" }), "CONTENT_ORIGIN");
});
