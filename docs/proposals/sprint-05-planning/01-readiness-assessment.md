# Sprint 5 Readiness Assessment

ID `JKB-S5-ASSESSMENT-001`, version **0.2.0**, 2026-10-18 (Asia/Bangkok). Runtime baseline `develop@d1af293`; previous planning head `c99e745`. This revision adopts the PO's [Accepted ADR-P0-022](../../adr/ADR-P0-022-visual-novel-ergonomics-living-keepsake-lore-and-sprint-streamlining.md). [SSOT](../../sprints/sprint-05-ssot.md) owns four-slice delivery; [remediation contract](02-adr022-remediation-contract.md) defines observable behavior; [trace matrix](../../traceability/sprint-05-execution-matrix.md) maps the review findings.

## 1. Assessment outcome

พร้อมเริ่ม Slice 1 ด้วยงานสัญญาและ Design System ภายใต้มติที่มีอยู่แล้ว แผนเดิมต้องเปลี่ยนทั้งตัวตนของตัวละคร การจัด UI ความหมายของภาพฉากจบ และ compatibility ของเรื่องฉบับใหม่ การเปลี่ยนภาพลูกอ๊อดเป็นตุ๊กตาอย่างเดียวไม่ทำให้เหตุการณ์เดิมสมเหตุสมผล และการลดจำนวน PR ไม่ลดภาระการเขียนบทหรือการตรวจงานจริง

PO รายงาน Critical Negative Feedback 100% ในหมวดที่ประเมินจากผู้มีประสบการณ์ VN มากกว่า 20 ปี รอบนี้ใช้ ADR22 เป็นบันทึกผลและคำสั่งผูกพัน ไม่อ้างว่าค่านี้เป็นสถิติของผู้เล่นทั้งหมดหรือว่าเราได้ทำการประเมินนั้นเอง ภาพหน้าจอเฉพาะจาก reviewer ยังไม่อยู่ในชุดอ้างอิงที่เปิดตรวจ; ภาพสามภาพที่ตรวจจริงเป็น model renders ของวัยเด็กและวัยโตตามคำขอ

ภาพ [childhood/front.png](../3d-keepsake-spike/renders/childhood/front.png) แสดงพื้นผิวถัก แขนขา ใบหน้าการ์ตูน เสื้อฟ้าและหัวใจแยกชิ้น ภาพ [poster.jpg](../3d-keepsake-spike/renders/poster.jpg) และ [front.png](../3d-keepsake-spike/renders/front.png) แสดงร่างโตและเสื้อฟ้าที่ **ยังไม่มีหัวใจปัก** ความสูงประมาณ 45 ซม. มาจากมติผู้สร้าง ไม่ใช่ค่าที่วัดจากภาพเหล่านี้

## 2. Engineering findings and implications

