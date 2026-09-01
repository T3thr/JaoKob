/**
 * Thai source-locale strings owned by the DOM adapter.
 *
 * Narrative, choice, scene, and feedback text must arrive from the View Model
 * after application-level localization. This resource is deliberately limited
 * to renderer chrome and safe recovery fallbacks, which must remain available
 * even when content or a locale resource cannot be loaded.
 *
 * Trace: FR-LOC-001, FR-UI-007, FR-ACC-002, ADR-P0-008.
 */

export const TH_SYSTEM_MESSAGES = Object.freeze({
  "app.name": "เจ้ากบ",
  "hud.label": "สถานะการเดินทาง",
  "scene.label": "ฉาก",
  "speaker.label": "ผู้เล่าเรื่อง",
  "story.label": "เนื้อเรื่อง",
  "choices.label": "เลือกการกระทำ",
  "choice.unavailable": "ตัวเลือกนี้ยังไม่พร้อมใช้งาน",
  "meter.hp": "พลังชีวิต",
  "meter.sanity": "พลังใจ",
  "meter.bond": "ความผูกพัน",
  "meter.value": "{{label}} {{value}} จาก {{max}}",
  "meter.change.positive": "{{label}} เพิ่มขึ้น {{amount}}",
  "meter.change.negative": "{{label}} ลดลง {{amount}}",
  "meter.change.neutral": "{{label}} ไม่เปลี่ยนแปลง",
  "feedback.label": "ผลลัพธ์ล่าสุด",
  "firstRun.label": "ก่อนเริ่มการผจญภัย",
  "status.generic": "สถานะได้รับการอัปเดตแล้ว",
  "cutscene.label": "การควบคุมฉาก",
  "cutscene.log": "บันทึกข้อความ",
  "cutscene.pause": "หยุดฉากชั่วคราว",
  "cutscene.resume": "เล่นฉากต่อ",
  "cutscene.speed": "ความเร็วข้อความ",
  "cutscene.speed.slow": "ช้า",
  "cutscene.speed.normal": "ปกติ",
  "cutscene.speed.fast": "เร็ว",
  "cutscene.typewriter": "แสดงข้อความทีละตัวอักษร",
  "cutscene.skip": "ข้ามฉากที่ดูแล้ว",
  "gameOver.label": "พื้นที่ช่วยเหลือเมื่อเผชิญวิกฤต",
  "gameOver.title": "ตอนนี้เจ้ากบต้องการเวลาพัก",
  "gameOver.description": "คุณสามารถลองใหม่ ปรับตัวช่วยเรื่องราว หรือกลับไปตั้งค่าได้อย่างปลอดภัย",
  "gameOver.retry": "ลองใหม่จากจุดพักล่าสุด",
  "gameOver.storyAssist": "เปิดตัวช่วยเรื่องราว",
  "gameOver.settings": "เปิดการตั้งค่า",
  "gameOver.titleAction": "กลับสู่หน้าเริ่มต้น",
  "fatal.label": "การกู้คืนระบบ",
  "fatal.title": "ไม่สามารถแสดงเกมได้ในขณะนี้",
  "fatal.generic": "ระบบพบปัญหาที่ต้องหยุดการเล่นชั่วคราว ข้อมูลการเล่นปัจจุบันจะไม่ถูกแก้ไขโดยหน้าจอนี้",
  "fatal.content": "เนื้อหาเกมไม่พร้อมใช้งานอย่างปลอดภัย โปรดลองโหลดหน้าใหม่หลังตรวจสอบไฟล์เกมแล้ว",
  "fatal.storage": "ระบบบันทึกข้อมูลไม่พร้อมใช้งาน คุณยังสามารถลองแสดงหน้าจออีกครั้งได้โดยไม่ลบข้อมูลใด ๆ",
  "fatal.environment": "เบราว์เซอร์นี้ยังไม่รองรับความสามารถที่เกมต้องใช้ โปรดลองเปิดด้วยเบราว์เซอร์รุ่นปัจจุบัน",
  "fatal.retry": "ลองแสดงหน้าจออีกครั้ง",
  "fatal.reload": "โหลดหน้าใหม่",
});
