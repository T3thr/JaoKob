/**
 * C4 review page: the real Journey screens on the real application (ADR-P0-034 D10.4,
 * SSOT §1.2 C4). Everything in the game area comes from `src/`; this file only adds the PO's
 * review chrome: start and continue, the C5 placeholders with a skip that sends real engine
 * commands through the application (saved silently like any play), a settings sheet for the
 * C4 checks, and `window.journeyReview` for the device frame and the browser evidence runner.
 * Not part of the game or the release allowlist.
 */

import { createJourneyShell, loadJourneyResources } from "../../../../src/bootstrap/journey-shell.js";
import { TRAY_GROUPS } from "../../../../src/core/domain/clash/clash-rules.js";

const $ = (id) => document.getElementById(id);
const els = {
  game: $("game"), title: $("jr-title"), notices: $("jr-notices"), continue: $("jr-continue"), newGame: $("jr-new"),
  consent: $("jr-consent"), consentYes: $("jr-consent-yes"), pending: $("jr-pending"), pendingTitle: $("jr-pending-title"),
  pendingNote: $("jr-pending-note"), step: $("jr-step"), skip: $("jr-skip"), end: $("jr-end"), leave: $("jr-leave"),
  settings: $("jr-settings"), pouch: $("jr-pouch"), pouchList: $("jr-pouch-list"), error: $("jr-error"),
};

const PENDING = {
  clash: ["จังหวะเลือกท่าในศึก", "ป้ายเจตนา เกจแสงเงา และถาดการ์ดศึกสามจังหวะมาใน C5 · บรรทัดเจตนาและผลของศึกแสดงในกล่องบทพูดแล้ว"],
  camp: ["แคมป์หลบฝน", "นาฬิกาแคมป์และการ์ดกิจกรรมมาใน C5 · บรรทัดก่อนและหลังกิจกรรมแสดงในกล่องบทพูดแล้ว"],
  micro: ["สัมผัสโต้ตอบ", "วงคลื่น วงลมหายใจ และจุดฝีเข็มมาใน C5"],
  pouch: ["รับของใหม่", "แผ่นรับของและเลือกชิ้นที่จะฝากมาใน C5"],
  endings: ["หน้าจอเลือกฉากจบ", "การ์ดสามเกลียวมาใน C5"],
};
const STOP_MODES = new Set(["CLASH_OUTCOME", "DECISION", "BOUNDARY", "COMPLETE"]);

let shell = null, latest = null;

/** The first open way of the current beat, read from the application's view (no rule here). */
function firstCommand(view) {
  switch (view.mode) {
    case "VN": case "CLASH_INTRO": case "CLASH_INTENT": case "CLASH_RESOLVE": case "CLASH_OUTCOME":
      return { kind: "advance" };
    case "DECISION": {
      const option = view.decision.options.find((entry) => entry.available);
      return option ? { kind: "choose", args: { option: option.key } } : null;
    }
    case "CLASH_CHOOSE": {
      const action = TRAY_GROUPS.flatMap((group) => view.clash.groups[group].map((card) => card.id))[0];
      return action ? { kind: "clashAct", args: { action } } : null;
    }
    case "CAMP": {
      if (view.camp.finished) return { kind: "campLeave" };
      const open = view.camp.activities.find((entry) => entry.available);
      if (!open) return null;
      return { kind: "campPick", args: open.ready ? { activity: open.key, item: view.camp.readyCandidates[0] } : { activity: open.key } };
    }
    case "MICRO": return { kind: "microDone" };
    case "POUCH_SWAP": {
      const option = view.pouch.options.find((entry) => entry.available);
      return option ? { kind: "pouchDecide", args: { option: option.key } } : null;
    }
    case "ENDING_RESONANCE": {
      const option = view.endings.options.find((entry) => entry.open);
      return option ? { kind: "chooseEnding", args: { option: option.key } } : null;
    }
    default: return null;
  }
}

function playView() {
  const current = shell.view();
  return current.ok && current.value.phase === "playing" ? current.value.view : null;
}

/** One real command; returns the application result or null. */
function step() {
  const view = playView();
  const command = view && firstCommand(view);
  if (!command) return null;
  return shell.perform(command.kind, { ...(command.args ?? {}), revision: view.revision });
}

/** Real commands until the encounter's node is left or the clash shows its outcome. */
function skipScene() {
  const start = playView();
  if (!start) return;
  for (let guard = 0; guard < 300; guard += 1) {
    const view = playView();
    if (!view || view.node.id !== start.node.id || STOP_MODES.has(view.mode)) break;
    const result = step();
    if (!result || !result.ok) break;
  }
}

