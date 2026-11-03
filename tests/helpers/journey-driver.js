// Drives a journey session with a policy, the way the bootstrap will: read the view, send one
// command bound to the current revision, keep the new state. Used by the session tests and the
// Act 1 balance gate (TC-S5-STATE-001, TC-S5-BALANCE-001).
import { readFileSync } from "node:fs";
import { TRAY_GROUPS } from "../../src/core/domain/clash/clash-rules.js";

export const NOW = "2026-11-04T05:00:00+07:00";
export const SESSION_ID = "12345678-1234-4123-8123-123456789abc";

export const loadAct1Package = () => JSON.parse(readFileSync(new URL("../../src/data/content/journey/story-jaokob-core.json", import.meta.url), "utf8"));

/** Card ids of a clash view in tray order. */
export const clashCards = (view) => TRAY_GROUPS.flatMap((group) => view.clash.groups[group].map((card) => card.id));

/**
 * A policy that follows `plan` where it says something and otherwise takes the first open way.
 *   plan[nodeId]        option key for a decision, pouch or ending node
 *   plan[nodeId]        array of clash actions (tried in order each turn) or camp picks
 *                       (`key` or `{activity, item}`)
 */
export function planned(plan = {}) {
  return (view) => {
    const id = view.node.id;
    const want = plan[id];
    switch (view.mode) {
      case "VN": case "CLASH_INTRO": case "CLASH_INTENT": case "CLASH_RESOLVE": case "CLASH_OUTCOME":
        return { kind: "advance" };
      case "DECISION":
        return { kind: "choose", args: { option: want ?? view.decision.options.find((o) => o.available).key } };
      case "CLASH_CHOOSE": {
        const cards = clashCards(view);
        const pick = (want ?? []).find((action) => cards.includes(action)) ?? cards[0];
        return { kind: "clashAct", args: { action: pick } };
      }
      case "CAMP": {
        const open = view.camp.activities.filter((a) => a.available);
        const wanted = (want ?? []).map((w) => (typeof w === "string" ? { activity: w } : w)).find((w) => open.some((a) => a.key === w.activity));
        if (wanted) return { kind: "campPick", args: wanted };
        if (view.camp.finished) return { kind: "campLeave" };
        const first = open[0];
        return { kind: "campPick", args: first.ready ? { activity: first.key, item: view.camp.readyCandidates[0] } : { activity: first.key } };
      }
      case "MICRO":
        return { kind: "microDone" };
      case "POUCH_SWAP":
        return { kind: "pouchDecide", args: { option: want ?? view.pouch.options.find((o) => o.available).key } };
      case "ENDING_RESONANCE":
        return { kind: "chooseEnding", args: { option: want ?? view.endings.options.find((o) => o.open).key } };
      default:
        return null;
    }
  };
}

/**
 * Play until the policy stops (BOUNDARY or COMPLETE) or a command is rejected.
 *
 * @returns {{state: object, states: object[], results: object[], modes: string[], nodes: string[], error?: object}}
 */
export function playSession(session, policy, { state = session.newGame({ sessionId: SESSION_ID, now: NOW }), limit = 5000 } = {}) {
  const states = [state];
  const results = [];
  const modes = [session.modeOf(state)];
  const nodes = [state.payload.cursor.node];
  for (let i = 0; i < limit; i += 1) {
    const command = policy(session.view(state), state);
    if (command === null) return { state, states, results, modes, nodes };
    const result = session[command.kind](state, { revision: state.revision, now: NOW, ...(command.args ?? {}) });
    if (!result.ok) return { state, states, results, modes, nodes, error: result.error };
    results.push(result);
    state = result.state;
    states.push(state);
    modes.push(session.modeOf(state));
    nodes.push(state.payload.cursor.node);
  }
  throw new Error("the policy did not finish");
}
