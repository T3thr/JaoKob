# คู่มือลำดับการทำงานและสัญญาการส่งมอบสื่อภาพสำหรับ `Senior AI / GPT-6 Astra`
## (Astra Visual Novel Asset Generation Workflow & Output Contract)

| ข้อมูลสัญญา | รายละเอียด |
|---|---|
| **ผู้รับผิดชอบหลัก** | **Senior AI / GPT-6 Astra** (Creative Visual Director, UI/UX Designer & 3D/2D Asset Specialist ตามทะเบียน [AGENT-REGISTRY.md](../../dialogue/AGENT-REGISTRY.md)) |
| **ผู้ควบคุมสถาปัตยกรรม** | **Theerapat (`T3thr` — PO)** & **Antigravity (Lead System Architect)** |
| **กฎหมายอ้างอิง** | [ADR-P0-032](../../adr/ADR-P0-032-living-fantasy-canon-peuak-miracle-doll-and-vn-stage-blocking.md), [ADR-P0-025](../../adr/ADR-P0-025-childhood-keepsake-default-stance-and-heart-emote-decoupling.md), [new-five-act-story-and-mechanics-proposal.md](../new-five-act-story-and-mechanics-proposal.md) |
| **คลังภาพอ้างอิง 3D ต้นฉบับของเจ้ากบ** | [docs/proposals/3d-keepsake-spike/renders/](../../proposals/3d-keepsake-spike/renders/) (ทั้งโฟลเดอร์ `childhood/` และ `adult/`) |

---

## 1. ภาพรวมภารกิจของ Astra (Mission Overview)

ภารกิจของคุณคือการสร้างชุดภาพต้นแบบ (Version 1 — `v1`) สำหรับโครงเรื่อง 5 องก์ใหม่ล่าสุดของเกม **JaoKob (เจ้ากบ)** โดยแบ่งออกเป็น 4 หมวดหมู่หลัก:
1. **ภาพตัวละครตัดพื้นหลัง (`Character Sprites`)** จำนวน 10 ชุดตัวละครหลัก (เก็บใน `assets/images/characters/<char-slug>/`)
2. **ภาพฉากหลังเวที Visual Novel (`Stage Backgrounds`)** จำนวน 15 ฉาก ครอบคลุม Act 1 ถึง Act 5 (เก็บใน `assets/images/backgrounds/act-01/` ถึง `act-05/`)
3. **ภาพคัตซีนเต็มจอสำหรับฉากพีคและฉากจบ (`Cinematic CGs`)** จำนวน 7 ภาพ (เก็บใน `assets/images/cg/act-01/` ถึง `act-05/`)
4. **ภาพไอคอนของสะสมในกระเป๋าสานกก 4 ช่อง (`Keepsake Icons v2`)** จำนวน 6 ชิ้น (เก็บใน `assets/images/keepsakes/v2/`)

---

## 2. ลำดับขั้นตอนการทำงานแบบไม่สะดุด (Step-by-Step Execution Pipeline)

เพื่อให้การทำงานไหลลื่นตั้งแต่ต้นจนจบโดยไม่ติดขัด ให้ Astra ดำเนินการตามลำดับ 6 ขั้นตอนนี้:

### ขั้นตอนที่ 1: ศึกษารูปทรงและสัดส่วนต้นฉบับของ "เจ้ากบ" จากโมเดล 3D
1. เปิดดูไฟล์ภาพเรนเดอร์ 3D ของเจ้ากบในโฟลเดอร์ [renders](../../proposals/3d-keepsake-spike/renders/) ได้แก่:
   - **วัยเด็ก (Childhood):** `docs/proposals/3d-keepsake-spike/renders/childhood/poster.jpg` และ `front.png` (ลูกกบสีเขียวพาสเทล ตากลมโตใสซื่อ สวมเสื้อยืดสีฟ้าอ่อนคอกลม **ไม่ถือหัวใจสีแดง**)
   - **วัยโต (Adult 45 cm):** `docs/proposals/3d-keepsake-spike/renders/poster.jpg`, `front.png`, และ `three-quarter.png` (กบสองขาสีเขียวอบอุ่น เปลือกตาบนผ่อนคลายดูสุขุม สวมเสื้อยืดผ้าฝ้ายสีฟ้าคอกลมตัวเก่ง **ไม่ถือหัวใจสีแดง**)
