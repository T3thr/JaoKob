# JaoKob keepsakes — adult plush and childhood crochet

Scope and authority: [CR-0004](../../rfc/CR-0004-adult-plush-model-spike.md).

Milestone 1 supplies the adult green velour doll with sleepy eyes, peach lips, a blue shirt and long limbs. Milestone 1B adds the childhood pill-shaped crochet doll, bright round eyes, blue sweater band and short three-lobed hands/feet. Adult rear surfaces are inferred; childhood proportions use front, side and back references. The childhood heart is an optional accessory, included in the default hugging pose. Emotion variants remain deferred.

Source photographs are local references in `docs/references/3d-doll-models/`; the model uses constructed geometry and authored materials rather than embedding those photos. This folder is not part of the production game build.

## Outputs

- `model/jaokob-adult-plush.blend`: editable named parts, materials and render setup.
- `model/jaokob-adult-plush.glb`: self-contained web model.
- `model/jaokob-childhood-crochet.blend` and `.glb`: childhood source and self-contained web model, with separate heart.
- `renders/`: actual model renders from inspection angles.
- `renders/childhood/`: childhood front, side, back, three-quarter and JPEG poster.
- `scripts/build_model.py`: deterministic Blender generator.
- `scripts/build_childhood_model.py`: childhood generator; reuses the adult script's studio helpers without rebuilding the adult asset.
- `textures/childhood-crochet-*.png`: two authored 128×128 repeating yarn tiles, packed in Blender and embedded in GLB.
- `preview/`: local inspection UI.
- `evidence/`: measured export and browser results.

## เปิดดูทันที

เปิด `model/jaokob-childhood-crochet.blend` หรือ `model/jaokob-adult-plush.blend` ใน Blender เพื่อแก้โมเดลที่สร้างแล้ว หรือใช้หน้าเว็บตามขั้นตอนด้านล่าง ไฟล์ส่งมอบทดสอบด้วย **Blender 5.2.2 LTS บน macOS ARM64**; ไม่ได้ทดสอบย้อนหลังกับ Blender 4.5

## วัยเด็ก — Milestone 1B

ใน workspace **Scripting** เปิดไฟล์ที่บันทึกไว้ `scripts/build_childhood_model.py` แล้วกด **Run Script / Alt+P**. สคริปต์สร้าง scene `JaoKob_Childhood_Spike` และบันทึก `.blend`/`.glb` อัตโนมัติ. ตั้ง `RENDER_PREVIEWS = True` เพื่อสร้างภาพทั้งสี่มุมกับโปสเตอร์ หรือกด F12 สำหรับภาพมุมปัจจุบัน. เก็บ `build_model.py` ไว้ข้างกันเพราะใช้ studio helpers ร่วมกัน.

ปรับสัดส่วนที่ตาราง `P`: `body_width`, `body_depth`, `body_height`, `eye_spacing`, `eye_height`, `eye_radius`, `lip_width`, `heart_width`, `heart_height`, `foot_forward`; `stitch_size` และ `normal_strength` ปรับรายละเอียดผิว. ความถี่บนตัวหลักกำหนดใน UV repeats ของ `make_body`. ตัวกบเป็น mesh ทรงแคปซูลต่อเนื่องโดยไม่มีคอ; ชิ้นหน้า เสื้อ และแขนขาแยกแก้ได้.

จาก root repository:

```sh
/Applications/Blender.app/Contents/MacOS/Blender --background --factory-startup \
  --python docs/proposals/3d-keepsake-spike/scripts/build_childhood_model.py -- --render --samples 48
```

เอา `--render` ออกเพื่อ export อย่างเดียว; `--output /absolute/directory` ส่งผลลัพธ์ไปโฟลเดอร์อื่น. การรันซ้ำแทน scene/output ของ generator จึงต้อง **Save As** ฉบับที่เกลาด้วยมือก่อนรันใหม่.

| ชิ้นส่วน | Blender | GLB node / mesh |
|---|---|---|
| ตัวกบ | `CHILDHOOD • editable body` มี 39 ชิ้น | `JaoKob_Childhood_Body` / `JaoKob_Childhood_Body_Mesh` |
| หัวใจ | `ACCESSORY • RedHeart • optional`, object `RedHeart_EditableMesh` | `Accessory_RedHeart` / `Accessory_RedHeart_Mesh` |
| ฉากถ่ายภาพ | `STUDIO • excluded from GLB` | ไม่ export |

ซ่อนหัวใจใน Blender ผ่าน Outliner ของ collection `ACCESSORY` (สวิตช์ viewport หรือกล้องสำหรับ render); ตัวกบไม่หายตาม. GLB ใช้ชื่อ node และ extras `asset_part: optional-heart`, `default_visible: true` เพื่อระบุหัวใจ ไม่ผูกกับเลข index ที่ exporter อาจเปลี่ยน. หน้าเว็บรอบนี้ยังไม่มีปุ่มถอดหัวใจหรือ emotion variant. Export generator จะใส่หัวใจเสมอตาม default pose ที่อนุมัติ.

