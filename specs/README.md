# JaoKob Machine-Readable Specification Catalog

ไดเรกทอรีนี้เก็บสัญญาข้อมูล Phase 0 ไม่ใช่ Source Code ของเกม ทุกไฟล์ schema ต้องใช้ JSON Schema Draft 2020-12, มี `$id` ที่คงที่, ปฏิเสธ field ที่ไม่รู้จักใน domain object และแยก stable identifier ออกจากข้อความแสดงผล

## Schema Catalog

| Schema | ขอบเขต |
|---|---|
| `schemas/common.schema.json` | ชนิดข้อมูลร่วม เช่น identifier, localization และ meter effects |
| `schemas/character.schema.json` | ตัวละคร คุณลักษณะ และข้อความ localized |
| `schemas/dialogue.schema.json` | ชุดบทสนทนา ผู้พูด เงื่อนไข ตัวเลือก และปลายทาง |
| `schemas/event.schema.json` | trigger, guard, effect และ event outcome |
| `schemas/narrative-tree.schema.json` | graph, node, entry point, act และเส้นเชื่อม |
| `schemas/save-state.schema.json` | envelope ของ save, versions, state, flags และ integrity metadata |
| `schemas/content-package.schema.json` | release unit ที่รวม catalog, narrative trees, defaults, warnings, asset provenance และ versions |
| `schemas/v1.1.0/content-package.schema.json` | opt-in package 1.1 พร้อม explicit boolean/marker/enum/counter policy ตาม CR-0002 D2 |
| `schemas/v1.1.0/narrative-tree.schema.json` | opt-in tree 1.1 ที่มี Act 1 resting Cutscene completion แทน outgoing target ตาม CR-0002 D1 |
| `schemas/v1.2.0/content-package.schema.json` | opt-in package 1.2 ใช้ sibling tree 1.2; nested catalogs ยังคง 1.0 ตาม CR-0003 D1 |
| `schemas/v1.2.0/narrative-tree.schema.json` | optional environment สำหรับ cutscene/exploration/decision; ห้ามใช้พร้อม legacy exploration background |

ชื่อจริงของไฟล์ให้ยึดตามไฟล์ใน `schemas/` หากต่างจาก catalog นี้ และต้องอัปเดต catalog ใน change เดียวกัน

Canonical `$id` ใช้ namespace `https://t3thr.github.io/JaoKob/specs/schemas/` เพื่อเป็น stable identifier ของ schema การ validate ในเครื่องต้องใช้ local catalog mapping และไม่ควรต้อง fetch schema ผ่าน network

Task 1 มี [Content Validator](../src/data/validation/content-validator.js) และ [Loader](../src/data/content/content-loader.js) พร้อม [ADR-P0-013](../docs/adr/ADR-P0-013-content-validation-contract.md) เป็น execution contract: local `$ref` resolve จาก [runtime catalog](../src/data/validation/content-schema-catalog.js) ซึ่งทดสอบ deep equality กับไฟล์ต้นฉบับทุกฉบับ ไม่ fetch `specs/` ในตัวเกม และไม่ใช้ npm validator

Schema 1.0/1.1 เดิมไม่เปลี่ยนและมี SHA-256 regression locks; เลือกรุ่น 1.0/1.1/1.2 ด้วย explicit `schemaVersion` และห้ามผสม package/tree คนละรุ่น Character/dialogue/event catalogs ยังคง 1.0 ทุก package version ส่วน `testReferenceIds` ต้องตรวจจาก external reviewed ID catalog ที่ส่งให้ Validator ไม่ให้ package รับรอง references ของตนเอง. Runtime Act 1 capability gate รับเฉพาะ 1.1/1.2; การผ่าน schema 1.0 ไม่รับรองว่า executor รองรับทุก legacy capability

คำสั่งตรวจที่มีจริง: `node --test tests/unit/content-loader.test.js` รวม structural/ref/semantic/keyword parity และ fixtures ส่วน full metaschema conformance ด้วย reference validator และ full narrative graph gate ต้องรายงานแยก ไม่อนุมานว่าผ่านจาก schema snapshot equality

## Versioning Contract

