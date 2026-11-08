/**
 * C4 browser evidence for the Journey screens (T4): the real modules from `src/` on the real
 * Journey application, through the PO review page, in a real Chromium.
 *
 *   node tests/e2e/journey-c4-design-system.mjs
 *   JKB_PLAYWRIGHT_PATH=/abs/path/playwright/index.mjs JKB_EVIDENCE_DIR=/abs/out node tests/e2e/journey-c4-design-system.mjs
 *   JKB_CHROMIUM_PATH=/abs/path/to/chromium uses a Chromium already on the machine (nothing is downloaded)
 *
 * Checks (TC-S5-VN-001 · TC-S5-HUD-001 · TC-S5-SILENT-001 · TC-S5-A11Y-001):
 *   - 6 viewports × text 100 / 150 / 200 % × three states (three on stage, five choices, four on
 *     stage): no sideways scroll, no nested scroll, targets ≥ 44 × 44, HUD and settings apart,
 *     eyes on the face band and the dock below it (fit), or the stage as a top strip with the
 *     dock below it (flow);
 *   - contrast measured on the real pixels behind each text (text hidden, the region captured):
 *     dialogue and card labels ≥ 7 : 1, HUD labels ≥ 4.5 : 1 on every Act 1 plate and on a
 *     white plate as the worst case;
 *   - reduced motion, reduced transparency (CDP media feature), high contrast and forced colors;
 *   - keyboard-only play to a choice; layout shift while the dock changes; silent save;
 *   - memory across two whole Act 1 plays: DOM nodes, cast, listeners and JS heap after GC.
 * Exits 1 on any failure. Screenshots (JPEG, CSS pixels) and `report.json` go to the evidence
 * directory. Not run: Safari/WebKit, physical devices, VoiceOver/NVDA, PO visual acceptance.
 */
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { execFileSync } from "node:child_process";

const repo = resolve(fileURLToPath(new URL("../..", import.meta.url)));
const output = resolve(process.env.JKB_EVIDENCE_DIR ?? resolve(repo, "tests/e2e/evidence/sprint-05/c4"));
await mkdir(output, { recursive: true });
const playwrightPath = process.env.JKB_PLAYWRIGHT_PATH;
const playwright = await import(playwrightPath ? pathToFileURL(playwrightPath).href : "playwright");
const { chromium } = playwright.default ?? playwright;

const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".json": "application/json", ".webp": "image/webp", ".woff2": "font/woff2", ".svg": "image/svg+xml" };
const ALLOWED = ["/src/", "/assets/", "/docs/design-system/evidence/journey-review/"];
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

const VIEWPORTS = [[320, 568], [390, 844], [844, 390], [768, 1024], [1440, 900], [1920, 1080]];
const SCALES = [1, 1.5, 2];
const STATES = [
  ["three-on-stage", "(m) => m.scene.nodeId === 'a1-01' && m.line?.speaker === 'กิบ'"],
  ["five-choices", "(m) => m.scene.nodeId === 'a1-06' && m.mode === 'DECISION'"],
  ["four-on-stage", "(m) => m.scene.nodeId === 'a1-07' && m.mode === 'VN'"],
];
const evidence = {
  runner: "tests/e2e/journey-c4-design-system.mjs",
  head: execFileSync("git", ["rev-parse", "HEAD"], { cwd: repo, encoding: "utf8" }).trim(),
  requirements: ["TC-S5-VN-001", "TC-S5-HUD-001", "TC-S5-SILENT-001", "TC-S5-A11Y-001"],
  layout: [], contrast: [], media: {}, keyboard: null, layoutShift: [], memory: [], screenshots: [], failures: [], errors: [],
  notRun: ["Safari/WebKit and Firefox", "physical iPhone and Android", "VoiceOver and NVDA listening", "PO visual acceptance", "a browser without backdrop-filter (covered by the @supports rule)"],
};
const check = (condition, message) => { if (!condition) evidence.failures.push(message); };

