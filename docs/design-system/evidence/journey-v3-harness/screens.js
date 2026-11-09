/**
 * The 13 screens of Mockups v3 as real Journey states (T5 · TC-S5-PROTO-001 · ADR-P0-034 D10).
 * PO review harness only: it lives in `docs/`, outside the release allowlist, and never ships.
 *
 * Each screen is a small package built from the mini fixture (which holds every node type and
 * the whole closed vocabulary) plus the six rounds of the mechanics source, with the screen's
 * verbatim Thai from the v3 fixtures. Its state is reached the way the game reaches any state:
 *
 *   1. the package passes the real admission (`admitJourneyPackage`);
 *   2. a real session starts at a one-line prelude, and the screen's preconditions (meters,
 *      bonds, pouch, flags, counters) are written into that state, which Core's own `restore()`
 *      must accept;
 *   3. real commands leave the prelude, so the screen's encounter opens under real rules, and
 *      press the cards the v3 screen says were pressed.
 *
 * `expect` is what the v3 README and `ux-v3-screen-states-check.mjs` say the screen shows;
 * `tests/unit/journey-v3-harness.test.js` proves every one on Core, and the browser runner checks
 * the drawn screens. Trace: Mockups v3 README, UX §8.2–§8.4, SSOT §4.3 T5.
 */

import { KEEPSAKES } from "../../../../src/core/domain/clash/clash-rules.js";

const MOBILE = Object.freeze([390, 844]);
const DESKTOP = Object.freeze([1440, 900]);
const KOB = { slot: "left", asset: "char_jao_kob_adult_determined", facing: "right" };
const SHADE = { slot: "right", asset: "char_cockroach_man_shadow_boast", facing: "left" };
const TEUK = { slot: "right", asset: "char_jao_teuk_storm_kneeling", facing: "left" };

const R5_STATE = { hp: 5, mind: 4, sta: 4, fsu: 3, bk: 3, bf: 3, bt: 3, items: ["button", "seeds", "guard", "gear"], flags: ["teuk_intel"] };
const CAMP_STATE = { hp: 4, mind: 3, sta: 4, bk: 2, bf: 2, bt: 2, items: ["button", "seeds", "gear"] };
const ENDING_STATE = { hp: 3, mind: 3, sta: 3, bk: 3, bf: 2, bt: 2, fsu: 3, sr: 3, items: ["button", "ribbon", "seeds", "gear"] };

