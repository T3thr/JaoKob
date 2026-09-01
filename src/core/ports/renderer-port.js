/**
 * Structural RenderPort contract.
 *
 * The facade contains no DOM knowledge and intentionally accepts either
 * immediate or promised typed results so adapter scheduling remains an
 * integration decision. Expected adapter failures must be represented by a
 * result with code RENDER_FAILURE rather than thrown across the port.
 *
 * Trace: FR-UI-001, NFR-MA-001, NFR-PO-003, ADR-P0-001, ADR-P0-005.
 */

export const RENDERER_PORT_OPERATIONS = Object.freeze([
  "render",
  "setBusy",
  "announce",
  "applyFocusDirective",
  "showFatalShell",
]);

export const RENDERER_ERROR_CODES = Object.freeze({
  RENDER_FAILURE: "RENDER_FAILURE",
});

/**
 * @template T
 * @typedef {
 *   Readonly<{ok: true, value: T}> |
 *   Readonly<{ok: false, error: Readonly<{code: string, details?: unknown}>}>
 * } PortResult
 */

/**
 * @template T
 * @typedef {PortResult<T> | Promise<PortResult<T>>} PortOperationOutcome
 */

/**
 * @typedef {object} RendererPort
 * @property {(viewModel: Readonly<Record<string, unknown>>) => PortOperationOutcome<undefined>} render
 * @property {(busy: boolean) => PortOperationOutcome<undefined>} setBusy
 * @property {(status: Readonly<Record<string, unknown>>) => PortOperationOutcome<undefined>} announce
 * @property {(directive: Readonly<Record<string, unknown>>) => PortOperationOutcome<undefined>} applyFocusDirective
 * @property {(failure: Readonly<Record<string, unknown>>) => PortOperationOutcome<undefined>} showFatalShell
 */

/**
 * Test whether a value structurally implements every RenderPort operation.
 * The check does not invoke adapter code and therefore has no side effect.
 *
 * @param {unknown} candidate
 * @returns {candidate is RendererPort}
 */
export function isRendererPort(candidate) {
  return isRecord(candidate)
    && RENDERER_PORT_OPERATIONS.every(
      (operation) => typeof candidate[operation] === "function",
    );
}

/**
 * Assert the structural RenderPort contract at the composition boundary.
 *
 * @param {unknown} candidate
 * @returns {asserts candidate is RendererPort}
 * @throws {TypeError} For a missing or non-callable operation.
 */
export function assertRendererPort(candidate) {
  if (!isRecord(candidate)) {
    throw invalidPort("RendererPort implementation must be an object.");
  }
  for (const operation of RENDERER_PORT_OPERATIONS) {
    if (typeof candidate[operation] !== "function") {
      throw invalidPort(`RendererPort.${operation} must be a function.`);
    }
  }
}

/**
 * Create an immutable structural facade around a renderer implementation.
 * The implementation remains responsible for returning a typed result and
 * for never mutating the immutable view model supplied by the application.
 *
 * @param {unknown} implementation
 * @returns {Readonly<RendererPort>}
 * @throws {TypeError} At composition time when the contract is incomplete.
 */
export function createRendererPort(implementation) {
  assertRendererPort(implementation);
  return Object.freeze(
    Object.fromEntries(
      RENDERER_PORT_OPERATIONS.map((operation) => [
        operation,
        (...args) => implementation[operation].apply(implementation, args),
      ]),
    ),
  );
}

/** @param {string} message */
function invalidPort(message) {
  const error = new TypeError(message);
  error.name = "RendererPortContractError";
  error.code = "INVALID_RENDERER_PORT";
  return error;
}

/** @param {unknown} value */
function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
