/**
 * Journey presentation: the application's play view turned into what the screen shows
 * (UX §1.8, ADR-P0-034 D9.2). Text IDs become the package's words, asset IDs become images
 * from the media index, costs become pips and every accessible sentence is written here.
 * Nothing in this module decides a rule: availability, costs, the ซ้ำ warning, reasons and
 * the accepted commands come from Core through the view; this only names and places them.
 *
 * Modes the screen does not draw yet (camp, micro-actions, pouch offers and the ending choice
 * arrive later in C5) are reported as `pending` so the host can say so. The clash is drawn
 * from C5a: intent badge, gauge, turn drops and the tray, all from Core's clash view.
 *
 * Trace: ADR-P0-034 D9/D10, ADR-P0-032 D7, UX §1.1–§1.10 · §2.1 · §3, Atomic 05 §3,
 * TC-S5-VN-001, TC-S5-HUD-001, TC-S5-A11Y-001, TC-S5-TRAY-001.
 */

import { BONDS, BOND_MAX, METERS, METER_MAX } from "../../core/domain/journey/journey-rules.js";
import { deepFreeze } from "../validation/content-values.js";

/** Stage slots as a share of the stage width (UX §1.1, Atomic 05 §3.3). */
export const STAGE_SLOTS = Object.freeze({ "far-left": 12, left: 28, center: 50, right: 72, "far-right": 88 });

/** Icons of decision methods (UX §8.4); story choices and methods without a listed icon have none. */
const METHOD_ICON = Object.freeze({ alone: "foot", grit: "foot", rush: "advance" });
const SKILL_ICON = Object.freeze({ rain: "drop", wind: "jump", eye: "eye" });
/** Clash card icons (UX §8.4): base moves, family skills and the finisher; the rest use faces or keepsakes. */
const ACTION_ICON = Object.freeze({ strike: "advance", grit: "advance", guard: "shield", rest: "wind", rain: "drop", wind: "jump", eye: "eye", hem: "hem" });
/** Faces on sibling, companion and combo cards (UX §3.3 ข้อ 6), from the delivered portraits. */
const SIBLING_FACE = Object.freeze({ kab: "char_jao_kab_neutral_proud", kib: "char_jao_kib_neutral_cheerful" });
const COMPANION_FACE = Object.freeze({ pkam: "char_pkam_neutral_guarded", fiw: "char_jao_fiw_neutral_lively", teuk: "char_jao_teuk_storm_kneeling" });
const CLASH_BEATS = Object.freeze({ CLASH_INTRO: "intro", CLASH_INTENT: "intent", CLASH_CHOOSE: "choose", CLASH_RESOLVE: "resolve", CLASH_OUTCOME: "outcome" });
const GROUPS = Object.freeze(["basic", "family", "friends", "pouch"]);

/** Modes whose words the dialogue card shows; the rest wait for their C5 panel. */
const LINE_MODES = new Set(["VN", "CLASH_INTRO", "CLASH_INTENT", "CLASH_RESOLVE", "CLASH_OUTCOME"]);
const PENDING = Object.freeze({
  CAMP: "camp", MICRO: "micro", POUCH_SWAP: "pouch", ENDING_RESONANCE: "endings", BOUNDARY: "boundary", COMPLETE: "complete",
});

/**
 * @param {{pkg: object, media: {image: Function}, messages: object}} options
 * `pkg` is an admitted package, `media` a Journey media index, `messages` TH_JOURNEY.
 */
