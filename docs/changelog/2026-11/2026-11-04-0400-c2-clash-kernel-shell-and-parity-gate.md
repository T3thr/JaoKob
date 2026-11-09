# Change Record: C2 ช่วงแรก · clash kernel และ shell ใน Core พร้อม parity gate

- **รหัสบันทึก (Record ID):** CR-20261104-0400
- **วันและเวลา (Timestamp):** 2026-11-04T04:00:00+07:00
- **รอบการพัฒนา (Sprint/Milestone):** Sprint 5 · Slice 1 checkpoint C2 (T2) ช่วงแรก
- **ผู้ปฏิบัติงาน (Operator/Persona):** Claude · Supreme Core Architect & Lead Game Systems Engineer
- **สถานะ (Status):** In-Progress · กติกาศึกอยู่ใน Core และผ่าน parity gate แล้ว · journey domain encounters session play-mode และการย้ายเครื่องมือพิสูจน์มาใช้ Core อยู่ในบันทึกถัดไป

---

## 1. วัตถุประสงค์และคำสั่ง (Prompt Objective & Request)

PO สั่งเริ่ม C2: พอร์ต Core Journey Engine และ Tactical Clash เข้า `src/core/domain` พร้อมระบบทดสอบ parity 100% · ช่วงนี้ทำตาม ADR-P0-034 D5.2 ตามลำดับ คือย้ายกติกาศึกเข้า Core และพิสูจน์ parity กับ engine เดิมก่อน แล้วจึงให้เครื่องมือพิสูจน์เปลี่ยนไปใช้ Core ในช่วงถัดไป

## 2. ข้อกำหนดที่ได้รับผลกระทบ (Traceability & Requirement IDs)

- **ADRs:** ADR-P0-034 D2 (kernel และ shell · error code · deep-freeze) · D3 (การรวมสถานะแบบประกาศชัด) · D4.1 (ความหมายของเจตนาและการกระทำอยู่ใน Core) · D5.1–D5.2 · D9.2/D9.4 (view model ของถาด) · ADR-P0-033 D1
- **Sprint 5 WBS:** T2 กำลังทำ (ไม่ติ๊ก)
- **Verification IDs:** `TC-S5-CLASH-001` · `TC-S5-TRAY-001` · `TC-S5-STATE-001` (กติกาค่าสถานะ)

## 3. สิ่งที่ทำและรายการไฟล์ที่เปลี่ยนแปลง (Manifest of Changes)

### 3.1 ไฟล์ที่สร้างใหม่ (Created)

- `src/core/domain/clash/clash-rules.js`: เจตนาเจ็ดชนิด · การกระทำ 24 ชนิดพร้อมตัวเลขที่ตรึงไว้ · ของหกชิ้นด้วย ID เต็ม · ธงที่มีความหมายในศึก · อาณาเขต Act 5 · กลุ่มและความจุของถาด (UX §3.3)
- `src/core/domain/clash/clash-kernel.js`: kernel แบบบริสุทธิ์ (context · แสงเริ่ม · การกระทำที่ทำได้ · ผลของหนึ่งเทิร์น) ไม่ตรวจและไม่ freeze เพื่อให้เครื่องมือพิสูจน์เร็ว ไม่แก้ input
- `src/core/domain/clash/clash-engine.js`: shell ที่ตรวจยก เซฟของศึก และ JourneyState แล้วปฏิเสธด้วย `CLASH_ROUND_INVALID` `CLASH_STATE_INVALID` `CLASH_ACTION_UNKNOWN` `CLASH_ACTION_ILLEGAL` `CLASH_ENDED` `CLASH_NOT_ENDED` `JOURNEY_STATE_INVALID` · คืนค่า deep-freeze · เขียนค่าสถานะ สายใย และตัวนับกลับเข้า journey ทุกเทิร์น · `closeClash` เป็นทางออกเดียว (tempo กลับเป็น 0 · ของที่เตรียมไว้หมดสิทธิ์)
- `src/core/domain/clash/clash-tray.js`: view model ของศึก: การ์ดสี่กลุ่ม ราคาเป็นเม็ด ป้ายแก้ทาง ป้ายซ้ำ ท่าผสาน ท่าปิดศึก เจตนาที่ถูกอาณาเขตลบ เหลือครึ่ง หรือแรงสองเท่า และเจตนาล่วงหน้าหลังตั้งสติฟังฝน
- `src/core/domain/journey/journey-rules.js`: ค่าสถานะ 0–5 · Soft Floor · ฝืนเอาและ Grace · Rest Floor · โหยหาบ้านตั้งแต่ Act 2 · สายใยและระดับคำเรียก · tempo · ใช้ร่วมกันทั้งศึกและด่าน
- `src/core/domain/journey/journey-state.js`: JourneyState เริ่มเกมและตัวตรวจ (key ครบพอดี · ช่วงค่า · ความสัมพันธ์ในกระเป๋าผ่าน `keepsake-pouch.js`)
- `src/core/domain/journey/journey-errors.js` · `plain-data.js`: รายการ error code แบบปิด และการคัดลอกกับ freeze ข้อมูลธรรมดา
- `tools/clash/clash-parity.mjs`: parity gate ที่เดินทุกลำดับการกดจาก 18 จุดเข้าศึกแล้ว hash ทุกตำแหน่ง (สถานะและการกระทำที่ทำได้) · `--write --engine` บันทึก trace ของ engine · `--check` เทียบ Core หรือ engine ใด ๆ
- `tests/fixtures/journey/clash-parity-golden.json`: trace ที่บันทึกจาก engine ที่พิสูจน์แล้ว ณ `d586f46` (260,936 ลำดับ · 286,174 ตำแหน่ง)
- `tests/unit/journey-clash.test.js` (20 เทสต์) · `tests/unit/journey-rules.test.js` (7 เทสต์)
- `docs/changelog/2026-11/2026-11-04-0400-c2-clash-kernel-shell-and-parity-gate.md`: บันทึกนี้

