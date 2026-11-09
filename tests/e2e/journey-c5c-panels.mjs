/**
 * C5c browser evidence (T5): the real title, the settings and pouch modals, the three-strand
 * ending cards and the chapter end, on the real Journey application through the PO review page,
 * in a real Chromium. The ending choice comes from the mini package (`play.html?package=mini`).
 *
 *   JKB_PLAYWRIGHT_PATH=/abs/path/playwright/index.mjs node tests/e2e/journey-c5c-panels.mjs
 *   JKB_EVIDENCE_DIR=/abs/out overrides the output folder (default tests/e2e/evidence/sprint-05/c5c)
 *   JKB_CHROMIUM_PATH=/abs/path/to/chromium uses a Chromium already on the machine (nothing is downloaded)
 *
 * Checks (TC-S5-A11Y-001 · TC-S5-UX-001 · TC-S5-SAVE-001):
 *   - 5 viewports × text 100 / 200 % × five states (title, settings modal, pouch modal with its
 *     memory, the ending cards, the chapter end): no sideways scroll, every visible button ≥ 44 × 44,
 *     a modal inside the viewport with its close button in view, the ending cards and the chapter
 *     end below the face band (fit) or the stage strip (flow);
 *   - keyboard only: Enter on the title starts, I opens the pouch, Escape closes it and gives focus
 *     back, Tab stays inside the settings modal, the chapter end leads back to the title;
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
const output = resolve(process.env.JKB_EVIDENCE_DIR ?? resolve(repo, "tests/e2e/evidence/sprint-05/c5c"));
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
const STATES = ["title", "settings", "pouch", "endings", "chapter-end"];
const evidence = {
  runner: "tests/e2e/journey-c5c-panels.mjs",
  head: execFileSync("git", ["rev-parse", "HEAD"], { cwd: repo, encoding: "utf8" }).trim(),
  requirements: ["TC-S5-A11Y-001", "TC-S5-UX-001", "TC-S5-SAVE-001"],
  layout: [], keyboard: [], screenshots: [], failures: [], errors: [],
  notRun: ["Safari/WebKit and Firefox", "physical iPhone and Android", "VoiceOver and NVDA listening", "PO visual acceptance"],
};
const check = (condition, message) => { if (!condition) evidence.failures.push(message); };

const browser = await chromium.launch(process.env.JKB_CHROMIUM_PATH ? { executablePath: process.env.JKB_CHROMIUM_PATH } : {});
evidence.browser = browser.version();

async function open(pkg, options = {}) {
  const context = await browser.newContext({ deviceScaleFactor: 1, reducedMotion: "reduce", ...options });
  const page = await context.newPage();
  page.on("pageerror", (error) => evidence.errors.push(error.message));
  page.on("console", (message) => { if (message.type() === "error") evidence.errors.push(message.text()); });
  page.on("request", (request) => { if (!request.url().startsWith(origin) && !/^(data|blob):/.test(request.url())) evidence.errors.push(`external ${request.url()}`); });
  await page.goto(pkg === "mini" ? `${PLAY}?package=mini` : PLAY);
  await page.waitForFunction(() => document.documentElement.dataset.reviewReady === "true");
  return { context, page };
}
const start = (page, settings) => page.evaluate((patch) => {
  const shell = window.journeyReview.shell;
  if (patch) shell.changeSettings(patch);
  shell.newGame({ consentToken: shell.snapshot().title?.consentToken ?? null });
}, settings);
const reach = (page, predicate) => page.evaluate((source) => window.journeyReview.playUntil(new Function("m", `return (${source})(m)`)), predicate);
const settle = (page) => page.waitForTimeout(450);

/** Bring the page to one of the five states. */
async function into(page, state, scale) {
  const settings = scale === 1 ? null : { fontScale: scale };
  if (state === "title") {
    if (settings) await page.evaluate((patch) => window.journeyReview.shell.changeSettings(patch), settings);
    return;
  }
  await start(page, settings);
  if (state === "settings") {
    await reach(page, "(m) => m.scene.nodeId === 'a1-03' && m.mode === 'VN'");
    await page.click(".jk-settings");
  } else if (state === "pouch") {
    await reach(page, "(m) => m.mode === 'POUCH_SWAP'");
    await page.evaluate(() => window.journeyReview.shell.perform("pouchDecide", { option: "refuse" }));
    await page.keyboard.press("i");
  } else if (state === "endings") {
    await reach(page, "(m) => m.mode === 'ENDING_RESONANCE'");
  } else {
    await reach(page, "(m) => m.mode === 'BOUNDARY'");
  }
}

function facts(page, state) {
  return page.evaluate((name) => {
    const box = (element) => { const r = element.getBoundingClientRect(); return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height }; };
    const visible = (element) => element !== null && !element.closest("[hidden]") && element.getBoundingClientRect().width > 0;
    const game = [...document.querySelectorAll(".jk-journey")].find(visible);
    const dialog = [...document.querySelectorAll("dialog.jk-modal")].find((node) => node.open);
    const scope = dialog ?? game;
    const targets = [...scope.querySelectorAll("button, label.jk-switch, .jk-scale__text")].filter(visible).map((node) => ({ name: node.className, ...box(node) })).filter((b) => b.width < 43.5 || b.height < 43.5);
    const panel = [...document.querySelectorAll(".jk-endings, .jk-chapter-end")].find(visible);
    const close = dialog ? dialog.querySelector(".jk-modal__close") : null;
    return {
      width: innerWidth, height: innerHeight, scrollWidth: document.documentElement.scrollWidth, band: [innerHeight * 0.32, innerHeight * 0.48],
      flow: game?.dataset.overflow === "true", stage: game?.querySelector(".jk-stage") ? box(game.querySelector(".jk-stage")) : null,
      title: name === "title" ? visible(document.querySelector(".jk-title")) : null,
      dialog: dialog ? box(dialog) : null, close: close ? box(close) : null, panel: panel ? box(panel) : null, smallTargets: targets,
      focus: document.activeElement?.className ?? null,
    };
  }, state);
}

