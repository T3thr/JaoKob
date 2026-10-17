# Sprint 5: ADR-P0-022 Remediation Contract

Version 0.2.0, 2026-10-18, Asia/Bangkok. Authority: current PO directive and [Accepted ADR-P0-022](../../adr/ADR-P0-022-visual-novel-ergonomics-living-keepsake-lore-and-sprint-streamlining.md). This is an execution design under that decision, not a new Accepted ADR. [SSOT](../../sprints/sprint-05-ssot.md) owns the four-slice WBS; [trace matrix](../../traceability/sprint-05-execution-matrix.md) owns finding-to-evidence mapping.

## 1. Authority, evidence and precedence

The PO reports critical negative feedback in all reviewed categories. Treat that feedback as the reason to remediate, not as a statistical claim about all VN players. The supplied ADR is the binding review summary. This session inspected the three model reference renders below; separate screenshots from the veteran's UI review were not available among the referenced repository artifacts. Do not label existing S4 screenshots as the reviewer's evidence or invent a before/after acceptance.

| Prior statement or behavior | Effective direction under ADR-P0-022 | What remains binding |
|---|---|---|
| Biological tadpole opening, tail loss/growth and tiny-frog city scale in GDD/Narrative/S4 content | D1: childhood crochet body → adult velour body about 45 cm in blue shirt **before the storm** | Warm family relationship, separation, unknown family fate, safe agency |
| ADR21 D6 describes a living natural frog separate from plush mirrors | D1: the protagonist is a living keepsake throughout; HOME is not the first time it becomes a doll | No death, capture, loss of agency or sewing on a living body; childhood/adult gift presentation can remain a poetic framing |
| One crowded HUD and S4 save success dot | D2/D3: separated ambient meters and system controls; no visible success artifact | Truthful meters, Bond secrecy until A4-004, persistence and actionable failure recovery |
| ADR19 narrative-choice modal and click-anywhere stage behavior | D2/D5: inline confirmation, clear affordance; prose/background are inert with default cursor | Keyboard access, explicit advance, safe destructive-reset consent, native accessible utility dialogs |
| Ten proposed execution PRs and proposed Save 3 in SSOT 0.1 | D6 and Consequences: exactly four value slices; retain Save Format 2 | Strict validation, exact archives, deterministic replay, protected canonical content |
| Wait for a future feedback ADR before UI remediation | ADR22 is that binding feedback decision; start remediation work in Slice 1 | Human comfort and Thai acceptance before merge; later feedback is recorded against actual builds |

Do not rewrite the rationale of Accepted ADR19/20/21 or historical S4 evidence. T0 aligns forward-facing GDD, Narrative Bible, SRS, architecture and design specifications using this crosswalk before the affected implementation. ADR22 controls conflicts; unrelated mechanics and accessibility rules remain intact. No new approval of its six decisions is required.

## 2. Living keepsake, scale and continuity sheet

Visual references inspected:

- [Childhood crochet front](../3d-keepsake-spike/renders/childhood/front.png): yarn texture, cartoon face, arms/legs, blue garment and a separate heart accessory.
- [Adult poster](../3d-keepsake-spike/renders/poster.jpg) and [adult front](../3d-keepsake-spike/renders/front.png): green body with arms/legs and blue shirt. The pictured shirt has no embroidered red heart; Slice 4 must add and inspect it. The images do not independently measure 45 cm; that scale comes from the PO/ADR.

The keepsake has life, breath, intention and physical vulnerability. This does not grant teleportation, arbitrary stretching, biological metamorphosis or an invented explanation of who gave it life. Do not expose the real recipient's personal details in runtime prose, metadata or release assets. Childhood height and family-body measurements are not specified; author them only as needed and do not silently assign everyone the adult height.

