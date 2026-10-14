"""CR-0004 — editable, seated JaoKob adult plush base mesh (Blender 4.5+).

Open this file in Blender's Text Editor and Run Script, or:
  blender --background --python scripts/build_model.py -- --render

Only this generator's named scene is replaced; other scenes are left intact.
No reference photographs are embedded or uploaded. Coordinates: X right,
Y rear (the doll looks toward -Y), Z up; one Blender unit is 0.1 metre.
"""

import argparse
import json
import math
from pathlib import Path
import sys

import bpy
from mathutils import Matrix, Vector


# Artist-facing proportions. Keep edits here for repeatable comparisons.
P = {
    "head_center": (0.0, 0.0, 2.22),
    "head_radius": (0.70, 0.435, 0.55),
    "eye_spacing": 0.31,
    "eye_height": 2.62,
    "lip_width": 0.515,
    "shirt_width": 0.45,
    "arm_spread": 0.65,
    "foot_forward": -0.94,
    "seated_drop": 0.38,
}
COLORS = {
    "green": (0.38, 0.64, 0.13),
    "lid": (0.34, 0.58, 0.105),
    "blue": (0.045, 0.19, 0.59),
    "hem": (0.042, 0.16, 0.50),
    "peach": (0.99, 0.68, 0.36),
    "mouth": (0.54, 0.28, 0.115),
    "white": (0.96, 0.955, 0.86),
    "black": (0.038, 0.047, 0.031),
    "stitch": (0.25, 0.43, 0.087),
}
SCENE_NAME = "JaoKob_Adult_Spike"
GENERATOR = "CR-0004-v1"
RENDER_PREVIEWS = False  # Set True when using Text Editor to render all four views.


def arguments():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path)
    parser.add_argument("--render", action="store_true")
    parser.add_argument("--samples", type=int, default=48)
    return parser.parse_args(sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else [])


def output_directory(override):
    if override:
        return override.resolve()
    source = globals().get("__file__", "")
    if source and Path(source).is_file():
        return Path(source).resolve().parent.parent
    text = getattr(bpy.context.space_data, "text", None)
    if text and text.filepath:
        return Path(bpy.path.abspath(text.filepath)).resolve().parent.parent
    raise RuntimeError("Open the saved build_model.py file, or pass --output with an absolute directory.")


def linear(rgb):
    return tuple(v / 12.92 if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4 for v in rgb)


def make_scene():
    old = bpy.data.scenes.get(SCENE_NAME)
    if old:
        if old.get("generator") != GENERATOR:
            raise RuntimeError("A non-generated scene has this name; rename it before running this script.")
        for obj in list(old.objects):
            bpy.data.objects.remove(obj, do_unlink=True)
        bpy.data.scenes.remove(old)
    scene = bpy.data.scenes.new(SCENE_NAME)
    scene["generator"] = GENERATOR
    bpy.context.window.scene = scene
    scene.unit_settings.system = "METRIC"
    scene.unit_settings.scale_length = 0.1
    parts = bpy.data.collections.new("DOLL • export these parts")
    studio = bpy.data.collections.new("STUDIO • excluded from GLB")
    scene.collection.children.link(parts)
    scene.collection.children.link(studio)
    return scene, parts, studio


def material(name, roughness, sheen=0.0):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Metallic"].default_value = 0
    bsdf.inputs["Sheen Weight"].default_value = sheen
    bsdf.inputs["Sheen Roughness"].default_value = 0.8
    color = mat.node_tree.nodes.new("ShaderNodeVertexColor")
    color.layer_name = "Color"
    mat.node_tree.links.new(color.outputs["Color"], bsdf.inputs["Base Color"])
    return mat


def finish(obj, name, color, mat, collection):
    obj.name = name
    for coll in list(obj.users_collection):
        coll.objects.unlink(obj)
    collection.objects.link(obj)
    if obj.type == "MESH":
        for face in obj.data.polygons:
            face.use_smooth = True
        attribute = obj.data.color_attributes.new(name="Color", type="BYTE_COLOR", domain="CORNER")
        rgba = (*linear(COLORS[color]), 1.0)
        for datum in attribute.data:
            datum.color = rgba
        obj.data.color_attributes.active_color = attribute
    obj.data.materials.clear()
    obj.data.materials.append(mat)
    obj["part"] = name
    return obj


