import test from "node:test";
import assert from "node:assert/strict";
import { setImmediate as nextTurn } from "node:timers/promises";
import { createImageCache, IMAGE_BUDGET_BYTES } from "../../src/ui/assets/image-cache.js";

const ref = (id) => ({ assetId: id, contentVersion: "2.1.0" });
function setup(options = {}) {
  const reads = [], revoked = [], images = [];
  const cache = createImageCache({
    readAsset: async (reference) => { reads.push(reference); return { ok: true, value: {
      descriptor: { type: "image", path: `assets/images/backgrounds/${reference.assetId}.webp`, mimeType: "image/webp", width: 10, height: 10 }, bytes: new ArrayBuffer(8),
    } }; },
    createImage: () => { const image = { naturalWidth: 10, naturalHeight: 10, decode: async () => undefined, removeAttribute(key) { delete this[key]; } }; images.push(image); return image; },
    createObjectURL: () => `blob:fixture-${images.length}`, revokeObjectURL: (url) => revoked.push(url), ...options,
  });
  return { cache, reads, revoked, images };
}
test("TC-S3-ASSET-001: lease resolves only after decode; parallel leases deduplicate and retain counts", async () => {
  let decode;
  const { cache, reads } = setup({ createImage: () => ({ naturalWidth: 10, naturalHeight: 10, decode: () => new Promise((resolve) => { decode = resolve; }) }) });
  let settled = false;
  const first = cache.acquire(ref("a")).then((lease) => { settled = true; return lease; });
  const second = cache.acquire(ref("a"));
  await nextTurn();
  assert.equal(settled, false); assert.equal(reads.length, 1); assert.equal(cache.stats().bytes, 400);
  decode(); const [one, two] = await Promise.all([first, second]);
  assert.equal(one.url, two.url); assert.equal(one.image, two.image); assert.equal(cache.stats().retained, 1);
  one.release(); one.release(); assert.equal(cache.stats().retained, 1);
  two.release(); assert.equal(cache.stats().retained, 0); cache.dispose(); assert.equal(cache.stats().bytes, 0);
});
test("TC-S3-ASSET-001: retained image cannot be evicted and inactive LRU releases its blob", async () => {
  const { cache, revoked } = setup({ maxBytes: 800 });
  const a = await cache.acquire(ref("a")), b = await cache.acquire(ref("b"));
  assert.equal(await cache.acquire(ref("c")), null);
  a.release(); const c = await cache.acquire(ref("c"));
  assert.ok(c); assert.deepEqual(revoked, [a.url]); assert.equal(cache.stats().bytes, 800);
  b.release(); c.release(); cache.dispose(); assert.equal(revoked.length, 3);
});
test("TC-S3-ASSET-001: maximum two backgrounds includes pinned and pending images", async () => {
  const { cache } = setup();
  const a = await cache.acquire(ref("a")), b = await cache.acquire(ref("b"));
  assert.equal(await cache.acquire(ref("c")), null);
  a.release(); const c = await cache.acquire(ref("c")); assert.ok(c);
  b.release(); c.release(); cache.dispose();
});
test("TC-S3-ASSET-001: same environment reuses decoded image without reload", async () => {
  const { cache, reads } = setup();
  const a = await cache.acquire(ref("a")); a.release();
  const again = await cache.acquire(ref("a")); assert.equal(a.url, again.url); assert.equal(reads.length, 1);
  again.release(); cache.dispose();
});
test("TC-S3-ASSET-001: corruption, wrong dimensions and decode failures never return a broken image", async () => {
  for (const options of [
    { readAsset: async () => ({ ok: false }) },
    { createImage: () => ({ naturalWidth: 11, naturalHeight: 10, decode: async () => undefined }) },
    { createImage: () => ({ naturalWidth: 10, naturalHeight: 10, decode: async () => { throw new Error("decode"); } }) },
  ]) {
    const { cache } = setup(options);
    assert.equal(await cache.acquire(ref("a")), null); assert.equal(cache.stats().bytes, 0); cache.dispose();
  }
});
test("TC-S3-ASSET-001: shared caller abort leaves another caller's same-image request intact", async () => {
  let finish, signal;
  const { cache } = setup({ readAsset: (reference, options) => {
    signal = options.signal;
    return new Promise((resolve) => { finish = () => resolve({ ok: true, value: { descriptor: { type: "image", path: "assets/images/backgrounds/a.webp", mimeType: "image/webp", width: 10, height: 10 }, bytes: new ArrayBuffer(8) } }); });
  } });
  const controller = new AbortController();
  const a = cache.acquire(ref("a"), { signal: controller.signal }), b = cache.acquire(ref("a"));
  controller.abort(); assert.equal(signal.aborted, false);
  finish(); assert.equal(await a, null); const lease = await b; assert.ok(lease); lease.release(); cache.dispose();
});
test("TC-S3-ASSET-001: cancelling last consumer aborts its pending fetch and disposes without retained leaks", async () => {
  let signal;
  const { cache } = setup({ readAsset: (_, options) => {
    signal = options.signal;
    return new Promise((resolve) => signal.addEventListener("abort", () => resolve({ ok: false }), { once: true }));
  } });
  const controller = new AbortController(); const pending = cache.acquire(ref("a"), { signal: controller.signal });
  controller.abort(); assert.equal(signal.aborted, true); assert.equal(await pending, null); assert.equal(cache.stats().bytes, 0);
  cache.dispose(); assert.equal(await cache.acquire(ref("a")), null);
});
test("TC-S3-ASSET-001: disposal keeps active lease alive until caller releases", async () => {
  const { cache, revoked } = setup({ maxBytes: 100 * IMAGE_BUDGET_BYTES });
  const a = await cache.acquire(ref("a"));
  assert.equal(cache.stats().budget, IMAGE_BUDGET_BYTES);
  cache.dispose(); assert.equal(revoked.length, 0); assert.equal(cache.stats().bytes, 400);
  a.release(); assert.equal(revoked.length, 1); assert.equal(cache.stats().bytes, 0);
});
test("TC-S5-PACKAGE-001: two packages of the same version never share a decoded image (ADR-P0-034 D7 identity)", async () => {
  const { cache, reads } = setup();
  const core = await cache.acquire({ identity: "journey:story.jaokob.core@0.1.0", assetId: "a", contentVersion: "0.1.0" });
  const mini = await cache.acquire({ identity: "journey:story.fixture.mini@0.1.0", assetId: "a", contentVersion: "0.1.0" });
  assert.notEqual(core.url, mini.url); assert.equal(reads.length, 2); assert.equal(cache.stats().entries, 2);
  const again = await cache.acquire({ identity: "journey:story.jaokob.core@0.1.0", assetId: "a" });
  assert.equal(again.url, core.url); assert.equal(reads.length, 2);
  for (const reference of [{ assetId: "a" }, { identity: "", assetId: "a" }, { identity: 7, assetId: "a" }]) assert.equal(await cache.acquire(reference), null);
  core.release(); mini.release(); again.release(); cache.dispose();
});
test("TC-S5-ASSET-001: a Journey plate (kind background) counts toward the two plates, and an idle plate goes before other idle images", async () => {
  const kinds = { p1: "background", p2: "background", p3: "background", face: "character" };
  const { cache, revoked } = setup({ readAsset: async (reference) => ({ ok: true, value: {
    descriptor: { type: "image", kind: kinds[reference.assetId], mimeType: "image/webp", width: 10, height: 10 }, bytes: new ArrayBuffer(8),
  } }) });
  const journey = (assetId) => ({ identity: "journey:story.jaokob.core@0.1.0", assetId });
  const face = await cache.acquire(journey("face")); face.release();
  const p1 = await cache.acquire(journey("p1")), p2 = await cache.acquire(journey("p2"));
  assert.equal(await cache.acquire(journey("p3")), null, "two plates on screen leave no room for a third");
  p1.release();
  const p3 = await cache.acquire(journey("p3"));
  assert.ok(p3);
  assert.equal(cache.stats().retainedBytes, 800, "two plates held, the idle face kept but not held");
  assert.equal(cache.stats().bytes, 1200);
  assert.deepEqual(revoked, [p1.url], "the idle plate went; the idle face stayed");
  assert.equal(cache.stats().entries, 3);
  p2.release(); p3.release(); cache.dispose();
});
