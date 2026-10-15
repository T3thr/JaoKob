/** ADR-P0-019 / FR-ACC-004: viewport pagination is temporary presentation state.
 * It never changes an authored string, the Core cursor or persistence. */
export function createReadingPages({ root, document, message, onAdvance, onPresented = () => {} }) {
  let view, shell, identity, pages = [], index = 0, revision = 0, offset = 0;
  let seen = {}, suspended = false;
  const window = document?.defaultView;
  const segment = (text) => {
    if (typeof Intl.Segmenter === "function") return [...new Intl.Segmenter("th", { granularity: "word" }).segment(text)].map(({ segment }) => segment);
    return Array.from(text);
  };
  function paint() {
    const page = pages[index];
    if (!page) return;
    const prose = shell.card.querySelector(".jk-dialogue"), speaker = shell.card.querySelector(".jk-speaker strong");
    prose.textContent = page.text;
    if (speaker) speaker.textContent = page.speaker;
    if (page.part) seen[page.part] = Math.max(seen[page.part] ?? 0, page.end);
    const hasMore = index < pages.length - 1;
    shell.slot.hidden = hasMore;
    if (hasMore) shell.slot.setAttribute("inert", ""); else shell.slot.removeAttribute("inert");
    let next = shell.card.querySelector('[data-jk-action="advance"]');
    if (!next && hasMore) {
      next = document.createElement("button"); next.type = "button";
      next.className = "jk-choice-button jk-advance-button";
      next.setAttribute("data-jk-action", "advance"); next.setAttribute("data-choice-id", "application.advance"); next.setAttribute("data-reading-local", "");
      next.textContent = message("reading.continue");
      next.addEventListener("click", () => onAdvance()); shell.footer.append(next);
    }
    if (next?.hasAttribute("data-reading-local")) next.hidden = !hasMore;
    let label = shell.footer.querySelector(".jk-page-label");
    if (!label) { label = document.createElement("p"); label.className = "jk-page-label"; shell.footer.prepend(label); }
    label.textContent = pages.length > 1 ? message("reading.counter").replace("{{current}}", String(index + 1)).replace("{{total}}", String(pages.length)) : view.scene.pageLabel ?? "";
    label.setAttribute("aria-label", pages.length > 1 ? message("reading.page").replace("{{current}}", String(index + 1)).replace("{{total}}", String(pages.length)) : view.scene.pageLabel ?? "");
    root.setAttribute("data-reading-revision", String(++revision));
    root.setAttribute("data-reading-more", String(hasMore));
    root.setAttribute("data-reading-page", String(index + 1));
    root.setAttribute("data-reading-pages", String(pages.length));
    if (!hasMore && shell.slot.querySelector("button")) {
      const overlap = shell.slot.getBoundingClientRect().bottom - shell.card.getBoundingClientRect().top + 16;
      if (overlap > 1) window.scrollBy({ top: overlap, behavior: "instant" });
    }
  }
  function layout() {
    if (suspended || !shell || !["reading", "decision", "exploration", "cutscene"].includes(view.presentation?.mode)) return;
    const prose = shell.card.querySelector(".jk-dialogue"), speaker = shell.card.querySelector(".jk-speaker");
    const style = window.getComputedStyle(prose), line = parseFloat(style.lineHeight);
    const speakerHeight = speaker ? speaker.getBoundingClientRect().height + parseFloat(window.getComputedStyle(speaker).marginBottom) : 0;
    // At least one complete Thai line, a speaker and a full forward target.
    const minimum = Math.ceil((line + Math.max(speakerHeight, parseFloat(window.getComputedStyle(root).fontSize) * 2.25) + Math.max(44, shell.footer.getBoundingClientRect().height) + 48) / 8) * 8;
    const preferred = Math.min(272, Math.max(window.innerHeight < 480 ? 144 : 224, Math.floor(window.innerHeight * .30 / 8) * 8));
    root.style.setProperty("--jk-reading-height", `${Math.max(minimum, preferred)}px`);
    const available = Math.max(line, shell.references.dialogue.clientHeight - speakerHeight - 1);
    const passages = [ ...(view.feedback ? [{ id: "feedback", text: view.feedback, speaker: message("speaker.label") }] : []),
      { id: "scene", text: view.scene.dialogue, speaker: view.scene.speaker ?? message("speaker.label") } ];
    pages = [];
    let start = 0;
    for (const passage of passages) {
      let end = 0;
      const words = segment(passage.text || "");
      while (words.length) {
        let low = 1, high = words.length, fit = 1;
        while (low <= high) {
          const mid = Math.floor((low + high) / 2);
          prose.textContent = words.slice(0, mid).join("");
          if (prose.getBoundingClientRect().height <= available + .5) { fit = mid; low = mid + 1; } else high = mid - 1;
        }
        if (fit === 1 && words[0].length > 1) {
          prose.textContent = words[0];
          if (prose.getBoundingClientRect().height > available + .5) {
            const graphemes = typeof Intl.Segmenter === "function" ? [...new Intl.Segmenter("th", { granularity: "grapheme" }).segment(words.shift())].map(({segment})=>segment) : Array.from(words.shift());
            words.unshift(...graphemes); continue;
          }
        }
        const text = words.splice(0, fit).join("");
        end += text.length;
        pages.push({ text, speaker: passage.speaker, start, part: passage.id, end }); start += text.length;
      }
    }
    if (!pages.length) pages.push({ text: "", speaker: view.scene.speaker ?? "", start: 0 });
    index = Math.max(0, pages.findLastIndex((page) => page.start <= offset));
    paint();
  }
  function presented() {
    return view?.reading && !suspended ? Object.freeze({ presentationId: view.reading.id,
      parts: Object.freeze(Object.entries(seen).map(([id, end]) => Object.freeze({ id, end }))) }) : null;
  }
  const resize = () => {
    if (suspended || !shell) return;
    offset = pages[index]?.start ?? 0; layout(); onPresented(presented());
  };
  window?.addEventListener("resize", resize);
  document?.fonts?.ready.then(resize);
  document?.fonts?.addEventListener?.("loadingdone", resize);
  return Object.freeze({
    update(nextView, nextShell, options = {}) {
      view = nextView; shell = nextShell;
      suspended = options.suspended === true;
      if (suspended) return;
      const nextIdentity = JSON.stringify([view.reading?.id, view.readingBeatId, view.scene, view.feedback]);
      if (nextIdentity !== identity) { offset = 0; index = 0; seen = {}; identity = nextIdentity; }
      else offset = pages[index]?.start ?? 0;
      // Minimal injected DOMs have no layout engine: render complete prose.
      if (!["reading", "decision", "exploration", "cutscene"].includes(view.presentation?.mode) || !window?.getComputedStyle || !shell.card.querySelector) {
        pages = []; index = 0; root.setAttribute("data-reading-more", "false");
        for (const part of view.reading?.parts ?? []) seen[part.id] = part.text.length;
        return;
      }
      layout();
    },
    next() {
      if (index >= pages.length - 1) return false;
      index++; offset = pages[index].start; paint(); onPresented(presented()); shell.references.dialogue.focus(); return true;
    },
    presented,
    hasMore: () => index < pages.length - 1,
    dispose() { window?.removeEventListener("resize", resize); document?.fonts?.removeEventListener?.("loadingdone", resize); shell = null; },
  });
}
