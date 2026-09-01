# แผนโครงสร้างไดเรกทอรีสำหรับการผลิต

## 1. การควบคุมเอกสาร

| รายการ | ค่า |
|---|---|
| โครงการ | JaoKob |
| รหัสเอกสาร | JKB-P0-DIR-001 |
| เวอร์ชัน | 0.1.0 |
| สถานะ | Proposed Phase 0 Baseline |
| เจ้าของเอกสาร | Senior Software Architect |
| ผู้ร่วมทบทวน | Principal Game Designer, Lead Narrative Director, Quality and DevOps Specialist |
| ขอบเขตการใช้ | Phase 0 ถึง Production Release |

เอกสารนี้กำหนดโครงสร้างเป้าหมายของ repository กติกาการเป็นเจ้าของ กติกาการพึ่งพาระหว่างชั้น และลำดับการสร้างไดเรกทอรีจริง โดยมิได้สั่งให้สร้าง Source Code ใน Phase 0

## 2. วัตถุประสงค์และข้อจำกัด

โครงสร้างต้องสนับสนุนข้อกำหนดต่อไปนี้

1. แยกข้อกำหนด เนื้อหา ตรรกะเกม การจัดเก็บข้อมูล การแสดงผล สื่อ และการทดสอบออกจากกันอย่างตรวจสอบได้
2. รักษา Dependency Rule ของ Clean Architecture เพื่อให้เปลี่ยน DOM Renderer เป็น Canvas หรือ WebGL ได้โดยไม่แก้กติกาเกม
3. ทำให้ AI Agent โหลดบริบทเฉพาะส่วนและเชื่อมทุกการเปลี่ยนแปลงกลับไปยัง Requirement ID ได้
4. รองรับ Static Hosting บน GitHub Pages โดยไม่มี Server, Login, Monetization หรือ Runtime Service ภายนอก
5. รองรับภาษาไทยเป็นฐาน พร้อมสถาปัตยกรรม Localization และรองรับ Save Migration ในอนาคต
6. ห้ามสร้างไดเรกทอรีว่างเพื่อให้ผังดูครบถ้วน ให้สร้างเมื่อมีสิ่งส่งมอบที่ผ่าน Definition of Ready สำหรับไดเรกทอรีนั้นแล้ว

## 3. แหล่งอ้างอิงหลัก

- [Phase 0 Charter และ Compliance Baseline](./00-phase-0-charter.md)
- [Game Design Document](./01-game-design-document.md)
- [Narrative Bible](./02-narrative-bible.md)
- [Software Requirements Specification](./03-software-requirements-specification.md)
- [Architecture Blueprint](./04-architecture-blueprint.md)
- [AI Agent Engineering Guide](./06-ai-agent-engineering-guide.md)
- [Git Governance and Deployment Runbook](./07-git-governance-and-deployment-runbook.md)
- [Verification, Traceability และ Quality Gates](./08-verification-traceability-and-quality-gates.md)
- [Machine-Readable Specification Catalog](../../specs/README.md) และ JSON Schema ภายใต้ `specs/schemas/`

เมื่อเอกสารขัดแย้งกัน ต้องหยุดการนำไปใช้และเข้าสู่ Change Control ตามเอกสาร JKB-P0-AI-001 ห้ามเลือกความหมายเองโดยไม่มีบันทึกการตัดสินใจ

## 4. โครงสร้างเป้าหมาย

ผังต่อไปนี้เป็น Target State ตั้งแต่ Phase 1 เป็นต้นไป รายการที่ยังไม่มี Artifact ที่ได้รับอนุมัติไม่ต้องสร้างจริงใน Phase 0

