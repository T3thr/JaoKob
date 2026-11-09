/**
 * One Mockups v3 screen drawn by the real Journey screens from a real engine state (PO harness,
 * outside the release allowlist). `screen.html?n=1..13`. See `screens.js` for how the state is
 * reached; here the steps run on the real application in the browser:
 *   1. a real New Game writes a real Save 2 record at the prelude (in memory, never the player's
 *      storage);
 *   2. the screen's preconditions are written into that record and it is sealed again;
 *   3. a fresh shell resumes it like any saved journey (schema, integrity, package digest and
 *      Core's restore all check it), and real commands reach the beat;
 *   4. for the two micro-action screens, the player's first press is sent as a key.
 * `window.journeyHarness` lets the browser runner read the screen; nothing here changes a rule.
 */

import { createJourneyShell, journeyBaseUrl } from "../../../../src/bootstrap/journey-shell.js";
import { journeySaveKeys } from "../../../../src/data/persistence/journey-save-repository.js";
import { sealJourneySave } from "../../../../src/data/validation/journey-save-validator.js";
import { SCREENS, nextCommand, screenPackage, withPreconditions } from "./screens.js";

/** Storage that lives only as long as this page: the harness never touches the player's saves. */
class MemoryStorage {
  #entries = new Map();
  get length() { return this.#entries.size; }
  key(index) { return [...this.#entries.keys()][index] ?? null; }
  getItem(key) { return this.#entries.has(key) ? this.#entries.get(key) : null; }
  setItem(key, value) { this.#entries.set(String(key), String(value)); }
  removeItem(key) { this.#entries.delete(key); }
}

const read = async (path) => {
  const response = await fetch(new URL(path, import.meta.url).href, { credentials: "omit", mode: "same-origin", redirect: "error", cache: "no-cache" });
  if (!response.ok) throw new Error(`HARNESS_RESOURCE_${response.status}`);
  return response.json();
};

async function start() {
  const n = Number(new URLSearchParams(location.search).get("n") ?? "1");
  const screen = SCREENS.find((entry) => entry.n === n) ?? SCREENS[0];
  document.title = `v3 จอ ${screen.n} · ${screen.stem}`;
  const [mini, story, fixtures, manifest] = await Promise.all([
    read("../../../../tests/fixtures/journey/mini-journey.json"),
    read("../../mechanics/story.json"),
    read("../../ux-mockups/v3/harness/fixtures.json"),
    read("../../../../assets/images/asset-manifest-v2.json"),
  ]);
  const packageData = screenPackage(screen, { mini, story, fixtures });
  const storage = new MemoryStorage();
  const common = { document, packageData, manifest, baseUrl: journeyBaseUrl(), storage };

  const first = createJourneyShell({ ...common, root: document.createElement("div") });
  if (!first.boot().ok || !first.newGame().ok) throw new Error("HARNESS_NEW_GAME");
  first.dispose();
  const key = journeySaveKeys(packageData.package.id).canonical;
  const record = JSON.parse(storage.getItem(key));
  const prepared = withPreconditions({ revision: record.revision, payload: record.payload }, screen);
  storage.setItem(key, JSON.stringify(sealJourneySave({ ...record, payload: prepared.payload })));

  const shell = createJourneyShell({ ...common, root: document.getElementById("game") });
  const booted = shell.boot();
  if (!booted.ok) throw new Error(booted.error.code);
  const resumed = shell.continue();
  if (!resumed.ok) throw new Error(resumed.error.code);
  const progress = { pressed: 0 };
  for (let guard = 0; guard < 80; guard += 1) {
    const view = shell.view().value.view;
    const command = nextCommand(view, screen, progress);
    if (command === null) break;
    const result = shell.perform(command.kind, { ...(command.args ?? {}), revision: view.revision });
    if (!result.ok) throw new Error(result.error.code);
  }
  for (let i = 0; i < (screen.taps ?? 0); i += 1) {
    document.body.dispatchEvent(new KeyboardEvent("keydown", { key: " ", bubbles: true }));
    document.body.dispatchEvent(new KeyboardEvent("keyup", { key: " ", bubbles: true }));
  }
  window.journeyHarness = Object.freeze({ screen, view: () => shell.view().value.view, images: () => shell.images() });
}

start().catch((failure) => {
  const error = document.getElementById("harness-error");
  error.textContent = location.protocol === "file:" ? "เปิดผ่าน file:// ไม่ได้ · รัน node tools/dev/serve-review.mjs" : `เตรียมจอไม่สำเร็จ: ${failure.message}`;
  error.hidden = false;
}).finally(() => document.documentElement.setAttribute("data-harness-ready", "true"));
