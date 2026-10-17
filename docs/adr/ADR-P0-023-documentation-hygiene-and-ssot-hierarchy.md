# ADR-P0-023: Documentation Governance, Historical Deprecation Tagging, and Single Source of Truth Hierarchy

Status: **Accepted — binding architectural and documentation governance for Sprint 5 and beyond**

Date: 2026-10-18. Authority: **PO Directive & Lead Architect**. Version: 1.0.0.  
Branch: `feat/sprint-05-planning-ssot` · Baseline Commit: `2f24d9c`

---

## 1. Context & Motivation

จากการตรวจสอบเอกสารในคลัง [docs/](file:///Users/3rapat/MyWork/Project/WebApp/games/jao-kob/docs) พบวิกฤตความสับสนของเอกสาร (Documentation Rot / Semantic Staleness) ในระดับร้ายแรง โดยมีเอกสารรากฐานเดิมในโฟลเดอร์ [docs/phase-0/](file:///Users/3rapat/MyWork/Project/WebApp/games/jao-kob/docs/phase-0) ซึ่งจัดทำขึ้นตั้งแต่วันที่ 31 สิงหาคม 2026 (เช่น [01-game-design-document.md](file:///Users/3rapat/MyWork/Project/WebApp/games/jao-kob/docs/phase-0/01-game-design-document.md) และ [02-narrative-bible.md](file:///Users/3rapat/MyWork/Project/WebApp/games/jao-kob/docs/phase-0/02-narrative-bible.md)) มีเนื้อหาขัดแย้งโดยสิ้นเชิงกับสถานะปัจจุบันของเกม ดังนี้:

1. **ความขัดแย้งด้านสัจจะตัวละครและเนื้อเรื่อง:**
   - เอกสาร Phase 0 ยังระบุว่าตัวเอกเป็น "ลูกอ๊อดชีววิทยาในบึงน้ำ มีหาง มีเหงือก ว่ายน้ำ และแปลงร่างตามชีววิทยา" ซึ่งขัดแย้งกับข้อกำหนดปัจจุบันใน [ADR-P0-022](file:///Users/3rapat/MyWork/Project/WebApp/games/jao-kob/docs/adr/ADR-P0-022-visual-novel-ergonomics-living-keepsake-lore-and-sprint-streamlining.md) ที่ระบุว่าตัวเอกคือ **"ตุ๊กตากบตัวโปรดในชีวิตจริงที่ได้รับชีวิต วัยเด็กเป็นตุ๊กตาถักไหมพรม และเติบโตเป็นร่างกำมะหยี่ 45 ซม. สวมเสื้อฟ้าก่อนเกิดพายุ"**
2. **ความขัดแย้งด้านรูปแบบเกมและระยะเวลาเล่น:**
   - เอกสาร Phase 0 ระบุเวลาเล่น 2.5 ถึง 4 ชั่วโมง ซึ่งขัดแย้งกับรูปแบบ Interactive Visual Novel ปัจจุบันที่มีความกระชับ อบอุ่น และซาบซึ้งในเวลาประมาณ 35 ถึง 50 นาที
3. **ความเสี่ยงที่ AI Agent และนักพัฒนาจะหลงทิศทาง:**
   - ใน [AGENTS.md](file:///Users/3rapat/MyWork/Project/WebApp/games/jao-kob/AGENTS.md) และ [docs/README.md](file:///Users/3rapat/MyWork/Project/WebApp/games/jao-kob/docs/README.md) เดิม มีการจัดลำดับการอ่าน (Reading Order) ที่นำเอกสาร Phase 0 ขึ้นมาอ้างอิงโดยตรง ส่งผลให้ AI Agent หรือผู้พัฒนาอาจเผลอไปอ่านเอกสารเก่าล้าหลังเหล่านี้ แล้วนำข้อกำหนดที่ถูกยกเลิกไปแล้วมาใช้ในการเขียนโค้ดและแต่งบท

ที่ประชุมจึงมีมติให้ดำเนินการปฏิรูประบบเอกสาร กำหนดลำดับชั้นความศักดิ์สิทธิ์ (Authority Hierarchy) และติดป้ายเตือนการยกเลิก (Deprecation Warning Banners) ให้แก่เอกสารประวัติศาสตร์ทั้งหมดทันที

---

## 2. Decision

### D1 — การจัดลำดับชั้นเอกสาร 4 ระดับ (The Four-Tier Authority Hierarchy)
กำหนดลำดับชั้นความศักดิ์สิทธิ์ของเอกสารในโครงการ JaoKob อย่างเคร่งครัด หากมีข้อความขัดแย้งกัน ให้ยึดถือเอกสารในระดับที่สูงกว่าเป็นข้อยุติเสมอ:

1. **Tier 1: พระราชบัญญัติสูงสุดและแผนงานปัจจุบัน (Supreme Active SSOT & Governance):**
   - **Active Sprint SSOT:** [docs/sprints/sprint-05-ssot.md](file:///Users/3rapat/MyWork/Project/WebApp/games/jao-kob/docs/sprints/sprint-05-ssot.md) (พิมพ์เขียวการทำงาน WBS, DoR, DoD, 4 Value Slices ปัจจุบัน)
   - **Active Accepted ADRs:** โฟลเดอร์ [docs/adr/](file:///Users/3rapat/MyWork/Project/WebApp/games/jao-kob/docs/adr) โดยเฉพาะ:
     - [ADR-P0-022](file:///Users/3rapat/MyWork/Project/WebApp/games/jao-kob/docs/adr/ADR-P0-022-visual-novel-ergonomics-living-keepsake-lore-and-sprint-streamlining.md) (สัจจะตัวละครตุ๊กตามีชีวิต 45 ซม., การโละ UI สู่ Modern VN, 4 Value Slices)
     - [ADR-P0-021](file:///Users/3rapat/MyWork/Project/WebApp/games/jao-kob/docs/adr/ADR-P0-021-narrative-resonance-authentic-adventure-and-branching-integrity.md) (การเล่าเรื่องมีชีวิต ปลอดภัย ไม่ Slop, 3 ฉากจบที่เข้าถึงได้จริง)
     - [ADR-P0-020](file:///Users/3rapat/MyWork/Project/WebApp/games/jao-kob/docs/adr/ADR-P0-020-adventure-keepsake-pouch-and-item-system.md) (ระบบกระเป๋า 4 ช่อง ของ 6 ชิ้น)
     - [ADR-P0-019](file:///Users/3rapat/MyWork/Project/WebApp/games/jao-kob/docs/adr/ADR-P0-019-visual-novel-runtime-ergonomics-and-design-system-mandate.md) (สถาปัตยกรรม Visual Novel พื้นฐาน)
   - **Active Execution Contracts:** [docs/proposals/sprint-05-planning/02-adr022-remediation-contract.md](file:///Users/3rapat/MyWork/Project/WebApp/games/jao-kob/docs/proposals/sprint-05-planning/02-adr022-remediation-contract.md) และ [docs/traceability/sprint-05-execution-matrix.md](file:///Users/3rapat/MyWork/Project/WebApp/games/jao-kob/docs/traceability/sprint-05-execution-matrix.md)
2. **Tier 2: สัญญาข้อกำหนดการออกแบบ (Active Design & Narrative Contracts):**
   - โฟลเดอร์ [docs/design-system/](file:///Users/3rapat/MyWork/Project/WebApp/games/jao-kob/docs/design-system) เช่น [visual-novel-specification.md](file:///Users/3rapat/MyWork/Project/WebApp/games/jao-kob/docs/design-system/visual-novel-specification.md) (ต้องปรับปรุงตาม ADR-022 ใน Slice 1)
3. **Tier 3: ฐานข้อมูลการผสานงานรอบก่อนหน้า (Integrated Sprint Baselines):**
   - [docs/sprints/sprint-04-ssot.md](file:///Users/3rapat/MyWork/Project/WebApp/games/jao-kob/docs/sprints/sprint-04-ssot.md) (หลักฐานและสถานะที่รวมเข้า `develop` เรียบร้อยแล้ว)
4. **Tier 4: คลังเอกสารประวัติศาสตร์และข้อเสนอ (Historical Archives & Proposals - READ ONLY):**
   - **[docs/phase-0/](file:///Users/3rapat/MyWork/Project/WebApp/games/jao-kob/docs/phase-0):** เอกสารรากฐานเดิมทั้งหมด 10 ฉบับ ถือเป็น **Historical Baseline Archive** ที่ถูกแทนที่แล้ว
   - **[docs/proposals/](file:///Users/3rapat/MyWork/Project/WebApp/games/jao-kob/docs/proposals):** ข้อเสนอทางเทคนิค การวิจัย และแบบร่างที่ปิดรอบไปแล้ว
   - **[docs/sprints/](file:///Users/3rapat/MyWork/Project/WebApp/games/jao-kob/docs/sprints) (Sprints 1–3):** บันทึกประวัติรอบงานเก่า

### D2 — การติดป้ายเตือนเอกสารประวัติศาสตร์ (Mandatory Deprecation Banners)
เอกสารทั้งหมดใน [docs/phase-0/](file:///Users/3rapat/MyWork/Project/WebApp/games/jao-kob/docs/phase-0) ต้องมีกล่องข้อความเตือน (GitHub Alert Warning Banner) ปรากฏอยู่ที่ **บรรทัดแรกสุดของไฟล์** เพื่อแจ้งเตือน AI Agent และผู้พัฒนาว่าเนื้อหาเป็นเพียงบริบทประวัติศาสตร์ ห้ามนำข้อความที่ขัดแย้งไปลบล้างข้อกำหนดปัจจุบัน

### D3 — การปฏิรูป Master Operations Manual ([docs/README.md](file:///Users/3rapat/MyWork/Project/WebApp/games/jao-kob/docs/README.md))
- ปรับแก้ Flowchart การทำงานและแผนผังสารบัญใน [docs/README.md](file:///Users/3rapat/MyWork/Project/WebApp/games/jao-kob/docs/README.md) ใหม่ทั้งหมด
- กำหนดให้ AI Agent และนักพัฒนาต้องอ่าน **Active Sprint SSOT** และ **Active ADRs** เป็นอันดับแรก ห้ามส่ง Agent ไปอ่านเอกสาร Phase 0 เพื่อตีความกติกาเกมหรือเนื้อเรื่อง

### D4 — การอัปเดต [AGENTS.md](file:///Users/3rapat/MyWork/Project/WebApp/games/jao-kob/AGENTS.md)
- ปรับปรุงข้อ 3 ของ [AGENTS.md](file:///Users/3rapat/MyWork/Project/WebApp/games/jao-kob/AGENTS.md) ให้สะท้อนลำดับชั้นความศักดิ์สิทธิ์ตาม D1 เพื่อให้ AI Agent ทุกตัวปฏิบัติตามมาตรฐานเดียวกันโดยอัตโนมัติ

---

## 3. Consequences & Audit

- **ความชัดเจนของบริบท:** ขจัดปัญหา AI นำข้อมูลเก่าเรื่องลูกอ๊อดชีววิทยาหรือระยะเวลาเล่น 4 ชั่วโมงมาปะปนกับงานปัจจุบัน 100%
- **การคงอยู่ของประวัติศาสตร์:** ไม่มีการลบไฟล์เก่าทิ้ง เพื่อรักษา Traceability ย้อนหลังตามมาตรฐาน ISO/IEC/IEEE 12207 แต่มีการกำกับสถานะอย่างชัดเจน
- **การตรวจสอบย้อนกลับ:** การดำเนินการจัดระเบียบครั้งนี้มีผลทันทีบนกิ่ง `feat/sprint-05-planning-ssot` เพื่อเตรียมความพร้อมขั้นสูงสุดก่อนเริ่มพัฒนา Slice 1
