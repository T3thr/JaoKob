/**
 * C5d browser evidence (T3): the Journey media resolver and the shared image cache on the real
 * Journey application through the PO review page, in a real Chromium.
 *
 *   JKB_PLAYWRIGHT_PATH=/abs/path/playwright/index.mjs node tests/e2e/journey-c5d-media.mjs
 *   JKB_EVIDENCE_DIR=/abs/out overrides the output folder (default tests/e2e/evidence/sprint-05/c5d)
 *   JKB_CHROMIUM_PATH=/abs/path/to/chromium uses a Chromium already on the machine (nothing is downloaded)
 *
 * Checks (TC-S5-ASSET-001 · TC-S5-PACKAGE-001 · TC-S5-PERF-001 image budget):
 *   - the whole Act 1 and the whole mini package, one command at a time like a player, with
 *     `crypto.subtle` removed (the phone-over-LAN case): no image refused, the cache within
 *     32 MiB, every drawn image a decoded `blob:` URL, every image request same-origin under
 *     `assets/images/`, nothing outside the page's origin;
 *   - an image already drawn keeps showing after its object URL is revoked (what lets a fading
 *     image give its lease back at once);
 *   - a damaged opening plate (one byte changed on the server) is never drawn, the title and the
 *     whole Act 1 still play, no error reaches the console, and once the file is whole again the
 *     plate is read again on its next use (a refusal is not remembered).
 * Exits 1 on any failure. `report.json` and a few screenshots (JPEG) go to the evidence directory.
 * Not run: Safari/WebKit, Firefox, physical devices, a real LAN address (the insecure context is
 * simulated by removing `crypto.subtle`), PO visual acceptance.
 */
import { createServer } from "node:http";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { execFileSync } from "node:child_process";

const repo = resolve(fileURLToPath(new URL("../..", import.meta.url)));
const output = resolve(process.env.JKB_EVIDENCE_DIR ?? resolve(repo, "tests/e2e/evidence/sprint-05/c5d"));
await mkdir(output, { recursive: true });
const playwrightPath = process.env.JKB_PLAYWRIGHT_PATH;
const playwright = await import(playwrightPath ? pathToFileURL(playwrightPath).href : "playwright");
const { chromium } = playwright.default ?? playwright;

const manifest = JSON.parse(await readFile(resolve(repo, "assets/images/asset-manifest-v2.json"), "utf8"));
const act1 = JSON.parse(await readFile(resolve(repo, "src/data/content/journey/story-jaokob-core.json"), "utf8"));
const openingId = act1.nodes.find((node) => node.id === act1.start.node).stage.bg;
const openingPath = `/${Object.values(manifest.categories).flat().find((entry) => entry.assetId === openingId).outputPath}`;

const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".json": "application/json", ".webp": "image/webp", ".woff2": "font/woff2", ".svg": "image/svg+xml" };
const ALLOWED = ["/src/", "/assets/", "/docs/design-system/evidence/journey-review/", "/tests/fixtures/journey/"];
/** A path whose bytes the server damages (one byte flipped in the middle), or null. */
let damaged = null;
const server = createServer(async (request, response) => {
  try {
    const path = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
    const file = resolve(repo, `.${path}`);
    if (!file.startsWith(`${repo}${sep}`) || !ALLOWED.some((prefix) => path.startsWith(prefix)) || !(await stat(file)).isFile()) { response.writeHead(404).end(); return; }
    const body = await readFile(file);
    if (path === damaged) body[body.length >> 1] ^= 0xff;
    response.writeHead(200, { "Content-Type": MIME[extname(file)] ?? "application/octet-stream", "Content-Length": body.length, "Cache-Control": "no-store" });
    response.end(body);
  } catch { response.writeHead(404).end(); }
});
await new Promise((done) => server.listen(0, "127.0.0.1", done));
const origin = `http://127.0.0.1:${server.address().port}`;
const PLAY = `${origin}/docs/design-system/evidence/journey-review/play.html`;
const BUDGET = 32 * 1024 * 1024;

const evidence = {
  runner: "tests/e2e/journey-c5d-media.mjs",
  head: execFileSync("git", ["rev-parse", "HEAD"], { cwd: repo, encoding: "utf8" }).trim(),
  requirements: ["TC-S5-ASSET-001", "TC-S5-PACKAGE-001", "TC-S5-PERF-001"],
  plays: [], revokedStillDrawn: null, damaged: null, screenshots: [], failures: [], errors: [],
  notRun: ["Safari/WebKit and Firefox", "physical iPhone and Android", "a real LAN address (insecure context simulated by removing crypto.subtle)", "PO visual acceptance"],
};
const check = (condition, message) => { if (!condition) evidence.failures.push(message); };

const browser = await chromium.launch(process.env.JKB_CHROMIUM_PATH ? { executablePath: process.env.JKB_CHROMIUM_PATH } : {});
evidence.browser = browser.version();

