import test from "node:test";
import assert from "node:assert/strict";
import { createJourneySession, HISTORY_MAX } from "../../src/core/use-cases/journey-session.js";
import { BEAT_MODES, MODALS, PLAY_MODES, acceptedCommands, transitionAllowed } from "../../src/core/state-machine/play-mode.js";
import { JOURNEY_SCHEMA_CATALOG } from "../../src/data/validation/journey-schema-catalog.js";
import { createContentSchemaValidator } from "../../src/data/validation/content-schema-validator.js";
import { SAVE_SCHEMA_ID, loadJourneySave, loadMiniJourney } from "../helpers/journey-schema-cases.js";
import { NOW, SESSION_ID, clashCards, loadAct1Package, planned, playSession } from "../helpers/journey-driver.js";

/** Trace: TC-S5-STATE-001, TC-S5-ENDING-001 (fixture), TC-S5-REPLAY-001 (fixture), ADR-P0-034 D2/D3/D7/D9, UX §1.7–§1.8. */
const act1 = createJourneySession(loadAct1Package());
const mini = createJourneySession(loadMiniJourney());
const validator = createContentSchemaValidator(JOURNEY_SCHEMA_CATALOG);
const saveTemplate = loadJourneySave();

/** Wrap a session state into a Save Format 2 document and validate it. */
function assertSaveable(state, label) {
  const save = structuredClone(saveTemplate);
  save.revision = state.revision;
  save.payload = structuredClone(state.payload);
  assert.deepEqual(validator.validate(save, SAVE_SCHEMA_ID).errors, [], label);
}

/** Every consecutive mode change follows UX §1.7 (replays excluded). */
function assertTransitions(run) {
  for (let i = 1; i < run.modes.length; i += 1) {
    const moved = run.nodes[i] !== run.nodes[i - 1];
    assert.ok(transitionAllowed(run.modes[i - 1], run.modes[i], moved), `${run.modes[i - 1]} → ${run.modes[i]} at ${run.nodes[i]}`);
  }
}

const rejected = (result, code) => {
  assert.equal(result.ok, false, `expected ${code}`);
  assert.equal(result.error.code, code, result.error.message);
  assert.ok(Object.isFrozen(result));
};

// ---------------------------------------------------------------------------------------
// New Game and the Act 1 prototype
// ---------------------------------------------------------------------------------------
test("TC-S5-STATE-001 New Game opens A1-01 with the package's meters and the Act 1 snapshot", () => {
  const state = act1.newGame({ sessionId: SESSION_ID, now: NOW });
  assert.equal(state.revision, 1);
  assert.deepEqual(state.payload.cursor, { node: "a1-01", beat: "vn", line: 0 });
  assert.deepEqual(state.payload.journey.meters, { hp: 5, mind: 4, sta: 5 });
  assert.deepEqual(state.payload.actStarts.map((s) => [s.act, s.node, s.capturedAt]), [[1, "a1-01", NOW]]);
  assert.deepEqual([state.payload.history, state.payload.completion.endingsSeen, state.payload.encounter, state.payload.playTimeMs], [[], [], null, 0]);
  assert.ok(Object.isFrozen(state.payload.journey.pouch.held));
  assert.equal(act1.view(state).line.text, "a1-01.l1");
  assert.deepEqual(act1.package, { id: "story.jaokob.core", contentVersion: "0.1.0" });
});

test("TC-S5-STATE-001 the Act 1 prototype plays from New Game to either Act 2 entry for every major and every way past A1-06", () => {
  let runs = 0;
  for (const major of ["rain", "wind", "eye"]) {
    for (const weir of ["rain", "wind", "eye", "alone", "grit"]) {
      for (const route of ["a", "b"]) {
        const run = playSession(act1, planned({ "a1-03": major, "a1-06": weir, "a1-13": route }));
        assert.equal(run.error, undefined, JSON.stringify(run.error));
        const p = run.state.payload;
        assert.equal(act1.modeOf(run.state), "BOUNDARY");
        assert.deepEqual(p.cursor, { node: route === "a" ? "a2a-01" : "a2b-01", beat: "vn", line: 0 });
        assert.equal(p.journey.act, 2);
        assert.equal(p.journey.major, major);
        assert.equal(p.journey.route, route.toUpperCase());
        assert.deepEqual(p.journey.pouch.held, ["item_kib_glowing_seeds", "item_kab_bark_guard"]);
        assert.ok(p.journey.meters.hp >= 4 && p.journey.meters.mind >= 3 && p.journey.meters.sta >= 4, "Act 1 rest floor 4/3/4");
        assert.deepEqual(p.actStarts.map((s) => s.act), [1, 2]);
        assert.equal(p.actStarts[1].journey.counters.homeStreak, 0, "a new act starts with no homesick streak");
        assert.equal(p.journey.counters.familySkillUses, 0, "Act 1 never counts family skill uses");
        assertTransitions(run);
        runs += 1;
      }
    }
  }
  assert.equal(runs, 30);
});

