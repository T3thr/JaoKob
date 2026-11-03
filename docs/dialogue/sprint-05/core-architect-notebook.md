# Core Architect Notebook · Sprint 5

| ข้อมูล | ค่า |
|---|---|
| **เจ้าของ** | Claude · Supreme Core Architect & Lead Game Systems Engineer (PO มอบหมาย 2026-10-31) |
| **ประเภท** | สมุดทำงานของสถาปนิก **ไม่ใช่ข้อกำหนด** ข้อตัดสินใจที่มีผลต้องย้ายไป ADR หรือ [Sprint 5 SSOT](../../sprints/sprint-05-ssot.md) แล้วเหลือแค่ลิงก์ที่นี่ ตาม [กติกากระดาน §5 ข้อ 3](../README.md) |
| **ฐานที่ตรวจล่าสุด** | `feat/sprint-05-slice-01-foundations` แตกจาก `develop@8643a30` · 2026-11-04 · `develop` เลื่อนไปที่ commit เอกสารของ C0 แล้ว |
| **บันทึก** | [CR-20261031-0545](../../changelog/2026-10/2026-10-31-0545-core-architect-onboarding-and-slice-1-plan.md) เปิดสมุด · [CR-20261031-1500](../../changelog/2026-10/2026-10-31-1500-slice-1-c0-ssot-0-3-0-and-adr-034.md) checkpoint C0 · [CR-20261102-1000](../../changelog/2026-11/2026-11-02-1000-adr-034-accepted-and-c1-start.md) ลงนาม ADR และเริ่ม C1 · [CR-20261102-1015](../../changelog/2026-11/2026-11-02-1015-c1-schema-3-0-0-and-superseded-register.md) C1 ช่วงแรก · [CR-20261102-1025](../../changelog/2026-11/2026-11-02-1025-c1-blueprint-compiler-and-act1-prototype-package.md) C1 ช่วงสอง · [CR-20261104-0340](../../changelog/2026-11/2026-11-04-0340-c2-start-po-decisions-asset-aliases-and-r1-grit-line.md) มติ 2026-11-04 และเริ่ม C2 · [CR-20261104-0400](../../changelog/2026-11/2026-11-04-0400-c2-clash-kernel-shell-and-parity-gate.md) clash kernel และ parity gate |

## 0. วิธีใช้

1. เริ่มรอบใหม่ให้อ่าน §1 สถานะ → §6 คำถามค้าง → §3 งานถัดไป แล้วค่อยเปิด [กระดาน](BOARD.md) จากข้อความล่าสุด
2. สมุดนี้เขียนทับได้ (ไม่ใช่ append-only แบบกระดาน) แก้แล้วปรับวันที่ในตารางหัวเอกสาร
3. เมื่อเกิน 40 KB ให้แตกเป็นไฟล์ย่อยในโฟลเดอร์นี้ และลงทะเบียนใน [README](README.md) ทันที

---

## 1. สถานะที่วัดได้จริง

| เรื่อง | ค่า | วัดอย่างไร |
|---|---|---|
| Checkpoint | **C0 ปิดแล้ว** · **C1 ปิดแล้ว** (Antigravity เห็นชอบ schema 2026-11-04) · การพิสูจน์สองแพ็กเกจย้ายไปทำพร้อม identity ใน C3 · **C2 เริ่ม 2026-11-04** | [SSOT 0.3.0 §4.2](../../sprints/sprint-05-ssot.md) |
| ประวัติ | `main` ยังอยู่ที่ `d3c4c05` ไม่เคย release · PR #19 ถูกใช้แล้ว PR ของ Slice 1 จะเป็น #20 ขึ้นไป | `git log` · GitHub |
| Runtime | Node 22.22.0 · Chromium + Playwright มีในเครื่อง cloud · Ajv 8.17.1 ติดตั้งใน scratchpad ของ session ได้ด้วย `npm install` (ไม่ใช่ dependency ของโครงการ) | ตรวจในเครื่อง |
| Unit | 1,148/1,148 ผ่าน (เดิม 1,060 + journey schema 86 + architecture 2) | `node --test 'tests/unit/**/*.test.js'` |
| เครื่องมือพิสูจน์ | 5/5 ผ่าน · balance model 205 วินาที (73 โหนด · 25,182 จุดเข้าศึก) | `docs/design-system/evidence/*.mjs` |
| เนื้อหาปัจจุบัน | Act 1 เรื่องเดิม · schema 2.0.0 · content 3.0.0 · 28 โหนด · โค้ด `src/` ไม่เปลี่ยนตั้งแต่ `d1af293` (มีแค่ README) | อ่านแพ็กเกจ · `git diff` |
| ขอบเขต Core | TC-S4-ARCH-001 ตรวจ `Math.random(` และ `Date.now(` · TC-S5-STATE-001 ใน `architecture.test.js` ตรวจ `new Date(` และ `performance.now(` (C1) | อ่านเทสต์ |
| Core ใหม่ (C2) | `src/core/domain/clash/` ผ่าน parity 286,174 ตำแหน่งในไม่ถึง 1 วินาที · `src/core/domain/journey/` กติกาค่าสถานะร่วม · coverage บรรทัด 100% branch ≥ 98.5% | `node tools/clash/clash-parity.mjs --check` |
| Design input | Mockups v3 13 จอ · พิกัด handoff · glyph SVG ([S5-003](BOARD.md)) | [v3 README](../../design-system/ux-mockups/v3/README.md) |

