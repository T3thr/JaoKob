# src/data/content/journey/ · แพ็กเกจของ Journey runtime

ไฟล์ในโฟลเดอร์นี้ **สร้างด้วย** `node tools/content/compile-journey.mjs` จากพิมพ์เขียวรายองก์และ [สเปกกลไก](../../../../docs/design-system/mechanics/README.md) **ห้ามแก้มือ** · `tests/unit/journey-content.test.js` ล้มทันทีเมื่อไฟล์ไม่ตรงกับต้นทาง

| ไฟล์ | ใช้ตอนเล่น | หน้าที่ |
|---|---|---|
| `story-jaokob-core.json` | ใช้ | แพ็กเกจ `story.jaokob.core` ตาม [schema 3.0.0](../../../../specs/schemas/v3.0.0/journey-package.schema.json) · ตอนนี้มีเฉพาะ Act 1 ต้นแบบที่ยังไม่ผ่านการรับรองของ T6 และจบที่ทางเข้า Act 2 สองทาง |
| `story-jaokob-core.receipts.json` | ไม่ใช้ | ต้นทางของทุกข้อความ (ไฟล์และบรรทัดของพิมพ์เขียว) สำหรับตรวจย้อนและ harness ของ PO · ต้องไม่อยู่ใน release allowlist |

ผู้ดูแล: Core Architect · ลำดับการปลดเนื้อหาเดิมดู [ADR-P0-034 D1](../../../../docs/adr/ADR-P0-034-five-act-journey-runtime-save2-journey-profile-and-blueprint-compiled-content.md)
