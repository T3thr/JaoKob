import test from "node:test";
import assert from "node:assert/strict";
import { JOURNEY_APP_ERRORS as E, JOURNEY_APP_NOTICES as N, createJourneyApplication } from "../../src/bootstrap/journey-application.js";
import { createJourneySession } from "../../src/core/use-cases/journey-session.js";
import { admitJourneyPackage } from "../../src/data/content/journey-package.js";
import { JOURNEY_DEFAULT_SETTINGS, JOURNEY_NOTICES_KEY, JOURNEY_SETTINGS_KEY } from "../../src/data/persistence/journey-device-records.js";
import { LEGACY_ARCHIVE_KEYS, inspectLegacyArchive } from "../../src/data/persistence/legacy-archive.js";
import { LOCAL_STORAGE_KEYS } from "../../src/data/persistence/local-storage-adapter.js";
import { UI_PREFERENCES_KEY } from "../../src/data/persistence/local-ui-preferences-adapter.js";
import { buildJourneySave, sealJourneySave } from "../../src/data/validation/journey-save-validator.js";
import { NOW, SESSION_ID, loadAct1Package, planned, playSession } from "../helpers/journey-driver.js";
import { KEYS, MINI_KEYS, START, SpyStorage, createApp, drive, loadMini, quotaError, value } from "../helpers/journey-storage.js";

/** Trace: TC-S5-SAVE-001, TC-S5-SAVE-002, TC-S5-REPLAY-001, TC-S5-LEGACY-001, TC-S5-PACKAGE-001, ADR-P0-034 D7/D8, ADR-P0-014, SSOT §3.2. */
const PLAN = planned({ "a1-03": "rain", "a1-06": "grit", "a1-13": "a" });
const fixed = () => NOW;
const saveKeys = Object.values(KEYS);
const saveWrites = (storage) => storage.calls.filter((c) => c.method !== "getItem" && saveKeys.includes(c.key));
const failed = (result, code) => {
  assert.equal(result.ok, false, `expected ${code}`);
  assert.equal(result.error.code, code, JSON.stringify(result.error));
};
/** A playing app over `storage`, `steps` commands into Act 1. */
function playing(storage, steps, options = {}) {
  const app = createApp(storage, options);
  value(app.boot());
  value(app.newGame(options.newGame ?? {}));
  let count = 0;
  drive(app, PLAN, { until: () => count++ >= steps });
  return app;
}
const viewOf = (app) => value(app.view()).view;
const step = (app, policy = PLAN) => {
  const view = viewOf(app);
  const command = policy(view);
  return app.perform(command.kind, { revision: view.revision, ...(command.args ?? {}) });
};
const sealed = (identity, state, extra = {}) => JSON.stringify(sealJourneySave({ ...buildJourneySave({ identity, state, settings: JOURNEY_DEFAULT_SETTINGS, savedAt: NOW, reason: "action-committed" }), ...extra }));

// ---------------------------------------------------------------------------------------
// Silent save on every commit · reload · Resume never writes
// ---------------------------------------------------------------------------------------
test("TC-S5-SAVE-001 every committed command is saved silently, each clash turn and camp activity included", () => {
  const storage = new SpyStorage();
  const app = createApp(storage, { clock: fixed });
  const title = value(app.boot());
  assert.deepEqual([title.phase, title.continue, title.newGame.needsConsent, title.notices, title.storage], ["title", null, false, [], "available"]);
  assert.equal(value(app.newGame()).notice, null);
  assert.deepEqual([storage.json(KEYS.canonical).reason, storage.json(KEYS.canonical).revision], ["new-game", 1]);
  const kinds = [];
  for (;;) {
    const view = viewOf(app);
    const command = PLAN(view);
    if (command === null) break;
    const result = value(app.perform(command.kind, { revision: view.revision, ...(command.args ?? {}) }));
    kinds.push(command.kind);
    const stored = storage.json(KEYS.canonical);
    assert.deepEqual([stored.revision, stored.payload.cursor.node, stored.reason], [result.view.revision, result.view.node.id, "action-committed"]);
    assert.equal(result.notice, null, "a successful save shows nothing");
    assert.equal(result.events.some((event) => /save/i.test(event.type)), false);
  }
  assert.ok(kinds.filter((k) => k === "clashAct").length >= 3 && kinds.includes("campPick"), kinds.join(","));
  assert.equal(storage.calls.filter((c) => c.method === "setItem" && c.key === KEYS.canonical).length, kinds.length + 1);
  const reference = playSession(createJourneySession(loadAct1Package()), PLAN).state;
  assert.deepEqual(storage.json(KEYS.canonical).payload, reference.payload, "the save holds exactly the Core state");
  assert.equal(value(app.view()).persistence, "active");
});

