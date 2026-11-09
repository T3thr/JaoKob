import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createJourneyMediaIndex } from "../../src/data/assets/journey-media.js";
import { createJourneyPresentation } from "../../src/data/content/journey-presentation.js";
import { TH_JOURNEY } from "../../src/data/localization/th-journey.js";
import { createJourneyRenderer } from "../../src/ui/journey/journey-renderer.js";
import { planned } from "../helpers/journey-driver.js";
import { JourneyDocument, byClass, flush, manualSchedule, nodes, oneByClass, recordingLoader } from "../helpers/journey-dom.js";
import { SpyStorage, createApp, value } from "../helpers/journey-storage.js";

/** Trace: TC-S5-VN-001, TC-S5-HUD-001, TC-S5-SILENT-001, TC-S5-A11Y-001, ADR-P0-034 D9.3/D10, UX §1.4–§1.10 · §2.1. */
const manifest = JSON.parse(readFileSync(new URL("../../assets/images/asset-manifest-v2.json", import.meta.url), "utf8"));
const PLAN = planned({ "a1-03": "rain", "a1-06": "grit", "a1-13": "a" });

/** A real application, its presentation and a renderer on the DOM double; commands go to the app. */
function screen({ settings = {}, prefersReducedMotion = () => false } = {}) {
  const app = createApp(new SpyStorage());
  value(app.boot());
  const { identity, package: pkg } = value(app.content());
  const presentation = createJourneyPresentation({ pkg, media: createJourneyMediaIndex({ manifest, identity, baseUrl: "http://127.0.0.1:8000/" }), messages: TH_JOURNEY });
  const document = new JourneyDocument();
  const host = document.createElement("main");
  document.body.append(host);
  const loader = recordingLoader();
  const timers = manualSchedule();
  const commands = [];
  let model = null;
  const show = (result) => { assert.ok(result.ok, JSON.stringify(result.error)); model = presentation.present(result.value); renderer.render(model); return model; };
  const renderer = createJourneyRenderer({
    document, root: host, messages: TH_JOURNEY, loadImage: loader.loadImage, schedule: timers.schedule, prefersReducedMotion,
    onCommand: (kind, args) => { commands.push({ kind, args }); show(app.perform(kind, args)); },
  });
  show(app.newGame());
  if (Object.keys(settings).length > 0) show(app.changeSettings(settings));
  const until = (predicate) => {
    for (let i = 0; i < 400 && !predicate(model); i += 1) {
      const view = value(app.view()).view;
      const command = PLAN(view);
      show(app.perform(command.kind, { ...(command.args ?? {}), revision: view.revision }));
    }
    assert.ok(predicate(model), "state not reached");
    return model;
  };
  return { app, document, renderer, root: renderer.element, loader, timers, commands, until, model: () => model };
}

test("TC-S5-VN-001 the reading screen draws the line, the speaker pill and ▽ as text only", async () => {
  const { root, until, model } = screen();
  const narration = model();
  const card = oneByClass(root, "jk-dialogue");
  assert.equal(oneByClass(root, "jk-dialogue__text").textContent, narration.line.text);
  assert.equal(oneByClass(root, "jk-dialogue__speaker").hidden, true, "narration has no speaker pill");
  assert.equal(card.getAttribute("data-narration"), "true");
  assert.equal(oneByClass(root, "jk-dialogue__next").hidden, false);
  const kib = until((m) => m.line?.speaker === "กิบ");
  assert.equal(oneByClass(root, "jk-dialogue__speaker").hidden, false);
  assert.equal(oneByClass(root, "jk-dialogue__name").textContent, "กิบ");
  assert.equal(oneByClass(root, "jk-dialogue__text").textContent, kib.line.text);
  await flush();
  assert.equal(oneByClass(root, "jk-dialogue__avatar").getAttribute("data-state"), "shown", "the speaker's face from the stage");
  const actors = byClass(root, "jk-actor");
  assert.deepEqual(actors.map((a) => [a.getAttribute("data-slot"), a.getAttribute("data-speaking")]), [["left", "false"], ["center", "false"], ["right", "true"]]);
  assert.equal(oneByClass(root, "jk-stage").getAttribute("data-speaker"), "true");
  assert.ok(actors.every((a) => a.style.getPropertyValue("--eye") !== "" && a.getAttribute("data-state") === "shown"));
});

test("TC-S5-A11Y-001 ▽, a tap on the stage and Space read on with the revision on screen; a control's own key is left alone", () => {
  const { root, document, commands, model } = screen();
  const first = model().revision;
  oneByClass(root, "jk-dialogue__next").click();
  assert.deepEqual(commands.at(-1), { kind: "advance", args: { revision: first } });
  assert.equal(commands.length, 1, "▽ inside the card reads on once");
  oneByClass(root, "jk-stage").click();
  assert.equal(commands.length, 2);
  document.key(" ");
  assert.equal(commands.length, 3);
  oneByClass(root, "jk-dialogue__next").focus();
  document.key("Enter");
  assert.equal(commands.length, 3, "Enter on a focused button is the button's own click");
  oneByClass(root, "jk-settings").click();
  assert.equal(commands.length, 3, "the HUD never reads on");
});

