import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { loadGolden, loadRounds, traceEngine, traceKernel, journeyOfEntry } from "../../tools/clash/clash-parity.mjs";
import * as evidenceEngine from "../../docs/design-system/evidence/tactical-clash-engine.mjs";
import { ENTRIES } from "../../docs/design-system/evidence/tactical-clash-simulator.mjs";
import {
  ACTIONS, ACTION_IDS, COMBO_IDS, INTENTS, KEEPSAKES, TRAY_CAPACITY, TRAY_GROUPS, answersIntent, trayGroupOf,
} from "../../src/core/domain/clash/clash-rules.js";
import { clashContext, enterClash, legalActions, resolveTurn } from "../../src/core/domain/clash/clash-kernel.js";
import { assertRound, clashActions, closeClash, openClash, playClashTurn } from "../../src/core/domain/clash/clash-engine.js";
import { projectClash } from "../../src/core/domain/clash/clash-tray.js";
import { JourneyError } from "../../src/core/domain/journey/journey-errors.js";
import { createJourneyState } from "../../src/core/domain/journey/journey-state.js";
import { JOURNEY_SCHEMA_CATALOG } from "../../src/data/validation/journey-schema-catalog.js";
import { createContentSchemaValidator } from "../../src/data/validation/content-schema-validator.js";
import { SAVE_SCHEMA_ID, loadJourneySave } from "../helpers/journey-schema-cases.js";

/** Trace: TC-S5-CLASH-001, TC-S5-TRAY-001, ADR-P0-033 D1, ADR-P0-034 D2/D3/D5/D9, master plan §2.8, UX §3.3. */
const rounds = await loadRounds();
const roundOf = (id) => rounds.find((r) => r.id === id);
const common = JOURNEY_SCHEMA_CATALOG["v3.0.0/journey-common.schema.json"].$defs;

/** A JourneyState for clash tests: defaults like the simulator's base entry. */
function journey({ act = 2, hp = 4, mind = 4, sta = 4, pkam = 1, fiw = 1, teuk = 1, fsu = 0, streak = 0, tempo = 0, major = "wind", held = [], ready = [], flags = [] } = {}) {
  const state = createJourneyState({ act, meters: { hp, mind, sta } });
  state.bonds = { pkam, fiw, teuk };
  state.counters = { familySkillUses: fsu, selfReliance: 0, homeStreak: streak, homesickCount: 0, tempo };
  state.major = major;
  for (const id of held) { state.pouch.held.push(id); state.pouch.acquired.push(id); state.pouch.remembered.push(id); }
  state.ready = ready;
  state.flags = flags;
  return state;
}
const K = KEEPSAKES;
const rejects = (fn, code) => assert.throws(fn, (error) => error instanceof JourneyError && error.code === code, code);
/** Play one turn after another; returns the last result. */
function play(round, state, actions) {
  let encounter = openClash(round, state);
  let result = { journey: state, encounter };
  for (const id of actions) result = playClashTurn(round, result.journey, result.encounter, id);
  return result;
}

// ---------------------------------------------------------------------------------------
// Parity gate (ADR-P0-034 D5.2)
// ---------------------------------------------------------------------------------------
test("TC-S5-CLASH-001 the Core kernel replays every action sequence of the proved engine step by step", async () => {
  const golden = await loadGolden();
  const trace = traceKernel(rounds);
  assert.equal(trace.length, 18);
  assert.deepEqual(trace, golden.entries);
  assert.deepEqual(golden.total, { positions: 286174, sequences: 260936 });
});

test("TC-S5-CLASH-001 the evidence engine API still reproduces the recorded trace", async () => {
  assert.deepEqual(traceEngine(evidenceEngine), (await loadGolden()).entries);
});