export const SCREENS = Object.freeze([
  { n: 1, stem: "mode1-vn-desktop", viewport: DESKTOP, kind: "vn", act: 3, state: CAMP_STATE,
    stage: { bg: "bg_act3_wayside_shelter_teuk", slots: [{ ...KOB, asset: "char_jao_kob_adult_observant" }, TEUK] },
    expect: { mode: "VN", speaker: "เตื๊อก" } },
  { n: 2, stem: "mode1-choice-mobile", viewport: MOBILE, kind: "choice", act: 2, state: { hp: 4, mind: 3, sta: 4, bk: 1, bf: 2, bt: 2, items: ["seeds", "guard"] },
    stage: { bg: "bg_act2_whirlpool_grate", slots: [KOB, { slot: "right", asset: "char_pkam_neutral_guarded", facing: "left" }] },
    expect: { mode: "DECISION", options: ["combo", "wind", "eye", "alone", "grit"] } },
  { n: 3, stem: "mode2-clash-r5-mobile", viewport: MOBILE, kind: "clash", round: "R5", act: 5, state: R5_STATE, presses: [],
    stage: { bg: "bg_act5_shadow_duel_wall", slots: [KOB, SHADE] },
    expect: { mode: "CLASH_CHOOSE", turn: 1, light: 4, intent: "whisper", cards: ["strike", "guard", "rest", "rain", "wind", "eye", "a_pkam", "a_fiw", "s_kab", "s_kib"], counter: ["guard", "rain", "a_pkam"], repeat: [] } },
  { n: 4, stem: "mode2-clash-r5-desktop", viewport: DESKTOP, kind: "clash", round: "R5", act: 5, state: R5_STATE, presses: ["a_pkam", "rain"],
    stage: { bg: "bg_act5_shadow_duel_wall", slots: [KOB, SHADE] },
    expect: { mode: "CLASH_CHOOSE", turn: 3, light: 6, intent: "grow", cards: ["strike", "guard", "rest", "rain", "wind", "eye", "a_fiw", "s_kab", "s_kib", "hem"], counter: ["strike", "guard", "wind", "s_kib"], repeat: ["rain", "wind", "eye", "s_kab", "s_kib"] } },
  { n: 5, stem: "mode3-camp-c3-desktop", viewport: DESKTOP, kind: "camp", act: 3, state: CAMP_STATE,
    stage: { bg: "bg_act3_wayside_shelter_teuk", slots: [{ ...KOB, asset: "char_jao_kob_adult_observant" }, TEUK] },
    expect: { mode: "CAMP", activities: 8 } },
  { n: 6, stem: "mode3-camp-c3-mobile", viewport: MOBILE, kind: "camp", act: 3, state: CAMP_STATE,
    stage: { bg: "bg_act3_wayside_shelter_teuk", slots: [{ ...KOB, asset: "char_jao_kob_adult_observant" }, TEUK] },
    expect: { mode: "CAMP", activities: 8 } },
  { n: 7, stem: "mode4-stitch-mobile", viewport: MOBILE, kind: "micro", micro: { kind: "stitch", ma: "MA-5" }, act: 5, state: CAMP_STATE, taps: 1,
    stage: { bg: "bg_act5_bedside_table_night", slots: [] },
    expect: { mode: "MICRO", micro: "stitch" } },
  { n: 8, stem: "mode4-tap-rail-desktop", viewport: DESKTOP, kind: "micro", micro: { kind: "tap3", ma: "MA-3" }, act: 3, state: CAMP_STATE, taps: 1,
    stage: { bg: "bg_act3_wayside_shelter_teuk", slots: [{ ...KOB, asset: "char_jao_kob_adult_observant" }, TEUK] },
    expect: { mode: "MICRO", micro: "tap3" } },
  { n: 9, stem: "mode5-endings-desktop", viewport: DESKTOP, kind: "endings", act: 5, state: ENDING_STATE,
    expect: { mode: "ENDING_RESONANCE", open: { home: true, pond: true, dawn: false }, fallback: false } },
  { n: 10, stem: "mode5-endings-mobile", viewport: MOBILE, kind: "endings", act: 5, state: ENDING_STATE,
    expect: { mode: "ENDING_RESONANCE", open: { home: true, pond: true, dawn: false }, fallback: false } },
  { n: 11, stem: "mode2-clash-r4a-tray-mobile", viewport: MOBILE, kind: "clash", round: "R4A", act: 4, presses: [],
    state: { hp: 5, mind: 4, sta: 4, fsu: 3, bk: 3, bf: 3, bt: 3, items: ["button", "ribbon", "seeds", "gear"], flags: ["teuk_splint"], tempo: 1 },
    stage: { bg: "bg_act4_parapet_storm_abyss", slots: [KOB, SHADE] },
    expect: { mode: "CLASH_CHOOSE", turn: 1, light: 4, intent: "grow", cards: ["strike", "guard", "rest", "rain", "wind", "eye", "seeds", "gear", "button", "ribbon", "a_pkam", "a_fiw", "a_teuk", "s_kab", "s_kib", "ribbon_fiw"], counter: ["strike", "guard", "wind", "seeds", "a_pkam", "s_kib"], repeat: [] } },
  { n: 12, stem: "mode2-clash-r2-desktop", viewport: DESKTOP, kind: "clash", round: "R2", act: 2, presses: ["rain"],
    state: { hp: 5, mind: 4, sta: 4, fsu: 0, bk: 2, bf: 1, bt: 0, items: ["seeds", "guard", "gear"] },
    stage: { bg: "bg_act2_shadow_sluice_chamber", slots: [KOB, SHADE] },
    expect: { mode: "CLASH_CHOOSE", turn: 2, light: 4, intent: "grow", cards: ["strike", "guard", "rest", "rain", "wind", "eye", "seeds", "guardItem", "gear", "gear_pkam", "seeds_fiw"], counter: ["strike", "guard", "wind", "seeds", "gear_pkam", "seeds_fiw"], repeat: ["rain", "wind", "eye"] } },
  { n: 13, stem: "mode5-endings-fallback-mobile", viewport: MOBILE, kind: "endings", act: 5,
    state: { hp: 1, mind: 1, sta: 1, bk: 0, bf: 0, bt: 0, fsu: 0, sr: 0, items: ["button"] },
    expect: { mode: "ENDING_RESONANCE", open: { home: false, pond: true, dawn: false }, fallback: true } },
]);

