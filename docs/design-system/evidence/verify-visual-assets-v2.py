"""Read-only delivery validation; --write-report saves the resulting evidence JSON.

Requires Python 3 and Pillow. This verifies files, not story/art acceptance.
"""
from pathlib import Path
from html.parser import HTMLParser
from datetime import datetime
from zoneinfo import ZoneInfo
import hashlib
import json
import subprocess
import sys
from PIL import Image

ROOT = Path(__file__).resolve().parents[3]
BASE = '291e077107c13a83a64037691feb0ee5ae5f25a1'

def read(path):
    return json.loads((ROOT / path).read_text())

def digest(path):
    return hashlib.sha256((ROOT / path).read_bytes()).hexdigest()

def require(condition, message):
    if not condition:
        raise ValueError(message)

manifest = read('assets/images/asset-manifest-v2.json')
previous = read('assets/images/asset-manifest-v1.json')
provenance = read('assets/provenance/visual-assets-v2.json')['assets']
old_provenance = read('assets/provenance/visual-assets-v1.json')
jobs = read('docs/design-system/asset-prompts/visual-assets-v2-jobs.json')['jobs']
entries = [a for g in manifest['categories'].values() for a in g]
original = {a['assetId']: a for g in previous['categories'].values() for a in g}
new = [a for a in entries if a['version'] == 'v2']
carried = [a for a in entries if a['disposition'] == 'carry-forward-v1']
records = {a['assetId']: a for a in provenance}
requests = {j['assetId']: j for j in jobs}
require(manifest['canonCommit'] == BASE, 'wrong canon commit')
require(len(entries) == 70 and len(new) == 53 and len(carried) == 17, 'catalog count mismatch')
require(len({a['assetId'] for a in entries}) == 70, 'duplicate ID')
require(len({a['outputPath'] for a in entries}) == 70, 'duplicate output path')
require(len(records) == len(provenance) == len(requests) == 53, 'job/provenance count mismatch')
require(manifest['review']['runtimePromoted'] is False, 'prototype promoted unexpectedly')
totals = {'pngBytes': 0, 'webpBytes': 0, 'transparentPairs': 0, 'opaquePairs': 0}
file_count = 0
for a in new:
    record, job = records[a['assetId']], requests[a['assetId']]
    require(a['status'] == 'generated-awaiting-po-review', f'not generated: {a["assetId"]}')
    require(record['prompt'] == job['prompt'] and record['references'] == job['references'], 'stale provenance')
    require(a['change'] and all(a['change'].get(k) for k in ['from', 'to', 'reason', 'requirements']), 'missing change note')
    require(record['tool'] == 'image_gen.imagegen', 'unexpected generation tool')
    dimensions = tuple(map(int, a['dimensions'].split('x')))
    for field, expected_format, kind in [('masterPath', 'PNG', 'master'), ('outputPath', 'WEBP', 'output')]:
        path = a[field]
        require('/versions/v2/' in path, f'unversioned new image: {path}')
        meta = record[kind]
        require(meta['path'] == path, 'provenance path mismatch')
        require(digest(path) == meta['sha256'], f'checksum mismatch: {path}')
        size = (ROOT / path).stat().st_size
        require(size == meta['byteLength'], 'byte length mismatch')
        with Image.open(ROOT / path) as image:
            image.load()
            require(image.format == expected_format and image.size == dimensions, f'format/dimensions: {path}')
            alpha = image.getchannel('A') if 'A' in image.getbands() else None
            extrema = alpha.getextrema() if alpha else (255, 255)
            require(list(extrema) == meta['alphaExtrema'], 'alpha provenance mismatch')
            if a.get('transparent'):
                require(extrema == (0, 255), f'not transparent: {path}')
                w, h = dimensions
                corners = [alpha.getpixel(p) for p in [(0, 0), (w-1, 0), (0, h-1), (w-1, h-1)]]
                required = corners[:2] if a in manifest['categories']['characters'] else corners
                require(not any(required), f'opaque padding corner: {path}')
            else:
                require(extrema == (255, 255), f'scene has transparency: {path}')
        totals['pngBytes' if kind == 'master' else 'webpBytes'] += size
        file_count += 1
    require(a['sha256'] == record['output']['sha256'] and a['byteLength'] == record['output']['byteLength'], 'manifest hash/size mismatch')
    totals['transparentPairs' if a.get('transparent') else 'opaquePairs'] += 1
    if 'stage' in a:
        stage = a['stage']
        eye = (1-stage['eyeAnchorFromTop']) * stage['previewHeightFraction']
        require(.52 <= eye <= .68 and abs(eye-.60) < .001, 'stage metadata outside eye band')
        require(stage['mirrorAllowed'] is False and stage['dialogueOcclusion'] == .28, 'stage contract mismatch')

for a in carried:
    old = original[a['assetId']]
    for key in ['outputPath', 'masterPath', 'sha256', 'byteLength', 'dimensions', 'version']:
        require(a[key] == old[key], f'carry-forward altered: {a["assetId"]} {key}')

# Verify every v1 image and key audit file against its actual committed bytes.
immutable = ['assets/images/asset-manifest-v1.json', 'assets/provenance/visual-assets-v1.json',
             'docs/design-system/evidence/visual-assets-v1-review.html']
immutable += [a[k] for a in original.values() for k in ['masterPath', 'outputPath']]
for path in immutable:
    committed = subprocess.check_output(['git', 'show', f'{BASE}:{path}'], cwd=ROOT)
    require(hashlib.sha256(committed).hexdigest() == digest(path), f'v1 changed: {path}')

class Links(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links = []
        self.cards = 0
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'article':
            self.cards += 1
        for name in ['src', 'href']:
            if name in attrs:
                self.links.append(attrs[name])

gallery = ROOT / 'docs/design-system/evidence/visual-assets-v2-review.html'
parser = Links()
parser.feed(gallery.read_text())
require(parser.cards == 70, 'gallery card count mismatch')
local_links = {p.split('#')[0] for p in parser.links if p and not p.startswith(('#', 'https:', 'http:'))}
for link in local_links:
    require((gallery.parent / link).is_file(), f'missing gallery link: {link}')

runtime_diff = subprocess.check_output(['git', 'diff', '--name-only', BASE, '--', 'src', 'specs', 'tests'], cwd=ROOT, text=True).strip()
require(not runtime_diff, 'runtime/schema/test bytes changed')
report = {'status': 'PASS', 'verifiedAt': datetime.now(ZoneInfo('Asia/Bangkok')).isoformat(timespec='seconds'),
          'canonCommit': BASE, 'catalogAssets': len(entries), 'generatedAssets': len(new),
          'generatedFiles': file_count, 'carriedForwardAssets': len(carried), 'immutableV1Files': len(immutable),
          'galleryCards': parser.cards, 'galleryLocalLinks': len(local_links), 'runtimeChanged': False,
          'totals': totals, 'limits': ['File verification does not approve canon, anatomy, lighting or art.',
          'Eye-anchor arithmetic checks manual metadata, not image recognition or world scale.',
          'Runtime integration, physical devices, load budget and PO art acceptance remain open.']}
if '--write-report' in sys.argv:
    (gallery.parent / 'visual-assets-v2-verification.json').write_text(json.dumps(report, ensure_ascii=False, indent=2)+'\n')
print(json.dumps(report, ensure_ascii=False, indent=2))