test("TC-S5-CLASH-001 Core vocabulary equals the closed vocabulary of schema 3.0.0", () => {
  assert.deepEqual(INTENTS, common.clashIntent.enum);
  assert.deepEqual(ACTION_IDS, common.clashAction.enum);
  assert.deepEqual(COMBO_IDS, common.clashCombo.enum);
  assert.deepEqual(Object.keys(ACTIONS).sort(), [...ACTION_IDS].sort());
  for (const round of rounds) assert.doesNotThrow(() => assertRound(round), round.id);
});

// ---------------------------------------------------------------------------------------
// Shell: frozen values, no mutation, typed rejections
// ---------------------------------------------------------------------------------------
test("TC-S5-CLASH-001 openClash and playClashTurn return frozen values and never mutate their inputs", () => {
  const state = journey({ act: 1, hp: 5, mind: 4, sta: 5, major: "rain" });
  const snapshot = JSON.stringify(state);
  const encounter = openClash(roundOf("R1"), state);
  assert.deepEqual(encounter, { kind: "clash", round: "R1", turn: 1, light: 5, used: [], dim: false, charged: false, weak: false, regroup: false, grace: false, gritUsed: false, homesick: 0, lastAction: null, outcome: null });
  const result = playClashTurn(roundOf("R1"), state, encounter, "s_kib");
  assert.equal(JSON.stringify(state), snapshot);
  for (const value of [encounter, result, result.journey, result.journey.meters, result.encounter, result.encounter.used, result.report]) assert.ok(Object.isFrozen(value));
  assert.deepEqual(result.encounter.used, ["s_kib"]);
  assert.equal(result.encounter.light, 7);
  assert.equal(result.journey.counters.homeStreak, 1);
  assert.equal(result.journey.counters.familySkillUses, 0, "Act 1 does not count family skill uses");
  assert.deepEqual(result.report, {
    turn: 1, action: "s_kib", intent: "grow", neutralized: false, doubled: false, answered: true,
    light: { before: 5, after: 7 }, meters: { before: { hp: 5, mind: 4, sta: 5 }, after: { hp: 5, mind: 4, sta: 5 } },
    homesick: false, regrouped: false, grace: false, event: 0, outcome: null,
  });
});

test("TC-S5-CLASH-001 every clash save of a full round is admitted by the Save Format 2 schema", () => {
  const validator = createContentSchemaValidator(JOURNEY_SCHEMA_CATALOG);
  const save = loadJourneySave();
  let state = journey({ act: 2, held: [K.seeds, K.guard, K.gear], pkam: 3, fiw: 3, ready: [K.seeds] });
  let encounter = openClash(roundOf("R2"), state);
  for (const id of ["guard", "a_pkam", "seeds", "gear_pkam"]) {
    ({ journey: state, encounter } = playClashTurn(roundOf("R2"), state, encounter, id));
    const candidate = structuredClone(save);
    candidate.payload.journey = structuredClone(state);
    candidate.payload.encounter = structuredClone(encounter);
    assert.deepEqual(validator.validate(candidate, SAVE_SCHEMA_ID).errors, [], id);
  }
  assert.equal(encounter.outcome, "hold");
});

test("TC-S5-CLASH-001 the shell rejects bad actions with stable error codes", () => {
  const r1 = roundOf("R1");
  const state = journey({ act: 1, hp: 5, mind: 4, sta: 2 });
  const encounter = openClash(r1, state);
  rejects(() => playClashTurn(r1, state, encounter, "toString"), "CLASH_ACTION_UNKNOWN");
  rejects(() => playClashTurn(r1, state, encounter, 42), "CLASH_ACTION_UNKNOWN");
  rejects(() => playClashTurn(r1, state, encounter, "strike"), "CLASH_ACTION_ILLEGAL");
  rejects(() => playClashTurn(r1, state, encounter, "hem"), "CLASH_ACTION_ILLEGAL");
  rejects(() => playClashTurn(r1, state, encounter, "seeds"), "CLASH_ACTION_ILLEGAL");
  assert.deepEqual(clashActions(r1, state, encounter), ["grit", "guard", "rest", "rain", "wind", "eye", "s_kab", "s_kib"]);
  const done = play(r1, journey({ act: 1, hp: 5, mind: 4, sta: 5 }), ["wind", "wind"]);
  assert.equal(done.encounter.outcome, "decisive", "wind with the wind major: 5 + 3 + 3 reaches ten on turn 2");
  rejects(() => playClashTurn(r1, done.journey, done.encounter, "rest"), "CLASH_ENDED");
  assert.deepEqual(clashActions(r1, done.journey, done.encounter), []);
});

