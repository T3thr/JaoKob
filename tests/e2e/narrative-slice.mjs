/** Slice4 candidate through real composition/storage/DOM. Diagnostics are served
 * only by this test fixture; the normal production entry remains archived2.1. */
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { gzipSync } from "node:zlib";
import { createHash } from "node:crypto";
import { candidate, candidateTestIds, travel, FULL_PLAN, save2, narrativeAction, story } from "../helpers/narrative-session.js";

const root = resolve(fileURLToPath(new URL("../..", import.meta.url)));
const output = resolve(root, process.env.JKB_EVIDENCE_DIR ?? "tests/e2e/evidence/sprint-04/slice-04");
await mkdir(output, { recursive: true });
const playwright = await import(process.env.JKB_PLAYWRIGHT_PATH ? pathToFileURL(process.env.JKB_PLAYWRIGHT_PATH).href : "playwright");
const snapshotAt = (key, plan = {}) => travel(plan, { stop: s => s.currentNodeId === `node.act1.${key}` }).snapshot;
const released = travel({ ...FULL_PLAN, fifth: "collect" }, { release: candidate.keepsakes.map(i => i.id) });
const seeds = {
  full: snapshotAt("river-offer", FULL_PLAN),
  secret: travel({ dew: "leave" }).snapshots.find(s => s.currentNodeId === "node.act1.secret-dew" && story.facts(s).cursor === 1),
  empty: snapshotAt("rest-memory"),
  released: released.snapshots.find(s => s.currentNodeId === "node.act1.rest-memory"),
};
function fixture(params) {
  const seed = seeds[params.get("case")], envelope = seed ? save2(seed) : null;
  return `<!doctype html><html lang="th"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Act1 content3 review fixture</title><link rel="icon" href="./assets/images/ui/lotus-mark.svg"><link rel="stylesheet" href="./src/ui/styles/index.css"><main id="narrative-app" class="jk-app"></main><script type="module">
import {createGameApplication} from './src/bootstrap/index.js';
const content=await (await fetch('./src/data/content/packages/act-01.json')).json();
const testReferenceIds=${JSON.stringify(candidateTestIds)};
const initial=${JSON.stringify(envelope)};
if(initial&&!localStorage.getItem('jaokob:save:canonical'))localStorage.setItem('jaokob:save:canonical',JSON.stringify(initial));
const registry=await(await fetch('./assets/provenance/benchmark-assets.json')).json();
const app=createGameApplication({document,root:document.querySelector('#narrative-app'),content,testReferenceIds,
assetRegistry:{...registry,contentVersion:'3.0.0'},applicationBaseUrl:new URL('./',location.href).href});
window.narrativeApplication=app;
window.layoutShifts=[];new PerformanceObserver(list=>window.layoutShifts.push(...list.getEntries().filter(e=>!e.hadRecentInput).map(e=>e.value))).observe({type:'layout-shift',buffered:true});
await app.boot();if(initial)await app.dispatch({type:'SELECT_CHOICE',choiceId:'application.resume'});
window.render_game_to_text=()=>JSON.stringify({coordinates:'semantic DOM, no spatial movement',nodeId:app.getSnapshot()?.currentNodeId,revision:app.getSnapshot()?.revision,
mode:app.getViewModel().overlay??app.getStatus().mode,pouch:app.getSnapshot()?.pouch,prose:app.getViewModel().scene.dialogue,choices:app.getViewModel().choices.map(c=>c.id)});
window.advanceTime=async()=>{};
</script></html>`;
}
const mime = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".webp": "image/webp", ".mp3": "audio/mpeg", ".woff2": "font/woff2" };
const resources = new Map();
const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://localhost"); let path = decodeURIComponent(url.pathname);
    if (path.startsWith("/JaoKob/")) path = path.slice(7);
    if (path === "/__narrative") { res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" }).end(fixture(url.searchParams)); return; }
    const file = resolve(root, `.${path.endsWith("/") ? `${path}index.html` : path}`);
    if (!file.startsWith(`${root}${sep}`)) { res.writeHead(403).end(); return; }
    const bytes = await readFile(file); resources.set(path, { bytes: bytes.length, gzipBytes: gzipSync(bytes).length, sha256: createHash("sha256").update(bytes).digest("hex") });
    res.writeHead(200, { "Content-Type": `${mime[extname(file)] ?? "application/octet-stream"}; charset=utf-8`, "Cache-Control": "no-store" }).end(bytes);
  } catch { res.writeHead(404).end(); }
});
await new Promise(done => server.listen(0, "127.0.0.1", done));
const origin = `http://127.0.0.1:${server.address().port}`;
if (process.env.JKB_NARRATIVE_SERVE_ONLY === "1") {
  console.log(`${origin}/__narrative?case=secret`);
  await new Promise(done => { const stop = () => server.close(done); process.once("SIGINT", stop); process.once("SIGTERM", stop); }); process.exit(0);
}
const browser = await playwright.chromium.launch({ headless: true });
const evidence = { browser: browser.version(), at: new Date().toISOString(), candidateVersion: "3.0.0", defaultEntryVersion: "2.1.0", profiles: [], checks: [], captures: [], errors: [], resources: {} };
const control = (page, id) => page.locator(`[data-choice-id="${id}"]:visible`);
async function settled(page) {
  await page.waitForFunction(() => window.narrativeApplication && document.querySelector('#narrative-app')?.getAttribute('aria-busy') === 'false');
  await page.evaluate(() => narrativeApplication.whenIdle());
}
async function tap(page, id) {
  await control(page, id).click(); await settled(page);
}
async function expose(page, id) {
  for (let i = 0; await control(page, id).count() === 0; i++) {
    assert.ok(i < 60, `Cannot expose ${id}`); await tap(page, "application.advance");
  }
}
async function choose(page, id) { await expose(page, id); await tap(page, id); }
const snapshot = page => page.evaluate(() => narrativeApplication.getSnapshot());
const raw = page => page.evaluate(() => localStorage.getItem('jaokob:save:canonical'));
async function capture(page, name) { await page.screenshot({ path: resolve(output, name), fullPage: true }); evidence.captures.push(name); }
async function context(width = 390, height = 844, extra = {}) {
  const ctx = await browser.newContext({ viewport: { width, height }, reducedMotion: "reduce", ...extra }), page = await ctx.newPage();
  page.on("pageerror", e => evidence.errors.push(e.message));
  page.on("console", msg => { if (msg.type() === "error") evidence.errors.push(msg.text()); });
  page.on("request", req => { if (!req.url().startsWith('data:') && new URL(req.url()).origin !== origin) evidence.errors.push(`external:${req.url()}`); if (/\.(?:glb|blend)|model-viewer/.test(req.url())) evidence.errors.push(`3d:${req.url()}`); });
  return { ctx, page };
}
async function open(page, mode = "full", prefix = "") {
  await page.goto(`${origin}${prefix}/__narrative?case=${mode}`); await settled(page); await page.evaluate(() => document.fonts.ready);
}
try {
  for (const [width, height] of [[320,568],[390,844],[768,1024],[1440,900],[2560,1440],[844,390]]) {
    const { ctx, page } = await context(width, height);
    await open(page); await expose(page, "choice.act1.exchange-leaf");
    const before = await snapshot(page), bytes = await raw(page);
    assert.equal(before.pouch.held.length, 4);
    assert.equal(await page.locator('.jk-choice-slot [data-choice-id]:visible').count(), 5);
    const geometry = await page.evaluate(() => ({
      card: document.querySelector('.jk-narrative').getBoundingClientRect().toJSON(),
      overflow: document.documentElement.scrollWidth > innerWidth + 1,
      buttons: [...document.querySelectorAll('.jk-choice-slot button')].filter(n=>n.offsetHeight).map(n=>({height:n.getBoundingClientRect().height,scroll:n.scrollHeight>n.clientHeight+1})),
    }));
    assert.equal(geometry.overflow, false); assert.ok(Math.abs(height - geometry.card.bottom - 24) < 1);
    assert.ok(geometry.buttons.every(b => b.height >= 44 && !b.scroll));
    await capture(page, `${width}x${height}-full-offer.png`);
    await choose(page, "choice.act1.exchange-leaf"); await choose(page, "application.cancel-choice");
    assert.deepEqual(await snapshot(page), before); assert.equal(await raw(page), bytes);
    await choose(page, "application.pouch");
    assert.equal(await page.locator('[data-jk-role="pouch-grid"] [data-item-id]').count(), 4);
    await page.locator('[data-item-id="item_rain_petal"]').click();
    assert.match(await page.locator('[data-jk-role="pouch-detail"]').innerText(), /หยด|ฝน/);
    await capture(page, `${width}x${height}-four-items.png`);
    await page.keyboard.press('Escape'); assert.deepEqual(await snapshot(page), before); assert.equal(await raw(page), bytes);
    await choose(page, "choice.act1.exchange-leaf"); await choose(page, "application.confirm-choice");
    const after = await snapshot(page); assert.equal(after.revision, before.revision + 1); assert.deepEqual(after.metrics, before.metrics);
    assert.ok(after.pouch.released.includes('item_leaf')); assert.ok(after.pouch.held.includes('item_river_shell'));
    await page.reload(); await settled(page); assert.deepEqual(await snapshot(page), after);
    evidence.profiles.push({ width, height, ...geometry, shifts: await page.evaluate(() => layoutShifts.reduce((a,b)=>a+b,0)) }); await ctx.close();
  }
  evidence.checks.push('six profiles: true four-slot fifth offering, five eligible keep/replace choices, paper bottom24, no horizontal overflow,44px controls, native confirmation cancel, item inspection, atomic replacement, exact reload');
  for (const [mode, expected] of [["empty", "memory-refused"],["released","memory-released"]]) {
    const { ctx, page } = await context(320,568); await open(page,mode,"/JaoKob");
    const s = await snapshot(page); assert.equal(s.pouch.held.length, 0);
    assert.ok(s.progress.viewedDialogueIds.at(-1).includes(expected));
    await capture(page, `320-${mode}-comfort.png`);
    await choose(page,"application.pouch"); assert.equal(await page.locator('[data-jk-role="pouch-empty-slot"]').count(),4);
    await capture(page, `320-${mode}-pouch.png`); await ctx.close();
  }
  for (const [variant, scale, high] of [["text200",2,false],["high",1,true],["forced",1,false]]) {
    const { ctx, page } = await context(320,568,variant === "forced" ? {forcedColors:"active"}:{});
    await open(page,"secret");
    if(scale!==1||high) await page.evaluate(async ({scale,high})=>{
      await narrativeApplication.dispatch({type:'SELECT_CHOICE',choiceId:'application.settings'});
      await narrativeApplication.dispatch({type:'SETTINGS_CHANGED',setting:high?'highContrast':'fontScale',value:high?true:scale});
      await narrativeApplication.dispatch({type:'SELECT_CHOICE',choiceId:'application.close-settings'});
    },{scale,high});
    const before = await snapshot(page); await page.reload(); await settled(page);
    assert.deepEqual(await snapshot(page),before);
    assert.equal(before.progress.completedNodeIds.includes('node.act1.secret-dew'),false);
    const hud = await page.evaluate(() => {
      const numbers = [...document.querySelectorAll('.jk-meter-number')].map(n => n.getBoundingClientRect().toJSON());
      return { numbers, width: innerWidth, overflow: document.documentElement.scrollWidth > innerWidth + 1 };
    });
    assert.equal(hud.overflow, false);
    assert.ok(hud.numbers.every(r => r.x >= 0 && r.right <= hud.width));
    assert.ok(hud.numbers[0].right <= hud.numbers[1].left || hud.numbers[0].bottom <= hud.numbers[1].top);
    await capture(page, `320-secret-${variant}.png`); await ctx.close();
  }
  const { ctx, page } = await context(); await open(page,"journey"); await choose(page,'application.new-game');
  const plan = {...FULL_PLAN,fifth:'exchange-leaf'}, nodes = new Set();
  for(let step=0;step<240;step++) {
    const s=await snapshot(page), view=await page.evaluate(()=>narrativeApplication.getViewModel()); nodes.add(s.currentNodeId);
    if(view.choices.some(c=>c.id==='application.finish'))break;
    const id=view.choices.some(c=>c.id==='application.advance')?'application.advance':narrativeAction(s,plan);
    await choose(page,id);
    if((await page.evaluate(()=>narrativeApplication.getStatus().mode))==='choice-confirmation')await choose(page,'application.confirm-choice');
    assert.ok(step<239,'candidate browser journey terminates');
  }
  const final=await snapshot(page); assert.ok(final.pouch.released.includes('item_leaf')); assert.ok(final.pouch.held.includes('item_river_shell'));
  assert.equal(final.currentNodeId,'node.act1.rest');
  await capture(page,'390-complete-journey.png');
  await choose(page,'application.history'); await capture(page,'390-journey-history.png');
  assert.match(await page.locator('.jk-history-dialog').innerText(),/เปลือกหอย|ใบบัว/);
  evidence.checks.push({newGameToRest: true, visitedNodes:[...nodes], finalPouch:final.pouch, saveBytes:Buffer.byteLength(await raw(page))});
  await ctx.close();
  assert.deepEqual(evidence.errors,[]);
  evidence.resources=Object.fromEntries(resources); evidence.result='PASS';
} finally {
  await writeFile(resolve(output,'narrative-browser.json'),JSON.stringify(evidence,null,2)+'\n');
  await browser.close(); await new Promise(done=>server.close(done));
}
console.log(JSON.stringify({result:evidence.result,profiles:evidence.profiles.length,captures:evidence.captures.length,errors:evidence.errors.length}));
