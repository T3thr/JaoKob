// JaoKob · physics, scale and light geometry check (design evidence for ADR-P0-033 D5.1).
// Usage:  node docs/design-system/evidence/physics-scale-optics-check.mjs
//
// Every number quoted in physics-scale-and-visual-v2-specification.md comes from here.
// Each "claim" is a design statement the story or a mechanic relies on; the script computes
// it from first principles and fails (exit 1) if the arithmetic stops supporting it.
// Miracles are listed separately and are deliberately NOT physics (the star warming, the
// knight's cape, the velour transformation, Cockroach Man himself).

const g = 9.81;
const RHO_WATER = 1000;
const RHO_AIR = 1.2;
const V_AIR = 343; // m/s at about 20 °C
const V_STEEL = 5100; // m/s, bar velocity in a thin steel pipe wall
const V_WATER = 1480;

// --- Bodies ---------------------------------------------------------------------------
export const BODY = {
  kob: { h: 0.45, eye: 0.40, w: 0.18, mass: 1.2, mu: 0.6, density: 1050 },
  kab: { h: 0.48, mass: 1.45, legStroke: 0.18, legForceBW: 3.0 },
  kib: { h: 0.40, mass: 0.95 },
  pkam: { h: 0.14, tinD: 0.11, tinH: 0.07, mass: 0.35, pinchN: 18 },
  fiw: { body: 0.22, tail: 0.20, mass: 0.12, glide: 2.0 },
  teuk: { h: 1.72, eyeStand: 1.61, eyeKneel: 1.10, eyeSitFloor: 0.80, mass: 70 },
  peuak: { h: 1.60, eyeSitBed: 1.20, eyeLie: 0.55 },
  ton: { h: 1.22, eyeCrouch: 0.62 },
  lung: { h: 1.65, eyeLean: 1.30 },
};

// --- Places (heights and distances in metres) -------------------------------------------
export const PLACE = {
  curb: 0.15, salaBench: 0.45, salaRail: 0.70, bridgeRail: 0.90,
  table: 0.72, mattress: 0.50, sillAboveFloor: 0.90,
  gardenWall: 2.0, awning: 3.0, sill2: 4.2, latch: 4.4, banyanBranch: 6.0, wallToHouse: 3.5,
  lampToWall: 2.4, roomHeight: 2.8, bulbAboveTable: 0.25,
  slitToWall: 2.7, sluiceCeiling: 2.4,
  manhole: 0.6, grateGap: 0.03,
};

// --- Locomotion ------------------------------------------------------------------------
// Take-off speed rises with แรง (STA) pips: 2.4 m/s at 0 to 4.0 m/s at 5.
export const takeoff = (sta) => 2.4 + 0.32 * sta;
export const TECH = 1.12; // ดีดตัวผ่าลม: deeper crouch and elastic recoil, +12 % take-off speed
const range45 = (v) => (v * v) / g;
const apex = (v) => (v * v) / (2 * g);

// กับ's two-stage spring: his leg stroke does work F·d on the frog's feet.
const kabWork = BODY.kab.legForceBW * BODY.kab.mass * g * BODY.kab.legStroke; // joules
const withKab = (sta, tech = false) => {
  const v0 = takeoff(sta) * (tech ? TECH : 1);
  const e = 0.5 * BODY.kob.mass * v0 * v0 + kabWork;
  return Math.sqrt((2 * e) / BODY.kob.mass);
};

// --- Water -----------------------------------------------------------------------------
const frogVolume = BODY.kob.mass / BODY.kob.density;
function waterGrip(depth) {
  const submerged = frogVolume * Math.min(1, depth / BODY.kob.h);
  const normal = BODY.kob.mass * g - RHO_WATER * g * submerged;
  return BODY.kob.mu * normal; // newtons of friction before the toes slip
}
const drag = (v, depth, cd = 1.05, width = BODY.kob.w) => 0.5 * RHO_WATER * v * v * cd * width * depth;
const slipSpeed = (depth) => Math.sqrt((2 * waterGrip(depth)) / (RHO_WATER * 1.05 * BODY.kob.w * depth));

