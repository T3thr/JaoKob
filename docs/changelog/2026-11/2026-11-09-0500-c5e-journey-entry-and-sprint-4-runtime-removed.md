# Change Record: C5e · `index.html` เปิด Journey · ลบ runtime เนื้อหา และเทสต์ของ Sprint 2–4 ตามทะเบียน · allowlist ของ release ชุดใหม่

- **รหัสบันทึก (Record ID):** CR-20261109-0500
- **วันและเวลา (Timestamp):** 2026-11-09T05:00:00+07:00
- **รอบการพัฒนา (Sprint/Milestone):** Sprint 5 · Slice 1 · checkpoint C5 (T5) งานย่อย C5e
- **ผู้ปฏิบัติงาน (Operator/Persona):** Claude · Supreme Core Architect & Lead Game Systems Engineer
- **สถานะ (Status):** Completed (C5e) · T5 กำลังทำ · ถัดไป C5f

---

## 1. วัตถุประสงค์และคำสั่ง (Prompt Objective & Request)

กฎบัตร continuity ของ PO (2026-11-09) ก้าวที่ 2: ให้ [index.html](../../../index.html) บูตเข้า Journey shell ของจริง ทั้งที่รากและ subpath ของ GitHub Pages · ย้าย invariant ใน §2 ของ[ทะเบียน assertion ที่ถูกแทนที่](../../traceability/sprint-05-superseded-assertions.md)เข้าเทสต์ใหม่ให้ครบ · ลบ runtime เนื้อหา และเทสต์เดิมตาม §3 ในคราวเดียว พร้อมบันทึกรายชื่อเทสต์ที่ลบจริงใน §5 · ไม่ทิ้ง dead code

## 2. ข้อกำหนดที่ได้รับผลกระทบ (Traceability & Requirement IDs)

- **ADRs:** ADR-P0-034 D1 (ทางเข้าเริ่มเปลี่ยนแล้วลบ runtime เดิม) · D8 (namespace เดิมอ่านอย่างเดียว) · D10 (กำแพงกันสปอยล์ · harness นอก allowlist) · ADR-P0-013 (validator) · AGENTS.md §9 (ขอบเขตชั้น)
- **SSOT:** §3.1 · §3.3 · §5.3 (ทะเบียนก่อนลบ) · T5 กำลังทำ
- **Verification IDs:** `TC-S5-PROTO-001` · `TC-S5-RELEASE-001` (staging) · `TC-S5-REQ-001` · `TC-S5-SCHEMA-001` · `TC-S5-LEGACY-001` · `TC-S5-ASSET-001`

## 3. สิ่งที่ทำและรายการไฟล์ที่เปลี่ยนแปลง (Manifest of Changes)

### 3.1 ทางเข้าเริ่ม

- `index.html`: บูต [src/bootstrap/index.js](../../../src/bootstrap/index.js) · ลิงก์ CSS ของ Journey หกไฟล์ · preload ฟอนต์ไทย · ทุก path เป็น relative จึงทำงานทั้ง `/` และ `/JaoKob/` · **Content-Security-Policy** แบบ meta (`default-src 'none'` · script style font connect เฉพาะ `'self'` · ภาพ `'self' blob: data:` · `base-uri 'none'` · `form-action 'none'` · `object-src 'none'`) เพราะ GitHub Pages ตั้ง header เองไม่ได้ · `referrer` no-referrer · ข้อความ noscript
- `src/bootstrap/index.js` (เขียนใหม่ทั้งไฟล์): ประกอบ Journey shell บนแพ็กเกจหลักเท่านั้น ไม่มี query hash หรือค่าในเครื่องที่เลือกแพ็กเกจอื่นได้ · เปิดไม่สำเร็จแสดงหนึ่งประโยคผ่าน DOM (`th-journey.js` → `app`) · เปิดด้วย `file://` บอกให้เปิดผ่านเว็บ
- `src/ui/styles/journey-page.css` (ใหม่): หน้าเพจรอบเกม (ไม่มี margin · พื้นกลางคืน · ข้อความเปิดไม่สำเร็จ) ใช้ร่วมกับหน้าตรวจ ซึ่งตัดกติกาซ้ำออกจาก `review.css`
- `tools/dev/serve-review.mjs`: `/` คือเกม หน้าตรวจอยู่ที่ path เดิม · พิมพ์ทั้งสองที่อยู่สำหรับเครื่องนี้และมือถือ

