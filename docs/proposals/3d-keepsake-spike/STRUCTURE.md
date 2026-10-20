# แผนผังและคู่มือดูแลงาน 3D JaoKob

วันที่ตรวจโครงสร้าง: **2026-10-20 (Asia/Bangkok)** · Baseline สินทรัพย์: `develop@7476722` หลัง merge PR #19

เอกสารนี้อธิบายสิ่งที่มีจริงใน Spike ไม่ใช่การอนุมัติ requirement หรือสถาปัตยกรรมเกมใหม่ อ้างอิง [CR-0004](../../rfc/CR-0004-adult-plush-model-spike.md), [ADR-P0-016](../../adr/ADR-P0-016-keepsake-model-viewer-spike.md), [ADR-P0-017](../../adr/ADR-P0-017-childhood-accessory-export.md) และ [ADR-P0-025](../../adr/ADR-P0-025-childhood-keepsake-default-stance-and-heart-emote-decoupling.md) โดยอ่านลำดับการเปลี่ยนแปลงใน [HANDOFF](HANDOFF.md) ก่อนใช้ข้อกำหนดรุ่นเก่า

## 1. ลำดับอ่านสำหรับ Agent ใหม่

1. อ่านคำสั่งผู้ใช้ปัจจุบัน, `AGENTS.md` และ repository skill ตาม checkout ที่ทำงาน แล้วตรวจว่าเอกสาร governance อยู่บน branch ใด อย่าอนุมานว่าไฟล์บน develop ซึ่งเก่ากว่า planning เป็นแผนล่าสุด
2. อ่าน [HANDOFF.md](HANDOFF.md): สิ่งที่ส่งมอบแล้ว, บทเรียน, การหารือล่าสุด และข้อที่ยังไม่อนุมัติ
3. ใช้เอกสารหน้านี้ค้นหาตำแหน่งและเจ้าของข้อมูล
4. อ่าน [README.md](README.md) เมื่อต้องเปิดโมเดล, build, render, export หรือทดสอบ
5. ตรวจ JSON evidence และ Change Record ที่ตรงกับไฟล์ที่จะเปลี่ยน ตัวเลขในรายงานเก่าไม่รับรองไฟล์ที่ regenerate ใหม่

## 2. แผนผังภาพรวม

เส้นทางทั้งหมดต่อไปนี้เป็น relative ต่อ root repository:

```text
docs/
├── proposals/3d-keepsake-spike/        # งาน 3D ที่สร้างและส่งมอบจริง
│   ├── README.md                     # วิธีเปิด/build/export/test + metrics ปัจจุบัน
│   ├── STRUCTURE.md                  # แผนผัง หน้าที่ไฟล์ และการบำรุงรักษา
│   ├── HANDOFF.md                    # บริบทการตัดสินใจและแผนต่อที่ยังเป็นข้อเสนอ
│   ├── progress.md                   # บันทึกลำดับงานเก่าและจุดส่งต่อ
│   ├── package.json / package-lock.json
│   ├── .gitignore
│   ├── scripts/                      # Blender generators, helpers, verifier, server
│   ├── model/                        # editable .blend และ web .glb ของสองวัย
│   ├── textures/                     # yarn color/normal tiles ที่ใช้ร่วมกัน
│   ├── renders/                      # default adult views + poster (ตำแหน่งเดิม)
│   │   ├── adult/                    # adult alternate states + eyelid inspection
│   │   └── childhood/                # childhood default + alternate states
│   ├── preview/                      # HTML/CSS/JS/Thai strings ของ viewer แยก
│   ├── evidence/                     # metrics, validator, browser/source checks, hashes
│   └── node_modules/                 # local install เท่านั้น ไม่ส่งเข้า Git
├── adr/                              # accepted decisions ตาม scope ของแต่ละ ADR
├── rfc/CR-0004-adult-plush-model-spike.md
└── changelog/2026-10/                 # บันทึกส่งมอบแต่ละ milestone
```

