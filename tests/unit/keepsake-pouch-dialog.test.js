import test from "node:test";
import assert from "node:assert/strict";
import { createKeepsakePouchDialog } from "../../src/ui/components/keepsake-pouch-dialog.js";
import { TH_SYSTEM_MESSAGES } from "../../src/ui/localization/th-system-messages.js";
import { projectKeepsakePouch } from "../../src/data/content/keepsake-view-model.js";
import { createPouch, collectItem, releaseItem, refuseItem } from "../../src/core/domain/keepsake-pouch.js";
import { FakeDocument, findByAttribute as find, findAllByAttribute as findAll } from "../helpers/application-harness.js";

const metadata = (id = "item_leaf", enabled = false) => ({ id, name: `ของสะสม ${id}`, description: "ขอบใบอ่อนและแสงที่นึกถึง", memoryText: "สีเขียวเล็ก ๆ ยังอยู่ในความทรงจำ",
  status: "held", image: { src: "/assets/images/keepsakes/leaf.svg", alt: "ภาพเศษใบบัว" }, opportunityId: "opportunity.fixture",
  actions: [{ action: "release", enabled }, { action: "use", enabled: false }] });
function harness(pouch) {
  const document = new FakeDocument(), intents = [];
  const viewModel = { revision: 9, viewRevision: 17, pouch: pouch ?? { capacity: 4, used: 0, slots: [null, null, null, null], memories: [] } };
  const dialog = createKeepsakePouchDialog({ document, viewModel, message: key => TH_SYSTEM_MESSAGES[key], onIntent: i => intents.push(i) });
  return { document, dialog, intents, viewModel };
}
const click = control => control.dispatchEvent({ type: "click" });
const occupied = (enabled = false) => ({ capacity: 4, used: 1, slots: [metadata("item_leaf", enabled), null, null, null], memories: [] });

