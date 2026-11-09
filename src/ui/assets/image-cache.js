/** Ref-counted decoded image LRU. Trace: CR-0003 D4, NFR-PE-005, ADR-P0-034 D7 (identity). */
export const IMAGE_BUDGET_BYTES = 32 * 1024 * 1024;

/**
 * acquire returns a decoded image lease, or null on any failure. Every successful
 * caller must release its lease after removal from the stage. Retained images and
 * in-flight decodes count toward the same budget; only inactive entries are evicted.
 * At most two scene plates (`kind: "background"`) are kept; when that limit binds, the least
 * recently used idle plate goes first, never an unrelated image.
 * Entries are keyed by the reference's package identity (profile + package id + contentVersion)
 * and asset ID, so two packages that share a version never share an image.
 */
export function createImageCache({ readAsset, createImage = () => new Image(),
  createObjectURL = (blob) => URL.createObjectURL(blob), revokeObjectURL = (url) => URL.revokeObjectURL(url),
  maxBytes = IMAGE_BUDGET_BYTES } = {}) {
  const budget = Math.min(IMAGE_BUDGET_BYTES, Math.max(0, maxBytes));
  const entries = new Map(), pending = new Map();
  let bytes = 0, disposed = false, tick = 0;
  function remove(key, entry) {
    entries.delete(key); bytes -= entry.bytes;
    revokeObjectURL(entry.url); entry.image.removeAttribute?.("src");
  }
  /** The least recently used entry nobody holds (a plate only, when `plates`), or undefined. */
  function idle(plates) {
    return [...entries.entries()].filter(([, entry]) => !entry.refs && !entry.decoding && (!plates || entry.background))
      .sort((a, b) => a[1].used - b[1].used)[0];
  }
  function room(size, background) {
    const backgrounds = () => [...entries.values()].filter((entry) => entry.background).length;
    while (background && backgrounds() >= 2) {
      const candidate = idle(true);
      if (!candidate) return false;
      remove(...candidate);
    }
    while (bytes + size > budget) {
      const candidate = idle(false);
      if (!candidate) return false;
      remove(...candidate);
    }
    return true;
  }
  async function prepare(reference, key, signal) {
    let entry;
    try {
      const result = await readAsset(reference, { signal });
      if (disposed || signal.aborted || !result?.ok || result.value.descriptor.type !== "image") return null;
      const { descriptor, bytes: encoded } = result.value;
      const size = descriptor.width * descriptor.height * 4;
      const background = descriptor.kind === "background";
      if (!Number.isSafeInteger(size) || size <= 0 || size > budget || !room(size, background)) return null;
      const image = createImage();
      const url = createObjectURL(new Blob([encoded], { type: descriptor.mimeType }));
      entry = { image, url, bytes: size, refs: 0, used: ++tick, decoding: true, background };
      entries.set(key, entry); bytes += size;
      image.decoding = "async"; image.src = url;
      const abortDecode = () => image.removeAttribute?.("src");
      signal.addEventListener("abort", abortDecode, { once: true });
      try { await image.decode(); } finally { signal.removeEventListener("abort", abortDecode); }
      if (disposed || signal.aborted || image.naturalWidth !== descriptor.width || image.naturalHeight !== descriptor.height) {
        if (entries.get(key) === entry) remove(key, entry);
        return null;
      }
      entry.decoding = false;
      return entry;
    } catch { if (entry && entries.get(key) === entry) remove(key, entry); return null; }
  }
  async function acquire(reference, { signal } = {}) {
    const owner = reference?.identity;
    if (disposed || signal?.aborted || !reference?.assetId || typeof owner !== "string" || owner === "") return null;
    const key = `${owner}:${reference.assetId}`;
    let entry = entries.get(key);
    if (!entry || entry.decoding) {
      if (!pending.has(key)) {
        const job = { controller: new AbortController(), consumers: new Set() };
        pending.set(key, job);
        job.task = prepare(reference, key, job.controller.signal).finally(() => pending.delete(key));
      }
      const job = pending.get(key), consumer = {};
      job.consumers.add(consumer);
      const cancel = () => { job.consumers.delete(consumer); if (!job.consumers.size) job.controller.abort(); };
      signal?.addEventListener("abort", cancel, { once: true });
      try { entry = await job.task; }
      finally { signal?.removeEventListener("abort", cancel); job.consumers.delete(consumer); }
    }
    if (!entry || disposed || signal?.aborted || entries.get(key) !== entry) return null;
    entry.refs += 1; entry.used = ++tick;
    let released = false;
    return Object.freeze({ image: entry.image, url: entry.url, release() {
      if (released) return;
      released = true; entry.refs -= 1; entry.used = ++tick;
      if (disposed && !entry.refs && entries.get(key) === entry) remove(key, entry);
    } });
  }
  function dispose() {
    disposed = true;
    for (const job of pending.values()) job.controller.abort();
    for (const [key, entry] of entries) if (!entry.refs) remove(key, entry);
  }
  /** Decoded bytes kept (`bytes`), and of those the ones held by a caller now (`retainedBytes`). */
  function stats() {
    const held = [...entries.values()].filter((entry) => entry.refs);
    return Object.freeze({ bytes, entries: entries.size, pending: pending.size, retained: held.length,
      retainedBytes: held.reduce((sum, entry) => sum + entry.bytes, 0), budget });
  }
  return Object.freeze({ acquire, dispose, stats });
}
