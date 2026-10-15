import test from "node:test";
import assert from "node:assert/strict";
import { migrateSave1To2, migrateLegacyPouch } from "../../src/data/persistence/save-1-to-2.js";
import { validateSaveEnvelope } from "../../src/data/validation/save-envelope-validator.js";
import { createContentOrchestrator } from "../../src/core/use-cases/content-orchestration.js";
import { createLocalStorageAdapter, LOCAL_STORAGE_KEYS as KEYS } from "../../src/data/persistence/local-storage-adapter.js";
import { MemoryStorage } from "../helpers/application-harness.js";
import { content, loaded, ROUTES, walk, envelope, AT, command, routeAction, unwrap, SESSION_ID } from "../helpers/act1-session.js";
import { expectedMigratedSnapshot } from "../helpers/expected-save2.js";
import { createPouch, collectItem, releaseItem } from "../../src/core/domain/keepsake-pouch.js";

const engine = createContentOrchestrator(loaded.catalog, { pouchEnabled: true });
const target = (snapshot = walk()[0]) => migrateSave1To2(envelope(snapshot)).value.envelope;
const compatible = (saved) => {
  const result = migrateSave1To2(saved);
  return result.ok && engine.validateSnapshot({ ...result.value.envelope.payload, revision: saved.revision }).ok;
};

