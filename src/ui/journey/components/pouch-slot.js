/**
 * One woven slot of the pouch (ADR-P0-020, UX §4.1.5 · §7), shared by the camp's ready picker
 * (a button) and the keepsake offer (a list item): the keepsake image, its name, a short note
 * and its state as attributes (`data-empty` · `data-locked` · `data-ready` · `data-lifted`).
 * Text goes in through the DOM only. The image is a lease from the loader, released when the
 * slot shows another keepsake or the screen is disposed, so no decoded image is kept twice.
 * Trace: ADR-P0-020 D5, UX §4.1.5 · §7, ADR-P0-034 D10.3, TC-S5-UX-001, TC-S5-A11Y-001.
 */

import { element, setAttributes, setText } from "../journey-dom.js";

/**
 * @param {{document: Document, loadImage: Function, tag?: "button"|"li"|"div", onActivate?: (item: string) => void}} options
 */
export function createPouchSlot({ document, loadImage, tag = "div", onActivate = null }) {
  const root = element(document, tag, "jk-slot", tag === "button" ? { type: "button" } : {});
  const art = element(document, "span", "jk-slot__art", { "aria-hidden": "true", "data-empty": "true" });
  const name = element(document, "span", "jk-slot__name");
  const note = element(document, "span", "jk-slot__note", { hidden: true });
  root.append(art, name, note);
  let item = null, imageKey = null, generation = 0, lease = null;
  if (onActivate !== null) root.addEventListener("click", () => { if (item !== null) onActivate(item); });

  async function showImage(image) {
    const key = image?.key ?? null;
    if (key === imageKey) return;
    imageKey = key;
    const current = ++generation;
    lease?.release();
    lease = null;
    art.replaceChildren();
    art.setAttribute("data-empty", key === null ? "true" : "false");
    if (key === null) return;
    let next = null;
    try { next = await loadImage(image); } catch { next = null; }
    if (current !== generation) { next?.release(); return; }
    lease = next;
    if (next !== null) art.append(element(document, "img", "jk-slot__image", { src: next.url, alt: "", draggable: "false" }));
  }

  return Object.freeze({
    element: root,
    /**
     * @param {{item: string|null, name: string, image: object|null, locked?: boolean, ready?: boolean}} slot
     * @param {{note?: string|null, noteKind?: string|null, attributes?: object}} [state]
     */
    update(slot, { note: noteText = null, noteKind = null, attributes = {} } = {}) {
      item = slot.item;
      setText(name, slot.name);
      setText(note, noteText ?? "");
      setAttributes(note, { hidden: noteText === null, "data-note": noteKind });
      setAttributes(root, { "data-empty": slot.item === null ? "true" : "false", "data-locked": slot.locked === true ? "true" : null, "data-ready": slot.ready === true ? "true" : null, ...attributes });
      void showImage(slot.image);
    },
    dispose() {
      generation += 1;
      lease?.release();
      lease = null;
    },
  });
}
