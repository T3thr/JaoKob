# Core Architect Notebook · Sprint 5

| ข้อมูล | ค่า |
|---|---|
| **เจ้าของ** | Claude · Supreme Core Architect & Lead Game Systems Engineer (PO มอบหมาย 2026-10-31) |
| **ประเภท** | สมุดทำงานของสถาปนิก **ไม่ใช่ข้อกำหนด** ข้อตัดสินใจที่มีผลต้องย้ายไป ADR หรือ [Sprint 5 SSOT](../../sprints/sprint-05-ssot.md) แล้วเหลือแค่ลิงก์ที่นี่ ตาม [กติกากระดาน §5 ข้อ 3](../README.md) |
| **ฐานที่ตรวจล่าสุด** | `feat/sprint-05-slice-01-foundations` แตกจาก `develop@8643a30` · ตรวจซ้ำที่ `48d476d` และปิด C3 ที่ `1753764` วันที่ 2026-11-04 · ตรวจซ้ำที่ `1753764` และเริ่ม C4 วันที่ 2026-11-05 · ปิด C4 บนฐาน `f61314a` วันที่ 2026-11-08 · `develop` อยู่ที่ commit เอกสารของ C0 (`0f3cd6d`) |
| **บันทึก** | [CR-20261031-0545](../../changelog/2026-10/2026-10-31-0545-core-architect-onboarding-and-slice-1-plan.md) เปิดสมุด · [CR-20261031-1500](../../changelog/2026-10/2026-10-31-1500-slice-1-c0-ssot-0-3-0-and-adr-034.md) checkpoint C0 · [CR-20261102-1000](../../changelog/2026-11/2026-11-02-1000-adr-034-accepted-and-c1-start.md) ลงนาม ADR และเริ่ม C1 · [CR-20261102-1015](../../changelog/2026-11/2026-11-02-1015-c1-schema-3-0-0-and-superseded-register.md) C1 ช่วงแรก · [CR-20261102-1025](../../changelog/2026-11/2026-11-02-1025-c1-blueprint-compiler-and-act1-prototype-package.md) C1 ช่วงสอง · [CR-20261104-0340](../../changelog/2026-11/2026-11-04-0340-c2-start-po-decisions-asset-aliases-and-r1-grit-line.md) มติ 2026-11-04 และเริ่ม C2 · [CR-20261104-0400](../../changelog/2026-11/2026-11-04-0400-c2-clash-kernel-shell-and-parity-gate.md) clash kernel และ parity gate · [CR-20261104-0420](../../changelog/2026-11/2026-11-04-0420-c2-journey-domain-encounters-session-and-play-mode.md) journey session · [CR-20261104-0440](../../changelog/2026-11/2026-11-04-0440-c2-evidence-on-core-and-balance-gate.md) ปิด C2 · [CR-20261104-0620](../../changelog/2026-11/2026-11-04-0620-c3-journey-save-identity-and-legacy-archive.md) ปิด C3 · [CR-20261105-1430](../../changelog/2026-11/2026-11-05-1430-po-decisions-q11-prototype-digest-and-c4-start.md) มติ 2026-11-05 และเริ่ม C4 · [CR-20261105-1530](../../changelog/2026-11/2026-11-05-1530-c4-first-look-design-system-glass-hud-stage-and-review-page.md) C4 ชิ้นแรกส่ง PO ตรวจ · [CR-20261108-0630](../../changelog/2026-11/2026-11-08-0630-c4-closed-po-review-settings-button-contrast-and-browser-evidence.md) ปิด C4 |

## 0. วิธีใช้

1. เริ่มรอบใหม่ให้อ่าน §1 สถานะ → §6 คำถามค้าง → §3 งานถัดไป แล้วค่อยเปิด [กระดาน](BOARD.md) จากข้อความล่าสุด
2. สมุดนี้เขียนทับได้ (ไม่ใช่ append-only แบบกระดาน) แก้แล้วปรับวันที่ในตารางหัวเอกสาร
3. เมื่อเกิน 40 KB ให้แตกเป็นไฟล์ย่อยในโฟลเดอร์นี้ และลงทะเบียนใน [README](README.md) ทันที

