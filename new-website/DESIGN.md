# Design system (v2 - bright, full-colour)

## Principles
1. **Colour is the interface.** Each chapter owns a full-bleed colour world; the page background, type colour, buttons, rules and cards all re-theme continuously with scroll (`--bg`, `--ink`, `--ac` are written by the 3D director every frame).
2. **Content stays HTML.** All copy, links and metadata are real, searchable DOM. The 3D is a fixed transparent canvas behind the text; nothing essential lives only in WebGL.
3. **One camera, one swarm.** Every `[data-kf="name"]` element owns a keyframe (`src/scene/keyframes.js`): camera, formation index, background/accent colour. Scroll interpolates keyframes; damping keeps motion fluid and fully reversible.
4. **Type first.** Huge wide grotesk, an italic serif accent, mono labels. Cards are only used where dense copy sits next to 3D; they are tinted with the live background colour (`--glass`) so they feel part of the world.

## Tokens (`src/style.css`) - driven by the director
| Token | Role |
|---|---|
| `--bg` | page colour (lime, lilac, electric blue, coral, sky, yellow, mint, pink, violet, cream, peach, lemon, paper…) |
| `--ink` | text colour, auto white (blue/violet worlds) or near-black `#0B0B14` (all others) |
| `--ac` | accent for italics, indices, key figures, hover (blue on light worlds, lime on dark ones) |
| `--ink2` / `--mute` / `--line` / `--glass` | derived with `color-mix()` from the three above |

Palette of the swarm: `#2433FF #FF4F3D #FFD21F #3DF2B0 #FF6FB5 #F5F1E8 #14141F #B9A6FF`.

## Type
**Archivo** (variable width + weight, self-hosted) for display (width 112–125 %, weight 700–800) and body; **Instrument Serif italic** for accent words, project subtitles and quotes; **JetBrains Mono** for labels, indices, tags. Fonts load from this origin (`@fontsource`) - no third-party requests.

## Chapter patterns
- **Hero:** the name sits *behind* the transparent canvas (8.4 vw desktop, ~15 vw phones) in solid + outline; the chrome sun and cloud sit right of it. Buttons and proof points stack in the left column on desktop. Portrait screens get extra camera distance (`pd`) and a lifted subject.
- **Meet Pip:** indigo world, panel left, the Blender-authored agent right with loose halo orbits; cursor = look-at, click = wave.
- **Marquee bands:** two full-width ink bands with huge type sliding across; speed boosts with scroll velocity (GSAP ticker).
- **Ring/idea chapters (01–05):** open type with a ghost outline numeral and a whisper of frosted glass; 3D on the opposite side.
- **Playground:** full-screen storm, huge type, click ripples a clip-path colour flood from the cursor.
- **GREAT:** layered formation that slides apart (`spread`), metrics grid with aligned three-row stats.
- **Works:** each project owns a formation *and* a colour story (see `3D_ART_DIRECTION.md`).
- **Experience:** one card per role (`.xp-step[data-kf=xp1…xp7]`); the camera climbs the helix role by role. **Archive / education** sit in a right column (`.wide--col`) with the swarm visible on the left; filter clicks and row hovers burst the swarm.
- **Contact:** the swarm resolves into a rainbow ball; the copy sits on a frosted rounded tile.
- `.kf-anchor` (zero-size) pins a keyframe to the *top* of a tall section.

## Components
Buttons (`.btn--solid` ink-on-colour → accent on hover; `.btn--ghost` outlined) · index labels (`.idx`) · tag pills · numbered stages · metrics grid · archive list with filter chips · FAQ `details` · focus-managed modal · loader (electric-blue wipe) · rail label.

## Motion
Intro: swarm flies in from far while the name resolves from blur; blue loader wipes up. Buttons lift 2 px / press down (≤ 350 ms). Pointer: damped parallax + per-toy repulsion. `prefers-reduced-motion`: camera snaps between keyframes, swarm is static, no marquee/grain/intro, floods are instant.

## Responsive
Desktop: subject opposite the copy. ≤ 960 px: nav collapses to a menu. Portrait (phone/tablet): panels anchor to the bottom, the camera lifts the swarm into the upper half, the name is re-sized to fit. Quality tiers: `high` 360 toys · `mid` 240 · `low` 150 (lower DPR, fewer segments, no pointer effects).

