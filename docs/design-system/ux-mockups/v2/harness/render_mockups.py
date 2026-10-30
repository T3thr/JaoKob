#!/usr/bin/env python3
"""Deterministic JKB-DS-UX-ATOMIC-05 capture using native macOS Chrome + Pillow.

Chrome's macOS window manager clamps CLI windows to at least 500 CSS pixels and
subtracts browser chrome from --window-size. Native DevTools Emulation, exposed
by the same --headless=new CLI process, sets the exact requested 390×844 or
1440×900 content viewport. No third-party browser automation package is used.
Only Python's standard library and the already-installed Pillow are required.
"""
from __future__ import annotations

import argparse
import base64
import hashlib
import json
import os
from pathlib import Path
import shutil
import socket
import struct
import subprocess
import tempfile
import time
import urllib.request

from PIL import Image, ImageChops, ImageDraw

HERE = Path(__file__).resolve().parent
OUT = HERE.parent
REPO = HERE.parents[4]
CHROME = Path('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome')
SCREENS = [
    ('mode1-vn-desktop', 'desktop'),
    ('mode1-choice-mobile', 'mobile'),
    ('mode2-clash-r5-desktop', 'desktop'),
    ('mode2-clash-r5-mobile', 'mobile'),
    ('mode3-camp-c3-desktop', 'desktop'),
    ('mode3-camp-c3-mobile', 'mobile'),
    ('mode4-stitch-mobile', 'mobile'),
    ('mode4-tap-rail-desktop', 'desktop'),
    ('mode5-endings-desktop', 'desktop'),
    ('mode5-endings-mobile', 'mobile'),
]


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def master_frames() -> dict:
    reference = REPO / 'docs/proposals/phase-02-visual-novel-architecture'
    specifications = {
        'desktop': ('jaokob-visual-target-desktop-reading-state.png',
                    (133, 145, 1454, 851), (2880, 1800), 'frame-macbook-chrome.png'),
        'mobile': ('jaokob-visual-target-mobile-decision-state.png',
                   (128, 150, 814, 1400), (780, 1688), 'frame-iphone-safari.png'),
    }
    frames = {}
    for device, (name, source_hole, viewport, filename) in specifications.items():
        source_path = reference / name
        source = Image.open(source_path).convert('RGBA')
        scale = viewport[0] / (source_hole[2] - source_hole[0])
        scaled = source.resize((round(source.width * scale), round(source.height * scale)),
                               Image.Resampling.LANCZOS)
        left, top, right, old_bottom = [round(v * scale) for v in source_hole]
        right = left + viewport[0]
        bottom_height = scaled.height - old_bottom
        canvas = Image.new('RGBA', (scaled.width, top + viewport[1] + bottom_height))
        canvas.paste(scaled.crop((0, 0, scaled.width, top)), (0, 0))
        canvas.paste(scaled.crop((0, old_bottom, scaled.width, scaled.height)),
                     (0, top + viewport[1]))
        # Extend only the empty side bezels. No game art or browser text is warped.
        canvas.paste(scaled.crop((0, top, left, old_bottom)).resize(
            (left, viewport[1]), Image.Resampling.LANCZOS), (0, top))
        canvas.paste(scaled.crop((right, top, scaled.width, old_bottom)).resize(
            (scaled.width-right, viewport[1]), Image.Resampling.LANCZOS), (right, top))
        frame_path = OUT / 'frames' / filename
        canvas.save(frame_path)
        frames[device] = {
            'file': str(frame_path.relative_to(OUT)),
            'sha256': digest(frame_path),
            'source': str(source_path.relative_to(REPO)),
            'sourceSha256': digest(source_path),
            'sourceGameOpening': list(source_hole),
            'opening': [left, top, right, top+viewport[1]],
            'dimensions': list(canvas.size),
            'method': 'Reference hardware/browser caps retained; side bezels extended to fit exact viewport without resampling UI.',
        }
    (OUT / 'frames/frame-manifest.json').write_text(json.dumps(frames, indent=2))
    return frames


