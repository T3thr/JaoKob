# JaoKob UX Mockups v2

สิบภาพต้นแบบอ้างอิง **JKB-DS-UX-ATOMIC-05 1.0.0**, ADR-P0-032 D7–D8 และ ADR-P0-033 D0–D5 สำหรับ PO ตรวจงานภาพ ยังไม่ใช่การรับรอง runtime หรือการอนุมัติ Canon ใหม่

- [หน้าเปรียบเทียบ v1 → v2](../../evidence/ux-mockups-v2-review.html)
- [Manifest และ Provenance](ux-mockups-v2-manifest.json)
- [Self-Audit](evidence/self-audit.json) · [ข้อความจาก SSOT](evidence/thai-copy-audit.json) · [พิกเซล HUD](evidence/hud-pixel-audit.json)
- [Master CSS](harness/ux-components.css) · [Component Harness](harness/render-screen.html?screen=1)

เรนเดอร์ซ้ำจาก repository root ด้วย Google Chrome บน macOS และ Python 3/Pillow ที่มีอยู่แล้ว:

```sh
python3 docs/design-system/ux-mockups/v2/harness/render_mockups.py
python3 docs/design-system/ux-mockups/v2/harness/verify_delivery.py --visual-reviewed
```

ใช้ `--visual-reviewed` หลังเปิดตรวจภาพ PNG ทั้งสิบภาพจริงเท่านั้น สคริปต์ตรวจข้อความกับตารางในสัญญา ไม่ใช้สำเนาข้อความใน Harness เป็น expected result

Chrome CLI บน macOS บังคับความกว้างหน้าต่างขั้นต่ำ 500 px และหักความสูงแถบ browser จึงใช้ native DevTools Emulation จาก Python standard library ใน process `--headless=new` เดียวกัน เพื่อล็อก content viewport ที่ **1440×900 / 390×844, DPR 2** อย่างแม่นยำ ไม่มี dependency ของระบบ browser automation ภายนอก

ภาพ viewport ถูกใส่ลงช่องกรอบเครื่องแบบ 1:1 โดยไม่ย่อ ขยาย หรือบิด UI กรอบและแถบ browser มาจากภาพอ้างอิงสองไฟล์เดิม ขยายเฉพาะขอบจอด้านข้างที่ว่างเพื่อรองรับ viewport ส่วน HUD ใช้ Master ขนาด 358×64 CSS px เดียวกันทุกจอและตรวจพิกเซลภายในรูปทรงแคปซูล ไม่รวมขอบโปร่งใสที่ผสานกับฉาก

ไฟล์ v1 และไฟล์ `.md`/`.mjs` ของ Claude เก็บตามเดิม สำเนาภาพ Canonical ใน Harness มี SHA-256 ตรงกับต้นฉบับทั้งหมด ไม่มีการเจนภาพใหม่หรือแก้ source ภาพ ตัวละคร บท Schema และ Save ในรอบนี้
