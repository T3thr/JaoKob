# JaoKob keepsakes — two dolls, independent stance/material variants

Scope and authority: [ADR-P0-025](../../adr/ADR-P0-025-childhood-keepsake-default-stance-and-heart-emote-decoupling.md) D1/D2/D4, superseding the default stance/material of [CR-0004](../../rfc/CR-0004-adult-plush-model-spike.md) / ADR-P0-017. The PO explicitly reopened this archived spike for this asset correction; no production integration is implied.

**Current childhood default: empty-handed seated stance + adult-tone velour.** The arms rest beside the legs. Heart-holding is a separate optional stance, and crochet is an independent alternate material. Both axes are stored in one GLB and work in all four combinations. The retained `jaokob-childhood-crochet` filename is for path compatibility, not the default surface. Other facial emotes remain deferred. **Adult Milestone 1D now has the same independent heart/Crochet options**, under the PO request recorded in CR-0004, plus closed upper-eyelid hoods covering the formerly exposed upper sclera. Both dolls default to empty hands / Velour; the preview remembers each doll’s choices separately for the current page session.

Source photographs are local references in `docs/references/3d-doll-models/`; the model uses constructed geometry and authored materials rather than embedding those photos. This folder is not part of the production game build.

## Outputs

- `model/jaokob-adult-plush.blend`: editable named parts, materials and render setup.
- `model/jaokob-adult-plush.glb`: self-contained web model.
- `model/jaokob-childhood-crochet.blend` and `.glb`: childhood source and self-contained web model, with separate heart.
- `renders/`: actual model renders from inspection angles.
- `renders/childhood/`: childhood front, side, back, three-quarter and JPEG poster.
- `scripts/build_model.py`: adult Blender generator; stable triangle order with measured tiny Blender normal variation (see rebuild evidence).
- `scripts/keepsake_variants.py`: shared GLB material/stance packaging; keep beside both builders.
- `scripts/adult_variants.py`: helper also embedded as `Adult_Variants.py` in the adult `.blend`.
- `renders/adult/`: three alternate renders/posters and top/high eyelid close-ups.
- `scripts/build_childhood_model.py`: childhood generator; reuses the adult script's studio helpers without rebuilding the adult asset.
- `textures/childhood-crochet-*.png`: two authored 128×128 repeating yarn tiles, packed in Blender and embedded in GLB.
- `preview/`: local inspection UI.
- `evidence/`: measured export and browser results.

## เปิดดูทันที

เปิด `model/jaokob-childhood-crochet.blend` หรือ `model/jaokob-adult-plush.blend` ใน Blender เพื่อแก้โมเดลที่สร้างแล้ว หรือใช้หน้าเว็บตามขั้นตอนด้านล่าง ไฟล์ส่งมอบทดสอบด้วย **Blender 5.2.2 LTS บน macOS ARM64**; ไม่ได้ทดสอบย้อนหลังกับ Blender 4.5

## วัยเด็ก — Milestone 1C / ADR-P0-025

ใน workspace **Scripting** เปิดไฟล์ที่บันทึกไว้ `scripts/build_childhood_model.py` แล้วกด **Run Script / Alt+P**. สคริปต์สร้าง scene `JaoKob_Childhood_Spike` และบันทึก `.blend`/`.glb` อัตโนมัติ. ตั้ง `RENDER_PREVIEWS = True` เพื่อสร้างภาพทั้งสี่มุมกับโปสเตอร์ หรือกด F12 สำหรับภาพมุมปัจจุบัน. เก็บ `build_model.py` และ `keepsake_variants.py` ไว้ข้างกันเพราะใช้ studio helpers และ GLB packaging ร่วมกัน.

ปรับสัดส่วนที่ตาราง `P`: `body_width`, `body_depth`, `body_height`, `eye_spacing`, `eye_height`, `eye_radius`, `lip_width`, `heart_width`, `heart_height`, `foot_forward`; `stitch_size` และ `normal_strength` ปรับรายละเอียดผิว. ความถี่บนตัวหลักกำหนดใน UV repeats ของ `make_body`. ตัวกบเป็น mesh ทรงแคปซูลต่อเนื่องโดยไม่มีคอ; ชิ้นหน้า เสื้อ และแขนขาแยกแก้ได้.

จาก root repository:

