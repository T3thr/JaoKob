# ทะเบียนสถานะพระราชบัญญัติสถาปัตยกรรมและเนื้อเรื่อง (ADR Status Registry)
## โครงการ JaoKob (เจ้ากบ) — อัปเดตล่าสุด: 2026-10-29

เอกสารนี้เป็น **ดัชนีควบคุมสูงสุดของโฟลเดอร์ `docs/adr/`** เพื่อให้ AI Agents ทุกตัวในเครือข่าย (`Antigravity`, `Claude Opus 5.5`, `mimo-v2.6-pro`, `Senior AI / GPT-6 Astra`, `Gemini 4 Argon`) ทราบอย่างชัดเจนว่า **ADR ฉบับใดมีผลบังคับใช้ (ACTIVE)** และ **ADR ฉบับใดถูกระงับหรือยกเลิกแล้ว (SUSPENDED / SUPERSEDED)**

> [!IMPORTANT]
> **คำสั่งเด็ดขาดสำหรับ AI Agents ทุกตัว:**
> 1. สำหรับการออกแบบเนื้อเรื่อง ตัวละคร ไอเทม กลไกสายใยครอบครัว ระบบเกมเพลย์โต้ตอบเชิงกลยุทธ์ การออกแบบ UX/UI และการจัดวางฉาก Visual Novel ให้ยึด **[ADR-P0-032 (v2.0)](./ADR-P0-032-living-fantasy-canon-peuak-miracle-doll-and-vn-stage-blocking.md)**, **[ADR-P0-033 (v1.0)](./ADR-P0-033-interactive-tactical-adventure-gameplay-and-dynamic-stage-revolution.md)** และ **[พิมพ์เขียวเนื้อเรื่องและระบบเกม 5 องก์ฉบับใหม่](../design-system/new-five-act-story-and-mechanics-proposal.md)** เป็นกฎหมายสูงสุดร่วมกัน
> 2. **ห้ามนำพล็อตด้ายแดง, คุณยาย, กบปูนปั้น, พี่บัว/พี่แหน, การเป็นตุ๊กตาตั้งแต่เกิด, การเปลี่ยนเจ้าเตื๊อกเป็นสุนัข, ตัวละครสมมติอย่างพี่ตฤณ, หรือระบบที่ถูกสั่งห้ามใน ADR-P0-033 D0 (ลากลำแสงหาจุดซ่อน / แผนที่แสดงหมุดตัวละครคู่ขนาน)** เข้ามาใช้โดยเด็ดขาด และ **ห้ามเอ่ยชื่อภาพยนตร์ แอนิเมชัน หรือผู้กำกับในโลกจริง** ในเอกสารหรือเนื้อเรื่องเด็ดขาด!

---

## 1. พระราชบัญญัติที่มีผลบังคับใช้เต็มรูปแบบ (ACTIVE ADRs — อนุมัติโดย PO & Antigravity)

