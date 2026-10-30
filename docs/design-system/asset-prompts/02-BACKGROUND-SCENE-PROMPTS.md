# คลัง Prompt สำหรับเจนภาพฉากหลังทั้ง 5 องก์ (`02-BACKGROUND-SCENE-PROMPTS.md`)
## โครงการ JaoKob (เจ้ากบ) — สัญญาฉากหลังเวที Visual Novel ตาม [ADR-P0-032](../../adr/ADR-P0-032-living-fantasy-canon-peuak-miracle-doll-and-vn-stage-blocking.md)

> [!IMPORTANT]
> **กฎเหล็กสำหรับฉากหลังทุกภาพ (Mandatory Background Rules for `Senior AI / GPT-6 Astra`):**
> 1. **ความละเอียดและอัตราส่วน:** `16:9` Widescreen (`1600×900 px` หรือ `1920×1080 px`), รูปแบบ `.webp` (Quality 85+) พร้อมสำเนาในโฟลเดอร์ย่อย `versions/v1/`
> 2. **ห้ามวาดตัวละครติดลงไปในฉากหลัง (`Background Only — Zero Characters`):** ตัวละครจะถูกเอนจินเกมนำมาวางทับในตำแหน่ง `slot: "left"` และ `slot: "right"`
> 3. **มุมกล้องระดับสายตาเจ้ากบ (`45 cm Low Frog-Eye Perspective`):** มุมกล้องต้องอยู่สูงจากพื้นดินราว 30–45 ซม. ทำให้ต้นกก กอไผ่ ฝาท่อ และกำแพงอิฐดูยิ่งใหญ่สมจริงในมุมมองของเจ้ากบ
> 4. **พื้นที่ปลอดภัยสำหรับกล่องบทพูด (`Lower 28% Dialogue Safe Zone`):** บริเวณด้านล่างสุด 28% ของภาพต้องเป็นพื้นผิวที่มีคอนทราสต์ต่ำและสงบ (เช่น ผิวน้ำ ลานหิน หรือเงาพื้นไม้) เพื่อไม่ให้กวนสายตาเวลาอ่านข้อความภาษาไทย

---

## องก์ที่ 1 (Act 1): ชุมชนกอไผ่ริมบึงกกและคืนก่อนพายุใหญ่ (`assets/images/backgrounds/act-01/`)

### 1.1 รากต้นหลิวใหญ่ริมบึงกกหลังฝนพรำ (`bg-act1-willow-roots.webp` — ฉากวัยเด็ก `A1-01`–`A1-03`)
- **พาธส่งมอบไฟล์:** `assets/images/backgrounds/act-01/bg-act1-willow-roots.webp`
- **Prompt สำหรับเจนภาพ:**
  ```text
  Wide 16:9 Visual Novel background illustration from a 45cm low frog-eye perspective: ancient weeping willow tree roots dipping into a tranquil emerald-green reed pond after a gentle warm rain. Sunbeams filter through hanging willow vines, illuminating dewdrops on lotus pads and tall cattail reeds. Open flat mossy bank on the left and right sides for character sprites, calm water reflections in the bottom 28% reading zone. Warm hand-painted storybook aesthetic, no characters, no text, no UI.
  ```

### 1.2 ชานบ้านกอไผ่ยามเย็นก่อนพายุเข้า (`bg-act1-bamboo-home-dusk.webp` — ฉากครอบครัวและมอบกระเป๋าสาน `A1-04`–`A1-10`)
- **พาธส่งมอบไฟล์:** `assets/images/backgrounds/act-01/bg-act1-bamboo-home-dusk.webp`
- **Prompt สำหรับเจนภาพ:**
  ```text
  Wide 16:9 Visual Novel background illustration from a low 45cm perspective: a cozy miniature frog-family shelter nestled beneath a grove of giant green bamboo stalks beside a reed pond at dusk. Warm amber firefly lanterns hang from woven reed arches, while in the far distance above the horizon, deep indigo storm clouds gather over a distant city skyline. Clear bamboo-terrace staging areas on the left and right, soft shadowed foreground in the lower 28% for text readability. Rich painted storybook lighting, no characters, no text.
  ```

