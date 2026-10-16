# Visual Novel Runtime Design Specification

Version: 1.0.1 · 2026-10-15 · implementation contract for ADR-P0-019 / CR-0005 / Sprint 4 T1–T2 / PR #13.

Authority: [ADR-P0-019](../adr/ADR-P0-019-visual-novel-runtime-ergonomics-and-design-system-mandate.md) supersedes ADR-P0-018. This specification records the PO mandate before implementation; it does not approve new mechanics or narrative. Human visual acceptance remains required.

## 1. Intake and boundaries

The rejected baseline is `a634409`. A passing test count and zero layout shift do not establish readable prose or usable controls. Acceptance requires the actual title replacement, storm advisory, consequence, decision, audio, settings and keyboard paths to work in the browser.

Trace: FR-UI-001..007, FR-SET-003/004, FR-ACC-001..004, FR-LOC-001, NFR-US-003..006, NFR-PO-002/004, ADR-P0-019. The existing CR-0005 governs this UI revision. Definition of Ready: approved mandate, known immutable view model and intent ports, existing original artwork and fonts, existing automated/browser runners, explicit PR update authorization, and compatible persistence/rollback are available.

Core state, authored content, meters, choice ordering, save schema, media policy and dependency baseline remain governed by their existing contracts. Session History Log (T6 / PR #15), other Sprint 4 tasks and release/merge are outside this delivery.

## 2. Spatial rhythm

Use an 8pt grid with a 4px half step. Tokens are literal CSS pixels: `space-1:4px`, `space-2:8px`, `space-3:16px`, `space-4:24px`, `space-5:32px`, `space-6:48px`. Text scales independently. Minimum interactive target is 44×44px; choice rows prefer at least 56px. Adjacent choice rows have 8px separation; paper and choices have 16px separation. Safe-area insets supplement the 24px bottom baseline and 16px side gutters.

## 3. Colour and contrast

| Token | Value | Intended pairing |
| --- | --- | --- |
| Ink | `#293d32` | warm paper `#fcf4e3` |
| Secondary ink | `#53604f` | warm paper `#fcf4e3` |
| Paper / raised paper | `#fcf4e3` / `#fff9ef` | ink |
| Moss / deep moss | `#3b6549` / `#254735` | raised paper text |
| Amber | `#996319` | warm paper |
| Danger | `#8a3b31` | warm paper |
| Glass backing | `#f4f3e6` | ink, with an opaque fallback |

Verify text pairings with the WCAG relative-luminance formula: at least 4.5:1 for ordinary text. High contrast uses `#102018` on `#fffdf5` and must exceed 7:1. Glass must retain a sufficiently opaque backing over the brightest and darkest artwork. Colour alone never communicates meter direction, switch state, selection, disability or failure. Focus outlines are visible on both paper and artwork. Forced-colour mode retains system borders and focus.

## 4. Typography and language

Self-hosted Sarabun is the source-locale face. Reading prose is 18px on small screens and 20px on desktop, line-height 1.85; labels are 14–16px, controls 16–18px, headings 24–48px with Thai-safe leading. User font scale is 100–200%. Never truncate narrative with ellipsis, line clamps, clipping or a scrolling text well. Speaker and prose remain separate; the compact forward control occupies the lower right.

U+2014 and U+2013 are forbidden in Thai runtime strings. Use a colon, parentheses or natural spacing. Numeric decreases use a localized direction and amount, not a dash appended to dialogue. All chrome icons are original stroked SVGs from `chrome-icons.js`; emoji and text-icon fallbacks are prohibited.

## 5. Layer architecture

| Layer | z-index | Owner |
| --- | --- | --- |
| Background | 0 | fixed pond canvas and ambient overlay |
| Stage | 10 | character, water contact shadow/ripples, stage click surface |
| HUD / reading / choices | 20 | one header capsule and anchored presentation |
| Toasts | 30 | transient HP / morale changes near the HUD |
| Modals | 50 | native dialog top layer with dimmed backdrop |

Native modality makes the underlay inert. Only one modal is open. Closing returns focus to its actual opener when still available; committing a story action focuses the new prose. Modal close control is outside the scrolling body, absolutely positioned 16px from top/right, with a 44px target. Escape cancels; Tab stays inside. Confirmation must never be appended over the original title controls in normal document flow.

## 6. Physical blueprints

### Title

Full viewport lotus pond, soft vignette, centred title and a narrow action column. One primary start action, secondary resume when eligible. Sound, settings and advisory live in the corner rail. No meters or warning panel in the title composition. Starting over an existing save opens a separate native confirmation dialog; cancel/close retains the save and restores the start opener. Existing explicit consent and save protection remain enforced by bootstrap.

### Reading and decisions

The paper is fixed to the viewport bottom baseline, centred, maximum width 48rem. Reading and decision use the same paper geometry for a given viewport and font scale. Its only content is speaker, authored prose and pagination/forward navigation. No content warning, meter delta, save status or debug summary belongs there.

The available reading area is measured against actual Thai font metrics. If a beat cannot fit, the UI paginates its original text at word/grapheme boundaries; every character remains available. UI pages do not advance or persist the Core cursor. Only completing the final UI page sends the existing semantic advance intent. Resizing retains the current text position. Authored immediate feedback is prose and is presented as a preceding narrator passage, separate from meter telemetry. Presentation pagination has no save-format impact; reloading may reread part of the current beat.

Decision rows form one centred, equal-width vertical column, maximum width 40rem, immediately above the paper with a 16px gap. Short landscape viewports (at least 36rem wide and at most 30rem tall) use three equal columns in the same centred slot and a smaller measured paper, preserving readable controls above the baseline. Equal row heights are determined by the longest label, with intrinsic growth at large text sizes. Labels wrap naturally; neither a button nor the choice region has an internal scrollbar. If viewport height is insufficient, the document reflows/scrolls while the paper retains its viewport baseline. Choices become available after all associated prose is readable. No choice can be selected from a hidden/inert presentation page.

The character is anchored to the painted water plane independently of reading/decision mode, with a soft contact ellipse and broken ripple. Short viewports may occlude the character with foreground paper; do not relocate it into the sky to keep it visible.

### HUD and consequences

One compact glass capsule contains HP, morale, locked Bond presentation and the utility rail. A successful save is a subtle 1.5-second indicator, not another capsule. Failures remain readable and recoverable. HP/morale changes are a dedicated noninteractive micro-toast near the HUD, with localized direction and amount, a 2.5-second lifetime and a final fade. Locked Bond numbers never enter DOM, accessibility text or toasts. Stable action identity prevents replay on media/settings refresh. The existing live region announces each consequence once. No history log is added.

### Advisory, settings and audio

Content advisory is accessed through a corner SVG info button, including intense scenes. Its native modal contains the full applicable warning, acknowledgement and an explicit “do not show again” switch. The validated `jaokob:preferences` adapter persists this UI preference; UI components never access storage. Settings retain a way to reopen it.

The sound rail control directly mutes/unmutes the master channel in one click, retains its button, exposes On/Off state and restores the prior positive master volume. Per-channel levels are preserved, including intentional zeroes. Audio activation still follows trusted-gesture/browser policy; unavailable audio is described accurately. It never opens Settings as a substitute for toggling.

All switches have a visible track, thumb, state word and `role=switch` / `aria-checked`; green is on, grey is off. Settings and every confirmation/advisory use the same modal frame and pinned SVG close corner. Only the modal body scrolls.

### Desktop input

Space/Enter and a primary click on the stage advance reading UI pages and then the existing beat intent. They never choose a decision. Ignore interactive controls, HUD, modal content, text selection, held-key repeat, modifier/composition events, busy state and an open modal. Keep handlers scoped to the application root and dispose them with the renderer.

## 7. Ownership, verification and rollback

Bootstrap owns commands, validated settings and storage ports. Data projection supplies localized immutable presentation facts. Renderer/components own DOM, temporary pages, timers, focus and input ergonomics. Core remains browser-free. Dialogue uses `textContent`, never `innerHTML`.

Required evidence: all unit tests without skips; existing Act 1 routes and save/consent protections; real browser paths at 320×568, 390×844, 768×1024, 1440×900, 2560×1440 and 844×390; 200% text, reduced motion, high/forced contrast, modal close at both scroll ends, direct audio toggles, stage/Space/Enter guards, actual storm/advisory and consequence screens. Measure bottom baselines, complete text pagination, choice symmetry/no overflow and contrast. Archive the rejected baseline before replacing screenshots and identify both commits in Before/After. Numerical checks supplement screenshot inspection and do not substitute for PO playtest or assistive-technology review.

No migration is required: save schema and the existing versioned preference schema are unchanged. Rollback reverts this PR revision; existing saves/preferences remain valid. No release, merge or production deployment is authorized by this specification.

## Slice4 accessibility clarification (CR-0005)

At narrow widths/large text, the single HUD capsule wraps meters and utility controls onto separate rows rather than squeezing Thai labels/values together. Numeric values remain legible and controls retain44px targets. Item illustrations reserve at least128px height during failure; small decorative slots use a short localized fallback, while inspection retains the full explanation. This corrective clarification follows actual320px/200% screenshot inspection; it changes no domain rule or paper baseline.
