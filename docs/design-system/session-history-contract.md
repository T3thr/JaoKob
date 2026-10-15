# Session Dialogue History: Slice 3 implementation contract

Version: 1.0.0 · 2026-10-16 · CR-0005 D3 · Sprint 4 T6.

Authority: the current PO directive ratifies session-only history and authorizes T6 after develop@730d8fb / PR #14. Trace: FR-ENG-009, GDD-UX-006, the log portion of FR-UI-004, FR-UI-001/002, FR-ACC-001..004, FR-LOC-001, NFR-PE-005, ADR-P0-019/020, TC-S4-LOG-001/002. This C2 implementation elaborates [proposal §5](../proposals/sprint-04-overhaul/01-proposal-plan.md#5-dialogue-history--backlog-specification); no new Canon, mechanics or durable contract is introduced.

## 1. Readiness and ownership

The approved directive, existing RFC, validated content 2.1.0, Save 2, native modal, Thai resources and original SVG chrome satisfy DoR. Baseline: 874 unit cases pass before source changes. Preserve private untracked references. Sequence Core reducer, Data projection, presentation receipts, modal and bootstrap, then tests/evidence. No concurrent agent edits, runtime dependency or production diagnostic global.

Core owns a deterministic immutable reducer in `src/core/use-cases/session-history.js`. Bootstrap owns its lifecycle separately from the domain snapshot. Data freezes the exact localized speaker, scene, voice role, chosen label and displayed text. UI owns pagination, focus and scrolling, returning only presentation identity, passage identity and the displayed text boundary; it cannot author transcript text or mutate state.

## 2. Records, ordering and bounds

Retain the latest **50 dialogue occurrences and 50 committed actions independently**, merged by increasing sequence for display (at most 100). An occurrence has session/entry/sequence identity, presentation/visit identity, exact content version, node/scene/source IDs, locale, voice role, speaker label, scene label and resolved text. A repeated source ID in a new accepted passage remains a separate occurrence. Resize, settings, save/media patches and reopening a modal do not create occurrences.

An action enters history only after the Core transaction succeeds, before rendering its response. Decision/exploration records use the accepted source ID and pre-transaction context. Pouch commands have an explicit localized item/action label; story choices that collect/refuse retain that committed choice once, without a second synthetic item action. Cancel, stale/duplicate/busy/rejected intent, modal inspection, preload and speculative graph traversal never append.

An accepted story command starts a presentation occurrence. A successful render returns optional presentation receipts; local pagination and actual font/viewport layout changes use the same receipt callback. Receipts must match the active presentation and a known passage. Only the displayed prefix enters history. Subsequent pages extend that occurrence immutably without duplicating it or revealing hidden pages. Feedback and scene prose are distinct passages in display order. Failed render yields no dialogue receipt. A committed action survives a render failure. An adapter without acknowledgement contributes no speculative dialogue.

Text is never truncated: authored dialogue plus final prompt can reach 24,000 UTF-16 code units; action labels remain within their approved short-text limits. IDs, labels and metadata have fixed limits. An 8 MiB serialized session budget supports the schema-maximum 50+50 fixtures without evicting below the required counts; actual Act 1 bytes and Chromium heap are reported separately. There is no ever-growing deduplication ledger or saved transcript.

## 3. Lifecycle and compatibility

Accepted New Game clears history and starts with the first successfully displayed passage; replacement cancellation preserves the old session. Title→Resume within the same application retains it and does not duplicate the redisplayed passage. Hard reload/compatible Resume creates a fresh transcript from the current displayed passage, with the gentle Thai note that earlier passages belonged to the preceding reading session. Never reconstruct ordered prose from saved `payload.history` or `viewedDialogueIds`. A retry that actually re-enters a passage gets a new presentation identity, labelled as a return; renderer retry alone reuses the pending identity. Dispose releases the reducer.

Save format, content version, snapshot, checkpoint, flags, metrics, RNG and all storage keys remain unchanged. Open/close/scroll is read-only and bypasses media acceptance, playback activation and effects. Revert this feature to roll back; no save migration or downgrade is required and no player records are deleted.

## 4. Accessible archive sheet

Use `modal-frame.js`, one native dialog, inert underlay, fixed SVG close corner, focus on a short heading, keyboard Tab containment, Escape and opener restoration. Only the scroll region is scrollable; individual entries are not tab stops or live announcements. Scene/visit separators, speaker/voice labels and “คุณเลือก” action labels preserve oldest-to-newest order. No rewind/search/playback controls.

Use the existing warm paper/ink tokens, 8/16/24/32px rhythm, 18–20px Thai prose at 1.85 leading, AA text contrast, 44px targets and high/forced-colour support. On opening, focus with scroll preservation then position at the latest entry. Later status/media patches preserve the exact dialog, focus and user scroll. Empty state is available at Title and contains no unseen story text. Opening is unavailable during unresolved story/confirmation/pouch transactions.

## 5. Verification and review

Unit evidence: independent 60→50 buffers, repeated visits, maximum text, immutability/idempotent receipts, action ordering, invalid/failed/unseen events, projection/localization, native-modal fallback, lifecycle, storage/audio/snapshot invariance and bootstrap accepted/cancel/rejected paths. Retain all 874 existing assertions.

Browser evidence: production root/subpath, real paginated prose, confirmed Pouch release, reload and New Game, async patches, auto-scroll/user-scroll, focus/Tab/Escape/inert, six profiles (320×568,390×844,768×1024,1440×900,2560×1440,844×390), 200% text, high/forced contrast and reduced motion. Capture and inspect actual screenshots. Existing canonical Act 1 regression remains required. Human Thai/PO review and real-device/AT/native-zoom/performance certification remain distinct owner gates; automation cannot self-certify them.
