# Performance and asset audit

Audit date 2026-11-01. Branch `redesign/3d-universe`, three 0.170.0, gsap 3.12.5, vite 5.4.11.
Scope: `src/main.js`, `src/scene/{world,machine,artifacts,keyframes}.js`, `src/style.css`, `index.html`, `public/`.
Nothing in the repo was modified by this audit. The production build was written to a scratch directory, never to `dist/`.

Every number is tagged **[measured]** (observed by a script, method in section 7) or **[estimated]** (derived arithmetically or from reading the code).
Line numbers refer to the files as they were at audit time and will drift while `src/` is being edited. Search for the quoted identifier if a line has moved.

## 0. Read this first: what was and was not measured

- All measured GPU-side runs used headless Chromium with **SwiftShader (software GL)**, reported as `ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero)...))`. This repo has not been profiled on a real GPU.
- **No FPS or frame-time figure in this document should be read as a performance claim.** Software-rasterised frame rates say nothing about how the site runs on a laptop iGPU, a discrete GPU or a phone. No FPS is reported.
- What the software run *can* give reliably: renderer call counts (draw calls, triangles, programs, geometries, textures), scene census, fragment-layer counts (overdraw), JS-side call sequences, bundle sizes, byte counts. These are deterministic and independent of the GPU.
- Load and long-task timings were taken on a desktop CPU shared with other running processes, so they are noisy (the same build gave 1.6 s and 2.9 s to remove the loader). They are reported as ranges. They are not field data.
- **Core Web Vitals are not met or unmet by this audit.** FCP, LCP and CLS were captured with `PerformanceObserver` in headless Chromium against `localhost`, with no network throttling, no CPU throttling and software GL. They are synthetic. INP was not measured. Real LCP, INP and CLS need field data (CrUX, or RUM via the `web-vitals` library) or at least a Lighthouse or WebPageTest run on a real device profile. No target is claimed to be met.

## 1. Headline findings

| # | Finding | Evidence |
|---|---|---|
| 1 | The scene is cheap on geometry and draw calls, and fill-bound by design. Hero is 68 draw calls and 158k triangles at the high tier. Vertex work will not be the limit on any current GPU. | measured, section 2 |
| 2 | Fragment cost is the real risk: opaque `MeshPhysicalMaterial` (clearcoat or anisotropy) evaluated against **6 lights in every state**, at up to DPR 2 with 4x MSAA. Two of the six lights (`galleryLight`, `galleryRim`) contribute nothing in non-gallery states, and `coreLight` contributes nothing in gallery states. | measured light count, section 3 |
| 3 | Transparent glow overdraw is **not** the problem it looks like. Transparent layers average 0.04 to 0.23 per viewport pixel and are about 10 to 16% of shaded fragments. | measured, section 3.3 |
| 4 | 43% of hero triangles (67.2k of 157.5k) are the 20 thin glow tori (6 radial segments, radius 0.0105 and 0.05). They are sub-pixel-thin tubes: poor GPU quad efficiency for no visual gain. | measured, section 2.2 |
| 5 | Shader programs are compiled but not link-validated or first-used until a state first draws them. In a browser without `KHR_parallel_shader_compile` (this software run) the first frame of the gallery blocked the main thread for about 0.7 to 1.35 s, spent in `getProgramInfoLog` and `getShaderInfoLog`. The first hero frame also produced a 0.1 to 0.95 s long task right after the loader was dismissed. Real-GPU magnitude is unknown. | measured (software GL), section 4 |
| 6 | Initial JS is 188 KB gzip (159 KB brotli), dominated by three.js (97.5% of the world chunk). It is reasonable. The 12 MB of legacy mockup screenshots has already been pruned from `public/`. | measured, section 5 |
| 7 | The DOM side adds avoidable compositor cost: `backdrop-filter: blur()` panels over an animating canvas, and a 4x-viewport animated `mix-blend-mode: overlay` grain layer. The GPU cost cannot be measured here. | static, section 6 |

## 2. Draw calls, triangles, materials, lights

### 2.1 Per scene state

**[measured]** `renderer.info.render` after a forced `renderer.render()` at each `data-kf` keyframe, 1440x900 viewport (390x844 touch for `low`).
`prefers-reduced-motion` was emulated so the director snaps exactly to each keyframe. That removes the lerp lag and makes counts deterministic. It does not change what is drawn.

| State (`?at=`) | Calls high / mid / low | Triangles high | Triangles mid | Triangles low |
|---|---|---|---|---|
| hero | 68 / 68 / 69 | 158.4k | 126.0k | 102.3k |
| profile | 71 / 71 / 72 | 158.6k | 126.2k | 102.5k |
| dive | 71 / 71 / 71 | 158.6k | 126.2k | 102.5k |
| cap1 | 73 / 73 / 72 | 158.7k | 126.3k | 102.5k |
| cap3 | 70 / 70 / 72 | 158.6k | 126.2k | 102.5k |
| cap5 | 67 / 67 / 68 | 158.4k | 126.0k | 102.3k |
| great1 (exploded) | 74 / 74 / 74 | 158.8k | 126.4k | 102.7k |
| great2 (exploded, close) | 63 / 63 / 68 | 158.1k | 125.7k | 102.3k |
| great3 | 72 / 72 / 73 | 158.7k | 126.3k | 102.6k |
| w1 gallery (LoopGuard) | 67 / 68 / 10 | 42.1k | 42.1k | 26.5k |
| w3 gallery (OULAD) | 34 / 34 / 7 | 78.6k | 78.6k | 43.9k |
| w6 gallery (graph) | 123 / 124 / 86 | 103.3k | 103.5k | 91.7k |
| xp / contact | 74 / 74 / 74, 70 / 70 / 68 | 158.8k, 158.6k | 126.4k, 126.2k | 102.7k, 102.3k |

