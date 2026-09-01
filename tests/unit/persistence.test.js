import test from "node:test";
import assert from "node:assert/strict";

import {
  STORAGE_ERROR_CODES,
  assertStoragePort,
} from "../../src/core/ports/storage-port.js";
import {
  LOCAL_STORAGE_KEYS,
  SAVE_CANDIDATE_MAX_BYTES,
  createLocalStorageAdapter,
} from "../../src/data/persistence/local-storage-adapter.js";

const SAVE_KEYS = new Set([
  LOCAL_STORAGE_KEYS.canonical,
  LOCAL_STORAGE_KEYS.staging,
  LOCAL_STORAGE_KEYS.backup,
]);

class MemoryStorage {
  constructor(initial = {}) {
    this.entries = new Map(Object.entries(initial));
    this.calls = [];
    this.faults = [];
  }

  getItem(key) {
    this.calls.push({ method: "getItem", key });
    this.throwFault("getItem", key);
    return this.entries.has(key) ? this.entries.get(key) : null;
  }

  setItem(key, value) {
    this.calls.push({ method: "setItem", key, value });
    this.throwFault("setItem", key);
    this.entries.set(key, String(value));
  }

  removeItem(key) {
    this.calls.push({ method: "removeItem", key });
    this.throwFault("removeItem", key);
    this.entries.delete(key);
  }

  seed(key, value) {
    this.entries.set(key, String(value));
  }

  raw(key) {
    return this.entries.has(key) ? this.entries.get(key) : null;
  }

  failNext(method, key, error) {
    this.faults.push({ method, key, error });
  }

  throwFault(method, key) {
    const index = this.faults.findIndex(
      (fault) => fault.method === method && fault.key === key,
    );
    if (index === -1) return;
    const [{ error }] = this.faults.splice(index, 1);
    throw error;
  }
}

function makeEnvelope(revision = 1, overrides = {}) {
  const envelope = {
    saveFormatVersion: 1,
    contentVersion: "1.0.0",
    revision,
    createdAt: "2026-09-01T12:00:00+07:00",
    savedAt: "2026-09-01T12:05:00+07:00",
    reason: "choice-committed",
    payload: {
      sessionId: "123e4567-e89b-42d3-a456-426614174000",
      startedAt: "2026-09-01T12:00:00+07:00",
      playTimeMs: 300000,
      state: "Decision",
      currentTreeId: "act-1",
      currentNodeId: "opening.choice-1",
      checkpoint: {
        id: "checkpoint.opening",
        capturedAt: "2026-09-01T12:04:00+07:00",
        treeId: "act-1",
        nodeId: "opening.choice-1",
        state: "Decision",
        metrics: { hp: 80, sanity: 70, bond: 5 },
        flags: [{ id: "met.friend", value: true }],
        eventOccurrences: [{ eventId: "event.rain", count: 1 }],
        rng: { algorithm: "xorshift32-v1", seed: 12345, state: 67890 },
      },
      metrics: { hp: 78, sanity: 72, bond: 7 },
      flags: [{ id: "met.friend", value: true }],
      eventOccurrences: [{ eventId: "event.rain", count: 1 }],
      progress: {
        completedNodeIds: ["opening.intro"],
        viewedDialogueIds: ["dialogue.opening-1"],
        unlockedEndingIds: [],
      },
      history: [{
        sequence: 1,
        nodeId: "opening.choice-1",
        actionId: "choice.help-friend",
        committedAt: "2026-09-01T12:05:00+07:00",
        metricsAfter: { hp: 78, sanity: 72, bond: 7 },
      }],
      rng: { algorithm: "xorshift32-v1", seed: 12345, state: 67890 },
    },
    settings: {
      locale: "th",
      textSpeed: "normal",
      fontScale: 1,
      reducedMotion: false,
      highContrast: false,
      storyAssist: false,
      immersiveUi: true,
      confirmHighImpactChoices: true,
      typewriterEffect: true,
      autoAdvance: false,
      masterVolume: 1,
      musicVolume: 0.8,
      ambienceVolume: 0.7,
      effectsVolume: 0.9,
      reducedIntensityAudio: false,
    },
  };
  return Object.assign(envelope, overrides);
}

