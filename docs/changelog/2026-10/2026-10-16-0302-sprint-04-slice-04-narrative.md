# Change Record: Sprint 4 Slice 4 — Tender Act 1 and the road home

- **Record ID:** CR-20261016-0302
- **Timestamp:** 2026-10-16T03:02:00+07:00 (Asia/Bangkok)
- **Sprint/Milestone:** Sprint4 Slice4, T7/T8, fixed5-PR Master Delivery Matrix
- **Operator:** Codex / Senior Software Architect, Lead Interactive Fiction Director, Narrative author
- **Authority:** Current PO directive explicitly authorizes actual Act1 rewriting, content/schema corrections under Open Mastery, T8 design and commit/push/PR16 to develop. No merge/deployment authorization.
- **Baseline / branch:** develop@ec12038 with PR14@6692c1b and PR15@f8ee156; `feat/sprint-04-slice-04-narrative`; T3thr <t.theerapat33@gmail.com> verified.
- **Status:** Integrated and MERGED into `develop` at commit `37bad50` ([PR #16](https://github.com/T3thr/JaoKob/pull/16)); normal entry stays archived 2.1 until Slice 5 promotion (T9/T10); final acceptance T11.

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

Implementation commit **`148ed4b1f121e3f648ba3faddd5a69da3b257c80`**, authored and committed by **T3thr <t.theerapat33@gmail.com>**, is pushed to `origin/feat/sprint-04-slice-04-narrative`. [PR #16](https://github.com/T3thr/JaoKob/pull/16) is **OPEN** against `develop` and attached to this chat. The authenticated GitHub account was verified as T3thr. This final documentation follow-up records the actual delivery identity; no source/test behavior changes after the recorded passing run. No auto-merge or deployment.

## 8. ADR-P0-021 remediation — intake and impact

The subsequent PO directive authorizes all six corrections in accepted ADR-P0-021, on this same branch and PR from `3164601`; no new slice/PR. Git identity is T3thr <t.theerapat33@gmail.com>, remote branch is current, and the pre-change baseline passes **990/990**, zero failures/cancellations/skips/todos (17,724.236ms). `docs/references/` remains unrelated and untracked.

Before implementation, contract1.1 records D1–D6 → T7/T8 ACs → narrative, emotion, callback, fairness and gift gates. Impact is authored Thai/localization and S5 design/verification, with no runtime dependency, schema/save/state/ID change or later-act production code. Existing A/B mechanics, cautious compensation, consent/repair and three endpoint IDs remain; additional self-reliant design choices provide the missing low-Bond route. HOME's earlier transformation shorthand is prospectively clarified as a living frog plus a separate poetic gift mirror under ADR-P0-021 D6. Archived2.1 entry and protected saves remain unchanged. Evidence and final delivery follow below after verification; human editorial approval is not inferred from automated tests.

### 8.1 Remediation delivered and trace

| Binding decision / acceptance | Concrete correction and verification |
|---|---|
| D1; T8-AC-05; TC-S4-FAIR-001/MAP-001 | Map1.1 §8 adds five distinct C choices using natural water/cover, preserving all A/B deltas and cautious+10. Core-backed design graph executes guards/effects from Bond0: self-reliant0, cautious→self-reliant15 and water→self-reliant20 all reach DAWN; threshold30 reaches NEARBY; original HOME70/80 and repair80 remain. Eight curated intermediate/final traces, seven anchors/twenty edges,114 eligible no-leaf trajectories (36HOME/57NEARBY/21DAWN); held206 and released/refused114 each. Two starting-health contexts produce1,096 scenario-trajectories with all endpoints reachable and no dead end, negative penalty or item gate. |
| D2; T7-AC-02/04; TC-S4-NARRATIVE-001 | Replace fourth-wall storm explanation with roots tearing loose, waves/silt/branches and a tadpole folding its tail. Unique nursery returns and five discovery/rest results replace copied blocks; all100 narration/result blocks are unique after whitespace/punctuation normalization. Actual package occurrences of หยุด fall46→3; this is a repetition check, not certification of literary quality. |
| D3; T7-AC-02; TC-S4-EMOTION-001 | Both coping branches keep searching/looking for family; common leaf/rest beats show unfamiliar roots, branches/silt and a broken upstream watercourse, then the remaining wet channel ahead. Night includes another call and remembered maternal touch. No unexplained abandonment or invented family fate. |
| D4; T7-AC-01/04, T8-AC-06 | A fast sibling and one who nudges/steals the lotus shell play imperfectly; mother adjusts the leaf pouch, nudges a caught tail and reacts to being bumped. Map §7 first reveals the girl atA4-004: water too far/shadow across escape, frog retracts, she moves sideways, later notices a withdrawn leg and adjusts again. Behavior teaches both parties; no name/private thoughts/rescue speech. |
| D5; T7-AC-03; TC-S4-CALLBACK-001 | Required opening shows the family's chipped large shell shelter; the small fifth river shell resembles it without claiming to be the same physical object. Collect/refuse/four replacements now evoke concrete shade, sibling tails, light and textures. Metadata and S5 held/released/refused/unseen callbacks agree; capacity and original emotional effects remain exact. |
| D6; T8-AC-07/08; TC-S4-GIFT-001 | Map §9 positively stages the living frog drinking/exploring/returning through an open garden route; separate childhood/adult gift images are intercut with active frog shots, followed by the gift card. Warmth/heart motif stays equal for every eligible pouch state. Adult red-heart embroidery is still an S5 art gap; no model change or new ending. |

### 8.2 Verification actually performed after remediation

- **1004/1004 unit cases**, all990 existing retained plus14 new,0 fail/cancel/skip/todo; final run34,414.255583ms. All36 pre-existing unit test files remain byte-identical to3164601. No assertion removed, weakened or skipped.
- Design runner `node tests/design/ending-trajectories.mjs` records every chosen edge and intermediate metrics; unit guards cover actual leaf ownership/history, voice30, help50, one-time optional repair, resolver29/30 and59/60 and crisis-before-repair. This is explicit design verification, not an assertion that S5 runtime exists.
- Reference validation:17 metaschemas/10 strict candidate cases/59 Save2 cursor cases. All17 published schemas and the exact2.1 archive stay byte-identical; every non-localized field of candidate3 (IDs, graph, effects, flags, defaults and cursor structure) is unchanged.
- Refreshed candidate browser:6profiles/21captures, full/refuse/cancel/replace/inspect/exact reload, empty/released comfort, secret Resume at200%/high/forced contrast, fresh complete journey and actual History;0 unexpected errors/external/3D requests. Sampled six-profile shifts0, final Save2 **6,243 bytes**. Installed action client adds two input-burst captures plus one paused reading capture; screenshots/state inspected, including new family prose, mobile/desktop offers, empty/released,200% and final History.
- Scoped artifact/link/hash checks pass. Final candidate is141,775 raw bytes /15,833 gzip, SHA-256 `25086b7e44d8c757d40e9f2515d0fafac6fa71fc55c81db5103811f8b25c5fb4`. Core/UI/assets/compatibility package are unchanged. Increased prose transfer remains within the existing critical-JSON budget; this is not a measured representative-device load percentile.

Raw TAP/JSON/screenshots and commands are in the separate [ADR021 evidence directory](../../../tests/e2e/evidence/sprint-04/slice-04/adr-021/README.md); earlier evidence is preserved. Contract1.1/map1.1, RFC0.2.5, SSOT0.4.2, portal, progress and root CHANGELOG are aligned. Accepted ADR rationale is unchanged.

### 8.3 Compatibility, limits, rollback and review

Schema2/content3/Save2 remain unchanged; no new save field, state, runtime dependency or migration. Normal entry remains archived2.1 until the existing T9/T10 promotion/cursor review. Design-only flags/choices in the fixture are S5 handoff data and cannot affect current player saves. Rollback uses a reviewed revert of this remediation; keep raw saves/backups/downgrade guards and never clear player keys.

The initial12-route legacy browser evidence is retained rather than rerun, since its source/Core/UI/archive are byte-identical; all original990 unit cases were rerun. Human Thai/Narrative/PO/Art final approval, device/AT/native400% zoom, formal security scanner, representative-device performance and S5 runtime/Grand Keepsake implementation remain unperformed. Mermaid source is reviewed without claiming rendered-diagram verification. T9–T11 stay in the final PR17; no sixth slice, new PR, merge or deployment. This reviewable remediation needs the existing human PR/editorial review, not another authorization to carry out the requested corrections.

### 8.4 Remediation delivery identity

Source/evidence commit **[`c00a8c71ca1be353ecb981e8b603657c60b44f40`](https://github.com/T3thr/JaoKob/commit/c00a8c71ca1be353ecb981e8b603657c60b44f40)** (`refactor(narrative): remediate Act 1 and ending reachability per ADR-P0-021`) is pushed to `origin/feat/sprint-04-slice-04-narrative`, updating the existing [PR #16](https://github.com/T3thr/JaoKob/pull/16) against `develop`. Author and committer are both **T3thr <t.theerapat33@gmail.com>**. This documentation follow-up records the actual delivered source identity; no source/test change follows the recorded verification. Private references remain untracked. No merge or deployment.

### 8.5 Integration and merge into develop

On 2026-10-17, Product Owner completed review and merged [PR #16](https://github.com/T3thr/JaoKob/pull/16) into `develop` at commit `37bad50`.
All 1,004 unit tests pass cleanly (100% pass, 0 fail, 0 skip). Sprint 4 progress reaches 4 of 5 PRs merged (80%). Slice 5 (Tasks T9, T10, T11) is the remaining sprint closeout slice.
