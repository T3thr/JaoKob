# Change Record: Adult keepsake variants and upper-eyelid coverage

- **Record ID:** CR-20261019-1036
- **Timestamp:** 2026-10-19T10:36:00+07:00 (Asia/Bangkok)
- **Authority:** CR-0004 Milestone 1D; explicit PO follow-up; existing ADR-P0-025 defaults preserved
- **Status:** Technical verification complete; PO visual review / PR merge pending
- **Operator:** Astra — 3D asset and preview implementation

## 1. Intake, impact and plan

The PO requested heart holding and crochet options for the adult doll, matching childhood, and a smooth upper eyelid covering exposed sclera from above. The scope/acceptance contract was added to CR-0004 before implementation. Both dolls retain empty-handed / Velour defaults. This is an isolated asset/preview change; no new facial emotions, production lore, physical-scale requirement, embroidered message, src/, tests/, Save/schema, runtime dependency or release work.

Continue the still-open Draft PR #19 on `feat/sprint-05-childhood-stance-material`, in its isolated worktree originally based on develop. Fetched develop remains `d1af293`. The shared planning checkout and in-progress dialogue/ADR/act-blueprint work are preserved. Active Sprint5 Section 7 receives a separate audit row; none of its twenty production tasks is completed by this spike.

## 2. Trace and artifacts

| Approved scope | Implementation | Evidence |
|---|---|---|
| CR-0004 M1D adult stance parity | 38 shared parts, 8 resting arm parts, 8 hugging arm parts, one optional heart; 4 GLB nodes, paused STEP `HeartEmote` | Raw GLB scale checks, reopened Blender source/helper, four rendered browser states |
| CR-0004 M1D material parity | Default Velour; KHR_materials_variants Crochet with the original 128px color/normal tiles | Actual browser material maps, packed images, independent per-doll choices |
| CR-0004 M1D eyelid correction | Closed manifold upper-eyelid hoods replace decorative edge tubes; open front retains sleepy expression | Before/after top/high/front renders, source ray checks and final GLB browser captures |
| ADR-P0-025 preservation | Shared packaging extracted without changing childhood contract | Childhood blend/GLB/renders/textures match `688e738`; independent childhood GLB export byte-identical |

Adult `.blend` embeds `Adult_Variants.py` and preserves unused Crochet through fake user/packed images. UI controls are common to both dolls, localized and independent; each doll remembers its choice for the page session. Stance/material changes reuse the loaded GLB; reload returns defaults. Heart is optional and separate from the body. Shared `keepsake_variants.py` contains standards-based packaging; runtime preview uses public model-viewer APIs only.

Changed artifacts are under `docs/proposals/3d-keepsake-spike/`: adult generator/source/GLB/renders; shared packager and Blender helper; HTML/JS/Thai strings; verification scripts, screenshots, metrics, provenance, manifest, README/progress. The childhood generator only delegates its former packing function to the shared helper. Original yarn PNGs and childhood authored assets are preserved. No reference photographs are embedded or uploaded.

## 3. Verification performed

| Gate | Result |
|---|---|
| Adult GLB | **1,038,744 bytes; 24,201 total stored triangles**, within 2 MB / 25k caps, including hidden poses |
| Adult visible triangles | Empty: **21,688**; heart: **22,425** |
| Structure | 4 nodes, 4 meshes, 3 materials, 5 primitives, 2 embedded 128×128 images |
| Khronos Validator | Both GLBs: **0 errors / 0 warnings**; 6 informational unused UV/tangent notices each, unfiltered reports retained |
| Blender 5.2.2 LTS | Saved adult source reopened; default visibility/materials, optional heart, packed textures, embedded four-state helper and closed manifold eyelids pass |
| Sclera occlusion | Old vertical view: **248/732** sampled white vertices visible; corrected: **0/676**. Upper-cap rays at 60°/75° elevation × 8 azimuths also show 0 exposed hits. Sampling is supplemented by visual inspection, not a claim about every possible ray. |
| Browser combinations | All **8** doll × stance × material pairs inspect actual mesh scales and material maps; paused state, poster/defaults, keyboard/focus, rapid/delayed selection, close/reopen and per-doll memory pass |
| Preview regression | Mouse orbit/wheel, emulated touch orbit/pinch, reset/FOV, 320/390px layouts, ≥44px controls, reduced motion, per-model failure/retry and stale callbacks/import cancellation pass; no unexpected console errors or external requests |
| Final visuals | Adult front/side/back/three-quarter, alternate stances/materials, top/high Blender and web captures inspected; skill action-loop ready-state screenshot/text inspected |
| Game regression | `node --test tests/unit/*.test.js`: **1,060 passed, 0 failed, 0 skipped**, 18.43s; game source/tests untouched |
| Repeat export | Adult JSON, positions, canonical triangle indices, UVs, colors and textures identical; one normal differs by at most **0.00006754/component** from Blender accumulation. Not claimed byte-identical. Childhood repeat export is byte-identical. |
| Static/artifact checks | Python syntax, JavaScript syntax, scoped diff whitespace and SHA-256 manifest verified; no backup files/dependency symlink staged |

Commands and linked reports: [Spike README](../../proposals/3d-keepsake-spike/README.md). [Repeat export evidence](../../proposals/3d-keepsake-spike/evidence/adult-rebuild-verification.json) records the exact limitation. Adult export canonicalizes only opaque triangle order, retaining winding and geometry. No validator issues are suppressed.

## 4. Not performed, migration and remaining gates

Physical iPhone/Android FPS/GPU-memory profiling, Safari/Firefox/VoiceOver, Blender4 compatibility, final PO likeness approval and production integration/deployment are not performed. Velour is a light PBR approximation; crochet uses tiled relief, without individual fibers. UV convergence at poles and inferred adult rear geometry remain prototype limitations. Size budget excludes the library, posters and decoded GPU memory.

No Save/schema/content migration. A reviewed revert of this M1D commit restores the adult M1 base and childhood-only controls; do not revert the earlier ADR25 childhood correction as part of that rollback. Model URLs and semantic heart node names are retained; numeric indices are not a public contract. Human art review and PR merge remain open; no merge/deploy is performed.

## 5. Delivery

Continue [Draft PR #19](https://github.com/T3thr/JaoKob/pull/19) to `develop`, with its description rewritten around both dolls' final variant behavior and adult eyelid fix. The active Sprint5 audit registration is updated separately on its planning branch, without staging narrative work.

Implementation **`71b6d71`** was pushed to the asset branch and PR #19 title/body updated for the combined final scope. Active Sprint5 audit registration **`9a1175b`** was pushed on `feat/sprint-05-planning-ssot` using `git commit --only` for its SSOT; ongoing dialogue and untracked ADR/blueprint files remain untouched. Both commits used verified `T3thr <t.theerapat33@gmail.com>` identity. The local 4175 preview was refreshed and left showing adult heart/Crochet for PO inspection.
