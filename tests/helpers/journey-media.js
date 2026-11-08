import { readFileSync } from "node:fs";
import { webpSize } from "../../src/data/assets/journey-media-resolver.js";

/** Helpers for the Journey media tests: real image bytes from the repository, browser image ports in Node. */
export const MEDIA_BASE = "http://127.0.0.1:8000/";
const repository = new URL("../../", import.meta.url);

/**
 * A same-origin server over the repository's files. `change(path, bytes)` may return other bytes
 * (a damaged or swapped file); `headers(path)` adds or replaces response headers.
 */
export function repositoryFetch({ base = MEDIA_BASE, change = (path, bytes) => bytes, headers = () => ({}) } = {}) {
  const calls = [];
  async function fetch(url, init = {}) {
    calls.push({ url, init });
    if (init.signal?.aborted) throw new DOMException("aborted", "AbortError");
    if (!url.startsWith(base)) throw new TypeError("cross-origin request");
    const path = url.slice(base.length);
    let bytes;
    try { bytes = new Uint8Array(readFileSync(new URL(path, repository))); } catch { return new Response(null, { status: 404 }); }
    bytes = change(path, bytes);
    return new Response(bytes, { status: 200, headers: { "content-type": "image/webp", "content-length": String(bytes.length), ...headers(path) } });
  }
  return { fetch, calls };
}

/** The bytes of a repository file. */
export const fileBytes = (path) => new Uint8Array(readFileSync(new URL(path, repository)));

/**
 * `createObjectURL` over real Blobs and an image that decodes by reading the WebP header of its
 * blob, so the image cache runs its real budget and size checks in Node.
 */
export function browserImages() {
  const blobs = new Map();
  const revoked = [];
  let created = 0;
  return {
    createObjectURL(blob) {
      created += 1;
      const url = `blob:test-${created}`;
      blobs.set(url, blob);
      return url;
    },
    revokeObjectURL(url) {
      revoked.push(url);
      blobs.delete(url);
    },
    createImage: () => ({
      src: "",
      decoding: "auto",
      naturalWidth: 0,
      naturalHeight: 0,
      async decode() {
        const blob = blobs.get(this.src);
        const size = blob === undefined ? null : webpSize(new Uint8Array(await blob.arrayBuffer()));
        if (size === null) throw new Error("decode");
        this.naturalWidth = size.width;
        this.naturalHeight = size.height;
      },
      removeAttribute(name) { if (name === "src") this.src = ""; },
    }),
    created: () => created,
    revoked,
    /** Object URLs not revoked yet. */
    live: () => blobs.size,
  };
}

/** Let fetches, body reads and decodes finish (they take macrotask turns in Node). */
export async function settle(turns = 12) {
  for (let i = 0; i < turns; i += 1) await new Promise((resolve) => setImmediate(resolve));
}