test("TC-S5-CLASH-001 the shell rejects malformed rounds, encounters and journeys", () => {
  const r1 = roundOf("R1");
  const state = journey({ act: 1 });
  const encounter = openClash(r1, state);
  const round = (patch) => ({ ...structuredClone(r1), ...patch });
  for (const bad of [
    null, round({ id: "R9" }), round({ act: 6 }), round({ turns: 5 }), round({ p0: 0 }), round({ intents: ["grow", "lash"] }),
    round({ intents: ["grow", "lash", "roar"] }), round({ allies: ["ton"] }), round({ siblings: ["kab", "kab"] }),
    round({ combos: ["gear_pkam"] }), round({ combos: ["strike"] }), round({ light: "yes" }), round({ events: [{ turn: 4, light: 1, id: "late" }] }),
    round({ events: [{ turn: 1, light: 1, id: "a" }, { turn: 1, light: 2, id: "b" }] }), round({ events: [{ turn: 1, light: 1 }] }),
    round({ events: "none" }), round({ finisherFrom: 4 }), round({ music: "storm" }),
  ]) rejects(() => openClash(bad, state), "CLASH_ROUND_INVALID");
  const enc = (patch) => ({ ...structuredClone(encounter), ...patch });
  for (const bad of [
    null, enc({ kind: "camp" }), enc({ round: "R2" }), enc({ turn: 4 }), enc({ light: 11 }), enc({ light: 0 }), enc({ used: ["item:seeds"] }),
    enc({ used: ["s_kab", "s_kab"] }), enc({ dim: 1 }), enc({ homesick: 9 }), enc({ lastAction: "fly" }), enc({ outcome: "win" }),
    enc({ lastAction: "rest" }), enc({ turn: 2 }), enc({ outcome: "decisive", lastAction: "wind" }), enc({ outcome: "hold", lastAction: "wind", light: 6 }),
    enc({ outcome: "narrow", lastAction: "wind", light: 7 }), { ...structuredClone(encounter), extra: true },
  ]) rejects(() => playClashTurn(r1, state, bad, "rest"), "CLASH_STATE_INVALID");
  const st = (mutate) => { const s = structuredClone(state); mutate(s); return s; };
  for (const bad of [
    st((s) => { s.meters.hp = 6; }), st((s) => { s.bonds.pkam = -1; }), st((s) => { s.counters.tempo = 3; }), st((s) => { s.pouch.held.push(K.seeds); }),
    st((s) => { s.ready = ["seeds"]; }), st((s) => { s.flags = ["a", "a"]; }), st((s) => { s.major = "fire"; }), st((s) => { s.extra = 1; }),
  ]) rejects(() => openClash(r1, bad), "JOURNEY_STATE_INVALID");
  rejects(() => closeClash(state, encounter), "CLASH_NOT_ENDED");
  rejects(() => closeClash(state, { kind: "camp" }), "CLASH_STATE_INVALID");
});

test("TC-S5-CLASH-001 closeClash spends tempo and readied keepsakes (ADR-P0-034 D3.3)", () => {
  const state = journey({ act: 2, held: [K.seeds, K.guard, K.gear], ready: [K.seeds], tempo: 1, pkam: 3, fiw: 3 });
  const done = play(roundOf("R2"), state, ["guard", "a_pkam", "seeds", "gear_pkam"]);
  const after = closeClash(done.journey, done.encounter);
  assert.equal(after.counters.tempo, 0);
  assert.deepEqual(after.ready, []);
  assert.deepEqual(after.meters, done.journey.meters);
  assert.ok(Object.isFrozen(after));
});

