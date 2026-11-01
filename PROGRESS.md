# PROGRESS

_Last updated: 2026-11-01 · branch `redesign/3d-universe` · nothing pushed, merged or deployed_

## Status in one paragraph
A working real-time WebGL portfolio: procedural five-ring gimbal engine, scroll-driven camera director, exploded GREAT case study, six original 3D project artifacts, per-role experience orbit, self-hosted fonts, no tracking. It has been reviewed in rendered screenshots at five viewports and by an independent reviewer (6.8/10 from stills — "shortlist-plausible, not a winner"). **It is not finished**: see *Open creative gaps*.

## Commits
| Hash | What |
|---|---|
| `51ba01d` | Checkpoint: rebuild as real-time 3D experience (24 tests passing) |
| (latest) | Refinement phase — see `git log` |

## Done in the refinement phase
- **Visual verification:** screenshot matrix (1440×900, 1280×800, 768×1024, 390×844, 360×780 × 25 chapter states) captured on a real GPU (`GPU=1`), contact-sheeted and reviewed; fixes applied and re-captured over four rounds (`qa/review-base` → `r1` → `r2` → `r3/r4` → `final`; ignored by git, curated set in `docs/screenshots/`).
- **Hero:** name now fully legible at all sizes (8.4 vw desktop / 14.5–15.6 vw portrait), machine re-seated (`pd` portrait-distance param), CTAs + proof points moved to the left column on desktop so the metal stays clear.
- **OULAD artifact:** replaced the stock bar chart with a cohort of ~14k learner-trajectory points (enrolment → 3 engagement bands → dropouts fall away → dashed forecast zone beyond a glass plane), tied to the project (retention forecasting, GMM/DBSCAN clusters).
- **Ring chapters:** distinct accent per ring (orchestration orange, retrieval ice, tools gold, evaluation mint with a scanning plane, reliability orange); desktop chapters now use open type with a ghost numeral instead of a box.
- **Gallery:** artifacts at 1.55×, arena re-spaced, light pools under each, framing fixed so nothing clips behind panels.
- **Archive / experience / education:** experience = one glass card per role while the camera orbits and focuses a different ring; archive + education sit in a right column with the machine visible on the left; filters/hover spin the rings (`world.kick`). Rail label hides over long lists.
- **Core:** camera-facing flare with a faint anamorphic streak.
- **Privacy & content:** analytics audit (none was ever active — placeholder ID only); privacy/terms/404/thank-you rebuilt in the new system with no cookie banner; fonts self-hosted; Playwright asserts zero third-party requests, cookies, storage and analytics scripts. Endorsement quotes hidden (`hidden` attribute, kept in markup) pending verification.
- **Performance:** lights 6→4, governor (adaptive pixel ratio), DPR caps, warm-up, shard dissolve near camera, mobile resize-churn guard, `?perf=1` HUD. Real-GPU measurement (RTX 4070 Laptop, 1920×1080 @1.25 DPR): ~143 fps (vsync-capped) in every scene — see `docs/PERFORMANCE.md` §A for what that does and does not prove.
- **Tests:** 40 Playwright tests pass (core, no-WebGL fallback, reduced motion, privacy/third-party, reverse-scroll reversibility, experience steps, nav, HUD, filters).

## Subagents actually spawned
| Agent | Scope | Outcome |
|---|---|---|
| Research | `3D_REFERENCES.md` | 8 references; no screenshots possible; Zajno via snippets only |
| QA (Agent 10) | tests + screenshots + first critique | 22/24 → fixes → 24/24 |
| Performance (Agent 9) | `docs/PERFORMANCE.md` | measured draw calls/bundle on software GL; ranked fixes |
| Independent critic (fresh) | `qa/CRITIQUE.md` | 6.8/10; ranked 10 fixes (most applied — see `qa/REPORT.md`) |

All other roles (art direction, CGI, WebGL, motion, UI, UX, frontend) were done by the lead, not separate agents.

## Open creative gaps (honest)
1. **Range:** the 3D story is still mostly one machine from many angles. A second signature set-piece (e.g. a retrieval "library" scene or tools "docking bay") would raise the ceiling.
2. **Gallery** is improved but the artifacts are still simpler than the engine; they'd benefit from authored models (Blender) and a rim/bloom treatment.
3. **Type ↔ 3D interplay** beyond the hero name (e.g. headline occluded by a ring) is only used in the ring chapters' ghost numerals.
4. Tablet portrait reuses the phone layout; a true two-column tablet composition is not done.
5. Not judged: motion feel, intro choreography, pointer interaction — stills only. Needs your eyes on a real display.
6. Remaining perf items (flat-ribbon glow, material right-sizing, gallery geometry merge) not done; no Lighthouse/CWV measured.
7. Endorsements and the unattributed "response < 4h" claims need your decision.

## Next steps
1. Scroll through it on your display (`npm run dev`, press **P** for the HUD) and tell me what feels flat or slow.
2. Decide on endorsements; verify the "<4h average" claim before publishing.
3. Optional: author 2–3 hero-quality assets in Blender (glTF + Meshopt) for the gallery.
4. When approved: merge, set Pages source to GitHub Actions (workflow already in `.github/`). Do not publish before then.
