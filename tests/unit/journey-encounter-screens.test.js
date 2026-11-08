import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { offerApplies } from "../../src/core/domain/encounters/pouch-offer.js";
import { effectSummary } from "../../src/core/domain/journey/effects.js";
import { createJourneySession } from "../../src/core/use-cases/journey-session.js";
import { createJourneyMediaIndex } from "../../src/data/assets/journey-media.js";
import { createJourneyPresentation } from "../../src/data/content/journey-presentation.js";
import { TH_JOURNEY } from "../../src/data/localization/th-journey.js";
import { JOURNEY_DEFAULT_SETTINGS } from "../../src/data/persistence/journey-device-records.js";
import { MICRO_AUTO_MS, MICRO_DRIFT, MICRO_HOLD_MS, MICRO_SETTLE_MS, STITCH_GUIDES } from "../../src/ui/journey/components/micro-prompt.js";
import { createJourneyRenderer } from "../../src/ui/journey/journey-renderer.js";
import { NOW, SESSION_ID, loadAct1Package, planned } from "../helpers/journey-driver.js";
import { JourneyDocument, byClass, manualFrames, manualSchedule, nodes, oneByClass, placeBox, recordingLoader } from "../helpers/journey-dom.js";
import { loadMini } from "../helpers/journey-storage.js";

/**
 * C5b screens on real sessions: the camp clock and board with the ready picker, the four kinds of
 * micro-action and the keepsake offer (UX §4 · §5 · §7, ADR-P0-020 D5, PO decisions 2026-11-08).
 * The pouch offer and three of the micro kinds come from the mini package, because Act 1 has none.
 * Trace: TC-S5-UX-001, TC-S5-INLINE-001, TC-S5-A11Y-001, TC-S5-STATE-001, ADR-P0-034 D9.
 */
const manifest = JSON.parse(readFileSync(new URL("../../assets/images/asset-manifest-v2.json", import.meta.url), "utf8"));
const ACT1 = loadAct1Package();
const MINI = loadMini();
const PLAN_ACT1 = planned({ "a1-03": "rain", "a1-06": "grit", "a1-13": "a" });
const PLAN_MINI = planned({ n02: "major-wind" });
const BUTTON = "item_teuk_peuak_button", SEEDS = "item_kib_glowing_seeds", GUARD = "item_kab_bark_guard", GEAR = "item_pkam_tin_gear", RIBBON = "item_fiw_sun_ribbon";

const pouchOf = (held) => ({ capacity: 4, held: [...held], acquired: [...held], released: [], remembered: [...held], memory: [] });

/** Play a session with a policy until `stop(view)` holds. */
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

/** The same state with a changed payload, admitted again by Core (as a saved state would be). */
function variant(session, state, change) {
  const copy = structuredClone(state);
  change(copy.payload);
  return session.restore(copy);
}

/** A renderer on the DOM double over a real session: every command goes back to Core. */
function encounterScreen(pkg, session, state, { settings = {} } = {}) {
  const media = createJourneyMediaIndex({ manifest, identity: { key: `test:${pkg.package.id}` }, baseUrl: "http://127.0.0.1:8000/" });
  const presentation = createJourneyPresentation({ pkg, media, messages: TH_JOURNEY });
  const document = new JourneyDocument();
  const host = document.createElement("main");
  document.body.append(host);
  const screen = { state, model: null, commands: [], pouchOpened: 0, timers: manualSchedule(), frames: manualFrames(), document, settings: { ...JOURNEY_DEFAULT_SETTINGS, ...settings } };
  const show = (events = []) => {
    screen.model = presentation.present({ phase: "playing", settings: screen.settings, persistence: "active", view: session.view(screen.state), events, notice: null });
    screen.renderer.render(screen.model);
  };
  screen.renderer = createJourneyRenderer({
    document, root: host, messages: TH_JOURNEY, loadImage: recordingLoader().loadImage,
    schedule: screen.timers.schedule, frame: screen.frames.frame, now: screen.frames.now, prefersReducedMotion: () => false,
    onPouch: () => { screen.pouchOpened += 1; },
    onCommand: (kind, args) => {
      screen.commands.push({ kind, args });
      const result = session[kind](screen.state, { ...args, now: NOW });
      assert.ok(result.ok, JSON.stringify(result.error));
      screen.state = result.state;
      show(result.events);
    },
  });
  screen.root = screen.renderer.element;
  screen.live = () => nodes(screen.root).find((node) => node.getAttribute("aria-live") === "polite").textContent;
  screen.card = (container, key) => byClass(container, "jk-card").find((card) => card.getAttribute("data-key") === key);
  screen.note = (node) => byClass(node, "jk-card__note")[0] ?? byClass(node, "jk-slot__note")[0];
  show();
  return screen;
}

