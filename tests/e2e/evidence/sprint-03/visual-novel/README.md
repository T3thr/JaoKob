# Sprint 3 supplementary browser benchmark

The [raw evidence](./benchmark-evidence.json) records Chromium's exact version,
host OS/CPU/memory, package hash, tracked diff at run start, samples and screenshot
index. The [runtime verification](./runtime-verification.json) binds this final run
to the [49-file runtime manifest](../benchmark/runtime-manifest.json), with the
sole license whitespace normalization recorded separately below.
The [runner](../../../visual-novel-benchmark.mjs) serves an isolated test host
that imports actual production modules. It adds diagnostics only to that host;
production source contains no benchmark globals or timing hooks.

Run with an existing Playwright installation:

```sh
JKB_PLAYWRIGHT_PATH=/absolute/path/to/playwright/index.mjs node tests/e2e/visual-novel-benchmark.mjs
```

## Observed results

| Check | Result |
|---|---|
| Viewports | Passed 320×568, 390×844, 768×1024, 1440×900, 2560×1440 and 844×390 landscape; root and `/JaoKob/` |
| Presentation | Actual decoded WebP background/tadpole, four semantic layers, all three canonical decision cards, reflection handoff; 34 screenshots |
| Reflow | Passed 200% text and 320 CSS-pixel reflow; native 400% browser zoom not exercised |
| Media failures | Wrong image hash, unsupported audio, suspended/rejected activation and rejected audio decode preserve playable reflection |
| Persistence | Browser 2.0 save remains raw during Resume; accepted action writes 2.1 and retains original backup; exact reload/Resume |
| Resource stability | 20 repeated nursery observation boundaries with actual decoded audio; bounded image/PCM/voice/queue counts; observation effect applied once |
| Errors | Zero console/page errors and external/non-distributable requests |
| Interaction sampling | 240 accepted trusted clicks across five complete journeys |
| Fast 3G loads | 20 cold and 20 warm samples; cold input-ready p75 **2155.3 ms**, warm p75 **200.3 ms**; 40 observably cached resources in every warm sample |
| Interaction latency | Click→next animation-frame callback p95 **8.2 ms**; canonical save commit→callback p95 **7.6 ms** |
| Frame sampling | Reading/transition/decision each ≥30 s; p95 interval **9.2 ms**, median **8.3 ms**; no interval exceeded 20 ms |

Fast 3G uses CDP Network emulation: 1,600,000 bits/s download (200,000 bytes/s),
750,000 bits/s upload (93,750 bytes/s), 150 ms latency. Cold profiles use fresh
contexts, disabled/cleared cache; warm profiles reuse a primed context and record
actual resource transfer sizes. No CPU throttle was applied. Input-ready is marked
after production application boot completes, not DOMContentLoaded or driver timing.

Interaction samples use trusted click timestamps, canonical LocalStorage write
timestamps and the next `requestAnimationFrame` callback after DOM mutation.
That callback is **before paint**, so the results do not measure completed paint or
the internal Core commit boundary. Percentiles use the nearest-rank method.

The frame schedule was about 120 Hz in this headless environment. These samples
cannot establish a 60 Hz physical-device FPS claim or display dropped-frame rate.
Frame/load timings used default muted audio; actual audio was exercised separately
in the repeated-boundary resource test. All observed numeric thresholds above were
met in this supplementary profile; the approved physical-device gate remains open.

## Visual inspection

The agent inspected [mobile decision](./390x844-decision.png),
[desktop reading](./1440x900-reading.png) and
[320-pixel 200% text](./320x568-text200.png): decoded art appears, Thai text and
three choices follow vertical flow, and the Bond chip shows its locked state.
This does not substitute for PO art/crop acceptance or human accessibility review.

## Scope and reproducibility limits

The final run used the unchanged benchmark runner after the final audio reservation
integration was complete. Its blocked-audio fixture holds context state suspended
and rejects `resume()`, modeling failure even when headless Chromium would otherwise
start a context during the trusted gesture.

All 49 runtime entries matched their recorded byte lengths and SHA-256 before the
run. Afterward, 48 executable/content/media/registry files remained byte-identical.
The sole change was removing one trailing space from line 21 of the bundled OFL
license to satisfy the staged-diff check: 4387→4386 bytes. Restoring exactly that
space recreates its original SHA-256, proving that license wording is unchanged.
All 49 final files match the updated manifest. The
[original manifest](./runtime-manifest-before.json), its hash, both license hashes
and after-check are retained in the verification record. No runtime code or media
binary changed during the final run; no post-implementation commit hash is asserted.

The tracked diff hash alone excludes untracked files; use the complete runtime
manifest for file identity. The existing Act 1 browser runner owns the complete
12-route matrix; this runner's five complete journeys supply the interaction sample
plan. These are supplementary headless measurements, not physical-device acceptance.

Not run here: physical mobile hardware, Safari/iOS/Firefox, native 400% zoom,
VoiceOver/NVDA, human listening, PO acceptance, long-task/paint/compositing traces,
layout-shift instrumentation and audio-enabled load/frame timing. These remain
explicit follow-up gates rather than inferred passes.
