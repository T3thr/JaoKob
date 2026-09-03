import { createMetrics } from "../core/domain/meters.js";
import { assertRendererPort } from "../core/ports/renderer-port.js";
import { assertStoragePort } from "../core/ports/storage-port.js";
import { planGameStateTransition } from "../core/state-machine/game-state.js";
import { resolveChoiceTransaction } from "../core/use-cases/choice-transaction.js";
import { PROLOGUE_SLICE, validatePrologueSlice } from "../data/content/prologue-slice.js";
import { createLocalStorageAdapter } from "../data/persistence/local-storage-adapter.js";
import {
  CURRENT_SAVE_FORMAT_VERSION,
  validateSaveEnvelope,
} from "../data/validation/save-envelope-validator.js";
import { createDomRenderer } from "../ui/renderers/dom/dom-renderer.js";

/**
 * Composition root for Sprint 1's first playable slice.
 *
 * The module owns application-session coordination only: it composes concrete
 * adapters, projects immutable views, dispatches user intents to the Core, and
 * persists Core-approved snapshots. Narrative copy, stable IDs, metric effects
 * and navigation declarations remain in `src/data/content/prologue-slice.js`.
 *
 * Trace: FR-STA-001..004, FR-ENG-001..003, FR-SAV-001..003, FR-UI-001..003,
 * FR-UI-006..007, FR-ACC-001, ADR-P0-001, ADR-P0-004..007.
 */

export const BOOTSTRAP_ERROR_CODES = Object.freeze({
  CONTENT_SCHEMA: "CONTENT_SCHEMA",
  INVALID_TRANSITION: "INVALID_TRANSITION",
  PORT_FAILURE: "PORT_FAILURE",
  UNEXPECTED: "UNEXPECTED",
});

const RECOVERABLE_SAVE_ERRORS = new Set([
  "SAVE_PARSE",
  "SAVE_SCHEMA",
  "SAVE_MIGRATION",
  "STORAGE_UNAVAILABLE",
  "STORAGE_QUOTA",
]);

/**
 * Compose and control the first playable slice.
 *
 * All external concerns are injectable so application integration can be
 * verified without a browser or mutable global test state. Production defaults
 * are the DOM renderer and the LocalStorage adapter.
 *
 * @param {Readonly<Record<string, unknown>>} [options]
 * @returns {Readonly<{
 *   boot: () => Promise<Readonly<Record<string, unknown>>>,
 *   dispatch: (intent: Readonly<Record<string, unknown>>) => Promise<Readonly<Record<string, unknown>>>,
 *   whenIdle: () => Promise<unknown>,
 *   getSnapshot: () => Readonly<Record<string, unknown>> | null,
 *   getViewModel: () => Readonly<Record<string, unknown>> | null,
 *   getStatus: () => Readonly<Record<string, unknown>>
 * }>}
 */
