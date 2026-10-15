import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createLocalUiPreferencesAdapter, UI_PREFERENCES_KEY as KEY } from "../../src/data/persistence/local-ui-preferences-adapter.js";
import { createGameApplication } from "../../src/bootstrap/index.js";
import { LOCAL_STORAGE_KEYS as SAVE_KEYS } from "../../src/data/persistence/local-storage-adapter.js";
import { MemoryStorage, FakeDocument, findByAttribute, findAllByAttribute } from "../helpers/application-harness.js";
import { content, testReferenceIds, AT, SESSION_ID } from "../helpers/act1-session.js";

const writes = (storage) => storage.calls.filter(({ method }) => method !== "getItem");
const saved = (hideContentAdvisory) => JSON.stringify({ version: 1, preferences: { hideContentAdvisory } });
function harness(rawStorage = new MemoryStorage(), extra = {}) {
  const document = new FakeDocument(), root = document.createElement("div");
  const app = createGameApplication({ root, document, rawStorage, content, testReferenceIds, clock: () => AT, sessionIdFactory: () => SESSION_ID, ...extra });
  const click = async (id) => {
    const button = findAllByAttribute(root, "data-choice-id", id).find((node) => !node.disabled && node.parentNode?.getAttribute("data-jk-role") !== "utility-rail")
      ?? findByAttribute(root, "data-choice-id", id);
    button.dispatchEvent({ type: "click" }); const result = await app.whenIdle(); assert.equal(result.ok, true, JSON.stringify(result));
  };
  return { app, document, root, rawStorage, click };
}

test("ADR-P0-018 D4 preference round trip writes its own versioned key only", () => {
  const storage = new MemoryStorage({ [SAVE_KEYS.canonical]: "retained save", [SAVE_KEYS.settings]: "retained settings" });
  const adapter = createLocalUiPreferencesAdapter({ storage });
  assert.deepEqual(adapter.load().value, { hideContentAdvisory: false }); assert.equal(writes(storage).length, 0);
  for (const hideContentAdvisory of [true, false]) {
    assert.equal(adapter.save({ hideContentAdvisory }).ok, true);
    assert.equal(storage.raw(KEY), saved(hideContentAdvisory));
    assert.equal(adapter.load().value.hideContentAdvisory, hideContentAdvisory);
  }
  assert.ok(writes(storage).every(({ key }) => key === KEY));
  assert.equal(storage.raw(SAVE_KEYS.canonical), "retained save"); assert.equal(storage.raw(SAVE_KEYS.settings), "retained settings");
});

test("ADR-P0-018 D4 malformed, oversized, unknown-version and invalid preference records stay byte-identical", () => {
  for (const raw of ["{bad", "x".repeat(257), "null", "[]", '{"version":999,"preferences":{"hideContentAdvisory":true}}',
    '{"version":1,"preferences":{"hideContentAdvisory":"true"}}', '{"version":1,"preferences":{"hideContentAdvisory":true,"other":1}}',
    '{"version":1,"preferences":{"hideContentAdvisory":true},"other":1}']) {
    const storage = new MemoryStorage({ [KEY]: raw }), adapter = createLocalUiPreferencesAdapter({ storage });
    assert.equal(adapter.load().ok, false); assert.equal(adapter.save({ hideContentAdvisory: true }).ok, false);
    assert.equal(storage.raw(KEY), raw); assert.equal(writes(storage).length, 0);
  }
  const storage = new MemoryStorage(), adapter = createLocalUiPreferencesAdapter({ storage });
  const inherited = Object.assign(Object.create({ hideContentAdvisory: true }), { other: 1 });
  for (const value of [null, [], {}, inherited, { hideContentAdvisory: 1 }, { hideContentAdvisory: true, extra: true }]) assert.equal(adapter.save(value).ok, false);
  assert.equal(writes(storage).length, 0);
});

test("ADR-P0-018 D4 storage denial, silent write failure and observed cross-tab race fail safely", () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, "localStorage"); let globalReads = 0;
  try {
    Object.defineProperty(globalThis, "localStorage", { configurable: true, get() { globalReads++; return new MemoryStorage(); } });
    assert.equal(createLocalUiPreferencesAdapter({ storage: null }).load().ok, false);
    assert.equal(globalReads, 0, "explicitly disabled storage must not fall back to browser storage");
  } finally {
    if (original) Object.defineProperty(globalThis, "localStorage", original); else delete globalThis.localStorage;
  }
  const blocked = createLocalUiPreferencesAdapter({ storage: { getItem() { throw new Error("private raw detail"); }, setItem() { throw new Error(); } } });
  assert.deepEqual(blocked.load(), { ok: false, error: { code: "PREFERENCES_UNAVAILABLE" } });
  assert.equal(blocked.save({ hideContentAdvisory: true }).ok, false);
  const dropped = createLocalUiPreferencesAdapter({ storage: { getItem: () => null, setItem: () => {} } });
  assert.equal(dropped.save({ hideContentAdvisory: true }).ok, false);
  let reads = 0, written = false;
  const raced = createLocalUiPreferencesAdapter({ storage: { getItem: () => ++reads === 1 ? null : saved(false), setItem: () => { written = true; } } });
  assert.deepEqual(raced.save({ hideContentAdvisory: true }), { ok: false, error: { code: "PREFERENCES_RACE" } }); assert.equal(written, false);
});

