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
        (...args) => {
          if (operation === "render") {
            try { assertRendererViewModel(args[0]); }
            catch { return Object.freeze({ ok: false, error: Object.freeze({ code: "RENDER_FAILURE" }) }); }
          }
          return implementation[operation].apply(implementation, args);
        },
      ]),
    ),
  );
}

/**
 * Validate additive presentation fields without narrowing legacy renderer calls.
 * A locked Bond is a localized status, never a numeric meter. Legacy numeric /
 * hidden fixtures remain supported; an explicit unlocked status requires the
 * approved narrative gate. Image readiness is an ID request, never a live object.
 *
 * @param {unknown} viewModel
 * @returns {void}
 * @throws {TypeError} INVALID_RENDERER_VIEW_MODEL for a malformed new contract.
 * Trace: CR-0003 D7, FR-UI-001/005, ADR-P0-015.
 */
export function assertRendererViewModel(viewModel) {
  const require = (condition) => {
    if (!condition) {
      const error = new TypeError("Invalid renderer presentation contract.");
      error.code = "INVALID_RENDERER_VIEW_MODEL";
      throw error;
    }
  };
  require(isRecord(viewModel));
  const bond = viewModel.meters?.bond;
  if (isRecord(bond) && Object.hasOwn(bond, "state")) {
    if (bond.state === "locked") {
      require(hasOnly(bond, ["state", "label", "accessibleLabel", "icons"]));
      require([bond.label, bond.accessibleLabel].every((label) => typeof label === "string" && label.trim().length > 0 && !/[\p{N}%]/u.test(label)));
      require(Array.isArray(bond.icons) && bond.icons.length === 2 && bond.icons[0] === "lotus" && bond.icons[1] === "lock");
      require(!viewModel.meterChanges?.some((change) => change.meter === "bond"));
    } else if (bond.state === "hidden") {
      require(hasOnly(bond, ["state"]));
    } else {
      require(bond.state === "unlocked" && hasOnly(bond, ["state", "value", "gateId"]));
      require(bond.gateId === "NAR-SC-A4-004" && Number.isFinite(bond.value) && bond.value >= 0 && bond.value <= 100);
    }
  }
  const presentation = viewModel.presentation;
  if (presentation === undefined) return;
  require(isRecord(presentation) && hasOnly(presentation, ["mode", "nodeId", "background", "character", "speaker", "imageRequests"]));
  require(["title", "reading", "exploration", "decision", "completion", "settings", "choice-confirmation", "replace-confirmation"].includes(presentation.mode));
  require(presentation.nodeId === null || isIdentifier(presentation.nodeId));
  const image = (reference) => {
    require(isRecord(reference) && hasOnly(reference, ["contentVersion", "assetId", "alt"]));
    require(typeof reference.contentVersion === "string" && /^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/.test(reference.contentVersion));
    require(isIdentifier(reference.assetId) && typeof reference.alt === "string" && reference.alt.trim().length > 0);
  };
  if (presentation.background !== null) image(presentation.background);
  if (presentation.character !== null) {
    const character = presentation.character;
    require(isRecord(character) && hasOnly(character, ["id", "lifeStage", "portrait"]));
    require(isIdentifier(character.id) && ["tadpole", "metamorph", "frog", "human", "non-living", "various"].includes(character.lifeStage));
    image(character.portrait);
  }
  if (presentation.speaker !== null) {
    const speaker = presentation.speaker;
    require(isRecord(speaker) && hasOnly(speaker, ["id", "name", "role", "description", "portrait"]));
    require(isIdentifier(speaker.id) && typeof speaker.name === "string" && typeof speaker.description === "string");
    require(["protagonist", "family", "ally", "human", "observer", "antagonistic-force", "narrator"].includes(speaker.role));
    if (speaker.portrait !== null) image(speaker.portrait);
  }
  require(Array.isArray(presentation.imageRequests) && presentation.imageRequests.length <= 3);
  presentation.imageRequests.forEach(image);
}

function hasOnly(record, keys) {
  const prototype = Object.getPrototypeOf(record);
  return (prototype === Object.prototype || prototype === null)
    && Reflect.ownKeys(record).every((key) => keys.includes(key)
      && Object.hasOwn(Object.getOwnPropertyDescriptor(record, key), "value"));
}

function isIdentifier(value) {
  return typeof value === "string" && value.length <= 96 && /^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)*$/.test(value);
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
