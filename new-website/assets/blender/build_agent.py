"""
Pip - the portfolio's toy "agent" character, modelled procedurally in Blender and exported to glTF.

Run headless (no network, no add-ons):
    "C:/Program Files/Blender Foundation/Blender 5.1/blender.exe" --background --factory-startup \
        --python assets/blender/build_agent.py

Output: public/models/agent.glb  (named nodes the web scene animates:
        agent, head, eye_L, eye_R, arm_L, arm_R, antenna, jet)

Style: chunky, glossy, bevelled primitives that match the swarm's toy language. Colours are the site palette.
"""
import math
import os
import bpy
import bmesh
from mathutils import Vector

OUT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'public', 'models', 'agent.glb'))
os.makedirs(os.path.dirname(OUT), exist_ok=True)

# ───────── clean scene ─────────
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene


def hex_rgba(h):
    h = h.lstrip('#')
    r, g, b = (int(h[i:i + 2], 16) / 255 for i in (0, 2, 4))
    # Blender expects linear colour for base colour values
    lin = lambda c: ((c + 0.055) / 1.055) ** 2.4 if c > 0.04045 else c / 12.92
    return (lin(r), lin(g), lin(b), 1.0)


def material(name, color, rough=0.25, metal=0.0, coat=0.0, emit=None, emit_strength=0.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    bsdf = m.node_tree.nodes['Principled BSDF']
    bsdf.inputs['Base Color'].default_value = hex_rgba(color)
    bsdf.inputs['Roughness'].default_value = rough
    bsdf.inputs['Metallic'].default_value = metal
    if coat:
        bsdf.inputs['Coat Weight'].default_value = coat
        bsdf.inputs['Coat Roughness'].default_value = 0.05
    if emit:
        bsdf.inputs['Emission Color'].default_value = hex_rgba(emit)
        bsdf.inputs['Emission Strength'].default_value = emit_strength
    return m


M = {
    'coral': material('coral', '#FF4F3D', 0.22, 0.0, 1.0),
    'cream': material('cream', '#F5F1E8', 0.28, 0.0, 0.8),
    'navy': material('navy', '#14141F', 0.08, 0.0, 1.0),
    'blue': material('blue', '#2433FF', 0.2, 0.0, 1.0),
    'yellow': material('yellow', '#FFD21F', 0.24, 0.0, 1.0),
    'lime': material('lime', '#D4FF1F', 0.3, 0.0, 0.0, emit='#D4FF1F', emit_strength=2.5),
    'mint': material('mint', '#3DF2B0', 0.3, 0.0, 0.0, emit='#3DF2B0', emit_strength=2.0),
    'chrome': material('chrome', '#F3F5FF', 0.08, 1.0),
}


# ───────── helpers ─────────
def new_obj(name, pivot=(0, 0, 0), parent=None):
    """Empty-mesh object whose origin is the animation pivot; geometry is built in pivot-local space."""
    mesh = bpy.data.meshes.new(name)
    obj = bpy.data.objects.new(name, mesh)
    scene.collection.objects.link(obj)
    obj.location = pivot
    if parent:
        obj.parent = parent
        obj.matrix_parent_inverse = parent.matrix_world.inverted()
        obj.location = Vector(pivot) - parent.location
    return obj


def build(obj, parts):
    """parts: list of dicts → baked into one mesh with per-part material slots."""
    bm = bmesh.new()
    slots = []
    for p in parts:
        mat = p['mat']
        if mat not in slots:
            slots.append(mat)
        idx = slots.index(mat)
        sub = bmesh.new()
        kind = p['kind']
        if kind == 'cube':
            bmesh.ops.create_cube(sub, size=1.0)
        elif kind == 'sphere':
            bmesh.ops.create_uvsphere(sub, u_segments=p.get('u', 28), v_segments=p.get('v', 16), radius=0.5)
        elif kind == 'cyl':
            bmesh.ops.create_cone(sub, cap_ends=True, segments=p.get('u', 28), radius1=0.5, radius2=p.get('r2', 0.5), depth=1.0)
        sx, sy, sz = p.get('scale', (1, 1, 1))
        for v in sub.verts:
            v.co.x *= sx; v.co.y *= sy; v.co.z *= sz
        if p.get('bevel'):
            bmesh.ops.bevel(sub, geom=list(sub.edges), offset=p['bevel'], segments=p.get('seg', 6), affect='EDGES', profile=0.5)
        rx, ry, rz = p.get('rot', (0, 0, 0))
        from mathutils import Euler
        rotm = Euler((rx, ry, rz), 'XYZ').to_matrix().to_4x4()
        loc = Vector(p.get('loc', (0, 0, 0)))
        for v in sub.verts:
            v.co = rotm @ v.co + loc
        for f in sub.faces:
            f.material_index = idx
            f.smooth = True
        tmp = bpy.data.meshes.new('tmp')
        sub.to_mesh(tmp)
        sub.free()
        bm.from_mesh(tmp)
        bpy.data.meshes.remove(tmp)
    # mesh.from_mesh drops material indices on append in some versions → re-assign by face order
    bm.to_mesh(obj.data)
    bm.free()
    for mat in slots:
        obj.data.materials.append(M[mat])
    return slots


def finish_materials(obj, parts):
    """Re-assign material indices by part order (bm.from_mesh append keeps them, but be explicit)."""
    me = obj.data
    slots = []
    for p in parts:
        if p['mat'] not in slots:
            slots.append(p['mat'])
    # count faces per part by regenerating counts
    counts = []
    for p in parts:
        sub = bmesh.new()
        kind = p['kind']
        if kind == 'cube':
            bmesh.ops.create_cube(sub, size=1.0)
        elif kind == 'sphere':
            bmesh.ops.create_uvsphere(sub, u_segments=p.get('u', 28), v_segments=p.get('v', 16), radius=0.5)
        elif kind == 'cyl':
            bmesh.ops.create_cone(sub, cap_ends=True, segments=p.get('u', 28), radius1=0.5, radius2=p.get('r2', 0.5), depth=1.0)
        if p.get('bevel'):
            bmesh.ops.bevel(sub, geom=list(sub.edges), offset=p['bevel'], segments=p.get('seg', 6), affect='EDGES', profile=0.5)
        counts.append(len(sub.faces))
        sub.free()
    i = 0
    for p, c in zip(parts, counts):
        idx = slots.index(p['mat'])
        for k in range(i, i + c):
            me.polygons[k].material_index = idx
        i += c
    for poly in me.polygons:
        poly.use_smooth = True


def make(name, pivot, parts, parent=None):
    obj = new_obj(name, pivot, parent)
    build(obj, parts)
    finish_materials(obj, parts)
    return obj


# ───────── the character (Z up in Blender; exported Y up) ─────────
root = bpy.data.objects.new('agent', None)
scene.collection.objects.link(root)

# torso: chunky rounded capsule-ish body with a chest screen
torso = make('torso', (0, 0, 0.0), [
    dict(kind='cube', mat='coral', scale=(1.05, 0.86, 1.0), loc=(0, 0, 0.55), bevel=0.3, seg=6),
    dict(kind='cyl', mat='cream', scale=(0.5, 0.5, 0.12), loc=(0, -0.43, 0.62), rot=(math.pi / 2, 0, 0), bevel=0.04, seg=4),
    dict(kind='cyl', mat='lime', scale=(0.36, 0.36, 0.06), loc=(0, -0.5, 0.62), rot=(math.pi / 2, 0, 0)),
    dict(kind='cyl', mat='navy', scale=(0.92, 0.7, 0.16), loc=(0, 0, 0.0), bevel=0.05, seg=4),
], parent=root)

# thruster ring + nozzle under the body (it hovers instead of walking)
jet = make('jet', (0, 0, -0.18), [
    dict(kind='cyl', mat='navy', scale=(0.62, 0.62, 0.2), loc=(0, 0, 0), bevel=0.05, seg=4, r2=0.38),
    dict(kind='cyl', mat='mint', scale=(0.5, 0.5, 0.05), loc=(0, 0, -0.12), r2=0.5),
], parent=root)

# head (pivot at the neck so it can nod / turn)
head = make('head', (0, 0, 1.15), [
    dict(kind='cube', mat='cream', scale=(1.34, 1.05, 0.98), loc=(0, 0, 0.55), bevel=0.34, seg=6),
    dict(kind='cube', mat='navy', scale=(1.05, 0.12, 0.7), loc=(0, -0.5, 0.58), bevel=0.05, seg=4),   # visor
    dict(kind='cyl', mat='yellow', scale=(0.34, 0.34, 0.2), loc=(-0.72, 0, 0.55), rot=(0, math.pi / 2, 0), bevel=0.04, seg=4),  # ear caps
    dict(kind='cyl', mat='yellow', scale=(0.34, 0.34, 0.2), loc=(0.72, 0, 0.55), rot=(0, math.pi / 2, 0), bevel=0.04, seg=4),
    dict(kind='cyl', mat='chrome', scale=(0.05, 0.05, 0.4), loc=(0, 0, 1.18)),                           # antenna stalk
], parent=root)

# eyes (separate nodes so we can blink them): glossy emissive capsules on the visor
eye_L = make('eye_L', (-0.24, -0.58, 1.72), [
    dict(kind='cyl', mat='lime', scale=(0.16, 0.16, 0.26), rot=(0, 0, 0), bevel=0.06, seg=5, u=24),
], parent=root)
eye_R = make('eye_R', (0.24, -0.58, 1.72), [
    dict(kind='cyl', mat='lime', scale=(0.16, 0.16, 0.26), rot=(0, 0, 0), bevel=0.06, seg=5, u=24),
], parent=root)

# antenna ball
antenna = make('antenna', (0, 0, 2.32), [
    dict(kind='sphere', mat='blue', scale=(0.26, 0.26, 0.26), loc=(0, 0, 0.18)),
    dict(kind='cyl', mat='chrome', scale=(0.05, 0.05, 0.18), loc=(0, 0, 0.0)),
], parent=root)

# arms: shoulder pivots, chunky capsule arm + round hand
def arm(name, side):
    x = 0.64 * side
    return make(name, (x, 0, 0.98), [
        dict(kind='sphere', mat='navy', scale=(0.3, 0.3, 0.3), loc=(0.0, 0, 0)),
        dict(kind='cyl', mat='cream', scale=(0.2, 0.2, 0.6), loc=(0.16 * side, 0, -0.34), rot=(0, 0.28 * -side, 0), bevel=0.06, seg=5, u=28),
        dict(kind='sphere', mat='yellow', scale=(0.34, 0.34, 0.34), loc=(0.26 * side, 0, -0.7)),
    ], parent=root)


arm_L = arm('arm_L', -1)
arm_R = arm('arm_R', 1)

# parent the loose nodes under the head so they follow it (update first so matrix_world is current)
bpy.context.view_layer.update()
for o in (eye_L, eye_R, antenna):
    mw = o.matrix_world.copy()
    o.parent = head
    o.matrix_world = mw

bpy.context.view_layer.update()

# ───────── export ─────────
bpy.ops.object.select_all(action='SELECT')
bpy.ops.export_scene.gltf(
    filepath=OUT,
    export_format='GLB',
    use_selection=True,
    export_apply=True,
    export_yup=True,
    export_materials='EXPORT',
    export_cameras=False,
    export_lights=False,
    export_animations=False,
    export_draco_mesh_compression_enable=False,
)
tris = sum(len(o.data.polygons) for o in bpy.data.objects if o.type == 'MESH')
print(f'EXPORTED {OUT}  ({os.path.getsize(OUT)/1024:.0f} KB, ~{tris} polygons)')