| รหัส ADR | ชื่อเอกสาร | ขอบเขตที่บังคับใช้ | สถานะ |
|---|---|---|---|
| **[ADR-P0-033 (v1.0)](./ADR-P0-033-interactive-tactical-adventure-gameplay-and-dynamic-stage-revolution.md)** | **Interactive Tactical Story Adventure Revolution — Light vs. Shadow Clash, Choice Energy & Shelter Camp, Dynamic Reactive Stage, Tactile Micro-Actions, and UX/UI Design Mandate** | **กฎหมายสูงสุดด้านรูปแบบการเล่นโต้ตอบ คณิตศาสตร์ ฟิสิกส์ และ UX/UI:** อนุมัติ 4 เสาหลัก (`D1` ศึกดวลกลยุทธ์แสงปะทะเงา `Light vs. Shadow Tactical Clash`, `D2` สมการพลังงานทางเลือกและแคมป์พักหลบฝน `Shelter Camp`, `D3` ฉากหลังไดนามิก สภาพอากาศ และเวทีขยายเงาตามหลักฟิสิกส์จริง, `D4` สัมผัสโต้ตอบสั้น ๆ `Tactile Micro-Actions`), สั่งห้ามระบบลากลำแสงหาของและระบบแผนที่/หมุดตัวละครคู่ขนาน (`D0`), และบังคับสเปกฟิสิกส์สเกล 45 ซม. + คณิตศาสตร์ไร้ทางตัน + พิมพ์เขียว UX/UI พร้อมเจนภาพต้นแบบ (`D5`) | **ACTIVE v1.0 (Supreme Gameplay & UX/UI)** |
| **[ADR-P0-032 (v2.0)](./ADR-P0-032-living-fantasy-canon-peuak-miracle-doll-and-vn-stage-blocking.md)** | **Living Fantasy Canon, Jao Teuk & Peuak Authentic Lore, Velour Plush Ending, Four-Bond & Family Skill System, Multiple-Narrative Graph, and VN Portrait Standard** | **กฎหมายสูงสุดด้านเนื้อเรื่อง ระบบสายใย/ไอเทม และภาพตัวละคร VN (ฉบับ 2.0):** เจ้ากบมีชีวิตตัวเดียว (ห้ามมีตุ๊กตาโครเชต์/ตุ๊กตาตัวที่สองในห้องเปี๊ยก · กลายร่างเป็นตุ๊กตากำมะหยี่ `Smooth Velour Plush` เฉพาะใน `E-HOME`), **เจ้าเตื๊อก** คือชายหนุ่มคนรักวัยเดียวกับ **เปี๊ยก** (ห้ามเป็นสุนัข/ห้ามสร้างญาติสมมติอย่างพี่ตฤณ · มีบทหลักตั้งแต่ต้นเรื่องและ Act 3–5), โครงสร้าง **Multiple Narrative Routes** จริง, ระบบ **4 สายใยมีชีวิต** (เปลี่ยนสรรพนามไดนามิก) + **3 ทักษะติดตัวภาษาไทยธรรมชาติ** (`ตั้งสติฟังฝน`, `ดีดตัวผ่าลม`, `ตาส่องเงามืด`), ระบบหลัก **`Item × Bond Combo`** (ส่วนฝากเพื่อนถือแนวหลังเป็น Optional), **เงื่อนไขปลดล็อกทั้ง 3 ฉากจบแบบสมมาตร (`Status + Bond + Item`)**, และมาตรฐานภาพตัวละครครึ่งตัว `VN Tachie` v2 (คงผ้าคลุมเงาแฟนตาซีใน `CG-05A`) | **ACTIVE v2.0 (Supreme Canon)** |
| **[ADR-P0-025](./ADR-P0-025-childhood-keepsake-default-stance-and-heart-emote-decoupling.md)** | Childhood & Adult Default Seated Stance and Heart-Holding Emote Decoupling | **กฎโมเดล 3D และภาพตัวละคร:** ระหว่างเล่นเกมต้องใช้ท่ามาตรฐาน **ไม่ถือหัวใจสีแดง** (ท่าถือหัวใจใช้เฉพาะเป็น Emote พิเศษหลังจบเกมเท่านั้น) | **ACTIVE** |
| **[ADR-P0-023](./ADR-P0-023-documentation-hygiene-and-ssot-hierarchy.md)** | Documentation Governance, Historical Deprecation Tagging, and SSOT Hierarchy | **กฎลำดับชั้นเอกสาร 4 ระดับ:** ห้ามนำเอกสารชีววิทยาลูกอ๊อดใน `docs/phase-0/` มาใช้เป็น Requirement | **ACTIVE** |
| **[ADR-P0-020](./ADR-P0-020-adventure-keepsake-pouch-and-item-system.md)** | Adventure Keepsake Pouch Architecture & Four-Slot Capacity | **กฎระบบกระเป๋า 4 ช่องคงที่:** กลไก `collect`, `replace`, `use`, `refuse → memory` (ส่วนรายชื่อไอเทมทั้ง 6 ชิ้นใช้ชุดใหม่ตาม ADR-P0-032) | **ACTIVE (System Contract)** |
| **[ADR-P0-019](./ADR-P0-019-visual-novel-runtime-ergonomics-and-design-system-mandate.md)** | Visual Novel Runtime Ergonomics & Anti-Slop Design System Mandate | **กฎ UX/UI:** พื้นที่สัมผัส ≥ 44×44 px, ห้ามแสดงตัวเลขสเตตัสในกล่องบทพูด, Inline Choices ไร้ Scrollbar | **ACTIVE** |
| **[ADR-P0-016](./ADR-P0-016-keepsake-model-viewer-spike.md)** | Lazy-loaded Keepsake Inspection Candidate | **กฎ 3D Viewer:** โหลดโมเดล 3D แบบ On-demand เฉพาะเมื่อเปิดดูในฉากจบ | **ACTIVE** |
| **[ADR-P0-015](./ADR-P0-015-interactive-light-novel-presentation.md)** | Interactive Light Novel Presentation and Compatibility | **กฎสถาปัตยกรรมสื่อและเสียง:** แยก AudioPort และ Environment ออกจาก Pure Core | **ACTIVE** |
| **[ADR-P0-014](./ADR-P0-014-content-orchestration-and-resume.md)** | Pure Content Orchestration, Resume and Save Consent | **กฎรันไทม์และเซฟ:** Pure Core Orchestration, Idempotent Resume และเกราะป้องกันข้อมูลเซฟ | **ACTIVE** |
| **[ADR-P0-013](./ADR-P0-013-content-validation-contract.md)** | Local Content Validation Contract | **กฎตัวตรวจทานข้อมูล:** Pure JS Draft 2020-12 Schema Validator ไร้ไลบรารีภายนอก | **ACTIVE** |

