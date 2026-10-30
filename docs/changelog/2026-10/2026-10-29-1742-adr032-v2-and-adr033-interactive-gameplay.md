# Change Record: CR-20261029-1742 — ADR-P0-032 v2.0 Ironclad Canon, Pre-ADR-032 Blueprint Archival, and ADR-P0-033 Interactive Tactical Story Adventure Revolution

| Metadata | Value |
|---|---|
| **Change ID** | `CR-20261029-1742` |
| **Date** | `2026-10-29T17:42:00+07:00` |
| **Author** | `T3thr <t.theerapat33@gmail.com>` (PO & Antigravity Co-Leadership) |
| **Branch** | `feat/sprint-05-planning-ssot` |
| **Traceability** | `ADR-P0-033`, `ADR-P0-032` (v2.0), `ADR-P0-025`, `ADR-P0-020`, `ADR-P0-019` |

---

## 1. Summary of Changes

1. **Pre-ADR-032 Stale Blueprint Archival & Anti-Hallucination Cleanup:**
   - Moved the 5 superseded pre-ADR-032 narrative blueprints (`five-act-narrative-gameplay-master-plan.md` v1.1.0 and `act1..4-living-keepsake-rewrite-blueprint.md` v1.0.0) into [docs/design-system/archive-pre-adr032/](../../archive/design-system-pre-adr032/README.md) with an explicit `ARCHIVED & SUPERSEDED — DO NOT USE` notice, and replaced the active filenames with clean pointer headers awaiting the v2.0 rebuild.
2. **`ADR-P0-032 (v2.0)` Upgrade & Master 5-Act Multiple-Narrative Bible (`v2.1`):**
   - Upgraded [ADR-P0-032 (v2.0)](../../adr/ADR-P0-032-living-fantasy-canon-peuak-miracle-doll-and-vn-stage-blocking.md) and [new-five-act-story-and-mechanics-proposal.md (v2.1)](../../design-system/new-five-act-story-and-mechanics-proposal.md): locked the single-frog / single-blue-shirt origin (zero crochet or second doll; `Smooth Soft Velour Plush` transmutation only in `E-HOME`), human young-adult couple canon for **เจ้าเตื๊อก** and **เปี๊ยก** (`ต.♡ป.`), true Multiple-Narrative branching routes, **4 Living Bonds** with dynamic pronoun shifts, natural Thai Family Skills (`ตั้งสติฟังฝน`, `ดีดตัวผ่าลม`, `ตาส่องเงามืด`) with consecutive overuse strain, mandatory **`Item × Bond Combo`** (with companion backline holding marked Optional), symmetrical `Status + Bond + Item` 3-ending conditions, and `VN Tachie` v2 portrait standards (retaining the fantasy shadow cape in `CG-05A`).
3. **`ADR-P0-033 (v1.0)` Ratification — Interactive Tactical Story Adventure Revolution:**
   - Ratified [ADR-P0-033](../../adr/ADR-P0-033-interactive-tactical-adventure-gameplay-and-dynamic-stage-revolution.md) and registered it in [docs/adr/README.md](../../adr/README.md): approved 4 interactive gameplay pillars (`D1` Light vs. Shadow Tactical Clash, `D2` Choice Energy Economy & Under-Eave Shelter Camp, `D3` Dynamic Background, Reactive Weather & Live Optical Shadow Stage, `D4` Tactile Story Micro-Actions), explicitly banned pixel-hunt/drag-beam exploration and route-map/companion radar pins (`D0`), and established the physics (45 cm scale & optical shadow geometry), verifiable balance math, and UX/UI mockup specification mandate (`D5`).

---

## 2. Verification

- `node --test 'tests/unit/**/*.test.js'`: **1,060 / 1,060 passing (0 failed)**
- Documentation & ADR status cross-reference check: **PASS (`ADR-P0-032 v2.0` + `ADR-P0-033 v1.0` aligned across `docs/adr/README.md` and `new-five-act-story-and-mechanics-proposal.md`)**

