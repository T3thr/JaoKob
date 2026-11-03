# Change Record: C2 ช่วงสอง · journey domain · encounters · journey-session · play-mode

- **รหัสบันทึก (Record ID):** CR-20261104-0420
- **วันและเวลา (Timestamp):** 2026-11-04T04:20:00+07:00
- **รอบการพัฒนา (Sprint/Milestone):** Sprint 5 · Slice 1 checkpoint C2 (T2) ช่วงสอง
- **ผู้ปฏิบัติงาน (Operator/Persona):** Claude · Supreme Core Architect & Lead Game Systems Engineer
- **สถานะ (Status):** In-Progress · Core เล่น Act 1 ต้นแบบได้ครบจาก New Game ถึงทางเข้า Act 2 · การย้ายเครื่องมือพิสูจน์มาใช้ Core อยู่ในบันทึกถัดไป

---

## 1. วัตถุประสงค์และคำสั่ง (Prompt Objective & Request)

ทำ T2 ต่อตาม ADR-P0-034 D2–D4 และ D9: กติกาการเดินทาง ด่าน แคมป์ สัมผัสโต้ตอบ การรับของ ฉากจบ คำสั่งของผู้เล่นแบบ atomic ที่ผูก revision และเครื่องสถานะโหมด เพื่อให้ C4–C5 สร้างต้นแบบเว็บบน view model ที่ Core คำนวณให้

## 2. ข้อกำหนดที่ได้รับผลกระทบ (Traceability & Requirement IDs)

- **ADRs:** ADR-P0-034 D2 (shell · error code · freeze) · D3 (JourneyState กับ encounter · exitClash · exitCamp) · D4 (คำศัพท์ปิด) · D7 ข้อ 2 และ 4 (บันทึกทุก commit · snapshot ต้นองก์และการเล่นซ้ำ) · D9 (play-mode · view model) · ADR-P0-020 (กระเป๋า)
- **Sprint 5 WBS:** T2 กำลังทำ (ไม่ติ๊ก)
- **Verification IDs:** `TC-S5-STATE-001` · `TC-S5-ENDING-001` (ตารางความจริงและ fixture) · `TC-S5-REPLAY-001` (fixture) · `TC-S5-TRAY-001`

## 3. สิ่งที่ทำและรายการไฟล์ที่เปลี่ยนแปลง (Manifest of Changes)

### 3.1 ไฟล์ที่สร้างใหม่ (Created)

- `src/core/domain/journey/conditions.js`: เงื่อนไขสิบเอ็ดชนิดของคำศัพท์ปิด · รูปที่ไม่รู้จักเป็น `JOURNEY_PACKAGE_INVALID`
- `src/core/domain/journey/effects.js`: effect สิบสามคำ · ราคาที่จ่ายเองห้ามทำให้ค่าหมด (ตัวเลือกที่จ่ายไม่ไหวจึงไม่เปิด) · กระดุมที่ล็อกปล่อยไม่ได้ · ผิดเป็น `JOURNEY_EFFECT_FAILED`
- `src/core/domain/journey/endings.js`: E-HOME E-POND E-DAWN และ Safety Fallback · เหตุที่ล็อกของแต่ละฉากจบ · เกลียวตาม UX §6.2 · ตัดสินจาก journey เท่านั้น
- `src/core/domain/encounters/obstacle.js` · `camp.js` · `pouch-offer.js` · `micro.js`: สี่กุญแจ บุกทวน รอจังหวะ ฝืนเอา · หยดน้ำ กลุ่มที่ขัดกัน และการเตรียมของ · รับ ฝาก ปฏิเสธ · สัมผัสโต้ตอบที่ไม่มีการตก
- `src/core/use-cases/journey-session.js`: `newGame` · `restore` · `advance` · `choose` · `clashAct` · `campPick` · `campLeave` · `microDone` · `pouchDecide` · `chooseEnding` · `replayAct` · `view` · คำสั่งผูก revision และคืน state เดิมเมื่อถูกปฏิเสธ · effect ของโหนดลงผลครั้งเดียวเมื่ออ่านบทของโหนดจบ · ขึ้นองก์ใหม่แล้วล้างลำดับการพึ่งบ้านและจับ snapshot · ตรวจแพ็กเกจในส่วนที่ schema ตรวจไม่ได้
- `src/core/state-machine/play-mode.js`: สิบสามโหมด (UX §1.7 รวม BOUNDARY และ COMPLETE) · คำสั่งที่แต่ละโหมดรับ · modal หยุดเกม · ไม่มี Game Over
- `src/core/README.md`: แผนที่ของ Core ใหม่และกติกาเหล็ก
- `tests/unit/journey-session.test.js` (17 เทสต์) · `tests/unit/journey-encounters.test.js` (9 เทสต์) · `tests/helpers/journey-driver.js`
- `docs/changelog/2026-11/2026-11-04-0420-c2-journey-domain-encounters-session-and-play-mode.md`: บันทึกนี้