`docs/references/3d-doll-models/` เป็น **ตำแหน่งภาพต้นแบบที่ผู้ใช้เคยให้ใน session** ไม่ใช่โฟลเดอร์ที่รับประกันว่ามีใน clone ปัจจุบัน วันที่ตรวจนี้ไม่พบทั้งใน checkout develop แยกและ checkout planning ที่เปิดอยู่ ดู §8 สำหรับรายการภาพเดิม

งานนี้เป็น Spike ใน `docs/` และไม่ถูกนำเข้าเกมจาก `src/` หรือส่งเป็น production artifact โดยอัตโนมัติ การมี `.glb` ไม่ได้แปลว่าฉาก END-HOME หรือ runtime VN ใช้งานมันแล้ว

## 3. เอกสารและไฟล์ควบคุม

| ไฟล์ | ใช้ตอบคำถามใด | วิธีดูแล |
|---|---|---|
| [README](README.md) | จะเปิดและตรวจงานตอนนี้อย่างไร | รักษาคำสั่งและผลวัดล่าสุดให้ตรงของจริง |
| [STRUCTURE](STRUCTURE.md) | ส่วนไหนอยู่ที่ไหนและเชื่อมกันอย่างไร | อัปเดตเมื่อย้าย/เพิ่มบทบาทไฟล์ |
| [HANDOFF](HANDOFF.md) | ทำไมเลือกแบบนี้และควรทำอะไรต่อ | แยก delivered / proposed / pending เสมอ |
| [progress](progress.md) | เกิดอะไรขึ้นตามเวลา | เติมเหตุการณ์ใหม่ ไม่ตีความตัวเลขเก่าเป็นสถานะปัจจุบัน |
| [package.json](package.json) | คำสั่ง npm และ dependency ของ Spike | ตอนนี้มีเพียง `preview`, `validate`; อย่าเดาชื่อ test script |
| [package-lock.json](package-lock.json) | dependency integrity/version | ใช้ `npm ci` สำหรับติดตั้งตาม lock |
| [.gitignore](.gitignore) | สิ่งที่ไม่ควร track | ตรวจ staging เพิ่ม เพราะ symlink `node_modules` เคยปรากฏเป็น untracked |

Versions ที่ baseline ใช้: Blender **5.2.2 LTS ARM64**, `@google/model-viewer` **4.4.0**, `gltf-validator` **2.0.0-dev.3.10**; ไม่ใช่คำกล่าวว่าเป็นเวอร์ชันล่าสุดในอนาคต Blender4 compatibility ยังไม่มีผลทดสอบ

## 4. Source → export → viewer

```text
build_model.py ───────────→ adult .blend / .glb / renders / metrics
       │                         ↑
       ├─ studio helpers ─→ build_childhood_model.py → childhood outputs
       │                         │
       └──────── keepsake_variants.py ────────┘
                    │
          4 semantic nodes + STEP stance + KHR_materials_variants
                    │
              preview/viewer.js
                    │
       local model-viewer → selected GLB, only after Open
```

### 4.1 scripts/: ไฟล์ทุกตัวและหน้าที่

