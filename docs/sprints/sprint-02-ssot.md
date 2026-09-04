# Sprint 2 SSOT: Content Engine Architecture & Act 1 Full Narrative Package

รหัสสปรินต์: `SPRINT-02`\
เป้าหมายหลัก: **Content Engine Architecture & Act 1 Full Narrative Package**\
สถานะ: `In Progress — Tasks 1–3 implemented and verified locally; ready for Step 3`\
รอบการส่งมอบ: **Phase 2A (Content Expansion)**\
เวอร์ชันเอกสาร: `0.3.0` — Canonical Act 1 package และ scoped graph verification\
วันที่จัดทำ: 2026-09-04 (Asia/Bangkok)\
เจ้าของแผน: Senior Technical Lead & Narrative Operations Director\
มาตรฐานอ้างอิง: `ISO/IEC/IEEE 12207:2017`, `ISO/IEC/IEEE 29148:2018`, `WCAG 2.2 AA`

**ความหมายของสถานะ:** แผนได้รับอนุมัติและ merge ผ่าน PR #6 ที่ `be9bbcb` แล้ว Tech Lead Step 1 อนุมัติ Task 1 พร้อม D1/D2/D4; Step 2 อนุมัติ package ทั้งเจ็ดฉากและ graph tests บนฐาน `c7d60f4` Tasks 1–3 เสร็จในขอบเขต local implementation/automated verification ส่วน human editorial/sensitivity review ก่อน merge และ application integration/browser verification ยังเป็นงาน Step 3

ฐานการวางแผนคือ `develop@53de19e` ซึ่งรวม Sprint 1 ครบ Tasks 1–5 และมี regression 183 tests; commit รวมตัวเกมคือ `ae2e103` ส่วน `53de19e` เป็นบันทึก closeout ต่อจากนั้น ตาม [Sprint 1 SSOT](sprint-01-ssot.md) และ [บันทึกปิด Sprint 1](../changelog/2026-09/2026-09-03-1040-sprint-01-merge-closeout.md) การอนุมัติ Phase 0 ยึดคำยืนยันของเจ้าของโครงการในคำสั่งวางแผนนี้ แม้ส่วนหัวเอกสารเดิมบางฉบับยังใช้คำว่า Proposed/Candidate

รอบวางแผนเดิมเป็น documentation-only; Step 1 อนุมัติ Content Validator/Loader และ Step 2 อนุมัติ Act 1 JSON พร้อม graph tests/trace ใช้ Branch เดียว `feat/sprint-02-act-01-expansion` สำหรับทั้งสามรอบ มี atomic local commit ต่อรอบ และห้าม push/เปิด PR/merge จนได้รับคำสั่งเมื่อครบสามรอบ กติกานี้แทนแผนแยก PR ต่อ Task ในรอบวางแผน

---

## 1. วิสัยทัศน์และเป้าหมายของสปรินต์ (Sprint Goal)

Sprint 2 เป็นสะพานจาก First Playable Slice สู่ระบบที่ผู้เขียนเรื่องเพิ่มเนื้อหาได้ผ่าน JSON ซึ่งผ่านสัญญาข้อมูล โดย Engine Core ไม่ต้องรู้จักบทบรรยายหรือฉากเฉพาะเรื่อง ปัจจุบัน `src/data/content/prologue-slice.js` เป็น JavaScript resource สำหรับ Mock ที่ใช้รูปแบบเฉพาะของ Sprint 1 แม้แยกบทบรรยายออกจาก Engine แล้ว แต่ยังไม่ใช่ aggregate Content Package ตาม Schema การเปลี่ยนครั้งนี้จึงรวมการโหลด ตรวจสอบ สร้างดัชนี และเชื่อมคำสั่งของฉากเข้ากับระบบเดิม

ผลที่ผู้เล่นจะได้รับคือ **Act 1: บ้านในหนองน้ำ ฉบับเต็ม** ตั้งแต่ความอบอุ่นของครอบครัว การสำรวจและเลือกความทรงจำ พายุและการพลัดพราก การเรียกหาครอบครัวหรือหาช่องอากาศ การเก็บหรือปล่อยเศษใบบัว จนถึงความเงียบที่เปิดพื้นที่ให้เลือกมีชีวิตต่อ ทางเลือกเปลี่ยนพลังใจ วิธีรับมือ และความทรงจำ โดยไม่กล่าวโทษผู้เล่นหรือยืนยันชะตาครอบครัว

ผลลัพธ์ปลายสปรินต์มีสี่รายการ:

1. `src/data/content/content-loader.js` โหลดและตรวจ Content Package รวม Narrative Tree ด้วยสัญญาที่อนุมัติ ก่อนเผยแพร่ immutable indexes ให้ Application ใช้
2. `src/data/content/packages/act-01.json` บรรจุ Act 1 ครบเจ็ดฉาก Canon พร้อม dialogue, choices, flags, warnings และภาษาไทย
3. `tests/unit/content-graph.test.js` พิสูจน์ reference integrity, การเข้าถึงทุก node และทางออกที่เล่นได้จริงภายใต้เงื่อนไขของ Act 1 พร้อมรายงานขอบเขต `GRAPH-GATE`
4. `src/bootstrap/index.js` ประกอบ Content Adapter แทน Mock เริ่มเกม เล่น เลือก บันทึก และกลับมาเล่นต่อด้วยเนื้อหาที่ validate แล้ว

### 1.1 ขอบเขต Phase และความหมายของความสำเร็จ

[Charter Section 6](../phase-0/00-phase-0-charter.md) กำหนด G1 เป็น Verification and Playtest ก่อน Content Expansion และ G2 เป็น Release Candidate Gate หลัง Phase 2 ส่วน `GDD-SCP-003` กำหนด Full Release ครบห้าองก์และสาม Ending จึงแบ่ง Phase 2 เป็นหลายสปรินต์: Sprint 2 ส่งมอบ Act 1 และโครงสร้าง Content; Web Audio Engine ยกไป Sprint 3 ตามคำสั่งเจ้าของโครงการ ส่วน Act 2–5 และงานศิลป์เต็มชุดต้องมีแผนรอบถัดไป

หลักฐาน Sprint 1 เป็นฐานส่งต่องานจาก G1 ไม่ใช่หลักฐานว่า Gate ระดับ Release ทุกตัวผ่านแล้ว การจบ Sprint 2 ไม่เท่ากับ Feature Complete ทั้งเกม ไม่ปิด G2 และไม่อ้างว่าเข้าถึง `END-HOME`, `END-NEARBY`, `END-DAWN` ด้วย Content ที่ยังไม่ได้ผลิต

---

## 2. ขอบเขตข้อกำหนดที่ครอบคลุม (Normative Requirements Scope)

แหล่งอำนาจคือ [GDD](../phase-0/01-game-design-document.md), [Narrative Bible](../phase-0/02-narrative-bible.md), [SRS](../phase-0/03-software-requirements-specification.md), [Architecture Blueprint](../phase-0/04-architecture-blueprint.md) และ [Production Directory Plan](../phase-0/05-production-directory-plan.md) ตารางนี้กำหนดส่วนที่นำมาส่งมอบและตรวจใน Sprint 2 โดยไม่เปลี่ยนข้อความ Requirement ต้นทาง

**การแก้รหัสอ้างอิงจาก brief:** `NAR-ACT1-001` ถึง `NAR-ACT1-006` ไม่ใช่รหัสที่มีอยู่ใน Narrative Bible จึงใช้ `NAR-ACT-001`, `NAR-ACT-002` และ `NAR-SC-A1-001` ถึง `NAR-SC-A1-007` ตามต้นฉบับ ไม่สร้างรหัส Canon ใหม่ นอกจากนี้ `FR-LOC-002` หมายถึงเปลี่ยน locale โดยไม่เปลี่ยน Domain State มิใช่ชื่อข้อกำหนด Resource Isolation

