# Change Record: Sprint 4 Slice 4 — Tender Act 1 and the road home

- **Record ID:** CR-20261016-0302
- **Timestamp:** 2026-10-16T03:02:00+07:00 (Asia/Bangkok)
- **Sprint/Milestone:** Sprint4 Slice4, T7/T8, fixed5-PR Master Delivery Matrix
- **Operator:** Codex / Senior Software Architect, Lead Interactive Fiction Director, Narrative author
- **Authority:** Current PO directive explicitly authorizes actual Act1 rewriting, content/schema corrections under Open Mastery, T8 design and commit/push/PR16 to develop. No merge/deployment authorization.
- **Baseline / branch:** develop@ec12038 with PR14@6692c1b and PR15@f8ee156; `feat/sprint-04-slice-04-narrative`; T3thr <t.theerapat33@gmail.com> verified.
- **Status:** Source/design/evidence delivered for human PR/Thai/PO review; candidate promotion is Slice5 T9/T10, final acceptance T11.

## 1. Outcome, scope and authority

T7 delivers the actual content3/schema2 Act1 candidate: fresh prose throughout seven scenes,46 existing dialogue IDs with revised prose plus24 new records, four childhood objects and a natural fifth shell, three optional three-beat moments, full-pouch refusal/replacement/cancel and complete empty/released comfort. Mother waits for a slower child; siblings take turns; storm is independent of choices; the small body can pause, breathe and seek shelter. No family fate, ghost, human girl or toy body is introduced early.

T8 delivers the [dedicated five-act/Act2–5 handoff](../../proposals/sprint-04-overhaul/05-act-2-5-map-and-endings.md): fixed convergence before A3-003, red yarn first at A2-006, separated wheel/heat/feet/trash sequences with metric provenance/rest, held/released/refused/never-acquired uses, late restrained girl, cautious/repair truth tables and HOME childhood-crochet→adult-velour/red-heart bridge. Current adult front render was inspected; **the blue shirt still lacks red-heart embroidery**. That original-art/export/device work belongs to Sprint5.

No Act2–5 runtime, new ending, 3D/viewer/model change, new art/runtime dependency, telemetry/backend, release or deployment. T9 Intent Tags/illustrations, T10 promotion/legacy cursor policy and T11 final human acceptance remain in the single final PR17. No sixth slice/PR is introduced.

## 2. Requirement trace and readiness

| Requirement / decision | Design → artifact → evidence |
|---|---|
| CR-0005 D2/D4, GDD-CONT-001..004, NAR-ACT-001/002, NAR-DLG-001..005, NAR-VOI-001..003, NAR-TONE-001, NAR-CON-001/002/004..010 | [Act1 contract](../../design-system/act1-narrative-contract.md) authored before source → actual package/localization → TC-S4-NARRATIVE-001/EMOTION-001/CALLBACK-001/GRAPH-001; final human prose acceptance open |
| ADR-P0-020, GDD-PROG-001/002, GDD-CHO-002/003, FR-CNT-001/002/004/005/006 | Versioned strict common/event/tree/package2, item/moment references and pure atomic transactions → schema/runtime/reference negatives and974 route witnesses |
| FR-SAV-001/003/005/006/007/009, GDD-PROG-003 | Exact2.1 archive/normal continuation; candidate3 Save2 identity; semantic cursor/completed-node facts → TC-S4-SAVE-001/002/RETRY-001, real cancellation/backup/Resume/reload and checkpoint cases |
| NAR-CON-003/005/006/007/009, GDD-BOND-001..006, GDD-BAL-001..009, GDD-END-004..006 | T8 anchors/effect/recovery/consent/repair/expected-results matrix → TC-S4-MAP-001/FAIR-001/GIFT-001 **design**, not unimplemented S5 E2E |
| FR-UI-001/002, FR-LOC-001/003, FR-ACC-001..004, NFR-US-003..006, ADR-P0-019 | Safe localized text, truthful missing-art fallback and narrow/large-text correction → actual six-profile screenshots/geometry/input/History checks; device/AT final acceptance open |

DoR: current PO grants narrative/schema authority; observable T7-AC-01..04/T8-AC-01..08 are in SSOT; files/owners/boundaries/fixtures/rollback fixed in the contract first;935-case baseline passed. No new approved requirement or Canon is invented by the author. New `draft` recovery values/prose in the S5 map remain review proposals governed by existing balance invariants.

## 3. Manifest and engineering impact

| Boundary | Created / modified |
|---|---|
| Content | `src/data/content/packages/act-01.json` actual3.0; exact prior bytes archived as `compatibility/act-01-2.1.0.json`; test catalog and Data-owned pouch policy/load/runtime/index/view projection updated.28nodes/47edges/70dialogues/5items/3moments. New fifth ID item_river_shell is natural; item_red_yarn remains later. |
| Contracts | Four new published2.0 common/event/tree/package files plus generated local catalog; existing1.x/pouch/save schemas byte-identical. Items/moments unique, references strict, returns bounded/memoized, entry rewards/cyclic bypass/self-replacement rejected. |
| Core | Bounded pre-state pouch/capacity/completed-node predicates; explicit collect/refuse/release/replace within one story transaction. Target guard sees all candidate effects before acceptance; failures preserve original snapshot. Resume supplies full facts without entry replay. No story ID/DOM/Data import in Core. |
| Save | Format2/content3 is a validated identity path; format1/content3 unsupported. No extra field, transcript or return stack; optional completion uses final acknowledgement and existing completedNodeIds. Payload/checkpoint retain their own pouch facts. |
| Thai/UI | Four new item metadata entries with text-only art fallback; existing leaf stays available. Header can wrap its single capsule at narrow/large text; image area reserved128px; short decorative fallback/full detail explanation. No illustration or asset rights assumption added. |
| Tests | New narrative-session helper; narrative content/bootstrap/handoff unit files; independent Ajv runner, design ending fixtures/legacy hash; browser runner and scoped evidence. Existing935 assertions retained with version-aware archive paths; catalog parity broadened to added schemas. |
| Docs | Act1 contract; T8 map; updated baseline handoff, design specification, specs catalog, RFC0.2.4, SSOT0.4.0, portal, browser guide, progress and root CHANGELOG. This record and evidence README hold complete limits/trace. |