const browser = await chromium.launch(process.env.JKB_CHROMIUM_PATH ? { executablePath: process.env.JKB_CHROMIUM_PATH } : {});
evidence.browser = browser.version();

async function open(options = {}, settings = null) {
  const context = await browser.newContext({ deviceScaleFactor: 1, reducedMotion: "reduce", ...options });
  const page = await context.newPage();
  page.on("pageerror", (error) => evidence.errors.push(error.message));
  page.on("console", (message) => { if (message.type() === "error") evidence.errors.push(message.text()); });
  page.on("request", (request) => { if (!request.url().startsWith(origin) && !/^(data|blob):/.test(request.url())) evidence.errors.push(`external ${request.url()}`); });
  await page.goto(PLAY);
  await page.waitForFunction(() => document.documentElement.dataset.reviewReady === "true");
  await page.evaluate((patch) => {
    const shell = window.journeyReview.shell;
    shell.newGame({ consentToken: shell.snapshot().title?.consentToken ?? null });
    if (patch) shell.changeSettings(patch);
  }, settings);
  return { context, page };
}
const reach = (page, predicate) => page.evaluate((source) => window.journeyReview.playUntil(new Function("m", `return (${source})(m)`)), predicate);
const settle = (page) => page.waitForTimeout(450);

/** Layout facts of the current screen. */
function layoutFacts(page) {
  return page.evaluate(() => {
    const box = (element) => { const r = element.getBoundingClientRect(); return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height }; };
    const root = document.querySelector(".jk-journey");
    const visible = (element) => !element.closest("[hidden]") && element.getBoundingClientRect().width > 0;
    const stage = box(document.querySelector(".jk-stage"));
    const dockChild = [...document.querySelectorAll(".jk-dialogue, .jk-choices")].find(visible);
    const eyes = [...document.querySelectorAll(".jk-actor[data-state=shown]")].map((actor) => { const r = actor.getBoundingClientRect(); return r.top + parseFloat(actor.style.getPropertyValue("--eye")) * r.height; });
    const nested = [...root.querySelectorAll("*")].filter((element) => { const style = getComputedStyle(element); return /(auto|scroll)/.test(style.overflowY + style.overflowX) && (element.scrollHeight > element.clientHeight + 1 || element.scrollWidth > element.clientWidth + 1); }).map((element) => element.className);
    const targets = [...root.querySelectorAll("button")].filter(visible).map((button) => ({ name: button.className, ...box(button) })).filter((b) => b.width < 44 || b.height < 44);
    return {
      width: innerWidth, height: innerHeight, scrollWidth: document.documentElement.scrollWidth,
      mode: root.dataset.overflow === "true" ? "flow" : "fit", text: root.dataset.text,
      band: [innerHeight * 0.32, innerHeight * 0.48], stage, eyes, dock: dockChild ? box(dockChild) : null,
      hud: box(document.querySelector(".jk-hud__capsule")), settings: box(document.querySelector(".jk-settings")), nested, smallTargets: targets,
    };
  });
}

