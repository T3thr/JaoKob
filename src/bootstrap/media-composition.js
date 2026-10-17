import { createAudioPort } from "../core/ports/audio-port.js";
import { createAssetResolver } from "../data/assets/asset-resolver.js";
import { createAssetPreloader, selectPresentationAssets } from "../data/assets/asset-preloader.js";
import { createImageCache } from "../ui/assets/image-cache.js";
import { createWebAudioAdapter } from "../ui/audio/web-audio-adapter.js";
import { createSilentAudioAdapter } from "../ui/audio/silent-audio-adapter.js";

/** Optional media composition, isolated from story transactions. CR-0003 D2/D4. */
export function createMediaComposition(options = {}, onChange = () => {}) {
  const enabled = options.mediaEnabled ?? Boolean(options.document?.defaultView || globalThis.document?.defaultView || options.audio || options.assetRegistry);
  let loaded, cache = options.imageCache, preloader, initialization = 0;
  const resolvers = new Map();
  let ready = Promise.resolve(), disposed = false, activated = false, lastDesire;
  let audioStatus = enabled ? "blocked" : undefined, mediaStatus = enabled ? "ready" : undefined;
  const document = options.document ?? globalThis.document;
  const hidden = () => document?.visibilityState === "hidden";
  const update = (kind, status) => {
    if (disposed || !enabled) return;
    if (kind === "audio" ? audioStatus === status : mediaStatus === status) return;
    if (kind === "audio") audioStatus = status; else mediaStatus = status;
    onChange(kind);
  };
  const implementation = options.audio ?? (enabled ? createWebAudioAdapter({
    createContext: options.createAudioContext,
    onStatus: ({ status }) => update("audio", status),
    loadAudioBytes: async (assetId, { signal }) => {
      await ready;
      const result = await resolvers.get(loaded.catalog.version)?.read({ assetId, contentVersion: loaded.catalog.version }, { signal });
      if (!result?.ok || result.value.descriptor.type !== "audio") throw new Error("AUDIO_LOAD");
      const { decodedBytes, sampleRate, frames, channels } = result.value.descriptor;
      return { bytes: result.value.bytes, decodedBytes, sampleRate, frames, channels };
    },
  }) : createSilentAudioAdapter());
  const audio = createAudioPort(implementation);
  const observe = (result) => { void Promise.resolve(result).then((value) => update("audio", value.status)); };
  async function initialize(content) {
    loaded = content;
    const generation = ++initialization;
    if (!enabled || disposed) return;
    try {
      const baseUrl = options.applicationBaseUrl ?? new URL("../../", import.meta.url).href;
      let resolver = resolvers.get(content.catalog.version) ?? options.assetResolver;
      if (!resolver) {
        const registry = options.assetRegistries?.[content.catalog.version] ?? options.assetRegistry
          ?? await readRegistry(baseUrl, options.fetch ?? globalThis.fetch, content.catalog.version);
        const candidate = createAssetResolver({ loaded: content, baseUrl, registry, fetch: options.fetch });
        if (registry.registryVersion !== 1 || registry.contentVersion !== content.catalog.version || !Array.isArray(registry.assets)
          || Object.keys(content.indexes.assets).some((assetId) => !candidate.resolve({ assetId, contentVersion: content.catalog.version }))) throw new Error("ASSET_REGISTRY");
        resolver = candidate;
      }
      if (disposed || generation !== initialization) return;
      resolvers.set(content.catalog.version, resolver);
      // One shared32MiB cache, even when a legacy and primary session coexist.
      cache ??= createImageCache({ readAsset: (reference, request) => resolvers.get(reference.contentVersion)?.read(reference, request) });
      preloader ??= createAssetPreloader({ load: async (reference, request) => {
        const descriptor = resolvers.get(reference.contentVersion)?.resolve(reference);
        if (descriptor?.type === "image") return cache.acquire(reference, request);
        if (descriptor?.type === "audio" && activated && implementation.preload) return implementation.preload(reference.assetId, request);
        return null;
      } });
      update("media", "ready");
      if (lastDesire) schedule(lastDesire);
    } catch { if (generation === initialization) update("media", "unavailable"); }
  }
  function schedule(desire) {
    if (hidden()) { preloader?.update({ current: [], next: [] }); return; }
    preloader?.update(selectPresentationAssets({ loaded, visual: desire.visual, facts: desire.facts,
      soundRequested: activated && desire.audio.volumes.master > 0 && ["music", "ambience", "effects"].some((bus) => desire.audio.volumes[bus] > 0),
      dataSaving: options.dataSaving ?? globalThis.navigator?.connection?.saveData ?? false }));
  }
  function visibilityChanged() {
    if (disposed) return;
    if (hidden()) { preloader?.update({ current: [], next: [] }); void audio.suspend(); }
    else if (lastDesire) { if (activated) void audio.reconcile(lastDesire.audio); schedule(lastDesire); }
  }
  document?.addEventListener?.("visibilitychange", visibilityChanged);
  return Object.freeze({
    initialize(content) { ready = initialize(content); return ready; },
    activate() {
      // Call directly in the original trusted pointer/keyboard callback.
      if (hidden() || (activated && audioStatus === "ready")) return;
      activated = true; observe(audio.unlock());
      if (lastDesire) schedule(lastDesire);
    },
    accept(desire) {
      lastDesire = desire;
      // Deliberately not awaited: decoding cannot delay input or persistence.
      if (!hidden()) void audio.reconcile(desire.audio);
      schedule(desire);
    },
    effect(assetId, actionToken) { if (assetId && !hidden()) void audio.playEffect({ assetId, actionToken }); },
    async loadImage(reference) {
      await ready;
      if (!enabled || disposed) return null;
      const lease = await cache?.acquire(reference);
      if (!lease) { if (reference.contentVersion === loaded?.catalog.version) update("media", "unavailable"); return null; }
      return { ok: true, value: { url: lease.url, release: lease.release } };
    },
    retry() {
      update("media", "ready"); preloader?.retry();
      if (loaded && !resolvers.has(loaded.catalog.version)) ready = initialize(loaded);
    },
    status: () => ({ audioStatus, mediaStatus }),
    inspect: () => ({ audio: implementation.inspect?.(), images: cache?.stats(), queue: preloader?.stats() }),
    whenReady: () => ready,
    dispose() { disposed = true; initialization++; document?.removeEventListener?.("visibilitychange", visibilityChanged); preloader?.dispose(); cache?.dispose(); resolvers.clear(); void audio.dispose(); },
  });
}

