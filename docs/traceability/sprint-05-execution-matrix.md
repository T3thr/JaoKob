# Sprint 5 Execution Traceability Matrix

Version **0.3.7**, 2026-11-09 (Asia/Bangkok) · 0.3.0 วันที่ 2026-10-31 · 0.3.1 เพิ่ม §6 runner ที่ส่งแล้ว · 0.3.2 runner ของ C3 (เซฟ identity คลังเซฟเก่า) · 0.3.3 runner ของ C4 (หน้าจอ Journey และหลักฐานเบราว์เซอร์) · 0.3.4 หน้าจอศึก C5a · 0.3.5 แคมป์ สัมผัส และรับของ C5b · 0.3.6 ตั้งค่า กระเป๋า หน้าแรก และฉากจบ C5c · 0.3.7 resolver ของสื่อที่ตรวจ SHA-256 และงบภาพ C5d (ปิด T3). Authority: มติ PO 2026-10-31 · [ADR-P0-032 v2.0](../adr/ADR-P0-032-living-fantasy-canon-peuak-miracle-doll-and-vn-stage-blocking.md) · [ADR-P0-033](../adr/ADR-P0-033-interactive-tactical-adventure-gameplay-and-dynamic-stage-revolution.md) · [ADR-P0-034](../adr/ADR-P0-034-five-act-journey-runtime-save2-journey-profile-and-blueprint-compiled-content.md) (ลงนามครบ 2026-11-04) · [Sprint 5 SSOT 0.3.0](../sprints/sprint-05-ssot.md) ซึ่งเป็นเจ้าของ WBS DoR และ DoD · ฉบับ 0.2.0 ยุค ADR-P0-022 อยู่ใน git ที่ `8643a30`

ทุกแถวมีสถานะ **วางแผนแล้ว รอหลักฐาน** จนกว่าหลักฐานที่ระบุจะมีอยู่บน build จริง · รหัสเทสต์ที่ยังไม่มี runner เป็นการตรวจที่วางแผนไว้ ไม่ใช่การตรวจที่ผ่านแล้ว · S1–S4 คือ execution PR สี่ตัว เลข PR จริงลงเมื่อเปิด

## 1. ข้อตัดสินใจ → งาน → หลักฐาน

### 1.1 ADR-P0-032 v2.0 · canon

| ข้อตัดสินใจ | งาน | หลักฐาน |
|---|---|---|
| D1 เจ้ากบมีชีวิตตัวเดียว · ไม่มีตุ๊กตาตัวที่สอง · กำมะหยี่เฉพาะ E-HOME | T6 · T8 · T10 · T12 · T14 | `TC-S5-LORE-001` · `TC-S5-GIFT-ART-001` |
| D2 เตื๊อกกับเปี๊ยก · `ต.♡ป.` ความหมายเดียว · บทของเตื๊อกใน Act 3–5 | T6–T12 | `TC-S5-LORE-001` · `TC-S5-THAI-001` |
| D3 ทะเบียนตัวละคร ไม่มีตัวละครสมมติเพิ่ม | T6–T12 | `TC-S5-LORE-001` |
| D4 ทางแยกจริง Act 2 สาย A/B · Act 4 แผน A/B | T6 · T10 | `TC-S5-CONVERGENCE-001` · `TC-S5-BALANCE-001` |
| D5 ทักษะสามชื่อ · สี่สายใยและคำเรียก · โหยหาบ้าน · ฉากจบสมมาตร | T2 · T6–T12 | `TC-S5-STATE-001` · `TC-S5-ENDING-001` · `TC-S5-THAI-001` |
| D6 กระเป๋าสี่ช่อง · ของหกชิ้น · ท่าผสาน · ไม่มีระบบฝากสหาย | T2 · T6–T12 | `TC-S5-STATE-001` · `TC-S5-CALLBACK-001` |
| D7 มาตรฐาน Tachie · ระดับตา · สองสเกล · แสงกึ่งกลาง | T4 · T7 · T9 · T11 | `TC-S5-VN-001` · `TC-S5-SCALE-001` |
| D8 ความต่อเนื่องของภาพ (ผ้าคลุมหลังท่าปิดศึก · แมลงสาบแมนไร้กระดุมหลัง Act 2 · กำมะหยี่ไม่ใช่โครเชต์) | T7 · T9 · T11 · T13 · T14 | `TC-S5-CINEMATIC-001` · `TC-S5-LORE-001` |

