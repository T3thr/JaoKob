// CR-0004: isolated preview; no dependency is imported by the game entry point.
import { th } from './th.js';

const open = document.querySelector('#open');
const status = document.querySelector('#status');
const controls = document.querySelector('#controls');
const poster = document.querySelector('#poster');
const mount = document.querySelector('#mount');
const initialOrbit = '25deg 78deg 105%';
let viewer;
let pendingModule;
let mode = 'poster';
let timeout;
let failedLoads = 0;

for (const element of document.querySelectorAll('[data-text]')) element.textContent = th[element.dataset.text];
poster.alt = th.alt;

function fail() {
  clearTimeout(timeout);
  failedLoads += 1;
  viewer?.remove();
  viewer = undefined;
  mode = 'error';
  poster.hidden = false;
  controls.hidden = true;
  open.hidden = false;
  open.disabled = false;
  status.textContent = th.error;
  status.classList.remove('sr-only');
}

async function show() {
  if (mode === 'loading' || mode === 'ready') return;
  mode = 'loading';
  open.disabled = true;
  status.textContent = th.loading;
  status.classList.remove('sr-only');
  timeout = setTimeout(fail, 30000);
  try {
    // There is deliberately no modulepreload or <script src=model-viewer> in HTML.
    pendingModule ??= import('../node_modules/@google/model-viewer/dist/model-viewer.min.js');
    await pendingModule;
    if (mode !== 'loading') return;
    viewer = document.createElement('model-viewer');
    viewer.alt = th.alt;
    viewer.a11y = th.directions;
    viewer.setAttribute('camera-controls', '');
    viewer.setAttribute('disable-pan', '');
    viewer.setAttribute('touch-action', 'pan-y');
    viewer.setAttribute('camera-orbit', initialOrbit);
    viewer.setAttribute('min-camera-orbit', 'auto 12deg 45%');
    viewer.setAttribute('max-camera-orbit', 'auto 165deg 180%');
    viewer.setAttribute('shadow-intensity', '.65');
    viewer.setAttribute('shadow-softness', '1');
    viewer.setAttribute('exposure', '.85');
    viewer.setAttribute('interaction-prompt', 'none');
    viewer.setAttribute('loading', 'eager');
    viewer.setAttribute('interpolation-decay', matchMedia('(prefers-reduced-motion: reduce)').matches ? '0' : '60');
    viewer.addEventListener('error', fail, { once: true });
    viewer.addEventListener('load', () => {
      clearTimeout(timeout);
      mode = 'ready';
      poster.hidden = true;
      open.hidden = true;
      controls.hidden = false;
      open.disabled = false;
      status.textContent = th.ready;
      status.classList.add('sr-only');
      controls.querySelector('button').focus({ preventScroll: true });
    }, { once: true });
    // A failed GLTF promise may be retained by the component's shared cache.
    // Use a fresh same-origin key only after failure; normal reopens reuse cache.
    viewer.src = `../model/jaokob-adult-plush.glb${failedLoads ? `?retry=${failedLoads}` : ''}`;
    mount.append(viewer);
  } catch {
    pendingModule = undefined;
    fail();
  }
}

function act(action) {
  if (!viewer || mode !== 'ready') return;
  if (action === 'close') {
    clearTimeout(timeout);
    viewer.remove();
    viewer = undefined;
    mode = 'poster';
    poster.hidden = false;
    controls.hidden = true;
    open.hidden = false;
    status.textContent = '';
    open.focus();
    return;
  }
  if (action === 'reset') {
    viewer.cameraOrbit = initialOrbit;
    viewer.fieldOfView = 'auto';
    // Gestures change the internal camera without changing cameraOrbit's value.
    // Force the pinned Lit component to reapply an unchanged requested orbit.
    viewer.requestUpdate('cameraOrbit');
    viewer.requestUpdate('fieldOfView');
    return;
  }
  const orbit = viewer.getCameraOrbit();
  if (action === 'left') orbit.theta -= Math.PI / 12;
  if (action === 'right') orbit.theta += Math.PI / 12;
  if (action === 'up') orbit.phi = Math.max(Math.PI / 15, orbit.phi - Math.PI / 18);
  if (action === 'down') orbit.phi = Math.min(Math.PI * 11 / 12, orbit.phi + Math.PI / 18);
  if (action === 'in') orbit.radius *= .85;
  if (action === 'out') orbit.radius *= 1.15;
  viewer.cameraOrbit = `${orbit.theta}rad ${orbit.phi}rad ${orbit.radius}m`;
}

open.addEventListener('click', show);
controls.addEventListener('click', event => {
  const button = event.target.closest('button[data-action]');
  if (button) act(button.dataset.action);
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && mode === 'ready') act('close');
});

// Inspection hooks only in this excluded spike page, for reproducible browser QA.
window.render_game_to_text = () => JSON.stringify({ mode, loaded: Boolean(viewer?.loaded), orbit: viewer?.loaded ? viewer.getCameraOrbit() : null });
window.advanceTime = async () => new Promise(resolve => requestAnimationFrame(resolve));
