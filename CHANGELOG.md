# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html) and ISO/IEC/IEEE 12207 configuration management processes.

---

## [Unreleased]

- **CR-0004 M1D:** Adult keepsake gains independent heart/Crochet options and closed upper eyelids; 1,038,744-byte GLB / 24,201 triangles, validator 0/0, all 8 preview combinations and 1,060 regression tests pass. [CR-20261019-1036](docs/changelog/2026-10/2026-10-19-1036-adult-keepsake-variants-eyelid.md).
- **ADR-P0-025:** Childhood keepsake now defaults to empty hands and velour, with independent heart/crochet selectors; 704,780-byte GLB, 15,728 triangles, validator 0/0 and 1,060 regression passes. [CR-20261018-0508](docs/changelog/2026-10/2026-10-18-0508-childhood-stance-material-decoupling.md).
- Ratified [ADR-P0-023](docs/adr/ADR-P0-023-documentation-hygiene-and-ssot-hierarchy.md) (commit `53b5bcd`): established Four-Tier Authority Hierarchy, prepended prominent historical deprecation warning banners to all 9 baseline documents in `docs/phase-0/`, updated `docs/README.md` and `AGENTS.md` to prevent AI agents from referencing obsolete biological tadpole lore and 4-hour playtime tropes over active ADR-022 and Sprint 5 SSOT. [Documentation governance audit](docs/changelog/2026-10/2026-10-18-0145-documentation-governance-and-ssot-hierarchy.md)
- Replanned Sprint 5 under Accepted ADR-P0-022: four value slices (planned PR #19–22), living-keepsake Act 1 with adult 45 cm body before the storm, VN/HUD/inline-choice/silent-save overhaul and Save Format 2 compatibility gates. SSOT/WBS/trace and Draft PR #18 updated; documentation only. [ADR22 planning audit](docs/changelog/2026-10/2026-10-18-0023-sprint-05-adr022-replanning.md)
- Drafted the [Sprint 5 Execution SSOT](docs/sprints/sprint-05-ssot.md), readiness assessment and CR-0006: ten proposed execution PRs covering Act 2–5, three equal endings, package/save/replay boundaries, player-feedback staging and Grand Keepsake. Reverified 1,060 unit tests and 1,096 design trajectories; documentation only, implementation and approvals remain pending. [Planning audit](docs/changelog/2026-10/2026-10-17-1808-sprint-05-planning-ssot.md)
- Integrated Sprint 4 Slice 5 into develop via [PR #17](https://github.com/T3thr/JaoKob/pull/17) (commit `4c0bd28`): promote content3 for New Game with exact2.1 save continuation, 30 localized intent entries, five original paper illustrations and strict fallbacks; 1,060 unit tests, ending trajectories, schema/browser gates and local static/rollback rehearsal pass. Sprint 4 closeout complete (5/5 PRs merged, 100%). [Closeout audit](docs/changelog/2026-10/2026-10-17-1400-sprint-04-slice-05-closeout.md)
- Integrated Sprint 4 Slice 4 into develop via [PR #16](https://github.com/T3thr/JaoKob/pull/16) (commit `37bad50`): tender Act 1 rewrite with ADR-P0-021 remediation (reachable self-reliant END-DAWN, anti-slop, zero duplicates, physical storm/silt, mutual-learning girl, meaningful fifth shell, and living frog in END-HOME with separate crochet/velour mirrors), five keepsakes, three secret moments, and Act 2–5 design map; 1,004 unit tests, design trajectory proof, and 21 browser captures pass. Normal entry stays 2.1 until Slice 5 promotion. [Slice 4 audit](docs/changelog/2026-10/2026-10-16-0302-sprint-04-slice-04-narrative.md)
- Remediated PR #16 under ADR-P0-021 D1–D6: physical storm/blocked return, distinct family and meaningful fifth shell, zero duplicate prose/results, mutual-learning girl, reachable self-reliant END-DAWN and living-frog HOME/gift mirrors. All990 existing tests plus14 new checks pass (1004/1004); schema2/Save2 and the normal2.1 entry remain unchanged. [Updated Slice4 audit](docs/changelog/2026-10/2026-10-16-0302-sprint-04-slice-04-narrative.md#8-adr-p0-021-remediation--intake-and-impact)
- Integrated Sprint 4 Slice 2 into develop via PR #14 (commit `6692c1b`): four-slot immutable Keepsake Pouch, Save 2/checkpoint migration with exact legacy backup and downgrade guards, localized native inspection/confirmation UI; 874 unit tests, 13 schemas/47 cases, 12 legacy routes and 34 Pouch browser captures pass. [Slice 2 audit](docs/changelog/2026-10/2026-10-16-0031-sprint-04-slice-02-pouch.md)
- Reworked PR #13 under ADR-P0-019 with the design specification first: pure paginated reading, symmetric choices without internal scrollbars, HUD micro-toasts, scene advisory, native confirmations, direct audio and desktop controls;720 unit cases,12 routes and50 revised visual/runtime captures. [Runtime ergonomics audit](docs/changelog/2026-10/2026-10-15-1757-sprint-04-adr-019-runtime-ergonomics.md)
- Extended Sprint 4 Slice 1 (PR #13) under ADR-P0-019: rejected commit `a634409` on runtime playtest review due to 5 critical UX/UI flaws (Title modal collision, reading card pollution with advisory & stat deltas, floating/asymmetric choices with scrollbars, audio toggle opening settings, desktop fatigue); mandated formal Design System specification and 6 ergonomic pillars before merge. [ADR-P0-019](docs/adr/ADR-P0-019-visual-novel-runtime-ergonomics-and-design-system-mandate.md)
- Enforced ADR-P0-018 on PR13: fixed bottom paper/choice slot, pinned modal close, accessible switches and stable sound, vector-only icons/natural Thai punctuation, discreet advisory with separate durable preference;712 unit cases/12 routes/36 captures. [ADR-P0-018 delivery](docs/changelog/2026-10/2026-10-15-1544-sprint-04-adr-018-vn-ergonomics.md)
- Refined PR13 after PO visual review: one frosted header with quiet1500ms success dot, illustrated lotus Title, consolidated Decision/icon cards and water-plane anchoring;703 unit cases/12 Chromium routes pass. [PO refinement / Before–After](docs/changelog/2026-10/2026-10-15-0013-sprint-04-po-sensory-refinement.md)
- Sprint 4 Slice 1 (T1–T2): warm paper, frosted moss/amber HUD, Title/Reading/Decision separation and persistent utility status/focus; 698 unit tests and 12 Chromium routes pass. [Slice 1 audit](docs/changelog/2026-10/2026-10-14-2314-sprint-04-slice-01-visual.md)
- Refined Sprint4 plan to v0.2.1 under Final PO approval: Act3–4 drama/metric/agency/recovery and five-item comfort, fair endings/girl persona, crochet→velour red-heart gift bridge; T7/T8 acceptance expanded, production unchanged. [Final PO record](docs/changelog/2026-10/2026-10-14-2233-sprint-04-final-po-narrative-impact.md)
- Revised Sprint 4 planning to v0.2.0 per PO Directive: limited Adventure Keepsake Pouch with durable state/Secret Moments, AI-authored Act 1 refinement and Act 2–5 map; 3D Grand Keepsake moves to Sprint 5 END-HOME. Production code unchanged. [Directive record](docs/changelog/2026-10/2026-10-14-2131-sprint-04-pouch-directive.md)

### Added
- Integrated Sprint 4 Slice 3 into develop via PR #15 (commit `f8ee156`): session-only 50 dialogue + 50 committed action history, exact displayed-prefix receipts, Thai scene/speaker projection and accessible native archive on the HUD; 935 unit tests, 12 legacy routes and 23 History captures pass. Save 2/content 2.1 unchanged. [Slice 3 audit](docs/changelog/2026-10/2026-10-16-0142-sprint-04-slice-03-history.md)
- Ratified ADR-P0-020 for Sprint 4 Slice 2 (T0, T3, T4, T5 / PR #14): fixed 4-slot Adventure Keepsake Pouch capacity to align with 5-act narrative arc, dual keepsake/utility item lifecycle, Schema 2.0.0 and SaveFormatVersion 2 semantic migration. [ADR-P0-020](docs/adr/ADR-P0-020-adventure-keepsake-pouch-and-item-system.md)
- Proposed Sprint 4 Visual, Narrative & Interactive Overhaul: target-to-runtime gap audit, acceptance rubric, Dialogue Log/Keepsake specifications and ten-task WBS; CR-0005 awaits PO decisions, production code unchanged. [Planning record](docs/changelog/2026-10/2026-10-14-1841-sprint-04-overhaul-plan.md)
- Childhood crochet keepsake (`CR-0004`, Milestone 1B): editable Blender source, separate heart, 598 KB / 13.4k-triangle GLB, four renders and lazy two-doll preview selection; validator and 691 game tests pass. [Milestone 1B evidence](docs/changelog/2026-10/2026-10-14-1244-childhood-crochet-model-spike.md)
- Adult plush base-mesh spike (`CR-0004`): editable Blender source/generator, 546 KB GLB and an isolated lazy-loaded 3D inspection page; childhood heart clarified as optional. [Milestone 1 evidence](docs/changelog/2026-10/2026-10-14-0050-adult-plush-model-spike.md)

## [0.4.0] - 2026-09-08

> Sprint 3: Interactive Light Novel RPG Transformation & Benchmark Slice Complete

### Added
- Integrated Sprint 3 into `develop` through PR #9 (`9e4f8b0`) and PR #10 (`0d6c0ba`): WBS 5/5, 691/691 merged-branch tests, 11 metaschemas/36 cases, and 12/12 Chromium canonical routes passed. [Sprint 3 merge closeout](docs/changelog/2026-09/2026-09-08-1430-sprint-03-merge-closeout.md)
- Delivered Sprint 3 Tasks 2–5: prototype pond/tadpole/audio/font assets, semantic reading/decision stage, bounded media and Web Audio, exact 2.0→2.1 Resume and guarded saves; 691 unit tests and 12 Chromium routes pass. Physical-device, listening and PO aesthetic acceptance remain open. [Benchmark execution record](docs/changelog/2026-09/2026-09-07-1248-sprint-03-benchmark-slice.md)
- Implemented Sprint 3 Task 1: schema 1.2 environments, immutable presentation/locked-Bond contracts, and pure 2.0→2.1 save compatibility proof; 550 unit tests, reference schema checks and 12 existing browser routes passed. Production media/UI/write integration follows in Tasks 2–5. [Execution record](docs/changelog/2026-09/2026-09-07-0119-sprint-03-task-01-presentation-contracts.md)
- Approved Sprint 3 architecture and CR-0003 through the PO/Tech Lead joint directive: three-choice Scene 3 boundary, blue-marked/scarf tadpole, Bond Locked Chip, and deferred Full Log/Animated Typewriter; recorded ADR-P0-015. [Approval record](docs/changelog/2026-09/2026-09-07-0042-sprint-03-architecture-approval.md)
- Drafted Sprint 3 Interactive Light Novel RPG benchmark plan and CR-0003 for versioned scene environments, audio orchestration, and save compatibility; five tasks and visual/audio verification were prepared for review (historical planning record). [Planning audit record](docs/changelog/2026-09/2026-09-06-2003-sprint-03-architecture-plan.md)

## [0.3.0] - 2026-09-05

> Sprint 2: Content Engine Architecture & Canonical Act 1 Complete

### Added
- Integrated Sprint 2 into `develop` through PR #7 and squash commit `70bac18`: WBS 5/5, 444/444 merged-branch tests and 12/12 Chromium routes passed. [Sprint 2 merge closeout](docs/changelog/2026-09/2026-09-05-0128-sprint-02-merge-closeout.md)
- Completed real Act 1 orchestration, exact Resume, explicit save replacement consent and Mock deprecation with 444 passing tests and 12 browser playthroughs. [Tasks 4–5 implementation audit](docs/changelog/2026-09/2026-09-04-1039-sprint-02-task-04-05-bootstrap-playthrough.md)
- Implemented the seven-scene canonical Act 1 JSON package and graph suite: 14/14 nodes, 21/21 edges, 12 routes across three exploration profiles, and 379 passing tests. [Tasks 2–3 audit record](docs/changelog/2026-09/2026-09-04-0959-sprint-02-task-02-03-content-graph.md)
- Implemented Task 1 Content Validator & same-origin Package Loader with immutable records/indexes, local schema resolution, versioned Act 1 rest/flag policies, and 300 passing tests (183 existing + 117 new). [Task 1 audit record](docs/changelog/2026-09/2026-09-04-0927-sprint-02-task-01-content-validator.md)
- Drafted Sprint 2 SSOT for Content Engine Architecture & the full Act 1 narrative package, with five tasks, requirement traceability, scoped quality gates, and CR-0002 execution-contract decisions. [Planning audit record](docs/changelog/2026-09/2026-09-04-0228-sprint-02-ssot-baseline.md)

## [0.2.0] - 2026-09-02

> Sprint 1: Core Vertical Slice Complete

### Added
- Implemented deterministic Core metrics, the guarded `TR-001` through `TR-020` state machine, and atomic Choice Transaction with 140 passing unit cases. [Detailed audit record](docs/changelog/2026-09/2026-09-01-1940-core-domain-state-machine.md)
- Added immutable structural contracts for Renderer and Save Repository ports without Browser API or runtime dependencies.
- Merged PR #1 (`53a458a`) from `feat/sprint-01-core-domain` into `develop`; Sprint 1 Tasks 1 and 2 are now integrated. [Merge audit record](docs/changelog/2026-09/2026-09-02-0325-core-domain-merge.md)
- Added a resilient current-v1 LocalStorage SaveRepository adapter with staging/backup recovery, typed failure handling, 250 KB guard, and 36 passing focused unit tests. [Detailed audit record](docs/changelog/2026-09/2026-09-02-0337-persistence-adapter.md)
- Added a semantic DOM RendererPort adapter with safe text rendering, focus/live-region recovery behavior, Thai system fallback, and mobile-first accessible nostalgic styles. [Detailed audit record](docs/changelog/2026-09/2026-09-02-0427-dom-renderer.md)
- Completed the first browser-playable prologue slice by composing Core, LocalStorage persistence, and the DOM renderer through a single bootstrap dispatcher; full regression passes 183 tests. [Detailed audit record](docs/changelog/2026-09/2026-09-02-0958-bootstrap-playable-slice.md)
- Merged PR #5 (`ae2e103`) into `develop`, completing Sprint 1 (Phase 1A & Phase 1B) 100% and stabilizing the first playable baseline. [Sprint 1 closeout audit record](docs/changelog/2026-09/2026-09-03-1040-sprint-01-merge-closeout.md)

---

## [0.1.1] - 2026-09-01

> Detailed Audit Records: 
> - [CR-20260901-1350: Sprint 1 Preparation & Directory Setup](docs/changelog/2026-09/2026-09-01-1350-sprint-1-prep.md)
> - [CR-20260901-1358: Unlocking Gitignore, Operations Manual, and Baseline Push](docs/changelog/2026-09/2026-09-01-1358-unlock-gitignore-and-ops-manual.md)
> - [CR-20260901-1401: Autonomous Execution Protocol in AGENTS.md](docs/changelog/2026-09/2026-09-01-1401-agent-autonomous-protocol.md)
> - [CR-20260901-1402: Sprint 1 Master Execution Prompt Template](docs/changelog/2026-09/2026-09-01-1402-master-prompt-template.md)
> - [CR-20260901-1411: Develop Branch Setup and Multi-AI Guidelines](docs/changelog/2026-09/2026-09-01-1411-develop-branch-and-multi-ai-guidelines.md)
> - [CR-20260901-2025: Contributor Identity Governance and Multi-AI Alignment](docs/changelog/2026-09/2026-09-01-2025-contributor-identity-governance.md)

### Added
- **Enterprise Documentation Portal & Operations Manual:** Added `docs/README.md` as the unified master documentation index and engineering operating manual.
- **Documentation Reorganization Audit Log:** Added `docs/ORGANIZATION-LOG.md` recording the structural evolution from Phase 0 flat layout to Enterprise ISO structure.
- **Sprint 1 SSOT:** Added `docs/sprints/sprint-01-ssot.md` establishing the Single Source of Truth for Sprint 1 (Vertical Slice).
- **ISO Changelog Standard:** Added `docs/changelog/README.md` and monthly execution log archives (`docs/changelog/YYYY-MM/`).
- **Codebase Skeleton:** Initialized production folder structure under `src/` (`bootstrap`, `core`, `ui`, `data`) and `tests/` per `05-production-directory-plan.md` with `.gitkeep`.

### Changed
- **Git Tracking:** Unlocked `.gitignore` to track all `docs/`, `specs/`, `.agents/`, and `AGENTS.md` per ISO 12207 configuration management and audit requirements.
- Refined `docs/phase-0/01-game-design-document.md` state machine diagram to explicitly include chapter replay transition from `Ending` to `Cutscene`.
- Clarified `END-NEARBY` conditions in GDD to avoid ambiguity with `END-HOME`.

---

## [0.1.0] - 2026-08-31

> Detailed Audit Record: [CR-20260831-1941](docs/changelog/2026-08/2026-08-31-1941-phase-0-baseline.md)

### Added
- **Phase 0 Baseline Specifications:**
  - `00-phase-0-charter.md`: Project charter, life cycle tailoring (ISO/IEC/IEEE 12207), and compliance baseline.
  - `01-game-design-document.md`: 5-act structure, core loop, player meters (HP, Sanity/พลังใจ, Bond), and ending resolver policies.
  - `02-narrative-bible.md`: Story world, sensory perceptions, character arcs, and dialogue guidelines.
  - `03-software-requirements-specification.md`: SRS according to ISO/IEC/IEEE 29148:2018 with 50 Functional and 38 Non-Functional requirements.
  - `04-architecture-blueprint.md`: Clean Architecture / Ports and Adapters specification and ADRs.
  - `05-production-directory-plan.md`: Repository layout, ownership boundaries, and phase progression plan.
  - `06-ai-agent-engineering-guide.md`: Engineering instructions and rules for AI Agents.
  - `07-git-governance-and-deployment-runbook.md`: Branching strategy, Conventional Commits, and GitHub Pages release flow.
  - `08-verification-traceability-and-quality-gates.md`: Verification, Validation, and Quality Gates plan.
- **Machine-Readable Schemas (Draft 2020-12):**
  - `specs/schemas/common.schema.json`
  - `specs/schemas/character.schema.json`
  - `specs/schemas/dialogue.schema.json`
  - `specs/schemas/event.schema.json`
  - `specs/schemas/narrative-tree.schema.json`
  - `specs/schemas/save-state.schema.json`
  - `specs/schemas/content-package.schema.json`
- **Agent Governance:**
  - `AGENTS.md` and repository skill `.agents/skills/jaokob-spec-loop/SKILL.md`.
