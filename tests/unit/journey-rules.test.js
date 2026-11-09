import test from "node:test";
import assert from "node:assert/strict";
import {
  ASSIST_BOND, BOND_MAX, COUNTER_MAX, FAMILY_BOND, GRACE_FLOOR, METER_MAX, SOFT_FLOOR,
  addressTier, bumpCounter, catchWithGrace, clampBond, clampMeter, clampTempo, leanOnFamily, payGrit, raiseToFloor, softDecrease, standOnOwn,
} from "../../src/core/domain/journey/journey-rules.js";
import { JOURNEY_ERROR_CODES, JourneyError, ensure } from "../../src/core/domain/journey/journey-errors.js";
import { assertJourneyState, createJourneyState } from "../../src/core/domain/journey/journey-state.js";
import { cloneData, deepFreeze, frozenCopy } from "../../src/core/domain/journey/plain-data.js";

/** Trace: TC-S5-STATE-001, master plan §2.1–§2.5, ADR-P0-034 D2/D3. */

test("TC-S5-STATE-001 meters: soft floor for hazards, only grit reaches zero, Grace returns every meter to two", () => {
  assert.deepEqual([5, 3, 2, 1, 0].map((v) => softDecrease(v)), [4, 2, 1, 1, 0]);
  assert.equal(softDecrease(5, 3), 2);
  assert.equal(softDecrease(3, 5), SOFT_FLOOR);
  const meters = { hp: 1, mind: 3, sta: 1 };
  payGrit(meters);
  assert.deepEqual(meters, { hp: 0, mind: 3, sta: 0 });
  assert.equal(catchWithGrace(meters), true);
  assert.deepEqual(meters, { hp: GRACE_FLOOR, mind: 3, sta: GRACE_FLOOR });
  assert.equal(catchWithGrace({ hp: 1, mind: 1, sta: 1 }), false);
  for (const name of ["hp", "mind", "sta"]) {
    const m = { hp: 3, mind: 3, sta: 3, [name]: 0 };
    assert.equal(catchWithGrace(m), true, name);
    assert.deepEqual(m, { hp: 3, mind: 3, sta: 3, [name]: GRACE_FLOOR });
  }
  assert.deepEqual([-1, 0, 5, 6].map(clampMeter), [0, 0, 5, METER_MAX]);
  assert.deepEqual([-1, 4, 5].map(clampBond), [0, 4, BOND_MAX]);
  assert.deepEqual([-2, -1, 2, 3].map(clampTempo), [-1, -1, 2, 2]);
  assert.equal(bumpCounter(COUNTER_MAX), COUNTER_MAX);
});

test("TC-S5-STATE-001 rest floors raise each meter to the floor and never lower one", () => {
  const meters = { hp: 1, mind: 5, sta: 3 };
  raiseToFloor(meters, { hp: 4, mind: 3, sta: 4 });
  assert.deepEqual(meters, { hp: 4, mind: 5, sta: 4 });
});

test("TC-S5-STATE-001 homesick: Act 1 is home, from Act 2 a second family use in a row costs ใจ and แรง", () => {
  const meters = { mind: 4, sta: 4 };
  const counters = { familySkillUses: 0, homeStreak: 0 };
  assert.equal(leanOnFamily(meters, counters, 1), 0);
  assert.equal(leanOnFamily(meters, counters, 1), 0);
  assert.deepEqual([meters, counters], [{ mind: 4, sta: 4 }, { familySkillUses: 0, homeStreak: 2 }]);
  standOnOwn(counters);
  assert.equal(leanOnFamily(meters, counters, 2), 0);
  assert.equal(leanOnFamily(meters, counters, 2), 1);
  assert.equal(leanOnFamily(meters, counters, 3), 2);
  assert.deepEqual([meters, counters], [{ mind: 2, sta: 2 }, { familySkillUses: 3, homeStreak: 3 }]);
  const floor = { mind: 1, sta: 1 };
  leanOnFamily(floor, { familySkillUses: 0, homeStreak: 1 }, 5);
  assert.deepEqual(floor, { mind: 1, sta: 1 }, "homesick never goes below the soft floor");
});

test("TC-S5-STATE-001 bonds: address tiers 0–1, 2 and 3–4, assists from 3, family bond full after Act 1", () => {
  assert.deepEqual([0, 1, 2, 3, 4].map(addressTier), [1, 1, 2, 3, 3]);
  assert.equal(ASSIST_BOND, 3);
  assert.equal(FAMILY_BOND, BOND_MAX);
});

