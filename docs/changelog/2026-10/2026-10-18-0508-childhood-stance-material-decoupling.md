# Change Record: Childhood default stance and material decoupling

- **Record ID:** CR-20261018-0508
- **Timestamp:** 2026-10-18T05:08:00+07:00 (Asia/Bangkok)
- **Milestone:** Isolated keepsake asset correction / Milestone 1C
- **Operator:** Astra, 3D asset and web preview implementation
- **Status:** Technical verification complete; PO visual review and PR merge remain open

## 1. Objective and authority

The PO explicitly requested implementation of [ADR-P0-025](../../adr/ADR-P0-025-childhood-keepsake-default-stance-and-heart-emote-decoupling.md) D1/D2/D4: childhood defaults to natural empty-handed sitting and adult-tone velour; heart holding is an independent optional stance; existing crochet remains selectable. This supersedes the corresponding CR-0004 / ADR-P0-017 defaults. The PO-supplied ADR is copied unchanged; no new Canon is declared by this implementation.

Intake/DoR: approved direction, observable four-combination acceptance, scoped asset/UI contract, original geometry and authored texture provenance, raw/export/source/browser verification and rollback identified before implementation. C2 asset/preview behavior change under the explicit accepted ADR. No game Core, content, Save, schema, adult geometry, facial-emotion system or production integration work.

The narrative checkout had modified dialogue and untracked ADR24/ADR25/Act1 blueprint. An isolated worktree and `feat/sprint-05-childhood-stance-material` branch were created from fetched `origin/develop` **d1af293**; the narrative checkout was not switched or reset. Current Sprint5 planning authority was read from the shared planning checkout; that unmerged plan is not silently imported into this asset PR.

## 2. Traceability and implementation

| Authority | Artifact | Verification |
|---|---|---|
| ADR25 D1 | `build_childhood_model.py`, source collections and default node transforms | Blender source checks, raw GLB scale samples, rendered-node browser inspection |
| ADR25 D1 heart emote | `Stance_HeartEmote` + `Accessory_RedHeart`, STEP `HeartEmote` clip | Three animated scale targets switch arms and heart atomically at t=0/t=1; default nodes zero-scale |
| ADR25 D2 | Default Velour / `KHR_materials_variants` Crochet, saved Blender helper | All four stance/material pairs; actual normal/color maps checked; original yarn PNG hashes preserved |
| ADR25 D4 | GLB, `.blend`, 4 default renders + poster, 3 alternate renders/posters, preview/evidence/README | Validator, geometry/size budget, visual inspection, hash manifest and browser regression |

Source has 29 shared parts, 10 empty-hand parts, 10 heart-pose arm parts, one separate heart. `Childhood_Variants.py` is embedded in the `.blend` and retained as a standalone helper. Crochet has a fake user and packed images. Welding coincident seam vertices preserves per-loop UVs while eliminating the bright seam under smooth velour.

The single GLB has four named nodes/meshes, three materials and five primitives. Default textile material is Velour even without extension support; no runtime-only concealment is needed for the empty-handed default. The selector uses a standard STEP scale animation to choose authored poses, not a skeletal motion rig. `currentTime=0` is empty, `currentTime=1` is heart; the clip holds the latter until 2 seconds to avoid the loop endpoint. No autoplay. Material changes use the public model-viewer variant API. The filename is retained for path compatibility.

UI strings/alt text describe the selected combination. Before activation, controls change only poster/text. After activation, they reuse the same GLB; changes during loading apply the latest selection. Close/reopen and adult round-trips retain the current childhood selection; page reload restores empty/Velour. Native buttons, pressed states, fieldset legends, focus retention, reduced motion and responsive wrapping are included.

## 3. Changed artifacts

