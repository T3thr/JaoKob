# Proposals and Technical Research Directory (`docs/proposals/`)

พื้นที่สำหรับเก็บเอกสารข้อเสนอทางเทคนิค (Technical Proposals), การวิจัยสถาปัตยกรรม (Architecture Research), และการระดมสมอง (Brainstorming Specifications) ก่อนที่จะถูกแปลงเป็น Request for Comments (RFC), Architecture Decision Records (ADR), หรือ Sprint SSOT ที่ได้รับอนุมัติ

## รายการเอกสารข้อเสนอในปัจจุบัน

| รหัสเอกสาร | ชื่อข้อเสนอ | ผู้จัดทำ | สถานะ | ลิงก์เอกสาร |
|---|---|---|---|---|
| **JKB-PROP-P2-001** | Phase 2 Architecture & Design Proposal: Interactive Light Novel RPG Transformation & Customization Asset Pipeline | Tech Lead (Gemini 3.8 Flash) | Archived proposal; [CR-0003 APPROVED](../rfc/CR-0003-interactive-light-novel-presentation.md), 2026-09-07 | [01-visual-novel-transformation-tech-lead-proposal.md](phase-02-visual-novel-architecture/01-visual-novel-transformation-tech-lead-proposal.md) |

## โครงสร้างและการใช้งาน
- แต่ละหัวข้อใหญ่ให้สร้างเป็นโฟลเดอร์เฉพาะ เช่น `phase-02-visual-novel-architecture/`
- ให้เก็บเอกสารการวิเคราะห์ (`.md`) คู่กับภาพร่างต้นแบบ (Reference / Target Visuals) โดยตั้งชื่อไฟล์เป็นแบบ kebab-case เสมอ
- ห้ามนำโค้ดในข้อเสนอไปเริ่มพัฒนาใน Production (`src/`) จนกว่าจะผ่าน Definition of Ready และบันทึกเป็น Sprint SSOT อย่างเป็นทางการ
