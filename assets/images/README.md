# โครงสร้างคลังสื่อภาพมาตรฐาน Visual Novel (JaoKob Visual Asset & Versioning Architecture)

เอกสารนี้กำหนดโครงสร้างโฟลเดอร์มาตรฐานสำหรับเก็บภาพตัวละคร (`characters`), ฉากหลัง (`backgrounds`), ภาพคัตซีนจุดพีค (`cg`), และไอเทมของสะสม (`keepsakes`) ตามพระราชบัญญัติ [ADR-P0-032](../../docs/adr/ADR-P0-032-living-fantasy-canon-peuak-miracle-doll-and-vn-stage-blocking.md) และพิมพ์เขียว [new-five-act-story-and-mechanics-proposal.md](../../docs/design-system/new-five-act-story-and-mechanics-proposal.md)

## ชุดต้นแบบ v1 ที่ส่งมอบ 2026-10-29

เจนครบ **52 ภาพ**: ตัวละคร 24, ฉากหลัง 15, คัตซีน 7 และของสะสม 6 ชิ้น พร้อม PNG ใน `versions/v1/` และ WebP ตามพาธใน [manifest](asset-manifest-v1.json) ทุกภาพมีสถานะ `generated-awaiting-po-review` การวาง WebP ที่พาธปลายทางตามคำสั่ง PO รอบนี้เป็นการส่งตัวเลือกตรวจรับ ยังไม่ใช่การอนุมัติภาพหรือเปิดใช้ใน runtime

- [หน้ารวมภาพสำหรับตรวจรับ](../../docs/design-system/evidence/visual-assets-v1-review.html): เปิดในเบราว์เซอร์ได้โดยตรง มีพื้นหลังสไปรต์สว่าง/เข้มและเส้นพื้นที่ข้อความ 28%
- [พรอมป์ต์ ภาพอ้างอิง และประวัติการแก้](../provenance/visual-assets-v1.json)
- [หลักฐานตรวจไฟล์ 104 ไฟล์](../../docs/design-system/evidence/visual-assets-v1-verification.json) และ [ตัวตรวจที่รันซ้ำได้](../../docs/design-system/evidence/verify-visual-assets-v1.py) (`Python 3` + `Pillow`, เครื่องมือพัฒนาเท่านั้น)

ตัวละครชุดต้นแบบเก็บ **1024×1024 ทั้ง PNG และ WebP** ตาม manifest และคำขอ PO; การทำอนุพันธ์ runtime 512×512 และงบโหลดจริงเป็นงาน integration หลังตรวจรับ ฉากหลัง/CG เป็น 1600×900 และไอคอนเป็น 512×512 การปรับขนาดและเข้ารหัสเป็นขั้นตอนทางเทคนิคหลัง Image Generation โดยมีขนาด native และ checksum บันทึกใน provenance

ชุด v1 ยึดรายการ CG เจ็ดภาพใน prompt/manifest: CG-01–04, CG-05A, E-HOME และ E-DAWN ส่วน E-POND มีฉากหลัง `bg_act5_pond_homecoming_dawn` แต่ยังไม่มีรายการ CG แยกในสัญญา v1 นี้

---

## 1. โครงสร้างโฟลเดอร์มาตรฐาน (Directory Layout)

