/**
 * Storage access shared by the Journey persistence modules: one place that resolves the
 * browser storage, maps exceptions to stable codes and never lets a storage exception or raw
 * player data escape (ADR-P0-034 D7.3).
 *
 * The Journey namespace is `jaokob:journey:*` (D7.5). Nothing here knows a key of the legacy
 * namespace; the legacy archive module reads those keys without this helper's write functions.
 *
 * Trace: ADR-P0-034 D7/D8, TC-S5-SAVE-002, TC-S5-LEGACY-001.
 */

export const JOURNEY_NAMESPACE = "jaokob:journey:";

export const STORAGE_FAILURES = Object.freeze({
  /** No storage, a broken storage object, or an operation that threw or did not stick. */
  UNAVAILABLE: "STORAGE_UNAVAILABLE",
  /** The browser refused a write for lack of space, or a record is over its byte budget. */
  QUOTA: "STORAGE_QUOTA",
});

export const success = (value) => Object.freeze({ ok: true, value });
export const failure = (code, details = {}) => Object.freeze({ ok: false, error: Object.freeze({ code, details: Object.freeze({ ...details }) }) });

const isStorage = (value) => value !== null && typeof value === "object"
  && typeof value.getItem === "function" && typeof value.setItem === "function" && typeof value.removeItem === "function";

/** The injected storage, or the page's localStorage; access itself may throw (privacy modes). */
export function resolveStorage(options = {}) {
  try {
    const storage = Object.hasOwn(options, "storage") ? options.storage : globalThis.localStorage;
    return isStorage(storage) ? success(storage) : failure(STORAGE_FAILURES.UNAVAILABLE, { reason: "NO_STORAGE" });
  } catch {
    return failure(STORAGE_FAILURES.UNAVAILABLE, { reason: "STORAGE_DENIED" });
  }
}

const isQuotaError = (error) => error !== null && typeof error === "object"
  && (error.name === "QuotaExceededError" || error.name === "NS_ERROR_DOM_QUOTA_REACHED" || error.code === 22 || error.code === 1014);

export function readKey(storage, key) {
  try {
    const value = storage.getItem(key);
    return value === null || typeof value === "string" ? success(value) : failure(STORAGE_FAILURES.UNAVAILABLE, { key, reason: "NOT_TEXT" });
  } catch {
    return failure(STORAGE_FAILURES.UNAVAILABLE, { key, reason: "READ_FAILED" });
  }
}

/** Write, then read back: a write counts only when the exact text is there afterwards. */
export function writeKey(storage, key, raw) {
  if (!key.startsWith(JOURNEY_NAMESPACE)) throw new TypeError("Journey storage writes only its own namespace");
  try {
    storage.setItem(key, raw);
  } catch (error) {
    return failure(isQuotaError(error) ? STORAGE_FAILURES.QUOTA : STORAGE_FAILURES.UNAVAILABLE, { key, reason: isQuotaError(error) ? "QUOTA_EXCEEDED" : "WRITE_FAILED" });
  }
  const back = readKey(storage, key);
  if (!back.ok) return back;
  return back.value === raw ? success(undefined) : failure(STORAGE_FAILURES.UNAVAILABLE, { key, reason: "READBACK_MISMATCH" });
}

export function removeKey(storage, key) {
  if (!key.startsWith(JOURNEY_NAMESPACE)) throw new TypeError("Journey storage removes only its own namespace");
  try {
    storage.removeItem(key);
  } catch {
    return failure(STORAGE_FAILURES.UNAVAILABLE, { key, reason: "REMOVE_FAILED" });
  }
  const back = readKey(storage, key);
  if (!back.ok) return back;
  return back.value === null ? success(undefined) : failure(STORAGE_FAILURES.UNAVAILABLE, { key, reason: "REMOVE_DID_NOT_STICK" });
}
