# ADR-P0-034: Five-Act Journey Runtime, Save Format 2 Journey Profile, Legacy Save Deprecation and Blueprint-Compiled Content
# พระราชบัญญัติสถาปัตยกรรมรันไทม์การเดินทางห้าองก์ · Save Format 2 Journey Profile · การเลิกเล่นต่อเซฟเก่า และเนื้อหาที่คอมไพล์จากพิมพ์เขียว

> **[STATUS AS OF 2026-10-31: PROPOSED — รอ PO และ Antigravity ลงนาม]**
> มติ PO วันที่ 2026-10-31 (Q1–Q5 ใน [สมุดสถาปนิก §6](../dialogue/sprint-05/core-architect-notebook.md)) มีผลแล้วในฐานะคำสั่งของ Final Authority · ADR นี้บันทึกผลทางสถาปัตยกรรมของมติเหล่านั้นและรายละเอียดทางเทคนิคที่ต้องได้รับการลงนาม ก่อนเริ่ม checkpoint C1 ของ Slice 1

| Metadata | Value |
|---|---|
| **Status** | **PROPOSED · Version 0.1 (2026-10-31)** |
| **Date** | 2026-10-31, Asia/Bangkok |
| **Proposed by** | Claude Opus 5.5 · Supreme Core Architect & Lead Game Systems Engineer |
| **Approvers** | Theerapat (`T3thr` · Creator & PO · Final Authority) · Antigravity (Lead System Architect · ตรวจ schema และสัญญาข้อมูล) |
| **Builds on** | [ADR-P0-032 v2.0](./ADR-P0-032-living-fantasy-canon-peuak-miracle-doll-and-vn-stage-blocking.md) · [ADR-P0-033](./ADR-P0-033-interactive-tactical-adventure-gameplay-and-dynamic-stage-revolution.md) · [ADR-P0-013](./ADR-P0-013-content-validation-contract.md) · [ADR-P0-014](./ADR-P0-014-content-orchestration-and-resume.md) · [ADR-P0-015](./ADR-P0-015-interactive-light-novel-presentation.md) · [ADR-P0-019](./ADR-P0-019-visual-novel-runtime-ergonomics-and-design-system-mandate.md) · [ADR-P0-020](./ADR-P0-020-adventure-keepsake-pouch-and-item-system.md) · [ADR-P0-022](./ADR-P0-022-visual-novel-ergonomics-living-keepsake-lore-and-sprint-streamlining.md) (ส่วน UI · Save Format 2 · 4 slices) · [ADR-P0-025](./ADR-P0-025-childhood-keepsake-default-stance-and-heart-emote-decoupling.md) |
| **Design contracts** | [มหาพิมพ์เขียว 5 องก์ 2.0.0](../design-system/five-act-narrative-gameplay-master-plan.md) · [สเปก UX/UI 2.0.0](../design-system/interactive-gameplay-ux-ui-specification.md) · [ฟิสิกส์และภาพ v2](../design-system/physics-scale-and-visual-v2-specification.md) · [Mockups v3](../design-system/ux-mockups/v3/README.md) |
| **Plan** | [Sprint 5 SSOT 0.3.0](../sprints/sprint-05-ssot.md) |

---

## 1. บริบท (Context)

