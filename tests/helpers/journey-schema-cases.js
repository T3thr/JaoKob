/** Shared schema cases for the journey package and Save 2 journey profile.
 * Used by tests/unit/journey-schema.test.js (project validator) and
 * tests/schema/journey-reference.mjs (independent Ajv). Trace: TC-S5-SCHEMA-001, ADR-P0-034 D4/D7.
 */
import { readFileSync } from "node:fs";

export const SCHEMA_BASE = "https://t3thr.github.io/JaoKob/specs/schemas/v3.0.0/";
export const PACKAGE_SCHEMA_ID = `${SCHEMA_BASE}journey-package.schema.json`;
export const SAVE_SCHEMA_ID = `${SCHEMA_BASE}journey-save.schema.json`;

const read = (name) => JSON.parse(readFileSync(new URL(`../fixtures/journey/${name}`, import.meta.url), "utf8"));
export const loadMiniJourney = () => read("mini-journey.json");
export const loadJourneySave = () => read("journey-save.json");

const node = (p, id) => p.nodes.find((n) => n.id === id);

/** Each case mutates a fresh copy and must fail schema validation. */
export const packageCases = [
  ["schema version from another contract", (p) => { p.schemaVersion = "2.0.0"; }],
  ["legacy profile", (p) => { p.profile = "legacy"; }],
  ["unknown top-level field", (p) => { p.scripts = []; }],
  ["upper-case package id", (p) => { p.package.id = "Story.Jaokob.Core"; }],
  ["non-Thai source locale", (p) => { p.sourceLocale = "en"; }],
  ["start meters above five", (p) => { p.start.meters.hp = 6; }],
  ["act six", (p) => { p.acts[0].act = 6; }],
  ["character id without char_ prefix", (p) => { p.characters[0].id = "jao_kob"; }],
  ["item side outside the four sides", (p) => { p.items[0].side = "magic"; }],
  ["item id without item_ prefix", (p) => { p.items[0].id = "seeds"; }],
  ["text speaker that is not a character or narrator", (p) => { p.texts[0].speaker = "player"; }],
  ["empty text body", (p) => { p.texts[0].body = ""; }],
  ["text body longer than 600 characters", (p) => { p.texts[0].body = "ก".repeat(601); }],
  ["unknown node type", (p) => { p.nodes[0].type = "battle"; }],
  ["node with unknown field", (p) => { p.nodes[0].script = "() => 1"; }],
  ["vn node with both next and completes", (p) => { node(p, "n01").completes = "e-home"; }],
  ["vn node with neither next nor completes", (p) => { delete node(p, "n12").completes; }],
  ["stage slot outside the five slots", (p) => { p.nodes[0].stage.slots[0].slot = "middle"; }],
  ["asset id with unknown prefix", (p) => { p.nodes[0].stage.bg = "img_willow_roots"; }],
  ["silence longer than ten seconds", (p) => { p.nodes[0].stage.silenceMs = 10001; }],
  ["unknown effect op", (p) => { p.nodes[0].effects.push({ op: "meter.boost", meter: "hp", amount: 1 }); }],
  ["effect with a field of another op", (p) => { p.nodes[0].effects[0].meter = "hp"; }],
  ["meter.add of zero", (p) => { node(p, "n05").activities[0].effects[0].amount = 0; }],
  ["meter.add above five", (p) => { node(p, "n05").activities[0].effects[0].amount = 6; }],
  ["bond.add on the family bond", (p) => { node(p, "n05").activities[1].effects[0].bond = "family"; }],
  ["pick.route outside A and B", (p) => { node(p, "n02").options[1].effects[1].value = "C"; }],
  ["condition written as an expression string", (p) => { node(p, "n07").lines[0].when = "hp > 2"; }],
  ["condition with two kinds at once", (p) => { node(p, "n07").lines[0].when = { major: "rain", route: "A" }; }],
  ["unknown condition kind", (p) => { node(p, "n07").lines[0].when = { ending: "e-home" }; }],
  ["meterAtLeast of zero", (p) => { node(p, "n07").lines[1].when.any[2].meterAtLeast.value = 0; }],
  ["choice with six options", (p) => { const o = node(p, "n02").options; while (o.length < 6) o.push({ ...o[0], key: `extra-${o.length}` }); }],
  ["obstacle without a grit option", (p) => { const o = node(p, "n09").options; o.splice(o.findIndex((x) => x.method.kind === "grit"), 1, { ...o[0], key: "friend-2" }); }],
  ["obstacle method of unknown kind", (p) => { node(p, "n03").options[0].method = { kind: "magic" }; }],
  ["alone method costing three stamina", (p) => { node(p, "n03").options[4].method.sta = 3; }],
  ["skill method naming a fourth skill", (p) => { node(p, "n03").options[0].method.skill = "fire"; }],
  ["camp with four drops", (p) => { node(p, "n05").drops = 4; }],
  ["camp ready flag that is not true", (p) => { node(p, "n05").activities[2].ready = false; }],
  ["clash label for an unknown action", (p) => { node(p, "n04").labels.fireball = "n04.k1"; }],
  ["clash with two intent turns", (p) => { node(p, "n04").intentLines.splice(2, 1); node(p, "n04").intentLines.splice(1, 1); }],
  ["clash outcome without narrow", (p) => { delete node(p, "n04").outcome.narrow; }],
  ["round light start of ten", (p) => { p.rounds[0].p0 = 10; }],
  ["round intent outside the seven intents", (p) => { p.rounds[0].intents[0] = "roar"; }],
  ["round combo that is a base action", (p) => { p.rounds[1].combos[0] = "strike"; }],
  ["round with three combos", (p) => { p.rounds[1].combos.push("button_teuk"); }],
  ["micro of unknown kind", (p) => { node(p, "n06").micro.kind = "swipe"; }],
  ["micro longer than eight seconds", (p) => { node(p, "n06").micro.durationMs = 9000; }],
  ["pouch offer without refuse", (p) => { delete node(p, "n08").offer.refuse; }],
  ["ending node with two endings", (p) => { node(p, "n11").endings.pop(); }],
  ["ending lock with unknown reason", (p) => { node(p, "n11").endings[0].locks[0].reason = "luck"; }],
  ["ending node outside act five", (p) => { node(p, "n11").act = 4; }],
  ["unknown ending id", (p) => { node(p, "n12").completes = "e-city"; }],
  ["lexicon intent outside the seven intents", (p) => { p.lexicon.intents.roar = "lex.intent.grow"; }],
  ["lexicon action outside the core vocabulary", (p) => { p.lexicon.actions.fireball = "lex.action.strike"; }],
  ["boundary in act six", (p) => { p.boundaries[0].act = 6; }],
  ["package without a lexicon", (p) => { delete p.lexicon; }],
];

