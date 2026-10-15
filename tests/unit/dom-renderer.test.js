import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { assertRendererPort } from "../../src/core/ports/renderer-port.js";
import { createDomRenderer } from "../../src/ui/renderers/dom/dom-renderer.js";

test("FR-UI-001 DOM renderer structurally implements RendererPort without mutating an immutable view model", () => {
  const document = new FakeDocument();
  const root = document.createElement("div");
  const intents = [];
  const renderer = createDomRenderer({
    root,
    document,
    onIntent: (intent) => intents.push(intent),
  });
  const viewModel = deepFreeze({
    scene: {
      title: "ริมคลองหลังฝน",
      speaker: "เจ้ากบ",
      dialogue: "หยดน้ำเล็ก ๆ เกาะอยู่บนใบบัว",
    },
    meters: { hp: 80, sanity: 70, bond: 25 },
    choices: [
      { id: "look-around", label: "มองไปรอบ ๆ" },
      { id: "rest", label: "พักใต้ใบไม้", disabled: true, unavailableReason: "ยังไม่ปลอดภัยพอ" },
    ],
  });
  const before = structuredClone(viewModel);

  assert.doesNotThrow(() => assertRendererPort(renderer));
  assert.equal(Object.isFrozen(renderer), true);
  assert.deepEqual(renderer.render(viewModel), { ok: true, value: undefined });
  assert.deepEqual(viewModel, before);

  assert.equal(findOne(root, hasDataRole("speaker")).textContent, "ผู้เล่าเรื่อง: เจ้ากบ");
  assert.equal(findOne(root, hasDataRole("dialogue-text")).textContent, "หยดน้ำเล็ก ๆ เกาะอยู่บนใบบัว");
  assert.equal(findOne(root, hasDataRole("game-shell")).getAttribute("lang"), "th");
  assert.equal(findAll(root, (element) => element.hasAttribute("data-jk-meter")).length, 3);
  assert.equal(findOne(root, hasAttribute("data-jk-meter", "hp")).textContent.includes("80/100"), true);
  assert.equal(findOne(root, hasAttribute("data-jk-meter", "sanity")).textContent.includes("70/100"), true);
  assert.equal(findOne(root, hasAttribute("data-jk-meter", "bond")).textContent.includes("25/100"), true);
  assert.equal(findOne(root, hasAttribute("data-jk-meter", "hp")).children[1].children[0].getAttribute("aria-label"), "พลังชีวิต");

  const choices = findAll(root, hasDataRole("choice"));
  assert.equal(choices.length, 2);
  assert.equal(choices[0].textContent, "มองไปรอบ ๆ");
  assert.equal(choices[1].disabled, true);
  assert.equal(findOne(root, hasAttribute("data-choice-id", "rest")).getAttribute("aria-describedby"), "jk-choice-reason-2");

  choices[0].dispatchEvent({ type: "click" });
  assert.deepEqual(intents, [{ type: "SELECT_CHOICE", choiceId: "look-around" }]);
});

test("FR-UI-005 hides the Bond HUD whenever the projected view model marks it unavailable", () => {
  const { document, root, renderer } = createHarness();
  const outcome = renderer.render({
    scene: { title: "ทางเดิน", dialogue: "มีเพียงเสียงฝน" },
    meters: {
      hp: 80,
      sanity: 70,
      bond: { value: 40, visible: false },
    },
    choices: [],
  });

  assert.equal(outcome.ok, true);
  assert.equal(findAll(root, hasAttribute("data-jk-meter", "bond")).length, 0);
  assert.equal(root.textContent.includes("ความผูกพัน"), false);
  assert.equal(document.activeElement, null);
});

test("FR-UI-002 setBusy locks all choice actions accessibly and restores only eligible choices", () => {
  const { root, renderer } = createHarness();
  renderer.render(viewModelWithChoices());
  const [available, unavailable] = findAll(root, hasDataRole("choice"));

  assert.deepEqual(renderer.setBusy(true), { ok: true, value: undefined });
  assert.equal(root.getAttribute("aria-busy"), "true");
  assert.equal(available.disabled, true);
  assert.equal(available.getAttribute("aria-disabled"), "true");
  assert.equal(unavailable.disabled, true);

  assert.deepEqual(renderer.setBusy(false), { ok: true, value: undefined });
  assert.equal(root.getAttribute("aria-busy"), "false");
  assert.equal(available.disabled, false);
  assert.equal(available.getAttribute("aria-disabled"), "false");
  assert.equal(unavailable.disabled, true);
  assert.equal(unavailable.getAttribute("aria-disabled"), "true");
});

