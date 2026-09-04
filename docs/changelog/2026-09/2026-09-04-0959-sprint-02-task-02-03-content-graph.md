# Change Record: Sprint 2 Tasks 2 & 3 Canonical Act 1 and Graph Verification

- **Record ID:** CR-20260904-0959
- **Timestamp:** 2026-09-04T09:59:48+07:00
- **Sprint/Milestone:** SPRINT-02 / Step 2 of 3 / Tasks 2 & 3
- **Operator:** Senior Software Engineer / AI Agent
- **Status:** Implemented and verified locally; ready for Step 3, editorial/sensitivity approval pending before merge
- **Authority:** Tech Lead & System Architect Step 2 directive; canonical seven-scene package, graph tests and local atomic commit only
- **Branch / base:** `feat/sprint-02-act-01-expansion` / `c7d60f4`
- **Identity:** `T3thr <t.theerapat33@gmail.com>`

## 1. วัตถุประสงค์และคำสั่ง (Prompt Objective & Request)

ส่งมอบ Act 1 ทั้งเจ็ดฉากตาม Narrative Bible และชุดตรวจโครงสร้าง/สถานะกราฟ ครบ 12 การผสม home-focus × coping × keepsake พร้อมสำรวจครบ/บางส่วน/ไม่สำรวจ ทดสอบ negative fixtures และ regression ทั้งระบบ ใช้ jaokob-spec-loop และตรวจ working tree สะอาด/identity/base ก่อนเริ่ม ไม่ push, PR หรือ merge ตามคำสั่งล่าสุด

## 2. ข้อกำหนดและผลกระทบ (Traceability & Impact)

`NAR-ACT-001/002`, `NAR-SC-A1-001..007`, `NAR-LINE-A1-001..004`, `NAR-MTX-A1-001/002`, `NAR-MTX-001..003`, `NAR-BRN-001..004`, `NAR-CON-001/002/010`, `GDD-DEC-A1-001-A/B`, `GDD-DEC-A1-002-A/B`, `GDD-FLG-002/005`, `GDD-SAFE-005`, `FR-CNT-001/002/004/005`, `FR-ENG-002/003/008`, `FR-LOC-001/002`, `DR-001..012`, `CR-0002`, `ADR-P0-013`

- C1 content addition ภายใต้ schema 1.1 ที่มีอยู่; ใช้ CR-0002 D3 สำหรับ capability review ของการเชื่อมเกมใน Step 3
- มีผลต่อ Content/Thai resources/stable IDs และ test model; ไม่เปลี่ยน Core, UI, bootstrap, Save Schema หรือ runtime dependencies
- ใช้ contentVersion `2.0.0` แยกจาก Mock `1.0.0` และ schemaVersion `1.1.0`; ไม่มีการนำ ID ของ Mock มาใช้ความหมายใหม่ ไม่มี migration หรือ save write ในรอบนี้ การตัดสินใจ compatibility/consent อยู่ Task 4
- ข้อกำหนดที่มีผลในรอบนี้ตรงกันว่า Bond=0 ตลอด Act 1; ข้อความเกี่ยวกับการเริ่ม Bond ใน Act 2 ใน directive ต่างจาก NAR-CON-005 (Act 4) จดไว้ให้ตัดสินก่อนผลิตองก์ถัดไป ไม่แก้ future Canon ในงาน Act 1
- ข้อความใหม่เป็นการเรียบเรียงจาก Bible ใน repository ไม่ใช้แหล่งส่วนตัวหรือ asset ภายนอก; assets ว่าง ไม่มีภาพ/เสียงที่ต้อง clearance

## 3. แผนและสัญญาการตรวจรับ (Plan & Acceptance Contract)

1. สร้าง JSON package และ external test catalog; ทำ Canon-to-node/edge/flag/callback matrix แยกจาก schema ที่ปิด additionalProperties
2. ใช้ node-entered observation events `maxOccurrences=1` นับ hotspot เดิมครั้งเดียว; mandatory leaf discovery เป็น graph dominator ก่อน decision ไม่เพิ่ม progress flag
3. Conditional dialogue ใช้ events/condition DSL/priority และ default ที่ mutually exclusive; delayed payoffs องก์หลังอยู่ ledger ไม่สร้าง dangling runtime references
4. Test-only graph oracle ใช้ Core condition, meter และ choice transaction/state planner จริง ตรวจ entry guard จาก candidate และ action guard จาก pre-state; แยกหลักฐาน model ออกจาก production orchestration ซึ่งยังไม่ส่งมอบ
5. ตรวจ schema/Thai/refs, structural reachability, state-feasible traversal, cycles, occurrence limits, exact metric deltas, 12 routes × 3 exploration profiles และ negative fixtures ก่อน full regression
6. บันทึกผลจริง อัปเดต SSOT/CHANGELOG แล้ว commit เฉพาะงานนี้; human Thai editorial/sensitivity และ browser/Resume ยังเป็น gate ก่อน merge ใน Step 3