export const saveCases = [
  ["save format three", (s) => { s.saveFormatVersion = 3; }],
  ["legacy profile name", (s) => { s.profile = "legacy-1"; }],
  ["missing profile", (s) => { delete s.profile; }],
  ["unknown envelope field", (s) => { s.cheat = true; }],
  ["unknown payload field", (s) => { s.payload.cheat = true; }],
  ["package digest that is not hex", (s) => { s.package.digest = "Z".repeat(64); }],
  ["savedAt without time zone", (s) => { s.savedAt = "2026-11-02 10:06:30"; }],
  ["unknown save reason", (s) => { s.reason = "choice-committed"; }],
  ["font scale below one", (s) => { s.settings.fontScale = 0.9; }],
  ["settings without counter tags", (s) => { delete s.settings.counterTags; }],
  ["session id that is not UUID v4", (s) => { s.payload.sessionId = "session-1"; }],
  ["cursor beat outside the play modes", (s) => { s.payload.cursor.beat = "battle"; }],
  ["mind of six", (s) => { s.payload.journey.meters.mind = 6; }],
  ["bond of five", (s) => { s.payload.journey.bonds.pkam = 5; }],
  ["family bond stored in state", (s) => { s.payload.journey.bonds.family = 4; }],
  ["tempo of three", (s) => { s.payload.journey.counters.tempo = 3; }],
  ["route C", (s) => { s.payload.journey.route = "C"; }],
  ["major outside the three skills", (s) => { s.payload.journey.major = "fire"; }],
  ["pouch capacity five", (s) => { s.payload.journey.pouch.capacity = 5; }],
  ["five held items", (s) => { s.payload.journey.pouch.held = ["item_a", "item_b", "item_c", "item_d", "item_e"]; }],
  ["clash light of eleven", (s) => { s.payload.encounter.light = 11; }],
  ["clash used entry with short item key", (s) => { s.payload.encounter.used = ["item:seeds"]; }],
  ["unknown encounter kind", (s) => { s.payload.encounter.kind = "boss"; }],
  ["camp with four drops left", (s) => { s.payload.encounter = { kind: "camp", camp: "C1", dropsLeft: 4, chosen: [] }; }],
  ["six act starts", (s) => { const a = s.payload.actStarts; while (a.length < 6) a.push({ ...a[0] }); }],
  ["duplicate ending in completion", (s) => { s.payload.completion.endingsSeen = ["e-home", "e-home"]; }],
  ["history longer than 200", (s) => { const h = s.payload.history; while (h.length < 201) h.push({ ...h[0], sequence: h.length + 1 }); }],
  ["random generator state", (s) => { s.payload.rng = { algorithm: "xorshift128+", state: [1, 2, 3, 4] }; }],
];

