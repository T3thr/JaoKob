import { loadContentPackage } from "./content-loader.js";
import { contentFailure, deepFreeze } from "../validation/content-values.js";

/** Static loading and capability normalization. Trace: FR-CNT-001, CR-0002 D3/D4. */
export async function loadGameContent(options = {}) {
  const baseUrl = options.baseUrl ?? import.meta.url;
  const source = options.content ?? options.packageSource ?? new URL("./packages/act-01.json", import.meta.url).href;
  let testReferenceIds = options.testReferenceIds;
  if (!testReferenceIds) {
    try {
      const base = new URL(baseUrl);
      const url = new URL(options.catalogSource ?? new URL("./packages/act-01-test-catalog.json", import.meta.url).href, base);
      if (!["http:", "https:"].includes(url.protocol) || url.origin !== base.origin || url.username || url.password || url.hash) return contentFailure("$catalog", "CONTENT_ORIGIN", "Test catalog must be same-origin.");
      const response = await (options.fetch ?? globalThis.fetch)(url.href, { credentials: "omit", redirect: "error", mode: "same-origin" });
      if (!response.ok || response.redirected || (response.url && new URL(response.url).origin !== base.origin)) return contentFailure("$catalog", "CONTENT_LOAD", "Test catalog request failed.");
      testReferenceIds = JSON.parse(await response.text());
    } catch { return contentFailure("$catalog", "CONTENT_LOAD", "Test catalog could not be loaded."); }
  }
  const loaded = await loadContentPackage(source, { baseUrl, fetch: options.fetch, testReferenceIds, expectedContentVersion: options.expectedContentVersion });
  return loaded.valid ? prepareRuntimeContent(loaded) : loaded;
}

/** Reject unsupported behavior before creating a usable application session. */
export function prepareRuntimeContent(loaded) {
  const data = loaded.packageData, indexes = loaded.indexes;
  const nodes = Object.values(indexes.nodes), events = Object.values(indexes.events);
  const unsupported = (path) => contentFailure(path, "CONTENT_CAPABILITY", "The current executor cannot safely represent this capability.");
  if (data.schemaVersion !== "1.1.0" || data.narrativeTrees.length !== 1 || nodes.length > 256) return unsupported("$.narrativeTrees");
  if (loaded.entry.node.type !== "cutscene" || loaded.entry.node.checkpointPolicy !== "before-node") return unsupported("$.entryTreeId");
  const adjacency = Object.fromEntries(nodes.map((node) => [node.id, []]));
  for (const node of nodes) {
    if (node.act !== 1 || !["cutscene", "exploration", "decision"].includes(node.type)) return unsupported(node.id);
    if (node.checkpointPolicy === "after-node" && !node.completion) return unsupported(node.id);
    const actions = [...(node.choices ?? []), ...(node.interactions ?? [])];
    if (actions.some((action) => action.id.startsWith("application."))) return unsupported(node.id);
    const effects = [...node.onEnterEffects, ...actions.flatMap((action) => action.effects)];
    if (effects.some((effect) => effect.type === "set-checkpoint")) return unsupported(node.id);
    const targets = [...(node.nextNodeId ? [node.nextNodeId] : []), ...actions.map((action) => action.nextNodeId)];
    for (const target of targets) {
      const type = indexes.nodes[target].type;
      if ((node.type === "decision" && !["cutscene", "exploration"].includes(type)) || (node.type === "exploration" && !["cutscene", "decision"].includes(type))) return unsupported(node.id);
    }
    adjacency[node.id] = targets;
    if (new Set(node.dialogueIds).size !== (node.dialogueIds?.length ?? 0)) return unsupported(node.id);
  }
  function reachable(start, skip = null) {
    const seen = new Set(start.filter((id) => id !== skip)), queue = [...seen];
    for (let i = 0; i < queue.length; i += 1) for (const target of adjacency[queue[i]]) {
      if (target !== skip && !seen.has(target)) { seen.add(target); queue.push(target); }
    }
    return seen;
  }
  if (reachable([loaded.entry.node.id]).size !== nodes.length) return unsupported("$.narrativeTrees");
  for (const event of events) {
    if (event.trigger.type !== "node-entered" || event.resolution.nextNodeId || event.maxOccurrences !== 1 || event.resolution.effects.some((effect) => effect.type === "set-checkpoint")) return unsupported(event.id);
    if (event.resolution.dialogueIds?.length) {
      // A replayable event-dialogue slot needs per-visit cursor metadata. The
      // current contract only supports stable, single-visit voiced slots.
      const id = event.trigger.nodeId;
      if (reachable(adjacency[id]).has(id)) return unsupported(event.id);
      const sameNode = events.filter((candidate) => candidate.trigger.nodeId === id);
      const read = new Set();
      const collect = (value) => {
        if (!value || typeof value !== "object") return;
        if (value.flagId) read.add(`flag:${value.flagId}`);
        if (value.metric) read.add(`metric:${value.metric}`);
        Object.values(value).forEach(collect);
      };
      sameNode.forEach((candidate) => collect(candidate.conditions));
      if (sameNode.flatMap((candidate) => candidate.resolution.effects).some((effect) => read.has(effect.flagId ? `flag:${effect.flagId}` : `metric:${effect.metric}`))) return unsupported(event.id);
      const baseIds = indexes.nodes[id].dialogueIds ?? [];
      if (event.resolution.dialogueIds.some((dialogueId) => baseIds.includes(dialogueId)) || new Set(event.resolution.dialogueIds).size !== event.resolution.dialogueIds.length) return unsupported(event.id);
    }
  }
  const dominators = Object.fromEntries(nodes.map((target) => [target.id, nodes.filter((candidate) => candidate.id === target.id || !reachable([loaded.entry.node.id], candidate.id).has(target.id)).map((candidate) => candidate.id)]));
  const treeByNode = Object.fromEntries(data.narrativeTrees.flatMap((tree) => tree.nodes.map((node) => [node.id, tree.treeId])));
  return deepFreeze({ valid: true, packageData: data, indexes,
    catalog: { version: data.contentVersion, entryNodeId: loaded.entry.node.id, entryTreeId: loaded.entry.tree.treeId,
      defaults: data.gameDefaults, nodes: indexes.nodes, dialogues: indexes.dialogues, events, flags: data.flagDefinitions, treeByNode, dominators },
  });
}
