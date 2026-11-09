/**
 * `<ClashIntentAndGauge />`: the intent badge, the ten-cell light gauge with its hold line, the
 * turn drops and the next intents after ตั้งสติฟังฝน (UX §3.1 · §3.5, Atomic 05 §5 step 2).
 *
 *   - The badge is violet glass with the enemy's intent in words, plus ไม่มีผล · เหลือครึ่ง ·
 *     แรงเป็นสองเท่า when Core says so; in the resolve beat it breaks with แก้ทางแล้ว when the
 *     chosen card answered it (Core's `resolved.answered`).
 *   - The gauge fills from the left in light cells with a ray pattern and keeps shadow cells
 *     smoky, so colour is never the only signal; a dashed line marks the hold line.
 *   - Everything here is a value from the presentation; nothing is computed.
 *
 * Trace: UX §1.3 · §3.1 · §3.5 · §3.8, ADR-P0-034 D9.2, TC-S5-TRAY-001, TC-S5-A11Y-001.
 */

import { element, setAttributes, setText } from "../journey-dom.js";
import { createIcon } from "../journey-icons.js";

/** @param {{document: Document, messages: object}} options */
export function createClashIntentAndGauge({ document, messages }) {
  const badge = element(document, "div", "jk-intent jk-glass", { "data-component": "ClashIntentAndGauge", hidden: true, "data-state": "pending" });
  const badgeIcon = createIcon(document, "moth", "jk-intent__icon");
  const badgeText = element(document, "span", "jk-intent__text");
  const badgeNotes = element(document, "span", "jk-intent__notes");
  const badgeAnswered = element(document, "span", "jk-intent__answered", { hidden: true }, messages.clash.answered);
  badge.append(badgeIcon, badgeText, badgeNotes, badgeAnswered);
  const preview = element(document, "div", "jk-intent-preview", { hidden: true });

  const gauge = element(document, "div", "jk-gauge", { role: "img", hidden: true });
  const rail = element(document, "div", "jk-gauge__rail jk-glass");
  const source = createIcon(document, "star", "jk-gauge__source");
  const cells = element(document, "div", "jk-gauge__cells");
  const cellNodes = Array.from({ length: 10 }, () => element(document, "i", "jk-gauge__cell"));
  cells.append(...cellNodes);
  const sun = createIcon(document, "sun", "jk-gauge__sun");
  rail.append(source, cells, sun);
  const drops = element(document, "div", "jk-gauge__drops", { "aria-hidden": "true" });
  gauge.append(rail, drops);

  let dropCount = -1;

  return Object.freeze({
    badge,
    preview,
    gauge,
    /** @param {object|null} clash The `clash` of a presentation model. */
    update(clash) {
      const showBadge = clash !== null && clash.intent !== null && ["intent", "choose", "resolve"].includes(clash.beat);
      setAttributes(badge, { hidden: !showBadge });
      if (showBadge) {
        setText(badgeText, clash.intent.label);
        setText(badgeNotes, clash.intent.notes.join(" · "));
        setAttributes(badgeNotes, { hidden: clash.intent.notes.length === 0 });
        const answered = clash.beat === "resolve" && clash.intent.answered;
        setAttributes(badgeAnswered, { hidden: !answered });
        setAttributes(badge, { "data-state": answered ? "answered" : clash.beat, "data-last": clash.intent.lastTurn ? "true" : "false" });
      }
      const showPreview = showBadge && clash.preview.length > 0;
      setAttributes(preview, { hidden: !showPreview });
      if (showPreview) {
        preview.replaceChildren(element(document, "span", "jk-intent-preview__label", {}, messages.clash.preview),
          ...clash.preview.map((entry) => element(document, "span", "jk-intent-preview__chip", { "data-neutralized": entry.neutralized ? "true" : "false" }, entry.neutralized ? `${entry.name} · ${messages.clash.neutralized}` : entry.name)));
      }
      setAttributes(gauge, { hidden: clash === null });
      if (clash === null) return;
      setAttributes(gauge, { "aria-label": `${messages.clash.gauge(clash.light, clash.max)} · ${messages.clash.turn(clash.turn, clash.turns)}`, "data-light": clash.light });
      cellNodes.forEach((cell, index) => {
        cell.setAttribute("class", index < clash.light ? "jk-gauge__cell jk-gauge__cell--light" : "jk-gauge__cell");
        setAttributes(cell, { "data-hold": index === clash.holdAt - 1 ? "true" : null });
      });
      if (dropCount !== clash.turns) {
        dropCount = clash.turns;
        drops.replaceChildren(...Array.from({ length: clash.turns }, () => createIcon(document, "drop", "jk-gauge__drop")));
      }
      [...drops.children].forEach((drop, index) => {
        const turnIndex = index + 1;
        const done = clash.beat === "outcome" ? clash.turns : clash.beat === "resolve" && clash.resolved !== null ? clash.resolved.turn : clash.turn - 1;
        const state = turnIndex <= done ? "used" : turnIndex === clash.turn && (clash.beat === "intent" || clash.beat === "choose") ? "current" : "future";
        drop.setAttribute("data-state", state);
      });
    },
  });
}