### 3.2 invariant ที่ย้ายก่อนลบ (ทะเบียน §2)

- `tests/unit/architecture.test.js` (+2): TC-S3-ARCH-001 และ TC-S4-ARCH-001 รวมเป็นกราฟ import ของ Core Data UI ที่ไม่ถึง `tests/` (นับ import แบบ side-effect และ dynamic ด้วย) และ Core ที่ไม่ใช้ Browser API ไม่สุ่ม ไม่อ่านนาฬิกา
- `tests/unit/content-schema-validator.test.js` (ใหม่ 6): Draft 2020-12 สามข้อตามเดิม · getter toJSON prototype sparse cycle และ proxy ปลอม ไม่ถูกรันและไม่ผ่าน · ลึกหรือกว้างเกินถูกจำกัดและไม่สะท้อนเนื้อหา · `__proto__` เป็นข้อมูลธรรมดา ไม่ปนเปื้อน prototype และถูก schema ปฏิเสธ · ทั้งหมดบนทางรับแพ็กเกจของ Journey
- `tests/unit/published-schemas.test.js` (ใหม่ 1) + `tests/fixtures/schemas/published-schema-sha256.json`: ตรึงไบต์ของ schema ทุกไฟล์ใน `specs/schemas` (21 ไฟล์ เดิมตรึง 9 ไฟล์) และล้มเมื่อมีไฟล์ใหม่ที่ไม่ได้ตรึง
- `tests/unit/asset-provenance.test.js` (ใหม่ 1): ทุกไฟล์ที่ provenance บันทึกด้วย path มีไบต์และ SHA-256 ตามบันทึก (27 ไฟล์ จากห้าบันทึก เดิมสอง) · SVG ไม่มี script หรือ link ภายนอก · path ที่ออกจาก repository ตั้งใจต้องอยู่ในรายการ retired และต้องไม่มีอยู่จริง
- `tests/unit/journey-content.test.js` (+1): บทของแพ็กเกจที่คอมไพล์แล้วไม่มีบล็อกซ้ำและไม่มีคำแบบระบบ (ADR-P0-021 D2) · ขีดและ emoji ถูก compiler ปฏิเสธอยู่แล้ว
- แถวที่เหลือของ §2 มีเทสต์ของ Journey อยู่แล้ว: เป้ากดและแถบเลื่อนซ้อน (`journey-c4-design-system.mjs`) · ไม่มีตัวเลขบนจอ (`journey-presentation.test.js`) · Safe DOM (`architecture.test.js`) · โฟกัสและ Escape (`journey-panels.test.js`) · บันทึกเงียบ (`journey-shell.test.js`)

### 3.3 ลบ (ทะเบียน §3 และ §5)