// ---------------------------------------------------------------------------------------
// Core: what a card gives, and which offer choices fit the pouch
// ---------------------------------------------------------------------------------------
test("TC-S5-UX-001 Core names what an effect list gives, so a card can say it before it is pressed", () => {
  assert.deepEqual(effectSummary([
    { op: "meter.add", meter: "hp", amount: 1 }, { op: "meter.add", meter: "hp", amount: 1 }, { op: "meter.add", meter: "sta", amount: 2 },
    { op: "bond.add", bond: "teuk", amount: 1 }, { op: "item.ready", item: GUARD }, { op: "item.grant", item: GEAR },
    { op: "item.release", item: SEEDS }, { op: "flag.set", flag: "teuk_splint" }, { op: "meter.spend", meter: "sta", amount: 1 }, { op: "meter.hazard", meter: "mind", amount: 1 },
  ]), { meters: { hp: 2, sta: 2 }, bonds: { teuk: 1 }, ready: [GUARD], grant: [GEAR], release: [SEEDS] });
  assert.deepEqual(effectSummary(undefined), { meters: {}, bonds: {}, ready: [], grant: [], release: [] });
  const session = createJourneySession(ACT1);
  const camp = session.view(reach(session, PLAN_ACT1, (v) => v.mode === "CAMP")).camp;
  assert.deepEqual(camp.activities.map((a) => [a.key, a.summary.meters, a.summary.ready]), [["eat", { hp: 1, sta: 1 }, []], ["kab", {}, [GUARD]], ["kib", {}, [SEEDS]], ["mother", { mind: 1 }, []]]);
});

test("TC-S5-UX-001 the offer lists only the choices that fit the pouch as it is (A3-13); the button is never handed on", () => {
  const session = createJourneySession(MINI);
  const swap = reach(session, PLAN_MINI, (v) => v.mode === "POUCH_SWAP");
  const offered = (state) => session.view(state).pouch.options.map((o) => [o.key, o.offered, o.available]);
  assert.deepEqual(offered(swap), [["take", true, true], ["release-seeds", false, false], ["refuse", true, true]]);
  assert.deepEqual(offered(variant(session, swap, (p) => { p.journey.pouch = pouchOf([BUTTON, SEEDS, GUARD, GEAR]); })), [["take", false, false], ["release-seeds", true, true], ["refuse", true, true]]);
  assert.deepEqual(offered(variant(session, swap, (p) => { p.journey.pouch = pouchOf([BUTTON, RIBBON, GUARD, GEAR]); })), [["take", false, false], ["release-seeds", false, false], ["refuse", true, true]], "a keepsake not held cannot be handed on");
  const full = { pouch: pouchOf([BUTTON, SEEDS, GUARD, GEAR]) };
  assert.equal(offerApplies({ kind: "release", choice: { release: BUTTON } }, full, new Set([BUTTON])), false);
  assert.deepEqual(session.view(swap).pouch.options[0].summary.bonds, { teuk: 1 });
});

