# ADR-P0-018: Visual Novel Design System, Layout Anchoring, and Anti-Slop Presentation Standards

Status: **Accepted — binding design standard for Sprint 4 UI Overhaul and future frontend slices.**

Date: 2026-10-15. Authority: **PO & Tech Lead Consensus (Playtest Feedback Review v1.1.0)**. Version: 1.1.0.

## Context

ผลจากการทดสอบจริงร่วมกับผู้เล่นสาย Visual Novel บนพรีวิวของ Sprint 4 Slice 1 (PR #13, commit `a634409`) พบปัญหาด้าน UX/UI ขั้นวิกฤต 5 ประการที่ทำให้ประสบการณ์การเล่นยังคงแสดงพฤติกรรมแบบ "AI Slop" และบั่นทอนอารมณ์ร่วมของเกม:

1. **กล่องข้อความไม่บริสุทธิ์ (Pollution of the Reading Card):**
   - **การแจ้งเตือนเนื้อหาแทรกซ้อน (Content Warning Infiltration):** ป้ายเตือนช่วงพายุถูกนำไปต่อท้ายไว้ในกล่องบทอ่านโดยตรง (`readingBody.append(contentNotice)`) ทำให้กล่องข้อความถูกแย่งพื้นที่ไปกว่าครึ่ง จนตัวหนังสือของบทบรรยายถูกบีบอัดและถูกตัดทอนกลายเป็นจุดไข่ปลา
   - **การยัดผลลัพธ์ค่าพลังลงในบทพูด (Stat Deltas Cluttering Dialogue):** เมื่อผู้เล่นเลือกช้อยส์ ผลการเปลี่ยนแปลงค่าพลัง เช่น `– พลังชีวิต ลดลง 5  – พลังใจ ลดลง 10` ถูกนำไปพิมพ์เป็นรายการ bullet point ต่อท้ายด้วย em-dash อยู่ในกล่องบทอ่าน ทำให้ดูเหมือนข้อความ debug log ของโปรแกรมเมอร์ ไม่ใช่ภาษาวรรณศิลป์ของเกม Visual Novel
2. **ความไม่มั่นคงและความไม่สมมาตรของเลย์เอาต์ (Layout Instability & Asymmetry):**
   - **ปุ่มตัวเลือกเคว้งคว้างกลางจอ (Floating & Unbalanced Choices):** ในโหมด Decision ปุ่มตัวเลือกถูกนำไปลอยไว้เหนือกล่องข้อความตรงกลางจอ (ใต้โมเดลตัวละคร) และเมื่อตัวเลือกมีความยาวหรือมีหลายข้อ ช้อยส์กลับชิดซ้ายหรือเกิดแถบเลื่อน (Scrollbar) ด้านในปุ่มตัวเลือก ทำให้ผู้เล่นต้องเลื่อน scroll ดูตัวเลือก ซึ่งผิดธรรมชาติตัวเลือกของเกมผจญภัย
   - **การเหลื่อมทับกันบนหน้าจอ Title (Modal Collision):** เมื่อมีข้อมูลเซฟเดิม กล่องยืนยันการเริ่มเกมใหม่แสดงทับซ้อนกับปุ่มเริ่มเกมเดิมจนบังมิด
3. **การควบคุมการตั้งค่าและเสียงที่สร้างความสับสน (Confusing Settings & Audio UX):**
   - ปุ่มเปิด/ปิดเสียงบนแถบ Utility Rail ด้านบน เมื่อผู้เล่นกดคลิก กลับกลายเป็นการสั่งเปิดหน้าต่าง Settings ขึ้นมาแทนที่จะเป็นการสลับเปิด/ปิดเสียง (Mute/Unmute) ทันที
   - สวิตช์ตั้งค่า (Toggles) ดูไม่ออกอย่างชัดเจนว่าสถานะใดคือ "เปิด" หรือ "ปิด"
   - ปุ่มปิดหน้าต่างตั้งค่ายังคงต้องเลื่อนลงไปด้านล่าง ขาดปุ่มกากบาท (`✕`) ที่ตรึงอยู่มุมบนขวา
4. **ความเมื่อยล้าในการเล่นบนเดสก์ท็อป (Desktop Progression Fatigue):**
   - ผู้เล่นบนคอมพิวเตอร์ถูกบังคับให้ต้องเล็งเมาส์ไปคลิกที่กล่องข้อความเล็กๆ ด้านล่างเพื่ออ่านต่อเท่านั้น ขาดการรองรับการคลิกพื้นที่ว่างบนจอ (Stage-wide click) หรือการกดปุ่ม Spacebar/Enter
5. **แบบแผนภาษาและไอคอนแบบ AI Slop (AI Slop Patterns):**
   - การใช้ขีด Em Dash (`—` หรือ `–`) ในภาษาไทยอย่างพร่ำเพรื่อ
   - การประดิษฐ์สำนวนห้วน สั้น ไร้อารมณ์ความรู้สึก
   - การขาดเอกสารแม่แบบระบบดีไซน์ (Design System Specification) ที่เป็นลายลักษณ์อักษร ทำให้ทีมวิศวกรรมสุ่มปรับแต่งค่า CSS แบบตามใจชอบ

---

## Decision

ที่ประชุม PO และ Tech Lead มีมติกำหนดมาตรฐานสถาปัตยกรรม UI/UX ดังต่อไปนี้เป็นข้อบังคับ (Mandatory Standards):

### 1. D1 — ความบริสุทธิ์ของกล่องบทอ่านและการจัดวางฐานล่าง (Sacred Reading Card & Stable Baseline)
- กล่องบทอ่าน (Reading Card) ต้องเป็น **พื้นที่บริสุทธิ์ (Sacred Narrative Space)** ที่สงวนไว้สำหรับบทบรรยาย บทสนทนาตัวละคร และชื่อผู้พูดเท่านั้น **ห้ามนำ Stat Deltas หรือ Content Warning ใดๆ เข้าไปฝังในกล่องนี้โดยเด็ดขาด**
- กล่องข้อความต้องยึดติดกับ **Fixed Bottom Baseline** เสมอ ไม่ขยับความสูงหรือกระโดดขึ้นลงระหว่างการเปลี่ยนหน้าอ่านบท (Reading Beat) และหน้าเลือกการกระทำ (Decision Crossroads)
- ปุ่มตัวเลือกในโหมด Decision ต้องจัดวางอย่างสมมาตร (Symmetrical & Centered) มีขนาดความสูงคงที่ ไม่ก่อให้เกิด Scrollbar ภายในปุ่มตัวเลือกในความละเอียดหน้าจอมาตรฐาน

### 2. D2 — การแสดงผลค่าพลังด้วย HUD Micro-Toasts (Transient Floating Stat Indicators)
- การเปลี่ยนแปลงค่าพลัง (HP, Sanity/พลังใจ) ต้องแสดงผลเป็น **HUD Micro-Toast / Transient Floating Indicator** ที่ลอยขึ้นมาอย่างนุ่มนวลบริเวณแถบ HUD ด้านบน (เช่น `-5 HP`, `-10 พลังใจ`) แล้วค่อยๆ จางหายไป (Fade Out ภายใน 2-3 วินาที) หรือกระพริบอย่างนุ่มนวลที่เกจวัด
- การทบทวนว่าช้อยส์ใดส่งผลต่อค่าพลังอย่างไร จะถูกบันทึกไว้ในระบบประวัติการเล่น (Narrative Backlog / Log) ใน PR #15 (Task T6) เพื่อให้ผู้เล่นย้อนดูได้โดยไม่รบกวนการอ่านในฉากปัจจุบัน

### 3. D3 — การแยกการแจ้งเตือนเนื้อหาออกจากบทอ่าน (Discreet Content Advisory Architecture)
- นำ Content Warning ออกจากกล่องบทอ่านโดยเด็ดขาด
- ให้แสดงผลเป็น **ไอคอนแจ้งเตือนขนาดกะทัดรัด (Floating Advisory Icon)** ที่มุมจอหรือบน Utility Rail อย่างแนบเนียน หรือแสดงเป็น Modal เตือนล่วงหน้าก่อนเข้าฉากที่มีตัวเลือก **"ไม่ต้องแสดงคำเตือนนี้อีก (Don't show again)"** บันทึกลงใน UI Preferences เพื่อไม่ให้ปรากฏขึ้นมารบกวนผู้เล่นซ้ำอีก

### 4. D4 — การควบคุมเสียงและสวิตช์เปิดปิดที่โปร่งใส (Direct Audio Toggle & Ergonomic Controls)
- การกดปุ่มเสียงบน Utility Rail ต้องทำหน้าที่ **สลับสถานะเปิด/ปิดเสียง (Mute / Unmute Toggle) ทันที** โดยไม่ต้องเปิดหน้าต่าง Settings ขึ้นมา
- สวิตช์ตั้งค่าทุกตัวต้องได้รับการออกแบบตามมาตรฐาน Switch Control สากล (Track ชัดเจน, Thumb สไลด์ไปมา, สีเขียวมอสส์เมื่อเปิด, สีเทาหม่นเมื่อปิด พร้อม `role="switch"` และ `aria-checked`)
- หน้าต่าง Settings และ Modal ทุกบานต้องมี **ปุ่มปิดกากบาท (`✕`) ตรึงอยู่ที่มุมบนขวาเสมอ** (`position: absolute; top: 1rem; right: 1rem; z-index: 10`)

### 5. D5 — การลดความเมื่อยล้าบนเดสก์ท็อป (Desktop Progression Ergonomics)
- รองรับการกดแป้นพิมพ์ `Spacebar` หรือ `Enter` เพื่ออ่านบทต่อไป
- รองรับการคลิกที่บริเวณใดก็ได้บนฉาก (Stage-wide Click-to-Advance) โดยไม่จำกัดเฉพาะการคลิกที่กล่องข้อความ โดยสามารถตั้งค่าเปิด/ปิดคุณสมบัตินี้ได้ใน Settings

### 6. D6 — บังคับจัดทำเอกสาร Visual Novel Design System Specification
- มอบหมายให้ Senior AI จัดทำเอกสาร **`docs/design-system/visual-novel-specification.md`** เพื่อเป็น Source of Truth ด้าน UI/UX ของโครงการ โดยต้องระบุ:
  1. **Spatial Rhythm & 8pt Grid:** (4px, 8px, 16px, 24px, 32px, 48px)
  2. **Color Palette & WCAG AA Contrast Tokens:** กำหนดค่า Contrast ไม่ต่ำกว่า 4.5:1 สำหรับข้อความปกติ และ 7:1 สำหรับ High Contrast
  3. **Typography Scale:** กำหนดลำดับขนาดตัวอักษร, line-height ที่สบายตาสำหรับภาษาไทย, และกฎ Anti-Slop (ห้ามใช้ Em-dash `—` ในภาษาไทย)
  4. **Component Hierarchy & Layout Blueprints:** โครงสร้างตายตัวของ Title, Reading Card, Decision Group, HUD, Modals, และ Toasts

---

## Consequences

- ปรับปรุงโค้ดใน `src/ui/renderers/dom/dom-renderer.js`, `src/bootstrap/index.js`, `src/ui/components/`, และ `src/ui/styles/`
- จัดทำเอกสาร `docs/design-system/visual-novel-specification.md`
- Task T1 และ T2 ใน Sprint 4 SSOT ต้องใช้เกณฑ์ ADR-P0-018 v1.1.0 ในการตรวจรับ
- PR #13 ต้องผ่านเกณฑ์เหล่านี้และได้รับการยืนยันด้วยภาพพรีวิวใหม่ก่อนอนุมัติ Merge

## Traceability

- บันทึกการประชุม PO & VN Player Review วันที่ 2026-10-15
- ขยายผลจาก `ADR-P0-015` (Interactive Light Novel Presentation)
- เชื่อมโยงกับ `FR-UI-001`, `FR-UI-002`, `FR-UI-003`, `FR-UI-005`, `FR-ACC-001..004`, `GDD-UX-001..007`