def ellipsoid(name, location, scale, color="green", segments=32, rings=20, mat=None):
    segments = max(12, round(segments * .8 / 2) * 2)
    rings = max(8, round(rings * .75))
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segments, ring_count=rings, location=location)
    obj = bpy.context.object
    obj.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    return finish(obj, name, color, mat or FABRIC, PARTS)


def tube(name, points, radii, color, sides=12, flatten=1.0, mat=None):
    """Swept rings with smooth centerline, closed ends and predictable topology."""
    points = [Vector(p) for p in points]
    verts, faces = [], []
    closed_curve = (points[0] - points[-1]).length < 1e-6
    for i, point in enumerate(points):
        closed_end = closed_curve and i in (0, len(points)-1)
        tangent = ((points[1]-points[-2]) if closed_end else (points[min(i + 1, len(points) - 1)] - points[max(0, i - 1)])).normalized()
        reference = Vector((0, 0, 1) if closed_curve else (0, 1, 0))
        if abs(tangent.dot(reference)) > 0.92:
            reference = Vector((1, 0, 0))
        u = tangent.cross(reference).normalized()
        v = tangent.cross(u).normalized()
        for j in range(sides):
            angle = 2 * math.pi * j / sides
            verts.append(point + radii[i] * (math.cos(angle) * u + flatten * math.sin(angle) * v))
    for i in range(len(points) - 1):
        for j in range(sides):
            a, b = i * sides + j, i * sides + (j + 1) % sides
            faces.append((a, b, b + sides, a + sides))
    faces.append(tuple(reversed(range(sides))))
    faces.append(tuple((len(points) - 1) * sides + j for j in range(sides)))
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    PARTS.objects.link(obj)
    return finish(obj, name, color, mat or FABRIC, PARTS)


def bezier(points, steps=18):
    a, b, c, d = (Vector(p) for p in points)
    return [(1-t)**3*a + 3*(1-t)**2*t*b + 3*(1-t)*t*t*c + t**3*d for t in (i/(steps-1) for i in range(steps))]


def limb(name, control, width, color="green", flatten=1.0):
    points = bezier(control)
    radii = [width * (0.8 + 0.2 * math.sin(math.pi * i / (len(points)-1))) for i in range(len(points))]
    return tube(name, points, radii, color, sides=16, flatten=flatten)


def shirt():
    # Elliptical garment rings: bottom hem through soft chest into crew neck.
    profile = [(0.76, .40, .285), (.79, .45, .32), (.87, .455, .322),
               (1.00, .43, .302), (1.15, .45, .32), (1.32, .48, .305),
               (1.48, .46, .275), (1.58, .34, .225), (1.63, .22, .205)]
    n = 48
    verts, faces = [], []
    for k, (z, rx, ry) in enumerate(profile):
        for j in range(n):
            t = 2 * math.pi * j/n
            wrinkle = .008 * math.sin(5*t + k*1.3) + .006 * math.cos(9*t-k*.8)
            verts.append(((rx * P["shirt_width"]/.45 + wrinkle) * math.cos(t), (ry + wrinkle) * math.sin(t), z + .012*math.cos(3*t+k*.6)))
    for k in range(len(profile)-1):
        for j in range(n):
            a, b = k*n+j, k*n+(j+1)%n
            faces.append((a, b, b+n, a+n))
    faces.append(tuple(reversed(range(n))))
    faces.append(tuple((len(profile)-1)*n+j for j in range(n)))
    mesh = bpy.data.meshes.new("Soft shirt with shallow folds")
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    obj = bpy.data.objects.new("Shirt • separate editable garment", mesh)
    PARTS.objects.link(obj)
    finish(obj, obj.name, "blue", FABRIC, PARTS)
    for label, z, rx, ry, radius in [("Hem", .812, .449, .323, .023), ("Crew neck", 1.625, .228, .211, .035)]:
        points = [(rx*math.cos(t), ry*math.sin(t), z) for t in (2*math.pi*i/64 for i in range(65))]
        tube(label, points, [radius]*len(points), "hem", sides=8)


