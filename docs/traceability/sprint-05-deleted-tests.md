# Sprint 5 deleted tests · รายชื่อเทสต์ที่ลบใน C5e

| ข้อมูล | ค่า |
|---|---|
| **ระดับ** | Tier 1 · ภาคผนวกของ [ทะเบียน assertion ที่ถูกแทนที่ §5](sprint-05-superseded-assertions.md) |
| **ที่มา** | รันจริงก่อนลบ บน `39bf56b` (2026-11-09) ด้วย `node --test --test-reporter=tap` ทีละไฟล์ · ผ่านทุกข้อก่อนลบ ไม่มีข้อใดถูก skip |
| **จำนวน** | 846 เทสต์ระดับบนสุดใน 36 ไฟล์ที่ลบทั้งไฟล์ และ 84 เทสต์ย่อยซ้อนอยู่ใน 2 ไฟล์ในนั้น (รวม 930 ตามที่ `node --test` นับ: 1,349 ก่อนลบ − 413 หลังลบ + 14 ข้อใหม่ของ C5e − 20 ข้อที่ตัด) · และ 20 เทสต์ที่ตัดออกจากไฟล์ที่คงไว้ (§2) · โค้ดและเทสต์ทั้งหมดยังอยู่ใน git ที่ `39bf56b` |
| **บันทึก** | [CR-20261109-0500](../changelog/2026-11/2026-11-09-0500-c5e-journey-entry-and-sprint-4-runtime-removed.md) |

## 1. ไฟล์ที่ลบทั้งไฟล์

| ไฟล์ | เทสต์ | authority | เทสต์ทดแทน |
|---|---|---|---|
| `meters.test.js` | 12 | ADR-P0-032 D5 · ADR-P0-033 | `TC-S5-STATE-001` (`journey-rules.test.js`) |
| `game-state.test.js` | 10 | ADR-P0-033 D1.3 · ADR-P0-034 D9 | `TC-S5-STATE-001` (play-mode ใน `journey-session.test.js`) |
| `choice-transaction.test.js` | 25 | ADR-P0-034 D1 | `TC-S5-STATE-001` · `TC-S5-ENDING-001` · `TC-S5-CONVERGENCE-001` (`journey-session.test.js` · `journey-encounters.test.js`) |
| `content-graph.test.js` | 76 | ADR-P0-034 D1 | `TC-S5-STATE-001` · `TC-S5-CONTENT-001` (`journey-session.test.js` · `journey-content.test.js`) |
| `content-orchestration.test.js` | 30 | ADR-P0-034 D1 | `TC-S5-STATE-001` (`journey-session.test.js`) |
| `content-loader.test.js` | 163 | ADR-P0-034 D1 · D6 | `TC-S5-SCHEMA-001` · `TC-S5-PACKAGE-001` · invariant ใน §2 ย้ายไป `content-schema-validator.test.js` และ `published-schemas.test.js` |
| `content-migration.test.js` | 52 | มติ PO Q3 · ADR-P0-034 D8 | `TC-S5-LEGACY-001` (`journey-application.test.js`) |
| `pouch-migration.test.js` | 44 | มติ PO Q3 · ADR-P0-034 D8 | `TC-S5-LEGACY-001` |
| `closeout-bootstrap.test.js` | 28 | มติ PO Q3 · ADR-P0-034 D8 | `TC-S5-LEGACY-001` |
| `bootstrap.test.js` | 5 | ADR-P0-034 D1 | `TC-S5-PROTO-001` (`journey-shell.test.js` · `release-allowlist.test.js`) · `TC-S5-E2E-001` |
| `act1-bootstrap.test.js` | 35 | ADR-P0-034 D1 | `TC-S5-PROTO-001` · บันทึกเงียบใน `TC-S5-SILENT-001` (`journey-shell.test.js`) |
| `benchmark-bootstrap.test.js` | 28 | ADR-P0-034 D1 | `TC-S5-PROTO-001` |
| `narrative-bootstrap.test.js` | 3 | ADR-P0-034 D1 | `TC-S5-PROTO-001` |
| `pouch-bootstrap.test.js` | 6 | ADR-P0-034 D1 | `TC-S5-PROTO-001` · `TC-S5-UX-001` |
| `history-bootstrap.test.js` | 9 | ADR-P0-034 D1 | `TC-S5-PROTO-001` (แผงประวัติของ Journey ตาม UX §1.7 ยังไม่ทำ · `session-history.test.js` คงไว้) |
| `content-presentation.test.js` | 13 | ADR-P0-034 D9 · D10 | `TC-S5-PRESENTATION-001` (`journey-presentation.test.js`) · TC-S3-ARCH-001 ย้ายไป `architecture.test.js` |
| `closeout-presentation.test.js` | 25 | ADR-P0-034 D9 · D10 | `TC-S5-PRESENTATION-001` |
| `closeout-media.test.js` | 3 | ADR-P0-034 D9 · D10 | `TC-S5-ASSET-001` (`journey-media-resolver.test.js`) |
| `media-composition.test.js` | 5 | ADR-P0-034 D9 · D10 | `TC-S5-ASSET-001` (`journey-media-screens.test.js`) |
| `stage-view.test.js` | 4 | ADR-P0-034 D9 · D10 | `TC-S5-VN-001` · `TC-S5-STAGE-001` (`journey-renderer.test.js`) |
| `dom-renderer.test.js` | 26 | ADR-P0-022 D2 · ADR-P0-034 D10 | `TC-S5-VN-001` · `TC-S5-HUD-001` · `TC-S5-UX-001` · Safe DOM ใน `architecture.test.js` · บันทึกเงียบใน `journey-shell.test.js` |
| `vn-runtime-ergonomics.test.js` | 8 | ADR-P0-022 D2 · ADR-P0-034 D10 | `TC-S5-VN-001` · `TC-S5-HUD-001` (เป้ากด ≥ 44 และไม่มีแถบเลื่อนซ้อนใน `tests/e2e/journey-c4-design-system.mjs` · ไม่มีตัวเลขบนจอใน `journey-presentation.test.js`) |
| `history-dialog.test.js` | 7 | ADR-P0-034 D10 | `TC-S5-A11Y-001` (`journey-panels.test.js`) |
| `history-projection.test.js` | 11 | ADR-P0-034 D10 | `TC-S5-A11Y-001` · `TC-S5-UX-001` |
| `keepsake-pouch-dialog.test.js` | 13 | ADR-P0-034 D10 | `TC-S5-A11Y-001` (แผงกระเป๋าใน `journey-panels.test.js`) |
| `settings-dialog.test.js` | 4 | ADR-P0-034 D10 | `TC-S5-A11Y-001` (แผงตั้งค่าใน `journey-panels.test.js`) |
| `narrative-content.test.js` | 33 | ADR-P0-023 · ADR-P0-032 v2.0 | `TC-S5-CONTENT-001` · `TC-S5-LORE-001` (`journey-content.test.js`) |
| `narrative-adr-021.test.js` | 14 | ADR-P0-023 · ADR-P0-032 v2.0 | `TC-S5-CONTENT-001` · `TC-S5-THAI-001` (compiler ปฏิเสธขีดและ emoji · `journey-content.test.js` ไม่มีบทซ้ำและไม่มีคำของระบบ) |
| `narrative-handoff.test.js` | 19 | ADR-P0-023 · ADR-P0-032 v2.0 | `TC-S5-CONTENT-001` |
| `pouch-schema.test.js` | 44 | มติ PO Q3 | `TC-S5-SAVE-001` (`journey-save.test.js`) · TC-S4-ARCH-001 ย้ายไป `architecture.test.js` · SHA ของ schema ไป `published-schemas.test.js` · TC-S4-ASSET-001 ไป `asset-provenance.test.js` |
| `ui-preferences.test.js` | 7 | ADR-P0-034 D8 | `TC-S5-LEGACY-001` (`journey-application.test.js`) |
| `asset-manifest.test.js` | 4 | ADR-P0-034 D6 | `TC-S5-ASSET-001` (`journey-media-resolver.test.js` ตรวจภาพทั้ง 70 ไฟล์ของ manifest v2 · `asset-provenance.test.js`) |
| `persistence.test.js` | 27 | ADR-P0-034 D7.3 · D8 | `TC-S5-SAVE-001` · `TC-S5-SAVE-002` (`journey-save.test.js`) |
| `journey-legacy-rehearsal.test.js` | 1 | ADR-P0-034 D1.3 · D8 | `TC-S5-LEGACY-001` (ไบต์ของ key เดิมใน `journey-application.test.js`) · ซ้อมย้อนกลับด้วย `tests/release/verify-static-artifact.mjs` (stage Sprint 4 ที่ `bc167d3`) |
| `asset-resolver.test.js` | 46 | ADR-P0-034 D10.3 · CR-20261109-0430 | `TC-S5-ASSET-001` (`journey-media-resolver.test.js`: same-origin · ไม่มี redirect · ชนิด · ความยาว · header · SHA-256 · ยกเลิก · หมดเวลา) |
| `asset-preloader.test.js` | 6 | ADR-P0-034 D10.3 | `TC-S5-ASSET-001` (Journey โหลดภาพตามที่จอแสดงผ่าน image cache · `journey-media-screens.test.js`) |

## 2. เทสต์ที่ตัดออกจากไฟล์ที่คงไว้

| ไฟล์ | เทสต์ที่ตัด | authority | เทสต์ทดแทน |
|---|---|---|---|
| `ports.test.js` | 9: `FR-UI-001 exposes the immutable RenderPort operation and error contract` · `FR-SAV-001 exposes the immutable SaveRepositoryPort operation and error contract` · `NFR-MA-001 RenderPort validation accepts a complete structural adapter without invocation` · `NFR-MA-001 StoragePort validation accepts a complete structural adapter without invocation` · `NFR-MA-001 RenderPort rejects non-objects, arrays, missing methods, and non-callable methods` · `NFR-MA-001 StoragePort rejects non-objects, arrays, missing methods, and non-callable methods` · `NFR-PO-003 RendererPort facade is frozen, binds adapter context, and forwards exact arguments` · `NFR-MA-001 StoragePort facade is frozen, binds adapter context, and preserves typed outcomes` · `NFR-MA-001 port facades expose no concrete adapter properties` | ADR-P0-034 D1 (RendererPort และ StoragePort ของ runtime เดิมถูกลบ) | AudioPort สามเทสต์คงไว้ · หน้าจอและเซฟของ Journey มีสัญญาของตัวเอง (`journey-renderer.test.js` · `journey-save.test.js`) |
| `keepsake-pouch.test.js` | 11: `TC-S4-STATE-001 application rejects stale without snapshot changes` · `TC-S4-STATE-001 application rejects unsafe without snapshot changes` · `TC-S4-STATE-001 application rejects other node without snapshot changes` · `TC-S4-STATE-001 application rejects reading without snapshot changes` · `TC-S4-STATE-001 application rejects unknown offer without snapshot changes` · `TC-S4-STATE-001 application rejects unknown item without snapshot changes` · `TC-S4-STATE-001 application rejects unknown old item without snapshot changes` · `TC-S4-STATE-001 application rejects wrong offer item without snapshot changes` · `TC-S4-STATE-001 application rejects forbidden action without snapshot changes` · `TC-S4-STATE-001 application rejects no offer without snapshot changes` · `TC-S4-STATE-001 atomic guarded replacement, double input and no stat reward` | ADR-P0-034 D1 (`pouch-transaction.js` ของ runtime เดิม) | `TC-S5-STATE-001` · `TC-S5-INLINE-001`: ข้อเสนอรับของผูก revision ใน `journey-session.test.js` และ `journey-encounters.test.js` · โดเมนกระเป๋าคงไว้ในไฟล์เดิม |

