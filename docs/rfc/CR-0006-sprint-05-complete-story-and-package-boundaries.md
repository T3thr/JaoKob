# CR-0006: Complete Story Execution and Protected Story Package Boundaries

| Control | Value |
|---|---|
| Version / date | 0.1.0 / 2026-10-17, Asia/Bangkok |
| Status | **Proposed for review; no runtime implementation or new Accepted ADR in this change** |
| Classification | C2 cross-layer; C3 where package/save/schema contracts change |
| Authority | PO requests Sprint5 planning, five-act closure, existing three endings, immutable Default Core Package and Sprint6 editor readiness |
| Owners | Senior Software Architect, Lead Narrative Director, Principal Game Designer, Data/UI/Art/QA; PO accepts scope |
| Execution source | [Sprint 5 SSOT](../sprints/sprint-05-ssot.md) |
| Evidence | [Readiness assessment](../proposals/sprint-05-planning/01-readiness-assessment.md), [baseline verification](../proposals/sprint-05-planning/evidence/planning-verification.json) |

## 1. Problem and goals

Sprint4 delivers a verified Act1 vertical slice and later-act design. The production capability gate rejects act>1 and ending nodes; orchestration still requires positive HP/พลังใจ and Bond0, while state/transaction primitives already describe later crisis/ending behavior. A new JSON act alone cannot enable a full game. Save2 has one retry checkpoint but no explicit collection of captured chapter replay snapshots. Session selection and media references use contentVersion without a distinct story identity.

The goal is to implement existing full-story requirements, retain exact compatible saves, produce closure under ADR-P0-021, and make the runtime able to identify protected canonical content independently of future authored episodes. The current user already mandates that core protection. This RFC requests decisions on the mechanism and uncovered details, not renewed permission for that direction.

Non-goals: implement the Sprint6 Editor, user-authored imports, slot selector/storage, cross-package narrative links or hot swapping, backend/cloud save, new endings, broadened runtime dependency policy, retrospective rewriting of Accepted ADR rationale. All options below are proposals until the relevant owner records a decision.

## 2. D1: Logical packages, catalog composition and immutable core

| Option | Consequence | Recommendation |
|---|---|---|
| Continue a global contentVersion-only map | Two stories at version1.0 collide; no independent default protection; future storage/media keys ambiguous | Reject for future package boundary |
| One logical core identity with versioned manifest and act components, normalized to one validated catalog | Fits five-act story; separates authoring file layout from playable session; explicit protection and bounded capability review | **Recommended** |
| Independent game session/save per act | Breaks continuity of pouch/flags/checkpoints and makes Acts look like Story Slots | Reject for canonical campaign |
| General plugin engine with arbitrary dependencies/import code | Unnecessary capability, supply-chain and privacy expansion | Out of scope |

Proposed descriptor fields are `packageId`, `contentVersion`, `schemaVersion`, entry reference, component references/digests, locale and supported capability declaration. Exact JSON shape, registered IDs and size bounds belong to S1. Proposed reserved ID is `story.jaokob.core`. Content IDs retain their published meaning; custom packages use a separate namespace and cannot shadow canonical nodes/flags/assets. Optional presentation metadata cannot supply predicates/effects.

Data validates component schemas, all cross-references and capability compatibility before producing an immutable normalized catalog. Core sees a complete catalog for the active story, not filesystem paths or an editable registry. One logical package may be authored across several act files. For S5 prefer complete bounded story-data validation before activation, with media loaded on demand; if full-game data fails critical-load budget, revise the explicit loading contract before enabling partial graph activation. A failed dependency must not leave a playable half-catalog or dangling future edge.

Default descriptor comes from the reviewed static artifact. Future custom registration cannot overwrite, delete, patch, replace or win precedence over it, even when input claims `readOnly:false` or the same package/version. The allowlist of trusted canonical identity is host-owned, not content-owned. Extension failure leaves canonical New Game available. A missing/corrupt core produces a recovery-safe shell; it does not silently select a custom story as canonical.

