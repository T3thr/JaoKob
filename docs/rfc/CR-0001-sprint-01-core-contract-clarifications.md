# Change Request CR-0001: Sprint 1 Core Contract Clarifications

สถานะ: Open with fail-safe Sprint 1 disposition

วันที่เปิด: 2026-09-01

ผู้เปิด: Lead Software Engineering and Quality Directorate

ผู้อนุมัติที่ต้องการ: Senior Software Architect, Principal Game Designer และ Data Contract Owner

## 1. บริบท

Sprint 1 Task 1 และ Task 2 นำ `FR-STA-002` ถึง `FR-STA-004`, `FR-ENG-001` ถึง `FR-ENG-003` และ `TR-001` ถึง `TR-020` มาสร้าง Core Domain, State Machine, Choice Transaction และ Port Contracts แบบ Pure ES Modules

การตรวจ Definition of Ready พบว่าพฤติกรรมหลักของ metrics และ state transitions มีข้อกำหนดเพียงพอ แต่มีรายละเอียดบางส่วนที่เอกสารและ machine-readable contract ยังไม่สามารถบังคับใช้ได้ครบโดยไม่สร้างความหมายใหม่

## 2. ประเด็นและการจัดการใน Sprint 1

### 2.1 Event vocabulary ของ Decision

State Diagram ใช้คำว่า `COMMIT_TO_CUTSCENE` และ `COMMIT_TO_EXPLORATION` ขณะที่ตาราง `TR-012` และ `TR-013` ใช้ `COMMIT_CHOICE`

Disposition สำหรับ Sprint 1: ใช้ตาราง Transition ID เป็น normative source ตามคำขอปัจจุบัน โดยใช้ event `COMMIT_CHOICE` และแยก transition ด้วย target facts ห้ามสร้าง event alias เพิ่มใน Domain State Machine

Follow-up: ปรับคำในแผนภาพผ่าน Owner Review โดยไม่เปลี่ยน Transition ID

### 2.2 ตำแหน่ง Unit Test

Sprint SSOT กล่าวถึง `tests/unit/core/` แต่คำขอปัจจุบันกำหนด `tests/unit/meters.test.js` และ `tests/unit/game-state.test.js`

Disposition สำหรับ Sprint 1: ใช้ `tests/unit/` ตามคำขอปัจจุบัน และเพิ่มไฟล์ทดสอบ Choice Transaction กับ Ports ในตำแหน่งเดียวกันเพื่อให้หลักฐานครบ

### 2.3 Flag semantics ที่ยังไม่มี machine-readable policy

`common.schema.json` อนุญาต `set-flag`, `adjust-flag` และ `clear-flag` แต่ `flagDefinition` ใน `content-package.schema.json` ยังไม่มีข้อมูลต่อไปนี้ที่ GDD กำหนด:

- allowed values สำหรับ enum
- minimum, maximum และ overflow policy สำหรับ counter
- marker classification และ monotonic policy
- reversible policy

Disposition สำหรับ Sprint 1:

1. `set-flag` ตรวจชนิดค่ากับ `flagDefinition.valueType`
2. `clear-flag` หมายถึงคืนค่า `defaultValue` ไม่ลบ entry และทำได้เมื่อ semantic policy ระบุว่า reversible
3. `adjust-flag` ทำได้เฉพาะ integer flag ที่มี semantic policy ระบุ minimum, maximum และ overflow behavior
4. เมื่อ policy ที่จำเป็นขาด Resolver ต้องคืน typed rejection และไม่เปลี่ยน snapshot
5. ห้าม hard-code Flag ID หรือกฎของ Flag เฉพาะตัวใน Engine Core

Open decision: เลือกว่าจะขยาย JSON Schema, เพิ่ม semantic registry ที่ versioned หรือห้าม effect ชนิดดังกล่าวใน content version แรก ก่อนเริ่ม generalized content production

### 2.4 Test runner และ Quality Gate

Repository ไม่มี package manifest, test script หรือ third-party runner เครื่องพัฒนาปัจจุบันมี Node.js 22 และ built-in `node:test`

Disposition สำหรับ Sprint 1: อนุญาตให้ใช้ built-in runner แบบคำสั่งตรงเพื่อสร้าง verification evidence โดยไม่ติดตั้ง dependency แต่ยังห้ามเรียกว่า repository-materialized `CORE-GATE` หรือ `STATE-GATE` จนกว่าจะมีคำสั่งมาตรฐานที่ได้รับอนุมัติและบันทึกใน governance

### 2.5 Port execution model

Architecture ระบุ behavior และ failure semantics ของ Ports แต่ยังไม่ตัดสินว่าทุก operation ต้อง synchronous หรือ asynchronous

Disposition สำหรับ Task 2: สร้าง structural contract และ composition-time validator เท่านั้น ไม่บังคับ execution model จนกว่า Task 3 จะทบทวน alternative persistence และ adapter contract

## 3. ผลกระทบ

- Architecture: ไม่เปลี่ยน dependency direction หรือ Port ownership
- Schema: ไม่มีการแก้ schema หรือ version ใน Change Request นี้
- Save compatibility: ไม่มี migration และไม่มี field ใหม่ใน SaveState
- Narrative: ไม่มีการเปลี่ยน Canon, Ending หรือ Stable ID
- Testing: ต้องพิสูจน์ typed rejection และ atomic rollback สำหรับ policy ที่ขาด

## 4. ความเสี่ยงและการควบคุม

| ความเสี่ยง | การควบคุม |
|---|---|
| Core เดาค่า counter bounds | บังคับ explicit semantic policy และ fail safely |
| Boolean default หายจาก flags array | `clear-flag` คืนค่า default และไม่ลบ entry |
| Event vocabulary กำกวม | ใช้ `TR-*` table เป็น normative ใน Sprint 1 |
| อ้าง Quality Gate เกินหลักฐาน | แยก direct test evidence ออกจาก materialized gate |
| Port ผูกกับ LocalStorage เร็วเกินไป | Contract ไม่เปิดเผย key หรือ Browser API |

## 5. Rollback

การเปลี่ยนแปลง Core ใน Sprint 1 ต้องย้อนกลับได้ด้วยการ revert feature branch โดยไม่แตะ Schema, Save Version หรือ Content ID หาก Open decision เปลี่ยน semantic policy ให้แก้ผ่าน CR หรือ RFC ใหม่ เพิ่ม contract test และประเมิน migration ก่อนนำ content ที่ใช้ effect ดังกล่าวเข้าสู่ release

## 6. Traceability

- `FR-STA-003`
- `FR-ENG-002`
- `FR-ENG-003`
- `NFR-MA-001`
- `NFR-MA-002`
- `NFR-MA-005`
- `GDD-FLG-002`
- `GDD-FLG-005`
- `TR-012`
- `TR-013`