function rawEnvelope(revision, overrides) {
  return JSON.stringify(makeEnvelope(revision, overrides));
}

function makeOversizedEnvelope(revision = 1) {
  const envelope = makeEnvelope(revision);
  envelope.payload.flags = Array.from({ length: 500 }, (_, index) => ({
    id: `flag.${index}`,
    value: "ก".repeat(240),
  }));
  return envelope;
}

function namedError(name) {
  const error = new Error(name);
  error.name = name;
  return error;
}

test("FR-SAV-001 LocalStorage adapter passes assertStoragePort without invoking storage", () => {
  const storage = new MemoryStorage();
  const adapter = createLocalStorageAdapter(storage);

  assert.equal(assertStoragePort(adapter), undefined);
  assert.equal(Object.isFrozen(adapter), true);
  assert.equal(storage.calls.length, 0);
});

test("FR-SAV-001 FR-SAV-002 FR-SAV-003 round-trips a cloned Save Envelope", () => {
  const storage = new MemoryStorage({
    "other:application:key": "leave-me-alone",
    [LOCAL_STORAGE_KEYS.settings]: "separate-settings-envelope",
  });
  const adapter = createLocalStorageAdapter(storage);
  const envelope = makeEnvelope(1);

  const staged = adapter.stage(envelope);
  assert.equal(staged.ok, true);
  assert.equal(staged.value.source, "staging");
  assert.deepEqual(staged.value.envelope, envelope);
  assert.equal(storage.raw(LOCAL_STORAGE_KEYS.canonical), null);
  assert.deepEqual(JSON.parse(storage.raw(LOCAL_STORAGE_KEYS.staging)), envelope);

  envelope.payload.metrics.hp = 1;
  assert.equal(JSON.parse(storage.raw(LOCAL_STORAGE_KEYS.staging)).payload.metrics.hp, 78);

  const committed = adapter.commit({ expectedRevision: 1 });
  assert.equal(committed.ok, true);
  assert.equal(committed.value.source, "canonical");
  assert.equal(storage.raw(LOCAL_STORAGE_KEYS.staging), null);
  assert.equal(JSON.parse(storage.raw(LOCAL_STORAGE_KEYS.canonical)).payload.metrics.hp, 78);

  const loaded = adapter.load();
  assert.equal(loaded.ok, true);
  assert.equal(loaded.value.source, "canonical");
  assert.equal(loaded.value.envelope.revision, 1);
  loaded.value.envelope.payload.metrics.hp = 0;
  assert.equal(adapter.load().value.envelope.payload.metrics.hp, 78);

  assert.equal(storage.raw("other:application:key"), "leave-me-alone");
  assert.equal(storage.raw(LOCAL_STORAGE_KEYS.settings), "separate-settings-envelope");
  assert.ok(storage.calls.every((call) => SAVE_KEYS.has(call.key)));
});

test("FR-SAV-003 rotates the exact prior canonical bytes to backup before promotion", () => {
  const storage = new MemoryStorage();
  const adapter = createLocalStorageAdapter(storage);

  assert.equal(adapter.checkpoint(makeEnvelope(1)).ok, true);
  const priorCanonical = storage.raw(LOCAL_STORAGE_KEYS.canonical);
  assert.equal(adapter.stage(makeEnvelope(2, { reason: "checkpoint" })).ok, true);
  assert.equal(adapter.commit().ok, true);

  assert.equal(storage.raw(LOCAL_STORAGE_KEYS.backup), priorCanonical);
  assert.equal(JSON.parse(storage.raw(LOCAL_STORAGE_KEYS.canonical)).revision, 2);
  assert.equal(storage.raw(LOCAL_STORAGE_KEYS.staging), null);
});

