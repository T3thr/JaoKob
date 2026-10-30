# Core Architect Notebook · Sprint 5

| ข้อมูล | ค่า |
|---|---|
| **เจ้าของ** | Claude Opus 5.5 · Supreme Core Architect & Lead Game Systems Engineer (PO มอบหมาย 2026-10-31) |
| **ประเภท** | สมุดทำงานของสถาปนิก **ไม่ใช่ข้อกำหนด** ข้อตัดสินใจที่มีผลต้องย้ายไป ADR หรือ [Sprint 5 SSOT](../../sprints/sprint-05-ssot.md) แล้วเหลือแค่ลิงก์ที่นี่ ตาม [กติกากระดาน §5 ข้อ 3](../README.md) |
| **ฐานที่ตรวจล่าสุด** | `develop@e1705ad` · 2026-10-31 |
| **บันทึกที่สร้างสมุดนี้** | [CR-20261031-0545](../../changelog/2026-10/2026-10-31-0545-core-architect-onboarding-and-slice-1-plan.md) |

## 0. วิธีใช้

1. เริ่มรอบใหม่ให้อ่าน §1 สถานะ → §6 คำถามค้าง → §3 แผน แล้วค่อยเปิด [กระดาน](BOARD.md) จากข้อความล่าสุด
2. สมุดนี้เขียนทับได้ (ไม่ใช่ append-only แบบกระดาน) แก้แล้วปรับวันที่ในตารางหัวเอกสาร
3. เมื่อเกิน 40 KB ให้แตกเป็นไฟล์ย่อยในโฟลเดอร์นี้ และลงทะเบียนใน [README](README.md) ทันที

---

## 1. สถานะที่วัดได้จริง (Baseline Facts)

| เรื่อง | ค่า | วัดอย่างไร |
|---|---|---|
| ประวัติ | 46 commits · PR #1–#19 · `main` ยังอยู่ที่ `d3c4c05` (วันแรก) ไม่เคยมี release | `git log` · GitHub |
| เลข PR | **#19 ถูกใช้แล้ว** (keepsake variants, merged 2026-10-19) PR ถัดไปจะเป็น #20 ขึ้นไป | GitHub |
| Runtime | Node 22.22.0 · Chromium + Playwright มีในเครื่อง cloud · ไม่มี Ajv (`JKB_AJV_PATH`) | ตรวจในเครื่อง |
| Unit | 1,060/1,060 ผ่าน · 44 วินาที | `node --test 'tests/unit/**/*.test.js'` |
| ลิงก์เอกสาร | 2,268 ลิงก์ ไม่มีลิงก์เสีย | `node tests/docs/check-doc-links.mjs` |
| เครื่องมือพิสูจน์ | 5/5 ผ่าน · balance model ใช้ 205 วินาที (73 โหนด · 25,182 จุดเข้าศึก) | `docs/design-system/evidence/*.mjs` |
| เนื้อหาปัจจุบัน | Act 1 เรื่องเดิมเท่านั้น · schema 2.0.0 · content 3.0.0 · 1 tree · 28 โหนด (cutscene 18 · exploration 3 · decision 7) · 47 เส้นเชื่อม | อ่าน `act-01.json` |
| ขอบเขต Core | ไม่มี DOM · Storage · การสุ่ม · นาฬิกา ใน `src/core` · TC-S4-ARCH-001 ตรวจ `Math.random(` และ `Date.now(` แล้ว แต่ยังไม่ครอบ `new Date(` และ `performance.now(` | grep + อ่านเทสต์ |

---

## 2. ช่องว่างทางเทคนิค (Technical Delta)