Freeze every published package version with its manifest and keep exact archives. New canonical releases are reviewable versions, not edits through the browser Editor. S6 can offer “create a separate copy” with a new identity and origin reference; that copy has no write path to the original. This is application protection, not a claim to prevent the owner of a device/server from editing files. Keep a canonical copy bundled, not solely in evictable browser storage.

S5 proof: inject a second harmless test package at the same contentVersion; verify independent identity/entry/flags/cache/save admission, reserved-ID and duplicate rejection, failed component/hash/reference handling, readonly core operations and no runtime import of fixture code. Do not ship a custom-story authoring UI just to demonstrate this seam.

## 3. D2: Versions, saved cursors and actual replay

**Recommendation:** new SaveFormatVersion3 only after approval of identity/replay fields; a separately versioned schema for new content/manifest contracts. Do not edit published root/schema2 definitions. Numeric save format, semantic content version and schema version are separate axes.

An exact identity tuple must follow catalog → orchestrator → localized projection → media resolver/cache → save/checkpoint/replay admission. Check package and version before comparing revisions or granting write permission. Integrity digests detect unexpected bytes and support compatibility proof; they do not authenticate the person controlling LocalStorage.

| Migration / compatibility boundary | Required evidence |
|---|---|
| Save1/content2.0 → proved2.1 → Save2/2.1 | Existing sequential transforms and exact archive retained; no direct jump to rewritten story |
| Save2/content3 → Save3 carrying the **same** story version | Pure envelope transformation if approved; preserves all active/checkpoint facts, creates no chapter memories that never happened; backup source bytes |
| content3 completed Act1 → new full-game package | Separate reviewed semantic bridge at acknowledged A1-007 completion; source/target digests, independent payload/checkpoint mapping, later flags set only to defaults, no on-enter replay/new item awards |
| content3 mid-beat/choice/moment | Exact archive continuation until an approved equivalent boundary; no nearest-node or dialogue-index guess |
| Interim S5 package version → next promoted version | Exact archive or explicitly proved continuation for that pair; previous manifest never mutates |
| Unknown format/version/package, corrupt record or incompatible checkpoint | Preserve raw slots; reject with typed outcome; compatible recovery or memory-only play; explicit reset consent remains |

Preferred format3 design keeps canonical/staging/backup/settings ownership with the existing adapter and current one-active-session UX. Reserve identity in the envelope, not arbitrary content strings in LocalStorage keys. Story Slots in S6 need their own storage/RFC decision; S5 does not introduce unreviewed key derivation or IndexedDB.

Replay requires actual pre-Act4 and pre-Act5 snapshots, bounded to registered replay points. Store all necessary causal facts: tree/node/state, metrics, flags, occurrences, pouch, RNG and package identity. Define separate policy for current-timeline progress versus historically read content/ending completion. Never build replay from endgame values or let historical viewed IDs grant an item/secret in the restored timeline. Latest validated settings stay outside rollback. Session History remains an ephemeral50+50 log, never the save-state authority.

Once-only repair is causal progress, not a UI toggle. Resume cannot offer it twice after decline; replay/retry may revisit it only with the corresponding restored earlier state, so its +20 cannot accumulate on a later state. Record ending completion once per accepted resolution; loading, opening gift media or double input cannot append a second result.

Alternatives: keeping Save2 unchanged is acceptable only if S1 proves all required chapter replay/package identity semantics fit the published contract without overloading flags/history or synthesizing snapshots. Maintaining archives forever without a usable Act1-complete continuation does not fulfill the S5 continuation task. A single latest checkpoint is insufficient for both required Act4 and Act5 replay targets.

## 4. D3: Narrative and mechanics details needing reconciliation

Accepted invariants remain: four held slots, three ending IDs/order/thresholds, no pre-A4-004 Bond, no item-exclusive HOME/recovery, mother/sibling fate unconfirmed, separate living frog and gift mirrors. The following are explicit authoring decisions before production IDs/effects are minted:

| Gap | Proposed disposition | Required owner |
|---|---|---|
| Old literal-transformation wording in GDD/Narrative | Amend forward-facing baseline text to ADR-P0-021 D6; preserve its original decision record and three-ending rules | Narrative/PO |
| Sprint2 recorded unresolved Act2 Bond wording vs NAR-CON-005 | Keep the explicit A4-004 gate and Bond0 earlier; publish exact amended wording so S5 has no conflicting instruction | Game Design/Narrative |
| Map recovery `draft.recovery.a3.cool-edge` and `listen-rest` | Review proposed+10HP/+10พลังใจ, guards and once-only event IDs against full-game reachable states; preserve HP>20 food-wait guard with visible earlier recovery | Game Design/QA |
| Self-reliant C choices | Preserve ADR21's Bond0 alternative and all existing A/B effects; ratify exact IDs, compassion/route flags, guards and feedback before content | Narrative/Game Design |
| Physical leaf-sharing | Require acquired historical flag plus held membership; decide whether this authored use releases the leaf and test the actual consequence atomically; no invented new `use` operation in JSON | Narrative/Game Design/Architect |
| Held/released/refused/unseen and competing variants | Keep actual fact distinctions and approved priority; explicitly mutually exclusive top voiced variants or reviewed stable tie-break; don't remove ambiguity guard blindly | Narrative/Data |
| Narrative tier70 in handoff vs GDD HUD tiers80/60/30 | Treat descriptive selection separately from authoritative HUD labels; ratify ranges or align them explicitly; never change label thresholds by accident | Game Design/Narrative |
| “Close every thread” vs unconfirmed family fate | Close the protagonist's relationship to memory through action; no death/reunion/backstory invented to force an answer | Existing NAR-CAN-002 / ADR21; Narrative checks prose |

The core `item_lotus_shell` label and the river shell are distinct published items; do not rename or conflate them based on an English gloss. Red yarn remains a sixth registered item encountered only at A2-006 on both routes, not a sixth slot or proof it belonged to the girl. Expected examples are in SSOT §2, all draft prose remains subject to editorial acceptance.

## 5. D4: Grand Keepsake production and fallback

**Recommended candidate:** the spike's model-viewer approach, isolated behind UI composition and reviewed anew for production. ADR-P0-016 accepted pinned4.4.0 for the spike only; this RFC does not install/update/approve that version in the game. Confirm maintenance/license/security, packaged dependencies, lifecycle support and bytes when choosing the production pin. Do not use CDN delivery or data-directed imports.

S8 first fixes adult red-heart embroidery and delivers accepted2D posters plus validated self-contained models. S9 enables the viewer after HOME's complete living-frog ending and explicit opt-in. Images/text always convey the complete gift; deliberate opt-in is required before vendor/GLB fetch, not merely before hiding a poster. Reviewer checks actual network trace.

Approve budgets from real exports before S9: per-model bytes/triangles/textures and decoded/GPU envelope, viewer transfer, maximum live models/cache, startup deadline/fallback behavior and measured frame response on supported devices. Use existing spike limits only as starting proposals; do not claim production performance from desktop spike evidence. Recommended starting limits: one active model, self-contained GLB≤2MB and≤25,000triangles per model, no auto-spin; final optional transfer/GPU limits remain a D4 gate. Initial-game2MB/500KB budgets are unchanged.

Failures must keep the matched poster, localized description, close/back/retry controls and completed story. Verify close-before-import, switch-before-model-ready, stale callback, decode/hash/network error, WebGL/context loss, reduced motion, audio independence, repeated open/close resource plateau, focus return and actual touch/keyboard/AT. Closing a custom element is not by itself proof GPU resources were released.

Alternative2D-only release would preserve story access but does **not** silently satisfy the planned Grand Keepsake3D task. If approved device/performance/dependency evidence cannot be established, present that scoped release decision to PO with the complete fallback already reviewable.

## 6. D5/D6: Player feedback and honest release scope

D5 keeps ADR-P0-019 active. Player evidence is captured against a build SHA, package/version, logical beat and viewport/input/settings. A bug violating the current contract can be fixed under that authority. Changes to pacing controls, reveal behavior or component contract need the upcoming feedback ADR and updated fixtures; a speculative CSS preference is not a user finding. Independent narrative/art tasks may proceed when their own DoR is satisfied.

