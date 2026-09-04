import test from "node:test";
import assert from "node:assert/strict";
import { createGameApplication } from "../../src/bootstrap/index.js";
import { createPlayableSlice } from "../helpers/prologue-bootstrap.js";
import { createLocalStorageAdapter, LOCAL_STORAGE_KEYS as KEYS } from "../../src/data/persistence/local-storage-adapter.js";
import { createDomRenderer } from "../../src/ui/renderers/dom/dom-renderer.js";
import { validateSaveEnvelope } from "../../src/data/validation/save-envelope-validator.js";
import { MemoryStorage, FakeDocument, findByAttribute, findAllByAttribute } from "../helpers/application-harness.js";
import { content, testReferenceIds, AT, SESSION_ID, ROUTES, routeAction, walk, envelope, flag } from "../helpers/act1-session.js";

function harness(options = {}, memory = new MemoryStorage()) {
  const document = new FakeDocument(), root = document.createElement("div");
  const application = createGameApplication({ root, document, clock: () => AT, sessionIdFactory: () => SESSION_ID,
    content, testReferenceIds, storage: createLocalStorageAdapter(memory), ...options });
  return { application, root, document, memory };
}
async function click(h, id) {
  const button = findByAttribute(h.root, "data-choice-id", id);
  assert.equal(button.disabled, false);
  button.dispatchEvent({ type: "click" });
  const result = await h.application.whenIdle();
  assert.equal(result.ok, true, JSON.stringify(result.error));
}
const writes = (memory) => memory.calls.filter((call) => call.method !== "getItem");
async function mockRaw() {
  const document = new FakeDocument(), root = document.createElement("div"), memory = new MemoryStorage();
  const app = createPlayableSlice({ root, document, clock: () => AT, sessionIdFactory: () => SESSION_ID, storage: createLocalStorageAdapter(memory) });
  await app.boot();
  await app.dispatch({ type: "SELECT_CHOICE", choiceId: "action.prologue.new-game" });
  const raw = memory.raw(KEYS.canonical); assert.ok(raw); return raw;
}

for (const [index, route] of ROUTES.entries()) test(`FR-ENG/FR-SAV production DOM playthrough ${route.home}/${route.coping}/${route.keepsake}`, async () => {
  const h = harness(); assert.equal((await h.application.boot()).ok, true);
  assert.equal(h.application.getSnapshot(), null);
  await click(h, "application.new-game");
  const hotspots = index % 3 === 0 ? [] : index % 3 === 1 ? ["roots"] : ["lily", "roots", "shadows", "mother", "mother"];
  for (let step = 0; !h.application.getViewModel().choices.some((choice) => choice.id === "application.finish"); step += 1) {
    assert.ok(step < 200);
    assert.equal(findAllByAttribute(h.root, "data-jk-meter", "bond").length, 0);
    const view = h.application.getViewModel(), before = h.application.getSnapshot();
    assert.equal(Object.isFrozen(view.scene), true);
    assert.equal(h.document.activeElement.getAttribute("data-jk-role"), "dialogue");
    const id = view.choices.some((choice) => choice.id === "application.advance") ? "application.advance" : routeAction(before, route, hotspots);
    await click(h, id);
    if (h.application.getStatus().mode === "choice-confirmation") {
      assert.equal(h.application.getSnapshot(), before);
      assert.equal(findByAttribute(h.root, "data-choice-id", "application.confirm-choice").getAttribute("aria-describedby"), "jk-current-dialogue");
      await click(h, "application.confirm-choice");
      assert.match(findByAttribute(h.root, "data-jk-role", "live-region").textContent, /พลังใจ (เพิ่มขึ้น|ลดลง)/);
    }
    const saved = JSON.parse(h.memory.raw(KEYS.canonical));
    assert.equal(validateSaveEnvelope(saved).valid, true);
    assert.deepEqual(saved.payload, Object.fromEntries(Object.entries(h.application.getSnapshot()).filter(([key]) => key !== "revision")));
    assert.equal(saved.revision, before.revision + 1);
  }
  const final = h.application.getSnapshot();
  assert.deepEqual(final.metrics, { hp: route.coping === "call-family" ? 75 : 85, sanity: 70 - (route.coping === "call-family" ? 10 : 5) + (route.keepsake === "keep-fragment" ? 10 : 5), bond: 0 });
  assert.equal(final.currentNodeId, "node.act1.rest");
  assert.equal(flag(final, "memory.home_focus"), route.home);
  assert.equal(flag(final, "keepsake.lily_fragment"), route.keepsake === "keep-fragment");
  const savedAtRest = h.memory.raw(KEYS.canonical);
  await click(h, "application.finish"); assert.equal(h.application.getSnapshot(), null);
  assert.equal(h.memory.raw(KEYS.canonical), savedAtRest, "Title must not overwrite resumable rest");
  await click(h, "application.resume"); assert.deepEqual(h.application.getSnapshot(), final);
});

