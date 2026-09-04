import { RENDERER_ERROR_CODES } from "../../../core/ports/renderer-port.js";
import { TH_SYSTEM_MESSAGES } from "../../localization/th-system-messages.js";

/**
 * Semantic DOM implementation of RendererPort.
 *
 * The adapter accepts already-localized immutable view models, constructs only
 * safe DOM nodes, and sends semantic UI intents to an injected application
 * callback. It never imports persistence code, reads browser storage, or
 * mutates a domain snapshot.
 *
 * Trace: FR-UI-001..FR-UI-007, FR-ACC-001..FR-ACC-004, NFR-US-005,
 * NFR-SE-003, NFR-MA-001, NFR-PO-003, ADR-P0-001, ADR-P0-005.
 */

const METER_MAX = 100;
const METER_DEFINITIONS = Object.freeze([
  Object.freeze({ name: "hp", icon: "♥", labelKey: "meter.hp" }),
  Object.freeze({ name: "sanity", icon: "◌", labelKey: "meter.sanity" }),
  Object.freeze({ name: "bond", icon: "∞", labelKey: "meter.bond" }),
]);

const FATAL_CONTENT_CODES = new Set([
  "CONTENT_PARSE",
  "CONTENT_SCHEMA",
  "CONTENT_REFERENCE",
  "CONTENT_VERSION",
  "CONTENT_CAPABILITY",
  "CONTENT_LOAD",
  "CONTENT_ORIGIN",
]);

const FATAL_STORAGE_CODES = new Set([
  "SAVE_PARSE",
  "SAVE_SCHEMA",
  "SAVE_MIGRATION",
  "STORAGE_UNAVAILABLE",
  "STORAGE_QUOTA",
]);

/**
 * @typedef {object} DomRendererOptions
 * @property {Element} root Element that owns this renderer's isolated DOM tree.
 * @property {Document} [document] Injectable DOM document for tests or hosts.
 * @property {(intent: Readonly<Record<string, unknown>>) => void} [onIntent]
 * Receives semantic UI intent only; application code owns command handling.
 * @property {Readonly<Record<string, string>>} [messages]
 * Optional localized chrome overrides. Missing keys fall back to Thai.
 */

/**
 * Create a synchronous, semantic DOM RendererPort implementation.
 *
 * A malformed host element is converted to a typed failure by each port
 * operation rather than throwing across the renderer boundary.
 *
 * @param {DomRendererOptions | Element} optionsOrRoot
 * @returns {Readonly<import("../../../core/ports/renderer-port.js").RendererPort>}
 */
