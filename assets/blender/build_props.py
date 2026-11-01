"""
Builds every chapter prop and exports public/models/props/<name>.glb

    "C:/Program Files/Blender Foundation/Blender 5.1/blender.exe" --background --factory-startup \
        --python assets/blender/build_props.py            # all props
    ... --python assets/blender/build_props.py -- derm ship   # only some

Each prop is a literal depiction of the thing it introduces on the site (a skin cross-section for DermSense, a call
headset and phone for GREAT, a container ship for the CMA CGM role, ...). Parts are named groups; the web scene
assembles them as you scroll and animates them by prefix (spin_ roll_ rolln_ bob_ pulse_ swing_ slide_ orbit_).
"""
import math
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from props_lib import (PI, ball, blob, bot, books, check, cross, cube, cyl, finalize, frame2, front, gear, magnifier,  # noqa: E402
                       mortarboard, new_prop, phone, pivot, poly, rod, star, torus, tube)

OUT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'public', 'models', 'props'))
sin, cos = math.sin, math.cos


def ring_pts(r, n, z=0.0, a0=0.0, a1=2 * PI):
    return [(r * cos(a0 + (a1 - a0) * i / (n - 1)), r * sin(a0 + (a1 - a0) * i / (n - 1)), z) for i in range(n)]


# ═════════ profile: an engineer's desk ═════════
def laptop():
    cube('desk', 'cream', (0, 0, -0.2), (11, 6.4, 0.3), bevel=0.12)
    cube('base', 'chrome', (0, -0.2, 0.02), (5.2, 3.5, 0.26), bevel=0.1)
    cube('base', 'navy', (0, -0.2, 0.16), (4.5, 2.4, 0.06))
    for r in range(3):
        for c in range(9):
            cube('keys', 'cream', (-1.9 + c * 0.475, -0.9 + r * 0.55, 0.22), (0.38, 0.38, 0.07), bevel=0.04)
    cube('screen', 'chrome', (0, 1.55, 2.0), (5.2, 0.26, 3.5), bevel=0.1)
    cube('screen', 'navy', (0, 1.4, 2.0), (4.8, 0.08, 3.1))
    for i, (w, c) in enumerate([(2.6, 'lime'), (1.6, 'pink'), (3.2, 'mint'), (2.0, 'yellow'), (2.9, 'sky'), (1.2, 'lime'), (2.2, 'pink')]):
        cube('code', c, (-2.0 + w / 2 + (0.5 if i % 3 == 1 else 0), 1.34, 3.1 - i * 0.38), (w, 0.05, 0.14), bevel=0.03)
    cyl('bob_mug', 'cream', (-4.0, -0.6, 0.6), 0.75, 1.2, seg=32, bevel=0.05)
    cyl('bob_mug', 'navy', (-4.0, -0.6, 1.18), 0.62, 0.05, seg=32)
    torus('bob_mug', 'cream', (-3.2, -0.6, 0.6), 0.34, 0.1, rot=(PI / 2, 0, 0), seg=24)
    for i, dx in enumerate((-0.2, 0.1, 0.35)):
        tube('bob_steam', 'white', [(-4 + dx, -0.6, 1.4), (-4 + dx + 0.18, -0.6, 1.9), (-4 + dx - 0.12, -0.6, 2.4), (-4 + dx + 0.1, -0.6, 2.9)], 0.05)
    cyl('plant', 'coral', (4.1, 1.0, 0.5), 0.8, 0.9, r2=0.62, seg=28, bevel=0.04)
    for i in range(6):
        a = i * 1.05
        blob('plant', 'mint', (4.1 + cos(a) * 0.35, 1.0 + sin(a) * 0.35, 1.5 + 0.12 * i), 0.55, (0.5, 0.2, 1.1), amp=0.1, seed=i)
    for i, c in enumerate(['yellow', 'pink', 'lime']):
        cube('notes', c, (-2.4 + i * 0.5, -2.35, 0.0 + i * 0.05), (0.9, 0.9, 0.04), rot=(0, 0, 0.2 - 0.25 * i))


# ═════════ cap1: orchestration = a conductor hub with a team of agents ═════════
def orchestra():
    ball('hub', 'chrome', (0, 0, 0.6), 1.05)
    torus('spin_halo', 'lime', (0, 0, 0.6), 1.7, 0.06, rot=(1.1, 0.2, 0))
    torus('spin_ring', 'navy', (0, 0, -0.55), 3.9, 0.07)
    bodies = ['cream', 'yellow', 'mint', 'blue', 'pink']
    for i in range(5):
        a = i * 2 * PI / 5 + 0.3
        p = (3.9 * cos(a), 3.9 * sin(a), 0.0)
        bot(f'a{i}', p, 0.75, bodies[i])
        tube('wires', 'navy', [(0, 0, 0.6), (p[0] * 0.45, p[1] * 0.45, 1.5), (p[0] * 0.8, p[1] * 0.8, 0.9), (p[0], p[1], 0.35)], 0.06)
        ball('pulse_nodes', 'lime', (p[0] * 0.5, p[1] * 0.5, 1.5 - 0.1 * i % 2), 0.12, seg=10)


# ═════════ cap2: retrieval = a library, a funnel of chunks and a magnifier ═════════
def library():
    cube('base', 'navy', (0, 0, -1.2), (8.6, 2.4, 0.3), bevel=0.1)
    cols = ['coral', 'yellow', 'blue', 'mint', 'pink', 'cream', 'lilac', 'orange']
    x = -3.6
    for i in range(11):
        h = 2.4 + 0.7 * sin(i * 1.7) + 0.3 * (i % 3)
        w = 0.5 + 0.1 * ((i * 7) % 3)
        cube('books', cols[i % len(cols)], (x + w / 2, 0, -1.05 + h / 2), (w, 1.6, h), rot=(0, 0.04 * sin(i), 0), bevel=0.06)
        cube('books', 'cream', (x + w / 2, -0.82, -1.05 + h / 2), (w * 0.8, 0.04, h * 0.85))
        x += w + 0.07
    cyl('funnel', 'yellow', (4.6, 0, 2.2), 0.35, 1.8, r2=1.5, seg=36, bevel=0.03)
    torus('funnel', 'orange', (4.6, 0, 3.1), 1.5, 0.1, seg=40)
    for i, c in enumerate(['pink', 'mint', 'lilac', 'cream', 'coral']):
        a = i * 1.3
        cube('bob_chunks', c, (4.6 + cos(a) * 0.9, sin(a) * 0.9, 4.0 + 0.35 * i), (0.5, 0.5, 0.5), rot=(a, a * 0.7, a * 0.3), bevel=0.08)
    with front():
        magnifier('bob_lens', (-2.6, -3.0, 2.2), R=1.3)