| ด้าน | ปัจจุบัน | เป้าหมายตาม ADR-P0-032 v2.0 · ADR-P0-033 · มหาพิมพ์เขียว 2.0.0 | งาน |
|---|---|---|---|
| เนื้อหา | Act 1 เรื่องกบชีววิทยาเดิม | 5 องก์ · 73 โหนดในแบบจำลองสมดุล + โหนดฉากจบ 6 · ทางแยกจริง 2 จุด · ศึก 6 ยก · แคมป์ 4 · สัมผัส 6 · ฉากจบ 3 | S2–S3 (S1 ใช้ fixture) |
| รับแพ็กเกจ | `prepareRuntimeContent` รับเฉพาะ act 1 · 1 tree · ≤ 256 โหนด · 3 ชนิดโหนด | 8 ชนิดโหนด `vn` `choice` `obstacle` `camp` `clash` `micro` `pouch` `ending-decision` · act 1–5 · ตรวจการอ้างอิงครบ | T1 · T2 |
| สถานะเกม | `metrics {hp, sanity, bond}` 0–100 · flags · events · rng · pouch | `meters {hp, mind, sta}` 0–5 · `bonds {pkam, fiw, teuk}` 0–4 (ครอบครัวคำนวณจากองก์) · counters 5 ตัว · route · plan · major · ready · flags · pouch | T2 |
| ความเสียหาย | crisis → GameOver / Story Assist / Retry (TR-001..020) | Soft Floor · ฝืนเอา → Grace 2/2/2 · Rest Floor ท้ายองก์ · ไม่มี Game Over | T2 |
| ระบบใหม่ | ไม่มี | ศึกแสงปะทะเงา · สี่กุญแจ + บุกทวน · รอจังหวะ · ฝืนเอา · แคมป์หยดน้ำ · สัมผัสโต้ตอบ · รับของแลกของ · ฉากจบสมมาตร + Safety Fallback | T2 |
| ต้นแบบกติกา | [tactical-clash-engine.mjs](../../design-system/evidence/tactical-clash-engine.mjs) ใช้คีย์ย่อ (`bk` `bf` `bt` `fsu`) · ฝังข้อความไทย · ไม่ปฏิเสธการกระทำผิดกติกา | กติกาแหล่งเดียวใน `src/core` และ evidence เรียกใช้ core | T2 |
| เครื่องสถานะ | Title · Cutscene · Exploration · Decision · GameOver · Ending | VN · DECISION · CLASH 5 จังหวะ · CAMP · MICRO · POUCH_SWAP · ENDING · MODAL ([UX §1.7](../../design-system/interactive-gameplay-ux-ui-specification.md)) | T2 · T5 |
| Save | Save 2 schema 2.0.0 ปฏิเสธทุกฟิลด์ที่ไม่รู้จัก · identity คือ contentVersion | Save 2 + journey profile · ผูก package id · version · digest · เก็บสถานะศึกและแคมป์ · snapshot ต้นองก์ · ประวัติฉากจบแยกจากเส้นเวลา | T1 · T3 |
| Session/Media | `Map` ใช้ contentVersion เป็น key | key ประกอบ package id + version + profile | T3 |
| UI | renderer ก้อนเดียว 1,165 บรรทัด · token ของ S4 · มาตรวัด 0–100 · แผง GameOver | token Atomic 05 ที่ PO ล็อก · 11 ชิ้นส่วน · 5 โหมด · ถาด 16 การ์ดแบบแท็บ · silent save · inline confirm | T4 · T5 |
| เทสต์ | 1,060 ผ่าน แต่มีความคาดหวังเก่าที่ถูกแทนที่แล้ว | คง invariant ที่ยังถูก · ทะเบียน assertion ที่ถูกแทนที่พร้อมเทสต์ทดแทน · parity · property | ทุกงาน |

**ข้อขัดกันใน Tier 1 ที่ต้องแก้ก่อนเขียนโค้ด (AGENTS.md §6):** SSOT 0.2.0 เขียนบนฐาน ADR-P0-022 จึงยังพูดถึง Bond 0–100 · HOME ต้อง Bond ≥ 60 · DAWN/NEARBY/HOME · crisis/Assist · ของชุด `item_dew_stone` และตุ๊กตาถักใน T6 ซึ่ง ADR-P0-032 v2.0 และ ADR-P0-033 แทนที่หมดแล้ว และมหาพิมพ์เขียว 2.0.0 ยังมีสถานะ "รอ PO อนุมัติ" งานแรกของ Slice 1 จึงต้องเป็น T0 (SSOT 0.3.0)

---

## 3. แผน Slice 1 Foundations (ข้อเสนอ · รอรับรองใน SSOT 0.3.0)

### 3.1 หลักการ (จะเสนอเป็น ADR-P0-034)

