/**
 * `<JourneyTitle />`: the title of the Journey (ADR-P0-034 D7–D8, SSOT §3.2). The package's name
 * over its opening plate, on frosted glass:
 *
 *   - เล่นต่อ continues the stored journey and never writes until the next command;
 *   - เริ่มการเดินทาง starts at once on an empty device, and asks first, inline, when any record
 *     is stored (the application binds the consent to the title the player saw);
 *   - เล่นโดยไม่บันทึก appears when the stored record is protected or broken, and plays in memory
 *     without touching it;
 *   - one-time notices (the legacy archive, storage, protected or recovered saves) each with
 *     รับทราบ; settings can be changed before starting.
 *
 * It holds no rule: what is offered arrives in the model; the consent token stays in the shell.
 * Trace: ADR-P0-034 D7/D8, SSOT §3.2, UX §1.9, TC-S5-SAVE-001, TC-S5-LEGACY-001, TC-S5-A11Y-001.
 */

import { element, setAttributes, setText } from "../journey-dom.js";
import { createIcon } from "../journey-icons.js";
import { createJourneyModal } from "./journey-modal.js";
import { createSettingsPanel } from "./settings-panel.js";

/**
 * @param {{document: Document, messages: object, loadImage: Function, idSource: (name: string) => string,
 *   onContinue: () => void, onStart: (args: {consent: boolean}) => void, onMemory: () => void,
 *   onAcknowledge: (id: string) => void, onChangeSettings: (patch: object) => void}} options
 */
