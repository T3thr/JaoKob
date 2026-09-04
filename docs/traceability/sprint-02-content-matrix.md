# Sprint 2 Act 1 Content Matrix

Version: `1.0.0` — Step 2 implementation candidate, 2026-09-04

Authority: Tech Lead Step 2 directive, [Sprint 2 SSOT](../sprints/sprint-02-ssot.md), [Narrative Bible](../phase-0/02-narrative-bible.md) และ [ADR-P0-013](../adr/ADR-P0-013-content-validation-contract.md). เจ้าของ Canon/ภาษา: Lead Narrative Director และ Thai Editor; ผู้จัดทำ package/test model ไม่ใช่ final editorial approver

## 1. Package และขอบเขต

[act-01.json](../../src/data/content/packages/act-01.json) ใช้ package/tree schema `1.1.0`, catalogs `1.0.0`, contentVersion `2.0.0`, source locale `th`, entry `tree.act1` / `node.act1.opening`. เลือกรุ่นใหม่แยกจาก Mock `1.0.0` เพราะ stable node IDs/โครงสร้างต่างกัน ไม่มีการนำ ID เดิมมาใช้ความหมายใหม่ และไม่มี auto migration ใน Step 2

7 Canon scenes → 14 runtime nodes, 46 dialogue records, 13 events, 7 choices, 6 interactions, 8 flags และ 5 checkpoints. ข้อความใหม่เรียบเรียงจาก Bible ที่อยู่ใน repository รวม prototype ทั้งสี่และ coping variants ทั้งสอง ไม่มี external narrative source หรือ asset ใหม่ (`assets=[]`) ไม่มีเสียง/ภาพที่อ้างแต่ไม่มีไฟล์

ข้อความแสดงผู้เล่นรวม label, prompt, feedback, content warning, accessibilityDescription และ rest action อยู่ใน localized object `{th}` ตาม schema. Key คือ stable record ID + field path เช่น `dialogue.act1.first-light.text`; ไม่มี field `textKey` เพิ่ม ไม่มี HTML/JS ใน JSON. ข้อความระบบนอก package ยังเป็นงาน Task 4

## 2. Scene-to-runtime mapping

ทุก Node ID ในตารางใช้ prefix `node.act1.`; node หนึ่งอยู่ใน Canon scene เดียว ข้อกำหนดเจ็ดฉากไม่ได้จำกัดจำนวน runtime nodes

| Canon Scene / Requirement | Runtime nodes | หน้าที่และหลักฐาน |
|---|---|---|
| `NAR-SC-A1-001`, `NAR-LINE-A1-001` | `opening` | แสงแรก จังหวะครอบครัว ความอบอุ่น; Cutscene → nursery; `tc.act1.routes` |
| `NAR-SC-A1-002`, `NAR-LINE-A1-002` | `nursery`, `observe-lily`, `observe-roots`, `observe-shadows`, `observe-mother` | optional exploration 4 จุด + ทางออกเสมอ; `tc.act1.observations` |
| `NAR-SC-A1-003` | `home-focus`, `home-reflection` | mother/roots/siblings ตั้ง enum โดยไม่มี meter penalty; explicit default; `tc.act1.variants` |
| `NAR-SC-A1-004`, `NAR-CON-001` | `storm` | notice ก่อนพายุ, separation เกิดเสมอ, marker ไม่เพิ่ม damage; `tc.act1.boundary` |
| `NAR-SC-A1-005`, `NAR-LINE-A1-003` | `survival` | ความคิดภายในมี semantic role, choice call/safety; coping response แสดงเมื่อเข้าสู่ `lily-fragment`; `tc.act1.routes` |
| `NAR-SC-A1-006`, `NAR-LINE-A1-004` | `lily-fragment`, `leaf-discovery`, `keepsake` | ดู hotspot ก่อน choice; discovery เป็น dominator, occurrence เป็นหลักฐาน; `tc.act1.preconditions` |
| `NAR-SC-A1-007`, `GDD-SAFE-005` | `rest` | หายใจ/ความเงียบ/ความเปลี่ยนแปลงเล็กน้อยของร่าง ปิดที่ act-rest; `tc.act1.boundary` |

