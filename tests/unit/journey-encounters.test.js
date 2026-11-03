import test from "node:test";
import assert from "node:assert/strict";
import { allows, holds, visibleLines } from "../../src/core/domain/journey/conditions.js";
import { affordable, applyEffect, applyEffects } from "../../src/core/domain/journey/effects.js";
import { ENDINGS, ENDING_REASONS, evaluateEndings } from "../../src/core/domain/journey/endings.js";
import { JourneyError } from "../../src/core/domain/journey/journey-errors.js";
import { createJourneyState } from "../../src/core/domain/journey/journey-state.js";
import { KEEPSAKES } from "../../src/core/domain/clash/clash-rules.js";
import { methodCost, obstacleBlock, obstacleHomesick, resolveObstacle } from "../../src/core/domain/encounters/obstacle.js";
import { activityBlock, campFinished, openCamp, pickActivity, readyCandidates } from "../../src/core/domain/encounters/camp.js";
import { offerBlock, offerChoices, offerDecided, resolveOffer } from "../../src/core/domain/encounters/pouch-offer.js";
import { microValid, microView } from "../../src/core/domain/encounters/micro.js";
import { endings as modelEndings } from "../../docs/design-system/evidence/five-act-balance-model.mjs";

/** Trace: TC-S5-STATE-001, TC-S5-ENDING-001, master plan §2.1–§2.13, ADR-P0-020, ADR-P0-034 D4. */
const K = KEEPSAKES;
const rules = { lockedItems: new Set([K.button]) };
function journey({ act = 2, hp = 4, mind = 4, sta = 4, pkam = 0, fiw = 0, teuk = 0, fsu = 0, sr = 0, streak = 0, tempo = 0, held = [], ready = [], flags = [], major = null } = {}) {
  const j = createJourneyState({ act, meters: { hp, mind, sta } });
  j.bonds = { pkam, fiw, teuk };
  j.counters = { familySkillUses: fsu, selfReliance: sr, homeStreak: streak, homesickCount: 0, tempo };
  for (const id of held) { j.pouch.held.push(id); j.pouch.acquired.push(id); j.pouch.remembered.push(id); }
  Object.assign(j, { ready, flags, major });
  return j;
}
const fails = (fn, code) => assert.throws(fn, (e) => e instanceof JourneyError && e.code === code, code);

test("TC-S5-STATE-001 conditions of the closed vocabulary", () => {
  const j = journey({ held: [K.gear], flags: ["met_pkam"], mind: 3, pkam: 2, fsu: 3, major: "eye" });
  j.route = "B";
  j.plan = "A";
  const yes = [
    { hasItem: K.gear }, { flag: "met_pkam" }, { meterAtLeast: { meter: "mind", value: 3 } }, { bondAtLeast: { bond: "pkam", value: 2 } },
    { counterAtLeast: { counter: "familySkillUses", value: 3 } }, { major: "eye" }, { route: "B" }, { plan: "A" },
    { all: [{ major: "eye" }, { route: "B" }] }, { any: [{ major: "rain" }, { plan: "A" }] }, { not: { hasItem: K.seeds } },
  ];
  const no = [{ hasItem: K.seeds }, { meterAtLeast: { meter: "mind", value: 4 } }, { counterAtLeast: { counter: "selfReliance", value: 1 } }, { all: [{ major: "eye" }, { route: "A" }] }, { any: [{ flag: "x" }] }];
  for (const c of yes) assert.equal(holds(c, j), true, JSON.stringify(c));
  for (const c of no) assert.equal(holds(c, j), false, JSON.stringify(c));
  assert.equal(allows(undefined, j), true);
  assert.deepEqual(visibleLines([{ text: "a" }, { text: "b", when: { major: "rain" } }, { text: "c", when: { major: "eye" } }], j).map((l) => l.text), ["a", "c"]);
  for (const bad of [null, {}, { all: [] }, { any: "x" }, { major: "eye", route: "B" }, { meterAtLeast: { meter: "luck", value: 1 } }, { bondAtLeast: {} }, { counterAtLeast: { counter: "homeStreak", value: 1 } }, { weather: "rain" }]) {
    fails(() => holds(bad, j), "JOURNEY_PACKAGE_INVALID");
  }
});

