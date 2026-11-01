# 3D Art Direction - "The Swarm" (v2: bright, full-colour)

> **Why v2 exists.** The first direction (a black, ceramic-and-titanium ring "engine") was reviewed by the owner and by an independent critic: it looked dark, heavy and generic next to the benchmark sites (Lusion, Lando Norris, Bruno Simon). Studying those sites live in a real browser showed what they actually do: **saturated, full-bleed colour worlds, huge type, glossy toy-like 3D, and a window of objects that behaves physically.** Direction v2 rebuilds the whole site around that. The engine, its materials and its camera rig were removed (they remain in git history).

## What I looked at (live, in a browser - not just search results)
| Site | Observed |
|---|---|
| **lusion.co** | Light lavender page (≈ `#F0F0FA`); a rounded window of glossy interlocking pieces in black / white / electric blue; huge grotesk type ("Bold Ideas, Brought to Life"); chunky pill UI; a heavy numeric loader. |
| **landonorris.com** | Full-screen electric lime (≈ `#D2FF00`) with a tiny dark mark - colour *is* the brand. |
| **bruno-simon.com** | Deep blue/violet world with neon rings and a grid of small blue crosses at load. |
| Awwwards 3D list / search | Confirms the 2025–26 trend: immersive real-time 3D; playful WebGL (BMO, Google Cloud demo) sits at the colourful end. Trend statistics in blog posts could not be verified. |

**Not copied:** no geometry, layouts, copy, palettes-as-a-set, or interaction code from any site. The shared ideas - *colour as identity, glossy objects, big type, physical play* - are generic; everything else here is original.

## v3: every chapter shows an object about its own topic
**The problem with v2:** the swarm morphed into abstract shapes (rings, spirals, funnels). Visually pleasant, but it read as random motion: nothing about a pile of toys explained what a chapter was about.

**The fix:** each chapter now has a **Blender-authored object that literally depicts the topic**, and scroll *assembles* it: its parts fly in from outside the object, staggered, and tumble into place; scrolling back takes it apart again (scrubbed, damped, fully reversible). Once built, parts move for a reason: the LoopGuard chain rolls, the breaker lever trips, gears mesh, the MRI and OCR scan bars sweep, signal rings pulse, the heart beats, Pip watches the cursor. The swarm only remains where it has a job: the hero identity, the dive tunnel, the interactive playground, and a light frame of confetti (about a quarter of the toys, shrinking if they would pass between the lens and the object).

| Chapter | Object (Blender-authored) | What it shows |
|---|---|---|
| Profile | **laptop** | An engineer's desk: code on the screen, mug with steam, plant, sticky notes |
| Meet Pip | **Pip** | The agent character; watches the cursor, waves on click |
| 01 Orchestration | **orchestra** | A chrome conductor hub wired to five little agents on a ring |
| 02 Retrieval | **library** | A shelf of books, a funnel of text chunks, a magnifier |
| 03 Tools / MCP | **toolbox** | A plug about to meet a socket, a wrench, a gear |
| 04 Evaluation | **scorecard** | A clipboard of ticks and one cross, a star rating, a badge |
| 05 Reliability | **shield** | A shield with a tick, a padlock, a circuit breaker |
| GREAT (3 chapters) | **call** | A call-centre headset, a phone mid-call with ringing waves, speech bubbles, a score card with stars |
| LoopGuard | **loopguard** | A chain loop that rolls forever, a tripped breaker lever, a stop sign, a trapped agent |
| DermSense | **derm** | A skin cross-section (epidermis, dermis, fat), a pigmented lesion with a heat map, a dermatoscope |
| OULAD | **oulad** | Stacked books, a graduation cap, a retention chart where some bars fall |
| Commerce microservices | **shop** | A shopping cart with parcels, service containers wired to a hub |
| Network Cell Analyzer | **tower** | A lattice cell tower with pulsing signal rings, a phone with signal bars |
| Supermarket graph | **market** | Two shelf aisles, a basket, the shortest path to the checkout |
| Experience intro | **briefcase** | A briefcase, a calendar and a timeline of seven dots |
| Gabriel & Co. | **nyc** | A New York skyline with an AI chip hovering over it |
| Chehab Lab | **brain** | A brain next to a stack of MRI slices with a scanner bar |
| CMA CGM | **ship** | A container ship loaded with coloured containers on a shipping route |
| Meta research | **heart** | A heart over ECG paper with the ECG trace running through it |
| BMB x PepsiCo | **can** | A soda can, a phone running the app, an offline database |
| Intalio | **ocr** | A document with text lines, detection boxes and a scanning line, plus a magnifier |
| eMcREY | **gears** | Meshing gears, database cylinders, XML angle brackets |
| Archive | **archive** | A colour-coded filing cabinet with floating folders |
| Education | **edu** | Books, a mortarboard, a diploma, a globe |
| Contact | **mail** | An envelope, paper planes in flight, chat bubbles |