### 1.3 ฝายน้ำล้นและปากทางเข้าท่อต้นน้ำ (`bg-act1-overflow-weir.webp` — ฉากปะทะแมลงสาบแมนยกที่ 1 `A1-11`–`A1-14`)
- **พาธส่งมอบไฟล์:** `assets/images/backgrounds/act-01/bg-act1-overflow-weir.webp`
- **Prompt สำหรับเจนภาพ:**
  ```text
  Wide 16:9 Visual Novel background from a low 45cm perspective: an old stone-and-timber overflow weir at the boundary between a natural reed pond (left side) and a large concrete storm-drain sluice gate leading toward the city (right side) as twilight wind ripples the water. Swirling mist and dramatic twilight rim light, flat stepping stones on left and right for stage blocking, calm dark water in the lower 28% safe zone. Hand-painted storybook style, no characters, no text.
  ```

---

## องก์ที่ 2 (Act 2): อุโมงค์ท่อระบายน้ำลึกและประตูน้ำหมุน (`assets/images/backgrounds/act-02/`)

### 2.1 อุโมงค์ท่อระบายน้ำหลักและรอยเมล็ดต้อยติ่งเรืองแสง (`bg-act2-echo-culvert.webp` — `A2-01`–`A2-05`)
- **พาธส่งมอบไฟล์:** `assets/images/backgrounds/act-02/bg-act2-echo-culvert.webp`
- **Prompt สำหรับเจนภาพ:**
  ```text
  Wide 16:9 Visual Novel background from a low 45cm perspective: the interior of a cavernous brick-and-concrete underground storm culvert with a raised walkway ledge on both sides of a flowing water channel. Shafts of cool teal moonlight and warm amber streetlamp beams pierce down through iron manhole grates above, while tiny glowing golden-green acoustic seeds mark a secret trail along the left brick wall. Calm dark water reflections in the bottom 28%, atmospheric painted storybook lighting, no characters, no text.
  ```

### 2.2 ตะแกรงน้ำวนและท่อเหล็กคู่ขนาน (`bg-act2-whirlpool-grate.webp` — ฉากช่วยชีวิตพี่ก้าม `A2-06`–`A2-08`)
- **พาธส่งมอบไฟล์:** `assets/images/backgrounds/act-02/bg-act2-whirlpool-grate.webp`
- **Prompt สำหรับเจนภาพ:**
  ```text
  Wide 16:9 Visual Novel background from a low 45cm perspective: a dramatic underground drainage junction where rushing rainwater swirls around a heavy iron grate and rusted brass sluice gears. Acoustic iron pipes run along the walls, and an old vintage tin-can shelter sits wedged near the stone ledge. High-contrast cinematic teal and warm bronze lighting, clear ledges on left and right for sprites, dark calm shadow gradient in the lower 28% for text readability, no characters, no text.
  ```

### 2.3 โถงบัลลังก์เงาเหนือประตูน้ำหมุน (`bg-act2-shadow-sluice-chamber.webp` — ฉากปะทะแมลงสาบแมนยกที่ 2 `A2-09`–`A2-13`)
- **พาธส่งมอบไฟล์:** `assets/images/backgrounds/act-02/bg-act2-shadow-sluice-chamber.webp`
- **Prompt สำหรับเจนภาพ:**
  ```text
  Wide 16:9 Visual Novel background from a low 45cm perspective: a grand circular underground sluice-gate chamber. On the right side stands a comical makeshift "throne" built from discarded megaphone cones, bottle caps, and tin cans positioned in front of an angled grate light beam so it casts a huge dramatic shadow onto the wet concrete wall behind it. On the left side is a sturdy iron gear platform with counterweight cables overhead. Painted storybook lighting, no characters, no text.
  ```

---

## องก์ที่ 3 (Act 3): เมืองมนุษย์ในคืนไฟดับและศาลาริมทาง (`assets/images/backgrounds/act-03/`)

