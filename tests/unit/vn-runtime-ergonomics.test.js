import test from 'node:test';
import assert from 'node:assert/strict';
import {createGameApplication} from '../../src/bootstrap/index.js';
import {createDomRenderer} from '../../src/ui/renderers/dom/dom-renderer.js';
import {MemoryStorage, FakeDocument, findByAttribute as find, findAllByAttribute as all} from '../helpers/application-harness.js';
import {content, testReferenceIds, AT, SESSION_ID, walk, envelope} from '../helpers/act1-session.js';
function harness(rawStorage=new MemoryStorage()) {
  const document=new FakeDocument(), root=document.createElement('div');
  const app=createGameApplication({root,document,rawStorage,content,testReferenceIds,clock:()=>AT,sessionIdFactory:()=>SESSION_ID});
  const select=(choiceId)=>app.dispatch({type:'SELECT_CHOICE',choiceId});
  return {app,root,document,rawStorage,select};
}
test('ADR-P0-019 P4 rail directly toggles master, restores positive level and preserves every channel',async()=>{
  const h=harness(); await h.app.boot(); await h.select('application.settings');
  for (const [setting,value] of Object.entries({masterVolume:.65,musicVolume:.35,ambienceVolume:0,effectsVolume:.2})) assert.equal((await h.app.dispatch({type:'SETTINGS_CHANGED',setting,value})).ok,true);
  await h.select('application.close-settings');
  const before=h.app.getViewModel().settings;
  await h.select('application.enable-sound');
  assert.equal(h.app.getStatus().mode,'title'); assert.equal(all(h.root,'data-jk-role','settings-dialog').length,0);
  assert.deepEqual(h.app.getViewModel().settings,{...before,masterVolume:0});
  assert.equal(h.document.activeElement.getAttribute('data-choice-id'),'application.enable-sound');
  assert.equal(find(h.root,'data-choice-id','application.enable-sound').getAttribute('aria-pressed'),'false');
  await h.select('application.enable-sound'); assert.deepEqual(h.app.getViewModel().settings,before);
  h.app.dispose();
});
test('ADR-P0-019 P4 master mute persists across reload without changing story cursor',async()=>{
  const h=harness(); await h.app.boot(); await h.select('application.new-game'); const before=h.app.getSnapshot();
  await h.select('application.enable-sound'); const muted=h.app.getSnapshot();
  assert.equal(muted.currentNodeId,before.currentNodeId); assert.deepEqual(muted.progress,before.progress);
  assert.equal(h.app.getViewModel().settings.masterVolume,0); h.app.dispose();
  const next=harness(h.rawStorage); await next.app.boot(); assert.equal(next.app.getViewModel().settings.masterVolume,0);
  await next.select('application.enable-sound'); assert.equal(next.app.getViewModel().settings.masterVolume,1); next.app.dispose();
});
test('ADR-P0-019 P4 stale sound and background setting writes remain rejected',async()=>{
  const h=harness(); await h.app.boot(); const before=h.app.getViewModel().settings;
  assert.equal((await h.app.dispatch({type:'SELECT_CHOICE',choiceId:'application.enable-sound',viewRevision:0})).ok,false);
  assert.equal((await h.app.dispatch({type:'SETTINGS_CHANGED',setting:'masterVolume',value:0})).ok,false);
  assert.deepEqual(h.app.getViewModel().settings,before); h.app.dispose();
});
test('ADR-P0-019 title replacement uses one modal, inert underlay, explicit cancellation and safe focus',async()=>{
  const initial=JSON.stringify(envelope(walk()[0])), h=harness(new MemoryStorage({'jaokob:save:canonical':initial}));
  await h.app.boot(); await h.select('application.new-game');
  assert.equal(all(h.root,'data-jk-role','confirmation-dialog').length,1);
  assert.equal(find(h.root,'data-jk-role','game-shell').getAttribute('inert'),'');
  assert.equal(find(h.root,'data-jk-role','game-shell').getAttribute('data-stage-mode'),'title');
  assert.equal(h.rawStorage.raw('jaokob:save:canonical'),initial);
  find(h.root,'data-jk-role','modal-close').dispatchEvent({type:'click'}); await h.app.whenIdle();
  assert.equal(h.app.getStatus().mode,'title'); assert.equal(h.rawStorage.raw('jaokob:save:canonical'),initial);
  assert.equal(h.document.activeElement.getAttribute('data-choice-id'),'application.new-game'); h.app.dispose();
});
test('ADR-P0-019 P3 storm warning is projected into advisory and never into prose',async()=>{
  const storm=walk().find(s=>s.currentNodeId==='node.act1.storm');
  const h=harness(new MemoryStorage({'jaokob:save:canonical':JSON.stringify(envelope(storm))})); await h.app.boot(); await h.select('application.resume');
  const before=h.app.getSnapshot(), view=h.app.getViewModel(); assert.match(view.contentAdvisory.text,/พายุ|พลัดพราก/);
  assert.equal(all(find(h.root,'data-jk-role','reading-card'),'data-jk-role','content-notice').length,0);
  await h.select('application.advisory'); assert.match(find(h.root,'data-jk-role','advisory-dialog').textContent,/พายุ|พลัดพราก/);
  assert.equal(h.app.getSnapshot(),before); h.app.dispose();
});
test('ADR-P0-019 P2 consequence toast expires at2500ms, never replays on settings refresh or leaks Bond',()=>{
  const document=new FakeDocument(), root=document.createElement('div'), timers=[];
  const renderer=createDomRenderer({root,document,scheduleStatus:(callback,delay)=>{timers.push({callback,delay});return timers.length;},cancelStatus:()=>{}});
  const view={feedbackEventId:'action:4',revision:4,scene:{dialogue:'น้ำไหว'},feedback:'ได้ที่พัก',meterChanges:[{meter:'hp',delta:-5},{meter:'bond',delta:19}],choices:[]};
  renderer.render(view); const toast=find(root,'data-jk-role','meter-toast');
  assert.match(toast.textContent,/พลังชีวิต ลดลง 5/); assert.doesNotMatch(toast.textContent,/19|ความผูกพัน/);
  assert.doesNotMatch(find(root,'data-jk-role','reading-card').textContent,/พลังชีวิต|ลดลง|19/);
  assert.equal(timers[0].delay,2500); timers[0].callback(); assert.equal(toast.getAttribute('hidden'),'');
  renderer.render({...view,revision:5,viewRevision:10,settings:{fontScale:1.5}});
  assert.equal(timers.length,1); assert.equal(find(root,'data-jk-role','meter-toast').getAttribute('hidden'),''); renderer.dispose();
});
test('ADR-P0-019 P5 stage, Space and Enter advance only reading and honor busy/repeat/modal guards',()=>{
  const document=new FakeDocument(), root=document.createElement('div'), intents=[];
  const renderer=createDomRenderer({root,document,onIntent:i=>intents.push(i)});
  const view={revision:4,presentation:{mode:'reading'},scene:{dialogue:'น้ำไหว'},choices:[{id:'application.advance',label:'อ่านต่อ'}]}; renderer.render(view);
  root.dispatchEvent({type:'keydown',key:' ',preventDefault(){}}); root.dispatchEvent({type:'keydown',key:'Enter',preventDefault(){}}); root.dispatchEvent({type:'click',button:0,detail:1});
  assert.equal(intents.length,3); assert.ok(intents.every(i=>i.choiceId==='application.advance'));
  for (const event of [{type:'keydown',key:' ',repeat:true},{type:'keydown',key:'Enter',ctrlKey:true},{type:'keydown',key:'Enter',isComposing:true},{type:'click',button:2}]) root.dispatchEvent(event);
  renderer.setBusy(true); root.dispatchEvent({type:'click'}); renderer.setBusy(false);
  renderer.render({...view,presentation:{mode:'decision'},choices:[{id:'pick',label:'เลือก'}]}); root.dispatchEvent({type:'keydown',key:'Enter'}); root.dispatchEvent({type:'click'});
  renderer.render({...view,presentation:{mode:'settings'}}); root.dispatchEvent({type:'keydown',key:' '}); root.dispatchEvent({type:'click'});
  assert.equal(intents.length,3); renderer.dispose();
});


