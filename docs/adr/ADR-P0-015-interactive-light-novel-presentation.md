# ADR-P0-015: Interactive Light Novel Presentation and Compatibility

Status: **Accepted — architecture/documentation only; implementation deferred to a new Session.**

Date: 2026-09-07. Authority: **PO & TECH LEAD JOINT DIRECTIVE: SPRINT 3 ARCHITECTURAL APPROVAL**, CEO/Product Owner and Tech Lead Gemini 3.8 Flash. Author: GPT-6 Astra. Version: 1.0.0.

## Context

Sprint 2 runtime `70bac18` and governance HEAD `b07523c` provide canonical Act 1, pure orchestration and exact Resume. PO approved transforming presentation into a Living High-Fidelity Benchmark Slice before broader media production. [CR-0003](../rfc/CR-0003-interactive-light-novel-presentation.md) contains precise contracts, compatibility and official D5–D8 decisions; [Sprint 3 SSOT](../sprints/sprint-03-ssot.md) owns Tasks/DoR/DoD/evidence.

## Decision

1. Select Option A: optional environment on supported nodes in new package/tree schema 1.2.0. Freeze published 1.0/1.1 schemas, reuse portrait/asset definitions, reject ambiguous legacy/environment coexistence. Missing channels resolve neutral/silent without path-dependent inheritance.
2. AudioPort is a pure Core structural contract; Web Audio lives in UI adapter, composed by bootstrap with injected asset resolver. Project desired media from accepted snapshot; bootstrap fans out to audio and renderer. No Core audio event bus or Renderer→Audio coupling. Unlock in trusted activation before asynchronous dispatch; failures never roll back story/save.
3. Asset changes require content 2.1.0 with save format 1. Register explicit 2.0→2.1 migration for the supported subset in CR D3, preserving payload, cursor and settings. Recovery stays read-only; stage/commit guards protect incompatible/future/corrupt records. Rollback retains compatibility safeguards or disables writes; no inferred downgrade.
4. Bounded demand-driven media loading and semantic DOM/CSS layers target responsive Thai reading and measured performance. No framework/CDN/Canvas engine/service worker. Performance targets are accepted design criteria, not measured success.
5. Benchmark reaches Scene 3 `node.act1.home-focus` and its existing reflection to verify the three canonical choices. Playable Scenes 1–2 depict a small tadpole with blue markings/scarf; adult blue-shirt frog is the Title/branding mascot. Life stage and narrative progression remain intact.
6. **Bond Locked Chip** appears on Act 1 Top HUD with lotus/lock icons and localized label. It exposes no numeric value in DOM/AX; domain Bond stays 0, unlock remains `NAR-SC-A4-004`. Replace production absence assertions with locked-presence and numerical-secrecy assertions in the future implementation, retaining domain and route coverage.
7. Defer Full Log Backlog and Animated Typewriter; preserve manual Reading Beats interleaved with actual 2–3-choice Decision Crossroads. Sprint 4 may refine narrative, graphics and gameplay from playtests through normal change control; no future Canon/mechanics changes are pre-approved.

## Alternatives and consequences

External environment sidecar avoids a tree field but adds another schema/version/join and integrity obligations; rejected for this authored benchmark. Audio event broker adds replay/lifecycle complexity without a domain consumer. Retaining total Bond absence was the draft recommendation; PO expressly chose Locked Chip instead, requiring deliberate UI-contract/test migration rather than weakening numeric secrecy.

Additional contracts, assets, migration fixtures and device/audio/accessibility evidence remain to be implemented. Production artwork still needs provenance and review; reference mockups do not become production assets through documentation approval. WBS remains 0/5.

## Compliance, supersession and trace

Extends ADR-P0-001/003/004/005/009/012/013/014; their accepted historical rationale is unchanged. **Supersedes only the future Act 1 presentation requirement of total Bond DOM/AX absence** in Sprint 2 SSOT §2/Task 4 and ADR-P0-014 verification, replacing it with CR-0003 D7 locked presence plus no numeric disclosure. Historical Sprint 2 evidence stays accurate for that version. No other persistence, cursor, state, graph or metric rule is superseded.

Trace: CR-0003 D1–D8; FR-UI-001/002/003/005, FR-CNT-001/002/004/005/006, FR-SET-004, FR-SAV-005/006/007, FR-ACC-001/002/003, GDD-BOND-005, GDD-UX-003/004/006, NAR-CHR-001, NAR-WLD-005, NFR-PE-001..005. Acceptance evidence and pending implementation tests are registered in SSOT §6; [approval/integration record](../changelog/2026-09/2026-09-07-0042-sprint-03-architecture-approval.md).

## Rollout and rollback

This Session may commit/push/open PR/squash merge documentation into develop only. Runtime implementation is explicitly deferred to a new Session with per-Task DoR. Documentation rollback uses a reviewed revert without changing runtime/save data; runtime migration/rollback must follow CR D3 when implemented. No main push, production deployment or G2 completion is authorized here.
