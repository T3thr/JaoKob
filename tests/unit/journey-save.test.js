import test from "node:test";
import assert from "node:assert/strict";
import { createJourneySession } from "../../src/core/use-cases/journey-session.js";
import { admitJourneyPackage } from "../../src/data/content/journey-package.js";
import {
  JOURNEY_SAVE_MAX_BYTES, buildJourneySave, classifyJourneySave, integrityHolds, sameStory, sealJourneySave, validateJourneySave, validateJourneySettings,
} from "../../src/data/validation/journey-save-validator.js";
import { utf8ByteLength } from "../../src/data/validation/content-digest.js";
import { JOURNEY_SAVE_ERROR_CODES as CODES, createJourneySaveRepository } from "../../src/data/persistence/journey-save-repository.js";
import {
  JOURNEY_DEFAULT_SETTINGS, JOURNEY_NOTICES_KEY, JOURNEY_SETTINGS_KEY, RECORD_ERROR_CODES, createJourneyNoticesRepository, createJourneySettingsRepository,
} from "../../src/data/persistence/journey-device-records.js";
import { removeKey, resolveStorage, writeKey } from "../../src/data/persistence/journey-storage.js";
import { NOW, loadAct1Package, planned, playSession } from "../helpers/journey-driver.js";
import { worstCaseSave } from "../helpers/journey-schema-cases.js";
import { KEYS, MINI_KEYS, SpyStorage, quotaError } from "../helpers/journey-storage.js";

/** Trace: TC-S5-SAVE-002, TC-S5-SAVE-001 (table), TC-S5-PACKAGE-001, ADR-P0-034 D7/D8, ADR-P0-014, SSOT §3.2. */
const { identity, package: pkg } = admitJourneyPackage(loadAct1Package()).value;
const session = createJourneySession(pkg);
const admit = (envelope) => Boolean(session.restore({ revision: envelope.revision, payload: envelope.payload }));
const runA = playSession(session, planned({ "a1-03": "rain", "a1-06": "alone", "a1-13": "a" })).states;
const runB = playSession(session, planned({ "a1-03": "wind", "a1-06": "rain", "a1-13": "b" })).states;
const diverged = runA.findIndex((s, i) => s.revision === runB[i].revision && JSON.stringify(s.payload.journey) !== JSON.stringify(runB[i].payload.journey));
const clashState = runA.find((s) => session.modeOf(s) === "CLASH_CHOOSE");

const envelopeOf = (state, extra = {}) => ({ ...buildJourneySave({ identity, state, settings: JOURNEY_DEFAULT_SETTINGS, savedAt: NOW, reason: "action-committed" }), ...extra });
const rawOf = (envelope) => JSON.stringify(sealJourneySave(envelope));
const rawAt = (state, extra) => rawOf(envelopeOf(state, extra));
const classify = (raw) => classifyJourneySave(raw, { identity, admit });
const repository = (storage) => createJourneySaveRepository({ storage, identity, admit });
const failed = (result, code, reason) => {
  assert.equal(result.ok, false, `expected ${code}`);
  assert.equal(result.error.code, code, JSON.stringify(result.error));
  if (reason !== undefined) assert.equal(result.error.details.reason, reason);
};
const mutations = (storage) => storage.calls.filter((c) => c.method !== "getItem");

// ---------------------------------------------------------------------------------------
// The record
// ---------------------------------------------------------------------------------------
test("TC-S5-SAVE-002 every state of an Act 1 run seals into a valid, self-checking record far under budget", () => {
  assert.ok(diverged > 0, "the two runs share revisions after they diverge");
  for (const state of runA) {
    const sealed = sealJourneySave(envelopeOf(state));
    const raw = JSON.stringify(sealed);
    assert.equal(validateJourneySave(sealed).valid, true);
    assert.equal(integrityHolds(sealed), true);
    assert.ok(utf8ByteLength(raw) < 10_000, `revision ${state.revision} is ${utf8ByteLength(raw)} bytes`);
    const verdict = classify(raw);
    assert.equal(verdict.status, "valid", verdict.reason);
    assert.deepEqual(verdict.envelope.payload, state.payload);
    assert.ok(Object.isFrozen(verdict.envelope.payload.journey));
  }
  const envelope = envelopeOf(runA.at(-1));
  assert.equal(envelope.createdAt, runA.at(-1).payload.startedAt);
  assert.deepEqual(envelope.package, { id: identity.id, contentVersion: identity.contentVersion, digest: identity.digest });
  assert.deepEqual(validateJourneySave({ ...sealJourneySave(envelope), contentVersion: "0.1.1" }), { valid: false, issue: { path: "$.contentVersion", reason: "CONTENT_VERSION_MISMATCH" } });
  assert.equal(validateJourneySettings(JOURNEY_DEFAULT_SETTINGS).valid, true);
  assert.equal(validateJourneySettings({ ...JOURNEY_DEFAULT_SETTINGS, fontScale: 2.5 }).valid, false);
});

