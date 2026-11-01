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
