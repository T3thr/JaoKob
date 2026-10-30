# Change Record: CR-20261029-0550 — ADR-P0-032 Living Fantasy Canon Overhaul, 5-Act Story & Mechanics Proposal, and Astra Visual Novel Asset Pipeline

| Metadata | Value |
|---|---|
| **Change ID** | `CR-20261029-0550` |
| **Date** | `2026-10-29T05:50:00+07:00` |
| **Author** | `T3thr <t.theerapat33@gmail.com>` (PO & Antigravity Co-Leadership) |
| **Branch** | `feat/sprint-05-planning-ssot` |
| **Traceability** | `ADR-P0-032`, `ADR-P0-031` (Math/System), `ADR-P0-025`, `ADR-P0-020`, `ADR-P0-019` |

---

## 1. Summary of Changes

1. **ADR Status Classification & `ADR-P0-032` Ratification:**
   - Prepended explicit status banners (`ACTIVE`, `PARTIALLY ACTIVE`, `SUSPENDED / SUPERSEDED`) to all existing ADR files (`ADR-P0-013` through `ADR-P0-031`) and created the master index [docs/adr/README.md](../../adr/README.md).
   - Ratified [ADR-P0-032](../../adr/ADR-P0-032-living-fantasy-canon-peuak-miracle-doll-and-vn-stage-blocking.md) establishing the living fantasy canon, sibling roles (**เจ้ากับ** older brother & **เจ้ากิบ** younger sister), **เจ้าเตื๊อก**'s guardian mission to protect **เด็กหญิงเปี๊ยก**, **แมลงสาบแมน** as the overarching 5-act shadow-cloak nemesis, **พี่ก้าม** & **เจ้าฟิ้ว**'s emotional arcs, the `Family Skill Trade-off` unlocking `E-DAWN`, and VN Stage Blocking rules.
2. **Master Five-Act Narrative & Mechanics Proposal:**
   - Created [docs/design-system/new-five-act-story-and-mechanics-proposal.md](../../design-system/new-five-act-story-and-mechanics-proposal.md) detailing the causal mystery loop, character backstories, 6 new keepsake items, and Act 1–5 blueprint summary.
3. **Visual Novel Asset Directory Structure & `Senior AI / GPT-6 Astra` Prompt Pipeline:**
   - Created version-ready Visual Novel asset directories under `assets/images/characters/`, `assets/images/backgrounds/act-01..05/`, `assets/images/cg/act-01..05/`, and `assets/images/keepsakes/v2/`, along with [assets/images/README.md](../../../assets/images/README.md) and [assets/images/asset-manifest-v1.json](../../../assets/images/asset-manifest-v1.json).
   - Created the 4-part prompt pipeline in `docs/design-system/asset-prompts/` (`00-ASTRA-WORKFLOW-AND-OUTPUT-CONTRACT.md`, `01-CHARACTER-SPRITE-PROMPTS.md`, `02-BACKGROUND-SCENE-PROMPTS.md`, `03-CINEMATIC-CG-AND-KEEPSAKE-PROMPTS.md`) and recorded Message #025 in [docs/dialogue/INTER-AGENT-DIALOGUE2.md](../../dialogue/archive/volume-02-messages-021-031-sprint-05-planning.md).

---

## 2. Verification

- `node --test tests/unit/*.test.js`: **1,060 / 1,060 passing (0 failed)**
- `node docs/design-system/evidence/act1-4-balance-model.mjs`: **PASS (exit 0)**
- `node docs/design-system/evidence/act1-4-runtime-ledger.mjs`: **PASS (exit 0)**

