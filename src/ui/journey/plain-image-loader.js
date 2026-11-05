/**
 * The image loader of the C4 screens: decode first, then hand the URL to the component, so a
 * plate or a pose is drawn whole and cross-faded instead of painting in rows. It checks the
 * decoded size against the manifest and fails closed (the slot stays empty).
 *
 * The identity-keyed, byte-verified loader of the Journey media resolver (C5, T3) replaces
 * this through the same `loadImage(descriptor)` port; components do not change.
 * Trace: ADR-P0-034 D10.3, UX §1.5, TC-S5-VN-001.
 */

/**
 * @param {{createImage?: () => HTMLImageElement}} [options]
 * @returns {(descriptor: {url: string, width: number, height: number}) => Promise<{url: string, release: () => void}>}
 */
export function createPlainImageLoader({ createImage = () => new Image() } = {}) {
  return async function loadImage(descriptor) {
    const image = createImage();
    image.decoding = "async";
    image.src = descriptor.url;
    await image.decode();
    if (image.naturalWidth !== descriptor.width || image.naturalHeight !== descriptor.height) {
      image.removeAttribute?.("src");
      throw new Error("IMAGE_SIZE");
    }
    return Object.freeze({ url: descriptor.url, release() {} });
  };
}