```sh
/Applications/Blender.app/Contents/MacOS/Blender --background --factory-startup \
  --python docs/proposals/3d-keepsake-spike/scripts/build_childhood_model.py -- --render --samples 48
```

เอา `--render` ออกเพื่อ export อย่างเดียว; `--output /absolute/directory` ส่งผลลัพธ์ไปโฟลเดอร์อื่น. การรันซ้ำแทน scene/output ของ generator จึงต้อง **Save As** ฉบับที่เกลาด้วยมือก่อนรันใหม่.

| ชิ้นส่วน | Blender | GLB node |
|---|---|---|
| ลำตัว/หน้า/เสื้อ/ขา | `CHILDHOOD • editable body` 29 ชิ้น | `JaoKob_Childhood_Body` |
| แขนท่าพัก | `STANCE • EmptyHands` 10 ชิ้น เปิดเริ่มต้น | `Stance_EmptyHands` |
| แขนท่ากอด | `STANCE • HeartEmote` 10 ชิ้น ปิดเริ่มต้น | `Stance_HeartEmote` |
| หัวใจ | `ACCESSORY • RedHeart • optional`, `RedHeart_EditableMesh` ปิดเริ่มต้น | `Accessory_RedHeart` |
| ฉากถ่ายภาพ | `STUDIO • excluded from GLB` | ไม่ export |

**สลับใน Blender:** เปิด Text Editor เลือกข้อความที่ฝังไว้ `Childhood_Variants.py`; ตั้ง `STANCE = "empty"` หรือ `"heart"` และ `SURFACE = "Velour"` หรือ `"Crochet"` แล้ว Alt+P. สำเนาไฟล์ helper อยู่ใน `scripts/childhood_variants.py`. เก็บวัสดุ Crochet ด้วย fake user และ pack ภาพเดิมทั้งสองใบ จึงยังอยู่เมื่อบันทึก/เปิด `.blend` ใหม่. การสลับเปลี่ยนทั้งแขนและหัวใจพร้อมกัน ไม่ใช่เพียงซ่อนวัตถุจากท่ากอดเดิม.

**GLB contract:** ค่าเริ่มต้นของ `Stance_HeartEmote` และ `Accessory_RedHeart` คือ scale `[0,0,0]`, `default_visible: false` บนหัวใจ; แขนมือเปล่ามองเห็นได้โดยไม่ต้องรัน animation. Animation `HeartEmote` เป็นตัวเลือกท่าแบบ STEP: เวลา 0 = มือเปล่า, เวลา 1 = กอดหัวใจ (มี key คงท่าที่เวลา 2 เพื่อไม่ชน loop endpoint). ไม่ใช่ skeletal rig หรือ animation การเอื้อมแขน. Preview pause เสมอ ไม่มี autoplay หรือ movement เมื่อเลือกท่า.

