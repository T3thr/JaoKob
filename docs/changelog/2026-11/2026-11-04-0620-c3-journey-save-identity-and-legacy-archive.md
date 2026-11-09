# Change Record: C3 · Save 2 journey profile · identity ประกอบ · คลังเซฟเก่าแบบอ่านอย่างเดียว · ปิด C3

- **รหัสบันทึก (Record ID):** CR-20261104-0620
- **วันและเวลา (Timestamp):** 2026-11-04T06:20:00+07:00
- **รอบการพัฒนา (Sprint/Milestone):** Sprint 5 · Slice 1 · checkpoint C3 (T3) และงานที่ค้างของ T1
- **ผู้ปฏิบัติงาน (Operator/Persona):** Claude · Supreme Core Architect & Lead Game Systems Engineer
- **สถานะ (Status):** Completed · C3 ปิด · T1 `[x]` · T3 ส่งมอบครบทุกข้อยกเว้น resolver ของสื่อ Journey ซึ่งเกิดใน C5 บน identity เดียวกัน

---

## 1. วัตถุประสงค์และคำสั่ง (Prompt Objective & Request)

PO เปิด session ใหม่ด้วยกฎบัตร "Sovereign Architectural Awakening & Continuity Charter" ให้สถาปนิกอ่านร่องรอยของตัวเองจนถึง `48d476d` ตรวจสภาพจริง แล้วเลือกและขับเคลื่อนงานถัดไปของ Slice 1 เอง · มติที่ส่งมาพร้อมกฎบัตร: Antigravity ตรวจ API ของ `journey-session.js` และ `restore()` แล้ว อนุมัติให้ต่อกับชั้นเซฟของ C3 · effect แบบมีเงื่อนไขห้าจุดเลื่อนไป Slice 2 · กติกาแท็บของถาดตัดสินใน T8

**เลือก C3 ก่อน C4 เพราะ** ทางเข้าเริ่มของ C5 ต้องมีชั้นข้อมูลนี้ · พิสูจน์ได้ด้วยเครื่องทุกข้อ · ปิดการพิสูจน์สองแพ็กเกจเวอร์ชันเดียวกันที่ค้างจาก T1 · ส่วน C4 ต้องให้ PO ตรวจภาพเทียบ v3 จึงเป็นรอบถัดไป

## 2. ข้อกำหนดที่ได้รับผลกระทบ (Traceability & Requirement IDs)

- **ADRs:** ADR-P0-034 D1 (บูตจากแพ็กเกจที่ตรวจแล้ว) · D6.4 (ตัวตนแพ็กเกจและ digest) · D7 (Save Format 2 journey profile · transaction · namespace · ไม่รู้จักและมาจากอนาคต) · D8 (คลังเซฟเก่า) · ADR-P0-014 (Resume ไม่เขียน · ความยินยอมก่อนเขียนทับ) · CR-0006 §2 (`story.jaokob.core` สงวนไว้)
- **Sprint 5 WBS:** T1 `[x]` · T3 ส่งมอบ ยังไม่ติ๊ก (เหลือ resolver ของสื่อ Journey ที่ผูก identity ใน C5)
- **Verification IDs:** `TC-S5-SAVE-001` · `TC-S5-SAVE-002` · `TC-S5-REPLAY-001` · `TC-S5-LEGACY-001` · `TC-S5-PACKAGE-001`

## 3. สิ่งที่ทำและรายการไฟล์ที่เปลี่ยนแปลง (Manifest of Changes)

### 3.1 ไฟล์ที่สร้างใหม่ (Created)