No file deleted. No private reference photograph, model/vendor artifact or ignored generator is staged. Historical evidence is preserved; new evidence is written under `tests/e2e/evidence/sprint-04/slice-04/`.

## 4. Verification actually performed

| Gate | Result / evidence |
|---|---|
| Baseline regression |935/935 before source,0 fail/cancel/skip/todo. |
| Final unit | **990/990**,935 retained+55 new,0 fail/cancel/skip/todo;28,710.487ms in recorded final run. Includes actual storage/DOM candidate cancel/one-write/backup/secret Resume/protected old-record checks, all-cursor Save2 and checkpoint Retry. |
| New graph |974 independent route witnesses cover28nodes/47edges and all twelve old emotional directions; all optional skips/refusals/collects, four exact replacements, released/empty/default semantics and three3-beat acknowledgement/return paths. Original14/21/12 remains separately archived/tested. |
| Reference schemas |17 metaschemas/10 strict new package cases/59 Save2 cursor instances; existing Pouch reference47 cases and old presentation11schemas/36cases retained. Runtime negatives also reject semantic violations. |
| Candidate browser |6 profiles,21 captures; full offering/confirmation cancel/inspection/replacement/reload, root/subpath empty+release-all, secret exact-page200%/high/forced contrast, a complete fresh journey and actual session History;0 unexpected console/page/external/3D errors. Observed six-profile CLS0; save approximately6.3KB. |
| Legacy browser |12/12 original production-entry routes plus keyboard/Bond AX/save/consent/fault/reflow gates,0 unexpected errors. New run uses archived2.1 normal entry and preserves all original assertions. |
| Action client / visual inspection |Installed unchanged develop-web-game client, two short input bursts, screenshot/state inspection; temporary module resolver points at existing Playwright. Inspected mobile/desktop/landscape/empty/released/200%/History captures; fixed two inherited layout issues, reran relevant checks. |
| Static/docs |Archive SHA-256 `498dbdcee737a5256e32dc8391d276a83744c4e91fe910c7cdf26a84eb1fb64f` matches develop exactly; published schema bytes unchanged; localized runtime punctuation/safe text/dependency boundaries/links/diff/assets inspected. Scoped checks are recorded with hashes and sizes. |

Commands/raw outputs/screenshots/limits: [evidence README](../../../tests/e2e/evidence/sprint-04/slice-04/README.md). Test failures during development were corrected in source/tests; final passing evidence contains no lowered assertion or skipped case. Initial network detector incorrectly counted same-origin blob images as external; its origin check was corrected, with no relaxation for foreign origins.

## 5. Compatibility, cursor policy and rollback

**Normal entry remains exact archived content2.1 until Slice5 T9/T10.** The new candidate executes through the existing composition content port with real Save2; it is not a prose-only document. This follows the fixed delivery matrix's integration boundary while protecting real users' current read positions. New art/Intent catalog/promotion is not silently pulled into this slice.

Every old node/dialogue keeps its semantic identity in candidate3, but rewritten strings and added branches are not exact old read positions. The supported old-session cursor map is therefore **identity within archived2.1** for all14 nodes/all46 dialogue records, including active and independent checkpoint leaf facts; there is **no admitted2.1→3 map**. Existing all-cursor/12-route tests prove normal legacy continuation. Candidate all-cursor tests prove its own exact Resume. T10 must review an explicit semantic transformation or keep compatible continuation; never infer by array index or shortened text. Integrity-bearing unsupported transforms remain protected.

Revert this slice's candidate/contract/UI changes through reviewed Git revert while retaining Save2 dual admission/downgrade/write protection. Normal2.1 continues; any version3 raw save remains protected. Do not run an old writer over it, erase raw backups/player keys, replay on-enter effects, clear the historical leaf flag or repair a bag by replacing it with an empty one. New-session replacement remains the existing explicit player-consent flow.

## 6. Risks, assumptions, follow-up and approvals

Human Thai/Narrative/PO final editorial and Art approval, physical devices/touch/listening, VoiceOver/Safari/NVDA/Firefox/native400% zoom, representative-device painted-frame/load/input/memory percentiles, formal secret scanner and release/static-artifact/rollback rehearsal are **not performed**. Headless geometry does not certify WCAG or final visual quality. Mermaid source is inspected; rendered-diagram tooling is not claimed.

Inherited SSOT headers still described Slice2/3 feature review after merges and are now aligned with the PO's Master Delivery Matrix. Five Act1 items plus later red yarn correctly form six possible registry IDs, still four held slots. Secret completion fits existing bounded progress and needs no speculative new save field. New final prose/art/owner review is not self-approved; T7/T8 task marks mean source/design delivery, not closure of all Sprint4 gates.

Required next owner work: PO/Narrative review this concrete candidate/map; Slice5 T9 art/Intent catalog, T10 promotion/cursor policy and T11 consolidated acceptance through PR17; Sprint5 production Act2–5/fair resolver/Grand Keepsake plus adult red-heart embroidery and rights/device checks. No further direction reconfirmation is requested for work already authorized. PR review/merge remains human-controlled.

## 7. Delivery

Conventional commit and push on the requested feature branch; intended PR #16 → develop. Actual implementation SHA and created PR URL are appended after creation. No auto-merge or deployment.
