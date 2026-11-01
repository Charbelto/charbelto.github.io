# PROGRESS

_Last updated: 2026-11-01 · branch `redesign/3d-universe` · nothing pushed, merged or deployed_

## Status in one paragraph
Direction v2 - **bright, full-colour "Swarm"** - replaced the dark ring machine after the owner said it looked ugly and wanted bright colours, full-screen animation and more signature 3D stories. A single swarm of ~360 glossy toys morphs into a different formation in every chapter (with its own colour story), the whole page floods from one colour world to the next as you scroll, and there is a full-screen interactive Playground. 43 Playwright tests pass; two independent critiques have been run (v1 dark: 6.8/10; v2 bright: 6.5/10 before fixes). **It is not finished** - see *Open creative gaps*.

## Commits
| Hash | What |
|---|---|
| `51ba01d` | Checkpoint: first real-time 3D build (dark ring engine) |
| `643b8a3` / `560f0ac` | Refinement of the dark build, privacy cleanup, perf work |
| `b54a151` | v2 bright Swarm rebuild |

## Done since v2: Pip, a Blender-authored character
- **Blender 5.1 is installed on this machine**, so I authored a real model: `assets/blender/build_agent.py` → `public/models/agent.glb` (≈ 460 KB, ≈ 14k polygons). A bug was caught by inspecting the exported glTF nodes (eyes and antenna lost their positions when re-parented before a view-layer update) and fixed.
- **Chapter "Meet Pip"** (`src/scene/agent.js`): perceive → decide → act. Head and eyes follow the cursor, he blinks, hovers and banks; a click or the button makes him wave and hop. New swarm formation (halo orbits) and an indigo colour world.
- **Tests:** 47 pass on GPU (4 new for Pip), 24 core pass on software WebGL. GPU probe: 60 fps in all 12 chapters (vsync-capped).
- **Not built:** a second authored model, Draco/Meshopt compression, LODs.

## Done in v2
- **Research (live):** Lusion, Lando Norris, Bruno Simon opened in a real browser; observations recorded in `3D_REFERENCES.md` (addendum) and `3D_ART_DIRECTION.md`.
- **Swarm engine** (`src/scene/swarm.js`): 5 original glossy shapes, 19 formations, per-formation colour stories, size multiplier per formation, pointer repulsion, click bursts, recolour.
- **Full-screen colour:** per-chapter `bg`/`ac` colours interpolated every frame and published as `--bg`/`--ink`/`--ac`; whole page re-themes (auto white/near-black ink); blue loader wipe; scroll-reactive marquee bands.
- **New signature scenes:** hero chrome sun, dive tunnel, **Playground** (click ripple flood + palette rotation), GREAT layered stack, rainbow-ball contact; helix for experience.
- **Weak sections rebuilt:** projects as nameable shapes (loop with gate, stacked layers, trajectory cohort, hub-and-spokes, braced mast, node-edge graph); experience/archive/education in saturated colours with the 3D beside them.
- **Critique fixes** (see `qa/REPORT.md`): density, numerals, MSAA everywhere, fog tied to distance, dive without blur, contact layout, playground legibility.
- **Perf:** 5–7 draw calls, ≈ 400k tris, 4 lights, governor retained; GPU-headless probe holds 60 fps in 11 chapters at 1920×1080 (vsync-capped).
- **Privacy:** no analytics/cookies/storage/third-party requests (enforced by tests); fonts self-hosted; legal pages in the new system; endorsements hidden.
- **Tests:** 43 pass (core, no-WebGL, reduced motion, privacy, colour worlds, playground, tiers, reverse scroll, nav, HUD…).

## Subagents actually spawned (cumulative)
| Agent | Scope | Outcome |
|---|---|---|
| Research | `3D_REFERENCES.md` | 8 refs; no screenshots possible (later supplemented by my own live browsing) |
| QA (Agent 10) | tests + screenshots | 22/24 → fixed → 24/24 |
| Performance (Agent 9) | `docs/PERFORMANCE.md` | measured counts/bundle; ranked fixes |
| Independent critic v1 | `qa/CRITIQUE.md` | 6.8/10 (dark build) |
| Independent critic v2 | `qa/CRITIQUE-v2.md` | 6.5/10 (bright build, before fixes) |
All other roles (art direction, 3D, WebGL, motion, UI/UX, frontend) were done by the lead, not separate agents.

## Open creative gaps (honest)
1. **Only one authored asset (Pip).** Everything else is still the swarm of five primitive shapes; more authored pieces (per-project objects) and a typographic 3D moment would raise the ceiling.
2. Project formations are legible but abstract; a few would benefit from bespoke geometry or labels.
3. Motion, intro choreography, pointer repulsion and playground feel are **unverified by me** (stills only).
4. Tablet portrait still reuses the phone-style bottom-anchored layout.
5. No Lighthouse/CWV numbers; one GPU only; the in-app pane's 1–11 fps readings are unexplained (probably the pane).
6. Open decisions for you: endorsement quotes (hidden), the unattributed "average < 4 h" response claim, whether the old site's analytics should ever come back.

## Next steps
1. Scroll it on your display (`npm run dev`, press **P** for the HUD) and tell me what feels flat, slow or off-brand.
2. Decide on endorsements and the "< 4 h" claim.
3. Optional: author 2–3 hero assets in Blender (glTF + Meshopt), or add a second signature scene (e.g. a typographic 3D moment).
4. When approved: merge, set Pages source to GitHub Actions (workflow already in `.github/`). Do not publish before then.