export function createPlayableSlice(options = {}) {
  const content = options.content === undefined ? PROLOGUE_SLICE : options.content;
  const clock = typeof options.clock === "function" ? options.clock : defaultClock;
  const sessionIdFactory = typeof options.sessionIdFactory === "function"
    ? options.sessionIdFactory
    : createSessionId;
  const configuredDocument = options.document === undefined
    ? globalThis.document
    : options.document;
  const root = options.root === undefined
    ? configuredDocument?.getElementById?.("app") ?? null
    : options.root;

  let operationQueue = Promise.resolve();
  let snapshot = null;
  let resumeEnvelope = null;
  let settings = isRecord(readSettings(content)) ? cloneJson(readSettings(content)) : {};
  let feedback = null;
  let meterChanges = [];
  let persistenceNotice = null;
  let persistenceDegraded = false;
  let busy = false;
  let fatal = false;
  let booted = false;
  let lastViewModel = null;

  const renderer = options.renderer === undefined
    ? createDomRenderer({
      root,
      document: configuredDocument,
      onIntent(intent) {
        void dispatch(intent);
      },
    })
    : options.renderer;

  const storage = options.storage === undefined
    ? createDefaultStorage(options, content)
    : options.storage;
  const reload = typeof options.reload === "function" ? options.reload : defaultReload;

  assertRendererPort(renderer);
  assertStoragePort(storage);

  function boot() {
    return enqueue(bootInternal);
  }

  function dispatch(intent) {
    return enqueue(() => dispatchInternal(intent));
  }

  function whenIdle() {
    return operationQueue;
  }

  function getSnapshot() {
    return snapshot === null ? null : cloneAndFreezeJson(snapshot);
  }

  function getViewModel() {
    return lastViewModel === null ? null : cloneAndFreezeJson(lastViewModel);
  }

  function getStatus() {
    return Object.freeze({
      booted,
      busy,
      fatal,
      persistenceDegraded,
      hasResumeCandidate: resumeEnvelope !== null,
    });
  }

  async function bootInternal() {
    try {
      const contentResult = validatePrologueSlice(content);
      if (!contentResult.valid) {
        await presentFatal(contentResult.issue);
        return failure(contentResult.issue.code);
      }

      const titleTransition = planGameStateTransition({
        snapshot: null,
        event: "BOOT_COMPLETED",
        context: { contentValid: true, applicationComposed: true },
      });
      if (!titleTransition.ok) {
        await presentFatal({ code: BOOTSTRAP_ERROR_CODES.INVALID_TRANSITION });
        return failure(BOOTSTRAP_ERROR_CODES.INVALID_TRANSITION);
      }

      resumeEnvelope = null;
      persistenceDegraded = false;
      persistenceNotice = null;
      feedback = null;
      meterChanges = [];
      fatal = false;

      const loaded = await invokePort(storage, "load", { contentVersion: content.version });
      if (loaded.ok && loaded.value !== null) {
        const candidate = readCandidateEnvelope(loaded.value, content);
        if (candidate !== null) {
          resumeEnvelope = candidate;
          settings = cloneJson(candidate.settings);
          persistenceNotice = makeNotice(content, content.ui.messages.saveRecovered);
        } else {
          persistenceNotice = makeNotice(content, content.ui.messages.saveIgnored);
        }
      } else if (!loaded.ok) {
        if (!RECOVERABLE_SAVE_ERRORS.has(readErrorCode(loaded))) {
          await presentFatal({ code: readErrorCode(loaded) });
          return failure(readErrorCode(loaded));
        }
        persistenceDegraded = true;
        persistenceNotice = makeNotice(
          content,
          readErrorCode(loaded) === "STORAGE_UNAVAILABLE"
            ? content.ui.messages.saveUnavailable
            : content.ui.messages.saveIgnored,
        );
      }

      snapshot = createTitleSnapshot(content, titleTransition.value.target, timestamp(clock), sessionIdFactory);
      booted = true;
      const rendered = await renderCurrent();
      return rendered ? success() : failure(BOOTSTRAP_ERROR_CODES.PORT_FAILURE);
    } catch {
      await presentFatal({ code: BOOTSTRAP_ERROR_CODES.UNEXPECTED });
      return failure(BOOTSTRAP_ERROR_CODES.UNEXPECTED);
    }
  }

  async function dispatchInternal(intent) {
    if (!isRecord(intent) || typeof intent.type !== "string") {
      return failure(BOOTSTRAP_ERROR_CODES.UNEXPECTED);
    }
    if (!booted && intent.type !== "RETRY_RENDER") {
      return failure(BOOTSTRAP_ERROR_CODES.UNEXPECTED);
    }

    switch (intent.type) {
      case "SELECT_CHOICE":
        return selectChoice(intent.choiceId);
      case "RETRY_FROM_CHECKPOINT":
        return retryFromCheckpoint();
      case "OPEN_STORY_ASSIST":
        return enableStoryAssist();
      case "OPEN_SETTINGS":
        return announceAndRender(content.ui.messages.settingsUnavailable);
      case "RETURN_TO_TITLE":
        return returnToTitle();
      case "RETRY_RENDER":
        fatal = false;
        return await renderCurrent()
          ? success()
          : failure(BOOTSTRAP_ERROR_CODES.PORT_FAILURE);
      case "RELOAD_APPLICATION":
        reload();
        return success();
      default:
        return announceAndRender(content.ui.messages.actionUnavailable);
    }
  }

  async function selectChoice(choiceId) {
    if (typeof choiceId !== "string" || snapshot === null || busy || fatal) {
      return failure(BOOTSTRAP_ERROR_CODES.UNEXPECTED);
    }

    busy = true;
    const locked = await setRendererBusy(true);
    if (!locked) {
      busy = false;
      return failure(BOOTSTRAP_ERROR_CODES.PORT_FAILURE);
    }

    let result;
    try {
      result = snapshot.state === "Decision"
        ? await resolveDecisionChoice(choiceId)
        : await resolveNodeAction(choiceId);
    } catch {
      await presentFatal({ code: BOOTSTRAP_ERROR_CODES.UNEXPECTED });
      result = failure(BOOTSTRAP_ERROR_CODES.UNEXPECTED);
    } finally {
      busy = false;
      if (!fatal) await setRendererBusy(false);
    }

    if (!fatal) await renderCurrent();
    return result;
  }

  async function resolveNodeAction(actionId) {
    const node = getNode(content, snapshot.currentNodeId);
    const action = node?.actions?.find((candidate) => candidate.id === actionId);
    if (action === undefined) return announceOnly(content.ui.messages.actionUnavailable);

    switch (action.command) {
      case "NEW_GAME":
        return startNewGame();
      case "CONTINUE":
        return continueGame();
      case "REQUEST_DECISION":
        return requestDecision(action.targetNodeId);
      default:
        return announceOnly(content.ui.messages.actionUnavailable);
    }
  }

  async function startNewGame() {
    const transition = planGameStateTransition({
      snapshot,
      event: "NEW_GAME",
      context: { confirmationComplete: true, entryReferencesValid: true },
    });
    if (!transition.ok) return announceOnly(content.ui.messages.actionUnavailable);

    const initialRevision = resumeEnvelope === null ? 1 : resumeEnvelope.revision + 1;
    snapshot = createNewGameSnapshot(
      content,
      transition.value.target,
      timestamp(clock),
      sessionIdFactory,
      initialRevision,
    );
    feedback = null;
    meterChanges = [];
    const persisted = await persistSnapshot("new-game");
    return announceOnly(
      persisted ? content.ui.messages.saveSucceeded : content.ui.messages.saveUnavailable,
    );
  }

  async function continueGame() {
    if (resumeEnvelope === null || !isCompatibleEnvelope(resumeEnvelope, content)) {
      return announceOnly(content.ui.messages.actionUnavailable);
    }
    const transition = planGameStateTransition({
      snapshot,
      event: "CONTINUE",
      context: { compatibleRecoveredSave: true },
    });
    if (!transition.ok) return announceOnly(content.ui.messages.actionUnavailable);

    snapshot = hydrateSnapshot(resumeEnvelope, transition.value.target);
    feedback = null;
    meterChanges = [];
    return announceOnly(content.ui.messages.resumeReady);
  }

  async function requestDecision(targetNodeId) {
    const target = getNode(content, targetNodeId);
    if (target === null || target.type !== "decision") {
      return announceOnly(content.ui.messages.actionUnavailable);
    }
    const transition = planGameStateTransition({
      snapshot,
      event: "REQUEST_DECISION",
      context: {
        targetNodeType: target.type,
        entryConditionMet: true,
        eligibleChoiceCount: target.choices.length,
      },
    });
    if (!transition.ok) return announceOnly(content.ui.messages.actionUnavailable);

    snapshot = cloneAndFreezeJson({
      ...snapshot,
      state: transition.value.target,
      currentNodeId: target.id,
    });
    feedback = null;
    meterChanges = [];
    return success();
  }

  async function resolveDecisionChoice(choiceId) {
    const node = getNode(content, snapshot.currentNodeId);
    const choice = node?.choices?.find((candidate) => candidate.id === choiceId);
    if (choice === undefined) return announceOnly(content.ui.messages.actionUnavailable);

    const transaction = resolveChoiceTransaction({
      snapshot,
      command: {
        id: `command.${snapshot.revision}.${choice.id}`,
        expectedRevision: snapshot.revision,
        choiceId: choice.id,
        committedAt: timestamp(clock),
      },
      choice,
      flagDefinitions: content.flags.map(({ id, valueType, defaultValue }) => ({
        id,
        valueType,
        defaultValue,
      })),
      flagPolicies: Object.fromEntries(content.flags.map(({ id, policy }) => [id, policy])),
      target: toCoreTarget(getNode(content, choice.nextNodeId)),
      crisisTarget: toCoreTarget(getNode(content, content.tree.crisisNodeId)),
      recoveryTarget: toCoreTarget(getNode(content, content.tree.recoveryNodeId)),
      inputLocked: false,
      storyAssistEnabled: settings.storyAssist === true,
    });

    if (!transaction.ok) return announceOnly(content.ui.messages.choiceRejected);

    snapshot = transaction.value.snapshot;
    feedback = choice.feedback;
    meterChanges = transaction.value.effectSummary.metricChanges;
    await persistSnapshot("choice-committed");
    return announceOnly(choice.feedback);
  }

  async function retryFromCheckpoint() {
    if (snapshot === null || snapshot.state !== "GameOver" || !isRecord(snapshot.checkpoint)) {
      return announceAndRender(content.ui.messages.actionUnavailable);
    }
    const checkpoint = snapshot.checkpoint;
    const node = getNode(content, checkpoint.nodeId);
    const transition = planGameStateTransition({
      snapshot,
      event: "RETRY_CHECKPOINT",
      context: {
        checkpointValid: node !== null && checkpoint.state === "Cutscene",
        contentReferencesCompatible: node !== null,
      },
    });
    if (!transition.ok) return announceAndRender(content.ui.messages.actionUnavailable);

    const beforeMetrics = snapshot.metrics;
    snapshot = cloneAndFreezeJson({
      ...snapshot,
      state: transition.value.target,
      revision: snapshot.revision + 1,
      currentNodeId: checkpoint.nodeId,
      metrics: checkpoint.metrics,
      flags: checkpoint.flags,
      eventOccurrences: checkpoint.eventOccurrences,
      rng: checkpoint.rng,
    });
    feedback = content.ui.messages.retryReady;
    meterChanges = diffMeterChanges(beforeMetrics, snapshot.metrics);
    await persistSnapshot("checkpoint");
    await announceOnly(content.ui.messages.retryReady);
    await renderCurrent();
    return success();
  }

  async function enableStoryAssist() {
    settings = cloneJson({ ...settings, storyAssist: true });
    return announceAndRender(content.ui.messages.storyAssistEnabled);
  }

  async function returnToTitle() {
    if (snapshot === null || snapshot.state !== "GameOver") {
      return announceAndRender(content.ui.messages.actionUnavailable);
    }
    const transition = planGameStateTransition({
      snapshot,
      event: "RETURN_TITLE",
      context: { activeTransaction: false },
    });
    if (!transition.ok) return announceAndRender(content.ui.messages.actionUnavailable);

    snapshot = createTitleSnapshot(content, transition.value.target, timestamp(clock), sessionIdFactory);
    feedback = null;
    meterChanges = [];
    await renderCurrent();
    return success();
  }

  async function persistSnapshot(reason) {
    const envelope = createSaveEnvelope(content, snapshot, settings, reason, timestamp(clock));
    const staged = await invokePort(storage, "stage", envelope);
    if (!staged.ok) {
      markPersistenceFailure();
      return false;
    }
    const committed = await invokePort(storage, "commit", {
      expectedRevision: envelope.revision,
      reason,
    });
    if (!committed.ok) {
      markPersistenceFailure();
      return false;
    }
    persistenceDegraded = false;
    persistenceNotice = makeNotice(content, content.ui.messages.saveSucceeded);
    resumeEnvelope = envelope;
    return true;
  }

  function markPersistenceFailure() {
    persistenceDegraded = true;
    persistenceNotice = makeNotice(content, content.ui.messages.saveUnavailable);
  }

  async function announceAndRender(message) {
    await announceOnly(message);
    if (!fatal) await renderCurrent();
    return success();
  }

  async function announceOnly(message) {
    const announced = await invokePort(renderer, "announce", { text: message });
    if (!announced.ok) {
      await presentFatal(announced.error);
      return failure(BOOTSTRAP_ERROR_CODES.PORT_FAILURE);
    }
    return success();
  }

  async function setRendererBusy(nextBusy) {
    const result = await invokePort(renderer, "setBusy", nextBusy);
    if (result.ok) return true;
    await presentFatal(result.error);
    return false;
  }

  async function renderCurrent() {
    if (snapshot === null) {
      await presentFatal({ code: BOOTSTRAP_ERROR_CODES.UNEXPECTED });
      return false;
    }
    const viewModel = projectViewModel({
      content,
      snapshot,
      feedback,
      meterChanges,
      persistenceNotice,
      hasResumeCandidate: resumeEnvelope !== null,
    });
    lastViewModel = viewModel;
    const rendered = await invokePort(renderer, "render", viewModel);
    if (!rendered.ok) {
      await presentFatal(rendered.error);
      return false;
    }
    const focus = await invokePort(renderer, "applyFocusDirective", {
      target: viewModel.choices.length > 0 ? "first-choice" : "dialogue",
    });
    if (focus.ok) return true;
    await presentFatal(focus.error);
    return false;
  }

  async function presentFatal(failureDetail) {
    fatal = true;
    const code = typeof failureDetail?.code === "string"
      ? failureDetail.code
      : BOOTSTRAP_ERROR_CODES.UNEXPECTED;
    await invokePort(renderer, "showFatalShell", { code });
  }

  function enqueue(operation) {
    const next = operationQueue.then(operation, operation);
    operationQueue = next.catch(() => undefined);
    return next;
  }

  return Object.freeze({
    boot,
    dispatch,
    whenIdle,
    getSnapshot,
    getViewModel,
    getStatus,
  });
}