async function readRegistry(baseUrl, fetcher, contentVersion) {
  const path = contentVersion === "3.0.0" ? "assets/provenance/act-01-3.0.0.json" : "assets/provenance/benchmark-assets.json";
  const base = new URL(baseUrl), url = new URL(path, base);
  if (!["http:", "https:"].includes(base.protocol) || base.username || base.password || base.search || base.hash
    || !base.pathname.endsWith("/") || url.origin !== base.origin) throw new Error("ASSET_ORIGIN");
  const controller = new AbortController(), timer = setTimeout(() => controller.abort(), 10_000);
  try {
    const response = await fetcher(url.href, { signal: controller.signal, credentials: "omit", mode: "same-origin", redirect: "error" });
    if (!response.ok || response.redirected || (response.url && response.url !== url.href)) throw new Error("ASSET_REGISTRY");
    if (response.headers?.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json") throw new Error("ASSET_REGISTRY");
    const reader = response.body.getReader(), chunks = []; let size = 0;
    try {
      while (true) {
        const { done, value } = await reader.read(); if (done) break;
        size += value.byteLength;
        if (size > 128_000 || controller.signal.aborted) { await reader.cancel(); throw new Error("ASSET_REGISTRY"); }
        chunks.push(value);
      }
    } finally { reader.releaseLock(); }
    const joined = new Uint8Array(size); let offset = 0;
    for (const chunk of chunks) { joined.set(chunk, offset); offset += chunk.byteLength; }
    const raw = new TextDecoder("utf-8", { fatal: true }).decode(joined);
    return JSON.parse(raw);
  } finally { clearTimeout(timer); }
}
