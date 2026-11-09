/**
 * C5f browser evidence (T5): the game itself. `index.html` and only the files of the Sprint 5
 * release allowlist are served, at the site root and under `/JaoKob/` (GitHub Pages), in a real
 * Chromium, and played the way a player does: keys only, no hook into the page.
 *
 *   JKB_PLAYWRIGHT_PATH=/abs/path/playwright/index.mjs node tests/e2e/journey-c5f-index.mjs
 *   JKB_EVIDENCE_DIR=/abs/out overrides the output folder (default tests/e2e/evidence/sprint-05/c5f)
 *   JKB_CHROMIUM_PATH=/abs/path/to/chromium uses a Chromium already on the machine (nothing is downloaded)
 *
 * Checks (TC-S5-PROTO-001 · TC-S5-E2E-001 for Act 1 · TC-S5-A11Y-001 · TC-S5-SAVE-001 · TC-S5-INLINE-001):
 *   - the whole Act 1 from the title to the chapter end with the keyboard only (Space reads on,
 *     Enter arms and commits the focused card, Space plays a micro-action): at the root on a phone
 *     with motion, and under `/JaoKob/` on a desktop with reduced motion and reduced transparency;
 *     every mode Act 1 has is met; no drawn image without pixels;
 *   - reload in the middle of a clash: the title offers continue, continue does not write, and the
 *     clash comes back at the same beat, turn, light and intent, then plays on;
 *   - rapid keys: three quick presses of 1 on a choice commit once (one revision);
 *   - spoiler wall: a query or hash cannot load another package, the review harness, fixtures, the
 *     full media manifest and images of later acts are not served, and nothing outside the
 *     allowlist is ever requested;
 *   - safety: no console error, no Content-Security-Policy violation, no request outside the page's
 *     origin and base path, storage written only under `jaokob:journey:`.
 * Exits 1 on any failure. `report.json` and screenshots go to the evidence directory.
 * Not run: Safari/WebKit, Firefox, physical devices, screen-reader listening, the PO's own play.
 */
import { createServer } from "node:http";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { extname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { execFileSync } from "node:child_process";

const repo = resolve(fileURLToPath(new URL("../..", import.meta.url)));
const output = resolve(process.env.JKB_EVIDENCE_DIR ?? resolve(repo, "tests/e2e/evidence/sprint-05/c5f"));
await mkdir(output, { recursive: true });
const playwrightPath = process.env.JKB_PLAYWRIGHT_PATH;
const playwright = await import(playwrightPath ? pathToFileURL(playwrightPath).href : "playwright");
const { chromium } = playwright.default ?? playwright;

const allowlist = new Set(JSON.parse(await readFile(resolve(repo, "specs/releases/sprint-05-static-files.json"), "utf8")).files);
const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".json": "application/json", ".webp": "image/webp", ".woff2": "font/woff2", ".svg": "image/svg+xml", ".txt": "text/plain; charset=utf-8" };
const BASES = ["/", "/JaoKob/"];
/** Every path asked for that the allowlist does not hold (each is a failure unless a probe asked for it). */
const refused = [];
const server = createServer(async (request, response) => {
  const url = new URL(request.url, "http://localhost");
  const base = BASES.find((prefix) => url.pathname.startsWith(prefix) && prefix !== "/") ?? "/";
  let path = decodeURIComponent(url.pathname.slice(base.length));
  if (path === "") path = "index.html";
  if (!allowlist.has(path)) { refused.push(url.pathname); response.writeHead(404).end(); return; }
  const body = await readFile(resolve(repo, path));
  response.writeHead(200, { "Content-Type": MIME[extname(path)] ?? "application/octet-stream", "Content-Length": body.length, "Cache-Control": "no-store" });
  response.end(body);
});
await new Promise((done) => server.listen(0, "127.0.0.1", done));
const origin = `http://127.0.0.1:${server.address().port}`;

const evidence = {
  runner: "tests/e2e/journey-c5f-index.mjs",
  head: execFileSync("git", ["rev-parse", "HEAD"], { cwd: repo, encoding: "utf8" }).trim(),
  requirements: ["TC-S5-PROTO-001", "TC-S5-E2E-001 (Act 1)", "TC-S5-A11Y-001", "TC-S5-SAVE-001", "TC-S5-INLINE-001"],
  allowlistFiles: allowlist.size, plays: [], reload: null, rapid: null, spoiler: null, screenshots: [], failures: [], errors: [],
  notRun: ["Safari/WebKit and Firefox", "physical iPhone and Android", "VoiceOver and NVDA listening", "the PO's own play-through (T5 DoD)"],
};
const check = (condition, message) => { if (!condition) evidence.failures.push(message); };