export function createDomRenderer(optionsOrRoot) {
  const options = normalizeOptions(optionsOrRoot);
  const root = options.root;
  const configuredDocument = options.document;
  const onIntent = typeof options.onIntent === "function" ? options.onIntent : () => {};
  const messages = isRecord(options.messages) ? options.messages : {};

  let busy = false;
  let scaffold = null;
  let references = emptyReferences();

  function render(viewModel) {
    return perform("render", () => {
      assertRecord(viewModel, "View model must be an object.");
      const activeScaffold = ensureScaffold();
      const built = buildGameShell(activeScaffold.document, viewModel, messages, emitIntent);
      root.setAttribute("data-reduced-motion", viewModel.settings?.reducedMotion === true ? "true" : "false");
      const scale = viewModel.settings?.fontScale;
      root.style.fontSize = `${typeof scale === "number" && scale >= 1 && scale <= 2 ? scale * 100 : 100}%`;
      if (viewModel.viewRevision !== undefined) root.setAttribute("data-view-revision", String(viewModel.viewRevision));
      activeScaffold.content.replaceChildren(built.element);
      references = built.references;
      applyBusyState(activeScaffold, references, busy);
    });
  }

  function setBusy(nextBusy) {
    return perform("setBusy", () => {
      if (typeof nextBusy !== "boolean") {
        throw new TypeError("Busy state must be a boolean.");
      }
      busy = nextBusy;
      const activeScaffold = ensureScaffold();
      applyBusyState(activeScaffold, references, busy);
    });
  }

  function announce(status) {
    return perform("announce", () => {
      const activeScaffold = ensureScaffold();
      activeScaffold.liveRegion.textContent = readStatusText(status, messages);
    });
  }

  function applyFocusDirective(directive) {
    return perform("applyFocusDirective", () => {
      assertRecord(directive, "Focus directive must be an object.");
      ensureScaffold();
      const target = resolveFocusTarget(directive, references);
      if (target === null) {
        throw new RendererFocusError("FOCUS_TARGET_NOT_FOUND");
      }
      if (typeof target.focus !== "function") {
        throw new RendererFocusError("FOCUS_NOT_SUPPORTED");
      }
      target.focus();
    });
  }

  function showFatalShell(failure) {
    return perform("showFatalShell", () => {
      assertRecord(failure, "Fatal failure must be an object.");
      busy = false;
      const activeScaffold = ensureScaffold();
      const built = buildFatalShell(activeScaffold.document, failure, messages, emitIntent);
      activeScaffold.content.replaceChildren(built.element);
      references = built.references;
      applyBusyState(activeScaffold, references, false);

      if (typeof built.references.fatal?.focus === "function") {
        built.references.fatal.focus();
      }
    });
  }

  function emitIntent(intent) {
    onIntent(Object.freeze({ ...intent }));
  }

  function ensureScaffold() {
    if (!isDomContainer(root)) {
      throw new TypeError("Renderer root must support DOM child and attribute operations.");
    }

    const document = resolveDocument(configuredDocument, root);
    if (
      scaffold !== null
      && scaffold.root === root
      && scaffold.document === document
      && scaffold.content.parentNode === root
      && scaffold.liveRegion.parentNode === root
    ) {
      return scaffold;
    }

    addClasses(root, "jk-app");
    root.setAttribute("aria-busy", busy ? "true" : "false");

    const content = createElement(document, "div", {
      classNames: ["jk-app-content"],
      attributes: { "data-jk-role": "content" },
    });
    const liveRegion = createElement(document, "p", {
      classNames: ["jk-visually-hidden"],
      attributes: {
        "data-jk-role": "live-region",
        role: "status",
        "aria-live": "polite",
        "aria-atomic": "true",
      },
    });
    root.replaceChildren(content, liveRegion);
    scaffold = Object.freeze({ root, document, content, liveRegion });
    return scaffold;
  }

  return Object.freeze({
    render,
    setBusy,
    announce,
    applyFocusDirective,
    showFatalShell,
  });
}

function buildGameShell(document, viewModel, messages, emitIntent) {
  const shell = createElement(document, "div", {
    classNames: ["jk-app-shell", "jk-scene-enter"],
    attributes: {
      "data-jk-role": "game-shell",
      lang: readLocale(viewModel),
    },
  });
  const references = emptyReferences();
  const scene = readScene(viewModel);

  const hud = createElement(document, "header", {
    classNames: ["jk-hud"],
    attributes: {
      "data-jk-role": "hud",
      "aria-label": message(messages, "hud.label"),
    },
  });
  const sceneLabel = createElement(document, "p", {
    classNames: ["jk-eyebrow"],
    text: message(messages, "scene.label"),
  });
  const sceneTitle = createElement(document, "h1", {
    classNames: ["jk-scene-title"],
    text: scene.title || message(messages, "app.name"),
  });
  hud.append(sceneLabel, sceneTitle, buildMeterList(document, viewModel, messages));
  shell.append(hud);

  const story = createElement(document, "main", {
    classNames: ["jk-story"],
    attributes: {
      "data-jk-role": "dialogue",
      tabindex: "-1",
      "aria-label": message(messages, "story.label"),
    },
  });
  const narrative = createElement(document, "article", {
    classNames: ["jk-narrative"],
  });

  const contentNotice = buildFirstRunNotice(document, { notice: viewModel.contentNotice }, messages);
  if (contentNotice !== null) {
    contentNotice.setAttribute("data-jk-role", "content-notice");
    narrative.append(contentNotice);
  }
  const feedback = buildFeedback(document, viewModel, messages);
  if (feedback !== null) narrative.append(feedback);
  if (scene.pageLabel) narrative.append(createElement(document, "p", {
    classNames: ["jk-page-label"], attributes: { "data-jk-role": "page-label" }, text: scene.pageLabel,
  }));
  if (scene.context) narrative.append(createElement(document, "p", {
    classNames: ["jk-visually-hidden"], text: scene.context,
  }));

  if (scene.speaker) {
    const speaker = createElement(document, "p", {
      classNames: ["jk-speaker"],
      attributes: { "data-jk-role": "speaker" },
    });
    const speakerLabel = createElement(document, "span", {
      classNames: ["jk-visually-hidden"],
      text: `${message(messages, "speaker.label")}: `,
    });
    const speakerName = createElement(document, "strong", { text: scene.speaker });
    speaker.append(speakerLabel, speakerName);
    narrative.append(speaker);
  }

  const dialogue = createElement(document, "p", {
    classNames: ["jk-dialogue"],
    attributes: { "data-jk-role": "dialogue-text", id: "jk-current-dialogue" },
    text: scene.dialogue,
  });
  narrative.append(dialogue);

  const firstRunNotice = buildFirstRunNotice(document, viewModel, messages);
  if (firstRunNotice !== null) narrative.append(firstRunNotice);

  const cutscene = buildCutsceneControls(document, viewModel, messages, emitIntent);
  if (cutscene !== null) narrative.append(cutscene);

  const gameOver = buildGameOverPanel(document, viewModel, messages, emitIntent);
  if (gameOver !== null) narrative.append(gameOver);

  story.append(narrative);
  shell.append(story);
  references.dialogue = story;

  const choices = buildChoices(document, viewModel, messages, emitIntent);
  if (choices !== null) {
    shell.append(choices.element);
    references.choiceList = choices.list;
    references.choiceButtons = choices.buttons;
  }

  return Object.freeze({ element: shell, references: Object.freeze(references) });
}

