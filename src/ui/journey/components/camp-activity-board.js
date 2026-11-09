/**
 * The camp board (UX §4): every activity of the camp as a `TactileActionCard` in the lower
 * dock, the ready picker and the leave button. It decides nothing: which cards are open, what
 * they give and cost, why one is closed and whether the frog may leave all arrive in the model.
 *
 *   - Cards: two columns on phones, four on wide screens; each shows its art, the label from
 *     the package, the effect line (`สายใยเตื๊อก +` · `แรง ●●` · `สละ…`) and, once taken, the
 *     `เลือกแล้ว` tag. A closed card stays focusable with its reason (UX §4.1.2–§4.1.4).
 *   - `เตรียมของให้พร้อม` opens the four woven slots in place of the cards (UX §4.1.5); a held
 *     keepsake that is not ready yet can be picked, the others are shown closed.
 *   - `ออกเดินทางต่อ` stays on the board, closed with its note until the drops are spent or
 *     nothing is left to do (UX §4.1.7); it never takes a two-step press.
 *
 * Trace: UX §4.1 · §4.2 · §1.6, ADR-P0-034 D9.3, TC-S5-UX-001, TC-S5-INLINE-001, TC-S5-A11Y-001.
 */

import { element, setAttributes, setText } from "../journey-dom.js";
import { createIcon } from "../journey-icons.js";
import { createPouchSlot } from "./pouch-slot.js";
import { createTactileActionCard } from "./tactile-action-card.js";

/** The schema allows up to ten activities in one camp (C3 has eight). */
export const CAMP_ACTIVITY_MAX = 10;
const SLOTS = 4;

/**
 * @param {{document: Document, messages: object, loadImage: Function, idSource: (name: string) => string,
 *   onActivate: (key: string) => void, onPick: (item: string) => void, onBack: () => void, onLeave: () => void}} options
 */
export function createCampActivityBoard({ document, messages, loadImage, idSource, onActivate, onPick, onBack, onLeave }) {
  const root = element(document, "section", "jk-camp", { "aria-label": messages.camp.board, "data-component": "CampActivityBoard", "data-view": "cards", hidden: true });
  const grid = element(document, "div", "jk-camp__grid", { "data-count": "0" });
  const descriptions = element(document, "div", "jk-descriptions", { hidden: true });
  const cards = Array.from({ length: CAMP_ACTIVITY_MAX }, () => {
    const describedBy = idSource("camp-card");
    const description = element(document, "span", "", { id: describedBy });
    descriptions.append(description);
    const card = createTactileActionCard({ document, messages, loadImage, describedBy, onActivate });
    grid.append(card.element);
    return { card, description };
  });

  const headingId = idSource("camp-picker");
  const picker = element(document, "div", "jk-camp__picker jk-paper", { role: "group", "aria-labelledby": headingId, hidden: true });
  const heading = element(document, "p", "jk-camp__picker-heading", { id: headingId }, messages.camp.picker);
  const slotRow = element(document, "div", "jk-camp__slots");
  const slots = Array.from({ length: SLOTS }, () => createPouchSlot({ document, loadImage, tag: "button", onActivate: (item) => onPick(item) }));
  slotRow.append(...slots.map((slot) => slot.element));
  const back = element(document, "button", "jk-camp__back", { type: "button" }, messages.camp.back);
  back.addEventListener("click", () => onBack());
  picker.append(heading, slotRow, back);

  const leaveNoteId = idSource("camp-leave");
  const leaveNote = element(document, "span", "", { id: leaveNoteId });
  descriptions.append(leaveNote);
  const leave = element(document, "button", "jk-camp__leave", { type: "button", "data-action": "camp-leave", "aria-describedby": leaveNoteId });
  const leaveLabel = element(document, "span", "jk-camp__leave-label");
  leave.append(leaveLabel, createIcon(document, "chevron", "jk-camp__leave-icon"));
  let leaveOpen = false;
  leave.addEventListener("click", () => { if (leaveOpen) onLeave(); });

  root.append(grid, picker, leave, descriptions);
  let shown = [];

  return Object.freeze({
    element: root,
    leaveButton: leave,
    /** The first card a player can take, else the leave button once it is open. */
    firstFocus() {
      const open = cards.find(({ card }, index) => shown[index]?.available === true && !card.element.hidden);
      return open?.card.element ?? (leaveOpen ? leave : cards[0].card.element);
    },
    /** The card of an activity, for focus return after the picker closes. */
    cardOf(key) {
      const index = shown.findIndex((option) => option.key === key);
      return index < 0 ? null : cards[index].card.element;
    },
    /** The first slot that can be readied, for focus when the picker opens. */
    firstSlot() {
      return slots.find((slot) => slot.element.getAttribute("data-available") === "true")?.element ?? back;
    },
    /**
     * @param {object|null} camp The `camp` of a presentation model.
     * @param {{armed: string|null, picking: boolean}} state `armed` is a card key or `item:<id>` in the picker.
     */
    update(camp, { armed, picking }) {
      const show = camp !== null && camp.open;
      setAttributes(root, { hidden: !show });
      if (!show) { cards.forEach(({ card }) => card.clear()); slots.forEach((slot) => slot.clear()); return; }
      shown = camp.cards;
      const choosing = picking && camp.picker !== null;
      setAttributes(root, { "data-view": choosing ? "picker" : "cards" });
      setAttributes(grid, { hidden: choosing, "data-count": camp.cards.length });
      cards.forEach(({ card, description }, index) => {
        const option = camp.cards[index];
        setAttributes(card.element, { hidden: option === undefined });
        if (option === undefined) { card.clear(); return; }
        card.update(option, { armed: armed === option.key });
        setText(description, option.description);
      });
      setAttributes(picker, { hidden: !choosing });
      if (!choosing) slots.forEach((slot) => slot.clear());
      else {
        slots.forEach((slot, index) => {
          const data = camp.picker.slots[index];
          const key = data.item === null ? null : `item:${data.item}`;
          const isArmed = key !== null && armed === key;
          slot.update(data, {
            note: isArmed ? messages.ui.armedHint : data.ready ? messages.tags.ready : null,
            noteKind: isArmed ? "armed" : "ready",
            attributes: {
              "data-key": key,
              "data-available": data.available ? "true" : "false",
              "data-armed": isArmed ? "true" : "false",
              "aria-disabled": data.available ? null : "true",
              "aria-pressed": isArmed ? "true" : "false",
            },
          });
        });
      }
      leaveOpen = camp.leave.available;
      setText(leaveLabel, camp.leave.label);
      setText(leaveNote, camp.leave.note ?? "");
      setAttributes(leave, { hidden: choosing, "aria-disabled": leaveOpen ? null : "true", "data-available": leaveOpen ? "true" : "false" });
    },
    dispose() {
      cards.forEach(({ card }) => card.dispose());
      slots.forEach((slot) => slot.dispose());
    },
  });
}