Notes:
- All engine states are nearly identical (63 to 74 calls). The camera is always inside or near the machine, so frustum culling removes almost nothing. Per-state budgeting is really "engine state" versus "gallery state".
- Gallery states draw **zero** engine geometry: `holder.visible` is false (`world.js` near `holder.visible = !(inGallery && ...)`). The gallery group is hidden in all non-gallery states. Both toggles work as intended.
- Gallery counts depend on what is in frustum. `w2`, `w4`, `w5` were not sampled. `w6` is the worst sampled case (123 calls) because `cellTower` and `graphArt` build each strut as its own `Mesh`.
- `points: 380` (high) or `120` (low) is the dust `Points` in gallery states.
- The `mid` tier draws the same gallery as `high`. Gallery content does not scale with the tier except dust (`artifacts.js` `quality === 'low' ? 120 : 380`).

Scene census, **[measured]** (all objects, culled or not):

| | high | mid | low |
|---|---|---|---|
| scene objects / Mesh+Points | 269 / 221 | 269 / 221 | 269 / 221 |
| InstancedMesh (count) | 21 | 21 | 21 |
| total instances | 4,376 | 3,276 | 2,496 |
| triangle census (engine + gallery, instances counted) | 264.1k | 231.7k | 207.9k |
| unique materials / geometries | 53 / 212 | same | same |
| shader programs (`renderer.info.programs`) | 20 | 20 | 20 |
| `renderer.info.memory.textures` | 1 (the PMREM environment) | 1 | 1 |
| `renderer.info.memory.geometries` | 64 in hero, 184 after visiting all | | |

Visible-object mix in engine states (high, hero): 73 visible meshes = 51 `MeshPhysicalMaterial` + 22 glow `ShaderMaterial`. **23 are `transparent`**: 22 glow plus the glass shell. Gallery states: 148 visible, with 115 physical, 9 glow shader, 23 `MeshBasicMaterial` (the `ember` beads and tubes), 15 transparent.

Lights **[measured]**: `scene.traverseVisible` finds **6 lights in every state**: 3 `DirectionalLight` (key, rim, galleryRim) and 3 `PointLight` (coreLight, cursorLight, galleryLight). `galleryLight` and `galleryRim` are direct children of `scene`, not of `gallery.group`, so they are always collected. In the hero they sit about 70 units away and light nothing.
Three.js bakes the light count into the program cache key. Hiding a light later forces a recompile, so these must be handled by repositioning, not toggling (section 8, item 2).

### 2.2 Where the hero triangles go

**[measured]** high tier, engine only, 157.5k triangles, 139.6k vertices.

| Part | Objects | Triangles | Share |
|---|---|---|---|
| glow tori, line (r 0.0105) and halo (r 0.05), 6 radial x 280 tubular | 20 | 67,200 | 42.7% |
| instanced boxes: bezel ticks, face slats, iris fins | 11 | 22,032 | 14.0% |
| shard belt (1700 instanced boxes) | 1 | 20,400 | 13.0% |
| ring inner lips (full-circle `ExtrudeGeometry`, 57 curve segs, bevel 2) | 5 | 13,780 | 8.8% |
| ring ceramic bodies (merged extrude) | 5 | 13,740 | 8.7% |
| bolts (instanced 10-sided cylinders) | 5 | 12,000 | 7.6% |
| titanium plates (merged extrude) | 5 | 4,580 | 2.9% |
| core shell, inner glow lathe, disc, pins and collars, caps | ~21 | ~3,700 | 2.4% |

CPU-side geometry attribute bytes **[measured, array byteLength]**: engine 5.1 MB, gallery 2.1 MB at the high tier. Texture memory is one PMREM cube-UV target, roughly 6 MB **[estimated from the `PMREMGenerator` source: 3x256 by 4x256 half-float RGBA]**.

Heaviest gallery meshes **[measured]**: OULAD column field, 64 rounded boxes at 588 triangles each = 37.6k triangles for 0.22-wide bars (`artifacts.js` `new RoundedBoxGeometry(1,1,1,3,0.07)`); LoopGuard chain, 26 capsules at 700 triangles each = 18.2k (`CapsuleGeometry(0.085,0.22,6,14)`).

### 2.3 CPU per frame

- `gallery.update` median is 0.1 to 0.3 ms per frame **[measured]**, and the OULAD matrix upload is 64 instances (4 KB). It is not a bottleneck. `artifacts.js` `update()` also runs all six artifacts while only one is on screen; the gain from gating is below measurement noise.
- Main-thread script time averaged about 2.8 ms per rendered frame and style recalculation about 0.26 ms per frame, with about 1.35 recalcs per frame and zero layouts per frame (1,541 DOM nodes) **[measured, `Performance.getMetrics`, 17 frames, low sample count]**. The per-frame `document.documentElement.style.setProperty('--dim', ...)` (`world.js` near line 229) therefore costs little today. Move it to the `.dimmer` element if the DOM grows. It is not a priority.

## 3. GPU risk analysis

### 3.1 Resolution and MSAA

**[estimated from code]** `world.js:39-45`: DPR cap is 2, 1.5 and 1.25 for high, mid and low, with `antialias: true` on high and mid.
Drawing-buffer sizes, with the 1440x900 and 390x844 entries confirmed against `gl.drawingBufferWidth` **[measured]**:

| Display (CSS px, DPR) | Tier / cap | Buffer | Megapixels |
|---|---|---|---|
| 1440x900, DPR 2 | high / 2 | 2880x1800 | 5.18 |
| 1920x1080, DPR 2 | high / 2 | 3840x2160 | 8.29 |
| 2560x1440, DPR 2 | high / 2 | 5120x2880 | 14.7 |
| 820x1180 iPad, DPR 2 | mid / 1.5 | 1230x1770 | 2.18 |
| 390x844 phone, DPR 3 | low / 1.25 | 488x1055 expected (516x1117 measured, because the emulated mobile layout viewport is wider than 390) | 0.51 to 0.58 |

Fragment work scales linearly with these megapixels. With 4x MSAA, RGBA8 colour plus D24S8 depth, plus resolve and display buffers, framebuffer memory is about 40 bytes per pixel **[estimated, driver dependent]**: roughly 207 MB at 1440x900 DPR 2, 330 MB at 1080p DPR 2, 590 MB at 5K. DPR 2 with MSAA is double supersampling on a dark scene overlaid with a grain texture. It is the most expensive per-pixel choice available, and it is applied to the exact audience (desktop retina) that least needs it.
`pickQuality()` (`main.js:22`) returns `high` for any non-touch window of 1100 px or wider with more than 4 cores, whatever the pixel count. Every touch tablet or iPad is `mid`.

