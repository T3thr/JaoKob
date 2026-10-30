# คลัง Prompt สำหรับเจนภาพตัวละครทั้งหมด (`01-CHARACTER-SPRITE-PROMPTS.md`)
## โครงการ JaoKob (เจ้ากบ) — สัญญาการออกแบบตัวละครตาม [ADR-P0-032](../../adr/ADR-P0-032-living-fantasy-canon-peuak-miracle-doll-and-vn-stage-blocking.md)

> [!IMPORTANT]
> **คำแนะนำสำหรับ `Senior AI / GPT-6 Astra`:**
> - ก่อนเจนภาพตัวละครกลุ่มกบ ให้เปิดดูไฟล์เรนเดอร์ 3D ต้นฉบับที่ [docs/proposals/3d-keepsake-spike/renders/poster.jpg](../../proposals/3d-keepsake-spike/renders/poster.jpg), [front.png](../../proposals/3d-keepsake-spike/renders/front.png), และ [childhood/poster.jpg](../../proposals/3d-keepsake-spike/renders/childhood/poster.jpg) เพื่อยึดรูปทรงหัวกลมมน ดวงตากลมใส ผิวสีเขียวพาสเทลอบอุ่น และทรงเสื้อยืดสีฟ้าคอกลมให้ตรงกับต้นฉบับ 100%
> - ทุกไฟล์ Sprite ตัวละครต้องเป็น **พื้นหลังโปร่งใส (`Transparent Background`)** ขนาด `1024×1024 px` (พร้อมสำเนาในโฟลเดอร์ย่อย `versions/v1/`)

---

## กลุ่มที่ 1: ครอบครัวกบแห่งบึงกก (`The Frog Family of Whispering Reed Pond`)

### 1.1 เจ้ากบ — วัยเด็ก (`char_jao_kob` — Childhood Phase, ต้น Act 1)
- **ไฟล์อ้างอิงต้นฉบับ:** `docs/proposals/3d-keepsake-spike/renders/childhood/poster.jpg` และ `front.png`
- **พาธส่งมอบไฟล์ (Output Paths):**
  - `assets/images/characters/jao-kob/childhood-neutral.webp` (ท่ามาตรฐาน ตาแป๋วใสซื่อ มือเปล่า ไม่ถือหัวใจ)
  - `assets/images/characters/jao-kob/childhood-curious.webp` (ท่าเอียงคอมองรอยเย็บชายเสื้อสีฟ้าด้วยความสงสัย)
- **รายละเอียดรูปลักษณ์บังคับ:**
  - ลูกกบสองขาตัวเล็กน่ารัก ผิวสีเขียวมะกอกพาสเทลอ่อนโยน แก้มกลม ดวงตากลมโตสีดำขลับมีประกายแสงใสซื่อ (ไม่มีเปลือกตาครึ่งตาแบบตอนโต)
  - สวม **เสื้อยืดผ้าฝ้ายสีฟ้าอ่อนคอกลม** ที่ดูหลวมนิด ๆ สำหรับตัวลูกกบ ที่ชายเสื้อด้านล่างมี **รอยเย็บด้ายสีขาวเป็นรูปดาวสามแฉกเล็ก ๆ**
  - **ข้อห้ามเด็ดขาด:** ห้ามถือหัวใจสีแดงในมือเด็ดขาด!
- **Prompt สำหรับเจนภาพ (`childhood-neutral.webp`):**
  ```text
  A charming 2D/3D hybrid storybook character sprite of a small cute bipedal baby frog ("Jao Kob" childhood form), matching the exact proportions of the reference 3D model: soft pastel olive-green skin, creamy pale-yellow belly, round chubby cheeks, large wide innocent glossy dark eyes with bright catchlights, gentle happy smile. Wearing a slightly oversized pastel sky-blue crew-neck cotton t-shirt with a tiny hand-stitched three-point white thread knot near the bottom hem. Standing/sitting in a relaxed 3/4 view facing right, empty hands resting naturally at sides (NO red heart in hands), warm painted storybook shading, isolated on a 100% transparent background, no text, no watermark.
  ```

