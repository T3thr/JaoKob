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

ชื่อจริงของไฟล์ให้ยึดตามไฟล์ใน `schemas/` หากต่างจาก catalog นี้ และต้องอัปเดต catalog ใน change เดียวกัน

Canonical `$id` ใช้ namespace `https://t3thr.github.io/JaoKob/specs/schemas/` เพื่อเป็น stable identifier ของ schema การ validate ในเครื่องต้องใช้ local catalog mapping และไม่ควรต้อง fetch schema ผ่าน network

Task 1 มี [Content Validator](../src/data/validation/content-validator.js) และ [Loader](../src/data/content/content-loader.js) พร้อม [ADR-P0-013](../docs/adr/ADR-P0-013-content-validation-contract.md) เป็น execution contract: local `$ref` resolve จาก [runtime catalog](../src/data/validation/content-schema-catalog.js) ซึ่งทดสอบ deep equality กับไฟล์ต้นฉบับทุกฉบับ ไม่ fetch `specs/` ในตัวเกม และไม่ใช้ npm validator

Schema 1.0 เดิมไม่เปลี่ยน; เลือกรุ่นด้วย `schemaVersion` และห้ามผสม package/tree คนละรุ่น Character/dialogue/event catalogs ยังคง 1.0 ทั้งสอง package versions ส่วน `testReferenceIds` ต้องตรวจจาก external reviewed ID catalog ที่ส่งให้ Validator ไม่ให้ package รับรอง references ของตนเอง

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