### 1.2 ADR-P0-033 · เกมเพลย์ คณิตศาสตร์ ฟิสิกส์ UX

| ข้อตัดสินใจ | งาน | หลักฐาน |
|---|---|---|
| D0 ห้ามลากลำแสงหาของ · ห้ามแผนที่และหมุด | T4 · T5 · งานเนื้อหาทุกงาน | `TC-S5-UX-001` · `TC-S5-REQ-001` |
| D1 ศึกแสงปะทะเงา | T2 · T5 · T8 · T10 · T12 | `TC-S5-CLASH-001` · `TC-S5-TRAY-001` · `TC-S5-STATE-001` |
| D2 พลังงานตามทางเลือกและแคมป์ | T2 · T5 | `TC-S5-STATE-001` · `TC-S5-UX-001` |
| D3 เวทีมีชีวิตและเงาตามฟิสิกส์ | T5 · T7 · T9 · T11 | `TC-S5-STAGE-001` · `TC-S5-A11Y-001` |
| D4 สัมผัสโต้ตอบสั้น | T2 · T5 | `TC-S5-UX-001` · `TC-S5-A11Y-001` |
| D5 คณิตศาสตร์ ฟิสิกส์ และ UX ที่พิสูจน์ได้ | T2 · T4 · T5 · T7 | `TC-S5-BALANCE-001` · `TC-S5-SCALE-001` · `TC-S5-VN-001` |

### 1.3 ADR-P0-034 · สถาปัตยกรรม (ลงนามครบ 2026-11-04)

| ข้อตัดสินใจ | งาน | หลักฐาน |
|---|---|---|
| D1 Journey runtime และการปลด runtime เดิม | T2 · T5 | `TC-S5-REQ-001` · `TC-S5-PACKAGE-001` |
| D2 kernel และ shell · Core ไม่มีการสุ่มและนาฬิกา | T2 | `TC-S5-STATE-001` · `TC-S5-PACKAGE-001` |
| D3 สถานะการเดินทางแยกจากการเผชิญหน้า | T2 · T3 | `TC-S5-STATE-001` · `TC-S5-SAVE-001` |
| D4 คำศัพท์ effect และ condition แบบปิด | T1 · T2 | `TC-S5-SCHEMA-001` · `TC-S5-CONTENT-001` |
| D5 กติกาศึกแหล่งเดียวและ parity gate | T2 | `TC-S5-CLASH-001` · `TC-S5-BALANCE-001` |
| D6 เนื้อหาคอมไพล์จากพิมพ์เขียว | T1 · T5 · T6–T12 | `TC-S5-CONTENT-001` |
| D7 Save 2 journey profile · snapshot ห้าองก์ | T1 · T3 · T13 | `TC-S5-SCHEMA-001` · `TC-S5-SAVE-001` · `TC-S5-SAVE-002` · `TC-S5-REPLAY-001` |
| D8 namespace เดิมเป็นคลังเซฟเก่าแบบอ่านอย่างเดียว | T3 · T19 | `TC-S5-LEGACY-001` |
| D9 play-mode และ view model | T2 · T5 | `TC-S5-STATE-001` · `TC-S5-PRESENTATION-001` · `TC-S5-TRAY-001` |
| D10 Interactive Web Prototype · วัสดุกระจกฝ้า · กำแพงกันสปอยล์ | T4 · T5 | `TC-S5-PROTO-001` · `TC-S5-VN-001` · `TC-S5-HUD-001` · `TC-S5-A11Y-001` |

### 1.4 ADR ที่คงไว้และมติ PO