### 3.2 Material and light cost (the dominant per-fragment term)

- 51 of the 73 hero objects are `MeshPhysicalMaterial`. The variants in play:
  - **ceramic**: `clearcoat: 1`, the largest surface area in the hero (all ring bodies). Clearcoat runs a second GGX BRDF per light plus a second env lookup.
  - **titanium**: `anisotropy: 0.85`. It adds the anisotropic D and V terms per light and the bent-normal IBL path. It is applied to 0.02-thick slats, bolts, pins, fins and caps, where anisotropy cannot be seen, as well as the plates and lip where it can.
  - **graphite, shard**: plain physical.
  - **glass shell**: physical with clearcoat, `transparent`, `DoubleSide`. Three.js renders a transparent double-sided material as two passes (back, then front), so this is two full physical-shader passes over the core area.
- All of the above are evaluated against **6 lights** (section 2.1), of which at most 4 are ever useful in a given state.
- Fog (`FogExp2`) on 51 opaque materials is a few ALU ops and is negligible. The custom glow `ShaderMaterial`s do not include fog chunks (so they are not fogged; this is a visual note only).
- Tone mapping (ACES) is applied in-material; there is no post-processing and no extra full-screen pass. This is good.
- No shadows, no postprocessing, no render targets in the frame loop. The PMREM render targets are built once at startup and disposed.
- Side note, not performance: `envMapIntensity` on every material is **ignored**. In three r170, with `scene.environment` set and no per-material `envMap`, the uniform is overwritten by `scene.environmentIntensity` (`three.module.js` around line 30975, the `material.envMap === null && scene.environment !== null` branch). The per-material tuning of 1.15, 1.25, 1.6 and 1.2 therefore has no effect. If the intent was a hotter glass or titanium, set `envMap` per material or adjust colours and roughness.

### 3.3 Overdraw **[measured]**

Method: re-render each state into an 8-bit render target with every material replaced by an additive 1/255 unlit material, then read back the red channel (so 1 level = 1 fragment). Counts are per viewport pixel and independent of resolution.

| State | All fragments, no depth test (worst case) | Opaque, depth tested and z-sorted (near best case) | Transparent only, occluded by opaque | Fraction of viewport covered by opaque |
|---|---|---|---|---|
| hero | 1.41 | 0.75 | 0.11 | 28% |
| dive | 2.40 | 1.31 | 0.12 | 48% |
| cap1 | 1.86 | 0.85 | 0.12 | 31% |
| cap5 | 2.29 | 1.22 | 0.23 | 52% |
| great1 | 1.03 | 0.49 | 0.06 | 18% |
| great2 | 1.47 | 0.62 | 0.15 | 22% |
| w1 (gallery) | 0.19 | 0.11 | 0.04 | 5% |
| w6 (gallery) | 0.21 | 0.13 | 0.05 | 6% |
| contact | 2.58 | 1.39 | 0.16 | 55% |

On the 390x844 low-tier viewport the hero is 1.95 / 1.04 / 0.15, `great2` is 2.62 / 1.17 / 0.23, and the other states fall inside the desktop ranges.

Reading it:
- Real shaded-fragment overdraw is between the two opaque columns. Three.js sorts opaque objects by `renderOrder`, then material id, then depth, so early-z is not at its best. The upper bound is under 2.6 layers per pixel.
- Transparent glow is only 0.04 to 0.23 layers per pixel (maximum stack 9, covering 2 to 12% of the viewport). It is roughly 10 to 16% of shaded fragments. **The "glow torus halos and shell overdraw" risk is small at the fragment level.** The cost of the tori is their triangle count, not their fill.
- At 1440x900 DPR 2, the hero shades about 5.18M x 0.75 to 1.41 = 3.9M to 7.3M physical-material fragments per frame. In `dive` and `contact` it is about 7M to 13M. Each is evaluated against 6 lights, clearcoat and env lookups. The headroom on a discrete GPU is large. On integrated or mobile GPUs it is the likely limit.

## 4. Startup and compile behaviour

**[measured]** headless Chromium, SwiftShader, production build served by `vite preview`, localhost. Ranges are across 2 to 3 runs.

| | high | mid | low (390x844 touch) |
|---|---|---|---|
| loader dismissed (`is-done` class) | 1.58 to 2.95 s | 1.90 to 3.45 s | 1.98 to 2.74 s |
| long tasks before loader dismissal | 3 to 6 (54 to 359 ms each) | 3 to 5 (80 to 466 ms) | 2 to 3 (54 to 146 ms) |
| long task at the first frame (loader dismissal) | 105 to 749 ms | 699 to 954 ms | 492 to 502 ms |
| FCP, which is the loader paint (synthetic) | 0.84 to 1.48 s | 0.80 to 1.66 s | 0.83 to 0.99 s |
| CLS (synthetic) | 0.007 | 0.007 | 0.004 to 0.006 |
| console | one warning: `KHR_parallel_shader_compile extension not supported.` | same | same |

Breakdown of the loader percent steps in the quietest high run: 35% at 731 ms (index chunk executed), 62% at 1,000 ms (`createWorld` took about 270 ms: geometry build, PMREM, renderer), 88% at 1,127 ms (`compileAsync` about 127 ms), 100% at 1,576 ms (about 450 ms from `document.fonts.ready` plus `remeasure`, `start`, `ScrollTrigger.refresh`).
The LCP element was `.bt-line` or the loader text (`SPAN.loader-text`) depending on the run, so LCP here just mirrors the first paint of the loader. It says nothing about when the 3D scene is usable.

What the gallery-entry stall looks like **[measured]**: three fresh loads, first `renderer.render` after scrolling to `w1`:

| Frame | Time | Geometries |
|---|---|---|
| frame before | 1 to 2 ms | 64 |
| first frame with the gallery in frustum | **668, 682 and 870 ms** | 64 to 132 |
| following frames | 1 to 4 ms | 132 |

