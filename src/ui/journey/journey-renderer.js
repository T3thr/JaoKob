/**
 * Journey renderer: draws a presentation model and turns the player's input into session
 * commands (ADR-P0-034 D9–D10, UX §1). It decides nothing about the story: which commands
 * are accepted, what a card costs, whether it is open and why not all arrive in the model.
 *
 *   - One screen, fixed zones: the HUD capsule on top, the stage behind, the face band empty,
 *     the dialogue card or the choice cards in the same lower dock (layout shift 0).
 *   - Input: ▽, a tap on the stage or the card, Space and Enter read on; 1–5 pick a card; a
 *     two-step choice arms first (inline, bound to the revision) when the player keeps
 *     `confirmHighImpactChoices` on; Escape disarms; I opens the pouch.
 *   - Silent save: nothing on screen or in the live region when a save works; a notice only
 *     when the application reports a failure (TC-S5-SILENT-001).
 *   - Each line, its scene title and its toasts are announced once through one polite live
 *     region; focus moves to the first open card when a choice opens and back to ▽ after.
 *   - Settings: reduced motion, Reduced Intensity, high contrast (solid surfaces) and the
 *     text size become attributes the styles read; OS preferences apply in CSS as well.
 *   - Fit or flow: the dock stays below the face band; when it cannot, the screen becomes one
 *     scrolling column with the stage as a top strip (no nested scroll, no sideways scroll).
 *
 * Modes whose panels arrive in C5 (`pending`) leave the dock empty; the host says so.
 * Trace: ADR-P0-034 D9/D10, UX §1.4–§1.10 · §2.1, Atomic 05 §3, TC-S5-VN-001, TC-S5-HUD-001,
 * TC-S5-SILENT-001, TC-S5-A11Y-001.
 */

import { createHudToasts } from "./components/hud-toasts.js";
import { createSaaDialogueCard } from "./components/saa-dialogue-card.js";
import { createSceneTitleCard } from "./components/scene-title-card.js";
import { createTactileActionCard } from "./components/tactile-action-card.js";
import { createTopHudCapsule } from "./components/top-hud-capsule.js";
import { createVnTachieStage } from "./components/vn-tachie-stage.js";
import { createIdSource, element, setAttributes, setText } from "./journey-dom.js";

const MAX_CARDS = 5;
const INTERACTIVE = new Set(["BUTTON", "A", "INPUT", "SELECT", "TEXTAREA", "SUMMARY"]);

/**
 * @param {{document: Document, root: Element, messages: object, loadImage: Function,
 *   onCommand: (kind: string, args: object) => void, onPouch?: () => void, onSettings?: () => void,
 *   schedule?: (callback: () => void, ms: number) => unknown, prefersReducedMotion?: () => boolean}} options
 */
