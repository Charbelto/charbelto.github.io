# Charbel Toumieh - Portfolio v4 · real-time 3D

An immersive, full-colour WebGL portfolio: a swarm of ~360 glossy toy objects that morphs into a new formation for every chapter (agent network, funnel, histogram, evaluation layers, a silhouette for each project…), a page that floods from one colour world to the next as you scroll, and an interactive playground. Built with **Three.js + GSAP + Vite**. One Blender-authored model (Pip) plus code-generated geometry - all geometry, materials and the studio environment are generated in code.

> This folder is the 3D redesign. It is **not deployed**: the live site is the previous hand-built static site at the repository root (see below). Run everything in this README from inside `new-website/`.

## Run locally
```bash
npm install
npm run dev        # http://127.0.0.1:5173
```
Useful query params: `?intro=0` (skip opening), `?at=great2` (jump to a chapter), `?q=low|mid|high` (force quality tier), `?gov=0` (disable the adaptive-resolution governor), `?perf=1` (FPS / frame-time / draw-call HUD - or press **P**), `?qa=1` (skip reveals and snap the camera; used by screenshot tests).

## Tests & screenshots
```bash
npx playwright install chromium            # once
npm run test:e2e                           # core suite (software WebGL, slow but runs anywhere)
GPU=1 npx playwright test                  # same, on your real GPU (≈25× faster)
GPU=1 npx playwright test tests/review.spec.js   # screenshot matrix → qa/review/ (5 viewports × all chapters)
GPU=1 npx playwright test tests/perf.spec.js     # per-chapter frame-rate probe at 1920×1080
```
(PowerShell: `$env:GPU='1'; npx playwright test`.)

## No GPU? (lightweight mode)
Machines without a usable GPU get posters instead of live WebGL, automatically (see `DESIGN.md`). Force it with `?lite=1`, force 3D with `?lite=0`. Regenerate the posters after changing a scene:
```bash
node tools/make-posters.mjs        # needs a GPU and the dev server on :5173
python tools/posters-to-webp.py
node tools/make-frames.mjs         # phone loops: 16 frames per scene
python tools/frames-to-webp.py
```

## Privacy
No analytics, no cookies, no local storage, no third-party requests (fonts are self-hosted). Enforced by `tests/refine.spec.js`.

## Build & preview
```bash
npm run build      # outputs dist/
npm run preview    # http://127.0.0.1:4173
```

## Deploy (GitHub Pages) - not done automatically
The site is now a Vite app, so Pages must serve the **built** `dist/`, not the repo root. `.github/workflows/deploy.yml` builds and publishes via GitHub Actions. To go live: merge this branch, then in the repo settings choose **Pages → Source: GitHub Actions**. Until then the existing deployment is untouched.

## Structure
```
index.html              page content (semantic HTML, JSON-LD)
src/main.js             boot, loader, intro, reveals, marquee, playground, menu, modal, filters
src/style.css           design system (variables driven by the 3D director)
src/lite.js              lightweight (no-GPU) director: posters + colour flood
src/scene/world.js      renderer, bright procedural studio env, lights, scroll director, colour publisher, governor
src/scene/swarm.js      the swarm: 5 shapes, 19 formations, colour stories, pointer physics
src/scene/agent.js      Pip: loads the Blender-authored GLB and animates it (look-at, blink, wave, hop)
src/scene/keyframes.js  camera / formation / background + accent colour per chapter
assets/blender/         Blender scripts that author the 3D models (see assets/README.md)
public/models/          exported glTF (agent.glb)
public/                 static files copied as-is (résumé, robots, sitemap)
privacy|terms|404|thank-you.html   legal and utility pages (same design system)
```

## Adding / changing a chapter
Add a `data-kf="name"` section in `index.html` and a matching entry in `KF` (`src/scene/keyframes.js`: camera, formation index, `bg` / `ac` colours). To add a formation, append a function to `defs` in `src/scene/swarm.js` (return `[x, y, z, scale, colourIndex?]` per instance) and bump `FORMS`.

## Quality tiers
`high` 360 toys · `mid` 240 · `low` 150 (lower pixel ratio, fewer segments, no pointer effects, no MSAA). WebGL failure or reduced motion degrades to readable static content.

## Docs
`3D_ART_DIRECTION.md` · `DESIGN.md` · `3D_REFERENCES.md` · `PROGRESS.md` · `docs/PERFORMANCE.md` · `qa/REPORT.md` · `qa/CRITIQUE.md` · screenshots in `docs/screenshots/`

## Connect
Email charbeltoumieh1@gmail.com · [LinkedIn](https://www.linkedin.com/in/charbeltoumieh/) · [GitHub](https://github.com/Charbelto)

## Going back to the old design
The repository root holds the previous site, exactly as it was on GitHub (commit `a4b776b`), and that is what is live on charbelto.github.io and charbel.toumieh.com (`npm run build` at the root only copies its files into `dist/`). To publish this redesign instead, copy `deploy-new-site.yml.example` over `.github/workflows/deploy.yml` and point Cloudflare Pages at `cd new-website && npm ci && npm run build` with output `new-website/dist` (push `main` first).

## Hosting notes
- **charbelto.github.io** is built and deployed by `.github/workflows/deploy.yml` (Pages source: GitHub Actions).
- **charbel.toumieh.com** is served by a separate **Cloudflare Pages** project (`charbelto-github-io`) that rebuilds on every push to `main`. This site needs a build step, so that project must use: framework preset **Vite** (or build command `npm run build`), build output directory **`dist`**, Node 22 (`.node-version` in the repo sets it). With an empty build command it serves the raw source and the page shows up unstyled.

## Keeping the project small
The tracked project is about 24 MB; everything else on disk is regenerable. `npm run clean` removes test output, QA screenshots and `dist/`; `npm run pack` writes a clean zip of only the tracked files to `../My-Website-clean.zip` (commit first). `node_modules` never needs to be zipped (`npm ci` restores it). A test (`tests/hybrid.spec.js`) fails if `public/` grows past 9 MB or any file in it passes 600 KB.

## Samples and techniques
See `docs/SAMPLES_AND_TECHNIQUES.md` for the "Try a sample" panels (what is real, what is an illustration, feasibility and licensing notes) and for which visual and motion techniques were used or skipped. Rebuild the sample data with `python tools/make-lab-data.py`.

## Phone QA
`npx playwright test tests/phone-audit.spec.js` (writes screenshots and a JSON report to `qa/phone/`; `SIZES=360x640,390x844` to narrow) and `tests/phone-flows.spec.js` (touch tests at five sizes). Both use the default flow, with no URL flags, so they see what a phone sees.
