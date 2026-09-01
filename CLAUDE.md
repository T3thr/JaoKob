# Claude Code Project Guidelines - JaoKob

Welcome to the **JaoKob (เจ้ากบ)** repository.  
This project adheres to **ISO/IEC/IEEE 12207:2017** and **Clean Architecture (Ports and Adapters)** standards.

## Contributor Identity (Strict Rule)
- **Git Committer Name:** `T3thr`
- **Git Committer Email:** `t.theerapat33@gmail.com`
- **MANDATORY CHECK:** Before any commit, verify `git config user.email` is `t.theerapat33@gmail.com`. Never commit with corporate/external emails (e.g. `theerapat.p@codefin.io`).

## Authoritative Governance (Must Read)
1. **Repository System Rules:** Read [AGENTS.md](AGENTS.md) unconditionally before taking any action.
2. **Operations Manual:** Read [docs/README.md](docs/README.md) for repository directory structure, pre-execution and post-execution checklists.
3. **Active Sprint SSOT:** Read [docs/sprints/sprint-01-ssot.md](docs/sprints/sprint-01-ssot.md) for the active sprint requirements, DoR, and DoD.
4. **Change History:** Inspect [docs/changelog/2026-09/](docs/changelog/2026-09/) to know the exact progress from prior sessions.

## Architecture Boundaries
- `src/core/`: 100% Pure Vanilla JavaScript ES Modules. **Zero imports from `src/ui/`, `src/data/`, and zero calls to Browser/DOM APIs (`window`, `document`, `localStorage`)**.
- `src/ui/`: UI Adapters (DOM Renderer, CSS). Receives immutable view models.
- `src/data/`: Data Adapters (LocalStorage persistence).
- `src/bootstrap/`: Composition Root.

## Git & Branching Workflow
- **Protected Branches:** `main` (Production), `develop` (Integration Staging). Never commit directly to `main`.
- **Feature Branches:** Always branch off `develop`: `git checkout develop && git pull && git checkout -b feat/sprint-NN-<task-slug>`.
- **Pull Requests:** Open a PR targeting `develop` when tests pass.

## Mandatory Changelog Rule (ISO 12207)
Never conclude a task or commit without creating a change record:
1. Create `docs/changelog/YYYY-MM/YYYY-MM-DD-HHmm-<slug>.md` per [docs/changelog/README.md](docs/changelog/README.md).
2. Summarize (1-3 lines) in [CHANGELOG.md](CHANGELOG.md) with a markdown link.
3. Register the Record ID in Section 7 of [docs/sprints/sprint-01-ssot.md](docs/sprints/sprint-01-ssot.md) and tick `[x]` in WBS.
