import { createModalFrame } from "./modal-frame.js";

/** Read-only archive; all text was frozen at presentation/commit time.
 * FR-ENG-009 / GDD-UX-006 / TC-S4-LOG-002. No per-line tab stops/live regions.
 */
export function createHistoryDialog({ document, viewModel, message, onIntent }) {
  const history = viewModel.history;
  const frame = createModalFrame({ document, name: "history", title: history.title, description: history.description,
    closeLabel: message("history.close"), onClose: () => onIntent({ type: "SELECT_CHOICE", choiceId: "application.close-history" }) });
  frame.closeControl.setAttribute("data-choice-id", "application.close-history");
  const heading = frame.element.children[0].children[0];
  heading.setAttribute("tabindex", "-1");
  const make = frame.createElement;
  let open = false, userMoved = false;
  for (const type of ["wheel", "touchstart", "pointerdown", "keydown"]) frame.body.addEventListener(type, () => { userMoved = true; });
  frame.element.addEventListener("keydown", event => { if (["PageUp", "PageDown", "Home", "End", "ArrowUp", "ArrowDown"].includes(event.key)) userMoved = true; });
  frame.body.addEventListener("scroll", () => { if (frame.body.scrollTop + frame.body.clientHeight < frame.body.scrollHeight - 2) userMoved = true; });
  document.fonts?.ready.then(() => { if (open && !userMoved) frame.body.scrollTop = frame.body.scrollHeight; });
  frame.body.append(make("p", { class: "jk-history-note", "data-jk-role": "history-session-note" }, history.note));
  if (!history.entries.length) {
    const empty = make("section", { class: "jk-history-empty", "data-jk-role": "history-empty" });
    empty.append(make("h3", {}, history.emptyTitle), make("p", {}, history.emptyText));
    frame.body.append(empty);
  } else {
    const list = make("ol", { class: "jk-history-list", "aria-label": history.listLabel, "data-jk-role": "history-list" });
    for (const entry of history.entries) {
      const item = make("li", { class: `jk-history-entry jk-history-${entry.kind === "dialogue" ? "dialogue" : "action"}`,
        "data-history-entry": entry.entryId, "data-history-kind": entry.kind, lang: entry.locale });
      if (entry.contextStart) {
        item.append(make("h3", { class: "jk-history-scene" }, entry.sceneLabel));
        if (entry.returning) item.append(make("p", { class: "jk-history-return" }, history.returning));
      }
      const label = make("p", { class: "jk-history-speaker" });
      label.append(make("strong", {}, entry.kind === "dialogue" ? entry.speakerLabel : entry.kindLabel));
      if (entry.kind === "dialogue") label.append(make("span", { class: "jk-history-voice" }, entry.voiceLabel));
      item.append(label, make("p", { class: "jk-history-text" }, entry.text));
      list.append(item);
    }
    frame.body.append(list);
  }
  return Object.freeze({ element: frame.element, scrollRegion: frame.body, controls: frame.controls,
    open() {
      open = true; userMoved = false;
      frame.open(heading);
      // Explicit instant scrolling only on entry. Status patches never call open.
      frame.body.scrollTop = frame.body.scrollHeight;
    },
    close() { open = false; frame.close(); }, updateStatus() {}, setBusy(value) { frame.closeControl.disabled = value; },
  });
}
