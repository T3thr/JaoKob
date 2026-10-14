# Change Record: PO Directive — Adventure Keepsake Pouch & Narrative Pivot

- **Record ID:** CR-20261014-2131
- **Timestamp:** 2026-10-14T21:31:04.000+07:00
- **Sprint/Milestone:** Sprint 4 strategic planning revision; Sprint 5 narrative handoff
- **Operator:** Codex / Senior Technical Lead, Game Director, Principal UI/UX Architect
- **Status:** Documents revised for PO review; production implementation unstarted, WBS 0/12

## 1. Objective and authority

Current PO explicitly requests revision of the proposal, SSOT and CR-0005 and commit on `feat/sprint-04-overhaul-plan`. Adopt Adventure Keepsake Pouch with 3–4 slots, physical adventure objects/Secret Moments/Ending Nuances; assign AI tender Act 1 writing, simple branches/no combat or complicated added stats/three existing endings; S4 UI+Log+Pouch state+Act1+Act2–5 map, S5 Act2–5 implementation and Grand Keepsake after END-HOME.

The vision/writing assignment is directly issued and does not need reconfirmation. Exact slot value, item/guard/effect/registry, schema/save/migration/callback details and final prose/assets remain task-level review items. This round authorizes document revision/commit only, not production source, schema installation, merge or deployment.

## 2. Baseline and traceability

Intake/current branch head `9a08d0b000fc48f16413d3e1a5e954e69a68d2ce`; fetched develop `e9803397587bb3ec8f2a61a87966d382277a96fc` is already integrated. [PR #11](https://github.com/T3thr/JaoKob/pull/11) is MERGED at e980339, 2026-10-14T20:36:36+07:00; prior open-draft dependency statements are updated prospectively. Existing [Draft PR #12](https://github.com/T3thr/JaoKob/pull/12) targets develop. Continue requested feature branch; no new branch/worktree/reset/merge. Only preexisting untracked local references at intake; excluded from staging. Git identity verified as `T3thr <t.theerapat33@gmail.com>`.

Trace: `CR-0005` D1–D7; `FR-UI-001/002/003/004/005/007`, `FR-ENG-001/002/003/008/009`, `FR-SAV-001/003/004/005/006/007/009`, `FR-ACC-001..004`, `FR-LOC-001/003`, `NFR-PE-001..005`, `NFR-MA-001/002`; `GDD-UX-001..007`, `GDD-PROG-001..003`, `GDD-CONT-001..004`, `GDD-END-004/005/006`, `NAR-CON-001/002/003/004/005/006/007/009/010`, `NAR-DLG-001..005`, `NAR-TONE-001`.

New inventory mechanics trace to CR-0005 until baseline amendment/registry/schema approval; no invented Approved FR/Canon/ADR. ADR-P0-014/015 boundaries retained with prospective Pouch/save/cursor ADR required; ADR-P0-016/017 stay spike-scoped and future S5.

## 3. Manifest and resulting plan

Revised to **v0.2.0**:

- [Proposal](../../proposals/sprint-04-overhaul/01-proposal-plan.md): keeps original visual gap/rubric/Log specifications; replaces Act 1 doll viewer with Pouch held/acquired/released state, proposed3 slots within PO3–4, atomic full/refuse/replace/cancel, four Act1 candidate items/2–3 vignettes, tender writing samples/coverage and Act2–5 Mermaid map, three-ending nuances, explicit save/checkpoint/cursor migration and S5 Grand Keepsake.
- [CR-0005](../../rfc/CR-0005-sprint-04-overhaul.md): D1–D7 now distinguish PO-issued strategy from proposed technical detail; no S4 runtime3D dependency; inventory is a behavioral/save contract change.
- [Sprint 4 SSOT](../../sprints/sprint-04-ssot.md): **12 tasks T0–T11**, owners/files/AC/dependencies/verification/DoR/DoD; all source tasks unchecked. Estimate **32–50 engineering+narrative person-days** plus3–5 Art days/review, replacing19–29.

Also update current planning navigation in docs portal/proposal index and root CHANGELOG; add this record, [fresh unit summary](../../proposals/sprint-04-overhaul/evidence/pouch-pivot-unit-summary.txt) and pivot documentation verification report. Original0.1 change record/evidence remain historical, not rewritten. Source/assets/schemas/tests/GDD/Narrative baseline unchanged in this commit.

## 4. Verification

- Inspected source leaf flag (`reversible:false`), existing presentation-only migration and Bible/GDD callbacks before design; keep historical leaf flag meaning and add held membership rather than clearing/reusing flags.
- `node --test tests/unit/*.test.js`: **691 passed, 0 failed/cancelled/skipped/todo**, 35,118.220 ms on unchanged runtime. This is baseline regression, not Pouch/secret/new-format coverage.
- Runtime diff against develop was empty for src/specs/tests/index.html/assets; this documentation revision introduces no runtime changes.
- Documentation checks passed: **32 local links, 4 anchors and 49 baseline IDs**, twelve unchecked implementation tasks and no runtime diff; table/fence/whitespace, cross-document D1–D7/versions/scope and old-scope supersession reviewed. Exact automated report is retained at [directive verification](../../proposals/sprint-04-overhaul/evidence/pouch-directive-verification.json). Mermaid source inspected; no rendered diagram tooling claimed.

Not performed: new Pouch/state/save/schema/content implementation or schema metaschema/semantic migration tests, new graph/E2E/browser/visual candidate, real device/AT/listening/final Thai/art review, later-act/Grand Keepsake runtime or production build/merge/deploy. Proposed TC-S4 tests remain unmaterialized.

## 5. Migration, rollback, risks and decisions

No migration executes now. New design proposes content3.0/package/shared schema2.0/saveFormat2 with inventory+checkpoint and exact reading mapping, ratified before source. Current2.0→2.1 presentation migrator cannot be weakened to admit rewritten gameplay. New migration maps payload/checkpoint independently, preserves old flags/metrics/settings/RNG/history/raw backups, grants no new items/secrets and fails safely without a semantic mapping. Later rollback retains newer-format write protection; never saves an empty bag over valid inventory.

Documentation rollback is a reviewed revert of this revision. Key pending details: exact3-or4, new item/vignette guards, held-vs-memory leaf/share/default clarification, optional yarn placement (proposed Act2 human-material continuity), schema/cursor/migration/recovery fixtures, final prose/graph/2D assets/manual profile. Item collecting/secret completion cannot become additional Canon-ending gates; models stay S5 HOME only. AI drafting is assigned, human editorial still accepts final text.

## 6. Git delivery

Commit and push only scoped documentation changes on `feat/sprint-04-overhaul-plan`; update existing Draft PR #12 around final Pouch/narrative/S4→S5 scope, without merge/deployment. Actual delivery commit identity and status are verified after local checks; commit/PR history supplies immutable trace. Local reference photos remain untracked and excluded.