1. **โดเมนเปลี่ยนทั้งระบบ:** ADR-P0-032 v2.0 และ ADR-P0-033 กำหนดสถานะใหม่ (กาย ใจ แรง 0–5 · สายใยสามเส้น 0–4 · ตัวนับการเดินทาง) ระบบใหม่สี่เสา (ศึกแสงปะทะเงา · แคมป์ · เวทีมีชีวิต · สัมผัสโต้ตอบ) ไม่มี Game Over และฉากจบสามทางแบบสมมาตรที่มี Safety Fallback · ตัวเลขทุกตัวพิสูจน์แล้วด้วยเครื่องมือใน [evidence/](../design-system/evidence/README.md)
2. **runtime ปัจจุบันรับได้แค่ Act 1 เรื่องเดิม:** schema 2.0.0 · 1 tree · 28 โหนด 3 ชนิด · มาตรวัด `hp/sanity/bond` 0–100 · crisis นำไปสู่ GameOver · session ระบุตัวตนด้วย contentVersion อย่างเดียว · กติกาศึกอยู่ในเอกสาร evidence ไม่ใช่ใน `src/core`
3. **มติ PO 2026-10-31:** (Q1) ทำครบสี่ slices ยี่สิบงานแบบไร้หนี้ (Q2) อนุมัติเก้าข้อใน [มหาพิมพ์เขียว §10](../design-system/five-act-narrative-gameplay-master-plan.md) (Q3) เลิกเล่นต่อเซฟเก่า ทุกคนเริ่ม New Game บน Save Format 2 ที่สะอาด และเก็บเซฟเก่าแบบ raw ไว้ (Q4) ใช้ branch `feat/sprint-05-slice-01-foundations` (Q5) มี snapshot ต้นองก์ครบห้าองก์ และคำสั่งให้ C4–C5 เป็น Interactive HTML5/CSS3 Web Prototype ที่เล่นได้จริง
4. **บทเรียนจากประวัติ:** ความเสียหายใหญ่ของโครงการไม่เคยมาจากบั๊ก แต่มาจาก canon เพี้ยน (Agent อ่านกฎเก่าจนเปลี่ยนเตื๊อกเป็นสุนัข ตาม ADR-P0-032 §1) และคุณภาพประสบการณ์ (ADR-P0-022 §1) สถาปัตยกรรมจึงต้องกันการเพี้ยนด้วยโครงสร้าง ไม่ใช่ด้วยความระมัดระวังอย่างเดียว

---

## 2. การตัดสินใจ (Decisions)

### D1 — รันไทม์ใหม่ "Journey" และการปลดระวางรันไทม์เดิม (Strangler Fig)

1. แพ็กเกจที่ประกาศ profile `journey` ทำงานบน runtime ใหม่ทั้งชุด bootstrap เลือก runtime จาก profile ที่ตรวจแล้วเท่านั้น ห้ามเดา
2. runtime เดิม (`choice-transaction` · `content-orchestration` · ตาราง TR-001..020 · `dom-renderer` ของ S4 · แพ็กเกจ act-01 2.0.0/2.1.0/3.0.0 และ migration) **แช่แข็งตั้งแต่วันนี้** ไม่เพิ่มฟีเจอร์
3. เมื่อทางเข้าเริ่มของเกมเปลี่ยนเป็น Journey (Slice 1 checkpoint C5) ให้ลบโค้ด เนื้อหา และเทสต์ของ runtime เดิมออกจาก repository ในคราวเดียว ทุกเทสต์ที่ลบต้องลงใน **ทะเบียน assertion ที่ถูกแทนที่** พร้อม authority และเทสต์ทดแทน (SSOT §5.3) · ส่วนที่เป็นโครงสร้างพื้นฐานกลางและใช้ต่อได้ (validator · persistence transaction · history · audio · asset resolver · image cache · โดเมนกระเป๋า) ไม่นับเป็นของเดิมที่ต้องลบ

### D2 — ขอบเขตโมดูลและความบริสุทธิ์ของ Core

```text
src/core/domain/journey/     สถานะการเดินทาง · กติกาค่าสถานะ · โหยหาบ้าน · สายใย · ฉากจบ
src/core/domain/clash/       ความหมายของเจตนาและการกระทำ · kernel · shell · projection ของถาด
src/core/domain/encounters/  obstacle · camp · micro · pouch-offer
src/core/use-cases/          journey-session (คำสั่งทั้งหมดของผู้เล่นเป็น transaction เดียวต่อครั้ง)
src/core/state-machine/      play-mode (เครื่องสถานะโหมดตาม UX §1.7)
```

1. **Kernel กับ Shell:** kernel เป็นฟังก์ชันบริสุทธิ์บนข้อมูลธรรมดา ไม่ตรวจ ไม่ freeze ให้เครื่องมือพิสูจน์ใช้ได้เร็ว · shell ตรวจ input ปฏิเสธด้วย error code ที่คงที่ (เช่น `CLASH_ACTION_ILLEGAL` · `CLASH_ENDED` · `CLASH_ROUND_UNKNOWN` · `JOURNEY_BEAT`) แล้ว deep-freeze ผลลัพธ์ · ห้ามแก้ input
2. **ไม่มีการสุ่มและไม่มีนาฬิกาใน Core:** กติกาของเกมไม่สุ่มเลย journey profile จึงไม่มี RNG · เวลาเข้ามาทาง port · ขยาย TC-S4-ARCH-001 ให้ตรวจ `new Date(` และ `performance.now(` เพิ่มจาก `Math.random(` และ `Date.now(` ที่ตรวจอยู่
3. ทิศทาง dependency และข้อห้ามเดิมทั้งหมดใน [AGENTS.md §9](../../AGENTS.md) คงเดิม

