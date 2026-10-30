# Visual assets v2 — บันทึกปรับภาพจากเนื้อเรื่องล่าสุด

สถานะ: **ชุดภาพสำหรับ PO ตรวจรับ** ตามคำขอปรับภาพ v1 → v2; ไม่ใช่การอนุมัติ art production หรือเปิดใช้ภาพในเกม

## Intake และหลักฐานอำนาจ

- ฐานเนื้อเรื่อง: commit `291e077107c13a83a64037691feb0ee5ae5f25a1` และ [CR-20261029-1742](../../changelog/2026-10/2026-10-29-1742-adr032-v2-and-adr033-interactive-gameplay.md)
- ข้อกำหนด: [ADR-P0-032 v2.0 D1–D8](../../adr/ADR-P0-032-living-fantasy-canon-peuak-miracle-doll-and-vn-stage-blocking.md), [ADR-P0-033 v1.0 D3/D5](../../adr/ADR-P0-033-interactive-tactical-adventure-gameplay-and-dynamic-stage-revolution.md), [Master Bible v2.1](../new-five-act-story-and-mechanics-proposal.md), ADR-P0-025
- แผนงาน: [Sprint 5 SSOT](../../sprints/sprint-05-ssot.md), งาน asset prototype บน `feat/sprint-05-planning-ssot` ตามคำสั่ง PO
- DoR: มี canon ที่อนุมัติ, ระบุภาพเป้าหมาย/ความต่าง/ขนาด/การตรวจและ rollback ครบในเอกสารนี้กับ [job registry](visual-assets-v2-jobs.json)

## ผลกระทบและขอบเขต

แก้ภาพเดิม 35 รายการ เพิ่ม 18 ภาพ รวมเจนใหม่ 53 ภาพ และใช้ v1 ต่อ 17 ภาพที่ยังตรงกับ canon รวม catalog v2 70 รายการ การเพิ่มประกอบด้วยทิศหัน portrait หลัก 14 ภาพ, ตัวร้ายมีกระดุม Act 1–2 สองทิศ, ฉากทาง B ของ Act 2 และ CG แผน B ของ Act 4

| ประเด็น | v1 | v2 / หลักตรวจ |
|---|---|---|
| ตัวละคร 24 ภาพ | เต็มตัวหรือนั่ง เห็นขา/รองเท้า ใบหน้าเล็ก | ครึ่งตัวถึงสะโพก/ต้นขา ลำตัวชนขอบล่าง ดวงตา 52–68% จากขอบล่างเมื่อวางตาม stage height / eye anchor ใน manifest |
| มนุษย์ | ท่ายืนหรือขัดสมาธิลอย | โน้มตัว/คุกเข่า มุมครึ่งอก ไม่วาดขาที่ลอย |
| แสงและทิศหัน | rim light ส้มต่างข้าง | แสงบนกึ่งกลาง + ทิศหันคู่เจนแยก ห้าม mirror ก้ามซ้าย แผลซ้าย หรือตัวอักษร |
| เปี๊ยก–เตื๊อก | เปี๊ยกหน้าวัยเด็กบางภาพ | หนุ่มสาววัยเดียวกัน; ใช้ mid-20s เป็น art direction เพื่อสื่อวัยผู้ใหญ่ ไม่เพิ่มอายุ canon ที่ล็อกตายตัว |
| E-HOME | กบโครเชต์ | กำมะหยี่นุ่มเรียบ เจ้ากบหนึ่งตัว ร่างตุ๊กตาเฉพาะฉากจบนี้ |
| E-DAWN | กบมีชีวิตไม่มีเสื้อ + ตุ๊กตาอีกตัวรับเสื้อ | เอาตุ๊กตาออก เจ้ากบมีชีวิตสวมเสื้อฟ้า คู่รักโบกมือ |
| ห้องนอน | มีหุ่นผ้าดิบก่อนปาฏิหาริย์ | ลบออก เหลืออุปกรณ์เย็บผ้าธรรมดา ไม่มีตุ๊กตาตัวใด |
| ตัวร้าย | เครื่องประดับทองติดอกต่อเนื่อง | มีกระดุมเฉพาะ Act 1–2; ชุด Act 3–5 และ CG-04 ไม่มีของทองติดอก |
| CG-01/02/03 | อ้างเหตุการณ์ v1 | กบโตศึกฝาย / สนับขัดเฟืองก่อนฟิ้วมาสมทบ / หลักฐานกระดุมและไฟฉายคู่คำสัญญา |
| CG-04/05A | ขาดไฟฉายจากนอกรั้ว / กระดุมถือแยก | เพิ่มสัญญาณไฟฉายเตื๊อกในคืนไฟดับ / กระดุมเย็บชายเสื้อแล้ว; คงผ้าคลุมเงาอัศวินตามมติ PO |
| ไอเทม | สร้อยกก, กระดุม/นกหวีดไม่มีอักษรคู่รัก | เมล็ดต้อยติ่งเรืองแสง; กระดุมและนกหวีดสลัก `ต.♡ป.` |
| เส้นทางแยก | ยังไม่มีภาพทาง B | เพิ่มโพรงรากไทร–รางลม และ CG ป้อมปราการก้ามเหล็ก–สปริงพี่ใหญ่ |

