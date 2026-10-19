// ADR-P0-025 / CR-0004: isolated preview; no dependency is imported by the game entry point.
import { th } from './th.js';

const dolls = Object.freeze({
  childhood: { model: 'jaokob-childhood-crochet.glb', poster: '../renders/childhood/poster.jpg', text: th.childhood, variants: th.childhoodVariantAlt, variantDir: '../renders/childhood' },
  adult: { model: 'jaokob-adult-plush.glb', poster: '../renders/poster.jpg', text: th.adult, variants: th.adultVariantAlt, variantDir: '../renders/adult' },
});
const open = document.querySelector('#open');
const status = document.querySelector('#status');
const controls = document.querySelector('#controls');
const poster = document.querySelector('#poster');
const mount = document.querySelector('#mount');
const selector = document.querySelector('#doll-selector');
const initialOrbit = '25deg 78deg 105%';
const failedLoads = { childhood: 0, adult: 0 };
let selected = 'childhood';
let stance = 'empty';
let material = 'Velour';
const options = document.querySelector('#variant-options');
const selections = { childhood: { stance: 'empty', material: 'Velour' }, adult: { stance: 'empty', material: 'Velour' } };
let viewer;
let pendingModule;
let mode = 'poster';
let timeout;
let requestId = 0;

for (const element of document.querySelectorAll('[data-text]')) element.textContent = th[element.dataset.text];
selector.setAttribute('aria-label', th.selectDoll);

function describeSelection() {
  const doll = dolls[selected];
  const defaultVariant = stance === 'empty' && material === 'Velour';
  poster.src = !defaultVariant
    ? `${doll.variantDir}/poster-${stance}-${material.toLowerCase()}.jpg` : doll.poster;
  poster.alt = selectionAlt();
  for (const button of options.querySelectorAll('[data-stance]')) button.setAttribute('aria-pressed', String(button.dataset.stance === stance));
  for (const button of options.querySelectorAll('[data-material]')) button.setAttribute('aria-pressed', String(button.dataset.material === material));
  document.querySelector('#doll-title').textContent = doll.text.name;
  document.querySelector('#edition').textContent = doll.text.edition;
  for (const button of selector.querySelectorAll('button')) {
    button.setAttribute('aria-pressed', String(button.dataset.doll === selected));
  }
}

function selectionAlt() {
  return dolls[selected].variants[`${stance}-${material}`];
}

function applyVariants(current) {
  current.pause();
  current.currentTime = stance === 'heart' ? 1 : 0;
  current.variantName = material;
  current.alt = selectionAlt();
}

function selectVariant(button) {
  if (button.dataset.stance) stance = button.dataset.stance;
  if (button.dataset.material) material = button.dataset.material;
  describeSelection();
  if (mode === 'ready') {
    applyVariants(viewer);
    status.textContent = selectionAlt();
  }
}

function dispose() {
  requestId += 1; // Invalidate old import/load/error callbacks before removing their element.
  clearTimeout(timeout);
  viewer?.remove();
  viewer = undefined;
  poster.hidden = false;
  controls.hidden = true;
  open.hidden = false;
  open.disabled = false;
}

function fail(id, dollId) {
  if (id !== requestId) return;
  failedLoads[dollId] += 1;
  dispose();
  mode = 'error';
  status.textContent = th.error;
  status.classList.remove('sr-only');
}