---

## 1. สถานะที่วัดได้จริง

| เรื่อง | ค่า | วัดอย่างไร |
|---|---|---|
| Checkpoint | **C0 · C1 · C2 · C3 ปิดแล้ว** (C3 ปิด 2026-11-04 · T0 T1 T2 `[x]` · T3 ส่งมอบแล้วรอแค่ resolver ของสื่อ Journey ใน C5) · **C4 ปิด 2026-11-08** (T4 `[x]`) · **C5 กำลังทำ** (ลำดับ C5a–C5f ใน §3) | [SSOT 0.3.0 §4.2](../../sprints/sprint-05-ssot.md) |
| ประวัติ | `main` ยังอยู่ที่ `d3c4c05` ไม่เคย release · PR #19 ถูกใช้แล้ว PR ของ Slice 1 จะเป็น #20 ขึ้นไป | `git log` · GitHub |
| Runtime | C4 รันบนเครื่อง cloud (Node 22.23.4 · Chromium + Playwright ติดตั้งไว้แล้ว · ต้องตั้ง `git config --local` เป็น T3thr ทุกครั้งที่เปิด session ใหม่) · C3 รันบนเครื่อง Mac ของ PO (Node 22.23.2) และ PO ยืนยัน 1,270/1,270 บนเครื่องหลัก · Ajv 8.17.1 ติดตั้งใน scratchpad ได้ด้วย `npm install` (ไม่ใช่ dependency ของโครงการ) | ตรวจในเครื่อง |
| Unit | 1,302/1,302 ผ่าน (ปิด C2 ที่ 1,228 · C3 เพิ่ม 42 · C4 เพิ่ม 32) · หลักฐานเบราว์เซอร์ C4: 54 สถานะ 44 ตัวอย่างคอนทราสต์ 0 ล้ม | `node --test 'tests/unit/**/*.test.js'` |
| เครื่องมือพิสูจน์ | 5/5 ผ่าน และเรียกกติกาจาก Core ทั้งหมด · balance model 361 วินาที (73 โหนด · 25,337 จุดเข้าศึก · Act 1 จากแพ็กเกจ) · parity gate ไม่ถึง 1 วินาทีในชุด unit | `docs/design-system/evidence/*.mjs` · `tools/clash/clash-parity.mjs` |
| เนื้อหาปัจจุบัน | Act 1 เรื่องเดิม · schema 2.0.0 · content 3.0.0 · 28 โหนด · โค้ด `src/` ไม่เปลี่ยนตั้งแต่ `d1af293` (มีแค่ README) | อ่านแพ็กเกจ · `git diff` |
| ขอบเขต Core | TC-S4-ARCH-001 ตรวจ `Math.random(` และ `Date.now(` · TC-S5-STATE-001 ใน `architecture.test.js` ตรวจ `new Date(` และ `performance.now(` (C1) | อ่านเทสต์ |
| Core ใหม่ (C2) | `src/core/domain/clash/` ผ่าน parity 286,174 ตำแหน่ง · journey domain encounters session play-mode เล่น Act 1 ต้นแบบได้ครบ 30 เส้นทาง · coverage บรรทัด 100% branch 98% (166 เทสต์) | `node tools/clash/clash-parity.mjs --check` · `tests/unit/journey-*.test.js` |
| ชั้นข้อมูล Journey (C3) | รับแพ็กเกจและ identity · เซฟปิดผนึกใน `jaokob:journey:<package>:*` · ตาราง §3.2 สี่ชั้น · แอป Journey แบบไม่มีหน้าจอ · coverage บรรทัด 100% · mutation 19/19 · คำสั่งพร้อมเซฟ p95 1.6 ms · ซ้อมย้อนกลับกับแอป Sprint 4 ผ่าน | `tests/unit/journey-{package,save,application,legacy-rehearsal}.test.js` |
| Design input | Mockups v3 13 จอ · พิกัด handoff · glyph SVG ([S5-003](BOARD.md)) | [v3 README](../../design-system/ux-mockups/v3/README.md) |
| หน้าจอ Journey (C4) | `src/ui/journey/` + `ui/styles/journey-*.css` + presentation และ media ใน `src/data` + `bootstrap/journey-shell.js` · หน้าตรวจของ PO เล่น Act 1 จบด้วยคำสั่งจริง · ตาอยู่บนเส้นตา 42% ทุก viewport · coverage บรรทัด 94–100% | `tests/unit/journey-{media,presentation,renderer,shell}.test.js` · [หน้าตรวจ](../../design-system/evidence/journey-review/index.html) |