/**
 * Produce a frozen, localized-independent view model from the current state.
 *
 * @param {Readonly<Record<string, unknown>>} input
 * @returns {Readonly<Record<string, unknown>>}
 */
export function projectViewModel(input) {
  const { content, snapshot } = input;
  const node = getNode(content, snapshot.currentNodeId);
  const titleNode = getNode(content, content.tree.titleNodeId);
  const scene = node?.scene ?? titleNode.scene;
  const viewModel = {
    locale: content.locale,
    state: snapshot.state,
    scene,
    meters: {
      hp: snapshot.metrics.hp,
      sanity: snapshot.metrics.sanity,
      // GDD-UX-003 keeps Bond hidden until Act 4; the value still remains
      // visible to the Core and save contract for this integration slice.
      bond: { value: snapshot.metrics.bond, visible: false },
    },
    feedback: input.feedback ?? undefined,
    meterChanges: Array.isArray(input.meterChanges)
      ? input.meterChanges.filter((change) => change?.meter !== "bond")
      : [],
    notice: input.persistenceNotice ?? undefined,
    choices: choicesForView({
      content,
      snapshot,
      node,
      hasResumeCandidate: input.hasResumeCandidate === true,
    }),
  };

  if (snapshot.state === "Title"
    && input.hasResumeCandidate !== true
    && input.persistenceNotice == null) {
    viewModel.firstRunNotice = content.ui.firstRunNotice;
  }
  if (snapshot.state === "GameOver") {
    viewModel.gameOver = {
      title: scene.title,
      description: scene.dialogue,
    };
  }
  return cloneAndFreezeJson(viewModel);
}