test("TC-S5-A11Y-001 a choice arms on the first press and commits on the second, bound to the revision; Escape disarms", () => {
  const { root, document, commands, until } = screen();
  const decision = until((m) => m.scene.nodeId === "a1-06" && m.mode === "DECISION");
  const cards = byClass(oneByClass(root, "jk-choices"), "jk-card").filter((card) => !card.hidden);
  assert.equal(cards.length, 5);
  assert.equal(document.activeElement, cards[0], "focus moves to the first open card");
  assert.equal(oneByClass(root, "jk-dialogue").hidden, true, "the cards take the dialogue card's place");
  const before = commands.length;
  document.key("4");
  assert.equal(commands.length, before, "first press only arms");
  assert.equal(cards[3].getAttribute("aria-pressed"), "true");
  assert.equal(byClass(cards[3], "jk-card__note")[0].textContent, TH_JOURNEY.ui.armedHint);
  document.key("Escape");
  assert.equal(cards[3].getAttribute("aria-pressed"), "false");
  cards[4].click();
  cards[4].click();
  assert.deepEqual(commands.at(-1), { kind: "choose", args: { option: "grit", revision: decision.revision } });
  assert.equal(document.activeElement, oneByClass(root, "jk-dialogue__next"), "focus returns to ▽ after the choice");
});

test("TC-S5-A11Y-001 with two-step confirmation off a single press commits; every card names its cost in words", () => {
  const { root, commands, until } = screen({ settings: { confirmHighImpactChoices: false } });
  until((m) => m.scene.nodeId === "a1-06" && m.mode === "DECISION");
  const cards = byClass(oneByClass(root, "jk-choices"), "jk-card").filter((card) => !card.hidden);
  const described = cards.map((card) => nodes(root).find((node) => node.id === card.getAttribute("aria-describedby")).textContent);
  assert.match(described[3], /ใช้แรงหนึ่งเม็ด$/);
  assert.equal(byClass(cards[4], "jk-card__cost")[0].textContent, "กาย ●  แรง ●●");
  cards[0].click();
  assert.equal(commands.at(-1).kind, "choose");
  assert.equal(commands.at(-1).args.option, "rain");
});

test("TC-S5-SILENT-001 a working save shows and announces nothing; a failure notice appears and is announced", () => {
  const { root, renderer, model } = screen();
  const live = nodes(root).find((node) => node.getAttribute("aria-live") === "polite");
  const notice = oneByClass(root, "jk-notice");
  assert.equal(notice.hidden, true);
  assert.doesNotMatch(live.textContent, /บันทึก/);
  renderer.render({ ...model(), notice: { id: "save-failed", text: TH_JOURNEY.notices["save-failed"] } });
  assert.equal(notice.hidden, false);
  assert.equal(oneByClass(root, "jk-notice__text").textContent, TH_JOURNEY.notices["save-failed"]);
  assert.match(live.textContent, /บันทึกลงเครื่องไม่ได้/);
  oneByClass(root, "jk-notice__dismiss").click();
  assert.equal(notice.hidden, true);
});

test("TC-S5-A11Y-001 each line is announced once with its scene title; a redraw of the same state stays silent", () => {
  const { root, renderer, model } = screen();
  const live = nodes(root).find((node) => node.getAttribute("aria-live") === "polite");
  assert.equal(live.textContent, `${model().scene.title} · ${model().line.announcement}`);
  live.textContent = "";
  renderer.render(model());
  assert.equal(live.textContent, "", "no second announcement for the same line");
});

test("TC-S5-VN-001 the scene title rises on a new plate and fades on its timer; it hides for a choice", () => {
  const { root, timers, until } = screen();
  const title = oneByClass(root, "jk-scene-title");
  assert.equal(title.getAttribute("data-state"), "shown");
  assert.equal(oneByClass(root, "jk-scene-title__name").textContent, "เสื้อที่ติดกอกก");
  timers.runAll();
  assert.equal(title.getAttribute("data-state"), "hidden");
  until((m) => m.scene.nodeId === "a1-03" && m.line !== null);
  assert.equal(title.getAttribute("data-state"), "shown");
  assert.equal(oneByClass(root, "jk-scene-title__name").textContent, "วิชาแรกของลูกคนกลาง");
  until((m) => m.mode === "DECISION");
  assert.equal(title.getAttribute("data-state"), "hidden");
});

test("TC-S5-VN-001 a screen that opens inside a clash beat (a resume) keeps the scene title down but still says it", () => {
  const { until } = screen();
  const choose = until((m) => m.mode === "CLASH_CHOOSE");
  const document = new JourneyDocument();
  const host = document.createElement("main");
  document.body.append(host);
  const fresh = createJourneyRenderer({ document, root: host, messages: TH_JOURNEY, loadImage: recordingLoader().loadImage, schedule: manualSchedule().schedule, onCommand: () => {} });
  fresh.render(choose);
  assert.equal(oneByClass(fresh.element, "jk-scene-title").getAttribute("data-state"), "hidden", "the intent badge keeps its place");
  const live = nodes(fresh.element).find((node) => node.getAttribute("aria-live") === "polite");
  assert.ok(live.textContent.includes(choose.scene.title), "the scene is still named for assistive technology");
  fresh.dispose();
});

