import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { projectContentPresentation } from "../../src/data/content/content-presentation.js";
import { projectContentView } from "../../src/data/content/content-view-model.js";
import { loadGameContent } from "../../src/data/content/content-runtime.js";
import { assertRendererViewModel, createRendererPort, RENDERER_PORT_OPERATIONS } from "../../src/core/ports/renderer-port.js";
import { createPresentationPackage } from "../fixtures/presentation/presentation-package.js";
import { testReferenceIds, engine, start, walk } from "../helpers/act1-session.js";

const source = JSON.parse(readFileSync(new URL("../fixtures/presentation/migration/act-01-2.0.0.json", import.meta.url)));
const fixture = createPresentationPackage(source);
const loaded = await loadGameContent({ content: fixture, testReferenceIds });
assert.equal(loaded.valid, true, JSON.stringify(loaded.errors));
const settings = fixture.gameDefaults.settings;
const input = (snapshot = start(), extra = {}) => ({ loaded, snapshot, facts: snapshot ? engine.facts(snapshot) : null, settings, mode: "game", ...extra });
const snapshots = walk(undefined, ["lily", "roots", "shadows", "mother"]);
const at = (id, ready = false) => snapshots.find((snapshot) => snapshot.currentNodeId === `node.act1.${id}` && (!ready || !engine.facts(snapshot).hasNextPage));
const frozen = (value) => { if (value && typeof value === "object") { assert.ok(Object.isFrozen(value)); Object.values(value).forEach(frozen); } };

test("TC-S3-CONTRACT-001 runtime explicitly supports both 1.1 and 1.2 Act 1 packages", async () => {
  assert.equal(loaded.catalog.version, "2.1.0");
  assert.equal(Object.keys(loaded.catalog.nodes).length, 14);
  const legacy = await loadGameContent({ content: source, testReferenceIds });
  assert.equal(legacy.valid, true);
  assert.equal(legacy.catalog.version, "2.0.0");
});

test("TC-S3-ARCH-001 immutable localized projection separates media IDs from paths, settings and domain", () => {
  const args = input(), before = structuredClone(args);
  const projected = projectContentPresentation(args), view = projectContentView(args);
  frozen(projected); frozen(view);
  assert.deepEqual(structuredClone(args), before);
  assert.equal(Object.isFrozen(settings), false, "caller-owned settings are not frozen as a side effect");
  assert.deepEqual(projected.visual.background, { contentVersion: "2.1.0", assetId: "asset.fixture.pond", alt: "ภาพทดสอบ pond" });
  assert.equal(projected.visual.character.lifeStage, "tadpole");
  assert.equal(projected.visual.speaker.role, "narrator");
  assert.equal(projected.visual.speaker.portrait, null);
  assert.deepEqual(projected.audio.volumes, { master: 1, music: 0, ambience: 0, effects: 0 });
  assert.equal(projected.audio.sessionId, args.snapshot.sessionId);
  assert.equal(projected.audio.bgmAssetId, "asset.fixture.music");
  assert.equal(projected.audio.ambientAssetId, "asset.fixture.water");
  assert.deepEqual(view.presentation, projected.visual);
  assert.doesNotThrow(() => assertRendererViewModel(view));
  assert.equal(JSON.stringify(view).includes("assets/fixture/"), false);
  assert.equal(Object.hasOwn(view, "audio"), false, "audio is for bootstrap fan-out, not the renderer");
});

test("TC-S3-CONTRACT-001 CR-0003 D1 absent/empty channels are neutral and silent without inheritance", async () => {
  const target = structuredClone(fixture);
  const node = target.narrativeTrees[0].nodes.find((entry) => entry.id === "node.act1.nursery");
  for (const environment of [undefined, {}, { bgmAssetId: "asset.fixture.music" }]) {
    if (environment === undefined) delete node.environment; else node.environment = environment;
    const content = await loadGameContent({ content: target, testReferenceIds });
    assert.equal(content.valid, true);
    projectContentPresentation(input()); // Previous requests cannot become state.
    const p = projectContentPresentation(input(at("nursery"), { loaded: content }));
    assert.equal(p.visual.background, null);
    assert.equal(p.audio.ambientAssetId, undefined);
    assert.equal(p.audio.bgmAssetId, environment?.bgmAssetId);
  }
  delete node.environment;
  node.backgroundAssetId = "asset.fixture.pond";
  const legacy = await loadGameContent({ content: target, testReferenceIds });
  const projected = projectContentPresentation(input(at("nursery"), { loaded: legacy }));
  assert.equal(projected.visual.background.assetId, "asset.fixture.pond");
  assert.equal(projected.audio.bgmAssetId, undefined);
  assert.equal(projected.audio.ambientAssetId, undefined);
});