| หมวด | Requirement / Decision IDs | ขอบเขตและผลที่ต้องพิสูจน์ | Task / Verification |
|---|---|---|---|
| การแบ่งระยะ | `GDD-SCP-003`, `DEC-002`, `ADR-P0-003` | JSON-driven content; package version เดียวและ immutable ต่อ session; Sprint นี้เฉพาะ Act 1 | 1, 4 / Inspection, Test |
| Content boundary | `FR-CNT-001`, `FR-CNT-002`, `FR-CNT-004`, `FR-CNT-005` | Parse/schema/semantic validation, stable IDs, typed errors; ปฏิเสธ reference ผิดและ executable content | 1, 3 / Test |
| Graph | `FR-CNT-003`, `FR-STA-006`, `DR-001` ถึง `DR-012` | ไม่มี orphan/dangling reference, forbidden cycle หรือ guarded deadlock ใน Act 1; Canon ending reachability คงเป็นงาน Phase 2 ส่วนที่เหลือ | 3, 5 / Analysis, Test |
| Defaults / ธุรกรรม | `FR-STA-004`, `FR-ENG-001`, `FR-ENG-002`, `FR-ENG-003`, `GDD-MEC-001` ถึง `GDD-MEC-003` | เริ่ม 80/70/0; guard จาก pre-state; metric/flag atomic; crisis ก่อน ending; double input ไม่ commit ซ้ำ | 2, 4, 5 / Regression, Golden Test |
| ผลนอก Decision | `FR-ENG-004`, `FR-ENG-008`, `GDD-FLG-001`, `GDD-FLG-002`, `GDD-FLG-005` | เฉพาะ event/on-enter/hotspot/checkpoint ที่ Act 1 ต้องใช้: deterministic, bounded, flag policy ชัด และไม่เล่น effect ซ้ำเมื่อ Resume | 1, 2, 4 / Contract Test; รอ CR |
| Act 1 | `NAR-ACT-001`, `NAR-ACT-002`, `NAR-SC-A1-001` ถึง `NAR-SC-A1-007` | เจ็ดฉาก, tutorial memory focus และ decision หลักสองคู่ครบตาม Section 4 Task 2 | 2, 5 / Narrative Review, Playthrough |
| Choice balance | `GDD-DEC-A1-001-A`, `GDD-DEC-A1-001-B`, `GDD-DEC-A1-002-A`, `GDD-DEC-A1-002-B`, `GDD-CHO-006` | ตัวเลือก เงื่อนไข delta และ callback trace ตรงตาราง Canon | 2, 3, 5 / Golden Test, Analysis |
| Branching / ความต่อเนื่อง | `NAR-BRN-001` ถึง `NAR-BRN-004`, `NAR-CON-001`, `NAR-CON-002`, `NAR-CON-010`, `NAR-MTX-001` ถึง `NAR-MTX-003` | Foldback มี payoff; immediate feedback + delayed callback; edge explicit; variant มี priority/fallback; ไม่อ้างของที่ไม่ได้เก็บ | 2, 3, 5 / Graph, Dialogue Test, Review |
| HUD | `GDD-UX-003`, `GDD-BOND-005`, `NAR-CON-005`, `FR-UI-005` | HP/พลังใจตั้งแต่ tutorial; Bond=0 ตลอด Act 1 และไม่เผยใน HUD/accessible output จน `NAR-SC-A4-004` | 2, 4, 5 / Content Audit, DOM/Browser Test |
| Localization | `DEC-001`, `FR-LOC-001`, `FR-LOC-002`, `FR-LOC-003`, `DR-006`, `ADR-P0-008` | Thai resource ครบ; fallback `th`; ทดสอบ rerender ด้วย locale fixture โดย snapshot ไม่เปลี่ยน; ไม่ผลิตภาษาใหม่หรือ Settings UI เต็มชุด | 1, 2, 4, 5 / Coverage, Contract, Layout Test |
| Architecture | `CON-001`, `CON-002`, `FR-UI-001`, `NFR-MA-001`, `NFR-MA-002`, `NFR-MA-004` | Vanilla ES Modules, pure Core, immutable View Model, เปลี่ยน content โดยไม่ hard-code ฉากใน engine | 1, 4 / Import/Contract Review |
| Save compatibility | `FR-SAV-001` ถึง `FR-SAV-004`, `FR-SAV-006`, `FR-SAV-007`, `FR-SAV-009`, `DR-011` | Auto-save/Resume/Retry; compatible IDs; เก็บ raw incompatible save จน consent; memory-only เมื่อ storage ใช้ไม่ได้ | 4, 5 / Integration, Fault Injection |
| การเข้าถึง / อารมณ์ | `FR-ACC-001` ถึง `FR-ACC-004`, `NAR-TONE-001`, `GDD-SAFE-002` ถึง `GDD-SAFE-005`, `GDD-CONT-004` | Keyboard, focus, status, zoom/reflow; พายุไม่แสดงความรุนแรงละเอียด; decompression และ Thai human review | 2, 5 / Inspection, Browser, Human Review |
| Security / Rights / Performance | `NFR-SE-001` ถึง `NFR-SE-003`, `FR-CNT-006`, `NFR-PE-001`, `NFR-PE-002`, `NFR-PE-004`, `NFR-PE-005`, `NFR-PO-002` | Same-origin static data, safe text, provenance, subpath URLs และ budget เมื่อ JSON เพิ่มขนาด | 1, 4, 5 / Negative Test, Measurement, Inspection |

ข้อกำหนดที่มีขอบเขตกว้างกว่าสปรินต์ เช่น Canon Ending, locale-switch UI เต็มรูปแบบ และ release browser matrix ต้องบันทึกว่า **ตรวจเฉพาะส่วน Act 1/contract** พร้อมงานที่เหลือ ห้ามเปลี่ยนสถานะเป็นผ่านเต็ม Requirement จากหลักฐานเพียงส่วนเดียว

---

## 3. กฎสถาปัตยกรรมและข้อจำกัดบังคับ (Architecture Constraints)

### 3.1 Boundary และความรับผิดชอบ

1. `src/core/` รับ domain records/IDs ที่ตรวจแล้ว ห้ามอ่าน JSON bytes, `JSON.parse` สำหรับ Content, File System, Fetch, DOM หรือ LocalStorage และห้าม import UI/Data; การประเมินเงื่อนไขหรือ effect เป็น pure logic ไม่ใช่หน้าที่ Loader/UI
2. `src/data/content/` รับผิดชอบ same-origin load, UTF-8 JSON parse, schema/semantic validation, index และการแปลง records ให้เข้า Port สัญญาเดิม ห้ามรับประกัน guard ด้วยการใส่ `true` คงที่
3. `src/ui/` รับเฉพาะ immutable View Model และส่ง Intent; ห้าม parse Content, อ่าน LocalStorage หรือแก้ Domain State ใช้ Safe DOM API สำหรับข้อความและ accessible names
4. `src/bootstrap/` เป็น Composition Root เพียงแห่งเดียว ประกอบ loader, pure use cases, localization, renderer และ persistence; ห้ามเก็บบทสนทนา, delta, flag policy หรือเงื่อนไขของฉากเฉพาะไว้ในตัว dispatcher
5. ใช้ Pure ES Modules, ไม่มี bundler, framework, runtime package หรือ Node API ในเกม Node built-in test runner ใช้เฉพาะการตรวจบนเครื่องพัฒนา ไม่กลายเป็น runtime dependency
6. เปลี่ยน package ทั้งชุดเมื่อเริ่ม session ใหม่ ไม่แก้ index ระหว่าง transaction และไม่สลับ content version ใต้ snapshot เดิม

### 3.2 Package และสัญญา Loader

`act-01.json` ต้องเป็น **aggregate Content Package** ตาม [content-package.schema.json](../../specs/schemas/content-package.schema.json) ไม่ใช่ tree เดี่ยวหรือ manifest ที่เพิ่ม field เอง มี `schemaVersion`, `contentVersion`, `defaultLocale`, `supportedLocales`, `entryTreeId`, `gameDefaults`, `flagDefinitions`, `contentWarnings`, `assets`, `characters`, `dialogues`, `events`, `narrativeTrees` ครบ ส่วน `narrativeTrees[]` แต่ละรายการตรวจด้วย [narrative-tree.schema.json](../../specs/schemas/narrative-tree.schema.json) และ `$ref` ไป common/character/dialogue/event schemas ตาม catalog ใน [specs/README.md](../../specs/README.md)

