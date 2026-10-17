/** Keep complete raw measurements while presenting a small reviewable report. */
import { writeFile } from "node:fs/promises";
import { gzipSync } from "node:zlib";
import { createHash } from "node:crypto";
import { join } from "node:path";

export async function writeCloseoutEvidence(directory, name, evidence) {
  const raw = Buffer.from(JSON.stringify(evidence, null, 2) + "\n");
  const report = structuredClone(evidence), performance = report.performance;
  if (performance?.interactions) delete performance.interactions.rawRuns;
  for (const type of ["cold", "warm"]) for (const sample of performance?.loads?.[type] ?? []) {
    sample.cachedResources = sample.resources?.filter(r => r.transferSize === 0 && r.decodedBodySize > 0).length ?? 0;
    delete sample.resources;
  }
  for (const frame of performance?.frames ?? []) delete frame.intervals;
  report.rawArchive = { file: `${name}.gz`, uncompressedBytes: raw.length,
    uncompressedSha256: createHash("sha256").update(raw).digest("hex"), encoding: "gzip; complete raw JSON including every resource/input/frame sample" };
  await writeFile(join(directory, `${name}.gz`), gzipSync(raw));
  await writeFile(join(directory, name), JSON.stringify(report, null, 2) + "\n");
}
