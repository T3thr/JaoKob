import test from "node:test";
import assert from "node:assert/strict";
import { JOURNEY_PACKAGE_ERROR_CODES as CODES, admitJourneyPackage } from "../../src/data/content/journey-package.js";
import { createContentSchemaValidator } from "../../src/data/validation/content-schema-validator.js";
import { copyJsonData } from "../../src/data/validation/content-values.js";
import { loadMini } from "../helpers/journey-storage.js";

/**
 * The project's JSON Schema 2020-12 validator and the JSON-data gate in front of it, on the
 * path the Journey uses. Moved here in C5e from `content-loader.test.js` (superseded assertion
 * register §2): the Draft 2020-12 tests as they were, and the hostile-input guards (NFR-SE-002)
 * now aimed at the Journey package admission instead of the earlier content loader.
 * Trace: ADR-P0-013, ADR-P0-034 D4, TC-S5-SCHEMA-001, TC-S5-PACKAGE-001.
 */

test("Draft 2020-12 local refs apply sibling assertions, Unicode lengths and conditional required fields", () => {
  const id = "https://example.invalid/local.schema.json";
  const checker = createContentSchemaValidator({ test: { $id: id, $defs: { word: { type: "string", minLength: 1 } }, type: "object",
    properties: { name: { $ref: "#/$defs/word", maxLength: 1 }, image: { type: "boolean" }, alt: { type: "string" } }, additionalProperties: false,
    allOf: [{ if: { properties: { image: { const: true } }, required: ["image"] }, then: { required: ["alt"] } }] } });
  assert.equal(checker.validate({ name: "🐸" }, id).errors.length, 0);
  assert.ok(checker.validate({ name: "ab" }, id).errors.length);
  assert.ok(checker.validate({ image: true }, id).errors.some((e) => e.path === "$.alt"));
  assert.equal(checker.validate({ image: false }, id).errors.length, 0);
});

test("CR-0002 D4 unknown keywords, unsupported formats and non-local refs fail closed", () => {
  for (const schema of [{ $ref: "https://external.invalid/schema" }, { unevaluatedProperties: false }, { format: "email" }]) {
    assert.throws(() => createContentSchemaValidator({ bad: { $id: "https://example.invalid/schema", ...schema } }), TypeError);
  }
});

test("Draft 2020-12 oneOf/anyOf/not/arrays enforce exact alternatives and structural uniqueness", () => {
  const id = "https://example.invalid/local.schema.json";
  const cases = [
    [{ oneOf: [{ type: "integer" }, { type: "number" }] }, 1, false],
    [{ oneOf: [{ type: "integer" }, { type: "number" }] }, 1.5, true],
    [{ anyOf: [{ type: "integer" }, { type: "number" }] }, 1, true],
    [{ not: { const: "forbidden" } }, "forbidden", false],
    [{ type: "array", minItems: 2, maxItems: 3, items: { type: "boolean" } }, [true], false],
    [{ type: "array", maxItems: 1 }, [true, false], false],
    [{ uniqueItems: true }, [{ a: 1, b: 2 }, { b: 2, a: 1 }], false],
    [{ type: "string", minLength: 2, maxLength: 2 }, "🐸ก", true],
    [{ type: "string", maxLength: 1 }, "🐸ก", false],
    [{ type: "integer" }, true, false],
    [{ type: "number", minimum: 0, maximum: 1 }, 0.5, true],
    [{ type: "object", properties: { th: { type: "string" } }, patternProperties: { "^th$": { minLength: 2 } }, additionalProperties: false }, { th: "a" }, false],
  ];
  for (const [s, value, valid] of cases) {
    const checker = createContentSchemaValidator({ test: { $id: id, ...s } });
    assert.equal(checker.validate(value, id).errors.length === 0, valid, JSON.stringify({ s, value }));
  }
  assert.throws(() => createContentSchemaValidator({ bad: { $id: id, $ref: "#/$defs/missing" } }), TypeError);
});

test("NFR-SE-002 getters, toJSON, custom prototypes, sparse arrays, cycles and forged proxies never run and never pass admission", () => {
  let called = 0;
  const getter = loadMini();
  Object.defineProperty(getter, "trap", { enumerable: true, get() { called += 1; throw new Error("ran"); } });
  const toJson = loadMini();
  toJson.toJSON = () => { called += 1; return {}; };
  const cycle = loadMini();
  cycle.extra = cycle;
  const sparse = loadMini();
  sparse.items = Array(2);
  const exotic = loadMini();
  exotic.extra = new Date(0);
  const prototyped = Object.assign(Object.create({ inherited: true }), loadMini());
  const forged = new Proxy({}, { ownKeys() { called += 1; throw { valid: true, value: { forged: true } }; } });
  for (const [name, value] of Object.entries({ getter, toJson, cycle, sparse, exotic, prototyped, forged })) {
    const result = admitJourneyPackage(value);
    assert.equal(result.ok, false, name);
    assert.equal(result.error.code, CODES.INVALID, name);
    assert.equal(result.error.details.reason, "NOT_JSON_DATA", name);
  }
  assert.equal(called, 1, "only the proxy trap the inspection must call ran, and its forged answer was ignored");
});

test("NFR-SE-002 deep or wide hostile input is bounded, and a failure never echoes the content", () => {
  let deep = loadMini();
  let cursor = deep;
  for (let i = 0; i < 120; i += 1) { cursor.extra = {}; cursor = cursor.extra; }
  const tooDeep = copyJsonData(deep);
  assert.equal(tooDeep.valid, false);
  assert.equal(tooDeep.errors[0].code, "CONTENT_LIMIT");
  assert.equal(admitJourneyPackage(deep).ok, false);
  const wide = { values: Array.from({ length: 600_000 }, () => 0) };
  assert.equal(copyJsonData(wide).errors[0].code, "CONTENT_LIMIT");
  const secret = loadMini();
  secret.package.title = "do-not-echo-this-title";
  secret.unexpected = "do-not-echo-this-value";
  const refused = admitJourneyPackage(secret);
  assert.equal(refused.ok, false);
  assert.doesNotMatch(JSON.stringify(refused), /do-not-echo/);
});

test("NFR-SE-002 a __proto__ key from parsed JSON is plain data: no pollution, and the schema refuses it", () => {
  const parsed = JSON.parse(`{"__proto__":{"polluted":true},${JSON.stringify(loadMini()).slice(1)}`);
  const copied = copyJsonData(parsed);
  assert.equal(copied.valid, true);
  assert.equal(Object.getPrototypeOf(copied.value), Object.prototype);
  assert.ok(Object.hasOwn(copied.value, "__proto__"), "kept as an own data property");
  const result = admitJourneyPackage(parsed);
  assert.equal(result.ok, false);
  assert.equal(result.error.details.reason, "SCHEMA");
  assert.equal({}.polluted, undefined);
  assert.equal(Object.prototype.polluted, undefined);
});
