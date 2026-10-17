import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { migrateSave1To2 } from "../../src/data/persistence/save-1-to-2.js";
import { createContentVersionMigration } from "../../src/data/migrations/content-2-0-0-to-2-1-0.js";
import { validateSaveEnvelope } from "../../src/data/validation/save-envelope-validator.js";
import { KEYS, current, legacy, json, closeoutHarness, choose, writes } from "../helpers/closeout-session.js";
import { MemoryStorage } from "../helpers/application-harness.js";
import { ROUTES, walk, envelope, testReferenceIds } from "../helpers/act1-session.js";
import { travel, FULL_PLAN, save2, story, cmd } from "../helpers/narrative-session.js";

const asSave2 = snapshot => migrateSave1To2(envelope(snapshot)).value.envelope;
const raw = value => JSON.stringify(value);
const stateOf = envelope => ({ ...envelope.payload, revision: envelope.revision });

test("TC-S4-E2E-001 production default starts3.0 with all presentation metadata and no eager legacy fetch", async () => {
  const h=closeoutHarness(); assert.equal((await h.app.boot()).ok,true);
  assert.equal(h.app.getStatus().activeContentVersion,"3.0.0");
  assert.equal(h.app.getStatus().presentationStatus,"ready");
  assert.equal(h.requests.some(r=>r.url.includes("compatibility/")),false);
  await choose(h.app,"application.new-game");
  const saved=JSON.parse(h.memory.raw(KEYS.canonical));
  assert.equal(saved.saveFormatVersion,2);assert.equal(saved.contentVersion,"3.0.0");
  assert.deepEqual(saved.payload.pouch.held,[]);assert.equal(saved.payload.progress.completedNodeIds.length,0);
  assert.equal(validateSaveEnvelope(saved).valid,true);h.app.dispose();
});

for(const route of ROUTES) test(`TC-S4-SAVE-001 default production preserves every archived2.1 cursor/checkpoint ${Object.values(route).join("/")}`,async()=>{
  for(const snapshot of walk(route,["lily","roots","shadows","mother"])) {
    const source=asSave2(snapshot), bytes=raw(source),h=closeoutHarness({[KEYS.canonical]:bytes});
    assert.equal((await h.app.boot()).ok,true);await choose(h.app,"application.resume");
    assert.equal(h.app.getStatus().activeContentVersion,"2.1.0");assert.equal(h.app.getStatus().newGameContentVersion,"3.0.0");
    assert.equal(h.app.getStatus().presentationStatus,"ready");
    assert.deepEqual(h.app.getSnapshot(),stateOf(source));assert.equal(h.memory.raw(KEYS.canonical),bytes);assert.equal(writes(h.memory).length,0);
    assert.deepEqual(h.app.getSnapshot().checkpoint,source.payload.checkpoint);
    if(h.app.getViewModel().choices.some(c=>c.id==="application.advance")) {
      await choose(h.app,"application.advance");const saved=JSON.parse(h.memory.raw(KEYS.canonical));
      assert.equal(saved.contentVersion,"2.1.0");assert.equal(saved.saveFormatVersion,2);assert.equal(saved.revision,source.revision+1);
      assert.equal(h.memory.raw(KEYS.backup),bytes);assert.equal(validateSaveEnvelope(saved).valid,true);
    }
    h.app.dispose();
  }
});

for(const sourceVersion of ["2.1.0","2.0.0"]) test(`TC-S4-SAVE-001 default chain admits Save1/${sourceVersion} only into exact2.1 continuation`,async()=>{
  const sourcePackage=json("src/data/content/compatibility/act-01-2.0.0.json");
  const migration=createContentVersionMigration({sourcePackage,targetPackage:legacy,testReferenceIds});assert.equal(migration.ok,true);
  for(const snapshot of walk()) {
    const save={...envelope(snapshot),contentVersion:sourceVersion},bytes=raw(save),h=closeoutHarness({[KEYS.canonical]:bytes});
    assert.equal((await h.app.boot()).ok,true);await choose(h.app,"application.resume");
    const prior=sourceVersion==="2.0.0"?migration.value.migrate(save).value.envelope:save;
    const expected=migrateSave1To2(prior).value.envelope;
    assert.deepEqual(h.app.getSnapshot(),stateOf(expected));assert.equal(h.app.getStatus().activeContentVersion,"2.1.0");
    assert.equal(h.memory.raw(KEYS.canonical),bytes);assert.equal(writes(h.memory).length,0);h.app.dispose();
  }
});