Instrumenting `WebGL2RenderingContext` for that single frame (one instrumented run) shows the time went to `getProgramInfoLog` (764 ms, 5 calls) and `getShaderInfoLog` (577 ms, 10 calls), not to buffer uploads (`bufferData` 0.6 ms over 267 calls). `renderer.info.programs` is already 20 before the stall, so the programs exist. Their link status is first read when a draw first uses them.
`compileAsync` only avoids this when `KHR_parallel_shader_compile` exists. Without it three.js falls back to blocking behaviour and defers validation. Desktop Chromium on a real GPU exposes that extension, so the stall will be smaller there. Support on other browsers and mobile GPUs varies and must be checked on target devices.
Also: `renderer.compile`'s traversal covers materials of hidden objects, so the gallery programs are created at load. The first draw is what blocks.

Geometry GPU upload is lazy: the 68 gallery geometries (2.1 MB) upload when frustum culling first lets them draw. This is cheap here but also lands in the same first frame.

## 5. Bundle and static assets

Built with `npx vite build --outDir <scratchpad>/dist-audit` **[measured]**.

| File | Raw | gzip -9 | brotli |
|---|---|---|---|
| `assets/world-*.js` (three.js plus scene) | 538.3 KB | 139.3 KB | 115.6 KB |
| `assets/index-*.js` (gsap, ScrollTrigger, `main.js`) | 121.5 KB | 48.3 KB | 43.1 KB |
| `assets/index-*.css` | 20.9 KB | 5.5 KB | 4.8 KB |
| `index.html` | 36.5 KB | 10.5 KB | n/a |
| JS total | 659.8 KB | 187.6 KB | 158.7 KB |

Vite's own reported gzip figures (140.65 KB and 48.56 KB) agree to within 1 KB.

What dominates (esbuild metafile of the same entry points, minified, **[measured]**):
- `world` chunk: three.js 524.9 KB (97.5%), app code 22.2 KB (`artifacts` 8.3, `machine` 7.1, `world` 5.5, `keyframes` 1.4), three addons 5.2 KB (`BufferGeometryUtils` 3.7, `RoundedBoxGeometry` 1.5).
- Whole three.js with no tree-shaking is 684.7 KB minified, so tree-shaking already removes about 160 KB (23%). The remainder is mostly `ShaderChunk` GLSL strings that any `MeshPhysicalMaterial` needs. There is little left to shave except by dropping physical materials.
- `index` chunk: gsap 112 KB of 120 KB: `gsap-core` 51.2, `ScrollTrigger` 33.6, `CSSPlugin` 18.4, `Observer` 8.8 (pulled in by ScrollTrigger). `main.js` itself is 6.5 KB.
- The world chunk is loaded by `import('./scene/world.js')` at `main.js:185`, after the index chunk executes. The built `index.html` has no `modulepreload` for it, so it is a two-step waterfall (one extra RTT on a cold load).
- `three` shares a chunk with the app code. Any edit to `scene/*.js` changes the hash of a 540 KB file, so returning visitors re-download about 140 KB gzip after every deploy.

Fonts **[measured, bytes decoded]**: initial page load fetched 914.9 KB decoded in total. Application files are 741.9 KB. The rest, about 172 KB, is Google Fonts (Archivo variable 90.1 KB, JetBrains Mono 31.4 KB, Instrument Serif 22.1 KB plus 21.0 KB). Estimated over-the-wire total with gzip and brotli fonts is about 390 KB **[estimated]**.
`index.html:21-23` loads the font CSS from a third-party origin as a render-blocking stylesheet. `main.js:199` also holds the loader open for up to 1.8 s on `document.fonts.ready`.

`public/` and `dist/`:
- At audit start `public/` was 12 MB. It held 13 mockup PNGs (9.8 MB), 13 WebP twins (1.26 MB) and `legacy-index.html` plus `legacy-script.js` (84 KB). A first production build produced a **13 MB `dist/`**. None of the screenshots or the legacy files are referenced by the current `index.html`, `src/` or `style.css`.
- **They have since been removed from `public/` (verified during the audit):** `public/` is now 633 KB and the rebuilt output is 1.35 MB.
- Remaining in `public/`: `Charbel_Toumieh_Resume.pdf` 503 KB (linked, downloaded on demand, fine), `profile.jpg` 24 KB (used), `styles.css` 65 KB (legacy stylesheet, used only by `404.html`, `privacy.html`, `terms.html` and `thank-you.html`, which also pull a different Google font, Space Grotesk), `robots.txt`, `sitemap.xml`.
- `docs-shots/` at the repo root is empty and is not in `public/`, so it never ships. Do not put anything in `public/` that is not linked from the live page.
- Not a performance issue but worth noticing: `vite.config.js` uses `base: './'`. `404.html` uses relative asset paths, which break when GitHub Pages serves it for a nested URL such as `/foo/bar`.

## 6. DOM and CSS cost that sits on top of the canvas

All **[estimated from code]**; the GPU cost is not measurable in this environment. The canvas redraws every frame, so everything composited above it is invalidated every frame.

- `style.css` `.panel` (line 128) and `.wide` (line 134) use `backdrop-filter: blur(16px)`. Each visible panel re-blurs the region of the live canvas under it every frame. The `.menu` (line 87, blur 22px), `.modal` (line 241, blur 10px), `.btn--ghost` (line 122, blur 8px) and `.menu-btn` (line 82, blur 10px) add more.
- `.grain` (line 51): `position: fixed; inset: -50%` = a layer 4x the viewport area, `mix-blend-mode: overlay`, with a 1.2 s `steps(6)` transform animation. A blend-mode layer over a continuously changing WebGL canvas forces an isolated render surface and a full-viewport blend each frame, and the layer is 4x larger than it needs to be.
- `.dimmer` is a full-screen translucent overlay (cheap).
- `main.js:54` animates `filter: blur(14px)` on the two huge title lines during the intro (about 3 s, once).
- `main.js:88`: the scroll listener reads `documentElement.scrollHeight` on every scroll event. Combined with a style write each frame this can force layout. Cache the max in the `remeasure` path.
- `world.js:124-131` and `:235`: `resize()` calls `renderer.setSize` (reallocates the drawing buffer, and the MSAA buffers) plus `measure()` (`getBoundingClientRect` on every `[data-kf]`) on every `resize` event. On mobile browsers the address bar collapsing during scroll fires `resize` with a changed `innerHeight`, so this runs during normal scrolling.

