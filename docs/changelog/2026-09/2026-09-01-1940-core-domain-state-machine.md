# Change Record: Core Domain, State Machine และ Port Contracts

- **รหัสบันทึก (Record ID):** CR-20260901-1940
- **วันและเวลา (Timestamp):** 2026-09-01T19:40:37+07:00
- **รอบการพัฒนา (Sprint/Milestone):** Sprint 1 / Phase 1A
- **ผู้ปฏิบัติงาน (Operator/Persona):** Lead Software Engineering and Quality Directorate
- **Branch:** `feat/sprint-01-core-domain`
- **สถานะ (Status):** Completed and Verified for Pull Request

---

## 1. วัตถุประสงค์และคำสั่ง (Prompt Objective & Request)

รับไม้ต่อจาก Phase 0 Specification Baseline เพื่อดำเนินการ Sprint 1 Task 1 และ Task 2 โดยสร้าง Core Domain, Finite State Machine, Atomic Choice Transaction และ structural Port contracts ด้วย Pure Vanilla JavaScript ES Modules พร้อม Unit Tests และหลักฐานตรวจสอบย้อนกลับ โดยไม่เริ่ม Persistence Adapter, DOM Renderer, Bootstrap หรือ First Playable Slice

งานแบ่งความรับผิดชอบเป็น 4 ฝ่าย ได้แก่ Lead Software Architect, Principal Core Engine Developer, Lead Quality and Verification Specialist และ Process Auditor and DevOps Specialist

## 2. ข้อกำหนดที่ได้รับผลกระทบ (Traceability & Requirement IDs)

- **Requirement IDs:** `FR-STA-002`, `FR-STA-003`, `FR-STA-004`, `FR-ENG-001`, `FR-ENG-002`, `FR-ENG-003`, `FR-UI-001`, `FR-SAV-001`, `NFR-MA-001`, `NFR-MA-002`, `NFR-MA-005`, `NFR-PO-003`
- **Transition IDs:** `TR-001` ถึง `TR-020`
- **Game Design IDs:** `GDD-MEC-001`, `GDD-FLG-002`, `GDD-FLG-005`
- **สถาปัตยกรรมที่เกี่ยวข้อง:** `ADR-P0-001`, `ADR-P0-004`, `ADR-P0-005`, `ADR-P0-006`, `ADR-P0-007`
- **Change Control:** `CR-0001` สำหรับคำศัพท์ event, ตำแหน่ง Unit Test, flag semantic policy, test runner และ Port execution model ที่ baseline ยังไม่ตัดสินครบ

### 2.1 Rationality and Traceability Analysis

- Task 1 และ Task 2 มี WBS และ Requirement IDs รองรับใน `docs/sprints/sprint-01-ssot.md`
- State Machine ใช้ Transition Table `TR-001` ถึง `TR-020` เป็น normative source และไม่เพิ่ม transition หรือ feature นอกข้อกำหนด
- Choice Transaction คืน candidate และ transition plan เพื่อให้ Application Dispatcher ทำ compare-and-swap และ persistence ใน Phase 1B โดย Core ไม่เรียก Port หรือ Browser API

### 2.2 Data Contract Compatibility

- State enum, metric snapshot, flag entry, checkpoint, history entry และ stable identifier ใช้รูปแบบเดียวกับ `common.schema.json`, `narrative-tree.schema.json` และ `save-state.schema.json`
- `GameSnapshot.revision` เป็น Application Domain field ตาม Architecture Blueprint; Persistence Adapter ต้อง project field นี้ไปยัง Save Envelope ใน Task 3
- ไม่มีการแก้ JSON Schema, Schema Version, Save Version, Stable ID หรือ Content Package
- Flag policy ที่ machine-readable schema ยังบังคับไม่ได้ถูกควบคุมแบบ fail-safe และติดตามใน `CR-0001`

### 2.3 Architectural Boundary Invariants

- `src/core/` import เฉพาะ Core module ภายในชั้นเดียวกัน
- ไม่พบการเรียก DOM, Browser Storage, network, timer, random source, runtime evaluation หรือ third-party library
- Port definitions เป็น structural contract ที่ไม่มี concrete adapter และไม่มี side effect ขณะตรวจ composition

### 2.4 Risk and Failure Mode Mitigation

- ป้องกัน non-deterministic state ด้วย immutable candidate, caller-supplied timestamp และไม่มี wall-clock หรือ random access
- ป้องกัน duplicate commit ด้วย input lock fact, expected revision และ revision increment ครั้งเดียว; compare-and-swap จริงเป็นหน้าที่ Application Dispatcher ใน Phase 1B
- ป้องกัน partial mutation ด้วย typed rejection ที่คืน original snapshot reference
- ป้องกัน data corruption ด้วย safe-integer checks, bounded arrays, conflict detection, JSON-domain cloning และ explicit flag policies

## 3. สิ่งที่ทำและรายการไฟล์ที่เปลี่ยนแปลง (Manifest of Changes)

### 3.1 ไฟล์ที่สร้างใหม่ (Created)

