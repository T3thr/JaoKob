# Sprint 4 Slice 5 integration and verification contract

Version 1.0.0, 2026-10-17, CR-0005 T9/T10/T11, intended PR #17.

## Authority and readiness

The current PO directive authorizes architectural assessment, implementation, verification, commit/push and PR17 from `develop@bc167d3`, following merged PR16@37bad50. The branch is `feat/sprint-04-slice-05-closeout`; identity T3thr <t.theerapat33@gmail.com>. Baseline **1004/1004** passes with zero failures/cancellations/skips/todos. Private references remain untracked. This contract precedes source changes and materializes the existing CR-0005 scope, without inventing product requirements or declaring human acceptance.

Trace: ADR-P0-019/020/021; FR-UI-001/002/003/005/007, FR-CNT-001/002/004/005/006, FR-LOC-001/003, FR-SAV-001..007/009, FR-ENG-008/009, FR-ACC-001..004; NFR-US-003..006, NFR-MA-001/002, NFR-PE-001..005; TC-S4-ARCH/CHOICE/ASSET/CONTRACT/STATE/SAVE/RETRY/GRAPH/LOG/E2E/VIS/A11Y/PERF/NARRATIVE/FAIR/MAP/GIFT gates in the SSOT. Existing Core effects, all30 authored actions,28nodes/47edges/70dialogues, five item IDs, three moments and all ending rules remain unchanged.

## Assessment 1: Intent and artwork

Intent describes motive, never a calculated outcome: ใกล้ชิด, รับฟัง, เล่นด้วยกัน, เรียกหา, ตั้งหลัก, เก็บไว้, ปล่อยไป. A separate schema1 presentation catalog binds exact contentVersion3 and stable action/item IDs. Each action can have one localized short tag, an existing decorative vector motif and the same paper skin. No label/effect matching, stat-derived tag, morality color, Bond number, ending hint or hidden eligibility rule. Core alone supplies eligibility. Original `outcomePreview`, when present, is a separately described cue outside the button/reading card; disabled reasons remain authored gameplay facts.

Every current action is covered by the delivered catalog; an absent optional entry renders the normal action. Invalid locale, unknown field/reference/icon/skin/crop fails decoration safely, with a typed diagnostic and a localized notice; it must not make a valid story unplayable. The immutable published package/save schemas remain unchanged. Add a dedicated first-version presentation schema and strict runtime/reference validation.

Five original SVG item illustrations extend the established moss/ochre paper geometry. The old leaf SVG/provenance remains intact for legacy continuation. New images have intrinsic dimensions, Thai alt, same-origin paths and exact bytes/SHA-256/rights metadata; they use the existing verified image/cache pipeline with a bounded SVG capability. No script, foreign resource, embedded raster, external typeface or private reference. Fixed128px artwork space retains name, description and memory when missing/invalid/failed. A released/refused item is shown as a remembered illustration with its actual status; no unseen item details are projected. Images are demand-loaded in the pouch, not preloaded as a reward.

Authored portrait/landscape background crops are presentation only. They preserve the bottom paper and do not move the character or alter a dialogue cursor. All cards retain DOM order, equal visual weight, full Thai text, whole-card targets, and no internal scrollbar at320px/200%/forced colors.

## Assessment 2: Promotion with content-pinned continuation

**New Game uses content3. Existing games continue within their own semantic graph.** A guessed2.1-to3 cursor map is rejected: inserted branches and rewritten text do not share exact read positions. This selects the compatible-continuation option already allowed by the Act1 contract. Keep exact `act-01-2.1.0.json` and the existing2.0 proof source. Do not replay entry events or award new items/secrets to old saves.

| Input | Admitted runtime / behavior |
|---|---|
| No record or confirmed New Game | content3/schema2/Save2, current catalog and artwork |
| Save2/content3 | Identity-validated current graph; active and independent checkpoint cursor/pouch/completion remain exact |
| Save2/content2.1 | Exact archived2.1 continuation, still writing content2.1/Save2 after accepted actions |
| Save1/content2.1 | Existing pure Save1-to2 leaf mapping independently for payload/checkpoint, then archived2.1 continuation |
| Save1/content2.0 | Existing proved2.0-to2.1 presentation migration, then pure Save1-to2; no leap to3 |
| Unknown/corrupt/unsupported/integrity-bearing unproved source | Keep all raw canonical/staging/backup bytes, typed recovery/notice, no destructive write; explicit New Game consent remains available |
| Mixed incompatible content generations or later record appearing | Continue a verified candidate in memory when necessary; never let a legacy session overwrite a3.0 record, even at a higher revision |

The production composition lazily prepares a legacy runtime only when candidate versions require it. Explicit injected content ports remain single-version unless compatible sources are explicitly provided, preserving isolated verification semantics. Recover and Resume are read-only. A new session always returns to the primary3.0 bundle after the existing reset consent; cancellation/stale consent preserves every raw slot. Settings/preferences stay independent. Retry uses the checkpoint's own facts and latest settings. History stays session-only, resets across new sessions, and cannot unlock future progress.

Bind orchestrator, projection, media registry and accepted save version to the same active runtime. Share bounded image/audio facilities; metadata is version-bound and a late old request cannot paint a new session. Keep stage/read-back/backup/promotion/quota/race guards and the four-slot invariant. No schema/save field, new storage key, cross-version cursor transform, backend, telemetry, 3D or runtime dependency.

## Assessment 3: Verification and acceptance

1. Retain all1004 baseline cases with equivalent/version-traced assertions. Add catalog structure/reference/locale/path/hash negatives, real Core eligibility invariance, safe text/cues, five images/fallback/lease disposal and crop projection.
2. Prove new-game3.0 through normal bootstrap, both versions' exact active/checkpoint cursors, all supported migration steps, no Resume writes/replay, mixed/future/raw-race/quota/backup/consent protection and no legacy downgrade of3.0. Exercise Pouch/History/settings/audio/confirmation together, including full/cancel/each replacement/release-all/empty/secret completion/Resume/Retry.
3. Run independent schema validation and `node tests/design/ending-trajectories.mjs`; latter remains Act4-5 design verification for Sprint5, not runtime E2E.
4. Run retained legacy12 browser witnesses through actual production compatible continuation, plus current production root/subpath journeys at six prescribed viewports, keyboard/touch emulation/200%/forced/high contrast/reduced motion and failed media/storage. Inspect screenshots and real displayed Thai. Installed web-game client diagnostics remain test-only.
5. Measure current critical transfer/save/cache bounds; recorded Chromium Fast3G/CPU profile20cold+20warm,100actions across5runs and3x30s frame samples. Distinguish DOM/CPU/rAF samples from physical-device painted-frame/AT certification. Create an allowlisted static artifact outside the checkout, smoke it and rehearse rollback without deployment; inspect secrets/network/asset rights.
6. Update trace, evidence, new audit, SSOT/CHANGELOG/progress and PR17. Mark delivered engineering separately from human PO/Thai/Art/device/AT approval and merge. No AI self-certification of final literary quality or full-game/3D acceptance.

## Rollout and rollback

Rollout is this single fifth PR for review; no merge/deploy is authorized. No player-data migration to3.0 occurs. A reviewed Git revert restores the prior default, while dual Save2 admission/downgrade protection must preserve raw3.0 records. The rollback rehearsal must prove compatible2.1 continuation and protected3.0 data under the old application. Never clear player keys or manufacture an empty pouch to make a record load.