// ---------------------------------------------------------------------------------------
// Camp
// ---------------------------------------------------------------------------------------
test("TC-S5-UX-001 the C1 camp shows its shell clock and every activity with what it gives; the leave button waits for the drops", () => {
  const session = createJourneySession(ACT1);
  const s = encounterScreen(ACT1, session, reach(session, PLAN_ACT1, (v) => v.mode === "CAMP"));
  const camp = s.model.camp;
  assert.deepEqual(camp.timer, { vessel: "shell", total: 2, left: 2, text: "กะลารับได้อีกสองหยด" });
  assert.deepEqual(camp.cards.map((c) => [c.label, c.effect, c.art.icon ?? c.art.keepsake?.assetId, c.shortcut, c.available]), [
    ["กินข้าวเย็นกับพ่อแม่", "กาย ●  แรง ●", "moth", 1, true],
    ["คุยกับพี่กับ", "พร้อมผสาน", GUARD, 2, true],
    ["ช่วยกิบสานกระเป๋าให้เสร็จ", "พร้อมผสาน", SEEDS, 3, true],
    ["นั่งข้างแม่", "ใจ ●", "star", 4, true],
  ]);
  assert.equal(camp.cards[0].description, "กินข้าวเย็นกับพ่อแม่ · ได้กายหนึ่งเม็ดและแรงหนึ่งเม็ด");
  assert.equal(camp.cards[1].description, "คุยกับพี่กับ · สนับข้อมือเปลือกไม้พร้อมผสานในศึกถัดไป");
  assert.deepEqual(camp.leave, { label: "ออกเดินทางต่อ", available: false, note: "ยังพักต่อได้อีก" });
  assert.equal(camp.picker, null, "C1 has no ready activity of its own");
  const board = oneByClass(s.root, "jk-camp");
  assert.equal(board.hidden, false);
  assert.equal(board.getAttribute("data-component"), "CampActivityBoard");
  assert.equal(oneByClass(s.root, "jk-dialogue").hidden, true, "the board takes the dialogue card's place");
  assert.equal(s.document.activeElement, s.card(board, "eat"), "focus moves to the first open activity");
  assert.match(s.live(), /สิ่งที่ทำได้ใต้ชายคา · กะลารับได้อีกสองหยด$/);
  const timer = oneByClass(s.root, "jk-camp-timer");
  assert.equal(timer.getAttribute("data-component"), "CampDropTimer");
  assert.equal(timer.getAttribute("aria-label"), "กะลารับได้อีกสองหยด");
  assert.equal(byClass(timer, "jk-camp-timer__icon")[0].getAttribute("data-icon"), "shell");
  const words = [timer, ...byClass(board, "jk-card__label"), ...byClass(board, "jk-card__note")].map((node) => node.textContent).join(" ");
  assert.doesNotMatch(words, /[0-9๐-๙]/, "no number on the clock, the labels or the effect lines (the keyboard shortcut marks are not story values)");
});

