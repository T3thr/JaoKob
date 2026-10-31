#!/usr/bin/env python3
"""Native Chrome DevTools + Pillow. Reuses v2 transport and device frames in place."""
import argparse,base64,hashlib,importlib.util,json,threading,time
from functools import partial
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from pathlib import Path
from PIL import Image,ImageChops,ImageDraw
HERE=Path(__file__).resolve().parent
OUT=HERE.parent
REPO=HERE.parents[4]
V2=OUT.parent/'v2'
spec=importlib.util.spec_from_file_location('native_v2',V2/'harness/render_mockups.py')
v2=importlib.util.module_from_spec(spec);spec.loader.exec_module(v2)
v2.OUT=OUT
class Quiet(SimpleHTTPRequestHandler):
    def log_message(self,*args): pass

def browser_server():
    server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(REPO)))
    threading.Thread(target=server.serve_forever,daemon=True).start()
    return server

def wait_ready(c,screen):
    deadline=time.monotonic()+25
    while not c.evaluate('document.documentElement.dataset.ready === "yes" && document.querySelector("main")?.dataset.screen === "'+str(screen)+'"'):
        if time.monotonic()>deadline:
            raise RuntimeError('Screen not ready '+str(screen)+' '+str(c.evaluate('document.body.innerText')))
        time.sleep(.08)

def capture(c,screen,url):
    w,h=(390,844) if screen['mobile'] else (1440,900)
    c.call('Emulation.setDeviceMetricsOverride',{'width':w,'height':h,'deviceScaleFactor':2,'mobile':False,'screenWidth':w,'screenHeight':h})
    c.call('Emulation.setEmulatedMedia',{'features':[{'name':'prefers-reduced-motion','value':'reduce'}]})
    c.call('Page.navigate',{'url':url+'?screen='+str(screen['id'])});wait_ready(c,screen['id'])
    report=c.evaluate('window.audit()')
    png=c.call('Page.captureScreenshot',{'format':'png','captureBeyondViewport':False,'fromSurface':True})
    path=OUT/'viewports'/(screen['stem']+'.png');path.write_bytes(base64.b64decode(png['data']))
    report['viewportFile']=str(path.relative_to(OUT))
    problems={k:report[k] for k in ['brokenImages','textOverlaps','undersizedTargets','textClipping','contentOverflow','uiBandIntrusions'] if report[k]}
    if report['horizontalOverflow']:problems['horizontalOverflow']=True
    if not report['fontReady']:problems['fontReady']=False
    with Image.open(path) as im:assert im.size==(w*2,h*2)
    report['problems']=problems
    return report,path

