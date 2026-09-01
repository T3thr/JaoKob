# Sprint 1 SSOT: Core Vertical Slice

รหัสสปรินต์: `SPRINT-01`  
เป้าหมายหลัก: **Core Vertical Slice & Architecture Foundation**  
สถานะ: Ready for Execution  
รอบการส่งมอบ: Phase 1A & Phase 1B  
มาตรฐานอ้างอิง: ISO/IEC/IEEE 12207:2017 (Software Implementation Process), ISO/IEC/IEEE 29148:2018  

---

## 1. วิสัยทัศน์และเป้าหมายของสปรินต์ (Sprint Goal)

สร้างรากฐานสถาปัตยกรรม Clean Architecture ของตัวเกม JaoKob โดยส่งมอบ **"Vertical Slice แรกที่เล่นได้จริง"** ตั้งแต่หน้าจอเริ่มต้น (Title) -> ฉากเกริ่นเรื่อง (Opening Cutscene) -> ทางเลือกแรก (First Decision) -> การประมวลผลสถานะ (State Transition) -> การบันทึกลง LocalStorage (Save Envelope) เพื่อพิสูจน์ว่า:
1. Engine Core ทำงานแบบ **Deterministic 100%** และแยกขาดจาก DOM/Browser API โดยสิ้นเชิง
2. DOM Renderer รับเฉพาะ Immutable View Model และส่ง User Intent กลับเป็น Command
3. Persistence Adapter จัดการ Save/Load ผ่าน LocalStorage ได้อย่างปลอดภัย ปราศจาก Data Corruption

---

## 2. ขอบเขตข้อกำหนดที่ครอบคลุม (Normative Requirements Scope)

ทุกบรรทัดของโค้ดและเทสต์ในสปรินต์นี้ ต้องอ้างอิงและผ่านเกณฑ์ของ Requirement IDs ดังต่อไปนี้:

| หมวดหมู่ | Requirement ID | รายละเอียดข้อกำหนด | Verification Method |
|---|---|---|:---:|
| **State Machine** | `FR-STA-001` | Composition Root ประกอบระบบและเข้าสู่ Title โดย Core ไม่ผูกกับ Browser | Test, Inspection |
| | `FR-STA-002` | Game State ต้องเป็นหนึ่งใน enum: `Title`, `Cutscene`, `Exploration`, `Decision`, `GameOver`, `Ending` | Test |
| | `FR-STA-003` | ปฏิเสธ Invalid Transition โดยไม่เปลี่ยนแปลง Snapshot ปัจจุบัน | Test |
| | `FR-STA-004` | New Game เริ่มต้นด้วยค่า baseline: `hp=80`, `sanity=70`, `bond=0` | Test, Inspection |
| **Engine Core** | `FR-ENG-001` | `hp`, `sanity`, `bond` เป็น integer 0-100 และถูก clamp หลังคำนวณเสมอ | Test |
| | `FR-ENG-002` | Choice Transaction ประเมิน guard, ปรับ metrics, ปรับ flags แบบ Atomic Transaction | Test |
| | `FR-ENG-003` | Decision รับรองการคลิก/กดเลือกได้เพียงครั้งเดียว (Lock concurrent input) | Test |
| **Persistence** | `FR-SAV-001` | โครงสร้าง Save Envelope ตรงตาม schema (versioning, revision, payload, settings) | Test |
| | `FR-SAV-002` | แยก namespaced keys (canonical, staging, backup) ใน LocalStorage | Test |
| | `FR-SAV-003` | การเขียนเซฟใช้ขั้นตอน Staging -> Readback Validate -> Promote -> Backup | Test |
| **UI & Renderer** | `FR-UI-001` | DOM Renderer รับ Immutable View Model ห้ามแก้ไข Domain State โดยตรง | Test, Inspection |
| | `FR-UI-002` | UI แสดง busy state และล็อก input ซ้ำระหว่างทำ Choice Transaction | Test, Demonstration |
| **Accessibility** | `FR-ACC-001` | ทุก interactive element ใน slice นี้ต้องควบคุมผ่าน Keyboard ได้อย่างสมบูรณ์ | Demonstration, Test |
| | `FR-ACC-003` | Touch Target ขั้นต่ำ 44x44 CSS pixels และ Contrast ผ่าน WCAG 2.2 AA | Test, Inspection |

---

## 3. กฎสถาปัตยกรรมและข้อจำกัดบังคับ (Architecture Constraints)

1. **Pure ES Modules:** ไม่ใช้ framework, bundler ที่เป็น runtime dependency หรือ library ภายนอก (สอดคล้อง `CON-001`, `CON-002`)
2. **Boundary Rules (ห้ามฝ่าฝืน):**
   - `src/core/` **ห้าม** import จาก `src/ui/`, `src/data/` หรือเรียก `window`, `document`, `localStorage`
   - `src/ui/` **ห้าม** อ่าน `localStorage` หรือ mutate core state โดยตรง ต้องส่ง `Intent` ผ่าน Port เท่านั้น
   - `src/bootstrap/index.js` เป็นจุดเดียวที่ทำหน้าที่เชื่อม Concrete Adapters เข้ากับ Core Ports
3. **Display Text:** ข้อความภาษาไทยทั้งหมดต้องมาจาก Resource Map ห้าม hard-code ภาษาไทยเป็น logic identifier

---

## 4. แผนงานย่อย (Work Breakdown Structure - WBS)

