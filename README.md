# Charbel Toumieh — Portfolio

Clean product-page portfolio: black and light-grey sections, large tight type, rounded bento tiles,
a frosted nav bar and pill buttons. Built to make a hiring manager stop scrolling.

**Live:** [charbelto.github.io](https://charbelto.github.io)

---

## Interactions (all vanilla JS/CSS, zero libraries)

- **Scroll-lit statement**: the opening sentence lights up word by word as it travels up the screen
- **GREAT bento**: outcome tiles with counting numbers and an animated four-stage pipeline
- **Project carousel**: native horizontal scroll with snap and paddle buttons; each card is one link
- **Search palette**: `Ctrl/⌘ + K` (or `/`) jumps to any section, copies the email, opens the résumé
- **Archive filter**, accordion questions, receding hero, frosted nav that tracks the section in view

## Performance & robustness

- Zero frameworks, zero build step. One font family (system San Francisco on Apple devices, Inter elsewhere).
- Single rAF scroll handler; IntersectionObserver reveals; transform and opacity motion only.
- Full `prefers-reduced-motion` fallbacks. Content is complete without JavaScript.
  `?flat` renders a static page for QA tooling.

## Sections

`About` · `GREAT` · `Experience` · `Skills` · `Projects` + full 24-project archive ·
`Education` · `Questions` · `Endorsements` · `Contact`

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

## Redesign
A real-time 3D redesign of this portfolio lives in [`new-website/`](new-website/). It is not deployed; this root is the live site. See `new-website/README.md`.
