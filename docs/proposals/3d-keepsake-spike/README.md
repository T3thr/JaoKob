# JaoKob adult plush — modeling spike

Scope and authority: [CR-0004](../../rfc/CR-0004-adult-plush-model-spike.md).

This editable art prototype follows the adult green velour doll with sleepy eyes, peach lips, a blue shirt and long limbs. Adult rear surfaces are inferred. The childhood heart is an optional accessory; childhood modeling and emotion variants are deferred.

Source photographs are local references in `docs/references/3d-doll-models/`; the model uses constructed geometry and authored materials rather than embedding those photos. This folder is not part of the production game build.

## Outputs

- `model/jaokob-adult-plush.blend`: editable named parts, materials and render setup.
- `model/jaokob-adult-plush.glb`: self-contained web model.
- `renders/`: actual model renders from inspection angles.
- `scripts/build_model.py`: deterministic Blender generator.
- `preview/`: local inspection UI.
- `evidence/`: measured export and browser results.

## เปิดดูทันที

เปิด `model/jaokob-adult-plush.blend` ใน Blender เพื่อแก้โมเดลที่สร้างแล้ว หรือใช้หน้าเว็บตามขั้นตอนด้านล่าง ไฟล์ส่งมอบทดสอบด้วย **Blender 5.2.2 LTS บน macOS ARM64**; ไม่ได้ทดสอบย้อนหลังกับ Blender 4.5

## รันสคริปต์ใน Blender

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

เปิด <http://127.0.0.1:4174/preview/> แล้วกด **เปิดดูแบบ 3 มิติ**. ลากหมุน เลื่อนล้อเมาส์/จีบนิ้วเพื่อซูม หรือใช้ปุ่มที่รองรับคีย์บอร์ด กด Escape เพื่อกลับภาพ. Server รับเฉพาะ loopback และเสิร์ฟโฟลเดอร์ Spike; ไม่เสิร์ฟภาพอ้างอิงภายนอกโฟลเดอร์นี้.

โค้ดพร้อมแก้ได้อยู่ใน [HTML](preview/index.html), [JS](preview/viewer.js), [CSS](preview/style.css) และ [ข้อความไทย](preview/th.js). จุดสำคัญใน JS คือ `import('../node_modules/@google/model-viewer/dist/model-viewer.min.js')` อยู่ใน handler ของปุ่ม จากนั้นจึงสร้าง element และกำหนด `src` ของ GLB. ไม่มี library script หรือ modulepreload ใน HTML ก่อนเปิดดู.

`@google/model-viewer` 4.4.0 และ validator ถูก pin ใน package lock เฉพาะ Spike. ไม่ได้เพิ่ม npm runtime dependency ที่ root เกมหรือเปลี่ยน `src/`. ไม่ใช้ CDN, decoder, AR หรือ auto-rotate ในหน้านี้. model-viewer ใช้ cache ภายใน; การนำ element ออกไม่ได้รับรองว่า GPU memory ถูกคืนทันที การวัด memory บนอุปกรณ์จริงยังไม่ได้ทำ.

## ผลที่วัดแล้ว

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

## ข้อจำกัดและงานต่อ

Milestone 1 เป็น **base mesh**: ผิวยังเรียบ ไม่มีเส้นขน/normal texture และรอยต่อแขนขาบางส่วนยังเห็นเป็นชิ้น. ด้านหลังเป็นการประมาณ. ความเหมือนขั้นสุดท้าย, Safari/VoiceOver, iPhone/Android จริง, FPS/GPU memory และการเชื่อม END-HOME ยังไม่ได้ตรวจรับ. ไม่เปลี่ยน save/schema; rollback ลบหรือ revert เฉพาะโฟลเดอร์ Spike. วัยเด็กไม่ต้องถือหัวใจตลอดเวลา; emotion variants ยังพักไว้.
