/**
 * Save Format 2 · journey profile: build, seal, validate and classify one save record
 * (ADR-P0-034 D7, SSOT §3.2).
 *
 * Every stored record is put in exactly one class:
 *   valid    journey-1 of this package build: schema 3.0.0, integrity and the Core's meaning hold
 *   unknown  journey-1 of another package, version or build, or a record shape this runtime
 *            does not own — the bytes are kept and never overwritten silently
 *   future   a newer save format or journey profile — kept, never overwritten silently
 *   corrupt  unreadable, over budget, schema, integrity or meaning failure — replaceable by
 *            recovery, and kept until the player consents when nothing else can be recovered
 * The identity checks come before the schema, so a record from another build is protected even
 * when this runtime cannot read it.
 *
 * Trace: ADR-P0-034 D7/D8, ADR-P0-014, SSOT §3.2, TC-S5-SAVE-001, TC-S5-SAVE-002, TC-S5-PACKAGE-001.
 */

import { createContentSchemaValidator } from "./content-schema-validator.js";
import { CANONICALIZATION, DIGEST_ALGORITHM, canonicalJson, digestJson, utf8ByteLength } from "./content-digest.js";
import { copyJsonData, deepFreeze } from "./content-values.js";
import { JOURNEY_SCHEMA_CATALOG } from "./journey-schema-catalog.js";

export const SAVE_FORMAT_VERSION = 2;
export const JOURNEY_SAVE_PROFILE = "journey-1";
export const JOURNEY_SAVE_SCHEMA_ID = "https://t3thr.github.io/JaoKob/specs/schemas/v3.0.0/journey-save.schema.json";
export const JOURNEY_SETTINGS_SCHEMA_ID = `${JOURNEY_SAVE_SCHEMA_ID}#/$defs/settings`;
/** UTF-8 budget of one stored record (SSOT §3.2 · the largest save the schema admits is ~166 KB). */
export const JOURNEY_SAVE_MAX_BYTES = 250_000;
export const JOURNEY_SAVE_REASONS = Object.freeze(["new-game", "action-committed", "settings-changed", "lifecycle-suspend", "replay-started"]);

const validator = createContentSchemaValidator(JOURNEY_SCHEMA_CATALOG);
const PROFILE = /^journey-([1-9][0-9]{0,8})$/;
const isRecord = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const issue = (path, reason) => deepFreeze({ valid: false, issue: { path, reason } });

/** Schema 3.0.0 plus the one rule the schema cannot state: the two contentVersion fields agree. */
export function validateJourneySave(value) {
  const result = validator.validate(value, JOURNEY_SAVE_SCHEMA_ID);
  if (result.errors.length > 0) return issue(result.errors[0].path, "SCHEMA");
  if (value.contentVersion !== value.package.contentVersion) return issue("$.contentVersion", "CONTENT_VERSION_MISMATCH");
  return deepFreeze({ valid: true });
}

/** Settings as the save carries them (also the shape of the device settings record). */
export function validateJourneySettings(value) {
  const result = validator.validate(value, JOURNEY_SETTINGS_SCHEMA_ID);
  return result.errors.length > 0 ? issue(result.errors[0].path, "SCHEMA") : deepFreeze({ valid: true });
}

/**
 * The record for one session state. `createdAt` is the session's start, so a replay keeps it.
 *
 * @param {{identity: object, state: {revision: number, payload: object}, settings: object, savedAt: string, reason: string}} input
 */
export function buildJourneySave({ identity, state, settings, savedAt, reason }) {
  return {
    saveFormatVersion: SAVE_FORMAT_VERSION,
    profile: JOURNEY_SAVE_PROFILE,
    package: { id: identity.id, contentVersion: identity.contentVersion, digest: identity.digest },
    contentVersion: identity.contentVersion,
    revision: state.revision,
    createdAt: state.payload.startedAt,
    savedAt,
    reason,
    settings,
    payload: state.payload,
  };
}