function choicesForView({ content, snapshot, node, hasResumeCandidate }) {
  if (snapshot.state === "Title") {
    return titleActions(node, hasResumeCandidate);
  }
  if (snapshot.state === "Decision") {
    return Array.isArray(node?.choices)
      ? node.choices.map(({ id, label }) => ({ id, label }))
      : [];
  }
  if (snapshot.state === "Cutscene") {
    return Array.isArray(node?.actions)
      ? node.actions
        .filter((action) => action.command === "REQUEST_DECISION")
        .map(({ id, label }) => ({ id, label }))
      : [];
  }
  return [];
}

function titleActions(node, hasResumeCandidate) {
  if (!Array.isArray(node?.actions)) return [];
  return node.actions
    .filter((action) => action.command !== "CONTINUE" || hasResumeCandidate)
    .map(({ id, label }) => ({ id, label }));
}

function createDefaultStorage(options, content) {
  const adapterOptions = {
    validateEnvelope(envelope) {
      return isCompatibleEnvelope(envelope, content);
    },
  };
  if (Object.hasOwn(options, "localStorage")) adapterOptions.storage = options.localStorage;
  return createLocalStorageAdapter(adapterOptions);
}

function createTitleSnapshot(content, state, createdAt, sessionIdFactory) {
  const metrics = createMetrics(content.defaults.metrics);
  const base = {
    sessionId: sessionIdFactory(),
    startedAt: createdAt,
    playTimeMs: 0,
    state,
    revision: 1,
    currentTreeId: content.tree.id,
    currentNodeId: content.tree.titleNodeId,
    metrics,
    flags: createDefaultFlags(content.flags),
    eventOccurrences: [],
    progress: emptyProgress(),
    history: [],
    rng: cloneJson(content.defaults.rng),
  };
  return cloneAndFreezeJson({
    ...base,
    checkpoint: createCheckpoint(content.tree.initialCheckpointId, base, createdAt),
  });
}