const browser = await chromium.launch(process.env.JKB_CHROMIUM_PATH ? { executablePath: process.env.JKB_CHROMIUM_PATH } : {});
evidence.browser = browser.version();

async function open(base, { viewport, reducedMotion = "no-preference", reducedTransparency = false, query = "", context: shared = null } = {}) {
  const context = shared ?? await browser.newContext({ viewport, deviceScaleFactor: 1, reducedMotion });
  const page = await context.newPage();
  await page.addInitScript(() => {
    window.__csp = [];
    document.addEventListener("securitypolicyviolation", (event) => window.__csp.push(`${event.violatedDirective} ${event.blockedURI}`));
  });
  if (reducedTransparency) {
    const session = await context.newCDPSession(page);
    await session.send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-transparency", value: "reduce" }, { name: "prefers-reduced-motion", value: reducedMotion }] });
  }
  page.on("pageerror", (error) => evidence.errors.push(`${base} ${error.message}`));
  page.on("console", (message) => { if (message.type() === "error") evidence.errors.push(`${base} ${message.text()}`); });
  page.on("request", (request) => {
    const url = request.url();
    if (/^(data|blob):/.test(url)) return;
    if (!url.startsWith(origin + base)) evidence.errors.push(`outside ${base}: ${url}`);
  });
  await page.goto(`${origin}${base}${query}`);
  await page.waitForFunction(() => document.documentElement.dataset.ready === "true");
  await page.waitForTimeout(400);
  return { context, page };
}

/** What the screen says now, read from the DOM and the saved record (no hook into the game). */
const state = (page) => page.evaluate(() => {
  const game = document.querySelector(".jk-journey");
  const title = document.querySelector(".jk-title");
  const visible = (node) => node !== null && !node.closest("[hidden]") && node.getBoundingClientRect().width > 0;
  let saved = null;
  try { saved = JSON.parse(localStorage.getItem("jaokob:journey:story.jaokob.core:canonical") ?? "null"); } catch { saved = "unreadable"; }
  const gauge = document.querySelector(".jk-gauge");
  const drawn = [...document.querySelectorAll("#app img[src]")].filter((img) => visible(img));
  return {
    phase: visible(title) ? "title" : visible(game) ? "playing" : "none",
    mode: game?.getAttribute("data-mode") ?? null,
    beat: game?.getAttribute("data-clash") ?? null,
    micro: game?.getAttribute("data-micro") ?? null,
    ended: visible(document.querySelector(".jk-chapter-end")),
    chapter: document.querySelector(".jk-chapter-end")?.textContent?.trim() ?? null,
    line: document.querySelector(".jk-dialogue__text")?.textContent ?? null,
    intent: visible(document.querySelector(".jk-intent")) ? document.querySelector(".jk-intent")?.innerText?.trim() : null,
    light: gauge?.getAttribute("data-light") ?? null,
    gauge: gauge?.getAttribute("aria-label") ?? null,
    focus: document.activeElement?.className ?? null,
    revision: saved?.revision ?? null,
    cursor: saved?.payload?.cursor ?? null,
    broken: drawn.filter((img) => img.complete && img.naturalWidth === 0).length,
    keys: Object.keys(localStorage),
    csp: window.__csp.slice(),
  };
});

const CARD_MODES = new Set(["DECISION", "CLASH_CHOOSE", "CAMP", "POUCH_SWAP", "ENDING_RESONANCE"]);

/** One player move by keyboard for the screen in front of us. */
async function move(page, s, pause) {
  if (s.mode === "MICRO") {
    if (s.micro === "hold") { await page.keyboard.down(" "); await page.waitForTimeout(3600); await page.keyboard.up(" "); }
    else await page.keyboard.press(" ");
  } else if (CARD_MODES.has(s.mode) && !(s.mode === "CLASH_CHOOSE" && s.beat !== "choose")) {
    await page.keyboard.press("Enter");
    await page.waitForTimeout(pause);
    await page.keyboard.press("Enter");
  } else {
    await page.keyboard.press(" ");
  }
  await page.waitForTimeout(pause);
}

