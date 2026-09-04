/**
 * Content trust boundary: strict local schemas, semantic policies and references.
 * Does not execute effects, evaluate gameplay guards, render, fetch or persist.
 * Trace: FR-CNT-001/002/004/005, DR-001..012, CR-0002 D1/D2/D4, ADR-P0-013.
 */
import { CONTENT_SCHEMA_CATALOG } from "./content-schema-catalog.js";
import { createContentSchemaValidator } from "./content-schema-validator.js";
import { contentFailure, copyJsonData, deepFreeze } from "./content-values.js";

const SCHEMA_ROOT = "https://t3thr.github.io/JaoKob/specs/schemas/";
const IDENTIFIER = /^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)*$/;

/**
 * Validate and defensively copy one package. testReferenceIds is a separately
 * reviewed catalog, never derived from the package under validation.
 * @param {unknown} input
 * @param {{testReferenceIds?: readonly string[], expectedContentVersion?: string}} [options]
 * @returns {Readonly<{valid: true, packageData: object}> | Readonly<{valid: false, errors: readonly {path:string, code:string, message:string}[]}>}
 */
export function validateContentPackage(input, options = {}) {
  const copied = copyJsonData(input);
  if (!copied.valid) return copied;
  const data = copied.value;
  if (data === null || typeof data !== "object" || Array.isArray(data)) {
    return contentFailure("$", "CONTENT_SCHEMA", "Expected a content package object.");
  }
  if (!Object.hasOwn(data, "schemaVersion")) {
    return contentFailure("$.schemaVersion", "CONTENT_SCHEMA", "Required schema version is missing.");
  }
  if (!["1.0.0", "1.1.0"].includes(data.schemaVersion)) {
    return contentFailure("$.schemaVersion", "CONTENT_VERSION", "Unsupported package schema version.");
  }
  for (const name of ["characters", "dialogues", "events"]) {
    const version = data[name]?.schemaVersion;
    if (version !== undefined && version !== "1.0.0") return contentFailure(`$.${name}.schemaVersion`, "CONTENT_VERSION", "Unsupported catalog schema version.");
  }
  if (Array.isArray(data.narrativeTrees)) {
    for (const [i, tree] of data.narrativeTrees.entries()) {
      if (tree?.schemaVersion !== undefined && tree.schemaVersion !== data.schemaVersion) {
        return contentFailure(`$.narrativeTrees[${i}].schemaVersion`, "CONTENT_VERSION", "Tree and package schema versions must match.");
      }
    }
  }
  const schema = createContentSchemaValidator(CONTENT_SCHEMA_CATALOG);
  const schemaId = `${SCHEMA_ROOT}${data.schemaVersion === "1.1.0" ? "v1.1.0/" : ""}content-package.schema.json`;
  const structural = schema.validate(data, schemaId);
  if (structural.errors.length) return deepFreeze({ valid: false, errors: structural.errors });
  const errors = [];
  const add = (path, code, message) => errors.push({ path, code, message });
  const semantic = (path, message) => add(path, "CONTENT_SEMANTIC", message);
  if (options.expectedContentVersion !== undefined && data.contentVersion !== options.expectedContentVersion) {
    add("$.contentVersion", "CONTENT_VERSION", "Package content version does not match the requested version.");
  }
  const catalogs = collectContentRecords(data);
  const globalIds = new Set();
  const namespaces = Object.create(null);
  for (const [namespace, entries] of Object.entries(catalogs)) {
    const ids = new Map();
    namespaces[namespace] = ids;
    for (const entry of entries) {
      if (globalIds.has(entry.id)) add(entry.path, "CONTENT_DUPLICATE_ID", "Content identifiers must be unique across records.");
      else globalIds.add(entry.id);
      ids.set(entry.id, entry);
    }
  }
  const testIds = options.testReferenceIds ?? [];
  if (!Array.isArray(testIds) || testIds.some((id) => typeof id !== "string" || id.length > 96 || !IDENTIFIER.test(id))
    || new Set(testIds).size !== testIds.length) {
    add("$options.testReferenceIds", "CONTENT_REFERENCE", "Expected a unique catalog of valid test identifiers.");
  }
  namespaces["test-case.id"] = new Map(Array.isArray(testIds) ? testIds.map((id) => [id, true]) : []);
  for (const ref of structural.references) {
    if (!namespaces[ref.namespace]?.has(ref.value)) {
      add(ref.path, "CONTENT_REFERENCE", "Reference does not resolve in its declared namespace.");
    }
  }
  for (const { value, path } of structural.localized) {
    if (typeof value.th === "string" && !value.th.trim()) semantic(`${path}.th`, "Thai text must not be blank.");
    if (Array.isArray(value.th) && Object.values(value).some((list) => list.length !== value.th.length)) {
      semantic(path, "Localized lists must have equivalent item counts.");
    }
    for (const [locale, text] of Object.entries(value)) {
      for (const line of Array.isArray(text) ? text : [text]) {
        if (/<\s*\/?\s*[a-z][^>]*>|javascript\s*:/i.test(line)) semantic(`${path}.${locale}`, "Executable markup is not allowed in content text.");
      }
    }
  }
  if (!data.supportedLocales.includes(data.gameDefaults.settings.locale)) {
    semantic("$.gameDefaults.settings.locale", "Default settings locale must be supported by this package.");
  }
  for (const [i, def] of data.flagDefinitions.entries()) validateFlagDefinition(def, `$.flagDefinitions[${i}]`, add);
  const flagDefinitions = new Map(data.flagDefinitions.map((def) => [def.id, def]));
  const nodeEntries = catalogs["narrative-node.id"];
  const nodeById = new Map(nodeEntries.map((entry) => [entry.id, entry]));
  const checkedCutscenes = new Set();

  for (const [ti, tree] of data.narrativeTrees.entries()) {
    if (tree.schemaVersion !== data.schemaVersion) add(`$.narrativeTrees[${ti}].schemaVersion`, "CONTENT_VERSION", "Tree and package schema versions must match.");
    if (!tree.nodes.some((n) => n.id === tree.entryNodeId)) add(`$.narrativeTrees[${ti}].entryNodeId`, "CONTENT_REFERENCE", "Tree entry must belong to that tree.");
  }
  for (const { value: node, path } of nodeEntries) {
    if ((node.checkpointPolicy === "none") === Object.hasOwn(node, "checkpointId")) {
      semantic(`${path}.checkpointId`, "Checkpoint ID must match the node checkpoint policy.");
    }
    validateCondition(node.entryCondition, `${path}.entryCondition`, flagDefinitions, add);
    validateEffects(node.onEnterEffects, `${path}.onEnterEffects`, node, flagDefinitions, add);
    if (node.completion) {
      const flag = flagDefinitions.get(node.completion.flagId);
      if (flag?.policy?.kind !== "marker" || flag.valueType !== "boolean"
        || !node.onEnterEffects.some((e) => e.type === "set-flag" && e.flagId === flag.id && e.value === true)) {
        semantic(`${path}.completion.flagId`, "Rest completion requires an on-enter monotonic boolean marker.");
      }
    }
    for (const kind of ["choices", "interactions"]) {
      for (const [i, action] of (node[kind] ?? []).entries()) {
        const at = `${path}.${kind}[${i}]`;
        if (action.unavailableBehavior === "disabled" && !action.disabledReason) semantic(`${at}.disabledReason`, "Disabled actions require a localized reason.");
        validateCondition(action.condition, `${at}.condition`, flagDefinitions, add);
        validateEffects(action.effects, `${at}.effects`, node, flagDefinitions, add);
      }
    }
    if (node.type === "cutscene" && node.nextNodeId && !checkedCutscenes.has(node.id)) {
      // Critical startup subset only. Full condition/state reachability is Task 3.
      const seen = new Set([node.id]);
      let next = nodeById.get(node.nextNodeId)?.value;
      while (next?.type === "cutscene" && next.entryCondition.kind === "always" && next.nextNodeId) {
        if (seen.has(next.id)) { semantic(`${path}.nextNodeId`, "Unconditional Cutscene cycle has no resting boundary."); break; }
        if (checkedCutscenes.has(next.id)) break;
        seen.add(next.id);
        next = nodeById.get(next.nextNodeId)?.value;
      }
      for (const id of seen) checkedCutscenes.add(id);
    }
  }
  for (const [i, event] of data.events.events.entries()) {
    const at = `$.events.events[${i}]`;
    validateCondition(event.conditions, `${at}.conditions`, flagDefinitions, add);
    const owner = event.trigger.type === "node-entered" ? nodeById.get(event.trigger.nodeId)?.value : undefined;
    validateEffects(event.resolution.effects, `${at}.resolution.effects`, owner, flagDefinitions, add);
  }
  if (errors.length) {
    const unique = [...new Map(errors.map((error) => [`${error.path}|${error.code}|${error.message}`, error])).values()];
    return deepFreeze({ valid: false, errors: unique });
  }
  return deepFreeze({ valid: true, packageData: data });
}

