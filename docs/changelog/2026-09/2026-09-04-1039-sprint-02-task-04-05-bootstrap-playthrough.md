# Change Record: Sprint 2 Tasks 4 & 5 Content Integration and Playthrough

- **Record ID:** CR-20260904-1039
- **Timestamp:** 2026-09-04T10:39:36+07:00 — เริ่มบันทึก Intake/Design ก่อนเขียน implementation
- **Sprint:** SPRINT-02 / Step 3 of 3 / Tasks 4 & 5
- **Operator:** Senior Software Engineer / AI Agent; contributor `T3thr <t.theerapat33@gmail.com>`
- **Status:** Completed locally — implementation และ verification พร้อม final review; human approvals ยังไม่แทนด้วยผล automated tests
- **Authority:** Tech Lead Strategic Directive, Sprint 2 Finale; local atomic commit only, no push/PR/merge
- **Branch / base:** `feat/sprint-02-act-01-expansion` / `a85a5e5`
- **Delivery commit:** commit ที่มีบันทึกนี้ ใช้ subject `feat(bootstrap): integrate act 1 content and verify sprint 2 playthrough (Tasks 4 & 5)`; hash รายงานหลัง commit ไม่ใส่ self-referential hash ลงไฟล์

## 1. วัตถุประสงค์และ Intake / Impact

เชื่อม Act 1 JSON ให้เล่นได้จริงผ่าน pure orchestration, save consent และ exact Resume; ย้าย Mock ไป regression fixtures และทดสอบครบจน act-rest บน browser จริง ตามขอบเขต Tasks 4/5. อ่าน AGENTS, repository skill, engineering guide/checklists, Sprint SSOT, schema, Core/Renderer/Persistence contracts และผล Task 1–3 ก่อนดำเนินงาน ตรวจ identity/branch/base และ working tree สะอาดแล้ว

ผลกระทบ C2 ครอบคลุม Core use-case, Data normalization/localization, composition, persistence write safety, UI/a11y, tests และ trace. Content/Canon, Save Schema, State Machine และ Choice Transaction เดิมไม่เปลี่ยน ไม่มี asset/license ใหม่, runtime dependency, backend, telemetry, Act 2–5, audio engine หรือ deployment

DoR ผ่านตาม directive ที่ให้อำนาจเลือก D3/D4: requirements และ authority ชัด, input/output/typed errors, effect ordering, compatibility, flags/cursor/checkpoint, file scope, success/failure witnesses, locale/safety และ rollback ระบุใน [ADR-P0-014](../../adr/ADR-P0-014-content-orchestration-and-resume.md) ก่อน implementation. การอนุมัติ narrative/Thai/sensitivity โดยมนุษย์ยังเป็น gate ก่อน merge

## 2. Traceability และ Architectural Decisions