test("FR-UI-003 renders visible feedback and text-labelled meter changes without relying on color", () => {
  const { root, renderer } = createHarness();
  const outcome = renderer.render({
    scene: { title: "สะพานไม้", dialogue: "ลมเริ่มอ่อนลง" },
    meters: { hp: 70, sanity: 72 },
    feedback: { text: "เจ้ากบพบที่กำบังจากฝน" },
    meterChanges: [
      { meter: "hp", delta: -10 },
      { meter: "sanity", delta: 2 },
    ],
    choices: [],
  });

  assert.equal(outcome.ok, true);
  assert.equal(findOne(root, hasDataRole("dialogue-text")).textContent.includes("เจ้ากบพบที่กำบังจากฝน"), true);
  assert.equal(root.textContent.includes("พลังชีวิต ลดลง 10"), true);
  assert.equal(root.textContent.includes("พลังใจ เพิ่มขึ้น 2"), true);
  assert.equal(findAll(root, (element) => element.getAttribute("data-direction") === "negative").length, 1);
  assert.equal(findAll(root, (element) => element.getAttribute("data-direction") === "positive").length, 1);
});

test("FR-ACC-002 announce updates a persistent polite live region", () => {
  const { root, renderer } = createHarness();
  renderer.render(viewModelWithChoices());

  const outcome = renderer.announce({ text: "บันทึกความคืบหน้าแล้ว" });
  const liveRegion = findOne(root, hasDataRole("live-region"));
  assert.deepEqual(outcome, { ok: true, value: undefined });
  assert.equal(liveRegion.getAttribute("role"), "status");
  assert.equal(liveRegion.getAttribute("aria-live"), "polite");
  assert.equal(liveRegion.getAttribute("aria-atomic"), "true");
  assert.equal(liveRegion.textContent, "บันทึกความคืบหน้าแล้ว");
});

test("FR-ACC-001 applyFocusDirective moves keyboard focus to an eligible choice or the dialogue landmark", () => {
  const { document, root, renderer } = createHarness();
  renderer.render(viewModelWithChoices());
  const [available] = findAll(root, hasDataRole("choice"));
  const dialogue = findOne(root, hasDataRole("dialogue"));

  assert.deepEqual(renderer.applyFocusDirective({ target: "first-choice" }), { ok: true, value: undefined });
  assert.equal(document.activeElement, available);

  assert.deepEqual(renderer.applyFocusDirective({ targetId: "dialogue" }), { ok: true, value: undefined });
  assert.equal(document.activeElement, dialogue);
});

test("FR-UI-004 and FR-UI-006 expose keyboard-native cutscene and crisis recovery controls as semantic intents", () => {
  const { root, renderer, intents } = createHarness();
  const outcome = renderer.render({
    state: "GameOver",
    scene: { title: "มุมพัก", dialogue: "เจ้ากบต้องการความอ่อนโยน" },
    meters: { hp: 0, sanity: 35 },
    cutscene: {
      paused: false,
      textSpeed: "normal",
      typewriterEnabled: true,
      canSkip: true,
      log: ["เม็ดฝนค่อย ๆ เบาลง", "มีแสงอุ่นอยู่ไกล ๆ"],
    },
    choices: [],
  });

  assert.equal(outcome.ok, true);
  assert.equal(findOne(root, hasDataRole("cutscene-controls")).textContent.includes("เม็ดฝนค่อย ๆ เบาลง"), true);
  assert.equal(findOne(root, hasDataRole("cutscene-speed")).tagName, "SELECT");
  assert.equal(findOne(root, hasDataRole("typewriter-toggle")).getAttribute("role"), "switch");
  const skip = findOne(root, hasDataAction("skip-cutscene"));
  skip.dispatchEvent({ type: "click" });
  assert.deepEqual(intents, [{ type: "SKIP_CUTSCENE" }]);

  const gameOver = findOne(root, hasDataRole("game-over"));
  assert.equal(gameOver.textContent.includes("ตาย"), false);
  assert.equal(findAll(gameOver, (element) => element.tagName === "BUTTON").length, 4);
});

test("ADR-P0-019 keeps legacy first-run warnings outside the sacred paper", () => {
  const { root, renderer } = createHarness();
  renderer.render({
    scene: { title: "หน้าเริ่มต้น", dialogue: "ยินดีต้อนรับ" },
    meters: { hp: 80, sanity: 70 },
    firstRunNotice: {
      title: "ก่อนเริ่มเดินทาง",
      items: [
        "นี่คือเกมผจญภัยเชิงเรื่องเล่า",
        "มีเนื้อหาเกี่ยวกับฝนและการพลัดพราก",
        "ความคืบหน้าบันทึกในเบราว์เซอร์นี้",
        "สามารถปรับการเข้าถึงได้ก่อนเริ่ม",
      ],
    },
    choices: [],
  });

  const card = findOne(root, hasDataRole("reading-card"));
  assert.equal(findAll(card, hasDataRole("first-run-notice")).length, 0);
  assert.equal(findOne(card, hasDataRole("dialogue-text")).textContent, "ยินดีต้อนรับ");
});