วัสดุใช้มาตรฐาน [KHR_materials_variants](https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_materials_variants): `Velour` / `Crochet`; default material ของทุกชิ้นผ้าเป็น Velour แม้ viewer ไม่รองรับ variants. หน้าเว็บใช้ public `variantName`, `animationName`, `currentTime`, `pause()` ของ [model-viewer](https://modelviewer.dev/docs/index.html). การ inspect private scene ใน test ใช้ยืนยัน scale/material ที่เรนเดอร์จริงเท่านั้น ไม่อยู่ใน runtime preview.

**Export:** ใช้ generator เพื่อให้ได้การประกอบครบทั้ง geometry, material mappings และ stance clip. `export()` ทำสำเนาทั้ง 4 กลุ่มเป็นเมตร/triangulated แล้ว `add_glb_variants()` เติมมาตรฐานข้างต้น. การกด Blender Export GLB ทั่วไปเพียงครั้งเดียวจาก scene ที่ซ่อน variant ไม่สร้าง contract นี้ครบ จึงไม่ใช้แทน pipeline. ถ้าปรับ geometry ด้วยมือ ให้ปรับ pipeline export ให้ใช้ source ที่แก้แล้วก่อนตรวจ validator; ห้ามรัน generator ทับงาน manual โดยไม่ Save As.

Velour ใช้สีเขียว sRGB `(0.38, 0.64, 0.13)`, roughness `.87`, sheen `.08` เช่นเดียวกับวัยโต เป็น PBR approximation ยังไม่มีเส้นขนจริง. Crochet คงภาพ color/normal 128×128 เดิมโดยไม่แก้ bytes; vertex colors ใช้ palette ปัจจุบัน. มีทั้งภาพ default สี่มุมและภาพเปรียบเทียบ `empty-crochet`, `heart-velour`, `heart-crochet` พร้อมโปสเตอร์แยก.

## วัยโต — Milestone 1D / รันสคริปต์ใน Blender

1. เปิด Blender แล้วเลือก workspace **Scripting**.
2. ใน Text Editor เลือก **Open** และเปิด `scripts/build_model.py` จากโฟลเดอร์นี้ อย่าวางเฉพาะข้อความลงใน Text ที่ยังไม่มีที่อยู่ไฟล์ เพราะสคริปต์ใช้ตำแหน่งไฟล์เพื่อกำหนด output.
3. ปรับตาราง `P` ด้านบนเพื่อทดลองสัดส่วน: `head_radius`, `eye_spacing`, `lip_width`, `shirt_width`, `arm_spread`, `foot_forward`, `seated_drop`. หน่วยภายใน source 1 unit = 10 cm.
4. กด **Run Script** หรือ `Alt+P` ขณะเมาส์อยู่ใน Text Editor. สคริปต์สร้าง scene `JaoKob_Adult_Spike`, บันทึก `.blend` แยกและ export `.glb` อัตโนมัติลง `model/`.
5. กลับ workspace Layout เลือก scene ที่สร้างไว้ ถ้าไม่อยู่ในมุมกล้องให้ใช้ **View → Cameras → Active Camera**. ใน Outliner ชิ้นส่วนที่แก้ได้อยู่ใน `DOLL • export these parts`; แสง กล้อง และพื้นอยู่ใน `STUDIO • excluded from GLB`.
6. กด **Render → Render Image** (`F12`) เพื่อดูภาพมุมสามส่วนสี่ หรือเปลี่ยน `RENDER_PREVIEWS = True` ก่อนรันสคริปต์เพื่อเรนเดอร์หน้า–ข้าง–หลัง–สามส่วนสี่ทั้งหมดไปที่ `renders/` พร้อม `poster.jpg`.

การรันซ้ำจะแทนที่เฉพาะ scene ของ generator และ output ชื่อเดิม จึงควร **Save As** เป็นชื่อใหม่ก่อนเกลางานด้วยมือเพื่อเก็บฉบับที่ปรับแล้วไว้. Scene อื่นไม่ถูกลบ. โมเดลฐานประกอบด้วยชิ้นที่ทับซ้อนอย่างตั้งใจ ไม่ใช่ retopologized character สำหรับ animation.

วัยโตมี 38 ส่วนหลักใน `DOLL`, แขนมือเปล่า 8 ชิ้นใน `STANCE • EmptyHands`, แขนกอด 8 ชิ้นใน `STANCE • HeartEmote` และหัวใจ 1 ชิ้นใน `ACCESSORY • RedHeart • optional`. เปิด Text ที่ฝังไว้ **`Adult_Variants.py`**, ตั้ง `STANCE = "empty"` / `"heart"` และ `SURFACE = "Velour"` / `"Crochet"` แล้ว Alt+P เพื่อสลับใน Blender. Default ที่บันทึกคือมือเปล่า–Velour; Crochet มี fake user และ pack ภาพทั้งสองไว้.

เปลือกตา `L/R upper eyelid hood` เป็นผิวโค้งปิดที่มีความหนา คลุมด้านบนของตาขาวจริง แทนเส้นขอบตาเดิม. ช่องตาด้านหน้ายังเปิดเพื่อรักษาหน้าตาปรือ; ไม่ได้เปลี่ยนตาขาวเป็นสีเขียวหรือซ่อนตาทั้งดวง. ภาพก่อนแก้อยู่ `evidence/adult-eyelid-before-*`; ภาพหลังอยู่ `renders/adult/eyelid-*` และ `evidence/adult-eyelid-*-web.png`.

## รันผ่าน Terminal และ export GLB

จาก root ของ repository:

```sh
/Applications/Blender.app/Contents/MacOS/Blender --background --factory-startup \
  --python docs/proposals/3d-keepsake-spike/scripts/build_model.py -- --render --samples 32
```

เอา `--render` ออกถ้าต้องการสร้าง `.blend` และ `.glb` อย่างเดียว. ใช้ `--output /absolute/output/directory` เพื่อเปลี่ยนที่เก็บผล. ไม่มีการติดตั้ง Python package เพิ่มใน Blender.

สคริปต์ export ทำสำเนา 4 collection เป็นเมตร แยก node `JaoKob_Adult_Body`, `Stance_EmptyHands`, `Stance_HeartEmote`, `Accessory_RedHeart`; ใช้ UV/tangents และ 3 materials (Velour, Crochet, eye applique). `keepsake_variants.py` เพิ่ม `KHR_materials_variants` และ STEP clip `HeartEmote` ตาม contract เดียวกับวัยเด็ก. ไม่มี camera/light/reference photo ใน GLB. ตัว source ยังแยกแก้ได้ 55 ชิ้น.

ใช้ pipeline นี้แทนการกด export เฉพาะ visible scene เพราะต้องเก็บท่าที่ซ่อนอยู่และ material mappings ด้วย. ถ้าเกลาด้วยมือ ให้ Save As และปรับ export ให้ใช้ source ที่แก้แล้วก่อนตรวจ validator; อย่ารัน generator ทับงาน manual. เก็บ `scripts/keepsake_variants.py`, `scripts/adult_variants.py` และ `textures/childhood-crochet-*.png` ไว้ในโครงสร้างเดิม.

## เปิดหมุนบนเว็บ

ต้องใช้ HTTP server; ไม่เปิด `index.html` ผ่าน `file://`.

```sh
cd docs/proposals/3d-keepsake-spike
npm ci --ignore-scripts --no-audit --no-fund
npm run preview
```

เปิด <http://127.0.0.1:4174/preview/> เลือก **วัยเด็ก** หรือ **วัยโต** แล้วกด **เปิดดูแบบ 3 มิติ**. ค่าเริ่มต้นเป็นวัยเด็กมือเปล่า–กำมะหยี่. ปุ่มท่าทางและเนื้อผ้าเลือกได้อย่างอิสระ ก่อนเปิด 3D จะเปลี่ยนเฉพาะโปสเตอร์; หลังเปิดแล้วสลับใน GLB เดิมโดยไม่โหลด GLB เพิ่ม. ทั้งสองวัยมีตัวเลือกเหมือนกัน; ปิด/เปิดและสลับวัยแล้วกลับมาจะจำค่าที่เลือกแยกกันในหน้านั้น; reload กลับค่า default. ใช้ `python3 scripts/serve_preview.py --port 4175` หากพอร์ต 4174 ถูกใช้งาน. ลากหมุน เลื่อนล้อเมาส์/จีบนิ้วเพื่อซูม หรือใช้ปุ่มที่รองรับคีย์บอร์ด กด Escape เพื่อกลับภาพหรือยกเลิกระหว่างโหลด. Server รับเฉพาะ loopback และเสิร์ฟโฟลเดอร์ Spike; ไม่เสิร์ฟภาพอ้างอิงภายนอกโฟลเดอร์นี้.

ก่อนเปิด 3D ปุ่มเลือกวัยเปลี่ยนเฉพาะโปสเตอร์และคำบรรยาย. เมื่อเปิดแล้ว ปุ่มเลือกวัยโหลด GLB ตัวที่เลือก พร้อม reset กล้องและคง focus บนปุ่มเลือกวัย. ขณะโหลดสามารถเลือกอีกวัยได้; ผล load/error จากตัวเก่าถูกละทิ้ง. โหลดล้มเหลวแสดงโปสเตอร์ของตัวนั้นและให้ลองใหม่. Texture ที่ฝังใน GLB ใช้ blob URL จาก origin เดียวกัน ไม่มี request ไปบริการภาพภายนอก.

โค้ดพร้อมแก้ได้อยู่ใน [HTML](preview/index.html), [JS](preview/viewer.js), [CSS](preview/style.css) และ [ข้อความไทย](preview/th.js). จุดสำคัญใน JS คือ `import('../node_modules/@google/model-viewer/dist/model-viewer.min.js')` อยู่ใน handler ของปุ่ม จากนั้นจึงสร้าง element และกำหนด `src` ของ GLB. ไม่มี library script หรือ modulepreload ใน HTML ก่อนเปิดดู.

`@google/model-viewer` 4.4.0 และ validator ถูก pin ใน package lock เฉพาะ Spike. ไม่ได้เพิ่ม npm runtime dependency ที่ root เกมหรือเปลี่ยน `src/`. ไม่ใช้ CDN, decoder, AR หรือ auto-rotate ในหน้านี้. model-viewer ใช้ cache ภายใน; การนำ element ออกไม่ได้รับรองว่า GPU memory ถูกคืนทันที การวัด memory บนอุปกรณ์จริงยังไม่ได้ทำ.

## ผลที่วัดแล้ว — วัยโต (Milestone 1D, 2026-10-19)

| รายการ | ผล |
|---|---|
| GLB รวมทุกท่า/วัสดุ | **1,038,744 bytes (1.04 MB)**; ต่ำกว่าเพดาน 2 MB, ไม่มี external URI |
| Geometry ทั้งไฟล์ รวมท่าซ่อน | **24,201 triangles** จากเพดาน 25,000; 4 nodes / 4 meshes / 3 materials / 5 primitives |
| Geometry ที่แสดง | มือเปล่า **21,688**; กอดหัวใจ **22,425** triangles |
| Source | 55 ชิ้น; 38 body + 8 empty arms + 8 heart arms + 1 optional heart |
| Texture | color/normal 128×128 อย่างละ 1 ภาพจาก yarn tiles เดิม; packed/embedded |
| Khronos Validator | **0 errors / 0 warnings**; 6 informational unused UV/tangent notices เก็บครบ |
| Eyelid coverage | Hood ปิด manifold; top rays เดิมพบตาขาว 248/732 จุด → ใหม่ 0/676; มุมสูง 60°/75° รอบ 8 ทิศตรวจ upper sclera ไม่พบทะลุ (17 มุมรวม top) |
| Browser | ทั้ง 8 คู่เลือกของสองวัย, actual rendered node scales/material maps, per-doll memory, delayed/rapid switching, no extra GLB fetch on variant change |
| Regression | **1,060 passed, 0 failed, 0 skipped**; game source/tests ไม่เปลี่ยน |

Ray checks เป็นการสุ่มตำแหน่ง ไม่ใช่ข้อพิสูจน์ทุกมุมทุกจุด; ประกอบกับการตรวจภาพจริงทั้ง front/side/back/three-quarter/top/high และ Chromium. ยังคงช่องตาขาวด้านหน้าไว้ตามลักษณะตาปรือ. จำนวนสามเหลี่ยมรวมทุกท่าที่เก็บ ไม่ได้นับเฉพาะส่วนมองเห็น. Budget ไม่รวม library (~1.07 MB raw), posters และ GPU memory.

Rebuild อิสระให้ตำแหน่ง/indices/UV/colors/textures/JSON เหมือนกัน; adult มี Blender normal variation สูงสุด **0.00006754** ต่อ component จึงไม่อ้างว่า byte-identical. Childhood GLB สร้างซ้ำ byte-identical และ source `.blend`/GLB/renders/textures เดิมไม่เปลี่ยนจาก `688e738`.

```sh
# จาก root repository
/Applications/Blender.app/Contents/MacOS/Blender --background \
  docs/proposals/3d-keepsake-spike/model/jaokob-adult-plush.blend \
  --python docs/proposals/3d-keepsake-spike/scripts/verify_adult_source.py
# จากโฟลเดอร์ Spike
npm run validate
JKB_PREVIEW_URL=http://127.0.0.1:4175 JKB_PLAYWRIGHT_PATH=/absolute/path/to/playwright/index.mjs node scripts/verify_variants.mjs --adult
```

หลักฐาน: [metrics](evidence/model-metrics.json), [validator](evidence/glb-validation.json), [source/occlusion](evidence/adult-source-verification.json), [baseline defect](evidence/adult-source-before.json), [browser combinations](evidence/adult-variants-verification.json), [repeat export/preservation](evidence/adult-rebuild-verification.json), [regression](evidence/adult-m1d-unit-summary.txt), [artifact hashes](evidence/artifact-manifest.json), [change record](../../changelog/2026-10/2026-10-19-1036-adult-keepsake-variants-eyelid.md).

## ผลที่วัดแล้ว — วัยเด็ก (Milestone 1C, 2026-10-18)

| รายการ | ผล |
|---|---|
| GLB รวมสองท่า/สองวัสดุ/textures | **704,780 bytes**, ต่ำกว่า 2 MB; มากกว่าเป้าหมายเดิม 400–600 KB เพราะมี geometry แขนอีกท่า |
| Geometry ทั้งไฟล์ (นับแม้ซ่อนอยู่) | **15,728 triangles** จากเพดาน 25,000; 4 nodes / 4 meshes / 3 materials / 5 primitives |
| Geometry ที่แสดง | มือเปล่า 12,584; หัวใจ 13,384 triangles |
| Source | 29 ส่วนหลัก + แขนท่าพัก 10 + แขนท่ากอด 10 + หัวใจ 1 |
| Default | มือเปล่า, Velour; ขนาดประมาณ 19.6 × 17.19 × 22.75 cm (X/Y/Z), ยังเป็นสเกลต้นแบบ |
| Texture | Crochet color/normal 128×128 เดิมอย่างละ 1 ภาพ, embedded; ไม่มี external URI |
| Poster | 48,750 bytes; default สี่มุม 1000×1000 และภาพ variant สามแบบ |
| Khronos Validator | **0 errors / 0 warnings**, 6 informational notices; รายงานเก็บครบไม่กรอง |
| Game regression | **1,060 passed, 0 failed, 0 skipped**; `src/` และ tests ไม่เปลี่ยน |

`npm run validate` ตรวจทั้งสอง GLB รวม default scales, STEP samples, material mappings, node separation และงบ geometry ทั้งไฟล์. ตรวจ source และ browser จาก root repository:

```sh
/Applications/Blender.app/Contents/MacOS/Blender --background \
  docs/proposals/3d-keepsake-spike/model/jaokob-childhood-crochet.blend \
  --python docs/proposals/3d-keepsake-spike/scripts/verify_childhood_source.py
# จากโฟลเดอร์ Spike; เปลี่ยน URL เป็นพอร์ตของตน
JKB_PREVIEW_URL=http://127.0.0.1:4175 JKB_PLAYWRIGHT_PATH=/absolute/path/to/playwright/index.mjs node scripts/verify_preview.mjs
JKB_PREVIEW_URL=http://127.0.0.1:4175 JKB_PLAYWRIGHT_PATH=/absolute/path/to/playwright/index.mjs node scripts/verify_variants.mjs
```

หลักฐาน: [metrics](evidence/childhood-model-metrics.json), [validator](evidence/childhood-glb-validation.json), [source](evidence/childhood-source-verification.json), [variant checks](evidence/childhood-variants-verification.json), [interaction regression](evidence/preview-verification.json), [unit results](evidence/adr025-unit-summary.txt), [provenance](evidence/childhood-provenance.json), [change record](../../changelog/2026-10/2026-10-18-0508-childhood-stance-material-decoupling.md). ประวัติ Milestone 1B อยู่ใน [บันทึกเดิม](../../changelog/2026-10/2026-10-14-1244-childhood-crochet-model-spike.md); ไม่ใช้ตัวเลขเดิมรับรองไฟล์ปัจจุบัน.

## ข้อจำกัดและงานต่อ

ทั้งสองรุ่นเป็น **base mesh**. ทั้งสองวัยมีวัสดุ Velour/Crochet ให้เลือกแล้ว แต่ยังไม่มีเส้นขนจริง; ด้านหลังวัยโตเป็นการประมาณ รอยต่อและการบิดของ UV บริเวณยอดหัว/แขนขาอาจเห็นเมื่อซูมใกล้. สัดส่วนประมาณจากภาพ ไม่ใช่การสแกนหรือวัดตุ๊กตาจริง. ความเหมือนขั้นสุดท้าย, Safari/VoiceOver, iPhone/Android จริง, FPS/GPU memory และการเชื่อม END-HOME ยังไม่ได้ตรวจรับ. ไม่เปลี่ยน save/schema; rollback การแก้ ADR-P0-025 ผ่าน reviewed revert จะคืนท่าหัวใจ–ไหมพรมแบบเก่า ซึ่งไม่ตรง Canon ปัจจุบัน จึงต้องติดป้าย historical และไม่ใช้ประกอบบท. Facial emotion variants ยังพักไว้; heart stance เป็นข้อยกเว้นที่ PO อนุมัติรอบนี้.