test("FR-SAV-004 recovers highest valid revision when canonical JSON is corrupt", () => {
  const canonicalRaw = "{corrupted-json";
  const storage = new MemoryStorage({
    [LOCAL_STORAGE_KEYS.canonical]: canonicalRaw,
    [LOCAL_STORAGE_KEYS.staging]: rawEnvelope(5),
    [LOCAL_STORAGE_KEYS.backup]: rawEnvelope(4),
  });
  const adapter = createLocalStorageAdapter(storage);

  const recovered = adapter.recoverCandidates();
  assert.equal(recovered.ok, true);
  assert.deepEqual(
    recovered.value.candidates.map(({ source, envelope }) => [source, envelope.revision]),
    [["staging", 5], ["backup", 4]],
  );
  assert.deepEqual(recovered.value.rejected, [{
    source: "canonical",
    code: STORAGE_ERROR_CODES.SAVE_PARSE,
    reason: "MALFORMED_JSON",
  }]);

  const loaded = adapter.load();
  assert.equal(loaded.ok, true);
  assert.equal(loaded.value.source, "staging");
  assert.equal(loaded.value.envelope.revision, 5);
  assert.equal(storage.raw(LOCAL_STORAGE_KEYS.canonical), canonicalRaw);
});

test("FR-SAV-004 recovers backup when canonical and staging are corrupt", () => {
  const storage = new MemoryStorage({
    [LOCAL_STORAGE_KEYS.canonical]: "not-json",
    [LOCAL_STORAGE_KEYS.staging]: JSON.stringify({ saveFormatVersion: 1 }),
    [LOCAL_STORAGE_KEYS.backup]: rawEnvelope(3),
  });
  const adapter = createLocalStorageAdapter(storage);

  const loaded = adapter.load();
  assert.equal(loaded.ok, true);
  assert.equal(loaded.value.source, "backup");
  assert.equal(loaded.value.envelope.revision, 3);
  assert.equal(storage.raw(LOCAL_STORAGE_KEYS.canonical), "not-json");
  assert.deepEqual(JSON.parse(storage.raw(LOCAL_STORAGE_KEYS.staging)), {
    saveFormatVersion: 1,
  });
});

test("FR-SAV-004 recovery uses revision then canonical-staging-backup priority, never timestamp", () => {
  const matrices = [
    {
      name: "higher staging revision beats valid canonical",
      raws: {
        canonical: rawEnvelope(7, { savedAt: "2026-09-01T23:59:00+07:00" }),
        staging: rawEnvelope(8, { savedAt: "2026-09-01T00:01:00+07:00" }),
        backup: rawEnvelope(6),
      },
      expected: "staging",
    },
    {
      name: "canonical wins equal revision",
      raws: {
        canonical: rawEnvelope(9, { reason: "new-game" }),
        staging: rawEnvelope(9, { reason: "checkpoint" }),
        backup: rawEnvelope(9, { reason: "lifecycle-suspend" }),
      },
      expected: "canonical",
    },
    {
      name: "staging wins equal revision when canonical is absent",
      raws: {
        staging: rawEnvelope(10, { reason: "checkpoint" }),
        backup: rawEnvelope(10, { reason: "new-game" }),
      },
      expected: "staging",
    },
  ];

  for (const scenario of matrices) {
    const initial = Object.fromEntries(
      Object.entries(scenario.raws).map(([source, raw]) => [LOCAL_STORAGE_KEYS[source], raw]),
    );
    const loaded = createLocalStorageAdapter(new MemoryStorage(initial)).load();
    assert.equal(loaded.ok, true, scenario.name);
    assert.equal(loaded.value.source, scenario.expected, scenario.name);
  }
});

test("FR-SAV-003 preserves canonical and staging when backup write exceeds quota", () => {
  const storage = new MemoryStorage({
    [LOCAL_STORAGE_KEYS.canonical]: rawEnvelope(1),
  });
  const adapter = createLocalStorageAdapter(storage);
  assert.equal(adapter.stage(makeEnvelope(2)).ok, true);
  storage.failNext(
    "setItem",
    LOCAL_STORAGE_KEYS.backup,
    namedError("QuotaExceededError"),
  );

  const committed = adapter.commit();
  assert.equal(committed.ok, false);
  assert.equal(committed.error.code, STORAGE_ERROR_CODES.STORAGE_QUOTA);
  assert.equal(JSON.parse(storage.raw(LOCAL_STORAGE_KEYS.canonical)).revision, 1);
  assert.equal(JSON.parse(storage.raw(LOCAL_STORAGE_KEYS.staging)).revision, 2);
  assert.equal(adapter.load().value.envelope.revision, 2);
});

