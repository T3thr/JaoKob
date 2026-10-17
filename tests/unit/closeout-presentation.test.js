import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash, webcrypto } from "node:crypto";
import { loadGameContent } from "../../src/data/content/content-runtime.js";
import { validatePresentationCatalog, loadPresentationCatalog } from "../../src/data/content/presentation-catalog.js";
import { projectContentView } from "../../src/data/content/content-view-model.js";
import { projectContentPresentation } from "../../src/data/content/content-presentation.js";
import { projectKeepsakePouch } from "../../src/data/content/keepsake-view-model.js";
import { createAssetResolver } from "../../src/data/assets/asset-resolver.js";
import { createKeepsakePouchDialog } from "../../src/ui/components/keepsake-pouch-dialog.js";
import { TH_SYSTEM_MESSAGES } from "../../src/ui/localization/th-system-messages.js";
import { FakeDocument, findByAttribute as find, findAllByAttribute as all } from "../helpers/application-harness.js";
import { current, decoration, registry, BASE, closeoutHarness, choose } from "../helpers/closeout-session.js";
import { candidateTestIds, story, travel, FULL_PLAN } from "../helpers/narrative-session.js";

const loaded = await loadGameContent({ content: current, testReferenceIds: candidateTestIds, presentationCatalog: decoration });
assert.equal(loaded.valid, true); assert.equal(loaded.presentationStatus, "ready");
const viewAt = (snapshot, content = loaded) => projectContentView({ loaded: content, snapshot, facts: story.facts(snapshot),
  settings: current.gameDefaults.settings, mode: "game", viewRevision: 1, hasResume: true });

test("TC-S4-CHOICE-001 T9 catalog covers all30 actual actions and five encountered-item references without changing eligibility", () => {
  const ids = [...Object.keys(loaded.indexes.choices), ...Object.keys(loaded.indexes.interactions)].sort();
  assert.equal(ids.length, 30);
  assert.deepEqual(Object.keys(loaded.presentationCatalog.choices).sort(), ids);
  assert.deepEqual(Object.keys(loaded.presentationCatalog.items).sort(), current.keepsakes.map(i => i.id).sort());
  assert.ok(Object.isFrozen(loaded.presentationCatalog.catalog.choices[0].intent));
  const snapshot = travel(FULL_PLAN, { stop: s => s.currentNodeId === "node.act1.river-offer" }).snapshot;
  const before = structuredClone(snapshot), facts = story.facts(snapshot), view = viewAt(snapshot);
  const shown = view.choices.filter(c => c.id.startsWith("choice."));
  assert.equal(shown.length, 5);
  for (const choice of shown) {
    assert.equal(choice.disabled, !facts.actions.find(f => f.id === choice.id).eligible);
    assert.ok(choice.intentText); assert.equal(choice.skin, "paper");
    assert.doesNotMatch(choice.intentText, /[0-9\u2013\u2014]|HP|Sanity|Bond|END-|คะแนน|\p{Extended_Pictographic}/iu);
  }
  assert.deepEqual(snapshot, before);
});

for (const [name, mutate] of [
  ["unknown field", c => { c.choices[0].effect = 20; }],
  ["wrong content", c => { c.contentVersion = "2.1.0"; }],
  ["missing Thai", c => { c.choices[0].intent = { en: "watch" }; }],
  ["unknown locale", c => { c.locale = "en"; }],
  ["empty tag", c => { c.choices[0].intent.th = " "; }],
  ["unknown icon", c => { c.choices[0].icon = "winning"; }],
  ["unknown skin", c => { c.choices[0].skin = "best"; }],
  ["duplicate action", c => { c.choices.push(c.choices[0]); }],
  ["duplicate item", c => { c.items.push(c.items[0]); }],
  ["duplicate crop", c => { c.backgrounds.push(c.backgrounds[0]); }],
  ["dangling action", c => { c.choices[0].actionId = "choice.unwritten"; }],
  ["unregistered item", c => { c.items[0].itemId = "item_unseen"; }],
  ["audio as item image", c => { c.items[0].imageAssetId = "asset.audio.act1-peaceful-stream"; }],
  ["missing background", c => { c.backgrounds[0].assetId = "asset.image.missing"; }],
  ["outside crop", c => { c.backgrounds[0].crop.portrait.x = 101; }],
  ["numeric spoiler", c => { c.choices[0].intent.th = "Bond 20"; }],
  ["markup", c => { c.choices[0].intent.th = "<img>"; }],
]) test(`TC-S4-CONTRACT-001 T9 rejects ${name}`, () => {
  const copy = structuredClone(decoration); mutate(copy);
  assert.equal(validatePresentationCatalog(copy, loaded).valid, false);
});

