import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createJourneySession } from "../../src/core/use-cases/journey-session.js";
import { createJourneyShell } from "../../src/bootstrap/journey-shell.js";
import { createJourneyMediaIndex } from "../../src/data/assets/journey-media.js";
import { createJourneyPresentation } from "../../src/data/content/journey-presentation.js";
import { TH_JOURNEY } from "../../src/data/localization/th-journey.js";
import { JOURNEY_DEFAULT_SETTINGS } from "../../src/data/persistence/journey-device-records.js";
import { LEGACY_ARCHIVE_KEYS } from "../../src/data/persistence/legacy-archive.js";
import { MICRO_AUTO_MS, MICRO_SETTLE_MS } from "../../src/ui/journey/components/micro-prompt.js";
import { createJourneyRenderer } from "../../src/ui/journey/journey-renderer.js";
import { NOW, SESSION_ID, loadAct1Package, planned } from "../helpers/journey-driver.js";
import { JourneyDocument, byClass, manualFrames, manualSchedule, nodes, oneByClass, recordingLoader } from "../helpers/journey-dom.js";
import { KEYS, SpyStorage, loadMini, steppingClock, value } from "../helpers/journey-storage.js";

/**
 * C5c screens: the settings and pouch modals (focus kept inside, Escape, focus back, the game
 * waits), the three-strand ending cards, the chapter end, and the real title through the shell
 * (continue, consent before replacing, play in memory, the one-time notices, settings first).
 * Trace: TC-S5-A11Y-001, TC-S5-UX-001, TC-S5-INLINE-001, TC-S5-SAVE-001, TC-S5-LEGACY-001,
 * TC-S5-ENDING-001 (screen), UX §1.6 · §1.7 · §1.9 · §6, ADR-P0-034 D7–D9.
 */
const manifest = JSON.parse(readFileSync(new URL("../../assets/images/asset-manifest-v2.json", import.meta.url), "utf8"));
const ACT1 = loadAct1Package();
const MINI = loadMini();
const PLAN_ACT1 = planned({ "a1-03": "rain", "a1-06": "grit", "a1-13": "a" });
const PLAN_MINI = planned({ n02: "major-wind" });
const BUTTON = "item_teuk_peuak_button", SEEDS = "item_kib_glowing_seeds", GUARD = "item_kab_bark_guard", GEAR = "item_pkam_tin_gear";
const pouchOf = (held) => ({ capacity: 4, held: [...held], acquired: [...held], released: [], remembered: [...held], memory: [] });

function reach(session, policy, stop) {
  let state = session.newGame({ sessionId: SESSION_ID, now: NOW });
  for (let i = 0; i < 2000; i += 1) {
    const view = session.view(state);
    if (stop(view)) return state;
    const command = policy(view);
    assert.ok(command !== null, `stopped at ${view.node.id} ${view.mode}`);
    const result = session[command.kind](state, { revision: state.revision, now: NOW, ...(command.args ?? {}) });
    assert.ok(result.ok, JSON.stringify(result.error));
    state = result.state;
  }
  throw new Error("state not reached");
}

function variant(session, state, change) {
  const copy = structuredClone(state);
  change(copy.payload);
  return session.restore(copy);
}