---

### 1.2 เจ้ากบ — วัยหนุ่มตัวเอก (`char_jao_kob` — Adult 45 cm Protagonist, Act 1–5)
- **ไฟล์อ้างอิงต้นฉบับ:** `docs/proposals/3d-keepsake-spike/renders/poster.jpg`, `front.png`, `three-quarter.png`, และ `adult/empty-crochet.png`
- **พาธส่งมอบไฟล์ (Output Paths):**
  - `assets/images/characters/jao-kob/adult-neutral.webp` (ท่ามาตรฐาน สุขุม อบอุ่น มือเปล่า)
  - `assets/images/characters/jao-kob/adult-observant.webp` (ท่าใช้ความคิด มือข้างหนึ่งแตะตะเข็บด้ายขาวที่ชายเสื้อสีฟ้า)
  - `assets/images/characters/jao-kob/adult-determined.webp` (ท่ามุ่งมั่นพร้อมลุย คิ้วขมวดนิด ๆ สวมกระเป๋าสานกก 4 ช่องสะพายข้าง)
  - `assets/images/characters/jao-kob/adult-miracle-plush.webp` (เฉพาะฉากจบ `E-HOME`: ร่างตุ๊กตาถัก/ผ้ากำมะหยี่สีเขียวสวมเสื้อฟ้าในอ้อมกอดเปี๊ยก)
- **รายละเอียดรูปลักษณ์บังคับ:**
  - กบสองขาวัยหนุ่มสูงราว 45 ซม. ผิวสีเขียวพาสเทลอบอุ่น มี **เปลือกตาบนสีเขียวเข้มลงมาครึ่งตาเล็กน้อย** ให้ความรู้สึกสุขุม ช่างสังเกต และพึ่งพาได้ (ตรงตาม `renders/poster.jpg`)
  - สวม **เสื้อยืดผ้าฝ้ายสีฟ้าคอกลม (`#5DA9E9`)** เพียงตัวเดียวในเรื่อง ชายเสื้อมีฝีเข็มด้ายขาวสามปม และเมื่อออกเดินทางจะมี **กระเป๋าสานใบกก 4 ช่องใบเล็ก** สะพายเฉียงที่เอว
  - **ข้อห้ามเด็ดขาด:** ระหว่างเล่นเกม (`adult-neutral`, `adult-observant`, `adult-determined`) ห้ามถือหัวใจสีแดงเด็ดขาด!
- **Prompt สำหรับเจนภาพ (`adult-neutral.webp` & `adult-determined.webp`):**
  ```text
  A warm hand-crafted storybook character sprite of "Jao Kob" (adult 45cm bipedal frog protagonist), strictly following the 3D reference render: soft olive-green skin, calm upper eyelids giving a composed and observant expression, gentle smile, wearing his signature fitted sky-blue crew-neck cotton t-shirt with a tiny white 3-stitch star knot at the hem, and a small woven four-slot reed pouch strapped neatly across his hip. 3/4 view facing right, empty hands in a natural ready posture (strictly NO red heart prop), rich tactile painterly lighting, isolated on a 100% transparent background.
  ```

---

### 1.3 เจ้ากับ — พี่ชายคนโตสายลุย (`char_jao_kab` — Older Brother)
- **พาธส่งมอบไฟล์ (Output Paths):**
  - `assets/images/characters/jao-kab/neutral-proud.webp` (ท่ายืนอกผายไหล่ผึ่ง ยิ้มมั่นใจ)
  - `assets/images/characters/jao-kab/action-knuckle-tap.webp` (ท่าเคาะสนับข้อมือเปลือกไม้สองข้างเข้าหากัน `"ปึก-ปึก!"` พร้อมกระโดดลุย)
