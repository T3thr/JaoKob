/**
 * HUD toasts: "กาย ลดลง 1" · "แรง เพิ่มขึ้น 2" with an arrow beside the capsule, fading after
 * 2.5 seconds (UX §1.4, ADR-P0-019 Pillar 2). A toast is feedback on a story change; a
 * successful save never makes one (TC-S5-SILENT-001). Decorative for assistive technology:
 * the renderer announces the same words once with the line.
 * Trace: UX §1.4 · §2.1.3 · §2.1.6, TC-S5-HUD-001, TC-S5-SILENT-001.
 */

import { element } from "../journey-dom.js";
import { createIcon } from "../journey-icons.js";

export const TOAST_MS = 2800;
const MAX_VISIBLE = 3;

/**
 * @param {{document: Document, schedule?: (callback: () => void, ms: number) => unknown}} options
 */
export function createHudToasts({ document, schedule = (callback, ms) => globalThis.setTimeout(callback, ms) }) {
  const root = element(document, "div", "jk-toasts", { "aria-hidden": "true" });
  const seen = new Set();
  const live = [];
  const slots = new Map();

  function remove(node) {
    const index = live.indexOf(node);
    if (index >= 0) live.splice(index, 1);
    slots.delete(node);
    node.remove?.();
  }

  return Object.freeze({
    element: root,
    /** @param {readonly object[]} toasts The `toasts` of a presentation model. */
    push(toasts) {
      for (const toast of toasts) {
        if (seen.has(toast.key)) continue;
        seen.add(toast.key);
        if (seen.size > 64) seen.delete(seen.values().next().value);
        const node = element(document, "div", "jk-toast jk-glass", { "data-kind": toast.kind, "data-direction": toast.direction ?? "up" });
        const arrow = toast.kind === "meter" || toast.kind === "bond";
        node.append(createIcon(document, arrow ? (toast.direction === "down" ? "down" : "up") : "pouch", "jk-toast__icon"), element(document, "span", "jk-toast__text", {}, toast.text));
        if (toast.kind === "meter") node.setAttribute("data-meter", toast.meter);
        if (toast.kind === "bond") node.setAttribute("data-bond", toast.bond);
        while (live.length >= MAX_VISIBLE) remove(live[0]);
        const taken = new Set(slots.values());
        const slot = [0, 1, 2].find((index) => !taken.has(index));
        node.style.setProperty("--slot", String(slot));
        slots.set(node, slot);
        root.append(node);
        live.push(node);
        schedule(() => remove(node), TOAST_MS);
      }
    },
  });
}