Requirements: `CR-0002` D3/D4; `FR-CNT-001/002/004`, `FR-ENG-001/002/003/008`, `FR-STA-001/004`, `FR-SAV-001/003/006/007/009`, `FR-UI-001/003/007`, `FR-LOC-001/002`, `FR-ACC-001/002`, `NFR-US-004`, `NFR-SE-003`, `NFR-PE-001/002/004/005`, `NAR-SC-A1-001..007`, `GDD-UX-003`, `GDD-SAFE-005`. ADR links: [014](../../adr/ADR-P0-014-content-orchestration-and-resume.md), [013](../../adr/ADR-P0-013-content-validation-contract.md). Mapping: [Content Matrix Section 8](../../traceability/sprint-02-content-matrix.md#8-step-3-execution-trace-and-local-closeout)

- Core รับ immutable normalized catalog และ deterministic snapshot/command; ใช้ Choice Transaction และ State Machine เดิมตามลำดับ precondition → candidate → target guard → transition → on-enter/events → cursor. Invalid candidate ไม่เปลี่ยน snapshot/checkpoint/save
- Cursor เก็บโดยลำดับล่าสุดของ dialogue IDs จริงใน `progress.viewedDialogueIds` ที่ยัง unique; ไม่เพิ่ม schema field หรือ synthetic flag. Resume ตรวจ shape/references/policies/cursor/causal events แล้ว restore โดยไม่เรียก on-enter หรือเขียน save. Before-node Retry เริ่มจาก pre-entry checkpoint และทำ effects ครั้งเดียว; after-node rest บันทึกหลังอ่านหน้าสุดท้ายจบ
- Old Mock 1.0.0 ไม่ migrate โดยเดา IDs. Boot/recovery อ่านอย่างเดียว; incompatible/corrupt/mixed records อยู่ครบและ valid backup เล่นต่อใน memory ได้. New Game มี confirm/cancel พร้อมอธิบายข้อมูลที่จะสูญเสีย; receipt ตรวจ raw bytes อีกครั้งก่อน clear เฉพาะ owned save keys. Data write guard ตรวจซ้ำใน stage/commit เพื่อรักษาข้อมูลที่ปรากฏหลัง preflight
- Root เป็นเจ้าของ Title/settings/confirmation presentation; ทุก accepted page/action เพิ่ม revision และ autosave. Return Title ท้ายองก์คง resumable rest snapshot โดยไม่เพิ่ม transition. Mock stable IDs/old assertions เก็บใน tests; Main runtime โหลด `act-01.json` เท่านั้น

## 3. Manifest of Changes

### 3.1 Created / moved into test-only scope

| Artifact | การเปลี่ยนแปลง |
|---|---|
| [src/core/use-cases/content-orchestration.js](../../../src/core/use-cases/content-orchestration.js) | Pure progression, events/conditions, cursor, checkpoint, Resume/Retry และ atomic candidates |
| [src/data/content/content-runtime.js](../../../src/data/content/content-runtime.js) | โหลดแพ็กเกจ/registry และตรวจ executor capabilities ก่อนส่ง normalized catalog เข้า Core |
| [src/data/content/content-view-model.js](../../../src/data/content/content-view-model.js) | project localized immutable view, content notices และ completion/consent presentation |
| [src/data/localization/th-application.js](../../../src/data/localization/th-application.js) | Thai system strings สำหรับ Title, settings, consent, warnings และ memory-only session |
| [tests/unit/content-orchestration.test.js](../../../tests/unit/content-orchestration.test.js) | 30 tests: 36 Canon walks, exact per-page Resume, guards, replay, rollback และ checkpoint faults |
| [tests/unit/act1-bootstrap.test.js](../../../tests/unit/act1-bootstrap.test.js) | 35 tests: production composition/DOM/LocalStorage, all 12 routes, compatibility/consent/faults |
| [tests/helpers/act1-session.js](../../../tests/helpers/act1-session.js) | real-package fixtures และ independent route witnesses สำหรับ focused integration |
| [tests/helpers/application-harness.js](../../../tests/helpers/application-harness.js) | isolated DOM/Storage doubles สำหรับ integration tests |
| [tests/helpers/prologue-bootstrap.js](../../../tests/helpers/prologue-bootstrap.js) | เก็บ composition Sprint 1 เป็น deprecated test-only helper; original assertions ไม่ลดลง |
| [tests/fixtures/legacy/prologue-slice.js](../../../tests/fixtures/legacy/prologue-slice.js) | ย้าย Mock resource และ stable IDs เดิมออกจาก production dependency graph |
| [tests/e2e/act1-playthrough.mjs](../../../tests/e2e/act1-playthrough.mjs) | real Chromium runner พร้อม loopback static server, isolated contexts และ assertions |
| [tests/e2e/README.md](../../../tests/e2e/README.md) | คำสั่ง reproduce และขอบเขต/ข้อจำกัดของ browser evidence |
| [tests/e2e/evidence/sprint-02/act1-evidence.json](../../../tests/e2e/evidence/sprint-02/act1-evidence.json) | ผล browser run พร้อม 12 outcomes, payload measurements และ runtime hashes 28 ไฟล์ |
| [tests/e2e/evidence/sprint-02/verification.txt](../../../tests/e2e/evidence/sprint-02/verification.txt) | Node version, คำสั่ง syntax 15 ไฟล์ และ full-suite output จริง |
| [docs/adr/ADR-P0-014-content-orchestration-and-resume.md](../../../docs/adr/ADR-P0-014-content-orchestration-and-resume.md) | คำตัดสิน D3/D4 ที่ได้รับอำนาจเลือกตาม Tech Lead Finale directive |
| [docs/changelog/2026-09/2026-09-04-1039-sprint-02-task-04-05-bootstrap-playthrough.md](../../../docs/changelog/2026-09/2026-09-04-1039-sprint-02-task-04-05-bootstrap-playthrough.md) | บันทึก Intake → Impact → Design → Verification → local hand-off ฉบับนี้ |
| [tests/e2e/evidence/sprint-02/act1-title-keyboard.png](../../../tests/e2e/evidence/sprint-02/act1-title-keyboard.png) | ภาพหน้าจอจาก browser run ที่ตรวจด้วยสายตา: act1-title-keyboard.png |
| [tests/e2e/evidence/sprint-02/act1-storm.png](../../../tests/e2e/evidence/sprint-02/act1-storm.png) | ภาพหน้าจอจาก browser run ที่ตรวจด้วยสายตา: act1-storm.png |
| [tests/e2e/evidence/sprint-02/act1-choice-confirmation.png](../../../tests/e2e/evidence/sprint-02/act1-choice-confirmation.png) | ภาพหน้าจอจาก browser run ที่ตรวจด้วยสายตา: act1-choice-confirmation.png |
| [tests/e2e/evidence/sprint-02/act1-rest.png](../../../tests/e2e/evidence/sprint-02/act1-rest.png) | ภาพหน้าจอจาก browser run ที่ตรวจด้วยสายตา: act1-rest.png |
| [tests/e2e/evidence/sprint-02/act1-mobile-320-text200.png](../../../tests/e2e/evidence/sprint-02/act1-mobile-320-text200.png) | ภาพหน้าจอจาก browser run ที่ตรวจด้วยสายตา: act1-mobile-320-text200.png |

### 3.2 Modified

| Artifact | การเปลี่ยนแปลง |
|---|---|
| [.gitignore](../../../.gitignore) | ละเว้น output/playwright ชั่วคราว; evidence ที่ตรวจแล้วเก็บใน tests/e2e/evidence |
| [src/bootstrap/index.js](../../../src/bootstrap/index.js) | composition Act 1 จริง, single input lock/view revision, autosave, compatibility/consent และ fatal recovery |
| [src/data/persistence/local-storage-adapter.js](../../../src/data/persistence/local-storage-adapter.js) | optional consent receipt + conservative stage/commit write guard; legacy caller contract คงเดิม |
| [src/ui/renderers/dom/dom-renderer.js](../../../src/ui/renderers/dom/dom-renderer.js) | page/context/content notice, stale-intent metadata, confirmation description, focus, metric live announcements และ reading preferences |
| [src/ui/styles/components.css](../../../src/ui/styles/components.css) | ข้อความหลายย่อหน้า/ปรับขนาดและ HUD reflow ที่ 320 px/200% |
| [src/ui/styles/motion.css](../../../src/ui/styles/motion.css) | เคารพตัวเลือก reduced-motion ของผู้เล่นนอกเหนือจาก OS |
| [tests/unit/bootstrap.test.js](../../../tests/unit/bootstrap.test.js) | เปลี่ยน import เพียงสองจุดไป legacy fixture/helper; assertions เดิมทั้งห้าชุดคงเดิม |
| [docs/sprints/sprint-02-ssot.md](../../../docs/sprints/sprint-02-ssot.md) | version 0.4.0, WBS 5/5, D3/D4 disposition, verification และ audit register |
| [docs/traceability/sprint-02-content-matrix.md](../../../docs/traceability/sprint-02-content-matrix.md) | เพิ่ม execution mapping และ supersede สถานะ Step 2 โดยไม่แก้ Canon |
| [CHANGELOG.md](../../../CHANGELOG.md) | สรุปปิด implementation Sprint 2 พร้อมลิงก์บันทึกนี้ |

### 3.3 Deprecated / removed from production

`src/data/content/prologue-slice.js` ย้ายไป `tests/fixtures/legacy/prologue-slice.js`; เนื้อหา/IDs เดิมยังอยู่ เพิ่มเพียง deprecation notice. Bootstrap เก่าเก็บใน helper เพื่อ regression และไม่มี production import ไป tests. ไม่ลบ stable IDs หรือ save records โดยปริยาย

## 4. Verification & Quality Evidence

Environment: Node.js `v22.23.2`; Chromium `151.0.7922.34` แบบ headed บน macOS (darwin); desktop 1280×900 และ mobile 320×740 CSS px. Browser run `2026-09-04T04:16:01.815Z`. Content/package/save versions `2.0.0 / 1.1.0 / 1`

| Gate / command | ผลจริง | ขอบเขตและหลักฐาน |
|---|---|---|
| `node --check` JavaScript ที่สร้าง/แก้ | **15/15 PASS** | [รายชื่อคำสั่งจริง](../../../tests/e2e/evidence/sprint-02/verification.txt) รวม new/moved helpers และ E2E module |
| `node --test tests/unit/*.test.js` | **444/444 PASS**; fail/cancelled/skipped/todo=0 | 183 Sprint 1 + 117 Task 1 + 79 Tasks 2/3 + 65 Tasks 4/5; ชุดใหม่ 30 orchestration + 35 application |
| SCHEMA / GRAPH | PASS ใน Act 1 scope | suite เดิมรวม loader 120 และ graph 76; nodes 14/14, edges 21/21, Canon routes 12/12 ยังคงผ่าน |
| CORE / STATE / SAVE | PASS | 36 Core route/profile walks; per-page resume; before/after checkpoints; delayed event dialogue; stale/double input; failed candidate rollback; old/future/corrupt/mixed save preservation, consent/cancel/race และ storage failure |
| Browser integration | **12/12 PASS** | [runner](../../../tests/e2e/act1-playthrough.mjs), [JSON evidence](../../../tests/e2e/evidence/sprint-02/act1-evidence.json); root/subpath, all Canon outcomes, rest reload และ post-storm cursor |
| UX / A11Y smoke | PASS เฉพาะ automated/browser checks ที่รัน | Tab/Shift+Tab/Enter/Space, visible focus, native 44 px controls, no Bond DOM/AX, Thai confirmation descriptions, 320 px/200% reflow และ reduced motion |
| SECURITY / ARCH | PASS ใน scope diff | same-origin static requests; no unexpected browser console/page errors; injection rejected at content boundary and literal-text renderer test; no Core DOM/storage/data imports; no runtime test/Mock imports/dependency |
| PERF payload | PASS | initial gzip 79,910 bytes ≤500,000 และ ≤2,000,000; raw 380,966 bytes; maximum observed save 4,821 UTF-8 bytes ≤250,000 |
| NARRATIVE / human AT / release PERF | **Pending / Not run** | Thai editorial/sensitivity, VoiceOver/NVDA listening, representative-device percentile and release browser matrix ไม่อ้างผ่าน |
| DEPLOY / merge / G2 | **Not performed** | user อนุญาต local commit เท่านั้น |

ผล terminal: call+keep 75/70/0, call+release 75/65/0, safety+keep 85/75/0, safety+release 85/70/0 ตรงกันทั้ง mother/roots/siblings. Bond เป็น 0 ทุก snapshot และไม่มี accessible Bond element ทุก browser story step. Hotspot เดิมไม่เพิ่ม count ซ้ำ; no/partial/all exploration ตรวจจริง

Browser command: `JKB_PLAYWRIGHT_PATH=<existing-development-playwright>/index.mjs JKB_HEADED=1 node tests/e2e/act1-playthrough.mjs`. ใช้เครื่องมือ dev ที่มีอยู่แล้ว ไม่ติดตั้ง package. [README](../../../tests/e2e/README.md) อธิบายการ reproduce. JSON evidence เก็บ SHA-256 ของ runtime static resources 28 ไฟล์; screenshots ทั้งห้าภาพผ่านการตรวจด้วยสายตา ไม่มีรูป/ข้อมูลจาก profile ผู้ใช้

Performance observation: DOMContentLoaded 113.5 ms; maximum driver action 107.8 ms (รวม overhead ของ Playwright); contrast samples 11.97:1, 7.65:1, 15.02:1. เป็นการวัด local run บนเครื่องนี้ ไม่ใช่ p95/p99 หรือการรับรอง hosting compression/อุปกรณ์เป้าหมาย. ตรวจ screen-reader semantics ผ่าน Chromium Accessibility Tree; ยังไม่ได้ฟังด้วย VoiceOver/NVDA

ระหว่างตรวจพบและแก้: HUD min-width ทำให้ 320 px/200% overflow; default adapter options ไม่ถูก recognize หลังเพิ่ม write guard ทำให้เข้าหน่วยความจำแทน autosave; ปุ่ม retry ที่ fatal content ต้องโหลดใหม่จริง. เพิ่ม regression สำหรับ Default Adapter และ fatal recovery และรัน full/browser gates ใหม่จนผ่าน. ไม่ลด assertion หรือ skip test

## 5. Migration, rollback, risks และ approvals

- ไม่มี Save Schema migration; Save Schema/State Machine/Choice Transaction/Act 1 JSON ตรวจ byte-identical กับ `a85a5e5`. Raw Mock ถูกเก็บจนผู้เล่นยืนยัน reset; separate settings key และ unrelated keys ไม่ถูก clear. ทุกค่า settings ใน envelope round-trip; UI รอบนี้เปิดเฉพาะ font scale/reduced motion ตาม scoped reading controls
- Rollback ต้องเป็น reviewed revert ที่คง compatibility write guard หรือปิด save writes; มี legacy composition + retained guard test ว่า New Game ไม่ overwrite save 2.0.0. ห้ามใช้ raw revert ที่ถอน guard เพราะ Mock root เดิมไม่มี consent flow; **ต้องรักษา Content 2.0.0 saves** และไม่เปิด Mock 1.0.0 ให้ overwrite โดยเงียบ. ไม่ downgrade save, ไม่ force/reset shared history. การยืนยัน New Game เป็นการลบข้อมูลตามคำอธิบาย จึงเรียกคืนหลัง clear ไม่ได้
- LocalStorage ไม่มี transaction/CAS หลาย keys: staged writes/revision checks/compatibility guards ใช้ตรวจ conflict แต่ไม่อ้าง cross-process isolation. หาก storage ล้มเหลว การเล่นในหน้านี้ดำเนินต่อและแจ้งว่า reload อาจสูญเสียความคืบหน้า
- ไม่มี Canon crisis node ใน Act 1 และเส้นทางจริงไม่ทำ HP/Sanity เป็นศูนย์; synthetic checkpoint/crisis checks ไม่เพิ่ม route หรือ Ending ปลอม. Act 2–5, audio engine, full settings/history UI, reading-time 20–30 นาทีและ browser matrix ระดับ release เป็นงานภายหลัง
- **Approvals pending before merge:** Lead Narrative Director/Thai Editor สำหรับ prose/sensitivity, Accessibility Reviewer สำหรับ assistive technology จริง, Architect/QA/Tech Lead สำหรับ full diff. สถานะ WBS `[x]` คือ local implementation/verification complete; ไม่ใช่ human approval, merge หรือ Phase 2/G2 complete

## 6. Sprint 2 final hand-off

อัปเดต [Sprint SSOT](../../sprints/sprint-02-ssot.md) เป็น 0.4.0 และ WBS ครบ 5/5, [Root CHANGELOG](../../../CHANGELOG.md), [Content Matrix](../../traceability/sprint-02-content-matrix.md) และ audit register แล้ว. Git identity ต้องตรงก่อน commit; ส่ง atomic local commit พร้อม trace IDs และเก็บบน `feat/sprint-02-act-01-expansion`. ไม่มี push, PR หรือ merge; Full Diff พร้อมให้ Tech Lead/User ตรวจเพื่อพิจารณา One-Shot Sprint PR ตามคำสั่งถัดไป
