/** Metadata-only contract fixture. No media files or production rights claim. */
export function createPresentationPackage(source) {
  const target = structuredClone(source);
  target.schemaVersion = "1.2.0";
  target.contentVersion = "2.1.0";
  target.narrativeTrees.forEach((tree) => { tree.schemaVersion = "1.2.0"; });
  target.assets = [
    ["pond", "image"], ["tadpole", "image"], ["tadpole-curious", "image"], ["mother", "image"],
    ["music", "audio"], ["water", "audio"],
  ].map(([name, type]) => ({
    id: `asset.fixture.${name}`, type, path: `assets/fixture/${name}.${type === "image" ? "webp" : "wav"}`,
    ...(type === "image" ? { alt: { th: `ภาพทดสอบ ${name}` } } : {}),
    rights: { origin: "original", licenseId: "fixture-metadata-only", attribution: { th: "ข้อมูลทดสอบ ไม่มีไฟล์สื่อสำหรับเผยแพร่" } },
  }));
  for (const node of target.narrativeTrees[0].nodes) {
    if (["opening", "nursery", "observe-lily", "observe-roots", "observe-shadows", "observe-mother", "home-focus", "home-reflection"].some((name) => node.id === `node.act1.${name}`)) {
      node.environment = { backgroundAssetId: "asset.fixture.pond", bgmAssetId: "asset.fixture.music", ambientAssetId: "asset.fixture.water" };
    }
  }
  target.characters.characters.find((character) => character.narrativeRole === "protagonist").visualProfile.defaultPortraitAssetId = "asset.fixture.tadpole";
  target.characters.characters.find((character) => character.id === "character.mother").visualProfile.defaultPortraitAssetId = "asset.fixture.mother";
  return target;
}
