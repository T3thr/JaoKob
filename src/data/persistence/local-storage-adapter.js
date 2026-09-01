import { STORAGE_ERROR_CODES } from "../../core/ports/storage-port.js";
import {
  CURRENT_SAVE_FORMAT_VERSION,
  validateSaveEnvelope,
} from "../validation/save-envelope-validator.js";

/**
 * The only origin keys this adapter is allowed to inspect or mutate.
 * Settings are named here for namespace ownership, but SaveRepository
 * operations never parse or clear the separate SettingsRepository record.
 *
 * Trace: FR-SAV-002, NFR-CO-001.
 */
export const LOCAL_STORAGE_KEYS = Object.freeze({
  canonical: "jaokob:save:canonical",
  staging: "jaokob:save:staging",
  backup: "jaokob:save:backup",
  settings: "jaokob:settings",
});

export const SAVE_CANDIDATE_MAX_BYTES = 250_000;

const CANDIDATE_SOURCES = Object.freeze(["canonical", "staging", "backup"]);
const SOURCE_PRIORITY = Object.freeze({ canonical: 0, staging: 1, backup: 2 });

/**
 * @typedef {object} StorageLike
 * @property {(key: string) => string | null} getItem
 * @property {(key: string, value: string) => void} setItem
 * @property {(key: string) => void} removeItem
 */

/**
 * @typedef {object} CandidateRecord
 * @property {"canonical" | "staging" | "backup"} source
 * @property {Record<string, unknown>} envelope
 */

/**
 * @typedef {object} AdapterOptions
 * @property {StorageLike} [storage] Injected storage for tests or alternative hosts.
 * @property {(envelope: Readonly<Record<string, unknown>>, context: Readonly<{source: string, request?: Readonly<Record<string, unknown>>}>) => unknown} [validateEnvelope]
 * Additional pure semantic/content-compatibility validation after the built-in
 * current Save Envelope schema check.
 */

/**
 * Create a synchronous LocalStorage implementation of SaveRepositoryPort.
 *
 * LocalStorage is synchronous, so this concrete adapter returns immediate
 * PortResult values. The structural port still permits Promise outcomes for
 * future persistence technologies. All browser/storage exceptions are caught
 * at this boundary and converted to STORAGE_ERROR_CODES.
 *
 * Success values use provisional adapter records because the Core port leaves
 * value shapes generic: stage/commit/checkpoint/load return either null or
 * `{source, envelope}`, while recoverCandidates returns
 * `{candidates, rejected}` with safe provenance only.
 *
 * @param {StorageLike | AdapterOptions} [storageOrOptions]
 * @returns {Readonly<import("../../core/ports/storage-port.js").StoragePort>}
 */