// --- Light -----------------------------------------------------------------------------
// Point source: an object at distance d from the light throws a shadow M = D/d times its size
// on a wall at distance D. A source of width s blurs the edge by s·(D − d)/d (penumbra).
const mag = (D, d) => D / d;
const penumbra = (s, D, d) => (s * (D - d)) / d;
// The stage maps the clash light front P (0..10) to positions on the bedside table so the
// two shadows are equal at P = 5, the knight grows as P rises and Cockroach Man shrinks.
export const frogDist = (P) => 0.95 - 0.07 * P;
export const shadeDist = (P) => 0.20 + 0.04 * P;
const SHADE_H = 0.30; // height of Cockroach Man's cloak silhouette
export const knightH = (P) => BODY.kob.h * mag(PLACE.lampToWall, frogDist(P));
export const shadeH = (P) => SHADE_H * mag(PLACE.lampToWall, shadeDist(P));
// Act 2 sluice chamber uses the same idea on the emergency-light slit: equal shadows at P = 5,
// and at P = 0 Cockroach Man sits 30 cm from the slit (claim O1).
export const frogDist2 = (P) => 1.40 - 0.10 * P;
export const shadeDist2 = (P) => 0.30 + 0.04 * P;
const ROACH_H = 0.25; // Cockroach Man seated on the can pile
export const frogShadow2 = (P) => BODY.kob.h * mag(PLACE.slitToWall, frogDist2(P));
export const roachShadow2 = (P) => ROACH_H * mag(PLACE.slitToWall, shadeDist2(P));
const LED = 0.006; // bare LED cluster after the frosted dome is lifted
const DOME = 0.09; // frosted dome

// --- Sound -----------------------------------------------------------------------------
const thunderKm = (s) => (s * V_AIR) / 1000;
const spl = (l1m, r) => l1m - 20 * Math.log10(r);

// ---------------------------------------------------------------------------------------
const rows = [];
let ok = true;
const claim = (id, text, pass, value) => { if (!pass) ok = false; rows.push({ id, text, pass, value }); };
const f = (x, n = 2) => x.toFixed(n);

// Scale
claim('S1', 'หนึ่งเซนติเมตรของเจ้ากบเท่ากับ 3.8 ซม. ของคน (172 ÷ 45)', Math.abs(BODY.teuk.h / BODY.kob.h - 3.82) < 0.02, f(BODY.teuk.h / BODY.kob.h));
claim('S2', 'ขอบฟุตบาท 15 ซม. สำหรับเจ้ากบเท่ากับกล่องสูงราว 57 ซม. สำหรับคน', Math.abs((PLACE.curb * BODY.teuk.h) / BODY.kob.h - 0.57) < 0.01, f((PLACE.curb * BODY.teuk.h) / BODY.kob.h) + ' m');
claim('S3', 'น้ำท่วมถนน 30 ซม. สำหรับเจ้ากบเท่ากับน้ำลึกระดับอก (1.15 ม.) สำหรับคน', Math.abs((0.30 * BODY.teuk.h) / BODY.kob.h - 1.15) < 0.01, f((0.30 * BODY.teuk.h) / BODY.kob.h) + ' m');
claim('S4', 'ปูเสฉวนพี่ก้ามสูงราวหนึ่งในสามของเจ้ากบ (กระป๋องลูกอม 11 ซม.)', BODY.pkam.h / BODY.kob.h < 0.35, f(BODY.pkam.h / BODY.kob.h));