function createNewGameSnapshot(
  content,
  state,
  startedAt,
  sessionIdFactory,
  revision = 1,
) {
  const metrics = createMetrics(content.defaults.metrics);
  const base = {
    sessionId: sessionIdFactory(),
    startedAt,
    playTimeMs: 0,
    state,
    revision,
    currentTreeId: content.tree.id,
    currentNodeId: content.tree.entryNodeId,
    metrics,
    flags: createDefaultFlags(content.flags),
    eventOccurrences: [],
    progress: emptyProgress(),
    history: [],
    rng: cloneJson(content.defaults.rng),
  };
  return cloneAndFreezeJson({
    ...base,
    checkpoint: createCheckpoint(content.tree.initialCheckpointId, base, startedAt),
  });
}

function createCheckpoint(id, snapshot, capturedAt) {
  return {
    id,
    capturedAt,
    treeId: snapshot.currentTreeId,
    nodeId: snapshot.currentNodeId,
    state: snapshot.state,
    metrics: cloneJson(snapshot.metrics),
    flags: cloneJson(snapshot.flags),
    eventOccurrences: cloneJson(snapshot.eventOccurrences),
    rng: cloneJson(snapshot.rng),
  };
}

function createDefaultFlags(definitions) {
  return definitions
    .map(({ id, defaultValue }) => ({ id, value: defaultValue }))
    .sort((left, right) => (left.id < right.id ? -1 : left.id > right.id ? 1 : 0));
}