~~~text
.
├── AGENTS.md
├── README.md
├── .gitignore
├── index.html
├── docs/
│   ├── phase-0/
│   │   ├── README.md
│   │   ├── 00-phase-0-charter.md
│   │   ├── 01-game-design-document.md
│   │   ├── 02-narrative-bible.md
│   │   ├── 03-software-requirements-specification.md
│   │   ├── 04-architecture-blueprint.md
│   │   ├── 05-production-directory-plan.md
│   │   ├── 06-ai-agent-engineering-guide.md
│   │   ├── 07-git-governance-and-deployment-runbook.md
│   │   └── 08-verification-traceability-and-quality-gates.md
│   ├── adr/
│   ├── rfc/
│   ├── traceability/
│   └── runbooks/
├── specs/
│   ├── README.md
│   ├── schemas/
│   │   ├── common.schema.json
│   │   ├── dialogue.schema.json
│   │   ├── event.schema.json
│   │   ├── character.schema.json
│   │   ├── save-state.schema.json
│   │   ├── narrative-tree.schema.json
│   │   └── content-package.schema.json
│   ├── examples/
│   │   ├── valid/
│   │   └── invalid/
│   ├── contracts/
│   └── migrations/
├── src/
│   ├── bootstrap/
│   ├── core/
│   │   ├── domain/
│   │   ├── state-machine/
│   │   ├── use-cases/
│   │   ├── events/
│   │   └── ports/
│   ├── ui/
│   │   ├── renderers/
│   │   │   └── dom/
│   │   ├── views/
│   │   ├── components/
│   │   ├── accessibility/
│   │   └── styles/
│   └── data/
│       ├── content/
│       ├── localization/
│       ├── repositories/
│       ├── persistence/
│       ├── migrations/
│       └── validation/
├── assets/
│   ├── images/
│   ├── audio/
│   ├── fonts/
│   └── provenance/
├── tests/
│   ├── unit/
│   ├── contract/
│   ├── state-transition/
│   ├── integration/
│   ├── persistence/
│   ├── accessibility/
│   ├── end-to-end/
│   └── fixtures/
├── .agents/
│   ├── skills/
│   │   └── jaokob-spec-loop/
│   │       └── SKILL.md
│   ├── workflows/
│   │   └── spec-driven-loop.md
│   └── standards/
│       └── engineering-standards.md
└── .github/
    ├── workflows/
    ├── ISSUE_TEMPLATE/
    ├── pull_request_template.md
    └── CODEOWNERS
~~~

## 5. หน้าที่ของแต่ละพื้นที่

### 5.1 Root

| Path | หน้าที่ | ข้อห้าม |
|---|---|---|
| `AGENTS.md` | Entry point ของ AI Agent และข้อบังคับระดับ repository | ห้ามบรรจุ Product Requirement ใหม่แทน SRS หรือ GDD |
| `README.md` | ภาพรวมโครงการ วิธีเปิดเกม และลิงก์ไปยังเอกสารหลัก | ห้ามใช้เป็นแหล่ง Requirement เชิงบรรทัดฐาน |
| `.gitignore` | ป้องกัน metadata, local secret และ generated artifact เข้าสู่ version control โดยไม่ตั้งใจ | ห้ามใช้ซ่อน Source of Truth หรือ release artifact ที่ต้องตรวจสอบ |
| `index.html` | Composition entry ของ Web Application ใน Phase 1 | ห้ามฝังตรรกะเกม ข้อมูลบทสนทนา หรือ Inline Event Handler |

### 5.2 `docs/`

- `phase-0/` เก็บ Baseline Candidate และ revision ที่ได้รับอนุมัติแล้วสำหรับ GDD, Narrative, SRS, Architecture, Production และ Governance โดยยึดสถานะใน document control ของแต่ละไฟล์
- `adr/` เก็บ Architecture Decision Record ที่ยอมรับแล้ว ใช้รหัส `ADR-P0-NNN` สำหรับ Phase 0 และรูปแบบที่โครงการอนุมัติสำหรับ Phase ถัดไป
- `rfc/` เก็บข้อเสนอเปลี่ยนแปลงข้ามระบบก่อนตัดสินใจ
- `traceability/` เก็บ Requirement-to-Design-to-Test Matrix ที่แยกออกจาก SRS เมื่อ Matrix มีขนาดใหญ่
- `runbooks/` เก็บขั้นตอนปฏิบัติซ้ำ เช่น Release, Backup, Recovery และ Incident Response

เอกสารต้องระบุรหัสเอกสาร เวอร์ชัน สถานะ เจ้าของ และลิงก์ไปยัง Requirement ID ที่เกี่ยวข้อง

### 5.3 `specs/`

- `schemas/` เป็น Machine-Readable Contract ของ Dialogue, Event, Character, Narrative Tree, Content Package และ Save State
- `examples/valid/` และ `examples/invalid/` เป็น Contract Fixtures สำหรับพิสูจน์ทั้งกรณียอมรับและปฏิเสธ
- `contracts/` เก็บ Contract ที่ไม่ใช่ Runtime Data เช่น Event Envelope หรือ Renderer Port Specification
- `migrations/` เก็บตารางความเข้ากันได้และข้อกำหนด Migration ไม่ใช่ตัว Implement Migration

Schema เป็น Contract ไม่ใช่ Runtime Business Logic การเปลี่ยน Schema ที่กระทบข้อมูลเดิมต้องมี RFC, Compatibility Analysis, Migration Specification และ Version Bump

### 5.4 `src/core/`