test("ADR-P0-018 D4 advisory ack/close never starts a game; preference survives reboot and is reversible through settings", async () => {
  const h = harness(); await h.app.boot();
  assert.equal(findAllByAttribute(h.root, "data-jk-role", "first-run-notice").length, 0);
  await h.click("application.advisory");
  assert.equal(findAllByAttribute(h.root, "data-jk-role", "advisory-dialog").length, 1);
  assert.match(h.root.textContent, /พายุและการพลัดพราก/);
  const toggle = findByAttribute(h.root, "data-jk-preference", "hideContentAdvisory");
  toggle.focus(); toggle.dispatchEvent({ type: "click" }); assert.equal((await h.app.whenIdle()).ok, true);
  assert.equal(h.document.activeElement.getAttribute("data-jk-preference"), "hideContentAdvisory");
  await h.click("application.close-advisory");
  assert.equal(h.app.getSnapshot(), null); assert.equal(storageValue(h), true);
  assert.ok(writes(h.rawStorage).every(({ key }) => key === KEY));
  h.app.dispose();
  const next = harness(h.rawStorage); await next.app.boot();
  assert.equal(findAllByAttribute(next.root, "data-choice-id", "application.advisory").length, 0);
  await next.click("application.settings"); await next.click("application.advisory");
  findByAttribute(next.root, "data-jk-preference", "hideContentAdvisory").dispatchEvent({ type: "click" }); await next.app.whenIdle();
  assert.equal(storageValue(next), false);
  await next.click("application.close-advisory");
  assert.equal(next.document.activeElement.getAttribute("data-choice-id"), "application.advisory");
  await next.click("application.close-settings");
  assert.equal(findAllByAttribute(next.root, "data-choice-id", "application.advisory").length, 1);
  next.app.dispose();
});
const storageValue = (h) => JSON.parse(h.rawStorage.raw(KEY)).preferences.hideContentAdvisory;

test("ADR-P0-018 D4 overlay rejects background/stale intents and never changes active story/save/settings", async () => {
  const h = harness(); await h.app.boot(); await h.click("application.new-game");
  const before = h.app.getSnapshot(), raw = h.rawStorage.raw(SAVE_KEYS.canonical), settings = h.app.getViewModel().settings;
  await h.click("application.settings"); await h.click("application.advisory");
  const current = h.app.getViewModel().viewRevision;
  assert.equal((await h.app.dispatch({ type: "SELECT_CHOICE", choiceId: "application.advance", viewRevision: current })).ok, false);
  assert.equal((await h.app.dispatch({ type: "SETTINGS_CHANGED", setting: "fontScale", value: 2 })).ok, false);
  assert.equal((await h.app.dispatch({ type: "PREFERENCE_CHANGED", preference: "hideContentAdvisory", value: true, viewRevision: current - 1 })).ok, false);
  assert.equal((await h.app.dispatch({ type: "PREFERENCE_CHANGED", preference: "hideContentAdvisory", value: "yes" })).ok, false);
  assert.equal((await h.app.dispatch({ type: "PREFERENCE_CHANGED", preference: "hideContentAdvisory", value: true, viewRevision: current })).ok, true);
  await h.click("application.close-advisory"); await h.click("application.close-settings");
  assert.equal(h.app.getSnapshot(), before); assert.equal(h.rawStorage.raw(SAVE_KEYS.canonical), raw); assert.deepEqual(h.app.getViewModel().settings, settings);
  assert.equal((await h.app.dispatch({ type: "PREFERENCE_CHANGED", preference: "hideContentAdvisory", value: false })).ok, false);
  h.app.dispose();
});

test("ADR-P0-018 D4 failed preference write stays usable, explains non-persistence and protects unknown records", async () => {
  const raw = '{"version":999,"preferences":{"hideContentAdvisory":false}}', h = harness(new MemoryStorage({ [KEY]: raw }));
  await h.app.boot(); await h.click("application.advisory");
  findByAttribute(h.root, "data-jk-preference", "hideContentAdvisory").dispatchEvent({ type: "click" }); await h.app.whenIdle();
  assert.match(findByAttribute(h.root, "data-jk-role", "preference-status").textContent, /ยังบันทึก|เปิดเกมใหม่/);
  await h.click("application.close-advisory"); assert.equal(h.app.getSnapshot(), null);
  assert.equal(h.rawStorage.raw(KEY), raw); assert.equal(writes(h.rawStorage).length, 0); h.app.dispose();
});

test("ADR-P0-018 D3 localized runtime chrome uses Thai punctuation and SVG-only decorative icons", () => {
  for (const path of ["src/data/localization/th-application.js", "src/data/content/content-view-model.js", "src/ui/localization/th-system-messages.js", "src/ui/renderers/dom/dom-renderer.js"]) {
    const source = readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
    assert.doesNotMatch(source, /[—–⚙🪷🔒♥◌∞]/u, path);
  }
  assert.doesNotMatch(readFileSync(new URL("../../index.html", import.meta.url), "utf8"), /%F0%9F|<text/i);
});