/** Keys from the title to the chapter end; returns what was met on the way. */
async function playAct(page, label, { pause, until = null } = {}) {
  await page.keyboard.press("Enter");
  await page.waitForTimeout(pause * 2);
  const modes = new Set(), beats = new Set();
  // A micro-action settles for up to 1.5 s after its last input, so "stuck" is measured in time.
  let changed = Date.now(), last = "", s = await state(page);
  for (let step = 0; step < 900 && !s.ended; step += 1) {
    if (until !== null && until(s)) break;
    modes.add(s.mode);
    if (s.beat) beats.add(s.beat);
    check(s.broken === 0, `${label}: ${s.broken} drawn image(s) without pixels at ${s.mode}`);
    await move(page, s, pause);
    s = await state(page);
    const key = JSON.stringify([s.mode, s.beat, s.line, s.revision, s.micro, s.light]);
    if (key !== last) { changed = Date.now(); last = key; }
    if (Date.now() - changed > 6000) { check(false, `${label}: stuck at ${key} (focus ${s.focus})`); break; }
  }
  return { modes: [...modes], beats: [...beats], end: s };
}

// ------------------------------------------------------- whole Act 1, keys only, root and subpath
for (const run of [
  { base: "/", viewport: { width: 390, height: 844 }, reducedMotion: "no-preference", reducedTransparency: false, pause: 260, shot: "root-390x844" },
  { base: "/JaoKob/", viewport: { width: 1440, height: 900 }, reducedMotion: "reduce", reducedTransparency: true, pause: 90, shot: "subpath-1440x900" },
]) {
  const { context, page } = await open(run.base, run);
  const title = await state(page);
  check(title.phase === "title" && title.focus?.includes("jk-title") !== false, `${run.base}: the title is not first ${JSON.stringify(title)}`);
  await page.screenshot({ path: resolve(output, `${run.shot}-title.jpg`), type: "jpeg", quality: 70 });
  evidence.screenshots.push(`${run.shot}-title.jpg`);
  const started = Date.now();
  const play = await playAct(page, run.base, { pause: run.pause });
  const glass = await page.evaluate(() => getComputedStyle(document.querySelector(".jk-hud__capsule")).backdropFilter);
  await page.screenshot({ path: resolve(output, `${run.shot}-chapter-end.jpg`), type: "jpeg", quality: 70 });
  evidence.screenshots.push(`${run.shot}-chapter-end.jpg`);
  const end = play.end;
  evidence.plays.push({ base: run.base, viewport: run.viewport, reducedMotion: run.reducedMotion, reducedTransparency: run.reducedTransparency, seconds: Math.round((Date.now() - started) / 1000), modes: play.modes, beats: play.beats, revision: end.revision, chapter: end.chapter, hudBackdrop: glass, keys: end.keys, csp: end.csp });
  check(end.ended && end.mode === "BOUNDARY", `${run.base}: Act 1 did not reach its chapter end (${end.mode})`);
  check(end.chapter?.includes("เรื่องหน้าต่อจากนี้ยังไม่เปิด"), `${run.base}: the chapter end does not say the next act is closed`);
  for (const mode of ["VN", "DECISION", "CLASH_CHOOSE", "CAMP", "MICRO"]) check(play.modes.includes(mode), `${run.base}: never met ${mode}`);
  for (const beat of ["intent", "choose", "resolve"]) check(play.beats.includes(beat), `${run.base}: never met the clash beat ${beat}`);
  check(end.keys.every((key) => key.startsWith("jaokob:journey:")), `${run.base}: storage outside jaokob:journey: ${end.keys.join(", ")}`);
  check(end.csp.length === 0, `${run.base}: CSP violations ${end.csp.join(" | ")}`);
  if (run.reducedTransparency) check(glass === "none", `${run.base}: the HUD glass is not solid under reduced transparency (${glass})`);
  await context.close();
}

