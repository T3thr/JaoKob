# Change Record: Atomic Gameplay Mockups v3 · 13 หน้าจอ

- **Record ID:** CR-20261031-1326
- **Timestamp:** 2026-10-31T13:26:48+07:00
- **Sprint:** Sprint 5 · พิมพ์เขียวก่อนเริ่ม Implementation 2026-11-01
- **Baseline:** `develop@e1705ad`
- **Owner / Git identity:** `T3thr <t.theerapat33@gmail.com>`
- **Status:** ส่งมอบต้นแบบครบ · PO ตรวจรับภาพและการนำเข้าเกมจริงยังเป็นขั้นถัดไป
- **Authority:** Mission Briefing ของ PO อนุญาตสร้างภาพ 13 จอ บันทึกส่งมอบ และ commit/push ไปยัง `develop` โดยตรง

## 1. Outcome and scope

ส่งมอบ [หน้ารีวิว v3](../../design-system/evidence/ux-mockups-v3-review.html) พร้อม PNG/WebP ใส่กรอบเครื่องครบ 13 คู่, viewport PNG ที่ DPR 2, Harness แบบ Native Chrome + Pillow, พิกัดคอมโพเนนต์จริง และ [manifest ที่ตรวจ hash ได้](../../design-system/ux-mockups/v3/ux-mockups-v3-manifest.json) ใช้เปิดตรวจและขึ้นโครง HTML/CSS ใน Sprint 5 ได้

แก้ R5 ให้ใช้สถานะที่ engine สร้างได้ เงาตามสูตร ไม่มีผ้าคลุมก่อน finisher; เพิ่มเปี๊ยกหลับใต้ผ้าห่มในฉากจบ; ปิดไฟหน้าต่างเมืองใน Act 3; ถาดศึกรองรับ 16 ใบผ่านท่าหลักและสามแท็บ; ตัวเลือกเรื่องครบห้าข้อ แคมป์ครบแปดกิจกรรม และฉากจบแยกเกลียวตามเงื่อนไขจริงรวม Safety Fallback

ไม่เปลี่ยน `src/`, assets ต้นฉบับ, schema, ADR, ข้อกำหนด WBS หรือ v1/v2; ไม่ปิดงาน Implementation ใด (ยัง 0/20) Section 7 ของ SSOT เพิ่มเฉพาะทะเบียนส่งมอบตามคำสั่ง PO ไม่มี migration หรือ deployment

## 2. Requirement trace and pre-flight findings

| Authority | Artifact / verification |
|---|---|
| ADR-P0-032 D7; physics §8.7 | เวที ราวศาลา เปี๊ยกใต้ผ้าห่ม พร็อพหลังส่งมอบ และ [บันทึกตรวจภาพ](../../design-system/ux-mockups/v3/evidence/visual-review.json) |
| ADR-P0-033 D0–D5; UX §8.2–8.4 | 13 สถานะตามตาราง, engine fixtures, ป้ายแก้ทาง/ซ้ำ และ [หลักฐานสถานะ](../../design-system/ux-mockups/v3/evidence/screen-states.json) |
| ADR-P0-019; Atomic 05 | HUD ร่วม, Sarabun, กระดาษสา/ดอกบัว, geometry และ [HUD pixel audit](../../design-system/ux-mockups/v3/evidence/hud-pixel-audit.json) |
| ADR-P0-023; CR-20261031-0420 | อ้าง canonical sources โดยตรง ไม่มีไฟล์ซ้ำและไม่มีการแก้ไฟล์ที่คุ้มครอง |
| Sprint 5 T0/T4 | ส่งมอบ design input เท่านั้น ไม่ถือเป็น production acceptance |

อ่าน session `01a189db-a6e0-70a1-821b-b9e0bdc243d5`, UX critical audit และตาราง 13 จอ, ฟิสิกส์ §8.7 และสาร `[S5-001]` ก่อนสร้างภาพ บทเรียน v1 คือ UI ที่สร้างแยกภาพหลุดรูปทรงและตัวอักษร พร้อมหลักฐาน `usage_limit_exceeded`; ไม่สรุปว่าเป็น image-service rate limit โดยไม่มีหลักฐาน v2 แก้ความสม่ำเสมอด้วย shared HTML/CSS และ Sarabun จึงนำ transport, styles และ device frames เดิมมาใช้ตรงตำแหน่งเดิม

**มติ PO เรื่อง R5 แสง 6:** ยึดสูตรและระยะในตารางตามคำตอบ “ยึดสูตรและระยะในตาราง” เจ้ากบห่างโคม 0.53 ม. แมลงสาบแมน 0.44 ม. เงากบสูง 2.0377 ม. เทียบเงามืด 1.6364 ม. เพราะตัวกบสูง 45 ซม. เทียบผ้าคลุม 30 ซม. คำบรรยายจอ 4 ที่บอกว่าเจ้ากบใกล้กว่ายังคงอยู่ในสเปกเดิม และบันทึกข้อคลาดเคลื่อนไว้โดยไม่แก้สเปกนอกขอบเขต

## 3. Changed artifacts

