#!/usr/bin/env python3
"""Index delivered raster files and the sources reused in place; never copy assets."""
import hashlib
import json
from pathlib import Path
from PIL import Image

HERE = Path(__file__).resolve().parent
OUT = HERE.parent
REPO = HERE.parents[4]


def info(path):
    path = path.resolve()
    result = {'path': str(path.relative_to(REPO)), 'sha256': hashlib.sha256(path.read_bytes()).hexdigest(), 'bytes': path.stat().st_size}
    if path.suffix in ['.png', '.webp']:
        with Image.open(path) as im:
            result['dimensions'] = list(im.size)
    return result


def main():
    fixtures = json.loads((HERE / 'fixtures.json').read_text())
    entries = []
    used = set()
    for screen in fixtures['screens']:
        report = json.loads((OUT / 'evidence' / ('screen-' + str(screen['id']).zfill(2) + '.json')).read_text())
        for asset in report['images']:
            used.add((HERE / asset['path']).resolve())
        entries.append({'id': screen['id'], 'stem': screen['stem'], 'mode': screen['mode'],
                        'viewport': report['viewport'], 'png': info(OUT / (screen['stem'] + '.png')),
                        'webp': info(OUT / (screen['stem'] + '.webp')),
                        'viewportPng': info(OUT / 'viewports' / (screen['stem'] + '.png')),
                        'physics': screen['clash']['shadow'] if screen['clash'] else None})
    shared = ['assets/fonts/sarabun-thai.woff2', 'assets/fonts/sarabun-latin.woff2', 'assets/fonts/OFL-Sarabun.txt',
              'docs/design-system/ux-mockups/v2/harness/ux-components.css',
              'docs/design-system/ux-mockups/v2/harness/lotus-watermark.svg',
              'docs/design-system/ux-mockups/v2/harness/render_mockups.py',
              'docs/design-system/ux-mockups/v2/frames/frame-iphone-safari.png',
              'docs/design-system/ux-mockups/v2/frames/frame-macbook-chrome.png',
              'docs/design-system/ux-mockups/v2/frames/frame-manifest.json',
              'docs/design-system/evidence/tactical-clash-engine.mjs',
              'docs/design-system/evidence/five-act-balance-model.mjs']
    used.update(REPO / p for p in shared)
    assets = 'assets/images/'
    art = [
        ('r5-bedroom', ['prompts.r5', 'prompts.r5Correction'], '67f2afe6-6b42-44fc-b5d3-f71e20a807d8', [assets + 'backgrounds/act-05/versions/v2/bg-act5-bedside-table-night.png', assets + 'cg/act-05/versions/v2/cg-act5-ending-edawn-two-worlds.png']),
        ('dawn-bedroom', ['prompts.dawn'], 'add90dc4-60fc-484c-8821-abbb6e86a7bf', ['docs/design-system/ux-mockups/v3/plates/r5-bedroom.png', assets + 'cg/act-05/versions/v2/cg-act5-ending-edawn-two-worlds.png']),
        ('tap-blackout', ['prompts.tap'], 'f580d9d6-0104-4cb3-be16-ef38e03ed734', ['docs/design-system/ux-mockups/v2/harness/assets/tap.png']),
        ('camp-splint', ['prompts.camp'], '33abc7fe-91eb-4b89-845a-fb6e6e9e8084', [assets + 'characters/jao-teuk/versions/v2/storm-kneeling-mission-left.png', 'docs/design-system/ux-mockups/v3/plates/tap-blackout.png']),
        ('vn-rail', ['prompts.vn', 'vnStagingCorrection', 'vnBlackoutCorrection'], 'b395ebe5-8913-43b4-9f7f-1db59babf953', [assets + 'characters/jao-kob/versions/v2/adult-neutral-right.png', assets + 'characters/jao-teuk/versions/v2/storm-kneeling-mission-left.png', 'docs/design-system/ux-mockups/v3/plates/tap-blackout.png']),
        ('kam-empty-claw', ['prompts.kam'], '7de843e2-551f-45e9-843a-8d9e29f97ef1', [assets + 'characters/p-kam/versions/v2/neutral-guarded-left.png']),
        ('r2-sluice', ['prompts.r2'], '0b089c53-2c93-4023-9fe4-77faa13bf84d', [assets + 'backgrounds/act-02/versions/v1/bg-act2-shadow-sluice-chamber.png']),
        ('r4-banyan', ['prompts.r4'], 'fe3246bf-6075-4c2e-b5db-89c108ef94a8', [assets + 'backgrounds/act-04/versions/v1/bg-act4-parapet-storm-abyss.png']),
        ('kob-standing', ['standingSpritePrompt'], '1a3c67c3-3728-4bd7-a11e-5c14baf125c8', [assets + 'characters/jao-kob/versions/v2/adult-neutral-right.png']),
    ]
    manifest = {
        'schema': 'jaokob-review-manifest-v3', 'record': 'CR-20261031-1326', 'baseline': 'e1705ad', 'integrationBase': 'f012dfb',
        'status': 'Prototype delivery; PO visual acceptance and runtime integration remain separate.',
        'renderer': 'Native macOS Chrome DevTools emulation at DPR 2; Pillow device-frame composition.',
        'review': 'docs/design-system/evidence/ux-mockups-v3-review.html',
        'entries': entries,
        'sourcesUsedInPlace': [info(p) for p in sorted(used) if not p.is_relative_to(OUT)],
        'newArtwork': [{**info(OUT / 'plates' / (name + '.png')), 'provider': 'Built-in image_gen',
                        'modelVersion': 'Not exposed by tool', 'finalInvocationId': invocation,
                        'promptFile': 'evidence/image-prompts.json', 'promptKeys': keys,
                        'referenceAssets': [info(REPO / p) for p in refs]} for name, keys, invocation, refs in art],
        'rights': 'New artwork derives from existing project references. No externally downloaded artwork or new runtime dependency. Existing Sarabun OFL is retained in place.',
        'decisions': [{'id': 'R5-P6-DISTANCE', 'authority': 'PO reply in current task, 2026-10-31',
                       'decision': 'Use the physics table formula and distances. At light 6, frog 0.53 m, shade 0.44 m; larger frog body explains the taller shadow.',
                       'specConflictRetained': 'UX screen 4 prose says the frog is closer; source specifications were not edited.'}]
    }
    (OUT / 'ux-mockups-v3-manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
    print('Manifest: 13 PNG/WebP pairs, 13 exact viewports, 9 new art sources, canonical references retained in place.')


if __name__ == '__main__':
    main()
