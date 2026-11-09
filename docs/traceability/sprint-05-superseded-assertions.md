# Sprint 5 Superseded Assertion Register · ทะเบียน assertion ที่ถูกแทนที่

| ข้อมูล | ค่า |
|---|---|
| **ระดับ** | Tier 1 · ส่วนหนึ่งของ [Traceability 0.3.0 §5](sprint-05-execution-matrix.md) |
| **กติกา** | [SSOT 0.3.0 §5.3](../sprints/sprint-05-ssot.md): ก่อนลบหรือเปลี่ยน assertion ใด ต้องลงทะเบียนพร้อม authority และเทสต์ทดแทน · ห้าม skip · ห้ามลด guard ที่ไม่เกี่ยว |
| **ฐาน** | `feat/sprint-05-slice-01-foundations` · เริ่มที่ unit 1,148 (C1) · ก่อนลบ 1,349 บน `39bf56b` · หลังลบ C5e ดู [CR-20261109-0500](../changelog/2026-11/2026-11-09-0500-c5e-journey-entry-and-sprint-4-runtime-removed.md) |
| **สถานะ** | **ลบแล้วใน C5e 2026-11-09** เมื่อ `index.html` เปลี่ยนเป็น Journey ([ADR-P0-034 D1](../adr/ADR-P0-034-five-act-journey-runtime-save2-journey-profile-and-blueprint-compiled-content.md)) · invariant ใน §2 ย้ายครบก่อนลบ · ทุกเทสต์ที่ลบมีชื่อทีละตัวใน [รายชื่อเทสต์ที่ลบ](sprint-05-deleted-tests.md) · C3 ([CR-20261104-0620](../changelog/2026-11/2026-11-04-0620-c3-journey-save-identity-and-legacy-archive.md)) ย้าย `persistence.test.js` จาก §1 ไป §3 · C5d ย้าย `asset-resolver.test.js` และ `asset-preloader.test.js` จาก §1 ไป §5 เพราะ Journey อ่านสื่อผ่าน resolver ของตัวเอง |
| **ผู้ดูแล** | Architect และ QA · บันทึกเริ่มต้น [CR-20261102-1015](../changelog/2026-11/2026-11-02-1015-c1-schema-3-0-0-and-superseded-register.md) |

จำนวนเทสต์ต่อไฟล์ใน §3 เป็นการนับ `test(` แบบคงที่ตอนวางแผน ไฟล์ที่สร้างเทสต์ในลูปมีเทสต์จริงมากกว่านี้ · จำนวนและชื่อจริงจากการรันอยู่ใน §5 และ[รายชื่อเทสต์ที่ลบ](sprint-05-deleted-tests.md)

## 1. ใช้ต่อหลัง C5 (โครงสร้างพื้นฐาน)

| ไฟล์ | เรื่อง | หมายเหตุ |
|---|---|---|
| `image-cache.test.js` | แคชภาพ | ใช้กับ Journey แล้วใน C5d (key ของ identity · ฉากหลังจาก `kind`) · C5e ถอดทาง `contentVersion` และ path ที่เหลือไว้ให้ runtime เดิม · `asset-resolver` และ `asset-preloader` ย้ายไป §5 |
| `audio-adapter.test.js` · `ports.test.js` | AudioPort ของ Core และ adapter เสียง | คงไว้ (ADR-P0-015) · **ยังไม่มีผู้ใช้ใน production จนเสียงมากับ T7** · RendererPort และ StoragePort ของ runtime เดิมลบใน C5e (§5) |
| `session-history.test.js` | Log 50 บท + 50 การกระทำ | คงไว้ · **ยังไม่มีผู้ใช้ใน production จนมีแผงประวัติของ UX §1.7** (Journey ยังไม่มีแผงนี้) |
| `keepsake-pouch.test.js` | โดเมนกระเป๋าสี่ช่อง (ADR-P0-020) | ใช้ต่อ · กฎของที่ล็อกอยู่ใน `effects.js` และ `pouch-offer.js` ของ Core ใหม่ เทสต์ใน `journey-encounters.test.js` (C2) · C5e ตัดเทสต์ของ `pouch-transaction.js` เดิมออก 11 ข้อ (§5) |
| `journey-schema.test.js` | schema 3.0.0 | ใหม่ใน C1 |
| `architecture.test.js` | production ห้าม import จาก `tools/` · Core ห้าม `new Date(` และ `performance.now(` · โค้ด Journey ไม่เอ่ยถึง key เดิม · กราฟ import ของ Core Data UI · Core ไม่ใช้ Browser API ไม่สุ่ม ไม่อ่านนาฬิกา | ใหม่ใน C1 · กฎ key เดิมเพิ่มใน C3 · รับ TC-S3-ARCH-001 และ TC-S4-ARCH-001 แล้วใน C5e |
| `journey-package.test.js` · `journey-save.test.js` · `journey-application.test.js` | การรับแพ็กเกจและ identity · เซฟ journey และ transaction · แอป Journey แบบไม่มีหน้าจอ | ใหม่ใน C3 · รับ invariant ของ `persistence.test.js` (§3) |
| `content-schema-validator.test.js` · `published-schemas.test.js` · `asset-provenance.test.js` | validator JSON Schema และด่าน JSON data · ไบต์ของ schema ที่ตีพิมพ์แล้วทั้ง 21 ไฟล์ · ไบต์ของไฟล์ที่ provenance บันทึก | ใหม่ใน C5e จาก §2 |
| `journey-media-resolver.test.js` · `journey-media-screens.test.js` · `release-allowlist.test.js` | resolver ของสื่อและงบภาพ · allowlist ของ release และกำแพงกันสปอยล์ | ใหม่ใน C5d · C5e |

