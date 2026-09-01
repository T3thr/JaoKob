/**
 * Runtime-equivalent validation for the current JaoKob Save Envelope schema.
 *
 * The project intentionally has no runtime JSON Schema dependency. This module
 * therefore mirrors the strict fields and bounds in save-state.schema.json and
 * the referenced common definitions that are required at the LocalStorage
 * trust boundary. Content-reference validation remains an application/data
 * integration concern and can be supplied to the persistence adapter as an
 * additional validator.
 *
 * Trace: FR-SAV-001, FR-SAV-003, FR-SAV-004, NFR-SE-002.
 */

export const CURRENT_SAVE_FORMAT_VERSION = 1;

const MAX_SAFE_REVISION = Number.MAX_SAFE_INTEGER;
const IDENTIFIER_PATTERN = /^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)*$/;
const SEMANTIC_VERSION_PATTERN = /^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;
const LOCALE_PATTERN = /^[a-z]{2,3}(?:-[A-Z][a-z]{3})?(?:-(?:[A-Z]{2}|[0-9]{3}))?$/;
const SESSION_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const DIGEST_PATTERN = /^[a-f0-9]{64}$/;
const DATE_TIME_PATTERN = /^(\d{4})-(\d{2})-(\d{2})[Tt](\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(?:[Zz]|([+-])(\d{2}):(\d{2}))$/;

const SAVE_REASONS = new Set([
  "new-game",
  "checkpoint",
  "choice-committed",
  "settings-changed",
  "lifecycle-suspend",
  "migration",
]);

const GAME_STATES = new Set([
  "Title",
  "Cutscene",
  "Exploration",
  "Decision",
  "GameOver",
  "Ending",
]);

const TEXT_SPEEDS = new Set(["slow", "normal", "fast", "instant"]);

/**
 * @typedef {Readonly<{path: string, reason: string}>} ValidationIssue
 */

/**
 * Validate one current-format Save Envelope without mutating it.
 *
 * @param {unknown} value Untrusted parsed JSON or a caller-provided envelope.
 * @returns {Readonly<{valid: true}> | Readonly<{valid: false, issue: ValidationIssue}>}
 */
export function validateSaveEnvelope(value) {
  const issue = validateEnvelope(value, "$", new Set());
  return issue === null
    ? Object.freeze({ valid: true })
    : Object.freeze({ valid: false, issue: Object.freeze(issue) });
}

function validateEnvelope(value, path, ancestors) {
  const recordIssue = validateRecord(
    value,
    path,
    [
      "saveFormatVersion",
      "contentVersion",
      "revision",
      "createdAt",
      "savedAt",
      "reason",
      "payload",
      "settings",
    ],
    ["integrity"],
    ancestors,
  );
  if (recordIssue !== null) return recordIssue;

  if (value.saveFormatVersion !== CURRENT_SAVE_FORMAT_VERSION) {
    return invalid(`${path}.saveFormatVersion`, "UNSUPPORTED_SAVE_FORMAT");
  }
  if (!isSemanticVersion(value.contentVersion)) {
    return invalid(`${path}.contentVersion`, "INVALID_SEMANTIC_VERSION");
  }
  if (!isIntegerBetween(value.revision, 1, MAX_SAFE_REVISION)) {
    return invalid(`${path}.revision`, "OUT_OF_RANGE_INTEGER");
  }
  if (!isDateTime(value.createdAt)) {
    return invalid(`${path}.createdAt`, "INVALID_DATE_TIME");
  }
  if (!isDateTime(value.savedAt)) {
    return invalid(`${path}.savedAt`, "INVALID_DATE_TIME");
  }
  if (!SAVE_REASONS.has(value.reason)) {
    return invalid(`${path}.reason`, "UNKNOWN_SAVE_REASON");
  }

  const payloadIssue = validatePayload(value.payload, `${path}.payload`, ancestors);
  if (payloadIssue !== null) return payloadIssue;

  const settingsIssue = validateSettings(value.settings, `${path}.settings`, ancestors);
  if (settingsIssue !== null) return settingsIssue;

  if (Object.hasOwn(value, "integrity")) {
    return validateIntegrity(value.integrity, `${path}.integrity`, ancestors);
  }
  return null;
}

function validatePayload(value, path, ancestors) {
  const recordIssue = validateRecord(
    value,
    path,
    [
      "sessionId",
      "startedAt",
      "playTimeMs",
      "state",
      "currentTreeId",
      "currentNodeId",
      "checkpoint",
      "metrics",
      "flags",
      "eventOccurrences",
      "progress",
      "history",
      "rng",
    ],
    [],
    ancestors,
  );
  if (recordIssue !== null) return recordIssue;

  if (typeof value.sessionId !== "string" || !SESSION_ID_PATTERN.test(value.sessionId)) {
    return invalid(`${path}.sessionId`, "INVALID_SESSION_ID");
  }
  if (!isDateTime(value.startedAt)) {
    return invalid(`${path}.startedAt`, "INVALID_DATE_TIME");
  }
  if (!isIntegerBetween(value.playTimeMs, 0, 315576000000)) {
    return invalid(`${path}.playTimeMs`, "OUT_OF_RANGE_INTEGER");
  }
  if (!GAME_STATES.has(value.state)) {
    return invalid(`${path}.state`, "UNKNOWN_GAME_STATE");
  }
  if (!isIdentifier(value.currentTreeId)) {
    return invalid(`${path}.currentTreeId`, "INVALID_IDENTIFIER");
  }
  if (!isIdentifier(value.currentNodeId)) {
    return invalid(`${path}.currentNodeId`, "INVALID_IDENTIFIER");
  }

  const validators = [
    () => validateCheckpoint(value.checkpoint, `${path}.checkpoint`, ancestors),
    () => validateMetrics(value.metrics, `${path}.metrics`, ancestors),
    () => validateArray(value.flags, `${path}.flags`, 5000, validateFlag, ancestors),
    () => validateArray(
      value.eventOccurrences,
      `${path}.eventOccurrences`,
      5000,
      validateEventOccurrence,
      ancestors,
    ),
    () => validateProgress(value.progress, `${path}.progress`, ancestors),
    () => validateArray(value.history, `${path}.history`, 200, validateHistoryEntry, ancestors),
    () => validateRng(value.rng, `${path}.rng`, ancestors),
  ];
  return firstIssue(validators);
}

function validateCheckpoint(value, path, ancestors) {
  const recordIssue = validateRecord(
    value,
    path,
    [
      "id",
      "capturedAt",
      "treeId",
      "nodeId",
      "state",
      "metrics",
      "flags",
      "eventOccurrences",
      "rng",
    ],
    [],
    ancestors,
  );
  if (recordIssue !== null) return recordIssue;

  if (!isIdentifier(value.id)) return invalid(`${path}.id`, "INVALID_IDENTIFIER");
  if (!isDateTime(value.capturedAt)) {
    return invalid(`${path}.capturedAt`, "INVALID_DATE_TIME");
  }
  if (!isIdentifier(value.treeId)) return invalid(`${path}.treeId`, "INVALID_IDENTIFIER");
  if (!isIdentifier(value.nodeId)) return invalid(`${path}.nodeId`, "INVALID_IDENTIFIER");
  if (!GAME_STATES.has(value.state)) {
    return invalid(`${path}.state`, "UNKNOWN_GAME_STATE");
  }

  return firstIssue([
    () => validateMetrics(value.metrics, `${path}.metrics`, ancestors),
    () => validateArray(value.flags, `${path}.flags`, 5000, validateFlag, ancestors),
    () => validateArray(
      value.eventOccurrences,
      `${path}.eventOccurrences`,
      5000,
      validateEventOccurrence,
      ancestors,
    ),
    () => validateRng(value.rng, `${path}.rng`, ancestors),
  ]);
}

function validateMetrics(value, path, ancestors) {
  const recordIssue = validateRecord(
    value,
    path,
    ["hp", "sanity", "bond"],
    [],
    ancestors,
  );
  if (recordIssue !== null) return recordIssue;

  for (const metric of ["hp", "sanity", "bond"]) {
    if (!isIntegerBetween(value[metric], 0, 100)) {
      return invalid(`${path}.${metric}`, "OUT_OF_RANGE_INTEGER");
    }
  }
  return null;
}

function validateFlag(value, path, ancestors) {
  const recordIssue = validateRecord(value, path, ["id", "value"], [], ancestors);
  if (recordIssue !== null) return recordIssue;
  if (!isIdentifier(value.id)) return invalid(`${path}.id`, "INVALID_IDENTIFIER");

  const flagValue = value.value;
  if (typeof flagValue === "boolean") return null;
  if (isIntegerBetween(flagValue, -1000000, 1000000)) return null;
  if (typeof flagValue === "string" && codePointLength(flagValue) <= 240) return null;
  return invalid(`${path}.value`, "INVALID_FLAG_VALUE");
}

function validateEventOccurrence(value, path, ancestors) {
  const recordIssue = validateRecord(value, path, ["eventId", "count"], [], ancestors);
  if (recordIssue !== null) return recordIssue;
  if (!isIdentifier(value.eventId)) {
    return invalid(`${path}.eventId`, "INVALID_IDENTIFIER");
  }
  return isIntegerBetween(value.count, 1, 1000)
    ? null
    : invalid(`${path}.count`, "OUT_OF_RANGE_INTEGER");
}

function validateProgress(value, path, ancestors) {
  const recordIssue = validateRecord(
    value,
    path,
    ["completedNodeIds", "viewedDialogueIds", "unlockedEndingIds"],
    [],
    ancestors,
  );
  if (recordIssue !== null) return recordIssue;

  return firstIssue([
    () => validateIdentifierArray(value.completedNodeIds, `${path}.completedNodeIds`, 10000),
    () => validateIdentifierArray(value.viewedDialogueIds, `${path}.viewedDialogueIds`, 10000),
    () => validateIdentifierArray(value.unlockedEndingIds, `${path}.unlockedEndingIds`, 128),
  ]);
}

function validateIdentifierArray(value, path, maxItems) {
  if (!Array.isArray(value)) return invalid(path, "EXPECTED_ARRAY");
  if (value.length > maxItems) return invalid(path, "TOO_MANY_ITEMS");

  const identifiers = new Set();
  for (let index = 0; index < value.length; index += 1) {
    const identifier = value[index];
    if (!isIdentifier(identifier)) {
      return invalid(`${path}[${index}]`, "INVALID_IDENTIFIER");
    }
    if (identifiers.has(identifier)) {
      return invalid(`${path}[${index}]`, "DUPLICATE_ITEM");
    }
    identifiers.add(identifier);
  }
  return null;
}

function validateHistoryEntry(value, path, ancestors) {
  const recordIssue = validateRecord(
    value,
    path,
    ["sequence", "nodeId", "actionId", "committedAt", "metricsAfter"],
    [],
    ancestors,
  );
  if (recordIssue !== null) return recordIssue;

  if (!isIntegerBetween(value.sequence, 1, MAX_SAFE_REVISION)) {
    return invalid(`${path}.sequence`, "OUT_OF_RANGE_INTEGER");
  }
  if (!isIdentifier(value.nodeId)) return invalid(`${path}.nodeId`, "INVALID_IDENTIFIER");
  if (!isIdentifier(value.actionId)) {
    return invalid(`${path}.actionId`, "INVALID_IDENTIFIER");
  }
  if (!isDateTime(value.committedAt)) {
    return invalid(`${path}.committedAt`, "INVALID_DATE_TIME");
  }
  return validateMetrics(value.metricsAfter, `${path}.metricsAfter`, ancestors);
}

function validateRng(value, path, ancestors) {
  const recordIssue = validateRecord(value, path, ["algorithm", "seed", "state"], [], ancestors);
  if (recordIssue !== null) return recordIssue;
  if (value.algorithm !== "xorshift32-v1") {
    return invalid(`${path}.algorithm`, "UNKNOWN_RNG_ALGORITHM");
  }
  if (!isIntegerBetween(value.seed, 1, 4294967295)) {
    return invalid(`${path}.seed`, "OUT_OF_RANGE_INTEGER");
  }
  return isIntegerBetween(value.state, 1, 4294967295)
    ? null
    : invalid(`${path}.state`, "OUT_OF_RANGE_INTEGER");
}

function validateSettings(value, path, ancestors) {
  const required = [
    "locale",
    "textSpeed",
    "fontScale",
    "reducedMotion",
    "highContrast",
    "storyAssist",
    "immersiveUi",
    "confirmHighImpactChoices",
    "typewriterEffect",
    "autoAdvance",
    "masterVolume",
    "musicVolume",
    "ambienceVolume",
    "effectsVolume",
    "reducedIntensityAudio",
  ];
  const recordIssue = validateRecord(value, path, required, [], ancestors);
  if (recordIssue !== null) return recordIssue;

  if (typeof value.locale !== "string" || !LOCALE_PATTERN.test(value.locale)) {
    return invalid(`${path}.locale`, "INVALID_LOCALE");
  }
  if (!TEXT_SPEEDS.has(value.textSpeed)) {
    return invalid(`${path}.textSpeed`, "UNKNOWN_TEXT_SPEED");
  }
  if (!isNumberBetween(value.fontScale, 0.875, 2)) {
    return invalid(`${path}.fontScale`, "OUT_OF_RANGE_NUMBER");
  }

  for (const field of [
    "reducedMotion",
    "highContrast",
    "storyAssist",
    "immersiveUi",
    "confirmHighImpactChoices",
    "typewriterEffect",
    "autoAdvance",
    "reducedIntensityAudio",
  ]) {
    if (typeof value[field] !== "boolean") {
      return invalid(`${path}.${field}`, "EXPECTED_BOOLEAN");
    }
  }

  for (const field of [
    "masterVolume",
    "musicVolume",
    "ambienceVolume",
    "effectsVolume",
  ]) {
    if (!isNumberBetween(value[field], 0, 1)) {
      return invalid(`${path}.${field}`, "OUT_OF_RANGE_NUMBER");
    }
  }
  return null;
}

function validateIntegrity(value, path, ancestors) {
  const recordIssue = validateRecord(
    value,
    path,
    ["algorithm", "canonicalization", "digest"],
    [],
    ancestors,
  );
  if (recordIssue !== null) return recordIssue;
  if (value.algorithm !== "sha-256") {
    return invalid(`${path}.algorithm`, "UNKNOWN_INTEGRITY_ALGORITHM");
  }
  if (value.canonicalization !== "jaokob-canonical-json-v1") {
    return invalid(`${path}.canonicalization`, "UNKNOWN_CANONICALIZATION");
  }
  return typeof value.digest === "string" && DIGEST_PATTERN.test(value.digest)
    ? null
    : invalid(`${path}.digest`, "INVALID_DIGEST");
}

function validateArray(value, path, maxItems, itemValidator, ancestors) {
  if (!Array.isArray(value)) return invalid(path, "EXPECTED_ARRAY");
  if (value.length > maxItems) return invalid(path, "TOO_MANY_ITEMS");

  for (let index = 0; index < value.length; index += 1) {
    const issue = itemValidator(value[index], `${path}[${index}]`, ancestors);
    if (issue !== null) return issue;
  }
  return null;
}

function validateRecord(value, path, required, optional, ancestors) {
  if (!isRecord(value)) return invalid(path, "EXPECTED_OBJECT");
  if (ancestors.has(value)) return invalid(path, "CYCLIC_VALUE");

  const allowed = new Set([...required, ...optional]);
  for (const field of required) {
    if (!Object.hasOwn(value, field)) return invalid(`${path}.${field}`, "MISSING_REQUIRED_FIELD");
  }
  for (const field of Object.keys(value)) {
    if (!allowed.has(field)) return invalid(`${path}.${field}`, "UNKNOWN_FIELD");
  }
  return null;
}

function firstIssue(validators) {
  for (const validator of validators) {
    const issue = validator();
    if (issue !== null) return issue;
  }
  return null;
}

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isIdentifier(value) {
  return typeof value === "string"
    && codePointLength(value) >= 1
    && codePointLength(value) <= 96
    && IDENTIFIER_PATTERN.test(value);
}

function isSemanticVersion(value) {
  return typeof value === "string" && SEMANTIC_VERSION_PATTERN.test(value);
}

function isIntegerBetween(value, minimum, maximum) {
  return Number.isInteger(value) && value >= minimum && value <= maximum;
}

function isNumberBetween(value, minimum, maximum) {
  return typeof value === "number"
    && Number.isFinite(value)
    && value >= minimum
    && value <= maximum;
}

function isDateTime(value) {
  if (typeof value !== "string") return false;
  const match = DATE_TIME_PATTERN.exec(value);
  if (match === null) return false;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const second = Number(match[6]);
  const offsetHour = match[8] === undefined ? 0 : Number(match[8]);
  const offsetMinute = match[9] === undefined ? 0 : Number(match[9]);

  return month >= 1
    && month <= 12
    && day >= 1
    && day <= daysInMonth(year, month)
    && hour <= 23
    && minute <= 59
    && second <= 59
    && offsetHour <= 23
    && offsetMinute <= 59;
}

function daysInMonth(year, month) {
  if (month === 2) return isLeapYear(year) ? 29 : 28;
  return [4, 6, 9, 11].includes(month) ? 30 : 31;
}

function isLeapYear(year) {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

function codePointLength(value) {
  return Array.from(value).length;
}

function invalid(path, reason) {
  return { path, reason };
}
