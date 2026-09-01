# JaoKob Documentation Reorganization Log

รหัสบันทึก: `JKB-DOC-REORG-001`  
วันที่: 1 กันยายน 2026  
สถานะ: Applied Baseline Reorganization  
มาตรฐานอ้างอิง: ISO/IEC/IEEE 12207:2017 (Configuration Management), ISO/IEC/IEEE 29148:2018  

---

## 1. วัตถุประสงค์ (Objective)

บันทึกการจัดระเบียบเอกสารในไดเรกทอรี `docs/` เพื่อยกระดับจากโครงสร้างชั่วคราวใน Phase 0 สู่โครงสร้างเอกสารระดับองค์กรสากล (Enterprise-Grade Documentation Architecture) พร้อมรองรับการดำเนินงานในรูปแบบ Agile Sprint และการควบคุมการทำงานของ AI Agent อย่างมีระบบและตรวจสอบย้อนกลับได้ (Audit Trail)

---

## 2. ตารางเปรียบเทียบ โครงสร้างเดิม vs โครงสร้างใหม่ (Before vs After)

| รายการ | โครงสร้างเดิม (Phase 0 Flat) | โครงสร้างใหม่ (Enterprise Organized) | วัตถุประสงค์และเหตุผลการเปลี่ยนแปลง |
|---|---|---|---|
| **Portal เอกสารหลัก** | ไม่มี `docs/README.md` (มีเฉพาะ `docs/phase-0/README.md`) | สร้าง [docs/README.md](file:///Users/3rapat/MyWork/Project/WebApp/games/jao-kob/docs/README.md) เป็น Master Portal | เป็นศูนย์กลางนำทางเอกสารทั้งหมด แยกตามวงจรชีวิตและบทบาท |
| **บันทึกการเปลี่ยนแปลง (Changelog)** | ไม่มี (รอเปิดไฟล์ใหม่) | สร้าง [CHANGELOG.md](file:///Users/3rapat/MyWork/Project/WebApp/games/jao-kob/CHANGELOG.md) ที่ Root | ใช้มาตรฐาน Keep a Changelog ติดตามประวัติทุก Release/Sprint ให้ AI และทีมงานจดจำงานที่ผ่านมาได้ |
| **Sprint Management (SSOT)** | รวมอยู่ในภาพรวม Phase 0 ขาดเอกสารเจาะจง Sprint ปัจจุบัน | สร้างไดเรกทอรี `docs/sprints/` และไฟล์ [docs/sprints/sprint-01-ssot.md](file:///Users/3rapat/MyWork/Project/WebApp/games/jao-kob/docs/sprints/sprint-01-ssot.md) | เป็น Single Source of Truth (SSOT) สำหรับ Sprint 1 (Vertical Slice) กำหนดขอบเขต, DoR, DoD, Requirement IDs และ WBS ชัดเจน |
| **การตัดสินใจสถาปัตยกรรม (ADRs)** | ฝังอยู่ในตาราง `04-architecture-blueprint.md` | สร้างไดเรกทอรี `docs/adr/` และดัชนี ADR Registry | รองรับการเพิ่ม Architecture Decision Records ในอนาคตเมื่อระบบขยายตัว |
| **การตรวจสอบย้อนกลับ (Traceability)** | อยู่ใน `08-verification-traceability-and-quality-gates.md` | สร้างไดเรกทอรี `docs/traceability/` เพื่อรองรับ Matrix ย่อยของแต่ละ Sprint | แยก Matrix ระดับละเอียดออกจากนโยบายหลัก |
| **โครงสร้างโค้ดสำหรับการพัฒนา** | มีเฉพาะแผนภาพในเอกสาร `05-production-directory-plan.md` | จัดเตรียม Skeleton Folders ภายใต้ `src/` และ `tests/` | รองรับการเริ่มเขียนโค้ดของ AI Agent ใน Sprint 1 ทันที โดยไม่ทำลาย Dependency Rule |

---

## 3. รายละเอียดการเปลี่ยนแปลง (Detailed Changes)

### 3.1 สิ่งที่ยังคงเดิม (Preserved Artifacts)
- เอกสาร baseline ทั้งหมดใน `docs/phase-0/` (จำนวน 10 ไฟล์: `00-*` ถึง `08-*` และ `README.md`) คงเดิม 100% ไม่มีการลบหรือย้ายที่อยู่ เพื่อรักษาความถูกต้องของลิงก์ย้อนกลับ (Traceability Links) ในระบบ
- สัญญาข้อมูลใน `specs/schemas/` ทั้ง 7 ไฟล์ยังคงตำแหน่งเดิม

### 3.2 สิ่งที่สร้างเพิ่ม (Added Artifacts)
1. `docs/README.md`: ดัชนีหลักสำหรับบริหารจัดการเอกสารทั้งโครงการ
2. `docs/sprints/sprint-01-ssot.md`: เอกสาร SSOT ประจำ Sprint 1: Core Vertical Slice
3. `CHANGELOG.md`: บันทึกประวัติการทำงานของโครงการระดับ Release
4. `docs/changelog/`: มาตรฐานและคลังเก็บบันทึกประวัติการทำงานระดับ Execution Session (แยกรายเดือน/ปี เช่น `2026-08/`, `2026-09/`) เพื่อป้องกันไฟล์บวมและให้ตรวจสอบย้อนหลังได้ระดับวัน-เวลา
5. Skeleton Directories:
   - `src/bootstrap/`
   - `src/core/domain/`, `src/core/state-machine/`, `src/core/use-cases/`, `src/core/events/`, `src/core/ports/`
   - `src/ui/renderers/dom/`, `src/ui/views/`, `src/ui/components/`, `src/ui/accessibility/`, `src/ui/styles/`
   - `src/data/content/`, `src/data/localization/`, `src/data/repositories/`, `src/data/persistence/`, `src/data/migrations/`, `src/data/validation/`
   - `tests/unit/`, `tests/fixtures/`

---

## 4. ผลกระทบต่อกระบวนการทำงานของ AI Agent (AI Agent Impact Analysis)
- **ประหยัด Token:** Agent สามารถอ่านเฉพาะ `docs/sprints/sprint-01-ssot.md` เพื่อเริ่มงาน Sprint 1 ได้ทันที โดยไม่ต้องโหลดเอกสาร Phase 0 ครบทั้ง 9 ไฟล์
- **ป้องกัน Context Drift:** Agent จะมีกรอบการทำงานที่ชัดเจนว่า Sprint ปัจจุบันทำอะไร และห้ามทำอะไร (Non-goals)
- **สร้าง Memory ถาวร:** มี `CHANGELOG.md` เป็นบันทึกความจำของโครงการ ทำให้ Agent ตัวต่อไปรู้สถานะล่าสุดเสมอ
