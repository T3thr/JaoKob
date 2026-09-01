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
  assert.equal(findOne(root, hasDataRole("feedback")).textContent.includes("เจ้ากบพบที่กำบังจากฝน"), true);
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
  assert.equal(findOne(root, hasDataRole("typewriter-toggle")).tagName, "INPUT");
  const skip = findOne(root, hasDataAction("skip-cutscene"));
  skip.dispatchEvent({ type: "click" });
  assert.deepEqual(intents, [{ type: "SKIP_CUTSCENE" }]);

  const gameOver = findOne(root, hasDataRole("game-over"));
  assert.equal(gameOver.textContent.includes("ตาย"), false);
  assert.equal(findAll(gameOver, (element) => element.tagName === "BUTTON").length, 4);
});

test("NFR-US-001 renders a localized first-run notice supplied by the view model", () => {
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

  const notice = findOne(root, hasDataRole("first-run-notice"));
  assert.equal(notice.textContent.includes("เกมผจญภัยเชิงเรื่องเล่า"), true);
  assert.equal(findAll(notice, (element) => element.tagName === "LI").length, 4);
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