async function open(pkg, { insecure = false, viewport = { width: 390, height: 844 }, expected = null } = {}) {
  const context = await browser.newContext({ deviceScaleFactor: 1, reducedMotion: "reduce", viewport });
  if (insecure) await context.addInitScript(() => { Object.defineProperty(globalThis.crypto, "subtle", { value: undefined, configurable: true }); });
  const page = await context.newPage();
  const requests = [];
  page.on("pageerror", (error) => evidence.errors.push(error.message));
  page.on("console", (message) => { if (message.type() === "error" && !(expected?.test(message.text()) ?? false)) evidence.errors.push(message.text()); });
  page.on("request", (request) => {
    const url = request.url();
    if (/^(data|blob):/.test(url)) return;
    if (!url.startsWith(origin)) evidence.errors.push(`external ${url}`);
    requests.push(url.slice(origin.length));
  });
  await page.goto(pkg === "mini" ? `${PLAY}?package=mini` : PLAY);
  await page.waitForFunction(() => document.documentElement.dataset.reviewReady === "true");
  return { context, page, requests };
}

/** What the page draws now and what the cache holds. */
const sample = (page) => page.evaluate(() => {
  const shell = window.journeyReview.shell;
  const drawn = [...document.querySelectorAll("#game img[src]")].filter((img) => img.getAttribute("src") !== "");
  return {
    phase: shell.snapshot().phase,
    mode: shell.snapshot().model?.mode ?? null,
    images: shell.images(),
    drawn: drawn.length,
    notBlob: drawn.filter((img) => !img.src.startsWith("blob:")).map((img) => img.getAttribute("src")),
    broken: drawn.filter((img) => !img.closest("[hidden]") && img.complete && img.naturalWidth === 0).length,
  };
});

/** One real command at a time until the chapter end, sampling after each. */
async function playWhole(page, label, { refusalsExpected = false } = {}) {
  await page.evaluate(() => { const shell = window.journeyReview.shell; shell.newGame({ consentToken: shell.snapshot().title?.consentToken ?? null }); });
  let peak = 0, peakHeld = 0, peakEntries = 0, steps = 0, last = null;
  const modes = new Set();
  for (; steps < 600; steps += 1) {
    await page.waitForTimeout(90);
    last = await sample(page);
    modes.add(last.mode);
    peak = Math.max(peak, last.images.bytes);
    peakHeld = Math.max(peakHeld, last.images.retainedBytes);
    peakEntries = Math.max(peakEntries, last.images.entries);
    if (!refusalsExpected) check(last.images.failures === 0, `${label} step ${steps}: ${last.images.failures} image(s) refused`);
    check(last.images.bytes <= BUDGET, `${label} step ${steps}: cache over budget ${last.images.bytes}`);
    check(last.notBlob.length === 0, `${label} step ${steps}: drawn without the resolver ${last.notBlob.join(", ")}`);
    check(last.broken === 0, `${label} step ${steps}: ${last.broken} drawn image(s) without pixels`);
    if (last.phase !== "playing" || ["BOUNDARY", "COMPLETE"].includes(last.mode)) break;
    const moved = await page.evaluate(() => window.journeyReview.step() !== null);
    if (!moved) break;
  }
  await page.waitForTimeout(450);
  last = await sample(page);
  const mib = (bytes) => Math.round((bytes / 1048576) * 10) / 10;
  return { steps, modes: [...modes], peakBytes: peak, peakMiB: mib(peak), peakHeldBytes: peakHeld, peakHeldMiB: mib(peakHeld), peakEntries, end: last };
}

// ------------------------------------------------------------------- whole plays, no Web Crypto
for (const pkg of ["act1", "mini"]) {
  const { context, page, requests } = await open(pkg, { insecure: true });
  const subtle = await page.evaluate(() => globalThis.crypto.subtle === undefined && window.isSecureContext);
  const play = await playWhole(page, pkg);
  const images = requests.filter((path) => path.startsWith("/assets/images/") && path !== "/assets/images/asset-manifest-v2.json");
  const perImage = new Map();
  images.forEach((path) => perImage.set(path, (perImage.get(path) ?? 0) + 1));
  const bad = images.filter((path) => !/^\/assets\/images\/[a-z0-9_./-]+\.webp$/.test(path));
  evidence.plays.push({ pkg, subtleRemoved: subtle, ...play, imageRequests: images.length, distinctImages: perImage.size, mostFetched: Math.max(0, ...perImage.values()) });
  check(subtle, `${pkg}: crypto.subtle was not removed`);
  check(play.steps > 20, `${pkg}: only ${play.steps} steps`);
  check(["BOUNDARY", "COMPLETE"].includes(play.end.mode), `${pkg}: the play ended at ${play.end.mode}`);
  check(play.end.images.failures === 0, `${pkg}: images refused ${play.end.images.failures}`);
  check(play.peakBytes > 0 && play.peakBytes <= BUDGET, `${pkg}: peak ${play.peakBytes}`);
  check(play.peakHeldBytes > 0 && play.peakHeldBytes <= play.peakBytes, `${pkg}: held ${play.peakHeldBytes}`);
  check(bad.length === 0, `${pkg}: image requests outside assets/images ${bad.join(", ")}`);
  check(perImage.size >= 5, `${pkg}: only ${perImage.size} images read`);
  const file = `${pkg}-end-390x844.jpg`;
  await page.screenshot({ path: resolve(output, file), type: "jpeg", quality: 70 });
  evidence.screenshots.push(file);
  await context.close();
}