---

## 2. ช่องว่างทางเทคนิค

ตารางช่องว่างและข้อขัดกันของ Tier 1 ถูกแก้ด้วย [SSOT 0.3.0 §1.1 และ §1.3](../../sprints/sprint-05-ssot.md) แล้ว · สรุปสั้นที่สุด: runtime เดิมรับได้แค่ Act 1 เรื่องเดิม มาตรวัด 0–100 และมี Game Over ส่วนเป้าหมายต้องการสถานะ 0–5 สายใยสามเส้น แปดชนิดโหนด ศึก แคมป์ สัมผัส ฉากจบสมมาตร Save 2 journey profile และ UI ห้าโหมด

---

## 3. งานถัดไป

แผนที่มีผลอยู่ใน [SSOT 0.3.0 §4](../../sprints/sprint-05-ssot.md) และหลักสถาปัตยกรรมอยู่ใน [ADR-P0-034](../../adr/ADR-P0-034-five-act-journey-runtime-save2-journey-profile-and-blueprint-compiled-content.md) · ส่วนนี้เก็บเฉพาะรายการทำงานของ C1 ที่ยังไม่ใช่ข้อกำหนด

**C1 (เริ่ม 2026-11-02)**

1. ~~ทะเบียน assertion ที่ถูกแทนที่~~ ทำแล้ว: [sprint-05-superseded-assertions.md](../../traceability/sprint-05-superseded-assertions.md)
2. ~~compiler~~ ทำแล้ว ([tools/content/compile-journey.mjs](../../../tools/content/compile-journey.mjs)) · grammar อิงรูปแบบพิมพ์เขียวที่ `five-act-runtime-ledger.mjs` อ่านได้อยู่แล้ว (`### ID · ชื่อ` · บรรทัด metadata แบบ backtick · บรรทัด `>` พร้อมแท็ก `{o:…}` `{t1}` `{resp}` · ตัวเลือก `1. **ก · …**` · กิจกรรม `- **…**`)
3. ~~สเปกกลไกของ Act 1~~ ทำแล้ว ([act1.json](../../design-system/mechanics/act1.json)) จาก `ACT1` ใน `five-act-balance-model.mjs` (A1-03 วิชาเอก · A1-04 ตั้งค่า 5/4/5 · A1-06 ด่าน · R1 · C1 · A1-11 ของสองชิ้น · A1-13 เลือกสาย · Rest Floor ท้ายองก์)
4. ~~schema 3.0.0~~ ทำแล้ว (common · package · save) · ส่ง Antigravity ตรวจใน S5-006
5. ~~`tools/` พร้อม README และแผนที่~~ ทำแล้ว · compiler จะอยู่ที่ `tools/content/`
6. fixture สองแพ็กเกจเวอร์ชันเดียวกัน (ทำพร้อม admission ใน T2/T3)

