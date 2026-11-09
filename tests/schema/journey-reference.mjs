/** Independent Draft 2020-12 reference validation of the journey schemas. Development-only Ajv.
 * Usage: JKB_AJV_PATH=/absolute/path/to/ajv/dist/2020.js node tests/schema/journey-reference.mjs
 * Trace: TC-S5-SCHEMA-001, ADR-P0-034 D4/D7. No network schema resolution.
 * Every shared case must give the same verdict in Ajv and in the project validator.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { JOURNEY_SCHEMA_CATALOG } from "../../src/data/validation/journey-schema-catalog.js";
import { createContentSchemaValidator } from "../../src/data/validation/content-schema-validator.js";
import {
  PACKAGE_SCHEMA_ID, SAVE_SCHEMA_ID, loadMiniJourney, loadJourneySave, packageCases, saveCases, worstCaseSave,
} from "../helpers/journey-schema-cases.js";

if (!process.env.JKB_AJV_PATH) throw new Error("Set JKB_AJV_PATH to the development Ajv Draft 2020-12 module.");
const { default: Ajv2020 } = await import(pathToFileURL(process.env.JKB_AJV_PATH).href);
const ajv = new Ajv2020({ strict: false, allErrors: true, validateFormats: false });
for (const [path, schema] of Object.entries(JOURNEY_SCHEMA_CATALOG)) {
  assert.equal(ajv.validateSchema(structuredClone(schema)), true, `${path}: ${ajv.errorsText()}`);
  ajv.addSchema(structuredClone(schema));
}
const project = createContentSchemaValidator(JOURNEY_SCHEMA_CATALOG);
let cases = 0;
function agree(name, value, schemaId, expected) {
  const reference = ajv.validate(schemaId, value);
  const local = project.validate(value, schemaId).errors.length === 0;
  assert.equal(reference, expected, `${name}: Ajv ${ajv.errorsText()}`);
  assert.equal(local, expected, `${name}: project validator`);
  cases++;
}
agree("mini journey", loadMiniJourney(), PACKAGE_SCHEMA_ID, true);
agree("journey save", loadJourneySave(), SAVE_SCHEMA_ID, true);
agree("worst-case save", worstCaseSave(), SAVE_SCHEMA_ID, true);
agree("compiled story.jaokob.core", JSON.parse(readFileSync(new URL("../../src/data/content/journey/story-jaokob-core.json", import.meta.url), "utf8")), PACKAGE_SCHEMA_ID, true);
for (const [name, mutate] of packageCases) { const value = loadMiniJourney(); mutate(value); agree(`package: ${name}`, value, PACKAGE_SCHEMA_ID, false); }
for (const [name, mutate] of saveCases) { const value = loadJourneySave(); mutate(value); agree(`save: ${name}`, value, SAVE_SCHEMA_ID, false); }
console.log(`journey reference: ${Object.keys(JOURNEY_SCHEMA_CATALOG).length} schemas · ${cases} cases agree between Ajv and the project validator`);