`core` เป็นศูนย์กลางกติกาเกมและต้องไม่ขึ้นกับ Browser API

- `domain/` เก็บ Game State, Value Rules และ Invariant เช่น HP, Sanity และ Bond
- `state-machine/` เก็บ Transition ของ Title, Cutscene, Exploration, Decision, GameOver และ Ending
- `use-cases/` ประสานคำสั่งระดับแอปพลิเคชันโดยไม่รู้จัก DOM หรือ LocalStorage
- `events/` กำหนด Domain Event และ Trigger Contract
- `ports/` กำหนดขอบเขตที่ Renderer, Persistence, Clock, Random Source และ Content Repository ต้องทำตาม

ห้าม `core` import จาก `ui`, `data`, `assets` หรือใช้ `window`, `document`, `localStorage`, `fetch` และ API เฉพาะ Browser โดยตรง

### 5.5 `src/ui/`

- รับ View Model หรือ Read Model จาก Core/Application Boundary
- แสดงผลด้วย Semantic HTML และ DOM Renderer
- เก็บ Focus Management, Keyboard Interaction และ Live Region ใน `accessibility/`
- เก็บ CSS Token, Layout, Component และ State Style ใน `styles/`

`ui` ห้ามอ่าน LocalStorage, Parse Narrative JSON หรือแก้ Domain State โดยตรง การเปลี่ยน Renderer ต้องไม่บังคับให้แก้กฎเกม

### 5.6 `src/data/`

- `content/` เก็บ JSON เนื้อเรื่องและเหตุการณ์ที่ผ่าน Schema Validation
- `localization/` เก็บข้อความตาม Locale โดยใช้ภาษาไทยเป็นฐาน
- `repositories/` ทำ Adapter ของ Content Repository Port
- `persistence/` ทำ Adapter ของ Save and Settings Port
- `migrations/` ทำ Migration แบบต่อเนื่องและทดสอบได้
- `validation/` ตรวจ Schema, Referential Integrity และ Version Compatibility

`data` อาจพึ่งพา Contract จาก `core/ports` แต่ห้ามพึ่งพา `ui` และห้ามนำ DOM Concern เข้ามา

### 5.7 `src/bootstrap/`

เป็น Composition Root เพียงแห่งเดียวที่รู้จัก Implementation ของ Core, UI และ Data มีหน้าที่ประกอบ Dependency, เลือก Adapter และเริ่ม Application ห้ามมี Game Rule หรือ Narrative Rule

### 5.8 `assets/`

เก็บไฟล์ Binary หรือ Static Media เท่านั้น ทุก Asset ต้องมีรายการที่มา ผู้สร้างหรือผู้ถือสิทธิ์ สถานะใบอนุญาต เงื่อนไขการใช้ Alt Text และ Hash ใน `assets/provenance/` ก่อนนำเข้า Release Artifact ห้ามฝังข้อความสำคัญไว้ในรูปภาพโดยไม่มีข้อความทางเลือกและ Localization

### 5.9 `tests/`

- `unit/` ทดสอบ Domain Rule และ Use Case แบบ Deterministic
- `contract/` ทดสอบ JSON Schema, Port Contract และ Valid/Invalid Fixture
- `state-transition/` ทดสอบ Allowed, Guarded และ Forbidden Transition
- `integration/` ทดสอบการประกอบ Core, Data และ Renderer Adapter
- `persistence/` ทดสอบ Save, Load, Corruption Recovery และ Migration
- `accessibility/` ทดสอบ Semantics, Keyboard, Focus, Contrast และ Reduced Motion
- `end-to-end/` ทดสอบ Happy Path, GameOver, Ending และ Resume
- `fixtures/` เก็บข้อมูลทดสอบที่ไม่มีข้อมูลส่วนบุคคลและไม่ปะปนกับ Production Content

Production Code ห้าม import จาก `tests/`

### 5.10 `.agents/`

เก็บเฉพาะบริบทที่ทำให้ Agent ปฏิบัติงานใน JaoKob ได้ถูกต้อง ได้แก่ Skill Entry Point, Workflow Checklist และ Engineering Checklist ห้ามคัดลอก GDD, SRS หรือ Schema มาเก็บซ้ำ

### 5.11 `.github/`

ใช้สำหรับ Pull Request Template, CODEOWNERS, Issue Template และ GitHub Actions ที่ผ่านการทบทวนแล้ว Workflow ต้องใช้สิทธิ์ต่ำสุดและห้ามมี Secret สำหรับ Runtime ของเกม

## 6. Dependency Rule

