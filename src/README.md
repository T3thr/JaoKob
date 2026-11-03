# src/ · โค้ดเกม (Runtime)

**ระดับ:** โค้ดที่ทำงานจริงในเบราว์เซอร์ ทุกไฟล์ในนี้ส่งออกไปกับเกม (ตาม allowlist ใน [specs/releases/](../specs/releases/))

**ออกแบบตาม:** Clean Architecture และ Ports and Adapters (Robert C. Martin, *Clean Architecture*, 2017 · Alistair Cockburn, *Hexagonal Architecture*, 2005) โดยตรรกะเกมอยู่ตรงกลาง ส่วน DOM และ LocalStorage เป็น adapter ที่เสียบเข้ามาทาง port

| โฟลเดอร์ | หน้าที่ | ห้าม |
|---|---|---|
| [core/](core/) | ตรรกะเกมบริสุทธิ์: domain · use-cases · state-machine · ports · events | import จาก `ui/` หรือ `data/` · เรียก `window` `document` `localStorage` หรือ Browser API ใด ๆ |
| [data/](data/) | adapter ข้อมูล: content package · validation · persistence · migrations · localization | ใส่กติกาเกม (กติกาอยู่ใน `core/`) |
| [ui/](ui/) | adapter แสดงผล: components · renderers · styles · audio · accessibility | คำนวณกติกาเกมเอง (รับ view model ที่ไม่เปลี่ยนค่าจาก core เท่านั้น) |
| [bootstrap/](bootstrap/) | Composition Root ประกอบทุกชั้นเข้าด้วยกันตอนเริ่มเกม | มีตรรกะเกม |

**กติกาเหล็ก**

1. ทิศทาง dependency ชี้เข้าหา `core/` เสมอ
2. ไม่มี framework ไม่มี build step ไม่มี dependency ภายนอกใน runtime
3. ทุกการเปลี่ยนแปลงมี unit test ใน [tests/unit/](../tests/unit/) และอ้าง Requirement ID จาก [Sprint SSOT](../docs/sprints/sprint-05-ssot.md)
4. กติกาเกมของ Sprint 5 (ศึกแสงปะทะเงา ด่าน แคมป์ สายใย ฉากจบ) อยู่ใน [core/](core/README.md) ตาม [มหาพิมพ์เขียว §2](../docs/design-system/five-act-narrative-gameplay-master-plan.md) · kernel ของศึกผ่าน parity gate กับ engine ที่พิสูจน์แล้วทุกลำดับการกด ([clash-parity.mjs](../tools/clash/clash-parity.mjs))
5. ชั้นข้อมูลของ Journey (C3): รับแพ็กเกจและ identity ใน [data/content/journey-package.js](data/content/journey-package.js) · เซฟ journey ใน [data/validation/journey-save-validator.js](data/validation/journey-save-validator.js) และ [data/persistence/journey-save-repository.js](data/persistence/journey-save-repository.js) · ตั้งค่าและข้อความแจ้งของเครื่องใน `journey-device-records.js` · namespace เดิมอ่านอย่างเดียวผ่าน `legacy-archive.js` · ประกอบกับ Core ใน [bootstrap/journey-application.js](bootstrap/journey-application.js) ซึ่ง C5 วาง UI ไว้ด้านบน · สัญญา storage อยู่ใน [specs/README.md](../specs/README.md)
