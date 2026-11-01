# QA report

Run by the QA subagent (Playwright + software WebGL), findings transcribed and re-verified by the lead. Screenshots: `qa/screenshots/` (desktop 1440×900, tablet 820×1180, mobile 390×844; hero, dive, cap2, great2, w1, w3, xp, contact, plus no-WebGL).

## Automated results
- First run: **22 / 24 passed.** Failures were real: the case modal had `aria-modal` without a focus trap, and archive chips lacked `aria-pressed`.
- After fixes: **24 / 24 passed** (`npm run test:e2e`, ≈3.2 min). No console errors in the WebGL, reduced-motion or no-WebGL runs; `renderer.info.render.calls` = 67 in the hero.
- Coverage: links/hrefs, `rel=noopener`, keyboard order, menu/modal Escape + focus return, modal focus trap, FAQ, archive filter, reduced motion, no-WebGL fallback.

## Independent visual critique (from the screenshots)
- **Strong:** hero machine, exploded GREAT stack, dive and contact bookends; desktop panel placement.
- **Weak:** OULAD artifact reads as a stock 3D bar chart; archive/experience chapters have little 3D payoff; mobile panels covered ~65% of the screen; text over bright metal had poor contrast (≈1.7:1 in places).

## Fixes applied from this review
| Finding | Fix |
|---|---|
| Horizontal overflow on phones (413px layout viewport, clipped menu button) | `overflow-x: clip` on `html`; removed negative scrim insets |
| Text unreadable over bright metal | lighter `--mute`, text-shadows, scrims behind hero text/stats, stronger header scrim |
| Header collided with rows on scroll | stronger `.head::before` |
| Mobile/tablet panels hiding the 3D | smaller panel type, hidden mono-notes, bottom-anchored panels also on portrait tablets |
| Modal focus trap, `inert` background, menu focus, chip `aria-pressed` | `src/main.js` |
| Scroll cue shown without WebGL / reduced motion | hidden in both |

## Still open
- OULAD artifact needs a more distinctive form.
- Archive/experience chapters could use a richer 3D moment.
- `data-kf="xp"` is used on two elements (harmless, but redundant).
- Not covered: production-build run, axe-core, Firefox/WebKit, real devices.
- Software rendering: **FPS/GPU numbers from this run are meaningless.**