def make_doll():
    ellipsoid("Body • soft seated pelvis", (0, 0, .83), (.39, .265, .37))
    ellipsoid("Neck", (0, 0, 1.67), (.22, .205, .24), segments=24, rings=14)
    head = ellipsoid("Head • wide soft cheeks", P["head_center"], P["head_radius"], segments=48, rings=32)
    # Slight cheek breadth and a flatter lower face, without a hard plastic sphere.
    for vert in head.data.vertices:
        z = vert.co.z / P["head_radius"][2]
        vert.co.x *= 1 + .065 * math.exp(-((z + .22)/.46)**2)
    shirt()
    for side, sign in [("L", -1), ("R", 1)]:
        s = sign
        # The sleeves sit over upper arms and keep visible seams at the cuffs.
        limb(f"{side} upper arm", [(s*.39, .005, 1.44), (s*.52, -.005, 1.37), (s*.61, -.035, 1.17), (s*.62, -.075, 1.08)], .105)
        sleeve = limb(f"{side} blue sleeve", [(s*.34, .01, 1.43), (s*.44, 0, 1.40), (s*.52, -.025, 1.31), (s*.57, -.045, 1.25)], .17, "blue")
        limb(f"{side} long forearm", [(s*.595, -.06, 1.23-P["seated_drop"]), (s*.69, -.16, .66), (s*.70, -.39, .43), (s*P["arm_spread"], -.57, .24)], .092, flatten=1.13)
        hand = ellipsoid(f"{side} flattened mitten hand", (s*.64, -.635, .195), (.13, .135, .145), segments=24, rings=16)
        hand.rotation_euler.y = s*.16
        # Stitch divisions suggest plush fingers; no rigid human knuckles.
        for finger in [-1, 1]:
            x = s*.64 + finger*.04
            tube(f"{side} hand stitch {finger}", [(x, -.749, .14), (x, -.77, .19), (x, -.751, .25)], [.0035]*3, "stitch", sides=6)
        limb(f"{side} long seated leg", [(s*.235, -.055, .76-P["seated_drop"]), (s*.30, -.27, .23), (s*.35, -.62, .19), (s*.40, -.88, .17)], .137, flatten=.86)
        foot = ellipsoid(f"{side} soft forward foot", (s*.43, P["foot_forward"], .17), (.225, .29, .145), segments=28, rings=16)
        foot.rotation_euler.z = -s*.13
        for toe in [-1, 1]:
            x = s*.43 + toe*.065
            tube(f"{side} toe stitch {toe}", [(x, -1.18, .23), (x, -1.09, .294), (x, -1.015, .312)], [.004]*3, "stitch", sides=6)

        x = s*P["eye_spacing"]
        ellipsoid(f"{side} raised eye cushion", (x, -.215, P["eye_height"]), (.285, .255, .30), segments=32, rings=22)
        ellipsoid(f"{side} ivory eye applique", (x, -.439, 2.676), (.221, .096, .139), "white", segments=32, rings=20, mat=APPLIQUE)
        ellipsoid(f"{side} black pupil applique", (x+s*.012, -.529, 2.706), (.097, .031, .094), "black", segments=28, rings=18, mat=APPLIQUE)
        ellipsoid(f"{side} sewn eye glint", (x+s*.012-.034, -.559, 2.735), (.032, .009, .033), "white", segments=16, rings=10, mat=APPLIQUE)
        ellipsoid(f"{side} small eye glint", (x+s*.012+.032, -.561, 2.696), (.012, .007, .013), "white", segments=12, rings=8, mat=APPLIQUE)
        ellipsoid(f"{side} sleepy lower eyelid", (x, -.459, 2.54), (.253, .132, .144), "lid", segments=32, rings=18)
        points = bezier([(x-.232, -.468, 2.681), (x-.15, -.523, 2.832), (x+.13, -.517, 2.842), (x+.235, -.463, 2.716)], steps=24)
        tube(f"{side} upper eyelid", points, [.042]*len(points), "green", sides=10, flatten=1.1)

    # Two elongated upholstered lips, sharing rounded ends, with a shallow crease.
    for label, dz, radius in [("Upper peach lip", .043, .065), ("Lower peach lip", -.041, .067)]:
        points, radii = [], []
        for i in range(33):
            t = -1 + 2*i/32
            points.append((P["lip_width"]*t, -.465 + .10*t*t, 2.045 + .025*t*t + dz))
            radii.append(radius * (.35 + .65*(1-abs(t)**6)))
        tube(label, points, radii, "peach", sides=14, flatten=1.15)
    points = [(P["lip_width"]*.96*t, -.536+.10*t*t, 2.046+.025*t*t) for t in (-1+2*i/32 for i in range(33))]
    tube("Mouth • subtle seam", points, [.0075]*len(points), "mouth", sides=6)
    for s in [-1, 1]:
        ellipsoid("Lip corner " + str(s), (s*.497, -.378, 2.069), (.046, .073, .082), "peach", segments=16, rings=12)

    # Inferred construction detail: deliberately restrained pending a real rear photo.
    points = [(0, .435*math.sin(a)+.003, 2.22+.55*math.cos(a)) for a in (.25+(math.pi-.5)*i/25 for i in range(26))]
    tube("Rear head seam • inferred", points, [.0035]*len(points), "stitch", sides=6)
    # Drop the torso onto the seat; legs and forearms already use seated endpoints.
    grounded = ("forearm", "mitten", "hand stitch", "seated leg", "forward foot", "toe stitch")
    for obj in PARTS.objects:
        if not any(word in obj.name for word in grounded):
            obj.location.z -= P["seated_drop"]


