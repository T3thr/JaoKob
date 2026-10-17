# Change Record: Sprint 5 ADR-P0-022 four-slice replanning

- **Record ID:** CR-20261018-0023
- **Timestamp:** 2026-10-18T00:23:53+07:00 (Asia/Bangkok; record opened)
- **Sprint/Milestone:** Sprint 5 planning revision 0.2; implementation remains 0/20 tasks, 0/4 execution PRs
- **Operator:** Codex / Senior Software Architect, Lead Interactive Fiction Director, Master Craftsman
- **Status:** Documentation delivered for Draft PR #18 update under the PO's Accepted ADR-P0-022; source and human/device acceptance unperformed
- **Authority:** Current PO explicitly requests SSOT/proposal/WBS/DoR/DoD/trace revision and commit/push on the existing planning branch. No execution PR, merge or deployment requested.
- **Baseline/branch:** `c99e745cbbcf5391a4f00ef3777f4bac3f2fe7d3` on `feat/sprint-05-planning-ssot`; runtime/develop remains `d1af29314d4497e2c37727282a5c7fc3e31333eb`; identity `T3thr <t.theerapat33@gmail.com>` verified

## 1. Objective, outcome and scope

Adopt [ADR-P0-022](../../adr/ADR-P0-022-visual-novel-ergonomics-living-keepsake-lore-and-sprint-streamlining.md) without rewriting its accepted rationale. The supplied ADR was the only pre-existing untracked file; it is included unchanged as the authority for this authorized documentation update. The existing branch and [Draft PR #18](https://github.com/T3thr/JaoKob/pull/18) are retained as expressly requested, rather than creating another planning branch or PR.

[SSOT 0.2](../../sprints/sprint-05-ssot.md) now contains exactly four value slices with planned PR19–22, twenty tasks allocated 6/2/6/6, concrete per-task DoR/DoD and quality gates. The living-keepsake opening shows childhood crochet → adult45cm/blue shirt **before the storm**, then keeps that scale through the city, girl and endings. The overhaul includes separated ambient HUD/tools, clear affordance, spacious utilities/choices, silent successful persistence, inline narrative confirmation and cinematic beats with text/still fallback.

The previous Save3 recommendation and automatic biological-Act1→new-lore bridge are retired. Keep SaveFormat2 with a separately identified closed extension-profile design, exact legacy continuation, actual captured replay snapshots and old-application write protection. Existing saves are not reset or assigned a history that did not happen. The canonical core stays protected from the future Editor; revised lore is a new reviewed package version, not an in-place overwrite of an archive.

This change is planning and governance only. No runtime, schema, test, story JSON, asset or dependency is implemented or modified. No new execution PR is opened. A plan does not resolve the actual critical UX/Thai findings; human acceptance belongs to the revised builds in each slice.

## 2. Requirement and decision trace

Primary authority: ADR-P0-022 D1–D6 and SaveFormat2 Consequences. Applicable ADR-P0-019/020/021 requirements remain; the new remediation contract explicitly maps superseded biological, UI and planning directions without altering historical ADRs.

Requirement families: FR-STA-001..006, FR-ENG-001..009, FR-CNT-001..006, FR-SAV-001..009, FR-UI-001..007, FR-SET-001..004, FR-ACC-001..004; NAR-CAN-002, NAR-CON-001..010, NAR-BRN-001..004, NAR-SAFE-001..006; GDD-BAL-001..009, GDD-END-001..006; NFR-MA-001..006, NFR-PE-001..005, NFR-RL-001..005; TR-001..020.

The [trace matrix](../../traceability/sprint-05-execution-matrix.md) maps all eight reported critical findings (`R22-01`..`R22-08`) and inherited requirements to tasks, planned files, TC IDs, planned PR and evidence owner. Finding labels are local review identifiers, not new product requirements. TC IDs are planned checks until their runners/procedures materialize.

## 3. Manifest of changes

| Artifact | Change |
|---|---|
| Supplied `docs/adr/ADR-P0-022-*.md` | Add the PO-authored accepted authority unchanged; record its hash |
| `docs/sprints/sprint-05-ssot.md` | Rewrite 0.2 around four slices, revised origin/scale, UI contract, Save2, task allocation and actual acceptance |
| `docs/proposals/sprint-05-planning/01-readiness-assessment.md` | Update findings and trade-offs against source and actual model references; retire old recommendations explicitly |
| `docs/proposals/sprint-05-planning/02-adr022-remediation-contract.md` | Add precedence crosswalk, scale/lore sheet, VN/inline/silent-save/cinematic behavior, Save2 compatibility and per-PR checkpoints |
| `docs/rfc/CR-0006-sprint-05-complete-story-and-package-boundaries.md` | Align options, constraints, readiness and rollout to ADR22; no Save3 or mandatory lore migration |
| `docs/traceability/sprint-05-execution-matrix.md` | Add finding→authority→task→artifact→verification→planned PR mapping and old-task remap |
| Evidence README, new probe/replanning reports | Add fresh planning evidence while leaving the 2026-10-17 TAP/design/inventory/manifest unchanged |
| `AGENTS.md`, docs portal/proposal index, root CHANGELOG, this audit | Correct current entry points and register the authorized revision |

No deleted files. Historical S4/S5 audits, old accepted ADRs, published schemas, story/asset bytes and prior evidence remain intact. No private reference or real recipient identifier is copied into runtime assets.

## 4. Verification performed and limitations

- Git pre-flight: exact existing branch and clean tracked state, with only the supplied ADR untracked; T3thr name/email correct; remote planning head matched `c99e745`, remote develop matched `d1af293`, PR18 open/draft against develop.
- Source inspection: content capability/orchestration/session/save-schema/validator/guard behavior, confirmation flow, save-dot CSS/rendering and affected presentation consumers.
- Visual inspection: childhood front, adult poster and adult front model renders opened. Adult blue-shirt embroidery absent in these references; 45cm comes from authorial authority, not image measurement. Separate veteran UI-review screenshots were not supplied in the referenced repository set; no claim of inspecting them is made.
- Executed a three-case Node diagnostic using `validateSaveEnvelope` and `tests/fixtures/pouch/valid-save2-leaf.json`: original valid, envelope extension rejected, payload replaySnapshots rejected, each with expected result. The [probe report](../../proposals/sprint-05-planning/evidence/save2-current-validator-probe.json) is a current-validator fact, not proof that a new profile works.
- Fresh documentation verification checks links/anchors, explicit requirement references, four-slice/twenty-task allocation, all eight findings, gate references, acyclic dependencies, changed-file scope and whitespace. The supplied ADR, inspected renders, original evidence and runtime/schema/test/assets are hashed/compared. Final results are in [ADR22 replanning verification](../../proposals/sprint-05-planning/evidence/adr022-replanning-verification.json).

The original 2026-10-17 baseline remains **1,060/1,060 unit passes** and **1,096 design trajectories**. These suites were **not rerun** because source/tests/data are unchanged in this revision. The design starts at Act4 and cannot validate the new Act1–5 story or reported visual/Thai concerns. Superseded UI/lore assertions must be replaced with traced ADR22 checks during implementation; valid domain/save/legacy invariants remain.

Not performed: new schema-profile validation/implementation, actual new-lore journey, browser/visual interaction, static-artifact/rollback rehearsal, production3D/GPU lifecycle, physical iOS/Android, VoiceOver/NVDA, human Thai/comfort/art acceptance, deployment. No reviewer acceptance or “100% no slop” claim is generated from machine checks.

## 5. Risks, readiness and approvals

Slice1 is ready to begin contract/design work under the accepted ADR. Exact profile fields/$id/limits, write-guard fixtures and UI design specification are deliverables in T0/T1/T3/T4 before their dependent code, not requests to reapprove the six decisions. Old-reader compatibility is the central engineering risk: keeping the number2 alone is insufficient, so activation of the new writer requires actual refusal/byte-protection tests. Failure holds that writer and is fixed within PR19, while independent UI work continues.

The 45cm rewrite changes causal history and scale throughout; callbacks cannot cite old biological scenes. PR21 remains large even after streamlining, so per-act commits/read-throughs and full-route evidence stay mandatory inside that PR. Four PRs do not justify fewer checks. Human Thai/comfort review is required every slice; physical devices/AT and production dependency/art budgets are scheduled for Slice4. Full-release controls/duration remain explicitly audited, not silently waived.

The binding direction is already approved by PO. Implementation reviews, human/device acceptance and exact production3D dependency review are still required at their named gates. No new Canon beyond ADR22 is declared approved by the document author.

## 6. Migration, rollback and delivery

No migration executes in this documentation change. Rollback is a reviewed documentation revert on the feature branch; it does not touch LocalStorage or rewrite Git history. Future Save2 profile/package promotions require the compatibility/rollback matrix in the remediation contract; no old-lore-to-new-lore cursor guess is allowed.

Delivery updates the existing `feat/sprint-05-planning-ssot` branch and Draft PR18 using Conventional Commits referencing ADR-P0-022, CR-0006 and CR-20261018-0023. The PR description is rewritten around the final four-slice plan. Protected branches, automatic merge and deployment are outside this delivery.
