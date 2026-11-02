# PROGRESS

_Last updated: 2026-11-01 · branch `redesign/3d-universe` · nothing pushed, merged or deployed_

## Status in one paragraph
Bright full-colour site where **every chapter shows a Blender-authored object about its own topic** and scroll assembles it part by part (reversible): a skin cross-section for DermSense, a call headset and phone for GREAT, a container ship for CMA CGM, a heart over ECG paper for the Meta research, OCR on a document for Intalio, and so on (24 props plus the Pip character). The toy swarm now only appears where it has a job (hero, dive tunnel, interactive playground, a light confetti frame). No em dashes anywhere, and the menu animates. **It is not finished**: see *Open gaps*.

## Commits
| Hash | What |
|---|---|
| `51ba01d` | Checkpoint: first real-time 3D build (dark ring engine) |
| `643b8a3` / `560f0ac` | Refinement of the dark build, privacy cleanup, perf work |
| `b54a151` / `6deda23` | v2 bright Swarm rebuild |
| `3032cc7` | Pip, the first Blender-authored character |
| `5542d0c` | Purposeful objects: 24 Blender props, animated menu, no em dashes |

## Done in this round
- **No em dashes anywhere** (118 removed from copy, titles, meta, code comments and docs; the résumé PDF has none). A test scans the repo and the rendered pages and fails if one returns.
- **Animated menu:** circular two-layer colour wipe grows from the button, links rise in one by one, closing reverses it; closed state is `visibility: hidden` + `inert`. The button is now visible at every width. Frames: `docs/screenshots/menu-animation.jpg`.
- **24 Blender props** (`assets/blender/build_props.py`, library `props_lib.py`): laptop, orchestra, library, toolbox, scorecard, shield, call, loopguard, derm, oulad, shop, tower, market, nyc, brain, ship, heart, can, ocr, gears, edu, mail, briefcase, archive. The table of what each depicts is in `3D_ART_DIRECTION.md`.
- **Props engine** (`src/scene/props.js`): lazy loading (current, previous and next two), Draco (945 KB for all 24, decoder served locally), staggered scroll-driven assembly with tumbling parts, idle motion by part-name prefix (rolling chain, tripping lever, meshing gears, scan bars, pulsing rings, bobbing parts, orbiting planes).
- **Confetti** reduced to about a quarter in prop chapters, shrinks near the lens, and only visible toys are drawn (triangles in prop chapters about 125k, was about 410k).
- **Bug found and fixed in the Blender library:** BMesh reuses freed vertex slots after a bevel, so "last N vertices" was not "the vertices I just made"; parts were transformed twice and landed in the wrong place. New vertices are now tracked by identity.
- **Copy** now describes the objects (captions, GREAT and experience intro text).
- **Phones:** tighter experience cards, prop chapters lifted higher so the whole object shows above the card.
- **Tests:** 58 pass on GPU (new: no em dash, animated menu, props map and loading and reversible assembly), 24 core pass on software WebGL.
- **Perf (GPU headless, 1920x1080):** 60 fps in all 13 probed chapters, vsync-capped; see `docs/PERFORMANCE.md` Addendum 3.

## Subagents actually spawned (cumulative)
Research (`3D_REFERENCES.md`), QA (tests and first critique), Performance audit, independent critic v1 (dark build, 6.8/10), independent critic v2 (bright swarm, 6.5/10). **No new critic has reviewed this prop-based version**; my judgement of it comes from screenshots. All other roles were done by the lead.

## Open gaps (honest)
1. **Objects are simple.** They are bevelled primitives, tubes and extrusions, not sculpted or textured; they read clearly and match the toy look, but a professional 3D artist would go further (surface detail, baked lighting, real materials). Some details are flat stand-ins (the DermSense heat map is glowing discs).
2. **Not reviewed by a fresh critic**, and I can only judge stills: motion, assembly timing, idle animation feel and the menu's feel need your eyes on a real display.
3. Hero, dive and playground still use the swarm; unused swarm formations remain in `swarm.js` (dead code, safe to prune).
4. Tablet portrait reuses the phone-style bottom-anchored layout.
5. No Lighthouse/CWV numbers; one GPU only; the in-app pane's low frame rates remain unexplained (probably the pane).
6. Open decisions for you: endorsement quotes (hidden), the unattributed "average < 4 h" response claim, whether analytics should ever come back.