export function createJourneyRenderer(options) {
  const { document, root: host, messages, loadImage, onCommand } = options;
  const onPouch = options.onPouch ?? (() => {});
  const onSettings = options.onSettings ?? (() => {});
  const schedule = options.schedule ?? ((callback, ms) => globalThis.setTimeout(callback, ms));
  const prefersReducedMotion = options.prefersReducedMotion ?? (() => globalThis.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true);
  const id = createIdSource("jk");

  const root = element(document, "div", "jk-journey", { "data-mode": "VN", "data-motion": "full", "data-surface": "glass", "data-intensity": "normal", "data-text": "normal", "data-overflow": "false" });
  const stage = createVnTachieStage({ document, loadImage, schedule });
  const hud = createTopHudCapsule({ document, messages, onPouch: () => onPouch(), onSettings: () => onSettings() });
  const toasts = createHudToasts({ document, schedule });
  const sceneTitle = createSceneTitleCard({ document, schedule });
  const dialogue = createSaaDialogueCard({ document, messages, loadImage, onAdvance: () => advance() });

  const hudLayer = element(document, "div", "jk-hud-layer");
  hudLayer.append(hud.element, toasts.element);
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
  dock.append(dialogue.element, choices, descriptions);

  const notice = element(document, "div", "jk-notice jk-paper", { role: "status", hidden: true });
  const noticeText = element(document, "p", "jk-notice__text");
  const noticeDismiss = element(document, "button", "jk-notice__dismiss", { type: "button" }, messages.ui.dismiss);
  notice.append(noticeText, noticeDismiss);
  noticeDismiss.addEventListener("click", () => setAttributes(notice, { hidden: true }));

  const stageDescription = element(document, "p", "jk-sr");
  const live = element(document, "p", "jk-sr", { "aria-live": "polite", "aria-atomic": "true" });
  root.append(stage.element, hudLayer, sceneTitle.element, dock, notice, stageDescription, live);
  host.append(root);

  let model = null, armed = null, armedRevision = null, lastScene = null, lastAnnounced = null, lastMode = null, lastNotice = null, lastRevision = null, disposed = false;

  const canAdvance = () => model !== null && model.line !== null && model.accepts.includes("advance");

  function advance() {
    if (!canAdvance()) return;
    onCommand("advance", { revision: model.revision });
  }

  function activate(key) {
    if (model?.decision === null || model?.decision === undefined || !model.accepts.includes("choose")) return;
    const option = model.decision.options.find((entry) => entry.key === key);
    if (option === undefined || !option.available) return;
    if (model.settings.confirmHighImpactChoices === true && !(armed === key && armedRevision === model.revision)) {
      armed = key;
      armedRevision = model.revision;
      drawChoices();
      announce(`${option.label} · ${messages.ui.armedHint}`);
      return;
    }
    armed = null;
    onCommand("choose", { option: key, revision: model.revision });
  }

  function disarm() {
    if (armed === null) return;
    armed = null;
    drawChoices();
  }

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

  function drawChoices() {
    const decision = model?.decision ?? null;
    const options = decision === null ? [] : decision.options.slice(0, MAX_CARDS);
    if (armed !== null && (armedRevision !== model?.revision || !options.some((option) => option.key === armed && option.available))) armed = null;
    setAttributes(choices, { hidden: options.length === 0, "data-count": options.length });
    cards.forEach((card, index) => {
      const option = options[index];
      setAttributes(card.element, { hidden: option === undefined });
      if (option === undefined) return;
      card.update(option, { armed: armed === option.key });
      setText(descriptionNodes[index], option.description);
    });
  }

  function focusInsideOrIdle() {
    const active = document.activeElement;
    return active === null || active === undefined || active === document.body || root.contains?.(active) === true;
  }

  function moveFocus(previousMode) {
    if (!focusInsideOrIdle()) return;
    if (model.mode === "DECISION" && previousMode !== "DECISION") {
      const index = model.decision.options.findIndex((option) => option.available);
      cards[Math.max(0, index)]?.element.focus?.({ preventScroll: true });
    } else if (previousMode === "DECISION" && model.mode !== "DECISION" && canAdvance()) {
      dialogue.nextButton.focus?.({ preventScroll: true });
    }
  }

  /**
   * Fit or flow: when the dock rises into the face band (long Thai at 150–200 %, a short
   * landscape phone, five cards on a small phone), the screen becomes one scrolling column
   * with the stage as a top strip (UX §1.6). Measured in the fit layout only, once per state
   * and on resize, so it cannot oscillate.
   */
  function measureFit() {
    if (typeof root.getBoundingClientRect !== "function") return;
    root.setAttribute("data-overflow", "false");
    const frame = root.getBoundingClientRect();
    const top = dock.getBoundingClientRect().top - frame.top;
    root.setAttribute("data-overflow", top < frame.height * 0.48 + 8 ? "true" : "false");
  }

  function render(next) {
    if (disposed) return;
    const previousMode = lastMode;
    model = next;
    lastMode = next.mode;
    applySettings(next.settings);
    setAttributes(root, { "data-mode": next.mode, "data-pending": next.pending ?? null, "data-persistence": next.persistence });
    hud.update(next.hud);
    stage.update(next.scene);
    setText(stageDescription, next.scene.description);

    const sceneChanged = next.scene.sceneKey !== lastScene;
    lastScene = next.scene.sceneKey;
    if (sceneChanged && next.scene.title !== null) {
      sceneTitle.show({ act: [next.scene.actLabel, next.scene.actTitle].filter((part) => part !== null && part !== "").join(" · "), title: next.scene.title });
    } else if (next.mode === "DECISION" || next.pending !== null) {
      sceneTitle.hide();
    }

    const face = next.scene.actors.find((actor) => actor.speaking)?.image ?? null;
    dialogue.update(next.mode === "DECISION" || next.pending !== null ? null : next.line, { revision: next.revision, canAdvance: canAdvance(), face });
    drawChoices();
    toasts.push(next.toasts);

    const freshNotice = next.notice !== null && next.notice.id !== lastNotice;
    if (freshNotice) {
      setText(noticeText, next.notice.text);
      setAttributes(notice, { hidden: false, "data-notice": next.notice.id });
    }
    lastNotice = next.notice?.id ?? lastNotice;

    // Once per event: a new revision speaks its scene title, line, choice and toasts; a redraw of
    // the same revision (settings, a resize) speaks only a notice it has not spoken yet.
    const fresh = next.revision !== lastRevision;
    lastRevision = next.revision;
    const spoken = (fresh ? [
      sceneChanged && next.scene.title !== null ? next.scene.title : null,
      next.line === null ? null : next.line.announcement,
      next.mode === "DECISION" && previousMode !== "DECISION" ? messages.ui.decision : null,
      ...next.toasts.map((toast) => toast.text),
    ] : []).concat(freshNotice ? [next.notice.text] : []).filter((part) => part !== null && part !== "");
    if (spoken.length > 0) announce(spoken.join(" · "));
    measureFit();
    moveFocus(previousMode);
  }

  function onKeyDown(event) {
    if (model === null || event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
    const target = event.target;
    const inside = target === document.body || target === document.documentElement || root.contains?.(target) === true;
    if (!inside) return;
    const onControl = target !== null && target !== undefined && INTERACTIVE.has(target.tagName);
    if ((event.key === " " || event.key === "Enter") && !onControl) {
      if (canAdvance()) { event.preventDefault(); advance(); }
      return;
    }
    if (/^[1-9]$/.test(event.key) && model.mode === "DECISION") {
      const option = model.decision.options.find((entry) => entry.shortcut === Number(event.key));
      if (option !== undefined) { event.preventDefault(); activate(option.key); }
      return;
    }
    if (event.key === "Escape" && armed !== null) { event.preventDefault(); disarm(); return; }
    if ((event.key === "i" || event.key === "I") && !onControl) { event.preventDefault(); onPouch(); }
  }

  function onStageClick(event) {
    const target = event.target;
    if (hudLayer.contains?.(target) || dock.contains?.(target) || notice.contains?.(target)) return;
    advance();
  }

  let resizeQueued = false;
  function onResize() {
    if (resizeQueued || model === null) return;
    resizeQueued = true;
    const frame = view?.requestAnimationFrame?.bind(view) ?? ((callback) => schedule(callback, 16));
    frame(() => { resizeQueued = false; if (!disposed) measureFit(); });
  }

  const view = document.defaultView ?? null;
  document.addEventListener("keydown", onKeyDown);
  root.addEventListener("click", onStageClick);
  view?.addEventListener?.("resize", onResize);

  return Object.freeze({
    element: root,
    render,
    /** The pouch and settings controls of the HUD, for focus return after their panels (C5). */
    controls: hud.controls,
    dispose() {
      disposed = true;
      document.removeEventListener("keydown", onKeyDown);
      view?.removeEventListener?.("resize", onResize);
      stage.dispose();
      dialogue.dispose();
      cards.forEach((card) => card.dispose());
      root.remove?.();
    },
  });
}
