import test from "node:test";
import assert from "node:assert/strict";
import { createPouch, collectItem, refuseItem, releaseItem, replaceItem, useItem, validatePouch, PouchError } from "../../src/core/domain/keepsake-pouch.js";
import { resolvePouchTransaction } from "../../src/core/use-cases/pouch-transaction.js";

const ids = ["item_leaf", "item_dew_stone", "item_lotus_shell", "item_rain_petal", "item_red_yarn"];
const full = () => ids.slice(0, 4).reduce((pouch, id) => collectItem(pouch, { id }).value, createPouch());
const immutable = (value) => { assert.equal(Object.isFrozen(value), true); for (const list of Object.values(value).filter(Array.isArray)) assert.equal(Object.isFrozen(list), true); };
const rejected = (result, pouch, code) => { assert.equal(result.ok, false); assert.equal(result.error.code, code); assert.equal(result.pouch, pouch); };

test("TC-S4-POUCH-001 exactly four slots, clone and deeply frozen restore", () => {
  const a = createPouch(), b = createPouch(a);
  assert.deepEqual(a, { capacity: 4, held: [], acquired: [], released: [], remembered: [], memory: [] });
  assert.notEqual(a, b); assert.notEqual(a.held, b.held); immutable(a); immutable(b);
  assert.throws(() => a.held.push(ids[0]), TypeError);
});
test("TC-S4-POUCH-001 collect 0→4 in order, fifth never drops or records", () => {
  let pouch = createPouch();
  for (const id of ids.slice(0, 4)) {
    const before = structuredClone(pouch), result = collectItem(pouch, id);
    assert.equal(result.ok, true); assert.deepEqual(pouch, before); immutable(result.value);
    assert.deepEqual(result.value.acquired, result.value.held); assert.deepEqual(result.value.remembered, result.value.held);
    pouch = result.value;
  }
  assert.deepEqual(pouch.held, ids.slice(0, 4)); rejected(collectItem(pouch, ids[4]), pouch, "POUCH_FULL");
});
test("TC-S4-POUCH-001 refusal records remembered but neither acquired nor released", () => {
  const original = full(), p = refuseItem(original, ids[4]).value;
  assert.deepEqual(p.held, original.held); assert.deepEqual(p.acquired, original.acquired);
  assert.deepEqual(p.released, []); assert.deepEqual(p.memory, ["refused_red_yarn"]);
  assert.deepEqual(p.remembered, ids); immutable(p);
  rejected(collectItem(p, ids[4]), p, "POUCH_ALREADY_ENCOUNTERED");
  rejected(refuseItem(p, ids[4]), p, "POUCH_ALREADY_ENCOUNTERED");
});
for (const [name, release] of [["release", releaseItem], ["use", useItem]]) test(`TC-S4-POUCH-001 ${name} preserves acquisition and memory, no recollection`, () => {
  const original = full(), p = release(original, ids[1]).value;
  assert.deepEqual(p.held, [ids[0], ids[2], ids[3]]); assert.deepEqual(p.released, [ids[1]]);
  assert.deepEqual(p.acquired, original.acquired); assert.deepEqual(p.remembered, original.remembered);
  assert.equal(original.held.length, 4); immutable(p);
  rejected(release(p, ids[1]), p, "POUCH_NOT_HELD");
  rejected(collectItem(p, ids[1]), p, "POUCH_ALREADY_ENCOUNTERED");
  assert.equal(collectItem(p, ids[4]).ok, true);
});
test("TC-S4-POUCH-001 replacement is atomic and retains the exact selected slot", () => {
  const original = full(), p = replaceItem(original, ids[1], ids[4]).value;
  assert.deepEqual(p.held, [ids[0], ids[4], ids[2], ids[3]]); assert.deepEqual(p.released, [ids[1]]);
  assert.deepEqual(p.acquired, ids); assert.deepEqual(p.remembered, ids); assert.equal(original.released.length, 0); immutable(p);
  for (const [oldId, newId, code] of [[ids[4], ids[0], "POUCH_NOT_HELD"], [ids[0], ids[1], "POUCH_ALREADY_ENCOUNTERED"], [ids[0], "invalid", "POUCH_ID"]]) {
    rejected(replaceItem(original, oldId, newId), original, code);
  }
  const partial = releaseItem(original, ids[1]).value;
  rejected(replaceItem(partial, ids[0], ids[4]), partial, "POUCH_NOT_FULL");
});
for (const item of [null, undefined, {}, { id: "item__bad" }, "Item_leaf", "item_../leaf", "item_" + "a".repeat(92), 3]) test(`TC-S4-POUCH-001 rejects malformed ID ${JSON.stringify(item)}`, () => {
  const p = createPouch(); rejected(collectItem(p, item), p, "POUCH_ID"); rejected(refuseItem(p, item), p, "POUCH_ID");
  rejected(releaseItem(p, item), p, "POUCH_ID");
});
for (const [label, mutate] of [
  ["capacity three", (p) => { p.capacity = 3; }], ["capacity five", (p) => { p.capacity = 5; }],
  ["unknown field", (p) => { p.score = 1; }], ["missing field", (p) => { delete p.memory; }],
  ["null list", (p) => { p.held = null; }], ["sparse list", (p) => { p.held = Array(1); }],
  ["duplicate", (p) => { p.held = [ids[0], ids[0]]; }], ["overcapacity", (p) => { p.held = ids; }],
  ["held unacquired", (p) => { p.held = [ids[0]]; }],
  ["acquired without ownership", (p) => { p.acquired = [ids[0]]; p.remembered = [ids[0]]; }],
  ["released unacquired", (p) => { p.released = [ids[0]]; }],
  ["unexplained memory", (p) => { p.remembered = [ids[0]]; }],
  ["unknown refusal token", (p) => { p.memory = ["released_leaf"]; }],
  ["refusal not remembered", (p) => { p.memory = ["refused_leaf"]; }],
  ["invalid refusal", (p) => { p.memory = [null]; }],
]) test(`TC-S4-CONTRACT-001 rejects ${label}`, () => {
  const p = structuredClone(createPouch()); mutate(p);
  assert.equal(validatePouch(p).valid, false); assert.throws(() => createPouch(p), PouchError);
  rejected(collectItem(p, ids[0]), p, validatePouch(p).issue.reason);
});
for (const invalid of [null, [], 4, "pouch"]) test(`TC-S4-CONTRACT-001 rejects pouch shape ${JSON.stringify(invalid)}`, () => assert.equal(validatePouch(invalid).valid, false));
test("TC-S4-CONTRACT-001 acquired is remembered, refusal and ownership never overlap", () => {
  for (const mutate of [p => { p.remembered = []; }, p => { p.released.push(ids[0]); }, p => { p.memory.push("refused_leaf"); }]) {
    const p = structuredClone(collectItem(createPouch(), ids[0]).value); mutate(p); assert.equal(validatePouch(p).valid, false);
  }
});
test("TC-S4-POUCH-001 bounded memory permits 128 encounters and rejects the next unchanged", () => {
  let p = createPouch();
  for (let i = 0; i < 128; i++) p = refuseItem(p, `item_fixture_${i}`).value;
  assert.equal(p.remembered.length, 128); rejected(refuseItem(p, "item_fixture_128"), p, "POUCH_MEMORY_FULL");
  const extra = structuredClone(p); extra.remembered.push("item_extra"); assert.equal(validatePouch(extra).valid, false);
});
test("TC-S4-POUCH-001 deterministic replay of mixed operations preserves invariants", () => {
  const run = () => {
    let p = full(); p = replaceItem(p, ids[2], ids[4]).value; p = useItem(p, ids[0]).value; p = releaseItem(p, ids[1]).value;
    assert.equal(validatePouch(p).valid, true); return p;
  };
  assert.deepEqual(run(), run());
});