## 7. Methodology (reproducible)

Scratch tooling lived outside the repo (Playwright installed as `playwright-core` in a scratchpad directory, so `package.json` is unchanged).
Chromium launch args: `--use-gl=angle --use-angle=swiftshader --enable-unsafe-swiftshader --ignore-gpu-blocklist`, using the machine's cached Playwright headless shell.

```js
// after load, in page context (window.__world is exposed by main.js)
const w = window.__world, i = w.renderer.info;
w.renderer.render(w.scene, w.camera);                 // one deterministic frame
({ calls: i.render.calls, tris: i.render.triangles, points: i.render.points,
   geometries: i.memory.geometries, textures: i.memory.textures, programs: i.programs.length });
```

- States: for each `[data-kf="<name>"]`, scroll its centre to mid-viewport, wait for settle, read the counts above. Run under `reducedMotion: 'reduce'` so the director snaps exactly to the keyframe.
- Timings: `PerformanceObserver` for `longtask`, `paint`, `largest-contentful-paint` and `layout-shift`, installed with `addInitScript`. A `MutationObserver` on `#loaderPct` and `#loader` gave the loader stage timeline. Production build via `vite preview`.
- Overdraw: `scene.overrideMaterial` (additive, 1/255 red, `fog: false`, `toneMapped: false`) into a 720x450 `WebGLRenderTarget`, `readRenderTargetPixels`, sum per pixel. Variants: no depth test; opaque only with depth test; opaque depth-only prepass followed by transparent-only with depth test.
- Stall attribution: every `WebGL2RenderingContext.prototype` method wrapped with `performance.now()` accumulation, enabled only around the single `render()` of interest.
- Bundle: `vite build --outDir <scratch>`; esbuild `--metafile` for module composition; `gzip -9` and Node `zlib.brotliCompressSync` for sizes.

## 8. Ranked optimisations

Impact labels: **[est]** are arithmetic or reasoned, to be confirmed on a real GPU. **[meas]** are backed by a number in this document.

### 1. Cap total pixels, drop MSAA at high DPR, add a resolution governor (highest impact on fill)
- `world.js:38-45`, `main.js:22-30`.
- Set caps by pixel budget rather than DPR alone: high 1.5 (about 3.2 MP at 1440x900 and never above about 4 MP), mid 1.25, low 1.0 to 1.25.
- Use `antialias: true` only when the final DPR is below about 1.5. At DPR 1.5 or more, MSAA on a dark scene buys little.
- Add a frame-time governor that steps `renderer.setPixelRatio` down (and back up) from measured `dt` on the real device. The existing `dt` is already computed in `frame()`.
- **[est]** 5.18 MP to 3.2 MP is 38% fewer fragments. 1.25 gives 56% fewer. MSAA framebuffer memory falls from about 200 MB to about 125 MB at 1440x900 and removes the 5K case (590 MB) entirely.

### 2. Cut the light count from 6 to 4, always, without changing it at runtime
- `world.js:58-81`.
- Do not toggle `visible` on lights: the count is part of the program key and changes cause recompiles (the exact stall seen in section 4). Instead, drive `galleryLight` and `galleryRim` by moving `coreLight` and `key` (or `rim`) to the gallery position when `cur.cy < -10`, and delete the two extra lights.
- On the `low` tier go to 2 lights (key plus `coreLight`). The PMREM environment (`buildEnvironment`) already supplies softbox key, cool and warm strips.
- **[est]** Per-fragment direct-lighting work (two BRDFs per light on clearcoat materials) drops by a third at 4 lights and by two thirds at 2. It is the cheapest large saving because it is free visually in every non-gallery state.

### 3. Warm up under the loader: force link validation and uploads before the first visible frame
- `main.js:191` (`world.compile()` then `start()` at `:201`), `world.js:251`.
- After `compileAsync`, do one real render per state class while the loader is still opaque: hero, then gallery, with `frustumCulled = false` set temporarily on the gallery objects (or the camera briefly pointed at them) and a 1x1 scissor so no pixels are wasted. Then restore. Await a frame between them so the browser stays responsive.
- Keep `finishLoader()` after that, not before the first `frame()`.
- **[meas, software GL]** removes a 670 to 870 ms main-thread block at gallery entry and the 0.1 to 0.95 s long task at loader dismissal. **[est]** On a real browser with parallel shader compile, the benefit is smaller but the first-use link and upload risk on mobile GPUs is real. Verify on a device.

### 4. Replace the 20 glow tori with flat ribbons (or at least 3 radial segments)
- `machine.js:166-168` (`TorusGeometry(rMid, 0.0105, 6, quality.torus)` and `(rMid, 0.05, 6, ...)`).
- The glow shaders only use `vUv.x` (the along-ring coordinate), so a flat `RingGeometry`-style ribbon with a custom uv (angle) works. Alternatively drop `radialSegments` from 6 to 3 as a drop-in.
- **[meas]** Tori are 67.2k of 157.5k engine triangles (42.7%). Radial 3 saves 33.6k (-21% of the hero). Ribbons (2 triangles per tubular segment, 11.2k total at 280) save 56k (-36%, hero 158.4k to about 102k). The tubes are sub-pixel-thin at typical distances, so quad efficiency also improves. The visible silhouette of the halo will change slightly and needs an art check. This is a vertex-side saving and matters most on mobile tile GPUs and for the mid and low tiers.

