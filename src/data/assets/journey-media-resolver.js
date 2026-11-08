/**
 * Journey media resolver: the bytes of a Journey image, read from the same origin and proved
 * against asset manifest v2 before the browser decodes anything (ADR-P0-034 D7.5 · D10.3, T3).
 *
 *   - Only an image the package's media index admitted can be read, and only for the package
 *     identity that index was built on: the URL, size, byte length and SHA-256 come from the
 *     index, never from the caller, so a reference cannot point the reader anywhere else.
 *   - Same origin, no credentials, no redirect. The response must be `image/webp` and exactly
 *     the manifest's byte length (the stream is cut off past it).
 *   - The WebP container must be whole (its RIFF length is the file length) and its header must
 *     give the manifest's width and height, so a swapped, resized or truncated file is refused
 *     before decoding; then the SHA-256 of every byte must equal the manifest's. The image cache
 *     checks the decoded size once more.
 *   - Every failure is a typed, non-fatal result with no URL in it: the slot stays empty and
 *     the story goes on (SSOT §1 "สื่อ").
 *
 * SHA-256 is the synchronous `sha256Bytes` of `content-digest.js`, because Web Crypto is
 * missing in an insecure context (a phone opening the game over a LAN address).
 * The result fits the `readAsset` port of `src/ui/assets/image-cache.js`.
 * Trace: ADR-P0-034 D7.5 · D10.3, SSOT §4.3 T3, TC-S5-ASSET-001, TC-S5-PACKAGE-001.
 */

import { sha256Bytes } from "../validation/content-digest.js";

export const JOURNEY_MEDIA_ERROR_CODES = Object.freeze({
  /** Not an image of this package's media index, or another package's identity. */
  REFERENCE: "MEDIA_REFERENCE",
  /** Not a 2xx answer, a redirect, or an answer from another URL. */
  RESPONSE: "MEDIA_RESPONSE",
  /** Wrong media type or a declared length that is not the manifest's. */
  METADATA: "MEDIA_METADATA",
  /** Too many or too few bytes, or not a whole WebP container. */
  BYTES: "MEDIA_BYTES",
  /** The WebP header gives another width or height than the manifest. */
  DIMENSIONS: "MEDIA_DIMENSIONS",
  /** The SHA-256 of the bytes is not the manifest's. */
  INTEGRITY: "MEDIA_INTEGRITY",
  /** The caller gave up, or the read took longer than the time limit. */
  ABORTED: "MEDIA_ABORTED",
  /** The network or the reader failed. */
  LOAD: "MEDIA_LOAD",
});

export const JOURNEY_MEDIA_TYPE = "image/webp";
const TIME_LIMIT_MS = 10_000;

const failure = (code) => Object.freeze({ ok: false, error: Object.freeze({ code }) });

/**
 * @param {{media: {image: (assetId: string) => object|null}, identity: {key: string},
 *   fetch?: typeof fetch, digest?: (bytes: Uint8Array) => string, timeoutMs?: number}} options
 */
