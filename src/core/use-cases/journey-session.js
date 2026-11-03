/**
 * Journey session: every player command is one atomic, revision-bound transaction over the
 * Save Format 2 journey payload (ADR-P0-034 D2/D3/D7/D9).
 *
 * A command names the revision the player saw. A stale revision, a command the current beat
 * does not take, or an option that is closed is rejected with a stable code and the state is
 * returned untouched. A successful command returns a new deep-frozen state (revision + 1)
 * and plain events for toasts. The bootstrap saves silently after every committed command.
 * Time and the session id come in through the command (the clock port lives outside Core).
 *
 * Cursor (node · beat · line) is the semantic reading position. Per node type:
 *   vn       vn(lines) → [micro] → next, or complete when the node completes an ending
 *   choice   vn(lines) → [micro] → decision → vn(responses) → option.next ?? next
 *   obstacle vn(lines) → decision → vn(responses) → next
 *   clash    clash-intro → (clash-intent → clash-choose → clash-resolve) × turns → clash-outcome → vn(outro) → next
 *   camp     vn(lines) → camp ⇄ vn(activity responses) → leave → next
 *   micro    vn(lines) → micro → next
 *   pouch    vn(lines) → pouch-swap → vn(responses) → next
 *   ending   vn(lines) → ending-resonance → vn(responses) → the ending's next
 * A node's effects apply once, when its own lines have been read, so a reload before that
 * point replays the lines and a boundary cursor waits before the unpromoted node's effects.
 * Entering a node of a new act resets the homesick streak and captures the act-start
 * snapshot (Q5). Replaying an act restores that snapshot and drops the later snapshots and
 * the later history; endings already seen stay seen.
 *
 * Trace: ADR-P0-034 D1–D3 · D7 · D9, master plan §2, UX §1.7–§1.8, TC-S5-STATE-001, TC-S5-REPLAY-001.
 */

import { ACTIONS } from "../domain/clash/clash-rules.js";
import { assertRound, closeClash, openClash, playClashTurn } from "../domain/clash/clash-engine.js";
import { projectClash } from "../domain/clash/clash-tray.js";
import { campFinished, activityBlock, openCamp, pickActivity, readyCandidates } from "../domain/encounters/camp.js";
import { microValid, microView } from "../domain/encounters/micro.js";
import { methodCost, obstacleBlock, obstacleHomesick, resolveObstacle } from "../domain/encounters/obstacle.js";
import { offerBlock, offerChoices, resolveOffer } from "../domain/encounters/pouch-offer.js";
import { allows, visibleLines } from "../domain/journey/conditions.js";
import { affordable, applyEffects } from "../domain/journey/effects.js";
import { ENDINGS, ENDING_REASONS, evaluateEndings } from "../domain/journey/endings.js";
import { JOURNEY_ERROR_CODES as CODES, JourneyError, ensure } from "../domain/journey/journey-errors.js";
import { BONDS, addressTier } from "../domain/journey/journey-rules.js";
import { IDENTIFIER, assertJourneyState, beginAct, createJourneyState } from "../domain/journey/journey-state.js";
import { cloneData, deepFreeze } from "../domain/journey/plain-data.js";
import { BEAT_MODES, acceptedCommands } from "../state-machine/play-mode.js";

export const HISTORY_MAX = 200;
export const ACT_STARTS_MAX = 5;
/** Reserved history actions that no package key may use at the node types that record them. */
export const CAMP_LEAVE = "leave";
const HISTORY_ACTION_MAX = 48;
const DATE_TIME = /^\d{4}-\d{2}-\d{2}[Tt]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:[Zz]|[+-]\d{2}:\d{2})$/;
const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const BEATS = Object.freeze(Object.keys(BEAT_MODES));
const SETTLE_LIMIT = 4096;

const isPlainObject = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const isInt = (value, min, max) => Number.isSafeInteger(value) && value >= min && value <= max;
const invalidPackage = (rule, details = {}) => new JourneyError(CODES.PACKAGE_INVALID, `package ${rule}`, { rule, ...details });