## 3. Edge ledger และ State contract

ทุกแถวมี witness จาก `tc.act1.structure`; conditions ใช้ DSL ใน package. `always` หมายถึงเลือกได้โดยไม่ต้องสำรวจครบ ส่วน target ของ survival/lily-fragment/keepsake/rest ต้องมี `story.storm_survived=true`. Action guard ประเมินจาก pre-state; target guard ประเมินหลัง effects แต่ก่อน on-enter effects

Prefix node ในตารางคือ `node.act1.` และ action คือ `interaction.act1.` / `choice.act1.` ตามที่เขียน ไม่มี implicit edge. Priority `manual` หมายถึงผู้เล่นเลือกเองจึงไม่แข่งขันตาม priority; `single` คือมี next target เดียว. Fallback ของทางออก nursery คือ join-family ซึ่งพร้อมเสมอ; choice แต่ละชุดเลือกได้ครบทุกทางตาม Canon ไม่มีการเลือกแทนผู้เล่น

| Edge ID (ย่อ prefix node/action ตามด้านบน) | Source → Target | State / TR | Condition / Priority / Fallback |
|---|---|---|---|
| `opening.next` | opening → nursery | Cutscene → Exploration / TR-005 | always / single / target เดียว |
| `observe-lily` (interaction) | nursery → observe-lily | Exploration → Cutscene / TR-010 | always / manual / join-family |
| `observe-roots` (interaction) | nursery → observe-roots | Exploration → Cutscene / TR-010 | always / manual / join-family |
| `observe-shadows` (interaction) | nursery → observe-shadows | Exploration → Cutscene / TR-010 | always / manual / join-family |
| `observe-mother` (interaction) | nursery → observe-mother | Exploration → Cutscene / TR-010 | always / manual / join-family |
| `observe-lily.next` | observe-lily → nursery | Cutscene → Exploration / TR-005 | always / single / target เดียว |
| `observe-roots.next` | observe-roots → nursery | Cutscene → Exploration / TR-005 | always / single / target เดียว |
| `observe-shadows.next` | observe-shadows → nursery | Cutscene → Exploration / TR-005 | always / single / target เดียว |
| `observe-mother.next` | observe-mother → nursery | Cutscene → Exploration / TR-005 | always / single / target เดียว |
| `join-family` (interaction) | nursery → home-focus | Exploration → Decision / TR-011 | always / manual / ไม่บังคับ hotspot |
| `focus-mother` (choice) | home-focus → home-reflection | Decision → Cutscene / TR-012 | always / manual / 3 intent พร้อม |
| `focus-roots` (choice) | home-focus → home-reflection | Decision → Cutscene / TR-012 | always / manual / 3 intent พร้อม |
| `focus-siblings` (choice) | home-focus → home-reflection | Decision → Cutscene / TR-012 | always / manual / 3 intent พร้อม |
| `home-reflection.next` | home-reflection → storm | Cutscene → Cutscene / TR-004 | always / single / target เดียว |
| `storm.next` | storm → survival | Cutscene → Decision / TR-006 | storm marker / single / 2 choices eligible |
| `call-family` (choice) | survival → lily-fragment | Decision → Exploration / TR-013 | always + target storm marker / manual / 2 choices พร้อม |
| `seek-safety` (choice) | survival → lily-fragment | Decision → Exploration / TR-013 | always + target storm marker / manual / 2 choices พร้อม |
| `inspect-fragment` (interaction) | lily-fragment → leaf-discovery | Exploration → Cutscene / TR-010 | always / manual / มีจุดสำรวจเดียว |
| `leaf-discovery.next` | leaf-discovery → keepsake | Cutscene → Decision / TR-006 | storm marker + discovery มาก่อน / single / 2 choices eligible |
| `keep-fragment` (choice) | keepsake → rest | Decision → Cutscene / TR-012 | always + target storm marker / manual / 2 choices พร้อม |
| `release-fragment` (choice) | keepsake → rest | Decision → Cutscene / TR-012 | always + target storm marker / manual / 2 choices พร้อม |

