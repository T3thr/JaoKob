/** Reproducible ADR-P0-021 design evidence; no later-act runtime or browser claim. */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { design, enumerateDesign, walkDesign } from "../helpers/ending-design-graph.js";

const contexts = [];
for (const leaf of ["unseen", "held", "released", "refused"]) for (const minimum of [false, true]) {
  const paths = enumerateDesign({ leaf, ...(minimum ? { metrics: { hp: 1, sanity: 1, bond: 0 } } : {}) });
  const endings = Object.fromEntries(design.endings.map(e => [e.id, paths.filter(p => p.ending === e.id).length]));
  assert.ok(Object.values(endings).every(count => count > 0));
  assert.equal(Object.values(endings).reduce((sum, count) => sum + count, 0), paths.length);
  contexts.push({ leaf, initial: minimum ? "hp1-sanity1-bond0" : "hp80-sanity70-bond0", paths: paths.length, endings,
    coveredChoices: [...new Set(paths.flatMap(p => p.trace.map(t => t.choiceId)))].sort() });
}
const witnesses = design.witnesses.map(w => {
  const p = walkDesign(w.choices);
  assert.equal(p.ending, w.expectedEnding);
  assert.deepEqual(p.trace.map(t => t.metrics.bond), w.bondTrace);
  return { id: w.id, choices: w.choices, trace: p.trace, finalMetrics: p.snapshot.metrics, ending: p.ending };
});
const hash = path => createHash("sha256").update(readFileSync(new URL(path, import.meta.url))).digest("hex");
console.log(JSON.stringify({ result: "PASS", authority: "ADR-P0-021 D1",
  scope: "Executable design verification with Core guards/transactions; later-act production content and UI remain S5",
  designSha256: hash("../fixtures/narrative/act-04-05-design-graph.json"),
  transactionSha256: hash("../../src/core/use-cases/choice-transaction.js"),
  nodes: design.nodes.length, edges: design.nodes.reduce((sum,n) => sum + n.choices.length, 0), contexts, witnesses }, null, 2));
