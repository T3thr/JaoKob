"""CR-0004 — editable, seated JaoKob adult plush base mesh (Blender 4.5+).

Open this file in Blender's Text Editor and Run Script, or:
  blender --background --python scripts/build_model.py -- --render

Only this generator's named scene is replaced; other scenes are left intact.
No reference photographs are embedded or uploaded. Coordinates: X right,
Y rear (the doll looks toward -Y), Z up; one Blender unit is 0.1 metre.
"""

import argparse
import importlib.util
import struct
import bmesh
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
    "heart": (.96,.025,.16),
}
SCENE_NAME = "JaoKob_Adult_Spike"
GENERATOR = "CR-0004-adult-v2"
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
        if old.get("generator") not in (GENERATOR,"CR-0004-v1"):
            raise RuntimeError("A non-generated scene has this name; rename it before running this script.")
        for obj in list(old.objects):
            if len(obj.users_scene)==1: bpy.data.objects.remove(obj, do_unlink=True)
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
    extras=[]
    for name in ["STANCE • EmptyHands", "STANCE • HeartEmote", "ACCESSORY • RedHeart • optional"]:
        collection=bpy.data.collections.new(name)
        scene.collection.children.link(collection)
        extras.append(collection)
    return scene, parts, studio, *extras


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
    segments = max(12, round(segments * .76 / 2) * 2)
    rings = max(8, round(rings * .75))
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segments, ring_count=rings, location=location)
    obj = bpy.context.object
    obj.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj=finish(obj, name, color, mat or FABRIC, PARTS)
    if obj.data.uv_layers:
        for loop in obj.data.uv_layers.active.data:
            loop.uv.x *= 2*math.pi*max(scale[0],scale[1])/.09
            loop.uv.y *= math.pi*scale[2]/.09/2
    return obj


def tube(name, points, radii, color, sides=12, flatten=1.0, mat=None):
    """Swept rings with smooth centerline, closed ends and predictable topology."""
    points = [Vector(p) for p in points]
    verts, faces, uv = [], [], []
    distance=0
    previous_u=None
    closed_curve = (points[0] - points[-1]).length < 1e-6
    for i, point in enumerate(points):
        if i: distance += (point-points[i-1]).length
        closed_end = closed_curve and i in (0, len(points)-1)
        tangent = ((points[1]-points[-2]) if closed_end else (points[min(i + 1, len(points) - 1)] - points[max(0, i - 1)])).normalized()
        reference = Vector((0, 0, 1) if closed_curve else (0, 1, 0))
        if abs(tangent.dot(reference)) > 0.92:
            reference = Vector((1, 0, 0))
        u = (previous_u-tangent*previous_u.dot(tangent)).normalized() if previous_u is not None and not closed_curve else tangent.cross(reference).normalized()
        previous_u=u
        v = tangent.cross(u).normalized()
        for j in range(sides):
            angle = 2 * math.pi * j / sides
            verts.append(point + radii[i] * (math.cos(angle) * u + flatten * math.sin(angle) * v))
            uv.append((j/sides*2*math.pi*max(radii)/.09,distance/.09/2))
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
    obj=finish(obj, name, color, mat or FABRIC, PARTS)
    surface_uv(obj,uv,2*math.pi*max(radii)/.09)
    weld_seams(obj)
    return obj


def surface_uv(obj, uv, wrap):
    layer=obj.data.uv_layers.new(name="UVMap")
    for poly in obj.data.polygons:
        values=[uv[obj.data.loops[i].vertex_index] for i in poly.loop_indices]
        seam=max(v[0] for v in values)-min(v[0] for v in values)>wrap/2
        for i,value in zip(poly.loop_indices,values):
            u,v=value
            layer.data[i].uv=(u+wrap if seam and u<wrap/2 else u,v)


def weld_seams(obj):
    bm=bmesh.new();bm.from_mesh(obj.data)
    bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=.000001)
    bm.to_mesh(obj.data);bm.free();obj.data.update()


