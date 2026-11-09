import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { JOURNEY_PACKAGE_PATH } from "../../src/bootstrap/journey-shell.js";
import { RELEASE_ALLOWLIST_PATH, gameFiles } from "../helpers/release-files.js";

/**
 * The release allowlist is exactly what `index.html` reaches (C5e), so the staged artifact can
 * neither miss a module nor carry the review harness, fixtures, tests, tools or specs. The game
 * reads one package, and that package holds only the acts it promotes: the spoiler wall of
 * ADR-P0-034 D10 seen from the shipped files. Trace: TC-S5-PROTO-001, TC-S5-RELEASE-001 (staging
 * only, T19 freezes the candidate), SSOT §3.3.
 */
const read = (path) => JSON.parse(readFileSync(new URL(`../../${path}`, import.meta.url), "utf8"));
const allowlist = read(RELEASE_ALLOWLIST_PATH);

test("TC-S5-RELEASE-001 the Sprint 5 allowlist is exactly the files index.html reaches", () => {
  assert.equal(allowlist.manifestVersion, 1);
  assert.equal(new Set(allowlist.files).size, allowlist.files.length, "no file listed twice");
  assert.deepEqual(allowlist.files, gameFiles());
});

test("TC-S5-PROTO-001 nothing outside the game ships: no harness, fixture, test, tool, spec, note or build receipt", () => {
  for (const path of allowlist.files) {
    assert.match(path, /^(?:index\.html|(?:src|assets)\/[a-zA-Z0-9/_.-]+)$/, path);
    assert.doesNotMatch(path, /(?:^|\/)(?:docs|tests|tools|specs|fixtures|evidence|journey-review)\/|\.md$|\.receipts\.json$|\.mjs$|\.py$|\.map$/i, path);
  }
  assert.ok(allowlist.files.includes("index.html") && allowlist.files.includes("src/bootstrap/index.js"));
});

test("TC-S5-PROTO-001 the one shipped package holds only the acts it promotes and stops at their boundaries", () => {
  const packages = allowlist.files.filter((path) => path.startsWith("src/data/content/") && path.endsWith(".json"));
  assert.deepEqual(packages, [JOURNEY_PACKAGE_PATH], "the host package is the only content");
  const pkg = read(JOURNEY_PACKAGE_PATH);
  const promoted = new Set(pkg.acts.map((act) => act.act));
  assert.deepEqual([...promoted], [1], "Slice 1 promotes Act 1 only");
  for (const node of pkg.nodes) assert.ok(promoted.has(node.act), `${node.id} belongs to act ${node.act}`);
  for (const boundary of pkg.boundaries) {
    assert.equal(promoted.has(boundary.act), false, `${boundary.node} is a boundary into an act that is not promoted`);
    assert.equal(pkg.nodes.some((node) => node.id === boundary.node), false, `${boundary.node} has no content`);
  }
});
