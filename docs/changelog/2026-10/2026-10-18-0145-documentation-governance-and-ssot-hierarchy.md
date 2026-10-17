# Change Record: Documentation Governance, Historical Deprecation Tagging, and SSOT Hierarchy

- **Record ID:** CR-20261018-0145
- **Timestamp:** 2026-10-18T01:45:00+07:00 (Asia/Bangkok; record opened)
- **Sprint/Milestone:** Sprint 5 Planning Baseline & Documentation Governance
- **Operator:** Codex / Senior Software Architect, Lead Interactive Fiction Director
- **Status:** Delivered under PO Directive; ADR-P0-023 ratified, historical warning banners applied, 4-tier hierarchy enforced
- **Authority:** PO Directive regarding stale documentation crisis (Phase 0 biological tadpole/gills/4-hour playtime tropes conflicting with active ADR-022 living keepsake lore)
- **Baseline/branch:** `2f24d9c` on `feat/sprint-05-planning-ssot`; ratification commit `53b5bcd`; runtime/develop remains `d1af293`; identity `T3thr <t.theerapat33@gmail.com>` verified

---

## 1. Objective, Outcome and Scope

### Objective
Resolve the critical documentation rot and semantic conflict where stale Phase 0 documents (written August 31, 2026 in `docs/phase-0/`) containing obsolete biological tadpole tropes (gills, tail, metamorphosis, 4-hour playtime) were still referenced in repository navigation, creating severe risk of developer and AI regression.

### Outcome
1. **Ratified [ADR-P0-023](../../adr/ADR-P0-023-documentation-hygiene-and-ssot-hierarchy.md):** Established the binding Four-Tier Authority Hierarchy:
   - **Tier 1 (Supreme Active SSOT & Governance):** Sprint 5 Execution SSOT, Active ADRs (`ADR-P0-022`, `021`, `020`, `019`, `023`), Remediation Contract, Trace Matrix.
   - **Tier 2 (Active Design & Schema Contracts):** `docs/design-system/`, `specs/schemas/`.
   - **Tier 3 (Integrated Baseline):** `docs/sprints/sprint-04-ssot.md`.
   - **Tier 4 (Historical Archives - READ ONLY):** `docs/phase-0/`, `docs/proposals/`, closed sprints 1–3.
2. **Mandatory Deprecation Banners:** Added GitHub Alert `[!WARNING]` banners at Line 1 across all 9 baseline documents in `docs/phase-0/` plus `docs/phase-0/README.md`.
3. **Master Operations Manual Overhaul:** Revised `docs/README.md` to display the Four-Tier Hierarchy, updated directory roles, and replaced the misleading reading flowchart that previously directed agents to Phase 0.
4. **Agent Governance Update:** Updated `AGENTS.md` Section 3 to mandate adherence to the 4-tier hierarchy and prohibit using Phase 0 text as active requirements.

### Non-Goals
- No deletion of historical documents (preserving ISO 12207 auditability and historical traceability).
- No production code or test suite modifications.

---

## 2. Requirement and Decision Trace

- **Primary Authority:** [ADR-P0-023](../../adr/ADR-P0-023-documentation-hygiene-and-ssot-hierarchy.md) D1–D5.
- **Related Authorities:** [ADR-P0-022](../../adr/ADR-P0-022-visual-novel-ergonomics-living-keepsake-lore-and-sprint-streamlining.md), [ADR-P0-021](../../adr/ADR-P0-021-narrative-resonance-authentic-adventure-and-branching-integrity.md), [ADR-P0-020](../../adr/ADR-P0-020-adventure-keepsake-pouch-and-item-system.md).
- **Standards:** ISO/IEC/IEEE 12207:2017 (Configuration Management & Auditability).

---

## 3. Manifest of Changes

| Artifact | Change |
|---|---|
| `docs/adr/ADR-P0-023-documentation-hygiene-and-ssot-hierarchy.md` | New ADR establishing 4-tier authority hierarchy and governance rules |
| `docs/phase-0/README.md` | Marked as Historical Archive with clear warning banner and superseded matrix |
| `docs/phase-0/00-phase-0-charter.md` | Prepend historical archive deprecation banner at Line 1 |
| `docs/phase-0/01-game-design-document.md` | Prepend historical archive deprecation banner at Line 1 |
| `docs/phase-0/02-narrative-bible.md` | Prepend historical archive deprecation banner at Line 1 |
| `docs/phase-0/03-software-requirements-specification.md` | Prepend historical archive deprecation banner at Line 1 |
| `docs/phase-0/04-architecture-blueprint.md` | Prepend historical archive deprecation banner at Line 1 |
| `docs/phase-0/05-production-directory-plan.md` | Prepend historical archive deprecation banner at Line 1 |
| `docs/phase-0/06-ai-agent-engineering-guide.md` | Prepend historical archive deprecation banner at Line 1 |
| `docs/phase-0/07-git-governance-and-deployment-runbook.md` | Prepend historical archive deprecation banner at Line 1 |
| `docs/phase-0/08-verification-traceability-and-quality-gates.md` | Prepend historical archive deprecation banner at Line 1 |
| `docs/README.md` | Added 4-tier hierarchy, updated directory map, replaced misleading flowchart |
| `AGENTS.md` | Updated Section 3 to mandate 4-tier authority hierarchy |
| `CHANGELOG.md` | Registered ADR-P0-023 and documentation governance event under Unreleased |
| `docs/changelog/2026-10/2026-10-18-0145-documentation-governance-and-ssot-hierarchy.md` | This change record |

---

## 4. Verification Performed

- Verified all 10 Markdown files in `docs/phase-0/` now prominently display the historical warning banner.
- Verified relative file links across ADR-P0-023, `docs/phase-0/README.md`, `docs/README.md`, and `AGENTS.md`.
- Verified that no production source code, unit tests, or test fixtures were altered.