def upper_lid(side,x):
    """A continuous closed hood, enveloping the upper sclera in all azimuths.

    Its arched opening preserves the sleepy face, while a thin inner shell
    provides a real underside. This replaces the former decorative tube.
    """
    segments,rings=32,8
    verts,uv,faces=[],[],[]
    for k in range(rings+1):
        for j in range(segments+1):
            phi=2*math.pi*j/segments
            rim_z=2.70+.075*math.sin(phi)**2
            theta=k/rings*math.acos((rim_z-2.676)/.185)
            verts.append((x+.249*math.sin(theta)*math.cos(phi),-.439+.160*math.sin(theta)*math.sin(phi),2.676+.185*math.cos(theta)))
            uv.append((j/segments*17,k/rings*2.4))
    for k in range(rings):
        for j in range(segments):
            a=k*(segments+1)+j
            faces.append((a,a+segments+1,a+segments+2) if k==0 else (a,a+segments+1,a+segments+2,a+1))
    mesh=bpy.data.meshes.new(side+" continuous upper lid")
    mesh.from_pydata(verts,[],faces);mesh.update()
    obj=bpy.data.objects.new(side+" upper eyelid hood",mesh);PARTS.objects.link(obj)
    finish(obj,obj.name,"green",FABRIC,PARTS)
    surface_uv(obj,uv,17);weld_seams(obj)
    bpy.context.view_layer.objects.active=obj
    solid=obj.modifiers.new("Soft closed eyelid shell","SOLIDIFY");solid.thickness=.012;solid.offset=-1
    bpy.ops.object.modifier_apply(modifier=solid.name)
    obj["occludes_upper_sclera"]=True
    return obj


def bezier(points, steps=18):
    a, b, c, d = (Vector(p) for p in points)
    return [(1-t)**3*a + 3*(1-t)**2*t*b + 3*(1-t)*t*t*c + t**3*d for t in (i/(steps-1) for i in range(steps))]


def limb(name, control, width, color="green", flatten=1.0):
    points = bezier(control)
    radii = [width * (0.8 + 0.2 * math.sin(math.pi * i / (len(points)-1))) for i in range(len(points))]
    return tube(name, points, radii, color, sides=12, flatten=flatten)


def shirt():
    # Elliptical garment rings: bottom hem through soft chest into crew neck.
    profile = [(0.76, .40, .285), (.79, .45, .32), (.87, .455, .322),
               (1.00, .43, .302), (1.15, .45, .32), (1.32, .48, .305),
               (1.48, .46, .275), (1.58, .34, .225), (1.63, .22, .205)]
    n = 40
    verts, faces, uv = [], [], []
    for k, (z, rx, ry) in enumerate(profile):
        for j in range(n):
            t = 2 * math.pi * j/n
            wrinkle = .008 * math.sin(5*t + k*1.3) + .006 * math.cos(9*t-k*.8)
            verts.append(((rx * P["shirt_width"]/.45 + wrinkle) * math.cos(t), (ry + wrinkle) * math.sin(t), z + .012*math.cos(3*t+k*.6)))
            uv.append((j/n*32,z/.09/2))
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
    surface_uv(obj,uv,32)
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
        upper_lid(side,x)

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


def crochet_material():
    mat=material("Adult • crochet yarn",.92,0)
    nodes,links=mat.node_tree.nodes,mat.node_tree.links
    source=output_directory(None)/"textures"
    images=[]
    for suffix in ["normal","color"]:
        image=bpy.data.images.load(str(source/f"childhood-crochet-{suffix}.png"),check_existing=True)
        if suffix=="normal": image.colorspace_settings.name="Non-Color"
        image.pack();images.append(image)
    tex=nodes.new("ShaderNodeTexImage");tex.image=images[0];tex.extension="REPEAT"
    normal=nodes.new("ShaderNodeNormalMap");normal.inputs["Strength"].default_value=.6
    links.new(tex.outputs["Color"],normal.inputs["Color"])
    links.new(normal.outputs["Normal"],nodes["Principled BSDF"].inputs["Normal"])
    color=nodes.new("ShaderNodeTexImage");color.image=images[1];color.extension="REPEAT"
    mix=nodes.new("ShaderNodeMix");mix.data_type="RGBA";mix.blend_type="MULTIPLY";mix.inputs[0].default_value=1
    vertex=next(n for n in nodes if n.type=="VERTEX_COLOR")
    links.new(vertex.outputs["Color"],mix.inputs[6]);links.new(color.outputs["Color"],mix.inputs[7])
    links.new(mix.outputs[2],nodes["Principled BSDF"].inputs["Base Color"])
    mat.use_fake_user=True
    return mat