| แหล่ง | งาน | หลักฐาน |
|---|---|---|
| ADR-P0-022 D2 ระบบออกแบบใหม่ · D3 แยก HUD กับเครื่องมือ · บันทึกเงียบ · D5 ยืนยันแบบ inline · D6 สี่ slices · Save Format 2 | T4 · T5 · T3 · ทุก PR | `TC-S5-VN-001` · `TC-S5-HUD-001` · `TC-S5-SILENT-001` · `TC-S5-INLINE-001` · `TC-S5-REQ-001` |
| ADR-P0-019 เป้ากด ≥ 44 · ไม่มีตัวเลขในกล่องบทพูด · ไม่มีแถบเลื่อนซ้อน | T4 · T5 | `TC-S5-VN-001` · `TC-S5-HUD-001` |
| ADR-P0-020 กลไกกระเป๋า | T2 · T3 | `TC-S5-STATE-001` · `TC-S5-CALLBACK-001` |
| ADR-P0-025 ท่ามาตรฐานและ emote หัวใจ | T7 · T14 · T16 | `TC-S5-LORE-001` · `TC-S5-GIFT-ART-001` |
| ADR-P0-016 viewer ที่เปิดเมื่อเลือก | T16 · T17 | `TC-S5-GIFT-001` |
| ADR-P0-014 Resume ที่ idempotent และความยินยอม | T3 | `TC-S5-SAVE-001` |
| ADR-P0-013 validator ของโครงการ | T1 | `TC-S5-SCHEMA-001` |
| มติ PO Q1 ขอบเขตเต็ม · Q2 เก้าข้อ | ทุกงาน · T2 · T6–T12 | `TC-S5-REQ-001` · `TC-S5-ENDING-001` · `TC-S5-STATE-001` |
| มติ PO Q3 เลิกเล่นต่อเซฟเก่า · Q5 snapshot ห้าองก์ | T3 · T13 | `TC-S5-LEGACY-001` · `TC-S5-REPLAY-001` |
| มติ PO ต้นแบบเว็บที่เล่นได้จริง | T4 · T5 | `TC-S5-PROTO-001` |
| มติ PO R5 ยึดตารางฟิสิกส์ | T5 · T12 · T13 | `TC-S5-STAGE-001` · `TC-S5-SCALE-001` |

## 2. ข้อค้นพบวิกฤตที่ยังต้องปิด (จากฉบับ 0.2.0)

ป้าย `R22-*` เป็นป้ายของการวิจารณ์ครั้งนั้น ไม่ใช่ Requirement ID ใหม่ · ปิดได้เมื่อ build ที่แก้แล้วผ่านหลักฐานที่ระบุเท่านั้น

| ข้อค้นพบ | สถานะของความหมาย | งาน | หลักฐาน |
|---|---|---|---|
| R22-01 ดีไซน์ ระยะ ไอคอน และ affordance ไม่เป็นระบบ | ยังมีผล | T4 · T5 | `TC-S5-VN-001` · `TC-S5-PRESENTATION-001` · `TC-S5-A11Y-001` |
| R22-02 ภาษาไทยไม่เป็นธรรมชาติ | ยังมีผล | T6–T13 · T18 | `TC-S5-THAI-001` · `TC-S5-CLOSURE-001` |
| R22-03 HUD อัดและกดยาก | ยังมีผล | T4 · T5 · T17 · T18 | `TC-S5-HUD-001` · `TC-S5-DEVICE-001` |
| R22-04 ตัวตนและสเกลไม่สอดคล้อง | ความหมายเปลี่ยนตาม ADR-P0-032 v2.0 (กบมีชีวิต 45 ซม. ไม่ใช่ตุ๊กตาตั้งแต่เกิด) | T6–T15 | `TC-S5-LORE-001` · `TC-S5-SCALE-001` · `TC-S5-GIFT-ART-001` |
| R22-05 ตัวเลือกมีแถบเลื่อนซ้อนและแผงอึดอัด | ยังมีผล | T4 · T5 · T18 | `TC-S5-VN-001` · `TC-S5-UX-001` · `TC-S5-A11Y-001` |
| R22-06 จุดบันทึกกะพริบทุกครั้ง | ยังมีผล | T3 · T4 | `TC-S5-SILENT-001` · `TC-S5-SAVE-001` |
| R22-07 ภาพแข็งและไม่มีจังหวะภาพยนตร์ | ยังมีผล และรวมเวทีมีชีวิตของ ADR-P0-033 D3 | T5 · T7 · T9 · T11 · T13 | `TC-S5-CINEMATIC-001` · `TC-S5-STAGE-001` · `TC-S5-MEDIA-001` |
| R22-08 popup ยืนยันทางเลือกทำลายอารมณ์ | ยังมีผล | T4 · T5 | `TC-S5-INLINE-001` |

## 3. งบคุณภาพ (กุญแจย้อนรอยเดิมที่ยังใช้)

