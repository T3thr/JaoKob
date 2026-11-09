# Change Record: C5d · resolver ของสื่อ Journey ที่ตรวจ SHA-256 ระดับไบต์ · image cache กลางผูก identity · งบภาพ 32 MiB ที่หน้าจอทำตามจริง

- **รหัสบันทึก (Record ID):** CR-20261109-0430
- **วันและเวลา (Timestamp):** 2026-11-09T04:30:00+07:00
- **รอบการพัฒนา (Sprint/Milestone):** Sprint 5 · Slice 1 · checkpoint C5 งานย่อย C5d · ปิด T3
- **ผู้ปฏิบัติงาน (Operator/Persona):** Claude · Supreme Core Architect & Lead Game Systems Engineer
- **สถานะ (Status):** Completed (C5d) · **T3 `[x]`** · T5 กำลังทำ · ถัดไป C5e

---

## 1. วัตถุประสงค์และคำสั่ง (Prompt Objective & Request)

PO สั่ง (กฎบัตร continuity 2026-11-09) ให้ทำ C5d → C5f ต่อเนื่อง · C5d คือ resolver ของสื่อ Journey ตาม [สมุดสถาปนิก §3](../../dialogue/sprint-05/core-architect-notebook.md): เพิ่ม SHA-256 ระดับไบต์ใน `content-digest.js` · อ่านภาพแบบ same-origin ตรวจขนาดและ SHA-256 เทียบ [asset-manifest-v2.json](../../../assets/images/asset-manifest-v2.json) · เข้า image cache กลางด้วย composite package identity · แทน `plain-image-loader.js` ผ่าน port `loadImage(descriptor)` เดิม · แล้วติ๊ก T3 · ไม่ต้องสร้างภาพใหม่

## 2. ข้อกำหนดที่ได้รับผลกระทบ (Traceability & Requirement IDs)

- **ADRs:** ADR-P0-034 D7.5 (identity ของ session media และ cache) · D10.3 (สื่อ same-origin ตาม manifest) · ADR-P0-015 (port) · SSOT §1 แถว "สื่อ" (ภาพเสียแล้วยังเล่นจบได้)
- **Sprint 5 WBS:** **T3 ส่งมอบครบ** · T5 กำลังทำ
- **Verification IDs:** `TC-S5-ASSET-001` · `TC-S5-PACKAGE-001` · `TC-S5-PERF-001` (งบภาพ 32 MiB ส่วนที่วัดด้วยเครื่อง)

## 3. สิ่งที่ทำและรายการไฟล์ที่เปลี่ยนแปลง (Manifest of Changes)

### 3.1 ไฟล์ที่สร้างใหม่ (Created)