## Next steps
1. Scroll it on your display (`npm run dev`, press **P** for the HUD) and tell me which objects feel wrong or too simple; I can rebuild any one (`-- <name>` rebuilds a single prop in seconds).
2. Optional: a fresh independent critique of this version, and pruning the dead swarm formations.
3. Decide on endorsements and the "< 4 h" claim.
4. When approved: merge, set Pages source to GitHub Actions (workflow already in `.github/`). Do not publish before then.

---

# Round 4: short page, no-GPU mode, small screens (2026-11-01)

| Commit | What |
|---|---|
| this round's commit (see `git log`) | Name layer above the 3D, virtual steppers, lightweight no-GPU mode with posters, band-fit camera for phones, critique v3 fixes |

## Done in this round
- **The name is never hidden:** the name layer sits above the canvas, so toys can only pass behind it (test: `the name layer sits above the 3D canvas`).
- **Page is about 18 screens, was 30:** four pinned groups (systems, GREAT, projects, experience) step through their chapters (about 0.3 of a screen per step) with pips, a "3 / 8 + name" pill on phones, and six labelled quick-jump dots on desktop. Pips fade when their group is not on screen.
- **Lightweight mode for CPU-only machines:** posters instead of WebGL, chosen automatically (no WebGL, software renderer, or live fallback below about 11 fps). 60 posters, 2.56 MB, regenerated this round after the colour and camera changes. Not measured on real weak hardware.
- **Independent critique v3** (`qa/CRITIQUE-v3.md`, 7.3 / 10). Fixes made:
  - Phones and tablets: the camera now fits each object into the free band between the header and the card (centred, whole object visible, never cropped by the width); pips moved out of the 3D into a pill under the card.
  - Hero on portrait: eyebrow and statement on a soft plate, larger statement; surname outline thickened to 3 px.
  - Profile and contact on phones: shorter copy, so the object stays visible above the card.
  - GREAT: real call screen on the phone (avatar, waveform, red hang-up), solid gold stars on a dark score card, great3 shifted right.
  - Objects rebuilt: library (lens in front, funnel fed by chunks), DermSense (three saturated layers), tower (three thick signal rings, no dish), brain (fissure, no pedestal), heart (puffy glossy, no spider wires), can (shoulder, rim, tab, wave band), archive (folders on the open side).
  - Colour: w1 marigold, w2 and xp4 stronger blues, archive periwinkle; the marquee uses the chapter accent, no black wedge.
  - Desktop: w1, w4, xp2, xp4 pulled away from the screen edges and the cards; card body 15.5 px, tags 12 px.
- **Tests:** 68 pass on GPU (1 skipped), 24 core pass on software WebGL, production build OK.
- Review frames: `docs/screenshots/desktop-v4.jpg`, `phone390-v4.jpg`, `phone360-v4.jpg`, `tablet-v4.jpg`.

## Open gaps (honest)
1. Not re-reviewed by a fresh critic after these fixes; judged from stills. Motion, scroll feel and lite-mode feel need your eyes on real devices.
2. Phones: objects are smaller on GREAT and profile because those cards are tall; a "more" toggle on cards would give the object more room.
3. Text over the swarm in dive and play is improved earlier but not re-measured; the ghost numerals and nav contrast items from the critique are not changed.
4. Lite-mode thresholds are reasoned, not tuned on real low-end hardware. No Lighthouse or Core Web Vitals numbers.
5. Open decisions for you: endorsement quotes (hidden), the "< 4 h" response claim, whether analytics should ever return.

## Smoothness pass (user report: "so laggy")
Profiled a scripted full-page scroll and fixed what the profile showed: page-wide colour updates throttled, film grain and backdrop blurs removed, ScrollTrigger replaced by an IntersectionObserver, layout reads removed from scroll handlers, prop shaders precompiled on load, MSAA only on low-DPI screens, tighter resolution governor. Numbers and caveats in `docs/PERFORMANCE.md` Addendum 5. Tests: 68 GPU (1 skipped by design), 24 core software-GL, plus a new smoothness guard. Still only measured on one machine.

