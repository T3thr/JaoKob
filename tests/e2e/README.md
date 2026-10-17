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
