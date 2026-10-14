# Change Record: Childhood Crochet Keepsake — Milestone 1B

- **Record ID:** CR-20261014-1244
- **Timestamp:** 2026-10-14T12:44:00+07:00 (intake)
- **Milestone:** CR-0004 / Milestone 1B, continuation of the isolated post-Sprint-3 spike
- **Operator:** Codex / 3D and Graphics implementation
- **Status:** Technical verification complete; owner art review and physical-device verification remain open

## 1. Objective and authority

The owner explicitly requested a childhood crochet amigurumi in the existing spike: one pill-shaped head/torso, raised round eyes with white rings and two highlights, orange-red smiling lips, blue sweater band/short sleeves, short seated limbs with three-lobed fingers/toes, and a default red-heart hugging pose. The heart must be independently removable in the source; this delivery also preserves its own GLB node. Emotion variants remain deferred.

Continue the existing branch/PR #11 as requested. Fetched `origin/develop` remains `4c8d600`; no branch reset, history rewrite, merge or deployment. Preexisting GDD edit and reference photographs are preserved and excluded from staging.

## 2. Traceability and impact

- `CR-0004` Milestone 1B defines the owner-approved scope, observable acceptance, failure cases, WBS and evidence.
- `ADR-P0-016` retains the original same-origin demand-loaded model-viewer decision; `ADR-P0-017` records the separate childhood accessory export without rewriting the adult decision.
- `GDD-VIS-003`, `NAR-SC-A5-007-HOME`: motivation only, no Canon/ending changes.
- `NFR-PE-004`, `FR-ACC-001/003`: isolated demand loading, keyboard selection/focus and touch targets.
- No `src/`, root runtime dependency, save/schema, mechanics or game localization changes. UI strings are local to the spike.

## 3. Changed artifacts

- [Childhood generator](../../proposals/3d-keepsake-spike/scripts/build_childhood_model.py), editable `.blend` and `.glb`; original adult model/render/generator hashes remain unchanged.
- Four 1000×1000 renders and poster under `renders/childhood/`; two authored 128×128 crochet texture tiles in `textures/`, packed/embedded rather than requiring external resources.
- Same preview page now has keyboard-accessible segmented selection. Selection before activation changes poster/text only; selection after opening loads only the chosen GLB. Obsolete asynchronous import/load/error callbacks cannot replace the current selection.
- GLB validator extended for both models, budgets, embedded textures and independent heart node. Blender source verification checks part/collection contract and packed textures. Browser checks extended for two-doll behavior and asynchronous recovery.
- [Spike README](../../proposals/3d-keepsake-spike/README.md), provenance/metrics/manifests, CR WBS, proposal index, root changelog and post-Sprint-3 audit reference.

## 4. Verification and evidence

| Gate | Result and evidence |
|---|---|
| Blender source | **Passed**, Blender 5.2.2 LTS ARM64. Opens successfully; 39 editable body parts + 1 separate heart; two highlights per eye, three lobes per hand/foot, packed texture tiles. [Source report](../../proposals/3d-keepsake-spike/evidence/childhood-source-verification.json) |
| Export/performance budget | **Passed**, **598,144 bytes** including textures, **13,400 triangles**, 2 nodes/meshes, 2 materials, 3 primitives. Below 600 KB target and 2 MB / 25k hard caps. [Metrics](../../proposals/3d-keepsake-spike/evidence/childhood-model-metrics.json) |
| glTF contract | **Passed**, Khronos **0 errors, 0 warnings**, no external URI/cameras/animations. Two informational unused UV/tangent notices on the smooth eye material are reported without filtering. `Accessory_RedHeart` is a distinct visible-default node/mesh. [Validator](../../proposals/3d-keepsake-spike/evidence/childhood-glb-validation.json) |
| Render inspection | **Performed**, front, side, rear and three-quarter compared with local references. Refined crown/ground contact, corrected arm frame twist, authored stitch relief and tuned matte material after browser comparison. Likeness remains owner review. |
| Browser interaction | **Passed**, Chromium 151.0.7922.34: selected-model demand loading, keyboard/labels/focus, mouse orbit/wheel, touch orbit/pinch emulation, camera/FOV reset, close/reopen, 390/320px layouts, ≥44px controls, reduced motion, no third-party requests or normal-flow console errors. [Browser report](../../proposals/3d-keepsake-spike/evidence/preview-verification.json) |
| Async/error recovery | **Passed**, failure/retry per model, switching during GLB load, obsolete load/error events, rapid switching and Escape during deferred component import. Same-origin blob URLs for embedded textures are correctly distinguished from external requests. |
| Game regression | **Passed**, `node --test tests/unit/*.test.js`: **691 passed, 0 failed, 0 skipped** (~73.36s while rendering). [Summary](../../proposals/3d-keepsake-spike/evidence/childhood-unit-summary.txt) |
| Syntax/artifact/trace | Python compilation, JavaScript syntax, diff whitespace, local documentation links and manifest/hash checks. Playwright action-loop screenshot/state inspected; state is ready/childhood/loaded. |

Commands and rerun instructions are in the Spike README. GLB budgets exclude the existing model-viewer library, HTML/CSS/JS and 70,716-byte JPEG poster; they do not measure decoded GPU memory.

Not performed: physical iPhone/Android FPS/GPU-memory profiling, Safari/VoiceOver/manual screen-reader sign-off, final owner likeness approval, Blender 4.x compatibility, production END-HOME integration or deployment. Browser emulation is not a real-device certification.

## 5. Migration, rollback and follow-up

No save/content/schema migration. Revert Milestone 1B to restore the adult-only preview; adult authored assets are unchanged. No emotion system or web heart-toggle was added. In Blender the heart's collection can be hidden for inspection, while the generator always includes the requested default heart pose.

This is an editable **base mesh**, with stylized repeating crochet relief and visible construction/UV limitations when zoomed close; no real yarn fibers, animation rig or final retopology. Proportions are estimated from photos, not scanned or physically measured. Follow-up: owner likeness review, softer joins and tailored stitch directions/fuzz, then real-device checks before production integration.

## 6. Git delivery

Branch `feat/spike-adult-plush-model`; implementation commit `d356300` was pushed and [existing draft PR #11](https://github.com/T3thr/JaoKob/pull/11), targeting `develop`, was updated to cover both dolls. Git identity was verified as `T3thr <t.theerapat33@gmail.com>`. All 42 manifest entries matched; eight adult authored artifacts retained their previous hashes. The user's unrelated GDD edit and local reference photographs remain unstaged. No merge or deployment was performed.
