import { STORAGE_ERROR_CODES } from "../../core/ports/storage-port.js";
import { createContentOrchestrator } from "../../core/use-cases/content-orchestration.js";
import { loadContentPackageFromJson } from "../content/content-loader.js";
import { prepareRuntimeContent } from "../content/content-runtime.js";
import { copyJsonData, deepFreeze } from "../validation/content-values.js";
import { validateSaveEnvelope } from "../validation/save-envelope-validator.js";

/** Explicit content mapping, not a save-format migration. Trace: CR-0003 D3,
 * ADR-P0-015, FR-SAV-001/005/006/007, TC-S3-SAVE-001. */
const SOURCE_VERSION = "2.0.0";
const TARGET_VERSION = "2.1.0";

/**
 * Prove the approved presentation-only package delta before admitting any save.
 * The composition root supplies the reviewed original 2.0.0 package and target
 * package, plus the independently reviewed test catalog. Source authority is
 * established by its archived bytes/hash during release verification, not by a
 * version string or a package supplied by the save being migrated. Production
 * must not import the test archive. Both packages are copied, schema-checked,
 * capability-checked and compared; only the exact approved paths are excluded.
 *
 * @param {{sourcePackage: unknown, targetPackage: unknown, testReferenceIds: readonly string[]}} options
 * @returns {Readonly<{ok: true, value: {sourceContentVersion: string, targetContentVersion: string, migrate: Function, canReplaceExisting: Function}}> | Readonly<{ok: false, error: object}>}
 * All failures use SAVE_MIGRATION with a safe reason/path; no input is mutated,
 * persisted, logged, discarded or returned in failure diagnostics.
 */
export function createContentVersionMigration({ sourcePackage, targetPackage, testReferenceIds } = {}) {
  const source = checkedPackage(sourcePackage, "1.1.0", SOURCE_VERSION, testReferenceIds);
  if (!source.ok) return source;
  const target = checkedPackage(targetPackage, "1.2.0", TARGET_VERSION, testReferenceIds);
  if (!target.ok) return target;
  const difference = firstDifference(gameplayProjection(source.value.packageData), gameplayProjection(target.value.packageData));
  if (difference !== null) return failure("CONTENT_GAMEPLAY_CHANGED", difference);

  const sourceEngine = createContentOrchestrator(source.value.catalog);
  const targetEngine = createContentOrchestrator(target.value.catalog);

  /**
   * Validate one untrusted parsed save, then clone and change contentVersion only.
   * Target-version input is an exact no-op in value, returned as a frozen clone.
   * The caller retains raw recovery records and decides normal guarded writes.
   * @param {unknown} input
   * @returns {Readonly<{ok: true, value: {envelope: object, migrated: boolean}}> | Readonly<{ok: false, error: object}>}
   */
  function migrate(input) {
    const copied = copyJsonData(input);
    if (!copied.valid) return failure("SAVE_INVALID_JSON");
    const envelope = copied.value;
    const schema = validateSaveEnvelope(envelope);
    if (!schema.valid) return failure("SAVE_SCHEMA_INVALID", schema.issue.path);
    if (![SOURCE_VERSION, TARGET_VERSION].includes(envelope.contentVersion)) return failure("CONTENT_VERSION_UNSUPPORTED", "$.contentVersion");
    const migrated = envelope.contentVersion === SOURCE_VERSION;
    if (migrated && Object.hasOwn(envelope, "integrity")) return failure("SOURCE_INTEGRITY_UNSUPPORTED", "$.integrity");
    const snapshot = { ...envelope.payload, revision: envelope.revision };
    const sourceCheck = (migrated ? sourceEngine : targetEngine).validateSnapshot(snapshot);
    if (!sourceCheck.ok) return failure("SOURCE_SNAPSHOT_INVALID");

    envelope.contentVersion = TARGET_VERSION;
    const targetSchema = validateSaveEnvelope(envelope);
    if (!targetSchema.valid) return failure("TARGET_SCHEMA_INVALID", targetSchema.issue.path);
    const targetCheck = targetEngine.validateSnapshot({ ...envelope.payload, revision: envelope.revision });
    if (!targetCheck.ok) return failure("TARGET_SNAPSHOT_INVALID");
    if (firstDifference(sourceCheck.value.facts, targetCheck.value.facts) !== null) return failure("CURSOR_OR_ACTIONS_CHANGED");
    return deepFreeze({ ok: true, value: { envelope, migrated } });
  }

  /**
   * Conservative predicate for adapter stage/commit as well as boot admission.
   * T4 must inject this as canReplaceExistingEnvelope at BOTH write boundaries;
   * using it only at boot does not protect records changed by another tab.
   * It authorizes only validated exact-target or explicitly migratable source
   * envelopes, and does not bypass the adapter's revision/raw-race checks.
   * @param {unknown} envelope
   * @returns {boolean}
   */
  function canReplaceExisting(envelope) { return migrate(envelope).ok; }

  return Object.freeze({ ok: true, value: Object.freeze({ sourceContentVersion: SOURCE_VERSION,
    targetContentVersion: TARGET_VERSION, migrate, canReplaceExisting }) });
}

function checkedPackage(input, schemaVersion, contentVersion, testReferenceIds) {
  const copied = copyJsonData(input);
  if (!copied.valid) return failure("CONTENT_INVALID_JSON");
  const data = copied.value;
  if (data?.schemaVersion !== schemaVersion || data?.contentVersion !== contentVersion || data?.entryTreeId !== "tree.act1") {
    return failure("CONTENT_VERSION_UNSUPPORTED");
  }
  const loaded = loadContentPackageFromJson(JSON.stringify(data), { testReferenceIds, expectedContentVersion: contentVersion });
  if (!loaded.valid) return failure("CONTENT_INVALID", loaded.errors[0]?.path);
  const runtime = prepareRuntimeContent(loaded);
  if (!runtime.valid) return failure("CONTENT_CAPABILITY_UNSUPPORTED", runtime.errors[0]?.path);
  return Object.freeze({ ok: true, value: runtime });
}

/** Preserve every authored field except CR-0003's exact additive media paths. */
function gameplayProjection(data) {
  const projected = copyJsonData(data).value;
  delete projected.schemaVersion;
  delete projected.contentVersion;
  delete projected.assets;
  for (const tree of projected.narrativeTrees) {
    delete tree.schemaVersion;
    for (const node of tree.nodes) {
      delete node.environment;
      delete node.backgroundAssetId;
    }
  }
  for (const character of projected.characters.characters) delete character.visualProfile.defaultPortraitAssetId;
  for (const dialogue of projected.dialogues.dialogues) delete dialogue.delivery.portraitAssetId;
  return projected;
}

/** Object key order is immaterial; all array membership/order remains exact. */
function firstDifference(left, right, path = "$") {
  if (Object.is(left, right)) return null;
  if (left === null || right === null || typeof left !== "object" || typeof right !== "object"
    || Array.isArray(left) !== Array.isArray(right)) return path;
  const leftKeys = Object.keys(left).sort(), rightKeys = Object.keys(right).sort();
  if (leftKeys.length !== rightKeys.length || leftKeys.some((key, index) => key !== rightKeys[index])) return path;
  for (const key of leftKeys) {
    const difference = firstDifference(left[key], right[key], `${path}.${key}`);
    if (difference !== null) return difference;
  }
  return null;
}

function failure(reason, path) {
  return deepFreeze({ ok: false, error: { code: STORAGE_ERROR_CODES.SAVE_MIGRATION,
    details: { reason, ...(path === undefined ? {} : { path }) } } });
}
