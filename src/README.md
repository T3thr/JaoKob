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
4. กติกาเกมใหม่ของ Sprint 5 (ศึกแสงปะทะเงา แคมป์ สายใย ฉากจบ) ต้องตรงกับ [tactical-clash-engine.mjs](../docs/design-system/evidence/tactical-clash-engine.mjs) และ [มหาพิมพ์เขียว §2](../docs/design-system/five-act-narrative-gameplay-master-plan.md) ซึ่งเป็นต้นแบบที่พิสูจน์แล้ว