test("FR-SAV-009 real adapter restart restores every cursor/state without save writes or effect replay", async () => {
  for (const snapshot of walk(ROUTES[0], ["roots", "roots"])) {
    const raw = JSON.stringify(envelope(snapshot)), h = harness({}, new MemoryStorage({ [KEYS.canonical]: raw }));
    await h.application.boot(); await click(h, "application.resume");
    assert.deepEqual(h.application.getSnapshot(), snapshot);
    assert.equal(h.memory.raw(KEYS.canonical), raw);
    assert.equal(writes(h.memory).length, 0);
  }
});

test("FR-SAV-006 Mock 1.0.0 remains byte-identical until explicit replacement consent", async () => {
  const raw = await mockRaw(), memory = new MemoryStorage({ [KEYS.canonical]: raw, [KEYS.backup]: raw, [KEYS.settings]: "retained settings", "unrelated.key": "retained" }), h = harness({}, memory);
  await h.application.boot();
  assert.equal(h.application.getStatus().hasResumeCandidate, false);
  assert.match(h.root.textContent, /ข้อมูลเดิมยังคงอยู่/);
  await click(h, "application.new-game"); await click(h, "application.cancel-replace");
  assert.equal(writes(memory).length, 0); assert.equal(memory.raw(KEYS.canonical), raw);
  await click(h, "application.new-game"); await click(h, "application.confirm-replace");
  assert.equal(h.application.getSnapshot().currentNodeId, "node.act1.opening");
  assert.equal(JSON.parse(memory.raw(KEYS.canonical)).contentVersion, "2.0.0");
  assert.ok(JSON.parse(memory.raw(KEYS.canonical)).revision > JSON.parse(raw).revision);
  assert.equal(memory.raw(KEYS.settings), "retained settings"); assert.equal(memory.raw("unrelated.key"), "retained");
});

for (const [label, raw] of [["malformed JSON", "{bad"], ["future format", JSON.stringify({ ...envelope(walk()[0]), saveFormatVersion: 999 })], ["unknown content", JSON.stringify({ ...envelope(walk()[0]), contentVersion: "999.0.0" })]]) test(`FR-SAV-006 ${label} never auto-clears`, async () => {
  const h = harness({}, new MemoryStorage({ [KEYS.canonical]: raw }));
  await h.application.boot(); await click(h, "application.new-game"); await click(h, "application.cancel-replace");
  assert.equal(h.memory.raw(KEYS.canonical), raw); assert.equal(writes(h.memory).length, 0);
});

test("FR-SAV-006 valid backup plus corrupt canonical can resume only in memory", async () => {
  const original = walk()[3], raw = JSON.stringify(envelope(original));
  const h = harness({}, new MemoryStorage({ [KEYS.canonical]: "{bad", [KEYS.backup]: raw }));
  await h.application.boot(); await click(h, "application.resume"); await click(h, "application.advance");
  assert.equal(h.application.getStatus().persistenceDegraded, true);
  assert.equal(h.application.getSnapshot().revision, original.revision + 1);
  assert.equal(h.memory.raw(KEYS.canonical), "{bad"); assert.equal(h.memory.raw(KEYS.backup), raw);
  assert.equal(writes(h.memory).length, 0);
});

