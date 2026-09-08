# Change Record: Sprint 3 Integrated Benchmark Slice

- **Record ID:** CR-20260907-1248
- **Timestamp:** 2026-09-07T12:48:17+07:00
- **Milestone:** Sprint 3 Tasks 2–5 and Task 1 merge closeout
- **Operator:** GPT-6 Astra — Senior Software Engineer / Principal Systems Architect
- **Status:** Tasks 2–5 implementation and automated verification complete; feature PR publication in progress. Manual/device/PO benchmark acceptance remains open.
- **Closeout date:** 2026-09-08 (Asia/Bangkok)

## 1. Authority, readiness and scope

PO & Tech Lead's current directive approves Task 1 and explicitly authorizes PR #9 squash merge plus full-cycle Tasks 2–5 as one integrated vertical slice. Prototype images/audio and a licensed self-hosted Thai font are authorized without waiting for external delivery. New work follows CR-0003 D1–D8 and ADR-P0-015; no new Canon, mechanics, runtime package, backend or deployment is introduced.

PR #9 checklist was updated with required-owner approval; GitGuardian check was successful at the approved head. Squash merged to develop at **9e4f8b09ac5c10e11192a926dde54e5a0006b74d**, author **T3thr <t.theerapat33@gmail.com>**, exact subject **feat(data): add Sprint 3 presentation and save contracts (#9)**. `git pull --ff-only` yielded clean/up-to-date develop before creating `feat/sprint-03-benchmark-slice`.

DoR: T1 contracts are approved; stable asset paths/media bounds and prototype art/life-stage brief are supplied by this directive. Success/failure cases and 12-route witnesses are defined in SSOT §6. Explicit API/file owners are assigned to assets, UI, audio and root composition; loaders return typed failures/leases and views remain immutable. Root owns migration and stage/commit protections. Real-device/human visual/listening/assistive-technology approval will be reported separately and cannot be inferred from browser automation. Scope ends at a reviewable PR, with no merge of the new implementation or deployment authorization inferred.

## 2. Trace and impact

CR-0003 D1–D8; ADR-P0-015; FR-CNT-001/002/004/005/006; FR-UI-001/002/003/005/007; FR-SET-003/004; FR-SAV-003/004/005/006/007/009; FR-ACC-001/002/003/004; FR-LOC-001/003; NFR-PE-001..005; GDD-BOND-005; NAR-CHR-001; NAR-WLD-005.

Data impact: schema 1.2/content 2.1.0 presentation-only delta and retained production-safe original content for proof. Save format 1 and exact cursor/settings remain. Four semantic UI layers, modal settings, trusted activation, bounded media caches and composition change; Core/domain effects/transitions/graph/text remain identical.

## 3. Manifest and verification

Baseline: `node --test tests/unit/*.test.js` — 550/550 pass; zero fail/cancel/skip/todo, 1366.418084 ms.

### Delivered behavior and artifacts

- Content schema **1.2.0**, content **2.1.0**; eight benchmark/handoff nodes share the morning environment, protagonist uses the blue-scarf tadpole portrait. All dialogue, conditions/effects, stable IDs, seven scenes, 14 nodes, 21 edges and 12 canonical outcomes match the archived 2.0.0 gameplay projection. Published schemas remain byte-identical.
- `asset-resolver.js`, `asset-preloader.js` and `image-cache.js` validate same-origin root/subpath paths, MIME, magic bytes and SHA-256, decode before swapping, deduplicate/cancel stale work, cap the speculative queue at two and enforce 10-second timeouts. App-managed decoded image budget is 32 MiB; decoded PCM/reservations are separately bounded to 16 MiB, including context-rate resampling. Incompatible/oversized registry input fails safely and explicit Retry can recover.
- Four semantic DOM layers, Thai Sarabun with `font-display: swap`, paper reading panel, exploration and three authored decision cards. Locked Bond appears with lotus/lock icons and localized text; no numeric Bond value appears in DOM or the accessibility tree. Modal settings persist reading/audio preferences, preserve zero volumes, trap/restore focus, and honor high contrast and OS/saved reduced motion.
- Pure `AudioPort` plus Web Audio/silent adapters are composed only in bootstrap. Trusted pointer/keyboard activation invokes unlock synchronously; loop state projects independently of rendering and saves, with four gain buses, 1.5-second crossfades, accepted-action SFX dedupe, optional decoded preloading and hidden-tab suspension. Media failure does not block story progression.
- The production-safe original package is `src/data/content/compatibility/act-01-2.0.0.json` (SHA-256 `cbb710d69e31a0bd4c24cb54a83d9b5c937f192a5566222bc011ad4174847582`). Bootstrap proves the presentation-only delta using the independently reviewed test catalog, migrates in memory without a Resume write, and preserves exact payload/cursor/settings. Normal next commits write 2.1.0 and retain the old raw backup. Stage/commit predicates and repeated raw-record checks reject detected races, corrupt and incompatible records. Settings use their separate existing key.

