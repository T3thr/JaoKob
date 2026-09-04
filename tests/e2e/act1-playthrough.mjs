/** Dev-only real-browser verification. No package install or runtime dependency. */
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { gzipSync } from "node:zlib";
import { createHash } from "node:crypto";
import { content, ROUTES, walk, envelope } from "../helpers/act1-session.js";

const playwright = await import(process.env.JKB_PLAYWRIGHT_PATH ? pathToFileURL(process.env.JKB_PLAYWRIGHT_PATH).href : "playwright");
const repo = resolve(fileURLToPath(new URL("../..", import.meta.url)));
const output = resolve(repo, "output/playwright");
await mkdir(output, { recursive: true });
const mime = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".json": "application/json" };
const transfers = [];
const server = createServer(async (request, response) => {
  try {
    let pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
    if (pathname.startsWith("/JaoKob/")) pathname = pathname.slice("/JaoKob".length);
    const file = resolve(repo, `.${pathname.endsWith("/") ? `${pathname}index.html` : pathname}`);
    if (!file.startsWith(`${repo}${sep}`)) { response.writeHead(403).end(); return; }
    const body = await readFile(file), compressed = gzipSync(body);
    transfers.push({ path: pathname, bytes: compressed.length, rawBytes: body.length, sha256: createHash("sha256").update(body).digest("hex") });
    response.writeHead(200, { "Content-Type": `${mime[extname(file)] ?? "application/octet-stream"}; charset=utf-8`, "Content-Encoding": "gzip", "Cache-Control": "no-store" });
    response.end(compressed);
  } catch { response.writeHead(404).end(); }
});
await new Promise((resolveListen) => server.listen(0, "127.0.0.1", resolveListen));
const origin = `http://127.0.0.1:${server.address().port}`;
const browser = await playwright.chromium.launch({ headless: process.env.JKB_HEADED !== "1" });
const evidence = { browser: browser.version(), platform: process.platform, at: new Date().toISOString(), routes: [], checks: [], screenshots: [], performance: {}, errors: [] };
const saveKey = "jaokob:save:canonical";
const save = (page) => page.evaluate((key) => JSON.parse(localStorage.getItem(key)), saveKey);
const choice = (page, id) => page.locator(`[data-choice-id="${id}"]`);
async function idle(page) { await page.waitForFunction(() => document.querySelector("#app")?.getAttribute("aria-busy") === "false"); }
async function click(page, id, key) {
  const before = await page.locator("#app").getAttribute("data-view-revision");
  if (key) { await choice(page, id).focus(); await page.keyboard.press(key); }
  else await choice(page, id).click();
  await page.waitForFunction((old) => document.querySelector("#app")?.getAttribute("data-view-revision") !== old, before);
  await idle(page);
}
async function screenshot(page, name) {
  await page.screenshot({ path: resolve(output, name), fullPage: true }); evidence.screenshots.push(name);
}
async function context(viewport = { width: 1280, height: 900 }) {
  const ctx = await browser.newContext({ viewport, reducedMotion: "reduce" });
  const page = await ctx.newPage();
  page.on("pageerror", (error) => evidence.errors.push(error.message));
  page.on("console", (message) => { if (message.type() === "error") evidence.errors.push(message.text()); });
  page.on("request", (request) => { if (!request.url().startsWith(origin) && !request.url().startsWith("data:")) evidence.errors.push(`External request: ${request.url()}`); });
  return { ctx, page };
}
async function open(page, subpath = "") { await page.goto(`${origin}${subpath}/index.html`); await choice(page, "application.new-game").waitFor(); await idle(page); }
async function noBond(page) {
  assert.equal(await page.locator('[data-jk-meter="bond"]').count(), 0);
  const session = await page.context().newCDPSession(page);
  const tree = await session.send("Accessibility.getFullAXTree"); await session.detach();
  assert.equal(tree.nodes.filter((node) => !node.ignored).some((node) => /ความผูกพัน|Bond/.test(node.name?.value ?? "")), false);
}
async function verifyRoute(page, route, hotspots, { keyboard = false, captures = false } = {}) {
  await click(page, "application.new-game", keyboard ? "Enter" : undefined);
  let capturedStorm = false, capturedConfirmation = false, maxBytes = 0;
  for (let steps = 0; await choice(page, "application.finish").count() === 0; steps += 1) {
    assert.ok(steps < 200);
    await noBond(page);
    assert.equal(await page.locator('[data-jk-role="dialogue"]').evaluate((el) => el === document.activeElement), true);
    const stored = await save(page), nodeId = stored.payload.currentNodeId;
    maxBytes = Math.max(maxBytes, Buffer.byteLength(JSON.stringify(stored)));
    if (captures && nodeId === "node.act1.storm" && !capturedStorm) {
      assert.equal(await page.locator('[data-jk-role="content-notice"]').count(), 1);
      await screenshot(page, "act1-storm.png"); capturedStorm = true;
    }
    let id;
    if (await choice(page, "application.advance").count()) id = "application.advance";
    else if (nodeId === "node.act1.nursery") id = hotspots.length ? `interaction.act1.observe-${hotspots.shift()}` : "interaction.act1.join-family";
    else if (nodeId === "node.act1.home-focus") id = `choice.act1.focus-${route.home}`;
    else if (nodeId === "node.act1.survival") id = `choice.act1.${route.coping}`;
    else if (nodeId === "node.act1.lily-fragment") id = "interaction.act1.inspect-fragment";
    else if (nodeId === "node.act1.keepsake") id = `choice.act1.${route.keepsake}`;
    else assert.fail(`Unexpected node: ${nodeId}`);
    const began = performance.now();
    await click(page, id, keyboard ? (steps % 2 ? "Space" : "Enter") : undefined);
    if (await choice(page, "application.confirm-choice").count()) {
      assert.deepEqual(await save(page), stored, "confirmation alone must not save");
      if (captures && !capturedConfirmation) { await screenshot(page, "act1-choice-confirmation.png"); capturedConfirmation = true; }
      await click(page, "application.confirm-choice", keyboard ? "Enter" : undefined);
    }
    evidence.performance.maxDriverActionMs = Math.max(evidence.performance.maxDriverActionMs ?? 0, performance.now() - began);
  }
  const final = await save(page), flags = Object.fromEntries(final.payload.flags.map((flag) => [flag.id, flag.value]));
  assert.deepEqual(final.payload.metrics, { hp: route.coping === "call-family" ? 75 : 85, sanity: 70 - (route.coping === "call-family" ? 10 : 5) + (route.keepsake === "keep-fragment" ? 10 : 5), bond: 0 });
  assert.equal(flags["memory.home_focus"], route.home);
  assert.equal(flags["coping.called_for_family"], route.coping === "call-family");
  assert.equal(flags["coping.sought_safety"], route.coping === "seek-safety");
  assert.equal(flags["keepsake.lily_fragment"], route.keepsake === "keep-fragment");
  assert.equal(flags["coping.let_go_early"], route.keepsake === "release-fragment");
  assert.equal(final.payload.checkpoint.nodeId, "node.act1.rest");
  assert.ok(final.payload.progress.completedNodeIds.includes("node.act1.rest"));
  if (captures) await screenshot(page, "act1-rest.png");
  await click(page, "application.finish");
  await page.reload(); await choice(page, "application.resume").waitFor(); await idle(page);
  await click(page, "application.resume"); assert.deepEqual(await save(page), final);
  assert.equal(await choice(page, "application.finish").count(), 1);
  evidence.performance.maxSaveBytes = Math.max(evidence.performance.maxSaveBytes ?? 0, maxBytes, Buffer.byteLength(JSON.stringify(final)));
  evidence.routes.push({ ...route, metrics: final.payload.metrics, observations: flags["exploration.safe_observations"], restResume: true });
}
try {
  // Twelve real browser journeys; first route uses keyboard, last uses repository subpath.
  for (const [index, route] of ROUTES.entries()) {
    const { ctx, page } = await context();
    const beforeTransfer = transfers.length;
    await open(page, index === 11 ? "/JaoKob" : "");
    if (index === 0) {
      evidence.performance.initialCompressedBytes = transfers.slice(beforeTransfer).reduce((sum, item) => sum + item.bytes, 0);
      evidence.performance.initialRawBytes = transfers.slice(beforeTransfer).reduce((sum, item) => sum + item.rawBytes, 0);
      evidence.performance.domContentLoadedMs = await page.evaluate(() => performance.getEntriesByType("navigation")[0].domContentLoadedEventEnd);
      assert.equal(await choice(page, "application.new-game").evaluate((el) => el === document.activeElement), true);
      await page.keyboard.press("Tab"); assert.equal(await choice(page, "application.settings").evaluate((el) => el === document.activeElement), true);
      await page.keyboard.press("Shift+Tab");
      const focus = await choice(page, "application.new-game").evaluate((el) => ({ width: parseFloat(getComputedStyle(el).outlineWidth), style: getComputedStyle(el).outlineStyle }));
      assert.ok(focus.width > 0 && focus.style !== "none");
      await screenshot(page, "act1-title-keyboard.png");
    }
    await verifyRoute(page, route, index % 3 === 0 ? [] : index % 3 === 1 ? ["roots"] : ["lily", "roots", "shadows", "mother", "mother"], { keyboard: index === 0, captures: index === 0 });
    await ctx.close();
    console.log(`PASS route ${index + 1}/12 ${Object.values(route).join(" / ")}`);
  }
  evidence.checks.push("12 Canon paths; keyboard Enter/Space/Tab; visible focus; no Bond in DOM or AX tree; saved rest reload; root/subpath");

  // Exact page Resume at a post-storm node, followed by stale/double click.
  {
    const { ctx, page } = await context();
    const snapshot = walk().find((s) => s.currentNodeId === "node.act1.storm" && s.progress.viewedDialogueIds.at(-1) === "dialogue.act1.storm-separation");
    const raw = JSON.stringify(envelope(snapshot));
    await ctx.addInitScript(({ key, raw }) => { if (!localStorage.getItem(key)) localStorage.setItem(key, raw); }, { key: saveKey, raw });
    await open(page); await click(page, "application.resume");
    assert.equal((await save(page)).payload.progress.viewedDialogueIds.at(-1), "dialogue.act1.storm-separation");
    await page.reload(); await choice(page, "application.resume").waitFor(); await click(page, "application.resume");
    assert.deepEqual((await save(page)).payload, snapshot && envelope(snapshot).payload);
    await choice(page, "application.advance").evaluate((button) => { button.click(); button.click(); }); await idle(page);
    assert.equal((await save(page)).revision, snapshot.revision + 1);
    evidence.checks.push("post-storm cursor reload/Resume; no on-enter replay; double click commits once"); await ctx.close();
  }

  // Viewport, text scaling, reduced motion, touch size and contrast samples.
  {
    const { ctx, page } = await context({ width: 320, height: 740 });
    await open(page); await click(page, "application.new-game");
    await page.evaluate(() => { document.documentElement.style.fontSize = "200%"; });
    const dimensions = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, width: innerWidth }));
    evidence.performance.reflow = dimensions;
    if (dimensions.scroll > dimensions.width) {
      evidence.reflowOverflow = await page.locator('body *').evaluateAll((elements) => elements.filter((el) => el.getBoundingClientRect().right > innerWidth).map((el) => ({ tag: el.tagName, class: el.className, width: el.getBoundingClientRect().width })));
      await screenshot(page, "act1-reflow-failure.png");
    }
    assert.ok(dimensions.scroll <= dimensions.width, "320 CSS px / 200% text must reflow");
    const targets = await page.locator('button').evaluateAll((buttons) => buttons.map((button) => ({ width: button.getBoundingClientRect().width, height: button.getBoundingClientRect().height })));
    assert.ok(targets.every((target) => target.width >= 44 && target.height >= 44));
    assert.equal(await page.locator('.jk-scene-enter').evaluate((el) => getComputedStyle(el).animationName), "none");
    const colors = await page.evaluate(() => {
      const style = (selector) => getComputedStyle(document.querySelector(selector));
      return [[style('.jk-scene-title').color, style('.jk-hud').backgroundColor], [style('button').color, style('button').backgroundColor], [style('.jk-first-run-notice p').color, style('.jk-first-run-notice').backgroundColor]];
    });
    const lum = (color) => color.match(/[\d.]+/g).slice(0, 3).map(Number).map((x) => x / 255).map((x) => x <= .04045 ? x / 12.92 : ((x + .055) / 1.055) ** 2.4).reduce((sum, x, i) => sum + x * [.2126, .7152, .0722][i], 0);
    const ratios = colors.map(([fg, bg]) => (Math.max(lum(fg), lum(bg)) + .05) / (Math.min(lum(fg), lum(bg)) + .05));
    assert.ok(ratios.every((ratio) => ratio >= 4.5));
    evidence.performance.contrastRatios = ratios;
    await screenshot(page, "act1-mobile-320-text200.png");
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await click(page, "application.settings"); await click(page, "application.toggle-motion"); await click(page, "application.close-settings");
    assert.equal(await page.locator('.jk-scene-enter').evaluate((el) => getComputedStyle(el).animationName), "none");
    evidence.checks.push("320 CSS px + 200% text; 44 px targets; contrast samples >=4.5; OS and application reduced-motion"); await ctx.close();
  }

  // Old/corrupt data protection with real LocalStorage and explicit cancel/confirm.
  for (const kind of ["old", "corrupt"]) {
    const { ctx, page } = await context();
    const prior = envelope(walk()[0]); prior.contentVersion = "1.0.0";
    const raw = kind === "old" ? JSON.stringify(prior) : "{corrupt";
    await ctx.addInitScript(({ key, raw }) => localStorage.setItem(key, raw), { key: saveKey, raw });
    await open(page); await click(page, "application.new-game"); await click(page, "application.cancel-replace");
    assert.equal(await page.evaluate((key) => localStorage.getItem(key), saveKey), raw);
    await click(page, "application.new-game"); await click(page, "application.confirm-replace");
    assert.equal((await save(page)).contentVersion, "2.0.0");
    evidence.checks.push(`${kind} save: byte preservation on cancel, explicit replace consent`); await ctx.close();
  }

  for (const fault of ["parse", "schema", "quota", "unavailable"]) {
    const { ctx, page } = await context();
    if (["parse", "schema"].includes(fault)) {
      await page.route("**/packages/act-01.json", (route) => route.fulfill({ status: 200, contentType: "application/json", body: fault === "parse" ? "{" : '{"invalid":true}' }));
      await page.goto(`${origin}/index.html`); await page.locator('[data-jk-role="fatal-shell"]').waitFor();
      assert.equal(await page.evaluate((key) => localStorage.getItem(key), saveKey), null);
      await page.unroute("**/packages/act-01.json");
      await page.locator(`[data-jk-action="${fault === "parse" ? "reload-application" : "retry-render"}"]`).click(); await choice(page, "application.new-game").waitFor();
    } else {
      await ctx.addInitScript((fault) => {
        const method = fault === "quota" ? "setItem" : "getItem";
        Storage.prototype[method] = function () { throw new DOMException("Test storage fault", fault === "quota" ? "QuotaExceededError" : "SecurityError"); };
      }, fault);
      await open(page); await click(page, "application.new-game"); await click(page, "application.advance");
      assert.match(await page.locator('#app').textContent(), /ยังบันทึกลงอุปกรณ์ไม่ได้/);
      assert.equal(await choice(page, "application.advance").isEnabled(), true);
    }
    evidence.checks.push(`${fault} negative browser smoke`); await ctx.close();
  }
  assert.ok(evidence.performance.initialCompressedBytes <= 500_000);
  assert.ok(evidence.performance.initialCompressedBytes <= 2_000_000);
  assert.ok(evidence.performance.maxSaveBytes <= 250_000);
  assert.deepEqual(evidence.errors, []);
  evidence.result = "PASS";
  console.log(JSON.stringify(evidence, null, 2));
} catch (error) {
  evidence.result = "FAIL"; evidence.failure = error.stack; throw error;
} finally {
  evidence.runtimeFiles = [...new Map(transfers.map((item) => [item.path, item])).values()].sort((a, b) => a.path.localeCompare(b.path));
  await writeFile(resolve(output, "act1-evidence.json"), `${JSON.stringify(evidence, null, 2)}\n`);
  await browser.close(); await new Promise((close) => server.close(close));
}