/** The first mini node of an act at or after `act`, so a screen's `next` always resolves forward. */
const forward = (pkg, act) => pkg.nodes.find((node) => node.act >= act && node.id !== "h00")?.id ?? pkg.nodes.at(-1).id;

/**
 * The package of one screen.
 * @param {object} screen An entry of SCREENS. @param {{mini: object, story: object, fixtures: object}} sources
 */
export function screenPackage(screen, { mini, story, fixtures }) {
  const pkg = structuredClone(mini);
  pkg.package = { ...pkg.package, id: `story.harness.v3s${String(screen.n).padStart(2, "0")}`, title: `หน้าตรวจ v3 จอ ${screen.n}` };
  pkg.rounds = structuredClone(story.rounds);
  const say = (id, body, speaker = "narrator") => {
    const found = pkg.texts.find((entry) => entry.id === id);
    if (found) Object.assign(found, { body, speaker });
    else pkg.texts.push({ id, speaker, body });
    return id;
  };
  if (!pkg.characters.some((entry) => entry.id === "char_jao_teuk")) pkg.characters.push({ id: "char_jao_teuk", name: "เตื๊อก" });
  const stage = (s) => ({ bg: s.bg, slots: s.slots.map((slot) => ({ ...slot })), silenceMs: 0 });
  const next = forward(pkg, screen.act + 1 <= 5 ? screen.act + 1 : 5);
  let target;
  switch (screen.kind) {
    case "vn":
      target = { id: "t01", type: "vn", act: screen.act, title: "ศาลาริมทาง", stage: stage(screen.stage), lines: [{ text: say("t01.l1", fixtures.vn.line, "char_jao_teuk") }], next };
      break;
    case "choice": {
      const methods = [{ kind: "combo", item: KEEPSAKES.guard, ally: "pkam" }, { kind: "skill", skill: "wind" }, { kind: "skill", skill: "eye" }, { kind: "alone", sta: 1, needSta: 2 }, { kind: "grit" }];
      const keys = ["combo", "wind", "eye", "alone", "grit"];
      target = {
        id: "t01", type: "obstacle", act: screen.act, title: "ประตูน้ำวน", stage: stage(screen.stage), lines: [{ text: say("t01.l1", "เฟืองตะแกรงหมุนกลืนน้ำ ก้ามพี่ก้ามติดอยู่ในซี่ของมัน") }],
        options: methods.map((method, index) => ({ key: keys[index], method, label: say(`t01.o${index + 1}`, fixtures.choices[index].split(" · ").at(-1)), effects: [], responses: [] })),
        next,
      };
      break;
    }
    case "clash": {
      const base = structuredClone(mini.nodes.find((node) => node.type === "clash"));
      const round = story.rounds.find((entry) => entry.id === screen.round);
      target = { ...base, id: "t01", act: screen.act, stage: stage(screen.stage), round: screen.round, intentLines: round.intents.map((_, index) => base.intentLines[Math.min(index, base.intentLines.length - 1)]), next };
      delete target.stage.cg;
      break;
    }
    case "camp": {
      const labels = fixtures.camp;
      const act = (key, index, extra) => ({ key, label: say(`t01.a${index + 1}`, labels[index]), effects: [], responses: [], ...extra });
      target = {
        id: "t01", type: "camp", act: screen.act, title: "ศาลาริมทาง", stage: stage(screen.stage), lines: [], camp: "C3", drops: 2,
        activities: [
          act("splint", 0, { group: "ankle", when: { hasItem: KEEPSAKES.guard }, effects: [{ op: "item.release", item: KEEPSAKES.guard }, { op: "flag.set", flag: "teuk_splint" }] }),
          act("wrap", 1, { group: "ankle" }),
          act("teuk", 2, { effects: [{ op: "bond.add", bond: "teuk", amount: 1 }] }),
          act("pkam", 3, { effects: [{ op: "bond.add", bond: "pkam", amount: 1 }] }),
          act("fiw", 4, { effects: [{ op: "bond.add", bond: "fiw", amount: 1 }] }),
          act("eat", 5, { effects: [{ op: "meter.add", meter: "sta", amount: 1 }] }),
          act("heal", 6, { effects: [{ op: "meter.add", meter: "hp", amount: 1 }] }),
          act("ready", 7, { ready: true }),
        ],
        next,
      };
      break;
    }
    case "micro": {
      const base = mini.nodes.find((node) => node.type === "micro");
      target = { id: "t01", type: "micro", act: screen.act, title: screen.micro.kind === "stitch" ? "เย็บกระดุมคืนชายเสื้อ" : "รหัสบนราวไม้", stage: stage(screen.stage), lines: [], micro: { ...base.micro, kind: screen.micro.kind, ma: screen.micro.ma }, next };
      break;
    }
    case "endings": {
      target = pkg.nodes.find((node) => node.type === "ending");
      target.endings.forEach((ending, index) => { say(ending.label, fixtures.endLabels[index]); });
      const lock = (ending, reason, body) => { const entry = target.endings.find((e) => e.key === ending)?.locks.find((l) => l.reason === reason); if (entry) say(entry.text, body); };
      lock("dawn", "self-reliance", fixtures.lock.dawn);
      lock("home", "mind", fixtures.lock.homeFallback);
      lock("dawn", "family-skill", fixtures.lock.dawnFallback);
      break;
    }
    default:
      throw new TypeError(`unknown screen kind ${screen.kind}`);
  }
  if (screen.kind !== "endings") pkg.nodes.push(target);
  const prelude = { id: "h00", type: "vn", act: screen.act, title: target.title, stage: { ...structuredClone(target.stage), slots: [] }, lines: [{ text: say("h00.l1", "หน้าตรวจกำลังเตรียมฉาก") }], next: target.id };
  delete prelude.stage.cg;
  pkg.nodes.unshift(prelude);
  pkg.start = { node: "h00", meters: { hp: screen.state.hp, mind: screen.state.mind, sta: screen.state.sta } };
  return pkg;
}

