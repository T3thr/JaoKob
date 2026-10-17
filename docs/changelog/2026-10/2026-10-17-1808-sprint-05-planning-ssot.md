# Change Record: Sprint 5 planning, narrative closure and package boundaries

- **Record ID:** CR-20261017-1808
- **Timestamp:** 2026-10-17T18:08:05+07:00 (Asia/Bangkok; planning record opened)
- **Sprint/Milestone:** Sprint 5 planning submission; execution tasks T0–T19 remain unstarted
- **Operator:** Codex / Senior Software Architect, Lead Interactive Fiction Director, Master Co-Creator
- **Status:** Planning documents delivered for review; implementation and new technical decisions not approved by this record
- **Authority:** Current PO request authorizes study, research and the Sprint 5 blueprint before development. Repository instructions authorize the documentation commit, feature-branch push and PR to develop. No merge or deployment authorization.
- **Baseline/branch:** `develop@d1af29314d4497e2c37727282a5c7fc3e31333eb`; `feat/sprint-05-planning-ssot`; `T3thr <t.theerapat33@gmail.com>` verified at pre-flight

## 1. Objective, outcome and scope

Prepare a reviewable plan for the canonical five-act story, three equally valued endings, sensory/media work, presentation boundaries for actual VN feedback, Grand Keepsake and protected Default Core Package for the future Sprint 6 Editor. The [Execution SSOT](../../sprints/sprint-05-ssot.md) proposes **ten execution PRs / twenty tasks**, each with owner, prerequisites, acceptance, artifacts and verification IDs. This planning PR is separate from those ten.

The [assessment](../../proposals/sprint-05-planning/01-readiness-assessment.md) distinguishes current implementation from design intent. The production loader/orchestrator still accepts Act 1 only; contentVersion alone is not future story identity; actual chapter replay requires captured causal snapshots. Narrative closure retains unknown family fate, route consequences at A3-003, six distinct item histories with four held slots, meaningful self-reliant paths and the living frog between separate gift images.

Non-goals: implement Act 2–5, change runtime/schema/save/assets, invent accepted Canon or ADRs, build the Editor, integrate a new dependency, deploy or merge. Proposed architecture and unsettled authored rules are in [CR-0006](../../rfc/CR-0006-sprint-05-complete-story-and-package-boundaries.md), not silently promoted into approved requirements.

## 2. Requirement and decision trace

- Existing authority: ADR-P0-019/020/021; GDD-GOAL-001..006, GDD-SCP-002, GDD-BAL-001..009, GDD-END-001..006, GDD-BOND-005/007; NAR-CAN-002, NAR-CON-001..010, NAR-ACT-003..011, NAR-SAFE-001..006.
- Engineering requirements: FR-STA-002/003/006, FR-ENG-001..008, FR-CNT-001..006, FR-SAV-001..009, FR-UI-001..007, FR-SET-001/002, FR-ACC-001..004; NFR-MA-001/004/006, NFR-PE-001..005, NFR-RL-001..003, NFR-SE-002/003/005/006; TR-001..020.
- Planned evidence: TC-S5 families in SSOT §6. Names represent required future checks, not existing runners or passes. WBS links each planned artifact to its requirement and evidence family.
- Open decisions: CR-0006 D1 package identity/protection; D2 save/replay/continuation; D3 authored mechanics/continuity; D4 production gift assets/dependency; D5 actual player feedback; D6 full-release capability/duration disposition.

## 3. Manifest of changes

| Artifact | Purpose |
|---|---|
| `docs/sprints/sprint-05-ssot.md` | Delivery matrix, twenty-task WBS, common/per-task DoR/DoD, closure/item/ending ledger, architecture, risks, gates and audit register |
| `docs/rfc/CR-0006-sprint-05-complete-story-and-package-boundaries.md` | Proposed cross-layer options, version/migration/rollback boundaries and decision owners |
| `docs/proposals/sprint-05-planning/01-readiness-assessment.md` | Actual source findings, literary assessment, convergence/reachability caveats and primary-source research |
| `docs/proposals/sprint-05-planning/evidence/` | Complete baseline unit TAP archive, design trajectories, baseline document inventory/hashes and verification manifest |
| `AGENTS.md`, `docs/README.md`, `docs/proposals/README.md` | Correct stale Sprint 1/3/4 routing to active Sprint 5 planning while preserving approval, identity and architecture rules |
| Root `CHANGELOG.md`, this record, SSOT §7 | Concise change entry and bidirectional audit trace |

