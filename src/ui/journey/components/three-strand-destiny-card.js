/**
 * `<ThreeStrandDestinyCard />`: the ending choice of A5-11 (UX §6, Atomic 05 §3.5). Three cards of
 * equal weight in a fixed order ก E-HOME · ข E-POND · ค E-DAWN, never re-ordered by state.
 *
 *   - Each card draws its strands down to a knot: a lit strand glows in its colours, an unmet one is
 *     a pale grey thread. Twisted pairs (a promise of Teuk's navy with brass, roots of reed with
 *     seed, every bond in three colours) are drawn as one cord of alternating colours; E-HOME
 *     threads the brass button as a bead on its knot, E-POND ties a plain knot, E-DAWN a double one.
 *   - A closed ending shows the in-story line of its first missing condition and stays focusable
 *     (`aria-disabled`), so the line can be heard; it cannot be chosen.
 *   - The Safety Fallback winds a fourth reed braid round the E-POND knot with its line.
 *   - No number, no progress bar, no ranking (UX §6.2). Every word comes from the presentation.
 *
 * Trace: UX §6.1–§6.3, master plan §2.13, ADR-P0-034 D9.3, TC-S5-ENDING-001 (screen), TC-S5-UX-001,
 * TC-S5-A11Y-001.
 */

import { element, setAttributes, setText } from "../journey-dom.js";
import { createSvgNode } from "../journey-icons.js";

const KNOT = Object.freeze({ x: 60, y: 60 });
/** Colours of each strand, one per sub-thread (more than one makes a twisted cord). */
const CORDS = Object.freeze({
  "e-home": Object.freeze({ heart: ["amber"], promise: ["teuk", "brass"] }),
  "e-pond": Object.freeze({ legs: ["lotus"], roots: ["reed", "seed"] }),
  "e-dawn": Object.freeze({ core: ["amber", "lotus"], bonds: ["pkam", "fiw", "teuk"], worlds: ["seed", "brass"] }),
});
const KNOTS = Object.freeze({ "e-home": "bead", "e-pond": "plain", "e-dawn": "double" });

/** The braid of one ending: strands from the top down to the knot. */
function drawBraid(document, svg, card) {
  svg.replaceChildren();
  const threads = card.strands.filter((strand) => !strand.bead);
  const spread = threads.length === 3 ? [26, 60, 94] : [38, 82];
  threads.forEach((strand, index) => {
    const x = spread[index];
    const d = `M${x} 4C${x} 30 ${KNOT.x} 34 ${KNOT.x} ${KNOT.y - 4}`;
    const colours = CORDS[card.ending]?.[strand.axis] ?? ["amber"];
    const dash = colours.length > 1 ? 5 : 0;
    colours.forEach((colour, part) => {
      svg.append(createSvgNode(document, "path", {
        class: "jk-ending__strand", d, "data-colour": strand.lit ? colour : "grey", "data-lit": strand.lit ? "true" : "false",
        ...(dash > 0 ? { "stroke-dasharray": `${dash} ${dash * (colours.length - 1)}`, "stroke-dashoffset": String(part * dash) } : {}),
      }));
    });
  });
  if (card.fallback) {
    svg.append(createSvgNode(document, "circle", { class: "jk-ending__fallback-braid", cx: KNOT.x, cy: KNOT.y, r: 11 }));
  }
  const knot = KNOTS[card.ending] ?? "plain";
  const bead = card.strands.find((strand) => strand.bead);
  if (knot === "bead") {
    svg.append(createSvgNode(document, "circle", { class: "jk-ending__bead", cx: KNOT.x, cy: KNOT.y, r: 6.5, "data-lit": bead?.lit ? "true" : "false" }));
    for (const [x, y] of [[58, 58], [62, 58], [58, 62], [62, 62]]) svg.append(createSvgNode(document, "circle", { class: "jk-ending__bead-hole", cx: x, cy: y, r: 0.9 }));
  } else {
    svg.append(createSvgNode(document, "circle", { class: "jk-ending__knot", cx: KNOT.x, cy: KNOT.y, r: 4.5 }));
    if (knot === "double") svg.append(createSvgNode(document, "circle", { class: "jk-ending__knot", cx: KNOT.x, cy: KNOT.y + 7, r: 3.5 }));
  }
}