### 3.2 ไฟล์ที่แก้ไข (Modified)

- `docs/design-system/evidence/tactical-clash-simulator.mjs`: ส่งออก `ENTRIES` และรันข้อพิสูจน์ใน `main()` เมื่อเรียกโดยตรงเท่านั้น · ผลที่พิมพ์เหมือนเดิมทุกไบต์
- `tools/README.md` · `docs/design-system/evidence/README.md` · `docs/sprints/sprint-05-ssot.md` (สถานะ T2 · §7) · `docs/traceability/sprint-05-execution-matrix.md` (§6 runner ที่ส่งแล้ว) · `docs/dialogue/sprint-05/core-architect-notebook.md` · `CHANGELOG.md`

### 3.3 ไฟล์ที่ลบ (Deleted)

- ไม่มี

## 4. ผลการทดสอบและการตรวจรับ (Verification & Quality Evidence)

| คำสั่ง | ผล |
|---|---|
| `node --test 'tests/unit/**/*.test.js'` | ผ่านทั้งหมด |
| `node tests/docs/check-doc-links.mjs` | ผ่าน ไม่มีลิงก์เสีย |
| `node tools/clash/clash-parity.mjs --check` | kernel ตรงกับ trace ทุกก้าว · 18 จุดเข้าศึก · 260,936 ลำดับ · 286,174 ตำแหน่ง (ไม่ถึง 1 วินาที) |
| `node tools/clash/clash-parity.mjs --check --engine docs/design-system/evidence/tactical-clash-engine.mjs` | engine เดิมให้ trace เดียวกัน (ไฟล์ยังไม่แก้ตั้งแต่ `d586f46`) |
| `node docs/design-system/evidence/tactical-clash-simulator.mjs` | ผ่าน · ผลเหมือนก่อนแก้ทุกไบต์ |
| coverage ของ `src/core/domain/clash/` และ `journey/` (`--experimental-test-coverage`) | บรรทัด 100% · branch ≥ 98.5% |

**การทดสอบตัว gate เอง:** ใส่ข้อผิดพลาดใน kernel ทีละข้อแล้วรัน `--check` · ดับแสงลดเฉพาะเมื่อได้แสงเกิน 1 (ล้ม 4 จุดเข้าศึก) · ตัดโบนัสพี่น้องที่คืนดี (ล้ม 2) · เปิดท่าปิดศึกช้าไปหนึ่งเทิร์น (ล้ม 3) · สูดความมืดเทิร์นสุดท้ายคูณสอง (ไม่ล้ม เพราะไม่มียกใดที่มีสูดความมืดสองเทิร์นติดกันตอนท้าย จึงปักกติกานี้ด้วยเทสต์ยกสังเคราะห์แทน)

**ความต่างที่ตั้งใจจาก engine เดิม (ผลเท่ากันในทุกยกจริง):**
1. ไม่มี `notIn: ['R5']` ของกระดุม เพราะกติกาอาณาเขตห้ามของทุกชิ้นยกเว้นริบบิ้นในยกที่เป็นอาณาเขตอยู่แล้ว
2. ผลเฉียดใช้ "Act 5 เสียแรง" จากเลของก์ของยก แทนการเทียบชื่อ `R5`
3. เพิ่ม `lastAction` ตาม Save Format 2 และใช้ `outcome !== null` แทน `ended`

## 5. ความเสี่ยงและสิ่งที่ต้องทำต่อ (Risks & Next Steps)

1. **ช่วงถัดไปของ C2:** เงื่อนไขและ effect ของคำศัพท์ปิด · ฉากจบและ Safety Fallback · ด่าน แคมป์ สัมผัส การรับของ · journey-session แบบ atomic ผูก revision · play-mode
2. **ย้ายเครื่องมือพิสูจน์:** `tactical-clash-engine.mjs` จะกลายเป็น adapter ที่เรียก Core และเทสต์ "engine API ยังให้ trace เดิม" จะคุ้มครองความถูกต้องของ adapter แทน · ตัวตรวจส่งมอบภาพ v3 ผูก hash ของไฟล์นี้ไว้ จึงต้องย้ายการตรวจนั้นไปเทียบ commit ส่งมอบ ตามแนวที่ใช้กับ v2 แล้ว
3. **ข้อค้นพบในแบบจำลองสมดุล:** แบบจำลองส่ง `min(streak, 1)` เข้าศึก ซึ่งลดโทษของการใช้ทักษะครอบครัวครั้งที่สามติดกันตอนเข้าศึก · ตัวแปร `min(streak, 2)` (ตรงกติกาจริงเพราะโทษเต็มที่ตั้งแต่ซ้ำสองครั้ง) ผ่านทุกข้อพิสูจน์ด้วยช่วงค่าเท่าเดิม เปลี่ยนเพียงจำนวนสถานะ (จุดเข้าศึกที่ต่างกัน 25,182 → 25,318) · แก้พร้อมการย้ายแบบจำลองมาใช้ Core