test("TC-S5-SAVE-001 every stored record falls in exactly one class of the SSOT §3.2 table", () => {
  const base = JSON.parse(rawAt(clashState));
  const edit = (change, reseal = false) => {
    const copy = structuredClone(base);
    change(copy);
    return reseal ? rawOf(copy) : JSON.stringify(copy);
  };
  const cases = [
    ["a save of this build", rawAt(clashState), "valid", "OK"],
    ["no integrity block (optional)", edit((s) => { delete s.integrity; }), "valid", "OK"],
    ["not text", 42, "corrupt", "NOT_TEXT"],
    ["broken JSON", "{\"saveFormatVersion\":2,", "corrupt", "MALFORMED_JSON"],
    ["an array", "[]", "corrupt", "NOT_AN_OBJECT"],
    ["no save format", "{}", "corrupt", "NO_SAVE_FORMAT"],
    ["over the 250 KB budget", edit((s) => { s.padding = "x".repeat(JOURNEY_SAVE_MAX_BYTES); }), "corrupt", "SAVE_BUDGET_EXCEEDED"],
    ["schema violation", edit((s) => { s.payload.journey.meters.hp = 9; }, true), "corrupt", "SCHEMA"],
    ["changed after sealing", edit((s) => { s.savedAt = "2026-11-05T00:00:00Z"; }), "corrupt", "INTEGRITY"],
    ["a cursor the package does not have", edit((s) => { s.payload.cursor.node = "a9-99"; }, true), "corrupt", "MEANING"],
    ["Save Format 1", edit((s) => { s.saveFormatVersion = 1; }), "unknown", "FOREIGN_SAVE_FORMAT"],
    ["a Save Format 2 without a profile", edit((s) => { delete s.profile; }), "unknown", "FOREIGN_PROFILE"],
    ["another profile family", edit((s) => { s.profile = "story-1"; }), "unknown", "FOREIGN_PROFILE"],
    ["another package", edit((s) => { s.package.id = "story.fixture.mini"; }), "unknown", "OTHER_PACKAGE"],
    ["another content version", edit((s) => { s.package.contentVersion = "0.2.0"; s.contentVersion = "0.2.0"; }), "unknown", "OTHER_CONTENT_VERSION"],
    ["another build of this version", edit((s) => { s.package.digest = "b".repeat(64); }), "unknown", "OTHER_PACKAGE_BUILD"],
    ["another build that this runtime cannot read", edit((s) => { s.package.digest = "b".repeat(64); s.payload = "?"; }), "unknown", "OTHER_PACKAGE_BUILD"],
    ["a future save format", edit((s) => { s.saveFormatVersion = 3; s.payload = { anything: true }; }), "future", "FUTURE_SAVE_FORMAT"],
    ["a future journey profile", edit((s) => { s.profile = "journey-2"; }), "future", "FUTURE_PROFILE"],
  ];
  for (const [label, raw, status, reason] of cases) {
    const verdict = classify(raw);
    assert.deepEqual([verdict.status, verdict.reason], [status, reason], label);
    assert.ok(Object.isFrozen(verdict), label);
  }
});

