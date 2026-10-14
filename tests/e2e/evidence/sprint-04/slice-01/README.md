# Sprint 4 Slice 1 evidence — CR-0005 / T1–T2

Baseline: `develop@d31652a`; candidate `feat/sprint-04-slice-01-visual`. PO review revision CR-20261015-0013 supersedes the first candidate. Runtime remains Vanilla ES Modules, content 2.1.0/schema 1.2.0/save format 1. Browser: headless Chromium 151.0.7922.34 on macOS. These are scoped automated/model-assisted checks, not human art/AT/device acceptance or performance certification.

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
| Title without gameplay HUD | Verified full-screen entry lotus art, no meter/character/audio loop; corner tools and New Game/Resume/notice; title captures at all six sizes | Pass |
| One readable paper beat / Next in footer | Sarabun 18px mobile/20px desktop, line-height1.85; no premature cards; original corner fibres, glyphs clear | Pass |
| Decision crossroads | One paper surface contains authored context/feedback/question; three original Scene3 labels/actions with original SVG icons/cues, no Next, minimum80px target; desktop3columns/mobilestack; T9 tags remain deferred | Pass |
| Moss HP / amber พลังใจ, locked Bond | Distinct fills; localized labels/numbers; native DOM/AX has no Bond value; original decorative SVG | Pass |
| Save/status cleanup | One frosted header surface; no secondary utility pill; successful dot fades and disappears at1500ms without replay; failed/memory-only detail stays readable; exact DOM/focus retained | Pass |
| Stable modal/media/revisions | Native settings retains node/scroll/music focus across save/audio patches and busy lock; persistent controls emit latest viewRevision; successful save is silent while feedback/recovery still announce | Pass |
| Feedback and content notices | Decision context/deltas merge into the paper; Reading response remains separate; storm warning, confirmation/cancel, completion and crisis recovery still function | Pass |
| Keyboard/touch/reflow | Legacy Enter/Space/Tab;44px targets;320px with200% text, settings/Escape/restoration; forced/high contrast and OS/app reduced motion | Pass |
| Fault exploration | Image-load failure exposes actual Retry in rail; quota/memory-only warning remains visible and Next works | Pass |
| Compatibility | 12 canonical routes, all terminal meters/flags, checkpoint/reload/Resume, stale/double input and protected raw save tests | Pass |
| Architecture/security | All 691 existing unit cases plus7 new cases pass; same-origin network; no console/page errors; no Core/content/save/schema change | Pass |

[`unit-tests.tap`](unit-tests.tap): **703/703**, zero fail/cancel/skip/todo, final full-suite duration23,796.573ms. [`legacy-routes/act1-evidence.json`](legacy-routes/act1-evidence.json): **12/12**, zero unexpected errors, contrast samples≥9.44:1. [`visual-evidence.json`](visual-evidence.json):29 captures, six sizes (320×568,390×844,768×1024,1440×900,2560×1440,844×390), source SHA-256 values, fit/reflow/touch/native patch/fault results. Normal HUD/body fits now retain the water plane at320px; landscape/200% text layouts intentionally scroll in normal document flow; content is not clipped to force a screenshot fit.

Representative images: [desktop reading](1440x900-reading.png), [mobile decision](390x844-decision.png), [Title](390x844-title.png), [200% settings](320x568-settings-text200.png), [forced colors](390-forced-colors.png), [storage fault](390-storage-failure.png). Model-assisted inspection covered Title/Reading/Decision, text reflow, forced colors and failure captures; human walkthrough remains a separate gate.

## Limits and next review

PO/Art Thai aesthetic, actual water-plane/crop acceptance, real touch devices, VoiceOver/NVDA, Safari/iOS/Firefox, native400% zoom and representative-device percentile performance remain unperformed. Axe is not installed; native semantics/AX/keyboard/contrast checks are automated smoke, not full WCAG certification. T3–T11, actual Intent Tag catalog, Log/Pouch, new narrative/save/contracts/3D are outside this slice. No release/deploy/merge is performed. UI rollback is a reviewed revert; no save migration is required.

## PO review — Before / After

Open [before-after.html](before-after.html) for paired desktop Title/Reading/Decision screenshots, or compare the preserved [before captures](before-po-review/README.md) with the current root images. The before manifest pins `f91ef05` and six immutable screenshot hashes.

Title now fills with verified lotus art instead of the empty gradient. Reading replaces two header capsules with one compact bar and a1500ms success dot; the subject sits lower over the water with a soft ellipse/ring. Decision merges the authored context/feedback/prompt in one paper card and removes the extra generic visible heading; desktop choices align in three columns with original icons, while mobile retains spaced44px+ controls.

Browser fade proof records initial opacity0.9, an intermediate reduced opacity, and `display:none` after expiration; focus and card identity remain intact on a media refresh. The injected timer unit test fixes the deadline at1500ms, stale timers cannot hide an error, and disposal cancels pending work. Under reduced motion, the dot disappears at the deadline without a fade/breathing animation.

The scoped browser host now mounts into `slice-root`, preventing the bootstrap module's normal auto-mount plus explicit test-instance race. The native renderer fixture begins with a real non-null story snapshot and proves it remains unchanged. No production debug hook or bootstrap mutation was added. The old Title-empty-image expectation was intentionally replaced by an exact verified-background-only assertion under the explicit PO directive; silent/no-character/immutable/Core/save/route assertions are retained.