- `src/data/assets/journey-media-resolver.js`: `createJourneyMediaResolver({ media, identity, fetch })` → `read(reference, { signal })` ตาม port `readAsset` ของ image cache · อ่านได้เฉพาะภาพที่ media index ของแพ็กเกจนี้รับไว้และเฉพาะ identity เดียวกัน · URL ขนาด ความยาวไบต์ และ SHA-256 มาจาก index เสมอ ไม่ใช่จากผู้เรียก · `credentials: "omit"` `mode: "same-origin"` `redirect: "error"` · ต้องเป็น `image/webp` และยาวเท่า manifest (ตัดสตรีมทันทีที่เกิน) · `webpSize()` อ่านขนาดจาก header ของ `VP8X` `VP8 ` `VP8L` และตรวจว่า RIFF ยาวเท่าไฟล์ จึงปฏิเสธไฟล์ที่ถูกสลับ ย่อขยาย หรือถูกตัดก่อนเบราว์เซอร์ decode · แล้ว SHA-256 ของทุกไบต์ต้องตรง · ความล้มเหลวเป็นรหัส `MEDIA_*` แปดแบบที่ไม่มี URL ในผล
- `tests/unit/journey-media-resolver.test.js` (10): ตัวอย่าง FIPS 180-4 ห้าชุดรวมหนึ่งล้านตัว `a` · เทียบ `node:crypto` ทุกความยาว 0–200 · view ในบัฟเฟอร์ใหญ่ · ภาพทั้ง 70 ไฟล์ใน manifest v2 ตรงความยาว SHA-256 และขนาดจาก header · header ที่เสียเก้าแบบ · การอ่านจริง · identity อื่น ID ที่ไม่มี และ URL ที่ผู้เรียกแอบใส่ · คำตอบผิดแปดแบบ · ไฟล์เสีย สลับ ย่อขยาย ตัด และ RIFF ผิด · ตรวจ header ก่อนแฮช · สตรีมที่ไม่จบถูกตัด · ยกเลิกและหมดเวลา
- `tests/unit/journey-media-screens.test.js` (5): หน้าจอถือภาพเฉพาะที่แสดงอยู่ ตรวจหลังทุกคำสั่งของ Act 1 และแพ็กเกจจิ๋วทุกโหมด และกลับหน้าแรกแล้วเหลือแค่ภาพของหน้าแรก · เล่นครบทั้งสองแพ็กเกจบนไบต์จริงจากไฟล์ (แฮชจริง งบจริง) ไม่มีภาพถูกปฏิเสธ · dispose แล้วคืน object URL ทุกอัน · ภาพเสียไม่ถูกวาดและเรื่องเดินต่อ
- `tests/helpers/journey-media.js`: fetch แบบ same-origin บนไฟล์ของ repository (ทำไบต์เสียได้) และ port ภาพของเบราว์เซอร์ใน Node ที่ decode จาก header WebP จริง
- `tests/e2e/journey-c5d-media.mjs`: หลักฐานเบราว์เซอร์ · ผลที่ [evidence/sprint-05/c5d](../../../tests/e2e/evidence/sprint-05/c5d/report.json) (ภาพ 4 ภาพ)
- `docs/changelog/2026-11/2026-11-09-0430-c5d-journey-media-resolver-sha256-and-image-budget.md`: บันทึกนี้

### 3.2 ไฟล์ที่แก้ไข (Modified)

- `src/data/validation/content-digest.js`: `sha256Bytes(bytes)` อ่าน block เต็มจากไบต์เดิมโดยไม่คัดลอก (คัดลอกแค่หนึ่งหรือสอง block สุดท้ายเพื่อ padding) · `sha256Hex(text)` เรียกตัวเดียวกันบน UTF-8 · ยังเป็นแบบ synchronous เพราะ `crypto.subtle` ไม่มีใน context ที่ไม่ปลอดภัย · ~200 MB/s บน Node (ภาพ 500 KB ใช้ราว 2.5 ms)
- `src/data/assets/journey-media.js`: descriptor มี `identity` เพื่อให้ image cache ประกอบ key `<identity>:<assetId>`
- `src/ui/assets/image-cache.js`: ฉากหลังของ Journey นับจาก `kind: "background"` · เมื่อเพดานสองฉากหลังบังคับ จะไล่ฉากหลังที่ว่างก่อน ไม่ไล่ภาพอื่นที่ไม่เกี่ยว · `stats()` เพิ่ม `retainedBytes` (ไบต์ที่หน้าจอถืออยู่จริง แยกจากภาพว่างที่เก็บไว้ใช้ซ้ำ)
- `src/bootstrap/journey-shell.js`: ประกอบ media index → resolver → image cache → `loadImage` ที่คืน lease หรือ reject · `images()` คืนสถิติของ cache และจำนวนภาพที่แสดงไม่ได้ · `dispose()` ทิ้ง cache · กลับหน้าแรกแล้วสั่ง `renderer.rest()` · `media` ให้เทสต์แทน port ของเบราว์เซอร์ได้
- `src/ui/journey/journey-renderer.js` · `components/vn-tachie-stage.js` · `saa-dialogue-card.js` · `journey-title.js` · `tactile-action-card.js` · `pouch-slot.js` · `clash-action-tray.js` · `camp-activity-board.js` · `pouch-swap-sheet.js` · `pouch-panel.js`: **lease ของภาพตามสิ่งที่อยู่บนจอ** (รายละเอียดใน §4.1) · `clear()` ของการ์ด ช่องกระเป๋า เวที และกล่องบทพูด · `rest()` ของ renderer
- `tests/unit/image-cache.test.js` (+1) · `tests/unit/journey-renderer.test.js` (ลบเทสต์ของ plain loader ที่ถูกลบ ลงทะเบียนแล้ว)
- `tests/e2e/README.md` · `docs/traceability/sprint-05-superseded-assertions.md` (§1 แถวภาพ · §4 แถว plain loader) · `docs/traceability/sprint-05-execution-matrix.md` 0.3.7 · `docs/sprints/sprint-05-ssot.md` (T3 `[x]` · §4.2 · §7) · `docs/dialogue/sprint-05/core-architect-notebook.md` · `CHANGELOG.md`

