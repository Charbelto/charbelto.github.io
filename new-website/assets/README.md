# Authored assets

| Source | Output | What |
|---|---|---|
| `blender/build_agent.py` | `public/models/agent.glb` (≈ 460 KB, ≈ 14k polygons) | **Pip**, the toy agent character: rounded bevelled body, visor head, lime emissive eyes, antenna, two articulated arms, hover jet. Named nodes (`head`, `eye_L`, `eye_R`, `arm_L`, `arm_R`, `antenna`, `jet`) are animated in `src/scene/agent.js`. |

## Chapter props (24)
`blender/build_props.py` (+ `blender/props_lib.py`) builds one GLB per chapter into `public/models/props/`: laptop, orchestra, library, toolbox, scorecard, shield, call, loopguard, derm, oulad, shop, tower, market, nyc, brain, ship, heart, can, ocr, gears, edu, mail, briefcase, archive. See `3D_ART_DIRECTION.md` for what each depicts.

```bash
"C:/Program Files/Blender Foundation/Blender 5.1/blender.exe" --background --factory-startup --python assets/blender/build_props.py            # all
"C:/Program Files/Blender Foundation/Blender 5.1/blender.exe" --background --factory-startup --python assets/blender/build_props.py -- derm ship   # some
```

How it is built: `props_lib.py` has bmesh primitives (cube, cylinder/cone, sphere, torus, swept tube, extruded outline, noise blob), composite helpers (gear, check, star, phone, magnifier, bot, books, mortarboard) and a `front()` context for building signs and screens in a camera-facing frame. Geometry is collected into **named part groups**; each group becomes a glTF node with its own pivot. The web scene assembles groups by scroll and animates them by name prefix (`spin_`, `roll_`, `rolln_`, `bob_`, `pulse_`, `swing_`, `slide_`, `orbit_`). Output is Draco-compressed (about 945 KB for all 24, 20 to 80 KB each).

A bug worth knowing about: BMesh reuses freed vertex slots after a bevel, so "the last N vertices" is not "the vertices I just made"; new vertices are tracked by identity.

## Pip (character)
Blender 5.1 (installed at `C:\Program Files\Blender Foundation\Blender 5.1`), headless, no add-ons, no network:

```bash
"C:/Program Files/Blender Foundation/Blender 5.1/blender.exe" --background --factory-startup --python assets/blender/build_agent.py
```

The script models every part from primitives with baked bevels, assigns Principled-BSDF materials using the site palette (clear-coated plastics, emissive lime/mint), and exports a GLB with `export_apply` and Y-up. It is the editable source: change a dimension or colour in the script and re-run.

## Licensing
Everything here was modelled for this project from scratch. No third-party models, textures or HDRIs.

## Not done
- No Draco/Meshopt compression (the file is small enough), no KTX2 (no image textures - all colour is material colour).
- No LODs. Pip is one 14k-polygon model shown in one chapter.