export function createLocalStorageAdapter(storageOrOptions) {
  const options = normalizeOptions(storageOrOptions);
  const storageResolution = resolveStorage(options);
  const additionalValidator = typeof options.validateEnvelope === "function"
    ? options.validateEnvelope
    : null;

  function recoverCandidates(request = undefined) {
    const unavailable = unavailableStorageResult(storageResolution, "recoverCandidates");
    if (unavailable !== null) return unavailable;

    const candidates = [];
    const rejected = [];
    const storageFailures = [];

    for (const source of CANDIDATE_SOURCES) {
      const read = readStorage(storageResolution.storage, source, "recoverCandidates");
      if (!read.ok) {
        storageFailures.push(read);
        rejected.push(rejectedRecord(source, read.error.code, "STORAGE_READ_FAILED"));
        continue;
      }
      if (read.value === null) continue;

      const parsed = parseAndValidate(read.value, source, request, additionalValidator);
      if (!parsed.ok) {
        rejected.push(rejectedRecord(
          source,
          parsed.error.code,
          parsed.error.details?.reason ?? "INVALID_CANDIDATE",
        ));
        continue;
      }
      candidates.push(candidateRecord(source, parsed.value));
    }

    candidates.sort(compareCandidates);
    if (candidates.length === 0 && storageFailures.length > 0) {
      return storageFailures[0];
    }

    return success(Object.freeze({
      candidates: Object.freeze(candidates),
      rejected: Object.freeze(rejected),
    }));
  }

  function load(request = undefined) {
    const recovered = recoverCandidates(request);
    if (!recovered.ok) return recovered;

    if (recovered.value.candidates.length > 0) {
      const selected = recovered.value.candidates[0];
      return success(candidateRecord(selected.source, selected.envelope));
    }
    if (recovered.value.rejected.length > 0) {
      const rejection = recovered.value.rejected[0];
      return failure(rejection.code, {
        operation: "load",
        source: rejection.source,
        reason: "NO_VALID_CANDIDATE",
      });
    }
    return success(null);
  }

  function stage(envelope) {
    const unavailable = unavailableStorageResult(storageResolution, "stage");
    if (unavailable !== null) return unavailable;

    const serialized = serializeAndValidate(envelope, "input", undefined, additionalValidator);
    if (!serialized.ok) return serialized;

    const replacementGuard = guardCandidateReplacement(
      storageResolution.storage,
      serialized.value.envelope,
      serialized.value.raw,
      "stage",
      undefined,
      additionalValidator,
    );
    if (!replacementGuard.ok) return replacementGuard;
    if (replacementGuard.value.stagingMatches) {
      return success(candidateRecord("staging", serialized.value.envelope));
    }

    const written = writeStorage(
      storageResolution.storage,
      "staging",
      serialized.value.raw,
      "stage",
    );
    if (!written.ok) return written;

    const verified = readAndVerifyExact(
      storageResolution.storage,
      "staging",
      serialized.value.raw,
      "stage",
      undefined,
      additionalValidator,
    );
    if (!verified.ok) return verified;
    return success(candidateRecord("staging", verified.value));
  }

  function commit(request = undefined) {
    const unavailable = unavailableStorageResult(storageResolution, "commit");
    if (unavailable !== null) return unavailable;

    const stagedRead = readStorage(storageResolution.storage, "staging", "commit");
    if (!stagedRead.ok) return stagedRead;
    if (stagedRead.value === null) {
      return failure(STORAGE_ERROR_CODES.SAVE_PARSE, {
        operation: "commit",
        source: "staging",
        reason: "MISSING_STAGED_CANDIDATE",
      });
    }

    const staged = parseAndValidate(
      stagedRead.value,
      "staging",
      request,
      additionalValidator,
    );
    if (!staged.ok) return staged;

    const expectedRevision = request?.expectedRevision ?? request?.revision;
    if (expectedRevision !== undefined) {
      if (!Number.isSafeInteger(expectedRevision) || expectedRevision < 1) {
        return failure(STORAGE_ERROR_CODES.SAVE_SCHEMA, {
          operation: "commit",
          source: "request",
          reason: "INVALID_EXPECTED_REVISION",
        });
      }
      if (staged.value.revision !== expectedRevision) {
        return failure(STORAGE_ERROR_CODES.SAVE_SCHEMA, {
          operation: "commit",
          source: "staging",
          reason: "EXPECTED_REVISION_MISMATCH",
        });
      }
    }

    const replacementGuard = guardCandidateReplacement(
      storageResolution.storage,
      staged.value,
      stagedRead.value,
      "commit",
      request,
      additionalValidator,
    );
    if (!replacementGuard.ok) return replacementGuard;

    const canonicalRead = readStorage(storageResolution.storage, "canonical", "commit");
    if (!canonicalRead.ok) return canonicalRead;

    if (canonicalRead.value !== null) {
      const canonical = parseAndValidate(
        canonicalRead.value,
        "canonical",
        request,
        additionalValidator,
      );
      if (canonical.ok) {
        if (canonicalRead.value === stagedRead.value) {
          const cleaned = removeStorage(storageResolution.storage, "staging", "commit");
          if (!cleaned.ok) return cleaned;
          return success(candidateRecord("canonical", canonical.value));
        }

        const backedUp = writeStorage(
          storageResolution.storage,
          "backup",
          canonicalRead.value,
          "commit",
        );
        if (!backedUp.ok) return backedUp;
      } else if (canonical.error.code === STORAGE_ERROR_CODES.SAVE_MIGRATION) {
        return canonical;
      }
    }

    const promoted = writeStorage(
      storageResolution.storage,
      "canonical",
      stagedRead.value,
      "commit",
    );
    if (!promoted.ok) return promoted;

    const verified = readAndVerifyExact(
      storageResolution.storage,
      "canonical",
      stagedRead.value,
      "commit",
      request,
      additionalValidator,
    );
    if (!verified.ok) return verified;

    const cleaned = removeStorage(storageResolution.storage, "staging", "commit");
    if (!cleaned.ok) return cleaned;
    return success(candidateRecord("canonical", verified.value));
  }

  function checkpoint(envelope) {
    const staged = stage(envelope);
    if (!staged.ok) return staged;
    return commit({ expectedRevision: staged.value.envelope.revision, reason: "checkpoint" });
  }

  function clearWithConsent(request) {
    if (request?.consent !== true) {
      return success(Object.freeze({ cleared: false, keys: Object.freeze([]) }));
    }

    const unavailable = unavailableStorageResult(storageResolution, "clearWithConsent");
    if (unavailable !== null) return unavailable;

    const removedKeys = [];
    for (const source of ["staging", "backup", "canonical"]) {
      const removed = removeStorage(storageResolution.storage, source, "clearWithConsent");
      if (!removed.ok) return removed;
      removedKeys.push(LOCAL_STORAGE_KEYS[source]);
    }
    return success(Object.freeze({
      cleared: true,
      keys: Object.freeze(removedKeys),
    }));
  }

  return Object.freeze({
    recoverCandidates,
    load,
    stage,
    commit,
    checkpoint,
    clearWithConsent,
  });
}

