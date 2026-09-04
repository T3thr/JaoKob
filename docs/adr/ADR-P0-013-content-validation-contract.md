# ADR-P0-013: Local Content Validation and Act 1 Rest Contract

Status: Accepted direction under Tech Lead Step 1 directive; concrete contract recorded for implementation review.

Date: 2026-09-04

Authority: คำสั่ง Tech Lead & System Architect ใน Step 1 อนุมัติ CR-0002 D1/D2/D4 และ Task 1; D3 application execution/Resume ยังเป็นงาน Step 3 ไม่อยู่ใน ADR นี้

## Context and decision

ใช้ pure in-repo JavaScript ตรวจ structural keywords ที่ schema catalog ใช้จริง ตาม Draft 2020-12, resolve local `$ref` ด้วย canonical `$id`, ตามด้วย semantic checks แล้วจึงคืน cloned/deep-frozen records/indexes ไม่มี runtime npm, DOM หรือ Storage ใน Validator

Schema `1.0.0` เดิมคงไว้ทุก byte รุ่น `v1.1.0/` เป็น opt-in extension ของ content-package/narrative-tree เท่านั้นเพื่อ materialize D1/D2:

- Cutscene ปกติต้องมี `nextNodeId`; จุดพัก Act 1 ใช้ `completion: {kind: "act-rest", flagId, message: {th}, actionLabel: {th}}` แทน target มี `act=1`, checkpointPolicy=`after-node` และ checkpointId บังคับ node นี้ยังเป็น Cutscene, ไม่มี Ending/Act 2 ID, ไม่ใช่ self-loop หรือ dangling edge `flagId` ต้องเป็น boolean marker ที่ตั้ง true ใน onEnterEffects การอ่านจนจบแล้วพัก/บันทึก/กลับหน้าเริ่มต้นเป็น Application responsibility ใน Step 3 ไม่สร้าง transition ใหม่
- Flag definitions รุ่น 1.1 มี `policy` ชนิด boolean/marker/enum/counter แบบ strict: explicit reversible, enum values, counter min/max/overflow/monotonic ค่าตั้งต้น `memory.home_focus=unset` ยังคงใช้; choices เลือก mother/roots/siblings; `exploration.safe_observations` default 0, 0–20 saturating, monotonic ตามคำสั่งล่าสุด boolean story markers ห้าม reset
- ตรวจ policy, defaults, conditions และ effects ก่อนส่งต่อ; Validator ไม่ apply gameplay effects และไม่ทำให้ Core เดิมได้ capability ใหม่ การ enforce enum/counter/occurrence ณ runtime เป็นงาน D3
- Catalog modules เป็นสำเนา schema ที่อยู่ใน source เพื่อไม่ fetch `specs/` ใน release มี test เทียบ local schema แบบ deep equality ทุกไฟล์/refs เมื่อเปลี่ยน schema ต้อง regenerate catalog ก่อนส่งมอบ
- `testReferenceIds` ตรวจจาก catalog ที่ caller inject เป็น `testReferenceIds` (array ของ stable test IDs); ไม่มี bypass เมื่อไม่มี catalog และ Production ห้าม import tests Catalog ของ runtime ต้องประกอบจาก reviewed trace artifact ใน Step 2/3
- ตรวจ static reference integrity และ immediate unguarded Cutscene loops ใน Task 1; full reachability/guard/cycle/ending analysis อยู่ Task 3 ไม่เรียกผลนี้ว่า full GRAPH-GATE

## API and failures

`validateContentPackage(object, {testReferenceIds, expectedContentVersion})` คืน `{valid:true, packageData}` หรือ `{valid:false, errors:[{path,code,message}]}` ซึ่ง immutable ทั้งชุด `message` เป็น diagnostic English ไม่ใช่ข้อความแสดงผู้เล่น; UI ต้อง map code ไป resource ไทย