- `schemaVersion` เปลี่ยนเมื่อโครงสร้างข้อมูลเปลี่ยนและใช้ Semantic Versioning
- `contentVersion` เปลี่ยนเมื่อ narrative content เปลี่ยนแม้ schema ไม่เปลี่ยน
- การเปลี่ยน major ต้องมี migration path หรือประกาศ incompatibility ที่เจ้าของโครงการอนุมัติ
- Save ต้องถูกตรวจ schema ก่อนใช้ และหลัง migration ก่อนเขียนทับ
- ห้ามใช้ข้อความภาษาไทย, array index หรือ DOM selector เป็น primary key

## Phase 1 Validation Pipeline ที่กำหนดไว้

1. Parse JSON ทุกไฟล์
2. Validate schema ของ schema ด้วย Draft 2020-12 metaschema
3. Validate content และ save fixtures กับ schema
4. ตรวจ reference integrity ระหว่าง character, dialogue, event และ node IDs
5. ตรวจ graph reachability, dangling edge, terminal node และ cycle policy
6. ตรวจ localization key ว่ามี `th` ครบและไม่มีข้อความฝังใน logic field
7. ตรวจ migration fixtures จากทุก supported save version

ไฟล์ตัวอย่างและ validator executable จะสร้างใน Phase 1 หลัง baseline ได้รับอนุมัติ

## Sprint 3 Task 1 consumer handoff

Implemented contract: [CR-0003 D1/D3/D7](../docs/rfc/CR-0003-interactive-light-novel-presentation.md), [ADR-P0-015](../docs/adr/ADR-P0-015-interactive-light-novel-presentation.md), [Task 1 evidence](../docs/changelog/2026-09/2026-09-07-0119-sprint-03-task-01-presentation-contracts.md). Task 1 was approved and merged through PR #9 (`9e4f8b0`). The integrated benchmark now uses schema 1.2/content 2.1.0 in production; the original 2.0.0 package is retained under `src/data/content/compatibility/` for explicit migration proof. Save format remains 1. See the [Tasks 2–5 execution record](../docs/changelog/2026-09/2026-09-07-1248-sprint-03-benchmark-slice.md).

### Validation and media references

`environment` accepts only optional `backgroundAssetId`, `bgmAssetId`, `ambientAssetId`; `{}` and absence mean neutral background/silence. `null`, unknown keys, and simultaneous exploration `backgroundAssetId` + `environment` are schema failures. Legacy exploration background alone remains supported. Background/default portrait/dialogue portrait require an image; BGM/ambience require audio. Missing IDs return `CONTENT_REFERENCE`, wrong declared type returns `CONTENT_SEMANTIC`, structural failures return `CONTENT_SCHEMA`, mixed/unsupported versions return `CONTENT_VERSION`. Failure never yields partial indexes. A later 404/decode error belongs to media fallback, not invalid-content admission.

### Projection and ownership

[`projectContentPresentation`](../src/data/content/content-presentation.js) accepts `{loaded, snapshot, facts, settings, mode}`: validated runtime content from `loadGameContent`, an accepted orchestrator snapshot or null at Title, matching `orchestrator.facts(snapshot)`, validated complete settings, and the existing application overlay mode. It returns deeply frozen JSON `{visual, audio}`; malformed composition input throws a `TypeError` with `code=CONTENT_PRESENTATION`. This is an internal composition contract, not a parser for untrusted saves/content.

| Field | Contract / consumer |
|---|---|
| `visual.mode` | `title`, `reading`, `exploration`, `decision`, `completion`, `settings`, `choice-confirmation`, `replace-confirmation`; readiness follows accepted facts, not a timer |
| `visual.nodeId` | Current stable node ID or null at Title |
| `visual.background` | Image reference or null for neutral stage |
| `visual.character` | `{id, lifeStage, portrait}` or null; protagonist selected by narrative role, its dialogue override only when it speaks |
| `visual.speaker` | `{id, name, role, description, portrait}` or null; localized speaker semantics; non-protagonist portrait belongs in badge, narrator has no portrait |
| Image reference | `{contentVersion, assetId, alt}` with localized Thai fallback; no path, URL, DOM node, AudioBuffer or loading status |
| `visual.imageRequests` | Deduplicated current image demand, at most background + protagonist + speaker badge; these requests are not evidence of decoded readiness |
| `audio` | `{sessionId, bgmAssetId?, ambientAssetId?, volumes:{master,music,ambience,effects}, reducedIntensity}`; missing channel means silence; Title session is null |

