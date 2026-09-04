import assert from "node:assert/strict";

/** DOM/storage doubles shared by focused application integration tests. */
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

export { MemoryStorage, FakeDocument, findByAttribute, findAllByAttribute };