- **โค้ด 55 ไฟล์ใน `src/`:** composition root เดิม (`content-sessions.js` `media-composition.js`) · Core เดิม (มาตรวัด 0–100 · state machine ที่มี Game Over · choice transaction · orchestration · pouch transaction · RendererPort · StoragePort) · ชั้นข้อมูลเดิม (loader validator catalog presentation view model history projection migration save 1→2 adapter ของ storage และ preferences · `asset-resolver.js` `asset-preloader.js`) · เนื้อหาเดิม (`packages/` `compatibility/` `presentation/`) · UI เดิม (`ui/components/` `ui/renderers/` `ui/localization/`) · CSS เดิมแปดไฟล์
- **เทสต์ 846 ข้อระดับบนสุดและ 84 ข้อย่อยใน 36 ไฟล์** และ 20 ข้อที่ตัดจาก `ports.test.js` และ `keepsake-pouch.test.js` · รายชื่อทีละข้อจากการรันจริงก่อนลบอยู่ใน[รายชื่อเทสต์ที่ลบ](../../traceability/sprint-05-deleted-tests.md) · ทะเบียน §5 บันทึก authority และเทสต์ทดแทนรายไฟล์
- **เครื่องมือทดสอบของ runtime เดิม:** runner เบราว์เซอร์แปดตัว · runner schema สี่ตัว · `tests/design/` · helper เก้าไฟล์ · fixture ห้าโฟลเดอร์ (หลักฐานเดิมใน `tests/e2e/evidence/sprint-02..04` คงไว้เป็นประวัติ)
- **คงไว้โดยตั้งใจ:** `core/ports/audio-port.js` `ui/audio/` และ `core/use-cases/session-history.js` พร้อมเทสต์ (ทะเบียน §1) ยังไม่มีผู้ใช้จนเสียงของ T7 และแผงประวัติของ UX §1.7 จึงไม่อยู่ใน allowlist

### 3.4 ไฟล์ที่ปรับตาม

- `src/ui/assets/image-cache.js`: ถอดทาง `contentVersion` และการเดาฉากหลังจาก path ที่เหลือไว้ให้ runtime เดิม · key คือ identity ของแพ็กเกจเท่านั้น · `image-cache.test.js` ใช้ reference แบบ Journey และเพิ่มข้อว่า reference ที่มีแค่ `contentVersion` ถูกปฏิเสธ
- `tests/unit/ports.test.js` เหลือ AudioPort · `keepsake-pouch.test.js` เหลือโดเมนกระเป๋า · `journey-application.test.js` ตรึง key ของคลังเซฟเก่าเป็นข้อความ · `journey-schema.test.js` ไม่อ้าง catalog เดิม
- `specs/releases/sprint-05-static-files.json` (ใหม่): allowlist ของ Journey 140 ไฟล์ สร้างจาก `index.html` · `tests/helpers/release-files.js` + `tests/unit/release-allowlist.test.js` (ใหม่ 3) ตรวจว่า allowlist เท่ากับสิ่งที่ `index.html` เข้าถึงพอดี ไม่มีหน้าตรวจ fixture เทสต์ เครื่องมือ spec หรือ receipt และแพ็กเกจที่ส่งมีเฉพาะองก์ที่ promote
- `tests/release/verify-static-artifact.mjs`: stage Journey จาก allowlist ใหม่ (ตรวจภาพของ manifest ด้วย SHA-256) และซ้อมย้อนกลับด้วย build ของ Sprint 4 ที่ `bc167d3` จาก allowlist ของมันเอง
- เอกสาร: `README.md` · `src/README.md` · `src/core/README.md` · `src/ui/views/README.md` · `tests/README.md` · `tests/e2e/README.md` · `specs/README.md` (ผู้ใช้ schema หลัง C5e) · ลิงก์ในบันทึกประวัติที่ชี้ไฟล์ที่ลบเปลี่ยนเป็น permalink ที่ `39bf56b` (เนื้อความเดิมไม่แตะ) · ทะเบียน assertion · traceability 0.3.8 · SSOT · สมุดสถาปนิก · `CHANGELOG.md`

## 4. ผลการทดสอบและการตรวจรับ (Verification & Quality Evidence)