### D3 — สถานะการเดินทางแยกจากสถานะการเผชิญหน้า

1. **JourneyState** (บันทึกข้ามโหนด): `act` · `meters {hp, mind, sta}` 0–5 · `bonds {pkam, fiw, teuk}` 0–4 (สายใยครอบครัวคำนวณจากองก์ ไม่บันทึก) · `counters {familySkillUses, selfReliance, homeStreak, homesickCount, tempo}` · `route` · `plan` · `major` · `pouch` (โดเมน ADR-P0-020 เดิม พร้อมกฎของที่ล็อก: `item_teuk_peuak_button` สละไม่ได้) · `ready[]` · `flags[]` ที่ลงทะเบียนพร้อม policy
2. **EncounterState** (เฉพาะระหว่างศึกหรือแคมป์): ศึกเก็บ `roundId · turn · light · used · dim · charged · weak · regroup · grace · gritUsed · homesick` · แคมป์เก็บ `campId · dropsLeft · chosen`
3. สองสถานะรวมกันผ่านฟังก์ชันออก (`exitClash` · `exitCamp`) ที่ประกาศชัดเท่านั้น ห้ามมีตัวนับซ่อนหรือกลเม็ดแบบส่ง `fsu: 0` เข้าศึกแล้วบวกกลับ
4. กติกาทุกข้อเป็นไปตาม [มหาพิมพ์เขียว §2](../design-system/five-act-narrative-gameplay-master-plan.md) และมติ PO รวมถึง Soft Floor · ฝืนเอาเป็นทางเดียวที่ถึง 0 แล้วเกิด Grace · Rest Floor ท้ายองก์ · `familySkillUses` และ `selfReliance` นับตั้งแต่ Act 2 · ทักษะที่ใช้ซ้ำในศึกได้แสงน้อยลงสองช่องต่อครั้งที่ซ้ำ · ฉากจบตาม §2.13 และ Safety Fallback ของ E-POND ที่มีอย่างน้อยหนึ่งฉากจบเปิดเสมอ

### D4 — กติกาใน Core · ตารางและสเปกในแพ็กเกจ · ถ้อยคำจากพิมพ์เขียว

1. **Core เป็นเจ้าของความหมาย:** ชนิดของเจตนาและผล · ชนิดของการกระทำและตัวเลข (ตาราง ACTIONS) · ความหมายของสี่กุญแจ บุกทวน รอจังหวะ และฝืนเอา · กติกาแคมป์ · สมการฉากจบ
2. **แพ็กเกจเป็นเจ้าของการประกอบ:** สเปกยกศึก (`turns` · `p0` · ลำดับเจตนา · ผู้ร่วมรบ · พี่น้อง · ท่าผสาน · เหตุการณ์รายเทิร์น · อาณาเขต · ท่าปิดศึก) · สเปกด่าน แคมป์ และการรับของรายโหนด · ทะเบียนของและธง · การจัดเวที · ข้อความ
3. **คำศัพท์ปิด (closed vocabulary):** effect มีเพียง `meter.set` · `meter.add` · `meter.hazard` · `floor.rest` · `bond.add` · `flag.set` · `pick.major` · `pick.route` · `pick.plan` · `item.grant` · `item.ready` · condition มีเพียง `has-item` · `flag` · `meter-at-least` · `bond-at-least` · `act` · `all` · `any` · `not` · ห้ามมี expression หรือโค้ดใน JSON · ชื่อและขอบเขตสุดท้ายกำหนดใน schema ของ T1 · คำที่ไม่รู้จักถูกปฏิเสธตอนรับแพ็กเกจ

### D5 — กติกาแหล่งเดียว และพิสูจน์บนเนื้อหาจริง

