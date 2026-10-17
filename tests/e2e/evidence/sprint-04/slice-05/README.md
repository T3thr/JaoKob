# Sprint4 Slice5 consolidated engineering evidence

CR-20261017-1400 / CR-0005 T9/T10/T11 / ADR-P0-019/020/021 / PR17 to develop.
Baselinebc167d3 follows mergedPR16@37bad50. New Game is content3/schema2/Save2; compatible2.1 continues on its own graph. All28nodes/47edges/70dialogues/30actions and their prose/effects are unchanged from mergedPR16; five original image records are appended.

This is an engineering submission for owner review. Final PO/Thai/Art/listening, physical-device/AT and merge/release/deployment gates are separate and remain open. Act2–5/Grand Keepsake/red-heart embroidery is Sprint5 work. No3D, external runtime dependency or private photograph is shipped.

## Verification index

| Gate | Actual evidence |
|---|---|
| Retained regression | [Baseline1004](baseline-unit.tap.gz); [final1060](unit-results.json), all1004 retained+56 new,0 fail/cancel/skip/todo,23,629.599ms. Existing unit files unchanged. |
| Strict schema/reference | [18metaschemas/10package/59Save2 cursors](narrative-reference.json), [47Pouch cases](pouch-reference.json), [retained12schemas/36cases](presentation-reference.json). Independent local Ajv, no schema network or runtime dependency. |
| Additive presentation contract | [13structural cases/11semantic negatives/21byte-identical published artifacts](catalog-reference.json), plus unit loader/MIME/path/rights/hash/geometry/entity/crop/locale/unknown/reference/lease/late-result negatives. No gameplay rule in decoration. |
| Exact production save binding | New tests cover every cursor/checkpoint across12old routes, both Save1 chains, current3 cursors/pouch/completion, backup/raw-race/mixed/future/corrupt/consent/default-adapter guards and independent settings/Retry. Recover/Resume remain read-only. |
| ADR-P0-021 ending design | [7anchors/20edges,8curated traces,1096scenario-trajectories](ending-trajectories.json). Reachable self-reliant DAWN at Bond0/15/20; original three endings and fairness/repair. Later-act production E2E is not implemented. |
| Legacy browser | [12production archived continuations/5captures](legacy/act1-evidence.json): unchanged outcome/metric/flag/checkpoint witnesses, exact reload, keyboard/focus, Bond DOM/AX secrecy,320px/200%,44px targets, motion/contrast, parse/schema/storage faults and explicit replacement3.0. |
| Current browser | [6profiles/21captures](current/narrative-browser.json): full/cancel/replace/reload, four-slot fifth offering, all3moments and24visited nodes in New Game→rest, empty/released comfort,200%/high/forced contrast and History. CLS0 in all six profiles; actual journey save6243bytes. |
| Installed action client | [Three screenshots](action-client/shot-2.png), [semantic state](action-client/state-2.json). Test-host-only diagnostics use the normal production loading defaults. No unexpected page/console/external-network errors. |
| Static artifact/rollback | [87-file current and76-file bc167d3 inventories](static-artifact.json), exactSHA/bytes/relative references/regular paths/credential-pattern/Core/import/provenance checks. Current artifact gzip647077bytes, including compatibility/fonts/audio. No deployment. |
| Final exact-artifact browser/performance | [Final raw series and functional checks](final/closeout-rehearsal.json): actual root/subpath index, exact2.1 continuation, old runtime protects3.0, five encountered images,128px integrity fallback, optional-catalog failure, excluded paths404, actual emulated touch and WebAudio/Pouch/History stability. |

## Performance method and interpretation

Chromium151.0.7922.34 on Darwin25.2.0/AppleM5/10logical cores/24GiB. Load/frame runs use CDP CPU4x and Fast3G150ms/200000download bytes/s/93750upload bytes/s.20cold runs each use a fresh context with disabled/cleared HTTP cache;20warm reloads use an already-loaded context and report observed cache hits. Default channels are muted. Test-only diagnostic HTML uses production loading/ports; actual staged index is checked independently. Resource Timing records encoded bytes; initial input-ready timing does not imply completion of optional asynchronous media.

