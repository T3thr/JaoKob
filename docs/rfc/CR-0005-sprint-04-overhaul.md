# CR-0005: Sprint 4 Visual, Narrative & Adventure Keepsake Overhaul

| Control | Value |
|---|---|
| Version / date | **0.2.0** / 2026-10-14, Asia/Bangkok — PO Directive revision |
| Status | **PO STRATEGY ADOPTED; detailed design PROPOSED; production implementation unstarted** |
| Author | Codex / Senior Technical Lead, Game Director, Principal UI/UX Architect |
| Scope | S4 UI/Log/durable Pouch/Act 1 rewrite + Secret Moments/Act 2–5 map; S5 content/three endings/Grand Keepsake |
| Change class | C2 branch/choice/presentation; C3 inventory/save/checkpoint/content contract compatibility |
| Sources | [Proposal v0.2.0](../proposals/sprint-04-overhaul/01-proposal-plan.md), [revised SSOT](../sprints/sprint-04-ssot.md), [Sprint 3](../sprints/sprint-03-ssot.md) |
| Review | [Draft PR #12](https://github.com/T3thr/JaoKob/pull/12), branch `feat/sprint-04-overhaul-plan` |

## 1. Authority, context and revision

Current PO Directive explicitly replaces adventure-time doll inspection with an **Adventure Keepsake Pouch**, limited to 3–4 physical objects with Secret Moments and Ending Nuances; assigns AI to rewrite/refine tender narrative; retains three endings/simple branches/no combat or complicated added stats; divides S4/S5 scope; and requests document updates plus commit before source work.

This supersedes v0.1.0's non-diegetic Act 1 two-doll viewer, presentation-only save plan and optional narrow editorial approach. Those directions are historical, not alternative current S4 requirements. The new vision and writing assignment are already issued by PO; they do not require reconfirmation. Exact schemas/slot value/guards/migration/approved prose and runtime integration still need the appropriate detailed review/DoR.

Baseline inspected: develop `e9803397587bb3ec8f2a61a87966d382277a96fc`, with [PR #11](https://github.com/T3thr/JaoKob/pull/11) merged 2026-10-14; planning branch `9a08d0b` includes it. Spike models remain isolated artifacts; accepted ADR-P0-016/017 do not approve a production viewer. Sprint 3 remains functional baseline with 691 tests and historical Chromium evidence; final visual/manual gates stay open.

## 2. Goals, boundary and protected Canon

S4 delivers paper reading card/frosted capsule HUD/Intent Tags, session Dialogue History, Pouch UI+pure durable state, revised Act 1 prose/choices/items/optional vignettes and a reviewed Act 2–5 map for S5. Visual benchmark starts Scene 1–3; writing/item gameplay covers all seven Act 1 scenes. S5 implements Act 2–5 and the existing three ending categories, including Grand Keepsake after END-HOME.

No combat engine, XP/levels/equipment/rarity/crafting/currency/item power/weight optimization. HP/พลังใจ/Bond remain the three simple narrative signals and existing resolver inputs; removal/threshold redesign is not inferred from “cut complicated stats”. No fourth or premium ending; no complete-all-items gate for Canon. Tadpole/life stage, storm without player blame, later girl/Bond reveal, agency/consent and symbolic transformation exclusively in END-HOME remain controlling rules.

S4 non-goals: production Act 2–5/ending code, model viewer/WebGL/vendor/model promotion, persistent exact dialogue transcript, typewriter/auto-advance/voice/TTS, all-seven-scene art production, Login/backend/telemetry/CDN/deployment. AI narrative drafting is in scope; final reviewed prose cannot be replaced by a decision to keep all old text merely for easier tests.

## 3. Updated D1–D7 decision register

| Decision | PO-issued direction | Recommended detailed design / alternatives | Status and review owner |
|---|---|---|---|
| **D1 — Phased scope and capacity** | S4 UI/Log/Pouch/Act 1/Act 2–5 map; S5 Act 2–5; capacity3–4 | Proposed default **3 slots**, no stacks or upgrade; 4 is allowed if fixed before implementation. Twelve WBS tasks, revised effort/gates | Strategic scope/range adopted; exact 3/plan sizing pending PO+Game Design+QA |
| **D2 — Narrative authorship and simplicity** | AI permitted and assigned warm/tender Act 1 rewrite, understandable branches, no combat/complex added stats, three endings | Concrete sensory actions/quiet kindness, 2–3 choices, short optional moments with convergence; exact prose/IDs/effects/guards reviewed as authored scene diff | Assignment adopted; final Narrative/Game Design/PO editorial acceptance pending |
| **D3 — Dialogue History** | Build Dialogue History in S4 | Retain session-only ≥50 dialogues+50 committed actions including acquire/release/replace; current-page reload notice. Durable transcript alternative requires separate store/migration/budget | Technical policy proposed, PO+Narrative+Architect review; Pouch persistence is separate |
| **D4 — Objects, memory and extra scenes** | Adventure objects, capacity choices, Secret Moments and Ending Nuances | `heldItemIds` vs acquired/released memory; authored atomic replace/cancel; optional secret eligibility; held props vs memory-only variants; no item required for Canon | Feature vision adopted; exact object/vignette registry and baseline callback clarification pending Game Design+Narrative+PO |
| **D5 — Core/save/schema compatibility** | Pouch has gameplay state; content changes in Act 1 | Proposed package/shared/tree schema 2.0, content 3.0, saveFormatVersion 2; pure item/condition/effect/cursor contracts, inventory in checkpoint, explicit legacy migration. Format1 sidecar alternative risks torn state/retry inconsistency | Recommended versioned domain-save approach proposed; Architect+Game Design+QA sign-off required; no S4 runtime library exception |
| **D6 — END-HOME Grand Keepsake** | Childhood crochet/adult velour presented elegantly in Act 5 END-HOME | S4 brief only; S5 epilogue reveal/edition framing, static fallback and optional post-ending inspection. Future production dependency/rights/device contract separate | Placement adopted; exact S5 visual/API/library approval deferred; no dolls in Pouch |
| **D7 — Quality and phased execution** | Review revised plan before code; prepare S5 handoff | Separate legacy/new graph suites; capacity/release/secret/no-item/migration/retry/fault tests, manual art/Thai/AT/device review, per-phase gates | Test/profile/reviewer schedule pending QA+Accessibility+PO/Architect; source work unstarted |

The table records actual direction without marking the entire RFC or any new FR/ADR Approved. Architectural choices become a new ADR after owner acceptance; no historical ADR rationale is rewritten. T0 handles GDD/SRS/Narrative contract amendments before code, rather than reading proposal strings as new executable authority.

## 4. Proposed design and alternatives

### 4.1 Presentation and History

Preserve semantic DOM RendererPort, safe localized immutable VM, Title→Reading→Decision presentation modes, actual three Scene 3 directions, locked no-number Bond and accessible notice/save/feedback/busy behavior. HUD glass must retain contrast fallback; Pouch/Log are one active overlay outside domain states. Viewing closes/restores focus without story commit. History records accepted action then successfully displayed response, never preload/unseen/rejected/confirmation selection.

Session transcript keeps original payload.history/viewed-ID meanings, count/byte bounds and New Game/reset/reload policy from proposal §5. It does not persist as a transcript; durable Pouch and checkpoint fields **do** persist. Modal keyboard/inertness/async focus behavior is verified separately from pure reducers.

### 4.2 Pouch and atomic capacity decisions

Pure domain inventory has fixed3 (or ratified4) slots, unique held IDs and bounded encountered/acquired/released memories plus acknowledged optional-vignette progress. Core receives validated normalized catalog and injected command identity/time, imports no browser/Data/UI. Data parses/validates/localizes; bootstrap composes and persists; UI sends intents.

Acquire/release/replace applies only at authored safe opportunities. Full Pouch gives keep-old/refuse-new, replace-one or cancel. No auto-drop, negative-stat penalty, repeat pickup farming or timer. Replace is one guarded transaction/revision containing release+acquire, or no change. Retry restores Pouch/memory/completion along with checkpoint; settings remain latest. Opening/selecting item details changes only UI state; confirmed item decisions are gameplay changes and are logged.

Historical leaf flag remains irreversible “chose to keep”. New held membership authorizes physical prop/share; acquired/released memory authorizes remembered imagery. Do not clear `keepsake.lily_fragment` or reuse `coping.let_go_early` for late release. Update GDD-DEC-A5-001-B/NAR-CON-002/callback conditions with reviewed held-state conjunct/default before implementing, so a discarded leaf never appears physically.

### 4.3 Optional vignettes and simple branching

Item/remembered/released/completed-vignette predicates are explicit strict content DSL/data, with fixed entry/convergence and no executable content. 2–3 short Act 1 moments are proposed, typically 2–4 manual beats. Current props/remembered versions/defaults are distinct; secret scene acknowledgement persists only after completion. Refusal/empty-Pouch route remains narratively complete and has future Canon path.

Act 2–5 draft map grounds major branches in Bible scene IDs: reeds/drain converge by A3-003; city survival is observation/patience/shelter; trust unfolds at A4-004 through repeated safe acts; A5 preserves consent/repair/resolver. Nuances decorate three existing endings without altering their categories/conditions. S4 map is design, not runtime capability or a claim the later acts exist.

### 4.4 Content placement and future Grand Keepsake

Act 1 candidate objects: leaf fragment, dew stone, lotus shell, rain petal; full capacity/release can be tested at a late safe rest. Red yarn is a proposed Act 2/3 object to preserve A2-006 first-human-material continuity. AI may draft alternatives under assignment; exact scene placement and final IDs are reviewed before content integration.

Models move entirely to Act 5 END-HOME/S5, after symbolic transformation and existing consent gate. Both editions are one Canon ending's Grand Keepsake representations, not extra endings or carried dolls. No viewer port/vendor/GLB request/runtime dependency is part of S4. Future use of pinned spike model-viewer requires new production RFC/ADR, same-origin resources, poster fallback, rights and device checks; placing models in the roadmap does not adopt that library now.

## 5. Impact and versioned contracts

| Boundary | Revised impact |
|---|---|
| Domain/state | New durable held/memory/vignette data and pure transactions; retain six state kinds/core metric invariants; inventory is not a seventh screen-state |
| Content/narrative | AI rewrite across Act 1, new optional nodes/events/choices and simple later-act map; 14/21/12 retained only for legacy fixture |
| UI/application | Pouch modal/semantic item commands, pure session Log, status/focus guards and accepted-action sequencing |
| Data/schema | Versioned item registry/guards/effects/explicit cursor/validator and separate visual catalog; exact references/locale/rights checked |
| Save/checkpoint | New reviewed format with inventory/memory/completion/checkpoint, deterministic migration and retry; no sidecar bypass or UI-state fields |
| Ending | Same HOME/NEARBY/DAWN resolver; held vs memory default nuances; Grand Keepsake after HOME only |
| Runtime dependency | Vanilla baseline retained in S4; spike library remains development-only until future S5 decision |
| Assets | S4 original 2D item/icon/texture art; models/source photos unchanged and outside S4 distributable |

Recommended candidate versions: content **3.0.0**, narrative/package/affected shared schemas **2.0.0**, saveFormat **2**. Exact numbering ratified by Architect at T0/T3. Published1.0/1.1/1.2/root common/save contracts remain byte-identical; add versioned schema/catalog/capability fixtures instead. Unknown fields/versions/capacity/IDs fail safely, not silently emptying inventory.

Alternative format 1 + separate inventory LocalStorage sidecar is not recommended: one story decision could tear across saves, Retry lacks a consistent checkpoint, raw recovery races become ambiguous. Smuggling items into irreversible legacy flags/current history/setting strings is rejected. A versioned envelope integrates all domain facts with existing guarded save port.

## 6. Migration, security and rollback

Existing 2.0→2.1 migration rejects gameplay/prose differences; do not expand its comparison exclusions to pretend this pivot is presentation-only. Register explicit format 1/content 2.1→format 2/content 3.0 semantic mapping after old validation; legacy2.0 uses its existing first step then the new step, validating each. Map active payload/checkpoint independently from their own flags. True historical leaf→held/acquired leaf under legacy no-discard semantics; false→no held leaf. New items/secrets are never retroactively awarded. Preserve legacy flags, metrics/RNG/revision/settings/history; exact semantic page/variant mapping required for rewritten lines.

Where no approved cursor mapping exists, protect raw saves and offer implemented/tested compatible continuation or explicitly confirmed new-session recovery. No guessed downgrade/fast-forward/replay/completed secret. Migrations are pure/idempotent; writes happen only through normal staged/backup/promotion guards, with quota/unavailable/integrity/concurrent-candidate protection. Retry restores inventory/memory/vignettes from checkpoint. Save candidate remains≤250KB UTF-8.

Same-origin static 2D art, strict JSON/IDs/paths/hashes/rights and safe DOM; no executable expressions, external services/player uploads/telemetry/secret keys. Held item metadata is story data, not personal data. Local reference photos/BLEND/generators/spike node_modules remain excluded from release.

Planning rollback reverts this documentation revision only. Later runtime rollback retains format 2-compatible admission/migration/write guard or disables older writes; never lets format 1 code overwrite new candidates. Do not repair an inventory fault by saving an empty bag. Visual/Log rollback cannot undo an accepted item decision; compatible state remains authoritative.

## 7. Verification, budgets and rollout

[SSOT §6](../sprints/sprint-04-ssot.md#6-verification-plan-and-evidence-status) defines proposed evidence. Current unchanged-runtime run **691/691**, zero fail/cancel/skip/todo. Legacy fixtures/12 routes stay as historical witnesses; newly reviewed narrative/graph assertions are additional and separately versioned. Approved behavioral expectation changes need trace/legacy coverage, never skipped/weakened assertions.

Required Pouch cases: empty/partial/full at3 and boundary4 if selected, refusal/cancel/atomic replace, duplicate/stale/unknown ID, single-opportunity revisit, safe-context permission, held-vs-memory callbacks, no-item Canon route, vignette acknowledge/reload/retry, save migration/full checkpoints/quota/race and rollback protection. Remaining manual Thai/visual/keyboard/AT/device reviews stay explicit. New validators/Pouch code/features are not materialized in this revision.

NFR-PE-001..005 unchanged: initial≤2MB compressed; shell+critical JSON≤500KB compressed; cold≤3s/warm≤1.5s p75; feedback/general interaction≤100ms p95; save≤250KB. Bound item/memory/vignette IDs by registry; Log capacity50 dialogues+50 actions. Existing image/audio caps32/16MiB retained. **No S4 3D budget/decoder/vendor scope**; future Grand Keepsake budgets measured under S5 approval.

Rollout: T0 accepted detailed contracts → T1 styles → T2 renderer → T3 versioned Pouch/save contract → T4 pure state → T5 Pouch UI → T6 Log → T7 Act 1 content → T8 Act 2–5 map → T9 tags/assets projection → T10 composition → T11 integrated/manual acceptance. Narrative design drafts may proceed before source-contract readiness. Gate A visual, Gate B Pouch+save, Gate C narrative/map, Gate D integrated QA; no source/merge/deploy authorized in this round.

## 8. Approval and supersession register

| Item | Disposition |
|---|---|
| PO vision/pouch3–4/AI authorship/S4–S5/Grand Keepsake placement | **Explicit direction received** from current PO Directive, recorded in revised plan |
| Exact default 3, item registry/guards, final narrative graph/prose, version/migration/callback edits | Proposed implementation detail; domain owners review T0/T3/T7 |
| Session Log reload policy/profile/manual schedule | Pending detailed review, not a blocker to preparing the requested documents |
| ADR-P0-014/015 baseline | Retained; new inventory/save/cursor ADR required before code; approved deviations documented prospectively |
| ADR-P0-016/017 spike | Retained historically; production3D consideration deferred to S5 |
| S4 source DoR/WBS | Unstarted **0/12**, not authorized by document revision/commit |
| Merge/release/deployment | Not requested or performed |

v0.2.0 supersedes v0.1.0 proposed Act 1 viewer and save-no-change design, not accepted baseline history. No new requirement/canon/ADR is self-approved. Final plan is concrete for PO review without asking PO to repeat the strategy already given.