# ═════════ cap3: tools / MCP = a plug meeting a socket, with a wrench and a gear ═════════
def toolbox():
    cube('plug', 'navy', (-3.4, 0, 0.3), (2.6, 1.9, 1.7), bevel=0.32, seg=4)
    cube('plug', 'coral', (-3.4, -0.96, 0.3), (2.0, 0.08, 0.5), bevel=0.03)
    for dz in (0.65, -0.05):
        cube('plug', 'chrome', (-1.55, 0, 0.3 + dz - 0.3), (1.3, 0.55, 0.26), bevel=0.05)
    tube('cable', 'pink', [(-4.6, 0, 0.3), (-5.6, 0, 0.4), (-6.3, 0, 1.3), (-6.4, 0, 2.6)], 0.2)
    cube('socket', 'cream', (3.0, 0, 0.3), (2.6, 2.6, 2.6), bevel=0.32, seg=4)
    for dz in (0.65, -0.05):
        cube('socket', 'navy', (1.7, 0, 0.3 + dz - 0.3), (0.12, 0.7, 0.34))
    cyl('socket', 'lime', (3.0, -1.32, 1.2), 0.14, 0.1, rot=(PI / 2, 0, 0), seg=12)
    for i in range(4):
        ball('pulse_sparks', 'lime', (-0.5 + i * 0.7, 0.0, 0.7 + (0.35 if i % 2 else -0.2)), 0.13, seg=10)
    rod('bob_wrench', 'coral', (-1.6, -0.2, -2.7), (2.2, -0.2, -2.7), 0.26)
    torus('bob_wrench', 'coral', (2.7, -0.2, -2.7), 0.62, 0.22, rot=(PI / 2, 0, 0), seg=30)
    cube('bob_wrench', 'yellow', (3.35, -0.2, -2.7), (0.7, 0.5, 0.5))
    ball('bob_wrench', 'navy', (-1.8, -0.2, -2.7), 0.22)
    with front():
        gear('roll_gear', 'blue', (0.2, 3.3, 0.5), 1.35, 9, 0.45, hub='navy')
    for i in range(3):
        cyl('nuts', 'chrome', (-3.2 + i * 0.9, -2.0, -2.35), 0.34, 0.3, seg=6, bevel=0.03)


# ═════════ cap4: evaluation = a scorecard with ticks, a cross and stars ═════════
def scorecard():
    with front():
        cube('board', 'blue', (0, 0, 0), (4.4, 5.8, 0.36), bevel=0.26, seg=4)
        cube('board', 'chrome', (0, 3.05, 0.22), (1.5, 0.55, 0.3), bevel=0.08)
        cube('paper', 'cream', (0, -0.1, 0.24), (3.8, 4.8, 0.1), bevel=0.05)
        ys = [1.5, 0.45, -0.6, -1.65]
        for i, y in enumerate(ys):
            ball('rows', 'blue', (-1.4, y, 0.34), 0.2, seg=14)
            cube('rows', 'navy', (0.25, y + 0.12, 0.3), (2.0 - 0.3 * (i % 2), 0.14, 0.05))
            cube('rows', 'navy', (-0.05, y - 0.16, 0.3), (1.4 + 0.2 * (i % 3), 0.1, 0.05))
        for y in ys[:3]:
            check('checks', 'green', (1.55, y, 0.36), 0.75)
        cross('cross', 'coral', (1.55, ys[3], 0.36), 0.8)
        for i in range(5):
            star('bob_stars', 'yellow', (-1.6 + i * 0.8, 3.95, 0.3), 0.42, 0.18)
        cyl('spin_badge', 'yellow', (3.7, -2.1, 0.4), 0.8, 0.25, seg=32, bevel=0.03)
        cyl('spin_badge', 'orange', (3.7, -2.1, 0.55), 0.55, 0.1, seg=32)
        star('spin_badge', 'cream', (3.7, -2.1, 0.7), 0.4, 0.1)
        cube('spin_badge', 'coral', (3.35, -3.1, 0.2), (0.4, 1.0, 0.1), rot=(0, 0, 0.3))
        cube('spin_badge', 'coral', (4.05, -3.1, 0.2), (0.4, 1.0, 0.1), rot=(0, 0, -0.3))


# ═════════ cap5: reliability = a shield with a tick, a padlock and a breaker ═════════
def shield():
    outline = [(-2.1, 2.3), (0, 2.85), (2.1, 2.3), (2.1, 0.2), (1.35, -1.7), (0, -2.8), (-1.35, -1.7), (-2.1, 0.2)]
    with front():
        poly('shield', 'blue', outline, 0.7, bevel=0.2, seg=4)
        poly('shield', 'cream', outline, 0.3, loc=(0, 0.0, 0.4), bevel=0.08, scale=(0.78, 0.78, 1))
        check('tick', 'green', (0, 0.0, 0.7), 2.1)
        cube('bob_lock', 'yellow', (2.5, -2.3, 1.0), (1.4, 1.2, 0.6), bevel=0.16, seg=4)
        tube('bob_lock', 'chrome', [(2.5 + 0.45 * cos(a), -1.7 + 0.5 * sin(a), 1.0) for a in [PI * i / 10 for i in range(11)]], 0.1)
        cyl('bob_lock', 'navy', (2.5, -2.3, 1.32), 0.12, 0.1, seg=12)
        torus('spin_orbit', 'lime', (0, 0, 0), 3.7, 0.05, rot=(1.3, 0, 0))
        cube('breaker', 'navy', (-3.2, -2.4, 0.5), (1.5, 2.1, 0.9), bevel=0.14)
        cube('swing_lever', 'red', (-3.2, -2.1, 1.1), (0.4, 1.1, 0.35), bevel=0.1)
        pivot('swing_lever', (-3.2, -2.7, 1.1))


