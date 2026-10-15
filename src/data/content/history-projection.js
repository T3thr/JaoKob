import { deepFreeze } from "../validation/content-values.js";
import { TH_HISTORY as messages } from "../localization/th-history.js";
import { TH_KEEPSAKES } from "../localization/th-keepsakes.js";

const localize = (value, locale) => value?.[locale] ?? value?.th ?? "";
function context(loaded, nodeId, locale) {
  const node = loaded.indexes.nodes[nodeId];
  if (!node) throw new TypeError("HISTORY_CONTEXT");
  // Published 2.1 nodes are the scene-context identities; no separate scene ID.
  return { nodeId, sceneId: node.id, sceneLabel: localize(node.title, locale), locale };
}

/** Project only a successfully committed command, using its original context.
 * A story collect/refuse is already represented by its chosen story label.
 */
export function projectHistoryAction({ loaded, snapshot, settings, actionId, pouchCommand }) {
  const locale = settings.locale ?? "th";
  const base = { ...context(loaded, snapshot.currentNodeId, locale), speakerId: "player", speakerLabel: messages.player, voiceRole: "player" };
  if (pouchCommand) {
    const item = TH_KEEPSAKES[pouchCommand.itemId], oldItem = TH_KEEPSAKES[pouchCommand.oldItemId];
    const template = messages[pouchCommand.action];
    if (!item || typeof template !== "string" || (pouchCommand.action === "replace" && !oldItem)) throw new TypeError("HISTORY_ACTION");
    return deepFreeze({ kind: "keepsake-action", record: { ...base, sourceId: pouchCommand.opportunityId,
      text: template.replace("{{item}}", item.name).replace("{{oldItem}}", oldItem?.name ?? "") } });
  }
  const action = loaded.indexes.choices[actionId] ?? loaded.indexes.interactions[actionId];
  if (!action) throw new TypeError("HISTORY_ACTION");
  return deepFreeze({ kind: loaded.indexes.choices[actionId] ? "choice" : "interaction", record: { ...base, sourceId: actionId, text: localize(action.label, locale) } });
}

/** Resolve candidates, not transcript entries. UI acknowledges displayed prefixes.
 * The current scene includes its approved final prompt exactly as presented.
 */
export function projectHistoryPassages({ loaded, snapshot, facts, settings, scene, feedback, feedbackActionId, feedbackNodeId, presentationId }) {
  const locale = settings.locale ?? "th", parts = [];
  if (feedback) parts.push({ id: "feedback", ...context(loaded, feedbackNodeId, locale), sourceId: feedbackActionId,
    speakerId: "narrator", speakerLabel: messages.narrator, voiceRole: "response", text: feedback });
  const dialogue = loaded.indexes.dialogues[facts.dialogueId], speaker = loaded.indexes.characters[dialogue?.speakerCharacterId];
  if (scene.dialogue) parts.push({ id: "scene", ...context(loaded, snapshot.currentNodeId, locale), sourceId: facts.dialogueId ?? snapshot.currentNodeId,
    speakerId: speaker?.id ?? "narrator", speakerLabel: scene.speaker || messages.narrator,
    voiceRole: facts.complete ? "completion" : dialogue?.tags?.includes("role.thought") ? "inner-voice" : speaker?.narrativeRole === "narrator" ? "narration" : "speech",
    text: scene.dialogue });
  return deepFreeze({ id: presentationId, parts });
}

/** Frozen view-only archive. Sort a copy; never reinterpret saved decision history. */
export function projectSessionHistory(history) {
  const ordered = history ? [...history.dialogues, ...history.actions].sort((a, b) => a.sequence - b.sequence) : [];
  return deepFreeze({ ...messages, note: history?.continued ? messages.continuedNote : messages.sessionNote,
    entries: ordered.map((entry, index) => ({ ...entry,
      contextStart: index === 0 || ordered[index - 1].nodeId !== entry.nodeId || (entry.returning && ordered[index - 1].visit !== entry.visit),
      voiceLabel: messages[entry.voiceRole], kindLabel: entry.kind === "dialogue" ? messages[entry.voiceRole] : messages.chosen,
    })) });
}
