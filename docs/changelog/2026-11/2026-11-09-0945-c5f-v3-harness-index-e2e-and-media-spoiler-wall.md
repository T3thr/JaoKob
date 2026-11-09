# Change Record: C5f · หน้าตรวจ 13 จอของ Mockups v3 จากสถานะจริงของ engine · E2E บน `index.html` · กำแพงกันสปอยล์ของสื่อ · ใบหน้าบนการ์ดแบบภาพย่อ

- **รหัสบันทึก (Record ID):** CR-20261109-0945
- **วันและเวลา (Timestamp):** 2026-11-09T09:45:00+07:00
- **รอบการพัฒนา (Sprint/Milestone):** Sprint 5 · Slice 1 · checkpoint C5 (T5) งานย่อย C5f · ปิดงานวิศวกรรมของ Slice 1
- **ผู้ปฏิบัติงาน (Operator/Persona):** Claude · Supreme Core Architect & Lead Game Systems Engineer
- **สถานะ (Status):** Completed (C5f) · **T5 ส่งมอบครบในส่วนวิศวกรรม · ยังไม่ติ๊กเพราะ DoD ต้องมีบันทึกการเล่นจริงของ PO** · PR ของ Slice 1 เปิดรอ PO และ Antigravity ตรวจ

---

## 1. วัตถุประสงค์และคำสั่ง (Prompt Objective & Request)

กฎบัตร continuity ของ PO (2026-11-09) ก้าวที่ 3: หน้า harness ของ PO ใน `docs/design-system/evidence/` (นอก release allowlist) ที่เรนเดอร์ทั้ง 13 จอของ Mockups v3 จากสถานะจริงของ engine · E2E เบราว์เซอร์จริงครอบคลุมการเล่นจบ Act 1 คีย์บอร์ดล้วน ลดการเคลื่อนไหวและความโปร่งใส โหลดใหม่กลางศึกแล้วเล่นต่อตรงจังหวะ และการพิสูจน์กำแพงกันสปอยล์ (`TC-S5-PROTO-001`) · ติ๊ก T5 เมื่อครบ DoD · อัปเดตบันทึกทั้งหมด โพสต์ `[S5-017]` และเปิด PR เดียวของ Slice 1 สู่ `develop` โดยไม่ auto-merge

## 2. ข้อกำหนดที่ได้รับผลกระทบ (Traceability & Requirement IDs)

- **ADRs:** ADR-P0-034 D10 (กำแพงกันสปอยล์ · harness นอก allowlist) · D10.3 (สื่อ) · D7 (Resume ไม่เขียน) · ADR-P0-022 D5 (ยืนยัน inline) · ADR-P0-019 (คีย์บอร์ด)
- **สัญญาออกแบบ:** Mockups v3 README · UX §8.2–§8.4 · Atomic 05
- **Verification IDs:** `TC-S5-PROTO-001` · `TC-S5-UX-001` · `TC-S5-INLINE-001` (กันกดรัวในเบราว์เซอร์จริง) · `TC-S5-SAVE-001` (โหลดใหม่กลางศึก) · `TC-S5-A11Y-001` · `TC-S5-ASSET-001` · `TC-S5-PERF-001` (งบภาพ)

## 3. สิ่งที่ทำและรายการไฟล์ที่เปลี่ยนแปลง (Manifest of Changes)

### 3.1 กำแพงกันสปอยล์ของสื่อ (ข้อค้นพบของ C5e)

- `tools/content/compile-journey.mjs`: ผลลัพธ์ที่สาม `story-jaokob-core.media.json` = manifest ของสื่อของแพ็กเกจ เฉพาะภาพที่แพ็กเกจแสดงได้ (ฉาก ตัวละครและภาพหันอีกทาง CG ไอคอนของ ใบหน้าบนการ์ดของพี่น้องและสหายที่ยกของแพ็กเกจใช้) และเฉพาะฟิลด์ที่ runtime ใช้ · compiler ล้มเมื่อแพ็กเกจอ้างภาพที่ manifest v2 ไม่มี · drift gate ครอบไฟล์ใหม่
- `src/bootstrap/journey-shell.js`: เกมอ่าน manifest ของแพ็กเกจแทน manifest v2 ทั้งไฟล์ · หน้าตรวจของ PO ยังอ่าน manifest v2 เฉพาะตอนเปิดแพ็กเกจจิ๋ว
- `src/data/content/journey-presentation.js`: `CARD_FACES` ตารางเดียวที่ compiler กับ presentation ใช้ร่วมกัน
- ผล: ภาพที่ส่ง 70 → **29** · allowlist 140 → **99 ไฟล์** · artifact 16.7 → **4.85 MB gzip** · ไม่มีภาพหรือคำบรรยายของ Act 2–5 และฉากจบในไฟล์ที่ส่ง

### 3.2 หน้าตรวจ 13 จอของ Mockups v3

