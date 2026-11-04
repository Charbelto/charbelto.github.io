# CRITIQUE v3 (independent creative-direction + front-end QA review)

Reviewed from stills only (`qa/review-final/`, all five viewports, plus the contact sheets). Nothing in the repo was edited.

## Verdict

This is a real step up from the black ring engine. The colour worlds are loud and correct (lime, lilac, coral, sky, yellow, mint, pink, violet), the name is never hidden, and most objects now say what the chapter is about: the headset, shelf-and-magnifier, clipboard, shield, LoopGuard chain, cart plus containers, cell tower, container ship, OCR page and envelope all read in under a second. Desktop at 1440 is close to a portfolio I would shortlist. It is not yet Awwwards-level, for three reasons. First, the objects are small, simple bevelled primitives floating in empty space with a lot of dead area around them, so they feel like props in a stock scene, not hero-scale glossy sculpture (Lusion fills the frame, this does not). Second, phones are the weak link: objects are shoved under the header and the step pips, cropped at both sides, then separated from the card by a 150 to 200 px void, and on profile and contact the card simply hides the object. Third, a handful of objects are ambiguous or visibly weaker than the rest (brain, heart, can, DermSense, the GREAT phone), and text over the busiest 3D (dive, play, contact, mobile hero) loses legibility. Fix the top ten items below and this moves from a strong 7 to a credible 8.5.

## Scores (1-10)

| Area | Score | Reason |
|---|---|---|
| Hero | 8 | Name is huge, solid plus outline, fully legible at all five sizes, lime is exactly the Landonorris move. Loses points for the thin outline surname, a dark fade on the bottom of CHARBEL, and on phones the eyebrow and H1 sit on the densest part of the swarm. |
| Object specificity | 8 | 20 of 24 objects are instantly about their topic. Brain, heart, can and DermSense need work; the funnel in retrieval is tiny and detached. |
| Project objects (w1 to w6) | 7.5 | LoopGuard chain with the trapped bot, cart plus containers, tower and supermarket aisles are good. DermSense reads as a layer cake, w1 breaker is cropped, w4 containers are cut by the left edge. |
| Experience objects (xp0 to xp7) | 7 | Container ship, OCR page, skyline plus chip, gears are good. Brain is a pink blob, heart is flat and has spider-leg wires, can reads as a battery. |
| GREAT | 6.5 | Headset is the best single model on the site, but the phone face (green disc with a minus bar) reads as "do not disturb", stars are pale outlines, and on great3 the card sits on top of the headset. Crops on phone and tablet. |
| Colour / full-screen feel | 8.5 | Strong, continuous, the page is never black. Docked for pale worlds (w1 cream, archive lilac, xp4 pale blue, DermSense pale blue with pale peach object) and a black marquee wedge under the header on tablet profile. |
| Typography / hierarchy | 8 | Wide grotesk plus italic serif plus mono is a confident system. Docked for orphaned mono eyebrows, the hero H1 being tiny next to the name on tablet and phone, and 11 to 14 px copy on desktop cards. |
| Legibility | 6.5 | Card text is fine. Dive paragraph, play italic "the swarm.", play and dive eyebrows, contact email and small-print, mobile hero eyebrow and H1, and muted nav links on coral and violet all fail or nearly fail. |
| Mobile (390/360) | 6 | Structure is right (stage on top, card below) but execution is not: pips overlap objects, side crops, big dead gap, profile and contact objects hidden, 360 has the same layout with slightly worse cramping. |
| Tablet (768) | 7 | Cleanest small layout, objects have room, pips sit under the card. Still has empty bands, the can and phone tops fade or clip at the top, and the black marquee wedge collides with the header on profile. |
| Steppers / navigation UI | 7 | Pips and dots are unobtrusive and consistent. But two systems at once (pips plus six dots) with no labels, ghost pips leak into archive under the nav, dots collide with content on w1 and contact, and the 6 to 8 px pips are a poor touch target. |
| Polish | 6.5 | Several edge crops, a text-over-toy collision on contact, flat-shaded heart next to glossy neighbours, faded tops on some objects, leftovers from the previous section under the header in some frames. |
| Originality | 7.5 | Colour-as-identity plus topic-specific toy objects is a distinct idea and the Pip character helps. It still leans on the Lusion/Landonorris recipe; nothing here is a memorable signature moment beyond Pip and the playground. |