test("TC-S5-SAVE-002 a revision names one story: metadata may change at the same revision, the story may not", () => {
  const envelope = envelopeOf(clashState);
  const refreshed = { ...envelope, savedAt: "2026-11-04T06:00:00Z", reason: "settings-changed", settings: { ...JOURNEY_DEFAULT_SETTINGS, fontScale: 2 }, payload: { ...envelope.payload, playTimeMs: 99 } };
  assert.equal(sameStory(envelope, refreshed), true);
  assert.equal(sameStory(envelope, { ...envelope, payload: { ...envelope.payload, cursor: { ...envelope.payload.cursor, line: 1 } } }), false);
  assert.equal(sameStory(envelopeOf(runA[diverged]), envelopeOf(runB[diverged])), false);
});

test("TC-S5-SAVE-002 the largest record the schema admits still fits the budget once sealed", () => {
  const worst = worstCaseSave();
  const raw = JSON.stringify(sealJourneySave(worst));
  assert.ok(utf8ByteLength(raw) < JOURNEY_SAVE_MAX_BYTES, `${utf8ByteLength(raw)} bytes`);
  assert.equal(classifyJourneySave(raw, { identity: worst.package }).status, "valid");
});

// ---------------------------------------------------------------------------------------
// The slots
// ---------------------------------------------------------------------------------------
test("TC-S5-SAVE-002 a save stages, backs up the valid canonical, promotes and cleans staging", () => {
  const storage = new SpyStorage();
  const saves = repository(storage);
  const [one, two] = [runA[1], runA[2]];
  assert.deepEqual({ ...saves.save(envelopeOf(one)).value, bytes: 0 }, { revision: one.revision, written: true, bytes: 0 });
  assert.equal(storage.raw(KEYS.canonical), rawAt(one));
  assert.deepEqual([storage.raw(KEYS.staging), storage.raw(KEYS.backup)], [null, null]);
  storage.calls.length = 0;
  assert.equal(saves.save(envelopeOf(two)).value.written, true);
  assert.deepEqual(mutations(storage).map((c) => `${c.method} ${c.key.split(":").at(-1)}`), ["setItem staging", "setItem backup", "setItem canonical", "removeItem staging"]);
  assert.deepEqual([storage.raw(KEYS.canonical), storage.raw(KEYS.backup), storage.raw(KEYS.staging)], [rawAt(two), rawAt(one), null]);
  storage.calls.length = 0;
  assert.equal(saves.save(envelopeOf(two)).value.written, false, "the same record again writes nothing");
  assert.deepEqual(mutations(storage), []);
  assert.deepEqual([...storage.entries.keys()].sort(), [KEYS.backup, KEYS.canonical].sort(), "only this package's keys");
});

test("TC-S5-SAVE-001 inspect reads without writing and ranks candidates by revision, then canonical > staging > backup", () => {
  const storage = new SpyStorage({ [KEYS.canonical]: rawAt(runA[5]), [KEYS.staging]: rawAt(runA[6]), [KEYS.backup]: rawAt(runA[4]) });
  const inspected = repository(storage).inspect().value;
  assert.deepEqual(inspected.candidates.map((c) => [c.slot, c.envelope.revision]), [["staging", 7], ["canonical", 6], ["backup", 5]]);
  assert.deepEqual(inspected.slots.map((s) => [s.slot, s.status, s.revision]), [["canonical", "valid", 6], ["staging", "valid", 7], ["backup", "valid", 5]]);
  assert.deepEqual([inspected.empty, inspected.protected, inspected.corrupt], [false, false, false]);
  assert.match(inspected.consentToken, /^journey-consent\.\d+$/);
  const tie = new SpyStorage({ [KEYS.staging]: rawAt(runA[5]), [KEYS.canonical]: rawAt(runA[5], { savedAt: "2026-11-04T06:00:00Z" }) });
  assert.equal(repository(tie).inspect().value.candidates[0].slot, "canonical");
  assert.deepEqual(mutations(storage), []);
  assert.equal(repository(new SpyStorage()).inspect().value.empty, true);
});

