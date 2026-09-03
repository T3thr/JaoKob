# Change Record: Sprint 2 SSOT Baseline for Content Expansion

- **รหัสบันทึก (Record ID):** CR-20260904-0228
- **วันและเวลา (Timestamp):** 2026-09-04T02:28:52+07:00
- **รอบการพัฒนา (Sprint/Milestone):** SPRINT-02 / Phase 2A / Planning Baseline
- **ผู้ปฏิบัติงาน (Operator/Persona):** Senior Technical Lead & Narrative Operations Director / AI Agent
- **สถานะ (Status):** Planning draft completed; pending Owner Review and execution-contract decisions
- **Change Class:** C2 cross-layer specification proposal; ไม่มี runtime behavior change ในรอบนี้

---

## 1. วัตถุประสงค์และคำสั่ง (Prompt Objective & Request)

จัดทำ `docs/sprints/sprint-02-ssot.md` เพื่อวางแผน Content Engine Architecture & Act 1 Full Narrative Package เท่านั้น พร้อม Change Record, Root CHANGELOG, commit/push และ PR ไป `develop` ตามคำสั่งเจ้าของโครงการ ไม่เขียน Production Code หรือแก้ไฟล์ `src/`, schemas หรือ tests

ใช้ `jaokob-spec-loop` ตาม Intake → Impact → Plan → Implement documentation → Verify → Trace and Report อ่าน AGENTS, Operations Manual, Phase 0 ที่ควบคุมงาน, Sprint 1 SSOT, closeout record, schemas และ source/tests ปัจจุบัน พร้อมแยกผู้ช่วยตรวจ Narrative และ Data/Application contracts แบบ read-only

## 2. ข้อกำหนดที่ได้รับผลกระทบ (Traceability & Requirement IDs)

