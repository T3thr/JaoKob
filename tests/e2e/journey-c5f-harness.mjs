/**
 * C5f browser evidence (T5): the PO harness draws the 13 screens of Mockups v3 on the real Journey
 * screens from real engine states (`docs/design-system/evidence/journey-v3-harness/`), in a real
 * Chromium at each screen's v3 viewport.
 *
 *   JKB_PLAYWRIGHT_PATH=/abs/path/playwright/index.mjs node tests/e2e/journey-c5f-harness.mjs
 *   JKB_EVIDENCE_DIR=/abs/out overrides the output folder (default tests/e2e/evidence/sprint-05/c5f/harness)
 *   JKB_CHROMIUM_PATH=/abs/path/to/chromium uses a Chromium already on the machine (nothing is downloaded)
 *
 * Checks (TC-S5-PROTO-001 · TC-S5-UX-001): every screen reaches its state with no error; what the
 * screen draws equals the v3 facts read back from the DOM (clash cards with their แก้ทาง and ซ้ำ
 * tags, light and turn; the five choices; the eight camp cards; the open and grey strands and the
 * Safety Fallback; the micro-action and the player's first press; Teuk's line); every image passes
 * the media resolver; no console error and no request outside the page's origin. The engine side of
 * the same states is proved in `tests/unit/journey-v3-harness.test.js`.
 * Not run: PO visual comparison with the v3 pictures (the gallery puts them side by side).
 */
import { createServer } from "node:http";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { execFileSync } from "node:child_process";
import { SCREENS } from "../../docs/design-system/evidence/journey-v3-harness/screens.js";

const repo = resolve(fileURLToPath(new URL("../..", import.meta.url)));
const output = resolve(process.env.JKB_EVIDENCE_DIR ?? resolve(repo, "tests/e2e/evidence/sprint-05/c5f/harness"));
await mkdir(output, { recursive: true });
const playwrightPath = process.env.JKB_PLAYWRIGHT_PATH;
const playwright = await import(playwrightPath ? pathToFileURL(playwrightPath).href : "playwright");
const { chromium } = playwright.default ?? playwright;

const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".json": "application/json", ".webp": "image/webp", ".woff2": "font/woff2", ".svg": "image/svg+xml" };
const ALLOWED = ["/src/", "/assets/", "/docs/design-system/evidence/journey-v3-harness/", "/docs/design-system/mechanics/", "/docs/design-system/ux-mockups/v3/", "/tests/fixtures/journey/"];
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

const THAI = ["ศูนย์", "หนึ่ง", "สอง", "สาม", "สี่", "ห้า", "หก", "เจ็ด", "แปด", "เก้า", "สิบ"];
const same = (a, b) => [...a].sort().join(",") === [...b].sort().join(",");
const evidence = {
  runner: "tests/e2e/journey-c5f-harness.mjs",
  head: execFileSync("git", ["rev-parse", "HEAD"], { cwd: repo, encoding: "utf8" }).trim(),
  requirements: ["TC-S5-PROTO-001", "TC-S5-UX-001"],
  screens: [], screenshots: [], failures: [], errors: [],
  notRun: ["PO visual comparison with the v3 pictures", "Safari/WebKit and Firefox", "physical devices"],
};
const check = (condition, message) => { if (!condition) evidence.failures.push(message); };

const browser = await chromium.launch(process.env.JKB_CHROMIUM_PATH ? { executablePath: process.env.JKB_CHROMIUM_PATH } : {});
evidence.browser = browser.version();

