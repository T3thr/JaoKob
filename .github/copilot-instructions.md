# GitHub Copilot Instructions for JaoKob

All code and commits generated in this repository must comply with:
- [AGENTS.md](../AGENTS.md)
- [docs/README.md](../docs/README.md)
- [docs/sprints/sprint-05-ssot.md](../docs/sprints/sprint-05-ssot.md) (active sprint)

Key rules:
1. Contributor Identity: Commits must be authored by `T3thr <t.theerapat33@gmail.com>`. Never use third-party/corporate emails.
2. `src/core/` contains pure domain logic. Never import UI, Data, or call browser APIs.
3. Changes must be traceable to Requirement IDs defined in the active sprint SSOT.
4. Every task must be accompanied by automated tests in `tests/unit/`.
5. Create change record in `docs/changelog/` before committing.
6. Never put an AI agent or model name in commit messages, PR titles or descriptions, or branch names (AGENTS.md §5).