| # | หลัก | ความหมาย |
|---|---|---|
| P1 | **Strangler Fig** | runtime ใหม่ "Journey" โตข้างทางเดิม bootstrap เลือกทางตาม profile ของแพ็กเกจ ไม่เดา · ทางเดิมแช่แข็ง ไม่เพิ่มฟีเจอร์ |
| P2 | **Functional core, validated shell** | kernel บริสุทธิ์ไม่ตรวจไม่ freeze (ให้เครื่องมือพิสูจน์ใช้ เร็ว) · shell ตรวจ input คืน error code ชัดเจน แล้ว deep-freeze output (runtime ใช้) |
| P3 | **แยก Journey กับ Encounter** | สถานะการเดินทางกับสถานะศึก/แคมป์แยกกัน รวมกันผ่าน `exit` ที่ประกาศชัดเท่านั้น ไม่มีกลเม็ดแบบ `fsu: 0` ในโมเดลสมดุล |
| P4 | **กติกาใน core · ตัวเลขในตาราง · ถ้อยคำในเนื้อหา** | ความหมายของเจตนาและการกระทำอยู่ใน core · ตาราง ROUNDS และสเปกด่าน แคมป์ ของ อยู่ในแพ็กเกจ · ชื่อปุ่มตามฉากและบรรทัดตอบสนองมาจากพิมพ์เขียว |
| P5 | **คำศัพท์ปิด (closed vocabulary)** | effect และ condition เป็นชุดคำสั่งจำกัดที่ schema ตรวจได้ ไม่มี closure หรือ expression ใน JSON (AGENTS.md §9) |
| P6 | **UI ไม่คิดกติกา** | ป้าย `แก้ทาง` `ซ้ำ` ราคา เหตุผลที่กดไม่ได้ การเปิดแท็บ เกลียวฉากจบ คำนวณใน core หรือ projection ทั้งหมด |
| P7 | **ไม่มีการสุ่ม** | journey profile ไม่มี RNG เพราะกติกาไม่สุ่ม · นาฬิกามาทาง port เท่านั้น · ขยาย arch test ให้ครอบ `new Date(` และ `performance.now(` เพิ่มจากที่ตรวจอยู่ |

### 3.2 ผังโมดูลที่เสนอ

```text
src/core/domain/journey/     journey-state · meter-rules (soft floor · grit · grace · rest floor) · homesick · bonds · endings
src/core/domain/clash/       clash-actions (ความหมายการกระทำและเจตนา) · clash-kernel · clash-engine (shell) · clash-projection (กลุ่มถาด · แก้ทาง · ซ้ำ)
src/core/domain/encounters/  obstacle · camp · micro · pouch-offer
src/core/use-cases/          journey-session (advance · choose · clashAct · campPick · campLeave · microDone · pouchDecide · chooseEnding · replayAct)
src/core/state-machine/      play-mode (เครื่องสถานะโหมดตาม UX §1.7)
src/data/                    journey admission · journey save validator · localization ของโหมดใหม่ · composite session identity
src/ui/journey/              renderer ตามโหมด · screens · components ตาม UX §1.1 · behaviors (tablist · roving tabindex · inline confirm · live announcer)
src/ui/renderers/dom/        renderer เดิมของ S4 (แช่แข็ง)
```

### 3.3 การย้าย Tactical Clash Engine

1. **ย้ายกติกาเป็น kernel** ใน `src/core/domain/clash/` โดยเปลี่ยน `th:` เป็น label key · item ใช้ ID เต็มตามทะเบียน ([ฟิสิกส์ v2 §8](../../design-system/physics-scale-and-visual-v2-specification.md)) · ally ใช้ `pkam` `fiw` `teuk`
2. **shell** ปฏิเสธ: action ที่ไม่อยู่ใน `listActions` · ศึกที่จบแล้ว · roundId ไม่รู้จัก · จังหวะผิด (`CLASH_ACTION_ILLEGAL` `CLASH_ENDED` `CLASH_ROUND_UNKNOWN` `CLASH_BEAT`)
3. **Parity gate:** เทียบ kernel ใหม่กับ evidence เดิมทุกลำดับการกดจากจุดเข้าศึก 18 จุดของ simulator ต้องได้สถานะเหมือนกันทุกก้าว แล้วจึงเปลี่ยน evidence ให้ import จาก core (เหลือกติกาแหล่งเดียว) และรัน balance model ใหม่ให้ผ่าน
4. **Capacity invariant:** ทุกตำแหน่งศึกที่ไปถึงได้ กลุ่มถาดต้องไม่เกิน ท่าหลัก 4 · ครอบครัว 5 · สหาย 3 · ของ·ผสาน 6 และรวมกันเท่ากับ `listActions` พอดี