test("TC-S5-STATE-001 effects of the closed vocabulary", () => {
  const j = journey({ held: [K.seeds, K.guard, K.button] });
  applyEffects(j, [
    { op: "meter.set", meters: { hp: 3, mind: 3, sta: 3 } }, { op: "meter.add", meter: "hp", amount: 5 }, { op: "meter.spend", meter: "sta", amount: 2 },
    { op: "meter.hazard", meter: "mind", amount: 4 }, { op: "floor.rest", meters: { hp: 2, mind: 2, sta: 2 } }, { op: "bond.add", bond: "fiw", amount: 9 },
    { op: "flag.set", flag: "met_fiw" }, { op: "flag.set", flag: "met_fiw" }, { op: "pick.major", value: "rain" }, { op: "pick.route", value: "A" }, { op: "pick.plan", value: "B" },
    { op: "item.grant", item: K.gear }, { op: "item.release", item: K.guard }, { op: "item.ready", item: K.seeds }, { op: "item.ready", item: K.seeds },
  ], rules);
  assert.deepEqual([j.meters, j.bonds.fiw, j.flags, j.major, j.route, j.plan], [{ hp: 5, mind: 2, sta: 2 }, 4, ["met_fiw"], "rain", "A", "B"]);
  assert.deepEqual([j.pouch.held, j.pouch.released, j.ready], [[K.seeds, K.button, K.gear], [K.guard], [K.seeds]]);
  applyEffects(j, undefined, rules);
  fails(() => applyEffect(j, { op: "meter.spend", meter: "sta", amount: 2 }, rules), "JOURNEY_EFFECT_FAILED");
  fails(() => applyEffect(j, { op: "item.release", item: K.button }, rules), "JOURNEY_EFFECT_FAILED");
  fails(() => applyEffect(j, { op: "item.release", item: K.whistle }, rules), "JOURNEY_EFFECT_FAILED");
  fails(() => applyEffect(j, { op: "item.grant", item: K.seeds }, rules), "JOURNEY_EFFECT_FAILED");
  const full = journey({ ready: [K.seeds, K.guard, K.gear, K.button] });
  fails(() => applyEffect(full, { op: "item.ready", item: K.ribbon }, rules), "JOURNEY_EFFECT_FAILED");
  fails(() => applyEffect(j, { op: "weather.set" }, rules), "JOURNEY_PACKAGE_INVALID");
  fails(() => applyEffect(j, null, rules), "JOURNEY_PACKAGE_INVALID");
  assert.equal(affordable([{ op: "meter.spend", meter: "sta", amount: 1 }, { op: "meter.spend", meter: "sta", amount: 1 }], journey({ sta: 3 })), true);
  assert.equal(affordable([{ op: "meter.spend", meter: "sta", amount: 1 }, { op: "meter.spend", meter: "sta", amount: 1 }], journey({ sta: 2 })), false);
  assert.equal(affordable(undefined, journey()), true);
});

const option = (method, effects = []) => ({ key: method.kind, method, label: "x", effects, responses: [] });

