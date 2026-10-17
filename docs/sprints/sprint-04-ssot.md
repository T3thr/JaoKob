# Sprint 4 Execution SSOT: Visual, Narrative & Adventure Keepsake Overhaul

| Document control | Value |
|---|---|
| Sprint / document | `SPRINT-04` / `JKB-SPRINT-04-SSOT` |
| Version / date | **0.5.0** / 2026-10-17, Asia/Bangkok: Slice5 T9–T11 engineering submission for PR17 |
| Status | **Slices1–4 merged; 12/12 engineering/design task submissions delivered through five slices. PR17 and final human/device/AT acceptance remain open; sprint merge closeout is pending.** |
| Authority | Current PO Slice5 directive authorizes T9/T10/T11, verification and PR17; ADR-P0-019/020/021 and CR-0005 govern the integrated delivery |
| Integrated baseline | `develop@bc167d3` (governance sync after37bad50), including PR13@01cee6f, PR14@6692c1b, PR15@f8ee156, and PR16@37bad50 |
| Review branch / PR | `feat/sprint-04-slice-05-closeout` / PR #17 → develop; PR13/14/15/16 merged |
| Proposal / RFC | [JKB-PROP-S4-001 v0.2.1](../proposals/sprint-04-overhaul/01-proposal-plan.md) / [CR-0005 v0.2.6](../rfc/CR-0005-sprint-04-overhaul.md) |
| Models | [PR #11](https://github.com/T3thr/JaoKob/pull/11) MERGED at `e980339`; future **S5 END-HOME Grand Keepsake**, not S4 Pouch dependency |
| Owners | PO, Technical Lead/Architect, Core/Application/Data/UI, Narrative/Game Design, Art, Accessibility, QA/DevOps |

**Slice 1 merge & ADR-P0-020 ratification: 2026-10-16.** Slice 1 (T1/T2) was verified, accepted, and merged into `develop` via [PR #13](https://github.com/T3thr/JaoKob/pull/13) (commit `01cee6f`) fulfilling [ADR-P0-019](../adr/ADR-P0-019-visual-novel-runtime-ergonomics-and-design-system-mandate.md). PO and Lead Architecture officially ratified [ADR-P0-020](../adr/ADR-P0-020-adventure-keepsake-pouch-and-item-system.md), locking the Adventure Keepsake Pouch capacity at **4 slots** to align with the 5-Act narrative arc. Slices 1–3 are merged. Following Slice 4 PR #16 delivery, [ADR-P0-021](../adr/ADR-P0-021-narrative-resonance-authentic-adventure-and-branching-integrity.md) was ratified and implemented; PR #16 was verified, accepted, and merged into `develop` via commit `37bad50`. Slice 5 (Tasks T9, T10, T11 / PR #17) is the final remaining sprint closeout slice.

## 1. Goal and phased scope

ยกระดับ JaoKob เป็นเรื่องเล่าที่อ่านสบายและอ่อนโยน ผ่าน visual craft, choices ที่เข้าใจง่าย และ **Adventure Keepsake Pouch** ที่ทำให้สิ่งเล็ก ๆ ระหว่างทางมีความทรงจำ. Pouch เป็นของในโลกของเรื่องและมี persistent domain state; ไม่ใช่ collection viewer ของตุ๊กตานอกเรื่อง.

| Milestone | Scope / exit artifact |
|---|---|
| **Sprint 4** | Paper card/frosted HUD/Intent Tags; Dialogue History; **Pouch UI/Core State/save/checkpoint**, 4 slots (ratified in ADR-P0-020); AI-authored **Act 1 all seven scenes** with keepsake choices/2–3 proposed Secret Moments; **Act 2–5 branching map draft** |
| **Sprint 5** | Production Act 2–5 story/media/runtime capabilities from accepted map; held/remembered callbacks and three existing endings; **Grand Keepsake childhood/adult models after END-HOME** |

Visual review starts Scene 1–3 then applies style across Act 1; writing/Pouch scope is not limited to that benchmark. Original14 nodes/21 edges/12 outcomes are **legacy content 2.1 witnesses**; new graph counts come from reviewed T7. Three original mother/roots/siblings directions retain their emotional identity; new Pouch choices supplement them.

No combat/XP/level/equipment/rarity/crafting/currency/weight optimization, complex new stat system or achievement hunting. HP/พลังใจ/Bond remain three readable narrative signals and existing resolver inputs unless separately redesigned; no item stat bonuses. Retain late Bond/girl reveal, non-blaming storm, player agency, three END-HOME/NEARBY/DAWN categories and a living frog with a separate poetic gift mirror only after HOME consent gate (ADR-P0-021 D6). Nuances are not new endings or mandatory collection objectives.

S4 non-goals: production Act 2–5/ending code, 3D renderer/library/model/vendor promotion, fourth ending, full-seven-scene new media production, persistent exact transcript, animated typewriter/auto-advance/voice/TTS, new locales, Login/backend/telemetry/CDN/deploy. Models/spike source remain untouched.

### 1.1 Revision authority

v0.2.0 replaces v0.1.0 Act 1 non-diegetic doll viewer, presentation-only save assumptions and limited/optional editorial scope. PO direction and AI writing assignment are explicit; no repeat approval of that direction is requested. The 2026-10-16 PO directive and ADR-P0-020 ratify four slots and authorize Slice 2 T0/T3/T4/T5. The [Slice 2 contract](../design-system/keepsake-pouch-contract.md) fixes its readiness, exact save/checkpoint semantics and failure/rollback policy before source. T7 now delivers the executable narrative/item/moment candidate; T9/T10 art/catalog/promotion and any old→new cursor mapping remain gated.

### 1.2 Final PO endorsement and emotional impact

[Final PO record](../changelog/2026-10/2026-10-14-2233-sprint-04-final-po-narrative-impact.md) confirms approval of v0.2.0 main direction and mandates v0.2.1 refinement. Keep 5 acts/mother/root/current philosophy and the fair Bond-based HOME/NEARBY/DAWN resolver. T7 seeds lived childhood attachment and vulnerability/agency; T8 deepens Act3–4 drama, actual metric consequences and decompression, meaningful five-item held/released/absent comfort and the yarn→velour/blue-shirt/red-heart END-HOME handoff. Girl remains discreet, short-spoken and defined by water/cloth/open route/step back, without invented biography.

Approved plan direction does not assert that proposed prose is final Canon, new inventory/schema/migration are implemented, adult red-heart embroidery exists or a merge has happened. Current adult spike shirt is plain; S5 Art refinement and code/device/export checks remain delivery work. The new Act3–4 content/model work is **S5 runtime**; this S4 revision requires a reviewable map/brief, not later-act implementation. No main-direction reconfirmation is requested.

## 2. Traceability matrix

`TC-S4-*` are evidence/design identifiers, not newly Approved requirements. Slice 1 materializes VIS/STATUS/STATE/A11Y checks; [Slice 2 evidence](../../tests/e2e/evidence/sprint-04/slice-02/README.md) materializes scoped Pouch/schema/save/checkpoint checks. T7 registers actual candidate narrative/item/secret IDs under the current PO directive; final human editorial acceptance remains open. Existing requirements do not fully govern new inventory mechanics; **CR-0005 D1/D4/D5** is the change path to amend GDD/SRS/Narrative/schema at T0/T3 before implementation.

| Requirement / PO decision | Observable design outcome | Owner artifact / task | Proposed evidence |
|---|---|---|---|
| `FR-UI-001`, `NFR-MA-001/002`, `ADR-P0-001/004/005/012/014/015`, `ADR-P0-019` | Pure Core; immutable localized VM; overlay vs domain command separated; stable dialogue anchor | T2/T4/T6/T10, renderer/session reducers/composition | `TC-S4-ARCH-001`, `TC-S4-STATE-001` |
| `GDD-UX-001..005/007`, `FR-UI-002/003/005/007`, `GDD-BOND-005`, `ADR-P0-019` | Title/Reading/Decision, frosted HUD/paper card, stable bottom anchor, ergonomic settings, no AI slop, locked no-number Bond | T1/T2/T9/T10 | `TC-S4-VIS-001`, `TC-S4-STATUS-001`, `TC-S4-CHOICE-001` |
| `FR-ENG-009`, `GDD-UX-006`, log part of `FR-UI-004`, D3 | ≥50 dialogue+50 committed actions; session-only reload notice, read-only modal | T6 history reducer/projector/dialog | `TC-S4-LOG-001/002` |
| **CR-0005 D1/D4**, `ADR-P0-020`, `GDD-PROG-001/002`, `GDD-CHO-002/003` | 4 slots (ratified in ADR-P0-020); held/acquired/released distinction; full/refuse/cancel/atomic replace; no item score/combat/collection gate | T0/T3/T4/T5; proposed new item registry/core/UI | `TC-S4-POUCH-001/002` |
| **CR-0005 D2/D4 Final PO**, `GDD-CONT-001..004`, `NAR-DLG-001..005`, `NAR-TONE-001`, `NAR-THM-001/002/003/004/005`, `NAR-CON-001/002/003/004/005/006/007/010` | Tender childhood/root-current setup; Act3–4 threat/HP/พลังใจ/body/agency/rest; five-item held/memory/default uses and simple convergent map | T7/T8 Narrative/Map | `TC-S4-NARRATIVE-001`, `TC-S4-EMOTION-001`, `TC-S4-GRAPH-001`, `TC-S4-MAP-001` |
| `GDD-DEC-A1-002-A/B`, `GDD-DEC-A5-001-B`, `NAR-MTX-END-001`, **D4/D5** | Preserve legacy flag meaning; explicit held guard for physical leaf/share; released/default alternatives | T0/T3/T7 callback amendments | `TC-S4-CALLBACK-001`, leaf migration/empty-Pouch routes |
| `GDD-END-004/005/006`, `GDD-BOND-006`, `GDD-BAL-004/006/007`, `NAR-CON-007/009`, **D6 Final PO** | Fair same-three-ending resolver/repair; no item/suffering/accessibility bias; childhood→adult red-heart Grand Keepsake only after HOME | T8 S5 map/ending/model-gap brief | `TC-S4-FAIR-001`, `TC-S4-GIFT-001`, `TC-S4-MAP-001`; no S4 ending runtime pass |
| `FR-CNT-001/002/004/005/006`, `FR-LOC-001/003`, **D5** | Versioned strict item/condition/effect/cursor content and visual catalog, locale/refs/rights | T3/T7/T9 validators/fixtures/provenance | `TC-S4-CONTRACT-001`, `TC-S4-ASSET-001` |
| `FR-SAV-001/003/004/005/006/007/009`, `GDD-PROG-003`, **D5** | Inventory/memory/secret completion in save+checkpoint; pure exact migration, retry and backup/write guards | T3/T4/T10 persistence/migration | `TC-S4-SAVE-001/002`, `TC-S4-RETRY-001` |
| `FR-ACC-001..004`, `GDD-ACC-001..005/008/010`, `NFR-US-003/004/005/006`, `NFR-PO-002/004` | Keyboard/touch, focus/inert modal, Thai zoom/reflow, high contrast/reduced motion/root+subpath | T1/T2/T5/T6/T9/T11 | `TC-S4-A11Y-001`, manual device/AT |
| `NFR-PE-001..005`, `NAR-IP-003/004` | Bounded item/log/asset/save data,2D-only S4 network, licensed original art | T3/T9/T11 | `TC-S4-PERF-001`, `TC-S4-ASSET-001` |
| `FR-ENG-001/002/003/008`, meter/flag/checkpoint invariants | Legacy691 cases equivalent; new actions correctly mutate only approved domain fields; overlay-only intent preserves state | T4/T10/T11 | Legacy suite + `TC-S4-STATE-001`, `TC-S4-E2E-001` |

Actual implementation PR links are added per task after delivery; PO main-direction/final-principle approval is recorded, while no new FR/ADR/sample prose is self-approved as implemented/final Canon. Exact baseline amendments for inventory/memory/cursor and GDD progression teaching are T0 design artifacts, not unstated exceptions.

## 3. Architecture and contract baseline

Full feature contract: [proposal §§5–9](../proposals/sprint-04-overhaul/01-proposal-plan.md#6-adventure-keepsake-pouch-ui-state-and-emotional-choices) and [ADR-P0-020](../adr/ADR-P0-020-adventure-keepsake-pouch-and-item-system.md). Pouch lists/state are pure Core domain facts; `session-history.js` is an ephemeral pure application reducer. UI can hold selection/modal scroll only and sends intents; Data handles strict parse/validation/localization; only bootstrap imports concrete adapters. Six domain states remain; Pouch modal is not a seventh state.

The current Slice3 directive ratifies D3; [T6 contract](../design-system/session-history-contract.md) fixes exact display acknowledgement,50+50 bounds and reset/retain/reload policy before source. Log lives separately from the snapshot/save, including the existing Decision-only `payload.history`; no new storage key or migration. Source/evidence are delivered in this slice, with final human acceptance open.

Slice 2 publishes **pouch/save schemas 2.0.0** in `specs/schemas/v2.0.0/` and writes **saveFormatVersion 2**, with immutable published older schemas. It keeps the reviewed **Act 1 content 2.1.0** and exact semantic read position. Slice4 now adds common/event/package/tree schema2 and actual rewritten content3, with fixed-return moments using existing acknowledged-node/dialogue cursors. Its explicit content port is browser-tested; normal entry stays archived2.1 until T9/T10 promotion.

Migration is **1/2.0 → 1/2.1 → 2/2.1**: the existing strict presentation migration runs first where needed, then a pure semantic Save 1→2 maps the historical leaf separately for payload/checkpoint. True `keepsake.lily_fragment` (the directive's conceptual `hasLeaf`) becomes held/acquired/remembered `item_leaf`; false produces no held leaf. No other items/refusals/secrets are retroactively awarded. Old→rewritten3.0 cursor transforms and unverified source digests remain protected with raw records intact. Candidate format2/content3 is separately identity-validated and resumes exactly; format1/content3 remains unsupported. Recovery/Resume performs no writes or on-enter replay; subsequent accepted actions use existing staging/backup/raw-race guards plus downgrade protection. Retry restores pouch from checkpoint with latest settings. Session Log is delivered separately in T6 without changing that save contract.

No model-viewer port/vendor/GLB runtime in S4; ADR-P0-016/017 remain spike history. S5 separately approves production Grand Keepsake presentation/dependency/device/rights. Merged PR #11 is no longer a blocking asset integration dependency for S4.

## 4. Execution WBS

Priority: **approved contracts/legacy proof → UI Styles → DOM Renderer → Pouch Core/save/UI → Dialogue Log → Act 1 Narrative + Act 2–5 Map → Intent/media projection → integration/QA**. AI can draft prose/maps as planning/content-design work; production integrations obey per-task DoR.

### 4.1 Master Delivery Matrix: PR & Slice Mapping (Fixed Contract)

Sprint 4 delivers all 12 tasks (T0–T11) through exactly **5 scoped Pull Requests (5 Slices)**. No additional slices or unreviewed tasks may be introduced.

| Slice | Delivery Target | Scope Tasks | PR Reference | Status |
|---|---|---|---|---|
| **Slice 1** | Visual Novel Presentation & Ergonomics (Gate A) | T1, T2 | [PR #13](https://github.com/T3thr/JaoKob/pull/13) (`01cee6f`) | **MERGED** |
| **Slice 2** | 4-Slot Keepsake Pouch & Save 2 Migration (Gate B.1) | T0, T3, T4, T5 | [PR #14](https://github.com/T3thr/JaoKob/pull/14) (`6692c1b`) | **MERGED** |
| **Slice 3** | Session Dialogue History Backlog & Modal (Gate B.2) | T6 | [PR #15](https://github.com/T3thr/JaoKob/pull/15) (`f8ee156`) | **MERGED** |
| **Slice 4** | Tender Act 1 Rewrite & Act 2–5 Map (Gate C) | T7, T8 | [PR #16](https://github.com/T3thr/JaoKob/pull/16) (`37bad50`; `feat/sprint-04-slice-04-narrative`) | **MERGED** |
| **Slice 5** | Intent Tags, Integration & Final Acceptance (Gate D) | T9, T10, T11 | [PR #17](https://github.com/T3thr/JaoKob/pull/17) (`feat/sprint-04-slice-05-closeout`) | **ENGINEERING DELIVERED; REVIEW / MERGE PENDING** |

Current Progress: **5/5 engineering slice submissions; 4/5 PRs merged (80%)**. PR17 contains the final T9–T11 integration. Full sprint acceptance still requires owner/manual gates and merge of PR17; no merge or deployment is performed by this delivery.

### 4.2 Task Details and Specifications

- [x] **T0 — Four-slot ratification and Slice 2 contract/readiness (ADR-P0-020)**

  PO directive + Lead Architecture authority; [implementation contract](../design-system/keepsake-pouch-contract.md) precedes source; [baseline amendment handoff](../proposals/sprint-04-overhaul/04-pouch-baseline-amendments.md) records the owner-gated narrative follow-up. Scope: exact four slots, distinct historical/physical memory, no item stat reward, Save 2/checkpoint/legacy leaf mapping, failure/rollback, original 2D art, six viewport profiles and owner gates. Baseline720 and legacy14/21/12 witnesses retained. Detailed future narrative/vignette/cursor approval remains with T7/T9/T10; no new Canon is self-approved. `TC-S4-ARCH-001`.

- [x] **T1 — Handcrafted styles, frosted HUD, design system and paper card (ADR-P0-019)** (P0; 2–3 days)

  Owner UI/Art; PO/Narrative/Accessibility review. Files: `docs/design-system/visual-novel-specification.md`, `src/ui/styles/{tokens,base,layout,components,motion,index}.css`; original 2D icon/texture/provenance as approved. AC: ADR-P0-019 formal Design System specification authored first; tokens & 8pt spatial grid; contrast ratio >= 4.5:1 (7:1 high contrast); stable bottom-anchored dialogue card; sacred narrative space (no stat deltas or warnings in reading card); remove AI slop patterns (no em-dash in Thai, no unicode emoji icons); unified low-specificity tokens/materials; bounded frosted backdrop; Thai typography/320–2560/reduced motion/forced colors. `TC-S4-VIS-001`, `TC-S4-A11Y-001`.

- [x] **T2 — Persistent DOM regions, three-screen separation & ergonomic settings (ADR-P0-019)** (P0; 3–4 days)

  Owner UI; Application/Data/Accessibility/PO review. Files: `dom-renderer.js`, `stage-view.js`, `settings-dialog.js`, proposed Title/Reading/Decision/utility/response/overlay components; agreed VM/localization and focused renderer tests. AC: Title atmospheric backdrop with discreet floating content advisory icon (no blunt banner, no modal collision with new game button); Reading card on fixed bottom baseline (zero CLS/vertical jumping between Reading and Decision); Stat deltas as transient HUD micro-toasts (never inside dialogue card); Decision Crossroads with symmetric tactile cards without inner scrollbars; Settings modal features fixed top-right close button (✕) without forced scrolling, styled switch toggles with clear On/Off feedback, direct audio mute toggle from utility rail; desktop progression ergonomics (stage click / Spacebar / Enter); no emoji icons. Evidence `TC-S4-STATUS-001`, `TC-S4-STATE-001`.

- [x] **T3 — Pouch/save 2.0 contracts and semantic Save 1→2 migration (ADR-P0-020)**

  `specs/schemas/v2.0.0/{pouch,save-state}.schema.json`, strict runtime validators, pure `src/data/persistence/save-1-to-2.js`, versioned fixtures and independent reference runner. Four unique held slots, bounded acquired/released/remembered/refusal lists and every payload/checkpoint field validate; unknown/corrupt/future/unregistered/integrity-bearing legacy inputs remain protected. All legacy saved pages retain exact cursor/metrics/flags/RNG/history/settings/revision; quota/backup/race/downgrade cases pass. Content stays2.1; future content3/vignette contracts are T7/T9/T10, not claimed complete. `TC-S4-CONTRACT-001`, `TC-S4-SAVE-001/002`.

- [x] **T4 — Pure Pouch transactions and checkpoint integration (ADR-P0-020)**

  `keepsake-pouch.js`, `pouch-transaction.js`, normalized Data-owned legacy bridge and generic orchestration. Collect/refuse/release/atomic replace/use, four-slot/no-stack/single-encounter/revision/context invariants, immutable rejected state, no stat reward; domain coverage100% lines/branches/functions. Existing leaf actions collect/refuse atomically, keeping legacy flags/effects intact. The only current release opportunity is after the final rest acknowledgement; future authored utility/vignette opportunities remain later content work. Retry restores held/released/remembered checkpoint facts; optional-scene completion is not invented. `TC-S4-POUCH-001`, `TC-S4-STATE-001`, `TC-S4-RETRY-001`.

- [x] **T5 — Adventure Keepsake Pouch modal and inspection (ADR-P0-020)**

  Native `keepsake-pouch-dialog.js` through `modal-frame.js`, four tactile equal slots, count/empty/detail/remembered states, original leaf art and localized safe DOM text. Fixed SVG close, native inertness, focus trap/Escape/opener and confirmation cancel focus, touch targets, responsive 8pt spacing,200% text/high/forced contrast and image fallback verified. Full-pouch collect/refuse/replace/cancel UI and utility intents are fixture-tested; only reviewed leaf appears in production. Opening/inspection/close/cancel never saves. Confirmed safe release saves once and survives reload; no 3D requests. `TC-S4-POUCH-002`, `TC-S4-A11Y-001`.

- [x] **T6 — Session Dialogue History data and modal** (source/evidence delivered; PO/AT review open)

  Owner Application/Data/UI in sequenced file handoff; Architect/Narrative/Accessibility review. Proposed files: pure session-history reducer, localized history projector, `history-dialog.js`, shared overlay helper/styles/resources/tests. AC: ≥50 dialogues+50 chosen actions including Pouch commit; action before successfully displayed response; repeats kept as visits; no render/preload/rejected/cancel append; New Game/Title/Resume/retry/reload policy correct. Native focus/inertness/scroll/empty/reload note stable under save/media patches; no domain rewind. Evidence `TC-S4-LOG-001/002`; bounds tested without truncating speech; history not Pouch persistence.

  Delivered under the current PO directive and [T6 contract](../design-system/session-history-contract.md): independent50+50 immutable session buffers, explicit displayed-prefix acknowledgements, chosen/Pouch actions before responses, truthful reload note, native archive/HUD and view-only save/audio invariance. [Audit CR-20261016-0142](../changelog/2026-10/2026-10-16-0142-sprint-04-slice-03-history.md) links935 unit cases,12 legacy routes,23 History captures at six viewports plus2 action-client captures. Save2/content2.1 unchanged; FR-UI-004 remains partial beyond Log.

- [x] **T7 — Tender Act 1 rewrite, objects and Secret Moments** (executable candidate/evidence delivered; final human editorial acceptance open) (P0; 4–7 days, includes narrative authorship)

  Owner AI Narrative author + Lead Narrative; PO/Game Design/Architect/Art/QA review. Files: approved baseline narrative amendments, versioned Act 1 content/package/choice/flag/item/vignette records, localization, graph expectations/candidate catalog and provenance. AC: **new/refined prose across all seven scenes**, fresh meaningful prompts/feedback/choices, original three home directions;4 proposed item opportunities (5 if capacity4 is ratified to exercise a real full-pouch choice) and2–3 optional moments sized/ratified; full capacity choice; no-blame storm/decompression; held/memory/default callbacks and fixed convergence; no combat/stat complexity/fourth ending/collect-all gate. Final human Thai editorial and exact IDs/guards/effects/graph/version/migration map reviewed; new IDs never repurpose old meaning. `TC-S4-NARRATIVE-001`, `TC-S4-GRAPH-001`, `TC-S4-CALLBACK-001`. Legacy2.1 source kept; no “no prose edit to avoid migration” substitute for this deliverable.

  **Final Directive AC — T7 (Act1 source scope):**

  **T7-AC-01:** Mother/root/current teaching stays concise and sensorial; at least one lived family action and each approved Act1 item opportunity provide an identifiable setup for later memory callbacks. Mother is remembered, never a ghost or confirmation of family fate. Under ADR-P0-021 D4/D5, distinguish playful sibling temperaments and seed the family's shared shell shelter before the fifth object.

  **T7-AC-02:** Storm/coping/rest show a small frightened/tired body **and** a deliberate breath/rest/safe action; no player-blame, forced collection or extra damage just to manufacture pity. Every actual HP/พลังใจ effect has authored cause/cue/feedback; recovery and no-item/default variants remain complete. D2/D3 require physical waves/root movement, blocked/silted return and remaining water ahead; the family search stays emotionally present without system commentary or duplicate prose/result blocks.

  **T7-AC-03:** Act1 held/acquired-released/never-acquired variants have parallel emotional value; no discarded physical prop is depicted. Seed red-thread/cloth bridge as a later-act brief without forcing yarn into Act1 or showing a doll body/model there. No collection/courage/suffering/achievement score.

  **T7-AC-04:** Sample prose/choice/voice review confirms tender natural Thai, family rhythm and agency; girl's identity/backstory/speech is not added to early setup. Exact unit/guard/ID/effect trace and migration witnesses stay required. Evidence: TC-S4-NARRATIVE-001/EMOTION-001/CALLBACK-001 as design and later implemented Act1 checks.

- [x] **T8 — Act 2–5 map and Sprint5 Grand Keepsake handoff** (design/evidence delivered; human review open) (P0; 2–3 days, design only)

  Owner Narrative/Game Director/Architect; PO/Game Design/Art review. Files: proposal §8 and proposed dedicated Act 2–5 map/registry/default/ending-nuance design artifact under `docs/proposals/sprint-04-overhaul/`; future S5 readiness notes. AC: per-act spine, simple route forks/convergence by A3-003, red-yarn/material continuity, secret eligibility/return/default/checkpoint/notice briefs; late girl/Bond/consent/repair and exact 3-ending resolver; empty bag equivalent outcome path. Both 3D models reserved for HOME Grand Keepsake as separate poetic mirrors of the living frog (ADR-P0-021 D6), optional future presentation/localized fallback/rights/device/dependency brief. **No Act 2–5 source/runtime/assets/viewer integration in S4.** `TC-S4-MAP-001` design review, not E2E proof of later acts.

  **Final Directive AC — T8 (S4 design, S5 implementation handoff):**

  **T8-AC-01:** Exactly five-act spine, original3-ending thresholds/order/consent/repair and convergence by A3-003 remain mapped; mother/root/current philosophy reappears in new context rather than a replaced theme. New beats fit canonical scene anchors or explicitly reviewed extra nodes.

  **T8-AC-02:** Act3–4 map names wheel near-miss, hot paving, hurried feet and discarded objects plus concrete indifferent/kind human acts. Each has cue→choice→accepted consequence→body/inner reaction→agency/rest/observation, with pause beats before moving to the next threat or A4-004. No rushed pain montage or graphic collision/open wound.

  **T8-AC-03:** Provide HP/พลังใจ high/low/default/Story Assist expression and effect-provenance matrix; narration/view-only item use cannot change meters. Retain safe checkpoint paths, below30 recovery within two main Decisions, unavoidable loss≤15 between checkpoints and timely decompression. Respect all baseline recovery exceptions/conditions; no item-exclusive healing or damage-to-Bond reward.

  **T8-AC-04:** All five objects—leaf/dew stone/lotus shell/rain petal/red yarn—have at least one anchored look/hold/remember action, released-memory and never-acquired variant. Physical state truth is enforced; memory survives release and no-item comfort/trust path is meaningful. No trophy/list-completion/rarity reward or moral label for keeping versus letting go.

  **T8-AC-05:** Same accepted metrics/trust flags with held/released/absent/empty-Pouch variations yield the same ending ID; preserve fair cautious/accept-now/wait paths, compensation/repair budget and Story Assist access. Nuances never create a fourth/higher-quality ending or require pain/all items/all secrets. Provide expected-results truth table **and reachable choice trajectories**, including dignified self-reliant Act4–5 choices that keep Bond<30 without items. Preserve all original A/B/compensation effects; enumerate the design graph per ADR-P0-021 D1, separately from unimplemented S5 E2E.

  **T8-AC-06:** Girl review passes no name/bio/relationship exposition/rescue monologue/claimed private thoughts; clear reveal still A4-004. She initially misjudges water/shadow distance, notices the frog retract/freeze and adjusts her position. Repeated mutual learning leaves an open return route; water/warm cloth remains voluntary and her speech brief (ADR-P0-021 D4).

  **T8-AC-07:** END-HOME shows the living, comfortable frog freely exploring, drinking and returning to the garden. After the safe-help gate, intercut separate Childhood Crochet and Adult Velour Plush/blue T-shirt embroidered red heart as poetic gift mirrors, then return visibly to the active frog before the gift card (ADR-P0-021 D6). Held/released/empty eligible routes get full warmth/heart motif; Reflective endings retain living frog. Real-gift connection is discreet and unnamed, without personal input or explaining the girl's identity.

  **T8-AC-08:** Art-gap manifest explicitly records **current adult blue shirt lacks red-heart embroidery**; S5 must refine original mesh/material/thread design and verify export/hash/provenance/device performance. Existing assets stay unchanged in S4. New samples are draft until editorial review; no claim final likeness/3D/Canonical prose is already delivered. Evidence TC-S4-MAP-001/EMOTION-001/FAIR-001/GIFT-001.

- [x] **T9 — Intent Tags, item art and Data presentation projection** (P0; 2–3 days)

  Owner Data/UI/Art; Narrative/Architect/Accessibility/PO review. Files: versioned tag/icon/skin/crop presentation catalog and loader/projection, `content-view-model.js`/`content-presentation.js`, original 2D item/icon assets/provenance and localized resources/tests. AC: seven retained and all approved new choices have truthful intent/cue/disabled reason; no numerical/ending/morality spoilers; item details only for encountered/held objects; unknown images keep text; catalog strict refs/locale/hash/path/rights/root+subpath; gameplay eligibility comes from Core, not visual metadata. No GLB/vendor promotion. `TC-S4-CHOICE-001`, `TC-S4-ASSET-001`, relevant contract negatives.

- [x] **T10 — Bootstrap, migration/save wiring and application integration** (P0; 3–4 days)

  Owner Application; Core/Data/UI/Architect/QA review. Files: `src/bootstrap/index.js`, overlay/accepted-event composition helpers, storage adapter only where new approved version/write admission needs it, relevant bootstrap/persistence/media tests. AC: compose concrete ports once; distinguish view vs domain item intents; busy/confirmation/modal safeguards; serialize accepted item actions/history; save inventory+checkpoint via existing stage/backup/guards; no read-replay effects on Resume; latest settings on Retry; audio gestures/loops unaffected by Pouch opening. View/status changes keep state; confirmed inventory changes intentionally mutate exactly approved fields once. `TC-S4-ARCH-001`, `TC-S4-STATE-001`, `TC-S4-SAVE-002`, `TC-S4-E2E-001`.

- [x] **T11 — Legacy/new regression, narrative/visual/manual acceptance** (P0; 3–5 days)

  Owner QA/DevOps; PO/Art/Narrative/Game Design/Accessibility/Architect review. Files: existing legacy E2E runners/fixtures retained or equivalent version-aware adaptation; proposed S4 Pouch/story runner/new evidence, trace matrix, audit/SSOT/root changelog. AC: baseline 691 cases with equivalent or explicitly authorized/version-traced expectations pass, zero fail/cancel/skip/todo; legacy14/21/12 witnesses retained; new graph count/witnesses/optional/release/default/fixed4-slot variants separately recorded; migration/retry/save faults and UI/root+subpath; real Thai/art/keyboard/AT/device/performance review; S5 map ready. No inferred full-game/3D/G2/deploy completion.

T11 checkbox records the implemented verification/evidence submission. Human PO/Thai/Art/listening, real-device and AT acceptance remain open in §5/§6; automated results do not self-approve those gates.

Estimate: **32–50 engineering + narrative person-days**, plus **3–5 Art days** and human/manual review scheduling. This replaces old19–29 estimate because persistent domain/save/branch work was added. No duration commitment; PO may split S4 into contract+UI, Pouch+Log and narrative+handoff sub-milestones while preserving the full directive. Gate A after T1/T2 visual; Gate B T3–T6 Pouch/save/Log; Gate C T7/T8 narrative/map; Gate D T9–T11 integrated acceptance.

Shared-file ownership: T3 schema/migration validator; T4 Core state/effects; T7 content/graph; T9 projector/resources/2D art; T2 renderer scaffold; T5/T6 independent modal files; T10 only composition; T11 consolidated evidence/docs. Sequence edits to common schema/VM/localization/styles/orchestration explicitly; no concurrent overwrite or implicit agent delegation.

**Slice 1 delivery & extension (history):** [PR #13](https://github.com/T3thr/JaoKob/pull/13). Implementation commit `a634409` was rejected in human/playtest visual review due to critical UX/UI flaws. T1/T2 are reopened under [ADR-P0-019](../adr/ADR-P0-019-visual-novel-runtime-ergonomics-and-design-system-mandate.md) to author the formal Design System specification (`docs/design-system/visual-novel-specification.md`) and complete the 6 ergonomic pillars before merge.

**Slice 4 delivery boundary:** [Act1 contract](../design-system/act1-narrative-contract.md) precedes implementation. Actual `act-01.json` is rewritten content3/schema2:28nodes,47edges,70dialogues,five natural objects and three optional three-beat moments. Fifth offering supports all four atomic replacements/refusal/cancel; no-item and release-all comfort is complete. [Act2–5 handoff](../proposals/sprint-04-overhaul/05-act-2-5-map-and-endings.md) fixes convergence before A3-003, red yarn at A2-006, late girl/fair three-ending resolver and S5 adult red-heart gap. At Slice4 delivery the normal entry remained pinned to exact archived2.1. Slice5 now starts3.0 for New Game and retains exact compatible2.1 continuation, as specified in the [closeout contract](../design-system/sprint-04-closeout-contract.md). Candidate is tested through actual application/storage/DOM; no later-act runtime or3D is claimed. See [audit CR-20261016-0302](../changelog/2026-10/2026-10-16-0302-sprint-04-slice-04-narrative.md) and [evidence](../../tests/e2e/evidence/sprint-04/slice-04/README.md).

## 5. DoR and DoD

### 5.1 Current planning deliverable

- [x] PO strategic pivot/writing assignment captured; v0.1 assumptions superseded prospectively.
- [x] Inspect existing branch/diff/identity/latest develop, leaf flag/migration/checkpoint/narrative consumers and merged model status; preserve local references.
- [x] Revise three requested documents with Pouch/state/capacity/Secret Moments, tender writing examples, Act 2–5 map and END-HOME/S5 placement.
- [x] Update D1–D7, owners/files/AC/dependencies, version/migration/rollback and proposed verification matrix.
- [x] Fresh unchanged-runtime unit regression:691/691, no fail/cancel/skip/todo; no new Pouch feature pass claimed.
- [x] Documentation/trace/audit/commit prepared on requested branch for PO review.

**ADR-P0-019 corrective delivery:** Design specification authored before source; native Title/choice confirmations, pure measured reading pages, centred intrinsic choices, HUD-only2500ms consequences, scene advisory, direct master toggle and guarded desktop input are implemented. [CR-20261015-1757](../changelog/2026-10/2026-10-15-1757-sprint-04-adr-019-runtime-ergonomics.md) records720 unit cases,12 legacy routes,36 visual captures plus14 production runtime captures at six profiles. This is the historical Slice1 verification record; PR13 was subsequently reviewed and merged at01cee6f as confirmed by the current PO directive. Slice2 owner/manual gates are tracked separately.

### 5.2 Implementation DoR — Slice5 satisfied; human acceptance remains open

- [x] PO/Lead Architecture ratified four slots, dual memory/utility role, pure domain and Save2/UI in ADR-P0-020 and current directive.
- [x] Exact observable success/failure AC, impact, artifact ownership, compatibility, fixtures and rollback fixed before source in the Slice2 contract/audit.
- [x] Legacy source and unchanged2.1 cursor mapping, independent checkpoint leaf mapping, strict schema/runtime parity and write/recovery guards verified.
- [x] Original leaf/chrome provenance, Thai resources, existing native modal and six viewport evidence available.
- [x] No runtime dependency, new Canon, unreviewed opportunity or production3D introduced; human owner acceptance explicitly open.
- [x] T7: [candidate contract](../design-system/act1-narrative-contract.md), five-item/three-secret registry, schema2/pure predicates/atomic effects, archived2.1 and exact Save2 candidate cursor witnesses.
- [x] T9/T10: pre-source [closeout contract](../design-system/sprint-04-closeout-contract.md), strict versioned catalog, five original images/provenance, production3.0 promotion and exact2.1 continuation; no automatic cursor mapping.
- [x] T6: current PO directive ratifies D3 session-only/reload policy; contract, exact presentation/commit sequencing, bounds, tests and rollback fixed before source.
- [x] T8: [dedicated Act2–5 map](../proposals/sprint-04-overhaul/05-act-2-5-map-and-endings.md), effect/recovery/consent/repair/default/three-ending truth tables and inspected red-heart art gap.
- [x] T11: repeatable retained/new unit/schema/design/browser/performance/static/rollback gates and explicit final manual acceptance checklist materialized before verification. Real-device/AT/PO sign-off remains required.

### 5.3 Implementation DoD — 12/12 engineering/design submissions; final human gates open

- [ ] T0–T11 AC/evidence/owner acceptance complete, no inert UI controls.
- [x] Slice2 Pouch ≤4; atomic collect/refuse/release/replace/use; distinct held/memory semantics and correct Save2/Retry/Resume with unchanged2.1 content.
- [x] Slice3 T6 session-only50+50 History, committed-action/displayed-response ordering, repeated occurrences, visible-prefix pagination, modal/HUD/lifecycle and read-only persistence/audio evidence.
- [x] All935 integrated baseline assertions retained against exact archived2.1; new28-node/47-edge graph, three secret acknowledgements and full/refusal/replacement/release/absence witnesses verified separately. T11 consolidates final acceptance.
- [x] All seven Act1 scenes and ADR-P0-021 remediation were accepted in mergedPR16; Slice5 preserves their graph/effects/prose and verifies production integration, optional/empty/full/released paths.
- [ ] Visual rubric/Thai art/crop/focus/zoom/reduced-motion/high contrast and Log/Pouch modal paths accepted.
- [ ] Real device/AT/manual/performance/static-asset/provenance/security and version/migration/rollback gates pass.
- [ ] Act2–5 map/S5 brief passes T8-AC-01..08, fair ending/metric/pouch/persona truth tables, root/current continuity and red-heart asset-gap handoff; no later-act or3D implementation falsely claimed.
- [x] Trace→design→artifact→evidence→PR17/audit submission complete, unrun/deferred gates explicit; `FR-UI-004` still partial beyond Log.

## 6. Verification plan and evidence status

### 6.1 Existing commands only

```sh
node --test tests/unit/*.test.js
JKB_PLAYWRIGHT_PATH=/absolute/path/to/playwright/index.mjs node tests/e2e/act1-playthrough.mjs
JKB_PLAYWRIGHT_PATH=/absolute/path/to/playwright/index.mjs node tests/e2e/visual-novel-benchmark.mjs
JKB_PLAYWRIGHT_PATH=/absolute/path/to/playwright/index.mjs node tests/e2e/keepsake-pouch.mjs
JKB_PLAYWRIGHT_PATH=/absolute/path/to/playwright/index.mjs node tests/e2e/session-history.mjs
JKB_AJV_PATH=/absolute/path/to/ajv/dist/2020.js node tests/schema/pouch-reference.mjs
JKB_AJV_PATH=/absolute/path/to/ajv/dist/2020.js node tests/schema/closeout-reference.mjs
node tests/design/ending-trajectories.mjs
JKB_PLAYWRIGHT_PATH=/absolute/path/to/playwright/index.mjs node tests/e2e/narrative-slice.mjs
```

Browser paths resolve from environment; do not invent npm scripts/root dependencies. The existing canonical runner was rerun for Slice 1 with a separate output directory; the Sprint 3 performance benchmark remains historical. `tests/e2e/sprint-04-visual-slice.mjs` now materializes scoped visual/status checks. Slice2 Pouch/schema/migration/browser automation is materialized; `tests/e2e/narrative-slice.mjs` now materializes candidate story/secret/full-pouch browser checks, separately from the normal2.1 entry. New evidence writes to S4 directory; no overwrite of Sprint3 screenshots/raw reports. Prior 0.1 evidence remains historical.

### 6.2 Acceptance matrix and per-delivery evidence

| ID / gate | Required checks | Evidence owner / limitation |
|---|---|---|
| `TC-S4-ARCH-001` | Browser-free Core state/reducers; Data no UI; UI no storage/parser/domain mutation; bootstrap only concrete composition | Static/contract tests+inspection, new contract fixtures when materialized |
| `TC-S4-VIS-001` | Title/reading/decision/exploration/feedback/confirm/Log/Pouch empty/full/failed-media at320×568,390×844,768×1024,1440×900,2560×1440,844×390 | Actual screenshots/node/page/settings/hash, PO target/rubric; device mockup not comparison surface |
| `TC-S4-STATUS-001` | Saving/saved/failure/memory-only visible text, feedback/deltas/one announcement, focus stable under async patches | Real DOM and media/save faults; no copied CSS assertion |
| `TC-S4-CHOICE-001` | Three home directions/seven legacy+new approved tags/cues/order, full-pouch refuse/replace/cancel, high-impact confirmation/disabled reason | Catalog/projection/DOM and Narrative/Game Design review |
| `TC-S4-CONTRACT-001` | Old schemas locked; new item/condition/effect/cursor/save formats/meta-schema refs, unknown/null/duplicate/out-of-capacity/mismatch/reference/locale negatives | Data/Architect fixtures+independent reference validation; Slice4 adds common/event/tree/package2 cases |
| `TC-S4-POUCH-001` | Fixed capacity4 boundary, collect/release/replace/cancel atomicity; safe opportunity/revision/double input/unknown IDs; no stat reward/repeat farming | Pure deterministic Core snapshots; every rejected command returns original state |
| `TC-S4-POUCH-002` | Empty/partial/full 2D slots/names/details/absence/image-fail; keyboard/touch/close/cancel; open does not mutate, accepted commands mutate once | UI/Application browser and manual use; no 3D network allowed |
| `TC-S4-LOG-001/002` | 60→50 latest dialogue,50 actions independently, repeated visits/Pouch commits, no unseen/rejected append; reset/reload; modal inert/focus/scroll/async status | Reducer/projection+native dialog browser; manual AT required |
| `TC-S4-CALLBACK-001` | Held/acquired/released/never-found leaf/item variants; discarded physical object never shown; old leaf flag not cleared; no-item defaults/equally valid emotional result | Narrative/content/model truth table, includes later-act **map** guards not unimplemented E2E |
| `TC-S4-GRAPH-001` | New Act 1 fixed convergence/reachability/no softlock/unknown IDs; all optional nodes+edges and no-item/refuse/release/full-capacity paths; completion acknowledged once | New catalog/witness count from reviewed T7; legacy14/21/12 stays separately archived |
| `TC-S4-SAVE-001` | Explicit1/2.0→1/2.1→2/2.1 steps; future3.0 map deferred, payload+checkpoint separate leaf maps, no retroactive new items/secrets, semantic cursor map or protected recovery, idempotent pure transforms | All supported saved pages/modes/checkpoints; digest policy and graph causal constraints verified |
| `TC-S4-SAVE-002` | Round-trip new inventory/memory/vignette cursor; stage/read-back/backup/guard/quota/unavailable/corrupt/future/concurrent raw changes; no guessed downgrade | Existing save-port fault suites plus new strict candidates;≤250KB UTF-8 |
| `TC-S4-RETRY-001` | Restore held/remembered/released/vignette progress and story facts to checkpoint; settings latest; Log does not unlock future item/scene | Pure and browser checkpoint cases before/after acquire/replace/secret completion |
| `TC-S4-STATE-001` | Overlay/settings/media rendering preserves story; item commands intentionally mutate approved fields once; legacy metric/state/flag/history invariants intact | Compare accepted snapshots/serialized save; do not demand identical graph after authorized rewrite |
| `TC-S4-A11Y-001` | Native semantics,44×44 targets, focus/inert/restore/not obscured; text AA4.5:1/large3:1/UI3:1;200% text+long Thai+native400% zoom/reflow, high/forced contrast/reduced motion | Automated smoke+manual VoiceOver/Safari,NVDA/Firefox/touch; no scan-only certification |
| `TC-S4-ASSET-001` | Original2D provenance/hash/Thai alt/same-origin root+subpath; no GLB/vendor/CDN/docs/photos/BLEND/generators in S4 artifact | Allowlist/network/negative resource tests; future model budgets out of current gate |
| `TC-S4-PERF-001` | Existing NFR load/feedback/input/transfer/save, bounded Pouch/ledger/Log/image/audio caches; full Pouch and new longest scene samples |20 cold+20 warm,≥100 actions/≥5 runs,3×30s frames; recorded device/profile; rAF before paint is not painted-frame evidence |
| `TC-S4-E2E-001` | Legacy12 canonical outcome witnesses; new Act 1 all reviewed item/secret/full/no-item combinations, Log/Pouch/reload/Retry/fault/root+subpath | Keep old fixture/version trace; Slice4 candidate runner materialized; full T11 acceptance remains open; no production debug hook |
| `TC-S4-NARRATIVE-001` | Tender precise Thai across7 scenes, distinct voice/life stage, non-blaming storm/decompression, release/absence not inferior, no combat/complexstats/spoilers | Actual PO/Narrative/Art walkthrough notes; no AI self-certification |
| `TC-S4-EMOTION-001` | T7 childhood setup + T8 city cue/metric/body/agency/rest matrix; near-wheels/heat/feet/trash, balanced recovery, five-item held/released/absent/default prose and no invented harm/ghost | S4 narrative/map/trace review; actual later-act runtime variants verified in S5, not claimed now |
| `TC-S4-FAIR-001` | ADR-P0-021 reachable self-reliant Bond0/15/20 trajectories and exhaustive design-choice branches; expected-results table: fixed metrics/trust flags keep ending ID under item/secret/strain/accessibility presentation changes; safe cautious/wait paths, compensation/repair and no achievement ranking | Design truth table + existing resolver baseline; actual new Pouch/endings E2E in S5 |
| `TC-S4-GIFT-001` | Living happy frog freely explores/returns; intercut crochet-memory/adult velour/blue/red-heart poetic mirrors, return to active frog, then discreet gift invitation; mutual-learning girl persona; plain-shirt asset gap and S5 art/export criteria | S4 brief/current-art inspection; no new GLB/rights/device certification; samples remain editorial drafts |
| `TC-S4-MAP-001` | Act 2–5 spine/branches/convergence/material/consent/repair/defaults, same 3 endings and item-independent Canon route, S5 Grand Keepsake placement | Human design/trace review+Mermaid source/render when tooling ready; not later-act runtime proof |

Budgets unchanged: NFR-PE-001..005 (initial≤2MB compressed; shell+critical JSON≤500KB; cold≤3s/warm≤1.5s p75; interactions≤100ms p95; save≤250KB), image/audio32/16MiB. Pouch/ledger/completion IDs bounded by registered content; Log50+50 with bounded text/metadata. No S4 WebGL/library/GPU acceptance gate because no 3D runtime is shipped.

### 6.3 Current revision evidence

| Gate | Disposition |
|---|---|
| Slice5 T9/T10/T11 | Current3.0 default, immutable2.1 continuation,30 authored intent entries/five original SVGs and bounded shared media. **1060/1060** unit cases (1004 retained+56 new), zero fail/cancel/skip/todo;18 metaschemas, current10package/59cursor and47Pouch cases; catalog13structural/11semantic negatives plus21 byte-identical published artifacts.12 archived browser routes;6 current profiles/21 captures; artifact/rollback, current five-image/fallback and Fast3G/CPU4x measurements are in the [consolidated evidence](../../tests/e2e/evidence/sprint-04/slice-05/README.md). Human/device/AT/merge/deploy remain open. |
| PR16 ADR-P0-021 D1–D6 (history) | **1004/1004** unit cases (all990 retained+14 new),0 failure/cancel/skip/todo; Core-backed design graph7anchors/20edges,114 empty-pouch trajectories including21DAWN,8 curated Bond traces,1,096 scenario-trajectories across8contexts;17/10/59 schema checks; refreshed6candidate profiles/21captures plus3action-client captures,0 unexpected errors. [Remediation evidence](../../tests/e2e/evidence/sprint-04/slice-04/adr-021/README.md). Normal2.1 remains pinned; later-act runtime and final human gates remain open. |
| Slice4 initial T7/T8 (148ed4b) | **990/990** unit cases (935 retained+55 new),0 failure/cancel/skip/todo;974 route witnesses cover28nodes/47edges;17 metaschemas/10new package cases/59Save2 cursor instances;12 legacy browser routes,6candidate profiles/21captures and2action-client captures pass. [Evidence](../../tests/e2e/evidence/sprint-04/slice-04/README.md). [T8 map](../proposals/sprint-04-overhaul/05-act-2-5-map-and-endings.md) supplies effect/fairness/gift design tables; later runtime/promotion/human gates remain open. |
| Slice3 History | **935/935** unit cases (874 retained +61 new),0 failures/cancel/skip/todo; reducer100% lines/functions and98.59% branches, projection100% lines/functions; **15** History layout profiles/**23** captures plus2 action-client captures, real visible-prefix/choice/Pouch/lifecycle/async/focus/audio/save checks and12 legacy routes pass. Bounded50+50 fixtures fit8MiB; actual Act1 routes fit128KiB; five100-action synchronous samples meet100ms p95 with layout shift0. [Evidence](../../tests/e2e/evidence/sprint-04/slice-03/README.md). Device/AT/PO/perceptual performance gates remain open. |
| Baseline unit regression | Final Directive rerun **691/691**, 0 fail/cancel/skip/todo; **26,196.327 ms** on unchanged runtime at d3e9f4d |
| Documentation | Three requested artifacts revised; link/anchor/ID/table/consistency/diff checks recorded in new pivot audit |
| Old visual/browser/media evidence | Sprint3 evidence retained historically; current Slice1 candidate has a separate bundle below |
| Slice2 Pouch/schema/migration | **874/874** total unit cases,0 fail/cancel/skip/todo (720 prior +154 new); domain100% lines/branches/functions;13 metaschemas/47 new structural+semantic cases and legacy11/36 reference cases pass. See [evidence](../../tests/e2e/evidence/sprint-04/slice-02/README.md). This is the historical Slice2 record; new story/secret tests are delivered in Slice4 above. |
| Slice2 Chromium | **12/12** retained Act1 routes;**18** empty/partial/full layouts at six profiles;**34** Pouch captures plus2 action-client captures; root/subpath, actual emulated touch taps, modal/confirm/focus,200% text/high/forced contrast/image fallback, exact Save1 backup and released-memory reload pass;0 unexpected console/page/external-network errors. |
| Slice 1 unit regression | **720/720**, 0 fail/cancel/skip/todo; all712 prior cases retained with explicit ADR-P0-019 presentation amendments, plus8 focused cases |
| Slice 1 Chromium | **12/12** legacy routes; **36** visual captures plus **14** production-runtime captures at six profiles; identical paper geometry/bottom24, complete Thai pagination/200%, symmetric choices without internal scrollbars, native confirmations/close, direct audio, HUD micro-toast, storm advisory/preferences, stage/Space/Enter guards; contrast10.61:1/high16.61:1, motion/fault checks; [evidence](../../tests/e2e/evidence/sprint-04/slice-01/README.md) |
| Real device/AT/listening/PO final art/prose | Not performed; required later for changed journeys |
| Source/release/build/merge/deploy | T0–T6 merged to develop (PR13@01cee6f; PR14@6692c1b; PR15@f8ee156). T7/T8 candidate/map delivered for review in Slice4; T9–T11 promotion/final acceptance, release and deploy remain pending. |

## 7. Audit trail, risk and approval register

| Record | Disposition |
|---|---|
| `CR-20261017-1400` | [Slice5 integration and final engineering acceptance](../changelog/2026-10/2026-10-17-1400-sprint-04-slice-05-closeout.md): T9/T10/T11, production3.0 plus exact2.1 continuation, new schema/catalog/original2D art, consolidated verification and local allowlisted artifact/rollback rehearsal; [PR17](https://github.com/T3thr/JaoKob/pull/17) to develop, review/merge pending. |
| `CR-20261016-1750` | [ADR-P0-021 ratification](../adr/ADR-P0-021-narrative-resonance-authentic-adventure-and-branching-integrity.md): binding mandate for narrative resonance, anti-slop, authentic characterization, and END-DAWN reachability; Slice 4 remediation within PR #16 |
| `CR-20261016-0302` | [Slice4 T7/T8 narrative and map](../changelog/2026-10/2026-10-16-0302-sprint-04-slice-04-narrative.md): actual content3 candidate/schema2, five objects/three moments, retained935 regression, new graph/save/browser evidence; initial source148ed4b; ADR-P0-021 D1–D6 remediation from3164601 retains1004 tests plus14 checks, updates the same audit/PR, [PR16](https://github.com/T3thr/JaoKob/pull/16); reviewed and MERGED into develop at 37bad50 |
| `CR-20261016-0142` | [Slice3 T6 Session Dialogue History](../changelog/2026-10/2026-10-16-0142-sprint-04-slice-03-history.md): source 3dfe56d; current PO D3 ratification; 935 unit cases, 12 original routes, 23 History captures; PR #15 reviewed and MERGED into develop at f8ee156 |
| `CR-20261016-0031` | [Slice 2 Pouch/Save 2 delivery](../changelog/2026-10/2026-10-16-0031-sprint-04-slice-02-pouch.md): T0/T3/T4/T5 implemented at 3a672a5; 874 unit cases, independent schemas, 12 routes and scoped modal/browser evidence; PR #14 reviewed and MERGED into develop at 6692c1b |
| `CR-20261016-0025` | [ADR-P0-020 ratification](../adr/ADR-P0-020-adventure-keepsake-pouch-and-item-system.md): 4-slot Keepsake Pouch architecture, dual keepsake/utility role, Save 2 schema; Slice 2 kickoff on `feat/sprint-04-slice-02-pouch` |
| `CR-20261015-1757` | [ADR-P0-019 corrective delivery](../changelog/2026-10/2026-10-15-1757-sprint-04-adr-019-runtime-ergonomics.md): design specification first; T1/T2 implementation complete2/12;720 unit cases/12 routes/50 captures; merged in PR13 |
| `CR-20261015-1710` | [ADR-P0-019 mandate & Slice 1 extension](../adr/ADR-P0-019-visual-novel-runtime-ergonomics-and-design-system-mandate.md): playtest rejection of commit `a634409`; T1/T2 reopened for Design System specification and 6 ergonomic pillars; PR13 extended |
| `CR-20261015-1544` | [ADR-P0-018 implementation](../changelog/2026-10/2026-10-15-1544-sprint-04-adr-018-vn-ergonomics.md): superseded by ADR-P0-019 following playtest failure |
| `CR-20261015-0013` | [PO sensory refinement](../changelog/2026-10/2026-10-15-0013-sprint-04-po-sensory-refinement.md): one bar/quiet success/lotus Title/consolidated Decision/water anchor;703 tests and12 routes; PR13 review open |
| `CR-20261014-2314` | [Slice 1 T1/T2 implementation](../changelog/2026-10/2026-10-14-2314-sprint-04-slice-01-visual.md): 2/12, unchanged Core/save/content, scoped Chromium evidence; PO review open |
| `CR-20261014-2233` | [Final PO approval/impact revision](../changelog/2026-10/2026-10-14-2233-sprint-04-final-po-narrative-impact.md): v0.2.1 ready for documentation review; source0/12 |
| `CR-20261014-2131` | [PO Directive pivot](../changelog/2026-10/2026-10-14-2131-sprint-04-pouch-directive.md): proposal/RFC/SSOT 0.2.0, implementation 0/12 |
| `CR-20261014-1841` | [Original0.1 planning record](../changelog/2026-10/2026-10-14-1841-sprint-04-overhaul-plan.md), historical0/10/viewer recommendations superseded |
| `CR-20260908-1430` | [Sprint3 integration](../changelog/2026-09/2026-09-08-1430-sprint-03-merge-closeout.md), completed WBS/manual gate status not rewritten |
| `CR-0004` | [Model spike](../rfc/CR-0004-adult-plush-model-spike.md), mergedPR11, future END-HOME asset candidates |

| Risk / decision | Owner and action |
|---|---|
| D1 ratified: 4 slots (ADR-P0-020) | Ratified by PO/Lead Architecture; exactly 4 unique slots matching the 5-act narrative arc |
| D2 exact narrative/branch prose | AI authors within assignment; Narrative/Game Design/PO validate final scenes, no repeated permission before drafting |
| D3 history reload boundary | Ratified by current PO directive: session-only50+50; reload starts from visible current passage with gentle notice; no Save2 transcript or new storage key. T6 delivered; human review remains. |
| D4 discarded leaf/current prop continuity and red yarn Act 1 vs A2 material | T7/T8 contract resolves physical leaf as held plus historical fact; released/refused/unseen defaults are explicit. Fifth Act1 offering is natural shell; red yarn first A2-006. Human prose review remains. |
| D5 schema/save/cursor/migration/retry compatibility | Slice5 starts content3 New Game while version-bound2.1 sessions retain exact cursors/checkpoints. Save2 raw-race/mixed-generation/backup/consent protection is tested; no guessed transform or automatic2.1→3 migration. |
| D6 Grand Keepsake | S5 owns actual 3D/runtime/rights/art/device delivery; models not carried or exposed in S4 |
| D7 legacy vs new evidence/manual | QA/Accessibility separate approved expectation changes, new graph witness counts and actual human/device gates |
| Local references | Preserve untracked folder; never stage personal reference photographs |

Slice2 rollback retains dual-format admission and downgrade/write guards or disables writes; preserve raw Save1 backup, never downgrade Save2 or repair to an empty bag. T0–T8 are merged into develop (PR13/14/15/16@37bad50). Slice5 delivers T9 Intent/art, T10 content-bound production/save integration and T11 repeatable engineering verification with explicit pending final human acceptance; PR17 remains for review and merge. Versioned `jaokob:preferences` remains unchanged.
