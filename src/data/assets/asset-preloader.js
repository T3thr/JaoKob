/** Bounded, side-effect-free media scheduling. Trace: CR-0003 D4, NFR-PE-005. */
const keyOf = (reference) => `${reference.contentVersion}:${reference.assetId}`;

/** Select current and one-hop media from accepted facts; never evaluate guards or walk the graph. */
export function selectPresentationAssets({ loaded, visual, facts, soundRequested = false, dataSaving = false } = {}) {
  const version = loaded?.catalog?.version;
  const node = loaded?.indexes?.nodes[visual?.nodeId];
  const reference = (assetId) => ({ assetId, contentVersion: version });
  const media = (target) => {
    if (!target) return [];
    const environment = target.environment ?? {};
    return [environment.backgroundAssetId ?? target.backgroundAssetId,
      ...(soundRequested ? [environment.bgmAssetId, environment.ambientAssetId] : [])].filter(Boolean).map(reference);
  };
  const current = [...(visual?.imageRequests ?? []), ...(soundRequested ? media(node).filter((item) => loaded.indexes.assets[item.assetId]?.type === "audio") : [])];
  const next = [];
  if (node && facts?.nodeId === node.id && !dataSaving && !facts.complete) {
    const actions = [...(node.choices ?? []), ...(node.interactions ?? [])];
    const targets = actions.filter((action) => facts.actions?.some((fact) => fact.id === action.id && fact.eligible)).map((action) => action.nextNodeId);
    if (node.type === "cutscene" && node.nextNodeId && facts.canAdvance) targets.unshift(node.nextNodeId);
    for (const id of new Set(targets)) next.push(...media(loaded.indexes.nodes[id]));
  }
  const unique = (items) => [...new Map(items.map((item) => [keyOf(item), item])).values()];
  return Object.freeze({ current: Object.freeze(unique(current)), next: Object.freeze(unique(next)), dataSaving, soundRequested });
}

/**
 * load receives (reference,{signal,speculative}) and may return a releasable cache
 * lease. At most two unfinished loads and sixteen queued demands are retained.
 * Timeout aborts work without freeing its concurrency slot until it actually ends.
 */
export function createAssetPreloader({ load, concurrency = 2, timeoutMs = 10_000 } = {}) {
  const limit = Math.max(1, Math.min(2, Math.floor(concurrency) || 2));
  const jobs = new Map();
  const completed = new Set(), failed = new Set();
  let queue = [], disposed = false, generation = 0, lastRequest = {};
  function pump() {
    while (!disposed && jobs.size < limit && queue.length) {
      const demand = queue.shift();
      if (jobs.has(demand.key) || completed.has(demand.key) || failed.has(demand.key)) continue;
      const controller = new AbortController();
      const job = { controller, generation, speculative: demand.speculative, successful: false };
      jobs.set(demand.key, job);
      const timer = setTimeout(() => controller.abort(), Math.max(1, Math.min(10_000, timeoutMs)));
      Promise.resolve().then(() => load(demand.reference, { signal: controller.signal, speculative: demand.speculative }))
        .then((value) => {
          job.successful = Boolean(value && value.ok !== false);
          value?.release?.();
        }, () => undefined).finally(() => {
          clearTimeout(timer);
          if (!controller.signal.aborted && job.successful) completed.add(demand.key);
          else failed.add(demand.key);
          jobs.delete(demand.key);
          pump();
        });
    }
  }
  function update({ current = [], next = [], dataSaving = false } = {}) {
    if (disposed) return;
    generation += 1;
    lastRequest = { current, next, dataSaving };
    const candidates = [...current.map((reference) => ({ reference, speculative: false })),
      ...(dataSaving ? [] : next.map((reference) => ({ reference, speculative: true })))];
    const demands = [...new Map(candidates.filter(({ reference }) => reference?.assetId && reference?.contentVersion)
      .map((demand) => [keyOf(demand.reference), { ...demand, key: keyOf(demand.reference) }]).reverse()).values()].reverse().slice(0, 16);
    const wanted = new Set(demands.map((demand) => demand.key));
    for (const [key, job] of jobs) if (!wanted.has(key)) job.controller.abort();
    for (const key of completed) if (!wanted.has(key)) completed.delete(key);
    for (const key of failed) if (!wanted.has(key)) failed.delete(key);
    queue = demands.filter((demand) => !jobs.has(demand.key) && !completed.has(demand.key) && !failed.has(demand.key));
    pump();
  }
  function retry() { failed.clear(); update(lastRequest); }
  function dispose() { disposed = true; queue = []; completed.clear(); failed.clear(); for (const job of jobs.values()) job.controller.abort(); }
  return Object.freeze({ update, retry, dispose, stats: () => Object.freeze({ active: jobs.size, queued: queue.length, completed: completed.size, failed: failed.size, generation }) });
}