2. ใช้รูปลักษณ์และโทนสีของเจ้ากบจากโมเดล 3D นี้เป็น **สมอยึดงานศิลป์ (Art Style Anchor)** สำหรับการออกแบบครอบครัวกบ (`เจ้ากับ`, `เจ้ากิบ`, `พ่อกบ`, `แม่กบ`) เพื่อให้ตัวละครกบทุกตัวอยู่ในโลกเดียวกันอย่างกลมกลืน

### ขั้นตอนที่ 2: เจนภาพตัวละคร (`Character Sprites`) ตามไฟล์ `01-CHARACTER-SPRITE-PROMPTS.md`
- เปิดอ่าน [01-CHARACTER-SPRITE-PROMPTS.md](./01-CHARACTER-SPRITE-PROMPTS.md) และเจนภาพตัวละครตามลำดับความสำคัญ:
  1. **กลุ่มที่ 1 (ครอบครัวกบ):** `jao-kob` (วัยเด็ก & วัยโต), `jao-kab` (พี่ชายคนโต), `jao-kib` (น้องสาวคนเล็ก), `parents` (พ่อกบ & แม่กบ)
  2. **กลุ่มที่ 2 (เพื่อนร่วมทาง & คู่ปรับตลอดกาล):** `p-kam` (ปูเสฉวนเกราะกระป๋องลูกอม), `jao-fiw` (กระรอกบินผ้าพันคอเหลือง), `cockroach-man` (จอมวายร้ายผ้าคลุมเงาดำ)
  3. **กลุ่มที่ 3 (ตัวละครมนุษย์):** `jao-teuk` (เจ้าเตื๊อก), `peuak` (เด็กหญิงเปี๊ยก), `city-humans` (เด็กชายต้น & คุณลุงยาม)

### ขั้นตอนที่ 3: เจนภาพฉากหลังทั้ง 5 องก์ (`Backgrounds`) ตามไฟล์ `02-BACKGROUND-SCENE-PROMPTS.md`
- เปิดอ่าน [02-BACKGROUND-SCENE-PROMPTS.md](./02-BACKGROUND-SCENE-PROMPTS.md) และเจนฉากหลังเรียงจาก `act-01` ถึง `act-05`

### ขั้นตอนที่ 4: เจนภาพคัตซีนจุดพีค (`Cinematic CGs`) และไอเทม (`Keepsakes v2`) ตามไฟล์ `03-CINEMATIC-CG-AND-KEEPSAKE-PROMPTS.md`
- เปิดอ่าน [03-CINEMATIC-CG-AND-KEEPSAKE-PROMPTS.md](./03-CINEMATIC-CG-AND-KEEPSAKE-PROMPTS.md) และเจนภาพคัตซีน `CG-01` ถึง `CG-06` พร้อมไอคอนของสะสมทั้ง 6 ชิ้น

### ขั้นตอนที่ 5: การจัดเก็บไฟล์และการจัดการเวอร์ชัน (File Output & Versioning Standard)
- บันทึกไฟล์ที่พร้อมใช้งานไว้ที่พาธหลักที่ระบุในแต่ละ Prompt (เช่น `assets/images/characters/jao-kob/adult-neutral.webp` หรือ `.png`)
- พร้อมกันนั้น ให้สำเนาเก็บไว้ในโฟลเดอร์ย่อย `versions/v1/` ของแต่ละหมวดด้วย (เช่น `assets/images/characters/jao-kob/versions/v1/adult-neutral.png`) เพื่อรองรับการเปรียบเทียบเมื่อมีการปรับปรุง `v2` ในอนาคต

### ขั้นตอนที่ 6: อัปเดตทะเบียน `assets/images/asset-manifest-v1.json` และรายงานผลบนกระดานสนทนา
- เมื่อเจนภาพครบ (หรือเสร็จแต่ละชุด) ให้อัปเดตสถานะใน `assets/images/asset-manifest-v1.json` และบันทึกข้อความรายงานผลลงในกระดานที่เปิดอยู่ [Sprint 5 Board](../../dialogue/sprint-05/BOARD.md) ตามกติกาใน [dialogue/README.md](../../dialogue/README.md)

---

## 3. กฎเหล็กทางศิลปะและข้อห้ามเด็ดขาด (Strict Visual & Safety Mandates)