สำหรับ export ฉบับเกลาด้วยมือ: ทำสำเนาตัวกบกับหัวใจไป scene ชั่วคราว รวมเฉพาะตัวกบให้ชื่อ `JaoKob_Childhood_Body` และคงหัวใจเป็น `Accessory_RedHeart`; แปลง source units เป็นเมตรด้วย scale 0.1 แล้ว Apply. Triangulate สำเนาก่อน export glTF Binary โดยเปิด Selected Objects, Active Scene, UVs, Normals, Tangents, Vertex Colors และ Custom Properties; ปิด cameras/lights/animations. เก็บ Image Texture → Normal Map → Principled พร้อมสีที่คูณ vertex colors. ตรวจ GLB ใหม่ด้วย `npm run validate` ทุกครั้ง.

ลายถักเป็น texture ที่เขียนจากสมการ ไม่ใช้ภาพถ่ายเป็น texture และไม่เพิ่มเส้นใย geometry. เป็นรายละเอียดผิวเบื้องต้น; fuzz, retopology และความเหมือนขั้นสุดท้ายยังต้องเกลาและตรวจรับ.

## วัยโต — รันสคริปต์ใน Blender

1. เปิด Blender แล้วเลือก workspace **Scripting**.
2. ใน Text Editor เลือก **Open** และเปิด `scripts/build_model.py` จากโฟลเดอร์นี้ อย่าวางเฉพาะข้อความลงใน Text ที่ยังไม่มีที่อยู่ไฟล์ เพราะสคริปต์ใช้ตำแหน่งไฟล์เพื่อกำหนด output.
3. ปรับตาราง `P` ด้านบนเพื่อทดลองสัดส่วน: `head_radius`, `eye_spacing`, `lip_width`, `shirt_width`, `arm_spread`, `foot_forward`, `seated_drop`. หน่วยภายใน source 1 unit = 10 cm.
4. กด **Run Script** หรือ `Alt+P` ขณะเมาส์อยู่ใน Text Editor. สคริปต์สร้าง scene `JaoKob_Adult_Spike`, บันทึก `.blend` แยกและ export `.glb` อัตโนมัติลง `model/`.
5. กลับ workspace Layout เลือก scene ที่สร้างไว้ ถ้าไม่อยู่ในมุมกล้องให้ใช้ **View → Cameras → Active Camera**. ใน Outliner ชิ้นส่วนที่แก้ได้อยู่ใน `DOLL • export these parts`; แสง กล้อง และพื้นอยู่ใน `STUDIO • excluded from GLB`.
6. กด **Render → Render Image** (`F12`) เพื่อดูภาพมุมสามส่วนสี่ หรือเปลี่ยน `RENDER_PREVIEWS = True` ก่อนรันสคริปต์เพื่อเรนเดอร์หน้า–ข้าง–หลัง–สามส่วนสี่ทั้งหมดไปที่ `renders/` พร้อม `poster.jpg`.

การรันซ้ำจะแทนที่เฉพาะ scene ของ generator และ output ชื่อเดิม จึงควร **Save As** เป็นชื่อใหม่ก่อนเกลางานด้วยมือเพื่อเก็บฉบับที่ปรับแล้วไว้. Scene อื่นไม่ถูกลบ. โมเดลฐานประกอบด้วยชิ้นที่ทับซ้อนอย่างตั้งใจ ไม่ใช่ welded/retopologized character สำหรับ animation.

## รันผ่าน Terminal และ export GLB

จาก root ของ repository:

```sh
/Applications/Blender.app/Contents/MacOS/Blender --background --factory-startup \
  --python docs/proposals/3d-keepsake-spike/scripts/build_model.py -- --render --samples 32
```

เอา `--render` ออกถ้าต้องการสร้าง `.blend` และ `.glb` อย่างเดียว. ใช้ `--output /absolute/output/directory` เพื่อเปลี่ยนที่เก็บผล. ไม่มีการติดตั้ง Python package เพิ่มใน Blender.

สคริปต์ export โดยทำสำเนาชิ้นส่วนตุ๊กตาใน scene ชั่วคราว แปลงเป็นหน่วยเมตร รวมเป็น mesh เดียวที่มี 2 materials และส่งเป็น **glTF Binary (.glb), Y up, ไม่มี animation/camera/light**. ชิ้นส่วนต้นฉบับยังแยกอยู่ใน `.blend`. ไฟล์ GLB สูงประมาณ 25 cm และไม่มีภาพอ้างอิงฝังอยู่.

