# Change Record: PR13 PO Review — Sensory Presentation Refinement

- **Record ID:** CR-20261015-0013
- **Timestamp:** 2026-10-15T00:13:10+07:00
- **Sprint/Milestone:** Sprint4 Slice1 / T1–T2 / PR13 review revision
- **Operator:** Codex / Senior Software Engineer & UI/UX Architect
- **Status:** Revised implementation verified; delivery on existing PR13, human acceptance remains open

## 1. Intake and authority

PO reviewed PR13 at `f91ef05` and rejects its aesthetic acceptance: stacked HUD/status pills, fragmented Decision surfaces, empty gradient Title and an airborne cutout tadpole. PO directs one frosted bar, quiet transient successful-save indication (fade within1.5s), full-screen existing lotus artwork, one Decision prompt/feedback surface, icon-bearing tactile choices, warm paper/Next breathing cue and a water-plane anchor/ambient occlusion. Work stays on `feat/sprint-04-slice-01-visual`, updating [PR13](https://github.com/T3thr/JaoKob/pull/13). No merge/deploy/new Sprint tasks are authorized. Existing untracked references are preserved.

## 2. Requirement trace and relevant DoR

`CR-0005` T1/T2 and current PO review; `FR-UI-001/002/003/005/007`, `FR-ACC-001..004`, `FR-LOC-001/003`, `GDD-UX-001..005/007`, `GDD-ACC-001..005/008/010`, `NFR-US-003..006`, `NFR-MA-001/002`, `NFR-PO-002/004`; existing `ADR-P0-001/005/012/014/015`.

Current PO supersedes the earlier Slice1 persistent successful-save presentation only: localized success text/dot is transient, occupies no layout row, never takes focus or plays sound; failure/memory-only/protected-record detail remains visible. Reduced-motion fades resolve without nonessential motion. This does not suppress authored feedback/deltas, content notices, error recovery or their accessible announcements. Success/error kinds come from Data projection, not Thai-text matching in UI.

Observable AC: one header surface at normal scale; no second capsule; saved indication invisible after≤1500ms without story/modal/focus mutation or replay on media refresh; full lotus Title without gameplay meters/audio loops; Decision merges authored context/feedback/question once with3 distinct native cards; visible correct-life-stage subject with an ellipse at its water contact plane; all controls44px and Thai1.75–1.9;200%/320px/error/forced colors/reduced-motion remain usable. Existing immutable RendererPort/media-reference contracts suffice. A reviewed Title expectation changes from no image request to one verified existing entry background; all old silent/no-character/ID/save invariants remain. No Core, package/schema/save/asset bytes or narrative effects change.

## 3. Impact, plan and evidence

Affected: UI CSS/renderer/icons, Data presentation and localized chrome/notice kind, focused tests and screenshot/evidence tooling. Title background reuses existing validated content asset through the verified loader/preloader. Core, orchestration, persistence, six domain states, stable content IDs/prose/choices and format1/content2.1/schema1.2 are retained.

Plan: archive original six desktop/mobile Title/Reading/Decision captures and hash manifest in `tests/e2e/evidence/sprint-04/slice-01/before-po-review/`; implement surfaces/anchors/transience; verify local browser at all six profiles, status timer/media/modal/focus and faults, all unit cases and12 canonical routes; inspect real captures; document Before/After and push PR13.

Evidence: **703/703** unit cases (all698 prior +5 new), 0 fail/cancel/skip/todo,23,796.573ms; **12/12** Chromium canonical routes, all save/metrics/flags/checkpoint/Resume/consent/duplicate-input/Bond/keyboard assertions retained; **29** after captures at six viewport profiles. Source/evidence manifest and reproduction in [Slice1 evidence](../../../tests/e2e/evidence/sprint-04/slice-01/README.md). IDs: TC-S4-VIS-001/STATUS-001/STATE-001/A11Y-001 and legacy canonical routes.

Actual browser: Chromium151.0.7922.34, isolated loopback origins/saves, no unexpected console/page/external-origin errors. Fade observation: opacity0.9→intermediate lower opacity→display:none;1500ms deadline with exact card/focus identity across media refresh. Native dialog identity/scroll/busy focus retained. Image/quota/protected-save detail and44px targets/320px+200%/forced colors/OS+app reduced motion checked. Initial local compressed transfer324,062bytes and sampled contrast≥9.44:1 are smoke observations, not physical-device percentile certification.

Visual QA caught a CSS selector that kept the expired dot visible despite `hidden`; a computed-display assertion and explicit quiet-phase rule resolve it. A fault test also exposed a pre-existing harness double-application race; `slice-root` now avoids normal bootstrap auto-mount. Production bootstrap is unchanged. These failures were fixed before the complete affected checks were rerun. Source contract amendment is recorded before implementation; no new FR/Canon/ADR is self-approved.

## 4. Compatibility, rollback and outstanding review

No save migration; no new runtime dependency/CDN/media/3D/content assets. Reviewable UI/Data-presentation revert restores prior display with the same saved progress. Original icon strokes are code-owned; existing art/Sarabun provenance retained. PO visual/Thai/crop walkthrough and physical devices/AT/Safari/Firefox remain human gates, not claimed from screenshots alone.

## 5. Delivered artifacts and Before / After

- UI: `dom-renderer.js`, `chrome-icons.js`, Thai chrome resource, `styles/{tokens,layout,components,motion}.css`. One frosted header surface; quiet-dot timer/cancellation/announcement policy; Decision context inside paper; original choice/sound/retry icons; Next breathing and tactile hover/press/disabled surfaces; water-plane scale/portrait crop/soft ellipse; forced/high contrast and reduced-motion variants.
- Data presentation only: `content-presentation.js` reuses the validated entry background on Title without entering a node/character/audio; `content-view-model.js` adds `notice.kind` for transient-success versus persistent attention. No persistence or Core contract mutation.
- Verification: five new focused unit cases, explicit Title background expectation amendment, scoped browser single-instance/fade/one-surface assertions, existing route contrast-surface adaptation; current evidence and preserved Before hashes; original SVG source provenance updated.
- Audit/trace: this record, root CHANGELOG, SSOT0.2.3 with onlyT1/T2 checked, and portal/evidence README. [Before/After viewer](../../../tests/e2e/evidence/sprint-04/slice-01/before-after.html) shows actual paired desktop captures; six baseline screenshots are preserved separately.

| Screen | Before f91ef05 | Revised candidate |
|---|---|---|
| Title | Empty gradient, wide tool pill, no illustrated setting | Full lotus art/soft ambient vignette, calm single-line desktop title, corner icon tools, warm CTA with hover/press |
| Reading | HUD and saved/settings capsules stack; subject in the bright air gap | One compact frosted bar; dot expires≤1.5s; organic paper/Next; subject lowered into water with ambient ellipse/ring |
| Decision | Separate context/prompt/generic heading +3 full-width button slabs | Authored text retained in one paper card, generic heading remains semantic-only;3 icon cards in desktop row/mobile stack |

Successful save now produces no live announcement/sound/focus move; feedback/deltas and failure recovery still announce. UI ephemeral timer/state does not enter save/checkpoint/history. Original image/portrait/font bytes and schema/content/save versions stay identical.

## 6. Verification not performed, approval and delivery

Not performed: physical touch/Safari/iOS/Firefox, VoiceOver/NVDA, native400% browser zoom, representative-device load/frame percentile, final human Thai/art/water-plane walkthrough. PO's earlier candidate rejection is recorded; this revision requests review through updated PR13, not self-certified aesthetic acceptance. No merge/release/deploy/new Sprint tasks.

Preview server is already running at `http://127.0.0.1:8001/`; refresh the existing tab. To start again from the repository root: `python3 -m http.server 8001 --bind 127.0.0.1`. Comparison: `/tests/e2e/evidence/sprint-04/slice-01/before-after.html`. Commit/push use the existing feature branch and required T3thr identity; actual Git hashes/PR head are recorded by immutable history.
