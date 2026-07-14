# Charbel Toumieh — Portfolio

A gallery on putty paper. My portfolio as an AI Engineer, presented as a museum exhibition —
numbered rooms, wall labels, plate numbers and a colophon.

**Live:** [charbelto.github.io](https://charbelto.github.io)

---

## Design

- **Aesthetic** — warm putty canvas (`#c4c3b6`), stark black ink rooms, hairline rules,
  no gradients, no shadows, no stock imagery. Editorial serif (Instrument Serif) at display
  sizes for moments; neutral grotesk (Inter) for systems.
- **Structure** — six numbered rooms: The Engineer · Experience · Materials & Methods ·
  Selected Works · Education · Inquiries.
- **Signature moves** — stacked `CHARBEL / TOUMIEH` wordmark justified edge-to-edge,
  engraved-SVG ink interlude with a notched card, scroll-drawn experience rail, reading-progress
  hairline, fullscreen index veil, blend-aware header, magnetic pills and a custom cursor ring.

## Performance

- Vanilla HTML / CSS / JS — zero frameworks, zero build step, zero dependencies.
- No raster imagery except one 24 KB portrait; all art is inline SVG.
- Two font families, three weights total, loaded with `preconnect` + `display=swap`.
- `content-visibility: auto` on below-fold rooms; all animation is transform/opacity,
  rAF-throttled, and fully disabled under `prefers-reduced-motion`.

## Accessibility

Semantic landmarks, skip link, focus-visible styles, `aria-expanded`/`aria-hidden` on the menu,
Escape-to-close, and motion-safe fallbacks. Content renders complete without JavaScript.

## Local development

```bash
git clone https://github.com/Charbelto/Charbelto.github.io.git
cd Charbelto.github.io
python -m http.server 4173   # or: npx serve .
```

## Structure

```
├── index.html                    # Content & structure
├── styles.css                    # Design system & layout
├── script.js                     # Interaction layer
├── profile.jpg                   # Portrait (Fig. 01)
├── Charbel_Toumieh_Resume.pdf    # CV
└── README.md
```

## Connect

- **Email:** charbeltoumieh1@gmail.com
- **LinkedIn:** [linkedin.com/in/charbeltoumieh](https://www.linkedin.com/in/charbeltoumieh/)
- **GitHub:** [github.com/Charbelto](https://github.com/Charbelto)
