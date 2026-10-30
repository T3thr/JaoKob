# docs/design-system/evidence/ · เครื่องมือพิสูจน์และหลักฐานการออกแบบ

ทุกตัวเลขในสัญญาออกแบบมาจากสคริปต์ในโฟลเดอร์นี้ รันจากรากของ repository ด้วย Node.js 22 ไม่มี dependency ภายนอก

**ออกแบบตาม:** Executable Specification (สเปกที่รันตรวจได้) และ ISO/IEC/IEEE 12207:2017 §6.4.9 Verification ที่ผลต้องรันซ้ำได้ทุกเครื่อง

| เครื่องมือ | พิสูจน์ | เวลา |
|---|---|---|
| [tactical-clash-engine.mjs](tactical-clash-engine.mjs) | กติกาศึกแสงปะทะเงาแบบ deterministic (ต้นแบบของ `src/core` ใน Sprint 5) | - |
| [tactical-clash-simulator.mjs](tactical-clash-simulator.mjs) | แจกแจงทุกลำดับการกดของทุกยก: ไม่มี Game Over · ชนะขาดได้ทุกจุดเข้าศึก · ผู้อ่านเจตนาดีกว่ากดรุกอย่างเดียว | ไม่ถึง 1 วินาที |
| [five-act-balance-model.mjs](five-act-balance-model.mjs) | แจกแจงทุกทางเลือกทั้งห้าองก์: ไม่มีทางตัน · ฉากจบทั้งสามเปิดได้ · การเล่นจำลอง 14 แบบ | ราว 95 วินาที |
| [five-act-runtime-ledger.mjs](five-act-runtime-ledger.mjs) | เวลาเล่นทุกเส้นทาง 8–10 นาทีต่อองก์ จากบทจริง | ไม่ถึง 1 วินาที |
| [physics-scale-optics-check.mjs](physics-scale-optics-check.mjs) | ฟิสิกส์ 52 ข้อที่บทและภาพอ้าง | ไม่ถึง 1 วินาที |
| [ux-v3-screen-states-check.mjs](ux-v3-screen-states-check.mjs) | จอศึกของภาพต้นแบบเป็นสถานะที่เกิดได้จริง | ไม่ถึง 1 วินาที |
| [verify-visual-assets-v1.py](verify-visual-assets-v1.py) · [verify-visual-assets-v2.py](verify-visual-assets-v2.py) | ไฟล์ภาพ v1 และ v2 ตรงกับ manifest (Python 3 และ Pillow) | - |
| [build-visual-assets-v2-review.py](build-visual-assets-v2-review.py) | สร้างหน้าตรวจรับภาพ v2 | - |
| [act1-4-balance-model.mjs](act1-4-balance-model.mjs) · [act1-4-runtime-ledger.mjs](act1-4-runtime-ledger.mjs) | **SUPERSEDED** หลักฐานของ ADR-P0-031 รันแล้วแจ้งแค่ว่าถูกแทนที่ | - |

หน้าตรวจรับและผลตรวจของ Astra: [visual-assets-v1-review.html](visual-assets-v1-review.html) · [visual-assets-v2-review.html](visual-assets-v2-review.html) · [ux-mockups-v2-review.html](ux-mockups-v2-review.html) พร้อมไฟล์ `*-verification.json` `*-doc-checks.json` `*-browser-review.json` และ `*-unit-summary.txt`

```bash
for f in tactical-clash-simulator five-act-balance-model five-act-runtime-ledger physics-scale-optics-check ux-v3-screen-states-check; do node docs/design-system/evidence/$f.mjs; done
```

**กติกาเหล็ก:** สคริปต์ต้องจบด้วย exit code 0 เมื่อผ่าน และ 1 เมื่อไม่ผ่าน · ห้ามเปลี่ยนกติกาใน engine โดยไม่แก้สัญญาออกแบบและรันทุกเครื่องมือซ้ำ