### 3.4 คำศัพท์ effect และ condition (ร่าง T1)

แปลงทุก closure ใน [five-act-balance-model.mjs](../../design-system/evidence/five-act-balance-model.mjs) เป็นคำสั่งปิด:

| กลุ่ม | คำสั่ง |
|---|---|
| ค่าสถานะ | `meter.set` (A1-04 โตเป็นกบหนุ่ม) · `meter.add` (clamp 0–5) · `meter.hazard` (soft floor ไม่ต่ำกว่า 1) · `floor.rest` |
| สายใยและธง | `bond.add` (cap 4) · `flag.set` |
| ทางเลือกถาวร | `pick.major` · `pick.route` · `pick.plan` |
| ของ | `item.grant` · `item.ready` · สเปก `pouch` (`take` · `take-release` พร้อมผู้รับ · `refuse` เป็นความทรงจำ) |
| ด่าน | สเปก `obstacle` (`skills` · `siblings` · `item` · `combo` · `friend` · `alone {sta, needSta}` · `rush` · `wait` · `grit` + effect เสริมรายทาง) |
| แคมป์ | สเปก `camp` (`budget` · `activities[] {key, group, when, effects}`) |
| เงื่อนไข | `has-item` · `flag` · `meter ≥` · `bond ≥` · `act` · `all` · `any` · `not` |

เป้าหมายระยะยาว: balance model อ่าน JSON ชุดเดียวกับ runtime ความยุติธรรมจึงพิสูจน์บนเนื้อหาจริง ไม่ใช่บนสำเนาที่เขียนมือ

### 3.5 Save Format 2 · journey profile (ร่าง T0/T1)

```text
saveFormatVersion: 2
profile: journey-1              ไม่มีฟิลด์นี้ = legacy profile ตาม schema 2.0.0 เดิม
package: { id: story.jaokob.core, contentVersion, digest }
contentVersion · revision · createdAt · savedAt · reason · settings · integrity   ความหมายเดิม
payload:
  sessionId · startedAt · playTimeMs
  cursor     { nodeId, beat, line }                จุดอ่านเชิงความหมาย ไม่ใช่เลขหน้า CSS
  journey    { act, meters, bonds, counters, route, plan, major, pouch, flags }
  encounter  null | clash { roundId, turn, light, used, dim, charged, weak, regroup, grace, gritUsed, homesick }
                  | camp { campId, dropsLeft, chosen }
  actStarts  ≤ 5 snapshot สำหรับเล่นซ้ำรายองก์
  completion { endingsSeen }                       ไม่ถูกย้อนเมื่อเล่นซ้ำ
  history    ≤ 200 รายการ
```

- บันทึกเงียบทุกครั้งที่ commit การกระทำ รวมทุกเทิร์นศึกและทุกกิจกรรมแคมป์ จึงย้อนผลด้วยการโหลดใหม่ไม่ได้ และกลับมาเล่นต่อได้ตรงจังหวะ
- อ่าน legacy ด้วย validator เดิมที่ไม่แก้ไบต์ · profile ไม่รู้จักหรือเสีย: เก็บ raw ไว้ครบ แล้วเสนอเล่นในหน่วยความจำหรือเริ่มใหม่โดยขอความยินยอม
- ขนาดประมาณไม่เกิน 10 KB จากเพดาน 250 KB

### 3.6 โครง UI ของถาด 16 การ์ด `<ClashActionTray />`

```text
<ClashScreen>                       โหมดศึก 5 จังหวะ
  <TopHudCapsule/>
  <ClashIntentAndGauge/>            ป้ายเจตนา · เกจ 10 ช่อง · หยดนับเทิร์น · อาณาเขต · ชิปเจตนาล่วงหน้า
  <ShadowStage/> หรือ <LightAura/>  R2 · R5 ใช้เงาสด · ยกอื่นใช้รัศมีแสง
  <SaaDialogueCard/>
  <ClashActionTray role=group>
    <ActionRow basic/>               ≤ 4 ใบ แสดงตลอด · ปุ่ม 1–4
    <TrayTabList role=tablist/>      ครอบครัว · สหาย · ของ·ผสาน · ตำแหน่งคงที่ · เครื่องหมาย แก้ทาง · โหยหาบ้าน · ท่าผสาน
    <TrayTabPanel role=tabpanel/>    ตาราง 2×3 จองสามแถวเสมอ · สลับ 120 ms · layout shift 0
```

