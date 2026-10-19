"""ADR-P0-025: empty-handed velour with independent stance/material variants, Blender 5.2.2 LTS.

Run this saved file in Blender Text Editor (Alt+P), or use -- --render.
X right, -Y front, Z up; source unit = 0.1 m. No reference photos embedded.
Only this generator's scene is replaced. Save manual refinements separately.
"""
import argparse
import importlib.util
import json
import math
from pathlib import Path
import sys
import struct

import bpy
import bmesh
from mathutils import Matrix, Vector

P = {
    "body_width": .70, "body_depth": .51, "body_height": 2.12,
    "eye_spacing": .385, "eye_height": 1.88, "eye_radius": .295,
    "lip_width": .54, "heart_width": .59, "heart_height": .91,
    "foot_forward": -1.02, "stitch_size": .09, "normal_strength": .60,
}
COLORS = {"green": (.38,.64,.13), "blue": (.12,.38,.78),
          "white": (.98,.97,.925), "black": (.025,.035,.055),
          "lip": (.96,.30,.22), "crease": (.56,.12,.10), "heart": (.96,.025,.16)}
SCENE_NAME = "JaoKob_Childhood_Spike"
GENERATOR = "ADR-P0-025-childhood-v2"
RENDER_PREVIEWS = False


def source_path():
    source = globals().get("__file__", "")
    if source and Path(source).is_file():
        return Path(source).resolve()
    text = getattr(bpy.context.space_data, "text", None)
    if text and text.filepath:
        return Path(bpy.path.abspath(text.filepath)).resolve()
    raise RuntimeError("Open the saved build_childhood_model.py file in Text Editor first.")


# Reuse the adult's studio only; no adult scene, asset or generator is executed.
SOURCE = source_path()
spec = importlib.util.spec_from_file_location("jaokob_studio", SOURCE.with_name("build_model.py"))
studio_helpers = importlib.util.module_from_spec(spec)
spec.loader.exec_module(studio_helpers)


def arguments():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path, default=SOURCE.parent.parent)
    parser.add_argument("--render", action="store_true")
    parser.add_argument("--samples", type=int, default=48)
    return parser.parse_args(sys.argv[sys.argv.index("--")+1:] if "--" in sys.argv else [])


def make_scene():
    old = bpy.data.scenes.get(SCENE_NAME)
    if old:
        if old.get("generator") not in (GENERATOR, "CR-0004-childhood-v1"):
            raise RuntimeError("A non-generated scene has this name; rename it first.")
        # Avoid unlinking an object shared with a manually created scene.
        for obj in list(old.objects):
            if len(obj.users_scene) == 1:
                bpy.data.objects.remove(obj, do_unlink=True)
        bpy.data.scenes.remove(old)
    scene = bpy.data.scenes.new(SCENE_NAME)
    scene["generator"] = GENERATOR
    bpy.context.window.scene = scene
    scene.unit_settings.system, scene.unit_settings.scale_length = "METRIC", .1
    collections = [bpy.data.collections.new(name) for name in (
        "CHILDHOOD • editable body", "ACCESSORY • RedHeart • optional",
        "STANCE • EmptyHands", "STANCE • HeartEmote", "STUDIO • excluded from GLB")]
    for collection in collections:
        scene.collection.children.link(collection)
    return scene, *collections