- `docs/design-system/evidence/journey-v3-harness/` (ใหม่): `screens.js` สร้างแพ็กเกจของแต่ละจอจากแพ็กเกจจิ๋ว ยกของสเปกกลไก และถ้อยคำตรงตัวจาก fixture ของ v3 · `screen.html` และ `screen.js` เล่นจอหนึ่งจอบนแอปจริง: New Game จริงเขียนเซฟ Save 2 ในหน่วยความจำ → เขียนเงื่อนไขของจอแล้วปิดผนึกใหม่ → shell ใหม่ Resume แบบเดียวกับเซฟของผู้เล่น (schema integrity digest และ `restore()` ของ Core ตรวจหมด) → คำสั่งจริงพาไปถึงจังหวะ · `index.html` `gallery.js` `harness.css` วางหน้าจอจริงที่ viewport ของ v3 ข้างภาพ v3 ทีละจอ
- `tests/unit/journey-v3-harness.test.js` (ใหม่ 14): ทุกจอผ่านการรับแพ็กเกจและ `restore()` จริง และ view ของ Core ตรงข้อเท็จจริงของ v3 ทุกข้อ: ศึก R5 สองจังหวะ R4A การ์ด 16 ใบ R2 (เทิร์น แสง เจตนา การ์ด ป้ายแก้ทาง ป้ายซ้ำ) · ทางเลือกห้าทางของ A2A-05 · การ์ดแคมป์ C3 แปดใบ · เย็บและเคาะ · ฉากจบสามเกลียวและ Safety Fallback · บรรทัดของเตื๊อก
- `tests/e2e/journey-c5f-harness.mjs` (ใหม่): อ่านสิ่งที่วาดจริงทั้ง 13 จอกลับจาก DOM เทียบกับข้อเท็จจริงเดียวกัน · ไม่มีภาพถูกปฏิเสธ · ภาพหน้าจอ 13 ภาพ

### 3.3 E2E บนตัวเกม

- `tests/e2e/journey-c5f-index.mjs` (ใหม่): เสิร์ฟ**เฉพาะไฟล์ใน allowlist** ที่ `/` และ `/JaoKob/` · เล่น Act 1 จบด้วยคีย์บอร์ดล้วนสองรอบ (มือถือพร้อมการเคลื่อนไหวที่ราก · เดสก์ท็อปลดการเคลื่อนไหวและความโปร่งใสที่ subpath) · โหลดใหม่กลางศึก · กด 1 รัวสามครั้ง · probe กำแพงกันสปอยล์ · CSP · storage

### 3.4 ข้อค้นพบที่แก้ระหว่าง C5f

1. **ใบหน้าบนการ์ดกินงบภาพ (จาก harness จอ 11):** ถาด R4A 16 ใบมีใบหน้าห้าใบ แต่ละใบ decode ภาพ 1024² (4 MiB) เพื่อแสดงในวง 40 px · cache เต็ม 33.0 MB และปฏิเสธ 4 ภาพ ซึ่งจะเกิดจริงใน Act 4 · แก้: `src/ui/assets/image-cache.js` รับ `thumb` แล้ว decode ไฟล์เดิมที่ resolver พิสูจน์แล้วให้เล็กลงครั้งเดียวในเบราว์เซอร์ (`createImageBitmap` → PNG) ใต้ key ของตัวเอง · `journey-media.js` ให้ descriptor แบบ `thumb` · presentation ขอใบหน้าที่ 256 px (คมที่ความหนาแน่น 2–3 เท่า เพราะภาพแสดงกว้าง 100 px) · ผล: จอ 11 ถือ **18.7 MiB** ไม่มีภาพถูกปฏิเสธ · port `downscale` ฉีดได้สำหรับเทสต์ (`image-cache.test.js` +1 · `journey-media-screens.test.js` ตรวจว่าใบหน้าของ Act 1 ถูกย่อจากไฟล์เต็ม)
2. **ชื่อฉากซ้อนใต้ป้ายเจตนาเมื่อ Resume กลางศึก (จาก E2E โหลดใหม่):** แก้ใน `journey-renderer.js` ให้ชื่อฉากขึ้นเฉพาะเมื่อไม่ได้อยู่ในจังหวะศึกหลังบทนำ แต่ยังประกาศชื่อฉากให้โปรแกรมอ่านหน้าจอ · `journey-renderer.test.js` +1 (mutation ตรวจแล้วว่าจับได้)

## 4. ผลการทดสอบและการตรวจรับ (Verification & Quality Evidence)

