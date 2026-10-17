# Sprint 5 Readiness Assessment

ID `JKB-S5-ASSESSMENT-001`, version0.1.0, 2026-10-17 (Asia/Bangkok). Status: planning analysis for owner discussion. Baseline `develop@d1af293`; story/runtime delivery `4c0bd28`. [Execution SSOT](../../sprints/sprint-05-ssot.md) owns WBS/acceptance; [CR-0006](../../rfc/CR-0006-sprint-05-complete-story-and-package-boundaries.md) owns unresolved cross-layer options.

## 1. Evidence and source review

สำรวจ Markdown ใน `docs/` ทั้ง81ฉบับ รวม11,082บรรทัดด้วย path/title/status/heading/requirement inventory; [inventory](evidence/source-inventory.json) บันทึก SHA-256 ของ baseline แต่ละฉบับ เป็นหลักฐานการสำรวจ ไม่ใช่คำรับรองว่าเอกสารทุกประโยคยังถูกต้องหรือผ่าน human review อ่านเจาะแหล่งควบคุมและตรวจ implementation/consumers ที่เกี่ยวข้องตามตารางด้านล่าง ไม่ส่งภาพอ้างอิงส่วนตัวหรือ binary source เข้า production

| กลุ่มเอกสาร | ผลสังเคราะห์ที่นำมาใช้ |
|---|---|
| [Master manual](../../README.md), AGENTS, engineering guide/workflow/standards | ใช้ six-gate loop, approved requirement ก่อน source, new audit/PR, strict identity; routing เดิมยังชี้Sprint1/3จึงแก้ทางเข้าปัจจุบันใน planning |
| Phase0 charter/GDD/Narrative/SRS/Architecture | ห้าองก์, six states, deterministic metrics/guards, three endings/repair/replay, Thai/a11y, storage/versioning/budgets และ human sign-off |
| Directory plan/Git runbook/verification | owner-per-boundary, feature PR→develop, restricted static artifact/root+subpath/rollback; ไม่มี deployment authority จาก runbook อย่างเดียว |
| ADR013–015, CR0001/0003 และ Sprint1–3 | ที่มาของ validator, capability gate, exact cursor, staged writes, legacy2.0→2.1, renderer/media ports; scoped deferrals ไม่ใช่ full-game delivery |
| ADR016/017, CR0004 และ model-spike README/evidence references | childhood/adult มี editable candidate และ preview; production lifecycle/rights/device/heart embroidery ยังเป็นงานใหม่ |
| ADR018/019 | ADR018 superseded; tests/CLS ไม่แทนผลอ่านจริง; ADR019 คือ active UI authority |
| ADR020/021, CR0005, S4 proposal/SSOT/design contracts/trace | สี่ช่อง, distinct item states, exact content3 vs archived2.1, living frog/poetic mirror, dignified reachable DAWN, zero duplicate authored blocks |
| [Act2–5 map](../sprint-04-overhaul/05-act-2-5-map-and-endings.md) | scene anchors/route convergence, six-object combined registry, C paths, draft recovery, girl mutual learning, gift staging และ red-heart art gap |
| Changelog Aug/Sept/Oct, organization/proposal/raw indexes | ประวัติการอนุมัติ/merge/สิ่งยังไม่ตรวจ; historical plan statuses ไม่ใช่ current runtime truth; latest closeout supersedes earlier “PR17 pending” |

Prior session supplied by PO: `01a1410f-d431-7d63-b73e-7fcce5564b22`. Current Git and committed evidence are the reproducible implementation baseline; old chat/tool output is context, not new authorization or substitute for actual source inspection.

Fresh baseline: **1,060/1,060** existing tests, no fail/cancel/skip/todo,26,908.413791ms. Design check:7anchors/20edges,1,096scenario-trajectories across8contexts,8named witnesses. [Verification manifest](evidence/planning-verification.json) records commands/raw hashes and explicit unrun gates; [design report](evidence/ending-trajectories.json) includes intermediate metrics and choice IDs. No new runtime behavior was tested or claimed.