test("TC-S5-SAVE-001 an unknown or future record in any slot is never overwritten without consent", () => {
  const unknown = rawAt(runA[3], { package: { ...identity, contentVersion: "0.0.9" }, contentVersion: "0.0.9" });
  const future = JSON.stringify({ saveFormatVersion: 2, profile: "journey-2", payload: {} });
  for (const slot of ["canonical", "staging", "backup"]) {
    for (const [kind, raw] of [["unknown", unknown], ["future", future]]) {
      const storage = new SpyStorage({ [KEYS[slot]]: raw });
      const inspected = repository(storage).inspect().value;
      assert.equal(inspected.protected, true);
      assert.equal(inspected.slots.find((s) => s.slot === slot).status, kind);
      failed(repository(storage).save(envelopeOf(runA[9])), CODES.PROTECTED);
      assert.equal(storage.raw(KEYS[slot]), raw);
      assert.deepEqual(mutations(storage), [], `${kind} in ${slot}`);
    }
  }
});

test("TC-S5-SAVE-002 a newer revision, another story at the same revision and lost play time are never overwritten", () => {
  const newer = new SpyStorage({ [KEYS.canonical]: rawAt(runA[10]) });
  failed(repository(newer).save(envelopeOf(runA[9])), CODES.STALE, "NEWER_REVISION_STORED");
  const other = new SpyStorage({ [KEYS.canonical]: rawAt(runB[diverged]) });
  failed(repository(other).save(envelopeOf(runA[diverged])), CODES.STALE, "OTHER_STORY_AT_REVISION");
  const timed = { ...envelopeOf(runA[9]), payload: { ...runA[9].payload, playTimeMs: 5000 } };
  const refresh = new SpyStorage({ [KEYS.canonical]: rawOf(timed) });
  failed(repository(refresh).save(envelopeOf(runA[9])), CODES.STALE, "PLAY_TIME_REGRESSION");
  const later = { ...timed, savedAt: "2026-11-04T06:00:00Z", reason: "settings-changed", settings: { ...JOURNEY_DEFAULT_SETTINGS, fontScale: 1.5 }, payload: { ...timed.payload, playTimeMs: 6000 } };
  assert.equal(repository(refresh).save(later).value.written, true);
  assert.deepEqual([refresh.json(KEYS.canonical).settings.fontScale, refresh.json(KEYS.backup).payload.playTimeMs], [1.5, 5000]);
  for (const storage of [newer, other]) assert.equal(storage.writes().length, 0);
});

test("TC-S5-SAVE-001 corrupt records do not protect: recovery resumes from the best valid slot and the next save repairs", () => {
  const storage = new SpyStorage({ [KEYS.canonical]: "{\"saveFormatVersion\":2,\"profile\":\"journ", [KEYS.backup]: rawAt(runA[7]) });
  const saves = repository(storage);
  const inspected = saves.inspect().value;
  assert.deepEqual(inspected.candidates.map((c) => [c.slot, c.envelope.revision]), [["backup", 8]]);
  assert.deepEqual([inspected.corrupt, inspected.protected], [true, false]);
  assert.equal(storage.writes().length, 0, "recovery itself never writes");
  assert.equal(saves.save(envelopeOf(runA[8])).value.written, true);
  assert.deepEqual([storage.raw(KEYS.canonical), storage.raw(KEYS.backup)], [rawAt(runA[8]), rawAt(runA[7])], "the corrupt text is not copied to backup");
});

test("TC-S5-SAVE-002 a write that meets another tab's change stops, and the other tab's record wins on reload", () => {
  const storage = new SpyStorage({ [KEYS.canonical]: rawAt(runA[diverged - 1]) });
  const theirs = rawAt(runB[diverged]);
  let once = false;
  storage.beforeSet = (key) => { if (key === KEYS.staging && !once) { once = true; storage.entries.set(KEYS.canonical, theirs); } };
  failed(repository(storage).save(envelopeOf(runA[diverged])), CODES.RACE, "CHANGED_DURING_WRITE");
  assert.equal(storage.raw(KEYS.canonical), theirs);
  const best = repository(storage).inspect().value.candidates[0];
  assert.deepEqual([best.slot, best.envelope.payload.journey.major], ["canonical", runB[diverged].payload.journey.major]);
});