**ข้อจำกัดที่พบใน validator เดิม:** `type` แบบ array ใช้ไม่ได้ (ต้องใช้ `oneOf` กับ null) · `format` รองรับแค่ `uri` (วันที่ใช้ `pattern`) · union ที่ไม่มี branch ผ่านจะรายงาน path ที่ระดับ union

**การตีความที่ต้องยืนยันใน T4 (ไม่ใช่คำถามถึง PO):** กรอบภาพ Tachie ใช้ครึ่งตัวเป็นค่าเริ่ม (ADR-P0-032 D7.1) ส่วนฉากสองสเกลให้เจ้ากบยืนบนพร็อพโดยเห็นขอบพร็อพใต้เท้าได้ (D7.2 · UX §2.1 · §8.2 จอ 1) และแถบใบหน้ายังเป็นกฎเหนือสุด · PO ตรวจเทียบกับภาพ v3 ตอนรับ C4

---

## 4. ทะเบียนความเสี่ยง (Risk Register)

| ID | ความเสี่ยง | ทางลด | สถานะ |
|---|---|---|---|
| R1 | วันที่ 1 พ.ย. ไม่ชัดว่าเป็นวันเริ่มหรือวันเล่นจริง | มติ Q1: วันเริ่ม Implementation · ขอบเขตเต็ม | ปิด |
| R2 | SSOT 0.2.0 ขัดกับ ADR-032 v2.0/033 | SSOT 0.3.0 (C0) | ปิด |
| R3 | ตัวเลขในมหาพิมพ์เขียวยังไม่ผ่าน PO | มติ Q2 อนุมัติเก้าข้อ · ตัวเลขตรึงสำหรับ T2 | ปิด |
| R4 | ทะเบียน Agent เก่ากว่าคำสั่ง PO | แก้แล้วใน CR-20261031-0545 | ปิด |
| R5 | session ถูกตรึงให้ push เฉพาะ `develop` | มติ Q4 อนุญาต branch ของ Slice 1 | ปิด |
| R6 | closure ในแบบจำลองสมดุลแปลงเป็น JSON แล้วความหมายเพี้ยน | คำศัพท์ปิด (ADR-034 D4) · แบบจำลองอ่าน JSON เดียวกัน (D5) | เปิด |
| R7 | กับดักตอนย้าย engine (คีย์ย่อ · `noLog` · รวม fsu/streak · clamp แสงเริ่ม 1–9 · ล้าง tempo และ ready หลังศึก) | parity ทุกก้าว · `exitClash` ชัดเจน | เปิด |
| R8 | proof ช้าลงเมื่อเพิ่มการตรวจและ freeze | proof ใช้ kernel · runtime ใช้ shell | เปิด |
| R9 | ต้องดูแล engine สองชุดเพื่อเล่นต่อเซฟเก่า | มติ Q3 · ADR-034 D8 namespace เดิมอ่านอย่างเดียว | ปิด |
| R10 | เทสต์เดิมยืนยันพฤติกรรมที่ถูกแทนที่ | ทะเบียน assertion ก่อนลบ (§3 ข้อ 1) | เปิด |
| R11 | ข้อความไทยยาวที่ 200% บนจอ 390×844 ล้นแถบใบหน้า | ทดสอบ 6 viewport × 3 ขนาดตัวอักษร | เปิด |
| R12 | ARIA tabs + roving tabindex + ปุ่ม 1–4 + arm/commit + live region | DOM คงที่ด้วย key · arm ผูก revision | เปิด |
| R13 | คัดลอกบทด้วยมือแล้วเพี้ยน | compiler + drift gate (ADR-034 D6) | เปิด |
| R14 | asset ID และไอคอนยังไม่นิ่ง | glyph SVG และ manifest ของ v3 พร้อมแล้ว · ID ยึดฟิสิกส์ v2 §8 · Astra ไม่อนุมัติ ID ใหม่แทน canon owner | ลดลง |
| R15 | อุปกรณ์จริงและ AT ต้องใช้คน | ขอ PO นัดรุ่นเครื่องตั้งแต่ S1 (Q10) | เปิด |
| R16 | C1 ติดรอการลงนาม ADR-P0-034 | PO ลงนาม 2026-11-02 · Antigravity ตรวจ schema ก่อน merge writer ของเซฟ | ปิด |
| R17 | Slice 1 ใหญ่ขึ้นเพราะรวม Act 1 ต้นแบบและการลบ runtime เดิม | C4 คู่ขนาน C2–C3 · ประเมินใหม่หลัง C2 | เปิด |
| R19 | ภาพ 4 ID ที่พิมพ์เขียว Act 1 อ้างยังไม่มีใน manifest v2 (ดู compile-report) | **มติ PO 2026-11-04:** alias ไปยังภาพที่มีอยู่ (`assetAliases` ใน story.json) · Astra วาดภาพจริงใน Slice 2 · compiler ล้มเมื่อภาพจริงเข้า manifest แต่ alias ยังอยู่ | ปิดชั่วคราว · ติดตามใน S2 |
| R20 | R1 ไม่มีบรรทัดตอบสนองของ `ฝืนรุก` | **มติ PO 2026-11-04:** บรรทัดสำรองในพิมพ์เขียว Act 1 2.0.1 · เกลาใน T6 | ปิด |
| R18 | ชื่อไฟล์ Change Record ของ Astra (`CR-20261031-1326-…`) ไม่ตรงรูปแบบ `YYYY-MM-DD-HHmm-<slug>` | แก้พร้อมลิงก์ตอนตัดเล่มกระดาน (ห้ามแก้สารของคนอื่นบนกระดานที่เปิดอยู่) | เปิด |

