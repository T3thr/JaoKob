// Storage double and drivers for the Journey persistence tests (TC-S5-SAVE-001/002,
// TC-S5-REPLAY-001, TC-S5-LEGACY-001, TC-S5-PACKAGE-001). Independent of the Sprint 4 harness,
// which leaves with the earlier runtime in C5.
import { readFileSync } from "node:fs";
import { createJourneyApplication } from "../../src/bootstrap/journey-application.js";
import { journeySaveKeys } from "../../src/data/persistence/journey-save-repository.js";
import { SESSION_ID, loadAct1Package } from "./journey-driver.js";

export const START = "2026-11-04T09:00:00.000Z";
export const KEYS = journeySaveKeys("story.jaokob.core");
export const MINI_KEYS = journeySaveKeys("story.fixture.mini");
export const loadMini = () => JSON.parse(readFileSync(new URL("../fixtures/journey/mini-journey.json", import.meta.url), "utf8"));

/**
 * LocalStorage double that records every call. Hooks:
 *   beforeSet(key, value)  throw to fail a write (quota, unavailable)
 *   afterGet(key, count)   change other records between reads (another tab)
 *   dropWrites             setItem silently does nothing (broken storage)
 */
export class SpyStorage {
  constructor(initial = {}) {
    this.entries = new Map(Object.entries(initial));
    this.calls = [];
    this.gets = 0;
    this.beforeSet = null;
    this.afterGet = null;
    this.dropWrites = false;
  }
  getItem(key) {
    this.calls.push({ method: "getItem", key });
    const value = this.entries.has(key) ? this.entries.get(key) : null;
    this.gets += 1;
    this.afterGet?.(key, this.gets);
    return value;
  }
  setItem(key, value) {
    this.calls.push({ method: "setItem", key });
    this.beforeSet?.(key, String(value));
    if (!this.dropWrites) this.entries.set(key, String(value));
  }
  removeItem(key) {
    this.calls.push({ method: "removeItem", key });
    this.entries.delete(key);
  }
  raw(key) { return this.entries.has(key) ? this.entries.get(key) : null; }
  json(key) { return JSON.parse(this.raw(key)); }
  /** Calls that changed something, optionally only for keys matching `prefix`. */
  writes(prefix = "") { return this.calls.filter((c) => c.method !== "getItem" && c.key.startsWith(prefix)); }
  snapshot() { return new Map(this.entries); }
}

export const quotaError = () => Object.assign(new Error("full"), { name: "QuotaExceededError" });

/** A clock that moves one second per call. */
export function steppingClock(start = START, stepMs = 1000) {
  let at = Date.parse(start) - stepMs;
  return () => new Date((at += stepMs)).toISOString();
}

export function createApp(storage, { packageData = loadAct1Package(), clock = steppingClock(), sessionId = SESSION_ID } = {}) {
  return createJourneyApplication({ packageData, storage, clock, sessionIdFactory: () => sessionId });
}

/** Unwrap an ok result or fail with its error. */
export function value(result) {
  if (!result.ok) throw new Error(`expected ok, got ${JSON.stringify(result.error)}`);
  return result.value;
}

/**
 * Drive a playing app with a policy (tests/helpers/journey-driver.js `planned`) until the policy
 * stops, `until(view)` is true, or a command is rejected. Returns the results in order.
 */
export function drive(app, policy, { until = () => false, limit = 5000 } = {}) {
  const results = [];
  for (let i = 0; i < limit; i += 1) {
    const view = value(app.view()).view;
    if (until(view)) return { results, view };
    const command = policy(view);
    if (command === null) return { results, view };
    const result = app.perform(command.kind, { revision: view.revision, ...(command.args ?? {}) });
    results.push({ kind: command.kind, result });
    if (!result.ok) return { results, view, error: result.error };
  }
  throw new Error("the policy did not finish");
}
