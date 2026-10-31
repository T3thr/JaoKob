#!/usr/bin/env python3
"""Check delivered artifacts against captured geometry, source text and protected files."""
import hashlib
import json
import re
import subprocess
from collections import defaultdict
from pathlib import Path
from PIL import Image, ImageChops

HERE = Path(__file__).resolve().parent
OUT = HERE.parent
REPO = HERE.parents[4]
DS = OUT.parents[1]


def read(path):
    return json.loads(path.read_text())


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main():
    manifest = read(OUT / 'ux-mockups-v3-manifest.json')
    fixtures = read(HERE / 'fixtures.json')
    expected = re.findall(r'\| \d+ \| `([^`]+)`', (DS / 'interactive-gameplay-ux-ui-specification.md').read_text())
    assert [s['stem'] for s in manifest['entries']] == expected and len(expected) == 13
    frames = read(OUT.parent / 'v2/frames/frame-manifest.json')
    for entry in manifest['entries']:
        for kind in ['png', 'webp', 'viewportPng']:
            meta = entry[kind]
            path = REPO / meta['path']
            assert digest(path) == meta['sha256'], path
            with Image.open(path) as im:
                assert list(im.size) == meta['dimensions']
                im.verify()
        vp = entry['viewport']
        assert entry['viewportPng']['dimensions'] == [vp['width'] * 2, vp['height'] * 2]
        frame = frames['mobile' if vp['width'] == 390 else 'desktop']
        with Image.open(REPO / entry['png']['path']) as device, Image.open(REPO / entry['viewportPng']['path']) as raw:
            assert list(device.size) == frame['dimensions']
            assert ImageChops.difference(device.crop(frame['opening']).convert('RGB'), raw.convert('RGB')).getbbox() is None, 'Frame changed UI pixels'
        report = read(OUT / 'evidence' / ('screen-' + str(entry['id']).zfill(2) + '.json'))
        assert not report['problems'] and report['fontReady']
        if entry['id'] in [5, 6]:
            cards = [b for b in report['componentBounds'] if b['name'] == 'TactileActionCard']
            assert len(cards) == 8 and all(b['height'] == (72 if entry['id'] == 6 else 64) for b in cards)
        if entry['id'] in [10, 13]:
            cards = [b for b in report['componentBounds'] if b['name'] == 'ThreeStrandDestinyCard']
            assert len(cards) == 3 and all(b['height'] >= 120 for b in cards)
        if entry['physics']:
            model = entry['physics']
            pixels = 230 if vp['width'] == 390 else 500 if entry['id'] == 12 else 330
            assert model['cape'] is False
            for shadow in report['shadowElements']:
                target = model['frogHeightM' if shadow['kind'] == 'frog' else 'shadeHeightM'] / model['wallM'] * pixels
                assert abs(shadow['height'] - target) < .03
    for source in manifest['sourcesUsedInPlace'] + manifest['newArtwork']:
        assert digest(REPO / source['path']) == source['sha256']
    before = read(OUT / 'evidence/protected-before.json')
    changed = [p for p, sha in before.items() if not (REPO / p).exists() or digest(REPO / p) != sha]
    assert not changed, changed
    # The only permitted Sprint SSOT edit is its Section 7 registry.
    path = 'docs/sprints/sprint-05-ssot.md'
    baseline = subprocess.check_output(['git', 'show', 'e1705ad:' + path], cwd=REPO).decode()
    assert baseline.split('## 7.')[0] == (REPO / path).read_text().split('## 7.')[0]
    copy = read(OUT / 'evidence/thai-copy-audit.json')
    for source, sha in copy['sourceHashes'].items():
        assert digest(DS / source) == sha
    for receipt in copy['receipts']:
        assert receipt['text'] in (DS / receipt['source']).read_text()
    assert len(fixtures['choices']) == 5 and len(fixtures['camp']) == 8
    tabs = read(OUT / 'evidence/tab-audit.json')
    sixteen = next(t for t in tabs if t['screen'] == 11)
    reachable = set(a for group in sixteen['groups'].values() for a in group)
    assert len(reachable) == 16 and sixteen['layoutShift'] == 0 and sixteen['keyboardArrowRight']
    hud = read(OUT / 'evidence/hud-pixel-audit.json')
    assert len(hud['screens']) == 13 and hud['allIdentical']
    review = read(OUT / 'evidence/review-audit.json')
    assert review['statesPassed'] == 78 and review['keyboardActivation'] and review['offlineFileUrl']
    visual = read(OUT / 'evidence/visual-review.json')
    assert sorted(s['id'] for s in visual['screens']) == list(range(1, 14))
    for s in visual['screens']:
        assert digest(OUT / 'viewports' / (expected[s['id'] - 1] + '.png')) == s['viewportSha256'], 'Visual review is stale'
    # All tracked and deliverable untracked files, excluding ignored local caches.
    files = subprocess.check_output(['git', 'ls-files', '--cached', '--others', '--exclude-standard', '-z'], cwd=REPO).decode().split('\0')
    hashes = defaultdict(list)
    for name in sorted(set(files) - {''}):
        path = REPO / name
        if path.is_file():
            hashes[digest(path)].append(name)
    duplicates = [group for group in hashes.values() if len(group) > 1]
    assert not duplicates, duplicates
    for path in OUT.rglob('*.md'):
        text = path.read_text()
        assert chr(36) not in text and '\\frac' not in text and '\\begin' not in text
    evidence = {'passed': True, 'screens': 13, 'framePixelsPreserved': 13, 'byteDuplicateGroups': duplicates,
                'protectedFilesUnchanged': len(before), 'ssotOutsideRegistryUnchanged': True,
                'sourceCopyReceipts': len(copy['receipts']), 'sourceHashesValid': True,
                'hudCommonStatePixelIdentical': True, 'reviewStates': review['statesPassed'],
                'r4aReachableCards': len(reachable), 'shadowHeightToleranceCssPx': .03,
                'manualReviewMatchesViewportHashes': True,
                'notClaimed': ['Safari', 'physical devices', 'screen-reader acceptance', '200% text', 'full runtime UX §9 gate', 'PO visual approval']}
    (OUT / 'evidence/delivery-audit.json').write_text(json.dumps(evidence, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps(evidence, ensure_ascii=False))


if __name__ == '__main__':
    main()