function normalizeOptions(storageOrOptions) {
  if (storageOrOptions === undefined) return {};
  if (
    isRecord(storageOrOptions)
    && (Object.hasOwn(storageOrOptions, "storage") || Object.hasOwn(storageOrOptions, "validateEnvelope"))
  ) {
    return storageOrOptions;
  }
  return { storage: storageOrOptions };
}

function resolveStorage(options) {
  try {
    const storage = Object.hasOwn(options, "storage")
      ? options.storage
      : globalThis.localStorage;
    if (!hasStorageInterface(storage)) {
      return Object.freeze({
        ok: false,
        error: unavailableError("resolve", "storage", "INVALID_STORAGE_INTERFACE"),
      });
    }
    return Object.freeze({ ok: true, storage });
  } catch (error) {
    return Object.freeze({
      ok: false,
      error: storageError(error, "resolve", "storage"),
    });
  }
}

function unavailableStorageResult(resolution, operation) {
  if (resolution.ok) return null;
  return failure(resolution.error.code, {
    operation,
    source: "storage",
    reason: resolution.error.details?.reason ?? "STORAGE_UNAVAILABLE",
    cause: resolution.error.details?.cause,
  });
}

function readStorage(storage, source, operation) {
  try {
    return success(storage.getItem(LOCAL_STORAGE_KEYS[source]));
  } catch (error) {
    return storageFailure(error, operation, source);
  }
}

function writeStorage(storage, source, raw, operation) {
  try {
    storage.setItem(LOCAL_STORAGE_KEYS[source], raw);
    return success(undefined);
  } catch (error) {
    return storageFailure(error, operation, source);
  }
}

function removeStorage(storage, source, operation) {
  try {
    storage.removeItem(LOCAL_STORAGE_KEYS[source]);
    return success(undefined);
  } catch (error) {
    return storageFailure(error, operation, source);
  }
}

function readAndVerifyExact(storage, source, expectedRaw, operation, request, validator) {
  const read = readStorage(storage, source, operation);
  if (!read.ok) return read;
  if (read.value === null) {
    return failure(STORAGE_ERROR_CODES.STORAGE_UNAVAILABLE, {
      operation,
      source,
      reason: "READBACK_MISSING",
    });
  }
  if (read.value !== expectedRaw) {
    return failure(STORAGE_ERROR_CODES.STORAGE_UNAVAILABLE, {
      operation,
      source,
      reason: "READBACK_MISMATCH",
    });
  }
  return parseAndValidate(read.value, source, request, validator);
}

