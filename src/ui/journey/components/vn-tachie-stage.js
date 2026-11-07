/**
 * `<VnTachieStage />`: the scene plate and the living cast (Atomic 05 §3.3, UX §1.1 · §2.1,
 * ADR-P0-032 D7.1–D7.2).
 *
 *   - Each actor stands on its slot (far-left 12 · left 28 · center 50 · right 72 · far-right
 *     88 % of the stage width) and is placed by its eye anchor, so every face lands on the eye
 *     line inside the protected band (52–68 % from the bottom). CSS owns the geometry through
 *     `--x` and `--eye`; the waist sinks behind the lower dock.
 *   - The speaker is lit 100 %, the others 88 %; narration lights everyone.
 *   - After a clash the node's CG covers the plate and the cast; during a clash a warm radius
 *     around the frog follows the light (UX §3.6, rounds without a shadow wall).
 *   - A new plate or a new pose is decoded first and then cross-faded, so nothing pops in
 *     half-drawn; a stale load never resurrects an earlier scene; a failed image leaves the
 *     slot empty and the story goes on.
 *
 * The stage is decorative for assistive technology: who is present is written in words by
 * the renderer. Trace: ADR-P0-032 D7, ADR-P0-034 D10, UX §1.1 · §2.1, TC-S5-VN-001.
 */

import { element, setAttributes } from "../journey-dom.js";

const LEAVE_MS = 420;

/**
 * @param {{document: Document, loadImage: (descriptor: object) => Promise<{url: string, release: () => void}>,
 *   schedule?: (callback: () => void, ms: number) => unknown}} options
 */
export function createVnTachieStage({ document, loadImage, schedule = (callback, ms) => globalThis.setTimeout(callback, ms) }) {
  const root = element(document, "div", "jk-stage", { "aria-hidden": "true", "data-component": "VnTachieStage", "data-speaker": "false", "data-count": "0" });
  const plate = element(document, "div", "jk-stage__plate");
  const layers = [0, 1].map(() => element(document, "img", "jk-stage__bg", { alt: "", draggable: "false", decoding: "async", "data-shown": "false" }));
  plate.append(...layers);
  const shade = element(document, "div", "jk-stage__shade");
  const cast = element(document, "div", "jk-stage__cast");
  const glow = element(document, "div", "jk-stage__glow");
  const cg = element(document, "img", "jk-stage__cg", { alt: "", draggable: "false", decoding: "async", "data-shown": "false" });
  root.append(plate, glow, cast, cg, shade);

  let disposed = false;
  let front = 0, backgroundKey = null, backgroundGeneration = 0;
  const leases = [null, null];
  let cgKey = null, cgGeneration = 0, cgLease = null;

  /** The scene's CG over the plate and the cast (after a clash), cross-faded like the plate. */
  async function showCg(descriptor) {
    const key = descriptor?.key ?? null;
    if (key === cgKey) return;
    cgKey = key;
    const generation = ++cgGeneration;
    if (descriptor === null || descriptor === undefined) { cg.setAttribute("data-shown", "false"); root.setAttribute("data-cg", "false"); return; }
    let lease = null;
    try { lease = await loadImage(descriptor); } catch { lease = null; }
    if (disposed || generation !== cgGeneration) { lease?.release(); return; }
    cgLease?.release();
    cgLease = lease;
    if (lease === null) return;
    cg.setAttribute("src", lease.url);
    cg.setAttribute("data-shown", "true");
    root.setAttribute("data-cg", "true");
  }
  const actors = new Map();

  async function showBackground(descriptor) {
    const key = descriptor?.key ?? null;
    if (key === backgroundKey) return;
    backgroundKey = key;
    const generation = ++backgroundGeneration;
    if (descriptor === null || descriptor === undefined) {
      layers.forEach((layer) => layer.setAttribute("data-shown", "false"));
      return;
    }
    let lease = null;
    try { lease = await loadImage(descriptor); } catch { lease = null; }
    if (disposed || generation !== backgroundGeneration) { lease?.release(); return; }
    if (lease === null) return;
    const back = 1 - front;
    leases[back]?.release();
    leases[back] = lease;
    layers[back].setAttribute("src", lease.url);
    layers[back].setAttribute("data-shown", "true");
    layers[front].setAttribute("data-shown", "false");
    front = back;
  }

  function leave(slot, entry) {
    entry.generation += 1;
    entry.node.setAttribute("data-state", "leaving");
    actors.delete(slot);
    schedule(() => {
      entry.node.remove?.();
      entry.lease?.release();
    }, LEAVE_MS);
  }

  function enter(actor) {
    const node = element(document, "div", "jk-actor", { "data-slot": actor.slot, "data-state": "loading", "data-speaking": "false" });
    const image = element(document, "img", "jk-actor__image", { alt: "", draggable: "false", decoding: "async", width: actor.image.width, height: actor.image.height });
    node.append(image);
    node.style.setProperty("--x", String(actor.x));
    node.style.setProperty("--eye", String(actor.image.eyeFromTop));
    const entry = { node, image, imageKey: actor.image.key, lease: null, generation: 0 };
    cast.append(node);
    const generation = entry.generation;
    Promise.resolve()
      .then(() => loadImage(actor.image))
      .then((lease) => {
        if (disposed || entry.generation !== generation) { lease.release(); return; }
        entry.lease = lease;
        image.setAttribute("src", lease.url);
        node.setAttribute("data-state", "shown");
      })
      .catch(() => { if (entry.generation === generation) node.setAttribute("data-state", "failed"); });
    return entry;
  }

  return Object.freeze({
    element: root,
    /** @param {object} scene The `scene` of a presentation model. */
    update(scene) {
      if (disposed) return;
      void showBackground(scene.background);
      void showCg(scene.showCg === true ? scene.cg : null);
      const wanted = new Map(scene.actors.filter((actor) => actor.image !== null).map((actor) => [actor.key, actor]));
      for (const [slot, entry] of [...actors]) {
        const next = wanted.get(slot);
        if (next === undefined || next.image.key !== entry.imageKey) leave(slot, entry);
      }
      for (const actor of wanted.values()) {
        const entry = actors.get(actor.key) ?? enter(actor);
        actors.set(actor.key, entry);
        setAttributes(entry.node, { "data-speaking": actor.speaking ? "true" : "false" });
        entry.node.style.setProperty("--x", String(actor.x));
      }
      setAttributes(root, { "data-speaker": scene.actors.some((actor) => actor.speaking) ? "true" : "false", "data-count": wanted.size, "data-scene": scene.sceneKey });
    },
    dispose() {
      disposed = true;
      backgroundGeneration += 1;
      leases.forEach((lease) => lease?.release());
      cgGeneration += 1;
      cgLease?.release();
      for (const entry of actors.values()) { entry.generation += 1; entry.lease?.release(); }
      actors.clear();
    },
  });
}