| ไฟล์ | หน้าที่ / dependency สำคัญ |
|---|---|
| [build_model.py](scripts/build_model.py) | สร้างวัยโต: รูปทรง วัสดุ UV แขนสองท่า หัวใจ และเปลือกตา; มี studio helpers ที่วัยเด็กนำเข้า; ใช้ yarn PNG เดิมจาก `textures/` |
| [build_childhood_model.py](scripts/build_childhood_model.py) | สร้างวัยเด็กทรงแคปซูล; สร้าง yarn tiles; ใช้ adult studio helpers แต่ไม่เรียกสร้าง adult asset; ใช้ packager ร่วม |
| [keepsake_variants.py](scripts/keepsake_variants.py) | เติม GLB material variants/STEP scale clip; adult ใช้ canonical triangle ordering เพิ่มด้วย |
| [adult_variants.py](scripts/adult_variants.py) | สลับ stance/material ใน adult source; สำเนาฝังใน `.blend` ชื่อ `Adult_Variants.py` |
| [childhood_variants.py](scripts/childhood_variants.py) | หน้าที่เดียวกันสำหรับ child; ฝังชื่อ `Childhood_Variants.py` |
| [serve_preview.py](scripts/serve_preview.py) | HTTP server เฉพาะ Spike บน loopback; default 4174, เลือก `--port 4175` ได้ |
| [validate_glb.mjs](scripts/validate_glb.mjs) | Khronos validator + budget + named nodes + default scales + STEP samples + material/image assertions ทั้งสอง GLB; เขียน reports ใหม่ |
| [verify_adult_source.py](scripts/verify_adult_source.py) | เปิด source ตรวจ collections, material/helper, packed images, closed eyelid และ sampled ray occlusion; `-- --baseline` ใช้เฉพาะ source รุ่นเก่าที่คาดว่าพบ defect |
| [verify_childhood_source.py](scripts/verify_childhood_source.py) | ตรวจ source default/optional heart, ลักษณะใบหน้า/มือเท้า, packed images และ helper |
| [verify_preview.mjs](scripts/verify_preview.mjs) | regression ของ interaction, lazy load, pointer/touch emulation, reset, retries และ async races |
| [verify_variants.mjs](scripts/verify_variants.mjs) | child สี่คู่เลือกโดย default; `--adult` ตรวจ adult สี่คู่และ top/high captures; ตรวจ mesh/material ที่แสดงจริงกับ model-viewer รุ่น pin |

Private scene inspection มีเฉพาะ browser test และผูกกับ library version; product preview ใช้ public API การอัปเดต model-viewer ต้องทบทวน test นี้ด้วย

### 4.2 model/: อะไรเป็นต้นฉบับ อะไรเป็นผลลัพธ์

- [jaokob-adult-plush.blend](model/jaokob-adult-plush.blend): source ที่แยกแก้ได้ 55 ชิ้น พร้อม camera/light/studio และ helper
- [jaokob-adult-plush.glb](model/jaokob-adult-plush.glb): export เว็บรวมสองท่า/สองวัสดุ
- [jaokob-childhood-crochet.blend](model/jaokob-childhood-crochet.blend): source วัยเด็ก 50 ชิ้น พร้อม helper
- [jaokob-childhood-crochet.glb](model/jaokob-childhood-crochet.glb): export เว็บ; คำ `crochet` ในชื่อคงไว้เพื่อรักษา path แต่ **default ปัจจุบันคือ Velour**

Python คือสูตรสร้างที่ทำซ้ำได้; `.blend` คือ editable source ที่ส่งมอบ; `.glb` คือผลลัพธ์ที่ปรับเพื่อเว็บ การแก้ `.blend` ด้วยมือไม่ได้ย้อนเข้า Python อัตโนมัติ ต้อง Save As ฉบับ manual และตกลง source of truth ก่อน regenerate ห้ามรัน builder ทับงานมือแล้วคาดว่าการเกลาจะยังอยู่

หน่วยภายใน generator: 1 unit = 0.1 m, X ขวา, Y หลัง, Z ขึ้น; export เป็นเมตร/Y up ขนาดต้นแบบไม่ใช่หลักฐานการวัดตุ๊กตาหรือการอนุมัติสเกล Canon

### 4.3 Contract ของท่าและวัสดุ

| ความหมาย | ชื่อใน GLB |
|---|---|
| ส่วนหลัก | `JaoKob_Adult_Body` หรือ `JaoKob_Childhood_Body` |
| แขนท่าพัก | `Stance_EmptyHands` |
| แขนท่ากอด | `Stance_HeartEmote` |
| หัวใจแยกชิ้น | `Accessory_RedHeart` |

Blender แยก `STANCE • EmptyHands`, `STANCE • HeartEmote`, `ACCESSORY • RedHeart • optional`; body ของ adult อยู่ `DOLL • export these parts`, child อยู่ `CHILDHOOD • editable body`; studio ไม่ export

