import test from "node:test";
import assert from "node:assert/strict";
import { createStageView } from "../../src/ui/components/stage-view.js";
import { FakeDocument } from "../helpers/application-harness.js";
const reference = (assetId) => ({ assetId, contentVersion: "2.1.0", alt: "ลูกอ๊อดผ้าผูกคอสีน้ำเงิน" });
const flush = async () => { for (let i = 0; i < 6; i++) await Promise.resolve(); };

test("TC-S3-ASSET-001 stage deduplicates unchanged accepted IDs and releases images exactly once on replacement/dispose", async () => {
  const requests = [], releases = [];
  const stage = createStageView({ document: new FakeDocument(), loadImage: async (ref) => {
    requests.push(ref.assetId); return { ok: true, value: { url: `blob:${ref.assetId}`, release: () => releases.push(ref.assetId) } };
  } });
  const visual = { background: reference("pond"), character: { lifeStage: "tadpole", portrait: reference("tadpole") } };
  stage.update(visual); await flush();
  const image = stage.character.children[0];
  assert.equal(image.getAttribute("alt"), visual.character.portrait.alt);
  assert.equal(stage.background.children[0].getAttribute("alt"), "");
  stage.update(visual); await flush();
  assert.equal(stage.character.children[0], image); assert.deepEqual(requests, ["pond", "tadpole"]);
  stage.update({}); assert.deepEqual(releases, ["pond", "tadpole"]);
  stage.dispose(); assert.deepEqual(releases, ["pond", "tadpole"]);
});

test("TC-S3-ASSET-001 late stale decoded images cannot resurrect a previous scene", async () => {
  const pending = new Map(), releases = [];
  const stage = createStageView({ document: new FakeDocument(), loadImage: (ref) => new Promise((resolve) => pending.set(ref.assetId, resolve)) });
  stage.update({ background: reference("old") }); await flush();
  stage.update({ background: reference("new") }); await flush();
  pending.get("new")({ ok: true, value: { url: "blob:new", release: () => releases.push("new") } }); await flush();
  pending.get("old")({ ok: true, value: { url: "blob:old", release: () => releases.push("old") } }); await flush();
  assert.equal(stage.background.children[0].getAttribute("src"), "blob:new");
  assert.deepEqual(releases, ["old"]);
  stage.dispose(); assert.deepEqual(releases, ["old", "new"]);
});

test("TC-S3-ASSET-001 missing/decode failure is neutral and retryable; disposal releases pending success", async () => {
  let requests = 0, resolveLate, released = 0;
  const stage = createStageView({ document: new FakeDocument(), loadImage: () => {
    if (++requests === 1) throw new Error("decode");
    return new Promise((resolve) => { resolveLate = resolve; });
  } });
  stage.update({ background: reference("pond") }); await flush();
  assert.equal(stage.background.getAttribute("data-media-state"), "unavailable");
  assert.equal(stage.background.children.length, 0);
  stage.retry(); stage.update({ background: reference("pond") }); await flush(); stage.dispose();
  resolveLate({ ok: true, value: { url: "blob:late", release: () => released++ } }); await flush();
  assert.equal(released, 1); assert.equal(stage.background.children.length, 0);
});

test("CR-0003 D6 speaker portrait remains separate from the protagonist body", async () => {
  const stage = createStageView({ document: new FakeDocument(), loadImage: async (ref) => ({ ok: true, value: { url: `blob:${ref.assetId}` } }) });
  stage.update({ character: { lifeStage: "tadpole", portrait: reference("tadpole") }, speaker: { role: "supporting", portrait: reference("mother") } }); await flush();
  assert.equal(stage.character.children[0].getAttribute("src"), "blob:tadpole");
  assert.equal(stage.speakerPortrait.children[0].getAttribute("src"), "blob:mother");
  stage.update({ character: { lifeStage: "tadpole", portrait: reference("tadpole") }, speaker: { role: "narrator", portrait: null } });
  assert.equal(stage.speakerPortrait.children.length, 0); assert.equal(stage.character.children.length, 1);
});