test("TC-S5-SAVE-001 a reload in the middle of a clash resumes at the same beat and plays on to the same end", () => {
  const storage = new SpyStorage();
  const app = createApp(storage, { clock: fixed });
  value(app.boot());
  value(app.newGame());
  drive(app, PLAN, { until: (view) => view.mode === "CLASH_CHOOSE" && view.clash.turn === 2 });
  const before = viewOf(app);
  assert.equal(before.mode, "CLASH_CHOOSE");

  const copy = new SpyStorage(Object.fromEntries(storage.entries));
  const reloaded = createApp(copy, { clock: fixed });
  const title = value(reloaded.boot());
  assert.deepEqual([title.continue.revision, title.continue.node, title.continue.memoryOnly], [before.revision, before.node.id, false]);
  const resumed = value(reloaded.continue());
  assert.deepEqual(resumed.view, before, "same beat, same light, same tray");
  assert.equal(copy.writes().length, 0, "Resume writes nothing");

  drive(app, PLAN);
  drive(reloaded, PLAN);
  assert.deepEqual(copy.json(KEYS.canonical).payload, storage.json(KEYS.canonical).payload);
  assert.equal(viewOf(reloaded).mode, "BOUNDARY");
});

test("TC-S5-SAVE-001 Resume never writes: settings and suspends before the next commit stay off the save", () => {
  const storage = new SpyStorage();
  playing(storage, 12);
  const app = createApp(storage);
  value(app.boot());
  const resumed = value(app.continue());
  const revision = resumed.view.revision;
  const recorded = storage.raw(KEYS.canonical);
  storage.calls.length = 0;
  value(app.changeSettings({ fontScale: 1.5 }));
  value(app.suspend());
  value(app.wake());
  assert.deepEqual(storage.writes().map((c) => c.key), [JOURNEY_SETTINGS_KEY]);
  assert.equal(storage.raw(KEYS.canonical), recorded);

  value(step(app));
  const committed = storage.json(KEYS.canonical);
  assert.deepEqual([committed.revision, committed.settings.fontScale, committed.reason], [revision + 1, 1.5, "action-committed"]);
  value(app.changeSettings({ fontScale: 2 }));
  const refreshed = storage.json(KEYS.canonical);
  assert.deepEqual([refreshed.revision, refreshed.settings.fontScale, refreshed.reason], [revision + 1, 2, "settings-changed"]);
  assert.equal(storage.json(KEYS.backup).settings.fontScale, 1.5);
  value(app.suspend());
  assert.deepEqual([storage.json(KEYS.canonical).revision, storage.json(KEYS.canonical).reason], [revision + 1, "lifecycle-suspend"]);
});

