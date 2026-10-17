import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createGameApplication } from "../../src/bootstrap/index.js";
import { MemoryStorage, FakeDocument } from "./application-harness.js";
import { LOCAL_STORAGE_KEYS } from "../../src/data/persistence/local-storage-adapter.js";

export const KEYS = LOCAL_STORAGE_KEYS;
export const BASE = "https://game.test/JaoKob/";
export const AT = "2026-10-17T14:00:28+07:00";
export const json = path => JSON.parse(readFileSync(new URL(`../../${path}`, import.meta.url)));
export const decoration = json("src/data/content/presentation/act-01-3.0.0.json");
export const current = json("src/data/content/packages/act-01.json");
export const legacy = json("src/data/content/compatibility/act-01-2.1.0.json");
export const registry = json("assets/provenance/act-01-3.0.0.json");

/** Test-only same-origin reader, restricted to known content/presentation files. */
export function contentReader() {
  const paths = ["src/data/content/packages/act-01.json", "src/data/content/packages/act-01-test-catalog.json",
    "src/data/content/compatibility/act-01-2.1.0.json", "src/data/content/compatibility/act-01-2.0.0.json",
    "src/data/content/presentation/act-01-3.0.0.json", "src/data/content/presentation/act-01-2.1.0.json"];
  const files = new Map(paths.map(path => [path, readFileSync(new URL(`../../${path}`, import.meta.url), "utf8")]));
  const requests = [];
  return { requests, fetch: async (url, init) => {
    const parsed = new URL(url); requests.push({ url: parsed.href, init });
    const path = parsed.pathname.replace(/^\/JaoKob\//u, "");
    if (parsed.origin !== new URL(BASE).origin || !files.has(path)) return new Response("missing", { status: 404 });
    const response = new Response(files.get(path), { headers: { "content-type": "application/json; charset=utf-8" } });
    Object.defineProperty(response, "url", { value: parsed.href }); return response;
  } };
}

export function closeoutHarness(records = {}, options = {}) {
  const memory = records instanceof MemoryStorage ? records : new MemoryStorage(records);
  const reader = contentReader(), document = new FakeDocument(), root = document.createElement("div");
  const app = createGameApplication({ root, document, rawStorage: memory, fetch: reader.fetch,
    baseUrl: `${BASE}src/data/content/content-runtime.js`, applicationBaseUrl: BASE,
    mediaEnabled: false, clock: () => AT, sessionIdFactory: () => "123e4567-e89b-42d3-a456-426614174001", ...options });
  return { app, memory, requests: reader.requests, document, root };
}
export const choose = async (app, choiceId) => {
  const result = await app.dispatch({ type: "SELECT_CHOICE", choiceId });
  assert.equal(result.ok, true, JSON.stringify(result.error)); return result;
};
export const writes = memory => memory.calls.filter(c => c.method !== "getItem");