// ---------------------------------------------------------------------- layout matrix
for (const [width, height] of VIEWPORTS) {
  for (const scale of SCALES) {
    for (const state of STATES) {
      const pkg = state === "pouch" || state === "endings" ? "mini" : "act1";
      const { context, page } = await open(pkg, { viewport: { width, height } });
      await into(page, state, scale);
      await settle(page);
      const f = await facts(page, state);
      const tag = `${width}x${height} text ${scale * 100}% ${state}`;
      check(f.scrollWidth <= f.width, `${tag}: sideways scroll ${f.scrollWidth}`);
      check(f.smallTargets.length === 0, `${tag}: small targets ${JSON.stringify(f.smallTargets)}`);
      if (state === "title") check(f.title === true, `${tag}: the title is not shown`);
      if (state === "settings" || state === "pouch") {
        check(f.dialog !== null, `${tag}: no modal open`);
        check(f.dialog === null || (f.dialog.top >= -0.5 && f.dialog.bottom <= f.height + 0.5 && f.dialog.left >= -0.5 && f.dialog.right <= f.width + 0.5), `${tag}: the modal leaves the viewport ${JSON.stringify(f.dialog)}`);
        check(f.close !== null && f.close.top >= 0 && f.close.bottom <= f.height, `${tag}: the close button is out of view`);
      }
      if (state === "endings" || state === "chapter-end") {
        check(f.panel !== null, `${tag}: no panel`);
        if (f.panel !== null) check(f.flow ? f.panel.top >= f.stage.bottom - 0.5 : f.panel.top >= f.band[1] - 0.5, `${tag}: the panel rises into the face band (${Math.round(f.panel.top)})`);
      }
      evidence.layout.push({ tag, flow: f.flow, dialog: f.dialog === null ? null : [Math.round(f.dialog.top), Math.round(f.dialog.bottom)], panel: f.panel === null ? null : Math.round(f.panel.top), focus: f.focus });
      if (SHOTS.has(`${width}x${height}-${scale}`)) {
        const file = `${width}x${height}-text${scale * 100}-${state}.jpg`;
        await page.screenshot({ path: resolve(output, file), type: "jpeg", quality: 70, fullPage: f.flow && !f.dialog });
        evidence.screenshots.push(file);
      }
      await context.close();
    }
  }
}

// ------------------------------------------------------------------- keyboard only
{
  const { context, page } = await open("act1", { viewport: { width: 390, height: 844 } });
  const focusOn = () => page.evaluate(() => document.activeElement?.getAttribute("data-action") ?? document.activeElement?.className ?? null);
  const titleFocus = await focusOn();
  await page.keyboard.press("Enter");
  await settle(page);
  const started = await page.evaluate(() => window.journeyReview.shell.snapshot().phase);
  await page.keyboard.press("Space");
  await page.keyboard.press("i");
  await settle(page);
  const pouchOpen = await page.evaluate(() => document.querySelector("dialog[data-modal='pouch']")?.open === true);
  await page.keyboard.press("Escape");
  await settle(page);
  const afterEscape = await page.evaluate(() => ({ open: document.querySelector("dialog[data-modal='pouch']")?.open === true, focus: document.activeElement?.className ?? null }));
  await page.click(".jk-settings");
  await settle(page);
  const inside = [];
  for (let i = 0; i < 14; i += 1) {
    await page.keyboard.press("Tab");
    inside.push(await page.evaluate(() => document.querySelector("dialog[data-modal='settings']").contains(document.activeElement)));
  }
  await page.keyboard.press("Escape");
  const gearFocus = await page.evaluate(() => document.activeElement?.classList.contains("jk-settings") === true);
  await page.evaluate(() => window.journeyReview.playUntil((m) => m.mode === "BOUNDARY"));
  await settle(page);
  const endFocus = await focusOn();
  await page.keyboard.press("Enter");
  await settle(page);
  const back = await page.evaluate(() => ({ phase: window.journeyReview.shell.snapshot().phase, focus: document.activeElement?.getAttribute("data-action") ?? null }));
  evidence.keyboard.push({ titleFocus, started, pouchOpen, afterEscape, tabStaysInside: inside.every(Boolean), gearFocus, endFocus, back });
  check(titleFocus === "start" && started === "playing", `keyboard: Enter on the title starts (${titleFocus}, ${started})`);
  check(pouchOpen && !afterEscape.open && afterEscape.focus?.includes("jk-dialogue__next"), `keyboard: I opens the pouch and Escape gives focus back ${JSON.stringify(afterEscape)}`);
  check(inside.every(Boolean), "keyboard: Tab left the settings modal");
  check(gearFocus, "keyboard: Escape gives focus back to the gear");
  check(endFocus === "leave" && back.phase === "title" && back.focus === "continue", `keyboard: the chapter end leads back to the title ${JSON.stringify({ endFocus, back })}`);
  await context.close();
}

await browser.close();
server.close();
check(evidence.errors.length === 0, `console or network: ${evidence.errors.join(" | ")}`);
evidence.passed = evidence.failures.length === 0;
await writeFile(resolve(output, "report.json"), `${JSON.stringify(evidence, null, 2)}\n`);
console.log(`C5c browser evidence: ${evidence.layout.length} layout states, ${evidence.screenshots.length} screenshots, ${evidence.failures.length} failures`);
for (const failure of evidence.failures) console.log(`  FAIL ${failure}`);
process.exit(evidence.failures.length === 0 ? 0 : 1);
