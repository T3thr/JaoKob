/** T6 native-browser evidence. Disposable contexts; no production debug hook.
 * TC-S4-LOG-001/002, TC-S4-STATE-001, TC-S4-A11Y-001, FR-ENG-009.
 */
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createHash } from "node:crypto";
import { gzipSync } from "node:zlib";
import { envelope, walk } from "../helpers/act1-session.js";

const playwright = await import(process.env.JKB_PLAYWRIGHT_PATH ? pathToFileURL(process.env.JKB_PLAYWRIGHT_PATH).href : "playwright");
const root = resolve(fileURLToPath(new URL("../..", import.meta.url)));
const output = resolve(root, process.env.JKB_EVIDENCE_DIR ?? "tests/e2e/evidence/sprint-04/slice-03");
await mkdir(output, { recursive: true });
const head = `<!doctype html><html lang="th"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>ประวัติ: ชุดทดสอบ</title><link rel="icon" href="./assets/images/ui/lotus-mark.svg"><link rel="stylesheet" href="./src/ui/styles/index.css"><body>`;
const archiveFixture = `${head}<main id="fixture" class="jk-app"></main><script type="module">
import {createDomRenderer} from './src/ui/renderers/dom/dom-renderer.js';
import {createSessionHistory,reduceSessionHistory as reduce} from './src/core/use-cases/session-history.js';
import {projectSessionHistory} from './src/data/content/history-projection.js';
const root=document.querySelector('#fixture'),params=new URLSearchParams(location.search);
let history=createSessionHistory({sessionId:'session.fixture',contentVersion:'2.1.0'});
const base={nodeId:'node.fixture',sceneId:'node.fixture',sourceId:'dialogue.fixture',speakerId:'character.mother',locale:'th',sceneLabel:'ใต้ร่มใบบัว (ข้อความตัวอย่างสำหรับทดสอบ)',speakerLabel:'แม่กบ',voiceRole:'speech'};
if(!params.has('empty'))for(let i=1;i<=60;i++){
history=reduce(history,{type:'ACTION_COMMITTED',kind:'choice',revision:i,record:{...base,voiceRole:'player',text:'หยุดฟังเสียงน้ำ ครั้งที่ '+i}});
history=reduce(history,{type:'PRESENTATION_STARTED',presentationId:i,returning:i>1});
history=reduce(history,{type:'DIALOGUE_PRESENTED',presentationId:i,part:'scene',record:{...base,text:'ถ้าน้ำไหว ให้ฟังรากบัวนะ รากจำทางกลับได้ดีกว่าคลื่น เราจะค่อย ๆ ฟังไปด้วยกัน ครั้งที่ '+i}});
}
let view={locale:'th',state:'Cutscene',revision:1,viewRevision:1,settings:{fontScale:params.has('zoom')?2:1,highContrast:params.has('contrast'),reducedMotion:true},presentation:{mode:'reading'},scene:{title:'ชุดทดสอบประวัติ',dialogue:'ทดสอบการเปิดอ่านย้อนหลังโดยไม่เปลี่ยนเรื่องราว',speaker:'ผู้บรรยาย'},history:projectSessionHistory(history),choices:[{id:'application.history',label:'เปิดประวัติเรื่องราว'}]};
const renderer=createDomRenderer({root,document,onIntent:intent=>{
if(intent.choiceId==='application.history')view={...view,overlay:'history',viewRevision:view.viewRevision+1};
else if(intent.choiceId==='application.close-history')view={...view,overlay:undefined,viewRevision:view.viewRevision+1};
renderer.render(view);renderer.applyFocusDirective({target:'dialogue'});
}});
renderer.render(view);renderer.setBusy(false);
window.patchHistoryStatus=()=>{view={...view,viewRevision:view.viewRevision+1,notice:{kind:'attention',text:'ภาพกำลังพัก คุณยังอ่านต่อได้'},mediaStatusText:'ภาพยังไม่พร้อม'};renderer.render(view)};
window.render_game_to_text=()=>JSON.stringify({mode:view.overlay??'reading',coordinates:'semantic DOM, no spatial movement',dialogues:history.dialogues.length,actions:history.actions.length,revision:view.revision});
window.advanceTime=async()=>{};
</script></body></html>`;
const appFixture = `${head}<main id="test-app" class="jk-app"></main><script type="module">
import {createGameApplication} from './src/bootstrap/index.js';
const app=createGameApplication({document,root:document.querySelector('#test-app'),applicationBaseUrl:new URL('./',location.href).href});
window.historyTestApplication=app;await app.boot();
window.render_game_to_text=()=>JSON.stringify({mode:app.getViewModel().overlay??app.getStatus().mode,nodeId:app.getSnapshot()?.currentNodeId,revision:app.getSnapshot()?.revision,dialogues:app.getSessionHistory()?.dialogues.length??0,actions:app.getSessionHistory()?.actions.length??0,coordinates:'semantic DOM, no spatial movement'});
window.advanceTime=async()=>{};
</script></body></html>`;
const mime = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".webp": "image/webp", ".mp3": "audio/mpeg", ".woff2": "font/woff2" };
const resources = new Map();
const server = createServer(async (request, response) => {
  try {
    let path = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
    if (path.startsWith("/JaoKob/")) path = path.slice(7);
    if (["/__history_fixture", "/__history_application"].includes(path)) {
      response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" }).end(path.endsWith("application") ? appFixture : archiveFixture); return;
    }
    const file = resolve(root, `.${path.endsWith("/") ? `${path}index.html` : path}`);
    if (!file.startsWith(`${root}${sep}`)) { response.writeHead(403).end(); return; }
    const bytes = await readFile(file); resources.set(path, { path, bytes: bytes.length, gzipBytes: gzipSync(bytes).length, sha256: createHash("sha256").update(bytes).digest("hex") });
    response.writeHead(200, { "Content-Type": `${mime[extname(file)] ?? "application/octet-stream"}; charset=utf-8`, "Cache-Control": "no-store" }).end(bytes);
  } catch { response.writeHead(404).end(); }
});
await new Promise(done => server.listen(0, "127.0.0.1", done));
const origin = `http://127.0.0.1:${server.address().port}`;
if (process.env.JKB_HISTORY_SERVE_ONLY === "1") {
  console.log(`${origin}/__history_fixture`);
  await new Promise(done => { const stop = () => server.close(done); process.once("SIGINT", stop); process.once("SIGTERM", stop); }); process.exit(0);
}
const browser = await playwright.chromium.launch({ headless: process.env.JKB_HEADED !== "1" });
const evidence = { at: new Date().toISOString(), browser: browser.version(), platform: process.platform, profiles: [], checks: [], screenshots: [], errors: [] };
const saveKey = "jaokob:save:canonical";
const capture = async (page, name) => { await page.screenshot({ path: resolve(output, name), fullPage: true }); evidence.screenshots.push(name); };
const idle = page => page.waitForFunction(() => document.querySelector('.jk-app')?.getAttribute("aria-busy") === "false");
const choice = (page, id) => page.locator(`.jk-app-shell:not([inert]) [data-choice-id="${id}"]:visible, dialog[open] [data-choice-id="${id}"]:visible`);
async function context(viewport, extra = {}) {
  const ctx = await browser.newContext({ viewport, reducedMotion: "reduce", ...extra }), page = await ctx.newPage();
  page.on("pageerror", error => evidence.errors.push(error.message));
  page.on("console", msg => { if (msg.type() === "error") evidence.errors.push(msg.text()); });
  page.on("request", req => { if (!req.url().startsWith(origin) && !/^(blob:|data:)/.test(req.url())) evidence.errors.push(`External: ${req.url()}`); });
  return { ctx, page };
}
async function openHistory(page, tap = false) {
  await (tap ? choice(page, "application.history").tap() : choice(page, "application.history").click());
  await page.locator('dialog[open]').waitFor(); await idle(page); await page.evaluate(() => document.fonts.ready);
}
async function select(page, id) {
  const before = await page.locator('.jk-app').evaluate(root => [root.dataset.viewRevision, root.dataset.readingRevision].join(':'));
  await choice(page, id).click();
  await page.waitForFunction(before => { const root = document.querySelector('.jk-app'); return [root.dataset.viewRevision, root.dataset.readingRevision].join(':') !== before; }, before);
  await idle(page);
}
async function geometry(page) {
  return page.locator('dialog[open]').evaluate(dialog => {
    const rect = node => { const r = node.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height, bottom: r.bottom, right: r.right }; };
    const body = dialog.querySelector('[data-jk-role="modal-scroll"]');
    return { dialog: rect(dialog), close: rect(dialog.querySelector('[data-jk-role="modal-close"]')), overflow: body.scrollWidth > body.clientWidth + 1,
      atEnd: Math.abs(body.scrollHeight - body.clientHeight - body.scrollTop) < 3, top: body.scrollTop,
      height: innerHeight, width: innerWidth, headingFocus: document.activeElement?.id === 'jk-history-title',
      lineHeight: getComputedStyle(dialog.querySelector('.jk-history-text') ?? body).lineHeight };
  });
}
function assertGeometry(g) {
  assert.equal(g.overflow, false); assert.ok(g.dialog.x >= 0 && g.dialog.right <= g.width + 1); assert.ok(g.dialog.y >= 0 && g.dialog.bottom <= g.height + 1);
  assert.ok(g.close.width >= 44 && g.close.height >= 44); assert.ok(g.close.bottom <= g.height); assert.equal(g.atEnd, true); assert.equal(g.headingFocus, true);
}
try {
  for (const [width, height] of [[320, 568], [390, 844], [768, 1024], [1440, 900], [2560, 1440], [844, 390]]) {
    const { ctx, page } = await context({ width, height });
    for (const empty of [true, false]) {
      await page.goto(`${origin}/__history_fixture${empty ? '?empty' : ''}`); await choice(page, "application.history").waitFor(); await page.evaluate(() => document.fonts.ready);
      const state = await page.evaluate(() => render_game_to_text()); await openHistory(page);
      const g = await geometry(page); assertGeometry(g); evidence.profiles.push({ width, height, empty, ...g });
      assert.equal(await page.locator('[data-history-kind="dialogue"]').count(), empty ? 0 : 50);
      assert.equal(await page.locator('[data-history-kind="choice"]').count(), empty ? 0 : 50);
      assert.equal(await page.locator('.jk-app-shell').getAttribute('inert'), '');
      await capture(page, `${width}x${height}-${empty ? 'empty' : 'latest'}.png`);
      const close = page.locator('[data-jk-role="modal-close"]');
      await page.keyboard.press('Tab'); assert.equal(await close.evaluate(node => node === document.activeElement), true);
      await page.keyboard.press('Shift+Tab'); assert.equal(await close.evaluate(node => node === document.activeElement), true);
      const scroll = page.locator('[data-jk-role="modal-scroll"]'); await scroll.evaluate(node => { node.scrollTop = 0; });
      const beforeClose = (await geometry(page)).close;
      await page.evaluate(() => patchHistoryStatus()); assert.equal(await scroll.evaluate(node => node.scrollTop), 0);
      assert.deepEqual((await geometry(page)).close, beforeClose);
      if (!empty && width === 390) await capture(page, '390-history-earlier-async-status.png');
      await page.keyboard.press('Escape'); assert.equal(await page.locator('dialog[open]').count(), 0);
      assert.equal(await choice(page, 'application.history').evaluate(node => node === document.activeElement), true);
      assert.equal(await page.evaluate(() => render_game_to_text()), state);
    }
    await ctx.close();
  }
  evidence.checks.push('12 empty/latest layouts across six profiles:50+50 independent entries, chronological native modal,44px pinned close, initial heading,Tab/Escape/inert/opener, latest auto-scroll and async user-scroll preservation');
  for (const variant of ['zoom', 'contrast', 'forced']) {
    const { ctx, page } = await context({ width: 320, height: 568 }, variant === 'forced' ? { forcedColors: 'active' } : {});
    await page.goto(`${origin}/__history_fixture?${variant}`); await page.evaluate(() => document.fonts.ready); await openHistory(page);
    const g = await geometry(page); assertGeometry(g); evidence.profiles.push({ variant, ...g }); await capture(page, `320-history-${variant}.png`); await ctx.close();
  }
  // The actual application, with diagnostics owned exclusively by this fixture.
  {
    const { ctx, page } = await context({ width: 320, height: 568 });
    await page.goto(`${origin}/__history_application`); await choice(page, 'application.new-game').waitFor(); await idle(page); await page.evaluate(() => document.fonts.ready);
    await select(page, 'application.settings');
    await page.locator('[data-jk-setting="fontScale"]').focus(); await page.keyboard.press('End'); await idle(page);
    await select(page, 'application.close-settings');
    await select(page, 'application.new-game');
    const appState = () => page.evaluate(() => ({ snapshot: historyTestApplication.getSnapshot(), history: historyTestApplication.getSessionHistory(), raw: localStorage.getItem('jaokob:save:canonical'), media: historyTestApplication.inspectMedia() }));
    let before = await appState(); const visible = await page.locator('.jk-dialogue').textContent();
    assert.equal(before.history.dialogues[0].text, visible); assert.equal(before.history.dialogues.length, 1);
    const full = await page.evaluate(() => historyTestApplication.getViewModel().scene.dialogue);
    assert.ok(full.startsWith(visible)); assert.ok(visible.length < full.length, '320px fixture must actually paginate');
    await openHistory(page); assert.equal(await page.locator('.jk-history-text').textContent(), visible);
    const after = await appState(); assert.deepEqual(after.snapshot, before.snapshot); assert.equal(after.raw, before.raw); assert.deepEqual(after.history, before.history); assert.deepEqual(after.media.audio, before.media.audio);
    await capture(page, '320-production-visible-prefix.png'); await page.keyboard.press('Escape'); await idle(page);
    await select(page, 'application.advance'); const next = await appState();
    assert.equal(next.snapshot.revision, before.snapshot.revision); assert.equal(next.raw, before.raw); assert.equal(next.history.dialogues.length, 1); assert.ok(next.history.dialogues[0].text.length > visible.length);
    // Reflow/overlay cannot reveal text from pages that have never been displayed.
    await openHistory(page); await page.setViewportSize({ width: 390, height: 844 }); await page.evaluate(() => document.fonts.ready);
    assert.deepEqual((await appState()).history, next.history); await page.keyboard.press('Escape'); await idle(page);
    await page.reload(); await choice(page, 'application.resume').waitFor(); await idle(page); await select(page, 'application.resume');
    before = await appState(); assert.equal(before.history.dialogues.length, 1); assert.equal(before.history.actions.length, 0); assert.equal(before.history.continued, true);
    await openHistory(page); assert.match(await page.locator('[data-jk-role="history-session-note"]').innerText(), /ครั้งก่อน/); await capture(page, '390-reloaded-session-note.png');
    const cdp = await ctx.newCDPSession(page); await cdp.send('HeapProfiler.collectGarbage');
    evidence.memory = { sessionSerializedBytes: Buffer.byteLength(JSON.stringify(before.history)), chromiumHeapUsage: await cdp.send('Runtime.getHeapUsage'), note: 'whole-page heap includes media/browser JS; not isolated reducer allocation' }; await cdp.detach();
    await ctx.close();
  }
  evidence.checks.push('Actual320px pagination: only visible prefix, local advance extends same occurrence without saving; overlay resize logs no unseen prose; reload creates fresh current-line transcript and gentle note; view-only snapshot/raw save/audio remain exact');
  {
    const { ctx, page } = await context({ width: 390, height: 844 });
    const initial = JSON.stringify(envelope(walk().find(s => s.currentNodeId === 'node.act1.keepsake')));
    await ctx.addInitScript(({ key, raw }) => localStorage.setItem(key, raw), { key: saveKey, raw: initial });
    await page.goto(`${origin}/__history_application`); await choice(page, 'application.resume').waitFor(); await idle(page); await select(page, 'application.resume');
    const history = () => page.evaluate(() => historyTestApplication.getSessionHistory());
    const before = await history(); await select(page, 'choice.act1.keep-fragment');
    assert.deepEqual(await history(), before); await select(page, 'application.cancel-choice'); assert.deepEqual(await history(), before);
    await select(page, 'choice.act1.keep-fragment'); await select(page, 'application.confirm-choice');
    const after = await history(), feedback = after.dialogues.find(e => e.part === 'feedback');
    assert.equal(after.actions.length, 1); assert.ok(after.actions[0].sequence < feedback.sequence);
    const unread = await page.evaluate(() => historyTestApplication.getViewModel().reading.parts.find(p => p.id === 'scene').sourceId);
    assert.equal(after.dialogues.some(e => e.sourceId === unread), false);
    await openHistory(page); await capture(page, '390-committed-choice-history.png'); await page.keyboard.press('Escape'); await idle(page);
    // Finish all local response pages before the authored next beat can commit.
    while (!(await history()).dialogues.some(e => e.sourceId === unread)) await select(page, 'application.advance');
    assert.equal((await history()).actions.length, 1); await ctx.close();
  }
  evidence.checks.push('Actual confirmed choice: cancellation absent, action before displayed response, hidden next-scene passage excluded until local pagination shows it');
  for (const [subpath, width, height, touch] of [['', 1440, 900, false], ['/JaoKob', 320, 568, true]]) {
    const { ctx, page } = await context({ width, height }, touch ? { hasTouch: true, isMobile: true } : {});
    const initial = JSON.stringify(envelope(walk().at(-1)));
    await ctx.addInitScript(({ key, raw }) => { if (!localStorage.getItem(key)) localStorage.setItem(key, raw); }, { key: saveKey, raw: initial });
    await page.goto(`${origin}${subpath}/index.html`); await choice(page, 'application.resume').waitFor(); await idle(page); await select(page, 'application.resume');
    await openHistory(page, touch); await capture(page, `${subpath ? 'subpath' : 'root'}-${width}-history.png`); await page.keyboard.press('Escape'); await idle(page);
    assert.equal(await page.evaluate(key => localStorage.getItem(key), saveKey), initial);
    await select(page, 'application.pouch'); await page.locator('[data-item-id="item_leaf"]').click(); await page.locator('[data-pouch-action="release"]').click(); await page.locator('[data-jk-role="pouch-cancel"]').click();
    await page.locator('[data-pouch-action="release"]').click(); await page.locator('[data-jk-role="pouch-confirm"]').click(); await idle(page);
    await openHistory(page, touch); assert.equal(await page.locator('[data-history-kind="keepsake-action"]').count(), 1); assert.match(await page.locator('[data-history-kind="keepsake-action"]').innerText(), /ส่งต่อ เศษใบบัว/);
    await capture(page, `${subpath ? 'subpath' : 'root'}-${width}-released-history.png`); await page.keyboard.press('Escape'); await idle(page);
    const saved = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), saveKey); assert.equal(saved.saveFormatVersion, 2); assert.deepEqual(saved.payload.pouch.held, []); assert.deepEqual(saved.payload.pouch.released, ['item_leaf']);
    assert.equal(Object.hasOwn(saved.payload, 'sessionHistory'), false); assert.equal(saved.payload.history.length, JSON.parse(initial).payload.history.length);
    await select(page, 'application.finish'); await select(page, 'application.resume'); await openHistory(page, touch); assert.equal(await page.locator('[data-history-kind="keepsake-action"]').count(), 1);
    await page.keyboard.press('Escape'); await idle(page); await select(page, 'application.finish'); await select(page, 'application.new-game'); await select(page, 'application.cancel-replace'); await select(page, 'application.resume');
    await openHistory(page, touch); assert.equal(await page.locator('[data-history-kind="keepsake-action"]').count(), 1); await page.keyboard.press('Escape'); await idle(page);
    await select(page, 'application.finish'); await select(page, 'application.new-game'); await select(page, 'application.confirm-replace'); await openHistory(page, touch);
    assert.equal(await page.locator('[data-history-kind="keepsake-action"]').count(), 0); assert.equal(await page.locator('[data-history-kind="dialogue"]').count(), 1);
    await ctx.close();
  }
  evidence.checks.push('Production root1440 and subpath320 touch: read-only Save1 Resume, Pouch cancel/one confirmed release, Save2 with no transcript, Title/Resume and cancelled replacement retain log; confirmed New Game resets');
  {
    const { ctx, page } = await context({ width: 1440, height: 900 });
    await page.goto(`${origin}/__history_fixture`); await choice(page, 'application.history').waitFor(); await page.evaluate(() => document.fonts.ready);
    evidence.performance = await page.evaluate(async () => {
      let shift = 0; const observer = new PerformanceObserver(list => { for (const entry of list.getEntries()) shift += entry.value; });
      observer.observe({ type: 'layout-shift' });
      const runs = [];
      for (let run = 0; run < 5; run++) {
        const samples = [];
        for (let i = 0; i < 50; i++) {
          let at = performance.now(); document.querySelector('[data-choice-id="application.history"]').click(); samples.push(performance.now() - at);
          at = performance.now(); document.querySelector('[data-choice-id="application.close-history"]').click(); samples.push(performance.now() - at);
        }
        samples.sort((a, b) => a - b); runs.push({ actions: samples.length, p95: samples[Math.ceil(samples.length * .95) - 1], maximum: samples.at(-1) });
        await new Promise(requestAnimationFrame);
      }
      await new Promise(requestAnimationFrame); for (const entry of observer.takeRecords()) shift += entry.value; observer.disconnect();
      return { runs, layoutShift: shift, measurement: 'synchronous100-entry open/close handler+layout in headless Chromium; excludes painted-frame/device latency' };
    });
    assert.equal(evidence.performance.layoutShift, 0); assert.ok(evidence.performance.runs.every(run => run.p95 <= 100));
    await openHistory(page); const cdp = await ctx.newCDPSession(page); await cdp.send('HeapProfiler.collectGarbage');
    evidence.fullArchiveHeap = await cdp.send('Runtime.getHeapUsage'); await cdp.detach(); await ctx.close();
  }
  const luminance = hex => {
    const rgb = hex.match(/[a-f0-9]{2}/gi).map(v => parseInt(v, 16) / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4);
    return rgb[0] * .2126 + rgb[1] * .7152 + rgb[2] * .0722;
  };
  evidence.contrast = [['293d32','fcf4e3'],['53604f','fcf4e3'],['102018','fffdf5'],['27382b','fffdf5']].map(([ink, paper]) => ({ ink, paper, ratio: (luminance(paper) + .05) / (luminance(ink) + .05) }));
  assert.ok(evidence.contrast.every(p => p.ratio >= 4.5)); assert.ok(evidence.contrast.slice(2).every(p => p.ratio >= 7));
  evidence.resources = [...resources.values()].sort((a, b) => a.path.localeCompare(b.path)); assert.deepEqual(evidence.errors, []);
  evidence.result = 'passed';
} catch (error) { evidence.result = 'failed'; evidence.failure = { message: error.message, stack: error.stack }; throw error; }
finally { await writeFile(resolve(output, 'history-browser.json'), `${JSON.stringify(evidence, null, 2)}\n`); await browser.close(); await new Promise(done => server.close(done)); }
console.log(JSON.stringify({ result: evidence.result, profiles: evidence.profiles.length, screenshots: evidence.screenshots.length, checks: evidence.checks, errors: evidence.errors.length }));
