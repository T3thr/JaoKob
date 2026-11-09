/**
 * Records that belong to this browser rather than to one journey: the player's settings and
 * the notices already shown (ADR-P0-034 D7.5 · D8.3).
 *
 *   jaokob:journey:settings  {version: 1, settings}   game settings, shape of the save's settings
 *   jaokob:journey:notices   {version: 1, seen: [...]} one-time notices already shown
 *
 * Settings live here so an accessibility choice made before the first New Game, or during a
 * journey that cannot be saved, is not lost. Each save still carries the settings of its
 * moment (the schema requires them). A record from a newer version is never replaced; a
 * corrupt record holds nothing worth keeping and the next write replaces it.
 *
 * Trace: ADR-P0-034 D7/D8, UX §1.9, TC-S5-SAVE-002, TC-S5-LEGACY-001.
 */

import { JOURNEY_NAMESPACE, STORAGE_FAILURES, failure, readKey, resolveStorage, success, writeKey } from "./journey-storage.js";
import { validateJourneySettings } from "../validation/journey-save-validator.js";
import { deepFreeze } from "../validation/content-values.js";

export const JOURNEY_SETTINGS_KEY = `${JOURNEY_NAMESPACE}settings`;
export const JOURNEY_NOTICES_KEY = `${JOURNEY_NAMESPACE}notices`;
/** One-time notices. `legacy-archive`: the earlier story's records are kept untouched (D8.3). */
export const JOURNEY_NOTICES = Object.freeze(["legacy-archive"]);
const RECORD_VERSION = 1;
const RECORD_MAX_LENGTH = 4096;

/**
 * Defaults before the player changes anything. UX §1.9: counter tags on, automatic micro-actions
 * off, normal intensity, 100% text. Audio levels follow the approved Sprint 4 defaults until
 * T7 sets the Journey mix with its audio assets.
 */
export const JOURNEY_DEFAULT_SETTINGS = deepFreeze({
  locale: "th",
  textSpeed: "normal",
  fontScale: 1,
  typewriterEffect: true,
  autoAdvance: false,
  reducedMotion: false,
  reducedIntensity: false,
  highContrast: false,
  confirmHighImpactChoices: true,
  counterTags: true,
  autoMicro: false,
  masterVolume: 1,
  musicVolume: 0,
  ambienceVolume: 0,
  effectsVolume: 0,
  reducedIntensityAudio: false,
});

export const RECORD_ERROR_CODES = Object.freeze({
  ...STORAGE_FAILURES,
  /** A newer version wrote this record; it is kept and not replaced. */
  PROTECTED: "RECORD_PROTECTED",
  /** The record changed between reading and writing (another tab). */
  RACE: "RECORD_RACE",
  /** The value to write is not valid for this record. */
  INVALID: "RECORD_INVALID",
});

const isRecord = (value) => value !== null && typeof value === "object" && !Array.isArray(value);

/** A versioned single-key record: {version: 1, [field]: data}. */
function createRecordStore(options, key, field, check) {
  const resolved = resolveStorage(options);

  function read() {
    if (!resolved.ok) return resolved;
    const got = readKey(resolved.value, key);
    if (!got.ok) return got;
    const raw = got.value;
    if (raw === null) return success({ raw, status: "empty" });
    let parsed;
    try { parsed = raw.length <= RECORD_MAX_LENGTH ? JSON.parse(raw) : null; } catch { parsed = null; }
    if (!isRecord(parsed) || !Number.isSafeInteger(parsed.version)) return success({ raw, status: "corrupt" });
    if (parsed.version > RECORD_VERSION) return success({ raw, status: "future" });
    const valid = parsed.version === RECORD_VERSION && Object.keys(parsed).length === 2 && Object.hasOwn(parsed, field) && check(parsed[field]);
    return success(valid ? { raw, status: "valid", data: deepFreeze(parsed[field]) } : { raw, status: "corrupt" });
  }

  return Object.freeze({
    key,
    load() {
      const got = read();
      return got.ok ? success(Object.freeze(got.value.status === "valid" ? { status: "valid", data: got.value.data } : { status: got.value.status })) : got;
    },
    save(data) {
      if (!check(data)) return failure(RECORD_ERROR_CODES.INVALID, { key });
      const before = read();
      if (!before.ok) return before;
      if (before.value.status === "future") return failure(RECORD_ERROR_CODES.PROTECTED, { key });
      const raw = JSON.stringify({ version: RECORD_VERSION, [field]: data });
      if (raw === before.value.raw) return success(undefined);
      const again = readKey(resolved.value, key);
      if (!again.ok) return again;
      if (again.value !== before.value.raw) return failure(RECORD_ERROR_CODES.RACE, { key });
      return writeKey(resolved.value, key, raw);
    },
  });
}

/** `load()` → {status, data?}; `save(settings)` writes the device settings. */
export function createJourneySettingsRepository(options = {}) {
  return createRecordStore(options, JOURNEY_SETTINGS_KEY, "settings", (value) => validateJourneySettings(value).valid);
}

const validSeen = (value) => Array.isArray(value) && value.length <= JOURNEY_NOTICES.length
  && new Set(value).size === value.length && value.every((id) => JOURNEY_NOTICES.includes(id));

/** `seen()` lists the notices already shown; `acknowledge(id)` records one. */
export function createJourneyNoticesRepository(options = {}) {
  const store = createRecordStore(options, JOURNEY_NOTICES_KEY, "seen", validSeen);
  return Object.freeze({
    key: store.key,
    seen() {
      const got = store.load();
      if (!got.ok) return got;
      return success(got.value.status === "valid" ? got.value.data : Object.freeze([]));
    },
    acknowledge(id) {
      if (!JOURNEY_NOTICES.includes(id)) return failure(RECORD_ERROR_CODES.INVALID, { key: store.key });
      const got = store.load();
      if (!got.ok) return got;
      const seen = got.value.status === "valid" ? got.value.data : [];
      return seen.includes(id) ? success(undefined) : store.save([...seen, id]);
    },
  });
}
