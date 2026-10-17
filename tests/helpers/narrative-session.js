import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { loadGameContent } from "../../src/data/content/content-runtime.js";
import { createContentOrchestrator } from "../../src/core/use-cases/content-orchestration.js";

export const candidate = JSON.parse(readFileSync(new URL("../../src/data/content/packages/act-01.json", import.meta.url)));
export const candidateTestIds = JSON.parse(readFileSync(new URL("../../src/data/content/packages/act-01-test-catalog.json", import.meta.url)));
export const narrative = await loadGameContent({ content: candidate, testReferenceIds: candidateTestIds });
assert.equal(narrative.valid, true, JSON.stringify(narrative.errors));
export const story = createContentOrchestrator(narrative.catalog, { pouchEnabled: true });
export const AT = "2026-10-16T02:00:00+07:00";
export const SESSION = "123e4567-e89b-42d3-a456-426614174000";
export const value = result => { assert.equal(result.ok, true, JSON.stringify(result.error)); return result.value.snapshot; };
export const cmd = (snapshot, actionId) => ({ at: AT, expectedRevision: snapshot.revision, actionId });
export const fresh = () => value(story.start({ sessionId: SESSION, at: AT }));
export const save2 = snapshot => {
  const { revision, ...payload } = snapshot;
  return { saveFormatVersion: 2, contentVersion: "3.0.0", revision, createdAt: AT, savedAt: AT, reason: "checkpoint", payload, settings: candidate.gameDefaults.settings };
};
export const FULL_PLAN = Object.freeze({ dew: "collect", lotus: "collect", rain: "collect", fifth: "leave", leaf: "keep-fragment" });

/** Independent route witness; no production auto-play or domain debug hooks. */
export function narrativeAction(snapshot, plan = {}) {
  const id = snapshot.currentNodeId, done = snapshot.progress.completedNodeIds;
  if (id === "node.act1.nursery") {
    for (const key of ["dew", "lotus"]) if (plan[key] && !done.includes(`node.act1.secret-${key}`)) return `interaction.act1.visit-${key}`;
    return "interaction.act1.join-family";
  }
  if (id === "node.act1.home-focus") return `choice.act1.focus-${plan.home ?? "mother"}`;
  if (id === "node.act1.survival") return `choice.act1.${plan.coping ?? "seek-safety"}`;
  if (id === "node.act1.lily-fragment") return "interaction.act1.inspect-fragment";
  if (id === "node.act1.keepsake") return `choice.act1.${plan.leaf ?? "release-fragment"}`;
  for (const key of ["dew", "lotus", "rain"]) if (id === `node.act1.${key}-offer`) return `choice.act1.${plan[key] === "collect" ? "collect" : "leave"}-${key}-offer`;
  if (id === "node.act1.quiet-bank") {
    if (plan.rain && !done.includes("node.act1.secret-rain")) return "interaction.act1.visit-rain";
    if (plan.fifth && !snapshot.pouch.remembered.includes("item_river_shell")) return "interaction.act1.visit-river-shell";
    return "interaction.act1.settle-for-night";
  }
  if (id === "node.act1.river-offer") return plan.fifth?.startsWith("exchange-") ? `choice.act1.${plan.fifth}` : `choice.act1.${plan.fifth === "collect" ? "collect" : "leave"}-river-offer`;
  assert.fail(`Missing candidate witness action at ${id}`);
}

export function travel(plan = {}, { stop = () => false, initial = fresh(), release = [] } = {}) {
  let snapshot = initial;
  const snapshots = [snapshot], edges = [], released = new Set();
  for (let step = 0; !story.facts(snapshot).complete && !stop(snapshot); step++) {
    assert.ok(step < 240, "Candidate route must terminate");
    const fact = story.facts(snapshot);
    if (snapshot.currentNodeId === "node.act1.quiet-bank") {
      for (const itemId of release) if (snapshot.pouch.held.includes(itemId) && !released.has(itemId)) {
        const opportunity = story.pouchOpportunity(snapshot);
        snapshot = value(story.pouchAction(snapshot, { ...cmd(snapshot), opportunityId: opportunity.id, action: "release", itemId }));
        snapshots.push(snapshot); released.add(itemId);
      }
    }
    const before = snapshot;
    if (fact.canAdvance) snapshot = value(story.advance(snapshot, cmd(snapshot)));
    else snapshot = value(story.act(snapshot, cmd(snapshot, narrativeAction(snapshot, plan))));
    if (before.currentNodeId !== snapshot.currentNodeId || !fact.canAdvance) edges.push({ from: before.currentNodeId, to: snapshot.currentNodeId, actionId: fact.canAdvance ? null : narrativeAction(before, plan) });
    snapshots.push(snapshot);
  }
  return { snapshot, snapshots, edges };
}
