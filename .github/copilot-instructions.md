# GitHub Copilot Instructions for JaoKob

All code generated in this repository must comply with:
- [AGENTS.md](../AGENTS.md)
- [docs/README.md](../docs/README.md)
- [docs/sprints/sprint-01-ssot.md](../docs/sprints/sprint-01-ssot.md)

Key rules:
1. `src/core/` contains pure domain logic. Never import UI, Data, or call browser APIs.
2. Changes must be traceable to Requirement IDs defined in the active sprint SSOT.
3. Every task must be accompanied by automated tests in `tests/unit/`.
4. Create change record in `docs/changelog/` before committing.