/** A renderer over a real session; settings changes and the way back are recorded. */
function panelScreen(pkg, session, state, { settings = {} } = {}) {
  const media = createJourneyMediaIndex({ manifest, identity: { key: `test:${pkg.package.id}` }, baseUrl: "http://127.0.0.1:8000/" });
  const presentation = createJourneyPresentation({ pkg, media, messages: TH_JOURNEY });
  const document = new JourneyDocument();
  const host = document.createElement("main");
  document.body.append(host);
  const screen = { state, model: null, commands: [], patches: [], left: 0, timers: manualSchedule(), document, settings: { ...JOURNEY_DEFAULT_SETTINGS, ...settings } };
  const show = (events = []) => {
    screen.model = presentation.present({ phase: "playing", settings: screen.settings, persistence: "active", view: session.view(screen.state), events, notice: null });
    screen.renderer.render(screen.model);
  };
  const frames = manualFrames();
  screen.renderer = createJourneyRenderer({
    document, root: host, messages: TH_JOURNEY, loadImage: recordingLoader().loadImage,
    schedule: screen.timers.schedule, frame: frames.frame, now: frames.now, prefersReducedMotion: () => false,
    onCommand: (kind, args) => {
      screen.commands.push({ kind, args });
      const result = session[kind](screen.state, { ...args, now: NOW });
      assert.ok(result.ok, JSON.stringify(result.error));
      screen.state = result.state;
      show(result.events);
    },
    onChangeSettings: (patch) => { screen.patches.push(patch); screen.settings = { ...screen.settings, ...patch }; show(); },
    onLeave: () => { screen.left += 1; },
  });
  screen.root = screen.renderer.element;
  screen.dialog = (name) => byClass(screen.root, "jk-modal").find((dialog) => dialog.getAttribute("data-modal") === name);
  screen.live = () => nodes(screen.root).find((node) => node.getAttribute("aria-live") === "polite").textContent;
  show();
  return screen;
}

// ---------------------------------------------------------------------------------------
// Settings and pouch modals
// ---------------------------------------------------------------------------------------
test("TC-S5-A11Y-001 the gear opens the settings: focus on the chosen size, Tab stays inside, Escape closes back to the gear, and the game waits", () => {
  const session = createJourneySession(ACT1);
  const s = panelScreen(ACT1, session, session.newGame({ sessionId: SESSION_ID, now: NOW }));
  const gear = oneByClass(s.root, "jk-settings");
  gear.focus();
  gear.click();
  const dialog = s.dialog("settings");
  assert.equal(s.renderer.modal(), "settings");
  assert.deepEqual([dialog.getAttribute("role"), dialog.getAttribute("aria-modal"), dialog.hasAttribute("open"), s.root.getAttribute("data-modal")], ["dialog", "true", true, "settings"]);
  assert.equal(nodes(dialog).find((node) => node.id === dialog.getAttribute("aria-labelledby")).textContent, "ตั้งค่า");
  assert.deepEqual([s.document.activeElement.getAttribute("type"), s.document.activeElement.getAttribute("value")], ["radio", "1"], "focus lands on the text size in use");
  s.document.key(" ");
  s.document.key("1");
  oneByClass(s.root, "jk-stage").click();
  assert.equal(s.commands.length, 0, "no command while a modal is open");
  const controls = nodes(dialog).filter((node) => node.tagName === "BUTTON" || node.tagName === "INPUT");
  assert.equal(controls.length, 1 + 5 + 6, "close, five sizes, six switches");
  controls.at(-1).focus();
  dialog.dispatch("keydown", { key: "Tab", shiftKey: false });
  assert.equal(s.document.activeElement, controls[0], "Tab from the last control wraps to the first");
  dialog.dispatch("keydown", { key: "Tab", shiftKey: true });
  assert.equal(s.document.activeElement, controls.at(-1));
  const large = byClass(dialog, "jk-scale__input").find((input) => input.getAttribute("value") === "2");
  large.checked = true;
  large.dispatch("change");
  assert.deepEqual(s.patches.at(-1), { fontScale: 2 });
  assert.equal(s.root.getAttribute("data-text"), "large");
  const auto = byClass(dialog, "jk-switch__input").find((input) => input.getAttribute("name") === "autoMicro");
  assert.equal(auto.checked, false);
  auto.checked = true;
  auto.dispatch("change");
  assert.deepEqual(s.patches.at(-1), { autoMicro: true });
  assert.equal(nodes(dialog).find((node) => node.id === auto.getAttribute("aria-describedby")).textContent, "สำเร็จเองหลังหนึ่งวินาที");
  dialog.dispatch("keydown", { key: "Escape" });
  assert.deepEqual([s.renderer.modal(), dialog.hasAttribute("open"), s.root.getAttribute("data-modal")], [null, false, null]);
  assert.equal(s.document.activeElement, gear, "focus returns to the gear");
  oneByClass(s.root, "jk-stage").click();
  assert.equal(s.commands.at(-1).kind, "advance", "the game goes on once the modal is closed");
});

