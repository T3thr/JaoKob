/** Same-origin, manifest-bound media reader. Trace: CR-0003 D4, FR-CNT-006, NFR-PE-001/005. */
const LIMITS = Object.freeze({ image: 500_000, audio: 2_000_000, font: 256_000 });
const MIME = Object.freeze({ image: ["image/webp"], audio: ["audio/mpeg", "audio/webm"], font: ["font/woff2"] });
const failure = (code) => Object.freeze({ ok: false, error: Object.freeze({ code }) });

/**
 * Resolve only validated content IDs backed by the reviewed hash registry. Invalid
 * references return null; read failures are typed, nonfatal and never expose URLs.
 * baseUrl is the application directory (including its trailing slash), not the package URL.
 */
export function createAssetResolver({ loaded, registry, baseUrl, fetch: fetcher = globalThis.fetch,
  digest = (bytes) => globalThis.crypto.subtle.digest("SHA-256", bytes), timeoutMs = 10_000 } = {}) {
  let base;
  try {
    base = new URL(baseUrl);
    if (!["http:", "https:"].includes(base.protocol) || base.username || base.password || base.search || base.hash
      || !base.pathname.endsWith("/") || /%|\\/.test(base.pathname)) base = null;
  } catch { base = null; }
  const descriptors = new Map();
  const records = registry?.registryVersion === 1 && registry.contentVersion === loaded?.catalog?.version
    && Array.isArray(registry.assets) ? registry.assets : [];
  const duplicates = new Set(records.filter((entry, index) => records.findIndex((other) => other?.assetId === entry?.assetId) !== index).map((entry) => entry?.assetId));
  if (base && loaded?.valid) for (const metadata of records) {
    const asset = loaded.indexes.assets[metadata?.assetId];
    if (!asset || duplicates.has(asset.id) || metadata.path !== asset.path || metadata.type !== asset.type
      || !/^assets\/[a-zA-Z0-9_./-]+$/.test(asset.path) || asset.path.split("/").some((part) => !part || part === "." || part === "..")
      || !MIME[asset.type]?.includes(metadata.mimeType) || !Number.isSafeInteger(metadata.byteLength)
      || metadata.byteLength <= 0 || metadata.byteLength > LIMITS[asset.type]
      || !/^[a-f0-9]{64}$/.test(metadata.sha256 ?? "")) continue;
    if (asset.type === "image" && (!Number.isSafeInteger(metadata.width) || !Number.isSafeInteger(metadata.height)
      || metadata.width <= 0 || metadata.height <= 0 || metadata.width > 1600 || metadata.height > 900
      || metadata.decodedBytes !== metadata.width * metadata.height * 4)) continue;
    if (asset.type === "audio" && (!Number.isSafeInteger(metadata.frames) || metadata.frames <= 0
      || !Number.isSafeInteger(metadata.channels) || metadata.channels < 1 || metadata.channels > 2
      || !Number.isSafeInteger(metadata.sampleRate) || metadata.sampleRate < 8_000 || metadata.sampleRate > 48_000
      || metadata.decodedBytes !== metadata.frames * metadata.channels * 4 || metadata.decodedBytes > 16 * 1024 * 1024)) continue;
    const url = new URL(asset.path, base);
    if (url.origin !== base.origin || !url.pathname.startsWith(base.pathname)) continue;
    descriptors.set(asset.id, Object.freeze({ ...metadata, contentVersion: loaded.catalog.version,
      url: url.href, key: `${loaded.catalog.version}:${asset.id}:${asset.path}` }));
  }

  function resolve(reference, expectedType) {
    if (reference?.contentVersion !== loaded?.catalog?.version) return null;
    const descriptor = descriptors.get(reference?.assetId);
    return descriptor && (!expectedType || descriptor.type === expectedType) ? descriptor : null;
  }

  async function read(reference, { signal } = {}) {
    const descriptor = resolve(reference);
    if (!descriptor || signal?.aborted) return failure("ASSET_REFERENCE");
    const controller = new AbortController();
    const abort = () => controller.abort();
    signal?.addEventListener("abort", abort, { once: true });
    const timer = setTimeout(abort, Math.max(1, Math.min(timeoutMs, 10_000)));
    try {
      const response = await fetcher(descriptor.url, { credentials: "omit", redirect: "error", mode: "same-origin", signal: controller.signal });
      if (!response?.ok || response.redirected || (response.url && response.url !== descriptor.url)) return failure("ASSET_RESPONSE");
      const mimeType = response.headers?.get("content-type")?.split(";")[0].trim().toLowerCase();
      const declaredLength = response.headers?.get("content-length");
      const compressed = Boolean(response.headers?.get("content-encoding") && response.headers.get("content-encoding") !== "identity");
      if (mimeType !== descriptor.mimeType || (!compressed && declaredLength !== null && declaredLength !== undefined
        && (!/^\d+$/.test(declaredLength) || Number(declaredLength) !== descriptor.byteLength))) return failure("ASSET_METADATA");
      const bytes = await boundedBytes(response, descriptor.byteLength, controller.signal);
      if (controller.signal.aborted || !bytes || !matchesMagic(bytes, descriptor.mimeType)) return failure("ASSET_BYTES");
      const hash = [...new Uint8Array(await digest(bytes))].map((byte) => byte.toString(16).padStart(2, "0")).join("");
      if (controller.signal.aborted || hash !== descriptor.sha256) return failure("ASSET_INTEGRITY");
      return { ok: true, value: { descriptor, bytes } };
    } catch { return failure(controller.signal.aborted ? "ASSET_ABORTED" : "ASSET_LOAD"); }
    finally { clearTimeout(timer); signal?.removeEventListener("abort", abort); }
  }
  return Object.freeze({ resolve, read });
}

async function boundedBytes(response, limit, signal) {
  if (!response.body?.getReader) {
    const bytes = await response.arrayBuffer();
    return bytes.byteLength === limit ? bytes : null;
  }
  const reader = response.body.getReader();
  const chunks = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (signal.aborted || size > limit) { await reader.cancel(); return null; }
      chunks.push(value);
    }
    if (size !== limit || signal.aborted) return null;
    const joined = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) { joined.set(chunk, offset); offset += chunk.byteLength; }
    return joined.buffer;
  } finally { reader.releaseLock(); }
}

function matchesMagic(buffer, mime) {
  const bytes = new Uint8Array(buffer);
  const ascii = (offset, value) => [...value].every((character, index) => bytes[offset + index] === character.charCodeAt(0));
  if (mime === "image/webp") return ascii(0, "RIFF") && ascii(8, "WEBP");
  if (mime === "font/woff2") return ascii(0, "wOF2");
  if (mime === "audio/webm") return [0x1a, 0x45, 0xdf, 0xa3].every((byte, index) => bytes[index] === byte);
  return ascii(0, "ID3") || (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0);
}
