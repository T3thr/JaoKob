import test from "node:test";
import assert from "node:assert/strict";
import { createHash, randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { createJourneyMediaIndex } from "../../src/data/assets/journey-media.js";
import { JOURNEY_MEDIA_ERROR_CODES as CODES, createJourneyMediaResolver, webpSize } from "../../src/data/assets/journey-media-resolver.js";
import { admitJourneyPackage } from "../../src/data/content/journey-package.js";
import { sha256Bytes, sha256Hex } from "../../src/data/validation/content-digest.js";
import { loadAct1Package } from "../helpers/journey-driver.js";
import { MEDIA_BASE, fileBytes, repositoryFetch } from "../helpers/journey-media.js";

/** Trace: TC-S5-ASSET-001, TC-S5-PACKAGE-001, ADR-P0-034 D7.5 · D10.3, SSOT §4.3 T3. */
const manifest = JSON.parse(readFileSync(new URL("../../assets/images/asset-manifest-v2.json", import.meta.url), "utf8"));
const entries = Object.values(manifest.categories).flat();
const admitted = admitJourneyPackage(loadAct1Package(), { role: "host" }).value;
const media = createJourneyMediaIndex({ manifest, identity: admitted.identity, baseUrl: MEDIA_BASE });
const nodeSha = (bytes) => createHash("sha256").update(bytes).digest("hex");

const PLATE = "bg_act1_willow_roots";
const plate = media.image(PLATE);
const platePath = plate.url.slice(MEDIA_BASE.length);
const resolverWith = (server = repositoryFetch(), options = {}) => ({ server, resolver: createJourneyMediaResolver({ media, identity: admitted.identity, fetch: server.fetch, ...options }) });
const codeOf = (result) => (result.ok ? "OK" : result.error.code);

test("TC-S5-ASSET-001 sha256Bytes meets the FIPS 180-4 examples and node:crypto on every block boundary", () => {
  const ascii = (text) => new TextEncoder().encode(text);
  assert.equal(sha256Bytes(new Uint8Array(0)), "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");
  assert.equal(sha256Bytes(ascii("abc")), "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
  assert.equal(sha256Bytes(ascii("abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq")), "248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1");
  assert.equal(sha256Bytes(ascii("abcdefghbcdefghicdefghijdefghijkefghijklfghijklmghijklmnhijklmnoijklmnopjklmnopqklmnopqrlmnopqrsmnopqrstnopqrstu")), "cf5b16a778af8380036ce59e7b0492370b249b11e8f07a51afac45037afee9d1");
  assert.equal(sha256Bytes(new Uint8Array(1_000_000).fill(0x61)), "cdc76e5c9914fb9281a1c7e284d73e67f1809a48a497200e046d39ccc7112cd0");
  for (let length = 0; length <= 200; length += 1) {
    const bytes = randomBytes(length);
    assert.equal(sha256Bytes(bytes), nodeSha(bytes), `length ${length}`);
  }
  const wide = randomBytes(300);
  const view = new Uint8Array(wide.buffer, wide.byteOffset + 7, 129);
  assert.equal(sha256Bytes(view), nodeSha(Buffer.from(view)), "a view inside a larger buffer");
  assert.equal(sha256Bytes(new DataView(wide.buffer, wide.byteOffset, 64)), nodeSha(wide.subarray(0, 64)), "any ArrayBuffer view");
  assert.equal(sha256Bytes(new Uint8Array(wide).buffer), nodeSha(wide), "an ArrayBuffer");
  const thai = "เจ้ากบกับเสื้อสีฟ้า ต.♡ป.";
  assert.equal(sha256Hex(thai), sha256Bytes(new TextEncoder().encode(thai)), "text is its UTF-8 bytes");
  for (const wrong of ["abc", 12, null, undefined, [1, 2]]) assert.throws(() => sha256Bytes(wrong), TypeError);
});

test("TC-S5-ASSET-001 every image file in manifest v2 has the manifest's byte length, SHA-256 and WebP size", () => {
  assert.equal(entries.length, 70);
  for (const entry of entries) {
    const bytes = fileBytes(entry.outputPath);
    assert.equal(bytes.length, entry.byteLength, entry.assetId);
    assert.equal(sha256Bytes(bytes), entry.sha256, entry.assetId);
    const [width, height] = entry.dimensions.split("x").map(Number);
    assert.deepEqual(webpSize(bytes), { width, height }, entry.assetId);
  }
});

test("TC-S5-ASSET-001 webpSize reads VP8X, VP8 and VP8L headers and refuses anything that is not one whole WebP", () => {
  const vp8x = fileBytes(entries.find((entry) => entry.outputPath.includes("/characters/")).outputPath);
  assert.equal(String.fromCharCode(...vp8x.subarray(12, 16)), "VP8X");
  const lossy = entries.map((entry) => fileBytes(entry.outputPath)).find((bytes) => String.fromCharCode(...bytes.subarray(12, 16)) === "VP8 ");
  assert.ok(lossy, "manifest v2 has a lossy VP8 file");
  // A minimal lossless header: 'VP8L', signature 0x2f, then 14-bit width-1 and height-1.
  const lossless = new Uint8Array(40);
  lossless.set(new TextEncoder().encode("RIFF"), 0);
  new DataView(lossless.buffer).setUint32(4, 32, true);
  lossless.set(new TextEncoder().encode("WEBPVP8L"), 8);
  lossless[20] = 0x2f;
  new DataView(lossless.buffer).setUint32(21, (299 & 0x3fff) | ((149 & 0x3fff) << 14), true);
  assert.deepEqual(webpSize(lossless), { width: 300, height: 150 });

  const changed = (bytes, edit) => { const copy = new Uint8Array(bytes); edit(copy); return copy; };
  const refused = {
    "too short": vp8x.subarray(0, 29),
    "not RIFF": changed(vp8x, (b) => { b[0] = 0x52 + 1; }),
    "not WEBP": changed(vp8x, (b) => { b[11] = 0x51; }),
    "RIFF length is not the file": changed(vp8x, (b) => { new DataView(b.buffer).setUint32(4, b.length - 9, true); }),
    "a cut file": vp8x.subarray(0, vp8x.length - 1),
    "an unknown first chunk": changed(vp8x, (b) => { b[15] = 0x51; }),
    "VP8 without its start code": changed(lossy, (b) => { b[23] = 0; }),
    "VP8 that is not a key frame": changed(lossy, (b) => { b[20] |= 1; }),
    "VP8L without its signature": changed(lossless, (b) => { b[20] = 0; }),
  };
  for (const [name, bytes] of Object.entries(refused)) assert.equal(webpSize(bytes), null, name);
  assert.equal(webpSize([...vp8x]), null, "only bytes");
  assert.equal(webpSize(vp8x.buffer), null, "only a Uint8Array");
});

test("TC-S5-ASSET-001 the resolver reads one admitted image same-origin, without credentials or redirects, and proves it", async () => {
  const { server, resolver } = resolverWith();
  const result = await resolver.read(plate);
  assert.equal(codeOf(result), "OK");
  assert.deepEqual(result.value.descriptor, { type: "image", kind: "background", mimeType: "image/webp", width: plate.width, height: plate.height });
  assert.ok(Object.isFrozen(result.value) && Object.isFrozen(result.value.descriptor));
  assert.deepEqual([...result.value.bytes], [...fileBytes(platePath)]);
  assert.equal(server.calls.length, 1);
  assert.equal(server.calls[0].url, plate.url);
  assert.deepEqual({ ...server.calls[0].init, signal: undefined }, { credentials: "omit", mode: "same-origin", redirect: "error", signal: undefined });
  assert.ok(server.calls[0].init.signal instanceof AbortSignal);
});

test("TC-S5-PACKAGE-001 only this package's admitted images are read, from the index's URL, never the caller's", async () => {
  const { server, resolver } = resolverWith();
  const other = admitJourneyPackage(JSON.parse(readFileSync(new URL("../fixtures/journey/mini-journey.json", import.meta.url), "utf8")), { role: "host" }).value;
  assert.notEqual(other.identity.key, admitted.identity.key);
  const foreign = createJourneyMediaIndex({ manifest, identity: other.identity, baseUrl: MEDIA_BASE }).image(PLATE);
  for (const reference of [foreign, { ...plate, identity: undefined }, { ...plate, assetId: "not_an_asset" }, { ...plate, assetId: undefined }, null, "bg_act1_willow_roots", 7]) {
    assert.equal(codeOf(await resolver.read(reference)), CODES.REFERENCE, JSON.stringify(reference));
  }
  assert.equal(server.calls.length, 0, "a refused reference never reaches the network");
  const pointed = await resolver.read({ ...plate, url: "https://example.com/evil.webp", sha256: "0".repeat(64), byteLength: 3, width: 1, height: 1 });
  assert.equal(codeOf(pointed), "OK", "the URL, size and digest come from the index");
  assert.equal(server.calls[0].url, plate.url);
});

test("TC-S5-ASSET-001 a wrong answer is refused before decoding: status, redirect, type and declared length", async () => {
  const cases = [
    [CODES.RESPONSE, async () => new Response(null, { status: 404 })],
    [CODES.RESPONSE, async () => { const response = new Response(fileBytes(platePath), { headers: { "content-type": "image/webp" } }); Object.defineProperty(response, "redirected", { value: true }); return response; }],
    [CODES.RESPONSE, async () => { const response = new Response(fileBytes(platePath), { headers: { "content-type": "image/webp" } }); Object.defineProperty(response, "url", { value: `${MEDIA_BASE}assets/images/other.webp` }); return response; }],
    [CODES.METADATA, async () => new Response(fileBytes(platePath), { headers: { "content-type": "image/png" } })],
    [CODES.METADATA, async () => new Response(fileBytes(platePath), { headers: { "content-type": "text/html; charset=utf-8" } })],
    [CODES.METADATA, async () => new Response(fileBytes(platePath), { headers: { "content-type": "image/webp", "content-length": String(plate.byteLength + 1) } })],
    [CODES.METADATA, async () => new Response(fileBytes(platePath), { headers: { "content-type": "image/webp", "content-length": "12abc" } })],
    [CODES.LOAD, async () => { throw new TypeError("network"); }],
  ];
  for (const [code, answer] of cases) {
    const resolver = createJourneyMediaResolver({ media, identity: admitted.identity, fetch: answer });
    const result = await resolver.read(plate);
    assert.equal(codeOf(result), code);
    assert.doesNotMatch(JSON.stringify(result), /http|assets\//, "a failure never carries a URL or a path");
  }
  const zipped = createJourneyMediaResolver({ media, identity: admitted.identity, fetch: async () => new Response(fileBytes(platePath), { headers: { "content-type": "image/webp; charset=binary", "content-encoding": "gzip", "content-length": "17" } }) });
  assert.equal(codeOf(await zipped.read(plate)), "OK", "a compressed answer declares the compressed length, so only the bytes count");
});

test("TC-S5-ASSET-001 a damaged, swapped, resized or cut file never reaches the decoder", async () => {
  const original = fileBytes(platePath);
  const otherPlate = entries.find((entry) => entry.outputPath.includes("/backgrounds/") && entry.assetId !== PLATE);
  const serve = (bytes) => async () => new Response(bytes, { headers: { "content-type": "image/webp" } });
  const flip = (bytes, index) => { const copy = new Uint8Array(bytes); copy[index] ^= 0x01; return copy; };
  const resized = new Uint8Array(original);
  if (String.fromCharCode(...resized.subarray(12, 16)) === "VP8X") resized[24] ^= 0x01; else resized[26] ^= 0x01;
  const cases = {
    [CODES.INTEGRITY]: [flip(original, Math.floor(original.length / 2)), flip(original, original.length - 1)],
    [CODES.BYTES]: [fileBytes(otherPlate.outputPath), original.subarray(0, original.length - 1), new Uint8Array([...original, 0])],
    [CODES.DIMENSIONS]: [resized],
  };
  for (const [code, list] of Object.entries(cases)) {
    for (const bytes of list) {
      const resolver = createJourneyMediaResolver({ media, identity: admitted.identity, fetch: serve(bytes) });
      assert.equal(codeOf(await resolver.read(plate)), code);
    }
  }
  const header = new Uint8Array(original);
  new DataView(header.buffer).setUint32(4, header.length, true);
  const broken = createJourneyMediaResolver({ media, identity: admitted.identity, fetch: serve(header) });
  assert.equal(codeOf(await broken.read(plate)), CODES.BYTES, "the RIFF length must be the file");
  let digests = 0;
  const counted = createJourneyMediaResolver({ media, identity: admitted.identity, fetch: serve(resized), digest: (bytes) => { digests += 1; return sha256Bytes(bytes); } });
  assert.equal(codeOf(await counted.read(plate)), CODES.DIMENSIONS);
  assert.equal(digests, 0, "the header is checked before every byte is hashed");
});

test("TC-S5-ASSET-001 a body longer than the manifest is cut off while it streams, and a plain body still works", async () => {
  let cancelled = false, pulls = 0;
  const original = fileBytes(platePath);
  const endless = async () => new Response(new ReadableStream({
    pull(controller) { pulls += 1; controller.enqueue(original.subarray(0, 65_536)); },
    cancel() { cancelled = true; },
  }), { headers: { "content-type": "image/webp" } });
  const resolver = createJourneyMediaResolver({ media, identity: admitted.identity, fetch: endless });
  assert.equal(codeOf(await resolver.read(plate)), CODES.BYTES);
  assert.equal(cancelled, true);
  assert.ok(pulls <= Math.ceil(plate.byteLength / 65_536) + 2, `stopped after ${pulls} chunks`);
  const plain = createJourneyMediaResolver({ media, identity: admitted.identity, fetch: async () => ({ ok: true, redirected: false, url: "", headers: new Headers({ "content-type": "image/webp" }), arrayBuffer: async () => original.slice().buffer }) });
  assert.equal(codeOf(await plain.read(plate)), "OK");
});

test("TC-S5-ASSET-001 the caller's abort and the time limit end a read as aborted", async () => {
  const hanging = (init) => new Promise((_, reject) => init.signal.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")), { once: true }));
  const slow = createJourneyMediaResolver({ media, identity: admitted.identity, fetch: (url, init) => hanging(init), timeoutMs: 5 });
  assert.equal(codeOf(await slow.read(plate)), CODES.ABORTED, "the time limit");
  const controller = new AbortController();
  const waiting = createJourneyMediaResolver({ media, identity: admitted.identity, fetch: (url, init) => hanging(init) }).read(plate, { signal: controller.signal });
  controller.abort();
  assert.equal(codeOf(await waiting), CODES.ABORTED, "the caller gave up");
  const { server, resolver } = resolverWith();
  const gone = new AbortController();
  gone.abort();
  assert.equal(codeOf(await resolver.read(plate, { signal: gone.signal })), CODES.ABORTED);
  assert.equal(server.calls.length, 0, "an aborted read never starts");
});

test("TC-S5-ASSET-001 the resolver needs a media index, a package identity and a fetch", () => {
  assert.throws(() => createJourneyMediaResolver({ identity: admitted.identity, fetch: async () => null }), TypeError);
  assert.throws(() => createJourneyMediaResolver({ media, identity: {}, fetch: async () => null }), TypeError);
  assert.throws(() => createJourneyMediaResolver({ media, identity: admitted.identity, fetch: "fetch" }), TypeError);
  assert.equal(plate.identity, admitted.identity.key, "a media descriptor names its package identity");
  assert.equal(plate.key, `${admitted.identity.key}:${PLATE}`);
});
