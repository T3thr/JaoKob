# Change Record: C5a · หน้าจอศึกจริง · ป้ายเจตนา · เกจแสงเงา · ถาดการ์ดแบบแท็บ · สามจังหวะ

- **รหัสบันทึก (Record ID):** CR-20261108-0700
- **วันและเวลา (Timestamp):** 2026-11-08T07:00:00+07:00
- **รอบการพัฒนา (Sprint/Milestone):** Sprint 5 · Slice 1 · checkpoint C5 (T5) งานย่อย C5a
- **ผู้ปฏิบัติงาน (Operator/Persona):** Claude · Supreme Core Architect & Lead Game Systems Engineer
- **สถานะ (Status):** Completed (C5a) · T5 กำลังทำ · ถัดไป C5b

---

## 1. วัตถุประสงค์และคำสั่ง (Prompt Objective & Request)

PO สั่งให้เข้า C5 ทันทีหลังปิด C4 ([CR-20261108-0630](2026-11-08-0630-c4-closed-po-review-settings-button-contrast-and-browser-evidence.md)) โดยประกอบฉากปะทะ แคมป์ เหตุการณ์ย่อย และแผงกระเป๋ากับตั้งค่าของจริงเข้าแทนปุ่มข้ามชั่วคราวในองก์ 1 ตาม UX §3–§7 · รอบนี้ทำ C5a (ศึก) ตามลำดับในสมุดสถาปนิก §3

## 2. ข้อกำหนดที่ได้รับผลกระทบ (Traceability & Requirement IDs)

- **ADRs:** ADR-P0-033 D1 (ศึกแสงปะทะเงา) · ADR-P0-034 D9.2 (ป้ายคำนวณใน Core) · D9.3 (arm ผูก revision · แท็บเป็นสถานะ UI) · D9.4 (ถาดสี่กลุ่ม) · D10
- **สัญญาออกแบบ:** UX §1.3 · §1.8 · §3.1 · §3.3 · §3.4 · §3.5 · §3.6 (รัศมีแสงของยกที่ไม่มีผนัง) · §3.8 · §8.4 · พิมพ์เขียว Act 1 (CG หลังศึก A1-08)
- **Sprint 5 WBS:** T5 กำลังทำ
- **Verification IDs:** `TC-S5-TRAY-001` (ส่วน UI) · `TC-S5-INLINE-001` · `TC-S5-A11Y-001`

## 3. สิ่งที่ทำและรายการไฟล์ที่เปลี่ยนแปลง (Manifest of Changes)

### 3.1 ไฟล์ที่สร้างใหม่ (Created)

- `src/ui/journey/components/clash-intent-gauge.js`: `ClashIntentAndGauge` · ป้ายเจตนากระจกฝ้าสีม่วงพร้อม `ไม่มีผล` `เหลือครึ่ง` `แรงเป็นสองเท่า` และ `แก้ทางแล้ว` ในจังหวะผล · เจตนาถัดไปหลังตั้งสติฟังฝน · เกจ 10 ช่อง ช่องแสงมีลายรัศมี ช่องเงามีลายควัน เส้นประที่จุดยันไว้ได้ · หยดนับเทิร์น · ชื่อสำหรับโปรแกรมอ่านหน้าจอเป็นคำ
- `src/ui/journey/components/clash-action-tray.js`: `ClashActionTray` · แถวท่าหลักกับสามกลุ่มเป็น ARIA tabs บนตาราง 2 × 3 ที่จองสามแถวเสมอ · roving tabindex ลูกศร Home End · จุดทอง ระลอกฟ้า ฝีเข็มทองบนแท็บ · กลุ่มเดียว (R1) มีแค่หัวกลุ่ม · จอกว้างเป็นคอลัมน์ทุกกลุ่ม · ไม่สลับแท็บแทนผู้เล่น
- `tests/unit/journey-clash-tray.test.js` (5)
- `docs/changelog/2026-11/2026-11-08-0700-c5a-clash-screen-intent-gauge-tabbed-tray.md`: บันทึกนี้

### 3.2 ไฟล์ที่แก้ไข (Modified)