## 2. ย้ายออกก่อนลบไฟล์เดิม (ย้ายครบแล้วใน C5e)

| invariant | เคยอยู่ใน | ย้ายไป (C5e) | authority |
|---|---|---|---|
| TC-S3-ARCH-001 Core ไม่ใช้ Browser API และ production ไม่ import tests | `content-presentation.test.js` | `architecture.test.js`: `TC-S3-ARCH-001 TC-S4-ARCH-001` สองข้อ (รวมการ import แบบ side-effect และ dynamic) | AGENTS.md §9 |
| TC-S4-ARCH-001 กราฟ import ของ Core Data UI และห้ามสุ่มหรืออ่านนาฬิกา | `pouch-schema.test.js` | `architecture.test.js` (กฎ `new Date(` และ `performance.now(` อยู่แล้วตั้งแต่ C1) | AGENTS.md §9 · ADR-P0-034 D2 |
| พฤติกรรมทั่วไปของ validator (keyword · ref ภายใน · `__proto__` · ขีดจำกัด) | `content-loader.test.js` | `content-schema-validator.test.js`: Draft 2020-12 สามข้อตามเดิม · getter toJSON prototype sparse cycle proxy · ลึกและกว้างเกิน · `__proto__` บนทางรับแพ็กเกจ Journey | ADR-P0-013 |
| SHA-256 ของ schema ที่ตีพิมพ์แล้ว | `content-loader.test.js` · `pouch-schema.test.js` | `published-schemas.test.js`: ตรึงทุกไฟล์ใน `specs/schemas` (21 ไฟล์ เดิมตรึง 9) จน T19 ตัดสิน | AGENTS.md §9 · specs/README |
| มาตรฐาน anti-slop ของบท (ไม่มีบทซ้ำ ขีดยาว emoji) | `narrative-adr-021.test.js` | compiler ปฏิเสธขีดและ emoji · `journey-content.test.js`: บทของแพ็กเกจไม่ซ้ำและไม่มีคำของระบบ (`TC-S5-CONTENT-001` · `TC-S5-THAI-001`) | ADR-P0-021 |
| เป้ากด ≥ 44 · ไม่มีตัวเลขในกล่องบทพูด · ไม่มีแถบเลื่อนซ้อน | `vn-runtime-ergonomics.test.js` · `dom-renderer.test.js` | `tests/e2e/journey-c4-design-system.mjs` (เป้ากดและแถบเลื่อนซ้อน) · `journey-presentation.test.js` (`every beat of Act 1 is shown in the package's own words, with no digit on screen`) | ADR-P0-019 |
| render ข้อความด้วย Safe DOM ไม่ใช้ `innerHTML` | `dom-renderer.test.js` | `architecture.test.js` (`Journey screens write text through the DOM only`) | AGENTS.md §10 |
| โฟกัส Escape และการคืนโฟกัสของแผงซ้อน | `settings-dialog.test.js` · `history-dialog.test.js` · `keepsake-pouch-dialog.test.js` | `journey-panels.test.js` (แผงตั้งค่าและกระเป๋า: Tab อยู่ในกรอบ Escape คืนโฟกัส) | ADR-P0-019 · WCAG 2.2 |
| บันทึกเงียบ และความล้มเหลวยังแจ้งได้ | `act1-bootstrap.test.js` · `dom-renderer.test.js` | `journey-shell.test.js` (`TC-S5-SILENT-001`) | ADR-P0-022 |

## 3. ลบใน C5 พร้อม runtime เดิม (ลบแล้วใน C5e)

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
| `persistence.test.js` (27) | transaction ของ namespace เดิม (`jaokob:save:*` · `jaokob:settings`) ซึ่ง Journey ไม่ใช้ | ADR-P0-034 D7.3 · D8 · กลไกเดียวกันพอร์ตไว้ใน `journey-save-repository.js` | `journey-save.test.js`: stage–backup–promote–clean · race กับแท็บอื่น · quota · เขียนหายและอ่านกลับไม่ตรง · ไม่มี storage · ความยินยอมผูกกับระเบียนที่เห็น · ระเบียนจากอนาคตไม่ถูกเขียนทับ (`TC-S5-SAVE-001` · `TC-S5-SAVE-002`) |
| `journey-legacy-rehearsal.test.js` (1) | ซ้อมย้อนกลับกับแอป Sprint 4 ที่ยังอยู่ใน repository | ADR-P0-034 D1.3 · D8 | ไบต์ของ key เดิมใน `journey-application.test.js` (`TC-S5-LEGACY-001`) · ซ้อมกับ static build ของ Sprint 4 ใน T19 |