/** Collect declarations only; references never create their own targets. */
export function collectContentRecords(data) {
  const result = Object.create(null);
  const add = (namespace, id, value, path) => {
    (result[namespace] ??= []).push({ id, value, path });
  };
  const lists = [
    ["character.id", data.characters.characters, "$.characters.characters"],
    ["dialogue.id", data.dialogues.dialogues, "$.dialogues.dialogues"],
    ["event.id", data.events.events, "$.events.events"],
    ["flag.id", data.flagDefinitions, "$.flagDefinitions"],
    ["content-warning.id", data.contentWarnings, "$.contentWarnings"],
    ["asset.id", data.assets, "$.assets"],
  ];
  for (const [ns, entries, path] of lists) {
    result[ns] = [];
    entries.forEach((entry, i) => add(ns, entry.id, entry, `${path}[${i}].id`));
  }
  for (const ns of ["narrative-tree.treeId", "narrative-node.id", "choice.id", "interaction.id", "checkpoint.id"]) result[ns] = [];
  data.narrativeTrees.forEach((tree, ti) => {
    const treePath = `$.narrativeTrees[${ti}]`;
    add("narrative-tree.treeId", tree.treeId, tree, `${treePath}.treeId`);
    tree.nodes.forEach((node, ni) => {
      const path = `${treePath}.nodes[${ni}]`;
      add("narrative-node.id", node.id, node, path);
      if (node.checkpointId) add("checkpoint.id", node.checkpointId, node, `${path}.checkpointId`);
      for (const [key, ns] of [["choices", "choice.id"], ["interactions", "interaction.id"]]) {
        (node[key] ?? []).forEach((action, i) => add(ns, action.id, action, `${path}.${key}[${i}].id`));
      }
    });
  });
  return result;
}