All 24 props plus Pip live in `public/models/` (Draco-compressed, 945 KB for the 24 props, lazy-loaded when you get within two chapters). They are built by `assets/blender/build_props.py` (library in `props_lib.py`) with Blender 5.1 headless.

**Honest limits:** the models are built from bevelled primitives, tubes and extrusions, not sculpted or textured. They read clearly and match the toy language of the site, but they are simple. Details such as the DermSense heat map are flat glowing discs, not a shader. There are no per-object LODs.

## Concept (v2, now limited to hero, dive and playground)
One **swarm of ~360 glossy objects** (pills, rings, rounded cubes, spheres, pins - five original shapes, ~eight candy colours) that **morphs into a different formation for every chapter**, so the 3D *explains* the content instead of decorating it:

| Chapter | Formation | Colour story |
|---|---|---|
| Hero | loose cloud around a **chrome sun** with a ring | all colours |
| Profile | three spiral arms | all |
| **Meet Pip** *(new signature)* | halo orbits around a **Blender-authored character** that watches the cursor and waves on click | indigo world, lime eyes |
| Dive | a tunnel of rings rushing past the lens (FOV 72) | all |
| Orchestration | hub + three tilted orbits of agents | cream / yellow / mint orbits, blue hub |
| Retrieval | a spiral **funnel** drawing knowledge to a point | gradient down the funnel |
| Tools / MCP | a two-layer **socket lattice** | blue / cream checker |
| Evaluation | a **distribution** - toys stack into columns by colour | each column = a category |
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
Each chapter owns a background colour (`src/scene/keyframes.js`): lime → lilac → electric blue → coral → sky → sun-yellow → mint → pink → violet → blue → cream / peach / mint / lilac / sky / lemon → paper → lime. The director interpolates it **every frame** and publishes `--bg`, `--ink` (auto white/near-black for contrast) and `--ac` (accent) as CSS variables, so the **entire page - type, buttons, rules, cards - re-themes continuously as you scroll**. Plus: a blue loader that wipes upward, full-width marquee bands whose speed follows scroll velocity, and a click-ripple colour flood in the playground.

## Materials & light
Glossy clear-coated plastic (rings, pills, pins), satin ceramic (cubes), coloured chrome (spheres) and a mirror-chrome sun - all `MeshPhysicalMaterial`, colour per instance. Light is a **bright procedural studio** (white softboxes, cream strip, lilac floor bounce and three coloured cards - lime, coral, blue - so chrome reflects the palette). `NeutralToneMapping` keeps saturated colours saturated; exponential fog is tinted with the live background colour so distant toys melt into the page. Four lights total.

## Interaction
- **Pointer repulsion:** each toy is pushed away from the cursor (spring-damped, in the swarm's local space). Radius grows in the playground.
- **Click / filter / row-hover** → radial burst that settles.
- **Playground:** click anywhere → colour flood from the cursor + whole palette rotates; button does the same.
- Camera parallax from the pointer; scroll-driven camera path with damping (fully reversible).

## Pip - the authored character (second signature)
A small hovering agent modelled in **Blender 5.1** (ssets/blender/build_agent.py → public/models/agent.glb, ≈ 460 KB, ≈ 14k polygons): bevelled coral body with a chest dial, cream head with a visor and lime emissive eyes, antenna, articulated arms and a hover jet. He runs the *perceive → decide → act* loop of every agent I build: the head and eyes follow your cursor, he blinks, banks into your movement, and a click (or the button) makes him wave and hop. It is the one place the site shows a *character* instead of an abstraction.

## Original assets
No third-party models, textures or HDRIs. All geometry is primitive/Lathe/RoundedBox generated in code; the five shapes and every formation are original. (Honest limit: nothing is Blender-authored - Blender/Spline MCPs were not available.)