## 3. รายชื่อเทสต์ทีละตัว

### `meters.test.js` (12)

- FR-ENG-001 exposes the canonical immutable meter contract
- FR-ENG-001 clamps every normative acceptance boundary
- FR-ENG-001 rejects non-safe-integer meter values without coercion
- FR-STA-004 creates the immutable 80/70/0 baseline without aliasing input
- FR-ENG-001 rejects incomplete, unknown, mistyped, and out-of-range snapshots
- FR-ENG-001 applies simultaneous deltas and clamps each result
- FR-ENG-001 rejects malformed deltas and safe-integer overflow
- FR-ENG-001 aggregates adjustments before clamp and is effect-order invariant
- FR-ENG-001 applies independent set and adjust effects atomically
- FR-ENG-002 rejects every set/adjust conflict, including a zero adjustment
- FR-ENG-001 rejects malformed metric effects without changing pre-state
- ADR-P0-004 returns the same immutable metrics for repeated fixed inputs

### `game-state.test.js` (10)

- FR-STA-002 publishes only the six schema-compatible states
- FR-STA-003 publishes a unique immutable TR-001..TR-020 table
- TR-001..TR-020 each produce exactly one deterministic transition plan
- FR-STA-003 rejects every declared guard-false scenario without mutation
- FR-STA-003 rejects all 84 forbidden active-state/event pairs
- FR-STA-002 rejects invalid states and keeps Initial out of persisted state
- FR-STA-003 rejects unknown events, malformed requests, and malformed context
- TR-007 and TR-014 recognize both crisis meters at their zero boundary
- TR-012 and TR-013 are mutually exclusive for one COMMIT_CHOICE request
- ADR-P0-004 leaves frozen input unchanged and plans deterministically

เทสต์ย่อย (65):

- TR-001
- TR-002
- TR-003
- TR-004
- TR-005
- TR-006
- TR-007
- TR-008
- TR-009
- TR-010
- TR-011
- TR-012
- TR-013
- TR-014
- TR-015
- TR-016
- TR-017
- TR-018
- TR-019
- TR-020
- TR-001 content invalid
- TR-001 application not composed
- TR-002 confirmation incomplete
- TR-002 entry references invalid
- TR-003 no compatible save
- TR-004 no remaining beat
- TR-004 input locked
- TR-005 wrong target type
- TR-005 entry condition false
- TR-005 target invalid
- TR-006 wrong target type
- TR-006 entry condition false
- TR-006 fewer than two choices
- TR-006 invalid choice count
- TR-007 assist enabled
- TR-007 no crisis
- TR-007 invalid metrics
- TR-008 not final
- TR-008 no ending
- TR-009 event ineligible
- TR-009 occurrence at max
- TR-009 wrong target type
- TR-009 target invalid
- TR-010 exit guard false
- TR-010 wrong target type
- TR-010 target invalid
- TR-011 wrong target type
- TR-011 entry condition false
- TR-011 target invalid
- TR-012/013 choice ineligible
- TR-012/013 stale command
- TR-012/013 revision mismatch
- TR-012/013 unsupported target
- TR-012/013 invalid target
- TR-012/013 crisis wins
- TR-012/013 ending wins
- TR-014 assist enabled
- TR-014 no crisis
- TR-015 neither gate nor repair
- TR-016 checkpoint invalid
- TR-016 references incompatible
- TR-017 no accepted setting
- TR-018 active transaction
- TR-019 progress not committed
- TR-020 replay checkpoint absent


### `choice-transaction.test.js` (25)

- FR-ENG-002 exports immutable outcome, crisis, and error vocabularies
- FR-ENG-002 evaluates every metric comparison operator at its boundary
- FR-ENG-002 evaluates flag, compound all/any/not, and always conditions
- FR-ENG-002 validates every compound branch rather than hiding malformed trailing input
- FR-ENG-002 rejects malformed condition snapshots, operators, arrays, and excessive depth
- FR-ENG-002 commits metric and typed flag effects atomically to a Cutscene
- TR-013 resolves an eligible choice to Exploration
- TR-015 resolves an approved final gate to Ending only after effects
- FR-ENG-002 resolves HP before Sanity when both reach zero
- FR-ENG-002 distinguishes a Sanity-only crisis
- FR-ENG-002 Story Assist clamps crisis meters at one and preserves Bond and flags
- FR-ENG-002 evaluates guards only from the immutable pre-choice snapshot
- FR-ENG-003 rejects locked, stale, and mismatched commands atomically
- FR-ENG-003 replayed duplicate and competing submits cannot commit against the current snapshot
- FR-ENG-002 rejects metric, flag, and checkpoint effect conflicts with full rollback
- FR-ENG-002 enforces registered flag types and fully materialized defaults
- FR-ENG-002 requires explicit counter policy and applies saturate or reject deterministically
- FR-ENG-002 protects monotonic markers while allowing an explicit reversible policy
- GDD-FLG-002 rejects a clear that lacks an explicit reversible policy
- FR-ENG-002 validates target identity, type, entry guard, and Ending guard
- FR-ENG-002 creates a schema-shaped checkpoint only with complete checkpoint context
- FR-ENG-002 keeps history bounded and increments sequence and revision exactly once
- FR-ENG-002 rejects revision and history sequence overflow without commit
- FR-ENG-002 rejects malformed snapshot, command, and untrusted JSON values atomically
- ADR-P0-004 accepts deeply frozen inputs and returns deterministic deep-frozen output

เทสต์ย่อย (19):

- input locked
- stale revision
- choice ID mismatch
- set and adjust same metric
- two operations on one flag
- two checkpoint effects
- unknown effect flag
- wrong set value type
- missing materialized default
- duplicate flag snapshot ID
- target ID mismatch
- target type invalid
- entry guard false
- ending gate false
- wrong state
- invalid snapshot revision
- invalid metric snapshot
- invalid committedAt
- non JSON domain value


### `content-graph.test.js` (76)

- tc.act1.structure NAR-BRN-004: 7 scenes, 14/14 nodes, 21/21 edges with feasible witnesses
- tc.act1.structure every reachable state has a feasible continuation to rest; SCC exploration has an exit
- tc.act1.routes NAR-SC-A1-001..007: mother/call/keep, exploration=none
- tc.act1.routes NAR-SC-A1-001..007: mother/call/keep, exploration=some
- tc.act1.routes NAR-SC-A1-001..007: mother/call/keep, exploration=all
- tc.act1.routes NAR-SC-A1-001..007: mother/call/release, exploration=none
- tc.act1.routes NAR-SC-A1-001..007: mother/call/release, exploration=some
- tc.act1.routes NAR-SC-A1-001..007: mother/call/release, exploration=all
- tc.act1.routes NAR-SC-A1-001..007: mother/safety/keep, exploration=none
- tc.act1.routes NAR-SC-A1-001..007: mother/safety/keep, exploration=some
- tc.act1.routes NAR-SC-A1-001..007: mother/safety/keep, exploration=all
- tc.act1.routes NAR-SC-A1-001..007: mother/safety/release, exploration=none
- tc.act1.routes NAR-SC-A1-001..007: mother/safety/release, exploration=some
- tc.act1.routes NAR-SC-A1-001..007: mother/safety/release, exploration=all
- tc.act1.routes NAR-SC-A1-001..007: roots/call/keep, exploration=none
- tc.act1.routes NAR-SC-A1-001..007: roots/call/keep, exploration=some
- tc.act1.routes NAR-SC-A1-001..007: roots/call/keep, exploration=all
- tc.act1.routes NAR-SC-A1-001..007: roots/call/release, exploration=none
- tc.act1.routes NAR-SC-A1-001..007: roots/call/release, exploration=some
- tc.act1.routes NAR-SC-A1-001..007: roots/call/release, exploration=all
- tc.act1.routes NAR-SC-A1-001..007: roots/safety/keep, exploration=none
- tc.act1.routes NAR-SC-A1-001..007: roots/safety/keep, exploration=some
- tc.act1.routes NAR-SC-A1-001..007: roots/safety/keep, exploration=all
- tc.act1.routes NAR-SC-A1-001..007: roots/safety/release, exploration=none
- tc.act1.routes NAR-SC-A1-001..007: roots/safety/release, exploration=some
- tc.act1.routes NAR-SC-A1-001..007: roots/safety/release, exploration=all
- tc.act1.routes NAR-SC-A1-001..007: siblings/call/keep, exploration=none
- tc.act1.routes NAR-SC-A1-001..007: siblings/call/keep, exploration=some
- tc.act1.routes NAR-SC-A1-001..007: siblings/call/keep, exploration=all
- tc.act1.routes NAR-SC-A1-001..007: siblings/call/release, exploration=none
- tc.act1.routes NAR-SC-A1-001..007: siblings/call/release, exploration=some
- tc.act1.routes NAR-SC-A1-001..007: siblings/call/release, exploration=all
- tc.act1.routes NAR-SC-A1-001..007: siblings/safety/keep, exploration=none
- tc.act1.routes NAR-SC-A1-001..007: siblings/safety/keep, exploration=some
- tc.act1.routes NAR-SC-A1-001..007: siblings/safety/keep, exploration=all
- tc.act1.routes NAR-SC-A1-001..007: siblings/safety/release, exploration=none
- tc.act1.routes NAR-SC-A1-001..007: siblings/safety/release, exploration=some
- tc.act1.routes NAR-SC-A1-001..007: siblings/safety/release, exploration=all
- tc.act1.observations NAR-SC-A1-002: all 24 hotspot orders commute without a completion prerequisite
- tc.act1.observations counter boundary 0, repeat entry and revisit cannot farm
- tc.act1.observations counter boundary 19, repeat entry and revisit cannot farm
- tc.act1.observations counter boundary 20, repeat entry and revisit cannot farm
- tc.act1.observations D2: only declared first-observation events increment the counter
- tc.act1.variants home-focus unset: one expression including synthetic default
- tc.act1.variants home-focus mother: one expression including synthetic default
- tc.act1.variants home-focus roots: one expression including synthetic default
- tc.act1.variants home-focus siblings: one expression including synthetic default
- tc.act1.variants coping flags false/false: exclusive predicates and safe default
- tc.act1.variants coping flags false/true: exclusive predicates and safe default
- tc.act1.variants coping flags true/false: exclusive predicates and safe default
- tc.act1.variants coping flags true/true: exclusive predicates and safe default
- tc.act1.variants all 46 dialogue records and 13 events have Canon or synthetic-default witnesses
- tc.act1.preconditions NAR-SC-A1-006: discovery dominates keepsake; no extra progress flags
- tc.act1.preconditions FR-ENG-002: action guard uses pre-state and target guard uses post-effect candidate
- tc.act1.boundary D1: explicit checkpoint/rest contract, no Ending or Act 2 placeholder
- tc.act1.boundary Bond=0, notice precedes storm, and storm/rest effects add no damage
- GRAPH-GATE negative JSON fixture: invalid-orphan
- GRAPH-GATE negative JSON fixture: invalid-cycle
- GRAPH-GATE detects a state-closed cycle even when structural SCC has an exit
- GRAPH-GATE negative mutation: missing node target
- GRAPH-GATE negative mutation: duplicate ID
- GRAPH-GATE negative mutation: missing Thai
- GRAPH-GATE negative mutation: invalid checkpoint
- GRAPH-GATE negative mutation: missing callback
- GRAPH-GATE negative mutation: impossible action guard
- GRAPH-GATE negative mutation: impossible target guard
- GRAPH-GATE negative mutation: unreachable declared action
- GRAPH-GATE negative mutation: Decision to Decision
- GRAPH-GATE negative mutation: observation farming
- GRAPH-GATE negative mutation: missing event redirect
- GRAPH-GATE negative mutation: unmodelled trigger fails closed
- GRAPH-GATE negative mutation: automatic cutscene loop
- GRAPH-GATE catches ambiguous priority and missing variant fallback
- GRAPH-GATE adjacency includes event redirects for all triggers and retry edges
- FR-ENG-002 TR-014/016 fault fixture: crisis precedes normal target and retry remains guarded
- NAR-BRN-002 major choices have immediate feedback and deferred callback ledger trace

