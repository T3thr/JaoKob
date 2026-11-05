/**
 * `<TactileActionCard />`: the one card shape for story choices, clash actions and camp
 * activities (Atomic 05 §3.4, UX §1.4 · §2.1.5). Saa paper, radius 14, meaning carried only by
 * the left stripe, the 40 px icon and the corner tags; cost as pips on the lower right.
 *
 *   - Every word comes from the presentation: the label from the package, the tags from the
 *     fixed tag words, the reason and the accessible sentence already written.
 *   - A card that cannot be taken still shows, dimmed, with its reason in words; it stays
 *     focusable (`aria-disabled`) so the reason can be heard.
 *   - `armed` is the inline first press of a two-step choice (green outline and a short hint).
 *
 * Trace: Atomic 05 §3.4, UX §1.4 · §1.6 · §2.1.5, ADR-P0-034 D9.3, TC-S5-VN-001, TC-S5-A11Y-001.
 */

import { element, setAttributes, setText } from "../journey-dom.js";
import { createIcon } from "../journey-icons.js";

/**
 * @param {{document: Document, messages: object, loadImage: Function, describedBy: string, onActivate: (key: string) => void}} options
 */
export function createTactileActionCard({ document, messages, loadImage, describedBy, onActivate }) {
  const button = element(document, "button", "jk-card jk-paper", { type: "button", "data-component": "TactileActionCard", "aria-describedby": describedBy, "aria-pressed": "false" });
  const art = element(document, "span", "jk-card__art", { "aria-hidden": "true", "data-empty": "true" });
  const body = element(document, "span", "jk-card__body");
  const label = element(document, "span", "jk-card__label");
  const note = element(document, "span", "jk-card__note", { "aria-hidden": "true", hidden: true });
  body.append(label, note);
  const tags = element(document, "span", "jk-card__tags", { "aria-hidden": "true" });
  const kindTag = element(document, "span", "jk-tag", { hidden: true });
  const repeatTag = element(document, "span", "jk-tag", { "data-tag": "repeat", hidden: true });
  tags.append(kindTag, repeatTag);
  const cost = element(document, "span", "jk-card__cost", { "aria-hidden": "true", hidden: true });
  const shortcut = element(document, "span", "jk-card__key", { "aria-hidden": "true" });
  button.append(art, body, tags, cost, shortcut);

  let key = null, artKey = null, artGeneration = 0, artLease = null;
  button.addEventListener("click", () => { if (key !== null) onActivate(key); });

  async function showArt(option) {
    const next = option.keepsake !== null ? `image:${option.keepsake.key}` : option.icon !== null ? `icon:${option.icon}` : null;
    if (next === artKey) return;
    artKey = next;
    const generation = ++artGeneration;
    artLease?.release();
    artLease = null;
    art.replaceChildren();
    art.setAttribute("data-empty", next === null ? "true" : "false");
    if (option.keepsake === null) {
      if (option.icon !== null) art.append(createIcon(document, option.icon, "jk-card__icon"));
      return;
    }
    let lease = null;
    try { lease = await loadImage(option.keepsake); } catch { lease = null; }
    if (generation !== artGeneration) { lease?.release(); return; }
    artLease = lease;
    if (lease !== null) art.append(element(document, "img", "jk-card__keepsake", { src: lease.url, alt: "", draggable: "false" }));
  }

  return Object.freeze({
    element: button,
    /** @param {object} option A decision option of the presentation. @param {{armed: boolean}} state */
    update(option, { armed }) {
      key = option.key;
      setAttributes(button, {
        "data-key": option.key,
        "data-kind": option.kind,
        "data-available": option.available ? "true" : "false",
        "data-armed": armed ? "true" : "false",
        "aria-disabled": option.available ? null : "true",
        "aria-pressed": armed ? "true" : "false",
      });
      setText(label, option.label);
      const noteText = !option.available ? option.reason : armed ? messages.ui.armedHint : "";
      setText(note, noteText);
      setAttributes(note, { hidden: noteText === "", "data-note": !option.available ? "reason" : "armed" });
      setText(kindTag, option.tag?.text ?? "");
      setAttributes(kindTag, { hidden: option.tag === null, "data-tag": option.tag?.kind ?? null });
      setText(repeatTag, option.repeat ? option.repeatText : "");
      setAttributes(repeatTag, { hidden: !option.repeat });
      const costText = option.cost.map((part) => `${part.label} ${"●".repeat(part.pips)}`).join("  ");
      setText(cost, costText);
      setAttributes(cost, { hidden: costText === "" });
      setText(shortcut, String(option.shortcut));
      void showArt(option);
    },
    dispose() {
      artGeneration += 1;
      artLease?.release();
    },
  });
}