Cutscene → Cutscene เป็นการเดิน dialogue/node ต่อในสถานะเดิม ใช้ TR-004 ใน test model; runtime cursor/advance ต้อง materialize ภายใต้ D3 ใน Task 4. Package นี้ไม่มี event redirect, retry edge หรือ Ending; analyzer อ่าน edge kinds เหล่านี้ได้และมี synthetic tests แต่ไม่สร้างฉาก Canon เทียมเพื่อครอบคลุม

## 4. Flags, effects และลำดับเหตุการณ์

| Flag | Default / policy | Writer / invariant |
|---|---|---|
| `memory.home_focus` | unset; enum unset/mother/roots/siblings | focus choices ตั้งเพียง intent เดียว ไม่มี delta |
| `exploration.safe_observations` | 0; integer 0–20, saturate, monotonic | `event.act1.observed-lily/roots/shadows/mother`, amount +1, maxOccurrences=1; Act 1 new game ถึงได้ 0–4; 19/20 เป็น synthetic boundary tests |
| `story.storm_survived` | false; marker | storm on-enter true; พายุหลีกเลี่ยงไม่ได้ ไม่มี storm damage |
| `coping.called_for_family` | false; boolean, non-reversible | call-family; HP −5 / Sanity −10 |
| `coping.sought_safety` | false; boolean, non-reversible | seek-safety; HP +5 / Sanity −5 |
| `keepsake.lily_fragment` | false; boolean, non-reversible | keep-fragment; Sanity +10 |
| `coping.let_go_early` | false; boolean, non-reversible | release-fragment; Sanity +5 |
| `story.act1_complete` | false; marker | rest on-enter true; act-rest contract |

ไม่มี progress flag เพิ่ม การพบเศษใบบัวพิสูจน์ด้วยทางผ่าน `inspect-fragment → leaf-discovery → keepsake` และ `event.act1.discovered-fragment` (node-entered, maxOccurrences=1, effects ว่าง) ซึ่งบันทึก occurrence โดยไม่เพิ่ม safe_observations. การสำรวจ tutorial เป็น optional ทั้งหมดและไม่ใช่ precondition ของ keepsake. Snapshot ที่มาจากกราฟจริงทุกชุดก่อน keepsake มี occurrence นี้แล้ว; การ restore/import snapshot ต้องตรวจความสอดคล้องตาม D3 ใน Step 3 ไม่ใช้การมี flag storm เพียงอย่างเดียวเป็นหลักฐานว่าได้สำรวจใบบัว

Model ordering: action condition(pre) → candidate metrics/flags → target condition(candidate) → Core transaction/transition → target onEnterEffects → node-entered events ตาม priority มากไปน้อย → dialogue ของ event แล้ว dialogue หลัก. Event occurrence เพิ่มหนึ่งครั้งเฉพาะเมื่อ condition เป็นจริงและยังไม่ถึงเพดาน; entry ซ้ำไม่เพิ่ม counter หรือ callback ซ้ำ ไม่มี async/random ใน oracle

การตรวจนี้ไม่สร้าง production event executor. Task 4 ต้องทำให้ ordering/cursor/occurrence/save เป็น atomic และเทียบ witness เดิม ไม่ import test helper เข้าตัวเกม

## 5. Variant และ callback ledger

| Slot | Events (prefix `event.act1.`) | Conditions / priority | Default / Test |
|---|---|---|---|
| home-reflection | home-mother, home-roots, home-siblings | home_focus เท่าค่านั้น / 80 | home-default เมื่อ unset / 0; `tc.act1.variants` |
| lily-fragment | coping-call, coping-safety | flag ของตน true และอีก flag false / 80 | coping-default เมื่อไม่มี exclusive intent / 0; `tc.act1.variants` |

