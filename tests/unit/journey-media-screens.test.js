import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createJourneyShell } from "../../src/bootstrap/journey-shell.js";
import { IMAGE_BUDGET_BYTES } from "../../src/ui/assets/image-cache.js";
import { loadAct1Package, planned } from "../helpers/journey-driver.js";
import { JourneyDocument, byClass, flush } from "../helpers/journey-dom.js";
import { MEDIA_BASE, browserImages, repositoryFetch, settle } from "../helpers/journey-media.js";
import { SpyStorage, steppingClock } from "../helpers/journey-storage.js";

/**
 * The Journey screens on the verified image loader (C5d): what the screens hold, the image
 * budget over whole plays, and a damaged file. Trace: TC-S5-ASSET-001, TC-S5-PACKAGE-001,
 * TC-S5-PERF-001 (image budget), ADR-P0-034 D7.5 · D10.3, SSOT §4.3 T3.
 */
const manifest = JSON.parse(readFileSync(new URL("../../assets/images/asset-manifest-v2.json", import.meta.url), "utf8"));
const MINI = JSON.parse(readFileSync(new URL("../fixtures/journey/mini-journey.json", import.meta.url), "utf8"));
const PLANS = Object.freeze({
  act1: { packageData: loadAct1Package, policy: planned({ "a1-03": "rain", "a1-06": "grit", "a1-13": "a" }) },
  mini: { packageData: () => structuredClone(MINI), policy: planned() },
});

function shellFor(packageData, extra) {
  const document = new JourneyDocument();
  const root = document.createElement("main");
  document.body.append(root);
  const shell = createJourneyShell({ document, root, packageData, manifest, baseUrl: MEDIA_BASE, storage: new SpyStorage(), clock: steppingClock(), ...extra });
  return { document, root, shell };
}

/** Real commands from New Game until the policy stops; `onStep` runs after each one. */
async function playThrough(shell, policy, onStep) {
  for (let i = 0; i < 800; i += 1) {
    const current = shell.view();
    if (!current.ok || current.value.phase !== "playing") return i;
    const view = current.value.view;
    const command = policy(view);
    if (command === null) return i;
    const result = shell.perform(command.kind, { ...(command.args ?? {}), revision: view.revision });
    assert.ok(result.ok, JSON.stringify(result.error));
    await onStep(shell.snapshot().model, view.mode);
  }
  throw new Error("the play did not finish");
}

/** Asset IDs of the images a play model puts on screen now. */
function shownAssets(model) {
  const ids = new Set();
  const collect = (value) => {
    if (value === null || typeof value !== "object") return;
    if (typeof value.identity === "string" && typeof value.assetId === "string") ids.add(value.assetId);
    for (const child of Object.values(value)) collect(child);
  };
  collect(model.scene.background);
  model.scene.actors.forEach((actor) => collect(actor.image));
  if (model.scene.showCg === true) collect(model.scene.cg);
  if (model.decision !== null && model.decision !== undefined && model.accepts.includes("choose")) collect(model.decision);
  if (model.clash?.beat === "choose") collect(model.clash.groups);
  if (model.mode === "CAMP" && model.camp?.open === true) collect(model.camp);
  if (model.mode === "POUCH_SWAP") collect(model.pouch);
  return ids;
}

/** A loader that knows every lease it handed out and not taken back. */
function leaseLedger() {
  const held = new Map();
  const loadImage = async (descriptor) => {
    const lease = { url: `blob:${descriptor.assetId}`, release() { held.delete(lease); } };
    held.set(lease, descriptor.assetId);
    return lease;
  };
  return { loadImage, held: () => [...held.values()] };
}

