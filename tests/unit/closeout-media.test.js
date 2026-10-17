import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createMediaComposition } from "../../src/bootstrap/media-composition.js";
import { loadGameContent } from "../../src/data/content/content-runtime.js";
import { current, legacy, registry } from "../helpers/closeout-session.js";
import { candidateTestIds } from "../helpers/narrative-session.js";

const modern = await loadGameContent({ content: current, testReferenceIds: candidateTestIds });
const archive = await loadGameContent({ content: legacy, testReferenceIds: candidateTestIds });
const oldRegistry = JSON.parse(readFileSync(new URL("../../assets/provenance/benchmark-assets.json",import.meta.url)));
function cachePort() {
  const acquired=[];let disposed=0;
  const cache={acquire:async ref=>{acquired.push(ref);return{url:`blob:${ref.contentVersion}`,release(){}};},stats:()=>({budget:32*1024*1024}),dispose(){disposed++;}};
  return {cache,acquired,get disposed(){return disposed;}};
}
test("TC-S4-ASSET-001 switching current/archive media retains one cache and version-specific image leases",async()=>{
  const port=cachePort(),media=createMediaComposition({mediaEnabled:true,imageCache:port.cache,
    applicationBaseUrl:"https://game.test/JaoKob/",assetRegistries:{"3.0.0":registry,"2.1.0":oldRegistry}});
  await media.initialize(modern);const first=await media.loadImage({contentVersion:"3.0.0",assetId:"asset.image.keepsake-dew-stone"});
  await media.initialize(archive);const second=await media.loadImage({contentVersion:"2.1.0",assetId:"asset.image.jaokob-tadpole-neutral"});
  await media.initialize(modern);const third=await media.loadImage({contentVersion:"3.0.0",assetId:"asset.image.keepsake-river-shell"});
  assert.deepEqual([first.value.url,second.value.url,third.value.url],["blob:3.0.0","blob:2.1.0","blob:3.0.0"]);
  assert.deepEqual(port.acquired.map(r=>r.contentVersion),["3.0.0","2.1.0","3.0.0"]);
  assert.equal(media.inspect().images.budget,32*1024*1024);media.dispose();assert.equal(port.disposed,1);
});
test("TC-S4-ASSET-001 late failed archived registry cannot change the ready current media session",async()=>{
  let releaseOld;const port=cachePort(),changes=[];
  const media=createMediaComposition({mediaEnabled:true,imageCache:port.cache,applicationBaseUrl:"https://game.test/JaoKob/",
    assetRegistries:{"3.0.0":registry},fetch:async()=>new Promise(resolve=>{releaseOld=()=>resolve(new Response('{"registryVersion":999}',{headers:{"content-type":"application/json"}}));})},kind=>changes.push(kind));
  const pending=media.initialize(archive);await media.initialize(modern);releaseOld();await pending;
  assert.equal(media.status().mediaStatus,"ready");assert.deepEqual(changes,[]);
  assert.equal((await media.loadImage({contentVersion:"3.0.0",assetId:"asset.image.keepsake-dew-stone"})).ok,true);
  media.dispose();
});
test("TC-S4-ASSET-001 a failed archived media session leaves no stale warning after successful current initialization",async()=>{
  const port=cachePort(),media=createMediaComposition({mediaEnabled:true,imageCache:port.cache,applicationBaseUrl:"https://game.test/JaoKob/",
    assetRegistries:{"3.0.0":registry,"2.1.0":{registryVersion:999}}});
  await media.initialize(archive);assert.equal(media.status().mediaStatus,"unavailable");
  await media.initialize(modern);assert.equal(media.status().mediaStatus,"ready");
  assert.equal((await media.loadImage({contentVersion:"3.0.0",assetId:"asset.image.keepsake-dew-stone"})).ok,true);
  media.dispose();
});