## Round 5: hero overlap, calm particles, two designs with a switch
- **Hero overlap fixed:** the name, the statement and the buttons are laid out from measured sizes (`fitHero()` in `src/main.js`, scaled with window height in CSS); if a window shape would still make them touch, both scale down until there is clear air. Test: `tests/hero-fit.spec.js` (13 window shapes including 1851x843, short laptops, tablets, phones).
- **Particles are calm:** the swarm used to sweep through every formation between two chapters (a jump from shape 0 to 20 flashed through 19 shapes in a few pixels of scroll). Each toy now glides to its place in the current formation, at its own pace, with a speed limit. Measured in a fast scroll: peak toy speed 2,100 units/s before, about 12 now (`tests/swarm-speed.spec.js`).
- **One design, old one archived:** the classic/3D switch was tried and then removed at your request. The redesign replaces the site entirely; the previous site is preserved byte for byte in `old-design/` (copy of `main` at `a4b776b`; replaces the partial `legacy/` folder). It is not built or deployed. How to go back is in `README.md`.
- Tests: GPU suite, 24 core software-GL, build OK (see the final run for counts).

## Round 6: custom domain, menu and extreme zoom
- **charbel.toumieh.com** is a separate Cloudflare Pages project that serves the repo root without building, so it served the raw source (unstyled page, loader at 0%). Fix is in the Cloudflare dashboard (build command `npm run build`, output `dist`); see README "Hosting notes". Not changed from here (no Cloudflare access, no DNS changes).
- **Menu at any zoom:** the list is scrollable and centred only when there is room, the colour wipe is fixed to the window, link size follows window height as well as width. `tests/menu-zoom.spec.js` (7 window sizes from 480x240 to 5000x2400).
- **Very large and very short windows:** type sized in rem now grows gently above 1920px wide (about 1.4x at 4K; unchanged at 1920 and below). On very short windows the hero shrinks the name and statement down to 0.62x and, if there is still no room, grows taller than the screen instead of overlapping. `tests/hero-fit.spec.js` covers 18 window shapes up to 5000x2400 and down to 480x240.
- Throttled-fallback test now polls from outside the page (an in-page poller could starve under a 60x slowdown); the governor itself was verified to hand over to lite mode within about 10 s.

## Round 7: hybrid layer, phones, size
- Studied `Desktop/still-hybrid-website` (a sticky scroll-scrubbed stage of layered scenes plus CSS loops). Took the **technique**, not the content: its imagery comes from a reference video and its own README says it is not licensed, and it is unrelated to the portfolio, so none of it was used.
- **Hybrid layer (HUD)** on every device: guides, rotating rings, live coordinates, progress bar, static grain (desktop). See `DESIGN.md`.
- **Phones** default to pre-rendered, looping, scrubbed scenes (sharper posters, no live WebGL): no more blur or lag from a low-resolution canvas.
- **Size:** the 661 MB was QA scratch; project is 146 MB on disk including `node_modules` (80 MB), tracked files 24 MB. `npm run pack` makes a clean zip.
- Tests: 103 GPU (1 skipped by design), 24 core software-GL, build OK.
- Open: not tried on a real phone; the pre-rendered scenes loop gently but are not turntables (a true 360 spin per object would need image sequences, roughly 20x the poster weight).

## Round 8: phone version by width, blue scrollbar, technique pass, project samples
- **Phone version chosen by window width** (under 820 px, any pointer): a zoomed-in or narrow desktop window was getting live 3D at a low pixel ratio, which is what looked blurry. Now it gets the pre-rendered, looping, scrubbed scenes. Small screens also skip the blur filter in the opening animation. `?perf=1` shows a frame-rate readout in this mode.
- **Right sidebar = the browser scrollbar:** now a blue sliding bar (thumb gradient with a light edge so it shows on every colour world; Firefox gets the thin blue equivalent).
- **Technique pass** (what and why in `docs/SAMPLES_AND_TECHNIQUES.md`): kinetic word-by-word headings, halftone sun, magnetic buttons and cursor ring (desktop), Lenis smooth wheel scrolling (desktop mouse only). Everything is off under reduced motion; none of it touches phones except the headings and the halftone.
- **"Try a sample" panels** for LoopGuard, DermSense, OULAD, Supermarket graph and Cell Analyzer, built from your real figures and aggregates where they exist and clearly labelled illustrations where they do not (DermSense shows no prediction: the repository has no trained weights). Feasibility verdicts, licensing notes and what is not done yet are in the same doc.
- Data: `python tools/make-lab-data.py` (public repos via `gh`). New small chunk `lab` (10 KB gzip) loads when the browser is idle; Lenis is a separate 4 KB chunk loaded only on desktop mice.
- Tests: 112 GPU (1 skipped by design), 24 core software-GL, build OK. New: `tests/lab.spec.js` (all five panels, phone layout), polish tests in `tests/hybrid.spec.js`.
- Open: no real-phone measurement yet (ask for `?perf=1` numbers); Commerce Microservices and GREAT samples not built; real DermSense predictions need the trained weights; OULAD README says 23 features but the figure says 32.

