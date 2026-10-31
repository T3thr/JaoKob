// Isolated visual blueprint: no src imports, persistence, or game mutations.
import { node, svgNode, icon } from './primitives.mjs';
const fixture=await (await fetch('./fixtures.json')).json();
const params=new URLSearchParams(location.search);
const id=Math.min(13,Math.max(1,Number(params.get('screen'))||1));
const screen=fixture.screens[id-1], ui=fixture.ui, root=document.querySelector('main');
const mobile=screen.mobile, state=screen.state;
root.classList.add(screen.mode,mobile?'mobile':'desktop');root.dataset.screen=id;
if(params.has('guides'))root.classList.add('guides');
let descriptionIndex=0;
const prefix='../../../../../assets/images/';
const sources={
 kob:prefix+'characters/jao-kob/versions/v2/adult-neutral-right.png',
 'kob-left':prefix+'characters/jao-kob/versions/v2/adult-neutral-left.png',
 determined:prefix+'characters/jao-kob/versions/v2/adult-determined-right.png',
 standing:'../plates/kob-standing.png',
 kam:prefix+'characters/p-kam/versions/v2/neutral-guarded-left.png',
 'kam-empty':'../plates/kam-empty-claw.png',
 fiw:prefix+'characters/jao-fiw/versions/v2/neutral-lively-left.png',
 kab:prefix+'characters/jao-kab/versions/v2/neutral-proud-left.png',
 kib:prefix+'characters/jao-kib/versions/v2/neutral-cheerful-left.png',
 teuk:prefix+'characters/jao-teuk/versions/v2/storm-kneeling-mission-left.png',
 villain:prefix+'characters/cockroach-man/versions/v2/shadow-cloak-boast-left.png',
 'villain-button':prefix+'characters/cockroach-man/versions/v2/stolen-button-boast-left.png',
 guard:prefix+'keepsakes/v2/versions/v1/item-kab-bark-guard.png',
 button:prefix+'keepsakes/v2/versions/v2/item-teuk-peuak-button.png',
 ribbon:prefix+'keepsakes/v2/versions/v1/item-fiw-sun-ribbon.png',
 seeds:prefix+'keepsakes/v2/versions/v2/item-kib-glowing-seeds.png',
 'gear-item':prefix+'keepsakes/v2/versions/v1/item-pkam-tin-gear.png',
 whirlpool:prefix+'backgrounds/act-02/versions/v1/bg-act2-whirlpool-grate.png',
 stitch:'../../v2/harness/assets/stitch.png',
 vn:'../plates/vn-rail.png',camp:'../plates/camp-splint.png',dawn:'../plates/dawn-bedroom.png',
 r5:'../plates/r5-bedroom.png',r2:'../plates/r2-sluice.png',r4:'../plates/r4-banyan.png',tap:'../plates/tap-blackout.png'
};
function image(key,parent,cls='',alt=''){const n=node('img',cls,undefined,parent);n.src=sources[key];n.alt=alt;n.dataset.asset=key;return n;}
function control(cls,label,parent,target=44){const b=node('button',cls,undefined,parent);b.type='button';b.setAttribute('aria-label',label);b.dataset.target=target;return b;}
function art(key,parent,cls=''){if(sources[key])return image(key,parent,cls);return icon(key,parent,cls);}
function component(n,name){n.dataset.component=name;return n;}
function hud(){const wrap=component(node('aside','hud-position'),'TopHudCapsule');const h=node('div','top-hud',undefined,wrap);
 [['body','leaf',state.hp],['mind','star',state.mind],['sta','foot',state.sta]].forEach(([key,glyph,count])=>{const group=node('div','meter',undefined,h);group.dataset.meter=key;group.setAttribute('aria-label',ui[key]+' '+count);const title=node('span','meter-title',undefined,group);icon(glyph,title);node('span','',ui[key],title);const p=node('span','pips',undefined,group);p.style.setProperty('--pip','var(--pip-'+key+')');for(let i=0;i<5;i++)node('i','pip'+(i>=count?' spent':''),undefined,p);});
 node('i','hud-divider',undefined,h);const necklace=svgNode('svg',{viewBox:'0 0 39 44',class:'bond-necklace','aria-label':'สายใย'},h);
 ['#B85D3B','#E5B53A','#4A6FA5'].forEach((color,i)=>{const x=6+i*13;const d='M'+x+' 2C'+(x-3)+' 8 '+(x+3)+' 10 '+x+' 16S'+(x-3)+' 24 '+x+' 30S'+(x+3)+' 37 '+x+' 42';svgNode('path',{d,fill:'none',stroke:color,'stroke-width':3.3},necklace);svgNode('path',{d,fill:'none',stroke:'#fcf4e3','stroke-width':.7,'stroke-dasharray':'1 2',opacity:.7},necklace);for(let j=0;j<[state.bk,state.bf,state.bt][i];j++)svgNode('circle',{cx:x,cy:9+j*9,r:3.1,fill:'#27392d',stroke:color,'stroke-width':1.8},necklace);});
 node('i','hud-divider',undefined,h);icon('pouch',control('hud-control pouch',ui.pouch,h));icon('gear',control('hud-control settings',ui.settings,h));
 if(['stitch','tap'].includes(screen.mode)){wrap.classList.add('muted-hud');wrap.querySelector('.pouch').disabled=true;}
}
function background(key){const bg=image(key,root,'stage-art');node('div','atmosphere');return bg;}
function sprite(key,x,width,eyeY,options={}){const anchors={kob:.24,'kob-left':.24,determined:.24,standing:.13,kam:.33,'kam-empty':.32,fiw:.36,kab:.25,kib:.30,villain:.31,'villain-button':.31};const ar=key==='standing'?1.5:1;const s=node('div','actor '+(options.cls||''));s.style.left=x+'%';s.style.width=width+'px';s.style.top=(eyeY-(anchors[key]||.27)*width*ar)+'px';s.dataset.eyeY=eyeY;s.dataset.character=key;s.dataset.component='VnTachieStage';image(key,s);if(options.button)image('button',s,'sewn-button');return s;}
function paper(cls,parent=root){return node('div',cls+' saa-paper',undefined,parent);}
function action(data,parent){const c=component(control('action-card saa-paper'+(data.combo?' combo':'')+(data.finisher?' finisher':'')+(data.selected?' chosen':''),data.fullLabel||data.label,parent,data.target||56),'TactileActionCard');if(data.id)c.dataset.action=data.id;
 if(data.disabled){c.setAttribute('aria-disabled','true');c.classList.add('unavailable');}
 const a=node('span','action-art',undefined,c);if(['kab','kib','fiw','teuk','kam-empty'].includes(data.icon))a.classList.add('portrait-icon');art(data.icon||'star',a);if(data.friend)image(data.friend,a,'friend-face');
 const content=node('span','action-copy',undefined,c);node('span','action-label',data.label,content);
 if(data.subtitle)node('span','action-subtitle',data.subtitle,content);
 const tags=node('span','action-tags',undefined,c);
 const all=[...(data.tags||[]),...(data.counter?[ui.counter]:[]),...(data.repeat?[ui.repeat]:[]),...(data.finisher?[ui.finisher]:[])];
 all.forEach(t=>node('span','tag'+(t===ui.repeat?' repeat-tag':''),t,tags));
 if(data.cost||data.repeatCost)node('span','action-cost',data.cost||data.repeatCost,c);
 const desc=node('span','sr-only',[...all,data.cost,data.repeatCost,data.subtitle].filter(Boolean).join(' · '),c);desc.id='detail-'+(data.id||String(++descriptionIndex));c.setAttribute('aria-describedby',desc.id);
 if(data.shortcut){const key=node('kbd','shortcut',String(data.shortcut),c);key.setAttribute('aria-hidden','true');c.dataset.shortcut=data.shortcut;}
 c.addEventListener('click',()=>{if(c.getAttribute('aria-disabled')==='true')return;parent.querySelectorAll('[aria-pressed]').forEach(b=>b.setAttribute('aria-pressed','false'));c.setAttribute('aria-pressed','true');});return c;}