for (const screen of SCREENS) {
  const [width, height] = screen.viewport;
  const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1, reducedMotion: "reduce" });
  const page = await context.newPage();
  page.on("pageerror", (error) => evidence.errors.push(`${screen.stem} ${error.message}`));
  page.on("console", (message) => { if (message.type() === "error") evidence.errors.push(`${screen.stem} ${message.text()}`); });
  page.on("request", (request) => { if (!request.url().startsWith(origin) && !/^(data|blob):/.test(request.url())) evidence.errors.push(`external ${request.url()}`); });
  await page.goto(`${origin}/docs/design-system/evidence/journey-v3-harness/screen.html?n=${screen.n}`);
  await page.waitForFunction(() => document.documentElement.dataset.harnessReady === "true");
  await page.waitForTimeout(900);
  const f = await page.evaluate(() => {
    const game = document.querySelector(".jk-journey");
    const shown = (node) => node !== null && !node.hasAttribute("hidden");
    const cardsIn = (selector) => [...document.querySelectorAll(`${selector} [data-component="TactileActionCard"]`)].filter(shown);
    const tagged = (cards, kind) => cards.filter((card) => [...card.querySelectorAll(`.jk-tag[data-tag="${kind}"]`)].some(shown)).map((card) => card.getAttribute("data-key"));
    const tray = cardsIn(".jk-tray");
    const endings = [...document.querySelectorAll('[data-component="ThreeStrandDestinyCard"] button[data-key]')].filter(shown);
    return {
      error: shown(document.getElementById("harness-error")) ? document.getElementById("harness-error").textContent : null,
      mode: game?.getAttribute("data-mode") ?? null,
      micro: game?.getAttribute("data-micro") ?? null,
      tray: tray.map((card) => card.getAttribute("data-key")),
      counter: tagged(tray, "counter"),
      repeat: tagged(tray, "repeat"),
      light: document.querySelector(".jk-gauge")?.getAttribute("data-light") ?? null,
      gauge: document.querySelector(".jk-gauge")?.getAttribute("aria-label") ?? null,
      choices: cardsIn(".jk-choices").map((card) => card.getAttribute("data-key")),
      camp: cardsIn('[data-component="CampActivityBoard"]').length,
      endings: endings.map((button) => [button.getAttribute("data-key"), button.getAttribute("data-available") === "true"]),
      fallback: document.querySelector('[data-component="ThreeStrandDestinyCard"]')?.getAttribute("data-fallback") === "true",
      speaker: shown(document.querySelector(".jk-dialogue__speaker")) ? document.querySelector(".jk-dialogue__name")?.textContent : null,
      ripples: document.querySelectorAll(".jk-micro__ripple").length,
      stitches: document.querySelectorAll('.jk-micro__guide[data-done="true"]').length,
      images: window.journeyHarness?.images() ?? null,
      scrollWidth: document.documentElement.scrollWidth,
    };
  });
  const want = screen.expect;
  const tag = `v3 ${screen.n} ${screen.stem}`;
  check(f.error === null, `${tag}: ${f.error}`);
  check(f.mode === want.mode, `${tag}: mode ${f.mode}`);
  if (screen.kind === "clash") {
    check(same(f.tray, want.cards), `${tag}: cards ${f.tray}`);
    check(same(f.counter, want.counter), `${tag}: แก้ทาง on ${f.counter}`);
    check(same(f.repeat, want.repeat), `${tag}: ซ้ำ on ${f.repeat}`);
    check(f.light === String(want.light), `${tag}: light ${f.light}`);
    check(f.gauge?.includes(`เทิร์นที่${THAI[want.turn]}`), `${tag}: turn ${f.gauge}`);
  }
  if (screen.kind === "choice") check(same(f.choices, want.options), `${tag}: choices ${f.choices}`);
  if (screen.kind === "camp") check(f.camp === want.activities, `${tag}: ${f.camp} camp cards`);
  if (screen.kind === "endings") {
    for (const [key, open] of Object.entries(want.open)) check(f.endings.some(([k, available]) => k === key && available === open), `${tag}: ${key} should be ${open ? "open" : "grey"} ${JSON.stringify(f.endings)}`);
    check(f.fallback === want.fallback, `${tag}: Safety Fallback ${f.fallback}`);
  }
  if (screen.kind === "micro") {
    check(f.micro === want.micro, `${tag}: micro ${f.micro}`);
    check(want.micro === "stitch" ? f.stitches === 1 : f.ripples === 1, `${tag}: the first press is not drawn (${f.stitches} stitches, ${f.ripples} ripples)`);
  }
  if (screen.kind === "vn") check(f.speaker === want.speaker, `${tag}: speaker ${f.speaker}`);
  check(f.images !== null && f.images.failures === 0, `${tag}: images refused ${JSON.stringify(f.images)}`);
  check(f.scrollWidth <= width, `${tag}: sideways scroll ${f.scrollWidth}`);
  const file = `v3-${String(screen.n).padStart(2, "0")}-${screen.stem}.jpg`;
  await page.screenshot({ path: resolve(output, file), type: "jpeg", quality: 72 });
  evidence.screenshots.push(file);
  evidence.screens.push({ n: screen.n, stem: screen.stem, viewport: screen.viewport, mode: f.mode, tray: f.tray.length, counter: f.counter, repeat: f.repeat, light: f.light, gauge: f.gauge, choices: f.choices, camp: f.camp, endings: f.endings, fallback: f.fallback, micro: f.micro, speaker: f.speaker, images: f.images });
  await context.close();
}

await browser.close();
server.close();
check(evidence.errors.length === 0, `console or network: ${evidence.errors.join(" | ")}`);
evidence.passed = evidence.failures.length === 0;
await writeFile(resolve(output, "report.json"), `${JSON.stringify(evidence, null, 2)}\n`);
console.log(`C5f harness evidence: ${evidence.screens.length} v3 screens, ${evidence.screenshots.length} screenshots, ${evidence.failures.length} failures`);
for (const failure of evidence.failures.slice(0, 30)) console.log(`  FAIL ${failure}`);
process.exit(evidence.passed ? 0 : 1);
