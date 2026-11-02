# Change Record: C1 ช่วงแรก · Journey schema 3.0.0 · catalog · fixture · Ajv parity · ทะเบียน assertion

- **รหัสบันทึก (Record ID):** CR-20261102-1015
- **วันและเวลา (Timestamp):** 2026-11-02T10:15:00+07:00
- **รอบการพัฒนา (Sprint/Milestone):** Sprint 5 · Slice 1 checkpoint C1 (T1) ช่วงแรก
- **ผู้ปฏิบัติงาน (Operator/Persona):** Claude Opus 5.5 · Supreme Core Architect & Lead Game Systems Engineer
- **สถานะ (Status):** In-Progress · T1 ยังไม่ครบ (compiler · สเปกกลไกของ Act 1 · fixture สองแพ็กเกจ) · รอ Antigravity ตรวจ schema

---

## 1. วัตถุประสงค์และคำสั่ง (Prompt Objective & Request)

PO ลงนาม ADR-P0-034 และสั่งเริ่ม C1 ทันที (CR-20261102-1000) · ช่วงนี้ส่งมอบสัญญาข้อมูลของ T1 ส่วนแรก: schema 3.0.0 ของ journey package และ Save 2 journey profile พร้อม validator ของโครงการ fixture และการตรวจอิสระ

## 2. ข้อกำหนดที่ได้รับผลกระทบ (Traceability & Requirement IDs)

- **ADRs:** ADR-P0-034 D2 D4 D6 D7 · ADR-P0-013 · ADR-P0-020
- **Sprint 5 WBS:** T1 กำลังทำ (ไม่ติ๊ก) · T0 ทะเบียน assertion เริ่มแล้ว
- **Verification IDs:** `TC-S5-SCHEMA-001` · `TC-S5-CONTENT-001` (ครอบคลุมคำศัพท์) · `TC-S5-SAVE-001` · `TC-S5-SAVE-002` (เพดาน 250 KB) · `TC-S5-PACKAGE-001` · `TC-S5-STATE-001` (กติกา Core)

## 3. สิ่งที่ทำและรายการไฟล์ที่เปลี่ยนแปลง (Manifest of Changes)

### 3.1 ไฟล์ที่สร้างใหม่ (Created)

- `specs/schemas/v3.0.0/journey-common.schema.json`: นิยามร่วม · effect 13 คำ (`meter.set` `meter.add` `meter.spend` `meter.hazard` `floor.rest` `bond.add` `flag.set` `pick.major` `pick.route` `pick.plan` `item.grant` `item.release` `item.ready`) · condition 11 ชนิด · ค่าสถานะ 0–5 · สายใยสามเส้น 0–4 · เวทีห้าตำแหน่ง · กระเป๋าสี่ช่อง · annotation การอ้างอิงเจ็ดชนิดให้ admission ตรวจต่อ
- `specs/schemas/v3.0.0/journey-package.schema.json`: แพ็กเกจแปดชนิดโหนดแบบ object ปิด · ด่านต้องมีทางฝืนเอา · วิธีผ่านด่านเก้าแบบ · ยกศึกอ้างเจตนาและการกระทำของ Core เท่านั้น · ฉากจบสามทางพร้อมเหตุผลของด้ายที่ยังล็อกเก้าแบบ
- `specs/schemas/v3.0.0/journey-save.schema.json`: Save Format 2 profile `journey-1` · ผูก package id เวอร์ชัน digest · cursor เชิงความหมาย · สถานะศึกและแคมป์ · snapshot ต้นองก์ ≤ 5 · ประวัติฉากจบแยก · ไม่มี RNG · ตั้งค่าใหม่ (ป้ายแก้ทาง · สัมผัสอัตโนมัติ · ความเข้มแสง)
- `src/data/validation/journey-schema-catalog.js`: catalog ที่ freeze แล้วสำหรับ runtime (สร้างด้วยเครื่องมือ ห้ามแก้มือ)
- `tools/README.md` · `tools/schema/build-journey-catalog.mjs`: โฟลเดอร์เครื่องมือตอนพัฒนา และตัวสร้าง catalog พร้อมโหมด `--check`
- `tests/fixtures/journey/mini-journey.json`: แพ็กเกจจิ๋ว 14 โหนดที่ใช้คำศัพท์ทุกคำ · `tests/fixtures/journey/journey-save.json`: เซฟที่กำลังอยู่กลางศึก R1
- `tests/helpers/journey-schema-cases.js`: กรณีผิดของแพ็กเกจ 51 แบบ และของเซฟ 28 แบบ · ตัวสร้างเซฟที่ใหญ่ที่สุดที่ schema ยอม · ตัวเก็บคำศัพท์ที่ใช้จริง
- `tests/unit/journey-schema.test.js`: 86 เทสต์ · `tests/unit/architecture.test.js`: 2 เทสต์
- `tests/schema/journey-reference.mjs`: ตรวจด้วย Ajv อิสระว่าให้ผลตรงกับ validator ของโครงการทุกกรณี
- `docs/traceability/sprint-05-superseded-assertions.md`: ทะเบียน assertion ที่ถูกแทนที่ (ยังไม่ลบเทสต์ใด)
- `docs/changelog/2026-11/2026-11-02-1015-c1-schema-3-0-0-and-superseded-register.md`: บันทึกนี้

