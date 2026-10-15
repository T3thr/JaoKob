/** ADR-P0-019 acceptance against the unmodified production entry point.
 * Isolated browser storage only. No application debug hook or DOM state mutation. */
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {walk,envelope,engine,loaded} from '../helpers/act1-session.js';
import {projectContentView} from '../../src/data/content/content-view-model.js';
const {chromium}=await import(pathToFileURL(process.env.JKB_PLAYWRIGHT_PATH).href);
const origin=process.env.JKB_PREVIEW_URL ?? 'http://127.0.0.1:8001';
const output=resolve('tests/e2e/evidence/sprint-04/slice-01'); await mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true});
const evidence={authority:'ADR-P0-019',origin,at:new Date().toISOString(),browser:browser.version(),checks:[],profiles:[],screenshots:[],errors:[]};
const saveKey='jaokob:save:canonical';
const snapshots=walk(), decision=snapshots.find(s=>s.currentNodeId==='node.act1.home-focus'&&!engine.facts(s).canAdvance),storm=snapshots.find(s=>s.currentNodeId==='node.act1.storm'), survival=snapshots.find(s=>s.currentNodeId==='node.act1.survival'&&!engine.facts(s).canAdvance);
const control=(page,id)=>page.locator(`.jk-app-shell:not([inert]) [data-choice-id="${id}"]:visible, dialog[open] [data-choice-id="${id}"]:visible`).last();
async function idle(page){await page.locator('#app[aria-busy="false"]').waitFor();}
async function click(page,id){await control(page,id).click();await idle(page);}
async function open(viewport,snapshot){
 const ctx=await browser.newContext({viewport,reducedMotion:'reduce'});
 if(snapshot)await ctx.addInitScript(({key,value})=>{if(!sessionStorage.seeded){localStorage.setItem(key,value);sessionStorage.seeded='1';}}, {key:saveKey,value:JSON.stringify(envelope(snapshot))});
 const page=await ctx.newPage();page.on('pageerror',e=>evidence.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')evidence.errors.push(m.text());});
 await page.goto(origin); await idle(page); await page.evaluate(()=>document.fonts.ready);
 return {ctx,page};
}
async function shot(page,name){await page.screenshot({path:resolve(output,name)});evidence.screenshots.push(name);}
async function readPages(page){
 let text='',count=0; const before=await page.evaluate(key=>localStorage.getItem(key),saveKey);
 for(;;){
  assert.ok(++count<100);
  const facts=await page.locator('.jk-reading-body').evaluate(body=>{
   const p=body.querySelector('.jk-dialogue'),r=p.getBoundingClientRect(),b=body.getBoundingClientRect();
   return {text:p.textContent,top:r.top,bottom:r.bottom,bodyBottom:b.bottom,bodyTop:b.top,overflow:getComputedStyle(body).overflowY};
  });
  assert.ok(facts.bottom<=facts.bodyBottom+1 && facts.top>=facts.bodyTop-1,JSON.stringify(facts)); assert.equal(facts.overflow,'visible'); text+=facts.text;
  if(await page.locator('#app').getAttribute('data-reading-more')!=='true')break;
  await control(page,'application.advance').click();await idle(page);
  assert.equal(await page.evaluate(key=>localStorage.getItem(key),saveKey),before,'physical pages cannot commit a Core beat');
 }
 return {text,count};
}
try{
 for(const [width,height] of [[320,568],[390,844],[768,1024],[1440,900],[2560,1440],[844,390]]){
  const {ctx,page}=await open({width,height},decision);await click(page,'application.resume');
  const expected=projectContentView({loaded,snapshot:decision,facts:engine.facts(decision),settings:envelope(decision).settings,mode:'game'}).scene.dialogue;
  const reading=await readPages(page);assert.equal(reading.text,expected,'all authored Thai text survives presentation pagination');
  const geometry=await page.locator('.jk-choice-slot').evaluate(slot=>{
   const r=slot.getBoundingClientRect(),buttons=[...slot.querySelectorAll('button')].map(b=>({r:b.getBoundingClientRect().toJSON(),client:b.clientHeight,scroll:b.scrollHeight,overflow:getComputedStyle(b).overflowY}));
   return {slot:r.toJSON(),client:slot.clientHeight,scroll:slot.scrollHeight,overflow:getComputedStyle(slot).overflowY,buttons,paper:document.querySelector('.jk-narrative').getBoundingClientRect().toJSON(),viewport:{width:innerWidth,height:innerHeight}};
  });
  assert.equal(geometry.buttons.length,3);assert.equal(geometry.scroll,geometry.client);assert.equal(geometry.overflow,'visible');
  assert.ok(Math.abs(geometry.slot.x+geometry.slot.width/2-width/2)<1);assert.ok(Math.abs(height-geometry.paper.bottom-24)<1);
  assert.ok(geometry.buttons.every(b=>b.scroll<=b.client+1&&b.r.height>=44&&b.overflow==='visible'));
  assert.ok(Math.max(...geometry.buttons.map(b=>b.r.height))-Math.min(...geometry.buttons.map(b=>b.r.height))<1);
  if(height>=568)assert.ok(geometry.buttons.every(b=>b.r.bottom<=geometry.paper.top-15&&b.r.y>=0),JSON.stringify({width,height,geometry}));
  else assert.ok(geometry.buttons.every(b=>b.r.bottom<=geometry.paper.top-15&&b.r.y>=0),'landscape choices remain above paper');
  const prior=await page.evaluate(key=>localStorage.getItem(key),saveKey);await page.locator('.jk-reading-body').focus();await page.keyboard.press('Space');await page.keyboard.press('Enter');await page.mouse.click(width/2,Math.max(8,geometry.slot.y-16));
  assert.equal(await page.evaluate(key=>localStorage.getItem(key),saveKey),prior,'desktop advance never chooses a decision');
  evidence.profiles.push({width,height,reading,geometry});await shot(page,`${width}x${height}-runtime-decision.png`);
  // Real preference font scaling, rather than changing a CSS fixture.
  if(width===320||width===1440){
   await click(page,'application.settings');const slider=page.locator('[data-jk-setting="fontScale"]');await slider.focus();await page.keyboard.press('End');await idle(page);await page.locator('.jk-modal-close').click();await idle(page);
   const tail=await readPages(page);assert.ok(expected.endsWith(tail.text),'font change retains reading position');
   await page.reload();await idle(page);await click(page,'application.resume');const large=await readPages(page);assert.equal(large.text,expected);await shot(page,`${width}x${height}-runtime-text200.png`);evidence.profiles.at(-1).text200=large;
  }
  await ctx.close();
 }
 evidence.checks.push('Six production viewport profiles: complete original Thai text, no reading/choice scrollbar, equal centred choices, fixed bottom24, visible landscape choices, decision shortcut guards; actual setting 200% pagination does not commit saves');
 {
  const {ctx,page}=await open({width:390,height:844},storm);await click(page,'application.resume');await readPages(page);
  assert.equal(await page.locator('.jk-narrative [data-jk-role="content-notice"]').count(),0);assert.equal(await control(page,'application.advisory').count(),1);
  await shot(page,'390-runtime-storm.png');const before=await page.evaluate(key=>localStorage.getItem(key),saveKey);await click(page,'application.advisory');
  assert.match(await page.locator('dialog[open]').innerText(),/พายุ|พลัดพราก/);await shot(page,'390-runtime-storm-advisory.png');
  await page.locator('[data-jk-preference]').click();await idle(page);await page.locator('.jk-modal-close').click();await idle(page);
  assert.equal(await page.evaluate(key=>localStorage.getItem(key),saveKey),before);await page.reload();await idle(page);await click(page,'application.resume');assert.equal(await control(page,'application.advisory').count(),0);await ctx.close();
 }
 {
  const {ctx,page}=await open({width:1440,height:900},survival);const before=await page.evaluate(key=>localStorage.getItem(key),saveKey);
  await click(page,'application.new-game');assert.equal(await page.locator('dialog[open]').count(),1);assert.equal(await page.locator('.jk-app-shell[inert][data-stage-mode="title"]').count(),1);
  await shot(page,'1440-runtime-title-confirmation.png');await page.locator('.jk-modal-close').click();await idle(page);assert.equal(await page.evaluate(key=>localStorage.getItem(key),saveKey),before);assert.equal(await control(page,'application.new-game').evaluate(el=>el===document.activeElement),true);
  await click(page,'application.new-game');await page.keyboard.press('Escape');await idle(page);assert.equal(await page.evaluate(key=>localStorage.getItem(key),saveKey),before);
  await click(page,'application.resume');await readPages(page);await click(page,'choice.act1.call-family');
  if(await control(page,'application.confirm-choice').count()){await shot(page,'1440-runtime-choice-confirmation.png');await click(page,'application.confirm-choice');}
  await page.locator('[data-jk-role="meter-toast"]:not([hidden])').waitFor();assert.match(await page.locator('[data-jk-role="meter-toast"]').innerText(),/พลังใจ ลดลง 10/);assert.doesNotMatch(await page.locator('.jk-narrative').innerText(),/ลดลง|เพิ่มขึ้น|พลังใจ|พลังชีวิต/);
  await page.waitForFunction(()=>['ready','neutral'].includes(document.querySelector('#stage-bg')?.dataset.mediaState));await shot(page,'1440-runtime-consequence.png');await page.waitForTimeout(2600);assert.equal(await page.locator('[data-jk-role="meter-toast"]').getAttribute('hidden'),'');
  const revision=await page.locator('#app').getAttribute('data-view-revision');await page.locator('.jk-reading-body').focus();await page.keyboard.press('Space');await idle(page);await page.keyboard.press('Enter');await idle(page);await page.mouse.click(100,250);await idle(page);assert.notEqual(await page.locator('#app').getAttribute('data-view-revision'),revision);
  // Native utility buttons must neither advance the beat nor open Settings.
  const saved=JSON.parse(await page.evaluate(key=>localStorage.getItem(key),saveKey));await click(page,'application.enable-sound');assert.equal(await page.locator('dialog[open]').count(),0);assert.equal(await control(page,'application.enable-sound').getAttribute('data-audio-state'),'off');
  const muted=JSON.parse(await page.evaluate(key=>localStorage.getItem(key),saveKey));assert.deepEqual(muted.payload.progress,saved.payload.progress);assert.equal(muted.settings.masterVolume,0);
  await click(page,'application.enable-sound');const on=JSON.parse(await page.evaluate(key=>localStorage.getItem(key),saveKey));assert.equal(on.settings.masterVolume,saved.settings.masterVolume);for(const channel of ['musicVolume','ambienceVolume','effectsVolume'])assert.equal(on.settings[channel],saved.settings[channel]);await shot(page,'1440-runtime-sound-toggle.png');await ctx.close();
 }
 evidence.checks.push('Production storm/advisory preference reload, native replacement backdrop/cross/Escape/save preservation/opener focus, HP/morale-only 2500ms toast, Space/Enter/stage progression, direct repeatable audio mute/unmute with channel preservation');
 assert.deepEqual(evidence.errors,[]);console.log(`PASS production runtime ergonomics; ${evidence.screenshots.length} screenshots`);
}finally{await writeFile(resolve(output,'runtime-ergonomics.json'),JSON.stringify(evidence,null,2)+'\n');await browser.close();}
