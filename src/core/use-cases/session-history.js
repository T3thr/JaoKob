/** Session-only transcript. FR-ENG-009 / GDD-UX-006 / CR-0005 D3.
 * No snapshot, clock, storage or rendering dependency. Invalid events are no-ops.
 * Each buffer independently retains 50 occurrences; sequence orders their merge.
 */
export const SESSION_HISTORY_LIMIT = 50;
export const SESSION_HISTORY_BUDGET = 8 * 1024 * 1024;
const PARTS = ["feedback", "scene"];
const ACTIONS = ["choice", "interaction", "keepsake-action"];
const VOICES = ["speech", "narration", "inner-voice", "response", "completion", "player"];
const string = (value, maximum) => typeof value === "string" && value.trim().length > 0 && value.length <= maximum;
const integer = value => Number.isSafeInteger(value) && value > 0 && value < Number.MAX_SAFE_INTEGER;
const freeze = value => {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.values(value).forEach(freeze); Object.freeze(value);
  }
  return value;
};

/** Start a fresh immutable reading session; invalid identity throws TypeError.
 * @param {{sessionId:string, contentVersion:string, continued?:boolean}} input
 * @returns {Readonly<object>} Separate from every durable domain/save object.
 */
export function createSessionHistory({ sessionId, contentVersion, continued = false }) {
  if (!string(sessionId, 96) || !string(contentVersion, 96) || typeof continued !== "boolean") throw new TypeError("INVALID_SESSION_HISTORY");
  return freeze({ sessionId, contentVersion, continued, nextSequence: 1, presentationId: 0, visit: 0,
    returning: false, lastActionRevision: 0, dialogues: [], actions: [] });
}

function record(value, maxText) {
  if (!value || !["nodeId", "sceneId", "sourceId", "speakerId"].every(key => string(value[key], 96))
    || !string(value.locale, 35) || !string(value.text, maxText)
    || !string(value.sceneLabel, 240) || !string(value.speakerLabel, 240) || !VOICES.includes(value.voiceRole)) return null;
  return Object.fromEntries(["nodeId", "sceneId", "sourceId", "speakerId", "locale", "text", "sceneLabel", "speakerLabel", "voiceRole"].map(key => [key, value[key]]));
}

/** Reduce only accepted application events. Unknown/rejected/malformed events,
 * stale receipts and duplicate commits return the exact original reference.
 * DIALOGUE_PRESENTED may extend a displayed prefix, never revise old prose.
 * @param {Readonly<object>} history Value created by createSessionHistory.
 * @param {object} event PRESENTATION_STARTED, ACTION_COMMITTED or DIALOGUE_PRESENTED.
 * @returns {Readonly<object>} Deeply frozen session value, with bounded buffers.
 */
export function reduceSessionHistory(history, event) {
  if (!event || !history) return history;
  if (event.type === "PRESENTATION_STARTED") {
    if (!integer(event.presentationId) || event.presentationId <= history.presentationId || !integer(history.visit + 1)
      || (event.returning !== undefined && typeof event.returning !== "boolean")) return history;
    return freeze({ ...history, presentationId: event.presentationId, visit: history.visit + 1, returning: event.returning === true });
  }
  if (!integer(history.nextSequence)) return history;
  if (event.type === "ACTION_COMMITTED") {
    if (!ACTIONS.includes(event.kind) || !integer(event.revision) || event.revision <= history.lastActionRevision) return history;
    const value = record(event.record, 1000);
    if (!value || value.voiceRole !== "player") return history;
    const entry = { ...value, kind: event.kind, revision: event.revision, sessionId: history.sessionId, contentVersion: history.contentVersion,
      entryId: `${history.sessionId}:${history.nextSequence}`, sequence: history.nextSequence, visit: history.visit, returning: false };
    return freeze({ ...history, lastActionRevision: event.revision, nextSequence: history.nextSequence + 1,
      actions: [...history.actions, entry].slice(-SESSION_HISTORY_LIMIT) });
  }
  if (event.type !== "DIALOGUE_PRESENTED" || !integer(event.presentationId) || event.presentationId !== history.presentationId || !PARTS.includes(event.part)) return history;
  const value = record(event.record, 24000);
  if (!value || value.voiceRole === "player") return history;
  const prior = history.dialogues.find(entry => entry.presentationId === event.presentationId && entry.part === event.part);
  if (prior) {
    if (value.text.length <= prior.text.length || !value.text.startsWith(prior.text)
      || Object.keys(value).some(key => key !== "text" && value[key] !== prior[key])) return history;
    return freeze({ ...history, dialogues: history.dialogues.map(entry => entry === prior ? { ...prior, text: value.text } : entry) });
  }
  const entry = { ...value, kind: "dialogue", presentationId: event.presentationId, part: event.part,
    sessionId: history.sessionId, contentVersion: history.contentVersion, entryId: `${history.sessionId}:${history.nextSequence}`,
    sequence: history.nextSequence, visit: history.visit, returning: history.returning };
  return freeze({ ...history, nextSequence: history.nextSequence + 1, dialogues: [...history.dialogues, entry].slice(-SESSION_HISTORY_LIMIT) });
}