- `src/core/domain/meters.js`: Metric invariants, versioned defaults, simultaneous deltas และ atomic metric effects
- `src/core/state-machine/game-state.js`: Pure transition planner และ immutable matrix สำหรับ `TR-001` ถึง `TR-020`
- `src/core/use-cases/choice-transaction.js`: Atomic choice resolver, condition evaluation, crisis precedence, flag policy, revision/history และ rollback
- `src/core/ports/renderer-port.js`: Structural RenderPort contract และ composition-time validator
- `src/core/ports/storage-port.js`: Structural SaveRepositoryPort contract และ composition-time validator
- `tests/unit/meters.test.js`: Metric boundary, invariant, conflict และ determinism tests
- `tests/unit/game-state.test.js`: Allowed, guarded และ forbidden transition tests
- `tests/unit/choice-transaction.test.js`: Transaction ordering, rollback, crisis, flags, checkpoint, revision และ immutable-output tests
- `tests/unit/ports.test.js`: Port contract, facade forwarding และ boundary tests
- `docs/rfc/CR-0001-sprint-01-core-contract-clarifications.md`: Change Request สำหรับ contract gaps ที่ยังต้องได้รับการตัดสิน
- `docs/changelog/2026-09/2026-09-01-1940-core-domain-state-machine.md`: Audit record ฉบับนี้

### 3.2 ไฟล์ที่แก้ไข (Modified)

- `docs/sprints/sprint-01-ssot.md`: ปิด WBS Task 1 และ Task 2, ปรับตำแหน่ง test ตามคำสั่งปัจจุบัน และลงทะเบียน Change Record
- `CHANGELOG.md`: สรุป Core Phase 1A ที่ส่งมอบและคงรายการ Task 3 ถึง Task 5 เป็น planned work

### 3.3 ไฟล์ที่ลบ (Deleted)

- ไม่มี

## 4. ผลการทดสอบและการตรวจรับ (Verification & Quality Evidence)

### 4.1 Automated Unit and Coverage Verification

คำสั่ง:

```text
node --experimental-default-type=module --test --test-reporter=spec --experimental-test-coverage --test-coverage-include='src/core/**/*.js' --test-coverage-lines=90 --test-coverage-branches=85 --test-coverage-functions=90 tests/unit/meters.test.js tests/unit/game-state.test.js tests/unit/choice-transaction.test.js tests/unit/ports.test.js
```

ผล:

- Tests: 140
- Passed: 140
- Failed, Cancelled, Skipped, Todo: 0
- Line coverage: 94.47 เปอร์เซ็นต์
- Branch coverage: 91.24 เปอร์เซ็นต์
- Function coverage: 99.08 เปอร์เซ็นต์
- `meters.js`, `renderer-port.js`, `storage-port.js`: 100 เปอร์เซ็นต์ทุกมิติ
- Transition matrix: positive path ครบ `TR-001` ถึง `TR-020`, guard-false scenarios ครบ และ forbidden active-state/event pairs 84 คู่ถูกปฏิเสธ

### 4.2 Static and Contract Verification

- `node --check` ผ่านสำหรับ source 5 ไฟล์และ test 4 ไฟล์
- Boundary scan ไม่พบ `window`, `document`, `localStorage`, network API, timer API, `Math.random`, `Date.now`, `eval` หรือ `new Function` ใน `src/core/`
- Import inspection พบเฉพาะ dependency ภายใน Core และไม่พบเส้นทางไป `src/ui/` หรือ `src/data/`
- `jq empty specs/schemas/*.json` ผ่านทุก schema; ไม่มี schema change ในรอบนี้
- `git diff --check` ผ่าน

### 4.3 Quality Gate Status

- Direct Core unit and invariant evidence: Passed
- Direct State transition evidence: Passed, transition matrix coverage 100 เปอร์เซ็นต์
- Architecture boundary inspection: Passed
- Repository-materialized `CORE-GATE` และ `STATE-GATE`: ยังไม่มี command มาตรฐานใน repository; direct Node evidence ใช้ได้เฉพาะรอบนี้ตาม `CR-0001`
- Schema metaschema, valid/invalid fixture matrix: ไม่ได้รัน เนื่องจากไม่มี schema change และ tooling gate ยังไม่ materialize
- Persistence, browser integration, accessibility และ end-to-end gates: ไม่ได้รัน เพราะเป็น Task 3 ถึง Task 5

## 5. ความเสี่ยง การย้ายข้อมูล และสิ่งที่ต้องทำต่อ (Risks, Migration & Next Steps)

- **งานคงค้าง:** Task 3 Persistence Adapter, Task 4 DOM Renderer และ Task 5 Bootstrap/Browser Vertical Slice
- **FR-ENG-003:** Unit proof ป้องกัน locked/stale/replayed command แล้ว แต่ real pointer/touch/keyboard race ต้องพิสูจน์ร่วมกับ Application Dispatcher และ UI ใน Phase 1B
- **Data contract:** Flag enum/counter/marker policy ต้องได้รับการตัดสินใน `CR-0001` ก่อน generalized content production
- **Port contract:** Execution model แบบ synchronous หรือ asynchronous และ SettingsRepositoryPort ต้องได้รับการยืนยันระหว่าง Task 3 integration
- **Migration:** ไม่มี เนื่องจากไม่มีการเปลี่ยน Save Schema, Content Schema หรือ Stable ID
- **Rollback:** Revert commit ของ feature branch ได้โดยไม่ต้อง migrate data และไม่กระทบ Phase 0 frozen baseline
- **Approval ที่ยังต้องการ:** Pull Request review จาก Senior Software Architect และ Quality/DevOps; `CR-0001` ต้องได้รับการตัดสินจาก Senior Software Architect, Principal Game Designer และ Data Contract Owner