- **รายละเอียดรูปลักษณ์บังคับ (ไม่แย่งซีนเสื้อฟ้าเจ้ากบ):**
  - กบสองขาพี่ชายคนโต รูปร่างล่ำสันและไหล่กว้างกว่าเจ้ากบเล็กน้อย ผิวสีเขียวมะกอกเข้มกว่าเจ้ากบครึ่งเฉด มี **รอยแผลเป็นเล็ก ๆ ที่คิ้วซ้าย** (จากการปกป้องน้อง)
  - **ไม่สวมเสื้อยืด** (เพื่อรักษาเอกลักษณ์เสื้อสีฟ้าให้เจ้ากบคนเดียว) แต่คาด **สายคาดไหล่ใบกกถักเฉียงหน้าอก** และสวม **สนับข้อมือเปลือกไม้เนื้อแข็งพันเถาวัลย์** ทั้งสองข้าง
- **Prompt สำหรับเจนภาพ (`action-knuckle-tap.webp`):**
  ```text
  A warm storybook character sprite of "Jao Kab", the older brother bipedal frog in the same family art style as Jao Kob: slightly broader shoulders and sturdier build, deeper olive-green skin, confident protective grin, a tiny healed notch scar over his left eyebrow. Strictly NO shirt (bare chest with pale cream belly) so he never competes with Jao Kob's blue shirt; instead wearing a diagonal woven green-reed chest strap and sturdy carved tree-bark wrist guards on both forearms. Posed in a dynamic 3/4 view facing right, tapping his two bark-guarded wrists together before a powerful leap, isolated on a 100% transparent background.
  ```

---

### 1.4 เจ้ากิบ — น้องสาวคนเล็กสายประดิษฐ์ (`char_jao_kib` — Younger Sister)
- **พาธส่งมอบไฟล์ (Output Paths):**
  - `assets/images/characters/jao-kib/neutral-cheerful.webp` (ท่าเอียงคอทำตาปิ๊ง ๆ ยิ้มร่าเริง)
  - `assets/images/characters/jao-kib/tinker-seed-tube.webp` (ท่าถือกระบอกไม้ไผ่เมล็ดต้อยติ่งเรืองแสงและเลนส์หยดน้ำค้าง)
- **รายละเอียดรูปลักษณ์บังคับ (เพศหญิง / น้องสาวคนเล็ก):**
  - กบสองขาสาวตัวเล็กกว่าเจ้ากบเล็กน้อย ผิวสีเขียวมิ้นต์สดใส ตากลมโตมีขนตาเส้นเล็ก ๆ น่ารัก แก้มอมชมพูจาง ๆ
  - **ไม่สวมเสื้อยืด** แต่สวม **ปกคอใบบัวจิ๋วหยักโค้งรอบคอประดับดอกหญ้าสีเหลืองสดใส** และสะพาย **กระบอกไม้ไผ่จิ๋วใส่เมล็ดต้อยติ่งเรืองแสงคู่กับแว่นขยายหยดน้ำค้าง**
- **Prompt สำหรับเจนภาพ (`neutral-cheerful.webp`):**
  ```text
  A warm storybook character sprite of "Jao Kib", the cute younger sister bipedal frog in the same family art style as Jao Kob: petite slender build, bright mint-olive green skin, expressive large sparkling eyes with subtle cute eyelashes, rosy cheeks, playful head-tilt smile. Strictly NO shirt; wearing a scalloped miniature lotus-leaf collar around her neck pinned with a bright yellow wildflower, and carrying a tiny bamboo seed-launcher tube and a dewdrop magnifying lens on a vine strap. 3/4 view facing right, isolated on a 100% transparent background.
  ```

---

### 1.5 พ่อกบและแม่กบ (`char_father_frog` & `char_mother_frog`)
- **พาธส่งมอบไฟล์ (Output Paths):**
  - `assets/images/characters/parents/father-frog-calm.webp`
  - `assets/images/characters/parents/mother-frog-warm.webp`