test("TC-S5-SAVE-002 play time counts the time between commands and stops while the page is hidden", () => {
  let at = Date.parse(START);
  const clock = () => new Date(at).toISOString();
  const storage = new SpyStorage();
  const app = createApp(storage, { clock });
  value(app.boot());
  value(app.newGame());
  at += 5_000;
  value(step(app));
  assert.equal(storage.json(KEYS.canonical).payload.playTimeMs, 5_000);
  at += 3_000;
  value(app.suspend());
  assert.deepEqual([storage.json(KEYS.canonical).payload.playTimeMs, storage.json(KEYS.canonical).reason], [8_000, "lifecycle-suspend"]);
  assert.deepEqual(value(app.suspend()), { notice: null }, "a second suspend changes nothing");
  at += 3_600_000;
  value(app.wake());
  at += 2_000;
  value(step(app));
  assert.equal(storage.json(KEYS.canonical).payload.playTimeMs, 10_000, "the hidden hour is not play time");
});

// ---------------------------------------------------------------------------------------
// Consent · protected · corrupt · failures
// ---------------------------------------------------------------------------------------
test("TC-S5-SAVE-001 New Game over a stored journey needs the consent token of the title the player saw", () => {
  const storage = new SpyStorage();
  playing(storage, 8);
  const app = createApp(storage);
  const title = value(app.boot());
  assert.deepEqual([title.newGame.needsConsent, title.continue !== null], [true, true]);
  const before = storage.snapshot();
  failed(app.newGame(), E.CONSENT_REQUIRED);
  failed(app.newGame({ consentToken: "journey-consent.999" }), E.CONSENT_REQUIRED);
  storage.entries.set(KEYS.backup, storage.raw(KEYS.canonical));
  failed(app.newGame({ consentToken: title.consentToken }), "SAVE_CONSENT_STALE");
  assert.equal(storage.raw(KEYS.canonical), before.get(KEYS.canonical), "nothing cleared after a stale consent");
  const refreshed = value(app.view());
  assert.notEqual(refreshed.consentToken, title.consentToken);
  value(app.newGame({ consentToken: refreshed.consentToken }));
  assert.deepEqual([storage.json(KEYS.canonical).revision, storage.json(KEYS.canonical).reason, storage.raw(KEYS.backup)], [1, "new-game", null]);
});

test("TC-S5-SAVE-001 a save of another version or a future format is kept: play in memory, or replace it by consent", () => {
  const { identity } = admitJourneyPackage(loadAct1Package()).value;
  const state = createJourneySession(loadAct1Package()).newGame({ sessionId: SESSION_ID, now: NOW });
  const records = [
    sealed({ ...identity, contentVersion: "0.0.9" }, state, { contentVersion: "0.0.9" }),
    JSON.stringify({ saveFormatVersion: 3, profile: "journey-1", anything: "newer" }),
    JSON.stringify({ saveFormatVersion: 2, profile: "journey-2", payload: {} }),
  ];
  for (const raw of records) {
    const storage = new SpyStorage({ [KEYS.canonical]: raw });
    const app = createApp(storage);
    const title = value(app.boot());
    assert.deepEqual([title.continue, title.offerMemory, title.newGame.needsConsent, title.notices], [null, true, true, [N.SAVE_PROTECTED]]);
    const memory = value(app.newGame({ memory: true }));
    assert.deepEqual([memory.persistence, memory.notice], ["memory", null]);
    drive(app, PLAN, { until: (view) => view.mode === "CAMP" });
    assert.deepEqual(saveWrites(storage), []);
    assert.equal(storage.raw(KEYS.canonical), raw, "the kept record is byte-identical");
    const back = value(app.leave());
    value(app.newGame({ consentToken: back.consentToken }));
    assert.deepEqual([storage.json(KEYS.canonical).package.contentVersion, storage.json(KEYS.canonical).revision], ["0.1.0", 1]);
  }
});

