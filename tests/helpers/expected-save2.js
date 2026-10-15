/** Independent expectation for legacy Save 1 fixtures (ADR-P0-020).
 * Existing payload/cursor assertions stay exact; only the authorized additive
 * fields are specified here, without calling the production migration.
 */
export function expectedMigratedSnapshot(snapshot) {
  const pouch = (facts) => {
    const leaf = facts.flags.find(({ id }) => id === "keepsake.lily_fragment")?.value === true ? ["item_leaf"] : [];
    return { capacity: 4, held: [...leaf], acquired: [...leaf], released: [], remembered: [...leaf], memory: [] };
  };
  return { ...structuredClone(snapshot), pouch: pouch(snapshot), checkpoint: { ...structuredClone(snapshot.checkpoint), pouch: pouch(snapshot.checkpoint) } };
}
