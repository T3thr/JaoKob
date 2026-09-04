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
- Keyboard Tab/Shift+Tab order and visible focus, Enter/Space actions, focus after rendering, Bond absence from both DOM and Chromium accessibility tree on every story step.
- Post-storm cursor reload and duplicate click, explicit old-version/corrupt-save consent and cancellation, invalid JSON/schema recovery buttons, unavailable/quota storage.
- 320 CSS px with 200% text scaling, 44 px targets, sampled contrast, OS/application reduced motion, same-origin requests, console/page errors and payload budgets.

Latest outputs go to ignored `output/playwright/`. The reviewed Sprint 2 run is retained in [evidence/sprint-02](evidence/sprint-02/act1-evidence.json), with screenshots and SHA-256 hashes of every static file served during that run. These are verification artifacts, not production assets.

This is an automated accessibility smoke with Chromium's accessibility tree. VoiceOver/NVDA listening, human Thai editorial/sensitivity review, full WCAG certification, representative-device percentile performance, and release browser/deployment matrices remain external review gates. `maxDriverActionMs` includes the browser driver and is not a Core or UI latency percentile. Initial transfer and DOMContentLoaded are one local observation, not a statistical performance claim.
