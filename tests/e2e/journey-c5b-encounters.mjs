/**
 * C5b browser evidence (T5): the camp, the micro-actions and the keepsake offer on the real Journey
 * application through the PO review page, in a real Chromium. The offer, the hold and the stitch
 * come from the mini package (`play.html?package=mini`), because Act 1 has none of them.
 *
 *   JKB_PLAYWRIGHT_PATH=/abs/path/playwright/index.mjs node tests/e2e/journey-c5b-encounters.mjs
 *   JKB_EVIDENCE_DIR=/abs/out overrides the output folder (default tests/e2e/evidence/sprint-05/c5b)
 *   JKB_CHROMIUM_PATH=/abs/path/to/chromium uses a Chromium already on the machine when the
 *   installed Playwright expects another browser build (nothing is downloaded)
 *
 * Checks (TC-S5-UX-001 · TC-S5-INLINE-001 · TC-S5-A11Y-001):
 *   - 5 viewports × text 100 / 200 % × six states (the C1 board, C1 after one drop with the
 *     activity's line, MA-1 tap, a hold, a stitch, the keepsake offer): no sideways or nested
 *     scroll, every visible button ≥ 44 × 44, the dock panel below the face band (fit) or the
 *     stage as a top strip (flow), the camp clock never over a panel, the stitch guide points
 *     drawn 28–32 px wide with a 44 px reach;
 *   - keyboard only: the camp (digits, arm and commit, Space through the lines, Enter on leave),
 *     MA-1 (Space three times) and the offer (digits) reach the next node;
 *   - layout shift while the camp board and the activity lines swap;
 *   - no console error and no request outside the page's origin.
 * Exits 1 on any failure. Screenshots (JPEG, CSS pixels) and `report.json` go to the evidence
 * directory. Not run: Safari/WebKit, physical devices, screen-reader listening, PO visual acceptance.
 */
import { createServer } from "node:http";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { execFileSync } from "node:child_process";

const repo = resolve(fileURLToPath(new URL("../..", import.meta.url)));
const output = resolve(process.env.JKB_EVIDENCE_DIR ?? resolve(repo, "tests/e2e/evidence/sprint-05/c5b"));
await mkdir(output, { recursive: true });
const playwrightPath = process.env.JKB_PLAYWRIGHT_PATH;
const playwright = await import(playwrightPath ? pathToFileURL(playwrightPath).href : "playwright");
const { chromium } = playwright.default ?? playwright;

const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".json": "application/json", ".webp": "image/webp", ".woff2": "font/woff2", ".svg": "image/svg+xml" };
const ALLOWED = ["/src/", "/assets/", "/docs/design-system/evidence/journey-review/", "/tests/fixtures/journey/"];
const server = createServer(async (request, response) => {
  try {
    const path = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
    const file = resolve(repo, `.${path}`);
    if (!file.startsWith(`${repo}${sep}`) || !ALLOWED.some((prefix) => path.startsWith(prefix)) || !(await stat(file)).isFile()) { response.writeHead(404).end(); return; }
    response.writeHead(200, { "Content-Type": MIME[extname(file)] ?? "application/octet-stream", "Cache-Control": "no-store" });
    response.end(await readFile(file));
  } catch { response.writeHead(404).end(); }
});
await new Promise((done) => server.listen(0, "127.0.0.1", done));
const origin = `http://127.0.0.1:${server.address().port}`;
const PLAY = `${origin}/docs/design-system/evidence/journey-review/play.html`;

const VIEWPORTS = [[320, 568], [390, 844], [844, 390], [768, 1024], [1440, 900]];
const SCALES = [1, 2];
const SHOTS = new Set(["390x844-1", "1440x900-1", "844x390-1", "390x844-2"]);
/** [name, package, predicate, then] — `then` runs real clicks on the page after the state is reached. */
const STATES = [
  ["camp-board", "act1", "(m) => m.mode === 'CAMP'", null],
  ["camp-drop-line", "act1", "(m) => m.mode === 'CAMP'", "kab"],
  ["micro-tap3", "act1", "(m) => m.mode === 'MICRO'", null],
  ["pouch-offer", "mini", "(m) => m.mode === 'POUCH_SWAP'", null],
  ["micro-hold", "mini", "(m) => m.mode === 'MICRO' && m.micro?.kind === 'hold'", null],
  ["micro-stitch", "mini", "(m) => m.mode === 'MICRO' && m.micro?.kind === 'stitch'", null],
];
const evidence = {
  runner: "tests/e2e/journey-c5b-encounters.mjs",
  head: execFileSync("git", ["rev-parse", "HEAD"], { cwd: repo, encoding: "utf8" }).trim(),
  requirements: ["TC-S5-UX-001", "TC-S5-INLINE-001", "TC-S5-A11Y-001"],
  layout: [], keyboard: [], layoutShift: [], screenshots: [], failures: [], errors: [],
  notRun: ["Safari/WebKit and Firefox", "physical iPhone and Android", "VoiceOver and NVDA listening", "PO visual acceptance", "sound of the taps (audio arrives with T7)"],
};
const check = (condition, message) => { if (!condition) evidence.failures.push(message); };

