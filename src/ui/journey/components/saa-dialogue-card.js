/**
 * `<SaaDialogueCard />`: the reading card on saa paper (Atomic 05 §3.4, UX §2.1.4). Speaker
 * pill with the speaker's face, the line, and ▽ to read on; nothing else, and never a number.
 * The card keeps its place at the base of the screen (layout shift 0) and each new line
 * fades in; with reduced motion it simply appears.
 *
 * Reading on: the ▽ button, a tap anywhere on the card, or Space/Enter handled by the
 * renderer. The renderer announces each line once through its live region, so the card
 * itself is not live. Trace: Atomic 05 §3.4, UX §1.4 · §1.6 · §2.1.4, TC-S5-VN-001, TC-S5-A11Y-001.
 */

import { element, setAttributes, setText } from "../journey-dom.js";
import { createIcon } from "../journey-icons.js";

/**
 * @param {{document: Document, messages: object, loadImage: Function, onAdvance: () => void}} options
 */
export function createSaaDialogueCard({ document, messages, loadImage, onAdvance }) {
  const root = element(document, "section", "jk-dialogue jk-paper", { "aria-label": messages.ui.dialogue, "data-component": "SaaDialogueCard", "data-narration": "true" });
  const speaker = element(document, "p", "jk-dialogue__speaker", { hidden: true });
  const avatar = element(document, "span", "jk-dialogue__avatar", { "aria-hidden": "true", "data-state": "empty" });
  const avatarImage = element(document, "img", "jk-dialogue__face", { alt: "", draggable: "false", decoding: "async" });
  avatar.append(avatarImage);
  const name = element(document, "span", "jk-dialogue__name");
  speaker.append(avatar, name);
  const text = element(document, "p", "jk-dialogue__text", { "data-reveal": "a" });
  const next = element(document, "button", "jk-dialogue__next", { type: "button", "aria-label": messages.ui.advance, "data-action": "advance" });
  next.append(createIcon(document, "next", "jk-dialogue__next-icon"));
  root.append(speaker, text, next);

  let canAdvance = false, lineKey = null, faceKey = null, faceGeneration = 0, faceLease = null;
  root.addEventListener("click", () => { if (canAdvance) onAdvance(); });

  async function showFace(image) {
    const key = image?.key ?? null;
    if (key === faceKey) return;
    faceKey = key;
    const generation = ++faceGeneration;
    if (image === null || image === undefined) {
      avatar.setAttribute("data-state", "empty");
      return;
    }
    avatar.style.setProperty("--eye", String(image.eyeFromTop));
    let lease = null;
    try { lease = await loadImage(image); } catch { lease = null; }
    if (generation !== faceGeneration) { lease?.release(); return; }
    faceLease?.release();
    faceLease = lease;
    if (lease === null) { avatar.setAttribute("data-state", "empty"); return; }
    avatarImage.setAttribute("src", lease.url);
    avatar.setAttribute("data-state", "shown");
  }

  return Object.freeze({
    element: root,
    nextButton: next,
    /**
     * @param {object|null} line The `line` of a presentation model.
     * @param {{revision: number, canAdvance: boolean, face: object|null}} context
     */
    update(line, { revision, canAdvance: advance, face }) {
      canAdvance = advance;
      setAttributes(root, { hidden: line === null, "data-narration": line?.speaker === null ? "true" : "false" });
      setAttributes(next, { hidden: !advance });
      if (line === null) return;
      setAttributes(speaker, { hidden: line.speaker === null });
      setText(name, line.speaker ?? "");
      void showFace(line.speaker === null ? null : face);
      const key = `${revision}:${line.textId}`;
      if (key !== lineKey) {
        lineKey = key;
        text.setAttribute("data-reveal", text.getAttribute("data-reveal") === "a" ? "b" : "a");
        setText(text, line.text);
      }
    },
    dispose() {
      faceGeneration += 1;
      faceLease?.release();
    },
  });
}
