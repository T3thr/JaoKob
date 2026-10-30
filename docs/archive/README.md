# docs/archive/ · Tier 4 คลังประวัติศาสตร์ (อ่านอย่างเดียว)

> [!WARNING]
> ทุกอย่างในโฟลเดอร์นี้ถูกแทนที่แล้ว ห้ามใช้ตัดสินเนื้อเรื่อง กติกาเกม UI หรือสถาปัตยกรรมของงานใหม่ ใช้เพื่อเข้าใจเหตุผลในอดีตและเพื่อ audit เท่านั้น กติกาปัจจุบันอยู่ที่ [docs/README.md](../README.md)

**ออกแบบตาม:** [ADR-P0-023](../adr/ADR-P0-023-documentation-hygiene-and-ssot-hierarchy.md) Tier 4 และ ISO/IEC/IEEE 12207:2017 §6.3.5 (Configuration Management) ที่ให้เก็บรุ่นเก่าไว้ตรวจย้อนกลับได้ แทนการลบ

| ที่ | คืออะไร | ถูกแทนที่โดย |
|---|---|---|
| [phase-0/](phase-0/) | เอกสารรากฐาน 31 ส.ค. 2026 (GDD, Narrative Bible, SRS, Architecture, Git runbook, Quality gates) | ADR ที่มีผลใน [adr/README.md](../adr/README.md) และ [Sprint 5 SSOT](../sprints/sprint-05-ssot.md) |
| [design-system-pre-adr032/](design-system-pre-adr032/) | มหาพิมพ์เขียว v1.1 และพิมพ์เขียว Act 1–4 v1.0 (ยุคด้ายแดง) | [design-system/](../design-system/) 2.0.0 ตาม ADR-P0-032 v2.0 |
| [session-logs/](session-logs/) | บันทึกรอบทำงานแบบต่อเนื่อง Sprint 3–4 (เดิมคือ `progress.md` ที่รากโครงการ) | [changelog/](../changelog/) |
| [agent-prompts/](agent-prompts/) | คำสั่งเปิดงานของ Agent ยุค Sprint 1 | [AGENTS.md](../../AGENTS.md) และ [Sprint 5 SSOT](../sprints/sprint-05-ssot.md) |
| [2026-09-01-documentation-reorganization-log.md](2026-09-01-documentation-reorganization-log.md) | บันทึกจัดระเบียบเอกสารครั้งแรก | โครงสร้างปัจจุบันใน [docs/README.md](../README.md) (`CR-20261031-0420`) |

**กติกาเหล็ก**

1. ห้ามแก้เนื้อหาเดิม แก้ได้เฉพาะลิงก์ที่เสียเพราะการย้ายไฟล์ และป้ายเตือนบนสุด
2. ไฟล์ที่ย้ายเข้ามาต้องบันทึกใน Change Record ว่าย้ายจากไหน ถูกแทนที่ด้วยอะไร
3. กระดานสนทนา Agent ที่ปิดแล้วเก็บแยกที่ [dialogue/archive/](../dialogue/archive/) เพราะเป็นวงจรชีวิตของกระดาน
