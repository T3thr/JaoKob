/**
 * Structural SaveRepositoryPort contract.
 *
 * This module defines the inward-facing persistence boundary only. It knows
 * neither LocalStorage nor concrete key names and intentionally accepts either
 * immediate or promised typed results so adapter scheduling is not fixed by
 * the contract definition.
 *
 * Trace: FR-SAV-001..FR-SAV-009, NFR-MA-001, ADR-P0-001, ADR-P0-006,
 * ADR-P0-007.
 */

export const STORAGE_PORT_OPERATIONS = Object.freeze([
  "recoverCandidates",
  "load",
  "stage",
  "commit",
  "checkpoint",
  "clearWithConsent",
]);

export const STORAGE_ERROR_CODES = Object.freeze({
  SAVE_PARSE: "SAVE_PARSE",
  SAVE_SCHEMA: "SAVE_SCHEMA",
  SAVE_MIGRATION: "SAVE_MIGRATION",
  STORAGE_UNAVAILABLE: "STORAGE_UNAVAILABLE",
  STORAGE_QUOTA: "STORAGE_QUOTA",
});

/**
 * @template T
 * @typedef {
 *   Readonly<{ok: true, value: T}> |
 *   Readonly<{ok: false, error: Readonly<{code: string, details?: unknown}>}>
 * } PortResult
 */

/**
 * @template T
 * @typedef {PortResult<T> | Promise<PortResult<T>>} PortOperationOutcome
 */

/**
 * @typedef {object} StoragePort
 * @property {(request?: Readonly<Record<string, unknown>>) => PortOperationOutcome<unknown>} recoverCandidates
 * @property {(request?: Readonly<Record<string, unknown>>) => PortOperationOutcome<unknown>} load
 * @property {(envelope: Readonly<Record<string, unknown>>) => PortOperationOutcome<unknown>} stage
 * @property {(request?: Readonly<Record<string, unknown>>) => PortOperationOutcome<unknown>} commit
 * @property {(envelope: Readonly<Record<string, unknown>>) => PortOperationOutcome<unknown>} checkpoint
 * @property {(request: Readonly<Record<string, unknown>>) => PortOperationOutcome<unknown>} clearWithConsent
 */

/**
 * Test whether a value structurally implements every SaveRepositoryPort
 * operation without invoking adapter code.
 *
 * @param {unknown} candidate
 * @returns {candidate is StoragePort}
 */
export function isStoragePort(candidate) {
  return isRecord(candidate)
    && STORAGE_PORT_OPERATIONS.every(
      (operation) => typeof candidate[operation] === "function",
    );
}

/**
 * Assert the structural SaveRepositoryPort contract at composition time.
 *
 * @param {unknown} candidate
 * @returns {asserts candidate is StoragePort}
 * @throws {TypeError} For a missing or non-callable operation.
 */
export function assertStoragePort(candidate) {
  if (!isRecord(candidate)) {
    throw invalidPort("SaveRepositoryPort implementation must be an object.");
  }
  for (const operation of STORAGE_PORT_OPERATIONS) {
    if (typeof candidate[operation] !== "function") {
      throw invalidPort(`SaveRepositoryPort.${operation} must be a function.`);
    }
  }
}

/**
 * Create an immutable facade around a SaveRepositoryPort implementation.
 * The adapter must return cloned, validated envelopes and must never expose a
 * raw browser storage object through this boundary.
 *
 * @param {unknown} implementation
 * @returns {Readonly<StoragePort>}
 * @throws {TypeError} At composition time when the contract is incomplete.
 */
export function createStoragePort(implementation) {
  assertStoragePort(implementation);
  return Object.freeze(
    Object.fromEntries(
      STORAGE_PORT_OPERATIONS.map((operation) => [
        operation,
        (...args) => implementation[operation].apply(implementation, args),
      ]),
    ),
  );
}

/** @param {string} message */
function invalidPort(message) {
  const error = new TypeError(message);
  error.name = "StoragePortContractError";
  error.code = "INVALID_STORAGE_PORT";
  return error;
}

/** @param {unknown} value */
function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