// ---------------------------------------------------------------------- layout matrix
for (const [width, height] of VIEWPORTS) {
  for (const scale of SCALES) {
    const { context, page } = await open({ viewport: { width, height } }, scale === 1 ? null : { fontScale: scale });
    for (const [name, predicate] of STATES) {
      await reach(page, predicate);
      await settle(page);
      const facts = await layoutFacts(page);
      const tag = `${width}x${height} text ${scale * 100}% ${name}`;
      check(facts.scrollWidth <= facts.width, `${tag}: sideways scroll ${facts.scrollWidth}`);
      check(facts.nested.length === 0, `${tag}: nested scroll ${facts.nested.join(",")}`);
      check(facts.smallTargets.length === 0, `${tag}: small targets ${JSON.stringify(facts.smallTargets)}`);
      check(facts.hud.right + 4 <= facts.settings.left, `${tag}: HUD capsule touches the settings button`);
      check(facts.dock !== null, `${tag}: no dock`);
      if (facts.mode === "fit") {
        check(facts.eyes.every((eye) => eye >= facts.band[0] && eye <= facts.band[1]), `${tag}: eyes outside the band ${facts.eyes.map(Math.round)}`);
        check(facts.dock.top >= facts.band[1] - 0.5, `${tag}: dock enters the face band at ${Math.round(facts.dock.top)}`);
        check(facts.hud.bottom <= facts.band[0] && facts.settings.bottom <= facts.band[0], `${tag}: HUD enters the face band`);
      } else {
        check(facts.eyes.every((eye) => eye > facts.stage.top && eye < facts.stage.bottom), `${tag}: eyes outside the stage strip`);
        check(facts.dock.top >= facts.stage.bottom - 0.5, `${tag}: dock overlaps the stage strip`);
      }
      evidence.layout.push({ tag, mode: facts.mode, eyes: facts.eyes.map(Math.round), band: facts.band.map(Math.round), dockTop: Math.round(facts.dock?.top ?? -1), scrollWidth: facts.scrollWidth });
      if (name === "five-choices" || (name === "three-on-stage" && scale === 1)) {
        const file = `${width}x${height}-text${scale * 100}-${name}.jpg`;
        await page.screenshot({ path: resolve(output, file), type: "jpeg", quality: 70, fullPage: facts.mode === "flow" });
        evidence.screenshots.push(file);
      }
    }
    await context.close();
  }
}