- Raw GLB เปิดมาเป็นมือเปล่า/Velour แม้ viewer ไม่เรียก animation; optional nodes scale `[0,0,0]`
- Clip `HeartEmote`: STEP t=0 มือเปล่า, t=1 กอดหัวใจ, t=2 คงท่ากอดเพื่อหลบ loop endpoint; viewer pause และเลือกเวลา ไม่มีการเอื้อมแขนจริง
- `KHR_materials_variants`: `Velour` และ `Crochet` แยกจาก stance; สองวัยรวม 8 combinations
- ตัวเลข node/material index ไม่ใช่ stable API ให้ยึดชื่อและ verification contract
- ไม่มี skin/skeleton หรือ morph targets ใน GLB ปัจจุบัน อย่านำ selector นี้ไปอ้างว่ามี character rig แล้ว
- Export จาก Blender UI เฉพาะ visible objects จะไม่สร้าง package นี้ครบ ต้องผ่าน export/packager ของ generator หรือ pipeline ที่ปรับรองรับ source manual แล้ว

### 4.4 textures/ และ renders/

[childhood-crochet-color.png](textures/childhood-crochet-color.png) และ [childhood-crochet-normal.png](textures/childhood-crochet-normal.png) เป็น authored repeating tiles **128×128** ทั้งคู่ ใช้ร่วมทั้งสองวัย ชื่อยังขึ้นต้น childhood ตามต้นกำเนิด ไม่ใช่ภาพถ่ายแปะโมเดล ภาพถูก pack ใน `.blend` และ embed ใน `.glb`; แก้ PNG อย่างเดียวไม่ทำให้ export เดิมเปลี่ยน

ตำแหน่ง renders ไม่สมมาตรด้วยเหตุผลด้าน compatibility:

| ตำแหน่ง | เนื้อหา |
|---|---|
| `renders/front.png`, `side.png`, `back.png`, `three-quarter.png`, `poster.jpg` | adult default มือเปล่า/Velour |
| `renders/adult/{empty-crochet,heart-velour,heart-crochet}.png` | adult อีกสาม combinations |
| `renders/adult/poster-{empty-crochet,heart-velour,heart-crochet}.jpg` | ภาพ fallback ของ combinations เหล่านั้น |
| `renders/adult/eyelid-{top,high}.png` | ภาพตรวจเปลือกตาจาก Blender |
| `renders/childhood/` | default สี่มุม + `poster.jpg` และ alternate PNG/JPEG ทั้งสามแบบ |

ภาพ PNG เป็น render จาก geometry จริงสำหรับ review; JPEG poster ใช้แสดงก่อนเปิด 3D ห้ามใช้ภาพที่แก้แยกจากโมเดลมารับรองว่า geometry แก้แล้ว การย้าย adult default ไป subfolder ต้องแก้ references/viewer/tests พร้อมกัน ไม่ใช่งานจัดเอกสารรอบนี้

### 4.5 preview/: ขอบเขต runtime

| ไฟล์ | หน้าที่ |
|---|---|
| [index.html](preview/index.html) | semantic page, เลือกวัย/ท่า/วัสดุ, stage และปุ่ม inspection |
| [style.css](preview/style.css) | mobile-first layout, focus, target size, reduced motion |
| [th.js](preview/th.js) | ข้อความไทยและ alt text ของแต่ละ combination |
| [viewer.js](preview/viewer.js) | lazy import, model lifecycle, selection state, poster, camera controls, retry และ stale-request guards |

ก่อนกดเปิด เปลี่ยนเฉพาะ poster/text; หลังเปิด สลับ stance/material ใน GLB เดิม การเปลี่ยนวัยเลือก GLB ของวัยนั้น มี session memory แยกกัน แต่ reload คืน child/empty/Velour ตัว viewer เป็นอิสระจากเกม ไม่มี Save/localStorage หรือเกม Core coupling ปุ่ม inspection ไม่ใช่ตัวควบคุมตัวละครในเนื้อเรื่อง

## 5. evidence/: วิธีอ่านหลักฐานอย่างถูกต้อง

