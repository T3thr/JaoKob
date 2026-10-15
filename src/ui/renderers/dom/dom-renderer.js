import { RENDERER_ERROR_CODES } from "../../../core/ports/renderer-port.js";
import { TH_SYSTEM_MESSAGES } from "../../localization/th-system-messages.js";
import { createStageView } from "../../components/stage-view.js";
import { createSettingsDialog } from "../../components/settings-dialog.js";
import { createContentAdvisoryDialog } from "../../components/content-advisory-dialog.js";
import { createChromeIcon } from "../../components/chrome-icons.js";
import { createConfirmationDialog } from "../../components/confirmation-dialog.js";
import { createReadingPages } from "../../components/reading-pages.js";
import { createToggleSwitch } from "../../components/toggle-switch.js";
import { createKeepsakePouchDialog } from "../../components/keepsake-pouch-dialog.js";
import { createHistoryDialog } from "../../components/history-dialog.js";

/**
 * Semantic DOM implementation of RendererPort.
 *
 * The adapter accepts already-localized immutable view models, constructs only
 * safe DOM nodes, and sends semantic UI intents to an injected application
 * callback. It never imports persistence code, reads browser storage, or
 * mutates a domain snapshot.
 *
 * Trace: FR-UI-001..FR-UI-007, FR-ACC-001..FR-ACC-004, NFR-US-005,
 * NFR-SE-003, NFR-MA-001, NFR-PO-003, ADR-P0-001, ADR-P0-005.
 */

const METER_MAX = 100;
const METER_DEFINITIONS = Object.freeze([
  Object.freeze({ name: "hp", labelKey: "meter.hp" }),
  Object.freeze({ name: "sanity", labelKey: "meter.sanity" }),
  Object.freeze({ name: "bond", labelKey: "meter.bond" }),
]);

const FATAL_CONTENT_CODES = new Set([
  "CONTENT_PARSE",
  "CONTENT_SCHEMA",
  "CONTENT_REFERENCE",
  "CONTENT_VERSION",
  "CONTENT_CAPABILITY",
  "CONTENT_LOAD",
  "CONTENT_ORIGIN",
]);

const FATAL_STORAGE_CODES = new Set([
  "SAVE_PARSE",
  "SAVE_SCHEMA",
  "SAVE_MIGRATION",
  "STORAGE_UNAVAILABLE",
  "STORAGE_QUOTA",
]);

/**
 * @typedef {object} DomRendererOptions
 * @property {Element} root Element that owns this renderer's isolated DOM tree.
 * @property {Document} [document] Injectable DOM document for tests or hosts.
 * @property {(intent: Readonly<Record<string, unknown>>) => void} [onIntent]
 * Receives semantic UI intent only; application code owns command handling.
 * @property {Readonly<Record<string, string>>} [messages]
 * Optional localized chrome overrides. Missing keys fall back to Thai.
 * @property {(event: Event) => void} [onTrustedActivation]
 * Synchronous composition callback before any story intent; never enters Core.
 * @property {(reference: object) => Promise<object|null>} [loadImage]
 * Verified decoded image lease: {ok:true,value:{url,release}} or silent failure.
 * @property {(receipt: object|null) => void} [onReadingPresented]
 * Successful local pagination/layout acknowledgement; text stays in the VM.
 * @property {(callback: () => void, delay: number) => unknown} [scheduleStatus]
 * @property {(timer: unknown) => void} [cancelStatus]
 * UI-only timer injection for transient successful-save indication.
 */

/**
 * Create a synchronous, semantic DOM RendererPort implementation.
 *
 * A malformed host element is converted to a typed failure by each port
 * operation rather than throwing across the renderer boundary.
 *
 * @param {DomRendererOptions | Element} optionsOrRoot
 * @returns {Readonly<import("../../../core/ports/renderer-port.js").RendererPort & {dispose(): void}>}
 */