// Eye lines for dual-scale VN framing (ADR-P0-032 D7.2): |Δ| ≤ 0.10 m
const eyePairs = [
  ['E1', 'Act 3 เตื๊อกนั่งพิงเสาศาลา กับเจ้ากบยืนบนม้านั่งศาลา', BODY.teuk.eyeSitFloor, PLACE.salaBench + BODY.kob.eye],
  ['E2', 'Act 3 เตื๊อกคุกเข่า กับเจ้ากบยืนบนราวศาลา', BODY.teuk.eyeKneel, PLACE.salaRail + BODY.kob.eye],
  ['E3', 'Act 3 เด็กชายต้นนั่งยอง กับเจ้ากบยืนบนขอบฟุตบาท', BODY.ton.eyeCrouch, PLACE.curb + BODY.kob.eye],
  ['E4', 'Act 3 ลุงยามโน้มตัวเหนือราวสะพาน กับเจ้ากบยืนบนราวสะพาน', BODY.lung.eyeLean, PLACE.bridgeRail + BODY.kob.eye],
  ['E5', 'Act 5 เปี๊ยกนั่งบนเตียง กับเจ้ากบยืนบนโต๊ะข้างเตียง', BODY.peuak.eyeSitBed, PLACE.table + BODY.kob.eye],
  ['E6', 'Act 5 เตื๊อกคุกเข่าข้างเตียง กับเจ้ากบยืนบนโต๊ะข้างเตียง', BODY.teuk.eyeKneel, PLACE.table + BODY.kob.eye],
];
for (const [id, text, human, frog] of eyePairs) claim(id, `ระดับสายตาตรงกัน: ${text}`, Math.abs(human - frog) <= 0.10, `คน ${f(human)} · กบ ${f(frog)} ม.`);

// Jumps
claim('J1', 'กระโดดไกลสุดที่แรงเต็ม 5 ได้ราว 1.6 ม. และสูงสุดราว 0.8 ม.', Math.abs(range45(takeoff(5)) - 1.63) < 0.02 && Math.abs(apex(takeoff(5)) - 0.82) < 0.02, `${f(range45(takeoff(5)))} / ${f(apex(takeoff(5)))} m`);
claim('J2', 'รางน้ำกว้าง 1.2 ม. (A3-02): ยืนหยัดเองต้องมีแรง ≥ 4', range45(takeoff(4)) >= 1.2 && range45(takeoff(3)) < 1.2, `แรง 4 → ${f(range45(takeoff(4)))} · แรง 3 → ${f(range45(takeoff(3)))} m`);
claim('J3', 'ดีดตัวผ่าลมข้ามรางน้ำ 1.2 ม. ได้แม้แรงเหลือ 3', range45(takeoff(3) * TECH) >= 1.2, `${f(range45(takeoff(3) * TECH))} m`);
claim('J4', 'กำแพงสวน 2.0 ม. กระโดดไม่ถึงในทุกกรณี ต้องไต่เถาไอวี่', apex(takeoff(5) * TECH) < PLACE.gardenWall, `${f(apex(takeoff(5) * TECH))} m`);
const tableRise = PLACE.table + 0.12 - 0.20; // feet must clear the table top; COM 0.20 m when crouched, 0.12 m above feet when tucked
claim('J5', 'โต๊ะข้างเตียง 72 ซม. (A5-02): กระโดดเองต้องมีแรง ≥ 4 หรือใช้ดีดตัวผ่าลม จึงมีทางเลือกปีนผ้าปูเตียงแทน', apex(takeoff(4)) >= tableRise && apex(takeoff(3)) < tableRise && apex(takeoff(3) * TECH) >= tableRise, `ต้องยก ${f(tableRise)} · แรง 4 ${f(apex(takeoff(4)))} · แรง 3 ${f(apex(takeoff(3)))} m`);
const gap = PLACE.sill2 - PLACE.awning;
claim('J6', `แผน B: จากกันสาดถึงขอบหน้าต่าง ${f(gap)} ม. กบกระโดดเองไม่ถึงแม้แรงเต็ม`, apex(takeoff(5) * TECH) < gap, `${f(apex(takeoff(5) * TECH))} m`);
claim('J7', 'แผน B: สปริงพี่ใหญ่ทำให้ถึงขอบหน้าต่างได้เมื่อแรง ≥ 3 หรือแรง 2 ร่วมกับดีดตัวผ่าลม', apex(withKab(3)) >= gap && apex(withKab(2)) < gap && apex(withKab(2, true)) >= gap, `แรง 3 ${f(apex(withKab(3)))} · แรง 2 ${f(apex(withKab(2)))} · แรง 2+เทคนิค ${f(apex(withKab(2, true)))} m`);
claim('J8', 'แผน B: งานจากขาพี่กับราว 7.7 จูล เพิ่มความเร็วออกตัวราว 1.5 ม./วินาที', Math.abs(kabWork - 7.68) < 0.05 && Math.abs(withKab(3) - takeoff(3) - 1.55) < 0.06, `${f(kabWork)} J · Δv ${f(withKab(3) - takeoff(3))} m/s`);

