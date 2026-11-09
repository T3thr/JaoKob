/**
 * Journey media index: the asset IDs of a Journey package resolved to same-origin image
 * descriptors from asset manifest v2 (ADR-P0-034 D10.3, physics v2 §8).
 *
 *   - Every descriptor carries the package identity (`identity`) and is keyed by it
 *     (`<identity.key>:<assetId>`), so two packages of one version never share an image
 *     (ADR-P0-034 D7.5, image cache).
 *   - Paths must be relative WebP files under `assets/images/` and resolve inside `baseUrl`;
 *     anything else, duplicated IDs included, is left out and resolves to null.
 *   - Facing: a slot that asks for the other facing gets the manifest's `variantOf` entry.
 *     Manifest v2 allows no mirroring, so when no variant exists the base image is returned
 *     with `facingMatched: false` and the gap is listed by `gaps()` for the asset owner.
 *   - Eye anchor: `stage.eyeAnchorFromTop` is the eye line as a fraction of the canvas height.
 *     The stage uses it to put every face inside the protected band (ADR-P0-032 D7.2,
 *     PO decision C4 of 2026-11-05: one eye anchor per 1024 px image).
 *
 * Byte integrity (`sha256`, `byteLength`) travels on the descriptor; the media resolver reads
 * it from this index, never from the caller (`journey-media-resolver.js`).
 * Trace: ADR-P0-034 D7/D10, ADR-P0-032 D7, SSOT §1.2 (C4), TC-S5-VN-001, TC-S5-ASSET-001.
 */

const CATEGORY_KIND = Object.freeze({ characters: "character", backgrounds: "background", cinematicCGs: "cg", keepsakes: "keepsake" });
const PATH = /^assets\/images\/[a-z0-9][a-z0-9_./-]*\.webp$/;
const ID = /^[a-z0-9][a-z0-9_]*$/;
const MAX_SIDE = 4096;
const MAX_BYTES = 2_000_000;

/**
 * @param {{manifest: unknown, identity: {key: string}, baseUrl: string}} options
 * `baseUrl` is the application directory with its trailing slash (the repository root when
 * served for review, the site root or subpath when released).
 */
export function createJourneyMediaIndex({ manifest, identity, baseUrl } = {}) {
  if (typeof identity?.key !== "string" || identity.key === "") throw new TypeError("A package identity is required");
  const base = parseBase(baseUrl);
  const entries = new Map();
  const variants = new Map();
  const seen = new Map();
  const categories = manifest !== null && typeof manifest === "object" && manifest.categories !== null && typeof manifest.categories === "object" ? manifest.categories : {};
  for (const [category, kind] of Object.entries(CATEGORY_KIND)) {
    const list = Array.isArray(categories[category]) ? categories[category] : [];
    for (const raw of list) {
      const id = raw?.assetId;
      if (typeof id === "string") seen.set(id, (seen.get(id) ?? 0) + 1);
      const entry = base === null ? null : admit(raw, kind, base);
      if (entry !== null) entries.set(entry.assetId, entry);
    }
  }
  for (const [id, count] of seen) if (count > 1) entries.delete(id);
  for (const entry of entries.values()) {
    if (entry.variantOf === null) continue;
    variants.set(`${entry.variantOf}|${entry.facing}`, entry);
  }
  const gaps = new Map();

  function descriptor(entry, facingMatched, thumb) {
    return Object.freeze({
      assetId: entry.assetId,
      kind: entry.kind,
      url: entry.url,
      width: entry.width,
      height: entry.height,
      alt: entry.alt,
      characterId: entry.characterId,
      eyeFromTop: entry.eyeFromTop,
      facing: entry.facing,
      facingMatched,
      sha256: entry.sha256,
      byteLength: entry.byteLength,
      identity: identity.key,
      ...(thumb === null ? {} : { thumb }),
      key: `${identity.key}:${entry.assetId}${thumb === null ? "" : `@${thumb}`}`,
    });
  }

  return Object.freeze({
    /**
     * The image for an asset ID, turned to `facing` when the manifest has that variant. `thumb`
     * asks for a small decode of the same proved file (a card face), a width in pixels.
     * @param {string} assetId @param {{facing?: "left"|"right", thumb?: number}} [options]
     */
    image(assetId, { facing, thumb } = {}) {
      const entry = entries.get(assetId);
      if (entry === undefined) return null;
      const small = Number.isSafeInteger(thumb) && thumb > 0 && thumb < entry.width ? thumb : null;
      if (facing === undefined || entry.facing === null || entry.facing === facing) return descriptor(entry, true, small);
      const variant = variants.get(`${assetId}|${facing}`);
      if (variant !== undefined) return descriptor(variant, true, small);
      gaps.set(`${assetId}|${facing}`, Object.freeze({ assetId, facing }));
      return descriptor(entry, false, small);
    },
    /** Facings that were asked for but have no image yet, for the review page. */
    gaps() {
      return Object.freeze([...gaps.values()]);
    },
  });
}

function parseBase(baseUrl) {
  try {
    const base = new URL(baseUrl);
    if (!["http:", "https:"].includes(base.protocol) || base.username || base.password || base.search || base.hash || !base.pathname.endsWith("/")) return null;
    return base;
  } catch {
    return null;
  }
}

function admit(raw, kind, base) {
  if (raw === null || typeof raw !== "object") return null;
  const { assetId, outputPath, dimensions } = raw;
  if (typeof assetId !== "string" || !ID.test(assetId)) return null;
  if (typeof outputPath !== "string" || !PATH.test(outputPath) || outputPath.split("/").some((part) => part === "" || part === "." || part === "..")) return null;
  const size = typeof dimensions === "string" ? /^(\d{1,4})x(\d{1,4})$/.exec(dimensions) : null;
  if (size === null) return null;
  const width = Number(size[1]), height = Number(size[2]);
  if (width < 1 || height < 1 || width > MAX_SIDE || height > MAX_SIDE) return null;
  if (typeof raw.sha256 !== "string" || !/^[a-f0-9]{64}$/.test(raw.sha256)) return null;
  if (!Number.isSafeInteger(raw.byteLength) || raw.byteLength < 1 || raw.byteLength > MAX_BYTES) return null;
  const facing = raw.facing === "left" || raw.facing === "right" ? raw.facing : null;
  if (raw.facing !== undefined && facing === null) return null;
  const url = new URL(outputPath, base);
  if (url.origin !== base.origin || !url.pathname.startsWith(base.pathname)) return null;
  const eye = raw.stage?.eyeAnchorFromTop;
  const eyeFromTop = kind === "character" && typeof eye === "number" && eye > 0 && eye < 1 ? eye : null;
  if (kind === "character" && eyeFromTop === null) return null;
  const characterId = kind === "character" && typeof raw.characterId === "string" && ID.test(raw.characterId) ? raw.characterId : null;
  const variantOf = typeof raw.variantOf === "string" && ID.test(raw.variantOf) && facing !== null ? raw.variantOf : null;
  return Object.freeze({
    assetId, kind, url: url.href, width, height,
    alt: typeof raw.altTh === "string" ? raw.altTh : "",
    characterId, eyeFromTop, facing, variantOf, sha256: raw.sha256, byteLength: raw.byteLength,
  });
}