class NativeChrome:
    """Small synchronous native DevTools transport, implemented with stdlib."""

    def __init__(self):
        self.profile = Path(tempfile.mkdtemp(prefix='jaokob-v2-chrome-'))
        self.log = open(OUT / 'evidence/chrome.log', 'w')
        self.proc = subprocess.Popen([
            str(CHROME), '--headless=new', '--disable-gpu', '--hide-scrollbars',
            '--no-first-run', '--no-default-browser-check',
            '--disable-background-networking', '--disable-component-update',
            '--disable-sync', '--metrics-recording-only', '--password-store=basic',
            '--use-mock-keychain', '--force-device-scale-factor=2',
            '--remote-debugging-port=0', '--remote-debugging-address=127.0.0.1',
            '--user-data-dir='+str(self.profile), 'about:blank',
        ], stdout=self.log, stderr=self.log)
        active = self.profile / 'DevToolsActivePort'
        deadline = time.monotonic()+20
        while not active.exists():
            if self.proc.poll() is not None or time.monotonic() > deadline:
                raise RuntimeError('Native Chrome did not start; see evidence/chrome.log')
            time.sleep(.08)
        port = active.read_text().splitlines()[0]
        with urllib.request.urlopen('http://127.0.0.1:'+port+'/json/list') as response:
            pages = json.load(response)
        endpoint = next(p['webSocketDebuggerUrl'] for p in pages if p['type']=='page')
        authority, path = endpoint.removeprefix('ws://').split('/', 1)
        host, port = authority.split(':')
        self.sock = socket.create_connection((host, int(port)), timeout=15)
        key = base64.b64encode(os.urandom(16)).decode()
        request = (f'GET /{path} HTTP/1.1\r\nHost: {authority}\r\nUpgrade: websocket\r\n'
                   f'Connection: Upgrade\r\nSec-WebSocket-Key: {key}\r\n'
                   'Sec-WebSocket-Version: 13\r\n\r\n')
        self.sock.sendall(request.encode())
        header = b''
        while not header.endswith(b'\r\n\r\n'):
            header += self.sock.recv(1)
        if b' 101 ' not in header:
            raise RuntimeError('Native Chrome websocket upgrade rejected')
        self.serial = 0
        self.call('Page.enable')
        self.call('Runtime.enable')
        self.version = self.call('Browser.getVersion')

    def _read(self, n):
        data = b''
        while len(data) < n:
            chunk = self.sock.recv(n-len(data))
            if not chunk:
                raise RuntimeError('Native Chrome transport closed')
            data += chunk
        return data

    def _send(self, data, opcode=1):
        mask = os.urandom(4)
        size = len(data)
        header = bytes([0x80 | opcode])
        if size < 126:
            header += bytes([0x80 | size])
        elif size < 65536:
            header += bytes([0x80 | 126])+struct.pack('!H', size)
        else:
            header += bytes([0x80 | 127])+struct.pack('!Q', size)
        self.sock.sendall(header+mask+bytes(v ^ mask[i % 4] for i, v in enumerate(data)))

    def _receive(self):
        parts = []
        while True:
            first, second = self._read(2)
            size = second & 127
            if size == 126:
                size = struct.unpack('!H', self._read(2))[0]
            elif size == 127:
                size = struct.unpack('!Q', self._read(8))[0]
            mask = self._read(4) if second & 128 else None
            data = self._read(size)
            if mask:
                data = bytes(v ^ mask[i % 4] for i, v in enumerate(data))
            opcode = first & 15
            if opcode == 9:
                self._send(data, 10)
                continue
            if opcode == 8:
                raise RuntimeError('Native Chrome transport closed')
            if opcode in (0, 1):
                parts.append(data)
                if first & 128:
                    return json.loads(b''.join(parts))

    def call(self, method, params=None):
        self.serial += 1
        serial = self.serial
        self._send(json.dumps({'id': serial, 'method': method, 'params': params or {}}).encode())
        while True:
            message = self._receive()
            if message.get('id') == serial:
                if 'error' in message:
                    raise RuntimeError(message['error'])
                return message.get('result', {})

    def evaluate(self, expression):
        result = self.call('Runtime.evaluate', {'expression': expression, 'returnByValue': True})
        if 'exceptionDetails' in result:
            raise RuntimeError(result['exceptionDetails'])
        return result['result'].get('value')

    def capture(self, screen, device, path):
        width, height = (390, 844) if device == 'mobile' else (1440, 900)
        self.call('Emulation.setDeviceMetricsOverride', {
            'width': width, 'height': height, 'deviceScaleFactor': 2,
            'mobile': False, 'screenWidth': width, 'screenHeight': height,
        })
        self.call('Emulation.setEmulatedMedia', {'features': [
            {'name': 'prefers-reduced-motion', 'value': 'reduce'},
        ]})
        url = (HERE/'render-screen.html').as_uri()+'?screen='+str(screen)
        self.call('Page.navigate', {'url': url})
        deadline = time.monotonic()+15
        while not self.evaluate('document.documentElement.dataset.ready === "yes" && document.querySelector("main")?.dataset.screen === "'+str(screen)+'"'):
            if time.monotonic() > deadline:
                raise RuntimeError('Screen did not become ready: '+str(screen))
            time.sleep(.08)
        report = self.evaluate('JSON.parse(document.getElementById("audit-evidence").textContent)')
        png = self.call('Page.captureScreenshot', {'format': 'png', 'captureBeyondViewport': False,
                                                   'fromSurface': True})
        path.write_bytes(base64.b64decode(png['data']))
        return report

    def close(self):
        self.sock.close()
        self.proc.terminate()
        try:
            self.proc.wait(timeout=5)
        except subprocess.TimeoutExpired:
            self.proc.kill()
        self.log.close()
        shutil.rmtree(self.profile, ignore_errors=True)