test("FR-SAV-003 and FR-SAV-009 map staging QuotaExceededError without touching canonical", () => {
  const canonicalRaw = rawEnvelope(4);
  const storage = new MemoryStorage({
    [LOCAL_STORAGE_KEYS.canonical]: canonicalRaw,
  });
  storage.failNext(
    "setItem",
    LOCAL_STORAGE_KEYS.staging,
    namedError("QuotaExceededError"),
  );
  const adapter = createLocalStorageAdapter(storage);

  const staged = adapter.stage(makeEnvelope(5));
  assert.equal(staged.ok, false);
  assert.equal(staged.error.code, STORAGE_ERROR_CODES.STORAGE_QUOTA);
  assert.equal(storage.raw(LOCAL_STORAGE_KEYS.canonical), canonicalRaw);
  assert.equal(storage.raw(LOCAL_STORAGE_KEYS.backup), null);
});

test("NFR-PE-005 rejects a Save Envelope above the 250 KB UTF-8 budget before writing", () => {
  const storage = new MemoryStorage();
  const adapter = createLocalStorageAdapter(storage);
  const oversized = makeOversizedEnvelope(1);
  const byteLength = new TextEncoder().encode(JSON.stringify(oversized)).byteLength;
  assert.ok(byteLength > SAVE_CANDIDATE_MAX_BYTES);

  const staged = adapter.stage(oversized);
  assert.equal(staged.ok, false);
  assert.equal(staged.error.code, STORAGE_ERROR_CODES.STORAGE_QUOTA);
  assert.equal(staged.error.details.reason, "SAVE_BUDGET_EXCEEDED");
  assert.equal(staged.error.details.byteLength, byteLength);
  assert.equal(storage.raw(LOCAL_STORAGE_KEYS.staging), null);
  assert.equal(storage.raw(LOCAL_STORAGE_KEYS.canonical), null);
});

test("FR-SAV-003 NFR-PE-005 preserve an oversized stored backup until consented clear", () => {
  const oversizedRaw = JSON.stringify(makeOversizedEnvelope(10));
  const storage = new MemoryStorage({
    [LOCAL_STORAGE_KEYS.backup]: oversizedRaw,
  });
  const adapter = createLocalStorageAdapter(storage);

  const staged = adapter.stage(makeEnvelope(11));
  assert.equal(staged.ok, false);
  assert.equal(staged.error.code, STORAGE_ERROR_CODES.STORAGE_QUOTA);
  assert.equal(staged.error.details.reason, "SAVE_BUDGET_EXCEEDED");
  assert.equal(storage.raw(LOCAL_STORAGE_KEYS.backup), oversizedRaw);
  assert.equal(storage.raw(LOCAL_STORAGE_KEYS.staging), null);
});

test("FR-SAV-003 preserves recovery candidates when canonical promotion exceeds quota", () => {
  const canonicalRaw = rawEnvelope(1);
  const storage = new MemoryStorage({
    [LOCAL_STORAGE_KEYS.canonical]: canonicalRaw,
  });
  const adapter = createLocalStorageAdapter(storage);
  assert.equal(adapter.stage(makeEnvelope(2)).ok, true);
  storage.failNext(
    "setItem",
    LOCAL_STORAGE_KEYS.canonical,
    namedError("QuotaExceededError"),
  );

  const committed = adapter.commit();
  assert.equal(committed.ok, false);
  assert.equal(committed.error.code, STORAGE_ERROR_CODES.STORAGE_QUOTA);
  assert.equal(storage.raw(LOCAL_STORAGE_KEYS.canonical), canonicalRaw);
  assert.equal(storage.raw(LOCAL_STORAGE_KEYS.backup), canonicalRaw);
  assert.equal(JSON.parse(storage.raw(LOCAL_STORAGE_KEYS.staging)).revision, 2);
});