/**
 * @param {{document: Document, messages: object, idSource: (name: string) => string, onActivate: (key: string) => void}} options
 */
export function createThreeStrandDestinyCard({ document, messages, idSource, onActivate }) {
  const root = element(document, "section", "jk-endings", { "aria-label": messages.endings.group, "data-component": "ThreeStrandDestinyCard", hidden: true });
  const descriptions = element(document, "div", "jk-descriptions", { hidden: true });
  const cards = [0, 1, 2].map(() => {
    const describedBy = idSource("ending");
    const description = element(document, "span", "", { id: describedBy });
    descriptions.append(description);
    const button = element(document, "button", "jk-ending jk-paper", { type: "button", "aria-describedby": describedBy, "aria-pressed": "false" });
    const braid = createSvgNode(document, "svg", { viewBox: "0 0 120 76", class: "jk-ending__braid", "aria-hidden": "true", focusable: "false" });
    const body = element(document, "span", "jk-ending__body");
    const label = element(document, "span", "jk-ending__label");
    const words = element(document, "span", "jk-ending__words", { "aria-hidden": "true" });
    const fallback = element(document, "span", "jk-ending__fallback", { hidden: true });
    const note = element(document, "span", "jk-ending__note", { hidden: true });
    body.append(label, words, fallback, note);
    const mark = element(document, "span", "jk-ending__mark", { "aria-hidden": "true" });
    button.append(mark, braid, body);
    const card = { button, braid, label, words, fallback, note, mark, description, key: null, drawn: null };
    button.addEventListener("click", () => { if (card.key !== null) onActivate(card.key); });
    return card;
  });
  root.append(...cards.map((card) => card.button), descriptions);
  let shown = [];

  return Object.freeze({
    element: root,
    /** The first ending that can be chosen (the order stays ก ข ค whatever is open). */
    firstFocus() {
      const index = shown.findIndex((card) => card.available);
      return cards[Math.max(0, index)].button;
    },
    /** @param {object|null} endings The `endings` of a presentation model. @param {{armed: string|null}} state */
    update(endings, { armed }) {
      setAttributes(root, { hidden: endings === null });
      shown = endings?.cards ?? [];
      if (endings === null) return;
      setAttributes(root, { "data-fallback": endings.fallback ? "true" : null });
      cards.forEach((card, index) => {
        const data = endings.cards[index];
        setAttributes(card.button, { hidden: data === undefined });
        if (data === undefined) return;
        card.key = data.key;
        const isArmed = armed === data.key;
        setAttributes(card.button, {
          "data-key": data.key, "data-ending": data.ending, "data-available": data.available ? "true" : "false", "data-fallback": data.fallback ? "true" : null,
          "data-armed": isArmed ? "true" : "false", "aria-disabled": data.available ? null : "true", "aria-pressed": isArmed ? "true" : "false",
        });
        setText(card.mark, data.mark ?? "");
        setText(card.label, data.label);
        setText(card.words, data.words);
        setText(card.fallback, data.fallbackLine ?? "");
        setAttributes(card.fallback, { hidden: data.fallbackLine === null });
        const noteText = !data.available ? data.lock ?? "" : isArmed ? messages.ui.armedHint : "";
        setText(card.note, noteText);
        setAttributes(card.note, { hidden: noteText === "", "data-note": data.available ? "armed" : "lock" });
        setText(card.description, data.description);
        const signature = JSON.stringify([data.ending, data.fallback, data.strands.map((strand) => strand.lit)]);
        if (signature !== card.drawn) {
          card.drawn = signature;
          drawBraid(document, card.braid, data);
        }
      });
    },
  });
}
