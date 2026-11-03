# docs/design-system/mechanics/ · สเปกกลไกของแพ็กเกจเรื่อง (Tier 2)

สเปกกลไกคือแหล่งเขียน "กติกา" ของแต่ละโหนดในคำศัพท์ปิดของ [schema 3.0.0](../../../specs/schemas/v3.0.0/journey-common.schema.json) ส่วน "ถ้อยคำ" อยู่ในพิมพ์เขียวรายองก์ compiler รวมสองแหล่งเป็นแพ็กเกจของเกม ([ADR-P0-034 D4 D6](../../adr/ADR-P0-034-five-act-journey-runtime-save2-journey-profile-and-blueprint-compiled-content.md))

| ไฟล์ | เนื้อหา | ผู้ดูแล |
|---|---|---|
| [story.json](story.json) | ตัวตนแพ็กเกจ · จุดเริ่ม · รายการองก์ที่คอมไพล์ · ป้ายผู้พูดในบทกับรหัสตัวละคร · ทะเบียนของหกชิ้น · ภาพสำรองชั่วคราว (`assetAliases`) · ยกศึกทั้งหก (ต้องเท่ากับ engine ที่พิสูจน์แล้ว) · ชื่อไทยมาตรฐานของเจตนาและการกระทำ | Core Architect · ตัวเลขและภาพสำรองผ่าน PO |
| [act1.json](act1.json) | กลไกรายโหนดของ Act 1 ตามแบบจำลองสมดุล (`ACT1` ใน [five-act-balance-model.mjs](../evidence/five-act-balance-model.mjs)) | Core Architect · Narrative ตรวจ |
| [compile-report.json](compile-report.json) | ผลที่ compiler สร้าง: ภาพที่ยังไม่มีใน manifest v2 · ภาพสำรองที่ใช้และโหนดที่ใช้ · บรรทัดที่บทยังขาด **ห้ามแก้มือ** | สร้างอัตโนมัติ |

**วิธีคอมไพล์และตรวจ**

```bash
node tools/content/compile-journey.mjs
node tools/content/compile-journey.mjs --check
```

**กติกาเหล็ก**

1. ข้อความบนจอทุกคำมาจากพิมพ์เขียว สเปกนี้ห้ามมีบทหรือคำบรรยาย ยกเว้นคำใบ้ของสัมผัสโต้ตอบที่ compiler ตรวจว่าคัดมาจากย่อหน้า `**MA-n:**` ของบท
2. ทุกตัวเลือกในพิมพ์เขียวต้องมีรายการในสเปกตามแท็กของบรรทัดตอบสนอง และทุกรายการในสเปกต้องมีตัวเลือกในพิมพ์เขียว ไม่งั้น compile ไม่ผ่าน
3. ลำดับโหนดในสเปกต้องตรงพิมพ์เขียว และตรงลำดับของแบบจำลองสมดุล (`tests/unit/journey-content.test.js`)
4. ยกศึกต้องผ่าน `assertRound` ของ [Core](../../../src/core/README.md) และพฤติกรรมของทุกยกถูกตรึงด้วย [parity gate](../../../tools/clash/clash-parity.mjs) · ชื่อมาตรฐานในพจนานุกรม (`lexicon`) เป็นถ้อยคำที่ตรวจใน T6 · [tactical-clash-engine.mjs](../evidence/tactical-clash-engine.mjs) อ่านยกและชื่อจากที่นี่และจากแพ็กเกจ (ตั้งแต่ C2)
5. แก้สเปกหรือพิมพ์เขียวแล้วต้องคอมไพล์ใหม่ และรันเครื่องมือพิสูจน์ใน [evidence/](../evidence/README.md) ที่เกี่ยวข้อง
6. `assetAliases` (มติ PO 2026-11-04) ให้ภาพที่พิมพ์เขียวอ้างแต่ manifest v2 ยังไม่มี ชี้ไปยังภาพที่มีอยู่แล้วจนกว่า Astra ส่งภาพจริงใน Slice 2 · แพ็กเกจเก็บภาพที่ใช้จริง ส่วนรายงานเก็บรหัสตามแบบ · compiler ล้มเมื่อภาพจริงเข้า manifest แล้วแต่ alias ยังอยู่ เมื่อเป้าหมายไม่มีใน manifest และเมื่อ alias ไม่มีโหนดใช้