def crochet_normal(out):
    """Authored seamless stitch relief: interlocking bent yarn, not photo data.

    A tile contains two offset stitch rows. Tangent-space +Y normal image works
    in Blender and glTF; mesh UVs control physical stitch density per part.
    """
    n = 128
    heights = []
    for j in range(n):
        y = 2*j/n
        row = math.floor(y)
        v = y-row
        for i in range(n):
            u = (i/n + row*.5) % 1
            # Two rounded, slightly leaning yarn loops, separated into rows.
            # Unlike straight crossing lines, these read as short soft stitches.
            strand = 0
            for cx,tilt in [(.31,-.34),(.69,.34)]:
                dx,dy=u-cx,v-.52
                across=dx*math.cos(tilt)-dy*math.sin(tilt)
                along=dx*math.sin(tilt)+dy*math.cos(tilt)
                strand=max(strand,math.exp(-((across/.145)**2+(along/.33)**2)))
            chain=.32*math.exp(-((v-.08)/.075)**2)*( .7+.3*math.cos(2*math.pi*u)**2)
            twist=.97+.03*math.sin(2*math.pi*(v*6+u*4))
            heights.append(min(1,strand+chain)*twist)
    pixels, colors = [], []
    for j in range(n):
        for i in range(n):
            dx = (heights[j*n+(i+1)%n]-heights[j*n+(i-1)%n])*n*.05
            dy = (heights[((j+1)%n)*n+i]-heights[((j-1)%n)*n+i])*n*.05
            normal = Vector((-dx, -dy, 1)).normalized()
            pixels.extend((normal.x*.5+.5, normal.y*.5+.5, normal.z*.5+.5, 1))
            value = .82 + .18*heights[j*n+i]
            colors.extend((value,value,value,1))
    image = bpy.data.images.new("Childhood_Crochet_Normal", width=n, height=n, alpha=False)
    image.colorspace_settings.name = "Non-Color"
    image.pixels.foreach_set(pixels)
    image.filepath_raw = str(out/"textures"/"childhood-crochet-normal.png")
    image.file_format = "PNG"
    image.save()
    image.pack()
    color = bpy.data.images.new("Childhood_Crochet_Color", width=n, height=n, alpha=False)
    color.pixels.foreach_set(colors)
    color.filepath_raw = str(out/"textures"/"childhood-crochet-color.png")
    color.file_format = "PNG"
    color.save()
    color.pack()
    return image, color


def material(name, normal=None, roughness=.92):
    # Plain rough PBR keeps the yarn matte in both Cycles and model-viewer.
    mat = studio_helpers.material(name, roughness, 0)
    if normal:
        normal, color = normal
        nodes, links = mat.node_tree.nodes, mat.node_tree.links
        texture = nodes.new("ShaderNodeTexImage")
        texture.image, texture.extension = normal, "REPEAT"
        node = nodes.new("ShaderNodeNormalMap")
        node.inputs["Strength"].default_value = P["normal_strength"]
        links.new(texture.outputs["Color"], node.inputs["Color"])
        links.new(node.outputs["Normal"], nodes["Principled BSDF"].inputs["Normal"])
        color_texture = nodes.new("ShaderNodeTexImage")
        color_texture.image, color_texture.extension = color, "REPEAT"
        mix = nodes.new("ShaderNodeMix")
        mix.data_type = "RGBA"
        mix.blend_type = "MULTIPLY"
        mix.inputs[0].default_value = 1
        vertex = next(n for n in nodes if n.type == "VERTEX_COLOR")
        links.new(vertex.outputs["Color"], mix.inputs[6])
        links.new(color_texture.outputs["Color"], mix.inputs[7])
        links.new(mix.outputs[2], nodes["Principled BSDF"].inputs["Base Color"])
    return mat


def mesh_object(name, verts, faces, uvs, color, collection=None, mat=None):
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    (collection if collection is not None else BODY).objects.link(obj)
    mesh.materials.append(mat or YARN)
    rgba = (*studio_helpers.linear(COLORS[color]), 1)
    attribute = mesh.color_attributes.new(name="Color", type="BYTE_COLOR", domain="CORNER")
    uv_layer = mesh.uv_layers.new(name="UVMap")
    for face in mesh.polygons:
        face.use_smooth = True
        for index in face.loop_indices:
            attribute.data[index].color = rgba
            uv_layer.data[index].uv = uvs[mesh.loops[index].vertex_index]
    mesh.color_attributes.active_color = attribute
    # Join coincident seam/pole positions while retaining per-loop UV seams.
    # Continuous vertex normals prevent a bright stripe on smooth velour.
    bm = bmesh.new()
    bm.from_mesh(mesh)
    bmesh.ops.remove_doubles(bm, verts=list(bm.verts), dist=0.000001)
    bm.to_mesh(mesh)
    bm.free()
    mesh.update()
    obj["part"] = name
    return obj


def surface(name, position, color="green", segments=40, rings=24, repeats=(20,12), mat=None):
    """Latitude surface with a UV seam and triangle fans at the poles."""
    segments = max(12, round(segments*.8/2)*2)
    rings = max(8, round(rings*.8))
    verts, uvs, faces = [], [], []
    for i in range(rings+1):
        for j in range(segments+1):
            v, u = i/rings, j/segments
            verts.append(position(math.pi*v, 2*math.pi*u))
            uvs.append((u*repeats[0], (1-v)*repeats[1]/2))
    for i in range(rings):
        for j in range(segments):
            a = i*(segments+1)+j
            if i == 0:
                faces.append((a, a+segments+1, a+segments+2))
            elif i == rings-1:
                faces.append((a, a+segments+1, a+1))
            else:
                faces.append((a, a+segments+1, a+segments+2, a+1))
    return mesh_object(name, verts, faces, uvs, color, mat=mat)


