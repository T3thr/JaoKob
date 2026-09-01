# Change Record: Develop Branch Setup and Multi-AI Guidelines

- **รหัสบันทึก (Record ID):** `CR-20260901-1411`
- **วันและเวลา (Timestamp):** 2026-09-01T14:11:00+07:00
- **รอบการพัฒนา (Sprint/Milestone):** Sprint 1 Preparation & Multi-AI Governance
- **ผู้ปฏิบัติงาน (Operator/Persona):** Senior Software Architect & Quality Specialist (AI Agent)
- **สถานะ (Status):** Completed

---

## 1. วัตถุประสงค์และคำสั่ง (Prompt Objective & Request)
1. แยก Branch `develop` ออกจาก `main` เพื่อทำหน้าที่เป็น Integration Staging Branch และเปิดใช้งาน Trunk-based Feature Branching
2. วางระบบให้ AI ทุกตัว (Antigravity, Claude Code, Cursor, GitHub Copilot) รับรู้สภาพแวดล้อม กฎสถาปัตยกรรม ISO และแนวทางการทำงานของ Repository ได้อย่างชาญฉลาดและมีมาตรฐานเดียวกัน

## 2. ข้อกำหนดที่ได้รับผลกระทบ (Traceability & Requirement IDs)
- **Git Governance:** `JKB-P0-GIT-001` (Git Governance and Deployment Runbook)
- **Sprint SSOT:** `docs/sprints/sprint-01-ssot.md` Section 7

## 3. รายการไฟล์ที่เปลี่ยนแปลง (Manifest of Changes)
### 3.1 Branching & Git
- สร้าง Branch `develop` และ Push ขึ้น `origin/develop` เรียบร้อย
- ปรับปรุงกติกาใน `AGENTS.md` ห้าม AI commit/push ตรงเข้า `main` และบังคับแตก Feature Branch จาก `develop`

### 3.2 ไฟล์ที่สร้างใหม่ (Created)
- `CLAUDE.md`: คู่มือบริบทและกฎเกณฑ์สำหรับ Claude Code CLI
- `.cursorrules`: กฎเกณฑ์สำหรับ Cursor IDE
- `.github/copilot-instructions.md`: ข้อกำหนดสำหรับ GitHub Copilot
- `docs/changelog/2026-09/2026-09-01-1411-develop-branch-and-multi-ai-guidelines.md`: บันทึกประวัตินี้

### 3.3 ไฟล์ที่แก้ไข (Modified)
- `AGENTS.md`: เพิ่ม Section 5: Git Governance & Branching Workflow และปรับปรุงลำดับข้อ
- `CHANGELOG.md`: บันทึก Audit Record `CR-20260901-1411`
- `docs/sprints/sprint-01-ssot.md`: ลงทะเบียน `CR-20260901-1411` ใน Section 7

## 4. ผลการทดสอบและการตรวจรับ (Verification & Quality Evidence)
- `git branch -a`: ยืนยันมีทั้ง `main` และ `develop` ตรงกันกับ Remote Origin
- AI ทุกตัวที่เปิดโปรเจกต์นี้จะตรวจพบไฟล์ Context ของตนเอง (`AGENTS.md`, `CLAUDE.md`, `.cursorrules`, `.github/copilot-instructions.md`)
