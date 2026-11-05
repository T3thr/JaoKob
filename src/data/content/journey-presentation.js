/**
 * Journey presentation: the application's play view turned into what the screen shows
 * (UX §1.8, ADR-P0-034 D9.2). Text IDs become the package's words, asset IDs become images
 * from the media index, costs become pips and every accessible sentence is written here.
 * Nothing in this module decides a rule: availability, costs, the ซ้ำ warning, reasons and
 * the accepted commands come from Core through the view; this only names and places them.
 *
 * Modes the C4 screen does not draw yet (the tray, camp, micro-actions, pouch offers and the
 * ending choice belong to C5) are reported as `pending` so the host can say so.
 *
 * Trace: ADR-P0-034 D9/D10, ADR-P0-032 D7, UX §1.1–§1.10 · §2.1, Atomic 05 §3,
 * TC-S5-VN-001, TC-S5-HUD-001, TC-S5-A11Y-001.
 */

import { BONDS, BOND_MAX, METERS, METER_MAX } from "../../core/domain/journey/journey-rules.js";
import { deepFreeze } from "../validation/content-values.js";

/** Stage slots as a share of the stage width (UX §1.1, Atomic 05 §3.3). */
export const STAGE_SLOTS = Object.freeze({ "far-left": 12, left: 28, center: 50, right: 72, "far-right": 88 });

/** Icons of decision methods (UX §8.4); story choices and methods without a listed icon have none. */
const METHOD_ICON = Object.freeze({ alone: "foot", grit: "foot", rush: "advance" });
const SKILL_ICON = Object.freeze({ rain: "drop", wind: "jump", eye: "eye" });

/** Modes whose words the dialogue card shows; the rest wait for their C5 panel. */
const LINE_MODES = new Set(["VN", "CLASH_INTRO", "CLASH_INTENT", "CLASH_RESOLVE", "CLASH_OUTCOME"]);
const PENDING = Object.freeze({
  CLASH_CHOOSE: "clash", CAMP: "camp", MICRO: "micro", POUCH_SWAP: "pouch", ENDING_RESONANCE: "endings", BOUNDARY: "boundary", COMPLETE: "complete",
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
      return { nodeId: node.id, act: node.act, sceneKey: `boundary:${node.id}`, title: null, actLabel: messages.say.act(node.act), actTitle: acts.get(node.act)?.title ?? null, background: null, cg: null, actors: [], description: "" };
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
        const label = text(option.label).body;
        const reason = option.available ? null : messages.reasons[option.reason] ?? messages.reasons.unknown;
        const sentence = [label, tagText, option.homesick ? messages.say.repeat : null, messages.say.cost(pips.map((part) => [part.label, part.pips])), reason]
          .filter((part) => part !== null && part !== "").join(" · ");
        return {
          key: option.key,
          shortcut: index + 1,
          label,
          kind: option.kind,
          tag: tagText === null ? null : { kind: option.kind, text: tagText },
          repeat: option.homesick === true,
          repeatText: messages.tags.repeat,
          cost: pips,
          icon,
          keepsake,
          available: option.available === true,
          reason,
          description: sentence,
        };
      }),
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
