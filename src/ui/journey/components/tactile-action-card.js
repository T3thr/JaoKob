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
 *   - Art is an icon, a keepsake, a face, or a keepsake with a companion's face (combo).
 *   - Up to two corner tags (`แก้ทาง` and `ซ้ำ`, or a kind tag) as UX §3.3 ข้อ 6 allows.
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
  const tagNodes = [0, 1].map(() => element(document, "span", "jk-tag", { hidden: true }));
  tags.append(...tagNodes);
  const cost = element(document, "span", "jk-card__cost", { "aria-hidden": "true", hidden: true });
  const shortcut = element(document, "span", "jk-card__key", { "aria-hidden": "true" });
  button.append(art, body, tags, cost, shortcut);

  let key = null, artKey = null, artGeneration = 0, artLeases = [];
  button.addEventListener("click", () => { if (key !== null) onActivate(key); });

  /** Icon, keepsake, face, or keepsake with a face beside it (combo, UX §3.3 ข้อ 6). */
  async function showArt({ icon, keepsake, face }) {
    const next = [icon ? `icon:${icon}` : "", keepsake ? `image:${keepsake.key}` : "", face ? `face:${face.key}` : ""].join("|");
    if (next === artKey) return;
    artKey = next;
    const generation = ++artGeneration;
    artLeases.forEach((lease) => lease?.release());
    artLeases = [];
    art.replaceChildren();
    art.setAttribute("data-empty", next === "||" ? "true" : "false");
    art.setAttribute("data-art", face && keepsake ? "pair" : face ? "face" : keepsake ? "keepsake" : "icon");
    if (icon) art.append(createIcon(document, icon, "jk-card__icon"));
    const load = async (descriptor) => { try { return await loadImage(descriptor); } catch { return null; } };
    const [item, portrait] = await Promise.all([keepsake ? load(keepsake) : null, face ? load(face) : null]);
    if (generation !== artGeneration) { item?.release(); portrait?.release(); return; }
    artLeases = [item, portrait];
    if (item !== null) art.append(element(document, "img", "jk-card__keepsake", { src: item.url, alt: "", draggable: "false" }));
    if (portrait !== null) {
      const frame = element(document, "span", "jk-card__face");
      frame.style.setProperty("--eye", String(face.eyeFromTop));
      frame.append(element(document, "img", "jk-card__face-image", { src: portrait.url, alt: "", draggable: "false" }));
      art.append(frame);
    }
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
      tagNodes.forEach((node, index) => {
        const tag = option.tags[index] ?? null;
        setText(node, tag?.text ?? "");
        setAttributes(node, { hidden: tag === null, "data-tag": tag?.kind ?? null });
      });
      const costText = option.cost.map((part) => `${part.label} ${"●".repeat(part.pips)}`).join("  ");
      setText(cost, costText);
      setAttributes(cost, { hidden: costText === "" });
      setText(shortcut, option.shortcut === null ? "" : String(option.shortcut));
      setAttributes(shortcut, { hidden: option.shortcut === null });
      void showArt(option.art);
    },
    dispose() {
      artGeneration += 1;
      artLeases.forEach((lease) => lease?.release());
    },
  });
}
