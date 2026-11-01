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
- **Two designs, one switch:** a switch in the header (left = classic, right = 3D, also a "Classic design" link in the 3D menu). `/classic/` is the original portfolio from the `main` branch, generated by `tools/make-classic.mjs` into `public/classic/`. Differences from the original, on purpose: no Google Fonts (fonts self-hosted), no cookie banner or analytics loader (it set no cookies and the analytics ID was a placeholder), no em dashes, the two unattributed endorsements stay hidden, links point at the shared résumé, privacy and terms pages, `noindex` so search engines only list the 3D page. Tests: `tests/switch.spec.js`.
- **Assumption to confirm:** "the old one" was taken to mean the original portfolio on `main`. If you meant the earlier dark 3D build of this redesign, it is in git history and can be shown behind the same switch.
- Tests: 89 GPU (1 skipped by design), 24 core software-GL, build OK.
