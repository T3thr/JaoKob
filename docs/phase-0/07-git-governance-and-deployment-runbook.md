# Git Governance และ Deployment Runbook

## 1. การควบคุมเอกสาร

| รายการ | ค่า |
|---|---|
| โครงการ | JaoKob |
| รหัสเอกสาร | JKB-P0-GIT-001 |
| เวอร์ชัน | 0.1.0 |
| สถานะ | Proposed Phase 0 Baseline |
| เจ้าของเอกสาร | Quality and DevOps Specialist |
| ผู้อนุมัติร่วม | Senior Software Architect, Product Owner |
| Repository เป้าหมาย | `https://github.com/T3thr/JaoKob` |
| วันที่ตรวจเอกสาร GitHub ล่าสุด | 2026-08-31 |

เอกสารนี้เป็น Runbook สำหรับการปฏิบัติในอนาคต ไม่มีคำสั่งใดในเอกสารนี้ได้รับอนุญาตให้ Execute โดยอัตโนมัติใน Phase 0 และเอกสารนี้ไม่ยืนยันสถานะจริงของ Local Git, Remote Repository, Branch Protection, GitHub Actions, GitHub Pages, Billing Plan หรือ Deployment

GitHub เปลี่ยนหน้าจอ สิทธิ์ Action Version, Runner และนโยบายบริการได้ ก่อนเชื่อม Remote, เปิด Ruleset, สร้าง Workflow หรือ Deploy ทุกครั้ง ผู้ปฏิบัติต้องตรวจเอกสารทางการฉบับปัจจุบันและสถานะ Repository จริง ห้ามใช้ Runbook นี้แทนการตรวจสอบ Live State

## 2. เป้าหมาย Governance

1. ทุกการเปลี่ยนแปลงเชื่อมกลับไปยัง Requirement ID และผ่าน Review ตาม Ownership
2. `main` อยู่ในสภาพ Releaseable และไม่มีการ Push โดยตรง
3. Commit และ Pull Request มีขนาดเล็ก ย้อนกลับได้ และไม่รวมงานหลายวัตถุประสงค์
4. Release และ Content Contract มี Version ที่แยกความหมายชัดเจน
5. GitHub Pages Deploy เฉพาะ Static Artifact ที่ผ่าน Quality Gate
6. ใช้บริการระดับ Free และ `GITHUB_TOKEN` ด้วย Least Privilege โดยไม่มี Runtime Secret
7. Rollback ใช้ Revert และ Audit Trail ห้าม Rewrite Shared History

## 3. Operating Assumptions

- Runtime เป็น Pure HTML5, CSS3 และ JavaScript ES Modules
- ไม่มี Build Service, Backend, Database, Login, Analytics หรือ Monetization
- เป้าหมาย Zero-cost ตั้งอยู่บนสมมติฐานว่า Repository เป็น Public และข้อกำหนด GitHub Free ยังรองรับ Pages และ Actions ตามที่ต้องการ
- Project Pages URL โดยทั่วไปอยู่ภายใต้ Path ของ Repository เช่น `/<repository>/` จึงต้องใช้ Relative URL หรือ Base-path Strategy ที่ผ่านการทดสอบ
- Release Artifact ต้องไม่รวมเอกสารภายใน Test, Agent Instruction, Git Metadata หรือไฟล์ตั้งค่าที่ไม่จำเป็น
- หาก Repository หรือ Plan จริงไม่ตรงสมมติฐาน ต้องหยุดและทบทวน Cost, Privacy และ Deployment ADR

## 4. Branch Strategy

ใช้ Trunk-based Development กับ Short-lived Branch

| Branch หรือ Ref | วัตถุประสงค์ | อายุเป้าหมาย | Merge Policy |
|---|---|---|---|
| `main` | Integration และ Release Source | ถาวร | Pull Request เท่านั้น |
| `feat/<id>-<slug>` | Feature ที่ผูก Requirement | สั้น | Squash Merge |
| `fix/<id>-<slug>` | Defect Correction | สั้น | Squash Merge |
| `docs/<id>-<slug>` | เอกสารและ Spec | สั้น | Squash Merge |
| `refactor/<id>-<slug>` | Refactor ที่ไม่เปลี่ยนพฤติกรรม | สั้น | Squash Merge |
| `test/<id>-<slug>` | เพิ่มหรือแก้ Verification | สั้น | Squash Merge |
| `chore/<slug>` | Maintenance ที่ไม่ใช่ Product Behavior | สั้น | Squash Merge |
| `release/<version>` | Stabilization เฉพาะเมื่อมีเหตุผล | ไม่เกินรอบ Release | Merge กลับ `main`; ห้ามเป็น Long-lived Fork |
| `vMAJOR.MINOR.PATCH` | Annotated Release Tag | ถาวรและ Immutable | ห้ามย้ายหรือใช้ซ้ำ |