test("FR-SAV-006 consent receipt rejects records changed by another tab before confirmation", async () => {
  const raw = await mockRaw(), memory = new MemoryStorage({ [KEYS.canonical]: raw }), h = harness({}, memory);
  await h.application.boot(); await click(h, "application.new-game");
  memory.entries.set(KEYS.backup, "arrived after consent");
  const outcome = await h.application.dispatch({ type: "SELECT_CHOICE", choiceId: "application.confirm-replace" });
  assert.equal(outcome.ok, false); assert.equal(outcome.error.details.reason, "CONSENT_STALE");
  assert.equal(h.application.getSnapshot(), null); assert.equal(writes(memory).length, 0);
  assert.equal(memory.raw(KEYS.canonical), raw); assert.equal(memory.raw(KEYS.backup), "arrived after consent");
});

test("FR-SAV-006 failed consent clear does not start a writable new game", async () => {
  const raw = await mockRaw(), memory = new MemoryStorage({ [KEYS.canonical]: raw });
  memory.removeItem = () => { throw Object.assign(new Error("private details"), { name: "SecurityError" }); };
  const h = harness({}, memory); await h.application.boot(); await click(h, "application.new-game");
  assert.equal((await h.application.dispatch({ type: "SELECT_CHOICE", choiceId: "application.confirm-replace" })).ok, false);
  assert.equal(h.application.getSnapshot(), null); assert.equal(memory.raw(KEYS.canonical), raw);
  assert.doesNotMatch(h.root.textContent, /private details/);
});

test("FR-SAV-007 quota failures retain play in memory through act-rest", async () => {
  const memory = new MemoryStorage();
  memory.setItem = () => { throw Object.assign(new Error("quota"), { name: "QuotaExceededError" }); };
  const h = harness({}, memory); await h.application.boot(); await click(h, "application.new-game");
  const hotspots = [];
  for (let step = 0; !h.application.getViewModel().choices.some((c) => c.id === "application.finish"); step += 1) {
    assert.ok(step < 100);
    const view = h.application.getViewModel();
    await click(h, view.choices.some((c) => c.id === "application.advance") ? "application.advance" : routeAction(h.application.getSnapshot(), ROUTES[0], hotspots));
    if (h.application.getStatus().mode === "choice-confirmation") await click(h, "application.confirm-choice");
  }
  assert.equal(h.application.getStatus().persistenceDegraded, true);
  assert.match(h.root.textContent, /ยังบันทึกลงอุปกรณ์ไม่ได้/);
  const final = h.application.getSnapshot(); await click(h, "application.finish"); await click(h, "application.resume");
  assert.deepEqual(h.application.getSnapshot(), final); assert.equal(memory.raw(KEYS.canonical), null);
});

test("FR-ENG-002 stale DOM intents and simultaneous dispatch commit only once", async () => {
  const h = harness(); await h.application.boot(); await click(h, "application.new-game");
  const stale = h.application.getViewModel();
  const first = h.application.dispatch({ type: "SELECT_CHOICE", choiceId: "application.advance", viewRevision: stale.viewRevision, expectedRevision: stale.revision });
  const second = h.application.dispatch({ type: "SELECT_CHOICE", choiceId: "application.advance" });
  assert.equal((await second).error.code, "APPLICATION_BUSY"); assert.equal((await first).ok, true);
  const current = h.application.getSnapshot();
  assert.equal((await h.application.dispatch({ type: "SELECT_CHOICE", choiceId: "application.advance", viewRevision: stale.viewRevision, expectedRevision: stale.revision })).error.code, "REVISION_MISMATCH");
  assert.equal(h.application.getSnapshot(), current); assert.equal(current.revision, 2);
});

test("FR-STA-004 high-impact cancel and reading settings preserve domain facts", async () => {
  const decision = walk().find((s) => s.currentNodeId === "node.act1.survival"), h = harness({}, new MemoryStorage({ [KEYS.canonical]: JSON.stringify(envelope(decision)) }));
  await h.application.boot(); await click(h, "application.resume");
  const before = h.application.getSnapshot(), count = writes(h.memory).length;
  await click(h, "choice.act1.call-family"); await click(h, "application.cancel-choice");
  assert.equal(h.application.getSnapshot(), before); assert.equal(writes(h.memory).length, count);
  await click(h, "application.settings"); await click(h, "application.toggle-font"); await click(h, "application.toggle-motion"); await click(h, "application.close-settings");
  const after = h.application.getSnapshot();
  assert.deepEqual(after.metrics, before.metrics); assert.deepEqual(after.flags, before.flags); assert.deepEqual(after.progress, before.progress);
  assert.equal(after.currentNodeId, before.currentNodeId); assert.equal(after.state, before.state);
  const saved = JSON.parse(h.memory.raw(KEYS.canonical));
  assert.equal(saved.settings.fontScale, 1.5); assert.equal(saved.settings.reducedMotion, true);
});

