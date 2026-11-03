/**
 * Content digests for the Journey runtime: the package digest that binds a save to the exact
 * package it was played on, and the save integrity digest (ADR-P0-034 D6.4 · D7).
 *
 * Canonicalization `jaokob-canonical-json-v1`: plain JSON data only (null, booleans, finite
 * numbers, strings, arrays, plain objects); object keys sorted by UTF-16 code units; no
 * whitespace; every scalar and key written by ECMAScript `JSON.stringify`. The digest is
 * SHA-256 over the UTF-8 bytes of that text, written as 64 lowercase hex digits.
 *
 * SHA-256 is computed here, synchronously, instead of through `crypto.subtle`: Web Crypto
 * exists only in secure contexts, and a phone opening the game over a LAN address must still
 * boot and save. This is a check against accidental damage, not a security signature.
 *
 * Trace: ADR-P0-034 D6.4 · D7, specs/README.md (journey canonicalization), TC-S5-SAVE-002.
 */

export const CANONICALIZATION = "jaokob-canonical-json-v1";
export const DIGEST_ALGORITHM = "sha-256";
const MAX_DEPTH = 256;

/** The canonical text of plain JSON data. Throws a TypeError on anything that is not JSON. */
export function canonicalJson(value) {
  return write(value, 0);
}

function write(value, depth) {
  if (depth > MAX_DEPTH) throw new TypeError("Canonical JSON is nested too deeply");
  if (value === null || typeof value === "boolean" || typeof value === "string") return JSON.stringify(value);
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new TypeError("Canonical JSON numbers must be finite");
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    const items = [];
    for (let i = 0; i < value.length; i += 1) items.push(write(value[i], depth + 1));
    return `[${items.join(",")}]`;
  }
  if (typeof value === "object") {
    const proto = Object.getPrototypeOf(value);
    if (proto !== Object.prototype && proto !== null) throw new TypeError("Canonical JSON objects must be plain");
    const keys = Object.keys(value).sort();
    return `{${keys.map((key) => `${JSON.stringify(key)}:${write(value[key], depth + 1)}`).join(",")}}`;
  }
  throw new TypeError(`Canonical JSON cannot hold a ${typeof value}`);
}

/** SHA-256 digest of plain JSON data in its canonical form. */
export const digestJson = (value) => sha256Hex(canonicalJson(value));

/** Bytes of a string in UTF-8, the unit of the save budget. */
export const utf8ByteLength = (text) => new TextEncoder().encode(text).length;

const K = new Uint32Array([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
]);

const rotr = (x, n) => (x >>> n) | (x << (32 - n));

/** SHA-256 (FIPS 180-4) of a string's UTF-8 bytes, as 64 lowercase hex digits. */
export function sha256Hex(text) {
  if (typeof text !== "string") throw new TypeError("sha256Hex expects a string");
  const bytes = new TextEncoder().encode(text);
  const blocks = Math.ceil((bytes.length + 9) / 64);
  const message = new Uint8Array(blocks * 64);
  message.set(bytes);
  message[bytes.length] = 0x80;
  const view = new DataView(message.buffer);
  const bits = bytes.length * 8;
  view.setUint32(message.length - 8, Math.floor(bits / 0x100000000));
  view.setUint32(message.length - 4, bits >>> 0);

  const hash = new Uint32Array([0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19]);
  const w = new Uint32Array(64);
  for (let offset = 0; offset < message.length; offset += 64) {
    for (let i = 0; i < 16; i += 1) w[i] = view.getUint32(offset + i * 4);
    for (let i = 16; i < 64; i += 1) {
      const s0 = rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ (w[i - 15] >>> 3);
      const s1 = rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ (w[i - 2] >>> 10);
      w[i] = w[i - 16] + s0 + w[i - 7] + s1;
    }
    let [a, b, c, d, e, f, g, h] = hash;
    for (let i = 0; i < 64; i += 1) {
      const t1 = (h + (rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25)) + ((e & f) ^ (~e & g)) + K[i] + w[i]) >>> 0;
      const t2 = ((rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22)) + ((a & b) ^ (a & c) ^ (b & c))) >>> 0;
      h = g; g = f; f = e; e = (d + t1) >>> 0; d = c; c = b; b = a; a = (t1 + t2) >>> 0;
    }
    hash[0] += a; hash[1] += b; hash[2] += c; hash[3] += d;
    hash[4] += e; hash[5] += f; hash[6] += g; hash[7] += h;
  }
  return Array.from(hash, (word) => word.toString(16).padStart(8, "0")).join("");
}
