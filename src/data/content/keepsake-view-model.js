import { TH_KEEPSAKES } from "../localization/th-keepsakes.js";
import { deepFreeze } from "../validation/content-values.js";

/** Project already-validated domain facts. No command, storage or I/O.
 * Asset paths are static authored metadata resolved relative to this module.
 */
export function projectKeepsakePouch({ pouch, opportunity, locale = "th" }) {
  if (!pouch) return null;
  const item = (id) => {
    const metadata = TH_KEEPSAKES[id];
    if (!metadata) throw new TypeError("POUCH_ITEM_REFERENCE");
    const status = pouch.held.includes(id) ? "held" : pouch.released.includes(id) ? "released" : "refused";
    return { id, name: metadata.name, description: metadata.description, memoryText: metadata.memoryText,
      image: { src: new URL(metadata.imagePath, import.meta.url).href, alt: metadata.imageAlt }, status,
      opportunityId: opportunity?.id ?? null,
      actions: ["release", "use"].map((action) => ({ action, enabled: status === "held" && (action !== "use" || metadata.usageTypes.includes("scene-utility")) && (opportunity?.actions.includes(action) ?? false) })),
    };
  };
  return deepFreeze({ capacity: 4, used: pouch.held.length,
    count: new Intl.NumberFormat(locale).format(pouch.held.length),
    slots: Array.from({ length: 4 }, (_, index) => pouch.held[index] ? item(pouch.held[index]) : null),
    memories: pouch.remembered.filter((id) => !pouch.held.includes(id)).map(item),
  });
}
