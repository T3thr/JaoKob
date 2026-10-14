# Sprint 4 Slice 1 evidence — CR-0005 / T1–T2

Baseline: `develop@d31652a`; candidate `feat/sprint-04-slice-01-visual`. Runtime remains Vanilla ES Modules, content 2.1.0/schema 1.2.0/save format 1. Browser: headless Chromium 151.0.7922.34 on macOS. These are scoped automated/model-assisted checks, not human art/AT/device acceptance or performance certification.

## Reproduce

From the repository root, with an existing development Playwright installation (no repository package dependency):

```sh
node --test tests/unit/*.test.js
JKB_PLAYWRIGHT_PATH=/absolute/path/to/playwright/index.mjs JKB_EVIDENCE_DIR=tests/e2e/evidence/sprint-04/slice-01/legacy-routes node tests/e2e/act1-playthrough.mjs
JKB_PLAYWRIGHT_PATH=/absolute/path/to/playwright/index.mjs node tests/e2e/sprint-04-visual-slice.mjs
```

Both browser runners serve disposable loopback hosts and use isolated browser saves. The Slice 1 diagnostic fixture lives only in its test host; it adds no production debug hook. Earlier Sprint 2/3 evidence is preserved. The existing route runner accepts an output override; its route, meter/flag, double-input, save-consent, focus and numerical-free Bond assertions remain intact. Its contrast sample now measures the relocated rail and the paper behind the transparent Next control.

## QA inventory and results

| Claim / behavior | Functional and visual evidence | Result |
|---|---|---|
| Title without gameplay HUD | No meter nodes; menu/New Game/Resume/settings/notice; title captures at all six sizes | Pass |
| One readable paper beat / Next in footer | Sarabun 18px mobile/20px desktop, line-height1.85; no premature cards; original corner fibres, glyphs clear | Pass |
| Decision crossroads | Three original Scene3 labels/actions, no Next, minimum76px card height, original order; trailing cue/label wrapper ready for T9 | Pass |
| Moss HP / amber พลังใจ, locked Bond | Distinct fills; localized labels/numbers; native DOM/AX has no Bond value; original decorative SVG | Pass |
| Save/status cleanup | Visible rail status; no save inset panel in prose; saving/saved/failure direct fixtures retain exact DOM nodes and focus | Pass |
| Stable modal/media/revisions | Native settings retains node/scroll/music focus across save/audio patches and busy lock; persistent controls emit latest viewRevision | Pass |
| Feedback and content notices | Response/deltas remain outside paper; storm warning, confirmation/cancel, completion and crisis recovery still function | Pass |
| Keyboard/touch/reflow | Legacy Enter/Space/Tab;44px targets;320px with200% text, settings/Escape/restoration; forced/high contrast and OS/app reduced motion | Pass |
| Fault exploration | Image-load failure exposes actual Retry in rail; quota/memory-only warning remains visible and Next works | Pass |
| Compatibility | 12 canonical routes, all terminal meters/flags, checkpoint/reload/Resume, stale/double input and protected raw save tests | Pass |
| Architecture/security | All 691 existing unit cases plus7 new cases pass; same-origin network; no console/page errors; no Core/content/save/schema change | Pass |

[`unit-tests.tap`](unit-tests.tap): **698/698**, zero fail/cancel/skip/todo, final full-suite duration43,401.554ms. [`legacy-routes/act1-evidence.json`](legacy-routes/act1-evidence.json): **12/12**, zero unexpected errors, contrast samples≥9.44:1. [`visual-evidence.json`](visual-evidence.json):29 captures, six sizes (320×568,390×844,768×1024,1440×900,2560×1440,844×390), source SHA-256 values, fit/reflow/touch/native patch/fault results. The 320px/landscape/200% text layouts intentionally scroll in normal document flow; content is not clipped to force a screenshot fit.

Representative images: [desktop reading](1440x900-reading.png), [mobile decision](390x844-decision.png), [Title](390x844-title.png), [200% settings](320x568-settings-text200.png), [forced colors](390-forced-colors.png), [storage fault](390-storage-failure.png). Model-assisted inspection covered Title/Reading/Decision, text reflow, forced colors and failure captures; human walkthrough remains a separate gate.

## Limits and next review

PO/Art Thai aesthetic, actual water-plane/crop acceptance, real touch devices, VoiceOver/NVDA, Safari/iOS/Firefox, native400% zoom and representative-device percentile performance remain unperformed. Axe is not installed; native semantics/AX/keyboard/contrast checks are automated smoke, not full WCAG certification. T3–T11, actual Intent Tag catalog, Log/Pouch, new narrative/save/contracts/3D are outside this slice. No release/deploy/merge is performed. UI rollback is a reviewed revert; no save migration is required.