test("TC-S5-SAVE-002 quota, refused and dropped writes fail with stable codes and never damage stored progress", () => {
  const quota = new SpyStorage({ [KEYS.canonical]: rawAt(runA[2]) });
  quota.beforeSet = (key) => { if (key === KEYS.canonical) throw quotaError(); };
  failed(repository(quota).save(envelopeOf(runA[3])), CODES.QUOTA, "QUOTA_EXCEEDED");
  assert.equal(quota.raw(KEYS.canonical), rawAt(runA[2]));
  assert.equal(repository(quota).inspect().value.candidates[0].envelope.revision, runA[3].revision, "the staged record keeps the newest progress");

  const refused = new SpyStorage();
  refused.beforeSet = () => { throw new Error("SecurityError"); };
  failed(repository(refused).save(envelopeOf(runA[3])), CODES.UNAVAILABLE, "WRITE_FAILED");
  const dropped = new SpyStorage();
  dropped.dropWrites = true;
  failed(repository(dropped).save(envelopeOf(runA[3])), CODES.UNAVAILABLE, "READBACK_MISMATCH");
  const unreadable = new SpyStorage();
  unreadable.getItem = () => { throw new Error("denied"); };
  failed(repository(unreadable).inspect(), CODES.UNAVAILABLE, "READ_FAILED");
  const broken = createJourneySaveRepository({ storage: { getItem() {} }, identity, admit });
  failed(broken.inspect(), CODES.UNAVAILABLE, "NO_STORAGE");
  failed(broken.save(envelopeOf(runA[3])), CODES.UNAVAILABLE, "NO_STORAGE");
  failed(repository(new SpyStorage()).save({ ...envelopeOf(runA[3]), revision: 0 }), CODES.INVALID, "SCHEMA");
  failed(repository(new SpyStorage()).save({ ...envelopeOf(runA[3]), payload: { ...runA[3].payload, cursor: { node: "a9-99", beat: "vn", line: 0 } } }), CODES.INVALID, "MEANING");
  failed(repository(new SpyStorage()).save({ ...envelopeOf(runA[3]), settings: { bad: 10n } }), CODES.INVALID, "NOT_JSON_DATA");

  const descriptor = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  Object.defineProperty(globalThis, "localStorage", { configurable: true, get() { throw new Error("SecurityError"); } });
  try {
    failed(resolveStorage(), CODES.UNAVAILABLE, "STORAGE_DENIED");
  } finally {
    if (descriptor) Object.defineProperty(globalThis, "localStorage", descriptor); else delete globalThis.localStorage;
  }
});

test("TC-S5-SAVE-001 reset clears only this package's slots, only with the token of the records the player reviewed", () => {
  const records = { [KEYS.canonical]: rawAt(runA[4]), [KEYS.backup]: rawAt(runA[3]), [MINI_KEYS.canonical]: "mini", "jaokob:save:canonical": "legacy" };
  const storage = new SpyStorage(records);
  const saves = repository(storage);
  failed(saves.reset({ consentToken: "journey-consent.1" }), CODES.CONSENT_STALE, "NO_MATCHING_INSPECTION");
  const first = saves.inspect().value.consentToken;
  const second = saves.inspect().value.consentToken;
  failed(saves.reset({ consentToken: first }), CODES.CONSENT_STALE, "NO_MATCHING_INSPECTION");
  const third = saves.inspect().value.consentToken;
  storage.entries.set(KEYS.backup, rawAt(runA[2]));
  failed(saves.reset({ consentToken: third }), CODES.CONSENT_STALE, "CHANGED_SINCE_REVIEW");
  assert.notEqual(second, third);
  assert.equal(storage.raw(KEYS.canonical), records[KEYS.canonical], "nothing cleared after a stale consent");
  const token = saves.inspect().value.consentToken;
  assert.equal(saves.reset({ consentToken: token }).ok, true);
  assert.deepEqual([...storage.entries.keys()].sort(), [MINI_KEYS.canonical, "jaokob:save:canonical"].sort());
  failed(saves.reset({ consentToken: token }), CODES.CONSENT_STALE, "NO_MATCHING_INSPECTION");
  const stuck = new SpyStorage({ [KEYS.canonical]: rawAt(runA[4]) });
  stuck.removeItem = () => { throw new Error("denied"); };
  const stuckSaves = repository(stuck);
  failed(stuckSaves.reset({ consentToken: stuckSaves.inspect().value.consentToken }), CODES.UNAVAILABLE, "REMOVE_FAILED");
});