| Inspected source / evidence | Observed fact | Revised plan |
|---|---|---|
| [content-runtime.js](../../../src/data/content/content-runtime.js) | One tree ≤256 nodes; all nodes act1; only cutscene/exploration/decision admitted | S1 T1/T2/T3 explicitly adds bounded capabilities and complete reference validation, not a blanket removal of guards |
| [content-orchestration.js](../../../src/core/use-cases/content-orchestration.js) | Crisis unsupported in active executor; saved Bond must be0; unlocked endings empty; one checkpoint | S1 integrates existing pure transaction/state policies, actual crisis/Assist/ending and captured replay |
| [content-sessions.js](../../../src/bootstrap/content-sessions.js) | Session map keyed by contentVersion; primary3 and exact legacy2.1 | Package identity must bind sessions/media/persistence; old lore stays archived, new lore starts explicitly |
| [bootstrap](../../../src/bootstrap/index.js) | High/irreversible choices with confirmation enabled enter `choice-confirmation`; commit retains expected revision | Replace the presentation with inline arm/confirm while retaining eligibility, revision, cancellation and atomicity |
| [renderer](../../../src/ui/renderers/dom/dom-renderer.js), [styles](../../../src/ui/styles/components.css), [motion](../../../src/ui/styles/motion.css) | Renderer admits choice-confirmation modal; saved-status dot/pseudo-element and fade exist; root read-click handling exists | S1 removes narrative popup and success artifact, separates HUD/tools and reconciles background default cursor with inert background behavior |
| [save2 schema](../../../specs/schemas/v2.0.0/save-state.schema.json), [save validator](../../../src/data/validation/save-envelope-validator.js) | Closed fields at envelope/payload/checkpoint; no chapter snapshot collection | Keep Format2 with separately versioned extension profile; no published-schema mutation or assertion of automatic old-reader compatibility |
| [Fresh Save2 fact probe](evidence/save2-current-validator-probe.json) | Existing fixture valid; added envelope extension and payload snapshots each rejected as `UNKNOWN_FIELD` | T0/T1/T3 must prove new reader, bounds/integrity and rollback write protection before enabling the extended writer |
| [local storage adapter](../../../src/data/persistence/local-storage-adapter.js) | Staging/canonical/backup, raw comparison, replacement and downgrade guards | Retain transactional protection; same-format new profile needs an actual old-application refusal/byte-preservation rehearsal |
| [content presentation](../../../src/data/content/content-presentation.js), [catalog](../../../src/data/content/presentation-catalog.js) | Portrait primarily speaker-driven; strict optional metadata and64,000-byte limit | Author body stage and cinematic composition explicitly; media remains optional and does not affect Domain rules |
| [act1 package](../../../src/data/content/packages/act-01.json) and pouch policy | Current published story has biological childhood, five natural items and fixed moments | S2 publishes a new living-keepsake version, reauthors setup/payoff and registers changed IDs; no causal history conversion from old saves |
| [static artifact checker](../../../tests/release/verify-static-artifact.mjs) | S4 manifest/rollback pin and no GLB/vendor allowance | S4 creates version-specific release gates after dependency review; do not turn off the old checker or bulk-copy spike files |

**Save assessment:** the former Save3 recommendation is retired by ADR22. Keeping Format2 is workable as a new reader accepting old records plus a bounded, separately validated extension profile for new story versions. It does not make an old closed validator accept added fields. This distinction is built into the compatibility matrix and rollback gate, so “no breaking migration” means no forced conversion/reset of existing valid saves, not a claim of universal forward readability. Exact profile fields/fixtures are the first Slice1 contract task.

**Lore compatibility:** an A1-complete save from the old story cannot honestly become a 45 cm adult that grew before its storm if those events never happened. The earlier automatic bridge proposal is retired. Exact archive continuation and explicit New Game protect both the player's progress and the new Canon. Future same-lore version bridges still require a real equivalence proof.

## 3. Narrative and visual assessment

จุดที่ยังใช้ต่อได้คือความรักในครอบครัว อารมณ์ขันของพี่น้อง การเรียนรู้จากน้ำและสิ่งแวดล้อม การพลัดพราก และความทรงจำผ่านของที่เลือกพก แต่ต้องเขียนการกระทำใหม่ให้เข้ากับแขน ขา และลำตัวที่นุ่ม หางที่ชนกันหรือเปลือกหอยที่หลบได้ทั้งครอบครัวจากฉบับเก่าไม่ใช่ setup ที่นำมาอ้างต่อในฉบับใหม่ได้ทันที

Act 1 ต้องให้ผู้เล่นจำร่างถักและความสัมพันธ์ก่อนเห็นการเติบโต แล้วให้ร่างโตสวมเสื้อฟ้าเผชิญพายุ ลำดับนี้เป็นหัวใจของ ADR22 การเติบโตต้องมีจังหวะอ่านและภาพเปลี่ยนผ่านที่รู้เรื่อง ไม่แทรกไว้ในคำอธิบายต้น Act 2 ส่วนที่มาแห่งชีวิตหรือสรีระของสมาชิกครอบครัวที่ยังไม่ระบุไม่ควรกลายเป็นตำนานใหม่โดยไม่มีเหตุจำเป็น

