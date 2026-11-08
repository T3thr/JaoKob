/**
 * Journey shell: the screens composed on the headless Journey application (ADR-P0-034 D1/D9/D10).
 *
 *   application (C3)  → admits the package, runs the Core session, saves every commit silently
 *   media index       → asset IDs to same-origin images, keyed by the package identity
 *   media resolver    → the bytes of an image, proved against the manifest (size, SHA-256) (C5d)
 *   image cache       → each image decoded once under the package identity, within 32 MiB
 *   presentation      → the play view in words, images and pips
 *   renderer          → draws the model and sends the player's commands back here
 *
 * Every command goes through `perform`, bound to the revision the player saw, and the result
 * is drawn again; a rejected command changes nothing. The page lifecycle suspends the clock
 * and saves when hidden, and wakes it when shown again.
 *
 * The title (C5c) is the real one: continue (never writes), start with the consent the shell
 * keeps (the token never reaches the screen), play in memory when a record is protected, the
 * one-time notices and settings. Settings changed in a modal and the way back from the chapter
 * end go through the same application. C4 composed this for the PO review page
 * (`docs/design-system/evidence/journey-review/`); C5e makes it the game's entry point.
 * Trace: ADR-P0-034 D1/D7/D8/D9/D10, SSOT §1.2 (C4) · §3.1–§3.3, TC-S5-SILENT-001, TC-S5-SAVE-001.
 */

import { createJourneyMediaIndex } from "../data/assets/journey-media.js";
import { createJourneyMediaResolver } from "../data/assets/journey-media-resolver.js";
import { createJourneyPresentation } from "../data/content/journey-presentation.js";
import { TH_JOURNEY } from "../data/localization/th-journey.js";
import { createImageCache } from "../ui/assets/image-cache.js";
import { createJourneyTitle } from "../ui/journey/components/journey-title.js";
import { createIdSource } from "../ui/journey/journey-dom.js";
import { createJourneyRenderer } from "../ui/journey/journey-renderer.js";
import { createJourneyApplication } from "./journey-application.js";

export const JOURNEY_PACKAGE_PATH = "src/data/content/journey/story-jaokob-core.json";
export const JOURNEY_MEDIA_MANIFEST_PATH = "assets/images/asset-manifest-v2.json";

/** The application directory (two levels above this module), with its trailing slash. */
export const journeyBaseUrl = () => new URL("../../", import.meta.url).href;

/**
 * Read the package and the media manifest from the application directory (same origin only).
 * @param {{baseUrl?: string, fetch?: typeof fetch}} [options]
 */
export async function loadJourneyResources({ baseUrl = journeyBaseUrl(), fetch: fetcher = globalThis.fetch } = {}) {
  const read = async (path) => {
    const url = new URL(path, baseUrl);
    const response = await fetcher(url.href, { credentials: "omit", mode: "same-origin", redirect: "error", cache: "no-cache" });
    if (!response.ok) throw new Error(`JOURNEY_RESOURCE_${response.status}`);
    return response.json();
  };
  const [packageData, manifest] = await Promise.all([read(JOURNEY_PACKAGE_PATH), read(JOURNEY_MEDIA_MANIFEST_PATH)]);
  return { packageData, manifest, baseUrl };
}

/** The browser ports of the verified image loader that tests may replace. */
const MEDIA_PORTS = Object.freeze(["createImage", "createObjectURL", "revokeObjectURL", "maxBytes"]);

/**
 * @param {{document: Document, root: Element, packageData: unknown, manifest: unknown, baseUrl: string,
 *   storage?: Storage, clock?: () => string, loadImage?: Function,
 *   media?: {fetch?: typeof fetch, createImage?: Function, createObjectURL?: Function, revokeObjectURL?: Function, maxBytes?: number},
 *   onChange?: (snapshot: object) => void}} options
 * `loadImage` replaces the verified image loader (tests of the screens); `media` replaces the
 * browser ports under it (tests of the loader on real bytes).
 */