test("FR-UI-007 showFatalShell presents a Thai recovery-safe fallback and focuses it", () => {
  const { document, root, renderer, intents } = createHarness();
  renderer.render(viewModelWithChoices());

  const outcome = renderer.showFatalShell({ code: "CONTENT_SCHEMA", details: { raw: "do-not-display" } });
  const fatal = findOne(root, hasDataRole("fatal-shell"));
  assert.deepEqual(outcome, { ok: true, value: undefined });
  assert.equal(root.getAttribute("aria-busy"), "false");
  assert.equal(fatal.getAttribute("role"), "alert");
  assert.equal(fatal.textContent.includes("เนื้อหาเกมไม่พร้อมใช้งานอย่างปลอดภัย"), true);
  assert.equal(fatal.textContent.includes("do-not-display"), false);
  assert.equal(document.activeElement, fatal);

  findOne(root, hasDataAction("retry-render")).dispatchEvent({ type: "click" });
  findOne(root, hasDataAction("reload-application")).dispatchEvent({ type: "click" });
  assert.deepEqual(intents, [
    { type: "RETRY_RENDER" },
    { type: "RELOAD_APPLICATION" },
  ]);
});

test("NFR-SE-003 renders malicious dialogue and choice strings as text, never evaluated markup", () => {
  const { root, renderer } = createHarness();
  const payload = '<img src=x onerror="globalThis.jaokobXss=true">ข้อความ';
  const outcome = renderer.render({
    scene: { title: "ฉากทดสอบ", speaker: payload, dialogue: payload },
    meters: { hp: 80, sanity: 70 },
    choices: [{ id: "unsafe-text", label: payload }],
  });

  assert.equal(outcome.ok, true);
  assert.equal(findOne(root, hasDataRole("dialogue-text")).textContent, payload);
  assert.equal(findOne(root, hasDataRole("choice")).textContent, payload);
  assert.equal(findAll(root, (element) => element.tagName === "IMG").length, 0);
  assert.equal(globalThis.jaokobXss, undefined);

  const source = readFileSync(new URL("../../src/ui/renderers/dom/dom-renderer.js", import.meta.url), "utf8");
  assert.doesNotMatch(source, /innerHTML/);
  assert.doesNotMatch(source, /localStorage/);
  assert.doesNotMatch(source, /from\s+["'][^"']*\/data\//);
});

test("RendererPort operations convert invalid host or directive failures into RENDER_FAILURE results", () => {
  const renderer = createDomRenderer({ root: {} });
  const outcomes = [
    renderer.render({}),
    renderer.setBusy(true),
    renderer.announce({ text: "สถานะ" }),
    renderer.applyFocusDirective({ target: "dialogue" }),
    renderer.showFatalShell({ code: "RENDER_FAILURE" }),
  ];

  for (const outcome of outcomes) {
    assert.equal(outcome.ok, false);
    assert.equal(outcome.error.code, "RENDER_FAILURE");
  }

  const harness = createHarness();
  harness.renderer.render(viewModelWithChoices());
  const missing = harness.renderer.applyFocusDirective({ target: "missing-target" });
  assert.equal(missing.ok, false);
  assert.equal(missing.error.code, "RENDER_FAILURE");
  assert.equal(missing.error.details.reason, "FOCUS_TARGET_NOT_FOUND");
});

function createHarness() {
  const document = new FakeDocument();
  const root = document.createElement("div");
  const intents = [];
  const renderer = createDomRenderer({
    root,
    document,
    onIntent(intent) {
      intents.push(intent);
    },
  });
  return { document, root, renderer, intents };
}

function viewModelWithChoices() {
  return {
    scene: { title: "ริมคลอง", dialogue: "ฝนเพิ่งหยุดตก" },
    meters: { hp: 80, sanity: 70, bond: 0 },
    choices: [
      { id: "continue", label: "เดินต่อ" },
      { id: "blocked", label: "รออีกหน่อย", disabled: true, unavailableReason: "ยังไม่ถึงเวลา" },
    ],
  };
}

function hasDataRole(value) {
  return hasAttribute("data-jk-role", value);
}

function hasDataAction(value) {
  return hasAttribute("data-jk-action", value);
}

function hasAttribute(name, value) {
  return (element) => element.getAttribute(name) === value;
}

function findOne(root, predicate) {
  const result = findAll(root, predicate)[0];
  assert.ok(result, "Expected matching element to exist.");
  return result;
}

function findAll(root, predicate) {
  const results = [];
  visit(root, (element) => {
    if (predicate(element)) results.push(element);
  });
  return results;
}

function visit(element, visitor) {
  visitor(element);
  for (const child of element.children) visit(child, visitor);
}

function deepFreeze(value) {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const nested of Object.values(value)) deepFreeze(nested);
    Object.freeze(value);
  }
  return value;
}

