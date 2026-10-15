/** Scoped Slice 2 native-browser evidence. Temporary server/contexts only.
 * Trace: TC-S4-POUCH-002, TC-S4-SAVE-001/002, TC-S4-A11Y-001.
 */
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createHash } from "node:crypto";
import { envelope, walk } from "../helpers/act1-session.js";

const playwright = await import(process.env.JKB_PLAYWRIGHT_PATH ? pathToFileURL(process.env.JKB_PLAYWRIGHT_PATH).href : "playwright");
const root = resolve(fileURLToPath(new URL("../..", import.meta.url)));
const output = resolve(root, process.env.JKB_EVIDENCE_DIR ?? "tests/e2e/evidence/sprint-04/slice-02");
await mkdir(output, { recursive: true });
const fixture = `<!doctype html><html lang="th"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>กระเป๋าของสะสม: ชุดทดสอบ</title><link rel="icon" href="./assets/images/ui/lotus-mark.svg"><link rel="stylesheet" href="./src/ui/styles/index.css"><body><main id="app" class="jk-app"><button id="opener">เปิดกระเป๋าตัวอย่าง</button></main><script type="module">
import {createKeepsakePouchDialog} from './src/ui/components/keepsake-pouch-dialog.js';
import {TH_SYSTEM_MESSAGES as messages} from './src/ui/localization/th-system-messages.js';
import {createPouch,collectItem,refuseItem,releaseItem,replaceItem,useItem} from './src/core/domain/keepsake-pouch.js';
const root=document.querySelector('#app'), params=new URLSearchParams(location.search), count=Number(params.get('count')||0);
root.style.fontSize=params.get('scale')==='2'?'200%':'100%';root.dataset.highContrast=params.get('contrast')==='1'?'true':'false';
const ids=['item_leaf','item_dew_stone','item_lotus_shell','item_rain_petal','item_red_yarn'];
let pouch=createPouch(),revision=1,dialog=null;const intents=[];
for(const id of ids.slice(0,count))pouch=collectItem(pouch,id).value;
const item=id=>({id,name:id==='item_leaf'?'เศษใบบัว':'ของสะสมตัวอย่าง '+(ids.indexOf(id)+1),description:'ขอบใบสีเขียวอ่อน ชวนให้นึกถึงแสงใต้ใบบัวใหญ่และจังหวะน้ำที่คุ้นเคย',memoryText:'ใบบัวชิ้นเล็กไม่ใช่บ้านทั้งหลัง แต่มันยังจำสีของบ้านได้',status:pouch.held.includes(id)?'held':pouch.released.includes(id)?'released':'refused',image:{src:new URL('./assets/images/keepsakes/leaf.svg',location.href).href,alt:'ภาพเศษใบบัวสำหรับตรวจการแสดงผล'},opportunityId:'opportunity.fixture',actions:[{action:'release',enabled:true},{action:'use',enabled:false}]});
function view(){return{revision,viewRevision:revision,pouch:{capacity:4,used:pouch.held.length,slots:Array.from({length:4},(_,i)=>pouch.held[i]?item(pouch.held[i]):null),memories:pouch.remembered.filter(id=>!pouch.held.includes(id)).map(item),...(params.has('offer')?{offer:{id:'opportunity.fixture',item:item(ids[4])}}:{})}}}
function open(){dialog=createKeepsakePouchDialog({document,viewModel:view(),message:key=>messages[key],onIntent:intent=>{intents.push(intent);if(intent.type==='POUCH_ACTION'){const operations={collect:collectItem,refuse:refuseItem,release:releaseItem,use:useItem,replace:replaceItem};const next=intent.action==='replace'?operations.replace(pouch,intent.oldItemId,intent.itemId):operations[intent.action](pouch,intent.itemId);if(next.ok){pouch=next.value;revision++}}dialog.close();dialog.element.remove();document.querySelector('#opener').focus()}});root.append(dialog.element);dialog.open()}
document.querySelector('#opener').addEventListener('click',open);open();
window.render_game_to_text=()=>JSON.stringify({mode:'pouch',coordinates:'semantic DOM, no spatial movement',pouch,revision,intents});
</script></body></html>`;
const mime = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".webp": "image/webp", ".mp3": "audio/mpeg", ".woff2": "font/woff2" };
const resources = new Map();
const server = createServer(async (request, response) => {
  try {
    let path = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
    if (path.startsWith("/JaoKob/")) path = path.slice(7);
    if (path === "/__pouch_fixture") { response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" }).end(fixture); return; }
    const file = resolve(root, `.${path.endsWith("/") ? `${path}index.html` : path}`);
    if (!file.startsWith(`${root}${sep}`)) { response.writeHead(403).end(); return; }
    const bytes = await readFile(file); resources.set(path, { path, bytes: bytes.length, sha256: createHash("sha256").update(bytes).digest("hex") });
    response.writeHead(200, { "Content-Type": `${mime[extname(file)] ?? "application/octet-stream"}; charset=utf-8`, "Cache-Control": "no-store" }).end(bytes);
  } catch { response.writeHead(404).end(); }
});
await new Promise(done => server.listen(0, "127.0.0.1", done));
const origin = `http://127.0.0.1:${server.address().port}`;
if (process.env.JKB_POUCH_SERVE_ONLY === "1") {
  console.log(`${origin}/__pouch_fixture?count=1`);
  await new Promise(done => { const stop = () => server.close(done); process.once("SIGINT", stop); process.once("SIGTERM", stop); });
  process.exit(0);
}
const browser = await playwright.chromium.launch({ headless: process.env.JKB_HEADED !== "1" });
const evidence = { at: new Date().toISOString(), browser: browser.version(), platform: process.platform, profiles: [], checks: [], screenshots: [], errors: [], resources: [] };
const saveKey = "jaokob:save:canonical";
const capture = async (page, name) => { await page.screenshot({ path: resolve(output, name), fullPage: true }); evidence.screenshots.push(name); };
const idle = page => page.waitForFunction(() => document.querySelector("#app")?.getAttribute("aria-busy") === "false");
async function context(viewport, extra = {}) {
  const ctx = await browser.newContext({ viewport, reducedMotion: "reduce", ...extra }), page = await ctx.newPage();
  page.on("pageerror", error => evidence.errors.push(error.message));
  page.on("console", msg => { if (msg.type() === "error") evidence.errors.push(msg.text()); });
  page.on("request", req => { if (!req.url().startsWith(origin) && !/^(blob:|data:)/.test(req.url())) evidence.errors.push(`External: ${req.url()}`); });
  return { ctx, page };
}
async function geometry(page) {
  return page.locator('[data-jk-role="pouch-dialog"]').evaluate(dialog => {
    const rect = node => { const r = node.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height, bottom: r.bottom, right: r.right }; };
    const body = dialog.querySelector('[data-jk-role="modal-scroll"]'), grid = dialog.querySelector('[data-jk-role="pouch-grid"]');
    return { dialog: rect(dialog), close: rect(dialog.querySelector('[data-jk-role="modal-close"]')), slots: [...grid.children].map(rect),
      overflow: body.scrollWidth > body.clientWidth + 1, gap: getComputedStyle(grid).gap, bodyHeight: body.clientHeight,
      smallTargets: [...dialog.querySelectorAll('button:not(:disabled)')].map(rect).filter(r => r.width < 43.9 || r.height < 43.9),
      font: getComputedStyle(body).fontSize, width: innerWidth, height: innerHeight };
  });
}
function assertGeometry(g) {
  assert.equal(g.slots.length, 4); assert.equal(g.overflow, false); assert.deepEqual(g.smallTargets, []);
  assert.ok(g.dialog.x >= 0 && g.dialog.right <= g.width + 1); assert.ok(g.dialog.y >= 0 && g.dialog.bottom <= g.height + 1);
  assert.equal(g.gap, "16px");
  assert.ok(Math.max(...g.slots.map(s => s.width)) - Math.min(...g.slots.map(s => s.width)) < 1);
  assert.ok(Math.max(...g.slots.map(s => s.height)) - Math.min(...g.slots.map(s => s.height)) < 1);
  assert.ok(g.close.width >= 44 && g.close.height >= 44); assert.ok(g.close.bottom <= g.height);
}
try {
  // Fixtures are explicit test-only catalogs; production still has one leaf.
  for (const [width, height] of [[320, 568], [390, 844], [768, 1024], [1440, 900], [2560, 1440], [844, 390]]) {
    const { ctx, page } = await context({ width, height });
    for (const count of [0, 1, 4]) {
      await page.goto(`${origin}/__pouch_fixture?count=${count}`); await page.locator('dialog[open]').waitFor(); await page.evaluate(() => document.fonts.ready);
      const g = await geometry(page); assertGeometry(g); evidence.profiles.push({ width, height, count, ...g });
      await capture(page, `${width}x${height}-${count === 0 ? "empty" : count === 1 ? "held" : "full"}.png`);
      const before = await page.evaluate(() => render_game_to_text());
      const close = page.locator('[data-jk-role="modal-close"]'); await close.focus(); await page.keyboard.press("Shift+Tab");
      if (count) assert.equal(await page.locator('[data-item-id]').last().evaluate(node => node === document.activeElement), true);
      await page.keyboard.press("Tab"); assert.equal(await close.evaluate(node => node === document.activeElement), true);
      if (count) {
        await page.locator('[data-item-id]').first().click(); await page.locator('#jk-pouch-item-title').waitFor();
        assert.equal(await page.locator('[data-pouch-action="use"]').isDisabled(), true);
        assert.equal(await page.evaluate(() => render_game_to_text()), before);
        const scroll = page.locator('[data-jk-role="modal-scroll"]'), inspectionGeometry = await geometry(page);
        await scroll.evaluate(node => { node.scrollTop = node.scrollHeight; });
        const g2 = await geometry(page); assertGeometry(g2); assert.deepEqual(g2.close, inspectionGeometry.close);
        if (count === 1) await capture(page, `${width}x${height}-inspection.png`);
      }
      await page.keyboard.press("Escape"); assert.equal(await page.locator('dialog[open]').count(), 0);
      assert.equal(await page.locator('#opener').evaluate(node => node === document.activeElement), true);
    }
    await ctx.close();
  }
  evidence.checks.push("18 empty/partial/full layouts, six profiles, equal slots/16px gaps, 44px targets, pinned close at both scroll ends, native Tab/Shift+Tab/Escape, inspection does not mutate");
  for (const options of [{ scale: 2 }, { contrast: 1 }, { forced: true }]) {
    const { ctx, page } = await context({ width: 320, height: 568 }, options.forced ? { forcedColors: "active" } : {});
    await page.goto(`${origin}/__pouch_fixture?count=4&scale=${options.scale ?? 1}&contrast=${options.contrast ?? 0}`); await page.locator('dialog[open]').waitFor(); await page.evaluate(() => document.fonts.ready);
    assertGeometry(await geometry(page)); await page.locator('[data-item-id]').first().click();
    const g = await geometry(page); assertGeometry(g); await capture(page, `320-${options.scale ? "text200" : options.forced ? "forced-colors" : "high-contrast"}.png`);
    if (options.scale) assert.equal(g.font, "32px");
    await ctx.close();
  }
  // Full offer cancellation, refusal and replacement exercise actual pure reducers.
  for (const action of ["cancel", "refuse", "replace"]) {
    const { ctx, page } = await context({ width: 390, height: 844 });
    await page.goto(`${origin}/__pouch_fixture?count=4&offer=1`); await page.locator('dialog[open]').waitFor();
    const before = JSON.parse(await page.evaluate(() => render_game_to_text()));
    if (action === "cancel") await page.locator('[data-jk-role="pouch-cancel-offer"]').click();
    else {
      await page.locator(action === "replace" ? '[data-replace-item-id="item_leaf"]' : '[data-pouch-action="refuse"]').click();
      assert.deepEqual(JSON.parse(await page.evaluate(() => render_game_to_text())), before);
      await capture(page, `390-full-${action}-confirmation.png`); await page.locator('[data-jk-role="pouch-confirm"]').click();
    }
    const after = JSON.parse(await page.evaluate(() => render_game_to_text()));
    assert.equal(after.revision, before.revision + (action === "cancel" ? 0 : 1));
    if (action === "replace") { assert.deepEqual(after.pouch.held, ["item_red_yarn", "item_dew_stone", "item_lotus_shell", "item_rain_petal"]); assert.deepEqual(after.pouch.released, ["item_leaf"]); }
    else assert.deepEqual(after.pouch.held, before.pouch.held);
    if (action === "refuse") assert.deepEqual(after.pouch.memory, ["refused_red_yarn"]);
    await ctx.close();
  }
  evidence.checks.push("full-pouch offer: cancel retains exact state, refusal remembers without dropping, confirmed replacement changes one slot atomically");
  // Real production boot/Resume: no test globals or alternate application code.
  for (const prefix of ["", "/JaoKob"]) {
    const { ctx, page } = await context({ width: prefix ? 320 : 1440, height: prefix ? 568 : 900 }, prefix ? { isMobile: true, hasTouch: true } : {});
    const legacy = JSON.stringify(envelope(walk().at(-1))), activate = control => prefix ? control.tap() : control.click();
    await ctx.addInitScript(({ saveKey, legacy }) => { if (!localStorage.getItem(saveKey)) localStorage.setItem(saveKey, legacy); }, { saveKey, legacy });
    await page.goto(`${origin}${prefix}/index.html`); await page.locator('[data-choice-id="application.resume"]').waitFor(); await idle(page);
    await activate(page.locator('[data-choice-id="application.resume"]')); await idle(page);
    const opener = page.locator('[data-choice-id="application.pouch"]'); await activate(opener); await page.locator('dialog[open]').waitFor(); await idle(page);
    assert.equal(await page.evaluate(key => localStorage.getItem(key), saveKey), legacy);
    assert.equal(await page.locator('.jk-app-shell[inert]').count(), 1);
    await activate(page.locator('[data-item-id="item_leaf"]'));
    assert.equal(await page.locator('[data-pouch-action="use"]').isDisabled(), true);
    await activate(page.locator('[data-pouch-action="release"]')); await activate(page.locator('[data-jk-role="pouch-cancel"]'));
    assert.equal(await page.evaluate(key => localStorage.getItem(key), saveKey), legacy);
    if (prefix) await activate(page.locator('[data-jk-role="modal-close"]')); else await page.keyboard.press("Escape");
    await idle(page); assert.equal(await opener.evaluate(node => node === document.activeElement), true);
    await activate(opener); await idle(page); await activate(page.locator('[data-item-id="item_leaf"]'));
    await capture(page, `${prefix ? "subpath-320" : "root-1440"}-production-inspection.png`);
    await activate(page.locator('[data-pouch-action="release"]')); await activate(page.locator('[data-jk-role="pouch-confirm"]')); await idle(page);
    const saved = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), saveKey), prior = JSON.parse(legacy);
    assert.equal(saved.saveFormatVersion, 2); assert.equal(saved.revision, prior.revision + 1);
    assert.deepEqual(saved.payload.pouch.held, []); assert.deepEqual(saved.payload.pouch.remembered, ["item_leaf"]); assert.deepEqual(saved.payload.flags, prior.payload.flags); assert.deepEqual(saved.payload.metrics, prior.payload.metrics);
    assert.equal(await page.evaluate(() => localStorage.getItem("jaokob:save:backup")), legacy);
    await page.reload(); await activate(page.locator('[data-choice-id="application.resume"]')); await idle(page); await activate(page.locator('[data-choice-id="application.pouch"]')); await idle(page);
    assert.equal(await page.locator('[data-item-id="item_leaf"]').count(), 0); await activate(page.locator('[data-memory-id="item_leaf"]'));
    assert.match(await page.locator('[data-jk-role="pouch-item-status"]').textContent(), /ส่งต่อแล้ว/);
    await capture(page, `${prefix ? "subpath-320" : "root-1440"}-remembered.png`); await ctx.close();
  }
  evidence.checks.push("production root/subpath and touch: pure Save 1 Resume, immutable inspect/cancel, inert underlay, opener restore, one Save 2 release, exact legacy backup, released memory survives reload with unchanged flags/meters");
  // Controlled image failure: original text remains readable.
  {
    const { ctx, page } = await context({ width: 390, height: 844 });
    await page.route('**/leaf.svg', route => route.fulfill({ status: 200, contentType: "image/svg+xml", body: "invalid image" }));
    await page.goto(`${origin}/__pouch_fixture?count=1`); await page.locator('[data-item-id]').click();
    await page.locator('.jk-pouch-detail .jk-pouch-image-fallback:not([hidden])').waitFor();
    assert.match(await page.locator('[data-jk-role="pouch-detail"]').textContent(), /ภาพยังไม่พร้อม/); await capture(page, "390-image-fallback.png"); await ctx.close();
  }
  assert.deepEqual(evidence.errors, []); evidence.result = "PASS";
  console.log(JSON.stringify({ result: evidence.result, layouts: evidence.profiles.length, screenshots: evidence.screenshots.length, checks: evidence.checks, errors: evidence.errors }, null, 2));
} catch (error) { evidence.result = "FAIL"; evidence.failure = error.stack; throw error; }
finally {
  evidence.resources = [...resources.values()].sort((a, b) => a.path.localeCompare(b.path));
  await writeFile(resolve(output, "pouch-browser.json"), `${JSON.stringify(evidence, null, 2)}\n`);
  await browser.close(); await new Promise(done => server.close(done));
}
