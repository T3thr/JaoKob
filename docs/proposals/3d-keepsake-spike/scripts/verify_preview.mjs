// CR-0004: run with JKB_PLAYWRIGHT_PATH pointing to an existing Playwright module.
import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
const { chromium } = await import(process.env.JKB_PLAYWRIGHT_PATH ? pathToFileURL(process.env.JKB_PLAYWRIGHT_PATH).href : 'playwright');
const base = 'http://127.0.0.1:4174';
const evidence = new URL('../evidence/', import.meta.url);
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1280, height: 960 } });
const page = await context.newPage();
const requests = [], errors = [], checks = [];
page.on('request', request => requests.push(request.url()));
page.on('pageerror', error => errors.push(error.message));
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
const ready = p => p.waitForFunction(() => JSON.parse(window.render_game_to_text()).mode === 'ready');
const orbit = p => p.evaluate(() => ({ ...document.querySelector('model-viewer').getCameraOrbit() }));
const settle = p => p.waitForTimeout(400);

try {
  await page.goto(base + '/preview/');
  await page.waitForTimeout(300);
  assert.equal(requests.some(url => /\.glb|model-viewer/.test(url)), false);
  checks.push('No GLB or model-viewer request before activation');
  await page.locator('#open').focus();
  await page.keyboard.press('Enter');
  await ready(page);
  await settle(page);
  const start = await orbit(page);
  assert.equal(await page.locator('[data-action="left"]').evaluate(el => el === document.activeElement), true);
  await page.keyboard.press('Enter');
  await settle(page);
  assert.ok((await orbit(page)).theta < start.theta);
  await page.locator('[data-action="right"]').click();
  await settle(page);
  assert.ok(Math.abs((await orbit(page)).theta-start.theta) < .01);
  await page.locator('[data-action="in"]').click();
  await settle(page);
  assert.ok((await orbit(page)).radius < start.radius);
  await page.locator('[data-action="out"]').click();
  await page.locator('[data-action="up"]').click();
  await settle(page);
  assert.ok((await orbit(page)).phi < start.phi);
  await page.locator('[data-action="down"]').click();
  await page.locator('[data-action="reset"]').click();
  await settle(page);
  assert.ok(Math.abs((await orbit(page)).radius-start.radius) < .01);
  checks.push('Keyboard activation, focus transfer, rotate/tilt/zoom/reset buttons');
  const box = await page.locator('model-viewer').boundingBox();
  await page.mouse.move(box.x+box.width*.5, box.y+box.height*.55);
  await page.mouse.down();
  await page.mouse.move(box.x+box.width*.7, box.y+box.height*.55, { steps: 15 });
  await page.mouse.up();
  await settle(page);
  assert.ok(Math.abs((await orbit(page)).theta-start.theta) > .1);
  const beforeWheel = await orbit(page);
  await page.mouse.wheel(0,-120);
  await settle(page);
  assert.ok((await orbit(page)).radius < beforeWheel.radius);
  checks.push('Pointer drag and mousewheel change camera');
  await page.locator('[data-action="reset"]').click();
  await settle(page);
  await page.screenshot({ path: new URL('preview-desktop.png', evidence).pathname, fullPage: true });
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('model-viewer').count(), 0);
  assert.equal(await page.locator('#open').evaluate(el => el === document.activeElement), true);
  for (let i=0; i<3; i++) {
    await page.locator('#open').click(); await ready(page);
    assert.equal(await page.locator('model-viewer').count(), 1);
    await page.keyboard.press('Escape');
  }
  checks.push('Escape, focus restoration and three reopen cycles without duplicate viewers');
  assert.deepEqual(requests.filter(url => !url.startsWith(base)), []);
  assert.deepEqual(errors, []);
  checks.push('No third-party network requests or browser console/page errors');

  const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
  const mobile = await mobileContext.newPage();
  await mobile.goto(base+'/preview/');
  await mobile.locator('#open').tap(); await ready(mobile);
  assert.equal(await mobile.locator('model-viewer').getAttribute('interpolation-decay'), '0');
  assert.equal(await mobile.locator('model-viewer').getAttribute('auto-rotate'), null);
  for (const button of await mobile.locator('#controls button').all()) {
    const rect = await button.boundingBox(); assert.ok(rect.height >= 44 && rect.width >= 44);
  }
  assert.equal(await mobile.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  const touchBox = await mobile.locator('model-viewer').boundingBox();
  const cdp = await mobileContext.newCDPSession(mobile);
  const cy = touchBox.y+touchBox.height*.5, cx=touchBox.x+touchBox.width*.5;
  const beforeTouch = await orbit(mobile);
  const beforeTouchFov = await mobile.locator('model-viewer').evaluate(v=>v.getFieldOfView());
  await cdp.send('Input.dispatchTouchEvent', { type:'touchStart', touchPoints:[{x:cx,y:cy}] });
  for (let i=1;i<=10;i++) await cdp.send('Input.dispatchTouchEvent', { type:'touchMove', touchPoints:[{x:cx+i*7,y:cy}] });
  await cdp.send('Input.dispatchTouchEvent', { type:'touchEnd', touchPoints:[] });
  await settle(mobile);
  assert.ok(Math.abs((await orbit(mobile)).theta-beforeTouch.theta) > .05);
  const beforePinch = await orbit(mobile);
  await cdp.send('Input.dispatchTouchEvent', { type:'touchStart', touchPoints:[{id:0,x:cx-30,y:cy},{id:1,x:cx+30,y:cy}] });
  for (let i=1;i<=8;i++) await cdp.send('Input.dispatchTouchEvent', { type:'touchMove', touchPoints:[{id:0,x:cx-30-i*5,y:cy},{id:1,x:cx+30+i*5,y:cy}] });
  await cdp.send('Input.dispatchTouchEvent', { type:'touchEnd', touchPoints:[] });
  await settle(mobile);
  assert.ok((await orbit(mobile)).radius < beforePinch.radius);
  await mobile.locator('[data-action="reset"]').tap(); await settle(mobile);
  assert.ok(Math.abs((await orbit(mobile)).radius-beforeTouch.radius) < .001, 'Reset must undo pinch even when camera-orbit attribute was unchanged');
  assert.ok(Math.abs((await orbit(mobile)).theta-beforeTouch.theta) < .001);
  assert.ok(Math.abs(await mobile.locator('model-viewer').evaluate(v=>v.getFieldOfView())-beforeTouchFov) < .01, 'Reset also restores FOV changed by pinch zoom');
  await mobile.screenshot({ path:new URL('preview-mobile.png',evidence).pathname, fullPage:true });
  await mobile.setViewportSize({width:320,height:568});
  assert.equal(await mobile.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  checks.push('390px/320px layout, 44px controls, reduced motion, emulated touch orbit and pinch');
  await mobileContext.close();

  const failure = await context.newPage();
  await failure.route('**/*.glb', route=>route.abort());
  await failure.goto(base+'/preview/'); await failure.locator('#open').click();
  await failure.waitForFunction(() => JSON.parse(window.render_game_to_text()).mode === 'error');
  assert.equal(await failure.locator('#poster').isVisible(), true);
  assert.equal(await failure.locator('#open').isEnabled(), true);
  await failure.unroute('**/*.glb');
  await failure.locator('#open').click(); await ready(failure);
  checks.push('Failed GLB preserves poster and a retry loads successfully');
  await failure.close();
  await writeFile(new URL('preview-verification.json', evidence), JSON.stringify({
    status:'passed', browser:await browser.version(), checks, errors,
    requestedPaths:[...new Set(requests)].map(url=>new URL(url).pathname),
    notPerformed:['Physical iPhone/Android performance','Safari/VoiceOver','GPU memory profiling','Final owner likeness approval','Production END-HOME integration'],
  }, null, 2)+'\n');
  console.log(JSON.stringify({status:'passed', checks},null,2));
} finally { await browser.close(); }
