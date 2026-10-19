// CR-0004 / ADR-P0-025: functional state + actual rendered mesh/material inspection.
// Private scene inspection is test-only and pinned to model-viewer 4.4.0.
import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
const { chromium } = await import(pathToFileURL(process.env.JKB_PLAYWRIGHT_PATH).href);
const base = process.env.JKB_PREVIEW_URL ?? 'http://127.0.0.1:4174';
const doll = process.argv.includes('--adult') ? 'adult' : 'childhood';
const other = doll === 'adult' ? 'childhood' : 'adult';
const bodyName = doll === 'adult' ? 'JaoKob_Adult_Body' : 'JaoKob_Childhood_Body';
const modelName = doll === 'adult' ? 'jaokob-adult-plush' : 'jaokob-childhood-crochet';
const evidence = new URL('../evidence/', import.meta.url);
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 1100 }, reducedMotion: 'reduce' });
const requests = [], errors = [], states = [];
page.on('request', r => requests.push(r.url()));
page.on('pageerror', e => errors.push(e.message));
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
const ready = () => page.waitForFunction(() => JSON.parse(window.render_game_to_text()).mode === 'ready');
async function inspect(stance, material) {
  await page.waitForFunction(({stance,material}) => {
    const el = document.querySelector('model-viewer');
    return el?.loaded && el.currentTime === (stance === 'heart' ? 1 : 0) && el.variantName === material;
  }, {stance,material});
  await page.waitForTimeout(150);
  const result = await page.locator('model-viewer').evaluate((el, bodyName) => {
    const scene = el[Object.getOwnPropertySymbols(el).find(s => s.description === 'scene')];
    const nodes = {};
    for (const name of [bodyName,'Stance_EmptyHands','Stance_HeartEmote','Accessory_RedHeart']) {
      const obj = scene.getObjectByName(name);
      const materials = [];
      obj.traverse(child => { if (child.isMesh) materials.push({name:child.material.name,normal:Boolean(child.material.normalMap),map:Boolean(child.material.map)}); });
      nodes[name] = {scale:obj.scale.toArray(),materials};
    }
    return {nodes, paused:el.paused, currentTime:el.currentTime, variants:el.availableVariants, alt:el.alt};
  }, bodyName);
  assert.equal(result.paused,true);
  assert.deepEqual(result.variants,['Velour','Crochet']);
  for (const name of ['Stance_EmptyHands','Stance_HeartEmote','Accessory_RedHeart']) {
    const visible = name === 'Stance_EmptyHands' ? stance === 'empty' : stance === 'heart';
    assert.ok(result.nodes[name].scale.every(x => visible ? x > 0 : x === 0), name);
  }
  const fabric = result.nodes.Stance_EmptyHands.materials[0];
  assert.equal(fabric.normal,material === 'Crochet');
  assert.equal(fabric.map,material === 'Crochet');
  assert.match(result.alt, stance === 'empty' ? /มือเปล่า/ : /กอดหัวใจ/);
  assert.equal(await page.locator(`[data-stance="${stance}"]`).getAttribute('aria-pressed'),'true');
  assert.equal(await page.locator(`[data-material="${material}"]`).getAttribute('aria-pressed'),'true');
  states.push({stance,material,...result});
}
try {
  await page.goto(base+'/preview/');
  await page.locator(`[data-doll="${doll}"]`).click();
  await page.locator('[data-stance="heart"]').click();
  await page.locator('[data-material="Crochet"]').click();
  assert.match(await page.locator('#poster').getAttribute('src'),/poster-heart-crochet/);
  assert.equal(requests.some(u => /\.glb|model-viewer/.test(u)),false);
  await page.reload();
  await page.locator(`[data-doll="${doll}"]`).click();
  assert.equal(await page.locator('[data-stance="empty"]').getAttribute('aria-pressed'),'true');
  assert.equal(await page.locator('[data-material="Velour"]').getAttribute('aria-pressed'),'true');
  await page.locator('#open').click(); await ready();
  await inspect('empty','Velour');
  await page.screenshot({path:new URL(`${doll}-preview-desktop.png`,evidence).pathname,fullPage:true});
  const glbRequests = requests.filter(u => u.includes('.glb')).length;
  for (const [stance,material] of [['heart','Velour'],['heart','Crochet'],['empty','Crochet'],['empty','Velour']]) {
    await page.locator(`[data-stance="${stance}"]`).focus(); await page.keyboard.press('Enter');
    await page.locator(`[data-material="${material}"]`).click();
    await inspect(stance,material);
    assert.equal(await page.locator(`[data-material="${material}"]`).evaluate(e=>e===document.activeElement),true);
    await page.screenshot({path:new URL(`${doll}-${stance}-${material.toLowerCase()}-web.png`,evidence).pathname,fullPage:true});
  }
  assert.equal(requests.filter(u => u.includes('.glb')).length,glbRequests);
  for (let i=0;i<5;i++) {
    await page.locator('[data-stance="heart"]').click();
    await page.locator('[data-material="Crochet"]').click();
    await page.locator('[data-stance="empty"]').click();
    await page.locator('[data-material="Velour"]').click();
  }
  await inspect('empty','Velour');
  await page.locator('[data-stance="heart"]').click();
  await page.locator('[data-material="Crochet"]').click();
  await page.keyboard.press('Escape');
  assert.match(await page.locator('#poster').getAttribute('src'),/poster-heart-crochet/);
  await page.locator('#open').click(); await ready(); await inspect('heart','Crochet');
  await page.locator(`[data-doll="${other}"]`).click(); await ready();
  assert.equal(await page.locator('#variant-options').isVisible(),true);
  assert.equal(await page.locator('[data-stance="empty"]').getAttribute('aria-pressed'),'true');
  assert.equal(await page.locator('[data-material="Velour"]').getAttribute('aria-pressed'),'true');
  await page.locator('[data-stance="heart"]').click();
  await page.locator(`[data-doll="${doll}"]`).click(); await ready(); await inspect('heart','Crochet');
  await page.locator(`[data-doll="${other}"]`).click(); await ready();
  assert.equal(await page.locator('[data-stance="heart"]').getAttribute('aria-pressed'),'true');
  assert.equal(await page.locator('[data-material="Velour"]').getAttribute('aria-pressed'),'true');
  await page.reload();
  await page.locator(`[data-doll="${doll}"]`).click();
  let release;
  const gate = new Promise(resolve => { release=resolve; });
  await page.route(`**/${modelName}.glb`, async route => { await gate; await route.continue(); });
  await page.locator('#open').click();
  await page.locator('[data-stance="heart"]').click();
  await page.locator('[data-material="Crochet"]').click();
  release(); await ready(); await inspect('heart','Crochet');
  await page.unrouteAll({behavior:'wait'});
  await page.locator('[data-stance="empty"]').click();
  await page.locator('[data-material="Velour"]').click(); await inspect('empty','Velour');
  for (const width of [390,320]) {
    await page.setViewportSize({width,height:844});
    const layout = await page.evaluate(() => ({overflow:document.documentElement.scrollWidth>innerWidth,
      targets:[...document.querySelectorAll('#variant-options button')].map(e=>({width:e.getBoundingClientRect().width,height:e.getBoundingClientRect().height}))}));
    assert.equal(layout.overflow,false);
    assert.ok(layout.targets.every(t=>t.width>=44 && t.height>=44));
    await page.screenshot({path:new URL(`${doll}-options-${width}.png`,evidence).pathname,fullPage:true});
    if(width===390) await page.screenshot({path:new URL(`${doll}-preview-mobile.png`,evidence).pathname,fullPage:true});
  }
  if(doll === 'adult') {
    await page.setViewportSize({width:1000,height:1100});
    for(const [view, orbit] of [['top','0deg 0deg auto'],['high','30deg 35deg auto']]) {
      await page.locator('model-viewer').evaluate((el,orbit)=>{el.minCameraOrbit="auto 0deg 45%";el.cameraOrbit=orbit;el.jumpCameraToGoal();},orbit);
      await page.waitForTimeout(300);
      const phi = await page.locator("model-viewer").evaluate(el=>el.getCameraOrbit().phi);
      assert.ok(Math.abs(phi - (view === "top" ? 0 : 35*Math.PI/180)) < .001);
      await page.screenshot({path:new URL(`adult-eyelid-${view}-web.png`,evidence).pathname,fullPage:true});
    }
  }
  assert.deepEqual(errors,[]);
  assert.equal(requests.some(u => !u.startsWith(base) && !u.startsWith('blob:'+base) && !u.startsWith('data:')),false);
  await writeFile(new URL(`${doll}-variants-verification.json`,evidence),JSON.stringify({authority:'CR-0004 / ADR-P0-025',doll,status:'passed',browser:browser.version(),states,checks:['raw model defaults checked separately by glTF validator runner','four material/stance combinations inspect rendered node scales and material maps','paused selection without automatic animation','poster choices and reload defaults','keyboard/focus/44px targets/320px and 390px/reduced-motion','no additional GLB requests for variants','rapid switching, close/reopen, per-doll independent memory round-trip and delayed load','no console errors or external network']},null,2)+'\n');
  console.log(`${doll} variant checks passed`);
} finally { await browser.close(); }
