# Sprint 4 Slice 2: Pouch / Save 2 review evidence

Authority: ADR-P0-020 / CR-0005 / CR-20261016-0031. Branch `feat/sprint-04-slice-02-pouch`; [PR #14](https://github.com/T3thr/JaoKob/pull/14) → develop. Integrated baseline01cee6f; source work begins at the accepted ADR commit9e7a0a2. This bundle is scoped implementation evidence, with human acceptance still open.

| Gate | Actual evidence |
|---|---|
| Baseline | Before implementation720/720 unit tests passed,0 fail/cancel/skip/todo |
| Final unit | [unit-tests.tap](unit-tests.tap):874/874 cases (720 retained +154 new),0 fail/cancel/skip/todo |
| Domain coverage | [pouch-coverage.txt](pouch-coverage.txt): Pouch domain100% lines/branches/functions; transaction100% lines/96.55% branches; migration100% lines/96.30% branches. Defensive branches are not a claim of untested behavior passing. |
| Schema | [schema-reference.json](schema-reference.json):13 Draft2020-12 metaschemas and47 new structural/semantic cases; [legacy-schema-reference.json](legacy-schema-reference.json):11/36 unchanged presentation checks |
| Existing story | [legacy/act1-evidence.json](legacy/act1-evidence.json):12/12 Canon routes, exact original metric/flag outcomes, cursor reload, consent, faults, locked Bond, root/subpath and budgets;0 unexpected errors |
| Pouch browser | [pouch-browser.json](pouch-browser.json):18 empty/partial/full layouts across six viewports;34 captures; native keyboard/focus/inertness,200% text/high/forced contrast, full-offer cancel/refuse/replace and image fallback; production release/Save2/reload/exact Save1 backup on root and subpath with actual touch taps |
| Production HUD | [production-hud.json](production-hud.json), [320px HUD](320-production-hud.png) and [empty modal](320-production-empty.png): actual touch taps,44px opener, no overflow and unchanged save on open/close |
| Action client | [web-game/state-0.json](web-game/state-0.json), [state-1.json](web-game/state-1.json): installed develop-web-game client, two action bursts, screenshots inspected, held leaf/revision1/intents[] unchanged; no error artifact |
| Architecture/assets/security | Automated import/browser-free/provenance checks; [artifact-checks.json](artifact-checks.json) records observed runtime hashes/allowlist/budgets and static review, not a release build |

Production currently has **one reviewed leaf**, not four invented story objects. Full-capacity/offer screenshots use explicitly labelled test items with the same original placeholder leaf illustration; those are UI/transaction fixtures, not final Act1 item art or Canon. Content stays2.1 and its graph remains14 nodes/21 edges/12 outcomes. Content3/new secret mappings are not represented as implemented.

Useful visual review entries:

- [Production inspection, desktop](root-1440-production-inspection.png) and [320px subpath/touch](subpath-320-production-inspection.png).
- [Empty](390x844-empty.png), [held](390x844-held.png), [full](1440x900-full.png), [replace confirmation](390-full-replace-confirmation.png), [remembered after reload](root-1440-remembered.png).
- [200% text at320px](320-text200.png), [landscape](844x390-inspection.png), [high contrast](320-high-contrast.png), [forced colours](320-forced-colors.png), [image fallback](390-image-fallback.png).

The modal body scrolls; the close corner remains outside it. Small/200%/landscape captures can show a portion of the body while all text and actions remain reachable. Screenshots supplement the geometry assertions and were inspected by the implementer; this does not substitute for PO final aesthetics or assistive-technology listening.

Commands (development tools live outside the repository; no runtime package or lockfile added):

```sh
node --test tests/unit/*.test.js
node --experimental-test-coverage --test-coverage-include='src/core/domain/keepsake-pouch.js' --test-coverage-include='src/core/use-cases/pouch-transaction.js' --test-coverage-include='src/data/persistence/save-1-to-2.js' --test tests/unit/keepsake-pouch.test.js tests/unit/pouch-migration.test.js
JKB_AJV_PATH=/absolute/path/to/ajv/dist/2020.js node tests/schema/pouch-reference.mjs
JKB_AJV_PATH=/absolute/path/to/ajv/dist/2020.js node tests/schema/presentation-reference.mjs
JKB_PLAYWRIGHT_PATH=/absolute/path/to/playwright/index.mjs JKB_EVIDENCE_DIR=tests/e2e/evidence/sprint-04/slice-02/legacy node tests/e2e/act1-playthrough.mjs
JKB_PLAYWRIGHT_PATH=/absolute/path/to/playwright/index.mjs node tests/e2e/keepsake-pouch.mjs
```

Migration/recovery: Save1 true historical leaf maps held/acquired/remembered; false maps empty; payload/checkpoint differ independently. Recovery/Resume retains every raw slot. Subsequent accepted writes back up original canonical bytes; quota/backup/races/future/corrupt/digest-bearing legacy records fail safely. Save1 downgrade over Save2 is blocked. Rollback must retain compatible admission/write guards or disable writes; no guessed downgrade or empty-bag repair.

Not performed: PO final Thai/art playtest, VoiceOver/Safari, NVDA/Firefox/mobile screen reader, physical-device touch/listening/performance percentiles, native400% zoom and production artifact/deploy/rollback rehearsal. Integrity-bearing legacy saves are protected rather than transformed without digest verification. Future new items/secrets/Log/Act2–5/3D remain outside this slice. No Slice2 merge/release/deploy approval is implied.
