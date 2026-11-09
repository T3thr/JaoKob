import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * A published schema never changes a byte (AGENTS.md §9, specs/README.md). Moved in C5e from
 * `content-loader.test.js` and `pouch-schema.test.js` (superseded assertion register §2), which
 * pinned 9 files; this pins every schema under specs/schemas, the Sprint 4 ones included, until
 * T19 decides whether they stay in the release artifact. A new schema version is a new folder
 * and a new pin, never an edit. Trace: ADR-P0-013, ADR-P0-034 D4, TC-S5-SCHEMA-001.
 */
const specs = fileURLToPath(new URL("../../specs/schemas/", import.meta.url));
const pins = JSON.parse(readFileSync(new URL("../fixtures/schemas/published-schema-sha256.json", import.meta.url), "utf8"));
const walk = (path) => readdirSync(path, { withFileTypes: true }).flatMap((entry) =>
  entry.isDirectory() ? walk(resolve(path, entry.name)) : entry.name.endsWith(".json") ? [resolve(path, entry.name)] : []);

test("TC-S5-SCHEMA-001 every published schema keeps its bytes, and every schema file is pinned", () => {
  const files = walk(specs).map((file) => relative(specs, file).split("\\").join("/")).sort();
  assert.deepEqual(files, Object.keys(pins).sort(), "a schema file was added or removed without a pin");
  assert.ok(files.length >= 21);
  for (const path of files) {
    const bytes = readFileSync(resolve(specs, path));
    assert.equal(createHash("sha256").update(bytes).digest("hex"), pins[path], path);
  }
});
