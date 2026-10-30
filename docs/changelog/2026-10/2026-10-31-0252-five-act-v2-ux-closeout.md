# Change Record: พิมพ์เขียวห้าองก์ v2.0 สเปกฟิสิกส์และภาพ v2 สเปก UX/UI 2.0 พร้อมหลักฐานพิสูจน์ และผลตรวจภาพต้นแบบ v2

- **รหัสบันทึก (Record ID):** CR-20261031-0252
- **วันและเวลา (Timestamp):** 2026-10-31T02:52:00+07:00
- **รอบการพัฒนา (Sprint/Milestone):** Sprint 5 Planning · ปิดรอบใน [PR #18 → develop](https://github.com/T3thr/JaoKob/pull/18)
- **ผู้ปฏิบัติงาน (Operator/Persona):** Claude Opus 5.5 · Supreme Narrative Architect, Game Systems Mathematician และ Interactive UX/UI Designer (Co-Leadership)
- **สถานะ (Status):** Completed · รอ PO ตรวจรับ เอกสารออกแบบเท่านั้น ไม่แก้ `src/`, schema, save หรือภาพ

---

## 1. วัตถุประสงค์และคำสั่ง (Prompt Objective & Request)

1. **Message #027 (PO และ Antigravity):** ล้างงานค้างที่ PO ปฏิเสธ (เตื๊อกเป็นสุนัข ญาติสมมติ และตุ๊กตาถักตัวที่สอง ซึ่งไม่เคยถูก commit) แล้วสร้างพิมพ์เขียวห้าองก์ v2.0 ตาม ADR-P0-032 v2.0 และ ADR-P0-033 · คำนวณฟิสิกส์สเกล 45 ซม. กับเรขาคณิตแสงเงา และทะเบียนภาพ v2 · พิสูจน์คณิตศาสตร์ด้วยสคริปต์ที่รันผ่านจริง · ออกแบบสเปก UX/UI ห้าโหมดพร้อมใบสั่งงานภาพ
2. **คำขอ 2026-10-31:** ประเมินภาพต้นแบบ v2 ของ Astra (`844b1d8`) ด้านเรื่อง อารมณ์ และ UX · ออกแบบถาดปุ่มศึกที่รับได้ถึง 16 การกระทำ · จัดจังหวะบรรยายศึก และเส้นด้ายฉากจบ · ส่งแนวทางแสง เงา มุมกล้อง และพร็อพสำหรับภาพ v3 · ติดป้าย SUPERSEDED ให้เครื่องมือเก่า ตรวจความสะอาดเอกสาร ซิงก์กับ `feat/sprint-05-planning-ssot` บันทึกประวัติ แล้ว commit และ push เข้า PR #18

## 2. ข้อกำหนดที่ได้รับผลกระทบ (Traceability & Requirement IDs)

- **ADRs:** ADR-P0-032 v2.0 D1–D8 · ADR-P0-033 D0–D5 · ADR-P0-019 · ADR-P0-020 D5 · ADR-P0-021 · ADR-P0-025
- **สัญญาที่อ้างถึง:** [visual-novel-specification.md](../../design-system/visual-novel-specification.md) · [Atomic 05](../../design-system/asset-prompts/05-UX-UI-ATOMIC-COMPONENT-WORKFLOW.md) (อ่านอย่างเดียว)
- **Sprint 5 WBS:** เป็นข้อมูลออกแบบสำหรับ T0, T2, T4, T5 และงานบทของ T6–T13 ยังไม่ปิดรายการใด (production WBS 0/20)

## 3. สิ่งที่ทำและรายการไฟล์ที่เปลี่ยนแปลง (Manifest of Changes)

### 3.1 ไฟล์ที่สร้างใหม่ (Created)

- `docs/design-system/act5-living-keepsake-rewrite-blueprint.md`: Act 5 ครบทุกโหนดถึงหกฉากจบ อาณาเขตผู้พิทักษ์ ตารางประโยคของด้ายที่ยังไม่เปิด และสัญญาฉากจบ
- `docs/design-system/physics-scale-and-visual-v2-specification.md`: ฟิสิกส์สเกล 45 ซม. (ก้าว ขอบฟุตบาท น้ำท่วม แรงต้านน้ำ กระโดด คานงัด เฟือง เสียงในท่อเหล็ก ฟ้าแลบกับฟ้าร้อง) · ตารางเวทีเงาสดของ Act 2 และ Act 5 · ทะเบียนภาพ v2 · แนวทางภาพ v3 §8.7 (กฎเงา มุมกล้องฝั่งโคม สัดส่วนเงาบนผนัง แสงช่วงไฟดับ พร็อพตามช่วงเรื่อง)
- `docs/design-system/interactive-gameplay-ux-ui-specification.md` 2.0.0: สถานะและพฤติกรรมห้าโหมดบน Atomic 05 · ศึกสามจังหวะ (เจตนา เลือก ผล) · ถาดการ์ดศึกแบบแถวท่าหลักกับสามกลุ่มแท็บ · เกลียวฉากจบที่ตรงสมการ · ผลตรวจภาพ v2 ทีละจอ · ตารางจอ v3 13 จอ
- `docs/design-system/evidence/tactical-clash-engine.mjs`: กติกาศึกแบบ deterministic ที่ทุกเครื่องมือใช้ร่วม
- `docs/design-system/evidence/tactical-clash-simulator.mjs`: แจกแจงทุกลำดับการกดของทุกยก
- `docs/design-system/evidence/five-act-balance-model.mjs`: แจกแจงทุกทางเลือกทั้งห้าองก์พร้อมการเล่นจำลอง 14 แบบ
- `docs/design-system/evidence/five-act-runtime-ledger.mjs`: วัดเวลาเล่นจากบทจริงทุกเส้นทาง
- `docs/design-system/evidence/physics-scale-optics-check.mjs`: ข้อพิสูจน์ฟิสิกส์ 52 ข้อ
- `docs/design-system/evidence/ux-v3-screen-states-check.mjs`: สร้างจอศึกของภาพ v3 ขึ้นใหม่ใน engine และยืนยันว่าเกิดได้จริง
- `docs/changelog/2026-10/2026-10-31-0252-five-act-v2-ux-closeout.md`: บันทึกนี้

### 3.2 ไฟล์ที่แก้ไข (Modified)

- `docs/design-system/five-act-narrative-gameplay-master-plan.md` 2.0.0: เขียนใหม่ตาม ADR-P0-032 v2.0 และ ADR-P0-033 · เพิ่มลวดลายเพลงฮัมเพี้ยนของเปี๊ยก · ตาราง E-DAWN ใส่ fsu ≥ 3 ให้ตรงสมการ · เวทีเงาสดครอบคลุม Act 2 · คำสั่งพิสูจน์เพิ่มสคริปต์จอ v3
- `docs/design-system/act1-living-keepsake-rewrite-blueprint.md` ถึง `act4-…` 2.0.0: เขียนใหม่ทั้งองก์ · รอบนี้เพิ่มบรรทัดตอบสนองที่ขาดใน R3 (สนับข้อมือ) และ R4 (ของห้าชิ้นกับท่าประสานสองท่า) · บท A3-08 ใช้ `เคาะราวไม้สามที` ตามสัญญา Atomic 05 · โน้ตเวที A3-13 · โน้ตเวที R2 อ้างตารางเงา Act 2
- `act5-…`: ท่าประสานใน R5 มีเสียงสหายตามคำเรียกระดับ 3 · A5-08 ปิดเรื่องความกลัวด้วยกฎของเงา · เพลงฮัมของเปี๊ยกปิดในทั้งสามฉากจบ
- `docs/design-system/evidence/act1-4-balance-model.mjs` และ `act1-4-runtime-ledger.mjs`: ป้าย SUPERSEDED และหยุดทำงานเมื่อรันโดยไม่ระบุ `--historical` (ผลเดิมรันซ้ำได้ที่ commit `0f97a48`)
- `CHANGELOG.md` · `docs/sprints/sprint-05-ssot.md` §7 · `docs/dialogue/INTER-AGENT-DIALOGUE2.md` (Message #029)

### 3.3 ไฟล์ที่ลบ (Deleted)

- ไม่มี · ร่างที่ PO ปฏิเสธในรอบก่อนไม่เคยถูก commit จึงไม่มีอะไรต้องลบจาก git

## 4. ผลการทดสอบและการตรวจรับ (Verification & Quality Evidence)

| คำสั่ง | ผล |
|---|---|
| `node docs/design-system/evidence/tactical-clash-simulator.mjs` | ผ่าน 12/12 · ไม่มี Game Over · Grace เฉพาะเมื่อฝืนรุก · ชนะขาดได้จากทุกจุดเข้าศึก · ผู้อ่านเจตนาดีกว่ากดรุกอย่างเดียว 18/18 · ชนะขาดไม่เกิน 30% ของลำดับ |
| `node docs/design-system/evidence/five-act-balance-model.mjs` | ผ่านทุกข้อ · 73 โหนด · จุดเข้าศึกต่างกัน 25,182 · 92.9 วินาที · การเล่นจำลอง 14 แบบยืนยันว่าเงื่อนไข E-DAWN ทุกข้อจำเป็นจริง และ Safety Fallback ทำงาน |
| `node docs/design-system/evidence/five-act-runtime-ledger.mjs` | ผ่าน 20/20 · ทุกเส้นทาง 8.5–9.9 นาที · รวมห้าองก์ 44.4–45.9 นาที (ช้าสุด 57.3 · เร็วสุด 36.0) |
| `node docs/design-system/evidence/physics-scale-optics-check.mjs` | ผ่าน 52/52 |
| `node docs/design-system/evidence/ux-v3-screen-states-check.mjs` | ผ่าน 5/5 · จอศึก v3 ทั้งสี่จอเกิดได้จริง และยืนยันว่าสถานะของภาพ v2 จอ R5 เกิดไม่ได้ |
| `node --test tests/unit/*.test.js` | 1,060/1,060 ผ่าน |

**ตรวจเอกสาร:** ไม่มีเครื่องหมายดอลลาร์หรือไวยากรณ์ LaTeX ในเอกสารที่แก้ · ชื่อสะกด เปี๊ยก ทุกจุด · ไม่มีขีด U+2013 หรือ U+2014 ในบรรทัดบทที่ runtime แสดง · ลิงก์ภายในเป็น relative path ทั้งหมด

**ภาพต้นแบบ v2:** เปิดตรวจทั้งสิบจอด้วยตาแล้ว ผลอยู่ใน [สเปก UX §8](../../design-system/interactive-gameplay-ux-ui-specification.md)

## 5. ความเสี่ยงและสิ่งที่ต้องทำต่อ (Risks & Next Steps)

1. **PO:** ตรวจข้อตัดสินใจ canon เก้าข้อใน [มหาพิมพ์เขียว §10](../../design-system/five-act-narrative-gameplay-master-plan.md) และปรับสัญญา Atomic 05 เป็นรุ่นถัดไปตามตารางจอ v3 (ข้อความทุกคำคัดจากบท)
2. **Astra:** สร้างภาพ v3 13 จอตาม [สเปก UX §8.3](../../design-system/interactive-gameplay-ux-ui-specification.md) และ [สเปกภาพ §8.7](../../design-system/physics-scale-and-visual-v2-specification.md) · `ux-mockups/v2/harness/verify_delivery.py` ตรึงไฟล์ของ Claude ไว้ด้วย path ใน worktree เมื่อเอกสารนี้แก้ตามแผน หรือเมื่อ clone ใหม่ การตรวจนั้นจะรายงานว่าไฟล์เปลี่ยน ควรตีความเป็นการตรวจครั้งเดียวตอนส่งมอบ หรือจำกัดให้ตรวจเฉพาะไฟล์ที่ส่งมอบเอง
3. **Antigravity:** สัญญาข้อมูลใน [มหาพิมพ์เขียว §9](../../design-system/five-act-narrative-gameplay-master-plan.md) เป็นข้อเสนอ ยังไม่แก้ schema · คำอธิบาย WBS T6 ใน SSOT §4 ยังพูดถึงตุ๊กตาถักโครเชต์ ซึ่ง ADR-P0-032 v2.0 ห้ามแล้ว ควรปรับถ้อยคำก่อนเริ่มงาน
4. **ไฟล์ทำงานของ Astra ที่ไม่ได้ commit:** `docs/design-system/ux-mockups/v1/{evidence,source,plates}/` 43 ไฟล์อยู่ใน worktree ของ Claude ในสถานะ untracked รอบนี้ไม่แตะและไม่ commit · ไฟล์ซ้ำ 23 ไฟล์ที่ตรงกับ commit `844b1d8` ทุกไบต์ ย้ายไปสำรองใน scratchpad เพื่อให้ fast-forward ได้
5. **ข้อจำกัด:** เวลาเล่นเป็นการประมาณจากความเร็วอ่าน ไม่ใช่การเล่นจริงของคน · การตรวจภาพเป็นการตรวจด้วยตาของ AI ไม่ใช่ art acceptance · ไม่ได้ทดสอบบนอุปกรณ์จริงหรือโปรแกรมอ่านหน้าจอจริง