| กลุ่มไฟล์ | ใช้ยืนยัน |
|---|---|
| `model-metrics.json`, `childhood-model-metrics.json` | bytes, triangle counts, source parts, parameters ของ export |
| `glb-validation.json`, `childhood-glb-validation.json` | รายงาน Khronos ไม่กรอง issues + structural metadata |
| `adult-source-verification.json`, `childhood-source-verification.json` | ผลตรวจ `.blend` ที่เปิดใหม่และ helper |
| `adult-source-before.json`, `adult-eyelid-before-*.png` | หลักฐาน defect ก่อนแก้; ไม่ใช่ current art |
| `adult-rebuild-verification.json` | เปรียบเทียบ export รอบอิสระและ preservation ของ childhood |
| `{adult,childhood}-variants-verification.json` | ผล actual rendered node scales/materials ทุกคู่เลือก |
| `preview-verification.json` | ผล regression การโต้ตอบและ resource lifecycle |
| `{adult,childhood}-*-web.png`, `*-preview-*.png`, `*-options-*.png`, `preview-*.png` | ภาพ browser ตาม viewport/สถานะ; อ่านร่วมกับ JSON ของรอบนั้น |
| `adult-m1d-unit-summary.txt`, `adr025-unit-summary.txt` | ผล game suite รอบ M1D/M1C: 1,060 ผ่าน |
| `unit-summary.txt`, `childhood-unit-summary.txt` | ผล 691 tests ใน milestone เก่า; เก็บเพื่อประวัติ |
| `provenance.json`, `childhood-provenance.json` | วิธีสร้าง แหล่งอ้างอิงและ hash ภาพเดิม; ไม่ได้บรรจุรูปถ่าย |
| `documentation-handoff-verification.json` | ผลตรวจเอกสาร/ลิงก์/GLB metadata/hash รอบ 2026-10-20; ไม่ใช่ผลรัน Blender/browser/unit ใหม่ |
| `artifact-manifest.json` | path/bytes/SHA-256 ของไฟล์ที่ระบุไว้ ไม่ใช่ automated test runner |

Manifest ไม่ได้มีสคริปต์ npm สำหรับ regenerate โดยเฉพาะ ให้คำนวณ hash จากไฟล์จริงเมื่อรายการที่มันครอบคลุมเปลี่ยน พร้อมระบุว่าการแก้ docs ไม่ใช่การรัน geometry/browser tests ใหม่ ไม่เขียนทับผลเก่าเพื่อให้ดูเหมือนผ่านรอบปัจจุบัน

## 6. งานแต่ละประเภทควรเริ่มตรงไหน

