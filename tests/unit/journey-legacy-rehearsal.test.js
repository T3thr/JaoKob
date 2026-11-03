import test from "node:test";
import assert from "node:assert/strict";
import { LEGACY_ARCHIVE_KEYS } from "../../src/data/persistence/legacy-archive.js";
import { MemoryStorage } from "../helpers/application-harness.js";
import { choose, closeoutHarness } from "../helpers/closeout-session.js";
import { planned } from "../helpers/journey-driver.js";
import { SpyStorage, createApp, drive, value } from "../helpers/journey-storage.js";

/**
 * Rollback rehearsal for T3 ("ซ้อมย้อนกลับด้วย build ของ Sprint 4") and TC-S5-LEGACY-001
 * ("build เก่ายังเปิดเซฟเดิมได้"), ADR-P0-034 D8 · §6.
 *
 * The Sprint 4 application is still the shipped entry point. Since `d1af293` its runtime has
 * one changed file, the shared image cache, whose key now prefers a Journey identity while every
 * Sprint 4 reference keeps its old key; its persistence code is byte-identical. This file leaves
 * with that runtime in C5 (superseded assertion register §3); T19 repeats the rehearsal on the
 * static build.
 */
test("TC-S5-LEGACY-001 rollback rehearsal: the Sprint 4 app resumes its own save after a whole Journey ran on the same storage", async () => {
  const earlier = closeoutHarness();
  assert.equal((await earlier.app.boot()).ok, true);
  await choose(earlier.app, "application.new-game");
  if (earlier.app.getViewModel().choices.some((c) => c.id === "application.advance")) await choose(earlier.app, "application.advance");
  await choose(earlier.app, "application.settings");
  assert.equal((await earlier.app.dispatch({ type: "SETTINGS_CHANGED", setting: "fontScale", value: 1.5 })).ok, true);
  await choose(earlier.app, "application.close-settings");
  const sprint4 = earlier.app.getSnapshot();
  earlier.app.dispose();
  const archived = Object.fromEntries(LEGACY_ARCHIVE_KEYS.map((key) => [key, earlier.memory.raw(key)]));
  assert.ok(archived["jaokob:save:canonical"] && archived["jaokob:settings"], "the earlier app wrote a save and settings");

  const storage = new SpyStorage(Object.fromEntries(earlier.memory.entries));
  const journey = createApp(storage);
  assert.deepEqual(value(journey.boot()).notices, ["legacy-archive"]);
  value(journey.acknowledgeNotice("legacy-archive"));
  value(journey.newGame());
  drive(journey, planned({ "a1-03": "eye", "a1-06": "alone", "a1-13": "b" }));
  value(journey.changeSettings({ fontScale: 2, reducedMotion: true }));
  value(journey.perform("replayAct", { revision: value(journey.view()).view.revision, act: 1 }));
  value(journey.suspend());
  for (const key of LEGACY_ARCHIVE_KEYS) assert.equal(storage.raw(key), archived[key], key);
  assert.deepEqual(storage.calls.filter((c) => c.method !== "getItem" && LEGACY_ARCHIVE_KEYS.includes(c.key)), []);

  const rollback = closeoutHarness(new MemoryStorage(Object.fromEntries(storage.entries)));
  assert.equal((await rollback.app.boot()).ok, true);
  assert.equal(rollback.app.getStatus().hasResumeCandidate, true);
  await choose(rollback.app, "application.resume");
  assert.deepEqual(rollback.app.getSnapshot(), sprint4, "the earlier app resumes exactly where it was");
  assert.equal(rollback.memory.raw("jaokob:settings"), archived["jaokob:settings"]);
  rollback.app.dispose();
});
