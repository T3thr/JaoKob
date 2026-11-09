import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync } from "node:fs";

/**
 * Every file a provenance record lists by path is the file it recorded: same byte length and
 * SHA-256, and an SVG carries no script, foreign object, event handler or remote link. Moved in
 * C5e from `pouch-schema.test.js` (TC-S4-ASSET-001, two records) and `asset-manifest.test.js`
 * (superseded assertion register §5), and widened to every record that lists files by path.
 * Manifest v2 images are proved in `journey-media-resolver.test.js`.
 * Trace: TC-S5-ASSET-001, AGENTS.md §13 (no unlicensed asset).
 */
const folder = new URL("../../assets/provenance/", import.meta.url);
/** Files a record lists that left the repository on purpose, with the checkpoint that removed them. */
const RETIRED = new Map([["src/ui/components/chrome-icons.js", "C5e · Sprint 4 UI removed with its runtime"]]);
const records = readdirSync(folder).filter((name) => name.endsWith(".json"))
  .map((name) => ({ name, record: JSON.parse(readFileSync(new URL(name, folder), "utf8")) }))
  .map(({ name, record }) => ({ name, files: (record.assets ?? []).filter((entry) => typeof entry.path === "string") }))
  .filter(({ files }) => files.length > 0);

test("TC-S4-ASSET-001 TC-S5-ASSET-001 every file a provenance record lists by path has its recorded bytes", () => {
  assert.deepEqual(records.map(({ name }) => name).sort(), ["act-01-3.0.0.json", "benchmark-assets.json", "sprint-04-closeout.json", "sprint-04-pouch.json", "sprint-04-visual-slice.json"]);
  let count = 0;
  for (const { name, files } of records) {
    for (const entry of files) {
      if (RETIRED.has(entry.path)) {
        assert.equal(existsSync(new URL(`../../${entry.path}`, import.meta.url)), false, `${entry.path} is listed as retired but still exists`);
        continue;
      }
      const bytes = readFileSync(new URL(`../../${entry.path}`, import.meta.url));
      assert.equal(bytes.length, entry.byteLength, `${name} ${entry.path}`);
      assert.equal(createHash("sha256").update(bytes).digest("hex"), entry.sha256, `${name} ${entry.path}`);
      if (entry.path.endsWith(".svg")) assert.doesNotMatch(bytes.toString(), /<script|<foreignObject|\bon\w+=|(?:href|src)=["']https?:/i, entry.path);
      count += 1;
    }
  }
  assert.equal(count, 27, "files checked (two records list the retired chrome icons)");
});