### 5. Right-size the materials
- `machine.js:41-43` (titanium anisotropy), `:50-53` (glass), `:312` (shard material), `artifacts.js:120` (OULAD clearcoat), `:172`, `:295`.
- Keep `anisotropy` only on ring plates and lips. Use a `MeshStandardMaterial` clone for slats, bolts, pins, fins, caps, tubes and gallery links. This removes the anisotropic path from tiny geometry that cannot show it.
- Replace the transparent, `DoubleSide`, clearcoat glass shell with a cheap fresnel-style `ShaderMaterial` (as the glow shaders already do) or set `forceSinglePass = true` and `side: FrontSide`. This avoids two full physical passes over the screen centre, which is exactly where the `dive`, `cap5` and `contact` states are most covered.
- On `low`, set `clearcoat = 0` on ceramic and bone. That switches the program to the non-clearcoat variant.
- **[est]** Meaningful, not dramatic. Largest on iGPU and mobile. Fix `envMapIntensity` (section 3.2) at the same time so the look is intentional.

### 6. Remove the compositor extras on mid and low (and trim them on high)
- `style.css:51-56` (`.grain`), `:128`, `:134`, `:87`, `:122` (`backdrop-filter`).
- Have `main.js` set `document.documentElement.dataset.q = quality`. In `[data-q="low"]` and `[data-q="mid"]` use solid `rgba(10,11,14,0.86)` panels with no `backdrop-filter`, and no grain.
- On high, make the grain `inset: 0` (not -50%), drop `mix-blend-mode`, and use a pre-rendered static noise PNG or WebP at about 0.04 opacity. Reduce panel blur from 16px to about 8px.
- **[est]** Likely the largest single mobile improvement, because the blur and blend work is paid on top of every canvas frame. Cannot be quantified without a real GPU or a mobile trace.

### 7. Guard against mobile address-bar resize churn
- `world.js:124-131`, `:235`, `main.js:206`.
- In `resize()`: if the width is unchanged and the height changed by less than about 120 px (or 15%) on a coarse-pointer device, only update `camera.aspect` and skip `renderer.setSize` and `measure()`. Size the canvas with `100lvh` (or a fixed `100svh` plus overscan) so it does not need to change.
- **[est]** Avoids repeated drawing-buffer and MSAA reallocation during scroll on phones.

### 8. Fonts and the loader gate
- `index.html:21-23`, `main.js:199`.
- Self-host subset WOFF2 files (Latin only) with `rel="preload"`, or at least preload the two used above the fold. Remove the third-party render-blocking stylesheet. Cut the `document.fonts.ready` race from 1800 ms to about 400 ms. The loader should not wait on typography.
- **[meas]** About 165 KB of font data and the 88 to 100% loader step (about 450 ms in the quiet run) are font-gated. **[est]** Direct reduction in time to loader dismissal and removal of a render-blocking cross-origin request.

### 9. Throttle when the scene is not the subject
- `world.js:147-148`, `main.js:66-100` (menu and modal).
- While `cur.dim > 0.5` (the `xp` and `edu` chapters, where text covers a 62% dimmed scene), render at about 30 fps and DPR 1. Skip `renderer.render` entirely while `#menu` or `#caseModal` is open, because both are full-screen opaque overlays. On `low`, cap at 30 fps always.
- **[est]** About half the GPU duty in those chapters, and battery on phones.

### 10. Trim the gallery geometry and merge static tubes
- `artifacts.js:121` (`RoundedBoxGeometry(1,1,1,3,0.07)` x 64 = 37.6k triangles) to a plain `BoxGeometry` (12 triangles) or one segment.
- `artifacts.js:29` (`CapsuleGeometry(..., 6, 14)` x 26 = 18.2k) to about `(…, 3, 8)`.
- `artifacts.js:16-22`, `:208-230`, `:296-304`: `tube()` creates one `Mesh` per strut. Merge each artifact's static struts with `mergeGeometries`. The animated beads and the highlighted path stay separate.
- **[meas]** `w3` 78.6k to about 45k triangles; `w6` 123 draw calls to about 10 to 25. Draw calls are not the binding constraint on desktop, so this matters mainly for low-end and mobile.

