# Change Record: C2 ช่วงสุดท้าย · เครื่องมือพิสูจน์เรียกกติกาจาก Core · แบบจำลองสมดุลเล่น Act 1 จากแพ็กเกจ · ปิด C2

- **รหัสบันทึก (Record ID):** CR-20261104-0440
- **วันและเวลา (Timestamp):** 2026-11-04T04:40:00+07:00
- **รอบการพัฒนา (Sprint/Milestone):** Sprint 5 · Slice 1 · ปิด checkpoint C2 (T2)
- **ผู้ปฏิบัติงาน (Operator/Persona):** Claude · Supreme Core Architect & Lead Game Systems Engineer
- **สถานะ (Status):** Completed · T2 ส่งมอบครบตาม DoD

---

## 1. วัตถุประสงค์และคำสั่ง (Prompt Objective & Request)

ADR-P0-034 D5.2–D5.3: เมื่อ kernel ผ่าน parity gate แล้ว เครื่องมือพิสูจน์ต้องเปลี่ยนไปใช้กติกาจาก Core และไฟล์ใน evidence เหลือเป็น adapter ที่ไม่มีกติกาซ้ำ · แบบจำลองสมดุลต้องอ่านสเปกกลไกชุดเดียวกับ runtime (`TC-S5-BALANCE-001` ของ S1 คือ Act 1) · การเล่นจำลอง 14 แบบต้องรันบน Core (`TC-S5-ENDING-001`)

## 2. ข้อกำหนดที่ได้รับผลกระทบ (Traceability & Requirement IDs)

- **ADRs:** ADR-P0-034 D5 (กติกาแหล่งเดียว) · D6 (เนื้อหาคอมไพล์) · ADR-P0-033 D5
- **Sprint 5 WBS:** T2 `[x]` · C2 ปิด
- **Verification IDs:** `TC-S5-BALANCE-001` · `TC-S5-ENDING-001` · `TC-S5-CLASH-001` · `TC-S5-TRAY-001`

## 3. สิ่งที่ทำและรายการไฟล์ที่เปลี่ยนแปลง (Manifest of Changes)

### 3.1 ไฟล์ที่สร้างใหม่ (Created)

- `docs/changelog/2026-11/2026-11-04-0440-c2-evidence-on-core-and-balance-gate.md`: บันทึกนี้

### 3.2 ไฟล์ที่แก้ไข (Modified)

- `docs/design-system/evidence/tactical-clash-engine.mjs`: เหลือเป็น adapter ของ Core ที่คง API เดิม (`enterClash` · `listActions` · `step` · `terminals` · `enumerate` · กลยุทธ์อ้างอิง) · ยกจาก `mechanics/story.json` · ชื่อไทยจาก lexicon ของแพ็กเกจ · `coreTerminals` สำรวจบนตำแหน่งของ Core โดยไม่แปลงทุกก้าว
- `docs/design-system/evidence/five-act-balance-model.mjs`: ทุกกติกามาจาก Core (ค่าสถานะ ฝืนเอา Grace โหยหาบ้าน สี่กุญแจ แคมป์ การรับของ ศึก ฉากจบ) · Act 1 อ่านจากแพ็กเกจที่คอมไพล์โหนดต่อโหนด · Act 2–5 เป็นตารางในคำศัพท์ของแพ็กเกจ (effect แบบมีเงื่อนไขห้าจุดมีป้าย S2) · การเล่นจำลอง 14 แบบเล่นศึกผ่าน shell ของ Core ทีละเทิร์น · frontier สร้างทีละ state · เส้นทางพยานเป็น linked list · ตรวจเพิ่มว่าสหายและท่าผสานที่ด่านเปิดเฉพาะเมื่อสหายอยู่จริง
- `docs/design-system/evidence/ux-v3-screen-states-check.mjs`: เล่นจอบน Core และอ่านการ์ดกับป้ายจาก `projectClash` · `tactical-clash-simulator.mjs`: ตารางแก้ทางจาก `answersIntent` ของ Core · ชื่อยกอยู่ในรายงานของ simulator เอง
- `docs/design-system/ux-mockups/v3/harness/verify_delivery.py`: ไฟล์นอกงานส่งมอบ (ต้นทางที่ใช้ในที่ ไฟล์ที่คุ้มครอง SSOT และต้นทางของคำ) ตรวจที่ commit ส่งมอบ `8643a30` ตามแนวของ v2 (เดิมล้มตั้งแต่ C0 เพราะเอกสารเปลี่ยนตามแผน)
- `src/core/domain/journey/journey-state.js`: `beginAct` เป็นกติกาขึ้นองก์ใหม่ที่ session และแบบจำลองใช้ร่วมกัน · `src/core/use-cases/journey-session.js` ใช้ `beginAct`
- `tests/unit/journey-content.test.js` · `journey-encounters.test.js` · `journey-clash.test.js`: assertion ที่เทียบกับ engine เดิมเปลี่ยนตาม [ทะเบียน §4](../../traceability/sprint-05-superseded-assertions.md) · เพิ่มเทสต์ว่าเครื่องมือใน evidence ไม่มีกติกาซ้ำ
- `docs/traceability/sprint-05-superseded-assertions.md` §4 · `docs/traceability/sprint-05-execution-matrix.md` §6
- `docs/design-system/five-act-narrative-gameplay-master-plan.md` (ตัวชี้ไปยัง Core และ parity gate ใน §2 และ §8) · `interactive-gameplay-ux-ui-specification.md` (แหล่งของสถานะศึก) · `mechanics/README.md` ข้อ 4 · `evidence/README.md` · `ux-mockups/v3/README.md`
- `docs/sprints/sprint-05-ssot.md` (T2 `[x]` · C2 ปิด · §6.1 · §7) · `docs/dialogue/sprint-05/core-architect-notebook.md` · `docs/dialogue/sprint-05/BOARD.md` (`[S5-009]`) · `CHANGELOG.md`