const shadowMasks={"standing": {"width": 1024, "height": 1536, "bounds": [153, 46, 916, 1496]}, "villain": {"width": 1024, "height": 1024, "bounds": [16, 9, 1019, 1024]}, "villain-button": {"width": 1024, "height": 1024, "bounds": [2, 9, 1024, 1024]}};
function silhouette(kind,height,x,bottom){const el=svgNode('svg',{viewBox:'0 0 120 200',preserveAspectRatio:'none',class:'wall-shadow '+kind,'aria-hidden':'true'},root);el.style.height=height+'px';el.style.width=(height*(kind==='frog'?.56:.70))+'px';el.style.left=x+'%';el.style.top=(bottom-height)+'px';
 el.style.setProperty('--shadow-source','url("'+sources[kind==='frog'?'standing':screen.clash.round==='R2'?'villain-button':'villain']+'")');const sourceKey=kind==='frog'?'standing':screen.clash.round==='R2'?'villain-button':'villain';const m=shadowMasks[sourceKey],box=m.bounds;const w=height*(kind==='frog'?.56:.70),mw=w*m.width/(box[2]-box[0]),mh=height*m.height/(box[3]-box[1]);el.style.maskSize=mw+'px '+mh+'px';el.style.maskPosition=(-box[0]/m.width*mw)+'px '+(-box[1]/m.height*mh)+'px';if(kind==='frog'&&screen.clash.round==='R5')svgNode('circle',{cx:66,cy:113,r:5,fill:'#e7a93b',opacity:.75},el);
 return el;}