---

## 2. ช่องว่างทางเทคนิค

ตารางช่องว่างและข้อขัดกันของ Tier 1 ถูกแก้ด้วย [SSOT 0.3.0 §1.1 และ §1.3](../../sprints/sprint-05-ssot.md) แล้ว · สรุปสั้นที่สุด: runtime เดิมรับได้แค่ Act 1 เรื่องเดิม มาตรวัด 0–100 และมี Game Over ส่วนเป้าหมายต้องการสถานะ 0–5 สายใยสามเส้น แปดชนิดโหนด ศึก แคมป์ สัมผัส ฉากจบสมมาตร Save 2 journey profile และ UI ห้าโหมด

---

## 3. งานถัดไป

แผนที่มีผลอยู่ใน [SSOT 0.3.0 §4](../../sprints/sprint-05-ssot.md) และหลักสถาปัตยกรรมอยู่ใน [ADR-P0-034](../../adr/ADR-P0-034-five-act-journey-runtime-save2-journey-profile-and-blueprint-compiled-content.md) · ส่วนนี้เป็นลำดับงานของสถาปนิก ไม่ใช่ข้อกำหนด · C1–C4 ปิดแล้ว รายละเอียดอยู่ใน Change Record ของแต่ละ checkpoint

**เริ่มรอบใหม่ (checklist สำหรับใครก็ตามที่รับงานต่อ)**

1. `git config --local user.name T3thr` และ `user.email t.theerapat33@gmail.com` · ห้ามชื่อ Agent ใน commit และห้าม `Co-Authored-By:`
2. `node --test 'tests/unit/**/*.test.js'` และ `node tests/docs/check-doc-links.mjs` ต้องผ่านก่อนเริ่ม
3. ดูหน้าจอจริง: `node tools/dev/serve-review.mjs` แล้วเปิด `/docs/design-system/evidence/journey-review/` · หลักฐานเบราว์เซอร์: `JKB_PLAYWRIGHT_PATH=… node tests/e2e/journey-c4-design-system.mjs` (เครื่อง cloud: `/opt/node-tools/node_modules/playwright/index.js`)
4. แผนผังโค้ดหน้าจอ: แอปไม่มีหน้าจอ `bootstrap/journey-application.js` (C3) → `data/assets/journey-media.js` + `data/content/journey-presentation.js` + `data/localization/th-journey.js` → `ui/journey/journey-renderer.js` และ `ui/journey/components/*` → ประกอบใน `bootstrap/journey-shell.js` · UI import ได้เฉพาะภายใน `ui/journey/` (architecture test) · โหมดที่ยังไม่วาดถูกรายงานเป็น `model.pending` และหน้าตรวจแสดงปุ่มส่งคำสั่งจริง

**C5 (เริ่ม 2026-11-08 · T5) · ลำดับงานย่อย แต่ละข้อจบด้วย commit + CR ของตัวเอง**

