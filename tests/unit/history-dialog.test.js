import test from "node:test";
import assert from "node:assert/strict";
import { createHistoryDialog } from "../../src/ui/components/history-dialog.js";
import { createDomRenderer } from "../../src/ui/renderers/dom/dom-renderer.js";
import { projectSessionHistory } from "../../src/data/content/history-projection.js";
import { TH_SYSTEM_MESSAGES as messages } from "../../src/ui/localization/th-system-messages.js";
import { FakeDocument, findByAttribute as find, findAllByAttribute as all } from "../helpers/application-harness.js";

const entry = (sequence, kind = "dialogue") => ({ entryId: `session:${sequence}`, sequence, kind, locale: "th", contextStart: true,
  sceneLabel: "ใต้ใบบัว", speakerLabel: "แม่กบ", voiceLabel: "บทสนทนา", kindLabel: "คุณเลือก", text: "<script>น้ำไหว</script>" });
function harness(entries = []) {
  const document = new FakeDocument(), intents = [], viewModel = { history: { ...projectSessionHistory(null), entries } };
  const dialog = createHistoryDialog({ document, viewModel, message: key => messages[key], onIntent: i => intents.push(i) });
  return { document, dialog, intents, viewModel };
}
test("TC-S4-LOG-002 empty archive uses safe localized prose and initial short heading focus", () => {
  const h = harness(); h.dialog.open();
  assert.equal(h.dialog.element.tagName, "DIALOG"); assert.equal(h.dialog.element.getAttribute("aria-modal"), "true");
  assert.equal(h.document.activeElement.getAttribute("id"), "jk-history-title"); assert.equal(h.document.activeElement.getAttribute("tabindex"), "-1");
  assert.equal(all(h.dialog.element, "data-jk-role", "history-empty").length, 1); assert.match(h.dialog.element.textContent, /เมื่อคุณเริ่มอ่าน/);
  assert.equal(h.dialog.controls.length, 1); assert.equal(h.intents.length, 0);
  assert.equal(h.dialog.controls[0].children[0].tagName, "SVG"); assert.notEqual(h.dialog.controls[0].parentNode, h.dialog.scrollRegion);
});
test("TC-S4-LOG-002 archive preserves exact text/order/lang without interactive or live transcript lines", () => {
  const h = harness([entry(1), entry(2, "choice")]), before = JSON.stringify(h.viewModel); h.dialog.open();
  const rows = all(h.dialog.element, "lang", "th");
  assert.equal(rows.length, 2); assert.equal(rows[0].getAttribute("data-history-entry"), "session:1");
  assert.match(rows[0].textContent, /<script>น้ำไหว<\/script>/); assert.match(rows[1].textContent, /คุณเลือก/);
  assert.equal(rows.every(row => !row.hasAttribute("tabindex") && !row.hasAttribute("aria-live")), true);
  assert.equal(JSON.stringify(h.viewModel), before); assert.equal(h.intents.length, 0);
});
test("TC-S4-LOG-002 heading/close Tab and Shift+Tab trap, Escape/cross view intents", () => {
  const h = harness([entry(1)]); h.dialog.open();
  const close = h.dialog.controls[0];
  h.dialog.element.dispatchEvent({ type: "keydown", key: "Tab", shiftKey: true }); assert.equal(h.document.activeElement, close);
  for (const shiftKey of [true, false]) { h.dialog.element.dispatchEvent({ type: "keydown", key: "Tab", shiftKey }); assert.equal(h.document.activeElement, close); }
  h.dialog.setBusy(true); assert.equal(close.disabled, true); h.dialog.setBusy(false); assert.equal(close.disabled, false);
  close.dispatchEvent({ type: "click" }); h.dialog.element.dispatchEvent({ type: "keydown", key: "Escape" }); h.dialog.element.dispatchEvent({ type: "cancel" });
  assert.deepEqual(h.intents, Array(3).fill({ type: "SELECT_CHOICE", choiceId: "application.close-history" }));
  h.dialog.close(); assert.equal(h.dialog.element.hasAttribute("open"), false);
});
test("TC-S4-LOG-002 newest scroll only on open; status/busy patches preserve user position", () => {
  const h = harness([entry(1)]); h.dialog.scrollRegion.scrollHeight = 1234; h.dialog.open();
  assert.equal(h.dialog.scrollRegion.scrollTop, 1234); h.dialog.scrollRegion.scrollTop = 56;
  h.dialog.updateStatus({ notice: { text: "บันทึกแล้ว" } }); h.dialog.setBusy(true); h.dialog.setBusy(false);
  assert.equal(h.dialog.scrollRegion.scrollTop, 56); h.dialog.close(); h.dialog.open(); assert.equal(h.dialog.scrollRegion.scrollTop, 1234);
});
test("TC-S4-LOG-002 late font readiness preserves explicit user scroll", async () => {
  let ready; const document = new FakeDocument(); document.fonts = { ready: new Promise(resolve => { ready = resolve; }) };
  const dialog = createHistoryDialog({ document, viewModel: { history: projectSessionHistory(null) }, message: key => messages[key], onIntent() {} });
  dialog.scrollRegion.scrollHeight = 100; dialog.open(); dialog.scrollRegion.dispatchEvent({ type: "wheel" }); dialog.scrollRegion.scrollTop = 17;
  ready(); await Promise.resolve(); assert.equal(dialog.scrollRegion.scrollTop, 17); dialog.close();
});
test("TC-S4-LOG-002 renderer keeps native archive identity/scroll/focus on async patches and restores opener", () => {
  const document = new FakeDocument(), root = document.createElement("div"), intents = [], renderer = createDomRenderer({ document, root, onIntent: i => intents.push(i) });
  const view = { state: "Cutscene", revision: 3, viewRevision: 1, presentation: { mode: "reading" }, scene: { dialogue: "น้ำไหว" },
    settings: { fontScale: 1 }, history: projectSessionHistory(null), choices: [{ id: "application.history", label: "เปิดประวัติเรื่องราว" }] };
  assert.equal(renderer.render(view).ok, true); find(root, "data-choice-id", "application.history").dispatchEvent({ type: "click" });
  assert.equal(intents.length, 1); const overlay = { ...view, overlay: "history", viewRevision: 2 };
  renderer.render(overlay); renderer.setBusy(false);
  const dialog = find(root, "data-jk-role", "history-dialog"), scroll = find(dialog, "data-jk-role", "modal-scroll"); scroll.scrollTop = 71;
  const heading = document.activeElement; renderer.render({ ...overlay, viewRevision: 3, mediaStatusText: "ภาพยังไม่พร้อม" });
  assert.equal(find(root, "data-jk-role", "history-dialog"), dialog); assert.equal(scroll.scrollTop, 71); assert.equal(document.activeElement, heading);
  assert.equal(find(root, "data-jk-role", "game-shell").hasAttribute("inert"), true);
  renderer.render({ ...view, viewRevision: 4 }); renderer.applyFocusDirective({ target: "dialogue" });
  assert.equal(document.activeElement.getAttribute("data-choice-id"), "application.history");
  assert.equal(find(root, "data-jk-role", "game-shell").hasAttribute("inert"), false); renderer.dispose();
});
test("TC-S4-LOG-002 trusted History pointer/keyboard activation never unlocks audio and keeps repeat guard", () => {
  const document = new FakeDocument(), root = document.createElement("div"); let activations = 0, prevented = false;
  const renderer = createDomRenderer({ document, root, onTrustedActivation: () => { activations++; } });
  renderer.render({ state: "Title", scene: { dialogue: "" }, choices: [{ id: "application.history", label: "ประวัติ" }] });
  const button = find(root, "data-choice-id", "application.history");
  for (const event of [{ type: "pointerdown" }, { type: "keydown", key: "Enter" }, { type: "keydown", key: "Enter", repeat: true, preventDefault() { prevented = true; } }]) {
    root._listeners.get(event.type)[0]({ ...event, target: button, isTrusted: true });
  }
  assert.equal(activations, 0); assert.equal(prevented, true);
  root._listeners.get("pointerdown")[0]({ target: root, type: "pointerdown", isTrusted: true }); assert.equal(activations, 1); renderer.dispose();
});
