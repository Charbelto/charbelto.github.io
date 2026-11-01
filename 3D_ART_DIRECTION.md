# 3D Art Direction — "The Engine"

## Three directions explored

| | Concept | Verdict |
|---|---|---|
| **A — Intelligence Engine** | One monumental machine; scroll reveals its layers. | **Selected as the spine**, but reworked (see below). |
| **B — Inside the Intelligence** | Architectural interior the camera travels through. | Borrowed one idea: the *dive* — the camera flies down the machine's axis through concentric rings. Rejected as the whole site: too much environment modelling for the asset budget, and interiors read as generic "sci-fi corridor". |
| **C — Digital Monument** | Gallery of sculptural objects, one per capability/project. | Borrowed for the **Selected Works** chapter: each project is its own original procedural artifact in a separate arena. |

## Chosen direction: a gimbal engine + an exhibition

The central image is a **five-ring gimbal engine** around a glass-and-ember core. Each ring is one discipline in how I build AI systems:

1. Outer ring — **orchestration** (multi-agent systems)
2. **Retrieval** — a belt of titanium "chunks" converges inward during this chapter
3. **Tooling / MCP**
4. **Evaluation**
5. Inner ring — **reliability** (guardrails, circuit breakers)

It is a *model*, not decoration: the gimbal pins literally connect each ring to the next (the rings are nested transforms), the pulses on each ring's light channel carry the ring's colour, and the chapter focus brightens the ring being discussed.

The **GREAT** chapter turns the machine's axis vertical, flattens the gimbal and slides the rings apart into a stack: evaluation as layered stages (judge → ground → score → report).

## Materials (all physically based, procedural — no copied assets)
- **Dark ceramic** — clearcoated, near-black; carries the form.
- **Brushed titanium** — metalness 1 with anisotropy; proud plates, slats, bolts, pins.
- **Graphite** — secondary metal for tick marks and collars.
- **Smoked glass** — transparent clearcoat shell around the core.
- **Molten signal (#ff5a1f)** and **ice (#8fd0ff)** — the only emissive colours. Orange = work/energy, ice = counter-flow. Everything else stays neutral so the two accents read.

## Lighting
Image-based light from a **procedurally built studio** (overhead softbox, warm strip right, cool strip left, back rim) baked through PMREM — no HDR file to download. Plus one warm key, one cool rim, a point light at the core, and a cursor-following point light that sweeps highlights across the ceramic and titanium as the pointer moves. No bloom: glow is limited to additive light channels and the core, so weak geometry can't hide behind it.

## Camera language
Wide, low-ish 3/4 on the hero with the machine bleeding off the right edge; frontal axial *dive* through the rings (fov 62); orbiting medium-close frames for each ring; a high 3/4 pull-back for the exploded GREAT stack; a dolly down a vertical shaft to the gallery arena; a distant slow orbit under dimmed reading content; and a return to a centred frontal composition for the contact chapter. Camera, machine state and page dimming all interpolate from per-chapter keyframes (`src/scene/keyframes.js`) with exponential damping, so scrolling backwards is exactly reversible.

## Typographic integration
The name (`CHARBEL / TOUMIEH`, Archivo Expanded 800) sits **behind** the transparent WebGL canvas: the machine physically occludes it, so type and 3D share depth. Display type is Archivo (wide/heavy), accents Instrument Serif italic, labels JetBrains Mono.

## Storyboard
| Scroll | Shot | Page content |
|---|---|---|
| 0 | Hero: machine bleeds off right, name behind | Statement, CTAs, 3 verified stats |
| 1 | Profile: orbit left, machine right | Who I am |
| 2 | **Dive**: axial flight through the rings | "Step inside the system." |
| 3–7 | Five ring close-ups | Orchestration · Retrieval · Tools/MCP · Evaluation · Reliability |
| 8–10 | **GREAT**: exploded vertical stack | Problem · pipeline · outcomes + case modal |
| 11–16 | **Gallery arena**: six procedural artifacts | LoopGuard · DermSense · OULAD · Commerce microservices · Cell Analyzer · Supermarket graph |
| 17+ | Machine recedes and dims | Archive, experience, education, FAQ |
| end | Frontal reassembly | Contact CTA |

## Original assets
All geometry is generated in code (`src/scene/machine.js`, `src/scene/artifacts.js`): extruded arc segments, lathe profiles, instanced detailing, bespoke GLSL for light channels and the core. There are no third-party models, textures or HDRIs, so licensing is clean. **Honest limitation:** these are procedural, not Blender-authored; Blender MCP / Spline MCP were not available in this environment, so no `.blend`/`.glb` sources exist. The generator code *is* the editable source.
