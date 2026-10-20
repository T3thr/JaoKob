# Change Record: 3D structure guide and session hand-off

- **Record ID:** CR-20261020-1318
- **Timestamp:** 2026-10-20T13:18:00+07:00 (Asia/Bangkok)
- **Milestone:** CR-0004 documentation closeout / standing-character consultation hand-off
- **Operator:** Astra
- **Status:** Completed documentation; standing-character implementation remains proposed
- **Change class:** C0 editorial consolidation and navigation; no new approved behavior or Canon

## 1. Objective and authorization

PO requested detailed, organized documentation inside the existing 3D folder so another agent or Astra session can understand its layout, the decisions and lessons from this session, and the latest discussion about standing/breathing/emotive VN characters. PO explicitly authorized committing and pushing these documentation changes directly to `develop`. This permission applies to this documentation turn, not future features or deployments.

The isolated model worktree was already on develop. It was fast-forward checked against origin at `7476722` (merged PR #19). The Antigravity checkout remains on `feat/sprint-05-planning-ssot`; its files, branch, index and HEAD are not modified by this work. No stash/reset/checkout or planning-branch commit is performed there.

Intake/DoR: the authorizing request, documentation-only scope, existing source/evidence, verification and rollback are identified. No new asset/rig/UI/schema implementation is requested. Owner instructions supplied in the session govern navigation where develop's older AGENTS text differs from the active planning context.

## 2. Traceability and impact

- CR-0004: preserves the context of adult/childhood asset work and M1D parity/eyelids.
- ADR-P0-016 / ADR-P0-017 / ADR-P0-025: linked with supersession caveats; historical decisions are not rewritten.
- CR-20261018-0508 / CR-20261019-1036: historical technical verification remains attributable to those rounds.
- PR #19, merge `7476722`: documents the now-merged state; prior Draft status remains historical in original records.
- The 2026-10-20 consultation is explicitly a proposal, not authority to add standing rigs, Three.js, scene cues or production integration.

Scope is guides, navigation, progress, changelog and documentation verification/hash metadata. No geometry, image, source script, preview runtime, dependency, src/, test, Save or schema changes. No new product requirement IDs or approvals are invented.

## 3. Changed artifacts

| Artifact | Purpose |
|---|---|
| [STRUCTURE.md](../../proposals/3d-keepsake-spike/STRUCTURE.md) | Directory tree, every script role, source/export/runtime contracts, evidence classification, safe workflow and missing-reference status |
| [HANDOFF.md](../../proposals/3d-keepsake-spike/HANDOFF.md) | Gift intent, milestone history, current metrics, decisions/lessons, workspace/Canon context, latest standing-character recommendation and session-start checklist |
| [Spike README](../../proposals/3d-keepsake-spike/README.md) | Navigation to new guides, merged status and corrected reference-folder availability |
| [progress.md](../../proposals/3d-keepsake-spike/progress.md) | Appended merge/consultation/documentation closeout without erasing history |
| [documentation evidence](../../proposals/3d-keepsake-spike/evidence/documentation-handoff-verification.json) | Local-link/status/fact/scope/preservation checks for this round |
| [artifact manifest](../../proposals/3d-keepsake-spike/evidence/artifact-manifest.json) | Refresh README hash and index the two guides/documentation report; existing model/render hashes preserved |
| Root [CHANGELOG.md](../../../CHANGELOG.md) and this record | Current round audit and navigation |

The originally supplied `docs/references/3d-doll-models/` was not found in either inspected checkout. The guides preserve the expected filenames and provenance pointers, explicitly mark availability unknown beyond this observation, and do not fabricate or recover photographs from unrelated locations.

## 4. Verification and evidence

Performed: inspect tracked inventory and actual generator/verifier/UI files; check local Markdown targets and anchors in new/changed guide files; compare current model numbers to JSON evidence and raw GLB metadata; confirm 0 skins/0 morph primitives and the existing HeartEmote selector; verify unchanged non-document tracked files against the pre-edit HEAD; verify all manifest file hashes; review whitespace and explicit staging scope.

[Documentation verification report](../../proposals/3d-keepsake-spike/evidence/documentation-handoff-verification.json) records the measured counts/results. The manifest update is documentation metadata only; it does not imply a fresh asset build or test run.

Not run: Blender generation/render/source verification, Khronos validator execution, Playwright/browser interactions and game unit suite. They are not needed for this documentation-only change. The referenced validator 0/0 and 1,060 test passes are historical evidence from the asset delivery, not new claims. No newly approved visual, physical-device or accessibility acceptance is inferred.

## 5. Migration, rollback and hand-off

No runtime/data migration. A reviewed revert of this documentation commit restores the preceding documentation without changing delivered models. Main follow-up: obtain current approved art/narrative direction and a scoped standing-character contract before any implementation, then validate an adult-first one-scene prototype as recommended in HANDOFF.

Active Sprint5 SSOT is on the separate planning branch and is absent from this develop baseline. To honor the instruction not to disturb Antigravity, no Section7 row or WBS change is made there. This record is registered in the root changelog and 3D hand-off; the planning owner can link it when coordinating the next audit update. This deliberate boundary is not a claim that Sprint5 registration or any production WBS task was completed.

The requested docs and direct develop delivery need no additional permission. Standing-character implementation, production dependency/integration changes and remaining art/device gates require their own future scope and acceptance. No release/deploy is performed.