test("TC-S5-STATE-001 every state of a playthrough is saveable, restorable and replays deterministically", () => {
  const plan = planned({ "a1-03": "eye", "a1-06": "grit", "a1-08": ["eye", "s_kib", "guard"], "a1-10": ["kab", "mother"], "a1-13": "b" });
  const run = playSession(act1, plan);
  const again = playSession(act1, plan);
  assert.deepEqual(again.states, run.states);
  run.states.forEach((state, i) => {
    assertSaveable(state, `state ${i}`);
    assert.deepEqual(act1.restore(structuredClone(state)), state);
    assert.equal(state.revision, i + 1);
  });
  const labels = run.results.flatMap((r) => r.events.map((e) => e.type));
  for (const type of ["meter", "keepsake", "ready", "clash-turn", "act"]) assert.ok(labels.includes(type), type);
});

// ---------------------------------------------------------------------------------------
// Mini journey: every node type, effect and ending
// ---------------------------------------------------------------------------------------
test("TC-S5-STATE-001 the mini journey crosses every node type and act and completes an ending", () => {
  const run = playSession(mini, planned({
    n02: "major-wind", n03: "kab", n04: ["s_kib", "wind", "strike"], n05: ["eat", "talk"], n08: "take", n09: "grit", n10: "plan-b",
  }));
  assert.equal(run.error, undefined, JSON.stringify(run.error));
  const p = run.state.payload;
  assert.equal(mini.modeOf(run.state), "COMPLETE");
  assert.equal(p.cursor.beat, "complete");
  assert.deepEqual(p.actStarts.map((s) => [s.act, s.node]), [[1, "n01"], [2, "n07"], [3, "n08"], [4, "n10"], [5, "n11"]]);
  assert.equal(p.completion.endingsSeen.length, 1);
  assert.equal(p.journey.route, "A");
  assert.equal(p.journey.plan, "B");
  assert.ok(p.journey.flags.includes("met_pkam"));
  assert.ok(p.journey.pouch.held.includes("item_teuk_whistle_charm"));
  assertTransitions(run);
  run.states.forEach((state, i) => assertSaveable(state, `mini state ${i}`));
  const modes = new Set(run.modes);
  for (const mode of PLAY_MODES.filter((m) => m !== "BOUNDARY")) assert.ok(modes.has(mode), `mode ${mode} is reached`);
});

test("TC-S5-STATE-001 node effects apply once, after the node's own lines", () => {
  const run = playSession(mini, planned({ n02: "major-rain", n03: "wait" }), { limit: 5000 });
  const atN07 = run.states.find((s) => s.payload.cursor.node === "n07");
  const lastBefore = run.states.findLast((s) => s.payload.cursor.node === "n07");
  assert.equal(atN07.payload.journey.pouch.held.includes("item_pkam_tin_gear"), false, "the grant waits for the lines");
  assert.ok(lastBefore.payload.journey.pouch.held.includes("item_pkam_tin_gear") === false || lastBefore.payload.cursor.beat !== "vn");
  const after = run.states.find((s) => s.payload.cursor.node === "n08");
  const j = after.payload.journey;
  assert.ok(j.pouch.held.includes("item_pkam_tin_gear"));
  assert.ok(j.ready.includes("item_pkam_tin_gear"));
  assert.ok(j.meters.hp >= 2 && j.meters.mind >= 2 && j.meters.sta >= 2, "rest floor");
});