## 2. Engineering findings from actual source

| Source | Observed fact | S5 implication |
|---|---|---|
| [content-runtime.js](../../../src/data/content/content-runtime.js) `prepareRuntimeContent` | accepts schema1.1/1.2/2, one tree≤256nodes; every node act1 and cutscene/exploration/decision; bounded non-replayable voiced slots | Multi-act/ending/recovery capability must be implemented and explicitly admitted; don't remove guards without replacements |
| [content-orchestration.js](../../../src/core/use-cases/content-orchestration.js) | `STATES` has3node types; applyEffects rejects crisis; saved facts require Bond0; unlockedEndingIds must be empty; one checkpoint | Existing lower-level state/transaction tests are not live GameOver/Ending/replay functionality |
| [choice-transaction.js](../../../src/core/use-cases/choice-transaction.js), state machine | already has crisis/Assist/ending transition logic | Reuse pure policies and supply final/recovery context correctly; don't write a second ad-hoc ending formula in UI |
| [content-sessions.js](../../../src/bootstrap/content-sessions.js) | map keyed by catalog.version; primary/legacy bound to3.0/2.1; lazy2.0 proof chain | Add story identity before future same-version stories; preserve lazy exact continuations |
| [index.js](../../../src/bootstrap/index.js) | sequential commands, view revisions, protected writes, read-only Resume; no live retry/replay/end commands; excludes storyAssist from Settings updates | Preserve concurrency/save safeguards while wiring real later-state intents and controls |
| [act1-pouch-policy.js](../../../src/data/content/act1-pouch-policy.js) | branches on schema2/content3 or legacy2.1; named leaf/history/opportunity bindings | Normalize new package-owned item policy; keep legacy bridge specific, keep story IDs outside Core |
| [content-view-model.js](../../../src/data/content/content-view-model.js) | always locked Bond for active snapshot; filters Bond changes | Implement authored A4-004 gate for DOM/AX/toasts/log; no earlier numerical disclosure |
| [content-presentation.js](../../../src/data/content/content-presentation.js) | default protagonist portrait; dialogue override only when that protagonist speaks; media key uses contentVersion | Growth under narration and package-scoped cache/async identity need explicit staging data |
| [presentation-catalog.js](../../../src/data/content/presentation-catalog.js) | strict optional decoration;64,000byte limit; invalid catalog can fail soft | Keep controls playable when decoration fails; size authored catalogs before deciding partition/new bounds |
| [act-01.json](../../../src/data/content/packages/act-01.json) | published3.0 has five natural items, living tadpole/family/blocked return and fixed optional moments | Preserve exact bytes for archive; no retroactive red yarn, new items or rewritten mid-read cursor |
| [save2 schema](../../../specs/schemas/v2.0.0/save-state.schema.json) | strict envelope/payload/checkpoint; history/progress bounded; no explicit chapter snapshot collection | Identity/replay extension requires deliberate version decision; don't hide snapshots in flags/history |
| [artifact checker](../../../tests/release/verify-static-artifact.mjs) | pins S4 manifest and rollbackbc167d3; bans GLB/vendor/models | New S5 allowlist required; do not loosen old checker globally or deploy docs/spike source |

Risk priority: package/save/replay and runtime capability first; Act3 low-meter recovery second; literary continuity and equal endings throughout; gift source art/device review scheduled early. UI style tweaks alone cannot resolve these dependencies.

## 3. Narrative assessment

จุดแข็งของ Act1 ฉบับจริงคือครอบครัวมีการกระทำที่จำได้: แม่ดุนใบที่ติดหาง, ตัวหางไวแซงแล้ววกกลับ, ตัวชอบดุนของทำเปลือกหลุด, หางหลายตัวถอยออกจากเปลือกใหญ่จนปัดจมูก พายุมีราก/ตะกอน/แรงน้ำและทางกลับที่ตันจริง การส่งต่อควรเรียกภาพเหล่านี้ในสถานการณ์ใหม่ แทนการให้ตัวละครอธิบาย theme ซ้ำ

