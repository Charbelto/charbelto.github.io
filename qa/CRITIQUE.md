# Independent creative-direction critique: Charbel Toumieh 3D portfolio

Reviewed from stills only (review-r2 for most frames, review-r3 for hero / cap3 / w2 / archive / contact). I viewed roughly 55 frames across desktop1440, desktop1280, tablet768, mobile390 and mobile360. I did not edit anything in the repo.

## 1. Overall verdict

This is a strong, cohesive portfolio, and clearly well above the usual "Three.js template" tier. A single procedural machine (dark chrome segmented rings, a hot orange core, a restrained blue accent) is carried from hero to contact, and the lighting on it is genuinely filmic in the best frames (xp2, great2, cap5). It could plausibly collect Site of the Day / Developer nominations and could be shortlisted, but I would not bet on a win. It is not yet at the Lusion / Lando / Bruno Simon bar. The single biggest gap is range. The whole 3D story is one object seen from different angles, so after about four scroll beats it stops surprising. The HTML layer is a repeated dark glass card (about 540 px wide, left or right) that turns a cinematic scene into a "sticky card over a background" template. There is no moment of physical interplay between the 3D and the typography, no signature interaction I can see in stills, and no "wow" set piece that is not the same ring. The ring-to-chapter mapping (retrieval, tools, evaluation) is also decorative rather than explanatory. A viewer cannot tell from the visuals that ring 3 is "tools".

## 2. Scores (1-10)

| Area | Score | Justification |
|---|---|---|
| Hero | 7.5 | Huge CHARBEL / outline TOUMIEH plus the ring on the right is a confident composition. The 3D plates cut the "L" and "H" of the name, and the stat strip sits on top of the ring. |
| Dive / cinematic transitions | 7 | "Step inside the system" with the camera going into the rings is the best poster frame. The body copy sits on bright ring geometry and is only just legible. I cannot judge the motion. |
| Ring chapters (cap1-5) | 6.5 | Rich and moody, but all five chapters are the same object with a different crop. cap2 and cap4 are almost identical, and nothing visual says "retrieval" or "tools". |
| GREAT (flagship) | 7.5 | The exploded ring stack and the funnel / beam are the best-designed 3D object on the site, and the copy hierarchy works. The lower rings are muddy black, great2 crops the hero object at the left edge, and the great3 stat grid is misaligned. |
| Project gallery (w1-w6) | 5.5 | The weakest 3D section. The artifacts are small, toy-like and flatly lit, in a big black void. The materials (matte amber nodes, plain cubes) do not match the chrome-and-glow language of the rings. |
| Experience / archive / edu | 5.5 | xp0-xp7 reuse the ring well and xp2 is gorgeous. The archive and edu panels drop to a plain HTML list and FAQ with a dead left half and a clipped top. |
| Contact | 7 | A centred closing statement with an inside-the-ring backdrop is strong. The microcopy is unreadable on the bright ring edges, and there is no final 3D beat or closure. |
| Typography & hierarchy | 7.5 | Wide grotesk plus italic serif accent plus mono labels is a good, ownable system. Failures: "GREAT" overflowing its card, the hero H1 being tiny next to the name, the mono labels at about 10-11 px, and long dense paragraphs in the profile. |
| Legibility over 3D | 6.5 | Glass cards protect most body copy. Direct-on-3D text (the dive paragraph, the contact footer microcopy, the hero stats, the hero eyebrow on tablet) fails. |
| Mobile composition | 7.5 | Genuinely good: 3D on top, card pinned at the bottom, consistent. Issues: the hero is cramped, the great2 ring is glitchy, there is a dead lower quarter on dive and contact, the 360 header wraps, and text bleeds behind the header. |
| Tablet composition | 6 | Reads like stretched mobile. The hero tagline and eyebrow collide with the ring, cards are full width and wordy, and contact leaves the lower 30% empty. |
| Lighting / materials | 7.5 | Metal with a fire core and accent edge lights is cohesive and premium. It is a narrow palette and gets monotone. Panels show stair-step "teeth" aliasing and some black faces crush to nothing. |
| Originality | 6 | The gyroscope-of-rings concept is distinctive enough, and the camera-as-narrative is right, but the layout system (alternating glass card) and section structure are conventional. |

**Overall: 6.8 / 10**

## 3. Top 10 fixes, ranked by impact

1. **Gallery (w1-w6, all desktop, w2/w4 on mobile): scale up the artifacts and make them part of the same material world.**
   - What is wrong: each project object fills about 25-35% of the frame inside a large empty void. The matte amber nodes (w6), the plain black cubes (w4) and the flat-grid discs (w2) look like a different, cheaper renderer than the chrome rings. The red dashed floor track is the only connective tissue and reads as a graph axis, not a place.
   - Change: push the camera in about 1.5-2x, so each artifact is the hero of its frame. Give every artifact the ring material kit (dark chrome, orange emissive core, blue rim light) and a rim or bloom pass. Add a floor reflection or glow pool under each, and a focal light that matches the ring core. Cut the dashed track or turn it into a proper lit rail.
