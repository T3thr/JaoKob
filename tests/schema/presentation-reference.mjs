/** Optional development reference check; no runtime/package dependency.
 * Run with JKB_AJV_PATH pointing to an installed ajv/dist/2020.js.
 * Trace: TC-S3-CONTRACT-001, CR-0003 D1, FR-CNT-001. */
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { pathToFileURL } from "node:url";

if (!process.env.JKB_AJV_PATH) throw new Error("Set JKB_AJV_PATH to the development Ajv Draft 2020-12 module.");
const { default: Ajv2020 } = await import(pathToFileURL(process.env.JKB_AJV_PATH).href);
// Format/semantic policy assertions remain in content-loader.test.js. This
// reference gate covers metaschemas and instance structure with only local refs.
const ajv = new Ajv2020({ strict: false, allErrors: true, validateFormats: false });
const root = new URL("../../specs/schemas/", import.meta.url);
const readJson = async (url) => JSON.parse(await readFile(url, "utf8"));
const files = [];
for (const prefix of ["", "v1.1.0/", "v1.2.0/"]) {
  for (const name of await readdir(new URL(prefix, root))) {
    if (name.endsWith(".schema.json")) files.push(`${prefix}${name}`);
  }
}
for (const name of files) {
  const schema = await readJson(new URL(name, root));
  assert.equal(ajv.validateSchema(schema), true, `${name}: ${ajv.errorsText()}`);
  ajv.addSchema(schema);
}
let cases = 0;
const check = (data, expected) => {
  const prefix = data.schemaVersion === "1.0.0" ? "" : `v${data.schemaVersion}/`;
  const valid = ajv.validate(`https://t3thr.github.io/JaoKob/specs/schemas/${prefix}content-package.schema.json`, data);
  assert.equal(valid, expected, ajv.errorsText()); cases += 1;
};
const old = await readJson(new URL("../fixtures/presentation/migration/act-01-2.0.0.json", import.meta.url));
check(old, true);
const fixture = await readJson(new URL("../fixtures/presentation/schema/valid-v1.2-package.json", import.meta.url));
check(fixture, true);
for (const index of [0, 1, 2]) {
  for (const environment of [undefined, {}, { backgroundAssetId: "asset.fixture.background" }, { bgmAssetId: "asset.fixture.music" }, { ambientAssetId: "asset.fixture.ambience" }]) {
    const p = structuredClone(fixture);
    if (environment === undefined) delete p.narrativeTrees[0].nodes[index].environment;
    else p.narrativeTrees[0].nodes[index].environment = environment;
    check(p, true);
  }
  for (const environment of [null, { weather: "rain" }, { backgroundAssetId: 5 }, { bgmAssetId: "https://external.invalid" }, { ambientAssetId: "../escape" }]) {
    const p = structuredClone(fixture); p.narrativeTrees[0].nodes[index].environment = environment;
    check(p, false);
  }
}
for (const environment of [{}, { backgroundAssetId: "asset.fixture.background" }]) {
  const p = structuredClone(fixture);
  Object.assign(p.narrativeTrees[0].nodes[1], { backgroundAssetId: "asset.fixture.background", environment });
  check(p, false);
}
for (const version of ["1.0.0", "1.1.0"]) {
  const p = structuredClone(fixture); p.narrativeTrees[0].schemaVersion = version;
  check(p, false);
}
console.log(JSON.stringify({ result: "PASS", metaSchemas: files.length, structuralCases: cases, formats: "covered separately by runtime contract tests", networkSchemaFetch: false }));
