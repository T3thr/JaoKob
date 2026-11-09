# Core Architect Notebook · Sprint 5

| ข้อมูล | ค่า |
|---|---|
| **เจ้าของ** | Claude · Supreme Core Architect & Lead Game Systems Engineer (PO มอบหมาย 2026-10-31) |
| **ประเภท** | สมุดทำงานของสถาปนิก **ไม่ใช่ข้อกำหนด** ข้อตัดสินใจที่มีผลต้องย้ายไป ADR หรือ [Sprint 5 SSOT](../../sprints/sprint-05-ssot.md) แล้วเหลือแค่ลิงก์ที่นี่ ตาม [กติกากระดาน §5 ข้อ 3](../README.md) |
| **ฐานที่ตรวจล่าสุด** | `feat/sprint-05-slice-01-foundations` แตกจาก `develop@8643a30` · ตรวจซ้ำที่ `48d476d` และปิด C3 ที่ `1753764` วันที่ 2026-11-04 · ตรวจซ้ำที่ `1753764` และเริ่ม C4 วันที่ 2026-11-05 · ปิด C4 บนฐาน `f61314a` วันที่ 2026-11-08 · C5a ที่ `d7abe70` · C5b `00d819a` · C5c บนฐาน `00d819a` วันที่ 2026-11-08 · C5d บนฐาน `2f6eb8d` · C5e บนฐาน `39bf56b` · C5f บนฐาน `ac6e1ec` วันที่ 2026-11-09 · `develop` อยู่ที่ commit เอกสารของ C0 (`0f3cd6d`) |
| **บันทึก** | [CR-20261031-0545](../../changelog/2026-10/2026-10-31-0545-core-architect-onboarding-and-slice-1-plan.md) เปิดสมุด · [CR-20261031-1500](../../changelog/2026-10/2026-10-31-1500-slice-1-c0-ssot-0-3-0-and-adr-034.md) checkpoint C0 · [CR-20261102-1000](../../changelog/2026-11/2026-11-02-1000-adr-034-accepted-and-c1-start.md) ลงนาม ADR และเริ่ม C1 · [CR-20261102-1015](../../changelog/2026-11/2026-11-02-1015-c1-schema-3-0-0-and-superseded-register.md) C1 ช่วงแรก · [CR-20261102-1025](../../changelog/2026-11/2026-11-02-1025-c1-blueprint-compiler-and-act1-prototype-package.md) C1 ช่วงสอง · [CR-20261104-0340](../../changelog/2026-11/2026-11-04-0340-c2-start-po-decisions-asset-aliases-and-r1-grit-line.md) มติ 2026-11-04 และเริ่ม C2 · [CR-20261104-0400](../../changelog/2026-11/2026-11-04-0400-c2-clash-kernel-shell-and-parity-gate.md) clash kernel และ parity gate · [CR-20261104-0420](../../changelog/2026-11/2026-11-04-0420-c2-journey-domain-encounters-session-and-play-mode.md) journey session · [CR-20261104-0440](../../changelog/2026-11/2026-11-04-0440-c2-evidence-on-core-and-balance-gate.md) ปิด C2 · [CR-20261104-0620](../../changelog/2026-11/2026-11-04-0620-c3-journey-save-identity-and-legacy-archive.md) ปิด C3 · [CR-20261105-1430](../../changelog/2026-11/2026-11-05-1430-po-decisions-q11-prototype-digest-and-c4-start.md) มติ 2026-11-05 และเริ่ม C4 · [CR-20261105-1530](../../changelog/2026-11/2026-11-05-1530-c4-first-look-design-system-glass-hud-stage-and-review-page.md) C4 ชิ้นแรกส่ง PO ตรวจ · [CR-20261108-0630](../../changelog/2026-11/2026-11-08-0630-c4-closed-po-review-settings-button-contrast-and-browser-evidence.md) ปิด C4 · [CR-20261108-0700](../../changelog/2026-11/2026-11-08-0700-c5a-clash-screen-intent-gauge-tabbed-tray.md) C5a ศึก · [CR-20261108-1900](../../changelog/2026-11/2026-11-08-1900-c5b-camp-micro-and-pouch-swap-screens.md) C5b แคมป์ สัมผัส รับของ · [CR-20261108-1930](../../changelog/2026-11/2026-11-08-1930-c5c-settings-pouch-title-and-ending-cards.md) C5c ตั้งค่า กระเป๋า หน้าแรก ฉากจบ · [CR-20261109-0430](../../changelog/2026-11/2026-11-09-0430-c5d-journey-media-resolver-sha256-and-image-budget.md) C5d resolver ของสื่อ ปิด T3 · [CR-20261109-0500](../../changelog/2026-11/2026-11-09-0500-c5e-journey-entry-and-sprint-4-runtime-removed.md) C5e ทางเข้าเริ่มและลบ runtime เดิม · [CR-20261109-0945](../../changelog/2026-11/2026-11-09-0945-c5f-v3-harness-index-e2e-and-media-spoiler-wall.md) C5f หน้าตรวจ 13 จอ E2E และ PR ของ Slice 1 |