- ฐาน Schema ปัจจุบันคือ `1.0.0`; `contentVersion` เป็นคนละแกนกับ `saveFormatVersion` ห้ามใช้แทนกัน การเปลี่ยนสัญญาที่จำเป็นต้องผ่าน CR และ version decision ก่อน ไม่อ้างว่า Schema ปัจจุบันรองรับสิ่งที่ยังไม่มี
- โหลดเฉพาะ path ของ static package ที่ Composition Root กำหนด URL ต้องใช้ได้ทั้ง `/` และ repository subpath; ไม่ให้ JSON กำหนด URL navigation หรือ dynamic import
- ลำดับคือ Load → Parse → Structural Validation → Unique IDs/References/Semantic Policies → Critical Graph Checks → Immutable Indexes สำเร็จทั้งชุดจึง compose playable session
- Draft 2020-12 `$id` เป็น identifier; register schemas จาก local catalog ไม่ download จาก canonical URL ระหว่างเล่น ต้องตรวจ `$ref`, required/unknown fields, type/enum/oneOf/limits และ `format` assertions ตาม Blueprint Section 13
- รูปแบบ validator ที่เลือกต้องไม่ทำให้เกมต้อง fetch โฟลเดอร์ `specs/` หรือ `tests/` ซึ่งไม่อยู่ใน static release allowlist; dev-time catalog และ runtime validation artifact ต้องมี trace ถึงสัญญาเวอร์ชันเดียวกัน
- ค่าคืนสำเร็จต้องมี version, entry และ lookup ของ tree/node/dialogue/event/character/asset พร้อมข้อมูล registry ที่ immutable ตาม `ContentRepositoryPort`; ชื่อฟังก์ชันละเอียดล็อกใน Task 1 ก่อนเริ่ม Consumer
- ค่าล้มเหลวใช้ typed result ตาม Blueprint Section 8/15 เช่น `CONTENT_PARSE`, `CONTENT_SCHEMA`, `CONTENT_REFERENCE`, `CONTENT_VERSION` พร้อม safe path/code ไม่ dump บทหรือเซฟทั้งชุด; load/HTTP failure ต้องมี mapping ที่บันทึกใน Contract Test
- package ที่ผิดต้องไม่ให้เล่นต่อด้วยข้อมูลบางส่วน ไม่อ่านแล้วเขียนทับ save และไม่ fallback เงียบ ๆ ไป Mock; แสดง Thai fatal/retry shell ที่ไม่ต้องพึ่ง package ซึ่งโหลดไม่สำเร็จ
- validator ต้องพิสูจน์ความสอดคล้องกับ schemas ที่ประกาศรองรับ ห้ามตรวจเพียง shape ตัวอย่างแล้วเรียกว่า Full JSON Schema Validation การเลือกเครื่องมือ dev-time และ runtime subset/equivalent assertions อยู่ใน `CR-0002` ไม่มีการอนุมัติติดตั้ง dependency ในแผนนี้

### 3.3 Localization, Content Metadata และ Provenance

Narrative schema รองรับ localized object ที่มี `th` อยู่แล้ว จึงเก็บบท ข้อความ choice, feedback, title และ warning ใน JSON ตาม contract โดยไม่เพิ่ม field `textKey` ที่ Schema ไม่รองรับ ID ของ record/field เป็น trace สำหรับ localization ได้ ส่วนข้อความระบบ ปุ่ม เมนู loading/error/recovery ใช้ resource ใน `src/data/localization/` ตาม Directory Plan พร้อม fallback ไทยที่ boot ได้แม้ Content เสีย

ห้ามเพิ่ม `policy`, `sceneId`, `requirementIds`, `replayOnly` หรือ metadata อื่นลงใน object ที่ปิด `additionalProperties` โดยไม่มีการแก้สัญญาที่อนุมัติ ข้อมูล Canon-to-runtime mapping, test catalog และ callback ledger ที่ Schema ไม่มีช่องรองรับให้เก็บใน traceability artifact ส่วน semantic flag policy ต้องใช้สัญญา versioned ที่ตัดสินใน CR

ใช้การนำเสนอข้อความและรูปแบบเดิมให้ Act 1 สมบูรณ์ได้ก่อน ไม่บังคับผลิตภาพหรือเสียงใหม่ ถ้ามี asset ที่อ้างจริงต้อง materialize ไฟล์ตาม `assets/` พร้อม `rights.origin`, `licenseId`, ที่มา/ผู้สร้าง/วันที่ตรวจและ alt ไทยสำหรับภาพ ทุก path resolve ได้และไม่มี traversal ถ้าไม่มี asset ใหม่ ให้รายงานรายการว่าง/ไม่มี reference ตามจริง ไม่สร้าง placeholder เพื่อให้ดูครบโครงสร้าง

### 3.4 การเชื่อม Application และ Compatibility

Mock มี `title`, `actions`, `scene`, `tree.id` และ policy ใน flags ซึ่งไม่ใช่ shape ของ Production Schema ขณะที่ bootstrap รองรับคำสั่งเฉพาะ slice และบางจุดตั้ง `entryConditionMet: true` งาน Integration จึงต้องมี mapping ของ node type, dialogue cursor, choice/interaction, checkpoint และ target facts ไม่ใช่เพียงเปลี่ยน import

Core ปัจจุบันมี `evaluateCondition`, Choice Transaction และตาราง `TR-001` ถึง `TR-020`; Choice Transaction ใช้กับ `Decision` และไม่ใช่ executor ทั่วไปสำหรับ `onEnterEffects`/hotspot/event งานที่ยังขาดต้องกำหนด pure application orchestration ผ่าน RFC ก่อน ห้ามย้าย domain effect runner ไป Data/UI หรือคัดลอกกฎคำนวณใส่ bootstrap เพื่อหลบข้อจำกัด ไม่มีการเปลี่ยน Core State Machine หรือ Save Schema ใน Sprint นี้

**ข้อจำกัด Resume ที่ต้องออกแบบใน D3:** `TR-003` Continue และ `TR-016` Retry ของ Core เดิมกลับสู่ `Cutscene` และ bootstrap เดิมรับ resume เฉพาะ current/checkpoint node แบบ Cutscene แต่ Act 1 มี Exploration/Decision ด้วย อีกทั้ง Save Schema ไม่มี dialogue-cursor field โดยตรง ต้องระบุ approved resume bridge/safe Cutscene checkpoint และวิธี reconstruct ตำแหน่งอ่านจาก fields เดิม เช่น current node และ `progress.viewedDialogueIds` พร้อมพิสูจน์ว่าเพียงพอและไม่เล่น effect ซ้ำ ห้ามเพิ่ม cursor field ลง Save Schema, เปลี่ยนชื่อ state เป็น Cutscene ขณะที่ node ยังเป็นคนละชนิด หรือย้อน choice ที่บันทึกแล้วโดยเงียบ ๆ ให้ทดสอบ reload หลัง exploration interaction และหลัง choice แต่ละคู่แยกจาก reload กลาง cutscene หากรักษาสัญญาไม่ได้ภายใต้ fields/transitions เดิมต้อง replan ก่อน Coding

| กรณี | นโยบายที่แผนต้องรักษา / Evidence |
|---|---|
| New Game | defaults จาก package; flags ทุกตัวมีค่าตั้งต้น; Bond=0; entry resolve ภายใต้ version เดียว |
| เซฟ Act 1 รุ่นเดียวกัน | current node, checkpoint, cursor, flags, metrics และ event occurrence resolve; Resume ไม่เล่น on-enter effect ซ้ำ |
| เซฟ Mock `contentVersion=1.0.0`, `tree.prologue`, `node.prologue.*` | ห้ามแปลงเป็น Act 1 ด้วย version string เท่ากันหรือเปลี่ยนความหมาย ID; ต้องมี compatibility decision ก่อน Task 4 |
| ไม่มี mapping ที่อนุมัติ / future version / corrupt save | ไม่เสนอ Continue ที่ใช้ไม่ได้; เก็บ raw candidates; อธิบายทางเลือก recovery/New Game และขอ consent ก่อน destructive reset/overwrite ตาม `FR-SAV-006` |
| Storage unavailable/quota | session เล่นได้แบบ memory-only พร้อมข้อความเตือน; ไม่แสดงว่าบันทึกสำเร็จ |
| Rollback | ทดสอบการกลับ artifact รุ่นก่อนกับเซฟใหม่ด้วยหลัก fail safely; ไม่ downgrade content/save โดยเดาและไม่ลบข้อมูลอัตโนมัติ |

