import { createChromeIcon } from "./chrome-icons.js";

/** The close corner never belongs to the scrolling content. Native modality,
 * plus a keyboard trap for injected hosts without showModal. ADR-P0-018 D2. */
export function createModalFrame({ document, name, title, description, closeLabel, onClose }) {
  const element = (tag, attributes = {}, text) => {
    const node = document.createElement(tag);
    for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, String(value));
    if (typeof text === "string") node.textContent = text;
    return node;
  };
  const dialog = element("dialog", { class: `jk-settings-dialog jk-${name}-dialog`, "data-jk-role": `${name}-dialog`, "aria-labelledby": `jk-${name}-title`, "aria-describedby": `jk-${name}-description` });
  const header = element("header", { class: "jk-modal-header" });
  const heading = element("h2", { id: `jk-${name}-title` }, title);
  const closeControl = element("button", { type: "button", class: "jk-modal-close", "data-jk-role": "modal-close", "aria-label": closeLabel, title: closeLabel });
  closeControl.append(createChromeIcon(document, "close")); closeControl.addEventListener("click", onClose);
  header.append(heading, closeControl);
  const body = element("div", { class: "jk-modal-body", "data-jk-role": "modal-scroll" });
  body.append(element("p", { id: `jk-${name}-description` }, description)); dialog.append(header, body);
  const controls = [closeControl];
  dialog.addEventListener("cancel", (event) => { event.preventDefault?.(); onClose(); });
  dialog.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && typeof dialog.showModal !== "function") { event.preventDefault?.(); onClose(); }
    if (event.key !== "Tab") return;
    const eligible = controls.filter((control) => !control.disabled);
    const first = eligible[0], last = eligible.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault?.(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault?.(); first?.focus(); }
  });
  return { element: dialog, body, controls, closeControl, createElement: element,
    open(target = closeControl) {
      if (typeof dialog.showModal === "function") dialog.showModal();
      else { dialog.setAttribute("open", ""); dialog.setAttribute("role", "dialog"); dialog.setAttribute("aria-modal", "true"); }
      target?.focus();
    },
    close() { if (typeof dialog.close === "function") dialog.close(); else dialog.removeAttribute("open"); },
  };
}
