# PROGRESS

_Last updated: 2026-11-01 · branch `redesign/3d-universe` · nothing pushed or deployed_

## Completed
- Repo inspected; redesign branch created; previous site preserved on `main` and in `legacy/`.
- Vite + Three.js 0.170 + GSAP project scaffolded; `npm run build` passes (JS ≈ 190 KB gzip total, 3D chunk lazy-loaded).
- **Quality gate passed (visually, in a real browser):** procedural five-ring gimbal engine with ceramic/titanium PBR, glass+ember core, shard belt, light channels; hero with the name occluded by the machine; axial *dive* transition; five ring chapters; exploded GREAT stack; six-artifact 3D gallery; frontal contact scene.
- Full content migrated (profile, GREAT, experience ×7, 24 projects, education, FAQ + JSON-LD, résumé, links, case modals).
- Responsive: desktop, tablet, phone (bottom-anchored panels, subject lifted into upper half, quality tiers).
- Reduced-motion + no-WebGL fallbacks implemented.
- Docs: `3D_ART_DIRECTION.md`, `DESIGN.md`, `3D_REFERENCES.md` (research agent), README, GitHub Pages workflow (dormant).

## Subagents actually spawned
| Agent | Scope | Status |
|---|---|---|
| Research | `3D_REFERENCES.md` | done (8 refs; no screenshots possible; Zajno via snippets only) |
| QA (Agent 10) | `tests/`, `qa/` — Playwright tests, screenshots, independent critique | done. 22/24 first run → fixes applied → **24/24 pass**. Report in `qa/REPORT.md` (written by lead; agent couldn't write it) |
| Performance (Agent 9) | `docs/PERFORMANCE.md` — budgets, bundle, renderer.info | done. Measured (software GL): hero 68 draw calls / 158k tris, JS 188 KB gzip. Applied: lower DPR caps, shader warm-up under loader, no grain/blur on mid/low, cheaper glow halos. **Not yet applied:** light reduction (6→4), ribbon glow, resolution governor, font gating |

Roles not delegated (done by the lead): 3D art direction, CGI/asset generation, WebGL engineering, motion, UI design, UX, frontend. They were not simulated as separate agents.

## Design decisions
- Transparent canvas over the page so the name can sit *behind* the machine.
- No postprocessing/bloom; glow limited to additive light channels (cheaper, and avoids hiding weak geometry).
- Procedural everything (no GLB/HDR downloads): clean licensing, tiny payload.
- Analytics: the legacy site had a placeholder GA ID (`G-XXXXXXXXXX`) behind a cookie banner; neither was ported. Privacy page copy still mentions optional analytics — review before publishing.

## Known problems / limits
- No Blender/Spline/Chrome-DevTools/Playwright **MCP** servers were available; Playwright is used as an npm dev tool instead. No `.blend`/`.glb` sources.
- No real-GPU profiling or field Core Web Vitals yet → **no performance targets are claimed as met.**
- Shader compile + geometry build make first load slow on weak CPUs (see `docs/PERFORMANCE.md`).
- Endorsement quotes from the old site are unattributed (roles only) — kept, but worth confirming you want them.
- `public/styles.css` is only used by the legacy legal/404 pages.

## Exact next steps
1. Remaining perf items in `docs/PERFORMANCE.md` (fewer lights, ribbon glow, resolution governor, font gating).
2. Re-screenshot at 1440×900 / 820×1180 / 390×844 (`npm run test:shots`) to confirm the mobile/tablet CSS fixes visually — the e2e suite passed, but I have not re-viewed those screenshots.
2b. Give the OULAD artifact a more distinctive form; add a 3D moment to experience/archive.
3. Decide on the endorsements and analytics.
4. Update legal/404 pages to the new type system (optional).
5. When approved: merge, set Pages source to GitHub Actions.
