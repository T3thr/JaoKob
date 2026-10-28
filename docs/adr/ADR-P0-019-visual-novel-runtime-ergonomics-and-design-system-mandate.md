> **[STATUS AS OF 2026-10-29: ACTIVE — APPROVED BY PO & ANTIGRAVITY]**
> มีผลบังคับใช้เต็มรูปแบบสำหรับมาตรฐาน Visual Novel Ergonomics (พื้นที่สัมผัส ≥ 44×44 px, ห้ามใส่ตัวเลขสเตตัสในกล่องบทพูด, Inline Choices ไร้ Scrollbar)

# ADR-P0-019: Visual Novel Runtime Ergonomics, Anti-Slop Strict Standards, and Formal Design System Mandate

Status: **Accepted — binding design standard superseding ADR-P0-018, extending Sprint 4 Slice 1 (PR #13 Overhaul)**

Date: 2026-10-15. Authority: **PO & Tech Lead Consensus (Playtest Feedback Review v1.2.0)**. Version: 1.0.0.

---

## 1. Context & Problem Statement

ในการทดสอบจริงร่วมกับผู้เล่นสาย Visual Novel บนสภาพแวดล้อม Runtime ของ Sprint 4 Slice 1 (PR #13, commit `a634409`) แม้ว่าชุดทดสอบอัตโนมัติจะรายงานผลผ่านทั้งหมด 712/712 ข้อ และวัดค่า Cumulative Layout Shift (CLS) เชิงตัวเลขได้ 0 แต่ผลลัพธ์บนหน้าจอจริงกลับล้มเหลวด้านประสบการณ์ผู้ใช้ (UX/UI) อย่างสิ้นเชิง โดยปรากฏลักษณะที่เป็น "AI Slop" และความบกพร่องทางสถาปัตยกรรม 6 ประการหลัก (ยืนยันด้วยหลักฐานภาพหน้าจอ 4 รูปจากผู้เล่น):

1. **การทับซ้อนของหน้าต่างยืนยันบนหน้าแรก (Title Screen Modal Collision - ภาพที่ 1):**
   - กล่องยืนยันการเริ่มเกมใหม่ ("การยืนยันจะลบจุดบันทึกเดิมและสำเนากู้คืนของเจ้ากบ...") ถูกเรนเดอร์แทรกลงใน DOM Flow ปกติโดยไม่มี Backdrop หรือการแยก Layer ที่เหมาะสม ส่งผลให้กล่องข้อความทับซ้อนและบดบังปุ่ม "เริ่มเกมใหม่" และ "กลับสู่จุดเดิม" ด้านล่างจนดูสับสนและกดใช้งานไม่ได้
2. **การทำลายพื้นที่บทอ่านอันบริสุทธิ์ (Sacred Reading Card Pollution - ภาพที่ 2):**
   - คำเตือนเนื้อหา ("ก่อนเข้าสู่ช่วงพายุ ความกลัว และการพลัดพราก...") ถูกนำไปยัดใส่ไว้ในกล่องบทอ่านโดยตรง (`readingBody.append(contentNotice)`) ทำให้พื้นที่กล่องข้อความถูกบีบอัดจนตัวอักษรของบทสนทนาจริงถูกตัดทอนกลายเป็นจุดไข่ปลา (`...`) เสียอรรถรสในการอ่านวรรณกรรม
3. **ความเคว้งคว้าง ไม่สมมาตร และการเกิด Scrollbar ในตัวเลือก (Floating Choices & Layout Asymmetry - ภาพที่ 3):**
   - ในช่วงทางแยกตัดสินใจ (Decision Crossroads) ปุ่มตัวเลือกไม่ได้จัดวางอย่างสมมาตร (Centered Symmetry) แต่ลอยเคว้งอยู่กลางจอใต้โมเดลตัวละคร และจัดเรียงแบบชิดซ้าย
   - เมื่อข้อความตัวเลือกยาว กล่องตัวเลือกกลับเกิดแถบเลื่อน (Internal Scrollbar) ทำให้ผู้เล่นต้องเลื่อน scroll ดูข้อความปุ่มตัวเลือก ซึ่งผิดหลักการออกแบบ Visual Novel ระดับสากล
4. **การยัดผลลัพธ์ค่าพลังลงในกล่องบทสนทนา (Stat Deltas Infiltration - ภาพที่ 4):**
   - เมื่อผู้เล่นกดเลือกตัวเลือก ผลกระทบของค่าพลัง เช่น `– พลังชีวิต ลดลง 5  – พลังใจ ลดลง 10` ถูกนำไปพิมพ์ต่อท้ายบทพูดในกล่องอ่านโดยตรง พร้อมใช้เครื่องหมาย Em Dash (`–`) ทำให้กล่องข้อความกลายเป็นหน้าจอ Debug Log ของโปรแกรมเมอร์ แทนที่จะเป็นวรรณศิลป์อันอ่อนโยนของเจ้ากบ
5. **การควบคุมการตั้งค่าและเสียงที่ไร้มาตรฐาน (Confusing Audio & Settings UX):**
   - ปุ่มลำโพงบน Utility Rail ด้านบน เมื่อผู้เล่นกดคลิก กลับกลายเป็นการสั่งเปิดหน้าต่าง Settings แทนที่จะเป็นการสลับเปิด/ปิดเสียง (Mute/Unmute) โดยตรง
   - สวิตช์ตั้งค่า (Toggles) ดูไม่ออกว่าสถานะใดคือ "เปิด" หรือ "ปิด" ขาด Visual State ที่ชัดเจน
   - ปุ่มปิดหน้าต่างตั้งค่ายังคงถูกฝังไว้ด้านล่างสุดของฟอร์ม ทำให้ผู้เล่นต้องเลื่อนหน้าจอลงไปล่างสุดเพื่อปิดหน้าต่าง ขาดปุ่มกากบาท (`✕`) ตรึงมุมบนขวา
6. **ความเมื่อยล้าในการเล่นบนเดสก์ท็อป (Desktop Progression Fatigue):**
   - ผู้เล่นบนคอมพิวเตอร์ถูกบังคับให้ต้องเล็งเมาส์ไปคลิกที่กล่องข้อความขนาดจำกัดเท่านั้น ขาดการรองรับการกดแป้นพิมพ์ (`Spacebar`, `Enter`) หรือการคลิกพื้นที่ว่างบนหน้าจอ (Stage-wide Click-to-Advance)

### สาเหตุเชิงรากฐาน (Root Cause)
ความล้มเหลวซ้ำซากของ AI ในการปรับแก้ UI เกิดจากการ **ขาดเอกสาร Visual Novel Design System Specification** ที่เป็นทางการ ทำให้ AI แต่ละรอบใช้วิธี "เดาค่า CSS" สุ่มกำหนด Margin, Padding, Font Size, และ z-index แบบไร้ระเบียบ รวมถึงขาดการเข้าใจบทบาทความรับผิดชอบของ Component (Component Boundary) จึงนำข้อมูลทุกอย่างไปยัดรวมในกล่องอ่าน

---

## 2. Decision

ที่ประชุม PO และ Tech Lead มีมติร่วมกันดังนี้:

1. **ประกาศขยายเวลา Sprint 4 Slice 1 (PR #13):** ระงับการ Merge PR #13 จนกว่าจะแก้ไข UX/UI ให้เป็นไปตามมาตรฐาน ADR-P0-019 อย่างสมบูรณ์
2. **ยกเลิกและแทนที่ (Supersede) ADR-P0-018:** ให้อ้างอิง ADR-P0-019 เป็น Source of Truth สูงสุดสำหรับงานด้านสถาปัตยกรรม UI/UX ของเกม
3. **บังคับใช้เสาหลักทางสถาปัตยกรรม UI 6 ประการ (Six Ergonomic Pillars):**

### Pillar 1: กล่องบทอ่านอันบริสุทธิ์และระนาบฐานล่างคงที่ (Sacred Reading Card & Fixed Bottom Baseline)
- กล่องบทอ่าน (Reading Card) ต้องเป็น **พื้นที่บริสุทธิ์ (Sacred Narrative Space)** ที่แสดงเฉพาะ:
  - ชื่อผู้พูด (Speaker Label)
  - เนื้อหาบทบรรยาย/บทสนทนา (Dialogue & Narrative Prose)
  - เลขหน้าหรือสัญลักษณ์อ่านต่อ (Pagination / Continue Indicator)
- **ห้ามนำ Stat Deltas, Content Advisory หรือข้อความระบบใดๆ เข้าไปฝังในกล่องนี้โดยเด็ดขาด**
- กล่องข้อความต้องยึดกับ **Fixed Bottom Baseline** เสมอ (ระยะห่างคงที่จากขอบล่างจอ) เพื่อให้มี Layout Shift เท่ากับ 0 อย่างแท้จริงทั้งในโหมดอ่านบท (Reading) และโหมดเลือกการกระทำ (Decision)
- ปุ่มตัวเลือกในโหมด Decision ต้องจัดวางกึ่งกลางอย่างสมมาตร (Centered Symmetry) เต็มความกว้างที่เหมาะสม และมีความสูงที่รองรับข้อความภาษาไทยได้อย่างสบายตา โดย **ห้ามเกิด Scrollbar ในตัวเลือกโดยเด็ดขาด**

### Pillar 2: การแสดงผลค่าพลังด้วย HUD Micro-Toasts (Transient Floating Stat Indicators)
- การเปลี่ยนแปลงค่าพลัง (HP, พลังใจ) หลังการเลือกตัวเลือก ต้องไม่ปรากฏในกล่องบทอ่าน แต่ให้แสดงผลเป็น **HUD Micro-Toast** ลอยขึ้นมาสั้นๆ บริเวณใกล้เคียงกับเกจวัดบน HUD ด้านบน (เช่น `HP -5`, `พลังใจ -10`) และค่อยๆ จางหายไปเอง (Fade Out) ภายใน 2-3 วินาที
- หากผู้เล่นต้องการตรวจสอบผลกระทบย้อนหลัง ให้ดูผ่านระบบประวัติการสนทนา (Session Dialogue History / Log) ซึ่งจะถูกพัฒนาใน PR #15 (Task T6)

### Pillar 3: การแยกการแจ้งเตือนเนื้อหาออกจากบทอ่าน (Discreet Floating Content Advisory)
- นำป้ายเตือนเนื้อหาพายุออกจากกล่องบทอ่านโดยสมบูรณ์
- ให้แสดงผลเป็น **Floating Advisory Icon / Badge** ที่มุมจอ หรือบน Utility Rail อย่างสุภาพ ไม่บดบังฉากและบทอ่าน
- เมื่อผู้เล่นคลิกที่ไอคอน จะแสดงหน้าต่าง Modal รายละเอียดคำเตือน พร้อมปุ่มตัวเลือก **"ไม่ต้องแสดงคำเตือนนี้อีก (Don't show again)"** ซึ่งบันทึกสถานะลงใน `jaokob:preferences` ใน LocalStorage อย่างถาวร

### Pillar 4: การควบคุมเสียงและหน้าต่างตั้งค่าที่ถูกต้องตามมาตรฐาน (Direct Audio Toggle & Ergonomic Modal)
- ปุ่มลำโพงบน Utility Rail ต้องทำหน้าที่ **สลับเปิด/ปิดเสียง (Mute/Unmute Toggle) ทันทีในคลิกเดียว** โดยไม่เปิดหน้าต่าง Settings
- หน้าต่าง Settings และ Modal ทุกบาน ต้องมี **ปุ่มปิดกากบาท (`✕`) ตรึงอยู่ที่มุมบนขวาเสมอ** (`position: absolute; top: 1rem; right: 1rem`) เพื่อให้ผู้เล่นสามารถปิดหน้าต่างได้ทันทีโดยไม่ต้องเลื่อนหน้าจอ
- สวิตช์ตั้งค่า (Toggles) ต้องมีรูปลักษณ์ตามมาตรฐาน Switch Control สากล (Track ชัดเจน, Thumb สไลด์ซ้าย-ขวา, แสดงสถานะเปิดด้วยสีเขียวมอสส์ และสถานะปิดด้วยสีเทา พร้อม `role="switch"` และ `aria-checked`)

### Pillar 5: สรีรศาสตร์การเล่นบนเดสก์ท็อป (Desktop Progression Ergonomics)
- เพิ่ม Event Listener ให้ผู้เล่นสามารถกดปุ่ม **`Spacebar`** หรือ **`Enter`** เพื่ออ่านบทต่อไป (Advance Dialogue)
- รองรับการคลิกบริเวณใดก็ได้บนฉาก (Stage-wide Click-to-Advance) โดยไม่จำกัดเฉพาะการคลิกที่กล่องข้อความ (ยกเว้นการคลิกที่ปุ่มตัวเลือก, HUD, หรือ Modal)

### Pillar 6: ข้อบังคับการจัดทำเอกสาร Visual Novel Design System Specification
- มอบหมายให้ Senior AI จัดทำเอกสาร **`docs/design-system/visual-novel-specification.md`** เป็นงานแรก เพื่อกำหนดกรอบกติกาก่อนแก้ CSS:
  1. **Spatial System (8pt Grid):** กำหนดค่า Spacing Tokens ที่แน่นอน (`--space-1: 4px`, `--space-2: 8px`, `--space-3: 16px`, `--space-4: 24px`, `--space-5: 32px`, `--space-6: 48px`)
  2. **Color Palette & Contrast Tokens:** อิงตามคู่สีธรรมชาติ (ใบบัว, น้ำ, กระดาษถนอมสายตา, ครีม, เขียวมอสส์) โดยมี Contrast Ratio ไม่ต่ำกว่า 4.5:1 ตามมาตรฐาน WCAG AA
  3. **Typography Scale:** กำหนดลำดับชั้นขนาดตัวอักษร, line-height ที่เหมาะสมสำหรับภาษาไทย, และกฎ Anti-Slop (ห้ามใช้ Em-dash `—` หรือ `–` ในภาษาไทย, ห้ามใช้อิโมจิแทน SVG Icon)
  4. **Component Hierarchy & Layout Blueprints:** แผนผังระนาบความลึก (Z-index Stack) และพิกัดโครงสร้างของ Title Screen, HUD, Reading Card, Decision Crossroads, Modals, และ Toasts

---

## 3. Consequences

### ด้านบวก (Positive Consequences)
- ผู้เล่นได้รับประสบการณ์การเล่นเกม Visual Novel ที่นุ่มนวล สบายตา สมมาตร และมีวรรณศิลป์อันบริสุทธิ์
- ทีมพัฒนาและ AI Agent มี Design System Specification เป็นเข็มทิศร่วมกัน หมดปัญหาการเดาค่า CSS ในอนาคต
- ลดความเมื่อยล้าของผู้เล่นบนคอมพิวเตอร์ผ่านทางลัดคีย์บอร์ดและการคลิกฉาก
- ขจัดพฤติกรรม AI Slop ออกจากเกมอย่างถาวร

### ผลกระทบและงานที่ต้องทำ (Required Actions)
- สร้างเอกสาร `docs/design-system/visual-novel-specification.md`
- ปรับปรุง CSS ใน `src/ui/styles/` ให้สอดคล้องกับ Design Tokens
- ปรับปรุง DOM Renderer (`src/ui/renderers/dom/dom-renderer.js`) และ Settings Dialog (`src/ui/components/settings-dialog.js`)
- บันทึกการขยายเวลา Sprint 4 Slice 1 ใน `docs/sprints/sprint-04-ssot.md`
- อัปเดต E2E Capture และหลักฐาน `before-after.html`

---

## 4. Traceability

- แทนที่ (Supersedes): `ADR-P0-018`
- อ้างอิง: `ADR-P0-015` (Interactive Light Novel Presentation)
- เชื่อมโยงกับข้อกำหนด: `FR-UI-001`, `FR-UI-002`, `FR-UI-003`, `FR-UI-005`, `FR-ACC-001..004`, `GDD-UX-001..007`
