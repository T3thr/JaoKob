/**
 * `<ClashActionTray />`: the clash cards as one row of basic moves and three groups (UX §3.3 ·
 * §3.4 · §3.8, ADR-P0-034 D9.4).
 *
 *   - Phones and tablets: the basic row stays; the family, companion and keepsake groups are
 *     ARIA tabs over one 2 × 3 well that always reserves three rows (no paging, no shift).
 *     With a single group (R1) there is no tab bar, only its heading.
 *   - Wide screens: every group is a column with its heading; no tabs.
 *   - Tabs carry what is inside without opening them: a gold dot for แก้ทาง, a ripple for ซ้ำ, a
 *     gold stitch for a combo. The tray never switches tabs for the player; the renderer keeps
 *     the chosen tab for the whole clash.
 *   - Cards are the shared `TactileActionCard`; unplayable cards are not shown (Core lists only
 *     legal ones), and every word arrives from the presentation.
 *
 * Trace: UX §3.3 · §3.4 · §3.8, ADR-P0-034 D9.3/D9.4, TC-S5-TRAY-001, TC-S5-A11Y-001.
 */

import { element, setAttributes, setText } from "../journey-dom.js";
import { createTactileActionCard } from "./tactile-action-card.js";

export const TRAY_GROUPS = Object.freeze(["basic", "family", "friends", "pouch"]);
const CAPACITY = Object.freeze({ basic: 4, family: 5, friends: 3, pouch: 6 });
const TABBED = Object.freeze(["family", "friends", "pouch"]);

/**
 * @param {{document: Document, messages: object, loadImage: Function, idSource: (name: string) => string,
 *   onActivate: (key: string) => void, onSelect: (group: string) => void}} options
 */
export function createClashActionTray({ document, messages, loadImage, idSource, onActivate, onSelect }) {
  const root = element(document, "div", "jk-tray", { role: "group", "aria-label": messages.clash.tray, "data-component": "ClashActionTray", hidden: true, "data-layout": "tabs" });
  const descriptions = element(document, "div", "jk-descriptions", { hidden: true });
  const tablist = element(document, "div", "jk-tray__tabs", { role: "tablist", "aria-label": messages.groups.basic });
  const sections = new Map(), tabs = new Map(), pools = new Map();

  for (const group of TRAY_GROUPS) {
    const sectionId = idSource(`tray-${group}`);
    const section = element(document, "section", "jk-tray__group", { "data-group": group, id: sectionId, hidden: true });
    const heading = element(document, "p", "jk-tray__heading", {}, messages.groups[group]);
    const grid = element(document, "div", "jk-tray__grid");
    const cards = Array.from({ length: CAPACITY[group] }, () => {
      const describedBy = idSource("tray-card");
      const description = element(document, "span", "", { id: describedBy });
      descriptions.append(description);
      const card = createTactileActionCard({ document, messages, loadImage, describedBy, onActivate });
      grid.append(card.element);
      return { card, description };
    });
    section.append(heading, grid);
    sections.set(group, { section, heading, grid });
    pools.set(group, cards);
    if (group !== "basic") {
      const tabId = idSource(`tab-${group}`);
      const tab = element(document, "button", "jk-tray__tab", { type: "button", role: "tab", id: tabId, "aria-controls": sectionId, "aria-selected": "false", tabindex: "-1", "data-group": group, hidden: true });
      const label = element(document, "span", "jk-tray__tab-label", {}, messages.groups[group]);
      const marks = element(document, "span", "jk-tray__marks", { "aria-hidden": "true" });
      ["counter", "repeat", "combo"].forEach((mark) => marks.append(element(document, "i", "jk-tray__mark", { "data-mark": mark, hidden: true })));
      const sr = element(document, "span", "jk-sr");
      tab.append(label, marks, sr);
      tab.addEventListener("click", () => onSelect(group));
      tab.addEventListener("keydown", (event) => onTabKey(event, group));
      tablist.append(tab);
      tabs.set(group, { tab, marks, sr });
    }
  }
  root.append(sections.get("basic").section, tablist, ...TABBED.map((group) => sections.get(group).section), descriptions);

  let shownTabs = [];
  function onTabKey(event, group) {
    const index = shownTabs.indexOf(group);
    if (index < 0) return;
    const target = event.key === "ArrowRight" ? shownTabs[(index + 1) % shownTabs.length]
      : event.key === "ArrowLeft" ? shownTabs[(index - 1 + shownTabs.length) % shownTabs.length]
        : event.key === "Home" ? shownTabs[0] : event.key === "End" ? shownTabs.at(-1) : null;
    if (target === null || target === undefined) return;
    event.preventDefault();
    onSelect(target);
    tabs.get(target).tab.focus?.();
  }

  return Object.freeze({
    element: root,
    /** The first card a player can take, for focus when the choose beat opens. */
    firstCard() {
      for (const group of TRAY_GROUPS) {
        const entry = pools.get(group).find(({ card }) => !card.element.hidden && !card.element.closest?.("[hidden]"));
        if (entry) return entry.card.element;
      }
      return null;
    },
    /**
     * @param {object|null} clash @param {{selected: string|null, armed: string|null, layout: "tabs"|"columns"}} state
     */
    update(clash, { selected, armed, layout }) {
      const groups = clash === null || clash.beat !== "choose" ? [] : clash.groups;
      setAttributes(root, { hidden: groups.length === 0, "data-layout": layout });
      if (groups.length === 0) { for (const cards of pools.values()) cards.forEach(({ card }) => card.clear()); return; }
      const present = new Map(groups.map((group) => [group.id, group]));
      shownTabs = TABBED.filter((group) => present.has(group));
      const tabbed = layout === "tabs" && shownTabs.length > 1;
      const open = shownTabs.includes(selected) ? selected : shownTabs[0] ?? null;
      setAttributes(tablist, { hidden: !tabbed, "data-count": shownTabs.length });
      for (const group of TRAY_GROUPS) {
        const data = present.get(group) ?? null;
        const { section, heading } = sections.get(group);
        const visible = data !== null && (group === "basic" || !tabbed || group === open);
        setAttributes(section, { hidden: !visible, role: tabbed && group !== "basic" ? "tabpanel" : null, "aria-labelledby": tabbed && group !== "basic" ? tabs.get(group).tab.id : null, "data-count": data?.cards.length ?? 0 });
        setAttributes(heading, { hidden: tabbed && group !== "basic" });
        pools.get(group).forEach(({ card, description }, index) => {
          const option = data?.cards[index];
          setAttributes(card.element, { hidden: option === undefined });
          if (option === undefined) { card.clear(); return; }
          card.update(option, { armed: armed === option.key });
          setText(description, option.description);
        });
        if (group !== "basic") {
          const { tab, marks, sr } = tabs.get(group);
          setAttributes(tab, { hidden: data === null || !tabbed, "aria-selected": group === open ? "true" : "false", tabindex: group === open ? "0" : "-1" });
          if (data !== null) {
            [...marks.children].forEach((mark) => setAttributes(mark, { hidden: !data.marks[mark.getAttribute("data-mark")] }));
            setText(sr, data.marks.counter ? ` · ${messages.tags.counter}` : "");
          }
        }
      }
    },
    dispose() {
      for (const cards of pools.values()) cards.forEach(({ card }) => card.dispose());
    },
  });
}
