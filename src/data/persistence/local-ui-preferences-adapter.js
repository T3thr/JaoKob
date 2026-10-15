/** ADR-P0-018 D4: a separately versioned UI preference, outside game settings,
 * save envelopes and checkpoints. Unknown/corrupt records are never replaced.
 * Only this key is read/written. No raw input or storage exception is exposed. */
export const UI_PREFERENCES_KEY = "jaokob:preferences";
export const DEFAULT_UI_PREFERENCES = Object.freeze({ hideContentAdvisory: false });

export function createLocalUiPreferencesAdapter(options = {}) {
  let storage;
  try { storage = Object.hasOwn(options, "storage") ? options.storage : globalThis.localStorage; } catch { /* Unavailable hosts remain usable in memory. */ }
  const success = (value) => Object.freeze({ ok: true, value });
  const failure = (code) => Object.freeze({ ok: false, error: Object.freeze({ code }) });
  const valid = (value) => value !== null && typeof value === "object" && !Array.isArray(value)
    && [Object.prototype, null].includes(Object.getPrototypeOf(value))
    && Object.keys(value).length === 1 && Object.hasOwn(value, "hideContentAdvisory") && typeof value.hideContentAdvisory === "boolean";
  function read() {
    try {
      if (!storage || typeof storage.getItem !== "function" || typeof storage.setItem !== "function") return failure("PREFERENCES_UNAVAILABLE");
      const raw = storage.getItem(UI_PREFERENCES_KEY);
      if (raw === null) return success({ raw, preferences: DEFAULT_UI_PREFERENCES });
      if (typeof raw !== "string" || raw.length > 256) return failure("PREFERENCES_SCHEMA");
      const parsed = JSON.parse(raw);
      if (!parsed || parsed.version !== 1 || Object.keys(parsed).length !== 2 || !Object.hasOwn(parsed, "version") || !Object.hasOwn(parsed, "preferences") || !valid(parsed.preferences)) return failure("PREFERENCES_SCHEMA");
      return success({ raw, preferences: Object.freeze({ ...parsed.preferences }) });
    } catch { return failure("PREFERENCES_UNAVAILABLE"); }
  }
  return Object.freeze({
    load() { const result = read(); return result.ok ? success(result.value.preferences) : result; },
    save(preferences) {
      if (!valid(preferences)) return failure("PREFERENCES_SCHEMA");
      const existing = read(); if (!existing.ok) return existing;
      try {
        if (storage.getItem(UI_PREFERENCES_KEY) !== existing.value.raw) return failure("PREFERENCES_RACE");
        const raw = JSON.stringify({ version: 1, preferences });
        storage.setItem(UI_PREFERENCES_KEY, raw);
        return storage.getItem(UI_PREFERENCES_KEY) === raw ? success() : failure("PREFERENCES_RACE");
      } catch { return failure("PREFERENCES_UNAVAILABLE"); }
    },
  });
}