### 3.3 ไฟล์ที่ลบ (Deleted)

- ไม่มี

## 4. ผลการทดสอบและการตรวจรับ (Verification & Quality Evidence)

| คำสั่ง | ผล |
|---|---|
| `node --test 'tests/unit/**/*.test.js'` | ผ่านทั้งหมด |
| `node tests/docs/check-doc-links.mjs` | ผ่าน ไม่มีลิงก์เสีย |
| `node tools/clash/clash-parity.mjs --check --engine docs/design-system/evidence/tactical-clash-engine.mjs` | adapter ให้ trace เดียวกับ engine เดิมทุกก้าว |
| `node docs/design-system/evidence/tactical-clash-simulator.mjs` · `ux-v3-screen-states-check.mjs` | ผ่าน · รายงานเหมือนก่อนแก้ทุกไบต์ |
| `node docs/design-system/evidence/five-act-balance-model.mjs` | ผ่านทุกข้อ · 73 โหนด · 25,337 จุดเข้าศึก · 361 วินาที (เดิม 205–285) |
| `node docs/design-system/evidence/five-act-runtime-ledger.mjs` · `physics-scale-optics-check.mjs` | ผ่าน |
| `node docs/design-system/ux-mockups/v3/harness/build-fixtures.mjs` | `fixtures.json` และ `screen-states.json` เหมือนที่ส่งมอบทุกไบต์ · `thai-copy-audit.json` ต่างเฉพาะ hash ของสเปก UX ที่แก้ตัวชี้ใน commit นี้ จึงคงไฟล์ที่ส่งมอบไว้ |
| `python3 docs/design-system/ux-mockups/v3/harness/verify_delivery.py` | ผ่าน |
| coverage ของ Core ใหม่ | บรรทัด 100% · branch 98% · ฟังก์ชัน 99.6% (166 เทสต์ของ journey) |

**ผลของแบบจำลองสมดุลเทียบรุ่นเดิม:** ข้อพิสูจน์ทุกข้อผ่าน และการเล่นจำลอง 14 แบบได้ค่าสถานะ สายใย fsu sr อาการโหยหาบ้าน ของในกระเป๋า และฉากจบที่เปิด เท่ารุ่นเดิมทุกตัว · ความต่างมาจากการแก้สองจุดที่ตั้งใจ และพิสูจน์ด้วยการรันรุ่นเดิมที่แก้จุดแรกแบบเดียวกัน ซึ่งได้รายงานตรงกับรุ่นใหม่ทุกบรรทัด ยกเว้นข้อพิสูจน์ใหม่เรื่องสหายอยู่จริง และจำนวนสถานะที่ A1-13

1. **ลำดับการพึ่งบ้าน:** ใช้ `min(streak, 2)` แทน `min(streak, 1)` ทั้งตอนเข้าศึก ระหว่างสำรวจศึก และใน frontier · การพึ่งบ้านครั้งที่สามติดกันได้แสงเป็นศูนย์อยู่แล้ว ค่าสองขึ้นไปจึงให้ผลเหมือนกันทุกประการ แต่รุ่นเดิมรวมครั้งที่สองกับครั้งแรกเข้าด้วยกัน จึงลดโทษของการพึ่งบ้านครั้งที่สามตอนเข้าศึก · ผลคือจุดเข้าศึกที่ต่างกัน R2 8,016 → 8,029 · R3 489 → 495 และช่วงต่ำสุดของ selfReliance ในสาย B ที่ปลาย Act 2 จาก 0 เป็น 1 (frontier เก็บสถานะที่ดีกว่าแทน)
2. **Rest Floor ของ Act 1:** ลงผลในโหนด A1-13 ก่อนตัด frontier เหมือน runtime (เดิมลงหลังตัด) · สถานะที่ A1-13 จึงเหลือ 268 แทน 380 และตรวจแล้วว่าคือ frontier ของรุ่นเดิมหลังลงพื้นพักพอดี · จำนวนสถานะของทุกโหนดหลังจากนั้นเท่าเดิม

## 5. ความเสี่ยงและสิ่งที่ต้องทำต่อ (Risks & Next Steps)

1. **แบบจำลองช้าลงราว 27%** เพราะเล่นด้วย JourneyState และกติกาเดียวกับ runtime · ยังเป็น design gate แยกจากชุด unit ตาม ADR-P0-034 D5.3
2. **S2–S3:** ห้าจุดที่ใช้ effect แบบมีเงื่อนไข (A3-04 · A3-13 intel · A4-01 · A4-08 tempo · A5-05) ต้องมีคำศัพท์ใน schema ก่อนคอมไพล์ Act 3–5 · ตาราง Act 2–5 ในแบบจำลองจะถูกแทนด้วยแพ็กเกจที่คอมไพล์
3. **C3 ต่อไป:** journey save · identity ประกอบ · namespace ใหม่และคลังเซฟเก่าแบบอ่านอย่างเดียว · การพิสูจน์สองแพ็กเกจเวอร์ชันเดียวกันที่ค้างจาก T1 · writer ใช้ `restore` ของ session เป็นด่านสุดท้ายของความหมาย
