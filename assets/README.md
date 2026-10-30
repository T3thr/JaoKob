# assets/ · สื่อของเกม (Runtime)

**ระดับ:** ไฟล์ที่เกมโหลดจริงหรือรอ PO ตรวจรับก่อนเปิดใช้ เฉพาะไฟล์ใน allowlist ของ [specs/releases/](../specs/releases/) เท่านั้นที่ถูกส่งออกไปกับเกม

**ออกแบบตาม:** Asset Provenance (บันทึกที่มา สิทธิ์ และ checksum ทุกไฟล์ ตามแนวทาง C2PA และ SPDX) และ Versioned Canonical Path (ไฟล์ที่ใช้งานอยู่ไม่มีเลขรุ่นในชื่อ รุ่นทดลองอยู่ใน `versions/vN/`)

| โฟลเดอร์ | เนื้อหา | คู่มือ |
|---|---|---|
| [images/](images/) | ตัวละคร ฉากหลัง CG ของสะสม และ UI พร้อม manifest ราย version | [images/README.md](images/README.md) |
| [audio/](audio/) | เพลง เสียงบรรยากาศ และเสียงประกอบ | provenance ใน [provenance/](provenance/) |
| [fonts/](fonts/) | Sarabun (SIL OFL) แบบ self-hosted | [fonts/OFL-Sarabun.txt](fonts/OFL-Sarabun.txt) |
| [provenance/](provenance/) | ที่มา พรอมป์ต์ checksum และสิทธิ์ของทุก asset | [provenance/README.md](provenance/README.md) |

**กติกาเหล็ก**

1. ห้ามคัดลอก asset ไปไว้ที่อื่นใน repository เครื่องมือหรือหน้า review ต้องอ้างไฟล์ที่นี่ด้วย relative path
2. asset ใหม่ทุกไฟล์ต้องมี provenance ก่อน commit และต้องผ่าน IP clearance ก่อนเผยแพร่
3. ภาพทุกภาพต้องตรงกับกฎภาพใน [physics-scale-and-visual-v2-specification.md §8](../docs/design-system/physics-scale-and-visual-v2-specification.md)
