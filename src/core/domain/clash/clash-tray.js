/**
 * Clash view model: what the UI shows during CLASH_INTENT, CLASH_CHOOSE and
 * CLASH_OUTCOME, computed by core so the UI never re-derives a rule (ADR-P0-034 D9.2,
 * UX §1.8 and §3.3).
 *
 * Cards are grouped into the four tray groups of UX §3.3. Each card carries its facts:
 * cost in pips, whether it answers the shown intent ("แก้ทาง"), whether pressing it now
 * makes the frog homesick ("ซ้ำ"), and what it is (combo, finisher, keepsake, companion,
 * sibling). Words, icons and the setting that hides the "แก้ทาง" tag are UI concerns: the
 * labels come from the package (the node's scene labels, then the lexicon).
 *
 * Trace: UX §1.8 · §3.3 · §3.5, ADR-P0-034 D9, TC-S5-TRAY-001.
 */

import { COUNTED_FROM_ACT, GRIT_COST, HOMESICK_COST } from "../journey/journey-rules.js";
import { deepFreeze } from "../journey/plain-data.js";
import { ACTIONS, KEEPSAKES, NO_INTENT, TRAY_GROUPS, answersIntent, trayGroupOf } from "./clash-rules.js";
import { clashContext, effectiveIntent, legalActions } from "./clash-kernel.js";
import { checkClashInputs, clashPosition } from "./clash-engine.js";

/** Pips the card costs, e.g. strike `{sta: 2}` and grit `{hp: 1, sta: 2}`. */
function costOf(action) {
  if (action.grit === true) return { hp: GRIT_COST.hp, sta: GRIT_COST.sta };
  if (action.cost !== undefined) return { sta: action.cost.sta };
  return {};
}

/** Act 5 territory markers beside the gauge (UX §3.5). */
function territoryMarkers(ctx) {
  const markers = [];
  if (!ctx.round.territory) return markers;
  const t = ctx.territory;
  if (t.dimOff) markers.push({ item: KEEPSAKES.gear, intent: "dim", effect: "off" });
  if (t.growHalf) markers.push({ item: KEEPSAKES.seeds, intent: "grow", effect: "half" });
  if (t.gatherOff) markers.push({ item: KEEPSAKES.guard, intent: "gather", effect: "off" });
  for (const item of [KEEPSAKES.whistle, KEEPSAKES.ribbon]) if (ctx.held.has(item)) markers.push({ item, intent: "whisper", effect: "off" });
  return markers;
}

/**
 * The clash as the player sees it now.
 *
 * @param {object} round Round spec. @param {object} journey JourneyState. @param {object} encounter Clash encounter.
 * @returns {Readonly<object>} `{round, turn, turns, light, outcome, intent, preview, territory, groups, homesickCost}`
 */
export function projectClash(round, journey, encounter) {
  checkClashInputs(round, journey, encounter);
  const ctx = clashContext(round, journey);
  const cs = clashPosition(journey, encounter);
  const ended = encounter.outcome !== null;
  const shown = round.intents[cs.turn - 1];
  const effective = effectiveIntent(ctx, cs.turn);
  const homesickNow = ctx.act >= COUNTED_FROM_ACT && cs.homeStreak >= 1;

  const groups = Object.fromEntries(TRAY_GROUPS.map((group) => [group, []]));
  for (const id of ended ? [] : legalActions(ctx, cs)) {
    const a = ACTIONS[id];
    const group = trayGroupOf(id);
    const card = {
      id,
      kind: a.kind,
      cost: costOf(a),
      answers: effective !== NO_INTENT && answersIntent(id, effective),
      homesick: homesickNow && group === "family",
      combo: a.kind === "combo",
      finisher: a.kind === "finisher",
    };
    if (a.item !== undefined) card.item = a.item;
    if (a.ally !== undefined) card.ally = a.ally;
    if (a.sibling !== undefined) card.sibling = a.sibling;
    groups[group].push(card);
  }

  // After ตั้งสติฟังฝน the next two intents show faintly behind the current one (UX §3.5).
  const preview = !ended && cs.lastAction !== null && ACTIONS[cs.lastAction].preview === true
    ? round.intents.slice(cs.turn, cs.turn + 2).map((intent, i) => ({ turn: cs.turn + 1 + i, intent, neutralized: effectiveIntent(ctx, cs.turn + 1 + i) === NO_INTENT }))
    : [];

  return deepFreeze({
    round: round.id,
    turn: cs.turn,
    turns: round.turns,
    light: cs.light,
    outcome: encounter.outcome,
    intent: {
      id: shown,
      neutralized: effective === NO_INTENT,
      halved: shown === "grow" && ctx.territory.growHalf,
      doubled: cs.charged,
      lastTurn: cs.turn === round.turns,
    },
    preview,
    territory: territoryMarkers(ctx),
    groups,
    homesickCost: homesickNow ? { mind: HOMESICK_COST.mind, sta: HOMESICK_COST.sta } : null,
  });
}