export function createDomRenderer(optionsOrRoot) {
  const options = normalizeOptions(optionsOrRoot);
  const root = options.root;
  const configuredDocument = options.document;
  const onIntent = typeof options.onIntent === "function" ? options.onIntent : () => {};
  const messages = isRecord(options.messages) ? options.messages : {};

  let busy = false;
  let scaffold = null;
  let references = emptyReferences();
  let stage = null;
  let lastReadingView = null;
  let modal = null;
  let disposed = false;
  let restoreChoiceFocus = null;
  let busyModalFocus = null;
  let gameShell = null;
  let storyKey = null;
  let modalKey = null;
  let modalKind = null;
  let currentView = null;
  let lastAnnouncement = null;
  let lastConsequenceAnnouncement = null;
  let modalOpener = null;
  let toastTimer = null, toastKey = null;
  const reader = createReadingPages({ root, document: configuredDocument ?? root?.ownerDocument, message: (key) => message(messages, key), onAdvance: advanceReading,
    onPresented: receipt => { if (!disposed && !modal) options.onReadingPresented?.(receipt); } });
  function advanceReading() {
    if (busy || modal || !currentView) return;
    if (reader.next()) return;
    if (currentView.presentation?.mode === "reading" && currentView.choices?.some(({id}) => id === "application.advance")) emitIntent({ type: "SELECT_CHOICE", choiceId: "application.advance" });
  }
  const interactive = (target) => {
    for (let node = target; node && node !== root; node = node.parentElement ?? node.parentNode) {
      if (["BUTTON", "INPUT", "SELECT", "TEXTAREA", "A", "DIALOG", "HEADER"].includes(node.tagName?.toUpperCase()) || node.isContentEditable || node.getAttribute?.("role") === "switch") return true;
    }
    return false;
  };
  const readKey = (event) => {
    if (![" ", "Enter"].includes(event.key) || event.defaultPrevented || event.isComposing || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || interactive(event.target)) return;
    if (event.repeat) { event.preventDefault?.(); return; }
    if (!busy && !modal && (reader.hasMore() || currentView?.presentation?.mode === "reading")) { event.preventDefault?.(); advanceReading(); }
  };
  const readClick = (event) => {
    if (event.defaultPrevented || (event.button !== undefined && event.button !== 0) || event.detail > 1 || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || interactive(event.target) || (configuredDocument ?? root?.ownerDocument)?.defaultView?.getSelection?.()?.toString()) return;
    advanceReading();
  };
  const scheduleStatus = options.scheduleStatus ?? ((callback, delay) => setTimeout(callback, delay));
  const cancelStatus = options.cancelStatus ?? ((timer) => clearTimeout(timer));
  let statusTimer = null;
  let savedKey = null;
  let successExpired = false;
  const trustedActivation = (event) => {
    if (event.type === "keydown" && event.repeat && [" ", "Enter"].includes(event.key) && event.target?.tagName?.toUpperCase() === "BUTTON") event.preventDefault?.();
    for (let node = event.target; node && node !== root; node = node.parentElement ?? node.parentNode) {
      if (["application.history", "application.close-history"].includes(node.getAttribute?.("data-choice-id")) || node.getAttribute?.("data-jk-role") === "history-dialog") return;
    }
    if (event.isTrusted === true && (event.type !== "keydown" || !event.repeat)) options.onTrustedActivation?.(event);
  };

  function render(viewModel) {
    return perform("render", () => {
      assertRecord(viewModel, "View model must be an object.");
      const activeScaffold = ensureScaffold();
      if (disposed) throw new TypeError("Renderer is disposed.");
      const hadModal = modal !== null;
      const previousModalKind = modalKind;
      const focusSetting = activeScaffold.document.activeElement?.getAttribute?.("data-jk-setting")
        ?? activeScaffold.document.activeElement?.getAttribute?.("data-jk-preference") ?? busyModalFocus?.setting;
      const focusChoice = activeScaffold.document.activeElement?.getAttribute?.("data-choice-id") ?? busyModalFocus?.choice;
      const focusRole = activeScaffold.document.activeElement?.getAttribute?.("data-jk-role");
      currentView = viewModel;
      const nextModalKind = ["advisory", "pouch", "history"].includes(viewModel.overlay) ? viewModel.overlay : ["settings", "replace-confirmation", "choice-confirmation"].includes(viewModel.presentation?.mode) ? viewModel.presentation.mode : null;
      const isModal = nextModalKind !== null;
      const stageModel = isModal && lastReadingView ? { ...lastReadingView, settings: viewModel.settings,
        soundState: viewModel.soundState, soundStateLabel: viewModel.soundStateLabel,
        notice: viewModel.notice, audioStatusText: viewModel.audioStatusText, mediaStatusText: viewModel.mediaStatusText } : viewModel;
      const nextStoryKey = readingKey(stageModel);
      const sameStory = gameShell !== null && storyKey === nextStoryKey;
      if (!isModal) lastReadingView = viewModel;
      stage ??= createStageView({ document: activeScaffold.document, loadImage: options.loadImage });
      stage.update(stageModel.presentation);
      if (!sameStory) {
        const built = buildGameShell(activeScaffold.document, stageModel, messages, emitIntent, stage);
        if (gameShell === null) {
          gameShell = built;
          activeScaffold.content.replaceChildren(built.element);
        } else {
          // Keep the stage/header/main landmarks alive across story beats.
          gameShell.references.dialogue.replaceChildren(...built.references.dialogue.children);
          gameShell.card.replaceChildren(...[...built.card.children].map((child) => child === built.references.dialogue ? gameShell.references.dialogue : child));
          gameShell.header.replaceChildren(...built.header.children);
          gameShell.story.replaceChildren(...[...built.story.children].map((child) => child === built.card ? gameShell.card : child));
          gameShell.element.setAttribute("data-stage-mode", built.element.getAttribute("data-stage-mode"));
          gameShell.element.setAttribute("lang", built.element.getAttribute("lang"));
          gameShell.element.replaceChildren(stage.background, gameShell.header, stage.character, gameShell.story, gameShell.toast);
          gameShell = { ...built, element: gameShell.element, header: gameShell.header, story: gameShell.story, card: gameShell.card,
            toast: gameShell.toast, references: { ...built.references, dialogue: gameShell.references.dialogue } };
        }
        storyKey = nextStoryKey;
        references = gameShell.references;
      }
      patchUtilityStatus(gameShell, stageModel, messages);
      updateStatusLifetime(stageModel);
      updateToast(stageModel);
      references = gameShell.references;
      root.setAttribute("data-high-contrast", viewModel.settings?.highContrast === true ? "true" : "false");
      root.setAttribute("data-reduced-motion", viewModel.settings?.reducedMotion === true ? "true" : "false");
      const scale = viewModel.settings?.fontScale;
      root.style.fontSize = `${typeof scale === "number" && scale >= 1 && scale <= 2 ? scale * 100 : 100}%`;
      if (viewModel.viewRevision !== undefined) root.setAttribute("data-view-revision", String(viewModel.viewRevision));
      reader.update(stageModel, gameShell, { suspended: isModal });
      applyBusyState(activeScaffold, references, busy);
      if (isModal) {
        gameShell.element.setAttribute("inert", "");
        const nextModalKey = JSON.stringify([nextModalKind, viewModel.settings, viewModel.preferences, nextModalKind === "pouch" ? viewModel.pouch : null]);
        if (!modal || modalKey !== nextModalKey) {
          const scroll = modal?.scrollRegion?.scrollTop ?? 0;
          modal?.close(); modal?.element.remove?.();
          const createDialog = nextModalKind === "history" ? createHistoryDialog : nextModalKind === "pouch" ? createKeepsakePouchDialog : nextModalKind === "advisory" ? createContentAdvisoryDialog : nextModalKind === "settings" ? createSettingsDialog : createConfirmationDialog;
          modal = createDialog({ document: activeScaffold.document, viewModel, message: (key) => message(messages, key), onIntent: emitIntent });
          // Replacing this container also works in the injected minimal DOM.
          activeScaffold.content.replaceChildren(gameShell.element, modal.element);
          modal.open(hadModal && previousModalKind === nextModalKind ? focusSetting : nextModalKind === "settings" ? viewModel.focusSetting : null,
            previousModalKind === "advisory" && nextModalKind === "settings" ? "application.advisory" : hadModal ? focusChoice : null);
          if (busy) busyModalFocus = {
            setting: activeScaffold.document.activeElement?.getAttribute?.("data-jk-setting") ?? activeScaffold.document.activeElement?.getAttribute?.("data-jk-preference"),
            choice: activeScaffold.document.activeElement?.getAttribute?.("data-choice-id"),
          };
          if (previousModalKind === nextModalKind) modal.scrollRegion.scrollTop = scroll;
          else if (nextModalKind !== "history") modal.scrollRegion.scrollTop = 0;
          modalKey = nextModalKey;
          modalKind = nextModalKind;
        }
        modal.updateStatus(viewModel);
        if (modal.setBusy) modal.setBusy(busy);
        else for (const control of modal.controls) control.disabled = busy;
      } else if (hadModal) {
        modal.close(); modal = null; modalKey = null; modalKind = null; busyModalFocus = null;
        gameShell.element.removeAttribute("inert");
        activeScaffold.content.replaceChildren(gameShell.element);
        restoreChoiceFocus = previousModalKind === "advisory" ? "application.advisory" : previousModalKind === "settings" ? "application.settings" : modalOpener;
        modalOpener = null;
      }
      else if (sameStory && (focusChoice || focusRole === "dialogue")) {
        (references.choiceButtons.find(({ element }) => element.getAttribute("data-choice-id") === focusChoice)?.element ?? references.dialogue)?.focus();
      }
      if (viewModel.reading) return Object.freeze({ presented: isModal ? null : reader.presented() });
    });
  }

  function setBusy(nextBusy) {
    return perform("setBusy", () => {
      if (typeof nextBusy !== "boolean") {
        throw new TypeError("Busy state must be a boolean.");
      }
      busy = nextBusy;
      const activeScaffold = ensureScaffold();
      if (busy && modal !== null) busyModalFocus = {
        setting: activeScaffold.document.activeElement?.getAttribute?.("data-jk-setting") ?? activeScaffold.document.activeElement?.getAttribute?.("data-jk-preference"),
        choice: activeScaffold.document.activeElement?.getAttribute?.("data-choice-id"),
      };
      applyBusyState(activeScaffold, references, busy);
      if (modal?.setBusy) modal.setBusy(busy);
      else for (const control of modal?.controls ?? []) control.disabled = busy;
      if (!busy && modal && busyModalFocus) {
        modal.controls.find((control) => (busyModalFocus.setting && (control.getAttribute("data-jk-setting") === busyModalFocus.setting || control.getAttribute("data-jk-preference") === busyModalFocus.setting))
          || (busyModalFocus.choice && control.getAttribute("data-choice-id") === busyModalFocus.choice))?.focus();
        busyModalFocus = null;
      }
    });
  }

  function announce(status) {
    return perform("announce", () => {
      const activeScaffold = ensureScaffold();
      // A successful autosave is quiet. Authored feedback and meter changes
      // still get their own accessible announcement, as do recovery warnings.
      const quietSave = currentView?.notice?.kind === "saved";
      const feedback = readFeedbackText(currentView ?? {});
      const eventId = currentView?.feedbackEventId;
      let nextStatus = status;
      let repeatedConsequence = false;
      if (eventId && (feedback || status?.meterChanges?.length)) {
        repeatedConsequence = eventId === lastConsequenceAnnouncement;
        if (repeatedConsequence) {
          if (currentView?.notice?.kind !== "attention") return;
          nextStatus = { text: currentView.notice.text };
        } else lastConsequenceAnnouncement = eventId;
      }
      if (quietSave && !feedback && !status?.meterChanges?.length) return;
      const text = readStatusText(quietSave ? { ...nextStatus, text: feedback || message(messages, "feedback.label") } : nextStatus, messages);
      const identity = repeatedConsequence ? JSON.stringify(["attention", text]) : JSON.stringify([feedback ? eventId ?? currentView?.revision : currentView?.revision,
        feedback ? "consequence" : currentView?.presentation?.mode, feedback ? feedback : currentView?.scene?.dialogue, text]);
      if (lastAnnouncement !== identity) {
        activeScaffold.liveRegion.textContent = text;
        lastAnnouncement = identity;
      }
    });
  }

  function applyFocusDirective(directive) {
    return perform("applyFocusDirective", () => {
      assertRecord(directive, "Focus directive must be an object.");
      ensureScaffold();
      if (modal !== null) return;
      if (restoreChoiceFocus) {
        const target = references.choiceButtons.find(({ element }) => element.getAttribute("data-choice-id") === restoreChoiceFocus)?.element
          ;
        restoreChoiceFocus = null; if (target) { target.focus(); return; }
      }
      const target = resolveFocusTarget(directive, references);
      if (target === null) {
        throw new RendererFocusError("FOCUS_TARGET_NOT_FOUND");
      }
      if (typeof target.focus !== "function") {
        throw new RendererFocusError("FOCUS_NOT_SUPPORTED");
      }
      target.focus();
    });
  }

  function showFatalShell(failure) {
    return perform("showFatalShell", () => {
      assertRecord(failure, "Fatal failure must be an object.");
      busy = false;
      clearStatusTimer();
      modal?.close(); modal = null; stage?.dispose(); stage = null;
      gameShell = null; storyKey = null; modalKey = null; modalKind = null; lastReadingView = null; restoreChoiceFocus = null; busyModalFocus = null;
      const activeScaffold = ensureScaffold();
      const built = buildFatalShell(activeScaffold.document, failure, messages, emitIntent);
      activeScaffold.content.replaceChildren(built.element);
      references = built.references;
      applyBusyState(activeScaffold, references, false);

      if (typeof built.references.fatal?.focus === "function") {
        built.references.fatal.focus();
      }
    });
  }

  function emitIntent(intent) {
    if (intent.choiceId === "application.advance" && reader.next()) return;
    if (intent.type === "SELECT_CHOICE" && !modal) modalOpener = intent.choiceId;
    if (intent.choiceId === "application.retry-media") stage?.retry();
    // Persistent controls use the latest UI revision, never the revision of
    // their original closure. Application still owns eligibility and commit.
    onIntent(Object.freeze({ ...intent, ...(currentView?.viewRevision === undefined ? {} : {
      viewRevision: currentView.viewRevision,
      ...(intent.type === "SELECT_CHOICE" ? { expectedRevision: currentView.revision } : {}),
    }) }));
  }

  function updateToast(view) {
    const changes = (view.meterChanges ?? []).filter(({ meter, delta }) => ["hp", "sanity"].includes(meter) && delta !== 0);
    const token = JSON.stringify([view.feedbackEventId ?? view.readingBeatId ?? view.scene?.dialogue, changes]);
    if (token === toastKey) return;
    toastKey = token;
    if (toastTimer !== null) cancelStatus(toastTimer);
    toastTimer = null;
    const toast = gameShell.toast;
    toast.replaceChildren();
    if (!changes.length) { toast.setAttribute("hidden", ""); return; }
    const list = createElement(gameShell.document, "ul", { classNames: ["jk-meter-changes"] });
    for (const change of changes) { const item = buildMeterChange(gameShell.document, change, messages); if (item) list.append(item); }
    toast.append(list); toast.removeAttribute("hidden");
    toastTimer = scheduleStatus(() => {
      toastTimer = null;
      if (!disposed && token === toastKey) gameShell?.toast.setAttribute("hidden", "");
    }, 2500);
  }

  function clearStatusTimer() {
    if (statusTimer !== null) cancelStatus(statusTimer);
    statusTimer = null;
  }

  function updateStatusLifetime(view) {
    const kind = view.notice?.kind;
    const status = gameShell.status;
    const token = JSON.stringify([view.revision, view.notice?.text]);
    const attention = status.textContent && (kind !== "saved" || view.mediaStatusText);
    status.setAttribute("data-status-kind", attention ? "attention" : kind === "saved" ? "saved" : "idle");
    gameShell.header.setAttribute("data-status-kind", attention ? "attention" : kind === "saved" ? "saved" : "idle");
    if (attention || !status.textContent) {
      clearStatusTimer();
      if (kind === "saved") { savedKey = token; successExpired = true; }
      status.setAttribute("data-status-phase", attention ? "visible" : "quiet");
      if (attention) { status.removeAttribute("hidden"); status.removeAttribute("aria-hidden"); }
      else { status.setAttribute("hidden", ""); status.setAttribute("aria-hidden", "true"); }
      return;
    }
    if (savedKey !== token) {
      clearStatusTimer(); savedKey = token; successExpired = false;
      statusTimer = scheduleStatus(() => {
        statusTimer = null;
        if (disposed || savedKey !== token || !gameShell || gameShell.status.getAttribute("data-status-kind") !== "saved") return;
        successExpired = true;
        gameShell.status.setAttribute("data-status-phase", "quiet");
        gameShell.status.setAttribute("hidden", "");
        gameShell.status.setAttribute("aria-hidden", "true");
      }, 1500);
    }
    status.setAttribute("data-status-phase", successExpired ? "quiet" : "visible");
    if (successExpired) { status.setAttribute("hidden", ""); status.setAttribute("aria-hidden", "true"); }
    else { status.removeAttribute("hidden"); status.removeAttribute("aria-hidden"); }
  }

  function ensureScaffold() {
    if (!isDomContainer(root)) {
      throw new TypeError("Renderer root must support DOM child and attribute operations.");
    }

    const document = resolveDocument(configuredDocument, root);
    if (
      scaffold !== null
      && scaffold.root === root
      && scaffold.document === document
      && scaffold.content.parentNode === root
      && scaffold.liveRegion.parentNode === root
    ) {
      return scaffold;
    }

    addClasses(root, "jk-app");
    root.addEventListener?.("pointerdown", trustedActivation, true);
    root.addEventListener?.("keydown", trustedActivation, true);
    root.addEventListener?.("keydown", readKey);
    root.addEventListener?.("click", readClick);
    root.setAttribute("aria-busy", busy ? "true" : "false");

    const content = createElement(document, "div", {
      classNames: ["jk-app-content"],
      attributes: { "data-jk-role": "content" },
    });
    const liveRegion = createElement(document, "p", {
      classNames: ["jk-visually-hidden"],
      attributes: {
        "data-jk-role": "live-region",
        role: "status",
        "aria-live": "polite",
        "aria-atomic": "true",
      },
    });
    root.replaceChildren(content, liveRegion);
    scaffold = Object.freeze({ root, document, content, liveRegion });
    return scaffold;
  }

  return Object.freeze({
    render,
    setBusy,
    announce,
    applyFocusDirective,
    showFatalShell,
    dispose() {
      clearStatusTimer();
      reader.dispose();
      if (toastTimer !== null) cancelStatus(toastTimer);
      disposed = true; stage?.dispose(); modal?.close(); modal = null;
      root?.removeEventListener?.("pointerdown", trustedActivation, true);
      root?.removeEventListener?.("keydown", trustedActivation, true);
      root?.removeEventListener?.("keydown", readKey);
      root?.removeEventListener?.("click", readClick);
    },
  });
}

