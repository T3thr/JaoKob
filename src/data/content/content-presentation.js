import { deepFreeze } from "../validation/content-values.js";

/**
 * Project accepted orchestration facts and validated settings/content into media
 * desires. No previous scene, loading state, URL, browser object or effect enters
 * this function. Missing channels mean neutral/silent, including on direct Resume.
 *
 * Image references carry only contentVersion/assetId/localized alt. Task 2's
 * injected resolver owns paths and readiness; `imageRequests` are current demand,
 * not a claim that anything has loaded. Task 4 fans `audio` out independently of
 * the renderer and never waits for it inside a story transaction.
 *
 * @param {object} input Validated runtime content, accepted snapshot/facts,
 * validated settings and optional application overlay mode.
 * @returns {Readonly<{visual: object, audio: object}>} Immutable JSON data.
 * @throws {TypeError} CONTENT_PRESENTATION for an invalid composition contract.
 * Trace: CR-0003 D1/D2/D5/D6/D8, FR-UI-001, FR-LOC-001, ADR-P0-015.
 */
export function projectContentPresentation({ loaded, snapshot, facts, settings, mode } = {}) {
  const fail = () => {
    const error = new TypeError("Presentation requires validated content, settings and matching accepted facts.");
    error.code = "CONTENT_PRESENTATION";
    throw error;
  };
  if (!loaded?.valid || !loaded.indexes || !loaded.catalog || !settings) fail();
  const { indexes } = loaded;
  const node = snapshot ? indexes.nodes[snapshot.currentNodeId] : null;
  if (snapshot && (!node || facts?.nodeId !== node.id || !Array.isArray(facts.actions))) fail();
  const dialogue = snapshot && facts.dialogueId ? indexes.dialogues[facts.dialogueId] : null;
  if (snapshot && facts.dialogueId && !dialogue) fail();
  const text = (value) => value?.[settings.locale] ?? value?.th ?? "";
  const image = (id) => {
    if (!id) return null;
    const asset = indexes.assets[id];
    if (asset?.type !== "image") fail();
    return { contentVersion: loaded.catalog.version, assetId: id, alt: text(asset.alt) };
  };
  const environment = node?.environment ?? {};
  const background = image(environment.backgroundAssetId ?? node?.backgroundAssetId);
  const speaker = dialogue ? indexes.characters[dialogue.speakerCharacterId] : null;
  const protagonist = snapshot ? Object.values(indexes.characters).find((character) => character.narrativeRole === "protagonist") : null;
  const protagonistPortrait = protagonist
    ? image((speaker?.id === protagonist.id ? dialogue?.delivery.portraitAssetId : null) ?? protagonist.visualProfile.defaultPortraitAssetId)
    : null;
  // Narration has no body; another speaker's portrait belongs in the badge only.
  const speakerPortrait = speaker && !["protagonist", "narrator"].includes(speaker.narrativeRole)
    ? image(dialogue.delivery.portraitAssetId ?? speaker.visualProfile.defaultPortraitAssetId) : null;
  const overlay = ["settings", "choice-confirmation", "replace-confirmation"].includes(mode) ? mode : null;
  const visualMode = overlay ?? (!snapshot ? "title" : facts.complete ? "completion"
    : facts.hasNextPage || node.type === "cutscene" ? "reading" : node.type);
  const imageRequests = [...new Map([background, protagonistPortrait, speakerPortrait]
    .filter(Boolean).map((reference) => [reference.assetId, reference])).values()];
  const volumes = {
    master: settings.masterVolume, music: settings.musicVolume,
    ambience: settings.ambienceVolume, effects: settings.effectsVolume,
  };
  if (Object.values(volumes).some((value) => !Number.isFinite(value) || value < 0 || value > 1)
    || typeof settings.reducedIntensityAudio !== "boolean") fail();
  for (const id of [environment.bgmAssetId, environment.ambientAssetId]) {
    if (id && indexes.assets[id]?.type !== "audio") fail();
  }
  return deepFreeze({
    visual: {
      mode: visualMode,
      nodeId: node?.id ?? null,
      background,
      character: protagonistPortrait ? { id: protagonist.id, lifeStage: protagonist.visualProfile.lifeStage, portrait: protagonistPortrait } : null,
      speaker: speaker ? { id: speaker.id, name: text(speaker.name), role: speaker.narrativeRole,
        description: text(dialogue.accessibilityDescription), portrait: speakerPortrait } : null,
      imageRequests,
    },
    audio: {
      sessionId: snapshot?.sessionId ?? null,
      ...(environment.bgmAssetId ? { bgmAssetId: environment.bgmAssetId } : {}),
      ...(environment.ambientAssetId ? { ambientAssetId: environment.ambientAssetId } : {}),
      volumes,
      reducedIntensity: settings.reducedIntensityAudio,
    },
  });
}
