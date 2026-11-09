import test from "node:test";
import assert from "node:assert/strict";

import {
  AUDIO_PORT_OPERATIONS, AUDIO_STATUSES, assertAudioPort, createAudioPort,
  isAudioDesiredState, isAudioPort,
} from "../../src/core/ports/audio-port.js";

/**
 * The AudioPort of Core (ADR-P0-015), kept for the sound of T7. The RendererPort and StoragePort
 * tests of the earlier runtime were removed with it in C5e (superseded assertion register §5):
 * the Journey screens and saves have their own contracts.
 */

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

test("CR-0003 D2 AudioPort validates a pure five-operation structure without invocation", () => {
  assert.deepEqual(AUDIO_PORT_OPERATIONS, ["unlock", "reconcile", "playEffect", "suspend", "dispose"]);
  assert.deepEqual(AUDIO_STATUSES, ["ready", "blocked", "unavailable"]);
  assert.ok(Object.isFrozen(AUDIO_PORT_OPERATIONS)); assert.ok(Object.isFrozen(AUDIO_STATUSES));
  const implementation = implementationFor(AUDIO_PORT_OPERATIONS, () => assert.fail("must not invoke"));
  assert.ok(isAudioPort(implementation)); assertAudioPort(implementation);
  for (const value of [null, undefined, [], "audio", {}]) {
    assert.equal(isAudioPort(value), false);
    assertPortContractError(() => assertAudioPort(value), "AudioPortContractError", "INVALID_AUDIO_PORT");
  }
  for (const operation of AUDIO_PORT_OPERATIONS) {
    const missing = { ...implementation }; delete missing[operation];
    assertPortContractError(() => assertAudioPort(missing), "AudioPortContractError", "INVALID_AUDIO_PORT", operation);
  }
});

test("CR-0003 D2 AudioPort preserves synchronous activation, exact arguments and nonfatal outcomes", async () => {
  const calls = [], input = { sessionId: "session" };
  const implementation = implementationFor(AUDIO_PORT_OPERATIONS, function (operation, args) {
    assert.equal(this, implementation); calls.push({ operation, args });
    return operation === "suspend" ? Promise.resolve({ status: "ready" }) : { status: "blocked", code: "AUDIO_GESTURE_REQUIRED" };
  });
  implementation.context = {};
  const facade = createAudioPort(implementation);
  assert.deepEqual(Object.keys(facade), AUDIO_PORT_OPERATIONS); assert.ok(Object.isFrozen(facade));
  const outcome = facade.unlock();
  assert.equal(calls[0].operation, "unlock"); assert.equal(outcome.status, "blocked");
  facade.reconcile(input); assert.equal(calls[1].args[0], input);
  assert.equal((await facade.suspend()).status, "ready");
  implementation.playEffect = () => { throw Error("private error"); };
  assert.deepEqual(facade.playEffect(), { status: "unavailable", code: "AUDIO_FAILURE" });
  implementation.playEffect = () => Promise.reject(Error("private error"));
  assert.deepEqual(await facade.playEffect(), { status: "unavailable", code: "AUDIO_FAILURE" });
  implementation.playEffect = () => ({ status: "surprise" });
  assert.deepEqual(facade.playEffect(), { status: "unavailable", code: "AUDIO_FAILURE" });
});

test("CR-0003 D2 accepted audio desire permits zero settings but rejects platform/unknown/accessor data", () => {
  const desired = { sessionId: "session-1", bgmAssetId: "asset.audio.loop", volumes: { master: 0, music: 0, ambience: 0, effects: 0 }, reducedIntensity: false };
  assert.ok(isAudioDesiredState(desired)); assert.ok(isAudioDesiredState({ ...desired, sessionId: null }));
  for (const update of [{ sessionId: 1 }, { bgmAssetId: "https://outside.test/audio.mp3" }, { reducedIntensity: 0 }, { node: {} }, { volumes: { ...desired.volumes, master: -1 } }, { volumes: { ...desired.volumes, effects: Infinity } }]) {
    assert.equal(isAudioDesiredState({ ...desired, ...update }), false);
  }
  const accessor = { ...desired }; Object.defineProperty(accessor, "bgmAssetId", { get: () => assert.fail("do not invoke getter") });
  assert.equal(isAudioDesiredState(accessor), false);
});
