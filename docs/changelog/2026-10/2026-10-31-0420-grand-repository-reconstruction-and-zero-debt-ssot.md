# Change Record: ชำระ repository ให้ไม่มีหนี้ก่อน Sprint 5 Implementation

- **รหัสบันทึก (Record ID):** CR-20261031-0420
- **วันและเวลา (Timestamp):** 2026-10-31T04:20:00+07:00
- **รอบการพัฒนา (Sprint/Milestone):** ปิดรอบ Sprint 5 Planning หลัง PR #18 รวมเข้า `develop` (`524e9a5`) · ก่อนเริ่ม Implementation 2026-11-01
- **ผู้ปฏิบัติงาน (Operator/Persona):** Supreme Narrative Architect & Founding Sovereign Architect (Claude Opus 5.5) ตามอำนาจที่ PO และ Antigravity มอบ
- **สถานะ (Status):** Completed · commit บน `develop` ตามคำสั่ง PO

---

## 1. วัตถุประสงค์และคำสั่ง (Prompt Objective & Request)

คำสั่ง "Sovereign Architectural Mandate: The Zero-Debt Repository & Multi-Agent Harness Reconstruction" ของ PO และ Antigravity ห้าด่าน: (1) ไม่มีไฟล์ซ้ำ (2) หมวดหมู่ตามมาตรฐานพร้อม README ทุกโฟลเดอร์หลัก (3) พิมพ์เขียว `.gitignore` สำหรับ release ที่ปิดคอมเมนต์ไว้ (4) กระดานสื่อสาร Agent ราย Sprint (5) ไม่แตก ไม่ถดถอย ตัวตน Git สะอาด

## 2. ข้อกำหนดที่ได้รับผลกระทบ (Traceability & Requirement IDs)

- **ADRs:** ADR-P0-023 (ลำดับชั้นเอกสาร 4 ระดับ ย้ายแทนลบ) · ADR-P0-032 v2.0 (ชื่อ เปี๊ยก)
- **มาตรฐาน:** ISO/IEC/IEEE 12207:2017 §6.3.5 Configuration Management และ §6.3.6 Information Management · ISO/IEC/IEEE 29148:2018 · Clean Architecture
- **Sprint 5 WBS:** ไม่ปิดรายการ Implementation ใด (0/20) · ช่วย T0 ด้านความพร้อมของเอกสาร

## 3. สิ่งที่ทำและรายการไฟล์ที่เปลี่ยนแปลง (Manifest of Changes)

### 3.1 ไฟล์ที่สร้างใหม่ (Created)

- `tests/docs/check-doc-links.mjs`: ตรวจทุกลิงก์ภายใน Markdown และ HTML ที่ติดตามใน git ว่ามีปลายทางจริงและเป็น relative
- README ใหม่: `src/`, `tests/`, `assets/`, `docs/archive/`, `docs/design-system/`, `docs/design-system/evidence/`, `docs/rfc/`, `docs/sprints/`, `docs/traceability/`, `docs/dialogue/archive/` และ 9 โฟลเดอร์ที่จองไว้ (แทน `.gitkeep`)
- `docs/dialogue/sprint-05/BOARD.md`: กระดาน Sprint 5 พร้อมข้อความเปิด `[S5-001]`
- ดัชนีไฟล์ซ้ำ `deduplicated-aliases.json` ใน `tests/e2e/evidence/`, `docs/proposals/3d-keepsake-spike/evidence/` และ `docs/proposals/sprint-05-planning/evidence/`

### 3.2 ไฟล์ที่แก้ไขหรือย้าย (Modified / Moved)

- **ย้ายเข้า Tier 4** (`git mv` เก็บประวัติครบ): `docs/phase-0/` → `docs/archive/phase-0/` · `docs/design-system/archive-pre-adr032/` → `docs/archive/design-system-pre-adr032/` · `progress.md` → `docs/archive/session-logs/progress-log-2026-09-to-10.md` · `docs/ORGANIZATION-LOG.md` → `docs/archive/2026-09-01-documentation-reorganization-log.md` · `.agents/prompts/sprint-01-execution.md` → `docs/archive/agent-prompts/` · กระดานเล่ม 1 และ 2 → `docs/dialogue/archive/`
- **ลิงก์:** แก้ลิงก์ที่ได้รับผลจากการย้ายและลิงก์เสียเดิมทั้งหมด 73 จุด รวมลิงก์ `file:///` ของเครื่อง PO ทุกจุด ลิงก์ไปไฟล์ที่ไม่เคยอยู่ใน git สองจุดเปลี่ยนเป็นข้อความธรรมดา และแก้ชื่อไฟล์ Change Record ที่ผิดในพิมพ์เขียว 6 ฉบับ
- **ทางเข้าของ Agent:** `README.md` และ `docs/README.md` เขียนใหม่ · `AGENTS.md` (§2 สถานะ · §3 ลำดับชั้นตามดัชนี ADR ล่าสุด · เลขหัวข้อเรียงใหม่ไม่ซ้ำ · คำสั่งตรวจลิงก์) · `CLAUDE.md`, `.cursorrules`, `.github/copilot-instructions.md`, `.agents/` ชี้ไป Sprint 5 SSOT แทน Sprint 1 และไม่ส่ง Agent ไปอ่าน Phase 0
- **`.gitignore`:** ส่วน A ใช้งานจริง (เพิ่ม `__pycache__/`, `*.pyc`, `*.blend1`, `.claude/worktrees/`, `.claude/settings.local.json`) · ส่วน B พิมพ์เขียว release 8 บล็อกที่ปิดคอมเมนต์ไว้ทั้งหมด พร้อมขั้นตอน `git rm --cached`
- **harness ภาพต้นแบบ v2:** `render-screen.html` และ `ux-components.css` โหลด asset และฟอนต์จากต้นฉบับ · `asset-provenance.json` ระบุว่าสำเนาถูกลบ · `verify_delivery.py` ตรวจการคงสภาพเทียบ commit ส่งมอบ `844b1d8` แทนไฟล์ปัจจุบัน (เดิมล้มทุกครั้งที่เอกสารถูกแก้ และอ้าง path ของ worktree)
- **เทสต์:** `content-migration.test.js`, `content-presentation.test.js` และ `tests/schema/presentation-reference.mjs` อ่านแพ็กเกจ act-01 2.0.0 จาก `src/data/content/compatibility/` (SHA-256 ยังถูกตรึงในเทสต์)
- **สะกดชื่อ:** เปี๊ยก ทั้งโครงการ 49 จุดใน 18 ไฟล์ รวม alt text ของ manifest