async function show({ focusControls = true } = {}) {
  if (mode === 'loading' || mode === 'ready') return;
  const id = ++requestId;
  const dollId = selected;
  const doll = dolls[dollId];
  mode = 'loading';
  open.disabled = true;
  status.textContent = th.loading;
  status.classList.remove('sr-only');
  timeout = setTimeout(() => fail(id, dollId), 30000);
  try {
    // No modulepreload or component request until the user opens 3D.
    pendingModule ??= import('../node_modules/@google/model-viewer/dist/model-viewer.min.js').catch(error => {
      pendingModule = undefined;
      throw error;
    });
    await pendingModule;
    if (id !== requestId) return;
    const current = document.createElement('model-viewer');
    viewer = current;
    current.alt = selectionAlt();
    current.animationName = 'HeartEmote';
    current.animationCrossfadeDuration = 0;
    current.variantName = material;
    current.a11y = th.directions;
    current.setAttribute('camera-controls', '');
    current.setAttribute('disable-pan', '');
    current.setAttribute('touch-action', 'pan-y');
    current.setAttribute('camera-orbit', initialOrbit);
    current.setAttribute('min-camera-orbit', 'auto 12deg 45%');
    current.setAttribute('max-camera-orbit', 'auto 165deg 180%');
    current.setAttribute('shadow-intensity', '.65');
    current.setAttribute('shadow-softness', '1');
    current.setAttribute('exposure', '.85');
    current.setAttribute('interaction-prompt', 'none');
    current.setAttribute('loading', 'eager');
    current.setAttribute('interpolation-decay', matchMedia('(prefers-reduced-motion: reduce)').matches ? '0' : '60');
    current.addEventListener('error', () => fail(id, dollId), { once: true });
    current.addEventListener('load', async () => {
      await current.updateComplete;
      if (id !== requestId) return;
      const focusStayed = document.activeElement === open || document.activeElement === document.body;
      clearTimeout(timeout);
      applyVariants(current);
      mode = 'ready';
      poster.hidden = true;
      open.hidden = true;
      controls.hidden = false;
      open.disabled = false;
      status.textContent = doll.text.ready;
      status.classList.add('sr-only');
      // A late load must not steal focus from a selection or another control.
      if (focusControls && focusStayed) controls.querySelector('button').focus({ preventScroll: true });
    }, { once: true });
    // Rejected GLTF promises may remain cached; retries get a fresh same-origin key.
    current.src = `../model/${doll.model}${failedLoads[dollId] ? `?retry=${failedLoads[dollId]}` : ''}`;
    mount.append(current);
  } catch {
    fail(id, dollId);
  }
}

function selectDoll(dollId) {
  if (!Object.hasOwn(dolls, dollId) || dollId === selected) return;
  const reopen = mode === 'loading' || mode === 'ready';
  dispose();
  selections[selected] = { stance, material };
  selected = dollId;
  ({ stance, material } = selections[selected]);
  mode = 'poster';
  status.textContent = '';
  describeSelection();
  if (reopen) show({ focusControls: false });
}

function close() {
  dispose();
  mode = 'poster';
  status.textContent = '';
  open.focus({ preventScroll: true });
}

function act(action) {
  if (!viewer || mode !== 'ready') return;
  if (action === 'close') { close(); return; }
  if (action === 'reset') {
    viewer.cameraOrbit = initialOrbit;
    viewer.fieldOfView = 'auto';
    // Gestures alter the camera without altering these requested properties.
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

options.addEventListener('click', event => {
  const button = event.target.closest('button[data-stance], button[data-material]');
  if (button) selectVariant(button);
});
open.addEventListener('click', () => show());
selector.addEventListener('click', event => {
  const button = event.target.closest('button[data-doll]');
  if (button) selectDoll(button.dataset.doll);
});
controls.addEventListener('click', event => {
  const button = event.target.closest('button[data-action]');
  if (button) act(button.dataset.action);
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && (mode === 'ready' || mode === 'loading')) close();
});
describeSelection();

// Inspection hooks only in this excluded spike page, for reproducible browser QA.
window.render_game_to_text = () => JSON.stringify({ mode, selected, stance, material, animationTime: viewer?.currentTime, loaded: Boolean(viewer?.loaded), orbit: viewer?.loaded ? viewer.getCameraOrbit() : null });
window.advanceTime = async () => new Promise(resolve => requestAnimationFrame(resolve));