นิยามเดิมของรหัสเหล่านี้อยู่ใน Tier 4 แล้ว เกณฑ์ที่วัดได้เขียนไว้ใน [SSOT §6](../sprints/sprint-05-ssot.md)

| กุญแจ | ความหมายที่ใช้ใน Sprint 5 | งาน | หลักฐาน |
|---|---|---|---|
| NFR-PE-001..005 | ขนาด เวลาโหลด และเวลาตอบสนอง | ทุกงานที่กระทบ · T17 · T18 | `TC-S5-PERF-001` |
| NFR-RL-001..005 | เซฟไม่หาย กู้คืนได้ สื่อเสียแล้วยังเล่นได้ | T3 · T7 · T17 | `TC-S5-SAVE-002` · `TC-S5-MEDIA-001` |
| NFR-SE-001..006 · NFR-PO-002 | artifact แบบ static ไม่มี secret telemetry หรือ CDN · ทำงานทั้ง root และ subpath | T19 | `TC-S5-RELEASE-001` |
| NFR-US-005/006 | ความสบายตาและการกดบนอุปกรณ์จริง | T5 · T17 · T18 | `TC-S5-UX-001` · `TC-S5-DEVICE-001` · `TC-S5-ACCEPT-001` |

## 4. การจัดสรรงานและสิ่งที่ปลดระวาง

| งาน | Slice | ขอบเขตใน 0.3.0 |
|---|---|---|
| T0–T5 | S1 | rebaseline · schema 3.0.0 และ compiler · engine ห้าองก์ · Save 2 journey profile · ระบบออกแบบใหม่ · ห้าโหมด · Act 1 ต้นแบบ · ปลด runtime เดิม |
| T6–T7 | S2 | รับรอง Act 1 · Act 2 สองสาย · สื่อ Act 1–2 และเวทีเงาสด R2 |
| T8–T13 | S3 | Act 3–5 · สามฉากจบ · เล่นซ้ำห้าองก์ · checkpoint รายองก์ใน PR เดียว |
| T14–T19 | S4 | ตุ๊กตากำมะหยี่ 3D · viewer · อุปกรณ์จริง · ตรวจรับรวม · release candidate |

ปลดระวางแล้ว: Save 3 · ลำดับสิบ PR · สะพานเชื่อมเรื่องเดิมสู่เรื่องใหม่ · การเล่นต่อเซฟเก่า · ตุ๊กตามีชีวิตตั้งแต่เกิด · resolver Bond 0–100 · crisis และ Game Over · จุดบรรจบ A3-003 · เอกสารและรายงานเดิมยังเป็นหลักฐานทางประวัติ ไม่ใช่ข้อกำหนดทางเลือก

## 5. กติกาการบันทึกหลักฐาน

ทุก execution PR บันทึก: ข้อตัดสินใจหรือข้อค้นพบ → ไฟล์หรือฉากที่เปลี่ยน → รหัสการตรวจ → คำสั่งหรือขั้นตอนของมนุษย์ที่ใช้จริง → build แพ็กเกจ และ profile → ผล → ลิงก์หลักฐาน → การตัดสินของผู้ตรวจ

ก่อนลบหรือเปลี่ยนเทสต์เดิม ให้ลงทะเบียนใน [ทะเบียน assertion ที่ถูกแทนที่](sprint-05-superseded-assertions.md) โดยระบุ authority และเทสต์ทดแทนทุกข้อ · invariant ของโดเมน เซฟ และโครงสร้างพื้นฐานที่ยังถูกต้องต้องมีเทสต์ต่อ · ห้ามบังคับให้คงพฤติกรรมที่ถูกปฏิเสธแล้วเพียงเพื่อให้จำนวนเทสต์เท่าเดิม

หลักฐานจากมนุษย์ระบุบทบาท วันที่ build ฉากหรือจังหวะ viewport อุปกรณ์และการตั้งค่า สิ่งที่เห็น ความรุนแรง ภาพอ้างอิงถ้ามี การแก้ และการรับรอง · ห้ามสร้างผู้ตรวจขึ้นเอง แนบภาพผิด หรือปิดข้อค้นพบวิกฤตโดยไม่มี build ที่แก้และทดสอบแล้ว

## 6. Runner ที่ส่งแล้ว