export function createJourneyPresentation({ pkg, media, messages }) {
  const texts = new Map(pkg.texts.map((entry) => [entry.id, entry]));
  const characters = new Map(pkg.characters.map((entry) => [entry.id, entry.name]));
  const items = new Map(pkg.items.map((entry) => [entry.id, entry]));
  const acts = new Map(pkg.acts.map((entry) => [entry.act, entry]));

  const text = (id) => {
    const entry = texts.get(id);
    if (entry === undefined) throw new Error(`Text ${id} is not in the package`);
    return entry;
  };

  function hud(view) {
    const held = view.hud.pouch.held;
    return {
      act: view.hud.act,
      meters: METERS.map((id) => ({ id, label: messages.meters[id], value: view.hud.meters[id], max: METER_MAX, description: messages.say.meter(messages.meters[id], view.hud.meters[id], METER_MAX) })),
      bonds: BONDS.map((id) => ({ id, knots: view.hud.bonds[id].value, max: BOND_MAX, tier: view.hud.bonds[id].tier, description: messages.say.bond(messages.companions[id], view.hud.bonds[id].value) })),
      bondsLabel: messages.ui.bonds,
      pouch: {
        capacity: view.hud.pouch.capacity,
        used: held.length,
        slots: Array.from({ length: view.hud.pouch.capacity }, (_, index) => {
          const entry = held[index];
          if (entry === undefined) return null;
          const item = items.get(entry.item);
          return { item: entry.item, name: item?.name ?? entry.item, locked: entry.locked, ready: entry.ready, image: item === undefined ? null : media.image(item.icon) };
        }),
        description: messages.say.pouch(held.length, view.hud.pouch.capacity),
      },
    };
  }

  function scene(view, speakerId) {
    const node = view.node;
    if (node.boundary === true || node.stage === undefined) {
      return { nodeId: node.id, act: node.act, sceneKey: `boundary:${node.id}`, title: null, actLabel: messages.say.act(node.act), actTitle: acts.get(node.act)?.title ?? null, background: null, cg: null, showCg: false, actors: [], description: "" };
    }
    const stage = node.stage;
    const actors = (stage.slots ?? []).map((slot) => {
      const image = media.image(slot.asset, { facing: slot.facing });
      const characterId = image?.characterId ?? null;
      return {
        key: slot.slot,
        slot: slot.slot,
        x: STAGE_SLOTS[slot.slot],
        facing: slot.facing,
        image,
        characterId,
        name: characterId === null ? null : characters.get(characterId) ?? null,
        speaking: speakerId !== null && characterId === speakerId,
      };
    });
    return {
      nodeId: node.id,
      act: node.act,
      sceneKey: stage.bg ?? node.id,
      title: node.title,
      actLabel: messages.say.act(node.act),
      actTitle: acts.get(node.act)?.title ?? null,
      background: stage.bg === undefined ? null : media.image(stage.bg),
      cg: stage.cg === undefined ? null : media.image(stage.cg),
      // A clash node's CG comes after the clash (blueprint metadata): its outro lines.
      showCg: stage.cg !== undefined && node.type === "clash" && view.mode === "VN",
      actors,
      description: messages.say.onStage(actors.map((actor) => actor.name).filter((name) => name !== null)),
    };
  }

  function line(view) {
    if (view.line === null || view.line === undefined || !LINE_MODES.has(view.mode)) return null;
    const entry = text(view.line.text);
    const narrator = entry.speaker === "narrator";
    const speaker = narrator ? null : characters.get(entry.speaker) ?? null;
    return { textId: entry.id, speakerId: narrator ? null : entry.speaker, speaker, text: entry.body, announcement: messages.say.line(speaker, entry.body) };
  }

  function cost(raw) {
    return METERS.filter((meter) => Number.isInteger(raw?.[meter]) && raw[meter] > 0).map((meter) => ({ meter, label: messages.meters[meter], pips: raw[meter] }));
  }

  function decision(view) {
    if (view.mode !== "DECISION" || view.decision === undefined) return null;
    return {
      options: view.decision.options.map((option, index) => {
        const pips = cost(option.cost);
        const method = option.method ?? null;
        const tagText = option.kind === "combo"
          ? `${messages.tags.combo} · ${messages.companions[method?.ally] ?? ""}`.trim()
          : messages.tags[option.kind] ?? null;
        const icon = option.kind === "skill" ? SKILL_ICON[method?.skill] ?? null : METHOD_ICON[option.kind] ?? null;
        const itemId = method?.item;
        const keepsake = typeof itemId === "string" && items.has(itemId) ? media.image(items.get(itemId).icon) : null;
        const face = option.kind === "combo" || option.kind === "friend" ? faceOf(COMPANION_FACE[method?.ally]) : null;
        const label = text(option.label).body;
        const reason = option.available ? null : messages.reasons[option.reason] ?? messages.reasons.unknown;
        const sentence = [label, tagText, option.homesick ? messages.say.repeat : null, messages.say.cost(pips.map((part) => [part.label, part.pips])), reason]
          .filter((part) => part !== null && part !== "").join(" · ");
        return {
          key: option.key,
          shortcut: index + 1,
          label,
          kind: option.kind,
          tags: [tagText === null ? null : { kind: option.kind, text: tagText }, option.homesick === true ? { kind: "repeat", text: messages.tags.repeat } : null].filter((tag) => tag !== null),
          cost: pips,
          art: { icon, keepsake, face },
          available: option.available === true,
          reason,
          description: sentence,
        };
      }),
    };
  }

  const faceOf = (assetId) => (assetId === undefined ? null : media.image(assetId));
  const intentText = (id) => text(pkg.lexicon.intents[id]).body;

  function clashCard(card, labels, settings, index, group) {
    const label = text(labels[card.id]).body;
    const tags = [
      card.answers && settings.counterTags !== false ? { kind: "counter", text: messages.tags.counter } : null,
      card.homesick ? { kind: "repeat", text: messages.tags.repeat } : null,
      card.finisher ? { kind: "finisher", text: messages.tags.finisher } : null,
      card.combo ? { kind: "combo", text: `${messages.tags.combo} · ${messages.companions[card.ally] ?? ""}`.trim() } : null,
    ].filter((tag) => tag !== null).slice(0, 2);
    const keepsake = card.item !== undefined && items.has(card.item) ? media.image(items.get(card.item).icon) : null;
    const face = card.sibling !== undefined ? faceOf(SIBLING_FACE[card.sibling]) : card.ally !== undefined ? faceOf(COMPANION_FACE[card.ally]) : null;
    const pips = cost(card.cost);
    const sentence = [label, ...tags.map((tag) => tag.text), card.homesick ? messages.say.repeat : null, messages.say.cost(pips.map((part) => [part.label, part.pips]))]
      .filter((part) => part !== null && part !== "").join(" · ");
    return {
      key: card.id, shortcut: group === "basic" ? index + 1 : null, label, kind: card.kind, tags, cost: pips,
      art: { icon: keepsake === null && face === null ? ACTION_ICON[card.id] ?? null : null, keepsake, face },
      available: true, reason: null, description: sentence,
    };
  }

  function clash(view, settings) {
    const beat = CLASH_BEATS[view.mode];
    if (beat === undefined || view.clash === undefined) return null;
    const c = view.clash;
    const enemy = characters.get("char_cockroach_man") ?? "";
    const base = { round: c.round, beat, turns: c.turns, light: c.light, max: c.gauge.max, holdAt: c.gauge.holdAt, lightSource: c.lightSource, turn: c.turn ?? 1 };
    if (c.opening === true) return { ...base, intent: null, preview: [], groups: [], resolved: null, outcome: null, description: "" };
    // The resolve beat still shows the turn that just resolved; Core's turn has moved on.
    const intentName = beat === "resolve" && c.resolved !== undefined ? intentText(c.resolved.intent) : text(c.intentLabel).body;
    const notes = [c.intent.neutralized ? messages.clash.neutralized : null, c.intent.halved ? messages.clash.halved : null, c.intent.doubled ? messages.clash.doubled : null].filter((note) => note !== null);
    const resolved = beat === "resolve" && c.resolved !== undefined
      ? { turn: c.resolved.turn, label: text(c.labels[c.resolved.action]).body, answered: c.resolved.answered === true }
      : null;
    const groups = GROUPS.map((id) => ({ id, label: messages.groups[id], cards: c.groups[id].map((card, index) => clashCard(card, c.labels, settings, index, id)) }))
      .filter((group) => group.cards.length > 0)
      .map((group) => ({ ...group, marks: { counter: group.cards.some((card) => card.tags.some((tag) => tag.kind === "counter")), repeat: group.cards.some((card) => card.tags.some((tag) => tag.kind === "repeat")), combo: group.cards.some((card) => card.kind === "combo") } }));
    const counterIn = groups.filter((group) => group.marks.counter).map((group) => group.label);
    return {
      ...base,
      intent: beat === "outcome" ? null : { by: enemy, name: intentName, label: messages.clash.intent(enemy, intentName), notes: beat === "resolve" ? [] : notes, lastTurn: c.intent.lastTurn, answered: resolved?.answered ?? false },
      preview: beat === "choose" || beat === "intent" ? c.preview.map((entry) => ({ turn: entry.turn, name: intentText(entry.intent), neutralized: entry.neutralized })) : [],
      groups: beat === "choose" ? groups : [],
      resolved,
      outcome: beat === "outcome" && c.outcome !== null ? { kind: c.outcome, text: messages.clash.outcomes[c.outcome] } : null,
      description: beat === "choose" ? messages.clash.choose(intentName, counterIn) : "",
    };
  }

  function toasts(events, revision) {
    const result = [];
    for (const [index, event] of (events ?? []).entries()) {
      if (event.type === "meter") {
        result.push({ key: `${revision}:${index}`, kind: "meter", meter: event.meter, direction: event.to < event.from ? "down" : "up", text: messages.toast.meter(messages.meters[event.meter], event.to - event.from) });
      } else if (event.type === "keepsake" && event.change === "gained" && items.has(event.item)) {
        const item = items.get(event.item);
        result.push({ key: `${revision}:${index}`, kind: "keepsake", item: event.item, text: messages.toast.keepsake(item.name), image: media.image(item.icon) });
      }
    }
    return result;
  }

  return Object.freeze({
    /** The play screen. @param {object} appView A `playing` value of the Journey application. */
    present(appView) {
      if (appView?.phase !== "playing") throw new TypeError("present() takes a playing view of the Journey application");
      const view = appView.view;
      const current = line(view);
      return deepFreeze({
        phase: "playing",
        revision: view.revision,
        mode: view.mode,
        accepts: [...view.accepts],
        persistence: appView.persistence,
        settings: { ...appView.settings },
        hud: hud(view),
        scene: scene(view, current?.speakerId ?? null),
        line: current,
        decision: decision(view),
        clash: clash(view, appView.settings),
        pending: PENDING[view.mode] ?? null,
        toasts: toasts(appView.events, view.revision),
        notice: appView.notice === null || appView.notice === undefined ? null : { id: appView.notice, text: messages.notices[appView.notice] ?? messages.notices["save-failed"] },
      });
    },
    /** The notices of the title, in words. @param {object} titleView */
    notices(titleView) {
      return deepFreeze((titleView?.notices ?? []).map((id) => ({ id, text: messages.notices[id] ?? id })));
    },
  });
}
