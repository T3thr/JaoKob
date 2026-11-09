/**
 * `<CampDropTimer />`: the clock of a shelter camp is a thing in the world, never a number
 * (UX §4.1.1 · §8.4): the coconut shell under the bamboo eaves (C1), the empty can in the dry
 * pipe (C2), the wind-up lantern of the canal pavilion (C3) and the zinc bucket of the garden
 * shed (C4). Glass pill beside the HUD line: the vessel, one mark per drop (filled while time
 * is left, hollow once a drop has fallen) and the words of the presentation.
 *
 * When a drop falls (an activity was taken) the newest hollow mark plays the fall once; with
 * reduced motion it simply changes. Decorative marks are hidden from assistive technology;
 * the pill has the timer's words as its name and the renderer announces them once.
 * Trace: UX §4.1.1 · §4.1.6 · §4.2 · §8.4, Atomic 05 §3.1, TC-S5-UX-001, TC-S5-A11Y-001.
 */

import { element, setAttributes, setText } from "../journey-dom.js";
import { createIcon } from "../journey-icons.js";

/** @param {{document: Document}} options */
export function createCampDropTimer({ document }) {
  const root = element(document, "div", "jk-camp-timer jk-glass", { "data-component": "CampDropTimer", role: "img", hidden: true });
  const vessel = element(document, "span", "jk-camp-timer__vessel", { "aria-hidden": "true" });
  const marks = element(document, "span", "jk-camp-timer__marks", { "aria-hidden": "true" });
  const words = element(document, "span", "jk-camp-timer__text", { "aria-hidden": "true" });
  root.append(vessel, marks, words);
  let vesselName = null, total = -1, left = -1;

  return Object.freeze({
    element: root,
    /** @param {{vessel: string, total: number, left: number, text: string}|null} timer */
    update(timer) {
      setAttributes(root, { hidden: timer === null });
      if (timer === null) { total = -1; left = -1; return; }
      if (timer.vessel !== vesselName) {
        vesselName = timer.vessel;
        vessel.replaceChildren(createIcon(document, timer.vessel, "jk-camp-timer__icon"));
      }
      if (timer.total !== total) {
        marks.replaceChildren(...Array.from({ length: timer.total }, () => element(document, "i", "jk-camp-timer__mark")));
        left = timer.left;
      }
      const fell = left !== -1 && timer.left < left;
      [...marks.children].forEach((mark, index) => {
        const used = index < timer.total - timer.left;
        setAttributes(mark, { "data-state": used ? "used" : "left", "data-fresh": fell && used && index === timer.total - timer.left - 1 ? "true" : null });
      });
      total = timer.total;
      left = timer.left;
      setText(words, timer.text);
      setAttributes(root, { "aria-label": timer.text, "data-left": timer.left });
    },
  });
}
