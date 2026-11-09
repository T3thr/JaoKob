/**
 * Tactile micro-actions (master plan §2.11, UX §5): three to eight seconds, nothing to fail,
 * no change to any meter. Completing one, by hand or by the auto setting, only moves the
 * story on. Targets, sounds and the hand animation belong to the UI.
 *
 * Trace: master plan §2.11, UX §5, TC-S5-STATE-001.
 */

export const MICRO_KINDS = Object.freeze(["tap3", "hold", "stitch", "press"]);
export const MICRO_MIN_MS = 3000;
export const MICRO_MAX_MS = 8000;

/**
 * The micro-action view: what to do, which MA-n it is, how long and the hint text.
 *
 * @param {{kind:string, ma:string, durationMs:number, hint:string}} micro
 */
export const microView = (micro) => ({ kind: micro.kind, ma: micro.ma, durationMs: micro.durationMs, hint: micro.hint });

/** @param {object} micro @returns {boolean} */
export const microValid = (micro) => micro !== null && typeof micro === "object" && MICRO_KINDS.includes(micro.kind)
  && /^MA-[1-6]$/.test(micro.ma) && Number.isSafeInteger(micro.durationMs) && micro.durationMs >= MICRO_MIN_MS
  && micro.durationMs <= MICRO_MAX_MS && typeof micro.hint === "string";
