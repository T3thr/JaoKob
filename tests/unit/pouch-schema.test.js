import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { validatePouch } from "../../src/core/domain/keepsake-pouch.js";
import { validateSaveEnvelope } from "../../src/data/validation/save-envelope-validator.js";
const read = (path) => JSON.parse(readFileSync(new URL(path, import.meta.url)));
for (const fixture of read("../fixtures/pouch/cases.json")) test(`TC-S4-CONTRACT-001 fixture ${fixture.name}`, () => {
  assert.equal(validatePouch(fixture.value).valid, fixture.domainValid);
});
for (const version of [1, 2]) test(`TC-S4-CONTRACT-001 published Save ${version} fixture`, () => {
  assert.equal(validateSaveEnvelope(read(`../fixtures/pouch/valid-save${version}-leaf.json`)).valid, true);
});
test("TC-S4-CONTRACT-001 published schemas stay byte-identical under additive Save 2", () => {
  const hashes = read("../fixtures/presentation/schema/published-schema-sha256.json");
  for (const [path, hash] of Object.entries(hashes)) {
    const bytes = readFileSync(new URL(`../../specs/schemas/${path}`, import.meta.url));
    assert.equal(createHash("sha256").update(bytes).digest("hex"), hash, path);
  }
});
test("TC-S4-ASSET-001 original pouch art/chrome have exact provenance and no external SVG content", () => {
  for (const path of ["assets/provenance/sprint-04-pouch.json", "assets/provenance/sprint-04-visual-slice.json"]) {
    for (const asset of read(`../../${path}`).assets) {
      const bytes = readFileSync(new URL(`../../${asset.path}`, import.meta.url));
      assert.equal(bytes.length, asset.byteLength); assert.equal(createHash("sha256").update(bytes).digest("hex"), asset.sha256);
      if (asset.path.endsWith(".svg")) assert.doesNotMatch(bytes.toString(), /<script|<foreignObject|\bon\w+=|(?:href|src)=["']https?:/i);
    }
  }
});
test("TC-S4-ARCH-001 production import graph preserves Core/Data/UI boundaries and no test dependency", () => {
  const root = fileURLToPath(new URL("../../src/", import.meta.url));
  const walk = path => readdirSync(path, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? walk(resolve(path, entry.name)) : entry.name.endsWith(".js") ? [resolve(path, entry.name)] : []);
  for (const file of walk(root)) {
    const source = readFileSync(file, "utf8");
    for (const match of source.matchAll(/\b(?:import|export)\s[\s\S]*?\bfrom\s*["']([^"']+)["']/g)) {
      const target = resolve(dirname(file), match[1]);
      assert.equal(target.includes("/tests/"), false, file);
      if (file.startsWith(resolve(root, "core") + "/")) assert.ok(target.startsWith(resolve(root, "core") + "/"), file);
      if (file.startsWith(resolve(root, "data") + "/")) assert.equal(target.startsWith(resolve(root, "ui") + "/"), false, file);
      if (file.startsWith(resolve(root, "ui") + "/")) assert.equal(target.startsWith(resolve(root, "data") + "/"), false, file);
    }
    if (file.startsWith(resolve(root, "core") + "/")) {
      const code = source.replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, "");
      assert.doesNotMatch(code, /\b(?:window|document|localStorage|globalThis|fetch|navigator|HTMLElement)\b|Math\.random\(|Date\.now\(/);
    }
  }
});
