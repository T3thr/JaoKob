import test from "node:test";
import assert from "node:assert/strict";
import { createSettingsDialog } from "../../src/ui/components/settings-dialog.js";
import { TH_SYSTEM_MESSAGES } from "../../src/ui/localization/th-system-messages.js";
import { FakeDocument, findByAttribute } from "../helpers/application-harness.js";
function harness() {
  const document = new FakeDocument(), intents = [];
  const viewModel = Object.freeze({ locale: "th", viewRevision: 7, revision: 3, settings: Object.freeze({ fontScale: 2, masterVolume: 0, musicVolume: .4, reducedMotion: true, highContrast: false }) });
  const dialog = createSettingsDialog({ document, viewModel, message: (key) => TH_SYSTEM_MESSAGES[key], onIntent: (intent) => intents.push(intent) });
  return { document, dialog, intents, viewModel };
}
test("FR-SET-004 settings keeps saved zero and dispatches volume values with current view revision", () => {
  const h = harness(), input = findByAttribute(h.dialog.element, "data-jk-setting", "masterVolume");
  assert.equal(input.value, "0"); assert.equal(input.getAttribute("aria-valuetext"), "0%");
  input.value = ".35"; input.dispatchEvent({ type: "input" }); input.dispatchEvent({ type: "change" });
  assert.equal(input.getAttribute("aria-valuetext"), "35%");
  assert.deepEqual(h.intents, [{ type: "SETTINGS_CHANGED", setting: "masterVolume", value: .35, viewRevision: 7 }]);
  assert.equal(h.viewModel.settings.masterVolume, 0);
});
test("FR-ACC-003 settings exposes 200% text, high contrast and reduced intensity independently", () => {
  const h = harness(), font = findByAttribute(h.dialog.element, "data-jk-setting", "fontScale");
  assert.equal(font.getAttribute("max"), "2"); assert.equal(font.value, "2");
  for (const setting of ["highContrast", "reducedIntensityAudio"]) {
    const input = findByAttribute(h.dialog.element, "data-jk-setting", setting);
    input.checked = true; input.dispatchEvent({ type: "change" });
  }
  assert.deepEqual(h.intents.map(({ setting, value }) => [setting, value]), [["highContrast", true], ["reducedIntensityAudio", true]]);
});
test("FR-ACC-001 settings modal cycles focus, restores active field and routes Escape to close intent", () => {
  const h = harness(); h.dialog.open("musicVolume");
  assert.equal(h.dialog.element.getAttribute("aria-modal"), "true");
  assert.equal(h.document.activeElement.getAttribute("data-jk-setting"), "musicVolume");
  const first = h.dialog.controls[0], last = h.dialog.controls.at(-1);
  first.focus(); h.dialog.element.dispatchEvent({ type: "keydown", key: "Tab", shiftKey: true }); assert.equal(h.document.activeElement, last);
  last.focus(); h.dialog.element.dispatchEvent({ type: "keydown", key: "Tab", shiftKey: false }); assert.equal(h.document.activeElement, first);
  h.dialog.element.dispatchEvent({ type: "keydown", key: "Escape" });
  assert.deepEqual(h.intents, [{ type: "SELECT_CHOICE", choiceId: "application.close-settings", expectedRevision: 3, viewRevision: 7 }]);
  h.dialog.close(); assert.equal(h.dialog.element.hasAttribute("open"), false);
});