### `content-orchestration.test.js` (30)

- CR-0002 D3 real executor / mother / call-family / keep-fragment: pages, variants, Resume and flags
- CR-0002 D3 real executor / mother / call-family / release-fragment: pages, variants, Resume and flags
- CR-0002 D3 real executor / mother / seek-safety / keep-fragment: pages, variants, Resume and flags
- CR-0002 D3 real executor / mother / seek-safety / release-fragment: pages, variants, Resume and flags
- CR-0002 D3 real executor / roots / call-family / keep-fragment: pages, variants, Resume and flags
- CR-0002 D3 real executor / roots / call-family / release-fragment: pages, variants, Resume and flags
- CR-0002 D3 real executor / roots / seek-safety / keep-fragment: pages, variants, Resume and flags
- CR-0002 D3 real executor / roots / seek-safety / release-fragment: pages, variants, Resume and flags
- CR-0002 D3 real executor / siblings / call-family / keep-fragment: pages, variants, Resume and flags
- CR-0002 D3 real executor / siblings / call-family / release-fragment: pages, variants, Resume and flags
- CR-0002 D3 real executor / siblings / seek-safety / keep-fragment: pages, variants, Resume and flags
- CR-0002 D3 real executor / siblings / seek-safety / release-fragment: pages, variants, Resume and flags
- FR-ENG-008 repeated hotspots neither farm counters nor lose a saved dialogue cursor
- FR-SAV-009 on-enter resume is idempotent even with a nonzero entry delta
- CR-0002 D1 final rest checkpoint waits for the last-page acknowledgement
- FR-ENG-002 stale commands and unavailable actions preserve the original frozen snapshot
- FR-ENG-002 target guard evaluates post-choice effects while precondition evaluates pre-state
- FR-SAV-006 content semantic recovery rejects unknown node
- FR-SAV-006 content semantic recovery rejects state mismatch
- FR-SAV-006 content semantic recovery rejects nonzero Bond
- FR-SAV-006 content semantic recovery rejects invalid enum
- FR-SAV-006 content semantic recovery rejects unknown progress ID
- FR-SAV-006 content semantic recovery rejects foreign cursor
- FR-SAV-006 content semantic recovery rejects checkpoint mismatch
- FR-SAV-006 content semantic recovery rejects future event
- FR-SAV-006 missing discovery occurrence and unapplied storm effects cannot resume
- CR-0002 D3 unsupported executor capability fails before session creation
- FR-SAV-009 forged early completion and future checkpoints cannot skip the reading boundary
- FR-SAV-009 retry removes completion after a before-node checkpoint but retains reading history
- FR-ENG-002 failed entry effects roll back the entire choice transaction

### `content-loader.test.js` (163)