**Overall: 7.3 / 10.**

## The 10 highest-impact fixes, ranked

1. **Mobile and tablet stage composition (all cap*, great*, w*, xp*; mobile390, mobile360, partly tablet768).**
   What is wrong: the object is pushed into the top 35 percent, tucked under the header and the step pips (pips sit on top of the books, the headset arch, the clipboard, the shield, the heart), cropped at left and right (DermSense block, cart and containers, ECG paper, headset ear cup), and there is a 150 to 200 px empty band before the card. 
   Change: fit each prop to the stage width with a safety margin using its bounding box, centre it in the free band between header (about 72 px) and card top, scale it up about 15 to 25 percent, and move the pips out of the 3D area, either into the top of the card or in a slim row directly above it with a 16 px gutter. Tablet gets the same treatment (can and phone tops are clipped or faded).

2. **Profile and contact on phones hide their object (mobile390/360 profile, contact; tablet profile).**
   What is wrong: the profile card covers nearly the whole laptop (only a sliver of the screen shows), the contact card covers the envelope and the marquee text runs under the header; contact footer line is cut off at the bottom edge.
   Change: give these two chapters the same stage-on-top, card-below pattern as the pinned steps (object band about 38 vh, card below, shorter profile copy or an expandable "more"), and add bottom padding so the copyright line is not clipped.

3. **Hero legibility over the swarm on phones and tablet (mobile390, mobile360, tablet768 hero).**
   What is wrong: the mono eyebrow ("AI ENGINEER, AGENTIC SYSTEMS...") and the H1 ("I build intelligence that survives production") sit directly over the densest cluster; toys pass in front of the H1 on mobile; the H1 is about 26 px against a 90 to 130 px name. On desktop the outlined TOUMIEH is a hairline stroke and the bottom of CHARBEL has a dark gradient fade that looks like an artefact.
   Change: on portrait move the swarm lower or push its centre away from the text block, put the eyebrow and H1 on a solid lime plate or give them a 6 to 8 px lime halo; raise the H1 to about 34 to 40 px on phones; thicken the surname stroke to about 2.5 to 3 px (or add a 10 percent ink fill); remove or explain the fade on CHARBEL.

4. **GREAT chapter objects and composition (great1 to great3, all viewports).**
   What is wrong: the phone screen (green disc with a minus bar, plus a second green dot) reads as "do not disturb", not a live call; the score card stars are pale outline stars that vanish on violet and blue; on desktop great3 the left card covers the left half of the headset; on tablet and phone the headset and score card are clipped.
   Change: put a recognisable call UI on the phone (caller avatar, a waveform, a timer, a red hang-up button), use solid filled gold stars, shift the great3 formation right (or the card left and narrower) so the headset stays fully visible, and keep every part inside the safe area on portrait.

5. **Edge crops and card overlaps on desktop (w1, w4, xp2, xp4, archive; 1440 and 1280).**
   What is wrong: w4 service containers are cut by the left edge; w1 breaker box is cropped at the right edge and sits under the dot rail; xp4 ECG paper is cut off at the left and its right end disappears behind the card; xp2 table and brain are clipped at the left, the MRI stack touches the card; archive cabinet's folders vanish behind the list card.
   Change: add a per-step camera offset or scale so every prop stays between a 72 px left margin and the card edge minus 24 px, and a 56 px right margin where the dot rail lives.

6. **Text over 3D collisions (dive, play, contact desktop; dive and play mobile).**
   What is wrong: the dive paragraph is white text on a moving field of toys and is partly unreadable; "SCROLL TO ENTER" and the play eyebrow ("INTERACTIVE, TRY IT") are tiny mono over toys; play "the swarm." is white italic on white and cyan toys; on contact the email address and the small print ("Coventry, UK...") are crossed by red and blue spheres and a white cube, and the word "ship" is clipped by a pill.
   Change: add a soft colour scrim or backdrop blur behind the paragraph and eyebrows, clear a text-shaped hole in the swarm (repel toys from the copy rectangle), make "the swarm." ink or lime instead of white, and put the contact email on the same frosted tile used on phones.

