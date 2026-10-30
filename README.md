# JaoKob (เจ้ากบ)

เกม Visual Novel ผจญภัยภาษาไทยแบบ client-side ความยาวราว 45 นาที เล่าเรื่องเจ้ากบตัวสูง 45 เซนติเมตรในเสื้อยืดสีฟ้าตัวเดียว ที่ฝ่าพายุข้ามเมืองไฟดับไปเฝ้าข้างหมอนของเจ้าของเสื้อ

| ข้อมูล | ค่า |
|---|---|
| **สถานะ** | Sprint 5 Implementation เริ่ม 2026-11-01 · แผนอยู่ที่ [Sprint 5 SSOT](docs/sprints/sprint-05-ssot.md) |
| **เอกสารทั้งหมด** | [docs/README.md](docs/README.md) (แผนที่ ลำดับชั้นเอกสาร และขั้นตอนทำงาน) |
| **กติกาของ Agent** | [AGENTS.md](AGENTS.md) |
| **สิ่งที่เปลี่ยนล่าสุด** | [CHANGELOG.md](CHANGELOG.md) |

## โครงสร้าง

| โฟลเดอร์ | หน้าที่ | คู่มือ |
|---|---|---|
| `index.html` · [src/](src/) | ตัวเกม: core (ตรรกะบริสุทธิ์) · data (content และ save) · ui (DOM) · bootstrap | [src/README.md](src/README.md) |
| [assets/](assets/) | ภาพ เสียง ฟอนต์ และ provenance | [assets/README.md](assets/README.md) |
| [specs/](specs/) | JSON Schema และ allowlist ของ release | [specs/README.md](specs/README.md) |
| [tests/](tests/) | unit · schema · design · docs · release · e2e | [tests/README.md](tests/README.md) |
| [docs/](docs/) | ADR · Sprint SSOT · สัญญาออกแบบ · บันทึกการเปลี่ยนแปลง · กระดาน Agent · คลังประวัติ | [docs/README.md](docs/README.md) |

## เริ่มใช้งาน

```bash
# เปิดเกมด้วยเว็บเซิร์ฟเวอร์แบบ static ใดก็ได้จากรากของ repository แล้วเปิด index.html
python3 -m http.server 8000

# ตรวจทั้งหมดที่ต้องผ่านก่อนส่งงาน
node --test 'tests/unit/**/*.test.js'
node tests/docs/check-doc-links.mjs
```

## หลักการสำคัญ

- ภาษาไทยเป็นภาษาหลัก ข้อความทุกบรรทัดพร้อมสำหรับ localization
- Pure HTML5, Semantic CSS3 และ Vanilla JavaScript ES Modules ไม่มี framework ไม่มี build step
- ไม่มีบัญชีผู้ใช้ ไม่มี backend ไม่มี telemetry บันทึกเกมเฉพาะในเครื่องด้วย LocalStorage พร้อม versioning และ migration
- `src/core/` เป็นตรรกะบริสุทธิ์ ห้ามเรียก DOM หรือ Browser API
- การเปลี่ยนแปลงทุกครั้งต้องอ้าง Requirement ID มี Change Record และผ่านการตรวจทั้งหมด

## ข้อจำกัดด้านทรัพย์สินทางปัญญา

ภาพอ้างอิงและการกล่าวถึงทรัพย์สินของบุคคลที่สามเป็นเพียงข้อมูลนำเข้าสำหรับการออกแบบ ไม่ถือเป็นหลักฐานการอนุญาตให้นำชื่อ รูปลักษณ์ ภาพถ่าย หรือ asset ไปเผยแพร่ การเผยแพร่ต้องผ่าน IP clearance gate ตามเอกสาร [Phase 0 Charter](docs/archive/phase-0/00-phase-0-charter.md) และต้องมี provenance ใน [assets/provenance/](assets/provenance/)
