# Proposals and Technical Research Directory (`docs/proposals/`)

พื้นที่สำหรับเก็บเอกสารข้อเสนอทางเทคนิค (Technical Proposals), การวิจัยสถาปัตยกรรม (Architecture Research), และการระดมสมอง (Brainstorming Specifications) ก่อนที่จะถูกแปลงเป็น Request for Comments (RFC), Architecture Decision Records (ADR), หรือ Sprint SSOT ที่ได้รับอนุมัติ

## ระดับเอกสาร ([ADR-P0-023](../adr/ADR-P0-023-documentation-hygiene-and-ssot-hierarchy.md))

| โฟลเดอร์ | ระดับ | ใช้อย่างไร |
|---|---|---|
| [sprint-05-planning/](sprint-05-planning/) | **Tier 1 เฉพาะส่วนวิศวกรรม** | สัญญาส่งมอบ package, save และ runtime ของ Sprint 5 · ส่วนเนื้อเรื่องยุค ADR-P0-022 ถูกแทนด้วย ADR-P0-032 v2.0 และ [design-system/](../design-system/) |
| [3d-keepsake-spike/](3d-keepsake-spike/) | Tier 4 งานวิจัย | โมเดล 3D และ viewer ทดลอง ยังไม่เข้า runtime |
| [sprint-04-overhaul/](sprint-04-overhaul/) · [phase-02-visual-novel-architecture/](phase-02-visual-novel-architecture/) | Tier 4 | ข้อเสนอที่ปิดรอบแล้ว |

**กติกาเหล็ก:** ข้อเสนอไม่ใช่กติกา จนกว่าจะถูกยกเป็น ADR หรือเข้า Sprint SSOT · หลักฐานที่ซ้ำกับที่อื่นถูกยุบแล้ว ดู `deduplicated-aliases.json` ในโฟลเดอร์ evidence

## รายการเอกสารข้อเสนอในปัจจุบัน

| รหัสเอกสาร | ชื่อข้อเสนอ | ผู้จัดทำ | สถานะ | ลิงก์เอกสาร |
|---|---|---|---|---|
| **JKB-S5-ASSESSMENT-001 / CR-0006** | Sprint 5: Living Keepsake, Modern VN and Protected Story Packages | Codex / Senior Software Architect, Lead Interactive Fiction Director | v0.2 under Accepted ADR22; four execution slices, twenty tasks, Save2; ready for Slice1 contract/design work, implementation unstarted | [Readiness assessment](sprint-05-planning/01-readiness-assessment.md), [remediation contract](sprint-05-planning/02-adr022-remediation-contract.md), [Execution SSOT](../sprints/sprint-05-ssot.md), [RFC](../rfc/CR-0006-sprint-05-complete-story-and-package-boundaries.md) |
| **JKB-PROP-S4-001 / CR-0005** | Sprint 4: Visual, Narrative & Interactive Overhaul | Codex / Technical Lead, Game Director, UI/UX Architect | Historical proposal; five PRs and twelve tasks integrated through PR #17; later-act map handed to Sprint 5 | [Proposal plan](sprint-04-overhaul/01-proposal-plan.md), [integrated SSOT](../sprints/sprint-04-ssot.md) |
| **JKB-PROP-P2-001** | Phase 2 Architecture & Design Proposal: Interactive Light Novel RPG Transformation & Customization Asset Pipeline | Tech Lead (Gemini 3.8 Flash) | Archived proposal; [CR-0003 APPROVED](../rfc/CR-0003-interactive-light-novel-presentation.md), 2026-09-07 | [01-visual-novel-transformation-tech-lead-proposal.md](phase-02-visual-novel-architecture/01-visual-novel-transformation-tech-lead-proposal.md) |
| **CR-0004** | Adult Plush & Childhood Crochet Keepsakes | Codex | Milestones 1 and 1B technically verified; owner art review and production integration deferred | [Models, local viewer and instructions](3d-keepsake-spike/README.md) |

## โครงสร้างและการใช้งาน
- แต่ละหัวข้อใหญ่ให้สร้างเป็นโฟลเดอร์เฉพาะ เช่น `phase-02-visual-novel-architecture/`
- ให้เก็บเอกสารการวิเคราะห์ (`.md`) คู่กับภาพร่างต้นแบบ (Reference / Target Visuals) โดยตั้งชื่อไฟล์เป็นแบบ kebab-case เสมอ
- ห้ามนำโค้ดในข้อเสนอไปเริ่มพัฒนาใน Production (`src/`) จนกว่าจะผ่าน Definition of Ready และบันทึกเป็น Sprint SSOT อย่างเป็นทางการ
