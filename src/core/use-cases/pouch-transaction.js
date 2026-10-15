import { collectItem, refuseItem, releaseItem, replaceItem, useItem, validatePouch } from "../domain/keepsake-pouch.js";

const ACTIONS = Object.freeze({ collect: collectItem, refuse: refuseItem, release: releaseItem, replace: replaceItem, use: useItem });

/** Resolve an explicitly authored safe opportunity against a pre-snapshot.
 * Application supplies validated registry/opportunity facts, never the UI.
 * @param {{snapshot:object,command:object,opportunity:object,itemIds:readonly string[]}} input
 * @returns {{ok:boolean,value?:{pouch:object},snapshot?:object,error?:object}}
 * No partial mutation/reward; cancel is represented by sending no command.
 */
export function resolvePouchTransaction({ snapshot, command, opportunity, itemIds } = {}) {
  const reject = (code) => Object.freeze({ ok: false, error: Object.freeze({ code }), snapshot });
  if (!snapshot || !validatePouch(snapshot.pouch).valid || !command) return reject("POUCH_SNAPSHOT");
  if (command.expectedRevision !== snapshot.revision) return reject("REVISION_MISMATCH");
  if (opportunity?.safe !== true || opportunity.nodeId !== snapshot.currentNodeId || !opportunity.states?.includes(snapshot.state)
    || command.opportunityId !== opportunity.id || !opportunity.actions?.includes(command.action)) return reject("POUCH_CONTEXT");
  if (!Object.hasOwn(ACTIONS, command.action) || !itemIds?.includes(command.itemId)
    || (opportunity.itemId && opportunity.itemId !== command.itemId)
    || (command.action === "replace" && !itemIds.includes(command.oldItemId))) return reject("POUCH_ITEM_REFERENCE");
  if (snapshot.pouch.remembered.some((id) => !itemIds.includes(id))) return reject("POUCH_ITEM_REFERENCE");
  const result = command.action === "replace" ? replaceItem(snapshot.pouch, command.oldItemId, command.itemId)
    : ACTIONS[command.action](snapshot.pouch, command.itemId);
  return result.ok ? Object.freeze({ ok: true, value: Object.freeze({ pouch: result.value }) }) : reject(result.error.code);
}
