# Change Record: Sprint 2 Task 1 Content Validator & Package Loader

- **Record ID:** CR-20260904-0927
- **Timestamp:** 2026-09-04T09:27:52+07:00
- **Sprint/Milestone:** SPRINT-02 / Step 1 of 3 / Task 1
- **Operator:** Senior Software Engineer / AI Agent
- **Status:** Implemented and verified locally; awaiting Step 2 instruction
- **Authority:** Tech Lead & System Architect directive อนุมัติ Task 1 และ CR-0002 D1/D2/D4; local atomic commit เท่านั้น ไม่ push/PR/merge
- **Branch / base:** `feat/sprint-02-act-01-expansion` จาก `develop@be9bbcb`
- **Identity:** `T3thr <t.theerapat33@gmail.com>`

## 1. วัตถุประสงค์และคำสั่ง (Prompt Objective & Request)

สร้าง pure in-repo Content Validator และ same-origin Package Loader, fixtures และ tests เพื่อส่งต่อ Task 2/3 โดยคง Clean Architecture และไม่เพิ่ม dependency การอนุมัติ Step 1 แทนข้อห้าม implementation ของรอบวางแผนก่อนหน้า และแทนกติกาเดิมที่ push/PR ต่อ Task

ใช้ jaokob-spec-loop: อ่านข้อกำหนด/ต้นแบบ Save Validator, ตรวจ Git identity/working tree, sync develop, วิเคราะห์ schema/rest/flag/immutable/reference boundary, บันทึก contract ก่อน code, implement และตรวจหลักฐานจริง ไม่มีการใช้ sub-agent ในรอบนี้

## 2. ข้อกำหนดที่ได้รับผลกระทบ (Traceability & Requirement IDs)

`FR-CNT-001`, `FR-CNT-002`, `FR-CNT-004`, `FR-CNT-005`, `FR-CNT-006` (metadata contract), `FR-LOC-001`, `DR-001` ถึง `DR-012` (Task 1 subset), `GDD-FLG-002/005`, `NFR-SE-002/003`, `NFR-PO-002`, `ADR-P0-003/009/013`, `CR-0001` Section 2.3 และ `CR-0002` D1/D2/D4

ไม่มี Canon, Core State Machine, Save Schema หรือ Engine behavior change; semantic validator ไม่ execute condition/effect หรือ apply counter/marker ในเกม

## 3. สิ่งที่ทำและรายการไฟล์ที่เปลี่ยนแปลง (Manifest of Changes)

### Created: Runtime

- `src/data/validation/content-validator.js`: defensive copy → version/structure → references/uniqueness → flag/effect/checkpoint/localization semantics; immutable typed outcomes
- `src/data/validation/content-schema-validator.js`: Draft 2020-12 keywords ที่ local catalog ใช้, `$ref` siblings, URI assertion, bounded work และ local-only resolution; unknown keywords/refs fail closed
- `src/data/validation/content-schema-catalog.js`: generated snapshot ของ local content schemas 8 ฉบับ ใช้เป็น runtime registry ไม่รวม Save Schema; parity test จับ drift ทุกฉบับ
- `src/data/validation/content-values.js`: clone JSON โดยไม่เรียก accessor/toJSON, reject cyclic/non-JSON/sparse/custom-prototype values และ deep freeze ผลลัพธ์
- `src/data/content/content-loader.js`: static object, JSON text และ injected same-origin HTTP(S) reader, typed failure, immutable namespace indexes/entry

### Created: Contracts

- `specs/schemas/v1.1.0/content-package.schema.json`: explicit strict flag policies; package 1.0 เดิมไม่แก้
- `specs/schemas/v1.1.0/narrative-tree.schema.json`: Act 1 Cutscene resting completion/checkpoint/marker contract แทน nextNodeId; tree 1.0 เดิมไม่แก้
- [ADR-P0-013](../../adr/ADR-P0-013-content-validation-contract.md): บันทึก implementation contract ของ D1/D2/D4, API, bounds, compatibility และสิ่งที่ยังเป็น D3

### Created: Verification

- `tests/fixtures/content/valid-minimal-package.json`
- `tests/fixtures/content/invalid-missing-fields.json`
- `tests/fixtures/content/invalid-dangling-reference.json`
- `tests/fixtures/content/invalid-duplicate-id.json`
- `tests/fixtures/content/invalid-flag-policy.json`
- `tests/unit/content-loader.test.js`: 117 tests ครอบคลุม nested/negative contracts, references, policies, immutability, local schema parity และ read/URL faults

### Created / Modified: Audit

- Change Record ฉบับนี้
- [Sprint 2 SSOT](../../sprints/sprint-02-ssot.md): version/status, current directive disposition, Task 1 `[x]`, tooling evidence และ Section 7 record
- [Root CHANGELOG](../../../CHANGELOG.md): สรุป Task 1 ใต้ Unreleased
- [Schema Catalog](../../../specs/README.md): รุ่น 1.1 และวิธีใช้ตรวจ