## Round 9: a sample in every chapter
- **One interactive sample per chapter, visible while you scroll** (profile, Pip, orchestration, retrieval, tools and MCP, evaluation, reliability, GREAT, LoopGuard, DermSense, OULAD, microservices, Cell Analyzer, supermarket), placed opposite the text card, labelled "Interactive sample · simulated data", with a pulsing outline and a hint until touched. Details and data sources: `docs/SAMPLES_AND_TECHNIQUES.md`.
- **DermSense now has a clickable simulated prediction** (pre-saved probabilities for an even, an irregular and a pearly generated lesion; SVM+HOG against EfficientNet-B0), clearly labelled simulated and not a diagnosis.
- **Pip is a small agent** you can give a task to (scripted think, tool, result, answer).
- **Sample or 3D object:** a switch in each window trades it for the chapter's Blender object. Pip, a character, stays either way.
- **Performance, found and fixed during the work** (see `docs/PERFORMANCE.md` Addendum 7): inactive pinned steps now skip layout (about half the frame time on a phone scroll), split-text is no longer permanent, `compileAsync` replaced by `compile`.
- Tests: 113 GPU (1 skipped by design), 24 core software-GL, build OK. New: samples spec for every chapter on desktop and phone, layout checks that no sample overlaps its text card.
- Open: not measured on a real phone; real DermSense predictions need the trained weights; GREAT only has the call-scoring sample (architecture and outcomes steps keep the 3D object).

## Round 9b: GREAT architecture and outcomes samples
- Added the two missing GREAT steps: a runnable **pipeline** (Judge, Ground, Score, Report across three channels) and an **outcomes** panel (the published results as tiles plus an hours calculator; the −90% is the published figure, the call volume and minutes per review are stated assumptions). All 16 sample windows are now in; tests cover them all on desktop and phone.
- Sample windows now keep their own light surface and dark ink on every colour world (the dark GREAT colours made the labels hard to read), buttons restyled for contrast, and GREAT's cards are compacted on phones so the sample above has room.
- Known: `tests/refine.spec.js` "animated menu" samples an animation at a fixed 120 ms and can flake when the machine is busy (passes alone).

## Round 10: phone pass
Audited with real phone emulation (touch, 3x screens) at 320x568, 360x640, 360x780, 375x667, 390x844, 412x915, 430x932 and landscape 844x390 (`tests/phone-audit.spec.js` measures and screenshots; `tests/phone-flows.spec.js` taps through everything).
Found and fixed:
- **Samples were squeezed to a header strip on small phones** (120 to 200 px tall at 360x640; their tabs could not be reached). The text card is now compact on phones (title, one short paragraph, buttons) with a "More details" toggle that opens the full text and tucks the sample away ("Back to the sample" returns). Sample windows are now 308 px (320x568), 380 px (360x640), 479 px (390x844) tall.
- **Window chrome trimmed on phones:** short labels ("Try it · simulated data", "3D object"), no repeated title, controls first in every sample.
- **Type floor:** nothing under 12 px for labels and 15 px for body on phones (it was 9.6 to 11 px in many places, including text inside diagrams).
- **Tap targets of about 44 px:** menu links (were 31 px), header button, brand, burger, sample tabs and buttons, archive chips, contact and footer links; bigger step-pip hit areas.
- **Landscape phones:** card and sample side by side (they overlapped at 844 px wide); menu list scrolls.
- **Short phones (about 640 px and under):** leaner card, smaller diagrams.
Tests: 28 phone and sample tests pass at five sizes; desktop suites unchanged (106 GPU, 24 software). Not measured on a real phone: please try it and tell me the model.