test("TC-S5-LEGACY-001 Journey storage helpers refuse any key outside jaokob:journey:", () => {
  const storage = new SpyStorage();
  assert.throws(() => writeKey(storage, "jaokob:save:canonical", "x"), TypeError);
  assert.throws(() => removeKey(storage, "jaokob:settings"), TypeError);
  assert.deepEqual(storage.calls, []);
});

// ---------------------------------------------------------------------------------------
// Device records
// ---------------------------------------------------------------------------------------
test("TC-S5-SAVE-002 device settings: defaults, round trip, corrupt replaced, future kept, races refused", () => {
  const storage = new SpyStorage();
  const settings = createJourneySettingsRepository({ storage });
  assert.deepEqual(settings.load().value, { status: "empty" });
  const chosen = { ...JOURNEY_DEFAULT_SETTINGS, fontScale: 2, reducedMotion: true };
  assert.equal(settings.save(chosen).ok, true);
  assert.deepEqual(storage.json(JOURNEY_SETTINGS_KEY), { version: 1, settings: chosen });
  assert.deepEqual(settings.load().value, { status: "valid", data: chosen });
  storage.calls.length = 0;
  assert.equal(settings.save(chosen).ok, true);
  assert.equal(storage.writes().length, 0, "unchanged settings are not rewritten");
  failed(settings.save({ ...chosen, fontScale: 3 }), RECORD_ERROR_CODES.INVALID);

  for (const raw of ["{", JSON.stringify({ version: 1, settings: { fontScale: 1 } }), JSON.stringify({ version: 1, settings: chosen, extra: 1 }), "x".repeat(5000)]) {
    const damaged = new SpyStorage({ [JOURNEY_SETTINGS_KEY]: raw });
    assert.equal(createJourneySettingsRepository({ storage: damaged }).load().value.status, "corrupt");
    assert.equal(createJourneySettingsRepository({ storage: damaged }).save(chosen).ok, true);
  }
  const future = JSON.stringify({ version: 2, settings: { anything: true } });
  const newer = new SpyStorage({ [JOURNEY_SETTINGS_KEY]: future });
  assert.equal(createJourneySettingsRepository({ storage: newer }).load().value.status, "future");
  failed(createJourneySettingsRepository({ storage: newer }).save(chosen), RECORD_ERROR_CODES.PROTECTED);
  assert.equal(newer.raw(JOURNEY_SETTINGS_KEY), future);

  const racing = new SpyStorage();
  racing.afterGet = (key) => { if (key === JOURNEY_SETTINGS_KEY && racing.raw(key) === null) racing.entries.set(key, JSON.stringify({ version: 1, settings: JOURNEY_DEFAULT_SETTINGS })); };
  failed(createJourneySettingsRepository({ storage: racing }).save(chosen), RECORD_ERROR_CODES.RACE);
  failed(createJourneySettingsRepository({ storage: null }).load(), RECORD_ERROR_CODES.UNAVAILABLE, "NO_STORAGE");
});

test("TC-S5-LEGACY-001 the notices record remembers a one-time notice and rejects unknown notices", () => {
  const storage = new SpyStorage();
  const notices = createJourneyNoticesRepository({ storage });
  assert.deepEqual(notices.seen().value, []);
  assert.equal(notices.acknowledge("legacy-archive").ok, true);
  assert.deepEqual(storage.json(JOURNEY_NOTICES_KEY), { version: 1, seen: ["legacy-archive"] });
  assert.deepEqual(notices.seen().value, ["legacy-archive"]);
  storage.calls.length = 0;
  assert.equal(notices.acknowledge("legacy-archive").ok, true);
  assert.equal(storage.writes().length, 0);
  failed(notices.acknowledge("toast"), RECORD_ERROR_CODES.INVALID);
  const newer = new SpyStorage({ [JOURNEY_NOTICES_KEY]: JSON.stringify({ version: 9, seen: [] }) });
  failed(createJourneyNoticesRepository({ storage: newer }).acknowledge("legacy-archive"), RECORD_ERROR_CODES.PROTECTED);
  assert.deepEqual(createJourneyNoticesRepository({ storage: newer }).seen().value, []);
  failed(createJourneyNoticesRepository({ storage: null }).seen(), RECORD_ERROR_CODES.UNAVAILABLE);
});