test("TC-S5-A11Y-001 settings and system preferences become the attributes the styles read", () => {
  const plain = screen();
  assert.deepEqual(["data-motion", "data-surface", "data-intensity", "data-text"].map((name) => plain.root.getAttribute(name)), ["full", "glass", "normal", "normal"]);
  const tuned = screen({ settings: { reducedMotion: true, highContrast: true, reducedIntensity: true, fontScale: 2 } });
  assert.deepEqual(["data-motion", "data-surface", "data-contrast", "data-intensity", "data-text"].map((name) => tuned.root.getAttribute(name)), ["reduced", "solid", "high", "reduced", "large"]);
  assert.equal(tuned.root.style.getPropertyValue("--jk-font-scale"), "2");
  assert.equal(screen({ prefersReducedMotion: () => true }).root.getAttribute("data-motion"), "reduced");
});

test("TC-S5-HUD-001 the HUD capsule shows pips, strands and woven cells, with names in words", () => {
  const { root, until } = screen();
  const hud = oneByClass(root, "jk-hud");
  assert.equal(hud.getAttribute("data-component"), "TopHudCapsule");
  const meters = byClass(hud, "jk-meter");
  assert.deepEqual(meters.map((m) => m.getAttribute("aria-label")), ["กาย ห้าจากห้า", "ใจ สี่จากห้า", "แรง ห้าจากห้า"]);
  assert.equal(byClass(meters[1], "jk-pip--spent").length, 1);
  assert.match(oneByClass(hud, "jk-bonds").getAttribute("aria-label"), /^สายใยกับสหาย: สายใยกับพี่ก้าม ยังไม่มีปม/);
  until((m) => m.scene.nodeId === "a1-13");
  assert.equal(oneByClass(hud, "jk-hud__pouch").getAttribute("aria-label"), "เปิดกระเป๋าสาน มีของสองจากสี่ช่อง");
  assert.equal(byClass(hud, "jk-pouch__cell--held").length, 2);
  assert.doesNotMatch(hud.textContent, /[0-9]/, "the capsule shows no number");
});

test("TC-S5-VN-001 the camp draws its board in the dock; only the boundary still tells the host through data-pending", () => {
  const { root, until } = screen();
  until((m) => m.mode === "CAMP");
  assert.equal(root.getAttribute("data-pending"), null);
  assert.equal(oneByClass(root, "jk-camp").hidden, false);
  assert.equal(oneByClass(root, "jk-dialogue").hidden, true);
  assert.equal(oneByClass(root, "jk-choices").hidden, true);
  until((m) => m.mode === "BOUNDARY");
  assert.equal(root.getAttribute("data-pending"), "boundary");
  assert.equal(oneByClass(root, "jk-dialogue").hidden, true);
  assert.equal(oneByClass(root, "jk-camp").hidden, true);
});

test("TC-S5-VN-001 a new pose cross-fades out the old one and releases its image", async () => {
  const { root, loader, timers, until } = screen();
  until((m) => m.scene.nodeId === "a1-03" && m.line !== null);
  await flush();
  const leaving = byClass(root, "jk-actor").filter((a) => a.getAttribute("data-state") === "leaving");
  assert.ok(leaving.length > 0, "the a1-01 cast leaves when a1-03 opens");
  timers.runAll();
  assert.equal(byClass(root, "jk-actor").filter((a) => a.getAttribute("data-state") === "leaving").length, 0);
  assert.ok(loader.releases.length >= leaving.length, "each leaving actor released its image");
});

test("TC-S5-INLINE-001 a clash card arms first, commits clashAct with the revision, and digits pick the basic row", () => {
  const { root, document, commands, until } = screen();
  const choose = until((m) => m.mode === "CLASH_CHOOSE");
  assert.equal(root.getAttribute("data-clash"), "choose");
  assert.equal(oneByClass(root, "jk-tray").hidden, false);
  assert.equal(oneByClass(root, "jk-dialogue").hidden, true);
  assert.equal(document.activeElement.getAttribute("data-key"), "strike", "focus moves to the first card of the tray");
  const before = commands.length;
  document.key("2");
  assert.equal(commands.length, before, "first press arms");
  document.key("2");
  assert.deepEqual(commands.at(-1), { kind: "clashAct", args: { action: "guard", revision: choose.revision } });
  assert.equal(root.getAttribute("data-clash"), "resolve");
  assert.equal(document.activeElement, oneByClass(root, "jk-dialogue__next"));
  assert.equal(oneByClass(root, "jk-intent").hidden, false);
  assert.equal(oneByClass(root, "jk-gauge").hidden, false);
});