test("TC-S3-STATE-001 D5/D8 reading, ready exploration and three authored decision actions preserve facts", () => {
  for (const snapshot of snapshots) {
    const args = input(snapshot), p = projectContentPresentation(args), view = projectContentView(args);
    const facts = args.facts;
    assert.equal(p.visual.mode, facts.complete ? "completion" : facts.hasNextPage || snapshot.state === "Cutscene" ? "reading" : snapshot.state.toLowerCase());
    assert.deepEqual(view.choices.filter((choice) => !choice.id.startsWith("application.")).map((choice) => choice.id), facts.actions.map((action) => action.id));
    assert.equal(p.visual.imageRequests.length <= 3, true);
    assert.doesNotThrow(() => assertRendererViewModel(view));
    const resumed = engine.resume(structuredClone(snapshot));
    assert.equal(resumed.ok, true);
    assert.deepEqual(projectContentPresentation(input(resumed.value.snapshot)), p);
    assert.deepEqual(snapshot, args.snapshot);
  }
  const decision = projectContentView(input(at("home-focus", true)));
  // D5 uses shortened labels in prose; retain the exact canonical package text.
  assert.deepEqual(decision.choices.slice(0, 3).map((choice) => choice.label), ["ว่ายตามแม่กบ", "อยู่ฟังรากบัว", "ว่ายเล่นกับพี่น้อง"]);
  const explore = projectContentView(input(at("nursery", true)));
  assert.equal(explore.choices.filter((choice) => choice.id.startsWith("interaction.")).length, 5);
});

test("TC-S3-CONTRACT-001 overlays and reading pages retain desired loops; title is silent", () => {
  const initial = projectContentPresentation(input());
  for (const snapshot of snapshots.filter((s) => s.currentNodeId === "node.act1.opening")) {
    assert.deepEqual(projectContentPresentation(input(snapshot)).audio, initial.audio);
  }
  for (const mode of ["settings", "choice-confirmation", "replace-confirmation"]) {
    const p = projectContentPresentation(input(start(), { mode }));
    assert.equal(p.visual.mode, mode); assert.deepEqual(p.audio, initial.audio);
  }
  const title = projectContentPresentation(input(null));
  assert.equal(title.visual.mode, "title"); assert.equal(title.visual.character, null);
  assert.deepEqual(title.visual.imageRequests, []);
  assert.equal(title.audio.sessionId, null); assert.equal(title.audio.bgmAssetId, undefined);
});

test("TC-S3-CONTRACT-001 D6 protagonist override, other-speaker badge and narrator semantics use roles", async () => {
  for (const role of ["protagonist", "family", "narrator"]) {
    const target = structuredClone(fixture);
    const character = target.characters.characters.find((entry) => entry.narrativeRole === role);
    const dialogue = target.dialogues.dialogues[0];
    dialogue.speakerCharacterId = character.id;
    dialogue.delivery.portraitAssetId = role === "protagonist" ? "asset.fixture.tadpole-curious" : "asset.fixture.mother";
    character.name = { th: "ชื่อทดสอบที่ไม่ใช้ค้นหาไฟล์" };
    const content = await loadGameContent({ content: target, testReferenceIds });
    const p = projectContentPresentation(input(start(), { loaded: content }));
    assert.equal(p.visual.character.portrait.assetId, role === "protagonist" ? "asset.fixture.tadpole-curious" : "asset.fixture.tadpole");
    assert.equal(p.visual.speaker.name, character.name.th);
    assert.equal(p.visual.speaker.portrait?.assetId ?? null, role === "family" ? "asset.fixture.mother" : null);
  }
  const noMedia = await loadGameContent({ content: source, testReferenceIds });
  assert.equal(projectContentPresentation(input(start(), { loaded: noMedia })).visual.character, null);
});