ไม่แก้ runtime, stable content/save IDs, schema, source, balance หรือ implementation WBS ไม่สร้าง HUD/camp/micro-action mockup ก่อนมีสเปก UX ตาม ADR-033 D5 ภาพ CG แสดงแสงเชิงเรื่องเล่าและระยะสเกล; ไม่อ้างว่าเป็นการตรวจสมการ shadow runtime

## สัญญาไฟล์และพรอมป์ต์

- ใช้ built-in `image_gen.imagegen` หนึ่ง call ต่อภาพ มีภาพ v1 เป็น edit target และ 3D render/v2 portrait เป็น identity reference; ตรวจภาพอ้างอิงก่อนใช้
- พรอมป์ต์เต็มและความต่างรายภาพ: [visual-assets-v2-jobs.json](visual-assets-v2-jobs.json); บันทึกผลและ attempts ใน [provenance v2](../../../assets/provenance/visual-assets-v2.json)
- เก็บ PNG master และ WebP candidate ใต้ `versions/v2/` เท่านั้น คงไฟล์ v1, manifest v1 และ gallery v1 ไว้ byte-for-byte เพื่อเทียบย้อนหลัง
- Portrait 1024×1024 alpha จริง (มุมบนโปร่งใส; ลำตัวตัดขอบล่างตาม Tachie จึงไม่บังคับให้มุมล่างโปร่งใสเหมือนสติกเกอร์เต็มตัว), ฉาก/CG 1600×900 ทึบ, ไอเทม 512×512 alpha จริง; ใช้ `sips` resample และ `cwebp` encode ทางเทคนิคเท่านั้น ไม่วาด/แต่งภาพด้วยโค้ด
- `keepsakes/v2/` คือ namespace ไอเทมรุ่นเรื่องเดิม ส่วน `keepsakes/v2/versions/v2/` คือรอบภาพใหม่นี้
- ทะเบียน art v2 ใช้ `item_kib_glowing_seeds` และ `item_teuk_peuak_button` ตาม ADR-032 D6 พร้อม `previousAssetId` ชี้กลับ ไม่ reuse ความหมาย ID เดิม และไม่ migrate runtime IDs
- ข้อยกเว้น zero-text: อนุญาตเฉพาะรอยสลักวัตถุจริง `ต.♡ป.` ที่ ADR-032 กำหนด ห้าม UI/คำบรรยาย/ลายน้ำในภาพ

## เกณฑ์ตรวจรับและ rollback

ตรวจ subject/canon/ท่าทาง/วัสดุ/แสง/มือว่าง/ไม่มีแมลงจริงด้วยสายตา ตรวจไฟล์จริงว่าขนาด format alpha checksum และ provenance ตรงกัน ตรวจบนหน้า before/after และเวทีจำลองที่มีพื้นที่ข้อความ 28% รัน unit regression เดิมเพื่อยืนยันไม่กระทบ baseline โดยไม่เพิ่ม tests ที่ตรวจซ้ำ implementation ของเครื่องมือแพ็กภาพ

การตรวจภาพต้นแบบไม่ทดแทน PO art acceptance, อุปกรณ์มือถือจริง, performance budget หรือ animation/physics integration การ rollback คือกลับไปใช้ manifest v1 หรือลบชุดเพิ่ม v2 ผ่าน reviewed revert โดยไม่มี save migration

## ผลส่งมอบและหลักฐาน

- [หน้าเปรียบเทียบ 70 รายการและเวทีตัวอย่าง](../evidence/visual-assets-v2-review.html), [manifest v2](../../../assets/images/asset-manifest-v2.json)
- [ตัวตรวจไฟล์](../evidence/verify-visual-assets-v2.py) และ [ผลตรวจ 106 ไฟล์ใหม่ / 107 ไฟล์ v1 เดิม](../evidence/visual-assets-v2-verification.json)
- [Browser smoke evidence](../evidence/visual-assets-v2-browser-review.json), [unit regression 1,060/1,060](../evidence/visual-assets-v2-unit-summary.txt)
- [CR-20261030-0149](../../changelog/2026-10/2026-10-30-0149-adr032-visual-assets-v2.md): รายละเอียดขอบเขต ผลตรวจ ข้อจำกัด และ rollback