def aim(obj, target):
    obj.rotation_euler = (Vector(target)-obj.location).to_track_quat("-Z", "Y").to_euler()


def setup_studio(scene, studio, samples):
    scene.render.engine = "CYCLES"
    scene.cycles.samples = samples
    scene.cycles.use_denoising = True
    scene.render.resolution_x = 1000
    scene.render.resolution_y = 1000
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.view_settings.view_transform = "AgX"
    scene.world = bpy.data.worlds.new("Warm neutral studio")
    scene.world.use_nodes = True
    scene.world.node_tree.nodes["Background"].inputs["Color"].default_value = (.73, .78, .85, 1)
    scene.world.node_tree.nodes["Background"].inputs["Strength"].default_value = .4
    for name, position, power, size, tint in [
        ("Key softbox", (-3, -4, 6), 420, 4.0, (1,.89,.74)),
        ("Fill softbox", (3, -2, 3.4), 170, 3.0, (.79,.88,1)),
        ("Rim softbox", (1, 3, 4.6), 340, 3.0, (1,.91,.76)),
    ]:
        light = bpy.data.lights.new(name, "AREA")
        light.energy, light.shape, light.size, light.color = power, "DISK", size, tint
        obj = bpy.data.objects.new(name, light)
        studio.objects.link(obj)
        obj.location = position
        aim(obj, (0, 0, 1.5))
    bpy.ops.mesh.primitive_plane_add(size=200, location=(0,0,.018))
    floor = bpy.context.object
    floor.name = "Studio floor • not exported"
    for coll in list(floor.users_collection):
        coll.objects.unlink(floor)
    studio.objects.link(floor)
    mat = bpy.data.materials.new("Warm paper background")
    mat.diffuse_color = (*linear((.87,.835,.77)),1)
    mat.use_nodes = True
    mat.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = mat.diffuse_color
    mat.node_tree.nodes["Principled BSDF"].inputs["Roughness"].default_value = 1
    floor.data.materials.append(mat)
    cam = bpy.data.objects.new("Inspection camera", bpy.data.cameras.new("Inspection camera"))
    studio.objects.link(cam)
    cam.data.type, cam.data.ortho_scale = "ORTHO", 3.25
    scene.camera = cam
    return cam


def camera_view(cam, view):
    positions = {"three-quarter": (4,-7,3.3), "front": (0,-8,2.75), "side": (8,0,2.8), "back": (0,8,2.8)}
    cam.location = positions[view]
    aim(cam, (0,-.16,1.25))