### 3.3 ไฟล์ที่ลบ (Deleted)

- `src/ui/journey/plain-image-loader.js`: loader ชั่วคราวของ C4 · หน้าที่ทั้งหมดย้ายไป resolver และ image cache (บันทึกใน [ทะเบียน assertion §4](../../traceability/sprint-05-superseded-assertions.md))

## 4. ผลการทดสอบและการตรวจรับ (Verification & Quality Evidence)

### 4.1 ข้อค้นพบที่ C5d ต้องแก้ก่อนส่ง: lease ที่รั่วเมื่อ release มีผลจริง

`release()` ของ plain loader ไม่ทำอะไรเลย การถือภาพค้างจึงมองไม่เห็นมาตั้งแต่ C4 · เมื่อ cache มีงบจริง ภาพที่ถือค้างจะกินงบจนภาพใหม่ถูกปฏิเสธ · ที่พบและแก้: ถาดศึก แคมป์ แผ่นรับของ และการ์ดทางเลือกที่ซ่อนแล้วยังถือภาพ · ฉากหน้าแรกถูกถือตลอดการเล่น · CG ที่ซ่อนแล้วถูกถือจนมี CG ใหม่ · ชั้นฉากหลังที่ซ่อนถูกถือจนมีฉากหลังที่สาม (และเพดานสองฉากหลังจะปฏิเสธฉากที่สาม) · ใบหน้าในกล่องบทพูดถูกถือระหว่างคำบรรยาย · หน้าจอเกมหลังหน้าแรกถือฉากทั้งหมดไว้ · ตัวละครที่กำลังจางออกถือภาพอีก 420 ms

หลักที่ใช้: ภาพที่เริ่มจางออกคืน lease ทันที เพราะภาพที่วาดแล้วยังแสดงต่อได้หลังเพิกถอน object URL (พิสูจน์ใน Chromium จริงด้านล่าง) · ชั้นฉากหลังที่ซ่อนคืนก่อนโหลดฉากถัดไป · ชิ้นส่วนที่ถูกซ่อนเรียก `clear()` · กลับหน้าแรกเรียก `rest()` · ภาพที่คืนแล้วยังอยู่ใน cache จนกว่าจะต้องใช้ที่ จึงแสดงซ้ำได้ทันทีโดยไม่อ่านใหม่

พิสูจน์ด้วย mutation: ถอดการคืนภาพของถาดศึกออก เทสต์จับได้ที่ `a1-08 CLASH_RESOLVE` · ถอดการคืนฉากหน้าแรก เทสต์จับได้ และเทสต์เล่นครบบนไบต์จริงล้มเพราะ**ภาพถูกปฏิเสธจริง** ซึ่งแปลว่าถ้าเสียบ cache โดยไม่แก้ส่วนนี้ ผู้เล่นจะเห็นภาพหายระหว่างเล่น

### 4.2 คำสั่งและผล