test("TC-S5-STATE-001 obstacles: every key has its condition and cost, grit is always open", () => {
  const j = journey({ act: 2, mind: 2, sta: 2, pkam: 1, held: [K.seeds] });
  const block = (m, e) => obstacleBlock(option(m, e), j);
  assert.deepEqual([
    block({ kind: "skill", skill: "rain" }), block({ kind: "sibling", sibling: "kab" }), block({ kind: "item", item: K.seeds }), block({ kind: "item", item: K.guard }),
    block({ kind: "combo", item: K.guard, ally: "pkam" }), block({ kind: "friend", ally: "pkam", minBond: 2 }), block({ kind: "friend", ally: "pkam", minBond: 1 }),
    block({ kind: "alone", sta: 1, needSta: 2 }), block({ kind: "rush" }), block({ kind: "wait" }), block({ kind: "grit" }),
    block({ kind: "wait" }, [{ op: "meter.spend", meter: "sta", amount: 2 }]),
  ], [null, null, null, "item-missing", "item-missing", "bond-low", null, "mind-low", "sta-low", null, null, "sta-low"]);
  assert.equal(obstacleBlock(option({ kind: "alone", sta: 2, needSta: 4 }), journey({ mind: 3, sta: 3 })), "sta-low");
  assert.deepEqual([methodCost({ kind: "alone", sta: 2 }), methodCost({ kind: "rush" }), methodCost({ kind: "grit" }), methodCost({ kind: "wait" })], [{ sta: 2 }, { sta: 2 }, { hp: 1, sta: 2 }, {}]);
  assert.equal(obstacleHomesick(option({ kind: "skill", skill: "rain" }), journey({ act: 2, streak: 1 })), true);
  assert.equal(obstacleHomesick(option({ kind: "skill", skill: "rain" }), journey({ act: 1, streak: 1 })), false);
  assert.equal(obstacleHomesick(option({ kind: "grit" }), journey({ act: 2, streak: 1 })), false);
});

test("TC-S5-STATE-001 obstacles resolve as the balance model does", () => {
  const run = (method, start, effects) => { const j = journey(start); const r = resolveObstacle(j, option(method, effects), rules); return { j, r }; };
  const skill = run({ kind: "skill", skill: "wind" }, { act: 2, streak: 1 });
  assert.deepEqual([skill.r.homesick, skill.j.meters.mind, skill.j.meters.sta, skill.j.counters.familySkillUses, skill.j.counters.homeStreak, skill.j.counters.homesickCount], [true, 3, 3, 1, 2, 1]);
  const home = run({ kind: "sibling", sibling: "kab" }, { act: 1, streak: 3 });
  assert.deepEqual([home.r.homesick, home.j.counters.familySkillUses, home.j.counters.homeStreak], [false, 0, 4]);
  const alone = run({ kind: "alone", sta: 2, needSta: 3 }, { act: 2, streak: 2 });
  assert.deepEqual([alone.j.meters.sta, alone.j.counters.selfReliance, alone.j.counters.homeStreak], [2, 1, 0]);
  assert.equal(run({ kind: "alone", sta: 1, needSta: 2 }, { act: 1 }).j.counters.selfReliance, 0, "Act 1 does not count self-reliance");
  const rush = run({ kind: "rush" }, { act: 3, tempo: 2 });
  assert.deepEqual([rush.j.meters.sta, rush.j.counters.tempo, rush.j.counters.selfReliance], [2, 2, 1]);
  const wait = run({ kind: "wait" }, { tempo: -1 });
  assert.deepEqual([wait.j.counters.tempo, wait.j.counters.selfReliance], [-1, 0]);
  const grit = run({ kind: "grit" }, { act: 4, hp: 1, sta: 1 });
  assert.deepEqual([grit.r.grace, grit.j.meters, grit.j.counters.selfReliance], [true, { hp: 2, mind: 4, sta: 2 }, 1]);
  const combo = run({ kind: "combo", item: K.guard, ally: "pkam" }, { held: [K.guard], streak: 2 }, [{ op: "bond.add", bond: "pkam", amount: 2 }]);
  assert.deepEqual([combo.j.bonds.pkam, combo.j.counters.homeStreak], [2, 0]);
});