function serializeAndValidate(envelope, source, request, validator) {
  let raw;
  try {
    raw = JSON.stringify(envelope);
  } catch (error) {
    return failure(STORAGE_ERROR_CODES.SAVE_SCHEMA, {
      operation: "serialize",
      source,
      reason: "NON_JSON_VALUE",
      cause: safeCauseName(error),
    });
  }
  if (typeof raw !== "string") {
    return failure(STORAGE_ERROR_CODES.SAVE_SCHEMA, {
      operation: "serialize",
      source,
      reason: "NON_JSON_VALUE",
    });
  }

  const parsed = parseAndValidate(raw, source, request, validator);
  if (!parsed.ok) return parsed;
  return success(Object.freeze({ raw, envelope: parsed.value }));
}

function parseAndValidate(raw, source, request, validator) {
  const byteLength = utf8ByteLength(raw);
  if (byteLength > SAVE_CANDIDATE_MAX_BYTES) {
    return failure(STORAGE_ERROR_CODES.STORAGE_QUOTA, {
      operation: "validate",
      source,
      reason: "SAVE_BUDGET_EXCEEDED",
      byteLength,
      maxBytes: SAVE_CANDIDATE_MAX_BYTES,
    });
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    return failure(STORAGE_ERROR_CODES.SAVE_PARSE, {
      operation: "parse",
      source,
      reason: "MALFORMED_JSON",
      cause: safeCauseName(error),
    });
  }

  if (
    isRecord(parsed)
    && Object.hasOwn(parsed, "saveFormatVersion")
    && Number.isInteger(parsed.saveFormatVersion)
    && parsed.saveFormatVersion !== CURRENT_SAVE_FORMAT_VERSION
  ) {
    return failure(STORAGE_ERROR_CODES.SAVE_MIGRATION, {
      operation: "validate",
      source,
      reason: parsed.saveFormatVersion > CURRENT_SAVE_FORMAT_VERSION
        ? "FUTURE_SAVE_FORMAT"
        : "MIGRATION_PATH_UNAVAILABLE",
    });
  }

  const schema = validateSaveEnvelope(parsed);
  if (!schema.valid) {
    return failure(STORAGE_ERROR_CODES.SAVE_SCHEMA, {
      operation: "validate",
      source,
      path: schema.issue.path,
      reason: schema.issue.reason,
    });
  }

  const additional = runAdditionalValidator(validator, parsed, source, request);
  if (additional !== null) return additional;
  return success(cloneEnvelope(parsed));
}

function runAdditionalValidator(validator, envelope, source, request) {
  if (validator === null) return null;
  let outcome;
  try {
    outcome = validator(
      cloneEnvelope(envelope),
      Object.freeze({ source, request }),
    );
  } catch (error) {
    return failure(STORAGE_ERROR_CODES.SAVE_SCHEMA, {
      operation: "validate",
      source,
      reason: "ADDITIONAL_VALIDATOR_FAILED",
      cause: safeCauseName(error),
    });
  }

  if (outcome instanceof Promise) {
    return failure(STORAGE_ERROR_CODES.SAVE_SCHEMA, {
      operation: "validate",
      source,
      reason: "ASYNC_VALIDATOR_UNSUPPORTED",
    });
  }
  if (outcome === undefined || outcome === true || outcome?.valid === true || outcome?.ok === true) {
    return null;
  }

  const requestedCode = outcome?.error?.code;
  const code = requestedCode === STORAGE_ERROR_CODES.SAVE_MIGRATION
    ? STORAGE_ERROR_CODES.SAVE_MIGRATION
    : STORAGE_ERROR_CODES.SAVE_SCHEMA;
  return failure(code, {
    operation: "validate",
    source,
    path: safeString(outcome?.issue?.path ?? outcome?.error?.details?.path),
    reason: safeString(
      outcome?.issue?.reason
      ?? outcome?.error?.details?.reason
      ?? "ADDITIONAL_VALIDATION_REJECTED",
    ),
  });
}

