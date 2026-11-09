/**
 * The pouch modal (ADR-P0-020, UX §1.6 `I`): the four woven slots with what is in them (the
 * button's knot and ฝากไม่ได้, พร้อมผสาน on a readied keepsake) and the pouch's memory of the
 * keepsakes handed on and the ones refused, because nothing is ever deleted. Read-only: the pouch
 * changes only through the story. Every word arrives from the presentation.
 * Trace: ADR-P0-020 D1–D5, UX §1.6 · §7, TC-S5-HUD-001, TC-S5-A11Y-001.
 */

import { element, setText } from "../journey-dom.js";
import { createPouchSlot } from "./pouch-slot.js";

const SLOTS = 4;

/** @param {{document: Document, messages: object, loadImage: Function}} options */
export function createPouchPanel({ document, messages, loadImage }) {
  const root = element(document, "div", "jk-pouch-panel", { "data-component": "PouchPanel" });
  const heldHeading = element(document, "h3", "jk-pouch-panel__heading", {}, messages.pouchPanel.held);
  const list = element(document, "ul", "jk-pouch-panel__slots", { "aria-label": messages.pouchPanel.held });
  const slots = Array.from({ length: SLOTS }, () => createPouchSlot({ document, loadImage, tag: "li" }));
  list.append(...slots.map((slot) => slot.element));
  const memoryHeading = element(document, "h3", "jk-pouch-panel__heading", {}, messages.pouchPanel.memory);
  const memory = element(document, "ul", "jk-pouch-panel__memory", { "aria-label": messages.pouchPanel.memory });
  root.append(heldHeading, list, memoryHeading, memory);
  let memoryKey = null;

  return Object.freeze({
    element: root,
    /** @param {{slots: object[], released: object[], refused: object[]}} panel The `pouchPanel` of a presentation model. */
    update(panel) {
      slots.forEach((slot, index) => {
        const data = panel.slots[index];
        slot.update(data, {
          note: data.locked ? messages.pouch.locked : data.ready ? messages.tags.ready : null,
          noteKind: data.locked ? "locked" : data.ready ? "ready" : null,
        });
      });
      const entries = [
        ...panel.released.map((entry) => [messages.pouchPanel.released, entry.name]),
        ...panel.refused.map((entry) => [messages.pouchPanel.refused, entry.name]),
      ];
      const key = JSON.stringify(entries);
      if (key === memoryKey) return;
      memoryKey = key;
      memory.replaceChildren(...(entries.length === 0
        ? [element(document, "li", "jk-pouch-panel__empty", {}, messages.pouchPanel.emptyMemory)]
        : entries.map(([kind, name]) => {
          const item = element(document, "li", "jk-pouch-panel__entry");
          item.append(element(document, "span", "jk-pouch-panel__kind", {}, kind), element(document, "span", "jk-pouch-panel__name", {}, name));
          return item;
        })));
      setText(memoryHeading, messages.pouchPanel.memory);
    },
    /** Let go of the keepsake images when the modal closes; the next update draws them again. */
    clear() {
      slots.forEach((slot) => slot.clear());
    },
    dispose() {
      slots.forEach((slot) => slot.dispose());
    },
  });
}
