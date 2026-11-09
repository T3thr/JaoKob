import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createJourneyMediaIndex } from "../../src/data/assets/journey-media.js";
import { admitJourneyPackage } from "../../src/data/content/journey-package.js";
import { loadAct1Package } from "../helpers/journey-driver.js";

/** Trace: TC-S5-VN-001, ADR-P0-034 D7.5/D10.3, ADR-P0-032 D7.2, SSOT §1.2 (C4 eye-anchor table). */
const manifest = JSON.parse(readFileSync(new URL("../../assets/images/asset-manifest-v2.json", import.meta.url), "utf8"));
const admitted = admitJourneyPackage(loadAct1Package(), { role: "host" }).value;
const BASE = "http://127.0.0.1:8000/";
const index = (overrides = {}) => createJourneyMediaIndex({ manifest, identity: admitted.identity, baseUrl: BASE, ...overrides });
const character = (fields) => ({
  assetId: "char_test_frog", characterId: "char_test", outputPath: "assets/images/characters/test/frog.webp", dimensions: "1024x1024",
  sha256: "a".repeat(64), byteLength: 1000, facing: "right", stage: { eyeAnchorFromTop: 0.22 }, ...fields,
});
const only = (entries) => ({ categories: { characters: entries } });

test("TC-S5-VN-001 every asset an Act 1 stage names resolves to a same-origin image keyed by the package identity", () => {
  const media = index();
  for (const node of admitted.package.nodes) {
    if (node.stage === undefined) continue;
    const background = media.image(node.stage.bg);
    assert.ok(background, `${node.id} background`);
    assert.equal(background.kind, "background");
    assert.ok(background.url.startsWith(`${BASE}assets/images/`) && background.url.endsWith(".webp"), background.url);
    for (const slot of node.stage.slots) {
      const image = media.image(slot.asset, { facing: slot.facing });
      assert.ok(image, `${node.id} ${slot.asset}`);
      assert.equal(image.kind, "character");
      assert.equal(image.key, `${admitted.identity.key}:${image.assetId}`);
      assert.ok(image.eyeFromTop > 0.1 && image.eyeFromTop < 0.55, `${image.assetId} eye ${image.eyeFromTop}`);
      assert.ok(Object.isFrozen(image));
    }
  }
});

test("TC-S5-VN-001 a slot that faces the other way gets the manifest variant, and a missing facing is listed, never mirrored", () => {
  const media = index();
  const turned = media.image("char_jao_kib_neutral_cheerful", { facing: "left" });
  assert.equal(turned.assetId, "char_jao_kib_neutral_cheerful_facing_left");
  assert.equal(turned.facing, "left");
  assert.equal(turned.facingMatched, true);
  assert.equal(media.image("char_jao_kib_neutral_cheerful", { facing: "right" }).assetId, "char_jao_kib_neutral_cheerful");
  assert.deepEqual(media.gaps(), []);
  const missing = media.image("char_jao_kib_tinker_seed_tube", { facing: "left" });
  assert.equal(missing.assetId, "char_jao_kib_tinker_seed_tube");
  assert.equal(missing.facingMatched, false);
  assert.deepEqual(media.gaps(), [{ assetId: "char_jao_kib_tinker_seed_tube", facing: "left" }]);
  assert.equal(media.image("not_an_asset"), null);
});

test("TC-S5-VN-001 the base URL must be an http(s) directory; anything else resolves nothing", () => {
  for (const baseUrl of ["file:///repo/", "http://127.0.0.1:8000/app", "http://u:p@127.0.0.1/", "http://127.0.0.1/?x=1", "not a url", undefined]) {
    assert.equal(index({ baseUrl }).image("bg_act1_willow_roots"), null, String(baseUrl));
  }
  assert.ok(index({ baseUrl: "https://t3thr.github.io/JaoKob/" }).image("bg_act1_willow_roots").url.startsWith("https://t3thr.github.io/JaoKob/assets/"));
  assert.throws(() => createJourneyMediaIndex({ manifest, identity: {}, baseUrl: BASE }), TypeError);
});

test("TC-S5-VN-001 unsafe or incomplete manifest entries are left out", () => {
  const cases = {
    traversal: { outputPath: "assets/images/../secrets.webp" },
    absolute: { outputPath: "/assets/images/characters/test/frog.webp" },
    "other folder": { outputPath: "src/data/frog.webp" },
    png: { outputPath: "assets/images/characters/test/frog.png" },
    dimensions: { dimensions: "1024 x 1024" },
    "too large": { dimensions: "5000x1024" },
    sha: { sha256: "xyz" },
    bytes: { byteLength: 0 },
    facing: { facing: "up" },
    "no eye": { stage: {} },
    "eye out of range": { stage: { eyeAnchorFromTop: 1.2 } },
  };
  for (const [name, fields] of Object.entries(cases)) {
    const media = createJourneyMediaIndex({ manifest: only([character(fields)]), identity: admitted.identity, baseUrl: BASE });
    assert.equal(media.image("char_test_frog"), null, name);
  }
  const ok = createJourneyMediaIndex({ manifest: only([character({})]), identity: admitted.identity, baseUrl: BASE });
  assert.equal(ok.image("char_test_frog").eyeFromTop, 0.22);
  const duplicated = createJourneyMediaIndex({ manifest: only([character({}), character({ outputPath: "assets/images/characters/test/other.webp" })]), identity: admitted.identity, baseUrl: BASE });
  assert.equal(duplicated.image("char_test_frog"), null, "a duplicated ID resolves to nothing");
  assert.equal(createJourneyMediaIndex({ manifest: null, identity: admitted.identity, baseUrl: BASE }).image("char_test_frog"), null);
});

test("TC-S5-VN-001 the eye table of manifest v2 is measured and keeps the preview invariant of the v2 verifier", () => {
  const characters = manifest.categories.characters;
  assert.equal(characters.length, 40);
  for (const entry of characters) {
    const { eyeAnchorFromTop: eye, previewHeightFraction: preview, eyeAnchorMethod: method } = entry.stage;
    assert.ok(eye >= 0.15 && eye <= 0.5, `${entry.assetId} ${eye}`);
    assert.ok(Math.abs((1 - eye) * preview - 0.6) < 0.001, `${entry.assetId} preview ${preview}`);
    assert.match(method, /^measured for the C4 renderer/, entry.assetId);
  }
});