### 3.2 ไฟล์ที่แก้ไข (Modified)

- `src/README.md` ข้อ 4 · `docs/sprints/sprint-05-ssot.md` (สถานะ T2 · §7) · `docs/traceability/sprint-05-execution-matrix.md` §6 · `docs/dialogue/sprint-05/core-architect-notebook.md` · `CHANGELOG.md`

### 3.3 ไฟล์ที่ลบ (Deleted)

- ไม่มี

## 4. ผลการทดสอบและการตรวจรับ (Verification & Quality Evidence)

| คำสั่ง | ผล |
|---|---|
| `node --test 'tests/unit/**/*.test.js'` | ผ่านทั้งหมด |
| `node tests/docs/check-doc-links.mjs` | ผ่าน ไม่มีลิงก์เสีย |
| coverage ของ Core ใหม่ (`--experimental-test-coverage`) | บรรทัด 99.9% · branch 97% · ฟังก์ชัน 99% |

**สิ่งที่พิสูจน์แล้ว**
1. แพ็กเกจ Act 1 ที่คอมไพล์จากพิมพ์เขียวเล่นจาก New Game ถึงทางเข้า Act 2 ได้ครบ 30 เส้นทาง (วิชาเอกสาม × ห้าทางผ่านด่านฝาย × สองสาย) · Rest Floor 4/3/4 · snapshot Act 1 และ Act 2 · ทุกการเปลี่ยนโหมดเป็นไปตาม UX §1.7
2. ทุก state ของการเล่นผ่าน schema ของ Save Format 2 · `restore` คืนค่าเดิม · เล่นซ้ำด้วยคำสั่งชุดเดิมได้ state เดิมทุกตัว
3. แพ็กเกจจิ๋วผ่านทุกชนิดโหนด ทุกองก์ และจบที่ฉากจบ · เข้าถึงทุกโหมดยกเว้น BOUNDARY
4. ฉากจบเท่ากับ `endings()` ของแบบจำลองสมดุลในทุกจุดตัดของเกณฑ์ (มากกว่า 100,000 สถานะ) · Safety Fallback · ประโยคของเงื่อนไขแรกที่ยังขาดตามลำดับในแพ็กเกจ · ข้อมูลอื่นนอก journey ไม่เปลี่ยนฉากจบ
5. การเล่นซ้ำรายองก์คืน snapshot ตัดประวัติและ snapshot ขององก์หลัง และไม่ย้อน `completion`
6. แพ็กเกจที่ผิดถูกปฏิเสธ 19 แบบ · state ที่ถูกแก้ถูกปฏิเสธ 24 แบบ · คำสั่งที่ผิดถูกปฏิเสธพร้อม error code และคืน state เดิม

## 5. ความเสี่ยงและสิ่งที่ต้องทำต่อ (Risks & Next Steps)

1. **ช่วงสุดท้ายของ C2:** `tactical-clash-engine.mjs` เป็น adapter ของ Core · แบบจำลองสมดุลใช้กติกาของ Core และรัน Act 1 จากแพ็กเกจที่คอมไพล์แล้ว (`TC-S5-BALANCE-001`) · ตัวตรวจส่งมอบภาพ v3 เทียบ commit ส่งมอบ
2. **ข้อค้นพบของ S2–S3:** effect แบบมีเงื่อนไขและ effect ของ tempo ยังไม่อยู่ในคำศัพท์ 3.0.0 · การเปิดแท็บของถาดแบบปรากฏแล้วอยู่ตลอดเกมต้องตัดสินใน T8
3. **C3:** identity ของเซฟ admission ของ data layer namespace และ writer ใช้ `restore` ของ session เป็นด่านสุดท้ายของความหมาย