// ---------------------------------------------------------------------------------------
// Package index: what the schema cannot check but the session relies on.
// ---------------------------------------------------------------------------------------
function indexPackage(pkg) {
  if (!isPlainObject(pkg) || pkg.profile !== "journey" || pkg.schemaVersion !== "3.0.0") throw invalidPackage("must be a journey package of schema 3.0.0");
  const nodes = new Map();
  for (const node of pkg.nodes) {
    if (nodes.has(node.id)) throw invalidPackage("has a duplicate node", { node: node.id });
    nodes.set(node.id, node);
  }
  const boundaries = new Map(pkg.boundaries.map((b) => [b.node, b.act]));
  for (const node of boundaries.keys()) if (nodes.has(node)) throw invalidPackage("lists a compiled node as a boundary", { node });
  const rounds = new Map(pkg.rounds.map((round) => [round.id, round]));
  for (const round of rounds.values()) assertRound(round);
  const lockedItems = new Set(pkg.items.filter((item) => item.locked).map((item) => item.id));
  const longestItem = Math.max(0, ...pkg.items.map((item) => item.id.length));
  const actOf = (id) => nodes.get(id)?.act ?? boundaries.get(id);
  const target = (node, id) => {
    if (actOf(id) === undefined) throw invalidPackage("points next at an unknown node", { node: node.id, next: id });
    if (actOf(id) < node.act) throw invalidPackage("goes back to an earlier act", { node: node.id, next: id });
  };
  const uniqueKeys = (node, keys) => { if (new Set(keys).size !== keys.length) throw invalidPackage("repeats an option key", { node: node.id }); };
  for (const node of nodes.values()) {
    if (node.micro !== undefined && !microValid(node.micro)) throw invalidPackage("has a malformed micro-action", { node: node.id });
    switch (node.type) {
      case "vn":
        if (node.next !== undefined) target(node, node.next);
        break;
      case "choice":
        uniqueKeys(node, node.options.map((o) => o.key));
        for (const option of node.options) {
          if (option.next === undefined && node.next === undefined) throw invalidPackage("has an option with nowhere to go", { node: node.id, option: option.key });
          target(node, option.next ?? node.next);
        }
        break;
      case "obstacle":
        uniqueKeys(node, node.options.map((o) => o.key));
        if (!node.options.some((o) => o.method.kind === "grit")) throw invalidPackage("has an obstacle without grit", { node: node.id });
        target(node, node.next);
        break;
      case "clash": {
        const round = rounds.get(node.round);
        if (round === undefined) throw new JourneyError(CODES.CLASH_ROUND_UNKNOWN, `round ${node.round} is not in the package`, { node: node.id, round: node.round });
        if (round.act !== node.act || node.intentLines.length !== round.turns) throw invalidPackage("has a clash that does not fit its round", { node: node.id });
        target(node, node.next);
        break;
      }
      case "camp":
        uniqueKeys(node, node.activities.map((a) => a.key));
        if (node.activities.some((a) => a.key === CAMP_LEAVE)) throw invalidPackage(`uses the reserved camp key ${CAMP_LEAVE}`, { node: node.id });
        if (node.activities.some((a) => a.ready === true && a.key.length + 1 + longestItem > HISTORY_ACTION_MAX)) throw invalidPackage("has a ready activity key too long to record with a keepsake", { node: node.id });
        target(node, node.next);
        break;
      case "micro":
        target(node, node.next);
        break;
      case "pouch":
        uniqueKeys(node, offerChoices(node.offer).map((entry) => entry.choice.key));
        if (lockedItems.has(node.offer.item) || node.offer.releases.some((r) => lockedItems.has(r.release))) throw invalidPackage("offers or hands on a locked keepsake", { node: node.id });
        target(node, node.next);
        break;
      case "ending":
        uniqueKeys(node, node.endings.map((e) => e.key));
        if (ENDINGS.some((id) => node.endings.filter((e) => e.ending === id).length !== 1)) throw invalidPackage("must offer each ending once", { node: node.id });
        for (const option of node.endings) {
          const reasons = option.locks.map((lock) => lock.reason);
          if (reasons.length !== ENDING_REASONS[option.ending].length || !ENDING_REASONS[option.ending].every((r) => reasons.includes(r))) {
            throw invalidPackage("must give one locked line for each condition of the ending", { node: node.id, ending: option.ending });
          }
          target(node, option.next);
        }
        break;
      default:
        throw invalidPackage("has an unknown node type", { node: node.id, type: node.type });
    }
  }
  const startNode = nodes.get(pkg.start.node);
  if (startNode === undefined) throw invalidPackage("starts at an unknown node", { node: pkg.start.node });
  return { pkg, nodes, boundaries, rounds, actOf, rules: { lockedItems }, start: { node: startNode.id, act: startNode.act, meters: pkg.start.meters } };
}

// ---------------------------------------------------------------------------------------
// Reading position.
// ---------------------------------------------------------------------------------------
const introBeat = (node) => (node.type === "clash" ? "clash-intro" : "vn");

/** The decision taken at the cursor's node, if any (the last history entry belongs to it). */
function decisionAt(p) {
  const last = p.history[p.history.length - 1];
  return last !== undefined && last.node === p.cursor.node ? last.action : null;
}

