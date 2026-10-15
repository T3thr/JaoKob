# Sprint 4 Slice 1 evidence: ADR-P0-018 / CR-0005 T1-T2

Current revision: CR-20261015-1544 on `feat/sprint-04-slice-01-visual`, [PR #13](https://github.com/T3thr/JaoKob/pull/13). Accepted ADR-P0-018 supersedes the moving-card/raw-toggle/inline-warning presentation in `093595d`. This is an implementation candidate for human acceptance. Core, content2.1.0/schema1.2.0/save format1 and all previous image/font/audio bytes remain unchanged. New durable UI preference is separate from game settings/save/checkpoint.

## Reproduce

From the repository root, using an existing Playwright installation (no runtime/repository package dependency):

```sh
node --test tests/unit/*.test.js
JKB_PLAYWRIGHT_PATH=/absolute/path/to/playwright/index.mjs JKB_EVIDENCE_DIR=tests/e2e/evidence/sprint-04/slice-01/legacy-routes node tests/e2e/act1-playthrough.mjs
JKB_PLAYWRIGHT_PATH=/absolute/path/to/playwright/index.mjs node tests/e2e/sprint-04-visual-slice.mjs
python3 -m http.server 8001 --bind 127.0.0.1
```

Preview: `http://127.0.0.1:8001/`. [Comparison viewer](before-after.html) supports desktop/mobile and Reading/Decision/Title switching. Server path: `/tests/e2e/evidence/sprint-04/slice-01/before-after.html`. There is no npm dev script.

Both runners create disposable loopback hosts and isolated browser storage. The visual test host mounts `slice-root` once, avoiding production auto-mount; its diagnostic renderer fixture is test-only. Legacy outcome/state/save assertions remain intact. Earlier Sprint2/3 evidence is retained.

## Results and trace

| Gate | Evidence | Result |
|---|---|---|
| Unit regression | [unit-tests.tap](unit-tests.tap): **712/712**, zero fail/cancel/skip/todo; all703 previous cases retained with explicit ADR presentation expectation amendments, plus9 focused cases | Pass |
| Legacy routes | [act1-evidence.json](legacy-routes/act1-evidence.json): **12/12** canonical outcomes; exact meters/flags/checkpoint/Resume, consent/raw-save protection, duplicate/stale actions, keyboard and locked Bond DOM/AX secrecy | Pass |
| D1 stable anchor | [visual-evidence.json](visual-evidence.json) `anchors`: every sampled Reading/Exploration/Decision paper and slot rect matches, including Decision-to-Reading; bottom24px at six normal-text profiles | Pass |
| Layout Shift | PerformanceObserver includes entries with `hadRecentInput`; **zero entries/value**, alongside geometry assertions; measurement begins after initial artwork/fonts settle | Pass |
| D2 close corner | `modalCorners`: native close44x44 hit-tested at scrollTop=0 and maximum, unchanged x/y;320px/200%,1440px/200%,390px settings/advisory/error; button text remains contained | Pass |
| D2 switches/audio | Four settings switches with localized On/Off, track/thumb, role/ARIA, Space and focus retention; mute0 survives unlock; sound node remains in rail/settings and opens volume controls when ready/muted | Pass |
| D3 typography/icons | Thai title uses colon, no runtime Thai em dash/emoji fallback; all renderer icons/chevrons are original SVG, including favicon; Bond remains numerical-free | Pass |
| D4 discreet advisory | Title story has no warning banner; corner icon opens native details. Ack/Escape/Tab restoration; opt-out persists through reload; Settings reopens/reverses it; snapshot/save/settings remain identical | Pass |
| Preference failures | Separate bounded/versioned key validates booleans/fields/prototype, protects corrupt/future records, rejects stale/background intents and handles denial/dropped write/observed race with an in-memory choice and localized explanation | Pass |
| D5 contrast | Prose **10.61:1**, High Contrast **15.72:1**; system forced colors, reduced motion, opaque-glass fallback; 4/8/16/24/32 spacing tokens | Pass |
| Quiet status and faults | One frosted header, success dot fades/disappears within1500ms without replay/focus/announcement; failures remain readable; exact story/modal/scroll/focus retained; image Retry and quota recovery work | Pass |
| Responsive/localization | Six viewports, Sarabun18-20px/1.85,44px buttons;320px with200% text and vertical reflow, root/subpath; no unexpected browser/page/external-origin errors | Pass |

Requirements/evidence: `ADR-P0-018 D1..D5`, `CR-0005`, `FR-UI-001/002/003/005/007`, `FR-ACC-001..004`, `FR-LOC-001/003`, `FR-SET-003/004`, `TC-S4-VIS-001/STATUS-001/STATE-001/A11Y-001`.

Browser: headless Chromium151.0.7922.34 on macOS. **36 current screenshots** at320x568,390x844,768x1024,1440x900,2560x1440,844x390 plus control/fault variants. Normal snapshots are full-page; new modal captures use only the viewport to demonstrate its close corner. Source hashes in the manifest identify actual served source; `baseline` is the parent Git commit because evidence is captured before committing the candidate.

## Stable geometry and reflow boundaries

| Viewport | Paper y in Reading and Decision | Height | Bottom margin |
|---|---|---|---|
| 320x568 | 288px | 256px | 24px |
| 390x844 | 564px | 256px | 24px |
| 768x1024 | 744px | 256px | 24px |
| 1440x900 | 620px | 256px | 24px |
| 2560x1440 | 1160px | 256px | 24px |
| 844x390 | 174px | 192px | 24px |

The fixed slot is empty during Reading, with symmetric three-column Decision cards above the paper at every size. Long Exploration lists scroll in that slot; prose/feedback/content warnings share the scrollable paper without resizing it. Body focus supports native keyboard reading. Short landscape omits the foreground sprite to keep the interface usable; other profiles retain its mode-independent water-contact plane and ambient ellipse/ring.

Large text intentionally grows/reflows the scene vertically rather than clipping controls to fit a screenshot. Font resizing itself is not a zero-layout-change claim. The geometry/CLS table covers the six normal-text runs;200% separately checks horizontal reflow, actual labels/targets, focus and close reachability. These are scoped automated checks, not universal CLS/WCAG/device certification.

## Preferences and compatibility

`jaokob:preferences` stores exactly `{"version":1,"preferences":{"hideContentAdvisory":false}}`. No automatic popup/new-game gate is added: the icon is explicitly opened. Opt-out suppresses the floating hint on future Title displays; the Settings entry always remains. An absent key defaults to false without writing. Unknown/corrupt/oversized input stays untouched; failed persistence explains that the hint may return after reload. The UI never reads Storage. Bootstrap composes the Data adapter and projects immutable preference data.

Preference changes do not call Core, touch domain revisions or write game settings/save/checkpoint. Existing game-setting changes retain their previous validated persistence behavior. No migration of game saves/content; a reviewed UI revert ignores this separate key without deleting anything.

## Before / After

[before-adr-018/manifest.json](before-adr-018/manifest.json) pins seven unchanged images from source candidate `093595d`: desktop/mobile Title/Reading/Decision and320px/200% Settings. [before-po-review](before-po-review/README.md) still pins six images from the original `f91ef05` candidate. SHA-256 checks preserve both histories.

The [interactive viewer](before-after.html) makes the new baseline visible while switching modes and compares pinned close, switch states, mute and advisory. Representative current captures: [Reading](1440x900-reading.png), [Decision](390x844-decision.png), [Title](390x844-title.png), [Settings top](390-settings-top.png), [Settings bottom](390-settings-bottom.png), [200% close](320x568-settings-text200.png), [advisory](390-advisory.png), [opt-out storage failure](390-advisory-storage-failure.png).

Presentation assertions were amended under the explicit ADR: decorative SVG replaces the old emoji fallback while all Bond numerical secrecy checks remain; Title's banner becomes a modal flow; native switch buttons replace raw checkbox expectations; response/warnings move into the fixed paper. Semantic intents, route metrics/flags and save/recovery assertions were preserved. No skipped or reduced critical gate.

## Not performed and next review

Human Thai/art/crop acceptance, physical touch, Safari/iOS/Firefox, VoiceOver/NVDA, native400% browser zoom and representative-device latency/load/frame percentiles remain unperformed. Axe is not installed; native semantics/AX/keyboard/contrast are smoke checks. Long-content scroll affordances and short landscape still need a human walkthrough. Performance transfer/driver observations are not percentile certification.

Only T1/T2 implementation is complete; final PO acceptance and merge are open. No T0/T3-T11, Log/Pouch/new prose/Intent Tag catalog/new schema/3D/release/deploy/merge work is included. Full requirement/impact/migration/rollback/approval report: [CR-20261015-1544](../../../../../docs/changelog/2026-10/2026-10-15-1544-sprint-04-adr-018-vn-ergonomics.md).