test('ADR-P0-019 P2 announces each consequence once across overlays/settings and still announces a new save failure',()=>{
  const document=new FakeDocument(),root=document.createElement('div');const renderer=createDomRenderer({root,document});
  const changes=[{meter:'hp',delta:-5}],base={feedbackEventId:'action:4',revision:4,presentation:{mode:'reading'},scene:{dialogue:'ฝนเบาลง'},feedback:'ได้ที่พัก',meterChanges:changes,notice:{kind:'saved',text:'บันทึกแล้ว'},choices:[]};
  renderer.render(base);renderer.announce({text:'ได้ที่พัก บันทึกแล้ว',meterChanges:changes});
  const live=find(root,'data-jk-role','live-region');assert.match(live.textContent,/พลังชีวิต ลดลง 5/);live.textContent='sentinel';
  renderer.render({...base,revision:5,presentation:{mode:'settings'},feedback:undefined});renderer.announce({text:'บันทึกแล้ว',meterChanges:changes});assert.equal(live.textContent,'sentinel');
  const failed={...base,revision:5,notice:{kind:'attention',text:'ยังบันทึกไม่ได้'}};renderer.render(failed);renderer.announce({text:'ได้ที่พัก ยังบันทึกไม่ได้',meterChanges:changes});assert.equal(live.textContent,'ยังบันทึกไม่ได้');
  live.textContent='sentinel';renderer.render({...failed,revision:6});renderer.announce({text:'ได้ที่พัก ยังบันทึกไม่ได้',meterChanges:changes});assert.equal(live.textContent,'sentinel');renderer.dispose();
});