รหัสที่มี runner แล้วยังเป็น "วางแผนแล้ว รอหลักฐาน" ในส่วนที่ต้องใช้ build จริง อุปกรณ์ หรือคน · ตารางนี้บอกเฉพาะส่วนที่ตรวจด้วยเครื่องได้แล้ว

| รหัส | runner | ครอบคลุมแล้ว | บันทึก |
|---|---|---|---|
| `TC-S5-SCHEMA-001` | `tests/unit/journey-schema.test.js` · `tests/schema/journey-reference.mjs` | schema 3.0.0 บวกและลบ · เทียบ Ajv · catalog ตรงต้นทาง | CR-20261102-1015 |
| `TC-S5-CONTENT-001` | `tests/unit/journey-content.test.js` | drift gate · ใบเสร็จทุกบรรทัด · compiler ล้มเมื่อเจอสิ่งที่ไม่รู้จัก · ภาพสำรองแบบ alias | CR-20261102-1025 · CR-20261104-0340 |
| `TC-S5-PACKAGE-001` | `tests/unit/architecture.test.js` · `journey-package.test.js` · `journey-application.test.js` · `image-cache.test.js` · `journey-media-resolver.test.js` | Core ไม่ import tools · ไม่อ่านนาฬิกา · `story.jaokob.core` สงวนไว้ให้ host · สองแพ็กเกจ 0.1.0 ไม่ชนกันทั้ง identity digest slot ของเซฟ และแคชภาพ · build อื่นของเวอร์ชันเดียวกันมี digest ต่าง · การอ้างอิงผิด ID ซ้ำ และ capability ที่ไม่รองรับถูกปฏิเสธ | CR-20261102-1015 · CR-20261104-0620 · CR-20261109-0430 (resolver อ่านเฉพาะภาพของ identity ตัวเอง) |
| `TC-S5-ASSET-001` | `tests/unit/journey-media-resolver.test.js` · `journey-media-screens.test.js` · `image-cache.test.js` · `tests/e2e/journey-c5d-media.mjs` | SHA-256 ระดับไบต์ตามตัวอย่าง FIPS 180-4 · ภาพทั้ง 70 ไฟล์ของ manifest v2 ตรงความยาว แฮช และขนาดจาก header · อ่าน same-origin ไม่มี credential ไม่ตาม redirect · ไฟล์เสีย สลับ ย่อขยาย ตัด หรือยาวเกินถูกปฏิเสธก่อน decode · หน้าจอถือเฉพาะภาพที่แสดงอยู่ · เล่นครบ Act 1 และแพ็กเกจจิ๋วบนไบต์จริงในงบ 32 MiB (ถือสูงสุด 21.5 MiB) ไม่มีภาพถูกปฏิเสธ แม้ไม่มี Web Crypto · ภาพเสียไม่ถูกวาดและเรื่องเดินต่อ | CR-20261109-0430 (provenance และ alt ของภาพใหม่ใน T7 · T15) |
| `TC-S5-CLASH-001` | `tests/unit/journey-clash.test.js` · `tools/clash/clash-parity.mjs` | parity ทุกลำดับการกดจาก 18 จุดเข้าศึก · error code ของ shell · ผลลัพธ์ freeze · เซฟของศึกผ่าน schema | CR-20261104-0400 |
| `TC-S5-TRAY-001` | `tests/unit/journey-clash.test.js` · `journey-clash-tray.test.js` · `journey-presentation.test.js` | ความจุสี่กลุ่มทุกตำแหน่งที่เกิดได้และทุกชุดของในกระเป๋า · ป้ายแก้ทางและซ้ำของจอ v3 | CR-20261104-0400 (กติกาแท็บและคีย์บอร์ดรอ T5) · หน้าจอศึก C5a: แถวท่าหลัก แท็บ ARIA พร้อม roving focus เครื่องหมายบนแท็บ ไม่สลับแท็บแทนผู้เล่น คอลัมน์บนจอกว้าง · ป้าย `แก้ทาง` ตามตั้งค่า (CR-20261108-0700) |
| `TC-S5-STATE-001` | `tests/unit/journey-rules.test.js` · `journey-encounters.test.js` · `journey-session.test.js` | ค่าสถานะ Soft Floor ฝืนเอา Grace Rest Floor โหยหาบ้าน ระดับคำเรียก · ด่าน แคมป์ รับของ สัมผัส · คำสั่งแบบ atomic ผูก revision · play-mode · Act 1 ต้นแบบเล่นได้ครบ · coverage ของ Core ใหม่ | CR-20261104-0400 · CR-20261104-0420 |
| `TC-S5-ENDING-001` | `tests/unit/journey-encounters.test.js` · `journey-session.test.js` · `five-act-balance-model.mjs` | ตารางความจริงเทียบสมการของมหาพิมพ์เขียว §2.13 · Safety Fallback · ประโยคล็อก · journey เท่านั้นที่ตัดสิน · การเล่นจำลอง 14 แบบรันบน Core | CR-20261104-0420 · CR-20261104-0440 |
| `TC-S5-BALANCE-001` | `docs/design-system/evidence/five-act-balance-model.mjs` (design gate) · `journey-content.test.js` | กติกาทุกข้อจาก Core · Act 1 จากแพ็กเกจที่คอมไพล์ · ผ่านทุกข้อพิสูจน์ · ไม่มีกติกาซ้ำใน evidence (`journey-clash.test.js`) | CR-20261104-0440 (Act 2–5 จากแพ็กเกจใน S2–S3) |
| `TC-S5-REPLAY-001` | `tests/unit/journey-session.test.js` · `journey-application.test.js` | snapshot ห้าองก์บนแพ็กเกจจิ๋ว · เล่นซ้ำแล้ว `completion` ไม่ถูกย้อน · การเล่นซ้ำถูกบันทึก (`replay-started`) ด้วยตั้งค่าปัจจุบัน และอยู่รอดหลังโหลดใหม่ · ฉากจบที่เห็นแล้วไม่หายหลังโหลดใหม่ | CR-20261104-0420 · CR-20261104-0620 (ห้าองก์จริงใน S3) |
| `TC-S5-SAVE-001` | `tests/unit/journey-save.test.js` · `journey-application.test.js` | ระเบียนทุกแบบตกชั้นเดียวของตาราง §3.2 · บันทึกเงียบทุกคำสั่งที่ commit รวมเทิร์นศึกและกิจกรรมแคมป์ · โหลดใหม่กลางศึกได้จังหวะเดิม (ระดับแอปแบบไม่มีหน้าจอ) · Resume ไม่เขียน · ความยินยอมผูกกับหน้าชื่อเรื่องที่เห็น · เซฟ unknown future และเสียตามตาราง | CR-20261104-0620 (โหลดใหม่ในเบราว์เซอร์จริงใน E2E ของ T5) |
| `TC-S5-SAVE-002` | `tests/unit/journey-save.test.js` · `journey-application.test.js` · `journey-package.test.js` | transaction stage–backup–promote–clean · race · quota · เขียนหาย · อ่านไม่ได้ · ไม่มี storage · เขียนซ้ำที่ revision เดิมเฉพาะ metadata · ≤ 250 KB หลังปิดผนึก · integrity และ SHA-256 · เวลาเล่นหยุดเมื่อซ่อนหน้า · ตั้งค่าของเครื่อง | CR-20261104-0620 (อุปกรณ์จริงใน S4) |
| `TC-S5-LEGACY-001` | `tests/unit/journey-application.test.js` · `journey-legacy-rehearsal.test.js` · `journey-save.test.js` · `architecture.test.js` | key เดิมทั้งห้าเหมือนเดิมทุกไบต์และไม่ถูกเขียนหลังเล่นครบ · แจ้งครั้งเดียว · ซ้อมย้อนกลับกับแอป Sprint 4 ตัวจริง · โค้ด Journey เขียน key นอก `jaokob:journey:` ไม่ได้ | CR-20261104-0620 (ซ้อมกับ static build ใน T19) |
| `TC-S5-VN-001` | `tests/unit/journey-media.test.js` · `journey-presentation.test.js` · `journey-renderer.test.js` · `tests/e2e/journey-c4-design-system.mjs` | ภาพจาก manifest ผูก identity · ตารางจุดตา · คำของแพ็กเกจทุกจังหวะของ Act 1 ไม่มีตัวเลข · ตาอยู่ในแถบใบหน้าและ dock อยู่ใต้แถบใน 6 viewport × 3 ขนาดตัวอักษร · flow คอลัมน์เดียวเมื่อไม่พอดี · ไม่มีเลื่อนแนวนอนหรือซ้อน · layout shift ≤ 0.0001 | CR-20261105-1530 · CR-20261108-0630 |
| `TC-S5-HUD-001` | `journey-presentation.test.js` · `journey-renderer.test.js` · `tests/e2e/journey-c4-design-system.mjs` | แคปซูลเม็ด ปม ช่องสาน คำนับเป็นคำ · ปุ่มตั้งค่าแยกมุมขวาบน · เป้ากด ≥ 44 · คอนทราสต์ป้าย HUD บนพิกเซลจริง ≥ 4.5 แม้บนฉากขาว · toast ช่องคงที่ | CR-20261105-1530 · CR-20261108-0630 |
| `TC-S5-SILENT-001` | `journey-shell.test.js` · `journey-renderer.test.js` · `tests/e2e/journey-c4-design-system.mjs` | ทุกคำสั่งบันทึกจริงโดยไม่มีสัญญาณ · ซ่อนหน้าแล้วบันทึก · ล้มแล้วแจ้งครั้งเดียวและเล่นในหน่วยความจำ · ในเบราว์เซอร์จริงไม่มีข้อความและ live region ไม่พูดถึงการบันทึก | CR-20261105-1530 · CR-20261108-0630 |
| `TC-S5-A11Y-001` | `journey-renderer.test.js` · `journey-panels.test.js` · `architecture.test.js` · `tests/e2e/journey-c4-design-system.mjs` · `journey-c5c-panels.mjs` | Safe DOM · ประกาศครั้งเดียวต่อ revision · โฟกัส · คีย์บอร์ดล้วนเล่นถึงทางเลือก · ตัวอักษร 200% · ลดการเคลื่อนไหว ลดความโปร่งใส คอนทราสต์สูง forced colors · บทพูดและการ์ด ≥ 7 : 1 · modal แบบ native: Tab อยู่ในกรอบ Escape คืนโฟกัส เกมรอ · I Enter และการ์ดจบบทด้วยคีย์บอร์ดล้วน · ยังไม่ได้ฟังด้วย VoiceOver หรือ NVDA (S4) | CR-20261105-1530 · CR-20261108-0630 · CR-20261108-1930 |
| `TC-S5-INLINE-001` | `tests/unit/journey-renderer.test.js` · `journey-encounter-screens.test.js` | ทางเลือกเรื่อง การ์ดศึก กิจกรรมแคมป์ ช่องเตรียมของ และตัวเลือกรับของ arm ก่อนแล้ว commit ด้วย revision ที่เห็น · Escape ยกเลิก · ปิดการยืนยันสองจังหวะแล้วกดครั้งเดียว · ไม่มี modal · ยังขาดกันกดรัวในเบราว์เซอร์จริง (C5f) | CR-20261105-1530 · CR-20261108-0700 · CR-20261108-1900 |
| `TC-S5-UX-001` | `tests/unit/journey-encounter-screens.test.js` · `journey-presentation.test.js` · `tests/e2e/journey-c5b-encounters.mjs` | แคมป์: นาฬิกาเป็นภาชนะ การ์ดทุกใบบอกผล ราคา และของที่สละก่อนกด เหตุผลของการ์ดที่ปิด แถบเลือกของ และออกเดินทางเมื่อหยดหมด · สัมผัสสี่แบบด้วยสัมผัส เมาส์ Space และคลิกช่วยเหลือ ไม่มีการตกรอบ อัตโนมัติใน 1 วินาที · รับของแสดงเฉพาะตัวเลือกที่เข้ากับกระเป๋า กระดุมฝากไม่ได้ ช่องที่จะฝากยกขึ้น · เบราว์เซอร์จริง 5 viewport × ตัวอักษร 100/200% ไม่มีเลื่อนแนวนอนหรือซ้อน เป้ากด ≥ 44 layout shift 0 · ยังไม่ได้ตรวจบนเครื่องจริงและโดย PO | CR-20261108-1900 · CR-20261108-1930 (ตั้งค่า กระเป๋า หน้าแรก การ์ดฉากจบสามเกลียว การ์ดจบบท · `journey-panels.test.js` · `tests/e2e/journey-c5c-panels.mjs` 50 สถานะ) |
