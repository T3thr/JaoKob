# Sprint 4 Slice 3: Session Dialogue History evidence

Authority: CR-0005 D3 / FR-ENG-009 / GDD-UX-006 / log portion of FR-UI-004 / ADR-P0-019/020. [Contract](../../../../../docs/design-system/session-history-contract.md) · [Audit](../../../../../docs/changelog/2026-10/2026-10-16-0142-sprint-04-slice-03-history.md).

- [Full unit TAP](unit-tests.tap):935/935,0 failed/cancelled/skipped/todo (874 retained +61 new).
- [Focused coverage](history-coverage.txt): pure reducer100% lines/functions,98.59% branches; projection100% lines/functions,92.16% branches; modal100% lines. Includes independent FIFO60→50, metadata/max text, repeated visits/retry, prefix extension, accepted ordering, failure/cancel/reset/reload, dialog and bootstrap/storage/audio checks.
- [History Chromium report](history-browser.json):15 layout profiles,23 captures, native focus/Tab/Escape/inert/opener, auto-scroll and status-patch stability; real320px displayed prefix, confirmed action/response order, Pouch release, reload and New Game; root+subpath/emulated touch.200% text/high/forced contrast and reduced motion. No unexpected errors or external requests.
- [Legacy Chromium report](legacy/act1-evidence.json):12 original Act1 routes,5 captures; exact narrative metrics/flags/consent/save/faults retained. Headless timing includes driver overhead and is not an input latency certification.
- [Memory bounds](history-bounds.json):12 actual application paths with repeated observations; schema-maximum50+50 worst escaping fits8MiB without truncation, current Act1 target128KiB. Serialized bytes differ from heap allocations. Browser report includes whole-page and100-entry heap after collection separately.
- [Action client state0](web-game/state-0.json), [state1](web-game/state-1.json), [capture0](web-game/shot-0.png), [capture1](web-game/shot-1.png): installed develop-web-game client;50+50/revision1 remain unchanged through input bursts.

Representative captures: [320 latest](320x568-latest.png), [390 empty](390x844-empty.png), [landscape](844x390-latest.png), [200% text](320-history-zoom.png), [high contrast](320-history-contrast.png), [forced colours](320-history-forced.png), [actual visible prefix](320-production-visible-prefix.png), [chosen action before response](390-committed-choice-history.png), [subpath release](subpath-320-released-history.png), [reload note](390-reloaded-session-note.png), [earlier scroll/status patch](390-history-earlier-async-status.png).

Reproduce using the existing Node runtime and an installed Playwright ES module, with `JKB_PLAYWRIGHT_PATH` set to its absolute path:

```sh
node --test tests/unit/*.test.js
node --test --experimental-test-coverage tests/unit/session-history.test.js tests/unit/history-projection.test.js tests/unit/history-dialog.test.js tests/unit/history-bootstrap.test.js
node tests/e2e/session-history.mjs
JKB_EVIDENCE_DIR=tests/e2e/evidence/sprint-04/slice-03/legacy node tests/e2e/act1-playthrough.mjs
```

The runner serves disposable test fixtures alongside unchanged production root/subpath entry points. Diagnostic globals exist only in fixture HTML assembled by the runner. Five100-action100-entry synchronous open/close samples meet p95≤100ms with observed layout shift0; this is a scoped headless CPU/layout measurement. Physical-device/painted-frame performance, Safari/Firefox/AT/native400% zoom and PO/Thai/art acceptance remain human gates. No release/deployment or WCAG certification is claimed.
