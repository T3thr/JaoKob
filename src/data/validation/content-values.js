/** JSON trust-boundary utilities. Trace: NFR-SE-002, FR-CNT-001, ADR-P0-013. */

/** Freeze an already validated, acyclic JSON value. */
export function deepFreeze(value) {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}

/** Never include untrusted values in diagnostic messages. */
export function contentFailure(path, code, message) {
  return deepFreeze({ valid: false, errors: [{ path, code, message }] });
}

/**
 * Clone data properties without invoking getters or toJSON. Reject non-JSON
 * values instead of coercing/dropping them. Bounds protect recursive contracts.
 * @param {unknown} input
 * @returns {{valid: true, value: unknown} | {valid: false, errors: readonly object[]}}
 */
export function copyJsonData(input) {
  let remaining = 500000;
  const ancestors = new Set();
  const rejected = Symbol("rejected-json");
  let outcome;
  function reject(path, code, message) {
    outcome = contentFailure(path, code, message);
    throw rejected;
  }
  function copy(value, path, depth) {
    if (--remaining < 0 || depth > 96) {
      reject(path, "CONTENT_LIMIT", "JSON work or depth limit exceeded.");
    }
    if (value === null || typeof value === "string" || typeof value === "boolean") return value;
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value !== "object" || value === null) {
      reject(path, "CONTENT_SCHEMA", "Expected a JSON value.");
    }
    if (ancestors.has(value)) reject(path, "CONTENT_SCHEMA", "Cyclic data is not JSON.");
    const array = Array.isArray(value);
    const proto = Object.getPrototypeOf(value);
    if (proto !== (array ? Array.prototype : Object.prototype) && !(proto === null && !array)) {
      reject(path, "CONTENT_SCHEMA", "Custom prototypes are not JSON records.");
    }
    ancestors.add(value);
    const descriptors = Object.getOwnPropertyDescriptors(value);
    const result = array ? [] : {};
    let count = 0;
    for (const key of Reflect.ownKeys(descriptors)) {
      if (array && key === "length") continue;
      const d = descriptors[key];
      if (typeof key !== "string" || !d.enumerable || !Object.hasOwn(d, "value")
        || (array && (!/^(0|[1-9][0-9]*)$/.test(key) || Number(key) >= value.length))) {
        reject(path, "CONTENT_SCHEMA", "Only enumerable JSON data properties are allowed.");
      }
      const childPath = array ? `${path}[${key}]` : `${path}.${key}`;
      Object.defineProperty(result, key, {
        value: copy(d.value, childPath, depth + 1), enumerable: true, configurable: true, writable: true,
      });
      count += 1;
    }
    if (array && count !== value.length) {
      reject(path, "CONTENT_SCHEMA", "Sparse arrays are not JSON arrays.");
    }
    ancestors.delete(value);
    return result;
  }
  try {
    return { valid: true, value: copy(input, "$", 0) };
  } catch (failure) {
    return failure === rejected ? outcome
      : contentFailure("$", "CONTENT_SCHEMA", "Input could not be inspected as JSON data.");
  }
}