~~~mermaid
flowchart LR
    Bootstrap[Bootstrap Composition Root]
    UI[UI and Render Adapters]
    Data[Data and Persistence Adapters]
    Core[Core Domain and Use Cases]
    Specs[Specifications and Schemas]
    Content[JSON Content and Locales]
    Tests[Test Suites]
    Assets[Static Assets]

    Bootstrap --> UI
    Bootstrap --> Data
    Bootstrap --> Core
    UI --> Core
    Data --> Core
    Content -. validated by .-> Specs
    Data --> Content
    Tests --> Bootstrap
    Tests --> UI
    Tests --> Data
    Tests --> Core
    UI --> Assets
~~~

กติกาบังคับมีดังนี้

1. Dependency ชี้เข้าสู่ `core` แต่ `core` ห้ามชี้ออกไปยัง Adapter
2. มีเพียง `bootstrap` ที่ประกอบ Concrete UI และ Concrete Data Adapter เข้าด้วยกัน
3. `ui` กับ `data` ห้าม import กันโดยตรง
4. Production Module ห้าม import Test Fixture หรือ Test Utility
5. JSON Content ไม่มีคำสั่งที่ Execute ได้ ไม่มี JavaScript Expression และไม่มี HTML ที่ไม่ผ่านนโยบาย Sanitization
6. Schema และเอกสารเป็น Design-Time Contract Runtime ห้ามแก้ Contract โดยอ้อมเพื่อให้ Test ผ่าน
7. การเพิ่ม Runtime Dependency ภายนอกหรือเปลี่ยน Pure Vanilla Baseline ต้องผ่าน RFC และ ADR
8. Circular Dependency เป็น Quality Gate Failure

## 7. Ownership และสิทธิ์อนุมัติ

| พื้นที่ | Accountable Owner | Reviewer ที่ต้องมี | Gate เพิ่มเติม |
|---|---|---|---|
| `docs/phase-0/01-*`, Mechanics | Principal Game Designer | Narrative, Architecture, QA | ต้องเชื่อม GDD ID |
| `docs/phase-0/02-*`, Narrative Content | Lead Narrative Director | Game Design, Localization, QA | Canon Change ต้องได้รับอนุมัติ |
| `docs/phase-0/03-*`, `04-*`, `specs/` | Senior Software Architect | QA และเจ้าของโดเมน | Breaking Contract ต้องมี RFC |
| `docs/phase-0/05-*`, `06-*`, `AGENTS.md`, `.agents/` | Senior Software Architect | Quality and DevOps | ต้องไม่สร้าง Requirement ใหม่ |
| `docs/phase-0/07-*`, `.github/` | Quality and DevOps Specialist | Architecture, Security Reviewer | ต้องตรวจเอกสาร GitHub ปัจจุบันก่อนใช้ |
| `src/core/` | Core Maintainer | Architecture, QA | Unit และ Transition Gate |
| `src/ui/` | UI Maintainer | Design, Accessibility Reviewer | Accessibility Gate |
| `src/data/`, `specs/schemas/` | Data Maintainer | Architecture, QA | Contract และ Migration Gate |
| `assets/` | Art or Audio Owner | Narrative, Accessibility, Rights Reviewer | Provenance Gate |
| `tests/` | Quality Owner | เจ้าของ Production Area | Test ห้ามแก้เพื่อซ่อน Defect |

ในทีมขนาดเล็ก บุคคลหนึ่งอาจถือหลายบทบาทได้ แต่ต้องบันทึกว่าได้ทบทวนในมุมของบทบาทใด และห้ามให้ AI Agent ถือเป็นผู้อนุมัติธุรกิจหรือ Canon ขั้นสุดท้าย

## 8. กติกาการตั้งชื่อและการอ้างอิง

1. ชื่อโฟลเดอร์และไฟล์ทั่วไปใช้ `kebab-case`
2. JavaScript Module ในอนาคตใช้ `kebab-case.js` และ Named Export เป็นหลัก
3. JSON Content ID ใช้ Prefix ที่กำหนดใน Schema และต้องคงที่ตลอดอายุ Save
4. Locale ใช้ BCP 47 เช่น `th`, `en` และ Key ต้องไม่ผูกกับข้อความภาษาไทย
5. Migration ใช้ลำดับชัดเจน เช่น `v001-to-v002` ห้ามข้าม Version โดยไม่มีเส้นทางที่ทดสอบแล้ว
6. Test File สะท้อนชื่อ Subject และระดับการทดสอบ
7. Requirement ใช้กลุ่ม `GDD-*`, `NAR-*`, `FR-<DOMAIN>-NNN`, `NFR-<CATEGORY>-NNN`, `UC-NNN`, `TR-NNN`
8. Architecture Decision ใช้ `ADR-P0-NNN` ตาม Baseline ปัจจุบัน
9. Reference ต้องชี้ไปยังรหัสและไฟล์ต้นทาง ห้ามคัดลอก Requirement แล้วทำให้เกิด Source of Truth สองแห่ง