function buildMeterList(document, viewModel, messages) {
  const list = createElement(document, "dl", {
    classNames: ["jk-meter-list"],
    attributes: {
      "data-jk-role": "meters",
      "aria-label": message(messages, "hud.label"),
    },
  });

  for (const definition of METER_DEFINITIONS) {
    const meter = readMeter(viewModel, definition.name);
    if (meter === null || meter.visible === false) continue;

    const label = message(messages, definition.labelKey);
    const value = normalizeMeterValue(meter.value);
    const item = createElement(document, "div", {
      classNames: ["jk-meter"],
      attributes: { "data-jk-meter": definition.name },
    });
    const term = createElement(document, "dt", { classNames: ["jk-meter-label"] });
    const icon = createElement(document, "span", {
      classNames: ["jk-meter-icon"],
      attributes: { "aria-hidden": "true" },
      text: definition.icon,
    });
    const labelText = createElement(document, "span", { text: label });
    term.append(icon, labelText);

    const description = createElement(document, "dd", {
      classNames: ["jk-meter-value"],
    });
    const progress = createElement(document, "div", {
      classNames: ["jk-meter-track"],
      attributes: {
        role: "progressbar",
        "aria-valuemin": "0",
        "aria-valuemax": String(METER_MAX),
        "aria-valuenow": String(value),
        "aria-label": label,
        "aria-valuetext": formatMessage(message(messages, "meter.value"), {
          label,
          value,
          max: METER_MAX,
        }),
      },
    });
    const fill = createElement(document, "span", {
      classNames: ["jk-meter-fill"],
      attributes: { "data-jk-meter-fill": definition.name },
    });
    fill.style.inlineSize = `${value}%`;
    const numeric = createElement(document, "strong", {
      classNames: ["jk-meter-number"],
      text: `${value}/${METER_MAX}`,
    });
    progress.append(fill);
    description.append(progress, numeric);
    item.append(term, description);
    list.append(item);
  }

  return list;
}

function buildFeedback(document, viewModel, messages) {
  const feedbackText = readFeedbackText(viewModel);
  const changes = Array.isArray(viewModel.meterChanges) ? viewModel.meterChanges : [];
  if (!feedbackText && changes.length === 0) return null;

  const section = createElement(document, "section", {
    classNames: ["jk-feedback"],
    attributes: {
      "data-jk-role": "feedback",
      "aria-label": message(messages, "feedback.label"),
    },
  });

  if (feedbackText) {
    section.append(createElement(document, "p", {
      classNames: ["jk-feedback-copy"],
      text: feedbackText,
    }));
  }

  if (changes.length > 0) {
    const list = createElement(document, "ul", { classNames: ["jk-meter-changes"] });
    for (const change of changes) {
      const rendered = buildMeterChange(document, change, messages);
      if (rendered !== null) list.append(rendered);
    }
    if (list.children.length > 0) section.append(list);
  }

  return section;
}