test("TC-S5-A11Y-001 I opens the pouch with its four slots and its memory; the close button gives focus back where it was", () => {
  const session = createJourneySession(MINI);
  const swap = variant(session, reach(session, PLAN_MINI, (v) => v.mode === "POUCH_SWAP"), (p) => { p.journey.pouch = pouchOf([BUTTON, SEEDS, GUARD, GEAR]); });
  const handed = session.pouchDecide(swap, { revision: swap.revision, now: NOW, option: "release-seeds" }).state;
  const s = panelScreen(MINI, session, handed);
  const next = oneByClass(s.root, "jk-dialogue__next");
  next.focus();
  s.document.key("i");
  assert.equal(s.renderer.modal(), "pouch");
  const dialog = s.dialog("pouch");
  const slots = byClass(oneByClass(dialog, "jk-pouch-panel__slots"), "jk-slot");
  const named = Object.fromEntries(slots.map((slot) => [byClass(slot, "jk-slot__name")[0].textContent, byClass(slot, "jk-slot__note")[0]]));
  assert.deepEqual(Object.keys(named).sort(), ["กระดุมทองเหลือง", "นกหวีดทองเหลือง", "สนับข้อมือเปลือกไม้", "เฟืองสังกะสีไขลาน"].sort());
  assert.equal(named["กระดุมทองเหลือง"].textContent, "ฝากไม่ได้");
  assert.equal(oneByClass(dialog, "jk-pouch-panel__memory").textContent, "ฝากไปแล้วเมล็ดต้อยติ่งเรืองแสง");
  oneByClass(dialog, "jk-modal__close").click();
  assert.equal(s.renderer.modal(), null);
  assert.equal(s.document.activeElement, next, "focus returns to where it was before I");
  const refused = session.pouchDecide(reach(session, PLAN_MINI, (v) => v.mode === "POUCH_SWAP"), { revision: reach(session, PLAN_MINI, (v) => v.mode === "POUCH_SWAP").revision, now: NOW, option: "refuse" }).state;
  const t = panelScreen(MINI, session, refused);
  oneByClass(t.root, "jk-hud__pouch").click();
  assert.equal(oneByClass(t.dialog("pouch"), "jk-pouch-panel__memory").textContent, "ไม่ได้รับไว้นกหวีดทองเหลือง");
  assert.equal(t.model.pouchPanel.refused[0].item, "item_teuk_whistle_charm");
});

test("TC-S5-UX-001 a micro-action that completes while a modal is open waits; its command goes when the modal closes", () => {
  const session = createJourneySession(ACT1);
  const s = panelScreen(ACT1, session, reach(session, PLAN_ACT1, (v) => v.mode === "MICRO"), { settings: { autoMicro: true } });
  oneByClass(s.root, "jk-settings").click();
  s.timers.queue.find((entry) => entry.ms === MICRO_AUTO_MS).callback();
  s.timers.queue.find((entry) => entry.ms === MICRO_SETTLE_MS.tap3).callback();
  assert.equal(s.commands.length, 0, "no command while the settings are open");
  oneByClass(s.dialog("settings"), "jk-modal__close").click();
  assert.deepEqual(s.commands.map((command) => command.kind), ["microDone"]);
});