1. ย้าย [tactical-clash-engine.mjs](../design-system/evidence/tactical-clash-engine.mjs) เข้า `src/core/domain/clash/` โดยเปลี่ยนข้อความไทยเป็น key และใช้ ID เต็มของของและสหาย
2. **Parity gate:** kernel ใหม่ต้องให้สถานะเหมือน engine เดิมทุกก้าว ในทุกลำดับการกดจากจุดเข้าศึกทั้ง 18 จุดของ simulator ก่อนเครื่องมือพิสูจน์จะเปลี่ยนไป import จาก core · หลังจากนั้นไฟล์ใน evidence เป็นเพียง adapter ไม่มีกติกาซ้ำ
3. แบบจำลองสมดุลอ่านสเปกกลไกแบบ declarative ชุดเดียวกับ runtime · เครื่องมือพิสูจน์เป็น design gate แยกจากชุด unit เพราะใช้เวลาหลายนาที

### D6 — เนื้อหาที่คอมไพล์จากพิมพ์เขียว (Content Provenance)

1. แพ็กเกจ `story.jaokob.core` สร้างจากแหล่งเขียนสองแหล่ง: **พิมพ์เขียวรายองก์** (บท การจัดเวที ชื่อปุ่มตามฉาก บรรทัดตอบสนอง) และ **สเปกกลไก** ในคำศัพท์ของ D4
2. compiler ทำงานตอนพัฒนาเท่านั้น ให้ผลเหมือนเดิมทุกครั้ง (ลำดับคีย์คงที่ ไม่มี timestamp) และ commit ผลลัพธ์ไว้ จึงไม่มี build step ตอนเล่น
3. **Drift gate:** unit test คอมไพล์ใหม่ในหน่วยความจำแล้วต้องได้ไบต์ตรงกับไฟล์ที่ commit · ทุกข้อความที่ผู้เล่นเห็นมี receipt ชี้กลับไปไฟล์ โหนด และบรรทัดต้นทาง · ห้ามแก้ไฟล์ที่ compiler สร้างด้วยมือ
4. ตัวตนแพ็กเกจตาม [CR-0006 §2](../rfc/CR-0006-sprint-05-complete-story-and-package-boundaries.md): `story.jaokob.core` สงวนไว้ให้ host · contentVersion แบบ semver · digest รายส่วน · ID ไม่ผูกกับภาษา · ตำแหน่งของ compiler และสเปกกลไกกำหนดใน T1 พร้อม README

### D7 — Save Format 2 · Journey Profile

```text
saveFormatVersion: 2
profile: journey-1
package: { id, contentVersion, digest }        ต้องตรงกับแพ็กเกจที่กำลังเล่น
contentVersion · revision · createdAt · savedAt · reason · settings · integrity
payload:
  sessionId · startedAt · playTimeMs
  cursor      { nodeId, beat, line }            จุดอ่านเชิงความหมาย ไม่ใช่เลขหน้า CSS
  journey     JourneyState ตาม D3
  encounter   null | clash | camp ตาม D3
  actStarts   snapshot ต้นองก์ ≤ 5 รายการ
  completion  { endingsSeen }                   ไม่ถูกย้อนเมื่อเล่นซ้ำ
  history     ≤ 200 รายการ
```

1. `saveFormatVersion` คงเป็น 2 ตาม ADR-P0-022 · `profile` เป็นตัวแยก schema · schema ใหม่อยู่ใน `specs/schemas/v3.0.0/` · schema ที่ตีพิมพ์แล้วห้ามแก้ไบต์
2. **บันทึกเงียบทุกครั้งที่ commit การกระทำ** รวมทุกเทิร์นศึกและทุกกิจกรรมแคมป์ ผู้เล่นจึงย้อนผลด้วยการโหลดใหม่ไม่ได้ และกลับมาเล่นต่อได้ตรงจังหวะเชิงความหมาย
3. ใช้ transaction แบบ staged → canonical → backup และเกราะ race เดิมของ persistence adapter · ขนาดรวมไม่เกิน 250 KB UTF-8 (คาดว่าไม่ถึง 10 KB)
4. **เล่นซ้ำรายองก์ (มติ Q5):** จับ snapshot ที่ต้น Act 1–5 · การเล่นซ้ำเริ่มเส้นเวลาใหม่จาก snapshot ด้วยการตั้งค่าปัจจุบัน · `completion` ไม่ถูกย้อน · snapshot เก็บสถานะที่จับไว้จริง จึงปั๊มผลซ้ำไม่ได้
5. **Namespace ใหม่:** journey เขียนเฉพาะ key ของตนเอง ข้อเสนอคือ `jaokob:journey:story.jaokob.core:canonical` · `:staging` · `:backup` และ `jaokob:journey:settings` (รูปสุดท้ายกำหนดใน T1/T3) · ใส่ package id ใน key เพื่อจองที่ไว้ให้ Sprint 6 โดยไม่ต้อง migrate
6. profile หรือ package ที่ไม่รู้จัก เสีย หรือมาจากอนาคต: เก็บไบต์ไว้ไม่แตะ เสนอเล่นในหน่วยความจำ และไม่เขียนทับเงียบ