test("TC-S5-SAVE-001 Continue next to a protected record plays in memory and leaves it untouched", () => {
  const source = new SpyStorage();
  playing(source, 10);
  const future = JSON.stringify({ saveFormatVersion: 2, profile: "journey-7" });
  const storage = new SpyStorage({ [KEYS.canonical]: future, [KEYS.backup]: source.raw(KEYS.canonical) });
  const app = createApp(storage);
  const title = value(app.boot());
  assert.deepEqual([title.continue.memoryOnly, title.notices], [true, [N.SAVE_PROTECTED]]);
  assert.equal(value(app.continue()).persistence, "memory");
  value(step(app));
  value(app.changeSettings({ highContrast: true }));
  assert.deepEqual(saveWrites(storage), []);
  assert.equal(storage.raw(KEYS.canonical), future);
});

test("TC-S5-SAVE-001 a damaged canonical is recovered from backup and repaired; nothing recoverable needs consent", () => {
  const source = new SpyStorage();
  playing(source, 10);
  const good = source.raw(KEYS.canonical);
  const storage = new SpyStorage({ [KEYS.canonical]: "{\"saveFormatVersion\":2,\"prof", [KEYS.backup]: good });
  const app = createApp(storage);
  const title = value(app.boot());
  assert.deepEqual([title.notices, title.offerMemory, title.continue.revision], [[N.SAVE_RECOVERED], false, JSON.parse(good).revision]);
  assert.equal(value(app.continue()).persistence, "active");
  assert.deepEqual(saveWrites(storage), []);
  value(step(app));
  assert.deepEqual([storage.json(KEYS.canonical).revision, storage.raw(KEYS.backup)], [JSON.parse(good).revision + 1, good]);

  const broken = new SpyStorage({ [KEYS.canonical]: "garbage", [KEYS.backup]: "{}" });
  const lost = createApp(broken);
  const lostTitle = value(lost.boot());
  assert.deepEqual([lostTitle.continue, lostTitle.notices, lostTitle.offerMemory, lostTitle.newGame.needsConsent], [null, [N.SAVE_CORRUPT], true, true]);
  failed(lost.continue(), E.NO_CONTINUE);
  failed(lost.newGame(), E.CONSENT_REQUIRED);
  assert.deepEqual([broken.raw(KEYS.canonical), broken.raw(KEYS.backup)], ["garbage", "{}"], "raw records are kept until consent");
  value(lost.newGame({ consentToken: lostTitle.consentToken }));
  assert.deepEqual([broken.json(KEYS.canonical).revision, broken.raw(KEYS.backup)], [1, null]);
});

test("TC-S5-SAVE-002 a failed save is reported once, the story goes on in memory and the newest durable record resumes", () => {
  const storage = new SpyStorage();
  let canonicalWrites = 0;
  storage.beforeSet = (key) => { if (key === KEYS.canonical && ++canonicalWrites === 5) throw quotaError(); };
  const app = createApp(storage);
  value(app.boot());
  value(app.newGame());
  const notices = [];
  for (let i = 0; i < 8; i += 1) notices.push(value(step(app)).notice);
  assert.deepEqual(notices, [null, null, null, N.SAVE_FAILED, null, null, null, null]);
  assert.equal(app.status().persistence, "memory");
  assert.equal(canonicalWrites, 5, "no write is attempted after the failure");
  const durable = JSON.parse(storage.raw(KEYS.staging));
  const reloaded = createApp(new SpyStorage(Object.fromEntries(storage.entries)));
  assert.equal(value(reloaded.boot()).continue.revision, durable.revision, "the staged record of the failed commit is the newest progress");

  const shared = new SpyStorage();
  const tabA = playing(shared, 4);
  const tabB = createApp(shared);
  value(tabB.boot());
  value(tabB.continue());
  value(step(tabB));
  value(step(tabB));
  const theirs = shared.raw(KEYS.canonical);
  const late = value(step(tabA));
  assert.deepEqual([late.notice, tabA.status().persistence], [N.SAVE_ELSEWHERE, "memory"]);
  assert.equal(shared.raw(KEYS.canonical), theirs, "the other tab's progress is not overwritten");
});