// ---------------------------------------------------------------------------------------
// Atomic, revision-bound commands
// ---------------------------------------------------------------------------------------
test("TC-S5-STATE-001 commands are revision-bound and rejected atomically with stable codes", () => {
  const state = act1.newGame({ sessionId: SESSION_ID, now: NOW });
  const snapshot = JSON.stringify(state);
  const tries = [
    [act1.advance(state, { revision: 2, now: NOW }), "JOURNEY_REVISION"],
    [act1.advance(state, { now: NOW }), "JOURNEY_REVISION"],
    [act1.advance(state, null), "JOURNEY_COMMAND_INVALID"],
    [act1.advance(state, { revision: 1, now: "yesterday" }), "JOURNEY_COMMAND_INVALID"],
    [act1.choose(state, { revision: 1, now: NOW, option: "rain" }), "JOURNEY_BEAT"],
    [act1.clashAct(state, { revision: 1, now: NOW, action: "strike" }), "JOURNEY_BEAT"],
    [act1.campLeave(state, { revision: 1, now: NOW }), "JOURNEY_BEAT"],
    [act1.replayAct(state, { revision: 1, now: NOW, act: 3 }), "JOURNEY_REPLAY_UNAVAILABLE"],
  ];
  for (const [result, code] of tries) {
    rejected(result, code);
    assert.equal(result.state, state, "the same state comes back");
  }
  assert.equal(JSON.stringify(state), snapshot);
  assert.throws(() => act1.newGame({ sessionId: "nope", now: NOW }), (e) => e.code === "JOURNEY_COMMAND_INVALID");
  assert.throws(() => act1.newGame({ sessionId: SESSION_ID, now: 0 }), (e) => e.code === "JOURNEY_COMMAND_INVALID");
});

/** Advance a session until the cursor reaches a node and mode. */
function until(session, policy, node, mode) {
  let state = session.newGame({ sessionId: SESSION_ID, now: NOW });
  for (let i = 0; i < 5000; i += 1) {
    if (state.payload.cursor.node === node && session.modeOf(state) === mode) return state;
    const command = policy(session.view(state));
    const result = session[command.kind](state, { revision: state.revision, now: NOW, ...(command.args ?? {}) });
    assert.ok(result.ok, JSON.stringify(result.error));
    state = result.state;
  }
  throw new Error(`never reached ${node} ${mode}`);
}

test("TC-S5-STATE-001 closed options say why, and decisions keep the cost and homesick facts", () => {
  const decision = until(act1, planned({ "a1-03": "wind" }), "a1-06", "DECISION");
  const options = act1.view(decision).decision.options;
  assert.deepEqual(options.map((o) => [o.key, o.kind, o.available, o.cost]), [
    ["rain", "skill", true, {}], ["wind", "skill", true, {}], ["eye", "skill", true, {}], ["alone", "alone", true, { sta: 1 }], ["grit", "grit", true, { hp: 1, sta: 2 }],
  ]);
  rejected(act1.choose(decision, { revision: decision.revision, now: NOW, option: "fly" }), "JOURNEY_OPTION_UNKNOWN");
  const tired = act1.restore({ ...structuredClone(decision), payload: { ...structuredClone(decision.payload), journey: { ...structuredClone(decision.payload.journey), meters: { hp: 5, mind: 2, sta: 5 } } } });
  assert.deepEqual(act1.view(tired).decision.options.find((o) => o.key === "alone"), { key: "alone", label: "a1-06.o4", kind: "alone", method: { kind: "alone", sta: 1, needSta: 2 }, cost: { sta: 1 }, homesick: false, available: false, reason: "mind-low" });
  rejected(act1.choose(tired, { revision: tired.revision, now: NOW, option: "alone" }), "JOURNEY_OPTION_UNAVAILABLE");
});

test("TC-S5-STATE-001 the clash runs through intent, choose, resolve and outcome with the scene labels", () => {
  const choose = until(act1, planned({ "a1-03": "rain" }), "a1-08", "CLASH_CHOOSE");
  const view = act1.view(choose);
  assert.equal(view.clash.turn, 1);
  assert.equal(view.clash.labels.strike, "a1-08.k.strike");
  assert.equal(view.clash.labels.rain, "lex.action.rain");
  assert.equal(view.clash.intentLabel, "lex.intent.grow");
  rejected(act1.clashAct(choose, { revision: choose.revision, now: NOW, action: "hem" }), "CLASH_ACTION_ILLEGAL");
  const resolved = act1.clashAct(choose, { revision: choose.revision, now: NOW, action: "s_kib" });
  assert.equal(act1.modeOf(resolved.state), "CLASH_RESOLVE");
  assert.equal(act1.view(resolved.state).line.text, "a1-08.p.s_kib");
  assert.deepEqual(act1.view(resolved.state).clash.resolved, { turn: 1, action: "s_kib", intent: "grow", kind: "sibling", answered: true });
  assert.equal(resolved.state.payload.history.at(-1).action, "s_kib");
  const intro = until(act1, planned(), "a1-08", "CLASH_INTRO");
  assert.deepEqual(act1.view(intro).clash, { round: "R1", turns: 3, opening: true, light: 5, gauge: { max: 10, holdAt: 7 }, lightSource: false });
});

