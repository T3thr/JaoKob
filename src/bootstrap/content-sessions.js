import { createContentOrchestrator } from "../core/use-cases/content-orchestration.js";
import { loadGameContent } from "../data/content/content-runtime.js";
import { createContentVersionMigration } from "../data/migrations/content-2-0-0-to-2-1-0.js";
import { migrateSave1To2 } from "../data/persistence/save-1-to-2.js";

const failure = () => Object.freeze({ ok: false, error: Object.freeze({ code: "SAVE_MIGRATION" }) });

/** Compose the primary story and bounded, lazy compatible continuations.
 * Every save is validated by its own orchestrator, including its checkpoint.
 * No cursor guessing, enter-node execution, storage access or write occurs here.
 * Trace: CR-0005 T10, FR-SAV-004/005/006/007, ADR-P0-020/021.
 */
export async function createContentSessions(options = {}) {
  const primaryContent = await loadGameContent(options);
  if (!primaryContent.valid) return primaryContent;
  const sessions = new Map();
  const bind = loaded => {
    const session = Object.freeze({ loaded, orchestrator: createContentOrchestrator(loaded.catalog, { pouchEnabled: true }) });
    sessions.set(loaded.catalog.version, session); return session;
  };
  const primary = bind(primaryContent);
  const production = options.content === undefined && options.packageSource === undefined;
  const allowLegacy = production || options.compatibilityContent !== undefined;
  const base = options.baseUrl ?? new URL("../data/content/content-runtime.js", import.meta.url).href;
  let legacyAttempted = false, migrationAttempted = false, migration = null;

  async function prepare(candidates) {
    const versions = new Set(candidates.map(c => c.envelope.contentVersion));
    if (allowLegacy && !sessions.has("2.1.0") && !legacyAttempted && (versions.has("2.1.0") || versions.has("2.0.0"))) {
      legacyAttempted = true;
      const legacy = await loadGameContent({ ...options, content: options.compatibilityContent,
        packageSource: new URL("./compatibility/act-01-2.1.0.json", base).href, expectedContentVersion: "2.1.0",
        testReferenceIds: primaryContent.testReferenceIds,
        presentationCatalog: options.compatibilityPresentationCatalog,
        presentationSource: production ? new URL("./presentation/act-01-2.1.0.json", base).href : undefined,
      });
      if (legacy.valid && legacy.catalog.pouchPolicy) bind(legacy);
    }
    const target = sessions.get("2.1.0");
    if (!target || migrationAttempted || !versions.has("2.0.0")) return;
    migrationAttempted = true;
    const source = await loadGameContent({ ...options, content: options.migrationSourcePackage,
      packageSource: new URL("./compatibility/act-01-2.0.0.json", base).href, expectedContentVersion: "2.0.0",
      testReferenceIds: primaryContent.testReferenceIds, presentationCatalog: undefined, presentationSource: undefined });
    if (!source.valid) return;
    const proof = createContentVersionMigration({ sourcePackage: source.packageData, targetPackage: target.loaded.packageData,
      testReferenceIds: primaryContent.testReferenceIds });
    if (proof.ok) migration = proof.value;
  }

  function admit(input) {
    let envelope = input;
    if (envelope.contentVersion === "2.0.0") {
      if (!migration || envelope.saveFormatVersion !== 1) return failure();
      const result = migration.migrate(envelope);
      if (!result.ok) return result;
      envelope = result.value.envelope;
    }
    const result = migrateSave1To2(envelope);
    if (!result.ok) return result;
    const session = sessions.get(result.value.envelope.contentVersion);
    const target = result.value.envelope;
    if (!session || !session.orchestrator.validateSnapshot({ ...target.payload, revision: target.revision }).ok) return failure();
    return Object.freeze({ ok: true, value: Object.freeze({ ...result.value, session }) });
  }
  return Object.freeze({ valid: true, primary, prepare, admit });
}
