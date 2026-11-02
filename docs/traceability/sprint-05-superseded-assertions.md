# Sprint 5 Superseded Assertion Register · ทะเบียน assertion ที่ถูกแทนที่

| ข้อมูล | ค่า |
|---|---|
| **ระดับ** | Tier 1 · ส่วนหนึ่งของ [Traceability 0.3.0 §5](sprint-05-execution-matrix.md) |
| **กติกา** | [SSOT 0.3.0 §5.3](../sprints/sprint-05-ssot.md): ก่อนลบหรือเปลี่ยน assertion ใด ต้องลงทะเบียนพร้อม authority และเทสต์ทดแทน · ห้าม skip · ห้ามลด guard ที่ไม่เกี่ยว |
| **ฐาน** | `feat/sprint-05-slice-01-foundations` · unit 1,148 ผ่าน (เดิม 1,060 ใน 40 ไฟล์ + `journey-schema.test.js` 86 + `architecture.test.js` 2) |
| **สถานะ** | **ยังไม่ลบ assertion ใด** · การลบเกิดใน C5 เมื่อทางเข้าเริ่มเปลี่ยนเป็น Journey ([ADR-P0-034 D1](../adr/ADR-P0-034-five-act-journey-runtime-save2-journey-profile-and-blueprint-compiled-content.md)) |
| **ผู้ดูแล** | Architect และ QA · บันทึกเริ่มต้น [CR-20261102-1015](../changelog/2026-11/2026-11-02-1015-c1-schema-3-0-0-and-superseded-register.md) |

จำนวนเทสต์ต่อไฟล์ในตารางเป็นการนับ `test(` แบบคงที่ ไฟล์ที่สร้างเทสต์ในลูปจะมีเทสต์จริงมากกว่านี้ · ตอนลบจริงใน C5 ให้แทนแถวไฟล์ด้วยรายชื่อเทสต์ทีละตัวที่ได้จากการรันจริง

## 1. ใช้ต่อหลัง C5 (โครงสร้างพื้นฐาน)

| ไฟล์ | เรื่อง | หมายเหตุ |
|---|---|---|
| `asset-preloader.test.js` · `asset-resolver.test.js` · `image-cache.test.js` | โหลดและแคชภาพ | ใช้ต่อกับ asset ของ Journey |
| `audio-adapter.test.js` · `ports.test.js` | AudioPort และ port ของ Core | ใช้ต่อ (ADR-P0-015) |
| `persistence.test.js` | transaction staged → canonical → backup · race · quota · ความยินยอม | ใช้ต่อ · T3 เพิ่มกรณีของ journey namespace |
| `session-history.test.js` | Log 50 บท + 50 การกระทำ | ใช้ต่อกับ Journey |
| `keepsake-pouch.test.js` | โดเมนกระเป๋าสี่ช่อง (ADR-P0-020) | ใช้ต่อ · T2 เพิ่มกฎของที่ล็อก |
| `journey-schema.test.js` | schema 3.0.0 | ใหม่ใน C1 |
| `architecture.test.js` | production ห้าม import จาก `tools/` · Core ห้าม `new Date(` และ `performance.now(` | ใหม่ใน C1 · รับ TC-S3-ARCH-001 และ TC-S4-ARCH-001 ใน C5 |

## 2. ต้องย้ายออกก่อนลบไฟล์เดิม

| invariant | ตอนนี้อยู่ใน | ย้ายไป | authority |
|---|---|---|---|
| TC-S3-ARCH-001 Core ไม่ใช้ Browser API และ production ไม่ import tests | `content-presentation.test.js` | `architecture.test.js` (ใหม่) | AGENTS.md §9 |
| TC-S4-ARCH-001 กราฟ import ของ Core Data UI และห้ามสุ่มหรืออ่านนาฬิกา | `pouch-schema.test.js` | `architecture.test.js` พร้อมเพิ่ม `new Date(` และ `performance.now(` | AGENTS.md §9 · ADR-P0-034 D2 |
| พฤติกรรมทั่วไปของ validator (keyword · ref ภายใน · `__proto__` · ขีดจำกัด) | `content-loader.test.js` | `content-schema-validator.test.js` (ใหม่) | ADR-P0-013 |
| SHA-256 ของ schema ที่ตีพิมพ์แล้ว | `content-loader.test.js` · `pouch-schema.test.js` | คงไว้จน T19 ตัดสินว่าจะเก็บ schema เดิมไว้ใน artifact หรือไม่ | AGENTS.md §9 · specs/README |
| มาตรฐาน anti-slop ของบท (ไม่มีบทซ้ำ ขีดยาว emoji) | `narrative-adr-021.test.js` | drift gate และ lint ของ compiler (`TC-S5-CONTENT-001` · `TC-S5-THAI-001`) | ADR-P0-021 |
| เป้ากด ≥ 44 · ไม่มีตัวเลขในกล่องบทพูด · ไม่มีแถบเลื่อนซ้อน | `vn-runtime-ergonomics.test.js` · `dom-renderer.test.js` | เทสต์ของ UI ใหม่ (`TC-S5-VN-001` · `TC-S5-HUD-001`) | ADR-P0-019 |
| render ข้อความด้วย Safe DOM ไม่ใช้ `innerHTML` | `dom-renderer.test.js` | เทสต์ของ `src/ui/journey/` | AGENTS.md §10 |
| โฟกัส Escape และการคืนโฟกัสของแผงซ้อน | `settings-dialog.test.js` · `history-dialog.test.js` · `keepsake-pouch-dialog.test.js` | เทสต์ของแผงใหม่ (`TC-S5-A11Y-001`) | ADR-P0-019 · WCAG 2.2 |
| บันทึกเงียบ และความล้มเหลวยังแจ้งได้ | `act1-bootstrap.test.js` · `dom-renderer.test.js` | `TC-S5-SILENT-001` | ADR-P0-022 |

