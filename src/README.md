# src/ · โค้ดเกม (Runtime)

**ระดับ:** โค้ดที่ทำงานจริงในเบราว์เซอร์ · ไฟล์ที่ `index.html` ใช้ถูกส่งออกตาม allowlist ใน [specs/releases/](../specs/releases/) ซึ่งเทสต์ตรวจว่าตรงกับสิ่งที่ `index.html` เข้าถึง · `core/ports/audio-port.js` `ui/audio/` และ `core/use-cases/session-history.js` คงไว้สำหรับเสียง (T7) และแผงประวัติ (UX §1.7) ยังไม่มีผู้ใช้จึงยังไม่อยู่ใน allowlist

**ออกแบบตาม:** Clean Architecture และ Ports and Adapters (Robert C. Martin, *Clean Architecture*, 2017 · Alistair Cockburn, *Hexagonal Architecture*, 2005) โดยตรรกะเกมอยู่ตรงกลาง ส่วน DOM และ LocalStorage เป็น adapter ที่เสียบเข้ามาทาง port

| โฟลเดอร์ | หน้าที่ | ห้าม |
|---|---|---|
| [core/](core/) | ตรรกะเกมบริสุทธิ์: domain · use-cases · state-machine · ports · events | import จาก `ui/` หรือ `data/` · เรียก `window` `document` `localStorage` หรือ Browser API ใด ๆ |
| [data/](data/) | adapter ข้อมูล: แพ็กเกจ Journey · validation · persistence · สื่อ · localization | ใส่กติกาเกม (กติกาอยู่ใน `core/`) |
| [ui/](ui/) | adapter แสดงผล: หน้าจอและชิ้นส่วนของ Journey (`journey/`) · image cache (`assets/`) · styles · audio | คำนวณกติกาเกมเอง (รับ view model ที่ไม่เปลี่ยนค่าจาก core เท่านั้น) |
| [bootstrap/](bootstrap/) | Composition Root: `index.js` (ทางเข้าของ `index.html`) → `journey-shell.js` → `journey-application.js` | มีตรรกะเกม |

**กติกาเหล็ก**

1. ทิศทาง dependency ชี้เข้าหา `core/` เสมอ
2. ไม่มี framework ไม่มี build step ไม่มี dependency ภายนอกใน runtime
3. ทุกการเปลี่ยนแปลงมี unit test ใน [tests/unit/](../tests/unit/) และอ้าง Requirement ID จาก [Sprint SSOT](../docs/sprints/sprint-05-ssot.md)
4. กติกาเกมของ Sprint 5 (ศึกแสงปะทะเงา ด่าน แคมป์ สายใย ฉากจบ) อยู่ใน [core/](core/README.md) ตาม [มหาพิมพ์เขียว §2](../docs/design-system/five-act-narrative-gameplay-master-plan.md) · kernel ของศึกผ่าน parity gate กับ engine ที่พิสูจน์แล้วทุกลำดับการกด ([clash-parity.mjs](../tools/clash/clash-parity.mjs))
5. ชั้นข้อมูลของ Journey (C3): รับแพ็กเกจและ identity ใน [data/content/journey-package.js](data/content/journey-package.js) · เซฟ journey ใน [data/validation/journey-save-validator.js](data/validation/journey-save-validator.js) และ [data/persistence/journey-save-repository.js](data/persistence/journey-save-repository.js) · ตั้งค่าและข้อความแจ้งของเครื่องใน `journey-device-records.js` · namespace เดิมอ่านอย่างเดียวผ่าน `legacy-archive.js` · ประกอบกับ Core ใน [bootstrap/journey-application.js](bootstrap/journey-application.js) ซึ่ง C5 วาง UI ไว้ด้านบน · สัญญา storage อยู่ใน [specs/README.md](../specs/README.md)
6. หน้าจอของ Journey (C4): รูปภาพจาก asset ID ใน [data/assets/journey-media.js](data/assets/journey-media.js) (ผูก identity ของแพ็กเกจ · ภาพตามทิศ · จุดตาต่อภาพ) · view model เป็นคำและภาพใน [data/content/journey-presentation.js](data/content/journey-presentation.js) (ไม่คิดกติกา) · คำของหน้าจอใน [data/localization/th-journey.js](data/localization/th-journey.js) · ชิ้นส่วนและ renderer ใน [ui/journey/](ui/journey/) ที่ import ได้เฉพาะภายในโฟลเดอร์ตัวเอง · token และวัสดุใน `ui/styles/journey-*.css` · ประกอบทั้งหมดใน [bootstrap/journey-shell.js](bootstrap/journey-shell.js) ซึ่งเป็นทางเข้าของเกมผ่าน [bootstrap/index.js](bootstrap/index.js) ตั้งแต่ C5e และใช้กับหน้าตรวจของ PO ด้วย
7. สื่อของ Journey (C5d): ภาพทุกภาพอ่านผ่าน [data/assets/journey-media-resolver.js](data/assets/journey-media-resolver.js) (same-origin · ขนาดจาก header WebP · SHA-256 ทุกไบต์เทียบ manifest) แล้ว decode ครั้งเดียวใน [ui/assets/image-cache.js](ui/assets/image-cache.js) ด้วย key ของ identity ภายในงบ 32 MiB · หน้าจอถือภาพเฉพาะที่แสดงอยู่
8. runtime ของ Sprint 2–4 (เนื้อเรื่องเดิม มาตรวัด 0–100 renderer และแผงเดิม migration) ถูกลบใน C5e ตาม[ทะเบียน assertion ที่ถูกแทนที่](../docs/traceability/sprint-05-superseded-assertions.md) · ยังอยู่ใน git ที่ `39bf56b`