/** A session state at the prelude with the screen's preconditions written in (Core must still accept it). */
export function withPreconditions(state, screen) {
  const copy = structuredClone(state);
  const j = copy.payload.journey;
  const s = screen.state;
  j.act = screen.act;
  j.meters = { hp: s.hp, mind: s.mind, sta: s.sta };
  j.bonds = { pkam: s.bk ?? 0, fiw: s.bf ?? 0, teuk: s.bt ?? 0 };
  j.counters = { ...j.counters, familySkillUses: s.fsu ?? 0, selfReliance: s.sr ?? 0, tempo: s.tempo ?? 0 };
  const items = (s.items ?? []).map((name) => KEEPSAKES[name]);
  j.pouch = { ...j.pouch, held: items, acquired: [...items], remembered: [...items] };
  j.flags = [...(s.flags ?? [])];
  copy.payload.actStarts = copy.payload.actStarts.map((start) => ({ ...start, act: screen.act, journey: structuredClone(j) }));
  return copy;
}

/**
 * The next command toward the screen, from the play view, or null when it is reached.
 * @param {object} view The session's play view. @param {object} screen @param {{pressed: number}} progress
 */
export function nextCommand(view, screen, progress) {
  const onTarget = view.node.id !== "h00";
  if (screen.kind === "clash") {
    if (!onTarget || view.mode !== "CLASH_CHOOSE") return { kind: "advance" };
    if (progress.pressed >= screen.presses.length) return null;
    const action = screen.presses[progress.pressed];
    progress.pressed += 1;
    return { kind: "clashAct", args: { action } };
  }
  return onTarget && view.mode === screen.expect.mode ? null : { kind: "advance" };
}