| คำสั่งหรือการตรวจ | ผล |
|---|---|
| `node --test 'tests/unit/**/*.test.js'` | ผ่านทั้งหมด 1,349 (เดิม 1,334 · ใหม่ 16 · ลบ 1) |
| `node tests/docs/check-doc-links.mjs` | ผ่าน ไม่มีลิงก์เสีย |
| `node tests/e2e/journey-c5d-media.mjs` (Chromium 151 headless · ฐาน `2f6eb8d` + งานนี้) | 0 ล้ม · ถอด `crypto.subtle` ออกแล้วเล่นครบ Act 1 (111 คำสั่งถึงขอบองก์ · 21 ภาพ · อ่าน 31 ครั้ง) และแพ็กเกจจิ๋ว (36 คำสั่งถึงจบ · 17 ภาพ ทุกโหมดรวมรับของและฉากจบ) ทีละคำสั่ง: ไม่มีภาพถูกปฏิเสธ · ภาพที่วาดทุกภาพเป็น `blob:` ที่มีพิกเซล · ทุก request ของภาพอยู่ใต้ `assets/images/` ของ origin เดียวกัน · **ภาพที่หน้าจอถือสูงสุด 21.5 MiB (Act 1) และ 13.5 MiB (จิ๋ว) จากงบ 32 MiB** · ภาพที่วาดแล้วยังมีพิกเซลหลังเพิกถอน URL และ URL ที่เพิกถอนแล้วอ่านซ้ำไม่ได้ · ฉากเปิดเรื่องที่เสียหนึ่งไบต์ไม่ถูกวาด หน้าแรกใช้งานได้ Act 1 เล่นถึงขอบองก์ ไม่มี error · ซ่อมไฟล์แล้วฉากกลับมาโดยไม่ต้องโหลดหน้าใหม่ |
| `journey-c4-design-system.mjs` · `journey-c5b-encounters.mjs` · `journey-c5c-panels.mjs` (รันซ้ำบน loader ใหม่ ไม่ commit ผลใหม่) | C4 54 สถานะ 44 ตัวอย่างคอนทราสต์ 0 ล้ม (บทพูดแย่สุด 8.9 : 1 · HUD 8.1 : 1) · C5b 60 สถานะ 0 ล้ม · C5c 50 สถานะ 0 ล้ม · ภาพการ์ดจบบทของ C5d เทียบด้วยตากับหลักฐาน C5c แล้วเหมือนกัน |

**ยังไม่ได้ตรวจ:** ที่อยู่ LAN จริงบนมือถือ (จำลองด้วยการถอด `crypto.subtle`) · Safari Firefox และเครื่องจริง · เวลาแฮชบนมือถือรุ่นช้า (ประเมินจาก 200 MB/s บน Mac ว่าภาพ 500 KB ไม่เกิน ~25 ms แม้ช้ากว่าสิบเท่า) · สายตา PO

## 5. Migration และ Rollback

- ไม่มี migration · เซฟ schema และแพ็กเกจไม่เปลี่ยน · `stats()` ของ cache เพิ่มฟิลด์อย่างเดียว · ย้อนกลับด้วยการ revert commit นี้ (loader ชั่วคราวกลับมาพร้อมเทสต์เดิม)

## 6. ความเสี่ยงและสิ่งที่ต้องทำต่อ (Risks & Next Steps)

1. **C5e ถัดไป:** `index.html` เปลี่ยนเป็น Journey · ลบ runtime เดิมตามทะเบียน §3 · ตัดสินว่า `asset-resolver.js` และ `asset-preloader.js` ยังมีผู้ใช้หรือไม่ (Journey ไม่ใช้แล้ว) และถอดทาง `contentVersion` กับ `path` ของ cache ที่เหลือไว้ให้ runtime เดิม
2. **งบภาพเมื่อมีห้าองก์:** ภาพตัวละคร 1024² กินภาพละ 4 MiB และใบหน้าบนการ์ดใช้ภาพเต็มขนาด · Act 1 ถือสูงสุด 21.5 MiB · ถ้า Act 3–5 มีตัวละครพร้อมกันมากขึ้นหรือการ์ดที่มีใบหน้าต่างคนมากขึ้น ควรให้ Astra ส่งภาพย่อสำหรับการ์ดใน Slice 2 · ตัวเลขนี้อยู่ใน report ของ runner ทุกครั้ง
3. **ภาพเสียแบบเงียบ:** ช่องว่างไม่มีข้อความบอกผู้เล่น (ตามสัญญา "สื่อเสียยังเล่นได้") · จำนวนภาพที่แสดงไม่ได้มีใน `shell.images().failures` ให้หน้าตรวจและ runner อ่าน