### 3.3 ไฟล์ที่ลบ (Deleted)

- ไฟล์ที่ซ้ำกันทุกไบต์ 68 ไฟล์: สำเนา asset และฟอนต์ใน harness v2 20 ไฟล์ · ภาพและผลสถานะที่ซ้ำใน `tests/e2e/evidence/` 45 ไฟล์ · ภาพซ้ำใน 3D spike 1 ไฟล์ · รายงาน `ending-trajectories.json` ซ้ำ 1 ไฟล์ · fixture ที่ซ้ำกับแพ็กเกจ runtime 1 ไฟล์
- `.gitignore` ซ้อนที่ซ้ำหน้าที่กับรากโครงการ 2 ไฟล์ และ `.gitkeep` 47 ไฟล์ (38 ไฟล์อยู่ในโฟลเดอร์ที่มีไฟล์แล้ว อีก 9 ไฟล์แทนด้วย README)
- รวมลดขนาด repository 33.7 MB · ทุกไฟล์ที่ลบยังกู้ได้จากประวัติ git และไฟล์หลักฐานมีดัชนีชี้ไปต้นฉบับ

## 4. ผลการทดสอบและการตรวจรับ (Verification & Quality Evidence)

| คำสั่ง | ผล |
|---|---|
| `node --test 'tests/unit/**/*.test.js'` | 1,060/1,060 ผ่าน |
| `node tests/docs/check-doc-links.mjs` | ผ่าน ไม่มีลิงก์เสีย (เดิม 73 จุด) |
| `node docs/design-system/evidence/tactical-clash-simulator.mjs` · `five-act-runtime-ledger.mjs` · `physics-scale-optics-check.mjs` · `ux-v3-screen-states-check.mjs` | ผ่านทุกข้อ |
| `node docs/design-system/evidence/five-act-balance-model.mjs` | ผ่านทุกข้อ · 73 โหนด · 25,182 จุดเข้าศึก |
| `python3 docs/design-system/evidence/verify-visual-assets-v1.py` · `verify-visual-assets-v2.py` | ผ่าน |
| `python3 docs/design-system/ux-mockups/v2/harness/verify_delivery.py --visual-reviewed` · `verify_review.py` | ผ่าน (เดิม `verify_delivery.py` ล้ม) · 15 สถานะของหน้า review ผ่าน |
| `node tests/release/verify-static-artifact.mjs` (ตั้ง `JKB_ARTIFACT_DIR`, `JKB_ROLLBACK_DIR`, `JKB_RELEASE_EVIDENCE` นอก checkout) | PASS · 87 ไฟล์ · `index.html` ไม่ถูกแตะ |
| สแกนไฟล์ซ้ำทุกไบต์ทั้ง repository | ไม่เหลือ |
| สแกนการสะกด เปี๊ยก | ไม่เหลือรูปอื่น |

`tests/schema/*-reference.mjs` ต้องมี Ajv ของเครื่องพัฒนา (`JKB_AJV_PATH`) จึงไม่ได้รันในรอบนี้ เหมือนรอบก่อน

## 5. ความเสี่ยงและสิ่งที่ต้องทำต่อ (Risks & Next Steps)

1. Agent และเครื่องมือภายนอกที่จำ path เก่า (`docs/phase-0/`, `docs/dialogue/INTER-AGENT-DIALOGUE*.md`) ต้องใช้ path ใหม่ ลิงก์ทั้งหมดใน repository แก้แล้ว แต่ข้อความธรรมดาใน Change Record เก่ายังเขียน path เดิมตามประวัติ
2. ส่วน B ของ `.gitignore` ใช้วันส่งมอบจริงเท่านั้น และต้องทำตามขั้นตอน `git rm --cached` ที่เขียนไว้
3. ไฟล์ทำงานของ Astra ที่ไม่เคย commit (`docs/design-system/ux-mockups/v1/{evidence,source,plates}`) อยู่เฉพาะใน worktree ของเครื่องหนึ่ง ไม่อยู่ใน repository
4. คำอธิบาย WBS T6 ใน Sprint 5 SSOT §4 ยังพูดถึงตุ๊กตาถักโครเชต์ ควรให้ PO ปรับถ้อยคำก่อนเริ่ม T6
