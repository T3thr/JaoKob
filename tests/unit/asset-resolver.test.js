import test from "node:test";
import assert from "node:assert/strict";
import { createHash, webcrypto } from "node:crypto";
import { createAssetResolver } from "../../src/data/assets/asset-resolver.js";

const contentVersion = "2.1.0", assetId = "asset.image.pond";
const reference = { assetId, contentVersion };
const encoded = Uint8Array.from(Buffer.from("RIFF0000WEBPfixture"));
const sha256 = createHash("sha256").update(encoded).digest("hex");
const metadata = { assetId, path: "assets/images/backgrounds/pond.webp", type: "image", mimeType: "image/webp", byteLength: encoded.byteLength, sha256, width: 16, height: 9, decodedBytes: 576 };
function setup({ record = metadata, asset = { id: assetId, type: "image", path: metadata.path }, registry, ...options } = {}) {
  const requests = [];
  const resolver = createAssetResolver({ loaded: { valid: true, catalog: { version: contentVersion }, indexes: { assets: { [assetId]: asset } } },
    registry: registry ?? { registryVersion: 1, contentVersion, assets: [record] }, baseUrl: "https://example.test/JaoKob/",
    digest: (bytes) => webcrypto.subtle.digest("SHA-256", bytes),
    fetch: async (url, init) => { requests.push({ url, init }); return response(); }, ...options });
  return { resolver, requests };
}
function response({ bytes = encoded, type = "image/webp", headers = {}, url, redirected } = {}) {
  const result = new Response(bytes, { headers: { "content-type": type, ...headers } });
  if (url !== undefined) Object.defineProperty(result, "url", { value: url });
  if (redirected !== undefined) Object.defineProperty(result, "redirected", { value: redirected });
  return result;
}

