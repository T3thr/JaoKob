# Change Record: Sprint 4 Overhaul Proposal Plan

- **Record ID:** CR-20261014-1841
- **Timestamp:** 2026-10-14T18:41:27+07:00 (document assembly milestone)
- **Sprint/Milestone:** Sprint 4 planning, following integrated Sprint 3
- **Operator:** Codex / Senior Technical Lead, Game Director, Principal UI/UX Architect
- **Status:** Planning delivered for owner review; implementation 0/10 and decisions pending

## 1. Objective and authority

PO requested detailed visual/architectural gap analysis against approved targets, a No AI Slop acceptance rubric, Dialogue Card/three-screen/Dialogue Log/Keepsake specifications and execution WBS. Current instruction explicitly limits this round to planning, without production code. All proposed runtime/Canon/dependency decisions remain subject to approval; document review does not authorize merge or deployment.

Integrated baseline fetched as `origin/develop@4c8d600820fcedcc9c14ec4b51df685f07099c7a`. Original workspace is `feat/spike-adult-plush-model@d8a569e` with existing GDD edit and local references; preserved without staging/switching/reset. Documentation work uses a separate managed worktree and `feat/sprint-04-overhaul-plan` from develop. Identity verified as `T3thr <t.theerapat33@gmail.com>`.

Read-only GitHub check found [PR #11](https://github.com/T3thr/JaoKob/pull/11) OPEN / draft / not merged, head `d8a569e2472079789a02b9c363ae4378dc9d66ac`, base develop. Spike inputs are linked at that fixed commit, so this plan does not silently fold asset delivery into integrated runtime.

## 2. Traceability and impact

Existing: `FR-UI-001/002/003/004/005/007`, `FR-ENG-009`, `GDD-UX-001..007`, `FR-ACC-001..004`, `FR-LOC-001/003`, `FR-SAV-001/003/004/005/006/007/009`, `NFR-US-001..006`, `NFR-PE-001..005`, `NFR-MA-001/002`, `NFR-PO-002/004`; `NAR-WLD-002/004/005`, `NAR-CON-001/007/010`, `NAR-DLG-001..005`, `NAR-TONE-001`, `NAR-IP-001/003/004`.

Proposed: [CR-0005](../../rfc/CR-0005-sprint-04-overhaul.md) D1–D7. Governing existing ADR-P0-001/004/005/012/014/015 retained; ADR-P0-016/017 are spike-only. No new requirement or ADR is marked Accepted. Full trace/design/task/evidence map is in [draft SSOT](../../sprints/sprint-04-ssot.md).

## 3. Changed artifacts

Created:

- [Proposal plan](../../proposals/sprint-04-overhaul/01-proposal-plan.md): 12 gap findings, 9-dimension aesthetic rubric, detailed reading/choice/history/collection contracts, architecture/compatibility and decision table.
- [CR-0005](../../rfc/CR-0005-sprint-04-overhaul.md): alternatives, impacts, runtime library/catalog/history/Canon decisions and rollout/rollback.
- [Sprint 4 SSOT draft](../../sprints/sprint-04-ssot.md): ten scoped tasks, owners/files/dependencies/AC, effort range, traceability, DoR/DoD, verification and approval register.
- [Baseline comparison](../../proposals/sprint-04-overhaul/evidence/baseline-comparison.json), [unit summary](../../proposals/sprint-04-overhaul/evidence/unit-summary.txt) and [planning verification](../../proposals/sprint-04-overhaul/evidence/planning-verification.json): measured unchanged-runtime regression/documentation evidence.

Modified: root [CHANGELOG.md](../../../CHANGELOG.md), [docs portal](../../README.md), [proposal index](../../proposals/README.md), [Sprint 3 audit navigation](../../sprints/sprint-03-ssot.md). Only new planning links added; completed WBS and historical decisions preserved. Sprint 1/2 not reopened. No deleted artifacts, production source, installed schema, assets or tests modified.

## 4. Verification and limitations

- Read controlling skill/workflow/full engineering guide; inspected local targets and six actual screenshot states/sizes, source renderer/styles/projectors/orchestration and save/schema contracts.
- `node --test tests/unit/*.test.js`: **691 tests, 691 pass, 0 fail/cancelled/skipped/todo**, 20,832.222 ms, Node v22.23.2. Run on spike HEAD; per-file byte comparison binds unchanged runtime/test sources to develop in retained manifest. This is baseline evidence, not new-feature coverage.
- Documentation review: 35 local links, 3 anchors and 33 baseline IDs in four new documents passed; ten runtime WBS items remain unchecked. Fence/whitespace/table/changed-file scope checked; added navigation links inspected. Retained report records these results; existing whole-repository links were not relinted. Internal Markdown/Mermaid source inspected; no formal lint or diagram rendering tool is claimed.
- Official primary references consulted: WAI modal dialog pattern, WCAG Reflow guidance and model-viewer loading docs. These support focus/reflow/poster/decoder safeguards; they do not approve runtime adoption or certify devices.

Not performed: new production features/tests/catalog schemas/metaschema validation, fresh browser/E2E/visual runtime, actual mobile/GPU/AT/listening/PO art acceptance, release build/deployment/merge. Historical Sprint 3 browser evidence remains historical. Aggregate unit count does not close aesthetic/manual gates.

## 5. Risks, migration, rollback and approvals

No migration executes in this planning change; reviewed revert of this documentation PR restores previous navigation. Runtime recommendation keeps schema1.2/content2.1/save1 and 691 invariants unchanged, with explicit session-only history and no saved camera/overlay state. Any later editorial content change needs its own version map/migration/rollback evidence.

D1–D7 remain pending: scope/rubric, independent strict catalog, session history/reload behavior, non-diegetic toys/early adult visibility, model-viewer runtime exception/new ADR, exact art/intent/editorial review and real device/manual profile. PR #11 asset integration/art acceptance remains separate. Plan recommends 19–29 engineering person-days plus art/review effort; duration is not committed.

Planning outcome is a concrete reviewable blueprint. Implementation remains unstarted until the relevant Definition of Ready is satisfied.

## 6. Git delivery

Documentation implementation commit `0f8ffa5c2c637e1b6c5e9429bf44208f397a1fcd` was pushed on `feat/sprint-04-overhaul-plan`. [Draft PR #12](https://github.com/T3thr/JaoKob/pull/12) is OPEN, targets `develop` and is attached to this chat. Git identity was rechecked before commit. This follow-up audit links the actual review artifact. No merge, source implementation or deployment occurred; original GDD/reference changes remain excluded.
