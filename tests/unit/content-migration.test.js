import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { createContentVersionMigration } from "../../src/data/migrations/content-2-0-0-to-2-1-0.js";
import { loadGameContent } from "../../src/data/content/content-runtime.js";
import { createContentOrchestrator } from "../../src/core/use-cases/content-orchestration.js";
import { createLocalStorageAdapter, LOCAL_STORAGE_KEYS } from "../../src/data/persistence/local-storage-adapter.js";
import { validateSaveEnvelope } from "../../src/data/validation/save-envelope-validator.js";
import { createPresentationPackage } from "../fixtures/presentation/presentation-package.js";

const archivedBytes = readFileSync(new URL("../fixtures/presentation/migration/act-01-2.0.0.json", import.meta.url));
const sourcePackage = JSON.parse(archivedBytes);
const testReferenceIds = JSON.parse(readFileSync(new URL("../../src/data/content/packages/act-01-test-catalog.json", import.meta.url)));
const targetPackage = createPresentationPackage(sourcePackage);
const create = (source = sourcePackage, target = targetPackage) => createContentVersionMigration({ sourcePackage: source, targetPackage: target, testReferenceIds });
const policyResult = create();
assert.equal(policyResult.ok, true, JSON.stringify(policyResult.error));
const policy = policyResult.value;
const sourceLoaded = await loadGameContent({ content: sourcePackage, testReferenceIds });
const targetLoaded = await loadGameContent({ content: targetPackage, testReferenceIds });
const engine = createContentOrchestrator(sourceLoaded.catalog);
const targetEngine = createContentOrchestrator(targetLoaded.catalog);
const AT = "2026-09-04T04:00:00.000Z";
const SESSION_ID = "123e4567-e89b-42d3-a456-426614174000";
const unwrap = (result) => { assert.equal(result.ok, true, JSON.stringify(result.error)); return result.value.snapshot; };
const start = () => unwrap(engine.start({ sessionId: SESSION_ID, at: AT }));
const routes = ["mother", "roots", "siblings"].flatMap((home) => ["call-family", "seek-safety"].flatMap((coping) => ["keep-fragment", "release-fragment"].map((keepsake) => ({ home, coping, keepsake }))));
const node = (data, id) => data.narrativeTrees[0].nodes.find((entry) => entry.id === `node.act1.${id}`);
function envelope(snapshot, settings = sourcePackage.gameDefaults.settings) {
  const { revision, ...payload } = snapshot;
  return structuredClone({ saveFormatVersion: 1, contentVersion: "2.0.0", revision,
    createdAt: AT, savedAt: AT, reason: "checkpoint", payload, settings });
}
function actionId(snapshot, route, observations) {
  switch (snapshot.currentNodeId) {
    case "node.act1.nursery": return observations.length ? `interaction.act1.observe-${observations.shift()}` : "interaction.act1.join-family";
    case "node.act1.home-focus": return `choice.act1.focus-${route.home}`;
    case "node.act1.survival": return `choice.act1.${route.coping}`;
    case "node.act1.lily-fragment": return "interaction.act1.inspect-fragment";
    case "node.act1.keepsake": return `choice.act1.${route.keepsake}`;
    default: assert.fail(`Missing route witness ${snapshot.currentNodeId}`);
  }
}
function walk(route = routes[0], observations = []) {
  let snapshot = start();
  const snapshots = [snapshot], remaining = [...observations];
  for (let steps = 0; !engine.facts(snapshot).complete; steps += 1) {
    assert.ok(steps < 200);
    const command = { expectedRevision: snapshot.revision, at: AT };
    const method = engine.facts(snapshot).canAdvance ? "advance" : "act";
    if (method === "act") command.actionId = actionId(snapshot, route, remaining);
    const targetNext = unwrap(targetEngine[method](snapshot, command));
    snapshot = unwrap(engine[method](snapshot, command));
    assert.deepEqual(targetNext, snapshot, "presentation package preserves the entire accepted domain transaction");
    snapshots.push(snapshot);
  }
  return snapshots;
}
function migrationFailure(result, reason) {
  assert.equal(result.ok, false);
  assert.equal(result.error.code, "SAVE_MIGRATION");
  if (reason) assert.equal(result.error.details.reason, reason);
}

