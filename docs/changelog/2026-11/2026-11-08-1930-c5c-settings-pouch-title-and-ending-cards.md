# Change Record: C5c · แผงตั้งค่าและกระเป๋า · หน้าแรกของจริง · การ์ดฉากจบสามเกลียว · การ์ดจบบท

- **รหัสบันทึก (Record ID):** CR-20261108-1930
- **วันและเวลา (Timestamp):** 2026-11-08T19:30:00+07:00
- **รอบการพัฒนา (Sprint/Milestone):** Sprint 5 · Slice 1 · checkpoint C5 (T5) งานย่อย C5c
- **ผู้ปฏิบัติงาน (Operator/Persona):** Claude · Supreme Core Architect & Lead Game Systems Engineer
- **สถานะ (Status):** Completed (C5c) · T5 กำลังทำ · ถัดไป C5d

---

## 1. วัตถุประสงค์และคำสั่ง (Prompt Objective & Request)

PO สั่งให้ทำ C5c ต่อจาก C5b ทันที: modal ตั้งค่าจริงตาม UX §1.9 และ modal กระเป๋าสาน (`I` เปิด · `Esc` ปิด · กักโฟกัสและคืนโฟกัสตาม WCAG 2.2) · หน้าแรกของ Journey ที่สมบูรณ์ (เริ่ม · เล่นต่อโดยไม่เขียนทับ · ยินยอมก่อนเริ่มใหม่เมื่อมีเซฟคุ้มครอง · ข้อความคลังเซฟเก่าครั้งเดียว) · `ThreeStrandDestinyCard` ของโหมด `ENDING_RESONANCE` ตาม UX §6 ทดสอบบนแพ็กเกจจิ๋ว

## 2. ข้อกำหนดที่ได้รับผลกระทบ (Traceability & Requirement IDs)

- **ADRs:** ADR-P0-034 D7–D8 (หน้าแรก ยินยอม คลังเซฟเก่า) · D9.1 (MODALS ของ play-mode: เกมรอ) · D9.3 (ตั้งค่าไม่ยกเลิกการ์ดที่ arm) · ADR-P0-020 (ความทรงจำของกระเป๋า) · ADR-P0-019 P4 (modal)
- **สัญญาออกแบบ:** UX §1.6 · §1.7 (MODAL) · §1.9 · §6.1–§6.3 · Atomic 05 §3.5 · มหาพิมพ์เขียว §2.13
- **Sprint 5 WBS:** T5 กำลังทำ
- **Verification IDs:** `TC-S5-A11Y-001` · `TC-S5-UX-001` · `TC-S5-SAVE-001` · `TC-S5-LEGACY-001` · `TC-S5-ENDING-001` (หน้าจอ)

## 3. สิ่งที่ทำและรายการไฟล์ที่เปลี่ยนแปลง (Manifest of Changes)

### 3.1 ไฟล์ที่สร้างใหม่ (Created)

