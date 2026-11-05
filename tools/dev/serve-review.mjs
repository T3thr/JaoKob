#!/usr/bin/env node
/**
 * Serve the repository for the PO review pages (C4: `docs/design-system/evidence/journey-review/`).
 *
 *   node tools/dev/serve-review.mjs            # port 8000, this machine and the local network
 *   node tools/dev/serve-review.mjs --port 8123
 *   node tools/dev/serve-review.mjs --local    # this machine only
 *
 * Static files only, read-only, no dependency, `Cache-Control: no-store` so every reload shows
 * the working tree. Paths stay inside the repository; dot-folders (`.git`) are refused. Prints
 * the review URL for this machine and for a phone on the same Wi-Fi. Development only: not part
 * of the game or the release allowlist (tools/README.md).
 */

import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { networkInterfaces } from "node:os";
import { extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const repo = resolve(fileURLToPath(new URL("../..", import.meta.url)));
const args = process.argv.slice(2);
const portIndex = args.indexOf("--port");
const port = portIndex >= 0 ? Number(args[portIndex + 1]) : 8000;
const host = args.includes("--local") ? "127.0.0.1" : "0.0.0.0";
const REVIEW = "/docs/design-system/evidence/journey-review/";

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".woff2": "font/woff2",
  ".mp3": "audio/mpeg",
  ".webm": "audio/webm",
  ".md": "text/plain; charset=utf-8",
};

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  console.error("Usage: node tools/dev/serve-review.mjs [--port 8000] [--local]");
  process.exit(1);
}

const server = createServer(async (request, response) => {
  try {
    let path = decodeURIComponent(new URL(request.url ?? "/", "http://localhost").pathname);
    if (request.method !== "GET" && request.method !== "HEAD") { response.writeHead(405).end(); return; }
    if (path === "/") { response.writeHead(302, { Location: REVIEW }).end(); return; }
    if (path.endsWith("/")) path += "index.html";
    const file = resolve(repo, `.${path}`);
    if (!file.startsWith(`${repo}${sep}`) || path.split("/").some((part) => part.startsWith("."))) { response.writeHead(403).end(); return; }
    const info = await stat(file);
    if (!info.isFile()) { response.writeHead(404).end(); return; }
    const body = await readFile(file);
    response.writeHead(200, { "Content-Type": MIME[extname(file).toLowerCase()] ?? "application/octet-stream", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" });
    response.end(request.method === "HEAD" ? undefined : body);
  } catch {
    response.writeHead(404).end();
  }
});

server.listen(port, host, () => {
  console.log(`JaoKob review server · ${repo}`);
  console.log(`  This machine:  http://localhost:${port}${REVIEW}`);
  if (host === "0.0.0.0") {
    for (const entries of Object.values(networkInterfaces())) {
      for (const entry of entries ?? []) {
        if (entry.family === "IPv4" && !entry.internal) console.log(`  Phone (Wi-Fi): http://${entry.address}:${port}${REVIEW}play.html`);
      }
    }
  }
  console.log("  Stop with Ctrl+C");
});
