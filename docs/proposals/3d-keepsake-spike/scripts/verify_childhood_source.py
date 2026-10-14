"""CR-0004: run Blender --background model/jaokob-childhood-crochet.blend --python this-file."""
import json
from pathlib import Path
import bpy
from mathutils import Vector

scene = bpy.data.scenes["JaoKob_Childhood_Spike"]
assert scene["generator"] == "CR-0004-childhood-v1"
body = next(c for c in scene.collection.children if c.name.startswith("CHILDHOOD"))
heart = next(c for c in scene.collection.children if c.name.startswith("ACCESSORY"))
assert len(body.objects) == 39
assert len(heart.objects) == 1
assert not set(body.objects).intersection(heart.objects)
assert body.objects["Body_ContinuousPill"].type == "MESH"
assert all("neck" not in obj.name.lower() for obj in body.objects)
accessory = heart.objects[0]
assert accessory.name == "RedHeart_EditableMesh"
assert accessory["optional"] and accessory["default_visible"]
assert not accessory.hide_render and not heart.hide_render
for side in ["L", "R"]:
    for part in ["WhiteCrochetEyeRing", "LargeBlackPupil", "Highlight_UpperLarge", "Highlight_LowerSmall"]:
        assert body.objects.get(f"{side}_{part}") is not None
    assert len([obj for obj in body.objects if obj.name.startswith(side+"_Highlight_")]) == 2
    for kind in ["Finger", "Toe"]:
        assert sorted(obj.name for obj in body.objects if obj.name.startswith(f"{side}_{kind}_")) == [f"{side}_{kind}_{i}" for i in range(1, 4)]
images = [image for image in bpy.data.images if image.name.startswith("Childhood_Crochet_")]
assert len(images) == 2
assert all(list(image.size) == [128, 128] and image.packed_file for image in images)
assert all(obj.type == "MESH" for obj in list(body.objects)+list(heart.objects))
points = [obj.matrix_world @ Vector(corner) for obj in list(body.objects)+list(heart.objects) for corner in obj.bound_box]
dimensions = [round((max(p[i] for p in points)-min(p[i] for p in points))*.1, 5) for i in range(3)]
evidence = {
    "change": "CR-0004", "milestone": "1B", "status": "passed", "blender": bpy.app.version_string,
    "bodyParts": len(body.objects), "heartParts": len(heart.objects),
    "checks": ["Single continuous pill body object and no neck", "Separate optional heart collection/object, visible by default",
               "Two named highlights per eye", "Three separate lobes per hand/foot", "Two packed 128px authored textures",
               "Studio camera/lights excluded from export collections"],
    "sourceDimensionsMetresXYZ": dimensions,
    "note": "Structural checks do not certify visual likeness or animation-ready topology.",
}
out = Path(bpy.data.filepath).resolve().parent.parent/"evidence"/"childhood-source-verification.json"
out.write_text(json.dumps(evidence, indent=2)+"\n")
print(json.dumps(evidence, indent=2))
