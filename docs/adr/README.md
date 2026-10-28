# ทะเบียนสถานะพระราชบัญญัติสถาปัตยกรรมและเนื้อเรื่อง (ADR Status Registry)
## โครงการ JaoKob (เจ้ากบ) — อัปเดตล่าสุด: 2026-10-29

เอกสารนี้เป็น **ดัชนีควบคุมสูงสุดของโฟลเดอร์ `docs/adr/`** เพื่อให้ AI Agents ทุกตัวในเครือข่าย (`Antigravity`, `Claude Opus 5.5`, `mimo-v2.6-pro`, `Senior AI / GPT-6 Astra`, `Gemini 4 Argon`) ทราบอย่างชัดเจนว่า **ADR ฉบับใดมีผลบังคับใช้ (ACTIVE)** และ **ADR ฉบับใดถูกระงับหรือยกเลิกแล้ว (SUSPENDED / SUPERSEDED)**

> [!IMPORTANT]
> **คำสั่งเด็ดขาดสำหรับ AI Agents ทุกตัว:**
> 1. สำหรับการออกแบบเนื้อเรื่อง ตัวละคร ไอเทม กลไกสายใยครอบครัว และการจัดวางฉาก Visual Novel ให้ยึด **[ADR-P0-032](./ADR-P0-032-living-fantasy-canon-peuak-miracle-doll-and-vn-stage-blocking.md)** และ **[พิมพ์เขียวเนื้อเรื่องและระบบเกม 5 องก์ฉบับใหม่](../design-system/new-five-act-story-and-mechanics-proposal.md)** เป็นกฎหมายสูงสุด
> 2. **ห้ามนำพล็อตด้ายแดง, คุณยาย, กบปูนปั้น, พี่บัว/พี่แหน, หรือการเป็นตุ๊กตาตั้งแต่เกิด** จาก ADR ที่ถูกสั่ง `SUSPENDED` กลับมาใช้โดยเด็ดขาด และ **ห้ามเอ่ยชื่อภาพยนตร์ แอนิเมชัน หรือผู้กำกับในโลกจริง** ในเอกสารหรือเนื้อเรื่องเด็ดขาด!

---

## 1. พระราชบัญญัติที่มีผลบังคับใช้เต็มรูปแบบ (ACTIVE ADRs — อนุมัติโดย PO & Antigravity)

| รหัส ADR | ชื่อเอกสาร | ขอบเขตที่บังคับใช้ | สถานะ |
|---|---|---|---|
| **[ADR-P0-032](./ADR-P0-032-living-fantasy-canon-peuak-miracle-doll-and-vn-stage-blocking.md)** | **Living Fantasy Canon, Peuak & Miracle Doll Ending, Eternal Nemesis Cockroach Man, Family Skill Trade-off, and VN Stage Blocking Contract** | **กฎหมายสูงสุดด้านเนื้อเรื่องและกลไกใหม่:** โลกแฟนตาซีสิ่งมีชีวิตใต้ชายคา (กบสองขามีชีวิต → กลายเป็นตุ๊กตาให้เด็กหญิงเปื๊อกในฉากจบ `E-HOME`), พี่ชาย **เจ้ากับ** & น้องสาว **เจ้ากิบ** ที่มีบทบาทตลอดเรื่อง, **เจ้าเตื๊อก** มอบภารกิจผู้พิทักษ์ไปช่วย **เด็กหญิงเปื๊อก**, **แมลงสาบแมน** คู่ปรับตลอดกาล, **พี่ก้าม & เจ้าฟิ้ว**, สมดุลทักษะครอบครัวปลดล็อก `E-DAWN`, ยกเลิกด้ายแดง และกำหนดตำแหน่งยืนซ้าย-ขวา (Stage Blocking) | **ACTIVE (Supreme Canon)** |
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
| **[ADR-P0-031](./ADR-P0-031-act1-4-narrative-rebuild-item-contract-and-balance-model.md)** | **ใช้เฉพาะคณิตศาสตร์และกลไกระบบ:** Status `HP / ใจ / STA`, จุดพักยกพื้น (Rest Floor), กฎสี่กุญแจ (The Four Keys), Grace Beat, Bond แยกรายเพื่อน, เครื่องมือวัดเวลาอ่าน (8–10 นาที/องก์) และโมเดล `Choice-Driven Ending` | **ระงับเนื้อเรื่องเดิม:** ยกเลิกบทด้ายแดง, พี่บัว/พี่แหน, คุณยาย, กบปูนปั้น และรายการไอเทมผูกด้ายแดง | **PARTIALLY ACTIVE (Math & Schema D7 Only)** |
| **[ADR-P0-026](./ADR-P0-026-cockroach-man-route-boss-jao-teuk-mandate-and-branching-narrative-graph.md)** | **คงตัวละครบังคับ:** **แมลงสาบแมน** (ก้อนเงาผ้าคลุมดำ) และ **เจ้าเตื๊อก** พร้อมโครงสร้างกราฟทางแยกที่มีความหมาย | **ระงับโครงฉากเดิม:** ปรับบทบาทเจ้าเตื๊อกให้มอบภารกิจผู้พิทักษ์ไปช่วยเด็กหญิงเปื๊อก และยกระดับแมลงสาบแมนเป็นคู่ปรับตลอดกาลตาม ADR-P0-032 | **PARTIALLY ACTIVE** |
| **[ADR-P0-022](./ADR-P0-022-visual-novel-ergonomics-living-keepsake-lore-and-sprint-streamlining.md)** | **ใช้เฉพาะ UX/UI & Sprint Plan:** แยก Ambient Meters ออกจาก Tools, Silent Save, Inline Confirmation, Save Format 2 และการแบ่งงาน 4 Value Slices | **ระงับสัจจะตุ๊กตาตั้งแต่เกิด:** เจ้ากบเกิดเป็นกบสองขามีชีวิต แล้วค่อยกลายเป็นตุ๊กตาให้เด็กหญิงเปื๊อกในฉากจบตาม ADR-P0-032 | **PARTIALLY ACTIVE (UI & Slices Only)** |
| **[ADR-P0-021](./ADR-P0-021-narrative-resonance-authentic-adventure-and-branching-integrity.md)** | **ใช้เฉพาะมาตรฐานวรรณศิลป์ Anti-Slop:** ห้ามผู้บรรยายสั่งสอนผู้เล่น ห้ามบล็อกข้อความซ้ำข้ามเส้นทาง | **ระงับกฎล็อกฉากจบด้วยแต้ม Bond และระงับข้อห้ามกลายเป็นตุ๊กตา:** เปลี่ยนเป็น Choice-Driven Ending และอนุญาตปาฏิหาริย์ตุ๊กตาใน `E-HOME` ตาม ADR-P0-032 | **PARTIALLY ACTIVE** |

