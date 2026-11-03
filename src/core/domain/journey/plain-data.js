/**
 * Copying and freezing plain JSON-domain data (objects, arrays, strings, finite numbers,
 * booleans, null). Core never shares mutable structure with its callers: shells copy what
 * they receive before working on it and deep-freeze what they return.
 *
 * Trace: ADR-P0-034 D2.1.
 */

/**
 * Deep copy of plain data. Non-plain values (functions, class instances, cycles) are a
 * programming error and throw a TypeError.
 *
 * @template T @param {T} value @returns {T}
 */
export function cloneData(value, seen = new Set()) {
  if (value === null || typeof value === "string" || typeof value === "boolean") return value;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new TypeError("Plain data numbers must be finite");
    return value;
  }
  if (typeof value !== "object") throw new TypeError(`Plain data cannot hold a ${typeof value}`);
  if (seen.has(value)) throw new TypeError("Plain data cannot be cyclic");
  seen.add(value);
  let copy;
  if (Array.isArray(value)) {
    copy = value.map((item) => cloneData(item, seen));
  } else {
    const proto = Object.getPrototypeOf(value);
    if (proto !== Object.prototype && proto !== null) throw new TypeError("Plain data objects must be plain");
    copy = {};
    for (const key of Object.keys(value)) {
      if (value[key] !== undefined) copy[key] = cloneData(value[key], seen);
    }
  }
  seen.delete(value);
  return copy;
}

/**
 * Freeze plain data in place, recursively, and return it.
 *
 * @template T @param {T} value @returns {Readonly<T>}
 */
export function deepFreeze(value) {
  if (value !== null && typeof value === "object") {
    for (const key of Object.keys(value)) deepFreeze(value[key]);
    Object.freeze(value);
  }
  return value;
}

/** @template T @param {T} value @returns {Readonly<T>} A frozen deep copy. */
export const frozenCopy = (value) => deepFreeze(cloneData(value));