// ---------------------------------------------------------------------------------------
// Endings and the chapter end
// ---------------------------------------------------------------------------------------
test("TC-S5-UX-001 the three-strand cards keep ก ข ค, light only what is met, and show the first missing line on a closed ending", () => {
  const session = createJourneySession(MINI);
  const ending = reach(session, PLAN_MINI, (v) => v.mode === "ENDING_RESONANCE");
  const s = panelScreen(MINI, session, ending);
  const board = oneByClass(s.root, "jk-endings");
  assert.equal(board.getAttribute("data-component"), "ThreeStrandDestinyCard");
  const cards = byClass(board, "jk-ending");
  assert.deepEqual(cards.map((card) => [card.getAttribute("data-ending"), byClass(card, "jk-ending__mark")[0].textContent, byClass(card, "jk-ending__label")[0].textContent, byClass(card, "jk-ending__words")[0].textContent]), [
    ["e-home", "ก", "อยู่ตรงนี้", "หัวใจ · คำสัญญา"],
    ["e-pond", "ข", "กลับบ้าน", "ขาที่พากลับ · รากเหง้า"],
    ["e-dawn", "ค", "ผู้พิทักษ์ของสองรุ่งอรุณ", "ใจและขา · ทุกสายใย · สองโลก"],
  ]);
  const home = cards[0];
  assert.equal(home.getAttribute("aria-disabled"), "true");
  assert.equal(byClass(home, "jk-ending__note")[0].textContent, "ยังไม่ได้พกคำสัญญามาถึง", "the first missing line, from the package");
  assert.equal(byClass(home, "jk-ending__bead")[0].getAttribute("data-lit"), "false", "no button in the mini journey");
  for (const [index, card] of s.model.endings.cards.entries()) {
    const drawn = byClass(cards[index], "jk-ending__strand");
    assert.ok(drawn.length >= card.strands.filter((strand) => !strand.bead).length);
    assert.ok(drawn.every((path) => (path.getAttribute("data-colour") === "grey") === (path.getAttribute("data-lit") === "false")));
  }
  assert.doesNotMatch(board.textContent, /[0-9๐-๙]/, "no number on the ending cards");
  const open = s.model.endings.cards.findIndex((card) => card.available);
  assert.ok(open >= 0);
  assert.equal(s.document.activeElement, cards[open], "focus on the first ending that can be chosen");
  assert.match(s.live(), /ทางเลือกในแสงแรก/);
  home.click();
  assert.equal(s.commands.length, 0, "a closed ending cannot be chosen");
  const revision = s.model.revision;
  s.document.key(String(open + 1));
  assert.equal(cards[open].getAttribute("aria-pressed"), "true");
  s.document.key(String(open + 1));
  assert.deepEqual(s.commands.at(-1), { kind: "chooseEnding", args: { option: cards[open].getAttribute("data-key"), revision } });
  assert.equal(board.hidden, true);
});

test("TC-S5-UX-001 the Safety Fallback opens E-POND with a fourth reed braid round its knot and its line", () => {
  const session = createJourneySession(MINI);
  const ending = reach(session, PLAN_MINI, (v) => v.mode === "ENDING_RESONANCE");
  const broken = variant(session, ending, (p) => {
    p.journey.meters = { hp: 1, mind: 1, sta: 1 };
    p.journey.pouch = pouchOf([]);
    p.journey.counters.familySkillUses = 0;
  });
  const s = panelScreen(MINI, session, broken);
  const [home, pond, dawn] = byClass(oneByClass(s.root, "jk-endings"), "jk-ending");
  assert.deepEqual([home.getAttribute("data-available"), pond.getAttribute("data-available"), dawn.getAttribute("data-available")], ["false", "true", "false"]);
  assert.equal(pond.getAttribute("data-fallback"), "true");
  assert.equal(byClass(pond, "jk-ending__fallback")[0].textContent, "พี่กับจะแบกกลับเอง");
  assert.equal(byClass(pond, "jk-ending__fallback-braid").length, 1);
  assert.equal(byClass(home, "jk-ending__fallback-braid").length, 0);
  assert.match(s.model.endings.cards[1].description, /^กลับบ้าน · ขาที่พากลับ ยังไม่พร้อม · รากเหง้า ยังไม่พร้อม · พี่กับจะแบกกลับเอง$/);
});