test("FR-SAV-003 rejects a candidate older than backup before stage or commit", () => {
  const newerBackup = rawEnvelope(10);
  const stageStorage = new MemoryStorage({
    [LOCAL_STORAGE_KEYS.backup]: newerBackup,
  });
  const stageAdapter = createLocalStorageAdapter(stageStorage);

  const staleStage = stageAdapter.stage(makeEnvelope(6));
  assert.equal(staleStage.ok, false);
  assert.equal(staleStage.error.code, STORAGE_ERROR_CODES.SAVE_SCHEMA);
  assert.equal(staleStage.error.details.reason, "STALE_REVISION");
  assert.equal(stageStorage.raw(LOCAL_STORAGE_KEYS.staging), null);
  assert.equal(stageStorage.raw(LOCAL_STORAGE_KEYS.backup), newerBackup);

  const commitStorage = new MemoryStorage();
  const commitAdapter = createLocalStorageAdapter(commitStorage);
  assert.equal(commitAdapter.stage(makeEnvelope(6)).ok, true);
  commitStorage.seed(LOCAL_STORAGE_KEYS.backup, newerBackup);

  const staleCommit = commitAdapter.commit();
  assert.equal(staleCommit.ok, false);
  assert.equal(staleCommit.error.details.reason, "STALE_REVISION");
  assert.equal(commitStorage.raw(LOCAL_STORAGE_KEYS.canonical), null);
  assert.equal(commitStorage.raw(LOCAL_STORAGE_KEYS.backup), newerBackup);
  assert.equal(JSON.parse(commitStorage.raw(LOCAL_STORAGE_KEYS.staging)).revision, 6);
});

test("FR-SAV-003 FR-SAV-005 preserve unsupported future backup before any write", () => {
  const futureRaw = rawEnvelope(20, { saveFormatVersion: 2 });
  const storage = new MemoryStorage({
    [LOCAL_STORAGE_KEYS.backup]: futureRaw,
  });
  const adapter = createLocalStorageAdapter(storage);

  const staged = adapter.stage(makeEnvelope(21));
  assert.equal(staged.ok, false);
  assert.equal(staged.error.code, STORAGE_ERROR_CODES.SAVE_MIGRATION);
  assert.equal(storage.raw(LOCAL_STORAGE_KEYS.backup), futureRaw);
  assert.equal(storage.raw(LOCAL_STORAGE_KEYS.staging), null);
  assert.equal(storage.raw(LOCAL_STORAGE_KEYS.canonical), null);
});

test("FR-SAV-003 commit enforces an explicitly requested staged revision", () => {
  const storage = new MemoryStorage();
  const adapter = createLocalStorageAdapter(storage);
  assert.equal(adapter.stage(makeEnvelope(4)).ok, true);

  const mismatch = adapter.commit({ expectedRevision: 5 });
  assert.equal(mismatch.ok, false);
  assert.equal(mismatch.error.code, STORAGE_ERROR_CODES.SAVE_SCHEMA);
  assert.equal(mismatch.error.details.reason, "EXPECTED_REVISION_MISMATCH");
  assert.equal(storage.raw(LOCAL_STORAGE_KEYS.canonical), null);
  assert.equal(JSON.parse(storage.raw(LOCAL_STORAGE_KEYS.staging)).revision, 4);

  assert.equal(adapter.commit({ revision: 4 }).ok, true);
});

test("FR-SAV-003 commit rejects missing staging and invalid revision requests without mutation", () => {
  const storage = new MemoryStorage();
  const adapter = createLocalStorageAdapter(storage);

  const missing = adapter.commit();
  assert.equal(missing.ok, false);
  assert.equal(missing.error.code, STORAGE_ERROR_CODES.SAVE_PARSE);
  assert.equal(missing.error.details.reason, "MISSING_STAGED_CANDIDATE");

  assert.equal(adapter.stage(makeEnvelope(1)).ok, true);
  const invalidRequest = adapter.commit({ expectedRevision: 0 });
  assert.equal(invalidRequest.ok, false);
  assert.equal(invalidRequest.error.code, STORAGE_ERROR_CODES.SAVE_SCHEMA);
  assert.equal(invalidRequest.error.details.reason, "INVALID_EXPECTED_REVISION");
  assert.equal(storage.raw(LOCAL_STORAGE_KEYS.canonical), null);
  assert.equal(JSON.parse(storage.raw(LOCAL_STORAGE_KEYS.staging)).revision, 1);
});

