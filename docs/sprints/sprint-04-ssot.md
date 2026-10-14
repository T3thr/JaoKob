# Sprint 4 SSOT Draft: Visual, Narrative & Interactive Overhaul

| Document control | Value |
|---|---|
| Sprint / document | `SPRINT-04` / `JKB-SPRINT-04-SSOT` |
| Version / date | 0.1.0 / 2026-10-14, Asia/Bangkok |
| Status | **PROPOSED — planning delivered; implementation 0/10 tasks; D1–D7 await owner decisions** |
| Authority | Current PO request: detailed proposal for approval; no production code in this round |
| Baseline | `origin/develop@4c8d600820fcedcc9c14ec4b51df685f07099c7a`; [Sprint 3 closeout](../changelog/2026-09/2026-09-08-1430-sprint-03-merge-closeout.md) |
| Documentation PR | [#12](https://github.com/T3thr/JaoKob/pull/12) → develop, OPEN draft; no implementation approval |
| Branch | `feat/sprint-04-overhaul-plan`, documentation worktree from fetched origin/develop |
| Proposal / RFC | [JKB-PROP-S4-001](../proposals/sprint-04-overhaul/01-proposal-plan.md) / [CR-0005](../rfc/CR-0005-sprint-04-overhaul.md) |
| 3D dependency | [PR #11](https://github.com/T3thr/JaoKob/pull/11), OPEN draft at `d8a569e`; technically delivered, not integrated or accepted as production runtime |
| Owners | PO; Technical Lead/Architect; UI/Data/Application maintainers; Narrative/Game Design; Art; Accessibility; Quality/DevOps |

## 1. Goal, scope and non-goals

ทำ benchmark ให้รู้สึกเป็น Interactive Light Novel ที่เกลาด้วยมือ: ฉาก/เจ้ากบสัมพันธ์กัน, บทอ่านหนึ่งแผ่น, Title/Reading/Decision แยกหน้าที่, ตัวเลือกมีเจตนาที่อ่านได้, ประวัติย้อนหลังและของสะสมเป็นพื้นที่ที่ผู้เล่นเลือกเปิดเอง. ใช้เกณฑ์ศิลป์ใน [proposal §3.2](../proposals/sprint-04-overhaul/01-proposal-plan.md#32-no-ai-slop--aaa-handcrafted-feel-acceptance-rubric) ควบคู่ domain invariants และ accessibility.

In scope proposed: Scene 1–2 + three-choice Scene 3 benchmark; renderer/styles for every Act 1 node; seven choice Intent Tags + existing outcome previews; session history ≥50 dialogues + accepted actions; opt-in two-model Keepsake Drawer; regression and actual manual review evidence. Entire Act 1 still has 7 scenes / 14 nodes / 21 edges / 12 canonical outcomes.

Non-goals: all-seven-scene media production, new mechanics/Canon/Act 2–5/ending integration, inventory economy/equipment, heart toggle/emotion variants, full typewriter/speed/skip/auto-advance delivery, voice/TTS, additional locale, Login/backend/telemetry/CDN, merge/deployment. `FR-UI-004` remains partial when only log is delivered; do not claim the complete requirement passed.

Approved Sprint 3 deviations retained: tadpole blue identity in gameplay; adult mascot only approved branding; Bond Locked Chip has no number; Scene 3 has three genuine choices. The target screenshots are composition references with device chrome, not runtime/browser evidence.

## 2. Traceability matrix

All `TC-S4-*` below are **proposed evidence IDs**, not materialized automation. No FR/GDD/NAR/NFR is newly marked Approved by this document. D1–D7 are proposed decisions under CR-0005.

| Existing requirement / proposed decision | Design / acceptance | Task / artifact | Verification and eventual PR |
|---|---|---|---|
| `FR-UI-001`, `NFR-MA-001/002`, `ADR-P0-001/004/005/012/015` | Immutable projection, UI intents, persistent regions; overlays outside domain | T0/T2/T4/T8; renderer, projector, pure session reducer, composition | `TC-S4-ARCH-001`, state equality; T0/T2/T4/T8 PRs pending |
| `GDD-UX-001/002/003`, `FR-UI-005`, `GDD-BOND-005`, CR-0003 D5–D8 | Title/Reading/Decision separation without lost notice/exploration; three choices; locked no-number Bond | T1/T2; stage/HUD/reading/decision views | `TC-S4-VIS-001`, `TC-S4-STATE-001`; T1/T2 PRs pending |
| `GDD-UX-004`, `NAR-SC-A1-003`, `NFR-US-004`, D2/D6 | Intent explains action, existing outcomePreview and impact confirmation retained; no moral reward/ending hints | T3; strict catalog, projection, localized tags/cues/icons | `TC-S4-CHOICE-001`, Narrative/Game Design review; T3 PR pending |
| `FR-UI-002/003/007`, `GDD-UX-005/007`, `FR-SAV-006/009` | Busy/rollback, feedback/deltas, visible save text/error separated; one announcement | T2/T8; rail/response/status and dispatch | `TC-S4-STATUS-001`, faults/races; T2/T8 PRs pending |
| `FR-ENG-009`, `GDD-UX-006`, log portion of `FR-UI-004`, D3 | ≥50 latest dialogues with speaker/scene/locale; chosen actions only; New Game reset; reload policy explicit | T4/T5; session reducer, history projection/modal | `TC-S4-LOG-001/002`; T4/T5 PRs pending |
| `NAR-WLD-002/004/005`, `NAR-CON-001/007/010`, `NAR-DLG-001..005`, `NAR-TONE-001`, D4/D6 | Tadpole/life-stage retained; non-diegetic toys; restrained Thai editorial; storm no blame; default variants | T0/T3/T6; copy/art brief and narrative review | `TC-S4-NARRATIVE-001`; exact content/art changes require owner decision |
| `FR-CNT-001/002/004/005/006`, `FR-LOC-001/003`, `NAR-IP-001/003/004`, D2/D5 | Catalog strict version/references/locale/hash/rights; models not cast as schema image assets | T3/T6; presentation catalog, loader/resolver, provenance | `TC-S4-CATALOG-001`, `TC-S4-ASSET-001`; new contract PRs pending |
| `FR-ACC-001..004`, `GDD-ACC-001..005/008/010`, `NFR-US-003/005/006`, `NFR-PO-004` | Keyboard/touch, focus, inert modal, zoom/reflow, Thai expansion/high contrast/reduced motion | T1/T2/T5/T7/T9; DOM/CSS/modal/3D controls | `TC-S4-A11Y-001`, manual real AT; respective PRs pending |
| `FR-SAV-001/003/004/005/006/007/009`, `ADR-P0-014`, D3 | No save field/new key; exact Resume/retry remains; optional content edits versioned separately | T4/T8/T9; regression fixtures and conditional migration | `TC-S4-SAVE-001`, old/future/corrupt/race; pending integration PR |
| `NFR-PE-001..005`, `NFR-PO-002`, D5/D7 | No 3D network before activation; one viewer; bounded cache/log; root/subpath and failure poster | T6/T7/T8/T9; asset/vendor/lifecycle/network evidence | `TC-S4-3D-001/002`, `TC-S4-PERF-001`; production dependency exception pending |
| `FR-ENG-001/002/003/008`, `GDD-MEC-001..006`, `GDD-HP-*`, `GDD-SAN-*`, `GDD-BOND-*` | Domain results identical under UI/Log/3D/media permutations | Every task; protected baseline 691 tests and 12 routes | `TC-S4-STATE-001`, `TC-S4-E2E-001`; no baseline weakening |

## 3. Architecture and contract freeze

Use proposal §§4–7 for full feature behavior and CR-0005 for alternatives/approval. Only bootstrap imports concrete Data/UI implementations. Core stays browser-free; session history is a pure application reducer, not new mutable domain state. UI renders immutable resolved VM and sends semantic intents. No UI parsing of content/storage or inference of choices from metric deltas.

Recommended new catalog names/paths are **proposals**, to freeze at T0: `specs/schemas/presentation-catalog/v1.0.0.schema.json`, `src/data/presentation/act-01-presentation.json`, `keepsakes.json`, loader/projector modules. Separate catalog can reference content 2.1.0 and installed original IDs without changing published schema 1.2.0. It must have its own strict schema/version/reference tests; an unvalidated manifest is not an alternative.

No saved transcript, selected doll, camera orbit, modal, loading status or 3D cache. New Game clears session log only when accepted. Reload begins transcript at current readable page and discloses the limitation. If D3 instead requires transcript persistence, stop T4 and obtain new save contract/migration/recovery design before implementation.

Recommended `model-viewer` exception is limited to opt-in collection UI and same-origin vendored resources. Current ADR-P0-016/017 remain spike-scoped. After D5 approval, create a new accepted production ADR; do not rewrite their historical rationale.

## 4. Execution WBS

Priority: **styles → DOM renderer → log modal → 3D integration**, with approved contracts/art/editorial review first. T3 supplies choice projection for the renderer; T4 separates history data from modal T5; T6 prepares model descriptors before T7. These are scoped PRs; split any task that exceeds one coherent review. No agent delegation is authorized by this planning draft; owners are responsibility assignments for future execution.

- [ ] **T0 — Approvals, evidence baseline and contract freeze** (P0; 1–2 engineering days)

  Owner Technical Lead/Architect; reviewers PO, Narrative/Game Design, Art, Accessibility, QA. Files: this SSOT, CR-0005, approved new ADR, trace records, test plan. Dependency: D1–D7 decisions and retained artifact review.

  AC: owner decisions recorded without self-approval; final scope and device/profile agreed; original 691 cases inventoried, 12 route witnesses/hash/save fixtures retained; catalogs/VM/overlay intents/ownership frozen; approved art/copy briefs; PR #11 dependency disposition recorded. No source before relevant DoR. Evidence `TC-S4-ARCH-001` planning contract review. Exit: authorization record and task-ready checklist.

- [ ] **T1 — Visual language, art placement and UI styles** (P0; 2–3 days; approved art work additional)

  Owner UI/Art; review PO + Accessibility + Narrative. Existing files: `src/ui/styles/{tokens,base,layout,components,motion,index}.css`; art/provenance under existing `assets/` paths only if approved. Proposed original icon/texture resources: `assets/images/ui/`. No bootstrap/domain changes.

  AC: material/type/spacing/icon roles unified, duplicate CSS overrides consolidated; 18–20px initial prose target/Thai line metrics verified; mobile/desktop stage crop and subject zone authored; high contrast/reduced motion/forced colors work; focus kept visible. Interim legacy DOM can remain until T2, but T1 is not accepted as full target composition. If focal layout metadata is needed, coordinate T3 catalog; no ID-specific style hacks. Evidence proposed `TC-S4-VIS-001`, `TC-S4-A11Y-001`. Rollback styles/art only.

- [ ] **T2 — DOM renderer decomposition and notice separation** (P0; 3–4 days)

  Owner UI; review Application/Data + Accessibility + PO. Files: `src/ui/renderers/dom/dom-renderer.js`, existing `stage-view.js`/`settings-dialog.js`; proposed `title-view.js`, `reading-view.js`, `decision-view.js`, `utility-rail.js`, `response-strip.js`, shared overlay focus helper; `src/data/content/content-view-model.js` for agreed VM additions; UI/localization resources; existing renderer/stage/settings tests. Bootstrap focus/announcement wiring belongs to T8 unless a minimal jointly reviewed T2 integration patch is necessary.

  AC: Title has no gameplay meters; Reading has one prose card/functional advance; Decision only when facts ready has three true choices/no Next; Exploration/cutscene/completion/confirmation/error retained; persistent scaffold/patches keep scene and focus stable; save success/failure visible in rail and feedback/deltas preserved; no full-stage rebuild for media/save status; safe DOM/localized names/revision/busy guards intact. Evidence `TC-S4-STATUS-001`, `TC-S4-STATE-001`, visual comparison. Do not expose inert history/collection controls before T5/T7.

- [ ] **T3 — Intent Tags, contextual cues and narrative presentation review** (P0; 2–3 days)

  Owner Data/UI; Narrative owns text; review Game Design/PO/Architect. Files: proposed presentation catalog schema/fixtures and `src/data/presentation/` catalog/loader; `content-view-model.js`/`content-presentation.js`; resources; approved choice icon assets. `src/data/content/packages/act-01.json` changes only if exact narrative/media diff is separately approved/versioned.

  AC: all seven existing choices have owner-reviewed tags; current `outcomePreview` appears for high-impact choices; no effects/conditions/order/targets/impact/IDs change; missing/invalid/unknown mapping safe; stress locale fits; parent prompt not concatenated ambiguously into prose. Editorial inventory covers all seven scenes; benchmark duplicates shortened only on approved content diff. If no text edit is approved, ship UI tags/cues without changing 2.1.0. Evidence `TC-S4-CHOICE-001`, `TC-S4-CATALOG-001`, Narrative review. Content change requires mapping/rollback tests before accepting T3.

- [ ] **T4 — Session history reducer and resolved projection** (P0; 2–3 days)

  Owner Application/Data; review Architect + Narrative + UI. Proposed files: `src/core/use-cases/session-history.js`, `src/data/presentation/history-view-model.js`; corresponding unit tests. Composition edits coordinated with T8 owner; Core orchestrator/choice-transaction/progress/history/save schema remain unchanged.

  AC: explicit accepted-display/action events; ≥50 dialogue entries retained regardless of action entries; repeated visits retained; choice before response; no render/settings/save/media/rejected/stale/confirmation append; no unseen variants; New Game/Title/Resume/retry/reload policy in proposal §5; immutable bounded state and all bytes counted. Evidence `TC-S4-LOG-001` includes 60→50 exact ordering, mixed/repeated entries, session resets and caps. Rollback reducer/projection only; no save writes.

- [ ] **T5 — Dialogue History modal and overlay behavior** (P0; 1–2 days)

  Owner UI; review Accessibility + Narrative + PO. Proposed files: `src/ui/components/history-dialog.js`, shared overlay focus helper, history styles/localization, focused DOM tests. `content-view-model.js` projection fields coordinated with T4 owner.

  AC: actual utility action opens meaningful modal, newest opening/chronological log/scene+speaker+voice+choice presentation; one modal/inert background/Tab/Escape/close/restoration; save/media callbacks preserve scroll/focus; no domain command from log; empty/fresh-reload states clear; 320/200% text/400% zoom/manual screen reader reviewed. Evidence `TC-S4-LOG-002`, `TC-S4-A11Y-001`. No search/replay/unimplemented speed/typewriter controls.

- [ ] **T6 — Keepsake catalog, approved asset promotion and vendor boundary** (P1; 1–2 days)

  Owner Data/Art + Quality; review Architect/Narrative/PO. Dependencies D2/D4/D5, exact PR #11 artifacts and art/rights disposition. Proposed files: `src/data/presentation/keepsakes.json`, strict schema/fixtures and data loader/resolver; promoted GLBs/posters/provenance under `assets/models/keepsakes/`, `assets/images/keepsakes/`, `assets/provenance/`; reviewed pinned JS/license under `assets/vendor/model-viewer/`.

  AC: only runtime outputs copied, hashes/bytes/nodes/rights/Thai alt verified; original spike unchanged; library/dependent resources recorded with licenses; no CDN/decoder/external textures; root and `/JaoKob/` resolution; models/catalog failure isolated from story; no labeling GLB as image; poster budget/design approved. Evidence `TC-S4-ASSET-001`, `TC-S4-CATALOG-001`. Do not ship `.blend`, photos, generators or node_modules; no production import from docs/tests.

- [ ] **T7 — Keepsake Drawer and lazy 3D adapter** (P1; 3–4 days)

  Owner UI/Graphics; review PO/Art/Accessibility/Architect. Proposed files: `src/ui/components/keepsake-drawer.js`, `src/ui/keepsakes/model-viewer-adapter.js`, optional pure viewer port, collection styles/resources/tests. Data descriptor/loader injected at composition; no concrete Data import in UI.

  AC: non-diegetic framing/default childhood/approved adult visibility; poster first, 3D action loads selected model only; full orbit/zoom/reset keyboard controls and text equivalent; one active viewer, no auto-rotate/AR; close/selection/visibility/context-loss/stale import/load/error/retry safe; heart unchanged; no story save/reward/flag/history effect. Evidence `TC-S4-3D-001`; actual device `TC-S4-3D-002` and memory budget remain exit requirements. Rollback to poster drawer if dependency/lifecycle gate fails, with PO scope decision recorded rather than claiming 3D complete.

- [ ] **T8 — Bootstrap composition, application guards and invariance integration** (P0; 2–3 days)

  Owner Application; review UI/Data/Architect + QA. Files: `src/bootstrap/index.js`, proposed pure overlay policy and composition helpers, relevant bootstrap/presentation/media tests. Persistence/migration files touched only for approved content compatibility delta.

  AC: distinct overlay intents excluded from SELECT_CHOICE transaction; while modal/busy all gameplay advance/choice inputs guarded including keyboard; serialize accepted events; focus after busy unlock honors active modal; opening Log/Drawer does not restart audio; trusted gesture sound activation preserved; renderer status callbacks do not append transcript; story doesn't await 3D. Identical domain/save/route results with log closed/open, ready/loading/error/poster 3D. Evidence `TC-S4-ARCH-001`, `TC-S4-STATE-001`, `TC-S4-SAVE-001`.

- [ ] **T9 — Regression, visual/manual acceptance and delivery evidence** (P0; 2–3 days)

  Owner Quality/DevOps; review PO, Art, Narrative, Game Design, Accessibility, Architect. Files: existing E2E runners adapted with equivalent assertions, new proposed S4 runner/evidence index under `tests/e2e/`, `docs/traceability/sprint-04-presentation-matrix.md`, SSOT/change records/root changelog. Do not overwrite Sprint 3 evidence; record S4 output separately.

  AC: 691 existing cases retained/equivalent + meaningful additions pass with zero fail/cancel/skip/todo; 12 routes and 14/21 graph witnesses preserved; save/migration/media/3D fault/root/subpath/race tests; comparison screenshots with exact node/page/settings/candidate hashes; actual PO/art/narrative/AT/device reviews close changed journeys. All not-run gates explicit. Final scope/remaining partial FR-UI-004 acknowledged; no deploy/merge implied.

Estimated engineering effort **19–29 person-days**, plus approved art refinement **3–5 Art days** and human review/device scheduling. This is a planning range, not a committed sprint duration; one developer working serially likely needs roughly 4–6 weeks before review waiting. PO should size/split milestones if Sprint 4 is time-boxed shorter. Gate A after T2/T3 validates reading/decision look before Log/3D effort; Gate B after T5 accepts backlog; Gate C after T7/T8 accepts keepsake lifecycle; Gate D T9 accepts whole candidate. No parallel agent execution is implied.

Shared-file owner rule: T2 owns renderer/components; T3 owns catalog and choice VM; T4 history reducer/projection; T6 model descriptors; T7 browser viewer; T8 bootstrap/overlay policy; T9 consolidated docs/evidence. Shared `content-view-model.js`/localization/styles edits must be sequenced and handed off explicitly, not concurrent overwrites.

## 5. DoR and DoD

### 5.1 Planning delivered

- [x] Read repository skill/full engineering guide/current SSOT/proposal and controlling clauses.
- [x] Inspect targets, actual retained screenshots, renderer/styles/projection/history/save contracts and spike evidence.
- [x] Verify Git identity; fetch develop; preserve original dirty workspace in separate managed documentation worktree.
- [x] Re-run existing unit suite: 691/691; zero fail/cancel/skip/todo; runtime equals develop.
- [x] Draft gaps/rubric, three feature specifications, alternatives, WBS/owners/verification/compatibility/rollback.
- [x] Publish reviewable proposal/RFC/SSOT and audit links as proposed documents only.

### 5.2 Implementation DoR — open

- [ ] PO D1–D7 disposition and actual authorized scope recorded.
- [ ] Narrative/Game Design approve tags, toy framing/adult visibility and exact editorial scope.
- [ ] Architect approves catalog/VM/history/overlay contracts and new production dependency ADR.
- [ ] Art/rights approve promoted assets/icons/texture/posters; PR #11 dependency resolved.
- [ ] QA/Accessibility agree reference devices/browsers/AT/performance method and reviewer time.
- [ ] Task contract/AC/failure cases/fixtures/exclusive file owner/one coherent PR agreed.
- [ ] Any content version change has approved compatibility/migration/backup/rollback before implementation.

### 5.3 Implementation DoD — 0/10 complete

- [ ] All T0–T9 AC/evidence and owner review completed; no inactive UI controls.
- [ ] Original invariants/691 equivalent cases/12 routes retained; no testing weakened.
- [ ] PO visual rubric all dimensions accepted; Thai narrative/choices/life stage accepted.
- [ ] Log data and modal behavior pass all lifecycle cases; collection works safely or scope amended explicitly.
- [ ] Device/browser/AT/reflow/contrast/reduced-motion/manual gates pass for changed flows.
- [ ] Budgets/network/static artifact/provenance/security and 3D cleanup evidence pass.
- [ ] Exact Resume/retry/save protection/conditional migration/rollback verified.
- [ ] Trace→design→artifact→evidence→PR, audit record and unrun/deferred requirements accurate.

## 6. Verification plan and evidence status

### 6.1 Commands that exist

```sh
node --test tests/unit/*.test.js
JKB_PLAYWRIGHT_PATH=/absolute/path/to/playwright/index.mjs node tests/e2e/act1-playthrough.mjs
JKB_PLAYWRIGHT_PATH=/absolute/path/to/playwright/index.mjs node tests/e2e/visual-novel-benchmark.mjs
```

The Playwright path is a resolved environment parameter, not an installed-path assertion. Both browser runners exist; not rerun in this planning task. Existing baseline tests may be rerun per PR; full suite is mandatory before delivery. S4 browser runner/new tests/catalog validators/performance hooks below are **not yet materialized**; do not invent an npm script (root has no package.json).

### 6.2 Proposed test/evidence matrix

| ID / gate | Observable checks | Method / limitation |
|---|---|---|
| `TC-S4-ARCH-001` | Core no DOM/browser/UI/Data; UI no storage/content parsing; only bootstrap concrete composition; optional VM defaults | Existing port/contract tests + static inspection; add targeted boundary test if needed |
| `TC-S4-VIS-001` | Title/reading/decision/exploration/feedback/confirm/log/drawer/failed-media at 320×568, 390×844, 768×1024, 1440×900, 2560×1440, 844×390 | Screenshots bound to exact node/page/locale/settings/hash; compare game viewport not device frame; PO rubric |
| `TC-S4-STATUS-001` | saved/saving/failure/memory-only visible in rail; delta/feedback retained; one live event; no focus loss under status rerender | DOM + accepted-event browser faults; not a pixel assertion |
| `TC-S4-CHOICE-001` | 7 exact IDs/tags in order; high/irreversible confirmations; previews; long Thai; disabled reason; no moral/number leakage | Catalog/projection unit + DOM/browser + Narrative/Game Design review |
| `TC-S4-CATALOG-001` | Version/unknown fields/ID uniqueness/exact content join/locale/icon enum/relative path/hash/size/rights; invalid feature safe | New schema/semantic fixtures and independent metaschema validation; implementation absent now |
| `TC-S4-LOG-001` | 60 dialogues→50 latest; mixed actions do not reduce 50; repeated visits; accepted choice before response; no unseen/rejected/preload append; reset/reload/caps | Pure reducer/projection tests with controlled events; need first-display renderer acknowledgement contract |
| `TC-S4-LOG-002` | Empty/long log, one modal, inert gameplay, Tab/Escape/restored focus/scroll, asynchronous save/media patch | Real DOM browser + manual keyboard/screen reader; fake DOM cannot establish native dialog behavior |
| `TC-S4-3D-001` | No vendor/GLB until activation, selected-model-only, rapid switches, close during import/load, stale success/error, failure retry/poster, reset orbit+FOV | Instrumented isolated contexts/network/adapter tests; model bytes alone exclude library/cache/GPU |
| `TC-S4-3D-002` | Actual iOS/Safari + Android/Chrome gestures/scroll/keyboard-equivalent controls/context loss/hidden tab; 20 cycles stable resources | Real devices; record OS/browser/model/library/hardware and measurement method, no emulation substitute |
| `TC-S4-STATE-001` | Same metrics/flags/revision/checkpoint/cursor/RNG/events under unchanged UI vs all overlay/media states; duplicate/stale actions unchanged | Golden accepted snapshots + existing state/orchestration suites; include confirmation settings |
| `TC-S4-SAVE-001` | Format1/2.1 unchanged; no overlay writes/new keys; quota/unavailable/protected/corrupt/future/candidate races; exact Resume/retry | Existing persistence/migration fixtures + isolated browser; content edits require additional approved version chain |
| `TC-S4-A11Y-001` | visible focus/not obscured; native semantic controls; target 44×44; text contrast ≥4.5:1, large text ≥3:1, UI boundaries ≥3:1; 200% Thai/text fixture + native 400% zoom/reflow; high/forced contrast/reduced motion; one announcements | Automated smoke + manual VoiceOver/Safari and NVDA/Firefox; no conformance claim based on scan |
| `TC-S4-ASSET-001` | Hash/provenance/licenses/no external URI/unsupported decoder; allowed vendor/model/poster; root/subpath/no docs/photos/blend/node_modules | Inventory/negative/network/distributable allowlist checks; production build command not invented |
| `TC-S4-PERF-001` | NFR load/feedback/general interaction/initial budgets/save/log/cache/3D caps; viewer activation cost separately | 20 cold + 20 warm loads, ≥100 accepted interactions over ≥5 runs, three 30s frame captures + 20 viewer cycles; actual recorded device/profile; rAF not painted frame |
| `TC-S4-E2E-001` | 12 routes/14 nodes/21 edges; Title→reading→exploration→3-choice/reflection→storm→rest; log/drawer/reload faults; no console errors | Existing runner retained; new S4 journey runner proposed, no production test/debug globals |
| `TC-S4-NARRATIVE-001` | Blue tadpole, no premature doll transformation/ending promise; choice intent neutrality, sensory voice, safe storm/decompression/default variants | Actual anonymous PO/Narrative playthrough notes; proposed ≥5 tutorial participants / ≥4 unaided successes for NFR-US-002, descriptive not statistical proof |

Performance baseline retains NFR-PE-001..005 and Sprint 3 32MiB image/16MiB audio design caps. Proposed separate 3D target ≤32MiB and one viewer/model must be tested with D7 method. Initial game shell cannot preload 3D. Record compressed vendor transitives/posters/GLB, actual paint/layout shift and reference hardware. Failures require fixing/reducing effect or amended scope, not lowering NFRs.

### 6.3 Planning verification disposition

| Gate | This planning delivery |
|---|---|
| Existing regression | Passed 691/691, zero fail/cancel/skip/todo; no source change |
| Visual gap audit | Inspected retained target/evidence files and source; no new rendered candidate |
| Documentation links/trace/whitespace/scope | Checked locally; owner review remains pending |
| Browser/E2E/new features/catalog/schema implementation | Not run/not materialized in this round |
| Real device/AT/listening/PO artistic acceptance | Not performed; carried Sprint 3 gaps plus S4 gates remain open |
| Release/build/deployment/merge | Not performed; outside planning scope |

## 7. Audit trail, risk and approval register

| Record | Milestone / status |
|---|---|
| `CR-20261014-1841` | [Planning delivery](../changelog/2026-10/2026-10-14-1841-sprint-04-overhaul-plan.md): documentation prepared for PO; runtime WBS 0/10 |
| `CR-20260908-1430` | [Sprint 3 integration](../changelog/2026-09/2026-09-08-1430-sprint-03-merge-closeout.md): history unchanged; manual acceptance open |
| `CR-0004` Milestone 1/1B | [Spike authority/evidence at pinned source](https://github.com/T3thr/JaoKob/blob/d8a569e2472079789a02b9c363ae4378dc9d66ac/docs/rfc/CR-0004-adult-plush-model-spike.md); not authorization for game integration |

| Risk / decision | Owner / required response |
|---|---|
| D1: expected AAA quality vs benchmark/time-box | PO fixes scope/rubric/milestone sizing before promise of delivery date |
| D2: catalog joins/version/asset types | Architect approves independent catalog or broader v1.3 alternative before validators/source |
| D3: reload history expectation | PO approves session-only limitation or separate persistence design; never fabricate exact transcript from unique IDs |
| D4: toys in Act 1/spoiler | Narrative/PO decide non-diegetic wording and early adult availability |
| D5: runtime baseline exception/3D memory | Architect/PO approve new ADR; QA measures library transitives/cache/resource limits |
| D6: art/copy/rights | Narrative/Game Design/Art approve exact tags/editorial/asset output; spike base mesh is not final production likeness approval |
| D7: manual/device gates | QA/Accessibility arrange profile/reviewers; block artistic/device completion if unavailable |
| Dependency: PR #11 draft | Resolve artifact integration independently; no merge inferred from planning request |
| Existing dirty GDD/reference work | Preserved in original checkout and excluded from this documentation branch |

Planning rollback: revert this documentation PR only; production code/save/assets unchanged. Runtime rollback after implementation follows proposal §7 and accepted RFC/ADR. No migration runs now. Owner review and D1–D7 are pending; marking the planning checklist complete does not authorize or mark any runtime task done.
