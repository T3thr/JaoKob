/**
 * Journey icons: line glyphs on a 24 px grid, drawn with `currentColor` so every icon follows
 * the surface it sits on (ADR-P0-034 D10.3, UX §8.4, Atomic 05 §3.2).
 *
 * Source: the v3 glyph set (`docs/design-system/ux-mockups/v3/harness/primitives.mjs`), copied
 * because production code never imports from `docs/`. Three HUD glyphs are redrawn so they
 * read as Atomic 05 names them at 15 px: `lotus` (ใบบัว with its notch), `star` (the
 * three-armed star stitched on the shirt, with its end dots) and `foot` (a three-toed webbed
 * frog foot). `gear` is redrawn with even teeth; `next` is the ▽ of the dialogue card.
 * Trace: ADR-P0-034 D10.3, Atomic 05 §3.2 · §3.4, UX §8.4, TC-S5-HUD-001.
 */

const SVG = "http://www.w3.org/2000/svg";
const round = (value) => Math.round(value * 100) / 100;
const dot = (x, y, r) => `M${round(x - r)} ${y}a${r} ${r} 0 1 0 ${round(2 * r)} 0a${r} ${r} 0 1 0 ${round(-2 * r)} 0`;

export const JOURNEY_GLYPHS = Object.freeze({
  lotus: "M12 12 13.87 3.2A9 9 0 1 0 20.77 9.98ZM12 12 5.2 6.6M12 12 4.4 15.6M12 12l3 8.3M12 12l7.9 3.6",
  star: `M12 12V4.6M12 12l-6.4 6.4M12 12l6.4 6.4${dot(12, 3.4, 1.3)}${dot(4.7, 19.3, 1.3)}${dot(19.3, 19.3, 1.3)}`,
  foot: `M12 21C9.6 19.6 6.3 13.9 4.6 8.2Q9 9.6 12 4Q15 9.6 19.4 8.2C17.7 13.9 14.4 19.6 12 21ZM12 20.4 6.6 9.8M12 20.4V6.4M12 20.4l5.4-10.6${dot(4.6, 8.2, 1.4)}${dot(12, 4, 1.4)}${dot(19.4, 8.2, 1.4)}`,
  drop: "M12 2c-2 5-7 9-7 13a7 7 0 0 0 14 0c0-4-5-8-7-13ZM8 15c0 3 2 4 4 4",
  jump: "M2 19c5-1 8-5 10-11M10 9l6-2 4 4m-8-3-4-3m6 2 1-4M5 22l4-3m4-4 4 3M18 2l2 1m1 4 2 1",
  eye: "M2 12Q12 0 22 12Q12 24 2 12ZM12 7v5m0 0-4 5m4-5 4 5",
  wind: "M2 7h12c6 0 6-6 1-5M2 12h17c5 0 5 7 0 7M2 17h8c5 0 5 6 0 6",
  shield: "M12 22C4 18 1 9 4 3C8 2 11 4 12 7C13 4 17 2 20 3C23 9 20 18 12 22ZM12 7v15M5 7l7 10 7-10M4 12l8 7 8-7",
  moth: "M12 10C4 0 0 7 8 13C0 19 8 23 12 15C16 23 24 19 16 13C24 7 20 0 12 10ZM12 8v11m0-11-3-4m3 4 3-4",
  bandage: "M3 15C0 5 11 1 21 3C23 12 18 21 8 21L3 15Zm2-2 6 6m-3-9 6 6M5 19 18 6M14 6l2 4 4 2",
  hem: "M4 5 9 2h6l5 3-3 5v12H7V10L4 5Zm8 7v4m0 0-3 4m3-4 3 4",
  lamp: "M7 22h10m-5 0V11m-3-2V6a3 3 0 0 1 6 0v3H9Zm-1-8L6 1m10 0 2-1M4 6H1m19 0h3M5 11l-2 2m16-2 2 2",
  lantern: "M8 5V3Q12-1 16 3v2M6 5h12l2 15H4L6 5Zm-2 18h16M12 9v8m-4-7 8 7m0-7-8 7",
  flashlight: "M3 9h9l4-4v14l-4-4H3V9Zm5 0v6M19 8l4-3m-4 7h5m-5 4 4 3",
  slit: "M3 5h18v15H3V5Zm3 5h12M7 13l-3 5m8-5v6m5-6 3 5",
  sun: "M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10M12 1v3m0 16v3M1 12h3m16 0h3M4 4l2 2m12 12 2 2M4 20l2-2M18 6l2-2",
  lock: "M6 10V7a6 6 0 0 1 12 0v3M4 10h16v12H4V10Zm8 5v3",
  pouch: "M8 7c0-5 8-5 8 0M3.5 7.5h17l-1.4 14H4.9ZM6.5 10h4.5v4.5H6.5Zm6.5 0h4.5v4.5H13Zm-6.5 6.3h4.5v3.4H6.5Zm6.5 0h4.5v3.4H13Z",
  gear: "M9.69 4.45 10.05 1.99 13.95 1.99 14.31 4.45 15.71 5.02 17.7 3.54 20.46 6.3 18.98 8.29 19.55 9.69 22.01 10.05 22.01 13.95 19.55 14.31 18.98 15.71 20.46 17.7 17.7 20.46 15.71 18.98 14.31 19.55 13.95 22.01 10.05 22.01 9.69 19.55 8.29 18.98 6.3 20.46 3.54 17.7 5.02 15.71 4.45 14.31 1.99 13.95 1.99 10.05 4.45 9.69 5.02 8.29 3.54 6.3 6.3 3.54 8.29 5.02ZM12 8.4a3.6 3.6 0 1 0 0 7.2 3.6 3.6 0 1 0 0-7.2Z",
  next: "M6.5 9.5h11L12 16.5Z",
  up: "M12 19V5m-6 6 6-6 6 6",
  down: "M12 5v14m-6-6 6 6 6-6",
  /* Camp clocks (UX §4.1.1 · §8.4): the vessel of each camp, never a pouch with an arrow. */
  shell: "M3.5 12.5h17a8.5 7.5 0 0 1-17 0ZM6.6 15.6c2.4 2.2 8.4 2.2 10.8 0M12 2.4c-1.4 2.3-2.3 3.4-2.3 4.6a2.3 2.3 0 0 0 4.6 0c0-1.2-.9-2.3-2.3-4.6Z",
  can: "M6.5 7v11.5c0 1.6 2.5 2.8 5.5 2.8s5.5-1.2 5.5-2.8V7M6.5 7c0 1.6 2.5 2.8 5.5 2.8s5.5-1.2 5.5-2.8-2.5-2.8-5.5-2.8-5.5 1.2-5.5 2.8ZM6.5 12.6c0 1.6 2.5 2.8 5.5 2.8s5.5-1.2 5.5-2.8M12 .6c-.7 1.1-1.1 1.7-1.1 2.3a1.1 1.1 0 0 0 2.2 0c0-.6-.4-1.2-1.1-2.3Z",
  bucket: "M4.5 9h15l-1.6 12.5H6.1ZM5 9C5 3 19 3 19 9M5.4 13.4h13.2M5.9 17.4h12.2",
  chevron: "M9.5 5.5 16 12l-6.5 6.5",
  close: "M6 6l12 12M18 6 6 18",
});

/** `advance` is the foot with an arrow, as in v3 (รุก). */
export const ADVANCE_GLYPH = `${JOURNEY_GLYPHS.foot}M17 20h6m-2.6-2.6L23 20l-2.6 2.6`;

/**
 * An inline SVG icon, hidden from assistive technology (the control it sits in has the name).
 * @param {Document} document @param {string} name @param {string} [className]
 */
export function createIcon(document, name, className = "jk-icon") {
  const svg = document.createElementNS(SVG, "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("class", className);
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "1.5");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("focusable", "false");
  svg.setAttribute("data-icon", name);
  const path = document.createElementNS(SVG, "path");
  path.setAttribute("d", name === "advance" ? ADVANCE_GLYPH : JOURNEY_GLYPHS[name] ?? JOURNEY_GLYPHS.star);
  svg.append(path);
  return svg;
}

/** An SVG element of any tag with attributes, for components that draw their own shapes. */
export function createSvgNode(document, tag, attributes = {}) {
  const node = document.createElementNS(SVG, tag);
  for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, String(value));
  return node;
}
