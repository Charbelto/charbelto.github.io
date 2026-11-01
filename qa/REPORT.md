# QA report

_Updated 2026-11-01 for the bright "Swarm" rebuild (v2). Earlier rounds (dark ring engine) were superseded; their critique lives in `qa/CRITIQUE.md`._

## Automated results
`GPU=1 npx playwright test tests/portfolio.spec.js tests/nogl.spec.js tests/refine.spec.js` → **58 / 58 passed** (≈ 2.4 min on a real GPU). The core suite (24 tests) also passes on software WebGL (`npm run test:e2e`); it was re-run on the finished v2 build and passed (24 / 24).

| Area | Tests |
|---|---|
| WebGL boots, frames render, no console errors | ✔ |
| Links / hrefs / `rel=noopener` / 6 repo + 18 archive links / in-page anchors | ✔ |
| Keyboard: skip link, tab order, visible focus, menu Esc + focus, modal Esc + focus return + focus trap | ✔ |
| FAQ (mouse + keyboard), archive filters, chip `aria-pressed` | ✔ |
| Reduced motion: content readable · No-WebGL fallback | ✔ |
| **Privacy:** zero third-party requests, cookies, storage, banner, analytics scripts on every page | ✔ |
| Endorsements hidden · legal pages render · privacy wording | ✔ |
| **Colour worlds:** page `--bg` is lime on the hero, electric blue on the dive, differs on cap1, lime again at contact; `--ink` flips white/near-black for contrast | ✔ |
| **Playground:** click and button each create a full-screen flood element that is removed afterwards, no errors | ✔ |
| **Swarm tiers:** 150 / 240 / 360 instances at low / mid / high, < 12 draw calls | ✔ |
| **Pip (Blender GLB):** loads with the expected named nodes and no errors · file is a valid GLB under 700 KB · head yaw follows the cursor and a click raises the right arm · hidden outside its chapter, shown inside it | ✔ |
| **House style:** no em dash in any source/doc/page file, rendered page text, titles, meta or case modals | ✔ |
| **Animated menu:** opens as a growing wipe (not a snap), links stagger in, closes smoothly, ends hidden and inert | ✔ |
| **Chapter props:** projects get 6 different objects, roles 7, capabilities 5; every object ships as a valid GLB under 120 KB; every prop chapter assembles its object with no errors; assembly is scroll-driven and reversible | ✔ |
| 7 experience steps keyframed · reverse scrolling returns identical camera positions · nav lands on chapter · governor stats · perf HUD toggle · archive filter | ✔ |

## Frame-rate probe (`tests/perf.spec.js`, GPU headless, 1920×1080)
60 fps / 16.6 ms avg / 17 ms worst in all 12 chapters probed (the Pip chapter: 25 draw calls, 426k triangles) (RTX 4070 Laptop). It is vsync-capped, so it proves "holds 60", not headroom. See `docs/PERFORMANCE.md` (Addendum 2) for the unexplained in-app-pane stalls and for what was not measured.

## Visual verification
Matrix: 1440×900, 1280×800, 768×1024, 390×844, 360×780 × 26 chapter states (130 frames) captured on a real GPU, reviewed as contact sheets and individual frames across several rounds. Curated final set: `docs/screenshots/`. Raw runs `qa/review-*` are git-ignored (`GPU=1 OUT=qa/review npx playwright test tests/review.spec.js`).

## Independent critique of v2 (fresh reviewer, stills only) - `qa/CRITIQUE-v2.md`
**6.5 / 10**: strong colourful signature, plausible Honorable-Mention tier, Site-of-the-Day a long shot. Biggest gap: formations too dense to read and near-identical project shapes. Status of its top fixes:

| Critique item | Status |
|---|---|
| 1 Dense formations fuse into rope | **Fixed:** per-formation toy size (0.58–0.7× for structures), re-spaced; network/lattice/shield/layers now show structure. |
| 2 Project formations look alike | **Fixed:** tower rebuilt with cross-bracing, microservices viewed from above as hub-and-spokes, graph rebuilt with nearest-neighbour edges, OULAD fan retained. Still simple compared with authored models. |
| 3 Experience/archive/edu near-white, ghosted | **Fixed:** saturated per-role backgrounds (lilac/sky/mint), open double-helix. |
| 4 Contact is a smudge | **Fixed:** copy left, sharp rainbow ball right, no frosted tile (desktop). |
| 5 Numerals cross eyebrow; edge aliasing | **Fixed:** numerals lifted above the label; MSAA enabled on every tier. |
| 7 Playground copy unreadable | **Fixed:** white italic with shadow, solid pill hint. |
| 8 Mobile/tablet hero washed out | **Fixed:** fog now scales with camera distance; name gutter. |
| 9 Nav overlapped by objects | **Improved:** stronger header scrim (not a hard 3D safe-zone). |
| 10 Dive blur turns swarm to mud | **Fixed:** blur removed; type sits directly on the blue. |

## Known limitations
- Stills only: motion feel, intro choreography, pointer repulsion, playground interaction and real-device behaviour are **not** verified by me. Please scroll it yourself.
- One GPU (RTX 4070 Laptop) via headless Chromium; no Safari/Firefox, no real phones, no axe-core run.
- Lighthouse, LCP, INP, CLS **not measured** (instructions in `docs/PERFORMANCE.md` §C).
- The in-app browser pane showed 1–11 fps for this page while a plain page ran 139 fps; cause unproven (see PERFORMANCE addendum).