test("TC-S5-INLINE-001 an activity arms then commits campPick; a drop falls while its line is read; the frog leaves only when done", () => {
  const session = createJourneySession(ACT1);
  const s = encounterScreen(ACT1, session, reach(session, PLAN_ACT1, (v) => v.mode === "CAMP"));
  const board = oneByClass(s.root, "jk-camp");
  const timer = oneByClass(s.root, "jk-camp-timer");
  const leave = oneByClass(s.root, "jk-camp__leave");
  const marks = () => byClass(timer, "jk-camp-timer__mark").map((m) => m.getAttribute("data-state"));
  assert.deepEqual(marks(), ["left", "left"]);
  assert.equal(leave.getAttribute("aria-disabled"), "true");
  leave.click();
  assert.equal(s.commands.length, 0, "the leave button is closed while drops are left");
  const revision = s.model.revision;
  s.document.key("2");
  assert.equal(s.commands.length, 0, "the first press arms");
  assert.equal(s.card(board, "kab").getAttribute("aria-pressed"), "true");
  assert.equal(s.note(s.card(board, "kab")).textContent, TH_JOURNEY.ui.armedHint);
  s.document.key("2");
  assert.deepEqual(s.commands.at(-1), { kind: "campPick", args: { activity: "kab", revision } });
  assert.equal(s.model.mode, "VN");
  assert.equal(board.hidden, true);
  assert.equal(oneByClass(s.root, "jk-dialogue").hidden, false, "the activity's own line is read in the dialogue card");
  assert.equal(timer.hidden, false, "the clock stays while the line is read");
  assert.deepEqual(marks(), ["used", "left"]);
  assert.equal(byClass(timer, "jk-camp-timer__mark")[0].getAttribute("data-fresh"), "true", "the drop that fell plays once");
  assert.equal(timer.getAttribute("aria-label"), "กะลารับได้อีกหนึ่งหยด");
  assert.ok(s.model.toasts.some((t) => t.kind === "ready" && t.text === "สนับข้อมือเปลือกไม้ พร้อมผสาน"));
  oneByClass(s.root, "jk-dialogue__next").click();
  assert.equal(s.model.mode, "CAMP");
  const kab = s.card(board, "kab");
  assert.deepEqual([kab.getAttribute("data-chosen"), kab.getAttribute("aria-disabled"), s.note(kab).textContent], ["true", "true", "พร้อมผสาน"], "a chosen card keeps its effect line");
  assert.equal(byClass(kab, "jk-tag").find((tag) => !tag.hidden).textContent, "เลือกแล้ว");
  assert.equal(s.document.activeElement, s.card(board, "eat"), "back on the board, focus is on the first open card");
  s.card(board, "mother").click();
  s.card(board, "mother").click();
  oneByClass(s.root, "jk-dialogue__next").click();
  assert.equal(s.model.camp.leave.available, true);
  assert.equal(timer.getAttribute("aria-label"), "กะลาเต็มแล้ว");
  assert.equal(s.note(s.card(board, "eat")).textContent, "หมดเวลาพักแล้ว");
  assert.equal(leave.getAttribute("aria-disabled"), null);
  assert.equal(s.document.activeElement, leave, "with the drops spent, focus goes to the leave button");
  const last = s.model.revision;
  leave.click();
  assert.deepEqual(s.commands.at(-1), { kind: "campLeave", args: { revision: last } });
  assert.equal(s.model.scene.nodeId, "a1-11");
  assert.equal(timer.hidden, true);
});

test("TC-S5-UX-001 closed camp cards keep their reason: nothing to ready, not now, or the other way was chosen (PO 2026-11-08)", () => {
  const session = createJourneySession(MINI);
  const camp = reach(session, PLAN_MINI, (v) => v.mode === "CAMP");
  const s = encounterScreen(MINI, session, camp);
  assert.deepEqual(s.model.camp.cards.map((c) => [c.key, c.available, c.reason, c.effect]), [
    ["eat", true, null, "กาย ●  แรง ●"],
    ["talk", true, null, "สายใยพี่ก้าม +"],
    ["ready", false, "ไม่มีของให้เตรียมแล้ว", "พร้อมผสาน"],
    ["splint", false, "ยังทำทางนี้ไม่ได้ในตอนนี้", "สละสนับข้อมือเปลือกไม้"],
    ["wrap", true, null, null],
  ]);
  assert.equal(s.model.camp.cards[1].art.face.assetId, "char_pkam_neutral_guarded", "a talk shows the companion's face");
  assert.deepEqual([s.model.camp.cards[2].art.icon, s.model.camp.cards[3].art.keepsake.assetId], ["pouch", GUARD]);
  const guarded = variant(session, camp, (p) => { p.journey.pouch = pouchOf([GUARD]); });
  const wrapped = session.campPick(guarded, { revision: guarded.revision, now: NOW, activity: "wrap" }).state;
  const t = encounterScreen(MINI, session, wrapped);
  const splint = t.model.camp.cards.find((c) => c.key === "splint");
  assert.deepEqual([splint.available, splint.reason], [false, "เลือกอีกทางไปแล้ว"]);
  assert.match(splint.description, /สละสนับข้อมือเปลือกไม้ · เลือกอีกทางไปแล้ว$/);
});

