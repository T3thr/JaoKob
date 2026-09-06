# CR-0003: Interactive Light Novel Presentation Contracts

| Document control | Value |
|---|---|
| ID / version | `CR-0003` / `1.0.0` |
| Status | **APPROVED — architecture/documentation baseline; implementation deferred** |
| Date | Created 2026-09-06; approved 2026-09-07 (Asia/Bangkok) |
| Author | GPT-6 Astra — Senior Software Engineer / Principal Systems Architect |
| Baseline | Runtime `70bac18`; governance HEAD `b07523c`; schema 1.1.0, content 2.0.0, save format 1 |
| Change class | C2 cross-layer presentation; C3 review for version compatibility and public Port changes |
| Execution plan | [Sprint 3 SSOT](../sprints/sprint-03-ssot.md) |
| Documentation PR | [#8](https://github.com/T3thr/JaoKob/pull/8) → develop; implementation PRs remain separate |
| Required approvers | PO, Tech Lead / Architecture, Narrative / Game Design for D5–D7, QA / Accessibility; rights review for production assets |

PO และ Tech Lead อนุมัติ CR-0003 D1–D8 ผ่าน **PO & TECH LEAD JOINT DIRECTIVE: SPRINT 3 ARCHITECTURAL APPROVAL**, 2026-09-07. มติ D5–D8 ด้านล่างแทนข้อเสนอเดิม โดยเฉพาะ D7 ที่เปลี่ยนจาก Bond absence เป็น Locked Chip. ดู [approval record](../changelog/2026-09/2026-09-07-0042-sprint-03-architecture-approval.md) และ [ADR-P0-015](../adr/ADR-P0-015-interactive-light-novel-presentation.md). การอนุมัตินี้ครอบคลุม design และ documentation commit/push/PR/squash merge สู่ develop เท่านั้น; implementation เริ่มใน Session ใหม่หลัง task DoR พร้อม. ไม่อ้างว่า QA, asset clearance หรือ runtime verification เสร็จแล้ว

## 1. Context, problem, goals and non-goals

[Tech Lead proposal](../proposals/phase-02-visual-novel-architecture/01-visual-novel-transformation-tech-lead-proposal.md) ขอเปลี่ยน reader เป็น Interactive Light Novel RPG ที่ให้พื้นที่กับภาพ ความเงียบ และความสัมพันธ์ โดยยังเป็นของขวัญส่วนตัว ไม่เพิ่มระบบเชิงพาณิชย์ เป้าหมายคือ scene environment ที่ author ตรวจได้, DOM ที่อ่านภาษาไทยได้ดี, เสียงที่ผู้เล่นควบคุม, และ exact Resume ที่ไม่ขึ้นกับสิ่งที่ adapter เคยเล่น

ข้อเท็จจริงจาก source: `explorationNode.backgroundAssetId` **มีอยู่แล้ว** ทั้ง schema 1.0 และ 1.1; ที่ขาดคือ environment ร่วมสำหรับ Cutscene/Exploration/Decision และ BGM/ambience. `dialogue.delivery.portraitAssetId`, `character.visualProfile.defaultPortraitAssetId` และ package `assets` ใช้ต่อได้. Package ปัจจุบันไม่มี assets และค่า music/ambience/effects เป็น **0/0/0**, master=1 ไม่ใช่ 0.7/0.8/0.9 ในตัวอย่าง proposal

ไม่เปลี่ยน domain state ทั้งหก, `TR-001`–`TR-020`, meter rules, flag/choice/dialogue/node IDs, dialogue order, checkpoint policy หรือ Canon outcomes. ไม่เพิ่ม Act 2, combat/inventory, voice acting/TTS, backend, telemetry, CDN, runtime dependency, Canvas engine, service worker หรือ asset editor ใน Sprint นี้

Trace: `FR-CNT-001`–`FR-CNT-006`, `FR-UI-001`–`FR-UI-005`, `FR-SET-001/003/004`, `FR-SAV-001/003/004/005/006/007/009`, `FR-ACC-001`–`FR-ACC-004`, `FR-LOC-001/003`, `NFR-US-003/005/006`, `NFR-PE-001`–`NFR-PE-005`, `GDD-MEC-001`–`GDD-MEC-006`, `GDD-BOND-005`, `GDD-UX-001`–`GDD-UX-007`. คำว่า `GDD-MET-*` ใน brief/proposal เป็นหมวดอธิบาย ไม่ใช่รหัส requirement ที่มีใน GDD

## 2. D1 — Scene binding: approved Option A, versioned additive extension

| Alternative | Benefit | Cost / disposition |
|---|---|---|
| A: node environment | Scene author เห็นภาพและเสียงใกล้ dialogue/choice; resolve จาก current node ได้โดยตรง | ต้อง version schema/catalog, ตรวจชนิด asset และ save compatibility; **selected** |
| B: external environment manifest | ไม่เพิ่ม field ใน narrative tree | ยังต้องมี schema/version/loader/rights/reference gate ใหม่; เสี่ยง mapping drift และไม่ได้หลีกเลี่ยง content-version impact |

สร้าง **สำเนาใหม่** ของ package/tree `v1.1.0` ภายใต้ `specs/schemas/v1.2.0/`; ห้ามแก้ root 1.0 หรือ published v1.1 files. เป็น additive capability สำหรับ reader ใหม่ ไม่ได้หมายความว่า reader 1.1 อ่าน 1.2 ได้. เพิ่ม `environment` เฉพาะ node types ที่ executor รองรับ: cutscene, exploration, decision. GameOver/Ending media นอก scope

### 2.1 Precise approved schema delta

เริ่มจาก deep copy ของไฟล์ [package 1.1](../../specs/schemas/v1.1.0/content-package.schema.json) และ [tree 1.1](../../specs/schemas/v1.1.0/narrative-tree.schema.json) แล้ว apply JSON Pointer operations ต่อไปนี้ **เฉพาะสำเนา 1.2**. ตาราง/JSON นี้เป็น diff specification ไม่ใช่ schema ที่ติดตั้งแล้ว

| Target copy | Operation / pointer | New value |
|---|---|---|
| Both | replace `/properties/schemaVersion/const` | `"1.2.0"` |
| Package | replace `/$id` | `"https://t3thr.github.io/JaoKob/specs/schemas/v1.2.0/content-package.schema.json"` |
| Tree | replace `/$id` | `"https://t3thr.github.io/JaoKob/specs/schemas/v1.2.0/narrative-tree.schema.json"` |
| Tree | add `/$defs/environment` | JSON definition below |
| Tree | add `/$defs/cutsceneNode/properties/environment` | `{"$ref":"#/$defs/environment"}` |
| Tree | add `/$defs/explorationNode/properties/environment` | `{"$ref":"#/$defs/environment"}` |
| Tree | add `/$defs/decisionNode/properties/environment` | `{"$ref":"#/$defs/environment"}` |
| Tree | add `/$defs/explorationNode/not` | `{"required":["backgroundAssetId","environment"]}` |

```json
{
  "type": "object",
  "properties": {
    "backgroundAssetId": {
      "$ref": "../common.schema.json#/$defs/identifier",
      "x-jaokob-reference": "asset.id"
    },
    "bgmAssetId": {
      "$ref": "../common.schema.json#/$defs/identifier",
      "x-jaokob-reference": "asset.id"
    },
    "ambientAssetId": {
      "$ref": "../common.schema.json#/$defs/identifier",
      "x-jaokob-reference": "asset.id"
    }
  },
  "additionalProperties": false
}
```

Package `/properties/narrativeTrees/items/$ref` คง `narrative-tree.schema.json` ซึ่ง resolve ไป sibling **1.2**; common/character/dialogue/event refs คง `../…` ไป root **1.0**. Package/tree versions ต้องตรงกัน. Required arrays, completion `oneOf`, flag policies, asset definition และ unknown-field rejection คงเดิมทั้งหมด. ไม่เพิ่ม `weather`, raw URL, CSS selector, duration expression หรือ arbitrary metadata. `environment: null` ไม่ valid; `{}` valid และมีความหมายชัดตามตารางถัดไป

### 2.2 Resolution and validation semantics

| Input | Deterministic desired presentation |
|---|---|
| `environment` ระบุ channel | Resolve ID นั้นจาก validated asset index |
| Channel ไม่ระบุ / `environment: {}` | Background ใช้ neutral stage; music/ambience หยุด ไม่มี inheritance จาก node ก่อนหน้า |
| ไม่มี environment แต่ exploration มี legacy `backgroundAssetId` | ใช้ภาพ legacy; audio silent |
| มีทั้ง legacy background และ environment แม้ `{}` | Reject schema; ไม่เลือกลำดับ precedence โดยเดา |
| Dialogue เปลี่ยนภายใน node | Environment คงเดิม; track เดิมไม่ restart |
| Resume / direct fixture entry | Resolve จาก saved current node + current dialogue + settings เท่านั้น |

Asset type ต้องตรง: background และ portrait/default portrait → `image`; BGM/ambience → `audio`. Missing ID หรือ wrong type เป็น `CONTENT_REFERENCE`/`CONTENT_SEMANTIC` ตาม existing error taxonomy และปฏิเสธ package ก่อนเล่น. Asset file 404/decode failure หลัง valid package เป็น media degradation; story ยังเล่นได้พร้อม fallback. แยก invalid contract ออกจาก unavailable media

Runtime schema catalog ต้องเพิ่มสำเนา 1.2 และ parity tests; validator version allowlist กับ content-runtime capability gate ต้องประกาศรองรับ 1.2 โดยตรง. Keywords ใน delta ใช้ subset เดิม (`not`, `required`, `$ref`, `properties`, `additionalProperties`) ไม่สมมติว่า validator รองรับทุก vocabulary ของ Draft 2020-12

Approved sprite policy: stage ใช้ default portrait ของ character ที่มี `narrativeRole=protagonist`; dialogue override ใช้กับ stage เมื่อผู้พูดเป็น protagonist เท่านั้น. Portrait ของ speaker อื่นอยู่ใน speaker badge; narrator ไม่มีรูปร่างไม่ถูกแสดงเป็นกบพูด. ไม่มี matching ID จากชื่อภาษาไทยหรือ filename convention. ไม่มี asset ให้ซ่อน sprite อย่างปลอดภัย. ใช้ neutral/curious/warm variants เฉพาะที่ Narrative อนุมัติ; expressive portrait ไม่เปลี่ยน meter หรือ dialogue

## 3. D2 — AudioPort and orchestration

กำหนด pure structural `AudioPort` ใน `src/core/ports/audio-port.js`; concrete `src/ui/audio/web-audio-adapter.js`; bootstrap เป็นผู้ประกอบและสั่ง adapter. ใช้ projection ของ accepted snapshot เช่นเดียวกับ ViewModel แล้ว bootstrap แยกส่งภาพไป RendererPort และ desired audio ไป AudioPort. **ไม่ให้ DOM Renderer import/call AudioAdapter และไม่เพิ่ม Core event bus**: ไม่มี domain consumer ที่ต้องใช้ event bus และการ replay event เพื่อคืนเสียงเสี่ยงเล่น effect ซ้ำ

Approved design contract สำหรับ materialize ใน Task 1/4:

| Method / input | Responsibility and result |
|---|---|
| `unlock()` | เรียก create/resume ใน trusted activation callback; async typed result `ready/blocked/unavailable` ไม่มี raw Event เข้า Core |
| `reconcile({sessionId, bgmAssetId, ambientAssetId, volumes, reducedIntensity})` | Idempotent desired loops; omitted channel = silence; รับ validated IDs/settings ไม่รับ browser objects |
| `playEffect({assetId, actionToken})` | Optional SFX หลัง accepted action เท่านั้น; dedupe bounded by session/revision/action |
| `suspend()` / `dispose()` | หยุด audible output เมื่อ hidden/ออก session; disconnect/release buffers เมื่อ dispose |

รายละเอียด method เป็น approved Port design API; ยังไม่ได้ implement; คง Storage/legacy caller compatibility; Renderer presentation contract เปลี่ยนเฉพาะตาม D7 และ media projection ที่อนุมัติ และ inject silent no-op adapter ใน tests/unsupported browser. Data resolver/fetch function ถูก inject จาก bootstrap จึงไม่มี UI→Data import. `AudioContext`, media objects, decode buffers และ clock สำหรับ fade อยู่ adapter เท่านั้น

**Gesture ordering:** callback ของ Start/Resume/Enable Sound ต้องเรียก `unlock()` ก่อนเข้าสู่ async dispatcher หรือ `await renderer.setBusy`. Bootstrap ปัจจุบัน await ก่อน handling intent จึงวาง unlock ไว้ภายใน transaction ไม่พอ. Unlock ไม่เปลี่ยนค่าระดับเสียงหรือ consent และ failure ไม่ขวาง New Game/Resume. การสร้าง/resume AudioContext จาก user gesture เป็นแนวทางที่ browser documentation ระบุ. [Web Audio autoplay guidance](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices#autoplay_policy)

หนึ่ง AudioContext: Music/Ambience/Effects GainNodes → MasterGain → destination. Crossfade **1,500 ms** เป็นค่า design baseline ใน adapter; schedule gain ramps แทน timer แก้ volume ทุก frame. Same IDs ไม่ restart เมื่อ advance text, settings rerender หรือเปิด/ปิด overlay. Cancel stale loads ด้วย generation token; rapid scene changes ไม่ให้ track เก่าที่ decode ช้ากลับมาเล่น. เก็บอย่างมากสอง voices ต่อ loop bus ช่วง fade แล้ว stop/disconnect ตัวเก่า

ค่า persisted zero ต้องคง zero. Title มี controls ให้ผู้เล่นเลือก volume แยกเอง; New Game defaults ยัง 1/0/0/0. Mute ใช้ master=0, restore last nonzero master เป็น transient adapter/UI preference ไม่เพิ่ม save field. Reduced intensity กำหนด cap effective music/ambience gain ที่ 50% ของค่าผู้เล่นและปิด sharp/transient SFX โดยไม่เขียนทับค่าที่บันทึก. เสียงไม่เป็นสัญญาณจำเป็นเพียงทางเดียว; ไม่มีเสียงพากย์หรือเสียงตัวอักษร

Visibility hidden ให้ suspend; visible เริ่ม desired loops ได้เมื่อ context อนุญาต มิฉะนั้นแสดง Enable Sound ที่เข้าถึงได้. Resume คืน **story position** อย่างแม่นยำ แต่เพลงเริ่ม loop ใหม่ได้ ไม่บันทึก audio playhead ใน save. Retry ใช้ settings ล่าสุด. Audio error เป็น typed nonfatal status, ห้าม throw เข้า fatal `PORT_FAILURE` path ของ bootstrap, ห้าม rollback domain/save และห้ามสะสม SFX ที่พลาดมาเล่นย้อนหลัง

## 4. D3 — Version compatibility, migration and rollback

Architecture Blueprint §13.3 บังคับเปลี่ยน content version เมื่อ asset manifest เปลี่ยน. จึงกำหนด **content 2.1.0**, package/tree schema **1.2.0**, nested catalogs **1.0.0**, save format **1**. ห้ามคง content 2.0.0 เพียงเพราะ graph ไม่เปลี่ยน และห้ามใช้การเทียบ major version แทน compatibility proof

| Source save/content | Target runtime/content | Approved admission design |
|---|---|---|
| format 1 / 2.1.0 | 1.2 / 2.1.0 | Exact validate + snapshot validation |
| format 1 / 2.0.0, no optional integrity | 1.2 / 2.1.0 | Explicit registered content migration หลัง compatibility proof; read-only preparation |
| format 1 / 2.0.0 with optional integrity | 1.2 / 2.1.0 | Unsupported by this narrow mapping; preserve raw/recovery, no stale digest or silent removal |
| format 1 / Mock 1.0.0 | 1.2 / 2.1.0 | No mapping; preserve raw, existing reset consent or memory-only |
| Unknown future / corrupt / mixed protected records | Any | Existing safe recovery; no overwrite/downgrade |
| format 1 / 2.1.0 | Original runtime / 2.0.0 | Incompatible; preserve records, no reverse migration inferred |

Approved mapping design ใน `src/data/migrations/content-2-0-0-to-2-1-0.js`:

1. Verify source save schema and supported source package; prove old/new graph, all stable IDs, condition/effect/flag policies, dialogue sequences and text, checkpoint/cursor rules and defaults equal except explicitly approved presentation fields/version/assets. Archive source fixture and comparison evidence; ไม่ยกเว้น gameplay fields เพื่อให้ diff ผ่าน
2. Pure clone: change envelope `contentVersion` จาก 2.0.0 เป็น 2.1.0 เท่านั้น. Keep `payload` ทุก field (metrics, flags, occurrences, progress viewed-ID recency, history, checkpoint, RNG, session/time), revision and settings. Schema ไม่มี nested contentVersion ใน checkpoint จึงไม่สร้าง field ใหม่. Current production writer ไม่สร้าง optional `integrity`; validator ตรวจรูปแบบ digest แต่ไม่ได้พิสูจน์ digest. Mapping รอบนี้จึงรับเฉพาะ source ที่ไม่มี integrity; digest-bearing source คืน `SAVE_MIGRATION` และรักษา raw ตาม recovery/consent flow. ไม่คง stale digest หรือลบ digest โดยเงียบ การรองรับกรณีนี้เพิ่มต้องมี verified canonicalization/digest contract ที่อนุมัติแยก
3. Validate clone against target save schema and target orchestrator, including exact cursor and causal prerequisites. Reapplying to target is no-op; unsupported versions fail safely. This is content compatibility mapping, not save-format `v1→v2`
4. Recovery remains read-only: select compatible candidates by existing deterministic revision rules; migration preparation ไม่เขียน/ลบ raw slots. Pass an explicit proven compatibility predicate through bootstrap **and adapter stage/commit guards**. Updating boot's equality alone is insufficient
5. On normal guarded save after Resume/accepted action, write target version with normal increasing revision/time/reason and staging/readback/backup/promotion. Source remains recoverable in backup; if another tab inserts invalid/future/unmapped record, preserve it and fall back to memory-only until explicit consent. Migration alone never clears owned keys

**Rollback:** before target saves exist, revert reviewed presentation commits. After 2.1 saves exist, use a reviewed compatibility-preserving rollback (presentation disabled with current compatible runtime) or disable writes when running 2.0; never raw-revert to a writer that could overwrite 2.1 saves. No automatic downgrade, no deletion of original backups. Rollback tests must introduce future/corrupt/concurrent records between preflight, stage and commit

D3 design ได้รับ joint approval; QA proof และ per-Task readiness ยังต้องทำจริง. If this narrow mapping cannot be proven, keep the affected implementation blocked for compatibility design. Do not silently replace it with mandatory New Game

## 5. D4 — Loading, layout and measurable performance

Detailed prefetch, DOM, accessibility and test budgets live in [SSOT §3.3–3.4 and §6](../sprints/sprint-03-ssot.md). Approved architecture uses async bounded loading, image decode-before-swap, current + one-hop prefetch, memory eviction, safe fallback, semantic DOM, and opacity/transform transitions. No all-Act preload or media awaited inside story commit. This is a design to measure, **not evidence that 60 FPS is already achieved**

## 6. D5–D8 — Official PO & Tech Lead decisions

| ID | Approved decision | Authority / status |
|---|---|---|
| D5 | Benchmark ขยายถึง Scene 3 `node.act1.home-focus` เป็น Interaction Acceptance Boundary; แสดงทั้งสามตัวเลือก `ว่ายตามแม่` / `อยู่ฟังรากบัว` / `อยู่กับพี่น้อง` ตาม stable choice IDs เดิม และตรวจผลใน `home-reflection`. ผลิต media Scene 1–2 และใช้ร่วมที่ handoff โดยไม่ดัดแปลง Canon | Joint directive 2026-09-07 / APPROVED |
| D6 | Playable Act 1 Scene 1–2 ใช้ **ลูกอ๊อดตัวน้อยที่มีลวดลาย/ผ้าผูกคอสีน้ำเงิน**; กบโตเสื้อน้ำเงินเป็น Title Screen / Branding mascot. คงการเติบโตตาม `NAR-CHR-001` / `NAR-WLD-005`; final artwork ยังต้องผ่าน provenance/art review | Joint directive 2026-09-07 / APPROVED |
| D7 | Top HUD Act 1 แสดง **Bond: Locked พร้อมไอคอนดอกบัวและแม่กุญแจ**. อนุมัติเปลี่ยน UI contract และ test expectations จาก absence เป็น locked presence โดยรักษา numerical non-disclosure และ domain Bond=0. Unlock gate คง Act 4 `NAR-SC-A4-004` | Joint directive 2026-09-07 / APPROVED |
| D8 | เลื่อน Full Log Backlog และ Animated Typewriter ไปหลัง benchmark; Reading Beats แบบกดอ่านสลับ Decision Crossroads 2–3 ใบตาม content จริง ไม่สร้าง choices ทุกคลิก. คง authoritative preface readiness, Exploration และ confirmation; FR-UI-004/GDD-UX-006 ยังเป็น partial/deferred | Joint directive 2026-09-07 / APPROVED |

### 6.1 D7 UI contract and regression transition

สำหรับ implementation Session ถัดไป: ViewModel ต้องแยกสถานะ Bond `locked` ออกจาก numeric meter; locked presentation ส่ง localized display/accessible label โดยไม่ส่งค่าตัวเลขให้ renderer. แสดงข้อความ `Bond: Locked` ผ่าน localization resource และ accessible description ภาษาไทย เช่น “ความผูกพัน: ยังไม่เริ่มต้น”. ดอกบัว/แม่กุญแจเป็น decorative icons เมื่อมีข้อความกำกับครบ; chip ไม่ใช่ปุ่มที่ไม่มี action และไม่ประกาศเป็น numeric meter/progressbar

ตรวจว่า Bond subtree และ accessibility tree ไม่มีตัวเลข/percentage, `aria-valuenow`, `aria-valuetext` ที่เผยค่า, tooltip หรือ data attribute ที่เผยค่า. Domain/save Bond ยัง 0 และไม่เพิ่ม effect หรือปลดล็อกก่อน `NAR-SC-A4-004`. ทดสอบสัญญา unlocked ใน fixture ที่ gate ถูกต้องเท่านั้น ไม่เพิ่ม Act 4 content ใน Sprint 3

แทน production Act 1 `noBond()` assertion ใน browser runner และ unit/VM/renderer expectations ที่เกี่ยวข้องด้วย **locked chip present + no numeric leak**; คง hidden-state fixtures ที่ยังใช้ได้และ invariant/12-route coverage ทุกกรณี. ห้ามเพียงลบ assertion เดิมหรือ skip test; บันทึก old expectation → D7 → replacement test trace. Documentation approval นี้ยังไม่แก้ test/source files และไม่กล่าวว่า Locked UI ถูก implement แล้ว

Target images approve aesthetic direction, not numerical mechanics, new prose, canon changes or production asset provenance. Human art/audio review must confirm warm green/gold pond, restrained texture, gentle presence, quiet space and readable Thai against both targets. Rejected desktop draft is a negative reference: no simultaneous persistent branding, epigraph, dialogue and decision pile-up

## 7. Security, privacy, rights and verification

Asset paths come from validated same-origin manifest with root/subpath resolution, traversal/redirect/origin checks and format/size bounds. `rights.sourceUrl` is provenance text, never a runtime fetch target. No remote font servers. Input strings and localized alt/controls use safe DOM APIs; no HTML from content. Private inspiration and proposal screenshots are not copied into release assets

Require SCHEMA/GRAPH/ARCH/CORE/STATE/SAVE/UX/A11Y/PERF/IP/SECURITY evidence enumerated in SSOT §6, including all 444 baseline cases and all 12 Act 1 routes, wrong asset types, no-path inheritance, degraded media, gesture denial, exact Resume, old/future/mixed saves, stale preload and rollback. Asset clearance is a repository delivery gate, not a legal opinion

## 8. Rollout and approval record

Order: approved RFC/SSOT → new-session implementation authorization + Task DoR → Task 1 contracts/version fixture → Tasks 2/3/4 on agreed boundaries → Task 5 integrated benchmark review → PO accepts benchmark before batch art for all seven scenes. Approved architecture is recorded in **ADR-P0-015**, extending ADR-P0-013/014; do not rewrite their historical rationale. GitHub Pages deployment/main promotion needs separate authorization and release gates

| Decision | Approver / date / evidence | Status |
|---|---|---|
| D1 schema; D2 audio; D3 migration; D4 performance | PO & Tech Lead joint directive, 2026-09-07; approval record above | APPROVED design; verification pending |
| D5 benchmark boundary; D6 life stage; D7 Bond; D8 UX scope | PO & Tech Lead joint directive, 2026-09-07 | APPROVED with §6 decisions |
| Documentation commit, push, PR and squash merge to develop | Same directive §3 | AUTHORIZED |
| Runtime implementation | Same directive §3.4: new Session only; task DoR still required | Deferred / not authorized this Session |

Planning edits have no runtime migration. Roll back this documentation change by removing/reverting only its documentation diff; retain original proposal and prior sprint records
