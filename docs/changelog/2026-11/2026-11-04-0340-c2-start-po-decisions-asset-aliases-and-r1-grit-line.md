# Change Record: มติ PO 2026-11-04 · ภาพสำรองแบบ alias · บรรทัด `ฝืนรุก` ของ R1 · เริ่ม C2

- **รหัสบันทึก (Record ID):** CR-20261104-0340
- **วันและเวลา (Timestamp):** 2026-11-04T03:40:00+07:00
- **รอบการพัฒนา (Sprint/Milestone):** Sprint 5 · Slice 1 · ปิด checkpoint C1 และเริ่ม C2 (T2)
- **ผู้ปฏิบัติงาน (Operator/Persona):** Claude · Supreme Core Architect & Lead Game Systems Engineer
- **สถานะ (Status):** Completed · บันทึกมติและแก้ข้อค้นพบสองข้อของ C1 · งาน engine ของ C2 อยู่ในบันทึกถัดไป

---

## 1. วัตถุประสงค์และคำสั่ง (Prompt Objective & Request)

PO และ Antigravity ตรวจ commit `d586f46` แล้ว (unit 1,170/1,170 · ลิงก์ 2,448) และสั่งสี่ข้อ:

1. Antigravity ในฐานะ Lead System Architect เห็นชอบ schema 3.0.0 100% อนุญาตให้ merge writer ของเซฟ และปลด DoR ของ T1
2. ภาพสี่ชิ้นที่ยังไม่มีใน manifest v2 ให้ alias หรือใช้ภาพที่มีอยู่แล้วไปก่อน (เช่น `cg_act1_three_siblings_blue_shirt` และ `char_cockroach_man_shadow_boast`) Astra วาดภาพจริงใน Slice 2
3. ใส่บรรทัดตอบสนองสำรองที่เป็นธรรมชาติของ `ฝืนรุก` ใน R1 ไปก่อน แล้วเกลาสำนวนใน T6
4. เริ่ม checkpoint C2 (T2) เต็มกำลังบน `feat/sprint-05-slice-01-foundations`

## 2. ข้อกำหนดที่ได้รับผลกระทบ (Traceability & Requirement IDs)

- **ADRs:** ADR-P0-034 (ลายเซ็นของ Antigravity · D6 · D10) · ADR-P0-032 D7
- **Sprint 5 WBS:** T0 เสร็จ · T1 ส่งมอบและผ่านการตรวจ เหลือการพิสูจน์สองแพ็กเกจเวอร์ชันเดียวกันที่ย้ายไป C3 · T2 เริ่ม
- **Verification IDs:** `TC-S5-CONTENT-001` · `TC-S5-ASSET-001` (ภาพสำรองที่ตรวจได้)

## 3. สิ่งที่ทำและรายการไฟล์ที่เปลี่ยนแปลง (Manifest of Changes)

### 3.1 ไฟล์ที่สร้างใหม่ (Created)

- `docs/changelog/2026-11/2026-11-04-0340-c2-start-po-decisions-asset-aliases-and-r1-grit-line.md`: บันทึกนี้

### 3.2 ไฟล์ที่แก้ไข (Modified)

- `docs/adr/ADR-P0-034-…`: ลายเซ็นของ Antigravity `[x]` 2026-11-04 และบรรทัดสถานะ
- `docs/sprints/sprint-05-ssot.md`: §1.2 มติสี่ข้อ · §4.2 C1 ปิด · T0 `[x]` · สถานะของ T1 · §5.1 สองรายการ `[x]` · §7
- `docs/design-system/mechanics/story.json`: `assetAliases` สี่รายการ
- `tools/content/compile-journey.mjs`: ใช้ alias กับ `bg` `cg` และทุก slot · ล้มเมื่อภาพจริงเข้า manifest แล้วแต่ alias ยังอยู่ เมื่อเป้าหมายไม่มีใน manifest และเมื่อ alias ไม่มีโหนดใช้ · รายงาน `assetAliases` พร้อมโหนดที่ใช้
- `docs/design-system/act1-living-keepsake-rewrite-blueprint.md` 2.0.1: แถว `ฝืนรุก` ในตารางตอบสนองของ A1-08 พร้อมหมายเหตุว่าเป็นบรรทัดสำรองที่เกลาใน T6
- `src/data/content/journey/story-jaokob-core.json` · `story-jaokob-core.receipts.json` · `docs/design-system/mechanics/compile-report.json`: คอมไพล์ใหม่ (171 ข้อความ · ภาพที่ขาด 0 · คำเตือน 0)
- `tests/unit/journey-content.test.js`: ไม่มีข้อค้นพบค้าง · alias ตรงกับสี่ชิ้นที่ PO อนุญาตและชี้ภาพที่มีจริง · กรณีที่ต้องล้มเพิ่มสามแบบ (รวม 22 เทสต์)
- `docs/design-system/mechanics/README.md`: กติกาข้อ 6 ของ `assetAliases`
- `docs/dialogue/sprint-05/core-architect-notebook.md`: R19 R20 Q6 และบันทึกการตัดสินใจ · `docs/dialogue/sprint-05/BOARD.md` (`[S5-008]`) · `CHANGELOG.md`

### 3.3 ไฟล์ที่ลบ (Deleted)

- ไม่มี

## 4. ผลการทดสอบและการตรวจรับ (Verification & Quality Evidence)

| คำสั่ง | ผล |
|---|---|
| `node --test 'tests/unit/**/*.test.js'` | ผ่านทั้งหมด |
| `node tests/docs/check-doc-links.mjs` | ผ่าน ไม่มีลิงก์เสีย |
| `node tools/content/compile-journey.mjs --check` | ผลที่ commit ตรงกับต้นทาง |
| `JKB_AJV_PATH=… node tests/schema/journey-reference.mjs` | 87 กรณีตรงกันระหว่าง Ajv กับ validator ของโครงการ |
| `node docs/design-system/evidence/five-act-runtime-ledger.mjs` | ผ่าน · รวมห้าองก์ 44.4–45.9 นาที |

| ภาพตามแบบ | ภาพที่ใช้ไปก่อน | โหนด |
|---|---|---|
| `cg_act1_three_siblings_weir` | `cg_act1_three_siblings_blue_shirt` | A1-08 |
| `char_cockroach_man_boast_button` | `char_cockroach_man_shadow_boast` (ชื่อเดิมก่อนเปลี่ยนตามฟิสิกส์ v2 §8) | A1-07 · A1-08 |
| `char_jao_kab_child_neutral` | `char_jao_kab_neutral_proud` | A1-01 |
| `char_jao_kib_child_neutral` | `char_jao_kib_neutral_cheerful` (resolver เลือกภาพหันซ้ายตาม `facing`) | A1-01 |

## 5. ความเสี่ยงและสิ่งที่ต้องทำต่อ (Risks & Next Steps)

1. **ภาพวัยเด็กของกับและกิบ** ใช้ภาพวัยหนุ่มสาวไปก่อน ผู้เล่นต้นแบบจะเห็นต่างจากบท จนกว่า Astra ส่งภาพจริงใน Slice 2
2. **บรรทัด `ฝืนรุก`** ยังไม่ผ่านการตรวจภาษาโดยมนุษย์ (T6)
3. **C2 ต่อไป:** clash kernel และ shell ผ่าน parity gate · journey domain · encounters · journey-session · play-mode · เครื่องมือพิสูจน์ import จาก core