---

## 5. บันทึกจากการอ่านโค้ด (Porting Notes)

- `enterClash` clamp แสงเริ่มไว้ 1–9 · Act 5 วางของเป็นอาณาเขต (เฟือง ดับแสงไม่มีผลและแสง +1 · เมล็ด เงาขยายเหลือครึ่ง · สนับ สูดความมืดไม่มีผล · นกหวีดหรือริบบิ้น กระซิบฝันร้ายไม่มีผล) และ `teuk_intel` ให้แสง +1
- ใน `step` อาการโหยหาบ้านทำให้แสงที่ได้ลด `2 × streak` · Act 1 นับ streak แต่ไม่ลงโทษและไม่นับ fsu
- `copy()` คัดลอกตื้น (`items` `ready` `territory` `peace` ใช้ร่วมกัน) ปลอดภัยเพราะ `step` ไม่แก้ค่า แต่ runtime ต้อง freeze
- balance model ส่ง `fsu: 0` เข้าศึกแล้วบวก `end.fsu` กลับ และล้าง `tempo` กับ `ready` หลังศึก · core ต้องทำผ่าน `exitClash` ที่ประกาศชัด
- **C2 (ทำแล้ว):** kernel ใช้ `outcome !== null` แทน `ended` · ไม่มี `notIn: ['R5']` (กติกาอาณาเขตครอบอยู่แล้ว) · ผลเฉียดของ Act 5 ใช้เลของก์ · สูดความมืดเทิร์นสุดท้าย −3 ไม่คูณสอง (ไม่มียกจริงที่เกิด จึงปักด้วยเทสต์ยกสังเคราะห์)
- **ข้อค้นพบในแบบจำลองสมดุล:** `min(streak, 1)` ตอนเข้าศึกลดโทษของการใช้ทักษะครอบครัวครั้งที่สามติดกัน · `min(streak, 2)` ตรงกติกาจริง (ซ้ำสองครั้งขึ้นไปได้แสงเป็นศูนย์เสมอ) ผ่านทุกข้อพิสูจน์ ช่วงค่าเท่าเดิม · ใช้ตอนย้ายแบบจำลองมาใช้ Core
- **รอ S2/S3:** effect แบบมีเงื่อนไขและ `tempo` ยังไม่อยู่ในคำศัพท์ 3.0.0 แต่ Act 2–5 ต้องใช้ (A3-04 · A3-13 intel · A4-01 · A4-08 · A5-05) · การเปิดแท็บของถาดแบบ "ปรากฏแล้วอยู่ตลอดเกม" (UX §3.3 ข้อ 3) ต้องมีสถานะที่บันทึกได้หรือกติกาที่คำนวณได้ ตัดสินใน T8
- ระบบเดิมที่ใช้ต่อได้: flag policy (marker · counter · monotonic) ใน `choice-transaction.js` · โดเมนกระเป๋า `keepsake-pouch.js` (capacity 4 · held · acquired · released · remembered · memory) · transaction แบบ staged/canonical/backup ใน `local-storage-adapter.js` · validator JSON Schema 2020-12 ของโครงการ
- key เดิมของ LocalStorage: `jaokob:save:canonical` · `jaokob:save:staging` · `jaokob:save:backup` · `jaokob:settings` · `jaokob:preferences` (กลายเป็นคลังเซฟเก่าตาม ADR-034 D8)

