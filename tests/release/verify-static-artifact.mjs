/** Local allowlisted staging rehearsal. Never deploys, tags or modifies Git. */
import assert from "node:assert/strict";
import { readFile, writeFile, mkdir, lstat, realpath } from "node:fs/promises";
import { resolve, dirname, relative, sep, isAbsolute } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { gzipSync } from "node:zlib";

const root = fileURLToPath(new URL("../../", import.meta.url));
const manifest = JSON.parse(await readFile(new URL("../../specs/releases/sprint-04-static-files.json", import.meta.url)));
const hash = bytes => createHash("sha256").update(bytes).digest("hex");
const allowed = new Set(manifest.files);
assert.equal(manifest.manifestVersion, 1); assert.equal(allowed.size, manifest.files.length);
assert.ok(allowed.has("index.html"));
function safePath(path) {
  assert.match(path, /^(?:index\.html|(?:src|assets)\/[a-zA-Z0-9/_.-]+)$/);
  assert.ok(!path.split("/").some(p => !p || p.startsWith(".") || /^(?:vendor|models|tests|references)$/i.test(p)));
  assert.doesNotMatch(path, /(?:\.map$|\.env|\.pem$|\.key$|\.glb$|\.blend$|node_modules)/i);
  return path;
}
async function noSymlinks(path) {
  for (let cursor = resolve(path); cursor !== dirname(cursor); cursor = dirname(cursor)) {
    try { assert.equal((await lstat(cursor)).isSymbolicLink(), false, `Symlink ${cursor}`); }
    catch (error) { if (error.code !== "ENOENT") throw error; }
  }
}
function verifyReferences(path, bytes, files) {
  if (!/\.(?:js|css|html)$/.test(path)) return;
  const text = bytes.toString("utf8"), references = [];
  if (path.endsWith(".js")) for (const m of text.matchAll(/(?:\bfrom\s*|\bimport\s*)["'](\.[^"']+)["']/g)) references.push(m[1]);
  if (path.endsWith(".css")) for (const m of text.matchAll(/url\(["']?([^"')]+)["']?\)/g)) references.push(m[1]);
  if (path.endsWith(".html")) for (const m of text.matchAll(/(?:src|href)="([^"#]+)"/g)) references.push(m[1]);
  for (const reference of references) {
    assert.ok(reference.startsWith("."), `External or bare reference ${path}: ${reference}`);
    const target = relative(root, resolve(root, dirname(path), reference)).split(sep).join("/");
    assert.ok(files.has(target), `Missing ${path} → ${target}`);
  }
  assert.doesNotMatch(text, /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|gh[pousr]_[A-Za-z0-9]{30,}|AKIA[0-9A-Z]{16}|sk-(?:proj-)?[A-Za-z0-9_-]{32,}/, `Credential pattern ${path}`);
  if (path.startsWith("src/core/")) {
    assert.doesNotMatch(text, /from\s*["'][^"']*(?:\/ui\/|\/data\/)|\b(?:document|localStorage|sessionStorage)\s*[.(]/);
  }
}
async function stage(destination, baseline) {
  assert.ok(destination && isAbsolute(destination), "Use a new absolute JKB_ARTIFACT_DIR/JKB_ROLLBACK_DIR outside the checkout");
  destination = resolve(destination);
  assert.ok(!destination.startsWith(resolve(root) + sep) && destination !== resolve(root));
  await noSymlinks(destination);
  // A fresh destination is mandatory. Never empty or delete a caller's folder.
  await mkdir(destination);
  const files = new Map();
  for (const path of manifest.files) {
    safePath(path); await noSymlinks(resolve(root, path));
    let bytes;
    if (baseline) {
      const exists = execFileSync("git", ["ls-tree", baseline, "--", path], { cwd: root, encoding: "utf8" }).trim();
      if (!exists) continue;
      assert.ok(exists.startsWith("100644 "), `Nonregular baseline ${path}`);
      bytes = execFileSync("git", ["show", `${baseline}:${path}`], { cwd: root, maxBuffer: 4_000_000 });
    } else bytes = await readFile(resolve(root, path));
    files.set(path, bytes);
  }
  assert.ok(files.has("index.html") && files.has("src/bootstrap/index.js"));
  const inventory = [];
  for (const [path, bytes] of files) {
    verifyReferences(path, bytes, files);
    if (/\.(?:json|svg|md|txt)$/.test(path)) assert.doesNotMatch(bytes.toString("utf8"), /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|gh[pousr]_[A-Za-z0-9]{30,}/);
    const target = resolve(destination, path); await mkdir(dirname(target), { recursive: true }); await writeFile(target, bytes, { flag: "wx" });
    inventory.push({ path, bytes: bytes.length, gzipBytes: gzipSync(bytes).length, sha256: hash(bytes) });
  }
  for (const registryPath of ["assets/provenance/benchmark-assets.json", "assets/provenance/act-01-3.0.0.json"]) {
    if (!files.has(registryPath)) continue;
    const registry = JSON.parse(files.get(registryPath));
    for (const asset of registry.assets) {
      assert.ok(files.has(asset.path), `Unstaged registered asset ${asset.path}`);
      assert.equal(hash(files.get(asset.path)), asset.sha256); assert.equal(files.get(asset.path).length, asset.byteLength);
    }
  }
  return { destination: await realpath(destination), baseline: baseline ?? "working tree", fileCount: files.size,
    gzipBytes: inventory.reduce((a,b) => a + b.gzipBytes,0), inventory };
}
const current = await stage(process.env.JKB_ARTIFACT_DIR);
const rollback = await stage(process.env.JKB_ROLLBACK_DIR, "bc167d3");
const result = { result: "PASS", manifestSha256: hash(JSON.stringify(manifest)), current, rollback,
  checks: ["explicit file allowlist", "fresh destination", "regular files and no ancestor symlinks", "imports/CSS/HTML relative references", "registry bytes/hashes", "credential pattern scan", "pure Core imports", "no docs/specs/tests/private references/3D/vendor"],
  limits: "Scoped local staging and pattern inspection; no formal security certification or release/deployment authorization." };
assert.ok(process.env.JKB_RELEASE_EVIDENCE, "Set JKB_RELEASE_EVIDENCE outside the artifact.");
await writeFile(process.env.JKB_RELEASE_EVIDENCE, JSON.stringify(result, null, 2) + "\n");
console.log(JSON.stringify({ result: result.result, currentFiles: current.fileCount, rollbackFiles: rollback.fileCount, currentGzipBytes: current.gzipBytes }));