### 3.1 ถนนชานเมืองยามไฟดับและใต้แผงลอยไม้ (`bg-act3-blackout-street-cart.webp` — ฉากเด็กชายต้น `A3-01`–`A3-04`)
- **พาธส่งมอบไฟล์:** `assets/images/backgrounds/act-03/bg-act3-blackout-street-cart.webp`
- **Prompt สำหรับเจนภาพ:**
  ```text
  Wide 16:9 Visual Novel background from a low 45cm ground-level perspective: looking out from beneath a cozy wooden street-vendor cart onto a rain-lashed Thai suburban sidewalk during a power blackout. Power lines overhead are dark, while warm yellow car headlights and a small glass medicine bottle resting near a curb drain grate reflect in the shimmering rainwater puddles. Warm vs cool cinematic rain atmosphere, calm dark wet asphalt in the lower 28%, no characters, no text.
  ```

### 3.2 สะพานไม้ข้ามคลองที่น้ำเอ่อล้น (`bg-act3-flooded-footbridge.webp` — ฉากคุณลุงยามเฝ้าสะพาน `A3-05`)
- **พาธส่งมอบไฟล์:** `assets/images/backgrounds/act-03/bg-act3-flooded-footbridge.webp`
- **Prompt สำหรับเจนภาพ:**
  ```text
  Wide 16:9 Visual Novel background from a low 45cm perspective: a wooden pedestrian footbridge over a swollen suburban canal in the pouring rain at night. A glowing red emergency warning flare sits near a wooden barrier on the wet planks, casting warm crimson-and-gold reflections across the rain-slicked wood. Storybook painterly realism, clear staging lanes on left and right, no characters, no text.
  ```

### 3.3 ศาลาพักริมทางที่ต้นไม้โค่นขวางถนน (`bg-act3-wayside-shelter-teuk.webp` — ฉากพบเจ้าเตื๊อก `A3-06`–`A3-13`)
- **พาธส่งมอบไฟล์:** `assets/images/backgrounds/act-03/bg-act3-wayside-shelter-teuk.webp`
- **Prompt สำหรับเจนภาพ:**
  ```text
  Wide 16:9 Visual Novel background from a low 45cm perspective: a small wooden Thai wayside bus shelter in the middle of a heavy night rainstorm. Beyond the shelter, a fallen banyan tree branch and rushing floodwater block the main road, while at the far end of a dark quiet alley stands a two-story cream-roofed house with a dimly lit second-floor bedroom window. Inside the shelter, a warm emergency lantern glows softly. Emotional cinematic storybook lighting, no characters, no text.
  ```

---

## องก์ที่ 4 (Act 4): ป้อมปราการกำแพงสวนและห้วงพายุ 12 เมตร (`assets/images/backgrounds/act-04/`)

### 4.1 โคนกำแพงอิฐสวนหลังบ้านและท่อระบายน้ำสวน (`bg-act4-garden-brick-wall.webp` — `A4-01`–`A4-05`)
- **พาธส่งมอบไฟล์:** `assets/images/backgrounds/act-04/bg-act4-garden-brick-wall.webp`
- **Prompt สำหรับเจนภาพ:**
  ```text
  Wide 16:9 Visual Novel background from a low 45cm perspective: the base of a towering moss-covered red brick garden wall in a stormy night garden. Climbing ivy vines and a taut metal clothesline cable lead upward toward the top of the wall, while a round brass-rimmed garden drain pipe opens at the bottom right corner. Dramatic storm wind and silver-blue rain streaks, warm window glow high above, no characters, no text.
  ```

### 4.2 ยอดกำแพงสวนและห้วงน้ำเชี่ยว 12 เมตรสู่หน้าต่างห้องเปี๊ยก (`bg-act4-parapet-storm-abyss.webp` — ฉากรวมพล 5 ฮีโร่ `A4-06`–`A4-13`)
- **พาธส่งมอบไฟล์:** `assets/images/backgrounds/act-04/bg-act4-parapet-storm-abyss.webp`
- **Prompt สำหรับเจนภาพ:**
  ```text
  Wide 16:9 Visual Novel background from a dynamic elevated perspective on top of a wet brick garden parapet: looking across a 12-meter wind-swept garden gap toward the second-floor bedroom window of a cozy house. Warm golden light flickers dimly inside that distant window, while lightning illuminates swirling autumn leaves and rain across the gap between the wall (left foreground) and the windowsill (right midground). Epic cinematic storybook atmosphere, no characters, no text.
  ```

