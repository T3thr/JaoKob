# Change Record: ADR-P0-018 Visual Novel Ergonomics

- **Record ID:** CR-20261015-1544
- **Timestamp:** 2026-10-15T15:44:09+07:00
- **Sprint/Milestone:** Sprint 4 Slice 1 / T1-T2 / existing PR #13
- **Operator:** Codex / Senior Software Engineer and Principal UI/UX Architect
- **Status:** Implementation and automated verification complete; PO art/device/AT acceptance remains open

## 1. Intake, authority and Definition of Ready

The current PO/Tech Lead directive explicitly adopts [ADR-P0-018](../../adr/ADR-P0-018-visual-novel-design-system-and-anti-slop-standards.md), requests its implementation on `feat/sprint-04-slice-01-visual` and authorizes commit/push to [PR #13](https://github.com/T3thr/JaoKob/pull/13). `git pull origin feat/sprint-04-slice-01-visual` reported up to date at `ac05c33`; the reviewed source candidate is `093595d`. Contributor identity is T3thr / t.theerapat33@gmail.com. Untracked personal references are preserved and excluded from delivery.

Relevant DoR is satisfied by the accepted ADR and current user decision: D1 fixed bottom baseline and reserved choice slot; D2 fixed close corner, styled switches and transparent sound; D3 natural Thai punctuation and vector-only icons; D4 floating advisory plus durable opt-out; D5 spatial tokens and measured contrast. Existing architecture and immutable renderer/media contracts suffice. No Core state, published schema, Canon, gameplay effect or save-envelope amendment is needed. The separate UI preference contract below is an implementation of D4, not an inventory/save redesign.

Requirements: `CR-0005` T1/T2, `ADR-P0-018 D1..D5`, `ADR-P0-001/005/012/014/015`, `FR-UI-001/002/003/005/007`, `FR-ACC-001..004`, `FR-LOC-001/003`, `FR-SET-003/004`, `GDD-UX-001..005/007`, `NFR-US-003..006`, `NFR-MA-001/002`, `NFR-PO-002/004`.

## 2. Impact and implementation

- **D1:** A constant-height paper card anchors 24px above the scene bottom. The choice slot is always present above the card, empty during Reading. Three Decision cards align symmetrically in three columns at mobile and desktop widths. Response/context/warnings stay inside the scrollable paper so they cannot push its edges. The character water-contact anchor is independent of the presentation mode. Short landscape prioritizes the readable interface and omits the foreground character; portrait crops retain its water plane. Large text grows the scene into vertical reflow, and long prose/choice lists remain scrollable with native keyboard access.
- **D2:** Shared native modal frame separates a fixed top-right SVG close control from the scroll body. Settings has a short fixed heading and its full description in the body. Switch buttons expose `role="switch"`, `aria-checked`, localized On/Off, track/thumb, native Enter/Space and motion/forced-color handling. The existing reduced-motion action and other setting intents retain their validation/persistence behavior. The existing generic cutscene switch uses the same visual control without adding typewriter runtime scope. Sound remains visible in the rail and settings with current readiness/mute labels and actual volume sliders. Ready/muted rail actions open the master-volume field; unlock never changes intentional zeros.
- **D3:** Thai application title now uses a colon; warning-title separators use natural punctuation. Renderer icon fallbacks are removed; meters, choices, arrows, settings, sound/mute, retry, info and close use original `chrome-icons.js` vector paths. The old emoji favicon is replaced by an original lotus SVG. All narrative strings still use safe DOM APIs.
- **D4:** Title has a corner info control rather than an inline warning banner. Explicit activation opens the advisory with details, acknowledgement, Escape, focus trap/restoration and an opt-out switch. The opt-out hides the floating hint on subsequent Title displays; Settings always offers the advisory so it can be read or re-enabled. There is no new automatic popup or New Game gate. Preferences are projected by Data, persisted by a Data adapter composed in bootstrap, and emitted by UI as semantic intents. Advisory operations do not enter Core or write game saves/settings.
- **D5:** Main scene/card/slot/modal spacing uses the existing 4/8/16/24/32px token scale. Default prose contrast measures 10.61:1, High Contrast 15.72:1. Reduced motion and forced colors remain available.

Changed artifacts: UI styles, renderer, `settings-dialog.js`, new modal/switch/advisory components, localized chrome, Data view projection, bootstrap composition, a separate preference adapter, original vector/favicon provenance, focused unit and browser evidence, comparison viewer and sprint/audit documentation. Core, content package bytes, narrative IDs/prose/effects/graph, existing image/font/audio assets, game schemas/save versions and runtime dependencies remain unchanged.

## 3. Separate UI preference contract, failure and rollback

New key: `jaokob:preferences`. Exact JSON shape:

```json
{"version":1,"preferences":{"hideContentAdvisory":false}}
```

Absent key defaults to false with no write. Read boundary rejects oversized, malformed, extra-field, inherited-property, non-boolean or unknown-version records. Explicitly disabled storage never falls back to browser storage. Writes recheck the raw record and read back the result. Future/corrupt input is retained byte-for-byte; denial/quota/observed race fails safely and keeps the current choice in memory with a localized explanation. This is a bounded UI preference, not player progress or a field in validated GameSettings. Save replacement never clears it. As with existing LocalStorage, observed race checks do not claim cross-tab atomicity.

No game-save/content migration: format 1 / content 2.1.0 / schema 1.2.0 are unchanged. A reviewed revert restores the previous UI and ignores the new preference key; no progress or preference deletion is necessary. Existing settings changes retain their previous validated touch/save behavior; advisory preferences never use that path.

## 4. Verification performed

| Gate | Evidence and result |
|---|---|
| Unit regression | **712/712**, zero fail/cancel/skip/todo; 31,506.2894ms. All703 previous cases retained, affected presentation expectations explicitly updated under D1-D4, plus9 focused cases. [TAP](../../../tests/e2e/evidence/sprint-04/slice-01/unit-tests.tap) |
| Legacy integration | **12/12** Chromium canonical routes. Exact meters/flags/checkpoint/Resume, protected old/corrupt saves, consent, duplicate/stale intents, locked Bond DOM/AX secrecy, keyboard and faults pass. [Result](../../../tests/e2e/evidence/sprint-04/slice-01/legacy-routes/act1-evidence.json) |
| Real visual/layout | **36** current screenshots, six profiles: 320x568,390x844,768x1024,1440x900,2560x1440,844x390. Every sampled Reading/Exploration/Decision paper/slot rect matches; 24px bottom baseline, no measured layout-shift entries including recent input; Decision-to-Reading geometry matches. [Manifest](../../../tests/e2e/evidence/sprint-04/slice-01/visual-evidence.json) |
| Modal and control ergonomics | Native close hit-tested at scrollTop=0 and the scroll bottom, including 320px/200% and 1440px/200%. Button labels remain within controls. Native focus cycling/Escape/return, switch Space/ARIA/thumb, volume zero/unlock and persistent controls pass. Status-only updates preserve exact modal/scroll/field/busy focus. |
| Advisory/state/persistence | Ack/close never starts a game; opt-out persists across reload, Settings reopens/reverses it, stale/background/invalid intents fail. Snapshot and serialized save/settings remain identical. Corrupt/future/oversized/denied/dropped/raced preference records covered; failure remains readable. |
| Accessibility/localization | Thai 18-20px / line-height1.85; 44px controls, 320px/200% reflow; text contrast 10.61:1, High Contrast15.72:1; forced colors/reduced motion/glass fallback; no Thai em dash, emoji fallback or raw narrative HTML. Native semantics/AX/keyboard smoke, not full WCAG certification. |
| Architecture/assets/security | Unit boundary checks and diff review: no Core/production-test import or UI storage access; no content/save/schema change. Same-origin browser network, no unexpected page/console errors. Original vector provenance and Before hashes verified; personal references excluded. |

Approved presentation expectation amendments are explicit: emoji Bond text becomes a decorative SVG while numerical secrecy remains; Title notice becomes an info/modal flow; raw checkboxes become native button switches; feedback/content warnings move inside the constant paper; the generic typewriter control retains its semantic intent with switch ARIA. No route/state/save assertion was removed or skipped.

The layout check measures both actual geometry and PerformanceObserver entries including `hadRecentInput`, rather than relying only on CLS's input exclusion. These measurements cover the six normal-text viewport runs, not all browsers or real devices. Text resizing intentionally changes geometry; 200% is separately verified for reflow, readable control labels and close reachability. Local compressed initial transfer329,335bytes is a smoke observation; driver timing is not a device input-latency percentile claim.

Visual QA found and corrected a fixed-height grid that overlapped Exploration hit targets and a long 200% modal heading/button layout. Final browser assertions cover click interception, the close corner and button-label containment. No screenshot-fit change hides prose or disables choices.

## 5. Before / After and reproduction

The local comparison viewer also passes all six image-pair switches, lazy-image decoding and zero browser errors ([viewer-check.json](../../../tests/e2e/evidence/sprint-04/slice-01/viewer-check.json)).

Seven unchanged screenshots from `093595d` are archived with SHA-256 values in [before-adr-018](../../../tests/e2e/evidence/sprint-04/slice-01/before-adr-018/manifest.json). The earlier `f91ef05` archive remains untouched. [before-after.html](../../../tests/e2e/evidence/sprint-04/slice-01/before-after.html) now switches desktop/mobile and Reading/Decision/Title, with an explicitly labelled baseline guide, measured positions and settings/switch/sound/advisory comparisons.

| Component | Before 093595d | After ADR-P0-018 |
|---|---|---|
| Paper | Height/position follows content and choice flow | Constant bottom baseline and dedicated slot; no measured mode-transition shift |
| Settings | Bottom close, raw toggles, scrolling full dialog | Fixed top-right SVG close, independent scroll body, explicit switch state |
| Sound | Unlock control can disappear | Stable control with readiness/mute state and access to actual volume |
| Thai/icons | Em dash title and emoji fallbacks | Colon title and original vector icons/favicon |
| Advisory | Inline Title warning below CTA | Corner icon, native modal, acknowledgement and durable/reversible opt-out |

Reproduce from the repository root:

```sh
node --test tests/unit/*.test.js
JKB_PLAYWRIGHT_PATH=/absolute/path/to/playwright/index.mjs JKB_EVIDENCE_DIR=tests/e2e/evidence/sprint-04/slice-01/legacy-routes node tests/e2e/act1-playthrough.mjs
JKB_PLAYWRIGHT_PATH=/absolute/path/to/playwright/index.mjs node tests/e2e/sprint-04-visual-slice.mjs
python3 -m http.server 8001 --bind 127.0.0.1
```

Game: `http://127.0.0.1:8001/`. Comparison: `http://127.0.0.1:8001/tests/e2e/evidence/sprint-04/slice-01/before-after.html`. Refresh the existing preview tab; there is no npm dev script. Both test runners use separate loopback servers and isolated browser storage; no production debug hook was added.

## 6. Verification not performed, risks and remaining approval

Not performed: physical touch devices, Safari/iOS/Firefox, VoiceOver/NVDA, native400% browser zoom, representative-device latency/load/frame percentiles and final human Thai/art/crop walkthrough. Axe is not installed. Fixed slots intentionally trade expanding cards for scrollable long content at large text sizes; manual mobile/AT walkthrough remains important. Short landscape omits the foreground sprite while preserving story/art and controls.

Only T1/T2 implementation is marked complete in SSOT0.2.4; remaining ten tasks stay open. Final visual/Thai/accessibility acceptance and PR merge remain with PO/human reviewers. No agent merge, deploy, release, Pouch, Log, new prose, Intent Tag catalog or 3D integration is included. The user authorizes the exact commit `fix(ui): enforce ADR-P0-018 visual novel ergonomics and anti-slop standards` and normal push to the existing feature branch; immutable Git history and PR13 pin delivery.