function validateFlagDefinition(def, path, add) {
  const fail = (at, message) => add(`${path}.${at}`, "CONTENT_FLAG_POLICY", message);
  if (!isFlagType(def.defaultValue, def.valueType)) fail("defaultValue", "Flag default must match valueType.");
  const p = def.policy;
  if (!p) {
    if (def.valueType !== "boolean" || ["story.storm_survived", "story.act1_complete"].includes(def.id)) {
      fail("policy", "This flag requires an explicit versioned semantic policy.");
    }
    return;
  }
  const expected = { boolean: "boolean", marker: "boolean", enum: "string", counter: "integer" }[p.kind];
  if (expected !== def.valueType) fail("policy.kind", "Flag policy does not match valueType.");
  if (p.kind === "marker" && def.defaultValue !== false) fail("defaultValue", "Story markers must initially be false.");
  if (p.kind === "enum" && !p.values.includes(def.defaultValue)) fail("defaultValue", "Enum default must be allowed.");
  if (p.kind === "counter") {
    if (p.min > p.max || (p.monotonic && p.reversible)) fail("policy", "Counter bounds/reversibility are inconsistent.");
    if (def.defaultValue < p.min || def.defaultValue > p.max) fail("defaultValue", "Counter default is outside its bounds.");
  }
  if (def.id === "exploration.safe_observations" && (def.defaultValue !== 0 || p.kind !== "counter"
    || p.min !== 0 || p.max !== 20 || p.overflow !== "saturate" || !p.monotonic || p.reversible)) {
    fail("policy", "Safe observations require the approved monotonic 0-20 saturating policy.");
  }
  if (def.id === "memory.home_focus" && (def.defaultValue !== "unset" || p.kind !== "enum"
    || p.values.length !== 4 || !["unset", "mother", "roots", "siblings"].every((v) => p.values.includes(v)))) {
    fail("policy", "Home focus requires the approved default and three selectable values.");
  }
  if (["story.storm_survived", "story.act1_complete"].includes(def.id) && p.kind !== "marker") {
    fail("policy", "Story completion flags require monotonic marker policy.");
  }
}