2. **Cards (every chapter, desktop1440): break the "same glass card" template.**
   - What is wrong: about 25 consecutive frames use the same rounded dark panel, 540 px wide, alternating left and right. It takes up about 38% of the viewport and flattens the pacing.
   - Change: vary the typographic treatment per beat. Examples: cap chapters as oversized outline numerals with a one-line statement and no box; GREAT's outcomes as huge floating stats directly in the 3D; keep the card only for dense copy (profile, archive, xp). Let a headline overlap or occlude a ring so the type and the 3D interact.
3. **Hero (desktop1440 / desktop1280): fix the name vs. ring collision.**
   - What is wrong: "CHARBEL" is truncated at the "L" and "TOUMIEH" at the "H" by the ring plates, and debris shards nick the letters. It reads as a clipping bug, not an intentional depth sandwich. The stat strip ("34+", "24 PUBLIC PROJECTS") sits directly on bright ring metal with 10 px mono labels.
   - Change: either shrink or shift the name 60-80 px left, or deliberately run it behind the ring so the whole word is visible with a clear occlusion edge. Move the stat strip to the left column under the CTAs, or give it a scrim. Enlarge the H1 ("I build intelligence...") from about 36 px; right now it is the least emphatic element above the fold.
4. **Ring chapters cap1-cap5 (desktop1440): differentiate the five rings.**
   - What is wrong: cap2 and cap4 are nearly the same frame, and cap3 and cap5 differ by a rotation. Nothing in the 3D communicates orchestration, retrieval, tools, evaluation or reliability.
   - Change: give each ring a distinct, readable behaviour or module: orchestration with orbiting nodes plus a connecting arc, retrieval with particles being drawn in, tools with socket / plug docking pieces, evaluation with a scanning plane and a pass / fail tick colour, reliability with a fault flare and a recovery pulse. Let the camera do something different per chapter (a pull-back and a close macro). Change the accent colour per ring (blue for retrieval, green or teal for evaluation) to break the monotony.
5. **Archive (desktop1440 / desktop1280): fix the dead half, the clipping and the label overlap.**
   - What is wrong: 40% of the frame is empty black with a small ring fragment top-left, the list is cropped at the bottom edge, and the progress label "ARCHIVE" prints over row 18.
   - Change: bring the machine back behind the left half, perhaps dimmed and slowly rotating. Make the list sticky or internally scrollable so it never cuts mid-row, and hide or relocate the progress label while a list panel is on screen.
6. **Edu / FAQ (desktop1440, tablet): the top of the panel is clipped under the header, and the section is a plain web page.**
   - What is wrong: "06 EDUCATION & LEADERSHIP" sits directly under the nav, ghosted, and the card top is cut off. Education, leadership and a five-item FAQ are jammed into one tall panel, with an AI-lecturer line that looks like "Alcademy".
   - Change: start the panel lower or pad the top. Split into two beats (education as two large degree cards over the machine, FAQ moved to a quiet end-of-page block). Fix the "AIcademy" letterform ambiguity by using a different weight or spelling it "AI-cademy".
7. **Header vs. content (xp1 tablet768 / mobile390, archive mobile390, profile desktop): content bleeds under the fixed header with no backdrop.**
   - What is wrong: ghost text from the previous card ("as you read — ... the core.") appears behind the logo and CONTACT button, and an orange "Open repo" button peeks at the top of mobile archive. On desktop the card top is cut by the logo and "01 PROFILE" collides with the brand.
   - Change: add a gradient header scrim, or fade cards out before they reach the header zone (mask-image on the card container, 80 px).
8. **Legibility over bare 3D (dive desktop1440, contact desktop1440 / 1280, hero tablet768): add scrims or reduce copy.**
   - What is wrong: the dive paragraph ("Five concentric rings. One engine...") runs across bright ring panels at about 18 px. The contact microcopy ("Coventry, UK · Beirut, LB · US & EU...") is 11 px mono over ring edges. The tablet hero eyebrow is struck through by ring geometry.
   - Change: add a soft radial dark scrim behind centred text, bump microcopy to 12-13 px with higher opacity, and cut the contact microcopy to one line.
