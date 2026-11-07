import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createJourneyMediaIndex } from "../../src/data/assets/journey-media.js";
import { STAGE_SLOTS, createJourneyPresentation } from "../../src/data/content/journey-presentation.js";
import { TH_JOURNEY, thaiCount } from "../../src/data/localization/th-journey.js";
import { planned } from "../helpers/journey-driver.js";
import { SpyStorage, createApp, value } from "../helpers/journey-storage.js";

/** Trace: TC-S5-VN-001, TC-S5-HUD-001, TC-S5-A11Y-001, ADR-P0-034 D9.2/D10, UX §1.1–§1.8 · §2.1. */
const manifest = JSON.parse(readFileSync(new URL("../../assets/images/asset-manifest-v2.json", import.meta.url), "utf8"));
const PLAN = planned({ "a1-03": "rain", "a1-06": "grit", "a1-13": "a" });

function setup() {
  const app = createApp(new SpyStorage());
  value(app.boot());
  const { identity, package: pkg } = value(app.content());
  const media = createJourneyMediaIndex({ manifest, identity, baseUrl: "http://127.0.0.1:8000/" });
  const presentation = createJourneyPresentation({ pkg, media, messages: TH_JOURNEY });
  return { app, pkg, presentation, media };
}

/** Every model of a whole Act 1 play, with the application values they came from. */
function playAll() {
  const { app, pkg, presentation, media } = setup();
  const seen = [];
  let result = app.newGame();
  for (let i = 0; i < 400 && result.ok; i += 1) {
    seen.push({ value: result.value, model: presentation.present(result.value) });
    const view = result.value.view;
    const command = PLAN(view);
    if (command === null) break;
    result = app.perform(command.kind, { ...(command.args ?? {}), revision: view.revision });
  }
  assert.ok(result.ok, JSON.stringify(result.error));
  return { seen, pkg, media };
}

test("TC-S5-VN-001 every beat of Act 1 is shown in the package's own words, with no digit on screen", () => {
  const { seen, pkg } = playAll();
  const bodies = new Map(pkg.texts.map((entry) => [entry.id, entry]));
  const names = new Map(pkg.characters.map((entry) => [entry.id, entry.name]));
  let lines = 0;
  for (const { value: appView, model } of seen) {
    assert.ok(Object.isFrozen(model) && Object.isFrozen(model.scene));
    if (model.line !== null) {
      lines += 1;
      const source = bodies.get(appView.view.line.text);
      assert.equal(model.line.text, source.body);
      assert.equal(model.line.speaker, source.speaker === "narrator" ? null : names.get(source.speaker));
      assert.doesNotMatch(model.line.text, /[0-9๐-๙]/, "no number in the dialogue card (UX §0.1)");
      assert.equal(model.line.announcement, model.line.speaker === null ? model.line.text : `${model.line.speaker}: ${model.line.text}`);
    }
    for (const option of model.decision?.options ?? []) assert.doesNotMatch(option.label + option.description, /[0-9๐-๙]/);
  }
  assert.ok(lines > 100, `read ${lines} lines`);
  assert.equal(seen.at(-1).model.pending, "boundary");
});

test("TC-S5-VN-001 modes still to come in C5 are reported as pending, with no line on the card", () => {
  const { seen } = playAll();
  const pendingOf = new Map();
  for (const { model } of seen) if (model.pending !== null) pendingOf.set(model.mode, model.pending);
  assert.deepEqual(Object.fromEntries(pendingOf), { CAMP: "camp", MICRO: "micro", BOUNDARY: "boundary" });
  for (const { model } of seen) {
    if (["CLASH_CHOOSE", "CAMP", "MICRO", "BOUNDARY"].includes(model.mode)) assert.equal(model.line, null, model.mode);
    if (["VN", "CLASH_INTRO", "CLASH_INTENT", "CLASH_RESOLVE", "CLASH_OUTCOME"].includes(model.mode) && model.scene.title !== null) assert.equal(model.pending, null);
  }
});