- tc.act1.schema FR-CNT-001/002: canonical Act 1 loads from JSON and object with immutable indexes
- tc.act1.schema canonical JSON same-origin load at /
- tc.act1.schema canonical JSON same-origin load at /JaoKob/
- FR-CNT-001/002 valid object/JSON yield separate deeply immutable records and indexes
- FR-CNT-001/002 fixture invalid-missing-fields fails with code and path
- FR-CNT-001/002 fixture invalid-dangling-reference fails with code and path
- FR-CNT-001/002 fixture invalid-duplicate-id fails with code and path
- FR-CNT-001/002 fixture invalid-flag-policy fails with code and path
- FR-CNT-001/002 DR-* rejects future package version
- FR-CNT-001/002 DR-* rejects numeric package version
- FR-CNT-001/002 DR-* rejects mixed tree schema version
- FR-CNT-001/002 DR-* rejects future nested catalog version
- FR-CNT-001/002 DR-* rejects invalid content semver
- FR-CNT-001/002 DR-* rejects missing schema version
- FR-CNT-001/002 DR-* rejects missing Thai
- FR-CNT-001/002 DR-* rejects missing nested settings
- FR-CNT-001/002 DR-* rejects numeric string meter
- FR-CNT-001/002 DR-* rejects fractional meter
- FR-CNT-001/002 DR-* rejects meter bounds
- FR-CNT-001/002 DR-* rejects settings boolean coercion
- FR-CNT-001/002 DR-* rejects settings numeric bounds
- FR-CNT-001/002 DR-* rejects unknown root property
- FR-CNT-001/002 DR-* rejects unknown dialogue variant field
- FR-CNT-001/002 DR-* rejects unknown effect
- FR-CNT-001/002 DR-* rejects wrong condition type
- FR-CNT-001/002 DR-* rejects bad locale key
- FR-CNT-001/002 DR-* rejects blank Thai
- FR-CNT-001/002 DR-* rejects HTML injection
- FR-CNT-001/002 DR-* rejects missing Thai supported locale
- FR-CNT-001/002 DR-* rejects unsupported default locale
- FR-CNT-001/002 DR-* rejects duplicate locales
- FR-CNT-001/002 DR-* rejects wrong catalog object shape
- FR-CNT-001/002 DR-* rejects missing character
- FR-CNT-001/002 DR-* rejects character enum
- FR-CNT-001/002 DR-* rejects unequal localized lists
- FR-CNT-001/002 DR-* rejects missing speaker
- FR-CNT-001/002 DR-* rejects missing entry tree
- FR-CNT-001/002 DR-* rejects missing node
- FR-CNT-001/002 DR-* rejects duplicate node
- FR-CNT-001/002 DR-* rejects duplicate cross-catalog ID
- FR-CNT-001/002 DR-* rejects missing warning
- FR-CNT-001/002 DR-* rejects missing portrait
- FR-CNT-001/002 DR-* rejects dialogue delivery enum
- FR-CNT-001/002 DR-* rejects missing test reference
- FR-CNT-001/002 DR-* rejects checkpoint none with ID
- FR-CNT-001/002 DR-* rejects rest needs checkpoint
- FR-CNT-001/002 DR-* rejects rest cannot also target a node
- FR-CNT-001/002 DR-* rejects rest cannot claim Act 2
- FR-CNT-001/002 DR-* rejects rest needs marker effect
- FR-CNT-001/002 DR-* rejects rest cannot be fake ending
- FR-CNT-001/002 DR-* rejects flag default type
- FR-CNT-001/002 DR-* rejects marker must start false
- FR-CNT-001/002 DR-* rejects missing explicit policy
- FR-CNT-001/002 DR-* rejects counter bounds inverted
- FR-CNT-001/002 DR-* rejects counter must saturate
- FR-CNT-001/002 DR-* rejects counter must be monotonic
- FR-CNT-001/002 DR-* rejects unknown enum default
- FR-CNT-001/002 DR-* rejects enum missing unset default
- FR-CNT-001/002 DR-* rejects unknown policy field
- FR-CNT-001/002 DR-* rejects flag condition type
- FR-CNT-001/002 DR-* rejects unknown flag reference
- FR-CNT-001/002 DR-* rejects marker reset
- FR-CNT-001/002 DR-* rejects monotonic counter decrease
- FR-CNT-001/002 DR-* rejects counter direct assignment
- FR-CNT-001/002 DR-* rejects unknown enum assignment
- FR-CNT-001/002 DR-* rejects non-reversible clear
- FR-CNT-001/002 DR-* rejects boolean cannot increment
- FR-CNT-001/002 DR-* rejects Act 1 Bond effect
- FR-CNT-001/002 DR-* rejects conflicting metric effects
- FR-CNT-001/002 DR-* rejects conflicting flag effects
- FR-CNT-001/002 DR-* rejects missing checkpoint target
- FR-CNT-002 nested dangling next node
- FR-CNT-002 nested unguarded cutscene cycle
- FR-CNT-002 nested disabled reason
- FR-CNT-002 nested duplicate interaction/choice
- FR-CNT-002 nested missing callback event
- FR-CNT-002 nested missing trigger choice
- FR-CNT-002 nested event unknown condition flag
- FR-CNT-002 nested event bounds
- FR-CNT-002 nested event bad effect
- FR-CNT-002 nested node-only field on choice
- FR-CNT-002 nested duplicate checkpoint
- FR-CNT-002 nested checkpoint policy without ID
- CR-0002 D2 permits initial unset, known enum choices and positive saturating counter adjustments
- FR-CNT-004 wrong requested content version cannot silently load
- DR-001 test-reference catalog is external, required and rejects duplicates
- NFR-SE-002 non-JSON/root type null is rejected without coercion
- NFR-SE-002 non-JSON/root type  is rejected without coercion
- NFR-SE-002 non-JSON/root type 1 is rejected without coercion
- NFR-SE-002 non-JSON/root type true is rejected without coercion
- NFR-SE-002 non-JSON/root type undefined is rejected without coercion
- NFR-SE-002 non-JSON/root type () => true is rejected without coercion
- NFR-SE-002 non-JSON/root type NaN is rejected without coercion
- NFR-SE-002 non-JSON/root type Infinity is rejected without coercion
- NFR-SE-002 non-JSON/root type 1 is rejected without coercion
- NFR-SE-002 non-JSON/root type Symbol(value) is rejected without coercion
- NFR-SE-002 getters/toJSON/custom prototypes/sparse arrays/cycles fail without running accessors
- NFR-SE-002 cyclic/deep hostile input is bounded, diagnostics never echo content
- NFR-SE-002 __proto__ cannot pollute indexes or records
- TC-S3-CONTRACT-001 CR-0002 D4/CR-0003 D1 frozen catalog exactly matches all local content schema sources
- CR-0002 D1 old 1.0 schema remains supported and never accepts the new rest fields
- TC-S3-CONTRACT-001 CR-0003 D1 published root/1.1 schemas remain byte-identical
- TC-S3-CONTRACT-001 CR-0003 D1 schema 1.2 is exactly the approved additive 1.1 delta
- TC-S3-CONTRACT-001 FR-CNT-001/002 schema 1.2 resolves immutable environment and portrait asset records
- TC-S3-CONTRACT-001 CR-0003 D1 cutscene permits absent, empty and individual environment channels
- TC-S3-CONTRACT-001 CR-0003 D1 cutscene rejects null
- TC-S3-CONTRACT-001 CR-0003 D1 cutscene rejects unknown weather
- TC-S3-CONTRACT-001 CR-0003 D1 cutscene rejects raw URL
- TC-S3-CONTRACT-001 CR-0003 D1 cutscene rejects null channel
- TC-S3-CONTRACT-001 CR-0003 D1 cutscene rejects arbitrary metadata
- TC-S3-CONTRACT-001 CR-0003 D1 exploration permits absent, empty and individual environment channels
- TC-S3-CONTRACT-001 CR-0003 D1 exploration rejects null
- TC-S3-CONTRACT-001 CR-0003 D1 exploration rejects unknown weather
- TC-S3-CONTRACT-001 CR-0003 D1 exploration rejects raw URL
- TC-S3-CONTRACT-001 CR-0003 D1 exploration rejects null channel
- TC-S3-CONTRACT-001 CR-0003 D1 exploration rejects arbitrary metadata
- TC-S3-CONTRACT-001 CR-0003 D1 decision permits absent, empty and individual environment channels
- TC-S3-CONTRACT-001 CR-0003 D1 decision rejects null
- TC-S3-CONTRACT-001 CR-0003 D1 decision rejects unknown weather
- TC-S3-CONTRACT-001 CR-0003 D1 decision rejects raw URL
- TC-S3-CONTRACT-001 CR-0003 D1 decision rejects null channel
- TC-S3-CONTRACT-001 CR-0003 D1 decision rejects arbitrary metadata
- TC-S3-CONTRACT-001 CR-0003 D1 legacy exploration background is accepted alone and rejected beside any environment
- TC-S3-CONTRACT-001 CR-0003 D1 schema 1.0.0 retains legacy forms and rejects environment
- TC-S3-CONTRACT-001 CR-0003 D1 schema 1.1.0 retains legacy forms and rejects environment
- TC-S3-CONTRACT-001 CR-0003 D1 rejects mixed 1.2.0 package/1.1.0 tree
- TC-S3-CONTRACT-001 CR-0003 D1 rejects mixed 1.1.0 package/1.2.0 tree
- TC-S3-CONTRACT-001 CR-0003 D1 rejects mixed 1.2.0 package/1.0.0 tree
- TC-S3-CONTRACT-001 CR-0003 D1 rejects mixed 1.2.0 package/1.3.0 tree
- TC-S3-CONTRACT-001 CR-0003 D1 future versions and version 1.2 nested catalogs fail closed
- TC-S3-CONTRACT-001 CR-0003 D1 game-over cannot acquire environment
- TC-S3-CONTRACT-001 CR-0003 D1 ending cannot acquire environment
- TC-S3-CONTRACT-001 FR-CNT-002 node 0 background rejects dangling IDs and every wrong asset type
- TC-S3-CONTRACT-001 FR-CNT-002 node 0 music rejects dangling IDs and every wrong asset type
- TC-S3-CONTRACT-001 FR-CNT-002 node 0 ambience rejects dangling IDs and every wrong asset type
- TC-S3-CONTRACT-001 FR-CNT-002 node 1 background rejects dangling IDs and every wrong asset type
- TC-S3-CONTRACT-001 FR-CNT-002 node 1 music rejects dangling IDs and every wrong asset type
- TC-S3-CONTRACT-001 FR-CNT-002 node 1 ambience rejects dangling IDs and every wrong asset type
- TC-S3-CONTRACT-001 FR-CNT-002 node 2 background rejects dangling IDs and every wrong asset type
- TC-S3-CONTRACT-001 FR-CNT-002 node 2 music rejects dangling IDs and every wrong asset type
- TC-S3-CONTRACT-001 FR-CNT-002 node 2 ambience rejects dangling IDs and every wrong asset type
- TC-S3-CONTRACT-001 FR-CNT-002 legacy exploration background rejects dangling IDs and every wrong asset type
- TC-S3-CONTRACT-001 FR-CNT-002 default character portrait rejects dangling IDs and every wrong asset type
- TC-S3-CONTRACT-001 FR-CNT-002 dialogue portrait rejects dangling IDs and every wrong asset type
- Draft 2020-12 local refs apply sibling assertions, Unicode lengths and conditional required fields
- CR-0002 D4 unknown keywords, unsupported formats and non-local refs fail closed
- Draft 2020-12 oneOf/anyOf/not/arrays enforce exact alternatives and structural uniqueness
- FR-CNT-006 assets require provenance and conditional image alt; relative paths and URI formats are asserted
- NFR-PO-002 same-origin JSON fetch resolves below https://example.test/
- NFR-PO-002 same-origin JSON fetch resolves below https://example.test/JaoKob/
- NFR-SE-002 rejects URL https://other.test/data.json before reading
- NFR-SE-002 rejects URL //other.test/data.json before reading
- NFR-SE-002 rejects URL file:///tmp/package.json before reading
- NFR-SE-002 rejects URL data:application/json,{} before reading
- NFR-SE-002 rejects URL javascript:alert(1) before reading
- NFR-SE-002 rejects URL https://user:pass@example.test/data.json before reading
- NFR-SE-002 rejects URL /data.json\#fragment before reading
- FR-CNT-001 load fault HTTP error returns typed failure without partial data
- FR-CNT-001 load fault redirect returns typed failure without partial data
- FR-CNT-001 load fault cross-origin response returns typed failure without partial data
- FR-CNT-001 load fault invalid JSON returns typed failure without partial data
- FR-CNT-001 load fault read error returns typed failure without partial data
- FR-CNT-001 rejected fetch is recoverable and JSON reader rejects non-text input

### `content-migration.test.js` (52)

- TC-S3-SAVE-001 approved source archive is pinned to original 559b6d7 bytes
- TC-S3-SAVE-001 2.0→2.1 exact cursor/settings, full route mother/call-family/keep-fragment
- TC-S3-SAVE-001 2.0→2.1 exact cursor/settings, full route mother/call-family/release-fragment
- TC-S3-SAVE-001 2.0→2.1 exact cursor/settings, full route mother/seek-safety/keep-fragment
- TC-S3-SAVE-001 2.0→2.1 exact cursor/settings, full route mother/seek-safety/release-fragment
- TC-S3-SAVE-001 2.0→2.1 exact cursor/settings, full route roots/call-family/keep-fragment
- TC-S3-SAVE-001 2.0→2.1 exact cursor/settings, full route roots/call-family/release-fragment
- TC-S3-SAVE-001 2.0→2.1 exact cursor/settings, full route roots/seek-safety/keep-fragment
- TC-S3-SAVE-001 2.0→2.1 exact cursor/settings, full route roots/seek-safety/release-fragment
- TC-S3-SAVE-001 2.0→2.1 exact cursor/settings, full route siblings/call-family/keep-fragment
- TC-S3-SAVE-001 2.0→2.1 exact cursor/settings, full route siblings/call-family/release-fragment
- TC-S3-SAVE-001 2.0→2.1 exact cursor/settings, full route siblings/seek-safety/keep-fragment
- TC-S3-SAVE-001 2.0→2.1 exact cursor/settings, full route siblings/seek-safety/release-fragment
- TC-S3-SAVE-001 repeated observations retain cursor recency and occurrence counts
- TC-S3-SAVE-001 compatibility proof rejects changed dialogue text
- TC-S3-SAVE-001 compatibility proof rejects changed dialogue speaker
- TC-S3-SAVE-001 compatibility proof rejects changed delivery emotion
- TC-S3-SAVE-001 compatibility proof rejects changed dialogue order
- TC-S3-SAVE-001 compatibility proof rejects changed life stage
- TC-S3-SAVE-001 compatibility proof rejects changed appearance
- TC-S3-SAVE-001 compatibility proof rejects changed defaults including zero audio
- TC-S3-SAVE-001 compatibility proof rejects changed default metrics
- TC-S3-SAVE-001 compatibility proof rejects changed checkpoint policy
- TC-S3-SAVE-001 compatibility proof rejects changed choice condition
- TC-S3-SAVE-001 compatibility proof rejects changed choice effect
- TC-S3-SAVE-001 compatibility proof rejects changed choice order
- TC-S3-SAVE-001 compatibility proof rejects changed interaction feedback
- TC-S3-SAVE-001 compatibility proof rejects changed event effect
- TC-S3-SAVE-001 compatibility proof rejects changed flag policy
- TC-S3-SAVE-001 proof accepts only approved asset bindings and ignores object key order
- TC-S3-SAVE-001 compatibility proof denies old schema target
- TC-S3-SAVE-001 compatibility proof denies mixed tree schema
- TC-S3-SAVE-001 compatibility proof denies future package
- TC-S3-SAVE-001 compatibility proof denies unknown field
- TC-S3-SAVE-001 compatibility proof denies unresolved media
- TC-S3-SAVE-001 compatibility proof denies unknown stable node ID
- TC-S3-SAVE-001 factory fails closed without supported reviewed source and does not mutate packages
- TC-S3-SAVE-001 mapping and replacement predicate deny Mock without source changes
- TC-S3-SAVE-001 mapping and replacement predicate deny future content without source changes
- TC-S3-SAVE-001 mapping and replacement predicate deny future format without source changes
- TC-S3-SAVE-001 mapping and replacement predicate deny source integrity without source changes
- TC-S3-SAVE-001 mapping and replacement predicate deny invalid settings without source changes
- TC-S3-SAVE-001 mapping and replacement predicate deny unknown save field without source changes
- TC-S3-SAVE-001 mapping and replacement predicate deny unknown node without source changes
- TC-S3-SAVE-001 mapping and replacement predicate deny state mismatch without source changes
- TC-S3-SAVE-001 mapping and replacement predicate deny invalid cursor without source changes
- TC-S3-SAVE-001 mapping and replacement predicate deny wrong checkpoint without source changes
- TC-S3-SAVE-001 mapping and replacement predicate deny nonzero Bond without source changes
- TC-S3-SAVE-001 target exact validation preserves existing integrity and never guesses downgrade
- TC-S3-SAVE-001 missing causal event and forged completed cursor cannot migrate
- TC-S3-SAVE-001 malformed data, getters and cycles fail without inspection side effects
- TC-S3-SAVE-001 read-only candidate preparation retains every raw slot, including unsupported records