def assemble(viewport,screen,frames):
    frame=frames['mobile' if screen['mobile'] else 'desktop']
    with Image.open(V2/frame['file']).convert('RGBA') as bezel,Image.open(viewport).convert('RGBA') as vp:
        x,y,right,bottom=frame['opening'];assert vp.size==(right-x,bottom-y)
        result=Image.new('RGBA',bezel.size,'#171a18');result.alpha_composite(vp,(x,y));result.alpha_composite(bezel)
        rgb=result.convert('RGB');dest=OUT/(screen['stem']+'.png');rgb.save(dest,optimize=True);rgb.save(dest.with_suffix('.webp'),quality=94,method=6)
        return list(rgb.size)

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--screens',default=','.join(str(i) for i in range(1,14)));ap.add_argument('--no-frames',action='store_true');args=ap.parse_args()
    selected=[int(i) for i in args.screens.split(',')]
    fixtures=json.loads((HERE/'fixtures.json').read_text());frames=json.loads((V2/'frames/frame-manifest.json').read_text())
    server=browser_server();c=v2.NativeChrome();url='http://127.0.0.1:'+str(server.server_port)+'/'+str((HERE/'render-screen.html').relative_to(REPO))
    reports=[];tabs=[];hud_records=[];hud_reference=None;necklace=None
    try:
        for screen in fixtures['screens']:
            if screen['id'] not in selected:continue
            r,path=capture(c,screen,url)
            if not args.no_frames:r['deviceDimensions']=assemble(path,screen,frames)
            # Real click + keyboard checks on every mobile group, preserve fixed tray bounds.
            if screen['clash'] and screen['mobile']:
                initial=c.evaluate('document.querySelector(".clash-tray").getBoundingClientRect().toJSON()')
                group_counts={}
                for g in ['family','friends','pouch']:
                    if not any(a['group']==g for a in screen['clash']['cards']):continue
                    c.evaluate('document.getElementById("tab-'+g+'").click()')
                    observed=c.evaluate('window.audit()');bounds=c.evaluate('document.querySelector(".clash-tray").getBoundingClientRect().toJSON()')
                    group_counts[g]=observed['visibleActions'];assert bounds==initial,'Tab layout shift'
                    assert not observed['textClipping'] and not observed['contentOverflow'],observed
                c.evaluate('document.getElementById("tab-family").focus()')
                c.call('Input.dispatchKeyEvent',{'type':'keyDown','key':'ArrowRight','code':'ArrowRight'})
                c.call('Input.dispatchKeyEvent',{'type':'keyUp','key':'ArrowRight','code':'ArrowRight'})
                assert c.evaluate('document.activeElement.id')=='tab-friends'
                tabs.append({'screen':screen['id'],'groups':group_counts,'layoutShift':0,'keyboardArrowRight':True})
            # Compare the master shell at a common state, rather than falsifying live HUD meters.
            if necklace is None:necklace=c.evaluate('document.querySelector(".bond-necklace").innerHTML')
            c.evaluate('document.querySelector(".hud-position").style.opacity="1";document.querySelectorAll(".pips").forEach(p=>[...p.children].forEach((x,i)=>x.classList.toggle("spent",i>=4)));document.querySelector(".bond-necklace").innerHTML='+json.dumps(necklace))
            box=r['hud'];raw=c.call('Page.captureScreenshot',{'format':'png','clip':{'x':box['x'],'y':box['y'],'width':358,'height':64,'scale':1}})
            import io
            im=Image.open(io.BytesIO(base64.b64decode(raw['data']))).convert('RGB')
            assert im.size==(716,128),im.size
            mask=Image.new('L',im.size,0);ImageDraw.Draw(mask).rounded_rectangle((5,5,710,122),radius=59,fill=255)
            isolated=Image.new('RGB',im.size);isolated.paste(im,(0,0),mask)
            if hud_reference is None:hud_reference=isolated;isolated.save(OUT/'evidence/top-hud-master.png')
            hud_records.append({'screen':screen['id'],'sha256Pixels':hashlib.sha256(isolated.tobytes()).hexdigest(),'sameAsMaster':ImageChops.difference(hud_reference,isolated).getbbox() is None})
            (OUT/'evidence'/('screen-'+str(screen['id']).zfill(2)+'.json')).write_text(json.dumps(r,ensure_ascii=False,indent=2)+'\n')
            reports.append(r);print(json.dumps({'screen':screen['id'],'problems':r['problems']},ensure_ascii=False),flush=True)
        (OUT/'evidence/chrome-version.json').write_text(json.dumps(c.version,indent=2)+'\n')
    finally:c.close();server.shutdown();server.server_close()
    (OUT/'evidence/tab-audit.json').write_text(json.dumps(tabs,ensure_ascii=False,indent=2)+'\n')
    (OUT/'evidence/hud-pixel-audit.json').write_text(json.dumps({'method':'Same canonical shell and common-state pixels. Delivered screenshots retain true per-screen meters/bonds and 40% micro-action HUD opacity. Transparent corner pixels excluded.','allIdentical':all(x['sameAsMaster'] for x in hud_records),'screens':hud_records},indent=2)+'\n')
    assert not any(r['problems'] for r in reports),'Visual geometry gate failed; inspect screen reports'
if __name__=='__main__':main()