---

## 2. พระราชบัญญัติที่ใช้เฉพาะส่วนระบบวิศวกรรม และระงับส่วนเนื้อเรื่องเดิม (PARTIALLY ACTIVE — System Only)

| รหัส ADR | ส่วนที่ยังคงใช้ (Retained System Rules) | ส่วนที่ถูกระงับ (Suspended Lore Rules) | สถานะ |
|---|---|---|---|
| **[ADR-P0-031](./ADR-P0-031-act1-4-narrative-rebuild-item-contract-and-balance-model.md)** | **ใช้เฉพาะคณิตศาสตร์และกลไกระบบ:** Status `HP / ใจ / STA`, จุดพักยกพื้น (Rest Floor), กฎสี่กุญแจ (The Four Keys), Grace Beat, Bond แยกรายเพื่อน และเครื่องมือวัดเวลาอ่าน (8–10 นาที/องก์) | **ระงับเนื้อเรื่องเดิมและโมเดลฉากจบไม่ผูกเงื่อนไข:** ยกเลิกบทด้ายแดง, พี่บัว/พี่แหน, คุณยาย, กบปูนปั้น, รายการไอเทมผูกด้ายแดง และปรับสู่โมเดลเงื่อนไขปลดล็อก 3 ฉากจบแบบสมมาตร (`Status + Bond + Item`) ตาม ADR-P0-032 D5.4 | **PARTIALLY ACTIVE (Math & Schema D7 Only)** |
| **[ADR-P0-026](./ADR-P0-026-cockroach-man-route-boss-jao-teuk-mandate-and-branching-narrative-graph.md)** | **คงตัวละครบังคับ:** **แมลงสาบแมน** (ก้อนเงาผ้าคลุมดำ) และ **เจ้าเตื๊อก** พร้อมโครงสร้างกราฟทางแยกที่มีความหมาย | **ระงับโครงฉากเดิม:** ปรับบทบาทเจ้าเตื๊อกเป็นพระเอกมนุษย์คนรักของเปี๊ยกผู้มอบภารกิจผู้พิทักษ์ และยกระดับแมลงสาบแมนเป็นคู่ปรับตลอดกาลครบ 5 ยกตาม ADR-P0-032 และ ADR-P0-033 | **PARTIALLY ACTIVE** |
| **[ADR-P0-022](./ADR-P0-022-visual-novel-ergonomics-living-keepsake-lore-and-sprint-streamlining.md)** | **ใช้เฉพาะ UX/UI & Sprint Plan:** แยก Ambient Meters ออกจาก Tools, Silent Save, Inline Confirmation, Save Format 2 และการแบ่งงาน 4 Value Slices | **ระงับสัจจะตุ๊กตาตั้งแต่เกิด:** เจ้ากบเกิดเป็นกบสองขามีชีวิต แล้วค่อยกลายร่างเป็นตุ๊กตากำมะหยี่ให้เปี๊ยกเฉพาะในฉากจบ `E-HOME` ตาม ADR-P0-032 | **PARTIALLY ACTIVE (UI & Slices Only)** |
| **[ADR-P0-021](./ADR-P0-021-narrative-resonance-authentic-adventure-and-branching-integrity.md)** | **ใช้เฉพาะมาตรฐานวรรณศิลป์ Anti-Slop:** ห้ามผู้บรรยายสั่งสอนผู้เล่น ห้ามบล็อกข้อความซ้ำข้ามเส้นทาง | **ระงับข้อห้ามกลายเป็นตุ๊กตาและปรับสมดุลเงื่อนไขฉากจบ:** อนุญาตปาฏิหาริย์ตุ๊กตากำมะหยี่เฉพาะใน `E-HOME` และใช้เงื่อนไขสมมาตร `Status + Bond + Item` ปลดล็อกทั้ง 3 ฉากจบตาม ADR-P0-032 D5.4 | **PARTIALLY ACTIVE** |

