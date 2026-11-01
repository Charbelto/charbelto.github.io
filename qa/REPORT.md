# QA report

_Updated 2026-11-01 (refinement phase). Earlier rounds were run by a QA subagent; this update by the lead._

## Automated results
`GPU=1 npx playwright test tests/portfolio.spec.js tests/nogl.spec.js tests/refine.spec.js` → **40 / 40 passed** (≈2 min on a real GPU; the same core suite also passed 24 / 24 on software WebGL before the refinement work — rerun without `GPU=1` to repeat).

| Area | Tests |
|---|---|
| WebGL boots, frames render, no console errors | ✔ |
| Links / hrefs / `rel=noopener` / 6 repo + 18 archive links / in-page anchors | ✔ |
| Keyboard: skip link, tab order, visible focus, menu Esc + focus, modal Esc + focus return + focus trap | ✔ |
| FAQ (mouse + keyboard), archive filters, chip `aria-pressed` | ✔ |
| Reduced motion: content readable | ✔ |
| No-WebGL fallback: content visible, `.no-gl`, notice, no errors | ✔ |
| **Privacy:** zero third-party requests, cookies, storage, banner, analytics scripts on index/privacy/terms/404/thank-you | ✔ |
| Privacy page wording (no analytics / no cookies) | ✔ |
| Endorsements hidden | ✔ |
| Legal/utility pages render | ✔ |
| 7 experience steps keyframed + readable | ✔ |
| **Reverse scroll:** hero → w3 → cap4 → w3 → hero returns identical camera positions | ✔ |
| Nav link lands on its chapter | ✔ |
| Governor stats + perf HUD (toggle with P) | ✔ |
| Archive filter nudges engine without errors | ✔ |

## Visual verification
Matrix: 1440×900, 1280×800, 768×1024, 390×844, 360×780 × hero, profile, dive, cap1–5, great1–3, w1–6, archive, xp0/1/2/4/7, edu, contact (125 frames). Reviewed as contact sheets and individual frames across four rounds. Curated final set: `docs/screenshots/`. Raw runs: `qa/review-*` (git-ignored; regenerate with `GPU=1 OUT=qa/review npx playwright test tests/review.spec.js`).

## Independent critique (fresh reviewer, stills only) — `qa/CRITIQUE.md`
Verdict **6.8 / 10**: cohesive and polished, shortlist-plausible, not yet a winner; biggest gap is range (one machine from many angles) and a repeated glass-card template.

| Critique item | Status |
|---|---|
| 1 Gallery small / off-material | **Partly fixed:** 1.55× scale, arena re-spaced, light pools under each, OULAD redesigned. Still simpler than the engine. |
| 2 Same card everywhere | **Partly fixed:** ring chapters use open type + ghost numerals + per-ring accent on desktop; other chapters still use cards. |
| 3 Hero name/ring collision, stat strip on metal | **Fixed** (name smaller and fully legible; CTAs/stats moved left). |
| 4 Rings not differentiated | **Partly fixed:** accent per ring + evaluation scanning plane; retrieval/tools lack distinct modules. |
| 5 Archive dead half / label over rows | **Fixed** (machine visible left, rail label hidden over lists). |
| 6 Edu clipped under header | **Fixed** (top padding). FAQ still shares the panel. |
| 7 Header bleed | **Improved** (stronger scrim); not eliminated on every mobile frame. |
| 8 Legibility over bare 3D | **Improved** (stronger scrims, 13 px microcopy, one-line contact meta). |
| 9 GREAT overflow / mobile edge-on ring / stat misalignment | **Fixed** (title clamp, camera elevation, 3-row stat structure). |
| 10 Mobile/tablet polish | **Partly:** 360 header no longer wraps, hero re-seated; tablet is still a stretched phone layout. |
| Content: xp ordering wording | **Fixed** (copy now says "current role at the core"). |

## Known limitations
- Stills only: motion feel, intro choreography, pointer interaction and real-device behaviour are **not** verified.
- GPU runs used a single machine (RTX 4070 Laptop); other GPUs, Safari and Firefox untested. No axe-core run.
- Lighthouse, LCP, INP, CLS **not measured** (instructions in `docs/PERFORMANCE.md` §C).
