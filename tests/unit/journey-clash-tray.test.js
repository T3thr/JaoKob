import test from "node:test";
import assert from "node:assert/strict";
import { TH_JOURNEY } from "../../src/data/localization/th-journey.js";
import { createClashActionTray } from "../../src/ui/journey/components/clash-action-tray.js";
import { createClashIntentAndGauge } from "../../src/ui/journey/components/clash-intent-gauge.js";
import { createIdSource } from "../../src/ui/journey/journey-dom.js";
import { JourneyDocument, byClass, oneByClass, recordingLoader } from "../helpers/journey-dom.js";

/** Trace: TC-S5-TRAY-001, TC-S5-A11Y-001, UX §3.1 · §3.3 · §3.5 · §3.8, ADR-P0-034 D9.3/D9.4. */
const card = (key, extra = {}) => ({ key, shortcut: null, label: key, kind: "family", tags: [], cost: [], art: { icon: "drop", keepsake: null, face: null }, available: true, reason: null, description: key, ...extra });
const counter = { kind: "counter", text: "แก้ทาง" };
function clashModel(groups, extra = {}) {
  return {
    round: "R4A", beat: "choose", turn: 1, turns: 4, light: 4, max: 10, holdAt: 7, lightSource: false,
    intent: { by: "แมลงสาบแมน", name: "เงาขยาย", label: "แมลงสาบแมนเตรียมใช้ · เงาขยาย", notes: [], lastTurn: false, answered: false },
    preview: [], resolved: null, outcome: null, description: "",
    groups: groups.map(([id, cards]) => ({ id, label: TH_JOURNEY.groups[id], cards, marks: { counter: cards.some((c) => c.tags.includes(counter)), repeat: false, combo: cards.some((c) => c.kind === "combo") } })),
    ...extra,
  };
}
function trayOn() {
  const document = new JourneyDocument();
  const activated = [], selected = [];
  const tray = createClashActionTray({ document, messages: TH_JOURNEY, loadImage: recordingLoader().loadImage, idSource: createIdSource("t"), onActivate: (key) => activated.push(key), onSelect: (group) => selected.push(group) });
  document.body.append(tray.element);
  return { document, tray, activated, selected };
}
const basic = ["basic", [card("strike", { kind: "base", shortcut: 1, tags: [counter] }), card("guard", { kind: "base", shortcut: 2 }), card("rest", { kind: "base", shortcut: 3 })]];

test("TC-S5-TRAY-001 a single group shows its heading and no tab bar (R1)", () => {
  const { tray } = trayOn();
  tray.update(clashModel([basic, ["family", [card("rain"), card("wind", { tags: [counter] })]]]), { selected: "family", armed: null, layout: "tabs" });
  assert.equal(oneByClass(tray.element, "jk-tray__tabs").hidden, true);
  const family = byClass(tray.element, "jk-tray__group").find((s) => s.getAttribute("data-group") === "family");
  assert.equal(family.hidden, false);
  assert.equal(family.getAttribute("role"), null);
  assert.equal(byClass(family, "jk-tray__heading")[0].hidden, false);
});

