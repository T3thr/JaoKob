# Sprint 4 Slice 4: narrative candidate and S5 handoff evidence

2026-10-16 · CR-20261016-0302 / CR-0005 / ADR-P0-019/020 · T7/T8 · intended PR #16.

## What is delivered

Actual `src/data/content/packages/act-01.json` is content3/schema2: **28 nodes,47 edges,70 dialogue records,five natural objects,three optional three-beat moments** across the seven canonical Act1 scenes. The fifth offering has a free-slot acquisition, refusal/keep-current and all four explicit atomic replacements. Native confirmation cancellation preserves state. Quiet-bank release permits an actually empty pouch; held/released/refused/default comfort stays truthful. Mother/root/current, the three home directions, original coping/leaf effects and irreversible historical flags remain intact.

[Act1 contract](../../../../../docs/design-system/act1-narrative-contract.md) and [Act2–5 map](../../../../../docs/proposals/sprint-04-overhaul/05-act-2-5-map-and-endings.md) record authority, predicates/effects, exact fixed-return cursor semantics, S5 threats/recovery/consent/repair, item-independent three-ending table and the inspected adult red-heart gap.

**Promotion boundary:** normal production entry is pinned to exact archived2.1 until Slice5 T9/T10 art/catalog/cursor promotion. These browser runs use the actual application content port, storage, DOM and media in disposable test hosts. No production debug hook or extra runtime dependency. Candidate Save2 round-trips without a new schema/field; old→new rewritten prose is never silently cursor-migrated.

## Results and commands

Development Playwright/Chromium and Ajv are externally installed; set their paths as shown, without installing a project dependency.

| Check | Command / actual result |
|---|---|
| Baseline | `node --test tests/unit/*.test.js` before source: **935/935**,0 failure/cancel/skip/todo. [TAP](baseline-tests.tap) |
| Final unit | Same command: **990/990**, retaining all935 plus55 focused cases,0 failure/cancel/skip/todo. [TAP](unit-tests.tap) |
| New graph | `narrative-content.test.js`: **974 route witnesses** cover all28 nodes/47 authored edges, twelve original home/coping/leaf directions, optional skip/read/refuse/collect, all four full replacements and repeatable original observations; four original metric outcomes remain. New graph is not mislabeled14/21/12. |
| New contracts | `JKB_AJV_PATH=/absolute/path/to/ajv/dist/2020.js node tests/schema/narrative-reference.mjs`: **17 metaschemas,10 package shape cases,59 Save2 cursor cases**, with runtime/reference agreement. [JSON](schema-reference.json). Unit negatives additionally reject unknown IDs, duplicate registry/secret nodes, cyclic/bypassed returns, self-replacement and item stat rewards. |
| Old contracts | Existing `tests/schema/pouch-reference.mjs`: **17 metaschemas/47 cases** including all published contracts; existing presentation reference: **11 metaschemas/36 cases**. [Pouch](pouch-reference.json), [legacy](legacy-schema-reference.json). Published old schema hashes stay unchanged. |
| Candidate browser | `JKB_PLAYWRIGHT_PATH=/absolute/path/to/playwright/index.mjs node tests/e2e/narrative-slice.mjs`: **6 profiles/21 captures**,0 page/console/external/3D errors. [JSON](narrative-browser.json) |
| Legacy browser | Same Playwright env with `JKB_EVIDENCE_DIR=tests/e2e/evidence/sprint-04/slice-04/legacy node tests/e2e/act1-playthrough.mjs`: **12/12 original routes**, keyboard/Bond DOM+AX, save/cursor/consent/fault/root+subpath and text200 checks retained. [JSON](legacy/act1-evidence.json) |
| Installed action client | `develop-web-game/scripts/web_game_playwright_client.js`, two short input bursts on the served candidate secret host; same installed client with a temporary module-resolution loader for the existing Playwright package. Two screenshots/state files under [web-game](web-game/state-0.json); no client error files. No client or dependency copied into production. |
| Static/documentation | [Checks](artifact-checks.json): exact archive/published schema hash parity, bounded content/save, dependency boundary, changed-file/link/Thai runtime punctuation, no model/asset/private reference change. This is a scoped inspection, not an external security scanner certification. |

## Browser witnesses

At320×568,390×844,768×1024,1440×900,2560×1440,844×390: full fifth offering, all four held names, text-only image fallback, native cancel, inspection without a write, one accepted replacement/revision, exact reloaded Save2. Paper remains at bottom24; no horizontal overflow or control clipping; all sampled targets≥44px. Observed cumulative layout shift is0 in the six recorded samples.

Additional320px root/subpath captures show never-collected and release-all comfort and four empty physical slots; secret exact-page reload at200% text/high/forced contrast. One complete fresh journey actually encounters all four childhood objects/three moments, reaches a full bag, replaces leaf with shell, completes rest and reads History with committed action/response ordering. It visits24 nodes; the other four original observations are covered by pure graph and legacy browser witnesses. Final save is approximately6.3KB, below250KB; exact bytes are in JSON. Headless geometry/shift samples are not a representative-device performance percentile or screen-reader approval.

Actual screenshot inspection found inherited HUD crowding at320px/200% and overly long slot fallbacks. Header now wraps within its single capsule; numbers remain separate. Image regions reserve128px and decorative slots use a short localized fallback; full item details retain the full message. The browser checks were rerun after both corrections. New illustrations and Intent Tags remain T9 work.

Inspect representative captures: [full offer](320x568-full-offer.png), [four held objects](320x568-four-items.png), [desktop](1440x900-full-offer.png), [landscape](844x390-full-offer.png), [empty comfort](320-empty-comfort.png), [released comfort](320-released-comfort.png), [text200](320-secret-text200.png), [History](390-journey-history.png).

## Limits and remaining owner gates

Human Thai/Narrative/PO final edit, Art approval, physical devices, VoiceOver/Safari, NVDA/Firefox, native400% zoom and representative-device load/paint/input/memory percentiles are not performed. Final T11 security-scanner/static artifact/release/rollback rehearsal is not claimed. Mermaid source is reviewed; no rendered diagram tooling/certification is claimed.

S5 ending reference cases are **design checks**, not production Act2–5/resolver E2E. Later runtime, Grand Keepsake viewer/GLB/device/rights and adult red-heart embroidery remain Sprint5. Current shirt was visually inspected and lacks that embroidery. Normal2.1 continuation, Save2 backups and downgrade guards remain available; do not overwrite version3 data with a guessed older cursor or an empty pouch. No merge or deployment is authorized/performed by this delivery.