No files deleted. Historical SSOTs, accepted ADRs, published schemas, source, assets, tests and existing evidence stay unchanged. Updating the navigation does not grant implementation approval.

## 4. Verification and quality evidence

Baseline commands were run against the same runtime bytes as `d1af293`:

```sh
node --test tests/unit/*.test.js
node tests/design/ending-trajectories.mjs
```

- Units: **1,060 tests, 1,060 pass, 0 fail/cancel/skip/todo**, duration 26,908.413791 ms. Original output is retained as deterministic gzip with compressed and uncompressed SHA-256.
- Ending design: **PASS**, 7 anchors / 20 edges, **1,096 trajectories across 8 contexts** and 8 named witnesses. Empty-pouch baseline has HOME 36 / NEARBY 57 / DAWN 21 paths. Counts prove design reachability, not player probability or an actual Act 1→5 runtime journey.
- Documentation survey: **81 baseline Markdown documents / 11,082 lines**, path/heading/requirement inventory. Every stored source SHA-256 was checked against the baseline Git blob. This is a survey plus deep review of controlling documents and relevant consumers, not a claim of human editorial approval for every source line.
- Planning checks: relative links/anchors, explicit requirement references, task-to-slice and verification mapping, dependency graph, evidence archive/hash integrity, unchanged runtime/schema/assets/tests and Git whitespace. Final results and scope are recorded in the [verification manifest](../../proposals/sprint-05-planning/evidence/planning-verification.json).
- Primary-source research: W3C text spacing/reflow, MDN storage limitations, JSON Schema resource structure and model-viewer loading examples. Links and limited inferences are recorded in the assessment. They do not authorize Canon or a production dependency.

**Not performed this round:** independent schema runners, browser/E2E and visual interaction, static-artifact/rollback rehearsal, physical devices, VoiceOver/NVDA, production GPU/viewer lifecycle, human Thai/art/audio review, actual VN feedback, release/deployment. Existing S4 evidence remains historical evidence and is not relabeled as a fresh S5 pass. No full-game capability is certified by the baseline unit count.

## 5. Risks, assumptions, next steps and approvals

The highest engineering risk is extending admission/save/replay safely while preserving exact archived content and protected raw slots. Full-game graph growth, low-meter recovery through Act 3 and inherited release controls need explicit decisions and counterexample-based checks. The strongest literary risk is repeating grief or explaining themes instead of giving each scene physical cause and agency. Source-art approval and real-device/AT time may become schedule bottlenecks; ten PRs are a review structure, not a promised calendar.

Recommended next execution work is S1 T0/T1 after plan discussion: decide D1/D2/D3/D6, amend forward-facing specifications and publish new contracts. D4 must close before production gift dependency work; D5 must use actual player observations. PO direction for five acts, immutable core and equal endings is already given and need not be requested again. Exact proposed mechanisms and new authored rules still require the named owners; this record's author is not the final approver.

Sprint 4 implementation is merged. Human/device/AT checks without recorded acceptance carry forward into T18; the new plan does not rewrite old records to claim they passed. Sprint 5 implementation WBS remains **0/20**, execution PRs **0/10**.

## 6. Migration, rollback and delivery

This change has no data migration. Rollback is a reviewable revert of this documentation PR; no save reset, schema downgrade, force push or shared-history rewrite is needed. Future migration/rollback proposals are scoped to CR-0006 D2 and must be verified in their implementation PRs.

Planning commit `37c91da48bd0fb2bb3b425bc68eb5aa514030b41` was pushed from `feat/sprint-05-planning-ssot` and [Draft PR #18](https://github.com/T3thr/JaoKob/pull/18) was created against `develop`, then attached to this Codex chat. Author and committer are `T3thr <t.theerapat33@gmail.com>`; authenticated GitHub account is `T3thr`. The remote develop ref was rechecked as `d1af293` before delivery. A documentation follow-up records this PR link and the final verification manifest. Documentation review can proceed while execution approvals remain open; no automatic merge or deployment follows.