test("TC-S5-STATE-001 camps spend drops, keep groups exclusive and only let the frog leave when done", () => {
  const camp = until(act1, planned(), "a1-10", "CAMP");
  assert.deepEqual(act1.view(camp).camp.activities.map((a) => [a.key, a.available]), [["eat", true], ["kab", true], ["kib", true], ["mother", true]]);
  rejected(act1.campLeave(camp, { revision: camp.revision, now: NOW }), "JOURNEY_CAMP_UNFINISHED");
  rejected(act1.campPick(camp, { revision: camp.revision, now: NOW, activity: "swim" }), "JOURNEY_OPTION_UNKNOWN");
  rejected(act1.campPick(camp, { revision: camp.revision, now: NOW, activity: "eat", item: "item_kib_glowing_seeds" }), "JOURNEY_COMMAND_INVALID");
  const one = act1.campPick(camp, { revision: camp.revision, now: NOW, activity: "kab" });
  assert.equal(act1.modeOf(one.state), "VN");
  assert.equal(act1.view(one.state).line.text, "a1-10.a2.r1");
  const back = act1.advance(one.state, { revision: one.state.revision, now: NOW });
  assert.equal(act1.modeOf(back.state), "CAMP");
  rejected(act1.campPick(back.state, { revision: back.state.revision, now: NOW, activity: "kab" }), "JOURNEY_OPTION_UNAVAILABLE");
  const two = act1.advance(act1.campPick(back.state, { revision: back.state.revision, now: NOW, activity: "mother" }).state, { revision: back.state.revision + 1, now: NOW });
  assert.equal(act1.view(two.state).camp.finished, true);
  assert.equal(act1.view(two.state).camp.activities.every((a) => !a.available), true);
  const left = act1.campLeave(two.state, { revision: two.state.revision, now: NOW });
  assert.equal(left.state.payload.encounter, null);
  assert.equal(left.state.payload.cursor.node, "a1-11");
  assert.deepEqual(left.state.payload.history.slice(-3).map((h) => h.action), ["kab", "mother", "leave"]);
});

test("TC-S5-STATE-001 the mini journey's ready activity, pouch offer and locked keepsake follow ADR-P0-020", () => {
  const camp = until(mini, planned({ n02: "major-wind" }), "n05", "CAMP");
  const view = mini.view(camp).camp;
  assert.deepEqual(view.activities.map((a) => [a.key, a.available, a.reason]), [
    ["eat", true, null], ["talk", true, null], ["ready", false, "nothing-to-ready"], ["splint", false, "not-now"], ["wrap", true, null],
  ]);
  const swap = until(mini, planned({ n02: "major-wind" }), "n08", "POUCH_SWAP");
  assert.deepEqual(mini.view(swap).pouch.options.map((o) => [o.key, o.kind, o.available, o.reason]), [
    ["take", "take", true, null], ["release-seeds", "release", false, "pouch-not-full"], ["refuse", "refuse", true, null],
  ]);
  const holding = mini.restore({ ...structuredClone(camp), payload: { ...structuredClone(camp.payload), journey: { ...structuredClone(camp.payload.journey), pouch: { capacity: 4, held: ["item_pkam_tin_gear"], acquired: ["item_pkam_tin_gear"], released: [], remembered: ["item_pkam_tin_gear"], memory: [] } } } });
  rejected(mini.campPick(holding, { revision: holding.revision, now: NOW, activity: "ready", item: "item_kib_glowing_seeds" }), "JOURNEY_OPTION_UNAVAILABLE");
  const readied = mini.campPick(holding, { revision: holding.revision, now: NOW, activity: "ready", item: "item_pkam_tin_gear" });
  assert.deepEqual(readied.state.payload.journey.ready, ["item_pkam_tin_gear"]);
  assert.equal(readied.state.payload.history.at(-1).action, "ready.item_pkam_tin_gear");
  assertSaveable(readied.state, "ready pick");
  const refused = mini.pouchDecide(swap, { revision: swap.revision, now: NOW, option: "refuse" });
  assert.deepEqual(refused.state.payload.journey.pouch.memory, ["refused_teuk_whistle_charm"]);
  rejected(mini.pouchDecide(swap, { revision: swap.revision, now: NOW, option: "keep" }), "JOURNEY_OPTION_UNKNOWN");
});