| ย่อย | งาน | แทนที่อะไรในหน้าตรวจ | หลักฐาน |
|---|---|---|---|
| C5a | ศึก: `ClashIntentAndGauge` (ป้ายเจตนากระจกฝ้าสีม่วง · เกจแสงเงา 10 ช่อง · หยดนับเทิร์น · อาณาเขต) · `ClashActionTray` (แถวท่าหลัก · สามแท็บ · roving tabindex · ไม่สลับแท็บแทนผู้เล่น) · สามจังหวะ intent → choose → resolve · ยืนยันแบบ inline ผูก revision · ป้าย `แก้ทาง` `ซ้ำ` `ท่าปิดศึก` จาก view ของ Core · CG หลังศึก (R1 · A1-08) | ปุ่มข้ามของ `clash` | `TC-S5-TRAY-001` (UI) · `TC-S5-INLINE-001` · e2e ศึกด้วยคีย์บอร์ด |
| C5b | แคมป์ `CampDropTimer` + การ์ดกิจกรรม + ปุ่มออกเดินทาง · สัมผัส `MicroPrompt` (tap3 · hold · stitch · อัตโนมัติ) · รับของ `PouchSwapSheet` | ปุ่มข้ามของ `camp` `micro` `pouch` | `TC-S5-UX-001` |
| C5c | แผงตั้งค่าจริง (UX §1.9) · modal กระเป๋า · หน้าแรก (เริ่ม · เล่นต่อ · ยินยอมก่อนแทนที่ · ข้อความคลังเซฟเก่าครั้งเดียว) · ฉากจบสามเกลียว (ใช้ได้เมื่อ Act 5 มา แต่ชิ้นส่วนและเทสต์ทำบนแพ็กเกจจิ๋ว) | แผงตั้งค่าและกระเป๋าของหน้าตรวจ · การ์ดหน้าแรกของหน้าตรวจ | `TC-S5-A11Y-001` (modal · Escape · โฟกัสกลับ) |
| C5d | resolver ของสื่อ Journey: อ่านไบต์ same-origin ตรวจ `sha256` และขนาดจาก manifest ผ่าน `content-digest.js` (ต้องเพิ่ม SHA-256 แบบไบต์) แล้วเข้า image cache ด้วย key ของ identity · แทน `plain-image-loader.js` ผ่าน port เดิม → ติ๊ก T3 | ไม่มี | `TC-S5-PACKAGE-001` · `TC-S5-ASSET-001` |
| C5e | `index.html` เปลี่ยนเป็น Journey shell (root และ subpath) · ลบ runtime เดิม เนื้อหา และเทสต์ตาม [ทะเบียน assertion](../../traceability/sprint-05-superseded-assertions.md) §3 ในคราวเดียว · ย้าย TC-S3/S4-ARCH เข้า `architecture.test.js` | ไม่มี | ทะเบียนครบทุกเทสต์ที่ลบ |
| C5f | harness 13 จอของ v3 จากสถานะ engine (ใน `docs/design-system/evidence/` นอก allowlist) · e2e ทุกโหมด คีย์บอร์ดล้วน ลดการเคลื่อนไหว โหลดใหม่กลางศึก root และ subpath · บันทึกการเล่นของ PO → ติ๊ก T5 · เปิด PR ของ Slice 1 สู่ `develop` | ปุ่มข้ามที่เหลือ (ไม่ควรเหลือ) | `TC-S5-UX-001` · `TC-S5-PRESENTATION-001` · `TC-S5-PROTO-001` |

**ข้อควรระวังที่รู้แล้วสำหรับ C5**

