# Act 1 narrative and content 3 contract

Version 1.0.0 · 2026-10-16 · CR-0005 D2/D4/D5 · Sprint 4 Slice 4, T7/T8 · intended PR #16.

## Authority, intake and readiness

The current PO directive authorizes actual seven-scene Thai rewriting, four childhood objects, a fifth natural object, 2–3 optional moments, content/schema corrections and an Act 2–5 handoff. Baseline is `develop@ec12038`, containing PR #14 `6692c1b` and PR #15 `f8ee156`. Branch: `feat/sprint-04-slice-04-narrative`; identity T3thr. Baseline regression: 935/935, no failure/cancel/skip/todo. Existing private references remain untracked.

Trace: GDD-CONT-001..004, GDD-CHO-002/003, GDD-DEC-A1-001/002, GDD-BAL-001..008, GDD-END-004..006; NAR-ACT-001/002, NAR-DLG-001..005, NAR-VOI-001..004, NAR-TONE-001, NAR-CON-001..010; FR-CNT-001/002/004/005/006, FR-LOC-001/003, FR-SAV-001/003/005/006/007/009; ADR-P0-020. Observable acceptance: T7-AC-01..04 and T8-AC-01..08 in the active SSOT. This contract materializes the authorized C3 content change under CR-0005; it does not declare generated prose finally accepted by the human editor.

DoR is satisfied for the authored candidate: IDs, pure predicates/transactions, compatibility policy, bounded saves, safe text-only item presentation, graph witnesses and automated evidence below. No new runtime dependency or art asset. Canonical scene meanings, all old flags and the three ending categories remain intact. Later-act runtime, expanded art/Intent Tags and consolidated bootstrap migration are T9–T11/Sprint 5.

## Version and rollout boundary

`src/data/content/packages/act-01.json` becomes **content 3.0.0 / package and tree schema 2.0.0**, an executable review candidate. Archive the exact prior bytes at `src/data/content/compatibility/act-01-2.1.0.json`. Published schema bytes remain immutable; add versioned common/tree/package contracts. The existing application accepts the new candidate through its content port and is exercised with real storage/DOM/browser tests.

The normal entry point stays explicitly pinned to archived 2.1 until Slice 5 T9/T10 promotes the candidate together with art/catalog and reviewed migration. This is the fixed five-PR matrix's integration boundary, not permission to defer the actual rewrite. Existing 935 assertions use the archived baseline; their assertions and historical 14-node/21-edge/12-outcome expectations remain intact. New graph evidence is separate.

Save format remains **2**, schema 2.0.0. New version-3 Save 2 records round-trip unchanged; never apply the legacy leaf transform to them. Format 1/content 3 is unsupported. No guessed 2.1→3 cursor conversion: every old node/dialogue retains its semantic ID, but rewritten prose and inserted branches are not byte-equivalent read positions. Slice 5 must either prove an explicit cursor map or retain compatible 2.1 continuation. Until then old records remain protected by the existing version/write guards. No on-enter replay, retroactive items or invented secret completion.

## Authored data and pure execution

Package `keepsakes` registers at most 128 stable item IDs. A choice/interaction can declare one `pouchEffect`: collect/refuse/release with `itemId`, or atomic replace with `itemId` and `oldItemId`. All IDs resolve to that registry. Core executes this effect in the same accepted story transaction; failed capacity, stale revision or ownership checks preserve the original snapshot. No item action changes meters implicitly. The Data bridge normalizes authored effects and keeps all story IDs outside Core.

Schema-2 conditions add `kind:pouch` with itemId and state held/acquired/released/remembered/unseen; `kind:pouch-capacity` with state full/space; and `kind:node-completed` with nodeId. Conditions read the pre-choice immutable snapshot, including nested all/any/not. Unknown states, unregistered IDs and malformed pouch data fail closed. Old condition schemas remain unchanged.

Secret moments use the existing exact semantic dialogue cursor and `progress.completedNodeIds`; no return stack, extra save field or durable transcript. Each registered moment has one cutscene of three beats and a fixed onward target. Completion is recorded only when its final beat is acknowledged; optional entry is hidden thereafter. Retry removes downstream completions through the existing checkpoint traversal; Resume reads the current beat without executing entry effects. No timers, meter rewards or completion counters appear to players.