Branch Name ใช้อักษรอังกฤษตัวเล็ก ตัวเลข ขีดกลาง และ Requirement หรือ Change ID ที่เกี่ยวข้อง เช่น `feat/fr-sta-003-decision-guard`

ห้ามสร้าง Branch แยกตามบุคคล ห้ามเก็บ Integration Branch ระยะยาว และห้าม Force Push ไปยัง Shared Branch หากจำเป็นต้องแก้ Topic Branch ส่วนบุคคล ต้องตรวจว่าไม่มีผู้ใช้งานร่วมและได้รับอนุญาตก่อน

ข้อยกเว้นเดียวของกฎ Pull Request สำหรับ `main` คือ Bootstrap ครั้งแรกไปยัง Remote ที่ตรวจยืนยันแล้วว่าไม่มี Ref ใดเลย เพราะยังไม่มี Base Branch สำหรับสร้าง Pull Request ข้อยกเว้นนี้ต้องได้รับ Human Approval แยก บันทึก Commit SHA และเปิด Ruleset ทันทีหลัง Push สำเร็จ การ Push ครั้งถัดไปต้องผ่าน Pull Request ตามปกติ

## 5. Ruleset สำหรับ `main`

เมื่อ Repository พร้อม ให้ผู้มีสิทธิ์ Admin กำหนด Repository Ruleset โดยตรวจความสามารถตาม GitHub Plan ปัจจุบัน

กฎขั้นต่ำที่แนะนำ

1. Require a Pull Request before merging
2. Require Required Status Checks ที่มีอยู่จริง
3. Require Conversation Resolution
4. Block Force Pushes
5. Block Branch Deletion
6. Require Linear History เมื่อเลือก Squash Merge
7. Dismiss Stale Approval เมื่อ Diff เปลี่ยนอย่างมีนัยสำคัญ
8. Require Approval of the Most Recent Reviewable Push เมื่อทีมมี Reviewer
9. จำกัด Bypass เฉพาะ Break-glass Maintainer และต้องมี Incident Record

เมื่อทีมมีผู้ตรวจอิสระอย่างน้อยสองคน ให้กำหนด Approval อย่างน้อยหนึ่งรายและใช้ CODEOWNERS ตามตาราง Ownership ใน JKB-P0-DIR-001 หากเป็นผู้ดูแลเพียงคนเดียว ให้ยังคงบังคับ Pull Request, Status Check และ Checklist เป็น Audit Trail และบันทึกข้อยกเว้นการไม่มี Independent Approval ห้ามสร้าง Approval ปลอม

ชื่อ Required Check ต้องเลือกจาก Job ที่เคยรายงานผลจริง GitHub ไม่ผูก Required Check กับชื่อ Workflow เพียงอย่างเดียว จึงต้องตรวจ Job Name ใน Live Repository ก่อนตั้งค่า

## 6. Conventional Commits

รูปแบบบังคับ

~~~text
<type>(<scope>)!: <summary>

<body>

Refs: <requirement-or-change-id>
BREAKING CHANGE: <migration-and-impact>
~~~

`!` และ `BREAKING CHANGE` ใช้เฉพาะเมื่อมี Breaking Contract

### 6.1 Type

| Type | ใช้เมื่อ |
|---|---|
| `feat` | เพิ่มพฤติกรรมที่ผู้เล่นหรือระบบสังเกตได้ |
| `fix` | แก้พฤติกรรมที่ขัด Requirement |
| `docs` | แก้เอกสารโดยไม่เปลี่ยน Runtime |
| `refactor` | เปลี่ยนโครงสร้างโดยไม่เปลี่ยนพฤติกรรม |
| `test` | เพิ่มหรือแก้ Test เท่านั้น |
| `perf` | ปรับ Performance โดยรักษาพฤติกรรม |
| `build` | เปลี่ยน Build หรือ Packaging |
| `ci` | เปลี่ยน Automation |
| `chore` | Maintenance ที่ไม่เข้ากลุ่มอื่น |
| `revert` | ย้อน Commit ด้วย Audit Trail |