- **รายละเอียดรูปลักษณ์บังคับ:**
  - **พ่อกบ:** กบสองขาวัยผู้ใหญ่ท่าทางสงบมั่นคง คาดเข็มขัดเถาวัลย์ถักที่เอวและถือไม้เท้ากิ่งไผ่เล็ก ๆ
  - **แม่กบ:** กบสองขาผู้มีแววตาอ่อนโยนอบอุ่น คลุมไหล่ด้วยผ้าคลุมใบบัวแห้งสีครีมอ่อนประดับดอกไม้แห้ง
- **Prompt สำหรับเจนภาพ (`parents`):**
  ```text
  Warm storybook character sprites of Father Frog (mature calm bipedal frog with a woven vine belt and small bamboo walking staff, wise gentle eyes) and Mother Frog (kind maternal bipedal frog wearing a soft dried-lotus-petal shawl over her shoulders with a warm loving smile), matching the exact art style of Jao Kob, 3/4 view, isolated on a 100% transparent background.
  ```

---

## กลุ่มที่ 2: เพื่อนร่วมทางผู้มีแผลใจ และคู่ปรับตลอดกาล (`Companions & Eternal Arch-Nemesis`)

### 2.1 พี่ก้าม — ปูเสฉวนนักรบเกราะกระป๋องลูกอม (`char_p_kam`)
- **พาธส่งมอบไฟล์ (Output Paths):**
  - `assets/images/characters/p-kam/neutral-guarded.webp` (ท่ายกก้ามซ้ายขึ้นตั้งการ์ด ท่าทางเก๋า ๆ ปากแข็ง)
  - `assets/images/characters/p-kam/allied-shield.webp` (ท่ากางก้ามเหล็กปกป้องเพื่อน แววตาอบอุ่นพึ่งพาได้)
- **รายละเอียดรูปลักษณ์บังคับ:**
  - ปูเสฉวนบกขนาดใกล้เคียงเจ้ากบ แบก **"กระป๋องลูกอมสังกะสีทรงกลมบุบ ๆ สีครีมอมฟ้าจาง ๆ ที่มีลายดอกไม้เก่า ๆ"** แทนเปลือกหอย (สะท้อนอดีตที่เคยเป็นสัตว์เลี้ยงถูกทิ้งแล้วต้องหาเกราะในท่อ)
  - ก้ามซ้ายมีขนาดใหญ่หนาเหมือนโล่เหล็กและมีรอยบากจากศึกหนัก ส่วนก้ามขวามีขนาดเล็กสำหรับหยิบจับฟันเฟือง
- **Prompt สำหรับเจนภาพ (`neutral-guarded.webp`):**
  ```text
  A warm storybook character sprite of "P'Kam", a battle-scarred terrestrial hermit crab companion: reddish-terracotta crab body with expressive gruff eyes, carrying a dented vintage pastel tin candy can with faded floral motifs as his makeshift shell instead of a sea shell. He has one oversized, battle-notched iron-like left pincer held up like a knight's shield, and a smaller dexterous right pincer holding a small brass gear. 3/4 view facing right, rich painterly texture, isolated on a 100% transparent background.
  ```

---

### 2.2 เจ้าฟิ้ว — กระรอกบินผ้าพันคอเหลืองผู้กลัวลมกรด (`char_jao_fiw`)
- **พาธส่งมอบไฟล์ (Output Paths):**
  - `assets/images/characters/jao-fiw/neutral-lively.webp` (ท่ายืนกอดอกพองหางพวง พูดจาเจื้อยแจ้วร่าเริง)
  - `assets/images/characters/jao-fiw/gliding-brave.webp` (ท่ากางพังผืดร่อนสองข้างออกสุดตัวท้าสายลม แววตากล้าหาญ)
- **รายละเอียดรูปลักษณ์บังคับ:**
  - กระรอกบินตัวเล็กปราดเปรียว ขนสีน้ำตาลทองอบอุ่น หางพวงฟูเหมือนร่มชูชีพ ดวงตากลมโตเป็นประกาย
  - พันคอด้วย **"เศษริบบิ้นผ้าสีเหลืองดอกทานตะวัน"** ที่พังผืดร่อนข้างซ้ายมีรอยเย็บ/รอยแผลเก่าเล็ก ๆ จากพายุครั้งก่อน