function guardCandidateReplacement(
  storage,
  candidate,
  candidateRaw,
  operation,
  request,
  validator,
) {
  let stagingMatches = false;

  for (const source of CANDIDATE_SOURCES) {
    const read = readStorage(storage, source, operation);
    if (!read.ok) return read;
    if (read.value === null) continue;

    const current = parseAndValidate(read.value, source, request, validator);
    if (!current.ok) {
      if (
        current.error.code === STORAGE_ERROR_CODES.SAVE_MIGRATION
        || current.error.code === STORAGE_ERROR_CODES.STORAGE_QUOTA
      ) {
        return current;
      }
      continue;
    }
    if (candidate.revision < current.value.revision) {
      return failure(STORAGE_ERROR_CODES.SAVE_SCHEMA, {
        operation,
        source,
        reason: "STALE_REVISION",
      });
    }
    if (candidate.revision === current.value.revision && candidateRaw !== read.value) {
      return failure(STORAGE_ERROR_CODES.SAVE_SCHEMA, {
        operation,
        source,
        reason: "REVISION_CONFLICT",
      });
    }
    if (source === "staging" && candidateRaw === read.value) stagingMatches = true;
  }

  return success(Object.freeze({ stagingMatches }));
}

function compareCandidates(left, right) {
  const revisionDifference = right.envelope.revision - left.envelope.revision;
  if (revisionDifference !== 0) return revisionDifference;
  return SOURCE_PRIORITY[left.source] - SOURCE_PRIORITY[right.source];
}

function candidateRecord(source, envelope) {
  return Object.freeze({ source, envelope: cloneEnvelope(envelope) });
}

function rejectedRecord(source, code, reason) {
  return Object.freeze({ source, code, reason });
}

function cloneEnvelope(envelope) {
  return JSON.parse(JSON.stringify(envelope));
}

function hasStorageInterface(value) {
  return value !== null
    && typeof value === "object"
    && typeof value.getItem === "function"
    && typeof value.setItem === "function"
    && typeof value.removeItem === "function";
}

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function storageFailure(error, operation, source) {
  const mapped = storageError(error, operation, source);
  return failure(mapped.code, mapped.details);
}

function storageError(error, operation, source) {
  const code = isQuotaExceeded(error)
    ? STORAGE_ERROR_CODES.STORAGE_QUOTA
    : STORAGE_ERROR_CODES.STORAGE_UNAVAILABLE;
  return Object.freeze({
    code,
    details: Object.freeze({
      operation,
      source,
      reason: code === STORAGE_ERROR_CODES.STORAGE_QUOTA
        ? "QUOTA_EXCEEDED"
        : "STORAGE_OPERATION_FAILED",
      cause: safeCauseName(error),
    }),
  });
}

function unavailableError(operation, source, reason) {
  return Object.freeze({
    code: STORAGE_ERROR_CODES.STORAGE_UNAVAILABLE,
    details: Object.freeze({ operation, source, reason }),
  });
}

function isQuotaExceeded(error) {
  return error !== null
    && typeof error === "object"
    && (
      error.name === "QuotaExceededError"
      || error.name === "NS_ERROR_DOM_QUOTA_REACHED"
      || error.code === 22
      || error.code === 1014
    );
}

function safeCauseName(error) {
  return error !== null && typeof error === "object" && typeof error.name === "string"
    ? error.name
    : "UnknownError";
}

function safeString(value) {
  return typeof value === "string" ? value.slice(0, 160) : undefined;
}

function utf8ByteLength(value) {
  let byteLength = 0;
  for (const character of value) {
    const codePoint = character.codePointAt(0);
    if (codePoint <= 0x7f) byteLength += 1;
    else if (codePoint <= 0x7ff) byteLength += 2;
    else if (codePoint <= 0xffff) byteLength += 3;
    else byteLength += 4;
  }
  return byteLength;
}

function success(value) {
  return Object.freeze({ ok: true, value });
}

function failure(code, details) {
  return Object.freeze({
    ok: false,
    error: Object.freeze({
      code,
      ...(details === undefined ? {} : { details: Object.freeze(compactDetails(details)) }),
    }),
  });
}

function compactDetails(details) {
  return Object.fromEntries(
    Object.entries(details).filter(([, value]) => value !== undefined),
  );
}
