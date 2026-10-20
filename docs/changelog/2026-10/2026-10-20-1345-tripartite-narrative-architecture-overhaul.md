# Change Record: Tripartite Narrative Architecture Overhaul and Five-Act Foundations

- **Record ID:** CR-20261020-1345
- **Timestamp:** 2026-10-20T13:45:00+07:00 (Asia/Bangkok)
- **Milestone:** Sprint 5 Planning / Narrative Architecture Overhaul & Foundations
- **Operators:** Antigravity (Lead System Architect), mimo-v2.6-pro (Executive Narrative Director), under PO Theerapat and Senior Reviewer Gemini 4 Argon
- **Status:** Architectural ratification and Act 1–2 foundation blueprints complete; Act 3–5 blueprints and Sprint 5 implementation remain in planning stage

---

## 1. Objective and Authority

Following deep strategic review by the Tripartite Council (Theerapat PO, Gemini 4 Argon, and Antigravity Lead Architect), this change formally ratifies the grand narrative overhaul of JaoKob:
1. **[ADR-P0-030](../../adr/ADR-P0-030-tripartite-narrative-architecture-overhaul-five-act-expansion.md):** Expands the story into 5 distinct acts with an overarching ~50–60 minute playtime, introduces the childhood blue vest and mother's sacred red thread, establishes the Act 2 Reeds route Snare Crisis and poignant Great Farewell, designs the new Act 4 Workshop Labyrinth Gauntlet, and merges the garden encounter into an expanded Act 5 Grand Climax with three dignified horizons.
2. **[ADR-P0-029](../../adr/ADR-P0-029-in-universe-living-narrative-sovereignty-and-doll-language-ban.md):** Mandates in-universe living fairy-tale frog sovereignty and strictly bans out-of-universe doll/velvet material terminology from in-game prose.
3. **[ADR-P0-028](../../adr/ADR-P0-028-organic-family-resonance-companion-reciprocity-and-maturation-tradeoff.md), [ADR-P0-027](../../adr/ADR-P0-027-tripartite-narrative-resonance-family-bond-freeze-and-reformed-shadow-boss.md), [ADR-P0-026](../../adr/ADR-P0-026-cockroach-man-route-boss-jao-teuk-mandate-and-branching-narrative-graph.md), [ADR-P0-024](../../adr/ADR-P0-024-living-keepsake-transmutation-narrative-sovereignty-and-origin-canon.md):** Consolidate family bond freeze, companion reciprocity, reformed shadow boss tone cleanup, and living keepsake transmutation lore.

---

## 2. Traceability and Deliverables

| Authority | Artifact | Status & Verification |
|---|---|---|
| ADR-030 D1/D2, ADR-029 | `docs/design-system/act1-living-keepsake-rewrite-blueprint.md` | **rev.0.7.0:** Childhood blue vest from birth, mother's red thread mending (N11), Family Breathing Room (N06.5, N09.5), 10–12 min runtime. |
| ADR-030 D1/D2, ADR-026 | `docs/design-system/act2-living-keepsake-rewrite-blueprint.md` | **rev.0.2.0:** Reeds Snare Crisis (R03–R05, Bond +15), water shadow boss tone cleanup, D09 HP/STA restoration balance, Great Farewell (M13). |
| ADR-029, ADR-026 | `docs/design-system/act3-living-keepsake-rewrite-blueprint.md` | **rev.0.2.0:** Approved structure C01–C23, doll language clean; ready for ADR-030 double-take & pouch item update. |
| ADR-029, ADR-021 | `docs/design-system/act4-living-keepsake-rewrite-blueprint.md` | **rev.0.1.0:** Historical garden draft; scheduled for migration to Act 5 per ADR-030 D1. |
| ADR-023, ADR-030 | `docs/dialogue/INTER-AGENT-DIALOGUE.md` | Archived & closed at Message #020 with prominent banner. |
| ADR-030 | `docs/dialogue/INTER-AGENT-DIALOGUE2.md` | Volume 2 initialized; contains Message #021 (Tripartite Mandate) and #022 (mimo-v2.6-pro delivery). |
| ADR-024–030 | `docs/adr/ADR-P0-024` through `ADR-P0-030` | 6 accepted ADR documents formalizing narrative sovereignty, branching graph, and 5-act expansion. |

---

## 3. Verification and Regression

- **Game Regression:** `node --test tests/unit/*.test.js tests/unit/**/*.test.js`: **1,060 passed, 0 failed, 0 skipped** (20.72s).
- **Core Engine Boundaries:** Production import graph preserves strict Core/Data/UI separation; zero DOM or browser APIs in `src/core/`.
- **3D Asset Integrity:** Both adult and childhood GLB models remain valid under Khronos glTF-Validator (0 errors, 0 warnings).
- **Language Hygiene:** All blueprints in `docs/design-system/` adhere to ADR-P0-029 and contain zero doll/velvet terms for in-universe prose.

---

## 4. Governance and Next Steps

- This commit records the planning baseline and unstaged documentation artifacts on branch `feat/sprint-05-planning-ssot`.
- This is NOT a production PR submission or Sprint 5 completion. Implementation WBS tasks for Sprint 5 remain open.
- Upstream updates from `develop` will be pulled and synchronized cleanly.