test("TC-S5-STATE-001 New Game state and the JourneyState guard", () => {
  const state = createJourneyState({ act: 1, meters: { hp: 5, mind: 4, sta: 5 } });
  assert.deepEqual(state, {
    act: 1, meters: { hp: 5, mind: 4, sta: 5 }, bonds: { pkam: 0, fiw: 0, teuk: 0 },
    counters: { familySkillUses: 0, selfReliance: 0, homeStreak: 0, homesickCount: 0, tempo: 0 },
    route: null, plan: null, major: null,
    pouch: { capacity: 4, held: [], acquired: [], released: [], remembered: [], memory: [] }, ready: [], flags: [],
  });
  assert.equal(Object.isFrozen(state.pouch.held), false, "a new state is a mutable draft");
  const bad = (mutate) => { const s = structuredClone(state); mutate(s); return s; };
  const cases = [
    null, [], bad((s) => { delete s.flags; }), bad((s) => { s.act = 6; }), bad((s) => { s.meters = { hp: 1 }; }),
    bad((s) => { s.meters.mind = 1.5; }), bad((s) => { s.bonds = null; }), bad((s) => { s.bonds.teuk = 5; }),
    bad((s) => { s.counters = {}; }), bad((s) => { s.counters.homesickCount = 100; }), bad((s) => { s.counters.tempo = -2; }),
    bad((s) => { s.route = "C"; }), bad((s) => { s.plan = 1; }), bad((s) => { s.major = "eyes"; }), bad((s) => { s.pouch = null; }),
    bad((s) => { s.pouch.capacity = 5; }), bad((s) => { s.pouch.memory = "x"; }), bad((s) => { s.pouch.held = ["item_a"]; }),
    bad((s) => { s.pouch.acquired = Array.from({ length: 33 }, (_, i) => `item_x${i}`); }),
    bad((s) => { s.ready = ["item_a", "item_b", "item_c", "item_d", "item_e"]; }), bad((s) => { s.ready = ["Item_A"]; }),
    bad((s) => { s.flags = ["Flag"]; }), bad((s) => { s.flags = [`a${"b".repeat(48)}`]; }),
  ];
  for (const value of cases) {
    assert.throws(() => assertJourneyState(value, "save.journey"), (error) => error instanceof JourneyError
      && error.code === JOURNEY_ERROR_CODES.STATE_INVALID && error.details.path.startsWith("save.journey"));
  }
});

test("TC-S5-STATE-001 typed errors keep a closed list of codes", () => {
  assert.throws(() => new JourneyError("NOPE", "x"), TypeError);
  const error = new JourneyError(JOURNEY_ERROR_CODES.BEAT, "wrong beat", { beat: "vn" });
  assert.equal(error.name, "JourneyError");
  assert.ok(Object.isFrozen(error.details));
  assert.doesNotThrow(() => ensure(true, JOURNEY_ERROR_CODES.BEAT, "fine"));
  assert.throws(() => ensure(false, JOURNEY_ERROR_CODES.BEAT, "not now"), (e) => e.code === "JOURNEY_BEAT" && e.message === "not now");
  assert.equal(new Set(Object.values(JOURNEY_ERROR_CODES)).size, Object.keys(JOURNEY_ERROR_CODES).length);
});

test("TC-S5-STATE-001 plain data is copied and frozen deeply, never shared", () => {
  const source = { a: [1, { b: "x" }], c: null, d: true, e: undefined };
  const copy = cloneData(source);
  assert.deepEqual(copy, { a: [1, { b: "x" }], c: null, d: true });
  assert.notEqual(copy.a, source.a);
  const nullProto = Object.assign(Object.create(null), { k: 1 });
  assert.deepEqual({ ...cloneData(nullProto) }, { k: 1 });
  const frozen = frozenCopy(source);
  assert.ok(Object.isFrozen(frozen) && Object.isFrozen(frozen.a) && Object.isFrozen(frozen.a[1]));
  const shallow = Object.freeze({ inner: { x: 1 } });
  deepFreeze(shallow);
  assert.ok(Object.isFrozen(shallow.inner), "freezes inside an already frozen object");
  const cyclic = {};
  cyclic.self = cyclic;
  for (const value of [{ f() {} }, { n: Number.NaN }, { i: Infinity }, cyclic, new Date(0), { s: Symbol("s") }]) assert.throws(() => cloneData(value), TypeError);
  const shared = { x: 1 };
  assert.deepEqual(cloneData({ a: shared, b: shared }), { a: { x: 1 }, b: { x: 1 } }, "a value seen twice is not a cycle");
});
