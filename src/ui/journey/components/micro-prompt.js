/**
 * `<MicroPrompt />`: the tactile micro-actions (UX §5, master plan §2.11). Three to eight seconds
 * of touch with nothing to fail, no clock that loses and no change to any meter.
 *
 *   tap3    a glowing point; three taps anywhere in its 120 px well (or Space three times) leave
 *           three faint ripples, then three answer from far away (MA-1–MA-3, MA-6).
 *   hold    a breathing ring; holding (pointer or Space) fills it with warm light in three
 *           seconds, and letting go early lets it fill by itself, slower (MA-4, MA-6 E-HOME).
 *   stitch  three gold guide points round the brass button; a tap on a point or a drag into it
 *           sews one white stitch that stays on the cloth (MA-5); Space sews the next one.
 *   press   one press of the glowing point (the schema's fourth kind; no blueprint uses it yet).
 *
 * The hint (from the package, four words or fewer) fades the moment the player starts and keeps
 * its box, so nothing moves. Progress is drawn, never counted on screen; the renderer's one
 * polite live region says it in words (`onSay`). With the automatic setting the action completes
 * by itself after one second. Done is
 * reported once per micro-action, after a short settle so the last ripple or stitch is seen; the
 * renderer sends `microDone` bound to the revision on screen. Keyboard and assistive technology:
 * the renderer forwards Space and Enter; a click without a pointer (detail 0) counts as one press.
 * Trace: UX §5 · §1.5 · §1.6 · §1.9, master plan §2.11, ADR-P0-033 D4, TC-S5-UX-001, TC-S5-A11Y-001.
 */

import { element, setAttributes, setText } from "../journey-dom.js";
import { createSvgNode } from "../journey-icons.js";

/** A held press fills the light in this time (UX §5: MA-4 two to three seconds, MA-6 three to four). */
export const MICRO_HOLD_MS = 3000;
/** Let go early and the light keeps filling by itself, this many times slower. */
export const MICRO_DRIFT = 2.5;
/** The automatic setting completes every micro-action after one second (UX §1.9 · §5). */
export const MICRO_AUTO_MS = 1000;
/** Time to see the last mark (and the tap echo) before the story moves on. */
export const MICRO_SETTLE_MS = Object.freeze({ tap3: 1500, stitch: 900, hold: 900, press: 700 });

/** Stitch cloth in its own units: the brass button in the middle, three guide points round it. */
const CLOTH = Object.freeze({ width: 240, height: 160 });
const BUTTON = Object.freeze({ x: 120, y: 80, r: 30 });
const HOLES = Object.freeze([[111, 71], [129, 71], [111, 89], [129, 89]]);
export const STITCH_GUIDES = Object.freeze([Object.freeze([62, 44]), Object.freeze([180, 56]), Object.freeze([118, 136])]);
/** Each guide point is drawn 30 px wide and answers within 22 px (a 44 px target, UX §5). */
const GUIDE_RADIUS = 15;
const HIT_PX = 22;

const round = (value) => Math.round(value * 10) / 10;
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

/**
 * @param {{document: Document, messages: object, idSource: (name: string) => string,
 *   schedule: (callback: () => void, ms: number) => unknown, frame: (callback: () => void) => unknown,
 *   now: () => number, onDone: (key: string) => void, onProgress?: (fill: number) => void,
 *   onSay?: (text: string) => void}} options
 */