1. ภาพหันซ้ายสองภาพยังไม่มี (R24) · ภาพสี่ชิ้นยัง alias (R19) · ผู้เล่นต้นแบบจะเห็นภาพวัยโตของกับและกิบใน A1-01
2. view ของศึกมาจาก `projectClash` ใน `src/core/domain/clash/clash-tray.js` (กลุ่ม basic family friends pouch · ป้ายคำนวณแล้ว) · ห้ามคำนวณป้ายใน UI
3. dock เป็นกล่องคงที่จากใต้แถบใบหน้าถึงขอบล่าง (layout shift 0) · ถาดศึกต้องอยู่ในกล่องนี้ และถ้าไม่พอดีให้ระบบ fit/flow เดิมตัดสิน
4. หน้าตรวจใช้ iframe เดียว เพราะสองสำเนาบน origin เดียวกันจะเขียนเซฟเดียวกัน (แอปจะแจ้ง `save-elsewhere`)

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
| R21 | เซฟต้นแบบผูก digest ของแพ็กเกจ · คอมไพล์บทใหม่แล้วเซฟเดิมกลายเป็น "build อื่น" ที่ถูกเก็บไว้และต้องยินยอมก่อนเริ่มใหม่ | ถูกต้องตาม D7 · แจ้ง PO ก่อนส่งต้นแบบแต่ละรอบ · พิจารณาให้ compiler เตือนเมื่อ digest เปลี่ยนแต่ contentVersion เท่าเดิม (T6) | เปิด · PO รับทราบและเห็นชอบ 2026-11-05 (SSOT §1.2) · คำเตือนของ compiler ยังรอ T6 |
| R22 | การตีความ D7.3 (พอร์ตกลไก transaction และเกราะ race ของ adapter เดิมเข้า `journey-save-repository.js` แทนการเพิ่มตัวเลือกให้ adapter ที่แช่แข็ง) ยังไม่ผ่าน Antigravity | ถามใน S5-010 (Q11) · **Antigravity เห็นชอบ 2026-11-05** (SSOT §1.2) | ปิด |
| R23 | ภาพ Tachie ที่มีจริงเป็น 1024×1024 ไม่ใช่ผ้าใบ 2:3 ของฟิสิกส์ v2 §8.1 ตำแหน่งตาจึงต่างกันทุกภาพ | ตารางจุดตาต่อภาพ (มติ C4) · วัดใหม่ครบ 40 ภาพใน manifest v2 (เดิมเป็นค่าประมาณ ผิดสุด 0.10) · เทสต์ทุก viewport | ลดลง · ภาพใหม่ต้องวัดด้วยวิธีเดียวกัน |
| R24 | บทขอภาพหันซ้ายสองภาพที่ยังไม่มี (`char_jao_kib_tinker_seed_tube` A1-11 · `char_jao_kab_action_knuckle_tap` A1-12) และ manifest ไม่อนุญาตสะท้อนภาพ | แสดงภาพเดิมไม่สะท้อน · หน้าตรวจแสดงรายการ · แจ้ง Astra ใน S5-012 | เปิด · Slice 2 |

---

## 5. บันทึกจากการอ่านโค้ด (Porting Notes)