สเกลเมืองเปลี่ยนภาษาของการผจญภัย: ขอบฟุตบาทเป็นสิ่งที่ใช้มือและท่าทางผ่านได้ ท่อระบายน้ำต้องมีความกว้างจริง เก้าอี้และช่องหลบต้องสัมพันธ์กับลำตัว ล้อรถและฝีเท้ามนุษย์ยังสร้างความเสี่ยงได้โดยไม่ย่อเจ้ากบให้เล็กเท่านิ้ว ทุก key board ควรแสดง pose, clearance, camera และเส้นทางปลอดภัย สเกลโลกกับขนาดภาพบนจอเป็นคนละเรื่อง

A3-003 ยังคงเป็นจุดบรรจบที่เหมาะสมเมื่อการเลือกกออ้อ/ท่อให้ cue และผลที่ต่างกัน ก่อนกลับสู่พื้นที่ร่วมโดยรักษา route facts ไม่ reset meter/pouch เพื่อให้กราฟง่าย ชุดทดสอบต้องเป็น state-aware รวม optional moments และ low-meter paths

เด็กหญิงไม่ได้พบสัตว์ที่ตักขึ้นได้ในฝ่ามือ เธอพบสิ่งมีชีวิตที่มีรูปทรงตุ๊กตาและการตัดสินใจของตนเอง การก้มลง เปลี่ยนตำแหน่งภาชนะ ถอยมือ หรือรอให้เขาเข้ามาคือการเล่าความเคารพผ่านการกระทำ ฉาก cinematic ควรให้ระยะเหล่านี้อ่านออก ไม่ใช้ภาพสวยปิดช่องโหว่ทางกายภาพ

ทั้ง DAWN, NEARBY และ HOME รักษาตัวตนตุ๊กตามีชีวิตเหมือนกัน HOME ไม่ใช่รางวัลที่เพิ่งเปลี่ยนกบธรรมชาติเป็นตุ๊กตา ภาพวัยเด็ก/วัยโตและของขวัญยังใช้เป็นกรอบความทรงจำได้ โดยกลับมาที่ชีวิตและทางออกของเจ้ากบก่อนชวนดูโมเดล ฉากจบอื่นต้องมีภาพชีวิตและวันถัดไปที่สมบูรณ์เท่าเทียม ไม่บังคับสะสมครบหรือทำ Bond สูงเพื่อให้มีคุณค่าทางอารมณ์

## 4. UI, reading comfort and evidence

งานที่ได้รับอนุมัติแล้วคือการโละระบบจัดหน้า: type/spacing/layers ที่สอดคล้องกัน, ambient meters แยก tools, targets≥44×44, affordance ที่ไม่หลอก, utilities ที่โปร่ง, choice layout ไม่มี scrollbar ซ้อน, silent success และ inline confirmation การเปลี่ยนเพียงสีหรือเพิ่มเงาไม่ตอบ finding เรื่องความแออัด

Inline choice ใช้ state machine ที่ชัด: arm exact action/revision → deliberate confirm → one transaction; hover/focus ไม่ commit และ rapid/double/repeated-key input ต้องไม่ข้ามการทบทวน Preserve `confirmHighImpactChoices` semantics และ destructive-reset consent ไม่ลบการป้องกันข้อมูลไปพร้อม popup ของการเลือกเรื่อง

Silent saving หมายถึงไม่มีจุด/ภาพ/ข้อความ/เสียงประกาศสำเร็จซ้ำ แต่ยังบันทึกและ reload ได้จริง ส่วนข้อผิดพลาด quota/protected record/memory-only ต้องมีข้อมูลช่วยผู้เล่น การซ่อนสถานะทั้งหมดหรือปิด save ไม่ได้แก้ finding นี้

