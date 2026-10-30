# Sprint 5 Execution Traceability Matrix

Version 0.2.0, 2026-10-18. Authority: [ADR-P0-022](../adr/ADR-P0-022-visual-novel-ergonomics-living-keepsake-lore-and-sprint-streamlining.md) and current PO directive. [SSOT](../sprints/sprint-05-ssot.md) owns WBS/DoR/DoD; [remediation contract](../proposals/sprint-05-planning/02-adr022-remediation-contract.md) defines the acceptance behavior. Planning delivery is [Draft PR #18](https://github.com/T3thr/JaoKob/pull/18). PR19–22 are the requested future sequence, not created PR links or completed work.

## 1. Critical review findings to required evidence

`R22-*` are local finding labels for this review, not new approved product Requirement IDs. Every row is **planned remediation / actual acceptance pending** until the stated evidence exists on a revised build.

| Finding | Authority / requirement | Tasks / planned PR | Changed artifacts planned | Required evidence / owner |
|---|---|---|---|---|
| R22-01: incoherent design, spacing, icons and affordance | ADR22 D2; FR-UI-001/003/007; FR-ACC-001..004 | T0/T4/T5, PR19 | Design spec, tokens/layout/components and dependent styles, renderer/icons/localization | `TC-S5-VN-001`, `TC-S5-PRESENTATION-001`, `TC-S5-A11Y-001`: real responsive compositions, pointer/default/focus states, Thai expansion and human comfort; UI/Accessibility/PO |
| R22-02: unnatural Thai prose | ADR22 D4; NAR-VOI-001..004; NAR-CON-010 | T6/T7, PR20; T8–T13, PR21; T18, PR22 | New Act1–5 prose/dialogue/choice intent, editorial record | `TC-S5-THAI-001`, `TC-S5-CLOSURE-001`: full-path read-aloud/on-device review, natural intention/cause, duplicate/meta-talk lint and documented revisions; Narrative/PO |
| R22-03: crowded HUD and difficult touch controls | ADR22 D3; FR-UI-005; NFR-US-005/006 | T4/T5, PR19; T17/T18, PR22 | Ambient meter region, separate system command region, responsive safe-area layout | `TC-S5-HUD-001`, `TC-S5-DEVICE-001`: ≥44×44 targets, gaps/no overlap, no Bond disclosure before gate, physical touch and comfort review; UI/QA |
| R22-04: biological opening and inconsistent body/scale | ADR22 D1; NAR-CAN-002; NAR-CON-001/003/008 | T0, PR19; T6/T7, PR20; T8–T15, PR21/22 | Revised lore/IDs, body-stage art, world-scale boards, callback registry, adult embroidery | `TC-S5-LORE-001`, `TC-S5-SCALE-001`, `TC-S5-GIFT-ART-001`: crochet→adult45cm blue shirt before storm, scale references and all-ending identity continuity; Narrative/Art/Game Design |
| R22-05: inner choice scrolling and cramped utilities | ADR22 D2/D3; FR-UI-003; FR-ACC-001..004 | T4/T5, PR19; T18, PR22 | Choice layout/pagination; Log/Pouch/Settings spacing/focus | `TC-S5-VN-001`, `TC-S5-UX-001`, `TC-S5-A11Y-001`: no nested choice scrollbar/clipping, all eligible actions reachable, utility reading comfort at expanded text; UI/Accessibility |
| R22-06: saved-success dot on every advance | ADR22 D2; FR-SAV-002/003; NFR-RL-003 | T3/T4, PR19 | Save-status projection/rendering, pseudo-elements/animation and attention messages | `TC-S5-SILENT-001`, `TC-S5-SAVE-001`: no visible/live success signal, actual save/reload, accessible quota/protection failure; Application/QA |
| R22-07: stiff visual staging and missing cinematic moments | ADR22 D4; GDD-AV-001..004; FR-UI-004 | T0/T1/T5, PR19; T7, PR20; T9/T11/T13, PR21 | Staging metadata, body portraits, growth/storm/city/girl/ending boards and illustrations | `TC-S5-CINEMATIC-001`, `TC-S5-MEDIA-001`: emotional beat and scale review, full text/still/audio-off fallback, semantic reload and once-only effects; Art/Narrative/QA |
| R22-08: narrative confirmation popup breaks flow | ADR22 D5; FR-UI-002/006; FR-ACC-001/003 | T4/T5, PR19 | Inline armed choice/revision/cancel state, localized cue, keyboard/touch semantics | `TC-S5-INLINE-001`: no narrative dialog, no effect on arm, deliberate one-time commit, preference/cancel/stale/rapid-input proof; UI/Application/QA |

## 2. Inherited system and delivery requirements

| Requirement / invariant | Tasks / planned PR | Artifacts / design | Verification |
|---|---|---|---|
| ADR22 D6: four value slices | T0 and every task, PR19–22 | SSOT matrix, per-PR internal checkpoints and audits | `TC-S5-REQ-001`: exactly S1/T0–5, S2/T6–7, S3/T8–13, S4/T14–19; no untraced fifth execution PR |
| ADR22 Save2 consequence; FR-SAV-001..009; NFR-MA-006 | T0/T1/T3, PR19; T13, PR21; T19, PR22 | New separately identified Save2 profile, exact legacy schemas/archives, real replay and guarded writer | `TC-S5-SCHEMA-001`, `TC-S5-SAVE-001`, `TC-S5-SAVE-002`, `TC-S5-REPLAY-001`: no forced old-save reset, new-reader compatibility, old-application byte protection, ≤250KB |
| Protected canonical package; FR-CNT-001..005; NFR-MA-004/006 | T0/T1/T3, PR19; T19, PR22 | Host-owned core descriptor, bounded registry/capabilities, identity-bound session/cache/media, S6 fixture | `TC-S5-PACKAGE-001`: same-version different packages isolated; reserved ID/overwrite/delete/shadow rejected; no Editor built |
| FR-STA-001..006; FR-ENG-001..009; TR-001..020 | T2/T3/T5, PR19; T8–T13, PR21 | Pure orchestration/transactions, crisis/Assist/Bond/ending/replay and real controls | `TC-S5-STATE-001`, `TC-S5-ENDING-001`: allowed/guarded/forbidden transitions, atomicity, no replay-on-read or farmable repair |
| ADR-P0-020; six encountered objects/four held slots; NAR-CON-002/010 | T6–T13, PR20/21 | Revised setup/payoff matrix and actual held/acquired/released/remembered/refused/unseen variants | `TC-S5-CALLBACK-001`: truthful physical use/defaults, no item-exclusive recovery/HOME, full/cancel/replace/refuse witnesses |
| NAR-CON-003; NAR-BRN-001..004; GDD-BAL-001..009 | T6/T8/T9, PR20/21 | Reeds/drain, before-A3-003 convergence, reachable recovery and checkpoint policy | `TC-S5-CONVERGENCE-001`, `TC-S5-BALANCE-001`: state-aware all-path witnesses, preserved route effects, no low-meter deadlock |
| GDD-END-001..006; NAR-END-001/002; ADR21 fairness retained | T2, PR19; T10–T13, PR21 | Three resolver IDs/thresholds and equally complete living-keepsake epilogues | `TC-S5-ENDING-001`, `TC-S5-CLOSURE-001`, `TC-S5-E2E-001`: eight design witnesses plus actual revised full journeys, no item/settings bias |
| FR-UI-004; FR-SET-001..004; FR-LOC-001..003 | T0/T5, PR19; T7/T13/T18, PR20–22 | Control/cutscene/settings disposition, complete Thai system strings and semantic text receipts | `TC-S5-UX-001`, `TC-S5-PRESENTATION-001`, `TC-S5-CINEMATIC-001`: real available controls, no inert button or silent scope waiver |
| NFR-PE-001..005; NFR-RL-001..005 | T1/T3/T4 and each content/media task; T17/T18, PR22 | Bounded catalog/save/replay/cache, staged persistence, optional media | `TC-S5-PERF-001`, `TC-S5-MEDIA-001`: measured budgets/faults and counterexamples, recorded host/network/device |
| ADR22 D6; FR-CNT-006; FR-ACC-001..004 | T14–T18, PR22 | Reviewed original art/export/poster, pinned same-origin viewer, focus/fallback/disposal | `TC-S5-ASSET-001`, `TC-S5-GIFT-ART-001`, `TC-S5-GIFT-001`, `TC-S5-DEVICE-001`, `TC-S5-A11Y-001`: real iOS/Android/AT, no early downloads, lifecycle/resource proof |
| NFR-SE-001..006; NFR-PO-002; FR-SAV-006 | T19, PR22 | Restricted static candidate/root+subpath, release inventory, Save2 rollback and core freeze | `TC-S5-RELEASE-001`: no private source/secret/telemetry/CDN, exact hashes, raw new-profile preservation; separate deployment permission |
| Human comfort/Thai and critical-feedback resolution | Every slice; final T18, PR22 | Build-linked reviewer records with scene/settings/viewport/finding/resolution | `TC-S5-ACCEPT-001`: every required review recorded; no automatic acceptance from count, lint, screenshot or plan |

## 3. Task allocation and old-plan disposition

| Existing task IDs | Previous planning allocation | Current allocation / changed scope |
|---|---|---|
| T0–T5 | S1–S3 contracts/runtime/presentation | S1 / PR19; T0/T3 now Save2 profiles and explicit lore archives; T4/T5 overhaul instead of speculative polish |
| T6–T7 | S4 Act2 | S2 / PR20; includes new Act1 crochet origin/growth/storm and Act2, with complete media/read-through |
| T8–T13 | S5–S7 Acts3–5 | S3 / PR21; world scale/cinematics updated, per-act review checkpoints retained inside one PR |
| T14–T19 | S8–S10 gift/qualification | S4 / PR22; production art/viewer, actual devices and final qualification in one value slice |

The old Save3 recommendation, ten-PR sequence, automatic biological→new-lore bridge and natural-frog-only ending invariant are retired. Prior documents/reports remain historical evidence, not active alternate requirements.

## 4. Evidence and review record rules

For each implementation PR record: requirement/finding → changed file or scene → test/inspection ID → exact command or human procedure → build/package/profile → result → evidence link → reviewer disposition. A future TC ID is a planned check until a runner/procedure actually exists.

Record superseded assertion names and ADR22 replacements for saved-dot visibility, choice modal, biological protagonist and hidden stage-click behavior. Preserve old evidence and all still-valid domain/save/legacy assertions. Exact legacy story tests continue against their archive; new-lore tests use the new package. Do not demand the obsolete behavior to keep a baseline count unchanged.

Human evidence includes role, date, build, scene/beat, viewport/device/settings, observation, severity, screenshot reference if available, revision and acceptance. Do not invent a reviewer, attach the wrong screenshots or mark prior critical findings resolved without a tested new build. Original 2026-10-17 unit/design evidence is retained; fresh planning checks are in [ADR22 replanning verification](../proposals/sprint-05-planning/evidence/adr022-replanning-verification.json).