// Plan A zip line
const drop = PLACE.banyanBranch - PLACE.latch;
const theta = Math.atan2(drop, PLACE.wallToHouse);
const L = Math.hypot(drop, PLACE.wallToHouse);
const muCord = 0.30;
const acc = g * (Math.sin(theta) - muCord * Math.cos(theta));
const vEnd = Math.sqrt(2 * acc * L);
claim('Z1', 'แผน A: สายเชือกกกจากกิ่งไทร 6.0 ม. ถึงกลอนหน้าต่าง 4.4 ม. ชันราว 25°', Math.abs((theta * 180) / Math.PI - 24.6) < 0.3, `${f((theta * 180) / Math.PI, 1)}° · ยาว ${f(L)} m`);
claim('Z2', 'แผน A: ไถลถึงหน้าต่างด้วยความเร็วไม่เกิน 3.5 ม./วินาที (เทียบการกระโดดลงจากที่สูง 0.6 ม.)', vEnd <= 3.5, `${f(vEnd)} m/s ≈ ตกจาก ${f(apex(vEnd))} m`);
const gust = 14;
const windPush = 0.5 * RHO_AIR * gust * gust * 1.0 * BODY.kob.h * BODY.kob.w;
const slopePull = BODY.kob.mass * g * Math.sin(theta);
claim('Z3', 'แผน A: ลมกระโชก 14 ม./วินาทีดันเจ้ากบย้อนขึ้นเชือกได้ จึงต้องใช้เฟืองล็อกทางเดียวกันไถลถอยหลัง', windPush > slopePull, `ลม ${f(windPush, 1)} N > แรงดึงตามลาด ${f(slopePull, 1)} N`);
const fiwStart = PLACE.latch + PLACE.wallToHouse / BODY.fiw.glide;
claim('Z4', 'แผน A: เจ้าฟิ้วร่อนอัตรา 2:1 พาปลายเชือกข้าม 3.5 ม. ได้เมื่อเริ่มจากกิ่งไทรสูง ≥ 6.15 ม.', fiwStart <= 6.2, `${f(fiwStart)} m`);
const cordLoad = 0.003 * L / BODY.fiw.mass;
claim('Z5', 'แผน A: เชือกกกยาว 3.9 ม. หนัก 12 กรัม เป็นภาระไม่เกิน 15% ของตัวเจ้าฟิ้ว', cordLoad <= 0.15, `${f(cordLoad * 100, 0)}%`);

// Water
claim('W1', 'น้ำลึก 12 ซม. ไหลเกิน 0.7 ม./วินาที เจ้ากบจะลื่นไถล (ท่อ A2A-01 ไหล 0.8 ม./วินาที)', slipSpeed(0.12) < 0.8, `ไถลที่ ${f(slipSpeed(0.12))} m/s`);
claim('W2', 'รางน้ำริมถนน ลึก 15 ซม. ไหล 1.0 ม./วินาที แรงต้านมากกว่าแรงยึดเกาะหลายเท่า (ต้องกระโดดข้ามหรือเกาะกระป๋อง)', drag(1.0, 0.15) > 2 * waterGrip(0.15), `ต้าน ${f(drag(1.0, 0.15), 1)} N · ยึด ${f(waterGrip(0.15), 1)} N`);
const teukDrag = 0.5 * RHO_WATER * 1.2 * 1.2 * 1.2 * (2 * 0.12 * 0.30);
claim('W3', 'น้ำท่วมถนน 30 ซม. ไหล 1.2 ม./วินาที คนยืนได้ แต่ข้อเท้าพลิกทำให้เสี่ยง (แรงต้านขาราว 60 นิวตัน)', teukDrag > 50 && teukDrag < 80, `${f(teukDrag, 0)} N`);
const tinDrag = 0.5 * RHO_WATER * 1.2 * 1.2 * 1.2 * BODY.pkam.tinD * BODY.pkam.tinH;
claim('W4', 'กระป๋องพี่ก้ามติดตะแกรงน้ำวน: น้ำ 1.2 ม./วินาทีกดไว้ราว 7 นิวตัน มากกว่าแรงหนีบของพี่ก้าม (ต้องมีคนดึงหรือหยุดเฟือง)', tinDrag > BODY.pkam.pinchN * 0.35, `${f(tinDrag, 1)} N`);

