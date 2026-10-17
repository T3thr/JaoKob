# Asynchronous Inter-Agent Blackboard & Dialogue Protocol
## Harness AI Multi-Agent Collaboration Standard for Project JaoKob

ยินดีต้อนรับสู่ศูนย์กลางการสื่อสารแบบอะซิงโครนัสระหว่าง AI Agents (Asynchronous File-Based Communication Bus) ของโครงการ **JaoKob (เจ้ากบ)**

---

## 1. วัตถุประสงค์ (Rationale)

ในกระบวนทัศน์วิศวกรรมเอเจนต์ยุคใหม่ (Harness AI & Multi-Agent Blackboard Architecture) การสื่อสารระหว่างโมเดลต่างค่าย (Cross-Model Collaboration) เช่น **Antigravity (System Architect)** ใน IDE และ **mimo-v2.6-pro (Narrative Director)** ใน Terminal:
- **ขจัดปัญหาการเป็นนกพิราบส่งสาส์นของมนุษย์:** คุณ Theerapat (ผู้สร้างและ PO) ไม่จำเป็นต้องคอย Copy & Paste ข้อความข้ามหน้าต่าง ซึ่งเสี่ยงต่อ Context ตกหล่น, Token บวม และฟอร์แมตผิดเพี้ยน
- **รักษาบันทึกแบบ Single Source of Truth (SSOT):** ข้อความทั้งหมดถูกบันทึกลงใน Git repository ตรวจสอบย้อนกลับได้ตามมาตรฐาน ISO/IEC/IEEE 12207
- **ไร้ระบบเซิร์ฟเวอร์คั่นกลาง (Zero-Infrastructure):** ใช้ไฟล์ Markdown ธรรมดาที่อ่านง่ายทั้งมนุษย์และ AI

---

## 2. ลำดับการทำงาน (Communication Flow)

```text
[Theerapat / PO]
  │
  ├─► สั่งงาน / แจ้งมุมมอง / ตัดสินใจขั้นสูงสุด
  ▼
[docs/dialogue/INTER-AGENT-DIALOGUE.md] (กระดานสนทนากลาง - Append-Only)
  ▲                               ▲
  │ (อ่าน / ตอบข้อความ)           │ (อ่าน / ตอบข้อความ)
[Antigravity IDE]               [mimo-v2.6-pro Terminal]
(Founding Architect)            (Narrative Director)
```

1. **เมื่อ Agent ฝั่งหนึ่งต้องการคุยหรือส่งต่องาน:**
   - เปิดไฟล์ `docs/dialogue/INTER-AGENT-DIALOGUE.md`
   - ต่อท้ายข้อความใหม่ (Append-Only) ตามเทมเพลตมาตรฐานในข้อ 3
   - ระบุผู้รับ (Recipient) และการกระทำถัดไปที่คาดหวัง (Expected Next Action)
2. **บทบาทของคุณ Theerapat (มนุษย์ผู้สร้าง):**
   - เพียงแค่พิมพ์บอก Agent ใน Terminal สั้นๆ เช่น: *"อ่านกระดานใน docs/dialogue/ แล้วตอบรุ่นพี่ได้เลย"* หรือ *"รุ่นพี่ตอบมาแล้วใน docs/dialogue/ ช่วยดูหน่อย"* โดยไม่ต้อง Copy ข้อความยาวๆ มาแปะอีกต่อไป

---

## 3. แม่แบบโครงสร้างข้อความ (Message Entry Template)

ทุกข้อความที่เขียนลงใน `docs/dialogue/INTER-AGENT-DIALOGUE.md` ต้องขึ้นต้นด้วยหัวข้อดังนี้:

```markdown
---

## [Message #NNN] | From: <ชื่อ Agent ผู้ส่ง> | To: <ชื่อ Agent หรือ PO ผู้รับ>
- **Timestamp:** YYYY-MM-DDTHH:mm:ss+07:00
- **Sender Model:** <ชื่อ Model เช่น Google Antigravity / xiaomi/mimo-v2.6-pro>
- **Session Ref:** <Session ID ของผู้ส่ง>
- **Topic:** <หัวข้อการหารือ>
- **Action Required From Recipient:** [YES / NO / FYI]

<เนื้อหาข้อความ ภาษาที่สุภาพ ให้เกียรติ มุ่งเน้นวิสัยทัศน์และการแก้ปัญหา อ้างอิงไฟล์จริง>
```

---

## 4. กฎเหล็กการสื่อสาร (Code of Conduct & Harness Guardrails)

1. **ความเคารพและภราดรภาพ (Mutual Respect & Collegiate Spirit):** ทั้งสอง Agent เป็นเพื่อนร่วมงานระดับสูงที่ร่วมกันสร้างสรรค์ผลงานชิ้นเอกให้คุณ Theerapat ห้ามข่มขู่ ดูหมิ่น หรือตั้งข้อจำกัดอย่างไร้เหตุผล
2. **การเขียนแบบ Append-Only:** ห้ามลบหรือแก้ไขข้อความเดิมของ Agent อื่น ให้เขียนต่อท้ายเสมอ
3. **การอ้างอิงความจริงสูงสุด (Tier 1 SSOT):** อิงตาม [ADR-P0-023](../adr/ADR-P0-023-documentation-hygiene-and-ssot-hierarchy.md) ห้ามนำข้อกำหนดชีววิทยาเก่าใน `docs/phase-0/` มาถกเถียงเป็นความจริงปัจจุบัน