function buildGameShell(document, viewModel, messages, emitIntent, stage) {
  const mode = viewModel.presentation?.mode ?? "legacy";
  const title = mode === "title" || (mode === "legacy" && viewModel.state === "Title");
  const shell = createElement(document, "div", {
    classNames: ["jk-app-shell"],
    attributes: { "data-jk-role": "game-shell", "data-stage-mode": title ? "title" : mode, lang: readLocale(viewModel) },
  });
  const references = emptyReferences();
  const scene = readScene(viewModel);
  const header = createElement(document, "header", {
    classNames: ["jk-stage-header"], attributes: { id: "stage-hud", "data-jk-role": "stage-header" },
  });
  const bar = createElement(document, "div", { classNames: ["jk-header-bar"] });
  header.append(bar);
  if (!title && viewModel.state !== "Title") {
    const hud = createElement(document, "div", {
      classNames: ["jk-hud"], attributes: { "data-jk-role": "hud", "aria-label": message(messages, "hud.label") },
    });
    hud.append(buildMeterList(document, viewModel, messages));
    bar.append(hud);
  }
  const utility = createElement(document, "div", {
    classNames: ["jk-utility-rail"], attributes: { "data-jk-role": "utility-rail" },
  });
  const status = createElement(document, "p", {
    classNames: ["jk-save-status"], attributes: { "data-jk-role": "save-status" },
  });
  bar.append(utility);
  header.append(status);
  shell.append(stage.background, header, stage.character);
  const story = createElement(document, "main", {
    classNames: ["jk-story"], attributes: { id: "stage-dialogue", "aria-label": message(messages, "story.label") },
  });
  story.append(createElement(document, "h1", {
    classNames: [title ? "jk-title-heading" : "jk-visually-hidden"], text: scene.title || message(messages, "app.name"),
  }));

  const narrative = createElement(document, "article", { classNames: ["jk-narrative"], attributes: { "data-jk-role": "reading-card" } });
  const readingBody = createElement(document, "section", {
    classNames: ["jk-reading-body"], attributes: { "data-jk-role": "dialogue", tabindex: "-1", "aria-label": message(messages, "story.label") },
  });
  narrative.append(readingBody);

  if (scene.context) story.append(createElement(document, "p", { classNames: ["jk-visually-hidden"], text: scene.context }));
  if (scene.speaker && !title) {
    const speaker = createElement(document, "p", { classNames: ["jk-speaker"], attributes: { "data-jk-role": "speaker" } });
    speaker.append(stage.speakerPortrait,
      createElement(document, "span", { classNames: ["jk-visually-hidden"], text: `${message(messages, "speaker.label")}: ` }),
      createElement(document, "strong", { text: scene.speaker }));
    readingBody.append(speaker);
  }
  readingBody.append(createElement(document, "p", {
    classNames: ["jk-dialogue"], attributes: { "data-jk-role": "dialogue-text", id: "jk-current-dialogue" }, text: [readFeedbackText(viewModel), scene.dialogue].filter(Boolean).join("\n\n"),
  }));
  const footer = createElement(document, "div", { classNames: ["jk-reading-footer"] });
  if (scene.pageLabel) footer.append(createElement(document, "p", {
    classNames: ["jk-page-label"], attributes: { "data-jk-role": "page-label" }, text: scene.pageLabel,
  }));
  const storyChoices = (viewModel.choices ?? []).filter((choice) => {
    if (UTILITY_CHOICE_IDS.has(choice?.id)) return false;
    if (mode === "reading") return choice?.id === "application.advance";
    if (mode === "decision") return choice?.id !== "application.advance";
    return true;
  });
  const choices = buildChoices(document, { ...viewModel, choices: storyChoices }, messages, emitIntent);
  const choiceSlot = createElement(document, "div", { classNames: ["jk-choice-slot"], attributes: { "data-jk-role": "choice-slot" } });
  if (choices && choices.buttons.length > 0) {
    if (mode === "reading") footer.append(choices.element);
    else choiceSlot.append(choices.element);
    references.choiceList = choices.list;
    references.choiceButtons = choices.buttons;
  }
  // This footer and the external choice slot keep the paper's geometry fixed.
  narrative.append(footer);
  const cutscene = buildCutsceneControls(document, viewModel, messages, emitIntent);
  if (cutscene) choiceSlot.append(cutscene);
  const gameOver = buildGameOverPanel(document, viewModel, messages, emitIntent);
  if (gameOver) choiceSlot.append(gameOver);
  // Prose precedes choices in the DOM; the stable slot is visually above paper.
  story.append(narrative, choiceSlot);

  shell.append(story);
  references.dialogue = readingBody;
  const toast = createElement(document, "aside", { classNames: ["jk-hud-toast"], attributes: { "data-jk-role": "meter-toast", "aria-hidden": "true", hidden: "" } });
  shell.append(toast);
  const built = { element: shell, header, story, card: narrative, slot: choiceSlot, footer, toast, status, utility, references, document, emitIntent };
  patchUtilityStatus(built, viewModel, messages);
  return built;
}

