import test from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { JOURNEY_SCHEMA_CATALOG } from "../../src/data/validation/journey-schema-catalog.js";
import { CONTENT_SCHEMA_CATALOG } from "../../src/data/validation/content-schema-catalog.js";
import { createContentSchemaValidator } from "../../src/data/validation/content-schema-validator.js";
import { CATALOG_FILE, readJourneySchemas, renderJourneyCatalog } from "../../tools/schema/build-journey-catalog.mjs";
import {
  PACKAGE_SCHEMA_ID, SAVE_SCHEMA_ID, SCHEMA_BASE, loadMiniJourney, loadJourneySave,
  packageCases, saveCases, worstCaseSave, collectVocabulary,
} from "../helpers/journey-schema-cases.js";

/** Trace: TC-S5-SCHEMA-001, TC-S5-CONTENT-001, TC-S5-SAVE-001/002, ADR-P0-013, ADR-P0-034 D4/D7. */
const validator = createContentSchemaValidator(JOURNEY_SCHEMA_CATALOG);
const errorsOf = (value, schemaId) => validator.validate(value, schemaId).errors;
const schema = (name) => JOURNEY_SCHEMA_CATALOG[`v3.0.0/${name}.schema.json`];

test("TC-S5-SCHEMA-001 journey catalog equals specs/schemas/v3.0.0 and the generator output", async () => {
  const root = new URL("../../specs/schemas/v3.0.0/", import.meta.url);
  const files = (await readdir(root)).filter((name) => name.endsWith(".schema.json")).map((name) => `v3.0.0/${name}`).sort();
  assert.deepEqual(Object.keys(JOURNEY_SCHEMA_CATALOG).sort(), files);
  for (const [path, value] of Object.entries(JOURNEY_SCHEMA_CATALOG)) {
    assert.deepEqual(value, JSON.parse(await readFile(new URL(path.slice("v3.0.0/".length), root), "utf8")), path);
    assert.equal(value.$id, `${SCHEMA_BASE}${path.slice("v3.0.0/".length)}`);
    assert.ok(Object.isFrozen(value));
  }
  assert.equal(await readFile(CATALOG_FILE, "utf8"), renderJourneyCatalog(await readJourneySchemas()));
});

test("TC-S5-SCHEMA-001 journey and legacy catalogs stay separate for the strangler-fig retirement", () => {
  assert.equal(Object.keys(CONTENT_SCHEMA_CATALOG).some((key) => key.startsWith("v3.0.0/")), false);
  assert.equal(Object.keys(JOURNEY_SCHEMA_CATALOG).every((key) => key.startsWith("v3.0.0/journey-")), true);
});

test("TC-S5-SCHEMA-001 journey schemas use only keywords the project validator supports", () => {
  assert.doesNotThrow(() => createContentSchemaValidator(JOURNEY_SCHEMA_CATALOG));
});

test("TC-S5-SCHEMA-001 mini journey fixture is valid and annotates every reference namespace", () => {
  const result = validator.validate(loadMiniJourney(), PACKAGE_SCHEMA_ID);
  assert.deepEqual(result.errors, []);
  const namespaces = new Set(result.references.map((ref) => ref.namespace));
  assert.deepEqual([...namespaces].sort(), [
    "journey-asset", "journey-character", "journey-flag", "journey-item", "journey-node", "journey-round", "journey-text",
  ]);
});

test("TC-S5-CONTENT-001 mini journey fixture covers every word of the closed vocabulary", () => {
  const used = collectVocabulary(loadMiniJourney());
  const common = schema("journey-common").$defs;
  const pkg = schema("journey-package").$defs;
  const sorted = (values) => [...values].sort();
  assert.deepEqual(sorted(used.nodeTypes), sorted(pkg.node.properties.type.enum));
  assert.deepEqual(sorted(used.effects), sorted(common.effect.properties.op.enum));
  assert.deepEqual(sorted(used.conditions), sorted(common.condition.oneOf.map((branch) => branch.required[0])));
  assert.deepEqual(sorted(used.methods), sorted(pkg.obstacleMethod.properties.kind.enum));
  assert.deepEqual(sorted(used.micro), sorted(pkg.micro.properties.kind.enum));
  assert.deepEqual(sorted(used.locks), sorted(pkg.endingOption.properties.locks.items.properties.reason.enum));
});

for (const [name, mutate] of packageCases) {
  test(`TC-S5-SCHEMA-001 journey package rejects ${name}`, () => {
    const value = loadMiniJourney();
    mutate(value);
    assert.notDeepEqual(errorsOf(value, PACKAGE_SCHEMA_ID), [], name);
  });
}

test("TC-S5-SAVE-001 journey save fixture is valid and carries no random generator state", () => {
  const save = loadJourneySave();
  assert.deepEqual(errorsOf(save, SAVE_SCHEMA_ID), []);
  assert.equal(Object.hasOwn(save.payload, "rng"), false);
  assert.equal(save.saveFormatVersion, 2);
  assert.equal(save.profile, "journey-1");
});

for (const [name, mutate] of saveCases) {
  test(`TC-S5-SAVE-001 journey save rejects ${name}`, () => {
    const value = loadJourneySave();
    mutate(value);
    assert.notDeepEqual(errorsOf(value, SAVE_SCHEMA_ID), [], name);
  });
}

test("TC-S5-SAVE-002 the largest save the schema admits stays within 250 KB UTF-8", () => {
  const save = worstCaseSave();
  assert.deepEqual(errorsOf(save, SAVE_SCHEMA_ID), []);
  const bytes = Buffer.byteLength(JSON.stringify(save), "utf8");
  assert.ok(bytes <= 250_000, `worst-case save is ${bytes} bytes`);
});
