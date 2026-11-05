# Change Record: มติ 2026-11-05 · Q11 · เซฟต้นแบบผูก digest · C3 บนเครื่อง PO · เริ่ม C4

- **รหัสบันทึก (Record ID):** CR-20261105-1430
- **วันและเวลา (Timestamp):** 2026-11-05T14:30:00+07:00
- **รอบการพัฒนา (Sprint/Milestone):** Sprint 5 · Slice 1 · หลังปิด checkpoint C3 และเริ่ม C4 (T4)
- **ผู้ปฏิบัติงาน (Operator/Persona):** Claude · Supreme Core Architect & Lead Game Systems Engineer
- **สถานะ (Status):** Completed · บันทึกมติล้วน ไม่มีโค้ด · งานของ C4 อยู่ในบันทึกถัดไป

---

## 1. วัตถุประสงค์และคำสั่ง (Prompt Objective & Request)

PO เปิด session ใหม่เพื่อเริ่ม C4 และให้บันทึกมติสามข้อที่ยังไม่อยู่ในเอกสารเป็นอย่างแรก:

1. **Q11 ใน `[S5-010]`:** Antigravity เห็นชอบให้ transaction และเกราะ race อยู่ใน `journey-save-repository.js` แยกจาก `local-storage-adapter.js` ของ Sprint 4 ที่แช่แข็งไว้ เพราะตรงกับ ADR-P0-034 D1.2 และ D7.3 และเมื่อถอด runtime เดิมใน C5 จะเหลือชุดเดียว
2. **เซฟต้นแบบผูก digest:** PO รับทราบและเห็นชอบตาม D7
3. **C3 บนเครื่อง PO:** commit `1753764` อยู่บน `origin/feat/sprint-05-slice-01-foundations` แล้ว เครื่องหลักของ PO ซิงก์และรัน unit 1,270/1,270 ผ่าน

สถาปนิกเสนอแผน C4 พร้อมการตีความสามข้อ แล้ว PO อนุมัติทั้งหมด:

1. ภาพ Tachie ที่มีจริงเป็น 1024×1024 ไม่ใช่ผ้าใบ 2:3 ตามฟิสิกส์ v2 §8.1 จึงใช้ตารางจุดตาต่อภาพ เพื่อให้ตาอยู่ในแถบใบหน้า 52–68% ทุก viewport
2. วัสดุกระจกฝ้าเปลี่ยนเป็นพื้นทึบด้วย `prefers-reduced-transparency` · `forced-colors` · เบราว์เซอร์ที่ไม่มี `backdrop-filter` และ `highContrast` ที่มีในเซฟอยู่แล้ว โดยไม่เพิ่มช่องตั้งค่าใน schema
3. `index.html` คงเดิมจนถึง C5 · หน้าตรวจของจริงอยู่ที่ `docs/design-system/evidence/journey-review/` นอก release allowlist เล่น Act 1 บนแอป Journey จริง และพาข้ามศึก แคมป์ และสัมผัส (งานของ C5) ด้วยคำสั่งจริงของ engine

## 2. ข้อกำหนดที่ได้รับผลกระทบ (Traceability & Requirement IDs)

- **ADRs:** ADR-P0-034 D1.2 (runtime เดิมแช่แข็ง) · D7 (Save Format 2 journey profile · digest) · D7.3 (transaction และเกราะ race) · D10 (ต้นแบบ วัสดุ กำแพงกันสปอยล์) · ADR-P0-032 D7.1–D7.2 (Tachie และแถบใบหน้า)
- **Sprint 5 WBS:** T3 ไม่เปลี่ยนสถานะ (รอ resolver ของสื่อ Journey ใน C5) · T4 เริ่ม
- **Verification IDs:** `TC-S5-SAVE-001` · `TC-S5-SAVE-002` (ข้อยุติของ D7.3) · `TC-S5-VN-001` · `TC-S5-HUD-001` · `TC-S5-SILENT-001` · `TC-S5-A11Y-001` (เกณฑ์ของ C4)

## 3. สิ่งที่ทำและรายการไฟล์ที่เปลี่ยนแปลง (Manifest of Changes)

### 3.1 ไฟล์ที่สร้างใหม่ (Created)

- `docs/changelog/2026-11/2026-11-05-1430-po-decisions-q11-prototype-digest-and-c4-start.md`: บันทึกนี้

### 3.2 ไฟล์ที่แก้ไข (Modified)

- `docs/sprints/sprint-05-ssot.md`: วันที่และสถานะ (C4 กำลังทำ) · §1.2 สี่แถวใหม่ (Q11 · เซฟต้นแบบ · C3 บนเครื่อง PO · C4 และการตีความสามข้อ) · §4.2 สถานะของ C4 · §7 แถวใหม่
- `docs/dialogue/sprint-05/core-architect-notebook.md`: ฐานที่ตรวจ · สถานะ · แผน C4 ตามที่อนุมัติ · R21 PO รับทราบ · R22 ปิด · R23 ใหม่ (จุดตาต่อภาพ) · Q11 ตอบแล้ว · บันทึกการตัดสินใจ
- `docs/dialogue/sprint-05/BOARD.md`: `[S5-011]`
- `CHANGELOG.md`: สรุปหนึ่งรายการ

### 3.3 ไฟล์ที่ลบ (Deleted)

- ไม่มี

## 4. ผลการทดสอบและการตรวจรับ (Verification & Quality Evidence)

| คำสั่ง | ผล |
|---|---|
| `node --test 'tests/unit/**/*.test.js'` | ผ่านทั้งหมด 1,270 (ไม่เปลี่ยนจาก C3) |
| `node tests/docs/check-doc-links.mjs` | ผ่าน ไม่มีลิงก์เสีย |
| `git diff --stat` | เปลี่ยนเฉพาะเอกสาร ไม่มีโค้ด schema หรือเนื้อหาเกม |

ฐานที่ตรวจก่อนเริ่ม: `HEAD` = `origin/feat/sprint-05-slice-01-foundations` = `1753764` · `origin/develop` = `0f3cd6d` · working tree สะอาด · ตัวตน Git ของ session นี้ถูกตั้งเป็น `T3thr <t.theerapat33@gmail.com>` ใน local config ก่อน commit

## 5. Migration และ Rollback

- ไม่มี migration · ย้อนกลับด้วยการ revert commit นี้ · runtime schema และเซฟไม่ถูกแตะ

## 6. ความเสี่ยงและสิ่งที่ต้องทำต่อ (Risks & Next Steps)

1. **R21:** คำเตือนของ compiler เมื่อ digest เปลี่ยนแต่ contentVersion เท่าเดิมยังรอ T6 · สถาปนิกแจ้ง PO ก่อนส่งต้นแบบแต่ละรอบ
2. **R23:** ตารางจุดตาต้องปรับเมื่อ Astra ส่งภาพตามผ้าใบมาตรฐาน
3. **C4 ต่อไป:** ชิ้นแรกที่ดูได้ (token · กระจกฝ้า · การ์ดกระดาษสา · HUD · เวที Tachie · กล่องบทพูด · การ์ดตัวเลือก · ป้ายชื่อฉาก · หน้าตรวจ) แล้วหยุดรอความเห็นของ PO
