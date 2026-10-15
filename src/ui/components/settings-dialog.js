import { createModalFrame } from "./modal-frame.js";
import { createToggleSwitch } from "./toggle-switch.js";

/** Native modal, fixed close corner and scrollable controls. Emits typed intents;
 * bootstrap validates/persists settings. ADR-P0-019 P4, FR-SET-003/004. */
export function createSettingsDialog({ document, viewModel, message, onIntent }) {
  const settings = viewModel.settings ?? {};
  const intent = (value) => onIntent(Object.freeze({ ...value, ...(viewModel.viewRevision === undefined ? {} : { viewRevision: viewModel.viewRevision }) }));
  const selectChoice = (id) => intent({ type: "SELECT_CHOICE", choiceId: id, ...(viewModel.viewRevision === undefined ? {} : { expectedRevision: viewModel.revision }) });
  const frame = createModalFrame({ document, name: "settings", title: message("settings.short"), description: message("settings.description"),
    closeLabel: message("settings.closeLabel"), onClose: () => selectChoice("application.close-settings") });
  frame.closeControl.setAttribute("data-choice-id", "application.close-settings");
  const { controls, createElement: element } = frame;
  const bySetting = new Map();
  const read = element("fieldset", { class: "jk-settings-group" });
  read.append(element("legend", {}, message("settings.reading")));
  addRange(read, "fontScale", "settings.fontScale", 1, 2, .25, 1);
  read.append(button(settings.fontScale > 1 ? "settings.normalText" : "settings.largerText", "application.toggle-font"));
  addToggle(read, "reducedMotion", "settings.reducedMotion", "application.toggle-motion");
  addToggle(read, "highContrast", "settings.highContrast");
  addToggle(read, "confirmHighImpactChoices", "settings.confirmChoices");
  frame.body.append(read);
  const audio = element("fieldset", { class: "jk-settings-group" });
  audio.append(element("legend", {}, message("settings.audio")), element("p", { class: "jk-settings-hint" }, message("settings.audioHint")));
  const audioStatus = element("p", { "data-jk-role": "audio-status" }); audio.append(audioStatus);
  const enableSound = element("button", { type: "button", class: "jk-secondary-button", "data-jk-action": "enable-sound", "data-choice-id": "application.enable-sound" });
  enableSound.addEventListener("click", () => selectChoice("application.enable-sound")); controls.push(enableSound); audio.append(enableSound);
  for (const setting of ["masterVolume", "musicVolume", "ambienceVolume", "effectsVolume"]) addRange(audio, setting, `settings.${setting}`, 0, 1, .05, setting === "masterVolume" ? 1 : 0);
  addToggle(audio, "reducedIntensityAudio", "settings.reducedIntensity");
  frame.body.append(audio, button("advisory.open", "application.advisory"));

  function button(labelKey, choiceId) {
    const node = element("button", { type: "button", class: "jk-secondary-button", "data-jk-role": "choice", "data-choice-id": choiceId }, message(labelKey));
    node.addEventListener("click", () => selectChoice(choiceId)); controls.push(node); return node;
  }
  function addRange(parent, setting, labelKey, min, max, step, fallback) {
    const row = element("label", { class: "jk-settings-field" }); row.append(element("span", {}, message(labelKey)));
    const control = element("input", { type: "range", min, max, step, "data-jk-setting": setting, "aria-label": message(labelKey) });
    control.value = String(settings[setting] ?? fallback);
    const output = element("output", { "aria-hidden": "true" });
    const update = () => {
      const percent = new Intl.NumberFormat(viewModel.locale ?? "th", { style: "percent", maximumFractionDigits: 0 }).format(Number(control.value));
      output.textContent = percent; control.setAttribute("aria-valuetext", percent);
    };
    update(); control.addEventListener("input", update);
    control.addEventListener("change", () => intent({ type: "SETTINGS_CHANGED", setting, value: Number(control.value) }));
    row.append(control, output); parent.append(row); controls.push(control); bySetting.set(setting, control);
  }
  function addToggle(parent, setting, labelKey, choiceId) {
    const control = createToggleSwitch({ document, label: message(labelKey), checked: settings[setting], message,
      attributes: { "data-jk-setting": setting, ...(choiceId ? { "data-choice-id": choiceId } : {}) },
      onChange: (value) => choiceId ? selectChoice(choiceId) : intent({ type: "SETTINGS_CHANGED", setting, value }) });
    parent.append(control); controls.push(control); bySetting.set(setting, control);
  }
  const updateStatus = (view) => {
    const text = typeof view.audioStatusText === "string" ? view.audioStatusText : "";
    if (audioStatus.textContent !== text) audioStatus.textContent = text;
    const label = view.soundControlLabel ?? message("settings.enableSound");
    if (enableSound.textContent !== label) enableSound.textContent = label;
    enableSound.setAttribute("data-audio-state", view.soundState ?? "blocked");
    enableSound.setAttribute("aria-pressed", String(view.audioEnabled ?? view.soundState === "ready"));
  };
  updateStatus(viewModel);
  return Object.freeze({ element: frame.element, scrollRegion: frame.body, controls: Object.freeze(controls), first: frame.closeControl, updateStatus,
    open(focusSetting, focusChoice) {
      frame.open(bySetting.get(focusSetting) ?? controls.find((control) => control.getAttribute("data-choice-id") === focusChoice) ?? frame.closeControl);
    }, close: frame.close,
  });
}