| คำสั่งหรือการตรวจ | ผล |
|---|---|
| ก่อนลบ: `node --test --test-reporter=tap` ทีละไฟล์ที่จะลบ บน `39bf56b` | 846 ข้อระดับบนสุดและ 84 ข้อย่อยผ่านทุกข้อ ไม่มี skip · รายชื่อบันทึกไว้ทั้งหมด |
| `node --test 'tests/unit/**/*.test.js'` | ผ่านทั้งหมด **413** ใน 28 ไฟล์ (เดิม 1,349 = 1,265 ข้อระดับบนสุด + 84 ข้อย่อย · 1,265 − 846 − 20 + 14 = 413) |
| `node tests/docs/check-doc-links.mjs` | ผ่าน ไม่มีลิงก์เสีย |
| ความครอบคลุมของการลบ | ทุกไฟล์ใน `src/` ที่เหลือเข้าถึงได้จาก `index.html` ยกเว้นสามไฟล์ที่คงไว้โดยตั้งใจ (§3.3) · ไม่มี helper หรือ fixture ที่ไม่มีผู้ใช้ |
| `tests/release/verify-static-artifact.mjs` | PASS · Journey 140 ไฟล์ · ซ้อมย้อนกลับ Sprint 4 76 ไฟล์ |
| artifact ที่ stage แล้วใน Chromium 151 ที่ `/` และ `/JaoKob/` | หน้าแรกพร้อมฉาก · Enter เริ่ม · Space อ่านต่อ · ฉากหลังเป็น `blob:` ที่ผ่านการตรวจ · ไม่มี error หรือการละเมิด CSP · ไม่มี request ออกนอก path ฐาน |
| `journey-c4-design-system.mjs` · `journey-c5b-encounters.mjs` · `journey-c5c-panels.mjs` · `journey-c5d-media.mjs` (รันซ้ำ ไม่ commit ผลใหม่) | C4 54 สถานะ 44 ตัวอย่างคอนทราสต์ · C5b 60 · C5c 50 · C5d เล่นครบสองแพ็กเกจ · ทั้งหมด 0 ล้ม |

**ยังไม่ได้ตรวจ:** E2E เต็มบน `index.html` (ทุกโหมด คีย์บอร์ดล้วน โหลดใหม่กลางศึก) อยู่ใน C5f · Safari และเครื่องจริง · การ deploy จริง (ต้องได้รับอนุญาตแยก)

## 5. Migration และ Rollback

- ไม่มี migration ของเซฟ: Journey ใช้ namespace ของตัวเอง และ key เดิมทั้งห้ายังไม่ถูกแตะ (`TC-S5-LEGACY-001`)
- ย้อนกลับด้วยการ revert commit นี้ (runtime เดิมกลับมาครบพร้อมเทสต์) · หรือ deploy build ของ Sprint 4 ตามที่ `verify-static-artifact.mjs` ซ้อมไว้

## 6. ความเสี่ยงและสิ่งที่ต้องทำต่อ (Risks & Next Steps)

1. **กำแพงกันสปอยล์ของสื่อ (ข้อค้นพบของสถาปนิก ทำใน C5f):** เกมยังโหลด `asset-manifest-v2.json` ทั้งไฟล์ ซึ่งมีคำบรรยายภาษาไทยและ path ของภาพ Act 2–5 และ CG ฉากจบ และ allowlist ส่งภาพทั้ง 70 ภาพ ผู้เล่นที่อยากรู้เปิดอ่านได้ · ข้อเสนอ: compiler สร้าง manifest ของสื่อต่อแพ็กเกจที่มีเฉพาะภาพที่องก์ที่ promote ใช้ แล้ว allowlist ส่งเฉพาะภาพเหล่านั้น
2. **สามไฟล์ที่คงไว้ยังไม่มีผู้ใช้:** AudioPort adapter เสียง และ session-history (ทะเบียน §1) · ถ้า PO ต้องการไร้โค้ดที่ไม่มีผู้ใช้อย่างเคร่งครัด ลบได้และกู้จาก git ตอน T7
3. **ขนาด artifact:** 16.7 MB gzip เกือบทั้งหมดเป็นภาพ (โหลดเมื่อถึงฉาก ไม่ใช่ตอนเริ่ม) · ลดลงมากเมื่อทำข้อ 1
