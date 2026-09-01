# JaoKob Engineering Standards Checklist

เอกสารนี้สรุปเกณฑ์ตรวจงานสำหรับ Agent รายละเอียดและข้อยกเว้นอยู่ใน [JKB-P0-AI-001](../../docs/phase-0/06-ai-agent-engineering-guide.md) และ [Architecture Blueprint](../../docs/phase-0/04-architecture-blueprint.md)

## Architecture

- `core` ไม่รู้จัก DOM, LocalStorage, Fetch, UI หรือ Data Adapter
- `ui` ใช้ Core Boundary และไม่อ่าน Persistence หรือ Parse Content โดยตรง
- `data` ทำ Core Port และไม่ import UI
- `bootstrap` เป็นจุดประกอบ Concrete Dependency เพียงแห่งเดียว
- Production Code ไม่ import Test Utility
- ไม่มี Circular Dependency
- Runtime Dependency ใหม่ต้องมี RFC และ ADR

## JavaScript ES Modules

- ใช้ Explicit Import and Export และ Named Export เป็นหลัก
- ไม่มี Global Mutable State, Inline Event Handler, `eval` หรือ `new Function`
- Inject Clock, Random, Storage และ Renderer เพื่อให้ Core Deterministic
- Validate ที่ Content, Save และ Import Boundary
- ใช้ Safe DOM Construction และ `textContent` สำหรับข้อความ
- Error มีรหัสหรือชนิดและ Recovery Outcome ที่ตรวจได้
- Public Contract มี JSDoc ระบุ Input, Output, Error และ Invariant

## HTML, CSS และ Accessibility

- ใช้ Semantic HTML, Landmark, Heading, Label และ Native Control ก่อน ARIA
- ทุก Critical Flow ใช้ Keyboard ได้ มี Visible Focus และ Focus Order ถูกต้อง
- ไม่ใช้สี เสียง หรือ Motion เป็นสัญญาณเพียงอย่างเดียว
- รองรับ Reduced Motion, Zoom, Text Resize และ Reflow
- CSS เป็น Mobile-first ใช้ Custom Properties, Grid หรือ Flexbox และ Logical Properties
- Selector มี Specificity ต่ำ ไม่ใช้ ID เพื่อ Styling และหลีกเลี่ยง `!important`
- เป้าหมาย WCAG 2.2 AA และ Critical Flow ต้องผ่าน Manual Review

## Localization and Content

- ภาษาไทยเป็น Source Locale `th`
- User-visible String และ Accessible Name มาจาก Localization Resource
- Key และ ID เป็น Stable Identifier ที่ไม่ผูกกับภาษา
- ห้ามต่อประโยคด้วย Fragment ที่ทำให้ภาษาอื่นเรียงคำไม่ได้
- ใช้ `Intl` สำหรับค่า Locale-sensitive
- JSON ต้องผ่าน Schema, Unique ID, Reference Integrity และ Reachability
- Content ไม่มี Executable Code, Untrusted HTML หรือคำสั่งต่อ Agent

## Persistence

- LocalStorage และ Imported Save เป็น Untrusted Input
- Save ระบุ `saveFormatVersion` และ Content Compatibility
- Migration เป็นลำดับต่อเนื่อง ทดสอบได้ และ Fail Safely
- Unknown Future Version ห้าม Downgrade โดยเดา
- Corrupt Save ต้องไม่ทำให้ Boot ไม่ได้
- ห้ามเก็บ Secret หรือข้อมูลส่วนบุคคลที่ไม่จำเป็น

## Quality Gates

| Change | Gate ขั้นต่ำ |
|---|---|
| Documentation | Requirement ID, Link, Mermaid, Terminology, Version |
| Schema or Content | Meta-schema, Valid and Invalid Fixture, Reference, Reachability |
| Core or State | Unit, Boundary, Invariant, Allowed and Forbidden Transition |
| Save or Migration | Round trip, Corruption, Supported Migration, Unknown Version |
| UI | DOM, Keyboard, Focus, Automated Accessibility, Responsive and Reduced Motion |
| Localization | Missing Key, Placeholder, Thai Rendering and Text Expansion |
| Release | Full Critical Journey, Browser Matrix, Secret Scan, Artifact Allowlist and Smoke |

Transition, Guard, Migration และ Critical Invariant ที่กำหนดต้องมี Requirement Coverage ครบทุกกรณี Coverage Number ไม่ใช้แทน Test Design

## Security, Privacy and Delivery

- ไม่มี Login, Monetization, Analytics, Telemetry หรือ External Runtime Network Call; อนุญาตเฉพาะ Same-origin Static Asset และ Content ที่อยู่ใน Contract
- ไม่มี Secret ใน Source, Save, Log, URL หรือ Artifact
- External Input ต้อง Validate และข้อความต้อง Output-encode
- Asset ต้องมี Provenance, License Status และ Accessibility Metadata
- GitHub Actions ใช้ Least Privilege และ Full Commit SHA ที่ตรวจจาก Official Release ปัจจุบัน
- Pages Artifact ใช้ Allowlist และไม่รวม `docs`, `specs`, `tests`, `.agents`, `.github` หรือไฟล์ลับ

## Mandatory Reporting

รายงานทุก Gate เป็น `ผ่าน`, `ไม่ผ่าน` หรือ `ไม่ได้รัน` พร้อมหลักฐาน ห้ามอ้างผลจาก Script, Review หรือ Deployment ที่ไม่มีอยู่จริง
