# Change Record: ADR-P0-019 runtime ergonomics

- **Record ID:** CR-20261015-1757
- **Timestamp:** 2026-10-15T17:57:00+07:00
- **Sprint:** Sprint 4 Slice 1, T1/T2, existing [PR #13](https://github.com/T3thr/JaoKob/pull/13)
- **Contributor:** T3thr <t.theerapat33@gmail.com>
- **Status:** Implementation and automated/browser verification delivered for PO acceptance; PR remains open, no merge/deployment

## 1. Intake and readiness

PO explicitly rejected `a634409` after runtime playtest and authorized the corrective implementation, tests, documentation, commit and push on `feat/sprint-04-slice-01-visual`. The branch was clean apart from preserved, excluded personal references; `git pull origin feat/sprint-04-slice-01-visual` was up to date at `7285bdd`. Accepted [ADR-P0-019](../../adr/ADR-P0-019-visual-novel-runtime-ergonomics-and-design-system-mandate.md) supersedes ADR-P0-018. Prior records remain historical evidence of the rejected result.

Definition of Ready: approved scope/acceptance, existing immutable view/intent and validated settings/preference ports, unchanged Core/save/schema contracts, original licensed artwork/fonts, actual browser/unit runners and rollback are available. The [Design System Specification](../../design-system/visual-novel-specification.md) was the first edited artifact, before CSS/source changes. It records intake, impact, spacing/contrast/type/layers/physical blueprints, ownership and verification.

Trace: CR-0005 T1/T2; ADR-P0-019 P1..P6 and Title layering; FR-UI-001..007; FR-SET-003/004; FR-ACC-001..004; FR-LOC-001; GDD-UX-001..007; NFR-US-003..006; NFR-PO-002/004. `TC-S4-VIS/STATUS/STATE/A11Y-001` identify evidence, not new product requirements.

## 2. Impact and delivered behavior

| Defect in rejected baseline | Delivered correction / owner |
| --- | --- |
| New Game confirmation shares normal Title flow | Shared native confirmation dialog for replacement and high-impact choices; backdrop, inert underlay, safe cancel/Escape, actual opener restoration; existing consent protection retained |
| Warnings and meter telemetry occupy/clip reading card | Card contains speaker, authored prose and navigation only. Scene accessibility context remains outside it. Content warnings go to the advisory; HP/morale changes go to a separate HUD toast |
| Prose cannot fit at large text sizes | Renderer-owned measured Thai pagination preserves every character at word/grapheme boundaries, with a local counter. Reading UI pages never send a Core advance or save until the original beat is complete. Font/viewport changes retain reading position |
| Choices float asymmetrically and scroll inside buttons/slot | Centred intrinsic equal-height rows, no internal overflow/scrollbar; three equal columns on short landscape. Paper retains the same viewport bottom24px and geometry across modes; normal document reflow accommodates large text |
| Consequences look like debug output | Localized direction/amount near HUD, noninteractive 2500ms micro-toast with final fade; no locked Bond numeric values. Stable event identity prevents replay after settings/media refresh; one polite consequence announcement |
| Storm warning is inline | Scene-specific advisory opens from corner SVG, with acknowledgement, Escape, labelled opt-out switch and the existing validated version1 `jaokob:preferences` adapter |
| Sound opens Settings | One click toggles validated master volume0/prior positive level, preserving all channel levels, including zero. Button stays present and exposes state/action. No Settings detour |
| Settings/confirmations require scrolling to close | Shared modal frame, SVG close44px positioned top/right16px outside the scroll body; track/thumb and text/ARIA switch state; focus trap and native cancellation |
| Desktop demands small-target clicks | Root-scoped Space/Enter/stage advance; modal/busy/decision/control/selection/modifier/repeat guards; input listeners removed on disposal |

Style tokens explicitly cover 4/8/16/24/32/48px, layer0/10/20/30/50, warm paper, opaque glass fallback, moss/amber, Sarabun18–20px/1.85, visible focus, reduced motion and forced colors. Thai runtime has no U+2013/U+2014 separators or emoji icon fallback. Healthy Resume availability is conveyed by its action rather than another persistent status banner; storage/media failures remain visible.

Changed artifacts: design specification; DOM renderer; new reading-pages and confirmation-dialog components; shared modal/settings/switch/advisory components; styles/localization; Data view projection; bootstrap semantic audio/focus/event projection; unit/browser runners; pinned Before archive, screenshots/manifests/viewer; sprint/manual/changelog/audit.

## 3. Verification performed

- **720/720 unit cases**, zero fail/cancel/skip/todo, in [unit-tests.tap](../../../tests/e2e/evidence/sprint-04/slice-01/unit-tests.tap). All712 previous cases retained; obsolete presentation expectations were amended under the explicit ADR, including the confirmation description's new modal target. Eight added cases cover direct audio/persistence/channel safety/stale guards, replacement cancellation/focus, storm advisory, toast lifetime/Bond secrecy desktop input guards and consequence announcement deduplication.
- **12/12 legacy Chromium routes**, exact metrics/flags/checkpoint/rest Resume, stale/duplicate input, raw/unknown-save consent protection, keyboard, locked Bond DOM/AX, root/subpath, storage/media faults and existing transfer/input observations. Presentation helpers distinguish local pages from Core revisions; domain outcome assertions remain intact.
- **36 visual-runner captures**, six profiles (320×568,390×844,768×1024,1440×900,2560×1440,844×390). Same paper rectangles across sampled Reading/Exploration/Decision and back; bottom24px. Native modal close is hit-tested at both scroll extremes and 200%; switches, focus, audio, advisory persistence/failure, high/forced contrast, reduced motion and glass fallback checked.
- **14 additional production-runtime captures** against the unmodified `http://127.0.0.1:8001/` entry point, using isolated seeded browser contexts only. At all six sizes, concatenated UI pages equal the full original Thai beat, local page changes leave the save untouched, choices are centred/equal/readable without internal scrolling, and short landscape choices remain above the paper. Actual font setting200%, storm advisory/reload opt-out, native Title/choice confirmation, consequence toast, direct audio and stage/Space/Enter guards are exercised.
- Screenshots were visually inspected, including narrow portrait/short landscape, 200%, confirmation backdrop and consequence. That inspection exposed additional overlap/large-text issues during development, which were corrected before final capture. Numerical geometry/CLS is supporting evidence, not aesthetic acceptance or universal layout certification.
- [Evidence README](../../../tests/e2e/evidence/sprint-04/slice-01/README.md), [runtime manifest](../../../tests/e2e/evidence/sprint-04/slice-01/runtime-ergonomics.json), [visual/source manifest](../../../tests/e2e/evidence/sprint-04/slice-01/visual-evidence.json), [Before/After](../../../tests/e2e/evidence/sprint-04/slice-01/before-after.html). Archived `a634409` images have SHA-256 provenance; older archives remain intact. Source/hash/link/diff and viewer checks are included in the evidence bundle.

## 4. Compatibility, rollback and limits

No Core source, content package/prose/effects/graph/stable ID, published schema, save format, runtime dependency or existing artwork/font/audio bytes change. UI never accesses LocalStorage or mutates a domain snapshot. Bootstrap calls the existing validated settings/touch/persist path for a master toggle; advisory changes never touch Core/save/settings. The separate UI preference schema remains version1 with the same single boolean; no migration.

Reading pages and toast timers are ephemeral UI state. Reload may reread part of the current Core beat; it never loses unread text or replays a committed effect. At 200%/long lists, normal document scrolling may be needed; reading/choice wells never scroll internally. Rollback is a reviewed revert of this revision, retaining compatible saves/settings/preferences. No data deletion or force push is part of rollback.

Not performed: PO final art/Thai/emotional playtest acceptance, physical touch devices, Safari/iOS/Firefox, VoiceOver/NVDA, native400% browser zoom, hardware listening and representative-device performance percentiles. This is not AAA/WCAG/device certification. T0/T3–T11, Session History Log (T6 / PR #15), Pouch, new narrative/Intent Tag catalog, 3D, release, merge and deployment remain outside this change. Only T1/T2 implementation is checked complete; human acceptance remains open.

## 5. Delivery

Commit/push update the existing feature branch and PR13 only, with contributor identity rechecked before commit. The PR description replaces obsolete ADR-P0-018 claims with this correction and pinned Before/After evidence. No new PR, merge or deployment is requested or executed.

Preview from repository root:

```sh
python3 -m http.server 8001 --bind 127.0.0.1
```

Open `http://127.0.0.1:8001/` and `/tests/e2e/evidence/sprint-04/slice-01/before-after.html`. An existing server on8001 already serves the workspace; refresh it after changes. No npm dev script exists.