---

## 3. พระราชบัญญัติที่ถูกสั่งระงับหรือถูกแทนที่แล้ว (SUSPENDED / SUPERSEDED — ห้ามนำมาใช้)

| รหัส ADR | เหตุผลในการระงับผลบังคับใช้ | แทนที่โดย | สถานะ |
|---|---|---|---|
| **[ADR-P0-030](./ADR-P0-030-tripartite-narrative-architecture-overhaul-five-act-expansion.md)** | ยกเลิกพล็อตมหาเส้นใยด้ายแดง, คุณยายเย็บเสื้อ, และกบปูนปั้น เพื่อเปิดทางให้โครงเรื่องใหม่ที่สนุกและเชื่อมโยงกว่าเดิม | [ADR-P0-032](./ADR-P0-032-living-fantasy-canon-peuak-miracle-doll-and-vn-stage-blocking.md) | **SUSPENDED** |
| **[ADR-P0-029](./ADR-P0-029-in-universe-living-narrative-sovereignty-and-doll-language-ban.md)** | ยกเลิกข้อห้ามการกลายเป็นตุ๊กตา เพราะฉากจบ `E-HOME` กำหนดให้เจ้ากบกลายเป็นตุ๊กตาจริง ๆ ให้เด็กหญิงเปื๊อก | [ADR-P0-032](./ADR-P0-032-living-fantasy-canon-peuak-miracle-doll-and-vn-stage-blocking.md) | **SUSPENDED** |
| **[ADR-P0-028](./ADR-P0-028-organic-family-resonance-companion-reciprocity-and-maturation-tradeoff.md)** | ยกเลิกโครงสร้างสถานที่และสมาชิกครอบครัวแบบเดิม เปลี่ยนเป็นครอบครัว พ่อ แม่ พี่ชายเจ้ากับ น้องสาวเจ้ากิบ พร้อมกลไกสมดุลทักษะครอบครัวใหม่ | [ADR-P0-032](./ADR-P0-032-living-fantasy-canon-peuak-miracle-doll-and-vn-stage-blocking.md) | **SUSPENDED** |
| **[ADR-P0-027](./ADR-P0-027-tripartite-narrative-resonance-family-bond-freeze-and-reformed-shadow-boss.md)** | ยกเลิกกฎย่อยที่จำกัดการปรากฏตัวของพี่น้องและเพื่อนสัตว์ เพื่อให้ออกแบบฉากไคลแมกซ์ร่วมกันได้อย่างอิสระ | [ADR-P0-032](./ADR-P0-032-living-fantasy-canon-peuak-miracle-doll-and-vn-stage-blocking.md) | **SUSPENDED** |
| **[ADR-P0-024](./ADR-P0-024-living-keepsake-transmutation-narrative-sovereignty-and-origin-canon.md)** | ยกเลิกพล็อตด้ายแดงและโครงเรื่องเดิมทั้งหมด | [ADR-P0-032](./ADR-P0-032-living-fantasy-canon-peuak-miracle-doll-and-vn-stage-blocking.md) | **SUSPENDED** |
| **[ADR-P0-018](./ADR-P0-018-visual-novel-design-system-and-anti-slop-standards.md)** | ถูกแทนที่ด้วยมาตรฐาน Runtime Ergonomics ที่สมบูรณ์กว่า | [ADR-P0-019](./ADR-P0-019-visual-novel-runtime-ergonomics-and-design-system-mandate.md) | **SUPERSEDED** |
| **[ADR-P0-017](./ADR-P0-017-childhood-accessory-export.md)** | ถูกแทนที่ด้วยกฎการแยกท่าถือหัวใจออกจากท่ามาตรฐาน | [ADR-P0-025](./ADR-P0-025-childhood-keepsake-default-stance-and-heart-emote-decoupling.md) | **SUPERSEDED** |