หาก export ฉบับที่ปรับมือ: สร้าง scene สำเนาที่มีเฉพาะ collection `DOLL`, รวมสำเนา mesh (`Ctrl+J`), ปรับขนาดสำเนาทั้งหมดเหลือ `0.1` และ Apply Scale เพื่อให้ source units เป็นเมตร จากนั้น **File → Export → glTF 2.0 → glTF Binary (.glb)** เลือก **Selected Objects** และ **Active Scene** ปิด animation, cameras และ lights. เก็บ vertex colors และ materials; ฉบับฐานยังไม่ใช้ UV textures. ตรวจไฟล์ใหม่ด้วย validator เสมอ.

## เปิดหมุนบนเว็บ

ต้องใช้ HTTP server; ไม่เปิด `index.html` ผ่าน `file://`.

```sh
cd docs/proposals/3d-keepsake-spike
npm ci --ignore-scripts --no-audit --no-fund
npm run preview
```

เปิด <http://127.0.0.1:4174/preview/> เลือก **วัยเด็ก (ไหมพรม)** หรือ **วัยโต (กำมะหยี่)** แล้วกด **เปิดดูแบบ 3 มิติ**. ค่าเริ่มต้นเป็นวัยเด็ก. ลากหมุน เลื่อนล้อเมาส์/จีบนิ้วเพื่อซูม หรือใช้ปุ่มที่รองรับคีย์บอร์ด กด Escape เพื่อกลับภาพหรือยกเลิกระหว่างโหลด. Server รับเฉพาะ loopback และเสิร์ฟโฟลเดอร์ Spike; ไม่เสิร์ฟภาพอ้างอิงภายนอกโฟลเดอร์นี้.

ก่อนเปิด 3D ปุ่มเลือกวัยเปลี่ยนเฉพาะโปสเตอร์และคำบรรยาย. เมื่อเปิดแล้ว ปุ่มเลือกวัยโหลด GLB ตัวที่เลือก พร้อม reset กล้องและคง focus บนปุ่มเลือกวัย. ขณะโหลดสามารถเลือกอีกวัยได้; ผล load/error จากตัวเก่าถูกละทิ้ง. โหลดล้มเหลวแสดงโปสเตอร์ของตัวนั้นและให้ลองใหม่. Texture ที่ฝังใน GLB ใช้ blob URL จาก origin เดียวกัน ไม่มี request ไปบริการภาพภายนอก.

โค้ดพร้อมแก้ได้อยู่ใน [HTML](preview/index.html), [JS](preview/viewer.js), [CSS](preview/style.css) และ [ข้อความไทย](preview/th.js). จุดสำคัญใน JS คือ `import('../node_modules/@google/model-viewer/dist/model-viewer.min.js')` อยู่ใน handler ของปุ่ม จากนั้นจึงสร้าง element และกำหนด `src` ของ GLB. ไม่มี library script หรือ modulepreload ใน HTML ก่อนเปิดดู.

`@google/model-viewer` 4.4.0 และ validator ถูก pin ใน package lock เฉพาะ Spike. ไม่ได้เพิ่ม npm runtime dependency ที่ root เกมหรือเปลี่ยน `src/`. ไม่ใช้ CDN, decoder, AR หรือ auto-rotate ในหน้านี้. model-viewer ใช้ cache ภายใน; การนำ element ออกไม่ได้รับรองว่า GPU memory ถูกคืนทันที การวัด memory บนอุปกรณ์จริงยังไม่ได้ทำ.

## ผลที่วัดแล้ว — วัยโต (Milestone 1)

| รายการ | ผล |
|---|---|
| GLB | 546,020 bytes, ไม่บีบอัด geometry และไม่มี external URI |
| Geometry | 22,508 triangles; 1 node, 2 material primitives |
| Bounds | กว้างประมาณ 15.4 cm, สูง 25.15 cm, ลึก 16.68 cm; เป็นสัดส่วนต้นแบบ ไม่ใช่การวัดตุ๊กตาจริง |
| Poster | JPEG 45,296 bytes |
| Source | 46 ชิ้นแยกแก้ได้; material ใช้ vertex colors กับ PBR roughness/sheen |
| glTF Validator | 0 errors, 0 warnings, 0 infos |
| Browser | Chromium: lazy-load, mouse orbit/wheel, keyboard/focus, tilt/zoom/reset, reopen, retry |
| Responsive/touch | 390×844 และ 320×568; จำลอง touch orbit/pinch, reduced motion, ปุ่ม ≥44px |
| Network | ไม่มี third-party request และไม่มี GLB/library request ก่อนกดเปิด |
| Game regression | 691/691 unit tests ผ่าน; ไม่มีการแก้ game runtime |