D6 addresses inherited gaps before “complete project” is claimed: `FR-UI-004` has a delivered Log but partial skip/pause/speed/typewriter semantics; `FR-SET-001/002` has broader settings than the current application exposes. Recommended plan materializes Story Assist/crisis/replay and approved cutscene controls in S2/S3, retains manual advance, and seeks an explicit baseline disposition for optional/deferred animation controls. No inert controls or removal of assertions is allowed. Target duration2.5–4hours and checkpoints8–15minutes require real reading evidence and an approved revision if the intended crafted story is shorter. A count of scenes or automated clicks cannot certify duration or literary quality.

## 7. Cross-layer impact, validation and rollout

| Boundary | Change / risk | Validation |
|---|---|---|
| Core | Expand supported execution while retaining six states and deterministic policies | full transition table, boundaries, safe paths, counterexamples, old/new catalog fixtures |
| Data/schema | Package registry and policy generalization, published schema immutability | independent validator parity, namespace/capability/reference negatives, bytes/size bounds |
| Persistence | package identity and multiple replay snapshots | pure sequential transforms, all saved cursors, stage/backup faults/races,≤250KB save |
| UI/media | later-life stage, Bond/crisis/ending/replay, protected presentation seam, opt-in viewer | same accepted commands produce same story; keyboard/Thai/reflow/fallback/native-device tests |
| Narrative | Acts2–5, six item callbacks, physical causality, equal endings | complete scripts, zero duplicate authored blocks, human rubric≥4/5 per axis, actual all-ending read-through |
| Security/privacy | untrusted content/save, future packages, vendor and assets | safe text/allowlists, no dynamic content code, no third-party requests/telemetry/private references |
| Release | S4 artifact checker intentionally excludes GLB/vendor and pins old rollback | new version-specific allowlist/digests; keep old checker/evidence meaningful |

Trace: FR-STA-001..006, FR-CNT-001..006, FR-ENG-001..009, FR-UI-001..007, FR-SAV-001..009, FR-SET-001..004, FR-ACC-001..004; NFR-MA-001..006, NFR-RL-001..005, NFR-PE-001..005, NFR-SE-001..006, NFR-PO-001..004; GDD-BAL-001..009, GDD-END-001..006, NAR-BRN-001..004, NAR-END-001/002; ADR-P0-003/014/015/019/020/021. SSOT §4 maps artifacts/owners and §6 maps proposed TC IDs. Published model-spike decisions are references, not authorization to bypass new dependency review.

Rollout: planning PR first; S1 decisions/contracts before source; S2/S3 generic capabilities behind reviewed catalogs; incremental Act2/3/4 package versions with truthful rest boundaries; S7 full story; S8/S9 gifts; S10 qualification/final freeze. Each PR starts from current develop, retains legacy cases, records evidence and requires reviewer acceptance. No merge/deploy is performed by this RFC.

Rollback: docs-only change can be reverted independently. Future runtime rollback must retain readers/write guards for newer saves or disable incompatible writes; retain raw archives/backups, never coerce a future save to a current version. A reviewed downgrade rehearsal includes format3/full-game current records and legacy records across all slots, pending writes and stale consent. No force push, shared-history rewrite, automatic save reset or deletion of canonical story.

## 8. Decision register

| Decision | Current disposition | Recording requirement |
|---|---|---|
| D1 core identity/protection mechanism | Proposed; immutable core direction already mandated | PO/Architect decision, accepted manifest ADR and schema version |
| D2 save/replay/continuation | Proposed | Architect/Data/QA approval of format, field policy and proved migration/rollback |
| D3 authored rules/continuity | Proposed details under existing ADR21 | Narrative/Game Design approved registry and forward baseline amendments |
| D4 production gift/dependency/budgets | Proposed | PO/Art/Architect/QA sign-off; no production dependency before accepted ADR |
| D5 playtest changes | Awaiting actual player findings and later ADR | Evidence-specific decision; no guessed feedback |
| D6 full release gaps/duration | Open | PO/Game Design/QA accepted disposition; no automatic requirement waiver |

The document author is not the final approver. This planning delivery can be reviewed and committed without treating open decisions as implementation approval.