// Operational status and media completion do not invalidate story DOM. Choices
// omit utility availability so those controls can be patched independently.
function readingKey(view) {
  return JSON.stringify([view.locale, view.state, view.revision, view.presentation?.mode, view.presentation?.nodeId,
    view.scene, view.dialogue, view.speaker, view.meters, view.feedback, view.meterChanges,
    view.firstRunNotice, view.contentNotice, view.cutscene, view.gameOver, view.confirmationRequired,
    view.choices?.filter((choice) => !UTILITY_CHOICE_IDS.has(choice.id))]);
}

const UTILITY_CHOICE_IDS = new Set(["application.settings", "application.enable-sound", "application.retry-media", "application.advisory", "application.pouch", "application.history"]);

function patchUtilityStatus(shell, view, messages) {
  const text = readString(view.notice?.text) || readString(view.notice?.description);
  const statusText = [(view.notice?.kind === "saved" && view.mediaStatusText) || view.notice?.kind === "resume" ? "" : text, readString(view.mediaStatusText)].filter(Boolean).join(" ");
  if (shell.status.textContent !== statusText) shell.status.textContent = statusText;
  shell.status.setAttribute("aria-label", readString(view.notice?.title) || message(messages, "save.label"));
  const oldButtons = shell.references.choiceButtons.filter(({ element }) => UTILITY_CHOICE_IDS.has(element.getAttribute("data-choice-id")));
  const buttons = [];
  const utilityChoices = (view.choices ?? []).filter((choice) => UTILITY_CHOICE_IDS.has(choice?.id));
  // Settings stays at the end of the rail and immediately precedes the story
  // controls in keyboard order, even when a recovery action is available.
  utilityChoices.sort((a, b) => Number(a.id === "application.settings") - Number(b.id === "application.settings"));
  for (const choice of utilityChoices) {
    let button = oldButtons.find(({ element }) => element.getAttribute("data-choice-id") === choice.id)?.element;
    if (!button) {
      button = createElement(shell.document, "button", {
        classNames: [choice.id === "application.settings" ? "jk-settings-button" : "jk-utility-button"],
        attributes: { type: "button", "data-choice-id": choice.id, "data-jk-role": "choice" },
      });
      button.addEventListener("click", () => {
        if (!button.disabled) shell.emitIntent({ type: "SELECT_CHOICE", choiceId: choice.id });
      });
      if (choice.id === "application.settings") {
        button.setAttribute("aria-haspopup", "dialog");
        button.append(createChromeIcon(shell.document, "settings"),
          createElement(shell.document, "span", { classNames: ["jk-utility-label"], text: message(messages, "settings.short") }));
      } else if (choice.id === "application.enable-sound") {
        button.setAttribute("class", "jk-utility-button jk-sound-button");
      } else button.append(createChromeIcon(shell.document, choice.id === "application.history" ? "history" : choice.id === "application.pouch" ? "pouch" : choice.id === "application.retry-media" ? "retry" : "info"),
        createElement(shell.document, "span", { classNames: ["jk-utility-label"], text: choice.id === "application.history" ? message(messages, "history.short") : choice.id === "application.pouch" ? message(messages, "pouch.short") : choice.label }));
    }
    button.setAttribute("aria-label", choice.label || message(messages, "settings.title"));
    button.setAttribute("title", choice.label || message(messages, "settings.title"));
    if (choice.id === "application.enable-sound") button.setAttribute("aria-pressed", (view.audioEnabled ?? view.soundState === "ready") ? "true" : "false");
    if (["application.advisory", "application.pouch", "application.history"].includes(choice.id)) button.setAttribute("aria-haspopup", "dialog");
    if (choice.id === "application.enable-sound" && button.getAttribute("data-audio-state") !== view.soundState) {
      button.setAttribute("data-audio-state", view.soundState ?? "blocked");
      button.replaceChildren(createChromeIcon(shell.document, view.soundState === "ready" ? "sound" : "muted"),
        createElement(shell.document, "span", { classNames: ["jk-sound-state"], text: view.soundStateLabel ?? "" }));
    }
    buttons.push({ element: button, disabled: choice.disabled === true || choice.available === false });
  }
  // Avoid detaching a focused Settings button during status-only changes.
  if (oldButtons.length !== buttons.length || oldButtons.some((record, index) => record.element !== buttons[index]?.element)) {
    const wanted = buttons.map(({ element }) => element);
    if (typeof shell.utility.insertBefore === "function") {
      for (const [index, node] of wanted.entries()) {
        if (shell.utility.children[index] !== node) shell.utility.insertBefore(node, shell.utility.children[index] ?? null);
      }
      for (const child of [...shell.utility.children]) if (!wanted.includes(child)) child.remove();
    } else shell.utility.replaceChildren(...wanted);
  }
  shell.references.settingsButton = buttons.find(({ element }) => element.getAttribute("data-choice-id") === "application.settings")?.element ?? null;
  shell.references.choiceButtons = Object.freeze([
    ...shell.references.choiceButtons.filter(({ element }) => !UTILITY_CHOICE_IDS.has(element.getAttribute("data-choice-id"))), ...buttons,
  ]);
}

