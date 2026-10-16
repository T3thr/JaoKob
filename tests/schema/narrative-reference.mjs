/** Independent local Ajv reference: schema2, actual candidate, strict negatives. */
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { validateContentPackage } from "../../src/data/validation/content-validator.js";
import { validateSaveEnvelope } from "../../src/data/validation/save-envelope-validator.js";
import { travel, FULL_PLAN, save2 } from "../helpers/narrative-session.js";

if (!process.env.JKB_AJV_PATH) throw new Error("Set JKB_AJV_PATH to an installed development Ajv Draft 2020-12 module.");
const { default: Ajv } = await import(pathToFileURL(process.env.JKB_AJV_PATH).href);
const ajv = new Ajv({ strict: false, allErrors: true, validateFormats: false });
const root = new URL("../../", import.meta.url);
const json = async path => JSON.parse(await readFile(new URL(path, root), "utf8"));
let schemas = 0, cases = 0, saves = 0;
for (const prefix of ["", "v1.1.0/", "v1.2.0/", "v2.0.0/"]) for (const file of await readdir(new URL(`specs/schemas/${prefix}`, root))) {
  if (!file.endsWith(".schema.json")) continue;
  const schema = await json(`specs/schemas/${prefix}${file}`);
  assert.equal(ajv.validateSchema(schema), true, ajv.errorsText()); ajv.addSchema(schema); schemas++;
}
const p = await json("src/data/content/packages/act-01.json"), ids = await json("src/data/content/packages/act-01-test-catalog.json");
const schemaId = "https://t3thr.github.io/JaoKob/specs/schemas/v2.0.0/content-package.schema.json";
const check = (data, expected) => {
  assert.equal(ajv.validate(schemaId, data), expected, ajv.errorsText());
  assert.equal(validateContentPackage(data, { testReferenceIds: ids }).valid, expected); cases++;
};
check(p, true);
for (const mutation of [
  p => { p.keepsakes = null; }, p => { p.keepsakes[0].code = "run"; },
  p => { p.secretMoments[0].timer = 30; }, p => { p.secretMoments[0].returnNodeId = null; },
  p => { p.narrativeTrees[0].nodes.find(n => n.id === "node.act1.dew-offer").choices[0].pouchEffect.action = "equip"; },
  p => { p.narrativeTrees[0].nodes.find(n => n.id === "node.act1.dew-offer").choices[0].condition.all[0].state = "owned"; },
  p => { delete p.narrativeTrees[0].nodes.find(n => n.id === "node.act1.river-offer").choices[2].pouchEffect.oldItemId; },
  p => { p.schemaVersion = "2.1.0"; }, p => { p.events.schemaVersion = "1.0.0"; },
]) { const changed = structuredClone(p); mutation(changed); check(changed, false); }
for (const snapshot of travel({ ...FULL_PLAN, fifth: "exchange-leaf" }).snapshots) {
  const data = save2(snapshot);
  assert.equal(ajv.validate("https://t3thr.github.io/JaoKob/specs/schemas/v2.0.0/save-state.schema.json", data), true, ajv.errorsText());
  assert.equal(validateSaveEnvelope(data).valid, true); saves++;
}
console.log(JSON.stringify({ result: "PASS", metaSchemas: schemas, strictPackageCases: cases, saveCursorCases: saves, networkSchemaFetch: false,
  semanticNegatives: "narrative-content.test.js also covers unknown references, duplicates, item rewards and secret lifecycle" }, null, 2));
