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
- Browser checks passed for both dolls, pointer/keyboard/touch, reset/FOV, responsive layouts, failed-load retry per model and rapid/pending switches. Fixed focus transfer after hiding the open button; corrected the network test to recognize same-origin embedded texture blob URLs. Final material rebuild/browser evidence being refreshed.
- Existing game unit suite: 691 passed, 0 failed/skipped. No src changes. Final likeness, actual iPhone/Android performance and Safari/VoiceOver remain open.