### 6.2 Scope

Scope มาตรฐาน ได้แก่ `core`, `state`, `ui`, `data`, `content`, `save`, `i18n`, `a11y`, `docs`, `schema`, `assets`, `ci` และ `release`

ตัวอย่าง

~~~text
docs(phase-0): establish specification baseline

Refs: CR-20260831-001
~~~

~~~text
feat(state): enforce guarded transition to ending

Refs: FR-STA-003, TR-014
~~~

Commit ต้อง Atomic, Subject เป็น Imperative English ที่กระชับ และ Body อธิบาย Why เมื่อ Diff ไม่สามารถสื่อได้ ห้ามใส่ Secret, Personal Data หรือ Generated Noise

## 7. Pull Request Standard

Pull Request Title ต้องเป็น Conventional Commit เพื่อให้ Squash Commit สม่ำเสมอ Description ต้องมีส่วนต่อไปนี้

~~~markdown
## Summary

## Requirement and change IDs

## Scope

## Non-goals

## Change classification

- [ ] C0 Editorial
- [ ] C1 Non-breaking
- [ ] C2 Behavioral
- [ ] C3 Breaking
- [ ] C4 Emergency

## Acceptance evidence

## Architecture, narrative and data impact

## Save, schema and content compatibility

## Accessibility and localization

## Security, privacy and asset provenance

## Verification performed

## Verification not performed

## Rollback

## Risks and follow-up

## Checklist

- [ ] Definition of Ready was satisfied
- [ ] Requirement-to-test trace is updated
- [ ] No unrelated files or secrets are included
- [ ] Required owners reviewed the change
- [ ] Definition of Done is satisfied
~~~

PR ที่แก้ UI ต้องมี Evidence ของ Responsive State, Keyboard Focus และ Reduced Motion ตามความเสี่ยง PR ที่แก้ Narrative ต้องระบุ NAR ID และ Canon Approval PR ที่แก้ Schema หรือ Save ต้องมี Compatibility Matrix, Migration Fixture และ Rollback

## 8. Quality Check Topology

ชื่อด้านล่างเป็น Target Name ไม่ใช่คำยืนยันว่าสร้าง Workflow แล้ว

| Target Job | หน้าที่ | Required เมื่อ |
|---|---|---|
| `quality-docs` | Link, Markdown, Mermaid, ID และ Version | ทุก PR ที่แก้เอกสาร |
| `quality-schema` | JSON Parse, Meta-schema, Valid and Invalid Fixture | แก้ Schema หรือ Content |
| `quality-unit` | Core Unit และ Invariant | แก้ Core |
| `quality-transition` | State Transition Coverage | แก้ State, Event หรือ Narrative Branch |
| `quality-persistence` | Save, Load, Corruption และ Migration | แก้ Save หรือ Schema |
| `quality-a11y` | Automated Accessibility และ Critical Manual Evidence | แก้ UI |
| `quality-e2e` | Critical Journey และ Browser Matrix | Release Candidate |
| `quality-artifact` | Static Artifact Allowlist, Secret และ Link | ทุก Pages Deployment |

หลักการ Fail Closed มีดังนี้

- Missing Test, Missing Fixture, Missing Requirement Link หรือ Unknown Schema Version ต้องทำให้ Gate ไม่ผ่าน
- Flaky Test ห้าม Retry จนผ่านโดยไม่เปิด Defect
- Skip ของ Critical Test ต้องมี Time-bound Exception และ Approver
- Pages Deploy ต้องขึ้นกับ Quality และ Packaging Job ห้าม Deploy โดยไม่รอ Artifact

## 9. Versioning Model

### 9.1 Application Release

ใช้ Semantic Versioning รูปแบบ `MAJOR.MINOR.PATCH`

- `MAJOR` เพิ่มเมื่อ Compatibility ที่ประกาศไว้แตกและมี Migration หรือ Upgrade Guidance
- `MINOR` เพิ่มเมื่อมี Feature ที่เข้ากันได้
- `PATCH` เพิ่มเมื่อแก้ Defect โดยไม่เพิ่ม Contract ใหม่
- ก่อน 1.0 ให้ถือ Minor Change ว่าอาจมี Breaking Change แต่ยังต้องประกาศ `BREAKING CHANGE` และมี Migration

