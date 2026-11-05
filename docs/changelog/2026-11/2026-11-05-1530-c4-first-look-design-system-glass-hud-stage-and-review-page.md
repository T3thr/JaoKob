# Change Record: C4 ชิ้นแรกที่ดูได้ · token Atomic 05 · กระจกฝ้า · กระดาษสา · HUD · เวที Tachie · หน้าตรวจของ PO

- **รหัสบันทึก (Record ID):** CR-20261105-1530
- **วันและเวลา (Timestamp):** 2026-11-05T15:30:00+07:00
- **รอบการพัฒนา (Sprint/Milestone):** Sprint 5 · Slice 1 · checkpoint C4 (T4) ชิ้นแรก
- **ผู้ปฏิบัติงาน (Operator/Persona):** Claude · Supreme Core Architect & Lead Game Systems Engineer
- **สถานะ (Status):** In-Progress · ชิ้นแรกส่งให้ PO ตรวจบนเบราว์เซอร์จริง · **หยุดรอความเห็นของ PO ก่อนขยายต่อ** · T4 ยังไม่ติ๊ก

---

## 1. วัตถุประสงค์และคำสั่ง (Prompt Objective & Request)

PO อนุมัติแผน C4 และการตีความสามข้อ ([CR-20261105-1430](2026-11-05-1430-po-decisions-q11-prototype-digest-and-c4-start.md) · SSOT §1.2) แล้วสั่งให้สร้างชิ้นแรกที่ดูได้: token · กระจกฝ้า · การ์ดกระดาษสา · `TopHudCapsule` · `VnTachieStage` · `SaaDialogueCard` · `TactileActionCard` · `SceneTitleCard` และหน้าตรวจ `journey-review` แล้วส่งภาพจาก Chromium พร้อมคำสั่งเปิดบน Mac ให้ PO ตรวจ · ข้อเดียวที่ PO ขอ: C4 ต้องผ่านสายตา PO ภาพนิ่ง v3 ยังไม่ถึงคุณภาพที่ต้องการ

## 2. ข้อกำหนดที่ได้รับผลกระทบ (Traceability & Requirement IDs)

- **ADRs:** ADR-P0-034 D9.2 (view model ไม่มีกติกาใน UI) · D9.3 (arm ผูก revision) · D10.1–D10.4 (ต้นแบบคือของจริง · วัสดุ · ความคมชัด · กำแพงกันสปอยล์) · ADR-P0-032 D7.1–D7.2 (Tachie และแถบใบหน้า) · ADR-P0-019 · ADR-P0-022 D2/D3
- **สัญญาออกแบบ:** Atomic 05 §3.1–§3.4 · UX §0 · §1.1–§1.10 · §2.1–§2.3 · §8.4 · พิกัด handoff ของ Mockups v3
- **Sprint 5 WBS:** T4 กำลังทำ (ชิ้นแรก) · T3 ไม่เปลี่ยน
- **Verification IDs:** `TC-S5-VN-001` · `TC-S5-HUD-001` · `TC-S5-SILENT-001` · `TC-S5-A11Y-001` (ส่วนที่ทำอัตโนมัติได้ในรอบนี้ · ปิดครบเมื่อจบ C4)

## 3. สิ่งที่ทำและรายการไฟล์ที่เปลี่ยนแปลง (Manifest of Changes)

### 3.1 ไฟล์ที่สร้างใหม่ (Created)

