"""Build a static, offline-capable review page from the versioned art catalog."""
from pathlib import Path
from html import escape
import json

ROOT = Path(__file__).resolve().parents[3]
manifest = json.loads((ROOT / 'assets/images/asset-manifest-v2.json').read_text())
jobs = json.loads((ROOT / 'docs/design-system/asset-prompts/visual-assets-v2-jobs.json').read_text())['jobs']
assets = {a['assetId']: a for group in manifest['categories'].values() for a in group}

def url(path):
    return '../../../' + path

def picture(path, alt, extra=''):
    return f'<img src="{escape(url(path))}" alt="{escape(alt)}" loading="lazy" decoding="async" {extra}>'

def card(a):
    added = a['disposition'] == 'added-v2'
    carry = a['disposition'] == 'carry-forward-v1'
    before = a.get('beforePath')
    pair = ''
    if not carry:
        label = 'v1 · ภาพอ้างอิงสำหรับภาพเพิ่ม' if added else 'v1 · ก่อนแก้'
        pair += f'<figure><figcaption>{label}</figcaption><div class="image">{picture(before, a["change"]["from"]) if before else "<p>ภาพเพิ่มสำหรับเส้นทางใหม่</p>"}</div></figure>'
    pair += f'<figure><figcaption>{"v1 · ใช้ต่อ" if carry else "v2 · ตัวเลือกใหม่"}</figcaption><a class="image" href="{escape(url(a["outputPath"]))}">{picture(a["outputPath"], a["altTh"])}</a></figure>'
    changes = a['change']
    notes = f'<dl><dt>จาก</dt><dd>{escape(changes["from"])}</dd><dt>เป็น</dt><dd>{escape(changes["to"])}</dd><dt>เหตุผล</dt><dd>{escape(changes["reason"])}</dd></dl>'
    state = f'<p class="state">เงื่อนไขใช้: {escape(a["availability"])}</p>' if 'availability' in a else ''
    flags = 'ใช้ v1 ต่อ' if carry else ('เพิ่มใหม่' if added else 'ปรับ v1 → v2')
    return f'<article id="{a["assetId"]}" class="card {"carry" if carry else ""}" data-search="{escape(a["assetId"]+" "+a["altTh"]+" "+changes["to"])}"><header><span class="badge">{flags}</span><h3>{escape(a["altTh"])}</h3><code>{a["assetId"]}</code></header><div class="pair">{pair}</div>{notes}{state}<footer>{escape(" · ".join(changes["requirements"]))}<br>{a["dimensions"]} · <a href="{escape(url(a["masterPath"]))}">PNG master</a> · รอ PO ตรวจรับ</footer></article>'

def stage(title, background, indexes, caption):
    people = ''
    for idx, x in zip(indexes, [1, 53]):
        a = assets[jobs[idx]['assetId']]
        h = a['stage']['previewHeightFraction'] * 100
        people += picture(a['outputPath'], a['altTh'], f'class="actor" style="height:{h:.2f}%;left:{x}%" data-eye="{a["stage"]["eyeAnchorFromTop"]}"')
    return f'<figure class="stage-card"><figcaption>{title}</figcaption><div class="stage">{picture(background,"ฉากหลังสำหรับทดลองจัดวาง", "class=backdrop")}{people}<div class="eye-band" aria-hidden="true"></div><div class="dialogue">พื้นที่กล่องข้อความ · 28%</div></div><p>{caption}</p></figure>'

stages = ''.join([
    stage('คู่สนทนากบ–มนุษย์', 'assets/images/backgrounds/act-03/bg-act3-wayside-shelter-teuk.webp', [2, 18], 'เจ้ากบอยู่บนพื้นยกในฉากจริง / เตื๊อกโน้มตัวเข้าหา · ภาพนี้ตรวจกรอบใบหน้า ไม่ใช่การพิสูจน์สเกลโลก'),
    stage('คู่พี่น้อง', 'assets/images/backgrounds/act-01/bg-act1-willow-roots.webp', [6, 28], 'เจ้ากับหันขวาและเจ้ากิบหันซ้าย เป็นคนละภาพที่เจนใหม่ ไม่กลับภาพด้วย CSS'),
    stage('ผู้พิทักษ์กับเปี๊ยก', 'assets/images/backgrounds/act-05/versions/v2/bg-act5-bedside-table-night.webp', [4, 20], 'เวทีตัวอย่างก่อนปาฏิหาริย์ · เจ้ากบมีชีวิตและห้องไม่มีตุ๊กตาอื่น'),
    stage('ตัวร้ายหลังเสียกระดุม', 'assets/images/backgrounds/act-02/bg-act2-shadow-sluice-chamber.webp', [2, 16], 'ทดสอบภาพตัวร้ายแบบไม่มีของทองติดอก · คู่ภาพมีกระดุมจำกัด Act 1–2 ในทะเบียน'),
])