test("TC-S3-SAVE-001 approved source archive is pinned to original 559b6d7 bytes", () => {
  assert.equal(createHash("sha256").update(archivedBytes).digest("hex"), "cbb710d69e31a0bd4c24cb54a83d9b5c937f192a5566222bc011ad4174847582");
  assert.equal(sourcePackage.schemaVersion, "1.1.0");
  assert.equal(sourcePackage.contentVersion, "2.0.0");
  assert.equal(sourcePackage.narrativeTrees[0].nodes.length, 14);
});

for (const route of routes) test(`TC-S3-SAVE-001 2.0→2.1 exact cursor/settings, full route ${route.home}/${route.coping}/${route.keepsake}`, () => {
  for (const observations of [[], ["roots"], ["lily", "roots", "shadows", "mother"]]) {
    const snapshots = walk(route, observations);
    for (const snapshot of snapshots) {
      const saved = envelope(snapshot, { ...sourcePackage.gameDefaults.settings, fontScale: 1.5,
        masterVolume: 0, musicVolume: 0.25, ambienceVolume: 0, effectsVolume: 0.75,
        reducedMotion: true, reducedIntensityAudio: true, textSpeed: "instant" });
      saved.payload.playTimeMs = 17301;
      saved.payload.rng.state = 98765;
      const before = structuredClone(saved), result = policy.migrate(saved);
      assert.equal(result.ok, true, JSON.stringify(result.error));
      assert.equal(result.value.migrated, true);
      assert.deepEqual(result.value.envelope, { ...before, contentVersion: "2.1.0" });
      assert.deepEqual(saved, before);
      assert.equal(validateSaveEnvelope(result.value.envelope).valid, true);
      assert.equal(Object.isFrozen(result.value.envelope.payload.progress.viewedDialogueIds), true);
      assert.notEqual(result.value.envelope.payload, saved.payload);
      const resumed = unwrap(targetEngine.resume({ ...result.value.envelope.payload, revision: result.value.envelope.revision }));
      assert.deepEqual(resumed, { ...saved.payload, revision: saved.revision });
      assert.deepEqual(targetEngine.facts(resumed), engine.facts(snapshot));
      assert.equal(policy.canReplaceExisting(saved), true);
      const repeated = policy.migrate(result.value.envelope);
      assert.equal(repeated.value.migrated, false);
      assert.deepEqual(repeated.value.envelope, result.value.envelope);
    }
    assert.equal(targetEngine.facts(snapshots.at(-1)).complete, true);
  }
});

test("TC-S3-SAVE-001 repeated observations retain cursor recency and occurrence counts", () => {
  for (const snapshot of walk(routes[0], ["lily", "lily", "roots", "roots", "mother", "shadows"])) {
    const original = envelope(snapshot), result = policy.migrate(original);
    assert.equal(result.ok, true);
    assert.deepEqual(result.value.envelope.payload, original.payload);
  }
});

for (const [name, mutate] of [
  ["dialogue text", (p) => { p.dialogues.dialogues[0].text.th += " ทดสอบ"; }],
  ["dialogue speaker", (p) => { p.dialogues.dialogues[0].speakerCharacterId = "character.mother"; }],
  ["delivery emotion", (p) => { p.dialogues.dialogues[0].delivery.emotion = "neutral"; }],
  ["dialogue order", (p) => { node(p, "opening").dialogueIds.reverse(); }],
  ["life stage", (p) => { p.characters.characters[1].visualProfile.lifeStage = "frog"; }],
  ["appearance", (p) => { p.characters.characters[1].visualProfile.appearance.th += " ทดสอบ"; }],
  ["defaults including zero audio", (p) => { p.gameDefaults.settings.musicVolume = 0.5; }],
  ["default metrics", (p) => { p.gameDefaults.metrics.hp = 81; }],
  ["checkpoint policy", (p) => { node(p, "observe-lily").checkpointPolicy = "before-node"; node(p, "observe-lily").checkpointId = "checkpoint.fixture.observation"; }],
  ["choice condition", (p) => { node(p, "home-focus").choices[0].condition = { kind: "metric", metric: "hp", operator: "gte", value: 10 }; }],
  ["choice effect", (p) => { node(p, "survival").choices[0].effects[0].amount = -6; }],
  ["choice order", (p) => { node(p, "home-focus").choices.reverse(); }],
  ["interaction feedback", (p) => { node(p, "nursery").interactions[0].immediateFeedback.th += " ทดสอบ"; }],
  ["event effect", (p) => { p.events.events[0].resolution.effects[0].amount = 2; }],
  ["flag policy", (p) => { p.flagDefinitions.find((f) => f.id === "memory.home_focus").policy.reversible = true; }],
]) test(`TC-S3-SAVE-001 compatibility proof rejects changed ${name}`, () => {
  const changed = structuredClone(targetPackage);
  mutate(changed);
  migrationFailure(create(sourcePackage, changed), "CONTENT_GAMEPLAY_CHANGED");
});

