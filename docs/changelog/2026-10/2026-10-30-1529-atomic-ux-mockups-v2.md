# Change Record: CR-20261030-1529 — Atomic Gameplay UX Mockups v2

| Metadata | Value |
|---|---|
| Change ID | `CR-20261030-1529` |
| Date | `2026-10-30T15:29:52+07:00` |
| Author | `T3thr <t.theerapat33@gmail.com>` |
| Branch | `feat/sprint-05-planning-ssot` |
| Trace | `JKB-DS-UX-ATOMIC-05 1.0.0`, `ADR-P0-032 D7–D8`, `ADR-P0-033 D0–D5`, `ADR-P0-019` |
| Review PR | [PR #18 → develop](https://github.com/T3thr/JaoKob/pull/18) |

## Outcome and scope

Delivered ten deterministic device mockups (five modes × desktop/mobile), PNG and lossless WebP, from one shared CSS/SVG component harness. Thai text is rendered using self-hosted Sarabun. Existing canonical Tachie/item files and text-free plates are copied unchanged; no new image generation is used.

This is a review artifact only. Runtime, game rules, narrative, schemas, saves, dependencies and deployment are unchanged. Existing v1 files and Claude's Markdown/JavaScript-module sources retain their bytes. Including v1 and the supplied Atomic 05 contract in the review branch makes the before/after page self-contained; their content is not edited.

## Changed artifacts

- [v2 artifact guide](../../design-system/ux-mockups/v2/README.md), [manifest](../../design-system/ux-mockups/v2/ux-mockups-v2-manifest.json) and twenty final PNG/WebP files.
- [Shared CSS](../../design-system/ux-mockups/v2/harness/ux-components.css), [screen harness](../../design-system/ux-mockups/v2/harness/render-screen.html), two master device shells and reproducible Python capture/audit scripts.
- [Offline v1 → v2 review](../../design-system/evidence/ux-mockups-v2-review.html) with mode/device tabs and face-band/target toggles.

## Verification performed

- Native macOS Google Chrome CLI process, exact 1440×900 / 390×844 content viewports at DPR 2, ten captures. Python standard-library native DevTools Emulation handles macOS's minimum window width; no external browser-automation package is used. Pillow inserts viewports 1:1 into two extracted reference frames.
- [Six self-audit gates](../../design-system/ux-mockups/v2/evidence/self-audit.json): shared HUD/icon/card system, Thai source-table parity, in-world assets, eye anchors and UI clearance. No horizontal overflow, broken images, clipped card text or undersized controls.
- [HUD pixel proof](../../design-system/ux-mockups/v2/evidence/hud-pixel-audit.json): identical 358×64 CSS px interior on all ten screens, including desktop/mobile. Transparent antialias fringe belongs to the scene and is excluded.
- Exact Thai text compared with the PO's Atomic 05 Markdown table, not duplicated harness expectations. Three equal ending cards in each layout; no item image or coin inside any ending card.
- Twenty final images decode; lossless WebP pixels equal PNG; device-shell pixels are identical per device and screenshot insertion resamples no UI. All ten device PNGs opened for visual inspection.
- 120 pre-existing artifacts preserved; 21 asset copies have source-identical SHA-256. Measured contrast for primary/muted text, intent and counter/repeat tags is at least 4.752:1. The locked repeat background is unchanged; a shared darker label-ink token supplies sufficient contrast.

- Offline review page: all 15 mode/device combinations, native keyboard arrow navigation, face-band/target toggles and desktop/mobile no-overflow checks pass. [Review audit](../../design-system/ux-mockups/v2/evidence/review-audit.json).

## Verification not performed

Physical iPhone Safari/MacBook interaction, full WCAG/assistive-technology conformance, complete-game keyboard journeys, runtime unit/integration/state/save regression and release gates were not run. Raster device frames do not certify actual Safari execution.

## Migration, rollback and risks

No migration. Roll back only v2 outputs, its comparison page and this delivery registration; preserve v1 and Claude sources. The supplied left-facing neutral adult sprite is used for screen 2 because a determined-left file is absent, following the inward-facing alternative explicitly allowed in Atomic 05. Review images have no production rights/release approval implied.

## Approvals and follow-up

PO visual review and PR review remain pending. No auto-merge or deployment. This design delivery does not complete any production implementation WBS item; Sprint 5 remains 0/20.
