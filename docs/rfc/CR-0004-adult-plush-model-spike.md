# CR-0004: Adult Plush Model Spike

Date: 2026-10-13; clarified 2026-10-14. Status: **Milestone 1 and lazy-loaded model-viewer authorized by Product Owner; ending/save integration deferred.**

## Authority and scope

The Product Owner explicitly requested starting the adult doll model after reviewing the pipeline proposal. This authorizes an editable Blender source, reproducible modeling script, GLB, visual inspection renders and an isolated local inspection page. The latest direction also clarifies that the childhood doll does **not** always carry a heart; the heart is an optional accessory. Childhood emotion variants remain deferred.

During implementation the owner explicitly approved Google `<model-viewer>` loaded only when opening the keepsake, the seated adult pose, and **Milestone 1 — Base Mesh & First GLB Spin**. The installed Blender is 5.2.2 LTS; execute and report against that actual version rather than requiring a downgrade to the previously suggested 4.5 LTS.

The intended use is the owner's private gift, with visual resemblance to the provided real doll. The current request controls this exploratory art brief. This record does not rewrite historical narrative/IP text or approve a production release. Reference photographs remain local reference inputs and are not included in this change's Git staging or preview distribution.

## Trace and baseline

- `GDD-VIS-003`, `NAR-SC-A5-007-HOME`: narrative motivation for a companion doll; no ending logic changes.
- `CR-0004`: new model/preview acceptance criteria below, distinct from an approved production viewer requirement.
- `NFR-PE-004`: preserve initial game payload; spike excluded from production entry points.
- `FR-ACC-001/003`: keyboard controls, accessible names and touch targets guide the inspection page.
- Integrated code baseline is Sprint 3 (`4c8d600`); the stale Sprint 1 navigation is not used to reopen completed WBS items. This standalone spike has its own task register.

## Acceptance criteria and Definition of Ready

1. Produce an editable `.blend` and reproducible script for one seated adult green velour doll with blue shirt, long limbs, raised sleepy eyes and peach lips.
2. Export self-contained glTF 2.0 `.glb` at most 2,000,000 bytes, with no photographic backgrounds, cameras, studio floor or lights in the exported object.
3. Inspect rendered front, three-quarter, side and rear views; explicitly identify inferred rear geometry. Resemblance is subject to owner review, not self-certified.
4. Supply a separate local preview with pointer orbit, zoom, keyboard controls, reset and a loading/error fallback. Any library is a pinned **spike development dependency**, not a game runtime dependency.
5. Record glTF validation, exported triangle/material counts, actual bytes and browser evidence. Mobile-device performance and final art acceptance remain separate unperformed gates.

Inputs, scope, failure behavior, outputs and evidence are defined above under the owner's express asset-spike authorization. No canonical state, content/save schema or production runtime dependency is changed. Full game integration requires a separate architecture decision and acceptance of the viewer contract.

## Design and alternatives

Use Blender with Python parametric base geometry, reference-based visual refinement and matte PBR vertex colors. Fine fabric textures are deferred beyond this base-mesh milestone. Avoid per-fiber geometry, rigging, animation and AI service uploads in this first slice. A generator could supply a base mesh later, but no account/service is required here.

Artifacts live under `docs/proposals/3d-keepsake-spike/`, outside the production artifact allowlist. The local viewer uses self-hosted model-viewer from its pinned development package; no CDN runtime calls are needed for this uncompressed GLB. This is an evaluation of a candidate, not an accepted replacement for the game renderer.

## Compatibility, rollback and risks

- No save migration, inventory unlock, new state, ending trigger or localization changes in the game.
- Rollback removes the spike artifacts or reverts this feature commit; game/save data is unaffected.
- Adult rear details are inferred because reference photos do not include a rear view.
- Model size is measured separately from preview library transfer and decoded GPU memory.
- Offline renders are not evidence of browser/mobile performance.
- No automatic deployment or merge. Production integration and final likeness require subsequent review.

## Task and evidence register

- [x] Editable adult model and reproducible generator.
- [x] Export within byte budget and structural validation.
- [x] Visual inspection of all four views.
- [x] Local interactive preview and browser checks.
- [x] Change record, artifact manifest, commit and [feature PR #11](https://github.com/T3thr/JaoKob/pull/11).

Execution record: [CR-20261014-0050](../changelog/2026-10/2026-10-14-0050-adult-plush-model-spike.md). Artifact instructions and evidence: [Milestone 1](../proposals/3d-keepsake-spike/README.md). Architecture decision: [ADR-P0-016](../adr/ADR-P0-016-keepsake-model-viewer-spike.md).
