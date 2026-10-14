# Change Record: Sprint 4 Slice 1 — Warm Parchment & Three-Screen Presentation

- **Record ID:** CR-20261014-2314
- **Timestamp:** 2026-10-14T23:14:00+07:00
- **Sprint/Milestone:** Sprint 4 / Slice 1 / T1–T2
- **Operator:** Codex / Senior Software Engineer, UI Architect, Game Director
- **Status:** Implementation/automated verification delivered; PR and human PO aesthetic/AT/device review remain separate

## 1. Objective and authority

PO authorizes T1–T2 source implementation, verification, audit, commit, feature-branch push and PR to develop. Baseline `develop@d31652a`; feature branch `feat/sprint-04-slice-01-visual`. Identity verified as `T3thr <t.theerapat33@gmail.com>`. Untracked `docs/references/` is preserved and excluded.

Only styles and presentation change. T0 and T3–T11 remain open. No Pouch, Log, Intent Tag catalog, narrative rewrite, Core/save/schema changes, models, merge or deployment.

## 2. Traceability and task readiness

Requirements: `CR-0005` visual direction; `FR-UI-001/002/003/005/007`, `FR-ACC-001..004`, `FR-LOC-001/003`, `GDD-UX-001..005/007`, `GDD-ACC-001..005/008/010`, `NFR-US-003..006`, `NFR-MA-001/002`, `NFR-PO-002/004`; accepted `ADR-P0-001/005/012/014/015`.

Relevant T1–T2 DoR is satisfied by PO's current implementation directive and proposal §§3–4: observable Title/Reading/Decision outcomes, safe localized existing immutable VM, unchanged story transitions and Save format 1/content 2.1, existing licensed self-hosted Sarabun and prototype images, renderer/unit/browser fixtures, responsive/reduced-motion/contrast/focus checks. Inventory contracts and future narrative approvals do not govern this presentation-only slice.

Impact: UI DOM, CSS, accessibility, chrome localization and focused tests. Core, content IDs/prose/graph, Data parsing, persistence, schema, runtime dependencies and original media remain unchanged. Renderer owns ephemeral view/focus references only; no domain mutation.

## 3. Plan and artifacts

1. Consolidate six CSS layers into moss/amber/glass/parchment tokens and responsive reading composition.
2. Separate Title, Reading and Decision controls; keep exploration, confirmation, content notices, recovery and completion working.
3. Move textual operational status to a persistent utility rail; retain scene, focus and settings dialog on status-only updates. Keep feedback/deltas in a dedicated response region.
4. Add focused renderer regressions and real Chromium visual/fault/accessibility checks, then run all existing unit and canonical routes without weakening gameplay assertions.
5. Record actual evidence, update only T1/T2 WBS, and deliver a reviewable PR.

## 4. Verification and evidence

- `node --test tests/unit/*.test.js`: **698/698**, all691 existing cases retained +7 new renderer regressions; zero fail/cancel/skip/todo;43,401.554ms.
- Existing `tests/e2e/act1-playthrough.mjs` with `JKB_EVIDENCE_DIR` override: **12/12 Chromium canonical routes**, checkpoint/reload/exact Resume, full final meter/flag assertions, locked Bond DOM/AX secrecy, keyboard focus/duplicate-input/raw-save-consent/storage faults,320px/200% text and44px targets; zero unexpected errors. Contrast samples≥9.44:1.
- New `tests/e2e/sprint-04-visual-slice.mjs`: **29 captures / six viewport profiles**, actual production screens and isolated native renderer fixtures; exact status/card/action/modal identity and focus/scroll retained, latest view revision, one live announcement, no domain mutation, image/quota recovery, high/forced contrast/reduced motion/opaque glass fallback.
- `git diff --check`: pass. Core/Data/bootstrap/content/schema/model files unchanged; same-origin runtime only, safe DOM, no runtime dependency. Original UI SVG geometry/fibre texture recorded in `assets/provenance/sprint-04-visual-slice.json`; existing media/fonts retained. Personal reference photos excluded.
- Evidence and reproduction: [Slice1 bundle](../../../tests/e2e/evidence/sprint-04/slice-01/README.md). Evidence IDs: `TC-S4-VIS-001`, `TC-S4-STATUS-001`, `TC-S4-STATE-001`, `TC-S4-A11Y-001`, scoped `TC-S4-ARCH-001` and legacy canonical routes.

Browser verification initially found a390px Decision fit failure and an extra sound action interrupting Title Shift+Tab order; both were corrected, then the complete affected suites rerun. No route assertion was removed, reduced or skipped. Original glyph fallbacks remain available to minimal injected DOM hosts; real browsers render original SVG strokes.

### Delivered artifact manifest

Created: `src/ui/components/chrome-icons.js`, `assets/images/ui/paper-fibres.svg`, UI provenance record, scoped S4 browser runner/evidence and this audit.

Modified: all6 CSS layers; `dom-renderer.js` persistent landmarks/card/reading focus, utility patches, current-revision intents and announcement dedupe; `settings-dialog.js` in-place audio-status patch; Thai chrome save label;7 additional renderer tests; existing route runner output/MIME/contrast-location adaptation; SSOT T1/T2/status/trace and root CHANGELOG/docs portal.

No files deleted; untracked `docs/references/` preserved. Existing prototype sprite/background are not redrawn; final water-plane/light/crop judgement remains PO/Art review. Decision markup is ready for T9; actual Intent Tags are deliberately not claimed as delivered by T1/T2.

## 5. Compatibility, rollback, risks and approvals

No migration: content 2.1.0, schema 1.2.0 and save format 1 stay unchanged. Revert this slice's UI/CSS changes to restore presentation; saved story state remains compatible. Required human PO aesthetic/Thai review and real-device/VoiceOver/NVDA/Safari/Firefox checks are reported separately from automated Chromium evidence. No claim of AAA/art or full WCAG certification through AI self-review.

## 6. Delivery and local preview

Commit subject follows PO's exact request: `feat(ui): handcrafted warm parchment and three-screen presentation (Sprint 4 Slice 1)`; footer traces `CR-0005`, `CR-20261014-2314` and UI/accessibility requirements. Push only `feat/sprint-04-slice-01-visual`; PR targets `develop`, with no agent merge.

Run `python3 -m http.server 8000 --bind 127.0.0.1` from the repository root and open `http://127.0.0.1:8000`. There is no npm dev script/package manifest. Start a new game to see the Reading beat, advance through the nursery and choose its join-family action to see the three Scene3 cards. Settings allows200% text, high contrast and reduced motion.

Approvals still required: PO/Art visual walkthrough, Thai/Narrative presentation review, Accessibility real-device/AT/browser matrix, then human PR review/merge. Remaining Sprint4 tasks stay unchecked. No final acceptance, full-game completion, release or deployment is asserted.
