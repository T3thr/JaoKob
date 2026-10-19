"""CR-0004 M1D: inspect saved Blender source and upper-sclera ray occlusion.
Run Blender --background model.blend --python this.py; -- --baseline records old defects.
"""
import bpy
import json
import math
import sys
from pathlib import Path
from mathutils import Vector
scene=bpy.data.scenes['JaoKob_Adult_Spike'];bpy.context.window.scene=scene
baseline='--baseline' in sys.argv
body=next(c for c in scene.collection.children if c.name.startswith('DOLL'))
if not baseline:
    assert scene['generator']=='CR-0004-adult-v2'
    empty=next(c for c in scene.collection.children if c.name.startswith('STANCE • Empty'))
    hug=next(c for c in scene.collection.children if c.name.startswith('STANCE • Heart'))
    heart=next(c for c in scene.collection.children if c.name.startswith('ACCESSORY'))
    assert len(body.objects)==38 and len(empty.objects)==8 and len(hug.objects)==8 and len(heart.objects)==1
    assert not empty.hide_render and not empty.hide_viewport
    assert hug.hide_render and hug.hide_viewport and heart.hide_render and heart.hide_viewport
    assert scene['default_stance']=='empty' and scene['default_material']=='Velour'
    assert heart.objects[0]['optional'] and not heart.objects[0]['default_visible']
    assert bpy.data.materials[scene['crochet_material']].use_fake_user
    assert all(obj.data.uv_layers for c in [body,empty,hug,heart] for obj in c.objects)
    for side in ['L','R']:
        hood=body.objects[side+' upper eyelid hood']
        assert hood['occludes_upper_sclera']
        import bmesh
        bm=bmesh.new();bm.from_mesh(hood.data)
        assert all(e.is_manifold for e in bm.edges), 'Eyelid hood must be closed'
        bm.free()
    helper=bpy.data.texts['Adult_Variants.py'].as_string()
    for stance in ['heart','empty']:
        for material in ['Crochet','Velour']:
            source=helper.replace('STANCE = "empty"',f'STANCE = "{stance}"').replace('SURFACE = "Velour"',f'SURFACE = "{material}"')
            exec(compile(source,'Adult_Variants.py','exec'),{})
            assert heart.hide_render == (stance=='empty') and empty.hide_render == (stance=='heart')
            assert body.objects['Head • wide soft cheeks'].data.materials[0].name==scene['crochet_material' if material=='Crochet' else 'velour_material']
    images=[im for im in bpy.data.images if 'childhood-crochet' in im.name]
    assert len(images)==2 and all(im.packed_file and list(im.size)==[128,128] for im in images)
# Cast toward sclera sample points. This checks geometric cover, not a hidden-white material trick.
bpy.context.view_layer.update();depsgraph=bpy.context.evaluated_depsgraph_get()
checks=[]
for elevation in [90,75,60]:
    for azimuth in ([0] if elevation==90 else range(0,360,45)):
        a,e=math.radians(azimuth),math.radians(elevation)
        to_camera=Vector((math.sin(a)*math.cos(e),-math.cos(a)*math.cos(e),math.sin(e)))
        exposed=0;count=0
        for side in ['L','R']:
            white=body.objects[side+' ivory eye applique']
            for vertex in white.data.vertices:
                # All sclera in vertical top view; upper cap only for oblique views.
                if elevation!=90 and vertex.co.z < .07: continue
                point=white.matrix_world@vertex.co
                hit,loc,normal,index,obj,matrix=scene.ray_cast(depsgraph,point+to_camera*5,-to_camera)
                count+=1
                if hit and obj.name==white.name: exposed+=1
        checks.append({'elevationDegrees':elevation,'azimuthDegrees':azimuth,'samples':count,'exposedWhiteHits':exposed})
if baseline: assert checks[0]['exposedWhiteHits']>0
else: assert all(c['exposedWhiteHits']==0 for c in checks), checks
result={'change':'CR-0004-M1D','status':'baseline defect confirmed' if baseline else 'passed','blender':bpy.app.version_string,
 'occlusion':checks,'note':'Oblique rays sample upper sclera only; the lower front-facing white opening and eye glints are intentional. Structural/sampled evidence is accompanied by actual top/high/front renders.'}
# Baseline source may be in /tmp, so derive output from this saved verifier.
out=Path(__file__).resolve().parent.parent/'evidence'/('adult-source-before.json' if baseline else 'adult-source-verification.json')
out.write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result,indent=2))
