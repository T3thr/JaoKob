import { createContentOrchestrator } from "../core/use-cases/content-orchestration.js";
import { planGameStateTransition } from "../core/state-machine/game-state.js";
import { assertRendererPort } from "../core/ports/renderer-port.js";
import { assertStoragePort } from "../core/ports/storage-port.js";
import { loadGameContent } from "../data/content/content-runtime.js";
import { projectContentView } from "../data/content/content-view-model.js";
import { TH_APPLICATION as messages } from "../data/localization/th-application.js";
import { createLocalStorageAdapter } from "../data/persistence/local-storage-adapter.js";
import { validateSaveEnvelope, CURRENT_SAVE_FORMAT_VERSION } from "../data/validation/save-envelope-validator.js";
import { deepFreeze } from "../data/validation/content-values.js";
import { createDomRenderer } from "../ui/renderers/dom/dom-renderer.js";

/** Composition root. Trace: CR-0002 D3/D4, ADR-P0-014, FR-SAV-006, FR-ENG-008. */
const failure = (code) => Object.freeze({ ok: false, error: Object.freeze({ code }) });
const success = () => Object.freeze({ ok: true });
const SAVE_ERRORS = new Set(["SAVE_PARSE", "SAVE_SCHEMA", "SAVE_MIGRATION", "STORAGE_UNAVAILABLE", "STORAGE_QUOTA"]);

