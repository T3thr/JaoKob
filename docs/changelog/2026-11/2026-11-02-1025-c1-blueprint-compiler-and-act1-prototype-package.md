# Change Record: C1 ช่วงสอง · compiler ของพิมพ์เขียว · สเปกกลไก · แพ็กเกจ Act 1 ต้นแบบ

- **รหัสบันทึก (Record ID):** CR-20261102-1025
- **วันและเวลา (Timestamp):** 2026-11-02T10:25:00+07:00
- **รอบการพัฒนา (Sprint/Milestone):** Sprint 5 · Slice 1 checkpoint C1 (T1) ช่วงสอง
- **ผู้ปฏิบัติงาน (Operator/Persona):** Claude Opus 5.5 · Supreme Core Architect & Lead Game Systems Engineer
- **สถานะ (Status):** In-Progress · T1 ทำครบทุกส่วนยกเว้นการพิสูจน์สองแพ็กเกจเวอร์ชันเดียวกัน (ต้องใช้ identity ของ T3) · รอ Antigravity ตรวจ schema จึงยังไม่ติ๊ก

---

## 1. วัตถุประสงค์และคำสั่ง (Prompt Objective & Request)

ต่อ C1 ตาม ADR-P0-034 D6: ทำ compiler ที่รวมพิมพ์เขียวรายองก์ (ถ้อยคำ) กับสเปกกลไก (กติกา) เป็นแพ็กเกจของเกม พร้อม drift gate และสเปกกลไกของ Act 1 สำหรับต้นแบบที่ PO และแฟนเล่นได้ใน C5

## 2. ข้อกำหนดที่ได้รับผลกระทบ (Traceability & Requirement IDs)

- **ADRs:** ADR-P0-034 D4 D5 D6 D10 · ADR-P0-032 D7 · UX/UI 2.0.0 §0 ข้อ 7
- **Sprint 5 WBS:** T1 กำลังทำ (ไม่ติ๊ก)
- **Verification IDs:** `TC-S5-CONTENT-001` · `TC-S5-CLASH-001` (ตารางยกศึก) · `TC-S5-SCHEMA-001`

## 3. สิ่งที่ทำและรายการไฟล์ที่เปลี่ยนแปลง (Manifest of Changes)

### 3.1 ไฟล์ที่สร้างใหม่ (Created)

- `tools/content/compile-journey.mjs`: compiler แบบ deterministic ที่ปฏิเสธทันทีเมื่อเจอผู้พูด แท็ก metadata โหมด หรือตัวเลือกที่ไม่ตรงสเปก · ตรวจ schema และการอ้างอิงทุกตัว · ตรวจขีดยาว emoji และความยาวของข้อความ · ทำงานกับแหล่งข้อมูลที่ฉีดเข้าได้เพื่อเทสต์
- `docs/design-system/mechanics/README.md` · `story.json` · `act1.json`: สเปกกลไกระดับเรื่องและของ Act 1
- `docs/design-system/mechanics/compile-report.json`: รายงานจาก compiler (สร้างอัตโนมัติ)
- `src/data/content/journey/README.md` · `story-jaokob-core.json` · `story-jaokob-core.receipts.json`: แพ็กเกจ Act 1 ต้นแบบ 13 โหนด 170 ข้อความ จบที่ทางเข้า Act 2 สองทาง และใบเสร็จต้นทางของทุกข้อความ
- `tests/unit/journey-content.test.js`: 18 เทสต์ (drift gate · ใบเสร็จตรงบรรทัดในพิมพ์เขียว · ชื่อมาตรฐานเท่ากับ engine · ยกศึกทั้งหกเท่ากับ engine · ลำดับโหนดเท่ากับแบบจำลองสมดุล · ข้อค้นพบ · กรณีที่ compiler ต้องล้ม 12 แบบ)
- `docs/changelog/2026-11/2026-11-02-1025-c1-blueprint-compiler-and-act1-prototype-package.md`: บันทึกนี้

