# Charbel Toumieh — Portfolio v4 · real-time 3D

An immersive WebGL portfolio: a procedural five-ring "engine" the camera dives through as you scroll, an exploded flagship case study (GREAT), and a 3D gallery of project artifacts. Built with **Three.js + GSAP + Vite**. No external 3D assets — all geometry, materials and the studio environment are generated in code.

> Branch `redesign/3d-universe`. The previous hand-built site is preserved on `main` (and its source in `legacy/`). Nothing here has been pushed or deployed.

## Run locally
```bash
npm install
npm run dev        # http://127.0.0.1:5173
```
Useful query params: `?intro=0` (skip opening), `?at=great2` (jump to a chapter), `?q=low|mid|high` (force quality tier).

## Build & preview
```bash
npm run build      # outputs dist/
npm run preview    # http://127.0.0.1:4173
```

## Deploy (GitHub Pages) — not done automatically
The site is now a Vite app, so Pages must serve the **built** `dist/`, not the repo root. `.github/workflows/deploy.yml` builds and publishes via GitHub Actions. To go live: merge this branch, then in the repo settings choose **Pages → Source: GitHub Actions**. Until then the existing deployment is untouched.

## Structure
```
index.html              page content (semantic HTML, JSON-LD)
src/main.js             boot, loader, intro, reveals, menu, modal, filters
src/style.css           design system
src/scene/world.js      renderer, procedural studio env, lights, scroll director
src/scene/machine.js    the engine: rings, pins, core, shard belt, glow shaders
src/scene/artifacts.js  six project artifacts + gallery arena
src/scene/keyframes.js  camera/state keyframes per chapter
public/                 static files copied as-is (résumé, legal pages, robots, sitemap)
legacy/                 previous site source (not deployed)
```

## Adding / changing a chapter
Add a `data-kf="name"` section in `index.html` and a matching entry in `KF` (`src/scene/keyframes.js`). The director handles the rest.

## Quality tiers
`high` desktop · `mid` tablets/low-core · `low` phones (fewer shards/ticks, lower DPR, no pointer effects, no MSAA). WebGL failure or reduced motion degrades to readable static content.

## Docs
`3D_ART_DIRECTION.md` · `DESIGN.md` · `3D_REFERENCES.md` · `PROGRESS.md` · `docs/PERFORMANCE.md` · `qa/REPORT.md`

## Connect
Email charbeltoumieh1@gmail.com · [LinkedIn](https://www.linkedin.com/in/charbeltoumieh/) · [GitHub](https://github.com/Charbelto)