| งาน | เริ่มอ่าน/แก้ | ตรวจตามผลกระทบ |
|---|---|---|
| สัดส่วน/ท่านั่ง/เปลือกตา | builder ของวัยนั้น, `.blend`, reference ถ้ามี | source + export + renders + validator + actual browser |
| เปลี่ยน shader/ลายถัก | material builder + shared tiles + packager | ทั้งสองวัสดุ/ทั้งสองวัยที่ใช้ร่วม; งบ texture |
| เปลี่ยน default/หัวใจ | source collections + shared packaging + viewer | raw defaults + ทุก combination + เปิด viewer ที่ไม่ใช้ animation |
| เปลี่ยนตัวเลือก UI | preview + Thai resource | focus/keyboard/44px/layout/reduced motion/async tests |
| เปลี่ยน studio helper | `build_model.py` และ child caller | regenerate ไป output แยกเพื่อดูผลกระทบ child |
| เพิ่ม standing rig | [HANDOFF §6–8](HANDOFF.md#6-การหารือล่าสุด-2026-10-20) | เริ่ม contract/Spike ใหม่หลัง PO อนุมัติ; อย่าทับ seated Keepsake |
| แก้เอกสาร | README/STRUCTURE/HANDOFF + changelog | links, terminology, status, source facts, tracked diff |

## 7. วิธีเริ่มใช้งานโดยไม่ทำลายงานเดิม

1. ตรวจ `git worktree list`, branch, HEAD, diff และ current instructions ก่อนเสมอ อย่าใช้ checkout ที่อีก IDE กำลังแก้เพื่อสลับ branch
2. อ่าน `.blend` ที่มีได้ทันทีโดยไม่ต้อง build; `.glb` เปิดผ่าน HTTP preview
3. ติดตั้ง dependency ภายใน Spike ด้วยคำสั่งใน README; ไม่ copy/symlink node_modules เข้า commit
4. สร้าง output ทดลองนอกชุดส่งมอบด้วย `--output /absolute/temporary/directory`; add `--render` เมื่อต้องใช้ภาพตรวจ
5. ตรวจตำแหน่ง output ของ source verifier ก่อนใช้: adult verifier เขียน `evidence/` ข้างโฟลเดอร์ scripts แม้เปิด `.blend` จากที่อื่น; childhood verifier เขียน `evidence/` ที่ root ของ output ซึ่งบรรจุ `.blend` ที่เปิดอยู่ ดังนั้นอย่าทดสอบ asset ทดลองแล้วทับรายงาน shipped โดยไม่ตั้งใจ
6. ใช้คำสั่ง [README](README.md) ตามประเภทงาน: `npm run validate`, Blender source verifiers, `verify_preview.mjs`, `verify_variants.mjs` ทั้งสองวัย; Playwright ต้องกำหนด module path ที่มีจริงในเครื่อง
7. `node --test tests/unit/*.test.js` รันจาก repository root เมื่อเปลี่ยน behavior ตาม gate; งาน docs-only ใช้ document checks และระบุไม่ได้รัน runtime tests ใหม่
8. Stage explicit paths; กัน `.blend1`, logs, local screenshots ชั่วคราวและ dependency symlink ออก ตรวจ identity ก่อน commit

4174 คือ server default; 4175 เป็นพอร์ตที่ใช้ระหว่าง session นี้ ไม่รับประกันว่า process ยังทำงานหรือเสิร์ฟ checkout ล่าสุด ตรวจ server ก่อนเปิดซ้ำ และไม่หยุด process ของผู้อื่นโดยเดา

## 8. ภาพอ้างอิงและรายการที่ยังไม่อยู่ใน clone

ชื่อภาพที่ PO ให้เดิมใต้ `docs/references/3d-doll-models/`:

- `jaokob-childhood-crochet-front.png`, `jaokob-childhood-crochet-side.png`, `jaokob-childhood-crochet-back.png`
- `jaokob-adult-plush-front.png`, `jaokob-adult-plush-basket.png`, `jaokob-adult-plush-reading.png`
- `README.md` ของภาพอ้างอิงที่เคยกล่าวถึง

**ไม่พบโฟลเดอร์นี้ในการตรวจวันที่ 2026-10-20**; อย่าทำลิงก์เหมือนเป็นไฟล์ที่พร้อมใช้หรืออ้างว่าเพิ่งดูภาพจริงใน session ใหม่ `.blend`/GLB และ authored texture ที่ส่งมอบยังใช้ได้โดยไม่ต้องมีรูปถ่าย แต่ถ้าต้องเทียบ likeness ใหม่ ให้ตรวจแหล่งภาพที่ PO จัดให้หรือขอภาพอีกครั้ง ห้ามสร้างภาพต้นแบบขึ้นมาแทนหลักฐาน ภาพอ้างอิงส่วนตัวไม่ได้อนุญาตให้อัปโหลดไปบริการ AI 3D ภายนอกโดยอัตโนมัติ

## 9. การขยายเอกสารและโฟลเดอร์ในอนาคต

คงชื่อ asset/path ที่ viewer ใช้อยู่; ตั้งชื่อเพิ่มเติมสื่อวัย บทบาท และชนิดการแสดง เมื่อเริ่ม character rig ให้จัด source/export/evidence แยกจาก seated Keepsake ตาม contract ที่อนุมัติใหม่ (ยังไม่มี directory หรือ asset ชุด standing) ไม่ต้องย้ายไฟล์เก่าเพื่อให้ต้นไม้สวย ถ้าเพิ่มไฟล์ให้ปรับแผนผังและ navigation ถ้าเพิ่ม behavior ให้ปรับ contract, evidence และ Change Record พร้อมกัน
