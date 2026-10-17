"""CR-0004: run Blender --background model/jaokob-childhood-crochet.blend --python this-file."""
import json
from pathlib import Path
import bpy
from mathutils import Vector

scene = bpy.data.scenes["JaoKob_Childhood_Spike"]
assert scene["generator"] == "ADR-P0-025-childhood-v2"
body = next(c for c in scene.collection.children if c.name.startswith("CHILDHOOD"))
heart = next(c for c in scene.collection.children if c.name.startswith("ACCESSORY"))
assert len(body.objects) == 29
assert len(heart.objects) == 1
assert not set(body.objects).intersection(heart.objects)
assert body.objects["Body_ContinuousPill"].type == "MESH"
assert all("neck" not in obj.name.lower() for obj in body.objects)
accessory = heart.objects[0]
assert accessory.name == "RedHeart_EditableMesh"
assert accessory["optional"] and not accessory["default_visible"]
assert heart.hide_render and heart.hide_viewport
empty = next(c for c in scene.collection.children if c.name.startswith("STANCE • Empty"))
hug = next(c for c in scene.collection.children if c.name.startswith("STANCE • Heart"))
assert len(empty.objects) == len(hug.objects) == 10
assert not empty.hide_render and not empty.hide_viewport
assert hug.hide_render and hug.hide_viewport
assert scene["default_material"] == "Velour" and scene["default_stance"] == "empty"
assert bpy.data.texts.get("Childhood_Variants.py") is not None
for collection in [body,empty,hug,heart]:
    for obj in collection.objects:
        assert "velour" in obj.data.materials[0].name or "sparkling" in obj.data.materials[0].name
for side in ["L", "R"]:
    for part in ["WhiteCrochetEyeRing", "LargeBlackPupil", "Highlight_UpperLarge", "Highlight_LowerSmall"]:
        assert body.objects.get(f"{side}_{part}") is not None
    assert len([obj for obj in body.objects if obj.name.startswith(side+"_Highlight_")]) == 2
    for collection,kind in [(body,"Toe"),(empty,"RestingFinger"),(hug,"Finger")]:
        assert sorted(obj.name for obj in collection.objects if obj.name.startswith(f"{side}_{kind}_")) == [f"{side}_{kind}_{i}" for i in range(1, 4)]
assert bpy.data.materials[scene["crochet_material"]].use_fake_user
helper=bpy.data.texts["Childhood_Variants.py"].as_string()
for stance in ("heart", "empty"):
    for surface in ("Crochet", "Velour"):
        configured=helper.replace('STANCE = "empty"', f'STANCE = "{stance}"').replace('SURFACE = "Velour"', f'SURFACE = "{surface}"')
        exec(compile(configured, "Childhood_Variants.py", "exec"), {})
        assert heart.hide_render == (stance=="empty")
        assert hug.hide_viewport == (stance=="empty")
        assert empty.hide_render == (stance=="heart")
        assert body.objects["Body_ContinuousPill"].data.materials[0].name == scene["velour_material" if surface=="Velour" else "crochet_material"]
images = [image for image in bpy.data.images if image.name.startswith("Childhood_Crochet_")]
assert len(images) == 2
assert all(list(image.size) == [128, 128] and image.packed_file for image in images)
assert all(obj.type == "MESH" for obj in list(body.objects)+list(empty.objects))
points = [obj.matrix_world @ Vector(corner) for obj in list(body.objects)+list(empty.objects) for corner in obj.bound_box]
dimensions = [round((max(p[i] for p in points)-min(p[i] for p in points))*.1, 5) for i in range(3)]
evidence = {
    "change": "ADR-P0-025", "milestone": "1C", "status": "passed", "blender": bpy.app.version_string,
    "bodyParts": len(body.objects), "heartParts": len(heart.objects),
    "checks": ["Single continuous pill body object and no neck", "Separate heart/holding-arms hidden by default; empty arms visible",
               "Velour default on all textile parts, crochet retained", "Embedded Blender stance/material helper", "Two named highlights per eye", "Three separate lobes per hand/foot", "Two packed 128px authored textures",
               "Studio camera/lights excluded from export collections"],
    "sourceDimensionsMetresXYZ": dimensions,
    "note": "Structural checks do not certify visual likeness or animation-ready topology.",
}
out = Path(bpy.data.filepath).resolve().parent.parent/"evidence"/"childhood-source-verification.json"
out.write_text(json.dumps(evidence, indent=2)+"\n")
print(json.dumps(evidence, indent=2))