test("TC-S5-UX-001 เตรียมของให้พร้อม opens the woven slots; Escape returns to the cards; a slot arms then readies that keepsake", () => {
  const session = createJourneySession(MINI);
  const holding = variant(session, reach(session, PLAN_MINI, (v) => v.mode === "CAMP"), (p) => { p.journey.pouch = pouchOf([GEAR, SEEDS]); });
  const s = encounterScreen(MINI, session, holding);
  const board = oneByClass(s.root, "jk-camp");
  const ready = s.card(board, "ready");
  assert.equal(ready.getAttribute("aria-disabled"), null);
  ready.click();
  assert.equal(s.commands.length, 0, "opening the picker sends nothing");
  assert.equal(board.getAttribute("data-view"), "picker");
  assert.equal(oneByClass(s.root, "jk-camp__grid").hidden, true);
  assert.equal(oneByClass(s.root, "jk-camp__leave").hidden, true);
  const slots = byClass(oneByClass(s.root, "jk-camp__picker"), "jk-slot");
  assert.deepEqual(slots.map((slot) => [slot.getAttribute("data-key"), slot.getAttribute("data-available"), byClass(slot, "jk-slot__name")[0].textContent]), [
    [`item:${GEAR}`, "true", "เฟืองสังกะสีไขลาน"], [`item:${SEEDS}`, "true", "เมล็ดต้อยติ่งเรืองแสง"], [null, "false", "ช่องว่าง"], [null, "false", "ช่องว่าง"],
  ]);
  assert.equal(s.document.activeElement, slots[0]);
  assert.match(s.live(), /เลือกของหนึ่งชิ้นให้พร้อมผสาน/);
  s.document.key("Escape");
  assert.equal(board.getAttribute("data-view"), "cards");
  assert.equal(s.document.activeElement, ready, "focus returns to the card that opened the picker");
  ready.click();
  slots[2].click();
  assert.equal(s.commands.length, 0, "an empty slot does nothing");
  const revision = s.model.revision;
  s.document.key("2");
  assert.equal(slots[1].getAttribute("aria-pressed"), "true");
  assert.equal(s.note(slots[1]).textContent, TH_JOURNEY.ui.armedHint);
  s.document.key("2");
  assert.deepEqual(s.commands.at(-1), { kind: "campPick", args: { activity: "ready", item: SEEDS, revision } });
  assert.deepEqual(s.state.payload.journey.ready, [GEAR, SEEDS].filter((item) => s.state.payload.journey.ready.includes(item)));
  assert.ok(s.state.payload.journey.ready.includes(SEEDS));
  assert.equal(s.state.payload.history.at(-1).action, `ready.${SEEDS}`);
});

// ---------------------------------------------------------------------------------------
// Micro-actions
// ---------------------------------------------------------------------------------------
test("TC-S5-UX-001 MA-1: Space, a tap and an assistive click make three ripples; the pipe answers; microDone goes once with the revision", () => {
  const session = createJourneySession(ACT1);
  const s = encounterScreen(ACT1, session, reach(session, PLAN_ACT1, (v) => v.mode === "MICRO"));
  const micro = oneByClass(s.root, "jk-micro");
  const target = oneByClass(s.root, "jk-micro__target");
  const hint = oneByClass(s.root, "jk-micro__hint");
  assert.deepEqual([micro.getAttribute("data-component"), micro.getAttribute("data-kind"), micro.getAttribute("data-state")], ["MicroPrompt", "tap3", "idle"]);
  assert.equal(s.document.activeElement, target);
  assert.equal(target.getAttribute("aria-label"), "แตะวงคลื่นบนท่อสามครั้ง");
  assert.equal(hint.textContent, "แตะวงคลื่นบนท่อสามครั้ง");
  assert.match(s.live(), /แตะวงคลื่นบนท่อสามครั้ง · แตะสามครั้ง หรือกด Space สามครั้ง$/);
  assert.equal(oneByClass(s.root, "jk-hud__pouch").getAttribute("aria-disabled"), "true", "the HUD is dim; only the gear works");
  s.document.key("i");
  oneByClass(s.root, "jk-hud__pouch").click();
  assert.equal(s.pouchOpened, 0);
  const revision = s.model.revision;
  s.document.key(" ");
  assert.equal(hint.getAttribute("data-gone"), "true", "the hint leaves the moment the player starts, keeping its box");
  s.document.key(" ", { repeat: true });
  assert.equal(byClass(s.root, "jk-micro__ripple").length, 1, "a held key's repeats are not taps");
  assert.equal(s.document.keyUp(" ").defaultPrevented, true, "the key-up keeps the button from clicking");
  placeBox(target, { left: 100, top: 500, width: 168, height: 168 });
  target.dispatch("pointerdown", { clientX: 142, clientY: 584, pointerId: 1, button: 0 });
  target.dispatch("pointerup", { pointerId: 1 });
  const ripples = byClass(s.root, "jk-micro__ripple");
  assert.deepEqual([ripples[1].style.getPropertyValue("--x"), ripples[1].style.getPropertyValue("--y")], ["25%", "50%"]);
  assert.equal(s.live(), "แตะแล้วสองครั้ง");
  target.click();
  assert.equal(micro.getAttribute("data-state"), "done");
  assert.equal(s.live(), "ครบแล้ว");
  assert.equal(byClass(s.root, "jk-micro__ripple").length, 3);
  assert.equal(s.commands.length, 0, "the story waits for the last ripple and the answer");
  assert.ok(s.timers.queue.some((entry) => entry.ms === MICRO_SETTLE_MS.tap3));
  s.document.key(" ");
  assert.equal(byClass(s.root, "jk-micro__ripple").length, 3, "nothing more after done");
  s.timers.runAll();
  assert.deepEqual(s.commands, [{ kind: "microDone", args: { revision } }]);
  assert.equal(s.model.scene.nodeId, "a1-13");
  assert.equal(micro.hidden, true);
  assert.equal(oneByClass(s.root, "jk-hud__pouch").getAttribute("aria-disabled"), null);
});

