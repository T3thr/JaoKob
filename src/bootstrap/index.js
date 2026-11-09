/**
 * The game's entry point (ADR-P0-034 D1 · D10, SSOT §3.3): `index.html` boots the Journey shell
 * on the host package `story.jaokob.core` and nothing else. No query, hash or stored value can
 * choose another package, so a player reaches only the acts the package promotes (spoiler wall,
 * TC-S5-PROTO-001); the PO's review harness lives in `docs/`, outside the release allowlist.
 * The application directory comes from the shell module's own URL, so the same files run at the
 * site root and under a subpath (GitHub Pages). If the game cannot start, one sentence says so.
 * Trace: ADR-P0-034 D1 · D10, SSOT §1.2 (C4) · §3.3, TC-S5-PROTO-001.
 */

import { TH_JOURNEY } from "../data/localization/th-journey.js";
import { createJourneyShell, loadJourneyResources } from "./journey-shell.js";

const root = document.getElementById("app");

/** One sentence in place of the game, written through the DOM. */
function showFailure(text) {
  const message = document.createElement("p");
  message.className = "jk-boot";
  message.setAttribute("role", "alert");
  message.textContent = text;
  root.replaceChildren(message);
}

async function start() {
  try {
    const resources = await loadJourneyResources();
    const booted = createJourneyShell({ document, root, ...resources }).boot();
    if (!booted.ok) throw new Error(booted.error.code);
  } catch {
    showFailure(location.protocol === "file:" ? TH_JOURNEY.app.fileProtocol : TH_JOURNEY.app.bootFailed);
  }
  document.documentElement.setAttribute("data-ready", "true");
}

start();