for (const route of ROUTES) test(`TC-S4-SAVE-001 exact/idempotent migration every legacy page ${Object.values(route).join("/")}`, () => {
  for (const snapshot of walk(route, ["roots", "lily", "shadows", "mother", "roots"])) {
    const source = envelope(snapshot, { ...content.gameDefaults.settings, fontScale: 2, masterVolume: 0 }), before = structuredClone(source);
    const result = migrateSave1To2(source); assert.equal(result.ok, true); assert.equal(result.value.migrated, true);
    const { revision, ...expectedPayload } = expectedMigratedSnapshot(snapshot);
    assert.deepEqual(result.value.envelope, { ...before, saveFormatVersion: 2, payload: expectedPayload });
    assert.equal(result.value.envelope.revision, revision); assert.deepEqual(source, before);
    assert.equal(validateSaveEnvelope(result.value.envelope).valid, true);
    assert.equal(engine.validateSnapshot({ ...result.value.envelope.payload, revision }).ok, true);
    assert.deepEqual(migrateSave1To2(result.value.envelope).value, { envelope: result.value.envelope, migrated: false });
    assert.deepEqual(migrateSave1To2(before), result); assert.equal(Object.isFrozen(result.value.envelope.payload.pouch.held), true);
  }
});
test("TC-S4-SAVE-001 active held leaf and older empty checkpoint map independently", () => {
  const snapshot = walk().find((s) => s.flags.find((f) => f.id === "keepsake.lily_fragment").value && !s.checkpoint.flags.find((f) => f.id === "keepsake.lily_fragment").value);
  assert.ok(snapshot); const p = target(snapshot).payload;
  assert.deepEqual(p.pouch.held, ["item_leaf"]); assert.deepEqual(p.checkpoint.pouch.held, []);
  assert.deepEqual(p.pouch.acquired, ["item_leaf"]); assert.deepEqual(p.pouch.memory, []);
});
test("TC-S4-SAVE-001 literal hasLeaf alias is unambiguous; production catalog still rejects unknown flags", () => {
  assert.deepEqual(migrateLegacyPouch([{ id: "hasLeaf", value: true }]).held, ["item_leaf"]);
  assert.deepEqual(migrateLegacyPouch([{ id: "hasLeaf", value: false }]).held, []);
  for (const flags of [[], [{ id: "hasLeaf", value: "true" }], [{ id: "hasLeaf", value: true }, { id: "keepsake.lily_fragment", value: false }]]) assert.throws(() => migrateLegacyPouch(flags));
  const saved = structuredClone(envelope(walk()[0])); saved.payload.flags.push({ id: "hasLeaf", value: false });
  assert.equal(compatible(saved), false);
});
for (const [label, mutate, reason] of [
  ["future format", s => { s.saveFormatVersion = 3; }, "SAVE_SCHEMA_INVALID"],
  ["unknown content", s => { s.contentVersion = "3.0.0"; }, "CONTENT_VERSION_UNSUPPORTED"],
  ["prior content requires first step", s => { s.contentVersion = "2.0.0"; }, "CONTENT_VERSION_UNSUPPORTED"],
  ["source digest", s => { s.integrity = { algorithm: "sha-256", canonicalization: "jaokob-canonical-json-v1", digest: "a".repeat(64) }; }, "SOURCE_INTEGRITY_UNSUPPORTED"],
  ["unknown payload field", s => { s.payload.newField = true; }, "SAVE_SCHEMA_INVALID"],
  ["missing checkpoint", s => { delete s.payload.checkpoint; }, "SAVE_SCHEMA_INVALID"],
  ["missing active leaf", s => { s.payload.flags = s.payload.flags.filter(f => f.id !== "keepsake.lily_fragment"); }, "LEGACY_LEAF_AMBIGUOUS"],
  ["bad checkpoint leaf", s => { s.payload.checkpoint.flags.find(f => f.id === "keepsake.lily_fragment").value = 1; }, "LEGACY_LEAF_AMBIGUOUS"],
  ["literal alias not in published save ID grammar", s => { s.payload.flags.push({ id: "hasLeaf", value: true }); }, "SAVE_SCHEMA_INVALID"],
  ["non JSON number", s => { s.revision = NaN; }, "SAVE_INVALID_JSON"],
  ["cycle", s => { s.self = s; }, "SAVE_INVALID_JSON"],
  ["accessor", s => { Object.defineProperty(s, "trap", { enumerable: true, get() { throw Error("must not run"); } }); }, "SAVE_INVALID_JSON"],
]) test(`TC-S4-SAVE-001 protects ${label}`, () => {
  const saved = structuredClone(envelope(walk()[0])); mutate(saved);
  const result = migrateSave1To2(saved); assert.equal(result.ok, false); assert.equal(result.error.code, "SAVE_MIGRATION"); assert.equal(result.error.details.reason, reason);
});
for (const [label, mutate] of [
  ["missing active pouch", s => { delete s.payload.pouch; }],
  ["missing checkpoint pouch", s => { delete s.payload.checkpoint.pouch; }],
  ["null pouch", s => { s.payload.pouch = null; }],
  ["bad capacity", s => { s.payload.checkpoint.pouch.capacity = 3; }],
  ["duplicate slots", s => { s.payload.pouch.held = ["item_leaf", "item_leaf"]; }],
  ["extra field", s => { s.payload.pouch.weight = 0; }],
]) test(`TC-S4-CONTRACT-001 Save 2 rejects ${label}, never repairs to empty`, () => {
  const saved = structuredClone(target()); mutate(saved);
  assert.equal(validateSaveEnvelope(saved).valid, false); assert.equal(migrateSave1To2(saved).ok, false);
});
test("TC-S4-SAVE-002 round trip retains released memory and independent checkpoint", () => {
  const saved = structuredClone(target(walk().at(-1)));
  saved.payload.pouch = releaseItem(saved.payload.pouch, "item_leaf").value;
  const memory = new MemoryStorage(), port = createLocalStorageAdapter({ storage: memory, canReplaceExistingEnvelope: compatible });
  assert.equal(port.stage(saved).ok, true); assert.equal(port.commit({ expectedRevision: saved.revision }).ok, true);
  assert.deepEqual(port.load().value.envelope, saved);
  assert.deepEqual(saved.payload.checkpoint.pouch.held, ["item_leaf"]); assert.deepEqual(saved.payload.pouch.released, ["item_leaf"]);
});
test("TC-S4-SAVE-002 migration/recovery is read-only; accepted writes back up exact legacy bytes", () => {
  const source = envelope(walk()[2]), raw = JSON.stringify(source), memory = new MemoryStorage({ [KEYS.canonical]: raw });
  const port = createLocalStorageAdapter({ storage: memory, canReplaceExistingEnvelope: compatible });
  const candidate = port.recoverCandidates().value.candidates[0].envelope, migrated = migrateSave1To2(candidate).value.envelope;
  assert.equal(memory.calls.some(c => c.method !== "getItem"), false); assert.equal(memory.raw(KEYS.canonical), raw);
  assert.equal(port.stage({ ...migrated, revision: migrated.revision + 1 }).ok, true); assert.equal(port.commit().ok, true);
  assert.equal(memory.raw(KEYS.backup), raw); assert.equal(JSON.parse(memory.raw(KEYS.canonical)).saveFormatVersion, 2);
});
for (const slot of ["staging", "backup", "canonical"]) test(`TC-S4-SAVE-002 quota at ${slot} preserves legacy canonical and recoverable candidate`, () => {
  const source = envelope(walk()[2]), raw = JSON.stringify(source), memory = new MemoryStorage({ [KEYS.canonical]: raw });
  const originalWrite = memory.setItem.bind(memory);
  memory.setItem = (key, value) => { if (key === KEYS[slot]) throw Object.assign(new Error("quota"), { name: "QuotaExceededError" }); originalWrite(key, value); };
  const port = createLocalStorageAdapter({ storage: memory, canReplaceExistingEnvelope: compatible });
  const candidate = { ...migrateSave1To2(source).value.envelope, revision: source.revision + 1 };
  const staged = port.stage(candidate), outcome = staged.ok ? port.commit() : staged;
  assert.equal(outcome.ok, false); assert.equal(outcome.error.code, "STORAGE_QUOTA"); assert.equal(memory.raw(KEYS.canonical), raw);
  if (slot !== "staging") assert.equal(JSON.parse(memory.raw(KEYS.staging)).saveFormatVersion, 2);
});
for (const bad of ["{corrupt", JSON.stringify({ ...target(), saveFormatVersion: 3 }), JSON.stringify({ ...target(), contentVersion: "3.0.0" })]) test(`TC-S4-SAVE-002 mixed protected record prevents any Save 2 write ${bad.slice(0, 26)}`, () => {
  const memory = new MemoryStorage({ [KEYS.backup]: bad }), port = createLocalStorageAdapter({ storage: memory, canReplaceExistingEnvelope: compatible });
  assert.equal(port.stage(target()).ok, false); assert.equal(memory.raw(KEYS.backup), bad); assert.equal(memory.raw(KEYS.staging), null);
});
test("TC-S4-SAVE-002 late future record blocks commit after staging", () => {
  const memory = new MemoryStorage(), port = createLocalStorageAdapter({ storage: memory, canReplaceExistingEnvelope: compatible });
  assert.equal(port.stage(target()).ok, true);
  const future = JSON.stringify({ ...target(), saveFormatVersion: 3 }); memory.entries.set(KEYS.backup, future);
  assert.equal(port.commit().ok, false); assert.equal(memory.raw(KEYS.backup), future); assert.equal(memory.raw(KEYS.canonical), null);
});
test("TC-S4-SAVE-002 Save 2 can never be downgraded by a higher-revision Save 1 writer", () => {
  const current = target(), raw = JSON.stringify(current), memory = new MemoryStorage({ [KEYS.canonical]: raw });
  const port = createLocalStorageAdapter(memory), legacy = { ...envelope(walk()[0]), revision: current.revision + 10 };
  const result = port.stage(legacy); assert.equal(result.ok, false); assert.equal(result.error.details.reason, "SAVE_DOWNGRADE_BLOCKED");
  assert.equal(memory.raw(KEYS.canonical), raw); assert.equal(memory.raw(KEYS.staging), null);
});
test("TC-S4-CONTRACT-001 unknown item and historical leaf mismatch fail semantic admission", () => {
  const saved = structuredClone(target());
  saved.payload.pouch = collectItem(createPouch(), "item_unknown").value;
  assert.equal(validateSaveEnvelope(saved).valid, true); assert.equal(compatible(saved), false);
  saved.payload.pouch = collectItem(createPouch(), "item_leaf").value; assert.equal(compatible(saved), false);
});
test("TC-S4-RETRY-001 checkpoint restores held/memory independently without changing settings", () => {
  let current = unwrap(engine.start({ sessionId: SESSION_ID, at: AT }));
  while (!engine.facts(current).complete) current = unwrap(engine.facts(current).canAdvance ? engine.advance(current, command(current)) : engine.act(current, command(current, routeAction(current, ROUTES[0], []))));
  const held = current, offer = engine.pouchOpportunity(current);
  const changed = unwrap(engine.pouchAction(current, { ...command(current), action: "release", itemId: "item_leaf", opportunityId: offer.id }));
  assert.deepEqual(changed.pouch.held, []); assert.deepEqual(changed.pouch.remembered, ["item_leaf"]); assert.deepEqual(changed.metrics, held.metrics);
  assert.deepEqual(changed.flags, held.flags); assert.deepEqual(changed.history, held.history);
  const retried = unwrap(engine.retry({ ...changed, state: "GameOver" }, command(changed)));
  assert.deepEqual(retried.pouch, held.checkpoint.pouch); assert.equal(retried.revision, changed.revision + 1);
  assert.equal(engine.pouchAction(changed, { ...command(changed), action: "use", itemId: "item_leaf", opportunityId: offer.id }).ok, false);
});