**Closure ที่เสนอ:** เจ้ากบค่อยนำการสังเกตน้ำและรากไปอ่านเมือง จากนั้นใช้ความสามารถนั้นอ่านระยะมือ/เงาของเด็กหญิง ตอนจบจึงเป็นการเลือกที่อยู่โดยรู้ว่าร่างกายต้องการอะไรและทางออกอยู่ตรงไหน DAWN, NEARBY และ HOME ตอบคำถามนี้ได้คนละรูป ไม่จำเป็นต้องเท่ากันด้วยจำนวนคำ แต่ต้องมีภาพชีวิต ความสามารถ และวันถัดไปที่พออยู่ได้เท่ากัน

ชะตาแม่/พี่น้องยังไม่ทราบตาม NAR-CAN-002 การปิดปมคือให้ความผูกพันมีหน้าที่ต่อชีวิตปัจจุบัน ไม่สร้างการพบกันใหม่หรือเฉลยความตายเพื่อบังคับ closure เส้นด้ายแดงเชื่อมผิวสัมผัสของวัสดุจาก A2 ไปผ้าที่ A4/5 โดยไม่จำเป็นต้องอ้างว่าเด็กหญิงทำตก

**Convergence A3-003:** topology แบบ foldback เหมาะกับพื้นที่อารมณ์ของเรื่อง หากกออ้อ/ท่อให้ cue และผลทางกายต่างกันจริง แล้วกลับมาริมทางเดียวกันโดยเก็บ route facts ผู้เล่นยังรับรู้ว่าการเลือกมีความหมาย ต้องพิสูจน์ทุก continuing path รวม optional moments ผ่านจุดร่วม; การ reset state ทั้งสองทางให้เท่ากันจะทำลาย agency แม้กราฟดูสะอาด

**Ending distribution:** 114 empty-pouch design paths แจกแจง HOME36/NEARBY57/DAWN21 เป็น reachability ไม่ใช่ playtest probability ไม่มีเหตุให้บังคับสามจำนวนเท่ากันหรือเติม Bond ให้ HOME พบง่ายโดยปิด DAWN เกณฑ์สำคัญคือผู้เล่นเห็นเจตนาตัวเลือกก่อนกด, safe choices มีจริง, cautious repair มีงบ, และ zero-Bond paths ไม่ถูกบรรยายอย่างน่าสงสาร ผล design เริ่ม A4 ไม่ได้รวมความเสียหาย/การฟื้นจากAct1–3 ต้องเพิ่ม whole-game witnesses

**ภาษา:** ตรวจ exact duplicate prose/result blocks พร้อมรายงานคำซ้ำให้บรรณาธิการอ่านตามบริบท ไม่ตั้ง arbitrary word quota เพื่อไล่คำธรรมดาออกทุกครั้ง ให้ดูแรงจูงใจ สัมผัส เวลา และผู้ที่รู้ข้อมูลจริงในฉาก การอ่านออกเสียง/อ่านบนมือถือและการทวนทั้งเส้นสำคัญกว่าคะแนน lint ไม่มี emoji, U+2013/U+2014 หรือ narrator meta-talk ในภาษาไทยตาม ADR19/21

**รายการต้องแก้ผ่าน contract:** map A3 recovery ยัง draft; leaf physical sharing กับ legacy acquired flag ต้องมี held guard; A4 self-reliant routeต้องรักษา Bond0แม้รับรู้ compassion; mother memory ต้องอ้างประสบการณ์จริง; map descriptive tier70ไม่ใช่ permission เปลี่ยน HUD tier80 ทั้งหมดอยู่CR-0006 D3

## 4. Sensory, UI และ production media

แต่ละ scene brief ต้องระบุ dominant sense, supporting cue, available choice, consequence, decompression และสื่อที่ใช้แทนเมื่อเสียง/ภาพหาย ไม่บังคับทุกฉากมีสื่อใหม่หลายชิ้นจนใช้งบหมด พื้นร้อนต้องเห็นทางเงาก่อนเลือก ภัยถนนใช้แรงสั่นและล้อในระยะ ไม่ใช้ความเจ็บเป็นทางลัดสร้างความสงสาร เด็กหญิงเรียนรู้จากขาที่หด/สายตา/ระยะถอย ไม่พูดให้เข้าใจแทนพฤติกรรม

