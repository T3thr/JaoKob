/**
 * Safe default for tests/platforms without sound. Playback stays fully usable.
 * Trace: CR-0003 D2, FR-SET-004.
 * @param {object} options Optional machine status code; never a visible message.
 * @returns {Readonly<object>} AudioPort-compatible, resource-free adapter.
 */
export function createSilentAudioAdapter({ code = "AUDIO_UNSUPPORTED" } = {}) {
  const unavailable = Object.freeze({ status: "unavailable", code });
  const ready = Object.freeze({ status: "ready" });
  return Object.freeze({
    unlock: () => unavailable,
    reconcile: () => unavailable,
    playEffect: () => unavailable,
    suspend: () => ready,
    dispose: () => ready,
  });
}
