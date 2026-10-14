# CR-0005: Sprint 4 Visual, Narrative & Interactive Overhaul

| Control | Value |
|---|---|
| Version / date | 0.1.0 / 2026-10-14, Asia/Bangkok |
| Status | **PROPOSED — analysis and planning authorized; implementation awaiting D1–D7** |
| Author | Codex / Senior Technical Lead, Game Director, Principal UI/UX Architect |
| Scope | Cross-layer presentation/log/collection; narrow runtime dependency exception |
| Sources | [Proposal](../proposals/sprint-04-overhaul/01-proposal-plan.md), [draft SSOT](../sprints/sprint-04-ssot.md), [approved Sprint 3](../sprints/sprint-03-ssot.md) |

## 1. Context and problem

Sprint 3 has integrated functional benchmark code, 691 unit tests and historical Chromium routes. Actual retained screens still present nested feedback/save/narrative panels, generic text-only choices, heavy HUD and a character cutout with weak environmental placement. PO requests a reviewed plan before production implementation.

The approved image targets establish composition intent; CR-0003 D5–D8 retain tadpole Canon, three Scene 3 choices, locked Bond and deferred full backlog/typewriter. Log is now requested; animated typewriter remains outside this proposal. Completed 3D spike assets are candidate input; their accepted spike ADR does not approve a new game runtime dependency or toy Canon in Act 1.

## 2. Goals and non-goals

Goals: target-informed warm reading/decision composition; true Title/Reading/Decision separation with original Exploration/recovery/notice flow; meaningful choice intent/cues; readable session backlog; opt-in two-doll inspection; clean layer boundaries, equivalent baseline tests/save results and owner/manual evidence.

Non-goals: new domain states/metrics/choice effects/stable-ID semantics/Canon/endings, all-seven-scene media production, persistent exact transcript, item economy, heart/emotion controls, auto-advance/typewriter/speed/skip delivery, voice/TTS, backend/CDN/telemetry/Login, automatic merge/release/deploy. Exact approved content edits are separately versioned changes, not permission to change every narrative string.

## 3. Decisions requested and alternatives

| Decision | Recommended option | Alternative and consequence | Approver / current status |
|---|---|---|---|
| D1: delivery scope | Polished Scene 1–3 benchmark + Act 1-wide presentation/Log/Drawer; proposal rubric | Full Act 1 media production requires additional art schedule/budgets and WBS | PO/Art/QA — pending |
| D2: authored presentation data | Strict independent versioned presentation/keepsake catalogs joined to exact contentVersion + stable IDs | New v1.3 package/tree adds intent/model/crop types; greater schema/capability/migration surface; frozen old schemas still unchanged | Architect + UI/Data + PO — pending |
| D3: history | Pure ephemeral session reducer; 50 latest dialogue records plus 50 chosen action/interaction records; honest reload reset | Cross-reload exact transcript requires new versioned store/save field, byte/consent/recovery/migration design; cannot reconstruct from unique viewed IDs | PO/Narrative/Architect — pending |
| D4: Act 1 meaning | Non-diegetic “ของสะสม”; childhood default; adult early selection only on explicit owner approval; no effects | Title-only adult edition if visual spoiler; diegetic doll inventory would conflict with tadpole/END-HOME Canon and requires separate Canon change | PO + Narrative/Game Design — pending |
| D5: viewer | Pin same 4.4.0 model-viewer candidate, vendored same-origin and demand-loaded after explicit 3D action; new narrowly scoped production ADR | Poster-only preserves Vanilla baseline but does not fulfill 3D spin; custom WebGL/Three.js expands lifecycle/scope and still needs dependency review | Architect + PO + QA — pending |
| D6: art/editorial | Approve seven proposed intent labels and benchmark editorial/art brief; preserve effects/IDs/order/life stage; exact copy/assets reviewed per task | Keep existing prose while delivering tags/cues/UI; broad narrative redesign requires separate Canon/mechanics analysis | Narrative + Game Design + PO/Art — pending |
| D7: quality profile | Agree device/browser/AT reviewers, performance method, 3D memory target and phased acceptance | Automation-only remains prototype evidence; it cannot close manual visual/device/accessibility DoD | QA + Accessibility + PO — pending |

No option is Accepted by the author. After explicit owner disposition, create approval change record, update SSOT DoR and create a new production ADR for D2/D3/D5 as applicable. ADR-P0-016/017 remain historical spike decisions.

## 4. Proposed design and contracts

### 4.1 Presentation

Renderer remains a semantic DOM adapter. Persistent scaffold has background/character/HUD/reading/actions/utility/overlay regions. Patch by stable region and view identity; media/save updates cannot replace the whole scene or close dialogs. Keep RendererPort operations and old VM defaults; proposed explicit prompt/cue/tag/status/overlay fields are immutable/localized and validated. No CSS selector, DOM node or raw path in pure VM. Story controls preserve revision/busy guards.

Save success/failure/saving remain visible text in rail; persistent memory-only/protected/errors have safe actions. Immediate feedback and actual meter deltas remain observable with one announcement. Content warnings remain separate. Native Next button is visible only when facts.canAdvance; no new transition introduced for visual pacing.

### 4.2 Backlog

A browser-free application reducer receives accepted display/action occurrences, with injected sequence/session identity. The Data projector resolves/validates full text + speaker/scene/locale. UI only renders. Capture dialogue only after successful visible presentation; failed render must not append an unseen line. Accepted action records reference the label the player selected; response line follows it only when actually displayed.

