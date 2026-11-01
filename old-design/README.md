# Charbel Toumieh — Portfolio · charbel.os

Dark AI-lab portfolio: void black, electric violet/cyan, HUD chrome and terminal motifs.
Built to make a hiring manager stop scrolling.

**Live:** [charbelto.github.io](https://charbelto.github.io)

---

## Signature interactions (all vanilla JS/CSS — zero libraries)

- **Interactive particle network** — hero constellation that scatters away from the cursor
- **Boot screen** — terminal log + vertical-columns reveal (once per session)
- **Immersive char reveals** — headings rise letter-by-letter from blur
- **Scroll-zoom case study** — the GREAT platform terminal scales up as you scroll
- **Pinned horizontal gallery** — vertical scroll drives the Selected Works track sideways
  (native swipe + snap on mobile)
- **Exploding capability core** — orbital node map that decomposes on hover/tap
- **3D tilt + spotlight** — cards tilt in perspective and light up around the pointer
- **Parallax storytelling** — experience rail draws itself; ghost numerals drift at depth
- **Counter-parallax streams**, magnetic buttons, custom cursor with context tag,
  reading-progress bar, fullscreen column-slide menu

## Performance & robustness

- Zero frameworks, zero build step. Two font families; all art is CSS/SVG/canvas.
- Single rAF scroll pipeline; IntersectionObserver reveals; canvas pauses off-screen,
  DPR-capped, and disabled on touch/reduced-motion.
- `content-visibility: auto` below the fold. Full `prefers-reduced-motion` fallbacks —
  pins, tilt, particles and boot all degrade to static.
- Content is complete without JavaScript. `?flat` renders a static page for QA tooling.

## Sections

`01 Profile` · `02 Case: GREAT` · `03 Experience` · `04 The Stack` ·
`05 Selected Works` + full 24-project archive · `06 Education` · `07 Contact`

## Local development

```bash
git clone https://github.com/Charbelto/Charbelto.github.io.git
cd Charbelto.github.io
python -m http.server 4173   # or: npx serve .
```

## Connect

- **Email:** charbeltoumieh1@gmail.com
- **LinkedIn:** [linkedin.com/in/charbeltoumieh](https://www.linkedin.com/in/charbeltoumieh/)
- **GitHub:** [github.com/Charbelto](https://github.com/Charbelto)