test("TC-S5-SAVE-002 without storage the journey plays in memory and says so", () => {
  for (const storage of [null, { getItem() { throw new Error("denied"); }, setItem() {}, removeItem() {} }]) {
    const app = createApp(storage);
    const title = value(app.boot());
    assert.deepEqual([title.storage, title.notices, title.offerMemory], ["unavailable", [N.STORAGE_UNAVAILABLE], true]);
    const started = value(app.newGame());
    assert.deepEqual([started.persistence, started.notice], ["memory", N.STORAGE_UNAVAILABLE]);
    assert.equal(value(step(app)).notice, null);
    assert.equal(value(app.changeSettings({ fontScale: 1.25 })).notice, N.SETTINGS_NOT_SAVED);
  }
});

// ---------------------------------------------------------------------------------------
// Replay and completion
// ---------------------------------------------------------------------------------------
test("TC-S5-REPLAY-001 an act replay is saved with the current settings and survives a reload", () => {
  const storage = new SpyStorage();
  const app = createApp(storage);
  value(app.boot());
  value(app.newGame());
  drive(app, PLAN);
  assert.equal(viewOf(app).mode, "BOUNDARY");
  assert.deepEqual(storage.json(KEYS.canonical).payload.actStarts.map((s) => s.act), [1, 2]);
  value(app.changeSettings({ reducedIntensity: true }));
  const replay = value(app.perform("replayAct", { revision: viewOf(app).revision, act: 1 }));
  assert.deepEqual(replay.events.at(-1), { type: "replay", act: 1 });
  const saved = storage.json(KEYS.canonical);
  assert.deepEqual([saved.reason, saved.payload.cursor, saved.payload.history, saved.payload.actStarts.map((s) => s.act), saved.settings.reducedIntensity],
    ["replay-started", { node: "a1-01", beat: "vn", line: 0 }, [], [1], true]);
  assert.deepEqual(saved.payload.journey, saved.payload.actStarts[0].journey);
  const reloaded = createApp(storage);
  assert.deepEqual(value(reloaded.boot()).continue.node, "a1-01");
  assert.equal(value(reloaded.continue()).view.node.id, "a1-01");
});

test("TC-S5-REPLAY-001 endings already seen stay seen through a replay and a reload", () => {
  const storage = new SpyStorage();
  const app = createApp(storage, { packageData: loadMini() });
  value(app.boot());
  value(app.newGame());
  drive(app, planned({ n02: "major-wind", n10: "plan-a" }));
  assert.equal(viewOf(app).mode, "COMPLETE");
  const seen = storage.json(MINI_KEYS.canonical).payload.completion.endingsSeen;
  assert.ok(seen.length >= 1);
  value(app.perform("replayAct", { revision: viewOf(app).revision, act: 3 }));
  assert.deepEqual(storage.json(MINI_KEYS.canonical).payload.completion.endingsSeen, seen);
  const reloaded = createApp(storage, { packageData: loadMini() });
  value(reloaded.boot());
  assert.deepEqual(value(reloaded.continue()).view.completion.endingsSeen, seen);
  assert.deepEqual(value(reloaded.leave()).continue.node, "n08");
});