---

## 6. คำถามที่รอคำตอบ

| # | ถึง | คำถาม | สถานะ |
|---|---|---|---|
| Q1–Q5 | PO | วันที่ · เก้าข้อ · เซฟเก่า · branch · snapshot | **ตอบแล้ว 2026-10-31** บันทึกใน [SSOT §1.2](../../sprints/sprint-05-ssot.md) |
| Q6 | Antigravity | ตรวจสัญญาข้อมูล (มหาพิมพ์เขียว §9 · ADR-034 D3/D4/D7) และร่วมลงนาม ADR-P0-034 | **ตอบแล้ว 2026-11-04** (แจ้งผ่าน PO): เห็นชอบ schema 3.0.0 100% · merge writer ของเซฟได้ · ปลด DoR ของ T1 |
| Q7 | Astra | ไอคอนและ asset ID | **ตอบแล้ว** ใน S5-003: glyph SVG และ manifest พร้อม · ID ใหม่ยังไม่อนุมัติ |
| Q8 | PO | ลงนาม ADR-P0-034 | **ตอบแล้ว 2026-11-02**: ลงนามและเริ่ม C1 · ให้เลื่อน `develop` ไปที่ C0 |
| Q9 | PO | ให้แฟนเล่น Act 1 ต้นแบบตอนจบ S1 เลย หรือรอ Act 1 ที่รับรองแล้วใน S2 | เปิด · ข้อเสนอ: PO เล่นก่อน แล้วตัดสินเอง |
| Q10 | PO | รุ่น iPhone และ Android ที่ใช้ตรวจจริงใน S4 | เปิด · ถามล่วงหน้าเพื่อนัดเวลา |

---

## 7. บันทึกการตัดสินใจ (Decision Log)

| วันที่ | เรื่อง | สถานะ |
|---|---|---|
| 2026-10-31 | เปิดสมุดนี้และ README ของโฟลเดอร์ · ส่ง S5-002 · แก้ทะเบียน Agent ตามคำสั่ง PO | ทำแล้ว · CR-20261031-0545 |
| 2026-10-31 | มติ PO Q1–Q5 · อนุมัติเก้าข้อ · ต้นแบบเว็บแบบ glassmorphism ใน C4–C5 · ข้อ 5 บันทึกตามถ้อยคำในมหาพิมพ์เขียว ("พี่กับแบกน้องกลับ") | บันทึกใน SSOT 0.3.0 §1.2 |
| 2026-10-31 | C0: SSOT 0.3.0 · ADR-P0-034 (proposed) · traceability 0.3.0 · ป้ายอนุมัติในมหาพิมพ์เขียว | ทำแล้ว · CR-20261031-1500 |
| 2026-10-31 | หลัก P1–P7 และแผน C0–C5 ของ CR-0545 | ย้ายไป ADR-P0-034 และ SSOT 0.3.0 §4 แล้ว |
| 2026-10-31 | เซฟเก่า: แยก namespace แทนการคัดลอกไปคลังใหม่ | ADR-P0-034 D8 |
| 2026-10-31 | กำแพงกันสปอยล์: ทางเข้าผู้เล่นมีแค่องก์ที่ promote แล้ว · 13 จอของ v3 อยู่ใน harness ของ PO | ADR-P0-034 D10 |
| 2026-11-02 | PO ลงนาม ADR-P0-034 และสั่งเริ่ม C1 · เลื่อน `develop` ไปที่ commit เอกสารของ C0 | ทำแล้ว · CR-20261102-1000 |
| 2026-11-04 | Antigravity เห็นชอบ schema · alias ภาพสี่ชิ้น · บรรทัดสำรองของ `ฝืนรุก` · สั่งเริ่ม C2 | ทำแล้ว · CR-20261104-0340 · SSOT §1.2 |
