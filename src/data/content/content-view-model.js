import { deepFreeze } from "../validation/content-values.js";
import { TH_APPLICATION as messages } from "../localization/th-application.js";

/** Localize pure presentation facts into a renderer-only immutable view. */
export function projectContentView({ loaded, snapshot, facts, settings, notice, feedbackActionId, meterChanges = [], mode, hasResume, memoryResume, confirmation, viewRevision }) {
  const locale = settings.locale ?? "th";
  const text = (localized) => localized?.[locale] ?? localized?.th ?? "";
  const indexes = loaded.indexes;
  const choices = [];
  const view = { locale, state: snapshot?.state ?? "Title", viewRevision, revision: snapshot?.revision ?? 0,
    confirmationRequired: mode === "replace-confirmation" || mode === "choice-confirmation",
    settings: { fontScale: settings.fontScale, reducedMotion: settings.reducedMotion },
    scene: { title: messages.title, dialogue: messages.introduction },
    meters: { hp: snapshot?.metrics.hp ?? loaded.catalog.defaults.metrics.hp, sanity: snapshot?.metrics.sanity ?? loaded.catalog.defaults.metrics.sanity, bond: { value: 0, visible: false } },
    choices, meterChanges, notice: notice ? { title: messages.saveTitle, text: notice } : undefined,
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
  } else if (!snapshot) {
    if (!notice) view.firstRunNotice = { title: messages.noticeTitle, text: messages.notice };
    if (hasResume) add("application.resume", memoryResume ? messages.resumeMemory : messages.resume);
    add("application.new-game", messages.newGame); add("application.settings", messages.settings);
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
        choices.push({ id: fact.id, label: text(action.label), disabled: !fact.eligible, unavailableReason: text(action.disabledReason) });
      }
    }
    const warnings = node.contentWarningIds.map((id) => indexes.warnings[id]);
    if (warnings.length) view.contentNotice = { title: warnings.map((warning) => text(warning.title)).join(" — "), text: warnings.map((warning) => text(warning.detail)).join("\n") };
    const action = indexes.choices[feedbackActionId] ?? indexes.interactions[feedbackActionId];
    if (action) view.feedback = text(action.immediateFeedback);
    add("application.settings", messages.settings);
  }
  return deepFreeze(view);
}