test("TC-S4-POUCH-002 empty bag has exactly four tactile noninteractive slots", () => {
  const h = harness(); h.dialog.open();
  assert.equal(findAll(h.dialog.element, "data-jk-role", "pouch-empty-slot").length, 4);
  assert.match(h.dialog.element.textContent, /0 จาก 4 ช่อง/); assert.match(h.dialog.element.textContent, /ไม่จำเป็นต้องเก็บ/);
  assert.equal(h.intents.length, 0); assert.equal(h.document.activeElement, h.dialog.controls[0]);
  assert.notEqual(h.dialog.controls[0].parentNode, h.dialog.scrollRegion);
});
test("TC-S4-POUCH-002 inspect is local, readable and never sends a domain intent", () => {
  const h = harness(occupied()), original = structuredClone(h.viewModel);
  click(find(h.dialog.element, "data-item-id", "item_leaf"));
  assert.match(find(h.dialog.element, "data-jk-role", "pouch-detail").textContent, /ความทรงจำ/);
  assert.equal(h.document.activeElement.getAttribute("id"), "jk-pouch-item-title");
  assert.equal(findAll(h.dialog.element, "data-jk-role", "pouch-empty-slot").length, 3);
  assert.deepEqual(h.viewModel, original); assert.equal(h.intents.length, 0);
  const release = find(h.dialog.element, "data-pouch-action", "release");
  assert.equal(release.disabled, true); h.dialog.setBusy(true); h.dialog.setBusy(false); assert.equal(release.disabled, true);
  click(release); assert.equal(h.intents.length, 0);
});
test("TC-S4-POUCH-002 missing/failed image retains name, description and memory", () => {
  const h = harness(occupied()); click(find(h.dialog.element, "data-item-id", "item_leaf"));
  const images = findAll(h.dialog.element, "src", "/assets/images/keepsakes/leaf.svg"); assert.equal(images.length, 2);
  for (const image of images) image.dispatchEvent({ type: "error" });
  assert.equal(images.every(image => image.hasAttribute("hidden")), true);
  assert.match(h.dialog.element.textContent, /ภาพยังไม่พร้อม/); assert.match(h.dialog.element.textContent, /ขอบใบอ่อน/);
  assert.equal(h.intents.length, 0);
  const missing = occupied(); missing.slots[0].image = null;
  const other = harness(missing); click(find(other.dialog.element, "data-item-id", "item_leaf")); assert.match(other.dialog.element.textContent, /ภาพยังไม่พร้อม/);
});
test("TC-S4-POUCH-002 released/refused memories have no physical slot and no actions", () => {
  const p = { capacity: 4, used: 0, slots: [null, null, null, null], memories: [{ ...metadata(), status: "released" }, { ...metadata("item_dew_stone"), status: "refused" }] };
  const h = harness(p);
  for (const id of ["item_leaf", "item_dew_stone"]) {
    click(find(h.dialog.element, "data-memory-id", id)); assert.equal(findAll(h.dialog.element, "data-pouch-action", "release").length, 0);
  }
  assert.match(h.dialog.element.textContent, /เคยพบเจอ/); assert.equal(findAll(h.dialog.element, "data-jk-role", "pouch-empty-slot").length, 4);
});
test("TC-S4-A11Y-001 Tab trap and Escape/close send view intent with revisions", () => {
  const h = harness(occupied()); h.dialog.open();
  const first = h.dialog.controls[0], last = h.dialog.controls.at(-1);
  first.focus(); h.dialog.element.dispatchEvent({ type: "keydown", key: "Tab", shiftKey: true }); assert.equal(h.document.activeElement, last);
  last.focus(); h.dialog.element.dispatchEvent({ type: "keydown", key: "Tab" }); assert.equal(h.document.activeElement, first);
  h.dialog.element.dispatchEvent({ type: "keydown", key: "Escape" }); click(first);
  assert.deepEqual(h.intents, Array(2).fill({ type: "SELECT_CHOICE", choiceId: "application.close-pouch", expectedRevision: 9, viewRevision: 17 }));
  h.dialog.close(); assert.equal(h.dialog.element.hasAttribute("open"), false);
});
test("TC-S4-POUCH-002 release requires confirmation, cancel never sends a command", () => {
  const h = harness(occupied(true)); click(find(h.dialog.element, "data-item-id", "item_leaf"));
  click(find(h.dialog.element, "data-pouch-action", "release")); assert.equal(h.intents.length, 0);
  assert.equal(h.document.activeElement.getAttribute("data-jk-role"), "pouch-cancel");
  click(find(h.dialog.element, "data-jk-role", "pouch-cancel")); assert.equal(h.intents.length, 0);
  assert.equal(h.document.activeElement.getAttribute("data-pouch-action"), "release");
  click(find(h.dialog.element, "data-pouch-action", "release"));
  h.dialog.updateStatus({ ...h.viewModel, viewRevision: 18 }); h.dialog.setBusy(true);
  const confirm = find(h.dialog.element, "data-jk-role", "pouch-confirm"); click(confirm); assert.equal(h.intents.length, 0);
  h.dialog.setBusy(false); click(confirm);
  assert.deepEqual(h.intents, [{ type: "POUCH_ACTION", action: "release", itemId: "item_leaf", opportunityId: "opportunity.fixture", confirmed: true, expectedRevision: 9, viewRevision: 18 }]);
});
for (const action of ["collect", "refuse", "replace", "use"]) test(`TC-S4-POUCH-002 ${action} intent carries approved identity and confirmation`, () => {
  const full = action === "replace";
  const p = full ? { capacity: 4, used: 4, slots: ["item_leaf", "item_dew_stone", "item_lotus_shell", "item_rain_petal"].map(id => metadata(id)), memories: [] }
    : occupied(true);
  if (action === "use") p.slots[0].actions[1].enabled = true;
  else p.offer = { id: "opportunity.fixture.offer", item: metadata("item_red_yarn") };
  const h = harness(p);
  if (action === "use") click(find(h.dialog.element, "data-item-id", "item_leaf"));
  click(find(h.dialog.element, action === "replace" ? "data-replace-item-id" : "data-pouch-action", action === "replace" ? "item_leaf" : action));
  assert.equal(h.intents.length, 0); click(find(h.dialog.element, "data-jk-role", "pouch-confirm"));
  assert.equal(h.intents[0].action, action); assert.equal(h.intents[0].confirmed, true);
  assert.equal(h.intents[0].itemId, action === "use" ? "item_leaf" : "item_red_yarn");
  if (full) { assert.equal(h.intents[0].oldItemId, "item_leaf"); assert.match(h.dialog.element.textContent, /ส่งต่อ ของสะสม item_leaf และเก็บ/); }
});
test("TC-S4-POUCH-002 full bag offers four replacements/refusal/cancel with no auto drop", () => {
  const p = { capacity: 4, used: 4, slots: ["item_leaf", "item_dew_stone", "item_lotus_shell", "item_rain_petal"].map(id => metadata(id)), memories: [], offer: { id: "opportunity.fixture", item: metadata("item_red_yarn") } };
  const before = structuredClone(p), h = harness(p);
  assert.equal(h.dialog.controls.filter(c => c.hasAttribute("data-replace-item-id")).length, 4);
  assert.equal(findAll(h.dialog.element, "data-pouch-action", "collect").length, 0); assert.match(h.dialog.element.textContent, /ทั้งสี่ช่อง/);
  click(find(h.dialog.element, "data-jk-role", "pouch-cancel-offer")); assert.deepEqual(p, before);
  assert.equal(h.intents[0].type, "SELECT_CHOICE");
});
test("TC-S4-POUCH-002 localized immutable projection distinguishes held/released/refused", () => {
  const held = collectItem(createPouch(), "item_leaf").value;
  const offer = { id: "opportunity.fixture", actions: ["release"] };
  const view = projectKeepsakePouch({ pouch: held, opportunity: offer, locale: "th" });
  assert.equal(view.slots.length, 4); assert.equal(view.slots[0].status, "held"); assert.equal(view.slots[0].actions[0].enabled, true);
  assert.match(view.slots[0].image.src, /assets\/images\/keepsakes\/leaf\.svg$/); assert.equal(Object.isFrozen(view.slots[0].actions[0]), true);
  for (const [pouch, status] of [[releaseItem(held, "item_leaf").value, "released"], [refuseItem(createPouch(), "item_leaf").value, "refused"]]) {
    const projected = projectKeepsakePouch({ pouch }); assert.equal(projected.used, 0); assert.equal(projected.memories[0].status, status);
  }
  assert.equal(projectKeepsakePouch({}), null);
  assert.throws(() => projectKeepsakePouch({ pouch: collectItem(createPouch(), "item_unknown").value }), /POUCH_ITEM_REFERENCE/);
});
test("TC-S4-POUCH-002 narrative strings are text and never interpreted as markup", () => {
  const p = occupied(); p.slots[0].description = "<img src=x onerror=alert(1)>";
  const h = harness(p); click(find(h.dialog.element, "data-item-id", "item_leaf"));
  assert.match(h.dialog.element.textContent, /<img src=x/); assert.equal(findAll(h.dialog.element, "src", "x").length, 0);
});
