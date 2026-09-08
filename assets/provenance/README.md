# Sprint 3 prototype media provenance

Trace: CR-0003 D1/D2/D4/D6, ADR-P0-015, FR-CNT-006, NAR-IP-001/003/004,
NAR-CHR-001 and NAR-WLD-005. The PO and Tech Lead's 2026-09-07 full-cycle
directive explicitly authorizes original prototype media without waiting for
external delivery. These are benchmark assets pending final aesthetic and
listening acceptance; their existence is not a release or deployment approval.

[`benchmark-assets.json`](./benchmark-assets.json) records every content manifest
asset's exact MIME, transfer bytes, SHA-256 and image/decoded PCM dimensions.
Content schema remains unchanged: the runtime receives this separate reviewed
registry through bootstrap and validates it against the loaded content asset IDs.
No provenance URL is fetched during play.

## Original generated images

- `assets/images/backgrounds/act1-morning-pond.webp`: original OpenAI imagegen
  output generated in this task on 2026-09-07, without a reference image. Prompt
  direction: a warm Thai storybook morning lotus pond, green leaves, pink buds,
  golden light and mist, a clear central water focal point and reading space;
  no characters, buildings, interface, lettering or existing intellectual property.
  Mechanical export with Sharp 0.35.4: 1600 × 900, WebP quality 82.
- `assets/images/characters/jaokob/tadpole-neutral.webp`: original OpenAI imagegen
  output generated in this task on 2026-09-07, without a reference image. Prompt
  direction: a small olive-green tadpole, blue scarf and markings, long fin tail,
  no arms, legs, adult shirt, lettering or existing character; isolated transparent
  background. Mechanical export with Sharp 0.35.4: 512 × 512, WebP quality 88,
  alpha quality 100. The playable character remains a tadpole; no adult mascot
  is inserted into Act 1.

The package's `JaoKob-Original-Prototype` license label identifies these authorized
original replacements and the synthesized audio below. It is an internal rights
record, not an assertion that a third-party stock license exists. No commercial
asset, copied artwork, external reference, recording, voice or familiar character
was supplied to produce them. Localized Thai image descriptions live in the
content asset manifest and are projected into the stage.

## Original synthesized audio

[`generate-prototype-audio.py`](./generate-prototype-audio.py) is the complete
deterministic recipe: Python 3 standard library, random seed 20260907, ffmpeg
8.0.1 with libmp3lame, mono 44.1 kHz at 96 kbps, no source samples or existing
composition. Run `python3 assets/provenance/generate-prototype-audio.py` from the
repository root; ffmpeg is a development tool only and is not a runtime dependency.
Byte reproduction requires the recorded encoder version; the supplied hashes
remain the integrity authority for delivered files.

- BGM: an eight-second quiet sustained pad and four sparse original tones.
- Ambience: an eight-second bed of soft circularly scheduled water-drop tones
  and smooth ripples. No harsh white noise, speech or externally sampled water.
- SFX: a 120 ms low-amplitude tactile tone for an accepted decision.

PCM was decoded with ffmpeg to count frames, calculate decoded bytes, peak/RMS
levels and measure the step at each loop seam. LAME/Xing gapless metadata retains
the eight-second loop length. These measurements support basic continuity and
headroom; human listening and actual browser mixing/loop playback remain separate
Task 5 acceptance checks. The adapter applies the approved saved zero volumes,
1.5 s crossfades and reduced-intensity cap; the media never changes saved settings.

## Self-hosted Sarabun

Sarabun Regular 400, Google Fonts CSS API version 17, downloaded 2026-09-07 from
the official `fonts.gstatic.com` URLs recorded in the registry. Two small subsets
cover Thai (including tone marks) and Latin UI text. CSS uses `font-display: swap`
and local paths, with a system fallback; there is no runtime Google Fonts request.

Copyright 2018 The Sarabun Project Authors
([official upstream](https://github.com/cadsondemak/Sarabun)). Licensed under SIL
Open Font License 1.1; the complete notice and license are bundled at
[`OFL-Sarabun.txt`](../fonts/OFL-Sarabun.txt), retrieved from the
[official Google Fonts repository](https://github.com/google/fonts/blob/main/ofl/sarabun/OFL.txt).
The downloaded subsets are distributed unmodified; no font name or glyph was edited.
The bundled OFL notice preserves its wording; one upstream trailing space was
removed to satisfy the repository whitespace check.

## Runtime and rollback limits

Media resolves beneath `/` or `/JaoKob/` through one injected same-origin reader;
credentials, redirects, traversal, unexpected MIME/size/signature and hash mismatch
fail silently. Images decode before insertion and hold ref-counted leases under
32 MiB; audio is bounded separately to 16 MiB decoded PCM. The body remains readable
if any media or font fails. Replacing any asset requires updating its registry hash
and applying content compatibility governance. After 2.1.0 saves exist, retain the
compatible runtime/write guard or disable writes when rolling back presentation;
do not revert to an unguarded 2.0.0 writer or delete protected saves.