function buildMeterList(document, viewModel, messages) {
  const list = createElement(document, "dl", {
    classNames: ["jk-meter-list"],
    attributes: {
      "data-jk-role": "meters",
      "aria-label": message(messages, "hud.label"),
    },
  });

  for (const definition of METER_DEFINITIONS) {
    const raw = viewModel.meters?.[definition.name];
    if (definition.name === "bond" && raw?.state === "locked") {
      const chip = createElement(document, "div", { classNames: ["jk-bond-locked"], attributes: { "data-jk-meter": "bond", "data-bond-state": "locked" } });
      const icons = createElement(document, "span", { classNames: ["jk-bond-icons"], attributes: { "aria-hidden": "true" } });
      icons.append(createChromeIcon(document, "bond"));
      const label = createElement(document, "dt");
      label.append(createElement(document, "span", { classNames: ["jk-bond-label"], text: raw.label }),
        createElement(document, "span", { classNames: ["jk-bond-short"], text: message(messages, "meter.bondLockedShort") }));
      const description = createElement(document, "dd", { classNames: ["jk-visually-hidden"], text: raw.accessibleLabel });
      chip.append(icons, label, description); list.append(chip); continue;
    }
    const meter = readMeter(viewModel, definition.name);
    if (meter === null || meter.visible === false) continue;

    const label = message(messages, definition.labelKey);
    const value = normalizeMeterValue(meter.value);
    const item = createElement(document, "div", {
      classNames: ["jk-meter"],
      attributes: { "data-jk-meter": definition.name },
    });
    const term = createElement(document, "dt", { classNames: ["jk-meter-label"] });
    const icon = createElement(document, "span", {
      classNames: ["jk-meter-icon"],
      attributes: { "aria-hidden": "true" },
    });
    icon.append(createChromeIcon(document, definition.name));
    const labelText = createElement(document, "span", { text: label });
    term.append(icon, labelText);

    const description = createElement(document, "dd", {
      classNames: ["jk-meter-value"],
    });
    const progress = createElement(document, "div", {
      classNames: ["jk-meter-track"],
      attributes: {
        role: "progressbar",
        "aria-valuemin": "0",
        "aria-valuemax": String(METER_MAX),
        "aria-valuenow": String(value),
        "aria-label": label,
        "aria-valuetext": formatMessage(message(messages, "meter.value"), {
          label,
          value,
          max: METER_MAX,
        }),
      },
    });
    const fill = createElement(document, "span", {
      classNames: ["jk-meter-fill"],
      attributes: { "data-jk-meter-fill": definition.name },
    });
    fill.style.inlineSize = `${value}%`;
    const numeric = createElement(document, "strong", {
      classNames: ["jk-meter-number"],
      text: `${value}/${METER_MAX}`,
    });
    progress.append(fill);
    description.append(progress, numeric);
    item.append(term, description);
    list.append(item);
  }

  return list;
}