function buildFirstRunNotice(document, viewModel, messages) {
  const notice = isRecord(viewModel.firstRunNotice)
    ? viewModel.firstRunNotice
    : isRecord(viewModel.notice)
      ? viewModel.notice
      : null;
  if (notice === null) return null;

  const entries = Array.isArray(notice.items) ? notice.items : [];
  const body = readString(notice.text) || readString(notice.description);
  if (!body && entries.length === 0) return null;

  const section = createElement(document, "aside", {
    classNames: ["jk-first-run-notice"],
    attributes: {
      "data-jk-role": "first-run-notice",
      "aria-label": readString(notice.title) || message(messages, "firstRun.label"),
    },
  });
  section.append(createElement(document, "h2", {
    classNames: ["jk-section-title"],
    text: readString(notice.title) || message(messages, "firstRun.label"),
  }));
  if (body) section.append(createElement(document, "p", { text: body }));
  if (entries.length > 0) {
    const list = createElement(document, "ul", { classNames: ["jk-first-run-list"] });
    for (const entry of entries) {
      const text = readLogEntry(entry);
      if (text) list.append(createElement(document, "li", { text }));
    }
    if (list.children.length > 0) section.append(list);
  }
  return section;
}

function buildMeterChange(document, change, messages) {
  if (!isRecord(change) || typeof change.meter !== "string") return null;
  const definition = METER_DEFINITIONS.find((item) => item.name === change.meter);
  if (definition === undefined) return null;

  const delta = typeof change.delta === "number" && Number.isFinite(change.delta)
    ? Math.trunc(change.delta)
    : 0;
  const label = message(messages, definition.labelKey);
  const direction = delta > 0 ? "positive" : delta < 0 ? "negative" : "neutral";
  const text = readString(change.text)
    || formatMessage(message(messages, `meter.change.${direction}`), {
      label,
      amount: Math.abs(delta),
    });
  const item = createElement(document, "li", {
    classNames: ["jk-meter-change"],
    attributes: { "data-direction": direction },
  });
  const symbol = createElement(document, "span", {
    classNames: ["jk-meter-change-symbol"],
    attributes: { "aria-hidden": "true" },
    text: delta > 0 ? "+" : delta < 0 ? "−" : "•",
  });
  const copy = createElement(document, "span", { text });
  item.append(symbol, copy);
  return item;
}

function buildCutsceneControls(document, viewModel, messages, emitIntent) {
  const cutscene = isRecord(viewModel.cutscene) ? viewModel.cutscene : null;
  if (cutscene === null) return null;

  const section = createElement(document, "section", {
    classNames: ["jk-cutscene-controls"],
    attributes: {
      "data-jk-role": "cutscene-controls",
      "aria-label": message(messages, "cutscene.label"),
    },
  });
  const log = Array.isArray(cutscene.log) ? cutscene.log : [];
  if (log.length > 0) {
    section.append(createElement(document, "h2", {
      classNames: ["jk-section-title"],
      text: message(messages, "cutscene.log"),
    }));
    const list = createElement(document, "ol", { classNames: ["jk-cutscene-log"] });
    for (const entry of log) {
      const text = readLogEntry(entry);
      if (text) list.append(createElement(document, "li", { text }));
    }
    if (list.children.length > 0) section.append(list);
  }

  const controls = createElement(document, "div", { classNames: ["jk-cutscene-actions"] });
  const paused = cutscene.paused === true;
  controls.append(createIntentButton(
    document,
    paused ? message(messages, "cutscene.resume") : message(messages, "cutscene.pause"),
    "toggle-cutscene-pause",
    () => emitIntent({ type: "TOGGLE_CUTSCENE_PAUSE", paused: !paused }),
  ));

  const speedField = createElement(document, "label", { classNames: ["jk-cutscene-speed"] });
  speedField.append(createElement(document, "span", { text: message(messages, "cutscene.speed") }));
  const speed = createElement(document, "select", {
    attributes: { "data-jk-role": "cutscene-speed" },
  });
  const selectedSpeed = ["slow", "normal", "fast"].includes(cutscene.textSpeed)
    ? cutscene.textSpeed
    : "normal";
  for (const speedValue of ["slow", "normal", "fast"]) {
    const option = createElement(document, "option", {
      attributes: { value: speedValue },
      text: message(messages, `cutscene.speed.${speedValue}`),
    });
    if (speedValue === selectedSpeed) option.selected = true;
    speed.append(option);
  }
  speed.value = selectedSpeed;
  speed.addEventListener("change", () => {
    emitIntent({ type: "SET_CUTSCENE_TEXT_SPEED", speed: speed.value });
  });
  speedField.append(speed);
  controls.append(speedField);

  const typewriterLabel = createElement(document, "label", {
    classNames: ["jk-cutscene-toggle"],
  });
  const typewriter = createElement(document, "input", {
    attributes: { type: "checkbox", "data-jk-role": "typewriter-toggle" },
  });
  typewriter.checked = cutscene.typewriterEnabled !== false;
  typewriter.addEventListener("change", () => {
    emitIntent({ type: "SET_TYPEWRITER", enabled: typewriter.checked === true });
  });
  typewriterLabel.append(typewriter, createElement(document, "span", {
    text: message(messages, "cutscene.typewriter"),
  }));
  controls.append(typewriterLabel);

  if (cutscene.canSkip === true) {
    controls.append(createIntentButton(
      document,
      message(messages, "cutscene.skip"),
      "skip-cutscene",
      () => emitIntent({ type: "SKIP_CUTSCENE" }),
    ));
  }
  section.append(controls);
  return section;
}

