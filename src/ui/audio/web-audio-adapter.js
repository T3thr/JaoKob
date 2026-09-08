import { isAudioDesiredState } from "../../core/ports/audio-port.js";

/**
 * Optional sound; the application must never await media in a story transaction.
 * The injected loader alone owns URL/MIME/hash validation. This adapter owns one
 * sound context, gain ramps, voice lifetime and a bounded decoded PCM LRU.
 * Trace: CR-0003 D2/D4, ADR-P0-015, FR-SET-004, NFR-PE-004/005.
 *
 * @param {object} options
 * @param {function(string,{signal:AbortSignal}):Promise<ArrayBuffer|{bytes:ArrayBuffer,decodedBytes:number,sampleRate:number,frames:number,channels:number}>} options.loadAudioBytes
 * @param {function():object} [options.createContext] Called only from unlock.
 * @param {number} [options.maxDecodedBytes] At most the approved 16 MiB budget.
 * @param {function(object):void} [options.onStatus] Nonfatal status notification.
 * @returns {Readonly<object>} AudioPort methods plus adapter-only preload() and
 * inspect() for resource QA. Preload never creates a context or a voice.
 */
export function createWebAudioAdapter({
  loadAudioBytes,
  createContext = () => {
    const Constructor = globalThis.AudioContext ?? globalThis.webkitAudioContext;
    return typeof Constructor === "function" ? new Constructor() : null;
  },
  maxDecodedBytes = 16 * 1024 * 1024,
  onStatus = () => {},
  setTimer = (callback, delay) => setTimeout(callback, delay),
  clearTimer = (handle) => clearTimeout(handle),
} = {}) {
  const budget = Number.isSafeInteger(maxDecodedBytes) && maxDecodedBytes > 0
    ? Math.min(maxDecodedBytes, 16 * 1024 * 1024) : 16 * 1024 * 1024;
  const fadeSeconds = 1.5;
  let context = null, graph = null, disposed = false, suspended = false;
  let desired = { sessionId: null, volumes: { master: 1, music: 0, ambience: 0, effects: 0 }, reducedIntensity: false };
  let sessionGeneration = 0, usedBytes = 0, reservedBytes = 0, runningLoads = 0;
  let lastStatus = Object.freeze({ status: "blocked", code: "AUDIO_GESTURE_REQUIRED" });
  const cache = new Map(), requests = new Map(), queue = [], effects = new Set(), tokens = new Set();
  const pendingEffects = new Map(), preloads = new Map();
  const lanes = {
    music: { key: "bgmAssetId", id: null, token: 0, attempted: false, failure: null, voices: [] },
    ambience: { key: "ambientAssetId", id: null, token: 0, attempted: false, failure: null, voices: [] },
  };

  const result = (status = "ready", code) => Object.freeze({ status, ...(code ? { code } : {}) });
  function report(status, code) {
    const next = result(status, code);
    if (lastStatus.status !== next.status || lastStatus.code !== next.code) {
      lastStatus = next;
      try { onStatus(next); } catch { /* Notification cannot affect playback. */ }
    }
    return next;
  }
  const unavailable = (code = "AUDIO_UNAVAILABLE") => report("unavailable", code);
  const blocked = () => report("blocked", "AUDIO_GESTURE_REQUIRED");
  const canPlay = () => !disposed && !suspended && context?.state === "running";
  const audible = (bus) => desired.sessionId !== null && desired.volumes.master > 0 && desired.volumes[bus] > 0;
  const failure = (code) => Object.assign(new Error(code), { code });
  const validId = (id) => typeof id === "string" && id.length <= 96 && /^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)*$/.test(id);

  function setGain(param, value) {
    const now = context.currentTime;
    param.cancelScheduledValues(now);
    param.setValueAtTime(value, now);
  }
  function gains() {
    if (!graph) return;
    setGain(graph.master.gain, suspended || !desired.sessionId ? 0 : desired.volumes.master);
    const scale = desired.reducedIntensity ? 0.5 : 1;
    setGain(graph.music.gain, desired.volumes.music * scale);
    setGain(graph.ambience.gain, desired.volumes.ambience * scale);
    setGain(graph.effects.gain, desired.reducedIntensity ? 0 : desired.volumes.effects);
  }
  function touch(entry) {
    cache.delete(entry.id);
    cache.set(entry.id, entry);
  }
  function room(bytes) {
    for (const [id, entry] of cache) {
      if (usedBytes + reservedBytes + bytes <= budget) return true;
      if (entry.references === 0) { cache.delete(id); usedBytes -= entry.bytes; }
    }
    return usedBytes + reservedBytes + bytes <= budget;
  }
  function release(entry) { entry.references = Math.max(0, entry.references - 1); }
  function decodeReservation(raw) {
    // decodeAudioData resamples to the context rate, which may exceed the
    // manifest's source rate. Round fractional frames up before admitting work.
    // Source PCM and browser codec internals are not a browser-total memory
    // measurement; this bounds app-owned final PCM plus concurrent reservations.
    if (!Number.isSafeInteger(context.sampleRate) || context.sampleRate <= 0
      || !Number.isSafeInteger(raw?.sampleRate) || raw.sampleRate <= 0
      || !Number.isSafeInteger(raw?.frames) || raw.frames <= 0
      || !Number.isSafeInteger(raw?.channels) || raw.channels < 1 || raw.channels > 2
      || !Number.isSafeInteger(raw?.decodedBytes) || raw.decodedBytes !== raw.frames * raw.channels * 4) return budget;
    const frames = Math.ceil(raw.frames * context.sampleRate / raw.sampleRate);
    const bytes = Math.max(raw.decodedBytes, frames * raw.channels * 4);
    if (!Number.isSafeInteger(bytes) || bytes <= 0) throw failure("AUDIO_BUDGET");
    return bytes;
  }
  function cleanVoice(voice) {
    if (voice.cleaned) return;
    voice.cleaned = true;
    voice.source.onended = null;
    try { voice.source.disconnect(); } catch { /* Already disconnected. */ }
    try { voice.gain.disconnect(); } catch { /* Already disconnected. */ }
    voice.source.buffer = null;
    release(voice.entry);
    if (voice.lane) voice.lane.voices = voice.lane.voices.filter((candidate) => candidate !== voice);
    else effects.delete(voice);
  }
  function stopVoice(voice, fade = false) {
    if (voice.cleaned) return;
    const now = context.currentTime;
    if (fade && !voice.fading) {
      voice.fading = true;
      const param = voice.gain.gain;
      if (typeof param.cancelAndHoldAtTime === "function") param.cancelAndHoldAtTime(now);
      else {
        const elapsed = Math.min(1, Math.max(0, (now - voice.startedAt) / fadeSeconds));
        param.cancelScheduledValues(now);
        param.setValueAtTime(elapsed, now);
      }
      param.linearRampToValueAtTime(0, now + fadeSeconds);
      try { voice.source.stop(now + fadeSeconds); } catch { cleanVoice(voice); }
    } else if (!fade) {
      try { voice.source.stop(now); } catch { /* Already stopped. */ }
      cleanVoice(voice);
    }
  }
  function stopLane(lane, fade = true) {
    // A missing/failed channel may fade its current voice, but never retains two
    // old fades while waiting for another buffer.
    while (lane.voices.length > 1) stopVoice(lane.voices[0]);
    lane.voices.slice().forEach((voice) => stopVoice(voice, fade));
  }
  function stopEverything() {
    Object.values(lanes).forEach((lane) => stopLane(lane, false));
    [...effects].forEach((voice) => stopVoice(voice));
  }
  function createVoice(entry, bus, lane = null) {
    let source, gain;
    try { source = context.createBufferSource(); gain = context.createGain(); }
    catch (error) { try { source?.disconnect(); } catch { /* Partial graph. */ } release(entry); throw error; }
    const voice = { source, gain, entry, lane, startedAt: context.currentTime, fading: false, cleaned: false };
    try {
      source.buffer = entry.buffer;
      source.loop = Boolean(lane);
      source.connect(gain);
      gain.connect(graph[bus]);
      gain.gain.setValueAtTime(lane ? 0 : 1, context.currentTime);
      if (lane) gain.gain.linearRampToValueAtTime(1, context.currentTime + fadeSeconds);
      source.onended = () => cleanVoice(voice);
      if (lane) lane.voices.push(voice); else effects.add(voice);
      source.start();
      return voice;
    } catch (error) { cleanVoice(voice); throw error; }
  }

  function wanted(id) {
    return Object.entries(lanes).some(([bus, lane]) => lane.id === id && audible(bus))
      || [...pendingEffects.values()].includes(id)
      || [...preloads.values()].some((preload) => preload.id === id && !preload.signal?.aborted);
  }
  function cancelObsolete() {
    for (const request of requests.values()) if (!wanted(request.id)) request.controller.abort();
    pruneQueue();
  }
  function cancelRequests() {
    for (const request of requests.values()) request.controller.abort();
    pruneQueue();
  }
  function pruneQueue() {
    for (let index = queue.length - 1; index >= 0; index -= 1) {
      if (queue[index].controller.signal.aborted) queue.splice(index, 1)[0].reject(failure("AUDIO_CANCELLED"));
    }
  }
  function pump() {
    while (runningLoads < 2 && queue.length) {
      const request = queue.shift();
      if (request.controller.signal.aborted) { request.reject(failure("AUDIO_CANCELLED")); continue; }
      runningLoads += 1;
      runLoad(request).then(request.resolve, request.reject).finally(() => { runningLoads -= 1; pump(); });
    }
  }
  async function runLoad(request) {
    const { signal } = request.controller;
    let reservation = 0;
    const timeout = setTimer(() => { request.timedOut = true; request.controller.abort(); }, 10000);
    const cancelled = () => failure(request.timedOut ? "AUDIO_TIMEOUT" : "AUDIO_CANCELLED");
    let onAbort;
    const aborted = new Promise((_, reject) => {
      onAbort = () => reject(cancelled());
      signal.addEventListener("abort", onAbort, { once: true });
    });
    try {
      const raw = await Promise.race([Promise.resolve().then(() => loadAudioBytes(request.id, { signal })), aborted]);
      if (signal.aborted || disposed) throw cancelled();
      const bytes = raw instanceof ArrayBuffer ? raw : raw?.bytes;
      if (!(bytes instanceof ArrayBuffer) || bytes.byteLength === 0) throw failure("AUDIO_LOAD");
      // Validated source PCM dimensions are projected to this context's rate.
      // Missing/inconsistent dimensions conservatively reserve the entire budget.
      reservation = decodeReservation(raw);
      if (!room(reservation)) { reservation = 0; throw failure("AUDIO_BUDGET"); }
      reservedBytes += reservation;
      // Decoding cannot be aborted by the platform. Keep its reservation and
      // concurrency slot until it settles, even if this scene becomes obsolete.
      const buffer = await context.decodeAudioData(bytes.slice(0));
      if (signal.aborted || disposed || request.generation !== sessionGeneration || !wanted(request.id)) throw cancelled();
      const size = buffer?.length * buffer?.numberOfChannels * 4;
      if (!Number.isSafeInteger(size) || size <= 0 || size > reservation) throw failure("AUDIO_BUDGET");
      reservedBytes -= reservation; reservation = 0;
      if (!room(size)) throw failure("AUDIO_BUDGET");
      const entry = { id: request.id, buffer, bytes: size, references: 0 };
      cache.set(request.id, entry); usedBytes += size;
      return entry;
    } finally {
      reservedBytes -= reservation;
      clearTimer(timeout);
      signal.removeEventListener("abort", onAbort);
    }
  }
  async function acquire(id, { signal, speculative = false } = {}) {
    if (signal?.aborted) throw failure("AUDIO_CANCELLED");
    if (cache.has(id)) { const entry = cache.get(id); touch(entry); entry.references += 1; return entry; }
    let request = requests.get(id);
    if (!request || request.controller.signal.aborted) {
      if (requests.size >= 16) throw failure("AUDIO_QUEUE_FULL");
      request = { id, generation: sessionGeneration, controller: new AbortController() };
      request.promise = new Promise((resolve, reject) => { request.resolve = resolve; request.reject = reject; });
      requests.set(id, request);
      if (speculative) queue.push(request); else queue.unshift(request);
      pump();
      // Each consumer handles errors; this observer only removes finished entries.
      request.promise.then(() => { if (requests.get(id) === request) requests.delete(id); },
        () => { if (requests.get(id) === request) requests.delete(id); });
    } else if (!speculative && queue.includes(request)) {
      queue.splice(queue.indexOf(request), 1); queue.unshift(request);
    }
    let onAbort;
    let entry;
    try {
      const aborted = signal && new Promise((_, reject) => {
        onAbort = () => reject(failure("AUDIO_CANCELLED"));
        signal.addEventListener("abort", onAbort, { once: true });
      });
      entry = await (aborted ? Promise.race([request.promise, aborted]) : request.promise);
      if (signal?.aborted) throw failure("AUDIO_CANCELLED");
    } finally { if (onAbort) signal.removeEventListener("abort", onAbort); }
    entry.references += 1;
    return entry;
  }

  /**
   * Warm the shared decoded cache after trusted activation and sound consent.
   * This optional adapter capability creates no voice and reports no player
   * status: an unavailable speculative branch must not hide current playback.
   * Abort cancels this consumer only; shared playback/other consumers survive.
   * @param {string} assetId
   * @param {{signal?: AbortSignal}} [options]
   * @returns {Promise<Readonly<{ok:true}|{ok:false,error:{code:string}}>>}
   */
  async function preload(assetId, { signal } = {}) {
    const denied = (code) => Object.freeze({ ok: false, error: Object.freeze({ code }) });
    if (!validId(assetId)) return denied("AUDIO_CONTRACT");
    if (disposed) return denied("AUDIO_DISPOSED");
    if (signal?.aborted) return denied("AUDIO_CANCELLED");
    if (!canPlay()) return denied("AUDIO_GESTURE_REQUIRED");
    if (!desired.sessionId || desired.volumes.master === 0 || !["music", "ambience", "effects"].some((bus) => desired.volumes[bus] > 0)) return denied("AUDIO_MUTED");
    if (preloads.size >= 16) return denied("AUDIO_QUEUE_FULL");
    const ticket = {}, generation = sessionGeneration;
    const cancelled = () => { preloads.delete(ticket); cancelObsolete(); };
    preloads.set(ticket, { id: assetId, signal });
    signal?.addEventListener("abort", cancelled, { once: true });
    try {
      const entry = await acquire(assetId, { signal, speculative: true });
      release(entry);
      if (signal?.aborted || disposed || generation !== sessionGeneration) return denied("AUDIO_CANCELLED");
      return Object.freeze({ ok: true });
    } catch (error) {
      return denied(["AUDIO_CANCELLED", "AUDIO_BUDGET", "AUDIO_QUEUE_FULL", "AUDIO_TIMEOUT"].includes(error?.code) ? error.code : "AUDIO_LOAD");
    } finally {
      signal?.removeEventListener("abort", cancelled);
      preloads.delete(ticket);
      cancelObsolete();
    }
  }

  async function reconcileLane(bus, lane) {
    if (!lane.id) { stopLane(lane); return result(); }
    if (!audible(bus)) return result();
    if (lane.voices.some((voice) => voice.entry.id === lane.id && !voice.fading)) return result();
    if (lane.attempted) return lane.failure ?? result();
    lane.attempted = true;
    lane.failure = null;
    const token = lane.token, generation = sessionGeneration;
    let entry;
    try {
      entry = await acquire(lane.id);
      if (!canPlay() || token !== lane.token || generation !== sessionGeneration || !audible(bus)) {
        release(entry); return result();
      }
      while (lane.voices.length > 1) stopVoice(lane.voices[0]);
      lane.voices.slice().forEach((voice) => stopVoice(voice, true));
      createVoice(entry, bus, lane);
      return result();
    } catch (error) {
      if (token !== lane.token || generation !== sessionGeneration || error?.code === "AUDIO_CANCELLED") return result();
      stopLane(lane);
      lane.failure = result("unavailable", error?.code === "AUDIO_BUDGET" ? "AUDIO_BUDGET" : "AUDIO_LOAD");
      return lane.failure;
    }
  }
  async function playDesired() {
    if (disposed) return unavailable("AUDIO_DISPOSED");
    if (!canPlay()) return blocked();
    const generation = sessionGeneration, laneTokens = Object.values(lanes).map((lane) => lane.token);
    try {
      gains();
      const outcomes = await Promise.all(Object.entries(lanes).map(([bus, lane]) => reconcileLane(bus, lane)));
      if (generation !== sessionGeneration || Object.values(lanes).some((lane, index) => lane.token !== laneTokens[index])) return lastStatus;
      const failed = outcomes.find((outcome) => outcome.status !== "ready");
      return failed ? report(failed.status, failed.code) : report("ready");
    } catch { stopEverything(); return unavailable(); }
  }

  function unlock() {
    if (disposed) return unavailable("AUDIO_DISPOSED");
    try {
      if (!context) {
        const candidate = createContext(), candidateGraph = {};
        if (!candidate) return unavailable("AUDIO_UNSUPPORTED");
        try {
          for (const name of ["master", "music", "ambience", "effects"]) candidateGraph[name] = candidate.createGain();
          candidateGraph.master.connect(candidate.destination);
          for (const name of ["music", "ambience", "effects"]) candidateGraph[name].connect(candidateGraph.master);
        } catch (error) {
          for (const gain of Object.values(candidateGraph)) { try { gain.disconnect(); } catch { /* Partial graph. */ } }
          try { Promise.resolve(candidate.close()).catch(() => {}); } catch { /* Broken platform; retain no references. */ }
          throw error;
        }
        context = candidate; graph = candidateGraph;
      }
      suspended = false;
      gains();
      // This invocation must execute in the original trusted callback, before any
      // promise continuation or asynchronous story dispatch.
      const resumed = context.resume();
      for (const lane of Object.values(lanes)) if (!lane.voices.some((voice) => !voice.fading)) { lane.attempted = false; lane.failure = null; }
      return Promise.resolve(resumed).then(() => context?.state === "running" ? playDesired() : blocked(), blocked);
    } catch { return unavailable(); }
  }
  function reconcile(next) {
    if (disposed) return unavailable("AUDIO_DISPOSED");
    if (!isAudioDesiredState(next)) return unavailable("AUDIO_CONTRACT");
    const changedSession = next.sessionId !== desired.sessionId;
    if (changedSession) {
      sessionGeneration += 1;
      pendingEffects.clear(); preloads.clear(); tokens.clear(); cancelRequests(); stopEverything();
    }
    desired = { ...next, volumes: { ...next.volumes } };
    for (const [bus, lane] of Object.entries(lanes)) {
      const id = desired.sessionId ? desired[lane.key] ?? null : null;
      if (id !== lane.id || changedSession) { lane.id = id; lane.token += 1; lane.attempted = false; lane.failure = null; }
      if (!audible(bus) && !lane.voices.some((voice) => !voice.fading)) lane.attempted = false;
    }
    if (desired.reducedIntensity || !audible("effects")) {
      pendingEffects.clear(); [...effects].forEach((voice) => stopVoice(voice));
    }
    if (!desired.sessionId || desired.volumes.master === 0 || !["music", "ambience", "effects"].some((bus) => desired.volumes[bus] > 0)) preloads.clear();
    cancelObsolete();
    if (!context) return blocked();
    try {
      suspended = false;
      gains();
      if (context.state !== "running") return Promise.resolve(context.resume()).then(playDesired, blocked);
      return playDesired();
    } catch { return unavailable(); }
  }
  async function playEffect(input) {
    const { assetId, actionToken } = input ?? {};
    if (!validId(assetId)
      || typeof actionToken !== "string" || !actionToken || actionToken.length > 256) return unavailable("AUDIO_CONTRACT");
    if (tokens.has(actionToken)) return result();
    tokens.add(actionToken);
    while (tokens.size > 128) tokens.delete(tokens.values().next().value);
    if (!canPlay() || !audible("effects") || desired.reducedIntensity) return result();
    // Transients are never held for later activation. Limit pending/active SFX.
    if (pendingEffects.size + effects.size >= 4) return result();
    const generation = sessionGeneration;
    pendingEffects.set(actionToken, assetId);
    try {
      const entry = await acquire(assetId);
      if (!canPlay() || generation !== sessionGeneration || !pendingEffects.has(actionToken)
        || !audible("effects") || desired.reducedIntensity) { release(entry); return result(); }
      createVoice(entry, "effects");
      return result();
    } catch (error) { return error?.code === "AUDIO_CANCELLED" ? result() : unavailable("AUDIO_LOAD"); }
    finally { pendingEffects.delete(actionToken); }
  }
  function suspend() {
    if (disposed) return result();
    suspended = true;
    sessionGeneration += 1;
    pendingEffects.clear(); preloads.clear(); cancelRequests(); stopEverything();
    Object.values(lanes).forEach((lane) => { lane.token += 1; lane.attempted = false; lane.failure = null; });
    if (!context) return result();
    try { gains(); return Promise.resolve(context.suspend()).then(() => result(), () => unavailable()); }
    catch { return unavailable(); }
  }
  function dispose() {
    if (disposed) return result();
    disposed = true; sessionGeneration += 1;
    pendingEffects.clear(); preloads.clear(); tokens.clear(); cancelRequests(); stopEverything();
    cache.clear(); usedBytes = 0;
    if (graph) for (const gain of Object.values(graph)) { try { gain.disconnect(); } catch { /* Already released. */ } }
    if (!context) return result();
    try { return Promise.resolve(context.close()).then(() => result(), () => unavailable()); }
    catch { return unavailable(); }
  }
  function inspect() {
    return Object.freeze({
      status: lastStatus.status, contextState: context?.state ?? "uninitialized", disposed,
      decodedBytes: usedBytes, reservedBytes, maxDecodedBytes: budget, cachedAssets: Object.freeze([...cache.keys()]),
      pendingLoads: requests.size, runningLoads, queuedLoads: queue.length, pendingPreloads: preloads.size, dedupeTokens: tokens.size,
      voices: Object.freeze({ music: lanes.music.voices.length, ambience: lanes.ambience.voices.length, effects: effects.size }),
      desired: Object.freeze({ ...desired, volumes: Object.freeze({ ...desired.volumes }) }),
    });
  }
  return Object.freeze({ unlock, reconcile, playEffect, suspend, dispose, preload, inspect });
}