- `src/data/validation/content-digest.js`: `jaokob-canonical-json-v1` และ SHA-256 แบบ synchronous ที่เขียนเอง เพราะ `crypto.subtle` มีเฉพาะ secure context และโทรศัพท์ที่เปิดเกมผ่าน LAN ต้องบูตและบันทึกได้ · เป็นการตรวจความเสียหาย ไม่ใช่ลายมือชื่อ
- `src/data/content/journey-package.js`: ด่านรับแพ็กเกจของชั้นข้อมูล · JSON ล้วน · ขนาด · profile และ schema version ที่รองรับ · schema 3.0.0 · ทุกการอ้างอิงที่ schema ระบุ · ID ไม่ซ้ำ · id สงวนของ host · คืน identity `journey:<id>@<contentVersion>` พร้อม digest
- `src/data/validation/journey-save-validator.js`: สร้าง ปิดผนึก ตรวจ และจัดชั้นเซฟทีละระเบียนเป็น valid · unknown · future · corrupt ตามตาราง §3.2 (ตรวจตัวตนก่อน schema จึงคุ้มครองเซฟของ build อื่นแม้อ่านไม่ออก) · `sameStory` ให้ revision เดียวกันเปลี่ยนได้แค่ metadata
- `src/data/persistence/journey-storage.js`: จุดเดียวที่เข้าถึง storage แปลง exception เป็นรหัสคงที่ และเขียนหรือลบได้เฉพาะ `jaokob:journey:*` (key อื่นเป็น TypeError)
- `src/data/persistence/journey-save-repository.js`: slot ของแพ็กเกจ `jaokob:journey:<package id>:canonical|staging|backup` · stage → backup ของ canonical ที่ถูก → promote → ล้าง staging · ระเบียน unknown หรือ future ในช่องใดก็คุ้มครองทั้ง namespace · revision ใหม่กว่าหรือเรื่องอื่นที่ revision เดียวกันชนะ · ระเบียนเสียไม่คุ้มครอง · อ่านซ้ำทั้งสามช่องก่อนทุกการแก้ · reset ต้องใช้ token ของการตรวจครั้งที่ผู้เล่นเห็น
- `src/data/persistence/journey-device-records.js`: `jaokob:journey:settings` (ตั้งค่า รูปเดียวกับในเซฟ) และ `jaokob:journey:notices` (ข้อความแจ้งครั้งเดียว) · ค่าเริ่มตาม UX §1.9 · ระดับเสียงใช้ค่าเริ่มของ Sprint 4 ที่อนุมัติแล้วจน T7 กำหนดเสียงของ Journey
- `src/data/persistence/legacy-archive.js`: ห้า key ของ namespace เดิม · ถามได้แค่ว่ามีข้อมูลหรือไม่ · ไม่ import ฟังก์ชันเขียน
- `src/bootstrap/journey-application.js`: แอป Journey แบบไม่มีหน้าจอ (boot · newGame · continue · perform · changeSettings · suspend · wake · leave · acknowledgeNotice · view · status) · บันทึกเงียบทุกคำสั่งที่ commit · ล้มแล้วเล่นต่อในหน่วยความจำพร้อมข้อความแจ้ง · Resume ไม่เขียนจนกว่าจะ commit ครั้งถัดไป · ตั้งค่าและ suspend ที่ revision เดิมเขียนเซฟซ้ำได้โดยไม่ยกเลิกการ์ดที่ arm ไว้ (D9.3) · C5 วาง renderer บนชั้นนี้
- `tests/helpers/journey-storage.js` · `tests/unit/journey-package.test.js` (6) · `journey-save.test.js` (15) · `journey-application.test.js` (18) · `journey-legacy-rehearsal.test.js` (1)
- `docs/changelog/2026-11/2026-11-04-0620-c3-journey-save-identity-and-legacy-archive.md`: บันทึกนี้

### 3.2 ไฟล์ที่แก้ไข (Modified)

- `src/ui/assets/image-cache.js`: key ของภาพใช้ identity ของแพ็กเกจเมื่อมี มิฉะนั้นใช้ contentVersion แบบเดิม · ทุก reference ของ Sprint 4 ได้ key เดิม · เป็นไฟล์เดียวของ runtime Sprint 4 ที่เปลี่ยนตั้งแต่ `d1af293`
- `tests/unit/image-cache.test.js` (+1) · `tests/unit/architecture.test.js` (+1: โค้ด Journey ไม่เอ่ยถึง key เดิม และคลังเซฟเก่าไม่มีทางเขียน)
- `specs/README.md`: นิยาม `jaokob-canonical-json-v1` และ namespace ของ Journey · `src/README.md` ข้อ 5
- `docs/sprints/sprint-05-ssot.md` (สถานะ · §3.2 namespace ที่ใช้จริง · §4.2 C3 ปิด · T1 `[x]` · สถานะ T3 · §7) · `docs/traceability/sprint-05-execution-matrix.md` 0.3.2 · `docs/traceability/sprint-05-superseded-assertions.md` · `docs/dialogue/sprint-05/core-architect-notebook.md` · `docs/dialogue/sprint-05/BOARD.md` (`[S5-010]`) · `CHANGELOG.md`

### 3.3 ไฟล์ที่ลบ (Deleted)

- ไม่มี

## 4. ผลการทดสอบและการตรวจรับ (Verification & Quality Evidence)

| คำสั่ง | ผล |
|---|---|
| `node --test 'tests/unit/**/*.test.js'` | ผ่านทั้งหมด 1,270 (เดิม 1,228 · ใหม่ 42) |
| `node tests/docs/check-doc-links.mjs` | ผ่าน ไม่มีลิงก์เสีย |
| coverage ของโมดูลใหม่ (`--experimental-test-coverage`) | บรรทัด 100% ทุกไฟล์ · branch 91–100% |
| mutation sweep (ใส่บั๊ก 19 แบบทีละแบบในโมดูลใหม่) | เทสต์จับได้ทั้ง 19 แบบ |
| ความเร็ว (Node 22 บน Mac) | boot 16 ms · คำสั่งพร้อม transaction ของเซฟ p50 0.9 ms · p95 1.6 ms (333 คำสั่ง) |
| `git diff --numstat d1af293 -- src/ index.html` | ไฟล์เดิมที่เปลี่ยนมีแค่ `image-cache.js` · ไฟล์ persistence ของ Sprint 4 ไม่เปลี่ยนสักไบต์ |