// ---------------------------------------------------------------------------------------
// Legacy archive and packages
// ---------------------------------------------------------------------------------------
test("TC-S5-LEGACY-001 the legacy namespace is never written, and its one-line notice shows once", () => {
  const legacy = {
    [LOCAL_STORAGE_KEYS.canonical]: "{\"saveFormatVersion\":2,\"contentVersion\":\"3.0.0\",\"revision\":4}",
    [LOCAL_STORAGE_KEYS.backup]: "{\"saveFormatVersion\":1}",
    [LOCAL_STORAGE_KEYS.settings]: "{\"locale\":\"th\"}",
    [UI_PREFERENCES_KEY]: "not even JSON",
  };
  const storage = new SpyStorage(legacy);
  const app = createApp(storage);
  assert.deepEqual(value(app.boot()).notices, [N.LEGACY_ARCHIVE]);
  value(app.acknowledgeNotice(N.LEGACY_ARCHIVE));
  assert.deepEqual(value(app.view()).notices, []);
  assert.deepEqual(storage.json(JOURNEY_NOTICES_KEY), { version: 1, seen: [N.LEGACY_ARCHIVE] });
  value(app.newGame());
  drive(app, PLAN);
  value(app.changeSettings({ fontScale: 2 }));
  value(app.perform("replayAct", { revision: viewOf(app).revision, act: 1 }));
  value(app.suspend());
  const title = value(app.leave());
  value(app.newGame({ consentToken: title.consentToken }));
  for (const [key, raw] of Object.entries(legacy)) assert.equal(storage.raw(key), raw, key);
  assert.equal(storage.raw(LOCAL_STORAGE_KEYS.staging), null);
  assert.deepEqual(storage.calls.filter((c) => c.method !== "getItem" && LEGACY_ARCHIVE_KEYS.includes(c.key)), []);
  assert.deepEqual(value(createApp(storage).boot()).notices, [], "shown once");
});

test("TC-S5-LEGACY-001 any one of the five legacy keys counts, and the archive keys are the earlier runtime's keys", () => {
  assert.deepEqual(LEGACY_ARCHIVE_KEYS, [LOCAL_STORAGE_KEYS.canonical, LOCAL_STORAGE_KEYS.staging, LOCAL_STORAGE_KEYS.backup, LOCAL_STORAGE_KEYS.settings, UI_PREFERENCES_KEY]);
  assert.deepEqual(inspectLegacyArchive({ storage: new SpyStorage() }).value, { present: false });
  for (const key of LEGACY_ARCHIVE_KEYS) {
    const storage = new SpyStorage({ [key]: "" });
    assert.deepEqual(inspectLegacyArchive({ storage }).value, { present: true }, key);
    assert.deepEqual(storage.writes(), []);
  }
  const unreadable = new SpyStorage();
  unreadable.getItem = () => { throw new Error("denied"); };
  assert.equal(inspectLegacyArchive({ storage: unreadable }).ok, false);
  assert.equal(inspectLegacyArchive({ storage: null }).ok, false);
});

test("TC-S5-PACKAGE-001 two packages of the same version share one storage without touching each other", () => {
  const storage = new SpyStorage();
  const core = playing(storage, 10);
  const mini = createApp(storage, { packageData: loadMini() });
  value(mini.boot());
  value(mini.newGame());
  drive(mini, planned({ n02: "major-rain", n10: "plan-b" }), { until: (view) => view.node.id === "n08" });
  assert.equal(core.status().identity.contentVersion, mini.status().identity.contentVersion);
  assert.notEqual(core.status().identity.key, mini.status().identity.key);
  const touched = new Set(storage.writes().map((c) => c.key));
  assert.deepEqual([...touched].filter((key) => key.includes("story.jaokob.core")).sort(), [KEYS.backup, KEYS.canonical, KEYS.staging].sort());
  assert.deepEqual([...touched].filter((key) => key.includes("story.fixture.mini")).sort(), [MINI_KEYS.backup, MINI_KEYS.canonical, MINI_KEYS.staging].sort());

  const crossed = new SpyStorage({ [MINI_KEYS.canonical]: storage.raw(KEYS.canonical) });
  const confused = createApp(crossed, { packageData: loadMini() });
  const title = value(confused.boot());
  assert.deepEqual([title.continue, title.notices], [null, [N.SAVE_PROTECTED]], "a record of another package is kept, never played");
  value(confused.newGame({ memory: true }));
  value(step(confused, planned()));
  assert.equal(crossed.raw(MINI_KEYS.canonical), storage.raw(KEYS.canonical));
});

