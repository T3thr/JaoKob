# Claude Code Project Guidelines - JaoKob

Welcome to the **JaoKob (เจ้ากบ)** repository.  
This project adheres to **ISO/IEC/IEEE 12207:2017** and **Clean Architecture (Ports and Adapters)** standards.

## Contributor Identity (Strict Rule)
- **Git Committer Name:** `T3thr`
- **Git Committer Email:** `t.theerapat33@gmail.com`
- **MANDATORY CHECK:** Before any commit, verify `git config user.email` is `t.theerapat33@gmail.com`. Never commit with corporate/external emails (e.g. `theerapat.p@codefin.io`).
- **NO AGENT ATTRIBUTION (PO rule, 2026-10-31):** All work belongs to the PO. Never put an AI agent or model name in a git commit message, PR title or PR description, or branch name. No `Co-Authored-By:` trailer, no "Generated with ..." line, no `claude/`, `codex/` or other agent-named branch for work that is pushed. Before every commit or PR, check the message and body and remove any such line.

## Authoritative Governance (Must Read)
1. **Repository System Rules:** Read [AGENTS.md](AGENTS.md) unconditionally before taking any action.
2. **Operations Manual:** Read [docs/README.md](docs/README.md) for repository directory structure, pre-execution and post-execution checklists.
3. **Active Sprint SSOT:** Read [docs/sprints/sprint-05-ssot.md](docs/sprints/sprint-05-ssot.md) for the active sprint requirements, DoR, and DoD.
4. **Change History & Board:** Inspect the newest records in [docs/changelog/](docs/changelog/) and the active agent board [docs/dialogue/sprint-05/BOARD.md](docs/dialogue/sprint-05/BOARD.md) to know the exact progress from prior sessions.
5. **Never use Tier 4 history** in [docs/archive/](docs/archive/) (Phase 0, pre-ADR-032 blueprints) to decide new story, rules or architecture.

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
3. Register the Record ID in Section 7 of the active [docs/sprints/sprint-05-ssot.md](docs/sprints/sprint-05-ssot.md) and tick `[x]` in WBS only for work that is really done.
4. Run `node --test 'tests/unit/**/*.test.js'` and `node tests/docs/check-doc-links.mjs`; both must pass.