const optionOf = (node, key) => node.options.find((o) => o.key === key);
const endingOf = (node, key) => node.endings.find((e) => e.key === key);
const offerEntryOf = (node, key) => offerChoices(node.offer).find((entry) => entry.choice.key === key);
const activityOf = (node, key) => node.activities.find((a) => a.key === key);

/** Lines of the phase the cursor is in, or null for a beat that waits for a command. */
function phaseLines(cat, p) {
  const node = cat.nodes.get(p.cursor.node);
  const j = p.journey;
  switch (p.cursor.beat) {
    case "vn": {
      if (node.type === "camp") return p.encounter === null ? visibleLines(node.lines, j) : visibleLines(activityOf(node, p.encounter.chosen.at(-1)).responses, j);
      if (node.type === "clash") return visibleLines(node.outroLines, j);
      const decided = ["choice", "obstacle", "pouch", "ending"].includes(node.type) ? decisionAt(p) : null;
      if (decided === null) return visibleLines(node.lines, j);
      if (node.type === "pouch") return visibleLines(offerEntryOf(node, decided).choice.responses, j);
      if (node.type === "ending") return visibleLines(endingOf(node, decided).responses, j);
      return visibleLines(optionOf(node, decided).responses, j);
    }
    case "clash-intro": return visibleLines(node.lines, j);
    case "clash-intent": return visibleLines(node.intentLines[p.encounter.turn - 1], j);
    case "clash-resolve": {
      const response = node.responses[p.encounter.lastAction];
      return response === undefined ? [] : [{ text: response }];
    }
    case "clash-outcome": return visibleLines(node.outcome[p.encounter.outcome], j);
    default: return null;
  }
}

function isStop(cat, p) {
  if (!cat.nodes.has(p.cursor.node)) return true;
  const lines = phaseLines(cat, p);
  if (lines === null) return true;
  const atLeastOnce = p.cursor.beat === "clash-resolve" || p.cursor.beat === "clash-outcome";
  return p.cursor.line < (atLeastOnce ? Math.max(1, lines.length) : lines.length);
}

function startAct(p, act, node, now) {
  beginAct(p.journey, act);
  if (!p.actStarts.some((s) => s.act === act)) p.actStarts.push({ act, node, capturedAt: now, journey: cloneData(p.journey) });
}

function enter(cat, p, target, ctx) {
  const act = cat.actOf(target);
  if (act !== p.journey.act) {
    startAct(p, act, target, ctx.now);
    ctx.events.push({ type: "act", act });
  }
  const node = cat.nodes.get(target);
  p.cursor = { node: target, beat: node === undefined ? "vn" : introBeat(node), line: 0 };
}

function leave(cat, p, target, ctx) {
  const node = cat.nodes.get(p.cursor.node);
  if (node.type === "vn" && node.completes !== undefined) {
    if (!p.completion.endingsSeen.includes(node.completes)) p.completion.endingsSeen.push(node.completes);
    ctx.events.push({ type: "ending", ending: node.completes });
    p.cursor = { node: node.id, beat: "complete", line: 0 };
    return;
  }
  enter(cat, p, target, ctx);
}

const goTo = (p, beat) => { p.cursor = { node: p.cursor.node, beat, line: 0 }; };

/** The node's own lines are read: its effects apply, then it waits for the player. */
function afterLines(cat, p, node, ctx) {
  applyEffects(p.journey, node.effects, cat.rules);
  if (node.micro !== undefined) return goTo(p, "micro");
  switch (node.type) {
    case "choice":
    case "obstacle": return goTo(p, "decision");
    case "pouch": return goTo(p, "pouch-swap");
    default: return leave(cat, p, node.next, ctx);
  }
}

/** Move one step forward from the current position. */
function next(cat, p, ctx) {
  const lines = phaseLines(cat, p);
  if (lines !== null && p.cursor.line + 1 < lines.length) {
    p.cursor.line += 1;
    return;
  }
  const node = cat.nodes.get(p.cursor.node);
  switch (p.cursor.beat) {
    case "clash-intro":
      p.encounter = cloneData(openClash(cat.rounds.get(node.round), p.journey));
      return goTo(p, "clash-intent");
    case "clash-intent": return goTo(p, "clash-choose");
    case "clash-resolve": return goTo(p, p.encounter.outcome === null ? "clash-intent" : "clash-outcome");
    case "clash-outcome":
      p.journey = cloneData(closeClash(p.journey, p.encounter));
      p.encounter = null;
      return goTo(p, "vn");
    default: break;
  }
  // beat "vn": the end of a node's lines, of a decision's responses, of a camp activity or of the outro.
  switch (node.type) {
    case "camp":
      if (p.encounter === null) p.encounter = openCamp(node);
      return goTo(p, "camp");
    case "clash": return leave(cat, p, node.next, ctx);
    case "ending": {
      const decided = decisionAt(p);
      if (decided === null) return goTo(p, "ending-resonance");
      return leave(cat, p, endingOf(node, decided).next, ctx);
    }
    case "choice":
    case "obstacle":
    case "pouch": {
      const decided = decisionAt(p);
      if (decided === null) return afterLines(cat, p, node, ctx);
      return leave(cat, p, node.type === "choice" ? optionOf(node, decided).next ?? node.next : node.next, ctx);
    }
    default: return afterLines(cat, p, node, ctx);
  }
}