| Sequence / scale check | Authoring and staging acceptance |
|---|---|
| Opening and family | Childhood crochet body is visible from the first protagonist beat. Family warmth appears in distinct actions and dialogue; no tail, gill, tadpole or aquatic-larva behavior in the new package |
| Growth before separation | A visible, readable childhood-to-adult transition precedes the storm. Adult blue shirt, limbs and roughly 45 cm body persist through Acts 2–5; no skipped growth hidden in A2 narration |
| Nest and storm | Show a nest large enough for the staged bodies, available footing, storm force, separation and a physically blocked return. Do not reuse the tiny shell-as-family-shelter or tail imagery without redesign |
| Reeds/drain | Both routes remain. Draw a navigable passage for torso/shoulders/legs, not a small pipe that only an insect-sized frog fits. Record clearance and route cues before committing effects |
| Curb, wheels, chairs and shelter | A scale sheet records world reference, camera, character pose, obstacle clearance/reach and safe route. A 45 cm body can use its arms; do not stage a cup, small shell or a human palm as a full-body shelter |
| Human encounter | Eyeline, hand, water container and retreat space match the body. A girl can crouch and adjust distance; she does not enclose the whole protagonist in one hand or treat it as a captured pet |
| Food, warmth and recovery | Review inherited insect/biological survival wording instead of copying it. Keep approved HP/พลังใจ rules, but give effects a coherent authored cause. Do not invent mass, buoyancy, diet or healing rules from plush material alone |
| Endings and mirrors | All three endings retain the same living keepsake identity and self-directed movement. A product-style gift view is an optional framing after emotional closure, not a body transformation or an end to its life |

World scale is not CSS size: camera framing can change, and mobile portraits may be cropped, while spatial relationships remain consistent. Every key storyboard includes an annotated scale reference; no physical-device or art approval is claimed from this plan.

Closure still requires mother/water guidance, sibling individuality, five natural keepsakes and red yarn. Re-author their setup in the new Act 1 before writing their payoff; a callback must not refer to an event that exists only in the archived tadpole story. Held, acquired, released, remembered, refused and unseen facts remain distinct. Yarn is a sixth registered item using the same four slots, not proof of ownership by the girl. The childhood art's heart accessory is not a seventh inventory item.

## 3. VN design and interaction contract

### 3.1 Layout, HUD and affordance

T0/T4 produce a design specification and annotated responsive compositions before component changes: typography scale with Thai diacritic clearance, line length/leading, spacing scale, layer order, focus/hover/active/disabled states, safe-area handling and overflow behavior. `tokens.css`, `layout.css`, `components.css` and their dependent modal/pouch/history/motion rules form one coherent system; changing three files alone is not the acceptance criterion.

- Meters are a calm, non-clickable region. System commands are a separate region with at least 44×44 CSS px targets, comfortable gaps and no overlap with prose or meters at any supported viewport.
- Enabled controls use `cursor: pointer`; prose, backgrounds and decorative imagery use the default cursor and perform no click action. Disabled controls expose their state and do not appear actionable. Remove inherited root/stage click-to-advance paths that contradict this rule; retain explicit advance and contextual Space/Enter without intercepting native controls.
- Choices grow naturally. At small heights, use a readable page-level arrangement or explicit choice pagination with stable order and visible page information. No nested choice/card scrollbar, clipped Thai or invisible eligible option. Pagination only changes presentation and never changes eligibility or commits a choice.
- Reading comfort takes precedence over preserving an old pixel baseline that causes crowding. Test complete paragraphs, long choices and expanded text; reserve safe space instead of pinning content over a tool dock.
- Log, Pouch and Settings use spacious native modal or accessible slide-over behavior: heading, close target, escape, focus containment/return, semantic reading order and comfortable padding. A deliberately scrollable long Log is allowed; a scrolling choice card is not.

### 3.2 Silent successful persistence

Remove `.jk-save-status[data-status-kind="saved"]` from visible rendering, including pseudo-elements, animations, dots, success labels and layout space. Successful automatic saves also make no recurring live-region announcement. Do not hide the whole persistence subsystem: failure/quota/protected-record/memory-only notices remain truthful and accessible, with recovery actions where appropriate. Normal saves must still occur, round-trip and preserve race/backup guards. A screenshot with no dot is insufficient without a saved-state/reload witness.