test("TC-S3-SAVE-001 proof accepts only approved asset bindings and ignores object key order", () => {
  const changed = structuredClone(targetPackage);
  changed.assets.push({ id: "asset.fixture.image", type: "image", path: "assets/images/fixture.svg", alt: { th: "ภาพทดสอบ" }, rights: { origin: "original", licenseId: "fixture-metadata-only" } },
    { id: "asset.fixture.audio", type: "audio", path: "assets/audio/fixture.wav", rights: { origin: "original", licenseId: "fixture-metadata-only" } });
  node(changed, "opening").environment = { backgroundAssetId: "asset.fixture.image", bgmAssetId: "asset.fixture.audio", ambientAssetId: "asset.fixture.audio" };
  node(changed, "nursery").backgroundAssetId = "asset.fixture.image";
  delete node(changed, "nursery").environment;
  node(changed, "home-focus").environment = {};
  changed.characters.characters[1].visualProfile.defaultPortraitAssetId = "asset.fixture.image";
  changed.dialogues.dialogues[0].delivery.portraitAssetId = "asset.fixture.image";
  changed.gameDefaults = { settings: changed.gameDefaults.settings, metrics: changed.gameDefaults.metrics };
  assert.equal(create(sourcePackage, changed).ok, true);
});

for (const [name, mutate] of [
  ["old schema target", (p) => { p.schemaVersion = "1.1.0"; }],
  ["mixed tree schema", (p) => { p.narrativeTrees[0].schemaVersion = "1.1.0"; }],
  ["future package", (p) => { p.contentVersion = "2.2.0"; }],
  ["unknown field", (p) => { node(p, "opening").weather = "rain"; }],
  ["unresolved media", (p) => { node(p, "opening").environment = { bgmAssetId: "asset.missing" }; }],
  ["unknown stable node ID", (p) => { node(p, "opening").id = "node.changed"; }],
]) test(`TC-S3-SAVE-001 compatibility proof denies ${name}`, () => {
  const changed = structuredClone(targetPackage); mutate(changed);
  migrationFailure(create(sourcePackage, changed));
});

test("TC-S3-SAVE-001 factory fails closed without supported reviewed source and does not mutate packages", () => {
  const beforeSource = structuredClone(sourcePackage), beforeTarget = structuredClone(targetPackage);
  assert.equal(create().ok, true);
  assert.deepEqual(sourcePackage, beforeSource); assert.deepEqual(targetPackage, beforeTarget);
  migrationFailure(create({ ...sourcePackage, contentVersion: "1.0.0" }));
  migrationFailure(create({ ...sourcePackage, schemaVersion: "1.0.0" }));
  migrationFailure(create(null));
  migrationFailure(createContentVersionMigration());
});