Phase 0 Document Baseline อาจใช้ Annotated Tag `phase0-v0.1.0` หลังได้รับอนุมัติ ส่วน Runtime Release ใช้ `v0.1.0` เป็นต้น ห้ามใช้ Tag เดียวแทนสองความหมาย

### 9.2 Content Version

Content Package ใช้ Semantic Version แยกจาก Application

- Content Patch แก้ข้อความหรือ Metadata โดยไม่เปลี่ยน Branch Semantics
- Content Minor เพิ่ม Scene, Dialogue หรือ Branch ที่ยังเข้ากับ Contract
- Content Major เปลี่ยน Stable ID, Required Flag, Canon Structure หรือ Compatibility

ทุก Save ต้องสามารถระบุ Content Version ที่สร้าง Save ได้ การอัปเดต Content ที่ทำให้ Save เดิมอ้าง Node ไม่ได้เป็น Breaking Change และต้องมี Migration หรือประกาศไม่รองรับอย่างชัดเจน

### 9.3 Schema Version

ใช้สองค่าแยกกัน

1. Content Contract ใช้ Semantic `schemaVersion` ตาม Schema Catalog และ `$id` ที่คงที่เพื่อระบุตระกูล Contract
2. Save Envelope ใช้ Positive Integer `saveFormatVersion` แบบเพิ่มขึ้นเพื่อเลือก Migration Function อย่างแน่นอน

ห้ามแก้ความหมายของ Schema Version ที่เผยแพร่แล้วในที่เดิม ห้ามลดเลข Version และห้ามใช้ Application Version แทน `saveFormatVersion`

### 9.4 Compatibility Matrix

Release Candidate ต้องบันทึกอย่างน้อย

| App Version | Content Version Range | Save Format Input | Save Format Output | Migration | Rollback Constraint |
|---|---|---|---|---|---|
| ระบุเมื่อ Release | ระบุเมื่อ Release | ระบุเมื่อ Release | ระบุเมื่อ Release | รหัส Migration | เงื่อนไขการย้อน |

## 10. Release Process

1. กำหนด Release Scope จาก Requirement ID และ Defect ID
2. สร้าง Release Candidate จาก Commit บน `main` ที่ผ่าน Required Checks
3. Freeze Schema, Content ID และ Localization Key สำหรับ Candidate
4. รัน Quality Gate, Browser Matrix, Save Migration, Accessibility และ Static Artifact Inspection
5. ตรวจ Version Matrix, Changelog, License และ Asset Provenance
6. เปิด Release PR ที่ระบุ Rollback Commit Strategy
7. หลัง Merge ให้ตรวจว่า Tag จะชี้ Commit เดียวกับ Artifact
8. สร้าง Annotated Tag และ GitHub Release หลังได้รับ Human Approval
9. Deploy ด้วย GitHub Pages Environment
10. Smoke Test จาก Published URL รวม Base Path, Asset, Start, Save, Reload, GameOver และ Ending Path ที่เลือก
11. บันทึก Deployment URL, Commit SHA, Artifact ID, Workflow Run และผล Smoke Test
12. ปิด Release เมื่อ Monitoring Window จบและไม่มี Critical Incident

ห้ามเลื่อน Tag เดิมไปยัง Commit ใหม่ หาก Release ผิดให้สร้าง Patch Version หรือ Revert

## 11. การเชื่อม Local Workspace กับ GitHub

### 11.1 Preflight แบบ Read-only

ดำเนินการหลังได้รับอนุญาตและมี Network Access เท่านั้น

~~~bash
git --version
git rev-parse --is-inside-work-tree
git status --short --branch
git remote -v
git ls-remote --symref https://github.com/T3thr/JaoKob.git HEAD
git ls-remote https://github.com/T3thr/JaoKob.git
~~~

คำสั่งบางรายการอาจรายงาน Error ตามปกติเมื่อ Directory ยังไม่เป็น Git Repository ให้บันทึกผลจริงและเลือกกรณีด้านล่าง ห้ามสรุปว่า Remote ว่างจากการที่ Network หรือ Authentication ล้มเหลว และห้ามใช้ผลของ `HEAD` เพียงรายการเดียวตัดสินว่าไม่มี Branch, Tag หรือ Ref อื่น

### 11.2 กรณี Remote มีประวัติอยู่แล้ว

วิธีที่ปลอดภัยที่สุดคือ Clone ประวัติจริงไปยัง Directory ใหม่ แล้วนำ Artifact ที่ได้รับอนุมัติมาใช้ซ้ำผ่าน Patch หรือ Commit ที่ตรวจสอบได้