### Verification and trace matrix

| Verification IDs / requirements | Observed result and evidence |
|---|---|
| `TC-S3-CONTRACT-001`, `TC-S3-ARCH-001`; CR-0003 D1/D2, ADR-P0-015 | **691/691 unit tests passed**, zero fail/cancel/skip/todo. All 550 retained Task 1 tests (including the 444 earlier baseline) remain exercised; **141 additional tests**. Core/import/published-schema invariants pass. [Full TAP](../../../tests/e2e/evidence/sprint-03/benchmark/unit-tests.tap) |
| SCHEMA; FR-CNT-001/002 | Ajv **8.20.0**, **11/11 metaschemas and 36/36 structural cases**; no remote schema resolution. [Result](../../../tests/e2e/evidence/sprint-03/benchmark/schema-reference.txt) |
| `TC-S3-ASSET-001`; FR-CNT-006, D4/D6 | Seven actual image/audio/font assets, rights/hash/MIME/size records, root/subpath reads, stale/timeout/decode/queue/cache negative coverage; **64 focused asset tests** included above. [Registry](../../../assets/provenance/benchmark-assets.json), [rights and generation recipe](../../../assets/provenance/README.md) |
| `TC-S3-AUDIO-001`, `TC-S3-SAVE-001`, `TC-S3-SETTINGS-001`; FR-SET-003/004, FR-SAV-005/006/007/009 | **30 audio tests + 12 port tests**; bootstrap exact-cursor migration across all 12 routes, settings persistence, guarded slot races, malformed/future protection, trusted unlock order and hidden-tab cleanup pass. Full TAP above; original migration fixtures remain exercised |
| `TC-S3-STATE-001`, `TC-S3-E2E-001`; CR-0003 D5/D7 | **12/12 canonical Chromium routes passed** on real production modules, including root/subpath, no/partial/full observations, all outcomes, exact rest/cursor Resume, consent cancel/replace, duplicate input and save faults. **Zero console/page errors**. [Route evidence + served-file SHAs](../../../tests/e2e/evidence/sprint-03/benchmark/act1-evidence.json) |
| `TC-S3-VIS-001`, `TC-S3-A11Y-001` automated portions; FR-UI/ACC/LOC | 22 UI tests; six viewport flows **320×568, 390×844, 768×1024, 1440×900, 2560×1440, 844×390**, 200% text reflow, locked Bond DOM/AX labels, native modal keyboard/save/restore and motion preferences. [Keyboard](../../../tests/e2e/evidence/sprint-03/benchmark/ui/keyboard.json), [motion](../../../tests/e2e/evidence/sprint-03/benchmark/ui/motion.json), [screenshots](../../../tests/e2e/evidence/sprint-03/visual-novel/). Sample contrast ratios: dialogue **10.93:1**, choices **9.53:1**, settings/HUD **10.80:1**, save text **11.77:1** |
| `TC-S3-AUDIO-002`, `TC-S3-E2E-001` browser portions | Supplementary real-module host verifies enabled audio/resource counts over 20 repeated boundaries, image-hash failure, unsupported/blocked/decode-failed audio, exact 2.0→2.1 migration and reflection continuation. No production diagnostic hooks added. [Benchmark evidence](../../../tests/e2e/evidence/sprint-03/visual-novel/benchmark-evidence.json) |
| `TC-S3-PERF-001`; NFR-PE-001..005 | Chromium **151.0.7922.34**, supplementary Fast 3G **1.6 Mbps down / 750 Kbps up / 150 ms latency**: 20 cold loads p75 **2155.3 ms**, 20 warm loads p75 **200.3 ms**, 40 cached resources observed per warm load. 240 trusted accepted interactions over five journeys: input→next rAF p95 **8.2 ms**, canonical write→next rAF p95 **7.6 ms**. These are pre-paint boundaries, not finished paint/Core-internal commit measurements. Three 30-second rAF captures p95 **9.2 ms**, median **8.3 ms** (~120 Hz scheduling); zero intervals >20 ms. Physical 60 Hz/device targets remain unverified |
| Supplementary supplied web-game skill client | Unmodified client ran against disposable test HTML with a text-only diagnostic function. New Game + reading capture succeeded; mouse choreography is canvas-specific and does not exercise this semantic-DOM game's later choices. Full DOM interaction proof comes from the two runners above. [Capture/state](../../../tests/e2e/evidence/sprint-03/web-game/shot-2.png) |
| SECURITY / whitespace | **PASS** `git diff --check`, `git diff --cached --check`; Gitleaks **8.30.1**, exact staged-file export, **zero leaks**, no rule suppression. [Security evidence](../../../tests/e2e/evidence/sprint-03/benchmark/security.txt) |

Commands actually run (development tools only; no runtime dependency added):

```sh
node --test tests/unit/*.test.js
JKB_AJV_PATH=/tmp/jkb-schema-reference-node/node_modules/ajv/dist/2020.js node tests/schema/presentation-reference.mjs
JKB_PLAYWRIGHT_PATH=/Users/3rapat/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs node tests/e2e/act1-playthrough.mjs
JKB_PLAYWRIGHT_PATH=/Users/3rapat/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs node tests/e2e/visual-novel-benchmark.mjs
```

