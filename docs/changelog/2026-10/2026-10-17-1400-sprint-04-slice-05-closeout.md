# Change Record: Sprint 4 Slice 5 integration and closeout

- **Record ID:** CR-20261017-1400
- **Timestamp:** 2026-10-17T14:00:28+07:00 (Asia/Bangkok)
- **Sprint/Milestone:** Sprint 4 Slice 5, T9/T10/T11, final PR #17
- **Operator:** Codex / Senior Software Architect, Lead Interactive Fiction Director, Master Craftsman
- **Authority:** Current PO directive explicitly authorizes assessment, source/art/integration/verification, commit/push and PR17 to develop. No merge/deployment authorization.
- **Baseline/branch:** develop@bc167d3 after PR16@37bad50; feat/sprint-04-slice-05-closeout. T3thr <t.theerapat33@gmail.com> verified. Private references remain untracked.
- **Status:** Engineering delivery prepared for PR17 review. Final owner/manual acceptance, merge and deployment are not performed.

## 1. Outcome, scope and readiness

Deliver T9 truthful localized Intent Tags and five original 2D item images/fallback, T10 content3 promotion with exact legacy continuation, and T11 consolidated verification/trace/static-artifact rehearsal. Architectural assessment and observable success/failure cases are fixed first in the [closeout contract](../../design-system/sprint-04-closeout-contract.md). Baseline `node --test tests/unit/*.test.js`: **1004/1004**,0 fail/cancel/skip/todo,27,238.161625ms.

The chosen compatibility strategy keeps Save2/content2.1 on its exact archived graph and starts new sessions on3.0; no guessed semantic cursor or checkpoint conversion. Presentation metadata owns motive/icon/skin/crop, never eligibility/effects. Same-origin hash-verified demand-loaded artwork retains prose if it fails. Existing schema/save fields, pure Core, all30 actions and story effects are preserved. No later-act runtime, extra ending, 3D/dependency/backend/telemetry, private photo, merge or deploy.

## 2. Requirement trace and implementation plan

ADR-P0-019/020/021; CR-0005 T9/T10/T11; FR-UI-001/002/003/005/007, FR-CNT-001/002/004/005/006, FR-LOC-001/003, FR-SAV-001..007/009, FR-ENG-008/009, FR-ACC-001..004; NFR-US-003..006, NFR-MA-001/002, NFR-PE-001..005. Contract maps these to TC-S4-CHOICE/ASSET/CONTRACT/ARCH/STATE/SAVE/RETRY/GRAPH/LOG/E2E/VIS/A11Y/PERF/NARRATIVE/FAIR/MAP/GIFT evidence.

Sequence: strict catalog/schema and original asset provenance; Data projection/native UI/crop/fallback; version-bound bootstrap/session/media and guarded saves; focused tests then full retained suite/reference/trajectory/browser/performance/static/rollback checks; inspect actual screenshots; record evidence and commit/push/PR17. Existing CR-0005 authorizes the cross-layer scope; selecting its compatible-continuation option does not create a new Canon or breaking Save contract. Final human/device/AT acceptance remains explicitly distinguishable from automated evidence.

## 3. Implementation and architectural decisions

T9 adds a standalone presentation1 schema with a generated local catalog entry. All17 published schemas remain byte-identical. Explicit3.0 and2.1 catalogs bind stable action IDs to short Thai motives and existing decorative vector icons; they never derive eligibility or tags from meters. All30 current authored actions are covered. The common paper skin preserves equal weight. Original outcome previews are described separately outside the button and reading card. Unknown optional entries retain the normal label; invalid version/locale/schema/reference/crop/text metadata fails decoration safely with a localized notice.

Five hand-authored SVGs extend the moss/ochre paper palette. Their dimensions, exact bytes/SHA-256, Thai alt and owner provenance are registered under content3. The original leaf/provenance remains unchanged. SVG support is intentionally restricted to geometry/gradient elements, local fragments, matching MIME/extension and digest; executable elements/handlers/styles, foreign resources, XML declarations/entities and non-geometry input fail safely. Pouch artwork uses the existing decode cache, fixed128px space and generation-checked leases. Redraw/close/failure releases images; text/status/memory remains visible. Unseen objects are never exposed to showcase art. Only five asset records are appended to the merged Act1 package; story strings, graph, actions and effects are unchanged.

T10 introduces `content-sessions.js` at the composition root. New Game always binds the primary3.0 graph; exact2.1 continuation is loaded only when recovered versions require it. The existing2.0→2.1 proof and pure Save1→2 transform run before validation on that archive. Payload and checkpoint are independently admitted by the matching orchestrator. Recover and Resume execute no entry effects or writes. Later accepted legacy actions keep content2.1/Save2; a confirmed New Game starts3.0. Cancellation/stale consent retains raw slots. Mixed content generations continue only in memory when necessary, and stage/commit guards reject a later3.0 record even against a higher-revision legacy session. No new storage key, save field, inferred cursor or empty-pouch repair is used.