function buildMeterChange(document, change, messages) {
  if (!isRecord(change) || typeof change.meter !== "string") return null;
  const definition = METER_DEFINITIONS.find((item) => item.name === change.meter);
  if (definition === undefined) return null;

  const delta = typeof change.delta === "number" && Number.isFinite(change.delta)
    ? Math.trunc(change.delta)
    : 0;
  const label = message(messages, definition.labelKey);
  const direction = delta > 0 ? "positive" : delta < 0 ? "negative" : "neutral";
  const text = readString(change.text)
    || formatMessage(message(messages, `meter.change.${direction}`), {
      label,
      amount: Math.abs(delta),
    });
  const item = createElement(document, "li", {
    classNames: ["jk-meter-change"],
    attributes: { "data-direction": direction },
  });
  const symbol = createElement(document, "span", {
    classNames: ["jk-meter-change-symbol"],
    attributes: { "aria-hidden": "true" },
    text: delta > 0 ? "+" : delta < 0 ? "−" : "•",
  });
  const copy = createElement(document, "span", { text });
  item.append(symbol, copy);
  return item;
}

function buildCutsceneControls(document, viewModel, messages, emitIntent) {
  const cutscene = isRecord(viewModel.cutscene) ? viewModel.cutscene : null;
  if (cutscene === null) return null;

  const section = createElement(document, "section", {
    classNames: ["jk-cutscene-controls"],
    attributes: {
      "data-jk-role": "cutscene-controls",
      "aria-label": message(messages, "cutscene.label"),
    },
  });
  const log = Array.isArray(cutscene.log) ? cutscene.log : [];
  if (log.length > 0) {
    section.append(createElement(document, "h2", {
      classNames: ["jk-section-title"],
      text: message(messages, "cutscene.log"),
    }));
    const list = createElement(document, "ol", { classNames: ["jk-cutscene-log"] });
    for (const entry of log) {
      const text = readLogEntry(entry);
      if (text) list.append(createElement(document, "li", { text }));
    }
    if (list.children.length > 0) section.append(list);
  }

  const controls = createElement(document, "div", { classNames: ["jk-cutscene-actions"] });
  const paused = cutscene.paused === true;
  controls.append(createIntentButton(
    document,
    paused ? message(messages, "cutscene.resume") : message(messages, "cutscene.pause"),
    "toggle-cutscene-pause",
    () => emitIntent({ type: "TOGGLE_CUTSCENE_PAUSE", paused: !paused }),
  ));

  const speedField = createElement(document, "label", { classNames: ["jk-cutscene-speed"] });
  speedField.append(createElement(document, "span", { text: message(messages, "cutscene.speed") }));
  const speed = createElement(document, "select", {
    attributes: { "data-jk-role": "cutscene-speed" },
  });
  const selectedSpeed = ["slow", "normal", "fast"].includes(cutscene.textSpeed)
    ? cutscene.textSpeed
    : "normal";
  for (const speedValue of ["slow", "normal", "fast"]) {
    const option = createElement(document, "option", {
      attributes: { value: speedValue },
      text: message(messages, `cutscene.speed.${speedValue}`),
    });
    if (speedValue === selectedSpeed) option.selected = true;
    speed.append(option);
  }
  speed.value = selectedSpeed;
  speed.addEventListener("change", () => {
    emitIntent({ type: "SET_CUTSCENE_TEXT_SPEED", speed: speed.value });
  });
  speedField.append(speed);
  controls.append(speedField);

  controls.append(createToggleSwitch({ document, label: message(messages, "cutscene.typewriter"), checked: cutscene.typewriterEnabled !== false,
    message: (key) => message(messages, key), attributes: { "data-jk-role": "typewriter-toggle" },
    onChange: (enabled) => emitIntent({ type: "SET_TYPEWRITER", enabled }) }));

  if (cutscene.canSkip === true) {
    controls.append(createIntentButton(
      document,
      message(messages, "cutscene.skip"),
      "skip-cutscene",
      () => emitIntent({ type: "SKIP_CUTSCENE" }),
    ));
  }
  section.append(controls);
  return section;
}