test("TC-S5-VN-001 the A1-06 obstacle shows five cards with fixed tag words, pips and method icons from Core's view", () => {
  const { seen } = playAll();
  const model = seen.find(({ model: m }) => m.scene.nodeId === "a1-06" && m.mode === "DECISION").model;
  const options = model.decision.options;
  assert.equal(options.length, 5);
  assert.deepEqual(options.map((o) => o.tags[0]?.text ?? null), ["ทักษะครอบครัว", "ทักษะครอบครัว", "ทักษะครอบครัว", "ยืนหยัดเอง", "ฝืนเอา"]);
  assert.deepEqual(options.map((o) => o.art.icon), ["drop", "jump", "eye", "foot", "foot"]);
  assert.deepEqual(options.map((o) => o.cost.map((c) => `${c.label}${c.pips}`).join("+")), ["", "", "", "แรง1", "กาย1+แรง2"]);
  assert.deepEqual(options.map((o) => o.shortcut), [1, 2, 3, 4, 5]);
  assert.ok(options.every((o) => o.available && o.reason === null && o.tags.length === 1), "Act 1 counts no homesickness");
  assert.equal(options[4].description, "จ · ฝืนเอา · พุ่งข้ามไปทั้งที่ยังไม่ได้ดู · ฝืนเอา · ใช้กายหนึ่งเม็ดและแรงสองเม็ด");
  const story = seen.find(({ model: m }) => m.scene.nodeId === "a1-03" && m.mode === "DECISION").model;
  assert.ok(story.decision.options.every((o) => o.tags.length === 0 && o.art.icon === null && o.cost.length === 0), "story choices carry no method tag");
});

test("TC-S5-HUD-001 the HUD model holds pips, knots and woven cells with every count in words", () => {
  const { seen } = playAll();
  const last = seen.at(-1).model.hud;
  assert.deepEqual(last.meters.map((m) => [m.id, m.label, m.max]), [["hp", "กาย", 5], ["mind", "ใจ", 5], ["sta", "แรง", 5]]);
  for (const meter of last.meters) assert.equal(meter.description, `${meter.label} ${thaiCount(meter.value)}จาก${thaiCount(5)}`);
  assert.deepEqual(last.bonds.map((b) => [b.id, b.knots, b.description]), [
    ["pkam", 0, "สายใยกับพี่ก้าม ยังไม่มีปม"], ["fiw", 0, "สายใยกับเจ้าฟิ้ว ยังไม่มีปม"], ["teuk", 0, "สายใยกับเตื๊อก ยังไม่มีปม"],
  ]);
  assert.equal(last.pouch.slots.length, last.pouch.capacity);
  assert.deepEqual(last.pouch.slots.slice(0, 2).map((s) => s.name), ["เมล็ดต้อยติ่งเรืองแสง", "สนับข้อมือเปลือกไม้"]);
  assert.equal(last.pouch.description, "เปิดกระเป๋าสาน มีของสองจากสี่ช่อง");
  assert.equal(last.pouch.slots[0].image.kind, "keepsake");
});

test("TC-S5-VN-001 the stage places the cast on the five slots and lights only the speaker", () => {
  const { seen } = playAll();
  for (const { model } of seen) {
    for (const actor of model.scene.actors) assert.equal(actor.x, STAGE_SLOTS[actor.slot]);
    const speaking = model.scene.actors.filter((actor) => actor.speaking);
    if (model.line === null || model.line.speakerId === null) assert.equal(speaking.length, 0);
    else assert.ok(speaking.every((actor) => actor.characterId === model.line.speakerId));
  }
  const kib = seen.find(({ model: m }) => m.scene.nodeId === "a1-01" && m.line?.speaker === "กิบ").model;
  assert.deepEqual(kib.scene.actors.map((a) => [a.slot, a.name, a.speaking]), [["left", "กับ", false], ["center", "กบ", false], ["right", "กิบ", true]]);
  assert.equal(kib.scene.description, "บนเวที กับ กบ กิบ");
  assert.deepEqual([kib.scene.actLabel, kib.scene.actTitle, kib.scene.title], ["องก์ 1", "ดาวสามแฉกที่ชายเสื้อ", "เสื้อที่ติดกอกก"]);
});

test("TC-S5-HUD-001 meter changes and keepsakes become toasts; a successful save adds none", () => {
  const { seen } = playAll();
  const toasts = seen.flatMap(({ model }) => model.toasts);
  assert.ok(toasts.some((t) => t.kind === "meter" && t.text === "แรง ลดลง 2" && t.direction === "down"));
  assert.ok(toasts.some((t) => t.kind === "keepsake" && t.text === "ได้รับ เมล็ดต้อยติ่งเรืองแสง"));
  assert.equal(new Set(toasts.map((t) => t.key)).size, toasts.length, "toast keys are unique");
  assert.ok(seen.every(({ model }) => model.notice === null && model.persistence === "active"), "silent save: no notice while saving works");
});