function settle(cat, p, ctx) {
  for (let i = 0; !isStop(cat, p); i += 1) {
    if (i >= SETTLE_LIMIT) throw invalidPackage("never reaches a point that waits for the player", { node: p.cursor.node });
    next(cat, p, ctx);
  }
}

function record(p, action, now) {
  const sequence = (p.history.at(-1)?.sequence ?? 0) + 1;
  p.history.push({ sequence, node: p.cursor.node, action, committedAt: now });
  if (p.history.length > HISTORY_MAX) p.history.splice(0, p.history.length - HISTORY_MAX);
}

// ---------------------------------------------------------------------------------------
// Events: what changed, for toasts and announcements (plain data).
// ---------------------------------------------------------------------------------------
function changeEvents(before, after) {
  const events = [];
  for (const meter of ["hp", "mind", "sta"]) {
    if (before.meters[meter] !== after.meters[meter]) events.push({ type: "meter", meter, from: before.meters[meter], to: after.meters[meter] });
  }
  for (const bond of BONDS) {
    if (before.bonds[bond] !== after.bonds[bond]) {
      events.push({ type: "bond", bond, from: before.bonds[bond], to: after.bonds[bond], tier: addressTier(after.bonds[bond]), tierChanged: addressTier(before.bonds[bond]) !== addressTier(after.bonds[bond]) });
    }
  }
  for (const item of after.pouch.held) if (!before.pouch.held.includes(item)) events.push({ type: "keepsake", item, change: "gained" });
  for (const item of before.pouch.held) if (!after.pouch.held.includes(item)) events.push({ type: "keepsake", item, change: "handed-on" });
  for (const item of after.pouch.memory) if (!before.pouch.memory.includes(item)) events.push({ type: "keepsake", item, change: "remembered" });
  for (const item of after.ready) if (!before.ready.includes(item)) events.push({ type: "ready", item });
  if (after.counters.homesickCount > before.counters.homesickCount) events.push({ type: "homesick" });
  return events;
}

// ---------------------------------------------------------------------------------------
// State admission (the data layer has checked the schema; this checks the meaning).
// ---------------------------------------------------------------------------------------
const PAYLOAD_KEYS = Object.freeze(["sessionId", "startedAt", "playTimeMs", "cursor", "journey", "encounter", "actStarts", "completion", "history"]);