class FakeDocument {
  constructor() {
    this.activeElement = null;
  }

  createElement(tagName) {
    return new FakeElement(this, tagName);
  }
}

class FakeElement {
  constructor(ownerDocument, tagName) {
    this.ownerDocument = ownerDocument;
    this.tagName = tagName.toUpperCase();
    this.parentNode = null;
    this.children = [];
    this.style = Object.create(null);
    this.disabled = false;
    this.checked = false;
    this.selected = false;
    this.value = "";
    this._attributes = new Map();
    this._listeners = new Map();
    this._text = "";
    this.classList = new FakeClassList(this);
  }

  get textContent() {
    return `${this._text}${this.children.map((child) => child.textContent).join("")}`;
  }

  set textContent(value) {
    this._text = String(value);
    this.#removeChildren();
  }

  append(...nodes) {
    for (const node of nodes) this.appendChild(node);
  }

  appendChild(node) {
    assert.ok(node instanceof FakeElement, "Fake DOM only supports element children.");
    if (node.parentNode !== null) node.parentNode.#detach(node);
    node.parentNode = this;
    this.children.push(node);
    return node;
  }

  replaceChildren(...nodes) {
    this._text = "";
    this.#removeChildren();
    this.append(...nodes);
  }

  setAttribute(name, value) {
    const text = String(value);
    this._attributes.set(name, text);
    if (name === "class") this.classList.replaceFromAttribute(text);
  }

  getAttribute(name) {
    return this._attributes.has(name) ? this._attributes.get(name) : null;
  }

  hasAttribute(name) {
    return this._attributes.has(name);
  }

  removeAttribute(name) {
    this._attributes.delete(name);
    if (name === "class") this.classList.replaceFromAttribute("");
  }

  addEventListener(type, listener) {
    const listeners = this._listeners.get(type) || [];
    listeners.push(listener);
    this._listeners.set(type, listeners);
  }

  dispatchEvent(event) {
    const dispatched = {
      ...event,
      currentTarget: this,
      target: this,
    };
    for (const listener of this._listeners.get(event.type) || []) listener(dispatched);
    return true;
  }

  focus() {
    this.ownerDocument.activeElement = this;
  }

  #removeChildren() {
    for (const child of this.children) child.parentNode = null;
    this.children = [];
  }

  #detach(child) {
    this.children = this.children.filter((candidate) => candidate !== child);
    child.parentNode = null;
  }
}

class FakeClassList {
  constructor(element) {
    this.element = element;
    this.values = new Set();
  }

  add(...values) {
    for (const value of values) this.values.add(value);
    this.#writeAttribute();
  }

  replaceFromAttribute(value) {
    this.values = new Set(value.split(/\s+/).filter(Boolean));
  }

  #writeAttribute() {
    this.element._attributes.set("class", [...this.values].join(" "));
  }
}

test("CR-0003 D4/D5/D7 four stage layers retain three canonical cards and numerical-free Bond locked presence", () => {
  const { root, renderer } = createHarness();
  const view = {
    presentation: { mode: "decision", background: null, character: null },
    scene: { title: "บ้านในหนองน้ำ", dialogue: "เจ้ากบจะอยู่ใกล้ใครในเช้านี้" },
    meters: { hp: 80, sanity: 70, bond: { state: "locked", label: "Bond: Locked", accessibleLabel: "ความผูกพัน: ยังไม่เริ่มต้น", icons: ["lotus", "lock"] } },
    choices: [{ id: "mother", label: "ว่ายตามแม่กบ" }, { id: "roots", label: "อยู่ฟังรากบัว" }, { id: "siblings", label: "ว่ายเล่นกับพี่น้อง" }, { id: "application.settings", label: "การตั้งค่า" }],
    meterChanges: [{ meter: "bond", delta: 5 }],
  };
  assert.equal(renderer.render(deepFreeze(view)).ok, true);
  for (const id of ["stage-bg", "stage-char", "stage-dialogue", "stage-hud"]) assert.equal(findAll(root, hasAttribute("id", id)).length, 1);
  const chip = findOne(root, hasAttribute("data-bond-state", "locked"));
  assert.match(chip.textContent, /Bond: Locked/); assert.doesNotMatch(chip.textContent, /\d|🪷|🔒/);
  const vector = findOne(chip, (element) => element.tagName === "SVG");
  assert.equal(vector.getAttribute("aria-hidden"), "true"); assert.equal(vector.textContent, "");
  assert.ok(vector.children.every((element) => element.tagName === "PATH"));
  visit(chip, (element) => {
    for (const [key, value] of element._attributes) {
      assert.doesNotMatch(key, /aria-value|data-value/);
      // Static decorative vector coordinates are geometry, never Bond values.
      if (!["viewBox", "d", "stroke-width"].includes(key)) assert.doesNotMatch(value, /\d/);
    }
  });
  assert.doesNotMatch(root.textContent, /ความผูกพัน เพิ่มขึ้น/);
  const cards = findOne(root, hasDataRole("choices"));
  assert.deepEqual(findAll(cards, hasDataRole("choice")).map((button) => button.textContent), ["ว่ายตามแม่กบ", "อยู่ฟังรากบัว", "ว่ายเล่นกับพี่น้อง"]);
  assert.equal(findAll(cards, hasDataAction("advance")).length, 0);
});