/** The largest record the schema admits, built from maximum-length identifiers and maximum counts. */
export function worstCaseSave() {
  const s = loadJourneySave();
  const id = (prefix, i) => `${prefix}${String(i).padStart(4, "0")}`.padEnd(48, "z").slice(0, 48);
  const itemId = (i) => `item_${String(i).padStart(4, "0")}`.padEnd(48, "z").slice(0, 48);
  const journey = () => ({
    ...structuredClone(s.payload.journey),
    flags: Array.from({ length: 256 }, (_, i) => id("f", i)),
    ready: Array.from({ length: 4 }, (_, i) => itemId(i)),
    pouch: {
      capacity: 4,
      held: Array.from({ length: 4 }, (_, i) => itemId(i)),
      acquired: Array.from({ length: 32 }, (_, i) => itemId(i)),
      released: Array.from({ length: 32 }, (_, i) => itemId(100 + i)),
      remembered: Array.from({ length: 32 }, (_, i) => itemId(200 + i)),
      memory: Array.from({ length: 32 }, (_, i) => `refused_${String(i).padStart(4, "0")}`.padEnd(56, "z").slice(0, 56)),
    },
  });
  s.payload.journey = journey();
  s.payload.cursor.node = id("n", 1);
  s.payload.encounter.used = ["a_pkam", "a_fiw", "a_teuk", "s_kab", "s_kib", "hem", ...Array.from({ length: 18 }, (_, i) => `item:${itemId(i)}`)];
  s.payload.actStarts = [1, 2, 3, 4, 5].map((act) => ({ act, node: id("n", act), capturedAt: "2026-11-02T10:00:00.000000000+07:00", journey: journey() }));
  s.payload.completion.endingsSeen = ["e-home", "e-pond", "e-dawn"];
  s.payload.history = Array.from({ length: 200 }, (_, i) => ({ sequence: 9007199254740991 - i, node: id("n", i), action: id("a", i), committedAt: "2026-11-02T10:00:00.000000000+07:00" }));
  s.payload.playTimeMs = 9007199254740991;
  s.revision = 9007199254740991;
  s.integrity = { algorithm: "sha-256", canonicalization: "jaokob-canonical-json-v1", digest: "a".repeat(64) };
  return s;
}

/** Vocabulary words a package actually uses, for coverage assertions. */
export function collectVocabulary(pkg) {
  const used = { nodeTypes: new Set(), effects: new Set(), conditions: new Set(), methods: new Set(), micro: new Set(), locks: new Set() };
  const visit = (value) => {
    if (Array.isArray(value)) return value.forEach(visit);
    if (!value || typeof value !== "object") return;
    if (typeof value.op === "string") used.effects.add(value.op);
    if (value.method?.kind) used.methods.add(value.method.kind);
    if (value.micro?.kind) used.micro.add(value.micro.kind);
    if (value.when) collectCondition(value.when, used.conditions);
    if (Array.isArray(value.locks)) value.locks.forEach((lock) => used.locks.add(lock.reason));
    Object.values(value).forEach(visit);
  };
  pkg.nodes.forEach((n) => used.nodeTypes.add(n.type));
  visit(pkg.nodes);
  return used;
}

function collectCondition(condition, into) {
  const [kind] = Object.keys(condition);
  into.add(kind);
  if (kind === "all" || kind === "any") condition[kind].forEach((c) => collectCondition(c, into));
  if (kind === "not") collectCondition(condition.not, into);
}