9. **GREAT (great1 desktop1440 / great2 mobile390 / great3 desktop1440): three specific defects.**
   - great1: "GREAT" at 1440 pokes about 24 px outside the card's right edge (the "T" crosses the border). Clamp the font size to the card width or widen the card.
   - great2 (mobile): the edge-on ring renders as a black, glitchy dashed strip at about y=240, which reads as a rendering artifact. Slightly tilt the camera so the ring never goes exactly edge-on, or fade the ring out at that angle.
   - great3: the stat grid has mismatched label heights. "QA EFFORT" sits lower than "EVALUATION QUALITY" with its two-line sub-label, so the baselines of the numbers align but the labels do not. Give every stat the same three-row structure. Also the lower rings are crushed black; lift the fill or add rim lights so the structure reads.
10. **Mobile / tablet polish (hero mobile390 / mobile360 / tablet768, dive mobile390, contact mobile / tablet).**
    - What is wrong: on mobile the H1 overlaps the top of the ring, the eyebrow wraps awkwardly with an orphaned "LLM EVALUATION", and "CHARBEL" touches both screen edges (at 360 it reads as clipped). At 360 the header brand wraps to two lines. Dive and contact leave a dead lower quarter. On tablet the layout is a scaled-up phone and contact leaves 30% empty.
    - Change: on mobile set the name to about 14vw with a safe margin, shorten the eyebrow to one line, and push the 3D object down so the H1 sits above it, not on it. Hide the brand text under 380 px, or use the monogram only. Re-centre content vertically on dive and contact. For tablet, use the desktop side-by-side layout from about 900 px and a two-column treatment (card beside the 3D) at 768.

## 4. Things that look broken

- **Hero, desktop1440 / 1280:** the "L" of CHARBEL and the "H" of TOUMIEH are cut by ring plates. It reads as clipping, not occlusion, and debris shards nick the letterforms.
- **Hero, tablet768 and mobile:** the H1 and the eyebrow overlap ring geometry ("SYSTEMS · RAG" is struck through on tablet).
- **great1, desktop1440:** the "T" of GREAT extends past the card's right border.
- **great2, mobile390:** a thin, edge-on ring renders as a glitchy black dashed line with hard aliasing.
- **Profile, desktop1440 / 1280:** the card top is cut off by the header and the "01 PROFILE" eyebrow is overlapped by the brand lockup.
- **Edu, desktop1440:** the same issue: the label sits under the nav and the panel top is clipped.
- **Archive, desktop1440:** the progress label ("ARCHIVE") prints over row 18, the list is cut off at the bottom, and the left 40% of the frame is empty.
- **Archive and xp1, mobile390 / tablet768:** the previous card's content bleeds under the fixed header and collides with the logo and CONTACT button.
- **w2, desktop1440:** a particle cloud from the next artifact (OULAD) pokes out from behind the card's right edge, which reads as an unintended clip, not an intended hand-off.
- **w1-w3, tablet768:** the previous artifact is cut off at the left edge of the frame (a hard crop at the viewport border).
- **Hero stat strip, desktop1280:** "24 PUBLIC PROJECTS" sits on bright ring metal and its label is hard to read.
- **cap4 progress label, desktop1440:** "EVALUATION" is partially overlapped by a ring shard ("EVALUATION" reads as "VALUATION").
- **Mobile360, all headers:** the brand name wraps to two lines.
- **Minor content oddities:** xp2 (Chehab Lab, Jan 2026 - Jun 2026) follows xp1 (Gabriel & Co., Jun 2024 - Present), so the "newest sits closest to the core" ordering is not strictly chronological. The contact "response guaranteed under 24h" appears next to a FAQ item about a "guaranteed response time"; make sure those agree.

## 5. What I cannot judge from stills

- Motion quality: camera easing, scroll-linked pacing, transition timing, whether the dive feels cinematic or merely smooth.
- Interaction: pointer parallax, hover / magnetic states, cursor effects, the FAQ and archive filter animation, any drag-to-orbit or click interaction in the gallery.
- Load and performance: time to first frame, loader design, frame rate on mid-range laptops and phones, thermal throttling, how heavy the post-processing is.
- Audio, if any.
- Whether the aliasing on the ring teeth and the edge-on ring on mobile is a static-frame artifact or visible in motion.
- Real-device behaviour (mobile browser chrome resizing the viewport, touch scroll feel).

## Summary

- Overall score: 6.8/10. It is cohesive and polished, shortlist-plausible but not a winner.
- Fix 1: rebuild the project gallery (w1-w6) at a larger scale in the same chrome and glow material language.
- Fix 2: break the repeated glass-card template with varied typographic treatments and type that interacts with the 3D.
- Fix 3: fix the hero name collision with the ring (CHARBEL / TOUMIEH cut) and move the stat strip off the bright metal.
- Fix 4: differentiate the five ring chapters with a distinct behaviour, camera move and accent colour each.
- Fix 5: repair the archive, edu and header-bleed issues (dead half, clipped panel tops, labels over rows, text under the nav).