Variants mutually exclusive บนโดเมน enum และ truth table ของ Boolean รวม default ทั้งหมด จึงไม่มี implicit file-order tie-breaker. ทั้งสอง coping flags เป็น true ไม่เกิดใน Canon routes; synthetic fault ใช้ข้อความกลางที่ไม่อ้างการเลือกทั้งสองทาง. Home default และ coping default เป็น safety dialogue records ที่ทดสอบแยก ไม่ใช่ orphan runtime nodes

`event.act1.survival-thought` priority 90 แสดงความคิดภายในเมื่อเข้า survival. Observation events priority 20 และ discovery event priority 20; ทุก event maxOccurrences=1. Home/coping choices อ้าง callbackEventIds ที่มีอยู่จริง; keepsake choices ไม่ใส่ reference ไป event องก์อนาคต

| Setup choice / flag | Requirement | Local response | Delayed payoff / milestone / owner / status |
|---|---|---|---|
| `choice.act1.call-family` / `coping.called_for_family` | `NAR-MTX-A1-001` | immediate feedback + coping-call หลัง commit | เสียงฝนสะท้อนคำเรียกตาม Bible; **Phase 2 Act 5**; **Lead Narrative Director**; Deferred |
| `choice.act1.seek-safety` / `coping.sought_safety` | `NAR-BRN-002` | immediate feedback + coping-safety หลัง commit | setup การตั้งหลักก่อนฟังความคิดถึง; payoff recovery ต้อง review เมื่อผลิต **Phase 2 Act 3**; **Lead Narrative Director**; Deferred / exact prose pending |
| `choice.act1.keep-fragment` / `keepsake.lily_fragment` | `NAR-MTX-A3-003` | feedback เก็บสีเขียวไว้แนบตัว | keepsake memory/recovery และ motif ตาม Bible; **Phase 2 Acts 3/4/5**; **Lead Narrative Director**; Deferred |
| `choice.act1.release-fragment` / `coping.let_go_early` | `NAR-CON-002` | feedback ปล่อยไป ความทรงจำยังอยู่ | expression ผ่านน้ำ/จังหวะราก ไม่กล่าวว่าพกใบ; **Phase 2 Acts 3/4/5**; **Lead Narrative Director**; Deferred / exact prose pending |

Ledger นี้ปิดการ trace ของ setup เท่านั้น ไม่อ้างส่งมอบ delayed payoff หรือ narrative review ขององก์หลัง. Home-focus เป็น flavor intent ที่ไม่มี meter penalty และมี immediate expression; ไม่สร้างภาระ payoff ใหม่เกิน Bible

## 6. Verification model และ coverage denominator

[content-graph.test.js](../../tests/unit/content-graph.test.js) ใช้ [test-only model](../../tests/helpers/content-graph.js), [independent expectations](../../tests/fixtures/content/graph/act-01-expectations.json) และ [test catalog](../../src/data/content/packages/act-01-test-catalog.json) ที่ caller inject เข้า loader. Catalog เก็บ stable test IDs เท่านั้น ไม่ import tests ใน Production; ทุกรายการมีชื่อ test ตรงกัน: `tc.act1.schema`, `tc.act1.structure`, `tc.act1.routes`, `tc.act1.observations`, `tc.act1.variants`, `tc.act1.preconditions`, `tc.act1.boundary`

