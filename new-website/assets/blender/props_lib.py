"""
Tiny modelling library for the portfolio props (Blender 5.x, headless).

Everything is built with bmesh (no bpy.ops, no selection state) into named PART GROUPS. Each group becomes one glTF
node with its own pivot, so the web scene can assemble the object part by part as you scroll and animate parts by
name prefix (spin_, roll_, bob_, pulse_, swing_, slide_, orbit_).

Coordinate rules (Blender is Z-up, the glTF export converts to Y-up):
  * world frame: x right, y into the screen, z up. The camera looks at the model from -Y (the front).
  * `with front():` switches to a billboard frame: x right, y UP the screen, z TOWARD the viewer. Use it for signs,
    phones, boards, hearts and anything that should face the camera.
"""
import math
import os
from contextlib import contextmanager

import bmesh
import bpy
from mathutils import Euler, Matrix, Vector, noise

PI = math.pi
V = Vector


def _lin(c):
    return ((c + 0.055) / 1.055) ** 2.4 if c > 0.04045 else c / 12.92


def _rgba(h, a=1.0):
    h = h.lstrip('#')
    r, g, b = (int(h[i:i + 2], 16) / 255 for i in (0, 2, 4))
    return (_lin(r), _lin(g), _lin(b), a)


# name: (hex, roughness, metallic, coat, emission_hex, emission_strength, alpha)
PALETTE = {
    'coral': ('#FF4F3D', 0.22, 0.0, 1.0),
    'cream': ('#F5F1E8', 0.3, 0.0, 0.8),
    'white': ('#FFFFFF', 0.3, 0.0, 0.6),
    'navy': ('#14141F', 0.12, 0.0, 1.0),
    'blue': ('#2433FF', 0.2, 0.0, 1.0),
    'yellow': ('#FFD21F', 0.24, 0.0, 1.0),
    'orange': ('#FF8A1F', 0.24, 0.0, 1.0),
    'pink': ('#FF6FB5', 0.22, 0.0, 1.0),
    'mint': ('#3DF2B0', 0.25, 0.0, 0.8),
    'lilac': ('#B9A6FF', 0.25, 0.0, 1.0),
    'sky': ('#8FDCFF', 0.25, 0.0, 1.0),
    'green': ('#1FBF6B', 0.25, 0.0, 1.0),
    'red': ('#E5232B', 0.2, 0.0, 1.0),
    'brown': ('#5B2F22', 0.4, 0.0, 0.3),
    'skin': ('#F5B7A1', 0.45, 0.0, 0.3),
    'skin2': ('#E8877A', 0.45, 0.0, 0.3),
    'fat': ('#FFE0A8', 0.5, 0.0, 0.2),
    'chrome': ('#F3F5FF', 0.08, 1.0, 0.0),
    'steel': ('#9AA0B4', 0.32, 1.0, 0.0),
    'lime': ('#D4FF1F', 0.3, 0.0, 0.0, '#D4FF1F', 2.4),
    'glowmint': ('#3DF2B0', 0.3, 0.0, 0.0, '#3DF2B0', 2.0),
    'glowcoral': ('#FF5A3C', 0.3, 0.0, 0.0, '#FF5A3C', 2.2),
    'glass': ('#BFE8FF', 0.05, 0.0, 1.0, None, 0.0, 0.38),
}

_mats = {}
G = {}          # group name -> {'bm', 'slots', 'pivot'}
FRONT = [False]
FRONT_M = Matrix.Rotation(PI / 2, 4, 'X')   # (x, y, z) -> (x, -z, y)


def mat(name):
    if name in _mats:
        return _mats[name]
    spec = PALETTE[name]
    hexv, rough, metal, coat = spec[:4]
    emit = spec[4] if len(spec) > 4 else None
    es = spec[5] if len(spec) > 5 else 0.0
    alpha = spec[6] if len(spec) > 6 else 1.0
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = _rgba(hexv)
    b.inputs['Roughness'].default_value = rough
    b.inputs['Metallic'].default_value = metal
    if coat:
        b.inputs['Coat Weight'].default_value = coat
        b.inputs['Coat Roughness'].default_value = 0.05
    if emit:
        b.inputs['Emission Color'].default_value = _rgba(emit)
        b.inputs['Emission Strength'].default_value = es
    if alpha < 1.0:
        b.inputs['Alpha'].default_value = alpha
        try:
            m.surface_render_method = 'BLENDED'
        except Exception:
            pass
    _mats[name] = m
    return m


