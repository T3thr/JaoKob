import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { loadGameContent } from "../../src/data/content/content-runtime.js";
import { createContentOrchestrator } from "../../src/core/use-cases/content-orchestration.js";

export const content = JSON.parse(readFileSync(new URL("../../src/data/content/packages/act-01.json", import.meta.url)));
export const testReferenceIds = JSON.parse(readFileSync(new URL("../../src/data/content/packages/act-01-test-catalog.json", import.meta.url)));
export const loaded = await loadGameContent({ content, testReferenceIds });
assert.equal(loaded.valid, true);
export const engine = createContentOrchestrator(loaded.catalog);
export const AT = "2026-09-04T04:00:00.000Z";
export const SESSION_ID = "123e4567-e89b-42d3-a456-426614174000";
export const flag = (snapshot, id) => snapshot.flags.find((record) => record.id === id)?.value;
export const unwrap = (result) => { assert.equal(result.ok, true, JSON.stringify(result.error)); return result.value.snapshot; };
export const start = () => unwrap(engine.start({ sessionId: SESSION_ID, at: AT }));
export const command = (snapshot, actionId) => ({ expectedRevision: snapshot.revision, at: AT, actionId });
export const ROUTES = ["mother", "roots", "siblings"].flatMap((home) => ["call-family", "seek-safety"].flatMap((coping) => ["keep-fragment", "release-fragment"].map((keepsake) => ({ home, coping, keepsake }))));

/** Test witness, deliberately separate from the content-driven executor. */
export function routeAction(snapshot, route, hotspots) {
  switch (snapshot.currentNodeId) {
    case "node.act1.nursery": return hotspots.length ? `interaction.act1.observe-${hotspots.shift()}` : "interaction.act1.join-family";
    case "node.act1.home-focus": return `choice.act1.focus-${route.home}`;
    case "node.act1.survival": return `choice.act1.${route.coping}`;
    case "node.act1.lily-fragment": return "interaction.act1.inspect-fragment";
    case "node.act1.keepsake": return `choice.act1.${route.keepsake}`;
    default: assert.fail(`Missing test witness action: ${snapshot.currentNodeId}`);
  }
}
export function walk(route = ROUTES[0], hotspots = []) {
  let snapshot = start();
  const snapshots = [snapshot], remaining = [...hotspots];
  for (let steps = 0; !engine.facts(snapshot).complete; steps += 1) {
    assert.ok(steps < 200, "playthrough must terminate");
    snapshot = unwrap(engine.facts(snapshot).canAdvance ? engine.advance(snapshot, command(snapshot)) : engine.act(snapshot, command(snapshot, routeAction(snapshot, route, remaining))));
    snapshots.push(snapshot);
  }
  return snapshots;
}
export function envelope(snapshot, settings = content.gameDefaults.settings) {
  const { revision, ...payload } = snapshot;
  return { saveFormatVersion: 1, contentVersion: "2.0.0", revision, createdAt: AT, savedAt: AT, reason: "checkpoint", payload, settings };
}