const snapshot = () => ({ revision: 7, currentNodeId: "node.fixture.rest", state: "Decision", pouch: full(), metrics: { hp: 73, sanity: 55, bond: 0 } });
const opportunity = { id: "opportunity.fixture", safe: true, nodeId: "node.fixture.rest", states: ["Decision"], actions: ["collect", "refuse", "release", "replace", "use"] };
const command = { expectedRevision: 7, action: "replace", opportunityId: opportunity.id, oldItemId: ids[0], itemId: ids[4] };
for (const [label, patch, offer, code] of [
  ["stale", { expectedRevision: 6 }, opportunity, "REVISION_MISMATCH"],
  ["unsafe", {}, { ...opportunity, safe: false }, "POUCH_CONTEXT"],
  ["other node", {}, { ...opportunity, nodeId: "node.other" }, "POUCH_CONTEXT"],
  ["reading", {}, { ...opportunity, states: ["Exploration"] }, "POUCH_CONTEXT"],
  ["unknown offer", { opportunityId: "unknown" }, opportunity, "POUCH_CONTEXT"],
  ["unknown item", { itemId: "item_unknown" }, opportunity, "POUCH_ITEM_REFERENCE"],
  ["unknown old item", { oldItemId: "item_unknown" }, opportunity, "POUCH_ITEM_REFERENCE"],
  ["wrong offer item", {}, { ...opportunity, itemId: ids[1] }, "POUCH_ITEM_REFERENCE"],
  ["forbidden action", { action: "use" }, { ...opportunity, actions: ["release"] }, "POUCH_CONTEXT"],
  ["no offer", {}, null, "POUCH_CONTEXT"],
]) test(`TC-S4-STATE-001 application rejects ${label} without snapshot changes`, () => {
  const s = snapshot(), before = structuredClone(s);
  const result = resolvePouchTransaction({ snapshot: s, command: { ...command, ...patch }, opportunity: offer, itemIds: ids });
  assert.equal(result.ok, false); assert.equal(result.error.code, code); assert.equal(result.snapshot, s); assert.deepEqual(s, before);
});
test("TC-S4-STATE-001 atomic guarded replacement, double input and no stat reward", () => {
  const s = snapshot(), before = structuredClone(s);
  const result = resolvePouchTransaction({ snapshot: s, command, opportunity, itemIds: ids });
  assert.equal(result.ok, true); assert.deepEqual(s, before); assert.equal(result.value.pouch.held[0], ids[4]);
  assert.equal(resolvePouchTransaction({ snapshot: { ...s, pouch: result.value.pouch }, command, opportunity, itemIds: ids }).ok, false);
  assert.equal(resolvePouchTransaction({ snapshot: null }).ok, false);
  assert.equal(resolvePouchTransaction({ snapshot: s }).ok, false);
});