test("TC-S5-ENDING-001 the ending view shows strands, the first missing line and the Safety Fallback", () => {
  const ending = until(mini, planned({ n02: "major-wind" }), "n11", "ENDING_RESONANCE");
  const options = mini.view(ending).endings.options;
  assert.deepEqual(options.map((o) => o.ending), ["e-home", "e-pond", "e-dawn"]);
  const home = options[0];
  assert.equal(home.open, false, "no button in the mini journey");
  assert.equal(home.lockLine, "n11.k2");
  rejected(mini.chooseEnding(ending, { revision: ending.revision, now: NOW, option: "home" }), "JOURNEY_OPTION_UNAVAILABLE");
  const broken = mini.restore({ ...structuredClone(ending), payload: { ...structuredClone(ending.payload), journey: { ...structuredClone(ending.payload.journey), meters: { hp: 1, mind: 1, sta: 1 }, pouch: { capacity: 4, held: [], acquired: [], released: [], remembered: [], memory: [] }, counters: { ...ending.payload.journey.counters, familySkillUses: 0 } } } });
  const fallback = mini.view(broken).endings;
  assert.equal(fallback.fallback, true);
  assert.equal(fallback.fallbackLine, "n11.f");
  assert.deepEqual(fallback.options.map((o) => [o.ending, o.open, o.fallback]), [["e-home", false, false], ["e-pond", true, true], ["e-dawn", false, false]]);
  const chosen = mini.chooseEnding(broken, { revision: broken.revision, now: NOW, option: "pond" });
  assert.equal(chosen.ok, true);
  const same = mini.view({ ...broken, payload: { ...broken.payload, playTimeMs: 999999, sessionId: "87654321-4321-4321-8321-cba987654321" } }).endings;
  assert.deepEqual(same, fallback, "only the journey decides the endings");
});

// ---------------------------------------------------------------------------------------
// Replay and restore
// ---------------------------------------------------------------------------------------
test("TC-S5-REPLAY-001 replaying an act restores its snapshot, drops later snapshots and keeps endings seen", () => {
  const done = playSession(mini, planned({ n02: "major-wind", n10: "plan-a" })).state;
  const seen = done.payload.completion.endingsSeen;
  const replay = mini.replayAct(done, { revision: done.revision, now: NOW, act: 3 });
  assert.equal(replay.ok, true, JSON.stringify(replay.error));
  const p = replay.state.payload;
  assert.deepEqual(p.cursor, { node: "n08", beat: "vn", line: 0 });
  assert.deepEqual(p.journey, done.payload.actStarts[2].journey);
  assert.deepEqual(p.actStarts.map((s) => s.act), [1, 2, 3]);
  assert.ok(p.history.every((h) => ["n02", "n03", "n04", "n05"].includes(h.node)));
  assert.deepEqual(p.completion.endingsSeen, seen);
  assert.equal(p.encounter, null);
  assert.deepEqual(replay.events.at(-1), { type: "replay", act: 3 });
  const boundary = playSession(act1, planned()).state;
  const back = act1.replayAct(boundary, { revision: boundary.revision, now: NOW, act: 2 });
  assert.equal(act1.modeOf(back.state), "BOUNDARY");
  const first = act1.replayAct(boundary, { revision: boundary.revision, now: NOW, act: 1 });
  assert.deepEqual(first.state.payload.cursor, { node: "a1-01", beat: "vn", line: 0 });
  assert.deepEqual(first.state.payload.history, []);
});