function buildGameOverPanel(document, viewModel, messages, emitIntent) {
  if (viewModel.state !== "GameOver" && viewModel.mode !== "game-over") return null;

  const gameOver = isRecord(viewModel.gameOver) ? viewModel.gameOver : {};
  const section = createElement(document, "section", {
    classNames: ["jk-game-over"],
    attributes: {
      "data-jk-role": "game-over",
      "aria-label": message(messages, "gameOver.label"),
    },
  });
  section.append(
    createElement(document, "h2", {
      text: readString(gameOver.title) || message(messages, "gameOver.title"),
    }),
    createElement(document, "p", {
      text: readString(gameOver.description) || message(messages, "gameOver.description"),
    }),
  );

  const actions = createElement(document, "div", { classNames: ["jk-game-over-actions"] });
  actions.append(
    createIntentButton(document, message(messages, "gameOver.retry"), "retry", () => {
      emitIntent({ type: "RETRY_FROM_CHECKPOINT" });
    }),
    createIntentButton(document, message(messages, "gameOver.storyAssist"), "story-assist", () => {
      emitIntent({ type: "OPEN_STORY_ASSIST" });
    }),
    createIntentButton(document, message(messages, "gameOver.settings"), "settings", () => {
      emitIntent({ type: "OPEN_SETTINGS" });
    }),
    createIntentButton(document, message(messages, "gameOver.titleAction"), "return-title", () => {
      emitIntent({ type: "RETURN_TO_TITLE" });
    }),
  );
  section.append(actions);
  return section;
}

function buildChoices(document, viewModel, messages, emitIntent) {
  if (!Array.isArray(viewModel.choices)) return null;

  const section = createElement(document, "nav", {
    classNames: ["jk-choice-area"],
    attributes: {
      "data-jk-role": "choices",
      "aria-label": message(messages, "choices.label"),
    },
  });
  const list = createElement(document, "ol", {
    classNames: ["jk-choice-list"],
    attributes: { "data-jk-role": "choice-list", tabindex: "-1" },
  });
  const buttons = [];
  const mode = viewModel.presentation?.mode;
  section.setAttribute("data-choice-mode", mode ?? "legacy");
  if (mode === "decision" || mode === "exploration") {
    section.append(createElement(document, "h2", { classNames: ["jk-choice-heading", "jk-visually-hidden"], text: message(messages, mode === "decision" ? "choices.decision" : "choices.exploration") }));
  }

  for (const choice of viewModel.choices) {
    if (choice?.id === "application.settings") continue;
    if (!isRecord(choice)) continue;
    const label = readString(choice.label) || readString(choice.text) || message(messages, "choice.unavailable");
    const disabled = choice.disabled === true || choice.available === false;
    const item = createElement(document, "li", { classNames: ["jk-choice-item"] });
    const button = createElement(document, "button", {
      classNames: ["jk-choice-button"],
      attributes: {
        type: "button",
        "data-jk-role": "choice",
      },
      text: label,
    });
    if (mode === "decision" || choice.id === "application.advance") {
      const copy = createElement(document, "span", { classNames: ["jk-choice-copy"] });
      copy.append(createElement(document, "span", { classNames: ["jk-choice-label"], text: label }));
      button.textContent = "";
      if (mode === "decision") {
        const names = { "choice.act1.focus-mother": "ripple", "choice.act1.focus-roots": "roots", "choice.act1.focus-siblings": "ripples" };
        const icon = createElement(document, "span", { classNames: ["jk-choice-icon"], attributes: { "aria-hidden": "true" } });
        icon.append(createChromeIcon(document, names[choice.id] ?? "ripple")); button.append(icon);
      }
      const cue = createElement(document, "span", { classNames: ["jk-choice-cue"], attributes: { "aria-hidden": "true" } });
      cue.append(createChromeIcon(document, "chevron")); button.append(copy, cue);
    }
    const choiceId = readString(choice.id);
    if (choiceId) button.setAttribute("data-choice-id", choiceId);
    if (choiceId === "application.advance") { button.setAttribute("data-jk-action", "advance"); addClasses(button, "jk-advance-button"); }
    if (mode === "decision") addClasses(button, "jk-decision-card");
    if (viewModel.confirmationRequired === true) button.setAttribute("aria-describedby", "jk-current-dialogue");
    button.disabled = disabled;
    button.setAttribute("aria-disabled", disabled ? "true" : "false");
    button.addEventListener("click", () => {
      if (button.disabled || !choiceId) return;
      emitIntent({ type: "SELECT_CHOICE", choiceId,
        ...(viewModel.viewRevision === undefined ? {} : { viewRevision: viewModel.viewRevision, expectedRevision: viewModel.revision }),
      });
    });
    item.append(button);

    const unavailableReason = readString(choice.unavailableReason) || readString(choice.reason);
    if (disabled && unavailableReason) {
      const reasonId = `jk-choice-reason-${buttons.length + 1}`;
      const reason = createElement(document, "p", {
        classNames: ["jk-choice-reason"],
        attributes: { id: reasonId },
        text: unavailableReason,
      });
      button.setAttribute("aria-describedby", reasonId);
      item.append(reason);
    }

    list.append(item);
    buttons.push(Object.freeze({ element: button, disabled }));
  }

  section.append(list);
  return Object.freeze({ element: section, list, buttons: Object.freeze(buttons) });
}

function buildFatalShell(document, failure, messages, emitIntent) {
  const fatal = createElement(document, "section", {
    classNames: ["jk-fatal-shell"],
    attributes: {
      "data-jk-role": "fatal-shell",
      role: "alert",
      tabindex: "-1",
      "aria-label": message(messages, "fatal.label"),
    },
  });
  const code = readString(failure.code);
  fatal.append(
    createElement(document, "h1", { text: message(messages, "fatal.title") }),
    createElement(document, "p", { text: fatalMessageFor(code, messages) }),
    createIntentButton(document, message(messages, "fatal.retry"), "retry-render", () => {
      emitIntent({ type: "RETRY_RENDER" });
    }),
    createIntentButton(document, message(messages, "fatal.reload"), "reload-application", () => {
      emitIntent({ type: "RELOAD_APPLICATION" });
    }),
  );
  const references = emptyReferences();
  references.fatal = fatal;
  return Object.freeze({ element: fatal, references: Object.freeze(references) });
}

function createIntentButton(document, text, action, listener) {
  const button = createElement(document, "button", {
    classNames: ["jk-secondary-button"],
    attributes: { type: "button", "data-jk-action": action },
    text,
  });
  button.addEventListener("click", listener);
  return button;
}

function applyBusyState(scaffold, references, busy) {
  scaffold.root.setAttribute("aria-busy", busy ? "true" : "false");
  for (const record of references.choiceButtons) {
    const disabled = busy || record.disabled;
    record.element.disabled = disabled;
    record.element.setAttribute("aria-disabled", disabled ? "true" : "false");
  }
}