## Scene and object registry

| Canon anchor | Candidate content / convergence |
|---|---|
| A1-001 | Six fresh opening beats; mother slows for a trailing child and steadies a folded leaf pouch with her snout; living tadpole, no hands/toy body |
| A1-002 | Four existing sensory observations rewritten; optional dew/lotus moments, collect or leave; each rejoins nursery before the original three home directions |
| A1-003 | Mother / roots / siblings retain exact flag meanings; concrete shared actions |
| A1-004 | Six storm beats; weather independent of choices/items; no death/ghost/fault; slower water and deliberate breath before coping |
| A1-005 | Existing deterministic effects retained with explicit exertion/overstimulation/rest causes and truthful cues/feedback |
| A1-006 | Leaf centerpiece retains irreversible historical flags; optional rain-petal and fifth-object offering at the quiet bank |
| A1-007 | Held / acquired-then-released / refused / empty comfort before six new rest beats; final acknowledgement captures Save 2 checkpoint |

| Item ID | Encounter / later use |
|---|---|
| item_leaf | Existing post-storm leaf decision; mother waiting under green shade; historical `keepsake.lily_fragment` never cleared by later release |
| item_dew_stone | Optional nursery light moment; the family waits while a point of light returns |
| item_lotus_shell | Optional nursery rhythm moment; a sibling nudges the hollow shell and waits for another ripple |
| item_rain_petal | Optional sheltered bank moment; rain has become separate drops, observable through any item state |
| item_river_shell | Fifth **natural** object: empty river-snail shell with curved markings, seen from safe shallow water; no new human material |

`item_red_yarn` belongs to A2-006 in the map, not the Act 1 runtime registry. No object is auto-awarded. At the fifth offering, a full pouch truthfully offers refusal/keeping the current four or replacement of one chosen held object. Existing confirmation supplies cancellation with no mutation. Quiet-bank and completed-rest release opportunities allow an actually empty pouch; no release is allowed mid-voiced callback. Item descriptions remain readable without images; new art is T9.

The leaf's legacy +10/+5 morale effects remain **story coping** effects with distinct authored causes, not a general inventory reward. All new object/secret actions have zero metric effect. Resting/memory defaults never claim a released object is physically present. Later physical leaf-sharing requires held membership as well as historical acquisition; equivalent voice/distance alternatives retain the baseline trust budget.

## Verification, migration and rollback

Retain all 935 baseline cases and independently hash the archived content and published schemas. Add strict/reference schema positives/negatives; pure nested predicate/atomic effect/revision cases; exhaustive reachable node/action witnesses with optional choices normalized; full/refuse/each replacement/cancel/release-all routes; all seven scenes, secret skip/read/ack/Resume/Retry, callback state truth; Save 2/checkpoint round-trips and bounded UTF-8 size. Browser evidence uses the actual composition port with the candidate, existing native UI and actual Thai pagination at small/large profiles. No production debug hook.

T8 supplies a testable design truth table, effect provenance/recovery matrix, restrained girl and model-gap manifest. It cannot establish unimplemented later-act E2E. Human Thai/PO/art, physical-device/AT and final T11 performance acceptance remain open. Rollback reverts the candidate/contract changes while the pinned 2.1 entry continues; preserve Save 2 raw backups and downgrade/write guards. Never clear player keys or convert version-3 saves into empty version-2.1 bags.

## Review findings applied within the authorized slice

Actual screenshot inspection found inherited320px/200% HUD crowding and long decorative fallback text. The single capsule now wraps meters/utilities, illustrations reserve128px and small slots use a concise localized fallback; full item prose remains in inspection. Actual browser checks were rerun. Core review also fixed target-guard ordering so it evaluates the post-pouch candidate atomically; a rejection still returns the original snapshot. Final evidence is990unit cases,974route witnesses,12legacy routes and21candidate captures; these are implementation evidence, not human editorial/AT acceptance.
