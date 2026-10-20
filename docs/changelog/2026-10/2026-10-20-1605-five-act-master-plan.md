# Change Record: The Grand Five-Act Narrative & Gameplay Master Plan

- **รหัสบันทึก (Record ID):** CR-20261020-1605
- **วันและเวลา (Timestamp):** 2026-10-20T16:05:00+07:00
- **รอบการพัฒนา (Sprint/Milestone):** Sprint 5 Planning / Narrative Architecture
- **ผู้ปฏิบัติงาน (Operator/Persona):** Claude (Supreme Narrative Architect & Master Cinematic Screenplay Dramaturge) · Anthropic Claude Opus 5.5 ผ่าน Claude Code · Session `f3477f70-4ebe-4237-9871-91d5b0e1c1b6`
- **สถานะ (Status):** Completed (เอกสารส่งมอบเพื่อ PO ตรวจรับ · ยังไม่ใช่ implementation)

---

## 1. วัตถุประสงค์และคำสั่ง (Prompt Objective & Request)

PO Theerapat และ Antigravity อนุมัติสารเปิดตัวของ Supreme Narrative Architect พร้อมคำตัดสิน 6 ข้อ (PO-D1 ถึง PO-D6), หมุดความจริงจากชีวิตจริง และมติทางเทคนิค 4.1–4.5 แล้วสั่งให้ส่งมอบ "มหาพิมพ์เขียวสถาปัตยกรรมบทและระบบเกม 5 องก์" ในรอบนี้ ประกอบด้วย
1. ผังผสานระบบ Items · Status · Bond กับเนื้อเรื่องทีละองก์
2. รายละเอียดฉากแมลงสาบแมนใน Act 2 ในฐานะก้าวแรกของเจ้ากบผู้พิทักษ์
3. ร่างฉาก Climax และสามฉากจบใน Act 5 พร้อม Poetic Mirror ของเสียงหัวใจ
4. สรุป Motif Ledger (ด้ายแดง · กลิ่นแดด · ฝนที่พบกัน · ความมืด)

## 2. ข้อกำหนดที่ได้รับผลกระทบ (Traceability & Requirement IDs)

- **ADRs:** ADR-P0-030 (D1–D3), ADR-P0-029 (ขอบเขตตามมติ Antigravity 4.3), ADR-P0-028 (D2, D4, D6), ADR-P0-027 (D1, D4), ADR-P0-026 (D1, D2), ADR-P0-024 (D1, D3), ADR-P0-021 (D1, D2, D4, D6), ADR-P0-020 (D1–D3)
- **Requirement IDs:** NAR-CAN-002, NAR-CON-001..010, NAR-BRN-001..004, GDD-END-001..006, GDD-BAL-001..009 (ผ่านงาน T6/T8/T10/T12 ของ Sprint 5 SSOT)
- **คำตัดสินที่บันทึกไว้ในเอกสาร:** PO-D1..D6, AG-4.2, AG-4.3, Lore Anchors LA-01..LA-08
- **ข้อเสนอที่ยังต้องรับรอง:** ADR-P0-031 (รายการใน §9.1 ของเอกสารส่งมอบ)

## 3. สิ่งที่ทำและรายการไฟล์ที่เปลี่ยนแปลง (Manifest of Changes)

### 3.1 ไฟล์ที่สร้างใหม่ (Created)
- `docs/design-system/five-act-narrative-gameplay-master-plan.md` (`JKB-ND-MASTER` 1.0.0): แกนเรื่อง "บ้านคือใคร" และความเข้าใจผิดของเจ้ากบ, ลำดับความจริงของคืนพายุ, ภูมิศาสตร์, สัญญาระบบเกม (Status bands, ประตูความกล้า, Memory Willpower, Grace Beat, Item Bible และเส้นเวลากระเป๋า 4 ช่อง, Bond หน่วยเดียว 0–100, กฎสี่กุญแจ), ผังผสานระบบ Act 1–5 พร้อมฉากหมุด, ฉากแมลงสาบแมน, Act 5 Climax และสามฉากจบ, "คืนนั้นของเธอ", Motif Ledger, Voice Bible, Runtime Ledger, ข้อเสนอ ADR-P0-031, สัญญาข้อมูล, ลำดับงานของ mimo และคำสั่งงานภาพ
- `docs/changelog/2026-10/2026-10-20-1605-five-act-master-plan.md`: บันทึกนี้

### 3.2 ไฟล์ที่แก้ไข (Modified)
- `CHANGELOG.md`: เพิ่มสรุปหนึ่งบรรทัดใต้ `[Unreleased]`
- `docs/sprints/sprint-05-ssot.md`: เพิ่มแถว CR-20261020-1605 ในตาราง Record ของ §7 เท่านั้น ไม่ได้แก้ส่วนอื่น เพราะ Antigravity รับงานยกระดับเป็น v0.3 (มติ 4.1)

### 3.3 ไฟล์ที่ลบ (Deleted)
- ไม่มี พิมพ์เขียว Act 1–4 ฉบับเดิมคงไว้ตามเดิม และจะถูกแก้เป็น revision ใหม่ตาม §9.3 ของเอกสารส่งมอบ

## 4. ผลการทดสอบและการตรวจรับ (Verification & Quality Evidence)

- **Game regression:** `node --test tests/unit/*.test.js tests/unit/**/*.test.js` → **1,060 passed, 0 failed, 0 skipped** (17.7s) งานรอบนี้เป็นเอกสารล้วน ผลนี้ยืนยันว่าไม่มีผลกระทบต่อระบบ
- **Language hygiene (ADR-P0-029 D1):** สแกนเอกสารส่งมอบแล้วพบคำต้องห้ามและคำศัพท์วัสดุ 3D เป็นศูนย์ทุกคำ
- **Terminology (PO-D3):** ไม่พบคำว่า "เสื้อกั๊ก" หรือ "ปกเสื้อ" ในเอกสารส่งมอบ
- **ยังไม่ได้ตรวจ:** schema และ referential integrity ของ flag/ID ใหม่ (ยังไม่มี content package), การวัดเวลาอ่านจริง (รอ Act 1 rev.0.8), การตรวจภาษาไทยโดย PO

## 5. ข้อสังเกตและความเสี่ยง (Notes & Risks)

- Message #023 และการลงทะเบียน Claude ใน `AGENT-REGISTRY.md` ที่ PO แจ้งว่า Antigravity บันทึกไว้แล้ว ยังไม่พบในสาขาใดทั้งบนเครื่องและบน remote (ตรวจเมื่อ 2026-10-20 15:46) บันทึกนี้จึงไม่ได้แตะสองไฟล์ดังกล่าว เพื่อไม่ให้ชนกับงานของ Antigravity ที่อาจยังไม่ได้บันทึก
- คลังนี้เป็นสาธารณะ หมุดความจริงจากชีวิตจริงจึงถูกบันทึกในฐานะ canon ของตัวละครในเรื่องเท่านั้น
- เป้าเวลาเล่นรวม 72–84 นาทีต่างจาก ~50–60 นาทีใน CR-20261020-1345 ต้องให้ PO ตัดสิน
- Migration: ไม่มี · Rollback: revert commit เอกสารนี้ได้โดยไม่กระทบ runtime หรือ save

## 6. ขั้นถัดไป (Next Steps)

1. PO ตรวจรับเอกสารและตอบรายการใน §10
2. Antigravity ออก ADR-P0-031 และ Sprint 5 SSOT v0.3
3. mimo เริ่ม Act 1 rev.0.8 ตาม §9.3 โดยผ่านด่านตรวจของ Supreme Architect
