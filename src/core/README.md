# src/core/ · ตรรกะเกมบริสุทธิ์ (Core)

**ระดับ:** โค้ด runtime · กติกาเกมทั้งหมดอยู่ที่นี่ที่เดียว ([ADR-P0-034 D2 D4 D5](../../docs/adr/ADR-P0-034-five-act-journey-runtime-save2-journey-profile-and-blueprint-compiled-content.md))

**ออกแบบตาม:** Clean Architecture · Functional Core, Imperative Shell (Gary Bernhardt, 2012) · ISO/IEC/IEEE 12207:2017 §6.4.7 Implementation

## Journey runtime (Sprint 5)

| ที่ | หน้าที่ |
|---|---|
| [domain/journey/](domain/journey/) | กติกาค่าสถานะ Soft Floor ฝืนเอา Grace Rest Floor โหยหาบ้าน สายใยและระดับคำเรียก (`journey-rules.js`) · JourneyState และตัวตรวจ (`journey-state.js`) · เงื่อนไขและ effect ของคำศัพท์ปิด (`conditions.js` · `effects.js`) · ฉากจบสามแบบและ Safety Fallback (`endings.js`) · error code (`journey-errors.js`) · การคัดลอกและ freeze (`plain-data.js`) |
| [domain/clash/](domain/clash/) | ความหมายของเจตนาและการกระทำ (`clash-rules.js`) · kernel บริสุทธิ์สำหรับเครื่องมือพิสูจน์ (`clash-kernel.js`) · shell ที่ตรวจและ freeze สำหรับ runtime (`clash-engine.js`) · view model ของถาดสี่กลุ่ม (`clash-tray.js`) |
| [domain/encounters/](domain/encounters/) | ด่านสี่กุญแจ (`obstacle.js`) · แคมป์ (`camp.js`) · สัมผัสโต้ตอบ (`micro.js`) · การรับของใหม่และกระดุมที่ล็อก (`pouch-offer.js`) |
| [use-cases/journey-session.js](use-cases/journey-session.js) | คำสั่งทั้งหมดของผู้เล่นเป็น transaction เดียวต่อครั้งที่ผูก revision · cursor เชิงความหมาย · snapshot ต้นองก์และการเล่นซ้ำ · view model ทุกโหมด |
| [state-machine/play-mode.js](state-machine/play-mode.js) | โหมดเล่นตาม UX §1.7 · คำสั่งที่แต่ละโหมดรับ · modal ซ้อนทับ · ไม่มี Game Over |
| [domain/keepsake-pouch.js](domain/keepsake-pouch.js) | กระเป๋าสี่ช่องของ ADR-P0-020 (ใช้ต่อใน Journey) |
| [ports/audio-port.js](ports/audio-port.js) · [use-cases/session-history.js](use-cases/session-history.js) | port ของเสียง (ADR-P0-015) และบันทึก 50 บท + 50 การกระทำ · คงไว้พร้อมเทสต์ ยังไม่มีผู้ใช้จนเสียงของ T7 และแผงประวัติของ UX §1.7 |

runtime เดิมของ Sprint 2–4 (มาตรวัด 0–100 · state machine ที่มี Game Over · choice transaction · orchestration · RendererPort · StoragePort) ถูกลบใน C5e ตาม[ทะเบียน assertion ที่ถูกแทนที่](../../docs/traceability/sprint-05-superseded-assertions.md)

## กติกาเหล็ก

1. ห้าม import จาก `ui/` `data/` `bootstrap/` `tools/` และ `tests/` · ห้ามเรียก Browser API · ห้าม `Math.random(` `Date.now(` `new Date(` `performance.now(` (เวลาและ session id เข้ามาทางคำสั่ง) · ตรวจโดย `tests/unit/architecture.test.js`
2. kernel ไม่ตรวจและไม่ freeze เพื่อให้เครื่องมือพิสูจน์เร็ว · shell และ session ตรวจทุก input ปฏิเสธด้วย error code ที่คงที่ ไม่แก้ input และคืนค่าที่ freeze แล้ว
3. ตัวเลขทุกตัวตรึงไว้สำหรับ T2 ตามมติ PO (SSOT §1.2 Q2) · แก้ตัวเลขต้องผ่าน PO แล้วรัน [parity gate](../../tools/clash/clash-parity.mjs) และเครื่องมือใน [evidence/](../../docs/design-system/evidence/README.md) ใหม่
4. ถ้อยคำทุกคำมาจากแพ็กเกจ (ข้อความที่คอมไพล์จากพิมพ์เขียว) · Core คืน text id ไม่สร้างข้อความเอง
5. coverage ของ Core ใหม่ต้อง ≥ 90% บรรทัดและ ≥ 85% branch (`node --test --experimental-test-coverage`)
