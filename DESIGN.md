# Design system

## Principles
1. **Content stays HTML.** All copy, links and metadata are real, searchable DOM. The 3D is a fixed transparent canvas *behind* the text; nothing essential is only inside WebGL.
2. **One camera, many chapters.** Every `[data-kf="name"]` element owns a keyframe in `src/scene/keyframes.js`. Scroll position interpolates keyframes; damping makes motion fluid and fully reversible.
3. **Two accents only.** Signal orange `#ff5a1f` and ice `#8fd0ff` against warm-neutral blacks and bone.
4. **Glass panels only where text meets 3D.** Reading content sits on blurred dark glass; the scene dims (`--dim`) behind long-form chapters.

## Tokens (`src/style.css`)
| Token | Value | Use |
|---|---|---|
| `--bg` | `#07080b` | page / fog colour |
| `--ink` | `#ece8e1` | primary text (bone) |
| `--mute` | `#8d8f97` | labels, meta |
| `--signal` | `#ff5a1f` | accent, CTAs, key figures |
| `--ice` | `#8fd0ff` | focus ring, counter-flow |
| `--glass` | `rgba(9,10,13,.58)` | panel background |

## Type
- **Archivo** (variable width + weight): display at width 112–125% / 700–800; body at 100%.
- **Instrument Serif italic**: editorial accent words, project subtitles, quotes.
- **JetBrains Mono**: labels, indices, tags, meta (uppercase, tracked).

## Components
Chapter panel (`.panel`, left/right alternating) · wide block (`.wide`) · index label (`.idx`) · tag pills · numbered stages · metrics grid · buttons (`.btn--solid|--ghost`) · archive list with filter chips · experience rows · FAQ `details` · modal (focus-managed, Esc closes).

## Motion
Intro: machine assembles from an exploded/far state while the name resolves from blur (≈3.4 s). Chapters: panels rise in once per entry. Buttons: 2 px lift on hover, press-down on active (interruptible, ≤ 350 ms). Pointer: spring-damped parallax on camera + machine, impulse on ring spin, and a cursor light. `prefers-reduced-motion`: camera snaps between keyframes, no spin, no grain, no intro.

## Responsive
Desktop: subject offset left/right of the text panel. ≤ 960 px: nav collapses to a menu. ≤ 720 px: panels anchor to the bottom, the camera lifts the subject into the upper half, name resized to fit, quality tier `low`/`mid`.

## Accessibility
Skip link, landmarks, visible `:focus-visible`, `aria-expanded` menu with Esc, `role="dialog"` modal returning focus, `details/summary` FAQ, canvas `aria-hidden`, readable content without JS or WebGL (`.no-gl` fallback), reduced-motion support.
