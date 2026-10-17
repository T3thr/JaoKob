import { deepFreeze } from "../validation/content-values.js";
import { TH_APPLICATION as messages } from "../localization/th-application.js";
import { projectContentPresentation } from "./content-presentation.js";
import { projectKeepsakePouch } from "./keepsake-view-model.js";
import { projectSessionHistory, projectHistoryPassages } from "./history-projection.js";

/** Localize pure presentation facts into a renderer-only immutable view. */
export function projectContentView({ loaded, snapshot, facts, settings, notice, feedbackActionId, feedbackEventId = null, meterChanges = [], mode, hasResume, memoryResume, confirmation, viewRevision, audioStatus, mediaStatus,
  preferences = { hideContentAdvisory: false }, advisoryOpen = false, pouchOpen = false, pouchOpportunity = null, preferenceStatusText = "", focusSetting = null,
  sessionHistory = null, historyOpen = false, historyPresentationId = 0, feedbackNodeId = null }) {
  const locale = settings.locale ?? "th";
  const text = (localized) => localized?.[locale] ?? localized?.th ?? "";
  const indexes = loaded.indexes;
  const choices = [];
  const soundState = audioStatus === "unavailable" ? "unavailable" : settings.masterVolume === 0 ? "off" : audioStatus === "ready" ? "ready" : "blocked";
  const soundControlLabel = settings.masterVolume === 0 ? messages.soundOff : messages.soundOn;
  const view = { locale, state: snapshot?.state ?? "Title", viewRevision, revision: snapshot?.revision ?? 0,
    preferences: { ...preferences }, overlay: advisoryOpen ? "advisory" : pouchOpen ? "pouch" : historyOpen ? "history" : undefined, preferenceStatusText, focusSetting,
    history: projectSessionHistory(sessionHistory),
    pouch: projectKeepsakePouch({ pouch: snapshot?.pouch, opportunity: pouchOpportunity, locale, loaded }),
    contentAdvisory: { title: messages.noticeTitle, text: messages.notice },
    audioEnabled: settings.masterVolume > 0, soundState, soundControlLabel, soundStateLabel: messages[{ off: "soundOffShort", ready: "soundReadyShort", blocked: "soundBlockedShort", unavailable: "soundUnavailableShort" }[soundState]],
    confirmationRequired: mode === "replace-confirmation" || mode === "choice-confirmation",
    settings: { ...settings },
    ...(audioStatus ? { audioStatus, audioStatusText: soundState === "off" ? messages.soundOffDetail : messages[{ ready: "soundReady", blocked: "soundBlocked", unavailable: "soundUnavailable" }[audioStatus]] } : {}),
    ...(mediaStatus ? { mediaStatus, mediaStatusText: mediaStatus === "unavailable" ? messages.mediaUnavailable : "" } : {}),
    presentation: projectContentPresentation({ loaded, snapshot, facts, settings, mode }).visual,
    scene: { title: messages.title, dialogue: messages.introduction },
    meters: { hp: snapshot?.metrics.hp ?? loaded.catalog.defaults.metrics.hp, sanity: snapshot?.metrics.sanity ?? loaded.catalog.defaults.metrics.sanity,
      bond: snapshot ? { state: "locked", label: messages.bondLocked, accessibleLabel: messages.bondLockedDescription, icons: ["lotus", "lock"] } : { state: "hidden" } },
    feedbackEventId, readingBeatId: snapshot ? `${snapshot.sessionId}:${snapshot.currentNodeId}:${facts.cursor}` : null,
    choices, meterChanges: meterChanges.filter((change) => change.meter !== "bond").map((change) => ({ ...change })),
    notice: notice ? { title: messages.saveTitle, text: notice, kind: notice === messages.saved ? "saved" : notice === messages.recovered ? "resume" : "attention" } : undefined,
  };
  const add = (id, label) => choices.push({ id, label });
  if (mode === "replace-confirmation") {
    view.scene = { title: messages.newGameTitle, dialogue: messages.replaceDetail };
    add("application.cancel-replace", messages.cancel); add("application.confirm-replace", messages.replaceConfirm);
  } else if (mode === "choice-confirmation") {
    const choice = indexes.choices[confirmation.actionId];
    view.scene = { title: messages.choiceTitle, dialogue: [text(choice.label), text(choice.outcomePreview)].filter(Boolean).join("\n") };
    add("application.cancel-choice", messages.choiceCancel); add("application.confirm-choice", messages.choiceConfirm);
  } else if (mode === "settings") {
    view.scene = { title: messages.settings, dialogue: messages.settingsDescription };
    add("application.toggle-font", settings.fontScale > 1 ? messages.normalText : messages.largerText);
    add("application.toggle-motion", settings.reducedMotion ? messages.allowMotion : messages.reduceMotion);
    add("application.close-settings", messages.closeSettings);
    add("application.advisory", messages.advisoryOpen);
  } else if (!snapshot) {
    if (hasResume) add("application.resume", memoryResume ? messages.resumeMemory : messages.resume);
    add("application.new-game", messages.newGame); add("application.settings", messages.settings);
    add("application.history", messages.history);
    if (!preferences.hideContentAdvisory) add("application.advisory", messages.advisoryOpen);
  } else {
    const node = indexes.nodes[snapshot.currentNodeId], dialogue = indexes.dialogues[facts.dialogueId];
    view.scene = { title: text(node.title), dialogue: dialogue ? text(dialogue.text) : "",
      speaker: dialogue ? text(indexes.characters[dialogue.speakerCharacterId].name) : "",
      context: dialogue ? text(dialogue.accessibilityDescription) : "",
    };
    if (facts.pageCount > 1 && !facts.complete) view.scene.pageLabel = messages.pages.replace("{{current}}", String(facts.cursor + 1)).replace("{{total}}", String(facts.pageCount));
    if (facts.complete) {
      view.scene.dialogue = text(node.completion.message);
      add("application.finish", memoryResume ? messages.returnMemory : text(node.completion.actionLabel));
    } else {
      if (!facts.hasNextPage && node.type !== "cutscene") view.scene.dialogue = [view.scene.dialogue, text(node.prompt ?? node.description)].filter(Boolean).join("\n\n");
      if (facts.canAdvance) add("application.advance", node.completion && !facts.hasNextPage ? messages.finishReading : messages.advance);
      for (const fact of facts.actions) {
        const action = indexes.choices[fact.id] ?? indexes.interactions[fact.id];
        if (!fact.eligible && action.unavailableBehavior === "hidden") continue;
        const decoration = loaded.presentationCatalog?.choices[fact.id];
        choices.push({ id: fact.id, label: text(action.label), disabled: !fact.eligible, unavailableReason: text(action.disabledReason),
          ...(decoration ? { intentText: text(decoration.intent), iconName: decoration.icon, skin: decoration.skin, cue: text(action.outcomePreview) } : {}),
        });
      }
    }
    const warnings = node.contentWarningIds.map((id) => indexes.warnings[id]);
    if (warnings.length) view.contentAdvisory = { title: warnings.map((warning) => text(warning.title)).join(": "), text: warnings.map((warning) => text(warning.detail)).join("\n") };
    if (warnings.length && !preferences.hideContentAdvisory) add("application.advisory", messages.advisoryOpen);
    const action = indexes.choices[feedbackActionId] ?? indexes.interactions[feedbackActionId];
    if (action) view.feedback = text(action.immediateFeedback);
    add("application.settings", messages.settings);
    if (snapshot.pouch) add("application.pouch", messages.pouch);
    add("application.history", messages.history);
    if (mode === "game" && historyPresentationId > 0) view.reading = projectHistoryPassages({ loaded, snapshot, facts, settings,
      scene: view.scene, feedback: view.feedback, feedbackActionId, feedbackNodeId, presentationId: historyPresentationId });
  }
  if (advisoryOpen || pouchOpen || historyOpen) choices.length = 0;
  if (advisoryOpen) add("application.close-advisory", messages.advisoryClose);
  else if (pouchOpen) add("application.close-pouch", messages.closePouch);
  else if (historyOpen) add("application.close-history", messages.closeHistory);
  else if (!["replace-confirmation", "choice-confirmation"].includes(mode)) add("application.enable-sound", soundControlLabel);
  if (mediaStatus === "unavailable") add("application.retry-media", messages.mediaRetry);
  return deepFreeze(view);
}
