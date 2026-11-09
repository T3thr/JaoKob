/**
 * The save slots of one journey package: staged → canonical → backup transaction, read-only
 * recovery and consent-bound reset (ADR-P0-034 D7.3/D7.5/D7.6, ADR-P0-014, SSOT §3.2).
 *
 * Keys hold the package id, so another package can never write this package's slots and
 * Sprint 6 needs no migration: `jaokob:journey:<package id>:canonical|staging|backup`.
 *
 * Write policy (one `save` = stage, back up the valid canonical, promote, clean):
 *   - an unknown or future record in any slot protects the namespace: no write without consent;
 *   - a valid record with a higher revision, or the same revision with another story, wins;
 *   - corrupt records do not protect: recovery resumes from the best valid slot and the next
 *     write replaces them;
 *   - before every mutation all three slots are read again and must be exactly as observed,
 *     so a change made by another tab is reported as a race instead of overwritten.
 * LocalStorage has no compare-and-swap; this detects observed races, it does not claim
 * cross-tab atomicity. `inspect` never writes (Resume never writes).
 *
 * Trace: ADR-P0-034 D7/D8, ADR-P0-014, SSOT §3.2, TC-S5-SAVE-001, TC-S5-SAVE-002, TC-S5-PACKAGE-001.
 */

import { JOURNEY_NAMESPACE, STORAGE_FAILURES, failure, readKey, removeKey, resolveStorage, success, writeKey } from "./journey-storage.js";
import { JOURNEY_SAVE_MAX_BYTES, classifyJourneySave, sameStory, sealJourneySave } from "../validation/journey-save-validator.js";
import { utf8ByteLength } from "../validation/content-digest.js";

export const JOURNEY_SAVE_SLOTS = Object.freeze(["canonical", "staging", "backup"]);
const PRIORITY = Object.freeze({ canonical: 0, staging: 1, backup: 2 });

export const JOURNEY_SAVE_ERROR_CODES = Object.freeze({
  ...STORAGE_FAILURES,
  /** An unknown or future record is stored; it is never overwritten without consent. */
  PROTECTED: "SAVE_PROTECTED",
  /** A stored record is newer, or holds another story at the same revision. */
  STALE: "SAVE_STALE",
  /** The slots changed while this write was in progress (another tab). */
  RACE: "SAVE_RACE",
  /** The record to write is not a valid save of this package (a programming error). */
  INVALID: "SAVE_INVALID",
  /** The slots are no longer the ones the player reviewed before consenting. */
  CONSENT_STALE: "SAVE_CONSENT_STALE",
});
const CODES = JOURNEY_SAVE_ERROR_CODES;

/** The three slot keys of a package. */
export function journeySaveKeys(packageId) {
  if (typeof packageId !== "string" || !/^[a-z][a-z0-9]*(?:\.[a-z][a-z0-9]*){1,4}$/.test(packageId)) throw new TypeError("journeySaveKeys needs a package id");
  return Object.freeze(Object.fromEntries(JOURNEY_SAVE_SLOTS.map((slot) => [slot, `${JOURNEY_NAMESPACE}${packageId}:${slot}`])));
}

/**
 * @param {{storage?: object, identity: {id: string, contentVersion: string, digest: string}, admit?: (envelope: object) => boolean}} options
 * `admit` is the Core's semantic check of a save for this package; every read and write runs it.
 */
