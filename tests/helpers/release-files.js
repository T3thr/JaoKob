import { readFileSync } from "node:fs";
import { dirname, posix } from "node:path";
import { JOURNEY_MEDIA_MANIFEST_PATH, JOURNEY_PACKAGE_PATH } from "../../src/bootstrap/journey-shell.js";

/**
 * The files the game needs, found from `index.html` the way a browser would: its `src` and
 * `href` references, every relative module import, every `url()` of a stylesheet, the two
 * resources the shell fetches (the package and its media manifest), the images that manifest
 * lists, and the font licence that ships beside the fonts. Used to check the release allowlist.
 */
const repository = new URL("../../", import.meta.url);
const read = (path) => readFileSync(new URL(path, repository), "utf8");
const join = (from, reference) => posix.normalize(posix.join(dirname(from), reference.split(/[?#]/)[0]));

export const RELEASE_ALLOWLIST_PATH = "specs/releases/sprint-05-static-files.json";

export function gameFiles() {
  const files = new Set(["index.html"]);
  const queue = [];
  const add = (path) => { if (!files.has(path)) { files.add(path); queue.push(path); } };
  for (const match of read("index.html").matchAll(/\b(?:src|href)="([^"#]+)"/g)) add(join("index.html", match[1]));
  while (queue.length > 0) {
    const path = queue.shift();
    if (path.endsWith(".js")) {
      for (const match of read(path).matchAll(/(?:\bfrom\s*|\bimport\s*\(?\s*)["'](\.[^"']+)["']/g)) add(join(path, match[1]));
    } else if (path.endsWith(".css")) {
      for (const match of read(path).matchAll(/url\(["']?([^"')]+)["']?\)/g)) if (!match[1].startsWith("data:")) add(join(path, match[1]));
    }
  }
  add(JOURNEY_PACKAGE_PATH);
  add(JOURNEY_MEDIA_MANIFEST_PATH);
  const manifest = JSON.parse(read(JOURNEY_MEDIA_MANIFEST_PATH));
  for (const entry of Object.values(manifest.categories).flat()) add(entry.outputPath);
  if ([...files].some((path) => path.startsWith("assets/fonts/"))) add("assets/fonts/OFL-Sarabun.txt");
  return [...files].sort();
}
