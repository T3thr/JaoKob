import test from "node:test";
import assert from "node:assert/strict";

import {
  RENDERER_ERROR_CODES,
  RENDERER_PORT_OPERATIONS,
  assertRendererPort,
  createRendererPort,
  isRendererPort,
} from "../../src/core/ports/renderer-port.js";
import {
  STORAGE_ERROR_CODES,
  STORAGE_PORT_OPERATIONS,
  assertStoragePort,
  createStoragePort,
  isStoragePort,
} from "../../src/core/ports/storage-port.js";

function implementationFor(operations, operationFactory = () => ({ ok: true })) {
  return Object.fromEntries(
    operations.map((operation) => [
      operation,
      function implementation(...args) {
        return operationFactory.call(this, operation, args);
      },
    ]),
  );
}

function assertPortContractError(action, expectedName, expectedCode, operation) {
  assert.throws(action, (error) => {
    assert.ok(error instanceof TypeError);
    assert.equal(error.name, expectedName);
    assert.equal(error.code, expectedCode);
    if (operation !== undefined) {
      assert.match(error.message, new RegExp(`\\.${operation}\\b`));
    }
    return true;
  });
}

test("FR-UI-001 exposes the immutable RenderPort operation and error contract", () => {
  assert.deepEqual(RENDERER_PORT_OPERATIONS, [
    "render",
    "setBusy",
    "announce",
    "applyFocusDirective",
    "showFatalShell",
  ]);
  assert.deepEqual(RENDERER_ERROR_CODES, { RENDER_FAILURE: "RENDER_FAILURE" });
  assert.equal(Object.isFrozen(RENDERER_PORT_OPERATIONS), true);
  assert.equal(Object.isFrozen(RENDERER_ERROR_CODES), true);
  assert.equal(new Set(RENDERER_PORT_OPERATIONS).size, RENDERER_PORT_OPERATIONS.length);
});

test("FR-SAV-001 exposes the immutable SaveRepositoryPort operation and error contract", () => {
  assert.deepEqual(STORAGE_PORT_OPERATIONS, [
    "recoverCandidates",
    "load",
    "stage",
    "commit",
    "checkpoint",
    "clearWithConsent",
  ]);
  assert.deepEqual(STORAGE_ERROR_CODES, {
    SAVE_PARSE: "SAVE_PARSE",
    SAVE_SCHEMA: "SAVE_SCHEMA",
    SAVE_MIGRATION: "SAVE_MIGRATION",
    STORAGE_UNAVAILABLE: "STORAGE_UNAVAILABLE",
    STORAGE_QUOTA: "STORAGE_QUOTA",
  });
  assert.equal(Object.isFrozen(STORAGE_PORT_OPERATIONS), true);
  assert.equal(Object.isFrozen(STORAGE_ERROR_CODES), true);
  assert.equal(new Set(STORAGE_PORT_OPERATIONS).size, STORAGE_PORT_OPERATIONS.length);
});

test("NFR-MA-001 RenderPort validation accepts a complete structural adapter without invocation", () => {
  let invocationCount = 0;
  const candidate = implementationFor(RENDERER_PORT_OPERATIONS, () => {
    invocationCount += 1;
    return { ok: true };
  });
  candidate.adapterMetadata = "allowed-by-structural-contract";

  assert.equal(isRendererPort(candidate), true);
  assert.equal(assertRendererPort(candidate), undefined);
  assert.equal(invocationCount, 0);
});

test("NFR-MA-001 StoragePort validation accepts a complete structural adapter without invocation", () => {
  let invocationCount = 0;
  const candidate = implementationFor(STORAGE_PORT_OPERATIONS, () => {
    invocationCount += 1;
    return { ok: true };
  });
  candidate.adapterMetadata = "allowed-by-structural-contract";

  assert.equal(isStoragePort(candidate), true);
  assert.equal(assertStoragePort(candidate), undefined);
  assert.equal(invocationCount, 0);
});

test("NFR-MA-001 RenderPort rejects non-objects, arrays, missing methods, and non-callable methods", () => {
  for (const candidate of [null, undefined, [], "renderer"]) {
    assert.equal(isRendererPort(candidate), false);
    assertPortContractError(
      () => assertRendererPort(candidate),
      "RendererPortContractError",
      "INVALID_RENDERER_PORT",
    );
  }

  for (const operation of RENDERER_PORT_OPERATIONS) {
    const missing = implementationFor(RENDERER_PORT_OPERATIONS);
    delete missing[operation];
    assert.equal(isRendererPort(missing), false);
    assertPortContractError(
      () => assertRendererPort(missing),
      "RendererPortContractError",
      "INVALID_RENDERER_PORT",
      operation,
    );

    const nonCallable = implementationFor(RENDERER_PORT_OPERATIONS);
    nonCallable[operation] = true;
    assert.equal(isRendererPort(nonCallable), false);
    assertPortContractError(
      () => assertRendererPort(nonCallable),
      "RendererPortContractError",
      "INVALID_RENDERER_PORT",
      operation,
    );
  }
});