### `pouch-migration.test.js` (44)

- TC-S4-SAVE-001 exact/idempotent migration every legacy page mother/call-family/keep-fragment
- TC-S4-SAVE-001 exact/idempotent migration every legacy page mother/call-family/release-fragment
- TC-S4-SAVE-001 exact/idempotent migration every legacy page mother/seek-safety/keep-fragment
- TC-S4-SAVE-001 exact/idempotent migration every legacy page mother/seek-safety/release-fragment
- TC-S4-SAVE-001 exact/idempotent migration every legacy page roots/call-family/keep-fragment
- TC-S4-SAVE-001 exact/idempotent migration every legacy page roots/call-family/release-fragment
- TC-S4-SAVE-001 exact/idempotent migration every legacy page roots/seek-safety/keep-fragment
- TC-S4-SAVE-001 exact/idempotent migration every legacy page roots/seek-safety/release-fragment
- TC-S4-SAVE-001 exact/idempotent migration every legacy page siblings/call-family/keep-fragment
- TC-S4-SAVE-001 exact/idempotent migration every legacy page siblings/call-family/release-fragment
- TC-S4-SAVE-001 exact/idempotent migration every legacy page siblings/seek-safety/keep-fragment
- TC-S4-SAVE-001 exact/idempotent migration every legacy page siblings/seek-safety/release-fragment
- TC-S4-SAVE-001 active held leaf and older empty checkpoint map independently
- TC-S4-SAVE-001 literal hasLeaf alias is unambiguous; production catalog still rejects unknown flags
- TC-S4-SAVE-001 protects future format
- TC-S4-SAVE-001 protects unknown content
- TC-S4-SAVE-001 protects prior content requires first step
- TC-S4-SAVE-001 protects source digest
- TC-S4-SAVE-001 protects unknown payload field
- TC-S4-SAVE-001 protects missing checkpoint
- TC-S4-SAVE-001 protects missing active leaf
- TC-S4-SAVE-001 protects bad checkpoint leaf
- TC-S4-SAVE-001 protects literal alias not in published save ID grammar
- TC-S4-SAVE-001 protects non JSON number
- TC-S4-SAVE-001 protects cycle
- TC-S4-SAVE-001 protects accessor
- TC-S4-CONTRACT-001 Save 2 rejects missing active pouch, never repairs to empty
- TC-S4-CONTRACT-001 Save 2 rejects missing checkpoint pouch, never repairs to empty
- TC-S4-CONTRACT-001 Save 2 rejects null pouch, never repairs to empty
- TC-S4-CONTRACT-001 Save 2 rejects bad capacity, never repairs to empty
- TC-S4-CONTRACT-001 Save 2 rejects duplicate slots, never repairs to empty
- TC-S4-CONTRACT-001 Save 2 rejects extra field, never repairs to empty
- TC-S4-SAVE-002 round trip retains released memory and independent checkpoint
- TC-S4-SAVE-002 migration/recovery is read-only; accepted writes back up exact legacy bytes
- TC-S4-SAVE-002 quota at staging preserves legacy canonical and recoverable candidate
- TC-S4-SAVE-002 quota at backup preserves legacy canonical and recoverable candidate
- TC-S4-SAVE-002 quota at canonical preserves legacy canonical and recoverable candidate
- TC-S4-SAVE-002 mixed protected record prevents any Save 2 write {corrupt
- TC-S4-SAVE-002 mixed protected record prevents any Save 2 write {"saveFormatVersion":3,"co
- TC-S4-SAVE-002 mixed protected record prevents any Save 2 write {"saveFormatVersion":2,"co
- TC-S4-SAVE-002 late future record blocks commit after staging
- TC-S4-SAVE-002 Save 2 can never be downgraded by a higher-revision Save 1 writer
- TC-S4-CONTRACT-001 unknown item and historical leaf mismatch fail semantic admission
- TC-S4-RETRY-001 checkpoint restores held/memory independently without changing settings

### `closeout-bootstrap.test.js` (28)

- TC-S4-E2E-001 production default starts3.0 with all presentation metadata and no eager legacy fetch
- TC-S4-SAVE-001 default production preserves every archived2.1 cursor/checkpoint mother/call-family/keep-fragment
- TC-S4-SAVE-001 default production preserves every archived2.1 cursor/checkpoint mother/call-family/release-fragment
- TC-S4-SAVE-001 default production preserves every archived2.1 cursor/checkpoint mother/seek-safety/keep-fragment
- TC-S4-SAVE-001 default production preserves every archived2.1 cursor/checkpoint mother/seek-safety/release-fragment
- TC-S4-SAVE-001 default production preserves every archived2.1 cursor/checkpoint roots/call-family/keep-fragment
- TC-S4-SAVE-001 default production preserves every archived2.1 cursor/checkpoint roots/call-family/release-fragment
- TC-S4-SAVE-001 default production preserves every archived2.1 cursor/checkpoint roots/seek-safety/keep-fragment
- TC-S4-SAVE-001 default production preserves every archived2.1 cursor/checkpoint roots/seek-safety/release-fragment
- TC-S4-SAVE-001 default production preserves every archived2.1 cursor/checkpoint siblings/call-family/keep-fragment
- TC-S4-SAVE-001 default production preserves every archived2.1 cursor/checkpoint siblings/call-family/release-fragment
- TC-S4-SAVE-001 default production preserves every archived2.1 cursor/checkpoint siblings/seek-safety/keep-fragment
- TC-S4-SAVE-001 default production preserves every archived2.1 cursor/checkpoint siblings/seek-safety/release-fragment
- TC-S4-SAVE-001 default chain admits Save1/2.1.0 only into exact2.1 continuation
- TC-S4-SAVE-001 default chain admits Save1/2.0.0 only into exact2.1 continuation
- TC-S4-SAVE-001 production3.0 exact Save2 secret/callback/checkpoint cursors resume without reads replaying effects
- TC-S4-SAVE-001 every published2.1 archive byte remains intact
- TC-S4-SAVE-002 legacy completion returns to current title, cancel preserves save, confirmed New Game starts3.0 empty
- TC-S4-SAVE-002 mixed generation canonical never allows a legacy writer to overwrite3.0
- TC-S4-SAVE-002 mixed generation staging never allows a legacy writer to overwrite3.0
- TC-S4-SAVE-002 mixed generation backup never allows a legacy writer to overwrite3.0
- TC-S4-SAVE-002 another tab's3.0 record appearing during a2.1 stage remains protected by the real default adapter
- TC-S4-SAVE-002 current title protects unsupported raw record {broken
- TC-S4-SAVE-002 current title protects unsupported raw record {"saveFormatVersion"
- TC-S4-SAVE-002 current title protects unsupported raw record {"saveFormatVersion"
- TC-S4-SAVE-002 stale New Game consent cannot erase a newly arrived record
- TC-S4-STATE-001 integrated Pouch/History/confirmation cancel are view-only; one replacement commits once
- TC-S4-RETRY-001 checkpoint recovery round-trips through production Resume with independent latest settings

### `bootstrap.test.js` (5)

- FR-STA-001 FR-ENG-002 FR-SAV-001 boot, DOM intent, transaction, and staged save form one playable slice
- FR-STA-001 offers Resume only for a compatible staged slice save and restores its Cutscene
- FR-UI-006 retries a Core-detected crisis from the immutable checkpoint without erasing the save
- FR-SAV-009 uses a visible memory-only warning for unavailable storage and reserves fatal shell for unrecoverable adapter faults
- FR-UI-001 projects an immutable View Model without exposing Bond during Act 1

### `act1-bootstrap.test.js` (35)

- FR-ENG/FR-SAV production DOM playthrough mother/call-family/keep-fragment
- FR-ENG/FR-SAV production DOM playthrough mother/call-family/release-fragment
- FR-ENG/FR-SAV production DOM playthrough mother/seek-safety/keep-fragment
- FR-ENG/FR-SAV production DOM playthrough mother/seek-safety/release-fragment
- FR-ENG/FR-SAV production DOM playthrough roots/call-family/keep-fragment
- FR-ENG/FR-SAV production DOM playthrough roots/call-family/release-fragment
- FR-ENG/FR-SAV production DOM playthrough roots/seek-safety/keep-fragment
- FR-ENG/FR-SAV production DOM playthrough roots/seek-safety/release-fragment
- FR-ENG/FR-SAV production DOM playthrough siblings/call-family/keep-fragment
- FR-ENG/FR-SAV production DOM playthrough siblings/call-family/release-fragment
- FR-ENG/FR-SAV production DOM playthrough siblings/seek-safety/keep-fragment
- FR-ENG/FR-SAV production DOM playthrough siblings/seek-safety/release-fragment
- FR-SAV-009 real adapter restart restores every cursor/state without save writes or effect replay
- FR-SAV-006 Mock 1.0.0 remains byte-identical until explicit replacement consent
- FR-SAV-006 malformed JSON never auto-clears
- FR-SAV-006 future format never auto-clears
- FR-SAV-006 unknown content never auto-clears
- FR-SAV-006 valid backup plus corrupt canonical can resume only in memory
- FR-SAV-006 consent receipt rejects records changed by another tab before confirmation
- FR-SAV-006 failed consent clear does not start a writable new game
- FR-SAV-007 quota failures retain play in memory through act-rest
- FR-ENG-002 stale DOM intents and simultaneous dispatch commit only once
- FR-STA-004 high-impact cancel and reading settings preserve domain facts
- FR-CNT-001 invalid content stops before any storage access and offers a Thai fatal shell
- FR-LOC-002 NFR-SE-003 content injection fails closed and renderer remains text-only
- FR-UI-001 malformed renderer outcomes fail through the localized recovery shell
- FR-SAV-006 incompatible records arriving during play are preserved before autosave
- FR-SAV-007 blocked reads allow a new in-memory session with a visible warning
- FR-SAV-006 adapter stage rechecks compatibility after application preflight
- FR-SAV-006 adapter commit rechecks compatibility after application preflight
- FR-SAV-006 conservative write guard preserves newly corrupted records
- FR-CNT-001 fetch failure renders Thai recovery before reading or writing saves
- FR-SAV-001 production default adapter resolves browser storage with the compatibility guard
- FR-UI-007 retry from a content-load fatal shell retries loading before returning to Title
- FR-SAV-006 rollback compatibility: legacy composition with retained write guard preserves 2.0.0 raw data

### `benchmark-bootstrap.test.js` (28)

- TC-S3-SAVE-001 bootstrap migration retains every cursor mother/call-family/keep-fragment
- TC-S3-SAVE-001 bootstrap migration retains every cursor mother/call-family/release-fragment
- TC-S3-SAVE-001 bootstrap migration retains every cursor mother/seek-safety/keep-fragment
- TC-S3-SAVE-001 bootstrap migration retains every cursor mother/seek-safety/release-fragment
- TC-S3-SAVE-001 bootstrap migration retains every cursor roots/call-family/keep-fragment
- TC-S3-SAVE-001 bootstrap migration retains every cursor roots/call-family/release-fragment
- TC-S3-SAVE-001 bootstrap migration retains every cursor roots/seek-safety/keep-fragment
- TC-S3-SAVE-001 bootstrap migration retains every cursor roots/seek-safety/release-fragment
- TC-S3-SAVE-001 bootstrap migration retains every cursor siblings/call-family/keep-fragment
- TC-S3-SAVE-001 bootstrap migration retains every cursor siblings/call-family/release-fragment
- TC-S3-SAVE-001 bootstrap migration retains every cursor siblings/seek-safety/keep-fragment
- TC-S3-SAVE-001 bootstrap migration retains every cursor siblings/seek-safety/release-fragment
- TC-S3-SAVE-001 migration protects incompatible canonical
- TC-S3-SAVE-001 migration protects incompatible staging
- TC-S3-SAVE-001 migration protects incompatible backup
- TC-S3-SAVE-001 failed source proof cannot authorize old saves
- TC-S3-SAVE-001 stage guards recheck late canonical raw changes
- TC-S3-SAVE-001 stage guards recheck late staging raw changes
- TC-S3-SAVE-001 stage guards recheck late backup raw changes
- TC-S3-SAVE-001 commit guards recheck late canonical raw changes
- TC-S3-SAVE-001 commit guards recheck late staging raw changes
- TC-S3-SAVE-001 commit guards recheck late backup raw changes
- TC-S3-SETTINGS-001 Title preferences persist separately and survive Resume
- TC-S3-SETTINGS-001 malformed settings are preserved and never replace save slots
- TC-S3-SETTINGS-001 malformed settings are preserved and never replace save slots
- TC-S3-SETTINGS-001 malformed settings are preserved and never replace save slots
- TC-S3-SETTINGS-001 invalid, stale and out-of-settings intents never write
- TC-S3-AUDIO-001 trusted unlock runs synchronously before asynchronous story dispatch; failure stays playable

### `narrative-bootstrap.test.js` (3)

- TC-S4-SAVE-001 candidate exact saved secret page restores without any write
- TC-S4-GRAPH-001 actual candidate confirmation cancel retains full pouch; accepted replacement saves once
- TC-S4-SAVE-001 candidate protects old content instead of guessing a cursor or writing an empty pouch

### `pouch-bootstrap.test.js` (6)

- TC-S4-STATE-001 open/inspect/close has no story/save/audio/history effects and restores opener
- TC-S4-POUCH-002 cancel retains leaf; confirmed release persists exactly once and reloads remembered
- TC-S4-POUCH-001 forged/stale/unconfirmed actions never mutate or save
- TC-S4-POUCH-001 early reading shows disabled release and Core rejects forged utility
- TC-S4-SAVE-002 quota during accepted release remains playable with visible memory-only notice
- TC-S4-CONTRACT-001 legacy leaf bridge is explicit and immutable; changed behavior has no inferred policy

### `history-bootstrap.test.js` (9)

- FR-ENG-009 TC-S4-LOG-001 Title empty, accepted New Game first passage, no render/settings duplicates
- TC-S4-LOG-001 confirmation/cancel/rejected/stale inputs absent; commit before response
- TC-S4-LOG-001 repeated nursery visits keep separate occurrences and return label
- TC-S4-LOG-002 open/close is exact snapshot/save/history/audio invariance and blocks background writes
- TC-S4-LOG-001 committed Pouch release logged once; inspection/cancel/duplicate not recorded
- TC-S4-LOG-001 same-page Title/Resume preserves log; reload starts fresh without saved transcript
- TC-S4-LOG-001 confirmed New Game clears prior choices and occurrences
- TC-S4-LOG-001 failed render cannot log unseen response; committed action retained; retry acknowledges once
- TC-S4-LOG-001 host without presentation acknowledgements never guesses displayed dialogue

### `content-presentation.test.js` (13)

- TC-S3-CONTRACT-001 runtime explicitly supports both 1.1 and 1.2 Act 1 packages
- TC-S3-ARCH-001 immutable localized projection separates media IDs from paths, settings and domain
- TC-S3-CONTRACT-001 CR-0003 D1 absent/empty channels are neutral and silent without inheritance
- TC-S3-STATE-001 D5/D8 reading, ready exploration and three authored decision actions preserve facts
- TC-S3-CONTRACT-001 overlays and reading pages retain desired loops; title is silent
- TC-S3-CONTRACT-001 D6 protagonist override, other-speaker badge and narrator semantics use roles
- TC-S3-CONTRACT-001 localization falls back to Thai and preserves validated zero settings
- TC-S3-ARCH-001 malformed composition inputs fail with a typed error
- TC-S3-CONTRACT-001 D7 locked Bond presence has no numeric payload; legacy hidden contract survives
- TC-S3-ARCH-001 RendererPort rejects numeric leaks and browser/media objects before invoking adapter
- TC-S3-ARCH-001 Core remains browser-free and production imports never reference tests
- CR-0005 PO review projects saved versus attention explicitly without changing story facts
- ADR-P0-018 D2 audio control persists for ready, blocked, muted and failed sound without changing volume

### `closeout-presentation.test.js` (25)

- TC-S4-CHOICE-001 T9 catalog covers all30 actual actions and five encountered-item references without changing eligibility
- TC-S4-CONTRACT-001 T9 rejects unknown field
- TC-S4-CONTRACT-001 T9 rejects wrong content
- TC-S4-CONTRACT-001 T9 rejects missing Thai
- TC-S4-CONTRACT-001 T9 rejects unknown locale
- TC-S4-CONTRACT-001 T9 rejects empty tag
- TC-S4-CONTRACT-001 T9 rejects unknown icon
- TC-S4-CONTRACT-001 T9 rejects unknown skin
- TC-S4-CONTRACT-001 T9 rejects duplicate action
- TC-S4-CONTRACT-001 T9 rejects duplicate item
- TC-S4-CONTRACT-001 T9 rejects duplicate crop
- TC-S4-CONTRACT-001 T9 rejects dangling action
- TC-S4-CONTRACT-001 T9 rejects unregistered item
- TC-S4-CONTRACT-001 T9 rejects audio as item image
- TC-S4-CONTRACT-001 T9 rejects missing background
- TC-S4-CONTRACT-001 T9 rejects outside crop
- TC-S4-CONTRACT-001 T9 rejects numeric spoiler
- TC-S4-CONTRACT-001 T9 rejects markup
- TC-S4-CHOICE-001 missing optional decoration retains the plain labeled choice and original guards
- TC-S4-CHOICE-001 real DOM receives motive tags and source-authored cues outside the sacred reading card
- TC-S4-ASSET-001 strict loader is bounded/same-origin and invalid decoration fails soft with intact playable story
- TC-S4-ASSET-001 five original SVGs are byte/hash/rights bound and resolve at root/subpath
- TC-S4-ASSET-001 SVG capability rejects active/external/non-geometry documents even with a matching digest
- TC-S4-POUCH-002 verified images release on redraw/close and late results cannot repaint a closed modal
- TC-S4-VIS-001 crop metadata reaches presentation as bounded coordinates without changing story facts

### `closeout-media.test.js` (3)

- TC-S4-ASSET-001 switching current/archive media retains one cache and version-specific image leases
- TC-S4-ASSET-001 late failed archived registry cannot change the ready current media session
- TC-S4-ASSET-001 a failed archived media session leaves no stale warning after successful current initialization

### `media-composition.test.js` (5)

- TC-S3-AUDIO-001 visibility suspends and forbids hidden activation/reconcile/effects; visible resumes latest desire
- TC-S3-ASSET-001 malformed registry fails silently and explicit retry fetches corrected metadata
- TC-S3-ASSET-001 oversized registry stream is cancelled before full consumption
- TC-S3-ASSET-001 wrong MIME registry is rejected without consuming its body
- TC-S3-AUDIO-001 all zero channels suppress speculative audio and user gesture does not alter desires

### `stage-view.test.js` (4)

- TC-S3-ASSET-001 stage deduplicates unchanged accepted IDs and releases images exactly once on replacement/dispose
- TC-S3-ASSET-001 late stale decoded images cannot resurrect a previous scene
- TC-S3-ASSET-001 missing/decode failure is neutral and retryable; disposal releases pending success
- CR-0003 D6 speaker portrait remains separate from the protagonist body

### `dom-renderer.test.js` (26)

- FR-UI-001 DOM renderer structurally implements RendererPort without mutating an immutable view model
- FR-UI-005 hides the Bond HUD whenever the projected view model marks it unavailable
- FR-UI-002 setBusy locks all choice actions accessibly and restores only eligible choices
- FR-UI-003 renders visible feedback and text-labelled meter changes without relying on color
- FR-ACC-002 announce updates a persistent polite live region
- FR-ACC-001 applyFocusDirective moves keyboard focus to an eligible choice or the dialogue landmark
- FR-UI-004 and FR-UI-006 expose keyboard-native cutscene and crisis recovery controls as semantic intents
- ADR-P0-019 keeps legacy first-run warnings outside the sacred paper
- FR-UI-007 showFatalShell presents a Thai recovery-safe fallback and focuses it
- NFR-SE-003 renders malicious dialogue and choice strings as text, never evaluated markup
- RendererPort operations convert invalid host or directive failures into RENDER_FAILURE results
- CR-0003 D4/D5/D7 four stage layers retain three canonical cards and numerical-free Bond locked presence
- FR-ACC-001 settings overlay keeps story inert, restores field on rerender and trigger on close
- CR-0003 D2 renderer hands trusted activation to composition before semantic story intent
- FR-ACC-002 asynchronous media refresh retains current reading/button focus without announcing again
- ADR-P0-018 D4 Title has a corner advisory control without a warning banner or gameplay meters
- TC-S4-VIS-001 Reading contains only Next in paper footer; Decision contains real choices without Next
- TC-S4-STATUS-001 status-only render retains exact story, action, focus and latest revision guard
- TC-S4-STATUS-001 media failure adds functional recovery in rail while preserving reading and Settings
- TC-S4-STATUS-001 settings status patches retain modal identity, scroll, field and busy focus
- ADR-P0-019 story patches preserve landmarks, prose and independent HUD consequences
- TC-S4-STATUS-001 duplicate operational announcements are deduped without suppressing a new beat
- CR-0005 PO review uses one header surface and merges Decision context without dropping authored text
- CR-0005 PO review success expires at1500ms without focus, DOM or media-refresh replay
- CR-0005 PO review stale success timer cannot hide failed or memory-only save detail
- CR-0005 PO review autosave is silent while feedback and recovery remain announced

### `vn-runtime-ergonomics.test.js` (8)

- ADR-P0-019 P4 rail directly toggles master, restores positive level and preserves every channel
- ADR-P0-019 P4 master mute persists across reload without changing story cursor
- ADR-P0-019 P4 stale sound and background setting writes remain rejected
- ADR-P0-019 title replacement uses one modal, inert underlay, explicit cancellation and safe focus
- ADR-P0-019 P3 storm warning is projected into advisory and never into prose
- ADR-P0-019 P2 consequence toast expires at2500ms, never replays on settings refresh or leaks Bond
- ADR-P0-019 P5 stage, Space and Enter advance only reading and honor busy/repeat/modal guards
- ADR-P0-019 P2 announces each consequence once across overlays/settings and still announces a new save failure

### `history-dialog.test.js` (7)

- TC-S4-LOG-002 empty archive uses safe localized prose and initial short heading focus
- TC-S4-LOG-002 archive preserves exact text/order/lang without interactive or live transcript lines
- TC-S4-LOG-002 heading/close Tab and Shift+Tab trap, Escape/cross view intents
- TC-S4-LOG-002 newest scroll only on open; status/busy patches preserve user position
- TC-S4-LOG-002 late font readiness preserves explicit user scroll
- TC-S4-LOG-002 renderer keeps native archive identity/scroll/focus on async patches and restores opener
- TC-S4-LOG-002 trusted History pointer/keyboard activation never unlocks audio and keeps repeat guard

### `history-projection.test.js` (11)

- TC-S4-LOG-001 empty/reload projection is warm, truthful and contains no speculative prose
- FR-LOC-001 TC-S4-LOG-001 action uses accepted Thai label and pre-transaction scene
- TC-S4-LOG-001 localized Pouch collect records committed item meaning
- TC-S4-LOG-001 localized Pouch refuse records committed item meaning
- TC-S4-LOG-001 localized Pouch release records committed item meaning
- TC-S4-LOG-001 localized Pouch use records committed item meaning
- TC-S4-LOG-001 localized Pouch replace records committed item meaning
- TC-S4-LOG-001 unknown Pouch metadata fails instead of inventing a label
- TC-S4-LOG-001 exact feedback then dialogue context, narration and approved inner voice
- TC-S4-LOG-001 merge retains accepted order, occurrence contexts and frozen exact strings
- TC-S4-LOG-001 actual Core checkpoint retry retains transcript and records returned passage as a new visit

### `keepsake-pouch-dialog.test.js` (13)

- TC-S4-POUCH-002 empty bag has exactly four tactile noninteractive slots
- TC-S4-POUCH-002 inspect is local, readable and never sends a domain intent
- TC-S4-POUCH-002 missing/failed image retains name, description and memory
- TC-S4-POUCH-002 released/refused memories have no physical slot and no actions
- TC-S4-A11Y-001 Tab trap and Escape/close send view intent with revisions
- TC-S4-POUCH-002 release requires confirmation, cancel never sends a command
- TC-S4-POUCH-002 collect intent carries approved identity and confirmation
- TC-S4-POUCH-002 refuse intent carries approved identity and confirmation
- TC-S4-POUCH-002 replace intent carries approved identity and confirmation
- TC-S4-POUCH-002 use intent carries approved identity and confirmation
- TC-S4-POUCH-002 full bag offers four replacements/refusal/cancel with no auto drop
- TC-S4-POUCH-002 localized immutable projection distinguishes held/released/refused
- TC-S4-POUCH-002 narrative strings are text and never interpreted as markup

### `settings-dialog.test.js` (4)

- FR-SET-004 settings keeps saved zero and dispatches volume values with current view revision
- FR-ACC-003 settings exposes 200% text, high contrast and reduced intensity independently
- ADR-P0-018 D2 close is outside modal scrolling, switches show state and audio never disappears
- FR-ACC-001 settings modal cycles focus, restores active field and routes Escape to close intent

### `narrative-content.test.js` (33)

- TC-S4-NARRATIVE-001 all seven scene anchors have actual fresh prose; exact 2.1 archive retained
- TC-S4-CONTRACT-001 schema2 rejects unknown item
- TC-S4-CONTRACT-001 schema2 rejects duplicate item
- TC-S4-CONTRACT-001 schema2 rejects unknown effect action
- TC-S4-CONTRACT-001 schema2 rejects unknown effect property
- TC-S4-CONTRACT-001 schema2 rejects unknown predicate state
- TC-S4-CONTRACT-001 schema2 rejects unknown predicate item
- TC-S4-CONTRACT-001 schema2 rejects null item registry
- TC-S4-CONTRACT-001 schema2 rejects missing old replacement item
- TC-S4-CONTRACT-001 schema2 rejects new item stat reward
- TC-S4-CONTRACT-001 schema2 rejects unknown completion reference
- TC-S4-CONTRACT-001 schema2 rejects secret too short
- TC-S4-CONTRACT-001 schema2 rejects secret entry reward
- TC-S4-CONTRACT-001 schema2 rejects unknown secret return
- TC-S4-CONTRACT-001 schema2 rejects secret bypasses return
- TC-S4-CONTRACT-001 schema2 rejects secret cyclic return
- TC-S4-CONTRACT-001 schema2 rejects duplicate secret node
- TC-S4-CONTRACT-001 schema2 rejects self replacement
- TC-S4-POUCH-001 nested predicates distinguish held/acquired/released/refused/unseen and reject malformed inputs
- TC-S4-GRAPH-001 fifth real offering atomically replaces item_leaf
- TC-S4-GRAPH-001 fifth real offering atomically replaces item_dew_stone
- TC-S4-GRAPH-001 fifth real offering atomically replaces item_lotus_shell
- TC-S4-GRAPH-001 fifth real offering atomically replaces item_rain_petal
- TC-S4-GRAPH-001 full offering can retain all four by refusal, and free pouch can acquire fifth
- TC-S4-STATE-001 target guards see the atomic post-pouch candidate and rejection preserves all facts
- TC-S4-CALLBACK-001 no collection and release-all routes get complete truthful comfort and same baseline metrics
- TC-S4-GRAPH-001 moment.act1.dew acknowledges completion at last beat, resumes exactly and returns
- TC-S4-GRAPH-001 moment.act1.lotus acknowledges completion at last beat, resumes exactly and returns
- TC-S4-GRAPH-001 moment.act1.rain acknowledges completion at last beat, resumes exactly and returns
- TC-S4-SAVE-001/002 every candidate cursor is valid Save2 and resumes without replay or migration
- TC-S4-RETRY-001 opening checkpoint removes optional acknowledgements and newly acquired items
- TC-S4-RETRY-001 final checkpoint retains independent full-pouch replacement and released memory
- TC-S4-GRAPH-001 new graph witnesses every authored node/edge and all 12 legacy emotional directions

### `narrative-adr-021.test.js` (14)

- ADR-P0-021 D1 reachable choices: self-reliant
- ADR-P0-021 D1 reachable choices: cautious-then-self-reliant
- ADR-P0-021 D1 reachable choices: water-then-self-reliant
- ADR-P0-021 D1 reachable choices: nearby-at-threshold
- ADR-P0-021 D1 reachable choices: cautious-voice-home
- ADR-P0-021 D1 reachable choices: accept-now-home
- ADR-P0-021 D1 reachable choices: nearby-repair-home
- ADR-P0-021 D1 reachable choices: nearby-decline
- ADR-P0-021 D1 every reachable Act4–5 design branch terminates; all three endings remain reachable without a keepsake
- ADR-P0-021 D1 original A/B effects and cautious compensation retain their approved budgets
- ADR-P0-021 D1 physical leaf, water, repeated care and trust guards are enforced by the real predicate evaluator
- ADR-P0-021 D1 repair is conditional, optional and cannot be harvested twice
- ADR-P0-021 D1 ending order handles 29/30, 59/60 and crisis before any gift gate
- ADR-P0-021 D2 authored narration and action results have zero duplicate blocks or storm system commentary

### `narrative-handoff.test.js` (19)

- TC-S4-FAIR-001 S5 design case 1: END-HOME, item-independent expected result
- TC-S4-FAIR-001 S5 design case 2: END-HOME, item-independent expected result
- TC-S4-FAIR-001 S5 design case 3: END-HOME, item-independent expected result
- TC-S4-FAIR-001 S5 design case 4: END-HOME, item-independent expected result
- TC-S4-FAIR-001 S5 design case 5: END-NEARBY, item-independent expected result
- TC-S4-FAIR-001 S5 design case 6: END-HOME, item-independent expected result
- TC-S4-FAIR-001 S5 design case 7: END-NEARBY, item-independent expected result
- TC-S4-FAIR-001 S5 design case 8: END-NEARBY, item-independent expected result
- TC-S4-FAIR-001 S5 design case 9: END-NEARBY, item-independent expected result
- TC-S4-FAIR-001 S5 design case 10: END-NEARBY, item-independent expected result
- TC-S4-FAIR-001 S5 design case 11: END-NEARBY, item-independent expected result
- TC-S4-FAIR-001 S5 design case 12: END-DAWN, item-independent expected result
- TC-S4-FAIR-001 S5 design case 13: END-DAWN, item-independent expected result
- TC-S4-FAIR-001 S5 design case 14: GameOver, item-independent expected result
- TC-S4-FAIR-001 S5 design case 15: GameOver, item-independent expected result
- TC-S4-FAIR-001 S5 design case 16: GameOver, item-independent expected result
- TC-S4-FAIR-001 cautious-wait-voice-help reaches HOME budget with voice and empty pouch
- TC-S4-FAIR-001 accept-now-voice-help reaches HOME budget with voice and empty pouch
- TC-S4-FAIR-001 cautious-nearby-repair reaches HOME budget with voice and empty pouch

### `pouch-schema.test.js` (44)

- TC-S4-CONTRACT-001 fixture empty
- TC-S4-CONTRACT-001 fixture held
- TC-S4-CONTRACT-001 fixture released
- TC-S4-CONTRACT-001 fixture refused
- TC-S4-CONTRACT-001 fixture four slots
- TC-S4-CONTRACT-001 fixture capacity 3
- TC-S4-CONTRACT-001 fixture capacity 5
- TC-S4-CONTRACT-001 fixture capacity null
- TC-S4-CONTRACT-001 fixture capacity 4
- TC-S4-CONTRACT-001 fixture unknown property
- TC-S4-CONTRACT-001 fixture missing held
- TC-S4-CONTRACT-001 fixture null held
- TC-S4-CONTRACT-001 fixture duplicate held
- TC-S4-CONTRACT-001 fixture bounded held
- TC-S4-CONTRACT-001 fixture missing acquired
- TC-S4-CONTRACT-001 fixture null acquired
- TC-S4-CONTRACT-001 fixture duplicate acquired
- TC-S4-CONTRACT-001 fixture bounded acquired
- TC-S4-CONTRACT-001 fixture missing released
- TC-S4-CONTRACT-001 fixture null released
- TC-S4-CONTRACT-001 fixture duplicate released
- TC-S4-CONTRACT-001 fixture bounded released
- TC-S4-CONTRACT-001 fixture missing remembered
- TC-S4-CONTRACT-001 fixture null remembered
- TC-S4-CONTRACT-001 fixture duplicate remembered
- TC-S4-CONTRACT-001 fixture bounded remembered
- TC-S4-CONTRACT-001 fixture missing memory
- TC-S4-CONTRACT-001 fixture null memory
- TC-S4-CONTRACT-001 fixture duplicate memory
- TC-S4-CONTRACT-001 fixture bounded memory
- TC-S4-CONTRACT-001 fixture bad item item__bad
- TC-S4-CONTRACT-001 fixture bad item Item_leaf
- TC-S4-CONTRACT-001 fixture bad item item_../leaf
- TC-S4-CONTRACT-001 fixture bad item null
- TC-S4-CONTRACT-001 fixture bad item item_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
- TC-S4-CONTRACT-001 fixture held without acquisition
- TC-S4-CONTRACT-001 fixture released and held
- TC-S4-CONTRACT-001 fixture refused and acquired
- TC-S4-CONTRACT-001 fixture unexplained remembered
- TC-S4-CONTRACT-001 published Save 1 fixture
- TC-S4-CONTRACT-001 published Save 2 fixture
- TC-S4-CONTRACT-001 published schemas stay byte-identical under additive Save 2
- TC-S4-ASSET-001 original pouch art/chrome have exact provenance and no external SVG content
- TC-S4-ARCH-001 production import graph preserves Core/Data/UI boundaries and no test dependency

### `ui-preferences.test.js` (7)

- ADR-P0-018 D4 preference round trip writes its own versioned key only
- ADR-P0-018 D4 malformed, oversized, unknown-version and invalid preference records stay byte-identical
- ADR-P0-018 D4 storage denial, silent write failure and observed cross-tab race fail safely
- ADR-P0-018 D4 advisory ack/close never starts a game; preference survives reboot and is reversible through settings
- ADR-P0-018 D4 overlay rejects background/stale intents and never changes active story/save/settings
- ADR-P0-018 D4 failed preference write stays usable, explains non-persistence and protects unknown records
- ADR-P0-018 D3 localized runtime chrome uses Thai punctuation and SVG-only decorative icons

### `asset-manifest.test.js` (4)

- TC-S3-ASSET-001: production media package validates and is purely presentation-compatible with archived 2.0.0
- TC-S3-ASSET-001: eight approved scene/handoff nodes share explicit environment; later scenes are neutral/silent
- TC-S3-ASSET-001: every shipped asset has matching reviewed registry, hash, localized metadata and safe root/subpath URL
- TC-S3-ASSET-001: real WebP RIFF dimensions/alpha, WOFF2 headers and compressed/decoded envelopes agree

### `persistence.test.js` (27)

- FR-SAV-001 LocalStorage adapter passes assertStoragePort without invoking storage
- FR-SAV-001 FR-SAV-002 FR-SAV-003 round-trips a cloned Save Envelope
- FR-SAV-003 rotates the exact prior canonical bytes to backup before promotion
- FR-SAV-004 recovers highest valid revision when canonical JSON is corrupt
- FR-SAV-004 recovers backup when canonical and staging are corrupt
- FR-SAV-004 recovery uses revision then canonical-staging-backup priority, never timestamp
- FR-SAV-003 preserves canonical and staging when backup write exceeds quota
- FR-SAV-003 and FR-SAV-009 map staging QuotaExceededError without touching canonical
- NFR-PE-005 rejects a Save Envelope above the 250 KB UTF-8 budget before writing
- FR-SAV-003 NFR-PE-005 preserve an oversized stored backup until consented clear
- FR-SAV-003 preserves recovery candidates when canonical promotion exceeds quota
- FR-SAV-003 rejects a candidate older than backup before stage or commit
- FR-SAV-003 FR-SAV-005 preserve unsupported future backup before any write
- FR-SAV-003 commit enforces an explicitly requested staged revision
- FR-SAV-003 commit rejects missing staging and invalid revision requests without mutation
- FR-SAV-003 stage and commit are idempotent for identical revision bytes
- FR-SAV-003 preserves valid candidates when staging cleanup is unavailable
- FR-SAV-003 maps a changed staging readback to STORAGE_UNAVAILABLE
- FR-SAV-003 maps a missing staging readback to STORAGE_UNAVAILABLE
- FR-SAV-009 maps disabled or denied storage to STORAGE_UNAVAILABLE without throwing
- FR-SAV-001 and FR-SAV-005 reject schema-invalid and unsupported saves without mutation
- FR-SAV-004 skips a newer invalid candidate for a lower valid backup
- FR-SAV-004 skips future format during recovery while preserving its raw bytes
- FR-SAV-001 and FR-SAV-004 return null for an empty repository and typed errors for corrupt-only data
- FR-SAV-001 enforces monotonic revisions and rejects equal-revision forks
- FR-SAV-001 strict validation rejects unknown fields and invalid date-time values
- FR-SAV-006 clearWithConsent requires literal true and preserves settings and unrelated keys

### `journey-legacy-rehearsal.test.js` (1)

- TC-S5-LEGACY-001 rollback rehearsal: the Sprint 4 app resumes its own save after a whole Journey ran on the same storage

### `asset-resolver.test.js` (46)

- TC-S3-ASSET-001: resolver binds version, identity, application root and subpath
- TC-S3-ASSET-001: reject unsafe path "../secret"
- TC-S3-ASSET-001: reject unsafe path "assets/../secret.webp"
- TC-S3-ASSET-001: reject unsafe path "/assets/image.webp"
- TC-S3-ASSET-001: reject unsafe path "https://evil.test/p.webp"
- TC-S3-ASSET-001: reject unsafe path "//evil.test/p.webp"
- TC-S3-ASSET-001: reject unsafe path "assets/%2e%2e/x.webp"
- TC-S3-ASSET-001: reject unsafe path "assets/%252e%252e/x.webp"
- TC-S3-ASSET-001: reject unsafe path "assets/x.webp?x=1"
- TC-S3-ASSET-001: reject unsafe path "assets/x.webp\#fragment"
- TC-S3-ASSET-001: reject unsafe path "assets/./x.webp"
- TC-S3-ASSET-001: reject unsafe path "assets//x.webp"
- TC-S3-ASSET-001: reject unsafe path "assets\\\\x.webp"
- TC-S3-ASSET-001: reject unsafe path "assets/x.webp\\n"
- TC-S3-ASSET-001: reject unsafe application base file:///tmp/
- TC-S3-ASSET-001: reject unsafe application base data:text/plain,assets/
- TC-S3-ASSET-001: reject unsafe application base https://user:pass@example.test/
- TC-S3-ASSET-001: reject unsafe application base https://example.test/JaoKob/index.html
- TC-S3-ASSET-001: reject unsafe application base https://example.test/?query
- TC-S3-ASSET-001: reject unsafe application base https://example.test/\#fragment
- TC-S3-ASSET-001: reject unsafe application base https://example.test/%2f/
- TC-S3-ASSET-001: reject mismatched metadata {"mimeType":"image/svg+xml"}
- TC-S3-ASSET-001: reject mismatched metadata {"mimeType":"text/html"}
- TC-S3-ASSET-001: reject mismatched metadata {"byteLength":500001}
- TC-S3-ASSET-001: reject mismatched metadata {"byteLength":0}
- TC-S3-ASSET-001: reject mismatched metadata {"sha256":"00"}
- TC-S3-ASSET-001: reject mismatched metadata {"decodedBytes":1}
- TC-S3-ASSET-001: reject mismatched metadata {"width":1601}
- TC-S3-ASSET-001: reject mismatched metadata {"height":901}
- TC-S3-ASSET-001: reject mismatched metadata {"path":"assets/other.webp"}
- TC-S3-ASSET-001: reject mismatched metadata {"type":"audio"}
- TC-S3-ASSET-001: registry version and duplicate identifiers fail closed
- TC-S3-ASSET-001: exact MIME, length, signature and SHA-256 admit media; omit credentials and reject redirects
- TC-S3-ASSET-001: HTTP compression length differs from decoded body length
- TC-S3-ASSET-001: wrong MIME fails silently
- TC-S3-ASSET-001: declared size mismatch fails silently
- TC-S3-ASSET-001: unknown length bytes too large fails silently
- TC-S3-ASSET-001: truncated response fails silently
- TC-S3-ASSET-001: external response URL fails silently
- TC-S3-ASSET-001: same-origin redirected path fails silently
- TC-S3-ASSET-001: redirect response fails silently
- TC-S3-ASSET-001: HTTP 404 fails silently
- TC-S3-ASSET-001: digest mismatch fails silently
- TC-S3-ASSET-001: wrong signature fails silently
- TC-S3-ASSET-001: timeout and caller cancellation stop fetch without retry
- TC-S3-ASSET-001: audio decoded memory metadata is bounded independently of transfer

### `asset-preloader.test.js` (6)

- TC-S3-ASSET-001: prioritize current, cap concurrency at two and deduplicate updates
- TC-S3-ASSET-001: obsolete generations abort jobs, discard queue and release late leases
- TC-S3-ASSET-001: failures do not retry automatically and explicit retry remains bounded
- TC-S3-ASSET-001: noncooperating timeout cannot exceed physical concurrency
- TC-S3-ASSET-001: data saving drops speculative requests and queue stays bounded
- TC-S3-ASSET-001: one-hop selection only uses accepted eligible actions and never traverses their targets
