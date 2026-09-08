/**
 * Persistent visual layers for accepted presentation facts. Media arrives through
 * an injected, verified, decode-before-resolve loader; controls never await it.
 * Each lease is released after replacement, cancellation or disposal.
 * Trace: CR-0003 D4/D6, FR-UI-001, NFR-PE-003/005, ADR-P0-015.
 */
export function createStageView({ document, loadImage = async () => null }) {
  const background = layer("div", "stage-bg", "jk-stage-bg");
  background.setAttribute("aria-hidden", "true");
  const character = layer("figure", "stage-char", "jk-stage-char");
  const speakerPortrait = layer("span", "stage-speaker-portrait", "jk-speaker-portrait");
  const slots = [slot(background, "jk-background-image", true), slot(character, "jk-character-image", false), slot(speakerPortrait, "jk-speaker-image", false)];
  let disposed = false;

  function layer(tag, id, className) {
    const element = document.createElement(tag);
    element.setAttribute("id", id);
    element.setAttribute("class", className);
    return element;
  }

  function slot(element, className, decorative) {
    return { element, className, decorative, key: null, generation: 0, release: null, image: null };
  }

  function updateSlot(current, reference) {
    const key = reference ? `${reference.contentVersion}/${reference.assetId}` : null;
    if (current.key === key) return;
    current.key = key;
    const generation = ++current.generation;
    if (!reference) {
      current.element.replaceChildren();
      current.release?.(); current.release = null; current.image = null;
      current.element.setAttribute("data-media-state", "neutral");
      return;
    }
    current.element.setAttribute("data-media-state", "loading");
    // A changed scene is neutral until its own image is decoded. Keep the old
    // lease only until the new request settles, so a revoked URL is never shown.
    current.image?.setAttribute("hidden", "");
    Promise.resolve().then(() => loadImage(reference)).then((result) => {
      const value = result?.ok === true ? result.value : null;
      if (disposed || current.generation !== generation) { value?.release?.(); return; }
      if (!value || typeof value.url !== "string" || !value.url) {
        current.element.replaceChildren(); current.release?.(); current.release = null; current.image = null;
        current.element.setAttribute("data-media-state", "unavailable");
        return;
      }
      const image = document.createElement("img");
      image.setAttribute("class", current.className);
      image.setAttribute("src", value.url);
      image.setAttribute("alt", current.decorative ? "" : reference.alt ?? "");
      image.setAttribute("decoding", "async");
      image.setAttribute("draggable", "false");
      if (!current.decorative) { image.setAttribute("width", "512"); image.setAttribute("height", "512"); }
      current.element.replaceChildren(image);
      current.release?.(); current.release = value.release; current.image = image;
      current.element.setAttribute("data-media-state", "ready");
    }).catch(() => {
      if (disposed || current.generation !== generation) return;
      current.element.replaceChildren(); current.release?.(); current.release = null; current.image = null;
      current.element.setAttribute("data-media-state", "unavailable");
    });
  }

  return Object.freeze({
    background, character, speakerPortrait,
    update(presentation = {}) {
      if (disposed) return;
      updateSlot(slots[0], presentation.background ?? null);
      updateSlot(slots[1], presentation.character?.portrait ?? null);
      updateSlot(slots[2], presentation.speaker?.portrait ?? null);
      character.setAttribute("data-life-stage", presentation.character?.lifeStage ?? "none");
    },
    dispose() {
      disposed = true;
      for (const current of slots) {
        current.generation++; current.release?.(); current.release = null; current.element.replaceChildren();
      }
    },
    retry() { for (const current of slots) if (current.element.getAttribute("data-media-state") === "unavailable") current.key = null; },
  });
}