test("FR-SAV-003 stage and commit are idempotent for identical revision bytes", () => {
  const storage = new MemoryStorage();
  const adapter = createLocalStorageAdapter(storage);
  const envelope = makeEnvelope(1);

  assert.equal(adapter.stage(envelope).ok, true);
  const writesAfterFirstStage = storage.calls.filter(
    (call) => call.method === "setItem" && call.key === LOCAL_STORAGE_KEYS.staging,
  ).length;
  assert.equal(adapter.stage(envelope).ok, true);
  assert.equal(
    storage.calls.filter(
      (call) => call.method === "setItem" && call.key === LOCAL_STORAGE_KEYS.staging,
    ).length,
    writesAfterFirstStage,
  );

  storage.seed(LOCAL_STORAGE_KEYS.canonical, rawEnvelope(1));
  const committed = adapter.commit({ expectedRevision: 1 });
  assert.equal(committed.ok, true);
  assert.equal(storage.raw(LOCAL_STORAGE_KEYS.staging), null);
  assert.equal(JSON.parse(storage.raw(LOCAL_STORAGE_KEYS.canonical)).revision, 1);
});

test("FR-SAV-003 preserves valid candidates when staging cleanup is unavailable", () => {
  const storage = new MemoryStorage();
  const adapter = createLocalStorageAdapter(storage);
  assert.equal(adapter.stage(makeEnvelope(1)).ok, true);
  storage.failNext(
    "removeItem",
    LOCAL_STORAGE_KEYS.staging,
    namedError("SecurityError"),
  );

  const committed = adapter.commit();
  assert.equal(committed.ok, false);
  assert.equal(committed.error.code, STORAGE_ERROR_CODES.STORAGE_UNAVAILABLE);
  assert.equal(JSON.parse(storage.raw(LOCAL_STORAGE_KEYS.canonical)).revision, 1);
  assert.equal(JSON.parse(storage.raw(LOCAL_STORAGE_KEYS.staging)).revision, 1);
  assert.equal(adapter.load().value.source, "canonical");
});

test("FR-SAV-003 maps a changed staging readback to STORAGE_UNAVAILABLE", () => {
  class MismatchingReadbackStorage extends MemoryStorage {
    constructor() {
      super();
      this.stagingReadCount = 0;
    }

    getItem(key) {
      const value = super.getItem(key);
      if (key !== LOCAL_STORAGE_KEYS.staging) return value;
      this.stagingReadCount += 1;
      return this.stagingReadCount === 2 && value !== null ? `${value} ` : value;
    }
  }

  const storage = new MismatchingReadbackStorage();
  const staged = createLocalStorageAdapter(storage).stage(makeEnvelope(1));
  assert.equal(staged.ok, false);
  assert.equal(staged.error.code, STORAGE_ERROR_CODES.STORAGE_UNAVAILABLE);
  assert.equal(staged.error.details.reason, "READBACK_MISMATCH");
  assert.equal(JSON.parse(storage.raw(LOCAL_STORAGE_KEYS.staging)).revision, 1);
  assert.equal(storage.raw(LOCAL_STORAGE_KEYS.canonical), null);
});

test("FR-SAV-003 maps a missing staging readback to STORAGE_UNAVAILABLE", () => {
  class MissingReadbackStorage extends MemoryStorage {
    constructor() {
      super();
      this.stagingReadCount = 0;
    }

    getItem(key) {
      const value = super.getItem(key);
      if (key !== LOCAL_STORAGE_KEYS.staging) return value;
      this.stagingReadCount += 1;
      return this.stagingReadCount === 2 ? null : value;
    }
  }

  const storage = new MissingReadbackStorage();
  const staged = createLocalStorageAdapter(storage).stage(makeEnvelope(1));
  assert.equal(staged.ok, false);
  assert.equal(staged.error.code, STORAGE_ERROR_CODES.STORAGE_UNAVAILABLE);
  assert.equal(staged.error.details.reason, "READBACK_MISSING");
  assert.equal(JSON.parse(storage.raw(LOCAL_STORAGE_KEYS.staging)).revision, 1);
});