/** Advance real commands until the screen reaches `predicate` (used by the evidence runner). */
function playUntil(predicate, limit = 400) {
  for (let guard = 0; guard < limit; guard += 1) {
    const snapshot = shell.snapshot();
    if (snapshot.phase !== "playing" || predicate(snapshot.model)) return snapshot.model;
    const result = step();
    if (!result || !result.ok) return shell.snapshot().model;
  }
  return shell.snapshot().model;
}

function drawTitle(title) {
  els.continue.hidden = title.continue === null;
  els.consent.hidden = true;
  els.notices.replaceChildren(...title.notices.map((notice) => {
    const item = document.createElement("li");
    const text = document.createElement("span");
    text.textContent = notice.text;
    const ok = document.createElement("button");
    ok.type = "button";
    ok.className = "jr-button jr-button--small";
    ok.textContent = "รับทราบ";
    ok.addEventListener("click", () => shell.acknowledgeNotice(notice.id));
    item.append(text, ok);
    return item;
  }));
}

function draw(snapshot) {
  latest = snapshot;
  els.title.hidden = snapshot.phase !== "title";
  if (snapshot.phase === "title") drawTitle(snapshot.title);
  const pending = snapshot.model?.pending ?? null;
  const encounter = pending !== null && Object.hasOwn(PENDING, pending);
  els.pending.hidden = !encounter;
  if (encounter) {
    els.pendingTitle.textContent = PENDING[pending][0];
    els.pendingNote.textContent = PENDING[pending][1];
  }
  els.end.hidden = !(pending === "boundary" || pending === "complete");
  if (snapshot.error) {
    els.error.textContent = `คำสั่งไม่ผ่าน: ${snapshot.error.code} · สถานะเดิมยังอยู่`;
    els.error.hidden = false;
  } else {
    els.error.hidden = true;
  }
  window.dispatchEvent(new CustomEvent("journey-review-change", { detail: snapshot }));
}

function syncSettings() {
  const settings = latest?.model?.settings;
  if (!settings) return;
  const form = els.settings.querySelector("form");
  for (const input of form.querySelectorAll("input[type=checkbox]")) input.checked = settings[input.name] === true;
  for (const input of form.querySelectorAll("input[name=fontScale]")) input.checked = Number(input.value) === settings.fontScale;
}

function openSettings() {
  syncSettings();
  els.settings.showModal();
}

function openPouch() {
  const slots = latest?.model?.hud.pouch.slots ?? [];
  els.pouchList.replaceChildren(...slots.map((slot, index) => {
    const item = document.createElement("li");
    item.textContent = slot === null ? `ช่องที่ ${index + 1} · ว่าง` : `ช่องที่ ${index + 1} · ${slot.name}${slot.ready ? " · พร้อมผสาน" : ""}`;
    return item;
  }));
  els.pouch.showModal();
}

function wire() {
  els.newGame.addEventListener("click", () => {
    const title = latest?.title;
    if (title?.needsConsent) { els.consent.hidden = false; els.consentYes.focus(); return; }
    shell.newGame();
  });
  els.consentYes.addEventListener("click", () => shell.newGame({ consentToken: latest?.title?.consentToken ?? null }));
  els.continue.addEventListener("click", () => shell.continue());
  els.step.addEventListener("click", () => step());
  els.skip.addEventListener("click", () => skipScene());
  els.leave.addEventListener("click", () => shell.leave());
  els.settings.querySelector("form").addEventListener("change", (event) => {
    const input = event.target;
    shell.changeSettings({ [input.name]: input.type === "checkbox" ? input.checked : Number(input.value) });
  });
}

async function start() {
  try {
    const resources = await loadJourneyResources();
    shell = createJourneyShell({ document, root: els.game, ...resources, onChange: draw, onSettings: openSettings, onPouch: openPouch });
    wire();
    window.journeyReview = Object.freeze({ shell, step, skipScene, playUntil, firstCommand });
    const booted = shell.boot();
    if (!booted.ok) throw new Error(booted.error.code);
  } catch (error) {
    els.error.textContent = location.protocol === "file:"
      ? "เปิดผ่าน file:// ไม่ได้ · รัน node tools/dev/serve-review.mjs แล้วเปิด URL ที่พิมพ์ออกมา"
      : `เปิดหน้าตรวจไม่สำเร็จ: ${error.message}`;
    els.error.hidden = false;
  }
  document.documentElement.setAttribute("data-review-ready", "true");
}

start();