| คำสั่งหรือการตรวจ | ผล |
|---|---|
| `node --test 'tests/unit/**/*.test.js'` | ผ่านทั้งหมด **430** (หลัง C5e 413 · C5f เพิ่ม 17) |
| `node tests/docs/check-doc-links.mjs` | ผ่าน ไม่มีลิงก์เสีย |
| `node tools/content/compile-journey.mjs --check` | แพ็กเกจ ใบเสร็จ สื่อ และรายงานตรงกับต้นทาง |
| `tests/release/verify-static-artifact.mjs` | PASS · Journey 99 ไฟล์ 4.85 MB gzip · ซ้อมย้อนกลับ Sprint 4 76 ไฟล์ |
| `node tests/e2e/journey-c5f-index.mjs` (Chromium 151) | 0 ล้ม · Act 1 จบด้วยคีย์บอร์ดล้วนที่ `/` (390 × 844 มีการเคลื่อนไหว 112 คำสั่ง) และ `/JaoKob/` (1440 × 900 ลดการเคลื่อนไหว · กระจกเป็นพื้นทึบ) ผ่าน VN ทางเลือก ศึกทุกจังหวะ แคมป์ สัมผัส ถึงการ์ดจบบท `เรื่องหน้าต่อจากนี้ยังไม่เปิด` · โหลดใหม่ที่ a1-08 เทิร์นสอง: หน้าแรกโฟกัส `เล่นต่อ` · Resume ไม่เขียน (revision 66 เท่าเดิม) · กลับมาที่จังหวะ เทิร์น แสง และเจตนาเดิมแล้วเล่นต่อจนจบ · กด 1 รัวสามครั้งที่ a1-03 commit ครั้งเดียว · probe 12 เส้นทาง (หน้าตรวจ fixture manifest เต็ม ภาพ Act 5 receipt spec ทั้งรากและ subpath) ได้ 404 ทั้งหมด · ไม่มี request นอก allowlist · ไม่มีการละเมิด CSP · storage เฉพาะ `jaokob:journey:` · ผลที่ [evidence/sprint-05/c5f](../../../tests/e2e/evidence/sprint-05/c5f/report.json) |
| `node tests/e2e/journey-c5f-harness.mjs` | 13 จอ 0 ล้ม · ทุกจอวาดตรงข้อเท็จจริงของ v3 · ไม่มีภาพถูกปฏิเสธ (ถือสูงสุด 18.7 MiB ที่จอ 11) · ผลที่ [evidence/sprint-05/c5f/harness](../../../tests/e2e/evidence/sprint-05/c5f/harness/report.json) |
| `journey-c4-design-system.mjs` · `journey-c5b-encounters.mjs` · `journey-c5c-panels.mjs` · `journey-c5d-media.mjs` (รันซ้ำ ไม่ commit ผลใหม่) | ผ่านทั้งหมด 0 ล้ม (C4 54 สถานะ · C5b 60 · C5c 50 · C5d สองแพ็กเกจ) · หมายเหตุ: C4 หยุดด้วย exception หนึ่งครั้งเมื่อรันต่อกันในชุดเดียว แล้วผ่านเมื่อรันเดี่ยว (ไม่ได้เก็บ stack ไว้ ติดตามถ้าเกิดซ้ำ) |

**ยังไม่ได้ตรวจ:** **การเล่นจริงของ PO (อยู่ใน DoD ของ T5 และ `TC-S5-PROTO-001`)** · สายตา PO เทียบ 13 จอกับภาพ v3 ในหน้าตรวจ · Safari Firefox เครื่องจริง และโปรแกรมอ่านหน้าจอ (S4) · ที่อยู่ LAN จริง

## 5. Migration และ Rollback

- ไม่มี migration · เซฟและ schema ไม่เปลี่ยน · `CARD_FACES` และ `thumb` เพิ่มฟิลด์อย่างเดียว · ย้อนกลับด้วยการ revert commit นี้ (เกมกลับไปอ่าน manifest v2 ทั้งไฟล์)

## 6. ความเสี่ยงและสิ่งที่ต้องทำต่อ (Risks & Next Steps)

1. **T5 รอ PO:** เปิด `node tools/dev/serve-review.mjs` แล้วเล่น `/` จนจบ Act 1 บนเครื่องของ PO และมือถือ แล้วบันทึกผลสั้น ๆ (อุปกรณ์ เบราว์เซอร์ เวลาที่ใช้ สิ่งที่สะดุด) บนกระดาน · เมื่อได้บันทึกจึงติ๊ก T5 ใน commit เล็กของ PR เดียวกัน
2. **ข้อความของ Act 2–5 ในหน้าตรวจ:** มาจาก fixture ของ v3 ซึ่งยกจากพิมพ์เขียว แต่ยังไม่ผ่านการรับรองของ T6–T12 · เป็นข้อมูลของหน้าตรวจเท่านั้น ไม่ส่งไปกับเกม
3. **ภาพย่อที่สร้างตอนเล่น:** ถ้า Astra ส่งภาพใบหน้าขนาดการ์ดใน Slice 2 ให้เพิ่มลง manifest แล้วเลิก `thumb` ได้โดยไม่ต้องแก้ชิ้นส่วนอื่น
4. **ของหกชิ้นในทะเบียนของแพ็กเกจ:** ชื่อของทั้งหกชิ้นอยู่ในแพ็กเกจที่ส่ง (schema ต้องมีทะเบียนของ) จึงมีไอคอนหกชิ้นใน manifest ของสื่อ · ถ้า PO ต้องการซ่อนริบบิ้นและนกหวีดจนถึง Act 3–4 ต้องให้ compiler ตัดทะเบียนของตามองก์ที่ promote (ตัดสินใน T6)