def make_variants():
    for obj in list(PARTS.objects):
        if any(part in obj.name for part in ["forearm","mitten","hand stitch"]):
            PARTS.objects.unlink(obj);EMPTY.objects.link(obj)
    before=set(PARTS.objects)
    for side,s in [("L",-1),("R",1)]:
        limb(f"{side} hugging forearm",[(s*.595,-.06,.85),(s*.79,-.25,.62),(s*.61,-.65,.77),(s*.36,-.80,.92)],.092,flatten=1.13)
        ellipsoid(f"{side} hugging mitten",(s*.36,-.80,.94),(.13,.095,.15),segments=24,rings=16)
        for finger in [-1,1]:
            x=s*.36+finger*.04
            tube(f"{side} hugging hand stitch {finger}",[(x,-.875,.87),(x,-.90,.94),(x,-.875,1.01)],[.0035]*3,"stitch",sides=6)
    for obj in sorted(set(PARTS.objects)-before,key=lambda p:p.name):
        PARTS.objects.unlink(obj);HUG.objects.link(obj)
    verts,faces,uv=[],[],[]
    n=32
    for k in range(13):
        a=math.pi*k/12;r=max(.00001,math.sin(a))
        for j in range(n+1):
            t=2*math.pi*j/n
            x=.43*math.sin(t)**3*r
            z=.92+.71*(13*math.cos(t)-5*math.cos(2*t)-2*math.cos(3*t)-math.cos(4*t)+2)/29*r
            verts.append((x,-.67-.18*math.cos(a),z));uv.append((x/.09,z/.09/2))
    for k in range(12):
        for j in range(n):
            a=k*(n+1)+j;faces.append((a,a+1,a+n+2,a+n+1))
    mesh=bpy.data.meshes.new("Adult optional heart");mesh.from_pydata(verts,[],faces);mesh.update()
    obj=bpy.data.objects.new("RedHeart_EditableMesh",mesh);HEART.objects.link(obj)
    finish(obj,obj.name,"heart",FABRIC,HEART)
    layer=mesh.uv_layers.new(name="UVMap")
    for loop in mesh.loops: layer.data[loop.index].uv=uv[loop.vertex_index]
    weld_seams(obj)
    obj["optional"]=True;obj["default_visible"]=False


def set_preview_state(stance="empty",surface="Velour"):
    for coll,visible in [(EMPTY,stance=="empty"),(HUG,stance=="heart"),(HEART,stance=="heart")]:
        coll.hide_render=not visible;coll.hide_viewport=not visible
    for coll in [PARTS,EMPTY,HUG,HEART]:
        for obj in coll.objects:
            if obj.data.materials[0]!=APPLIQUE: obj.data.materials[0]=FABRIC if surface=="Velour" else YARN
    scene=bpy.context.scene
    scene["default_stance"]="empty";scene["default_material"]="Velour"
    scene["velour_material"]=FABRIC.name;scene["crochet_material"]=YARN.name