- **Scope / Content:** `GDD-SCP-003`, `DEC-002`, `FR-CNT-001` ถึง `FR-CNT-006`, `DR-001` ถึง `DR-012`
- **Narrative / Mechanics:** `NAR-ACT-001`, `NAR-ACT-002`, `NAR-SC-A1-001` ถึง `NAR-SC-A1-007`, `NAR-BRN-001` ถึง `NAR-BRN-004`, `GDD-DEC-A1-001-A/B`, `GDD-DEC-A1-002-A/B`, `GDD-UX-003`, `NAR-CON-005`
- **Integration:** `FR-ENG-001` ถึง `FR-ENG-004`, `FR-ENG-008`, `FR-LOC-001` ถึง `FR-LOC-003`, `FR-SAV-*`, `FR-ACC-*`, `NFR-MA-001`, `NFR-MA-004`, `NFR-SE-002/003`
- **ADRs:** `ADR-P0-003` immutable JSON package, `ADR-P0-008` Thai fallback; ไม่มีการแก้ Accepted ADR
- **Change Requests:** เชื่อม [CR-0001](../../rfc/CR-0001-sprint-01-core-contract-clarifications.md) เรื่อง flag-policy gap และเปิด `CR-0002` เป็น RFC ภายใน [SSOT Section 3.5](../../sprints/sprint-02-ssot.md#35-rfc-ภายในแผน-cr-0002--act-1-package-execution-contract) ไม่ยกระดับข้อเสนอเป็น Approved Requirement

## 3. สิ่งที่ทำและรายการไฟล์ที่เปลี่ยนแปลง (Manifest of Changes)

### 3.1 ไฟล์ที่สร้างใหม่ (Created)

- [Sprint 2 SSOT](../../sprints/sprint-02-ssot.md): metadata และเจ็ด sections ตาม Sprint 1; 5 Tasks พร้อม owners/dependencies/AC, 7-scene Canon map, exact choice effects, graph test strategy 12 routes, DoR/DoD, scoped gate evidence, save compatibility และ rollback
- Change Record ฉบับนี้: ขอบเขตการวางแผน หลักฐานตรวจ และประเด็นที่ต้อง review

### 3.2 ไฟล์ที่แก้ไข (Modified)

- [Root CHANGELOG](../../../CHANGELOG.md): เพิ่มสรุปภายใต้ `[Unreleased]` พร้อมลิงก์มายังบันทึกนี้

### 3.3 ไฟล์ที่ลบ (Deleted)

- ไม่มี

### 3.4 การตัดสินใจในการร่าง

- ใช้รหัส Act/Scene จริงใน Narrative Bible แทนตัวอย่าง `NAR-ACT1-001..006` ที่ไม่มีใน baseline และระบุความหมาย `FR-LOC-002` ให้ตรง SRS
- ระบุ `act-01.json` เป็น aggregate Content Package ซึ่งมี narrative trees อยู่ภายใน พร้อม catalogs/registries ที่ required
- รักษา Phase 0 ที่ผู้ใช้ยืนยันอนุมัติแล้ว ไม่เปิดการอนุมัติ baseline เดิมใหม่เพราะส่วนหัวเก่ายังเขียน Proposed/Candidate
- เปิด CR-0002 D1–D4 สำหรับ Act 1 boundary, flag semantics, pure progression/Resume และ validator/version/compatibility ก่อน Coding ส่วนที่เกี่ยวข้อง โดยไม่ใช้ fake Ending/Act 2 target หรือแก้ Core State Machine/Save Schema
- ระบุ graph gate ว่าครอบคลุม Act 1; Full-game Canon/Reflective Ending reachability ยังเป็นงาน Phase 2 ส่วนที่เหลือ ไม่ประกาศ G2 ผ่าน
- ตาราง Section 7 ของ Sprint 2 คงว่างสำหรับ Execution ตามคำขอ โดยวางลิงก์ planning record เหนือตาราง; WBS ทั้งห้างานยังไม่ทำเครื่องหมายเสร็จ

## 4. ผลการทดสอบและการตรวจรับ (Verification & Quality Evidence)

- **Git baseline:** Working tree เริ่มต้นสะอาดบน `develop@53de19e`; `git pull --ff-only origin develop` สำเร็จและไม่พบ commit ใหม่ จากนั้นสร้าง `feat/sprint-02-planning-ssot`
- **Contributor identity:** `git config user.name` = `T3thr`, `git config user.email` = `t.theerapat33@gmail.com`; GitHub active account = `T3thr`
- **Baseline regression:** `node --test tests/unit/*.test.js` ผ่าน **183/183 tests**, 0 failed, 0 cancelled, 0 skipped, 0 todo เป็นหลักฐานของโค้ด Sprint 1 ที่ไม่เปลี่ยน ไม่ใช่ Act 1 full-content evidence
- **Document review:** ตรวจความสอดคล้องกับ Canon, schemas, actual Core/bootstrap contracts และ CR-0001; ใช้ read-only independent review ด้าน Narrative/Architecture ก่อนส่ง PR
- **Document checks:** สคริปต์ Python เฉพาะรอบผ่าน: 3 changed documents, 33 local links/anchors, 88 baseline Requirement/Decision IDs, Section 1–7, WBS ห้างานที่ยัง unchecked และ empty execution register; changed-file scope เป็นเอกสารสามไฟล์ตามคำสั่ง และ `git diff --check` ผ่าน
- **ไม่ได้รัน:** Sprint 2 schema/content/graph suite และ browser Act 1 playthrough เพราะยังไม่มี implementation ตามคำสั่ง session; ไม่ได้ทำ deployment, performance/a11y certification หรือ Full Release G2
- **Gate status:** มี scoped documentation และ baseline regression evidence; ไม่มีการอ้าง materialized automated `REQ-GATE`, `SCHEMA-GATE` หรือ `GRAPH-GATE` ของ Sprint 2 ว่าผ่านแล้ว

## 5. ความเสี่ยงและสิ่งที่ต้องทำต่อ (Risks & Next Steps)

- **Approval ที่ยังต้องการ:** Owner Review แผน; Architect/Narrative Director/Game Designer/QA ตัดสิน CR-0002 รายข้อ และปิด flag-policy disposition ของ CR-0001 ตาม dependencies ก่อนเริ่ม Task ที่ได้รับผลกระทบ
- **ข้อจำกัด:** Sprint 1 มี Core Choice/State/Save แต่ยังไม่มี generalized content executor; Act 1 boundary และ Resume จาก Exploration/Decision ยังต้อง contract design ดังที่ SSOT ระบุ ไม่ใช่งานเปลี่ยน import อย่างเดียว
- **Scope:** Act 1 และ Content Architecture เท่านั้น; Web Audio ยกไป Sprint 3, Act 2–5/Full Release ไปรอบถัดไป ไม่มี code, schema, asset หรือ save mutation รอบนี้
- **Migration:** ไม่มีในรอบเอกสาร; content version และ Mock-save compatibility เป็นข้อเสนอรอ disposition ก่อน Runtime Integration
- **Rollback:** revert commit เอกสารผ่าน feature PR ตาม Git Governance; ไม่ rewrite shared history และไม่มีข้อมูลผู้เล่นต้อง rollback
- **งานถัดไป:** ตรวจและอนุมัติแผน/CR, เริ่ม Task 1 หลัง DoR ครบ แล้วเพิ่ม execution records พร้อม test evidence ใน Section 7 ของ Sprint 2
- **Delivery:** ส่ง feature branch และ Pull Request ไป `develop`; การ merge/release ไม่อยู่ในอำนาจรอบนี้