// ---------------------------------------------------------------------------------------
// Rules pinned beyond the eighteen entry states (master plan §2.8)
// ---------------------------------------------------------------------------------------
const custom = (intents, extra = {}) => ({ id: "R2", act: 2, turns: intents.length, p0: 5, intents, allies: [], siblings: [], combos: [], light: true, events: [], territory: false, ...extra });

test("TC-S5-CLASH-001 an unanswered gather doubles the next intent, and on the last turn swallows three light", () => {
  const doubled = play(custom(["gather", "grow", "lash"]), journey(), ["rest", "rest"]);
  assert.equal(doubled.encounter.light, 5 - 4);
  assert.equal(doubled.report.doubled, true);
  const swallowed = play(custom(["grow", "gather", "gather"]), journey(), ["strike", "rest", "rest"]);
  assert.equal(swallowed.encounter.light, 5 + 2 - 3, "the last-turn gather is −3 even after a gather");
  assert.equal(swallowed.encounter.outcome, "narrow");
});

test("TC-S5-CLASH-001 dim, illusion, reveal and the weak point change the light as the master plan says", () => {
  const dimmed = play(custom(["dim", "lash", "lash"]), journey(), ["rest", "wind"]);
  assert.equal(dimmed.encounter.light, 5 + 2 + 1 - 1, "dim takes one light off the next gain (wind +2, major +1)");
  const fooled = play(custom(["illusion", "lash", "lash"]), journey(), ["strike"]);
  assert.equal(fooled.encounter.light, 5 - 1, "an aimed action hits nothing and the illusion still costs one");
  const revealed = play(custom(["illusion", "lash", "lash"]), journey({ major: "eye" }), ["eye"]);
  assert.equal(revealed.encounter.light, 5 + 1 + 1 + 1, "eye reveals: +1, major +1, reveal bonus +1");
  assert.equal(revealed.encounter.weak, true);
  const weak = play(custom(["illusion", "lash", "lash"]), journey({ major: "eye" }), ["eye", "guard"]);
  assert.equal(weak.encounter.weak, true, "a base action does not spend the weak point");
});

test("TC-S5-CLASH-001 regroup happens once, the second fall ends the clash narrow", () => {
  const round = custom(["grow", "grow", "grow"], { p0: 1 });
  const once = play(round, journey(), ["rest"]);
  assert.equal(once.encounter.regroup, true);
  assert.equal(once.encounter.light, 3);
  assert.equal(once.journey.meters.mind, 3);
  assert.equal(once.report.regrouped, true);
  const twice = play(round, journey(), ["rest", "rest", "rest"]);
  assert.equal(twice.encounter.outcome, "narrow");
  assert.equal(twice.encounter.light, 0);
  assert.equal(twice.journey.meters.hp, 3, "narrow costs one body outside Act 5");
});

test("TC-S5-CLASH-001 grit is the only way to empty a meter and Grace costs two light", () => {
  const round = custom(["dim", "dim", "dim"]);
  const result = play(round, journey({ hp: 1, sta: 2 }), ["grit"]);
  assert.deepEqual(result.journey.meters, { hp: 2, mind: 4, sta: 2 });
  assert.equal(result.encounter.grace, true);
  assert.equal(result.encounter.gritUsed, true);
  assert.equal(result.encounter.light, 5 + 2 - 2);
  assert.equal(result.report.grace, true);
});

test("TC-S5-CLASH-001 homesick strain: two light less per repeat, nothing in Act 1", () => {
  const round = custom(["dim", "dim", "dim", "dim"]);
  const strained = play(round, journey({ act: 2, major: null }), ["wind", "wind", "wind"]);
  assert.equal(strained.encounter.light, 5 + 2 + 0 + 0, "second use 2−2, third 2−4");
  assert.equal(strained.encounter.homesick, 2);
  assert.equal(strained.journey.counters.homesickCount, 2);
  assert.equal(strained.journey.counters.familySkillUses, 3);
  const home = play({ ...round, act: 1 }, journey({ act: 1, major: null }), ["wind", "wind", "wind"]);
  assert.equal(home.encounter.homesick, 0);
  assert.equal(home.journey.counters.familySkillUses, 0);
});

