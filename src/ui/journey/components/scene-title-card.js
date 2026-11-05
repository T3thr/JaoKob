/**
 * `<SceneTitleCard />`: the place-and-scene title that rises when a node changes the plate,
 * holds 2.5 seconds and fades (UX §1.10). It never stays while the player reads or chooses,
 * never covers the face band, and in a clash shows only at the opening (C5). The words are
 * the act title and the node title of the blueprint, from the package.
 *
 * Decorative for assistive technology: the renderer announces the title with the first line.
 * Trace: UX §1.10 · §1.5, ADR-P0-034 D10, TC-S5-VN-001.
 */

import { element, setText } from "../journey-dom.js";

/** Fade in 0.4 s, hold 2.5 s, fade out 0.6 s (UX §1.10); CSS draws the same timeline. */
export const SCENE_TITLE_MS = 3500;

/**
 * @param {{document: Document, schedule?: (callback: () => void, ms: number) => unknown}} options
 */
export function createSceneTitleCard({ document, schedule = (callback, ms) => globalThis.setTimeout(callback, ms) }) {
  const root = element(document, "div", "jk-scene-title", { "aria-hidden": "true", "data-component": "SceneTitleCard", "data-state": "hidden", "data-cycle": "a" });
  const act = element(document, "p", "jk-scene-title__act");
  const name = element(document, "p", "jk-scene-title__name");
  const rule = element(document, "span", "jk-scene-title__rule");
  root.append(act, name, rule);
  let showing = 0;

  return Object.freeze({
    element: root,
    /** @param {{act: string, title: string}} title */
    show({ act: actText, title }) {
      setText(act, actText);
      setText(name, title);
      const cycle = (showing += 1);
      root.setAttribute("data-cycle", cycle % 2 === 0 ? "b" : "a");
      root.setAttribute("data-state", "shown");
      schedule(() => { if (showing === cycle) root.setAttribute("data-state", "hidden"); }, SCENE_TITLE_MS);
    },
    hide() {
      showing += 1;
      root.setAttribute("data-state", "hidden");
    },
  });
}