~~~bash
git clone https://github.com/T3thr/JaoKob.git JaoKob
cd JaoKob
git switch -c docs/phase-0
~~~

ตรวจ `origin/main`, Default Branch, License และไฟล์เดิมก่อนนำงานเข้า ห้าม `git push --force`, ห้ามใช้ `--allow-unrelated-histories` เพื่อแก้ปัญหาโดยอัตโนมัติ และห้ามทับไฟล์ Remote โดยไม่ Review

หาก Local Directory เป็น Git Repository อยู่แล้ว

~~~bash
git remote get-url origin
git fetch --prune --tags origin
git log --oneline --decorate --graph --all -n 30
~~~

ต้องยืนยันว่า URL ตรงกับ Repository เป้าหมายและประวัติมี Common Ancestor ก่อนสร้าง Branch หากไม่มี Common Ancestor ให้หยุดและขอ Maintainer ตัดสินวิธี Reconciliation

### 11.3 กรณี Remote ว่างจริงและ Local Directory ยังไม่มี Git

ทำเฉพาะเมื่อคำสั่ง `git ls-remote` ทั้งแบบตรวจ `HEAD` และแบบแสดง Ref ทั้งหมดสำเร็จโดยไม่มี Ref ใด และผู้มีสิทธิ์ยืนยันว่า Repository เป้าหมายเป็น Remote ที่ต้องการจริง

~~~bash
git init -b main
git add .gitignore README.md AGENTS.md .agents docs specs
git status --short
git diff --cached --check
git diff --cached --name-only
git diff --cached --stat
~~~

ก่อน Commit ต้องตรวจ staged file list ทีละรายการ ตรวจ License และรัน repository-approved secret scan กับ staged content หาก secret scanner ยังไม่ถูก materialize ให้หยุดและกำหนดเครื่องมือผ่าน governance ก่อน ห้าม Commit แล้วจึงค่อย scan

หลังการตรวจทั้งหมดผ่านจึงดำเนินการต่อ

~~~bash
git commit -m "docs(phase-0): establish specification baseline"
git remote add origin https://github.com/T3thr/JaoKob.git
git remote -v
~~~

ก่อน Push ให้ตรวจ Commit, Author, Email, Remote URL, Visibility และผล Secret Scan อีกครั้ง การ Push ครั้งแรกเป็น External Mutation และต้องได้รับ Human Approval แยกต่างหาก

~~~bash
git push --set-upstream origin main
~~~

หากมี `origin` อยู่แล้ว ห้ามใช้ `git remote set-url` โดยเดา ให้ตรวจ Owner และขออนุมัติก่อนเปลี่ยน ห้ามใส่ Personal Access Token ใน URL หรือ Command History

### 11.4 Authentication

ใช้ Git Credential Manager, GitHub CLI หรือ SSH Key ที่จัดการนอก Repository ตามนโยบายผู้ใช้ ใช้สิทธิ์ต่ำสุด ห้าม Commit Credential และห้ามขอให้ Agent แสดง Token ใน Log

## 12. GitHub Pages Deployment Architecture

แนวทางที่เลือกคือ GitHub Actions สร้าง Static Artifact แบบ Allowlist แล้วใช้ Official Pages Actions Deploy Artifact ไปยัง Environment `github-pages`

~~~mermaid
flowchart LR
    PR[Pull Request] --> Quality[Required Quality Gates]
    Quality --> Main[Protected main]
    Main --> Tag[Approved immutable release tag]
    Tag --> Package[Stage allowlisted static files]
    Package --> Inspect[Artifact and secret inspection]
    Inspect --> Upload[Upload Pages artifact]
    Upload --> Deploy[Deploy Pages]
    Deploy --> Env[github-pages environment]
    Env --> Smoke[Production smoke test]
~~~

ไม่เลือก Deploy ทั้ง Repository Root เพราะเสี่ยงเผยแพร่ `docs`, `specs`, `tests`, Agent Instructions และไฟล์ที่ไม่จำเป็น

### 12.1 Preconditions

