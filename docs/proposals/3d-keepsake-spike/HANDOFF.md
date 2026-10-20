# Hand-off: JaoKob 3D Keepsakes และแนวคิดตัวละครสำหรับ Visual Novel

**ส่งต่อให้:** GPT-6 Astra session ใหม่ หรือ Agent ที่รับช่วงงาน 3D
**วันที่:** 2026-10-20, Asia/Bangkok
**Asset baseline:** `develop@7476722` หลัง [PR #19](https://github.com/T3thr/JaoKob/pull/19) merge
**สถานะเอกสาร:** บันทึกข้อเท็จจริงและคำปรึกษา; ไม่สร้าง requirement/Canon/approval ใหม่

คู่มือประกอบ: [STRUCTURE](STRUCTURE.md) · [วิธีรันและ metrics](README.md) · [progress ตามเวลา](progress.md)

## 1. อ่านส่วนนี้ก่อนเริ่ม session ใหม่

- สิ่งที่ส่งมอบคือ **Keepsake แบบนั่งสองวัย** มีมือเปล่า/กอดหัวใจ และ Velour/Crochet เลือกแยกกันได้
- ทั้งสองวัยเริ่มมือเปล่า/Velour; child filename ที่มีคำ crochet เป็น compatibility path
- เว็บ 3D ยังเป็น Spike แยก ไม่ได้ integrate เข้าบทหรือ END-HOME ใน production
- ทั้งสอง GLB มี **0 skins, 0 morph-target primitives**, มีเพียง STEP clip `HeartEmote` สำหรับสลับชิ้นส่วน ไม่มี standing rig, breathing, facial acting หรือ lip sync
- PO เพิ่งหารือเรื่องตัวละครยืนและแสดงอารมณ์ Astra แนะนำให้ทดลองหนึ่งฉาก แต่ **ยังไม่ได้อนุมัติเริ่ม implementation ของแนวคิดนั้น** คำสั่งล่าสุดอนุมัติจัดเอกสารและ direct commit/push develop เท่านั้น
- คำอนุมัติ merge PR #19 และคำอนุมัติ direct push docs รอบนี้ไม่ใช่ blanket permission สำหรับ feature ใหม่, deployment หรือแก้ branch ของ Agent อื่น
- ใช้ worktree แยกสำหรับงาน 3D; ห้ามรบกวน checkout `feat/sprint-05-planning-ssot` ที่ PO ใช้ใน Antigravity

## 2. จุดประสงค์ที่ต้องรักษา

PO สร้าง JaoKob เป็นของขวัญส่วนตัวให้คนรัก ต้องการประสบการณ์ที่ช่วยผ่อนคลายและสร้างความผูกพันกับเจ้ากบและของขวัญจริง ความเหมือนและความรู้สึกคุ้นเคยจึงสำคัญกว่าการโชว์เทคนิค 3D เกมยังเป็น client-side/mobile-first/ไม่มี login หรือ monetization

Keepsake เริ่มจากความต้องการให้หมุน ซูม และชื่นชมโมเดลที่เชื่อมกับ END-HOME และอาจต่อยอด inventory ในอนาคต ความตั้งใจนี้ไม่ใช่หลักฐานว่าเกมเชื่อม viewer แล้ว และไม่ได้อนุญาตให้เผยแพร่รูปส่วนตัวหรือส่งภาพให้บริการภายนอก

ภาพต้นแบบสองวัยมีเอกลักษณ์ต่างกัน:

- **วัยเด็ก:** ลำตัว/หัวทรงแคปซูลป้อมต่อเนื่อง ไม่มีคอคอด ตากลมโต มีวงขาวและประกายใหญ่/เล็กสองจุด ปากโค้งส้มแดง แถบเสื้อน้ำเงิน มือเท้าสามแฉก
- **วัยโต:** หัวกว้าง ตาปรือ ริมฝีปากพีช เสื้อยืดน้ำเงิน แขนขายาวกว่า; ด้านหลังส่วนหนึ่งเป็นการอนุมานจากภาพ ไม่ใช่ scan

ต้นแบบทางเทคนิคไม่ใช่ข้ออนุมัติสเกลหรือรายละเอียดบทในอนาคต ดูความแตกต่างระหว่างเนื้อเรื่องกับของสะสมใน §5

## 3. ลำดับสิ่งที่ตกลงและส่งมอบจริง

| รอบ | PO ต้องการ / การตัดสินใจ | ผลและสถานะ |
|---|---|---|
| Milestone 1, 13–14 ต.ค. | เริ่มวัยโตท่านั่ง เสื้อยืดน้ำเงิน; Blender Python; lazy model-viewer | adult source/GLB/4 renders/preview; CR-0004 และ ADR16; 546,020 bytes / 22,508 triangles เป็นตัวเลขประวัติ |
| Milestone 1B, 14 ต.ค. | เพิ่มวัยเด็กไหมพรม พร้อมหัวใจแยก และแท็บเลือกวัย | รวมใน PR #11; ช่วงนั้น export default กอดหัวใจ การแยกหัวใจเป็น mesh อย่างเดียวไม่ได้ให้ท่ามือเปล่าที่เป็นธรรมชาติ |
| Milestone 1C, 18 ต.ค. | ADR25 แก้ default child เป็นมือเปล่า/Velour; เก็บหัวใจและ Crochet เป็นตัวเลือก | สร้างแขนสองชุดและหัวใจแยก, KHR variants + STEP clip; source/helper/UI/evidence; commit `741b0b5` |
| Milestone 1D, 19 ต.ค. | PO ขอ adult มีหัวใจ/Crochet เช่น child และแก้ตาขาวโผล่มุมบน | adult optional arms/heart/materials, closed eyelid hood, per-doll UI memory; commit `71b6d71` |
| รวมงาน 19 ต.ค. | PO อนุมัติ merge โดยห้ามกระทบ Antigravity | PR #19 merge commit `7476722`; merge tree ตรง verified head `94f8b74`; ตรวจ branch/status และ hash 798 ไฟล์ของ planning ไม่เปลี่ยน ณ เวลานั้น |
| หารือ 20 ต.ค. | PO ถามเรื่องยืน หายใจ พูด ตกใจ ร้อนรน ครุ่นคิด เฉพาะเจ้ากบใน VN | Astra สนับสนุนการทดลองหนึ่งฉากก่อน ดู §6–8; ยังไม่เริ่มงานโมเดล/โค้ดใหม่ |
| เอกสาร 20 ต.ค. | PO ขอคู่มือและ hand-off ละเอียด พร้อม changelog และ direct push develop | งาน documentation-only ของ record [CR-20261020-1318](../../changelog/2026-10/2026-10-20-1318-3d-structure-session-handoff.md) |

ADR16/17 และ progress รุ่นเก่ามี contract/ตัวเลขที่ถูกแทนที่บางส่วน เช่น adult เคยหนึ่ง mesh ไม่มี animation และ child เคย default กอดหัวใจ ให้ใช้ current artifacts + accepted changes ตามลำดับ อย่าแก้ประวัติให้เหมือนไม่เคยตัดสินใจผิด

## 4. Baseline ที่ตรวจรับทางเทคนิคแล้ว

| รายการ | วัยเด็ก | วัยโต |
|---|---:|---:|
| GLB bytes | 704,780 | 1,038,744 |
| Triangles ทุกชิ้น รวมที่ซ่อน | 15,728 | 24,201 |
| Visible: empty | 12,584 | 21,688 |
| Visible: heart | 13,384 | 22,425 |
| Editable parts | 50 | 55 |
| Nodes / meshes / materials / primitives | 4 / 4 / 3 / 5 | 4 / 4 / 3 / 5 |
| Khronos errors / warnings | 0 / 0 | 0 / 0 |
| Informational notices | 6 | 6 |

งบที่ใช้อยู่ ≤2,000,000 bytes และ ≤25,000 triangles ต่อ GLB นับทุก pose ที่เก็บ; 400–600KB เป็น soft target เดิมที่ไฟล์ปัจจุบันเกินแล้ว รายงานตามจริง ไม่อ้างว่าผ่าน soft target งบนี้ไม่รวม model-viewer, posters หรือ GPU memory และไม่ใช่การอนุมัติงบ standing character ใหม่

หลักฐานรอบส่งมอบ: [adult metrics](evidence/model-metrics.json), [child metrics](evidence/childhood-model-metrics.json), [adult validator](evidence/glb-validation.json), [child validator](evidence/childhood-glb-validation.json), [preview regression](evidence/preview-verification.json), [adult states](evidence/adult-variants-verification.json), [child states](evidence/childhood-variants-verification.json)

- ทั้ง 8 combinations ตรวจ actual rendered scales/material maps, per-doll memory, keyboard/focus, 320/390px targets, reduced motion, rapid/pending selection, retry และ close/reopen
- Game unit suite รอบ M1D: **1,060 passed, 0 failed/skipped**; รอบ M1/1B เดิม 691 ไม่ใช่ยอดปัจจุบัน ผลนี้ไม่ได้ถูกรันซ้ำเพียงเพราะเขียน hand-off
- ตรวจ source ด้วย Blender5.2.2 LTS, embedded helper และ packed textures; ไม่มีภาพอ้างอิงฝังใน export
- Physical iPhone/Android FPS/thermal/GPU memory, Safari/VoiceOver, Blender4, final art likeness และ production integration ยังไม่ผ่านการรับรองจากงานนี้
- Merge ตามคำสั่ง PO ไม่ได้เปลี่ยนสถานะ device/art gates ให้ผ่านโดยอัตโนมัติ

## 5. ขอบเขต Canon, governance และงานคู่ขนาน

วันที่บันทึกนี้ develop ยังมี AGENTS/navigation รุ่นเก่าบางส่วน ขณะที่ PO supplied instructions และ planning checkout ใช้ Sprint5 SSOT กับ ADR ที่ใหม่กว่า ห้ามเปิดไฟล์เก่าแล้วสรุปว่าโครงการย้อนกลับไป Sprint1 หรือ biological frog baseline

ข้อเท็จจริงที่พบใน planning checkout ระหว่างการหารือล่าสุด:

- `docs/adr/ADR-P0-029-in-universe-living-narrative-sovereignty-and-doll-language-ban.md` ระบุ Accepted และแยกเจ้ากบมีชีวิตในเรื่องจากข้อกำหนดวัสดุ/ของขวัญของ Keepsake โดยห้ามนำภาษาตุ๊กตาหรือกำมะหยี่ไปบรรยายตัวเอกใน Act1–4
- มี ADR24/26/27/28/29/30 และ act blueprints ที่ยังเป็นงาน local/untracked ณ เวลาตรวจ ไม่ได้อยู่ใน develop baseline นี้ครบ
- ข้อแนะนำ “ฉบับตัวละครเนื้อเรื่องแยกจาก Keepsake” มาจากการอ่านบริบทนั้น ไม่ใช่การประกาศ Canon ใหม่หรืออนุมัติรูปลักษณ์เอง

ก่อนเริ่ม standing character ให้รับแผน/ADR ที่ PO ใช้จริงในวันนั้น โดยเฉพาะตัวตน ผิว มือเท้า เสื้อผ้า และสเกล หากไม่มีเอกสารให้ถามส่วนที่จำเป็น อย่า copy หรือ commit งานเขียนส่วนตัว/งานค้างของทีมอื่นเพื่อทำให้ลิงก์ครบ เอกสารนี้ไม่คัดลอกบทและไม่ขยาย authority ของตัวเอง

ใช้ `git worktree list --porcelain` ค้น checkout ปัจจุบัน อย่าถือ absolute path ของ session เก่าว่ายังใช้ได้ Last observed planning HEAD ตอนเริ่มงานเอกสารคือ `1fbbf63` ซึ่งใหม่กว่า `9a1175b` ที่ใช้ตรวจหลัง merge; เป็นความคืบหน้าของเจ้าของ branch ไม่ใช่สิ่งที่ต้อง reset กลับ

Active Sprint5 SSOT อยู่บน planning branch และไม่มีใน develop นี้ งานเอกสารนี้ลงทะเบียนใน root changelog/Change Record/hand-off แล้ว **ไม่แก้ Section7 ใน checkout ของ Antigravity**; ให้เจ้าของ planning register อ้าง record เมื่อประสานเอกสารครั้งถัดไป ไม่มี WBS implementation ถูกทำเครื่องหมายเสร็จจากงานนี้

## 6. การหารือล่าสุด 2026-10-20

**คำถามของ PO:** ถ้าทำเจ้ากบทั้งวัยเด็กและวัยโตเป็น character ยืน หายใจ และแสดงท่าขณะพูดกับคนอื่น เช่น ตกใจ ร้อนรน ครุ่นคิด แล้วใช้เฉพาะตัวเอกในเกมเนื้อเรื่องตอนนี้ จะเหมาะไหม ควรทำไหม มีแนวทางและ reuse จากไฟล์เดิมได้ไหม

**คำแนะนำของ Astra:** เหมาะจะทดลอง เพราะ micro-motion ช่วยให้รับรู้ว่าเจ้ากบกำลังฟังและรู้สึกต่อเหตุการณ์ โดยเริ่มฉากทดลองที่มีฉากหลังภาพวาด + ตัวเอก3D + กล่องบทสนทนาเดิม กล้องคงที่หรือขยับน้อย ทำให้เข้ากันด้วยแสง สี eye line และ contact shadow ตัวละครอื่นยังเป็นภาพวาดได้ แต่ต้องตรวจการอยู่ร่วมฉากจริง

ข้อเสนอด้านภาพคือรักษาเอกลักษณ์หัว ตา ปาก สี และสัดส่วนจากของเดิม สร้าง source ตัวละครเนื้อเรื่องแยก; พิจารณาผิวเรียบนุ่ม ลดตะเข็บบนร่างกาย และเพิ่มการเคลื่อนไหวมือเท้าให้เหมาะกับกบมีชีวิต ส่วน Keepsake นั่งและวัสดุสองแบบคงไว้ ไม่เปลี่ยนข้อมูลบทให้เข้ากับโมเดลที่ทำสะดวกกว่า

ทั้งรูปแบบภาพและแผนขั้นต่อไป **เป็น recommendation** ยังไม่มีการอนุมัติ integration, Three.js runtime dependency, schema, ค่า budget ใหม่ หรือเริ่ม standing milestone การอนุมัติเขียนเอกสารนี้คือการเก็บข้อเสนอไว้ให้ session หน้าใช้พิจารณา

## 7. Reuse และสิ่งที่ต้องสร้างใหม่

| ใช้ต่อได้ | สิ่งที่ต้องปรับ / ความเสี่ยง |
|---|---|
| `.blend` parts และ Python parameters | ท่านั่งไม่ใช่ bind pose สำหรับยืน ต้องจัดเท้า สะโพก สมดุล และสัดส่วน |
| หัว ดวงตา ปาก palette และเสื้อ | narrative look ต้องตรวจเทียบล่าสุด ไม่ยกของสะสมทั้งผิวไปแสดงในเรื่องทันที |
| UV/material ideas และ authored tiles | เลือกใช้ให้ตรง asset role; texture compression/GPU costs ต้องวัดใหม่ |
| Export validation/budget/evidence discipline | current verifier ผูกกับ 4 nodes/STEP selector; rigged asset ต้องมี contract/verifier ของตัวเอง |
| Optional heart ที่แยกแล้ว | standing hand attachment ต้องผูกกับ pose/bone ใหม่ และไม่ทำหัวใจเป็น default ถาวร |
| Closed adult eyelid hood | เมื่อทำ blink/surprise ต้องรักษาความสัมพันธ์กับ sclera/pupil และตรวจทุกมุมอีกครั้ง |

งานใหม่หลัก: neutral standing pose, skeleton/armature, weights, deformation ที่ข้อศอก/ไหล่/สะโพก/เข่า, eyelid/mouth controls หรือ shape keys, motion clips และ runtime presentation control ไม่ใช่เพียงเปลี่ยน `animation-name` แล้วได้ท่ายืน

เริ่มจาก source `.blend` และ generator เพราะแยกชิ้นส่วนได้ หลีกเลี่ยงเริ่มจาก GLB ที่ join เพื่อเว็บ วัยเด็กคงแคปซูลไม่มีคอคอด; วัยโตคงตาปรือเป็น rest face ใช้ชื่อกระดูก/clip ร่วมได้ แต่ปรับ weights, timing และ gesture ตามรูปร่างของแต่ละวัย ไม่รับรองว่าจะ retarget อัตโนมัติโดยไม่เกลา

## 8. แผนทดลองที่เสนอไว้ ยังไม่เริ่มดำเนินการ

### 8.1 ชุดการแสดงเริ่มต้น

| สภาวะ | การแสดงที่เสนอ | สิ่งที่ต้องระวัง |
|---|---|---|
| Idle/listen | หายใจเบา กะพริบตา ถ่ายน้ำหนักเล็กน้อย | เท้าติดพื้น ไม่ scale ทั้งตัวจนลอยหรือยืดยุบ |
| Talk | หันมองคู่สนทนา พยักหน้า ขยับมือ/ปากพอประมาณ | ถ้าไม่มีเสียงพากย์ ไม่ต้องอ้าปากตามทุกตัวอักษร |
| Surprise | เปิดตา ยกไหล่ ถอยสั้น ๆ แล้วผ่อน | one-shot ไม่เด้งซ้ำทุก UI redraw |
| Anxious | มือใกล้ตัว มองสลับทิศ หายใจถี่เล็กน้อย | ไม่ใช้ jitter ตลอดเวลาจนอ่านไม่สบาย |
| Thinking | เอียงหัว มองต่ำ แตะคาง/ประสานมือ | มือไม่ทะลุหน้าและตายังอ่านอารมณ์ได้ |
| Relief | ผ่อนไหล่ คลายมือ กลับ idle | transition ไม่กระตุก |

ความนิ่งและจังหวะหยุดเป็นส่วนหนึ่งของ acting ไม่จำเป็นให้ทุกส่วนขยับพร้อมกัน เด็กอาจมีจังหวะและท่าที่ต่างวัยโตแม้ใช้ clip IDs ชุดเดียวกัน

### 8.2 ลำดับที่แนะนำ

1. ยืนยันรูปลักษณ์ตัวละครเนื้อเรื่องและ scope ของ Spike แยกกับ PO ตาม Canon ปัจจุบัน
2. ทำ adult ยืนก่อน เก็บ seated Keepsake เดิมไว้; ตรวจ front/side/three-quarter และสมดุลเท้า
3. เพิ่ม rig/weights และ facial controls ทดสอบงอแขน ขา หันหัว blink โดยไม่ให้ mesh/เสื้อ/ตาทะลุ
4. เริ่ม idle/breath/blink แล้ว talk/surprise/thinking; เพิ่ม anxious/relief เมื่อพื้นฐานดี
5. สร้าง preview acting ที่เลือกคลิปได้และดู transition ไม่แทนที่หน้า Keepsake เดิมโดยไม่ตกลง
6. ทดลองกับบทจริงหนึ่งฉากและกล่องข้อความบนมือถือ ตรวจความผูกพัน ความอ่านง่าย แสง/เงาและพื้นที่ตัวละคร
7. ถ้าผลดี จึงทำ childhood ด้วย semantic controls ร่วมแต่ปรับสัดส่วนและจังหวะ
8. ก่อนเข้า `src/` ทำ RFC/ADR/การเชื่อม presentation + schema/compatibility ตามผลกระทบ และ gate ที่วัดได้ ไม่อาศัยการอนุมัติ Spike เดิมแทน

### 8.3 Rendering และ architecture ที่หารือ

- `<model-viewer>` ของเดิมเล่น/เปลี่ยน animation และ crossfade ได้ เหมาะตรวจ asset รอบแรก ไม่ควรกล่าวว่า “เล่น animation ไม่ได้”
- พิจารณา Three.js สำหรับ scene runtime เมื่อจำเป็นต้องควบคุม breathing + gesture + face, animation blending, gaze และ lifecycle ละเอียด เป็นข้อเสนอให้ประเมิน ไม่ใช่ dependency ที่อนุมัติ/ติดตั้งแล้ว
- ให้ฝ่ายเนื้อเรื่องกำหนด acting cue ผ่านข้อมูลที่ validate แล้ว ตัวอย่างชื่อ `listen`, `surprise`, `thinking` เป็นเพียง illustrative IDs ไม่ใช่ schema ที่เผยแพร่
- Data projection ส่ง presentation facts; UI owns renderer/animation; Core ไม่ import WebGL/DOM และไม่เดาอารมณ์จากข้อความด้วย heuristic หรือค่าซ่อนที่อาจเฉลยผลลัพธ์
- ข้ามข้อความได้ทันที; animation ไม่ขัดขวาง choice/reading และไม่เลื่อน story cursor เอง คิดเรื่อง interrupt/skip/restore และไม่ replay one-shot จาก redraw หรือ media arrival
- หนึ่ง active renderer เท่าที่จำเป็น โหลดวัยที่แสดงอยู่ หยุดเมื่อ hidden/unmounted มีภาพนิ่ง fallback และ reduced motion อย่าถือว่าถอด element แล้ว GPU memory คืนหมด
- วัดบนมือถือจริงทั้ง sustained FPS, frame time, memory, thermal/battery และ text/input latency; ค่า≤2MBของ GLB ไม่ได้พิสูจน์ว่าเปิดแสดงนาน ๆ จะลื่น

แหล่งทางการที่ตรวจระหว่างการปรึกษา: [model-viewer animation examples](https://modelviewer.dev/examples/animation/), [Three.js animation system](https://threejs.org/manual/pages/animation-system.html), [AnimationAction](https://threejs.org/docs/pages/AnimationAction.html) ให้ตรวจ version/API ที่เลือกจริงอีกครั้งก่อน implementation

## 9. บทเรียนจากงานที่ทำจริง

1. **Optional mesh ไม่เท่ากับ optional stance.** ซ่อนหัวใจจากแขนที่อบท่ากอดไว้ยังดูเหมือนถือของที่หายไป จึงต้องสร้างแขนท่าพักจริงและสลับอย่างเป็นชุด
2. **Artifact สื่อความหมายให้ทีมเขียนบท.** Default pose/poster ที่ผิดนำไปสู่การตีความ Canon ผิดได้ ต้องให้ source, raw GLB, poster, preview และคำอธิบายตรงกัน
3. **เส้นขอบเปลือกตาไม่ปิดพื้นผิวตา.** Adult ใช้ decorative tube เดิมทำให้ตาขาวโผล่มุมบน แก้ด้วย closed hood ที่มี underside จริง; ดู [before](evidence/adult-eyelid-before-top.png) และ [after](renders/adult/eyelid-top.png)
4. **การตรวจรูปทรงต้องมากกว่าหน้าตรง.** ใช้ front/side/back/three-quarter/top/high, manifold checks และ sampled rays ใหม่ top=0/676 exposed เทียบเก่า248/732; ไม่ตีความ sampling เป็น proof ทุกจุด
5. **Seam และ sweep frame มีผลต่อผิวนุ่ม.** Weld coincident vertices โดยเก็บ loop UV; continuous frame ช่วยลดแขนบิดเมื่อเส้นโค้งเปลี่ยนทิศ แต่ยังต้องดู render จริง
6. **Blender กับเว็บต้องตรวจแยก.** Material/light/tangent differences อาจทำให้ผิวดูต่างกัน ตัดสินจาก GLB ที่ renderer จริงด้วย ไม่รับรองจาก Blender อย่างเดียว
7. **เก็บ material ที่ไม่ได้ใช้ให้รอด save/reopen.** Crochet default-off ต้องมี fake user และ packed images; ทดลอง embedded helper หลังเปิดไฟล์ใหม่
8. **ท่าที่ซ่อนก็มีต้นทุน.** นับทุก stored triangle และทุก texture ใน budget; ต้นทุนบน GPU ไม่เท่าขนาดดาวน์โหลด
9. **Async state ต้องผูกกับ selection ปัจจุบัน.** Module/GLB เก่าที่โหลดช้าอาจกลับมาเขียนทับ model ใหม่ ต้องมี cancellation/generation guard, retry cache behavior และตรวจ focus หลังปุ่มหาย
10. **ไม่อ้าง deterministic เกินผลวัด.** Child rebuild byte-identical; adult canonical indices/positions/UV/colors/textures/JSON เหมือนกัน แต่ normal มี variationสูงสุด0.00006754/component ดู [evidence](evidence/adult-rebuild-verification.json)
11. **แยกหลักฐานเก่ากับผลใหม่.** 691-tests/old hashes/old pose เป็นประวัติ ผล 1,060-tests รอบ asset ไม่ใช่ผลทดสอบ character rig หรือ doc session ใหม่
12. **Worktree แยกช่วยปกป้องงานคู่ขนาน.** Merge ผ่าน GitHub โดย pin SHA, ตรวจ tree/branch/hash หลังจบ; อย่า checkout/pull/stash/reset workspace ของอีก IDE เพื่อความสะดวก

## 10. จุดเริ่ม session ถัดไปและสิ่งที่ยังค้าง

Checklist เริ่มต้น:

- [ ] ตรวจคำขอใหม่: ต้องการคำปรึกษา, proposal, rig Spike หรือ production integration ให้ชัด
- [ ] ตรวจ remote develop และ worktrees ปัจจุบันแบบไม่ทำลายงานค้าง; branch/HEAD ในเอกสารนี้เป็น snapshot
- [ ] อ่าน governance/Canon ที่ PO ใช้อยู่จริง ไม่ยึด Phase0 ที่ถูกแทนที่หรือ hand-off นี้เหนือ ADR ล่าสุด
- [ ] อ่าน [STRUCTURE](STRUCTURE.md) และ source ของงานที่จะแก้; ตรวจภาพอ้างอิงที่มีจริง
- [ ] ถ้าจะเริ่ม standing: ยืนยัน art direction, scope, asset naming, runtime candidate, acceptance/device budget ก่อนเขียน implementation
- [ ] ทำ change record และเลือก verification ตามสิ่งที่เปลี่ยน แยกผลจริงกับสิ่งที่ยังไม่ได้รัน

สิ่งที่ยังไม่ส่งมอบ: standing child/adult, rig/weights/facial controls, breathing/acting clips, character-stage runtime, story cue schema, production END-HOME integration และ physical-device acceptance ไม่มีใครควรทำเครื่องหมายรายการเหล่านี้ว่าเสร็จจาก PR #19

Rollback ของงานเอกสารนี้เป็น reviewed revert ของ documentation commit ไม่กระทบ Save/model/runtime; rollback adult M1D ต้องคง childhood ADR25 correction ไว้ ส่วนการเริ่ม asset รุ่นใหม่ควรเก็บ seated baseline ไว้เป็นจุดเทียบ

### ข้อความตั้งต้นสำหรับ session ใหม่

> อ่าน `docs/proposals/3d-keepsake-spike/HANDOFF.md`, `STRUCTURE.md` และ `README.md` ก่อนเริ่ม ตรวจ branch/worktree และ active Canon ล่าสุดโดยรักษา workspace ของ Antigravity งานที่ merge แล้วคือ seated Keepsake สองวัย default empty/Velour มี heart/Crochet selectors; ยังไม่มี character rig แนวคิด standing VN character ใน hand-off เป็นคำแนะนำที่ต้องแยกจากสิ่งที่ PO อนุมัติให้ทำในคำขอใหม่ เริ่มจากสรุปความเข้าใจและตรวจ source ที่มีจริง แล้วดำเนินงานเฉพาะขอบเขตที่ได้รับอนุญาต