Updated files live under `docs/proposals/3d-keepsake-spike/`: childhood builder, source/GLB, default renders, preview HTML/JS/CSS/localization, validation/source/browser runners, README/progress and evidence/manifest. Added `childhood_variants.py`, `verify_variants.mjs`, three alternate renders/posters, four browser combination screenshots and variant/unit evidence. The PO-supplied ADR25, this record and root changelog supply traceability. No photographs or personal narrative sources were uploaded.

## 4. Verification and measured metrics

| Gate | Actual result |
|---|---|
| GLB budget | **704,780 bytes; 15,728 triangles counting every stored mesh including hidden poses**, below 2MB/25k caps. Above the former 400–600KB soft target due to the additional arm geometry. |
| Visible geometry | Default: **12,584 triangles**; heart: **13,384 triangles**. |
| Khronos validator | **0 errors, 0 warnings**, 6 informational unused tangent/UV notices retained in the unfiltered report. No external URI/cameras. |
| Blender | **5.2.2 LTS ARM64**; saved file reopened; default visibility/material, optional collection, two eye glints, three hand/foot lobes, packed PNGs and embedded helper tested across all four states. |
| Materials | Velour uses adult green sRGB `.38/.64/.13`, roughness `.87`, sheen `.08`; Crochet retains both original 128px PNGs byte-for-byte. |
| Browser | Chromium: actual node scales and texture maps for all four combinations, keyboard/focus, no GLB reload on variant changes, rapid selection, delayed load, adult round-trip, close/reopen and reload default. |
| Existing preview regression | Pointer/wheel/touch emulation, reset/FOV, 320/390px layout and 44px targets, reduced motion, retry per doll, obsolete callbacks, cancellation during import/load all passed. No external requests or normal-flow console errors. |
| Game regression | `node --test tests/unit/*.test.js`: **1,060 passed, 0 failed/skipped**, 19.55s. Game source/tests untouched. |
| Visual inspection | All default views plus alternate materials/stances; browser desktop/mobile and skill action-loop screenshot/state inspected. Default ready state is empty/Velour at animation time 0. |
| Static verification | Python compilation, JavaScript syntax, diff whitespace, 58 generated hashes, eight unchanged adult authored artifacts and two unchanged yarn PNGs. Independent exports are byte-identical after fixing non-deterministic arm-part ordering. |

Commands and linked JSON reports are in [Spike README](../../proposals/3d-keepsake-spike/README.md). `verify_variants.mjs` inspects the pinned library's private scene only in test code; product preview uses public APIs. Budgets exclude the unchanged model-viewer library, posters and decoded GPU memory.

Not performed: physical iPhone/Android FPS/GPU-memory profiling, Safari/Firefox/VoiceOver, final PO likeness approval, production END-HOME integration, deployment or Blender4 compatibility. Emulation is not physical-device acceptance. Velour remains a lightweight PBR approximation without individual fibers. Childhood physical scale remains an estimated prototype dimension, not a new lore decision.

## 5. Migration, rollback and remaining approval

No Save/schema/content migration. A reviewed revert of this asset change restores the old hugging/crochet artifact, which must then be labelled historical and must not be used as current narrative reference. The default GLB path and independent heart identity remain stable; node indices/material indices are not a public contract.

PO visual review and human PR merge remain open; no merge or deployment was performed. This correction does not complete any of Sprint5's twenty production tasks. The active Sprint5 audit register receives a separate handoff reference in its planning checkout, because its SSOT is not yet part of develop.

## 6. Git delivery

Implementation commit `741b0b5` was pushed to `feat/sprint-05-childhood-stance-material` and [Draft PR #19](https://github.com/T3thr/JaoKob/pull/19) targets `develop`. The active Sprint5 audit row was separately committed as `81c2402` on `feat/sprint-05-planning-ssot`, leaving the ongoing dialogue/ADR24/ADR25/Act1 blueprint work untouched. It explicitly distinguishes actual asset PR #19 from the planning document's prospective Slice1 numbering. Both commits used verified identity `T3thr <t.theerapat33@gmail.com>`.
