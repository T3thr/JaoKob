/**
 * Play modes of the Journey runtime (UX §1.7, ADR-P0-034 D9.1).
 *
 *   VN ──(choice / obstacle)──▶ DECISION ──(choose)──▶ VN
 *   VN ──(clash)──▶ CLASH_INTRO ─▶ [CLASH_INTENT ─▶ CLASH_CHOOSE ─▶ CLASH_RESOLVE] × turns ─▶ CLASH_OUTCOME ─▶ VN
 *   VN ──(camp)──▶ CAMP ⇄ VN (each activity's lines) ──(leave)──▶ next node
 *   VN ──(micro)──▶ MICRO ─▶ VN · VN ──(pouch)──▶ POUCH_SWAP ─▶ VN · VN ──(A5-11)──▶ ENDING_RESONANCE ─▶ VN
 *   every mode ──(pouch · settings · history)──▶ modal overlay ─▶ the same mode; a clash waits
 *
 * There is no Game Over. BOUNDARY is the end of the content this package has promoted (the
 * cursor waits there for the next package version) and COMPLETE follows an ending.
 * The mode is derived from the saved cursor beat, so a reload resumes the same mode.
 *
 * Trace: UX §1.7, ADR-P0-034 D9, TC-S5-STATE-001.
 */

export const PLAY_MODES = Object.freeze([
  "VN", "DECISION", "CLASH_INTRO", "CLASH_INTENT", "CLASH_CHOOSE", "CLASH_RESOLVE", "CLASH_OUTCOME",
  "CAMP", "MICRO", "POUCH_SWAP", "ENDING_RESONANCE", "BOUNDARY", "COMPLETE",
]);

/** Saved cursor beat → play mode (Save Format 2 `cursor.beat`). */
export const BEAT_MODES = Object.freeze({
  vn: "VN",
  decision: "DECISION",
  "clash-intro": "CLASH_INTRO",
  "clash-intent": "CLASH_INTENT",
  "clash-choose": "CLASH_CHOOSE",
  "clash-resolve": "CLASH_RESOLVE",
  "clash-outcome": "CLASH_OUTCOME",
  camp: "CAMP",
  micro: "MICRO",
  "pouch-swap": "POUCH_SWAP",
  "ending-resonance": "ENDING_RESONANCE",
  complete: "COMPLETE",
});

/** The session commands each mode accepts. */
export const MODE_COMMANDS = Object.freeze({
  VN: Object.freeze(["advance"]),
  DECISION: Object.freeze(["choose"]),
  CLASH_INTRO: Object.freeze(["advance"]),
  CLASH_INTENT: Object.freeze(["advance"]),
  CLASH_CHOOSE: Object.freeze(["clashAct"]),
  CLASH_RESOLVE: Object.freeze(["advance"]),
  CLASH_OUTCOME: Object.freeze(["advance"]),
  CAMP: Object.freeze(["campPick", "campLeave"]),
  MICRO: Object.freeze(["microDone"]),
  POUCH_SWAP: Object.freeze(["pouchDecide"]),
  ENDING_RESONANCE: Object.freeze(["chooseEnding"]),
  BOUNDARY: Object.freeze([]),
  COMPLETE: Object.freeze([]),
});

/** Commands that work in every mode (outside a modal): replaying an act from its snapshot. */
export const ANYTIME_COMMANDS = Object.freeze(["replayAct"]);

/** Modes a node can open in (entering a node is a VN step even when its intro is empty). */
export const ENTRY_MODES = Object.freeze(["VN", "DECISION", "CLASH_INTRO", "CLASH_INTENT", "CLASH_CHOOSE", "CAMP", "MICRO", "POUCH_SWAP", "ENDING_RESONANCE", "BOUNDARY", "COMPLETE"]);

/** Mode changes inside one node (UX §1.7). Leaving a node may go to any ENTRY_MODES. */
export const WITHIN_NODE = Object.freeze({
  VN: Object.freeze(["VN", "DECISION", "MICRO", "CAMP", "POUCH_SWAP", "ENDING_RESONANCE", "COMPLETE"]),
  DECISION: Object.freeze(["VN"]),
  MICRO: Object.freeze(["DECISION", "COMPLETE"]),
  CLASH_INTRO: Object.freeze(["CLASH_INTRO", "CLASH_INTENT", "CLASH_CHOOSE"]),
  CLASH_INTENT: Object.freeze(["CLASH_INTENT", "CLASH_CHOOSE"]),
  CLASH_CHOOSE: Object.freeze(["CLASH_RESOLVE"]),
  CLASH_RESOLVE: Object.freeze(["CLASH_RESOLVE", "CLASH_INTENT", "CLASH_CHOOSE", "CLASH_OUTCOME"]),
  CLASH_OUTCOME: Object.freeze(["CLASH_OUTCOME", "VN"]),
  CAMP: Object.freeze(["VN", "CAMP"]),
  POUCH_SWAP: Object.freeze(["VN"]),
  ENDING_RESONANCE: Object.freeze(["VN"]),
  BOUNDARY: Object.freeze([]),
  COMPLETE: Object.freeze([]),
});

export const MODALS = Object.freeze(["pouch", "settings", "history"]);

/**
 * The commands available now. While a modal is open the game waits: only closing it works.
 *
 * @param {string} mode One of PLAY_MODES. @param {string|null} [modal] One of MODALS or null.
 * @returns {readonly string[]}
 */
export function acceptedCommands(mode, modal = null) {
  if (!PLAY_MODES.includes(mode)) throw new TypeError(`Unknown play mode ${mode}`);
  if (modal !== null) {
    if (!MODALS.includes(modal)) throw new TypeError(`Unknown modal ${modal}`);
    return Object.freeze(["closeModal"]);
  }
  return Object.freeze([...MODE_COMMANDS[mode], ...ANYTIME_COMMANDS]);
}

/**
 * Whether a mode change is one the machine allows.
 *
 * @param {string} from @param {string} to @param {boolean} nodeChanged Whether the cursor moved to another node.
 */
export function transitionAllowed(from, to, nodeChanged) {
  if (!PLAY_MODES.includes(from) || !PLAY_MODES.includes(to)) return false;
  return nodeChanged ? ENTRY_MODES.includes(to) && from !== "BOUNDARY" && from !== "COMPLETE" : WITHIN_NODE[from].includes(to);
}
