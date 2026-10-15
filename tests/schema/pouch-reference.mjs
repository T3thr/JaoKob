/** Independent Draft 2020-12 reference validation. Development-only Ajv.
 * Trace: TC-S4-CONTRACT-001, ADR-P0-020. No network schema resolution.
 */
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { validatePouch } from "../../src/core/domain/keepsake-pouch.js";
import { validateSaveEnvelope } from "../../src/data/validation/save-envelope-validator.js";

if (!process.env.JKB_AJV_PATH) throw new Error("Set JKB_AJV_PATH to the development Ajv Draft 2020-12 module.");
const { default: Ajv2020 } = await import(pathToFileURL(process.env.JKB_AJV_PATH).href);
const ajv = new Ajv2020({ strict: false, allErrors: true, validateFormats: false });
const root = new URL("../../specs/schemas/", import.meta.url);
const json = async (url) => JSON.parse(await readFile(url, "utf8"));
let schemas = 0, cases = 0;
for (const prefix of ["", "v1.1.0/", "v1.2.0/", "v2.0.0/"]) for (const name of await readdir(new URL(prefix, root))) {
  if (!name.endsWith(".schema.json")) continue;
  const schema = await json(new URL(`${prefix}${name}`, root));
  assert.equal(ajv.validateSchema(schema), true, `${name}: ${ajv.errorsText()}`); ajv.addSchema(schema); schemas++;
}
const base = "https://t3thr.github.io/JaoKob/specs/schemas/";
const pouchSchema = `${base}v2.0.0/pouch.schema.json`;
for (const fixture of await json(new URL("../fixtures/pouch/cases.json", import.meta.url))) {
  assert.equal(ajv.validate(pouchSchema, fixture.value), fixture.schemaValid, `${fixture.name}: ${ajv.errorsText()}`);
  assert.equal(validatePouch(fixture.value).valid, fixture.domainValid, `${fixture.name}: semantic invariant`); cases++;
}
for (const version of [1, 2]) {
  const fixture = await json(new URL(`../fixtures/pouch/valid-save${version}-leaf.json`, import.meta.url));
  const schema = `${base}${version === 2 ? "v2.0.0/" : ""}save-state.schema.json`;
  assert.equal(ajv.validate(schema, fixture), true, ajv.errorsText()); assert.equal(validateSaveEnvelope(fixture).valid, true); cases++;
  if (version === 1) continue;
  for (const owner of ["payload", "checkpoint"]) for (const [key, value] of [["capacity", 3], ["held", null], ["unknown", true]]) {
    const bad = structuredClone(fixture), pouch = owner === "payload" ? bad.payload.pouch : bad.payload.checkpoint.pouch;
    pouch[key] = value;
    assert.equal(ajv.validate(schema, bad), false); assert.equal(validateSaveEnvelope(bad).valid, false); cases++;
  }
}
console.log(JSON.stringify({ result: "PASS", metaSchemas: schemas, structuralAndSemanticCases: cases, networkSchemaFetch: false,
  formats: "runtime unit tests", crossSetInvariants: "pure domain validator; JSON Schema covers shape and bounds" }, null, 2));
