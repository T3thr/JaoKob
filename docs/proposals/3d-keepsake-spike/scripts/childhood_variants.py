"""Open the embedded text in Blender, choose STANCE/SURFACE, then Alt+P.
ADR-P0-025. Changes source visibility/materials only; generator exports all variants.
"""
import bpy
STANCE = "empty"  # "empty" or "heart"
SURFACE = "Velour"  # "Velour" or "Crochet"
assert STANCE in ("empty", "heart") and SURFACE in ("Velour", "Crochet")
scene=bpy.data.scenes["JaoKob_Childhood_Spike"]
for collection in scene.collection.children:
    visible = (STANCE=="empty" if collection.name.startswith("STANCE • Empty") else STANCE=="heart")
    if collection.name.startswith(("STANCE", "ACCESSORY")):
        collection.hide_render = not visible
        collection.hide_viewport = not visible
    if collection.name.startswith(("CHILDHOOD", "STANCE", "ACCESSORY")):
        for obj in collection.objects:
            if "sparkling" not in obj.data.materials[0].name:
                name=scene["velour_material"] if SURFACE=="Velour" else scene["crochet_material"]
                obj.data.materials[0]=bpy.data.materials[name]
