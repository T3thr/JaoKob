/**
 * The settings of UX §1.9 inside the settings modal: text size 100–200 %, reduced motion,
 * Reduced Intensity, high contrast (solid surfaces), two-step confirmation, the แก้ทาง tag and
 * automatic micro-actions. Native radio buttons and checkboxes, so every control works with the
 * keyboard and has its name for assistive technology without extra ARIA; each switch carries a
 * one-line hint as its description.
 *
 * Each change sends one field (`onChange({field: value})`); the panel always shows what the
 * application stored, so a change that is refused springs back on the next update.
 * Trace: UX §1.9 · §1.6, ADR-P0-019, ADR-P0-034 D7 (settings in the save), TC-S5-A11Y-001.
 */

import { element } from "../journey-dom.js";

/** The text sizes offered (the save allows any value from 1 to 2). */
export const TEXT_SCALES = Object.freeze([1, 1.25, 1.5, 1.75, 2]);
const VIEW_OPTIONS = Object.freeze(["reducedMotion", "reducedIntensity", "highContrast"]);
const PLAY_OPTIONS = Object.freeze(["confirmHighImpactChoices", "counterTags", "autoMicro"]);

/**
 * @param {{document: Document, messages: object, idSource: (name: string) => string, onChange: (patch: object) => void}} options
 */
export function createSettingsPanel({ document, messages, idSource, onChange }) {
  const root = element(document, "div", "jk-settings-panel", { "data-component": "SettingsPanel" });

  const textSet = element(document, "fieldset", "jk-field");
  textSet.append(element(document, "legend", "jk-field__legend", {}, messages.settings.text));
  const scales = element(document, "div", "jk-field__scales");
  const group = idSource("text-scale");
  const radios = TEXT_SCALES.map((scale) => {
    const label = element(document, "label", "jk-scale");
    const input = element(document, "input", "jk-scale__input", { type: "radio", name: group, value: String(scale) });
    input.addEventListener("change", () => { if (input.checked === true) onChange({ fontScale: scale }); });
    label.append(input, element(document, "span", "jk-scale__text", {}, messages.settings.scale(Math.round(scale * 100))));
    scales.append(label);
    return { input, scale };
  });
  textSet.append(scales);

  const switches = new Map();
  const switchSet = (legend, fields) => {
    const set = element(document, "fieldset", "jk-field");
    set.append(element(document, "legend", "jk-field__legend", {}, legend));
    for (const field of fields) {
      const [title, hint] = messages.settings.options[field];
      const hintId = idSource(`setting-${field}`);
      const label = element(document, "label", "jk-switch");
      const input = element(document, "input", "jk-switch__input", { type: "checkbox", name: field, "aria-describedby": hintId });
      input.addEventListener("change", () => onChange({ [field]: input.checked === true }));
      const words = element(document, "span", "jk-switch__words");
      words.append(element(document, "span", "jk-switch__title", {}, title), element(document, "span", "jk-switch__hint", { id: hintId }, hint));
      label.append(input, words, element(document, "span", "jk-switch__track", { "aria-hidden": "true" }));
      set.append(label);
      switches.set(field, input);
    }
    return set;
  };
  root.append(textSet, switchSet(messages.settings.view, VIEW_OPTIONS), switchSet(messages.settings.play, PLAY_OPTIONS));

  return Object.freeze({
    element: root,
    /** The control focus lands on when the modal opens: the chosen text size. */
    first: () => radios.find(({ input }) => input.checked === true)?.input ?? radios[0].input,
    /** The input of one field, for tests and focus. */
    input: (field) => (field === "fontScale" ? radios.map(({ input }) => input) : switches.get(field) ?? null),
    /** @param {object} settings The journey settings the application holds now. */
    update(settings) {
      const scale = settings.fontScale ?? 1;
      const nearest = TEXT_SCALES.reduce((best, value) => (Math.abs(value - scale) < Math.abs(best - scale) ? value : best), TEXT_SCALES[0]);
      for (const { input, scale: value } of radios) input.checked = value === nearest;
      for (const [field, input] of switches) input.checked = settings[field] === true;
    },
  });
}