# ═════════ great: an automatic call = headset + phone + speech bubbles + a score card ═════════
def call():
    arc = [(-2.0 * cos(PI * i / 12), 0, 2.0 * sin(PI * i / 12)) for i in range(13)]
    tube('bob_headset', 'navy', [(x - 1.8, y, z + 0.2) for x, y, z in arc], 0.2)
    for sx in (-1, 1):
        cyl('bob_headset', 'coral', (-1.8 + sx * 2.05, 0, 0.1), 0.85, 0.7, rot=(0, PI / 2, 0), seg=32, bevel=0.06)
        cyl('bob_headset', 'cream', (-1.8 + sx * 1.7, 0, 0.1), 0.72, 0.18, rot=(0, PI / 2, 0), seg=32)
    tube('bob_headset', 'navy', [(-3.85, -0.3, -0.3), (-3.6, -1.3, -1.1), (-2.7, -2.1, -1.4)], 0.07)
    ball('bob_headset', 'coral', (-2.55, -2.2, -1.45), 0.2)
    with front():
        phone('phone', (3.7, 0.2, 0.0), 2.7, 5.0, 0.34, body='navy', screen='cream')
        cyl('phone', 'green', (3.7, -1.5, 0.3), 0.5, 0.08, seg=28)
        cyl('phone', 'mint', (3.7, 1.0, 0.25), 0.7, 0.06, seg=28)
        cube('phone', 'navy', (3.7, 1.0, 0.3), (0.9, 0.12, 0.05))
        for i in range(3):
            torus(f'pulse_wave{i}', 'coral', (3.7, 0.2, 0.0), 2.2 + i * 0.7, 0.06, seg=48, scale=(1, 1.5, 1))
        for i, (c, p) in enumerate([('mint', (-1.0, 3.6, 1.2)), ('yellow', (1.4, 3.9, 0.4)), ('pink', (-3.6, 3.2, 0.4))]):
            cube(f'bob_bubble{i}', c, p, (1.9, 1.15, 0.4), bevel=0.3, seg=4)
            cyl(f'bob_bubble{i}', c, (p[0] - 0.5, p[1] - 0.8, p[2]), 0.35, 0.4, r2=0.02, rot=(0, 0, 0.6), seg=3)
        cube('score', 'cream', (-0.6, -3.3, 0.5), (4.4, 1.7, 0.2), bevel=0.14)
        for i in range(5):
            star('score', 'yellow', (-2.2 + i * 0.7, -3.15, 0.7), 0.3, 0.1)
        for i, h in enumerate((0.3, 0.55, 0.85)):
            cube('score', 'green', (1.0 + i * 0.45, -3.75 + h / 2, 0.68), (0.28, h, 0.1))


# ═════════ w1 LoopGuard: a chain that loops forever, a tripped breaker, a stop sign ═════════
def loopguard():
    n = 16
    R = 3.1
    with front():
        for i in range(n):
            a = 2 * PI * i / n
            torus('roll_chain', 'blue' if i % 2 == 0 else 'sky', (R * cos(a), R * sin(a), 0), 0.46, 0.12, rot=(PI / 2 if i % 2 else 0, 0, a + PI / 2), seg=28, scale=(1.5, 1.0, 1.0))
        cube('breaker', 'navy', (5.1, -1.2, 0), (2.5, 3.6, 1.4), bevel=0.18)
        cube('breaker', 'cream', (5.1, 0.6, 0.72), (1.9, 0.5, 0.06))
        cube('breaker', 'yellow', (5.1, -1.1, 0.72), (1.2, 1.6, 0.06))
        cube('swing_lever', 'red', (5.1, -0.4, 0.95), (0.55, 1.3, 0.4), bevel=0.14)
        ball('swing_lever', 'red', (5.1, 0.25, 1.0), 0.28)
        pivot('swing_lever', (5.1, -1.1, 0.95))
        ball('pulse_lamp', 'glowcoral', (4.5, 1.4, 0.8), 0.22)
        poly('bob_stop', 'red', [(cos(PI / 8 + i * PI / 4) * 1.0, sin(PI / 8 + i * PI / 4) * 1.0) for i in range(8)], 0.28, loc=(-5.3, 2.3, 0.3), bevel=0.07)
        cube('bob_stop', 'white', (-5.3, 2.3, 0.5), (1.3, 0.28, 0.08), bevel=0.04)
    bot('bot', (0, 0, -0.4), 0.9, 'coral')