```text
assets/images/
├── README.md                          # คู่มือโครงสร้างคลังภาพและการจัดการเวอร์ชัน
├── asset-manifest-v1.json             # ทะเบียนคุมไฟล์ภาพ เวอร์ชันที่ใช้งาน และสถานะตรวจรับ
├── characters/                        # ภาพตัวละครตัดพื้นหลังโปร่งใส (1024x1024 Master / 512x512 Runtime WebP)
│   ├── jao-kob/                       # เจ้ากบ (วัยเด็ก & วัยโต 45 ซม. สวมเสื้อยืดสีฟ้าคอกลมตัวเดียวในเรื่อง)
│   ├── jao-kab/                       # พี่ชายคนโต เจ้ากับ (ไม่สวมเสื้อ คาดสายกกถัก & สนับข้อมือเปลือกไม้)
│   ├── jao-kib/                       # น้องสาวคนเล็ก เจ้ากิบ (ไม่สวมเสื้อ สวมปกคอใบบัวจิ๋ว & กระบอกเมล็ดต้อยติ่ง)
│   ├── parents/                       # พ่อกบ (เข็มขัดเถาวัลย์) & แม่กบ (ผ้าคลุมไหล่ใบบัวแห้ง)
│   ├── p-kam/                         # พี่ก้าม (ปูเสฉวนบกแบกกระป๋องลูกอมสังกะสีบุบ ๆ ลายดอกไม้จาง ๆ)
│   ├── jao-fiw/                       # เจ้าฟิ้ว (กระรอกบินตาโต ผูกริบบิ้นสีเหลืองที่คอ)
│   ├── cockroach-man/                 # แมลงสาบแมน (ก้อนเงาผ้าคลุมถุงดำพองลม & หน้ากากหนวดเงา — ห้ามวาดแมลงจริง!)
│   ├── jao-teuk/                      # เจ้าเตื๊อก (ชายหนุ่มเปียกฝนถือร่มพัง & พวงกุญแจนกหวีดทองเหลือง)
│   ├── peuak/                         # เด็กหญิงเปื๊อก (หญิงสาวเจ้าของรอยยิ้มอบอุ่นและเสื้อสีฟ้า)
│   └── city-humans/                   # เด็กชายต้น & คุณลุงยามเฝ้าสะพาน (Act 3)
├── backgrounds/                       # ภาพฉากหลังเวที Visual Novel (16:9, 1600x900 WebP/PNG) แยกตามองก์
│   ├── act-01/                        # บึงกก รากต้นหลิวใหญ่ บ้านกอไผ่ และฝายน้ำล้น
│   ├── act-02/                        # อุโมงค์ท่อระบายน้ำใหญ่ ตะแกรงน้ำวน และโถงบัลลังก์เงาประตูน้ำ
│   ├── act-03/                        # ถนนเมืองมนุษย์คืนไฟดับ ใต้แผงลอย สะพานข้ามคลอง และศาลาริมทาง
│   ├── act-04/                        # กำแพงอิฐสวนหลังบ้าน ยอดกำแพงพายุ และห้วงน้ำเชี่ยว 12 เมตร
│   └── act-05/                        # ห้องนอนชั้นสองของเปื๊อก โต๊ะโคมไฟข้างเตียง และหน้าต่างแสงรุ่งอรุณ
├── cg/                                # ภาพคัตซีนเต็มจอสำหรับฉากสำคัญ/ฉาก Peak (16:9, 1600x900 WebP/PNG)
│   ├── act-01/                        # CG-01: สามพี่น้อง กบ-กับ-กิบ พบเสื้อสีฟ้าและไล่เงาแมลงสาบแมน
│   ├── act-02/                        # CG-02: เจ้ากบยื้อก้ามเหล็กพี่ก้ามเหนือน้ำวน & พังบัลลังก์เงา 2 เมตร
│   ├── act-03/                        # CG-03: เจ้าเตื๊อกคุกเข่าท่ามกลางสายฝนมอบนกหวีดและภารกิจผู้พิทักษ์
│   ├── act-04/                        # CG-04: ปฏิบัติการห้าประสานทะยานฝ่าสายฟ้าข้ามห้วงพายุ 12 เมตร
│   └── act-05/                        # v1: CG-05A (ศึกเงาอัศวิน) & CG-05B/C (E-HOME / E-DAWN)
├── keepsakes/                         # ไอคอนของสะสมในกระเป๋า 4 ช่อง (512x512 พื้นหลังโปร่งใส)
│   └── v2/                            # ไอเทมเนื้อเรื่องใหม่ทั้ง 6 ชิ้นตาม ADR-P0-032
└── ui/                                # องค์ประกอบกราฟิกส่วนติดต่อผู้ใช้
```

---

## 2. กติกาการตั้งชื่อไฟล์และการรองรับหลายเวอร์ชัน (Naming & Versioning Convention)

เพื่อให้สามารถปรับปรุงและเปรียบเทียบคุณภาพของรูปภาพได้โดยไม่ทำลายพาธที่เอนจินเกมเรียกใช้งาน:
1. **ไฟล์ที่พร้อมใช้งานจริง (Canonical Active Asset):**
   - ใช้ชื่อมาตรฐานไร้เลขเวอร์ชันต่อท้าย เช่น `assets/images/characters/jao-kob/adult-neutral.webp` หรือ `assets/images/backgrounds/act-01/bg-act1-willow-roots.webp`
2. **การเก็บเวอร์ชันทางเลือกหรือการปรับปรุงรอบถัดไป (Version Iteration):**
   - เมื่อเจนภาพรอบใหม่เพื่อเปรียบเทียบ ให้สร้างโฟลเดอร์ย่อย `versions/v1/`, `versions/v2/` ภายในโฟลเดอร์นั้น ๆ (เช่น `assets/images/characters/jao-kob/versions/v1/adult-neutral.png`)
   - เมื่อ PO อนุมัติเวอร์ชันใด จึงคัดลอก/แปลงไฟล์นั้นขึ้นมาทับไฟล์ Canonical ที่ระดับบนสุด

---

## 3. ไปป์ไลน์คำสั่ง Prompt สำหรับ `Senior AI / GPT-6 Astra`

รายละเอียดลำดับการทำงานและ Prompt สำหรับเจนภาพทุกไฟล์ถูกจัดเก็บไว้ที่:
- [00-ASTRA-WORKFLOW-AND-OUTPUT-CONTRACT.md](../../docs/design-system/asset-prompts/00-ASTRA-WORKFLOW-AND-OUTPUT-CONTRACT.md)
- [01-CHARACTER-SPRITE-PROMPTS.md](../../docs/design-system/asset-prompts/01-CHARACTER-SPRITE-PROMPTS.md)
- [02-BACKGROUND-SCENE-PROMPTS.md](../../docs/design-system/asset-prompts/02-BACKGROUND-SCENE-PROMPTS.md)
- [03-CINEMATIC-CG-AND-KEEPSAKE-PROMPTS.md](../../docs/design-system/asset-prompts/03-CINEMATIC-CG-AND-KEEPSAKE-PROMPTS.md)