def new_prop():
    """Start a fresh, empty scene and part registry."""
    bpy.ops.wm.read_factory_settings(use_empty=True)
    _mats.clear()
    G.clear()
    FRONT[0] = False


@contextmanager
def front():
    prev = FRONT[0]
    FRONT[0] = True
    try:
        yield
    finally:
        FRONT[0] = prev


def pivot(group, p):
    """Override a group's pivot (world/prop space); default is the centre of its bounds."""
    _group(group, 'cream')['pivot'] = V(p)


def _group(g, m):
    grp = G.setdefault(g, {'bm': bmesh.new(), 'slots': [], 'pivot': None})
    if m not in grp['slots']:
        grp['slots'].append(m)
    return grp


def _commit(grp, m, n0, loc, rot, scale, bevel=0.0, seg=3, smooth='none'):
    bm = grp['bm']
    new = [v for v in bm.verts if v not in n0]
    M = Matrix.LocRotScale(V(loc), Euler(rot).to_quaternion(), V(scale))
    if FRONT[0]:
        M = FRONT_M @ M
    bmesh.ops.transform(bm, matrix=M, verts=new)
    faces0 = list({f for v in new for f in v.link_faces})
    bev = []
    if bevel:
        edges = list({e for v in new for e in v.link_edges})
        res = bmesh.ops.bevel(bm, geom=edges, offset=bevel, segments=seg, affect='EDGES', profile=0.5, clamp_overlap=True)
        bev = list(res['faces'])
    idx = grp['slots'].index(m)
    for f in faces0 + bev:
        if not f.is_valid:
            continue
        f.material_index = idx
        if smooth == 'all':
            f.smooth = True
        elif smooth == 'side':
            f.smooth = len(f.verts) <= 4
        elif smooth == 'bevel':
            f.smooth = f in bev


# ───────── primitives ─────────
def cube(g, m, loc, size, rot=(0, 0, 0), bevel=0.0, seg=3):
    grp = _group(g, m)
    n0 = set(grp['bm'].verts)
    bmesh.ops.create_cube(grp['bm'], size=1.0)
    _commit(grp, m, n0, loc, rot, size, bevel, seg, 'bevel')


def cyl(g, m, loc, r, h, rot=(0, 0, 0), r2=None, seg=28, bevel=0.0):
    """Axis along local Z. r = bottom radius, r2 = top radius (cone / funnel)."""
    grp = _group(g, m)
    n0 = set(grp['bm'].verts)
    top = (r2 if r2 is not None else r) / r * 0.5
    bmesh.ops.create_cone(grp['bm'], cap_ends=True, cap_tris=False, segments=seg, radius1=0.5, radius2=top, depth=1.0)
    _commit(grp, m, n0, loc, rot, (2 * r, 2 * r, h), bevel, 3, 'side')