function buildGameOverPanel(document, viewModel, messages, emitIntent) {
  if (viewModel.state !== "GameOver" && viewModel.mode !== "game-over") return null;

  const gameOver = isRecord(viewModel.gameOver) ? viewModel.gameOver : {};
  const section = createElement(document, "section", {
    classNames: ["jk-game-over"],
    attributes: {
      "data-jk-role": "game-over",
      "aria-label": message(messages, "gameOver.label"),
    },
  });
  section.append(
    createElement(document, "h2", {
      text: readString(gameOver.title) || message(messages, "gameOver.title"),
    }),
    createElement(document, "p", {
      text: readString(gameOver.description) || message(messages, "gameOver.description"),
    }),
  );

  const actions = createElement(document, "div", { classNames: ["jk-game-over-actions"] });
  actions.append(
    createIntentButton(document, message(messages, "gameOver.retry"), "retry", () => {
      emitIntent({ type: "RETRY_FROM_CHECKPOINT" });
    }),
    createIntentButton(document, message(messages, "gameOver.storyAssist"), "story-assist", () => {
      emitIntent({ type: "OPEN_STORY_ASSIST" });
    }),
    createIntentButton(document, message(messages, "gameOver.settings"), "settings", () => {
      emitIntent({ type: "OPEN_SETTINGS" });
    }),
    createIntentButton(document, message(messages, "gameOver.titleAction"), "return-title", () => {
      emitIntent({ type: "RETURN_TO_TITLE" });
    }),
  );
  section.append(actions);
  return section;
}

function buildChoices(document, viewModel, messages, emitIntent) {
  if (!Array.isArray(viewModel.choices)) return null;

  const section = createElement(document, "nav", {
    classNames: ["jk-choice-area"],
    attributes: {
      "data-jk-role": "choices",
      "aria-label": message(messages, "choices.label"),
    },
  });
  const list = createElement(document, "ol", {
    classNames: ["jk-choice-list"],
    attributes: { "data-jk-role": "choice-list", tabindex: "-1" },
  });
  const buttons = [];

  for (const choice of viewModel.choices) {
    if (!isRecord(choice)) continue;
    const label = readString(choice.label) || readString(choice.text) || message(messages, "choice.unavailable");
    const disabled = choice.disabled === true || choice.available === false;
    const item = createElement(document, "li", { classNames: ["jk-choice-item"] });
    const button = createElement(document, "button", {
      classNames: ["jk-choice-button"],
      attributes: {
        type: "button",
        "data-jk-role": "choice",
      },
      text: label,
    });
    const choiceId = readString(choice.id);
    if (choiceId) button.setAttribute("data-choice-id", choiceId);
    if (viewModel.confirmationRequired === true) button.setAttribute("aria-describedby", "jk-current-dialogue");
    button.disabled = disabled;
    button.setAttribute("aria-disabled", disabled ? "true" : "false");
    button.addEventListener("click", () => {
      if (button.disabled || !choiceId) return;
      emitIntent({ type: "SELECT_CHOICE", choiceId,
        ...(viewModel.viewRevision === undefined ? {} : { viewRevision: viewModel.viewRevision, expectedRevision: viewModel.revision }),
      });
    });
    item.append(button);

    const unavailableReason = readString(choice.unavailableReason) || readString(choice.reason);
    if (disabled && unavailableReason) {
      const reasonId = `jk-choice-reason-${buttons.length + 1}`;
      const reason = createElement(document, "p", {
        classNames: ["jk-choice-reason"],
        attributes: { id: reasonId },
        text: unavailableReason,
      });
      button.setAttribute("aria-describedby", reasonId);
      item.append(reason);
    }

    list.append(item);
    buttons.push(Object.freeze({ element: button, disabled }));
  }

  section.append(list);
  return Object.freeze({ element: section, list, buttons: Object.freeze(buttons) });
}

