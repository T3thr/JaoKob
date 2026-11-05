/**
 * Device frame of the C4 review page: the game (`play.html`) in an iframe of an exact CSS
 * viewport, scaled to fit unless "ขนาดจริง" is ticked, with the face band guide and a live
 * status read from `window.journeyReview` inside the frame. One frame only, so two copies of
 * the game never share one save. Review chrome; not part of the game.
 */

const viewport = document.getElementById("jf-viewport");
const device = document.getElementById("jf-device");
const frame = document.getElementById("jf-frame");
const guides = document.getElementById("jf-guides");
const actual = document.getElementById("jf-actual");
const status = document.getElementById("jf-status");
const buttons = [...document.querySelectorAll(".jf-devices [role=radio]")];
let size = { w: 390, h: 844 };

function layout() {
  const box = viewport.getBoundingClientRect();
  const fill = size.w === 0;
  const w = fill ? Math.floor(box.width) : size.w;
  const h = fill ? Math.floor(box.height) : size.h;
  const scale = fill || actual.checked ? 1 : Math.min(1, (box.width - 24) / w, (box.height - 24) / h);
  device.style.setProperty("--w", `${w}px`);
  device.style.setProperty("--h", `${h}px`);
  device.style.setProperty("--scale", String(scale));
  device.dataset.scale = scale.toFixed(2);
}

function choose(button) {
  for (const entry of buttons) entry.setAttribute("aria-checked", String(entry === button));
  size = { w: Number(button.dataset.w), h: Number(button.dataset.h) };
  layout();
}

function syncGuides() {
  frame.contentDocument?.documentElement.classList.toggle("jr-guides", guides.checked);
}

function row(term, value) {
  const dt = document.createElement("dt");
  dt.textContent = term;
  const dd = document.createElement("dd");
  dd.textContent = value;
  return [dt, dd];
}

function showStatus(snapshot) {
  const model = snapshot?.model;
  const gaps = (snapshot?.gaps ?? []).map((gap) => `${gap.assetId} หัน${gap.facing === "left" ? "ซ้าย" : "ขวา"}`);
  status.replaceChildren(
    ...row("ช่วง", snapshot?.phase ?? "-"),
    ...row("โหนด", model ? `${model.scene.nodeId} · ${model.scene.title ?? ""}` : "-"),
    ...row("โหมด", model ? `${model.mode}${model.pending ? ` (C5: ${model.pending})` : ""}` : "-"),
    ...row("revision", model ? String(model.revision) : "-"),
    ...row("การบันทึก", model ? (model.persistence === "active" ? "บันทึกเงียบลงเครื่อง" : "เล่นในหน่วยความจำ") : "-"),
    ...row("ภาพที่ยังไม่มีทิศที่บทขอ", gaps.length === 0 ? "ไม่มี" : gaps.join(" · ")),
  );
}

for (const button of buttons) button.addEventListener("click", () => choose(button));
actual.addEventListener("change", layout);
guides.addEventListener("change", syncGuides);
window.addEventListener("resize", layout);
frame.addEventListener("load", () => {
  syncGuides();
  const inner = frame.contentWindow;
  inner.addEventListener("journey-review-change", (event) => showStatus(event.detail));
  if (inner.journeyReview) showStatus(inner.journeyReview.shell.snapshot());
});
layout();