## 4. assertion ของ Slice 1 ที่เปลี่ยนใน C2 และ C5d

engine ของ ADR-P0-033 กลายเป็น adapter ของ Core ตาม ADR-P0-034 D5.2 assertion ที่เคยเทียบกับ engine นั้นจึงเทียบกับตัวเองไปแล้ว ([CR-20261104-0440](../changelog/2026-11/2026-11-04-0440-c2-evidence-on-core-and-balance-gate.md)) · C5d แทน loader ชั่วคราวของ C4 ด้วย resolver ที่ตรวจไบต์ ([CR-20261109-0430](../changelog/2026-11/2026-11-09-0430-c5d-journey-media-resolver-sha256-and-image-budget.md))

| assertion เดิม | ไฟล์ | เปลี่ยนเป็น | เทสต์ทดแทนที่เข้มกว่า |
|---|---|---|---|
| lexicon names equal the proved engine names | `journey-content.test.js` (C1) | lexicon ครบทุกเจตนาและการกระทำของ Core ครั้งเดียว เป็นภาษาไทย | trace ของ engine เดิมใน `clash-parity-golden.json` · `journey-clash.test.js` |
| every round in the mechanics spec equals the proved engine round | `journey-content.test.js` (C1) | ยกทั้งหกผ่าน `assertRound` ของ Core · แพ็กเกจพกเฉพาะยกที่ใช้ | parity ทุกลำดับการกดจาก 18 จุดเข้าศึก (`journey-clash.test.js`) ตรึงพฤติกรรมของทุกยก |
| Act 1 nodes follow the balance model order exactly | `journey-content.test.js` (C1) | แบบจำลองสมดุลเล่น Act 1 จากแพ็กเกจที่คอมไพล์ ตามลำดับหัวข้อของพิมพ์เขียว | `TC-S5-BALANCE-001` |
| ตารางความจริงของฉากจบเทียบ `endings()` ของแบบจำลอง | `journey-encounters.test.js` (C2 ช่วงสอง) | เทียบสมการของมหาพิมพ์เขียว §2.13 ที่ถอดตรงตัวในเทสต์ | เทสต์เดิมทุกจุดตัดของเกณฑ์ |
| the plain loader decodes before handing the URL over and fails closed on a wrong size | `journey-renderer.test.js` (C4) | `plain-image-loader.js` ถูกลบ · ภาพทุกภาพผ่าน `journey-media-resolver.js` และ image cache กลาง (ADR-P0-034 D10.3 · T3) | `journey-media-resolver.test.js` (ไบต์ ขนาดจาก header SHA-256 same-origin) · `image-cache.test.js` (ขนาดหลัง decode) · `journey-media-screens.test.js` (เล่นครบบนไบต์จริงในงบ 32 MiB) |

## 5. บันทึกการลบ

| วันที่ | assertion | authority | เทสต์ทดแทน | commit |
|---|---|---|---|---|
| 2026-11-09 | 846 เทสต์ระดับบนสุดและ 84 เทสต์ย่อย (930 ตามที่ `node --test` นับ) ใน 36 ไฟล์: ทุกไฟล์ใน §3 กับ `asset-resolver.test.js` (46) และ `asset-preloader.test.js` (6) · ชื่อทีละตัวและจำนวนต่อไฟล์ใน[รายชื่อเทสต์ที่ลบ §1 · §3](sprint-05-deleted-tests.md) | ตาม §3 แต่ละแถว · ADR-P0-034 D1 · D10.3 | ตาม §3 แต่ละแถว · invariant ของ §2 ย้ายแล้ว | C5e · CR-20261109-0500 |
| 2026-11-09 | 20 เทสต์ที่ตัดจากไฟล์ที่คงไว้: RendererPort และ StoragePort 9 ข้อใน `ports.test.js` · `pouch-transaction` 11 ข้อใน `keepsake-pouch.test.js` ([รายชื่อเทสต์ที่ลบ §2](sprint-05-deleted-tests.md)) | ADR-P0-034 D1 | AudioPort และโดเมนกระเป๋าคงไว้ · ข้อเสนอรับของผูก revision ใน `journey-session.test.js` | C5e · CR-20261109-0500 |
| 2026-11-09 | assertion ที่เปลี่ยน: `journey-schema.test.js` ไม่เทียบกับ catalog เดิมแล้ว (catalog เดิมถูกลบ เหลือข้อที่ว่า runtime มีเฉพาะ schema 3.0.0) · `journey-application.test.js` เทียบ key ของคลังเซฟเก่ากับ key ที่ runtime เดิมเขียนจริง (ตรึงเป็นข้อความ) แทนการ import adapter ที่ถูกลบ · `image-cache.test.js` ใช้ reference แบบ identity และ `kind` แทน `contentVersion` และ path พร้อมข้อใหม่ว่า reference ที่มีแค่ `contentVersion` ถูกปฏิเสธ | ADR-P0-034 D7.5 · D8 | ข้อเดิมเข้มเท่าเดิมหรือเข้มขึ้น | C5e · CR-20261109-0500 |