---

## 3. พระราชบัญญัติที่ถูกสั่งระงับหรือถูกแทนที่แล้ว (SUSPENDED / SUPERSEDED — ห้ามนำมาใช้)

| รหัส ADR | เหตุผลในการระงับผลบังคับใช้ | แทนที่โดย | สถานะ |
|---|---|---|---|
| **[ADR-P0-030](./ADR-P0-030-tripartite-narrative-architecture-overhaul-five-act-expansion.md)** | ยกเลิกพล็อตมหาเส้นใยด้ายแดง, คุณยายเย็บเสื้อ, และกบปูนปั้น เพื่อเปิดทางให้โครงเรื่องใหม่ที่สนุกและเชื่อมโยงกว่าเดิม | [ADR-P0-032](./ADR-P0-032-living-fantasy-canon-peuak-miracle-doll-and-vn-stage-blocking.md) | **SUSPENDED** |
| **[ADR-P0-029](./ADR-P0-029-in-universe-living-narrative-sovereignty-and-doll-language-ban.md)** | ยกเลิกข้อห้ามการกลายเป็นตุ๊กตา เพราะฉากจบ `E-HOME` กำหนดให้เจ้ากบกลายเป็นตุ๊กตาจริง ๆ ให้เด็กหญิงเปี๊ยก | [ADR-P0-032](./ADR-P0-032-living-fantasy-canon-peuak-miracle-doll-and-vn-stage-blocking.md) | **SUSPENDED** |
| **[ADR-P0-028](./ADR-P0-028-organic-family-resonance-companion-reciprocity-and-maturation-tradeoff.md)** | ยกเลิกโครงสร้างสถานที่และสมาชิกครอบครัวแบบเดิม เปลี่ยนเป็นครอบครัว พ่อ แม่ พี่ชายเจ้ากับ น้องสาวเจ้ากิบ พร้อมกลไกสมดุลทักษะครอบครัวใหม่ | [ADR-P0-032](./ADR-P0-032-living-fantasy-canon-peuak-miracle-doll-and-vn-stage-blocking.md) | **SUSPENDED** |
| **[ADR-P0-027](./ADR-P0-027-tripartite-narrative-resonance-family-bond-freeze-and-reformed-shadow-boss.md)** | ยกเลิกกฎย่อยที่จำกัดการปรากฏตัวของพี่น้องและเพื่อนสัตว์ เพื่อให้ออกแบบฉากไคลแมกซ์ร่วมกันได้อย่างอิสระ | [ADR-P0-032](./ADR-P0-032-living-fantasy-canon-peuak-miracle-doll-and-vn-stage-blocking.md) | **SUSPENDED** |
| **[ADR-P0-024](./ADR-P0-024-living-keepsake-transmutation-narrative-sovereignty-and-origin-canon.md)** | ยกเลิกพล็อตด้ายแดงและโครงเรื่องเดิมทั้งหมด | [ADR-P0-032](./ADR-P0-032-living-fantasy-canon-peuak-miracle-doll-and-vn-stage-blocking.md) | **SUSPENDED** |
| **[ADR-P0-018](./ADR-P0-018-visual-novel-design-system-and-anti-slop-standards.md)** | ถูกแทนที่ด้วยมาตรฐาน Runtime Ergonomics ที่สมบูรณ์กว่า | [ADR-P0-019](./ADR-P0-019-visual-novel-runtime-ergonomics-and-design-system-mandate.md) | **SUPERSEDED** |
| **[ADR-P0-017](./ADR-P0-017-childhood-accessory-export.md)** | ถูกแทนที่ด้วยกฎการแยกท่าถือหัวใจออกจากท่ามาตรฐาน | [ADR-P0-025](./ADR-P0-025-childhood-keepsake-default-stance-and-heart-emote-decoupling.md) | **SUPERSEDED** |