- `enterClash` clamp แสงเริ่มไว้ 1–9 · Act 5 วางของเป็นอาณาเขต (เฟือง ดับแสงไม่มีผลและแสง +1 · เมล็ด เงาขยายเหลือครึ่ง · สนับ สูดความมืดไม่มีผล · นกหวีดหรือริบบิ้น กระซิบฝันร้ายไม่มีผล) และ `teuk_intel` ให้แสง +1
- ใน `step` อาการโหยหาบ้านทำให้แสงที่ได้ลด `2 × streak` · Act 1 นับ streak แต่ไม่ลงโทษและไม่นับ fsu
- `copy()` คัดลอกตื้น (`items` `ready` `territory` `peace` ใช้ร่วมกัน) ปลอดภัยเพราะ `step` ไม่แก้ค่า แต่ runtime ต้อง freeze
- balance model ส่ง `fsu: 0` เข้าศึกแล้วบวก `end.fsu` กลับ และล้าง `tempo` กับ `ready` หลังศึก · core ต้องทำผ่าน `exitClash` ที่ประกาศชัด
- **C2 (ทำแล้ว):** kernel ใช้ `outcome !== null` แทน `ended` · ไม่มี `notIn: ['R5']` (กติกาอาณาเขตครอบอยู่แล้ว) · ผลเฉียดของ Act 5 ใช้เลของก์ · สูดความมืดเทิร์นสุดท้าย −3 ไม่คูณสอง (ไม่มียกจริงที่เกิด จึงปักด้วยเทสต์ยกสังเคราะห์)
- **ข้อค้นพบในแบบจำลองสมดุล (แก้แล้วใน CR-20261104-0440):** `min(streak, 1)` ทั้งตอนเข้าศึก ตอนสำรวจศึก และใน frontier รวมการพึ่งบ้านครั้งที่สองกับสามเข้าด้วยกัน · ใช้ `min(streak, 2)` ซึ่งตรงกติกาจริง · ผลการเล่นจำลอง 14 แบบเท่าเดิมทุกตัว · ตรวจแล้วว่าเมื่อ engine เดิมใช้ตัวแยกเดียวกัน สถานะปลาย Act 1 ของสองรุ่นตรงกันพอดี
- **ด่านสำรวจศึกแบบ best ไม่ใช่การพิสูจน์แบบ exact:** การตัดตำแหน่งที่ถูกครอบงำสมมติว่าค่าที่มากกว่าดีกว่าเสมอ แต่ Grace คืนค่าเป็นสองหลังฝืนรุก จึงอาจมีตำแหน่งที่ดีกว่าที่ถูกตัดไป · ข้อพิสูจน์แบบ "มีทาง" ยังถูกเพราะทุกสถานะที่เก็บไว้เกิดได้จริง · ข้อพิสูจน์ความปลอดภัยพึ่งโครงสร้างและการเล่นจำลองตามที่หัวไฟล์เขียนไว้
- **การตัดสินใจของ session (C2):** effect ของโหนดลงผลเมื่ออ่านบทของโหนดจบ ไม่ใช่ตอนเข้าโหนด เพื่อให้ cursor ที่ขอบองก์รอก่อน effect ของโหนดที่ยังไม่ promote และการโหลดใหม่ระหว่างบทไม่ลงผลซ้ำ · ตัวเลือกที่ทำแล้วรู้จากรายการประวัติล่าสุดของโหนดนั้น · แคมป์รู้จาก `chosen` · ศึกรู้จาก `lastAction` · ขึ้นองก์ใหม่ล้างลำดับการพึ่งบ้านตามแบบจำลอง
- **รอ S2/S3:** effect แบบมีเงื่อนไขและ `tempo` ยังไม่อยู่ในคำศัพท์ 3.0.0 แต่ Act 2–5 ต้องใช้ (A3-04 · A3-13 intel · A4-01 · A4-08 · A5-05) · การเปิดแท็บของถาดแบบ "ปรากฏแล้วอยู่ตลอดเกม" (UX §3.3 ข้อ 3) ต้องมีสถานะที่บันทึกได้หรือกติกาที่คำนวณได้ ตัดสินใน T8
- ระบบเดิมที่ใช้ต่อได้: flag policy (marker · counter · monotonic) ใน `choice-transaction.js` · โดเมนกระเป๋า `keepsake-pouch.js` (capacity 4 · held · acquired · released · remembered · memory) · transaction แบบ staged/canonical/backup ใน `local-storage-adapter.js` · validator JSON Schema 2020-12 ของโครงการ
- key เดิมของ LocalStorage: `jaokob:save:canonical` · `jaokob:save:staging` · `jaokob:save:backup` · `jaokob:settings` · `jaokob:preferences` (กลายเป็นคลังเซฟเก่าตาม ADR-034 D8)
- **การตัดสินใจของ session (ปิด C4):** dock เป็นกล่องคงที่จากใต้แถบถึงขอบล่างและปล่อยให้แตะทะลุส่วนว่าง เพราะ CLS นับการเลื่อนของกล่องที่ยึดขอบล่าง · กล่องบทพูดสูงพอสามบรรทัดและ padding เท่ากันทุกบรรทัด · toast อยู่ในสามช่องคงที่ · ตัววัดคอนทราสต์ซ่อนตัวอักษรแล้วถ่ายเฉพาะกรอบของ Range ข้อความ (กรอบ element รวมมุมโค้งและวงโฟกัสทำให้ค่าเพี้ยน) · ลดความโปร่งใสจำลองผ่าน CDP `Emulation.setEmulatedMedia` ได้จริง
- **การตัดสินใจของ session (C4 ชิ้นแรก):** เส้นตาอยู่ที่ 42% ของจอ (กลางแถบ 32–48% ค่อนลงให้ตัวละครเต็มเฟรมขึ้น) · ขนาดตัวละครตามจำนวนและแนวจอ · ศูนย์กลางยืนหน้าด้านข้าง ผู้พูดยืนหน้าสุด · เอวจางเข้าเวทีด้วย mask แทนการตัดแข็ง · fit หรือ flow ตัดสินด้วยการวัดใน fit layout เท่านั้น (ไม่ผูกกับขนาดตัวอักษรตรง ๆ) จึงไม่แกว่ง · ประกาศหนึ่งครั้งต่อ revision · Sarabun มีแค่ Regular จึงปิด font-synthesis · ป้ายชนิดใช้พื้นกระดาษเข้มเพื่อไม่ชิงความหมายของสีทอง `แก้ทาง` · ปุ่มลัดตัวเลขแสดงเฉพาะอุปกรณ์ที่มี pointer ละเอียด · หน้าตรวจใช้ iframe เดียวเพื่อไม่ให้สองสำเนาเขียนเซฟเดียวกัน
- **การตัดสินใจของ session (C3):** revision คือชื่อของสถานะเรื่อง จึงเขียนเซฟซ้ำที่ revision เดิมได้เฉพาะ metadata (ตั้งค่า เวลา เหตุผล เวลาเล่นที่ไม่ลด) · ตั้งค่าและ suspend จึงไม่ต้องเพิ่ม revision และไม่ยกเลิกการ์ดที่ arm ไว้ (D9.3) · ระเบียนเสียไม่คุ้มครอง (กู้จากช่องที่ดีแล้วเขียนทับตอน commit ถัดไป) ส่วน unknown และ future คุ้มครองทั้ง namespace · SHA-256 เขียนเองแบบ synchronous เพราะ `crypto.subtle` ไม่มีใน context ที่ไม่ปลอดภัย (มือถือผ่าน LAN) · ตรวจตัวตนก่อน schema · ข้อความแจ้งเซฟสำเร็จไม่มี (แอปคืน `notice` เฉพาะตอนล้ม)

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
| Q11 | Antigravity | ยืนยันการตีความ ADR-034 D7.3 ของ C3 (R22) | **ตอบแล้ว 2026-11-05** (แจ้งผ่าน PO): เห็นชอบ · บันทึกใน [SSOT §1.2](../../sprints/sprint-05-ssot.md) |

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
| 2026-11-04 | C2: กติกาย้ายเข้า Core ผ่าน parity gate · journey session · เครื่องมือพิสูจน์เรียก Core · ตัวตรวจส่งมอบ v3 ตรวจที่ commit ส่งมอบ | ทำแล้ว · CR-20261104-0400 · 0420 · 0440 |
| 2026-11-04 | PO เปิด session ใหม่ด้วยกฎบัตร continuity · Antigravity อนุมัติ API ของ journey-session และ `restore()` ให้ต่อกับ writer · effect มีเงื่อนไขไป Slice 2 · กติกาแท็บถาดไป T8 | รับทราบ · CR-20261104-0620 |
| 2026-11-04 | สถาปนิกเลือก C3 ก่อน C4 · repository ของ Journey แยกจาก adapter ที่แช่แข็ง (R22) · namespace สุดท้าย · ปิด C3 · T1 `[x]` | ทำแล้ว · CR-20261104-0620 · SSOT §3.2 |
| 2026-11-05 | Antigravity ตอบ Q11 (R22 ปิด) · PO เห็นชอบเซฟต้นแบบผูก digest · PO ยืนยัน C3 บนเครื่องหลัก · อนุมัติแผน C4 และการตีความสามข้อ | ทำแล้ว · CR-20261105-1430 · SSOT §1.2 |
| 2026-11-05 | C4 ชิ้นแรก: ระบบออกแบบ กระจกฝ้า HUD เวที การ์ด และหน้าตรวจของ PO · วัดตารางจุดตาใน manifest v2 ใหม่ | ส่ง PO ตรวจ · CR-20261105-1530 |
| 2026-11-07 | PO อนุมัติขนาด วัสดุ จังหวะ · เอวจางที่ 82% · แยกปุ่มตั้งค่า · เกณฑ์คอนทราสต์ 7 : 1 และ 4.5 : 1 · สั่งปิด C4 และเข้า C5 | SSOT §1.2 · CR-20261108-0630 |
| 2026-11-08 | ปิด C4: dock เป็นกล่องคงที่ · toast ช่องคงที่ · runner หลักฐานเบราว์เซอร์ · T4 `[x]` · วางลำดับ C5a–C5f | ทำแล้ว · CR-20261108-0630 |