def ellipsoid(name, center, scale, color="green", segments=24, rings=14, mat=None):
    cx, cy, cz = center
    rx, ry, rz = scale
    return surface(name, lambda t,p:(cx+rx*math.sin(t)*math.cos(p),cy+ry*math.sin(t)*math.sin(p),cz+rz*math.cos(t)),
                   color, segments, rings, (max(4,2*math.pi*max(rx,ry)/P["stitch_size"]), max(3,math.pi*rz/P["stitch_size"])), mat)


def tube(name, points, radii, color="green", sides=12, mat=None):
    sides = max(6, round(sides*.8/2)*2)
    points = [Vector(p) for p in points]
    verts, uvs, faces = [], [], []
    distance = 0
    previous_u = None
    for i, point in enumerate(points):
        if i: distance += (point-points[i-1]).length
        tangent = (points[min(i+1,len(points)-1)]-points[max(0,i-1)]).normalized()
        if previous_u is None:
            ref = Vector((0,1,0))
            if abs(tangent.dot(ref))>.95: ref = Vector((1,0,0))
            u = tangent.cross(ref).normalized()
        else:
            # Parallel transport prevents sudden frame flips at bent elbows.
            u = (previous_u-tangent*previous_u.dot(tangent)).normalized()
        previous_u = u
        v = tangent.cross(u).normalized()
        for j in range(sides+1):
            angle = 2*math.pi*j/sides
            verts.append(point+radii[i]*(math.cos(angle)*u+math.sin(angle)*v))
            uvs.append((j/sides*2*math.pi*max(radii)/P["stitch_size"], distance/P["stitch_size"]/2))
    for i in range(len(points)-1):
        for j in range(sides):
            a = i*(sides+1)+j
            faces.append((a,a+1,a+sides+2,a+sides+1))
    faces.extend([tuple(reversed(range(sides))),tuple((len(points)-1)*(sides+1)+j for j in range(sides))])
    return mesh_object(name, verts, faces, uvs, color, mat=mat)


def limb(name, controls, width, color="green", steps=16, sides=14):
    points = studio_helpers.bezier(controls, steps)
    return tube(name, points, [width*(.84+.16*math.sin(math.pi*i/(steps-1))) for i in range(steps)],color,sides)


def body_surface(t,p):
    radial = math.sin(t)**.58
    x, y = P["body_width"]*radial*math.cos(p), P["body_depth"]*radial*math.sin(p)
    z = .035+P["body_height"]*(1+math.copysign(abs(math.cos(t))**.72, math.cos(t)))/2
    # Continuous head with paired crown humps, never a neck/head seam.
    z += .16*math.exp(-((abs(x)-.39)/.23)**2)*max(0,(math.cos(t)-.45)/.55)
    return x,y,z


