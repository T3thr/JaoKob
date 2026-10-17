import { CONTENT_SCHEMA_CATALOG } from "../validation/content-schema-catalog.js";
import { createContentSchemaValidator } from "../validation/content-schema-validator.js";
import { contentFailure, copyJsonData, deepFreeze } from "../validation/content-values.js";

const SCHEMA = "https://t3thr.github.io/JaoKob/specs/schemas/presentation-catalog.schema.json";
const LIMIT = 64_000;
const invalid = (path, code = "PRESENTATION_REFERENCE") => contentFailure(path, code, "Presentation metadata is not usable.");

/** Strict decoration boundary. It cannot supply a gameplay condition or effect.
 * Missing optional records are permitted; dangling/duplicate records are not.
 * Trace: CR-0005 T9, FR-CNT-001/006, FR-LOC-001/003, TC-S4-CHOICE-001.
 */
export function validatePresentationCatalog(input, loaded) {
  const copied = copyJsonData(input);
  if (!copied.valid) return invalid("$", "PRESENTATION_SCHEMA");
  const result = createContentSchemaValidator(CONTENT_SCHEMA_CATALOG).validate(copied.value, SCHEMA);
  if (result.errors.length) return invalid(result.errors[0].path, "PRESENTATION_SCHEMA");
  const catalog = copied.value;
  if (!loaded?.valid || catalog.contentVersion !== loaded.catalog.version || !loaded.packageData.supportedLocales.includes(catalog.locale)) return invalid("$.contentVersion");
  const unique = (list, field) => new Set(list.map(value => value[field])).size === list.length;
  if (!unique(catalog.choices, "actionId") || !unique(catalog.items, "itemId") || !unique(catalog.backgrounds, "assetId")) return invalid("$", "PRESENTATION_DUPLICATE");
  for (const choice of catalog.choices) {
    if (!loaded.indexes.choices[choice.actionId] && !loaded.indexes.interactions[choice.actionId]) return invalid("$.choices");
    if (!choice.intent.th.trim() || /[<>\u2013\u2014\u200d]|\p{Extended_Pictographic}|[0-9]|HP|Sanity|Bond|END-|คะแนน|ดีที่สุด/iu.test(choice.intent.th)) return invalid("$.choices.intent", "PRESENTATION_TEXT");
  }
  const image = id => loaded.indexes.assets[id]?.type === "image";
  for (const item of catalog.items) if (!loaded.indexes.items[item.itemId] || !image(item.imageAssetId)) return invalid("$.items");
  for (const background of catalog.backgrounds) if (!image(background.assetId)) return invalid("$.backgrounds");
  return deepFreeze({ valid: true, catalog,
    choices: Object.fromEntries(catalog.choices.map(c => [c.actionId, c])),
    items: Object.fromEntries(catalog.items.map(i => [i.itemId, i])),
    backgrounds: Object.fromEntries(catalog.backgrounds.map(b => [b.assetId, b])),
  });
}

/** Bounded same-origin JSON or an explicitly injected object; no remote schema
 * resolution. Failure removes decoration, never changes story/save admission.
 */
export async function loadPresentationCatalog(source, { loaded, baseUrl = import.meta.url, fetch: fetcher = globalThis.fetch } = {}) {
  if (typeof source !== "string") return validatePresentationCatalog(source, loaded);
  let url;
  try {
    const base = new URL(baseUrl); url = new URL(source, base);
    if (!["http:", "https:"].includes(url.protocol) || url.origin !== base.origin || url.username || url.password || url.hash || url.search) return invalid("$source", "PRESENTATION_ORIGIN");
  } catch { return invalid("$source", "PRESENTATION_ORIGIN"); }
  const controller = new AbortController(), timer = setTimeout(() => controller.abort(), 10_000);
  try {
    const response = await fetcher(url.href, { credentials: "omit", mode: "same-origin", redirect: "error", signal: controller.signal });
    if (!response?.ok || response.redirected || response.url && response.url !== url.href) return invalid("$source", "PRESENTATION_LOAD");
    if (response.headers?.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json") return invalid("$source", "PRESENTATION_LOAD");
    const reader = response.body.getReader(), chunks = []; let size = 0;
    try {
      while (true) {
        const { done, value } = await reader.read(); if (done) break;
        size += value.byteLength;
        if (size > LIMIT || controller.signal.aborted) { await reader.cancel(); return invalid("$source", "PRESENTATION_LIMIT"); }
        chunks.push(value);
      }
    } finally { reader.releaseLock(); }
    const bytes = new Uint8Array(size); let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    return validatePresentationCatalog(JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)), loaded);
  } catch { return invalid("$source", "PRESENTATION_LOAD"); }
  finally { clearTimeout(timer); }
}
