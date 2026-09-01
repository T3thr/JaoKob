# มาตรฐานการบันทึกประวัติการเปลี่ยนแปลง (Changelog & Audit Log Standard)

เอกสารฉบับนี้กำหนดมาตรฐานการบันทึกประวัติการทำงาน (Change Record & Audit Trail) สำหรับโครงการ **JaoKob**  
อ้างอิงตามมาตรฐานสากล **ISO/IEC/IEEE 12207:2017** (Configuration Management Process) และ **ISO 9001:2015** (Control of Documented Information) สำหรับการพัฒนาเกมและซอฟต์แวร์ที่ทำงานร่วมกับ AI Agent

---

## 1. ทำไมต้องแยกบันทึกตามช่วงเวลา? (Rationale)

1. **ป้องกันไฟล์บวม (Prevent Monolithic File Bloat):** หากรวมทุกการสั่งงาน AI ไว้ใน `CHANGELOG.md` ไฟล์เดียว เมื่อผ่านไปหลายรอบไฟล์จะมีขนาดใหญ่มาก ทำให้เปลือง Token โดยไม่จำเป็นเมื่อต้องเปิดอ่าน
2. **ป้องกันความขัดแย้ง (Avoid Merge Conflicts):** การแยกไฟล์ตามแต่ละรอบการทำงาน (Session) ช่วยให้การพัฒนาแบบหลายสายงานหรือหลาย Agent ไม่เกิดการแก้ไฟล์ชนกัน
3. **บันทึกลึกระดับ Audit Trail:** รองรับการบันทึกรายละเอียดระดับวัน เวลา ผู้สั่งงาน วัตถุประสงค์ของ Prompt, Requirement IDs ที่ได้รับผลกระทบ และหลักฐานการทดสอบ (Verification Evidence)

---

## 2. ความสัมพันธ์ระหว่าง Root `CHANGELOG.md` และ `docs/changelog/`

| ตำแหน่ง | ประเภท | มาตรฐาน | ผู้ใช้งานหลัก | หน้าที่ |
|---|---|---|---|---|
| **Root [CHANGELOG.md](../../CHANGELOG.md)** | **Release Level** | Keep a Changelog / SemVer | ผู้เล่น, ผู้บริหาร, Release Manager | สรุปภาพรวมระดับเวอร์ชัน (Features, Fixes, Breaking Changes) อย่างกระชับ |
| **โฟลเดอร์ [docs/changelog/](.)** | **Execution / Session Level** | ISO/IEC/IEEE 12207 Audit Trail | นักพัฒนา, AI Agent, QA Lead | บันทึกรายละเอียดเชิงลึกของทุกรอบที่สั่งงาน AI (Timestamp, Prompt, Traceability, Tests) |

---

## 3. โครงสร้างและการตั้งชื่อไฟล์ (Directory & Naming Convention)

### 3.1 การจัดโฟลเดอร์ตาม เดือน/ปี
จัดเก็บแยกตามโฟลเดอร์ปีและเดือนในรูปแบบ `YYYY-MM` (เช่น `2026-08/`, `2026-09/`) เพื่อให้เรียงลำดับตามตัวอักษรและเวลาได้อย่างถูกต้อง

```text
docs/changelog/
├── README.md                      <-- (หน้านี้) มาตรฐานและแม่แบบการบันทึก
├── 2026-08/                       <-- สิงหาคม 2026
│   └── 2026-08-31-1941-phase-0-baseline.md
└── 2026-09/                       <-- กันยายน 2026
    ├── 2026-09-01-1350-sprint-1-prep.md
    └── YYYY-MM-DD-HHmm-<task-slug>.md
```

### 3.2 รูปแบบชื่อไฟล์ (File Naming)
`YYYY-MM-DD-HHmm-<short-slug>.md`
* `YYYY-MM-DD`: วันที่บันทึก (พ.ศ. ค.ศ. สากล)
* `HHmm`: เวลาท้องถิ่นแบบ 24 ชั่วโมง (เช่น `1350` = 13:50 น.)
* `<short-slug>`: คำอธิบายงานสั้นๆ คั่นด้วยเครื่องหมายขีดกลาง (kebab-case) เช่น `core-state-machine`

---

## 4. แม่แบบบันทึกประจำรอบ (Session Change Record Template)

เมื่อ AI Agent ปฏิบัติงานเสร็จในแต่ละรอบ ให้สร้างไฟล์บันทึกตามแม่แบบนี้เสมอ:

```markdown
# Change Record: [ชื่อสรุปงานที่ทำ]

- **รหัสบันทึก (Record ID):** CR-YYYYMMDD-HHmm
- **วันและเวลา (Timestamp):** YYYY-MM-DDTHH:mm:ss+07:00
- **รอบการพัฒนา (Sprint/Milestone):** [เช่น Sprint 1 / Phase 1A]
- **ผู้ปฏิบัติงาน (Operator/Persona):** [เช่น Senior Software Architect / AI Agent]
- **สถานะ (Status):** [Completed / In-Progress / Blocked]

---

## 1. วัตถุประสงค์และคำสั่ง (Prompt Objective & Request)
[ระบุข้อความหรือสรุปสิ่งที่ผู้ใช้สั่งงานในรอบนี้]

## 2. ข้อกำหนดที่ได้รับผลกระทบ (Traceability & Requirement IDs)
- **Requirement IDs:** [เช่น FR-STA-001, FR-ENG-001, CON-002]
- **สถาปัตยกรรมที่เกี่ยวข้อง (ADRs):** [เช่น ADR-P0-001, ADR-P0-004]

## 3. สิ่งที่ทำและรายการไฟล์ที่เปลี่ยนแปลง (Manifest of Changes)
### 3.1 ไฟล์ที่สร้างใหม่ (Created)
- \`path/to/new-file.js\`: [หน้าที่ของไฟล์]

### 3.2 ไฟล์ที่แก้ไข (Modified)
- \`path/to/modified-file.js\`: [รายละเอียดการแก้และเหตุผล]

### 3.3 ไฟล์ที่ลบ (Deleted)
- (ถ้ามี)

## 4. ผลการทดสอบและการตรวจรับ (Verification & Quality Evidence)
- **การทดสอบที่รัน:** [ระบุคำสั่งและผลการทดสอบ Unit/Contract/E2E]
- **Quality Gates ที่ผ่าน:** [เช่น SCHEMA-GATE, CORE-GATE, A11Y-GATE]

## 5. ความเสี่ยงและสิ่งที่ต้องทำต่อ (Risks & Next Steps)
- **งานคงค้างสำหรับรอบถัดไป:** [...]
- **ข้อควรระวัง:** [...]
```

---

## 5. กฎข้อบังคับสำหรับ AI Agent (Mandatory Agent Instructions)
1. **ห้ามละเลยการสร้างบันทึก:** หลังเสร็จสิ้นการเขียนหรือแก้ไขโค้ดทุกครั้ง AI Agent ต้องสร้างไฟล์บันทึกในโฟลเดอร์เดือนปัจจุบัน
2. **สรุปเข้า Root Changelog:** นำหัวข้อสำคัญจากบันทึกรอบนี้ไปสรุปสั้นๆ (1-3 บรรทัด) ใน [CHANGELOG.md](../../CHANGELOG.md) พร้อมใส่ลิงก์ชี้มายังไฟล์บันทึกฉบับเต็มในหน้านี้
