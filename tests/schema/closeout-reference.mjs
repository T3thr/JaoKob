/** Independent development-only Draft2020-12 reference, no schema network. */
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import { loadGameContent } from "../../src/data/content/content-runtime.js";
import { validatePresentationCatalog } from "../../src/data/content/presentation-catalog.js";

if (!process.env.JKB_AJV_PATH) throw new Error("Set JKB_AJV_PATH to an installed development Ajv2020 module.");
const { default: Ajv } = await import(pathToFileURL(process.env.JKB_AJV_PATH).href);
const ajv = new Ajv({ strict: false, allErrors: true, validateFormats: false });
const root = new URL("../../", import.meta.url);
const json = async path => JSON.parse(await readFile(new URL(path, root), "utf8"));
const schema = await json("specs/schemas/presentation-catalog.schema.json");
assert.equal(ajv.validateSchema(schema), true, ajv.errorsText());
const validate = ajv.compile(schema);
const testReferenceIds = await json("src/data/content/packages/act-01-test-catalog.json");
let structural = 0, semantic = 0;
for (const version of ["3.0.0", "2.1.0"]) {
  const content = await json(version === "3.0.0" ? "src/data/content/packages/act-01.json" : "src/data/content/compatibility/act-01-2.1.0.json");
  const loaded = await loadGameContent({ content, testReferenceIds }); assert.equal(loaded.valid, true);
  const catalog = await json(`src/data/content/presentation/act-01-${version}.json`);
  assert.equal(validate(catalog), true, ajv.errorsText());
  assert.equal(validatePresentationCatalog(catalog, loaded).valid, true); structural++;
  if (version !== "3.0.0") continue;
  for (const mutate of [
    c => { c.extra = true; }, c => { c.schemaVersion = "2.0.0"; },
    c => { c.locale = "en"; }, c => { c.choices[0].intent = { en: "listen" }; },
    c => { c.choices[0].skin = "gold"; }, c => { c.choices[0].icon = "best"; },
    c => { c.choices[0].intent.th = ""; }, c => { c.items[0].imageAssetId = "../photo"; },
    c => { c.backgrounds[0].crop.portrait.x = 101; },
    c => { c.backgrounds[0].crop.landscape.y = -1; },
    c => { c.choices[0].effect = 5; },
  ]) {
    const changed = structuredClone(catalog); mutate(changed);
    assert.equal(validate(changed), false);
    assert.equal(validatePresentationCatalog(changed, loaded).valid, false); structural++;
  }
  for (const mutate of [
    c => { c.contentVersion = "2.1.0"; }, c => { c.choices.push(c.choices[0]); },
    c => { c.items.push(c.items[0]); }, c => { c.backgrounds.push(c.backgrounds[0]); },
    c => { c.choices[0].actionId = "choice.unknown"; },
    c => { c.items[0].itemId = "item_unknown"; },
    c => { c.items[0].imageAssetId = "asset.audio.act1-peaceful-stream"; },
    c => { c.backgrounds[0].assetId = "asset.image.unknown"; },
    c => { c.choices[0].intent.th = "Bond 20"; },
    c => { c.choices[0].intent.th = "<b>รับฟัง</b>"; },
    c => { c.choices[0].intent.th = " "; },
  ]) {
    const changed = structuredClone(catalog); mutate(changed);
    // Structural schema cannot prove author intent or cross-package references.
    assert.equal(validate(changed), true, ajv.errorsText());
    assert.equal(validatePresentationCatalog(changed, loaded).valid, false); semantic++;
  }
}
const preserved = [];
for (const prefix of ["", "v1.1.0/", "v1.2.0/", "v2.0.0/"]) {
  for (const name of await readdir(new URL(`specs/schemas/${prefix}`, root))) {
    if (!name.endsWith(".schema.json") || name === "presentation-catalog.schema.json") continue;
    preserved.push(`specs/schemas/${prefix}${name}`);
  }
}
preserved.push("src/data/content/compatibility/act-01-2.1.0.json", "src/data/content/compatibility/act-01-2.0.0.json", "assets/provenance/benchmark-assets.json", "assets/images/keepsakes/leaf.svg");
for (const path of preserved) assert.deepEqual(await readFile(new URL(path, root)), execFileSync("git", ["show", `bc167d3:${path}`], { cwd: root }));
const before = JSON.parse(execFileSync("git", ["show", "bc167d3:src/data/content/packages/act-01.json"], { cwd: root, encoding: "utf8" }));
const after = await json("src/data/content/packages/act-01.json");
delete before.assets; delete after.assets; assert.deepEqual(after, before);
console.log(JSON.stringify({ result: "PASS", structuralCatalogCases: structural, semanticCatalogNegatives: semantic,
  byteIdenticalPublishedArtifacts: preserved.length, storyEffectsAndIdsUnchanged: true, networkSchemaFetch: false }, null, 2));
