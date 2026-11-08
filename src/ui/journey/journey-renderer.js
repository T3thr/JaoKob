/**
 * Journey renderer: draws a presentation model and turns the player's input into session
 * commands (ADR-P0-034 D9–D10, UX §1). It decides nothing about the story: which commands
 * are accepted, what a card costs, whether it is open and why not all arrive in the model.
 *
 *   - One screen, fixed zones: the HUD capsule on top, the stage behind, the face band empty,
 *     the dialogue card or a panel (choices, clash tray, camp board, keepsake offer, micro-action)
 *     in the same lower dock, so nothing shifts (layout shift 0).
 *   - Input: ▽, a tap on the stage or the card, Space and Enter read on; digits pick a card; a
 *     choice, clash move, camp activity or keepsake choice arms first (inline, bound to the
 *     revision) when the player keeps `confirmHighImpactChoices` on; Escape disarms or closes the
 *     ready picker; I opens the pouch (not during a micro-action, UX §5).
 *   - Silent save: nothing on screen or in the live region when a save works; a notice only
 *     when the application reports a failure (TC-S5-SILENT-001).
 *   - Each line, its scene title, a panel that opens and the toasts are announced once through
 *     one polite live region; focus moves to the first open card when a panel opens and back to
 *     ▽ after.
 *   - Settings: reduced motion, Reduced Intensity, high contrast (solid surfaces) and the
 *     text size become attributes the styles read; OS preferences apply in CSS as well.
 *   - Fit or flow: the dock stays below the face band; when it cannot, the screen becomes one
 *     scrolling column with the stage as a top strip (no nested scroll, no sideways scroll).
 *
 * The clash (C5a): the intent badge on top, the gauge at the top of the dock, the dialogue card
 * for the intent and resolve beats and the tabbed tray for the choose beat. The camp, the
 * micro-action and the keepsake offer (C5b): the camp clock beside the HUD line, the board, the
 * prompt and the sheet in the dock. C5c: the settings and pouch modals (the gear, the pouch
 * button and `I` open them; the game waits and sends no command while one is open), the
 * three-strand ending cards, and the chapter end at the boundary or after an ending with its way
 * back to the title.
 * Trace: ADR-P0-034 D9/D10, UX §1.4–§1.10 · §2.1 · §3–§7, Atomic 05 §3, TC-S5-VN-001,
 * TC-S5-HUD-001, TC-S5-SILENT-001, TC-S5-A11Y-001, TC-S5-INLINE-001, TC-S5-UX-001.
 */

import { createCampActivityBoard } from "./components/camp-activity-board.js";
import { createCampDropTimer } from "./components/camp-drop-timer.js";
import { createClashActionTray } from "./components/clash-action-tray.js";
import { createClashIntentAndGauge } from "./components/clash-intent-gauge.js";
import { createHudToasts } from "./components/hud-toasts.js";
import { createJourneyModal } from "./components/journey-modal.js";
import { createMicroPrompt } from "./components/micro-prompt.js";
import { createPouchPanel } from "./components/pouch-panel.js";
import { createPouchSwapSheet } from "./components/pouch-swap-sheet.js";
import { createSaaDialogueCard } from "./components/saa-dialogue-card.js";
import { createSceneTitleCard } from "./components/scene-title-card.js";
import { createSettingsPanel } from "./components/settings-panel.js";
import { createTactileActionCard } from "./components/tactile-action-card.js";
import { createThreeStrandDestinyCard } from "./components/three-strand-destiny-card.js";
import { createTopHudCapsule } from "./components/top-hud-capsule.js";
import { createVnTachieStage } from "./components/vn-tachie-stage.js";
import { createIdSource, element, setAttributes, setText } from "./journey-dom.js";

const MAX_CARDS = 5;
const INTERACTIVE = new Set(["BUTTON", "A", "INPUT", "SELECT", "TEXTAREA", "SUMMARY"]);
/** Controls that take typed letters: a shortcut letter there is the control's own. */
const TYPING = new Set(["INPUT", "SELECT", "TEXTAREA"]);
/** Modes whose content is a panel in the dock rather than the dialogue card. */
const PANEL_MODES = new Set(["DECISION", "CLASH_CHOOSE", "CAMP", "POUCH_SWAP", "MICRO", "ENDING_RESONANCE", "BOUNDARY", "COMPLETE"]);
/** Modes where a digit picks a card. */
const DIGIT_MODES = new Set(["DECISION", "CLASH_CHOOSE", "CAMP", "POUCH_SWAP", "ENDING_RESONANCE"]);
/** Modes that end the playable part: the chapter end shows the way back to the title. */
const END_MODES = new Set(["BOUNDARY", "COMPLETE"]);
const ITEM_KEY = "item:";