def ball(g, m, loc, r, scale=(1, 1, 1), seg=24):
    grp = _group(g, m)
    n0 = set(grp['bm'].verts)
    bmesh.ops.create_uvsphere(grp['bm'], u_segments=seg, v_segments=max(6, seg // 2), radius=0.5)
    _commit(grp, m, n0, loc, (0, 0, 0), (2 * r * scale[0], 2 * r * scale[1], 2 * r * scale[2]), 0, 3, 'all')


def torus(g, m, loc, R, r, rot=(0, 0, 0), seg=40, rseg=12, scale=(1, 1, 1)):
    grp = _group(g, m)
    bm = grp['bm']
    n0 = set(bm.verts)
    vs = []
    for i in range(seg):
        th = 2 * PI * i / seg
        row = []
        for j in range(rseg):
            ph = 2 * PI * j / rseg
            rr = R + r * math.cos(ph)
            row.append(bm.verts.new((rr * math.cos(th), rr * math.sin(th), r * math.sin(ph))))
        vs.append(row)
    for i in range(seg):
        for j in range(rseg):
            bm.faces.new((vs[i][j], vs[(i + 1) % seg][j], vs[(i + 1) % seg][(j + 1) % rseg], vs[i][(j + 1) % rseg]))
    _commit(grp, m, n0, loc, rot, scale, 0, 3, 'all')


def tube(g, m, pts, r, seg=10, closed=False):
    """Round tube swept along a polyline (parallel-transported frame). r can be a number or a list per point."""
    grp = _group(g, m)
    bm = grp['bm']
    n0 = set(bm.verts)
    P = [V(p) for p in pts]
    n = len(P)
    rad = r if isinstance(r, (list, tuple)) else [r] * n
    rings = []
    N = None
    for k in range(n):
        a = P[(k - 1) % n] if closed else P[max(k - 1, 0)]
        b = P[(k + 1) % n] if closed else P[min(k + 1, n - 1)]
        T = (b - a).normalized()
        if N is None:
            ref = V((0, 0, 1)) if abs(T.z) < 0.9 else V((1, 0, 0))
            N = T.cross(ref).normalized()
        else:
            N = (N - T * N.dot(T)).normalized()
        B = T.cross(N)
        rings.append([bm.verts.new(P[k] + (N * math.cos(2 * PI * s / seg) + B * math.sin(2 * PI * s / seg)) * rad[k]) for s in range(seg)])
    last = n if closed else n - 1
    for k in range(last):
        k2 = (k + 1) % n
        for s in range(seg):
            bm.faces.new((rings[k][s], rings[k][(s + 1) % seg], rings[k2][(s + 1) % seg], rings[k2][s]))
    if not closed:
        bm.faces.new(rings[0])
        bm.faces.new(list(reversed(rings[-1])))
    _commit(grp, m, n0, (0, 0, 0), (0, 0, 0), (1, 1, 1), 0, 3, 'side')


def rod(g, m, a, b, r, seg=10):
    tube(g, m, [a, b], r, seg)


def poly(g, m, pts, depth, loc=(0, 0, 0), rot=(0, 0, 0), bevel=0.0, scale=1.0, seg=3):
    """Extrude a 2D outline (XY) by `depth` along Z (centred on z=0)."""
    grp = _group(g, m)
    bm = grp['bm']
    n0 = set(bm.verts)
    area = sum(pts[i][0] * pts[(i + 1) % len(pts)][1] - pts[(i + 1) % len(pts)][0] * pts[i][1] for i in range(len(pts)))
    P = pts if area > 0 else list(reversed(pts))
    verts = [bm.verts.new((x, y, -depth / 2)) for x, y in P]
    face = bm.faces.new(verts)
    ex = bmesh.ops.extrude_face_region(bm, geom=[face])
    nv = [e for e in ex['geom'] if isinstance(e, bmesh.types.BMVert)]
    bmesh.ops.translate(bm, vec=(0, 0, depth), verts=nv)
    sc = scale if isinstance(scale, (list, tuple)) else (scale, scale, scale)
    _commit(grp, m, n0, loc, rot, sc, bevel, seg, 'bevel')


def blob(g, m, loc, r, scale=(1, 1, 1), amp=0.18, freq=1.3, seed=0.0, seg=40):
    """Noise-displaced sphere (organic: brain hemispheres, lesions, leaves)."""
    grp = _group(g, m)
    bm = grp['bm']
    n0 = set(bm.verts)
    bmesh.ops.create_uvsphere(bm, u_segments=seg, v_segments=seg // 2, radius=0.5)
    bm.normal_update()
    for v in [v for v in bm.verts if v not in n0]:
        d = noise.noise(v.co * freq * 2.0 + V((seed, seed * 0.7, seed * 1.3)))
        v.co += v.normal * amp * d * 0.5
    _commit(grp, m, n0, loc, (0, 0, 0), (2 * r * scale[0], 2 * r * scale[1], 2 * r * scale[2]), 0, 3, 'all')


# ───────── composite helpers ─────────
def gear(g, m, loc, R, teeth, h, hub='navy', rot=(0, 0, 0)):
    cyl(g, m, loc, R * 0.82, h, rot=rot, seg=36, bevel=0.03)
    x, y, z = loc
    for i in range(teeth):
        a = 2 * PI * i / teeth
        c = (x + math.cos(a) * R * 0.92, y + math.sin(a) * R * 0.92, z)
        cube(g, m, c, (R * 0.34, R * 0.26, h), rot=(0, 0, a), bevel=0.03)
    cyl(g, hub, (x, y, z + h * 0.1), R * 0.32, h * 1.25, seg=24)
    cyl(g, 'cream', (x, y, z + h * 0.1), R * 0.12, h * 1.4, seg=16)


def check(g, m, c, s=1.0, z=0.0):
    cx, cy, cz = c
    cube(g, m, (cx - 0.2 * s, cy - 0.1 * s, cz), (0.55 * s, 0.17 * s, 0.17 * s), rot=(0, 0, -0.78), bevel=0.05 * s)
    cube(g, m, (cx + 0.16 * s, cy + 0.1 * s, cz), (1.05 * s, 0.17 * s, 0.17 * s), rot=(0, 0, 0.92), bevel=0.05 * s)


def cross(g, m, c, s=1.0):
    cx, cy, cz = c
    cube(g, m, (cx, cy, cz), (0.95 * s, 0.17 * s, 0.17 * s), rot=(0, 0, 0.78), bevel=0.05 * s)
    cube(g, m, (cx, cy, cz), (0.95 * s, 0.17 * s, 0.17 * s), rot=(0, 0, -0.78), bevel=0.05 * s)


def star(g, m, loc, R, depth=0.2, rot=(0, 0, 0)):
    pts = []
    for i in range(10):
        a = PI / 2 + i * PI / 5
        rr = R if i % 2 == 0 else R * 0.45
        pts.append((rr * math.cos(a), rr * math.sin(a)))
    poly(g, m, pts, depth, loc=loc, rot=rot, bevel=depth * 0.35)


def frame2(g, m, c, w, h, t, z=0.0):
    cx, cy, cz = c
    cube(g, m, (cx, cy + h / 2, cz), (w, t, t))
    cube(g, m, (cx, cy - h / 2, cz), (w, t, t))
    cube(g, m, (cx - w / 2, cy, cz), (t, h, t))
    cube(g, m, (cx + w / 2, cy, cz), (t, h, t))


def phone(g, c, w=2.4, h=4.6, d=0.32, body='navy', screen='cream', rot=(0, 0, 0)):
    """Smartphone in the billboard frame (call inside `with front():`)."""
    cx, cy, cz = c
    cube(g, body, (cx, cy, cz), (w, h, d), rot=rot, bevel=0.22, seg=4)
    cube(g, screen, (cx, cy, cz + d / 2 + 0.005), (w * 0.86, h * 0.9, 0.04), rot=rot)


def magnifier(g, c, R=1.1, glass=True):
    """Magnifying glass in the billboard frame."""
    cx, cy, cz = c
    torus(g, 'navy', (cx, cy, cz), R, 0.15, seg=44)
    if glass:
        cyl(g, 'glass', (cx, cy, cz), R, 0.05, rot=(0, 0, 0), seg=40)
    rod(g, 'navy', (cx + R * 0.72, cy - R * 0.72, cz), (cx + R * 1.9, cy - R * 1.9, cz), 0.2)


def bot(prefix, loc, s, body):
    """The little agent from the site (same character family as Pip), standing, facing -Y."""
    g = f'bob_{prefix}'
    x, y, z = loc
    cube(g, body, (x, y, z), (1.0 * s, 0.9 * s, 0.9 * s), bevel=0.28 * s, seg=4)
    cube(g, 'cream', (x, y, z + 0.92 * s), (1.25 * s, 1.0 * s, 0.85 * s), bevel=0.3 * s, seg=4)
    cube(g, 'navy', (x, y - 0.5 * s, z + 0.95 * s), (0.98 * s, 0.1 * s, 0.5 * s), bevel=0.04 * s)
    for sx in (-1, 1):
        cyl(g, 'lime', (x + sx * 0.2 * s, y - 0.57 * s, z + 0.97 * s), 0.1 * s, 0.22 * s, rot=(PI / 2, 0, 0), seg=14)
    rod(g, 'chrome', (x, y, z + 1.35 * s), (x, y, z + 1.7 * s), 0.04 * s)
    ball(g, 'yellow', (x, y, z + 1.78 * s), 0.1 * s, seg=12)
    for sx in (-1, 1):
        ball(g, 'navy', (x + sx * 0.62 * s, y, z + 0.25 * s), 0.12 * s, seg=10)
    cyl(g, 'navy', (x, y, z - 0.55 * s), 0.35 * s, 0.22 * s, r2=0.2 * s, seg=16)


def books(g_prefix, base, colours, n=4, w=3.4, d=2.4, t=0.55, jitter=0.12):
    x, y, z = base
    for i in range(n):
        c = colours[i % len(colours)]
        zz = z + i * (t + 0.03) + t / 2
        a = math.sin(i * 2.3) * jitter
        cube(f'{g_prefix}books', c, (x + math.sin(i * 1.9) * 0.12, y, zz), (w - 0.1 * (i % 2), d, t), rot=(0, 0, a), bevel=0.09)
        cube(f'{g_prefix}books', 'cream', (x + math.sin(i * 1.9) * 0.12, y - 0.04, zz), (w - 0.14 - 0.1 * (i % 2), d * 0.97, t * 0.62), rot=(0, 0, a))


def mortarboard(g, c, s=1.0):
    x, y, z = c
    cyl(g, 'navy', (x, y, z), 1.0 * s, 0.7 * s, r2=0.85 * s, seg=28, bevel=0.04 * s)
    cube(g, 'navy', (x, y, z + 0.5 * s), (3.4 * s, 3.4 * s, 0.2 * s), rot=(0, 0, PI / 4), bevel=0.05 * s)
    ball(g, 'yellow', (x, y, z + 0.66 * s), 0.14 * s, seg=14)
    tube(g, 'yellow', [(x, y, z + 0.66 * s), (x + 0.9 * s, y - 0.9 * s, z + 0.6 * s), (x + 1.7 * s, y - 1.7 * s, z + 0.25 * s), (x + 1.8 * s, y - 1.8 * s, z - 0.5 * s)], 0.05 * s)
    ball(g, 'yellow', (x + 1.8 * s, y - 1.8 * s, z - 0.62 * s), 0.17 * s, seg=14)


# ───────── export ─────────
def finalize(name, outdir):
    scene = bpy.context.scene
    root = bpy.data.objects.new(name, None)
    scene.collection.objects.link(root)
    tris = 0
    for g, grp in G.items():
        bm = grp['bm']
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
        if grp['pivot'] is not None:
            c = grp['pivot']
        else:
            xs = [v.co for v in bm.verts]
            mn = V((min(p.x for p in xs), min(p.y for p in xs), min(p.z for p in xs)))
            mx = V((max(p.x for p in xs), max(p.y for p in xs), max(p.z for p in xs)))
            c = (mn + mx) / 2
        bmesh.ops.translate(bm, vec=-c, verts=bm.verts)
        me = bpy.data.meshes.new(g)
        bm.to_mesh(me)
        tris += sum(len(p.vertices) - 2 for p in me.polygons)
        bm.free()
        for slot in grp['slots']:
            me.materials.append(mat(slot))
        ob = bpy.data.objects.new(g, me)
        scene.collection.objects.link(ob)
        ob.location = c
        ob.parent = root
    bpy.context.view_layer.update()
    os.makedirs(outdir, exist_ok=True)
    path = os.path.join(outdir, name + '.glb')
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.export_scene.gltf(
        filepath=path, export_format='GLB', use_selection=True, export_apply=True, export_yup=True,
        export_materials='EXPORT', export_cameras=False, export_lights=False, export_animations=False,
        export_draco_mesh_compression_enable=True, export_draco_mesh_compression_level=6,
        export_draco_position_quantization=12, export_draco_normal_quantization=8, export_draco_texcoord_quantization=10,
    )
    return path, len(G), tris
