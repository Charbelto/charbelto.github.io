# Authored assets

| Source | Output | What |
|---|---|---|
| `blender/build_agent.py` | `public/models/agent.glb` (≈ 460 KB, ≈ 14k polygons) | **Pip**, the toy agent character: rounded bevelled body, visor head, lime emissive eyes, antenna, two articulated arms, hover jet. Named nodes (`head`, `eye_L`, `eye_R`, `arm_L`, `arm_R`, `antenna`, `jet`) are animated in `src/scene/agent.js`. |

## Rebuild
Blender 5.1 (installed at `C:\Program Files\Blender Foundation\Blender 5.1`), headless, no add-ons, no network:

```bash
"C:/Program Files/Blender Foundation/Blender 5.1/blender.exe" --background --factory-startup --python assets/blender/build_agent.py
```

The script models every part from primitives with baked bevels, assigns Principled-BSDF materials using the site palette (clear-coated plastics, emissive lime/mint), and exports a GLB with `export_apply` and Y-up. It is the editable source: change a dimension or colour in the script and re-run.

## Licensing
Everything here was modelled for this project from scratch. No third-party models, textures or HDRIs.

## Not done
- No Draco/Meshopt compression (the file is small enough), no KTX2 (no image textures — all colour is material colour).
- No LODs. Pip is one 14k-polygon model shown in one chapter.