// ------------------------------------------------- a drawn image survives its revoked URL
{
  // The probe fetches its own revoked URL on purpose; that one refusal is the expected console line.
  const { context, page } = await open("act1", { expected: /ERR_FILE_NOT_FOUND/ });
  evidence.revokedStillDrawn = await page.evaluate(async (path) => {
    const blob = await (await fetch(path, { credentials: "omit" })).blob();
    const url = URL.createObjectURL(blob);
    const img = document.createElement("img");
    img.src = url;
    await img.decode();
    document.body.append(img);
    URL.revokeObjectURL(url);
    await new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)));
    const canvas = document.createElement("canvas");
    canvas.width = 16; canvas.height = 16;
    const draw = canvas.getContext("2d");
    draw.drawImage(img, 0, 0, 16, 16);
    const pixels = draw.getImageData(0, 0, 16, 16).data;
    let opaque = 0;
    for (let i = 3; i < pixels.length; i += 4) if (pixels[i] > 0) opaque += 1;
    let refetch = "ok";
    try { await fetch(url); } catch { refetch = "refused"; }
    img.remove();
    return { complete: img.complete, naturalWidth: img.naturalWidth, opaquePixels: opaque, refetchAfterRevoke: refetch };
  }, openingPath);
  const r = evidence.revokedStillDrawn;
  check(r.complete && r.naturalWidth > 0 && r.opaquePixels > 0, `a drawn image lost its pixels after its URL was revoked ${JSON.stringify(r)}`);
  check(r.refetchAfterRevoke === "refused", "a revoked URL could still be fetched");
  await context.close();
}

// -------------------------------------------------------------- a damaged opening plate
{
  damaged = openingPath;
  const { context, page } = await open("act1");
  await page.waitForTimeout(600);
  const title = await page.evaluate(() => {
    const plate = document.querySelector(".jk-title__plate");
    return { shown: plate?.getAttribute("data-shown") ?? null, src: plate?.getAttribute("src") ?? null, failures: window.journeyReview.shell.images().failures, phase: window.journeyReview.shell.snapshot().phase };
  });
  const shot = "damaged-title-390x844.jpg";
  await page.screenshot({ path: resolve(output, shot), type: "jpeg", quality: 70 });
  evidence.screenshots.push(shot);
  const play = await playWhole(page, "damaged", { refusalsExpected: true });
  // The file is whole again: a refused image is read again on its next use, no reload needed.
  damaged = null;
  await page.evaluate(() => window.journeyReview.shell.leave());
  await page.waitForTimeout(600);
  const recovered = await page.evaluate(() => ({ shown: document.querySelector(".jk-title__plate")?.getAttribute("data-shown") ?? null, src: document.querySelector(".jk-title__plate")?.src ?? "" }));
  evidence.damaged = { asset: openingId, title, steps: play.steps, end: play.end.mode, failures: play.end.images.failures, entries: play.end.images.entries, recovered };
  check(title.phase === "title" && title.shown === "false" && title.src === null, `damaged: the title drew the damaged plate ${JSON.stringify(title)}`);
  check(title.failures >= 1, "damaged: the damaged plate was not refused");
  check(play.end.mode === "BOUNDARY", `damaged: Act 1 stopped at ${play.end.mode}`);
  check(recovered.shown === "true" && recovered.src.startsWith("blob:"), `damaged: the mended plate was not read again ${JSON.stringify(recovered)}`);
  // The same damaged plate opens A1-01 too, so the only refusals are that one image.
  check(evidence.errors.length === 0, `damaged: errors ${evidence.errors.join(" | ")}`);
  const file = "recovered-title-390x844.jpg";
  await page.screenshot({ path: resolve(output, file), type: "jpeg", quality: 70 });
  evidence.screenshots.push(file);
  await context.close();
}

await browser.close();
server.close();
check(evidence.errors.length === 0, `console or network: ${evidence.errors.join(" | ")}`);
evidence.passed = evidence.failures.length === 0;
await writeFile(resolve(output, "report.json"), `${JSON.stringify(evidence, null, 2)}\n`);
console.log(`C5d browser evidence: ${evidence.plays.length} whole plays, ${evidence.screenshots.length} screenshots, ${evidence.failures.length} failures`);
for (const failure of evidence.failures.slice(0, 20)) console.log(`  FAIL ${failure}`);
process.exit(evidence.passed ? 0 : 1);
