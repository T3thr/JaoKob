/**
 * Draft 2020-12 assertions used by the local content catalog, not a general
 * JSON Schema implementation. $ref siblings apply; only local registry refs
 * resolve. No coercion/default insertion or executable schema/content.
 * Trace: FR-CNT-001, ADR-P0-009/013, CR-0002 D4.
 */
const KEYWORDS = Object.freeze([
  "$id", "$schema", "$defs", "$ref", "title", "description", "type", "const", "enum",
  "required", "properties", "patternProperties", "additionalProperties", "items",
  "minItems", "maxItems", "uniqueItems", "contains", "minLength", "maxLength", "pattern",
  "minimum", "maximum", "oneOf", "anyOf", "allOf", "not", "if", "then", "else", "format",
  "x-jaokob-reference",
]);

/**
 * Check trusted local schema definitions; unknown keywords/refs fail closed.
 * @param {Record<string, object>} catalog Schemas keyed by repository-relative path.
 * @returns {Readonly<{validate: Function}>}
 */
export function createContentSchemaValidator(catalog) {
  const registry = Object.create(null);
  for (const schema of Object.values(catalog)) {
    if (typeof schema.$id !== "string" || Object.hasOwn(registry, schema.$id)) {
      throw new TypeError("Schema catalog requires unique canonical IDs.");
    }
    registry[schema.$id] = schema;
  }
  Object.freeze(registry);

  function resolve(ref, base) {
    const url = new URL(ref, base);
    const fragment = decodeURIComponent(url.hash.slice(1));
    url.hash = "";
    const id = url.href;
    let schema = registry[id];
    if (schema === undefined || (fragment !== "" && !fragment.startsWith("/"))) {
      throw new TypeError("Schema reference is not registered locally.");
    }
    for (const part of fragment ? fragment.slice(1).split("/") : []) {
      const key = part.replace(/~1/g, "/").replace(/~0/g, "~");
      if (schema === null || typeof schema !== "object" || !Object.hasOwn(schema, key)) {
        throw new TypeError("Schema reference target is missing.");
      }
      schema = schema[key];
    }
    return { schema, id };
  }

  function inspect(schema, base) {
    if (typeof schema === "boolean") return;
    if (!schema || typeof schema !== "object" || Array.isArray(schema)) throw new TypeError("Invalid schema.");
    for (const key of Object.keys(schema)) {
      if (!KEYWORDS.includes(key)) throw new TypeError("Unsupported schema keyword.");
    }
    if (schema.$ref) resolve(schema.$ref, base);
    if (schema.format && schema.format !== "uri") throw new TypeError("Unsupported content format assertion.");
    if (schema.pattern) new RegExp(schema.pattern, "u");
    for (const keyword of ["properties", "patternProperties", "$defs"]) {
      for (const [key, child] of Object.entries(schema[keyword] ?? {})) {
        if (keyword === "patternProperties") new RegExp(key, "u");
        inspect(child, base);
      }
    }
    for (const keyword of ["items", "contains", "not", "if", "then", "else", "additionalProperties"]) {
      if (Object.hasOwn(schema, keyword)) inspect(schema[keyword], base);
    }
    for (const keyword of ["oneOf", "anyOf", "allOf"]) {
      for (const child of schema[keyword] ?? []) inspect(child, base);
    }
  }
  for (const schema of Object.values(registry)) inspect(schema, schema.$id);

  function validate(value, schemaId) {
    let budget = 2000000;
    function check(v, s, base, path, depth = 0) {
      if (--budget < 0 || depth > 256) throw new RangeError("Validation limit.");
      const errors = [];
      const references = [];
      const localized = [];
      const error = (at, message) => errors.push({ path: at, code: "CONTENT_SCHEMA", message });
      const merge = (r) => { errors.push(...r.errors); references.push(...r.references); localized.push(...r.localized); };
      const child = (x, sub, at = path) => check(x, sub, base, at, depth + 1);
      if (s === false) error(path, "Value is disallowed by the schema.");
      if (typeof s === "boolean") return { errors, references, localized };
      if (s.$ref) {
        const target = resolve(s.$ref, base);
        merge(check(v, target.schema, target.id, path, depth + 1));
        if (/\/\$defs\/localized(?:ShortText|Text|StringList)$/.test(s.$ref)) localized.push({ value: v, path });
      }
      if (s.type && !matchesType(v, s.type)) error(path, "Value has the wrong JSON type.");
      if (Object.hasOwn(s, "const") && !equal(v, s.const)) error(path, "Value does not match the schema constant.");
      if (s.enum && !s.enum.some((item) => equal(v, item))) error(path, "Value is outside the allowed enumeration.");
      if (typeof v === "number") {
        if (s.minimum !== undefined && v < s.minimum) error(path, "Number is below the minimum.");
        if (s.maximum !== undefined && v > s.maximum) error(path, "Number exceeds the maximum.");
      }
      if (typeof v === "string") {
        const length = Array.from(v).length;
        if (s.minLength !== undefined && length < s.minLength) error(path, "Text is too short.");
        if (s.maxLength !== undefined && length > s.maxLength) error(path, "Text is too long.");
        if (s.pattern && !new RegExp(s.pattern, "u").test(v)) error(path, "Text does not match the allowed pattern.");
        if (s.format === "uri" && !isUri(v)) error(path, "Expected an absolute URI.");
      }
      if (Array.isArray(v)) {
        if (s.minItems !== undefined && v.length < s.minItems) error(path, "Array has too few items.");
        if (s.maxItems !== undefined && v.length > s.maxItems) error(path, "Array has too many items.");
        if (s.uniqueItems) {
          const keys = v.map(canonical);
          if (new Set(keys).size !== keys.length) error(path, "Array items must be unique.");
        }
        if (s.items !== undefined) v.forEach((item, i) => merge(child(item, s.items, `${path}[${i}]`)));
        if (s.contains && !v.some((item, i) => child(item, s.contains, `${path}[${i}]`).errors.length === 0)) {
          error(path, "Array does not contain the required value.");
        }
      } else if (v !== null && typeof v === "object") {
        for (const key of s.required ?? []) {
          if (!Object.hasOwn(v, key)) error(`${path}.${key}`, "Required field is missing.");
        }
        for (const [key, item] of Object.entries(v)) {
          let matched = false;
          if (Object.hasOwn(s.properties ?? {}, key)) { matched = true; merge(child(item, s.properties[key], `${path}.${key}`)); }
          for (const [pattern, sub] of Object.entries(s.patternProperties ?? {})) {
            if (new RegExp(pattern, "u").test(key)) { matched = true; merge(child(item, sub, `${path}.${key}`)); }
          }
          if (!matched && s.additionalProperties !== undefined) merge(child(item, s.additionalProperties, `${path}.${key}`));
        }
      }
      for (const sub of s.allOf ?? []) merge(child(v, sub));
      for (const keyword of ["oneOf", "anyOf"]) {
        if (!s[keyword]) continue;
        const branches = s[keyword].map((sub) => child(v, sub));
        const valid = branches.filter((b) => b.errors.length === 0);
        if (valid.length === 0) {
          // Keep the most specific branch's paths, not a dump of all alternatives.
          merge(branches.reduce((best, b) => b.errors.length < best.errors.length ? b : best));
        } else if (keyword === "oneOf" && valid.length !== 1) {
          error(path, "Exactly one schema alternative must match.");
        } else for (const branch of valid) merge(branch);
      }
      if (s.not !== undefined && child(v, s.not).errors.length === 0) error(path, "Forbidden field combination.");
      if (s.if !== undefined) {
        const branch = child(v, s.if).errors.length === 0 ? s.then : s.else;
        if (branch !== undefined) merge(child(v, branch));
      }
      if (s["x-jaokob-reference"]) references.push({ namespace: s["x-jaokob-reference"], value: v, path });
      return { errors, references, localized };
    }
    try {
      const target = resolve(schemaId, schemaId);
      // Internal annotations reference input records. Freeze only the public
      // outcome after the outer boundary has made its defensive copy.
      return check(value, target.schema, target.id, "$");
    } catch (error) {
      return { errors: [{ path: "$", code: error instanceof RangeError ? "CONTENT_LIMIT" : "CONTENT_SCHEMA", message: "Schema validation could not complete." }], references: [], localized: [] };
    }
  }
  return Object.freeze({ validate });
}

function matchesType(value, type) {
  if (type === "object") return value !== null && typeof value === "object" && !Array.isArray(value);
  if (type === "array") return Array.isArray(value);
  if (type === "integer") return Number.isInteger(value);
  if (type === "number") return typeof value === "number" && Number.isFinite(value);
  if (type === "null") return value === null;
  return typeof value === type;
}

function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value !== null && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}
function equal(a, b) { return canonical(a) === canonical(b); }

function isUri(value) {
  if (!/^[A-Za-z][A-Za-z0-9+.-]*:/.test(value) || /[^\x21-\x7E]|[<>"{}|\\^`]|%(?![0-9A-Fa-f]{2})/.test(value)) return false;
  const rest = value.slice(value.indexOf(":") + 1);
  // Square brackets delimit IP literals only inside the authority, not paths.
  const afterAuthority = rest.startsWith("//") ? rest.slice(2).replace(/^[^/?#]*/, "") : rest;
  if (/[\[\]]/.test(afterAuthority) || (value.match(/#/g) ?? []).length > 1) return false;
  try { new URL(value); return true; } catch { return false; }
}