- `src/ui/journey/components/journey-modal.js`: `JourneyModal` · `<dialog>` แบบ `showModal()` ให้เบราว์เซอร์ทำให้ทุกอย่างข้างหลัง inert · หัวเรื่องกับปุ่มปิดที่ไม่เลื่อนหาย · Escape ปิด · Tab และ Shift+Tab วนอยู่ในกรอบ · คืนโฟกัสที่เดิม · host ที่ไม่มี `showModal` ได้ `role="dialog"` `aria-modal` และกับดัก Tab เดียวกัน
- `src/ui/journey/components/settings-panel.js`: ขนาดตัวอักษร 100 125 150 175 200% · ลดการเคลื่อนไหว · ลดความเข้มแสง · คอนทราสต์สูง · ยืนยันสองจังหวะ · ป้ายแก้ทาง · สัมผัสอัตโนมัติ · ใช้ radio และ checkbox แบบ native ทุกตัวพร้อมคำอธิบายหนึ่งบรรทัด · แสดงค่าที่แอปเก็บจริงเสมอ
- `src/ui/journey/components/pouch-panel.js`: สี่ช่องในกระเป๋า (กระดุม `ฝากไม่ได้` · ของ `พร้อมผสาน`) และความทรงจำของกระเป๋า (`ฝากไปแล้ว` · `ไม่ได้รับไว้`)
- `src/ui/journey/components/three-strand-destiny-card.js`: `ThreeStrandDestinyCard` · ก E-HOME · ข E-POND · ค E-DAWN ลำดับคงที่ · เกลียวที่ผ่านสว่างตามสีของมัน เกลียวที่ยังไม่ผ่านเป็นด้ายเทาจาง · เกลียวคู่วาดเป็นเชือกสลับสี (กรมท่ากับทองเหลือง · ต้นกกกับเมล็ด · สามสีสายใย) · ลูกปัดกระดุมที่ปมของ E-HOME ปมธรรมดาของ E-POND ปมสองชั้นของ E-DAWN · ฉากจบที่ปิดยังโฟกัสได้พร้อมบรรทัดของเงื่อนไขแรกที่ขาด · Safety Fallback มีเกลียวกกเส้นที่สี่พันรอบปมพร้อมบรรทัดของมัน · ไม่มีตัวเลข
- `src/ui/journey/components/journey-title.js`: `JourneyTitle` · ชื่อแพ็กเกจบนฉากเปิดเรื่องกับกระจกฝ้า · `เล่นต่อ` ไม่เขียน · `เริ่มการเดินทาง` ถามก่อนแบบ inline เมื่อมีระเบียน (token อยู่ใน shell ไม่ถึงหน้าจอ) · `เล่นโดยไม่บันทึก` เมื่อระเบียนถูกคุ้มครอง · ข้อความแจ้งพร้อม `รับทราบ` · ตั้งค่าก่อนเริ่มได้
- `src/ui/styles/journey-panels.css`: modal แผงตั้งค่า แผงกระเป๋า หน้าแรก การ์ดฉากจบ การ์ดจบบท · ลดการเคลื่อนไหว คอนทราสต์สูง forced colors · จอแคบ จอกว้าง จอนอน
- `tests/unit/journey-panels.test.js` (11)
- `tests/e2e/journey-c5c-panels.mjs`: หลักฐานเบราว์เซอร์ 5 viewport × ตัวอักษร 100/200% × ห้าสถานะ · คีย์บอร์ดล้วน · ผลที่ [evidence/sprint-05/c5c](../../../tests/e2e/evidence/sprint-05/c5c/report.json) (ภาพ 20 ภาพ)
- `docs/changelog/2026-11/2026-11-08-1930-c5c-settings-pouch-title-and-ending-cards.md`: บันทึกนี้

### 3.2 ไฟล์ที่แก้ไข (Modified)

- `src/core/domain/keepsake-pouch.js`: `refusedItemOf` (โทเคนความทรงจำของการปฏิเสธ → รหัสของ)
- `src/core/use-cases/journey-session.js`: `hud.pouch` มี `released` และ `refused` (เพิ่มฟิลด์อย่างเดียว เซฟไม่เปลี่ยน)
- `src/data/content/journey-presentation.js`: โมเดล `endings` `pouchPanel` และ `title()` · `pending` เหลือเฉพาะเขตแดนและจบเรื่อง
- `src/data/localization/th-journey.js`: คำของตั้งค่า กระเป๋า หน้าแรก การ์ดฉากจบ และการ์ดจบบท
- `src/ui/journey/journey-renderer.js`: ปุ่มเฟือง ปุ่มกระเป๋า และ `I` เปิด modal จริง · ระหว่างเปิดเกมรอและไม่ส่งคำสั่ง (สัมผัสที่สำเร็จระหว่างนั้นรอส่งตอนปิด) · การ์ดที่ arm ไว้ยังอยู่ · โหมดฉากจบส่ง `chooseEnding` แบบ arm/commit · การ์ดจบบทที่เขตแดนและหลังฉากจบพร้อม `กลับหน้าแรก` · `focusEntry` ส่งโฟกัสเข้าเกมเมื่อเริ่มจากหน้าแรก · `I` ทำงานเมื่อโฟกัสอยู่บนปุ่ม (เดิมทำงานเฉพาะเมื่อไม่มีโฟกัสบนปุ่ม ซึ่งระหว่างเล่นแทบไม่เกิด) และงดเฉพาะช่องพิมพ์
- `src/bootstrap/journey-shell.js`: ประกอบหน้าแรกจริง · ส่งการเปลี่ยนตั้งค่าและการกลับหน้าแรกเข้าแอป Journey · เก็บ consent token ไว้ใน shell · ส่งโฟกัสเข้าเกมเมื่อเริ่มจากหน้าแรก
- `src/ui/journey/journey-icons.js`: ไอคอนปิด
- `docs/design-system/evidence/journey-review/play.html` · `play.js` · `review.css` · `index.html` · `frame.js`: หน้าตรวจใช้หน้าแรก ตั้งค่า กระเป๋า และการ์ดจบบทของจริงจาก `src/` ทั้งหมด ถอด chrome เดิมของหน้าตรวจ (หน้าแรก ปุ่มข้าม แผงตั้งค่าและกระเป๋าชั่วคราว) · ลิงก์ไปแพ็กเกจจิ๋ว
- `tests/e2e/journey-c4-design-system.mjs`: รับ `JKB_CHROMIUM_PATH` เหมือน runner ใหม่
- `tests/unit/journey-encounter-screens.test.js`: ตรวจว่า modal กระเป๋าไม่เปิดระหว่างสัมผัส
- `tests/e2e/README.md` · `docs/sprints/sprint-05-ssot.md` (T5 · §7) · `docs/traceability/sprint-05-execution-matrix.md` 0.3.6 · `docs/dialogue/sprint-05/core-architect-notebook.md` · `BOARD.md` (`[S5-016]`) · `CHANGELOG.md`