- **ข้อมูลเข้า:** view model จาก `clash-projection` (UX §1.8) ที่บอกกลุ่ม การ์ด ป้าย ราคา และ `revealed` ของแต่ละแท็บ · กติกาการเปิดแท็บครั้งแรก (UX §3.3 ข้อ 3) ต้องคำนวณได้จากสถานะ journey ที่บันทึกไว้ UI ไม่ต้องจำประวัติเอง · กำหนดสูตรแน่นอนใน T0
- **สถานะเฉพาะ UI ไม่บันทึกลง save:** แท็บที่เปิด · การ์ดที่โฟกัส · การ์ดที่ arm ไว้ · เริ่มที่ครอบครัวทุกศึกและจำแท็บตลอดศึก ห้ามสลับแท็บแทนผู้เล่น
- **DOM คงที่ด้วย key ของการ์ด** อัปเดตค่าในที่เดิม โฟกัสไม่หายเมื่อเปลี่ยนจังหวะ
- **จอกว้าง ≥ 1200 px** แสดงสี่คอลัมน์พร้อมกันด้วยชิ้นส่วนเดียวกัน (ไม่มี tablist) ตาม UX §3.4
- **การ arm:** ผูกกับ revision ของสถานะ เปลี่ยนจังหวะแล้วยกเลิกเอง กันการกดรัวและกดซ้ำ

### 3.7 ลำดับ checkpoint ภายใน PR ของ Slice 1

| # | งาน | ส่งมอบ | เกณฑ์ผ่าน |
|---|---|---|---|
| C0 | T0 | SSOT 0.3.0 · ADR-P0-034 (proposed) · บันทึกมติ PO ตาม [มหาพิมพ์เขียว §10](../../design-system/five-act-narrative-gameplay-master-plan.md) · ทะเบียน assertion ที่ถูกแทนที่ · รายการ control ที่ release ต้องมี | PO อนุมัติ SSOT 0.3.0 และ ADR-P0-034 · Antigravity ตรวจสัญญาข้อมูล §9 |
| C1 | T1 | schema 3.0.0 (journey package · journey save profile) ใน validator ของโครงการ · fixture บวกและลบ · แพ็กเกจจิ๋วที่ครบ 8 ชนิดโหนดและทุกคำสั่ง · fixture สองแพ็กเกจเวอร์ชันเดียวกัน | TC-S5-SCHEMA-001 · ไบต์ schema ที่ตีพิมพ์แล้วไม่เปลี่ยน |
| C2 | T2 | journey domain · clash kernel/shell · encounters · journey-session · play-mode · arch test เข้มขึ้น · evidence ชี้ไป core | parity 100% · capacity invariant · TC-S5-STATE-001 · TC-S5-ENDING-001 (fixture) · coverage core ≥ 90% บรรทัด ≥ 85% branch |
| C3 | T3 | journey save validator · ตาราง admission · composite identity · บันทึก encounter · snapshot ต้นองก์ · ซ้อมแอปเก่าปฏิเสธและไม่เขียนทับ | TC-S5-SAVE-001/002 · TC-S5-REPLAY-001 (fixture) · Resume ไม่เขียน |
| C4 | T4 | token Atomic 05 · HUD เม็ดสถานะและด้ายสายใย · การ์ดเดียวทั้งเกม · เวที Tachie · silent save · reduced motion และ intensity · ตัวอักษร 200% | TC-S5-VN-001 · TC-S5-HUD-001 · TC-S5-SILENT-001 · ภาพ 6 viewport |
| C5 | T5 | การตัดสินใจแบบ inline · จอศึกและถาดแท็บ · แคมป์ · สัมผัส · รับของ · ฉากจบสามเกลียว · ตั้งค่าใหม่ · E2E บน fixture (ทุกโหมด · คีย์บอร์ดล้วน · reload กลางศึก) | TC-S5-INLINE-001 · TC-S5-UX-001 · TC-S5-PRESENTATION-001 · PO ทดลองเล่นจริง |

C4 ทำคู่ขนานกับ C2–C3 ได้ เพราะ UI รับ view model ที่ตกลงรูปไว้ตั้งแต่ C0 · ค่าเริ่มของ production ยังเป็นเนื้อหาเดิมจนกว่า S2 จะ promote แพ็กเกจใหม่ ตาม SSOT §4.1

---

## 4. ทะเบียนความเสี่ยง (Risk Register)

