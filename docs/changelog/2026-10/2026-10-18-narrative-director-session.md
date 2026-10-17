# Narrative Director Session Registration — JaoKob Acts 1–5 Anti-Slop Overhaul

| Field | Value |
|---|---|
| Record ID | `ND-SESSION-2026-10-18-01` |
| Document type | Session identity registration (directorial governance artifact) |
| Session ID | `ses_ffe5eb4be19b3ffevA8SBUrxlh` |
| Model Identifier | `xiaomi/mimo-v2.6-pro` |
| Reasoning / Effort Level | `high` (thinking budget variant high) |
| Session Start Date | 2026-10-18, Asia/Bangkok |
| Initial Mission Topic | **Executive Narrative Direction, Anti-Slop Overhaul, and Cinematic Reconstruction of JaoKob Acts 1–5** |
| Runtime Role | Executive Narrative Director · Master Cinematic Dramaturge · Lead Interactive Fiction Craftsman |
| Working branch (at registration) | `feat/sprint-05-planning-ssot` |
| Contributor identity (to apply at commit) | `T3thr <t.theerapat33@gmail.com>` |
| Status | **Session opened — directorial diagnosis issued; no content/JSON rewrite committed yet** |

---

## 1. Authority Acknowledgement

This session binds itself to the Four-Tier Authority Hierarchy of [ADR-P0-023](../../adr/ADR-P0-023-documentation-hygiene-and-ssot-hierarchy.md) and will treat as **Tier 1 Supreme SSOT** only:

- [docs/sprints/sprint-05-ssot.md](../../sprints/sprint-05-ssot.md) (0.2.0, Four Value Slices PR #19–22)
- [ADR-P0-022](../../adr/ADR-P0-022-visual-novel-ergonomics-living-keepsake-lore-and-sprint-streamlining.md) — Living Keepsake 45 cm lore, VN overhaul, D1–D6
- [ADR-P0-021](../../adr/ADR-P0-021-narrative-resonance-authentic-adventure-and-branching-integrity.md) — Authentic adventure, anti-slop, branching integrity
- [ADR-P0-020](../../adr/ADR-P0-020-adventure-keepsake-pouch-and-item-system.md) — Pouch 4 slots / 6 items
- [ADR-P0-019](../../adr/ADR-P0-019-visual-novel-runtime-ergonomics-and-design-system-mandate.md) — VN runtime ergonomics
- [docs/proposals/sprint-05-planning/02-adr022-remediation-contract.md](../../proposals/sprint-05-planning/02-adr022-remediation-contract.md)

**Historical archive policy:** `docs/phase-0/` is Tier 4 READ-ONLY. Biological tadpole / gill / tail / metamorphosis / 4-hour playtime language found there is **not** an Active Requirement and will not be re-imported into any rewrite.

Supporting design sources consulted under Tier 2 / handoff scope (not supreme over ADR-022/021):

- [docs/design-system/act1-narrative-contract.md](../../design-system/act1-narrative-contract.md)
- [docs/proposals/sprint-04-overhaul/05-act-2-5-map-and-endings.md](../../proposals/sprint-04-overhaul/05-act-2-5-map-and-endings.md) — mechanics/topology source only where compatible with ADR-022
- Production content: `src/data/content/packages/act-01.json` (content 3.0.0) and `src/data/content/presentation/act-01-3.0.0.json`

---

## 2. Mission Scope (First Session)

1. **Directorial diagnosis** of current Act 1 production prose and the Act 2–5 map against Living Keepsake truth and anti-slop discipline.
2. **Master vision** for a five-act cinematic reconstruction (beats, light, silence, subtext) compatible with the Visual Novel surface.
3. **PO alignment questions** before any production JSON rewrite (T6/T8–T12 narrative tasks).

**Non-goals this session:** code changes, schema changes, production JSON rewrite, art export, Save-format work, deployment.

---

## 3. Opening Scan Summary (pre-diagnostic facts)

| Probe | Result |
|---|---|
| `act-01.json` dialogues | 70 records, `contentVersion 3.0.0`, schema 2.0.0 |
| Speaker distribution | 68 narrator · 1 mother · 1 JaoKob internal thought |
| Word `หาง` (tail) in dialogue text | **42 / 70** lines |
| Word `ว่าย` (swim) in dialogue text | **15 / 70** lines |
| Character registry `character.jaokob` | `lifeStage: tadpole`, appearance "ลูกอ๊อดร่างเล็ก ใช้หางว่ายน้ำ ยังไม่เติบโตเป็นกบเต็มวัย" |
| Delivery `pace` values | 70/70 = `slow` (zero pacing variance) |
| Delivery emotion histogram | warm 34 · tender 10 · curious 7 · hopeful/neutral/lonely/relieved 4 each · afraid 2 · urgent 1 |
| Keepsake registry | 5 items (`item_red_yarn` correctly deferred to A2) |
| Act 2 spine in map | still "ร่างกายเปลี่ยน หางสั้น ขารับน้ำหนัก" (post-storm metamorphosis) |

These facts are recorded here as **session intake evidence**, not as acceptance. Full unfiltered diagnosis is delivered in the directorial response accompanying this record.

---

## 4. Governance Notes

- Canon / ending taxonomy conflicts discovered in this session must be raised as **CR-*** items and resolved by PO before rewrite — per AGENTS.md §6 and §10, the Director does not silently pick a meaning.
- Formal Change Record + `CHANGELOG.md` line + Sprint SSOT Section 7 register entry will be produced when the first **content** delivery lands (expected at Slice 2 / T6), not for this identity-only artifact alone.
- Commit identity must be verified as `T3thr <t.theerapat33@gmail.com>` before any commit on a narrative feature branch.

---

## 5. Session Continuity

| Next action | Owner | Gate |
|---|---|---|
| PO answers Directorial Questions (ending taxonomy, growth staging, silence budget) | PO | Blocks T6 authoring |
| Draft `CR-2026xxxx` if `END-POND` vs `END-NEARBY` remains divergent | Narrative Director | AGENTS.md §8 |
| Act 1 living-keepsake rewrite + Act 2 launch scripts (T6) after alignment | Narrative | Slice 2 / PR #20 |
| Cinematic beat boards for growth / storm / city / girl / endings | Narrative + Art | Slice 2–3 |

— End of registration record —