test("FR-ACC-001 settings overlay keeps story inert, restores field on rerender and trigger on close", () => {
  const { document, root, renderer } = createHarness();
  const base = { ...viewModelWithChoices(), presentation: { mode: "reading" }, settings: { fontScale: 1 }, choices: [{ id: "application.advance", label: "อ่านต่อ" }, { id: "application.settings", label: "การตั้งค่า" }] };
  renderer.render(base);
  findOne(root, hasAttribute("data-choice-id", "application.settings")).focus();
  const settings = { ...base, presentation: { mode: "settings" }, viewRevision: 3 };
  assert.equal(renderer.render(settings).ok, true);
  assert.equal(findOne(root, hasDataRole("game-shell")).hasAttribute("inert"), true);
  const font = findOne(root, hasAttribute("data-jk-setting", "fontScale"));
  assert.equal(document.activeElement, font);
  const music = findOne(root, hasAttribute("data-jk-setting", "musicVolume")); music.focus();
  renderer.setBusy(true);
  document.activeElement = null; // Native disabled controls lose focus before async persistence returns.
  renderer.render({ ...settings, settings: { fontScale: 1.5, musicVolume: .5 } });
  renderer.setBusy(false);
  assert.equal(document.activeElement, findOne(root, hasAttribute("data-jk-setting", "musicVolume")));
  renderer.applyFocusDirective({ target: "dialogue" });
  assert.equal(document.activeElement.getAttribute("data-jk-setting"), "musicVolume");
  renderer.render(base); renderer.applyFocusDirective({ target: "dialogue" });
  assert.equal(document.activeElement.getAttribute("data-choice-id"), "application.settings");
  assert.equal(findAll(root, hasDataRole("settings-dialog")).length, 0);
});

test("CR-0003 D2 renderer hands trusted activation to composition before semantic story intent", () => {
  const document = new FakeDocument(), root = document.createElement("div"), calls = [];
  const renderer = createDomRenderer({ document, root, onTrustedActivation: () => calls.push("unlock"), onIntent: () => calls.push("intent") });
  renderer.render(viewModelWithChoices());
  root.dispatchEvent({ type: "pointerdown", isTrusted: false });
  assert.deepEqual(calls, []);
  root.dispatchEvent({ type: "pointerdown", isTrusted: true });
  findOne(root, hasDataRole("choice")).dispatchEvent({ type: "click" });
  assert.deepEqual(calls, ["unlock", "intent"]);
  root.dispatchEvent({ type: "keydown", isTrusted: true, repeat: true });
  assert.deepEqual(calls, ["unlock", "intent"]);
});

test("FR-ACC-002 asynchronous media refresh retains current reading/button focus without announcing again", () => {
  const { root, document, renderer } = createHarness();
  const base = { ...viewModelWithChoices(), revision: 4, viewRevision: 7, presentation: { mode: "decision", nodeId: "node.act1.home-focus" } };
  renderer.render(base); renderer.announce({ text: "บันทึกแล้ว" });
  const live = findOne(root, hasDataRole("live-region"));
  findOne(root, hasDataRole("choice")).focus();
  renderer.render({ ...base, viewRevision: 8, audioStatusText: "เสียงพร้อมใช้งาน" });
  assert.equal(document.activeElement.getAttribute("data-choice-id"), "continue");
  assert.equal(live, findOne(root, hasDataRole("live-region"))); assert.equal(live.textContent, "บันทึกแล้ว");
  renderer.applyFocusDirective({ target: "dialogue" });
  renderer.render({ ...base, viewRevision: 9 });
  assert.equal(document.activeElement.getAttribute("data-jk-role"), "dialogue");
});