- [v3 package และคำสั่งทำซ้ำ](../../design-system/ux-mockups/v3/README.md): ภาพ 13 คู่, viewport 13 ภาพ, ภาพฉาก/ตัวละครแก้ไขใหม่ 9 ไฟล์, scripts, fixtures และหลักฐาน โดยไม่มีโฟลเดอร์คัดลอก canonical images
- [หน้ารีวิว](../../design-system/evidence/ux-mockups-v3-review.html): เปรียบเทียบ v2/v3, สลับกรอบเครื่อง, แสดงแถบใบหน้าและพิกัด UI, เปิดภาพและ Harness
- [CHANGELOG](../../../CHANGELOG.md), [SSOT §7](../../sprints/sprint-05-ssot.md#7-audit-readiness-and-remaining-gates), [Board S5-003](../../dialogue/sprint-05/BOARD.md): ลงทะเบียนและส่งไม้ต่อ

Harness ใช้ข้อความจากบท/สเปก 103 receipts และ state จาก engine เดิม ไม่สร้างกติกาใหม่ แถวท่าหลักแสดงสามหรือสี่ท่าตามสิทธิ์ของเทิร์น การ์ดแคมป์มือถือสูง 72 px; ปุ่มเดินทางสูง 44 px; การ์ดฉากจบสูง 120 px สอดคล้องขั้นต่ำในสเปก แทนระยะ shorthand ที่สั้นกว่าในตารางผัง

## 4. Verification performed

| Gate | Actual result |
|---|---|
| `node --test 'tests/unit/**/*.test.js'` | 1,060/1,060 ผ่าน · fail/skip/cancel 0 |
| `node tests/docs/check-doc-links.mjs` | 2,345 ลิงก์ผ่านทั้งหมด ไม่มีลิงก์เสีย · [command evidence](../../design-system/ux-mockups/v3/evidence/verification-commands.json) หลัง stage ไฟล์ใหม่ครบ |
| `ux-v3-screen-states-check.mjs` | 5/5 ผ่าน |
| `physics-scale-optics-check.mjs` | 52/52 ผ่าน |
| `tactical-clash-simulator.mjs` | 12/12 ผ่าน |
| Native Chrome capture | 13/13 ไม่มีภาพหาย ข้อความล้น/ทับกัน ปุ่มเล็กกว่าเกณฑ์ หรือ UI ล้ำแถบใบหน้า |
| Offline review | 78 สถานะผ่าน · keyboard activation ผ่าน · desktop/mobile ไม่มี horizontal overflow |
| HUD / frames | common-state HUD เหมือนกันทั้ง 13 จอ; ภาพในกรอบไม่ resample UI; HUD ที่ส่งมอบคงค่าสถานะของแต่ละจอ |
| Tray | R4A เข้าถึง 16 ใบครบ · แท็บไม่เปลี่ยนขนาดถาด · คีย์ลูกศรผ่าน |
| Preservation / duplicates | ไฟล์คุ้มครอง 887 ไฟล์ไม่เปลี่ยน · byte-identical duplicate 0 กลุ่ม |
| Manual visual inspection | ตรวจครบ 13 จอ พร้อม hash ผูกกับภาพล่าสุด; ตรวจภาพใส่กรอบและหน้ารีวิวสองขนาด |

[Delivery audit](../../design-system/ux-mockups/v3/evidence/delivery-audit.json) ตรวจ dimensions, hash, source copy, สูตรเงา และหลักฐานที่อาจเก่า เอกสารใหม่ไม่มีสูตรดอลลาร์หรือ LaTeX ใช้ชื่อ เปี๊ยก ตาม canon

## 5. Limits, rollback and follow-up

- ยังไม่ทดสอบ Safari, เครื่องจริง, assistive technology, ข้อความ 200%, viewport อื่นใน UX §9 หรือการไหลของเกมจริง ภาพกรอบ Safari เป็นเพียงกรอบอ้างอิง ไม่ใช่ผลทดสอบ Safari
- ไม่มีการเปลี่ยน save/schema จึงไม่ต้อง migrate; rollback ด้วย reviewed revert ของชุดส่งมอบนี้ เก็บ v2 references ไว้เพราะ Harness อ้างตรง
- PO ตรวจรับภาพที่หน้ารีวิวก่อนส่งเสริมภาพใหม่เข้า canonical assets; ฝ่ายพัฒนาใช้พิกัดและ state เป็นฐานของ T0/T4 แล้วทำ production gates ตาม SSOT การอนุญาต commit/push ในภารกิจนี้ไม่ถือเป็น PO visual acceptance
- ไม่เพิ่ม dependency หรือ artwork จากเว็บ ภาพใหม่อ้างอิงคลังโครงการผ่าน built-in image generation; prompt, reference hashes และ invocation IDs อยู่ใน manifest

## 6. Git delivery

เตรียมงานบน `feat/sprint-05-atomic-mockups-v3` แล้วส่งรวม `develop` แบบ fast-forward ตามคำสั่งภารกิจ โดยไม่ force push หรือแก้ประวัติร่วม Commit ใช้ Conventional Commits พร้อม Change ID และตัวตนเจ้าของโครงการ ไม่มีชื่อ Agent/model หรือ co-author attribution ใน commit

พบ `origin/develop@f012dfb` ระหว่างตรวจรวมงาน ซึ่งเพิ่มสาร S5-002 และทะเบียนสถาปนิก จึง rebase เฉพาะ commit ที่ยังไม่เผยแพร่ เก็บข้อความ/ไฟล์เดิมครบ และใช้สาร S5-003 สำหรับงานภาพตามลำดับ append-only ไม่ force push หรือเปลี่ยนชื่อสารของผู้ส่งเดิม