The first series exceeded the3000ms cold-p75 budget at3095.4ms ([retained diagnostic](performance-before-preload.json)). Two preloads measured2900.4ms, then a repeat measured3011.7ms ([repeat](performance-two-preload-repeat.json)); that repeat remains a failed budget observation despite its functional checks passing. The final HTML preloads the required loader, validator, local schema and orchestration modules to reduce the critical dependency path without increasing the runtime module set. The final series uses explicit assertions for cold≤3000/warm≤1500/input≤100ms and records every sample. Final cold/warm p75: **2923.3/324.4ms**.

Input samples use150trusted DOM clicks across5full-Pouch/detail/close runs on the recorded host, without CPU/network shaping. Timing spans input→rendered DOM→next rAF callback; the runner never substitutes Playwright driver time. These read-only interactions preserve canonical bytes. The three independent30s reading/Pouch/transition series use the recorded CPU4x profile and retain intervals/outliers. A rAF callback precedes painting; it is not proof of painted-frame latency or a physical60Hz device. The final JSON records input percentiles, transfer/save/cache bounds and all individual frame samples.

## Visual inspection

Opened and inspected actual PNGs, including [390px five choices](current/390x844-full-offer.png), [four original objects](current/390x844-four-items.png), [200% Thai](current/320-secret-text200.png), [the fifth shell](final/item-item_river_shell.png), [image failure](final/image-integrity-fallback.png) and action-client screenshots. Controls are captured after reading pages/fonts/requested media settle. An object not yet remembered has no inspection entry; the fifth image is inspected only after its accepted authored replacement. Fixed artwork space retains name, status, description and memory when integrity fails. Native modal content can scroll; item art never creates a separate internal scroll area.

## Reproduction

Use installed development Playwright and Ajv paths; nothing is installed into the runtime:

```sh
node --test tests/unit/*.test.js
node tests/design/ending-trajectories.mjs
JKB_AJV_PATH=/absolute/path/to/ajv/dist/2020.js node tests/schema/narrative-reference.mjs
JKB_AJV_PATH=/absolute/path/to/ajv/dist/2020.js node tests/schema/pouch-reference.mjs
JKB_AJV_PATH=/absolute/path/to/ajv/dist/2020.js node tests/schema/presentation-reference.mjs
JKB_AJV_PATH=/absolute/path/to/ajv/dist/2020.js node tests/schema/closeout-reference.mjs
JKB_PLAYWRIGHT_PATH=/absolute/path/to/playwright/index.mjs node tests/e2e/act1-playthrough.mjs
JKB_PLAYWRIGHT_PATH=/absolute/path/to/playwright/index.mjs node tests/e2e/narrative-slice.mjs
```

Stage from the explicit `specs/releases/sprint-04-static-files.json` allowlist. Set fresh absolute destinations outside the checkout (their parent must exist; destination folders must not exist). `JKB_RELEASE_EVIDENCE` is a JSON path outside the artifact. The verifier never deletes/reuses a caller's directory:

```sh
JKB_ARTIFACT_DIR=/absolute/new-artifact JKB_ROLLBACK_DIR=/absolute/new-rollback JKB_RELEASE_EVIDENCE=/absolute/static-evidence.json node tests/release/verify-static-artifact.mjs
JKB_ARTIFACT_DIR=/absolute/new-artifact JKB_ROLLBACK_DIR=/absolute/new-rollback JKB_PLAYWRIGHT_PATH=/absolute/path/to/playwright/index.mjs node tests/e2e/closeout-rehearsal.mjs
```

The installed web-game skill client ran against `JKB_NARRATIVE_SERVE_ONLY=1` with an external development-only ESM loader for Playwright, a visible advance click and three short4-frame pauses. `render_game_to_text`/`advanceTime` exist only in that diagnostic host. Servers/contexts are closed after inspection. The static artifact contains no docs/specs/tests/.git/private references/models/vendor or debug host.

## Outstanding owner acceptance

Final Thai/Art/crop/listening and PO approval; physical4-core/4GB mobile/painted-frame performance; Safari/iOS/Firefox and real VoiceOver/NVDA. Scoped pattern/network/asset inspection is not formal security certification. Review and merge of PR17 close the fifth-slice integration; hosted deployment/tag/release is not performed. No requested source work is deferred to a sixth Sprint4 slice.

Full raw unit TAP, resource/input arrays and every rAF interval are retained as gzip archives beside the small JSON reports. Each report records the uncompressedSHA-256/byte length; no measurement or test result is removed. For example, `gzip -dc unit.tap.gz` and `gzip -dc final/closeout-rehearsal.json.gz` restore the complete raw evidence. Reports/archives are development evidence and never enter the static allowlist.