export function createJourneyMediaResolver({ media, identity, fetch: fetcher = globalThis.fetch, digest = sha256Bytes, timeoutMs = TIME_LIMIT_MS } = {}) {
  if (typeof media?.image !== "function") throw new TypeError("A Journey media index is required");
  if (typeof identity?.key !== "string" || identity.key === "") throw new TypeError("A package identity is required");
  if (typeof fetcher !== "function") throw new TypeError("A fetch function is required");
  const limit = Math.max(1, Math.min(Number.isFinite(timeoutMs) ? timeoutMs : TIME_LIMIT_MS, TIME_LIMIT_MS));

  /** The admitted entry for a reference of this identity, or null. */
  function entryOf(reference) {
    if (reference === null || typeof reference !== "object" || reference.identity !== identity.key || typeof reference.assetId !== "string") return null;
    const entry = media.image(reference.assetId);
    return entry !== null && entry.assetId === reference.assetId && entry.identity === identity.key ? entry : null;
  }

  /**
   * Read and prove one image. `{ok: true, value: {descriptor, bytes}}` or a typed failure.
   * @param {object} reference A media descriptor of this package (from the presentation).
   * @param {{signal?: AbortSignal}} [options]
   */
  async function read(reference, { signal } = {}) {
    const entry = entryOf(reference);
    if (entry === null) return failure(JOURNEY_MEDIA_ERROR_CODES.REFERENCE);
    if (signal?.aborted) return failure(JOURNEY_MEDIA_ERROR_CODES.ABORTED);
    const controller = new AbortController();
    const abort = () => controller.abort();
    signal?.addEventListener("abort", abort, { once: true });
    const timer = setTimeout(abort, limit);
    try {
      const response = await fetcher(entry.url, { credentials: "omit", mode: "same-origin", redirect: "error", signal: controller.signal });
      if (!response?.ok || response.redirected || (response.url && response.url !== entry.url)) return failure(JOURNEY_MEDIA_ERROR_CODES.RESPONSE);
      const type = response.headers?.get("content-type")?.split(";")[0].trim().toLowerCase();
      const encoding = response.headers?.get("content-encoding");
      const declared = response.headers?.get("content-length");
      const encoded = typeof encoding === "string" && encoding !== "" && encoding.toLowerCase() !== "identity";
      if (type !== JOURNEY_MEDIA_TYPE || (!encoded && declared !== null && declared !== undefined && (!/^\d+$/.test(declared) || Number(declared) !== entry.byteLength))) {
        return failure(JOURNEY_MEDIA_ERROR_CODES.METADATA);
      }
      const bytes = await exactBytes(response, entry.byteLength, controller.signal);
      if (controller.signal.aborted) return failure(JOURNEY_MEDIA_ERROR_CODES.ABORTED);
      if (bytes === null) return failure(JOURNEY_MEDIA_ERROR_CODES.BYTES);
      const size = webpSize(bytes);
      if (size === null) return failure(JOURNEY_MEDIA_ERROR_CODES.BYTES);
      if (size.width !== entry.width || size.height !== entry.height) return failure(JOURNEY_MEDIA_ERROR_CODES.DIMENSIONS);
      if (digest(bytes) !== entry.sha256) return failure(JOURNEY_MEDIA_ERROR_CODES.INTEGRITY);
      return Object.freeze({
        ok: true,
        value: Object.freeze({
          descriptor: Object.freeze({ type: "image", kind: entry.kind, mimeType: JOURNEY_MEDIA_TYPE, width: entry.width, height: entry.height }),
          bytes,
        }),
      });
    } catch {
      return failure(controller.signal.aborted ? JOURNEY_MEDIA_ERROR_CODES.ABORTED : JOURNEY_MEDIA_ERROR_CODES.LOAD);
    } finally {
      clearTimeout(timer);
      signal?.removeEventListener("abort", abort);
    }
  }

  return Object.freeze({ read });
}

/** Exactly `length` bytes of the body, or null when there are more or fewer. */
async function exactBytes(response, length, signal) {
  if (typeof response.body?.getReader !== "function") {
    const buffer = await response.arrayBuffer();
    return buffer.byteLength === length ? new Uint8Array(buffer) : null;
  }
  const reader = response.body.getReader();
  const bytes = new Uint8Array(length);
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (signal.aborted || size + value.byteLength > length) {
        await reader.cancel();
        return null;
      }
      bytes.set(value, size);
      size += value.byteLength;
    }
    return size === length ? bytes : null;
  } finally {
    reader.releaseLock();
  }
}

const fourCc = (bytes, offset) => String.fromCharCode(bytes[offset], bytes[offset + 1], bytes[offset + 2], bytes[offset + 3]);
const u16 = (bytes, offset) => bytes[offset] | (bytes[offset + 1] << 8);
const u24 = (bytes, offset) => bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16);
const u32 = (bytes, offset) => (bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16) | (bytes[offset + 3] << 24)) >>> 0;

/**
 * The canvas size a WebP file declares, or null when the bytes are not one whole WebP container
 * (RIFF length = file length − 8; first chunk `VP8X` extended, `VP8 ` lossy key frame or `VP8L`
 * lossless, per the WebP container and bitstream specifications).
 * @param {Uint8Array} bytes
 * @returns {{width: number, height: number} | null}
 */
export function webpSize(bytes) {
  if (!(bytes instanceof Uint8Array) || bytes.length < 30) return null;
  if (fourCc(bytes, 0) !== "RIFF" || fourCc(bytes, 8) !== "WEBP" || u32(bytes, 4) + 8 !== bytes.length) return null;
  const chunk = fourCc(bytes, 12);
  if (chunk === "VP8X") return { width: 1 + u24(bytes, 24), height: 1 + u24(bytes, 27) };
  if (chunk === "VP8 ") {
    if ((bytes[20] & 1) !== 0 || bytes[23] !== 0x9d || bytes[24] !== 0x01 || bytes[25] !== 0x2a) return null;
    return { width: u16(bytes, 26) & 0x3fff, height: u16(bytes, 28) & 0x3fff };
  }
  if (chunk === "VP8L") {
    if (bytes[20] !== 0x2f) return null;
    const bits = u32(bytes, 21);
    return { width: 1 + (bits & 0x3fff), height: 1 + ((bits >>> 14) & 0x3fff) };
  }
  return null;
}
