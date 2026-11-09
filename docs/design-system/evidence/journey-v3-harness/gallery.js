/** Gallery of the PO harness: pick a screen, see the live screen at its v3 viewport beside the v3 picture. */
import { SCREENS } from "./screens.js";

const picker = document.getElementById("picker");
const frame = document.getElementById("frame");
const live = document.getElementById("live");
const picture = document.getElementById("v3");
const buttons = SCREENS.map((screen) => {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = String(screen.n);
  button.setAttribute("aria-label", `จอ ${screen.n} · ${screen.stem}`);
  button.addEventListener("click", () => show(screen));
  picker.append(button);
  return button;
});

function fit(screen) {
  const [width, height] = screen.viewport;
  const scale = Math.min(1, frame.clientWidth / width);
  live.style.width = `${width}px`;
  live.style.height = `${height}px`;
  live.style.transform = `scale(${scale})`;
  frame.style.height = `${Math.round(height * scale)}px`;
}

let current = SCREENS[0];
function show(screen) {
  current = screen;
  buttons.forEach((button, index) => button.setAttribute("aria-pressed", SCREENS[index] === screen ? "true" : "false"));
  live.src = `screen.html?n=${screen.n}`;
  picture.src = `../../ux-mockups/v3/${screen.stem}.webp`;
  picture.alt = `ภาพ v3 จอ ${screen.n} ${screen.stem}`;
  document.getElementById("live-caption").textContent = `หน้าจอจริง · จอ ${screen.n} · ${screen.viewport.join(" × ")}`;
  document.getElementById("v3-caption").textContent = `ภาพ v3 · ${screen.stem}`;
  fit(screen);
}

addEventListener("resize", () => fit(current));
show(SCREENS[Number(new URLSearchParams(location.search).get("n") ?? "1") - 1] ?? SCREENS[0]);
