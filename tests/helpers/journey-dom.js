// A small DOM double for the Journey screen tests (TC-S5-VN-001, TC-S5-HUD-001,
// TC-S5-SILENT-001, TC-S5-A11Y-001). It models only what the Journey UI uses: elements and SVG
// elements, attributes, text, children, styles, events with bubbling, focus, and a document
// with keyboard listeners. Independent of the Sprint 4 harness, which leaves in C5.
import assert from "node:assert/strict";

class JourneyNode {
  constructor(document, tag, namespace = null) {
    this.ownerDocument = document;
    this.tagName = namespace === null ? tag.toUpperCase() : tag;
    this.namespaceURI = namespace;
    this.parentNode = null;
    this.children = [];
    this.attributes = new Map();
    this.listeners = new Map();
    this.ownText = "";
    const properties = new Map();
    this.style = {
      setProperty: (name, value) => properties.set(name, String(value)),
      getPropertyValue: (name) => properties.get(name) ?? "",
    };
  }

  get textContent() { return this.ownText + this.children.map((child) => child.textContent).join(""); }
  set textContent(value) {
    for (const child of this.children) child.parentNode = null;
    this.children = [];
    this.ownText = String(value);
  }

  get hidden() { return this.attributes.has("hidden"); }
  set hidden(value) { if (value) this.attributes.set("hidden", ""); else this.attributes.delete("hidden"); }
  get id() { return this.attributes.get("id") ?? ""; }

  setAttribute(name, value) { this.attributes.set(name, String(value)); }
  getAttribute(name) { return this.attributes.has(name) ? this.attributes.get(name) : null; }
  hasAttribute(name) { return this.attributes.has(name); }
  removeAttribute(name) { this.attributes.delete(name); }

  append(...nodes) { for (const node of nodes) this.appendChild(node); }
  appendChild(node) {
    assert.ok(node instanceof JourneyNode, "only element children");
    node.remove();
    node.parentNode = this;
    this.children.push(node);
    return node;
  }
  replaceChildren(...nodes) { this.textContent = ""; this.append(...nodes); }
  remove() {
    if (this.parentNode === null) return;
    this.parentNode.children = this.parentNode.children.filter((child) => child !== this);
    this.parentNode = null;
  }
  contains(node) {
    for (let current = node; current !== null && current !== undefined; current = current.parentNode) if (current === this) return true;
    return false;
  }

  addEventListener(type, listener) { this.listeners.set(type, [...(this.listeners.get(type) ?? []), listener]); }
  removeEventListener(type, listener) { this.listeners.set(type, (this.listeners.get(type) ?? []).filter((entry) => entry !== listener)); }
  /** Dispatch with bubbling to the ancestors and then the document. */
  dispatch(type, init = {}) {
    const event = { type, target: this, defaultPrevented: false, preventDefault() { this.defaultPrevented = true; }, ...init };
    for (let current = this; current !== null; current = current.parentNode) {
      for (const listener of current.listeners.get(type) ?? []) listener({ ...event, currentTarget: current, preventDefault: () => { event.defaultPrevented = true; } });
    }
    this.ownerDocument.fire(type, event);
    return event;
  }
  click() { return this.dispatch("click"); }
  focus() { this.ownerDocument.activeElement = this; }
}

export class JourneyDocument {
  constructor() {
    this.listeners = new Map();
    this.body = new JourneyNode(this, "body");
    this.documentElement = new JourneyNode(this, "html");
    this.documentElement.append(this.body);
    this.activeElement = this.body;
    this.defaultView = null;
    this.visibilityState = "visible";
  }
  createElement(tag) { return new JourneyNode(this, tag); }
  createElementNS(namespace, tag) { return new JourneyNode(this, tag, namespace); }
  addEventListener(type, listener) { this.listeners.set(type, [...(this.listeners.get(type) ?? []), listener]); }
  removeEventListener(type, listener) { this.listeners.set(type, (this.listeners.get(type) ?? []).filter((entry) => entry !== listener)); }
  fire(type, event) { for (const listener of this.listeners.get(type) ?? []) listener(event); }
  /** A key press aimed at the focused element (or the body); `repeat` is a held key's auto-repeat. */
  key(key, { repeat = false } = {}) {
    return this.keyEvent("keydown", key, repeat);
  }
  /** A key release aimed at the focused element (or the body). */
  keyUp(key) {
    return this.keyEvent("keyup", key, false);
  }
  keyEvent(type, key, repeat) {
    const target = this.activeElement ?? this.body;
    const event = { type, key, repeat, target, altKey: false, ctrlKey: false, metaKey: false, defaultPrevented: false };
    event.preventDefault = () => { event.defaultPrevented = true; };
    this.fire(type, event);
    return event;
  }
}

/** A clock and an animation-frame queue the test advances by hand. */
export function manualFrames() {
  let time = 0;
  const queue = [];
  return {
    now: () => time,
    frame: (callback) => { queue.push(callback); return queue.length; },
    /** Move the clock by `ms` and run the frames queued so far, `times` rounds. */
    tick(ms, times = 1) {
      for (let i = 0; i < times; i += 1) {
        time += ms;
        const due = queue.splice(0);
        due.forEach((callback) => callback());
      }
    },
    get pending() { return queue.length; },
  };
}

/** Give a node a fixed box, as the browser's layout would (pointer tests). */
export function placeBox(node, { left = 0, top = 0, width, height }) {
  node.getBoundingClientRect = () => ({ left, top, width, height, right: left + width, bottom: top + height, x: left, y: top });
}

/** Every node under `root` (root included). */
export function nodes(root) {
  const all = [];
  const walk = (node) => { all.push(node); node.children.forEach(walk); };
  walk(root);
  return all;
}

/** Nodes whose class list contains `name`. */
export const byClass = (root, name) => nodes(root).filter((node) => (node.getAttribute("class") ?? "").split(/\s+/).includes(name));
export const oneByClass = (root, name) => {
  const found = byClass(root, name);
  assert.equal(found.length, 1, `expected one .${name}, found ${found.length}`);
  return found[0];
};

/** Let pending promise callbacks run (image loads in the components). */
export async function flush(times = 8) { for (let i = 0; i < times; i += 1) await Promise.resolve(); }

/** An image loader that resolves at once and records loads and releases. */
export function recordingLoader() {
  const loads = [], releases = [];
  const loadImage = async (descriptor) => {
    loads.push(descriptor.assetId);
    return { url: `blob:${descriptor.assetId}`, release: () => releases.push(descriptor.assetId) };
  };
  return { loadImage, loads, releases };
}

/** A scheduler that runs callbacks only when the test says so. */
export function manualSchedule() {
  const queue = [];
  const schedule = (callback, ms) => { queue.push({ callback, ms }); return queue.length; };
  const runAll = () => { while (queue.length > 0) queue.shift().callback(); };
  return { schedule, runAll, queue };
}
