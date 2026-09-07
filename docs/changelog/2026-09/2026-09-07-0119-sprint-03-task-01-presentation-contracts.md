# Change Record: Sprint 3 Task 1 — Presentation Contracts and Save Compatibility

- **Record ID:** CR-20260907-0119
- **Timestamp:** 2026-09-07T01:19:37+07:00
- **Sprint/Milestone:** Sprint 3 / Task 1
- **Operator:** GPT-6 Astra — Senior Software Engineer / Principal Systems Architect
- **Status:** Task 1 implemented and verified; Tech Lead/QA PR review pending
- **Implementation commit / PR:** `1e9f1b2`; [PR #9](https://github.com/T3thr/JaoKob/pull/9) → `develop`, pushed on `feat/sprint-03-interactive-light-novel`; no merge/deployment performed

## 1. Objective, authority and readiness

The Product Owner's new-session instruction authorizes approved Sprint 3 implementation and explicitly starts Step 0 followed by Task 1. Scope for this PR is Task 1 contracts, pure compatibility preparation, fixtures, tests and traceability. CR-0003 D1/D3/D5/D7/D8 and ADR-P0-015 govern the behavior; no new product requirement or approval is introduced.

Pre-flight: Git identity `T3thr <t.theerapat33@gmail.com>`; clean `develop`, fast-forward pull already up to date with `origin/develop@559b6d7`; branch `feat/sprint-03-interactive-light-novel` created before implementation or delegation. No existing edits to preserve.

Task 1 DoR is satisfied: schema delta and observable negative cases are specified in RFC D1; migration admission and rollback are specified in D3; package 1.1/content 2.0.0 is the source and a test-only package 1.2/content 2.1.0 is the target. Success means strict contract validation, deterministic immutable projection, and exact save payload/settings preservation. Failure means typed rejection with no I/O or source mutation. Separate owners hold schema/validator, migration/fixtures, and presentation/Port files. One PR targets develop. Asset provenance, physical-device and listening readiness are dependencies of Tasks 2–5, not this contract-only PR.

Impact: Data schemas/indexes, localized presentation and RendererPort, save compatibility, tests and documentation. Domain states/transitions, metrics, graph, Canon, stable IDs and stored settings retain their meanings. Security requires strict JSON inputs, typed asset references and no raw browser objects in contracts. Projection performs no fetch, decoding, storage writes or effects. Production content, stage UI, audio adapters, bootstrap/save write-guard integration and deployment are outside this Task 1 PR.

## 2. Traceability

CR-0003 D1/D3/D5/D7/D8; ADR-P0-015; FR-CNT-001/002/004/005, FR-UI-001/005, FR-LOC-001, FR-SAV-005/006/007, GDD-BOND-005, NAR-CHR-001, NAR-WLD-005, NFR-MA-001, NFR-SE-002. Evidence IDs: TC-S3-CONTRACT-001, TC-S3-ARCH-001, TC-S3-SAVE-001.

## 3. Manifest and integration contract

- New schema 1.2 package/tree are exact RFC pointer deltas. Published root/1.1 files remain byte-identical; runtime catalog equality and checked-in SHA-256 locks cover all published schemas. Validator explicitly admits 1.0/1.1/1.2 structural versions and rejects missing/wrong-type environment/portrait references; runtime capability explicitly admits 1.1/1.2 Act 1.
- `content-presentation.js` returns immutable `{visual,audio}` with localized ID-only image requests, current-node neutral/silent semantics, protagonist/speaker/narrator separation and unchanged saved audio zeros. `content-view-model.js` adds the visual projection/high-contrast setting, localized locked Bond without a numeric payload, and filters Bond meter-change disclosure. Two application localization strings are added as a resource-only Task 3 dependency.
- RendererPort validates additive media and Bond fields before dispatch, returns `RENDER_FAILURE` for invalid new contract data and retains legacy caller fixtures. Explicit unlocked tests carry the approved gate; no Act 4 content or domain unlock is added. The existing renderer continues to omit Bond; visible chip and replacement DOM/AX assertions remain Task 3/5.
- Pure `createContentVersionMigration` proves source/target content equality except approved presentation/version/assets paths, validates exact save/cursor/causal state, preserves payload/settings and returns a conservative replacement predicate for Task 4. Archived source is byte-exact `559b6d7`, SHA-256 `cbb710d69e31a0bd4c24cb54a83d9b5c937f192a5566222bc011ad4174847582`. Integrity-bearing 2.0 saves fail safely; exact 2.1 inputs are value-idempotent. No storage writes occur.
- `content-loader.test.js`, new `content-presentation.test.js` / `content-migration.test.js`, and `tests/fixtures/presentation/` cover strict positives/negatives, immutability, supported legacy behavior, all canonical route snapshots, media-bearing target compatibility and protected raw recovery. Fixture media are metadata-only; no files/production rights are asserted.
- New optional `tests/schema/presentation-reference.mjs` uses an external development Ajv installation for independent metaschema/structural validation with local refs. It adds no project package, lockfile or runtime dependency.
- `specs/README.md` records [complete inputs/outputs/errors and Task 2–4 ownership](../../../specs/README.md#sprint-3-task-1-consumer-handoff); Sprint 3 SSOT is version 1.1.0 with Task 1 checked as implemented/verified and owner PR review pending. Root changelog/docs portal and this record supply the trace. Browser evidence is retained in `tests/e2e/evidence/sprint-03/task-01/` separately from future benchmark evidence. No files deleted; production package, Core rules, DOM/CSS, bootstrap and persistence adapters unchanged.

## 4. Verification

| Verification / evidence ID | Result |
|---|---|
| Pre-change `node --test tests/unit/*.test.js` | 444/444; zero fail/cancel/skip/todo; 1336.221 ms |
| Final `node --test tests/unit/*.test.js` | **550/550**; original 444 retained plus 106 new tests; zero fail/cancel/skip/todo; 1665.554458 ms |
| `TC-S3-CONTRACT-001` | Strict versions/fields, exact schema delta, frozen old bytes, catalog parity, all channel/portrait reference negatives, fallback and typed new Port contract passed |
| `TC-S3-ARCH-001` | Core/browser/import inspection and tests passed; immutable media projection, no URL/browser objects, retained legacy callers; sub-agent read-only review found no actionable Task 1 defect |
| `TC-S3-SAVE-001` | All 12 routes × no/partial/full observations and every page/state/completion validate and migrate exactly with a media-bearing target. Altered prose/order/effects/checkpoints/flag policy/defaults/identity/life stage rejected; corrupt/future/Mock/integrity/cursor/causal failures and raw-slot preservation passed |
| Reference `JKB_AJV_PATH=/tmp/jkb-schema-reference-node/node_modules/ajv/dist/2020.js node tests/schema/presentation-reference.mjs` | **11/11 Draft 2020-12 metaschemas, 36/36 structural cases** using Ajv 8.20.0; all refs resolved locally. Format/semantic policy coverage belongs to runtime tests, not this structural reference gate |
| Existing `node tests/e2e/act1-playthrough.mjs` with bundled Playwright path | **12/12 Chromium routes**, root and `/JaoKob/`, nine checks, zero console/page errors; Chromium 151.0.7922.34 on darwin, Node 22.23.2. [Retained evidence](../../../tests/e2e/evidence/sprint-03/task-01/act1-evidence.json) |
| Browser evidence freshness / visual spot check | All 29 served runtime SHA-256 hashes match final source. Inspected 320px/200% text screenshot: vertical reading flow, no horizontal overflow. Existing renderer evidence only |
| Diff, local documentation links and secret scan | `git diff --cached --check` passed; 75 local links/anchors passed; 31 staged files inspected and Gitleaks 8.30.1 found no leaks (451,460 scanned bytes in final implementation scan). GitHub repo verified PUBLIC, remote/identity correct. PR trace update is scanned separately before its documentation commit |

Tooling: Python reference-validator installation could not run because this host's macOS version probe was empty. Used temporary Ajv 8.20.0 installed under `/tmp` with scripts disabled instead; no repository dependency/config change. Existing approved Gitleaks 8.30.1 is reused for staged files, with redacted output. The existing browser runner needed permission for its temporary loopback listener; it used disposable profiles and never real player saves.

Not performed: new stage visual acceptance, new locked-chip DOM/AX acceptance, physical-device frame/cache/load percentiles, Web Audio/gesture/listening tests, VoiceOver/NVDA review, production media provenance review, production 2.1 bootstrap registration/stage/commit race and rollback integration, release/G2/deployment. These remain Tasks 2–5. Local browser transfer/timing observations are not percentile or 60 FPS claims.

Scope note: D5 planning prose shortens the first and third choice labels; tests and ViewModel preserve canonical text **ว่ายตามแม่กบ / อยู่ฟังรากบัว / ว่ายเล่นกับพี่น้อง** and original stable IDs. No narrative edits were made.

## 5. Compatibility, rollback and follow-up

Task 1 does not write migrated saves or change the production package. Task 4 must register the proven migration in bootstrap and both storage stage/commit guards; read-only migration preparation alone is not safe write integration. Before target saves exist, revert the reviewed Task 1 change. Once content 2.1 saves exist, retain compatible runtime/write protection or disable writes; no inferred downgrade or backup deletion.

Tech Lead/QA PR review remains required. Tasks 2–5 and benchmark acceptance are pending; no runtime media, browser accessibility, performance, rights, release or deployment gate is claimed.
