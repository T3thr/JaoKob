import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash, webcrypto } from "node:crypto";
import { loadGameContent } from "../../src/data/content/content-runtime.js";
import { createAssetResolver } from "../../src/data/assets/asset-resolver.js";
import { createContentVersionMigration } from "../../src/data/migrations/content-2-0-0-to-2-1-0.js";

const root = new URL("../../", import.meta.url);
const json = async (path) => JSON.parse(await readFile(new URL(path, root), "utf8"));
const [content, source, registry, testReferenceIds] = await Promise.all([
  json("src/data/content/packages/act-01.json"), json("src/data/content/compatibility/act-01-2.0.0.json"),
  json("assets/provenance/benchmark-assets.json"), json("src/data/content/packages/act-01-test-catalog.json"),
]);
const loaded = await loadGameContent({ content, testReferenceIds });

test("TC-S3-ASSET-001: production media package validates and is purely presentation-compatible with archived 2.0.0", () => {
  assert.equal(loaded.valid, true);
  assert.equal(content.schemaVersion, "1.2.0"); assert.equal(content.contentVersion, "2.1.0");
  const proof = createContentVersionMigration({ sourcePackage: source, targetPackage: content, testReferenceIds });
  assert.equal(proof.ok, true, JSON.stringify(proof));
  assert.deepEqual(content.gameDefaults, source.gameDefaults);
  assert.equal(content.characters.characters.find((character) => character.id === "character.jaokob").visualProfile.lifeStage, "tadpole");
});
test("TC-S3-ASSET-001: eight approved scene/handoff nodes share explicit environment; later scenes are neutral/silent", () => {
  const selected = content.narrativeTrees[0].nodes.filter((node) => node.environment);
  assert.deepEqual(selected.map((node) => node.id), ["node.act1.opening", "node.act1.nursery", "node.act1.observe-lily", "node.act1.observe-roots", "node.act1.observe-shadows", "node.act1.observe-mother", "node.act1.home-focus", "node.act1.home-reflection"]);
  for (const node of selected) assert.deepEqual(node.environment, { backgroundAssetId: "asset.image.act1-morning-pond", bgmAssetId: "asset.audio.act1-peaceful-stream", ambientAssetId: "asset.audio.morning-dew-drops" });
});
test("TC-S3-ASSET-001: every shipped asset has matching reviewed registry, hash, localized metadata and safe root/subpath URL", async () => {
  assert.deepEqual(new Set(content.assets.map((asset) => asset.id)), new Set(registry.assets.map((asset) => asset.assetId)));
  for (const baseUrl of ["https://example.test/", "https://example.test/JaoKob/"]) {
    const resolver = createAssetResolver({ loaded, registry, baseUrl, digest: (bytes) => webcrypto.subtle.digest("SHA-256", bytes),
      fetch: async (url) => {
        const record = registry.assets.find((asset) => url === baseUrl + asset.path);
        assert.ok(record);
        return new Response(await readFile(new URL(record.path, root)), { headers: { "content-type": record.mimeType } });
      },
    });
    for (const asset of content.assets) {
      const result = await resolver.read({ assetId: asset.id, contentVersion: content.contentVersion });
      assert.equal(result.ok, true, `${baseUrl} ${asset.id}`);
      assert.ok(asset.rights.origin); assert.ok(asset.rights.licenseId);
      if (asset.type === "image") assert.ok(asset.alt.th);
    }
  }
});
test("TC-S3-ASSET-001: real WebP RIFF dimensions/alpha, WOFF2 headers and compressed/decoded envelopes agree", async () => {
  let total = 0;
  for (const asset of registry.assets) {
    const bytes = await readFile(new URL(asset.path, root));
    total += bytes.length;
    assert.equal(bytes.length, asset.byteLength);
    assert.equal(createHash("sha256").update(bytes).digest("hex"), asset.sha256);
    if (asset.type === "image") {
      assert.equal(bytes.toString("ascii", 0, 4), "RIFF"); assert.equal(bytes.toString("ascii", 8, 12), "WEBP");
      assert.equal(bytes.readUInt32LE(4) + 8, bytes.length);
      const dimensions = webpDimensions(bytes);
      assert.deepEqual(dimensions, { width: asset.width, height: asset.height, alpha: asset.alpha });
      assert.equal(asset.decodedBytes, dimensions.width * dimensions.height * 4);
      assert.ok(asset.byteLength <= 500_000);
      if (asset.alpha) assert.deepEqual([asset.width, asset.height], [512, 512]);
    } else if (asset.type === "font") {
      assert.equal(bytes.toString("ascii", 0, 4), "wOF2"); assert.equal(bytes.readUInt32BE(8), bytes.length);
      assert.ok(bytes.readUInt16BE(12) > 0); assert.ok(bytes.readUInt32BE(16) > bytes.length);
      assert.equal(asset.licenseId, "OFL-1.1");
    } else {
      assert.equal(bytes.toString("ascii", 0, 3), "ID3");
      assert.equal(asset.decodedBytes, asset.frames * asset.channels * 4);
      assert.ok(asset.decodedBytes < 16 * 1024 * 1024);
      assert.ok(asset.peakDbfs < -20);
      if (asset.loop) { assert.equal(asset.durationSeconds, 8); assert.ok(asset.loopSeamAmplitudeStep < 0.002); }
      assert.ok(asset.byteLength < (asset.path.includes("ambience") ? 1_000_000 : 2_000_000));
    }
  }
  assert.ok(total < 600_000, `All prototype media transfer ${total} bytes; this is not an input-ready performance measurement.`);
  assert.match(await readFile(new URL("assets/fonts/OFL-Sarabun.txt", root), "utf8"), /SIL OPEN FONT LICENSE Version 1\.1/);
});

function webpDimensions(bytes) {
  for (let offset = 12; offset + 8 <= bytes.length;) {
    const type = bytes.toString("ascii", offset, offset + 4), size = bytes.readUInt32LE(offset + 4), data = offset + 8;
    if (type === "VP8X") return { width: bytes.readUIntLE(data + 4, 3) + 1, height: bytes.readUIntLE(data + 7, 3) + 1, alpha: Boolean(bytes[data] & 0x10) };
    if (type === "VP8 ") return { width: bytes.readUInt16LE(data + 6) & 0x3fff, height: bytes.readUInt16LE(data + 8) & 0x3fff, alpha: false };
    offset = data + size + (size % 2);
  }
  assert.fail("Expected supported WebP frame");
}