const withoutIntegrity = (envelope) => Object.fromEntries(Object.entries(envelope).filter(([key]) => key !== "integrity"));

/** The same record with an integrity digest over everything else (canonical JSON, SHA-256). */
export function sealJourneySave(envelope) {
  const body = withoutIntegrity(envelope);
  return { ...body, integrity: { algorithm: DIGEST_ALGORITHM, canonicalization: CANONICALIZATION, digest: digestJson(body) } };
}

/** True when the record has no integrity block or its digest matches the rest of the record. */
export function integrityHolds(envelope) {
  if (!Object.hasOwn(envelope, "integrity")) return true;
  return envelope.integrity.digest === digestJson(withoutIntegrity(envelope));
}

/**
 * Two records hold the same story when only the save metadata differs: savedAt, reason,
 * settings, playTimeMs and integrity. A revision names one story state, so a rewrite at the
 * same revision may refresh metadata but never change the story.
 */
export function sameStory(left, right) {
  const story = (envelope) => canonicalJson({
    package: envelope.package, contentVersion: envelope.contentVersion, revision: envelope.revision,
    createdAt: envelope.createdAt, payload: { ...envelope.payload, playTimeMs: 0 },
  });
  return story(left) === story(right);
}

const verdict = (status, reason, envelope) => deepFreeze(envelope === undefined ? { status, reason } : { status, reason, envelope });

/**
 * Classify one stored record for one package build.
 *
 * @param {unknown} raw The stored text.
 * @param {{identity: {id: string, contentVersion: string, digest: string}, admit?: (envelope: object) => boolean}} context
 * `admit` is the Core's semantic check (cursor, encounter, snapshots, history against the package).
 */
export function classifyJourneySave(raw, { identity, admit }) {
  if (typeof raw !== "string") return verdict("corrupt", "NOT_TEXT");
  let parsed;
  try { parsed = JSON.parse(raw); } catch { return verdict("corrupt", "MALFORMED_JSON"); }
  if (!isRecord(parsed)) return verdict("corrupt", "NOT_AN_OBJECT");

  const format = parsed.saveFormatVersion;
  if (!Number.isSafeInteger(format)) return verdict("corrupt", "NO_SAVE_FORMAT");
  if (format > SAVE_FORMAT_VERSION) return verdict("future", "FUTURE_SAVE_FORMAT");
  if (format < SAVE_FORMAT_VERSION) return verdict("unknown", "FOREIGN_SAVE_FORMAT");
  if (typeof parsed.profile !== "string") return verdict("unknown", "FOREIGN_PROFILE");
  const profile = PROFILE.exec(parsed.profile);
  if (profile === null) return verdict("unknown", "FOREIGN_PROFILE");
  if (Number(profile[1]) > 1) return verdict("future", "FUTURE_PROFILE");

  const own = parsed.package;
  if (isRecord(own) && typeof own.id === "string" && typeof own.contentVersion === "string" && typeof own.digest === "string") {
    if (own.id !== identity.id) return verdict("unknown", "OTHER_PACKAGE");
    if (own.contentVersion !== identity.contentVersion) return verdict("unknown", "OTHER_CONTENT_VERSION");
    if (own.digest !== identity.digest) return verdict("unknown", "OTHER_PACKAGE_BUILD");
  }

  if (utf8ByteLength(raw) > JOURNEY_SAVE_MAX_BYTES) return verdict("corrupt", "SAVE_BUDGET_EXCEEDED");
  const copied = copyJsonData(parsed);
  if (!copied.valid) return verdict("corrupt", "NOT_JSON_DATA");
  const envelope = deepFreeze(copied.value);
  if (!validateJourneySave(envelope).valid) return verdict("corrupt", "SCHEMA");
  if (!integrityHolds(envelope)) return verdict("corrupt", "INTEGRITY");
  if (admit !== undefined) {
    let admitted = false;
    try { admitted = admit(envelope) === true; } catch { admitted = false; }
    if (!admitted) return verdict("corrupt", "MEANING");
  }
  return verdict("valid", "OK", envelope);
}
