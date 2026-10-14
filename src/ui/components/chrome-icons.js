/** Original, decorative vector strokes. Accessible names belong to localized controls. */
const STROKES = Object.freeze({
  hp: ["M12 20S3 14 3 8.5C3 4 9 2 12 7C15 2 21 4 21 8.5C21 14 12 20 12 20Z"],
  sanity: ["M12 6V3M12 21v-3M6 12H3M21 12h-3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1", "M16 12a4 4 0 1 1-8 0a4 4 0 0 1 8 0Z"],
  bond: ["M12 20C5 19 3 14 3 10C7 10 10 13 12 17C14 13 17 10 21 10C21 14 19 19 12 20ZM12 17C7 12 8 7 12 3C16 7 17 12 12 17Z"],
  settings: ["M4 6h16M4 12h16M4 18h16M8 3v6M16 9v6M10 15v6"],
});

export function createChromeIcon(document, name, fallback = "") {
  if (typeof document.createElementNS !== "function") {
    const text = document.createElement("span");
    text.textContent = fallback; text.setAttribute("aria-hidden", "true");
    return text;
  }
  const namespace = "http://www.w3.org/2000/svg";
  const icon = document.createElementNS(namespace, "svg");
  for (const [key, value] of Object.entries({ viewBox: "0 0 24 24", class: "jk-chrome-icon", "aria-hidden": "true", focusable: "false", fill: "none", stroke: "currentColor", "stroke-width": "1.5", "stroke-linecap": "round", "stroke-linejoin": "round" })) icon.setAttribute(key, value);
  for (const stroke of STROKES[name] ?? []) {
    const path = document.createElementNS(namespace, "path"); path.setAttribute("d", stroke); icon.append(path);
  }
  return icon;
}
