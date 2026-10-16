import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const fixture = JSON.parse(readFileSync(new URL("../fixtures/narrative/ending-design-cases.json", import.meta.url)));
// Test-only transcription of the GDD ordered design table, not production code.
function reference({ hp, sanity, bond, compassion, safeHelp, repair, assist }) {
  if (hp === 0 || sanity === 0) return assist ? "Recovery" : "GameOver";
  if (bond >= 50 && compassion && !safeHelp && repair === "accept") { bond = Math.min(100, bond + 20); safeHelp = true; }
  return bond >= 60 && compassion && safeHelp ? "END-HOME" : bond >= 30 ? "END-NEARBY" : "END-DAWN";
}
for (const [i, row] of fixture.cases.entries()) test(`TC-S4-FAIR-001 S5 design case ${i + 1}: ${row.expected}, item-independent expected result`, () => {
  for (const item of ["item_leaf", "item_dew_stone", "item_lotus_shell", "item_rain_petal", "item_red_yarn", "item_river_shell"])
    for (const state of ["held", "released", "refused", "unseen", "empty"]) for (const secrets of ["none", "all"])
      for (const strain of ["none", "accepted"]) for (const assist of [false, true]) {
        const expected = row.expected === "GameOver" && assist ? "Recovery" : row.expected;
        assert.equal(reference({ ...row, item, state, secrets, strain, assist, muted: true, reducedMotion: true }), expected);
      }
});
for (const path of fixture.trustPaths) test(`TC-S4-FAIR-001 ${path.id} reaches HOME budget with voice and empty pouch`, () => {
  const bond = path.deltas.reduce((sum, n) => sum + n, 0);
  assert.equal(bond, path.expectedBond);
  assert.equal(reference({ hp: 1, sanity: 1, bond, compassion: true, safeHelp: true }), "END-HOME");
});