export function createMicroPrompt({ document, messages, idSource, schedule, frame, now, onDone, onProgress = () => {}, onSay = () => {} }) {
  const root = element(document, "section", "jk-micro", { "aria-label": messages.micro.region, "data-component": "MicroPrompt", "data-state": "idle", hidden: true });
  const well = element(document, "div", "jk-micro__well");
  const instructionsId = idSource("micro");
  const target = element(document, "button", "jk-micro__target", { type: "button", "aria-describedby": instructionsId });

  const point = element(document, "span", "jk-micro__point", { "aria-hidden": "true" });
  const ripples = element(document, "span", "jk-micro__ripples", { "aria-hidden": "true" });
  const echo = element(document, "span", "jk-micro__echo", { "aria-hidden": "true" });
  for (let index = 1; index <= 3; index += 1) {
    const ringNode = element(document, "i", "jk-micro__echo-ring");
    ringNode.style.setProperty("--n", String(index));
    echo.append(ringNode);
  }

  const ring = createSvgNode(document, "svg", { viewBox: "0 0 120 120", class: "jk-micro__ring", "aria-hidden": "true", focusable: "false" });
  const ringFill = createSvgNode(document, "circle", { class: "jk-micro__ring-fill", cx: 60, cy: 60, r: 52, pathLength: 100, "stroke-dasharray": 100, "stroke-dashoffset": 100 });
  ring.append(createSvgNode(document, "circle", { class: "jk-micro__ring-track", cx: 60, cy: 60, r: 52 }), ringFill);
  const core = element(document, "span", "jk-micro__core", { "aria-hidden": "true" });

  const cloth = createSvgNode(document, "svg", { viewBox: `0 0 ${CLOTH.width} ${CLOTH.height}`, class: "jk-micro__cloth", "aria-hidden": "true", focusable: "false" });
  cloth.append(createSvgNode(document, "circle", { class: "jk-micro__button", cx: BUTTON.x, cy: BUTTON.y, r: BUTTON.r }));
  for (const [x, y] of HOLES) cloth.append(createSvgNode(document, "circle", { class: "jk-micro__hole", cx: x, cy: y, r: 3.6 }));
  const threads = createSvgNode(document, "g", { class: "jk-micro__threads" });
  const live = createSvgNode(document, "path", { class: "jk-micro__thread jk-micro__thread--live", d: "" });
  const guides = STITCH_GUIDES.map(([x, y]) => createSvgNode(document, "circle", { class: "jk-micro__guide", cx: x, cy: y, r: GUIDE_RADIUS, "data-done": "false" }));
  cloth.append(threads, live, ...guides);

  target.append(point, ripples, echo, ring, core, cloth);
  well.append(target);
  const hint = element(document, "p", "jk-micro__hint jk-paper");
  const instructions = element(document, "span", "jk-sr", { id: instructionsId });
  root.append(well, hint, instructions);

  let micro = null, key = null, kind = "tap3", phase = "idle", generation = 0, autoQueued = false;
  let taps = 0, stitched = [], last = [BUTTON.x, BUTTON.y], dragging = false;
  let holding = false, started = false, progress = 0, lastTick = 0;

  const say = (text) => onSay(text);

  function drawFill(fill) {
    progress = fill;
    root.style.setProperty("--fill", fill.toFixed(3));
    ringFill.setAttribute("stroke-dashoffset", String(round(100 - fill * 100)));
    onProgress(kind === "hold" ? fill : 0);
  }

  function reset(next) {
    generation += 1;
    micro = next;
    key = next.key;
    kind = next.kind;
    phase = "idle";
    autoQueued = false;
    taps = 0;
    stitched = [];
    last = [BUTTON.x, BUTTON.y];
    dragging = false;
    holding = false;
    started = false;
    ripples.replaceChildren();
    threads.replaceChildren();
    live.setAttribute("d", "");
    guides.forEach((guide) => guide.setAttribute("data-done", "false"));
    setAttributes(root, { "data-kind": kind, "data-state": "idle", "data-holding": "false" });
    setAttributes(hint, { "data-gone": null });
    setAttributes(target, { "aria-label": next.hint, "aria-disabled": null });
    setText(hint, next.hint);
    setText(instructions, next.instructions);
    drawFill(0);
  }

  function begin() {
    if (phase !== "idle") return;
    phase = "active";
    setAttributes(root, { "data-state": "active" });
    setAttributes(hint, { "data-gone": "true" });
  }

  function complete() {
    if (phase === "done") return;
    phase = "done";
    holding = false;
    dragging = false;
    live.setAttribute("d", "");
    if (kind === "hold") drawFill(1);
    setAttributes(root, { "data-state": "done", "data-holding": "false" });
    setAttributes(hint, { "data-gone": "true" });
    setAttributes(target, { "aria-disabled": "true" });
    say(messages.micro.done);
    const current = generation, doneKey = key;
    schedule(() => { if (current === generation) onDone(doneKey); }, MICRO_SETTLE_MS[kind] ?? MICRO_SETTLE_MS.press);
  }

  function tap(at) {
    taps += 1;
    const ripple = element(document, "i", "jk-micro__ripple");
    ripple.style.setProperty("--x", `${round(at?.x ?? 50)}%`);
    ripple.style.setProperty("--y", `${round(at?.y ?? 50)}%`);
    ripple.style.setProperty("--n", String(taps));
    ripples.append(ripple);
    say(messages.micro.progress[kind](taps));
    if (taps >= micro.steps) complete();
  }

  /** One white stitch from where the thread is to guide point `index`, bowing away from the button. */
  function sew(index) {
    if (stitched.includes(index)) return;
    stitched.push(index);
    const [x, y] = STITCH_GUIDES[index];
    const [fromX, fromY] = last;
    const midX = (fromX + x) / 2, midY = (fromY + y) / 2;
    const away = Math.hypot(midX - BUTTON.x, midY - BUTTON.y) || 1;
    const bendX = midX + ((midX - BUTTON.x) / away) * 16, bendY = midY + ((midY - BUTTON.y) / away) * 16;
    threads.append(createSvgNode(document, "path", { class: "jk-micro__thread", d: `M${round(fromX)} ${round(fromY)}Q${round(bendX)} ${round(bendY)} ${x} ${y}` }));
    guides[index].setAttribute("data-done", "true");
    last = [x, y];
    say(messages.micro.progress.stitch(stitched.length));
    if (stitched.length >= STITCH_GUIDES.length) complete();
  }

  const nextGuide = () => STITCH_GUIDES.findIndex((_, index) => !stitched.includes(index));

  /** The loop of a hold: the light fills while held, and more slowly by itself after a release. */
  function fillLoop(current) {
    return () => {
      if (current !== generation || phase === "done") return;
      const at = now();
      const elapsed = Math.max(0, at - lastTick);
      lastTick = at;
      drawFill(Math.min(1, progress + elapsed / (holding ? MICRO_HOLD_MS : MICRO_HOLD_MS * MICRO_DRIFT)));
      if (progress >= 1) complete();
      else frame(fillLoop(current));
    };
  }

  function hold(on) {
    holding = on;
    setAttributes(root, { "data-holding": on ? "true" : "false" });
    if (on && !started) {
      started = true;
      lastTick = now();
      say(messages.micro.progress.hold());
      frame(fillLoop(generation));
    }
  }

  /** One input: a tap, the next stitch, or the start of a hold. `at` is a point in the well or null. */
  function press(at = null) {
    if (micro === null || phase === "done") return;
    begin();
    if (kind === "stitch") sew(nextGuide());
    else if (kind === "hold") hold(true);
    else tap(at);
  }

  function release() {
    if (kind === "hold" && holding) hold(false);
  }

  function autoComplete() {
    if (micro === null || phase === "done") return;
    begin();
    if (kind === "hold") {
      started = true;
      complete();
    } else {
      for (let guard = 0; phase !== "done" && guard < 8; guard += 1) press(null);
    }
  }

  function queueAuto() {
    if (autoQueued || phase === "done") return;
    autoQueued = true;
    const current = generation;
    schedule(() => { if (current === generation) autoComplete(); }, MICRO_AUTO_MS);
  }

  const rectOf = (node) => (typeof node.getBoundingClientRect === "function" ? node.getBoundingClientRect() : null);
  function wellPoint(event) {
    const rect = rectOf(target);
    if (rect === null || !(rect.width > 0) || typeof event.clientX !== "number") return null;
    return { x: clamp(((event.clientX - rect.left) / rect.width) * 100, 0, 100), y: clamp(((event.clientY - rect.top) / rect.height) * 100, 0, 100) };
  }
  function clothPoint(event) {
    const rect = rectOf(cloth);
    if (rect === null || !(rect.width > 0) || typeof event.clientX !== "number") return null;
    return { x: ((event.clientX - rect.left) * CLOTH.width) / rect.width, y: ((event.clientY - rect.top) * CLOTH.height) / rect.height, scale: CLOTH.width / rect.width };
  }
  function guideAt(at) {
    if (at === null) return -1;
    let best = -1, bestDistance = HIT_PX * at.scale;
    STITCH_GUIDES.forEach(([x, y], index) => {
      const distance = Math.hypot(at.x - x, at.y - y);
      if (!stitched.includes(index) && distance <= bestDistance) { best = index; bestDistance = distance; }
    });
    return best;
  }
  function drawLive(at) {
    live.setAttribute("d", at === null || phase === "done" ? "" : `M${round(last[0])} ${round(last[1])}L${round(at.x)} ${round(at.y)}`);
  }

  target.addEventListener("pointerdown", (event) => {
    if ((event.button ?? 0) !== 0 || micro === null || phase === "done") return;
    event.preventDefault();
    target.focus?.({ preventScroll: true });
    try { target.setPointerCapture?.(event.pointerId); } catch { /* a pointer that is gone cannot be captured */ }
    if (kind === "stitch") {
      const at = clothPoint(event);
      begin();
      const index = guideAt(at);
      if (index >= 0) sew(index);
      dragging = phase !== "done";
      drawLive(at);
    } else {
      press(kind === "hold" ? null : wellPoint(event));
    }
  });
  target.addEventListener("pointermove", (event) => {
    if (!dragging || kind !== "stitch" || phase === "done") return;
    const at = clothPoint(event);
    const index = guideAt(at);
    if (index >= 0) sew(index);
    drawLive(at);
  });
  const lift = () => {
    if (dragging) { dragging = false; live.setAttribute("d", ""); }
    release();
  };
  for (const type of ["pointerup", "pointercancel", "lostpointercapture"]) target.addEventListener(type, lift);
  // A click with no pointer behind it comes from assistive technology: one press, let go.
  target.addEventListener("click", (event) => {
    if (event.detail !== undefined && event.detail !== 0) return;
    press(null);
    release();
  });
  target.addEventListener("contextmenu", (event) => event.preventDefault());

  return Object.freeze({
    element: root,
    target,
    /** Whether a node belongs to the prompt (keys aimed at it are the prompt's own). */
    owns: (node) => root.contains?.(node) === true,
    /** Space or Enter went down (key repeats are ignored by the caller). */
    press: () => press(null),
    /** Space or Enter came up: a hold lets go. */
    release,
    /** @param {object|null} next The `micro` of a presentation model. */
    update(next) {
      setAttributes(root, { hidden: next === null });
      if (next === null) {
        if (micro !== null) { generation += 1; micro = null; key = null; holding = false; onProgress(0); }
        return;
      }
      if (next.key !== key) reset(next);
      else micro = next;
      if (next.auto) queueAuto();
    },
    dispose() {
      generation += 1;
      micro = null;
    },
  });
}