ภาพ cutscene ต้องทำหน้าที่ในจังหวะอบอุ่น เติบโต พายุ พบเด็กหญิง และตัดสินใจตอนจบ โดยมีข้อความครบเมื่อภาพ/เสียงหายและไม่มี timer บังคับอ่าน Thai editorial, reading comfort และ art review เป็น human merge gates ของแต่ละ slice; prior negative feedback ยังไม่ถือว่าปิดด้วยเอกสารนี้

## 5. Four-slice trade-off and readiness

| Slice | Value | Principal risk / control |
|---|---|---|
| S1 / planned PR19 / T0–T5 | VN overhaul and five-act/Save2 foundations | Broad cross-layer change; contract/fixtures first, ordered UI/runtime checkpoints, actual comfort and rollback review |
| S2 / planned PR20 / T6–T7 | Living origin and Act2 launch | Act1 rewrite has new causal history; new package/version, scale boards, Thai read-through and protected legacy continuation |
| S3 / planned PR21 / T8–T13 | Acts3–5, cinematic beats, three endings/replay | Largest authoring PR; per-act commits/evidence and full-path review, no extra fifth PR or skipped gates |
| S4 / planned PR22 / T14–T19 | Gift viewer, actual devices, final acceptance | Reserve art/device/AT review early; exports, runtime lifecycle, physical devices and release proof are separate checkpoints |

The existing twenty task IDs are remapped 6/2/6/6; T6 now includes the revised Act1. Four PRs reduce coordination overhead but do not reduce required work. Retire the previous effort estimate and re-estimate using the actual design and script samples. Full-story duration remains a measured design target, never a reason to pad the Thai.

No new approval of ADR22 is needed. Slice1 can start its contract/design work; exact technical schemas and human merge acceptance remain deliverables. Production 3D dependency/version selection remains scoped to Slice4. The S6 protected-core seam remains, but no Editor is implemented now.

## 6. Evidence and research ledger

The original survey covers81 baseline Markdown documents /11,082 lines; [inventory](evidence/source-inventory.json) retains their baseline hashes. The original [verification manifest](evidence/planning-verification.json), [unit TAP](evidence/baseline-unit.tap.gz) and [design report](evidence/ending-trajectories.json) remain unchanged historical evidence: 1,060/1,060 unit passes and 1,096 design trajectories across eight contexts/eight named witnesses. Design begins at Act4; it does not prove revised Act1–5 or human choice probabilities.

This revision adds the [Save2 probe](evidence/save2-current-validator-probe.json) and [replanning verification](evidence/adr022-replanning-verification.json): current source/profile facts, document links/IDs/WBS/trace, unchanged supplied ADR and runtime/test/schema/assets, evidence integrity and inspected image identities. It does not rerun the unchanged full suite, schema reference/browser/static artifact checks or human/device/AT acceptance.

Primary-source research previously accessed on 2026-10-17 remains background for the plan. It was not refreshed in this documentation revision and does not certify the new design:

| Source | Limited application |
|---|---|
| [W3C Text Spacing](https://www.w3.org/WAI/WCAG22/Understanding/text-spacing.html) | Content/function must survive applicable spacing overrides; listed values are not mandatory default typography |
| [W3C Reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html) | Test equivalent320CSSpx and native zoom; fixed positioning cannot justify lost text or controls |
| [MDN Storage quotas](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria) | Quota/deletion/private-mode failures remain possible; keep canonical source bundled and saves failure-safe |
| [JSON Schema structure](https://json-schema.org/understanding-json-schema/structuring) | Separately identified schema resources support versioned profiles; schema identity is not authorization |
| [model-viewer loading examples](https://modelviewer.dev/examples/loading/) | Candidate research only; exact production version/lifecycle/network/budgets need review and measurements in Slice4 |

Migration this round: none. A reviewed documentation revert restores the prior plan without touching saves. Historical test reports stay historical; the revised UI, lore and Save2 extension must earn their own implementation evidence.