test("TC-S5-UX-001 MA-4: holding fills the light in three seconds, letting go fills it slower by itself, and nothing can fail", () => {
  const session = createJourneySession(MINI);
  const s = encounterScreen(MINI, session, reach(session, PLAN_MINI, (v) => v.mode === "MICRO" && v.node.id === "n10"));
  const micro = oneByClass(s.root, "jk-micro");
  assert.equal(micro.getAttribute("data-kind"), "hold");
  assert.equal(s.root.getAttribute("data-micro"), "hold");
  s.document.key(" ");
  assert.equal(micro.getAttribute("data-holding"), "true");
  s.frames.tick(MICRO_HOLD_MS / 2);
  assert.equal(micro.style.getPropertyValue("--fill"), "0.500");
  assert.equal(oneByClass(s.root, "jk-micro__ring-fill").getAttribute("stroke-dashoffset"), "50");
  s.document.keyUp(" ");
  assert.equal(micro.getAttribute("data-holding"), "false");
  s.frames.tick((MICRO_HOLD_MS * MICRO_DRIFT) / 4);
  assert.equal(micro.style.getPropertyValue("--fill"), "0.750", "after a release the light keeps filling, slower");
  assert.equal(s.root.style.getPropertyValue("--micro-fill"), "0.750", "the screen glows with it");
  s.frames.tick((MICRO_HOLD_MS * MICRO_DRIFT) / 4);
  assert.equal(micro.getAttribute("data-state"), "done");
  s.timers.runAll();
  assert.equal(s.commands.at(-1).kind, "microDone");
  assert.equal(s.model.mode, "DECISION", "MA-4 opens the plan choice");
  assert.equal(s.root.style.getPropertyValue("--micro-fill"), "0.000");
});