test("TC-S4-SAVE-001 production3.0 exact Save2 secret/callback/checkpoint cursors resume without reads replaying effects",async()=>{
  for(const snapshot of travel({...FULL_PLAN,fifth:"exchange-leaf"}).snapshots) {
    const source=save2(snapshot),bytes=raw(source),h=closeoutHarness({[KEYS.canonical]:bytes});
    assert.equal((await h.app.boot()).ok,true);await choose(h.app,"application.resume");
    assert.deepEqual(h.app.getSnapshot(),snapshot);assert.equal(h.app.getStatus().activeContentVersion,"3.0.0");
    assert.equal(h.memory.raw(KEYS.canonical),bytes);assert.equal(writes(h.memory).length,0);h.app.dispose();
  }
});

test("TC-S4-SAVE-001 every published2.1 archive byte remains intact",()=>{
  const bytes=readFileSync(new URL("../../src/data/content/compatibility/act-01-2.1.0.json",import.meta.url));
  assert.equal(createHash("sha256").update(bytes).digest("hex"),"498dbdcee737a5256e32dc8391d276a83744c4e91fe910c7cdf26a84eb1fb64f");
});

test("TC-S4-SAVE-002 legacy completion returns to current title, cancel preserves save, confirmed New Game starts3.0 empty",async()=>{
  const source=asSave2(walk().at(-1)),bytes=raw(source),h=closeoutHarness({[KEYS.canonical]:bytes});
  await h.app.boot();await choose(h.app,"application.resume");await choose(h.app,"application.finish");
  assert.equal(h.app.getStatus().activeContentVersion,"3.0.0");await choose(h.app,"application.new-game");
  await choose(h.app,"application.cancel-replace");assert.equal(h.memory.raw(KEYS.canonical),bytes);assert.equal(writes(h.memory).length,0);
  await choose(h.app,"application.new-game");await choose(h.app,"application.confirm-replace");
  const saved=JSON.parse(h.memory.raw(KEYS.canonical));assert.equal(saved.contentVersion,"3.0.0");assert.ok(saved.revision>source.revision);
  assert.equal(h.app.getStatus().persistenceDegraded,false);assert.deepEqual(saved.payload.pouch.held,[]);
  assert.equal(h.app.getSessionHistory().contentVersion,"3.0.0");assert.equal(h.app.getSessionHistory().actions.length,0);h.app.dispose();
});

for(const slot of ["canonical","staging","backup"]) test(`TC-S4-SAVE-002 mixed generation ${slot} never allows a legacy writer to overwrite3.0`,async()=>{
  const older={...asSave2(walk()[2]),revision:800};
  const newer=save2(travel({}, {stop:s=>s.currentNodeId==="node.act1.nursery"}).snapshot);
  const records={[KEYS.canonical]:raw(older),[KEYS[slot]]:raw(newer)};
  if(slot==="canonical")records[KEYS.backup]=raw(older);
  const h=closeoutHarness(records),before=[...h.memory.entries];await h.app.boot();await choose(h.app,"application.resume");
  assert.equal(h.app.getStatus().activeContentVersion,"2.1.0");assert.equal(h.app.getStatus().persistenceDegraded,true);
  await choose(h.app,"application.advance");assert.deepEqual([...h.memory.entries],before);assert.equal(writes(h.memory).length,0);h.app.dispose();
});

test("TC-S4-SAVE-002 another tab's3.0 record appearing during a2.1 stage remains protected by the real default adapter",async()=>{
  const old=asSave2(walk()[2]),later=raw(save2(travel().snapshot));
  class RaceStorage extends MemoryStorage {
    setItem(key,value){if(this.armed&&key===KEYS.staging){this.armed=false;this.entries.set(KEYS.canonical,later);}super.setItem(key,value);}
  }
  const memory=new RaceStorage({[KEYS.canonical]:raw(old)}),h=closeoutHarness(memory);await h.app.boot();await choose(h.app,"application.resume");
  memory.armed=true;await choose(h.app,"application.advance");
  assert.equal(memory.raw(KEYS.canonical),later);assert.equal(h.app.getStatus().persistenceDegraded,true);assert.equal(h.app.getStatus().fatal,false);h.app.dispose();
});