## 3. ลบใน C5 พร้อม runtime เดิม

| ไฟล์ (จำนวน `test(`) | เหตุที่ถูกแทนที่ | authority | เทสต์ทดแทน |
|---|---|---|---|
| `meters.test.js` (12) | มาตรวัด 0–100 | ADR-P0-032 D5 · ADR-P0-033 | `TC-S5-STATE-001` |
| `game-state.test.js` (10) | ตาราง TR-001..020 ที่มี GameOver | ADR-P0-033 D1.3 · ADR-P0-034 D9 | `TC-S5-STATE-001` (play-mode) |
| `choice-transaction.test.js` (25) · `content-graph.test.js` (14) · `content-orchestration.test.js` (10) | engine และกราฟของ Act 1 เดิม | ADR-P0-034 D1 | `TC-S5-STATE-001` · `TC-S5-ENDING-001` · `TC-S5-CONVERGENCE-001` |
| `content-loader.test.js` (25) | แพ็กเกจ schema 1.x/2.0 ของเรื่องเดิม (หลังย้าย invariant ใน §2) | ADR-P0-034 D1 · D6 | `TC-S5-SCHEMA-001` · `TC-S5-PACKAGE-001` |
| `content-migration.test.js` (8) · `pouch-migration.test.js` (8) · `closeout-bootstrap.test.js` (9) | migration content 2.0→2.1 และ Save 1→2 | มติ PO Q3 · ADR-P0-034 D8 | `TC-S5-LEGACY-001` |
| `bootstrap.test.js` (5) · `act1-bootstrap.test.js` (18) · `benchmark-bootstrap.test.js` (4) · `narrative-bootstrap.test.js` (3) · `pouch-bootstrap.test.js` (6) · `history-bootstrap.test.js` (9) | composition root ของ runtime เดิม | ADR-P0-034 D1 | `TC-S5-PROTO-001` · `TC-S5-E2E-001` |
| `content-presentation.test.js` (13) · `closeout-presentation.test.js` (8) · `closeout-media.test.js` (3) · `media-composition.test.js` (5) · `stage-view.test.js` (4) | projection และสื่อของเรื่องเดิม | ADR-P0-034 D9 · D10 | `TC-S5-PRESENTATION-001` · `TC-S5-STAGE-001` |
| `dom-renderer.test.js` (26) · `vn-runtime-ergonomics.test.js` (8) | renderer ของ Sprint 4 | ADR-P0-022 D2 · ADR-P0-034 D10 | `TC-S5-VN-001` · `TC-S5-HUD-001` · `TC-S5-UX-001` |
| `history-dialog.test.js` (7) · `history-projection.test.js` (6) · `keepsake-pouch-dialog.test.js` (9) · `settings-dialog.test.js` (4) | แผงของ UI เดิม | ADR-P0-034 D10 | `TC-S5-A11Y-001` · `TC-S5-UX-001` |
| `narrative-content.test.js` (9) · `narrative-adr-021.test.js` (6) · `narrative-handoff.test.js` | บทและการส่งต่อของเรื่องเดิม | ADR-P0-023 · ADR-P0-032 v2.0 | `TC-S5-CONTENT-001` · `TC-S5-LORE-001` |
| `pouch-schema.test.js` (3) | schema กระเป๋าของ Save 2 เดิม (หลังย้าย TC-S4-ARCH-001) | มติ PO Q3 | `TC-S5-SAVE-001` |
| `ui-preferences.test.js` (7) | key `jaokob:preferences` ที่กลายเป็นคลังเซฟเก่า | ADR-P0-034 D8 | `TC-S5-LEGACY-001` |
| `asset-manifest.test.js` (4) | manifest ที่ผูกกับเนื้อหาเดิม | ADR-P0-034 D6 | `TC-S5-MEDIA-001` (manifest ของ Journey) |

## 4. บันทึกการลบ

| วันที่ | assertion | authority | เทสต์ทดแทน | commit |
|---|---|---|---|---|
| (ยังไม่มี) | | | | |
