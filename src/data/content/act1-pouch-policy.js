/** Explicit bridge for unchanged content 2.1.0; authored package 3.0/DSL is T7.
 * Keeps stable narrative IDs out of generic Core orchestration. ADR-P0-020.
 */
export function act1PouchPolicy(packageData, indexes) {
  if (packageData.contentVersion !== "2.1.0") return null;
  const keep = indexes.choices["choice.act1.keep-fragment"], refuse = indexes.choices["choice.act1.release-fragment"];
  const rest = indexes.nodes["node.act1.rest"];
  if (!keep?.effects.some(effect => effect.type === "set-flag" && effect.flagId === "keepsake.lily_fragment" && effect.value === true)
    || !refuse?.effects.some(effect => effect.type === "set-flag" && effect.flagId === "coping.let_go_early" && effect.value === true)
    || !rest?.completion) return null;
  return {
    itemIds: ["item_leaf"],
    actionEffects: {
      "choice.act1.keep-fragment": { action: "collect", itemId: "item_leaf" },
      "choice.act1.release-fragment": { action: "refuse", itemId: "item_leaf" },
    },
    historyBindings: [{ itemId: "item_leaf", acquiredFlagId: "keepsake.lily_fragment", refusedFlagId: "coping.let_go_early", refusalToken: "refused_leaf" }],
    opportunities: [{ id: "opportunity.act1.rest.release", nodeId: rest.id, safe: true, states: ["Cutscene"], actions: ["release"], requireComplete: true }],
  };
}