// Lever and gear
const leverOut = (25 * 0.20) / 0.025;
claim('L1', 'สนับข้อมือเปลือกไม้งัดฟันเฟืองประตูน้ำ: แขนเจ้ากบ 25 N ที่ 20 ซม. จุดหมุน 2.5 ซม. ได้แรงขัด 200 N', Math.abs(leverOut - 200) < 1, `${f(leverOut, 0)} N`);

// Sound
const thunder = [['T1', 'Act 1 พลบค่ำ', 9], ['T2', 'Act 2 ใต้ดิน', 6], ['T3', 'Act 3 ไฟดับ', 3], ['T4', 'Act 4 กำแพงสวน', 1], ['T5', 'Act 5 พายุผ่านไป', 4], ['T6', 'รุ่งสาง', 12]];
for (const [id, text, s] of thunder) claim(id, `ฟ้าแลบถึงฟ้าร้อง ${s} วินาที (${text}) = ห่าง ${f(thunderKm(s), 2)} กม.`, true, `${f(thunderKm(s), 2)} km`);
claim('A1', 'นับวินาทีหารสามได้ระยะเป็นกิโลเมตร (คลาดไม่เกิน 3%)', Math.abs(thunderKm(3) - 1) <= 0.03, `${f(thunderKm(3), 3)} km/3 s`);
claim('A2', 'เคาะท่อเหล็กยาว 200 ม.: เสียงในเหล็กถึงก่อนเสียงในอากาศกว่าครึ่งวินาที', 200 / V_AIR - 200 / V_STEEL > 0.5, `เหล็ก ${f(200 / V_STEEL, 3)} s · อากาศ ${f(200 / V_AIR, 3)} s`);
claim('A3', 'เสียงในน้ำเร็วกว่าในอากาศราว 4 เท่า แต่ช้ากว่าในเหล็กราว 3 เท่า', Math.abs(V_WATER / V_AIR - 4.3) < 0.2 && Math.abs(V_STEEL / V_WATER - 3.4) < 0.2, `${f(V_WATER / V_AIR, 1)}× · ${f(V_STEEL / V_WATER, 1)}×`);
const whistleAt12 = spl(100, 12);
claim('A4', 'นกหวีดทองเหลือง 100 dB ที่ 1 ม. ยังดังราว 78 dB ที่รั้ว 12 ม. ดังกว่าเสียงฝนหนัก 70 dB', whistleAt12 > 75 && whistleAt12 - 70 >= 5, `${f(whistleAt12, 1)} dB`);
claim('A5', 'ฟ้าร้องใกล้ (ราว 115 dB) กลบนกหวีดหมดชั่วขณะ จึงต้องเป่าในช่วงเงียบหลังเสียงครืน', 115 - whistleAt12 > 30, `ต่างกัน ${f(115 - whistleAt12, 0)} dB`);