### D8 — เลิกเล่นต่อเซฟเก่า (มติ Q3)

1. ไม่มี Resume ไม่มี migration และไม่มีสะพานเชื่อมจากเซฟเรื่องเดิมทุกรูปแบบ (Save 1 · Save 2 content 2.0.0 · 2.1.0 · 3.0.0)
2. **namespace เดิมคือคลังเซฟเก่า:** `jaokob:save:canonical` · `jaokob:save:staging` · `jaokob:save:backup` · `jaokob:settings` · `jaokob:preferences` กลายเป็นพื้นที่อ่านอย่างเดียว runtime ใหม่ไม่เขียน ไม่ย้าย ไม่ลบ และไม่แปลง ไบต์เดิมจึงอยู่ครบและย้อนกลับไปแอปเก่าได้โดยไม่เสียอะไร
3. ถ้าพบข้อมูลใน namespace เดิม แสดงข้อความหนึ่งบรรทัดครั้งเดียวว่าเรื่องเดิมถูกเก็บไว้ และเริ่มการเดินทางใหม่ได้ทันที ไม่ต้องมี dialog ยืนยัน เพราะไม่มีอะไรถูกเขียนทับ
4. การลบหรือส่งออกเซฟเก่าโดยผู้เล่นอยู่นอกขอบเขต Sprint 5

### D9 — เครื่องสถานะโหมดและสัญญา View Model

1. `play-mode` ใน core ทำตาม [UX §1.7](../design-system/interactive-gameplay-ux-ui-specification.md): `VN` · `DECISION` · `CLASH_INTRO` · `CLASH_INTENT` · `CLASH_CHOOSE` · `CLASH_RESOLVE` · `CLASH_OUTCOME` · `CAMP` · `MICRO` · `POUCH_SWAP` · `ENDING_RESONANCE` · modal ซ้อนทับแล้วศึกหยุดรอ · Journey ไม่มีสถานะ GameOver
2. view model ทุกโหมดตาม UX §1.8 คำนวณใน core หรือ projection ของ data รวมถึงป้าย `แก้ทาง` และ `ซ้ำ` · ราคาเป็นเม็ด · เหตุผลที่กดไม่ได้ · การจัดกลุ่มและการเปิดแท็บของถาด · เกลียวฉากจบ · ความสูงเงาจากสูตรใน [ฟิสิกส์ v2 §6](../design-system/physics-scale-and-visual-v2-specification.md) · UI ไม่คิดกติกาเอง
3. สถานะเฉพาะ UI (แท็บที่เปิด · โฟกัส · การ์ดที่ arm ไว้) ไม่บันทึกลงเซฟ · การ arm ผูกกับ revision ของสถานะ เปลี่ยนจังหวะแล้วยกเลิกเอง
4. ถาดศึกตาม UX §3.3: ท่าหลัก ≤ 4 · ครอบครัว ≤ 5 · สหาย ≤ 3 · ของ·ผสาน ≤ 6 · ต้องมีเทสต์ไล่ทุกตำแหน่งศึกที่เกิดได้ ยืนยันว่าแต่ละกลุ่มไม่เกินความจุ และทุกการกระทำที่ทำได้อยู่ในถาดครบ

### D10 — Interactive Web Prototype และระบบวัสดุ (C4–C5)