test("TC-S5-UX-001 stitch: a tap on a gold point or a drag into it sews a stitch that stays; Space sews the next", () => {
  const session = createJourneySession(MINI);
  const ending = reach(session, PLAN_MINI, (v) => v.mode === "ENDING_RESONANCE");
  const s = encounterScreen(MINI, session, variant(session, ending, (p) => { p.cursor = { node: "n13", beat: "micro", line: 0 }; }));
  const target = oneByClass(s.root, "jk-micro__target");
  const cloth = oneByClass(s.root, "jk-micro__cloth");
  placeBox(cloth, { left: 75, top: 520, width: 240, height: 160 });
  const at = ([x, y], dx = 0, dy = 0) => ({ clientX: 75 + x + dx, clientY: 520 + y + dy, pointerId: 7, button: 0 });
  const sewn = () => byClass(s.root, "jk-micro__thread").filter((thread) => !(thread.getAttribute("class") ?? "").includes("--live")).length;
  const live = byClass(s.root, "jk-micro__thread--live")[0];
  target.dispatch("pointerdown", at([120, 80]));
  assert.equal(sewn(), 0, "the button itself is not a guide point");
  target.dispatch("pointerup", { pointerId: 7 });
  target.dispatch("pointerdown", at(STITCH_GUIDES[0], 8, -6));
  assert.equal(sewn(), 1, "a tap within 22 px of a point sews it");
  target.dispatch("pointermove", at([150, 100]));
  assert.notEqual(live.getAttribute("d"), "", "the thread follows the finger");
  target.dispatch("pointermove", at(STITCH_GUIDES[1]));
  assert.equal(sewn(), 2, "dragging into the next point sews it");
  target.dispatch("pointerup", { pointerId: 7 });
  assert.equal(live.getAttribute("d"), "");
  assert.deepEqual(byClass(s.root, "jk-micro__guide").map((guide) => guide.getAttribute("data-done")), ["true", "true", "false"]);
  assert.equal(s.live(), "เย็บแล้วสองฝี");
  s.document.key(" ");
  assert.equal(sewn(), 3);
  assert.equal(oneByClass(s.root, "jk-micro").getAttribute("data-state"), "done");
  s.timers.runAll();
  assert.equal(s.commands.at(-1).kind, "microDone");
});

test("TC-S5-UX-001 press takes one tap; with automatic micro-actions on, any kind completes by itself after one second", () => {
  const session = createJourneySession(MINI);
  const ending = reach(session, PLAN_MINI, (v) => v.mode === "ENDING_RESONANCE");
  const pressAt = variant(session, ending, (p) => { p.cursor = { node: "n12", beat: "micro", line: 0 }; });
  const manual = encounterScreen(MINI, session, pressAt);
  assert.equal(oneByClass(manual.root, "jk-micro").getAttribute("data-kind"), "press");
  assert.equal(manual.timers.queue.some((entry) => entry.ms === MICRO_AUTO_MS), false, "no automatic timer unless the player asks for it");
  oneByClass(manual.root, "jk-micro__target").click();
  assert.equal(oneByClass(manual.root, "jk-micro").getAttribute("data-state"), "done");
  const auto = encounterScreen(MINI, session, variant(session, ending, (p) => { p.cursor = { node: "n13", beat: "micro", line: 0 }; }), { settings: { autoMicro: true } });
  const queued = auto.timers.queue.find((entry) => entry.ms === MICRO_AUTO_MS);
  assert.ok(queued, "the automatic setting waits one second");
  queued.callback();
  assert.equal(oneByClass(auto.root, "jk-micro").getAttribute("data-state"), "done");
  assert.equal(byClass(auto.root, "jk-micro__guide").filter((guide) => guide.getAttribute("data-done") === "true").length, 3, "every stitch is drawn");
  assert.equal(auto.commands.length, 0);
  auto.timers.runAll();
  assert.deepEqual(auto.commands.map((command) => command.kind), ["microDone"]);
});

