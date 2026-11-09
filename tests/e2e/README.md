# Browser verification · tests/e2e

Run from the repository root with Node.js and an existing development installation of Playwright and Chromium. The repository adds no npm package, lockfile, bundler or runtime dependency. Every runner starts its own loopback HTTP server and isolated browser contexts, never the player's browser profile or real save data, and exits non-zero on any failure. `JKB_PLAYWRIGHT_PATH` points at Playwright's `index.mjs` when `playwright` does not resolve on its own; `JKB_CHROMIUM_PATH` uses a Chromium already on the machine; `JKB_EVIDENCE_DIR` writes the output elsewhere (useful for a rerun that should not replace committed evidence).

Browser runs prove what a machine can see. Physical iPhone and Android devices, VoiceOver and NVDA listening, Safari and Firefox, human Thai reading and PO visual acceptance stay separate gates (SSOT §6).

## Sprint 2–4 runners (removed in C5e)

`act1-playthrough.mjs`, `visual-novel-benchmark.mjs`, `narrative-slice.mjs`, `keepsake-pouch.mjs`, `session-history.mjs`, `closeout-rehearsal.mjs`, `sprint-04-visual-slice.mjs` and `vn-runtime-ergonomics.mjs` drove the Sprint 2–4 runtime, which C5e removed when `index.html` became the Journey ([CR-20261109-0500](../../docs/changelog/2026-11/2026-11-09-0500-c5e-journey-entry-and-sprint-4-runtime-removed.md), [superseded assertion register §5](../../docs/traceability/sprint-05-superseded-assertions.md)). They remain in git at `39bf56b`; their recorded evidence stays in [evidence/sprint-02](evidence/sprint-02/), [evidence/sprint-03](evidence/sprint-03/) and [evidence/sprint-04](evidence/sprint-04/) as history.

## Sprint 5 · C4 Journey screens

`journey-c4-design-system.mjs` serves the repository on a temporary loopback port and drives the PO review page (`docs/design-system/evidence/journey-review/play.html`), which runs the production Journey modules on the real application:

```sh
JKB_PLAYWRIGHT_PATH=/absolute/path/to/playwright/index.mjs node tests/e2e/journey-c4-design-system.mjs
```

It checks 6 viewports × text 100/150/200 % × three Act 1 states (layout, face band, nested and sideways scroll, targets), contrast on the real pixels behind each text with the text hidden (dialogue and cards ≥ 7 : 1, HUD ≥ 4.5 : 1, also over a white plate), reduced motion, reduced transparency through the CDP media feature, high contrast, forced colors, keyboard-only play, layout shift and memory across three whole plays. `JKB_EVIDENCE_DIR` overrides the output folder (default [evidence/sprint-05/c4](evidence/sprint-05/c4/report.json)). Safari, physical devices and screen-reader listening are not covered.


## Sprint 5 · C5b camp, micro-actions and keepsake offer

`journey-c5b-encounters.mjs` uses the same loopback server and review page, and `play.html?package=mini` for the screens Act 1 does not have (the keepsake offer, a hold and a stitch):

```sh
JKB_PLAYWRIGHT_PATH=/absolute/path/to/playwright/index.mjs node tests/e2e/journey-c5b-encounters.mjs
```

It checks 5 viewports × text 100/200 % × six states (the C1 camp board, C1 after one drop with the activity's line, MA-1 tap, hold, stitch, the offer): no sideways or nested scroll, every visible button ≥ 44 × 44, the dock panel below the face band (fit) or below the stage strip (flow), the camp clock never over a panel and the stitch guide points 28–32 px wide; keyboard-only play through the camp, MA-1 and the offer; layout shift while the camp board and the activity lines swap; no console error and no request outside the page's origin. When the installed Playwright expects a browser build that is not on the machine, `JKB_CHROMIUM_PATH` points it at a Chromium already there (nothing is downloaded). Output: [evidence/sprint-05/c5b](evidence/sprint-05/c5b/report.json). Safari, physical devices, screen-reader listening and the PO's eye are not covered.

## Sprint 5 · C5c title, modals and ending cards

`journey-c5c-panels.mjs` drives the same review page, which since C5c shows only the real screens (title, play, settings and pouch modals, chapter end), and `play.html?package=mini` for the ending choice:

```sh
JKB_PLAYWRIGHT_PATH=/absolute/path/to/playwright/index.mjs node tests/e2e/journey-c5c-panels.mjs
```

It checks 5 viewports × text 100/200 % × five states (title, settings modal, pouch modal with its memory, the three ending cards, the chapter end): no sideways scroll, every visible control ≥ 44 × 44, a modal inside the viewport with its close button in view, the ending cards and the chapter end below the face band or the stage strip; keyboard-only: Enter on the title starts, `I` opens the pouch and Escape gives focus back, Tab stays inside the settings modal, the chapter end leads back to the title with focus on continue; no console error and no request outside the origin. `JKB_CHROMIUM_PATH` works as in the C5b runner (the C4 runner accepts it too). Output: [evidence/sprint-05/c5c](evidence/sprint-05/c5c/report.json). Safari, physical devices and screen-reader listening are not covered.

## Sprint 5 · C5d verified Journey media

`journey-c5d-media.mjs` drives the same review page on the media resolver and the shared image cache (T3): every image is read same-origin, its WebP header and SHA-256 checked against asset manifest v2, and decoded once under the package identity.

```sh
JKB_PLAYWRIGHT_PATH=/absolute/path/to/playwright/index.mjs node tests/e2e/journey-c5d-media.mjs
```

It plays the whole Act 1 and the whole mini package one command at a time with `crypto.subtle` removed (the insecure-context case of a phone on a LAN address) and checks after every command: no image refused, the cache within 32 MiB, every drawn image a decoded `blob:` URL with pixels, every image request same-origin under `assets/images/`. It also checks that an image already drawn keeps its pixels after its object URL is revoked, and serves a damaged opening plate: the plate is never drawn, Act 1 still plays to its boundary with no console error, and once the file is whole the plate is read again without a reload. `report.json` records the peak bytes kept and held on screen. Output: [evidence/sprint-05/c5d](evidence/sprint-05/c5d/report.json). A real LAN address, Safari, Firefox and physical devices are not covered.
