# Change Record: Resilient LocalStorage Persistence Adapter

- **รหัสบันทึก (Record ID):** CR-20260902-0337
- **วันและเวลา (Timestamp):** 2026-09-02T03:37:36+07:00
- **รอบการพัฒนา (Sprint/Milestone):** Sprint 1 / Phase 1A
- **ผู้ปฏิบัติงาน (Operator/Persona):** Senior Storage Engineer & Verification Specialist
- **Branch:** `feat/sprint-01-persistence-adapter`
- **สถานะ (Status):** Completed with scoped direct unit evidence; full SAVE-GATE pending

---

## 1. วัตถุประสงค์และคำสั่ง (Prompt Objective & Request)

ดำเนิน Sprint 1 Task 3 เพื่อสร้าง LocalStorage implementation ของ `SaveRepositoryPort` พร้อม staged write, canonical/backup recovery, typed storage failures, consent-gated reset และ automated unit tests โดยรักษา Clean Architecture และไม่เพิ่ม runtime dependency

ระหว่างงาน PR #1 ถูก merge เข้า `develop` ที่ `53a458af94589f5770556198015ba07a423b581b` และ PR #2 audit record ถูก merge ที่ `fdf99e5f0e1e24cbcba63472a5c4964314abf8d8` จึงหยุดประเมินบนฐานเดิมและทำ Impact/Rebase Analysis ใหม่ตามคำสั่ง

## 2. Impact/Rebase Analysis หลังรวม PR #1 และ PR #2

- ตรวจ identity แล้วเป็น `T3thr <t.theerapat33@gmail.com>`
- อ่าน `AGENTS.md`, `docs/README.md`, `docs/sprints/sprint-01-ssot.md` และ Change Record ล่าสุด `CR-20260902-0325` ใหม่ก่อนทำงานต่อ
- `feat/sprint-01-persistence-adapter` อยู่ที่ ancestor `35aadeb` ของ `develop`; `develop` เพิ่มเฉพาะ `CHANGELOG.md`, Sprint SSOT และ Change Record หลัง Task 1/2 merge ไม่มีการแก้ source port, schema, test หรือ path ของ Task 3
- ไฟล์ Task 3 ที่ยัง untracked ทั้งสามไม่มี path collision กับ `develop`; จึงสลับ feature branch แล้ว fast-forward ด้วย `git merge --ff-only develop` ไปที่ `fdf99e5` โดยไม่ rebase, reset, force operation หรือแก้ `develop`
- ทำ verification ซ้ำบนฐาน `fdf99e5`; ผลผ่านทั้งหมดตามหัวข้อ 5

## 3. ข้อกำหนดที่ได้รับผลกระทบ (Traceability & Requirement IDs)

| Requirement | สถานะหลักฐานในงานนี้ |
|---|---|
| `FR-SAV-001` | Direct: current-v1 envelope, cloned round trip, structural validation และ revision conflict protection |
| `FR-SAV-002` | Direct: fixed namespaced save keys; ไม่อ่าน/แก้ settings หรือ unrelated origin keys |
| `FR-SAV-003` | Direct: stage/read-back/backup/promote/verify sequence, failure preservation และ fault fixtures หลัก |
| `FR-SAV-004` | Direct: scan ทั้ง 3 candidates, revision ordering, deterministic source tie-break และ corruption recovery |
| `FR-SAV-005` | Partial fail-safe: unsupported/future format คืน `SAVE_MIGRATION` และไม่ overwrite raw; ยังไม่มี approved migration chain |
| `FR-SAV-006` | Direct adapter control: `consent === true` เท่านั้นที่ clear canonical/staging/backup; New Game/reset UX ยังเป็น application/UI work |
| `FR-SAV-007` | Not completed here: `checkpoint()` persist envelope แต่ retry พร้อม settings authority ต้องทำร่วม SettingsRepository/Application |
| `FR-SAV-008` | Not completed here: ending/replay idempotency ต้องทำใน dispatcher/application flow |
| `FR-SAV-009` | Direct adapter control: quota/unavailable ถูกแปลงเป็น typed result; memory-only session, visible warning และ unload warning เป็น Task 5/UI work |

**Additional quality requirement:** `NFR-PE-005` ถูกตรวจโดยจำกัด Save candidate ไม่เกิน 250,000 UTF-8 bytes ก่อน stage

สถาปัตยกรรม/contract ที่อ้างอิง: `ADR-P0-001`, `ADR-P0-006`, `ADR-P0-007`, `CR-0001`, `src/core/ports/storage-port.js`, `specs/schemas/save-state.schema.json`

## 4. สิ่งที่ทำและรายการไฟล์ที่เปลี่ยนแปลง (Manifest of Changes)

### 4.1 ไฟล์ที่สร้างใหม่ (Created)

