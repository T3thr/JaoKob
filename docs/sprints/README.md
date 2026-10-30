# docs/sprints/ · แผนงานราย Sprint (SSOT)

แต่ละ Sprint มีไฟล์ SSOT เดียว (WBS, Definition of Ready, Definition of Done และ §7 ทะเบียน Change Record)

**ออกแบบตาม:** ISO/IEC/IEEE 12207:2017 §6.3.1 Project Planning และ Scrum Guide (2020) ที่แต่ละ Sprint มีเป้าหมายและ Definition of Done ชัดเจน

| ไฟล์ | ระดับ | สถานะ |
|---|---|---|
| [sprint-05-ssot.md](sprint-05-ssot.md) | **Tier 1** | Sprint ปัจจุบัน · เริ่ม Implementation 2026-11-01 |
| [sprint-04-ssot.md](sprint-04-ssot.md) | Tier 3 | ฐานที่รวมเข้า `develop` แล้ว |
| [sprint-03-ssot.md](sprint-03-ssot.md) · [sprint-02-ssot.md](sprint-02-ssot.md) · [sprint-01-ssot.md](sprint-01-ssot.md) | Tier 4 | ประวัติ |

**กติกาเหล็ก**

1. ติ๊ก `[x]` ใน WBS เฉพาะงานที่โค้ดและเทสต์เสร็จจริง งานออกแบบหรือภาพต้นแบบไม่นับ
2. ทุก Change Record ลงทะเบียนใน §7 ของ Sprint ที่กำลังทำ
3. เปิด Sprint ใหม่: สร้าง `sprint-NN-ssot.md` และกระดาน `docs/dialogue/sprint-NN/` (ดู [dialogue/README.md](../dialogue/README.md)) แล้วอัปเดตลิงก์ใน [docs/README.md](../README.md), [AGENTS.md](../../AGENTS.md) และ [CLAUDE.md](../../CLAUDE.md)
