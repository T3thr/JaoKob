/**
 * Thai interface words of the Journey screens: chrome, tags, accessible names and notices.
 * Story words (lines, card labels, titles, names) come from the compiled package only; the
 * fixed tag words follow UX §1.4 and the companion forms on combo tags follow UX §8.3.
 * Unavailable reasons and notices are interface copy for the prototype; their wording is
 * reviewed with the Thai editorial pass of T6. Trace: FR-LOC-001/002, UX §1.4 · §1.6 · §2.1,
 * ADR-P0-034 D9/D10, TC-S5-SILENT-001.
 */

const NUMBER_WORDS = Object.freeze(["ศูนย์", "หนึ่ง", "สอง", "สาม", "สี่", "ห้า", "หก", "เจ็ด", "แปด", "เก้า", "สิบ"]);

/** A small count as a Thai word (screen readers read the HUD in words, UX §1.6). */
export const thaiCount = (value) => (Number.isInteger(value) && value >= 0 && value < NUMBER_WORDS.length ? NUMBER_WORDS[value] : String(value));

export const TH_JOURNEY = Object.freeze({
  meters: Object.freeze({ hp: "กาย", mind: "ใจ", sta: "แรง" }),
  /** Companion forms used on the combo tag (UX §8.3) and in bond announcements. */
  companions: Object.freeze({ pkam: "พี่ก้าม", fiw: "เจ้าฟิ้ว", teuk: "เตื๊อก" }),
  tags: Object.freeze({
    skill: "ทักษะครอบครัว",
    sibling: "ทักษะครอบครัว",
    alone: "ยืนหยัดเอง",
    rush: "บุกทวน",
    wait: "รอจังหวะ",
    grit: "ฝืนเอา",
    combo: "ท่าผสาน",
    repeat: "ซ้ำ",
    counter: "แก้ทาง",
    chosen: "เลือกแล้ว",
    finisher: "ท่าปิดศึก",
    ready: "พร้อมผสาน",
  }),
  reasons: Object.freeze({
    "item-missing": "ยังไม่มีของชิ้นนี้ในกระเป๋า",
    "bond-low": "สายใยยังไม่แน่นพอจะขอให้ช่วย",
    "mind-low": "ใจยังไม่มั่นคงพอจะไปคนเดียว",
    "sta-low": "แรงเหลือไม่พอ",
    unknown: "ยังทำทางนี้ไม่ได้ในตอนนี้",
  }),
  ui: Object.freeze({
    game: "เจ้ากบ",
    hud: "สถานะของเจ้ากบ",
    bonds: "สายใยกับสหาย",
    pouch: "เปิดกระเป๋าสาน",
    settings: "ตั้งค่า",
    advance: "อ่านต่อ",
    stage: "เวที",
    dialogue: "บทพูด",
    decision: "ทางเลือก",
    narrator: "ผู้เล่า",
    armedHint: "กดอีกครั้งเพื่อยืนยัน",
    unavailable: "ยังเลือกไม่ได้",
    notice: "ข้อความแจ้ง",
    dismiss: "รับทราบ",
  }),
  notices: Object.freeze({
    "legacy-archive": "ข้อมูลของเรื่องเดิมยังเก็บไว้ในเครื่องนี้ครบ การเดินทางครั้งใหม่บันทึกแยกต่างหาก",
    "storage-unavailable": "ยังบันทึกลงเครื่องไม่ได้ คุณเล่นต่อได้ในหน้านี้ แต่ถ้าปิดหรือโหลดหน้าใหม่ ความคืบหน้าล่าสุดอาจหายไป",
    "save-protected": "พบข้อมูลบันทึกที่เปิดกับเนื้อหาชุดนี้ไม่ได้ ข้อมูลนั้นยังอยู่ครบ การเล่นครั้งนี้จะไม่บันทึกทับ",
    "save-recovered": "จุดบันทึกล่าสุดเสียหาย จึงเปิดจากสำเนาที่ยังดีอยู่ให้แทน",
    "save-corrupt": "จุดบันทึกเดิมเปิดไม่ได้ ข้อมูลยังเก็บไว้ การเริ่มใหม่ต้องให้คุณยืนยันก่อน",
    "save-elsewhere": "การเดินทางนี้ถูกบันทึกจากอีกหน้าหนึ่ง หน้านี้จึงเล่นต่อโดยไม่บันทึก เพื่อไม่ทับข้อมูลนั้น",
    "save-failed": "บันทึกลงเครื่องไม่ได้ คุณเล่นต่อได้ในหน้านี้ แต่ถ้าปิดหน้า ความคืบหน้าล่าสุดอาจหายไป",
    "settings-not-saved": "ตั้งค่าใช้ได้ในหน้านี้ แต่ยังบันทึกลงเครื่องไม่ได้",
  }),
  /** Sentences for accessible names; every count is written in words. */
  say: Object.freeze({
    meter: (label, value, max) => `${label} ${thaiCount(value)}จาก${thaiCount(max)}`,
    bond: (name, knots) => (knots === 0 ? `สายใยกับ${name} ยังไม่มีปม` : `สายใยกับ${name} ${thaiCount(knots)}ปม`),
    pouch: (used, capacity) => `เปิดกระเป๋าสาน มีของ${thaiCount(used)}จาก${thaiCount(capacity)}ช่อง`,
    cost: (parts) => (parts.length === 0 ? "" : `ใช้${parts.map(([label, pips]) => `${label}${thaiCount(pips)}เม็ด`).join("และ")}`),
    repeat: "ใช้ซ้ำแล้วจะคิดถึงบ้าน",
    act: (act) => `องก์ ${act}`,
    line: (speaker, text) => (speaker === null ? text : `${speaker}: ${text}`),
    onStage: (names) => (names.length === 0 ? "" : `บนเวที ${names.join(" ")}`),
  }),
  toast: Object.freeze({
    meter: (label, delta) => (delta < 0 ? `${label} ลดลง ${-delta}` : `${label} เพิ่มขึ้น ${delta}`),
    keepsake: (name) => `ได้รับ ${name}`,
  }),
});
