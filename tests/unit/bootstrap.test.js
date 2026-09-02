import test from "node:test";
import assert from "node:assert/strict";

import {
  createPlayableSlice,
  projectViewModel,
} from "../../src/bootstrap/index.js";
import { PROLOGUE_SLICE } from "../../src/data/content/prologue-slice.js";
import {
  LOCAL_STORAGE_KEYS,
  createLocalStorageAdapter,
} from "../../src/data/persistence/local-storage-adapter.js";
import { validateSaveEnvelope } from "../../src/data/validation/save-envelope-validator.js";

const SESSION_ID = "123e4567-e89b-42d3-a456-426614174000";
const CLOCK_TIME = "2026-09-02T05:00:00.000Z";

test("FR-STA-001 FR-ENG-002 FR-SAV-001 boot, DOM intent, transaction, and staged save form one playable slice", async () => {
  const harness = createHarness();
  const boot = await harness.application.boot();

  assert.equal(boot.ok, true);
  assert.equal(harness.application.getSnapshot().state, "Title");
  assert.match(harness.root.textContent, /ริมคลองหลังฝนตก/);
  assert.equal(findByAttribute(harness.root, "data-choice-id", "action.prologue.new-game").tagName, "BUTTON");

  await clickChoice(harness, "action.prologue.new-game");
  assert.equal(harness.application.getSnapshot().state, "Cutscene");
  assert.equal(harness.application.getSnapshot().currentNodeId, "node.prologue.introduction");

  await clickChoice(harness, "action.prologue.open-decision");
  assert.equal(harness.application.getSnapshot().state, "Decision");
  assert.equal(findAllByAttribute(harness.root, "data-jk-role", "choice").length, 3);

  await clickChoice(harness, "choice.prologue.jump-to-leaf");

  const snapshot = harness.application.getSnapshot();
  const canonicalRaw = harness.storage.raw(LOCAL_STORAGE_KEYS.canonical);
  assert.equal(snapshot.state, "Cutscene");
  assert.equal(snapshot.currentNodeId, "node.prologue.after-leaf");
  assert.deepEqual(snapshot.metrics, { hp: 75, sanity: 70, bond: 10 });
  assert.equal(snapshot.revision, 2);
  assert.equal(Object.isFrozen(harness.application.getViewModel()), true);
  assert.match(harness.root.textContent, /การกระโดดทำให้เหนื่อยนิดหน่อย/);
  assert.ok(canonicalRaw, "choice transaction must promote a canonical LocalStorage candidate");
  assert.equal(validateSaveEnvelope(JSON.parse(canonicalRaw)).valid, true);
  assert.equal(JSON.parse(canonicalRaw).reason, "choice-committed");
  assert.ok(harness.storage.calls.some((call) => (
    call.method === "setItem" && call.key === LOCAL_STORAGE_KEYS.staging
  )));
  assert.ok(harness.storage.calls.some((call) => (
    call.method === "setItem" && call.key === LOCAL_STORAGE_KEYS.canonical
  )));
  assert.equal(harness.storage.raw(LOCAL_STORAGE_KEYS.staging), null);
});

test("FR-STA-001 offers Resume only for a compatible staged slice save and restores its Cutscene", async () => {
  const firstRun = createHarness();
  await firstRun.application.boot();
  await clickChoice(firstRun, "action.prologue.new-game");
  await clickChoice(firstRun, "action.prologue.open-decision");
  await clickChoice(firstRun, "choice.prologue.rest-in-rain");

  const resumedStorage = new MemoryStorage({
    [LOCAL_STORAGE_KEYS.canonical]: firstRun.storage.raw(LOCAL_STORAGE_KEYS.canonical),
  });
  const resumed = createHarness({ storage: resumedStorage });
  await resumed.application.boot();

  assert.equal(resumed.application.getStatus().hasResumeCandidate, true);
  assert.ok(findByAttribute(resumed.root, "data-choice-id", "action.prologue.resume"));
  await clickChoice(resumed, "action.prologue.resume");
  assert.equal(resumed.application.getSnapshot().state, "Cutscene");
  assert.equal(resumed.application.getSnapshot().currentNodeId, "node.prologue.after-rest");
  assert.deepEqual(resumed.application.getSnapshot().metrics, { hp: 80, sanity: 80, bond: 0 });

  const replacementStorage = new MemoryStorage({
    [LOCAL_STORAGE_KEYS.canonical]: firstRun.storage.raw(LOCAL_STORAGE_KEYS.canonical),
  });
  const replacement = createHarness({ storage: replacementStorage });
  await replacement.application.boot();
  await clickChoice(replacement, "action.prologue.new-game");

  const replacementEnvelope = JSON.parse(
    replacementStorage.raw(LOCAL_STORAGE_KEYS.canonical),
  );
  assert.equal(replacement.application.getSnapshot().state, "Cutscene");
  assert.equal(replacement.application.getSnapshot().revision, 3);
  assert.equal(replacementEnvelope.revision, 3);
  assert.equal(replacementEnvelope.reason, "new-game");
});