const browser = await chromium.launch(process.env.JKB_CHROMIUM_PATH ? { executablePath: process.env.JKB_CHROMIUM_PATH } : {});
evidence.browser = browser.version();

async function open(pkg, options = {}, settings = null) {
  const context = await browser.newContext({ deviceScaleFactor: 1, reducedMotion: "reduce", ...options });
  const page = await context.newPage();
  page.on("pageerror", (error) => evidence.errors.push(error.message));
  page.on("console", (message) => { if (message.type() === "error") evidence.errors.push(message.text()); });
  page.on("request", (request) => { if (!request.url().startsWith(origin) && !/^(data|blob):/.test(request.url())) evidence.errors.push(`external ${request.url()}`); });
  await page.goto(pkg === "mini" ? `${PLAY}?package=mini` : PLAY);
  await page.waitForFunction(() => document.documentElement.dataset.reviewReady === "true");
  await page.evaluate((patch) => {
    const shell = window.journeyReview.shell;
    shell.newGame({ consentToken: shell.snapshot().title?.consentToken ?? null });
    if (patch) shell.changeSettings(patch);
  }, settings);
  return { context, page };
}
const reach = (page, predicate) => page.evaluate((source) => window.journeyReview.playUntil(new Function("m", `return (${source})(m)`)), predicate);
const model = (page) => page.evaluate(() => { const m = window.journeyReview.shell.snapshot().model; return { mode: m.mode, node: m.scene.nodeId, revision: m.revision }; });
const settle = (page) => page.waitForTimeout(450);

/** Layout facts of the current screen. */
function layoutFacts(page) {
  return page.evaluate(() => {
    const box = (element) => { const r = element.getBoundingClientRect(); return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height }; };
    const root = document.querySelector(".jk-journey");
    const visible = (element) => !element.closest("[hidden]") && element.getBoundingClientRect().width > 0;
    const panel = [...document.querySelectorAll(".jk-dialogue, .jk-choices, .jk-camp, .jk-micro, .jk-pouch-sheet")].find(visible);
    const timer = document.querySelector(".jk-camp-timer");
    const nested = [...root.querySelectorAll("*")].filter((element) => { const style = getComputedStyle(element); return /(auto|scroll)/.test(style.overflowY + style.overflowX) && (element.scrollHeight > element.clientHeight + 1 || element.scrollWidth > element.clientWidth + 1); }).map((element) => element.className);
    const targets = [...root.querySelectorAll("button")].filter(visible).map((button) => ({ name: button.className, ...box(button) })).filter((b) => b.width < 43.5 || b.height < 43.5);
    const guides = [...document.querySelectorAll(".jk-micro__guide")].filter(visible).map((guide) => Math.round(guide.getBoundingClientRect().width * 10) / 10);
    return {
      width: innerWidth, height: innerHeight, scrollWidth: document.documentElement.scrollWidth,
      mode: root.dataset.overflow === "true" ? "flow" : "fit", screen: root.dataset.mode,
      band: [innerHeight * 0.32, innerHeight * 0.48], stage: box(document.querySelector(".jk-stage")),
      panel: panel ? { name: panel.className, ...box(panel) } : null,
      timer: timer && visible(timer) ? box(timer) : null, nested, smallTargets: targets, guides,
    };
  });
}
const overlap = (a, b) => a !== null && b !== null && a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;

// ---------------------------------------------------------------------- layout matrix
for (const [width, height] of VIEWPORTS) {
  for (const scale of SCALES) {
    for (const [name, pkg, predicate, pick] of STATES) {
      const { context, page } = await open(pkg, { viewport: { width, height } }, scale === 1 ? null : { fontScale: scale });
      await reach(page, predicate);
      if (pick !== null) {
        await page.click(`.jk-camp .jk-card[data-key="${pick}"]`);
        await page.click(`.jk-camp .jk-card[data-key="${pick}"]`);
      }
      await settle(page);
      const facts = await layoutFacts(page);
      const tag = `${width}x${height} text ${scale * 100}% ${name}`;
      check(facts.panel !== null, `${tag}: no panel in the dock`);
      check(facts.scrollWidth <= facts.width, `${tag}: sideways scroll ${facts.scrollWidth}`);
      check(facts.nested.length === 0, `${tag}: nested scroll ${facts.nested.join(",")}`);
      check(facts.smallTargets.length === 0, `${tag}: small targets ${JSON.stringify(facts.smallTargets)}`);
      if (facts.mode === "fit") check(facts.panel === null || facts.panel.top >= facts.band[1] - 0.5, `${tag}: the panel rises into the face band (${facts.panel?.top})`);
      else check(facts.panel === null || facts.panel.top >= facts.stage.bottom - 0.5, `${tag}: flow puts the panel over the stage strip`);
      check(!overlap(facts.timer, facts.panel), `${tag}: the camp clock covers the panel`);
      if (name === "camp-drop-line") check(facts.timer !== null && facts.screen === "VN", `${tag}: the clock stays while the activity's line is read`);
      if (name === "micro-stitch") check(facts.guides.length === 3 && facts.guides.every((size) => size >= 28 && size <= 32), `${tag}: guide points ${facts.guides.join(",")}`);
      evidence.layout.push({ tag, mode: facts.mode, screen: facts.screen, panel: facts.panel === null ? null : Math.round(facts.panel.top), timer: facts.timer === null ? null : Math.round(facts.timer.top), guides: facts.guides });
      if (SHOTS.has(`${width}x${height}-${scale}`)) {
        const file = `${width}x${height}-text${scale * 100}-${name}.jpg`;
        await page.screenshot({ path: resolve(output, file), type: "jpeg", quality: 70, fullPage: facts.mode === "flow" });
        evidence.screenshots.push(file);
      }
      await context.close();
    }
  }
}

