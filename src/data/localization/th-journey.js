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
  /** Tray groups (UX §3.3). */
  groups: Object.freeze({ basic: "ท่าหลัก", family: "ครอบครัว", friends: "สหาย", pouch: "ของ·ผสาน" }),
  /** Clash words: the badge follows v3 screens 3–4; outcomes never say "lost" (UX §3.1). */
  clash: Object.freeze({
    intent: (by, name) => `${by}เตรียมใช้ · ${name}`,
    neutralized: "ไม่มีผล",
    halved: "เหลือครึ่ง",
    doubled: "แรงเป็นสองเท่า",
    answered: "แก้ทางแล้ว",
    tray: "การกระทำในเทิร์นนี้",
    gauge: (light, max) => `แสง${thaiCount(light)}จาก${thaiCount(max)}`,
    turn: (turn, turns) => `เทิร์นที่${thaiCount(turn)}จาก${thaiCount(turns)}`,
    choose: (intent, groups) => (groups.length === 0 ? `เจตนา ${intent}` : `เจตนา ${intent} · การ์ดแก้ทางอยู่ใน${groups.join("และ")}`),
    outcomes: Object.freeze({ decisive: "แสงเต็มดวง", hold: "ยันแสงไว้ได้", narrow: "แสงยังไม่ดับ" }),
    preview: "เจตนาถัดไป",
  }),
  reasons: Object.freeze({
    "item-missing": "ยังไม่มีของชิ้นนี้ในกระเป๋า",
    "bond-low": "สายใยยังไม่แน่นพอจะขอให้ช่วย",
    "mind-low": "ใจยังไม่มั่นคงพอจะไปคนเดียว",
    "sta-low": "แรงเหลือไม่พอ",
    "no-drops": "หมดเวลาพักแล้ว",
    "group-taken": "เลือกอีกทางไปแล้ว",
    "nothing-to-ready": "ไม่มีของให้เตรียมแล้ว",
    unknown: "ยังทำทางนี้ไม่ได้ในตอนนี้",
  }),
  /**
   * Shelter camps (UX §4): the in-world clock of each camp (C1–C4 is the schema's closed set),
   * the words on the cards' effect line and the leave button.
   */
  camp: Object.freeze({
    timers: Object.freeze({
      C1: Object.freeze({ vessel: "shell", left: (n) => `กะลารับได้อีก${thaiCount(n)}หยด`, done: "กะลาเต็มแล้ว" }),
      C2: Object.freeze({ vessel: "can", left: (n) => `กระป๋องรับได้อีก${thaiCount(n)}หยด`, done: "กระป๋องเต็มแล้ว" }),
      C3: Object.freeze({ vessel: "lantern", left: (n) => `ตะเกียงเหลือ${thaiCount(n)}รอบ`, done: "ตะเกียงหมดลานแล้ว" }),
      C4: Object.freeze({ vessel: "bucket", left: (n) => `ถังรับได้อีก${thaiCount(n)}หยด`, done: "ถังเต็มแล้ว" }),
    }),
    board: "สิ่งที่ทำได้ใต้ชายคา",
    leave: "ออกเดินทางต่อ",
    leaveWait: "ยังพักต่อได้อีก",
    release: (name) => `สละ${name}`,
    bond: (name) => `สายใย${name} +`,
    picker: "เลือกของหนึ่งชิ้นให้พร้อมผสาน",
    back: "กลับไปที่กิจกรรม",
    slotEmpty: "ช่องว่าง",
  }),
  /** Tactile micro-actions (UX §5): how to do each kind by touch, mouse and keyboard. */
  micro: Object.freeze({
    region: "สัมผัสโต้ตอบ",
    instructions: Object.freeze({
      tap3: "แตะสามครั้ง หรือกด Space สามครั้ง",
      hold: "กดค้างไว้ หรือกด Space ค้าง ปล่อยก่อนก็ได้ แสงจะค่อย ๆ เต็มเอง",
      stitch: "แตะจุดทองทีละจุด หรือกด Space สามครั้ง",
      press: "แตะหนึ่งครั้ง หรือกด Space",
    }),
    progress: Object.freeze({
      tap3: (n) => `แตะแล้ว${thaiCount(n)}ครั้ง`,
      stitch: (n) => `เย็บแล้ว${thaiCount(n)}ฝี`,
      hold: () => "แสงกำลังเต็ม",
      press: () => "แตะแล้ว",
    }),
    done: "ครบแล้ว",
  }),
  /** The settings modal (UX §1.9): every control writes one field of the journey settings. */
  settings: Object.freeze({
    title: "ตั้งค่า",
    close: "ปิดตั้งค่า",
    text: "ขนาดตัวอักษร",
    scale: (percent) => `${percent}%`,
    view: "การมองเห็นและการเคลื่อนไหว",
    play: "การเล่น",
    options: Object.freeze({
      reducedMotion: Object.freeze(["ลดการเคลื่อนไหว", "แผงเปลี่ยนแบบจางเข้า ไม่เลื่อนและไม่เด้ง"]),
      reducedIntensity: Object.freeze(["ลดความเข้มแสง", "ฟ้าแลบเป็นแสงหรี่ ไม่วาบและไม่สั่นจอ"]),
      highContrast: Object.freeze(["คอนทราสต์สูง", "พื้นทึบแทนกระจกฝ้า เส้นขอบชัดขึ้น"]),
      confirmHighImpactChoices: Object.freeze(["ยืนยันทางเลือกสองจังหวะ", "กดครั้งแรกเพื่อเล็ง กดอีกครั้งเพื่อยืนยัน"]),
      counterTags: Object.freeze(["ป้ายแก้ทาง", "ป้ายซ้ำและราคาแสดงเสมอ"]),
      autoMicro: Object.freeze(["สัมผัสโต้ตอบอัตโนมัติ", "สำเร็จเองหลังหนึ่งวินาที"]),
    }),
  }),
  /** The pouch modal (ADR-P0-020): what is in the four slots and what the pouch remembers. */
  pouchPanel: Object.freeze({
    title: "กระเป๋าสาน",
    close: "ปิดกระเป๋า",
    held: "ในกระเป๋าตอนนี้",
    memory: "ความทรงจำของกระเป๋า",
    released: "ฝากไปแล้ว",
    refused: "ไม่ได้รับไว้",
    emptyMemory: "ยังไม่มีของที่ฝากไปหรือปฏิเสธ",
  }),
  /** The title of the Journey (ADR-P0-034 D7–D8): start, continue, consent and the one-time notices. */
  title: Object.freeze({
    subtitle: "เสื้อสีฟ้ากับการเดินทางในคืนพายุ",
    start: "เริ่มการเดินทาง",
    continue: "เล่นต่อ",
    continueAt: (act) => `จากองก์ ${act}`,
    memoryOnly: "ครั้งนี้เล่นโดยไม่บันทึกทับข้อมูลเดิม",
    settings: "ตั้งค่า",
    consent: "มีการเดินทางที่บันทึกไว้ในเบราว์เซอร์นี้ การเริ่มใหม่จะแทนที่ข้อมูลนั้น",
    consentYes: "ยืนยันเริ่มใหม่",
    consentNo: "ยกเลิก",
    memory: "เล่นโดยไม่บันทึก",
    acknowledge: "รับทราบ",
    back: "กลับหน้าแรก",
    boundary: "เรื่องหน้าต่อจากนี้ยังไม่เปิด",
    complete: "การเดินทางครั้งนี้จบแล้ว",
  }),
  /** The three-strand ending cards (UX §6.2): strand names in the story's own words. */
  endings: Object.freeze({
    group: "ทางเลือกในแสงแรก",
    strands: Object.freeze({
      "e-home": Object.freeze({ heart: "หัวใจ", promise: "คำสัญญา", button: "กระดุม" }),
      "e-pond": Object.freeze({ legs: "ขาที่พากลับ", roots: "รากเหง้า" }),
      "e-dawn": Object.freeze({ core: "ใจและขา", bonds: "ทุกสายใย", worlds: "สองโลก" }),
    }),
    lit: "พร้อม",
    dim: "ยังไม่พร้อม",
    closed: "ยังเลือกไม่ได้",
    marks: Object.freeze(["ก", "ข", "ค"]),
  }),
  /** The keepsake offer (UX §7, ADR-P0-020 D5). */
  pouch: Object.freeze({
    sheet: "รับของใหม่",
    incoming: "ของใหม่",
    slots: "กระเป๋าสานสี่ช่อง",
    slotEmpty: "ช่องว่าง",
    locked: "ฝากไม่ได้",
    handOn: "จะฝาก",
    handOnEffect: (name) => `ฝาก${name}`,
    memory: "เก็บไว้ในความทรงจำ",
    slot: (index, name) => `ช่องที่${thaiCount(index)} ${name}`,
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
    gain: (parts) => (parts.length === 0 ? "" : `ได้${parts.map(([label, pips]) => `${label}${thaiCount(pips)}เม็ด`).join("และ")}`),
    bondGain: (name) => `สายใยกับ${name}เพิ่มหนึ่งปม`,
    ready: (name) => `${name}พร้อมผสานในศึกถัดไป`,
    readyPick: "เลือกของหนึ่งชิ้นให้พร้อมผสานในศึกถัดไป",
    release: (name) => `สละ${name}`,
    handOn: (name) => `ฝาก${name}`,
    memory: "ของชิ้นนี้จะอยู่ในความทรงจำของกระเป๋า",
    repeat: "ใช้ซ้ำแล้วจะคิดถึงบ้าน",
    act: (act) => `องก์ ${act}`,
    line: (speaker, text) => (speaker === null ? text : `${speaker}: ${text}`),
    onStage: (names) => (names.length === 0 ? "" : `บนเวที ${names.join(" ")}`),
  }),
  toast: Object.freeze({
    meter: (label, delta) => (delta < 0 ? `${label} ลดลง ${-delta}` : `${label} เพิ่มขึ้น ${delta}`),
    keepsake: (name) => `ได้รับ ${name}`,
    bond: (name, delta) => `สายใย${name} เพิ่มขึ้น ${delta}`,
    ready: (name) => `${name} พร้อมผสาน`,
    handedOn: (name) => `ฝาก ${name} แล้ว`,
  }),
});