1. Repository Visibility และ GitHub Plan สอดคล้องกับ Zero-cost Requirement
2. Settings, Pages, Build and deployment, Source ตั้งเป็น GitHub Actions
3. Environment `github-pages` จำกัด Deployment ตาม release-tag policy ที่อนุมัติ และ workflow ต้องยืนยันว่า Tag ชี้ Commit ที่อยู่บน `main`
4. Quality Workflow มีอยู่จริงและ Required Check ของ Commit เป้าหมายผ่านก่อนสร้าง Tag
5. Runtime File Allowlist ได้รับอนุมัติ
6. URL ทุกจุดทำงานภายใต้ Project Base Path
7. ไม่มี Runtime Secret และไม่มีไฟล์ `.env`
8. ตรวจ Official GitHub Pages and Actions Documentation และ Action Release ปัจจุบัน

### 12.2 Workflow Template สำหรับนำไป Materialize ใน Phase 1

ตัวอย่างต่อไปนี้เป็น Specification Template ไม่ใช่ไฟล์ Workflow ที่ติดตั้งแล้ว Placeholder ของ Full SHA ต้องถูกแทนด้วย Full-length Commit SHA ที่ตรวจจาก Official Action Release ก่อน Commit GitHub ระบุว่า Full Commit SHA เป็น Immutable Pin ที่ปลอดภัยที่สุด

~~~yaml
name: pages

on:
  push:
    tags:
      - 'v*'

permissions:
  contents: read

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  package:
    name: quality-artifact
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@FULL_SHA_REVIEWED_FOR_V6
        with:
          fetch-depth: 0

      - name: Configure Pages
        uses: actions/configure-pages@FULL_SHA_REVIEWED_FOR_V5

      - name: Verify approved release tag and main ancestry
        run: REPLACE_WITH_APPROVED_RELEASE_REF_CHECK

      - name: Stage allowlisted static files
        shell: bash
        run: REPLACE_WITH_APPROVED_ARTIFACT_STAGING_COMMANDS

      - name: Run repository-approved quality commands
        run: REPLACE_WITH_APPROVED_COMMANDS

      - name: Upload Pages artifact
        uses: actions/upload-pages-artifact@FULL_SHA_REVIEWED_FOR_V4
        with:
          path: _site

  deploy:
    name: deploy-pages
    needs:
      - package
    permissions:
      pages: write
      id-token: write
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - name: Deploy
        id: deployment
        uses: actions/deploy-pages@FULL_SHA_REVIEWED_FOR_V4
~~~

ณ วันที่ตรวจเอกสารล่าสุด Official Examples ใช้ Major Line `actions/checkout@v6`, `actions/configure-pages@v5`, `actions/upload-pages-artifact@v4` และ `actions/deploy-pages@v4` แต่ข้อมูลนี้ไม่ใช่การรับประกันในอนาคต ต้องตรวจ Release, Compatibility และ Full SHA อีกครั้งก่อนนำไปใช้

`REPLACE_WITH_APPROVED_RELEASE_REF_CHECK`, `REPLACE_WITH_APPROVED_ARTIFACT_STAGING_COMMANDS` และ `REPLACE_WITH_APPROVED_COMMANDS` เป็น Placeholder โดยเจตนา ห้าม Commit Template จนกว่า Repository จะมีคำสั่งตรวจ Tag, staging และ quality ที่รันได้จริง Checkout ใช้ประวัติครบเพื่อให้ Release check ยืนยันรูปแบบ Version, annotated Tag, approved release record และ ancestry บน `main` ได้ การ staging ต้องอ่าน manifest แบบ allowlist ที่ review แล้ว คัดลอกเฉพาะไฟล์ที่ระบุ ปฏิเสธ symlink และ fail เมื่อพบไฟล์ที่ไม่คาดหมาย ห้ามแทน Placeholder ด้วย `cp -R src` หรือ `cp -R assets` การใช้ Placeholder ทำให้ Workflow ต้อง Fail ไม่ใช่ Deploy แบบเงียบ ๆ

### 12.3 Artifact Allowlist

Allowlist ขั้นต้นสำหรับ Phase 1 ได้แก่

- `index.html`
- `src/` เฉพาะ Runtime Module และ JSON Content ที่จำเป็น
- `assets/` เฉพาะ Asset ที่มี Provenance และใช้จริง
- Manifest, Icon, `404.html` หรือ `.nojekyll` เมื่อได้รับอนุมัติ

Blocklist ขั้นต่ำ ได้แก่

- `.git/`, `.github/`, `.agents/`
- `docs/`, `specs/`, `tests/`
- `.env*`, Key, Certificate, Credential, Private Note
- Source Map ที่มีข้อมูลไม่ต้องการเผยแพร่
- Unlicensed Asset, Raw Working File และ Test Fixture