test("ADR-P0-018 D4 Title has a corner advisory control without a warning banner or gameplay meters", () => {
  const { root, renderer } = createHarness();
  renderer.render({ state: "Title", presentation: { mode: "title" }, scene: { title: "เจ้ากบ", dialogue: "ค่อย ๆ เดินทาง" },
    meters: { hp: 80, sanity: 70 }, firstRunNotice: { text: "มีพายุและการพลัดพราก" },
    choices: [{ id: "application.new-game", label: "เริ่มการเดินทาง" }, { id: "application.resume", label: "เล่นต่อ" }, { id: "application.advisory", label: "อ่านคำแนะนำเกี่ยวกับเนื้อหา" }, { id: "application.settings", label: "ตั้งค่า" }] });
  assert.equal(findAll(root, (el) => el.hasAttribute("data-jk-meter")).length, 0);
  assert.equal(findAll(root, hasDataRole("hud")).length, 0);
  assert.equal(findAll(root, hasDataRole("first-run-notice")).length, 0);
  const advisory = findOne(root, hasAttribute("data-choice-id", "application.advisory"));
  assert.equal(advisory.parentNode, findOne(root, hasDataRole("utility-rail")));
  assert.equal(advisory.getAttribute("aria-haspopup"), "dialog");
  assert.equal(findAll(root, hasDataRole("choice")).length, 4);
});

test("TC-S4-VIS-001 Reading contains only Next in paper footer; Decision contains real choices without Next", () => {
  const { root, renderer } = createHarness();
  const choices = [{ id: "application.advance", label: "อ่านต่อ" }, { id: "mother", label: "ตามแม่" }, { id: "roots", label: "ฟังราก" }, { id: "siblings", label: "เล่นกับพี่น้อง" }];
  const base = { scene: { speaker: "แม่กบ", dialogue: "ค่อย ๆ ฟังน้ำ" }, choices };
  renderer.render({ ...base, presentation: { mode: "reading" } });
  const card = findOne(root, hasDataRole("reading-card"));
  assert.deepEqual(findAll(card, hasDataRole("choice")).map((el) => el.getAttribute("data-choice-id")), ["application.advance"]);
  assert.equal(findAll(root, hasAttribute("data-choice-id", "mother")).length, 0);
  renderer.render({ ...base, presentation: { mode: "decision" } });
  assert.equal(findAll(root, hasDataAction("advance")).length, 0);
  assert.deepEqual(findAll(root, hasDataRole("choice")).map((el) => el.textContent), ["ตามแม่", "ฟังราก", "เล่นกับพี่น้อง"]);
});

test("TC-S4-STATUS-001 status-only render retains exact story, action, focus and latest revision guard", () => {
  const { root, document, renderer, intents } = createHarness();
  const base = { revision: 4, viewRevision: 7, presentation: { mode: "reading", nodeId: "opening" }, scene: { dialogue: "แสงไหวบนน้ำ" },
    choices: [{ id: "application.advance", label: "อ่านต่อ" }, { id: "application.settings", label: "ตั้งค่า" }] };
  renderer.render(base);
  const card = findOne(root, hasDataRole("reading-card")), story = findOne(root, hasDataRole("dialogue"));
  const button = findOne(root, hasDataAction("advance")); button.focus();
  const status = findOne(root, hasDataRole("save-status"));
  for (const [index, text] of ["กำลังบันทึก", "บันทึกแล้ว", "ยังบันทึกไม่ได้ หากปิดหน้านี้ความคืบหน้าอาจหายไป"].entries()) {
    renderer.render({ ...base, viewRevision: 8 + index, notice: { title: "บันทึก", text } });
    assert.equal(findOne(root, hasDataRole("reading-card")), card);
    assert.equal(findOne(root, hasDataRole("dialogue")), story);
    assert.equal(document.activeElement, button);
    assert.equal(findOne(root, hasDataRole("save-status")), status);
    assert.equal(status.textContent, text);
    assert.equal(findAll(card, hasDataRole("first-run-notice")).length, 0);
  }
  button.dispatchEvent({ type: "click" });
  assert.deepEqual(intents.at(-1), { type: "SELECT_CHOICE", choiceId: "application.advance", viewRevision: 10, expectedRevision: 4 });
});

