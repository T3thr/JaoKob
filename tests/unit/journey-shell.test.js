import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { JOURNEY_APP_ERRORS } from "../../src/bootstrap/journey-application.js";
import { JOURNEY_MEDIA_MANIFEST_PATH, JOURNEY_PACKAGE_PATH, createJourneyShell, journeyBaseUrl, loadJourneyResources } from "../../src/bootstrap/journey-shell.js";
import { loadAct1Package } from "../helpers/journey-driver.js";
import { JourneyDocument, byClass, nodes, oneByClass, recordingLoader } from "../helpers/journey-dom.js";
import { KEYS, SpyStorage, quotaError, steppingClock, value } from "../helpers/journey-storage.js";

/** Trace: TC-S5-SILENT-001, TC-S5-VN-001, ADR-P0-034 D1/D7/D9/D10, SSOT §1.2 (C4) · §3.3. */
const manifest = JSON.parse(readFileSync(new URL("../../assets/images/asset-manifest-v2.json", import.meta.url), "utf8"));
const saveKeys = Object.values(KEYS);

function shellOn(storage) {
  const document = new JourneyDocument();
  const root = document.createElement("main");
  document.body.append(root);
  const snapshots = [];
  const shell = createJourneyShell({
    document, root, packageData: loadAct1Package(), manifest, baseUrl: "http://127.0.0.1:8000/", storage, clock: steppingClock(),
    loadImage: recordingLoader().loadImage, onChange: (snapshot) => snapshots.push(snapshot),
  });
  return { document, root, shell, snapshots };
}

test("TC-S5-SILENT-001 every command the screen sends is saved for real, and nothing on screen says so", () => {
  const storage = new SpyStorage();
  const { root, shell, document } = shellOn(storage);
  const title = value(shell.boot());
  assert.equal(title.phase, "title");
  const game = byClass(root, "jk-journey")[0];
  assert.equal(game.hidden, true, "the screen waits at the title");
  value(shell.newGame());
  assert.equal(game.hidden, false);
  const live = nodes(root).find((node) => node.getAttribute("aria-live") === "polite");
  for (let i = 0; i < 6; i += 1) {
    const before = storage.writes().filter((call) => saveKeys.includes(call.key)).length;
    oneByClass(root, "jk-dialogue__next").click();
    const after = storage.writes().filter((call) => saveKeys.includes(call.key)).length;
    assert.ok(after > before, "the command was saved");
    assert.equal(oneByClass(root, "jk-notice").hidden, true, "no success indicator");
    assert.doesNotMatch(live.textContent, /บันทึก/);
  }
  const saved = storage.json(KEYS.canonical);
  assert.equal(saved.revision, shell.snapshot().model.revision);
  document.visibilityState = "hidden";
  document.fire("visibilitychange", {});
  assert.equal(storage.json(KEYS.canonical).reason, "lifecycle-suspend", "hiding the page saves");
  document.visibilityState = "visible";
  document.fire("visibilitychange", {});
  shell.dispose();
});

test("TC-S5-SILENT-001 when saving fails the game goes on in memory and the notice says so once", () => {
  const storage = new SpyStorage();
  const { root, shell } = shellOn(storage);
  value(shell.boot());
  value(shell.newGame());
  storage.beforeSet = (key) => { if (saveKeys.includes(key)) throw quotaError(); };
  oneByClass(root, "jk-dialogue__next").click();
  const snapshot = shell.snapshot();
  assert.equal(snapshot.model.persistence, "memory");
  assert.equal(snapshot.model.notice.id, "save-failed");
  assert.equal(oneByClass(root, "jk-notice").hidden, false);
  oneByClass(root, "jk-dialogue__next").click();
  assert.equal(shell.snapshot().model.notice, null, "a notice belongs to the command that failed");
});

test("TC-S5-VN-001 a stale command changes nothing; perform binds the revision on screen", () => {
  const { shell } = shellOn(new SpyStorage());
  value(shell.boot());
  value(shell.newGame());
  const revision = shell.snapshot().model.revision;
  value(shell.perform("advance"));
  assert.equal(shell.snapshot().model.revision, revision + 1);
  const stale = shell.perform("advance", { revision });
  assert.equal(stale.ok, false);
  assert.equal(shell.snapshot().model.revision, revision + 1);
  assert.equal(shell.snapshot().error.code, stale.error.code);
  value(shell.changeSettings({ fontScale: 1.5 }));
  assert.equal(shell.snapshot().model.settings.fontScale, 1.5);
  assert.equal(shell.leave().value.phase, "title");
  assert.equal(shell.snapshot().title.continue.revision, revision + 1);
  assert.equal(shell.continue().ok, true);
});

test("TC-S5-VN-001 resources load from the application directory with same-origin requests", async () => {
  const requests = [];
  const fetch = async (url, init) => {
    requests.push({ url, init });
    const path = new URL(url).pathname.slice(1);
    return { ok: true, json: async () => JSON.parse(readFileSync(new URL(`../../${path}`, import.meta.url), "utf8")) };
  };
  const resources = await loadJourneyResources({ baseUrl: "http://127.0.0.1:8000/", fetch });
  assert.deepEqual(requests.map((r) => r.url), [`http://127.0.0.1:8000/${JOURNEY_PACKAGE_PATH}`, `http://127.0.0.1:8000/${JOURNEY_MEDIA_MANIFEST_PATH}`]);
  assert.ok(requests.every((r) => r.init.credentials === "omit" && r.init.mode === "same-origin"));
  assert.equal(resources.packageData.package.id, "story.jaokob.core");
  await assert.rejects(loadJourneyResources({ baseUrl: "http://127.0.0.1:8000/", fetch: async () => ({ ok: false, status: 404 }) }), /JOURNEY_RESOURCE_404/);
  assert.ok(journeyBaseUrl().endsWith("/"));
});

test("TC-S5-VN-001 the application hands its admitted package to the presentation only after boot", async () => {
  const { createApp } = await import("../helpers/journey-storage.js");
  const app = createApp(new SpyStorage());
  assert.equal(app.content().error.code, JOURNEY_APP_ERRORS.NOT_BOOTED);
  value(app.boot());
  const content = value(app.content());
  assert.equal(content.identity.key, "journey:story.jaokob.core@0.1.0");
  assert.ok(Object.isFrozen(content.package) && Object.isFrozen(content.package.texts));
});