test("FR-UI-006 retries a Core-detected crisis from the immutable checkpoint without erasing the save", async () => {
  const crisisContent = structuredClone(PROLOGUE_SLICE);
  const decision = crisisContent.nodes.find((node) => node.id === "node.prologue.decision");
  decision.choices[0].effects = [{ type: "set-metric", metric: "hp", value: 0 }];
  const harness = createHarness({ content: crisisContent });

  await harness.application.boot();
  await clickChoice(harness, "action.prologue.new-game");
  await clickChoice(harness, "action.prologue.open-decision");
  await clickChoice(harness, "choice.prologue.jump-to-leaf");

  assert.equal(harness.application.getSnapshot().state, "GameOver");
  assert.ok(findByAttribute(harness.root, "data-jk-role", "game-over"));
  assert.equal(harness.root.textContent.includes("ตาย"), false);

  const retry = findByAttribute(harness.root, "data-jk-action", "retry");
  retry.dispatchEvent({ type: "click" });
  await harness.application.whenIdle();

  assert.equal(harness.application.getSnapshot().state, "Cutscene");
  assert.equal(harness.application.getSnapshot().currentNodeId, "node.prologue.introduction");
  assert.equal(harness.application.getSnapshot().metrics.hp, 80);
  assert.ok(harness.storage.raw(LOCAL_STORAGE_KEYS.canonical));
});

test("FR-SAV-009 uses a visible memory-only warning for unavailable storage and reserves fatal shell for unrecoverable adapter faults", async () => {
  const unavailable = createStoragePort({ code: "STORAGE_UNAVAILABLE" });
  const memoryOnly = createHarness({ adapter: unavailable });
  const memoryBoot = await memoryOnly.application.boot();

  assert.equal(memoryBoot.ok, true);
  assert.equal(memoryOnly.application.getSnapshot().state, "Title");
  assert.equal(memoryOnly.application.getStatus().persistenceDegraded, true);
  assert.match(memoryOnly.root.textContent, /ยังเล่นต่อได้ในหน้านี้/);

  const broken = createStoragePort({ code: "ADAPTER_CORRUPTED" });
  const fatal = createHarness({ adapter: broken });
  const fatalBoot = await fatal.application.boot();

  assert.equal(fatalBoot.ok, false);
  assert.equal(fatal.application.getStatus().fatal, true);
  assert.ok(findByAttribute(fatal.root, "data-jk-role", "fatal-shell"));
});

test("FR-UI-001 projects an immutable View Model without exposing Bond during Act 1", () => {
  const snapshot = {
    state: "Decision",
    currentNodeId: "node.prologue.decision",
    metrics: { hp: 80, sanity: 70, bond: 10 },
  };
  const viewModel = projectViewModel({
    content: PROLOGUE_SLICE,
    snapshot,
    feedback: null,
    meterChanges: [{ meter: "bond", delta: 10 }],
    persistenceNotice: null,
    hasResumeCandidate: false,
  });

  assert.equal(Object.isFrozen(viewModel), true);
  assert.equal(viewModel.meters.bond.visible, false);
  assert.deepEqual(viewModel.meterChanges, []);
  assert.equal(viewModel.choices.length, 3);
});

async function clickChoice(harness, choiceId) {
  const choice = findByAttribute(harness.root, "data-choice-id", choiceId);
  choice.dispatchEvent({ type: "click" });
  await harness.application.whenIdle();
}

function createHarness({ content = PROLOGUE_SLICE, storage = new MemoryStorage(), adapter } = {}) {
  const document = new FakeDocument();
  const root = document.createElement("div");
  const application = createPlayableSlice({
    root,
    document,
    content,
    storage: adapter ?? createLocalStorageAdapter(storage),
    clock: () => CLOCK_TIME,
    sessionIdFactory: () => SESSION_ID,
    reload: () => {},
  });
  return { application, document, root, storage };
}

function createStoragePort({ code }) {
  const failure = () => Object.freeze({
    ok: false,
    error: Object.freeze({ code }),
  });
  return Object.freeze({
    recoverCandidates: failure,
    load: failure,
    stage: failure,
    commit: failure,
    checkpoint: failure,
    clearWithConsent: failure,
  });
}

function findByAttribute(root, name, value) {
  const result = findAllByAttribute(root, name, value)[0];
  assert.ok(result, `Expected an element with ${name}="${value}".`);
  return result;
}

function findAllByAttribute(root, name, value) {
  const matches = [];
  visit(root, (element) => {
    if (element.getAttribute(name) === value) matches.push(element);
  });
  return matches;
}

function visit(element, visitor) {
  visitor(element);
  for (const child of element.children) visit(child, visitor);
}

class MemoryStorage {
  constructor(initial = {}) {
    this.entries = new Map(Object.entries(initial));
    this.calls = [];
  }

  getItem(key) {
    this.calls.push({ method: "getItem", key });
    return this.entries.has(key) ? this.entries.get(key) : null;
  }

  setItem(key, value) {
    this.calls.push({ method: "setItem", key, value: String(value) });
    this.entries.set(key, String(value));
  }

  removeItem(key) {
    this.calls.push({ method: "removeItem", key });
    this.entries.delete(key);
  }

  raw(key) {
    return this.entries.has(key) ? this.entries.get(key) : null;
  }
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