test("TC-S5-UX-001 at the edge of the promoted story the chapter end offers the way back to the title", () => {
  const session = createJourneySession(ACT1);
  const s = panelScreen(ACT1, session, reach(session, PLAN_ACT1, (v) => v.mode === "BOUNDARY"));
  const end = oneByClass(s.root, "jk-chapter-end");
  assert.equal(end.hidden, false);
  assert.equal(oneByClass(end, "jk-chapter-end__text").textContent, "เรื่องหน้าต่อจากนี้ยังไม่เปิด");
  const back = oneByClass(end, "jk-chapter-end__back");
  assert.equal(s.document.activeElement, back);
  back.click();
  assert.equal(s.left, 1);
  assert.equal(s.commands.length, 0);
});

// ---------------------------------------------------------------------------------------
// The real title through the shell
// ---------------------------------------------------------------------------------------
function titleOn(storage, packageData = ACT1) {
  const document = new JourneyDocument();
  const root = document.createElement("main");
  document.body.append(root);
  const shell = createJourneyShell({ document, root, packageData, manifest, baseUrl: "http://127.0.0.1:8000/", storage, clock: steppingClock(), loadImage: recordingLoader().loadImage });
  value(shell.boot());
  const title = byClass(root, "jk-title")[0];
  const button = (action) => nodes(title).find((node) => node.getAttribute("data-action") === action);
  return { document, root, shell, title, button };
}

test("TC-S5-SAVE-001 the title starts a journey, continues without writing, and asks before replacing a stored one", () => {
  const storage = new SpyStorage();
  const { document, root, shell, title, button } = titleOn(storage);
  assert.equal(title.hidden, false);
  assert.equal(title.getAttribute("data-component"), "JourneyTitle");
  assert.equal(oneByClass(title, "jk-title__name").textContent, "เจ้ากบ");
  assert.equal(button("continue").hidden, true);
  assert.equal(document.activeElement, button("start"), "focus on the way in");
  button("start").click();
  assert.equal(shell.snapshot().phase, "playing");
  assert.equal(title.hidden, true);
  const game = byClass(root, "jk-journey").find((node) => node !== title);
  assert.equal(game.hidden, false);
  value(shell.perform("advance"));
  const revision = shell.snapshot().model.revision;
  value(shell.leave());
  assert.equal(title.hidden, false);
  assert.equal(button("continue").hidden, false);
  assert.equal(oneByClass(button("continue"), "jk-title__button-detail").textContent, "จากองก์ 1");
  assert.equal(document.activeElement, button("continue"));
  const writes = storage.writes().length;
  button("continue").click();
  assert.deepEqual([shell.snapshot().phase, shell.snapshot().model.revision, storage.writes().length], ["playing", revision, writes], "continue never writes");
  value(shell.leave());
  button("start").click();
  assert.equal(shell.snapshot().phase, "title", "a stored journey is not replaced without consent");
  const consent = oneByClass(title, "jk-title__consent");
  assert.equal(consent.hidden, false);
  assert.equal(document.activeElement, button("confirm-start"));
  button("cancel-start").click();
  assert.deepEqual([consent.hidden, document.activeElement], [true, button("start")]);
  button("start").click();
  button("confirm-start").click();
  assert.deepEqual([shell.snapshot().phase, shell.snapshot().model.revision], ["playing", 1], "replaced after consent");
  assert.equal(storage.json(KEYS.canonical).revision, 1);
});