def make_body():
    surface("Body_ContinuousPill", body_surface, segments=40, rings=32, repeats=(44,30))
    # A thin sweater sleeve around the same capsule, not a second torso/head.
    verts, faces, uvs = [], [], []
    band_segments = 32
    for k in range(6):
        z = .55+k*.13
        # Body's superellipse section, enlarged by the yarn garment thickness.
        c = (2*(z-.035)/P["body_height"]-1)
        theta = math.acos(math.copysign(abs(c)**(1/.72),c))
        rx,ry = P["body_width"]*math.sin(theta)**.58+.017,P["body_depth"]*math.sin(theta)**.58+.017
        for j in range(band_segments+1):
            angle = 2*math.pi*j/band_segments
            verts.append((rx*math.cos(angle),ry*math.sin(angle),z))
            uvs.append((j/band_segments*44,z/P["stitch_size"]/2))
    for k in range(5):
        for j in range(band_segments):
            a=k*(band_segments+1)+j
            faces.append((a,a+1,a+band_segments+2,a+band_segments+1))
    mesh_object("Sweater_BlueWrapBand",verts,faces,uvs,"blue")
    for side,s in [("L",-1),("R",1)]:
        limb(side+"_ShortSleeve",[(s*.63,0,1.08),(s*.73,-.005,1.08),(s*.83,-.03,1.00),(s*.85,-.08,.94)],.164,"blue",steps=10)
        # Author two mutually exclusive arm stances; neither is baked into the torso.
        before=set(BODY.objects)
        limb(side+"_RestingArm",[(s*.85,-.08,.94),(s*.90,-.23,.73),(s*.83,-.44,.45),(s*.83,-.56,.34)],.103)
        ellipsoid(side+"_RestingPalm",(s*.83,-.59,.30),(.14,.13,.105),segments=20,rings=12)
        for digit in range(3):
            ellipsoid(f"{side}_RestingFinger_{digit+1}",(s*(.73+.095*digit),-.67-(1-abs(digit-1))*.025,.24),(.060,.105,.065),segments=12,rings=8)
        for obj in sorted(set(BODY.objects)-before, key=lambda part: part.name):
            BODY.objects.unlink(obj)
            EMPTY.objects.link(obj)
        before=set(BODY.objects)
        limb(side+"_HuggingArm",[(s*.85,-.08,.94),(s*1.0,-.35,.80),(s*.80,-.76,.78),(s*.48,-.99,.73)],.103)
        ellipsoid(side+"_Palm",(s*.49,-.99,.74),(.155,.11,.15),segments=20,rings=12)
        for digit in range(3):
            x=s*(.36+.095*digit)
            ellipsoid(f"{side}_Finger_{digit+1}",(x,-1.055,.80+(1-abs(digit-1))*.035),(.062,.085,.135),segments=12,rings=8)
        for obj in sorted(set(BODY.objects)-before, key=lambda part: part.name):
            BODY.objects.unlink(obj)
            HUG.objects.link(obj)
        limb(side+"_SeatedLeg",[(s*.43,-.22,.29),(s*.54,-.48,.19),(s*.60,-.72,.15),(s*.66,P["foot_forward"]+.13,.16)],.115)
        foot = ellipsoid(side+"_FootPalm",(s*.69,P["foot_forward"],.20),(.21,.16,.15),segments=24,rings=12)
        for digit in range(3):
            x=s*(.53+.155*digit)
            ellipsoid(f"{side}_Toe_{digit+1}",(x,P["foot_forward"]-.07,.30+(1-abs(digit-1))*.045),(.075,.102,.145),segments=14,rings=8)
        x,z=s*P["eye_spacing"],P["eye_height"]
        ellipsoid(side+"_EyeCushion",(x,-.36,z+.07),(.35,.235,.36),segments=24,rings=14)
        ellipsoid(side+"_WhiteCrochetEyeRing",(x,-.549,z), (P["eye_radius"],.12,P["eye_radius"]),"white",segments=28,rings=16)
        ellipsoid(side+"_LargeBlackPupil",(x,-.65,z),(.232,.075,.235),"black",segments=28,rings=16,mat=EYES)
        ellipsoid(side+"_Highlight_UpperLarge",(x-.073,-.716,z+.085),(.061,.017,.065),"white",segments=16,rings=10,mat=EYES)
        ellipsoid(side+"_Highlight_LowerSmall",(x+.073,-.718,z-.086),(.032,.014,.035),"white",segments=12,rings=8,mat=EYES)
    for label,dz in [("Upper",.033),("Lower",-.033)]:
        points=[(P["lip_width"]*t,-.56+.13*t*t,1.421+.095*t*t+dz) for t in (-1+2*i/32 for i in range(33))]
        radii=[.046*(.6+.4*math.sin(math.pi*i/32)**.4) for i in range(33)]
        tube("Smile_"+label,points,radii,"lip",sides=10)
    points=[(P["lip_width"]*.96*t,-.605+.13*t*t,1.421+.095*t*t) for t in (-1+2*i/32 for i in range(33))]
    tube("Smile_Crease",points,[.006]*33,"crease",sides=6)
    for s in [-1,1]: ellipsoid("Smile_Corner_"+str(s),(s*P["lip_width"],-.43,1.516),(.036,.048,.069),"lip",segments=16,rings=10)


def make_heart():
    # One puffy mesh from nested heart contours, separate from the doll.
    n = 34
    verts, faces, uvs = [], [], []
    def point(t):
        return math.sin(t)**3, (13*math.cos(t)-5*math.cos(2*t)-2*math.cos(3*t)-math.cos(4*t)+2)/29
    # Front pole -> front bulge -> seam -> rear bulge -> rear pole.
    for k in range(13):
        a = math.pi*k/12
        r = max(.00001, math.sin(a))
        for j in range(n+1):
            t=2*math.pi*j/n
            x,z=point(t)
            vx,vy,vz=P["heart_width"]*x*r,-.91-.23*math.cos(a),.70+P["heart_height"]*z*r
            verts.append((vx,vy,vz))
            uvs.append((vx/P["stitch_size"],vz/P["stitch_size"]/2))
    for k in range(12):
        for j in range(n):
            a=k*(n+1)+j
            faces.append((a,a+1,a+n+2,a+n+1))
    obj=mesh_object("RedHeart_EditableMesh",verts,faces,uvs,"heart",HEART)
    obj["accessory_id"]="red-heart"
    obj["optional"]=True
    obj["default_visible"]=False
    return obj


