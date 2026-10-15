# CR-0005: Sprint 4 Visual, Narrative & Adventure Keepsake Overhaul

| Control | Value |
|---|---|
| Version / date | **0.2.3** / 2026-10-16, Asia/Bangkok: Slice3 T6 and PO D3 ratification |
| Status | **PlanningPR12/Slice1PR13/Slice2PR14 merged; T6 source/evidence delivered for PO review;7/12 tasks delivered;T7–T11 and final human gates open** |
| Author | Codex / Senior Technical Lead, Game Director, Principal UI/UX Architect |
| Scope | S4 UI/Log/durable Pouch/Act 1 rewrite + Secret Moments/Act 2–5 map; S5 content/three endings/Grand Keepsake |
| Change class | C2 branch/choice/presentation; C3 inventory/save/checkpoint/content contract compatibility |
| Sources | [Proposal v0.2.1](../proposals/sprint-04-overhaul/01-proposal-plan.md), [revised SSOT](../sprints/sprint-04-ssot.md), [Sprint 3](../sprints/sprint-03-ssot.md) |
| Review | PR12/13/14 merged; current `feat/sprint-04-slice-03-log` → develop; actual PR linked in [Slice3 audit](../changelog/2026-10/2026-10-16-0142-sprint-04-slice-03-history.md) after creation |

## 1. Authority, context and revision

Current PO Directive explicitly replaces adventure-time doll inspection with an **Adventure Keepsake Pouch**, limited to **4 physical objects (ratified in ADR-P0-020)** with Secret Moments and Ending Nuances; assigns AI to rewrite/refine tender narrative; retains three endings/simple branches/no combat or complicated added stats; divides S4/S5 scope; and requests document updates plus commit before source work.

This supersedes v0.1.0's non-diegetic Act 1 two-doll viewer, presentation-only save plan and optional narrow editorial approach. Those directions are historical, not alternative current S4 requirements. The new vision and writing assignment are already issued by PO; they do not require reconfirmation. Four slots and the Slice2 state/save/UI contracts are now ratified by ADR-P0-020 and the current PO directive. Expanded narrative/secret schemas, approved prose and content3 integration still need their owning task review/DoR.