function emptyProgress() {
  return {
    completedNodeIds: [],
    viewedDialogueIds: [],
    unlockedEndingIds: [],
  };
}

function createSaveEnvelope(content, snapshot, settings, reason, savedAt) {
  return {
    saveFormatVersion: CURRENT_SAVE_FORMAT_VERSION,
    contentVersion: content.version,
    revision: snapshot.revision,
    createdAt: snapshot.startedAt,
    savedAt,
    reason,
    payload: toSavePayload(snapshot),
    settings: cloneJson(settings),
  };
}

function toSavePayload(snapshot) {
  return {
    sessionId: snapshot.sessionId,
    startedAt: snapshot.startedAt,
    playTimeMs: snapshot.playTimeMs,
    state: snapshot.state,
    currentTreeId: snapshot.currentTreeId,
    currentNodeId: snapshot.currentNodeId,
    checkpoint: cloneJson(snapshot.checkpoint),
    metrics: cloneJson(snapshot.metrics),
    flags: cloneJson(snapshot.flags),
    eventOccurrences: cloneJson(snapshot.eventOccurrences),
    progress: cloneJson(snapshot.progress),
    history: cloneJson(snapshot.history),
    rng: cloneJson(snapshot.rng),
  };
}

function hydrateSnapshot(envelope, state) {
  return cloneAndFreezeJson({
    ...envelope.payload,
    revision: envelope.revision,
    state,
  });
}

