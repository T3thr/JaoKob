# Act 1 browser playthrough verification

Trace: CR-0002 D3/D4, ADR-P0-014, FR-ENG-002/008, FR-SAV-001/006/007/009, FR-ACC-001/002, GDD-UX-003.

Run from the repository root with Node.js and an existing development installation of Playwright/Chromium. This repository adds no npm package, lockfile, bundler or runtime dependency. `act1-playthrough.mjs` creates a temporary loopback HTTP server and isolated browser contexts, then closes them. It never uses the player's browser profile or real save data.

```sh
node --test tests/unit/*.test.js
JKB_PLAYWRIGHT_PATH=/absolute/path/to/playwright/index.mjs JKB_HEADED=1 node tests/e2e/act1-playthrough.mjs
```

If `playwright` already resolves from the development environment, omit `JKB_PLAYWRIGHT_PATH`. Omit `JKB_HEADED` for headless execution. The script fails with a nonzero status on an assertion failure; there are no skipped routes or weakened checks. Browser setup/installation is a separate developer environment concern.

The script serves the real `index.html` and production modules, including JSON, the embedded schema snapshot and test-reference catalog, from both `/` and `/JaoKob/`. It drives native DOM choices rather than a production debug hook. LocalStorage is inspected only within its disposable contexts. Gzip delivery is enabled by this local test server; hosting compression must be checked separately at release.

Coverage:

- All twelve home-focus × coping × keepsake routes, distributed across no/partial/full hotspot exploration, including a repeated hotspot. Canon terminal metrics and flags, checkpoint, return to Title and reload/Resume are asserted.
- Keyboard Tab/Shift+Tab order and visible focus, Enter/Space actions, focus after rendering, Bond Locked Chip presence and zero numeric disclosure in both DOM and Chromium accessibility tree on every story step (CR-0003 D7).
- Post-storm cursor reload and duplicate click, explicit old-version/corrupt-save consent and cancellation, invalid JSON/schema recovery buttons, unavailable/quota storage.
- 320 CSS px with 200% text scaling, 44 px targets, sampled contrast, OS/application reduced motion, same-origin requests, console/page errors and payload budgets.

Latest Sprint 3 route outputs go to `tests/e2e/evidence/sprint-03/benchmark/`. The reviewed Sprint 2 run is retained in [evidence/sprint-02](evidence/sprint-02/act1-evidence.json), with screenshots and SHA-256 hashes of every static file served during that run. These are verification artifacts, not production assets.

This is an automated accessibility smoke with Chromium's accessibility tree. VoiceOver/NVDA listening, human Thai editorial/sensitivity review, full WCAG certification, representative-device percentile performance, and release browser/deployment matrices remain external review gates. `maxDriverActionMs` includes the browser driver and is not a Core or UI latency percentile. Initial transfer and DOMContentLoaded are one local observation, not a statistical performance claim.


Sprint 3 adds `visual-novel-benchmark.mjs` for the actual asset/audio/semantic-stage integration. It builds an isolated test host around production modules; diagnostics remain in test HTML, never Core or the production UI. Run with the same `JKB_PLAYWRIGHT_PATH` environment variable:

```sh
JKB_PLAYWRIGHT_PATH=/absolute/path/to/playwright/index.mjs node tests/e2e/visual-novel-benchmark.mjs
```

Evidence under `evidence/sprint-03/visual-novel/` records actual checks, raw percentile samples, network shaping, media failures, browser details and limits. Browser-emulated timing, decoded resource accounting and accessibility-tree checks do not establish physical-device, listening, screen-reader or PO aesthetic acceptance. The Sprint 3 execution record distinguishes these gates.

## Sprint4 Slice4 narrative candidate

`JKB_PLAYWRIGHT_PATH=/absolute/path/to/playwright/index.mjs node tests/e2e/narrative-slice.mjs` exercises actual content3/schema2 through the existing application content port with isolated real Save2/DOM/media. The production entry stays archived2.1 until T9/T10 promotion. Six full-pouch layouts, native cancellation/atomic replacement/reload, empty/released comfort, three secret accessibility variants and a complete fresh journey are recorded in [Slice4 evidence](evidence/sprint-04/slice-04/README.md). Source diagnostics exist only in served test HTML. Use `JKB_NARRATIVE_SERVE_ONLY=1` for the installed action client; it prints the temporary loopback URL. New illustrations and final human editorial/AT/device acceptance remain T9/T11.

## Current Sprint4 Slice5 integration

New Game now loads content3; saved2.1 continues on its exact archived graph. `act1-playthrough.mjs` retains12golden journeys by seeding reviewed legacy saves through production Resume; it no longer treats New Game as legacy content. `narrative-slice.mjs` uses production content/catalog/registry defaults in a diagnostic-only host for6profiles/current story. `closeout-rehearsal.mjs` serves allowlisted staged artifacts, tests rollback/touch/audio/media and asserts20cold/20warm/input budgets with3×30s rAF measurements. See [consolidated Slice5 evidence and reproducible commands](evidence/sprint-04/slice-05/README.md). Historical Sprint3/Slice1–4 records remain historical. Final physical-device/AT/PO and merge/deployment acceptance is separate.

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
