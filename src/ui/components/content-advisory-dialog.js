import { createModalFrame } from "./modal-frame.js";
import { createToggleSwitch } from "./toggle-switch.js";

/** Read-only advisory; the only writable fact is an application preference.
 * Trace: ADR-P0-019 P3, FR-UI-007, FR-ACC-001/002, FR-LOC-001. */
export function createContentAdvisoryDialog({ document, viewModel, message, onIntent }) {
  const frame = createModalFrame({ document, name: "advisory", title: message("advisory.title"),
    description: viewModel.contentAdvisory.text, closeLabel: message("advisory.close"),
    onClose: () => onIntent({ type: "SELECT_CHOICE", choiceId: "application.close-advisory" }) });
  frame.closeControl.setAttribute("data-choice-id", "application.close-advisory");
  frame.body.replaceChildren(frame.createElement("h3", { class: "jk-advisory-title" }, viewModel.contentAdvisory.title), ...frame.body.children);
  const toggle = createToggleSwitch({ document, label: message("advisory.hide"), checked: viewModel.preferences?.hideContentAdvisory,
    message, attributes: { "data-jk-preference": "hideContentAdvisory" },
    onChange: (value) => onIntent({ type: "PREFERENCE_CHANGED", preference: "hideContentAdvisory", value }) });
  const status = frame.createElement("p", { class: "jk-settings-hint", role: "status", "data-jk-role": "preference-status" });
  const acknowledge = frame.createElement("button", { type: "button", class: "jk-secondary-button", "data-choice-id": "application.close-advisory" }, message("advisory.acknowledge"));
  acknowledge.addEventListener("click", () => onIntent({ type: "SELECT_CHOICE", choiceId: "application.close-advisory" }));
  frame.body.append(toggle, frame.createElement("p", { class: "jk-settings-hint" }, message("advisory.reopen")), status, acknowledge);
  frame.controls.push(toggle, acknowledge);
  return Object.freeze({ element: frame.element, scrollRegion: frame.body, controls: frame.controls, first: frame.closeControl,
    open(focusSetting) { frame.open(focusSetting === "hideContentAdvisory" ? toggle : frame.closeControl); }, close: frame.close,
    updateStatus(view) { status.textContent = view.preferenceStatusText ?? ""; },
  });
}