function clashStage(){const c=screen.clash;root.classList.add(c.round.toLowerCase());background(c.round==='R4A'?'r4':c.round.toLowerCase());
 if(c.shadow){const wallPx=mobile?230:c.round==='R2'?500:330;const ground=mobile?306:c.round==='R2'?540:330;silhouette('frog',c.shadow.frogHeightM/c.shadow.wallM*wallPx,mobile?26:c.round==='R2'?42:28,ground);silhouette('shade',c.shadow.shadeHeightM/c.shadow.wallM*wallPx,mobile?62:72,ground);root.dataset.cape='false';
 sprite('standing',mobile?26:28,mobile?103:166,mobile?302:335,{button:c.round==='R5'});
 sprite(c.round==='R2'?'villain-button':'villain',mobile?62:72,mobile?121:245,mobile?360:405);}
 else{node('div','warm-radius');sprite('standing',34,92,280);sprite('villain',76,100,335);}
}
function clashTray(){const c=screen.clash;const intent=component(node('div','intent'),'ClashIntentAndGauge');intent.setAttribute('role','status');node('span','',c.intent,intent);if(c.round==='R5'&&c.turn===3)node('small','territory-effect',ui.half,intent);
 if(c.preview){const p=node('div','intent-preview');node('span','',c.preview,p);image('guard',p);node('span','',ui.none,p);}
 const gaugeWrap=component(node('section','gauge-block'),'ClashIntentAndGauge');const gauge=node('div','clash-gauge',undefined,gaugeWrap);gauge.setAttribute('role','img');gauge.setAttribute('aria-label','แสง '+c.light+' จาก 10');icon(c.round==='R5'?'lamp':c.round==='R2'?'slit':'flashlight',gauge,'gauge-lamp');const cells=node('div','gauge-cells',undefined,gauge);for(let i=0;i<10;i++)node('i','gauge-cell'+(i<c.light?' light':'')+(i===6?' threshold':''),undefined,cells);icon('sun',gauge,'gauge-sun');
 if(c.territory.length){const t=node('div','territory-row',undefined,gaugeWrap);c.territory.forEach(k=>image(k==='gear'?'gear-item':k,t));node('span','',ui.territory,t);}
 const drops=node('div','turn-drops',undefined,gaugeWrap);for(let i=1;i<=c.turns;i++){const d=icon('drop',drops);d.classList.add(i<c.turn?'used':i===c.turn?'current':'future');}
 const tray=component(node('section','clash-tray'),'ClashActionTray');tray.setAttribute('role','group');tray.setAttribute('aria-label',ui.actionGroup);
 const groups=['basic','family','friends','pouch'];const titles={basic:ui.basic,family:ui.family,friends:ui.friends,pouch:ui.pouchGroup};const byGroup=Object.fromEntries(groups.map(g=>[g,c.cards.filter(a=>a.group===g)]));
 function groupPanel(g,parent){const p=node('section','action-group '+g,undefined,parent);p.dataset.group=g;const title=node('h2','group-heading',titles[g],p);if(byGroup[g].some(a=>a.counter))node('i','counter-dot',undefined,title);if(byGroup[g].some(a=>a.repeat))node('span','repeat-mark','≈',title);const grid=node('div','action-grid',undefined,p);byGroup[g].forEach((data,i)=>action({...data,shortcut:g==='basic'?i+1:undefined,tags:data.combo?[data.friend==='fiw'?ui.comboFiw:ui.comboKam]:[]},grid));return p;}
 if(!mobile){groups.filter(g=>byGroup[g].length).forEach(g=>groupPanel(g,tray));}
 else{groupPanel('basic',tray);const tabs=node('div','clash-tabs',undefined,tray);tabs.setAttribute('role','tablist');tabs.setAttribute('aria-label',ui.actionGroup);const well=node('div','tab-well',undefined,tray);const panels={};const buttons=[];
  groups.slice(1).forEach(g=>{const b=control('clash-tab',titles[g],tabs);b.setAttribute('role','tab');b.id='tab-'+g;b.setAttribute('aria-controls','panel-'+g);node('span','',titles[g],b);if(byGroup[g].some(a=>a.counter))node('i','counter-dot',undefined,b);if(byGroup[g].some(a=>a.repeat))node('span','repeat-mark','≈',b);if(byGroup[g].some(a=>a.combo))node('i','combo-stitch',undefined,b);if(!byGroup[g].length){b.setAttribute('aria-disabled','true');b.title=ui.emptyPouch;b.setAttribute('aria-description',ui.emptyPouch);}buttons.push(b);const p=groupPanel(g,well);p.id='panel-'+g;p.setAttribute('role','tabpanel');p.setAttribute('aria-labelledby',b.id);panels[g]=p;
   b.addEventListener('click',()=>select(g));b.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();let at=buttons.indexOf(b);at=e.key==='Home'?0:e.key==='End'?2:(at+(e.key==='ArrowRight'?1:2))%3;buttons[at].focus();buttons[at].click();});});
  function select(g){if(!byGroup[g].length)return;root.dataset.activeTab=g;buttons.forEach(b=>{const yes=b.id==='tab-'+g;b.setAttribute('aria-selected',String(yes));b.tabIndex=yes?0:-1;});Object.entries(panels).forEach(([key,p])=>{p.hidden=key!==g;});}
  select(c.tab);
 }
 // Arrow-key navigation stays within the current action grid.
 root.querySelectorAll('.action-grid').forEach(grid=>{const buttons=[...grid.querySelectorAll('button')];buttons.forEach((b,i)=>{b.tabIndex=i===0?0:-1;b.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();const offset={ArrowLeft:-1,ArrowRight:1,ArrowUp:-2,ArrowDown:2}[e.key];const next=(i+offset+buttons.length)%buttons.length;buttons.forEach((x,j)=>x.tabIndex=j===next?0:-1);buttons[next].focus();});});});
}
function choice(){background('whirlpool');sprite('kam',27,190,329);sprite('kob-left',74,178,323);const grate=node('div','grate-edge');const dock=component(node('section','choice-dock'),'ChoiceStack');
 const tags=[ui.comboKam,ui.familyTag,ui.familyTag,ui.stand,ui.grit];fixture.choices.forEach((label,i)=>{const parts=label.split(' · ');const prefix=parts[0];const rest=parts.slice(1).join(' · ');action({id:'choice-'+i,label:prefix+' · '+rest,fullLabel:label,icon:['guard','jump','eye','foot','foot'][i],friend:i===0?'kam':null,combo:i===0,tags:[tags[i]],cost:i===3?'แรง ●●':i===4?'กาย ● แรง ●●':'',shortcut:i+1},dock);});}