## 0. วิธีใช้

1. เริ่มรอบใหม่ให้อ่าน §1 สถานะ → §6 คำถามค้าง → §3 งานถัดไป แล้วค่อยเปิด [กระดาน](BOARD.md) จากข้อความล่าสุด
2. สมุดนี้เขียนทับได้ (ไม่ใช่ append-only แบบกระดาน) แก้แล้วปรับวันที่ในตารางหัวเอกสาร
3. เมื่อเกิน 40 KB ให้แตกเป็นไฟล์ย่อยในโฟลเดอร์นี้ และลงทะเบียนใน [README](README.md) ทันที

---

## 1. สถานะที่วัดได้จริง

| เรื่อง | ค่า | วัดอย่างไร |
|---|---|---|
| Checkpoint | **C0 · C1 · C2 · C3 ปิดแล้ว** (C3 ปิด 2026-11-04 · T0 T1 T2 `[x]`) · **C4 ปิด 2026-11-08** (T4 `[x]`) · **T3 `[x]` 2026-11-09** (resolver ของสื่อใน C5d) · **C5 กำลังทำ** (C5a ศึก · C5b แคมป์ สัมผัส รับของ · C5c ตั้งค่า กระเป๋า หน้าแรก ฉากจบ · C5d resolver ของสื่อ · C5e ทางเข้าเริ่มเป็น Journey และลบ runtime เดิม · C5f หน้าตรวจ 13 จอ E2E บนตัวเกม และกำแพงกันสปอยล์ของสื่อ ส่งแล้ว · **T5 รอการเล่นจริงของ PO (Q12)** · PR ของ Slice 1 เปิดแล้ว) | [SSOT 0.3.0 §4.2](../../sprints/sprint-05-ssot.md) |
| ประวัติ | `main` ยังอยู่ที่ `d3c4c05` ไม่เคย release · PR ของ Slice 1 คือ [#20](https://github.com/T3thr/JaoKob/pull/20) (เปิด 2026-11-09 · ไม่ auto-merge) | `git log` · GitHub |
| Runtime | C5b รันบนเครื่อง Mac ของ PO (Node 22.23.2 · Playwright 1.59.1 แบบ global ที่ `~/.npm-global` · Chromium ที่ cache ไว้คนละรุ่นกับที่ Playwright ต้องการ จึงชี้ด้วย `JKB_CHROMIUM_PATH` แทนการดาวน์โหลด) · C4 รันบนเครื่อง cloud (Node 22.23.4 · Chromium + Playwright ติดตั้งไว้แล้ว · ต้องตั้ง `git config --local` เป็น T3thr ทุกครั้งที่เปิด session ใหม่) · C3 รันบนเครื่อง Mac ของ PO (Node 22.23.2) และ PO ยืนยัน 1,270/1,270 บนเครื่องหลัก · Ajv 8.17.1 ติดตั้งใน scratchpad ได้ด้วย `npm install` (ไม่ใช่ dependency ของโครงการ) | ตรวจในเครื่อง |
| Unit | **430/430 ผ่านหลัง C5f** (C5f เพิ่ม 17) · 413 หลัง C5e (ก่อน C5e 1,349 = 1,265 ข้อระดับบนสุด + 84 ข้อย่อย · C5e ลบ 930 ตัด 20 เพิ่ม 14 ตามทะเบียน) · ก่อนหน้า: ปิด C2 ที่ 1,228 · C3 เพิ่ม 42 · C4 เพิ่ม 32 · C5a เพิ่ม 9 · C5b เพิ่ม 12 · C5c เพิ่ม 11 · C5d เพิ่ม 16 ลบ 1 · หลักฐานเบราว์เซอร์ C4: 54 สถานะ 44 ตัวอย่างคอนทราสต์ 0 ล้ม · C5b: 60 สถานะ · C5c: 50 สถานะ (ทั้งสามรันซ้ำบน loader ของ C5d ผ่าน) · C5d: เล่นครบสองแพ็กเกจโดยไม่มี Web Crypto 0 ล้ม ถือภาพสูงสุด 21.5 MiB | `node --test 'tests/unit/**/*.test.js'` |
| เครื่องมือพิสูจน์ | 5/5 ผ่าน และเรียกกติกาจาก Core ทั้งหมด · balance model 361 วินาที (73 โหนด · 25,337 จุดเข้าศึก · Act 1 จากแพ็กเกจ) · parity gate ไม่ถึง 1 วินาทีในชุด unit | `docs/design-system/evidence/*.mjs` · `tools/clash/clash-parity.mjs` |
| เนื้อหาปัจจุบัน | `index.html` เปิด Journey บน `story.jaokob.core` (Act 1 ต้นแบบ 13 โหนด · schema 3.0.0) ตั้งแต่ C5e · runtime และเนื้อหาเรื่องเดิมถูกลบ (อยู่ใน git ที่ `39bf56b`) | `index.html` · `specs/releases/sprint-05-static-files.json` |
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
3. ดูหน้าจอจริง: `node tools/dev/serve-review.mjs` แล้วเปิด `/docs/design-system/evidence/journey-review/` (`play.html?package=mini` เล่นแพ็กเกจจิ๋วที่มีรับของ กดค้าง เย็บ และฉากจบ) · หลักฐานเบราว์เซอร์: `JKB_PLAYWRIGHT_PATH=… node tests/e2e/journey-c4-design-system.mjs` `journey-c5b-encounters.mjs` และ `journey-c5c-panels.mjs` (เครื่อง cloud: `/opt/node-tools/node_modules/playwright/index.js` · เครื่อง Mac ของ PO: `~/.npm-global/lib/node_modules/playwright/index.js` กับ `JKB_CHROMIUM_PATH` ของ `chromium_headless_shell` ใน `~/Library/Caches/ms-playwright`) · ถ้าใช้ Browser pane ของแอปขณะที่ pane ถูกซ่อน แอนิเมชันจะค้าง ภาพจึงเชื่อไม่ได้ ให้ใช้ runner แทน
4. แผนผังโค้ดหน้าจอ: แอปไม่มีหน้าจอ `bootstrap/journey-application.js` (C3) → `data/assets/journey-media.js` + `data/content/journey-presentation.js` + `data/localization/th-journey.js` → `ui/journey/journey-renderer.js` และ `ui/journey/components/*` → ประกอบใน `bootstrap/journey-shell.js` · UI import ได้เฉพาะภายใน `ui/journey/` (architecture test) · โหมดที่ยังไม่วาดถูกรายงานเป็น `model.pending` และหน้าตรวจแสดงปุ่มส่งคำสั่งจริง

**C5 (เริ่ม 2026-11-08 · T5) · ลำดับงานย่อย แต่ละข้อจบด้วย commit + CR ของตัวเอง**

| ย่อย | งาน | แทนที่อะไรในหน้าตรวจ | หลักฐาน |
|---|---|---|---|
| C5a ✅ | ศึก (ส่งแล้ว CR-20261108-0700): `ClashIntentAndGauge` (ป้ายเจตนากระจกฝ้าสีม่วง · เกจแสงเงา 10 ช่อง · หยดนับเทิร์น · อาณาเขต) · `ClashActionTray` (แถวท่าหลัก · สามแท็บ · roving tabindex · ไม่สลับแท็บแทนผู้เล่น) · สามจังหวะ intent → choose → resolve · ยืนยันแบบ inline ผูก revision · ป้าย `แก้ทาง` `ซ้ำ` `ท่าปิดศึก` จาก view ของ Core · CG หลังศึก (R1 · A1-08) | ปุ่มข้ามของ `clash` | `TC-S5-TRAY-001` (UI) · `TC-S5-INLINE-001` · e2e ศึกด้วยคีย์บอร์ด |
| C5b ✅ | ส่งแล้ว CR-20261108-1900: `CampDropTimer` (ภาชนะของแคมป์) · กระดานกิจกรรมพร้อมบรรทัดผลจาก `effectSummary` ของ Core · แถบเลือกของ · ปุ่มออกเดินทาง · `MicroPrompt` tap3 hold stitch press (มติ PO: แตะครั้งเดียว) และอัตโนมัติ · `PouchSwapSheet` กับ `offerApplies` ของ Core · คำกลาง `เลือกอีกทางไปแล้ว` (มติ PO) | ปุ่มข้ามของ `camp` `micro` `pouch` (ถอดแล้ว) | `TC-S5-UX-001` · `journey-encounter-screens.test.js` · `tests/e2e/journey-c5b-encounters.mjs` |
| C5c ✅ | ส่งแล้ว CR-20261108-1930: `JourneyModal` (dialog แบบ native) กับแผงตั้งค่าและแผงกระเป๋า · เกมรอระหว่างเปิด · หน้าแรกจริง (เล่นต่อไม่เขียน · ยินยอม · เล่นโดยไม่บันทึก · ข้อความครั้งเดียว · ตั้งค่าก่อนเริ่ม) · `ThreeStrandDestinyCard` · การ์ดจบบทพร้อมกลับหน้าแรก | chrome หน้าแรก ตั้งค่า กระเป๋า และปุ่มข้ามของหน้าตรวจ (ถอดหมดแล้ว) | `TC-S5-A11Y-001` · `journey-panels.test.js` · `tests/e2e/journey-c5c-panels.mjs` |
| C5d ✅ | ส่งแล้ว CR-20261109-0430 · T3 `[x]`: `sha256Bytes` · `journey-media-resolver.js` (same-origin · ขนาดจาก header WebP · SHA-256 ทุกไบต์) · image cache กลางด้วย key ของ identity · ลบ `plain-image-loader.js` · lease ตามสิ่งที่อยู่บนจอ (`clear()` · `rest()`) | ไม่มี | `TC-S5-PACKAGE-001` · `TC-S5-ASSET-001` · `tests/e2e/journey-c5d-media.mjs` |
| C5e ✅ | ส่งแล้ว CR-20261109-0500: `index.html` เปิด Journey (root และ subpath · CSP) · ย้าย invariant §2 ครบ · ลบ runtime เนื้อหา และเทสต์ตาม[ทะเบียน](../../traceability/sprint-05-superseded-assertions.md) (930 เทสต์ทีละชื่อใน[รายชื่อเทสต์ที่ลบ](../../traceability/sprint-05-deleted-tests.md)) · allowlist ใหม่และ verifier ซ้อมย้อนกลับ | ไม่มี | ทะเบียนครบทุกเทสต์ที่ลบ · `release-allowlist.test.js` |
| C5f ✅ | ส่งแล้ว CR-20261109-0945: manifest ของสื่อต่อแพ็กเกจ · หน้าตรวจ 13 จอของ v3 จากสถานะ engine ([journey-v3-harness](../../design-system/evidence/journey-v3-harness/index.html)) · E2E บน `index.html` จาก allowlist ทั้ง root และ subpath · ใบหน้าบนการ์ดแบบภาพย่อ · ชื่อฉากไม่ซ้อนป้ายเจตนาเมื่อ Resume · เปิด PR ของ Slice 1 · **ติ๊ก T5 เมื่อได้บันทึกการเล่นของ PO** | ปุ่มข้ามที่เหลือ (ไม่ควรเหลือ) | `TC-S5-UX-001` · `TC-S5-PRESENTATION-001` · `TC-S5-PROTO-001` |

**ข้อควรระวังที่รู้แล้วสำหรับ C5**

1. ภาพหันซ้ายสองภาพยังไม่มี (R24) · ภาพสี่ชิ้นยัง alias (R19) · ผู้เล่นต้นแบบจะเห็นภาพวัยโตของกับและกิบใน A1-01
2. view ของศึกมาจาก `projectClash` ใน `src/core/domain/clash/clash-tray.js` (กลุ่ม basic family friends pouch · ป้ายคำนวณแล้ว) และ `journey-session.view()` เพิ่ม `gauge` `lightSource` `resolved.answered` · ห้ามคำนวณป้ายใน UI · ตัวแปร CSS ของค่าแสงชื่อ `--light-level` (อย่าใช้ `--clash-light` ซึ่งเป็นสีของ Atomic 05)
5. C5a ค้าง: ผลของเจตนาเป็นเม็ดบนป้าย (ต้องมีตารางผลใน Core ก่อน) · แท็บที่ปรากฏแล้วอยู่ตลอดเกม (T8) · เวทีเงาสด R2 R5 (Slice 2–3)
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

ย้ายไปไฟล์ย่อย [core-architect-porting-notes.md](core-architect-porting-notes.md) แล้ว (2026-11-08) · อ่านก่อนแก้กติกาใน Core ชั้นเซฟ หรือหน้าจอ Journey

## 6. คำถามที่รอคำตอบ

| # | ถึง | คำถาม | สถานะ |
|---|---|---|---|
| Q1–Q5 | PO | วันที่ · เก้าข้อ · เซฟเก่า · branch · snapshot | **ตอบแล้ว 2026-10-31** บันทึกใน [SSOT §1.2](../../sprints/sprint-05-ssot.md) |
| Q6 | Antigravity | ตรวจสัญญาข้อมูล (มหาพิมพ์เขียว §9 · ADR-034 D3/D4/D7) และร่วมลงนาม ADR-P0-034 | **ตอบแล้ว 2026-11-04** (แจ้งผ่าน PO): เห็นชอบ schema 3.0.0 100% · merge writer ของเซฟได้ · ปลด DoR ของ T1 |
| Q7 | Astra | ไอคอนและ asset ID | **ตอบแล้ว** ใน S5-003: glyph SVG และ manifest พร้อม · ID ใหม่ยังไม่อนุมัติ |
| Q8 | PO | ลงนาม ADR-P0-034 | **ตอบแล้ว 2026-11-02**: ลงนามและเริ่ม C1 · ให้เลื่อน `develop` ไปที่ C0 |
| Q9 | PO | ให้แฟนเล่น Act 1 ต้นแบบตอนจบ S1 เลย หรือรอ Act 1 ที่รับรองแล้วใน S2 | เปิด · ข้อเสนอ: PO เล่นก่อน แล้วตัดสินเอง |
| Q10 | PO | รุ่น iPhone และ Android ที่ใช้ตรวจจริงใน S4 | เปิด · ถามล่วงหน้าเพื่อนัดเวลา |
| Q12 | PO | เล่น `/` จนจบ Act 1 บนเครื่องหลักและมือถือ แล้วบันทึกอุปกรณ์ เบราว์เซอร์ เวลา และสิ่งที่สะดุด เพื่อปิด DoD ของ T5 และ `TC-S5-PROTO-001` | เปิด 2026-11-09 |
| Q13 | PO | คง AudioPort adapter เสียง และ session-history ไว้จน T7 และแผงประวัติ (ทะเบียน §1) หรือลบตามหลักไร้โค้ดที่ไม่มีผู้ใช้แล้วกู้จาก git ภายหลัง · ข้อเสนอ: คงไว้ | เปิด 2026-11-09 |
| Q14 | PO | ชื่อและไอคอนของหกชิ้นในทะเบียนของแพ็กเกจส่งไปตั้งแต่ Act 1 (ริบบิ้นและนกหวีดได้ใน Act 3–4) จะซ่อนจนองก์นั้น promote หรือไม่ · ข้อเสนอ: ตัดสินใน T6 | เปิด 2026-11-09 |
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
| 2026-11-08 | PO และ Antigravity อนุมัติ C5a · PO ตัดสิน C5b: `press` คือแตะครั้งเดียว · คำกลาง `เลือกอีกทางไปแล้ว` | SSOT §1.2 · UX §4.1 ข้อ 4 · §5 |
| 2026-11-08 | C5b: แคมป์ สัมผัส รับของ · Core เพิ่ม `effectSummary` และ `offerApplies` (ฟิลด์ใหม่ของ view เซฟไม่เปลี่ยน) · หน้าตรวจเปิดแพ็กเกจจิ๋วได้ | ทำแล้ว · CR-20261108-1900 |
| 2026-11-08 | push ของ C5b ถูกปฏิเสธเพราะบัญชี GitHub ที่ active บนเครื่องคือ `3-rapat` · ไม่สลับบัญชีเอง รอ PO | รอ PO |
| 2026-11-08 | C5c: modal ตั้งค่าและกระเป๋า · หน้าแรกจริง · การ์ดฉากจบสามเกลียว · การ์ดจบบท · `I` ทำงานบนปุ่ม · โฟกัสเข้าเกมเมื่อเริ่มจากหน้าแรก · Core เพิ่ม `released` `refused` ใน HUD | ทำแล้ว · CR-20261108-1930 |
| 2026-11-09 | PO เปิด session ใหม่ด้วยกฎบัตร C5d → C5f และสลับ `gh auth` เป็น T3thr แล้ว (push ของ C5b C5c สำเร็จ) · C5d: resolver ของสื่อที่ตรวจ SHA-256 · image cache ผูก identity · lease ตามสิ่งที่อยู่บนจอ · T3 `[x]` · ข้อความกระดานรวบเป็น `[S5-017]` ตอนปิด C5f ตามกฎบัตร | ทำแล้ว · CR-20261109-0430 |
| 2026-11-09 | C5e: `index.html` เปิด Journey · ลบ runtime เดิมตามทะเบียน · คง AudioPort adapter เสียง และ session-history ไว้ตามทะเบียน §1 (ยังไม่มีผู้ใช้ · รอ PO ยืนยัน) · ข้อค้นพบ: manifest ของสื่อที่ส่งยังมีภาพ Act 2–5 → แก้ใน C5f | ทำแล้ว · CR-20261109-0500 |
| 2026-11-09 | C5f: กำแพงกันสปอยล์ของสื่อ · หน้าตรวจ 13 จอ (สถานะสร้างผ่าน admission เซฟจริง และ `restore()` ของ Core) · E2E บนตัวเกมจาก allowlist · ข้อค้นพบจาก harness: ใบหน้าบนการ์ดกินงบภาพจนถาด R4A ล้น → decode ภาพย่อ · ข้อค้นพบจาก E2E: ชื่อฉากซ้อนป้ายเจตนาเมื่อ Resume · ไม่ติ๊ก T5 เพราะ DoD ต้องมีการเล่นจริงของ PO | ทำแล้ว · CR-20261109-0945 |
