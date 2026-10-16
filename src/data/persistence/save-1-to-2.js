import { createPouch, collectItem } from "../../core/domain/keepsake-pouch.js";
import { validateSaveEnvelope } from "../validation/save-envelope-validator.js";
import { copyJsonData, deepFreeze } from "../validation/content-values.js";

const failure = (reason) => deepFreeze({ ok: false, error: { code: "SAVE_MIGRATION", details: { reason } } });

/** Map the historical leaf independently for an active or checkpoint snapshot.
 * A literal hasLeaf flag is a legacy alias; conflicting aliases are protected.
 * No I/O, effects, cursor changes or retroactive items. ADR-P0-020 D4.
 * @param {readonly {id:string,value:unknown}[]} flags @returns {Readonly<object>}
 */
export function migrateLegacyPouch(flags) {
  const leaves = flags.filter(({ id }) => ["keepsake.lily_fragment", "hasLeaf"].includes(id));
  if (leaves.length === 0 || leaves.some(({ value }) => typeof value !== "boolean") || new Set(leaves.map(({ value }) => value)).size > 1) {
    throw new TypeError("LEGACY_LEAF_AMBIGUOUS");
  }
  const empty = createPouch();
  return leaves[0].value ? collectItem(empty, "item_leaf").value : empty;
}

/** Pure/idempotent Save 1→2, after the reviewed content 2.0→2.1 step.
 * @param {unknown} input
 * @returns {{ok:boolean,value?:{envelope:object,migrated:boolean},error?:object}}
 * Source digests stay protected: this synchronous transform cannot verify them.
 */
export function migrateSave1To2(input) {
  const copied = copyJsonData(input);
  if (!copied.valid) return failure("SAVE_INVALID_JSON");
  const envelope = copied.value;
  if (!validateSaveEnvelope(envelope).valid) return failure("SAVE_SCHEMA_INVALID");
  if (envelope.saveFormatVersion === 2 && envelope.contentVersion === "3.0.0") return deepFreeze({ ok: true, value: { envelope, migrated: false } });
  if (envelope.contentVersion !== "2.1.0") return failure("CONTENT_VERSION_UNSUPPORTED");
  if (envelope.saveFormatVersion === 2) return deepFreeze({ ok: true, value: { envelope, migrated: false } });
  if (Object.hasOwn(envelope, "integrity")) return failure("SOURCE_INTEGRITY_UNSUPPORTED");
  try {
    envelope.payload.pouch = migrateLegacyPouch(envelope.payload.flags);
    envelope.payload.checkpoint.pouch = migrateLegacyPouch(envelope.payload.checkpoint.flags);
  } catch { return failure("LEGACY_LEAF_AMBIGUOUS"); }
  envelope.saveFormatVersion = 2;
  if (!validateSaveEnvelope(envelope).valid) return failure("TARGET_SCHEMA_INVALID");
  return deepFreeze({ ok: true, value: { envelope, migrated: true } });
}