test("TC-S5-SAVE-001 a protected record offers play without saving and stays byte-identical", () => {
  const future = JSON.stringify({ saveFormatVersion: 3, profile: "journey-1", anything: "newer" });
  const storage = new SpyStorage({ [KEYS.canonical]: future });
  const { title, shell, button } = titleOn(storage);
  assert.equal(byClass(title, "jk-title__notice")[0].getAttribute("data-notice"), "save-protected");
  assert.equal(button("memory").hidden, false);
  button("memory").click();
  assert.deepEqual([shell.snapshot().phase, shell.snapshot().model.persistence], ["playing", "memory"]);
  value(shell.perform("advance"));
  assert.equal(storage.raw(KEYS.canonical), future);
});

test("TC-S5-LEGACY-001 the legacy notice shows once on the title and is gone after รับทราบ", () => {
  const storage = new SpyStorage({ [LEGACY_ARCHIVE_KEYS[0]]: "{\"saveFormatVersion\":2}" });
  const first = titleOn(storage);
  const notice = byClass(first.title, "jk-title__notice")[0];
  assert.deepEqual([notice.getAttribute("data-notice"), oneByClass(notice, "jk-title__notice-text").textContent], ["legacy-archive", TH_JOURNEY.notices["legacy-archive"]]);
  oneByClass(notice, "jk-title__notice-ok").click();
  assert.equal(byClass(first.title, "jk-title__notice").length, 0);
  assert.equal(byClass(titleOn(storage).title, "jk-title__notice").length, 0, "shown once per device");
  assert.equal(storage.raw(LEGACY_ARCHIVE_KEYS[0]), "{\"saveFormatVersion\":2}");
});

test("TC-S5-A11Y-001 settings can be changed on the title before starting, and the title follows the text size", () => {
  const storage = new SpyStorage();
  const { title, shell, button, document } = titleOn(storage);
  button("settings").click();
  const dialog = oneByClass(title, "jk-modal");
  assert.equal(dialog.hasAttribute("open"), true);
  const size = byClass(dialog, "jk-scale__input").find((input) => input.getAttribute("value") === "1.5");
  size.checked = true;
  size.dispatch("change");
  assert.equal(shell.snapshot().title.screen.settings.fontScale, 1.5);
  assert.equal(title.style.getPropertyValue("--jk-font-scale"), "1.5");
  dialog.dispatch("keydown", { key: "Escape" });
  assert.equal(document.activeElement, button("settings"));
  button("start").click();
  assert.equal(shell.snapshot().model.settings.fontScale, 1.5);
});

test("TC-S5-UX-001 the presentation names the title and the pouch memory in the package's words", () => {
  const session = createJourneySession(MINI);
  const media = createJourneyMediaIndex({ manifest, identity: { key: "test:mini" }, baseUrl: "http://127.0.0.1:8000/" });
  const presentation = createJourneyPresentation({ pkg: MINI, media, messages: TH_JOURNEY });
  const model = presentation.title({ phase: "title", settings: JOURNEY_DEFAULT_SETTINGS, continue: { act: 3, memoryOnly: true }, newGame: { needsConsent: true }, offerMemory: false, notices: ["save-recovered"], notice: null });
  assert.deepEqual([model.name, model.continue.detail, model.continue.note, model.start.needsConsent, model.notices[0].text], ["แพ็กเกจทดสอบจิ๋ว", "จากองก์ 3", "ครั้งนี้เล่นโดยไม่บันทึกทับข้อมูลเดิม", true, TH_JOURNEY.notices["save-recovered"]]);
  assert.equal(model.background.assetId, "bg_act1_willow_roots", "the opening plate of the package");
  assert.throws(() => presentation.title({ phase: "playing" }), TypeError);
  const state = session.newGame({ sessionId: SESSION_ID, now: NOW });
  const panel = presentation.present({ phase: "playing", settings: JOURNEY_DEFAULT_SETTINGS, persistence: "active", view: session.view(state), events: [], notice: null }).pouchPanel;
  assert.deepEqual([panel.slots.length, panel.released, panel.refused], [4, [], []]);
});