function resolveFocusTarget(directive, references) {
  if (directive.target === "choice") return references.choiceButtons.find(({element}) => element.getAttribute("data-choice-id") === directive.choiceId)?.element ?? references.dialogue;
  const targetName = readString(directive.target)
    || readString(directive.targetId)
    || readString(directive.focus);
  switch (targetName) {
    case "first-choice":
    case "firstChoice":
    case "choice-list":
    case "choices":
      return references.choiceButtons.find((record) => !record.element.disabled)?.element
        || references.choiceList
        || null;
    case "dialogue":
    case "story":
    case "narrative":
      return references.dialogue;
    case "fatal":
    case "fatal-shell":
      return references.fatal;
    default:
      return null;
  }
}

function readScene(viewModel) {
  const scene = isRecord(viewModel.scene) ? viewModel.scene : {};
  const dialogue = readString(viewModel.dialogue)
    || readString(scene.dialogue)
    || readString(isRecord(viewModel.dialogue) ? viewModel.dialogue.text : undefined);
  return Object.freeze({
    title: readString(viewModel.sceneTitle) || readString(scene.title) || readString(scene.name),
    speaker: readString(viewModel.speaker)
      || readString(scene.speaker)
      || readString(isRecord(viewModel.speaker) ? viewModel.speaker.name : undefined),
    dialogue,
    pageLabel: readString(scene.pageLabel),
    context: readString(scene.context),
  });
}

function readLocale(viewModel) {
  const locale = readString(viewModel.locale);
  return /^[a-z]{2,3}(?:-[a-z0-9]{2,8})*$/i.test(locale) ? locale : "th";
}

function readFeedbackText(viewModel) {
  if (typeof viewModel.feedback === "string") return viewModel.feedback;
  if (isRecord(viewModel.feedback)) {
    return readString(viewModel.feedback.text) || readString(viewModel.feedback.message);
  }
  return readString(viewModel.feedbackText);
}

function readMeter(viewModel, name) {
  const meters = isRecord(viewModel.meters) ? viewModel.meters : {};
  const raw = meters[name];
  if (typeof raw === "number" && Number.isFinite(raw)) {
    return Object.freeze({ value: raw, visible: true });
  }
  if (!isRecord(raw) || typeof raw.value !== "number" || !Number.isFinite(raw.value)) return null;
  return Object.freeze({ value: raw.value, visible: raw.visible !== false });
}

function readLogEntry(entry) {
  if (typeof entry === "string") return entry;
  if (isRecord(entry)) return readString(entry.text) || readString(entry.dialogue);
  return "";
}

function readStatusText(status, messages) {
  if (typeof status === "string" && status) return status;
  if (isRecord(status)) {
    const text = readString(status.text) || readString(status.message) || message(messages, "status.generic");
    const changes = Array.isArray(status.meterChanges) ? status.meterChanges : [];
    const descriptions = changes.filter((change) => ["hp", "sanity"].includes(change.meter) && Number.isFinite(change.delta)).map((change) => (
      formatMessage(message(messages, change.delta > 0 ? "meter.change.positive" : change.delta < 0 ? "meter.change.negative" : "meter.change.neutral"), {
        label: message(messages, `meter.${change.meter}`), amount: Math.abs(change.delta),
      })
    ));
    return [text, ...descriptions].join(" ");
  }
  throw new TypeError("Status must be a string or an object with display text.");
}

function fatalMessageFor(code, messages) {
  if (FATAL_CONTENT_CODES.has(code)) return message(messages, "fatal.content");
  if (FATAL_STORAGE_CODES.has(code)) return message(messages, "fatal.storage");
  if (code === "UNSUPPORTED_ENVIRONMENT") return message(messages, "fatal.environment");
  return message(messages, "fatal.generic");
}

function normalizeMeterValue(value) {
  return Math.min(METER_MAX, Math.max(0, Math.round(value)));
}

function normalizeOptions(optionsOrRoot) {
  if (isRecord(optionsOrRoot) && Object.hasOwn(optionsOrRoot, "root")) {
    return optionsOrRoot;
  }
  return { root: optionsOrRoot };
}

function resolveDocument(configuredDocument, root) {
  const document = configuredDocument || root?.ownerDocument || globalThis.document;
  if (document === null || typeof document !== "object" || typeof document.createElement !== "function") {
    throw new TypeError("Renderer requires a DOM document with createElement.");
  }
  return document;
}

function isDomContainer(value) {
  return value !== null
    && typeof value === "object"
    && typeof value.replaceChildren === "function"
    && typeof value.setAttribute === "function";
}

function createElement(document, tagName, options = {}) {
  const element = document.createElement(tagName);
  if (Array.isArray(options.classNames) && options.classNames.length > 0) {
    addClasses(element, ...options.classNames);
  }
  if (isRecord(options.attributes)) {
    for (const [name, value] of Object.entries(options.attributes)) {
      element.setAttribute(name, String(value));
    }
  }
  if (typeof options.text === "string") element.textContent = options.text;
  return element;
}

function addClasses(element, ...classNames) {
  if (element.classList && typeof element.classList.add === "function") {
    element.classList.add(...classNames);
    return;
  }
  const existing = typeof element.getAttribute === "function"
    ? element.getAttribute("class") || ""
    : "";
  const next = [...new Set([...existing.split(/\s+/), ...classNames].filter(Boolean))].join(" ");
  element.setAttribute("class", next);
}

function message(messages, key) {
  return typeof messages[key] === "string" ? messages[key] : TH_SYSTEM_MESSAGES[key];
}

function formatMessage(template, values) {
  return template.replace(/{{([a-zA-Z0-9]+)}}/g, (_, key) => {
    const value = values[key];
    return typeof value === "string" || typeof value === "number" ? String(value) : "";
  });
}

function emptyReferences() {
  return {
    dialogue: null,
    choiceList: null,
    choiceButtons: Object.freeze([]),
    fatal: null,
    settingsButton: null,
  };
}

function perform(operation, action) {
  try {
    return Object.freeze({ ok: true, value: action() });
  } catch (error) {
    return failure(operation, error);
  }
}

function failure(operation, error) {
  return Object.freeze({
    ok: false,
    error: Object.freeze({
      code: RENDERER_ERROR_CODES.RENDER_FAILURE,
      details: Object.freeze({
        operation,
        reason: error instanceof RendererFocusError ? error.reason : "DOM_OPERATION_FAILED",
        cause: safeErrorName(error),
      }),
    }),
  });
}

function safeErrorName(error) {
  return error !== null && typeof error === "object" && typeof error.name === "string"
    ? error.name
    : "Error";
}

class RendererFocusError extends Error {
  constructor(reason) {
    super(reason);
    this.name = "RendererFocusError";
    this.reason = reason;
  }
}

function readString(value) {
  return typeof value === "string" ? value : "";
}

function assertRecord(value, message) {
  if (!isRecord(value)) throw new TypeError(message);
}

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
