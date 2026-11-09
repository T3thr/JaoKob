/**
 * `<PouchSwapSheet />`: a new keepsake is offered (UX §7, ADR-P0-020 D5). In the lower dock: the
 * new keepsake beside the four woven slots, then the choices of the story as cards. It decides
 * nothing: which choices apply to the pouch as it is, what each gives and whether it is open
 * arrive in the model.
 *
 *   - The button `ต.♡ป.` keeps a gold knot and the words `ฝากไม่ได้` in its slot, always.
 *   - Pointing at or focusing a hand-on card lifts the slot of the keepsake that would go, with
 *     `จะฝาก`; arming the card keeps it lifted. The card's own words say who receives it.
 *   - Refusing says, in the story's words, who keeps it; the effect line adds that it stays in
 *     the pouch's memory. Nothing is ever deleted (ADR-P0-020).
 *
 * Trace: UX §7 · §1.4 · §1.6, ADR-P0-020 D5, ADR-P0-034 D9.3, TC-S5-UX-001, TC-S5-INLINE-001, TC-S5-A11Y-001.
 */

import { element, setAttributes, setText } from "../journey-dom.js";
import { createPouchSlot } from "./pouch-slot.js";
import { createTactileActionCard } from "./tactile-action-card.js";

/** take + up to five hand-ons + refuse (schema 3.0.0 `pouchNode`). */
export const POUCH_CHOICE_MAX = 7;
const SLOTS = 4;

/**
 * @param {{document: Document, messages: object, loadImage: Function, idSource: (name: string) => string,
 *   onActivate: (key: string) => void}} options
 */
export function createPouchSwapSheet({ document, messages, loadImage, idSource, onActivate }) {
  const root = element(document, "section", "jk-pouch-sheet", { "aria-label": messages.pouch.sheet, "data-component": "PouchSwapSheet", hidden: true });
  const head = element(document, "div", "jk-pouch-sheet__head");
  const incoming = createPouchSlot({ document, loadImage, tag: "div" });
  setAttributes(incoming.element, { class: "jk-slot jk-slot--incoming jk-paper", "data-role": "incoming" });
  const slotList = element(document, "ul", "jk-pouch-sheet__slots", { "aria-label": messages.pouch.slots });
  const slots = Array.from({ length: SLOTS }, () => createPouchSlot({ document, loadImage, tag: "li" }));
  slotList.append(...slots.map((slot) => slot.element));
  head.append(incoming.element, slotList);

  const choices = element(document, "div", "jk-pouch-sheet__choices", { role: "group", "aria-label": messages.ui.decision, "data-count": "0" });
  const descriptions = element(document, "div", "jk-descriptions", { hidden: true });
  let model = null, armed = null, pointed = null;

  const cards = Array.from({ length: POUCH_CHOICE_MAX }, () => {
    const describedBy = idSource("pouch-card");
    const description = element(document, "span", "", { id: describedBy });
    descriptions.append(description);
    const card = createTactileActionCard({ document, messages, loadImage, describedBy, onActivate });
    const point = (key) => { pointed = key; drawSlots(); };
    card.element.addEventListener("focus", () => point(card.element.getAttribute("data-key")));
    card.element.addEventListener("pointerenter", () => point(card.element.getAttribute("data-key")));
    card.element.addEventListener("blur", () => point(null));
    card.element.addEventListener("pointerleave", () => point(null));
    choices.append(card.element);
    return { card, description };
  });
  root.append(head, choices, descriptions);

  function drawSlots() {
    if (model === null) return;
    const liftKey = armed ?? pointed;
    const lifted = model.cards.find((card) => card.key === liftKey)?.release ?? null;
    slots.forEach((slot, index) => {
      const data = model.slots[index];
      const isLifted = data.item !== null && data.item === lifted;
      slot.update(data, {
        note: data.locked ? messages.pouch.locked : isLifted ? messages.pouch.handOn : null,
        noteKind: data.locked ? "locked" : isLifted ? "handon" : null,
        attributes: { "data-lifted": isLifted ? "true" : null },
      });
    });
  }

  return Object.freeze({
    element: root,
    /** The first choice the player can take, for focus when the offer opens. */
    firstFocus() {
      const index = model?.cards.findIndex((card) => card.available) ?? -1;
      return cards[Math.max(0, index)].card.element;
    },
    /** @param {object|null} pouch The `pouch` of a presentation model. @param {{armed: string|null}} state */
    update(pouch, state) {
      setAttributes(root, { hidden: pouch === null });
      model = pouch;
      if (pouch === null) {
        armed = null;
        pointed = null;
        incoming.clear();
        slots.forEach((slot) => slot.clear());
        cards.forEach(({ card }) => card.clear());
        return;
      }
      armed = state.armed;
      incoming.update({ item: pouch.incoming.item, name: pouch.incoming.name, image: pouch.incoming.image }, { note: messages.pouch.incoming, noteKind: "incoming" });
      setAttributes(choices, { "data-count": pouch.cards.length });
      cards.forEach(({ card, description }, index) => {
        const option = pouch.cards[index];
        setAttributes(card.element, { hidden: option === undefined });
        if (option === undefined) { card.clear(); return; }
        card.update(option, { armed: armed === option.key });
        setText(description, option.description);
      });
      drawSlots();
    },
    dispose() {
      incoming.dispose();
      slots.forEach((slot) => slot.dispose());
      cards.forEach(({ card }) => card.dispose());
    },
  });
}
