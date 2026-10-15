/** Native button keyboard behavior, explicit switch state and localized labels.
 * Trace: ADR-P0-018 D2/D4, FR-ACC-001/002. No persistence or domain state. */
export function createToggleSwitch({ document, label, checked, message, attributes = {}, onChange }) {
  const control = document.createElement("button");
  for (const [name, value] of Object.entries({ type: "button", class: "jk-settings-toggle", role: "switch", "aria-label": label, ...attributes })) control.setAttribute(name, value);
  const copy = document.createElement("span"); copy.setAttribute("class", "jk-switch-label"); copy.textContent = label;
  const state = document.createElement("span"); state.setAttribute("class", "jk-switch-state"); state.setAttribute("aria-hidden", "true");
  const track = document.createElement("span"); track.setAttribute("class", "jk-switch-track"); track.setAttribute("aria-hidden", "true");
  const thumb = document.createElement("span"); thumb.setAttribute("class", "jk-switch-thumb"); track.append(thumb);
  let value = checked === true;
  const update = () => {
    control.setAttribute("aria-checked", String(value));
    state.textContent = message(value ? "switch.on" : "switch.off");
  };
  update(); control.append(copy, state, track);
  control.addEventListener("click", () => { if (!control.disabled) { value = !value; update(); onChange(value); } });
  return control;
}