### 3.3 Inline choice confirmation

Use existing `confirmHighImpactChoices` preference and impact metadata. When confirmation is enabled for a high/irreversible action, the first intentional activation arms that exact action and snapshot revision. The same choice exposes an inline localized confirmation cue and explicit cancel affordance; a subsequent deliberate activation commits once. Hover, focus or Tab never commits. Ordinary choices and the opt-out preference retain their admitted single-activation semantics.

| Event | Expected behavior |
|---|---|
| Arm choice | Store temporary presentation/application intent only; no Domain effect, save, History action or Bond change |
| Confirm | Revalidate action eligibility and exact revision; one atomic transaction and one History receipt |
| Select another choice / cancel / Escape | Disarm or arm the new choice; no side effect; predictable focus |
| Open utility overlay, Retry/Replay/Resume/New Game, change session or accepted state | Clear stale armed intent; never restore armed state from LocalStorage |
| Reflow/resize | Preserve semantic story cursor and accessible choice order; if the armed affordance cannot be retained, disarm safely |
| Double click, rapid repeated tap, held Enter/Space, bubbling stage click | Must not bypass the inline review or produce two commits; verify on keyboard, mouse and touch |

Focus glow supplements visible text and accessible state; color alone cannot represent confirmation. There is no narrative-choice `dialog` or “พร้อมเลือกทางนี้หรือยัง” popup. Destructive New Game/save replacement and relevant Pouch confirmations retain their own safety semantics; D5 does not authorize deleting reset consent.

### 3.4 Thai and cinematic beats

Required boards: childhood warmth/growth, storm separation, city threshold, first girl encounter and all three ending decisions. Each board records character stage/scale, camera/composition, light/material/temperature, prose/voice, player control, semantic cursor, effects and fallback. Full-screen illustrations can enrich these moments while a readable text equivalent remains available.

No timed reading, forced auto-advance or mandatory motion/audio. Reduced motion uses still beats; absent/corrupt media leaves complete Thai and navigation. Advancing/skip/Resume must execute the approved story effects exactly once. Image arrival cannot advance state, write a save or add a Log receipt. A cutscene reload resumes the admitted semantic beat, not a CSS page index.

Editorial review reads the full path aloud and in the actual mobile layout. Check natural Thai syntax, character intention, concrete cause, sensory detail and whether the line earns its place. Reject em/en dashes and emoji in Thai narrative, duplicate authored prose/results and narrator instructions about meters or thresholds. Automated phrase checks are review aids, not a substitute for a Thai reader. Record observations and revisions; never claim “100% no slop” from lint alone.

## 4. Save Format 2 and package compatibility design

**Binding outcome:** `saveFormatVersion` stays **2**. The former Save 3 proposal is retired. Existing valid saves remain readable on their exact archived content, without reset or a mandatory format migration. A new story version is not a numeric Save-format upgrade.

The published [schema 2.0.0](../../../specs/schemas/v2.0.0/save-state.schema.json) and [runtime validator](../../../src/data/validation/save-envelope-validator.js) both reject unknown envelope/payload fields. The [actual validator probe](evidence/save2-current-validator-probe.json) confirms this. Consequently, keeping the integer 2 does not prove old applications can read added fields.

Recommended implementation contract for T0/T1/T3:

1. Keep published schema 2.0.0 and archived content bytes immutable. Add a separately identified, versioned **Save-2 extension schema profile**, plus independent reference fixtures and matching runtime validation. Do not silently widen the old schema or set `additionalProperties:true`.
2. The new reader admits exact legacy Save 2 through the old profile. Only a fixed allowlist of known legacy content versions maps an identity-less record to its archived core descriptor; an unknown record never defaults to core. A bounded optional extension block in the new profile carries a profile discriminator, package identity/manifest binding and at most the registered Act 4/Act 5 replay snapshots. Exact field names and schema `$id` are fixed in T0/T1 before writer code. Unknown profile/field/capability fails safely; absence means legacy capabilities, not synthetic replay data.
3. Validate the new profile against an explicit package/version allowlist. The extension is optional for legacy compatibility but required when the new package declares the replay/identity profile, even before Act 4 when its snapshot list is legitimately empty. A record cannot remove a required profile, claim it while binding an archived version or mix identities across active state, retry checkpoint and replay snapshots. Extension integrity participates in the canonical digest; current required fields retain their meaning.
4. New-format-profile writes are confined to the new content package. Legacy Resume is read-only; later legacy actions keep their exact compatible profile. Both old→new-reader acceptance and new→old-application refusal/write protection require fixtures and a rollback rehearsal. Do not call forward compatibility proven until the old application actually preserves canonical/staging/backup bytes and cannot overwrite them.
5. Use the existing staged/canonical/backup transaction and raw-record consent/race guards. No extra sidecar storage or Story Slots key scheme is introduced merely to avoid a field decision. The entire serialized save, including snapshots, stays within 250 KB UTF-8; bound snapshot count/size and reject recursive or cross-package data.
6. Capture actual causal state before Act 4/Act 5: metrics, flags, occurrences, pouch, RNG, semantic cursor and package binding. Do not recursively embed the extension block. Keep completed-content/ending history separate from the restored timeline, preserve current settings and prevent replay/repair farming. The session-only Log remains 50 dialogue + 50 action entries, not replay authority.

This preserves existing-save usability without a compulsory conversion. It does **not** promise an unmodified old binary can read the new profile. The compatibility gate is a concrete Slice 1 deliverable; if refusal/write protection fails, stop activation of that writer, fix the guard and retest within PR #19. Do not switch to Save 3 or waive validation. UI and other independent Slice 1 work can proceed.

### 4.1 Content continuity after the lore change

The biological Act 1 and the living-keepsake Act 1 have different causal histories. Retire the earlier proposed automatic `content3 → full-game` A1-complete bridge. Save 1/2 content 2.1 and Save 2 content 3 remain exact archived continuations. A player explicitly starts the revised story through New Game with protected replacement consent; no event, item or family memory is fabricated to merge the histories.

New S5 package versions can use a proved continuation at an unchanged authored boundary. Admit source/target digests and map active/checkpoint/snapshots independently. Do not repurpose published node/event IDs with changed meanings: a registry maps old design anchors to newly registered runtime IDs where the rewrite changes semantics. Freezing the final default core protects it from the S6 Editor; approved repository releases can publish a new version while preserving archives.

## 5. Four PRs, review checkpoints and acceptance

PR #19 contains contracts → capability/persistence fixtures → design system and controls → real layout/compatibility review. PR #20 contains new Act 1 origin/growth/storm → Act 2/yarn/routes → integrated read-through. PR #21 contains Act 3/convergence → Act 4/relationship → Act 5/endings/replay → all-ending journeys. PR #22 contains approved source art/exports → viewer/fault isolation → physical iOS/Android/AT → final artifact/rollback/core freeze.

These are checkpoints within four PRs, not extra execution PRs. The requested numbers are planned identifiers until GitHub creates them; record actual URLs when created. This planning update only modifies Draft PR #18. A large PR such as #21 needs ordered commits and evidence per checkpoint; fewer PRs do not reduce the amount of authoring, device work or review.

Every slice requires human reading-comfort and Thai review of what it changes. Record build, viewport, settings, scene/beat, observation, severity, screenshot reference, resolution and reviewer acceptance. Prior critical feedback remains **unresolved** until the revised build is tested; recording a plan is not remediation evidence.

Retain all valid baseline invariants. Replace specifically superseded save-dot/modal/tadpole/stage-click assertions with ADR22-linked tests and preserve old reports; record each retired expectation and its replacement in the PR. Do not retain an obsolete assertion just to keep the count at 1,060, and do not delete unrelated tests to claim zero regression.

The accepted lore, four slices, Save 2, silent success and inline choice direction are ready for Slice 1 work. Technical contract fixtures, design review and human/device acceptance are implementation/merge gates with owners, not requests to reapprove ADR22. Exact dependency version for production 3D remains a Slice 4 review; no new library is approved by this document.