### Candidate identity and asset inventory

Baseline commit **9e4f8b09ac5c10e11192a926dde54e5a0006b74d**; implementation branch **feat/sprint-03-benchmark-slice**. [Runtime manifest](../../../tests/e2e/evidence/sprint-03/benchmark/runtime-manifest.json) records SHA-256/byte counts for all **49 intended runtime files**, **1,059,808 raw bytes**; manifest SHA-256 **`07c51c60e0f14f60d4f79a2dba949c174b5bd6358b3f4d72bc16aa25d0d39226`**. It excludes docs/specs/tests/provenance generator scripts from the intended distributable and is an inventory, not a deployment artifact. The compiled validation catalog and independent content verification catalog are runtime inputs. The benchmark's start-of-run tracked diff hash alone does not cover untracked files; use the exact runtime manifest and final commit/PR for candidate identity.

The retained 12-route run reports critical initial compressed **137,434 bytes** and maximum save **4,821 bytes**. Initial transfer is one local observation; supplementary load percentiles are separately recorded above. Audio PCM/process memory and browser-owned codec internals are not interchangeable with total tab memory.

| Asset | Bytes | SHA-256 |
|---|---:|---|
| `assets/images/backgrounds/act1-morning-pond.webp` | 181760 | `f060ea8576f15845e44603fffecb0919f362b1eb838474a51ce02b8e4b9b4aa2` |
| `assets/images/characters/jaokob/tadpole-neutral.webp` | 49608 | `a645ffaae4b23b9e321c162856a3f9d19faf1d64e0e871cb3759633cb0fc79cb` |
| `assets/audio/bgm/act1-peaceful-stream.mp3` | 96906 | `6890327c41a75c1cb2b3868f1f29cf71b5232c1f9e117594e9c5fb5ba2a9ce08` |
| `assets/audio/ambience/morning-dew-drops.mp3` | 96906 | `5d1500633ac3323b512535de76fa497db9dbde5dc8fb87bf3bc6506f6ff72912` |
| `assets/audio/sfx/decision-soft-click.mp3` | 2238 | `d75ade6752367c0e9d7514124fa2822355b7331da980654f2ade0d754313bdd8` |
| `assets/fonts/sarabun-thai.woff2` | 9880 | `445226dce39d9c8d957ac4e8b0a12fb64c1715e74522fecea0bd6007dc4a6b25` |
| `assets/fonts/sarabun-latin.woff2` | 11440 | `5223475551bd30c4be72545051a47896f2d05e84169c5ee8e7ff7d46d2aa4308` |

Images were generated as original authorized prototypes; audio is deterministic original synthesis with no recordings/samples; Sarabun includes SIL OFL 1.1. These records do not claim final PO artistic/listening acceptance.

### Closeout / PR

- Git identity checked: **T3thr <t.theerapat33@gmail.com>**.
- Required implementation commit subject: `feat(benchmark): integrate Sprint 3 visual novel slice (Tasks 2-5)`; body traces CR-0003 / ADR-P0-015.
- New feature PR targets **develop**; URL and final staged scan result are entered at publication. The new PR is not merged or deployed by this task.

## 4. Rollback, remaining approval and risks

Once 2.1 saves exist, retain compatible runtime and write guards or disable writes; never downgrade by version heuristic, delete recovery backups or raw-revert to the original 2.0 writer. Prototype status does not claim final artwork/audio acceptance. PO/Tech Lead candidate review, actual listening and physical-device/assistive-technology gates remain explicit at closeout.


**Verification not performed / remaining owners:** PO/Art/Narrative aesthetic and Thai listening review; Audio owner actual headphone/speaker mix/loop/crossfade listening; VoiceOver/Safari and NVDA/Firefox sessions; real Safari/iOS/Firefox browser matrix; approved physical 4-core/4GB mobile / 60 Hz reference-device performance; 400% native-browser zoom (320 CSS-pixel equivalent tested); buffered Long Task/layout-shift/compositing traces; audio-enabled load/frame percentile measurements; anonymous tutorial playtest ≥4/5 unaided completion; release artifact/deployment/G2. Headless rAF timing is not display-frame certification. These remain owner acceptance before production media expansion/release, not hidden test passes. WBS checkmarks represent implementation and automated verification delivery per the PO closeout directive; full Sprint DoD remains open.

**Intrinsic concurrency limit:** LocalStorage exposes separate read/write operations without atomic compare-and-swap. Stage/commit checks catch observed changes and preserve conflicting records; a write racing after the final read cannot be mathematically excluded. Do not claim cross-tab atomicity.

Bundled OFL notice: normalized one upstream trailing space at line 21 for the mandatory staged whitespace gate; license wording and both font binaries are unchanged. Final runtime manifest includes the normalized notice.
