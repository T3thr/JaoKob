/**
 * The Journey application without a screen: package admission, the Core session and Journey
 * persistence composed in one place (ADR-P0-034 D1/D7/D8, SSOT §3.1–§3.2). The C5 entry point
 * puts the DOM renderer on top of this; nothing here touches the DOM.
 *
 * Persistence rules:
 *   - every committed command is saved silently, clash turns and camp activities included;
 *     a failed save switches this session to memory and returns a notice (success is silent);
 *   - Resume never writes; the first write after Resume is the next committed command
 *     (settings changes and suspends before that go only to the device records);
 *   - New Game over any stored record needs the consent token of the title the player saw;
 *   - an unknown or future save is kept: Continue and New Game then run in memory unless the
 *     player consents to replace it; the legacy archive is only ever checked for presence.
 *
 * Trace: ADR-P0-034 D1/D3/D7/D8/D9, ADR-P0-014, SSOT §3.2, TC-S5-SAVE-001, TC-S5-SAVE-002,
 * TC-S5-REPLAY-001, TC-S5-LEGACY-001, TC-S5-PACKAGE-001.
 */

import { JourneyError } from "../core/domain/journey/journey-errors.js";
import { createJourneySession } from "../core/use-cases/journey-session.js";
import { admitJourneyPackage } from "../data/content/journey-package.js";
import { JOURNEY_DEFAULT_SETTINGS, createJourneyNoticesRepository, createJourneySettingsRepository } from "../data/persistence/journey-device-records.js";
import { JOURNEY_SAVE_ERROR_CODES, createJourneySaveRepository } from "../data/persistence/journey-save-repository.js";
import { inspectLegacyArchive } from "../data/persistence/legacy-archive.js";
import { buildJourneySave, validateJourneySettings } from "../data/validation/journey-save-validator.js";
import { deepFreeze } from "../data/validation/content-values.js";

/** Commands the UI may send while playing; each one is a Core session command. */
export const JOURNEY_COMMANDS = Object.freeze(["advance", "choose", "clashAct", "campPick", "campLeave", "microDone", "pouchDecide", "chooseEnding", "replayAct"]);

/** Notices the UI shows; a successful save never produces one. */
export const JOURNEY_APP_NOTICES = Object.freeze({
  LEGACY_ARCHIVE: "legacy-archive",
  STORAGE_UNAVAILABLE: "storage-unavailable",
  SAVE_PROTECTED: "save-protected",
  SAVE_RECOVERED: "save-recovered",
  SAVE_CORRUPT: "save-corrupt",
  SAVE_ELSEWHERE: "save-elsewhere",
  SAVE_FAILED: "save-failed",
  SETTINGS_NOT_SAVED: "settings-not-saved",
});
const N = JOURNEY_APP_NOTICES;

export const JOURNEY_APP_ERRORS = Object.freeze({
  NOT_BOOTED: "APP_NOT_BOOTED",
  ALREADY_BOOTED: "APP_ALREADY_BOOTED",
  NOT_AT_TITLE: "APP_NOT_AT_TITLE",
  NOT_PLAYING: "APP_NOT_PLAYING",
  NO_CONTINUE: "APP_NO_CONTINUE",
  CONSENT_REQUIRED: "APP_CONSENT_REQUIRED",
  COMMAND_UNKNOWN: "APP_COMMAND_UNKNOWN",
  SETTINGS_INVALID: "APP_SETTINGS_INVALID",
});
const E = JOURNEY_APP_ERRORS;

const ok = (value) => deepFreeze({ ok: true, value });
const fail = (code, details = {}) => deepFreeze({ ok: false, error: { code, details } });

const SAVE_NOTICE = Object.freeze({
  [JOURNEY_SAVE_ERROR_CODES.STALE]: N.SAVE_ELSEWHERE,
  [JOURNEY_SAVE_ERROR_CODES.RACE]: N.SAVE_ELSEWHERE,
  [JOURNEY_SAVE_ERROR_CODES.PROTECTED]: N.SAVE_PROTECTED,
});

/**
 * @param {{packageData: unknown, storage?: object, clock?: () => string, sessionIdFactory?: () => string}} options
 * `storage` defaults to the page's localStorage; `clock` returns an ISO date-time.
 */