function camp(){background('camp');sprite('kob',mobile?30:29,mobile?160:350,mobile?320:340);sprite('kam-empty',mobile?12:13,mobile?105:270,mobile?364:370);sprite('fiw',mobile?55:49,mobile?110:270,mobile?370:370);
 const timer=component(node('aside','camp-clock'),'CampDropTimer');icon('lantern',timer);const ticks=node('span','clock-ticks',undefined,timer);for(let i=0;i<3;i++)node('i',i===0?'used':'',undefined,ticks);node('span','',ui.lantern,timer);
 const dock=node('section','camp-dock');const grid=node('div','camp-grid',undefined,dock);const icons=['guard','bandage','teuk','kam-empty','fiw','moth','bandage','pouch'];const effects=['สายใยเตื๊อก +',ui.campChosen,'สายใยเตื๊อก +','สายใยพี่ก้าม +','สายใยเจ้าฟิ้ว +','แรง ●●','กาย ●','พร้อมผสาน'];
 fixture.camp.forEach((label,i)=>action({id:'camp-'+i,label,icon:icons[i],subtitle:effects[i],selected:i===0,disabled:i<=1,tags:i===0?[ui.campSacrifice,ui.selected]:[]},grid));const go=control('journey-button',ui.journey,dock);go.setAttribute('aria-disabled','true');go.disabled=true;node('span','',ui.journey,go);icon('next',go);}