test("TC-S3-CONTRACT-001 localization falls back to Thai and preserves validated zero settings", () => {
  const args = input(start(), { settings: { ...settings, locale: "en", masterVolume: 0, musicVolume: 0.8, ambienceVolume: 0.6, effectsVolume: 0, reducedIntensityAudio: true } });
  const p = projectContentPresentation(args), view = projectContentView(args);
  assert.equal(p.visual.speaker.name, source.characters.characters[0].name.th);
  assert.equal(view.scene.title, source.narrativeTrees[0].nodes[0].title.th);
  assert.deepEqual(p.audio.volumes, { master: 0, music: 0.8, ambience: 0.6, effects: 0 });
  assert.equal(p.audio.reducedIntensity, true, "adapter applies the cap without overwriting preferences");
});

test("TC-S3-ARCH-001 malformed composition inputs fail with a typed error", () => {
  for (const args of [{}, input(start(), { facts: { nodeId: "node.other" } }), input(start(), { settings: { ...settings, musicVolume: NaN } })]) {
    assert.throws(() => projectContentPresentation(args), { code: "CONTENT_PRESENTATION" });
  }
});

test("TC-S3-CONTRACT-001 D7 locked Bond presence has no numeric payload; legacy hidden contract survives", () => {
  const view = projectContentView(input(start(), { meterChanges: [{ meter: "bond", delta: 5 }, { meter: "hp", delta: 1 }] }));
  assert.deepEqual(view.meters.bond, { state: "locked", label: "Bond: Locked", accessibleLabel: "ความผูกพัน: ยังไม่เริ่มต้น", icons: ["lotus", "lock"] });
  assert.equal(view.meterChanges.some((change) => change.meter === "bond"), false);
  assert.equal(start().metrics.bond, 0);
  assert.doesNotThrow(() => assertRendererViewModel(view));
  assert.doesNotThrow(() => assertRendererViewModel({ meters: { bond: { value: 40, visible: false } } }));
  assert.doesNotThrow(() => assertRendererViewModel({ meters: { bond: 25 } }));
  assert.doesNotThrow(() => assertRendererViewModel({ meters: { bond: { state: "unlocked", value: 25, gateId: "NAR-SC-A4-004" } } }));
  assert.equal(projectContentView(input(null)).meters.bond.state, "hidden");
  for (const extra of [{ value: 0 }, { tooltip: "0/100" }, { accessibleLabel: "ความผูกพัน ๐" }, { label: "Bond 0%" }, { icons: ["lotus", "lock", 0] }, { state: "unlocked", value: 1 }]) {
    const copy = structuredClone(view); Object.assign(copy.meters.bond, extra);
    assert.throws(() => assertRendererViewModel(copy), { code: "INVALID_RENDERER_VIEW_MODEL" });
  }
});

test("TC-S3-ARCH-001 RendererPort rejects numeric leaks and browser/media objects before invoking adapter", () => {
  let called = 0;
  const port = createRendererPort(Object.fromEntries(RENDERER_PORT_OPERATIONS.map((name) => [name, () => { called += 1; return { ok: true }; }])));
  const view = projectContentView(input());
  assert.equal(port.render(view).ok, true);
  assert.equal(called, 1);
  for (const mutate of [
    (v) => { v.meters.bond.value = 0; },
    (v) => { v.presentation.background.url = "https://invalid.test/private"; },
    (v) => { v.presentation.imageRequests[0].element = { nodeType: 1 }; },
    (v) => { v.presentation.context = new Map(); },
  ]) {
    const changed = structuredClone(view); mutate(changed);
    assert.deepEqual(port.render(changed), { ok: false, error: { code: "RENDER_FAILURE" } });
  }
  assert.equal(called, 1);
});

test("TC-S3-ARCH-001 Core remains browser-free and production imports never reference tests", () => {
  const walkFiles = (url) => readdirSync(url, { withFileTypes: true }).flatMap((entry) => entry.isDirectory() ? walkFiles(new URL(`${entry.name}/`, url)) : entry.name.endsWith(".js") ? [new URL(entry.name, url)] : []);
  for (const url of walkFiles(new URL("../../src/", import.meta.url))) {
    const code = readFileSync(url, "utf8");
    const imports = [...code.matchAll(/(?:from\s+|import\s*)["']([^"']+)["']/g)].map((match) => match[1]);
    assert.equal(imports.some((path) => path.includes("tests/")), false, url.pathname);
    if (url.pathname.includes("/src/core/")) {
      assert.equal(imports.some((path) => /(?:ui|data)\//.test(path)), false, url.pathname);
      assert.doesNotMatch(code, /\b(?:document|window|localStorage|AudioContext|HTMLImageElement|fetch)\b/, url.pathname);
    }
  }
});
