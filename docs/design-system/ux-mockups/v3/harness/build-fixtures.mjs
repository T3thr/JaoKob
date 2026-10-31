// Review-only view models. Authoritative engine and narrative remain read-only.
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { ACTIONS, ROUNDS, INTENTS, enterClash, step, listActions } from '../../../evidence/tactical-clash-engine.mjs';
import { endings } from '../../../evidence/five-act-balance-model.mjs';
const dir = new URL('../', import.meta.url);
const ds = new URL('../../../', import.meta.url);
const reads = {};
function read(name) { const data=readFileSync(new URL(name,ds),'utf8'); reads[name]=data; return data; }
const ux=read('interactive-gameplay-ux-ui-specification.md');
const a2=read('act2-living-keepsake-rewrite-blueprint.md');
const a3=read('act3-living-keepsake-rewrite-blueprint.md');
const a4=read('act4-living-keepsake-rewrite-blueprint.md');
const a5=read('act5-living-keepsake-rewrite-blueprint.md');
read('physics-scale-and-visual-v2-specification.md');
const receipts=[];
function exact(text,source) { if(!reads[source].includes(text)) throw Error('Missing canonical copy: '+text); receipts.push({text,source}); return text; }
const u=t=>exact(t,'interactive-gameplay-ux-ui-specification.md');
const sceneNames=[...ux.matchAll(/\| (\d+) \| `([^`]+)`/g)].map(m=>m[2]);
if(sceneNames.length!==13)throw Error('Expected thirteen screen IDs');
const base={hp:5,mind:4,sta:4,fsu:3,streak:0,major:null,ready:[],tempo:0};
const r5=enterClash({...base,bk:3,bf:3,bt:3,items:['button','seeds','guard','gear'],flags:['teuk_intel']},'R5');
const states={3:r5,4:step(step(r5,'a_pkam'),'rain'),11:enterClash({...base,bk:3,bf:3,bt:3,items:['button','ribbon','seeds','gear'],flags:['teuk_splint'],tempo:1},'R4A'),12:step(enterClash({...base,fsu:0,bk:2,bf:1,bt:0,items:['seeds','guard','gear'],flags:[]},'R2'),'rain')};
const basicNames={R5:['ก้าวชิดโคม','ยืนนิ่งกลางลำแสง','สูดลมหลังฐานโคม'],R4A:['ไต่ขึ้นตามกิ่งไทร','เกาะแน่นกับเชือก','พักบนง่ามไม้'],R2:['บุกขึ้นกองกระป๋อง','หลบหลังเฟืองยักษ์','พิงท่อเหล็กหอบหายใจ']};
const aliases={seeds:'เมล็ดต้อยติ่ง',guardItem:'สนับข้อมือ',gear:'เฟืองสังกะสี',button:'กระดุมทองเหลือง',ribbon:'ริบบิ้นกลิ่นแดด'};
const art={strike:'advance',guard:'shield',rest:'wind',rain:'drop',wind:'jump',eye:'eye',s_kab:'kab',s_kib:'kib',a_pkam:'kam-empty',a_fiw:'fiw',a_teuk:'teuk',hem:'hem',seeds:'seeds',gear:'gear-item',guardItem:'guard',button:'button',ribbon:'ribbon',gear_pkam:'gear-item',seeds_fiw:'seeds',ribbon_fiw:'ribbon'};
const group=a=>a.kind==='base'||a.kind==='finisher'?'basic':a.kind==='family'||a.kind==='sibling'?'family':a.kind==='assist'?'friends':'pouch';
function clash(cs){
 const round=ROUNDS[cs.round], intent=round.intents[cs.t-1];
 const cards=listActions(cs).map(id=>{const a=ACTIONS[id],g=group(a);const answer=[...(a.cancels||[]),...(a.negates||[]),...(a.halves||[])].includes(intent)||(intent==='illusion'&&!!a.reveals);const repeat=g==='family'&&cs.streak>=1;
 const label=['strike','guard','rest'].includes(id)?basicNames[cs.round][['strike','guard','rest'].indexOf(id)]:aliases[id]||a.th;
 const source=cs.round==='R5'?'act5-living-keepsake-rewrite-blueprint.md':cs.round==='R4A'?'act4-living-keepsake-rewrite-blueprint.md':'act2-living-keepsake-rewrite-blueprint.md';
 // UI spec explicitly supplies scene labels and shared card labels; verify each.
 if(reads[source].includes(label)) exact(label,source);else u(label);
 return {id,label,group:g,icon:art[id],friend:a.kind==='combo'?({pkam:'kam-empty',fiw:'fiw',teuk:'teuk'}[a.ally]):null,counter:answer,repeat,combo:a.kind==='combo',finisher:a.kind==='finisher',cost:a.cost?.sta?'แรง '+'●'.repeat(a.cost.sta):'',repeatCost:repeat?'ใจ ● แรง ●':'',gain:a.gain};});
 const shadow=cs.round==='R5'?{wallM:2.8,lightToWallM:2.4,frogDistanceM:.95-.07*cs.P,shadeDistanceM:.20+.04*cs.P,frogHeightM:.45*2.4/(.95-.07*cs.P),shadeHeightM:.30*2.4/(.20+.04*cs.P),sourceWidthM:.006,crisp:true,cape:false}:cs.round==='R2'?{wallM:2.4,lightToWallM:2.7,frogDistanceM:1.4-.1*cs.P,shadeDistanceM:.30+.04*cs.P,frogHeightM:.45*2.7/(1.4-.1*cs.P),shadeHeightM:.25*2.7/(.30+.04*cs.P),crisp:true,cape:false}:null;
 return {state:cs,round:cs.round,beat:'choose',turn:cs.t,turns:round.turns,light:cs.P,intent:u('แมลงสาบแมนเตรียมใช้ · '+INTENTS[intent].th),intentId:intent,cards,shadow,tab:cs.round==='R4A'?'pouch':'family',preview:cs.round==='R5'&&cs.t===3?u('สูดความมืด'):null,territory:cs.round==='R5'?['gear','seeds','guard']:[]};
}
const choices=a2.split('### A2A-05')[1].split('### A2A-06')[0];
const choiceLabels=[...choices.matchAll(/\d\. \*\*([^*]+)\*\*/g)].map(m=>exact(m[1],'act2-living-keepsake-rewrite-blueprint.md'));
if(choiceLabels.length!==5)throw Error('Five choices required');
const campLabels=[...a3.split('### A3-12')[1].split('### A3-13')[0].matchAll(/- \*\*([^*]+)\*\*/g)].map(m=>exact(m[1],'act3-living-keepsake-rewrite-blueprint.md'));
if(campLabels.length!==8)throw Error('Eight camp actions required');
const endLabels=[...a5.split('### A5-11')[1].matchAll(/\d\. \*\*[กขค] · ([^*]+)\*\*/g)].slice(0,3).map(m=>exact(m[1],'act5-living-keepsake-rewrite-blueprint.md'));
const normalEnding={hp:3,mind:3,sta:3,bk:3,bf:2,bt:2,fsu:3,sr:3,items:['button','ribbon','seeds','gear']};
const fallbackEnding={hp:1,mind:1,sta:1,bk:0,bf:0,bt:0,fsu:0,sr:0,items:['button']};
const modes={1:'vn',2:'choice',3:'clash',4:'clash',5:'camp',6:'camp',7:'stitch',8:'tap',9:'endings',10:'endings',11:'clash',12:'clash',13:'endings'};
const screens=sceneNames.map((stem,i)=>{const id=i+1,mode=modes[id],mobile=stem.endsWith('mobile');const state=states[id]||([9,10].includes(id)?normalEnding:id===13?fallbackEnding:{hp:4,mind:3,sta:4,bk:id===2?1:2,bf:2,bt:2,items:id===2?['seeds','guard']:['button','seeds','gear']});return {id,stem,mode,mobile,state,clash:states[id]?clash(states[id]):null,ending:mode==='endings'?endings(state):null};});
const ui={body:u('กาย'),mind:u('ใจ'),sta:u('แรง'),pouch:'กระเป๋าสานกกสี่ช่อง',settings:'ตั้งค่า',next:'อ่านต่อ',counter:u('แก้ทาง'),repeat:u('ซ้ำ'),selected:u('เลือกแล้ว'),journey:u('ออกเดินทางต่อ'),family:u('ครอบครัว'),friends:u('สหาย'),pouchGroup:u('ของ·ผสาน'),basic:'ท่าหลัก',familyTag:u('ทักษะครอบครัว'),stand:u('ยืนหยัดเอง'),grit:u('ฝืนเอา'),finisher:u('ท่าปิดศึก'),comboKam:u('ท่าผสาน · พี่ก้าม'),comboFiw:u('ท่าผสาน · เจ้าฟิ้ว'),lantern:u('ตะเกียงเหลือสองรอบ'),campSacrifice:u('สละสนับข้อมือ'),campChosen:u('ดามแล้ว'),hintStitch:u('ลากตามจุดเพื่อเย็บกระดุม'),hintTap:u('เคาะราวไม้สามครั้ง'),endTitle:u('ทางเลือกในแสงแรก'),fallback:u('พี่กับจะแบกกลับเอง'),none:u('ไม่มีผล'),half:u('เมล็ด: เหลือครึ่ง'),territory:u('เฟือง · เมล็ด · สนับ'),emptyPouch:u('ของทุกชิ้นวางเป็นอาณาเขตแล้ว'),actionGroup:'การกระทำในเทิร์นนี้',stitchDone:'ฝีเข็มที่เย็บแล้ว',prototype:'ภาพต้นแบบสำหรับตรวจหน้าจอ',endingReady:'เลือกได้',strandsHome:u('หัวใจ · คำสัญญา'),strandsPond:u('ขาที่พากลับ · รากเหง้า'),strandsDawn:u('ใจและขา · ทุกสายใย · สองโลก')};
const data={screens,ui,vn:{speaker:u('เตื๊อก'),line:exact('เอ็งเข้าใจที่ข้าพูดใช่ไหม ถ้าใช่ เคาะราวไม้สามที','act3-living-keepsake-rewrite-blueprint.md')},choices:choiceLabels,camp:campLabels,endLabels,lock:{dawn:exact('เขายังไม่เคยยืนด้วยลำแข้งของตัวเองมากพอ','act5-living-keepsake-rewrite-blueprint.md'),homeFallback:exact('ใจของเขายังสั่นเกินกว่าจะมอบให้ใคร','act5-living-keepsake-rewrite-blueprint.md'),dawnFallback:exact('เสียงของบ้านในตัวเขายังเบาเกินไป','act5-living-keepsake-rewrite-blueprint.md')}};
writeFileSync(new URL('harness/fixtures.json',dir),JSON.stringify(data,null,2)+'\n');
writeFileSync(new URL('evidence/thai-copy-audit.json',dir),JSON.stringify({method:'Exact strings extracted from authoritative narrative or UX spec; never use the renderer as the expected copy.',sourceHashes:Object.fromEntries(Object.entries(reads).map(([k,v])=>[k,createHash('sha256').update(v).digest('hex')])),receipts,passed:true},null,2)+'\n');
writeFileSync(new URL('evidence/screen-states.json',dir),JSON.stringify(screens,null,2)+'\n');
console.log('Built 13 screens, '+receipts.length+' canonical copy receipts; engine states and ending resolver evaluated.');