`loadContentPackage(objectOrUrl, options)` เป็น async: object ตรวจโดยตรง, URL ใช้ same-origin HTTP(S) fetch ที่ inject ได้ (`baseUrl`, `fetch`) และ reject redirects/credentials/external origins; `loadContentPackageFromJson(text, options)` parse ข้อความ JSON โดยตรง เมื่อสำเร็จเพิ่ม `indexes` สำหรับ trees/nodes/dialogues/characters/events/assets/flags/checkpoints/choices/interactions และ `entry` references ที่ immutable ไม่มี mutable Map หลุดออกมา

Code categories: `CONTENT_PARSE`, `CONTENT_SCHEMA`, `CONTENT_VERSION`, `CONTENT_REFERENCE`, `CONTENT_DUPLICATE_ID`, `CONTENT_FLAG_POLICY`, `CONTENT_SEMANTIC`, `CONTENT_LOAD`, `CONTENT_ORIGIN`, `CONTENT_LIMIT` ไม่มี partial package เมื่อ fail ข้อความ diagnostic ไม่ echo input

Reject non-JSON JS values/accessors/custom prototypes/cycles/nonfinite numbers/sparse arrays และกำหนด depth/value/validation-work bounds เพื่อ fail safely; ไม่อ้างรองรับ JSON Schema ทุก vocabulary หรือ arbitrary external schemas รองรับ keywords ทั้งหมดที่ใช้ใน local catalog และ unsupported keyword/ref ต้อง reject

## Alternatives and consequences

ไม่ใช้ ajv/npm ตาม directive ไม่ตรวจ shape แบบ Mock เพราะพลาด nested contracts ไม่แก้ schema 1.0 เดิมเพราะจะเปลี่ยนความหมาย published version เลือก opt-in 1.1 ซึ่งเพิ่ม boundary/policy อย่างชัดและให้เก็บ original fixtures สำหรับ compatibility

ต้นทุนคือ catalog ต้อง sync และมี parity tests; การรับ valid structural package ไม่พิสูจน์ dialogue priority/state-feasible paths หรือ runtime execution ที่ยังไม่ได้สร้าง Dialogue catalog เดิมไม่มี `variants` field; variants ต้องใช้ records/conditions/events ตาม contract ที่มี ห้ามรับ unknown variant field

## Compatibility, migration and rollback

Validator รองรับ package/tree 1.0 และ 1.1 แบบ version-consistent; nested character/dialogue/event catalog ยัง 1.0 ไม่มี Save Schema/Core State Machine mutation ไม่มี auto migration หรือ rewriting input เซฟ Mock ไม่ได้รับ mapping อัตโนมัติ

Content รุ่นใหม่เลือก contentVersion แยกจาก schemaVersion; fixture ใช้ 1.1.0 โดยไม่ได้ล็อก contentVersion ของ Act 1 จริง การถอยกลับใช้ revert Task 1 local commit; consumer เก่าที่ไม่รู้จัก 1.1 ต้อง reject version ไม่ downgrade โดยเดา

## Verification and trace

FR-CNT-001/002/004/005, DR-001..012, FR-LOC-001, GDD-FLG-002/005, NFR-SE-002/003, ADR-P0-003/009, CR-0001 Section 2.3, CR-0002 D1/D2/D4

ใช้ fixtures, structural keyword/ref parity, nested/reference/policy negative tests, immutable/side-effect tests, URL/fetch faults และ regression เดิม มี source catalog parity ทุก byte เชิงข้อมูล การตรวจ metaschema เต็มและ graph/playthrough ของ Act 1 ต้องรายงานตามหลักฐานจริง ห้ามอ้างผ่านจาก unit tests เพียงอย่างเดียว

Semantics reference: [JSON Schema validation](https://json-schema.org/draft/2020-12/json-schema-validation), [JSON Schema core](https://json-schema.org/draft/2020-12/json-schema-core). Supersedes: none; extends ADR-P0-003/009 without rewriting their rationale.