// ------------------------------------------------------------------- pixel contrast
const luminanceScript = async ({ base64, color }) => {
  const channel = (value) => { const v = value / 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
  const lum = (r, g, b) => 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
  const blob = await (await fetch(`data:image/png;base64,${base64}`)).blob();
  const bitmap = await createImageBitmap(blob);
  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
  const context2d = canvas.getContext("2d");
  context2d.drawImage(bitmap, 0, 0);
  const data = context2d.getImageData(0, 0, bitmap.width, bitmap.height).data;
  const text = lum(...color);
  let worst = Infinity;
  for (let i = 0; i < data.length; i += 4) {
    const back = lum(data[i], data[i + 1], data[i + 2]);
    const ratio = (Math.max(text, back) + 0.05) / (Math.min(text, back) + 0.05);
    if (ratio < worst) worst = ratio;
  }
  return worst;
};

/** The worst contrast between an element's text colour and every pixel behind its text. */
async function measure(page, selector, index = 0) {
  const target = await page.evaluate(({ selector, index }) => {
    const element = [...document.querySelectorAll(selector)].filter((node) => !node.closest("[hidden]") && node.getBoundingClientRect().width > 0)[index];
    if (!element) return null;
    // The pixels behind the glyphs: the text's own line boxes, inside padding and rounded corners.
    const range = document.createRange();
    range.selectNodeContents(element);
    const r = range.getBoundingClientRect();
    const color = getComputedStyle(element).color.match(/[\d.]+/g).slice(0, 3).map(Number);
    element.setAttribute("data-measure", "");
    return { clip: { x: Math.max(0, r.left), y: Math.max(0, r.top), width: Math.min(r.width, innerWidth - r.left), height: Math.min(r.height, innerHeight - r.top) }, color, text: element.textContent.trim().slice(0, 24) };
  }, { selector, index });
  if (target === null) return null;
  await page.addStyleTag({ content: "[data-measure], [data-measure] * { color: transparent !important; text-shadow: none !important; }" });
  await page.waitForTimeout(60);
  const png = await page.screenshot({ clip: target.clip, type: "png" });
  await page.evaluate(() => { document.querySelector("[data-measure]")?.removeAttribute("data-measure"); document.querySelectorAll("style").forEach((style) => { if (style.textContent.includes("[data-measure]")) style.remove(); }); });
  const worst = await page.evaluate(luminanceScript, { base64: png.toString("base64"), color: target.color });
  return { ...target, worst: Math.round(worst * 100) / 100 };
}

for (const [width, height] of [[390, 844], [1440, 900]]) {
  const { context, page } = await open({ viewport: { width, height } });
  const plates = [
    ["a1-01 willow roots", "(m) => m.scene.nodeId === 'a1-01' && m.line?.speaker === 'กิบ'"],
    ["a1-03 bamboo dusk", "(m) => m.scene.nodeId === 'a1-03' && m.mode === 'DECISION'"],
    ["a1-06 overflow weir", "(m) => m.scene.nodeId === 'a1-06' && m.mode === 'DECISION'"],
    ["a1-07 overflow weir", "(m) => m.scene.nodeId === 'a1-07' && m.mode === 'VN'"],
  ];
  const record = (where, kind, minimum, result) => {
    if (result === null) return;
    evidence.contrast.push({ viewport: `${width}x${height}`, where, kind, minimum, ...result });
    check(result.worst >= minimum, `${width}x${height} ${where} ${kind} contrast ${result.worst} < ${minimum}`);
  };
  for (const [where, predicate] of plates) {
    await reach(page, predicate);
    await page.waitForTimeout(900);
    for (let i = 0; i < 3; i += 1) record(where, `HUD label ${i + 1}`, 4.5, await measure(page, ".jk-meter__label", i));
    record(where, "dialogue line", 7, await measure(page, ".jk-dialogue__text"));
    record(where, "speaker name", 7, await measure(page, ".jk-dialogue__name"));
    record(where, "card label", 7, await measure(page, ".jk-card__label"));
    record(where, "card tag", 4.5, await measure(page, ".jk-tag:not([hidden])"));
    record(where, "card cost", 4.5, await measure(page, ".jk-card__cost:not([hidden])"));
  }
  // Worst case: the glass over a plain white plate.
  await page.addStyleTag({ content: ".jk-stage__bg, .jk-stage__cast, .jk-stage__shade { visibility: hidden !important; } .jk-stage__plate { background: #ffffff !important; }" });
  await page.waitForTimeout(200);
  for (let i = 0; i < 3; i += 1) record("white plate", `HUD label ${i + 1}`, 4.5, await measure(page, ".jk-meter__label", i));
  await context.close();
}

// ------------------------------------------------------- motion · transparency · colors
{
  const { context, page } = await open({ viewport: { width: 390, height: 844 }, reducedMotion: "no-preference" });
  await reach(page, STATES[0][1]);
  evidence.media.fullMotion = await page.evaluate(() => ({ motion: document.querySelector(".jk-journey").dataset.motion, lineAnimation: getComputedStyle(document.querySelector(".jk-dialogue__text")).animationName, actorTransition: getComputedStyle(document.querySelector(".jk-actor")).transitionDuration }));
  check(evidence.media.fullMotion.motion === "full" && /jk-line-[ab]/.test(evidence.media.fullMotion.lineAnimation), "full motion does not animate the line");
  await context.close();
}
{
  const { context, page } = await open({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
  await reach(page, STATES[0][1]);
  evidence.media.reducedMotion = await page.evaluate(() => ({ motion: document.querySelector(".jk-journey").dataset.motion, lineAnimation: getComputedStyle(document.querySelector(".jk-dialogue__text")).animationName, actorTransition: getComputedStyle(document.querySelector(".jk-actor")).transitionDuration, nextAnimation: getComputedStyle(document.querySelector(".jk-dialogue__next-icon")).animationName }));
  const durations = evidence.media.reducedMotion.actorTransition.split(",").map((value) => parseFloat(value));
  check(evidence.media.reducedMotion.motion === "reduced" && evidence.media.reducedMotion.lineAnimation === "none" && evidence.media.reducedMotion.nextAnimation === "none" && durations.every((value) => value <= 0.12), `reduced motion: ${JSON.stringify(evidence.media.reducedMotion)}`);
  await context.close();
}
{
  const { context, page } = await open({ viewport: { width: 390, height: 844 } });
  const glass = () => page.evaluate(() => { const style = getComputedStyle(document.querySelector(".jk-hud__capsule")); return { backdrop: style.backdropFilter, background: style.backgroundColor }; });
  evidence.media.glass = await glass();
  check(/blur/.test(evidence.media.glass.backdrop), "the HUD is not frosted by default");
  const cdp = await context.newCDPSession(page);
  await cdp.send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-transparency", value: "reduce" }] });
  evidence.media.reducedTransparency = { supported: await page.evaluate(() => matchMedia("(prefers-reduced-transparency: reduce)").matches), ...(await glass()) };
  check(evidence.media.reducedTransparency.supported && evidence.media.reducedTransparency.backdrop === "none" && evidence.media.reducedTransparency.background === "rgb(28, 47, 37)", `reduced transparency: ${JSON.stringify(evidence.media.reducedTransparency)}`);
  await cdp.send("Emulation.setEmulatedMedia", { features: [] });
  await page.evaluate(() => window.journeyReview.shell.changeSettings({ highContrast: true }));
  evidence.media.highContrast = await glass();
  check(evidence.media.highContrast.backdrop === "none" && evidence.media.highContrast.background === "rgb(28, 47, 37)", `high contrast: ${JSON.stringify(evidence.media.highContrast)}`);
  await page.evaluate(() => window.journeyReview.shell.changeSettings({ highContrast: false }));
  await page.emulateMedia({ forcedColors: "active" });
  evidence.media.forcedColors = await page.evaluate(() => {
    const paper = getComputedStyle(document.querySelector(".jk-dialogue"));
    const glass = getComputedStyle(document.querySelector(".jk-hud__capsule"));
    return { active: matchMedia("(forced-colors: active)").matches, paperBackground: paper.backgroundColor, paperBorder: paper.borderTopWidth, glassBackdrop: glass.backdropFilter };
  });
  check(evidence.media.forcedColors.active && evidence.media.forcedColors.glassBackdrop === "none" && evidence.media.forcedColors.paperBorder === "2px", `forced colors: ${JSON.stringify(evidence.media.forcedColors)}`);
  await page.screenshot({ path: resolve(output, "390x844-forced-colors.jpg"), type: "jpeg", quality: 70 });
  evidence.screenshots.push("390x844-forced-colors.jpg");
  await context.close();
}

// ------------------------------------------- keyboard only · layout shift · silent save
{
  const { context, page } = await open({ viewport: { width: 1440, height: 900 } });
  await page.evaluate(() => {
    window.__shift = 0;
    window.__shiftSources = [];
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        window.__shift += entry.value;
        window.__shiftSources.push({ value: entry.value, nodes: (entry.sources ?? []).map((source) => source.node?.className ?? source.node?.nodeName ?? "?") });
      }
    }).observe({ type: "layout-shift", buffered: false });
  });
  let presses = 0;
  for (; presses < 120; presses += 1) {
    const mode = await page.evaluate(() => window.journeyReview.shell.snapshot().model.mode);
    if (mode === "DECISION") break;
    await page.keyboard.press(presses % 2 === 0 ? "Space" : "Enter");
  }
  const before = await page.evaluate(() => window.journeyReview.shell.snapshot().model);
  await page.keyboard.press("2");
  await page.keyboard.press("2");
  const after = await page.evaluate(() => ({ model: window.journeyReview.shell.snapshot().model, focus: document.activeElement?.className ?? "" }));
  evidence.keyboard = { presses, decision: before.scene.nodeId, choseRevision: before.revision, afterRevision: after.model.revision, focus: after.focus };
  check(before.mode === "DECISION" && after.model.revision === before.revision + 1, `keyboard-only choice: ${JSON.stringify(evidence.keyboard)}`);
  for (let i = 0; i < 30; i += 1) await page.keyboard.press("Space");
  await page.waitForTimeout(300);
  const shift = await page.evaluate(() => window.__shift);
  evidence.layoutShift.push({ during: "reading, a choice and thirty more lines", cumulative: shift, sources: await page.evaluate(() => window.__shiftSources.slice(0, 12)) });
  check(shift <= 0.01, `layout shift ${shift}`);
  const saved = await page.evaluate(() => ({ notice: !document.querySelector(".jk-notice").hidden, keys: Object.keys(localStorage).sort(), live: [...document.querySelectorAll(".jk-journey [aria-live]")].map((node) => node.textContent).join(" ") }));
  evidence.silentSave = saved;
  check(!saved.notice && saved.keys.includes("jaokob:journey:story.jaokob.core:canonical") && !/บันทึก/.test(saved.live), `silent save: ${JSON.stringify(saved)}`);
  await context.close();
}

