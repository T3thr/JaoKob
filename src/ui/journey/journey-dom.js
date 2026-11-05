/**
 * Safe DOM helpers of the Journey screens. Text is only ever written as text nodes
 * (`textContent`); no markup string reaches the document (AGENTS.md §10, TC-S5-A11Y-001).
 */

/**
 * An element with a class, attributes and optional text.
 * @param {Document} document @param {string} tag @param {string} [className]
 * @param {Record<string, string|number|boolean|null|undefined>} [attributes] @param {string} [text]
 */
export function element(document, tag, className = "", attributes = {}, text) {
  const node = document.createElement(tag);
  if (className !== "") node.setAttribute("class", className);
  setAttributes(node, attributes);
  if (text !== undefined) node.textContent = text;
  return node;
}

/** Set, replace or remove (null, undefined, false) attributes. */
export function setAttributes(node, attributes) {
  for (const [name, value] of Object.entries(attributes)) {
    if (value === null || value === undefined || value === false) node.removeAttribute(name);
    else node.setAttribute(name, value === true ? "" : String(value));
  }
}

/** Write text only when it changed, so screen readers and transitions see real changes only. */
export function setText(node, text) {
  const value = text ?? "";
  if (node.textContent !== value) node.textContent = value;
}

/** Ids for aria references, unique within one renderer (no module-level state). */
export function createIdSource(prefix) {
  let sequence = 0;
  return (name) => `${prefix}-${name}-${(sequence += 1).toString(36)}`;
}