test("NFR-MA-001 StoragePort rejects non-objects, arrays, missing methods, and non-callable methods", () => {
  for (const candidate of [null, undefined, [], "storage"]) {
    assert.equal(isStoragePort(candidate), false);
    assertPortContractError(
      () => assertStoragePort(candidate),
      "StoragePortContractError",
      "INVALID_STORAGE_PORT",
    );
  }

  for (const operation of STORAGE_PORT_OPERATIONS) {
    const missing = implementationFor(STORAGE_PORT_OPERATIONS);
    delete missing[operation];
    assert.equal(isStoragePort(missing), false);
    assertPortContractError(
      () => assertStoragePort(missing),
      "StoragePortContractError",
      "INVALID_STORAGE_PORT",
      operation,
    );

    const nonCallable = implementationFor(STORAGE_PORT_OPERATIONS);
    nonCallable[operation] = true;
    assert.equal(isStoragePort(nonCallable), false);
    assertPortContractError(
      () => assertStoragePort(nonCallable),
      "StoragePortContractError",
      "INVALID_STORAGE_PORT",
      operation,
    );
  }
});

test("NFR-PO-003 RendererPort facade is frozen, binds adapter context, and forwards exact arguments", async () => {
  const calls = [];
  const implementation = implementationFor(
    RENDERER_PORT_OPERATIONS,
    function operationFactory(operation, args) {
      assert.strictEqual(this, implementation);
      calls.push({ operation, args });
      if (operation === "announce") {
        return Promise.resolve(Object.freeze({ ok: true, value: "announced" }));
      }
      return Object.freeze({ ok: true, value: operation });
    },
  );
  const port = createRendererPort(implementation);

  assert.equal(Object.isFrozen(port), true);
  assert.deepEqual(Object.keys(port), RENDERER_PORT_OPERATIONS);

  const argumentsByOperation = {
    render: [{ view: "title" }],
    setBusy: [true],
    announce: [{ messageId: "ui.choice.committed" }],
    applyFocusDirective: [{ targetId: "choice-list" }],
    showFatalShell: [{ code: "CONTENT_SCHEMA" }],
  };

  for (const operation of RENDERER_PORT_OPERATIONS) {
    const outcome = await port[operation](...argumentsByOperation[operation]);
    assert.equal(outcome.ok, true);
  }

  assert.deepEqual(calls, RENDERER_PORT_OPERATIONS.map((operation) => ({
    operation,
    args: argumentsByOperation[operation],
  })));
});

test("NFR-MA-001 StoragePort facade is frozen, binds adapter context, and preserves typed outcomes", async () => {
  const calls = [];
  const implementation = implementationFor(
    STORAGE_PORT_OPERATIONS,
    function operationFactory(operation, args) {
      assert.strictEqual(this, implementation);
      calls.push({ operation, args });
      if (operation === "load") {
        return Promise.resolve(Object.freeze({
          ok: false,
          error: Object.freeze({ code: STORAGE_ERROR_CODES.SAVE_PARSE }),
        }));
      }
      return Object.freeze({ ok: true, value: operation });
    },
  );
  const port = createStoragePort(implementation);

  assert.equal(Object.isFrozen(port), true);
  assert.deepEqual(Object.keys(port), STORAGE_PORT_OPERATIONS);

  const argumentsByOperation = {
    recoverCandidates: [],
    load: [{ revision: 4 }],
    stage: [{ saveFormatVersion: 1 }],
    commit: [{ revision: 5 }],
    checkpoint: [{ saveFormatVersion: 1 }],
    clearWithConsent: [{ confirmed: true }],
  };

  for (const operation of STORAGE_PORT_OPERATIONS) {
    const outcome = await port[operation](...argumentsByOperation[operation]);
    if (operation === "load") {
      assert.deepEqual(outcome, {
        ok: false,
        error: { code: STORAGE_ERROR_CODES.SAVE_PARSE },
      });
    } else {
      assert.equal(outcome.ok, true);
    }
  }

  assert.deepEqual(calls, STORAGE_PORT_OPERATIONS.map((operation) => ({
    operation,
    args: argumentsByOperation[operation],
  })));
});

test("NFR-MA-001 port facades expose no concrete adapter properties", () => {
  const rendererImplementation = implementationFor(RENDERER_PORT_OPERATIONS);
  rendererImplementation.document = { forbidden: true };
  const storageImplementation = implementationFor(STORAGE_PORT_OPERATIONS);
  storageImplementation.localStorage = { forbidden: true };

  const rendererPort = createRendererPort(rendererImplementation);
  const storagePort = createStoragePort(storageImplementation);

  assert.equal("document" in rendererPort, false);
  assert.equal("localStorage" in storagePort, false);
  assert.deepEqual(Object.keys(rendererPort), RENDERER_PORT_OPERATIONS);
  assert.deepEqual(Object.keys(storagePort), STORAGE_PORT_OPERATIONS);
});