def validate(report, device, image_path):
    expected = (390, 844) if device == 'mobile' else (1440, 900)
    assert report['viewport'] == {'width': expected[0], 'height': expected[1], 'dpr': 2}, report['viewport']
    with Image.open(image_path) as im:
        assert im.size == (expected[0]*2, expected[1]*2), im.size
    problems = {k: report[k] for k in ['brokenImages', 'undersizedTargets', 'textClipping', 'contentOverflow',
                                      'uiBandIntrusions'] if report[k]}
    if report['horizontalOverflow']:
        problems['horizontalOverflow'] = True
    if not report['fontReady']:
        problems['fontReady'] = False
    for face in report['faces']:
        if not face['eyeInBand'] or face['overlaps']:
            problems.setdefault('faces', []).append(face)
    return problems


def assemble(viewport, device, frames, output):
    frame = Image.open(OUT/frames[device]['file']).convert('RGBA')
    screen = Image.open(viewport).convert('RGBA')
    left, top, right, bottom = frames[device]['opening']
    assert screen.size == (right-left, bottom-top)
    base = Image.new('RGBA', frame.size, '#171a18')
    base.alpha_composite(screen, (left, top))
    base.alpha_composite(frame)
    rgb = base.convert('RGB')
    rgb.save(output)
    rgb.save(output.with_suffix('.webp'), lossless=True, method=6)
    return list(rgb.size)


def hud_pixel_audit(reports):
    reference = None
    mask = Image.new('L', (716, 128), 0)
    ImageDraw.Draw(mask).rounded_rectangle((5, 5, 710, 122), radius=59, fill=255)
    records = []
    for report in reports:
        box = report['hud']
        assert box['width'] == 358 and box['height'] == 64
        image_path = OUT/report['viewportFile']
        with Image.open(image_path).convert('RGB') as im:
            crop = im.crop((round(box['x']*2), round(box['y']*2),
                            round(box['right']*2), round(box['bottom']*2)))
        isolated = Image.new('RGB', crop.size)
        isolated.paste(crop, (0, 0), mask)
        if reference is None:
            reference = isolated
            reference.save(OUT/'evidence/top-hud-master.png')
        records.append({'screen': report['screen'],
                        'sha256Pixels': hashlib.sha256(isolated.tobytes()).hexdigest(),
                        'sameAsMaster': ImageChops.difference(reference, isolated).getbbox() is None})
    return {'method': '358×64 CSS px same master on ALL ten screens, including desktop/mobile. Compare fully covered pill interior; transparent antialias corner pixels belong to the scene and are excluded.',
            'allIdentical': all(r['sameAsMaster'] for r in records), 'screens': records}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--screens', default='1,2,3,4,5,6,7,8,9,10')
    args = parser.parse_args()
    selected = [int(n) for n in args.screens.split(',')]
    frames = master_frames()
    chrome = NativeChrome()
    reports = []
    try:
        for number in selected:
            stem, device = SCREENS[number-1]
            viewport = OUT/'viewports'/(stem+'.png')
            report = chrome.capture(number, device, viewport)
            report['viewportFile'] = str(viewport.relative_to(OUT))
            report['problems'] = validate(report, device, viewport)
            report['deviceDimensions'] = assemble(viewport, device, frames, OUT/(stem+'.png'))
            (OUT/'evidence'/f'screen-{number:02}.json').write_text(json.dumps(report, ensure_ascii=False, indent=2))
            reports.append(report)
            print(json.dumps({'screen': number, 'file': stem, 'problems': report['problems']}, ensure_ascii=False), flush=True)
        (OUT/'evidence/chrome-version.json').write_text(json.dumps(chrome.version, indent=2))
    finally:
        chrome.close()
    if len(selected) == 10:
        hud = hud_pixel_audit(reports)
        (OUT/'evidence/hud-pixel-audit.json').write_text(json.dumps(hud, indent=2))
        print(json.dumps({'hudAllIdentical': hud['allIdentical']}), flush=True)


if __name__ == '__main__':
    main()
