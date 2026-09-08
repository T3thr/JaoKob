/** Dev-only Sprint 3 benchmark. Run with JKB_PLAYWRIGHT_PATH; no production hooks/dependencies. */
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { gzipSync } from "node:zlib";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { platform, release, cpus, totalmem } from "node:os";
import { walk, envelope, ROUTES } from "../helpers/act1-session.js";

const playwright = await import(process.env.JKB_PLAYWRIGHT_PATH ? pathToFileURL(process.env.JKB_PLAYWRIGHT_PATH).href : "playwright");
const repo = resolve(fileURLToPath(new URL("../..", import.meta.url)));
const output = resolve(repo, "tests/e2e/evidence/sprint-03/visual-novel");
await mkdir(output, { recursive: true });
const sha = (value) => createHash("sha256").update(value).digest("hex");
const git = (...args) => execFileSync("git", args, { cwd: repo, encoding: "utf8" }).trim();
const evidence = { at: new Date().toISOString(), commit: git("rev-parse", "HEAD"), trackedDiffAtStartSha256: sha(git("diff", "HEAD")), benchmarkHarnessSha256: sha(await readFile(fileURLToPath(import.meta.url))),
  environment: { os: `${platform()} ${release()}`, hostCpu: cpus()[0]?.model, logicalCores: cpus().length, totalMemoryBytes: totalmem(),
    mode: "headless Chromium; host metadata only, not an approved physical reference device", physicalDisplayRefreshHz: null, cpuEmulation: "none" },
  schemaVersion: "1.2.0", contentVersion: "2.1.0", packageSha256: sha(await readFile(resolve(repo, "src/data/content/packages/act-01.json"))),
  checks: [], screenshots: [], viewports: [], media: {}, errors: [], expectedFaults: [], performance: {},
  notRun: ["Physical 4-core/4GB mobile device and hardware refresh validation", "Real Safari/iOS and Firefox", "Human audio listening", "VoiceOver/NVDA", "PO art/crop acceptance", "400% native browser zoom (320 CSS-pixel equivalent reflow used)", "Long-task/paint/compositing trace and layout-shift instrumentation", "Audio-enabled frame/load timing (audio-enabled resource stability checked separately)"] };