// ------------------------------------------------ keyboard only · layout shift
{
  const { context, page } = await open("act1", { viewport: { width: 390, height: 844 } });
  await page.evaluate(() => {
    window.__shift = 0;
    new PerformanceObserver((list) => { for (const entry of list.getEntries()) if (!entry.hadRecentInput) window.__shift += entry.value; }).observe({ type: "layout-shift", buffered: false });
  });
  await reach(page, "(m) => m.mode === 'CAMP'");
  await settle(page);
  const start = await model(page);
  await page.keyboard.press("1");
  await page.keyboard.press("1");
  await settle(page);
  const afterPick = await model(page);
  await page.keyboard.press("Space");
  await settle(page);
  await page.keyboard.press("4");
  await page.keyboard.press("4");
  await settle(page);
  await page.keyboard.press("Space");
  await settle(page);
  const finished = await page.evaluate(() => ({ focus: document.activeElement?.className ?? null, leave: document.querySelector(".jk-camp__leave").getAttribute("aria-disabled") }));
  await page.keyboard.press("Enter");
  await settle(page);
  const left = await model(page);
  evidence.keyboard.push({ flow: "camp", start, afterPick, finished, left });
  check(afterPick.mode === "VN" && afterPick.revision === start.revision + 1, `keyboard camp pick: ${JSON.stringify(afterPick)}`);
  check(finished.focus?.includes("jk-camp__leave") && finished.leave === null, `keyboard camp: focus on the open leave button ${JSON.stringify(finished)}`);
  check(left.node === "a1-11", `keyboard camp leave: ${JSON.stringify(left)}`);
  evidence.layoutShift.push({ during: "camp board, two activities and their lines, leave", cumulative: await page.evaluate(() => Math.round(window.__shift * 10000) / 10000) });
  check((await page.evaluate(() => window.__shift)) <= 0.001, "layout shift while the camp and its lines swap");
  for (let i = 0; i < 60; i += 1) {
    if ((await model(page)).mode === "MICRO") break;
    await page.keyboard.press("Space");
  }
  const micro = await model(page);
  for (let i = 0; i < 3; i += 1) await page.keyboard.press("Space");
  await page.waitForTimeout(1800);
  const afterMicro = await model(page);
  evidence.keyboard.push({ flow: "MA-1", micro, afterMicro });
  check(micro.mode === "MICRO" && afterMicro.node === "a1-13", `keyboard MA-1: ${JSON.stringify({ micro, afterMicro })}`);
  await context.close();
}
{
  const { context, page } = await open("mini", { viewport: { width: 390, height: 844 } });
  await reach(page, "(m) => m.mode === 'POUCH_SWAP'");
  await settle(page);
  const offer = await model(page);
  await page.keyboard.press("1");
  await page.keyboard.press("1");
  await settle(page);
  const taken = await page.evaluate(() => ({ mode: window.journeyReview.shell.snapshot().model.mode, held: window.journeyReview.shell.snapshot().model.hud.pouch.slots.filter(Boolean).map((slot) => slot.item) }));
  evidence.keyboard.push({ flow: "pouch offer", offer, taken });
  check(offer.mode === "POUCH_SWAP" && taken.held.includes("item_teuk_whistle_charm"), `keyboard offer: ${JSON.stringify(taken)}`);
  await context.close();
}

await browser.close();
server.close();
check(evidence.errors.length === 0, `console or network: ${evidence.errors.join(" | ")}`);
evidence.passed = evidence.failures.length === 0;
await writeFile(resolve(output, "report.json"), `${JSON.stringify(evidence, null, 2)}\n`);
console.log(`C5b browser evidence: ${evidence.layout.length} layout states, ${evidence.screenshots.length} screenshots, ${evidence.failures.length} failures`);
for (const failure of evidence.failures) console.log(`  FAIL ${failure}`);
process.exit(evidence.failures.length === 0 ? 0 : 1);