function readCandidateEnvelope(candidate, content) {
  if (!isRecord(candidate) || !isRecord(candidate.envelope)) return null;
  return isCompatibleEnvelope(candidate.envelope, content) ? candidate.envelope : null;
}

function isCompatibleEnvelope(envelope, content) {
  if (validateSaveEnvelope(envelope).valid !== true) return false;
  if (envelope.contentVersion !== content.version) return false;
  if (envelope.payload.state !== "Cutscene") return false;
  const currentNode = getNode(content, envelope.payload.currentNodeId);
  const checkpointNode = getNode(content, envelope.payload.checkpoint.nodeId);
  return currentNode?.type === "cutscene"
    && checkpointNode?.type === "cutscene"
    && envelope.payload.currentTreeId === content.tree.id;
}

function toCoreTarget(node) {
  if (node === null) {
    return { id: "node.invalid", type: "invalid", entryConditionMet: false };
  }
  return {
    id: node.id,
    type: node.type,
    entryConditionMet: true,
  };
}

function getNode(content, id) {
  if (!isRecord(content) || !Array.isArray(content.nodes)) return null;
  return content.nodes.find((node) => node?.id === id) ?? null;
}

function diffMeterChanges(before, after) {
  return ["hp", "sanity", "bond"]
    .filter((meter) => before[meter] !== after[meter])
    .map((meter) => ({
      meter,
      before: before[meter],
      after: after[meter],
      delta: after[meter] - before[meter],
    }));
}

function makeNotice(content, text) {
  return { title: content.ui.labels.saveStatus, text };
}

function readSettings(content) {
  return content?.defaults?.settings ?? {};
}

async function invokePort(port, operation, ...args) {
  try {
    const outcome = await port[operation](...args);
    if (isRecord(outcome) && typeof outcome.ok === "boolean") return outcome;
  } catch {
    // Browser and adapter exceptions are intentionally translated at the
    // composition boundary; raw implementation details are never rendered.
  }
  return Object.freeze({
    ok: false,
    error: Object.freeze({ code: BOOTSTRAP_ERROR_CODES.PORT_FAILURE }),
  });
}

function readErrorCode(outcome) {
  return typeof outcome?.error?.code === "string"
    ? outcome.error.code
    : BOOTSTRAP_ERROR_CODES.PORT_FAILURE;
}

function success() {
  return Object.freeze({ ok: true });
}

function failure(code) {
  return Object.freeze({ ok: false, error: Object.freeze({ code }) });
}

function timestamp(clock) {
  const value = clock();
  if (typeof value === "string" && value.length > 0) return value;
  if (value instanceof Date && !Number.isNaN(value.valueOf())) return value.toISOString();
  return new Date().toISOString();
}

function defaultClock() {
  return new Date().toISOString();
}

function defaultReload() {
  if (typeof globalThis.location?.reload === "function") globalThis.location.reload();
}

function createSessionId() {
  if (typeof globalThis.crypto?.randomUUID === "function") return globalThis.crypto.randomUUID();
  const randomHex = () => Math.floor(Math.random() * 16).toString(16);
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (token) => {
    const value = Number.parseInt(randomHex(), 16);
    return (token === "x" ? value : ((value & 0x3) | 0x8)).toString(16);
  });
}

function cloneAndFreezeJson(value) {
  return deepFreeze(cloneJson(value));
}

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}

function deepFreeze(value) {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const nested of Object.values(value)) deepFreeze(nested);
    Object.freeze(value);
  }
  return value;
}

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

if (typeof document !== "undefined") {
  const root = document.getElementById("app");
  if (root !== null) {
    const application = createPlayableSlice({ root, document });
    void application.boot();
  }
}