const transfers = [];
const hostScript = `import {createGameApplication} from './src/bootstrap/index.js';
const root=document.getElementById('benchmark-root'), fault=new URL(location.href).searchParams.get('fault');
const samples=[], commits=[];let lastInput=null,pending=false;
root.addEventListener('click',e=>{if(e.target.closest('button'))lastInput={at:performance.now(),trusted:e.isTrusted};},true);
const set=Storage.prototype.setItem;
Storage.prototype.setItem=function(key,value){const out=set.call(this,key,value);if(key==='jaokob:save:canonical')commits.push({at:performance.now(),revision:JSON.parse(value).revision,input:lastInput});return out;};
new MutationObserver(()=>{if(root.getAttribute('aria-busy')==='false'&&commits.length&&!pending){pending=true;requestAnimationFrame(()=>{pending=false;for(const commit of commits.splice(0)){const now=performance.now();samples.push({revision:commit.revision,canonicalCommitToFrameCallbackMs:now-commit.at,inputToFrameCallbackMs:commit.input?now-commit.input.at:null,trusted:commit.input?.trusted??false});}});}}).observe(root,{attributes:true,childList:true,subtree:true});
const options={document,root,clock:()=> '2026-09-07T06:00:00.000Z',sessionIdFactory:()=> '123e4567-e89b-42d3-a456-426614174000'};
if(fault==='audio-unsupported')options.createAudioContext=()=>null;
if(fault==='audio-blocked'||fault==='audio-decode')options.createAudioContext=()=>{const c=new AudioContext();if(fault==='audio-blocked'){Object.defineProperty(c,'state',{get:()=> 'suspended'});c.resume=()=>Promise.reject(new Error('Injected blocked activation'));}else c.decodeAudioData=()=>Promise.reject(new Error('Injected decode failure'));return c;};
const app=createGameApplication(options);window.benchmark={app,samples};
window.render_game_to_text=()=>JSON.stringify({node:app.getSnapshot()?.currentNodeId,mode:app.getStatus().mode,choices:app.getViewModel()?.choices.map(c=>({id:c.id,label:c.label})),coordinateSystem:'semantic DOM, top-left origin, CSS pixels'});
await app.boot();window.benchmark.inputReadyMs=performance.now();performance.mark('benchmark-input-ready');`;
const mime = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".json": "application/json", ".webp": "image/webp", ".mp3": "audio/mpeg", ".woff2": "font/woff2" };
const server = createServer(async (request, response) => {
  try {
    let pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
    if (pathname.startsWith("/JaoKob/")) pathname = pathname.slice(7);
    if (pathname === "/benchmark-host.js") {
      response.writeHead(200, { "Content-Type": "text/javascript", "Cache-Control": "public,max-age=3600" }); response.end(hostScript); return;
    }
    const file = resolve(repo, `.${pathname.endsWith("/") ? `${pathname}index.html` : pathname}`);
    if (!file.startsWith(`${repo}${sep}`) || !["/index.html", "/src/", "/assets/"].some((prefix) => pathname.startsWith(prefix))) { response.writeHead(403).end(); return; }
    let body = await readFile(file);
    if (extname(file) === ".html") body = Buffer.from(body.toString().replace('id="app"', 'id="benchmark-root"').replace('./src/bootstrap/index.js', './benchmark-host.js'));
    const compressed = gzipSync(body), etag = `"${sha(body)}"`;
    transfers.push({ path: pathname, compressedBytes: compressed.length, rawBytes: body.length });
    if (request.headers["if-none-match"] === etag) { response.writeHead(304, { ETag: etag }); response.end(); return; }
    response.writeHead(200, { "Content-Type": mime[extname(file)] ?? "application/octet-stream", "Content-Encoding": "gzip", "Cache-Control": "public,max-age=3600", ETag: etag }); response.end(compressed);
  } catch { response.writeHead(404).end(); }
});
await new Promise((done) => server.listen(0, "127.0.0.1", done));
const origin = `http://127.0.0.1:${server.address().port}`;
const browser = await playwright.chromium.launch({ headless: process.env.JKB_HEADED !== "1" });
evidence.environment.browser = browser.version();
const choice = (page, id) => page.locator(`[data-choice-id="${id}"]`);
const snap = (page) => page.evaluate(() => benchmark.app.getSnapshot());
async function idle(page) { await page.waitForFunction(() => window.benchmark?.app.getStatus().booted && !benchmark.app.getStatus().busy); }
async function click(page, id) {
  await choice(page, id).click(); await idle(page);
  await page.evaluate(() => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done))));
}
async function context(viewport = { width: 1440, height: 900 }, fault = "") {
  const ctx = await browser.newContext({ viewport, reducedMotion: "reduce" });
  const page = await ctx.newPage();
  page.on("pageerror", (error) => evidence.errors.push({ fault, message: error.message }));
  page.on("console", (message) => { if (message.type() === "error") evidence.errors.push({ fault, message: message.text() }); });
  page.on("request", (request) => {
    if (!request.url().startsWith(origin) && !/^(data|blob):/.test(request.url())) evidence.errors.push({ fault, message: `external ${request.url()}` });
    if (/\/(docs|specs|tests)\//.test(request.url())) evidence.errors.push({ fault, message: `non-distributable ${request.url()}` });
  });
  if (fault === "image-hash") await page.route("**/assets/images/backgrounds/*.webp", async (route) => {
    const result = await route.fetch(), body = Buffer.from(await result.body()); body[body.length - 1] ^= 1;
    await route.fulfill({ response: result, body, headers: { ...result.headers(), "content-encoding": "identity" } });
  });
  return { ctx, page };
}
async function open(page, { subpath = false, fault = "" } = {}) {
  await page.goto(`${origin}${subpath ? "/JaoKob" : ""}/index.html${fault ? `?fault=${fault}` : ""}`);
  await idle(page);
}
async function screenshot(page, name) {
  await page.screenshot({ path: resolve(output, name), fullPage: true }); evidence.screenshots.push(name);
}
async function inspect(page) { return page.evaluate(() => benchmark.app.inspectMedia()); }
async function toDecision(page, { observations = ["lily", "roots", "shadows", "mother"] } = {}) {
  for (let guard = 0; guard < 70; guard++) {
    const state = await snap(page);
    if (state.currentNodeId === "node.act1.home-focus" && await choice(page, "choice.act1.focus-mother").count()) return;
    const id = await choice(page, "application.advance").count() ? "application.advance"
      : observations.length ? `interaction.act1.observe-${observations.shift()}` : "interaction.act1.join-family";
    await click(page, id);
  }
  assert.fail("Decision handoff not reached");
}
async function sound(page) {
  await click(page, "application.settings");
  for (const [setting, value] of [["musicVolume", .4], ["ambienceVolume", .4], ["effectsVolume", .4]]) {
    await page.evaluate(async ({ setting, value }) => {
      const result = await benchmark.app.dispatch({ type: "SETTINGS_CHANGED", setting, value }); if (!result.ok) throw new Error(result.error.code);
    }, { setting, value });
  }
  await click(page, "application.close-settings");
}
const percentile = (samples, p) => [...samples].sort((a, b) => a - b)[Math.max(0, Math.ceil(samples.length * p) - 1)];
const summary = (samples) => ({ count: samples.length, p50: percentile(samples, .5), p75: percentile(samples, .75), p95: percentile(samples, .95), max: Math.max(...samples) });
try {
  // Actual production stages and canonical decision cards at every approved viewport.
  for (const [width, height] of [[320,568],[390,844],[768,1024],[1440,900],[2560,1440],[844,390]]) {
    const { ctx, page } = await context({ width, height }); await open(page, { subpath: width === 2560 });
    await screenshot(page, `${width}x${height}-title.png`); await click(page, "application.new-game");
    await page.waitForFunction(() => document.querySelector('#stage-bg')?.dataset.mediaState === "ready" && document.querySelector('#stage-char')?.dataset.mediaState === "ready");
    await screenshot(page, `${width}x${height}-reading.png`);
    await toDecision(page);
    const labels = await page.locator('[data-choice-id^="choice.act1.focus-"] .jk-choice-label').allTextContents();
    const cards = await page.locator('[data-choice-id^="choice.act1.focus-"]').allTextContents();
    assert.equal(cards.length, 3); for (const text of ["ว่ายตามแม่กบ", "อยู่ฟังรากบัว", "ว่ายเล่นกับพี่น้อง"]) assert.ok(cards.some((card) => card.includes(text)));
    const layout = await page.evaluate(() => ({ width: innerWidth, scroll: document.documentElement.scrollWidth, dpr: devicePixelRatio,
      stageLayers: ["stage-bg","stage-char","stage-dialogue","stage-hud"].every((id) => document.getElementById(id)), font: getComputedStyle(document.querySelector('.jk-dialogue')).fontFamily }));
    assert.ok(layout.stageLayers); assert.ok(layout.scroll <= width, `${width} horizontal overflow`);
    evidence.viewports.push({ width, height, ...layout, decisionCardLabels: labels.length ? labels : cards });
    await screenshot(page, `${width}x${height}-decision.png`);
    if (width === 320 || width === 1440) {
      await page.evaluate(() => { document.documentElement.style.fontSize = "200%"; });
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      await screenshot(page, `${width}x${height}-text200.png`);
    }
    await click(page, "choice.act1.focus-mother"); assert.equal((await snap(page)).currentNodeId, "node.act1.home-reflection");
    await screenshot(page, `${width}x${height}-reflection.png`); await ctx.close();
    console.log(`PASS viewport ${width}x${height}`);
  }
  evidence.checks.push("Six viewport sizes including landscape and subpath; actual WebP readiness; eight benchmark media nodes and three canonical decision cards; 200% text and 320 CSS px reflow (400% equivalent)");

  // Twenty repeated observation boundaries, real audio, and failure-independent progression.
  {
    const { ctx, page } = await context(); await open(page); await sound(page); await click(page, "application.new-game");
    while ((await snap(page)).currentNodeId !== "node.act1.nursery" || !await choice(page, "interaction.act1.observe-lily").count()) await click(page, "application.advance");
    await page.waitForFunction(() => benchmark.app.inspectMedia().audio.voices.music === 1 && benchmark.app.inspectMedia().audio.voices.ambience === 1);
    await screenshot(page, "exploration-four-observations-audio.png");
    const samples = [];
    for (let boundary = 0; boundary < 20; boundary++) {
      await click(page, "interaction.act1.observe-lily");
      while ((await snap(page)).currentNodeId !== "node.act1.nursery" || !await choice(page, "interaction.act1.observe-lily").count()) await click(page, "application.advance");
      samples.push(await inspect(page));
    }
    assert.ok(samples.every((sample) => sample.images.bytes <= 32*1024*1024 && sample.audio.decodedBytes + sample.audio.reservedBytes <= 16*1024*1024
      && sample.audio.voices.music <= 2 && sample.audio.voices.ambience <= 2 && sample.queue.active <= 2));
    evidence.media.repeatedBoundaries = samples;
    assert.equal((await snap(page)).flags.find((flag) => flag.id === "exploration.safe_observations").value, 1);
    evidence.checks.push("20 repeated observation boundaries: no effect replay; bounded image/PCM/cache/voice/queue counts with real AudioContext and decoded MP3");
    await ctx.close();
  }
  for (const fault of ["image-hash", "audio-unsupported", "audio-blocked", "audio-decode"]) {
    const { ctx, page } = await context(undefined, fault); await open(page, { fault }); await sound(page); await click(page, "application.new-game");
    if (fault === "image-hash") await page.waitForFunction(() => document.querySelector('#stage-bg')?.dataset.mediaState === 'unavailable');
    else await page.waitForFunction(() => benchmark.app.inspectMedia().audio.status !== "ready");
    await toDecision(page, { observations: [] }); await click(page, "choice.act1.focus-roots");
    assert.equal((await snap(page)).currentNodeId, "node.act1.home-reflection");
    assert.equal(await page.evaluate(() => benchmark.app.getStatus().fatal), false);
    evidence.expectedFaults.push({ fault, media: await inspect(page), playable: true });
    await screenshot(page, `${fault}-reflection.png`); await ctx.close();
    console.log(`PASS fault ${fault}`);
  }
  {
    const { ctx, page } = await context(); const saved = { ...envelope(walk()[2]), contentVersion: "2.0.0" }, raw = JSON.stringify(saved);
    await ctx.addInitScript((raw) => { if (!localStorage.getItem('jaokob:save:canonical')) localStorage.setItem('jaokob:save:canonical',raw); }, raw);
    await open(page); await click(page, "application.resume");
    assert.deepEqual((await snap(page)).progress, saved.payload.progress);
    assert.equal(await page.evaluate(() => localStorage.getItem('jaokob:save:canonical')), raw);
    await click(page, "application.advance"); const current = await snap(page);
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('jaokob:save:canonical')).contentVersion), "2.1.0");
    assert.equal(await page.evaluate(() => localStorage.getItem('jaokob:save:backup')), raw);
    await page.reload(); await idle(page); await click(page, "application.resume"); assert.deepEqual(await snap(page), current);
    evidence.checks.push("Actual browser 2.0 save read-only migration, next-action 2.1 write retaining backup, exact reload/Resume"); await ctx.close();
  }

  // Browser event/storage/MutationObserver/rAF instrumentation, never driver elapsed time.
  const interactionRuns = [];
  for (let run = 0; run < 5; run++) {
    const { ctx, page } = await context({ width: 390, height: 844 }); await open(page); await click(page, "application.new-game");
    const observations = ["lily","roots","shadows","mother"], route = ROUTES[run];
    for (let steps = 0; !await choice(page, "application.finish").count(); steps++) {
      assert.ok(steps < 100); const node = (await snap(page)).currentNodeId;
      const id = await choice(page, "application.advance").count() ? "application.advance"
        : node === "node.act1.nursery" ? observations.length ? `interaction.act1.observe-${observations.shift()}` : "interaction.act1.join-family"
        : node === "node.act1.home-focus" ? `choice.act1.focus-${route.home}`
        : node === "node.act1.survival" ? `choice.act1.${route.coping}`
        : node === "node.act1.lily-fragment" ? "interaction.act1.inspect-fragment" : `choice.act1.${route.keepsake}`;
      await click(page, id); if (await choice(page, "application.confirm-choice").count()) await click(page, "application.confirm-choice");
    }
    interactionRuns.push(await page.evaluate(() => benchmark.samples)); await ctx.close();
  }
  const interactions = interactionRuns.flat().filter((sample) => sample.trusted && sample.inputToFrameCallbackMs !== null);
  assert.ok(interactions.length >= 100);
  evidence.performance.interactions = { runCount: 5, rawRuns: interactionRuns, acceptedTrustedCount: interactions.length,
    metric: "trusted DOM click and canonical LocalStorage commit to next rAF callback after DOM mutation; callback is pre-paint; neither paint completion nor internal Core commit instrumented",
    inputToFrameCallback: summary(interactions.map((sample) => sample.inputToFrameCallbackMs)), canonicalCommitToFrameCallback: summary(interactions.map((sample) => sample.canonicalCommitToFrameCallbackMs)) };
  console.log(`PASS ${interactions.length} accepted browser interaction samples across 5 runs`);

  const loads = { cold: [], warm: [], shaping: { downloadBitsPerSecond: 1600000, uploadBitsPerSecond: 750000, latencyMs: 150,
    protocol: "CDP Network.emulateNetworkConditions; bytes/sec = bits/sec / 8; no CPU throttle; supplementary headless" } };
  async function shape(ctx, page) {
    const cdp = await ctx.newCDPSession(page); await cdp.send('Network.enable');
    await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: 200000, uploadThroughput: 93750, connectionType: "cellular3g" });
    return cdp;
  }
  async function loadSample(page) { return page.evaluate(() => ({ inputReadyMs: benchmark.inputReadyMs,
    navigation: performance.getEntriesByType('navigation').map(e=>({duration:e.duration,transferSize:e.transferSize,encodedBodySize:e.encodedBodySize}))[0],
    resources: performance.getEntriesByType('resource').map(e=>({name:new URL(e.name).pathname,transferSize:e.transferSize,encodedBodySize:e.encodedBodySize,decodedBodySize:e.decodedBodySize})) })); }
  for (let run=0;run<20;run++) {
    const {ctx,page}=await context({width:390,height:844}); const cdp=await shape(ctx,page);
    await cdp.send('Network.setCacheDisabled',{cacheDisabled:true}); await cdp.send('Network.clearBrowserCache');
    await open(page); loads.cold.push(await loadSample(page)); await ctx.close();
    if((run+1)%5===0)console.log(`PERF ${run+1}/20 cold loads`);
  }
  {
    const {ctx,page}=await context({width:390,height:844}); const cdp=await shape(ctx,page); await cdp.send('Network.setCacheDisabled',{cacheDisabled:false});
    await open(page);
    for(let run=0;run<20;run++){await page.reload();await idle(page);loads.warm.push(await loadSample(page));}
    await ctx.close();
  }
  loads.coldSummary=summary(loads.cold.map(sample=>sample.inputReadyMs));loads.warmSummary=summary(loads.warm.map(sample=>sample.inputReadyMs));
  loads.warmObservedCachedResources=loads.warm.map(sample=>sample.resources.filter(resource=>resource.transferSize===0&&resource.decodedBodySize>0).length);
  loads.budgetObserved={coldP75AtMost3000:loads.coldSummary.p75<=3000,warmP75AtMost1500:loads.warmSummary.p75<=1500}; evidence.performance.loads=loads;
  console.log(`PERF loads coldp75=${loads.coldSummary.p75.toFixed(1)}ms warmp75=${loads.warmSummary.p75.toFixed(1)}ms`);

  // Three independent 30 s intervals; measured headless rAF, not a display FPS claim.
  evidence.performance.frames=[];
  for(const mode of ['reading','transition','decision']){
    const {ctx,page}=await context(); await open(page); await click(page,'application.new-game');
    if(mode==='decision')await toDecision(page,{observations:[]});
    if(mode==='transition')while((await snap(page)).currentNodeId!=='node.act1.nursery'||!await choice(page,'interaction.act1.observe-lily').count())await click(page,'application.advance');
    await page.emulateMedia({reducedMotion:'no-preference'});
    const frames=await page.evaluate(async(mode)=>{
      const intervals=[];let previous=null,done=false;
      const start=performance.now();
      const animate=(now)=>{if(previous!==null)intervals.push(now-previous);previous=now;if(now-start<30000)requestAnimationFrame(animate);else done=true;};requestAnimationFrame(animate);
      const timer=mode==='transition'?setInterval(()=>{if(!benchmark.app.getStatus().busy){const choices=benchmark.app.getViewModel().choices;const id=choices.some(c=>c.id==='application.advance')?'application.advance':'interaction.act1.observe-lily';document.querySelector('[data-choice-id="'+id+'"]')?.click();}},500):null;
      while(!done)await new Promise(resolve=>setTimeout(resolve,100));if(timer)clearInterval(timer);return{mode,intervals,durationMs:performance.now()-start};
    },mode);
    evidence.performance.frames.push({...frames,summary:summary(frames.intervals),frameIntervalOver20msRate:frames.intervals.filter(ms=>ms>20).length/frames.intervals.length});
    await screenshot(page,`frame-capture-${mode}.png`);await ctx.close();console.log(`PERF 30s ${mode} frame capture complete`);
  }
  evidence.performance.interactions.budgetObserved={inputP95AtMost100: evidence.performance.interactions.inputToFrameCallback.p95<=100,canonicalCommitP95AtMost100:evidence.performance.interactions.canonicalCommitToFrameCallback.p95<=100};
  evidence.performance.loads.criticalTransferSamples=transfers.filter(item=>/\.(js|css|json|html)$/.test(item.path));
  assert.deepEqual(evidence.errors,[]);evidence.result='functional automated benchmark passed; performance reports observed budgets; physical/manual gates remain open';
} catch(error){evidence.failure={message:error.message,stack:error.stack};process.exitCode=1;console.error(error);}
finally{
  await writeFile(resolve(output,'benchmark-evidence.json'),JSON.stringify(evidence,null,2)+'\n');
  await browser.close();await new Promise(done=>server.close(done));
}