- [x] **Task 1: Core Domain Foundation (`src/core/`)**
  - สร้าง `domain/meters.js`: ฟังก์ชันคำนวณและ clamp ค่า HP, Sanity, Bond (0-100)
  - สร้าง `state-machine/game-state.js`: Finite State Machine ที่มี Transition Guards
  - สร้าง `use-cases/choice-transaction.js`: จัดการการเลือก choice และคำนวณผลลัพธ์
  - สร้าง Unit Tests สำหรับ Core Logic ใน `tests/unit/`
- [x] **Task 2: Ports Definition (`src/core/ports/`)**
  - สร้าง `ports/renderer-port.js`: Interface สัญญาระหว่าง Core และ UI
  - สร้าง `ports/storage-port.js`: Interface สัญญาระหว่าง Core และ Persistence
- [ ] **Task 3: Persistence Adapter (`src/data/persistence/`)**
  - สร้าง `local-storage-adapter.js`: จัดการ Staging, Canonical, Backup Save Envelope
  - สร้าง Unit Tests สำหรับ Save/Load ใน `tests/unit/persistence/`
- [ ] **Task 4: Semantic DOM Renderer Adapter (`src/ui/`)**
  - สร้าง `renderers/dom/dom-renderer.js`: วาด UI จาก View Model ด้วย Semantic HTML
  - วางโครงสร้าง CSS พื้นฐาน (Tokens, Mobile-First Layout, Reset) ใน `styles/`
- [ ] **Task 5: Bootstrap & Vertical Slice Verification (`src/bootstrap/` & `index.html`)**
  - สร้าง `index.html` แบบ semantic
  - สร้าง `src/bootstrap/index.js` ประกอบระบบและรัน First Playable Slice
  - บันทึกผลการทดสอบและการทำงานลงใน [CHANGELOG.md](../../CHANGELOG.md)

---

## 5. สิ่งที่อยู่นอกขอบเขตในสปรินต์นี้ (Non-goals)

- ห้ามสร้างเนื้อเรื่องครบทั้ง 5 องก์ (ใช้เฉพาะ Mock Content ของฉากเปิดตัวใน องก์ 1)
- ห้ามทำระบบ Audio / Sound FX ในสปรินต์นี้ (จะทำใน Phase ถัดไป)
- ห้ามติดตั้ง Node modules หรือ runtime dependencies
- ห้ามเชื่อมต่อ Backend หรือ Cloud API ใดๆ

---

## 6. เกณฑ์การส่งมอบงาน (Definition of Done - DoD)

1. โค้ดทั้งหมดผ่านการตรวจสอบ Dependency Direction ไม่มีการ import ข้ามชั้นผิดกฎ
2. Unit Test สำหรับ State Machine และ Choice Transaction รันผ่าน 100%
3. ทดสอบการเล่นบนเบราว์เซอร์จริงผ่าน Core Loop: Title -> Cutscene -> Choice -> State Update -> Save สำเร็จ
4. บันทึกผลการทำงานลงใน `docs/changelog/` และ [CHANGELOG.md](../../CHANGELOG.md) ตามมาตรฐาน

---

## 7. ทะเบียนประวัติการเปลี่ยนแปลงของสปรินต์ (Sprint Audit Trail & Changelog Register)

ตารางนี้เป็นตัวเชื่อมโยงระหว่าง Sprint SSOT กับบันทึกใน `docs/changelog/` เพื่อให้สามารถตรวจสอบย้อนกลับ (Traceability) ได้อย่างโปร่งใสตามมาตรฐาน ISO/IEC/IEEE 12207:

| รหัสบันทึก (Record ID) | วันที่-เวลา (Timestamp) | หัวข้องาน (Task / Milestone) | ไฟล์บันทึกฉบับเต็ม | สถานะ |
|---|---|---|---|:---:|
| `CR-20260901-1350` | 2026-09-01T13:50 | เตรียมความพร้อม Sprint 1, จัดระเบียบ docs และโครงสร้างโฟลเดอร์ | [CR-20260901-1350](../changelog/2026-09/2026-09-01-1350-sprint-1-prep.md) | Verified |
| `CR-20260901-1358` | 2026-09-01T13:58 | ปลดล็อค Gitignore, ปรับปรุง Operations Manual, และ Baseline Push | [CR-20260901-1358](../changelog/2026-09/2026-09-01-1358-unlock-gitignore-and-ops-manual.md) | Verified |
| `CR-20260901-1401` | 2026-09-01T14:01 | กำหนด Autonomous Execution Protocol ใน `AGENTS.md` | [CR-20260901-1401](../changelog/2026-09/2026-09-01-1401-agent-autonomous-protocol.md) | Verified |
| `CR-20260901-1402` | 2026-09-01T14:02 | ย้าย Prompt Template ออกจาก `docs/` ไปยัง `.agents/prompts/` | [CR-20260901-1402](../changelog/2026-09/2026-09-01-1402-master-prompt-template.md) | Verified |
| `CR-20260901-1411` | 2026-09-01T14:11 | สร้าง Branch `develop` และวางแนวทาง Multi-AI Governance | [CR-20260901-1411](../changelog/2026-09/2026-09-01-1411-develop-branch-and-multi-ai-guidelines.md) | Verified |
| `CR-20260901-1940` | 2026-09-01T19:40 | พัฒนาและตรวจสอบ Core Domain, State Machine, Choice Transaction และ Port Contracts | [CR-20260901-1940](../changelog/2026-09/2026-09-01-1940-core-domain-state-machine.md) | Verified |
| `CR-20260902-0325` | 2026-09-02T03:25 | รวม PR #1 ของ Core Domain และ State Machine เข้า `develop` และส่งมอบ handoff ให้ Task 3 | [CR-20260902-0325](../changelog/2026-09/2026-09-02-0325-core-domain-merge.md) | Verified |