Artifact Gate ต้องตรวจ Symlink, Unexpected Hidden File, Missing Entry Point, Broken Relative Path และ Secret Pattern

## 13. Deployment Verification

### 13.1 ก่อน Deploy

- Quality Gate ผ่านบน Commit เดียวกับ Artifact
- Artifact ID และ Commit SHA ถูกบันทึก
- Pages Environment อนุญาต Ref ที่ถูกต้อง
- Base Path Test ผ่าน
- Artifact ไม่มี Secret หรือไฟล์นอก Allowlist

### 13.2 หลัง Deploy

ตรวจจาก `page_url` ที่ Action คืนค่า ไม่เดา URL

1. HTTP Entry Point โหลดสำเร็จ
2. CSS, JavaScript Module, JSON และ Asset สำคัญไม่เป็น 404
3. Console ไม่มี Unhandled Error
4. Title แสดงและเริ่มเกมได้
5. Keyboard Navigation และ Focus ใช้งานได้
6. Save, Reload และ Resume ทำงานโดยไม่สูญเสียข้อมูล
7. Responsive Viewport หลักใช้งานได้
8. No unexpected Network Request, Tracker หรือ Mixed Content
9. Version หรือ Commit Metadata ตรงกับ Release

หาก Critical Check ไม่ผ่าน ให้ประกาศ Deployment Failed และเข้าสู่ Rollback ห้ามรอแก้บน `main` โดยปล่อย Production เสีย

## 14. Rollback

Rollback มาตรฐานใช้ Revert Pull Request เพื่อรักษาประวัติ

1. ระบุ Last Known Good Commit, Tag และ Deployment Evidence
2. หยุดการ Merge ที่ไม่เกี่ยวข้องชั่วคราว
3. Revert Commit หรือ Merge Commit ที่ก่อเหตุบน Branch ใหม่
4. รัน Required Quality Gate และ Artifact Inspection
5. ให้ Human Approver อนุมัติ Emergency PR
6. Merge ไป `main` เพื่อให้ Workflow Deploy Artifact ที่ย้อนแล้ว
7. Smoke Test และยืนยัน Save Compatibility
8. บันทึก Incident Timeline และสร้าง Follow-up Fix

ห้าม `git reset --hard` บน Shared Branch, ห้าม Force Push, ห้ามย้าย Release Tag และห้ามนำ Artifact ที่ไม่ทราบ Source มา Deploy

ถ้าเหตุเกิดจาก Workflow หรือ Action Version ให้ Revert Workflow Change ไปยัง Known Good Pin หาก GitHub Pages หรือ Actions เป็น Outage ให้ตรวจ GitHub Status และหลีกเลี่ยงการเปลี่ยน Source Code โดยไม่มีหลักฐาน

## 15. Incident Checklist

### 15.1 Detect and Classify

- ระบุเวลา ผู้รายงาน URL, Commit, Workflow Run, Browser และอาการ
- จัดระดับ Critical, High, Medium หรือ Low
- แยก Content Defect, Runtime Defect, Save Corruption, Accessibility Regression, Security Incident และ Platform Incident

### 15.2 Contain

- หยุด Release และ Merge ที่เพิ่มผลกระทบ
- เก็บ Log, Screenshot, Artifact ID และ Commit SHA โดยไม่เก็บข้อมูลส่วนบุคคลเกินจำเป็น
- หากมี Secret รั่ว ให้ถือว่า Secret ถูกเปิดเผยและ Rotate ที่ Provider ทันทีโดยผู้มีอำนาจ
- หากเนื้อหาไม่ปลอดภัยหรือผิดสิทธิ์ ให้พิจารณา Unpublish ผ่านผู้ดูแลหลังประเมินผลกระทบ

### 15.3 Recover

- เลือก Revert หรือ Patch ตามเวลาฟื้นตัวและ Save Compatibility
- Deploy จาก Reviewed Commit เท่านั้น
- ตรวจ Critical Journey และข้อมูลเดิม
- แจ้งสถานะตามช่องทางที่ผู้ดูแลกำหนด

### 15.4 Learn

- จัดทำ Post-incident Review ที่ไม่มีการกล่าวโทษ
- ระบุ Root Cause, Detection Gap, Control Gap และ Corrective Action
- เชื่อม Action กับ Requirement, Test, Owner และกำหนดเวลา
- ปรับ Runbook, Test หรือ ADR จากหลักฐาน ไม่เพิ่มกฎแบบครอบจักรวาล