- `src/data/assets/journey-media.js`: asset ID เป็นภาพ same-origin จาก manifest v2 · key ผูก identity ของแพ็กเกจ · ภาพตามทิศจาก `variantOf` (ไม่สะท้อนภาพ) และรายงานทิศที่ยังไม่มี · จุดตาต่อภาพ · ปฏิเสธ path ที่ออกนอก `assets/images/` ID ซ้ำ ขนาดหรือ hash ผิด
- `src/data/content/journey-presentation.js`: view ของแอปเป็นคำ ภาพ และเม็ด · ประโยคสำหรับโปรแกรมอ่านหน้าจอเป็นคำไทยไม่มีตัวเลข · ป้ายชนิดตามชุดคำตายตัวของ UX §1.4 · ไอคอนตาม UX §8.4 · toast จาก event ของ Core · โหมดที่ C5 วาด (ถาดศึก แคมป์ สัมผัส รับของ ฉากจบ) รายงานเป็น `pending` · ไม่มีกติกา
- `src/data/localization/th-journey.js`: คำของหน้าจอ ป้าย เหตุผลที่กดไม่ได้ ข้อความแจ้งความล้มเหลว และประโยคแบบนับเป็นคำ
- `src/ui/journey/journey-icons.js`: glyph ของ v3 คัดลอกเข้า production · วาดใหม่สามตัวให้ตรง Atomic 05 ที่ 15 px (ใบบัวมีรอยบาก · ดาวสามแฉกมีจุดปลายแบบลายปักบนเสื้อ · ขากบสามนิ้วมีพังผืด) · ฟันเฟืองแบบฟันเท่ากัน · ▽ ของกล่องบทพูด
- `src/ui/journey/journey-dom.js`: Safe DOM (`textContent` เท่านั้น) และ id ต่อ renderer ไม่มีตัวแปรระดับโมดูล
- `src/ui/journey/components/top-hud-capsule.js` · `vn-tachie-stage.js` · `saa-dialogue-card.js` · `tactile-action-card.js` · `scene-title-card.js` · `hud-toasts.js`: ชิ้นส่วนร่วมตาม UX §1.1 · อัปเดตในที่ (layout shift 0) · ภาพถอดรหัสก่อนแล้วค่อยจางเข้า · ภาพเสียไม่หยุดเรื่อง
- `src/ui/journey/journey-renderer.js`: วาด model และแปลงการกดเป็นคำสั่งที่ผูก revision · ▽ แตะเวที Space Enter อ่านต่อ · 1–5 เลือกการ์ด · ยืนยันสองจังหวะแบบ inline เมื่อเปิด `confirmHighImpactChoices` · Esc ยกเลิก · I เปิดกระเป๋า · ประกาศหนึ่งครั้งต่อเหตุการณ์ · โฟกัสไปการ์ดแรกที่เลือกได้และกลับ ▽ · fit หรือ flow ตามการวัดจริง
- `src/ui/journey/plain-image-loader.js`: ถอดรหัสก่อนส่ง URL และตรวจขนาดเทียบ manifest · C5 แทนด้วย loader ที่ตรวจไบต์ผ่าน port เดียวกัน
- `src/ui/styles/journey-tokens.css` · `journey-screen.css` · `journey-adaptive.css`: token Atomic 05 · วัสดุกระดาษสาและกระจกฝ้าพร้อมพื้นทึบสำรอง · โซนจอและแถบใบหน้า · ตำแหน่งตัวละครด้วยจุดตา · motion · ลดการเคลื่อนไหว · Reduced Intensity · คอนทราสต์สูง · forced colors · มือถือแคบและแนวนอน · คอลัมน์เดียวเลื่อนทั้งหน้า
- `src/bootstrap/journey-shell.js`: ประกอบแอป Journey ของ C3 กับ media presentation และ renderer · โหลดแพ็กเกจและ manifest แบบ same-origin · หน้าเว็บถูกซ่อนแล้วนับเวลาและบันทึก แสดงอีกครั้งแล้วเดินเวลาต่อ
- `docs/design-system/evidence/journey-review/` (`index.html` · `frame.js` · `frame.css` · `play.html` · `play.js` · `review.css`): หน้าตรวจของ PO นอก release allowlist · เกมจริงในกรอบหกขนาดจอและแบบเต็มพื้นที่ · เส้นแถบใบหน้า · สถานะสด · ปุ่มส่งคำสั่งจริงของ engine ในจังหวะของ C5 · แผงตั้งค่าที่ใช้ตรวจ C4
- `tools/dev/serve-review.mjs`: เว็บเซิร์ฟเวอร์อ่านอย่างเดียวสำหรับ PO ไม่มี dependency พิมพ์ URL ของเครื่องนี้และของโทรศัพท์ใน Wi-Fi เดียวกัน
- `tests/helpers/journey-dom.js` · `tests/unit/journey-media.test.js` (5) · `journey-presentation.test.js` (8) · `journey-renderer.test.js` (12) · `journey-shell.test.js` (5)
- `docs/changelog/2026-11/2026-11-05-1530-c4-first-look-design-system-glass-hud-stage-and-review-page.md`: บันทึกนี้

### 3.2 ไฟล์ที่แก้ไข (Modified)

- `src/bootstrap/journey-application.js`: เพิ่ม `content()` คืนแพ็กเกจที่ admit แล้วและ identity หลัง boot ให้ presentation อ่าน ไม่ต้อง admit ซ้ำ
- `assets/images/asset-manifest-v2.json`: **ตารางจุดตาต่อภาพตามมติ C4** · `stage.eyeAnchorFromTop` ของตัวละคร 40 ภาพเดิมเป็นค่าประมาณที่ระบุให้ "validate in final renderer" · วัดใหม่ด้วยการอ่านจุดกึ่งกลางตาบนตาราง 0.05 ที่ 1024 px และตรวจด้วยภาพซ้อนเส้นทุกภาพ · เปลี่ยน 36 ภาพ (มากสุดคือแม่กบ 0.30 → 0.20 และพ่อกบ 0.27 → 0.21) · `previewHeightFraction` ปรับตามสูตรของ `verify-visual-assets-v2.py` เพื่อคงค่าพรีวิว 0.60 · `eyeAnchorMethod` ชี้บันทึกนี้ · ไม่แตะไฟล์ภาพ hash ขนาด หรือสถานะการอนุมัติภาพ (`runtimePromoted` ยัง false)
- `tests/unit/architecture.test.js` (+2): หน้าจอ Journey ไม่มี `innerHTML` `outerHTML` `insertAdjacentHTML` `eval` หรือ storage · `src/ui/journey/` import ได้เฉพาะภายในโฟลเดอร์ตัวเอง และ presentation ไม่ import UI
- `src/README.md` ข้อ 6 · `tools/README.md` · `docs/design-system/evidence/README.md`
- `docs/sprints/sprint-05-ssot.md` (สถานะของ T4 · §7) · `docs/dialogue/sprint-05/core-architect-notebook.md` · `docs/dialogue/sprint-05/BOARD.md` (`[S5-012]`) · `CHANGELOG.md`