**ข้อเสนอ compatibility:** เลือก content version ใหม่ที่ไม่ชน Mock และไม่อ้างรองรับ migration จาก Mock จนมี explicit mapping ที่ตรวจได้ วิธีนี้ไม่ต้องแก้ Save Schema แต่ต้องแก้ flow consent ให้ครบก่อนแทนที่ Mock ห้ามใช้พฤติกรรมเก่าที่เริ่มใหม่หรือบันทึกทับข้อมูลที่ incompatible โดยเงียบ ๆ เป็นเกณฑ์รับงาน

### 3.5 RFC ภายในแผน: `CR-0002` — Act 1 Package Execution Contract

สถานะ: **D1/D2/D4 direction locked by Tech Lead Step 1; D3 และ application/save integration ยังรอ Step 3** ประเภท C2 cross-layer implementation พร้อม versioned schema extension รายละเอียดใน [ADR-P0-013](../adr/ADR-P0-013-content-validation-contract.md) ตาราง Options ด้านล่างเก็บบริบทก่อนตัดสิน ส่วน disposition ถัดไปเป็นคำตัดสินปัจจุบัน

**Context / Problem:** Act 1 เต็มต้องใช้รูปแบบที่ Mock ยังไม่รองรับ และ [CR-0001 Section 2.3](../rfc/CR-0001-sprint-01-core-contract-clarifications.md) ยังเปิดเรื่อง flag semantics จึงห้ามถือว่า Sprint 1 complete เท่ากับ Content Engine ทุก capability พร้อมแล้ว

**Goals / Non-goals:** ทำให้ package, progression, graph และ save ใช้ร่วมกันได้ภายใต้ Canon เดิม; ไม่เพิ่ม Act 2, Ending ใหม่, Core state/transition ใหม่, Save Schema หรือ runtime dependency

| ประเด็นตัดสิน | หลักฐาน / ทางเลือก / ข้อเสนอสำหรับ review | ผู้ตัดสิน / ต้องปิดก่อน |
|---|---|---|
| D1: จุดพักท้าย Act 1 | `NAR-SC-A1-007` ต้องต่อ Cutscene ของ Act 2 แต่ `cutscene.nextNodeId` ปัจจุบันบังคับ และ `ending.act` ต้องเป็น 5 ไม่มี chapter-end node ทางเลือกคือ (ก) ขยาย narrative contract ให้มีขอบเขต package ที่ระบุการพัก/กลับหน้าเริ่มต้นชัดเจนโดยคง state `Cutscene` หรือ (ข) ขอขยาย scope ให้มี target เนื้อหาจริงที่องก์ถัดไป ข้อเสนอคือ (ก) พร้อม version/compatibility และ exit evidence; ยังไม่อนุมัติชื่อ field หรือ semantics ห้ามสร้าง Act 2 placeholder, ใช้ Act 5 Ending, ใส่ self-loop หรือ allowlist missing target เพื่อให้ test ผ่าน | Narrative Director, Architect, QA / Task 1 contract freeze, Task 2 final graph, Task 3–5 |
| D2: Flag policies | Schema มี value type/default แต่ไม่มี enum/counter/monotonic policy ซึ่ง Core ต้องใช้ตาม CR-0001 ทางเลือกคือ versioned semantic registry ข้าง package หรือ schema extension ข้อเสนอคือ registry ที่มี strict contract, ผูก content version และตรวจค่าเทียบ GDD; ไม่เพิ่ม field ลง package เดิมหรือ hard-code flag เฉพาะใน Core ต้องกำหนด unique-hotspot occurrence และหลักฐาน leaf discovery ด้วยข้อมูลที่มี contract รองรับ | Architect, Game Designer / Task 1–2 |
| D3: Execution capability | ต้องรองรับ dialogue variants/cursor, exploration, on-enter effects, markers และ checkpoint ผ่าน pure use cases ที่เรียก Core เดิม ทางเลือกคือ additive pure orchestration ภายใต้ `src/core/use-cases/` หรือย่อ scope เป็น Mock ซึ่งไม่บรรลุ Goal ข้อเสนอคือ additive orchestration เฉพาะ Act 1 ภายใต้ Task 4 พร้อม API, state/effect ordering, event occurrence และ test contract; ถ้าทำไม่ได้โดยคง State Machine/Save Schema ต้องกลับมา replan ก่อน Coding | Architect, Game Designer, QA / Task 2 capability review และ Task 4 |
| D4: Validator / version / migration policy | เลือกการพิสูจน์ Draft 2020-12 และ local `$ref` โดยไม่มี runtime dependency; ล็อก supported keywords กับ parity fixtures และคำสั่ง gate ที่มีจริง ล็อก content version ใหม่และนโยบาย Mock-save ตาม Section 3.4; production ID mapping ต้องไม่เปลี่ยนความหมายเดิม | Architect, Quality and DevOps / Task 1, Task 4 |

**Impact:** Data contract/index/locale, pure progression, bootstrap, checkpoint/Resume, narrative continuity, graph oracle และ negative fixtures ต้อง review ร่วมกัน โดยทุกการเปลี่ยนที่อนุมัติต้องมี Requirement → Design → Artifact → Test → PR trace การอนุมัติ Phase 0 เดิมยังคงใช้ได้; เปิดเฉพาะช่องว่าง Production เหล่านี้

**Security / Privacy:** รับเฉพาะ validated data, ไม่มี executable JSON, network เพิ่มเติมหรือข้อมูลผู้เล่นออกนอกเครื่อง; failure ไม่เผย raw save/content และไม่ลบข้อมูล

**Test Strategy:** valid/invalid contract fixtures, exact Canon effects, feasible graph paths, event/cursor idempotency, compatibility matrix และ browser smoke ตาม Tasks 1–5

**Rollout / Rollback:** ปิดคำตัดสินพร้อมชื่อผู้อนุมัติ/วันที่/หลักฐานใน CR ก่อนเริ่มงานที่พึ่งพา; เพิ่ม validator/fixtures ก่อน Content และ Integration; เปิดใช้ Act 1 เมื่อ gates ครบ การเปลี่ยน Schema ต้องมี version และ compatibility decision ใน PR เดียวกัน การ rollback ใช้ revert ผ่าน feature PR และคง raw saves; ห้ามแก้ Schema ที่เผยแพร่แล้วโดยคงความหมาย/version เดิม ถ้าตัดสิน Architecture ระยะยาวต้องบันทึก ADR ใหม่ ไม่แก้เหตุผล ADR เดิมย้อนหลัง

**Approvals:** การ merge PR เอกสารไม่ถือว่า D1–D4 Approved โดยปริยาย Reviewer ต้องระบุ disposition รายข้อ รวมการอนุมัติ semantic registry ตาม CR-0001 และผู้รับผิดชอบที่เกี่ยวข้อง

### 3.6 Definition of Ready ก่อนเริ่มแต่ละ Task

**Disposition จาก Tech Lead Step 1 (2026-09-04):**

- D1 materialize schema `v1.1.0` ให้ Cutscene Act 1 มี `completion.kind=act-rest` แทน `nextNodeId`, checkpoint หลัง node และ completion marker ชัด ไม่สร้าง Ending/Act 2 placeholder; พฤติกรรม UI/บันทึกเมื่ออ่านจบยังอยู่ Task 4
- D2 ใช้ `flagDefinition.policy` ใน package schema 1.1 แบบ strict enum/boolean/marker/counter ตาม ADR-P0-013 (เลือก schema extension แทน sidecar proposal เดิม) ตรวจ `exploration.safe_observations` 0–20 monotonic/saturating และ `memory.home_focus` พร้อม default `unset`; CR-0001 Section 2.3 มี data-policy disposition แล้ว ส่วน runtime enforcement/unique hotspot เป็น D3
- D4 ใช้ pure JS schema assertions + local registry snapshot, ไม่มี npm; schema 1.0 เดิมคงไว้และตรวจได้ แพ็กเกจรุ่นใหม่ opt-in 1.1; actual Act 1 contentVersion และ old-save migration/consent ยังต้องล็อกเมื่อทำ Content/Integration
- Task 1 ผ่าน DoR ตาม directive: inputs/outputs/typed errors, schema versions, negative fixtures, privacy/boundaries, migration=none และ rollback ระบุใน ADR/Test/Audit Record ไม่มีการใช้ D3 ที่ยังไม่อนุมัติมาขวางงาน Validator ซึ่งไม่ execute state