test("TC-S5-TRAY-001 three groups become ARIA tabs over one well with roving focus, marks and no switch for the player", () => {
  const { tray, document, selected } = trayOn();
  const model = clashModel([basic, ["family", [card("rain")]], ["friends", [card("a_fiw", { kind: "assist", tags: [counter] })]], ["pouch", [card("seeds", { kind: "item" }), card("seeds_fiw", { kind: "combo" })]]]);
  tray.update(model, { selected: "family", armed: null, layout: "tabs" });
  const tabs = byClass(tray.element, "jk-tray__tab");
  assert.deepEqual(tabs.map((t) => [t.getAttribute("data-group"), t.getAttribute("aria-selected"), t.getAttribute("tabindex")]), [["family", "true", "0"], ["friends", "false", "-1"], ["pouch", "false", "-1"]]);
  assert.equal(byClass(tabs[1], "jk-tray__mark").find((m) => m.getAttribute("data-mark") === "counter").hidden, false, "a gold dot says the friends tab holds แก้ทาง");
  assert.equal(byClass(tabs[2], "jk-tray__mark").find((m) => m.getAttribute("data-mark") === "combo").hidden, false);
  const panels = byClass(tray.element, "jk-tray__group").filter((s) => s.getAttribute("role") === "tabpanel");
  assert.equal(panels.filter((p) => !p.hidden).length, 1, "one panel open");
  assert.equal(panels.find((p) => !p.hidden).getAttribute("aria-labelledby"), tabs[0].id);
  tabs[0].focus();
  tabs[0].dispatch("keydown", { key: "ArrowRight" });
  assert.deepEqual(selected, ["friends"]);
  assert.equal(document.activeElement, tabs[1]);
  tabs[1].dispatch("keydown", { key: "End" });
  assert.equal(selected.at(-1), "pouch");
  tray.update(model, { selected: "family", armed: null, layout: "tabs" });
  assert.equal(tabs[0].getAttribute("aria-selected"), "true", "the tray shows the player's tab, never one it picked");
});

test("TC-S5-TRAY-001 wide screens show every group as a column with headings and no tabs", () => {
  const { tray } = trayOn();
  tray.update(clashModel([basic, ["family", [card("rain")]], ["pouch", [card("seeds", { kind: "item" })]]]), { selected: "family", armed: null, layout: "columns" });
  assert.equal(oneByClass(tray.element, "jk-tray__tabs").hidden, true);
  assert.deepEqual(byClass(tray.element, "jk-tray__group").filter((s) => !s.hidden).map((s) => s.getAttribute("data-group")), ["basic", "family", "pouch"]);
});

test("TC-S5-A11Y-001 cards activate by key; an armed card shows it; the tray hides outside the choose beat", () => {
  const { tray, activated } = trayOn();
  tray.update(clashModel([basic, ["family", [card("rain")]]]), { selected: "family", armed: "guard", layout: "tabs" });
  const cards = byClass(tray.element, "jk-card").filter((c) => !c.hidden);
  assert.equal(cards[1].getAttribute("aria-pressed"), "true");
  cards[0].click();
  assert.deepEqual(activated, ["strike"]);
  assert.equal(byClass(cards[0], "jk-tag").filter((t) => !t.hidden).map((t) => t.textContent).join(), "แก้ทาง");
  tray.update(clashModel([basic], { beat: "resolve" }), { selected: null, armed: null, layout: "tabs" });
  assert.equal(tray.element.hidden, true);
});

test("TC-S5-TRAY-001 the gauge fills the light, marks the hold line, counts turns and speaks in words", () => {
  const document = new JourneyDocument();
  const view = createClashIntentAndGauge({ document, messages: TH_JOURNEY });
  view.update(clashModel([basic], { beat: "resolve", turn: 2, light: 7, resolved: { turn: 1, label: "x", answered: true }, intent: { by: "x", name: "เงาขยาย", label: "แมลงสาบแมนเตรียมใช้ · เงาขยาย", notes: [], lastTurn: false, answered: true } }));
  assert.equal(byClass(view.gauge, "jk-gauge__cell--light").length, 7);
  assert.equal(byClass(view.gauge, "jk-gauge__cell").findIndex((c) => c.getAttribute("data-hold") === "true"), 6);
  assert.equal(view.gauge.getAttribute("aria-label"), "แสงเจ็ดจากสิบ · เทิร์นที่สองจากสี่");
  assert.deepEqual([...oneByClass(view.gauge, "jk-gauge__drops").children].map((d) => d.getAttribute("data-state")), ["used", "future", "future", "future"]);
  assert.equal(view.badge.getAttribute("data-state"), "answered");
  assert.equal(oneByClass(view.badge, "jk-intent__answered").hidden, false);
  view.update(null);
  assert.equal(view.gauge.hidden, true);
  assert.equal(view.badge.hidden, true);
});
