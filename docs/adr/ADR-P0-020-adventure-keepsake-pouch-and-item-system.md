> **[STATUS AS OF 2026-10-29: ACTIVE SYSTEM CONTRACT — ITEM REGISTRY UPDATED BY ADR-P0-032]**
> อนุมัติโดย PO & Antigravity: คงสถาปัตยกรรม **กระเป๋าของสะสม 4 ช่องคงที่ (`collect`, `replace`, `use`, `refuse → memory`)** ส่วนรายชื่อไอเทมในเนื้อเรื่องใหม่ให้เป็นไปตามที่ออกแบบภายใต้ [ADR-P0-032](./ADR-P0-032-living-fantasy-canon-peuak-miracle-doll-and-vn-stage-blocking.md)

# ADR-P0-020: Adventure Keepsake Pouch Architecture, Four-Slot Capacity, and Interactive Item Lifecycle

Status: **Accepted — binding architectural contract for Sprint 4 Slice 2 (T0, T3, T4, T5 / PR #14)**

Date: 2026-10-16. Authority: **PO Directive & Lead Architecture Consensus**. Version: 1.0.0.

---

## 1. Context & Motivation

ในมิติด้านการเล่าเรื่องและประสบการณ์ของผู้เล่น เกม JaoKob ถูกออกแบบมาเพื่อสร้างสายใยความผูกพัน (Bond & Emotional Attachment) ที่อ่อนโยนและลึกซึ้ง โดยจำลองความผูกพันระหว่างผู้เล่น (ตัวแทนความรู้สึกของแฟนสาว) กับเจ้ากบ ผ่านสิ่งของชิ้นเล็กๆ ที่พบเจอระหว่างการผจญภัย

เดิมทีในเอกสารข้อเสนอ [CR-0005](../rfc/CR-0005-sprint-04-overhaul.md) ได้เปิดประเด็นทางเลือกระหว่างความจุกระเป๋า 3 ช่อง หรือ 4 ช่อง จากการพิจารณาร่วมกับ PO ได้มีมติชี้ขาดอย่างเป็นทางการว่า:
- โครงสร้างเรื่องราวของ JaoKob แบ่งออกเป็น **5 องก์ (5 Acts)**
- **Act 1 ถึง Act 4** เป็นช่วงการเดินทางและการเติบโต แต่ละองก์จะเปิดโอกาสให้เจ้ากบได้พบเจอ ผูกพัน และเลือกเก็บไอเทมที่เป็นตัวแทนความทรงจำในแต่ละช่วงวัยและบริบท (1 องก์ต่อ 1 ชิ้นหลัก)
- **Act 5** คือองก์แห่งบทสรุปและการตัดสินฉากจบ (Ending Resolver)
- การกำหนดให้กระเป๋าของเจ้ากบมีความจุ **4 ช่อง** พอดี จะเปิดโอกาสให้ผู้เล่นสามารถสะสมความทรงจำได้ครบทุกองก์การเดินทาง หรือสามารถเลือก "นำสิ่งของออกมาใช้" ในฉากสำคัญต่างๆ เพื่อเปิดเส้นทางเนื้อเรื่องใหม่ๆ หรือช่วยเหลือสิ่งมีชีวิตอื่น ซึ่งสะท้อนการตัดสินใจอย่างระมัดระวังและแสดงถึงความผูกพันกับสิ่งของอย่างแท้จริง

---

## 2. Decision

ที่ประชุม PO และ Lead Architecture กำหนดข้อกำหนดสถาปัตยกรรมสำหรับ Adventure Keepsake Pouch (กระเป๋าของสะสม) ดังต่อไปนี้:

### D1 — มติความจุกระเป๋า: 4 ช่องคงที่ (Fixed 4-Slot Capacity)
- ความจุสูงสุดของกระเป๋าถูกตรึงไว้ที่ **4 ช่องที่ไม่ซ้ำกัน (Exactly 4 Unique Slots)**
- ไม่มีระบบ Item Stacking, ไม่มีน้ำหนัก (Weight Limit), ไม่มีระบบ Level หรือค่าพลังโจมตี/ป้องกัน
- ไอเทมทุกชิ้นต้องมี Unique ID, ชื่อเรียกภาษาไทยที่อบอุ่น, ภาพ 2D ประกอบ, คำบรรยายความรู้สึก (Sensorial Description), และประเภทการใช้งาน (Keepsake Memory / Usable in Scene)

### D2 — บทบาทคู่ของไอเทม: ของสะสมผูกพัน และการนำมาใช้สร้างปฏิสัมพันธ์ (Dual Role: Keepsake & Diegetic Utility)
- **มิติด้านความทรงจำ (Keepsake / Memory):** ไอเทมแต่ละชิ้นสามารถกดเปิดดูในกระเป๋าเพื่ออ่านความทรงจำและปรัชญาคำสอนของแม่กบที่เชื่อมโยงกับสิ่งนั้น
- **มิติด้านการใช้งานและการเลือก (Diegetic Utility & Meaningful Agency):**
  - ในฉากสำคัญ (Crossroads / Encounters) หากเจ้ากบมีไอเทมที่เกี่ยวข้องติดตัว จะปลดล็อกตัวเลือกพิเศษ (Special Narrative Choice) เช่น การใช้ใบไม้บังฝน, การแบ่งหินน้ำค้าง, หรือการใช้เศษผ้าด้ายแดงผูกมิตร
  - การเลือกใช้ไอเทมอาจทำให้ไอเทมเปลี่ยนสถานะจาก "พกติดตัว (Held)" ไปเป็น "ส่งต่อ/ปล่อยวาง (Released)" ซึ่งเรื่องราวจะยังคงจดจำความดีงามนั้นไว้ในฐานะ "ความทรงจำที่ตราตรึง (Remembered Memory)" เสมอ โดยไม่ทำให้ผู้เล่นรู้สึกสูญเสียหรือถูกลงโทษ

### D3 — สถาปัตยกรรมโมเดลโดเมนบริสุทธิ์ (Pure Domain Model in `src/core/domain/keepsake-pouch.js`)
- ระบบกระเป๋าต้องถูกเขียนขึ้นเป็น Pure Deterministic JavaScript ใน `src/core/domain/keepsake-pouch.js`
- **กฎเหล็ก Clean Architecture:** ห้ามนำเข้า (Import) DOM, Web API, Browser Object หรือ LocalStorage เข้ามาในไฟล์นี้โดยเด็ดขาด ทุกการกระทำต้องรับ Snapshot ปัจจุบัน และคืนค่าเป็น Immutable State ก้อนใหม่
- ฟังก์ชันแกนหลักที่ต้องรองรับ:
  1. `createPouch(initialState)`: สร้างหรือฟื้นฟูกระเป๋าความจุ 4 ช่อง
  2. `collectItem(pouch, item)`: รับไอเทมเข้าช่องว่าง (ทำงานสำเร็จเมื่อช่องยังไม่เต็ม 4 ช่อง)
  3. `refuseItem(pouch, item)`: ตัดสินใจไม่เก็บไอเทม (บันทึกประวัติการพบเจอลงใน Memory Flag เพื่อใช้อ้างอิงในบทสนทนาต่อไป)
  4. `releaseItem(pouch, itemId)`: นำไอเทมออกจากกระเป๋า เปลี่ยนสถานะจาก `held` เป็น `released`
  5. `replaceItem(pouch, oldItemId, newItem)`: สลับไอเทมแบบ Atomic เมื่อกระเป๋าเต็ม 4 ช่อง
  6. `useItem(pouch, itemId)`: ส่งต่อหรือใช้ไอเทมในฉากตามข้อกำหนดเนื้อเรื่อง
- สถานะของไอเทมในระบบต้องแยกขาดจากกันอย่างชัดเจน:
  - `held`: พกอยู่ในกระเป๋าปัจจุบัน (มีสิทธิ์เลือกใช้ในฉาก)
  - `acquired`: เคยได้รับมาแล้วในอดีต (สถิติการเล่น)
  - `released`: เคยพกแต่เลือกปล่อยวางหรือส่งมอบให้ผู้อื่นไปแล้ว
  - `remembered`: เรื่องราวบันทึกการกระทำนั้นไว้ในความทรงจำ

### D4 — ข้อตกลงด้าน Schema และการอัปเกรดระบบบันทึก (Schema 2.0.0 & SaveFormatVersion 2)
- ประกาศ Schema ฉบับใหม่: `pouch.schema.json` ภายใต้เวอร์ชัน **2.0.0**
- ยกระดับ Save Format เป็น **SaveFormatVersion 2** โดยเพิ่มโครงสร้างข้อมูล:
  ```json
  {
    "pouch": {
      "capacity": 4,
      "held": ["item_leaf", "item_dew_stone"],
      "released": [],
      "memory": ["refused_lotus_shell"]
    }
  }
  ```
- **Semantic Migration Contract:** เขียนโมดูล Migration ที่แปลงไฟล์เซฟเดิมจาก Version 1 (Sprint 3 / Act 1 Prototype) ขึ้นสู่ Version 2 ได้อย่างไร้รอยต่อ โดยแปลงสถานะ `hasLeaf` เดิมให้กลายเป็นไอเทม `item_leaf` ในกระเป๋าโดยอัตโนมัติ ห้ามทำลายข้อมูลเดิมของผู้เล่น

### D5 — มาตรฐานการออกแบบหน้าต่างกระเป๋า (Pouch UI Specification)
- สร้าง Component `keepsake-pouch-dialog.js` ใน `src/ui/components/` โดยใช้ `createModalFrame` (ADR-P0-019) เป็นฐาน
- การจัดวางเป็นแบบ **ตาราง 4 ช่องสมมาตร (2x2 Grid หรือ 4-Column Responsive Grid)** ที่มีความสูงและระยะ Margin/Padding ตาม 8pt Grid System
- มีปุ่มปิดกากบาท (`✕`) ตรึงที่มุมบนขวา มี Focus Trap และรองรับการกดปุ่ม `Escape`
- แสดงความแตกต่างทางสายตาอย่างชัดเจนระหว่าง "ช่องว่าง (Empty Tactile Slot)" กับ "ช่องที่มีของสะสม (Occupied Keepsake Slot)"
- เมื่อคลิกที่ไอเทม จะแสดงหน้าต่างรายละเอียด (Item Inspection View) ประกอบด้วยชื่อ, รูปภาพ 2D, คำบรรยายความรู้สึก, และปุ่มกระทำ (ตรวจดู / วางลง / ปิด)

---

## 3. Scope of Slice 2 (Sprint 4 PR #14)

การส่งมอบ Slice 2 จะครอบคลุมเฉพาะงานด้านระบบกระเป๋าและสัญญาข้อมูล (Tasks T0, T3, T4, T5):
1. **T0:** ประกาศ ADR-P0-020 และปรับปรุงข้อกำหนดใน SSOT และ CR-0005
2. **T3:** สร้าง Schema 2.0.0, Fixtures ตรวจสอบความถูกต้อง, และโมดูล Semantic Migration สำหรับ Save 2
3. **T4:** พัฒนา Pure Domain `src/core/domain/keepsake-pouch.js` พร้อม Unit Test ครอบคลุม 100%
4. **T5:** พัฒนา UI Component `keepsake-pouch-dialog.js` และ Style Tokens สำหรับช่องกระเป๋า 4 ช่อง

*หมายเหตุ:* การเขียนบทสนทนาใหม่ของ Act 1 (Task T7) และระบบประวัติบทสนทนา (Task T6) จะอยู่ใน PR ถัดไปตามลำดับ

---

## 4. Consequences & Benefits

- **ประสบการณ์ผู้เล่น:** ผู้เล่นมีความผูกพันกับไอเทมที่เลือกเก็บในแต่ละ Act ชัดเจนขึ้น และสนุกกับการตัดสินใจใช้ไอเทมในแต่ละฉาก
- **ความปลอดภัยของระบบ:** สถาปัตยกรรมแยกส่วน Core Domain จาก UI และ Storage อย่างชัดเจน ทำให้ระบบมีความมั่นคงสูงและทดสอบได้ 100%
- **ความเข้ากันได้ย้อนหลัง:** ผู้เล่นที่มีเซฟเดิมสามารถเล่นต่อได้ทันทีผ่านระบบ Semantic Migration

---

## 5. Traceability

- ต่อยอดจาก: [CR-0005](../rfc/CR-0005-sprint-04-overhaul.md) (Sprint 4 Overhaul Plan)
- สอดคล้องกับ: [visual-novel-specification.md](../design-system/visual-novel-specification.md) (ADR-P0-019)
- เชื่อมโยงข้อกำหนด: `FR-CNT-001`, `FR-SAV-001/003/005`, `GDD-PROG-001/002`, `GDD-CHO-002/003`, `TC-S4-POUCH-001/002`, `TC-S4-CONTRACT-001`, `TC-S4-SAVE-001/002`
