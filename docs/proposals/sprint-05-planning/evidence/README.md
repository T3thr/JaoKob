# Sprint 5 planning evidence

## Current ADR-P0-022 revision: 2026-10-18

[ADR22 replanning verification](adr022-replanning-verification.json) records the four-slice/T0–T19/critical-finding trace checks, supplied ADR and inspected-render identities, unchanged production/schema/test/assets and historical evidence hashes. [Save2 current-validator probe](save2-current-validator-probe.json) records three actual cases: the existing fixture is valid, while added envelope and payload fields each fail with `UNKNOWN_FIELD`. It proves the current closed contract, not the proposed profile's future compatibility.

The full unit/design suites below were not rerun for this documentation-only revision. Their exact original reports remain unchanged. No revised UI, new lore, extended Save2, browser/static artifact, physical-device/AT or human acceptance is claimed. See the [new audit](../../../changelog/2026-10/2026-10-18-0023-sprint-05-adr022-replanning.md) and [remediation contract](../02-adr022-remediation-contract.md).

## Original planning evidence: 2026-10-17

Baseline: `d1af29314d4497e2c37727282a5c7fc3e31333eb`, 2026-10-17. Scope: planning and documentation, [Draft PR #18](https://github.com/T3thr/JaoKob/pull/18). [SSOT](../../../sprints/sprint-05-ssot.md), [assessment](../01-readiness-assessment.md), [audit](../../../changelog/2026-10/2026-10-17-1808-sprint-05-planning-ssot.md).

| File | Meaning |
|---|---|
| [planning-verification.json](planning-verification.json) | Actual commands, results, artifact digests, document checks and unrun gates |
| [baseline-unit.tap.gz](baseline-unit.tap.gz) | Complete fresh `node --test tests/unit/*.test.js` output: 1,060 pass, no failure/cancel/skip/todo |
| [ending-trajectories.json](ending-trajectories.json) | Fresh `node tests/design/ending-trajectories.mjs` report: 1,096 trajectories in eight contexts and eight named witnesses, using existing Core transactions |
| [source-inventory.json](source-inventory.json) | All 81 tracked baseline Markdown documents under `docs/`, 11,082 lines, headings/requirement IDs/SHA-256; checked against baseline Git blobs |

The source inventory represents the baseline before this planning delivery, so it intentionally excludes new S5 files and retains the old hashes of updated portal/index files. It is an inventory and navigation aid, not a statement that every historical claim is current or human-approved.

The design proof begins at Act 4. Its path counts are not player probabilities and it does not prove production full-game execution, chapter replay or gift media. Browser, independent schema, static-artifact, physical-device/AT and human acceptance gates were not rerun for this documentation-only change.

To reproduce the two runtime checks, use the commands above on the recorded baseline and direct output to fresh temporary files. No dependency installation or `npm test` script is implied. To inspect the archive without changing it, use `gzip -dc docs/proposals/sprint-05-planning/evidence/baseline-unit.tap.gz` from the repository root. Compressed and uncompressed digests/lengths are in the manifest; gzip round-trip integrity was checked.
