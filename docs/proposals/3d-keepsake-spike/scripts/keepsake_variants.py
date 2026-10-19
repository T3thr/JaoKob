"""Standard glTF packaging shared by both isolated keepsake generators."""
import copy
import json
import struct

def add_glb_variants(path, body_name="JaoKob_Childhood_Body", label="Childhood", authority="ADR-P0-025"):
    """Portable glTF scale animation + KHR_materials_variants; no viewer internals.

    STEP keys select complete arm poses, not an anatomical animation rig.
    Zero-scale optional nodes are absent visually even in a generic GLB viewer.
    """
    data=path.read_bytes()
    json_size=struct.unpack_from("<I",data,12)[0]
    doc=json.loads(data[20:20+json_size])
    binary=bytearray(data[28+json_size:])
    yarn=next(i for i,m in enumerate(doc["materials"]) if "crochet yarn" in m["name"])
    velour=copy.deepcopy(doc["materials"][yarn])
    velour["name"]=label+" • velour (default)"
    velour.pop("normalTexture",None)
    velour["pbrMetallicRoughness"].pop("baseColorTexture",None)
    velour["pbrMetallicRoughness"]["roughnessFactor"]=.87
    velour.setdefault("extensions",{})["KHR_materials_sheen"]={"sheenColorFactor":[.08,.08,.08],"sheenRoughnessFactor":.8}
    velour_id=len(doc["materials"])
    doc["materials"].append(velour)
    doc.setdefault("extensionsUsed",[])
    for extension in ["KHR_materials_variants","KHR_materials_sheen"]:
        if extension not in doc["extensionsUsed"]: doc["extensionsUsed"].append(extension)
    doc.setdefault("extensions",{})["KHR_materials_variants"]={"variants":[{"name":"Velour"},{"name":"Crochet"}]}
    for mesh in doc["meshes"]:
        for primitive in mesh["primitives"]:
            if primitive["material"]==yarn:
                primitive["material"]=velour_id
                primitive.setdefault("extensions",{})["KHR_materials_variants"]={"mappings":[
                    {"material":velour_id,"variants":[0]},{"material":yarn,"variants":[1]}]}
    def accessor(values,kind,count,minimum=None,maximum=None):
        binary.extend(b"\0"*((-len(binary))%4))
        offset=len(binary)
        binary.extend(struct.pack("<"+"f"*len(values),*values))
        view=len(doc["bufferViews"])
        doc["bufferViews"].append({"buffer":0,"byteOffset":offset,"byteLength":len(values)*4})
        item={"bufferView":view,"componentType":5126,"count":count,"type":kind}
        if minimum is not None: item.update(min=minimum,max=maximum)
        index=len(doc["accessors"])
        doc["accessors"].append(item)
        return index
    times=accessor([0,1,2],"SCALAR",3,[0],[2])
    animation={"name":"HeartEmote","samplers":[],"channels":[]}
    for index,node in enumerate(doc["nodes"]):
        if node["name"]==body_name: continue
        scale=node.get("scale",[1,1,1])
        empty=node["name"]=="Stance_EmptyHands"
        # Preserve export's .1 scale, including when hidden by the initial pose.
        initial=scale if empty else [0,0,0]
        heart=[0,0,0] if empty else scale
        node["scale"]=initial
        output=accessor(initial+heart+heart,"VEC3",3)
        sampler=len(animation["samplers"])
        animation["samplers"].append({"input":times,"output":output,"interpolation":"STEP"})
        animation["channels"].append({"sampler":sampler,"target":{"node":index,"path":"scale"}})
    doc["animations"]=[animation]
    doc["asset"]["extras"]={"authority":authority,"defaultStance":"empty","defaultMaterial":"Velour"}
    doc["buffers"][0]["byteLength"]=len(binary)
    encoded=json.dumps(doc,separators=(",",":"),ensure_ascii=False).encode()
    encoded+=b" "*((-len(encoded))%4)
    binary.extend(b"\0"*((-len(binary))%4))
    path.write_bytes(struct.pack("<III",0x46546C67,2,28+len(encoded)+len(binary))+
        struct.pack("<II",len(encoded),0x4E4F534A)+encoded+struct.pack("<II",len(binary),0x004E4942)+binary)


def canonicalize_triangle_order(path):
    """Stabilize Blender's index ordering without changing geometry or winding.

    The adult's welded meshes export identical attributes but shuffled triangles.
    All its materials are opaque, so index order has no blending semantics.
    This optional step leaves the established childhood export byte-identical.
    """
    data = bytearray(path.read_bytes())
    json_size = struct.unpack_from("<I", data, 12)[0]
    doc = json.loads(data[20:20 + json_size])
    binary_start = 28 + json_size
    for mesh in doc["meshes"]:
        for primitive in mesh["primitives"]:
            assert primitive.get("mode", 4) == 4
            assert doc["materials"][primitive["material"]].get("alphaMode", "OPAQUE") == "OPAQUE"
            accessor = doc["accessors"][primitive["indices"]]
            view = doc["bufferViews"][accessor["bufferView"]]
            assert "byteStride" not in view and "sparse" not in accessor
            offset = binary_start + view.get("byteOffset", 0) + accessor.get("byteOffset", 0)
            fmt = "<" + {5121: "B", 5123: "H", 5125: "I"}[accessor["componentType"]] * accessor["count"]
            indices = struct.unpack_from(fmt, data, offset)
            triangles = []
            for i in range(0, len(indices), 3):
                t = indices[i:i + 3]
                triangles.append(min(t, t[1:] + t[:1], t[2:] + t[:2]))
            struct.pack_into(fmt, data, offset, *(v for t in sorted(triangles) for v in t))
    path.write_bytes(data)