## 4. รายการไฟล์ที่เปลี่ยน (Changed Artifacts)

Created:

- [act-01.json](../../../src/data/content/packages/act-01.json): seven scenes / 14 nodes / 46 dialogue records / 13 events / 7 choices / 6 interactions / 8 flags / 5 checkpoints; Thai source และ act-rest contract ไม่มี asset ใหม่
- [act-01-test-catalog.json](../../../src/data/content/packages/act-01-test-catalog.json): 7 stable test IDs สำหรับ caller inject แยกจาก package ไม่ import test code เข้า runtime
- [content-graph.js](../../../tests/helpers/content-graph.js): test-only graph/state model, strict refs, SCC/reverse reachability, actual Core condition/meter/transaction/planner และ deterministic witnesses
- [content-graph.test.js](../../../tests/unit/content-graph.test.js): 76 cases ครอบคลุม Canon routes, counter, predicates, default variants, graph faults และ synthetic crisis/retry
- [act-01-expectations.json](../../../tests/fixtures/content/graph/act-01-expectations.json): independent expected scene/variant/prototype/callback manifest
- [invalid-orphan.json](../../../tests/fixtures/content/graph/invalid-orphan.json) และ [invalid-cycle.json](../../../tests/fixtures/content/graph/invalid-cycle.json): schema-valid แต่ graph-invalid fixtures; cycle มีทางแยกไป rest จากภายนอกแต่ SCC วนไม่มีทางออก
- [Content Matrix](../../traceability/sprint-02-content-matrix.md): node/edge/TR/flag/variant/ledger/test mapping, coverage denominator, provenance และ Step 3 capability requirements
- Change Record ฉบับนี้

Modified:

- [content-loader.test.js](../../../tests/unit/content-loader.test.js): เพิ่ม 3 tests โหลด package จริงทั้ง object/JSON และ same-origin URL ที่ root/repository subpath ตรวจ immutable records/indexes และ version/test-catalog failure
- [Sprint 2 SSOT](../../sprints/sprint-02-ssot.md): version 0.3.0, disposition Step 2, Task 2/3 `[x]` ตาม local scope, tooling evidence และ audit register
- [Root CHANGELOG](../../../CHANGELOG.md): สรุปงานและลิงก์ audit

ไม่มีไฟล์ที่ลบ ไม่แก้ production JS, schemas, Core, UI, bootstrap, persistence หรือ dependency manifest

## 5. หลักฐานการตรวจ (Verification & Quality Gates)

Environment: Node.js `v22.23.2`, macOS `26.2` (25C56). Code baseline `c7d60f4` + atomic change นี้; contentVersion `2.0.0`, package/tree schema `1.1.0`, catalogs `1.0.0`, Save Schema ไม่เปลี่ยน

| คำสั่ง / หลักฐาน | ผล |
|---|---|
| `node --check tests/helpers/content-graph.js` | Passed |
| `node --check tests/unit/content-graph.test.js` | Passed |
| `node --check tests/unit/content-loader.test.js` | Passed |
| `node --test tests/unit/content-loader.test.js` | 120/120 passed (117 เดิม + 3 ใหม่) |
| `node --test tests/unit/content-graph.test.js` | 76/76 passed |
| `node --test tests/unit/*.test.js` | **379/379 passed**; 183 Sprint 1 + 117 Task 1 + 79 Step 2; failed/cancelled/skipped/todo=0 |
| Parse JSON ทั้ง package/catalog/fixtures ใหม่ และ relative Markdown links | Passed |
| `git diff --check` / staged scope inspection | Passed |

Full suite ล่าสุดใช้เวลา 425.708166 ms เป็นเพียงเวลารัน test บนเครื่องนี้ ไม่ใช่ browser performance budget. Fixture JSON ไม่ใช้ `node --check` ซึ่งตรวจ JavaScript; ตรวจด้วย JSON.parse และ validator ตามประเภทจริง

**Scoped SCHEMA/GRAPH/STATE evidence:** package validate ผ่าน th/types/policies/refs ครบ; nodes **14/14**, edges **21/21**, reachable quotient states **689**, terminal states **192** = 16 hotspot subsets × 12 outcomes. ทุกรัฐที่ reachable มี feasible path ไป rest; explicit witnesses replay ผ่าน Core. ไม่มี orphan/dangling/closed cycle/state deadlock, forbidden Decision→Decision หรือ Bond delta

