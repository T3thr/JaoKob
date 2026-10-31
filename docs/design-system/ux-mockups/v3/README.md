# Atomic Gameplay Mockups v3

Thirteen reviewable gameplay blueprints for Sprint 5, based on `develop@e1705ad`. [Open the review gallery](../../evidence/ux-mockups-v3-review.html) to select a screen, compare v2, inspect captured component coordinates, or open its isolated HTML harness.

Integration preserves the later documentation commit `f012dfb`; the handoff uses `[S5-003]` because `[S5-002]` was already posted by the core architect.

**Delivery:** [CR-20261031-1326](../../../changelog/2026-10/CR-20261031-1326-atomic-gameplay-mockups-v3.md). These are visual prototypes; PO visual acceptance and production implementation remain separate. No Sprint 5 implementation WBS item is closed by this delivery.

## Authority and scope

- [ADR-P0-032 D7](../../../adr/ADR-P0-032-living-fantasy-canon-peuak-miracle-doll-and-vn-stage-blocking.md): living characters, staging and เปี๊ยก.
- [ADR-P0-033 D0–D5](../../../adr/ADR-P0-033-interactive-tactical-adventure-gameplay-and-dynamic-stage-revolution.md): tactical interactions, camp, micro-actions and optical shadows.
- [Interactive UX 2.0, §8.2–8.4](../../interactive-gameplay-ux-ui-specification.md): audited corrections, exact thirteen screen states and icon semantics.
- [Physics and visual specification, §6 / §8.7](../../physics-scale-and-visual-v2-specification.md): body scale, shadow geometry, blackout and prop continuity.
- [Atomic 05](../../asset-prompts/05-UX-UI-ATOMIC-COMPONENT-WORKFLOW.md): shared HUD, Sarabun, Saa paper and lotus watermark. The later explicit v3 staging brief governs visible full-body support where it differs from the older portrait-only instruction.

The work supplies design input for Sprint 5 T0/T4. It adds no game code, canonical assets, ADR amendments, schema changes, save changes, runtime dependencies, or new canon. SSOT changes are limited to its Section 7 delivery registry.

## Delivered screens

Every row has a device-framed PNG and WebP plus an unscaled DPR 2 viewport PNG. [The manifest](ux-mockups-v3-manifest.json) records dimensions, hashes, exact reference assets, image-generation prompts and provenance.

| # | Screen | Review focus |
|---|---|---|
| 1 | `mode1-vn-desktop` | Frog feet on the shelter rail; kneeling เตื๊อก; flashlight beam; blackout |
| 2 | `mode1-choice-mobile` | Five verbatim A2A-05 choices and visible costs |
| 3 | `mode2-clash-r5-mobile` | Turn 1, light 4, no ribbon, no finisher, five family actions |
| 4 | `mode2-clash-r5-desktop` | Turn 3, light 6, five repeat warnings, finisher available; no cape yet |
| 5 | `mode3-camp-c3-desktop` | Eight camp cards, bark splint, empty crab claw, two remaining turns |
| 6 | `mode3-camp-c3-mobile` | Same state; 2 × 4 cards at 72 px; sacrifice and selected tags |
| 7 | `mode4-stitch-mobile` | One white stitch; two 30 px gold dots with 44 px touch targets |
| 8 | `mode4-tap-rail-desktop` | One completed tap; one lantern and flashlight; all distant windows dark |
| 9 | `mode5-endings-desktop` | Sleeping เปี๊ยก, visible hand, table and distant four friends; distinct strands |
| 10 | `mode5-endings-mobile` | Three equal 120 px rows; E-DAWN lacks self-reliance |
| 11 | `mode2-clash-r4a-tray-mobile` | All 16 engine actions reachable; pouch/combo tab selected |
| 12 | `mode2-clash-r2-desktop` | Turn 2, light 4, three repeat warnings and two counter combos |
| 13 | `mode5-endings-fallback-mobile` | E-POND safety fallback, fourth strand, first failing conditions |

## Handoff coordinates

Coordinates below are CSS pixels, before the decorative device frame. The gallery's coordinate table is generated from the browser's actual element bounds.

| Component | 390 × 844 | 1440 × 900 |
|---|---|---|
| `TopHudCapsule` | x 16, y 16, 358 × 64 | x 24, y 24, 358 × 64 |
| Protected face band | y 270.08–405.12 | y 288–432 |
| Clash intent | y 88, minimum height 44 | y 32, minimum height 48 |
| Clash gauge | y 412, height 28 | y 572, height 32 |
| Clash tray | x 16, y 464, 358 × 332 | x 44, y 648, 1352 × 216 |
| Mobile tray rows | 64 px basics, 44 px tabs, 208 px well; 8 px gaps | Grouped columns, cards ≥ 56 px |
| Choice cards | Five 72 px rows at y 412, gap 8 | Not a requested capture |
| Camp cards | 2 × 4 at y 464, 72 px each | 4 × 2 at y 670, 64 px each |
| Ending cards | Three 120 px rows at y 454 | Three 238 px columns at y 638 |