# ═════════ w2 DermSense: a skin cross-section, a lesion, a heat ring and a dermatoscope ═════════
def derm():
    cube('skin', 'skin', (0, 0, 1.0), (7.6, 4.8, 0.55), bevel=0.18, seg=4)
    cube('skin', 'skin2', (0, 0, 0.3), (7.6, 4.8, 1.0), bevel=0.14)
    cube('skin', 'fat', (0, 0, -0.75), (7.6, 4.8, 1.1), bevel=0.14)
    cube('skin', 'red', (-2.4, -2.42, 0.3), (0.12, 0.05, 0.9))
    cube('skin', 'red', (1.9, -2.42, 0.3), (0.12, 0.05, 0.9))
    blob('lesion', 'brown', (0.4, -0.2, 1.5), 0.95, (1.15, 0.9, 0.6), amp=0.5, freq=1.1, seed=3)
    blob('lesion', 'navy', (0.1, -0.3, 1.62), 0.3, (1.0, 0.8, 0.5), amp=0.25, seed=7)
    blob('lesion', 'brown', (1.2, 0.2, 1.45), 0.4, (1.0, 0.9, 0.5), amp=0.3, seed=11)
    cyl('pulse_heat', 'glowcoral', (0.5, -0.1, 1.31), 2.0, 0.05, seg=60)
    cyl('pulse_heat', 'orange', (0.5, -0.1, 1.34), 1.45, 0.05, seg=60)
    cyl('pulse_heat', 'yellow', (0.5, -0.1, 1.37), 0.95, 0.05, seg=60)
    for i in range(9):
        a = i * 0.7
        tube('hairs', 'brown', [(-2.8 + (i % 4) * 0.5 + cos(a) * 0.2, 1.4 + (i // 4) * 0.4, 1.28), (-2.7 + (i % 4) * 0.5 + 0.1, 1.45 + (i // 4) * 0.4, 1.7), (-2.5 + (i % 4) * 0.5 + 0.25, 1.5 + (i // 4) * 0.4, 2.0)], 0.03)
    cyl('bob_scope', 'navy', (-1.2, -2.3, 4.2), 0.34, 2.6, rot=(0.5, -0.4, 0), seg=20, bevel=0.03)
    cyl('bob_scope', 'chrome', (-0.2, -0.9, 3.1), 1.05, 0.55, rot=(0.5, -0.4, 0), seg=40, bevel=0.04)
    cyl('bob_scope', 'glass', (-0.2, -0.9, 2.82), 0.88, 0.1, rot=(0.5, -0.4, 0), seg=40)
    torus('bob_scope', 'coral', (-0.2, -0.9, 2.8), 0.9, 0.07, rot=(0.5, -0.4, 0), seg=44)


# ═════════ w3 OULAD: books + a graduation cap + a retention chart (some students drop out) ═════════
def oulad():
    books('', (-2.2, 0, -1.4), ['coral', 'yellow', 'blue', 'mint'], n=4, w=3.8, d=2.6, t=0.6)
    mortarboard('bob_cap', (-2.2, 0, 1.4), 1.0)
    cube('axes', 'navy', (4.2, 0, -1.7), (4.6, 0.3, 0.14), bevel=0.04)
    cube('axes', 'navy', (2.0, 0, 0.1), (0.14, 0.3, 3.8), bevel=0.04)
    for i, h in enumerate((1.0, 1.5, 2.1, 2.7, 3.2)):
        c = 'blue' if i < 3 else 'coral'
        hh = h if i < 3 else (2.3 - (i - 3) * 1.0)
        cube('bars', c, (2.9 + i * 0.8, 0, -1.6 + hh / 2), (0.55, 0.55, hh), bevel=0.08)
    tube('trend', 'yellow', [(2.6, -0.5, -0.6), (3.6, -0.5, 0.2), (4.6, -0.5, 0.0), (5.6, -0.5, -1.0)], 0.1)
    cyl('trend', 'yellow', (5.75, -0.5, -1.3), 0.3, 0.5, r2=0.02, rot=(0, PI - 0.5, 0), seg=16)
    for i in range(4):
        ball('bob_students', ['mint', 'pink', 'sky', 'yellow'][i], (-5.1 + i * 0.0, -1.6 + i * 0.0, -1.0 + i * 0.7), 0.0001) if False else None


# ═════════ w4 Commerce microservices: a shopping cart, parcels and three service containers ═════════
def shop():
    cube('cart', 'chrome', (0.8, 0, 0.0), (3.8, 2.4, 0.16), bevel=0.06)
    for z in (0.7, 1.4, 2.1):
        for y in (-1.2, 1.2):
            rod('cart', 'chrome', (-1.1, y, z), (2.7, y, z), 0.045)
        for x in (-1.1, 2.7):
            rod('cart', 'chrome', (x, -1.2, z), (x, 1.2, z), 0.045)
    for x in (-1.1, 0.0, 1.1, 2.2, 2.7):
        for y in (-1.2, 1.2):
            rod('cart', 'chrome', (x, y, 0.0), (x, y, 2.1), 0.045)
    rod('cart', 'navy', (-1.1, 1.3, 2.9), (2.7, 1.3, 2.9), 0.12)
    for x in (-1.1, 2.7):
        rod('cart', 'navy', (x, 1.2, 2.1), (x, 1.3, 2.9), 0.1)
    for x in (-0.9, 2.5):
        for y in (-1.0, 1.0):
            cyl('wheels', 'navy', (x, y, -0.4), 0.34, 0.22, rot=(0, PI / 2, 0), seg=20)
    cube('bob_parcels', 'yellow', (-0.1, 0.0, 0.95), (1.3, 1.3, 1.3), bevel=0.06)
    cube('bob_parcels', 'cream', (-0.1, 0.0, 0.95), (1.34, 0.28, 1.34))
    cube('bob_parcels', 'coral', (1.6, 0.2, 0.8), (1.2, 1.5, 1.0), rot=(0, 0, 0.2), bevel=0.06)
    cube('bob_parcels', 'mint', (0.7, -0.1, 2.05), (1.0, 1.0, 0.9), rot=(0, 0, -0.3), bevel=0.06)
    for i, c in enumerate(['blue', 'coral', 'mint']):
        z = 0.7 + i * 1.28
        cube('containers', c, (-5.2, 0, z), (3.0, 1.8, 1.15), bevel=0.05)
        for k in range(7):
            cube('containers', 'navy', (-6.4 + k * 0.4, -0.93, z), (0.07, 0.04, 1.0))
    ball('hub', 'chrome', (-2.5, 0, 3.6), 0.6)
    for i in range(3):
        tube('wires', 'navy', [(-2.5, 0, 3.6), (-3.2, 0, 3.2 - i * 0.6), (-4.1, 0, 0.8 + i * 1.28)], 0.05)
    tube('wires', 'navy', [(-2.5, 0, 3.6), (0.4, 0, 3.8), (0.9, 0, 2.6)], 0.05)


# ═════════ w5 Network Cell Analyzer: a cell tower, broadcast rings and a phone with signal bars ═════════
def tower():
    cyl('base', 'cream', (0, 0, -0.2), 4.2, 0.35, seg=6, bevel=0.06)
    legs = [(1.5, 1.5), (-1.5, 1.5), (-1.5, -1.5), (1.5, -1.5)]
    for lx, ly in legs:
        rod('mast', 'navy', (lx, ly, 0), (lx * 0.28, ly * 0.28, 6.4), 0.1)
    for z in (1.4, 2.9, 4.4):
        k = 1 - z / 6.4 * 0.72
        sq = [(lx * k, ly * k, z) for lx, ly in legs]
        for i in range(4):
            rod('mast', 'navy', sq[i], sq[(i + 1) % 4], 0.06)
            rod('mast', 'coral', sq[i], (legs[(i + 1) % 4][0] * (1 - (z + 1.5) / 6.4 * 0.72), legs[(i + 1) % 4][1] * (1 - (z + 1.5) / 6.4 * 0.72), z + 1.5), 0.045)
    cyl('top', 'navy', (0, 0, 6.5), 0.95, 0.3, seg=28)
    for i in range(3):
        a = i * 2 * PI / 3 + 0.5
        cube('panels', 'cream', (cos(a) * 0.95, sin(a) * 0.95, 7.0), (0.25, 0.8, 1.4), rot=(0, 0, a + PI / 2), bevel=0.06)
    cyl('dish', 'yellow', (0.9, -1.5, 5.4), 0.1, 0.5, r2=0.75, rot=(PI / 2 + 0.2, 0, 0.3), seg=28)
    for i, r in enumerate((1.7, 2.9, 4.1)):
        torus(f'pulse_wave{i}', 'coral', (0, 0, 7.0), r, 0.07, seg=64)
    with front():
        phone('bob_phone', (5.6, 0.4, 3.0), 2.3, 4.2, 0.3, body='navy', screen='cream')
        for i in range(4):
            cube('bob_phone', 'blue' if i < 3 else 'sky', (4.9 + i * 0.5, -0.6 + (0.3 + i * 0.3) / 2, 3.2), (0.32, 0.3 + i * 0.3, 0.1), bevel=0.04)
        ball('bob_phone', 'green', (5.6, 1.5, 3.2), 0.18, seg=12)


# ═════════ w6 Supermarket graph: two shelf aisles, a basket and the shortest path to the till ═════════
def market():
    cube('floor', 'cream', (0, 0, -0.15), (10, 7.4, 0.28), bevel=0.1)
    for sx in (-2.3, 2.3):
        g = 'prodA' if sx < 0 else 'prodB'
        for y in (-3.0, 3.0):
            cube('shelves', 'navy', (sx, y, 1.3), (1.2, 0.14, 2.8), bevel=0.04)
        for z in (0.2, 1.3, 2.4):
            cube('shelves', 'navy', (sx, 0, z), (1.2, 6.2, 0.12), bevel=0.03)
            for k in range(6):
                c = ['coral', 'yellow', 'blue', 'mint', 'pink', 'lilac'][(k + int(z * 3) + (1 if sx > 0 else 0)) % 6]
                y = -2.6 + k * 1.04
                if k % 2:
                    cyl(g, c, (sx, y, z + 0.4), 0.3, 0.7, seg=16, bevel=0.02)
                else:
                    cube(g, c, (sx, y, z + 0.4), (0.8, 0.7, 0.75), bevel=0.06)
    cyl('basket', 'coral', (0, -3.6, 0.45), 0.55, 0.6, r2=0.75, seg=24, bevel=0.03)
    tube('basket', 'navy', [(-0.62 + 1.24 * i / 8, -3.6, 0.78 + 0.5 * sin(PI * i / 8)) for i in range(9)], 0.04)
    path = [(0, -3.4, 0.05), (0.0, -2.0, 0.05), (-0.7, -0.8, 0.05), (0.7, 0.6, 0.05), (0.0, 1.8, 0.05), (0.0, 3.3, 0.05)]
    tube('path', 'blue', path, 0.12)
    cyl('path', 'blue', (0, 3.75, 0.05), 0.34, 0.6, r2=0.02, rot=(-PI / 2, 0, 0), seg=16)
    for p in path[1:5]:
        ball('pulse_nodes', 'pink', p, 0.22, seg=14)
    cube('checkout', 'mint', (0, 4.7, 0.6), (2.4, 1.0, 1.1), bevel=0.1)
    cube('checkout', 'navy', (0, 4.7, 1.3), (1.0, 0.5, 0.45), bevel=0.05)


# ═════════ xp1 Gabriel & Co., New York: a skyline with an AI chip on top ═════════
def nyc():
    cube('ground', 'cream', (0, 0, -0.2), (11, 6.4, 0.3), bevel=0.1)
    spec = [(-4.2, 0.4, 1.7, 1.7, 3.6, 'blue'), (-2.4, 1.6, 1.5, 1.5, 4.8, 'navy'), (2.3, 1.5, 1.6, 1.6, 3.2, 'coral'),
            (4.2, -0.6, 1.6, 1.6, 2.5, 'lilac'), (-3.9, -1.9, 1.4, 1.4, 2.1, 'cream'), (2.6, -1.9, 1.4, 1.4, 1.8, 'yellow')]
    for (x, y, w, d, h, c) in spec:
        cube('blocks', c, (x, y, h / 2), (w, d, h), bevel=0.05)
        for r in range(int(h / 0.7)):
            cube('windows', 'lime', (x, y - d / 2 - 0.02, 0.55 + r * 0.7), (w * 0.72, 0.04, 0.2))
    for i, (w, h, z) in enumerate([(2.2, 3.4, 0), (1.7, 1.5, 3.4), (1.2, 1.4, 4.9), (0.7, 1.0, 6.3)]):
        cube('empire', 'steel' if i % 2 else 'chrome', (0, 0, z + h / 2), (w, w, h), bevel=0.05)
    rod('empire', 'chrome', (0, 0, 7.2), (0, 0, 8.7), 0.07)
    cube('bob_chip', 'navy', (0, 0, 10.1), (2.6, 2.6, 0.34), bevel=0.1)
    cube('bob_chip', 'lime', (0, 0, 10.1), (1.3, 1.3, 0.4), bevel=0.06)
    for i in range(6):
        for s in (-1, 1):
            cube('bob_chip', 'chrome', (-1.0 + i * 0.4, s * 1.45, 10.1), (0.14, 0.34, 0.1))
            cube('bob_chip', 'chrome', (s * 1.45, -1.0 + i * 0.4, 10.1), (0.34, 0.14, 0.1))
    tube('cables', 'lime', [(0, 0, 9.8), (0.3, 0, 9.0), (-0.1, 0, 8.7)], 0.07)


# ═════════ xp2 Chehab Lab: a brain and the stack of MRI slices a model has to choose from ═════════
def brain():
    for sx in (-1, 1):
        blob('brain', 'pink', (sx * 0.62, 0, 0.5), 1.0, (0.92, 1.35, 1.0), amp=0.6, freq=1.4, seed=2 + sx, seg=44)
    blob('brain', 'lilac', (0, 0.85, -0.7), 0.7, (1.0, 0.7, 0.55), amp=0.3, seed=9)
    cyl('brain', 'skin2', (0, 0.2, -1.5), 0.32, 1.0, seg=20)
    for i in range(7):
        z = -1.6 + i * 0.55
        k = sin(PI * (i + 0.8) / 8.4)
        cube('slices', 'cream', (5.2, 0, z), (2.9, 2.9, 0.1), bevel=0.04)
        blob('slices', 'pink', (5.2, 0, z + 0.07), 0.8, (1.1 * k + 0.2, 0.95 * k + 0.2, 0.08), amp=0.3, seed=i, seg=20)
    cube('slide_scan', 'coral', (5.2, 0, 0.5), (3.3, 3.3, 0.07), bevel=0.02)
    cube('slide_scan', 'glowcoral', (5.2, -1.66, 0.5), (3.3, 0.05, 0.1))
    for sx in (-1, 1):
        for sy in (-1, 1):
            rod('frame', 'navy', (5.2 + sx * 1.55, sy * 1.55, -1.9), (5.2 + sx * 1.55, sy * 1.55, 2.5), 0.05)
    cube('base', 'cream', (2.6, 0, -2.2), (10, 4, 0.3), bevel=0.1)
    magnifier_world = [(-3.4, -2.6, 1.8)]


# ═════════ xp3 CMA CGM: a container ship ═════════
def ship():
    cube('sea', 'blue', (0, 0, -0.7), (15, 6, 0.6), bevel=0.2)
    for i in range(7):
        cube('waves', 'white', (-5.5 + i * 1.9, -2.2 + (i % 2) * 0.5, -0.36), (0.9, 0.22, 0.12), bevel=0.05)
    hull = [(-5.4, 1.5), (-5.0, 0.0), (4.1, 0.0), (6.4, 1.5)]
    poly('hull', 'navy', hull, 2.8, loc=(0, 0, 0), rot=(PI / 2, 0, 0), bevel=0.1)
    cube('hull', 'coral', (0.4, 0, 0.18), (9.4, 2.82, 0.2))
    cube('deck', 'cream', (0.4, 0, 1.55), (11.2, 2.7, 0.2), bevel=0.05)
    cube('bridge', 'cream', (-4.4, 0, 2.8), (1.7, 2.3, 2.4), bevel=0.1)
    cube('bridge', 'navy', (-3.53, 0, 3.1), (0.06, 1.9, 0.5))
    cyl('bridge', 'coral', (-4.6, 0, 4.4), 0.38, 0.9, seg=20)
    cols = {'conA': 'blue', 'conB': 'yellow', 'conC': 'mint', 'conD': 'coral'}
    names = list(cols)
    for ix in range(5):
        for iy in range(3):
            for iz in range(2 if (ix + iy) % 2 else 3):
                n = names[(ix + iy * 2 + iz) % 4]
                cube(n, cols[n], (-1.9 + ix * 1.45, -0.86 + iy * 0.86, 1.95 + iz * 0.78), (1.35, 0.8, 0.72), bevel=0.04)
    pts = [(-6.6, -3.4, 0.4), (-3.5, -3.6, 1.0), (0, -3.8, 1.3), (3.5, -3.6, 1.0), (6.6, -3.4, 0.4)]
    for i, p in enumerate(pts):
        ball('route', 'yellow', p, 0.18, seg=12)
    tube('route', 'yellow', pts, 0.04)


# ═════════ xp4 Meta research: a heart and the ECG trace a multimodal model reads ═════════
def heart():
    pts = []
    for i in range(48):
        t = 2 * PI * i / 48
        x = 16 * sin(t) ** 3
        y = 13 * cos(t) - 5 * cos(2 * t) - 2 * cos(3 * t) - cos(4 * t)
        pts.append((x / 7.2, y / 7.2 + 0.1))
    with front():
        cube('paper', 'cream', (0, 0, -0.9), (11.4, 6.8, 0.2), bevel=0.1)
        for i in range(23):
            cube('grid', 'pink', (-5.5 + i * 0.5, 0, -0.76), (0.025 if i % 5 else 0.06, 6.6, 0.02))
        for j in range(14):
            cube('grid', 'pink', (0, -3.2 + j * 0.5, -0.76), (11.0, 0.025 if j % 5 else 0.06, 0.02))
        poly('pulse_heart', 'red', pts, 1.3, loc=(0, 0.1, 0), bevel=0.32, seg=4)
        ecg = [(-5.4, -0.2), (-3.6, -0.2), (-3.1, 0.2), (-2.6, -0.2), (-1.8, -0.2), (-1.4, -0.9), (-0.8, 2.6), (-0.3, -1.6), (0.1, -0.2),
               (1.0, -0.2), (1.6, 0.5), (2.3, -0.2), (3.2, -0.2), (3.6, 0.3), (4.0, -0.2), (5.4, -0.2)]
        tube('ecg', 'blue', [(x, y, 1.1) for x, y in ecg], 0.11)
        ball('pulse_dot', 'lime', (-0.8, 2.6, 1.15), 0.2, seg=14)
        for i, p in enumerate([(-3.2, -2.4), (3.0, -2.5), (0.0, -3.0)]):
            ball('leads', 'chrome', (p[0], p[1], 0.3), 0.26, seg=14)
            tube('leads', 'navy', [(p[0], p[1], 0.3), (p[0] * 0.6, p[1] * 0.5 - 0.2, 0.4), (p[0] * 0.2, -0.9, 0.5)], 0.045)


# ═════════ xp5 BMB Group x PepsiCo: a soda can, a phone running the app and an offline database ═════════
def can():
    cyl('can', 'blue', (-2.6, 0, 1.9), 1.15, 3.8, seg=40, bevel=0.04)
    cyl('can', 'cream', (-2.6, 0, 2.4), 1.17, 0.5, seg=40)
    cyl('can', 'red', (-2.6, 0, 1.9), 1.17, 0.5, seg=40)
    cyl('can', 'chrome', (-2.6, 0, 3.85), 1.1, 0.14, seg=40, r2=0.95)
    torus('can', 'chrome', (-2.6, 0, 3.92), 0.8, 0.05, seg=36)
    cube('can', 'chrome', (-2.9, 0, 3.98), (0.4, 0.3, 0.05), bevel=0.02)
    with front():
        phone('phone', (3.6, 0, 1.0), 2.9, 5.4, 0.36, body='navy', screen='cream')
        tiles = ['coral', 'yellow', 'mint', 'blue', 'pink', 'lilac', 'orange', 'sky', 'green']
        for i in range(9):
            cube('tiles', tiles[i], (3.6 - 0.8 + (i % 3) * 0.8, 1.0 + 0.9 - (i // 3) * 0.9 + 0.3, 1.3), (0.62, 0.62, 0.1), bevel=0.06)
    for i in range(3):
        cyl('db', 'mint', (0.35, 0, -1.0 + i * 0.75), 1.15, 0.6, seg=36, bevel=0.04)
        torus('db', 'navy', (0.35, 0, -0.7 + i * 0.75), 1.17, 0.05, seg=40)
    tube('arrows', 'coral', [(0.9, 0.9, 1.4), (1.8, 0.9, 2.6), (2.7, 0.9, 2.4)], 0.07)
    cyl('arrows', 'coral', (2.85, 0.9, 2.35), 0.2, 0.4, r2=0.02, rot=(0, PI / 2, -0.4), seg=12)


# ═════════ xp6 Intalio: OCR on a document, with detection boxes and a scan line ═════════
def ocr():
    with front():
        cube('paper2', 'yellow', (-0.9, 0.3, -0.35), (4.2, 5.6, 0.12), rot=(0, 0, 0.12), bevel=0.05)
        cube('doc', 'cream', (0, 0, 0), (4.4, 5.8, 0.16), bevel=0.06)
        widths = [3.2, 2.5, 3.3, 1.9, 3.0, 3.3, 2.2, 3.0, 1.6]
        for i, w in enumerate(widths):
            cube('text', 'navy', (-1.6 + w / 2, 2.3 - i * 0.58, 0.12), (w, 0.16, 0.05))
        cube('text', 'blue', (-1.6 + 0.7, 2.7, 0.12), (1.4, 0.34, 0.06))
        frame2('pulse_boxA', 'coral', (-0.4, 1.74, 0.2), 3.5, 0.5, 0.07)
        frame2('pulse_boxB', 'green', (-0.1, 0.0, 0.2), 3.2, 0.5, 0.07)
        frame2('pulse_boxC', 'blue', (-0.9, -1.74, 0.2), 2.2, 0.5, 0.07)
        cube('slide_scan', 'lime', (0, 0.5, 0.3), (4.6, 0.14, 0.2), bevel=0.04)
        cube('slide_scan', 'lime', (0, 0.15, 0.2), (4.6, 0.5, 0.04))
        magnifier('bob_lens', (3.9, -2.8, 0.9), R=1.2)


# ═════════ xp7 eMcREY: gears (automation), database cylinders (Oracle/MySQL) and XML brackets ═════════
def gears():
    with front():
        gear('roll_a', 'coral', (-1.7, 0.4, 0), 2.1, 14, 0.7, hub='navy')
        gear('rolln_b', 'yellow', (1.2, 2.1, 0), 1.45, 10, 0.7, hub='navy')
        gear('rolln_c', 'blue', (0.6, -2.1, 0), 1.05, 8, 0.7, hub='cream')
        for sgn, x in ((1, -5.3), (-1, -3.3)):
            cube('bob_xml', 'navy', (x + sgn * 0.0, -3.0 + 0.35, 0.3), (1.2, 0.3, 0.3), rot=(0, 0, 0.7 * sgn), bevel=0.08)
            cube('bob_xml', 'navy', (x + sgn * 0.0, -3.0 - 0.35, 0.3), (1.2, 0.3, 0.3), rot=(0, 0, -0.7 * sgn), bevel=0.08)
    for i in range(3):
        cyl('db', 'mint', (4.4, 0, -1.7 + i * 0.85), 1.3, 0.7, seg=36, bevel=0.04)
        torus('db', 'navy', (4.4, 0, -1.4 + i * 0.85), 1.32, 0.05, seg=40)
    cyl('db', 'lime', (4.4, -1.31, -0.85), 0.1, 0.06, rot=(PI / 2, 0, 0), seg=10)
    tube('pipe', 'navy', [(2.8, 0, 0.6), (3.4, 0, 0.9), (3.6, 0, 0.1)], 0.09)


# ═════════ education: a mortarboard, a diploma, books and a globe ═════════
def edu():
    books('', (-2.6, 0, -1.4), ['coral', 'blue', 'yellow'], n=3, w=3.6, d=2.5, t=0.6)
    mortarboard('bob_cap', (-2.6, 0, 0.5), 1.0)
    cyl('diploma', 'cream', (3.0, 0, -0.9), 0.5, 3.4, rot=(0, PI / 2, 0.15), seg=28, bevel=0.03)
    torus('diploma', 'red', (3.0, 0, -0.9), 0.52, 0.09, rot=(0, PI / 2, 0.15), seg=28)
    ball('diploma', 'red', (3.0, -0.5, -0.9), 0.2, seg=14)
    cyl('globe', 'navy', (0.5, 2.2, -1.3), 0.9, 0.3, r2=0.6, seg=28)
    ball('globe', 'blue', (0.5, 2.2, 0.3), 1.35)
    torus('globe', 'chrome', (0.5, 2.2, 0.3), 1.65, 0.06, rot=(0.4, 0.3, 0), seg=44)
    for i in range(4):
        blob('globe', 'mint', (0.5 + cos(i * 1.7) * 1.2, 2.2 - 0.6 - abs(sin(i * 1.7)) * 0.4, 0.3 + sin(i * 2.1) * 0.9), 0.4, (1, 0.35, 1), amp=0.3, seed=i)


# ═════════ contact: an envelope, paper planes and a chat bubble ═════════
def mail():
    with front():
        cube('envelope', 'cream', (0, 0, 0), (5.2, 3.5, 0.5), bevel=0.2, seg=4)
        poly('flap', 'coral', [(-2.6, 1.75), (2.6, 1.75), (0, -0.55)], 0.16, loc=(0, 0, 0.3), bevel=0.06)
        cyl('flap', 'red', (0, -0.5, 0.45), 0.3, 0.14, seg=24)
        cube('stamp', 'yellow', (1.9, 1.3, 0.3), (0.9, 1.0, 0.07), bevel=0.04)
        cube('stamp', 'coral', (1.9, 1.3, 0.35), (0.62, 0.72, 0.05))
        for i, (c, p) in enumerate([('mint', (-3.8, 2.8, 0.6)), ('sky', (3.9, -2.5, 0.8))]):
            cube(f'bob_bubble{i}', c, p, (1.9, 1.1, 0.4), bevel=0.3, seg=4)
            cyl(f'bob_bubble{i}', c, (p[0] + (0.5 if i == 0 else -0.5), p[1] - 0.8, p[2]), 0.32, 0.4, r2=0.02, rot=(0, 0, 0.5), seg=3)
    for i, (c, r, z, ph) in enumerate([('blue', 4.4, 2.6, 0.0), ('pink', 5.6, -1.3, 2.4)]):
        a = ph
        p = (r * cos(a), r * sin(a), z)
        g = f'orbit_plane{i}'
        poly(g, c, [(0, 1.5), (0.9, -0.9), (0, -0.4), (-0.9, -0.9)], 0.06, loc=p, rot=(0.3, 0.5, a), bevel=0.02)
        poly(g, 'cream', [(0, 1.4), (0.05, -0.8), (-0.05, -0.8)], 0.5, loc=(p[0], p[1], p[2] - 0.2), rot=(PI / 2 + 0.3, 0.0, a), bevel=0.01)


# ═════════ profile alt / intro: a briefcase and the timeline of roles ═════════
def briefcase():
    cube('case', 'blue', (-1.6, 0, 0.0), (4.4, 1.5, 3.1), bevel=0.36, seg=5)
    cube('case', 'yellow', (-1.6, 0, 0.1), (4.46, 1.56, 0.4), bevel=0.05)
    tube('case', 'yellow', [(-1.6 + 0.9 * cos(PI * i / 10), 0, 1.55 + 0.9 * sin(PI * i / 10)) for i in range(11)], 0.12)
    for sx in (-1, 1):
        cube('case', 'chrome', (-1.6 + sx * 1.05, -0.78, 0.55), (0.5, 0.1, 0.34), bevel=0.04)
    cube('cal', 'cream', (-5.2, 1.2, 1.0), (2.4, 0.2, 2.8), rot=(0, 0, 0.35), bevel=0.06)
    cube('cal', 'coral', (-5.2, 1.0, 2.1), (2.4, 0.22, 0.6), rot=(0, 0, 0.35), bevel=0.04)
    pts = [(2.2 + i * 0.75, 0, -1.3 + 0.45 * i + 0.25 * sin(i)) for i in range(7)]
    tube('tline', 'navy', pts, 0.06)
    for i, p in enumerate(pts):
        ball('bob_tl', ['mint', 'pink', 'yellow', 'coral', 'sky', 'lilac', 'lime'][i], p, 0.32, seg=18)


# ═════════ archive: a filing cabinet with colour-coded drawers and floating folders ═════════
def archive():
    cube('cabinet', 'navy', (-1.2, 0, 0), (3.3, 2.5, 4.8), bevel=0.2)
    for i, c in enumerate(['coral', 'yellow', 'mint']):
        z = 1.5 - i * 1.5
        cube('drawers', c, (-1.2, -1.3, z), (2.95, 0.14, 1.25), bevel=0.06)
        cube('drawers', 'chrome', (-1.2, -1.42, z + 0.15), (1.0, 0.1, 0.12), bevel=0.04)
        cube('drawers', 'cream', (-1.2, -1.4, z - 0.25), (1.2, 0.05, 0.3))
    for i in range(5):
        cube('papers', 'cream', (-1.2 + (i - 2) * 0.1, 0.1, 2.55 + i * 0.05), (2.4, 1.8, 0.05), rot=(0, 0, 0.12 * (i - 2)))
    for i, (c, p, a) in enumerate([('lilac', (3.1, -0.4, 1.8), 0.2), ('pink', (3.5, 0.2, 0.1), -0.15), ('sky', (3.0, -0.2, -1.7), 0.1)]):
        g = f'bob_folder{i}'
        cube(g, c, p, (2.5, 0.14, 1.8), rot=(0.05, 0, a), bevel=0.05)
        cube(g, c, (p[0] - 0.7, p[1], p[2] + 1.0), (1.0, 0.14, 0.3), rot=(0.05, 0, a), bevel=0.04)
        cube(g, 'cream', (p[0], p[1] - 0.1, p[2] - 0.05), (2.2, 0.04, 1.4), rot=(0.05, 0, a))


BUILDERS = {f.__name__: f for f in (
    laptop, orchestra, library, toolbox, scorecard, shield, call, loopguard, derm, oulad, shop, tower, market,
    nyc, brain, ship, heart, can, ocr, gears, edu, mail, briefcase, archive)}

if __name__ == '__main__':
    argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
    want = argv or list(BUILDERS)
    total = 0
    for name in want:
        new_prop()
        BUILDERS[name]()
        path, parts, tris = finalize(name, OUT)
        kb = os.path.getsize(path) / 1024
        total += kb
        print(f'PROP {name:11s} parts={parts:2d} tris={tris:6d} {kb:6.0f} KB')
    print(f'TOTAL {total:.0f} KB for {len(want)} props')