export function createJourneyTitle({ document, messages, loadImage, idSource, onContinue, onStart, onMemory, onAcknowledge, onChangeSettings }) {
  const root = element(document, "section", "jk-journey jk-title", { "data-component": "JourneyTitle", "data-mode": "TITLE", hidden: true });
  const plate = element(document, "img", "jk-title__plate", { alt: "", draggable: "false", decoding: "async", "data-shown": "false" });
  const shade = element(document, "div", "jk-title__shade", { "aria-hidden": "true" });
  const panel = element(document, "div", "jk-title__panel jk-glass");
  const headingId = idSource("title");
  const name = element(document, "h1", "jk-title__name", { id: headingId });
  const subtitle = element(document, "p", "jk-title__subtitle");
  setAttributes(root, { "aria-labelledby": headingId });
  const notices = element(document, "ul", "jk-title__notices");
  const actions = element(document, "div", "jk-title__actions");

  const resume = element(document, "button", "jk-title__button jk-title__button--primary", { type: "button", "data-action": "continue", hidden: true });
  const resumeLabel = element(document, "span", "jk-title__button-label");
  const resumeDetail = element(document, "span", "jk-title__button-detail");
  resume.append(resumeLabel, resumeDetail);
  resume.addEventListener("click", () => onContinue());
  const start = element(document, "button", "jk-title__button", { type: "button", "data-action": "start" });
  start.addEventListener("click", () => {
    if (model?.start.needsConsent === true) { setAttributes(consent, { hidden: false }); confirm.focus?.({ preventScroll: true }); return; }
    onStart({ consent: false });
  });
  const memory = element(document, "button", "jk-title__button jk-title__button--quiet", { type: "button", "data-action": "memory", hidden: true }, messages.title.memory);
  memory.addEventListener("click", () => onMemory());
  const settingsButton = element(document, "button", "jk-title__button jk-title__button--quiet", { type: "button", "data-action": "settings" });
  settingsButton.append(createIcon(document, "gear", "jk-title__gear"), element(document, "span", "", {}, messages.title.settings));
  actions.append(resume, start, memory, settingsButton);

  const consentId = idSource("consent");
  const consent = element(document, "div", "jk-title__consent jk-paper", { role: "group", "aria-labelledby": consentId, hidden: true });
  const consentText = element(document, "p", "jk-title__consent-text", { id: consentId }, messages.title.consent);
  const confirm = element(document, "button", "jk-title__button jk-title__button--warn", { type: "button", "data-action": "confirm-start" }, messages.title.consentYes);
  const cancel = element(document, "button", "jk-title__button jk-title__button--quiet", { type: "button", "data-action": "cancel-start" }, messages.title.consentNo);
  confirm.addEventListener("click", () => onStart({ consent: true }));
  cancel.addEventListener("click", () => { setAttributes(consent, { hidden: true }); start.focus?.({ preventScroll: true }); });
  consent.append(consentText, confirm, cancel);

  panel.append(name, subtitle, notices, actions, consent);
  const settingsPanel = createSettingsPanel({ document, messages, idSource, onChange: (patch) => onChangeSettings(patch) });
  const settingsModal = createJourneyModal({ document, name: "settings", title: messages.settings.title, closeLabel: messages.settings.close, idSource, onClose: () => settingsModal.hide() });
  settingsModal.body.append(settingsPanel.element);
  settingsButton.addEventListener("click", () => {
    if (model !== null) settingsPanel.update(model.settings);
    settingsModal.show({ returnTo: settingsButton, focus: settingsPanel.first() });
  });
  root.append(plate, shade, panel, settingsModal.element);

  let model = null, plateKey = null, plateGeneration = 0, plateLease = null, focused = false;

  async function showPlate(image) {
    const key = image?.key ?? null;
    if (key === plateKey) return;
    plateKey = key;
    const generation = ++plateGeneration;
    plate.setAttribute("data-shown", "false");
    if (key === null) { plateLease?.release(); plateLease = null; return; }
    let lease = null;
    try { lease = await loadImage(image); } catch { lease = null; }
    if (generation !== plateGeneration) { lease?.release(); return; }
    plateLease?.release();
    plateLease = lease;
    if (lease === null) return;
    plate.setAttribute("src", lease.url);
    plate.setAttribute("data-shown", "true");
  }

  return Object.freeze({
    element: root,
    /** The settings modal of the title (for tests and the host's focus return). */
    settings: Object.freeze({ modal: settingsModal, panel: settingsPanel }),
    /** @param {object|null} next A title model of the presentation, or null while playing. */
    update(next) {
      setAttributes(root, { hidden: next === null });
      if (next === null) {
        model = null;
        focused = false;
        settingsModal.hide();
        void showPlate(null);
        return;
      }
      const first = model === null;
      model = next;
      setText(name, next.name);
      setText(subtitle, next.subtitle);
      void showPlate(next.background);
      notices.replaceChildren(...[...next.notices, ...(next.notice === null || next.notices.some((entry) => entry.id === next.notice.id) ? [] : [next.notice])].map((notice) => {
        const item = element(document, "li", "jk-title__notice jk-paper", { "data-notice": notice.id });
        const ok = element(document, "button", "jk-title__notice-ok", { type: "button" }, messages.title.acknowledge);
        ok.addEventListener("click", () => onAcknowledge(notice.id));
        item.append(element(document, "span", "jk-title__notice-text", {}, notice.text), ok);
        return item;
      }));
      setAttributes(resume, { hidden: next.continue === null });
      if (next.continue !== null) {
        setText(resumeLabel, next.continue.label);
        setText(resumeDetail, next.continue.note === null ? next.continue.detail : `${next.continue.detail} · ${next.continue.note}`);
      }
      setText(start, next.start.label);
      setAttributes(start, { class: next.continue === null ? "jk-title__button jk-title__button--primary" : "jk-title__button" });
      setAttributes(memory, { hidden: !next.offerMemory });
      if (!next.start.needsConsent) setAttributes(consent, { hidden: true });
      if (settingsModal.isOpen()) settingsPanel.update(next.settings);
      root.style.setProperty("--jk-font-scale", String(next.settings.fontScale ?? 1));
      setAttributes(root, { "data-contrast": next.settings.highContrast ? "high" : "normal", "data-surface": next.settings.highContrast ? "solid" : "glass", "data-motion": next.settings.reducedMotion ? "reduced" : "full" });
      if (first || !focused) {
        focused = true;
        (next.continue !== null ? resume : start).focus?.({ preventScroll: true });
      }
    },
    dispose() {
      plateGeneration += 1;
      plateLease?.release();
    },
  });
}
