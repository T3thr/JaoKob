/** Pure immutable four-slot value. Trace: ADR-P0-020 D1/D3, TC-S4-POUCH-001.
 * IDs are resolved against an authored catalog at the application boundary.
 * No transaction awards metrics or mutates its input, including on rejection.
 */
export const POUCH_CAPACITY = 4;
export const POUCH_MEMORY_LIMIT = 128;
const ITEM_ID = /^item_[a-z][a-z0-9]*(?:_[a-z0-9]+)*$/;
const FIELDS = Object.freeze(["capacity", "held", "acquired", "released", "remembered", "memory"]);
const isId = (id) => typeof id === "string" && id.length <= 96 && ITEM_ID.test(id);
const refusedId = (id) => `refused_${id.slice(5)}`;

export class PouchError extends Error {
  constructor(code) { super(code); this.name = "PouchError"; this.code = code; }
}
const requireFact = (value, code) => { if (!value) throw new PouchError(code); };
const idOf = (item) => typeof item === "string" ? item : item?.id;
const freeze = (value) => {
  for (const field of FIELDS.slice(1)) Object.freeze(value[field]);
  return Object.freeze(value);
};

/** Validate an untrusted pouch value without coercion or repairing lost items.
 * @param {unknown} value @returns {{valid:boolean, issue?:{reason:string}}}
 */
export function validatePouch(value) {
  const invalid = (reason) => Object.freeze({ valid: false, issue: Object.freeze({ reason }) });
  if (value === null || typeof value !== "object" || Array.isArray(value)) return invalid("POUCH_SHAPE");
  if (Object.keys(value).length !== FIELDS.length || FIELDS.some((field) => !Object.hasOwn(value, field))) return invalid("POUCH_FIELDS");
  if (value.capacity !== POUCH_CAPACITY) return invalid("POUCH_CAPACITY");
  for (const field of FIELDS.slice(1)) {
    const list = value[field], limit = field === "held" ? POUCH_CAPACITY : POUCH_MEMORY_LIMIT;
    if (!Array.isArray(list) || list.length > limit || new Set(list).size !== list.length) return invalid("POUCH_LIST");
    for (const id of list) {
      if (field === "memory" ? typeof id !== "string" || !isId(`item_${id.slice(8)}`) || !id.startsWith("refused_") : !isId(id)) return invalid("POUCH_ID");
    }
  }
  const held = new Set(value.held), acquired = new Set(value.acquired), released = new Set(value.released), remembered = new Set(value.remembered);
  if (value.held.some((id) => released.has(id) || !acquired.has(id)) || value.released.some((id) => !acquired.has(id))) return invalid("POUCH_OWNERSHIP");
  if (value.acquired.some((id) => !remembered.has(id) || (!held.has(id) && !released.has(id)))) return invalid("POUCH_ACQUISITION");
  const refused = new Set(value.memory.map((token) => `item_${token.slice(8)}`));
  if ([...refused].some((id) => acquired.has(id) || !remembered.has(id))) return invalid("POUCH_REFUSAL");
  if (value.remembered.some((id) => !acquired.has(id) && !refused.has(id))) return invalid("POUCH_MEMORY");
  return Object.freeze({ valid: true });
}

/** Create/restore a frozen independent value; invalid snapshots throw PouchError.
 * @param {object} [initialState] @returns {Readonly<object>}
 */
export function createPouch(initialState = { capacity: POUCH_CAPACITY, held: [], acquired: [], released: [], remembered: [], memory: [] }) {
  const checked = validatePouch(initialState);
  requireFact(checked.valid, checked.issue?.reason);
  return freeze(Object.fromEntries(FIELDS.map((field) => [field, field === "capacity" ? initialState[field] : [...initialState[field]]])));
}

function transact(pouch, operation) {
  try {
    const next = Object.fromEntries(Object.entries(createPouch(pouch)).map(([key, value]) => [key, Array.isArray(value) ? [...value] : value]));
    operation(next);
    return Object.freeze({ ok: true, value: createPouch(next) });
  } catch (error) {
    if (!(error instanceof PouchError)) throw error;
    return Object.freeze({ ok: false, error: Object.freeze({ code: error.code }), pouch });
  }
}
function unseen(pouch, item) {
  const id = idOf(item);
  requireFact(isId(id), "POUCH_ID");
  requireFact(!pouch.remembered.includes(id), "POUCH_ALREADY_ENCOUNTERED");
  requireFact(pouch.remembered.length < POUCH_MEMORY_LIMIT, "POUCH_MEMORY_FULL");
  return id;
}
function held(pouch, id) {
  requireFact(isId(id), "POUCH_ID");
  requireFact(pouch.held.includes(id), "POUCH_NOT_HELD");
}
function release(next, id) {
  held(next, id);
  next.held.splice(next.held.indexOf(id), 1);
  next.released.push(id);
}

/** Collect an unseen item into a free slot. Failure returns the original pouch. */
export function collectItem(pouch, item) {
  return transact(pouch, (next) => {
    const id = unseen(next, item);
    requireFact(next.held.length < POUCH_CAPACITY, "POUCH_FULL");
    next.held.push(id); next.acquired.push(id); next.remembered.push(id);
  });
}
/** Refusal remembers an encounter without ever owning the item. */
export function refuseItem(pouch, item) {
  return transact(pouch, (next) => {
    const id = unseen(next, item);
    next.remembered.push(id); next.memory.push(refusedId(id));
  });
}
/** Hand on a held item; historical acquisition and memory survive. */
export function releaseItem(pouch, itemId) {
  return transact(pouch, (next) => release(next, itemId));
}
/** Replace one slot atomically, only when all four slots are occupied. */
export function replaceItem(pouch, oldItemId, newItem) {
  return transact(pouch, (next) => {
    requireFact(next.held.length === POUCH_CAPACITY, "POUCH_NOT_FULL");
    held(next, oldItemId);
    const id = unseen(next, newItem), slot = next.held.indexOf(oldItemId);
    next.held[slot] = id; next.released.push(oldItemId);
    next.acquired.push(id); next.remembered.push(id);
  });
}
/** Consuming/handing on an item requires an authored utility guard upstream. */
export function useItem(pouch, itemId) { return releaseItem(pouch, itemId); }
