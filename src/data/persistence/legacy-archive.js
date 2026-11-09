/**
 * The legacy archive: the earlier story's namespace, read-only for the Journey runtime
 * (ADR-P0-034 D8, PO decision Q3).
 *
 * The Journey runtime never parses these records to play, and never writes, moves, deletes or
 * converts them, so their bytes stay intact and the earlier app can still open them after a
 * rollback. It only asks whether anything is there, to show the one-line notice once (D8.3).
 * This module imports no write helper on purpose.
 *
 * Trace: ADR-P0-034 D8, SSOT §3.2 last rows, TC-S5-LEGACY-001.
 */

import { readKey, resolveStorage, success } from "./journey-storage.js";

/** The five keys of the earlier namespace (D8.2). */
export const LEGACY_ARCHIVE_KEYS = Object.freeze([
  "jaokob:save:canonical",
  "jaokob:save:staging",
  "jaokob:save:backup",
  "jaokob:settings",
  "jaokob:preferences",
]);

/** `{present}`: true when any legacy key holds a record. Reads only. */
export function inspectLegacyArchive(options = {}) {
  const resolved = resolveStorage(options);
  if (!resolved.ok) return resolved;
  for (const key of LEGACY_ARCHIVE_KEYS) {
    const read = readKey(resolved.value, key);
    if (!read.ok) return read;
    if (read.value !== null) return success(Object.freeze({ present: true }));
  }
  return success(Object.freeze({ present: false }));
}
