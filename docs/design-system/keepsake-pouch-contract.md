# Adventure Keepsake Pouch: Slice 2 implementation contract

Version: 1.0.0 · 2026-10-16 · ADR-P0-020 / CR-0005 · Sprint 4 T0/T3/T4/T5 · PR #14.

Authority: the PO architectural directive ratifies four slots, the pure item lifecycle, Save 2 migration and the modal. This document makes that authorized slice testable; it does not approve new narrative, item opportunities, Secret Moments or later acts. Trace: FR-CNT-001, FR-SAV-001/003/004/005/006/007/009, FR-UI-001/002, FR-ACC-001..004, FR-LOC-001, GDD-PROG-001/002, GDD-CHO-002/003, TC-S4-CONTRACT-001, TC-S4-POUCH-001/002, TC-S4-SAVE-001/002, TC-S4-RETRY-001.

## 1. Readiness, boundaries and sequencing

Slice 1 baseline is develop@01cee6f; the existing Slice 2 branch adds accepted ADR-P0-020 at 9e7a0a2. Preserve all 720 existing unit cases and legacy 14-node/21-edge/12-outcome witnesses. Changes are C3 under the existing CR-0005 and accepted ADR-P0-020. Vanilla ES modules, safe DOM, original 2D SVG art and existing modal-frame supply this slice; no dependency, network service or model viewer is introduced.

Implement schemas/fixtures first, then pure domain and migration, checkpoint integration and read-only inspection, followed by fault/DOM/browser evidence. Core owns immutable facts and commands, Data validates/migrates/projects, UI holds only temporary selection/confirmation, and bootstrap composes concrete adapters. Viewing/closing the bag changes no story revision, save, flags, audio or cursor.

Content stays **2.1.0** in Slice 2. New gameplay package/tree schema 2 and content 3.0 cursor/variant/vignette mapping belong to T7/T9/T10 after narrative review. This slice publishes **pouch/save schema 2.0.0** and **saveFormatVersion 2** without claiming rewritten content exists. Published old schemas remain byte-identical. Semantic page mapping is identity for the unchanged validated 2.1 package; legacy 2.0 first passes the existing exact 2.0→2.1 migration. Unsupported rewritten content is protected, never guessed or replayed.

## 2. Pouch value and lifecycle

The durable value is `{capacity:4, held:[], acquired:[], released:[], remembered:[], memory:[]}` in both payload and checkpoint. Every array is unique and bounded (held ≤4; other lists ≤128). Item IDs use `item_` plus lowercase underscore-separated words, at most 96 characters. `memory` stores refusal tokens such as `refused_lotus_shell`, preserving the ADR example. `remembered` is the explicit encountered-item index; refusal is a memory without acquisition. Held and released are disjoint; their union equals acquired. Remembered equals acquired plus refused items. Unknown fields, nulls, duplicate IDs, contradictory sets or unregistered runtime items fail safely.

Pure `createPouch(initialState)` returns a deeply frozen validated clone or throws a typed domain error. Transaction functions return `{ok:true,value:pouch}` or `{ok:false,error:{code},pouch:original}`. A rejected action preserves the exact original reference and adds no memory. Items are resolved by the caller's validated registry; domain functions accept a valid ID or `{id}` and enforce value invariants independently.

| Action | Preconditions | Accepted change |
|---|---|---|
| collect | item not previously encountered; free slot | append held/acquired/remembered |
| refuse | item not previously encountered | append remembered and refusal token; no acquisition |
| release | currently held | remove held, append released; retain acquired/remembered |
| replace | exactly four held; old held; new not encountered | release old and acquire new at the same slot in one immutable result |
| use | currently held and authored scene utility allowed by application | hand on/consume item into released, retaining its memory |

No stacks, automatic discard, recollection, repeated reward, stat effect or inferred ending advantage. Cancel sends no domain command. Application commands require current revision, visible safe context and an explicitly supplied opportunity; rejected/stale/double commands preserve the snapshot. Future authored opportunities can use the pure transaction boundary, including refusing/replacing a fifth fixture item; this slice adds no unreviewed story choices. Existing leaf collection is the only production acquisition, paired atomically with its unchanged legacy action.