ใช้ [JKB-P0-AI-001 Section 6](../phase-0/06-ai-agent-engineering-guide.md) และ [Spec-driven loop](../../.agents/workflows/spec-driven-loop.md):

- [ ] Requirement/Canon ที่เกี่ยวข้องไม่มี conflict; คำตัดสิน CR-0001/CR-0002 ที่ Task พึ่งพามีผู้อนุมัติและหลักฐาน
- [ ] Input/output/error contract, schema version, effect capability, file ownership และขอบเขตหนึ่ง PR ชัดเจน
- [ ] Acceptance Criteria รวม success/failure; fixture, expected result และ evidence location พร้อม
- [ ] ประเมิน State, Narrative, Localization, Accessibility, Security, Performance และ Save Compatibility ครบ
- [ ] Stable-ID registry, flag policy, callback mapping, checkpoint และ rollback ตัดสินครบตามผลกระทบ
- [ ] Narrative/Game Design/Architecture/QA อนุมัติเฉพาะส่วนที่อยู่ในอำนาจตน; Asset ใดที่จะนำเข้ามี provenance

**Disposition จาก Tech Lead Step 2 (2026-09-04):** อนุมัติ Tasks 2/3 ตาม directive พร้อม schema 1.1 ที่ล็อกแล้วและ Act 1 Canon ทั้งเจ็ดฉาก มี contentVersion `2.0.0` แยก Mock, explicit node/edge/test registry และ callback ledger ใน [Content Matrix](../traceability/sprint-02-content-matrix.md). Hotspot ใช้ node-entered events/maxOccurrences=1; leaf discovery เป็น graph dominator พร้อม occurrence evidence โดยไม่เพิ่ม progress flag. Test-only model ตรวจ ordering ด้วย Core เดิม; capability review ของ D3 ระบุว่าต้องประกอบ on-enter/variant/cursor/checkpoint/Resume จริงใน Task 4 ก่อนเล่นผ่าน browser

DoR ของ Step 2 ครอบคลุม inputs/outputs/errors, canonical deltas, schema version, Thai resources, fixture/expected outcomes, file ownership, security/provenance (ไม่มี asset ใหม่), compatibility=ยังไม่ activate package และ rollback local commit ตาม [บันทึก Task 2/3](../changelog/2026-09/2026-09-04-0959-sprint-02-task-02-03-content-graph.md). ข้อความเรื่อง Bond ใน Act 2 ต่างจาก NAR-CON-005 เป็น follow-up ของ CR-0002 สำหรับองก์ถัดไป; ทุกแหล่งตรงกันว่า Act 1 Bond=0 จึงไม่ขวางงานรอบนี้และไม่เปลี่ยน future Canon

Checklist ด้านบนยังเป็นแม่แบบสำหรับ Tasks 4–5; หลักฐาน Tasks 1–3 ใน Section 7 ไม่ถือว่าปิด D3 ของ Application หรือแทนการอนุมัติ Thai editorial/sensitivity ก่อน merge

---

## 4. แผนงานย่อย (Work Breakdown Structure - WBS)

ลำดับส่งมอบคือ **Contract Review → Task 1 → Task 2/3 → Task 4 → Task 5** Task 2 เริ่มวาง narrative mapping และ Task 3 เริ่มออกแบบ invalid fixtures คู่ขนานได้เมื่อ interface ล็อกแล้ว การผ่าน Task 2 ต้องใช้ผลจาก Task 3 และ Narrative Review ร่วมกัน ทุก Task มี Owner หนึ่งรายและ Change Record; ตาม directive ล่าสุดให้ commit ภายใน feature branch เดียวก่อน และรอครบสามรอบจึงเปิด PR ตามคำสั่ง

- [x] **Task 1: Content Schema Validator & Package Loader (`src/data/content/content-loader.js`)**

  **Owner:** Data Maintainer; Review: Architect และ QA\
  **Dependencies:** CR-0002 D1/D2/D4 และ CR-0001 flag-policy disposition\
  **Artifacts:** loader, โมดูล validation ที่จำเป็นใน `src/data/validation/`, `tests/unit/content-loader.test.js`, fixtures ใน `tests/fixtures/content/`; contract/registry ที่เพิ่มต้องเป็นไปตามคำตัดสิน CR

  **Acceptance Criteria:**
  1. package fixture ที่ valid โหลดได้ทั้ง root/subpath และ nested narrative tree/catalogs ผ่าน Schema ที่ประกาศก่อนมีการสร้าง usable index
  2. Invalid JSON, HTTP/load error, wrong version/type, missing field/`th`, unknown property/effect, duplicate IDs, dangling reference และ invalid path ถูกปฏิเสธด้วย typed code/path โดยไม่มี partial session หรือ save write
  3. ตรวจทุก namespace รวม choice/interaction IDs ข้าม node, checkpoint/warning/test references; `testReferenceIds` resolve กับ test catalog ของชุดตรวจ ไม่ import tests เข้าตัวเกม
  4. Semantic checks ครอบคลุม flag value/policy, enum, counter bounds, monotonic marker, effect conflicts, checkpoint policy และ disabled reason ตาม `DR-*`; unknown capability ต้อง fail ก่อนเล่น
  5. คืน immutable versioned records/indexes ที่ caller แก้ไม่ได้; caller เปลี่ยน fixture ต้นฉบับภายหลังไม่เปลี่ยนข้อมูลของ session
  6. Register local `$id/$ref` และมี valid/invalid parity evidence สำหรับ contract ที่ใช้จริง; runtime ไม่ใช้ Node API หรือ remote Schema service