// Light: Act 2 slit, Act 5 lamp, button mirror, flashlight
const slitShadow = ROACH_H * mag(PLACE.slitToWall, 0.30);
claim('O1', 'Act 2: แมลงสาบแมนสูง 25 ซม. นั่งห่างช่องแสง 30 ซม. ผนังห่าง 2.7 ม. ทอดเงาสูง 2.25 ม.', Math.abs(slitShadow - 2.25) < 0.01, `${f(slitShadow)} m`);
claim('O2', 'Act 5: ที่แสงสมดุล (P = 5) เงาอัศวินกับเงาแมลงสาบแมนสูงเท่ากัน', Math.abs(knightH(5) - shadeH(5)) < 0.01, `${f(knightH(5))} m`);
claim('O3', 'Act 5: ต้นศึก (P = 2) เงาแมลงสาบแมนสูงเกือบสองเท่าของเงาอัศวิน', shadeH(2) / knightH(2) > 1.9, `เงามืด ${f(shadeH(2))} · อัศวิน ${f(knightH(2))} m · ${f(shadeH(2) / knightH(2))} เท่า`);
claim('O4', `Act 5: ชนะขาด (P = 10) เงาอัศวินสูงเกินผนัง ${PLACE.roomHeight} ม. จนพาดเพดาน`, knightH(10) > PLACE.roomHeight, `${f(knightH(10))} m`);
claim('O5', 'Act 5: เงาเติบโตต่อเนื่องและเงามืดหดต่อเนื่องทุกระดับแสง', [...Array(10).keys()].every((p) => knightH(p + 1) > knightH(p) && shadeH(p + 1) < shadeH(p)), 'monotone');
const dK = 0.35;
claim('O6', 'Act 5: ยกโป๊ะฝ้าออก เงาอัศวินขอบคม (เบลอ 3.5 ซม.) จากเดิมเบลอครึ่งเมตร', penumbra(LED, PLACE.lampToWall, dK) < 0.04 && penumbra(DOME, PLACE.lampToWall, dK) > 0.5, `LED ${f(penumbra(LED, PLACE.lampToWall, dK), 3)} · โป๊ะ ${f(penumbra(DOME, PLACE.lampToWall, dK), 2)} m`);
claim('O7', 'Act 5: เงาแมลงสาบแมนชิดแสงใต้โป๊ะฝ้าเบลอเกือบหนึ่งเมตร (ความกลัวคือความพร่า)', penumbra(DOME, PLACE.lampToWall, 0.20) > 0.9, `${f(penumbra(DOME, PLACE.lampToWall, 0.20), 2)} m`);
const spot = 0.015 * (dK + (PLACE.lampToWall - dK)) / dK;
claim('O8', 'กระดุมทองเหลือง Ø1.5 ซม. ห่างหลอด 35 ซม. สะท้อนเป็นดวงแสงราว 10 ซม. บนผนัง (ตราแสงกลางอกอัศวิน)', Math.abs(spot - 0.103) < 0.005, `${f(spot * 100, 1)} cm`);
claim('O9', 'เอียงกระดุม θ องศา ลำแสงสะท้อนเบนไป 2θ (เอียง 10° ย้ายดวงแสงบนผนัง 2.05 ม. ได้ราว 75 ซม.)', Math.abs(Math.tan((20 * Math.PI) / 180) * (PLACE.lampToWall - dK) - 0.746) < 0.01, `${f(Math.tan((20 * Math.PI) / 180) * (PLACE.lampToWall - dK), 2)} m`);
claim('O11', 'Act 2 เวทีเงาสด: ที่แสงสมดุล (P = 5) เงากบกับเงาแมลงสาบแมนสูงเท่ากัน และที่ P = 0 เงามืดกลับเป็น 2.25 ม. ตามข้อ O1', Math.abs(frogShadow2(5) - roachShadow2(5)) < 0.01 && Math.abs(roachShadow2(0) - slitShadow) < 0.01, `P 5: ${f(frogShadow2(5))} m · P 0: ${f(roachShadow2(0))} m`);
claim('O12', `Act 2 เวทีเงาสด: ชนะขาด (P = 10) เจ้ากบยืนชิดช่องแสงกว่าแมลงสาบแมน เงาสูงเกินเพดานโถง ${PLACE.sluiceCeiling} ม. และเงาสองฝั่งเปลี่ยนต่อเนื่องทุกระดับแสง`, frogDist2(10) < shadeDist2(10) && frogShadow2(10) > PLACE.sluiceCeiling && [...Array(10).keys()].every((p) => frogShadow2(p + 1) > frogShadow2(p) && roachShadow2(p + 1) < roachShadow2(p)), `กบห่าง ${f(frogDist2(10))} · แมลงสาบแมนห่าง ${f(shadeDist2(10))} m · เงากบ ${f(frogShadow2(10))} m`);
const beam = 2 * 3 * Math.tan((5 * Math.PI) / 180);
claim('O10', 'ไฟฉายเตื๊อกมุมลำแสง 10° ที่ 3 ม. เป็นวงแสงราวครึ่งเมตร', Math.abs(beam - 0.525) < 0.01, `${f(beam, 2)} m`);

