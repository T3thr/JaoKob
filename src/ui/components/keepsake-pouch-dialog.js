import { createModalFrame } from "./modal-frame.js";

/** One native modal, temporary inspection/confirmation only. All domain facts
 * and action availability arrive from the immutable VM. ADR-P0-020 D5.
 */
export function createKeepsakePouchDialog({ document, viewModel, message, onIntent }) {
  let view = viewModel, selected = null, pending = null, inspectionHeading = null;
  const text = (key, values = {}) => Object.entries(values).reduce((result, [name, value]) => result.replace(`{{${name}}}`, value), message(key));
  const send = (intent) => onIntent({ ...intent, expectedRevision: view.revision, viewRevision: view.viewRevision });
  const frame = createModalFrame({ document, name: "pouch", title: text("pouch.title"), description: text("pouch.description"),
    closeLabel: text("pouch.close"), onClose: () => send({ type: "SELECT_CHOICE", choiceId: "application.close-pouch" }) });
  const element = frame.createElement;
  frame.closeControl.setAttribute("data-choice-id", "application.close-pouch");
  const content = element("div", { class: "jk-pouch-content" });
  frame.body.append(content);
  function button(label, attributes, handler) {
    const control = element("button", { type: "button", class: "jk-secondary-button", ...attributes }, label);
    control.addEventListener("click", () => { if (!control.disabled) handler(); });
    frame.controls.push(control);
    return control;
  }
  function artwork(item, decorative = false) {
    const figure = element("figure", { class: "jk-pouch-art" });
    const fallback = element("figcaption", { class: "jk-pouch-image-fallback", hidden: "" }, text("pouch.imageUnavailable"));
    if (item.image?.src) {
      const image = element("img", { src: item.image.src, alt: decorative ? "" : item.image.alt, width: "160", height: "128", decoding: "async" });
      image.addEventListener("error", () => { image.setAttribute("hidden", ""); fallback.removeAttribute("hidden"); });
      figure.append(image);
    } else fallback.removeAttribute("hidden");
    figure.append(fallback);
    return figure;
  }
  function request(action, item, oldItemId) {
    pending = { action, item, oldItemId };
    draw();
    frame.controls.find((control) => control.getAttribute("data-jk-role") === "pouch-cancel")?.focus();
  }
  function draw() {
    frame.controls.splice(1);
    const pouch = view.pouch;
    content.replaceChildren();
    content.append(element("p", { class: "jk-pouch-count", "data-jk-role": "pouch-count" }, text("pouch.count", { count: pouch.count ?? String(pouch.used) })));
    if (pouch.used === 0) content.append(element("p", { class: "jk-pouch-empty" }, text("pouch.empty")));
    const grid = element("div", { class: "jk-pouch-grid", "data-jk-role": "pouch-grid" });
    for (let slot = 0; slot < 4; slot += 1) {
      const item = pouch.slots[slot];
      if (!item) {
        grid.append(element("div", { class: "jk-pouch-slot jk-pouch-slot-empty", "data-jk-role": "pouch-empty-slot" }, text("pouch.emptySlot", { slot: String(slot + 1) })));
      } else {
        const control = button(item.name, { class: "jk-pouch-slot jk-pouch-slot-held", "data-item-id": item.id, "aria-label": text("pouch.inspect", { name: item.name }),
          "aria-pressed": selected?.id === item.id ? "true" : "false", "aria-controls": "jk-pouch-detail" }, () => inspect(item));
        control.replaceChildren(artwork(item, true), element("span", {}, item.name)); grid.append(control);
      }
    }
    content.append(grid);
    if (pouch.memories?.length) {
      const memories = element("section", { class: "jk-pouch-memories", "aria-labelledby": "jk-pouch-memories-title" });
      memories.append(element("h3", { id: "jk-pouch-memories-title" }, text("pouch.memories")));
      for (const item of pouch.memories) memories.append(button(item.name, { "data-memory-id": item.id, "aria-label": text("pouch.remember", { name: item.name }), "aria-controls": "jk-pouch-detail" }, () => inspect(item)));
      content.append(memories);
    }
    const detail = element("section", { class: "jk-pouch-detail", id: "jk-pouch-detail", "data-jk-role": "pouch-detail", "aria-labelledby": "jk-pouch-item-title" });
    const title = element("h3", { id: "jk-pouch-item-title", tabindex: "-1" }, selected?.name ?? text("pouch.choose"));
    inspectionHeading = title;
    detail.append(title);
    if (selected) {
      detail.append(element("p", { class: "jk-pouch-item-status", "data-jk-role": "pouch-item-status" }, text(`pouch.${selected.status}`)), artwork(selected),
        element("p", {}, selected.description), element("blockquote", { class: "jk-pouch-memory" }, selected.memoryText));
      if (selected.status === "held") for (const action of selected.actions ?? []) {
        const reasonId = `jk-pouch-${action.action}-reason`;
        const control = button(text(`pouch.${action.action}`), { "data-pouch-action": action.action, ...(!action.enabled ? { "aria-describedby": reasonId } : {}) }, () => request(action.action, selected));
        control.disabled = !action.enabled; detail.append(control);
        if (!action.enabled) detail.append(element("p", { id: reasonId, class: "jk-settings-hint" }, text(action.action === "use" ? "pouch.useUnavailable" : "pouch.unavailable")));
      }
    }
    content.append(detail);
    // Future authored offers share this modal; fixtures exercise full capacity.
    if (pouch.offer) {
      const offer = pouch.offer.item, region = element("section", { class: "jk-pouch-offer", "data-jk-role": "pouch-offer" });
      region.append(element("h3", {}, offer.name), element("p", {}, offer.description));
      if (pouch.used < 4) region.append(button(text("pouch.collect"), { "data-pouch-action": "collect" }, () => request("collect", offer)));
      else {
        region.append(element("p", {}, text("pouch.full")));
        for (const item of pouch.slots) region.append(button(text("pouch.replace", { name: item.name }), { "data-replace-item-id": item.id }, () => request("replace", offer, item.id)));
      }
      region.append(button(text("pouch.refuse"), { "data-pouch-action": "refuse" }, () => request("refuse", offer)),
        button(text("pouch.cancelOpportunity"), { "data-jk-role": "pouch-cancel-offer" }, () => send({ type: "SELECT_CHOICE", choiceId: "application.close-pouch" })));
      content.append(region);
    }
    if (pending) {
      // Keep only the confirmation controls reachable until cancel/commit.
      for (const control of frame.controls.slice(1)) control.disabled = true;
      const confirmation = element("section", { class: "jk-pouch-confirmation", "data-jk-role": "pouch-confirmation", "aria-labelledby": "jk-pouch-confirm-title" });
      const confirmationKey = { use: "pouch.confirmUse", release: "pouch.confirmRelease", collect: "pouch.confirmCollect", refuse: "pouch.confirmRefuse", replace: "pouch.confirmReplace" }[pending.action];
      confirmation.append(element("h3", { id: "jk-pouch-confirm-title" }, text(confirmationKey, { name: pending.item.name, oldName: pouch.slots.find(item => item?.id === pending.oldItemId)?.name ?? "" })));
      confirmation.append(button(text("pouch.cancel"), { "data-jk-role": "pouch-cancel" }, () => {
        const { action, oldItemId } = pending; pending = null; draw();
        const opener = frame.controls.find(control => oldItemId ? control.getAttribute("data-replace-item-id") === oldItemId : control.getAttribute("data-pouch-action") === action);
        (opener ?? frame.closeControl).focus();
      }),
        button(text("pouch.confirm"), { "data-jk-role": "pouch-confirm" }, () => send({ type: "POUCH_ACTION", action: pending.action, itemId: pending.item.id,
          ...(pending.oldItemId ? { oldItemId: pending.oldItemId } : {}),
          opportunityId: ["collect", "refuse", "replace"].includes(pending.action) ? view.pouch.offer?.id : pending.item.opportunityId, confirmed: true })));
      content.append(confirmation);
    }
    for (const control of frame.controls) {
      if (control.disabled) control.setAttribute("data-pouch-disabled", "true");
      else control.removeAttribute("data-pouch-disabled");
    }
  }
  function inspect(item) {
    selected = item; pending = null; draw();
    inspectionHeading?.focus();
  }
  draw();
  return Object.freeze({ element: frame.element, scrollRegion: frame.body, controls: frame.controls,
    open() { frame.open(); }, close: frame.close,
    updateStatus(next) { view = next; },
    setBusy(busy) { for (const control of frame.controls) control.disabled = busy || control.hasAttribute("data-pouch-disabled"); },
  });
}