function assertState(cat, state) {
  const bad = (rule) => ensure(false, CODES.STATE_INVALID, `session ${rule}`, { rule });
  if (!isPlainObject(state) || Object.keys(state).length !== 2 || !isInt(state.revision, 1, Number.MAX_SAFE_INTEGER) || !isPlainObject(state.payload)) bad("must be {revision, payload}");
  const p = state.payload;
  if (Object.keys(p).length !== PAYLOAD_KEYS.length || !PAYLOAD_KEYS.every((key) => Object.hasOwn(p, key))) bad("payload must have exactly the journey fields");
  if (typeof p.sessionId !== "string" || !UUID_V4.test(p.sessionId)) bad("sessionId must be a UUID v4");
  if (typeof p.startedAt !== "string" || !DATE_TIME.test(p.startedAt)) bad("startedAt must be a date-time");
  if (!isInt(p.playTimeMs, 0, Number.MAX_SAFE_INTEGER)) bad("playTimeMs must be a whole number");
  assertJourneyState(p.journey, "payload.journey");
  const c = p.cursor;
  if (!isPlainObject(c) || Object.keys(c).length !== 3 || !BEATS.includes(c.beat) || !isInt(c.line, 0, 64)) bad("cursor must be {node, beat, line}");
  const node = cat.nodes.get(c.node);
  if (node === undefined) {
    if (!cat.boundaries.has(c.node) || c.beat !== "vn" || c.line !== 0 || p.encounter !== null) bad("cursor points at an unknown node");
  } else {
    const clashBeats = ["clash-intent", "clash-choose", "clash-resolve", "clash-outcome"];
    const allowed = {
      vn: true, decision: ["choice", "obstacle"].includes(node.type), "clash-intro": node.type === "clash",
      "clash-intent": node.type === "clash", "clash-choose": node.type === "clash", "clash-resolve": node.type === "clash",
      "clash-outcome": node.type === "clash", camp: node.type === "camp", micro: node.micro !== undefined, "pouch-swap": node.type === "pouch",
      "ending-resonance": node.type === "ending", complete: node.type === "vn" && node.completes !== undefined,
    };
    if (!allowed[c.beat]) bad(`beat ${c.beat} does not belong to a ${node.type} node`);
    if (clashBeats.includes(c.beat)) {
      ensure(isPlainObject(p.encounter) && p.encounter.kind === "clash", CODES.STATE_INVALID, "session clash beat without a clash", { rule: "clash beat needs a clash encounter" });
      playableClash(cat, node, p);
      if ((c.beat === "clash-outcome") !== (p.encounter.outcome !== null) && c.beat !== "clash-resolve") bad("clash beat does not fit the outcome");
    } else if (c.beat === "camp" || (c.beat === "vn" && node.type === "camp" && p.encounter !== null)) {
      const e = p.encounter;
      if (!isPlainObject(e) || e.kind !== "camp" || e.camp !== node.camp || Object.keys(e).length !== 4 || !isInt(e.dropsLeft, 0, node.drops)
        || !Array.isArray(e.chosen) || e.chosen.length !== node.drops - e.dropsLeft || new Set(e.chosen).size !== e.chosen.length
        || !e.chosen.every((key) => activityOf(node, key) !== undefined)) bad("camp encounter does not fit the camp");
      if (c.beat === "vn" && e.chosen.length === 0) bad("camp lines without a chosen activity");
    } else if (p.encounter !== null) {
      bad("an encounter is open outside its node");
    }
    const decided = decisionAt(p);
    if (["choice", "obstacle", "pouch", "ending"].includes(node.type) && decided !== null) {
      const known = node.type === "pouch" ? offerEntryOf(node, decided) : node.type === "ending" ? endingOf(node, decided) : optionOf(node, decided);
      if (known === undefined) bad("history names an option the node does not have");
      if (c.beat !== "vn") bad("a decided node waits only for its responses");
    }
  }
  if (!Array.isArray(p.actStarts) || p.actStarts.length > ACT_STARTS_MAX || new Set(p.actStarts.map((s) => s.act)).size !== p.actStarts.length) bad("actStarts must be at most one snapshot per act");
  p.actStarts.forEach((s, i) => {
    if (!isPlainObject(s) || cat.actOf(s.node) !== s.act || typeof s.capturedAt !== "string" || !DATE_TIME.test(s.capturedAt)) bad("an act-start snapshot is malformed");
    assertJourneyState(s.journey, `payload.actStarts[${i}].journey`);
  });
  const seen = p.completion?.endingsSeen;
  if (!Array.isArray(seen) || new Set(seen).size !== seen.length || !seen.every((e) => ENDINGS.includes(e))) bad("completion must list distinct endings");
  if (!Array.isArray(p.history) || p.history.length > HISTORY_MAX) bad("history must hold at most 200 entries");
  p.history.forEach((h, i) => {
    if (!isPlainObject(h) || !isInt(h.sequence, 1, Number.MAX_SAFE_INTEGER) || (i > 0 && h.sequence <= p.history[i - 1].sequence)
      || typeof h.action !== "string" || h.action.length > HISTORY_ACTION_MAX || !IDENTIFIER.test(h.action) || cat.actOf(h.node) === undefined
      || typeof h.committedAt !== "string" || !DATE_TIME.test(h.committedAt)) bad("a history entry is malformed");
  });
}

function playableClash(cat, node, p) {
  if (p.encounter.round !== node.round) throw new JourneyError(CODES.STATE_INVALID, "session clash belongs to another round", { rule: "clash round" });
  projectClash(cat.rounds.get(node.round), p.journey, p.encounter);
}

// ---------------------------------------------------------------------------------------
// Session.
// ---------------------------------------------------------------------------------------
/**
 * @param {object} pkg A journey package the data layer has admitted (schema, references, capabilities).
 */