GLB budget ไม่รวม library (~1.07 MB raw), poster และหน้า preview. ไม่ใช่การรับรอง initial load หรือ FPS บนมือถือ. ฐานนี้ใช้ 22.5k triangles เพื่อคงส่วนโค้งของใบหน้า ภายใต้เพดานทดลอง 25k; texture รายละเอียดผ้ายังไม่เพิ่ม.

ตรวจซ้ำจากโฟลเดอร์ Spike:

```sh
npm run validate
# เมื่อมี Playwright อยู่แล้ว กำหนด module path แล้วรัน:
JKB_PLAYWRIGHT_PATH=/absolute/path/to/playwright/index.mjs node scripts/verify_preview.mjs
```

หลักฐาน: [model metrics](evidence/model-metrics.json), [validator](evidence/glb-validation.json), [browser checks](evidence/preview-verification.json), [desktop](evidence/preview-desktop.png), [mobile](evidence/preview-mobile.png), [artifact hashes](evidence/artifact-manifest.json).

## ผลที่วัดแล้ว — วัยเด็ก (Milestone 1B)

| รายการ | ผล |
|---|---|
| GLB รวม textures | **598,144 bytes** (~598 KB), อยู่ในเป้าหมาย 400–600 KB และเพดาน 2 MB |
| Geometry | **13,400 triangles** จากเพดาน 25,000; 2 nodes / 2 meshes / 2 materials / 3 primitives |
| Source | 39 ชิ้นตัวกบ + 1 หัวใจ; เปิด `.blend` และตรวจชื่อ/collection/การ pack texture แล้ว |
| ขนาดโดยประมาณ | กว้าง 19.93 cm, สูง 22.75 cm, ลึก 17.19 cm รวมแขนขา; ขนาดสมมติสำหรับ Spike |
| ผิว | normal + grayscale color 128×128 อย่างละ 1 tile; ใช้ vertex colors, ไม่มี external URI |
| Poster | JPEG **70,716 bytes**; ภาพตรวจงาน 4 มุมขนาด 1000×1000 |
| Khronos validator | **0 errors, 0 warnings**; 2 informational notices ว่า UV/tangent ของวัสดุดวงตาไม่ได้ใช้ |
| Browser | Chromium: เลือกสองวัย, lazy-load, pointer/keyboard/touch, focus, camera/FOV reset, retry แยกแต่ละโมเดล |
| Async cases | เปลี่ยนวัยระหว่างโหลด, callback เก่าหลังเปลี่ยนวัย, สลับเร็ว, Escape ระหว่าง import และเปิดใหม่ ผ่าน |
| Regression | **691 passed, 0 failed, 0 skipped**; `src/` ไม่เปลี่ยนและ adult model/render/generator hashes คงเดิม |

ตรวจทั้งสอง GLB ด้วย `npm run validate`; สคริปต์จะ fail เมื่อมี warning, เกินเพดาน bytes/triangles หรือหัวใจไม่ได้แยก node. ตรวจ source วัยเด็กจาก root repository ได้ด้วย:

```sh
/Applications/Blender.app/Contents/MacOS/Blender --background \
  docs/proposals/3d-keepsake-spike/model/jaokob-childhood-crochet.blend \
  --python docs/proposals/3d-keepsake-spike/scripts/verify_childhood_source.py
```

หลักฐานวัยเด็ก: [model metrics](evidence/childhood-model-metrics.json), [validator](evidence/childhood-glb-validation.json), [Blender source](evidence/childhood-source-verification.json), [provenance](evidence/childhood-provenance.json), [browser](evidence/preview-verification.json), [desktop](evidence/childhood-preview-desktop.png), [mobile](evidence/childhood-preview-mobile.png), [unit results](evidence/childhood-unit-summary.txt), [change record](../../changelog/2026-10/2026-10-14-1244-childhood-crochet-model-spike.md).

## ข้อจำกัดและงานต่อ

ทั้งสองรุ่นเป็น **base mesh**. วัยโตยังไม่มีผิวละเอียดและด้านหลังเป็นการประมาณ; วัยเด็กมีลายถักขนาดเล็กแล้ว แต่ยังไม่มีเส้นขนจริง รอยต่อและการบิดของ UV บริเวณยอดหัว/แขนขาอาจเห็นเมื่อซูมใกล้. สัดส่วนประมาณจากภาพ ไม่ใช่การสแกนหรือวัดตุ๊กตาจริง. ความเหมือนขั้นสุดท้าย, Safari/VoiceOver, iPhone/Android จริง, FPS/GPU memory และการเชื่อม END-HOME ยังไม่ได้ตรวจรับ. ไม่เปลี่ยน save/schema; rollback เฉพาะ Milestone 1B คืนหน้า preview วัยโตเดิม หรือ revert Spike ทั้งชุด. วัยเด็กไม่ต้องถือหัวใจตลอดเวลา; emotion variants ยังพักไว้.