def camera_view(cam,view):
    cam.location={"front":(0,-8,3),"side":(8,0,2.7),"back":(0,8,2.7),"three-quarter":(4,-7,3.5)}[view]
    studio_helpers.aim(cam,(0,-.20,1.20))
    cam.data.ortho_scale=3.20


def export(scene,out):
    temporary=bpy.data.scenes.new("JaoKob_Childhood_Export")
    bpy.context.window.scene=temporary
    for collection,name in [(BODY,"JaoKob_Childhood_Body"),(EMPTY,"Stance_EmptyHands"),(HUG,"Stance_HeartEmote"),(HEART,"Accessory_RedHeart")]:
        bpy.ops.object.select_all(action="DESELECT")
        copies=[]
        for obj in sorted(collection.objects, key=lambda part: part.name):
            copy=obj.copy()
            copy.data=obj.data.copy()
            copy.hide_render=False
            copy.hide_viewport=False
            copy.matrix_world=Matrix.Scale(.1,4)@obj.matrix_world
            temporary.collection.objects.link(copy)
            copies.append(copy)
        bpy.context.view_layer.update()
        for obj in copies: obj.select_set(True)
        bpy.context.view_layer.objects.active=copies[0]
        if len(copies)>1: bpy.ops.object.join()
        merged=bpy.context.object
        merged.name=name
        merged.data.name=name+"_Mesh"
        modifier=merged.modifiers.new("Triangulate export for portable tangent space","TRIANGULATE")
        bpy.ops.object.modifier_apply(modifier=modifier.name)
        # Keep only explicit, stable accessory metadata in exported extras.
        for key in list(merged.keys()): del merged[key]
        merged["asset_part"]="optional-heart" if collection==HEART else "body"
        if collection==HEART: merged["default_visible"]=False
    bpy.ops.object.select_all(action="SELECT")
    destination=out/"model"/"jaokob-childhood-crochet.glb"
    bpy.ops.export_scene.gltf(filepath=str(destination),export_format="GLB",use_selection=True,use_active_scene=True,
        export_yup=True,export_apply=True,export_animations=False,export_cameras=False,export_lights=False,
        export_extras=True,export_texcoords=True,export_tangents=True)
    add_glb_variants(destination)
    bpy.context.window.scene=scene
    for obj in list(temporary.objects): bpy.data.objects.remove(obj,do_unlink=True)
    bpy.data.scenes.remove(temporary)
    triangles=0
    for obj in list(BODY.objects)+list(EMPTY.objects)+list(HUG.objects)+list(HEART.objects):
        obj.data.calc_loop_triangles()
        triangles+=len(obj.data.loop_triangles)
    metrics={"change":"ADR-P0-025","milestone":"1C","generator":GENERATOR,"blender":bpy.app.version_string,
        "bodyParts":len(BODY.objects),"emptyArmParts":len(EMPTY.objects),"heartArmParts":len(HUG.objects),"accessoryParts":len(HEART.objects),"sourceTriangles":triangles,
        "glbBytes":destination.stat().st_size,"byteBudget":2000000,"triangleBudget":25000,
        "withinBudget":triangles<=25000 and destination.stat().st_size<=2000000,
        "nodeNames":["JaoKob_Childhood_Body","Stance_EmptyHands","Stance_HeartEmote","Accessory_RedHeart"],
        "defaultStance":"empty","defaultMaterial":"Velour","materialVariants":["Velour","Crochet"],
        "stanceAnimation":{"name":"HeartEmote","emptyTime":0,"heartTime":1},"allStoredTriangles":triangles,"normalTexture":[128,128],
        "references":["front","side","back"],"referencePhotosEmbedded":False,"parameters":P}
    data=destination.read_bytes()
    document=json.loads(data[20:20+struct.unpack_from("<I",data,12)[0]])
    counts={node["name"]:sum(document["accessors"][primitive["indices"]]["count"]//3
        for primitive in document["meshes"][node["mesh"]]["primitives"]) for node in document["nodes"]}
    metrics.update(trianglesByNode=counts,
        defaultVisibleTriangles=counts["JaoKob_Childhood_Body"]+counts["Stance_EmptyHands"],
        heartVisibleTriangles=counts["JaoKob_Childhood_Body"]+counts["Stance_HeartEmote"]+counts["Accessory_RedHeart"],
        adultGreenSRGB=list(COLORS["green"]))
    (out/"evidence"/"childhood-model-metrics.json").write_text(json.dumps(metrics,indent=2)+"\n")
    if not metrics["withinBudget"]: raise RuntimeError("Childhood export exceeds milestone budget")
    return metrics


