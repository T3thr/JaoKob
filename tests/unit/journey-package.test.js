import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { canonicalJson, digestJson, sha256Hex, utf8ByteLength } from "../../src/data/validation/content-digest.js";
import { HOST_PACKAGE_ID, JOURNEY_PACKAGE_ERROR_CODES as CODES, admitJourneyPackage, identityKey } from "../../src/data/content/journey-package.js";
import { journeySaveKeys } from "../../src/data/persistence/journey-save-repository.js";
import { loadAct1Package } from "../helpers/journey-driver.js";
import { loadMini } from "../helpers/journey-storage.js";

/** Trace: TC-S5-PACKAGE-001, ADR-P0-034 D1/D4/D6/D7, CR-0006 §2, SSOT §3.1/§3.5. */
const reference = (text) => createHash("sha256").update(text, "utf8").digest("hex");
const rejected = (result, code, reason) => {
  assert.equal(result.ok, false);
  assert.equal(result.error.code, code);
  if (reason !== undefined) assert.equal(result.error.details.reason, reason);
  assert.ok(Object.isFrozen(result.error.details));
};

// ---------------------------------------------------------------------------------------
// Digest and canonical form
// ---------------------------------------------------------------------------------------
test("TC-S5-SAVE-002 SHA-256 matches FIPS 180-4 vectors and node:crypto at every block boundary and in Thai", () => {
  assert.equal(sha256Hex("abc"), "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
  assert.equal(sha256Hex(""), "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");
  const samples = ["เจ้ากบ ต.♡ป.", "🐸 เปี๊ยก", "x".repeat(70000)];
  for (let length = 0; length <= 130; length += 1) samples.push("a".repeat(length));
  for (const text of samples) assert.equal(sha256Hex(text), reference(text), `length ${text.length}`);
  assert.throws(() => sha256Hex(42), TypeError);
});

test("TC-S5-SAVE-002 jaokob-canonical-json-v1 sorts keys, drops whitespace and rejects what is not JSON", () => {
  assert.equal(canonicalJson({ b: 1, a: [true, null, "x"], "é": 0.5, c: { z: -0, y: 1e21 } }), '{"a":[true,null,"x"],"b":1,"c":{"y":1e+21,"z":0},"é":0.5}');
  assert.equal(digestJson({ a: 1, b: { c: [1, 2] } }), digestJson(JSON.parse('{ "b": { "c": [1, 2] }, "a": 1 }')));
  assert.equal(canonicalJson(Object.assign(Object.create(null), { k: "v" })), '{"k":"v"}');
  for (const bad of [undefined, Number.NaN, Infinity, () => 1, new Date(0), [undefined], { k: undefined }, 10n]) {
    assert.throws(() => canonicalJson(bad), TypeError);
  }
  let deep = [];
  for (let i = 0; i < 300; i += 1) deep = [deep];
  assert.throws(() => canonicalJson(deep), TypeError);
  assert.equal(utf8ByteLength("กบ🐸"), 10);
});

// ---------------------------------------------------------------------------------------
// Admission
// ---------------------------------------------------------------------------------------
test("TC-S5-PACKAGE-001 the Act 1 package is admitted with a frozen composite identity and a key-order-free digest", () => {
  const raw = loadAct1Package();
  const result = admitJourneyPackage(raw);
  assert.equal(result.ok, true, JSON.stringify(result.error));
  const { identity, package: pkg } = result.value;
  assert.deepEqual({ ...identity }, {
    profile: "journey", schemaVersion: "3.0.0", id: HOST_PACKAGE_ID, contentVersion: "0.1.0",
    digest: reference(canonicalJson(raw)), key: "journey:story.jaokob.core@0.1.0",
  });
  assert.equal(identityKey(identity), identity.key);
  assert.ok(Object.isFrozen(identity) && Object.isFrozen(pkg.nodes[0]));
  assert.notEqual(pkg, raw, "admission copies its input");
  const reverseKeys = (value) => (Array.isArray(value) ? value.map(reverseKeys)
    : value !== null && typeof value === "object" ? Object.fromEntries(Object.keys(value).reverse().map((key) => [key, reverseKeys(value[key])])) : value);
  const reordered = reverseKeys(raw);
  assert.notEqual(JSON.stringify(reordered), JSON.stringify(raw));
  assert.equal(admitJourneyPackage(reordered).value.identity.digest, identity.digest);
  assert.equal(admitJourneyPackage(JSON.parse(JSON.stringify(raw, null, 4))).value.identity.digest, identity.digest);
});

test("TC-S5-PACKAGE-001 wrong data, capability, references and IDs are rejected before the Core sees the package", () => {
  const mutate = (change) => { const pkg = loadMini(); change(pkg); return admitJourneyPackage(pkg); };
  rejected(admitJourneyPackage({ ...loadMini(), nodes: [() => 1] }), CODES.INVALID, "NOT_JSON_DATA");
  rejected(admitJourneyPackage([]), CODES.INVALID, "NOT_AN_OBJECT");
  rejected(admitJourneyPackage(null), CODES.INVALID, "NOT_AN_OBJECT");
  rejected(mutate((p) => { p.profile = "story"; }), CODES.UNSUPPORTED, "PROFILE_OR_SCHEMA_VERSION");
  rejected(mutate((p) => { p.schemaVersion = "3.1.0"; }), CODES.UNSUPPORTED, "PROFILE_OR_SCHEMA_VERSION");
  rejected(mutate((p) => { p.padding = "x".repeat(2_000_001); }), CODES.INVALID, "PACKAGE_TOO_LARGE");
  rejected(mutate((p) => { delete p.lexicon; }), CODES.INVALID, "SCHEMA");
  rejected(mutate((p) => { p.nodes[0].lines[0].text = "n99.missing"; }), CODES.INVALID, "UNRESOLVED_REFERENCE");
  rejected(mutate((p) => { p.texts.push({ ...p.texts[0] }); }), CODES.INVALID, "DUPLICATE_TEXT_ID");
  rejected(mutate((p) => { p.items.push({ ...p.items[0] }); }), CODES.INVALID, "DUPLICATE_ITEM_ID");
  rejected(mutate((p) => { p.nodes.push({ ...p.nodes[0] }); }), CODES.INVALID, "DUPLICATE_NODE_ID");
  const unresolved = mutate((p) => { p.nodes[0].lines[0].text = "n99.missing"; });
  assert.match(unresolved.error.details.path, /^\$\.nodes\[0\]\.lines\[0\]\.text$/);
});

test("TC-S5-PACKAGE-001 story.jaokob.core is reserved for the host package", () => {
  rejected(admitJourneyPackage(loadAct1Package(), { role: "extension" }), CODES.RESERVED, "HOST_PACKAGE_ID");
  assert.equal(admitJourneyPackage(loadAct1Package(), { role: "host" }).ok, true);
  assert.equal(admitJourneyPackage(loadMini(), { role: "extension" }).ok, true);
});

test("TC-S5-PACKAGE-001 two packages of the same version never share an identity, a key or a save slot", () => {
  const core = admitJourneyPackage(loadAct1Package()).value.identity;
  const mini = admitJourneyPackage(loadMini()).value.identity;
  assert.equal(core.contentVersion, mini.contentVersion, "both packages are 0.1.0");
  assert.notEqual(core.key, mini.key);
  assert.notEqual(core.digest, mini.digest);
  const coreKeys = Object.values(journeySaveKeys(core.id));
  const miniKeys = Object.values(journeySaveKeys(mini.id));
  assert.equal(coreKeys.some((key) => miniKeys.includes(key)), false);
  assert.deepEqual(coreKeys, ["jaokob:journey:story.jaokob.core:canonical", "jaokob:journey:story.jaokob.core:staging", "jaokob:journey:story.jaokob.core:backup"]);

  const rebuilt = loadMini();
  rebuilt.texts[0].body = `${rebuilt.texts[0].body} อีกนิด`;
  const sameLine = admitJourneyPackage(rebuilt).value.identity;
  assert.equal(sameLine.key, mini.key, "same package and version keep the key");
  assert.notEqual(sameLine.digest, mini.digest, "a different build has a different digest");
  assert.throws(() => journeySaveKeys("Story Core"), TypeError);
});
