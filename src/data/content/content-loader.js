/** Same-origin content adapter. Trace: FR-CNT-001/002, CR-0002, ADR-P0-013. */
import { collectContentRecords, validateContentPackage } from "../validation/content-validator.js";
import { contentFailure, deepFreeze } from "../validation/content-values.js";

/**
 * Load a static object or HTTP(S) JSON URL. The composition root owns baseUrl,
 * fetch and the reviewed test catalog. No filesystem or storage is consulted.
 * @param {unknown} source
 * @param {{baseUrl?: string, fetch?: Function, testReferenceIds?: readonly string[], expectedContentVersion?: string}} [options]
 * @returns {Promise<Readonly<object>>} Typed failure or immutable package/index/entry.
 */
export async function loadContentPackage(source, options = {}) {
  if (typeof source !== "string") return fromObject(source, options);
  let url;
  try {
    const base = new URL(options.baseUrl ?? import.meta.url);
    url = new URL(source, base);
    if (!["https:", "http:"].includes(base.protocol) || url.origin !== base.origin
      || !["https:", "http:"].includes(url.protocol) || url.username || url.password || url.hash) {
      return contentFailure("$source", "CONTENT_ORIGIN", "Only same-origin HTTP(S) content URLs are allowed.");
    }
  } catch {
    return contentFailure("$source", "CONTENT_ORIGIN", "Content URL could not be resolved.");
  }
  try {
    const fetcher = options.fetch ?? globalThis.fetch;
    if (typeof fetcher !== "function") return contentFailure("$source", "CONTENT_LOAD", "No content reader is available.");
    const response = await fetcher(url.href, { credentials: "omit", redirect: "error", mode: "same-origin" });
    if (!response || response.redirected || (response.url && new URL(response.url).origin !== url.origin)) {
      return contentFailure("$source", "CONTENT_ORIGIN", "Redirected content is not accepted.");
    }
    if (response.ok !== true) return contentFailure("$source", "CONTENT_LOAD", "Content request did not succeed.");
    const text = await response.text();
    return loadContentPackageFromJson(text, options);
  } catch {
    return contentFailure("$source", "CONTENT_LOAD", "Content could not be read.");
  }
}

/** Parse JSON bytes supplied as text by a static reader, without coercion. */
export function loadContentPackageFromJson(text, options = {}) {
  if (typeof text !== "string") return contentFailure("$", "CONTENT_PARSE", "Expected JSON text.");
  let data;
  try { data = JSON.parse(text); }
  catch { return contentFailure("$", "CONTENT_PARSE", "Content is not valid JSON."); }
  return fromObject(data, options);
}

function fromObject(data, options) {
  const result = validateContentPackage(data, options);
  if (!result.valid) return result;
  const names = {
    "narrative-tree.treeId": "trees", "narrative-node.id": "nodes", "dialogue.id": "dialogues",
    "character.id": "characters", "event.id": "events", "asset.id": "assets", "flag.id": "flags",
    "checkpoint.id": "checkpoints", "choice.id": "choices", "interaction.id": "interactions",
    "content-warning.id": "warnings",
  };
  const indexes = Object.create(null);
  for (const [namespace, records] of Object.entries(collectContentRecords(result.packageData))) {
    const index = Object.create(null);
    for (const record of records) index[record.id] = record.value;
    indexes[names[namespace]] = index;
  }
  const tree = indexes.trees[result.packageData.entryTreeId];
  return deepFreeze({ ...result, indexes, entry: { tree, node: indexes.nodes[tree.entryNodeId] } });
}