test("TC-S3-ASSET-001: resolver binds version, identity, application root and subpath", () => {
  for (const baseUrl of ["https://example.test/", "https://example.test/JaoKob/"]) {
    const { resolver } = setup({ baseUrl });
    const resolved = resolver.resolve(reference, "image");
    assert.equal(resolved.url, `${baseUrl}${metadata.path}`);
    assert.equal(resolved.key, `${contentVersion}:${assetId}:${metadata.path}`);
    assert.ok(Object.isFrozen(resolved));
    assert.equal(resolver.resolve(reference, "audio"), null);
    assert.equal(resolver.resolve({ ...reference, contentVersion: "2.0.0" }), null);
    assert.equal(resolver.resolve({ ...reference, assetId: "asset.unknown" }), null);
  }
});
for (const path of ["../secret", "assets/../secret.webp", "/assets/image.webp", "https://evil.test/p.webp", "//evil.test/p.webp", "assets/%2e%2e/x.webp", "assets/%252e%252e/x.webp", "assets/x.webp?x=1", "assets/x.webp#fragment", "assets/./x.webp", "assets//x.webp", "assets\\x.webp", "assets/x.webp\n"]) {
  test(`TC-S3-ASSET-001: reject unsafe path ${JSON.stringify(path)}`, () => {
    assert.equal(setup({ record: { ...metadata, path }, asset: { id: assetId, type: "image", path } }).resolver.resolve(reference), null);
  });
}
for (const baseUrl of ["file:///tmp/", "data:text/plain,assets/", "https://user:pass@example.test/", "https://example.test/JaoKob/index.html", "https://example.test/?query", "https://example.test/#fragment", "https://example.test/%2f/"]) {
  test(`TC-S3-ASSET-001: reject unsafe application base ${baseUrl}`, () => assert.equal(setup({ baseUrl }).resolver.resolve(reference), null));
}
for (const patch of [{ mimeType: "image/svg+xml" }, { mimeType: "text/html" }, { byteLength: 500_001 }, { byteLength: 0 }, { sha256: "00" }, { decodedBytes: 1 }, { width: 1601 }, { height: 901 }, { path: "assets/other.webp" }, { type: "audio" }]) {
  test(`TC-S3-ASSET-001: reject mismatched metadata ${JSON.stringify(patch)}`, () => assert.equal(setup({ record: { ...metadata, ...patch } }).resolver.resolve(reference), null));
}
test("TC-S3-ASSET-001: registry version and duplicate identifiers fail closed", () => {
  for (const registry of [{ registryVersion: 2, contentVersion, assets: [metadata] }, { registryVersion: 1, contentVersion: "2.0.0", assets: [metadata] }, { registryVersion: 1, contentVersion, assets: [metadata, metadata] }]) {
    assert.equal(setup({ registry }).resolver.resolve(reference), null);
  }
});
test("TC-S3-ASSET-001: exact MIME, length, signature and SHA-256 admit media; omit credentials and reject redirects", async () => {
  const { resolver, requests } = setup();
  const result = await resolver.read(reference);
  assert.equal(result.ok, true);
  assert.deepEqual(new Uint8Array(result.value.bytes), encoded);
  assert.equal(requests[0].init.credentials, "omit");
  assert.equal(requests[0].init.redirect, "error");
  assert.equal(requests[0].init.mode, "same-origin");
});
test("TC-S3-ASSET-001: HTTP compression length differs from decoded body length", async () => {
  const { resolver } = setup({ fetch: async () => response({ headers: { "content-encoding": "gzip", "content-length": "8" } }) });
  assert.equal((await resolver.read(reference)).ok, true);
});
for (const [name, makeResponse] of [
  ["wrong MIME", () => response({ type: "text/html" })],
  ["declared size mismatch", () => response({ headers: { "content-length": "999" } })],
  ["unknown length bytes too large", () => response({ bytes: new Uint8Array(encoded.byteLength + 1) })],
  ["truncated response", () => response({ bytes: encoded.slice(0, 12) })],
  ["external response URL", () => response({ url: "https://evil.test/image.webp" })],
  ["same-origin redirected path", () => response({ url: "https://example.test/other.webp" })],
  ["redirect response", () => response({ redirected: true })],
  ["HTTP 404", () => new Response("missing", { status: 404 })],
  ["digest mismatch", () => response({ bytes: Uint8Array.from([...encoded.slice(0, -1), 0]) })],
  ["wrong signature", () => response({ bytes: new Uint8Array(encoded.byteLength) })],
]) test(`TC-S3-ASSET-001: ${name} fails silently`, async () => {
  const result = await setup({ fetch: async () => makeResponse() }).resolver.read(reference);
  assert.equal(result.ok, false);
  assert.match(result.error.code, /^ASSET_/);
});
test("TC-S3-ASSET-001: timeout and caller cancellation stop fetch without retry", async () => {
  let attempts = 0;
  const fetch = (_, { signal }) => new Promise((resolve, reject) => { attempts += 1; signal.addEventListener("abort", () => reject(new Error("aborted")), { once: true }); });
  const { resolver } = setup({ fetch, timeoutMs: 5 });
  assert.equal((await resolver.read(reference)).error.code, "ASSET_ABORTED");
  const controller = new AbortController();
  const pending = resolver.read(reference, { signal: controller.signal });
  controller.abort();
  assert.equal((await pending).error.code, "ASSET_ABORTED");
  assert.equal(attempts, 2);
  assert.equal((await resolver.read(reference, { signal: controller.signal })).ok, false);
  assert.equal(attempts, 2);
});
test("TC-S3-ASSET-001: audio decoded memory metadata is bounded independently of transfer", () => {
  const asset = { id: assetId, type: "audio", path: "assets/audio/bgm/pond.mp3" };
  const valid = { ...metadata, ...asset, assetId, mimeType: "audio/mpeg", frames: 352800, channels: 1, sampleRate: 44100, decodedBytes: 1411200 };
  assert.ok(setup({ asset, record: valid }).resolver.resolve(reference));
  for (const patch of [{ frames: 0 }, { channels: 3 }, { sampleRate: 96000 }, { decodedBytes: 1 }, { frames: 5_000_000, decodedBytes: 20_000_000 }]) {
    assert.equal(setup({ asset, record: { ...valid, ...patch } }).resolver.resolve(reference), null);
  }
});
