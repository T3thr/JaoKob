"""Read-only image/manifest validation; --write-report saves JSON evidence.

Run from any directory with Python 3 and Pillow. This tool never edits artwork.
"""

import argparse
import hashlib
import json
from datetime import datetime
from html.parser import HTMLParser
from pathlib import Path
from zoneinfo import ZoneInfo

from PIL import Image


ROOT = Path(__file__).resolve().parents[3]
MANIFEST = ROOT / "assets/images/asset-manifest-v1.json"
PROVENANCE = ROOT / "assets/provenance/visual-assets-v1.json"
REPORT = Path(__file__).with_name("visual-assets-v1-verification.json")
GALLERY = Path(__file__).with_name("visual-assets-v1-review.html")
EXPECTED = {"characters": 24, "backgrounds": 15, "cinematicCGs": 7, "keepsakes": 6}
DIMENSIONS = {"characters": (1024, 1024), "backgrounds": (1600, 900),
              "cinematicCGs": (1600, 900), "keepsakes": (512, 512)}


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def checked_path(relative):
    path = (ROOT / relative).resolve()
    assert path.is_relative_to(ROOT), f"Path escapes repository: {relative}"
    assert path.is_file(), f"Missing file: {relative}"
    return path


class GalleryParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.images = []
        self.ids = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "img":
            self.images.append(attrs)
        if "id" in attrs:
            self.ids.append(attrs["id"])


def verify():
    manifest = json.loads(MANIFEST.read_text())
    provenance = json.loads(PROVENANCE.read_text())
    assert manifest["schemaContract"] == "ADR-P0-032"
    assert {k: len(v) for k, v in manifest["categories"].items()} == EXPECTED
    assert manifest["review"]["status"] == "pending-po-art-review"
    assert manifest["review"]["runtimePromoted"] is False
    assets = [a for group in manifest["categories"].values() for a in group]
    ids = [a["assetId"] for a in assets]
    paths = [a[key] for a in assets for key in ("outputPath", "masterPath")]
    assert len(ids) == len(set(ids)) == 52, "Duplicate or missing asset IDs"
    assert len(paths) == len(set(paths)) == 104, "Duplicate image paths"
    records = {a["assetId"]: a for a in provenance["assets"]}
    assert len(provenance["assets"]) == len(records) == 52
    assert set(records) == set(ids), "Provenance does not cover manifest"
    results = []
    for category, group in manifest["categories"].items():
        for asset in group:
            assert asset["status"] == "generated-awaiting-po-review"
            assert asset["version"] == "v1"
            assert asset["altTh"].strip(), "Missing Thai description"
            checked_path(asset["sourcePrompt"])
            record = records[asset["assetId"]]
            assert record["tool"] == "image_gen.imagegen"
            assert record["prompt"].strip()
            assert asset["provenanceRef"] == str(PROVENANCE.relative_to(ROOT))
            for ref in record["references"]:
                if not ref.startswith("imagegen-source:"):
                    checked_path(ref)
            expected_size = DIMENSIONS[category]
            assert asset["dimensions"] == "x".join(map(str, expected_size))
            transparent = category in ("characters", "keepsakes")
            assert bool(asset.get("transparent")) == transparent
            output_path = Path(asset["outputPath"])
            expected_master = output_path.parent / "versions/v1" / (output_path.stem + ".png")
            assert asset["masterPath"] == str(expected_master)
            for field, provenance_key, expected_format in (
                ("outputPath", "output", "WEBP"), ("masterPath", "master", "PNG")
            ):
                path = checked_path(asset[field])
                saved = record[provenance_key]
                assert saved["path"] == asset[field]
                assert digest(path) == saved["sha256"], f"Hash mismatch: {path}"
                assert path.stat().st_size == saved["byteLength"]
                if field == "outputPath":
                    assert asset["sha256"] == saved["sha256"]
                    assert asset["byteLength"] == saved["byteLength"]
                with Image.open(path) as image:
                    image.load()
                    assert image.format == expected_format
                    assert image.size == expected_size
                    width, height = image.size
                    alpha = image.getchannel("A") if "A" in image.getbands() else None
                    extrema = alpha.getextrema() if alpha else (255, 255)
                    assert list(extrema) == saved["alphaExtrema"]
                    corners = None
                    edge_max = None
                    if transparent:
                        assert alpha is not None and extrema == (0, 255)
                        corners = [alpha.getpixel(p) for p in (
                            (0, 0), (width - 1, 0), (0, height - 1), (width - 1, height - 1))]
                        assert corners == [0, 0, 0, 0], f"Nontransparent corner: {path}"
                        edges = ((0, 0, width, 1), (0, height - 1, width, height),
                                 (0, 0, 1, height), (width - 1, 0, width, height))
                        edge_max = max(alpha.crop(box).getextrema()[1] for box in edges)
                        # Soft glow may have numerical residue; visible artwork must not clip.
                        assert edge_max <= 16, f"Visible silhouette/glow clipped: {path}"
                    else:
                        assert extrema == (255, 255), f"Nonopaque scene: {path}"
                    results.append({"assetId": asset["assetId"], "path": asset[field],
                                    "format": image.format, "dimensions": list(image.size),
                                    "byteLength": saved["byteLength"], "sha256": saved["sha256"],
                                    "alphaExtrema": list(extrema), "cornerAlpha": corners,
                                    "outerEdgeMaxAlpha": edge_max})
    parser = GalleryParser()
    parser.feed(GALLERY.read_text())
    assert len(parser.images) == 52
    assert len(parser.ids) == len(set(parser.ids)), "Duplicate gallery IDs"
    assert set(ids).issubset(parser.ids)
    assert {(GALLERY.parent / i["src"]).resolve() for i in parser.images} == {
        checked_path(a["outputPath"]) for a in assets}
    assert all(i.get("alt", "").strip() for i in parser.images)
    report = {
        "verifiedAt": datetime.now(ZoneInfo("Asia/Bangkok")).isoformat(timespec="seconds"),
        "command": "python3 docs/design-system/evidence/verify-visual-assets-v1.py --write-report",
        "result": "pass", "assetCount": 52, "fileCount": 104,
        "categoryCounts": EXPECTED, "transparentAssetCount": 30, "opaqueAssetCount": 22,
        "masterBytes": sum(r["byteLength"] for r in results if r["format"] == "PNG"),
        "webpBytes": sum(r["byteLength"] for r in results if r["format"] == "WEBP"),
        "manifestSha256": digest(MANIFEST), "provenanceSha256": digest(PROVENANCE),
        "gallerySha256": digest(GALLERY), "verifierSha256": digest(Path(__file__)),
        "checks": ["unique IDs and paths", "all 52 manifest/provenance entries and prompt files",
                   "all 104 file formats, dimensions, byte lengths and SHA-256 hashes",
                   "30 transparent pairs: real alpha, zero-alpha corners, no visible edge clipping",
                   "22 opaque scene pairs", "v1 master paths", "52 gallery images and Thai alt text"],
        "limits": ["Visual composition/canon checks are human-visible review, not automatic semantic proof",
                   "PO art approval remains pending", "No runtime, device, accessibility or release certification"],
        "files": results,
    }
    return report


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--write-report", action="store_true")
    args = parser.parse_args()
    report = verify()
    if args.write_report:
        REPORT.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n")
    print(json.dumps({k: v for k, v in report.items() if k != "files"}, ensure_ascii=False, indent=2))
