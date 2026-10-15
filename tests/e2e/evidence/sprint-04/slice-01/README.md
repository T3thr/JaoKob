# Sprint 4 Slice 1: ADR-P0-019 runtime evidence

Current record: CR-20261015-1757, [PR #13](https://github.com/T3thr/JaoKob/pull/13), branch `feat/sprint-04-slice-01-visual`. Accepted ADR-P0-019 supersedes the rejected `a634409` runtime. This bundle is a candidate for PO acceptance; the PR remains open. Only T1/T2 implementation is complete.

## Reproduce

From the repository root, with an existing Playwright installation (no new dependency):

```sh
node --test tests/unit/*.test.js
JKB_PLAYWRIGHT_PATH=/absolute/path/to/playwright/index.mjs JKB_EVIDENCE_DIR=tests/e2e/evidence/sprint-04/slice-01/legacy-routes node tests/e2e/act1-playthrough.mjs
JKB_PLAYWRIGHT_PATH=/absolute/path/to/playwright/index.mjs node tests/e2e/sprint-04-visual-slice.mjs
python3 -m http.server 8001 --bind 127.0.0.1
JKB_PLAYWRIGHT_PATH=/absolute/path/to/playwright/index.mjs node tests/e2e/vn-runtime-ergonomics.mjs
```

Game: `http://127.0.0.1:8001/`. [Before/After](before-after.html): `/tests/e2e/evidence/sprint-04/slice-01/before-after.html`. An existing server on8001 already serves this checkout. There is no npm dev script.

The first two browser runners create disposable loopback hosts and isolated browser contexts. The visual fixture mounts one diagnostic app, with no production debug API. The new runtime runner uses the **unmodified production entry point on8001**, isolated valid save fixtures and normal UI actions; it never changes the user's browser storage. `JKB_PREVIEW_URL` can select another loopback preview.

## Results

| Gate | Result / evidence |
| --- | --- |
| Unit | **720/720**, no fail/cancel/skip/todo: [TAP](unit-tests.tap); all712 prior cases plus8 focused cases |
| Legacy routes | **12/12**, exact metrics/flags/checkpoint/Resume; protected raw/future saves/consent, stale/duplicate input, keyboard, locked Bond DOM/AX, root/subpath and faults: [manifest](legacy-routes/act1-evidence.json) |
| Visual runner | **36 captures** across320×568,390×844,768×1024,1440×900,2560×1440,844×390: [manifest and served-source hashes](visual-evidence.json) |
| Production runtime | **14 additional captures**; complete original Thai text reconstructed from every physical page at all six profiles; local pages do not save/advance Core; 200% through actual settings; centred equal choices/no internal scrollbar, landscape choice visibility; native Title/choice confirmations; storm advisory/reload preference; HUD-only consequences; direct audio and Space/Enter/stage guards: [manifest](runtime-ergonomics.json) |
| Modal/accessibility | Native backdrop/inert, Escape/Tab/opener restoration,44px close hit-tested at top/bottom and200%; labelled switch track/thumb/ARIA; focus/motion/forced colours; default prose contrast10.61:1, high contrast16.61:1; no unexpected browser errors |
| Historical provenance | [Rejected a634409](before-adr-019/manifest.json), [093595d](before-adr-018/manifest.json), [f91ef05](before-po-review/README.md); hashes retained |

Same paper rectangles are measured across sampled Reading/Exploration/Decision and back. The choice column grows intrinsically and is not assigned the rejected fixed scrolling slot. Measured layout-shift entries are also recorded, including recent input; zero in this scoped run does **not** establish human usability or universal CLS conformance.

| Viewport | Paper y | Height | Bottom margin |
| --- | --- | --- | --- |
| 320×568 | 320 | 224 | 24 |
| 390×844 | 572 | 248 | 24 |
| 768×1024 | 728 | 272 | 24 |
| 1440×900 | 612 | 264 | 24 |
| 2560×1440 | 1144 | 272 | 24 |
| 844×390 | 198 | 168 | 24 |

At large text sizes, the document can reflow/scroll; the viewport paper stays fixed. Prose uses temporary Thai word/grapheme pagination instead of ellipsis, clipping or a scrolling text well. Authored immediate feedback remains a separate prose passage; only numeric consequences enter the2500ms HUD micro-toast. An authored scene with no background reference retains the existing neutral media policy, rather than showing stale art from a different scene. No new scene art is claimed.

## Acceptance paths

- [Title replacement](1440-runtime-title-confirmation.png): backdrop, inert Title and visible close/cancel; no save replacement until explicit consent.
- [High-impact choice](1440-runtime-choice-confirmation.png): same modal frame, separate from reading/choice layout.
- [Consequences](1440-runtime-consequence.png): HP/morale toast near HUD, pure authored prose below; expiry2500ms.
- [Storm reading](390-runtime-storm.png) / [advisory](390-runtime-storm-advisory.png): full scene warning in its own modal, acknowledgement and persistent opt-out.
- [Short landscape](844x390-runtime-decision.png): three symmetric columns above fixed paper, all labels contained.
- [Actual200% setting](320x568-runtime-text200.png): complete text across pages; document reflow for choices.
- [Pinned200% close](320x568-settings-text200.png), [switch state](390-switch-on.png), [sound rail](1440-runtime-sound-toggle.png).

The runtime adds no history log. UI page position and toast deadlines are ephemeral: reloading may reread part of the current Core beat, but cannot lose unread text or replay a committed effect. Master mute uses the existing validated settings/touch/save path and preserves channel levels. Advisory changes do not touch Core/game saves/settings. `jaokob:preferences` remains version1, single boolean, strict bounded parsing and preservation of corrupt/future input. No game-save/content/schema migration.

## Scope, amendments and remaining review

Assertions requiring warnings/deltas inside the paper and sound opening Settings were explicitly superseded by ADR-P0-019. The confirmation description targets its new modal; local-page helpers distinguish presentation progression from domain commits. No critical outcome/save/security check was removed or skipped. Core/content/prose/effects/stable IDs/schema/save and original image/font/audio bytes remain unchanged.

PO final Thai/art/emotional/runtime acceptance, physical touch, Safari/iOS/Firefox, VoiceOver/NVDA, native400% zoom, hardware listening and representative-device performance percentiles are **not performed**. No full WCAG/AAA/device certification, merge or deploy. T0/T3–T11, Session History Log(T6/PR15), Pouch, new narrative/Intent Tag catalog and3D remain out of scope.

[Full audit](../../../../../docs/changelog/2026-10/2026-10-15-1757-sprint-04-adr-019-runtime-ergonomics.md) · [Design specification](../../../../../docs/design-system/visual-novel-specification.md)