| ID | ความเสี่ยง | ผล | ทางลด | สถานะ |
|---|---|---|---|---|
| R1 | "1 พฤศจิกายน" เป็นวันเริ่ม Implementation หรือวันที่ต้องเล่นได้จริง ยังไม่ชัด | ถ้าเป็นวันเล่นจริง แผน 20 งานเป็นไปไม่ได้ ต้องตัดเป็นเส้นทางของขวัญ | ถาม PO (§6 Q1) | เปิด |
| R2 | Tier 1 ขัดกัน: SSOT 0.2.0 ยุค ADR-022 กับ ADR-032 v2.0/033 | เขียนโค้ดผิดกติกา | C0 ทำ SSOT 0.3.0 ก่อนโค้ด | เปิด |
| R3 | มหาพิมพ์เขียว §10 ยังไม่ผ่าน PO แต่ตัวเลขจะถูกฝังใน core | ทำซ้ำเมื่อ PO แก้ | ขอมติก่อน C2 · ตารางเป็นข้อมูล แก้ถูก · proof เป็น regression | เปิด |
| R4 | คำอธิบายบทบาทใน AGENT-REGISTRY เก่ากว่าคำสั่ง PO | Agent อื่นเข้าใจผิดว่าห้ามแตะ core | แก้ทะเบียนแล้วใน CR-20261031-0545 | ปิด |
| R5 | session cloud นี้ถูกตรึงให้ push เฉพาะ `develop` แต่ AGENTS.md §5 และ SSOT ให้ใช้ `feat/sprint-05-slice-01-foundations` | ผิดกติกา branch | ขอ PO อนุญาต branch นี้ก่อน C1 | เปิด |
| R6 | closure ใน balance model แปลงเป็น JSON แล้วความหมายเพี้ยน | พิสูจน์ความยุติธรรมไม่ตรงเกมจริง | คำศัพท์ปิด · ให้ balance model อ่าน JSON เดียวกัน | เปิด |
| R7 | กับดักตอนย้าย engine (คีย์ย่อ · `noLog` · การรวม fsu/streak · clamp แสงเริ่ม 1–9 · ล้าง tempo และ ready หลังศึก) | บั๊กเงียบ | parity ทุกก้าว · `exitClash` ชัดเจน | เปิด |
| R8 | proof ช้าลงเมื่อเพิ่มการตรวจและ freeze (ตอนนี้ 205 วินาที) | gate ช้า | proof ใช้ kernel · runtime ใช้ shell · แยก design gate ออกจาก unit | เปิด |
| R9 | ต้องดูแล engine และ renderer สองชุดเพื่อเล่นต่อ save เรื่องเดิม ทั้งที่ `main` ไม่เคย release | งานซ้ำ ขนาด artifact | เสนอ CR ให้เก็บ raw + ขอยินยอมเริ่มเรื่องใหม่ แทนการเล่นต่อเรื่องเดิม (§6 Q3) | เปิด |
| R10 | เทสต์เดิมบางส่วนยืนยันพฤติกรรมที่ถูกแทนที่ | ไม่กล้าแก้ หรือแก้แบบไม่มีร่องรอย | ทะเบียน assertion ที่ถูกแทนที่ + เทสต์ทดแทนทุกข้อ (SSOT §5.3) | เปิด |
| R11 | ข้อความไทยยาวที่ 200% บนจอ 390×844 ล้นแถบใบหน้า | UX พัง | ทดสอบ 6 viewport × 3 ขนาดตัวอักษรด้วยป้ายที่ยาวที่สุด | เปิด |
| R12 | ARIA tabs + roving tabindex + ปุ่ม 1–4 + arm/commit + live region | โฟกัสหาย กดซ้อน ประกาศซ้ำ | DOM คงที่ด้วย key · arm ผูก revision · ประกาศครั้งเดียวต่อเหตุการณ์ | เปิด |
| R13 | ปริมาณบทและบรรทัดตอบสนองทุกการ์ดทุกยก ถ้าคัดลอกมือจะผิด | ข้อความเพี้ยนจากพิมพ์เขียว | เสนอ compiler จากพิมพ์เขียวเป็น JSON ที่ตรวจย้อนกลับได้ (S2 · ทดลองใน S1) | เปิด |
| R14 | Asset ID และไอคอน (UX §8.4) ยังไม่นิ่ง | UI ต้องรอ | ล็อก ID ตามฟิสิกส์ v2 §8 · ขอชุดไอคอนจาก Astra ก่อน C4 | เปิด |
| R15 | อุปกรณ์จริง iOS/Android และ AT ต้องใช้คน | S4 ค้าง | นัดเวลาตั้งแต่ S1 | เปิด |