ไม่มีไฟล์ที่ลบ และไม่แก้ `src/core/`, `src/ui/`, `src/bootstrap/`, persistence หรือ tests เดิม

## 4. ผลการทดสอบและการตรวจรับ (Verification & Quality Evidence)

- `node --check` ผ่าน runtime modules ใหม่ทั้ง 5 ไฟล์และ `tests/unit/content-loader.test.js`
- `node --test tests/unit/*.test.js`: **300/300 ผ่าน = regression เดิม 183 + Task 1 ใหม่ 117**, failed/cancelled/skipped/todo = 0
- Focused suite `tests/unit/content-loader.test.js` ครอบคลุม valid object/JSON, immutable records/indexes, negative fixtures, wrong version/type, missing Thai, unknown fields/effects, local refs ทุก namespace, enum/counter/marker, conflict/checkpoint, URI/path/asset metadata, getters/cycles/depth และ same-origin read faults
- Schema snapshot parity อ่านต้นฉบับทั้ง 8 ฉบับแล้วเทียบแบบ deep equality; schema engine ตรวจ `$ref` target และ keyword ที่รองรับครบ; URI/Unicode/oneOf/anyOf/not/conditional-required/array uniqueness มี truth-case assertions
- Reference integrity ที่ตรวจรวม tree/node/dialogue/speaker/character/event/choice/interaction/flag/checkpoint/test/warning/asset; ไม่มี self-declared test-catalog bypass
- ตรวจ Git scope, relative links, JSON parse และ whitespace ด้วย `git diff --check`; versions เดิมใน `specs/schemas/` ไม่เปลี่ยน
- **Scoped gates:** ARCH/AI boundary inspection, Task 1 schema/semantic/reference/unit evidence ผ่าน; ไม่อ้างว่า full GRAPH-GATE/Release Gate ผ่าน
- **Not performed:** full Draft metaschema/reference-validator conformance (Python `jsonschema` ไม่มีใน environment และไม่ได้ติดตั้ง); Act 1 reachability/path simulation (Task 3), browser/UI/Resume/A11Y/Performance (Tasks 4/5), Canon/Thai editorial ของเนื้อเรื่องจริง และ deployment

## 5. ความเสี่ยงและสิ่งที่ต้องทำต่อ (Risks & Next Steps)

- **Ready for Step 2:** เรียก `validateContentPackage(package, {testReferenceIds})`, `loadContentPackage(packageOrUrl, {testReferenceIds, baseUrl, fetch})` หรือ `loadContentPackageFromJson(text, {testReferenceIds})` ได้ ชุด fixture เป็นข้อมูลทดสอบ ไม่ใช่ Canonical Act 1
- **D1:** package/tree 1.1 ใช้ `completion.kind=act-rest` พร้อม localized message/action label, after-node checkpoint และ marker effect; ไม่มี Act 2/Ending placeholder UI การอ่านจนจบ/กลับ Title ยังเป็น Task 4
- **D2:** policy อยู่ใน flag definition รุ่น 1.1; `memory.home_focus=unset` เป็น default ตาม GDD และเลือก mother/roots/siblings; counter 0–20 monotonic/saturate ผ่าน validation Runtime ต้อง enforce policy/occurrence ผ่าน D3 ก่อนเล่นจริง
- **D4:** validator เทียบ semantics เฉพาะ keywords ใน catalog ไม่ใช่ library รองรับ JSON Schema ทุก vocabulary; unknown capability fail closed Catalog regenerate โดยอ่าน JSON ทั้งแปดฉบับตาม path key และ serialize เป็น `CONTENT_SCHEMA_CATALOG = deepFreeze(...)`; tests ต้องเท่าต้นฉบับก่อน commit
- **Scope remaining:** full graph/guard/conditional dialogue/callback reachability, unique hotspot persistence และ Save Resume เป็นงานรอบต่อไป ไม่ลด gate เพื่อให้ Task 1 ดูเป็น full engine
- **Migration:** ไม่มี migration/save writes; original 1.0 contracts คงเดิมและมี compatibility fixture รุ่น 1.1 ต้อง opt-in ไม่ส่งให้ old reader โดยเดา Act 1 production contentVersion/Mock-save policy ต้องตัดสินเมื่อ integrate
- **Rollback:** revert local Task 1 commit หรือเปลี่ยน consumer กลับตาม version contract; ไม่ลบ saves และไม่ rewrite shared history
- **Approvals:** Step 1/D1/D2/D4 ตาม Tech Lead directive; Step 2 ต้องรับคำสั่งและทำ Narrative/Game Design review ของเนื้อหา; D3/API enforcement/Resume ยังต้อง architecture review ก่อน Task 4 ไม่มีอำนาจ push/PR/merge ในรอบนี้

รายละเอียดมาตรฐานที่ใช้ตีความ assertion: [Draft 2020-12 validation](https://json-schema.org/draft/2020-12/json-schema-validation) และ [core/applicators](https://json-schema.org/draft/2020-12/json-schema-core); ไม่มีการคัดลอก implementation ภายนอกหรือเพิ่ม runtime dependency