// --------------------------------------------------------------------- reload in the middle of a clash
{
  const { context, page } = await open("/", { viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
  let s = (await playAct(page, "reload", { pause: 90, until: (now) => now.mode === "CLASH_CHOOSE" && /เทิร์นที่สอง/.test(now.gauge ?? "") && now.beat === "choose" })).end;
  const before = await state(page);
  await page.screenshot({ path: resolve(output, "reload-before-390x844.jpg"), type: "jpeg", quality: 70 });
  await page.reload();
  await page.waitForFunction(() => document.documentElement.dataset.ready === "true");
  await page.waitForTimeout(400);
  const title = await state(page);
  const continueFocused = await page.evaluate(() => document.activeElement?.getAttribute("data-action") ?? null);
  await page.keyboard.press("Enter");
  await page.waitForTimeout(500);
  const after = await state(page);
  await page.screenshot({ path: resolve(output, "reload-after-390x844.jpg"), type: "jpeg", quality: 70 });
  evidence.screenshots.push("reload-before-390x844.jpg", "reload-after-390x844.jpg");
  const rest = await playAct(page, "after reload", { pause: 90 });
  evidence.reload = {
    before: { mode: before.mode, beat: before.beat, gauge: before.gauge, light: before.light, intent: before.intent, revision: before.revision, cursor: before.cursor },
    title: { phase: title.phase, focus: continueFocused, revision: title.revision },
    after: { mode: after.mode, beat: after.beat, gauge: after.gauge, light: after.light, intent: after.intent, revision: after.revision, cursor: after.cursor },
    playedOnTo: rest.end.mode,
  };
  check(before.mode === "CLASH_CHOOSE", `reload: never reached the second clash turn (${before.mode} ${before.gauge})`);
  check(title.phase === "title" && continueFocused === "continue", `reload: the title does not offer continue first (${continueFocused})`);
  check(title.revision === before.revision && after.revision === before.revision, "reload: continue wrote the save");
  for (const field of ["mode", "beat", "gauge", "light", "intent"]) check(after[field] === before[field], `reload: ${field} changed ${JSON.stringify(before[field])} → ${JSON.stringify(after[field])}`);
  check(JSON.stringify(after.cursor) === JSON.stringify(before.cursor), "reload: the cursor moved");
  check(rest.end.mode === "BOUNDARY", `reload: the act did not play on to its end (${rest.end.mode})`);
  await context.close();
}

// ------------------------------------------------------------------- rapid keys commit once
{
  const { context, page } = await open("/", { viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
  const reached = (await playAct(page, "rapid", { pause: 90, until: (now) => now.mode === "DECISION" })).end;
  const before = await state(page);
  await page.keyboard.press("1");
  await page.keyboard.press("1");
  await page.keyboard.press("1");
  await page.waitForTimeout(300);
  const after = await state(page);
  evidence.rapid = { at: before.cursor?.node ?? null, before: before.revision, after: after.revision, mode: after.mode };
  check(reached.mode === "DECISION", "rapid: never reached a choice");
  check(after.revision === before.revision + 1, `rapid: three presses of 1 committed ${after.revision - before.revision} times`);
  await context.close();
}

// ------------------------------------------------------------------------------- spoiler wall
{
  const refusedBefore = refused.length;
  const { context, page } = await open("/", { viewport: { width: 390, height: 844 }, query: "?package=mini#package=mini" });
  const title = await page.evaluate(() => ({ name: document.querySelector(".jk-title")?.textContent?.trim().slice(0, 40) ?? null }));
  const asked = refused.slice(refusedBefore);
  const probes = {};
  for (const path of ["docs/design-system/evidence/journey-review/play.html", "tests/fixtures/journey/mini-journey.json", "assets/images/asset-manifest-v2.json", "assets/images/backgrounds/act-05/versions/v2/bg-act5-bedside-table-night.webp", "src/data/content/journey/story-jaokob-core.receipts.json", "specs/releases/sprint-05-static-files.json"]) {
    for (const base of BASES) probes[`${base}${path}`] = (await page.request.get(`${origin}${base}${path}`)).status();
  }
  evidence.spoiler = { title: title.name, askedOutsideAllowlist: asked, probes };
  check(/เจ้ากบ/.test(title.name ?? ""), `spoiler: a query changed the package (${title.name})`);
  check(asked.length === 0, `spoiler: the game asked for files outside the allowlist ${asked.join(", ")}`);
  check(Object.values(probes).every((status) => status === 404), `spoiler: something outside the allowlist was served ${JSON.stringify(probes)}`);
  await context.close();
  refused.length = refusedBefore;
}

await browser.close();
server.close();
check(refused.length === 0, `requests outside the allowlist: ${refused.join(", ")}`);
check(evidence.errors.length === 0, `console or network: ${evidence.errors.join(" | ")}`);
evidence.passed = evidence.failures.length === 0;
await writeFile(resolve(output, "report.json"), `${JSON.stringify(evidence, null, 2)}\n`);
console.log(`C5f browser evidence: ${evidence.plays.length} whole Act 1 plays, reload ${evidence.reload ? "run" : "not run"}, ${evidence.screenshots.length} screenshots, ${evidence.failures.length} failures`);
for (const failure of evidence.failures.slice(0, 20)) console.log(`  FAIL ${failure}`);
process.exit(evidence.passed ? 0 : 1);