test("TC-S4-CHOICE-001 missing optional decoration retains the plain labeled choice and original guards", async () => {
  const catalog = structuredClone(decoration); catalog.choices = [];
  const plain = await loadGameContent({ content: current, testReferenceIds: candidateTestIds, presentationCatalog: catalog });
  const snapshot = travel({}, { stop: s => s.currentNodeId === "node.act1.home-focus" }).snapshot;
  const view = viewAt(snapshot, plain);
  assert.equal(view.choices.find(c => c.id === "choice.act1.focus-mother").intentText, undefined);
  assert.deepEqual(view.choices.map(c => [c.id,c.disabled]), viewAt(snapshot).choices.map(c => [c.id,c.disabled]));
});

test("TC-S4-CHOICE-001 real DOM receives motive tags and source-authored cues outside the sacred reading card", async () => {
  const h = closeoutHarness(); await h.app.boot(); await choose(h.app, "application.new-game");
  for (let i = 0; !h.app.getViewModel().choices.some(c => c.id === "choice.act1.focus-roots"); i++) {
    assert.ok(i < 30); await choose(h.app, h.app.getViewModel().choices.some(c => c.id === "application.advance") ? "application.advance" : "interaction.act1.join-family");
  }
  assert.match(find(h.root,"data-choice-id","choice.act1.focus-roots").textContent, /รับฟัง/);
  await choose(h.app, "choice.act1.focus-roots");
  for (let i = 0; !h.app.getViewModel().choices.some(c => c.id === "choice.act1.call-family"); i++) { assert.ok(i < 30); await choose(h.app,"application.advance"); }
  const cue = all(h.root,"class","jk-choice-outcome"); assert.equal(cue.length, 2);
  const reading = find(h.root,"data-jk-role","dialogue");
  for (const text of cue) assert.equal(reading.textContent.includes(text.textContent), false);
  assert.ok(find(h.root,"data-choice-id","choice.act1.call-family").getAttribute("aria-describedby"));
  h.app.dispose();
});

test("TC-S4-ASSET-001 strict loader is bounded/same-origin and invalid decoration fails soft with intact playable story", async () => {
  let fetched = false;
  for (const url of ["https://foreign.test/catalog.json",`${BASE}catalog.json?q=1`,`${BASE}catalog.json#x`])
    assert.equal((await loadPresentationCatalog(url,{ loaded,baseUrl:BASE,fetch:()=>{fetched=true;} })).valid,false);
  assert.equal(fetched,false);
  let cancelled = false;
  const tooBig = await loadPresentationCatalog(`${BASE}catalog.json`, {loaded,baseUrl:BASE,fetch:async()=>new Response(new ReadableStream({pull(c){c.enqueue(new Uint8Array(64_001));},cancel(){cancelled=true;}}),{headers:{"content-type":"application/json"}})});
  assert.equal(tooBig.valid,false); assert.equal(cancelled,true);
  const h = closeoutHarness({}, { presentationCatalog: { bad: true } });
  assert.equal((await h.app.boot()).ok,true); assert.equal(h.app.getStatus().presentationStatus,"unavailable");
  await choose(h.app,"application.new-game"); assert.equal(h.app.getStatus().fatal,false);
  assert.equal(h.app.getSnapshot().pouch.held.length,0); h.app.dispose();
});

