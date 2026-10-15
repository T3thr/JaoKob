/** Original, decorative vector strokes. Accessible names belong to localized controls. */
const STROKES = Object.freeze({
  hp: ["M12 20S3 14 3 8.5C3 4 9 2 12 7C15 2 21 4 21 8.5C21 14 12 20 12 20Z"],
  sanity: ["M12 6V3M12 21v-3M6 12H3M21 12h-3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1", "M16 12a4 4 0 1 1-8 0a4 4 0 0 1 8 0Z"],
  bond: ["M12 20C5 19 3 14 3 10C7 10 10 13 12 17C14 13 17 10 21 10C21 14 19 19 12 20ZM12 17C7 12 8 7 12 3C16 7 17 12 12 17Z"],
  settings: ["M4 6h16M4 12h16M4 18h16M8 3v6M16 9v6M10 15v6"],
  sound: ["M4 9v6h4l5 4V5L8 9H4ZM16 8q6 4 0 8M18 4q11 8 0 16"],
  muted: ["M4 9v6h4l5 4V5L8 9H4ZM17 9l5 6M22 9l-5 6"],
  info: ["M22 12a10 10 0 1 1-20 0a10 10 0 0 1 20 0ZM12 11v6M12 7v.1"],
  close: ["M6 6l12 12M18 6L6 18"],
  pouch: ["M8 3h8l-2 5c6 2 7 6 6 10s-15 4-16 0 0-8 6-10L8 3ZM7 8h10M10 8l-1 5M14 8l1 5"],
  history: ["M12 5C9 3 5 3 3 4v15c3-1 6-1 9 1 3-2 6-2 9-1V4c-2-1-6-1-9 1ZM12 5v15M6 8h3M6 12h3M15 8h3M15 12h3"],
  chevron: ["M9 5l7 7-7 7"],
  retry: ["M20 7V3l-4 1M20 7a9 9 0 1 0 1 8M20 7l-5 1"],
  ripple: ["M15 8a3 3 0 1 1-6 0a3 3 0 0 1 6 0ZM7 13c-8 3 2 8 10 4M4 17c-6 5 17 8 17 1"],
  roots: ["M12 3v17M12 9L7 5M12 12l6-5M12 15l-5 5M12 16l5 5M5 21h14"],
  ripples: ["M8 7a2 2 0 1 1-4 0a2 2 0 0 1 4 0ZM15 5a2 2 0 1 1-4 0a2 2 0 0 1 4 0ZM22 8a2 2 0 1 1-4 0a2 2 0 0 1 4 0ZM3 13q3-3 6 0t6 0t6 0M3 18q3-3 6 0t6 0t6 0"],
});

export function createChromeIcon(document, name) {
  const namespace = "http://www.w3.org/2000/svg";
  // Minimal injected test documents use the same vector tree, never text icons.
  const element = (tag) => document.createElementNS?.(namespace, tag) ?? document.createElement(tag);
  const icon = element("svg");
  for (const [key, value] of Object.entries({ viewBox: "0 0 24 24", class: "jk-chrome-icon", "aria-hidden": "true", focusable: "false", fill: "none", stroke: "currentColor", "stroke-width": "1.5", "stroke-linecap": "round", "stroke-linejoin": "round" })) icon.setAttribute(key, value);
  for (const stroke of STROKES[name] ?? []) {
    const path = element("path"); path.setAttribute("d", stroke); icon.append(path);
  }
  return icon;
}