`payload.history` and `progress.viewedDialogueIds` retain their old meanings, bounds and Resume role. Log is ephemeral, read-only and separate from domain save. New Game clears only upon acceptance, retry/revisit append new occurrences, settings/render/save/media/rejected actions append nothing. Reload starts current page only and states that earlier transcript belongs to the previous session.

Native log modal is one active overlay, with inert background, keyboard trap/Escape/restoration, no bulk live announcement and stable scroll under async updates. Existing Settings/confirmation are compatible; overlay intents never become story SELECT_CHOICE transactions.

### 4.3 Collection and model descriptors

Collection is not a story item or reward. UI uses localized poster/descriptions, then explicit 3D action. Only selected model loads, with keyboard orbit/zoom/reset and gesture equivalents; no autoplay/AR/heart toggle. UI adapter gets validated resolved descriptor/loader through bootstrap, not direct Data imports.

Current content schema permits only image/audio/font assets. Independent catalog must strictly describe GLB/poster/title/alt/hash/bytes/rights/version. Unknown/mismatch rejects feature safely without losing readable story. Production resources live under reviewed `assets/` paths; no runtime import from docs/spike node_modules. Library license/transitives/security/network reviewed before promotion. No Draco/KTX2/external-texture dependency is required by current self-contained GLBs; future compression is separately reviewed.

Component import is memoized and uncancellable in practice; generation tokens discard late callbacks. One active viewer/model, explicit timeout/retry/poster, detach on close/hidden/dispose and measure internal caches/GPU lifecycle. Do not invent a supported disposal API or claim DOM removal frees all memory.

## 5. Impact, compatibility and migration

| Boundary | Impact / protected behavior |
|---|---|
| Domain/state/mechanics | None intended: six states, 14 nodes/21 edges/12 outcomes, metrics/flags/RNG/checkpoints unchanged |
| Application | New ephemeral history/overlay intent policy; accepted-display sequencing; modal-aware focus handling |
| UI | Significant component/styles/notice/focus changes; new semantic dialogs and browser-only opt-in viewer |
| Data | New strict catalogs/projection/model descriptors/resolution; no UI import and no parsing in renderer |
| Save | Format1/current2.1 frozen; no transcript/camera/model/overlay field/key; exact Resume/retry/candidate guards retained |
| Narrative | UI Intent Tags/collection framing require owner review; optional exact editorial/media edits must be versioned separately |
| Runtime baseline | model-viewer is a real runtime library on activation; new narrow C3 exception pending, no framework/general engine adoption |
| Assets/rights | Promote only selected reviewed spike exports + required vendor/license resources; no photos/source project/canon assertion |
| Tests/release | Existing regression/equivalent assertions retained; new catalog/log/modal/viewer faults; no release permission |

UI/catalog delivery can leave content 2.1.0/schema1.2/save1 byte-identical. If content edits are approved, use new contentVersion and explicit current→new compatibility map, pure validation/migration, raw candidate backups and rollback write guard. Frozen old published schema is never edited in place. Unknown future saves remain protected and no downgrade is guessed.

## 6. Security, privacy, accessibility and budgets

Same-origin static resources; path/hash/MIME/size/reference checks; strict JSON and safe DOM. No tracking/player uploads/new personal data/secrets. Keep original namespace/storage consent policy. Model reference photos remain local and excluded from distribution. This RFC requires existing asset rights/provenance review; it does not decide legal clearance.

All labels/alt/loading/error/controls come from localization. Keyboard/focus/inert-modal/text expansion/zoom/reflow/high contrast/reduced motion and poster/text equivalents required. Story never waits for media. Library/GLB cannot be fetched before explicit 3D activation; Drawer poster alone must work. Separate vendor/model transitives from GLB compressed transfer and decoded/GPU usage in evidence.

NFR-PE-001..005 unchanged: initial ≤2MB compressed, shell+critical JSON ≤500KB compressed, cold≤3s/warm≤1.5s p75, interaction≤100ms p95, save≤250KB. Existing image/audio app caps32/16MiB; proposed 3D steady-state target≤32MiB with one viewer/model needs D7 device/method agreement. History retains 50 dialogues+50 actions within explicit text/metadata bounds; see proposal §5.2. No unbounded transcript, speculative model preload or persistent cache introduced.

## 7. Verification, rollout and rollback

[SSOT §6](../sprints/sprint-04-ssot.md#6-verification-plan-and-evidence-status) maps existing commands, proposed test IDs and manual gates. Baseline unit suite freshly passes 691/691. No production feature/schema/browser/device acceptance was run in planning. Do not equate historical headless Chromium evidence with real-device/AT/PO sign-off.

Rollout by scoped feature PRs from current develop: T0 approvals/contracts → T1 styles → T2 renderer → T3 tags → T4/T5 log → T6/T7 collection resources/viewer → T8 integration → T9 full evidence. Require visual Gate A before 3D effort. Keep unimplemented controls absent and no automatic feature introduction before owner-ready contract.

Planning rollback reverts documents only. Runtime rollback uses reviewed UI/adapter revert, preserves save/data, and can keep functional poster fallback if 3D regression is discovered; that is amended scope requiring PO disposition, not successful delivery of 3D. If content/save compatibility changes, preserve latest readable candidates/migration/write guards during rollback. No reset of player storage or shared-history rewrite.

## 8. Approval register

| Item | Status / evidence |
|---|---|
| Planning request and current targets | Authorized by current PO message; document preparation only |
| D1–D7 | Pending; no owner approval inferred |
| Required new production ADR | Not created Accepted; follows actual architectural decisions |
| Implementation DoR | Open; WBS 0/10 |
| Documentation review | Prepared on feature branch for PO/owner review; no auto-merge |
| Production release/deployment | Not requested or performed |