- **Prompt สำหรับเจนภาพ (`neutral-lively.webp`):**
  ```text
  A warm storybook character sprite of "Jao Fiw", a petite expressive gliding squirrel companion: soft cinnamon-brown fur, cream belly, huge sparkling eyes, a fluffy parachute-like tail, wearing a bright sunflower-yellow ribbon tied around her neck like an aviator scarf, with a tiny healed notch on her left gliding membrane. 3/4 view facing right, energetic and endearing posture, isolated on a 100% transparent background.
  ```

---

### 2.3 แมลงสาบแมน — คู่ปรับตลอดกาลจอมป่วน (`char_cockroach_man`)
- **พาธส่งมอบไฟล์ (Output Paths):**
  - `assets/images/characters/cockroach-man/shadow-cloak-boast.webp` (ท่ากางผ้าคลุมเงาดำพองลม หัวเราะโอ้อวด ติดกระดุมทองเหลืองที่อก)
  - `assets/images/characters/cockroach-man/shrunk-defeated.webp` (ท่าหดตัวเหลือเป็นก้อนเงาจิ๋วเท่าฝ่ามือหลังโดนแสงโคมไฟส่อง ตาหมุนติ้วแบบตัวร้ายแก๊กพ่ายแพ้)
- **กฎเหล็กด้านความปลอดภัยทางภาพ (Strict Anti-Phobia Visual Rule):**
  - **ห้ามวาดขาแมลงมีหนาม ห้ามวาดปีกแมลงสาบจริง หรือสรีระแมลงจริงโดยเด็ดขาด!**
  - ต้องออกแบบเป็น **"ภูตเงาผ้าคลุมดำจอมขี้โม้ (Theatrical Shadow-Cloak Phantom Gag Villain)"**: ลำตัวเป็นก้อนเงาหมอกสีดำม่วงสวมผ้าคลุมเศษถุงพลาสติกดำพองลม ติดเกราะไหล่ที่ทำจากฝาจีบน้ำอัดลมเก่า สวมหน้ากากเงาที่มีดวงตาสีเหลืองเรืองแสงแบบการ์ตูนและมี **"เส้นเงาโค้งสองเส้นเหมือนเสาอากาศ/หนวดเงา"** อยู่บนหัว ที่หน้าอกผ้าคลุม (ใน Act 2) มี **`กระดุมทองเหลืองสลัก ต.♡ป.`** ติดอวดอยู่
- **Prompt สำหรับเจนภาพ (`shadow-cloak-boast.webp`):**
  ```text
  A theatrical, comical storybook gag villain sprite named "Cockroach Man" (strictly NO realistic insect anatomy, NO insect legs, NO roach wings or carapace): a whimsical phantom silhouette formed from swirling purple-black shadow mist wearing a puffed-up cape made of a torn black plastic wrapper, soda bottle-cap shoulder pads, a dramatic shadow mask with glowing cartoon yellow eyes and two curly shadow-ribbon antennae on top, and a shiny stolen brass button pinned to his chest like a medal. Posed dramatically facing left (to confront the heroes on the left side of the screen), playful spooky-cute storybook style, isolated on a 100% transparent background.
  ```

---

## กลุ่มที่ 3: ตัวละครมนุษย์ (`Human Cast`)

### 3.1 เจ้าเตื๊อก — ชายหนุ่มผู้มอบภารกิจผู้พิทักษ์ (`char_jao_teuk`)
- **พาธส่งมอบไฟล์ (Output Paths):**
  - `assets/images/characters/jao-teuk/storm-kneeling-mission.webp` (ท่าคุกเข่าท่ามกลางสายฝน ยื่นพวงกุญแจนกหวีดทองเหลืองให้เจ้ากบด้วยแววตาอบอุ่นและฝากฝัง)
  - `assets/images/characters/jao-teuk/dawn-reunion-smile.webp` (ท่ายืนยิ้มอบอุ่นในแสงแดดเช้า พันผ้าพันแผลที่ข้อเท้า)
