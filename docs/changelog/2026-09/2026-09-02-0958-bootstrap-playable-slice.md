# Change Record: Bootstrap and First Playable Prologue Slice

- **รหัสบันทึก (Record ID):** CR-20260902-0958
- **วันและเวลา (Timestamp):** 2026-09-02T09:58:07+07:00
- **รอบการพัฒนา (Sprint/Milestone):** Sprint 1 / Phase 1A & 1B / Task 5 / Sprint Closeout
- **ผู้ปฏิบัติงาน (Operator/Persona):** Lead System Integrator & Application Architect
- **Branch:** `feat/sprint-01-bootstrap-playable-slice`
- **สถานะ (Status):** Completed; pending human pull-request review

---

## 1. วัตถุประสงค์และคำสั่ง (Prompt Objective & Request)

ประกอบ Core State Machine และ Choice Transaction, LocalStorage SaveRepository Adapter และ Semantic DOM Renderer ผ่าน Composition Root เพียงจุดเดียว เพื่อส่งมอบฉากบทนำที่เปิดเล่นจริงในเบราว์เซอร์ มีตัวเลือก 3 ทาง ผลตอบสนองทันที การเปลี่ยน metrics/flags แบบ atomic, auto-save, Resume, crisis recovery และ fatal recovery shell พร้อมปิด Sprint 1 ตาม Definition of Done

### Intake และ Definition of Ready

- **Authority / phase:** คำสั่งผู้ใช้โดยตรงสำหรับ Sprint 1 Task 5 อนุญาต implementation, verification, documentation, commit, push และสร้าง PR สู่ `develop`
- **Change class:** C1 cross-layer integration ภายใต้ Port, State Machine และ Save Envelope ที่อนุมัติแล้ว ไม่มีการเปลี่ยน schema, stable ID semantics, architecture, runtime dependency หรือ canon ระยะยาว
- **Source of truth read:** `AGENTS.md`, repository-local Spec-Driven AI Loop, engineering workflow/standards, Sprint 1 SSOT, Master Operations Manual, AI Engineering Guide, GDD, Narrative Bible, SRS, Architecture Blueprint, Verification Plan, machine-readable save schema และ Change Record `CR-20260902-0427`
- **DoR conclusion:** scope, requirement IDs, existing contracts, acceptance evidence, rollback และ boundary ownership ชัดเจน; mock prologue choice effects ได้รับอนุมัติโดยคำสั่งผู้ใช้ และไม่มี conflict ที่ block implementation

## 2. Impact Analysis และ Traceability

| Requirement / authority | หลักฐานใน change นี้ |
|---|---|
| `FR-STA-001`, `FR-STA-002`, `FR-STA-004` | Bootstrap เริ่มจาก Core transition `TR-001`, แสดง Title, สร้าง New Game baseline `hp=80`, `sanity=70`, `bond=0`, และ Resume เฉพาะ save ที่ compatible |
| `FR-ENG-001`, `FR-ENG-002`, `FR-ENG-003` | Choice ทั้งสามส่งผ่าน `resolveChoiceTransaction()`; input ถูก busy-lock และ dispatcher serialize intents ก่อน commit snapshot เดียว |
| `FR-SAV-001`, `FR-SAV-002`, `FR-SAV-003` | Snapshot ถูก project เป็น schema-valid Save Envelope และเขียนผ่าน `stage()` -> validated readback -> `commit()`; browser evidence พบ canonical revision 2 และ backup revision 1 |
| `FR-SAV-004`, `FR-SAV-009` | Boot ใช้ adapter recovery/load; storage unavailable ลดระดับเป็น memory-only พร้อมข้อความชัดเจน ขณะที่ fault ที่กู้ไม่ได้เข้าสู่ fatal shell |
| `FR-UI-001`, `FR-UI-002` | Bootstrap สร้าง immutable View Model เท่านั้นและส่ง intent กลับทางเดียว; renderer busy state ป้องกันการเลือกซ้ำ |
| `FR-UI-006`, `FR-UI-007` | Core crisis แสดง GameOver ที่ไม่ตีตราและ Retry จาก checkpoint; unrecoverable port fault แสดง fatal recovery shell |
| `FR-ACC-001`, `FR-ACC-003` | Browser smoke เดิน Title -> Cutscene -> Decision -> result ด้วย Enter; native buttons/focus directive ทำงาน และใช้ styles ที่มี 44px target/AA token evidence จาก Task 4 |
| `GDD-UX-003` | Bond เปลี่ยนใน domain/save ได้ แต่ View Model ซ่อน Bond ระหว่างองก์ 1 และกรอง Bond meter-change feedback ออกจาก UI |
| `CON-001`, `CON-002`, `ADR-P0-001`, `ADR-P0-005`, `ADR-P0-008` | Pure ES Modules, ไม่มี framework/runtime dependency; Core, Data, UI ไม่ import ข้าม boundary และ concrete adapters ถูกประกอบเฉพาะใน `src/bootstrap/index.js` |

### Boundary impact

- **Core:** ไม่แก้กฎเกมหรือ state-machine contract; bootstrap เรียก transition/transaction ที่มีอยู่
- **Data/content:** เพิ่ม mock prologue resource แบบ deep-frozen พร้อม validator, stable IDs ภายใน slice และ Thai source-locale display resources
- **Persistence:** ไม่แก้ adapter/schema; bootstrap ถอด application-only `revision` ออกจาก payload และเก็บ revision ที่ envelope ตาม contract
- **UI:** ไม่แก้ renderer contract; projector ซ่อน Bond ตามองก์และส่งเฉพาะ immutable display data
- **Security/privacy:** ไม่มี `innerHTML`, executable content, telemetry, backend, secret, credential หรือข้อมูลส่วนบุคคล