`projectContentView` includes `visual` as `view.presentation` and keeps localized scene title/dialogue/context and existing ordered semantic `choices`. Hidden/unavailable action handling, preface readiness, completion and confirmation stay driven by the current facts. D5's prose uses shortened labels; the exact canonical package labels remain **ว่ายตามแม่กบ / อยู่ฟังรากบัว / ว่ายเล่นกับพี่น้อง**. No text is rewritten to match a mockup.

Task 2 resolves IDs against the validated asset index using an injected resolver, constructs safe root/subpath URLs, and owns current/eligible one-hop scheduling. Image readiness belongs to the UI helper; it does not mutate this projection. Task 3 renders `view.presentation`, `view.scene`, `view.choices` and localized settings. Task 4 obtains the same projection from accepted facts, fans `.audio` out separately from RendererPort, and owns trusted activation/SFX accepted-action tokens. Audio settings preserve saved zeros; effective reduced-intensity caps belong to the adapter. Projection does not fetch, decode, evaluate actions, preload a graph, replay effects or write storage. No media readiness is awaited in story commits.

### Bond transition contract

Act 1 ViewModel now emits `meters.bond = {state:"locked", label, accessibleLabel, icons:["lotus","lock"]}` with **no numeric value**, and filters Bond meter-change announcements. Title emits `{state:"hidden"}`. Two new application localization entries provide “Bond: Locked” and “ความผูกพัน: ยังไม่เริ่มต้น”. [`assertRendererViewModel`](../src/core/ports/renderer-port.js) checks additive media and Bond fields; the facade returns typed `RENDER_FAILURE` before invoking its adapter when invalid. Legacy numeric/hidden caller fixtures remain exercised. Explicit unlocked fixtures require `gateId:"NAR-SC-A4-004"`; this contract does not unlock domain Bond or add Act 4 content.

Task 1 prepares the VM/Port. The existing DOM renderer still omits this new status. Task 3 must render the localized lotus/lock chip as a status with no numeric meter semantics; Task 5 must replace production DOM/AX absence assertions with presence + numerical-secrecy assertions. Historical Sprint 2 and legacy hidden fixtures remain valid. Do not claim D7 visual acceptance from the Task 1 contract tests.

### Pure migration and write integration

[`createContentVersionMigration`](../src/data/migrations/content-2-0-0-to-2-1-0.js) accepts `{sourcePackage, targetPackage, testReferenceIds}`. The composition root must supply the reviewed schema 1.1/content 2.0.0 original and validated schema 1.2/content 2.1.0 target; source authority comes from the reviewed archive/hash, never a save-supplied package or matching version string. The factory copies, validates and capability-checks both packages, then compares every authored field except the approved version/assets/environment/portrait paths. Dialogue text/order/voice/emotion, IDs, life stage/appearance, conditions/effects/flag policies, defaults and checkpoint/completion rules are included in the comparison.

Success is `{ok:true,value:{sourceContentVersion,targetContentVersion,migrate,canReplaceExisting}}`; failure is `{ok:false,error:{code:"SAVE_MIGRATION",details:{reason,path?}}}` without raw input in diagnostics. `migrate(envelope)` validates strict JSON/save schema and source/target snapshots and returns `{ok:true,value:{envelope,migrated}}`. Only envelope `contentVersion` changes; payload, revision, timestamps, reason and settings remain exact. Already-target input is a no-op in value, returned as a frozen clone. Source integrity, Mock/future versions, invalid cursor/causal state and unknown fields fail safely. Target integrity metadata is preserved under exact validation; this does not claim digest verification.

`canReplaceExisting(envelope)` is the same conservative admission predicate. Task 4 must supply a production-safe reviewed source artifact (never import tests), register migration at bootstrap, and inject this predicate as adapter `canReplaceExistingEnvelope` through **both stage and commit guards**, retaining revision/raw race checks. Read-only recovery/preparation preserves every raw slot; migration alone authorizes no write/reset. Task 4 owns concurrent corrupt/future/mixed-record and rollback write-guard integration. Revert Task 1 before target saves exist; afterward retain compatible validation/write protection or disable writes, with no guessed downgrade or backup deletion.
