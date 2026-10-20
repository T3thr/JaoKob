Original prompt: Start the adult blue-shirt plush model. Milestone 1: editable Blender Python base mesh, instructions to run/render/export, and a simple lazy-loaded model-viewer page for the first GLB spin. Childhood heart is optional; emotion variants deferred.

- 2026-10-13: CR-0004 records authorization, scope, inputs and acceptance criteria. Base generator and isolated local viewer authored. Blender runtime being prepared for actual export/render checks.
- User explicitly approved model-viewer lazy loading during work; production ending integration remains outside Milestone 1.
- 2026-10-14: Executed generator with the owner's installed Blender 5.2.2 LTS. Temporary download was stopped; no alternate Blender installation was installed.
- Final base: 46 editable parts, 22,508 triangles, 2 exported material primitives, 546,020-byte GLB, 45,296-byte JPEG poster. Four rendered views inspected; rear remains inferred.
- Fixed visual shirt penetration and high seat, excluded default-scene geometry, joined export-only copies, corrected collar sweep. Preserved editable Blender parts.
- Browser checks and screenshots passed. Fixed retry cache behavior and reset of both orbit and FOV after pinch. Keyboard, pointer, touch emulation, narrow layouts, reduced motion and zero external requests verified.
- Existing game unit suite: 691/691 passed. Physical-device FPS/memory, Safari/VoiceOver and final likeness remain open; no game/save integration performed.
- Follow-up: owner review of proportions; smooth construction joins, refine eyelids/lips and bake velour detail. Childhood heart remains optional and emotions deferred.

## Milestone 1B — 2026-10-14

- Owner explicitly requested continuation on the same spike: childhood continuous pill torso/head, bright round eyes with two highlights, blue crochet band, short three-lobed hands/feet, default hugging pose and optional separate heart. Emotion variants remain deferred.
- Extended CR-0004 and added ADR-P0-017 for separate childhood body/heart export; kept ADR-P0-016's adult decision intact. Continued the open feature branch/PR #11; fetched develop remains 4c8d600.
- Implemented build_childhood_model.py, preserving the adult generator/artifacts. Source has 39 body parts and one heart in an accessory collection; GLB has named independent body/heart nodes. Two 128px procedural yarn tiles are packed/embedded, with no photographic data.
- Inspected render iterations. Corrected twisting arm sweep frames, adjusted ground contact/crown, replaced diamond-like relief with rounded stitches, reduced geometry, exported explicit tangents and fixed duplicate-name suffix on the heart. Tuned matte material after comparing the browser render with Cycles.
- Added segmented doll selection. Before activation only poster/text change; after opening 3D only the selected GLB is loaded. Request generations guard against obsolete async callbacks, including module import and model-load cancellation.
- Browser checks passed for both dolls, pointer/keyboard/touch, reset/FOV, responsive layouts, failed-load retry per model and rapid/pending switches. Fixed focus transfer after hiding the open button; corrected the network test to recognize same-origin embedded texture blob URLs. Final material rebuild and browser evidence completed; childhood is ready in the local in-app preview.
- Existing game unit suite: 691 passed, 0 failed/skipped. No src changes. Final likeness, actual iPhone/Android performance and Safari/VoiceOver remain open.

## ADR-P0-025 — 2026-10-18

PO mandate: default empty-handed seated stance and adult-tone velour; retain independent heart emote and crochet alternate. Isolated develop-based checkout preserves active narrative working tree. Implement four GLB mesh nodes with a STEP scale stance selector, KHR_materials_variants, default source visibility, embedded Blender helper, and localized preview controls. Verify raw GLB defaults, both stances × both materials, lazy loading, races/retry, renders, current game regression, and budget. No production integration, save change, new facial emotes or adult asset edits.

- Completed: source defaults and embedded four-state helper verified after reopening Blender; corrected smooth-material seam by welding coincident positions while keeping loop UVs. Final GLB 704,780 bytes / 15,728 total stored triangles (12,584 default-visible / 13,384 heart-visible), validator 0 errors / 0 warnings.
- Browser regression and four-state rendered-node/material checks passed, including rapid/pending selection, reload defaults, close/reopen, responsive controls and zero extra GLB fetches for variants. Screenshot action-loop inspected. Game regression: 1,060/1,060.
- Follow-up remains PO visual review, real mobile GPU/FPS, Safari/AT and future production integration. No production WBS task is completed by this correction.
- Delivery: implementation `741b0b5`, Draft PR #19 to develop; active Sprint5 audit reference `81c2402` on the planning branch. Existing narrative edits preserved.

## Milestone 1D — 2026-10-19

PO requests adult parity (heart stance and crochet material) and smooth upper eyelids that cover exposed upper sclera from above. Continue open PR #19 on its original develop-based worktree. CR-0004 records explicit scope/acceptance; defaults stay empty/Velour for both dolls. Implement adult optional arm/heart groups and shared standard GLB packaging, genuine eyelid hood, separate per-doll choices, source/raycast/render/browser verification and game regression. Preserve childhood GLB/blend/render/texture bytes. No production lore, embroidery, src/Save/schema or facial-emote work.

- Completed adult optional heart arms and Crochet parity, with empty/Velour defaults and per-doll session memory. Replaced decorative upper-lid tubes with closed hoods; top/high/front visuals retain the sleepy expression and cover the upper sclera.
- Final adult: 1,038,744 bytes, 24,201 total stored triangles, validator 0 errors / 0 warnings. Reopened-source checks and 17 sampled occlusion angles pass (old top 248 exposed samples; new top 0). All eight browser combinations and interaction regression pass; game tests 1,060/1,060.
- Repeat adult exports have identical JSON/positions/indices/UV/colors/textures but tiny Blender normal variation (max 0.00006754/component); no byte-identical claim. Childhood repeat GLB is byte-identical; existing childhood authored assets/tiles remain unchanged.
- Remaining: PO art review, physical-device profiling, Safari/AT, future production integration. No production WBS task completion.
- Delivery: adult implementation `71b6d71`, active Sprint5 audit `9a1175b`, updated Draft PR #19. Local 4175 browser refreshed to adult heart/Crochet for PO inspection.

## Session hand-off — 2026-10-20

- PR #19 was merged into develop at `7476722` by explicit PO authorization on 2026-10-19. The merge tree matched verified head `94f8b74`; the then-current planning branch/status and 798 file hashes were unchanged. Historical Draft statuses above describe their original delivery times.
- PO discussed standing childhood/adult characters with breathing, dialogue gestures, surprise, anxiety and thinking for the VN. Astra recommends an adult-first, one-scene hybrid 2D background/3D character experiment, preserving seated Keepsakes. No rig/acting/runtime implementation has been approved or started by that discussion.
- Added STRUCTURE.md and HANDOFF.md with source/export/evidence roles, lessons, current metrics, missing reference-folder status, active-planning caveats and proposed next steps. Direct develop documentation commit/push is explicitly authorized for this turn; it is not ongoing permission for later features.
- Tests reported in older entries remain historical. This documentation turn checks links, facts, scope and hashes; it does not rerun Blender/browser/game tests. Active planning SSOT registration is left for its owner to preserve Antigravity work.