- Structural และ state-feasible nodes: 14/14; edges: 21/21; ไม่มี whitelist สำหรับ orphan หรือ target ที่หาย
- Exhaustive finite-state traversal: 689 quotient states; terminal states 192 = 16 hotspot subsets × 12 canonical combinations. เก็บทุก flag, metrics, node, event occurrence และ pending redirect ใน state key. Revision/history/time/cursor ไม่ใช่ input ของ condition DSL จึงไม่นับให้เกิด state ไม่สิ้นสุด; save/Resume fidelity ยังไม่ใช่ผลของ model นี้
- จากทุก reachable state มี path ไป rest ด้วย reverse reachability หลังประเมิน guards; SCC ที่วนสำรวจมีทางออก `join-family` และ counter/event bounded; negative fixture จับ state-closed cycle แม้โครงสร้างมีทางออก
- Deterministic witnesses ใช้ replay ยืนยัน node/edge จริงผ่าน Core planner/choice resolver ไม่เชื่อ adjacency อย่างเดียว. Production state machine ไม่เปลี่ยน; trigger ที่ scoped executor ยังไม่รองรับ fail closed
- Canon routes 12/12 × profiles none/some/all = 36 playthrough cases; ตรวจครบ 24 ลำดับของ 4 hotspots และ entry/revisit ซ้ำ 100 ครั้งที่ค่า 0/19/20
- Canon dialogue witnesses 44/46 และ events 11/13; synthetic defaults เพิ่ม 2 dialogue + 2 events จนครบ 46/46 และ 13/13 โดยไม่เพิ่ม Canon routes เทียม
- Negative fixtures/mutations: orphan, closed SCC, guard-closed cycle, missing target/event/callback/Thai, duplicate ID, invalid checkpoint, impossible pre/target guard, unreachable action, forbidden Decision→Decision, ambiguous/default variants, observation farming และ unsupported event capability
- Synthetic crisis ใช้ actual choice delta กับ HP=5/Sanity=10: Core ให้ crisis ก่อน normal target, physical-collapse priority, guarded retry TR-016 และ Story Assist recovery; ไม่มีการเติม GameOver node ใน Act 1 package

ผลปลายทางแต่ละชุดเหมือนกันสำหรับ mother/roots/siblings; Bond=0 ทุกช่วง ไม่ใช่เฉพาะตอนจบ

| Coping × Keepsake | HP | Sanity | Home focus |
|---|---:|---:|---|
| call × keep | 75 | 70 | mother / roots / siblings |
| call × release | 75 | 65 | mother / roots / siblings |
| safety × keep | 85 | 75 | mother / roots / siblings |
| safety × release | 85 | 70 | mother / roots / siblings |

Checkpoint IDs ใช้ prefix `checkpoint.act1.`: opening/storm/survival/keepsake เป็น before-node; rest เป็น after-node. High/irreversible decisions มี checkpoint policy ของ parent; rest มี completion marker, Thai rest message และ action label. การ materialize immutable save snapshot, อ่านจบก่อนพัก, Retry/Resume ที่ decision checkpoint และกลับ Title เป็นงาน D3/Task 4–5 ไม่มีการอ้างผ่านจาก policy metadata

## 7. Review และสิ่งที่ยังไม่ส่งมอบ

- Thai editorial และ sensitivity review โดยมนุษย์: Pending before merge; prototype ไม่แทนการตรวจภาษาใหม่ งบอ่าน Act 1 20–30 นาทีเป็นเป้าประเมินใน walkthrough ยังไม่วัด ไม่เพิ่มฉากเพื่อเติมเวลา
- Browser playthrough, actual event/cursor integration, save/Resume/migration consent, accessibility และ performance: Task 4–5 / Not run ใน Step 2
- Bond คง 0 ในขอบเขตนี้; directive กล่าวถึง Act 2 แต่ NAR-CON-005 กำหนด Act 4 จดเป็นประเด็น future Canon เพื่อให้ Lead Narrative Director/Designer ตัดสินก่อนขยายองก์ ไม่เปลี่ยน baseline ขององก์หลังใน package นี้
- No migration/write ต่อ save ในรอบนี้; Mock ยังคงเป็นเส้นทาง bootstrap จน Step 3. Rollback ใช้ revert commit content/test/docs นี้ ไม่ถอน Task 1 และไม่ rewrite history
- Audit/ผลคำสั่งจริง: [CR-20260904-0959](../changelog/2026-09/2026-09-04-0959-sprint-02-task-02-03-content-graph.md). Full-game ending reachability, release G2 และ deployment ไม่อยู่ในขอบเขต GRAPH-GATE Act 1