groups = [('characters','ตัวละคร · 40 ภาพ'),('backgrounds','ฉากหลัง · แก้ 1 และเพิ่ม 1'),('cinematicCGs','คัตซีน · แก้ 7 และเพิ่ม 1'),('keepsakes','ของสะสม · แก้ 3 ชิ้น')]
sections = ''
for key, title in groups:
    revised = [a for a in manifest['categories'][key] if a['disposition'] != 'carry-forward-v1']
    sections += f'<section id="{key}"><h2>{title}</h2><div class="cards {"wide" if key in ["backgrounds","cinematicCGs"] else ""}">{"".join(map(card,revised))}</div></section>'
carry = [a for a in assets.values() if a['disposition'] == 'carry-forward-v1']
sections += '<section id="carry"><h2>ใช้ v1 ต่อ · 17 ภาพ</h2><p>พาธและไฟล์เดิม ไม่เจนซ้ำ ไม่มีการอ้างว่าเป็นภาพใหม่</p><div class="cards">'+''.join(map(card,carry))+'</div></section>'

html = '''<!doctype html><html lang="th"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>JaoKob · Visual assets v2 review</title>
<style>
:root{color-scheme:dark;--bg:#111c1b;--panel:#1c2b28;--ink:#edf4e8;--muted:#b4c5ba;--line:#3c5147;--gold:#e9c887;--check:#dce5d8;--check2:#f0f2e9}*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.65 system-ui,sans-serif}a{color:#e8cf98}main{max-width:1420px;margin:auto;padding:clamp(16px,4vw,54px)}h1{font-size:clamp(30px,5vw,58px);line-height:1.2;letter-spacing:-1px;margin:16px 0}h2{font-size:28px;margin:48px 0 20px}h3{margin:9px 0;font-size:18px}p{max-width:85ch}.eyebrow{letter-spacing:.15em;color:var(--gold);font-size:12px}.lead{color:var(--muted);max-width:80ch}.stats{display:flex;gap:12px;flex-wrap:wrap;margin:24px 0}.stats span{border:1px solid var(--line);padding:12px 20px;border-radius:12px}.stats b{font-size:28px;color:var(--gold);margin-right:8px}nav{display:flex;flex-wrap:wrap;gap:16px;border-block:1px solid var(--line);padding:16px 0;margin:26px 0}.tools{display:flex;flex-wrap:wrap;gap:16px;align-items:center;background:#20342b;padding:16px;border-radius:12px}.tools input[type=search]{flex:1;min-width:160px;background:#12231c;color:white;border:1px solid #65806c;padding:12px;border-radius:7px;font:inherit}.tools label{font-size:14px}.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,490px),1fr));gap:24px}.cards.wide{grid-template-columns:1fr}.card{min-width:0;border:1px solid var(--line);border-radius:16px;overflow:hidden;background:var(--panel)}.card header,.card footer,.card dl,.state{padding:16px 20px;margin:0}.card code{overflow-wrap:anywhere;color:var(--muted);font-size:12px}.badge{color:var(--gold);font-size:12px;font-weight:700;letter-spacing:.04em}.pair{display:grid;grid-template-columns:1fr 1fr;gap:2px;background:var(--line)}.carry .pair{grid-template-columns:1fr}.pair figure{margin:0;min-width:0;background:#14241d}.pair figcaption{padding:8px 12px;font-size:13px}.image{display:flex;justify-content:center;align-items:center;aspect-ratio:1;background-color:var(--check);background-image:linear-gradient(45deg,var(--check2) 25%,transparent 25%),linear-gradient(-45deg,var(--check2) 25%,transparent 25%),linear-gradient(45deg,transparent 75%,var(--check2) 75%),linear-gradient(-45deg,transparent 75%,var(--check2) 75%);background-size:24px 24px;background-position:0 0,0 12px,12px -12px,-12px 0}.image img{display:block;width:100%;height:100%;object-fit:contain}.wide .image{aspect-ratio:16/9}.image p{padding:20px;color:#244033}.card dl{display:grid;grid-template-columns:50px 1fr;gap:5px 12px;font-size:14px}.card dt{color:var(--gold)}.card dd{margin:0}.card footer{border-top:1px solid var(--line);font-size:12px;color:var(--muted)}.state{font-size:12px;color:var(--muted);padding-top:0;overflow-wrap:anywhere}.stage-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,560px),1fr));gap:24px}.stage-card{margin:0}.stage-card figcaption{margin-bottom:10px;color:var(--gold)}.stage-card p{font-size:13px;color:var(--muted);margin-top:8px}.stage{position:relative;aspect-ratio:16/9;overflow:hidden;background:#10251d;border-radius:12px;isolation:isolate}.backdrop{position:absolute;width:100%;height:100%;object-fit:cover}.actor{position:absolute;bottom:0;width:auto;max-width:none}.dialogue{position:absolute;inset:auto 0 0;height:28%;background:#101c22df;border-top:2px solid #ddce9c;display:flex;align-items:center;padding:0 5%;font-size:clamp(10px,1.4vw,16px);z-index:2}.eye-band{position:absolute;top:32%;height:16%;inset-inline:0;background:#a0ffb615;border-block:1px dashed #dcf5b8;z-index:3;pointer-events:none}.hide-guides .eye-band{display:none}.hide-dialogue .dialogue{display:none}.dark-sprites{--check:#1b2927;--check2:#233632}.note{border-left:3px solid var(--gold);padding:12px 20px;background:#26372d;color:var(--muted)}button,input{accent-color:#d3bc83}a:focus-visible,input:focus-visible{outline:3px solid #f7d984;outline-offset:3px}[hidden]{display:none!important}.end{padding:40px 0;color:var(--muted);font-size:13px}@media(max-width:600px){main{padding:16px}.stats span{padding:10px}.stats b{font-size:24px}.card header,.card footer,.card dl{padding:13px}.pair figcaption{font-size:11px;padding:7px}.card dl{font-size:13px;grid-template-columns:40px 1fr}.tools{gap:12px}h2{font-size:24px}.stage-grid{gap:20px}}
</style><main>
<div class="eyebrow">JAOKOB / ART REVIEW / 30 OCT 2026</div><h1>ภาพเดิม → เรื่องปัจจุบัน</h1>
<p class="lead">ชุดต้นแบบ v2 ตาม ADR-P0-032 v2.0 และเนื้อเรื่องที่ commit <code>291e077</code> — เปรียบเทียบสิ่งที่เปลี่ยนพร้อมเหตุผลรายภาพ เก็บ v1 ไว้ครบ และยังรอ PO ตรวจรับก่อนใช้ในเกม</p>
<div class="stats"><span><b>53</b>ภาพเจนใหม่</span><span><b>17</b>ภาพ v1 ใช้ต่อ</span><span><b>70</b>รายการใน catalog</span></div>
<p>จุดหลัก: ตัวละครครึ่งตัวและทิศหันคู่ · เปี๊ยก–เตื๊อกวัยผู้ใหญ่ · กำมะหยี่เฉพาะ E-HOME · E-DAWN มีเจ้ากบเดียว · กระดุม/นกหวีด <strong>ต.♡ป.</strong> · เพิ่มเส้นทาง B</p>
<nav aria-label="หมวดภาพ"><a href="#stage">ทดลองบนเวที</a><a href="#characters">ตัวละคร</a><a href="#backgrounds">ฉากหลัง</a><a href="#cinematicCGs">คัตซีน</a><a href="#keepsakes">ของสะสม</a><a href="#carry">ใช้ v1 ต่อ</a></nav>
<div class="tools"><input id="search" type="search" aria-label="ค้นหาภาพ" placeholder="ค้นหาชื่อ / ID / สิ่งที่เปลี่ยน"><label><input id="dark" type="checkbox"> พื้นหลังสไปรต์เข้ม</label><label><input id="guides" type="checkbox" checked> แนวสายตา 52–68%</label><label><input id="dialogue" type="checkbox" checked> กล่องข้อความ 28%</label></div>
<section id="stage"><h2>ลองวางบนเวที</h2><p class="lead">ปรับความสูงรายภาพจากตำแหน่งตาที่ประเมินด้วยสายตาให้มาอยู่ประมาณ 60% จากขอบล่าง ไม่ใช้ความสูงเดียวกันทุกตัว ภาพตัวอย่างนี้ตรวจการจัดวาง ยังไม่ใช่สเปกหรือ runtime UX ของ ADR-033</p><div class="stage-grid">'''+stages+'''</div><p class="note">ความต่างของแสงขอบ สีหน้า ขนาดอุปกรณ์เล็ก และสเกลในคัตซีนยังต้องให้ PO พิจารณา ภาพเงาอัศวินคงผ้าคลุมแฟนตาซีตามมติ; ไม่มีการอ้างว่าทดสอบสมการฟิสิกส์ของเงาแล้ว</p></section>'''+sections+'''
<div class="end"><a href="../../../assets/images/asset-manifest-v2.json">Manifest v2</a> · <a href="../asset-prompts/04-V2-STORY-CONTINUITY-AND-TACHIE.md">ข้อกำหนดและตารางการเปลี่ยน</a> · <a href="../../../assets/provenance/visual-assets-v2.json">พรอมป์ต์ / ภาพอ้างอิง / ประวัติแก้</a> · <a href="visual-assets-v1-review.html">เปิด v1 เดิม</a><p>ไฟล์ใหม่อยู่ใน versions/v2/ เท่านั้น · ไม่มีการเปิดใช้ใน runtime หรือเปลี่ยนข้อมูลเซฟ · WBS implementation ยัง 0/20</p></div>
</main><script>
document.getElementById('search').addEventListener('input',event=>{const value=event.target.value.toLocaleLowerCase('th');document.querySelectorAll('[data-search]').forEach(card=>{card.hidden=!card.dataset.search.toLocaleLowerCase('th').includes(value)})});
document.getElementById('dark').addEventListener('change',event=>document.body.classList.toggle('dark-sprites',event.target.checked));
document.getElementById('guides').addEventListener('change',event=>document.body.classList.toggle('hide-guides',!event.target.checked));
document.getElementById('dialogue').addEventListener('change',event=>document.body.classList.toggle('hide-dialogue',!event.target.checked));
</script></html>'''

target = ROOT / 'docs/design-system/evidence/visual-assets-v2-review.html'
target.write_text(html)
print(f'Built {target.relative_to(ROOT)}: {len(assets)} asset cards')