### 11. Bundle caching and the load waterfall
- `vite.config.js`: add `build.rollupOptions.output.manualChunks: { three: ['three'], gsap: ['gsap', 'gsap/ScrollTrigger'] }`.
- Kick off `import('./scene/world.js')` at the top of `main.js` (before `boot()`'s DOM work), and consider a `modulepreload` hint for the chunk.
- **[meas]** Today every scene edit changes a 540 KB chunk (140 KB gzip). With split chunks only the 22 KB app part changes between deploys. **[est]** Removes a one-RTT waterfall on cold load.
- Optional: replace gsap plus ScrollTrigger (112 KB raw, about 45 KB gzip) with `IntersectionObserver` plus CSS for the reveals. Only worthwhile if bytes become the priority.

### 12. Smaller items
- Move `--dim` onto `.dimmer` and write it only when it changes by more than 0.002 (`world.js` near line 229). **[meas]** about 0.26 ms per frame style cost today, so low priority.
- Cache `scrollHeight - innerHeight` instead of reading it on each scroll event (`main.js:88`).
- Instance count tuning for `low`: shards 420, ticks 120, and torus 140 are already scaled. Consider shards at about 250 and gallery dust off on `low`.
- `.back-title` and the loader are fine. `pointermove` is already skipped on `low`.

## 9. Mobile and low-tier recommendations (summary)

The `low` tier is chosen for touch devices narrower than 820 px. Today it still draws 68 to 74 engine calls and about 102k triangles per frame, with 6 physical-material lights, and puts blur and blend layers above the canvas.

1. Keep `antialias: false` and DPR at or below 1.25. Add the pixel-budget governor (item 1).
2. 2 lights, no clearcoat, no anisotropy (items 2 and 5). Replace the glass shell with a fresnel shader.
3. Flat-ribbon glow, which brings the hero to about 70k triangles (item 4). Shards 250.
4. No `backdrop-filter`, no grain (item 6). 30 fps cap and pause behind the menu and modals (item 9).
5. Resize guard for the URL bar (item 7). Warm-up under the loader (item 3), because mobile browsers are the most likely to lack parallel shader compile.
6. `pickQuality()` detects phones with `pointer: coarse` and width below 820. It will not downgrade a weak desktop or a low-end Android tablet (`mid` at DPR 1.5, MSAA on). Pair it with the governor and consider a short one-second benchmark at boot.
7. The `reducedMotion` path already snaps the director and stops spin. It still renders every frame at full cost, so it could render on demand only when the scroll target changes.

## 10. Honest limitations

- No real-GPU profiling: no frame times, no GPU memory readings, no thermal behaviour, no tile-GPU behaviour. The shader-cost ranking (items 2 and 5) is reasoned from the three.js physical-material source, not timed.
- Software-GL stalls (section 4) show a mechanism (deferred link validation). Their size on real hardware is unknown, and the absence of `KHR_parallel_shader_compile` in the measured environment is exactly what exposes them.
- Overdraw counts come from replacing materials with an unlit additive override. They count rasterised fragments per pixel, not shader cost per fragment.
- Load timings are noisy (shared machine, localhost, no throttling) and are shown as ranges. FCP, LCP and CLS are synthetic. INP was not measured. Field data is the only valid source for Core Web Vitals.
- Memory figures marked [estimated] (MSAA framebuffers, PMREM target) are arithmetic from the formats and sizes, not driver readings. Chrome may reduce MSAA sample counts or disable it on large buffers.
- Gallery states `w2`, `w4`, `w5` and keyframes `cap2`, `cap4`, `edu` were not sampled. Engine states are near-identical in draw count, and the gallery pieces are covered by `w1`, `w3` and `w6`.
- The scene source was being edited during the audit. The final measurements were taken against a build made at about 11:3x local time. Re-run the section 7 snippets after structural changes.

---

# Addendum - refinement phase (2026-11-01)

## A. Real-GPU measurements (new) - what they are and are not
The in-app browser pane of this session runs Chromium on a **real GPU**: `ANGLE (NVIDIA GeForce RTX 4070 Laptop GPU, Direct3D11)`. Using the new `?perf=1` HUD and a small in-page sampler (2.5 s per scene, camera snapped to each chapter) at an emulated **1920×1080 viewport, devicePixelRatio 1.25** (drawing buffer ≈ 2400×1350, `high` tier, dev server, resolution governor on):

| Scene | fps | avg frame | worst frame | draw calls | triangles |
|---|---:|---:|---:|---:|---:|
| hero | 142 | 7 ms | 14 ms | 67 | 114k |
| dive | 143 | 7 ms | 14 ms | 75 | 114k |
| retrieval (cap2) | 143 | 7 ms | 8 ms | 75 | 114k |
| GREAT exploded (great1) | 143 | 7 ms | 8 ms | 75 | 114k |
| GREAT core close-up (great2) | 143 | 7 ms | 14 ms | 65 | 114k |
| gallery · OULAD (w3) | 143 | 7 ms | 8 ms | 37 | 41k |
| gallery · microservices (w4) | 143 | 7 ms | 14 ms | 100 | 54k |
| experience step (xp2) | 144 | 7 ms | 8 ms | 71 | 114k |
| contact | 143 | 7 ms | 14 ms | 69 | 114k |

**Reading this honestly:** every scene sat at the display's refresh rate (~144 Hz, vsync-capped), so the GPU frame time is *below* ~7 ms - but the cap hides how far below. This proves the experience holds a full refresh rate on a high-end laptop GPU at a large, high-DPI viewport. It does **not** say anything about integrated GPUs, phones, or other browsers. The governor never stepped down (0 steps). Measured on the Vite **dev** server (unbundled) in one session; single run per scene.

**Not measured, so not claimed:** Lighthouse score, LCP, INP, CLS, GPU memory, battery/thermals, real phones/tablets, Safari/Firefox. Software-GL numbers from earlier in this document remain meaningless for FPS.

## B. Optimisations implemented from section 8
| # | Item | Status |
|---|---|---|
| 1 | Pixel caps + resolution governor | **Done.** DPR caps 1.75 / 1.25 / 1.0 per tier; governor lowers pixel ratio (floor 0.75) after two consecutive ~60-frame windows averaging > 24.5 ms and raises it again after three windows < 12.5 ms. Off with `?gov=0` and in QA captures. Exposed in the HUD. |
| 2 | Lights 6 → 4 | **Done.** Gallery key/rim lights removed; the core point-light re-homes over the framed artifact (constant count → no recompiles). |
| 3 | Warm-up under loader | **Done.** `world.warm()` forces a render before the loader lifts. |
| 4 | Cheaper glow tori | **Done** (halo tubes: 3 radial segments). Flat ribbons not done. |
| 5 | Right-size materials | Not done. |
| 6 | Remove compositor extras | **Done for mid/low** (grain off; backdrop-filter off on low). |
| 7 | Mobile address-bar resize churn | **Done** (height-only resizes < 20 % on coarse pointers don't reallocate the buffer). |
| 8 | Fonts / loader gate | **Done differently:** fonts are now **self-hosted** (`@fontsource`) → no Google Fonts request, no FOUT-induced layout swap from a third party. |
| 9 | Throttle when scene isn't the subject | Not done (experience/archive keep the scene visible by design). |
| 10 | Trim gallery geometry | Not done. |
| 11 | Caching | Host-controlled (GitHub Pages sets its own headers). |
| new | Shard dissolve | Shards scale to 0 near the camera in the vertex shader (no extra pass). |
| new | Core flare | One extra additive quad (+1 draw call). |

Bundle after changes (gzip): `main` ≈ 49 KB, lazy `world` (three.js) ≈ 142 KB, CSS ≈ 6 KB, + three self-hosted font files (Archivo variable ≈ 90 KB woff2 latin; Instrument Serif and JetBrains Mono subsets). `dist/` no longer carries the 12 MB of legacy mockups.

## C. Measure it yourself on your computer (exact steps)
1. `npm run build && npm run preview`, open **http://127.0.0.1:4173/?perf=1** in Chrome at your normal window size. (Press **P** to toggle the HUD any time.) The HUD shows fps, average and worst frame time, draw calls, triangles, programs, **current pixel ratio** and how many governor steps have occurred.
2. Scroll through the whole page slowly, then quickly, then back up. Watch for the *worst* frame figure and for the governor stepping (a step means your GPU/CPU couldn't hold ~40 fps at the previous resolution).
3. **Stress test:** DevTools → Performance → ⚙ → *CPU: 6× slowdown*; or use `?q=mid` / `?q=low` to preview weaker tiers; compare `?gov=0` vs default.
4. **Lighthouse (lab):** DevTools → Lighthouse → *Navigation*, *Mobile*, categories Performance + Accessibility + Best Practices + SEO → *Analyze*. Run it 3× and take the median; run against the **preview build**, not the dev server. Expect Lighthouse's mobile throttling to be harsh on WebGL pages - treat TBT/LCP as a relative signal.
5. **Core Web Vitals in your own browser (no tracking added):** open DevTools → Console on the preview build and paste:
```js
new PerformanceObserver(l => console.log('LCP', l.getEntries().at(-1).startTime|0, 'ms')).observe({type:'largest-contentful-paint', buffered:true});
let cls = 0; new PerformanceObserver(l => { for (const e of l.getEntries()) if (!e.hadRecentInput) cls += e.value; console.log('CLS', cls.toFixed(3)); }).observe({type:'layout-shift', buffered:true});
```
   (INP needs real interactions: use the *Web Vitals* Chrome extension or DevTools → Performance insights.) Real-user (75th-percentile) figures require field data, which this privacy-first site intentionally does not collect.
6. **GPU confirmation:** visit `chrome://gpu` and confirm *WebGL2: Hardware accelerated*; the HUD readings are meaningless on software GL.
7. **GPU-accelerated screenshots/tests:** `GPU=1 npx playwright test …` uses your GPU via ANGLE/D3D11 (≈25× faster than the default SwiftShader).


---

# Addendum 2 - bright "Swarm" rebuild (2026-11-01)

The ring "engine" was replaced by an instanced toy swarm (`src/scene/swarm.js`). Sections 2–3 and §A–C above describe the *old* scene's counts; the numbers below are for the new one.

## Scene budget (measured with `renderer.info`)
| | high tier | notes |
|---|---|---|
| Draw calls | 5 (7 in the hero, with the chrome sun + ring) | one `InstancedMesh` per shape |
| Triangles | ≈ 400k (hero ≈ 406k) | 360 instances × five shapes |
| Lights | 4 | key, hemisphere, fill, cursor point |
| Per-frame CPU | `renderer.render` ≈ 0.4 ms, `swarm.update` ≈ 0.16 ms (measured in-page) | 360 matrix + colour writes |
| Instances by tier | 360 / 240 / 150 | `?q=high|mid|low` |

## Frame rate - what was and was not measured
`GPU=1 npx playwright test tests/perf.spec.js` (headless Chromium on the **RTX 4070 Laptop GPU** via ANGLE/D3D11, 1920×1080, resolution governor off, 3 s per chapter): **60 fps, 16.6 ms average, 17 ms worst frame in all 11 chapters probed** (hero, dive, cap1, cap3, cap5, playground, great1, w3, w5, xp2, contact). Headless rAF is vsync-capped at 60 Hz, so this shows the page *holds* 60 fps at this size on this GPU; it does **not** show how much headroom there is, nor anything about other GPUs, phones, Safari or Firefox.

**A caveat I hit and should be honest about:** the in-app browser pane in this session reported 1–11 fps for the *same* page at the same moment (and stayed ~2 fps even with `renderer.render` replaced by a no-op and with the canvas/`main`/grain hidden, while a plain HTML page in the same pane ran at 139 fps and the JS side of every frame cost < 1 ms). That pattern points at the pane's own throttling, not the scene, but I could not prove it. If you see low frame rates on your machine, press **P** for the HUD and tell me the numbers.

## Not measured (so not claimed)
Lighthouse, LCP, INP, CLS, GPU memory, battery/thermals, real phones/tablets, other browsers. Use §C above - the steps still apply (`?perf=1`, press **P**).

## Cost drivers to watch
- Triangles scale with instances × shape detail; the `low` tier uses 150 instances and ~60 % segment counts.
- `backdrop-filter` tiles (dive, contact, cards) sit over a transparent WebGL canvas - they are disabled on the `low` tier.
- Per-frame CSS-variable writes (`--bg`, `--ink`, `--ac`) restyle the page only while a colour is actually changing (guarded by a string compare).


---

# Addendum 3: Blender props (2026-11-01)

Chapters now show authored objects instead of swarm formations (see `3D_ART_DIRECTION.md`). Measured with `GPU=1 npx playwright test tests/perf.spec.js` (headless Chromium, RTX 4070 Laptop GPU, 1920x1080, governor off, 3 s per chapter), after drawing only the visible confetti:

| Chapter | fps | worst frame | draw calls | triangles |
|---|---:|---:|---:|---:|
| hero (swarm + sun) | 60 | 17 ms | 7 | 406k |
| meet (Pip + swarm) | 60 | 17 ms | 25 | 426k |
| profile (laptop) | 60 | 17 ms | 24 | 136k |
| orchestration | 60 | 17 ms | 38 | 126k |
| tools | 60 | 17 ms | 20 | 123k |
| playground | 60 | 17 ms | 5 | 398k |
| GREAT | 60 | 17 ms | 21 | 128k |
| DermSense | 60 | 17 ms | 20 | 127k |
| microservices | 60 | 17 ms | 18 | 120k |
| supermarket | 60 | 17 ms | 25 | 138k |
| CMA CGM ship | 60 | 17 ms | 18 | 126k |
| eMcREY gears | 60 | 17 ms | 18 | 137k |
| contact | 60 | 17 ms | 16 | 195k |

- Prop chapters render about 125k triangles (down from about 410k when hidden confetti was still being drawn at zero size: `mesh.count` is now cut to the visible fraction).
- Assets: 24 props, 945 KB total after Draco, 20 to 80 KB each, loaded lazily (the current, previous and next two props). The Draco WASM decoder is served from this origin (`public/draco`, about 340 KB), so there is still no third-party request.
- Headless rAF is vsync-capped at 60 Hz: this proves the page holds 60 fps at this size on this GPU, not how much headroom there is. Other GPUs, phones, Safari and Firefox are untested. Lighthouse, LCP, INP, CLS not measured.