Presentation seam มีอยู่แล้วผ่าน view model และ catalog ควรขยายทีละความสามารถ ไม่รื้อ Core เพื่อปรับขนาดกระดาษ ช่องไฟ หรือ crop เก็บ CSS pagination/focus/animation ใน UI; semantic cursor/effects ใน Core; content validation/localization ใน Data การทดสอบ rendererสองรูปแบบด้วยคำสั่งเดียวกันต้องให้ story result เท่ากัน ส่วน History receiptต้องเก็บเฉพาะข้อความที่คนอ่านเห็นหลัง reflow

Grand Keepsake มีสองงานที่ต้องแยกตรวจ: คุณภาพ/สิทธิ์/รูปหัวใจของ asset และ lifecycle/performance/การเข้าถึงของ viewer การมี GLB validator0errors ไม่พิสูจน์ว่าเสื้อปักหัวใจแล้วหรือว่าโทรศัพท์เปิดได้ดี spikeเดิมต้องคงเป็นหลักฐานรุ่นนั้น งาน productionสร้างไฟล์รุ่นใหม่และposterที่สื่อของขวัญครบ แม้3Dใช้ไม่ได้

## 5. Primary-source research used in this plan

Accessed 2026-10-17. External documentation supports engineering checks; it does not approve project Canon, dependency choice or aesthetics. The implementation implications below are recommendations derived from the sources and repository constraints.

| Primary source | Verified point | Application to S5 |
|---|---|---|
| [W3C: Text Spacing](https://www.w3.org/WAI/WCAG22/Understanding/text-spacing.html) | Text-spacing override must not lose content/function; the listed values are not mandated default typography, with language/script applicability considered | Test overrides and Thai diacritics; don't call a particular default leading “WCAG-certified” or force inappropriate word spacing |
| [W3C: Reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html) | Reflow is assessed at equivalent320CSSpx for vertical content;1280px at400%zoom is a common test condition | Real zoom/reflow + long Thai checks; a fixed bottom reading baseline cannot justify hidden controls/text |
| [MDN: Storage quotas and eviction](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria) | Browser storage has quota/private-mode/deletion limits; writes can fail | Keep bundled canonical source independent of browser storage; continue testing quota/raw-record protection; no promise of permanent local saves |
| [JSON Schema: Structuring schemas](https://json-schema.org/understanding-json-schema/structuring) | `$id` identifies schema resources and supplies a base for references; compound resources can be modular | Explicit versioned schema identity/local registry; modular authoring does not by itself solve story identity or authorization |
| [model-viewer: Loading examples](https://modelviewer.dev/examples/loading/) | Official loading examples provide a starting point for examining viewer loading behavior | Candidate research only; pin/version/network/lifecycle/budgets still require production RFC and actual measurement |

## 6. Honest readiness and next decision

พร้อมสำหรับ review แผนและเริ่มงานสัญญาเมื่อได้รับคำสั่งดำเนินการ ยังไม่พร้อมเรียก full-game source DoR ว่าครบโดยใช้ยอด tests เดิมแทน คำตัดสินที่คุ้มค่าต่อการทบทวนก่อนคือ D1/D2 package+save/replay, D3 draft authored rules, D6 remaining release capabilities และ D4ก่อนviewer UI preference ใหม่รอผลผู้เล่นตามD5ได้โดยไม่หยุดการเขียนแผน/บทที่ไม่พึ่งคำตอบนั้น

Migration/rollback รอบนี้เป็นเอกสารเท่านั้น; no runtime/schema/content/assets change. รายการที่ไม่ได้ตรวจใหม่: browser/schema reference/static artifact/device/AT/GPU/listening/human narrative and player feedback. ไม่ประกาศผ่านจาก S4หรือmodel spike แต่ส่งต่อเป็น gateที่มีเจ้าของในSSOT