// ---------------------------------------------------------------------------------------
// Keepsake offer
// ---------------------------------------------------------------------------------------
test("TC-S5-UX-001 with a free slot the offer shows take and refuse; the button's slot keeps its knot and ฝากไม่ได้", () => {
  const session = createJourneySession(MINI);
  const swap = variant(session, reach(session, PLAN_MINI, (v) => v.mode === "POUCH_SWAP"), (p) => { p.journey.pouch = pouchOf([BUTTON, GEAR]); });
  const s = encounterScreen(MINI, session, swap);
  const sheet = oneByClass(s.root, "jk-pouch-sheet");
  assert.deepEqual([sheet.hidden, sheet.getAttribute("data-component")], [false, "PouchSwapSheet"]);
  const incoming = byClass(sheet, "jk-slot--incoming")[0];
  assert.deepEqual([byClass(incoming, "jk-slot__name")[0].textContent, s.note(incoming).textContent], ["นกหวีดทองเหลือง", "ของใหม่"]);
  const slots = byClass(oneByClass(sheet, "jk-pouch-sheet__slots"), "jk-slot");
  assert.deepEqual(slots.map((slot) => [byClass(slot, "jk-slot__name")[0].textContent, slot.getAttribute("data-locked"), s.note(slot).hidden ? null : s.note(slot).textContent]), [
    ["กระดุมทองเหลือง", "true", "ฝากไม่ได้"], ["เฟืองสังกะสีไขลาน", null, null], ["ช่องว่าง", null, null], ["ช่องว่าง", null, null],
  ]);
  const cards = byClass(sheet, "jk-card").filter((card) => !card.hidden);
  assert.deepEqual(cards.map((card) => [card.getAttribute("data-key"), card.getAttribute("data-kind"), s.note(card).textContent]), [["take", "take", "สายใยเตื๊อก +"], ["refuse", "refuse", "เก็บไว้ในความทรงจำ"]]);
  assert.equal(s.model.pouch.cards[1].description, "ขอให้เก็บไว้เอง · ของชิ้นนี้จะอยู่ในความทรงจำของกระเป๋า");
  assert.equal(s.document.activeElement, cards[0]);
  assert.match(s.live(), /ของใหม่ นกหวีดทองเหลือง$/);
  const revision = s.model.revision;
  s.document.key("1");
  s.document.key("1");
  assert.deepEqual(s.commands.at(-1), { kind: "pouchDecide", args: { option: "take", revision } });
  assert.ok(s.state.payload.journey.pouch.held.includes("item_teuk_whistle_charm"));
  assert.deepEqual(s.model.toasts.map((toast) => toast.text), ["สายใยเตื๊อก เพิ่มขึ้น 1", "ได้รับ นกหวีดทองเหลือง"]);
  assert.equal(sheet.hidden, true);
});

test("TC-S5-INLINE-001 with all four slots full, pointing at a hand-on lifts the keepsake that would go; arming keeps it; committing hands it on", () => {
  const session = createJourneySession(MINI);
  const swap = variant(session, reach(session, PLAN_MINI, (v) => v.mode === "POUCH_SWAP"), (p) => { p.journey.pouch = pouchOf([BUTTON, SEEDS, GUARD, GEAR]); });
  const s = encounterScreen(MINI, session, swap);
  const sheet = oneByClass(s.root, "jk-pouch-sheet");
  const cards = byClass(sheet, "jk-card").filter((card) => !card.hidden);
  assert.deepEqual(cards.map((card) => [card.getAttribute("data-key"), card.getAttribute("data-kind"), s.note(card).textContent]), [["release-seeds", "handon", "ฝากเมล็ดต้อยติ่งเรืองแสง"], ["refuse", "refuse", "เก็บไว้ในความทรงจำ"]]);
  const seeds = byClass(oneByClass(sheet, "jk-pouch-sheet__slots"), "jk-slot")[1];
  const lifted = () => [seeds.getAttribute("data-lifted"), s.note(seeds).hidden ? null : s.note(seeds).textContent];
  assert.deepEqual(lifted(), [null, null]);
  cards[0].dispatch("pointerenter");
  assert.deepEqual(lifted(), ["true", "จะฝาก"]);
  cards[0].dispatch("pointerleave");
  assert.deepEqual(lifted(), [null, null]);
  cards[0].click();
  assert.equal(s.commands.length, 0, "the first press arms");
  assert.deepEqual(lifted(), ["true", "จะฝาก"], "an armed hand-on keeps its keepsake lifted");
  s.document.key("Escape");
  assert.deepEqual(lifted(), [null, null]);
  const revision = s.model.revision;
  cards[0].click();
  cards[0].click();
  assert.deepEqual(s.commands.at(-1), { kind: "pouchDecide", args: { option: "release-seeds", revision } });
  const pouch = s.state.payload.journey.pouch;
  assert.deepEqual([pouch.held.includes(SEEDS), pouch.released.includes(SEEDS), pouch.held.includes("item_teuk_whistle_charm"), pouch.held.includes(BUTTON)], [false, true, true, true]);
  assert.ok(s.model.toasts.some((toast) => toast.kind === "handed-on" && toast.text === "ฝาก เมล็ดต้อยติ่งเรืองแสง แล้ว"));
});
