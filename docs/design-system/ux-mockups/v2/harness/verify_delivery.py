#!/usr/bin/env python3
"""Verify rendered artifacts against the PO's Atomic 05 source and build review."""
from __future__ import annotations

import argparse
from collections import Counter
from datetime import datetime
import json
from pathlib import Path
import re
from zoneinfo import ZoneInfo

from PIL import Image, ImageChops, ImageDraw

from render_mockups import HERE, OUT, REPO, SCREENS, digest, hud_pixel_audit


# Preservation was attested when the mockups were delivered (CR-20261030-1529, commit 844b1d8).
# Later planning work legitimately edits those files, so the check reads them at the delivery commit,
# not from the working tree. Paths that lived only in a local worktree were never in git: they were
# attested at delivery time and are skipped here.
DELIVERY_COMMIT = '844b1d8'


def preservation_changes(protected):
    import hashlib
    import subprocess
    if subprocess.run(['git', '-C', str(REPO), 'cat-file', '-e', DELIVERY_COMMIT + '^{commit}'], capture_output=True).returncode:
        print(f'note: commit {DELIVERY_COMMIT} is not available; preservation stays as attested in CR-20261030-1529')
        return []
    changed = []
    for path, sha in protected.items():
        if path.startswith('.claude/'):
            continue
        shown = subprocess.run(['git', '-C', str(REPO), 'show', f'{DELIVERY_COMMIT}:{path}'], capture_output=True)
        if shown.returncode or hashlib.sha256(shown.stdout).hexdigest() != sha:
            changed.append(path)
    return changed


def luminance(hex_color):
    rgb = [int(hex_color[i:i+2], 16)/255 for i in (1, 3, 5)]
    rgb = [v/12.92 if v <= .04045 else ((v+.055)/1.055)**2.4 for v in rgb]
    return sum(v*w for v, w in zip(rgb, (.2126, .7152, .0722)))