**Routes:** 12 combinations × none/some/all = **36 playthrough cases**; permutations ของ hotspot **24 ลำดับ**; ซ้ำ 100 entry/revisit ที่ counter เริ่ม 0/19/20 ไม่เกิด farming. HP/Sanity จบที่ 75/70, 75/65, 85/75, 85/70 ตาม call/safety × keep/release; Bond=0 ทุก snapshot. Discovery dominator + event occurrence มาก่อน keepsake ทุก reachable state

**Dialogue/events:** Canon witnesses 44/46 dialogue และ 11/13 events; synthetic defaults เติมอีก 2 dialogue + 2 events จนครบ 46/46 และ 13/13. Canonical prototype 4 บรรทัดและ coping variants 2 บรรทัดตรง Bible; priority/predicate truth cases มี default และ negative ambiguity test. Delayed payoff องก์หลังระบุ ledger/owner/milestone แยก ไม่อ้างว่า playable แล้ว

**Negative evidence:** orphan/closed-SCC fixtures ผ่าน schema แต่ถูก graph ปฏิเสธ; guard-closed cycle ถูกจับแม้ structural graph มีทางออก; missing target/Thai/checkpoint/callback, duplicates, impossible guards, unreachable action, forbidden transition, automatic cutscene loop, farming และ unsupported execution capability ให้ error code/path ตามกรณี

พบข้อผิดพลาดใน test harness รอบแรกสองรายการแล้วแก้ที่ต้นเหตุ: synthetic seed revision=0 ขัด Core positive revision contract จึงใช้ 1; duplicate-ID expectation ต้องชี้ interaction ที่ซ้ำกับ choice ตาม namespace pass ไม่เปลี่ยน Core หรือผ่อน requirement/assertions ของ regression

**Passed ในขอบเขตนี้:** content schema/semantic/reference/Thai resources, Act 1 GRAPH-GATE/test model, Core regression, architecture/scope inspection, requirement trace และ audit links. ไม่เพิ่ม I/O หรือ executable code ใน JSON

**Not run / Deferred:** full external Draft metaschema conformance (ใช้ local schema validator/parity เดิม), actual browser/keyboard/screen-reader/layout/performance, persistence/Resume/idempotency ของ production event executor, human Thai editorial/sensitivity approvals และ full-game Ending/G2/deployment. Gates เหล่านี้ไม่ถูกแทนด้วย model tests

## 6. Compatibility, Rollback และงานต่อ

Package ใหม่ยังไม่ถูก bootstrap โหลด จึงไม่มีผลต่อเซฟเดิมหรือเกมที่เปิดอยู่ Rollback ใช้ revert local commit นี้โดยคง Task 1 และ Mock; ไม่ rewrite shared history Step 3 ต้องประกอบ runtime event/cursor/checkpoint/Resume contract และใช้ชุด witness นี้เทียบกับ engine จริงก่อนเปิด PR

- Task 4 readiness: package + injected test catalog + immutable loader API พร้อม, events จำกัด node-entered, variants ใช้ predicates แยกกัน, flag policies/entry guards/first-observation occurrence มี evidence ชัด ให้ประกอบเข้ากับ Core เดิมและ mapping ของ cursor/checkpoint โดยไม่ hard-code route
- Checkpoint policy ของ Decision และ final rest เป็น metadata ที่ตรวจแล้ว; การบันทึก actual snapshot, resume ก่อน/หลัง effects, discovery consistency และอ่านจบก่อนกลับ Title ต้องทดสอบผ่าน runtime ใน Step 3
- Thai prose และ stable IDs เป็น implementation candidate ที่พร้อม review; Lead Narrative Director/Thai Editor ต้องลงผลจริงก่อน merge เช่นเดียวกับ Accessibility/Architecture/QA gates ที่เกี่ยวข้อง การทำ Task 2 `[x]` ไม่ใช่ human approval
- เป้าระยะเวลาอ่าน Act 1 20–30 นาทีต้องประเมินใน browser walkthrough ไม่อนุมานจากจำนวนข้อความ; ไม่มีการเพิ่มฉาก filler
- ข้อความเรื่องเปิด Bond ใน Act 2 เป็น follow-up CR-0002 ที่ไม่กระทบค่า 0 ของ Act 1; ให้เจ้าของ Narrative/Design ตัดสินก่อนผลิตองก์ถัดไป
- Local atomic commit เท่านั้นตาม Tech Lead; commit subject `feat(content): implement canonical act 1 package and graph reachability suite (Task 2 & 3)`; commit ที่มี Record นี้คือ audit revision ที่อ้างอิง ไม่ฝัง self-referential hash ลงไฟล์ ไม่มี push/PR/merge ใน Step 2