การลบ Secret ออกจาก Commit ล่าสุดไม่ทำให้ Secret ปลอดภัยและอาจยังอยู่ใน History หรือ Cache ต้อง Rotate ก่อน ส่วนการ Rewrite History เป็นกระบวนการพิเศษที่ต้องได้รับอนุมัติและประสานผู้ใช้งานทั้งหมด

## 16. Secrets, Privacy และ Zero-cost Controls

1. Runtime ใช้ Secret จำนวนศูนย์
2. Deployment ใช้ `GITHUB_TOKEN` ที่ GitHub ออกให้เฉพาะ Workflow และกำหนด `contents: read`, `pages: write`, `id-token: write` เฉพาะ Job ที่จำเป็น
3. ห้ามใช้ Personal Access Token สำหรับ Pages เมื่อ Official `GITHUB_TOKEN` เพียงพอ
4. ห้ามใช้ Third-party Analytics, Error Tracking, CDN หรือ Font Service ที่ส่งข้อมูลผู้เล่นออกนอกระบบ
5. Asset และ Font ต้องเก็บใน Artifact เมื่อสิทธิ์อนุญาต
6. Repository Public หมายถึงข้อมูลใน Git History เปิดเผยได้ ต้องห้ามเก็บ Secret, Personal Letter, Private Photo หรือข้อมูลอ่อนไหว
7. ตรวจ Usage Limit และ Billing ของ GitHub Plan ก่อนเปิด Workflow เพิ่ม ห้ามตั้ง Scheduled Workflow ที่ไม่จำเป็น
8. Artifact Retention ใช้ค่าต่ำสุดที่เพียงพอต่อ Audit และ Rollback
9. Custom Domain เป็น Out of Scope ของ Baseline เพื่อไม่เพิ่มค่าใช้จ่ายและงาน DNS
10. หากข้อกำหนด Zero-cost ไม่สามารถรักษาได้ ให้หยุดและขอ Product Decision ห้ามเปิดบริการเสียเงินเอง

## 17. Decommission และ Unpublish

การ Unpublish เป็น External Destructive Change ต้องได้รับ Human Approval

1. บันทึกเหตุผลและ Last Deployment
2. เก็บ Source, Tag, Release Note และ Evidence ตาม Retention Policy
3. ปิด Pages ตาม Official Documentation ปัจจุบัน
4. ตรวจว่า URL ไม่ให้บริการ Content เดิม
5. ห้ามลบ Repository หรือ Git History เว้นแต่มีคำสั่งแยกที่ระบุ Scope และ Recovery

## 18. เอกสารทางการที่ต้องตรวจ

- [Configuring a publishing source for GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)
- [Using custom workflows with GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)
- [Creating a GitHub Pages site](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site)
- [Available rules for repository rulesets](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets)
- [GitHub Actions secure use reference](https://docs.github.com/en/actions/reference/security/secure-use)
- [Official checkout action](https://github.com/actions/checkout)
- [Official configure-pages action](https://github.com/actions/configure-pages)
- [Official upload-pages-artifact action](https://github.com/actions/upload-pages-artifact)
- [Official deploy-pages action](https://github.com/actions/deploy-pages)

ผู้ปฏิบัติต้องบันทึกวันที่ตรวจ ลิงก์ Release หรือ Commit SHA ที่เลือก และความแตกต่างจาก Runbook นี้ใน Pull Request ทุกครั้งที่สร้างหรืออัปเดต Deployment Workflow

## 19. Exit Criteria ของ Phase 0

- กำหนด Branch, Commit, Pull Request, Version และ Release Policy แล้ว
- มีคำสั่งเชื่อม Remote เป็นคำแนะนำเท่านั้นและแยกกรณีประวัติ Remote ชัดเจน
- ไม่ได้ Initialize Git, Push, เปิด Pages หรือ Deploy จากการจัดทำเอกสารนี้
- Pages Architecture ใช้ Static Artifact Allowlist และ Least Privilege
- Rollback และ Incident Checklist มี Owner และ Stop Condition
- ระบุชัดว่าต้องตรวจ Official Documentation และ Live State ก่อน Execute
- ไม่มี Secret หรือค่าใช้จ่ายที่จำเป็นต่อ Runtime Baseline
