# 3D Art Direction — "The Swarm" (v2: bright, full-colour)

> **Why v2 exists.** The first direction (a black, ceramic-and-titanium ring "engine") was reviewed by the owner and by an independent critic: it looked dark, heavy and generic next to the benchmark sites (Lusion, Lando Norris, Bruno Simon). Studying those sites live in a real browser showed what they actually do: **saturated, full-bleed colour worlds, huge type, glossy toy-like 3D, and a window of objects that behaves physically.** Direction v2 rebuilds the whole site around that. The engine, its materials and its camera rig were removed (they remain in git history).

## What I looked at (live, in a browser — not just search results)
| Site | Observed |
|---|---|
| **lusion.co** | Light lavender page (≈ `#F0F0FA`); a rounded window of glossy interlocking pieces in black / white / electric blue; huge grotesk type ("Bold Ideas, Brought to Life"); chunky pill UI; a heavy numeric loader. |
| **landonorris.com** | Full-screen electric lime (≈ `#D2FF00`) with a tiny dark mark — colour *is* the brand. |
| **bruno-simon.com** | Deep blue/violet world with neon rings and a grid of small blue crosses at load. |
| Awwwards 3D list / search | Confirms the 2025–26 trend: immersive real-time 3D; playful WebGL (BMO, Google Cloud demo) sits at the colourful end. Trend statistics in blog posts could not be verified. |

**Not copied:** no geometry, layouts, copy, palettes-as-a-set, or interaction code from any site. The shared ideas — *colour as identity, glossy objects, big type, physical play* — are generic; everything else here is original.

## Concept
One **swarm of ~360 glossy objects** (pills, rings, rounded cubes, spheres, pins — five original shapes, ~eight candy colours) that **morphs into a different formation for every chapter**, so the 3D *explains* the content instead of decorating it:

| Chapter | Formation | Colour story |
|---|---|---|
| Hero | loose cloud around a **chrome sun** with a ring | all colours |
| Profile | three spiral arms | all |
| Dive | a tunnel of rings rushing past the lens (FOV 72) | all |
| Orchestration | hub + three tilted orbits of agents | cream / yellow / mint orbits, blue hub |
| Retrieval | a spiral **funnel** drawing knowledge to a point | gradient down the funnel |
| Tools / MCP | a two-layer **socket lattice** | blue / cream checker |
| Evaluation | a **distribution** — toys stack into columns by colour | each column = a category |
| Reliability | a protective **shell** | all |
| **Playground** *(new signature)* | oversized storm all around the lens | cursor repels, click bursts + colour flood |
| GREAT | five **evaluation layers** that slide apart | one colour per layer |
| LoopGuard | a closed chain with a coral **breaker gate** | blue chain, coral gate |
| DermSense | stacked convolution layers | one colour per layer |
| OULAD | a **cohort of trajectories** that separates into bands; some drop out | mint / yellow / coral; dropouts turn black |
| Microservices | hub + six services + traffic links | one colour per service, black links |
| Network Cell Analyzer | lattice **mast** with broadcast rings | blue mast, warm rings |
| Supermarket graph | node clusters + edges | cluster colours, black edges |
| Experience | a **double helix** the camera climbs role by role | two strands |
| Archive / Education | calm drifting cloud | all |
| Contact | everything resolves into a **tidy rainbow ball** | latitude bands |

Formations are plain maths (`src/scene/swarm.js`); the director interpolates between neighbouring formations *and* between their colour meanings, so every transition is a physical morph with a colour shift.

## Full-screen colour (the "flood")
Each chapter owns a background colour (`src/scene/keyframes.js`): lime → lilac → electric blue → coral → sky → sun-yellow → mint → pink → violet → blue → cream / peach / mint / lilac / sky / lemon → paper → lime. The director interpolates it **every frame** and publishes `--bg`, `--ink` (auto white/near-black for contrast) and `--ac` (accent) as CSS variables, so the **entire page — type, buttons, rules, cards — re-themes continuously as you scroll**. Plus: a blue loader that wipes upward, full-width marquee bands whose speed follows scroll velocity, and a click-ripple colour flood in the playground.

## Materials & light
Glossy clear-coated plastic (rings, pills, pins), satin ceramic (cubes), coloured chrome (spheres) and a mirror-chrome sun — all `MeshPhysicalMaterial`, colour per instance. Light is a **bright procedural studio** (white softboxes, cream strip, lilac floor bounce and three coloured cards — lime, coral, blue — so chrome reflects the palette). `NeutralToneMapping` keeps saturated colours saturated; exponential fog is tinted with the live background colour so distant toys melt into the page. Four lights total.

## Interaction
- **Pointer repulsion:** each toy is pushed away from the cursor (spring-damped, in the swarm's local space). Radius grows in the playground.
- **Click / filter / row-hover** → radial burst that settles.
- **Playground:** click anywhere → colour flood from the cursor + whole palette rotates; button does the same.
- Camera parallax from the pointer; scroll-driven camera path with damping (fully reversible).

## Original assets
No third-party models, textures or HDRIs. All geometry is primitive/Lathe/RoundedBox generated in code; the five shapes and every formation are original. (Honest limit: nothing is Blender-authored — Blender/Spline MCPs were not available.)