test("TC-S5-CLASH-001 readied keepsakes, bond 4 assists, sibling peace and combos follow §2.5–§2.7", () => {
  const round = custom(["dim", "dim", "dim", "dim"], { allies: ["pkam", "fiw"], siblings: ["kab"], combos: ["gear_pkam"] });
  const state = journey({ act: 4, held: [K.gear, K.seeds], ready: [K.seeds], pkam: 3, fiw: 4, flags: ["kab_peace"] });
  const ready = play(round, state, ["seeds"]);
  assert.equal(ready.encounter.light, 5 + 2 + 1);
  const assist = play(round, state, ["a_fiw"]);
  assert.equal(assist.encounter.light, 5 + 2 + 1);
  assert.equal(assist.journey.meters.sta, 5);
  const peace = play(round, state, ["s_kab"]);
  assert.equal(peace.encounter.light, 5 + 2 + 1);
  const combo = play(round, state, ["gear_pkam"]);
  assert.equal(combo.journey.bonds.pkam, 4);
  assert.deepEqual(combo.encounter.used, [`item:${K.gear}`]);
  assert.equal(clashActions(round, combo.journey, combo.encounter).includes("gear"), false, "the combo spends the gear for this clash");
});

test("TC-S5-CLASH-001 Act 5 territory, the finisher and the cape", () => {
  const r5 = roundOf("R5");
  const state = journey({ act: 5, held: [K.button, K.gear, K.guard, K.ribbon], pkam: 3, fiw: 3, flags: ["teuk_intel"] });
  const encounter = openClash(r5, state);
  assert.equal(encounter.light, 2 + 1 + 1, "gear in the room +1 and Teuk's intel +1");
  const view = projectClash(r5, state, encounter);
  assert.deepEqual(view.territory.map((m) => [m.item, m.intent, m.effect]), [[K.gear, "dim", "off"], [K.guard, "gather", "off"], [K.ribbon, "whisper", "off"]]);
  assert.equal(view.intent.neutralized, true);
  assert.deepEqual(view.groups.pouch.map((c) => c.id), ["ribbon"], "only the ribbon stays in hand");
  assert.equal(projectClash(r5, state, encounter).groups.basic.some((c) => c.finisher), false, "the finisher opens on turn 3");
  const caped = play(r5, state, ["rest", "a_fiw", "hem"]);
  assert.equal(caped.report.light.before, 6);
  assert.equal(caped.report.light.after, 6 + 3 + 1 - 2, "hem +3 and the cape +1 at light ≥ 6, then an unhalved grow −2");
});

// ---------------------------------------------------------------------------------------
// Tray (UX §3.3)
// ---------------------------------------------------------------------------------------
/** Every position reachable from the simulator's eighteen entries. */
function* reachable() {
  for (const [roundId, entries] of Object.entries(ENTRIES)) {
    const round = roundOf(roundId);
    for (const entry of entries) {
      const base = journeyOfEntry(entry);
      const state = journey({
        act: round.act, hp: base.meters.hp, mind: base.meters.mind, sta: base.meters.sta, pkam: base.bonds.pkam, fiw: base.bonds.fiw, teuk: base.bonds.teuk,
        fsu: base.counters.familySkillUses, streak: base.counters.homeStreak, tempo: base.counters.tempo, major: base.major, held: base.pouch.held, ready: base.ready, flags: base.flags,
      });
      const ctx = clashContext(round, state);
      const stack = [enterClash(ctx, state)];
      while (stack.length) {
        const cs = stack.pop();
        if (cs.outcome !== null) continue;
        yield { round, ctx, cs };
        for (const id of legalActions(ctx, cs)) stack.push(resolveTurn(ctx, cs, id));
      }
    }
  }
}