test("TC-S5-STATE-001 restore admits only states that fit the package", () => {
  const run = playSession(act1, planned());
  const sample = run.states.find((s) => act1.modeOf(s) === "CLASH_CHOOSE");
  const campState = run.states.find((s) => act1.modeOf(s) === "CAMP");
  const tamper = (state, mutate) => { const copy = structuredClone(state); mutate(copy); return copy; };
  const bad = [
    tamper(sample, (s) => { s.revision = 0; }),
    tamper(sample, (s) => { s.extra = 1; }),
    tamper(sample, (s) => { s.payload.sessionId = "x"; }),
    tamper(sample, (s) => { s.payload.startedAt = "today"; }),
    tamper(sample, (s) => { s.payload.playTimeMs = -1; }),
    tamper(sample, (s) => { s.payload.cursor.beat = "camp"; }),
    tamper(sample, (s) => { s.payload.cursor.node = "a9-99"; }),
    tamper(sample, (s) => { s.payload.cursor = { node: "a1-01", beat: "vn", line: 40 }; s.payload.encounter = null; }),
    tamper(sample, (s) => { s.payload.encounter = null; }),
    tamper(sample, (s) => { s.payload.encounter.round = "R2"; }),
    tamper(sample, (s) => { s.payload.cursor.beat = "clash-outcome"; }),
    tamper(campState, (s) => { s.payload.encounter.dropsLeft = 1; }),
    tamper(campState, (s) => { s.payload.encounter.camp = "C2"; }),
    tamper(campState, (s) => { s.payload.cursor.beat = "decision"; }),
    tamper(sample, (s) => { s.payload.actStarts.push(structuredClone(s.payload.actStarts[0])); }),
    tamper(sample, (s) => { s.payload.actStarts[0].node = "a1-05"; s.payload.actStarts[0].act = 2; }),
    tamper(sample, (s) => { s.payload.completion.endingsSeen = ["e-moon"]; }),
    tamper(sample, (s) => { s.payload.history.push({ sequence: 1, node: "a1-03", action: "rain", committedAt: NOW }); }),
    tamper(sample, (s) => { s.payload.history[0].action = "Rain"; }),
    tamper(sample, (s) => { s.payload.history[0].node = "zz-99"; }),
    tamper(sample, (s) => { s.payload.journey.meters.hp = 9; }),
    tamper(run.states[0], (s) => { s.payload.encounter = { kind: "camp", camp: "C1", dropsLeft: 2, chosen: [] }; }),
  ];
  bad.forEach((state, i) => assert.throws(() => act1.restore(state), (e) => e.code === "JOURNEY_STATE_INVALID", `case ${i}`));
  const decided = run.states.find((s) => s.payload.cursor.node === "a1-03" && act1.modeOf(s) === "VN" && s.payload.history.at(-1)?.node === "a1-03");
  assert.throws(() => act1.restore(tamper(decided, (s) => { s.payload.cursor.beat = "decision"; })), (e) => e.code === "JOURNEY_STATE_INVALID");
  assert.throws(() => act1.restore(tamper(decided, (s) => { s.payload.history.at(-1).action = "fire"; })), (e) => e.code === "JOURNEY_STATE_INVALID");
});

test("TC-S5-STATE-001 history keeps the last 200 committed actions and play time never changes the revision", () => {
  let state = playSession(act1, planned()).state;
  const longHistory = structuredClone(state);
  longHistory.payload.history = Array.from({ length: HISTORY_MAX }, (_, i) => ({ sequence: i + 1, node: "a1-03", action: "rain", committedAt: NOW }));
  state = act1.restore(longHistory);
  const replay = act1.replayAct(state, { revision: state.revision, now: NOW, act: 2 });
  assert.ok(replay.state.payload.history.length <= HISTORY_MAX);
  const timed = act1.addPlayTime(state, 1500);
  assert.equal(timed.revision, state.revision);
  assert.equal(timed.payload.playTimeMs, state.payload.playTimeMs + 1500);
  assert.throws(() => act1.addPlayTime(state, -1), (e) => e.code === "JOURNEY_COMMAND_INVALID");
});

