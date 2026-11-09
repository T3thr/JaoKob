# tests/ · การตรวจสอบทั้งหมดของ repository

**ออกแบบตาม:** Test Pyramid (Mike Cohn, *Succeeding with Agile*, 2009) ให้เทสต์ส่วนใหญ่เป็น unit ที่เร็วและแน่นอน และ ISO/IEC/IEEE 12207:2017 §6.4.9 (Verification) ที่ทุกผลต้องรันซ้ำได้และย้อนกลับถึง Requirement ID

| โฟลเดอร์ | ตรวจอะไร | วิธีรัน |
|---|---|---|
| [unit/](unit/) | core, data, ui แยกชั้นของ Journey (ชุดหลักที่ต้องผ่าน 100% ก่อนทุก commit) · เทสต์ของ runtime Sprint 4 ถูกลบใน C5e ตาม[ทะเบียน assertion](../docs/traceability/sprint-05-superseded-assertions.md) | `node --test 'tests/unit/**/*.test.js'` |
| [fixtures/](fixtures/) · [helpers/](helpers/) | ข้อมูลและตัวช่วยของเทสต์ | ใช้ร่วมกับ unit |
| [schema/](schema/) | schema 3.0.0 เทียบ Ajv อ้างอิง (ต้องมี Ajv ของเครื่องพัฒนา ผ่าน `JKB_AJV_PATH`) | `node tests/schema/journey-reference.mjs` |
| [docs/](docs/) | ลิงก์ภายในเอกสารทุกลิงก์ต้องมีปลายทางจริงและเป็น relative | `node tests/docs/check-doc-links.mjs` |
| [release/](release/) | ซ้อมสร้าง static artifact ของ Journey จาก allowlist และซ้อมย้อนกลับไป Sprint 4 โดยไม่ deploy | `node tests/release/verify-static-artifact.mjs` |
| [e2e/](e2e/) | เล่นจริงในเบราว์เซอร์ และ [e2e/evidence/](e2e/evidence/) เก็บหลักฐานภาพหน้าจอราย Sprint | ดู [e2e/README.md](e2e/README.md) |
| [accessibility/](accessibility/) · [contract/](contract/) · [integration/](integration/) · [persistence/](persistence/) · [state-transition/](state-transition/) | โฟลเดอร์จองไว้ แต่ละโฟลเดอร์มี README บอกว่าจะใส่อะไร | - |

**กติกาเหล็ก**

1. ห้ามคัดลอกไฟล์ runtime มาเป็น fixture ถ้าใช้ไฟล์เดียวกันได้ ให้อ่านจาก `src/` โดยตรงและตรึง SHA-256 ไว้ในเทสต์ (ตัวอย่าง: `journey-media-resolver.test.js` อ่านภาพจริงทุกไฟล์ใน manifest)
2. หลักฐานใน `e2e/evidence/` เป็นประวัติ ห้ามแก้ภาพหรือผลเดิม ไฟล์ที่ซ้ำกันทุกไบต์ถูกยุบแล้ว ดัชนีอยู่ที่ [e2e/evidence/deduplicated-aliases.json](e2e/evidence/deduplicated-aliases.json)
3. จำนวนเทสต์ที่ผ่านต้องรายงานใน Change Record ทุกครั้ง