The reviewed Data-owned `act1-pouch-policy.js` bridge normalizes existing legacy choice IDs and historical flag bindings; Core contains no narrative IDs. The current release opportunity is after the final Act1 rest acknowledgement. Its command changes only pouch, revision and elapsed play time; it leaves metrics, flags, story cursor/history and the previously captured checkpoint intact. Future authored package3 DSL/vignette opportunities are not inferred from presentation data.

## 3. Migration, recovery and rollback

Validate the exact source envelope before transforming. The legacy production flag called `hasLeaf` in the directive is stored as **`keepsake.lily_fragment`**; it remains irreversible historical choice. True maps to `item_leaf` in held/acquired/remembered, false to an empty pouch. Payload and checkpoint are mapped independently from their own flag values. No other item, refusal or optional-scene completion is awarded. Existing flags, metrics, RNG, history, settings, timestamps, revision and read position stay exact. A legacy literal `hasLeaf` flag can be mapped by the pure helper only when unambiguous; production source admission still requires the reviewed catalog.

Migration is pure, deterministic and idempotent. Source digests cannot be reused after transformation: integrity-bearing source saves are protected with a typed recovery failure until verified/recomputed support exists. Already-target valid envelopes remain value-identical; future versions, unknown IDs, malformed state and unknown content fail without writes. All raw canonical/staging/backup slots remain unchanged during recovery and Resume. A subsequent normal accepted action writes Save 2 through existing stage/read-back/backup/promotion/raw-race guards; the original canonical bytes become backup. Quota/backup failure does not promote; mixed corrupt/future candidates force memory-only continuation. Never repair by saving an empty bag.

Retry restores pouch independently from checkpoint with metrics/flags/RNG and keeps latest settings. No transcript is persisted. Rollback must retain dual-format validation/write protection or disable writes; do not run a Save-1-only writer over Save 2. Raw Save 1 backup supports compatible read-only recovery; downgrading Save 2 is unsupported.

## 4. Inspection UI and assets

Use one native modal through `createModalFrame`, a pinned SVG close corner, Tab/Escape containment, inert underlay and opener focus restoration. Four equal tactile slots use 2×2 on mobile and four columns when space permits, 8/16/24/32px spacing, 44px minimum controls, Thai text up to 200%, reduced motion and high/forced contrast. Each occupied slot opens name, original 2D illustration, sensory description, status and memory text; missing images retain readable text. Released/refused items have a separate remembered location and never appear as physical held props.

The production leaf metadata uses the existing object and mother/root/current motif; it introduces no new scene or Canon outcome. Original item SVGs carry provenance and same-origin paths. Other item metadata exists only as test fixtures pending T7/T9 approval. Availability and disabled explanations for release/use come from the immutable ViewModel; inspection does not invent a safe opportunity. Explicit release/use intents require confirmation, current revision and application admission; cancel retains the item. Full-pouch retain/refuse/replace/cancel controls are exercised with fixture opportunities without changing the production graph.

## 5. Evidence and remaining approvals

Required automation: unchanged baseline suite plus domain invariant/edge cases; strict schema/reference parity; all legacy saved pages and independent checkpoint leaf mapping; staged writes/backup/quota/future/corrupt/races; resume/retry; immutable localized projection; modal empty/partial/full/detail/failure, keyboard/touch/close/cancel; six viewport profiles, 200% text and root/subpath; legacy twelve routes and no external/3D requests. Record commands and actual counts in the Slice 2 change record and evidence README. Numerical coverage supplements assertions.

PO final visual/Thai playtest, physical-device/VoiceOver/NVDA review and human PR approval remain owner gates. No merge, release or deployment is authorized. T6 history, T7 narrative/secret registry, T8 map, T9 expanded art and T10 integrated future-content commands remain separately reviewable work.
