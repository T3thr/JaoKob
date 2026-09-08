/**
 * Native modal settings, with a focus trap for hosts without showModal.
 * Input emits typed intent only; bootstrap validates and persists values.
 * Trace: FR-SET-003/004, FR-ACC-001/003/004, FR-LOC-001, CR-0003 D2.
 */
export function createSettingsDialog({ document, viewModel, message, onIntent }) {
  const settings = viewModel.settings ?? {};
  const dialog = element("dialog", { class: "jk-settings-dialog", "data-jk-role": "settings-dialog", "aria-labelledby": "jk-settings-title", "aria-describedby": "jk-settings-description" });
  dialog.append(element("h2", { id: "jk-settings-title" }, message("settings.title")), element("p", { id: "jk-settings-description" }, message("settings.description")));
  const controls = [];
  const bySetting = new Map();
  const intent = (value) => onIntent(Object.freeze({ ...value, ...(viewModel.viewRevision === undefined ? {} : { viewRevision: viewModel.viewRevision }) }));
  const selectChoice = (id) => intent({ type: "SELECT_CHOICE", choiceId: id, ...(viewModel.viewRevision === undefined ? {} : { expectedRevision: viewModel.revision }) });
  const read = element("fieldset", { class: "jk-settings-group" });
  read.append(element("legend", {}, message("settings.reading")));
  addRange(read, "fontScale", "settings.fontScale", 1, 2, .25, 1);
  const quickFont = button(settings.fontScale > 1 ? "settings.normalText" : "settings.largerText", "application.toggle-font");
  read.append(quickFont);
  const motion = button("settings.reducedMotion", "application.toggle-motion");
  motion.setAttribute("aria-pressed", String(settings.reducedMotion === true)); read.append(motion);
  addToggle(read, "highContrast", "settings.highContrast");
  addToggle(read, "confirmHighImpactChoices", "settings.confirmChoices");
  dialog.append(read);
  const audio = element("fieldset", { class: "jk-settings-group" });
  audio.append(element("legend", {}, message("settings.audio")));
  audio.append(element("p", { class: "jk-settings-hint" }, message("settings.audioHint")));
  for (const setting of ["masterVolume", "musicVolume", "ambienceVolume", "effectsVolume"]) addRange(audio, setting, `settings.${setting}`, 0, 1, .05, setting === "masterVolume" ? 1 : 0);
  addToggle(audio, "reducedIntensityAudio", "settings.reducedIntensity");
  if (typeof viewModel.audioStatusText === "string") audio.append(element("p", { "data-jk-role": "audio-status" }, viewModel.audioStatusText));
  const enableSound = element("button", { type: "button", class: "jk-secondary-button", "data-jk-action": "enable-sound" }, message("settings.enableSound"));
  enableSound.addEventListener("click", () => selectChoice("application.enable-sound")); controls.push(enableSound); audio.append(enableSound);
  dialog.append(audio);
  const close = button("settings.close", "application.close-settings"); close.setAttribute("class", "jk-secondary-button jk-settings-close"); dialog.append(close);
  dialog.addEventListener("cancel", (event) => { event.preventDefault?.(); selectChoice("application.close-settings"); });
  dialog.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && typeof dialog.showModal !== "function") { event.preventDefault?.(); selectChoice("application.close-settings"); }
    if (event.key !== "Tab") return;
    const eligible = controls.filter((control) => !control.disabled);
    const first = eligible[0], last = eligible.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault?.(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault?.(); first?.focus(); }
  });

  function element(tag, attributes = {}, text) {
    const node = document.createElement(tag);
    for (const [name, value] of Object.entries(attributes)) node.setAttribute(name, String(value));
    if (typeof text === "string") node.textContent = text;
    return node;
  }
  function button(labelKey, choiceId) {
    const node = element("button", { type: "button", class: "jk-secondary-button", "data-jk-role": "choice", "data-choice-id": choiceId }, message(labelKey));
    node.addEventListener("click", () => selectChoice(choiceId)); controls.push(node); return node;
  }
  function addRange(parent, setting, labelKey, min, max, step, fallback) {
    const row = element("label", { class: "jk-settings-field" });
    row.append(element("span", {}, message(labelKey)));
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
  function addToggle(parent, setting, labelKey) {
    const row = element("label", { class: "jk-settings-toggle" });
    const control = element("input", { type: "checkbox", "data-jk-setting": setting });
    control.checked = settings[setting] === true;
    control.addEventListener("change", () => intent({ type: "SETTINGS_CHANGED", setting, value: control.checked }));
    row.append(control, element("span", {}, message(labelKey))); parent.append(row); controls.push(control); bySetting.set(setting, control);
  }
  return Object.freeze({ element: dialog, controls: Object.freeze(controls), first: controls[0],
    open(focusSetting, focusChoice) {
      if (typeof dialog.showModal === "function") dialog.showModal();
      else { dialog.setAttribute("open", ""); dialog.setAttribute("role", "dialog"); dialog.setAttribute("aria-modal", "true"); }
      (bySetting.get(focusSetting) ?? controls.find((control) => control.getAttribute("data-choice-id") === focusChoice) ?? controls[0])?.focus();
    },
    close() { if (typeof dialog.close === "function") dialog.close(); else dialog.removeAttribute("open"); },
  });
}