## 9. ลำดับการสร้างจริง

| ระยะ | สิ่งที่อนุญาตให้ Materialize | Exit Criteria |
|---|---|---|
| Phase 0A: Baseline | `docs/phase-0/`, `specs/schemas/`, `AGENTS.md`, `.agents/` | เอกสารครบ เชื่อม Requirement ID และผ่านการทบทวน |
| Phase 0B: Contract Validation | `specs/examples/`, `docs/adr/`, `docs/rfc/`, `docs/traceability/` เมื่อมี Artifact จริง | Schema ผ่าน Meta-validation และมี Valid/Invalid Fixture |
| Phase 1A: Application Skeleton | `index.html`, `src/bootstrap/`, Port และ Module Skeleton ที่จำเป็น | Definition of Ready ครบ ไม่มี Gameplay Feature ที่ยังไม่อนุมัติ |
| Phase 1B: Vertical Slice | ส่วนย่อยของ `src/core/`, `src/data/`, `src/ui/`, `tests/` สำหรับหนึ่ง Use Case | Trace จาก Requirement ถึง Automated Test ครบ |
| Phase 2: Content Expansion | `src/data/content/`, `localization/`, `assets/` ตาม Act | Schema, Reachability, Localization และ Provenance ผ่าน |
| Phase 3: Hardening | Test Suite ทุกระดับ, Performance และ Accessibility Artifact | Quality Gate ทั้งหมดผ่านและไม่มี Critical Defect |
| Release | `.github/workflows/`, Release Runbook และ Static Artifact Allowlist | Deploy จาก Tagged Commit, Smoke Test และ Rollback พร้อมใช้ |

การสร้างโฟลเดอร์ล่วงหน้าโดยใช้ Placeholder ไม่มีประโยชน์เชิง Traceability จึงห้ามทำ ยกเว้นไฟล์ระบบจำเป็นต้องคงโฟลเดอร์และมีเหตุผลที่บันทึกไว้

## 10. กฎการเคลื่อนย้ายและการเลิกใช้

1. ห้ามย้าย Artifact ที่เป็น Source of Truth โดยไม่แก้ลิงก์ Traceability และ Agent Routing ใน Change เดียวกัน
2. การแยก Module ต้องรักษา Public Contract หรือมี Migration Plan
3. Artifact ที่เลิกใช้ต้องระบุ `Deprecated` และลิงก์ไปยัง Artifact ทดแทนก่อนลบ
4. Schema ID และ Content ID ที่เคยเผยแพร่ห้ามนำกลับมาใช้กับความหมายใหม่
5. ห้ามลบ Save Migration ที่ยังอยู่ใน Supported Upgrade Window
6. Binary Asset ที่ถูกแทนที่ต้องอัปเดต Provenance และตรวจว่าไม่มี Reference ค้าง

## 11. เกณฑ์ตรวจรับโครงสร้าง

- ทุกไฟล์อยู่ในพื้นที่ที่มีเจ้าของชัดเจน
- ไม่มี Import ที่ฝ่าฝืน Dependency Rule
- ไม่มี Requirement หรือ Canon ซ้ำหลาย Source of Truth
- ไม่มี Source Code ใน Phase 0
- Schema, Content, Test Fixture และ Asset แยกจากกัน
- ทุก Asset ที่จะ Release มี Provenance และ Accessibility Metadata
- AI Agent เข้าถึงเอกสารหลักผ่าน `AGENTS.md` และ Skill โดยไม่ต้องค้นแบบคาดเดา
- Deployment Artifact มี Allowlist และไม่รวม `docs/`, `specs/`, `tests/`, `.agents/`, `.github/` หรือไฟล์ลับ

## 12. Open Decisions

รายการต่อไปนี้ต้องตัดสินด้วย RFC หรือ ADR ก่อน Materialize ใน Phase 1

1. ตำแหน่งและรูปแบบ Composition Root ที่แน่นอน
2. Tooling สำหรับ JSON Schema Validation และ Test Runner โดยต้องไม่เพิ่ม Runtime Dependency
3. Content Packaging Strategy สำหรับแต่ละ Act
4. Supported Save Upgrade Window
5. Asset Format, Compression Budget และ Font Licensing
6. รายชื่อไฟล์ Allowlist ขั้นสุดท้ายของ GitHub Pages Artifact