for (const [name, plan] of Object.entries(PLANS)) {
  test(`TC-S5-ASSET-001 every image the ${name} screens hold is one they show, in every mode and back at the title`, async () => {
    const ledger = leaseLedger();
    const { shell } = shellFor(plan.packageData(), { loadImage: ledger.loadImage });
    assert.ok(shell.boot().ok);
    assert.equal(shell.images(), null, "an injected loader has no cache of the shell");
    await flush();
    const opening = shell.snapshot().title.screen.background?.assetId;
    assert.ok(opening, "the title has its plate");
    assert.deepEqual(ledger.held(), [opening]);
    assert.ok(shell.newGame().ok);
    await flush();
    const modes = new Set();
    let peak = 0;
    const steps = await playThrough(shell, plan.policy, async (model, mode) => {
      await flush();
      modes.add(mode);
      const shown = shownAssets(model);
      const held = ledger.held();
      peak = Math.max(peak, held.length);
      for (const id of held) assert.ok(shown.has(id), `${model.scene.nodeId} ${model.mode}: holds ${id} that is not on screen`);
    });
    assert.ok(steps > 20, `${steps} commands`);
    for (const mode of name === "act1" ? ["VN", "DECISION", "CLASH_CHOOSE", "CAMP", "MICRO"] : ["POUCH_SWAP", "ENDING_RESONANCE", "MICRO"]) assert.ok(modes.has(mode), mode);
    assert.ok(peak > 0);
    assert.ok(shell.leave().ok);
    await flush();
    assert.deepEqual(ledger.held(), [opening], "behind the title the game screen holds nothing");
    shell.dispose();
    assert.deepEqual(ledger.held(), [], "disposing gives every lease back");
  });

  test(`TC-S5-ASSET-001 the whole ${name} play runs on proved bytes inside the 32 MiB image budget with no image refused`, async () => {
    const server = repositoryFetch();
    const ports = browserImages();
    const { root, shell } = shellFor(plan.packageData(), { media: { fetch: server.fetch, ...ports } });
    assert.ok(shell.boot().ok);
    await settle();
    assert.ok(shell.newGame().ok);
    await settle();
    let peak = 0, held = 0;
    await playThrough(shell, plan.policy, async () => {
      await settle();
      const images = shell.images();
      peak = Math.max(peak, images.bytes);
      held = Math.max(held, images.retainedBytes);
      assert.equal(images.failures, 0, "no image was refused");
      assert.ok(images.bytes <= IMAGE_BUDGET_BYTES);
    });
    await settle();
    const images = shell.images();
    assert.equal(images.budget, IMAGE_BUDGET_BYTES);
    assert.equal(images.failures, 0);
    assert.ok(peak > 0 && peak <= IMAGE_BUDGET_BYTES, `peak ${peak}`);
    assert.ok(held > 0 && held <= peak, `held on screen at most ${held}`);
    assert.ok(server.calls.length > 5);
    for (const call of server.calls) {
      assert.match(call.url, /^http:\/\/127\.0\.0\.1:8000\/assets\/images\/[a-z0-9_./-]+\.webp$/);
      assert.equal(call.init.credentials, "omit");
      assert.equal(call.init.redirect, "error");
    }
    assert.ok(byClass(root, "jk-stage__bg").some((layer) => (layer.getAttribute("src") ?? "").startsWith("blob:test-")), "the plate is drawn from a proved blob");
    shell.dispose();
    assert.equal(ports.live(), 0, "disposing revokes every object URL");
    assert.equal(shell.images().bytes, 0);
  });
}

test("TC-S5-ASSET-001 a damaged image is never drawn, the story goes on, and the other images still load", async () => {
  const damaged = "assets/images/backgrounds/";
  let first = null;
  const server = repositoryFetch({
    change: (path, bytes) => {
      if (!path.startsWith(damaged)) return bytes;
      first ??= path;
      if (path !== first) return bytes;
      const copy = new Uint8Array(bytes);
      copy[copy.length >> 1] ^= 0xff;
      return copy;
    },
  });
  const ports = browserImages();
  const { root, shell } = shellFor(loadAct1Package(), { media: { fetch: server.fetch, ...ports } });
  assert.ok(shell.boot().ok);
  await settle();
  assert.ok(shell.images().failures >= 1, "the damaged plate was refused");
  const title = byClass(root, "jk-title__plate")[0] ?? byClass(root, "jk-title")[0];
  assert.ok(title, "the title is on screen");
  assert.ok(shell.newGame().ok);
  await settle();
  let steps = 0;
  await playThrough(shell, PLANS.act1.policy, async () => { steps += 1; if (steps % 10 === 0) await settle(); });
  await settle();
  assert.ok(steps > 20, "the whole act played");
  assert.ok(shell.images().entries > 3, "every other image loaded");
  assert.equal(server.calls.filter((call) => call.url.endsWith(first)).length >= 1, true);
  shell.dispose();
});