## Privacy stance
No analytics, no cookies, no local/session storage, no third-party requests - verified by Playwright. The endorsement quotes from the previous site stay in the markup but `hidden` until their attribution is verified.

## Accessibility
Skip link, landmarks, visible `:focus-visible` (accent), `aria-expanded` menu with Esc + focus move, `role="dialog"` modal with focus trap and inert background, `details/summary` FAQ, canvas `aria-hidden`, readable content without JS/WebGL (`.no-gl`), auto-contrast ink, reduced-motion support. Not yet audited with axe-core or a screen reader.

## Chapter objects
Every chapter that has a subject shows a Blender-authored object about it (`3D_ART_DIRECTION.md` has the full table). Keyframes name the object with `prop`; `obj()` in `src/scene/keyframes.js` is the shortcut. Scroll assembles it part by part (reversible); confetti is reduced to about a quarter and shrinks near the lens. Object colours are chosen against each chapter's background (for example skin tones on light blue, a blue can on lemon).

## Short page, virtual steps
The page is about 18 screens (it was 30). Four groups (the five systems chapters, GREAT, the six projects, experience) are **pinned steppers**: the group sticks to the screen and steps through its chapters as you scroll, using only about 0.3 of a screen per step. Each step still has its own camera move and its own object assembling; pips under the stage (top on phones) and six quick-jump dots (desktop right edge) let you jump around. Built in `setupSteppers()` in `src/main.js`; every step gets a virtual camera marker (`data-vc`) shared by the 3D director and the lightweight director; `window.__kfY(el)` gives the scroll position of any chapter. Important: `body` must not set `overflow-x`, or `position: sticky` stops working (`html` clips instead).

## The name is never hidden
The name layer (`.back-title`) sits above the 3D canvas (z-index 2 over 1), so toys can only pass behind it.

## Pre-rendered scenes (phones, and any device without a usable GPU)
`src/lite.js` replaces live WebGL with pre-rendered **posters** of each chapter's object (`public/posters`, 60 WebP files, 2.9 MB in total; phone posters are 780 px wide, so sharp on 2x and 3x screens, landscape ones 1280 px; loaded as you approach them). They cross-fade as you scroll and are **scrubbed** (the scene you leave swells toward you, the next one settles in) while each image **loops on its own** (a slow CSS float), so the page keeps moving between scrolls. The colour flood, all content, the menu, the steppers and the marquee are unchanged.

Chosen automatically on **phones and small touch tablets** (no banner: it is by design), when WebGL is missing, when the renderer is software (SwiftShader, llvmpipe, WARP), or when a GPU machine stays under about 15 fps twice in a row (decided live within a few seconds, after the resolution has been lowered once). `?lite=1` forces it, `?lite=0` forces live 3D. Posters are regenerated from the real scene with `tools/make-posters.mjs` + `tools/posters-to-webp.py`.

## Hybrid layer (HUD)
Technique borrowed from the "still-hybrid" study (a layer of CSS loops that keeps moving while scroll drives the scenes), drawn from scratch with no copied imagery: four hairline **guides** with corner crosses framing the page, two slowly **rotating rings** (one tinted with the chapter accent) behind the 3D or posters, a **live coordinate readout** on the left edge (scroll position, percent, chapter), a **progress bar** across the top, and a **static grain** on desktop. Everything animates with transform or opacity only; the grain does not blend and does not move (the old animated, blended grain was a measured cost).

## Menu
The menu button is shown at every width. Opening grows a full-screen colour wipe from the button (accent layer first, background layer 100 ms behind), then the links rise in one by one; closing reverses it. The closed menu is `visibility: hidden` and `inert`, so it is never focusable.

## House style
No em dashes anywhere (copy, code comments, docs). Enforced by a test that scans the repository and the rendered pages.

## Authored assets
ssets/blender/build_agent.py builds public/models/agent.glb headlessly (see ssets/README.md). Everything else is generated in code.

## Dev affordances
`?qa=1` (skip reveals/intro, snap camera) · `?intro=0` · `?at=<kf>` · `?q=low|mid|high` · `?gov=0` (disable resolution governor) · `?perf=1` or key **P** (FPS / frame-time / draw-call HUD).