The active orchestrator, projection and media registry share one content binding. Registry initialization is generation-checked; both versions share one bounded32MiB image cache and16MiB audio adapter. Late old registry/image failures cannot paint or mark the new session unavailable. History remains session-only and view actions do not write saves or restart audio loops. Core source is unchanged and remains free of DOM/storage/Data/UI imports.

## 4. Change inventory and trace

| Artifact | Purpose / trace |
|---|---|
| `docs/design-system/sprint-04-closeout-contract.md`; CR-0005 | Assessment/readiness, choice/media/save policy and observable T9/T10/T11 gates before source |
| `specs/schemas/presentation-catalog.schema.json`; local schema catalog | Additive strict contract, FR-CNT-001/006, TC-S4-CONTRACT-001 |
| `src/data/content/presentation{,-catalog.js}`; runtime/projection helpers | Thai intent/icon/paper/crop, exact references and fail-soft presentation, FR-UI/LOC/CNT, TC-S4-CHOICE/ASSET |
| Five `assets/images/keepsakes/*` SVGs; content3 registry/provenance; package asset list | Original demand-loaded2D art, truthful encountered-item fallback and rights/hash/path checks |
| `src/ui/components/{keepsake-pouch-dialog,stage-view}.js`; renderer/styles/messages | Native safe DOM, lease disposal/crops, accessible intent/cue/fallback, ADR-P0-019/020 |
| `src/bootstrap/{content-sessions,index,media-composition}.js`; `index.html` | Version-bound admission/resume/reset/media; critical module preload, FR-SAV/ENG, NFR-PE |
| `tests/helpers/closeout-session.js`; three new closeout unit files |56 new cases for actual production defaults, catalog/media, exact cursor/checkpoint and race protection |
| Retained/adapted browser runners; new `closeout-rehearsal.mjs`; schema reference runner | Legacy/current integration, visual/keyboard/touch/fault/rollback/performance evidence |
| Static allowlist and `tests/release/verify-static-artifact.mjs` |87 explicit files, regular paths/imports/rights/hash/pattern inspection,76-file baseline rollback artifact, no deployment |
| SSOT0.5.0, documentation portal/contracts/spec catalog, CHANGELOG/progress/evidence | Requirement→design→artifact→verification→PR17 trace; manual gates and Sprint5 boundary remain explicit |

The legacy browser runner retains all12 route outcomes/metrics/flags/checkpoints and14-node/21-edge graph witnesses. Its route entry now seeds a reviewed archived save and uses the normal production Resume. Old/corrupt explicit replacement now expects content3, and primary parse/schema faults target the promoted package. These are version-traced changes to browser setup, not weakened assertions. No existing unit test is edited, deleted or skipped.

## 5. Verification performed

Evidence and exact commands are in [the consolidated bundle](../../../tests/e2e/evidence/sprint-04/slice-05/README.md). Full final `node --test tests/unit/*.test.js`: **1060/1060**, all1004 baseline cases plus56 new,0 fail/cancel/skip/todo,23,629.599ms. Independent local Ajv:18 metaschemas,10 current package cases,59Save2 cursor instances,47Pouch cases; retained presentation reference12schemas/36cases. New catalog reference13structural cases,11 semantic/text/reference negatives,21 byte-identical published artifacts and exact unchanged non-asset story data. No schema network fetch or runtime Ajv dependency.

`node tests/design/ending-trajectories.mjs` passes unchanged:7anchors/20edges,8curated traces and1,096 scenario-trajectories across8contexts. Self-reliant Bond0/15/20 paths retain reachable END-DAWN; original NEARBY/HOME compensation/consent/fairness remains. This verifies the Sprint5 design with Core transactions, not unimplemented later-act runtime.

Chromium151.0.7922.34:12 archived production-continuation journeys;5 legacy captures;6 current viewport profiles/21 captures (320×568,390×844,768×1024,1440×900,2560×1440,844×390);3 installed web-game-client captures with semantic state. Current New Game reaches rest through24 visited nodes, all three moments, four held items and one released memory; final save6243bytes. Full/cancel/replace/reload, empty/released comfort,200% Thai/high/forced colors,44px controls, keyboard/focus/Bond secrecy and strict parse/schema/storage/media negatives pass. All six measured layout-shift totals are0. Displayed choices are captured after local pagination/font/media readiness; fixtures use production loading defaults. Screenshots and semantic state were opened and visually inspected.

The staged artifact is exercised through its actual index at root and `/JaoKob/`. The old bc167d3 artifact resumes exact2.1 and preserves a3.0 raw record with no Resume or replacement on cancel. Excluded docs/specs/tests/.git/private/model paths return404. All five encountered SVGs decode; integrity faults preserve text/status and128px art geometry. Optional catalog failure remains playable. The final rehearsal also records actual emulated touch and WebAudio inspection, with physical listening/device certification explicitly excluded.