function buildFatalShell(document, failure, messages, emitIntent) {
  const fatal = createElement(document, "section", {
    classNames: ["jk-fatal-shell"],
    attributes: {
      "data-jk-role": "fatal-shell",
      role: "alert",
      tabindex: "-1",
      "aria-label": message(messages, "fatal.label"),
    },
  });
  const code = readString(failure.code);
  fatal.append(
    createElement(document, "h1", { text: message(messages, "fatal.title") }),
    createElement(document, "p", { text: fatalMessageFor(code, messages) }),
    createIntentButton(document, message(messages, "fatal.retry"), "retry-render", () => {
      emitIntent({ type: "RETRY_RENDER" });
    }),
    createIntentButton(document, message(messages, "fatal.reload"), "reload-application", () => {
      emitIntent({ type: "RELOAD_APPLICATION" });
    }),
  );
  const references = emptyReferences();
  references.fatal = fatal;
  return Object.freeze({ element: fatal, references: Object.freeze(references) });
}

function createIntentButton(document, text, action, listener) {
  const button = createElement(document, "button", {
    classNames: ["jk-secondary-button"],
    attributes: { type: "button", "data-jk-action": action },
    text,
  });
  button.addEventListener("click", listener);
  return button;
}

function applyBusyState(scaffold, references, busy) {
  scaffold.root.setAttribute("aria-busy", busy ? "true" : "false");
  for (const record of references.choiceButtons) {
    const disabled = busy || record.disabled;
    record.element.disabled = disabled;
    record.element.setAttribute("aria-disabled", disabled ? "true" : "false");
  }
}

function resolveFocusTarget(directive, references) {
  const targetName = readString(directive.target)
    || readString(directive.targetId)
    || readString(directive.focus);
  switch (targetName) {
    case "first-choice":
    case "firstChoice":
    case "choice-list":
    case "choices":
      return references.choiceButtons.find((record) => !record.element.disabled)?.element
        || references.choiceList
        || null;
    case "dialogue":
    case "story":
    case "narrative":
      return references.dialogue;
    case "fatal":
    case "fatal-shell":
      return references.fatal;
    default:
      return null;
  }
}

function readScene(viewModel) {
  const scene = isRecord(viewModel.scene) ? viewModel.scene : {};
  const dialogue = readString(viewModel.dialogue)
    || readString(scene.dialogue)
    || readString(isRecord(viewModel.dialogue) ? viewModel.dialogue.text : undefined);
  return Object.freeze({
    title: readString(viewModel.sceneTitle) || readString(scene.title) || readString(scene.name),
    speaker: readString(viewModel.speaker)
      || readString(scene.speaker)
      || readString(isRecord(viewModel.speaker) ? viewModel.speaker.name : undefined),
    dialogue,
    pageLabel: readString(scene.pageLabel),
    context: readString(scene.context),
  });
}

function readLocale(viewModel) {
  const locale = readString(viewModel.locale);
  return /^[a-z]{2,3}(?:-[a-z0-9]{2,8})*$/i.test(locale) ? locale : "th";
}

function readFeedbackText(viewModel) {
  if (typeof viewModel.feedback === "string") return viewModel.feedback;
  if (isRecord(viewModel.feedback)) {
    return readString(viewModel.feedback.text) || readString(viewModel.feedback.message);
  }
  return readString(viewModel.feedbackText);
}

function readMeter(viewModel, name) {
  const meters = isRecord(viewModel.meters) ? viewModel.meters : {};
  const raw = meters[name];
  if (typeof raw === "number" && Number.isFinite(raw)) {
    return Object.freeze({ value: raw, visible: true });
  }
  if (!isRecord(raw) || typeof raw.value !== "number" || !Number.isFinite(raw.value)) return null;
  return Object.freeze({ value: raw.value, visible: raw.visible !== false });
}

function readLogEntry(entry) {
  if (typeof entry === "string") return entry;
  if (isRecord(entry)) return readString(entry.text) || readString(entry.dialogue);
  return "";
}

