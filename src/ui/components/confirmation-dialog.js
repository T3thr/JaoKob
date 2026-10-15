import { createModalFrame } from "./modal-frame.js";

/** ADR-P0-019: destructive/high-impact consent belongs in the modal layer. */
export function createConfirmationDialog({ document, viewModel, message, onIntent }) {
  const choices = viewModel.choices.filter(({ id }) => !["application.enable-sound", "application.retry-media"].includes(id));
  const cancel = choices.find(({ id }) => id.startsWith("application.cancel-"));
  const frame = createModalFrame({ document, name: "confirmation", title: viewModel.scene.title,
    description: viewModel.scene.dialogue, closeLabel: message("confirmation.close"),
    onClose: () => onIntent({ type: "SELECT_CHOICE", choiceId: cancel.id }) });
  const actions = frame.createElement("div", { class: "jk-confirmation-actions" });
  for (const choice of choices) {
    const button = frame.createElement("button", { type: "button", class: "jk-secondary-button", "data-choice-id": choice.id, "aria-describedby": "jk-confirmation-description" }, choice.label);
    button.addEventListener("click", () => onIntent({ type: "SELECT_CHOICE", choiceId: choice.id }));
    actions.append(button); frame.controls.push(button);
  }
  frame.body.append(actions);
  return Object.freeze({ element: frame.element, scrollRegion: frame.body, controls: frame.controls,
    open() { frame.open(frame.controls[1]); }, close: frame.close, updateStatus() {} });
}