function strands(kind,fallback,parent){const s=svgNode('svg',{viewBox:'0 0 100 100',class:'strand-art','aria-hidden':'true','data-strand-kind':kind},parent);
 const values=kind==='home'?['#E7A93B','#4A6FA5','#B28B30']:kind==='pond'?['#648D4C','#8C8B52','#B6A046']:['#9DA79E','#B85D3B','#E5B53A','#4A6FA5','#8C8B52','#B28B30'];
 const paths=kind==='dawn'?['M16 5C8 28 38 28 49 63','M46 5C65 23 33 39 49 63','M52 5C71 23 39 39 53 63','M58 5C77 23 45 39 57 63','M82 5C98 28 64 38 55 63','M88 5C104 28 70 38 61 63']:['M18 5C8 30 43 37 49 63','M66 5C91 23 43 29 51 63','M74 5C49 23 81 29 57 63'];
 paths.forEach((d,i)=>{svgNode('path',{d,fill:'none',stroke:'#24382D','stroke-width':6,'stroke-linecap':'round',opacity:.8},s);svgNode('path',{d,fill:'none',stroke:values[i],'stroke-width':3.8,'stroke-linecap':'round'},s);svgNode('path',{d,fill:'none',stroke:'#fcf4e3','stroke-width':.7,'stroke-dasharray':'1 2'},s);});
 svgNode('path',{d:'M49 63C27 48 30 86 52 72C75 56 72 91 50 78M50 78l-7 17m12-16 10 15',fill:'none',stroke:'#8B794E','stroke-width':4},s);
 if(kind==='home'){svgNode('circle',{cx:53,cy:68,r:8,fill:'#d8af50',stroke:'#86631c'},s);svgNode('circle',{cx:51,cy:66,r:1.5,fill:'#77511d'},s);svgNode('circle',{cx:55,cy:70,r:1.5,fill:'#77511d'},s);}
 if(kind==='dawn')svgNode('path',{d:'M43 74C29 63 26 94 51 84C80 72 73 99 53 84',fill:'none',stroke:'#8B794E','stroke-width':2},s);
 if(fallback)svgNode('path',{d:'M3 5C3 54 24 91 62 82S89 60 75 58',fill:'none',stroke:'#657C3D','stroke-width':6,'stroke-dasharray':'3 2','data-fallback-strand':'true'},s);
 return s;}