function validateCondition(condition, path, definitions, add) {
  for (const group of ["all", "any"]) {
    condition[group]?.forEach((c, i) => validateCondition(c, `${path}.${group}[${i}]`, definitions, add));
  }
  if (condition.not) validateCondition(condition.not, `${path}.not`, definitions, add);
  if (condition.kind === "flag" && Object.hasOwn(condition, "value")) {
    validateFlagValue(condition.value, definitions.get(condition.flagId), `${path}.value`, add);
  }
}

function validateFlagValue(value, def, path, add) {
  if (!def) return; // The reference pass reports missing definitions.
  const p = def.policy;
  if (!isFlagType(value, def.valueType) || (p?.kind === "enum" && !p.values.includes(value))
    || (p?.kind === "counter" && (value < p.min || value > p.max))) {
    add(path, "CONTENT_FLAG_POLICY", "Flag value violates its type or policy.");
  }
}

function validateEffects(effects, path, node, definitions, add) {
  const metrics = new Map();
  const flags = new Set();
  let checkpointCount = 0;
  effects.forEach((effect, i) => {
    const at = `${path}[${i}]`;
    const fail = (message, code = "CONTENT_SEMANTIC") => add(at, code, message);
    if (effect.metric) {
      const previous = metrics.get(effect.metric);
      if (previous && (previous === "set-metric" || effect.type === "set-metric")) fail("Conflicting metric effects in one transaction.");
      metrics.set(effect.metric, effect.type);
      if (node?.act === 1 && effect.metric === "bond" && (effect.amount ?? effect.value) !== 0) fail("Act 1 content cannot change Bond.");
    }
    if (effect.type === "set-checkpoint") {
      checkpointCount += 1;
      if (checkpointCount > 1 || !node || node.checkpointPolicy === "none" || effect.checkpointId !== node.checkpointId) fail("Checkpoint effect must match one owning node policy.");
    }
    if (!effect.flagId) return;
    if (flags.has(effect.flagId)) fail("Conflicting flag effects in one transaction.");
    flags.add(effect.flagId);
    const def = definitions.get(effect.flagId);
    if (!def) return;
    const p = def.policy;
    if (effect.type === "set-flag") {
      validateFlagValue(effect.value, def, `${at}.value`, add);
      if ((p?.kind === "marker" && effect.value !== true) || (p?.kind === "counter" && p.monotonic)) {
        fail("Monotonic flags cannot be reset or assigned by content.", "CONTENT_FLAG_POLICY");
      }
    }
    if (effect.type === "clear-flag" && p?.reversible !== true) fail("Flag has no explicit reversible policy.", "CONTENT_FLAG_POLICY");
    if (effect.type === "adjust-flag" && (def.valueType !== "integer" || p?.kind !== "counter"
      || (p.monotonic && effect.amount < 0))) fail("Counter adjustment violates its policy.", "CONTENT_FLAG_POLICY");
  });
}

function isFlagType(value, type) {
  return type === "integer" ? Number.isInteger(value) : typeof value === type;
}
