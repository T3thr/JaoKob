#!/usr/bin/env python3
"""Exercise the delivered offline gallery through native Chrome, without packages."""
import base64
import json
import time
from render_mockups import OUT, REPO, v2


def wait_for(chrome, expression):
    deadline = time.monotonic() + 15
    while not chrome.evaluate(expression):
        if time.monotonic() > deadline:
            raise RuntimeError('Review state not ready: ' + expression)
        time.sleep(.08)


def main():
    chrome = v2.NativeChrome()
    results = []
    try:
        chrome.call('Emulation.setDeviceMetricsOverride', {
            'width': 1440, 'height': 1000, 'deviceScaleFactor': 1, 'mobile': False})
        chrome.call('Page.navigate', {'url': (REPO / 'docs/design-system/evidence/ux-mockups-v3-review.html').as_uri()})
        wait_for(chrome, 'document.documentElement.dataset.ready === "yes"')
        chrome.evaluate('document.querySelectorAll(".thumb img").forEach(i=>i.loading="eager")')
        for screen in range(1, 14):
            chrome.evaluate('document.querySelectorAll(".thumb")[' + str(screen - 1) + '].click()')
            for mode in ['v3', 'v2', 'blueprint']:
                chrome.evaluate('document.getElementById("' + mode + '").click()')
                for framed in [True, False]:
                    if chrome.evaluate('document.getElementById("device").getAttribute("aria-pressed")') != str(framed).lower():
                        chrome.evaluate('document.getElementById("device").click()')
                    absent = screen > 10 and mode == 'v2'
                    if not absent:
                        wait_for(chrome, 'document.getElementById("hero").complete && document.getElementById("hero").naturalWidth>0 && document.fonts.status==="loaded"')
                    status = chrome.evaluate('({screen:Number(document.getElementById("screen-picker").value),hidden:document.querySelector(".image-wrap").hidden,guides:!document.querySelector(".guide-layer").hidden,overflow:document.documentElement.scrollWidth>innerWidth,source:document.getElementById("hero").getAttribute("src")})')
                    assert status['screen'] == screen and status['hidden'] == absent
                    assert status['guides'] == (mode == 'blueprint') and not status['overflow']
                    results.append({'mode': mode, 'deviceFrame': framed, **status})
        wait_for(chrome, '[...document.querySelectorAll(".thumb img")].every(i=>i.complete && i.naturalWidth>0)')
        chrome.evaluate('document.querySelectorAll(".thumb")[10].click();document.getElementById("v3").click();document.getElementById("device").click()')
        wait_for(chrome, 'document.getElementById("hero").complete && document.getElementById("hero").naturalWidth>0')
        # A native keyboard activation of the diagnostic button.
        chrome.evaluate('document.getElementById("blueprint").focus()')
        for kind in ['keyDown', 'keyUp']:
            chrome.call('Input.dispatchKeyEvent', {'type': kind, 'key': 'Enter', 'code': 'Enter', 'windowsVirtualKeyCode': 13, 'text': '\r' if kind == 'keyDown' else ''})
        wait_for(chrome, 'document.getElementById("blueprint").getAttribute("aria-pressed")==="true"')
        chrome.evaluate('document.getElementById("v3").click();window.scrollTo(0,0)')
        for label, width, height in [('desktop', 1440, 1000), ('mobile', 390, 844)]:
            chrome.call('Emulation.setDeviceMetricsOverride', {'width': width, 'height': height, 'deviceScaleFactor': 1, 'mobile': False})
            assert not chrome.evaluate('document.documentElement.scrollWidth>innerWidth'), chrome.evaluate('[...document.querySelectorAll("body *")].filter(n=>n.getBoundingClientRect().right>innerWidth+1).slice(0,10).map(n=>({tag:n.tagName,cls:n.className,width:n.getBoundingClientRect().width,right:n.getBoundingClientRect().right}))')
            shot = chrome.call('Page.captureScreenshot', {'format': 'png', 'captureBeyondViewport': False})
            (OUT / 'evidence' / ('review-' + label + '.png')).write_bytes(base64.b64decode(shot['data']))
    finally:
        chrome.close()
    evidence = {'offlineFileUrl': True, 'statesChecked': results, 'statesPassed': len(results),
                'keyboardActivation': True, 'horizontalOverflowDesktop': False,
                'horizontalOverflowMobile': False, 'brokenGalleryImages': 0}
    (OUT / 'evidence/review-audit.json').write_text(json.dumps(evidence, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({'reviewStatesPassed': len(results), 'keyboardActivation': True, 'offline': True}))


if __name__ == '__main__':
    main()