test("TC-S5-TRAY-001 every reachable position fits the four tray groups and the tray holds every legal action once", () => {
  let positions = 0;
  const most = Object.fromEntries(TRAY_GROUPS.map((g) => [g, 0]));
  for (const { ctx, cs } of reachable()) {
    positions += 1;
    const legal = legalActions(ctx, cs);
    const grouped = Object.fromEntries(TRAY_GROUPS.map((g) => [g, legal.filter((id) => trayGroupOf(id) === g)]));
    for (const g of TRAY_GROUPS) {
      assert.ok(grouped[g].length <= TRAY_CAPACITY[g], `${g} overflow at ${cs.round} turn ${cs.turn}`);
      most[g] = Math.max(most[g], grouped[g].length);
    }
    assert.deepEqual(TRAY_GROUPS.flatMap((g) => grouped[g]).sort(), [...legal].sort());
  }
  assert.ok(positions > 25000);
  assert.deepEqual(most, { basic: 4, family: 5, friends: 3, pouch: 5 });
});

test("TC-S5-TRAY-001 no keepsake combination can overflow a group in any round", () => {
  const all = Object.values(K);
  const pick = (k, from = 0) => (k === 0 ? [[]] : all.slice(from).flatMap((item, i) => pick(k - 1, from + i + 1).map((rest) => [item, ...rest])));
  for (const round of rounds) {
    for (const held of pick(4)) {
      const state = journey({ act: round.act, sta: 5, pkam: 4, fiw: 4, teuk: 4, held });
      const ctx = clashContext(round, state);
      const cs = { ...enterClash(ctx, state), turn: round.turns };
      const legal = legalActions(ctx, cs);
      for (const g of TRAY_GROUPS) assert.ok(legal.filter((id) => trayGroupOf(id) === g).length <= TRAY_CAPACITY[g], `${round.id} ${held}`);
    }
  }
});