function endings(){background('dawn');sprite('standing',mobile?48:50,mobile?105:180,mobile?291:315,{button:true,cls:'ending-kob'});
 const friends=node('div','sill-friends');[['kab',24],['kib',20],['kam-empty',18],['fiw',19]].forEach(([key,w])=>{const wrap=node('span','sill-friend',undefined,friends);wrap.style.width=w+'%';image(key,wrap);});
 node('h1','endings-title',ui.endTitle);const grid=node('section','destiny-grid');['home','pond','dawn'].forEach((key,i)=>{const open=screen.ending[key],fb=screen.ending.fallback&&key==='pond';const card=component(control('destiny-card saa-paper'+(!open?' locked':''),fixture.endLabels[i],grid,44),'ThreeStrandDestinyCard');card.dataset.ending=key;card.setAttribute('aria-disabled',String(!open));card.setAttribute('aria-description',ui[['strandsHome','strandsPond','strandsDawn'][i]]+' · '+(open?(fb?ui.fallback:ui.endingReady):(id===13?(key==='home'?fixture.lock.homeFallback:fixture.lock.dawnFallback):fixture.lock.dawn)));strands(key,fb,card);const text=node('span','destiny-copy',undefined,card);node('span','destiny-label',fixture.endLabels[i],text);node('span','strand-caption',ui[['strandsHome','strandsPond','strandsDawn'][i]],text);if(!open||fb){const reason=fb?ui.fallback:id===13?(key==='home'?fixture.lock.homeFallback:fixture.lock.dawnFallback):fixture.lock.dawn;node('span','destiny-reason',reason,text);} });}
function micro(){background(screen.mode);if(screen.mode==='stitch'){const overlay=svgNode('svg',{viewBox:'0 0 390 844',class:'micro-overlay','aria-hidden':'true'},root);svgNode('path',{d:'M146 414Q158 389 185 417',stroke:'#fffaf0','stroke-width':3,fill:'none','stroke-linecap':'round'},overlay);[[224,429],[206,474]].forEach(([x,y],i)=>{const b=component(control('stitch-target',ui.hintStitch,root),'MicroPrompt');b.style.left=x+'px';b.style.top=y+'px';b.addEventListener('click',()=>{b.classList.add('complete');});});}
 else{const b=component(control('tap-target',ui.hintTap,root,120),'MicroPrompt');b.style.left='35%';b.style.top='68%';let taps=1;b.dataset.progress=taps;b.addEventListener('click',()=>{taps=Math.min(3,taps+1);b.dataset.progress=taps;b.classList.add('tapped');});}
 node('p','micro-hint saa-paper',screen.mode==='stitch'?ui.hintStitch:ui.hintTap);
 document.addEventListener('keydown',e=>{if(e.code!=='Space')return;e.preventDefault();root.querySelector('.stitch-target:not(.complete),.tap-target')?.click();});}