export function createJourneySession(pkg) {
  const cat = indexPackage(pkg);
  const modeOf = (state) => (cat.nodes.has(state.payload.cursor.node) ? BEAT_MODES[state.payload.cursor.beat] : "BOUNDARY");

  function checkCommand(state, command, kind) {
    ensure(isPlainObject(command), CODES.COMMAND_INVALID, "a command must be an object", { command: kind });
    ensure(command.revision === state.revision, CODES.REVISION, `revision ${command.revision} is not the current revision ${state.revision}`, { expected: state.revision, got: command.revision ?? null });
    ensure(typeof command.now === "string" && DATE_TIME.test(command.now), CODES.COMMAND_INVALID, "now must be an ISO date-time", { command: kind });
    const mode = modeOf(state);
    ensure(acceptedCommands(mode).includes(kind), CODES.BEAT, `${kind} does not belong to ${mode}`, { mode, command: kind });
  }

  /** Run one command atomically. */
  function transact(state, command, kind, body) {
    try {
      checkCommand(state, command, kind);
      const draft = cloneData(state);
      const ctx = { now: command.now, events: [] };
      const before = cloneData(draft.payload.journey);
      body(draft.payload, ctx);
      settle(cat, draft.payload, ctx);
      draft.revision += 1;
      assertJourneyState(draft.payload.journey, "payload.journey");
      return deepFreeze({ ok: true, state: draft, events: [...changeEvents(before, draft.payload.journey), ...ctx.events] });
    } catch (error) {
      if (!(error instanceof JourneyError)) throw error;
      return deepFreeze({ ok: false, state, error: { code: error.code, message: error.message, details: cloneData({ ...error.details }) } });
    }
  }

  const nodeOf = (p) => cat.nodes.get(p.cursor.node);
  const unknown = (kind, key) => new JourneyError(CODES.OPTION_UNKNOWN, `no ${kind} ${String(key)} here`, { [kind]: String(key) });
  const closed = (kind, key, reason, extra = {}) => new JourneyError(CODES.OPTION_UNAVAILABLE, `${kind} ${key} is closed: ${reason}`, { [kind]: key, reason, ...extra });

  const session = {
    package: Object.freeze({ id: pkg.package.id, contentVersion: pkg.package.contentVersion }),

    /** New Game on the package's start node; act 1's snapshot is taken at once. */
    newGame({ sessionId, now }) {
      ensure(typeof sessionId === "string" && UUID_V4.test(sessionId), CODES.COMMAND_INVALID, "sessionId must be a UUID v4", { command: "newGame" });
      ensure(typeof now === "string" && DATE_TIME.test(now), CODES.COMMAND_INVALID, "now must be an ISO date-time", { command: "newGame" });
      const journey = createJourneyState(cat.start);
      const startNode = cat.nodes.get(cat.start.node);
      const payload = {
        sessionId,
        startedAt: now,
        playTimeMs: 0,
        cursor: { node: startNode.id, beat: introBeat(startNode), line: 0 },
        journey,
        encounter: null,
        actStarts: [{ act: cat.start.act, node: startNode.id, capturedAt: now, journey: cloneData(journey) }],
        completion: { endingsSeen: [] },
        history: [],
      };
      settle(cat, payload, { now, events: [] });
      return deepFreeze({ revision: 1, payload });
    },

    /** Admit a saved state for this package (Resume never writes). */
    restore(state) {
      const copy = cloneData(state);
      assertState(cat, copy);
      if (!isStop(cat, copy.payload)) throw new JourneyError(CODES.STATE_INVALID, "session cursor is past the end of its lines", { rule: "cursor line" });
      return deepFreeze(copy);
    },

    /** Count real play time; not a story change, so the revision stays. */
    addPlayTime(state, elapsedMs) {
      ensure(Number.isSafeInteger(elapsedMs) && elapsedMs >= 0, CODES.COMMAND_INVALID, "elapsedMs must be a whole number of milliseconds", { command: "addPlayTime" });
      const copy = cloneData(state);
      copy.payload.playTimeMs = Math.min(Number.MAX_SAFE_INTEGER, copy.payload.playTimeMs + elapsedMs);
      return deepFreeze(copy);
    },

    modeOf,

    advance: (state, command) => transact(state, command, "advance", (p, ctx) => next(cat, p, ctx)),

    choose: (state, command) => transact(state, command, "choose", (p) => {
      const node = nodeOf(p);
      const option = optionOf(node, command.option);
      if (option === undefined) throw unknown("option", command.option);
      if (node.type === "obstacle") {
        const block = obstacleBlock(option, p.journey);
        if (block !== null) throw closed("option", option.key, block);
        resolveObstacle(p.journey, option, cat.rules);
      } else {
        if (!allows(option.when, p.journey)) throw closed("option", option.key, "not-now");
        if (!affordable(option.effects, p.journey)) throw closed("option", option.key, "sta-low");
        applyEffects(p.journey, option.effects, cat.rules);
      }
      record(p, option.key, command.now);
      goTo(p, "vn");
    }),

    clashAct: (state, command) => transact(state, command, "clashAct", (p, ctx) => {
      const node = nodeOf(p);
      const result = playClashTurn(cat.rounds.get(node.round), p.journey, p.encounter, command.action);
      p.journey = cloneData(result.journey);
      p.encounter = cloneData(result.encounter);
      ctx.events.push({ type: "clash-turn", report: cloneData(result.report) });
      record(p, command.action.toLowerCase(), command.now);
      goTo(p, "clash-resolve");
    }),

    campPick: (state, command) => transact(state, command, "campPick", (p) => {
      const node = nodeOf(p);
      const activity = activityOf(node, command.activity);
      if (activity === undefined) throw unknown("activity", command.activity);
      const block = activityBlock(activity, node, p.journey, p.encounter);
      if (block !== null) throw closed("activity", activity.key, block);
      let item;
      if (activity.ready === true) {
        item = command.item;
        if (!readyCandidates(p.journey).includes(item)) throw closed("activity", activity.key, "item-not-readyable", { item: String(item) });
      } else if (command.item !== undefined) {
        throw new JourneyError(CODES.COMMAND_INVALID, `activity ${activity.key} takes no keepsake`, { command: "campPick" });
      }
      p.encounter = pickActivity(p.journey, activity, p.encounter, cat.rules, item);
      record(p, item === undefined ? activity.key : `${activity.key}.${item}`, command.now);
      goTo(p, "vn");
    }),

    campLeave: (state, command) => transact(state, command, "campLeave", (p, ctx) => {
      const node = nodeOf(p);
      if (!campFinished(node, p.journey, p.encounter)) throw new JourneyError(CODES.CAMP_UNFINISHED, "drops and activities are left", { dropsLeft: p.encounter.dropsLeft });
      record(p, CAMP_LEAVE, command.now);
      p.encounter = null;
      leave(cat, p, node.next, ctx);
    }),

    microDone: (state, command) => transact(state, command, "microDone", (p, ctx) => {
      const node = nodeOf(p);
      if (node.type === "choice") goTo(p, "decision");
      else leave(cat, p, node.next, ctx);
    }),

    pouchDecide: (state, command) => transact(state, command, "pouchDecide", (p) => {
      const node = nodeOf(p);
      const entry = offerEntryOf(node, command.option);
      if (entry === undefined) throw unknown("option", command.option);
      const block = offerBlock(entry, p.journey, cat.rules.lockedItems);
      if (block !== null) throw closed("option", entry.choice.key, block);
      resolveOffer(p.journey, node.offer, entry, cat.rules);
      record(p, entry.choice.key, command.now);
      goTo(p, "vn");
    }),

    chooseEnding: (state, command) => transact(state, command, "chooseEnding", (p) => {
      const node = nodeOf(p);
      const option = endingOf(node, command.option);
      if (option === undefined) throw unknown("option", command.option);
      const ending = evaluateEndings(p.journey).endings[option.ending];
      if (!ending.open) throw closed("option", option.key, "locked", { missing: ending.missing });
      record(p, option.key, command.now);
      goTo(p, "vn");
    }),

    replayAct: (state, command) => transact(state, command, "replayAct", (p, ctx) => {
      const snapshot = p.actStarts.find((s) => s.act === command.act);
      if (snapshot === undefined) throw new JourneyError(CODES.REPLAY_UNAVAILABLE, `no snapshot for act ${String(command.act)}`, { act: command.act ?? null });
      p.journey = cloneData(snapshot.journey);
      p.encounter = null;
      p.actStarts = p.actStarts.filter((s) => s.act <= snapshot.act);
      p.history = p.history.filter((h) => (cat.actOf(h.node) ?? Infinity) < snapshot.act);
      const node = cat.nodes.get(snapshot.node);
      p.cursor = { node: snapshot.node, beat: node === undefined ? "vn" : introBeat(node), line: 0 };
      ctx.events.push({ type: "replay", act: snapshot.act });
    }),

    /** The view model of the current beat (UX §1.8). Text fields are text ids of the package. */
    view(state) {
      const p = state.payload;
      const mode = modeOf(state);
      const j = p.journey;
      const node = cat.nodes.get(p.cursor.node);
      const hud = {
        act: j.act,
        meters: { ...j.meters },
        bonds: Object.fromEntries(BONDS.map((b) => [b, { value: j.bonds[b], tier: addressTier(j.bonds[b]) }])),
        pouch: { capacity: j.pouch.capacity, held: j.pouch.held.map((item) => ({ item, locked: cat.rules.lockedItems.has(item), ready: j.ready.includes(item) })) },
      };
      const base = { revision: state.revision, mode, accepts: acceptedCommands(mode), hud, completion: { endingsSeen: [...p.completion.endingsSeen] } };
      if (node === undefined) return deepFreeze({ ...base, node: { id: p.cursor.node, act: cat.actOf(p.cursor.node), boundary: true }, line: null });
      const lines = phaseLines(cat, p);
      const view = {
        ...base,
        node: { id: node.id, type: node.type, act: node.act, title: node.title, stage: node.stage },
        line: lines !== null && p.cursor.line < lines.length ? { text: lines[p.cursor.line].text } : null,
      };
      if (mode === "DECISION") {
        view.decision = {
          options: node.type === "obstacle"
            ? node.options.map((o) => ({ key: o.key, label: o.label, kind: o.method.kind, method: { ...o.method }, cost: methodCost(o.method), homesick: obstacleHomesick(o, j), available: obstacleBlock(o, j) === null, reason: obstacleBlock(o, j) }))
            : node.options.filter((o) => allows(o.when, j)).map((o) => ({ key: o.key, label: o.label, kind: "choice", cost: spendCost(o.effects), homesick: false, available: affordable(o.effects, j), reason: affordable(o.effects, j) ? null : "sta-low" })),
        };
      }
      if (node.type === "clash" && p.encounter !== null) {
        const round = cat.rounds.get(node.round);
        view.clash = { ...projectClash(round, j, p.encounter), labels: { ...pkg.lexicon.actions, ...node.labels }, intentLabel: pkg.lexicon.intents[round.intents[p.encounter.turn - 1]] };
        if (mode === "CLASH_RESOLVE") view.clash.resolved = resolvedTurn(round, p.encounter);
      }
      if (mode === "CLASH_INTRO") {
        const round = cat.rounds.get(node.round);
        view.clash = { round: round.id, turns: round.turns, opening: true, light: openClash(round, j).light };
      }
      if (mode === "CAMP" || (node.type === "camp" && p.encounter !== null)) {
        view.camp = {
          camp: node.camp, drops: node.drops, dropsLeft: p.encounter.dropsLeft, finished: campFinished(node, j, p.encounter),
          activities: node.activities.map((a) => {
            const block = activityBlock(a, node, j, p.encounter);
            return { key: a.key, label: a.label, group: a.group ?? null, ready: a.ready === true, chosen: p.encounter.chosen.includes(a.key), available: block === null, reason: block, cost: spendCost(a.effects), releases: a.effects.filter((e) => e.op === "item.release").map((e) => e.item) };
          }),
          readyCandidates: readyCandidates(j),
        };
      }
      if (mode === "MICRO") view.micro = microView(node.micro);
      if (mode === "POUCH_SWAP") {
        view.pouch = {
          incoming: node.offer.item,
          options: offerChoices(node.offer).map((entry) => {
            const block = offerBlock(entry, j, cat.rules.lockedItems);
            return { key: entry.choice.key, kind: entry.kind, label: entry.choice.label, release: entry.choice.release ?? null, available: block === null, reason: block };
          }),
        };
      }
      if (mode === "ENDING_RESONANCE") {
        const evaluation = evaluateEndings(j);
        view.endings = {
          fallback: evaluation.fallback,
          fallbackLine: evaluation.fallback ? node.fallbackLine ?? null : null,
          options: node.endings.map((option) => {
            const result = evaluation.endings[option.ending];
            const first = option.locks.find((lock) => result.missing.includes(lock.reason));
            return { key: option.key, ending: option.ending, label: option.label, open: result.open, strands: { ...result.strands }, lockLine: result.open ? null : first.text, fallback: evaluation.fallback && option.ending === "e-pond" };
          }),
        };
      }
      return deepFreeze(view);
    },
  };
  return Object.freeze(session);
}

/** Stamina pips a choice's voluntary costs take. */
function spendCost(effects) {
  const cost = {};
  for (const effect of effects ?? []) if (effect.op === "meter.spend") cost[effect.meter] = (cost[effect.meter] ?? 0) + effect.amount;
  return cost;
}

/** The turn that just resolved, re-derived from the saved clash so a reload shows it again. */
function resolvedTurn(round, encounter) {
  const turn = encounter.outcome === null ? encounter.turn - 1 : encounter.turn;
  return { turn, action: encounter.lastAction, intent: round.intents[turn - 1], kind: ACTIONS[encounter.lastAction].kind };
}