test("TC-S5-SILENT-001 a failure notice is put in words; an unknown one falls back to the save failure", () => {
  const { app, presentation } = setup();
  const playing = value(app.newGame());
  assert.equal(presentation.present({ ...playing, notice: "save-elsewhere" }).notice.text, TH_JOURNEY.notices["save-elsewhere"]);
  assert.equal(presentation.present({ ...playing, notice: "mystery" }).notice.text, TH_JOURNEY.notices["save-failed"]);
  assert.throws(() => presentation.present({ phase: "title" }), TypeError);
  assert.deepEqual(presentation.notices({ notices: ["legacy-archive"] }), [{ id: "legacy-archive", text: TH_JOURNEY.notices["legacy-archive"] }]);
});

test("TC-S5-A11Y-001 interface words exist for every notice the application can raise", async () => {
  const { JOURNEY_APP_NOTICES } = await import("../../src/bootstrap/journey-application.js");
  for (const id of Object.values(JOURNEY_APP_NOTICES)) assert.ok(TH_JOURNEY.notices[id], id);
  assert.equal(thaiCount(4), "สี่");
  assert.equal(thaiCount(12), "12");
});

test("TC-S5-TRAY-001 the R1 clash is shown from Core's view: badge words, gauge, groups, counter tags and the resolve beat", () => {
  const { seen } = playAll();
  const clash = seen.filter(({ model }) => model.clash !== null).map(({ model }) => model);
  assert.deepEqual([...new Set(clash.map((m) => m.clash.beat))], ["intro", "intent", "choose", "resolve", "outcome"]);
  const choose = clash.find((m) => m.clash.beat === "choose").clash;
  assert.equal(choose.intent.label, "แมลงสาบแมนเตรียมใช้ · เงาขยาย");
  assert.deepEqual([choose.max, choose.holdAt, choose.light, choose.turn, choose.turns], [10, 7, 5, 1, 3]);
  assert.deepEqual(choose.groups.map((g) => g.id), ["basic", "family"]);
  assert.deepEqual(choose.groups[0].cards.map((c) => [c.label, c.shortcut, c.tags.map((t) => t.text).join("+")]), [["พุ่งชนกลางฝาย", 1, "แก้ทาง"], ["ตั้งหลักบนหินลอย", 2, "แก้ทาง"], ["หลบหลังกอกก", 3, ""]]);
  assert.ok(choose.groups[1].cards.every((c) => c.shortcut === null));
  assert.equal(choose.groups[1].cards.find((c) => c.key === "s_kab").art.face.assetId, "char_jao_kab_neutral_proud");
  assert.equal(choose.description, "เจตนา เงาขยาย · การ์ดแก้ทางอยู่ในท่าหลักและครอบครัว");
  const resolve = clash.find((m) => m.clash.beat === "resolve").clash;
  assert.equal(resolve.resolved.turn, 1);
  assert.equal(resolve.intent.name, "เงาขยาย", "the resolve beat shows the turn that just resolved");
  const outcome = clash.find((m) => m.clash.beat === "outcome").clash.outcome;
  assert.ok(["decisive", "hold", "narrow"].includes(outcome.kind));
  assert.equal(outcome.text, TH_JOURNEY.clash.outcomes[outcome.kind]);
  assert.doesNotMatch(Object.values(TH_JOURNEY.clash.outcomes).join(), /แพ้/, "no outcome says lost (UX §3.1)");
  assert.ok(clash.every((m) => m.pending === null));
});

test("TC-S5-TRAY-001 the แก้ทาง tag follows the player's setting; ซ้ำ and costs never hide", () => {
  const { app, presentation } = setup();
  let result = app.newGame();
  while (result.value.view.mode !== "CLASH_CHOOSE") {
    const view = result.value.view;
    const command = PLAN(view);
    result = app.perform(command.kind, { ...(command.args ?? {}), revision: view.revision });
  }
  const off = presentation.present({ ...result.value, settings: { ...result.value.settings, counterTags: false } }).clash;
  assert.ok(off.groups.every((g) => g.cards.every((c) => !c.tags.some((t) => t.kind === "counter"))));
  assert.equal(off.groups[0].cards[0].cost.map((c) => c.pips).join(), "2");
});

test("TC-S5-VN-001 the CG of a clash node shows only after the clash, over its outro lines", () => {
  const { seen } = playAll();
  const a108 = seen.filter(({ model }) => model.scene.nodeId === "a1-08").map(({ model }) => model);
  assert.ok(a108.filter((m) => m.mode === "VN").every((m) => m.scene.showCg === true && m.scene.cg.kind === "cg"));
  assert.ok(a108.filter((m) => m.mode !== "VN").every((m) => m.scene.showCg === false));
});