Initial Fast3G/CPU4x cold p75=3095.4ms exceeded the3000ms budget. HTML modulepreload starts the necessary loader/validator/schema/orchestration modules earlier, without extra downloads or dependencies; the next identical20cold/20warm series observed2900.4/326.5ms, but a repeat at3011.7ms still exceeded the cold budget. Preloading all four necessary critical modules yields final exact-artifact cold/warm p75=2923.3/324.4ms, with explicit budget assertions. All earlier budget observations are retained and distinguished from functional checks. Driver elapsed time is never substituted for input performance. Resource Timing, trusted input→rendered DOM→next rAF,150 clicks across5full-Pouch runs, and3independent30s rAF samples distinguish pre-paint callbacks from actual displayed frames.

## 6. Verification not performed, risks and approvals

Not performed: physical reference mobile hardware/painted-frame timing, Safari/iOS/Firefox, VoiceOver/NVDA and human perceptual listening, final Thai/Art/PO acceptance, hosted Pages verification, merge/tag/release/deploy. No independent formal security certification is claimed; artifact/credential/static/network checks are scoped inspections. These remain named owner gates in the SSOT, not silently passed by test counts. The five-slice engineering delivery is complete for review;4/5 PRs remain merged until PR17 is accepted/merged by the owner.

The archived graph deliberately retains original prose and item semantics for current players. Starting the rewritten story is an explicit New Game choice; legacy progress is not converted. Assets remain owner-review artwork. The first-offering scene uses authored neutral-stage fallback when no background image is registered; no scene art or future3D is invented. The Act2–5 map/red-heart model gap and full-game E2E remain Sprint5 work. Private `docs/references/` stays untracked and is excluded from staging/artifacts.

## 7. Migration, rollback and operational delivery

Save2/schema2 is unchanged. Current3.0 identity restore and exact2.1 continuation are proved for active and checkpoint cursors. Save1/2.1 and proved2.0→2.1 use the existing leaf mapping independently, with exact original backup bytes on first accepted write. Unknown/integrity-bearing unproved/corrupt/future or mixed records remain protected; no downgrade/clear/replay is authorized by recovery.

Rollback requires an owner-reviewed revert/PR. Preserve raw3.0 records; the prior application must remain unable to overwrite them. The local rollback rehearsal proves that behavior while admitting exact2.1, without checkout/reset/history rewriting or deployment. Local staging requires fresh absolute directories outside the repository and never deletes a caller's existing directory. No automation or Pages workflow is created.

Delivery: branch `feat/sprint-04-slice-05-closeout`, requested Conventional Commit subject `feat(closeout): deliver Sprint 4 Slice 5 integration and final acceptance`, with CR-0005/CR-20261017-1400 in the body. Identity must be T3thr <t.theerapat33@gmail.com> at commit. [PR17](https://github.com/T3thr/JaoKob/pull/17) targets develop; commit/head/push attachment is recorded after successful creation. No force push, merge or protected-branch write.

### Final exact-artifact acceptance measurements

The final runner passes all explicit functional/performance assertions:20cold/20warm under Fast3G/CPU4x,150trusted input samples across5full-Pouch runs on the recorded native host (p95=8.6ms),3×30s CPU4x rAF series (3600/3601/3600intervals; p95=9.9/9.9/9.8ms;0intervals>20ms). These remain pre-paint headless observations. Critical encoded transfer166391bytes, full-Pouch seed Save2=5404bytes, completed actual journey6243bytes. The full87-file static distribution including legacy/fonts/audio is647077gzip bytes; it is not all initial transfer. Current/rollback inventories bind every runtime file hash.

Sixteen final-artifact captures include actual root/subpath, original five-item detail, integrity fallback, invalid optional catalog, protected rollback save and touch Pouch/History. WebAudio retains one music and one ambience voice,3072000decoded bytes/0reserved within16MiB, identical desires/voices/canonical bytes through view actions. All six current layout profiles measure CLS0; no unexpected page/console/external-network errors. Final HTML punctuation/icon regression7/7 also passes after preload changes. Remaining human/device/AT gates stay open.

Final review additionally found that a successfully initialized current session must clear an archived session’s prior unavailable-media notice. A targeted regression and actual browser witness cover failed2.1 registry→Finish→confirmed3.0 New Game, while retaining late-result guards. Final unit count1060 includes this56th added case; no old assertion is changed.

## 8. Remote delivery confirmation

Implementation commit `68eb72c6b456e614944724e553692745f1ef9840` uses the requested Conventional Commit subject and T3thr as both author and committer. GitHub authentication is also T3thr. The feature branch was pushed with normal history to origin and [PR17](https://github.com/T3thr/JaoKob/pull/17) was created against develop and attached to this Codex chat. No protected branch was written, merged or deployed.

All87 working-tree runtime hashes match the measured/static inventory. Complete unit TAP and resource/input/frame measurements are retained in gzip archives with uncompressedSHA-256/byte length; small reports retain the review summaries. Archives were restored and checked,169relative Markdown links resolve, and staged whitespace checks pass. Private references remain the only unrelated untracked directory. The final installed action-client run was repeated after the media-status fix and its screenshots/state inspected; local diagnostic servers and browser contexts are closed.

This governance follow-up records remote delivery only; it changes no measured runtime. PR17 review/merge and the named human/device/AT gates remain open. Source, schema, test evidence, migration/rollback and the Sprint5 handoff are fully submitted within the fixed fifth slice.