- `src/core/use-cases/journey-session.js`: view ของศึกมี `gauge` (`max` · `holdAt` จากกติกา) และ `lightSource` · จังหวะผลมี `resolved.answered` (การ์ดที่เลือกแก้เจตนาของเทิร์นนั้นหรือไม่ ด้วย `answersIntent` ของ Core) · UI จึงไม่ต้องคิดเอง
- `src/data/content/journey-presentation.js`: `model.clash` (จังหวะ เทิร์น แสง ป้ายเจตนา หมายเหตุ เจตนาถัดไป กลุ่มการ์ดพร้อมเครื่องหมาย ผล และประโยคสำหรับจังหวะเลือก) · การ์ดศึกมีป้ายไม่เกินสองป้าย (`แก้ทาง` ตามตั้งค่า `counterTags` · `ซ้ำ` · `ท่าปิดศึก` · `ท่าผสาน`) · ไอคอนตาม UX §8.4 หน้าพี่น้องและสหายจากภาพตัวละคร · การ์ดทุกแบบใช้ `tags` เป็นรายการและ `art` (ไอคอน ของ หน้า) · ศึกไม่เป็น `pending` แล้ว · CG ของโหนดศึกแสดงในบรรทัดหลังศึก
- `src/data/localization/th-journey.js`: คำของกลุ่มถาดและของศึก (ป้ายเจตนาตามจอ 3–4 ของ v3 · ผลของศึกไม่มีคำว่าแพ้)
- `src/ui/journey/components/tactile-action-card.js`: ภาพบนการ์ดเป็นไอคอน ของ หน้า หรือของคู่หน้าสหาย · ป้ายสองช่องจากรายการ · ปุ่มลัดเฉพาะการ์ดที่มีเลข
- `src/ui/journey/components/vn-tachie-stage.js`: ชั้น CG และชั้นรัศมีแสง
- `src/ui/journey/journey-renderer.js`: จังหวะศึกทั้งห้า · ป้ายเจตนาด้านบน เกจในกล่อง dock ถาดแทนกล่องบทพูดในที่เดิม · คำสั่ง `clashAct` แบบ arm/commit · เลข 1–4 คือแถวท่าหลัก · โฟกัสไปการ์ดแรกและกลับ ▽ · แท็บที่เลือกจำไว้ตลอดศึกและเริ่มที่ครอบครัว · ประกาศเจตนา ประโยคจังหวะเลือก `แก้ทางแล้ว` และผล · ตัวแปร `--light-level` และ `--hero-x` ให้รัศมีแสง
- `src/ui/styles/journey-screen.css`: ป้ายเจตนา เกจ หยด ถาด แท็บ เครื่องหมาย หน้าบนการ์ด ป้ายท่าปิดศึก รัศมีแสงและม่านมืดตามค่าแสง ชั้น CG · จอกว้างขยาย dock ของศึกถึง 1,352 px โดยกล่องบทพูดคง 48rem · พื้นทึบของป้ายเจตนาและเกจเมื่อลดความโปร่งใสหรือคอนทราสต์สูง
- `docs/design-system/evidence/journey-review/play.js`: ถอดปุ่มข้ามของศึก
- `tests/unit/journey-session.test.js` (ฟิลด์ใหม่ของ view) · `journey-presentation.test.js` (+3) · `journey-renderer.test.js` (+1)
- `docs/sprints/sprint-05-ssot.md` (สถานะ T5 · §7) · `docs/traceability/sprint-05-execution-matrix.md` 0.3.4 · `docs/dialogue/sprint-05/core-architect-notebook.md` (แยก §5 ไปที่ `core-architect-porting-notes.md` และลงทะเบียนใน README ของโฟลเดอร์ เพราะสมุดใกล้เพดาน 40 KB) · `docs/dialogue/sprint-05/BOARD.md` (`[S5-014]`) · `CHANGELOG.md`

### 3.3 ไฟล์ที่ลบ (Deleted)

- ไม่มี

## 4. ผลการทดสอบและการตรวจรับ (Verification & Quality Evidence)

| คำสั่งหรือการตรวจ | ผล |
|---|---|
| `node --test 'tests/unit/**/*.test.js'` | ผ่านทั้งหมด 1,311 (เดิม 1,302 · ใหม่ 9) |
| `node tests/docs/check-doc-links.mjs` | ผ่าน ไม่มีลิงก์เสีย |
| `node tests/e2e/journey-c4-design-system.mjs` (รันซ้ำเพื่อตรวจถดถอย ไม่ commit ผลใหม่) | 0 ล้ม · DOM คงที่ประมาณ 520 node ข้ามการเล่นสามรอบที่ตอนนี้วาดศึกด้วย · keydown listener 1 |
| Chromium · ศึก R1 ที่ 390×844 · 1440×900 · 844×390 | ป้ายเจตนา y 88–132 (มือถือ) และ y 32–80 กลางระหว่าง HUD กับปุ่มตั้งค่า (เดสก์ท็อป) · เกจ y 413 ใต้แถบใบหน้า (มือถือ) และ y 591 เหนือถาด (เดสก์ท็อป) · ถาดและกล่องบทพูดไม่ล้ำแถบใบหน้า · แนวนอนจังหวะเลือกเปลี่ยนเป็นคอลัมน์เดียวเลื่อนทั้งหน้า · ไม่มีเลื่อนแนวนอน · console ไม่มี error |

**ยังไม่ได้ตรวจ:** สายตา PO ต่อหน้าจอศึก · กันกดรัวในเบราว์เซอร์จริงและโหลดใหม่กลางศึก (C5f) · เวทีเงาสดของ R2 และ R5 (เนื้อหา Act 2 และ 5 อยู่ใน Slice 2–3) · แท็บที่ "ปรากฏแล้วอยู่ตลอดเกม" ต้องมีสถานะที่บันทึกได้ (ตัดสินใน T8 ตามมติเดิม) จึงแสดงเฉพาะกลุ่มที่มีการ์ดในเทิร์นนั้น

## 5. Migration และ Rollback

- ไม่มี migration · view ของ Core เพิ่มฟิลด์อย่างเดียว เซฟไม่เปลี่ยน · ย้อนกลับด้วยการ revert commit นี้

## 6. ความเสี่ยงและสิ่งที่ต้องทำต่อ (Risks & Next Steps)

1. **C5b ถัดไป:** แคมป์ (`CampDropTimer` และการ์ดกิจกรรม) · สัมผัส (`MicroPrompt`) · รับของ (`PouchSwapSheet`)
2. **ผลเป็นเม็ดบนป้ายเจตนา:** UX §3.1 ให้แสดงผลของเจตนาเป็นเม็ด แต่ผลของแต่ละเจตนาอยู่ในตัว kernel ยังไม่มีใน view · รอบนี้ใช้ถ้อยคำตามจอ v3 · ถ้า PO ต้องการเม็ด ต้องเพิ่มตารางผลของเจตนาใน Core ก่อน
3. **CG ที่ alias ไว้:** ภาพ `cg_act1_three_siblings_blue_shirt` ถูกครอปบนจอแนวตั้ง · ภาพจริงของ A1-08 รอ Astra ใน Slice 2 (R19)