- **รายละเอียดรูปลักษณ์บังคับ:**
  - ชายหนุ่มชาวไทยวัยทำงานตอนต้น ใบหน้าใจดีอบอุ่นแต่เปียกปอนด้วยสายฝน สวมเสื้อแจ็คเก็ตกันฝนสีกรมท่าทับเสื้อลำลอง ข้างตัวมีร่มที่ก้านหักพับ และที่ข้อเท้าข้างหนึ่งมีร่องรอยบาดเจ็บจากการช่วยกั้นน้ำ ในมือกำลังยื่น **พวงกุญแจนกหวีดทองเหลืองสลัก `ต.♡ป.`** ออกมาด้านหน้า
- **Prompt สำหรับเจนภาพ (`storm-kneeling-mission.webp`):**
  ```text
  A warm cinematic storybook character sprite of "Jao Teuk", a kind young Thai man in his twenties with wet tousled dark hair and deeply caring, emotional eyes: wearing a rain-soaked navy windbreaker jacket over casual clothes, a bandage wrapped around one sprained ankle, a broken umbrella resting beside him. He is kneeling down to frog-eye level facing left, gently holding out a small shiny brass whistle keychain in his palm as he entrusts a sacred guardian mission. Warm rim lighting against raindrops, isolated on a 100% transparent background.
  ```

---

### 3.2 เด็กหญิงเปี๊ยก — นางเอกเจ้าของเสื้อสีฟ้า (`char_peuak`)
- **พาธส่งมอบไฟล์ (Output Paths):**
  - `assets/images/characters/peuak/bedside-frightened-blanket.webp` (ท่าคลุมโปงผ้าห่มในห้องมืด เห็นเพียงดวงตากลมโตที่หวาดกลัวความมืด)
  - `assets/images/characters/peuak/warm-sunlight-hug.webp` (ท่ายิ้มอบอุ่นเหมือนแสงแดดเช้า กอดตุ๊กตาเจ้ากบเสื้อฟ้าไว้แนบอกทั้งน้ำตาแห่งความสุข)
- **รายละเอียดรูปลักษณ์บังคับ:**
  - หญิงสาวชาวไทยที่มีใบหน้าอ่อนโยน น่ารัก และมีรอยยิ้มสว่างไสวอบอุ่นเหมือนแสงแดด สวมชุดนอนผ้าฝ้ายสีครีมอ่อนสะอาดตา
- **Prompt สำหรับเจนภาพ (`warm-sunlight-hug.webp`):**
  ```text
  A touching, warm storybook character sprite of "Peuak", a gentle young Thai woman with soft dark hair, teary eyes full of relief, and a radiant smile like morning sunlight: wearing cozy cream-colored cotton pajamas, gently cradling the sky-blue-shirted green frog plush doll ("Jao Kob") close to her heart in warm golden morning light. Facing left, soft painterly lighting, isolated on a 100% transparent background.
  ```

---

### 3.3 มนุษย์ริมทางในเมือง (`char_boy_ton` & `char_watchman_lung` — Act 3)
- **พาธส่งมอบไฟล์ (Output Paths):**
  - `assets/images/characters/city-humans/boy-ton-crying.webp` (เด็กชายต้นสวมเสื้อกันฝนสีเหลืองนั่งกอดเข่าร้องไห้ข้างตะแกรงท่อ)
  - `assets/images/characters/city-humans/watchman-lung-flare.webp` (คุณลุงยามสวมชุดกันฝนยืนถือพลุไฟสีแดงเตือนภัยท่ามกลางพายุ)
- **Prompt สำหรับเจนภาพ (`city-humans`):**
  ```text
  Warm storybook character sprites for Act 3 human encounters: (1) "Boy Ton", a small boy in a wet raincoat crouching by a street drain grate looking for his mother's medicine bottle with tearful eyes; (2) "Watchman Lung", an elderly night watchman shivering in a soaked poncho bravely holding up a glowing red safety flare in the pouring rain. Isolated on 100% transparent backgrounds.
  ```