export function createJourneyApplication(options = {}) {
  const { packageData, clock = () => new Date().toISOString(), sessionIdFactory = createSessionId } = options;
  const storageOptions = Object.hasOwn(options, "storage") ? { storage: options.storage } : {};
  let identity = null, pkg = null, session = null, saves = null, settingsStore = null, noticesStore = null;
  let phase = "unbooted", state = null, settings = JOURNEY_DEFAULT_SETTINGS, title = null;
  let persistence = "memory", wroteSinceLoad = false, lastAt = null;

  const now = () => {
    const at = clock();
    if (typeof at !== "string" || !Number.isFinite(Date.parse(at))) throw new TypeError("The clock must return an ISO date-time");
    return at;
  };

  /** Inspect the slots, the legacy archive and the notices: everything the title shows. */
  function readTitle() {
    const inspected = saves.inspect();
    const legacy = inspectLegacyArchive(storageOptions);
    const seen = noticesStore.seen();
    const notices = [];
    if (legacy.ok && legacy.value.present && seen.ok && !seen.value.includes(N.LEGACY_ARCHIVE)) notices.push(N.LEGACY_ARCHIVE);
    if (!inspected.ok) {
      notices.push(N.STORAGE_UNAVAILABLE);
      return deepFreeze({ storage: "unavailable", continue: null, newGame: { needsConsent: false }, offerMemory: true, notices, consentToken: null, candidate: null });
    }
    const { candidates, empty, corrupt, protected: guarded, consentToken } = inspected.value;
    const best = candidates[0] ?? null;
    if (guarded) notices.push(N.SAVE_PROTECTED);
    if (corrupt) notices.push(best === null ? N.SAVE_CORRUPT : N.SAVE_RECOVERED);
    return deepFreeze({
      storage: "available",
      continue: best === null ? null : {
        revision: best.envelope.revision, savedAt: best.envelope.savedAt, act: best.envelope.payload.journey.act,
        node: best.envelope.payload.cursor.node, memoryOnly: guarded,
      },
      newGame: { needsConsent: !empty },
      offerMemory: guarded || (corrupt && best === null),
      notices,
      consentToken,
      candidate: best === null ? null : best.envelope,
    });
  }

  /** The title as the UI sees it (the stored record itself stays inside). */
  const titleView = () => deepFreeze({ phase: "title", identity, settings, ...Object.fromEntries(Object.entries(title).filter(([key]) => key !== "candidate")) });

  function playView(extra = {}) {
    return deepFreeze({ phase: "playing", identity, settings, persistence, view: session.view(state), ...extra });
  }

  function accrue(at) {
    const elapsed = lastAt === null ? 0 : Math.max(0, Date.parse(at) - Date.parse(lastAt));
    state = session.addPlayTime(state, elapsed);
    lastAt = at;
  }

  /** Save the current state; returns the notice of a failure, or null. */
  function persist(reason, at) {
    if (persistence !== "active") return null;
    const result = saves.save(buildJourneySave({ identity, state, settings, savedAt: at, reason }));
    if (result.ok) {
      wroteSinceLoad = true;
      return null;
    }
    persistence = "memory";
    return SAVE_NOTICE[result.error.code] ?? N.SAVE_FAILED;
  }

  function start(payloadState, mode, at) {
    state = payloadState;
    phase = "playing";
    persistence = mode;
    wroteSinceLoad = false;
    lastAt = at;
  }

  const app = {
    /** Admit the package, build the Core session and read the title. */
    boot() {
      if (phase !== "unbooted") return fail(E.ALREADY_BOOTED);
      const admitted = admitJourneyPackage(packageData, { role: "host" });
      if (!admitted.ok) return admitted;
      try {
        session = createJourneySession(admitted.value.package);
      } catch (error) {
        if (!(error instanceof JourneyError)) throw error;
        return fail(error.code, { ...error.details });
      }
      identity = admitted.value.identity;
      pkg = admitted.value.package;
      saves = createJourneySaveRepository({ ...storageOptions, identity, admit: (envelope) => Boolean(session.restore({ revision: envelope.revision, payload: envelope.payload })) });
      settingsStore = createJourneySettingsRepository(storageOptions);
      noticesStore = createJourneyNoticesRepository(storageOptions);
      const stored = settingsStore.load();
      settings = stored.ok && stored.value.status === "valid" ? stored.value.data : JOURNEY_DEFAULT_SETTINGS;
      phase = "title";
      title = readTitle();
      return ok(titleView());
    },

    /**
     * Start a journey. `consentToken` (from the title) is required when any record is stored;
     * `memory: true` plays without saving and leaves every record untouched.
     */
    newGame({ consentToken = null, memory = false } = {}) {
      if (phase !== "title") return fail(phase === "unbooted" ? E.NOT_BOOTED : E.NOT_AT_TITLE);
      const at = now();
      const fresh = session.newGame({ sessionId: sessionIdFactory(), now: at });
      if (memory || title.storage === "unavailable") {
        start(fresh, "memory", at);
        return ok(playView({ notice: title.storage === "unavailable" ? N.STORAGE_UNAVAILABLE : null }));
      }
      if (title.newGame.needsConsent) {
        if (consentToken === null || consentToken !== title.consentToken) return fail(E.CONSENT_REQUIRED);
        const cleared = saves.reset({ consentToken });
        if (!cleared.ok) {
          title = readTitle();
          return cleared;
        }
      }
      start(fresh, "active", at);
      return ok(playView({ notice: persist("new-game", at) }));
    },

    /** Continue the best stored journey. Never writes; a protected namespace plays in memory. */
    continue() {
      if (phase !== "title") return fail(phase === "unbooted" ? E.NOT_BOOTED : E.NOT_AT_TITLE);
      if (title.candidate === null) return fail(E.NO_CONTINUE);
      const envelope = title.candidate;
      const restored = session.restore({ revision: envelope.revision, payload: envelope.payload });
      const stored = settingsStore.load();
      if (!(stored.ok && stored.value.status === "valid")) settings = envelope.settings;
      start(restored, title.continue.memoryOnly ? "memory" : "active", now());
      return ok(playView({ notice: null }));
    },

    /**
     * One player command, bound to the revision the UI rendered (`args.revision`). A rejected
     * command changes nothing but play time and writes nothing.
     */
    perform(kind, args = {}) {
      if (phase !== "playing") return fail(E.NOT_PLAYING);
      if (!JOURNEY_COMMANDS.includes(kind)) return fail(E.COMMAND_UNKNOWN, { command: String(kind) });
      const at = now();
      accrue(at);
      const result = session[kind](state, { ...args, now: at });
      if (!result.ok) return fail(result.error.code, { ...result.error.details });
      state = result.state;
      const notice = persist(kind === "replayAct" ? "replay-started" : "action-committed", at);
      return ok(playView({ events: result.events, notice }));
    },

    /** Change settings. Device record always; the save too once this session has written. */
    changeSettings(patch) {
      if (phase === "unbooted") return fail(E.NOT_BOOTED);
      const next = { ...settings, ...patch };
      if (!validateJourneySettings(next).valid) return fail(E.SETTINGS_INVALID);
      settings = deepFreeze(next);
      const stored = settingsStore.save(settings);
      let notice = stored.ok ? null : N.SETTINGS_NOT_SAVED;
      if (phase === "playing" && wroteSinceLoad) {
        const at = now();
        accrue(at);
        notice = persist("settings-changed", at) ?? notice;
      }
      return ok(phase === "playing" ? playView({ notice }) : { ...titleView(), notice });
    },

    /** The page is hidden or closing: count play time, stop the clock, save if allowed. */
    suspend() {
      if (phase !== "playing" || lastAt === null) return ok({ notice: null });
      const at = now();
      accrue(at);
      lastAt = null;
      return ok({ notice: wroteSinceLoad ? persist("lifecycle-suspend", at) : null });
    },

    /** The page is visible again: the play-time clock runs from now. */
    wake() {
      if (phase === "playing" && lastAt === null) lastAt = now();
      return ok({ notice: null });
    },

    /** Back to the title (after an ending or when the player leaves). */
    leave() {
      if (phase !== "playing") return fail(E.NOT_PLAYING);
      phase = "title";
      state = null;
      lastAt = null;
      title = readTitle();
      return ok(titleView());
    },

    /** Record that a one-time notice was shown. */
    acknowledgeNotice(id) {
      if (phase === "unbooted") return fail(E.NOT_BOOTED);
      const result = noticesStore.acknowledge(id);
      if (!result.ok) return result;
      if (phase === "title") title = deepFreeze({ ...title, notices: title.notices.filter((notice) => notice !== id) });
      return ok({ acknowledged: id });
    },

    /** The admitted package and its identity, read by the presentation layer (C4). */
    content() {
      if (phase === "unbooted") return fail(E.NOT_BOOTED);
      return ok({ identity, package: pkg });
    },

    view() {
      if (phase === "unbooted") return fail(E.NOT_BOOTED);
      return ok(phase === "title" ? titleView() : playView());
    },

    status() {
      return deepFreeze({ phase, persistence: phase === "playing" ? persistence : null, identity, revision: state?.revision ?? null });
    },
  };
  return Object.freeze(app);
}

function createSessionId() {
  if (typeof globalThis.crypto?.randomUUID === "function") return globalThis.crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (token) => {
    const value = Math.floor(Math.random() * 16);
    return (token === "x" ? value : (value & 3) | 8).toString(16);
  });
}