if(screen.mode==='vn'){background('vn');const d=component(node('section','dialogue saa-paper'),'SaaDialogueCard');const sp=node('div','speaker-pill',undefined,d);const face=node('span','speaker-avatar',undefined,sp);image('teuk',face);node('span','',fixture.vn.speaker,sp);node('p','dialogue-text',fixture.vn.line,d);icon('next',control('next-button',ui.next,d));}
if(screen.mode==='choice')choice();
if(screen.mode==='clash'){clashStage();clashTray();}
if(screen.mode==='camp')camp();
if(screen.mode==='endings')endings();
if(['stitch','tap'].includes(screen.mode))micro();
hud();node('div','face-guide');
document.addEventListener('keydown',e=>{if(!['1','2','3','4','5'].includes(e.key))return;root.querySelector('[data-shortcut="'+e.key+'"]')?.click();});
await document.fonts.ready;await Promise.all([...document.images].map(i=>i.decode().catch(()=>null)));await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
function rect(n){const r=n.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom};}
const visible=n=>!!n.getClientRects().length&&!n.closest('[hidden]');
window.audit=()=>{const targets=[...root.querySelectorAll('[data-target]')].filter(visible).map(n=>({label:n.getAttribute('aria-label'),minimum:Number(n.dataset.target),...rect(n)}));const textOverlaps=[...root.querySelectorAll('.action-card')].filter(visible).flatMap(c=>{const a=c.querySelector('.action-label'),b=c.querySelector('.action-subtitle');if(!a||!b)return [];const x=rect(a),y=rect(b);return x.y<y.bottom&&x.bottom>y.y&&x.x<y.right&&x.right>y.x?[a.textContent]:[];});const band={top:.32*innerHeight,bottom:.48*innerHeight};const controls=[...root.querySelectorAll('.hud-position,.dialogue,.choice-dock,.intent,.intent-preview,.gauge-block,.clash-tray,.camp-clock,.camp-dock,.endings-title,.destiny-grid,.micro-hint')];const texts=[...root.querySelectorAll('.action-label,.action-subtitle,.action-cost,.destiny-label,.destiny-reason,.dialogue-text')].filter(visible);
 return {screen:id,stem:screen.stem,viewport:{width:innerWidth,height:innerHeight,dpr:devicePixelRatio},fontReady:document.fonts.check('16px Sarabun'),fontFaces:[...document.fonts].map(f=>({family:f.family,status:f.status})),textOverlaps,brokenImages:[...document.images].filter(i=>!i.complete||!i.naturalWidth).map(i=>i.src),horizontalOverflow:document.documentElement.scrollWidth>innerWidth,targets,undersizedTargets:targets.filter(t=>t.width+.1<t.minimum||t.height+.1<t.minimum),textClipping:texts.filter(n=>n.scrollWidth>n.clientWidth+1||n.scrollHeight>n.clientHeight+1).map(n=>n.textContent),contentOverflow:texts.filter(n=>{const c=n.closest('button');if(!c)return false;const a=rect(n),b=rect(c);return a.x<b.x||a.right>b.right+1||a.bottom>b.bottom+1;}).map(n=>n.textContent),faceBand:band,uiBandIntrusions:controls.filter(n=>{const r=rect(n);return r.y<band.bottom&&r.bottom>band.top;}).map(n=>n.className),hud:rect(root.querySelector('.hud-position')),activeTab:root.dataset.activeTab,allActions:screen.clash?.cards.map(c=>c.id)||[],visibleActions:[...root.querySelectorAll('[data-action]')].filter(visible).map(n=>n.dataset.action),counterActions:[...root.querySelectorAll('[data-action]')].filter(n=>n.querySelector('.action-tags')?.textContent.includes(ui.counter)).map(n=>n.dataset.action),repeatActions:[...root.querySelectorAll('[data-action]')].filter(n=>n.querySelector('.repeat-tag')).map(n=>n.dataset.action),state:screen.clash||screen.ending,shadowElements:[...root.querySelectorAll('.wall-shadow')].map(n=>({kind:n.classList.contains('frog')?'frog':'shade',...rect(n)})),strings:[...root.querySelectorAll('.action-label,.action-subtitle,.action-tags,.action-cost,.dialogue-text,.speaker-pill,.intent,.intent-preview,.endings-title,.destiny-label,.destiny-reason,.micro-hint')].filter(visible).map(n=>n.textContent),images:[...document.images].map(n=>({key:n.dataset.asset,path:n.getAttribute('src')})),componentBounds:[...root.querySelectorAll('[data-component]')].filter(visible).map(n=>({name:n.dataset.component,...rect(n)}))};};
document.documentElement.dataset.ready='yes';