The basic row has three actions before the finisher is legal and four when it becomes legal; it never invents an unavailable fourth action. The lower tray holds three segmented tabs with a fixed 2 × 3 well. Tabs support arrow keys, Home/End and roving focus; number keys select available basics. Disabled controls explain their state. These interactions demonstrate the blueprint only; they do not run a complete game or mutate saves.

Camp's journey button is 44 px high, ending at y 828. This applies the explicit minimum touch target to §4.2's 36 px shorthand (y 784–820). Ending rows use §6.3's minimum 120 px; they end at y 830. Neither layout clips the 844 px viewport.

## R5 clarification accepted by PO

PO replied **“ยึดสูตรและระยะในตาราง”** to the conflict between UX screen 4 prose and the physics table. Shadow height is body height × light-to-wall distance ÷ body-to-light distance. The 45 cm frog and 30 cm cloak therefore cannot be compared by distance alone.

| R5 light | Frog distance | Frog shadow | Shade distance | Shade shadow |
|---|---|---|---|---|
| 4 | 0.67 m | 1.6119 m | 0.36 m | 2.0000 m |
| 6 | 0.53 m | 2.0377 m | 0.44 m | 1.6364 m |

The wall is 2.8 m and the light-to-wall distance is 2.4 m. Alpha silhouettes are normalized at the 128 alpha boundary before their CSS height is set, so transparent source padding does not shrink the modeled shadow. The exposed small LED produces crisp silhouettes; the removed shade is visible in the plate. Both R5 captures precede the finisher, so neither has a knight cape. The original specifications remain unchanged. R2 captures the settled selection beat, not the transient ceiling-reaching intent animation.

## Reproduction and evidence

Run from repository root with the installed macOS Chrome, Node and Python/Pillow. No browser automation package or new dependency is required.

```bash
node docs/design-system/ux-mockups/v3/harness/build-fixtures.mjs
python3 docs/design-system/ux-mockups/v3/harness/render_mockups.py
python3 docs/design-system/ux-mockups/v3/harness/build-review.py
python3 docs/design-system/ux-mockups/v3/harness/build-manifest.py
python3 docs/design-system/ux-mockups/v3/harness/verify_review.py
python3 docs/design-system/ux-mockups/v3/harness/verify_delivery.py
node --test 'tests/unit/**/*.test.js'
node tests/docs/check-doc-links.mjs
```

The renderer serves the repository temporarily on localhost, uses native DevTools to set exact viewports, then closes Chrome and the server. It imports the v2 transport, CSS, lotus artwork and device frames **in place**. Fonts, portraits and keepsakes reference their canonical asset paths. Only nine new art derivatives live in `plates/`; no source-image copies are added to the harness.

- [Screen states](evidence/screen-states.json) are created by the existing tactical engine and ending resolver.
- [Thai copy audit](evidence/thai-copy-audit.json) checks 103 exact source receipts against the narrative and UX documents.
- [HUD audit](evidence/hud-pixel-audit.json) compares common-state shell pixels across all thirteen captures. Actual delivered HUD meters and bonds retain each screen's real state; micro-action opacity remains 40%.
- [Tab audit](evidence/tab-audit.json), [review audit](evidence/review-audit.json), [manual visual review](evidence/visual-review.json), [delivery audit](evidence/delivery-audit.json) and [test evidence](evidence/verification-commands.json) distinguish what was checked.
- [Protected hashes](evidence/protected-before.json) verify unchanged source, assets, schemas, tests, ADRs and v1/v2 files from intake.

After changing a screenshot, inspect it again and update the visual-review receipt to its new hash; the verifier deliberately rejects stale manual review.

Historical session `01a189db-a6e0-70a1-821b-b9e0bdc243d5` showed v1's separate image-generated controls drifting between screens and an explicit `usage_limit_exceeded` interruption. That record does not establish an image-service-specific rate limit. v2 solved UI consistency through shared HTML/CSS, Sarabun and exact DevTools emulation; this delivery preserves that approach.

These fixed-size prototypes do not certify Safari, physical devices, assistive technology, 200% text, the remaining UX §9 viewport matrix, runtime transitions or production accessibility. PO reviews artwork before asset promotion. No migration is needed; rollback is a reviewed revert of this delivery. Retain the v2 baseline references while the v3 harness depends on them.
