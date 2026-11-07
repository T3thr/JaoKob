/**
 * `<TopHudCapsule />`: one 64 px glass capsule in every mode (Atomic 05 §3.2, UX §1.1 · §1.2 ·
 * §2.1.2) holding only the frog's world: กาย · ใจ · แรง as five pips each, the three-strand
 * bond necklace and the woven 2 × 2 pouch. The settings gear is a separate round glass button
 * floating in the top-right corner (PO decision of 2026-11-07, SSOT §1.2), so the capsule
 * breathes. Values change in place, so nothing moves (layout shift 0) and changes fade.
 *
 * The capsule shows numbers to nobody: pips, knots and woven cells only; screen readers get
 * the counts in words from the presentation (UX §0.1 · §1.6).
 * Trace: ADR-P0-034 D10.2, Atomic 05 §3.1–§3.2, UX §1.1–§1.2 · §1.6 · §2.1, SSOT §1.2 (2026-11-07),
 * TC-S5-HUD-001, TC-S5-A11Y-001.
 */

import { element, setAttributes } from "../journey-dom.js";
import { createIcon, createSvgNode } from "../journey-icons.js";

const METER_ICON = Object.freeze({ hp: "lotus", mind: "star", sta: "foot" });
const STRAND_X = Object.freeze([9.5, 19.5, 29.5]);
const KNOT_Y = Object.freeze([12, 19, 26, 33]);
const POUCH_CELLS = Object.freeze([[6.5, 12.5], [17.5, 12.5], [6.5, 21.5], [17.5, 21.5]]);

/**
 * @param {{document: Document, messages: object, onPouch?: () => void, onSettings?: () => void}} options
 */
export function createTopHudCapsule({ document, messages, onPouch = () => {}, onSettings = () => {} }) {
  const root = element(document, "header", "jk-hud", { "aria-label": messages.ui.hud, "data-component": "TopHudCapsule" });
  const capsule = element(document, "div", "jk-hud__capsule jk-glass");
  root.append(capsule);

  const meters = new Map();
  for (const id of ["hp", "mind", "sta"]) {
    const meter = element(document, "div", "jk-meter", { "data-meter": id, role: "img" });
    const title = element(document, "span", "jk-meter__title", { "aria-hidden": "true" });
    title.append(createIcon(document, METER_ICON[id], "jk-meter__icon"), element(document, "span", "jk-meter__label", {}, messages.meters[id]));
    const pips = element(document, "span", "jk-meter__pips", { "aria-hidden": "true" });
    const cells = Array.from({ length: 5 }, () => element(document, "i", "jk-pip"));
    pips.append(...cells);
    meter.append(title, pips);
    capsule.append(meter);
    meters.set(id, { meter, cells, pips });
  }

  capsule.append(element(document, "span", "jk-hud__divider", { "aria-hidden": "true" }));
  const bonds = element(document, "div", "jk-bonds", { role: "img" });
  const necklace = createSvgNode(document, "svg", { viewBox: "0 0 39 44", class: "jk-bonds__art", "aria-hidden": "true", focusable: "false" });
  const strands = new Map();
  for (const [index, id] of ["pkam", "fiw", "teuk"].entries()) {
    const x = STRAND_X[index];
    const group = createSvgNode(document, "g", { class: "jk-strand", "data-bond": id });
    group.append(createSvgNode(document, "path", { class: "jk-strand__thread", d: `M${x} 3c-3 5 3 7 0 12s3 7 0 12 3 7 0 12` }));
    const knots = KNOT_Y.map((y) => {
      const knot = createSvgNode(document, "circle", { class: "jk-strand__knot", cx: x, cy: y, r: 2.7 });
      group.append(knot);
      return knot;
    });
    necklace.append(group);
    strands.set(id, knots);
  }
  bonds.append(necklace);
  capsule.append(bonds, element(document, "span", "jk-hud__divider", { "aria-hidden": "true" }));

  const pouch = element(document, "button", "jk-hud__button jk-hud__pouch", { type: "button", "data-action": "pouch" });
  const pouchArt = createSvgNode(document, "svg", { viewBox: "0 0 30 30", class: "jk-pouch__art", "aria-hidden": "true", focusable: "false" });
  pouchArt.append(createSvgNode(document, "path", { class: "jk-pouch__frame", d: "M9 8.5c0-6 12-6 12 0M3.5 8.5h23l-1.6 18.5H5.1Z" }));
  const pouchCells = POUCH_CELLS.map(([x, y]) => {
    const cell = createSvgNode(document, "rect", { class: "jk-pouch__cell", x, y, width: 6, height: 6.5, rx: 1.4 });
    pouchArt.append(cell);
    return cell;
  });
  pouch.append(pouchArt);
  pouch.addEventListener("click", () => onPouch());

  capsule.append(pouch);
  const settings = element(document, "button", "jk-settings jk-glass", { type: "button", "aria-label": messages.ui.settings, "data-action": "settings", "data-component": "SettingsButton" });
  settings.append(createIcon(document, "gear", "jk-settings__gear"));
  settings.addEventListener("click", () => onSettings());

  return Object.freeze({
    element: root,
    /** The floating settings button; the renderer places it in the top-right corner. */
    settingsButton: settings,
    /** @param {object} hud The `hud` of a presentation model. */
    update(hud) {
      for (const meter of hud.meters) {
        const target = meters.get(meter.id);
        target.meter.setAttribute("aria-label", meter.description);
        target.meter.setAttribute("data-value", String(meter.value));
        target.cells.forEach((cell, index) => cell.setAttribute("class", index < meter.value ? "jk-pip" : "jk-pip jk-pip--spent"));
      }
      bonds.setAttribute("aria-label", `${hud.bondsLabel}: ${hud.bonds.map((bond) => bond.description).join(" · ")}`);
      for (const bond of hud.bonds) {
        strands.get(bond.id).forEach((knot, index) => knot.setAttribute("class", index < bond.knots ? "jk-strand__knot jk-strand__knot--tied" : "jk-strand__knot"));
      }
      setAttributes(pouch, { "aria-label": hud.pouch.description, "data-used": hud.pouch.used });
      pouchCells.forEach((cell, index) => {
        const slot = hud.pouch.slots[index] ?? null;
        cell.setAttribute("class", slot === null ? "jk-pouch__cell" : slot.ready ? "jk-pouch__cell jk-pouch__cell--held jk-pouch__cell--ready" : "jk-pouch__cell jk-pouch__cell--held");
      });
    },
    /** The pouch and settings buttons, for focus return after a modal (C5). */
    controls: Object.freeze({ pouch, settings }),
  });
}