## 3. สิ่งที่ทำและรายการไฟล์ที่เปลี่ยนแปลง (Manifest of Changes)

### 3.1 ไฟล์ที่สร้างใหม่ (Created)

- `index.html`: Semantic HTML5 ภาษาไทย, mobile viewport, metadata, stylesheet และ module entry point เดียว
- `src/data/content/prologue-slice.js`: validated/deep-frozen mock prologue, three choices, metrics/flag effects, feedback, recovery copy และ UI resource labels
- `src/bootstrap/index.js`: Composition Root, boot/load/resume/new-game lifecycle, immutable View Model projection, serialized intent dispatcher, choice persistence, announcement, GameOver retry, memory-only degradation และ fatal shell orchestration
- `tests/unit/bootstrap.test.js`: integration tests สำหรับ boot-to-save core loop, Resume/New Game revision replacement, crisis Retry, storage degradation/fatal handling และ hidden Bond projection
- `docs/changelog/2026-09/2026-09-02-0958-bootstrap-playable-slice.md`: บันทึก audit/trace/verification ฉบับนี้

### 3.2 ไฟล์ที่แก้ไข (Modified)

- `CHANGELOG.md`: เปิด release `[0.2.0] - 2026-09-02` และประกาศ Sprint 1 Core Vertical Slice Complete
- `docs/sprints/sprint-01-ssot.md`: ทำเครื่องหมาย Task 5 สำเร็จ, เปลี่ยนสถานะ Sprint เป็น Completed และลงทะเบียน Record ID
- `progress.md`: บันทึก continuity, verification evidence และ human-QA handoff

### 3.3 ไฟล์ที่ลบ (Deleted)

- None. Playwright artifacts ถูกย้ายออกจาก repository ไปยัง temporary workspace และไม่อยู่ใน release artifact

## 4. ผลการทดสอบและการตรวจรับ (Verification & Quality Evidence)

| Command / inspection | Result |
|---|---|
| `node --test tests/unit/bootstrap.test.js` | Passed: 5 tests, 0 failed |
| `node --test tests/unit/*.test.js` | Passed: 183 tests, 0 failed, 0 skipped, 0 todo |
| `python3 -m http.server 4173 --bind 127.0.0.1` + Playwright CLI (Chromium, 390x844) | Passed: static document and all imported ES modules returned 200/304 |
| Keyboard browser flow | Passed: Title -> New Game -> Cutscene -> Decision -> first choice -> Cutscene result using Enter/native focus |
| Choice/state/UI evidence | Passed: three choices rendered; first choice changed HP 80 -> 75, retained Sanity 70, persisted hidden Bond 10, and showed immediate Thai feedback |
| Save/reload evidence | Passed: canonical revision 2 (`choice-committed`), backup revision 1 (`new-game`), refresh offered New Game + Resume, Resume restored `node.prologue.after-leaf` and HP 75 |
| Browser console inspection | Passed: 0 errors, 0 warnings after favicon correction |
| Screenshot inspection | Passed: Title, Decision and post-choice screens inspected at mobile viewport; HUD, Thai narrative, feedback cards and action controls remained visible/readable |
| Architecture/static inspection | Passed: bootstrap contains orchestration/projection only; game rules/content remain in `src/data/content/`; no new runtime dependency |

### Verification not performed / not materialized

- The bundled `develop-web-game` client was invoked but its direct `playwright` package is absent. No project dependency was installed; the real-browser gate was completed with the supported Playwright CLI wrapper instead.
- Manual VoiceOver/NVDA, physical touch-device testing, and 200% browser zoom/reflow were not performed in this session. Keyboard semantics, accessible DOM snapshot, prior CSS target/contrast evidence, and mobile Chromium smoke passed, but no claim is made that full release-level assistive-technology acceptance passed.
- GitHub Pages deployment is outside Sprint 1 Task 5 and was not performed.

## 5. Migration, Rollback, Risks และ Follow-up

### Migration and rollback

- Save format remains current v1; no migration is required. New Game over an existing compatible save advances the revision monotonically before stage/commit.
- Rollback is a normal revert of the Task 5 feature commit. Existing namespaced LocalStorage data remains recoverable because no key or envelope contract changed; players may clear it only through the existing consented storage operation.

### Risks and assumptions

- The prologue is intentionally a Sprint 1 mock slice, not approved five-act production canon. Future narrative/content packages must replace it through governed content work without moving executable rules into bootstrap.
- Resume compatibility is intentionally limited to nodes and content version present in this slice. Future content versions require the approved migration/compatibility workflow.
- LocalStorage denial is treated as recoverable memory-only play per `FR-SAV-009`; unexpected adapter corruption is reserved for the fatal recovery shell.

### Follow-up and approvals required

- Human reviewer approval is required before merge into protected `develop`; no auto-merge is performed.
- UI/QA should complete manual screen-reader, 200% zoom/reflow, physical touch and broader browser-matrix acceptance before a production release.
- Narrative/Product owners must approve any promotion of this mock prologue text into production canon.