export function createGameApplication(options = {}) {
  const configuredDocument = options.document ?? globalThis.document;
  const root = options.root ?? configuredDocument?.getElementById("app");
  const renderer = options.renderer ?? createDomRenderer({ root, document: configuredDocument, onIntent: (intent) => { void dispatch(intent); } });
  const storage = options.storage ?? createLocalStorageAdapter({ canReplaceExistingEnvelope: compatible });
  const clock = options.clock ?? (() => new Date().toISOString());
  const sessionIdFactory = options.sessionIdFactory ?? createSessionId;
  assertRendererPort(renderer); assertStoragePort(storage);
  let loaded, orchestrator, settings, snapshot = null, resumeEnvelope = null;
  let mode = "title", confirmation = null, notice = null, feedbackActionId = null, meterChanges = [];
  let memoryOnly = false, fatal = false, booted = false, busy = false, lastViewModel = null;
  let viewRevision = 0, revisionFloor = 0, lastAt = null, operation = Promise.resolve();

  async function invoke(port, method, argument) {
    try {
      const result = await port[method](argument);
      if (typeof result?.ok === "boolean") return result;
    } catch { /* Never expose adapter internals or raw player data. */ }
    return failure("PORT_FAILURE");
  }
  async function presentFatal(code) {
    fatal = true;
    await invoke(renderer, "showFatalShell", { code });
    return failure(code);
  }
  function run(task) {
    if (busy) return Promise.resolve(failure("APPLICATION_BUSY"));
    busy = true;
    operation = (async () => {
      try {
        const lock = await invoke(renderer, "setBusy", true);
        if (!lock.ok) return await presentFatal("RENDER_FAILURE");
        return await task();
      } catch { return await presentFatal("PORT_FAILURE"); }
      finally {
        busy = false;
        await invoke(renderer, "setBusy", false);
        if (!fatal && lastViewModel) {
          // Focus only after controls have been unlocked; disabled buttons
          // cannot receive focus in real browsers.
          await invoke(renderer, "applyFocusDirective", { target: snapshot && mode === "game" ? "dialogue" : "first-choice" });
        }
      }
    })();
    return operation;
  }
  async function render() {
    lastViewModel = projectContentView({ loaded, snapshot, facts: snapshot ? orchestrator.facts(snapshot) : null,
      settings, notice, feedbackActionId, meterChanges, mode, hasResume: Boolean(resumeEnvelope), memoryResume: memoryOnly,
      confirmation, viewRevision: ++viewRevision });
    const result = await invoke(renderer, "render", lastViewModel);
    if (!result.ok) return presentFatal("RENDER_FAILURE");
    await invoke(renderer, "announce", { text: [lastViewModel.feedback, notice].filter(Boolean).join(" "), meterChanges: lastViewModel.meterChanges });
    return success();
  }
  function compatible(envelope) {
    return validateSaveEnvelope(envelope).valid && envelope.contentVersion === loaded.catalog.version
      && orchestrator.validateSnapshot({ ...envelope.payload, revision: envelope.revision }).ok;
  }
  async function recover() {
    const result = await invoke(storage, "recoverCandidates", { captureConsent: true });
    if (!result.ok) {
      if (!SAVE_ERRORS.has(result.error.code)) return { fatalCode: result.error.code };
      memoryOnly = true; notice = messages.unavailable;
      return { unavailable: true, hasRecords: false };
    }
    const { candidates, rejected, consentToken } = result.value;
    const candidate = candidates.find((item) => compatible(item.envelope));
    revisionFloor = Math.max(revisionFloor, ...candidates.map((item) => item.envelope.revision));
    const protectedRecords = rejected.length > 0 || candidates.some((item) => !compatible(item.envelope));
    // Recovery is read-only. Even a valid backup must not overwrite a corrupt
    // or newer incompatible record without a separate player decision.
    if (protectedRecords) { memoryOnly = true; notice = candidate ? messages.recoveredMemory : messages.protected; }
    if (candidate && !resumeEnvelope) {
      resumeEnvelope = candidate.envelope; settings = { ...candidate.envelope.settings };
      if (!protectedRecords) notice = messages.recovered;
    }
    return { hasRecords: candidates.length + rejected.length > 0, consentToken };
  }
  function time() {
    const value = clock();
    const at = value instanceof Date ? value.toISOString() : value;
    if (typeof at !== "string" || !Number.isFinite(Date.parse(at))) throw new TypeError("Invalid clock");
    return at;
  }
  function command() {
    const at = time();
    return { at, expectedRevision: snapshot.revision, elapsedMs: lastAt ? Math.max(0, Date.parse(at) - Date.parse(lastAt)) : 0 };
  }
  async function persist(reason, at) {
    const { revision, ...payload } = snapshot;
    revisionFloor = Math.max(revisionFloor, revision);
    const envelope = deepFreeze({ saveFormatVersion: CURRENT_SAVE_FORMAT_VERSION, contentVersion: loaded.catalog.version,
      revision, createdAt: snapshot.startedAt, savedAt: at, reason, payload, settings: { ...settings } });
    if (!compatible(envelope)) return presentFatal("SAVE_SCHEMA");
    resumeEnvelope = envelope;
    if (!memoryOnly) {
      // A record may have appeared since boot (for example in another tab).
      // Inspect all slots again before allowing any replacement attempt.
      const current = await invoke(storage, "recoverCandidates");
      if (!current.ok) {
        if (!SAVE_ERRORS.has(current.error.code)) return presentFatal(current.error.code);
        memoryOnly = true; notice = messages.unavailable;
      } else if (current.value.rejected.length || current.value.candidates.some((item) => !compatible(item.envelope))) {
        memoryOnly = true; notice = messages.recoveredMemory;
      }
    }
    if (!memoryOnly) {
      let result = await invoke(storage, "stage", envelope);
      if (result.ok) result = await invoke(storage, "commit", { expectedRevision: revision });
      if (!result.ok) {
        if (!SAVE_ERRORS.has(result.error.code)) return presentFatal(result.error.code);
        memoryOnly = true; notice = messages.unavailable;
      } else notice = messages.saved;
    }
    return success();
  }
  async function startSession() {
    if (revisionFloor >= Number.MAX_SAFE_INTEGER) return failure("REVISION_OVERFLOW");
    const at = time();
    const started = orchestrator.start({ sessionId: sessionIdFactory(), at, revision: revisionFloor + 1 });
    if (!started.ok) return started;
    snapshot = started.value.snapshot; lastAt = at; mode = "game"; confirmation = null; feedbackActionId = null; meterChanges = [];
    const saved = await persist("new-game", at);
    return saved.ok ? render() : saved;
  }
  async function bootInternal() {
    if (booted) return failure("ALREADY_BOOTED");
    loaded = await loadGameContent(options);
    if (!loaded.valid) return presentFatal(loaded.errors[0].code);
    orchestrator = createContentOrchestrator(loaded.catalog);
    settings = { ...loaded.catalog.defaults.settings };
    const admission = planGameStateTransition({ snapshot: null, event: "BOOT_COMPLETED", context: { contentValid: true, applicationComposed: true } });
    if (!admission.ok) return presentFatal("CONTENT_TRANSITION");
    const recovered = await recover();
    if (recovered.fatalCode) return presentFatal(recovered.fatalCode);
    booted = true;
    return render();
  }
  async function accept(result, at) {
    if (!result.ok) {
      notice = messages.rejected;
      await render();
      return result;
    }
    const previous = snapshot;
    snapshot = result.value.snapshot; lastAt = at; mode = "game"; confirmation = null;
    feedbackActionId = result.value.feedbackActionId ?? null;
    meterChanges = ["hp", "sanity"].filter((meter) => previous.metrics[meter] !== snapshot.metrics[meter])
      .map((meter) => ({ meter, before: previous.metrics[meter], after: snapshot.metrics[meter], delta: snapshot.metrics[meter] - previous.metrics[meter] }));
    revisionFloor = Math.max(revisionFloor, snapshot.revision);
    const saved = await persist(result.value.reason, at);
    return saved.ok ? render() : saved;
  }
  async function dispatchInternal(intent) {
    if (intent?.type === "RELOAD_APPLICATION") { (options.reload ?? (() => globalThis.location?.reload()))(); return success(); }
    if (intent?.type === "RETRY_RENDER") {
      fatal = false;
      return booted && loaded?.valid ? render() : bootInternal();
    }
    if (!booted || fatal) return failure("APPLICATION_UNAVAILABLE");
    if (intent?.type !== "SELECT_CHOICE") return failure("INVALID_INTENT");
    if ((intent.viewRevision !== undefined && intent.viewRevision !== viewRevision)
      || (intent.expectedRevision !== undefined && intent.expectedRevision !== (snapshot?.revision ?? 0))) return failure("REVISION_MISMATCH");
    const id = intent.choiceId;
    if (!lastViewModel.choices.some((item) => item.id === id && !item.disabled)) return failure("CONTENT_ACTION_UNAVAILABLE");
    switch (id) {
      case "application.new-game": {
        const recovered = await recover();
        if (recovered.fatalCode) return presentFatal(recovered.fatalCode);
        if (recovered.hasRecords || resumeEnvelope) {
          mode = "replace-confirmation"; confirmation = { consentToken: recovered.consentToken, hasRecords: recovered.hasRecords };
          return render();
        }
        return startSession();
      }
      case "application.cancel-replace": mode = "title"; confirmation = null; return render();
      case "application.confirm-replace": {
        if (revisionFloor >= Number.MAX_SAFE_INTEGER) return failure("REVISION_OVERFLOW");
        if (confirmation.hasRecords) {
          const cleared = await invoke(storage, "clearWithConsent", { consent: true, consentToken: confirmation.consentToken });
          if (!cleared.ok) {
            if (!SAVE_ERRORS.has(cleared.error.code)) return presentFatal(cleared.error.code);
            notice = cleared.error.details?.reason === "CONSENT_STALE" ? messages.consentChanged : messages.unavailable;
            mode = "title"; confirmation = null; memoryOnly = true;
            await render(); return cleared;
          }
          memoryOnly = false; notice = null;
        }
        resumeEnvelope = null;
        return startSession();
      }
      case "application.resume": {
        const resumed = orchestrator.resume({ ...resumeEnvelope.payload, revision: resumeEnvelope.revision });
        if (!resumed.ok) return resumed;
        snapshot = resumed.value.snapshot; settings = { ...resumeEnvelope.settings }; lastAt = time(); mode = "game";
        feedbackActionId = null; meterChanges = [];
        return render(); // No save write and no enter-node execution on Resume.
      }
      case "application.advance": {
        const next = command(); return accept(orchestrator.advance(snapshot, next), next.at);
      }
      case "application.finish":
        if (!orchestrator.facts(snapshot).complete) return failure("CONTENT_ACTION_UNAVAILABLE");
        snapshot = null; mode = "title"; feedbackActionId = null; meterChanges = []; return render();
      case "application.settings": mode = "settings"; return render();
      case "application.close-settings": mode = snapshot ? "game" : "title"; return render();
      case "application.toggle-font":
      case "application.toggle-motion": {
        const nextSettings = { ...settings };
        if (id === "application.toggle-font") nextSettings.fontScale = settings.fontScale > 1 ? 1 : 1.5;
        else nextSettings.reducedMotion = !settings.reducedMotion;
        if (snapshot) {
          const next = command(), touched = orchestrator.touch(snapshot, next);
          if (!touched.ok) return touched;
          snapshot = touched.value.snapshot; lastAt = next.at; settings = nextSettings;
          const saved = await persist("settings-changed", next.at);
          if (!saved.ok) return saved;
        } else settings = nextSettings;
        return render();
      }
      case "application.cancel-choice": confirmation = null; mode = "game"; return render();
      case "application.confirm-choice": {
        const next = { ...command(), actionId: confirmation.actionId, expectedRevision: confirmation.expectedRevision };
        return accept(orchestrator.act(snapshot, next), next.at);
      }
      default: {
        const action = loaded.indexes.choices[id] ?? loaded.indexes.interactions[id];
        if (settings.confirmHighImpactChoices && ["high", "irreversible"].includes(action.impact)) {
          confirmation = { actionId: id, expectedRevision: snapshot.revision }; mode = "choice-confirmation"; return render();
        }
        const next = { ...command(), actionId: id };
        return accept(orchestrator.act(snapshot, next), next.at);
      }
    }
  }
  function dispatch(intent) { return run(() => dispatchInternal(intent)); }
  return Object.freeze({ boot: () => run(bootInternal), dispatch, whenIdle: () => operation,
    getSnapshot: () => snapshot, getViewModel: () => lastViewModel,
    getStatus: () => Object.freeze({ booted, busy, fatal, persistenceDegraded: memoryOnly, hasResumeCandidate: Boolean(resumeEnvelope), mode }) });
}

function createSessionId() {
  if (typeof globalThis.crypto?.randomUUID === "function") return globalThis.crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (token) => {
    const value = Math.floor(Math.random() * 16);
    return (token === "x" ? value : (value & 3) | 8).toString(16);
  });
}

if (typeof document !== "undefined") {
  const root = document.getElementById("app");
  if (root !== null) void createGameApplication({ root, document }).boot();
}