/**
 * @param {{document: Document, root: Element, messages: object, loadImage: Function,
 *   onCommand: (kind: string, args: object) => void, onChangeSettings?: (patch: object) => void,
 *   onLeave?: () => void, schedule?: (callback: () => void, ms: number) => unknown,
 *   frame?: (callback: () => void) => unknown, now?: () => number, prefersReducedMotion?: () => boolean}} options
 */
export function createJourneyRenderer(options) {
  const { document, root: host, messages, loadImage, onCommand } = options;
  const onChangeSettings = options.onChangeSettings ?? (() => {});
  const onLeave = options.onLeave ?? (() => {});
  const schedule = options.schedule ?? ((callback, ms) => globalThis.setTimeout(callback, ms));
  const view = document.defaultView ?? null;
  const frame = options.frame ?? (typeof view?.requestAnimationFrame === "function" ? view.requestAnimationFrame.bind(view) : (callback) => schedule(callback, 16));
  const now = options.now ?? (() => globalThis.performance?.now?.() ?? Date.now());
  const prefersReducedMotion = options.prefersReducedMotion ?? (() => globalThis.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true);
  const id = createIdSource("jk");

  const root = element(document, "div", "jk-journey", { "data-mode": "VN", "data-motion": "full", "data-surface": "glass", "data-intensity": "normal", "data-text": "normal", "data-overflow": "false" });
  const stage = createVnTachieStage({ document, loadImage, schedule });
  const hud = createTopHudCapsule({ document, messages, onPouch: () => openModal("pouch"), onSettings: () => openModal("settings") });
  const toasts = createHudToasts({ document, schedule });
  const sceneTitle = createSceneTitleCard({ document, schedule });
  const dialogue = createSaaDialogueCard({ document, messages, loadImage, onAdvance: () => advance() });

  const hudLayer = element(document, "div", "jk-hud-layer");
  hudLayer.append(hud.element, toasts.element);
  const corner = element(document, "div", "jk-corner");
  corner.append(hud.settingsButton);
  const dock = element(document, "section", "jk-dock", { "aria-label": messages.ui.game });
  const choices = element(document, "div", "jk-choices", { role: "group", "aria-label": messages.ui.decision, hidden: true, "data-count": "0" });
  const descriptions = element(document, "div", "jk-descriptions", { hidden: true });
  const cards = [], descriptionNodes = [];
  for (let index = 0; index < MAX_CARDS; index += 1) {
    const descriptionId = id("card");
    const description = element(document, "span", "", { id: descriptionId });
    descriptions.append(description);
    descriptionNodes.push(description);
    const card = createTactileActionCard({ document, messages, loadImage, describedBy: descriptionId, onActivate: (key) => activate(key) });
    choices.append(card.element);
    cards.push(card);
  }
  const clashView = createClashIntentAndGauge({ document, messages });
  const tray = createClashActionTray({ document, messages, loadImage, idSource: id, onActivate: (key) => activate(key), onSelect: (group) => selectGroup(group) });
  const clashTop = element(document, "div", "jk-clash-top");
  clashTop.append(clashView.badge, clashView.preview);

  const campTimer = createCampDropTimer({ document });
  const campTop = element(document, "div", "jk-camp-top");
  campTop.append(campTimer.element);
  const campBoard = createCampActivityBoard({
    document, messages, loadImage, idSource: id,
    onActivate: (key) => activate(key), onPick: (item) => pickKeepsake(item), onBack: () => closePicker(true), onLeave: () => leaveCamp(),
  });
  const pouchSheet = createPouchSwapSheet({ document, messages, loadImage, idSource: id, onActivate: (key) => activate(key) });
  const micro = createMicroPrompt({
    document, messages, idSource: id, schedule, frame, now,
    onDone: (key) => microDone(key),
    onProgress: (fill) => root.style.setProperty("--micro-fill", fill.toFixed(3)),
    onSay: (text) => announce(text),
  });
  const endingCards = createThreeStrandDestinyCard({ document, messages, idSource: id, onActivate: (key) => activate(key) });
  const chapterEnd = element(document, "section", "jk-chapter-end jk-paper", { "data-component": "ChapterEnd", hidden: true });
  const chapterText = element(document, "p", "jk-chapter-end__text");
  const chapterBack = element(document, "button", "jk-chapter-end__back", { type: "button", "data-action": "leave" }, messages.title.back);
  chapterBack.addEventListener("click", () => { if (model !== null && END_MODES.has(model.mode)) onLeave(); });
  chapterEnd.append(chapterText, chapterBack);
  const panels = [choices, tray.element, campBoard.element, pouchSheet.element, micro.element, endingCards.element, chapterEnd];
  dock.append(clashView.gauge, dialogue.element, ...panels, descriptions);

  const settingsPanel = createSettingsPanel({ document, messages, idSource: id, onChange: (patch) => onChangeSettings(patch) });
  const settingsModal = createJourneyModal({ document, name: "settings", title: messages.settings.title, closeLabel: messages.settings.close, idSource: id, onClose: () => closeModal() });
  settingsModal.body.append(settingsPanel.element);
  const pouchPanel = createPouchPanel({ document, messages, loadImage });
  const pouchModal = createJourneyModal({ document, name: "pouch", title: messages.pouchPanel.title, closeLabel: messages.pouchPanel.close, idSource: id, onClose: () => closeModal() });
  pouchModal.body.append(pouchPanel.element);
  const modals = Object.freeze({ settings: settingsModal, pouch: pouchModal });

  const notice = element(document, "div", "jk-notice jk-paper", { role: "status", hidden: true });
  const noticeText = element(document, "p", "jk-notice__text");
  const noticeDismiss = element(document, "button", "jk-notice__dismiss", { type: "button" }, messages.ui.dismiss);
  notice.append(noticeText, noticeDismiss);
  noticeDismiss.addEventListener("click", () => setAttributes(notice, { hidden: true }));

  const stageDescription = element(document, "p", "jk-sr");
  const live = element(document, "p", "jk-sr", { "aria-live": "polite", "aria-atomic": "true" });
  root.append(stage.element, hudLayer, corner, clashTop, campTop, sceneTitle.element, dock, notice, stageDescription, live, settingsModal.element, pouchModal.element);
  host.append(root);

  let model = null, armed = null, armedRevision = null, lastScene = null, lastAnnounced = null, lastMode = null, lastNotice = null, lastRevision = null, disposed = false;
  let picking = false, pickingRevision = null, modal = null, deferredMicro = null;

  const canAdvance = () => model !== null && model.line !== null && model.accepts.includes("advance");

  function advance() {
    if (!canAdvance()) return;
    onCommand("advance", { revision: model.revision });
  }

  /** The cards on screen now and the command they send. */
  function currentOptions() {
    if (model === null) return null;
    if (model.mode === "CLASH_CHOOSE" && model.clash !== null && model.accepts.includes("clashAct")) {
      return { options: model.clash.groups.flatMap((group) => group.cards), command: "clashAct", argument: "action" };
    }
    if (model.mode === "CAMP" && model.camp !== null && model.accepts.includes("campPick")) return { options: model.camp.cards, command: "campPick", argument: "activity" };
    if (model.mode === "POUCH_SWAP" && model.pouch !== null && model.accepts.includes("pouchDecide")) return { options: model.pouch.cards, command: "pouchDecide", argument: "option" };
    if (model.mode === "ENDING_RESONANCE" && model.endings !== null && model.accepts.includes("chooseEnding")) return { options: model.endings.cards, command: "chooseEnding", argument: "option" };
    if (model.decision !== null && model.decision !== undefined && model.accepts.includes("choose")) return { options: model.decision.options, command: "choose", argument: "option" };
    return null;
  }

  /** Arm first when the player keeps two-step confirmation on; commit on the second press. */
  function armOrCommit(key, label, commit) {
    if (model.settings.confirmHighImpactChoices === true && !(armed === key && armedRevision === model.revision)) {
      armed = key;
      armedRevision = model.revision;
      drawPanels();
      announce(`${label} · ${messages.ui.armedHint}`);
      return;
    }
    armed = null;
    commit();
  }

  function activate(key) {
    const current = currentOptions();
    if (current === null) return;
    const option = current.options.find((entry) => entry.key === key);
    if (option === undefined || !option.available) return;
    if (current.command === "campPick" && option.ready === true) { openPicker(); return; }
    armOrCommit(key, option.label, () => onCommand(current.command, { [current.argument]: key, revision: model.revision }));
  }

  /** The ready picker of the camp (UX §4.1.5): the four woven slots take the cards' place. */
  function openPicker() {
    if (model?.camp?.picker === null || model?.camp?.picker === undefined) return;
    picking = true;
    pickingRevision = model.revision;
    armed = null;
    drawPanels();
    measureFit();
    campBoard.firstSlot()?.focus?.({ preventScroll: true });
    announce(messages.camp.picker);
  }

  function closePicker(returnFocus) {
    if (!picking) return;
    picking = false;
    armed = null;
    drawPanels();
    measureFit();
    if (returnFocus) campBoard.cardOf(model?.camp?.picker?.activity)?.focus?.({ preventScroll: true });
  }

  function pickKeepsake(item) {
    const picker = model?.camp?.picker ?? null;
    if (!picking || picker === null || !model.accepts.includes("campPick")) return;
    const slot = picker.slots.find((entry) => entry.item === item);
    if (slot === undefined || !slot.available) return;
    armOrCommit(`${ITEM_KEY}${item}`, slot.name, () => {
      picking = false;
      onCommand("campPick", { activity: picker.activity, item, revision: model.revision });
    });
  }

  function leaveCamp() {
    if (model?.camp?.leave.available !== true || !model.accepts.includes("campLeave")) return;
    onCommand("campLeave", { revision: model.revision });
  }

  /** The micro-action reports done once; the command is bound to the revision it was drawn at and waits for an open modal. */
  function microDone(key) {
    if (model?.micro?.key !== key || !model.accepts.includes("microDone")) return;
    if (modal !== null) { deferredMicro = key; return; }
    onCommand("microDone", { revision: model.revision });
  }

  /**
   * The settings or pouch modal. The game waits while one is open: no command goes out (UX §1.7);
   * an armed card stays armed (ADR-P0-034 D9.3). Focus returns to where it was, or to the HUD control.
   */
  function openModal(kind) {
    if (modal !== null || model === null || (kind === "pouch" && model.mode === "MICRO")) return;
    modal = kind;
    setAttributes(root, { "data-modal": kind });
    const active = document.activeElement;
    const fallback = kind === "settings" ? hud.settingsButton : hud.controls.pouch;
    const returnTo = active !== null && active !== undefined && active !== document.body && root.contains?.(active) === true ? active : fallback;
    if (kind === "settings") {
      settingsPanel.update(model.settings);
      settingsModal.show({ returnTo, focus: settingsPanel.first() });
    } else {
      pouchPanel.update(model.pouchPanel);
      pouchModal.show({ returnTo });
    }
  }

  function closeModal() {
    if (modal === null) return;
    const closing = modals[modal];
    modal = null;
    setAttributes(root, { "data-modal": null });
    closing.hide();
    if (closing === pouchModal) pouchPanel.clear();
    if (deferredMicro !== null) {
      const key = deferredMicro;
      deferredMicro = null;
      microDone(key);
    }
  }

  function disarm() {
    if (armed === null) return;
    armed = null;
    drawPanels();
  }

  /** The open tab is the player's: kept for the whole clash, never switched for them (UX §3.3). */
  let selectedGroup = null, clashKey = null;
  function selectGroup(group) {
    selectedGroup = group;
    drawPanels();
  }

  const wideQuery = view?.matchMedia?.("(min-width: 800px) and (min-height: 560px)") ?? null;
  const trayLayout = () => (wideQuery?.matches === true ? "columns" : "tabs");

  function announce(text) {
    if (text === "" || text === lastAnnounced) return;
    lastAnnounced = text;
    live.textContent = text;
  }

  function applySettings(settings) {
    const reducedMotion = settings.reducedMotion === true || prefersReducedMotion();
    setAttributes(root, {
      "data-motion": reducedMotion ? "reduced" : "full",
      "data-surface": settings.highContrast === true ? "solid" : "glass",
      "data-contrast": settings.highContrast === true ? "high" : "normal",
      "data-intensity": settings.reducedIntensity === true ? "reduced" : "normal",
      "data-text": settings.fontScale >= 1.5 ? "large" : "normal",
    });
    root.style.setProperty("--jk-font-scale", String(settings.fontScale ?? 1));
  }

  /** An armed card stays armed only on the revision it was armed at and while it is still open. */
  function armedStillValid() {
    if (armed === null || armedRevision !== model?.revision) return false;
    if (armed.startsWith(ITEM_KEY)) return picking && model.camp?.picker?.slots.some((slot) => `${ITEM_KEY}${slot.item}` === armed && slot.available) === true;
    return (currentOptions()?.options ?? []).some((option) => option.key === armed && option.available);
  }

  function drawPanels() {
    const decision = model?.decision ?? null;
    const options = decision === null ? [] : decision.options.slice(0, MAX_CARDS);
    if (picking && (model?.mode !== "CAMP" || pickingRevision !== model.revision || model.camp?.picker === null || model.camp?.picker === undefined)) picking = false;
    if (!armedStillValid()) armed = null;
    tray.update(model?.clash ?? null, { selected: selectedGroup, armed, layout: trayLayout() });
    campBoard.update(model?.camp ?? null, { armed, picking });
    pouchSheet.update(model?.mode === "POUCH_SWAP" ? model.pouch : null, { armed });
    endingCards.update(model?.endings ?? null, { armed });
    const ended = model !== null && END_MODES.has(model.mode);
    setAttributes(chapterEnd, { hidden: !ended });
    if (ended) setText(chapterText, model.mode === "COMPLETE" ? messages.title.complete : messages.title.boundary);
    setAttributes(choices, { hidden: options.length === 0, "data-count": options.length });
    cards.forEach((card, index) => {
      const option = options[index];
      setAttributes(card.element, { hidden: option === undefined });
      if (option === undefined) { card.clear(); return; }
      card.update(option, { armed: armed === option.key });
      setText(descriptionNodes[index], option.description);
    });
  }

  function focusInsideOrIdle() {
    const active = document.activeElement;
    return active === null || active === undefined || active === document.body || root.contains?.(active) === true;
  }

  function moveFocus(previousMode, fresh, force = false) {
    if (!force && !focusInsideOrIdle()) return;
    const focus = (node) => node?.focus?.({ preventScroll: true });
    const entered = force || model.mode !== previousMode;
    if (model.mode === "DECISION" && entered) {
      const index = model.decision.options.findIndex((option) => option.available);
      focus(cards[Math.max(0, index)]?.element);
    } else if (model.mode === "CLASH_CHOOSE" && entered) {
      focus(tray.firstCard());
    } else if (model.mode === "CAMP" && fresh) {
      focus(campBoard.firstFocus());
    } else if (model.mode === "POUCH_SWAP" && entered) {
      focus(pouchSheet.firstFocus());
    } else if (model.mode === "MICRO" && entered) {
      focus(micro.target);
    } else if (model.mode === "ENDING_RESONANCE" && entered) {
      focus(endingCards.firstFocus());
    } else if (END_MODES.has(model.mode) && entered) {
      focus(chapterBack);
    } else if ((force || PANEL_MODES.has(previousMode)) && !PANEL_MODES.has(model.mode) && canAdvance()) {
      focus(dialogue.nextButton);
    }
  }

  /**
   * Fit or flow: when the dock rises into the face band (long Thai at 150–200 %, a short
   * landscape phone, many cards on a small phone), the screen becomes one scrolling column
   * with the stage as a top strip (UX §1.6). Measured in the fit layout only, once per state
   * and on resize, so it cannot oscillate.
   */
  function measureFit() {
    if (typeof root.getBoundingClientRect !== "function") return;
    root.setAttribute("data-overflow", "false");
    const frameBox = root.getBoundingClientRect();
    const shown = [dialogue.element, ...panels].find((node) => !node.hidden);
    if (shown === undefined) return;
    const box = shown.getBoundingClientRect();
    const top = box.top - frameBox.top;
    // The clash gauge and the camp clock sit at the top of the dock; the panel must stay below them.
    const crowded = [clashView.gauge, campTimer.element].some((node) => {
      if (node.hidden) return false;
      const other = node.getBoundingClientRect();
      return box.top < other.bottom + 4 && box.bottom > other.top && box.left < other.right && box.right > other.left;
    });
    root.setAttribute("data-overflow", top < frameBox.height * 0.48 + 7.5 || crowded ? "true" : "false");
  }

  /** Words spoken once for a panel that opens on this revision. */
  function panelWords(next, previousMode) {
    if (next.mode === "DECISION" && previousMode !== "DECISION") return messages.ui.decision;
    if (next.mode === "CAMP" && next.camp !== null) return [messages.camp.board, next.camp.timer.text].filter((part) => part !== "").join(" · ");
    if (next.mode === "MICRO" && previousMode !== "MICRO" && next.micro !== null) return `${next.micro.hint} · ${next.micro.instructions}`;
    if (next.mode === "POUCH_SWAP" && previousMode !== "POUCH_SWAP" && next.pouch !== null) return next.pouch.description;
    if (next.mode === "ENDING_RESONANCE" && previousMode !== "ENDING_RESONANCE") return messages.endings.group;
    if (END_MODES.has(next.mode) && previousMode !== next.mode) return next.mode === "COMPLETE" ? messages.title.complete : messages.title.boundary;
    return null;
  }

  function render(next) {
    if (disposed) return;
    const previousMode = lastMode;
    model = next;
    lastMode = next.mode;
    applySettings(next.settings);
    setAttributes(root, {
      "data-mode": next.mode, "data-pending": next.pending ?? null, "data-persistence": next.persistence,
      "data-clash": next.clash === null ? null : next.clash.beat, "data-micro": next.mode === "MICRO" && next.micro !== null ? next.micro.kind : null,
    });
    hud.update(next.hud);
    // A micro-action leaves the HUD dim and only the settings open (UX §5).
    setAttributes(hud.controls.pouch, { "aria-disabled": next.mode === "MICRO" ? "true" : null, tabindex: next.mode === "MICRO" ? "-1" : null });
    stage.update(next.scene);
    // The clash's light around the frog (UX §3.6: rounds without a wall show a warm radius).
    const hero = next.scene.actors.find((actor) => actor.characterId === "char_jao_kob") ?? null;
    if (next.clash !== null) {
      root.style.setProperty("--light-level", String(next.clash.light / next.clash.max));
      root.style.setProperty("--hero-x", `${hero?.x ?? 50}%`);
    }
    const key = next.clash === null ? null : `${next.scene.nodeId}:${next.clash.round}`;
    if (key !== clashKey) {
      clashKey = key;
      selectedGroup = next.clash?.groups.some((group) => group.id === "family") ? "family" : null;
    }
    if (next.clash !== null && selectedGroup === null) selectedGroup = next.clash.groups.find((group) => group.id !== "basic")?.id ?? null;
    clashView.update(next.clash);
    campTimer.update(next.camp?.timer ?? null);
    micro.update(next.mode === "MICRO" ? next.micro : null);
    if (modal === "settings") settingsPanel.update(next.settings);
    if (modal === "pouch") pouchPanel.update(next.pouchPanel);
    setText(stageDescription, next.scene.description);

    const sceneChanged = next.scene.sceneKey !== lastScene;
    lastScene = next.scene.sceneKey;
    if (sceneChanged && next.scene.title !== null) {
      sceneTitle.show({ act: [next.scene.actLabel, next.scene.actTitle].filter((part) => part !== null && part !== "").join(" · "), title: next.scene.title });
    } else if (PANEL_MODES.has(next.mode) || next.pending !== null || (next.clash !== null && next.clash.beat !== "intro")) {
      sceneTitle.hide();
    }

    const face = next.scene.actors.find((actor) => actor.speaking)?.image ?? null;
    dialogue.update(next.mode === "DECISION" || next.pending !== null ? null : next.line, { revision: next.revision, canAdvance: canAdvance(), face });
    drawPanels();
    toasts.push(next.toasts);

    const freshNotice = next.notice !== null && next.notice.id !== lastNotice;
    if (freshNotice) {
      setText(noticeText, next.notice.text);
      setAttributes(notice, { hidden: false, "data-notice": next.notice.id });
    }
    lastNotice = next.notice?.id ?? lastNotice;

    // Once per event: a new revision speaks its scene title, line, panel and toasts; a redraw of
    // the same revision (settings, a resize) speaks only a notice it has not spoken yet.
    const fresh = next.revision !== lastRevision;
    lastRevision = next.revision;
    const spoken = (fresh ? [
      sceneChanged && next.scene.title !== null ? next.scene.title : null,
      next.line === null ? null : next.line.announcement,
      panelWords(next, previousMode),
      next.clash?.beat === "intent" ? next.clash.intent.label : null,
      next.clash?.beat === "choose" ? next.clash.description : null,
      next.clash?.beat === "resolve" && next.clash.resolved?.answered ? messages.clash.answered : null,
      next.clash?.outcome ? next.clash.outcome.text : null,
      ...next.toasts.map((toast) => toast.text),
    ] : []).concat(freshNotice ? [next.notice.text] : []).filter((part) => part !== null && part !== "");
    if (spoken.length > 0) announce(spoken.join(" · "));
    measureFit();
    moveFocus(previousMode, fresh);
  }

  const isControl = (node) => node !== null && node !== undefined && INTERACTIVE.has(node.tagName);
  const isSpaceOrEnter = (event) => event.key === " " || event.key === "Enter";

  function onKeyDown(event) {
    if (model === null || modal !== null || event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
    const target = event.target;
    const inside = target === document.body || target === document.documentElement || root.contains?.(target) === true;
    if (!inside) return;
    const onControl = isControl(target);
    if (model.mode === "MICRO" && isSpaceOrEnter(event) && (!onControl || micro.owns(target))) {
      event.preventDefault();
      if (event.repeat !== true) micro.press();
      return;
    }
    if (isSpaceOrEnter(event) && !onControl) {
      if (canAdvance()) { event.preventDefault(); advance(); }
      return;
    }
    if (/^[1-9]$/.test(event.key) && DIGIT_MODES.has(model.mode)) {
      const digit = Number(event.key);
      if (picking) {
        const slot = model.camp?.picker?.slots[digit - 1];
        if (slot?.item) { event.preventDefault(); pickKeepsake(slot.item); }
        return;
      }
      const option = currentOptions()?.options.find((entry) => entry.shortcut === digit);
      if (option !== undefined) { event.preventDefault(); activate(option.key); }
      return;
    }
    if (event.key === "Escape") {
      if (picking) { event.preventDefault(); closePicker(true); return; }
      if (armed !== null) { event.preventDefault(); disarm(); }
      return;
    }
    if ((event.key === "i" || event.key === "I") && !TYPING.has(target?.tagName) && model.mode !== "MICRO") { event.preventDefault(); openModal("pouch"); }
  }

  /** A hold lets go when Space or Enter comes up; the key-up also keeps the button from clicking. */
  function onKeyUp(event) {
    if (model?.mode !== "MICRO" || modal !== null || !isSpaceOrEnter(event)) return;
    if (isControl(event.target) && !micro.owns(event.target)) return;
    event.preventDefault();
    micro.release();
  }

  function onStageClick(event) {
    if (modal !== null) return;
    const target = event.target;
    const away = [hudLayer, corner, dialogue.element, ...panels, campTop, notice, settingsModal.element, pouchModal.element];
    if (away.some((node) => node.contains?.(target))) return;
    advance();
  }

  let resizeQueued = false;
  function onResize() {
    if (resizeQueued || model === null) return;
    resizeQueued = true;
    const later = view?.requestAnimationFrame?.bind(view) ?? ((callback) => schedule(callback, 16));
    later(() => { resizeQueued = false; if (!disposed) { drawPanels(); measureFit(); } });
  }

  document.addEventListener("keydown", onKeyDown);
  document.addEventListener("keyup", onKeyUp);
  root.addEventListener("click", onStageClick);
  view?.addEventListener?.("resize", onResize);

  return Object.freeze({
    element: root,
    render,
    /** The pouch and settings controls of the HUD. */
    controls: hud.controls,
    /** The open modal (`settings`, `pouch`) or null. */
    modal: () => modal,
    /** Put focus on the way on (▽ or the first card) when the game screen appears, e.g. from the title. */
    focusEntry() {
      if (model !== null && modal === null) moveFocus(null, true, true);
    },
    /**
     * The game screen goes behind the title: every image it holds is let go, so the image budget
     * keeps only what is on screen, and the next render draws the scene again.
     */
    rest() {
      if (disposed) return;
      stage.clear();
      dialogue.clear();
      cards.forEach((card) => card.clear());
      tray.update(null, { selected: null, armed: null, layout: trayLayout() });
      campBoard.update(null, { armed: null, picking: false });
      pouchSheet.update(null, { armed: null });
      pouchPanel.clear();
    },
    dispose() {
      disposed = true;
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("keyup", onKeyUp);
      view?.removeEventListener?.("resize", onResize);
      stage.dispose();
      dialogue.dispose();
      cards.forEach((card) => card.dispose());
      tray.dispose();
      campBoard.dispose();
      pouchSheet.dispose();
      pouchPanel.dispose();
      micro.dispose();
      root.remove?.();
    },
  });
}
