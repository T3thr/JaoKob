# docs/rfc/ · คำขอเปลี่ยนแปลง (Change Requests)

คำขอเปลี่ยนสัญญาหรือขอบเขตที่ต้องให้ PO ตัดสินก่อนลงมือ ตั้งชื่อ `CR-000N-<slug>.md` (คนละชุดกับ Change Record `CR-YYYYMMDD-HHmm` ใน [changelog/](../changelog/) ซึ่งเป็นบันทึกหลังทำงาน)

**ออกแบบตาม:** ISO/IEC/IEEE 12207:2017 §6.3.5.3.3 Change Request Management และรูปแบบ RFC ที่เสนอ พิจารณา แล้วบันทึกผล

| CR | เรื่อง | ระดับ |
|---|---|---|
| [CR-0001](CR-0001-sprint-01-core-contract-clarifications.md) | ข้อชี้แจงสัญญา core ของ Sprint 1 | Tier 4 |
| [CR-0003](CR-0003-interactive-light-novel-presentation.md) | สัญญาการนำเสนอแบบ Interactive Light Novel | Tier 3 (โค้ดปัจจุบันทำตาม) |
| [CR-0004](CR-0004-adult-plush-model-spike.md) | Spike โมเดลตุ๊กตา 3D | Tier 4 (งานวิจัย) |
| [CR-0005](CR-0005-sprint-04-overhaul.md) | ขอบเขต Sprint 4 | Tier 4 |
| [CR-0006](CR-0006-sprint-05-complete-story-and-package-boundaries.md) | ขอบเขตเรื่องเต็มและ package ของ Sprint 5 | Tier 1 เฉพาะขอบเขต package · เนื้อเรื่องยึด ADR-P0-032 v2.0 |

**กติกาเหล็ก:** CR ที่อนุมัติแล้วต้องมีผลสะท้อนใน Sprint SSOT หรือ ADR · ห้ามแก้ CR ที่ปิดแล้ว ให้เปิด CR ใหม่อ้างถึง
