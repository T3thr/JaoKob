# Sprint 4 SSOT Draft: Visual, Narrative & Adventure Keepsake Overhaul

| Document control | Value |
|---|---|
| Sprint / document | `SPRINT-04` / `JKB-SPRINT-04-SSOT` |
| Version / date | **0.2.0** / 2026-10-14, Asia/Bangkok — PO Directive revision |
| Status | **REVISED PROPOSAL — PO strategy adopted; implementation 0/12; detailed DoR open** |
| Authority | Current PO Directive authorizes these documents/commit and assigns AI narrative refinement; source code awaits reviewed plan |
| Integrated baseline | `develop@e9803397587bb3ec8f2a61a87966d382277a96fc`; current branch includes develop via `9a08d0b` |
| Review branch / PR | `feat/sprint-04-overhaul-plan` / [Draft PR #12](https://github.com/T3thr/JaoKob/pull/12) → develop |
| Proposal / RFC | [JKB-PROP-S4-001 v0.2.0](../proposals/sprint-04-overhaul/01-proposal-plan.md) / [CR-0005 v0.2.0](../rfc/CR-0005-sprint-04-overhaul.md) |
| Models | [PR #11](https://github.com/T3thr/JaoKob/pull/11) MERGED at `e980339`; future **S5 END-HOME Grand Keepsake**, not S4 Pouch dependency |
| Owners | PO, Technical Lead/Architect, Core/Application/Data/UI, Narrative/Game Design, Art, Accessibility, QA/DevOps |

## 1. Goal and phased scope

ยกระดับ JaoKob เป็นเรื่องเล่าที่อ่านสบายและอ่อนโยน ผ่าน visual craft, choices ที่เข้าใจง่าย และ **Adventure Keepsake Pouch** ที่ทำให้สิ่งเล็ก ๆ ระหว่างทางมีความทรงจำ. Pouch เป็นของในโลกของเรื่องและมี persistent domain state; ไม่ใช่ collection viewer ของตุ๊กตานอกเรื่อง.

| Milestone | Scope / exit artifact |
|---|---|
| **Sprint 4** | Paper card/frosted HUD/Intent Tags; Dialogue History; **Pouch UI/Core State/save/checkpoint**, 3–4 slots (proposed default 3); AI-authored **Act 1 all seven scenes** with keepsake choices/2–3 proposed Secret Moments; **Act 2–5 branching map draft** |
| **Sprint 5** | Production Act 2–5 story/media/runtime capabilities from accepted map; held/remembered callbacks and three existing endings; **Grand Keepsake childhood/adult models after END-HOME** |

Visual review starts Scene 1–3 then applies style across Act 1; writing/Pouch scope is not limited to that benchmark. Original14 nodes/21 edges/12 outcomes are **legacy content 2.1 witnesses**; new graph counts come from reviewed T7. Three original mother/roots/siblings directions retain their emotional identity; new Pouch choices supplement them.

No combat/XP/level/equipment/rarity/crafting/currency/weight optimization or complex new stat system. HP/พลังใจ/Bond remain three readable narrative signals and existing resolver inputs unless separately redesigned; no item stat bonuses. Retain late Bond/girl reveal, non-blaming storm, player agency, three END-HOME/NEARBY/DAWN categories and transformation only after HOME consent gate. Nuances are not new endings or mandatory collection objectives.

S4 non-goals: production Act 2–5/ending code, 3D renderer/library/model/vendor promotion, fourth ending, full-seven-scene new media production, persistent exact transcript, animated typewriter/auto-advance/voice/TTS, new locales, Login/backend/telemetry/CDN/deploy. Models/spike source remain untouched.

### 1.1 Revision authority

v0.2.0 replaces v0.1.0 Act 1 non-diegetic doll viewer, presentation-only save assumptions and limited/optional editorial scope. PO direction and AI writing assignment are explicit; no repeat approval of that direction is requested. Exact capacity, item/vignette registry, guards/contract/version/migration and final prose/assets still require task-level sign-off. Source work remains unstarted.

## 2. Traceability matrix

`TC-S4-*` and draft item/vignette IDs are proposed evidence/design identifiers, not installed tests or newly Approved requirements. Existing requirements do not fully govern new inventory mechanics; **CR-0005 D1/D4/D5** is the change path to amend GDD/SRS/Narrative/schema at T0/T3 before implementation.

| Requirement / PO decision | Observable design outcome | Owner artifact / task | Proposed evidence |
|---|---|---|---|
| `FR-UI-001`, `NFR-MA-001/002`, `ADR-P0-001/004/005/012/014/015` | Pure Core; immutable localized VM; overlay vs domain command separated | T2/T4/T6/T10, renderer/session reducers/composition | `TC-S4-ARCH-001`, `TC-S4-STATE-001` |
| `GDD-UX-001..005/007`, `FR-UI-002/003/005/007`, `GDD-BOND-005` | Title/Reading/Decision, frosted HUD/paper card, visible save/error/feedback, three home choices, locked no-number Bond | T1/T2/T9/T10 | `TC-S4-VIS-001`, `TC-S4-STATUS-001`, `TC-S4-CHOICE-001` |
| `FR-ENG-009`, `GDD-UX-006`, log part of `FR-UI-004`, D3 | ≥50 dialogue+50 committed actions; session-only reload notice, read-only modal | T6 history reducer/projector/dialog | `TC-S4-LOG-001/002` |
| **CR-0005 D1/D4**, `GDD-PROG-001/002`, `GDD-CHO-002/003` | 3–4 slots; held/acquired/released distinction; full/refuse/cancel/atomic replace; no item score/combat/collection gate | T0/T3/T4/T5; proposed new item registry/core/UI | `TC-S4-POUCH-001/002` |
| **CR-0005 D2/D4**, `GDD-CONT-001..004`, `NAR-DLG-001..005`, `NAR-TONE-001`, `NAR-CON-001/002/003/004/005/006/007/010` | AI assignment for tender Act 1; simple optional branches; held props vs memory/default continuity; scope-safe Act 2–5 map | T7/T8 Narrative/Map | `TC-S4-NARRATIVE-001`, `TC-S4-GRAPH-001`, `TC-S4-MAP-001` |
| `GDD-DEC-A1-002-A/B`, `GDD-DEC-A5-001-B`, `NAR-MTX-END-001`, **D4/D5** | Preserve legacy flag meaning; explicit held guard for physical leaf/share; released/default alternatives | T0/T3/T7 callback amendments | `TC-S4-CALLBACK-001`, leaf migration/empty-Pouch routes |
| `GDD-END-004/005/006`, `NAR-CON-007/009`, **D6** | Same3 ending categories/resolver/repair; future Grand Keepsake only END-HOME | T8 S5 map/ending nuance brief | `TC-S4-MAP-001`; no S4 production ending pass claimed |
| `FR-CNT-001/002/004/005/006`, `FR-LOC-001/003`, **D5** | Versioned strict item/condition/effect/cursor content and visual catalog, locale/refs/rights | T3/T7/T9 validators/fixtures/provenance | `TC-S4-CONTRACT-001`, `TC-S4-ASSET-001` |
| `FR-SAV-001/003/004/005/006/007/009`, `GDD-PROG-003`, **D5** | Inventory/memory/secret completion in save+checkpoint; pure exact migration, retry and backup/write guards | T3/T4/T10 persistence/migration | `TC-S4-SAVE-001/002`, `TC-S4-RETRY-001` |
| `FR-ACC-001..004`, `GDD-ACC-001..005/008/010`, `NFR-US-003/004/005/006`, `NFR-PO-002/004` | Keyboard/touch, focus/inert modal, Thai zoom/reflow, high contrast/reduced motion/root+subpath | T1/T2/T5/T6/T9/T11 | `TC-S4-A11Y-001`, manual device/AT |
| `NFR-PE-001..005`, `NAR-IP-003/004` | Bounded item/log/asset/save data,2D-only S4 network, licensed original art | T3/T9/T11 | `TC-S4-PERF-001`, `TC-S4-ASSET-001` |
| `FR-ENG-001/002/003/008`, meter/flag/checkpoint invariants | Legacy691 cases equivalent; new actions correctly mutate only approved domain fields; overlay-only intent preserves state | T4/T10/T11 | Legacy suite + `TC-S4-STATE-001`, `TC-S4-E2E-001` |

Actual implementation PR links are added per task after delivery; no new FR/ADR/Canon is self-approved. Exact baseline amendments for inventory/memory/cursor and GDD progression teaching are T0 design artifacts, not unstated exceptions.

## 3. Architecture and contract baseline

Full feature contract: [proposal §§5–9](../proposals/sprint-04-overhaul/01-proposal-plan.md#6-adventure-keepsake-pouch-ui-state-and-emotional-choices). Pouch lists/state are pure Core domain facts; `session-history.js` is an ephemeral pure application reducer. UI can hold selection/modal scroll only and sends intents; Data handles strict parse/validation/localization; only bootstrap imports concrete adapters. Six domain states remain; Pouch modal is not a seventh state.

Proposed versions: gameplay package/affected shared/tree **schema 2.0.0**, Act 1 content **3.0.0**, **saveFormatVersion 2**. New inventory/memory/vignette completion/checkpoint and deterministic cursor/variant contracts reviewed at T0/T3. Keep all published old schemas frozen; add versioned replacements and runtime reference/capability fixtures. Separate visual tag/icon/skin/crop catalog remains presentation-only; gameplay predicates/effects cannot be hidden inside it.

Migration is a new semantic map after existing 2.0→2.1 step. Legacy true leaf flag→held/acquired leaf based on old no-discard semantics, separately for payload and checkpoint; no new items/secret scenes awarded; explicit semantic page mapping/recovery where rewrite cannot map. Current presentation-only migrator cannot admit rewritten text/branches. Retry restores all Pouch story facts with checkpoint, preserving latest settings. Session log stays ephemeral; durable bag is not recreated from transcript.

No model-viewer port/vendor/GLB runtime in S4; ADR-P0-016/017 remain spike history. S5 separately approves production Grand Keepsake presentation/dependency/device/rights. Merged PR #11 is no longer a blocking asset integration dependency for S4.

## 4. Execution WBS

Priority: **approved contracts/legacy proof → UI Styles → DOM Renderer → Pouch Core/save/UI → Dialogue Log → Act 1 Narrative + Act 2–5 Map → Intent/media projection → integration/QA**. AI can draft prose/maps as planning/content-design work; production integrations obey per-task DoR. Below are responsibility assignments, not permission to spawn agents. Every implementation PR remains scoped/testable; split oversized tasks into sub-PRs with the same acceptance contract.

- [ ] **T0 — PO pivot, baseline amendments and per-task DoR** (P0; 1–2 person-days)

  Owner Technical Lead/Architect; PO/Narrative/Game Design/QA/Accessibility review. Files: this SSOT, CR-0005, GDD/SRS/Narrative amendment drafts, new prospective ADR, trace/fixture plan. AC: record direction already given; ratify exact 3-or4, item/memory/default/secret/non-stat rules, callback/progression/cursor/save design; devices/reviewers/owners agreed; freeze source baseline/legacy 691/14–21–12 witnesses. Evidence `TC-S4-ARCH-001` design review. No source change until relevant readiness; no per-line permission request for AI drafting.

- [ ] **T1 — Handcrafted styles, frosted HUD and paper card** (P0; 2–3 days)

  Owner UI/Art; PO/Narrative/Accessibility review. Files: existing `src/ui/styles/{tokens,base,layout,components,motion,index}.css`; original 2D icon/texture/provenance as approved. AC: unified low-specificity tokens/materials; bounded frosted backdrop with contrast/unsupported fallback; paper grain away from text; correct tadpole crop/light/scale; Thai typography/320–2560/reduced motion/forced colors; no generic nested slabs or erased focus. Interim old DOM is not full visual acceptance. `TC-S4-VIS-001`, `TC-S4-A11Y-001`; rollback styles/art only.

- [ ] **T2 — Persistent DOM regions and three-screen separation** (P0; 3–4 days)

  Owner UI; Application/Data/Accessibility/PO review. Files: `dom-renderer.js`, `stage-view.js`, `settings-dialog.js`, proposed Title/Reading/Decision/utility/response/overlay components; agreed VM/localization and focused renderer tests. AC: Title no gameplay HUD; Reading one prose card/functional Next; Decision when ready has true authored choices/no Next; Exploration/notices/confirmation/completion/failure preserved. Save/status patches retain focus/scene/modal; safe DOM/textual save/feedback/deltas/revision+busy guards. Pouch/Log controls exposed only when functional. Evidence `TC-S4-STATUS-001`, `TC-S4-STATE-001`; composition owner coordinates T10 patches.

- [ ] **T3 — Versioned item/content/save/checkpoint contracts and migration** (P0; 4–6 days)

  Owner Architect/Data; Core/Narrative/Game Design/QA review. Proposed files: versioned schema 2.0/save2 documents, runtime schema catalog/validator/capability gate; item/condition/effect/explicit-cursor definitions and valid/invalid fixtures; new semantic migration module; reviewed content 2.1 archive and schema compatibility matrix. AC: strict item IDs/types/unique slots/bounded memory/secret progress; held vs remembered predicates; all payload/checkpoint fields validated; pure format 1→2/content 2.1→3.0 mapping after old2.0→2.1; no retroactive extra item/vignette; exact semantic cursor or documented tested recovery; quota/raw-backup/future/race/integrity policy; old schemas immutable. Evidence `TC-S4-CONTRACT-001`, `TC-S4-SAVE-001/002`. No future3D asset type/library addition.

- [ ] **T4 — Pure Pouch transactions and vignette eligibility** (P0; 3–5 days)

  Owner Core/Application; Architect/Game Design/QA/Narrative review. Proposed files: `src/core/domain/keepsake-pouch.js`, pure item transaction use-case, approved orchestration/condition/effect integration, unit tests. AC: empty/partial/full, collect/refuse/release/atomic replace/cancel, unique IDs/no stacks/single opportunity; pre-snapshot revision/guard; safe-context control; no partial/full auto-drop/stat bonus; no global mutable state/browser. Held/acquired/released separate, irreversible legacy flag untouched, skip-all remains viable. Vignette complete only last-beat acknowledgement; checkpoint/retry restores ledger. Evidence `TC-S4-POUCH-001`, `TC-S4-CALLBACK-001`, `TC-S4-RETRY-001` and preserved Core invariants.

- [ ] **T5 — Adventure Keepsake Pouch UI** (P0; 2–3 days)

  Owner UI; Accessibility/PO/Narrative/Core review. Proposed files: `src/ui/components/keepsake-pouch.js`, item detail/full-pouch decision components, styles/resources, DOM tests. AC: tactile3(or4) slots, readable used/capacity/empty state,2D art/text fallback, item selection/remembered location, parallel retain/refuse/replace/cancel wording; native buttons/one modal/inert background/Tab/Escape/restoration; release availability from VM, no UI-state mutation of held IDs. Confirmed domain command only at safe opportunity; view/close never saves/drops. No 3D selector/orbit/drag-only requirement. `TC-S4-POUCH-002`, `TC-S4-A11Y-001`.

- [ ] **T6 — Session Dialogue History data and modal** (P0; 3–5 days)

  Owner Application/Data/UI in sequenced file handoff; Architect/Narrative/Accessibility review. Proposed files: pure session-history reducer, localized history projector, `history-dialog.js`, shared overlay helper/styles/resources/tests. AC: ≥50 dialogues+50 chosen actions including Pouch commit; action before successfully displayed response; repeats kept as visits; no render/preload/rejected/cancel append; New Game/Title/Resume/retry/reload policy correct. Native focus/inertness/scroll/empty/reload note stable under save/media patches; no domain rewind. Evidence `TC-S4-LOG-001/002`; bounds tested without truncating speech; history not Pouch persistence.

- [ ] **T7 — Tender Act 1 rewrite, objects and Secret Moments** (P0; 4–7 days, includes narrative authorship)

  Owner AI Narrative author + Lead Narrative; PO/Game Design/Architect/Art/QA review. Files: approved baseline narrative amendments, versioned Act 1 content/package/choice/flag/item/vignette records, localization, graph expectations/candidate catalog and provenance. AC: **new/refined prose across all seven scenes**, fresh meaningful prompts/feedback/choices, original three home directions;4 proposed item opportunities (5 if capacity4 is ratified to exercise a real full-pouch choice) and2–3 optional moments sized/ratified; full capacity choice; no-blame storm/decompression; held/memory/default callbacks and fixed convergence; no combat/stat complexity/fourth ending/collect-all gate. Final human Thai editorial and exact IDs/guards/effects/graph/version/migration map reviewed; new IDs never repurpose old meaning. `TC-S4-NARRATIVE-001`, `TC-S4-GRAPH-001`, `TC-S4-CALLBACK-001`. Legacy2.1 source kept; no “no prose edit to avoid migration” substitute for this deliverable.

- [ ] **T8 — Act 2–5 map and Sprint5 Grand Keepsake handoff** (P0; 2–3 days, design only)

  Owner Narrative/Game Director/Architect; PO/Game Design/Art review. Files: proposal §8 and proposed dedicated Act 2–5 map/registry/default/ending-nuance design artifact under `docs/proposals/sprint-04-overhaul/`; future S5 readiness notes. AC: per-act spine, simple route forks/convergence by A3-003, red-yarn/material continuity, secret eligibility/return/default/checkpoint/notice briefs; late girl/Bond/consent/repair and exact 3-ending resolver; empty bag equivalent outcome path. Both 3D models reserved for HOME Grand Keepsake after transformation, optional future presentation/localized fallback/rights/device/dependency brief. **No Act 2–5 source/runtime/assets/viewer integration in S4.** `TC-S4-MAP-001` design review, not E2E proof of later acts.

- [ ] **T9 — Intent Tags, item art and Data presentation projection** (P0; 2–3 days)

  Owner Data/UI/Art; Narrative/Architect/Accessibility/PO review. Files: versioned tag/icon/skin/crop presentation catalog and loader/projection, `content-view-model.js`/`content-presentation.js`, original 2D item/icon assets/provenance and localized resources/tests. AC: seven retained and all approved new choices have truthful intent/cue/disabled reason; no numerical/ending/morality spoilers; item details only for encountered/held objects; unknown images keep text; catalog strict refs/locale/hash/path/rights/root+subpath; gameplay eligibility comes from Core, not visual metadata. No GLB/vendor promotion. `TC-S4-CHOICE-001`, `TC-S4-ASSET-001`, relevant contract negatives.

- [ ] **T10 — Bootstrap, migration/save wiring and application integration** (P0; 3–4 days)

  Owner Application; Core/Data/UI/Architect/QA review. Files: `src/bootstrap/index.js`, overlay/accepted-event composition helpers, storage adapter only where new approved version/write admission needs it, relevant bootstrap/persistence/media tests. AC: compose concrete ports once; distinguish view vs domain item intents; busy/confirmation/modal safeguards; serialize accepted item actions/history; save inventory+checkpoint via existing stage/backup/guards; no read-replay effects on Resume; latest settings on Retry; audio gestures/loops unaffected by Pouch opening. View/status changes keep state; confirmed inventory changes intentionally mutate exactly approved fields once. `TC-S4-ARCH-001`, `TC-S4-STATE-001`, `TC-S4-SAVE-002`, `TC-S4-E2E-001`.

- [ ] **T11 — Legacy/new regression, narrative/visual/manual acceptance** (P0; 3–5 days)

  Owner QA/DevOps; PO/Art/Narrative/Game Design/Accessibility/Architect review. Files: existing legacy E2E runners/fixtures retained or equivalent version-aware adaptation; proposed S4 Pouch/story runner/new evidence, trace matrix, audit/SSOT/root changelog. AC: baseline 691 cases with equivalent or explicitly authorized/version-traced expectations pass, zero fail/cancel/skip/todo; legacy14/21/12 witnesses retained; new graph count/witnesses/optional/release/default/slot3-or4 variants separately recorded; migration/retry/save faults and UI/root+subpath; real Thai/art/keyboard/AT/device/performance review; S5 map ready. No inferred full-game/3D/G2/deploy completion.

Estimate: **32–50 engineering + narrative person-days**, plus **3–5 Art days** and human/manual review scheduling. This replaces old19–29 estimate because persistent domain/save/branch work was added. No duration commitment; PO may split S4 into contract+UI, Pouch+Log and narrative+handoff sub-milestones while preserving the full directive. Gate A after T1/T2 visual; Gate B T3–T6 Pouch/save/Log; Gate C T7/T8 narrative/map; Gate D T9–T11 integrated acceptance.

Shared-file ownership: T3 schema/migration validator; T4 Core state/effects; T7 content/graph; T9 projector/resources/2D art; T2 renderer scaffold; T5/T6 independent modal files; T10 only composition; T11 consolidated evidence/docs. Sequence edits to common schema/VM/localization/styles/orchestration explicitly; no concurrent overwrite or implicit agent delegation.

## 5. DoR and DoD

### 5.1 Current planning deliverable

- [x] PO strategic pivot/writing assignment captured; v0.1 assumptions superseded prospectively.
- [x] Inspect existing branch/diff/identity/latest develop, leaf flag/migration/checkpoint/narrative consumers and merged model status; preserve local references.
- [x] Revise three requested documents with Pouch/state/capacity/Secret Moments, tender writing examples, Act 2–5 map and END-HOME/S5 placement.
- [x] Update D1–D7, owners/files/AC/dependencies, version/migration/rollback and proposed verification matrix.
- [x] Fresh unchanged-runtime unit regression:691/691, no fail/cancel/skip/todo; no new Pouch feature pass claimed.
- [x] Documentation/trace/audit/commit prepared on requested branch for PO review.

### 5.2 Implementation DoR — detail review remains open

- [x] PO scope pivot, 3–4 range, AI narrative assignment, three endings and S4/S5/Grand Keepsake placement explicitly received.
- [ ] Exact capacity3-or4, opportunity/item/vignette/callback/absence/release rules ratified by PO/Game Design/Narrative.
- [ ] Baseline GDD/SRS/Narrative amendments resolve physical leaf vs historical flag and early material/progression teaching; no Canon conflict left for implementation.
- [ ] Architect accepts versioned inventory/checkpoint/cursor/schema/DSL/migration and new prospective ADR; valid/invalid/mapping/recovery fixtures ready.
- [ ] Current-page migration/retry/unknown/integrity/backup/rollback policy demonstrably implementable for every supported old save point.
- [ ] Exact AI-authored scenes/graph/IDs/tags/media approved through task reviews, not by blanket approval of any generated text.
- [ ] Art/rights clear 2D items/icons/texture; reviewers/devices/browser/AT/performance profile/time agreed.
- [ ] Each source task meets observable success/failure AC, one coherent PR scope and exclusive file handoff.

### 5.3 Implementation DoD — 0/12 complete

- [ ] T0–T11 AC/evidence/owner acceptance complete, no inert UI controls.
- [ ] Pouch ≤approved capacity; atomically acquired/released/replaced; distinct held/memory semantics and correct save/Retry/Resume.
- [ ] Legacy691/equivalent assertions and historical graph witnesses retained; new graph/secret/release/absence branches fully witnessed with no weakened test.
- [ ] All seven Act 1 scenes receive accepted tender narrative refinement; default paths complete; simple branches converge; no combat/complex added stat/extra ending/item-gated Canon.
- [ ] Visual rubric/Thai art/crop/focus/zoom/reduced-motion/high contrast and Log/Pouch modal paths accepted.
- [ ] Real device/AT/manual/performance/static-asset/provenance/security and version/migration/rollback gates pass.
- [ ] Act 2–5 map/S5 brief accepted; no later-act or3D implementation falsely claimed.
- [ ] Trace→design→artifact→evidence→PR/audit complete, every unrun/deferred feature clear; `FR-UI-004` still partial beyond Log.

## 6. Verification plan and evidence status

### 6.1 Existing commands only

```sh
node --test tests/unit/*.test.js
JKB_PLAYWRIGHT_PATH=/absolute/path/to/playwright/index.mjs node tests/e2e/act1-playthrough.mjs
JKB_PLAYWRIGHT_PATH=/absolute/path/to/playwright/index.mjs node tests/e2e/visual-novel-benchmark.mjs
```

Browser paths resolve from environment; do not invent npm scripts/root dependencies. Both retained browser runners exist but were not rerun for this documentation change. New schema reference/Pouch/new-story/visual runner automation below is **proposed, not materialized**. New evidence writes to S4 directory; no overwrite of Sprint3 screenshots/raw reports. Prior 0.1 evidence remains historical.

### 6.2 Proposed evidence matrix

| ID / gate | Required checks | Evidence owner / limitation |
|---|---|---|
| `TC-S4-ARCH-001` | Browser-free Core state/reducers; Data no UI; UI no storage/parser/domain mutation; bootstrap only concrete composition | Static/contract tests+inspection, new contract fixtures when materialized |
| `TC-S4-VIS-001` | Title/reading/decision/exploration/feedback/confirm/Log/Pouch empty/full/failed-media at320×568,390×844,768×1024,1440×900,2560×1440,844×390 | Actual screenshots/node/page/settings/hash, PO target/rubric; device mockup not comparison surface |
| `TC-S4-STATUS-001` | Saving/saved/failure/memory-only visible text, feedback/deltas/one announcement, focus stable under async patches | Real DOM and media/save faults; no copied CSS assertion |
| `TC-S4-CHOICE-001` | Three home directions/seven legacy+new approved tags/cues/order, full-pouch refuse/replace/cancel, high-impact confirmation/disabled reason | Catalog/projection/DOM and Narrative/Game Design review |
| `TC-S4-CONTRACT-001` | Old schemas locked; new item/condition/effect/cursor/save formats/meta-schema refs, unknown/null/duplicate/out-of-capacity/mismatch/reference/locale negatives | Data/Architect fixtures+independent reference validation; absent in current round |
| `TC-S4-POUCH-001` | Capacity3 and reviewed4 boundary, collect/release/replace/cancel atomicity; safe opportunity/revision/double input/unknown IDs; no stat reward/repeat farming | Pure deterministic Core snapshots; every rejected command returns original state |
| `TC-S4-POUCH-002` | Empty/partial/full 2D slots/names/details/absence/image-fail; keyboard/touch/close/cancel; open does not mutate, accepted commands mutate once | UI/Application browser and manual use; no 3D network allowed |
| `TC-S4-LOG-001/002` | 60→50 latest dialogue,50 actions independently, repeated visits/Pouch commits, no unseen/rejected append; reset/reload; modal inert/focus/scroll/async status | Reducer/projection+native dialog browser; manual AT required |
| `TC-S4-CALLBACK-001` | Held/acquired/released/never-found leaf/item variants; discarded physical object never shown; old leaf flag not cleared; no-item defaults/equally valid emotional result | Narrative/content/model truth table, includes later-act **map** guards not unimplemented E2E |
| `TC-S4-GRAPH-001` | New Act 1 fixed convergence/reachability/no softlock/unknown IDs; all optional nodes+edges and no-item/refuse/release/full-capacity paths; completion acknowledged once | New catalog/witness count from reviewed T7; legacy14/21/12 stays separately archived |
| `TC-S4-SAVE-001` | Explicit1/2.0→1/2.1→2/3.0 steps, payload+checkpoint separate leaf maps, no retroactive new items/secrets, semantic cursor map or protected recovery, idempotent pure transforms | All supported saved pages/modes/checkpoints; digest policy and graph causal constraints verified |
| `TC-S4-SAVE-002` | Round-trip new inventory/memory/vignette cursor; stage/read-back/backup/guard/quota/unavailable/corrupt/future/concurrent raw changes; no guessed downgrade | Existing save-port fault suites plus new strict candidates;≤250KB UTF-8 |
| `TC-S4-RETRY-001` | Restore held/remembered/released/vignette progress and story facts to checkpoint; settings latest; Log does not unlock future item/scene | Pure and browser checkpoint cases before/after acquire/replace/secret completion |
| `TC-S4-STATE-001` | Overlay/settings/media rendering preserves story; item commands intentionally mutate approved fields once; legacy metric/state/flag/history invariants intact | Compare accepted snapshots/serialized save; do not demand identical graph after authorized rewrite |
| `TC-S4-A11Y-001` | Native semantics,44×44 targets, focus/inert/restore/not obscured; text AA4.5:1/large3:1/UI3:1;200% text+long Thai+native400% zoom/reflow, high/forced contrast/reduced motion | Automated smoke+manual VoiceOver/Safari,NVDA/Firefox/touch; no scan-only certification |
| `TC-S4-ASSET-001` | Original2D provenance/hash/Thai alt/same-origin root+subpath; no GLB/vendor/CDN/docs/photos/BLEND/generators in S4 artifact | Allowlist/network/negative resource tests; future model budgets out of current gate |
| `TC-S4-PERF-001` | Existing NFR load/feedback/input/transfer/save, bounded Pouch/ledger/Log/image/audio caches; full Pouch and new longest scene samples |20 cold+20 warm,≥100 actions/≥5 runs,3×30s frames; recorded device/profile; rAF before paint is not painted-frame evidence |
| `TC-S4-E2E-001` | Legacy12 canonical outcome witnesses; new Act 1 all reviewed item/secret/full/no-item combinations, Log/Pouch/reload/Retry/fault/root+subpath | Keep old fixture/version trace; new runner proposed, no production debug hook |
| `TC-S4-NARRATIVE-001` | Tender precise Thai across7 scenes, distinct voice/life stage, non-blaming storm/decompression, release/absence not inferior, no combat/complexstats/spoilers | Actual PO/Narrative/Art walkthrough notes; no AI self-certification |
| `TC-S4-MAP-001` | Act 2–5 spine/branches/convergence/material/consent/repair/defaults, same 3 endings and item-independent Canon route, S5 Grand Keepsake placement | Human design/trace review+Mermaid source/render when tooling ready; not later-act runtime proof |

Budgets unchanged: NFR-PE-001..005 (initial≤2MB compressed; shell+critical JSON≤500KB; cold≤3s/warm≤1.5s p75; interactions≤100ms p95; save≤250KB), image/audio32/16MiB. Pouch/ledger/completion IDs bounded by registered content; Log50+50 with bounded text/metadata. No S4 WebGL/library/GPU acceptance gate because no 3D runtime is shipped.

### 6.3 Current revision evidence

| Gate | Disposition |
|---|---|
| Baseline unit regression | Fresh **691/691**,0 fail/cancel/skip/todo;35,118.220 ms on unchanged runtime at9a08d0b |
| Documentation | Three requested artifacts revised; link/anchor/ID/table/consistency/diff checks recorded in new pivot audit |
| Old visual/browser/media evidence | Retained historical evidence only; no new visual candidate |
| Pouch/schema/migration/new story tests | Not materialized/not run in planning |
| Real device/AT/listening/PO final art/prose | Not performed; required later for changed journeys |
| Source/release/build/merge/deploy | Not performed in this revision |

## 7. Audit trail, risk and approval register

| Record | Disposition |
|---|---|
| `CR-20261014-2131` | [PO Directive pivot](../changelog/2026-10/2026-10-14-2131-sprint-04-pouch-directive.md): proposal/RFC/SSOT 0.2.0, implementation 0/12 |
| `CR-20261014-1841` | [Original0.1 planning record](../changelog/2026-10/2026-10-14-1841-sprint-04-overhaul-plan.md), historical0/10/viewer recommendations superseded |
| `CR-20260908-1430` | [Sprint3 integration](../changelog/2026-09/2026-09-08-1430-sprint-03-merge-closeout.md), completed WBS/manual gate status not rewritten |
| `CR-0004` | [Model spike](../rfc/CR-0004-adult-plush-model-spike.md), mergedPR11, future END-HOME asset candidates |

| Risk / decision | Owner and action |
|---|---|
| D1 exact 3/4 and expanded32–50 effort | PO/Game Design fix value and milestone sizing; initial range/scope already directed |
| D2 exact narrative/branch prose | AI authors within assignment; Narrative/Game Design/PO validate final scenes, no repeated permission before drafting |
| D3 history reload boundary | Agree ephemeral Log policy separately from required persistent Pouch |
| D4 discarded leaf/current prop continuity and red yarn Act 1 vs A2 material | Narrative/Game Design clarify guards/baseline text; default scenarios prevent missing/incorrect item depiction |
| D5 schema/save/cursor/migration/retry compatibility | Architect/QA own explicit mapping, unknown/raw protection and versioned ADR; source waits relevant contract readiness |
| D6 Grand Keepsake | S5 owns actual 3D/runtime/rights/art/device delivery; models not carried or exposed in S4 |
| D7 legacy vs new evidence/manual | QA/Accessibility separate approved expectation changes, new graph witness counts and actual human/device gates |
| Local references | Preserve untracked folder; never stage personal reference photographs |

Documentation rollback reverts current revision only. Future runtime rollout/rollback follows [proposal §9](../proposals/sprint-04-overhaul/01-proposal-plan.md#9-architecture-versions-migration-and-rollback) and accepted new contracts; no migration executes now. Direction acknowledged, detailed DoR open, all implementation boxes remain unchecked.
