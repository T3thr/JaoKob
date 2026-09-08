Original prompt: PO & Tech Lead approved Task 1/PR #9 and authorized squash merge, then integrated Sprint 3 Tasks 2–5 on feat/sprint-03-benchmark-slice: prototype assets, semantic stage, bounded media/audio, exact save migration, verification and PR.

Progress is tracked in docs/changelog/2026-09/2026-09-07-1248-sprint-03-benchmark-slice.md and docs/sprints/sprint-03-ssot.md.

- PR #9 merged at 9e4f8b0 with required T3thr author/email/subject; develop pulled clean before branch creation.
- Baseline unit suite: 550/550 pass.
- Parallel ownership: benchmark_ui (DOM/components/CSS/localization/index), benchmark_assets (resolver/preloader/image-cache/audio/font/package/metadata), benchmark_audio (Core audio facade/UI adapter/tests), root (bootstrap/persistence/projection/images/integration/evidence/docs).
- Preserve semantic DOM and existing native story controls; the generic web-game skill's canvas/fullscreen prescriptions do not apply to the explicitly approved DOM-only baseline. Browser diagnostics will be test-injected; no Core/global game-state hook added.
- Prototype art/audio permitted by current directive. Final PO visual/listening and physical-device/accessibility review remain distinct from implemented/tested functionality.

- Integrated candidate: schema1.2/content2.1, all7 prototypeassets complete; stage/audio/settings/migration wired, visibility and bounded registry/read/retry fixes verified.
- Final unit suite691/691; reference11schemas/36cases; originalE2E12/12+supplementarybenchmark6viewports/4faults/240inputs allpass.
- SupplementaryFast3G p75cold2164.2ms/warm199.6ms; headlessrAF timingnotphysical60Hzproof. RuntimeSHAmanifest andopenmanualgates capturedinexecutionrecord.
- Remaining: stagedchecks/Gitleaks, conventionalcommit, pushfeature, createPRdevelop, appendactualPRtrace.