### 3.2 ไฟล์ที่แก้ไข (Modified)

- `specs/README.md`: เพิ่มสาม schema และวิธีตรวจ · `docs/README.md`: เพิ่ม `tools/` ในแผนที่ · `docs/traceability/README.md` และ `sprint-05-execution-matrix.md` §5: ลิงก์ทะเบียน
- `docs/sprints/sprint-05-ssot.md` §7 · `docs/dialogue/sprint-05/core-architect-notebook.md` · `docs/dialogue/sprint-05/BOARD.md` (`[S5-006]`) · `CHANGELOG.md`

### 3.3 ไฟล์ที่ลบ (Deleted)

- ไม่มี

## 4. ผลการทดสอบและการตรวจรับ (Verification & Quality Evidence)

| คำสั่ง | ผล |
|---|---|
| `node --test 'tests/unit/**/*.test.js'` | 1,148/1,148 ผ่าน (เดิม 1,060 + ใหม่ 88) |
| `node tests/docs/check-doc-links.mjs` | ผ่าน ไม่มีลิงก์เสีย |
| `node tools/schema/build-journey-catalog.mjs --check` | catalog ตรงกับ schema ต้นทาง |
| `JKB_AJV_PATH=… node tests/schema/journey-reference.mjs` (Ajv 8.17.1 ใน scratchpad ไม่ใช่ dependency ของโครงการ) | schema ทั้งสามผ่าน metaschema Draft 2020-12 · 82 กรณีให้ผลตรงกันระหว่าง Ajv กับ validator ของโครงการ |
| `pouch-reference.mjs` · `narrative-reference.mjs` · `presentation-reference.mjs` · `closeout-reference.mjs` ด้วย Ajv เดียวกัน | PASS ทั้งสี่ (รันครั้งแรกตั้งแต่ Sprint 4) |
| เซฟที่ใหญ่ที่สุดที่ schema ยอม | 166,483 ไบต์ ไม่เกิน 250 KB จึงพิสูจน์เพดานจากขอบเขตของ schema เอง |

กรณีผิดทุกกรณีล้มที่ path ที่ตั้งใจ ยกเว้นกรณีของ union `encounter` ที่ validator เดิมรายงานที่ระดับ union ซึ่งเป็นพฤติกรรมเดิมของ validator

## 5. ความเสี่ยงและสิ่งที่ต้องทำต่อ (Risks & Next Steps)

1. **Antigravity ตรวจ schema** ก่อน merge writer ของเซฟ (S5-006) · schema 3.0.0 ยังเปลี่ยนได้จนตรึงที่ T19
2. **ต่อใน C1:** compiler ของพิมพ์เขียว · สเปกกลไกของ Act 1 · drift gate · fixture สองแพ็กเกจเวอร์ชันเดียวกัน
3. **ข้อจำกัดของ validator เดิม:** ไม่รองรับ `type` แบบ array และ `format: date-time` จึงใช้ `oneOf` กับ null และ `pattern` แทน · การตรวจวันที่ตามปฏิทินจริงอยู่ใน validator ของเซฟใน T3
