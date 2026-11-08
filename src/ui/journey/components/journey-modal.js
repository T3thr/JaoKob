/**
 * `<JourneyModal />`: the one modal frame of the Journey screens, for the settings and the pouch
 * (UX §1.6 · §1.7 MODAL, WCAG 2.2 SC 2.1.2 · 2.4.3 · 2.4.11 · 2.4.7).
 *
 *   - A native `<dialog>` shown with `showModal()`: the browser puts it in the top layer and makes
 *     everything behind it inert, so focus cannot reach the game. Hosts without `showModal` (the
 *     unit-test DOM) get `role="dialog"`, `aria-modal` and the same Tab trap.
 *   - Heading, a close button that never scrolls away, and a body that scrolls on its own only
 *     when the text is too long for the screen (the game behind never scrolls).
 *   - Escape closes; Tab and Shift+Tab stay inside; on close, focus returns to the control that
 *     opened it (or to the one the host names).
 *   - The game waits while a modal is open: the renderer sends no command (play-mode MODALS).
 *
 * Trace: UX §1.6 · §1.7, ADR-P0-019 P4, ADR-P0-034 D9.1, TC-S5-A11Y-001.
 */

import { element, setAttributes } from "../journey-dom.js";
import { createIcon } from "../journey-icons.js";

const FOCUSABLE = new Set(["BUTTON", "INPUT", "SELECT", "TEXTAREA", "A"]);

/**
 * @param {{document: Document, name: string, title: string, closeLabel: string, idSource: (name: string) => string,
 *   onClose: () => void}} options `onClose` is asked to close (Escape, the close button, a native cancel).
 */
export function createJourneyModal({ document, name, title, closeLabel, idSource, onClose }) {
  const headingId = idSource(`${name}-title`);
  const dialog = element(document, "dialog", `jk-modal jk-paper`, { "aria-labelledby": headingId, "data-component": "JourneyModal", "data-modal": name });
  const header = element(document, "header", "jk-modal__header");
  const heading = element(document, "h2", "jk-modal__title", { id: headingId }, title);
  const close = element(document, "button", "jk-modal__close", { type: "button", "aria-label": closeLabel, "data-action": "close" });
  close.append(createIcon(document, "close", "jk-modal__close-icon"));
  close.addEventListener("click", () => onClose());
  header.append(heading, close);
  const body = element(document, "div", "jk-modal__body");
  dialog.append(header, body);

  let open = false, returnTo = null;
  const native = () => typeof dialog.showModal === "function";

  /** Controls that can take focus now, in document order. */
  function focusables() {
    const found = [];
    const walk = (node) => {
      if (node.hidden === true) return;
      if (FOCUSABLE.has(node.tagName) && !node.disabled && node.getAttribute?.("tabindex") !== "-1") found.push(node);
      for (const child of node.children ?? []) walk(child);
    };
    walk(dialog);
    return found;
  }

  dialog.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
      return;
    }
    if (event.key !== "Tab") return;
    const controls = focusables();
    if (controls.length === 0) return;
    const first = controls[0], last = controls.at(-1);
    const active = document.activeElement;
    if (!controls.includes(active)) { event.preventDefault(); (event.shiftKey ? last : first).focus?.(); }
    else if (event.shiftKey && active === first) { event.preventDefault(); last.focus?.(); }
    else if (!event.shiftKey && active === last) { event.preventDefault(); first.focus?.(); }
  });
  // The browser's own Escape on a native modal dialog.
  dialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    onClose();
  });

  return Object.freeze({
    element: dialog,
    body,
    closeButton: close,
    isOpen: () => open,
    /**
     * Open and move focus into the dialog.
     * @param {{returnTo?: Element|null, focus?: Element|null}} [options]
     */
    show({ returnTo: from = null, focus = null } = {}) {
      if (open) return;
      open = true;
      returnTo = from ?? document.activeElement ?? null;
      if (native()) dialog.showModal();
      else setAttributes(dialog, { open: true, role: "dialog", "aria-modal": "true" });
      (focus ?? focusables()[0] ?? close).focus?.({ preventScroll: true });
    },
    /** Close and give focus back. */
    hide() {
      if (!open) return;
      open = false;
      if (native() && dialog.open) dialog.close();
      else setAttributes(dialog, { open: null, role: null, "aria-modal": null });
      returnTo?.focus?.({ preventScroll: true });
      returnTo = null;
    },
  });
}