// ------------------------------------------------------------- memory on scene change
{
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  await page.goto(PLAY);
  await page.waitForFunction(() => document.documentElement.dataset.reviewReady === "true");
  await cdp.send("Performance.enable");
  for (let run = 1; run <= 3; run += 1) {
    await page.evaluate(() => {
      const review = window.journeyReview;
      const shell = review.shell;
      if (shell.snapshot().phase === "playing") shell.leave();
      shell.newGame({ consentToken: shell.snapshot().title?.consentToken ?? null });
      review.playUntil((m) => m.pending === "boundary", 600);
    });
    await page.waitForTimeout(700);
    await cdp.send("HeapProfiler.collectGarbage");
    const metrics = Object.fromEntries((await cdp.send("Performance.getMetrics")).metrics.map((m) => [m.name, m.value]));
    const { result } = await cdp.send("Runtime.evaluate", { expression: "document" });
    const listeners = (await cdp.send("DOMDebugger.getEventListeners", { objectId: result.objectId })).listeners.filter((l) => l.type === "keydown").length;
    const dom = await page.evaluate(() => ({ nodes: document.getElementsByTagName("*").length, actors: document.querySelectorAll(".jk-actor").length, toasts: document.querySelectorAll(".jk-toast").length, node: window.journeyReview.shell.snapshot().model.scene.nodeId }));
    evidence.memory.push({ run, heapBytes: metrics.JSHeapUsedSize, documents: metrics.Documents, keydownListeners: listeners, ...dom });
  }
  const [first, , third] = evidence.memory;
  check(third.nodes <= first.nodes + 5, `DOM grows across plays: ${first.nodes} → ${third.nodes}`);
  check(third.keydownListeners === first.keydownListeners, "keyboard listeners pile up");
  check(third.actors <= 5 && third.toasts <= 3, "leaving actors or toasts are not removed");
  check(third.heapBytes - first.heapBytes < 2 * 1024 * 1024, `JS heap grows ${(third.heapBytes - first.heapBytes) / 1024} KiB across plays`);
  await context.close();
}

await browser.close();
server.close();
check(evidence.errors.length === 0, `browser errors: ${evidence.errors.join(" | ")}`);
evidence.summary = { layoutChecks: evidence.layout.length, contrastChecks: evidence.contrast.length, worstDialogue: Math.min(...evidence.contrast.filter((c) => c.minimum === 7).map((c) => c.worst)), worstHud: Math.min(...evidence.contrast.filter((c) => c.kind.startsWith("HUD")).map((c) => c.worst)), failures: evidence.failures.length };
await writeFile(resolve(output, "report.json"), `${JSON.stringify(evidence, null, 2)}\n`);
console.log(`C4 evidence: ${evidence.layout.length} layout states · ${evidence.contrast.length} contrast samples · worst dialogue ${evidence.summary.worstDialogue}:1 · worst HUD ${evidence.summary.worstHud}:1 · ${evidence.failures.length} failures`);
for (const failure of evidence.failures) console.error(`FAIL ${failure}`);
assert.equal(evidence.failures.length, 0);
