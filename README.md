# JaoKob

สถานะโครงการ: Phase 0 Specification Baseline

JaoKob เป็นเกมเล่าเรื่องเชิงสัญลักษณ์ภาษาไทยสำหรับเว็บแบบ client-side ซึ่งถ่ายทอดการพลัดพราก การเอาชีวิตรอด ความหวัง และการค้นพบบ้านที่ให้ความอบอุ่น โครงการอยู่ในระยะกำหนดข้อกำหนดและสถาปัตยกรรม ยังไม่มี Source Code ของตัวเกมใน baseline นี้

เอกสารเริ่มต้นอยู่ที่ [Phase 0 Documentation Index](docs/phase-0/README.md)

## ขอบเขต Baseline

- Game Design Document และ Narrative Bible
- Software Requirements Specification และ Architecture Blueprint
- JSON Schema สำหรับข้อมูลเนื้อเรื่องและสถานะเกม
- Production Directory Structure Plan
- AI Agent Engineering Guide และ repo-local skill
- Git Governance และ GitHub Pages Deployment Runbook
- Verification, Traceability และ Quality Gate Plan

## หลักการสำคัญ

- ภาษาไทยเป็นภาษาหลัก โดยข้อมูลข้อความต้องพร้อมสำหรับ localization
- ใช้ Pure HTML5, Semantic CSS3 และ Modern Vanilla JavaScript ES Modules ใน Phase 1
- ไม่มีบัญชีผู้ใช้ ไม่มีการสร้างรายได้ ไม่มี backend และไม่มี telemetry โดยปริยาย
- บันทึกข้อมูลเฉพาะในอุปกรณ์ด้วย LocalStorage พร้อม versioning และ migration
- เนื้อหา ตรรกะเกม การแสดงผล และ persistence ต้องแยกจากกัน
- การเปลี่ยนแปลงทุกครั้งต้องอ้าง Requirement ID และผ่าน quality gates ที่ระบุไว้

## ข้อจำกัดด้านทรัพย์สินทางปัญญา

ภาพอ้างอิงและการกล่าวถึงทรัพย์สินของบุคคลที่สามเป็นเพียงข้อมูลนำเข้าสำหรับการออกแบบ ไม่ถือเป็นหลักฐานการอนุญาตให้นำชื่อ รูปลักษณ์ ภาพถ่าย หรือ asset ไปเผยแพร่ การเผยแพร่ต้องผ่าน IP clearance gate ตามเอกสาร Phase 0