def export(scene,out):
    temporary=bpy.data.scenes.new("JaoKob_Adult_Export");bpy.context.window.scene=temporary
    for collection,name in [(PARTS,"JaoKob_Adult_Body"),(EMPTY,"Stance_EmptyHands"),(HUG,"Stance_HeartEmote"),(HEART,"Accessory_RedHeart")]:
        bpy.ops.object.select_all(action="DESELECT")
        copies=[]
        for obj in sorted(collection.objects,key=lambda p:p.name):
            duplicate=obj.copy();duplicate.data=obj.data.copy()
            duplicate.hide_render=False;duplicate.hide_viewport=False
            if duplicate.data.materials[0]!=APPLIQUE: duplicate.data.materials[0]=YARN
            duplicate.matrix_world=Matrix.Scale(.1,4)@obj.matrix_world
            temporary.collection.objects.link(duplicate);copies.append(duplicate)
        bpy.context.view_layer.update()
        for obj in copies: obj.select_set(True)
        bpy.context.view_layer.objects.active=copies[0]
        if len(copies)>1: bpy.ops.object.join()
        merged=bpy.context.object;merged.name=name;merged.data.name=name+"_Mesh"
        modifier=merged.modifiers.new("Portable triangulated tangent space","TRIANGULATE")
        bpy.ops.object.modifier_apply(modifier=modifier.name)
        for key in list(merged.keys()): del merged[key]
        merged["asset_part"]="optional-heart" if collection==HEART else "body"
        if collection==HEART: merged["default_visible"]=False
    bpy.ops.object.select_all(action="SELECT")
    destination=out/"model"/"jaokob-adult-plush.glb"
    bpy.ops.export_scene.gltf(filepath=str(destination),export_format="GLB",use_selection=True,use_active_scene=True,
        export_yup=True,export_apply=True,export_animations=False,export_cameras=False,export_lights=False,
        export_extras=True,export_texcoords=True,export_tangents=True)
    spec=importlib.util.spec_from_file_location("keepsake_variants",output_directory(None)/"scripts"/"keepsake_variants.py")
    packaging=importlib.util.module_from_spec(spec);spec.loader.exec_module(packaging)
    packaging.canonicalize_triangle_order(destination)
    packaging.add_glb_variants(destination,"JaoKob_Adult_Body","Adult","CR-0004-M1D")
    bpy.context.window.scene=scene
    for obj in list(temporary.objects): bpy.data.objects.remove(obj,do_unlink=True)
    bpy.data.scenes.remove(temporary)
    data=destination.read_bytes();doc=json.loads(data[20:20+struct.unpack_from("<I",data,12)[0]])
    counts={node["name"]:sum(doc["accessors"][p["indices"]]["count"]//3 for p in doc["meshes"][node["mesh"]]["primitives"]) for node in doc["nodes"]}
    total=sum(counts.values())
    metrics={"change":"CR-0004","milestone":"1D","generator":GENERATOR,"blender":bpy.app.version_string,
        "parts":sum(len(c.objects) for c in [PARTS,EMPTY,HUG,HEART]),"sourceTriangles":total,"glbBytes":len(data),
        "byteBudget":2000000,"triangleBudget":25000,"withinBudget":len(data)<=2000000 and total<=25000,
        "trianglesByNode":counts,"defaultVisibleTriangles":counts["JaoKob_Adult_Body"]+counts["Stance_EmptyHands"],
        "heartVisibleTriangles":counts["JaoKob_Adult_Body"]+counts["Stance_HeartEmote"]+counts["Accessory_RedHeart"],
        "defaultStance":"empty","defaultMaterial":"Velour","variants":["Velour","Crochet"],
        "rearGeometry":"inferred","referencePhotosEmbedded":False,"parameters":P}
    (out/"evidence"/"model-metrics.json").write_text(json.dumps(metrics,indent=2)+"\n")
    if not metrics["withinBudget"]: raise RuntimeError(f"Adult budget exceeded: {metrics}")
    return metrics


def main():
    global PARTS, FABRIC, APPLIQUE, EMPTY, HUG, HEART, YARN
    args = arguments()
    out = output_directory(args.output)
    for directory in ["model", "renders", "renders/adult", "evidence"]:
        (out/directory).mkdir(parents=True, exist_ok=True)
    scene, PARTS, studio, EMPTY, HUG, HEART = make_scene()
    FABRIC = material("Plush • matte vertex colors", .87, .08)
    APPLIQUE = material("Eye applique • matte embroidery", .76, .04)
    YARN=crochet_material()
    make_doll()
    make_variants()
    cam = setup_studio(scene, studio, args.samples)
    camera_view(cam, "three-quarter")
    metrics = export(scene, out)
    set_preview_state()
    helper=bpy.data.texts.get("Adult_Variants.py") or bpy.data.texts.new("Adult_Variants.py")
    helper.clear();helper.write((output_directory(None)/"scripts"/"adult_variants.py").read_text())
    for screen in bpy.data.screens:
        for area in screen.areas:
            if area.type == "VIEW_3D":
                area.spaces.active.region_3d.view_perspective = "CAMERA"
                area.spaces.active.shading.type = "MATERIAL"
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
        camera_view(cam,"three-quarter")
        for stance,surface in [("empty","Crochet"),("heart","Velour"),("heart","Crochet")]:
            set_preview_state(stance,surface)
            scene.render.filepath=str(out/"renders/adult"/f"{stance}-{surface.lower()}.png")
            bpy.ops.render.render(write_still=True)
            scene.render.image_settings.file_format="JPEG"
            bpy.data.images["Render Result"].save_render(str(out/"renders/adult"/f"poster-{stance}-{surface.lower()}.jpg"),scene=scene)
            scene.render.image_settings.file_format="PNG"
        set_preview_state()
        for name,position in [("top",(0,-.201,8)),("high",(2,-5,7))]:
            cam.location=position;aim(cam,(0,-.2,2.12));cam.data.ortho_scale=1.75
            scene.render.filepath=str(out/"renders/adult"/f"eyelid-{name}.png")
            bpy.ops.render.render(write_still=True)
        camera_view(cam,"three-quarter");cam.data.ortho_scale=3.25
    print("JAOKOB_OUTPUT " + str(out))
    print("JAOKOB_METRICS " + json.dumps(metrics))


if __name__ == "__main__":
    main()