test("TC-S4-STATUS-001 media failure adds functional recovery in rail while preserving reading and Settings", () => {
  const { root, document, renderer, intents } = createHarness();
  const base = { revision: 4, presentation: { mode: "reading" }, scene: { dialogue: "อ่านต่อในความเงียบ" },
    choices: [{ id: "application.advance", label: "อ่านต่อ" }, { id: "application.settings", label: "ตั้งค่า" }] };
  renderer.render(base);
  const card = findOne(root, hasDataRole("reading-card")), settings = findOne(root, hasAttribute("data-choice-id", "application.settings"));
  settings.focus();
  renderer.render({ ...base, mediaStatusText: "ยังโหลดภาพไม่ได้", choices: [...base.choices, { id: "application.retry-media", label: "ลองอีกครั้ง" }] });
  assert.equal(findOne(root, hasDataRole("reading-card")), card);
  assert.equal(findOne(root, hasAttribute("data-choice-id", "application.settings")), settings);
  assert.equal(document.activeElement, settings);
  const rail = findOne(root, hasDataRole("utility-rail"));
  findOne(rail, hasAttribute("data-choice-id", "application.retry-media")).dispatchEvent({ type: "click" });
  assert.equal(intents.at(-1).choiceId, "application.retry-media");
  assert.equal(findAll(card, hasAttribute("data-choice-id", "application.retry-media")).length, 0);
});

test("TC-S4-STATUS-001 settings status patches retain modal identity, scroll, field and busy focus", () => {
  const { root, document, renderer } = createHarness();
  const base = { revision: 1, scene: { dialogue: "แสง" }, settings: { fontScale: 1 }, presentation: { mode: "reading" },
    choices: [{ id: "application.advance", label: "อ่านต่อ" }, { id: "application.settings", label: "ตั้งค่า" }] };
  renderer.render(base);
  const overlay = { ...base, presentation: { mode: "settings" } };
  renderer.render(overlay);
  const modal = findOne(root, hasDataRole("settings-dialog")), music = findOne(root, hasAttribute("data-jk-setting", "musicVolume"));
  modal.scrollTop = 215; music.focus(); renderer.setBusy(true); document.activeElement = null;
  renderer.render({ ...overlay, viewRevision: 3, notice: { text: "ยังบันทึกไม่ได้" }, audioStatusText: "เสียงพร้อมแล้ว" }); renderer.setBusy(false);
  assert.equal(findOne(root, hasDataRole("settings-dialog")), modal);
  assert.equal(modal.scrollTop, 215);
  assert.equal(document.activeElement, music);
  assert.equal(findOne(modal, hasDataRole("audio-status")).textContent, "เสียงพร้อมแล้ว");
});

test("ADR-P0-019 story patches preserve landmarks, prose and independent HUD consequences", () => {
  const { root, renderer } = createHarness();
  renderer.render({ revision: 1, scene: { dialogue: "ก่อนฝน" }, presentation: { mode: "reading" }, choices: [] });
  const shell = findOne(root, hasDataRole("game-shell")), story = findOne(root, hasDataRole("dialogue")), header = findOne(root, hasDataRole("stage-header"));
  renderer.render({ revision: 2, scene: { dialogue: "ฝนตก" }, presentation: { mode: "reading" }, choices: [],
    feedback: "ได้ที่พัก", meterChanges: [{ meter: "hp", delta: 5 }], contentNotice: { text: "พายุและการพลัดพราก" } });
  assert.equal(findOne(root, hasDataRole("game-shell")), shell);
  assert.equal(findOne(root, hasDataRole("dialogue")), story);
  assert.equal(findOne(root, hasDataRole("stage-header")), header);
  const card = findOne(root, hasDataRole("reading-card"));
  assert.equal(findAll(card, hasDataRole("feedback")).length, 0);
  assert.equal(findAll(card, hasDataRole("content-notice")).length, 0);
  assert.match(card.textContent, /ได้ที่พัก/);
  assert.doesNotMatch(card.textContent, /พายุ|เพิ่มขึ้น|พลังชีวิต/);
  assert.match(findOne(root, hasDataRole("meter-toast")).textContent, /พลังชีวิต เพิ่มขึ้น 5/);
});

test("TC-S4-STATUS-001 duplicate operational announcements are deduped without suppressing a new beat", () => {
  const { root, renderer } = createHarness();
  const base = { revision: 1, scene: { dialogue: "น้ำ" }, choices: [] };
  renderer.render(base); renderer.announce({ text: "บันทึกแล้ว" });
  const live = findOne(root, hasDataRole("live-region"));
  live._text = "sentinel";
  renderer.render({ ...base, viewRevision: 9 }); renderer.announce({ text: "บันทึกแล้ว" });
  assert.equal(live.textContent, "sentinel", "duplicate announcement must not rewrite live-region text");
  renderer.render({ ...base, revision: 2, scene: { dialogue: "ราก" } }); renderer.announce({ text: "บันทึกแล้ว" });
  assert.equal(live.textContent, "บันทึกแล้ว");
});

