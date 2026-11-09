/**
 * Journey package admission: the data-layer gate between a package file and the Core
 * session (SSOT §3.1 "Data: schema · references · capability → immutable catalog").
 *
 * In order: JSON data only · size bound · supported profile and schema version · schema
 * 3.0.0 · every annotated reference resolves · registry IDs are unique · the reserved host
 * ID is not claimed by an extension. The result carries the package's composite identity:
 * profile + package id + contentVersion (`key`), plus the digest of its canonical form that
 * a save must match (ADR-P0-034 D7). Rules the schema cannot express (graph, rounds, endings)
 * are checked by the Core session when it indexes the package.
 *
 * Asset references are not resolved here: asset availability belongs to the media layer and
 * a missing image must never block the story (SSOT §1 "สื่อ").
 *
 * Trace: ADR-P0-034 D1/D4/D6/D7, CR-0006 §2, SSOT §3.5, TC-S5-PACKAGE-001.
 */

import { createContentSchemaValidator } from "../validation/content-schema-validator.js";
import { canonicalJson, sha256Hex, utf8ByteLength } from "../validation/content-digest.js";
import { copyJsonData, deepFreeze } from "../validation/content-values.js";
import { JOURNEY_SCHEMA_CATALOG } from "../validation/journey-schema-catalog.js";

export const JOURNEY_PACKAGE_SCHEMA_ID = "https://t3thr.github.io/JaoKob/specs/schemas/v3.0.0/journey-package.schema.json";
/** Reserved for the host's own story; an extension package may never claim it (CR-0006 §2). */
export const HOST_PACKAGE_ID = "story.jaokob.core";
export const JOURNEY_PACKAGE_PROFILE = "journey";
export const JOURNEY_SCHEMA_VERSION = "3.0.0";
/** Upper bound for a package in canonical UTF-8 (five full acts stay far below it). */
export const JOURNEY_PACKAGE_MAX_BYTES = 2_000_000;

export const JOURNEY_PACKAGE_ERROR_CODES = Object.freeze({
  /** Not JSON, too large, schema violation, unresolved reference or duplicate ID. */
  INVALID: "JOURNEY_PACKAGE_INVALID",
  /** A profile or schema version this runtime does not implement. */
  UNSUPPORTED: "JOURNEY_PACKAGE_UNSUPPORTED",
  /** An extension package claims the host's reserved ID. */
  RESERVED: "JOURNEY_PACKAGE_RESERVED",
});

const validator = createContentSchemaValidator(JOURNEY_SCHEMA_CATALOG);

const failure = (code, path, reason) => deepFreeze({ ok: false, error: { code, details: { path, reason } } });

/** The string form of an identity: one key per package build line, never shared by two packages. */
export const identityKey = ({ profile, id, contentVersion }) => `${profile}:${id}@${contentVersion}`;

/**
 * @param {unknown} value Parsed package JSON (untrusted).
 * @param {{role?: "host" | "extension"}} [options] Only the host may use HOST_PACKAGE_ID.
 * @returns {Readonly<{ok: true, value: {identity: object, package: object}} | {ok: false, error: {code: string, details: {path: string, reason: string}}}>}
 */
export function admitJourneyPackage(value, { role = "host" } = {}) {
  const copied = copyJsonData(value);
  if (!copied.valid) return failure(JOURNEY_PACKAGE_ERROR_CODES.INVALID, copied.errors[0].path, "NOT_JSON_DATA");
  const pkg = copied.value;
  if (pkg === null || typeof pkg !== "object" || Array.isArray(pkg)) return failure(JOURNEY_PACKAGE_ERROR_CODES.INVALID, "$", "NOT_AN_OBJECT");
  if (pkg.profile !== JOURNEY_PACKAGE_PROFILE || pkg.schemaVersion !== JOURNEY_SCHEMA_VERSION) {
    return failure(JOURNEY_PACKAGE_ERROR_CODES.UNSUPPORTED, "$", "PROFILE_OR_SCHEMA_VERSION");
  }

  const canonical = canonicalJson(pkg);
  if (utf8ByteLength(canonical) > JOURNEY_PACKAGE_MAX_BYTES) return failure(JOURNEY_PACKAGE_ERROR_CODES.INVALID, "$", "PACKAGE_TOO_LARGE");

  const result = validator.validate(pkg, JOURNEY_PACKAGE_SCHEMA_ID);
  if (result.errors.length > 0) return failure(JOURNEY_PACKAGE_ERROR_CODES.INVALID, result.errors[0].path, "SCHEMA");

  const registries = {
    "journey-node": [...pkg.nodes.map((n) => n.id), ...pkg.boundaries.map((b) => b.node)],
    "journey-text": pkg.texts.map((t) => t.id),
    "journey-item": pkg.items.map((i) => i.id),
    "journey-flag": pkg.flags.map((f) => f.id),
    "journey-round": pkg.rounds.map((r) => r.id),
    "journey-character": pkg.characters.map((c) => c.id),
  };
  const sets = {};
  for (const [namespace, ids] of Object.entries(registries)) {
    sets[namespace] = new Set(ids);
    if (sets[namespace].size !== ids.length) return failure(JOURNEY_PACKAGE_ERROR_CODES.INVALID, "$", `DUPLICATE_${namespace.slice(8).toUpperCase()}_ID`);
  }
  for (const reference of result.references) {
    if (reference.namespace === "journey-asset") continue;
    if (!sets[reference.namespace]?.has(reference.value)) return failure(JOURNEY_PACKAGE_ERROR_CODES.INVALID, reference.path, "UNRESOLVED_REFERENCE");
  }

  if (role !== "host" && pkg.package.id === HOST_PACKAGE_ID) return failure(JOURNEY_PACKAGE_ERROR_CODES.RESERVED, "$.package.id", "HOST_PACKAGE_ID");

  const identity = {
    profile: JOURNEY_PACKAGE_PROFILE,
    schemaVersion: JOURNEY_SCHEMA_VERSION,
    id: pkg.package.id,
    contentVersion: pkg.package.contentVersion,
    digest: sha256Hex(canonical),
  };
  identity.key = identityKey(identity);
  return deepFreeze({ ok: true, value: { identity, package: pkg } });
}