export function createJourneySaveRepository(options) {
  const { identity, admit } = options;
  const keys = journeySaveKeys(identity.id);
  const resolved = resolveStorage(options);
  const context = Object.freeze({ identity, admit });
  let inspection = null;
  let inspections = 0;

  function observe() {
    if (!resolved.ok) return resolved;
    const raw = {};
    for (const slot of JOURNEY_SAVE_SLOTS) {
      const read = readKey(resolved.value, keys[slot]);
      if (!read.ok) return read;
      raw[slot] = read.value;
    }
    return success(raw);
  }

  const classify = (raw) => Object.fromEntries(JOURNEY_SAVE_SLOTS.filter((slot) => raw[slot] !== null).map((slot) => [slot, classifyJourneySave(raw[slot], context)]));

  /** Read every slot without writing. The token binds a later reset to exactly these records. */
  function inspect() {
    const observed = observe();
    if (!observed.ok) return observed;
    const verdicts = classify(observed.value);
    const slots = JOURNEY_SAVE_SLOTS.map((slot) => {
      const v = verdicts[slot];
      if (v === undefined) return Object.freeze({ slot, status: "empty" });
      return Object.freeze(v.status === "valid" ? { slot, status: "valid", revision: v.envelope.revision } : { slot, status: v.status, reason: v.reason });
    });
    const candidates = JOURNEY_SAVE_SLOTS.filter((slot) => verdicts[slot]?.status === "valid")
      .map((slot) => Object.freeze({ slot, envelope: verdicts[slot].envelope }))
      .sort((a, b) => b.envelope.revision - a.envelope.revision || PRIORITY[a.slot] - PRIORITY[b.slot]);
    inspection = Object.freeze({ token: `journey-consent.${++inspections}`, raw: Object.freeze({ ...observed.value }) });
    return success(Object.freeze({
      slots: Object.freeze(slots),
      candidates: Object.freeze(candidates),
      empty: slots.every((s) => s.status === "empty"),
      protected: slots.some((s) => s.status === "unknown" || s.status === "future"),
      corrupt: slots.some((s) => s.status === "corrupt"),
      consentToken: inspection.token,
    }));
  }

  /** Mutate one slot only if no slot changed since `observed`, then record the new text. */
  function mutate(observed, slot, raw) {
    const now = observe();
    if (!now.ok) return now;
    for (const s of JOURNEY_SAVE_SLOTS) if (now.value[s] !== observed[s]) return failure(CODES.RACE, { slot: s, reason: "CHANGED_DURING_WRITE" });
    const done = raw === null ? removeKey(resolved.value, keys[slot]) : writeKey(resolved.value, keys[slot], raw);
    if (done.ok) observed[slot] = raw;
    return done;
  }

  /**
   * Seal and store one record. Returns {revision, written}; `written` is false when the
   * canonical slot already holds exactly this record.
   */
  function save(envelope) {
    if (!resolved.ok) return resolved;
    let raw;
    try { raw = JSON.stringify(sealJourneySave(envelope)); } catch { return failure(CODES.INVALID, { reason: "NOT_JSON_DATA" }); }
    if (typeof raw !== "string") return failure(CODES.INVALID, { reason: "NOT_JSON_DATA" });
    const bytes = utf8ByteLength(raw);
    if (bytes > JOURNEY_SAVE_MAX_BYTES) return failure(CODES.QUOTA, { reason: "SAVE_BUDGET_EXCEEDED", bytes });
    const own = classifyJourneySave(raw, context);
    if (own.status !== "valid") return failure(CODES.INVALID, { reason: own.reason });
    const candidate = own.envelope;

    const read = observe();
    if (!read.ok) return read;
    const observed = { ...read.value };
    const verdicts = classify(observed);
    for (const slot of JOURNEY_SAVE_SLOTS) {
      const v = verdicts[slot];
      if (v === undefined || v.status === "corrupt") continue;
      if (v.status !== "valid") return failure(CODES.PROTECTED, { slot, reason: v.reason });
      const stored = v.envelope;
      if (stored.revision > candidate.revision) return failure(CODES.STALE, { slot, reason: "NEWER_REVISION_STORED" });
      if (stored.revision === candidate.revision && observed[slot] !== raw) {
        if (!sameStory(stored, candidate)) return failure(CODES.STALE, { slot, reason: "OTHER_STORY_AT_REVISION" });
        if (stored.payload.playTimeMs > candidate.payload.playTimeMs) return failure(CODES.STALE, { slot, reason: "PLAY_TIME_REGRESSION" });
      }
    }
    if (observed.canonical === raw) return success(Object.freeze({ revision: candidate.revision, written: false, bytes }));

    const steps = [() => mutate(observed, "staging", raw)];
    if (verdicts.canonical?.status === "valid") steps.push(() => mutate(observed, "backup", observed.canonical));
    steps.push(() => mutate(observed, "canonical", raw), () => mutate(observed, "staging", null));
    for (const step of steps) {
      const done = step();
      if (!done.ok) return done;
    }
    return success(Object.freeze({ revision: candidate.revision, written: true, bytes }));
  }

  /** Clear the three slots after the player consented to the records shown by `inspect`. */
  function reset({ consentToken } = {}) {
    if (inspection === null || consentToken !== inspection.token) return failure(CODES.CONSENT_STALE, { reason: "NO_MATCHING_INSPECTION" });
    const reviewed = inspection;
    inspection = null;
    const now = observe();
    if (!now.ok) return now;
    for (const slot of JOURNEY_SAVE_SLOTS) if (now.value[slot] !== reviewed.raw[slot]) return failure(CODES.CONSENT_STALE, { slot, reason: "CHANGED_SINCE_REVIEW" });
    const observed = { ...now.value };
    for (const slot of ["staging", "backup", "canonical"]) {
      if (observed[slot] === null) continue;
      const done = mutate(observed, slot, null);
      if (!done.ok) return done;
    }
    return success(Object.freeze({ cleared: true }));
  }

  return Object.freeze({ keys, inspect, save, reset });
}
