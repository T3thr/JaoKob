/** CR-0005 T1–T2: actual production DOM, isolated saves and a scoped native-DOM fault fixture. */
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";

const repo = resolve(fileURLToPath(new URL("../..", import.meta.url)));
const output = resolve(repo, "tests/e2e/evidence/sprint-04/slice-01");
await mkdir(output, { recursive: true });
const { chromium } = await import(process.env.JKB_PLAYWRIGHT_PATH ? pathToFileURL(process.env.JKB_PLAYWRIGHT_PATH).href : "playwright");
const host = `import {createGameApplication} from './src/bootstrap/index.js';
const app=createGameApplication({document,root:document.getElementById('slice-root')});window.slice={app};await app.boot();`;
const mime = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".json": "application/json", ".webp": "image/webp", ".svg": "image/svg+xml", ".mp3": "audio/mpeg", ".woff2": "font/woff2" };
const evidence = { baseline: execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim(), at: new Date().toISOString(),
  requirements: ["TC-S4-VIS-001", "TC-S4-STATUS-001", "TC-S4-STATE-001", "TC-S4-A11Y-001"],
  viewports: [], anchors: [], modalCorners: [], checks: [], screenshots: [], errors: [], expectedFaults: [], sourceHashes: {},
  notRun: ["PO aesthetic and human Thai editorial acceptance", "Physical touch devices", "VoiceOver/NVDA", "Safari/iOS/Firefox", "Native 400% browser zoom", "Representative device percentile performance"] };