- [x] **Task 2: Canonical Act 1 Content Package (`src/data/content/packages/act-01.json`)**

  **Local delivery:** package 14 nodes / 7 scenes / 46 dialogue records / 13 events ผ่าน validator และ graph; contentVersion 2.0.0 / schema 1.1.0. `[x]` หมายถึง implementation/automated verification ใน Step 2; Thai human editorial และ sensitivity approval ตาม AC7 ยังรอตรวจจริงก่อน merge ไม่ถือว่าผ่านโดยการเขียน package

  **Owner:** Lead Narrative Director; Review: Game Designer, Thai Editor, Data Maintainer และ QA\
  **Dependencies:** Task 1 contract freeze, CR-0002 D1–D3; ผลตรวจรับใช้ Task 3\
  **Artifacts:** aggregate JSON, Thai system resources ใน `src/data/localization/` ที่จำเป็น, versioned semantic registry ตาม CR และ `docs/traceability/sprint-02-content-matrix.md` สำหรับ scene/choice/flag/callback/test mapping (สร้างในรอบ Execution)

  | Canon Scene | สิ่งที่ต้องอยู่ใน package | State / Output |
  |---|---|---|
  | `NAR-SC-A1-001` | แสงผ่านน้ำ จังหวะครอบครัว และความอบอุ่นก่อนโลกมีชื่อ ตาม `NAR-LINE-A1-001` | Cutscene → Exploration |
  | `NAR-SC-A1-002` | สำรวจใบบัว ราก เงา เสียงเรียก; คำแนะนำแม่กบตาม `NAR-LINE-A1-002`; hotspot ที่สังเกตซ้ำไม่เพิ่ม count | Exploration → Decision; `exploration.safe_observations` |
  | `NAR-SC-A1-003` | เลือกตามแม่กบ ฟังราก หรือเล่นกับพี่น้องครบสาม intent ไม่ลงโทษ tutorial | Decision → Cutscene; `memory.home_focus=mother/roots/siblings` |
  | `NAR-SC-A1-004` | ลมเปลี่ยน น้ำยกตัว พายุและการพลัดพรากเกิดเสมอ พร้อม content notice | Cutscene → Decision; `story.storm_survived=true` |
  | `NAR-SC-A1-005` | เรียกหาครอบครัวหรือหาช่องอากาศ; prototype `NAR-LINE-A1-003` และ coping variants | Decision → Exploration; effects ตามตารางถัดไป |
  | `NAR-SC-A1-006` | พบ hotspot ใบบัวก่อนเลือกเก็บ/ปล่อย; prototype `NAR-LINE-A1-004` และ alternate expression | Exploration → Decision → Cutscene; keepsake/coping |
  | `NAR-SC-A1-007` | ความเงียบหลังพายุ การหายใจ ความหวังและเงาร่างเริ่มเปลี่ยน ไม่เล่า Act 2 ล่วงหน้า | Cutscene; `story.act1_complete=true`; จุดพัก/ขอบเขตตาม D1 |

  เจ็ด Scene IDs เป็นหน่วย Canon ไม่ใช่ข้อบังคับว่ามีเพียงเจ็ด runtime nodes เช่น A1-006 ต้องแยก exploration/decision ตาม node type ทุก node ที่เพิ่มเพื่อ feedback/foldback ต้อง trace กลับฉากเดิม มี stable ID ที่ผ่าน review และไม่เพิ่มเหตุ Canon ใหม่

  | Decision ID | Preconditions | Metric delta | Flag เมื่อ commit |
  |---|---|---|---|
  | `GDD-DEC-A1-001-A` | ไม่มีเงื่อนไขพิเศษ | HP −5, Sanity −10 | `coping.called_for_family=true` |
  | `GDD-DEC-A1-001-B` | ไม่มีเงื่อนไขพิเศษ | HP +5, Sanity −5 | `coping.sought_safety=true` |
  | `GDD-DEC-A1-002-A` | พบ hotspot ใบบัว | Sanity +10 | `keepsake.lily_fragment=true` |
  | `GDD-DEC-A1-002-B` | พบ hotspot ใบบัว | Sanity +5 | `coping.let_go_early=true` |

  **Acceptance Criteria:**
  1. Scene coverage 7/7; home-focus ครบสามทางและสอง decision หลักครบสี่ choices; ไม่ตัด exploration, tutorial หรือ decompression เพื่อให้ package สั้นลง ไม่เพิ่ม storm damage นอก Canon
  2. defaults 80/70/0; Boolean default=false, `memory.home_focus=unset`, `exploration.safe_observations=0` โดย counter อยู่ 0–20 saturating และนับ hotspot เดิมได้ครั้งเดียว ใช้ registry/policy ที่อนุมัติ ห้ามเพิ่ม progress flag ใหม่โดยเดา
  3. ทุก choice/interaction มีเงื่อนไข, unavailable behavior/reason, effects, immediate feedback และ target ตาม Schema; ใช้ checkpoint policy ของ parent node และ test trace ใน external matrix โดยไม่เพิ่ม node-level fields ลง choice/interaction หนึ่งครั้งที่เลือกตั้งเฉพาะ flag ที่ประกาศ ไม่มี variant อ้างว่าผู้เล่นเลือกทั้งสองทาง
  4. Major branch มี immediate feedback; Act 1 แสดง variants ตาม Canon เช่น `NAR-MTX-A1-001/002` ส่วน delayed callbacks ในองก์หลังมี ledger ระบุ setup/payoff, Requirement, owner และ milestone ของ Phase 2 ที่ต้องส่งมอบ เช่น keepsake ใน Act 4/5 การเพิ่ม callback ภายใน Act 1 เป็นข้อเสนอที่ต้องผ่าน Narrative Review ไม่ใช่เงื่อนไขเวลาที่ baseline บังคับ ห้ามใส่ ID ของ event/node อนาคตใน runtime reference ที่ยัง resolve ไม่ได้ และไม่อ้างส่งมอบ delayed payoff ที่ยังเป็นแผน
  5. Conditional dialogue ใช้ DSL ไม่ใช่ JS expression มี priority, tie rule และ default; keepsake=false ไม่มีข้อความว่าพกใบบัว; `memory.home_focus` ทุกค่า/default มี expression ที่สมเหตุผล
  6. Bond คง 0 และไม่มี content effect เพิ่ม Bond; อารมณ์จากการหาครอบครัวหรือเลือกปลอดภัยได้รับการยอมรับทั้งคู่ ไม่มีคำยืนยันความตาย ภาพศพ การกล่าวโทษ หรือถ้อยคำตีตรา; ช่วงหนักมี decompression ตาม `GDD-SAFE-005`
  7. Thai source/labels/warnings/accessibility resources ครบ, Schema/graph ผ่าน, มี Thai human editorial และ sensitivity review พร้อมผู้ตรวจ/วันที่ก่อน merge Content; budget Act 1 20–30 นาทีเป็นเป้าประเมินการอ่าน ไม่เพิ่มฉากเติมเวลา
  8. จบที่ Act 1 boundary ซึ่งอนุมัติใน D1 และ checkpoint เล่นต่อได้; ไม่ตั้ง `endingId`, ไม่สร้าง Act 2 placeholder หรือ claim Full Release ending coverage

- [x] **Task 3: Automated Content Graph & Reachability Test Suite (`tests/unit/content-graph.test.js`)**

  **Local delivery:** 76 tests ผ่าน; nodes 14/14, edges 21/21, 689 reachable states และ 192 terminal states (16 hotspot subsets × 12 Canon outcomes). 36 route cases, 24 hotspot orders, replay/counter bounds และ negative graph fixtures ผ่าน; [Content Matrix](../traceability/sprint-02-content-matrix.md) แยก Canon/synthetic-default evidence และ deferred payoffs

  **Owner:** Quality Owner; Review: Data Maintainer และ Narrative Director\
  **Dependencies:** Task 1 contract, Task 2 candidate package, approved D1 boundary\
  **Artifacts:** graph test suite, focused fixtures/test catalog และ evidence ที่ trace เข้าตาราง Content

  **Acceptance Criteria:**
  1. ใช้ entry tree/node จริง; สร้าง adjacency จาก cutscene target, choices, interactions, event transitions และ retry/recovery ที่ประกาศใน contract ครบ ตรวจ reference ทุกชนิดก่อนเดิน graph ไม่ยอมให้ traversal ข้าม missing target
  2. Structural reachability = nodes ที่ reachable จาก entry ÷ nodes ใน Act 1 package = **100%**; ไม่มี orphan, duplicate, dangling edge หรือ undeclared replay-only node ข้อยกเว้น boundary ใช้ได้เฉพาะสัญญาที่อนุมัติ ไม่ใช้ test whitelist
  3. ตรวจ state-feasible path ด้วย node-type mapping และ `TR-*`; โดยเฉพาะ Decision → Decision โดยตรงใช้ไม่ได้ ทุก edge มี derived source/target state, condition, priority/fallback และ Test ID ใน evidence
  4. วิเคราะห์ snapshot ที่ reachable จริง: guard ของ choice จาก pre-state และ target entry จาก candidate ตามลำดับ Core; ทุก non-boundary state มี eligible continuation หรือ recovery ที่ถูกต้อง BFS ที่ไม่ดูเงื่อนไขอย่างเดียวไม่ถือว่าผ่าน
  5. ครอบคลุม home-focus × coping × keepsake อย่างน้อย **3 × 2 × 2 = 12 เส้นทางหลัก** รวมลำดับ hotspot/การไม่สำรวจทั้งหมดที่อนุญาต, flag-default cases, minimum/maximum counter และการกด hotspot ซ้ำ; มี deterministic path witness ถึง narrative nodes/variants ที่ reachable จาก approved entry states ส่วน safety/default fallback และ crisis ที่ไม่เกิดใน Canon routes ใช้ synthetic fixtures แยกตามข้อ 8 ไม่สร้างกิ่ง Canon เทียมเพื่อให้มี witness และไม่ยกเว้น orphan ใน structural denominator ของ package
  6. ตรวจ cycle/strongly connected components: ไม่มีวงวนไร้ทางออก, automatic effect loop, farming count/metrics หรือ callback ซ้ำเกิน occurrence; loop สำรวจ/retry ที่อนุญาตต้องมี exit และ termination evidence
  7. ตรวจ checkpoints, Thai coverage, dialogue fallback/ambiguous priority, setup/callback ledger และ semantic policy; negative fixtures ต้องทำให้ตรวจจับ orphan, missing target, impossible guard, forbidden transition, dead cycle, missing `th`, invalid checkpoint และ missing callback reference ได้จริง
  8. ทดสอบ crisis priority/retry ด้วย fault/synthetic state fixtures แยกจาก Canon routes ไม่เติมอันตรายใหม่เพื่อให้เกิด GameOver ใน Act 1; รายงาน `GRAPH-GATE` ว่า scoped Act 1 พร้อมอัตรา node/edge/route coverage จริง ส่วนเส้นทางไปสาม Ending เป็น Deferred to remaining Phase 2

