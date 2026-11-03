import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/** Architecture rules added for the Journey runtime (ADR-P0-034 D2, D6).
 * The older TC-S3-ARCH-001 and TC-S4-ARCH-001 move here in C5 (see the superseded assertion register).
 */
const root = fileURLToPath(new URL("../../src/", import.meta.url));
const walk = (path) => readdirSync(path, { withFileTypes: true }).flatMap((entry) =>
  entry.isDirectory() ? walk(resolve(path, entry.name)) : entry.name.endsWith(".js") ? [resolve(path, entry.name)] : []);
const files = walk(root);
const withoutComments = (source) => source.replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, "");

test("TC-S5-PACKAGE-001 production code never imports development tools", () => {
  const tools = resolve(root, "../tools") + "/";
  for (const file of files) {
    for (const match of readFileSync(file, "utf8").matchAll(/\b(?:import|export)\s[\s\S]*?\bfrom\s*["']([^"']+)["']/g)) {
      assert.equal(resolve(dirname(file), match[1]).startsWith(tools), false, file);
    }
  }
});

test("TC-S5-STATE-001 Core never reads a clock through new Date or performance.now", () => {
  for (const file of files.filter((path) => path.startsWith(resolve(root, "core") + "/"))) {
    assert.doesNotMatch(withoutComments(readFileSync(file, "utf8")), /\bnew Date\(|\bperformance\.now\(/, file);
  }
});

test("TC-S5-LEGACY-001 Journey code never names a legacy key, and the legacy archive has no way to write", () => {
  const journey = files.filter((path) => /\/(?:journey-[a-z-]+|legacy-archive)\.js$/.test(path) && !path.endsWith("journey-schema-catalog.js"));
  assert.ok(journey.length >= 11, journey.join("\n"));
  for (const file of journey) {
    const source = withoutComments(readFileSync(file, "utf8"));
    if (file.endsWith("legacy-archive.js")) assert.doesNotMatch(source, /\bwriteKey\b|\bremoveKey\b|\.setItem\(|\.removeItem\(/, file);
    else assert.doesNotMatch(source, /jaokob:(?:save:|settings\b|preferences\b)/, file);
  }
});

