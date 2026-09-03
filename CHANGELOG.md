# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html) and ISO/IEC/IEEE 12207 configuration management processes.

---

## [Unreleased]

## [0.2.0] - 2026-09-02

> Sprint 1: Core Vertical Slice Complete

### Added
- Implemented deterministic Core metrics, the guarded `TR-001` through `TR-020` state machine, and atomic Choice Transaction with 140 passing unit cases. [Detailed audit record](docs/changelog/2026-09/2026-09-01-1940-core-domain-state-machine.md)
- Added immutable structural contracts for Renderer and Save Repository ports without Browser API or runtime dependencies.
- Merged PR #1 (`53a458a`) from `feat/sprint-01-core-domain` into `develop`; Sprint 1 Tasks 1 and 2 are now integrated. [Merge audit record](docs/changelog/2026-09/2026-09-02-0325-core-domain-merge.md)
- Added a resilient current-v1 LocalStorage SaveRepository adapter with staging/backup recovery, typed failure handling, 250 KB guard, and 36 passing focused unit tests. [Detailed audit record](docs/changelog/2026-09/2026-09-02-0337-persistence-adapter.md)
- Added a semantic DOM RendererPort adapter with safe text rendering, focus/live-region recovery behavior, Thai system fallback, and mobile-first accessible nostalgic styles. [Detailed audit record](docs/changelog/2026-09/2026-09-02-0427-dom-renderer.md)
- Completed the first browser-playable prologue slice by composing Core, LocalStorage persistence, and the DOM renderer through a single bootstrap dispatcher; full regression passes 183 tests. [Detailed audit record](docs/changelog/2026-09/2026-09-02-0958-bootstrap-playable-slice.md)

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