test("TC-S4-ASSET-001 five original SVGs are byte/hash/rights bound and resolve at root/subpath", async () => {
  for (const record of registry.assets.filter(r => r.mimeType === "image/svg+xml")) {
    const bytes = readFileSync(new URL(`../../${record.path}`,import.meta.url));
    assert.equal(bytes.length,record.byteLength); assert.equal(createHash("sha256").update(bytes).digest("hex"),record.sha256);
    assert.equal(loaded.indexes.assets[record.assetId].rights.origin,"original");
    for (const prefix of ["https://game.test/",BASE]) {
      const resolver = createAssetResolver({loaded,registry,baseUrl:prefix,digest:b=>webcrypto.subtle.digest("SHA-256",b),fetch:async url=>{
        assert.equal(url,`${prefix}${record.path}`);return new Response(bytes,{headers:{"content-type":"image/svg+xml"}});
      }});
      assert.equal((await resolver.read({contentVersion:"3.0.0",assetId:record.assetId})).ok,true);
    }
  }
});

test("TC-S4-ASSET-001 SVG capability rejects active/external/non-geometry documents even with a matching digest", async () => {
  const original = registry.assets.find(r=>r.mimeType==="image/svg+xml");
  for (const text of ['<svg xmlns="http://www.w3.org/2000/svg"><script>bad</script></svg>', '<svg xmlns="http://www.w3.org/2000/svg"><path onload="bad"/></svg>', '<svg xmlns="http://www.w3.org/2000/svg"><image href="https://foreign.test/x"/></svg>', '<svg xmlns="http://www.w3.org/2000/svg"><path fill="&#117;&#114;&#108;&#40;&#104;&#116;&#116;&#112;&#115;&#58;&#47;&#47;foreign.test/x)"/></svg>']) {
    const bytes=Buffer.from(text), record={...original,byteLength:bytes.length,sha256:createHash("sha256").update(bytes).digest("hex")};
    const resolver=createAssetResolver({loaded,registry:{...registry,assets:[record]},baseUrl:BASE,fetch:async()=>new Response(bytes,{headers:{"content-type":"image/svg+xml"}})});
    assert.equal((await resolver.read({contentVersion:"3.0.0",assetId:record.assetId})).ok,false);
  }
});

test("TC-S4-POUCH-002 verified images release on redraw/close and late results cannot repaint a closed modal", async () => {
  const snapshot=travel(FULL_PLAN,{stop:s=>s.currentNodeId==="node.act1.river-offer"}).snapshot;
  const pouch=projectKeepsakePouch({pouch:snapshot.pouch,loaded}),document=new FakeDocument();
  const releases=[],pending=[];
  const dialog=createKeepsakePouchDialog({document,viewModel:{pouch,revision:snapshot.revision,viewRevision:1},message:k=>TH_SYSTEM_MESSAGES[k],onIntent:()=>assert.fail("inspection must stay local"),
    loadImage:ref=>new Promise(resolve=>pending.push(()=>resolve({ok:true,value:{url:`blob:${ref.assetId}`,release:()=>releases.push(ref.assetId)}})))});
  await Promise.resolve(); assert.equal(pending.length,4);
  dialog.close(); pending.forEach(resolve=>resolve()); await new Promise(done=>setTimeout(done,0));
  assert.equal(releases.length,4); assert.equal(all(dialog.element,"src",`blob:${pouch.slots[0].image.assetId}`).length,0);
  const failed=createKeepsakePouchDialog({document,viewModel:{pouch,revision:1,viewRevision:1},message:k=>TH_SYSTEM_MESSAGES[k],onIntent:()=>{},loadImage:async()=>null});
  find(failed.element,"data-item-id",pouch.slots[0].id).dispatchEvent({type:"click"});
  await new Promise(done=>setTimeout(done,0));
  assert.match(failed.element.textContent,/ภาพยังไม่พร้อม/); assert.ok(failed.element.textContent.includes(pouch.slots[0].description)); failed.close();
});

test("TC-S4-VIS-001 crop metadata reaches presentation as bounded coordinates without changing story facts", () => {
  const snapshot=travel({}, {stop:s=>s.currentNodeId==="node.act1.home-focus"}).snapshot,before=structuredClone(snapshot);
  const view=projectContentPresentation({loaded,snapshot,facts:story.facts(snapshot),settings:current.gameDefaults.settings,mode:"game"});
  assert.deepEqual(view.visual.background.crop,{portrait:{x:53,y:50},landscape:{x:50,y:60}});
  assert.deepEqual(snapshot,before);
});