// ---------------------------------------------------------------------------------------
// Application contract
// ---------------------------------------------------------------------------------------
test("TC-S5-STATE-001 the application refuses calls out of phase, unknown commands, stale revisions and bad input", () => {
  const app = createApp(new SpyStorage());
  for (const call of [() => app.newGame(), () => app.continue(), () => app.view(), () => app.changeSettings({}), () => app.acknowledgeNotice(N.LEGACY_ARCHIVE)]) failed(call(), E.NOT_BOOTED);
  assert.deepEqual({ ...app.status() }, { phase: "unbooted", persistence: null, identity: null, revision: null });
  value(app.boot());
  failed(app.boot(), E.ALREADY_BOOTED);
  failed(app.perform("advance", { revision: 1 }), E.NOT_PLAYING);
  failed(app.leave(), E.NOT_PLAYING);
  failed(app.continue(), E.NO_CONTINUE);
  failed(app.changeSettings({ fontScale: 9 }), E.SETTINGS_INVALID);
  assert.equal(value(app.changeSettings({ counterTags: false })).settings.counterTags, false);
  failed(app.acknowledgeNotice("toast"), "RECORD_INVALID");
  value(app.newGame());
  failed(app.newGame(), E.NOT_AT_TITLE);
  failed(app.continue(), E.NOT_AT_TITLE);
  failed(app.perform("eval", { revision: 1 }), E.COMMAND_UNKNOWN);
  failed(app.perform("advance", { revision: 99 }), "JOURNEY_REVISION");
  failed(app.perform("choose", { revision: viewOf(app).revision, option: "x" }), "JOURNEY_BEAT");
  assert.equal(app.status().revision, 1);

  const bad = loadMini();
  bad.nodes.find((n) => n.id === "n02").options.push({ ...bad.nodes.find((n) => n.id === "n02").options[0] });
  failed(createApp(new SpyStorage(), { packageData: bad }).boot(), "JOURNEY_PACKAGE_INVALID");
  failed(createApp(new SpyStorage(), { packageData: { profile: "journey" } }).boot(), "JOURNEY_PACKAGE_UNSUPPORTED");
  const lostClock = createApp(new SpyStorage(), { clock: () => "soon" });
  value(lostClock.boot());
  assert.throws(() => lostClock.newGame(), TypeError);
});

test("TC-S5-SAVE-002 device settings outlive a New Game, and Continue adopts the save's settings only when none are stored", () => {
  const storage = new SpyStorage();
  const first = createApp(storage);
  value(first.boot());
  value(first.changeSettings({ fontScale: 1.75 }));
  assert.equal(storage.json(JOURNEY_SETTINGS_KEY).settings.fontScale, 1.75, "kept before any journey exists");
  const second = createApp(storage);
  assert.equal(value(second.boot()).settings.fontScale, 1.75);
  value(second.newGame());
  assert.equal(storage.json(KEYS.canonical).settings.fontScale, 1.75);
  storage.entries.delete(JOURNEY_SETTINGS_KEY);
  const third = createApp(storage);
  assert.deepEqual(value(third.boot()).settings, JOURNEY_DEFAULT_SETTINGS);
  assert.equal(value(third.continue()).settings.fontScale, 1.75);
});

test("TC-S5-STATE-001 without an injected factory each New Game gets a fresh UUID v4, with or without crypto.randomUUID", () => {
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
  const sessionOf = (storage) => storage.json(KEYS.canonical).payload.sessionId;
  const start = () => {
    const storage = new SpyStorage();
    const app = createJourneyApplication({ packageData: loadAct1Package(), storage, clock: fixed });
    value(app.boot());
    value(app.newGame());
    return sessionOf(storage);
  };
  const [one, two] = [start(), start()];
  assert.match(one, uuid);
  assert.notEqual(one, two);
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, "crypto");
  Object.defineProperty(globalThis, "crypto", { configurable: true, value: {} });
  try {
    assert.match(start(), uuid);
  } finally {
    Object.defineProperty(globalThis, "crypto", descriptor);
  }
});