> [!CAUTION]
> **ข้อห้ามเด็ดขาด 5 ข้อที่ Astra ต้องปฏิบัติตาม 100% ในทุกภาพ:**
> 1. **ห้ามวาดเจ้ากบถือหัวใจสีแดงในภาพใช้งานระหว่างเล่นเกม (Act 1–5):** ตาม [ADR-P0-025](../../adr/ADR-P0-025-childhood-keepsake-default-stance-and-heart-emote-decoupling.md) เจ้ากบต้องมือเปล่าหรือทำท่าทางตามเนื้อเรื่องเท่านั้น (ท่าถือหัวใจสีแดงอนุญาตเฉพาะภาพพิเศษหลังจบเกม `E-HOME` ภาพเดียว)
> 2. **เจ้ากบเป็นตัวละครเดียวในเรื่องที่สวมเสื้อยืดสีฟ้าคอกลม:** ห้ามใส่เสื้อยืดให้พี่ชาย (`เจ้ากับ`), น้องสาว (`เจ้ากิบ`), หรือพ่อแม่กบเด็ดขาด (ให้ใช้เครื่องประดับธรรมชาติแทนตามที่ระบุใน Prompt) เพื่อไม่ให้แย่งจุดโฟกัสจากเสื้อสีฟ้าของเจ้ากบ
> 3. **ห้ามวาดสรีระแมลงสาบจริงในตัวละคร "แมลงสาบแมน" เด็ดขาด:** เนื่องจากนางเอกของเรื่อง (และคนรักของ PO) กลัวแมลงสาบมาก ตัวละคร `แมลงสาบแมน` ต้องแสดงผลเป็น **"ก้อนเงาดำสวมผ้าคลุมเศษถุงดำพองลม เกราะไหล่ฝาจีบน้ำอัดลม และหน้ากากเงาที่มีเขาเงาโค้งสองเส้นแบบตัวร้ายการ์ตูนแก๊ก"** ห้ามมีขาแมลงมีหนาม ปีกแมลงสาบสีน้ำตาลมันวาว หรือรายละเอียดแมลงจริงเด็ดขาด!
> 4. **กฎการจัดวางทิศทางตัวละคร (`Stage Blocking Orientation`):**
>    - ภาพ Sprite ตัวละครมาตรฐานให้หันหน้าเฉียง 3/4 ไปทางขวา (`facing: "right"`, สำหรับวางฝั่งซ้ายของจอ `slot: "left"`) หรือสร้างคู่ไฟล์ `-left` / `-right` เพื่อให้เวลาตัวละครคุยกันสามารถยืนคนละฝั่งจอและหันหน้าเข้าหากันได้ทันที
> 5. **ห้ามมีตัวอักษร ลายน้ำ หรือกรอบ UI ติดอยู่ในเนื้อภาพ (Zero Text/UI/Watermark in Pixels):** ภาพฉากหลังทุกภาพต้องเว้นพื้นที่ว่างโทนสีสงบบริเวณด้านล่าง 25–30% ของภาพเพื่อให้กล่องข้อความภาษาไทยของเอนจินเกมแสดงผลทับได้อย่างชัดเจน

---

## 4. มาตรฐานทางเทคนิคของไฟล์ภาพ (Technical Output Specifications)

| ประเภทสื่อ | อัตราส่วน | ความละเอียดแนะนำ (Master / Runtime) | พื้นหลัง | รูปแบบไฟล์ |
|---|---|---|---|---|
| **Character Sprites** | `1:1` หรือ `3:4` | `1024×1024 px` (Master) / `512×512 px` (Runtime) | **โปร่งใส (`Transparent Alpha`)** | `.webp` (Alpha 100) หรือ `.png` |
| **Stage Backgrounds** | `16:9` Widescreen | `1600×900 px` (หรือ `1920×1080 px`) | ทึบเต็มเฟรม (เว้นระยะอ่านหนังสือด้านล่าง 28%) | `.webp` (Quality 85+) หรือ `.png` |
| **Cinematic CGs** | `16:9` Widescreen | `1600×900 px` (หรือ `1920×1080 px`) | ทึบเต็มเฟรม เน้นองค์ประกอบภาพยนตร์ | `.webp` (Quality 88+) หรือ `.png` |
| **Keepsake Icons v2** | `1:1` Square | `512×512 px` | **โปร่งใส (`Transparent Alpha`)** | `.webp` / `.png` / `.svg` |
