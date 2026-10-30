#!/usr/bin/env python3
"""Exercise offline comparison tabs and diagnostic controls in native Chrome."""
import base64
import json
import time

from render_mockups import NativeChrome, OUT, REPO


def wait_for(chrome, expression):
    deadline = time.monotonic()+15
    while not chrome.evaluate(expression):
        if time.monotonic() > deadline:
            raise RuntimeError('Review did not reach its expected state')
        time.sleep(.08)


def main():
    chrome = NativeChrome()
    results = []
    try:
        chrome.call('Emulation.setDeviceMetricsOverride', {'width': 1440, 'height': 1000, 'deviceScaleFactor': 1, 'mobile': False})
        chrome.call('Page.navigate', {'url': (REPO/'docs/design-system/evidence/ux-mockups-v2-review.html').as_uri()})
        wait_for(chrome, 'document.documentElement.dataset.reviewReady === "yes"')
        for mode in range(5):
            for device in ('both', 'desktop', 'mobile'):
                chrome.evaluate(f'document.querySelectorAll(".review-tab")[{mode}].click(); document.querySelector("[data-device={device}]").click()')
                wait_for(chrome, '[...document.images].every(i=>i.complete && i.naturalWidth>0) && document.fonts.status === "loaded"')
                state = chrome.evaluate('({images:document.querySelectorAll(".device-image img").length,horizontalOverflow:document.documentElement.scrollWidth>innerWidth,tab:[...document.querySelectorAll(".review-tab")].findIndex(b=>b.getAttribute("aria-selected")==="true")})')
                assert state['images'] == (4 if device == 'both' else 2)
                assert state['tab'] == mode and not state['horizontalOverflow']
                results.append({'mode': mode+1, 'device': device, **state})
        chrome.evaluate('document.querySelectorAll(".review-tab")[0].focus()')
        for kind in ('keyDown', 'keyUp'):
            chrome.call('Input.dispatchKeyEvent', {'type': kind, 'key': 'ArrowRight', 'code': 'ArrowRight'})
        assert chrome.evaluate('document.querySelectorAll(".review-tab")[1].getAttribute("aria-selected") === "true"')
        chrome.evaluate('document.querySelector("[data-device=both]").click(); document.getElementById("face-toggle").click(); document.getElementById("target-toggle").click()')
        assert chrome.evaluate('document.body.classList.contains("with-face") && document.body.classList.contains("with-targets")')
        assert chrome.evaluate('[...document.querySelectorAll(".guide-band")].every(n=>getComputedStyle(n).display === "block")')
        chrome.evaluate('document.querySelectorAll(".review-tab")[0].click(); document.getElementById("face-toggle").click(); document.getElementById("target-toggle").click()')
        wait_for(chrome, '[...document.images].every(i=>i.complete && i.naturalWidth>0)')
        png = chrome.call('Page.captureScreenshot', {'format': 'png', 'captureBeyondViewport': True,
            'clip': {'x': 0, 'y': 0, 'width': 1440, 'height': 1900, 'scale': 1}})
        (OUT/'evidence/review-desktop.png').write_bytes(base64.b64decode(png['data']))
        chrome.call('Emulation.setDeviceMetricsOverride', {'width': 390, 'height': 844, 'deviceScaleFactor': 1, 'mobile': False})
        assert not chrome.evaluate('document.documentElement.scrollWidth>innerWidth')
        png = chrome.call('Page.captureScreenshot', {'format': 'png', 'captureBeyondViewport': False})
        (OUT/'evidence/review-mobile.png').write_bytes(base64.b64decode(png['data']))
    finally:
        chrome.close()
    evidence = {'offlineFileUrl': True, 'statesChecked': results, 'arrowKeyNavigation': True,
                'faceGuideToggle': True, 'targetGuideToggle': True,
                'horizontalOverflowDesktop': False, 'horizontalOverflowMobile': False,
                'brokenImages': 0}
    (OUT/'evidence/review-audit.json').write_text(json.dumps(evidence, indent=2))
    print(json.dumps({'reviewStatesPassed': len(results), 'keyboardAndToggles': True, 'offline': True}))


if __name__ == '__main__':
    main()
