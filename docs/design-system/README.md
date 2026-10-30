# docs/design-system/ · Tier 2 สัญญาออกแบบ

สัญญาที่โค้ด Sprint 5 ต้องทำตาม: เนื้อเรื่องทั้งห้าองก์ กติกาเกม ฟิสิกส์ และหน้าจอ ทุกตัวเลขในนี้พิสูจน์ด้วยสคริปต์ใน [evidence/](evidence/)

**ออกแบบตาม:** Design by Contract และ Specification by Example (Gojko Adzic, 2011) ที่ให้ข้อกำหนดมีตัวอย่างที่รันตรวจได้ · ISO/IEC/IEEE 29148:2018 (ข้อกำหนดต้องตรวจพิสูจน์ได้) · [ADR-P0-032 v2.0](../adr/ADR-P0-032-living-fantasy-canon-peuak-miracle-doll-and-vn-stage-blocking.md) และ [ADR-P0-033](../adr/ADR-P0-033-interactive-tactical-adventure-gameplay-and-dynamic-stage-revolution.md)

## สัญญาที่มีผล (อ่านตามลำดับ)

| ไฟล์ | เนื้อหา |
|---|---|
| [five-act-narrative-gameplay-master-plan.md](five-act-narrative-gameplay-master-plan.md) | มหาพิมพ์เขียว: ภาพรวม กติกาเกมทุกระบบ กราฟทางแยก คัมภีร์เสียงตัวละคร บัญชีลวดลาย สัญญาข้อมูล |
| [act1-living-keepsake-rewrite-blueprint.md](act1-living-keepsake-rewrite-blueprint.md) ถึง [act5-living-keepsake-rewrite-blueprint.md](act5-living-keepsake-rewrite-blueprint.md) | บทครบทุกโหนด พร้อมฉาก ตัวละคร ทิศหน้า และบรรทัดตอบสนองของทุกการ์ด |
| [interactive-gameplay-ux-ui-specification.md](interactive-gameplay-ux-ui-specification.md) | สถานะ พฤติกรรม และข้อความของห้าโหมดหน้าจอ |
| [physics-scale-and-visual-v2-specification.md](physics-scale-and-visual-v2-specification.md) | ฟิสิกส์สเกล 45 ซม. ตารางเวทีเงา และกฎภาพสำหรับ Astra |
| [new-five-act-story-and-mechanics-proposal.md](new-five-act-story-and-mechanics-proposal.md) | ข้อเสนอเรื่องต้นทางของ PO (v2.1) ที่ ADR-P0-032 อ้าง |

## สัญญาของโค้ดที่ทำงานอยู่แล้ว (Tier 3)

[visual-novel-specification.md](visual-novel-specification.md) · [keepsake-pouch-contract.md](keepsake-pouch-contract.md) · [session-history-contract.md](session-history-contract.md) · [sprint-04-closeout-contract.md](sprint-04-closeout-contract.md) · [act1-narrative-contract.md](act1-narrative-contract.md)

## โฟลเดอร์ย่อย

| โฟลเดอร์ | เนื้อหา | ผู้ดูแล |
|---|---|---|
| [evidence/](evidence/) | เครื่องมือพิสูจน์ (Node.js) และหน้าตรวจรับภาพ | ดู [evidence/README.md](evidence/README.md) |
| [asset-prompts/](asset-prompts/) | สัญญาและพรอมป์ต์สร้างภาพ เริ่มที่ [00-ASTRA-WORKFLOW-AND-OUTPUT-CONTRACT.md](asset-prompts/00-ASTRA-WORKFLOW-AND-OUTPUT-CONTRACT.md) | Astra (เปลี่ยนสัญญาผ่าน PO) |
| [ux-mockups/](ux-mockups/) | ภาพต้นแบบหน้าจอราย version (v1 วาดทั้งภาพ · v2 ใช้ harness ชุดเดียว) | Astra |

**กติกาเหล็ก**

1. ข้อความบนจอทุกคำคัดจากพิมพ์เขียวรายองก์ ชั้นภาพห้ามแต่งเอง
2. แก้บทหรือกติกาแล้วต้องรันเครื่องมือใน [evidence/](evidence/) ใหม่ทั้งหมด และเวลาเล่นทุกเส้นทางต้องอยู่ที่ 8–10 นาทีต่อองก์
3. รุ่นที่ถูกแทนที่ย้ายไป [archive/](../archive/) ไม่ลบ