test("TC-S5-TRAY-001 projected cards carry the counter and repeat tags of the v3 screens", () => {
  const base = { hp: 5, mind: 4, sta: 4, fsu: 3, major: null };
  const ids = (view) => TRAY_GROUPS.flatMap((g) => view.groups[g].map((c) => c.id)).sort();
  const tagged = (view, tag) => TRAY_GROUPS.flatMap((g) => view.groups[g].filter((c) => c[tag]).map((c) => c.id)).sort();
  const same = (actual, expected) => assert.deepEqual(actual, [...expected].sort());
  const r5State = journey({ act: 5, ...base, pkam: 3, fiw: 3, teuk: 3, held: [K.button, K.seeds, K.guard, K.gear], flags: ["teuk_intel"] });
  const screen3 = projectClash(roundOf("R5"), r5State, openClash(roundOf("R5"), r5State));
  assert.deepEqual([screen3.turn, screen3.light, screen3.intent.id, screen3.intent.neutralized], [1, 4, "whisper", false]);
  same(ids(screen3), ["strike", "guard", "rest", "rain", "wind", "eye", "a_pkam", "a_fiw", "s_kab", "s_kib"]);
  same(tagged(screen3, "answers"), ["guard", "rain", "a_pkam"]);
  same(tagged(screen3, "homesick"), []);
  const after = play(roundOf("R5"), r5State, ["a_pkam", "rain"]);
  const screen4 = projectClash(roundOf("R5"), after.journey, after.encounter);
  assert.deepEqual([screen4.turn, screen4.light, screen4.intent.id], [3, 6, "grow"]);
  same(ids(screen4), ["strike", "guard", "rest", "hem", "rain", "wind", "eye", "a_fiw", "s_kab", "s_kib"]);
  same(tagged(screen4, "answers"), ["strike", "guard", "wind", "s_kib"]);
  same(tagged(screen4, "homesick"), ["rain", "wind", "eye", "s_kab", "s_kib"]);
  assert.deepEqual(screen4.homesickCost, { mind: 1, sta: 1 });
  assert.deepEqual(screen4.preview, [{ turn: 4, intent: "gather", neutralized: true }]);
  const r4State = journey({ act: 4, ...base, pkam: 3, fiw: 3, teuk: 3, held: [K.button, K.ribbon, K.seeds, K.gear], flags: ["teuk_splint"], tempo: 1 });
  const screen11 = projectClash(roundOf("R4A"), r4State, openClash(roundOf("R4A"), r4State));
  assert.equal(screen11.light, 4);
  same(ids(screen11), ["strike", "guard", "rest", "rain", "wind", "eye", "s_kab", "s_kib", "a_pkam", "a_fiw", "a_teuk", "seeds", "gear", "button", "ribbon", "ribbon_fiw"]);
  same(tagged(screen11, "answers"), ["strike", "guard", "wind", "s_kib", "a_pkam", "seeds"]);
  assert.deepEqual(screen11.groups.pouch.find((c) => c.id === "ribbon_fiw"), { id: "ribbon_fiw", kind: "combo", cost: {}, answers: false, homesick: false, combo: true, finisher: false, item: K.ribbon, ally: "fiw" });
  const r2State = journey({ act: 2, ...base, fsu: 0, pkam: 2, fiw: 1, teuk: 0, held: [K.seeds, K.guard, K.gear] });
  const r2 = play(roundOf("R2"), r2State, ["rain"]);
  const screen12 = projectClash(roundOf("R2"), r2.journey, r2.encounter);
  assert.deepEqual([screen12.turn, screen12.light, screen12.intent.id], [2, 4, "grow"]);
  same(ids(screen12), ["strike", "guard", "rest", "rain", "wind", "eye", "seeds", "guardItem", "gear", "gear_pkam", "seeds_fiw"]);
  same(tagged(screen12, "answers"), ["strike", "guard", "wind", "seeds", "gear_pkam", "seeds_fiw"]);
  same(tagged(screen12, "homesick"), ["rain", "wind", "eye"]);
  assert.deepEqual(screen12.preview.map((p) => p.intent), ["lash", "gather"]);
  const grit = projectClash(roundOf("R1"), journey({ act: 1, sta: 2 }), openClash(roundOf("R1"), journey({ act: 1, sta: 2 })));
  assert.deepEqual(grit.groups.basic.map((c) => [c.id, c.cost]), [["grit", { hp: 1, sta: 2 }], ["guard", { sta: 1 }], ["rest", {}]]);
  const ended = play(roundOf("R1"), journey({ act: 1, sta: 5 }), ["wind", "wind"]);
  const outcome = projectClash(roundOf("R1"), ended.journey, ended.encounter);
  assert.equal(outcome.outcome, "decisive");
  assert.deepEqual(TRAY_GROUPS.map((g) => outcome.groups[g].length), [0, 0, 0, 0]);
});

test("TC-S5-TRAY-001 answersIntent marks exactly the cancel, negate, halve and reveal relations", () => {
  for (const id of ACTION_IDS) {
    const a = ACTIONS[id];
    for (const intent of INTENTS) {
      const expected = [...(a.cancels ?? []), ...(a.negates ?? []), ...(a.halves ?? [])].includes(intent) || (intent === "illusion" && a.reveals === true);
      assert.equal(answersIntent(id, intent), expected, `${id} × ${intent}`);
    }
  }
});

test("TC-S5-CLASH-001 the clash rules live in Core and are frozen", async () => {
  assert.ok(Object.isFrozen(ACTIONS) && Object.values(ACTIONS).every(Object.isFrozen));
  assert.ok(Object.values(ACTIONS).every((a) => Object.values(a).every((v) => typeof v !== "object" || Object.isFrozen(v))));
  const kernel = await readFile(new URL("../../src/core/domain/clash/clash-kernel.js", import.meta.url), "utf8");
  assert.doesNotMatch(kernel, /['"]R5['"]|item_[a-z_]+['"]/, "the kernel names no round and no keepsake directly");
});