- [ ] **Task 4: Bootstrap Content Integration & Mock Deprecation (`src/bootstrap/index.js`)**

  **Owner:** Application Maintainer; Review: Architect, Data/UI Maintainers และ QA\
  **Dependencies:** Tasks 1–3 ผ่านขอบเขตที่เกี่ยวข้อง, D1–D4 ปิดครบ\
  **Artifacts:** bootstrap, pure content orchestration ใน `src/core/use-cases/` เฉพาะที่อนุมัติใน D3, content/localization adapters, `tests/unit/bootstrap.test.js` และ focused orchestration tests; mark Mock deprecated พร้อม replacement/compatibility record ก่อนลบ

  **Acceptance Criteria:**
  1. `index.html` ที่ serve ผ่าน HTTP(S) โหลด Act 1 จาก JSON ตาม URL ที่รองรับ subpath ก่อนเริ่ม session; fatal loading/schema error ใช้ Thai recovery shell; runtime network มีเฉพาะ same-origin static resources
  2. New Game เข้าฉากแรกจาก package, Title/system UI แยกจาก narrative node types, View Model immutable และทุก string resolve ผ่าน resource ไม่มี raw JSON เข้าสู่ renderer
  3. เล่น Cutscene → Exploration → Decision → ผล/ฉากถัดไปครบ; dialogue cursor, conditions, entry guards, events และ on-enter effects ผ่าน pure contract และ State Machine เดิม ไม่ hard-code route ของ Act 1 หรือ condition=true ใน bootstrap
  4. Choice commit lock และ immediate feedback ก่อนเดินเรื่องถูกต้อง; on-enter/hotspot/callback effect เกิดครั้งเดียวตาม occurrence แม้ double input หรือ Resume; transaction ที่ invalid ไม่เปลี่ยน snapshot/checkpoint/save
  5. Auto-save/Resume/Retry รักษา metrics, flags, node/cursor, checkpoint, revision, RNG และ settings ตามสัญญาเดิม; ครอบคลุม Cutscene/Exploration/Decision ด้วย resume policy ใน D3 โดยไม่มี state/node mismatch; content-incompatible saves ใช้นโยบาย consent ที่อนุมัติและไม่เสีย raw data
  6. ซ่อน Bond ทั้งภาพและ accessibility tree ตลอด Act 1; meter/feedback/save/failure announcement ใช้ข้อความไทยและ keyboard flow เดิมได้
  7. Main startup ไม่ import/use Mock หลัง Integration; regression fixture เก็บ Mock ได้ใน tests โดย Production ห้าม import tests การเลิกใช้ไม่ลบ stable IDs จาก compatibility record หรือทำให้ old-save recovery หาย
  8. จบ Act 1 ด้วย checkpoint และทางเลือกที่ใช้งานได้ตาม D1; reload/resume ที่ boundary ไม่เล่น effect ซ้ำ ไม่มี game-state ใหม่หรือ `RETURN_TITLE` transition จาก Cutscene ที่ตารางเดิมไม่รองรับ

- [ ] **Task 5: End-to-End Act 1 Playthrough Smoke Test & Verification**

  **Owner:** Quality and DevOps Specialist; Review: Narrative Director, Accessibility Reviewer และ Technical Lead\
  **Dependencies:** Task 4 integrated candidate, Tasks 1–3 evidence ครบ\
  **Artifacts:** browser smoke scenario/evidence ใน `tests/e2e/` เมื่อ tooling ที่เลือกมีจริง, walkthrough matrix, traceability update และ Change Record ปิด Sprint

  **Acceptance Criteria:**
  1. Browser จริงเล่น Title → Act 1 ทั้งเจ็ดฉาก → approved boundary/checkpoint → reload/Continue ได้; ตรวจทั้ง call/seek-safety และ keep/release รวม home-focus variants เทียบ package ส่วนชุด 12 routes ตรวจซ้ำอัตโนมัติใน Task 3
  2. บันทึกภาพ/ขั้นตอน/expected-vs-actual ของ feedback, meter/flag outcome, checkpoint และ Resume; inspect state ผ่าน test harness โดยไม่มี telemetry และไม่มี on-enter/coping/keepsake effect ซ้ำ
  3. ทำ negative smoke สำหรับ content load/validation failure, old Mock save, corrupt save, unavailable/quota storage และ double input; error อ่านได้ กู้คืนได้ และ raw save ถูกเก็บเมื่อยังไม่มี consent
  4. Keyboard-only, focus order/visible focus, live announcements, screen-reader smoke, text zoom 200%, 320 CSS px reflow, touch target 44×44, contrast AA และ reduced motion ผ่านใน flow Act 1 ที่เปลี่ยน บันทึก browser/version/OS/viewport/assistive technology จริง
  5. ตรวจ static root/repository subpath, console errors และ same-origin requests; บันทึก payload/performance profile ตาม `NFR-PE-001/002/004/005` โดย critical HTML/CSS/JS/JSON ≤500 KB compressed, initial transfer ≤2 MB และ save candidate ≤250 KB UTF-8; ห้ามอ้าง percentile ผ่านจากการจับเวลาเพียงครั้งเดียว
  6. รัน regression เดิมทั้ง 183 cases พร้อม cases ใหม่ผ่าน 100%; UI/content assertions ที่เปลี่ยนตามการปลด Mock ต้อง trace พร้อม replacement coverage ห้ามลบ invariant หรือ skip critical test เพื่อให้จำนวนผ่าน
  7. Thai Editorial/Narrative และ Accessibility Review มีผลจริงและผู้รับผิดชอบ; ทุก gate ระบุ Passed/Failed/Not run/Deferred พร้อมเหตุผลและหลักฐาน ไม่ใช้ browser smoke ครั้งเดียวแทน release browser matrix หรือ G2

---

## 5. สิ่งที่อยู่นอกขอบเขตในสปรินต์นี้ (Non-goals)

- ไม่ผลิตหรือ integrate Act 2–5 และไม่สร้าง Full Release Ending ทั้งสาม; callback ในองก์หลังเก็บเป็น trace obligation ไม่สร้าง dangling runtime reference
- ไม่ทำ Web Audio Engine, music/ambience/effects pipeline ใน Sprint 2; ยกยอดไป Sprint 3 โดยข้อความ Act 1 ต้องสื่อสารได้ครบเอง
- ไม่ผลิต art/animation/voice acting เต็มชุด ไม่เพิ่ม asset ที่ไม่มี provenance และไม่สร้างโฟลเดอร์/placeholder โดยไม่มี artifact จริง
- ไม่เพิ่ม runtime dependencies, bundler, framework, backend, login, monetization, telemetry, cloud save หรือ external runtime service
- ไม่แก้ Core State Machine, state enum, transition table, Choice/Crisis/Ending balance rules หรือ Save Schema; pure orchestration ที่จำเป็นต้องอยู่ใน D3 scope ที่อนุมัติ
- ไม่เปลี่ยน Canon, stable-ID meaning, GDD meter delta หรือ invent flags; หาก contract เดิมรองรับไม่ได้ต้องปิด CR ก่อน ไม่ลดข้อกำหนดเพื่อให้ส่งมอบได้
- ไม่ทำ localization ภาษาใหม่, Settings/history UI เต็มระบบ หรือ generalized event capabilities ที่ Act 1 ไม่ใช้
- ไม่ Deploy, Release, auto-merge หรือประกาศ Phase 2/G2 ผ่าน การอนุมัติเอกสารรอบนี้ครอบคลุม commit/push/PR เท่านั้น