### 3.3 ไฟล์ที่ลบ (Deleted)

- ไม่มี

## 4. ผลการทดสอบและการตรวจรับ (Verification & Quality Evidence)

| คำสั่งหรือการตรวจ | ผล |
|---|---|
| `node --test 'tests/unit/**/*.test.js'` | ผ่านทั้งหมด 1,302 (เดิม 1,270 · ใหม่ 32) |
| `node tests/docs/check-doc-links.mjs` | ผ่าน ไม่มีลิงก์เสีย |
| coverage ของโมดูลใหม่ | บรรทัด 94–100% ทุกไฟล์ยกเว้น `plain-image-loader.js` ที่ตรวจในเบราว์เซอร์จริง |
| Chromium (Playwright ของเครื่อง cloud) · 6 viewport × ตัวอักษร 100% | 320×568 · 390×844 · 844×390 · 768×1024 · 1440×900 · 1920×1080 · ตาของตัวละครทุกตัวอยู่บนเส้นตา 42% ของจอซึ่งอยู่ในแถบ 32–48% · กล่องบทพูดและการ์ดไม่ล้ำขึ้นแถบใบหน้า · ไม่มีการเลื่อนแนวนอน · console ไม่มี error |
| ตัวอักษร 150% และ 200% | อ่านบทยังเป็นเวทีเต็มจอเมื่อพอดี · ทางเลือกที่ยาวเกินกลายเป็นคอลัมน์เดียวเลื่อนทั้งหน้าพร้อมเวทีเป็นแถบบน · ไม่มีการเลื่อนแนวนอน |
| เล่น Act 1 ทั้งองก์ผ่านหน้าตรวจ | New Game → ศึก R1 สามเทิร์น (ปุ่มหนึ่งคำสั่ง) → แคมป์และสัมผัส (ปุ่มข้ามทั้งฉาก) → ทางเข้า Act 2 · กลับหน้าแรกแล้วมีปุ่มเล่นต่อ · localStorage มีเฉพาะ `jaokob:journey:story.jaokob.core:canonical` และ `:backup` |
| ภาพที่ยังไม่มีทิศที่บทขอ | สองภาพ: `char_jao_kib_tinker_seed_tube` หันซ้าย (A1-11) และ `char_jao_kab_action_knuckle_tap` หันซ้าย (A1-12) · แสดงภาพเดิมไม่สะท้อน · หน้าตรวจแสดงรายการนี้ |

**ยังไม่ได้ตรวจ:** สายตาของ PO · Safari และ iPhone หรือ Android จริง · VoiceOver และ NVDA · ค่าคอนทราสต์ของตัวอักษรบนกระจกที่วัดจากพิกเซลจริงของฉาก · runner ของ `tests/e2e/` ที่บันทึกภาพ 6 viewport × 3 ขนาดเป็นหลักฐาน · forced colors และ prefers-reduced-transparency บนเบราว์เซอร์จริง · ทั้งหมดอยู่ในช่วงหลังจาก PO ให้ความเห็น

## 5. Migration และ Rollback

- ไม่มี migration · เซฟและ schema ไม่เปลี่ยน · `index.html` และ runtime เดิมไม่เปลี่ยน
- ย้อนกลับด้วยการ revert commit นี้ · manifest v2 กลับไปเป็นค่าประมาณเดิมพร้อมกัน

## 6. ความเสี่ยงและสิ่งที่ต้องทำต่อ (Risks & Next Steps)

1. **รอ PO:** ความเห็นต่อวัสดุ ขนาดตัวละคร จังหวะ และการ์ด ก่อนทำส่วนที่เหลือของ C4
2. **หลัง PO เห็นชอบทิศทาง:** วัดคอนทราสต์บนพิกเซลจริง · runner ของ `tests/e2e/` สำหรับ 6 viewport × 100/150/200% · ลดการเคลื่อนไหวและความโปร่งใสบนเบราว์เซอร์จริง · forced colors · ปรับตามความเห็น แล้วปิด C4 และติ๊ก T4
3. **Astra:** ภาพหันซ้ายสองภาพข้างบน (Slice 2 พร้อมภาพจริงสี่ชิ้นที่ alias ไว้) · ตารางจุดตาใน manifest v2 วัดใหม่แล้ว เมื่อส่งภาพใหม่ให้ใส่ค่าที่วัดตามวิธีเดียวกัน
4. **คำของหน้าจอ:** เหตุผลที่กดไม่ได้และข้อความแจ้งเป็นคำชั่วคราวของต้นแบบ ตรวจภาษาพร้อม T6