1. **ต้นแบบคือของจริง:** UI ใหม่ใน `src/ui/journey/` เป็นทั้งต้นแบบและ production ไม่มีโค้ดทิ้ง · HTML5 · CSS3 · ES Modules · Safe DOM · ไม่มี framework และไม่มี runtime dependency ใหม่ (การเพิ่ม dependency ต้องมี RFC และ ADR ตาม AGENTS.md §9)
2. **วัสดุ:** ใช้ token ของ [Atomic 05](../design-system/asset-prompts/05-UX-UI-ATOMIC-COMPONENT-WORKFLOW.md) ที่ PO ล็อกไว้ · เพิ่มชั้นวัสดุกระจกฝ้า (glassmorphism) ให้ HUD แผงซ้อน และป้ายเจตนา ส่วนการ์ดกระดาษสาสำหรับอ่านยังทึบ · ตัวอักษรบนกระจกต้องได้คอนทราสต์ ≥ 4.5 : 1 เทียบกับฉากหลังที่แย่ที่สุด · ถ้าไม่มี `backdrop-filter` หรือผู้ใช้ตั้ง `prefers-reduced-transparency` หรือ forced-colors ให้เปลี่ยนเป็นพื้นทึบอัตโนมัติ
3. **ความคมชัด:** ไอคอนเป็น SVG จาก [glyph ของ v3](../design-system/ux-mockups/v3/harness/primitives.mjs) · ภาพ raster เลือกตาม DPR · Sarabun จาก `assets/fonts/` · พิกัดผังอ้างตาราง handoff ของ [Mockups v3](../design-system/ux-mockups/v3/README.md)
4. **กำแพงกันสปอยล์:** ทางเข้าของผู้เล่นแสดงได้เฉพาะเนื้อหาถึงขอบองก์ที่ promote แล้ว · ใน Slice 1 คือ Act 1 ที่คอมไพล์จากพิมพ์เขียว (ยังไม่ผ่านการรับรองของ T6) · จอขององก์หลังทั้ง 13 จอของ v3 ให้ PO ดูได้ใน harness ตรวจงานที่ render จากสถานะของ engine จริง เก็บใน `docs/design-system/evidence/` และไม่อยู่ใน release allowlist

---

## 3. ผลที่ตามมา (Consequences)

**ด้านบวก:** canon เพี้ยนได้ยากขึ้นเพราะกติกาและถ้อยคำมีแหล่งเดียว · พิสูจน์ความยุติธรรมบนเนื้อหาจริง · เซฟเล็กและไม่มี RNG · มี runtime ชุดเดียวหลัง C5 · Act 1 ที่ PO และแฟนเล่นได้ตั้งแต่ Slice 1

**ด้านต้นทุน:** เขียน core และ UI ใหม่ · ต้องทำ compiler ก่อนเนื้อหา · เทสต์ของ runtime เดิมจำนวนมากจะถูกลบพร้อมทะเบียน · Slice 1 ใหญ่ขึ้นเพราะรวม Act 1 ต้นแบบ

**ส่วนที่ถูกแทนที่ (ไม่แก้ไบต์ของเอกสารเดิม):**

| เอกสาร | ส่วนที่ถูกแทนที่ | แทนด้วย |
|---|---|---|
| [ADR-P0-022](./ADR-P0-022-visual-novel-ergonomics-living-keepsake-lore-and-sprint-streamlining.md) | ผลด้าน Save ที่ให้เล่นต่อเซฟเก่าแบบตรงตัว | D8 |
| [Remediation contract §4](../proposals/sprint-05-planning/02-adr022-remediation-contract.md) | ข้อ 2 และ 4 (รับและเล่นต่อเซฟเก่าแบบอ่านอย่างเดียว) และ §4.1 | D7 · D8 |
| [CR-0006 §3](../rfc/CR-0006-sprint-05-complete-story-and-package-boundaries.md) | แถวการเล่นต่อเซฟเก่าในตาราง | D8 |
| Sprint 5 SSOT 0.2.0 §3.2 | แถวเซฟเก่าในตาราง admission และ snapshot เฉพาะ Act 4/5 | SSOT 0.3.0 · D7 · D8 |

**ที่คงไว้:** ADR-P0-013 (validator ของตัวเอง) · ADR-P0-014 (Resume ต้อง idempotent และขอความยินยอมก่อนเขียนทับ ใช้กับ journey profile) · ADR-P0-015 (Audio port) · ADR-P0-016 (3D viewer แบบเปิดเมื่อต้องการ) · ADR-P0-019 · ADR-P0-020 · ADR-P0-021 (มาตรฐาน anti-slop) · ADR-P0-022 (UI · Save Format 2 · 4 slices) · ADR-P0-023 · ADR-P0-025 · ADR-P0-032 v2.0 · ADR-P0-033

## 4. ทางเลือกที่พิจารณาแล้ว (Alternatives Considered)