function readStatusText(status, messages) {
  if (typeof status === "string" && status) return status;
  if (isRecord(status)) {
    const text = readString(status.text) || readString(status.message) || message(messages, "status.generic");
    const changes = Array.isArray(status.meterChanges) ? status.meterChanges : [];
    const descriptions = changes.filter((change) => ["hp", "sanity"].includes(change.meter) && Number.isFinite(change.delta)).map((change) => (
      formatMessage(message(messages, change.delta > 0 ? "meter.change.positive" : change.delta < 0 ? "meter.change.negative" : "meter.change.neutral"), {
        label: message(messages, `meter.${change.meter}`), amount: Math.abs(change.delta),
      })
    ));
    return [text, ...descriptions].join(" ");
  }
  throw new TypeError("Status must be a string or an object with display text.");
}

function fatalMessageFor(code, messages) {
  if (FATAL_CONTENT_CODES.has(code)) return message(messages, "fatal.content");
  if (FATAL_STORAGE_CODES.has(code)) return message(messages, "fatal.storage");
  if (code === "UNSUPPORTED_ENVIRONMENT") return message(messages, "fatal.environment");
  return message(messages, "fatal.generic");
}

function normalizeMeterValue(value) {
  return Math.min(METER_MAX, Math.max(0, Math.round(value)));
}

function normalizeOptions(optionsOrRoot) {
  if (isRecord(optionsOrRoot) && Object.hasOwn(optionsOrRoot, "root")) {
    return optionsOrRoot;
  }
  return { root: optionsOrRoot };
}

function resolveDocument(configuredDocument, root) {
  const document = configuredDocument || root?.ownerDocument || globalThis.document;
  if (document === null || typeof document !== "object" || typeof document.createElement !== "function") {
    throw new TypeError("Renderer requires a DOM document with createElement.");
  }
  return document;
}

function isDomContainer(value) {
  return value !== null
    && typeof value === "object"
    && typeof value.replaceChildren === "function"
    && typeof value.setAttribute === "function";
}

function createElement(document, tagName, options = {}) {
  const element = document.createElement(tagName);
  if (Array.isArray(options.classNames) && options.classNames.length > 0) {
    addClasses(element, ...options.classNames);
  }
  if (isRecord(options.attributes)) {
    for (const [name, value] of Object.entries(options.attributes)) {
      element.setAttribute(name, String(value));
    }
  }
  if (typeof options.text === "string") element.textContent = options.text;
  return element;
}

function addClasses(element, ...classNames) {
  if (element.classList && typeof element.classList.add === "function") {
    element.classList.add(...classNames);
    return;
  }
  const existing = typeof element.getAttribute === "function"
    ? element.getAttribute("class") || ""
    : "";
  const next = [...new Set([...existing.split(/\s+/), ...classNames].filter(Boolean))].join(" ");
  element.setAttribute("class", next);
}

function message(messages, key) {
  return typeof messages[key] === "string" ? messages[key] : TH_SYSTEM_MESSAGES[key];
}

function formatMessage(template, values) {
  return template.replace(/{{([a-zA-Z0-9]+)}}/g, (_, key) => {
    const value = values[key];
    return typeof value === "string" || typeof value === "number" ? String(value) : "";
  });
}

function emptyReferences() {
  return {
    dialogue: null,
    choiceList: null,
    choiceButtons: Object.freeze([]),
    fatal: null,
  };
}

function perform(operation, action) {
  try {
    action();
    return success();
  } catch (error) {
    return failure(operation, error);
  }
}

function success() {
  return Object.freeze({ ok: true, value: undefined });
}

function failure(operation, error) {
  return Object.freeze({
    ok: false,
    error: Object.freeze({
      code: RENDERER_ERROR_CODES.RENDER_FAILURE,
      details: Object.freeze({
        operation,
        reason: error instanceof RendererFocusError ? error.reason : "DOM_OPERATION_FAILED",
        cause: safeErrorName(error),
      }),
    }),
  });
}

function safeErrorName(error) {
  return error !== null && typeof error === "object" && typeof error.name === "string"
    ? error.name
    : "Error";
}

class RendererFocusError extends Error {
  constructor(reason) {
    super(reason);
    this.name = "RendererFocusError";
    this.reason = reason;
  }
}

function readString(value) {
  return typeof value === "string" ? value : "";
}

function assertRecord(value, message) {
  if (!isRecord(value)) throw new TypeError(message);
}

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