test("FR-CNT-001 invalid content stops before any storage access and offers a Thai fatal shell", async () => {
  const h = harness({ content: { invalid: true } }); const result = await h.application.boot();
  assert.equal(result.ok, false); assert.equal(h.application.getStatus().fatal, true);
  assert.equal(h.memory.calls.length, 0); assert.ok(findByAttribute(h.root, "data-jk-role", "fatal-shell"));
});

test("FR-LOC-002 NFR-SE-003 content injection fails closed and renderer remains text-only", async () => {
  const data = structuredClone(content), payload = '<img src=x onerror="globalThis.injected=true">';
  data.dialogues.dialogues[0].text.th = payload;
  const rejected = harness({ content: data });
  assert.equal((await rejected.application.boot()).ok, false);
  assert.equal(rejected.memory.calls.length, 0);
  const h = harness(); await h.application.boot(); await click(h, "application.new-game");
  const view = structuredClone(h.application.getViewModel()); view.scene.dialogue = payload;
  const renderer = createDomRenderer({ root: h.root, document: h.document });
  assert.equal(renderer.render(Object.freeze(view)).ok, true);
  assert.ok(h.root.textContent.includes(payload));
  const all = (element) => [element, ...element.children.flatMap(all)];
  assert.equal(all(h.root).some((element) => ["IMG", "SCRIPT"].includes(element.tagName)), false);
});

test("FR-UI-001 malformed renderer outcomes fail through the localized recovery shell", async () => {
  const document = new FakeDocument(), root = document.createElement("div"), renderer = createDomRenderer({ root, document });
  const h = harness({ root, document, renderer: { ...renderer, render: () => { throw new Error("private data"); } } });
  assert.equal((await h.application.boot()).error.code, "RENDER_FAILURE");
  assert.ok(findByAttribute(root, "data-jk-role", "fatal-shell")); assert.doesNotMatch(root.textContent, /private data/);
});

test("FR-SAV-006 incompatible records arriving during play are preserved before autosave", async () => {
  const h = harness(); await h.application.boot(); await click(h, "application.new-game");
  const raw = await mockRaw(); h.memory.entries.set(KEYS.backup, raw);
  const count = writes(h.memory).length;
  await click(h, "application.advance");
  assert.equal(h.application.getSnapshot().revision, 2);
  assert.equal(h.application.getStatus().persistenceDegraded, true);
  assert.equal(writes(h.memory).length, count); assert.equal(h.memory.raw(KEYS.backup), raw);
});

test("FR-SAV-007 blocked reads allow a new in-memory session with a visible warning", async () => {
  const memory = new MemoryStorage();
  memory.getItem = () => { throw Object.assign(new Error("denied"), { name: "SecurityError" }); };
  const h = harness({}, memory); await h.application.boot(); await click(h, "application.new-game"); await click(h, "application.advance");
  assert.equal(h.application.getSnapshot().revision, 2);
  assert.match(h.root.textContent, /ยังบันทึกลงอุปกรณ์ไม่ได้/); assert.equal(writes(memory).length, 0);
});

for (const phase of ["stage", "commit"]) test(`FR-SAV-006 adapter ${phase} rechecks compatibility after application preflight`, async () => {
  const memory = new MemoryStorage();
  const adapter = createLocalStorageAdapter({ storage: memory, canReplaceExistingEnvelope: (candidate) => candidate.contentVersion === "2.0.0" });
  const candidate = envelope(walk()[2]);
  if (phase === "commit") assert.equal(adapter.stage(candidate).ok, true);
  const original = await mockRaw(); memory.entries.set(KEYS.canonical, original);
  const count = writes(memory).length;
  const result = phase === "stage" ? adapter.stage(candidate) : adapter.commit({ expectedRevision: candidate.revision });
  assert.equal(result.error.code, "SAVE_MIGRATION");
  assert.equal(result.error.details.reason, "CONTENT_REPLACEMENT_BLOCKED");
  assert.equal(memory.raw(KEYS.canonical), original); assert.equal(writes(memory).length, count);
});