---

## องก์ที่ 5 (Act 5): ห้องนอนชั้นสองของเด็กหญิงเปี๊ยกและปาฏิหาริย์รุ่งอรุณ (`assets/images/backgrounds/act-05/`)

### 5.1 โต๊ะข้างเตียงและหุ่นตุ๊กตาผ้าไร้เสื้อในคืนไฟดับ (`bg-act5-bedside-table-night.webp` — `A5-01`–`A5-04`)
- **พาธส่งมอบไฟล์:** `assets/images/backgrounds/act-05/bg-act5-bedside-table-night.webp`
- **Prompt สำหรับเจนภาพ:**
  ```text
  Wide 16:9 Visual Novel background from a 45cm tabletop perspective inside a cozy young woman's bedroom during a rainy night power outage: on the wooden bedside table sits a warm battery-powered desk lamp, a small framed photo of a couple on a wooden bridge, a sewing basket, and an unfinished plain cream-cloth frog doll core without a shirt. In the soft background, a bed with a pastel blanket is visible while raindrops streak the window glass. Intimate, deeply emotional storybook lighting, no living characters, no text.
  ```

### 5.2 เวทีศึกเงาสองสเกลหน้าโคมไฟตั้งโต๊ะ (`bg-act5-shadow-duel-wall.webp` — ฉากปะทะแมลงสาบแมนยกตัดสิน `A5-05`–`A5-09`)
- **พาธส่งมอบไฟล์:** `assets/images/backgrounds/act-05/bg-act5-shadow-duel-wall.webp`
- **Prompt สำหรับเจนภาพ:**
  ```text
  Wide 16:9 Visual Novel background inside a dark bedroom illuminated by a single focused warm beam from a bedside desk lamp on the left pointing toward the wide bedroom wall above the bed on the right, creating a dramatic shadow-theater projection stage across the wall. Rain outside the open window, dramatic golden light beam cutting through the dark room, calm dark wooden table surface in the lower 28% safe zone, no characters, no text.
  ```

### 5.3 ห้องนอนของเปี๊ยกในแสงสีทองแห่งรุ่งอรุณ (`bg-act5-bedroom-golden-dawn.webp` — ฉากจบ `E-HOME` & `E-DAWN` `A5-10`–`A5-12`)
- **พาธส่งมอบไฟล์:** `assets/images/backgrounds/act-05/bg-act5-bedroom-golden-dawn.webp`
- **Prompt สำหรับเจนภาพ:**
  ```text
  Wide 16:9 Visual Novel background: the same cozy bedroom after the storm has passed at sunrise. Radiant golden-pink morning sunlight streams through the open bedroom window, sparkling on fresh raindrops on the windowsill and filling the soft cream-and-sky-blue bedding with breathtaking warmth and peace. A clear windowsill on the right and soft bed pillow area on the left, painted storybook masterpiece quality, no characters, no text.
  ```

### 5.4 บึงกกในแสงตะวันยามเช้าหลังพายุสงบ (`bg-act5-pond-homecoming-dawn.webp` — ฉากจบ `E-POND`)
- **พาธส่งมอบไฟล์:** `assets/images/backgrounds/act-05/bg-act5-pond-homecoming-dawn.webp`
- **Prompt สำหรับเจนภาพ:**
  ```text
  Wide 16:9 Visual Novel background from a 45cm frog-eye perspective: the Whispering Reed Pond and bamboo grove bathed in glorious golden morning sunlight after a storm, with a faint rainbow arching over the distant city skyline, blooming pink lotus flowers, and sparkling calm water in the lower 28% reading zone. Warm celebratory storybook painting, no characters, no text.
  ```

