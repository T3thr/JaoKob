/**
 * Journey review page: the real Journey screens on the real application (ADR-P0-034 D10.4,
 * SSOT §1.2 C4). Everything on screen comes from `src/`: the title with continue, start and the
 * one-time notices, every play mode, the settings and pouch modals and the chapter end. This file
 * only boots the shell, shows a load error, and exposes `window.journeyReview` for the device frame
 * and the browser evidence runners (real engine commands through the application, saved silently
 * like any play). `?package=mini` plays the test package that has every node type. Not part of the
 * game or the release allowlist.
 */

import { createJourneyShell, loadJourneyResources } from "../../../../src/bootstrap/journey-shell.js";
import { TRAY_GROUPS } from "../../../../src/core/domain/clash/clash-rules.js";

const game = document.getElementById("game");
const error = document.getElementById("jr-error");
const STOP_MODES = new Set(["CLASH_OUTCOME", "DECISION", "BOUNDARY", "COMPLETE"]);
/** `?package=mini` plays the test package that has every node type (offer, hold, stitch, endings). */
const MINI_PACKAGE = "../../../../tests/fixtures/journey/mini-journey.json";

let shell = null;

async function reviewResources() {
  const resources = await loadJourneyResources();
  if (new URLSearchParams(location.search).get("package") !== "mini") return resources;
  const response = await fetch(new URL(MINI_PACKAGE, location.href).href, { credentials: "omit", mode: "same-origin", redirect: "error", cache: "no-cache" });
  if (!response.ok) throw new Error(`MINI_PACKAGE_${response.status}`);
  return { ...resources, packageData: await response.json() };
}

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
      const option = view.pouch.options.find((entry) => entry.available && entry.offered);
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

/** Real commands until the current node is left or the clash shows its outcome. */
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

/** Advance real commands until the screen reaches `predicate` (used by the evidence runners). */
function playUntil(predicate, limit = 400) {
  for (let guard = 0; guard < limit; guard += 1) {
    const snapshot = shell.snapshot();
    if (snapshot.phase !== "playing" || predicate(snapshot.model)) return snapshot.model;
    const result = step();
    if (!result || !result.ok) return shell.snapshot().model;
  }
  return shell.snapshot().model;
}

function draw(snapshot) {
  if (snapshot.error) {
    error.textContent = `คำสั่งไม่ผ่าน: ${snapshot.error.code} · สถานะเดิมยังอยู่`;
    error.hidden = false;
  } else {
    error.hidden = true;
  }
  window.dispatchEvent(new CustomEvent("journey-review-change", { detail: snapshot }));
}

async function start() {
  try {
    const resources = await reviewResources();
    shell = createJourneyShell({ document, root: game, ...resources, onChange: draw });
    window.journeyReview = Object.freeze({ shell, step, skipScene, playUntil, firstCommand });
    const booted = shell.boot();
    if (!booted.ok) throw new Error(booted.error.code);
  } catch (failure) {
    error.textContent = location.protocol === "file:"
      ? "เปิดผ่าน file:// ไม่ได้ · รัน node tools/dev/serve-review.mjs แล้วเปิด URL ที่พิมพ์ออกมา"
      : `เปิดหน้าตรวจไม่สำเร็จ: ${failure.message}`;
    error.hidden = false;
  }
  document.documentElement.setAttribute("data-review-ready", "true");
}

start();
