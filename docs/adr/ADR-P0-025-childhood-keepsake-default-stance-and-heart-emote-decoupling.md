> **[STATUS AS OF 2026-10-29: ACTIVE — APPROVED BY PO & ANTIGRAVITY]**
> มีผลบังคับใช้เต็มรูปแบบ: ระหว่างเล่นเกมใน Act 1–5 เจ้ากบต้องอยู่ในท่ามาตรฐานปกติ **ไม่ถือหัวใจสีแดง** (ท่าถือหัวใจเป็น Emote พิเศษใน 3D Viewer ตอนจบเกมเท่านั้น)

# ADR-P0-025: Childhood Keepsake Default Seated Stance Invariant and Heart-Holding Emote Decoupling

Status: **Accepted — binding 3D asset, lore, and visual specification (Amends and supersedes stance clause in ADR-P0-017)**

Date: 2026-10-18. Authority: **PO Directive (Theerapat), Lead System Architect (Antigravity), and Executive Narrative Director (mimo-v2.6-pro)**. Version: 1.0.0.

---

## 1. Context & Motivation

สืบเนื่องจากการผสานงาน PR #11 (`feat/spike-adult-plush-model`) เข้าสู่สายพัฒนาหลัก และการตรวจสอบสินทรัพย์ 3D ของเจ้ากบวัยเด็ก (Childhood Keepsake Model) ใน [docs/proposals/3d-keepsake-spike/evidence/childhood-preview-mobile.png](../proposals/3d-keepsake-spike/evidence/childhood-preview-mobile.png) และ `renders/childhood/` ในระหว่างการประชุมปรับปรุงเนื้อเรื่องและพิมพ์เขียวองก์ 1 บนกระดานสนทนากลาง [docs/dialogue/INTER-AGENT-DIALOGUE.md](../dialogue/INTER-AGENT-DIALOGUE.md) พบความคลาดเคลื่อนเชิงสัจจะที่ส่งผลกระทบต่อการเล่าเรื่องอย่างมีนัยสำคัญ:

1. **การอบท่ากอดหัวใจเป็นท่ามาตรฐานโดยไม่ได้ตั้งใจ (Accidental Baked Hugging Pose):**
   - ใน [ADR-P0-017](ADR-P0-017-childhood-accessory-export.md) เดิมได้กำหนดให้อุปกรณ์เสริมหัวใจสีแดง (`Accessory_RedHeart`) เป็นชิ้นส่วนเสริม (Optional Accessory) แยก Node จากตัวกบ แต่ในกระบวนการสร้างและ Export ของสคริปต์ `build_childhood_model.py` ได้รวมโมเดลและจัดท่าทาง (Pose) ของเจ้ากบวัยเด็กให้ **"ใช้มือทั้งสองข้างโอบกอดหัวใจสีแดงไว้ที่หน้าอกอย่างถาวร (Default Hugging Stance)"**
   - ความผิดพลาดในการผสานงาน PR #11 โดยไม่ได้ตรวจทานท่าทางมาตรฐาน ส่งผลให้ฝ่ายเล่าเรื่อง (Narrative Director) และสถาปัตยกรรมเข้าใจผิดว่า เจ้ากบวัยเด็ก "ต้องมีหัวใจสีแดงติดอยู่ที่หน้าอกตลอดเวลาตั้งแต่แรกเกิด" ซึ่งนำไปสู่การผูกปมเนื้อเรื่องที่บิดเบือนไปจากเจตนารมณ์แท้จริงของผู้สร้าง
2. **สัจจะท่าทางมาตรฐานที่แท้จริง (Authorial Truth for Default Stance):**
   - คุณ Theerapat (ผู้สร้างและ PO) ได้ตรวจสอบและชี้ขาดว่า:
     > *"เจ้ากบวัยเด็กโดยแท้จริงแล้ว ท่าทางเริ่มต้น (Default Stance) ต้องเป็น 'ท่านั่งมือเปล่าที่เป็นธรรมชาติ (Empty-handed Seated Stance)' เหมือนกับเจ้ากบวัยโตใน [poster.jpg](../proposals/3d-keepsake-spike/renders/poster.jpg) โดยไม่ได้ถือสิ่งใดไว้ติดตัว"*
     > *"การถือหัวใจสีแดง (`Accessory_RedHeart`) นั้น แท้จริงแล้วคือ 'ท่าทางเสริมทางอารมณ์ (Emote / Stance Variant)' ที่ผู้เล่นสามารถกดดูหรือสลับท่าทางได้ในหน้า Preview Viewer ไม่ใช่สรีระถาวรของตัวละคร"*
3. **สัจจะพื้นผิวตัวละคร (Surface Material Invariant):**
   - เจ้ากบวัยเด็กมีพื้นผิวมาตรฐานเป็น **ผ้ากำมะหยี่นุ่ม (Velour)** เช่นเดียวกับเจ้ากบวัยโต เพื่อรักษาความเป็นหนึ่งเดียวของตัวตน
   - พื้นผิวลายถักไหมพรม (Crochet Texture) ที่สร้างไว้เดิมใน PR #11 ให้คงไว้เป็น **โหมดพื้นผิวทางเลือก (Alternative Material Mode)** ในหน้า Viewer เพื่อเพิ่มลูกเล่นและความหลากหลาย ไม่ต้องลบทิ้ง

---

## 2. Decision

ที่ประชุม PO, Lead System Architect, และ Executive Narrative Director จึงมีมติกำหนด **ADR-P0-025** เพื่อแก้ไขและบังคับใช้สเปกสินทรัพย์ 3D และเนื้อเรื่อง ดังนี้:

### D1 — สัจจะท่าทางมาตรฐานวัยเด็ก: ท่านั่งมือเปล่า (Default Empty-Handed Seated Stance)
- **ท่ามาตรฐาน (Default Base Stance):** โมเดลเจ้ากบวัยเด็ก (`JaoKob_Childhood_Body`) ในสถานะเริ่มต้น (Idle/Default) ต้องเป็นท่านั่งพักผ่อนอย่างเป็นธรรมชาติ แขนและมือทั้งสองข้างวางข้างลำตัวหรือบนตักโดย **"ไม่ถือวัตถุใด ๆ (Empty Hands)"** สอดคล้องกับท่าทางของเจ้ากบวัยโตใน `renders/poster.jpg`
- **การแยกท่าทางถือหัวใจ (Heart-Holding Emote Decoupling):**
  - ท่าทางการกอดหรือถือหัวใจสีแดง (`Accessory_RedHeart`) ให้ถูกแยกออกเป็น **"Emote / Stance Variant"**
  - ในหน้าต่างพรีวิว (`preview/index.html`) และ 3D Model Viewer ต้องมีปุ่มหรือตัวเลือกให้ผู้ใช้สามารถกดสลับระหว่าง:
    1. **Default Stance:** ท่านั่งมือเปล่าตามธรรมชาติ
    2. **Heart Emote:** ท่าโอบกอดหัวใจสีแดง

### D2 — สัจจะพื้นผิววัสดุ: กำมะหยี่เป็นหลัก ไหมพรมเป็นทางเลือก (Velour Default & Crochet Option)
- **พื้นผิวหลัก (Default Material):** พื้นผิวเริ่มต้นของเจ้ากบวัยเด็กต้องเป็น **เนื้อผ้ากำมะหยี่นุ่ม (Velour)** สีเขียวโทนเดียวกับเจ้ากบวัยโต
- **พื้นผิวทางเลือก (Alternate Material):** พื้นผิวลายถักไหมพรม (Crochet Yarn Normal Texture) ที่พัฒนาไว้ใน PR #11 ให้เก็บรักษาไว้เป็นตัวเลือกสลับโหมดวัสดุ (Material Variant Toggle: `Velour` vs `Crochet`) ในหน้าพรีวิว เพื่อให้ผู้ใช้สามารถสัมผัสงานศิลปะทั้งสองรูปแบบได้

### D3 — การปลดแอกเนื้อเรื่ององก์ 1 (Narrative Act 1 Liberation)
- ให้ฝ่ายเล่าเรื่อง (Executive Narrative Director) ปรับปรุงบทและพิมพ์เขียวองก์ 1 ให้สอดคล้องกับ D1:
  - ในฉากเปิดเรื่อง (A1-001 ถึง A1-004) เจ้ากบวัยเด็กใช้ชีวิตในรังด้วยมือและเท้าที่เป็นอิสระ ไม่ได้มีหัวใจสีแดงผูกติดหรือกอดคาไว้ที่อก
  - ความผูกพันและสัมผัสความอบอุ่นยังคงถ่ายทอดผ่านการสัมผัสของครอบครัว รังอันอบอุ่น และความทรงจำ

### D4 — ข้อกำหนดการแก้ไขสินทรัพย์ 3D สำหรับ Senior Planning Architect (Asset Update Mandate)
- มอบหมายให้ **Senior Planning Architect (GPT-6 Astra / GPT-6.1 Sol)** ผู้สร้าง PR #11 ดำเนินการปรับปรุงไฟล์ใน `docs/proposals/3d-keepsake-spike/`:
  1. แก้ไขสคริปต์ `scripts/build_childhood_model.py` ให้สร้างโมเดล Default Stance มือเปล่า และแยก Emote ถือหัวใจ
  2. อัปเดตไฟล์ `model/jaokob-childhood-crochet.blend` และ Export `.glb` ชุดใหม่ที่รองรับทั้งสองท่าทางและสองเนื้อวัสดุ
  3. ปรับปรุงหน้า `preview/index.html` ให้มีปุ่มสลับ Stance (Default / Heart) และ Material (Velour / Crochet)
  4. ทำการเรนเดอร์ภาพมุมมองใหม่ใน `renders/childhood/` และบันทึกผลการวัดขนาดไฟล์/Triangles ลงใน `evidence/` ตามเกณฑ์งบประมาณเดิม

---

## 3. Consequences & Governance

1. **การแก้ไขข้อกำหนดเดิม:**
   - ADR-P0-025 นี้แก้ไขและแทนที่ (Amends and Supersedes) ข้อความใน [ADR-P0-017](ADR-P0-017-childhood-accessory-export.md) เฉพาะในส่วนที่ระบุว่า *"The default asset includes both (included in the default hugging pose)"* โดยเปลี่ยนเป็นสถาปัตยกรรม Decoupled Emote ตาม D1–D2
2. **ขอบเขตการแก้ไข:**
   - การแก้ไขจำกัดอยู่ภายในโฟลเดอร์ `docs/proposals/3d-keepsake-spike/` ไม่กระทบต่อ `src/core/` หรือ Save Format ใด ๆ
3. **การส่งต่องาน:**
   - PO จะส่งมอบ Prompt คำสั่งการแก้ไขสินทรัพย์ 3D ให้แก่ Senior AI ในเซสชันเดิม เพื่อปรับปรุงโมเดลให้สอดคล้องกับ ADR-P0-025 อย่างสมบูรณ์