| ทางเลือก | ผล | เหตุผล |
|---|---|---|
| ขยาย `choice-transaction` เดิมให้รองรับห้าองก์ | ไม่เลือก | โมเดล 0–100 และ crisis/GameOver คนละความหมายกับกติกาใหม่ จะได้ engine เดียวที่มีสองความหมาย |
| Save Format 3 | ไม่เลือก | ADR-P0-022 ยกเลิกแล้ว ตัวแยก profile ใน Format 2 เพียงพอ |
| บันทึกเฉพาะที่ขอบโหนด และเริ่มศึกใหม่เมื่อโหลด | ไม่เลือก | โหลดใหม่กลายเป็นปุ่มย้อนผล และเสียเทิร์นที่เล่นไปแล้ว |
| เขียน JSON เนื้อหาด้วยมือ | ไม่เลือก | ข้อความเพี้ยนจากพิมพ์เขียว ขัด UX §0 ข้อ 7 |
| คงการเล่นต่อเซฟเก่า | ไม่เลือก | มติ PO Q3 และ `main` ไม่เคย release |
| ย้ายเซฟเก่าไป key ใหม่ก่อนเขียน | ไม่เลือก | การคัดลอกเพิ่มความเสี่ยงโดยไม่ได้ประโยชน์ แยก namespace ปลอดภัยกว่าและย้อนกลับได้ |
| ใช้ framework สำหรับต้นแบบ | ไม่เลือก | ขัด Vanilla baseline และต้องมี build step |

## 5. การตรวจพิสูจน์ (Verification)

| รหัส | พิสูจน์ |
|---|---|
| `TC-S5-CLASH-001` | parity ทุกก้าวกับ engine เดิม · ปฏิเสธการกระทำผิดกติกาด้วย error code · ผลลัพธ์ถูก freeze และ input ไม่เปลี่ยน |
| `TC-S5-TRAY-001` | ความจุของสี่กลุ่มในทุกตำแหน่งศึกที่เกิดได้ · พฤติกรรมแท็บตาม UX §3.3 |
| `TC-S5-CONTENT-001` | drift gate ของ compiler · receipt ของข้อความทุกบรรทัด · คำศัพท์ที่ไม่รู้จักถูกปฏิเสธ |
| `TC-S5-STATE-001` · `TC-S5-ENDING-001` | กติกา D3 ทั้งหมด · ตารางความจริงของฉากจบและ Safety Fallback |
| `TC-S5-SCHEMA-001` · `TC-S5-SAVE-001` · `TC-S5-SAVE-002` · `TC-S5-REPLAY-001` | schema 3.0.0 ทั้งบวกและลบ · บันทึกทุก commit · กลับมาเล่นต่อกลางศึกตรงจังหวะ · snapshot ห้าองก์ · completion ไม่ถูกย้อน · ไม่เกิน 250 KB |
| `TC-S5-LEGACY-001` | ไบต์ใน namespace เดิมเหมือนเดิมทุกไบต์หลังเล่น Journey · ข้อความแจ้งขึ้นครั้งเดียว · แอปเก่ายังเปิดเซฟเดิมได้ |
| `TC-S5-PROTO-001` | PO เล่น Act 1 ต้นแบบได้จบบนเบราว์เซอร์จริง · harness ตรวจงานแสดง 13 จอจาก engine · ต้นแบบผ่านเกณฑ์ UX §9 ที่ทำอัตโนมัติได้ |

## 6. Migration และ Rollback

- **ผู้เล่น:** ไม่มี migration ตาม D8 · เซฟเก่าอยู่ที่เดิมทุกไบต์
- **ย้อนกลับ:** revert งานของ branch นี้ · แอปเก่าอ่าน namespace เดิมได้ทันทีเพราะไม่ถูกแตะ · ข้อมูล journey อยู่คนละ key จึงไม่ชนกัน
- **เอกสาร:** ADR นี้ไม่แก้ไบต์ของ ADR ใด การเปลี่ยนความหมายบันทึกในตาราง §3

---

**เสนอโดย:** Claude Opus 5.5 · Supreme Core Architect & Lead Game Systems Engineer (2026-10-31)

**ลงนามรับรอง (รอ):**
- [ ] **Theerapat (`T3thr`)** · Creator & Product Owner
- [ ] **Antigravity** · Founding Technical Partner & Lead System Architect