test("FR-SAV-006 conservative write guard preserves newly corrupted records", () => {
  const memory = new MemoryStorage({ [KEYS.backup]: "{new corruption" });
  const adapter = createLocalStorageAdapter({ storage: memory, canReplaceExistingEnvelope: () => true });
  assert.equal(adapter.stage(envelope(walk()[2])).error.code, "SAVE_PARSE");
  assert.equal(writes(memory).length, 0); assert.equal(memory.raw(KEYS.backup), "{new corruption");
});

test("FR-CNT-001 fetch failure renders Thai recovery before reading or writing saves", async () => {
  const h = harness({ content: undefined, packageSource: "https://game.test/act-01.json", baseUrl: "https://game.test/index.html", fetch: async () => { throw new Error("offline"); } });
  assert.equal((await h.application.boot()).ok, false);
  assert.equal(h.memory.calls.length, 0); assert.ok(findByAttribute(h.root, "data-jk-role", "fatal-shell"));
});

test("FR-SAV-001 production default adapter resolves browser storage with the compatibility guard", async () => {
  const previous = Object.getOwnPropertyDescriptor(globalThis, "localStorage"), memory = new MemoryStorage();
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: memory });
  try {
    const h = harness({ storage: undefined }); await h.application.boot(); await click(h, "application.new-game");
    assert.equal(h.application.getStatus().persistenceDegraded, false);
    assert.equal(JSON.parse(memory.raw(KEYS.canonical)).contentVersion, "2.0.0");
    const original = await mockRaw(); memory.entries.set(KEYS.backup, original);
    await click(h, "application.advance");
    assert.equal(h.application.getStatus().persistenceDegraded, true); assert.equal(memory.raw(KEYS.backup), original);
  } finally {
    if (previous) Object.defineProperty(globalThis, "localStorage", previous);
    else delete globalThis.localStorage;
  }
});

test("FR-UI-007 retry from a content-load fatal shell retries loading before returning to Title", async () => {
  let calls = 0;
  const h = harness({ content: undefined, packageSource: "https://game.test/act-01.json", baseUrl: "https://game.test/index.html", fetch: async () => {
    calls += 1;
    if (calls === 1) throw new Error("offline");
    return { ok: true, status: 200, url: "https://game.test/act-01.json", text: async () => JSON.stringify(content) };
  } });
  assert.equal((await h.application.boot()).ok, false);
  assert.equal((await h.application.dispatch({ type: "RETRY_RENDER" })).ok, true);
  assert.equal(h.application.getStatus().fatal, false);
  await click(h, "application.new-game");
  assert.equal(h.application.getSnapshot().currentNodeId, "node.act1.opening");
});

test("FR-SAV-006 rollback compatibility: legacy composition with retained write guard preserves 2.0.0 raw data", async () => {
  const raw = JSON.stringify(envelope(walk().at(-1))), memory = new MemoryStorage({ [KEYS.canonical]: raw });
  const document = new FakeDocument(), root = document.createElement("div");
  const guardedAdapter = createLocalStorageAdapter({ storage: memory, canReplaceExistingEnvelope: (candidate) => candidate.contentVersion === "1.0.0" });
  const legacy = createPlayableSlice({ root, document, storage: guardedAdapter, clock: () => AT, sessionIdFactory: () => SESSION_ID });
  await legacy.boot();
  await legacy.dispatch({ type: "SELECT_CHOICE", choiceId: "action.prologue.new-game" });
  assert.equal(memory.raw(KEYS.canonical), raw, "older content cannot downgrade/replace new saves");
  assert.equal(writes(memory).length, 0);
  assert.equal(legacy.getStatus().persistenceDegraded, true);
});