export function createJourneyShell(options) {
  const { document, root, packageData, manifest, baseUrl } = options;
  const onChange = options.onChange ?? (() => {});
  const app = createJourneyApplication({
    packageData,
    ...(Object.hasOwn(options, "storage") ? { storage: options.storage } : {}),
    ...(options.clock ? { clock: options.clock } : {}),
  });
  let media = null, presentation = null, renderer = null, titleScreen = null, titleValue = null;
  let phase = "unbooted", model = null, title = null, lastError = null;
  let images = null, imageFailures = 0, disposed = false;
  const view = document.defaultView ?? null;

  const snapshot = () => Object.freeze({ phase, model, title, error: lastError, status: app.status(), gaps: media?.gaps() ?? [] });

  function showTitle(value) {
    phase = "title";
    model = null;
    titleValue = value;
    title = Object.freeze({
      storage: value.storage,
      continue: value.continue,
      needsConsent: value.newGame.needsConsent,
      offerMemory: value.offerMemory,
      consentToken: value.consentToken,
      notices: presentation.notices(value),
      notice: value.notice === null || value.notice === undefined ? null : presentation.notices({ notices: [value.notice] })[0],
      screen: presentation.title(value),
    });
    if (renderer !== null) {
      renderer.element.hidden = true;
      renderer.rest();
    }
    titleScreen?.update(title.screen);
  }

  function showPlay(value) {
    phase = "playing";
    title = null;
    model = presentation.present(value);
    const fromTitle = !titleScreen.element.hidden;
    titleScreen.update(null);
    renderer.element.hidden = false;
    renderer.render(model);
    // The title's button that started the game is gone: focus moves into the game so keys reach it.
    if (fromTitle) renderer.focusEntry();
  }

  /** Draw an application result; a failure leaves the screen as it was. */
  function accept(result) {
    lastError = result.ok ? null : result.error;
    if (result.ok && result.value?.phase === "playing") showPlay(result.value);
    else if (result.ok && result.value?.phase === "title") showTitle(result.value);
    onChange(snapshot());
    return result;
  }

  function onVisibility() {
    if (phase !== "playing") return;
    if (document.visibilityState === "hidden") {
      const result = app.suspend();
      if (result.ok && result.value.notice !== null) accept({ ok: true, value: { ...app.view().value, notice: result.value.notice } });
    } else {
      app.wake();
    }
  }

  function onPageHide() {
    if (phase === "playing") app.suspend();
  }

  /**
   * The `loadImage(descriptor)` port of the screens: read through the media resolver, decoded
   * once in the image cache under the package identity, handed over as a lease with `url` and
   * `release()`. An image that cannot be shown rejects, and its slot stays empty.
   */
  function verifiedLoader(identity) {
    const ports = options.media ?? {};
    const resolver = createJourneyMediaResolver({ media, identity, ...(ports.fetch ? { fetch: ports.fetch } : {}) });
    images = createImageCache({ readAsset: resolver.read, ...Object.fromEntries(MEDIA_PORTS.filter((name) => ports[name] !== undefined).map((name) => [name, ports[name]])) });
    return async (descriptor) => {
      const lease = await images.acquire(descriptor);
      if (lease !== null) return lease;
      if (!disposed) imageFailures += 1;
      throw new Error("IMAGE_UNAVAILABLE");
    };
  }

  const shell = Object.freeze({
    /** Admit the package, build the screens and read the title. */
    boot() {
      const booted = app.boot();
      if (!booted.ok) return accept(booted);
      const { identity, package: pkg } = app.content().value;
      media = createJourneyMediaIndex({ manifest, identity, baseUrl });
      presentation = createJourneyPresentation({ pkg, media, messages: TH_JOURNEY });
      const loadImage = options.loadImage ?? verifiedLoader(identity);
      const changeSettings = (patch) => { accept(app.changeSettings(patch)); };
      renderer = createJourneyRenderer({
        document,
        root,
        messages: TH_JOURNEY,
        loadImage,
        onCommand: (kind, args) => { accept(app.perform(kind, args)); },
        onChangeSettings: changeSettings,
        onLeave: () => { accept(app.leave()); },
      });
      renderer.element.hidden = true;
      titleScreen = createJourneyTitle({
        document,
        messages: TH_JOURNEY,
        loadImage,
        idSource: createIdSource("jt"),
        onContinue: () => { accept(app.continue()); },
        onStart: ({ consent }) => { accept(app.newGame(consent ? { consentToken: titleValue?.consentToken ?? null } : {})); },
        onMemory: () => { accept(app.newGame({ memory: true })); },
        onAcknowledge: (id) => { shell.acknowledgeNotice(id); },
        onChangeSettings: changeSettings,
      });
      root.append(titleScreen.element);
      document.addEventListener("visibilitychange", onVisibility);
      view?.addEventListener?.("pagehide", onPageHide);
      return accept(booted);
    },
    newGame(args = {}) { return accept(app.newGame(args)); },
    continue() { return accept(app.continue()); },
    leave() { return accept(app.leave()); },
    /** A command bound to the revision on screen unless `args.revision` says otherwise. */
    perform(kind, args = {}) {
      if (model === null) return accept(app.perform(kind, args));
      return accept(app.perform(kind, { revision: model.revision, ...args }));
    },
    changeSettings(patch) { return accept(app.changeSettings(patch)); },
    acknowledgeNotice(id) {
      const result = app.acknowledgeNotice(id);
      if (result.ok && phase === "title") accept(app.view());
      return result;
    },
    /** The latest snapshot: phase, presentation model or title, last error, media gaps. */
    snapshot,
    /** The play view of the application (for the review page's engine skip). */
    view() { return app.view(); },
    /** The image cache now (bytes, entries, retained, budget) and the images that could not be shown; null with an injected loader. */
    images() { return images === null ? null : Object.freeze({ ...images.stats(), failures: imageFailures }); },
    dispose() {
      disposed = true;
      document.removeEventListener("visibilitychange", onVisibility);
      view?.removeEventListener?.("pagehide", onPageHide);
      renderer?.dispose();
      titleScreen?.dispose();
      images?.dispose();
    },
  });
  return shell;
}