def export(scene, out):
    # Export from a temporary scene containing ONLY copies of the doll parts.
    # Joining those copies reduces draw calls while preserving editable originals.
    temporary = bpy.data.scenes.new("JaoKob_GLTF_Export")
    bpy.context.window.scene = temporary
    for obj in PARTS.objects:
        duplicate = obj.copy()
        duplicate.data = obj.data.copy()
        duplicate.matrix_world = Matrix.Scale(.1, 4) @ obj.matrix_world
        temporary.collection.objects.link(duplicate)
    bpy.context.view_layer.update()
    for obj in temporary.objects:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = next(iter(temporary.objects))
    bpy.ops.object.join()
    merged = bpy.context.object
    merged.name = "JaoKob adult plush • seated base mesh"
    destination = out / "model" / "jaokob-adult-plush.glb"
    bpy.ops.export_scene.gltf(filepath=str(destination), export_format="GLB", use_selection=True, use_active_scene=True,
                              export_yup=True, export_apply=True, export_animations=False,
                              export_cameras=False, export_lights=False, export_extras=False, export_texcoords=False)
    bpy.context.window.scene = scene
    for obj in list(temporary.objects):
        bpy.data.objects.remove(obj, do_unlink=True)
    bpy.data.scenes.remove(temporary)
    triangles = 0
    for obj in PARTS.objects:
        obj.data.calc_loop_triangles()
        triangles += len(obj.data.loop_triangles)
    metrics = {"change": "CR-0004", "generator": GENERATOR, "blender": bpy.app.version_string,
               "stage": "base-mesh; final fabric textures and likeness approval deferred",
               "parts": len(PARTS.objects), "sourceTriangles": triangles,
               "glbBytes": destination.stat().st_size, "byteBudget": 2000000,
               "withinBudget": destination.stat().st_size <= 2000000,
               "rearGeometry": "inferred", "referencePhotosEmbedded": False,
               "parameters": P}
    (out/"evidence"/"model-metrics.json").write_text(json.dumps(metrics, indent=2)+"\n")
    if not metrics["withinBudget"]:
        raise RuntimeError(f"GLB exceeds byte budget: {metrics['glbBytes']}")
    return metrics


def main():
    global PARTS, FABRIC, APPLIQUE
    args = arguments()
    out = output_directory(args.output)
    for directory in ["model", "renders", "evidence"]:
        (out/directory).mkdir(parents=True, exist_ok=True)
    scene, PARTS, studio = make_scene()
    FABRIC = material("Plush • matte vertex colors", .87, .08)
    APPLIQUE = material("Eye applique • matte embroidery", .76, .04)
    make_doll()
    cam = setup_studio(scene, studio, args.samples)
    camera_view(cam, "three-quarter")
    metrics = export(scene, out)
    for screen in bpy.data.screens:
        for area in screen.areas:
            if area.type == "VIEW_3D":
                area.spaces.active.region_3d.view_perspective = "CAMERA"
                area.spaces.active.shading.type = "SOLID"
                area.spaces.active.shading.color_type = "VERTEX"
    # Generated project saves separately; it never overwrites the user's current .blend.
    bpy.ops.wm.save_as_mainfile(filepath=str(out/"model"/"jaokob-adult-plush.blend"), copy=True)
    if args.render or RENDER_PREVIEWS:
        for view in ["three-quarter", "front", "side", "back"]:
            camera_view(cam, view)
            scene.render.filepath = str(out/"renders"/(view+".png"))
            bpy.ops.render.render(write_still=True)
            if view == "three-quarter":
                scene.render.image_settings.file_format = "JPEG"
                scene.render.image_settings.quality = 85
                bpy.data.images["Render Result"].save_render(str(out/"renders"/"poster.jpg"), scene=scene)
                scene.render.image_settings.file_format = "PNG"
        camera_view(cam, "three-quarter")
    print("JAOKOB_OUTPUT " + str(out))
    print("JAOKOB_METRICS " + json.dumps(metrics))


if __name__ == "__main__":
    main()