test("TC-S5-STATE-001 camps: drops, groups, readying a keepsake and leaving", () => {
  const node = {
    camp: "C3", drops: 3, activities: [
      { key: "splint", label: "a", group: "ankle", when: { hasItem: K.guard }, effects: [{ op: "item.release", item: K.guard }, { op: "bond.add", bond: "teuk", amount: 1 }], responses: [] },
      { key: "cloth", label: "b", group: "ankle", effects: [{ op: "bond.add", bond: "teuk", amount: 1 }], responses: [] },
      { key: "ready", label: "c", ready: true, effects: [], responses: [] },
      { key: "bugs", label: "d", effects: [{ op: "meter.add", meter: "sta", amount: 2 }, { op: "meter.spend", meter: "hp", amount: 1 }], responses: [] },
    ],
  };
  const j = journey({ hp: 1, held: [K.guard, K.seeds], ready: [K.seeds] });
  let camp = openCamp(node);
  assert.deepEqual(camp, { kind: "camp", camp: "C3", dropsLeft: 3, chosen: [] });
  assert.deepEqual(readyCandidates(j), [K.guard]);
  assert.deepEqual(node.activities.map((a) => activityBlock(a, node, j, camp)), [null, null, null, "sta-low"]);
  camp = pickActivity(j, node.activities[0], camp, rules);
  assert.deepEqual([j.pouch.held, j.bonds.teuk, camp.dropsLeft], [[K.seeds], 1, 2]);
  assert.deepEqual(node.activities.map((a) => activityBlock(a, node, j, camp)), ["chosen", "group-taken", "nothing-to-ready", "sta-low"]);
  assert.equal(campFinished(node, j, camp), true, "nothing left to do even with drops left");
  const k = journey({ held: [K.gear] });
  let c2 = openCamp(node);
  c2 = pickActivity(k, node.activities[2], c2, rules, K.gear);
  assert.deepEqual(k.ready, [K.gear]);
  c2 = { ...c2, dropsLeft: 0 };
  assert.equal(activityBlock(node.activities[1], node, k, c2), "no-drops");
  assert.equal(activityBlock(node.activities[0], node, k, { ...openCamp(node) }), "not-now");
  assert.equal(campFinished(node, k, c2), true);
  assert.equal(campFinished(node, k, openCamp(node)), false);
});

test("TC-S5-STATE-001 pouch offers: take, hand on, refuse and the locked button", () => {
  const offer = {
    item: K.whistle,
    take: { key: "take", label: "a", effects: [{ op: "bond.add", bond: "teuk", amount: 1 }], responses: [] },
    releases: [
      { key: "seeds", release: K.seeds, label: "b", effects: [{ op: "flag.set", flag: "seeds_to_teuk" }], responses: [] },
      { key: "button", release: K.button, label: "c", effects: [], responses: [] },
      { key: "gear", release: K.gear, label: "d", effects: [{ op: "meter.spend", meter: "sta", amount: 9 }], responses: [] },
    ],
    refuse: { key: "refuse", label: "e", effects: [], responses: [] },
  };
  const entries = offerChoices(offer);
  assert.deepEqual(entries.map((e) => e.kind), ["take", "release", "release", "release", "refuse"]);
  const full = journey({ held: [K.seeds, K.guard, K.gear, K.button] });
  assert.deepEqual(entries.map((e) => offerBlock(e, full, rules.lockedItems)), ["pouch-full", null, "locked", "sta-low", null]);
  const roomy = journey({ held: [K.guard] });
  assert.deepEqual(entries.map((e) => offerBlock(e, roomy, rules.lockedItems)), [null, "pouch-not-full", "locked", "pouch-not-full", null]);
  assert.equal(offerBlock(entries[1], journey({ held: [K.guard, K.gear, K.button, K.ribbon] }), rules.lockedItems), "not-held");
  resolveOffer(full, offer, entries[1], rules);
  assert.deepEqual([full.pouch.held, full.pouch.released, full.flags, offerDecided(offer, full)], [[K.whistle, K.guard, K.gear, K.button], [K.seeds], ["seeds_to_teuk"], true]);
  resolveOffer(roomy, offer, entries[0], rules);
  assert.deepEqual([roomy.pouch.held, roomy.bonds.teuk], [[K.guard, K.whistle], 1]);
  const refusing = journey();
  resolveOffer(refusing, offer, entries[4], rules);
  assert.deepEqual([refusing.pouch.held, refusing.pouch.memory, offerDecided(offer, refusing)], [[], ["refused_teuk_whistle_charm"], true]);
  fails(() => resolveOffer(refusing, offer, entries[4], rules), "JOURNEY_EFFECT_FAILED");
});