for(const bad of ["{broken",raw({...asSave2(walk()[1]),contentVersion:"99.0.0"}),raw({...asSave2(walk()[1]),saveFormatVersion:99})])
  test(`TC-S4-SAVE-002 current title protects unsupported raw record ${bad.slice(0,20)}`,async()=>{
    const h=closeoutHarness({[KEYS.canonical]:bad});await h.app.boot();assert.equal(h.app.getStatus().hasResumeCandidate,false);
    assert.equal(h.memory.raw(KEYS.canonical),bad);await choose(h.app,"application.new-game");await choose(h.app,"application.cancel-replace");
    assert.equal(h.memory.raw(KEYS.canonical),bad);assert.equal(writes(h.memory).length,0);h.app.dispose();
  });

test("TC-S4-SAVE-002 stale New Game consent cannot erase a newly arrived record",async()=>{
  const old=raw(asSave2(walk()[1])),latest=raw(save2(travel().snapshot)),h=closeoutHarness({[KEYS.canonical]:old});
  await h.app.boot();await choose(h.app,"application.new-game");h.memory.entries.set(KEYS.backup,latest);
  const result=await h.app.dispatch({type:"SELECT_CHOICE",choiceId:"application.confirm-replace"});
  assert.equal(result.ok,false);assert.equal(h.memory.raw(KEYS.canonical),old);assert.equal(h.memory.raw(KEYS.backup),latest);
  assert.equal(writes(h.memory).length,0);h.app.dispose();
});

test("TC-S4-STATE-001 integrated Pouch/History/confirmation cancel are view-only; one replacement commits once",async()=>{
  const snapshot=travel(FULL_PLAN,{stop:s=>s.currentNodeId==="node.act1.river-offer"}).snapshot,bytes=raw(save2(snapshot));
  const h=closeoutHarness({[KEYS.canonical]:bytes});await h.app.boot();await choose(h.app,"application.resume");
  for(const [open,close] of [["pouch","close-pouch"],["history","close-history"]]){await choose(h.app,`application.${open}`);await choose(h.app,`application.${close}`);}
  await choose(h.app,"choice.act1.exchange-leaf");await choose(h.app,"application.cancel-choice");
  assert.deepEqual(h.app.getSnapshot(),snapshot);assert.equal(writes(h.memory).length,0);
  await choose(h.app,"choice.act1.exchange-leaf");const commit=h.app.dispatch({type:"SELECT_CHOICE",choiceId:"application.confirm-choice"});
  assert.equal((await h.app.dispatch({type:"SELECT_CHOICE",choiceId:"application.confirm-choice"})).ok,false);assert.equal((await commit).ok,true);
  assert.equal(h.app.getSnapshot().revision,snapshot.revision+1);assert.equal(h.app.getSnapshot().pouch.held.length,4);
  assert.equal(h.memory.raw(KEYS.backup),bytes);assert.equal(h.app.getSessionHistory().actions.length,1);h.app.dispose();
});

test("TC-S4-RETRY-001 checkpoint recovery round-trips through production Resume with independent latest settings",async()=>{
  const snapshot=travel({...FULL_PLAN,fifth:"exchange-leaf"}).snapshot,h=closeoutHarness({[KEYS.canonical]:raw(save2(snapshot))});
  await h.app.boot();await choose(h.app,"application.resume");await choose(h.app,"application.settings");
  assert.equal((await h.app.dispatch({type:"SETTINGS_CHANGED",setting:"fontScale",value:2})).ok,true);
  await choose(h.app,"application.close-settings");const before=h.app.getSnapshot(),settings=h.app.getViewModel().settings;
  const opportunity=story.pouchOpportunity(before);
  const released=story.pouchAction(before,{...cmd(before),opportunityId:opportunity.id,action:"release",itemId:"item_river_shell"});assert.equal(released.ok,true);
  // Fault fixture exercises the existing Core crisis recovery. Act1 does not
  // invent a new GameOver/Retry UI or an artificial harmful choice.
  const changed=released.value.snapshot,retry=story.retry({...changed,state:"GameOver"},cmd(changed));assert.equal(retry.ok,true);
  const restored=retry.value.snapshot;
  assert.deepEqual(restored.pouch,before.checkpoint.pouch);
  assert.deepEqual(restored.progress.completedNodeIds,before.progress.completedNodeIds);
  const memory=h.memory;h.app.dispose();memory.entries.set(KEYS.canonical,raw({...save2(restored),settings}));memory.calls.length=0;
  const resumed=closeoutHarness(memory);await resumed.app.boot();await choose(resumed.app,"application.resume");
  assert.deepEqual(resumed.app.getSnapshot(),restored);assert.deepEqual(resumed.app.getViewModel().settings,settings);
  assert.equal(settings.fontScale,2);assert.equal(writes(memory).length,0);resumed.app.dispose();
});