### 3.3 ไฟล์ที่ลบ (Deleted)

- ไม่มี (chrome ของหน้าตรวจถูกถอดออกจากไฟล์เดิม)

## 4. ผลการทดสอบและการตรวจรับ (Verification & Quality Evidence)

| คำสั่งหรือการตรวจ | ผล |
|---|---|
| `node --test 'tests/unit/**/*.test.js'` | ผ่านทั้งหมด 1,334 (เดิม 1,323 · ใหม่ 11) |
| `node tests/docs/check-doc-links.mjs` | ผ่าน ไม่มีลิงก์เสีย |
| `node tests/e2e/journey-c5c-panels.mjs` (Chromium 151 headless) | 50 สถานะ 0 ล้ม · ไม่มีเลื่อนแนวนอน · เป้ากด ≥ 44 × 44 รวมปุ่มขนาดตัวอักษรบนจอ 320 px · modal อยู่ในจอพร้อมปุ่มปิดในสายตา · การ์ดฉากจบและการ์ดจบบทอยู่ใต้แถบใบหน้า · คีย์บอร์ดล้วน: Enter เริ่มจากหน้าแรก I เปิดกระเป๋า Escape คืนโฟกัส Tab ไม่หลุดจาก modal ตั้งค่า การ์ดจบบทพากลับหน้าแรกพร้อมโฟกัสที่ `เล่นต่อ` · ไม่มี error และ request นอก origin |
| `node tests/e2e/journey-c5b-encounters.mjs` และ `journey-c4-design-system.mjs` (รันซ้ำเพื่อตรวจถดถอย ไม่ commit ผลใหม่ของ C4) | C5b 60 สถานะ 0 ล้ม · C4 54 สถานะ 44 ตัวอย่างคอนทราสต์ 0 ล้ม บทพูดแย่สุด 8.9 : 1 HUD 8.1 : 1 layout shift 0.00007 คีย์บอร์ดล้วนถึงทางเลือก A1-03 |
| ข้อค้นพบจากเบราว์เซอร์จริงที่แก้ก่อนส่ง | เริ่มเกมจากหน้าแรกแล้วโฟกัสค้างบนปุ่มที่ซ่อนไป คีย์ลัดจึงไม่ถึงเกม (แก้ด้วย `focusEntry`) · ปุ่มขนาดตัวอักษรกว้าง 42 px บนจอ 320 px (ลด padding ของ modal บนจอแคบ) |

**ยังไม่ได้ตรวจ:** สายตา PO · Safari และเครื่องจริง · การฟังด้วย VoiceOver หรือ NVDA · ฉากจบจริงของ Act 5 (Slice 3) · ระดับเสียงในตั้งค่า (T7)

## 5. Migration และ Rollback

- ไม่มี migration · view ของ Core เพิ่มฟิลด์อย่างเดียว เซฟไม่เปลี่ยน · ย้อนกลับด้วยการ revert commit นี้

## 6. ความเสี่ยงและสิ่งที่ต้องทำต่อ (Risks & Next Steps)

1. **C5d ถัดไป:** resolver ของสื่อ Journey ที่ตรวจ SHA-256 ระดับไบต์ แล้วติ๊ก T3
2. **ตั้งค่าเสียง:** schema มีระดับเสียงสี่ช่องแล้ว แต่ยังไม่มีเสียงในเกม แผงตั้งค่าจึงยังไม่แสดง ระดับเสียงมากับ T7
3. **การ์ดจบบท:** ถ้อยคำ `เรื่องหน้าต่อจากนี้ยังไม่เปิด` เป็นคำของต้นแบบ ตรวจในรอบภาษาไทยของ T6
4. **push:** commit ของ C5b และ C5c อยู่ในเครื่อง รอ PO เลือกบัญชี GitHub ที่มีสิทธิ์ push (บัญชีที่ active บนเครื่องคือ `3-rapat` ซึ่งถูกปฏิเสธ)