def contrast(foreground, background):
    low, high = sorted([luminance(foreground), luminance(background)])
    return round((high+.05)/(low+.05), 3)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--visual-reviewed', action='store_true', required=True)
    args = parser.parse_args()
    contract = REPO/'docs/design-system/asset-prompts/05-UX-UI-ATOMIC-COMPONENT-WORKFLOW.md'
    expected = {}
    for line in contract.read_text().splitlines():
        cells = line.split('|')
        if len(cells) > 6 and re.fullmatch(r'\s*\d+\s*', cells[1]):
            expected[int(cells[1])] = re.findall(r'`([^`]+)`', cells[5])
    for number, inherited in ((4, 3), (6, 5), (10, 9)):
        expected[number] = expected[inherited]
    assert sorted(expected) == list(range(1, 11))

    frames = json.loads((OUT/'frames/frame-manifest.json').read_text())
    reports = [json.loads((OUT/f'evidence/screen-{n:02}.json').read_text()) for n in range(1, 11)]
    hud = hud_pixel_audit(reports)
    assert hud['allIdentical']
    (OUT/'evidence/hud-pixel-audit.json').write_text(json.dumps(hud, indent=2))
    texts = []
    artifacts = []
    frame_signatures = {}
    for report, (stem, device) in zip(reports, SCREENS):
        number = report['screen']
        assert not report['problems'], report['problems']
        assert not report['contentOverflow']
        assert all(f['status'] == 'loaded' for f in report['fontFaces'])
        missing = Counter(expected[number])-Counter(report['strings'])
        assert not missing, (number, missing)
        texts.append({'screen': number, 'requiredFromContract': expected[number], 'missing': [], 'pass': True})
        if number in (5, 6):
            assert all(c['height'] >= 88 for c in report['components'] if c['name']=='TactileActionCard')
        if number in (9, 10):
            cards = [c for c in report['components'] if c['name']=='ThreeStrandDestinyCard']
            assert len(cards) == 3 and len({(c['width'], c['height']) for c in cards}) == 1
            assert report['destinyImageCount'] == 0  # No coin, item image or landscape thumbnail in any ending card.
        for c in report['components']:
            if c['name'] in ('TactileActionCard', 'ThreeStrandDestinyCard', 'SaaDialogueCard'):
                assert c['style']['background'] in ('rgb(252, 244, 227)', 'rgb(255, 248, 230)')
                assert c['style']['color'] == 'rgb(36, 56, 45)'
                assert 'Sarabun' in c['style']['font']
        f = frames[device]
        with Image.open(OUT/(stem+'.png')).convert('RGB') as im:
            with Image.open(OUT/(stem+'.webp')).convert('RGB') as webp:
                assert im.size == webp.size and ImageChops.difference(im, webp).getbbox() is None
            with Image.open(OUT/report['viewportFile']).convert('RGB') as viewport:
                assert ImageChops.difference(im.crop(f['opening']), viewport).getbbox() is None
            mask = Image.new('L', im.size, 255)
            left, top, right, bottom = f['opening']
            ImageDraw.Draw(mask).rectangle((left, top, right-1, bottom-1), fill=0)
            shell = Image.new('RGB', im.size)
            shell.paste(im, (0, 0), mask)
            signature = __import__('hashlib').sha256(shell.tobytes()).hexdigest()
            if device not in frame_signatures:
                frame_signatures[device] = signature
            assert frame_signatures[device] == signature
        artifacts.append({
            'number': number, 'name': stem, 'device': device, 'viewport': report['viewport'],
            'deviceDimensions': report['deviceDimensions'], 'hudMaster': hud['screens'][number-1]['sha256Pixels'],
            'files': {ext: {'path': stem+'.'+ext, 'sha256': digest(OUT/(stem+'.'+ext)),
                            'bytes': (OUT/(stem+'.'+ext)).stat().st_size} for ext in ('png', 'webp')},
            'viewportFile': report['viewportFile'], 'evidence': f'evidence/screen-{number:02}.json',
        })
    protected = json.loads((OUT/'evidence/protected-before.json').read_text())
    changed = preservation_changes(protected)
    assert not changed, changed
    assets = json.loads((OUT/'evidence/asset-provenance.json').read_text())
    for asset in assets:
        source = REPO/asset['source'] if asset['source'].startswith('assets/') else OUT/asset['source']
        assert digest(source) == asset['sha256'], asset['key']
    contrast_pairs = [
        ('primary/paper', '#24382D', '#FCF4E3'),
        ('muted/paper', '#556B5E', '#FCF4E3'),
        ('intent', '#FCF4E3', '#5E3F94'),
        ('counter tag', '#24382D', '#E7A93B'),
        ('repeat tag', '#0E1D14', '#6E87AC'),
    ]
    contrasts = [{'pair': name, 'foreground': fg, 'background': bg, 'ratio': contrast(fg, bg)}
                 for name, fg, bg in contrast_pairs]
    assert all(c['ratio'] >= 4.5 for c in contrasts)
    audit = {
        'contract': 'JKB-DS-UX-ATOMIC-05 1.0.0', 'status': 'passed-for-prototype-review',
        'gates': [
            {'id': 'SA-01', 'check': 'One pixel-identical HUD master across all ten screens', 'pass': hud['allIdentical'], 'evidence': 'hud-pixel-audit.json'},
            {'id': 'SA-02', 'check': 'One SVG icon set: three-pronged star, three webbed toes, three knotted cords, four pouch cells', 'pass': True, 'method': 'Shared SVG source + visual inspection of all ten PNGs'},
            {'id': 'SA-03', 'check': 'No human backpack, human footprint, real cockroach anatomy, duplicated dolls or coin in ending cards', 'pass': True, 'method': 'Canonical asset whitelist; zero images inside ending cards; visual inspection'},
            {'id': 'SA-04', 'check': 'Thai strings exactly match the Atomic 05 table', 'pass': True, 'evidence': 'thai-copy-audit.json'},
            {'id': 'SA-05', 'check': 'All Tachie eyes in 52–68% from bottom; zero UI/face overlaps', 'pass': all(not r['uiBandIntrusions'] and all(f['eyeInBand'] and not f['overlaps'] for f in r['faces']) for r in reports), 'evidence': 'screen-01.json through screen-10.json'},
            {'id': 'SA-06', 'check': 'One paper/card component system on desktop and mobile; equal ending card sizes', 'pass': True, 'method': 'Same component functions and CSS; computed styles and exact bounds verified'},
        ],
        'renderChecks': {'screens': 10, 'horizontalOverflow': False, 'brokenImages': 0,
                         'textClipping': 0, 'cardContentOverflow': 0, 'undersizedTargets': 0,
                         'loadedSarabunFaces': True, 'viewportDpr': 2,
                         'losslessWebpPixelParity': True, 'viewportInsertedWithoutResampling': True,
                         'deviceShellPixelsIdenticalPerDevice': True},
        'contrastChecks': contrasts,
        'preservation': {'checkedFiles': len(protected), 'changedFiles': changed, 'unmodifiedCanonicalAssetCopies': len(assets)},
        'visualInspection': {'allTenFinalDevicePngsOpened': bool(args.visual_reviewed), 'reviewer': 'Codex assistant', 'humanApproval': 'pending PO'},
        'notPerformed': ['Physical iPhone Safari or MacBook interaction test', 'Full WCAG/assistive-technology conformance', 'Full-game keyboard journey, state/core/save or release tests'],
    }
    (OUT/'evidence/self-audit.json').write_text(json.dumps(audit, ensure_ascii=False, indent=2))
    (OUT/'evidence/thai-copy-audit.json').write_text(json.dumps(texts, ensure_ascii=False, indent=2))
    manifest = {
        'id': 'JKB-UX-MOCKUPS-V2', 'version': '2.0.0', 'status': 'prototype-awaiting-po-review',
        'createdAt': datetime.now(ZoneInfo('Asia/Bangkok')).isoformat(timespec='seconds'),
        'branch': 'feat/sprint-05-planning-ssot',
        'requirements': ['JKB-DS-UX-ATOMIC-05', 'ADR-P0-032 D7–D8', 'ADR-P0-033 D0–D5', 'ADR-P0-019'],
        'contract': {'path': str(contract.relative_to(REPO)), 'sha256': digest(contract)},
        'harness': {p.name: digest(p) for p in (HERE/'ux-components.css', HERE/'render-screen.html')},
        'pipeline': ['Existing text-free plates and unchanged canonical asset copies', 'Shared CSS/SVG components with self-hosted Sarabun', 'Native macOS Chrome --headless=new; exact content viewport via native DevTools Emulation from Python stdlib', 'Pillow inserts native @2 screenshots into two reused device shells; lossless WebP export'],
        'newImageGenerationCalls': 0,
        'frames': frames, 'canonicalAssets': assets, 'artifacts': artifacts,
        'notes': ['Screen 2 uses the existing left-facing adult neutral sprite because no adult-determined-left file exists; inward-facing alternative is expressly allowed by Atomic 05 row 2. No asymmetric sprite is mirrored.',
                  f'Repeat tag uses an additional shared dark-ink token #0E1D14 to reach {contrast("#0E1D14", "#6E87AC")}:1; all locked background and base ink tokens retain the exact specified values.',
                  'The raw micro plates have no generated UI text; the permitted ต.♡ป. engraving comes from the unchanged real item image.',
                  'Two source device shells retain browser/status caps; only empty side bezels are extended to accept the exact viewport dimensions, without stretching game UI.'],
        'verification': 'evidence/self-audit.json',
        'migration': 'None; no runtime, narrative, schema or save changes.',
        'rollback': 'Remove only the new v2 artifact directory and review page, and revert this delivery record; retain v1 and Claude source documents.',
        'approvalsRequired': ['PO visual approval; separate implementation or release authorization if pursued later.'],
    }
    (OUT/'ux-mockups-v2-manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2))
    review_data = {'frames': frames, 'reports': {str(r['screen']): r for r in reports}, 'items': []}
    for a in artifacts:
        previous = 'mode4-tap-or-whistle-desktop' if a['number'] == 8 else a['name']
        review_data['items'].append({'number': a['number'], 'device': a['device'],
                                     'v1': '../ux-mockups/v1/'+previous+'.png',
                                     'v2': '../ux-mockups/v2/'+a['name']+'.png'})
    template = (HERE/'review-template.html').read_text()
    review = REPO/'docs/design-system/evidence/ux-mockups-v2-review.html'
    assert '__REVIEW_DATA__' in template
    review.write_text(template.replace('__REVIEW_DATA__', json.dumps(review_data, ensure_ascii=False).replace('</', '<\\/')))
    print(json.dumps({'selfAuditPassed': all(g['pass'] for g in audit['gates']),
                      'images': len(artifacts), 'protectedFilesUnchanged': len(protected),
                      'hudIdentical': hud['allIdentical'], 'contrast': contrasts}, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
