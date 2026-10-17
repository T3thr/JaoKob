# CR-0006: Complete Story Execution and Protected Story Package Boundaries

| Control | Value |
|---|---|
| Version / date | **0.2.0 / 2026-10-18, Asia/Bangkok** |
| Status | **Revised execution design under Accepted ADR-P0-022; detailed contracts are Slice 1 deliverables, not a new self-approved ADR** |
| Authority | Current PO directive and [ADR-P0-022 D1–D6 / Consequences](../adr/ADR-P0-022-visual-novel-ergonomics-living-keepsake-lore-and-sprint-streamlining.md) |
| Classification | Cross-layer planning for Canon/UI/runtime/schema/save-profile work; no runtime mutation in this PR |
| Owners | Architect, Narrative/Game Design, UI/Accessibility, Data, Art/Audio, QA/DevOps; PO owns acceptance |
| Execution | [SSOT 0.2](../sprints/sprint-05-ssot.md), [remediation contract](../proposals/sprint-05-planning/02-adr022-remediation-contract.md), [trace matrix](../traceability/sprint-05-execution-matrix.md), [Draft PR #18](https://github.com/T3thr/JaoKob/pull/18) |

## 1. Decision update and goals

The previous ten-execution-PR and Save3 proposals are retired. The new binding direction is four value slices, Save Format2, a living childhood/adult keepsake protagonist and a complete VN design-system overhaul. The former wait for future playtest feedback is resolved by ADR22. Do not request those decisions again.

The remaining implementation design must deliver five-act capability, three equal endings, safe persistence/replay, clear readable interaction and a protected default core for S6. Current source still rejects later acts/crisis/nonzero saved Bond; Save2 has no chapter snapshot collection; registry/session identity uses contentVersion alone. These are concrete Slice1 tasks, not already delivered capabilities.

Non-goals: Editor/Story Slots UI or storage, user imports, new endings, Save Format3, backend/login/telemetry, a new runtime dependency without production review, personal recipient data, automatic merge/deploy or retrospective edits to accepted decision rationale.

## 2. Package identity and canonical protection

Retain the recommended one-logical-story approach: proposed `story.jaokob.core`, versioned manifest with schema/capability identity, act component references/digests and explicit entry. Exact fields/limits are recorded in T0/T1. Separate authoring files do not imply independent saves per act. Data validates all story references and supported capabilities into a bounded immutable catalog before activation; media loads on demand.

The bundled default identity is host-owned. Future custom registration cannot delete, patch, replace, shadow or win precedence over it, even when input claims the reserved ID or a read/write flag. Custom IDs occupy their own namespace. Two packages sharing version1.0 must remain isolated in registry/session/cache/media/save admission. Failed extension validation leaves the default available; missing/corrupt core produces an honest safe shell, not a silently substituted story.

The new lore is a reviewed new canonical version. Preserve archived package bytes and published ID meanings; register changed runtime IDs and map design anchors explicitly. Final release freezes the current manifest. Future reviewed releases can add versions, while the S6 Editor has no write path to the original. Browser/device deletion is outside this application-level guarantee; the sole core copy must not live in LocalStorage.

Options retained: one normalized logical core package is recommended; global version-only identity, per-act independent game sessions and arbitrary executable plugins are rejected for this scope. No general import framework is needed to prove the seam with isolated data fixtures.

## 3. Save Format 2 and compatibility

**Selected format direction from ADR22: keep `saveFormatVersion: 2`.** New valid legacy records must remain usable without reset or a compulsory migration. The old proposal to bump to3 is not active.

The [published schema2](../../specs/schemas/v2.0.0/save-state.schema.json) and runtime validator close unknown fields. The [fresh fact probe](../proposals/sprint-05-planning/evidence/save2-current-validator-probe.json) accepts the original fixture and rejects both an added envelope extension and payload snapshots. Keeping the format number alone does not make added fields compatible with old readers.

Recommended design within the accepted direction: a separately versioned, closed **Save-2 extension schema profile**. It preserves existing field meanings and optionally carries a validated profile discriminator, package/manifest binding and bounded actual pre-Act4/pre-Act5 snapshots. T0/T1 fix exact keys/$id/count/byte limits and independent validator fixtures before writer work. The old schema remains byte-identical and continues to validate exact old saves. No `additionalProperties:true`, opaque flag stuffing or separate sidecar store is introduced as a shortcut.

The reader selects an explicit profile/package/version allowlist. A legacy archive cannot claim new replay capabilities; absence of the extension cannot synthesize chapter history. Unknown profile, mismatched manifest, cross-package checkpoint/snapshot, recursive data or oversize payload fails safely. Integrity covers the admitted extension. At most the registered replay points are stored, and the complete serialized record stays≤250KB UTF-8.

| Input / transition | Required handling |
|---|---|
| Save1/content2.0 | Keep the existing proved2.0→2.1 then Save1→2 chain and archive |
| Save1/2 content2.1; Save2 content3 | Exact original story/cursor/checkpoint; read-only Resume; subsequent legacy writes retain compatible profile |
| Old biological Act1 complete → new keepsake lore | No automatic bridge. Preserve old progression; explicit New Game with replacement consent starts the new causal history |
| New core Save2 profile | Exact identity, independent active/checkpoint/replay validation, protected staged writes and actual captured snapshots |
| New-lore version → later new-lore version | Archive or separately proved unchanged semantic boundary; no nearest-node or dialogue-index guess |
| New profile opened by old application | Typed safe refusal and preservation of raw canonical/staging/backup; no incompatible overwrite, verified in actual rollback rehearsal |
| Unknown/corrupt/future/mixed records | Protected recovery or memory-only operation; no downgrade, silent clearing or invented pouch/history |

“No breaking migration” here preserves existing-save usability and avoids mandatory conversion/reset; it is not a claim that old binaries read new fields. Retain canonical/staging/backup transaction, source bytes, revision/consent/race guards and tests. If the old-application refusal/write-protection proof fails, hold new-profile activation and fix it within PR19; do not bump to3 or waive the gate. Independent UI work proceeds.

Replay restores actually captured causal metrics/flags/events/pouch/RNG/cursor while keeping current settings. Completed-content/ending history remains separate from current timeline eligibility. Resume, repeated input and viewer actions cannot duplicate completion or farm repair. Session History remains ephemeral50+50 and cannot reconstruct a chapter snapshot.

Alternative: reuse unextended Save2 only if the full semantics can be represented honestly under the existing closed contract. Current inspection shows no snapshot field; hiding it in flags/history or rebuilding from final values is rejected. A sidecar/slot storage scheme would add transaction and compatibility complexity outside the chosen plan.

## 4. Lore, narrative and mechanics reconciliation

ADR22 replaces biological childhood and the natural-frog/plush separation rule. New Act1 starts in the crochet body, shows family warmth and growth to adult45cm/blue shirt before the storm. Acts2–5 use that body's limbs, clearances and viewpoint. All endings retain the living keepsake; HOME gift framing is not a transformation from an animal or the end of life.

T0 amends forward-facing GDD/Narrative/SRS/design text and T6 reauthors setup/payoff. Existing approved mechanics stay unless an authored change is explicitly reviewed: three resolver thresholds, no Bond beforeA4-004, cautious compensation, once-only repair, four held slots, distinct six-item histories, default variants and state-preserving convergence beforeA3-003. Low-meter recovery values, physical leaf use, variant precedence and legacy food/shelter language are reconciled before their dependent content, not improvised in UI.

The old Act1-complete bridge proposal is retired because the stories now have different causal histories. Unknown family fate remains unknown; do not invent a reunion/death, personal biography or new magical capabilities. Each key board has world reference, camera, pose, clearance and safe route. Childhood height and family morphology not fixed by ADR22 remain authored details requiring review, not numeric guesses.

## 5. UX and cinematic remediation

ADR22 is the received feedback authority. Implement a coherent type/spacing/layer/state system, ambient meters separate from≥44×44 command targets, spacious utility overlays, default inert prose/background and pointer controls. Eliminate inner choice scrolling and saved-success visual/live-announcement artifacts while preserving actual save behavior and accessible failures.

Narrative confirmation moves inline. Retain high-impact preference/eligibility/revision safety: arm without effects → explicit confirm → one transaction; no hover/focus commit or rapid-input bypass. Destructive save replacement retains its own consent. See the [interaction table](../proposals/sprint-05-planning/02-adr022-remediation-contract.md#33-inline-choice-confirmation) for cancellation, stale state, overlay/session and reflow behavior.

Full-screen illustrated beats support growth, storm, city, girl and ending decisions. They retain complete Thai, still/reduced-motion and audio-off equivalents, semantic reload and exactly-once effects. Actual human reading-comfort and Thai review is required each slice. Lint/screenshot/CLS/unit counts are not substitutes for that acceptance.

## 6. Production gift and device review

The adult reference currently lacks red embroidery; T14/T15 create, inspect and export it with original2D posters. Childhood heart accessory is distinct, not a substitute or inventory requirement. Both models reflect the same protagonist's life stages, with clear chronological/gift framing and retained agency.

The prior model-viewer spike is a candidate implementation reference only. Production version/license/maintenance/network/lifecycle/bytes must be reviewed before importing a same-origin pinned bundle. No CDN/decoder escape, data-directed imports or automatic download. Keep complete poster/text and optional HOME-only deliberate opt-in.

Set measured export/viewer/GPU budgets before activation: starting proposals remain one active model, self-contained GLB≤2MB and≤25,000 triangles per model, no auto-spin. Initial game2MB/critical500KB limits are unchanged. Verify actual close/switch/race/context-loss/error disposal and resource plateau on physical iOS/Android, plus keyboard/AT. Do not infer production performance from spike desktop output. If3D cannot meet its gates, an actual scoped owner decision is needed; fallback alone does not close the requested3D task.

## 7. Four-slice rollout, trace and rollback

| Planned PR | Tasks | Outcome / internal checkpoints |
|---|---|---|
| #19 / S1 | T0–T5 | Contracts and fixtures → runtime/Save2 → VN/HUD/inline controls → comfort/compatibility review |
| #20 / S2 | T6–T7 | New living Act1 → Act2/yarn/routes → media and actual read-through |
| #21 / S3 | T8–T13 | Act3/convergence → Act4/relationship → Act5/three endings → full journeys/replay |
| #22 / S4 | T14–T19 | Source art/exports → viewer/failure isolation → physical devices/human acceptance → artifact/rollback/core freeze |

Four execution PRs remain fixed; checkpoints are commits/evidence sections, not additional PRs. The current planning PR18 changes no runtime. Promotion is fixture-backed capability inS1, revised Act1/2 package with an honest rest boundary inS2, full story inS3 and optional gift/final qualification inS4. Future execution branches follow AGENTS; this PO-authorized revision continues the existing planning branch.

Trace: ADR-P0-022 D1–D6/Consequences; applicable ADR-P0-019/020/021; FR-STA-001..006, FR-ENG-001..009, FR-CNT-001..006, FR-SAV-001..009, FR-UI-001..007, FR-SET-001..004, FR-ACC-001..004; GDD-BAL-001..009, GDD-END-001..006, NAR-CON-001..010, NAR-SAFE-001..006; NFR-MA-001..006, NFR-PE-001..005, NFR-RL-001..005. Exact task/gate/artifact mapping is in the linked matrix.

Valid old invariants remain. Superseded save-dot/modal/biological/stage-click assertions are replaced with ADR22-linked checks and a record of why the expected outcome changed. Historical evidence stays immutable. No unrelated test deletion, skip or assertion weakening is permitted.

This documentation revision needs no data migration. Runtime rollback later must preserve new-profile raw records and prevent incompatible writes; every profile/package promotion has an explicit rehearsal. Final core freeze is immutable to Editor operations. No force push, automatic merge, deployment or shared-history rewrite follows this RFC.

## 8. Readiness register

| Item | Disposition |
|---|---|
| ADR22 six decisions and Save2 | Decided by PO; ready for Slice1 contract/design work, no repeat approval request |
| Exact profile/manifest/field bounds | Architect/Data/QA deliver and verify in T0/T1/T3 before dependent writer activation |
| New-lore script/scale/registry | Narrative/Game Design/Art deliver before S2/S3 content promotion |
| Review findings | Remediation authorized; human comfort/Thai acceptance remains open until actual revised builds |
| Production dependency/art/device budgets | Scoped S4 decision and measured review, not permission inferred from the spike |
| Remaining release controls/duration | T0/T5 implementation audit and T18 measured acceptance; no silent waiver |

The document author records the PO's accepted directions and a concrete implementation design. Source implementation and final human/device acceptance are not claimed by this planning update.