const server = createServer(async (request, response) => {
  try {
    let path = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
    if (path.startsWith("/JaoKob/")) path = path.slice(7);
    if (path === "/slice-host.js") { response.writeHead(200, { "Content-Type": "text/javascript" }); response.end(host); return; }
    if (path.endsWith("/")) path += "index.html";
    const file = resolve(repo, `.${path}`);
    if (!file.startsWith(`${repo}${sep}`) || !["/index.html", "/src/", "/assets/"].some((prefix) => path.startsWith(prefix))) { response.writeHead(403).end(); return; }
    let body = await readFile(file);
    evidence.sourceHashes[path] = createHash("sha256").update(body).digest("hex");
    if (path === "/index.html") body = body.toString().replace('id="app"', 'id="slice-root"').replace("./src/bootstrap/index.js", "./slice-host.js");
    response.writeHead(200, { "Content-Type": mime[extname(file)] ?? "application/octet-stream", "Cache-Control": "no-store" }); response.end(body);
  } catch { response.writeHead(404).end(); }
});
await new Promise((done) => server.listen(0, "127.0.0.1", done));
const origin = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({ headless: process.env.JKB_HEADED !== "1" });
evidence.browser = browser.version();
const choice = (page, id) => page.locator(`.jk-app-shell:not([inert]) [data-choice-id="${id}"], dialog[open] [data-choice-id="${id}"]`);
const idle = (page) => page.waitForFunction(() => window.slice?.app.getStatus().booted && !slice.app.getStatus().busy);
async function click(page, id) { await choice(page, id).click(); await idle(page); }
async function context(viewport, fault = "") {
  const ctx = await browser.newContext({ viewport, reducedMotion: "reduce" });
  const page = await ctx.newPage();
  page.on("pageerror", (error) => evidence.errors.push(error.message));
  page.on("console", (msg) => { if (msg.type() === "error") (fault ? evidence.expectedFaults : evidence.errors).push(msg.text()); });
  page.on("request", (request) => { if (!request.url().startsWith(origin) && !/^(data|blob):/.test(request.url())) evidence.errors.push(`external ${request.url()}`); });
  if (fault === "image") await page.route("**/assets/images/**/*.webp", (route) => route.abort());
  if (fault === "storage") await page.addInitScript(() => { Storage.prototype.setItem = () => { throw new DOMException("Injected quota", "QuotaExceededError"); }; });
  await page.goto(`${origin}${viewport.width === 2560 ? "/JaoKob" : ""}/index.html`); await idle(page);
  return { ctx, page };
}
async function screenshot(page, name) { await page.screenshot({ path: resolve(output, name), fullPage: !/settings|advisory|switch|sound/.test(name) }); evidence.screenshots.push(name); }
async function anchor(page) {
  return page.evaluate(() => {
    const rect = (selector) => { const r = document.querySelector(selector).getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height, bottom: r.bottom }; };
    return { mode: slice.app.getViewModel().presentation.mode, paper: rect('.jk-narrative'), slot: rect('.jk-choice-slot'), scrollY,
      body: { height: document.querySelector('.jk-reading-body').clientHeight, scrollHeight: document.querySelector('.jk-reading-body').scrollHeight } };
  });
}
function sameAnchor(before, after, name) {
  for (const region of ['paper', 'slot']) for (const key of ['x','y','width','height','bottom']) {
    assert.ok(Math.abs(before[region][key] - after[region][key]) < .1, `${name} ${region}.${key}: ${before[region][key]} -> ${after[region][key]}`);
  }
}
async function modalCorners(page, name) {
  const measure = () => page.locator('dialog[open]').evaluate((dialog) => {
    const close = dialog.querySelector('.jk-modal-close'), body = dialog.querySelector('.jk-modal-body'), r = close.getBoundingClientRect();
    const hit = document.elementFromPoint(r.x+r.width/2, r.y+r.height/2);
    return { x: r.x, y: r.y, width: r.width, height: r.height, visible: r.x >= 0 && r.y >= 0 && r.right <= innerWidth && r.bottom <= innerHeight && close.contains(hit),
      scrollTop: body.scrollTop, clientHeight: body.clientHeight, scrollHeight: body.scrollHeight,
      containedButtonLabels: [...body.querySelectorAll('button')].every((node) => node.scrollHeight <= node.clientHeight+1) };
  });
  await page.locator('dialog[open] .jk-modal-body').evaluate((body) => { body.scrollTop = 0; });
  const before = await measure();
  await page.locator('dialog[open] .jk-modal-body').evaluate((body) => { body.scrollTop = body.scrollHeight; });
  const after = await measure();
  assert.ok(before.visible && after.visible && before.width >= 44 && before.height >= 44 && before.clientHeight >= 44, `${name}: ${JSON.stringify({before,after})}`);
  assert.ok(before.containedButtonLabels && after.containedButtonLabels, `${name} button labels fit their actual controls`);
  assert.equal(after.y, before.y); assert.equal(after.x, before.x);
  evidence.modalCorners.push({ name, before, after });
}
async function fit(page, name) {
  const facts = await page.evaluate(() => ({ width: innerWidth, height: innerHeight, scrollWidth: document.documentElement.scrollWidth,
    buttons: [...document.querySelectorAll('button')].filter((el) => el.getBoundingClientRect().width).map((el) => ({ id: el.dataset.choiceId, width: el.getBoundingClientRect().width, height: el.getBoundingClientRect().height })),
    regions: [...document.querySelectorAll('.jk-hud,.jk-utility-rail,.jk-narrative,.jk-choice-area')].map((el) => {
      const r = el.getBoundingClientRect(); return { class: el.className, x: r.x, y: r.y, right: r.right, bottom: r.bottom };
    }),
  }));
  assert.ok(facts.scrollWidth <= facts.width, `${name} horizontal overflow`);
  assert.ok(facts.buttons.every((b) => b.width >= 44 && b.height >= 44), `${name} touch targets`);
  if (facts.width >= 390 && facts.height >= 844 && !/text200|settings|warning|failure/.test(name)) {
    evidence.viewports.push({ name, ...facts });
    assert.ok(facts.regions.every((r) => r.x >= 0 && r.right <= facts.width && r.y >= 0 && r.bottom <= facts.height), `${name} initial regions fit: ${JSON.stringify(facts.regions)}`);
    return;
  }
  evidence.viewports.push({ name, ...facts });
}
async function decision(page, samples = []) {
  const observations = ["lily", "roots", "shadows", "mother"];
  for (let guard = 0; guard < 70; guard++) {
    samples.push(await anchor(page));
    if (await choice(page, "choice.act1.focus-mother").count()) return;
    if (await choice(page, "application.advance").count()) await click(page, "application.advance");
    else await click(page, observations.length ? `interaction.act1.observe-${observations.shift()}` : "interaction.act1.join-family");
  }
  assert.fail("Decision unreachable");
}
try {
  for (const [width, height] of [[320,568],[390,844],[768,1024],[1440,900],[2560,1440],[844,390]]) {
    const { ctx, page } = await context({ width, height });
    await page.waitForFunction(() => document.querySelector('#stage-bg')?.dataset.mediaState === 'ready');
    assert.equal(await page.locator('[data-jk-meter]').count(), 0);
    await fit(page, `${width}x${height}-title`); await screenshot(page, `${width}x${height}-title.png`);
    await click(page, "application.new-game");
    await page.waitForFunction(() => document.querySelector('#stage-char')?.dataset.mediaState === 'ready' && document.querySelector('#stage-bg')?.dataset.mediaState === 'ready');
    await page.evaluate(() => document.fonts.ready);
    assert.equal(await page.locator('.jk-decision-card').count(), 0);
    assert.equal(await choice(page, "application.advance").count(), 1);
    assert.equal(await page.locator('.jk-narrative .jk-save-status').count(), 0);
    const type = await page.locator('.jk-dialogue').evaluate((el) => ({ font: getComputedStyle(el).fontFamily, size: parseFloat(getComputedStyle(el).fontSize), line: parseFloat(getComputedStyle(el).lineHeight) }));
    assert.match(type.font, /Sarabun/); assert.ok(type.size >= 18 && type.size <= 20); assert.ok(type.line / type.size >= 1.75 && type.line / type.size <= 1.9);
    await page.waitForFunction(() => { const status = document.querySelector('.jk-save-status'); return status && status.hasAttribute('hidden') && getComputedStyle(status).display === 'none'; });
    assert.equal(await page.locator('.jk-header-bar').count(), 1);
    assert.equal(await page.locator('.jk-utility-rail').evaluate((el) => getComputedStyle(el).backgroundColor), 'rgba(0, 0, 0, 0)');
    await fit(page, `${width}x${height}-reading`); await screenshot(page, `${width}x${height}-reading.png`);
    const readingAnchor = await anchor(page), samples = [];
    assert.ok(Math.abs(height - readingAnchor.paper.bottom - 24) < .1, `${width} bottom baseline24`);
    await page.evaluate(() => { window.sliceShifts = []; window.sliceShiftObserver = new PerformanceObserver((list) => sliceShifts.push(...list.getEntries().map(({value,hadRecentInput}) => ({value,hadRecentInput})))); sliceShiftObserver.observe({type:'layout-shift'}); });
    await decision(page, samples);
    const decisionAnchor = await anchor(page);
    for (const sample of [...samples, decisionAnchor]) sameAnchor(readingAnchor, sample, `${width} ${sample.mode}`);
    assert.equal(await page.locator('.jk-decision-card').count(), 3); assert.equal(await choice(page, "application.advance").count(), 0);
    await page.waitForFunction(() => { const status = document.querySelector('.jk-save-status'); return status && status.hasAttribute('hidden') && getComputedStyle(status).display === 'none'; });
    assert.equal(await page.locator('.jk-narrative [data-jk-role="feedback"]').count(), 1);
    assert.equal(await page.locator('.jk-choice-heading').evaluate((el) => getComputedStyle(el).clipPath), 'inset(50%)');
    assert.equal(await page.locator('.jk-choice-icon svg').count(), 3);
    await fit(page, `${width}x${height}-decision`); await screenshot(page, `${width}x${height}-decision.png`);
    await click(page, "choice.act1.focus-mother");
    sameAnchor(decisionAnchor, await anchor(page), `${width} Decision -> Reading`);
    const shifts = await page.evaluate(() => { sliceShiftObserver.disconnect(); return sliceShifts; });
    assert.equal(shifts.reduce((sum, entry) => sum + entry.value, 0), 0, `${width} layout shifts including recent input`);
    evidence.anchors.push({ width, height, reading: readingAnchor, decision: decisionAnchor, samples, shifts, cls: 0, includingRecentInput: 0 });
    assert.equal(await page.locator('[data-jk-role="feedback"]').count(), 1);
    assert.equal(await page.locator('.jk-narrative [data-jk-role="feedback"]').count(), 1);
    if (width === 390 || width === 1440) await screenshot(page, `${width}x${height}-response.png`);
    if (width === 320 || width === 1440) {
      await page.evaluate(() => { document.documentElement.style.fontSize = "200%"; });
      await fit(page, `${width}x${height}-text200`); await screenshot(page, `${width}x${height}-text200.png`);
      await click(page, "application.settings"); await fit(page, `${width}x${height}-settings-text200`);
      await modalCorners(page, `${width}-settings-text200`); await screenshot(page, `${width}x${height}-settings-text200.png`);
      await page.locator('dialog[open] .jk-modal-close').click(); await idle(page);
      assert.equal(await choice(page, "application.settings").evaluate((el) => document.activeElement === el), true);
    }
    await ctx.close();
  }
  evidence.checks.push("ADR-P0-018 D1: six viewports, paper and reserved slot match across every Reading/Exploration/Decision beat, bottom24, zero measured layout shifts including recent input; Thai/44px/root/subpath/reflow checks retained");
  // Real application overlays: native keyboard, fixed corner, true switch state,
  // sound availability/zero volume and durable UI-only advisory preference.
  {
    const { ctx, page } = await context({ width: 390, height: 844 });
    assert.doesNotMatch(await page.locator('.jk-story').innerText(), /พายุ|พลัดพราก/);
    const noGame = await page.evaluate(() => slice.app.getSnapshot());
    await click(page, 'application.advisory');
    assert.equal(await page.getByRole('dialog', { name: 'คำแนะนำ', exact: true }).count(), 1);
    assert.match(await page.locator('dialog[open]').innerText(), /พายุและการพลัดพราก/);
    const close = page.locator('dialog[open] .jk-modal-close');
    await close.focus(); await page.keyboard.press('Shift+Tab');
    assert.equal(await page.locator('dialog[open] button').last().evaluate((node) => node === document.activeElement), true);
    await page.keyboard.press('Tab'); assert.equal(await close.evaluate((node) => node === document.activeElement), true);
    await modalCorners(page, '390-advisory'); await screenshot(page, '390-advisory.png');
    await page.keyboard.press('Escape'); await idle(page);
    assert.equal(await choice(page,'application.advisory').evaluate((node) => node === document.activeElement), true);
    await click(page, 'application.advisory');
    const preference = page.locator('[data-jk-preference="hideContentAdvisory"]');
    await preference.click(); await idle(page); assert.equal(await preference.getAttribute('aria-checked'), 'true');
    await page.locator('dialog[open] [data-choice-id="application.close-advisory"]').last().click(); await idle(page);
    assert.equal(await choice(page,'application.advisory').count(), 0);
    assert.equal(await page.evaluate(() => slice.app.getSnapshot()), noGame);
    const stored = await page.evaluate(() => ({ preferences: JSON.parse(localStorage.getItem('jaokob:preferences')), save: localStorage.getItem('jaokob:save:canonical'), settings: localStorage.getItem('jaokob:settings') }));
    assert.deepEqual(stored, { preferences: { version:1, preferences: {hideContentAdvisory:true} }, save:null, settings:null });
    await page.reload(); await idle(page); assert.equal(await choice(page,'application.advisory').count(), 0);
    await click(page, 'application.settings'); await modalCorners(page, '390-settings');
    await screenshot(page, '390-settings-bottom.png');
    await page.locator('dialog[open] .jk-modal-body').evaluate((node) => {node.scrollTop=0;});
    await screenshot(page, '390-settings-top.png');
    assert.equal(await page.getByRole('switch').count(), 4);
    const contrast = page.getByRole('switch', { name:'เพิ่มความต่างของสี', exact:true });
    const off = await contrast.locator('.jk-switch-thumb').evaluate((node) => getComputedStyle(node).transform);
    await contrast.focus(); await page.keyboard.press('Space'); await idle(page);
    const on = await contrast.locator('.jk-switch-thumb').evaluate((node) => getComputedStyle(node).transform);
    assert.equal(await contrast.getAttribute('aria-checked'), 'true'); assert.notEqual(off,on);
    assert.equal(await contrast.evaluate((node) => node === document.activeElement), true);
    await screenshot(page, '390-switch-on.png');
    await contrast.click(); await idle(page);
    const master = page.locator('[data-jk-setting="masterVolume"]');
    await master.focus(); await page.keyboard.press('Home'); await idle(page);
    assert.equal(await master.inputValue(), '0'); assert.equal(await page.locator('dialog[open] [data-jk-action="enable-sound"]').getAttribute('data-audio-state'), 'off');
    await page.locator('dialog[open] [data-jk-action="enable-sound"]').click(); await idle(page);
    assert.equal(await master.inputValue(), '0', 'unlock must preserve intentional mute');
    assert.equal(await page.locator('dialog[open] [data-jk-action="enable-sound"]').count(), 1);
    await screenshot(page, '390-sound-off.png');
    await master.focus(); await page.keyboard.press('End'); await idle(page);
    await click(page, 'application.advisory');
    assert.equal(await preference.getAttribute('aria-checked'), 'true'); await preference.click(); await idle(page);
    await page.locator('dialog[open] .jk-modal-close').click(); await idle(page);
    assert.equal(await page.locator('dialog[open] [data-choice-id="application.advisory"]').evaluate((node) => node === document.activeElement), true);
    await page.locator('dialog[open] .jk-modal-close').click(); await idle(page);
    assert.equal(await choice(page,'application.advisory').count(), 1);
    await page.evaluate(() => { window.soundBefore=document.querySelector('[data-choice-id="application.enable-sound"]'); });
    await click(page, 'application.enable-sound');
    assert.equal(await page.evaluate(() => document.querySelector('.jk-utility-rail [data-choice-id="application.enable-sound"]') === soundBefore && !!soundBefore.dataset.audioState), true);
    assert.equal(await page.locator('[data-jk-setting="masterVolume"]').evaluate((node) => node === document.activeElement), true);
    await page.locator('dialog[open] .jk-modal-close').click(); await idle(page);
    await page.evaluate(() => { document.documentElement.style.fontSize='200%'; });
    await click(page, 'application.advisory'); await modalCorners(page, '390-advisory-text200');
    await screenshot(page, '390-advisory-text200.png'); await ctx.close();
    evidence.advisoryPreference = stored;
  }
  {
    const { ctx, page } = await context({ width:390, height:844 }, 'storage');
    await click(page, 'application.advisory'); await page.locator('[data-jk-preference="hideContentAdvisory"]').click(); await idle(page);
    assert.match(await page.locator('[data-jk-role="preference-status"]').innerText(), /ยังบันทึก|เปิดเกมใหม่/);
    assert.equal(await page.evaluate(() => localStorage.getItem('jaokob:preferences')), null);
    await modalCorners(page, '390-advisory-storage-failure'); await screenshot(page, '390-advisory-storage-failure.png'); await ctx.close();
  }
  evidence.checks.push('ADR-P0-018 D2/D3/D4: close visible/hit-tested at both scroll extremes and 200%; four keyboard switches with visible state/thumb; sound control persists and unlock preserves zero; advisory ack/Escape/focus, durable hide/reopen/reset and storage-denial explanation; no game/save/settings changes from advisory');
  // Native DOM fixture exercises renderer-only patches without altering game state.
  {
    const { ctx, page } = await context({ width: 390, height: 844 });
    await click(page, "application.new-game");
    const results = await page.evaluate(async () => {
      const before = slice.app.getSnapshot(); slice.app.dispose();
      const { createDomRenderer } = await import('./src/ui/renderers/dom/dom-renderer.js');
      const root = document.getElementById('slice-root'), intents = [];
      const renderer = createDomRenderer({ root, document, onIntent: (intent) => intents.push(intent) });
      const base = { revision: 4, viewRevision: 7, presentation: { mode: 'reading', nodeId: 'fixture' }, scene: { speaker: 'แม่กบ', dialogue: 'น้ำไหวเบา ๆ ที่ปลายรากบัว' },
        settings: { fontScale: 1 }, meters: { hp: 80, sanity: 70 }, choices: [{ id: 'application.advance', label: 'อ่านต่อ' }, { id: 'application.settings', label: 'ตั้งค่า' }] };
      renderer.render(base);
      const card = root.querySelector('.jk-narrative'), button = root.querySelector('[data-jk-action="advance"]'), status = root.querySelector('.jk-save-status'); button.focus();
      let preserved = true, announcements = 0;
      const observer = new MutationObserver((records) => { announcements += records.length; });
      observer.observe(root.querySelector('[aria-live]'), { childList: true });
      for (const [i, text] of ['กำลังบันทึก', 'บันทึกแล้ว', 'ยังบันทึกไม่ได้ หากปิดหน้านี้ความคืบหน้าอาจหายไป'].entries()) {
        renderer.render({ ...base, viewRevision: 8 + i, notice: { text } });
        preserved &&= card === root.querySelector('.jk-narrative') && status === root.querySelector('.jk-save-status') && document.activeElement === button;
      }
      button.click();
      renderer.announce({ text: 'บันทึกแล้ว' }); await Promise.resolve(); renderer.announce({ text: 'บันทึกแล้ว' }); await Promise.resolve(); observer.disconnect();
      renderer.render({ ...base, presentation: { mode: 'settings' } });
      const modal = root.querySelector('dialog'), scrollRegion = modal.querySelector('.jk-modal-body'), music = root.querySelector('[data-jk-setting="musicVolume"]'); music.focus(); scrollRegion.scrollTop = 200; const scroll = scrollRegion.scrollTop;
      renderer.setBusy(true);
      renderer.render({ ...base, viewRevision: 11, presentation: { mode: 'settings' }, notice: { text: 'ยังบันทึกไม่ได้' }, audioStatusText: 'เสียงพร้อมแล้ว' });
      renderer.setBusy(false);
      const modalStable = modal === root.querySelector('dialog') && document.activeElement === music && scrollRegion.scrollTop === scroll;
      renderer.render({ ...base, viewRevision: 12, settings: { fontScale: 1, highContrast: true } });
      window.fixtureRenderer = renderer; window.fixtureView = base;
      return { preserved, modalStable, announcements, intent: intents[0], before, after: slice.app.getSnapshot() };
    });
    assert.ok(results.before); assert.ok(results.preserved); assert.ok(results.modalStable); assert.equal(results.announcements, 1); assert.equal(results.intent.viewRevision, 10); assert.deepEqual(results.after, results.before);
    evidence.nativePatch = results;
    const highContrastColors = await page.evaluate(() => {
      const prose = getComputedStyle(document.querySelector('.jk-dialogue')), paper = getComputedStyle(document.querySelector('.jk-narrative'));
      return [prose.color, paper.backgroundColor];
    });
    await screenshot(page, "390-high-contrast.png");
    await page.emulateMedia({ forcedColors: "active" }); await screenshot(page, "390-forced-colors.png");
    await page.emulateMedia({ forcedColors: "none", reducedMotion: "reduce" });
    // OS/application motion and glass fallback contrast are measured in browser.
    const colors = await page.evaluate(() => {
      fixtureRenderer.render({ ...fixtureView, notice: { text: 'บันทึกแล้ว' } });
      const style = (s) => getComputedStyle(document.querySelector(s));
      const background = style('.jk-header-bar').backgroundColor;
      return { colors: [[style('.jk-dialogue').color, style('.jk-narrative').backgroundColor], [style('.jk-save-status').color, background]],
        motion: style('.jk-choice-button').transitionDuration, hp: style('[data-jk-meter="hp"] .jk-meter-fill').backgroundColor, sanity: style('[data-jk-meter="sanity"] .jk-meter-fill').backgroundColor };
    });
    const lum = (color) => color.match(/[\d.]+/g).slice(0,3).map(Number).map((v) => v / 255).map((v) => v <= .04045 ? v / 12.92 : ((v+.055)/1.055)**2.4).reduce((sum,v,i) => sum+v*[.2126,.7152,.0722][i],0);
    evidence.contrastRatios = colors.colors.map(([f,b]) => (Math.max(lum(f),lum(b))+.05)/(Math.min(lum(f),lum(b))+.05));
    evidence.highContrastRatio = (Math.max(...highContrastColors.map(lum))+.05)/(Math.min(...highContrastColors.map(lum))+.05);
    assert.ok(evidence.highContrastRatio >= 7);
    assert.ok(evidence.contrastRatios.every((ratio) => ratio >= 4.5)); assert.notEqual(colors.hp, colors.sanity); assert.equal(colors.motion, "0s");
    await page.addStyleTag({ content: '.jk-header-bar { backdrop-filter:none; -webkit-backdrop-filter:none; background:var(--jk-glass); }' });
    await screenshot(page, "390-glass-fallback.png");
    await page.emulateMedia({ reducedMotion: "no-preference" });
    const start = await page.evaluate(() => {
      fixtureRenderer.render({ ...fixtureView, revision: 5, viewRevision: 20, notice: { kind: 'saved', text: 'บันทึกแล้ว' } });
      window.transientNodes = { status: document.querySelector('.jk-save-status'), card: document.querySelector('.jk-narrative'), button: document.querySelector('[data-jk-action="advance"]') };
      transientNodes.button.focus(); return { opacity: Number(getComputedStyle(transientNodes.status).opacity), display: getComputedStyle(transientNodes.status).display };
    });
    assert.notEqual(start.display, 'none');
    await page.waitForTimeout(750);
    const halfway = await page.evaluate(() => Number(getComputedStyle(transientNodes.status).opacity));
    assert.ok(halfway > 0 && halfway < start.opacity);
    await page.waitForTimeout(850);
    const expired = await page.evaluate(() => {
      fixtureRenderer.render({ ...fixtureView, revision: 5, viewRevision: 21, notice: { kind: 'saved', text: 'บันทึกแล้ว' }, audioStatusText: 'เสียงพร้อมแล้ว' });
      return { display: getComputedStyle(transientNodes.status).display, focus: document.activeElement === transientNodes.button, sameCard: document.querySelector('.jk-narrative') === transientNodes.card };
    });
    assert.equal(expired.display, 'none'); assert.ok(expired.focus && expired.sameCard);
    evidence.saveFade = { start, halfwayOpacity: halfway, expired, deadlineMs: 1500 };
    await page.emulateMedia({ reducedMotion: "reduce" });
    await ctx.close();
  }
  for (const fault of ["image", "storage"]) {
    const { ctx, page } = await context({ width: 390, height: 844 }, fault);
    if (!await choice(page, "application.new-game").count()) {
      await screenshot(page, `390-${fault}-title-failure.png`);
      evidence.faultDiagnostic = { fault, status: await page.evaluate(() => slice.app.getStatus()), body: await page.locator('body').innerText() };
    }
    await click(page, "application.new-game");
    if (fault === "image") await choice(page, "application.retry-media").waitFor();
    else assert.match(await page.locator('.jk-save-status').textContent(), /หากปิด|ไม่ได้/);
    assert.equal(await choice(page, "application.advance").count(), 1);
    await fit(page, `${fault}-failure`); await screenshot(page, `390-${fault}-failure.png`); await ctx.close();
  }
  evidence.checks.push("Native status patch: exact nodes/focus/revision retained, no story mutation, one live announcement, modal/scroll retained; high contrast, forced colors, reduced motion, opaque glass fallback; image/quota recovery visible");
  assert.deepEqual(evidence.errors, []);
  console.log(`PASS ${evidence.screenshots.length} screenshots; six viewports; native status/modal/fault checks`);
} finally {
  await writeFile(resolve(output, "visual-evidence.json"), `${JSON.stringify(evidence, null, 2)}\n`);
  await browser.close(); await new Promise((done) => server.close(done));
}