**สิ่งที่พิสูจน์แล้ว**
1. **SAVE-001:** ระเบียนทุกแบบตกชั้นเดียวของตาราง §3.2 (19 กรณี) · บันทึกทุกคำสั่งที่ commit รวมทุกเทิร์นศึกและกิจกรรมแคมป์ และเซฟเท่ากับ state ของ Core พอดี · โหลดใหม่กลางศึกได้จังหวะ ถาด และแสงเดิม แล้วเล่นต่อจนจบได้ผลเดียวกัน · Resume ตั้งค่า และ suspend ไม่เขียนเซฟก่อน commit ครั้งถัดไป · New Game ทับของเดิมต้องใช้ token ของหน้าชื่อเรื่องที่ผู้เล่นเห็น และ token เก่าถูกปฏิเสธ
2. **SAVE-002:** quota · การเขียนที่ถูกปฏิเสธ · การเขียนที่หาย · การอ่านไม่ได้ · ไม่มี storage · race กับแท็บอื่น ทุกกรณีคืนรหัสคงที่ ไม่ทำลายความคืบหน้าที่บันทึกไว้ และแอปเล่นต่อในหน่วยความจำพร้อมแจ้งครั้งเดียว · เซฟใหญ่สุดที่ schema ยอมยังไม่ถึง 250 KB หลังปิดผนึก · เซฟ Act 1 จริงไม่ถึง 10 KB · SHA-256 ตรงกับ FIPS 180-4 และ `node:crypto`
3. **REPLAY-001:** เล่นซ้ำองก์ถูกบันทึกด้วย reason `replay-started` และตั้งค่าปัจจุบัน · โหลดใหม่แล้วยังอยู่ต้นองก์ · ฉากจบที่เห็นแล้วไม่หายทั้งหลังเล่นซ้ำและหลังโหลดใหม่
4. **LEGACY-001:** หลังเล่นครบ Act 1 เปลี่ยนตั้งค่า เล่นซ้ำ และเริ่มใหม่ด้วยความยินยอม key เดิมทั้งห้าเหมือนเดิมทุกไบต์และไม่มีการเขียนสักครั้ง · ข้อความแจ้งขึ้นครั้งเดียว · **ซ้อมย้อนกลับ:** แอป Sprint 4 ตัวจริงสร้างเซฟ แล้ว Journey เล่นทั้งเรื่องบน storage เดียวกัน แล้วแอป Sprint 4 เปิดเซฟเดิมได้ตรงจุดเดิม
5. **PACKAGE-001:** Act 1 (`story.jaokob.core`) กับแพ็กเกจจิ๋ว (`story.fixture.mini`) เป็น 0.1.0 ทั้งคู่ แต่ identity key digest slot ของเซฟ และภาพในแคชไม่ชนกัน · เซฟของแพ็กเกจหนึ่งไม่ถูกเล่นหรือเขียนทับโดยอีกแพ็กเกจ · build อื่นของเวอร์ชันเดียวกันมี digest ต่าง · ส่วนขยายใช้ id สงวนไม่ได้ · การอ้างอิงผิดและ capability ที่ไม่รองรับถูกปฏิเสธ

## 5. ความเสี่ยงและสิ่งที่ต้องทำต่อ (Risks & Next Steps)

1. **การตีความ ADR-P0-034 D7.3 (ขอ Antigravity ยืนยัน):** D7.3 ให้ใช้ "transaction แบบ staged → canonical → backup และเกราะ race เดิมของ persistence adapter" · session นี้พอร์ตกลไกเดียวกันทุกขั้น (ลำดับ stage–backup–promote–clean · อ่านซ้ำทั้งสามช่องก่อนทุกการแก้ · อ่านกลับตรวจ · ความยินยอมผูกกับระเบียนที่ผู้เล่นเห็น) ไว้ใน `journey-save-repository.js` แทนการเพิ่มตัวเลือกให้ adapter ของ Sprint 4 ที่แช่แข็งแล้ว เพื่อให้โค้ด persistence ของ Sprint 4 คงเดิมทุกไบต์ (การซ้อมย้อนกลับจึงมีความหมาย) และให้ชั้นของตาราง §3.2 กับการเขียนซ้ำที่ revision เดิมชัดเจน · adapter เดิมออกพร้อม runtime เดิมใน C5 จึงเหลือ transaction ชุดเดียวบน `develop` · ถ้า Antigravity ต้องการแบบเพิ่มตัวเลือกให้ adapter เดิม ทำได้ในขอบเขตจำกัด
2. **เซฟต้นแบบผูก digest:** แก้บทหรือสเปกกลไกแล้วคอมไพล์ใหม่ (digest เปลี่ยน) ทำให้เซฟต้นแบบเดิมเป็น "build อื่น" ซึ่งถูกเก็บไว้ไม่แตะ และผู้เล่นต้องยินยอมก่อนเริ่มใหม่ · ถูกต้องตาม D7 แต่ PO และแฟนต้องรู้ไว้ก่อนเล่นต้นแบบแต่ละรอบ
3. **T3 ยังไม่ติ๊ก:** resolver ของสื่อ Journey ต้องเกิดบน identity เดียวกันใน C5 แล้วจึงติ๊ก T3
4. **C4 ต่อไป:** ระบบออกแบบ วัสดุกระจกฝ้า HUD และชิ้นส่วนร่วม ซึ่งต้องให้ PO ตรวจภาพเทียบ v3