test("CR-0005 PO review uses one header surface and merges Decision context without dropping authored text", () => {
  const { root, renderer } = createHarness();
  renderer.render({ presentation: { mode: "decision" }, scene: { dialogue: "เจ้ากบจะอยู่กับจังหวะไหน" }, feedback: "เจ้ากบกลับมาหาครอบครัว",
    meters: { hp: 80, sanity: 70 }, choices: [{ id: "mother", label: "ตามแม่" }, { id: "application.settings", label: "ตั้งค่า" }] });
  const hud = findOne(root, hasDataRole("hud")), utility = findOne(root, hasDataRole("utility-rail"));
  assert.equal(hud.parentNode, utility.parentNode);
  assert.match(hud.parentNode.getAttribute("class"), /jk-header-bar/);
  assert.equal(findOne(root, hasDataRole("save-status")).parentNode, findOne(root, hasDataRole("stage-header")));
  const card = findOne(root, hasDataRole("reading-card"));
  assert.match(findOne(card, hasDataRole("dialogue-text")).textContent, /กลับมาหาครอบครัว/);
  assert.match(findOne(card, hasDataRole("dialogue-text")).textContent, /จังหวะไหน/);
});

test("CR-0005 PO review success expires at1500ms without focus, DOM or media-refresh replay", () => {
  const document = new FakeDocument(), root = document.createElement("div"), timers = [];
  const renderer = createDomRenderer({ document, root, scheduleStatus: (callback, delay) => { timers.push({ callback, delay }); return timers.length; }, cancelStatus: () => {} });
  const base = { revision: 4, viewRevision: 2, presentation: { mode: "reading" }, scene: { dialogue: "แสงน้ำ" },
    notice: { kind: "saved", text: "บันทึกแล้ว" }, choices: [{ id: "application.advance", label: "อ่านต่อ" }] };
  renderer.render(base); const status = findOne(root, hasDataRole("save-status"));
  const button = findOne(root, hasDataAction("advance")); button.focus();
  const card = findOne(root, hasDataRole("reading-card"));
  assert.equal(status.hasAttribute("hidden"), false); assert.equal(timers[0].delay, 1500);
  renderer.render({ ...base, viewRevision: 3, audioStatusText: "เสียงพร้อม" }); assert.equal(timers.length, 1);
  timers[0].callback();
  assert.equal(status.hasAttribute("hidden"), true); assert.equal(document.activeElement, button);
  renderer.render({ ...base, viewRevision: 4 });
  assert.equal(status.hasAttribute("hidden"), true); assert.equal(timers.length, 1);
  assert.equal(findOne(root, hasDataRole("reading-card")), card);
  renderer.dispose();
});

test("CR-0005 PO review stale success timer cannot hide failed or memory-only save detail", () => {
  const document = new FakeDocument(), root = document.createElement("div"); let callback, canceled = false;
  const renderer = createDomRenderer({ document, root, scheduleStatus: (task) => { callback = task; return 1; }, cancelStatus: () => { canceled = true; } });
  const base = { revision: 4, scene: { dialogue: "น้ำ" }, choices: [] };
  renderer.render({ ...base, notice: { kind: "saved", text: "บันทึกแล้ว" } });
  renderer.render({ ...base, notice: { kind: "attention", text: "ยังบันทึกไม่ได้ หากปิดหน้านี้ความคืบหน้าอาจหายไป" } });
  callback(); const status = findOne(root, hasDataRole("save-status"));
  assert.ok(canceled); assert.equal(status.hasAttribute("hidden"), false); assert.match(status.textContent, /หากปิด/);
  renderer.dispose();
});

test("CR-0005 PO review autosave is silent while feedback and recovery remain announced", () => {
  const { root, renderer } = createHarness();
  const base = { revision: 4, scene: { dialogue: "น้ำ" }, choices: [], notice: { kind: "saved", text: "บันทึกแล้ว" } };
  renderer.render(base); renderer.announce({ text: "บันทึกแล้ว", meterChanges: [] });
  const live = findOne(root, hasDataRole("live-region")); assert.equal(live.textContent, "");
  renderer.render({ ...base, feedback: "พบเงาให้พัก", meterChanges: [{ meter: "hp", delta: 5 }] });
  renderer.announce({ text: "พบเงาให้พัก บันทึกแล้ว", meterChanges: [{ meter: "hp", delta: 5 }] });
  assert.match(live.textContent, /พบเงาให้พัก/); assert.match(live.textContent, /เพิ่มขึ้น 5/); assert.doesNotMatch(live.textContent, /บันทึกแล้ว/);
  renderer.render({ ...base, notice: { kind: "attention", text: "ยังบันทึกไม่ได้" } }); renderer.announce({ text: "ยังบันทึกไม่ได้" });
  assert.equal(live.textContent, "ยังบันทึกไม่ได้"); renderer.dispose();
});