- `src/data/persistence/local-storage-adapter.js`: Synchronous concrete adapter ที่ implement operations ทั้ง 6 ของ `SaveRepositoryPort`; ใช้ key คงที่, PortResult แบบ typed, staged write, deterministic recovery และ strict consent clear
- `src/data/validation/save-envelope-validator.js`: current `saveFormatVersion: 1` structural validation guard เทียบกับ Save Envelope/common schema fields ที่ adapter ต้องตรวจที่ trust boundary โดยไม่เพิ่ม dependency
- `tests/unit/persistence.test.js`: in-memory storage fault fixtures และ unit tests สำหรับ round trip, recovery, quota/unavailable, revision, budget, raw preservation และ consent
- `docs/changelog/2026-09/2026-09-02-0337-persistence-adapter.md`: Change Record ฉบับนี้

### 4.2 ไฟล์ที่แก้ไข (Modified)

- `CHANGELOG.md`: สรุป feature persistence และลิงก์ไปยัง audit record
- `docs/sprints/sprint-01-ssot.md`: ทำเครื่องหมาย Task 3 สำเร็จ, แก้ path test ให้ตรง artifact และเพิ่มทะเบียน Change Record

### 4.3 โปรโตคอลที่ส่งมอบ

1. Validate และ serialize envelope เพียงชุดเดียว พร้อมบังคับ byte budget
2. เขียน staging แล้ว read-back/parse/validate
3. สำรอง canonical ที่ valid ก่อน promote; backup failure หยุดการ promote
4. Promote bytes ชุดเดียวกันเป็น canonical แล้ว read-back/validate อีกครั้ง
5. ลบ staging หลัง canonical verified เท่านั้น; cleanup failure คืน typed result โดยเก็บ candidates ที่ recover ได้
6. Recovery อ่าน canonical/staging/backup แบบไม่ mutate, เลือก revision สูงสุด แล้ว tie-break `canonical` > `staging` > `backup` โดยไม่ใช้ timestamp

## 5. ผลการทดสอบและการตรวจรับ (Verification & Quality Evidence)

| Command | ผล |
|---|---|
| `node --test tests/unit/persistence.test.js tests/unit/ports.test.js` | Passed: 36 tests, 0 failed |
| `node --test tests/unit/*.test.js` | Passed: 167 tests, 0 failed |
| `node --check src/data/persistence/local-storage-adapter.js` | Passed |
| `node --check src/data/validation/save-envelope-validator.js` | Passed |
| `git diff --check` | Passed before commit |

หลักฐาน unit ครอบคลุม `assertStoragePort`, cloned stage/commit/load round trip, canonical/staging/backup recovery, deterministic tie behavior, quota/denied storage, staging/backup/canonical failure preservation, exact consent, unknown JSON fields, future format, UTF-8 250 KB guard และ raw candidate preservation

### Verification not performed / not materialized

- Full repository-materialized `SAVE-GATE` ยังไม่มี script/fixture/quality-gate definition ตาม `CR-0001`
- Full Draft 2020-12 metaschema/reference validation, content semantic registry และ integrity digest verification ยังต้องรอ `ARCH-OD-001`/`ARCH-OD-002`
- Migration chain and fixtures (`FR-SAV-005`), settings-authority retry (`FR-SAV-007`), ending idempotency (`FR-SAV-008`) และ browser/UI memory-only recovery (`FR-SAV-009`) ยังไม่อยู่ใน Task 3 adapter boundary
- Real-browser LocalStorage/vertical-slice integration test อยู่ใน Task 5
- Cross-tab locking/CAS ไม่ได้ถูกกำหนดใน contract; protocol นี้รับประกัน recoverability ของ single-context staged writes ไม่ใช่ distributed transaction

## 6. Migration, Compatibility และ Rollback

- ไม่มี schema version, stable content ID หรือ key migration ที่เปลี่ยน: adapter รองรับ current `saveFormatVersion: 1` เท่านั้น
- Future/unsupported formats เก็บ raw bytes ไว้และคืน `SAVE_MIGRATION`; ไม่มี best-effort downgrade หรือ overwrite
- Rollback code ทำได้ด้วย revert commit ของ feature branch; browser keys ที่อาจสร้างขึ้นเป็น namespaced และสามารถล้างผ่าน `clearWithConsent({ consent: true })` โดย settings ไม่ถูกลบ

## 7. ความเสี่ยง สมมติฐาน และ Approvals ที่ต้องการ

- Runtime structural validator เป็น implementation guard ไม่ใช่ claim ว่า materialize SCHEMA-GATE; semantic content references ต้อง inject validator เมื่อ Data Contract Owner อนุมัติ contract
- Result-shape ของ operations และ `expectedRevision` check เป็น concrete adapter convention ภายใต้ generic port type; ควร formalize ก่อน alternative persistence adapter
- ต้องการ Senior Software Architect/Data Contract Owner ตัดสิน `ARCH-OD-001` ถึง `ARCH-OD-003`, และ Quality/DevOps review ก่อน promotion gate
- Task 4 และ Task 5 ยังเป็น work ต่อไป; ไม่มี Narrative, UI, DOM, bootstrap, settings-key mutation หรือ deployment ใน change นี้