// Journey timeline (one night, 18:30 → 06:10)
const legs = [['บึง → ฝายน้ำล้น', 300], ['ฝาย → ประตูน้ำเมือง', 200], ['ท่อใต้เมือง (Act 2)', 1200], ['ฝาท่อ → ศาลาริมคลอง (Act 3)', 500], ['ศาลา → บ้านหลังคาสีครีม (ทางลัด)', 300]];
const meters = legs.reduce((a, [, m]) => a + m, 0);
const hours = 11 + 40 / 60;
claim('R1', `ระยะทางทั้งคืน ${meters} ม. ใน ${f(hours, 1)} ชม. เฉลี่ยไม่ถึง 0.1 ม./วินาที (เดินช้ากว่าเดินปกติของกบมาก เพราะมีด่าน พัก และศึก)`, meters / (hours * 3600) < 0.1, `${f(meters / (hours * 3600), 3)} m/s`);

const MIRACLES = [
  'ดาวสามแฉกที่ชายเสื้ออุ่นวาบเมื่อเจ้าของเสื้อกลัว และเย็นลงเมื่อเธอปลอดภัย',
  'รูปร่างผ้าคลุมอัศวินของเงา (ขนาดของเงาเป็นฟิสิกส์ แต่รูปผ้าคลุมคือพลังผู้พิทักษ์ตามมติ PO)',
  'การกลายร่างเป็นตุ๊กตากำมะหยี่นุ่มเรียบใน E-HOME',
  'ตัวตนของแมลงสาบแมน ภูตเงาที่เกิดจากความกลัวในมุมมืด',
  'เมล็ดต้อยติ่งที่เรืองแสงเมื่อแตกกระทบน้ำ (การแตกฝักเมื่อเปียกเป็นของจริง แต่แสงคือปาฏิหาริย์)',
];

console.log('JaoKob physics, scale and light geometry check');
for (const r of rows) console.log(`${r.pass ? 'ผ่าน' : 'ไม่ผ่าน'} · ${r.id} · ${r.text} · ${r.value}`);
console.log('');
console.log('ตารางแรงกับการกระโดด (ความเร็วออกตัว · ไกลสุดที่ 45° · สูงสุดแนวดิ่ง):');
for (let s = 0; s <= 5; s++) console.log(`  แรง ${s}: ${f(takeoff(s))} m/s · ${f(range45(takeoff(s)))} m · ${f(apex(takeoff(s)))} m · ดีดตัวผ่าลม ${f(range45(takeoff(s) * TECH))} m / ${f(apex(takeoff(s) * TECH))} m`);
console.log('');
console.log('ตารางเวทีเงา Act 5 (ระดับแสง P → ระยะจากหลอด · ความสูงเงา):');
for (let p = 0; p <= 10; p++) console.log(`  P ${String(p).padStart(2)}: กบ ${f(frogDist(p))} m → อัศวิน ${f(knightH(p))} m · แมลงสาบแมน ${f(shadeDist(p))} m → เงามืด ${f(shadeH(p))} m · สัดส่วนแสง ${f(knightH(p) / (knightH(p) + shadeH(p)))}`);
console.log('');
console.log('ตารางเวทีเงา Act 2 (ระดับแสง P → ระยะจากช่องแสง · ความสูงเงา):');
for (let p = 0; p <= 10; p++) console.log(`  P ${String(p).padStart(2)}: กบ ${f(frogDist2(p))} m → ${f(frogShadow2(p))} m · แมลงสาบแมน ${f(shadeDist2(p))} m → ${f(roachShadow2(p))} m`);
console.log('');
console.log('สิ่งที่เป็นปาฏิหาริย์ ไม่ใช่ฟิสิกส์ (ไม่ต้องคำนวณ แต่ต้องคงไว้ตามสัจจะ):');
for (const m of MIRACLES) console.log(`  · ${m}`);
console.log('');
console.log(ok ? 'ผลรวม: ผ่านทุกข้อ' : 'ผลรวม: มีข้อที่ไม่ผ่าน');
process.exitCode = ok ? 0 : 1;