def add_glb_variants(path):
    # Keep the childhood export contract and serialized bytes unchanged.
    module_spec=importlib.util.spec_from_file_location("keepsake_variants", SOURCE.with_name("keepsake_variants.py"))
    module=importlib.util.module_from_spec(module_spec)
    module_spec.loader.exec_module(module)
    module.add_glb_variants(path)


def set_preview_state(stance="empty", surface="Velour"):
    """Source equivalent of viewer state; hidden collections preserve editable parts."""
    for collection,visible in [(EMPTY,stance=="empty"),(HUG,stance=="heart"),(HEART,stance=="heart")]:
        collection.hide_render=not visible
        collection.hide_viewport=not visible
    for collection in [BODY,EMPTY,HUG,HEART]:
        for obj in collection.objects:
            if obj.data.materials[0] != EYES:
                obj.data.materials[0]=VELOUR if surface=="Velour" else YARN
    bpy.context.scene["default_stance"]="empty"
    bpy.context.scene["default_material"]="Velour"
    bpy.context.scene["velour_material"]=VELOUR.name
    bpy.context.scene["crochet_material"]=YARN.name


def main():
    global BODY,HEART,EMPTY,HUG,YARN,EYES,VELOUR
    args=arguments()
    out=args.output.resolve()
    for directory in ["model","textures","renders/childhood","evidence"]: (out/directory).mkdir(parents=True,exist_ok=True)
    scene,BODY,HEART,EMPTY,HUG,studio=make_scene()
    YARN=material("Childhood • crochet yarn",crochet_normal(out))
    YARN.use_fake_user=True
    VELOUR=studio_helpers.material("Childhood • velour (default)",.87,.08)
    EYES=material("Childhood • sparkling eye applique",roughness=.36)
    make_body()
    make_heart()
    cam=studio_helpers.setup_studio(scene,studio,args.samples)
    camera_view(cam,"three-quarter")
    metrics=export(scene,out)
    set_preview_state()
    helper=bpy.data.texts.get("Childhood_Variants.py") or bpy.data.texts.new("Childhood_Variants.py")
    helper.clear()
    helper.write(SOURCE.with_name("childhood_variants.py").read_text())
    for screen in bpy.data.screens:
        for area in screen.areas:
            if area.type=="VIEW_3D":
                area.spaces.active.region_3d.view_perspective="CAMERA"
                area.spaces.active.shading.type="MATERIAL"
    bpy.ops.wm.save_as_mainfile(filepath=str(out/"model"/"jaokob-childhood-crochet.blend"),copy=True)
    if args.render or RENDER_PREVIEWS:
        for view in ["three-quarter","front","side","back"]:
            camera_view(cam,view)
            scene.render.filepath=str(out/"renders"/"childhood"/(view+".png"))
            bpy.ops.render.render(write_still=True)
            if view=="three-quarter":
                scene.render.image_settings.file_format="JPEG"
                scene.render.image_settings.quality=85
                bpy.data.images["Render Result"].save_render(str(out/"renders"/"childhood"/"poster.jpg"),scene=scene)
                scene.render.image_settings.file_format="PNG"
        camera_view(cam,"three-quarter")
        for stance in ["empty","heart"]:
            for surface in ["Velour","Crochet"]:
                if stance=="empty" and surface=="Velour": continue
                set_preview_state(stance,surface)
                scene.render.filepath=str(out/"renders"/"childhood"/f"{stance}-{surface.lower()}.png")
                bpy.ops.render.render(write_still=True)
                scene.render.image_settings.file_format="JPEG"
                bpy.data.images["Render Result"].save_render(str(out/"renders"/"childhood"/f"poster-{stance}-{surface.lower()}.jpg"),scene=scene)
                scene.render.image_settings.file_format="PNG"
        set_preview_state()
    print("JAOKOB_CHILDHOOD_METRICS "+json.dumps(metrics))


if __name__=="__main__": main()
