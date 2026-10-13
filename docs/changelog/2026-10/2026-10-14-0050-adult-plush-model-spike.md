# Change Record: Adult Plush Base Mesh & First GLB Spin

- **Record ID:** CR-20261014-0050
- **Timestamp:** 2026-10-14T00:50:00+07:00
- **Milestone:** CR-0004 / Milestone 1, standalone post-Sprint-3 asset spike
- **Operator:** Codex / 3D and Graphics implementation
- **Status:** Milestone 1 technical verification complete; owner art review and production integration deferred

## 1. Objective and authority

Owner approved creating the seated adult blue-shirt plush from local photographs, an editable Blender Python generator, GLB export and a Google model-viewer inspection page that loads only after activation. Childhood heart is optional; emotion variants remain deferred. This is a private gift art spike; no production deployment, ending integration or save change is included.

## 2. Trace

`CR-0004`, `ADR-P0-016`, `GDD-VIS-003`, `NAR-SC-A5-007-HOME`, `NFR-PE-004`, `FR-ACC-001/003`.

Scope/acceptance/task register: [CR-0004](../../rfc/CR-0004-adult-plush-model-spike.md). Architecture: [ADR-P0-016](../../adr/ADR-P0-016-keepsake-model-viewer-spike.md).

## 3. Changed artifacts

- [Spike folder and instructions](../../proposals/3d-keepsake-spike/README.md): Blender generator, editable source, GLB, four inspection renders, poster, local HTML/JS/CSS/i18n preview, pinned development dependencies and validation scripts.
- [Model metrics](../../proposals/3d-keepsake-spike/evidence/model-metrics.json), [glTF validation](../../proposals/3d-keepsake-spike/evidence/glb-validation.json), [browser evidence](../../proposals/3d-keepsake-spike/evidence/preview-verification.json), [artifact hashes](../../proposals/3d-keepsake-spike/evidence/artifact-manifest.json).
- Root CHANGELOG, proposal index and post-Sprint-3 audit cross-reference.
- Existing user edits in the GDD and untracked reference photographs are preserved and excluded from staging.

## 4. Verification

- Executed generator with installed **Blender 5.2.2 LTS, macOS ARM64**; saved editable `.blend` with 46 named parts and exported one merged mesh with two material primitives. Temporary export copies preserve editable source parts.
- GLB: **546,020 bytes**, **22,508 triangles**, 2 materials, no external resource URI, no cameras/animation/studio geometry. Khronos glTF Validator: 0 errors, warnings or infos. Poster: **45,296 bytes**.
- Inspected front, side, rear and three-quarter renders. Fixed torso/shirt intersection, seated height, export scene leakage and collar ring discontinuity. Rear details remain inferred.
- Chromium checks: demand loading, keyboard focus/controls, pointer orbit/wheel, emulated touch orbit/pinch, reset, close/reopen, 390/320px layout, reduced motion, 44px touch targets, failed-load poster/retry, same-origin requests. Evidence records the final run. Fixed failed-load cache reuse and reset after gesture interaction during testing.
- `node --test tests/unit/*.test.js`: **691 passed, 0 failed/skipped**, duration ~21.97s. No game runtime files changed.
- Python syntax compilation, JavaScript syntax check and diff whitespace inspection performed. Playwright action-loop screenshots inspected.

Not performed: physical iPhone/Android FPS and GPU memory, Safari/VoiceOver, Blender 4.5 compatibility, final owner likeness approval, production END-HOME integration. Export bytes do not represent total viewer transfer or decoded GPU memory.

## 5. Migration, rollback, risks and next work

No save/content/schema migration. Rollback removes or reverts isolated spike artifacts; the game is unaffected. No production asset promotion occurs.

The delivered object is a **base mesh** with matte colors and visible construction joins, not final velour surfacing or animation-ready retopology. Future work: likeness review, blend joins, refined eye/lip proportions, fabric texture baking, real-device evidence and a scoped ending integration contract. The optional childhood heart and deferred emotion variants are recorded in CR-0004.

## 6. Git delivery

Feature branch: `feat/spike-adult-plush-model`, based on updated `develop`. Commit identity verified as `T3thr <t.theerapat33@gmail.com>`. Feature PR targets `develop`; no merge/deployment authorized or performed. PR link is recorded during closeout.