---

## 5. บันทึกจากการอ่านโค้ด (Porting Notes)

- `enterClash` clamp แสงเริ่มไว้ 1–9 · Act 5 วางของเป็นอาณาเขต (เฟือง ดับแสงไม่มีผลและแสง +1 · เมล็ด เงาขยายเหลือครึ่ง · สนับ สูดความมืดไม่มีผล · นกหวีดหรือริบบิ้น กระซิบฝันร้ายไม่มีผล) และ `teuk_intel` ให้แสง +1
- ใน `step` อาการโหยหาบ้านทำให้แสงที่ได้ลด `2 × streak` · Act 1 นับ streak แต่ไม่ลงโทษและไม่นับ fsu
- `copy()` คัดลอกตื้น (`items` `ready` `territory` `peace` ใช้ร่วมกัน) ปลอดภัยเพราะ `step` ไม่แก้ค่า แต่ runtime ต้อง freeze
- balance model ส่ง `fsu: 0` เข้าศึกแล้วบวก `end.fsu` กลับ และล้าง `tempo` กับ `ready` หลังศึก · core ต้องทำผ่าน `exitClash` ที่ประกาศชัด
- ฝาแฝดของกฎ "ใครยืนใกล้แสง เงาใหญ่กว่า" อยู่ที่ [ฟิสิกส์ v2 §6](../../design-system/physics-scale-and-visual-v2-specification.md) · เวทีเงาเป็น projection ล้วน ไม่กระทบสถานะ
- ระบบเดิมที่ใช้ต่อได้: กติกา flag policy (marker · counter · monotonic) ใน `choice-transaction.js` · โดเมนกระเป๋า `keepsake-pouch.js` · transaction แบบ staged/canonical/backup ใน `local-storage-adapter.js` · validator JSON Schema 2020-12 ของโครงการ

---

## 6. คำถามที่รอคำตอบ

| # | ถึง | คำถาม | ข้อเสนอของผม |
|---|---|---|---|
| Q1 | PO | วันที่แฟนต้องได้เล่นจริงคือวันไหน | ถ้าใกล้ ให้ตัดเป็นเส้นทางของขวัญที่ครบห้าองก์ก่อน แล้วเลื่อน 3D และอุปกรณ์จริงไปหลังวันนั้น |
| Q2 | PO | อนุมัติเก้าข้อใน [มหาพิมพ์เขียว §10](../../design-system/five-act-narrative-gameplay-master-plan.md) | ใช้ตามข้อเสนอทั้งเก้าข้อ |
| Q3 | PO | เลิกเล่นต่อ save เรื่องเดิมได้ไหม (เก็บ raw ไว้ครบและขอยินยอมเริ่มใหม่) | ได้ เพราะ `main` ไม่เคย release |
| Q4 | PO | อนุญาต branch `feat/sprint-05-slice-01-foundations` สำหรับ Slice 1 | อนุญาต |
| Q5 | PO | เล่นซ้ำจากต้นทุกองก์ (5 snapshot) แทนเฉพาะ Act 4/5 | ใช้ ทุก snapshot เล็กมาก |
| Q6 | Antigravity | ตรวจสัญญาข้อมูล §9 และร่าง Save2 journey profile §3.5 | ร่วมอนุมัติ ADR-P0-034 |
| Q7 | Astra | ชุดไอคอน UX §8.4 · ภาพ v3 13 จอเมื่อ PO สั่ง · ยืนยัน asset ID | ส่ง SVG ไอคอนก่อน C4 |

---

## 7. บันทึกการตัดสินใจ (Decision Log)

| วันที่ | เรื่อง | สถานะ |
|---|---|---|
| 2026-10-31 | เปิดสมุดนี้และ README ของโฟลเดอร์ · ส่ง [S5-002] · แก้ทะเบียน Agent ตามคำสั่ง PO | ทำแล้ว · CR-20261031-0545 |
| 2026-10-31 | หลัก P1–P7 และแผน C0–C5 | ข้อเสนอ · รอ SSOT 0.3.0 และ ADR-P0-034 |
