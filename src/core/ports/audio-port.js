/**
 * Pure structural AudioPort. It receives accepted media desires, never domain
 * effects or platform objects. Failure is nonfatal and cannot undo a story save.
 * Trace: CR-0003 D2, ADR-P0-015, FR-SET-004, NFR-MA-001.
 */
export const AUDIO_PORT_OPERATIONS = Object.freeze([
  "unlock", "reconcile", "playEffect", "suspend", "dispose",
]);
export const AUDIO_STATUSES = Object.freeze(["ready", "blocked", "unavailable"]);

/** @returns {boolean} Whether all operations exist; no operation is invoked. */
export function isAudioPort(candidate) {
  return candidate !== null && typeof candidate === "object" && !Array.isArray(candidate)
    && AUDIO_PORT_OPERATIONS.every((name) => typeof candidate[name] === "function");
}

/** @throws {TypeError} INVALID_AUDIO_PORT at composition time. */
export function assertAudioPort(candidate) {
  if (isAudioPort(candidate)) return;
  const missing = AUDIO_PORT_OPERATIONS.find((name) => typeof candidate?.[name] !== "function");
  const error = new TypeError(`AudioPort${missing ? `.${missing}` : ""} must implement every operation.`);
  error.name = "AudioPortContractError";
  error.code = "INVALID_AUDIO_PORT";
  throw error;
}

/**
 * Frozen facade; invocation stays synchronous so unlock retains gesture order.
 * Unexpected adapter exceptions/rejections degrade to a typed silent outcome.
 * @param {object} implementation Structural adapter.
 * @returns {Readonly<object>} Five functions returning {status, code?} or a promise.
 */
export function createAudioPort(implementation) {
  assertAudioPort(implementation);
  const failure = () => Object.freeze({ status: "unavailable", code: "AUDIO_FAILURE" });
  const check = (result) => AUDIO_STATUSES.includes(result?.status) ? result : failure();
  return Object.freeze(Object.fromEntries(AUDIO_PORT_OPERATIONS.map((name) => [name, (...args) => {
    try {
      const result = implementation[name].apply(implementation, args);
      return result && typeof result.then === "function" ? result.then(check, failure) : check(result);
    } catch { return failure(); }
  }])));
}

/**
 * Check the accepted, JSON-only desired state at the composition boundary.
 * @param {unknown} value
 * @returns {boolean} Invalid desires must fail silently, without partial changes.
 */
export function isAudioDesiredState(value) {
  const plain = (object, keys) => object !== null && typeof object === "object"
    && [Object.prototype, null].includes(Object.getPrototypeOf(object))
    && Reflect.ownKeys(object).every((key) => keys.includes(key)
      && Object.hasOwn(Object.getOwnPropertyDescriptor(object, key), "value"));
  const identifier = (id) => typeof id === "string" && id.length <= 96
    && /^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)*$/.test(id);
  return plain(value, ["sessionId", "bgmAssetId", "ambientAssetId", "volumes", "reducedIntensity"])
    && (value.sessionId === null || (typeof value.sessionId === "string" && value.sessionId.length > 0 && value.sessionId.length <= 128))
    && ["bgmAssetId", "ambientAssetId"].every((key) => value[key] === undefined || identifier(value[key]))
    && typeof value.reducedIntensity === "boolean"
    && plain(value.volumes, ["master", "music", "ambience", "effects"])
    && ["master", "music", "ambience", "effects"].every((key) => Number.isFinite(value.volumes[key])
      && value.volumes[key] >= 0 && value.volumes[key] <= 1);
}
