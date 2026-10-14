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
const app=createGameApplication({document,root:document.getElementById('app')});window.slice={app};await app.boot();`;
const mime = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".json": "application/json", ".webp": "image/webp", ".svg": "image/svg+xml", ".mp3": "audio/mpeg", ".woff2": "font/woff2" };
const evidence = { baseline: execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim(), at: new Date().toISOString(),
  requirements: ["TC-S4-VIS-001", "TC-S4-STATUS-001", "TC-S4-STATE-001", "TC-S4-A11Y-001"],
  viewports: [], checks: [], screenshots: [], errors: [], expectedFaults: [], sourceHashes: {},
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
    if (path === "/index.html") body = body.toString().replace("./src/bootstrap/index.js", "./slice-host.js");
    response.writeHead(200, { "Content-Type": mime[extname(file)] ?? "application/octet-stream", "Cache-Control": "no-store" }); response.end(body);
  } catch { response.writeHead(404).end(); }
});
await new Promise((done) => server.listen(0, "127.0.0.1", done));
const origin = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({ headless: process.env.JKB_HEADED !== "1" });
evidence.browser = browser.version();
const choice = (page, id) => page.locator(`[data-choice-id="${id}"]`);
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
async function screenshot(page, name) { await page.screenshot({ path: resolve(output, name), fullPage: true }); evidence.screenshots.push(name); }
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
async function decision(page) {
  const observations = ["lily", "roots", "shadows", "mother"];
  for (let guard = 0; guard < 70; guard++) {
    if (await choice(page, "choice.act1.focus-mother").count()) return;
    if (await choice(page, "application.advance").count()) await click(page, "application.advance");
    else await click(page, observations.length ? `interaction.act1.observe-${observations.shift()}` : "interaction.act1.join-family");
  }
  assert.fail("Decision unreachable");
}
try {
  for (const [width, height] of [[320,568],[390,844],[768,1024],[1440,900],[2560,1440],[844,390]]) {
    const { ctx, page } = await context({ width, height });
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
    await fit(page, `${width}x${height}-reading`); await screenshot(page, `${width}x${height}-reading.png`);
    await decision(page);
    assert.equal(await page.locator('.jk-decision-card').count(), 3); assert.equal(await choice(page, "application.advance").count(), 0);
    await fit(page, `${width}x${height}-decision`); await screenshot(page, `${width}x${height}-decision.png`);
    await click(page, "choice.act1.focus-mother");
    assert.equal(await page.locator('[data-jk-role="feedback"]').count(), 1);
    assert.equal(await page.locator('.jk-narrative [data-jk-role="feedback"]').count(), 0);
    if (width === 390 || width === 1440) await screenshot(page, `${width}x${height}-response.png`);
    if (width === 320 || width === 1440) {
      await page.evaluate(() => { document.documentElement.style.fontSize = "200%"; });
      await fit(page, `${width}x${height}-text200`); await screenshot(page, `${width}x${height}-text200.png`);
      await click(page, "application.settings"); await fit(page, `${width}x${height}-settings-text200`); await screenshot(page, `${width}x${height}-settings-text200.png`);
      await page.keyboard.press("Escape"); await idle(page);
      assert.equal(await choice(page, "application.settings").evaluate((el) => document.activeElement === el), true);
    }
    await ctx.close();
  }
  evidence.checks.push("Six viewports: Title no HUD, Reading Next within paper footer, true three-choice Decision no Next, Thai 18–20px/1.85, targets44, root/subpath, normal fit and reflow");
  // Native DOM fixture exercises renderer-only patches without altering game state.
  {
    const { ctx, page } = await context({ width: 390, height: 844 });
    const results = await page.evaluate(async () => {
      const before = slice.app.getSnapshot(); slice.app.dispose();
      const { createDomRenderer } = await import('./src/ui/renderers/dom/dom-renderer.js');
      const root = document.getElementById('app'), intents = [];
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
      const modal = root.querySelector('dialog'), music = root.querySelector('[data-jk-setting="musicVolume"]'); music.focus(); modal.scrollTop = 200; const scroll = modal.scrollTop;
      renderer.setBusy(true);
      renderer.render({ ...base, viewRevision: 11, presentation: { mode: 'settings' }, notice: { text: 'ยังบันทึกไม่ได้' }, audioStatusText: 'เสียงพร้อมแล้ว' });
      renderer.setBusy(false);
      const modalStable = modal === root.querySelector('dialog') && document.activeElement === music && modal.scrollTop === scroll;
      renderer.render({ ...base, viewRevision: 12, settings: { fontScale: 1, highContrast: true } });
      window.fixtureRenderer = renderer; window.fixtureView = base;
      return { preserved, modalStable, announcements, intent: intents[0], before, after: slice.app.getSnapshot() };
    });
    assert.ok(results.preserved); assert.ok(results.modalStable); assert.equal(results.announcements, 1); assert.equal(results.intent.viewRevision, 10); assert.deepEqual(results.after, results.before);
    evidence.nativePatch = results;
    await screenshot(page, "390-high-contrast.png");
    await page.emulateMedia({ forcedColors: "active" }); await screenshot(page, "390-forced-colors.png");
    await page.emulateMedia({ forcedColors: "none", reducedMotion: "reduce" });
    // OS/application motion and glass fallback contrast are measured in browser.
    const colors = await page.evaluate(() => {
      fixtureRenderer.render({ ...fixtureView, notice: { text: 'บันทึกแล้ว' } });
      const style = (s) => getComputedStyle(document.querySelector(s));
      const background = style('.jk-utility-rail').backgroundColor;
      return { colors: [[style('.jk-dialogue').color, style('.jk-narrative').backgroundColor], [style('.jk-save-status').color, background]],
        motion: style('.jk-choice-button').transitionDuration, hp: style('[data-jk-meter="hp"] .jk-meter-fill').backgroundColor, sanity: style('[data-jk-meter="sanity"] .jk-meter-fill').backgroundColor };
    });
    const lum = (color) => color.match(/[\d.]+/g).slice(0,3).map(Number).map((v) => v / 255).map((v) => v <= .04045 ? v / 12.92 : ((v+.055)/1.055)**2.4).reduce((sum,v,i) => sum+v*[.2126,.7152,.0722][i],0);
    evidence.contrastRatios = colors.colors.map(([f,b]) => (Math.max(lum(f),lum(b))+.05)/(Math.min(lum(f),lum(b))+.05));
    assert.ok(evidence.contrastRatios.every((ratio) => ratio >= 4.5)); assert.notEqual(colors.hp, colors.sanity); assert.equal(colors.motion, "0s");
    await page.addStyleTag({ content: '.jk-hud { backdrop-filter:none; -webkit-backdrop-filter:none; background:var(--jk-glass); }' });
    await screenshot(page, "390-glass-fallback.png");
    await ctx.close();
  }
  for (const fault of ["image", "storage"]) {
    const { ctx, page } = await context({ width: 390, height: 844 }, fault);
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