---

## 6. เกณฑ์การส่งมอบงาน (Definition of Done - DoD)

### 6.1 DoD ของ Sprint Execution

1. DoR และคำตัดสิน D1–D4 ครบ; Tasks 1–5 ผ่าน Acceptance Criteria มีหลักฐานและ reviewer ตาม ownership ไม่มีข้อขัดแย้งที่ถูกซ่อนด้วย exception ใน tests
2. Act 1 Canon scene coverage 7/7 และ production records ผ่าน Schema/semantic validation **100%**; invalid fixtures ถูก reject ตาม expected code/path; local references/Thai coverage/provenance ครบ
3. Graph node reachability **100%**, routes หลัก 12/12 ผ่าน พร้อม condition-feasible paths, checkpoints, legitimate boundary และไม่มี deadlock/missing target/forbidden cycle; ไม่อ้าง Canon-ending coverage ขององก์ที่ยังไม่มี
4. Unit regression เดิม **183 tests + tests ใหม่ ผ่าน 100%**, failures/cancelled/skipped critical tests เป็นศูนย์ ไม่มีการลด assertion เพื่อปิดงาน
5. เล่น Act 1 บน browser จริงครบ success/recovery flows; New Game, Auto-save, Resume, repeat input, flags/callbacks และ Bond visibility ผ่านพร้อมหลักฐาน UI/a11y/performance ตาม Task 5
6. Import/Port/immutable boundaries ผ่าน; ไม่มี executable JSON, runtime dependency, secret, player telemetry, external runtime request หรือ asset ที่ยังไม่ได้สิทธิ์
7. ไม่มีการแก้ Save Schema/Core State Machine; content version/compatibility matrix และ rollback evidence ครบ หากต้องเปลี่ยนข้อจำกัดนี้ต้อง replan ไม่ปิด Sprint ด้วยข้อยกเว้นที่ไม่อนุมัติ
8. ทุก change มี Requirement/CR → Design/Schema → Artifact → Test/Evidence → PR; อัปเดต Content Trace Matrix, Change Record, Root CHANGELOG และ Section 7 เมื่อเริ่ม Execution
9. Human Thai Editorial, Narrative, Architecture และ QA approvals ที่บังคับครบก่อน merge งานที่เกี่ยวข้อง การตรวจโดย AI เป็น review evidence ไม่ใช่ผู้อนุมัติสุดท้าย

### 6.2 สถานะ Tooling และวิธีรายงานหลักฐาน

**Step 2 update:** `node --test tests/unit/content-loader.test.js` ผ่าน **120/120** (รวมโหลด Act 1 จริง); `node --test tests/unit/content-graph.test.js` ผ่าน **76/76**; full suite **379/379 = 183 Sprint 1 + 117 Task 1 + 79 Step 2**, fail/cancel/skip/todo=0. `node --check` ผ่าน JS ใหม่ 2 ไฟล์และ loader tests ที่แก้. Scoped GRAPH-GATE Act 1 ครบ structural/state-feasible witnesses; events 11/13 และ dialogues 44/46 จาก Canon routes อีก 2/2 เป็น synthetic defaults. Node/edge denominator ไม่มีข้อยกเว้น Browser/Save/Resume และ human review ยังไม่รัน

**Step 1 update:** มี `content-loader.test.js` แล้ว จำนวน 117 tests; รวม regression เดิม 183 เป็น **300/300 ผ่าน**, ไม่มี fail/cancel/skip ใช้ `node --test tests/unit/*.test.js` และ syntax checks ตามบันทึก Task 1 มี schema snapshot/ref/keyword parity และ typed semantic checks; full metaschema validation ด้วย external reference implementation ยังไม่ได้รัน และไม่อ้าง Full GRAPH-GATE ซึ่งเป็น Task 3

ณ `53de19e` มีคำสั่ง `node --test tests/unit/*.test.js` ที่ใช้จริงและผ่าน 183 tests ส่วน `content-loader.test.js`, `content-graph.test.js` และ Act 1 E2E ยังไม่มี จึงยังไม่อ้างว่ารันหรือผ่าน `SCHEMA-GATE`/`GRAPH-GATE` ของ Sprint 2 แล้ว ชื่อไฟล์และ Test IDs ในแผนเป็น deliverable เป้าหมาย ต้อง materialize และบันทึกคำสั่งจริงใน Task ที่รับผิดชอบก่อนใช้เป็น gate evidence

| Gate | หลักฐานสำหรับ Sprint 2 | ขอบเขตที่ยังไม่อ้างว่าผ่าน |
|---|---|---|
| REQ / AI / ARCH | IDs/links/scope review, approved CR, dependency/Port inspection | การอนุมัติที่ยังไม่มีผู้ลงนาม |
| SCHEMA / GRAPH | validator + valid/invalid fixtures + Act 1 graph/path report | Full-game path ไป Canon และ Reflective Endings |
| CORE / STATE / SAVE | regression และ integration/compatibility/occurrence evidence | migration version ที่ไม่ประกาศรองรับ |
| NARRATIVE / IP | seven-scene/callback review, Thai editorial, actual asset inventory | ภาษา/องก์/asset ที่ยังไม่ได้ผลิต |
| UX / A11Y / PERF / SECURITY | recorded Act 1 browser scenarios, measurements, network/content inspection | audit รับรอง WCAG ทั้งระบบ, browser matrix ระดับ Release และ G2 |
| DEPLOY | ไม่ใช้ใน Sprint นี้ | ไม่มี deployment/release evidence |

Test evidence ต้องระบุ commit, content/schema/save versions, command/environment, pass/fail counts, coverage denominator และลิงก์ artifact การไม่มี tooling คือ **Not materialized / Not run** ไม่ใช่ Passed ส่วนงานที่เลื่อนไปองก์ถัดไปต้องมี owner และ milestone ไม่ปะปนกับข้อผิดพลาดที่ขวาง Act 1

### 6.3 การส่งมอบเอกสารวางแผนรอบนี้

แผนเสร็จในระดับส่ง review เมื่อ Section 1–7 ครบ, รหัส/ลิงก์และข้อจำกัดตรวจแล้ว, ช่องว่างมี CR/owner/dependency, Change Record และ CHANGELOG เชื่อมกัน และมี feature PR ไป `develop` การตรวจในรอบนี้เป็น documentation review และ baseline regression เท่านั้น ไม่ใช่การรับรอง Act 1 implementation ที่ยังไม่เริ่ม

ไม่มี migration ของข้อมูลในรอบเอกสาร การ rollback แผนใช้ revert commit เอกสารผ่าน PR โดยไม่ rewrite shared history ส่วน deployment และการ merge ต้องรอคำสั่งอนุมัติแยก

---

## 7. ทะเบียนประวัติการเปลี่ยนแปลงของสปรินต์ (Sprint Audit Trail & Changelog Register)

บันทึกตั้งต้นของแผน: [CR-20260904-0228 — Sprint 2 SSOT Baseline](../changelog/2026-09/2026-09-04-0228-sprint-02-ssot-baseline.md)

ทะเบียน Execution เริ่มจาก Step 1; เพิ่ม Record ID, timestamp พร้อม timezone และหลักฐานตามผลจริง PR จะเชื่อมเมื่อครบสามรอบและได้รับคำสั่ง

| รหัสบันทึก (Record ID) | วันที่-เวลา (Timestamp) | หัวข้องาน (Task / Milestone) | ไฟล์บันทึกฉบับเต็ม | สถานะ |
|---|---|---|---|---|
| `CR-20260904-0927` | 2026-09-04T09:27:52+07:00 | Step 1 / Task 1 Content Validator & Package Loader | [Task 1 audit](../changelog/2026-09/2026-09-04-0927-sprint-02-task-01-content-validator.md) | Verified locally: 300 tests; not pushed |
| `CR-20260904-0959` | 2026-09-04T09:59:48+07:00 | Step 2 / Tasks 2–3 Canonical Act 1 & Graph Suite | [Tasks 2–3 audit](../changelog/2026-09/2026-09-04-0959-sprint-02-task-02-03-content-graph.md) | Verified locally: 379 tests; human editorial pending before merge; not pushed |