Baseline inspected: develop `e9803397587bb3ec8f2a61a87966d382277a96fc`, with [PR #11](https://github.com/T3thr/JaoKob/pull/11) merged 2026-10-14; planning branch `9a08d0b` includes it. Spike models remain isolated artifacts; accepted ADR-P0-016/017 do not approve a production viewer. Sprint 3 remains functional baseline with 691 tests and historical Chromium evidence; final visual/manual gates stay open.

### 1.1 Final PO endorsement — v0.2.1

PO explicitly endorses v0.2.0 main directions after reviewing structure/tree/Sprint plan and issues the final narrative refinement before approving documentation merge. Record: [Final PO approval](../changelog/2026-10/2026-10-14-2233-sprint-04-final-po-narrative-impact.md). Endorsement covers five-act philosophy, mother/root/current continuity, fair three-ending Bond system, increased Act3–4 drama, meaningful held/released/absent Pouch use, childhood-crochet→adult-blue-shirt/red-heart Grand Keepsake and the girl's reserved practical kindness.

This is actual human direction/endorsement, not author self-approval. It does not claim sample prose is final Canon, new schemas/GLBs/implementation tests exist or a merge has occurred. Exact task fixtures/contracts/accepted editorial/assets remain implementation gates; the approved strategy is not sent back for reconfirmation.

## 2. Goals, boundary and protected Canon

S4 delivers paper reading card/frosted capsule HUD/Intent Tags, session Dialogue History, Pouch UI+pure durable state, revised Act 1 prose/choices/items/optional vignettes and a reviewed Act 2–5 map for S5. Visual benchmark starts Scene 1–3; writing/item gameplay covers all seven Act 1 scenes. S5 implements Act 2–5 and the existing three ending categories, including Grand Keepsake after END-HOME.

No combat engine, XP/levels/equipment/rarity/crafting/currency/item power/weight optimization. HP/พลังใจ/Bond remain the three simple narrative signals and existing resolver inputs; removal/threshold redesign is not inferred from “cut complicated stats”. No fourth or premium ending; no complete-all-items gate for Canon. Tadpole/life stage, storm without player blame, later girl/Bond reveal, agency/consent and symbolic transformation exclusively in END-HOME remain controlling rules.

S4 non-goals: production Act 2–5/ending code, model viewer/WebGL/vendor/model promotion, persistent exact dialogue transcript, typewriter/auto-advance/voice/TTS, all-seven-scene art production, Login/backend/telemetry/CDN/deployment. AI narrative drafting is in scope; final reviewed prose cannot be replaced by a decision to keep all old text merely for easier tests.

## 3. Updated D1–D7 decision register

| Decision | PO-issued direction | Recommended detailed design / alternatives | Status and review owner |
|---|---|---|---|
| **D1 — Phased scope and capacity** | S4 UI/Log/Pouch/Act 1/Act 2–5 map; S5 Act 2–5; fixed capacity4 | **Four fixed unique slots** ratified by PO/Lead Architecture in ADR-P0-020; no stacks or upgrade. Twelve WBS tasks, revised effort/gates | Four slots ratified; T0/T3/T4/T5 implemented under current directive, owner review open |
| **D2 — Narrative authorship and simplicity** | AI assigned tender Act1 plus slower Act3–4 threat/consequence/rest, mother/root/current, reserved girl, fair three endings; no combat/complex stats/achievement hunting | Concrete sensory actions/quiet kindness, 2–3 choices, short optional moments with convergence; exact prose/IDs/effects/guards reviewed as authored scene diff | PO endorses assignment and final drama/persona principles; exact scene prose/guards reviewed in T7/T8 |
| **D3 — Dialogue History** | Build Dialogue History in S4; current PO directive ratifies session-only memory and reload note | Retain50 latest dialogue occurrences+50 committed actions independently; action before displayed response; exact visible prefixes, repeated visits, New Game reset and current-page reload note; Save2 unchanged | T6 implemented under [contract](../design-system/session-history-contract.md); source/evidence ready for PO/Thai/AT review. Cross-reload transcript remains a separate versioned design |
| **D4 — Objects, memory and extra scenes** | Adventure objects actively looked at/held/remembered during loneliness; valued keeping/release, Secret Moments and Ending Nuances | `heldItemIds` vs acquired/released memory; authored atomic replace/cancel; optional secret eligibility; held props vs memory-only variants; no item required for Canon | PO endorses meaningful use/keeping/letting-go; exact held/memory/default/registry/effect consistency reviewed per task |
| **D5 — Core/save/schema compatibility** | Pouch has gameplay state; content changes in Act 1 | Proposed package/shared/tree schema 2.0, content 3.0, saveFormatVersion 2; pure item/condition/effect/cursor contracts, inventory in checkpoint, explicit legacy migration. Format1 sidecar alternative risks torn state/retry inconsistency | Main versioned Pouch direction endorsed; exact published schema/cursor/migration fixtures require Architect+QA verification; no S4 library exception |
| **D6 — END-HOME Grand Keepsake** | Childhood crochet→adult velour, blue T-shirt/red-heart embroidery, real-gift resonance in Act5 END-HOME | S4 brief only; S5 epilogue reveal/edition framing, static fallback and optional post-ending inspection. Future production dependency/rights/device contract separate | PO endorses END-HOME placement, childhood→adult bridge and red-heart blue-shirt brief; current adult mesh lacks heart, S5 Art/export/runtime gates remain |
| **D7 — Quality and phased execution** | Review revised plan before code; prepare S5 handoff | Separate legacy/new graph suites; capacity/release/secret/no-item/migration/retry/fault tests, manual art/Thai/AT/device review, per-phase gates | PO endorses final narrative/fairness acceptance; exact evidence/device/fixture gates remain; Slice1/2 merged and T6 delivered (7/12); remaining source/manual gates open |

The table records actual direction without marking the entire RFC or any new FR/ADR Approved. Architectural choices become a new ADR after owner acceptance; no historical ADR rationale is rewritten. T0 handles GDD/SRS/Narrative contract amendments before code, rather than reading proposal strings as new executable authority.

## 4. Proposed design and alternatives

### 4.1 Presentation and History

Preserve semantic DOM RendererPort, safe localized immutable VM, Title→Reading→Decision presentation modes, actual three Scene 3 directions, locked no-number Bond and accessible notice/save/feedback/busy behavior. HUD glass must retain contrast fallback; Pouch/Log are one active overlay outside domain states. Viewing closes/restores focus without story commit. History records accepted action then successfully displayed response, never preload/unseen/rejected/confirmation selection.

Session transcript keeps original payload.history/viewed-ID meanings, count/byte bounds and New Game/reset/reload policy from proposal §5. It does not persist as a transcript; durable Pouch and checkpoint fields **do** persist. Modal keyboard/inertness/async focus behavior is verified separately from pure reducers.

### 4.2 Pouch and atomic capacity decisions

Pure domain inventory has fixed4 slots, unique held IDs and bounded encountered/acquired/released memories plus acknowledged optional-vignette progress. Core receives validated normalized catalog and injected command identity/time, imports no browser/Data/UI. Data parses/validates/localizes; bootstrap composes and persists; UI sends intents.

Acquire/release/replace applies only at authored safe opportunities. Full Pouch gives keep-old/refuse-new, replace-one or cancel. No auto-drop, negative-stat penalty, repeat pickup farming or timer. Replace is one guarded transaction/revision containing release+acquire, or no change. Retry restores Pouch/memory/completion along with checkpoint; settings remain latest. Opening/selecting item details changes only UI state; confirmed item decisions are gameplay changes and are logged.

Historical leaf flag remains irreversible “chose to keep”. New held membership authorizes physical prop/share; acquired/released memory authorizes remembered imagery. Do not clear `keepsake.lily_fragment` or reuse `coping.let_go_early` for late release. Update GDD-DEC-A5-001-B/NAR-CON-002/callback conditions with reviewed held-state conjunct/default before implementing, so a discarded leaf never appears physically.

### 4.3 Optional vignettes and simple branching

Item/remembered/released/completed-vignette predicates are explicit strict content DSL/data, with fixed entry/convergence and no executable content. 2–3 short Act 1 moments are proposed, typically 2–4 manual beats. Current props/remembered versions/defaults are distinct; secret scene acknowledgement persists only after completion. Refusal/empty-Pouch route remains narratively complete and has future Canon path.

Act 2–5 draft map grounds major branches in Bible scene IDs: reeds/drain converge by A3-003; city survival is observation/patience/shelter; trust unfolds at A4-004 through repeated safe acts; A5 preserves consent/repair/resolver. Nuances decorate three existing endings without altering their categories/conditions. S4 map is design, not runtime capability or a claim the later acts exist.

### 4.4 Content placement and future Grand Keepsake

Act 1 candidate objects: leaf fragment, dew stone, lotus shell, rain petal; full capacity/release can be tested at a late safe rest. Red yarn is a proposed Act 2/3 object to preserve A2-006 first-human-material continuity. AI may draft alternatives under assignment; exact scene placement and final IDs are reviewed before content integration.

Models move entirely to Act 5 END-HOME/S5, after symbolic transformation and existing consent gate. Both editions are one Canon ending's Grand Keepsake representations, not extra endings or carried dolls. No viewer port/vendor/GLB request/runtime dependency is part of S4. Future use of pinned spike model-viewer requires new production RFC/ADR, same-origin resources, poster fallback, rights and device checks; placing models in the roadmap does not adopt that library now.

### 4.5 Final emotional/pouch/persona contract

Act3–4 map slows each concrete wheel/heat/hurried-foot/discarded-object encounter into cue→choice→accepted HP/พลังใจ consequence→body/inner response→agency/rest→observation, with high/low/default/Story Assist variants. Drama cannot create a new forced damage tax, combat, hidden courage/suffering score or achievement. Preserve GDD-BAL-001..004/007/008 and decompression under GDD-SAFE-005/NAR-TONE-001. Express vulnerability through a small body, interrupted breath/guarded posture and deliberate safe action; choosing rest is bravery too. Avoid graphic collision/wounds and any assertion that all humans are cruel.

Leaf/dew stone/lotus shell/rain petal/red yarn each have a held action, a remembered released variant and a never-acquired default in [proposal §§7.4–7.8](../proposals/sprint-04-overhaul/01-proposal-plan.md#74-act-34-emotional-depth-pacing-and-metric-consequence). No released prop is shown physically; memory comforts without automatically awarding HP/พลังใจ/Bond, and the same viable recovery/trust path exists without an item.

Bond remains original thresholds/order/consent/repair. For equal accepted metrics/trust flags, item/secret/strain/accessibility presentation variants yield the same ending ID; nuances stay within HOME/NEARBY/DAWN. No collection-based love ranking or penalty for cautious boundaries; preserve compensating trust opportunity/budget. The girl's unchanged persona is water, warm cloth, open return route, step back and waiting; no personal lore/name/romantic exposition/rescue monologue or narrated inner intention. Mother teachings remain memory, never a ghost or confirmed family death.

Grand Keepsake appears only after END-HOME safe-help/symbolic transformation. Living tadpole→frog remains literal in Acts1–4; childhood yarn form is an epilogue memory representation, then adult velour/blue shirt/red-heart stitch and discreet real-gift closing narration. The same full emotional HOME closure/heart motif exists for empty/released Pouch and eligible non-max-Bond/Story Assist paths. Existing adult render has plain blue shirt: record S5 red-heart embroidery art/export/validation work, not completion or a GLB change now. No fourth ending or new girl's biography is created.

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

Recommended candidate versions: content **3.0.0**, narrative/package/affected shared schemas **2.0.0**, saveFormat **2**. Slice2 ratifies pouch/save2.0 and SaveFormat2 under ADR-P0-020 while retaining content2.1; the package/tree/content3 rewrite remains a later owner gate. Published1.0/1.1/1.2/root common/save contracts remain byte-identical; add versioned schema/catalog/capability fixtures instead. Unknown fields/versions/capacity/IDs fail safely, not silently emptying inventory.

Alternative format 1 + separate inventory LocalStorage sidecar is not recommended: one story decision could tear across saves, Retry lacks a consistent checkpoint, raw recovery races become ambiguous. Smuggling items into irreversible legacy flags/current history/setting strings is rejected. A versioned envelope integrates all domain facts with existing guarded save port.

## 6. Migration, security and rollback

Existing 2.0→2.1 migration rejects gameplay/prose differences; do not expand its comparison exclusions to pretend this pivot is presentation-only. Slice2 registers explicit format1/content2.1→format2/content2.1 mapping after old validation; rewritten content3 semantic mapping remains T7/T9/T10; legacy2.0 uses its existing first step then the new step, validating each. Map active payload/checkpoint independently from their own flags. True historical leaf→held/acquired leaf under legacy no-discard semantics; false→no held leaf. New items/secrets are never retroactively awarded. Preserve legacy flags, metrics/RNG/revision/settings/history; exact semantic page/variant mapping required for rewritten lines.

Where no approved cursor mapping exists, protect raw saves and offer implemented/tested compatible continuation or explicitly confirmed new-session recovery. No guessed downgrade/fast-forward/replay/completed secret. Migrations are pure/idempotent; writes happen only through normal staged/backup/promotion guards, with quota/unavailable/integrity/concurrent-candidate protection. Retry restores inventory/memory/vignettes from checkpoint. Save candidate remains≤250KB UTF-8.

Same-origin static 2D art, strict JSON/IDs/paths/hashes/rights and safe DOM; no executable expressions, external services/player uploads/telemetry/secret keys. Held item metadata is story data, not personal data. Local reference photos/BLEND/generators/spike node_modules remain excluded from release.

Planning rollback reverts this documentation revision only. Later runtime rollback retains format 2-compatible admission/migration/write guard or disables older writes; never lets format 1 code overwrite new candidates. Do not repair an inventory fault by saving an empty bag. Visual/Log rollback cannot undo an accepted item decision; compatible state remains authoritative.

## 7. Verification, budgets and rollout

[SSOT §6](../sprints/sprint-04-ssot.md#6-verification-plan-and-evidence-status) defines proposed evidence. Current unchanged-runtime run **691/691**, zero fail/cancel/skip/todo. Legacy fixtures/12 routes stay as historical witnesses; newly reviewed narrative/graph assertions are additional and separately versioned. Approved behavioral expectation changes need trace/legacy coverage, never skipped/weakened assertions.

Required Pouch cases: empty/partial/full at fixed4, refusal/cancel/atomic replace, duplicate/stale/unknown ID, single-opportunity revisit, safe-context permission, held-vs-memory callbacks, no-item Canon route, vignette acknowledge/reload/retry, save migration/full checkpoints/quota/race and rollback protection. Remaining manual Thai/visual/keyboard/AT/device reviews stay explicit. Slice2 materializes Pouch/save/schema and modal/browser automation; new-story/vignette automation remains later work. See [Slice2 contract](../design-system/keepsake-pouch-contract.md) and [evidence](../../tests/e2e/evidence/sprint-04/slice-02/README.md):874 total unit cases,13 metaschemas/47 new cases,12 legacy routes,34 Pouch captures pass; domain100% lines/branches/functions. Manual PO/device/AT gates remain open.

NFR-PE-001..005 unchanged: initial≤2MB compressed; shell+critical JSON≤500KB compressed; cold≤3s/warm≤1.5s p75; feedback/general interaction≤100ms p95; save≤250KB. Bound item/memory/vignette IDs by registry; Log capacity50 dialogues+50 actions. Existing image/audio caps32/16MiB retained. **No S4 3D budget/decoder/vendor scope**; future Grand Keepsake budgets measured under S5 approval.

Rollout: T0 accepted detailed contracts → T1 styles → T2 renderer → T3 versioned Pouch/save contract → T4 pure state → T5 Pouch UI → T6 Log → T7 Act 1 content → T8 Act 2–5 map → T9 tags/assets projection → T10 composition → T11 integrated/manual acceptance. Narrative design drafts may proceed before source-contract readiness. Gate A visual, Gate B Pouch+save, Gate C narrative/map, Gate D integrated QA. The current directive authorizes Slice2 source/commit/push/PR; merge/release/deploy remains human-controlled.

## 8. Approval and supersession register

| Item | Disposition |
|---|---|
| Main v0.2.0 strategy / Final v0.2.1 narrative principles | **Explicit PO endorsement received** in current message; final drama/Pouch/gift/fair Bond/girl constraints recorded and ready for documentation review |
| Four slots and Slice2 state/save/UI | Ratified ADR-P0-020; implemented T0/T3/T4/T5 for PR14; unchanged2.1 content/cursor and reviewed leaf only |
| Expanded item/secret registry, final prose/graph/content3 mapping and future callbacks | T7/T9/T10 owner review; [baseline handoff](../proposals/sprint-04-overhaul/04-pouch-baseline-amendments.md) |
| Session Log reload policy/profile/manual schedule | D3 ratified by current PO directive; T6 session-only/displayed-prefix/native-modal evidence delivered. Real-device/AT/manual schedule remains open |
| ADR-P0-014/015 baseline | Retained; accepted ADR-P0-020 ratifies Slice2 Pouch/Save2 prospectively; future rewritten cursor contracts remain reviewed separately |
| ADR-P0-016/017 spike | Retained historically; production3D consideration deferred to S5 |
| S4 source DoR/WBS | **7/12 source tasks delivered**; T1/T2 mergedPR13, T0/T3/T4/T5 mergedPR14, T6 feature review; T7–T11/final human acceptance open |
| Documentation merge | PlanningPR12 merged by PO; history retained |
| Source/release/deployment | Slice2 source/commit/push/PR explicitly authorized; no Slice2 merge/release/deploy |

v0.2.1 supplements the PO-endorsed v0.2.0 plan with final narrative/Pouch impact acceptance; v0.2.0 supersedes v0.1.0 proposed viewer/save-no-change design. Neither rewrites accepted baseline history. No new requirement/canon/ADR is self-approved. Final plan is concrete for PO review without asking PO to repeat the strategy already given.

Slice2 amendment v0.2.2 is governed by the 2026-10-16 PO directive and ADR-P0-020. It publishes pouch/save schema2.0 and format2 while retaining content2.1; package/tree2.0/content3 remain future contracts. The previous planning rollback paragraph is historical: current runtime rollback must retain Save2 admission/downgrade protection or disable writes, preserving raw legacy backup. No new Canon is self-approved.

Slice3 amendment v0.2.3 records current PO authorization of T6 and D3. The [contract](../design-system/session-history-contract.md) precedes source; [audit](../changelog/2026-10/2026-10-16-0142-sprint-04-slice-03-history.md) and [evidence](../../tests/e2e/evidence/sprint-04/slice-03/README.md) trace pure50+50 history, displayed-prefix receipts, accepted ordering, Thai projection, native modal, lifecycle and zero view-only storage/audio changes.935 unit cases and12 original routes pass. T6 rollback reverts ephemeral UI/history with no migration; preserve the existing Save2 baseline. This amendment does not approve merge/deployment, final human aesthetics or broader FR-UI-004 features.