test("TC-S5-STATE-001 micro-actions have nothing to fail and change no meter", () => {
  const micro = { kind: "tap3", ma: "MA-1", durationMs: 6000, hint: "a1-12.h" };
  assert.deepEqual(microView(micro), micro);
  assert.equal(microValid(micro), true);
  for (const bad of [null, { ...micro, kind: "swipe" }, { ...micro, ma: "MA-7" }, { ...micro, durationMs: 9000 }, { ...micro, durationMs: 2999 }, { ...micro, hint: 1 }]) assert.equal(microValid(bad), false);
});

test("TC-S5-ENDING-001 the three endings and the Safety Fallback equal the balance model on every threshold", () => {
  const short = { [K.seeds]: "seeds", [K.guard]: "guard", [K.gear]: "gear", [K.button]: "button", [K.whistle]: "whistle", [K.ribbon]: "ribbon" };
  const keepsakes = Object.values(K);
  let checked = 0;
  let fallbacks = 0;
  for (let mask = 0; mask < 64; mask += 1) {
    const held = keepsakes.filter((_, i) => mask & (1 << i));
    if (held.length > 4) continue;
    for (const hp of [1, 2, 3]) for (const mind of [1, 2, 3]) for (const sta of [1, 2, 3]) for (const fsu of [1, 2, 3]) for (const sr of [3, 4]) {
      for (const pkam of [1, 2, 3]) for (const fiw of [1, 2, 3]) for (const teuk of [1, 2, 3]) {
        const j = journey({ act: 5, hp, mind, sta, fsu, sr, pkam, fiw, teuk, held });
        const ours = evaluateEndings(j);
        const theirs = modelEndings({ hp, mind, sta, fsu, sr, bk: pkam, bf: fiw, bt: teuk, items: held.map((id) => short[id]) });
        assert.deepEqual([ours.endings["e-home"].open, ours.endings["e-pond"].open, ours.endings["e-dawn"].open, ours.fallback], [theirs.home, theirs.pond, theirs.dawn, theirs.fallback]);
        for (const id of ENDINGS) assert.equal(ours.endings[id].missing.length === 0, ours.endings[id].open && !(id === "e-pond" && ours.fallback), "missing is empty only when the ending opens by itself");
        if (ours.fallback) fallbacks += 1;
        checked += 1;
      }
    }
  }
  assert.ok(checked > 100000);
  assert.ok(fallbacks > 0);
  assert.deepEqual(Object.keys(ENDING_REASONS), ENDINGS);
});

test("TC-S5-ENDING-001 strands light by UX §6.2 and the button never counts as a promise", () => {
  const j = journey({ act: 5, mind: 2, hp: 2, sta: 2, teuk: 1, held: [K.button] });
  const r = evaluateEndings(j);
  assert.deepEqual(r.endings["e-home"], { open: false, missing: ["promise"], strands: { heart: true, promise: false, button: true } });
  assert.deepEqual(r.endings["e-pond"].missing, ["roots"]);
  assert.equal(r.fallback, true);
  assert.equal(r.endings["e-pond"].open, true);
  const dawn = evaluateEndings(journey({ act: 5, mind: 3, hp: 3, sta: 3, fsu: 3, sr: 4, pkam: 2, fiw: 2, teuk: 3, held: [K.button, K.seeds, K.ribbon] }));
  assert.deepEqual(Object.values(dawn.endings).map((e) => e.open), [true, true, true]);
  assert.deepEqual(dawn.endings["e-dawn"].strands, { core: true, bonds: true, worlds: true });
});