### 3.2 ไฟล์ที่แก้ไข (Modified)

- `specs/schemas/v3.0.0/journey-package.schema.json`: เพิ่ม `lexicon` (ชื่อไทยมาตรฐานของเจตนาและการกระทำ) และ `boundaries` (ทางเข้าของเนื้อหาที่ยังไม่ promote ให้เซฟเล่นต่อได้เมื่อแพ็กเกจรุ่นถัดไปเพิ่มองก์) · catalog สร้างใหม่ · fixture เพิ่มทั้งสองส่วน
- `tests/helpers/journey-schema-cases.js`: กรณีผิดเพิ่มอีกสี่แบบ (รวมแพ็กเกจ 55 · เซฟ 28) · `tests/schema/journey-reference.mjs`: ตรวจแพ็กเกจที่คอมไพล์จริงด้วย Ajv
- `tools/README.md` · `docs/design-system/README.md`: ลงทะเบียน compiler และโฟลเดอร์ `mechanics/`
- `docs/sprints/sprint-05-ssot.md` §7 · `docs/dialogue/sprint-05/core-architect-notebook.md` · `docs/dialogue/sprint-05/BOARD.md` (`[S5-007]`) · `CHANGELOG.md`

### 3.3 ไฟล์ที่ลบ (Deleted)

- ไม่มี

## 4. ผลการทดสอบและการตรวจรับ (Verification & Quality Evidence)

| คำสั่ง | ผล |
|---|---|
| `node --test 'tests/unit/**/*.test.js'` | ผ่านทั้งหมด (จำนวนในหัวข้อ commit) |
| `node tests/docs/check-doc-links.mjs` | ผ่าน ไม่มีลิงก์เสีย |
| `node tools/content/compile-journey.mjs --check` · `node tools/schema/build-journey-catalog.mjs --check` | ผลที่ commit ตรงกับต้นทาง |
| `JKB_AJV_PATH=… node tests/schema/journey-reference.mjs` | 87 กรณีตรงกันระหว่าง Ajv กับ validator ของโครงการ รวมแพ็กเกจที่คอมไพล์จริง |

**ข้อค้นพบจาก compiler (รอผู้รับผิดชอบ):**
1. พิมพ์เขียว Act 1 อ้างภาพ 4 ID ที่ยังไม่มีใน asset manifest v2: `cg_act1_three_siblings_weir` (manifest มี `cg_act1_three_siblings_blue_shirt`) · `char_cockroach_man_boast_button` (manifest มี `char_cockroach_man_shadow_boast` และ `char_cockroach_man_stolen_button_left/right`) · `char_jao_kab_child_neutral` · `char_jao_kib_child_neutral` (NEW ในฟิสิกส์ v2 §8.2 ยังไม่ได้สร้าง) · ต้องให้ PO และ Astra ตัดสินว่าจะสร้างภาพหรือเทียบชื่อ (T7)
2. ตารางบรรทัดตอบสนองของ R1 (A1-08) ไม่มีบรรทัดของ `ฝืนรุก` ซึ่งปุ่มนี้ขึ้นได้เมื่อแรง ≤ 2 · ต้องเติมบทใน T6 ผ่านการตรวจภาษาไทย

## 5. ความเสี่ยงและสิ่งที่ต้องทำต่อ (Risks & Next Steps)

1. **ปิด T1:** รอ Antigravity เห็นชอบ schema · การพิสูจน์สองแพ็กเกจเวอร์ชันเดียวกันทำพร้อม composite identity ใน C3
2. **C2 ต่อไป:** ย้าย engine ศึกเข้า `src/core` แบบ kernel และ shell ผ่าน parity gate · domain ของการเดินทาง · obstacle camp micro pouch ending · play-mode
3. **ภาพที่หายไป** ทำให้ต้นแบบ C5 ต้องมีทางสำรองของภาพ (ADR-P0-034 D10) จนกว่า T7 จะแก้ทะเบียนภาพ