for (const [name, mutate, reason] of [
  ["Mock", (s) => { s.contentVersion = "1.0.0"; }, "CONTENT_VERSION_UNSUPPORTED"],
  ["future content", (s) => { s.contentVersion = "2.2.0"; }, "CONTENT_VERSION_UNSUPPORTED"],
  ["future format", (s) => { s.saveFormatVersion = 2; }, "SAVE_SCHEMA_INVALID"],
  ["source integrity", (s) => { s.integrity = { algorithm: "sha-256", canonicalization: "jaokob-canonical-json-v1", digest: "a".repeat(64) }; }, "SOURCE_INTEGRITY_UNSUPPORTED"],
  ["invalid settings", (s) => { s.settings.musicVolume = -0.1; }, "SAVE_SCHEMA_INVALID"],
  ["unknown save field", (s) => { s.payload.presentation = {}; }, "SAVE_SCHEMA_INVALID"],
  ["unknown node", (s) => { s.payload.currentNodeId = "node.unknown"; }, "SOURCE_SNAPSHOT_INVALID"],
  ["state mismatch", (s) => { s.payload.state = "Decision"; }, "SOURCE_SNAPSHOT_INVALID"],
  ["invalid cursor", (s) => { s.payload.progress.viewedDialogueIds = []; }, "SOURCE_SNAPSHOT_INVALID"],
  ["wrong checkpoint", (s) => { s.payload.checkpoint.nodeId = "node.act1.rest"; }, "SOURCE_SNAPSHOT_INVALID"],
  ["nonzero Bond", (s) => { s.payload.metrics.bond = 1; }, "SOURCE_SNAPSHOT_INVALID"],
]) test(`TC-S3-SAVE-001 mapping and replacement predicate deny ${name} without source changes`, () => {
  const saved = envelope(start()); mutate(saved);
  const before = structuredClone(saved);
  migrationFailure(policy.migrate(saved), reason);
  assert.equal(policy.canReplaceExisting(saved), false);
  assert.deepEqual(saved, before);
});

test("TC-S3-SAVE-001 target exact validation preserves existing integrity and never guesses downgrade", () => {
  const saved = { ...envelope(start()), contentVersion: "2.1.0", integrity: { algorithm: "sha-256", canonicalization: "jaokob-canonical-json-v1", digest: "a".repeat(64) } };
  const mapped = policy.migrate(saved);
  assert.equal(mapped.ok, true); assert.equal(mapped.value.migrated, false);
  assert.deepEqual(mapped.value.envelope, saved);
  migrationFailure(create(targetPackage, sourcePackage));
});

test("TC-S3-SAVE-001 missing causal event and forged completed cursor cannot migrate", () => {
  const snapshots = walk(), completed = envelope(snapshots.at(-1));
  const home = envelope(snapshots.find((s) => s.currentNodeId === "node.act1.home-reflection"));
  home.payload.eventOccurrences = [];
  migrationFailure(policy.migrate(home), "SOURCE_SNAPSHOT_INVALID");
  completed.payload.progress.viewedDialogueIds = ["dialogue.act1.rest-rain"];
  migrationFailure(policy.migrate(completed), "SOURCE_SNAPSHOT_INVALID");
});

test("TC-S3-SAVE-001 malformed data, getters and cycles fail without inspection side effects", () => {
  let invoked = false;
  const accessor = envelope(start());
  Object.defineProperty(accessor, "contentVersion", { enumerable: true, get() { invoked = true; return "2.0.0"; } });
  const cyclic = envelope(start()); cyclic.payload.self = cyclic;
  for (const input of [null, "{broken", undefined, accessor, cyclic]) {
    migrationFailure(policy.migrate(input)); assert.equal(policy.canReplaceExisting(input), false);
  }
  assert.equal(invoked, false);
});

test("TC-S3-SAVE-001 read-only candidate preparation retains every raw slot, including unsupported records", () => {
  const oldSave = envelope(start()), futureSave = { ...oldSave, contentVersion: "8.0.0", revision: 50 };
  const records = new Map([[LOCAL_STORAGE_KEYS.canonical, JSON.stringify(oldSave, null, 2)],
    [LOCAL_STORAGE_KEYS.backup, JSON.stringify(futureSave)], [LOCAL_STORAGE_KEYS.staging, "{broken"],
    [LOCAL_STORAGE_KEYS.settings, "unparsed settings"]]);
  const before = [...records.entries()];
  const repository = createLocalStorageAdapter({ storage: { getItem: (key) => records.get(key) ?? null,
    setItem: () => assert.fail("preparation must not write"), removeItem: () => assert.fail("preparation must not remove") } });
  const recovered = repository.recoverCandidates();
  assert.equal(recovered.ok, true);
  const mapped = recovered.value.candidates.map((record) => ({ source: record.source, result: policy.migrate(record.envelope) }));
  assert.equal(mapped.find((record) => record.source === "canonical").result.ok, true);
  migrationFailure(mapped.find((record) => record.source === "backup").result, "CONTENT_VERSION_UNSUPPORTED");
  assert.ok(recovered.value.rejected.some((record) => record.source === "staging"));
  assert.deepEqual([...records.entries()], before);
});
