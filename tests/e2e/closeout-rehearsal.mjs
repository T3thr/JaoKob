/** Allowlisted artifacts, rollback safety and measured current production ports.
 * Diagnostic code is served by this runner only; it is absent from artifacts. */
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile, mkdir } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
import { pathToFileURL } from "node:url";
import { gzipSync } from "node:zlib";
import { createHash } from "node:crypto";
import { platform, release, cpus, totalmem } from "node:os";
import { travel, FULL_PLAN, save2 } from "../helpers/narrative-session.js";
import { walk, envelope } from "../helpers/act1-session.js";
import { writeCloseoutEvidence } from "../helpers/closeout-evidence.js";

const output = resolve(process.env.JKB_EVIDENCE_DIR ?? "tests/e2e/evidence/sprint-04/slice-05/final");
await mkdir(output, { recursive: true });
assert.ok(process.env.JKB_ARTIFACT_DIR && process.env.JKB_ROLLBACK_DIR);
const currentRoot = resolve(process.env.JKB_ARTIFACT_DIR), rollbackRoot = resolve(process.env.JKB_ROLLBACK_DIR);
const playwright = await import(pathToFileURL(process.env.JKB_PLAYWRIGHT_PATH).href);
const key = "jaokob:save:canonical";
const full = save2(travel(FULL_PLAN, { stop:s=>s.currentNodeId === "node.act1.river-offer" }).snapshot);
const old = envelope(walk().find(s=>s.currentNodeId === "node.act1.storm"));
const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const host = `import {createGameApplication} from './src/bootstrap/index.js';
const root=document.querySelector('#probe-root'),samples=[],commits=[],shifts=[];let input=null,pending=false;
root.addEventListener('click',e=>{if(e.target.closest('button'))input={at:performance.now(),trusted:e.isTrusted};},true);
const set=Storage.prototype.setItem;Storage.prototype.setItem=function(key,value){const out=set.call(this,key,value);if(key==='jaokob:save:canonical')commits.push({at:performance.now(),revision:JSON.parse(value).revision});return out;};
new MutationObserver(()=>{if(input&&!pending&&root.getAttribute('aria-busy')==='false'){pending=true;requestAnimationFrame(()=>{pending=false;if(input){samples.push({inputToFrameCallbackMs:performance.now()-input.at,trusted:input.trusted});input=null;}});}}).observe(root,{attributes:true,childList:true,subtree:true});
new PerformanceObserver(l=>shifts.push(...l.getEntries().filter(e=>!e.hadRecentInput).map(e=>e.value))).observe({type:'layout-shift',buffered:true});
const app=createGameApplication({document,root,applicationBaseUrl:new URL('./',location.href).href});window.probe={app,samples,commits,shifts};
await app.boot();probe.inputReadyMs=performance.now();`;
const mime = { ".html":"text/html", ".js":"text/javascript", ".json":"application/json", ".css":"text/css", ".webp":"image/webp", ".svg":"image/svg+xml", ".mp3":"audio/mpeg", ".woff2":"font/woff2" };
const transfers = [];
const server = createServer(async(req,res)=>{
  try {
    let path = decodeURIComponent(new URL(req.url,"http://localhost").pathname), root=currentRoot;
    if (path.startsWith("/rollback/")) { root=rollbackRoot; path=path.slice(9); }
    if (path.startsWith("/JaoKob/")) path=path.slice(7);
    let body, type;
    if(path === "/__probe-host.js") { body=Buffer.from(host);type="text/javascript"; }
    else {
      const probe=path === "/__probe";if(probe)path="/index.html";
      const file=resolve(root,`.${path.endsWith('/')?path+'index.html':path}`);
      if(!file.startsWith(root+sep)){res.writeHead(403).end();return;}
      body=await readFile(file);type=mime[extname(file)]??"text/plain";
      if(probe)body=Buffer.from(body.toString().replace('id="app"','id="probe-root"').replace('./src/bootstrap/index.js','./__probe-host.js'));
    }
    const compressed=gzipSync(body),etag='"'+sha(body)+'"';
    transfers.push({path,bytes:compressed.length,rawBytes:body.length});
    if(req.headers['if-none-match']===etag){res.writeHead(304,{ETag:etag}).end();return;}
    res.writeHead(200,{"Content-Type":type,"Content-Encoding":"gzip","Cache-Control":"public,max-age=3600",ETag:etag}).end(compressed);
  }catch{res.writeHead(404).end();}
});
await new Promise(done=>server.listen(0,"127.0.0.1",done));
const origin=`http://127.0.0.1:${server.address().port}`;
const browser=await playwright.chromium.launch({headless:true});
const evidence={at:new Date().toISOString(),browser:browser.version(),environment:{os:platform()+" "+release(),cpu:cpus()[0]?.model,logicalCores:cpus().length,totalMemory:totalmem(),physicalDevice:false},checks:[],captures:[],errors:[],performance:{}};
const control=(page,id)=>page.locator(`[data-choice-id="${id}"]:visible`);
async function context(seed,viewport={width:390,height:844},extra={}) {
  const ctx=await browser.newContext({viewport,reducedMotion:"reduce",...extra}),page=await ctx.newPage();
  page.on('pageerror',e=>evidence.errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error')evidence.errors.push(m.text());});
  page.on('request',r=>{if(!/^(?:data|blob):/.test(r.url())&&!r.url().startsWith(origin+'/'))evidence.errors.push('external:'+r.url());});
  if(seed)await ctx.addInitScript(({key,raw})=>{if(!localStorage.getItem(key))localStorage.setItem(key,raw);},{key,raw:typeof seed==='string'?seed:JSON.stringify(seed)});
  return {ctx,page};
}
async function ready(page) { await page.waitForFunction(()=>window.probe?.app.getStatus().booted&&!probe.app.getStatus().busy); }
async function tap(page,id) {
  await control(page,id).click();
  if(await page.locator('#probe-root').count())await ready(page);
  else await page.waitForFunction(()=>document.querySelector('#app')?.getAttribute('aria-busy')==='false');
  await page.evaluate(()=>new Promise(done=>requestAnimationFrame(()=>requestAnimationFrame(done))));
}
async function open(page,prefix="",probe=true) { await page.goto(origin+prefix+(probe?'/__probe':'/index.html'));if(probe)await ready(page);else await control(page,'application.new-game').waitFor(); }
async function capture(page,name){await page.screenshot({path:resolve(output,name),fullPage:true});evidence.captures.push(name);}
const raw=page=>page.evaluate(key=>localStorage.getItem(key),key);
const summary=values=>{const a=[...values].sort((a,b)=>a-b),p=n=>a[Math.max(0,Math.ceil(a.length*n)-1)];return{count:a.length,p50:p(.5),p75:p(.75),p95:p(.95),max:a.at(-1)};};
async function shape(ctx,page){const cdp=await ctx.newCDPSession(page);await cdp.send('Network.enable');await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:150,downloadThroughput:200000,uploadThroughput:93750,connectionType:'cellular3g'});await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});return cdp;}
try {
  for(const prefix of ['', '/JaoKob']){
    const {ctx,page}=await context();await open(page,prefix,false);await tap(page,'application.new-game');
    assert.equal(JSON.parse(await raw(page)).contentVersion,'3.0.0');
    await page.reload();await control(page,'application.resume').waitFor();await tap(page,'application.resume');
    assert.equal(JSON.parse(await raw(page)).contentVersion,'3.0.0');
    await capture(page,prefix?'artifact-subpath.png':'artifact-root.png');await ctx.close();
  }
  for(const prefix of ['', '/rollback']){
    const {ctx,page}=await context(old);await open(page,prefix,false);const before=await raw(page);await tap(page,'application.resume');
    assert.equal(await raw(page),before);await tap(page,'application.advance');
    assert.equal(JSON.parse(await raw(page)).contentVersion,'2.1.0');await ctx.close();
  }
  {
    const {ctx,page}=await context(full);await open(page,'/rollback',false);const before=await raw(page);
    assert.equal(await control(page,'application.resume').count(),0);
    await tap(page,'application.new-game');await tap(page,'application.cancel-replace');assert.equal(await raw(page),before);
    await capture(page,'rollback-protected-content3.png');await ctx.close();
  }
  evidence.checks.push('actual staged index: root/subpath content3 New Game/reload; current and rollback archived2.1 exact read-only Resume; rollback3 raw preservation/cancel');
  {
    const {ctx,page}=await context(envelope(walk().at(-1)));
    await page.route('**/provenance/benchmark-assets.json',r=>r.fulfill({status:200,contentType:'application/json',body:'{"registryVersion":999}'}));
    await open(page);await tap(page,'application.resume');
    await page.waitForFunction(()=>probe.app.getViewModel().mediaStatus==='unavailable');
    await tap(page,'application.finish');
    await page.waitForFunction(()=>probe.app.getViewModel().mediaStatus==='ready');
    await tap(page,'application.new-game');await tap(page,'application.confirm-replace');
    assert.equal(JSON.parse(await raw(page)).contentVersion,'3.0.0');
    assert.equal(await page.evaluate(()=>probe.app.getViewModel().mediaStatusText),'');
    await capture(page,'legacy-media-failure-new-game-ready.png');
    evidence.checks.push('failed archived registry cannot leave a stale media warning on a successfully initialized current New Game');
    await ctx.close();
  }
  // The artifact server has only the reviewed allowlist; private/reference/3D paths cannot resolve.
  for(const path of ['/docs/README.md','/specs/schemas/save-state.schema.json','/tests/helpers/narrative-session.js','/.git/config','/docs/references/private.png','/assets/models/jaokob.glb'])assert.equal((await fetch(origin+path)).status,404);
  {
    const {ctx,page}=await context(full);await open(page);await tap(page,'application.resume');const before=await raw(page);
    await tap(page,'application.pouch');
    const items=['item_leaf','item_dew_stone','item_lotus_shell','item_rain_petal'];
    for(const item of items){
      await page.locator(`[data-item-id="${item}"], [data-memory-id="${item}"]`).click();
      const img=page.locator('[data-jk-role="pouch-detail"] img[src^="blob:"]');await img.waitFor();
      assert.ok(await img.evaluate(i=>i.complete&&i.naturalWidth>0));
      assert.ok((await img.getAttribute('alt')).length>0);
      await capture(page,`item-${item}.png`);
    }
    await page.keyboard.press('Escape');assert.equal(await raw(page),before);
    // The fifth object's detail remains private until the authored action
    // records it. No save fixture invents an encounter just to display art.
    while(await page.locator('#probe-root').getAttribute('data-reading-more')==='true')await tap(page,'application.advance');
    await tap(page,'choice.act1.exchange-leaf');await tap(page,'application.confirm-choice');
    await tap(page,'application.pouch');await page.locator('[data-item-id="item_river_shell"]').click();
    await page.locator('[data-jk-role="pouch-detail"] img[src^="blob:"]').waitFor();
    await capture(page,'item-item_river_shell.png');
    assert.ok((await page.evaluate(()=>probe.app.inspectMedia())).images.bytes<=32*1024*1024);
    await ctx.close();
  }
  {
    const {ctx,page}=await context(full);
    // Successful HTTP response with invalid bytes exercises integrity failure,
    // without hiding unrelated console errors behind a broad suppression.
    await page.route('**/assets/images/keepsakes/*.svg',r=>r.fulfill({status:200,contentType:'image/svg+xml',body:'<svg/>'}));
    await open(page);await tap(page,'application.resume');const before=await raw(page);await tap(page,'application.pouch');
    await page.locator('[data-item-id="item_leaf"]').click();
    const fallback=page.locator('[data-jk-role="pouch-detail"] .jk-pouch-image-fallback');await fallback.waitFor();
    assert.match(await page.locator('[data-jk-role="pouch-detail"]').innerText(),/ใบบัว|แม่/);
    assert.equal(await page.locator('[data-jk-role="pouch-detail"] .jk-pouch-art').evaluate(e=>e.getBoundingClientRect().height),128);
    assert.equal(await raw(page),before);await capture(page,'image-integrity-fallback.png');await ctx.close();
  }
  {
    const {ctx,page}=await context();await page.route('**/presentation/act-01-3.0.0.json',r=>r.fulfill({status:200,contentType:'application/json',body:'{"invalid":true}'}));
    await open(page);await tap(page,'application.new-game');assert.equal(await page.evaluate(()=>probe.app.getStatus().presentationStatus),'unavailable');
    assert.equal(JSON.parse(await raw(page)).contentVersion,'3.0.0');await capture(page,'catalog-failure-playable.png');await ctx.close();
  }
  evidence.checks.push('all five encountered original images decode with Thai alt; no inspection writes; fixed128px integrity fallback; invalid optional catalog remains playable; excluded files404');
  {
    const nursery=save2(travel({}, {stop:s=>s.currentNodeId==='node.act1.nursery'}).snapshot);
    const {ctx,page}=await context(nursery,{width:390,height:844},{hasTouch:true,isMobile:true,deviceScaleFactor:2});
    await open(page,'/JaoKob');await control(page,'application.resume').tap();await ready(page);
    await control(page,'application.settings').tap();await ready(page);
    for(const setting of ['musicVolume','ambienceVolume','effectsVolume'])assert.equal(await page.evaluate(async setting=>(await probe.app.dispatch({type:'SETTINGS_CHANGED',setting,value:.3})).ok,setting),true);
    await control(page,'application.close-settings').tap();await ready(page);
    await page.waitForFunction(()=>{const a=probe.app.inspectMedia().audio;return a?.contextState==='running'&&a.voices.music===1&&a.voices.ambience===1;});
    const before=await raw(page),audio=await page.evaluate(()=>probe.app.inspectMedia().audio);
    await control(page,'application.pouch').tap();await ready(page);await capture(page,'touch-audio-pouch.png');
    await control(page,'application.close-pouch').tap();await ready(page);
    await control(page,'application.history').tap();await ready(page);await capture(page,'touch-audio-history.png');
    await control(page,'application.close-history').tap();await ready(page);
    const after=await page.evaluate(()=>probe.app.inspectMedia().audio);
    assert.deepEqual(after.voices,audio.voices);assert.deepEqual(after.desired,audio.desired);assert.equal(after.contextState,'running');
    assert.ok(after.decodedBytes+after.reservedBytes<=16*1024*1024);assert.equal(await raw(page),before);
    evidence.audio={before:audio,after,touchEmulation:true,subpath:true,humanListening:false};
    evidence.checks.push('actual emulated touch Resume/Settings/Pouch/History/close; trusted WebAudio activation, one music/ambience loop, unchanged desires/voices/raw save and16MiB bound');
    await ctx.close();
  }
  const interactionRuns=[];
  for(let run=0;run<5;run++){
    const {ctx,page}=await context(full);await open(page);await tap(page,'application.resume');const before=await raw(page);
    await page.evaluate(()=>{probe.samples.length=0;probe.commits.length=0;});
    for(let i=0;i<10;i++){
      await tap(page,'application.pouch');await page.locator('[data-item-id="item_rain_petal"]').click();
      await page.evaluate(()=>new Promise(done=>requestAnimationFrame(()=>requestAnimationFrame(done))));
      await tap(page,'application.close-pouch');
    }
    assert.equal(await raw(page),before);
    interactionRuns.push(await page.evaluate(()=>({samples:probe.samples,commits:probe.commits,shifts:probe.shifts,media:probe.app.inspectMedia()})));
    await ctx.close();
  }
  const samples=interactionRuns.flatMap(r=>r.samples).filter(s=>s.trusted).map(s=>s.inputToFrameCallbackMs);
  assert.ok(samples.length>=100);
  evidence.performance.interactions={method:'Trusted DOM clicks to next requestAnimationFrame after rendered DOM, full Pouch/detail/close,5 runs; pre-paint callback, not physical painted-frame timing.',rawRuns:interactionRuns,inputToFrameCallback:summary(samples),budgetObserved:summary(samples).p95<=100};
  const loads={cold:[],warm:[],profile:{latencyMs:150,downloadBytesPerSecond:200000,uploadBytesPerSecond:93750,cpuSlowdown:4,device:'headless Chromium CDP emulation; no physical-device certification'}};
  const loadSample=page=>page.evaluate(()=>({inputReadyMs:probe.inputReadyMs,resources:performance.getEntriesByType('resource').map(e=>({name:new URL(e.name).pathname,transferSize:e.transferSize,encodedBodySize:e.encodedBodySize,decodedBodySize:e.decodedBodySize}))}));
  for(let i=0;i<20;i++){
    const {ctx,page}=await context();const cdp=await shape(ctx,page);await cdp.send('Network.setCacheDisabled',{cacheDisabled:true});await cdp.send('Network.clearBrowserCache');
    await open(page);loads.cold.push(await loadSample(page));await ctx.close();if((i+1)%5===0)console.log(`LOAD cold ${i+1}/20`);
  }
  {
    const {ctx,page}=await context();await shape(ctx,page);await open(page);
    for(let i=0;i<20;i++){await page.reload();await ready(page);loads.warm.push(await loadSample(page));}
    await ctx.close();
  }
  loads.coldSummary=summary(loads.cold.map(s=>s.inputReadyMs));loads.warmSummary=summary(loads.warm.map(s=>s.inputReadyMs));
  loads.budgetObserved={coldP75AtMost3000:loads.coldSummary.p75<=3000,warmP75AtMost1500:loads.warmSummary.p75<=1500};
  loads.warmCacheHits=loads.warm.map(s=>s.resources.filter(r=>r.transferSize===0&&r.decodedBodySize>0).length);
  evidence.performance.loads=loads;console.log(JSON.stringify({cold:loads.coldSummary,warm:loads.warmSummary}));
  evidence.performance.frames=[];
  for(const mode of ['reading','pouch','transition']){
    const {ctx,page}=await context(full);await shape(ctx,page);await open(page);await tap(page,'application.resume');
    if(mode==='pouch')await tap(page,'application.pouch');
    await page.emulateMedia({reducedMotion:'no-preference'});
    const frames=await page.evaluate(async mode=>{
      const intervals=[];let previous=null,done=false;const start=performance.now();
      const frame=t=>{if(previous!==null)intervals.push(t-previous);previous=t;if(t-start<30000)requestAnimationFrame(frame);else done=true;};requestAnimationFrame(frame);
      const timer=mode==='transition'?setInterval(()=>{if(!probe.app.getStatus().busy){const id=probe.app.getStatus().mode==='pouch'?'application.close-pouch':'application.pouch';document.querySelector('[data-choice-id="'+id+'"]')?.click();}},500):null;
      while(!done)await new Promise(done=>setTimeout(done,100));if(timer)clearInterval(timer);return{mode,durationMs:performance.now()-start,intervals};
    },mode);
    evidence.performance.frames.push({...frames,summary:summary(frames.intervals),over20msRate:frames.intervals.filter(n=>n>20).length/frames.intervals.length});
    await capture(page,`frames-${mode}.png`);await ctx.close();console.log(`FRAMES ${mode} 30s`);
  }
  const initial=loads.cold[0].resources;
  evidence.performance.transfer={criticalEncodedBytes:initial.filter(r=>/\.(?:js|css|json)$/.test(r.name)).reduce((a,b)=>a+b.encodedBodySize,0),initialEncodedBytes:initial.reduce((a,b)=>a+b.encodedBodySize,0),fullSaveBytes:Buffer.byteLength(JSON.stringify(full)),method:'Resource Timing encodedBodySize includes gzip HTTP responses; initial Title with default muted audio; HTML diagnostic host measured separately.'};
  assert.ok(evidence.performance.transfer.criticalEncodedBytes<=500000);assert.ok(evidence.performance.transfer.initialEncodedBytes<=2000000);assert.ok(evidence.performance.transfer.fullSaveBytes<=250000);
  assert.ok(loads.budgetObserved.coldP75AtMost3000,'Fast3G/CPU4x cold p75 must be <=3000ms');
  assert.ok(loads.budgetObserved.warmP75AtMost1500,'Fast3G/CPU4x warm p75 must be <=1500ms');
  assert.ok(evidence.performance.interactions.budgetObserved,'Trusted input/render/rAF p95 must be <=100ms');
  assert.deepEqual(evidence.errors,[]);evidence.result='PASS';
  evidence.limits=['Chromium emulation and pre-paint rAF, no physical FPS claim','Human Thai/art/audio/AT and Safari/iOS/Firefox acceptance remain open','No deployment or merge performed'];
}catch(error){evidence.result='FAIL';evidence.failure=error.stack;process.exitCode=1;console.error(error);}
finally{await writeCloseoutEvidence(output,'closeout-rehearsal.json',evidence);await browser.close();await new Promise(done=>server.close(done));}
console.log(JSON.stringify({result:evidence.result,checks:evidence.checks.length,captures:evidence.captures.length}));