test("FR-SAV-009 maps disabled or denied storage to STORAGE_UNAVAILABLE without throwing", () => {
  const deniedStorage = {
    getItem() {
      throw namedError("SecurityError");
    },
    setItem() {
      throw namedError("SecurityError");
    },
    removeItem() {
      throw namedError("SecurityError");
    },
  };

  for (const adapter of [
    createLocalStorageAdapter({ storage: undefined }),
    createLocalStorageAdapter(deniedStorage),
  ]) {
    const outcomes = [
      adapter.recoverCandidates(),
      adapter.load(),
      adapter.stage(makeEnvelope(1)),
      adapter.commit(),
      adapter.checkpoint(makeEnvelope(1)),
      adapter.clearWithConsent({ consent: true }),
    ];
    for (const outcome of outcomes) {
      assert.equal(outcome.ok, false);
      assert.equal(outcome.error.code, STORAGE_ERROR_CODES.STORAGE_UNAVAILABLE);
    }
  }
});

test("FR-SAV-001 and FR-SAV-005 reject schema-invalid and unsupported saves without mutation", () => {
  const future = makeEnvelope(12, { saveFormatVersion: 2 });
  const futureRaw = JSON.stringify(future);
  const storage = new MemoryStorage({
    [LOCAL_STORAGE_KEYS.canonical]: futureRaw,
  });
  const adapter = createLocalStorageAdapter(storage);

  const futureLoad = adapter.load();
  assert.equal(futureLoad.ok, false);
  assert.equal(futureLoad.error.code, STORAGE_ERROR_CODES.SAVE_MIGRATION);
  assert.equal(storage.raw(LOCAL_STORAGE_KEYS.canonical), futureRaw);

  const invalid = makeEnvelope(1);
  delete invalid.payload.checkpoint.metrics;
  const staged = adapter.stage(invalid);
  assert.equal(staged.ok, false);
  assert.equal(staged.error.code, STORAGE_ERROR_CODES.SAVE_SCHEMA);
  assert.equal(storage.raw(LOCAL_STORAGE_KEYS.staging), null);

  const nonJson = makeEnvelope(1);
  nonJson.revision = 1n;
  const serialized = adapter.stage(nonJson);
  assert.equal(serialized.ok, false);
  assert.equal(serialized.error.code, STORAGE_ERROR_CODES.SAVE_SCHEMA);
});

test("FR-SAV-004 skips a newer invalid candidate for a lower valid backup", () => {
  const invalidNewer = makeEnvelope(99);
  invalidNewer.payload.metrics.hp = 101;
  const storage = new MemoryStorage({
    [LOCAL_STORAGE_KEYS.canonical]: JSON.stringify(invalidNewer),
    [LOCAL_STORAGE_KEYS.backup]: rawEnvelope(7),
  });

  const loaded = createLocalStorageAdapter(storage).load();
  assert.equal(loaded.ok, true);
  assert.equal(loaded.value.source, "backup");
  assert.equal(loaded.value.envelope.revision, 7);
});

test("FR-SAV-004 skips future format during recovery while preserving its raw bytes", () => {
  const futureRaw = rawEnvelope(99, { saveFormatVersion: 2 });
  const currentRaw = rawEnvelope(7);
  const storage = new MemoryStorage({
    [LOCAL_STORAGE_KEYS.canonical]: currentRaw,
    [LOCAL_STORAGE_KEYS.backup]: futureRaw,
  });

  const loaded = createLocalStorageAdapter(storage).load();
  assert.equal(loaded.ok, true);
  assert.equal(loaded.value.source, "canonical");
  assert.equal(loaded.value.envelope.revision, 7);
  assert.equal(storage.raw(LOCAL_STORAGE_KEYS.backup), futureRaw);
});

test("FR-SAV-001 and FR-SAV-004 return null for an empty repository and typed errors for corrupt-only data", () => {
  const empty = createLocalStorageAdapter(new MemoryStorage()).load();
  assert.deepEqual(empty, { ok: true, value: null });

  const corruptStorage = new MemoryStorage({
    [LOCAL_STORAGE_KEYS.canonical]: "{broken",
  });
  const corrupt = createLocalStorageAdapter(corruptStorage).load();
  assert.equal(corrupt.ok, false);
  assert.equal(corrupt.error.code, STORAGE_ERROR_CODES.SAVE_PARSE);
  assert.equal(corruptStorage.raw(LOCAL_STORAGE_KEYS.canonical), "{broken");
});