7. **Stepper UI polish (all pinned groups).**
   What is wrong: six faint pips leak into the archive chapter under the nav at y of about 60 on desktop, touching the nav; pips on phones overlap objects (see 1); pips are 6 to 8 px with no step number, no label and a very small hit area; desktop shows both pips and a six-dot rail with no tooltips so it is unclear what each dot is; the dot rail overlaps content on w1 (breaker) and contact (paper plane).
   Change: hide the stepper pips outside their group; on phones use a pill with "3 / 8" and a chapter name, at least 32 px tall; on desktop add hover labels to the dots ("Systems, Great, Works...") and nudge them 8 px further from content; give the active pip an accent colour instead of just fill.

8. **Weak or ambiguous objects (xp2 brain, xp4 heart, xp5 can, w2 DermSense, w5 tower, cap2 funnel).**
   - xp2: the brain is a pink lumpy blob on a cylinder; add a longitudinal fissure, gyri and a cerebellum, and drop the pedestal so it floats above the slices.
   - xp4: the heart is flat matte coral next to glossy neighbours, and the black wires with bubbles hanging from it read as spider legs; give it the same clear-coat as everything else, add chambers, remove the wires or make them ECG leads attached to the paper.
   - xp5: a blue cylinder with a red band reads as a battery; add a tab, tilt it, give it a recognisable can silhouette and a swirl.
   - w2: peach layers on pale blue, reading as a layer cake or a book; make epidermis, dermis and fat three clearly different saturated bands, show a cut face, and add the heat map as an emissive gradient.
   - w5: the signal rings are a single flat red ring and the yellow disc half way up the tower is unexplained; show 3 concentric pulsing arcs from the antenna and drop or explain the disc.
   - cap2: the funnel is tiny and floats away from the books, the magnifier sits under the shelf; put the lens in front of the books and feed the funnel with chunks from the books.

9. **Colour: keep every chapter saturated and avoid dark fragments (w1, w2, xp4, archive, tablet profile, cap5, archive cabinet).**
   What is wrong: w1 is a cream paper world, archive a pale lilac, w2 and xp4 pale sky blue with a pastel object, so the full-bleed feel drops in the middle of the page; the cabinet side, clipboard, phones and a black marquee wedge on tablet profile bring back near-black.
   Change: give those chapters a punchy flat colour (for example a coral or electric blue for w1, a saturated lilac for archive), use a deep tinted colour (not black) for object bodies, and fix the marquee so it never shows a black gradient under the header.

10. **Type scale and nav legibility (desktop 1440/1280, mobile).**
   What is wrong: mono eyebrows are widely tracked and wrap with a one-word orphan ("LENS", "AGENTS", "TO PRESENT"); the ghost numeral "02" collides with the nav links on cap2; nav links (muted ink) are low contrast on coral and violet; card body text is 13 to 14 px and mono tags are 11 px on a 1440 screen; mobile profile card is a wall of text.
   Change: shorten eyebrows to a single line or drop the second phrase, move ghost numerals down 40 to 60 px or clip them under the header, raise nav-link contrast to at least 4.5:1 per world, bump desktop card body to 16 px and tags to 12 px, and trim the phone profile copy.

## What I cannot judge from stills

- Motion quality: assembly and disassembly of each object, the camera moves, damping, the beat of the heart, the sweeping scan bars, Pip following the cursor, the playground flood.
- Performance: frame rate, thermals, memory, the resolution governor, how smooth it is on a mid phone, and whether the quality tiers kick in correctly.
- Lite mode: these stills show the full 3D look, not the pre-rendered posters or the "Try full 3D" banner, so I cannot say if lite mode looks equally good or loads fast enough.
- Pinned-step behaviour: whether jumping with pips and dots feels precise, whether scroll feels hijacked, whether the 0.3 screen per step is comfortable on touch, and the actual page length (I can see the sections, not the total scroll).
- Interaction states: hover, focus rings, menu wipe, loader, reduced motion, keyboard use, screen reader use.
- Several frames caught a transition: the meet frame on phones shows the bottom of the profile card under the header, the dive frame on desktop and tablet shows a ghost of the "Make Pip wave" button, and tablet profile shows a dark marquee wedge under the header. I cannot tell whether those are real overlaps at rest or capture timing, so please verify them at rest.
- Real-device rendering: colour accuracy on phone screens, safe-area insets, browser toolbar resizing and iOS address-bar behaviour.
