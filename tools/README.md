# tools/ · เครื่องมือตอนพัฒนา

เครื่องมือที่รันบนเครื่องพัฒนาเท่านั้น ไม่ส่งออกไปกับเกม และไม่อยู่ใน release allowlist · ผลลัพธ์ที่เครื่องมือสร้างถูก commit ไว้ เกมจึงไม่มี build step ตอนเล่น ([ADR-P0-034 D6](../docs/adr/ADR-P0-034-five-act-journey-runtime-save2-journey-profile-and-blueprint-compiled-content.md))

**ออกแบบตาม:** Generated artifacts with drift gates (ผลที่สร้างต้องตรวจได้ว่ายังตรงกับต้นทาง) · ISO/IEC/IEEE 12207:2017 §6.3.5 Configuration Management

| เครื่องมือ | ทำอะไร | ผลลัพธ์ | ตรวจ drift | ผู้ดูแล |
|---|---|---|---|---|
| [schema/build-journey-catalog.mjs](schema/build-journey-catalog.mjs) | ฝัง schema ใน `specs/schemas/v3.0.0/` เป็นโมดูล JS ที่ freeze แล้ว | `src/data/validation/journey-schema-catalog.js` | `--check` · `tests/unit/journey-schema.test.js` | Core Architect |
| [content/compile-journey.mjs](content/compile-journey.mjs) | รวมพิมพ์เขียวรายองก์กับสเปกกลไกเป็นแพ็กเกจ ตรวจ schema และการอ้างอิงทุกตัว ปฏิเสธผู้พูด แท็ก โหมด หรือตัวเลือกที่ไม่ตรง | `src/data/content/journey/` · `docs/design-system/mechanics/compile-report.json` | `--check` · `tests/unit/journey-content.test.js` | Core Architect |

**กติกาเหล็ก**

1. ห้ามแก้ไฟล์ที่เครื่องมือสร้างด้วยมือ ให้แก้ต้นทางแล้วรันเครื่องมือ
2. เครื่องมือต้องให้ผลเหมือนเดิมทุกครั้ง (เรียงลำดับคงที่ ไม่มีเวลาหรือข้อมูลของเครื่องในผลลัพธ์)
3. ทุกเครื่องมือมีโหมดตรวจ และมี unit test ที่ล้มเมื่อผลที่ commit ไม่ตรงต้นทาง
4. Production code ห้าม import จาก `tools/` (เหมือนข้อห้าม import จาก `tests/`)