test("FR-SAV-001 enforces monotonic revisions and rejects equal-revision forks", () => {
  const storage = new MemoryStorage({
    [LOCAL_STORAGE_KEYS.staging]: rawEnvelope(5, { reason: "checkpoint" }),
  });
  const adapter = createLocalStorageAdapter(storage);
  const originalStaging = storage.raw(LOCAL_STORAGE_KEYS.staging);

  const stale = adapter.stage(makeEnvelope(4));
  assert.equal(stale.ok, false);
  assert.equal(stale.error.code, STORAGE_ERROR_CODES.SAVE_SCHEMA);
  assert.equal(stale.error.details.reason, "STALE_REVISION");
  assert.equal(storage.raw(LOCAL_STORAGE_KEYS.staging), originalStaging);

  const fork = adapter.stage(makeEnvelope(5, { reason: "new-game" }));
  assert.equal(fork.ok, false);
  assert.equal(fork.error.details.reason, "REVISION_CONFLICT");
  assert.equal(storage.raw(LOCAL_STORAGE_KEYS.staging), originalStaging);
});

test("FR-SAV-001 strict validation rejects unknown fields and invalid date-time values", () => {
  const storage = new MemoryStorage();
  const adapter = createLocalStorageAdapter(storage);

  const unknownField = makeEnvelope(1);
  unknownField.payload.metrics.extra = 1;
  const unknownResult = adapter.stage(unknownField);
  assert.equal(unknownResult.ok, false);
  assert.equal(unknownResult.error.code, STORAGE_ERROR_CODES.SAVE_SCHEMA);
  assert.equal(unknownResult.error.details.reason, "UNKNOWN_FIELD");

  const invalidDate = makeEnvelope(1, { savedAt: "2026-09-01T12:30:60Z" });
  const dateResult = adapter.stage(invalidDate);
  assert.equal(dateResult.ok, false);
  assert.equal(dateResult.error.code, STORAGE_ERROR_CODES.SAVE_SCHEMA);
  assert.equal(dateResult.error.details.reason, "INVALID_DATE_TIME");
  assert.equal(storage.raw(LOCAL_STORAGE_KEYS.staging), null);
});

test("FR-SAV-006 clearWithConsent requires literal true and preserves settings and unrelated keys", () => {
  const initial = {
    [LOCAL_STORAGE_KEYS.canonical]: rawEnvelope(3),
    [LOCAL_STORAGE_KEYS.staging]: rawEnvelope(4),
    [LOCAL_STORAGE_KEYS.backup]: rawEnvelope(2),
    [LOCAL_STORAGE_KEYS.settings]: "settings-must-survive-save-reset",
    "other:application:key": "unrelated-must-survive",
  };
  const storage = new MemoryStorage(initial);
  const adapter = createLocalStorageAdapter(storage);

  for (const request of [
    undefined,
    {},
    { consent: false },
    { consent: 1 },
    { consent: "true" },
    { confirmed: true },
  ]) {
    const beforeCalls = storage.calls.length;
    const refused = adapter.clearWithConsent(request);
    assert.deepEqual(refused, { ok: true, value: { cleared: false, keys: [] } });
    assert.equal(storage.calls.length, beforeCalls);
    assert.equal(storage.raw(LOCAL_STORAGE_KEYS.canonical), initial[LOCAL_STORAGE_KEYS.canonical]);
  }

  const cleared = adapter.clearWithConsent({ consent: true });
  assert.equal(cleared.ok, true);
  assert.equal(cleared.value.cleared, true);
  assert.deepEqual(new Set(cleared.value.keys), SAVE_KEYS);
  for (const key of SAVE_KEYS) assert.equal(storage.raw(key), null);
  assert.equal(storage.raw(LOCAL_STORAGE_KEYS.settings), "settings-must-survive-save-reset");
  assert.equal(storage.raw("other:application:key"), "unrelated-must-survive");
});