// ---------------------------------------------------------------------------------------
// Package admission and the play-mode machine
// ---------------------------------------------------------------------------------------
test("TC-S5-STATE-001 the session refuses packages that break what the runtime relies on", () => {
  const base = loadMiniJourney();
  const variant = (mutate) => { const pkg = structuredClone(base); mutate(pkg); return pkg; };
  const node = (pkg, id) => pkg.nodes.find((n) => n.id === id);
  const cases = [
    [variant((p) => { p.profile = "legacy"; }), "JOURNEY_PACKAGE_INVALID"],
    [variant((p) => { p.nodes.push(structuredClone(p.nodes[0])); }), "JOURNEY_PACKAGE_INVALID"],
    [variant((p) => { p.boundaries.push({ node: "n01", act: 1 }); }), "JOURNEY_PACKAGE_INVALID"],
    [variant((p) => { node(p, "n01").next = "n99"; }), "JOURNEY_PACKAGE_INVALID"],
    [variant((p) => { node(p, "n07").next = "n01"; }), "JOURNEY_PACKAGE_INVALID"],
    [variant((p) => { node(p, "n09").options.pop(); }), "JOURNEY_PACKAGE_INVALID"],
    [variant((p) => { node(p, "n04").round = "R4A"; }), "CLASH_ROUND_UNKNOWN"],
    [variant((p) => { node(p, "n04").round = "R2"; }), "JOURNEY_PACKAGE_INVALID"],
    [variant((p) => { p.rounds[0].intents.pop(); }), "CLASH_ROUND_INVALID"],
    [variant((p) => { node(p, "n05").activities[0].key = "leave"; }), "JOURNEY_PACKAGE_INVALID"],
    [variant((p) => { node(p, "n05").activities[2].key = "a".repeat(30); }), "JOURNEY_PACKAGE_INVALID"],
    [variant((p) => { node(p, "n05").activities[1].key = "eat"; }), "JOURNEY_PACKAGE_INVALID"],
    [variant((p) => { node(p, "n08").offer.releases[0].release = "item_teuk_peuak_button"; }), "JOURNEY_PACKAGE_INVALID"],
    [variant((p) => { node(p, "n11").endings[0].locks.pop(); }), "JOURNEY_PACKAGE_INVALID"],
    [variant((p) => { node(p, "n11").endings[1].ending = "e-home"; }), "JOURNEY_PACKAGE_INVALID"],
    [variant((p) => { node(p, "n06").micro.durationMs = 100; }), "JOURNEY_PACKAGE_INVALID"],
    [variant((p) => { p.start.node = "n99"; }), "JOURNEY_PACKAGE_INVALID"],
    [variant((p) => { node(p, "n02").options.forEach((o) => { delete o.next; }); delete node(p, "n02").next; }), "JOURNEY_PACKAGE_INVALID"],
    [variant((p) => { node(p, "n01").type = "dream"; }), "JOURNEY_PACKAGE_INVALID"],
  ];
  cases.forEach(([pkg, code], i) => assert.throws(() => createJourneySession(pkg), (e) => e.code === code, `case ${i} ${code}`));
});

test("TC-S5-STATE-001 play modes follow UX §1.7 and a modal pauses everything", () => {
  const saveBeats = JOURNEY_SCHEMA_CATALOG["v3.0.0/journey-save.schema.json"].$defs.cursor.properties.beat.enum;
  assert.deepEqual(Object.keys(BEAT_MODES).sort(), [...saveBeats].sort());
  for (const mode of PLAY_MODES) {
    for (const modal of MODALS) assert.deepEqual(acceptedCommands(mode, modal), ["closeModal"]);
    assert.ok(acceptedCommands(mode).includes("replayAct"));
  }
  assert.deepEqual(acceptedCommands("CLASH_CHOOSE"), ["clashAct", "replayAct"]);
  assert.throws(() => acceptedCommands("GAME_OVER"), TypeError);
  assert.throws(() => acceptedCommands("VN", "inventory"), TypeError);
  assert.equal(PLAY_MODES.includes("GAME_OVER"), false, "the Journey has no Game Over");
  assert.equal(transitionAllowed("CLASH_CHOOSE", "VN", false), false);
  assert.equal(transitionAllowed("BOUNDARY", "VN", true), false);
  assert.equal(transitionAllowed("VN", "NOWHERE", true), false);
  assert.equal(transitionAllowed("CLASH_OUTCOME", "VN", false), true);
});

test("TC-S5-TRAY-001 the clash view of the session lists every legal card once", () => {
  const choose = until(act1, planned({ "a1-03": "wind" }), "a1-08", "CLASH_CHOOSE");
  assert.deepEqual(clashCards(act1.view(choose)), ["strike", "guard", "rest", "rain", "wind", "eye", "s_kab", "s_kib"]);
});
