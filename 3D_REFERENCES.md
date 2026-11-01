# 3D Portfolio Reference Experiences

Research brief for the redesign/3d-universe branch. Purpose: set a quality bar and extract *principles*, not assets. Nothing here is a license to copy.

## Evidence legend (read this first)

| Tag | Meaning |
|---|---|
| **[fetch]** | Retrieved with WebFetch this session. NOTE: WebFetch returns text only (no rendered WebGL, no pixels) and passes the page through a small summarizer model, so even "verified" items are text-level facts (copy, tags, scores, credits), not visual verification. |
| **[search]** | From a WebSearch result snippet only. Not opened. |
| **[prior]** | My background knowledge, not confirmed this session. Treat as unverified. |

**I could not take screenshots or run any site in a browser, so I have not seen any of these experiences render.** Every statement about look-and-feel below is either text-derived or marked [prior]/unverified.

## Summary table

| # | Reference | Type | Real-time 3D? | Evidence quality |
|---|---|---|---|---|
| 1 | Lusion v3 | Studio portfolio | Yes (Awwwards tags 3D; cursor-reactive) | Awwwards [fetch]; site text thin; technique [prior] |
| 2 | Lando Norris | Athlete site, SOTD 2025 | Yes, WebGL + GSAP on Webflow (tags) | Awwwards [fetch]; technique partly [search] |
| 3 | Bruno Simon | Playable portfolio | Yes, full game | Site text [fetch]; stack confirmed by site text + [search] |
| 4 | Zajno: Space Pollution (x2 shots) | Dribbble concept | Almost certainly not (concept) | [search] only; shots NOT fetched |
| 5 | Igloo Inc | Corporate landing, SOTD Jul 2024 | Yes | Awwwards [fetch] + case study [fetch]; best-documented |
| 6 | Spyker Cars | Luxury/e-commerce story, SOTD Oct 30 2026 | Yes, WebGL + GSAP (tags) | Awwwards [fetch] + site text [fetch] |
| 7 | Don't Look Up (game) | Satirical game, SOTD Nov 1 2026 | Yes, Three.js + GSAP (tags) | Awwwards [fetch] + site text [fetch] |
| 8 | G. Colombel Portfolio 2026 | Developer portfolio, SOTD Oct 28 2026 | Yes, Three.js/WebGL, WebGPU slider (tags) | Awwwards [fetch]; own site text [fetch] |

Items 5-8 were picked from the Awwwards 3D listing (page 1 [fetch]) plus Igloo Inc, which I added as a deliberate high-bar benchmark because it has a published technical case study. I could not load the Dribbble `3d-website` tag page (fetch returned empty), so no Dribbble-sourced extras; Dribbble items are mostly concepts anyway.

---

## 1. Lusion v3 (lusion.co)

- **Evidence:** Awwwards page [fetch]: Site of the Day Oct 2, 2023; SOTD 8.25, Dev 8.41 (Animations/Transitions 10.00, WPO 9.00). Tags: 3D, Animation, Design Agencies. Featured elements: "Reactive cursor interaction", "Scroll animation". Description: "Our 3rd version of our portfolio featuring some of our latest work, experiments and thought process." Homepage text [fetch]: "Award Winning 3D and Interactive Web Studio", Bristol; nav Home/About/Projects/Contact + Labs; tiles for Porsche: Dream Machine, Meta: Spatial Fusion, Devin AI, Soda Experience, etc.; "scroll to explore", "Play Reel". Page text names no technology.
1. **What makes it exceptional:** The only perfect (10.00) Animations/Transitions score of the set [fetch], paired with strong WPO (9.00): motion-heavy yet performance-disciplined. Studio is itself the pitch: the site *is* the portfolio piece.
2. **Strongest technique:** Cursor-reactive 3D with scroll-driven animation (both named in Awwwards highlights [fetch]). Specific implementation (physics-driven objects, continuous scene across routes) is **[prior], unverified**.
3. **Information via 3D:** Per the [fetch] text, work is organized as project tiles with service tags (web/3D/AR); 3D appears to carry brand mood and navigation feel more than data. Cannot confirm further.
4. **Real-time vs static:** Real-time (tagged 3D + reactive cursor). Whether the whole scene is WebGL vs. partial: unverified.
5. **Inspire:** Make the cursor a first-class input to the scene (objects respond, not just a trailing dot); budget performance as a feature (WPO) so heavy motion still feels instant.
6. **Do NOT copy:** Lusion's scene composition, its object/material designs, its blue (#1a2ffb-style) identity, "Bold Ideas, Brought to Life" copy, client project tiles or reel.

## 2. Lando Norris (landonorris.com)

- **Evidence:** Awwwards [fetch]: SOTD Nov 17, 2025 + Dev Award; SOTD 8.18, Dev 7.58; creator OFF+BRAND.; tags include 3D, WebGL, GSAP, Webflow, Gestures/Interaction; palette #D2FF00 / #111112; description "A high-performance platform for F1 driver Lando Norris...". Site text [fetch]: Hero "2025 McLaren Formula 1 Driver", "Next Race" callout, Helmets Hall of Fame grid (2019-2025) with hover image swap, mobile rotate-device overlay, lock-screen mockup "tap to lock", Rive-like animation placeholders, image URLs suggest Webflow. Third-party snippets [search]: reactive blob-like overlays on the hero image following the cursor; a secondary video summary says depth maps + custom shaders; a GitHub recreation of the pseudo-3D portrait exists. Treat the latter as unconfirmed.
1. **What makes it exceptional:** Brand-saturated art direction (acid-yellow on near-black) executed on a Webflow base with WebGL layered in, showing a bespoke 3D effect doesn't require a fully custom engine. 18 jurors scored it 7.00-10.00 [fetch], so reception was polarised, not unanimous.
2. **Strongest technique:** Cursor-reactive hero treatment and (per secondary source, unverified) depth-map-driven pseudo-3D portrait via shaders [search].
3. **Information via 3D:** Mostly editorial content (calendar, galleries, helmets, store); 3D/WebGL is mood and interaction layer. The helmet archive is a content grid with hover swap per [fetch], not necessarily a 3D viewer.
4. **Real-time vs static:** Real-time WebGL effects (Awwwards tags). The 3D is decorative/atmospheric rather than a navigable world.
5. **Inspire:** Depth-map "2.5D" is an inexpensive way to give flat images parallax depth with a cursor; a single strong accent colour as the system.
6. **Do NOT copy:** Lando Norris's name/likeness/photos, McLaren/partner marks, helmet designs, OFF+BRAND's composition, the #D2FF00/black identity as a pair.

## 3. Bruno Simon (bruno-simon.com)

- **Evidence:** Site text [fetch]: self-described "creative developer (mostly for the web)"; drive around and find secrets; options (audio, quality, respawn/reset, renderer choice with WebGPU listed), controls for keyboard/mouse/touch/gamepad, achievements with playtime counter, daily circuit time-trial leaderboard, "Whispers" message board, "Behind the scene" credits listing Three.js, Rapier (physics), Howler.js (audio), Amatic SC/Nunito fonts; code MIT on GitHub, music CC0. Server features showed "currently offline" during my fetch. [search]: repo is brunosimon/folio-2025 (Vite); a Korean summary matches the Rapier/WebGPU claims, which I did not verify in the repo.
1. **What makes it exceptional:** The portfolio is a *game*: play replaces reading. Replay value (achievements, daily leaderboard, shared whispers) turns a one-time visit into an event. Multi-input support (gamepad, touch) and quality/renderer options show craft.
2. **Strongest technique:** Physics-driven vehicle exploration in a single continuous world (Rapier + Three.js), with persistent social layer.
3. **Information via 3D:** Per the text capture, the page itself carries almost no portfolio content; work and facts are presumably embedded in the world (areas/signs). I could not confirm how projects are presented. [unverified]
4. **Real-time vs static:** Fully real-time interactive.
5. **Inspire:** Spatial metaphor for information (go to a place to learn something); small persistence hooks (leaderboard/notes) for return visits; expose a quality setting and respawn/reset so heavy scenes remain usable.
6. **Do NOT copy:** The truck/world/island layout, character and brand (Bruno's code and CC0 audio are open licensed, but the visual identity, level design and Blender assets are his work; check the repo LICENSE before reusing anything, and even then do not ship a lookalike). Don't build a driving game just because he did; it is his signature.

## 4. Zajno: Educational Website on Space Pollution (Dribbble concept)

URLs: `dribbble.com/shots/25860515-...` and `.../25914349-Case-study-...`
- **Evidence (weakest in this document):** Both WebFetch calls on the Dribbble shots returned **empty content**. Everything below is from **[search]** snippets. The search surfaced these shots only on a third-party mirror domain (`dr.vczdbt26574.workers.dev`), which I deliberately did not open and cannot vouch for. Snippet content: Zajno's concept is a website visualizing the space-debris problem and ways to mitigate risk; idea came from reviewing NASA material and cleanup efforts; a key goal was a detailed, realistic 3D Earth while keeping illustrations of cleanup methods clear; work based on real data/statistics; credits 3D artists, a UI designer and a space-animation animator; a companion case-study shot explains design decisions "from layout to 3D".
1. **What makes it exceptional (as described, unverified visually):** Pairs an educational mission with credible data; explicit trade-off statement of *accuracy vs. clarity*.
2. **Strongest technique:** Photoreal Earth hero plus diagrammatic 3D illustrations of mitigation methods (per snippet).
3. **Information via 3D:** Orbit/space-debris as spatial data around a globe, with explanatory illustrations per cleanup method (per snippet; not seen).
4. **Real-time vs static:** **Treat as a prerecorded concept.** Dribbble shots are typically video/image concepts and I found no evidence of a deployed site. Format of these specific shots not verified.
5. **Inspire:** Data-led storytelling, where the 3D scene is the chart (density of debris, orbit bands); two-tier visual language (realistic hero, simplified diagrammatic explainers). This maps well to showing an AI engineer's systems as a spatial diagram.
6. **Do NOT copy:** Zajno's Earth/debris compositions, UI layout, illustrations, copy, or the shot visuals. Use real public data (e.g., public orbital datasets) with an original look if you build a similar idea.

## 5. Igloo Inc (igloo.inc)

- **Evidence:** Awwwards [fetch]: SOTD Jul 23, 2024; SOTD 7.92, Dev 7.66 (Animations/Transitions 9.60, WPO 8.00); credits abeto + Bureaux; tags Infinite Scroll, Transitions, 3D. Case study [fetch] (abeto, Oct 31 2024): three-section landing; real-time in-engine intro built from code and custom shaders; procedural ice-crystal-growth algorithm generating unique ice blocks per project; particle simulation morphing into models per selected link, using a custom VDB-to-browser exporter with compression; transitions mixing chromatic aberration, displacement, frost; tools Houdini, Blender, Three.js, three-mesh-bvh, Svelte, GSAP, Vite; UI rendered in WebGL (glitch/text-scramble); performance work (custom geometry exporters, texture loading strategy, background shader compilation, tested on low-end devices). The live site fetch returned only the heading "Igloo Inc.", so I did not see it run.
1. **What makes it exceptional:** One of the few references where the *how* is documented. Cohesive metaphor (projects frozen in ice), generative variety, and explicit low-end-device discipline.
2. **Strongest technique:** Procedural/generative assets (unique ice blocks) and volume-data particles that morph between shapes.
3. **Information via 3D:** Each portfolio company is an object in a block of ice you scroll past; link choice changes the particle form. Content = objects in a scene.
4. **Real-time vs static:** Real-time (the intro is explicitly in-engine rather than video, per case study).
5. **Inspire:** Procedural variation so each project/skill node is unique at near-zero asset cost; a shape-morphing particle field as navigation; WebGL-rendered UI for cheap glitch effects; shader precompile + lazy load.
6. **Do NOT copy:** Pudgy Penguins/Igloo branding and characters, the ice-block concept as the central metaphor, abeto/Bureaux compositions and shaders, their exporter output or assets.

## 6. Spyker Cars (spykercars.com)

- **Evidence:** Awwwards [fetch]: SOTD Oct 30, 2026; SOTD 7.31, Dev 7.04; The Brink Agency; tags 3D, WebGL, GSAP, Storytelling, Luxury, Scrolling; description "Most only see a Spyker in images, so we built a digital experience that hands them the keys." (a day of ownership: Italian morning, mountain pass, red-carpet evening); highlighted: scroll sections and a "Time Change" transition. Site text [fetch]: Next.js-style image URLs; marketing copy is thin; I did not see the 3D.
1. **What makes it exceptional:** A narrative structure (time-of-day journey) rather than a spec sheet; scores are modest (juries 6.30-8.30), so treat it as a solid-craft reference, not a bar-setter.
2. **Strongest technique:** Scroll-driven scene with a time-of-day transition between chapters (per Awwwards element list).
3. **Information via 3D:** Product shown in lived context across a story arc instead of an isolated turntable.
4. **Real-time vs static:** Real-time WebGL per tags; extent unknown.
5. **Inspire:** Chapter-based scroll narrative where lighting/time changes carry the story (e.g., "ingest → train → deploy" as dawn → noon → night).
6. **Do NOT copy:** Spyker car models, branding, photography, chapter copy and scene compositions.

## 7. Don't Look Up (dontlookup.app)

- **Evidence:** Awwwards [fetch]: SOTD Nov 1, 2026; SOTD 7.25, Dev 7.44; creator Marcelo Reis Melo; GSAP, Three.js, Vanilla JS; tags Games, Storytelling, Minimal, Illustration. Description: "A game about the price of attention." Site text [fetch]: satirical crowd game with three crowd types, distractions, fee slider, tutorial; text is sparse. I did not see it render.
1. **What makes it exceptional:** A tiny, opinionated game that makes an argument through mechanics. Solo-creator scale, minimal palette (#F4F3EF / #14140F).
2. **Strongest technique:** Systems-as-message: simulation rules (crowd types, fees) *are* the commentary; minimal, illustrative 3D styling.
3. **Information via 3D:** Crowd state is encoded visually (colour = behaviour) plus meters (money, "looking up").
4. **Real-time vs static:** Real-time interactive simulation.
5. **Inspire:** A small playable demo of an AI concept (agents, queues, retrieval) where colour-coded entities show system state; short tutorial (3 steps) before play.
6. **Do NOT copy:** The game concept/mechanics, character, art style, FGD fonts, copy.

## 8. G. Colombel, Portfolio 2026 (guillaumecolombel.fr)

- **Evidence:** Awwwards [fetch]: SOTD Oct 28, 2026; SOTD 7.5, Dev 7.73; tags Three.js, WebGL, Experimental, Portfolio, Sound-Audio; highlighted elements: video transition, "WebGPU slider" carousel, fluid mouse interaction, preloader. Own site [fetch] returned a text index of 12 projects, bio and awards counts, no tech mentions; I could not see the 3D (the fetched text may be a fallback/list view).
1. **What makes it exceptional:** Direct peer benchmark: a developer portfolio recognised for fluid cursor interaction and WebGPU, with sound. Jury spread was wide (6.10-9.60).
2. **Strongest technique:** Fluid-simulation mouse interaction plus WebGPU-driven project slider (per Awwwards tags).
3. **Information via 3D:** Projects presented as a media carousel with video transitions; index-first structure (numbered list).
4. **Real-time vs static:** Real-time (Three.js/WebGL/WebGPU).
5. **Inspire:** Offer a plain, fast project index alongside the WebGL view; consider WebGPU only with a WebGL fallback.
6. **Do NOT copy:** His project media, fluid-distortion look as a signature effect, naming/layout of the index, CLARTÉ brand references.

---

## Synthesis: principles for an ORIGINAL implementation

1. **Make the scene the content, not a backdrop.** Igloo (projects as objects), Bruno (places as information), Zajno (3D as chart): each object should map to something real (a project, system, or skill), with an obvious "what am I looking at".
2. **One strong metaphor, executed procedurally.** Pick a single original concept for the "universe"; generate variation (procedural nodes, noise, instancing) so scale costs shaders, not hand-modelled assets.
3. **Cursor and scroll are the primary inputs.** Lusion, Lando and Colombel all highlight reactive cursor/fluid interaction; give every key object a hover/response state, and make scroll a camera path.
4. **Performance is a visible quality signal.** Lusion (WPO 9.00) and Igloo (documented low-end testing, shader precompile, WebGL UI) prove heavy and fast can coexist. Budget draw calls, lazy-load, expose a quality toggle (Bruno), and set a frame-time target.
5. **Keep a fast, accessible content path.** Accessibility scores in Awwwards Dev results are consistently weak (about 6.6-7.6 for several of these sites [fetch]). A plain DOM index of projects, keyboard nav, `prefers-reduced-motion` and a no-WebGL fallback is a differentiator.
6. **Narrative beats spectacle.** Spyker's time-of-day chapters and Don't Look Up's system-as-message show structure carries meaning; use a short guided arc (intro → exploration → contact).
7. **Reward return visits lightly.** Bruno's leaderboard/whispers/achievements idea: a small persistent or discoverable element (hidden nodes, easter eggs) beats a longer first-visit sequence.
8. **Original assets, original brand, original data viz.** Reuse techniques, never compositions. Prefer real public data styled in your own visual language.

## Method & limitations

- **Tools:** ToolSearch to load WebFetch/WebSearch; WebFetch on Lusion, Lando Norris, Bruno Simon, Awwwards pages (lusion-v3, lando-norris, igloo-inc, spyker-cars, dont-look-up-game, g-colombel-portfolio-2026), the Awwwards 3D listing (page 1 only), the Igloo case study, and several live sites; WebSearch for Zajno, Igloo, Lando Norris, Lusion v3, Bruno Simon.
- **No screenshots, no browser rendering.** I never saw any of these sites run. Live-site fetches mostly returned navigation/copy only; for Igloo it returned just a heading.
- **Dribbble failed:** Both Zajno shots and the `tags/3d-website` page returned empty via WebFetch. Zajno details come only from search snippets, which pointed at an unverified third-party mirror domain that I did not open. Format (video vs. still) and any tech used for the Zajno shots are unverified; "concept" is an inference from how Dribbble shots usually work.
- **Summarizer caveat:** WebFetch output is generated by a small model and can contain errors (one Awwwards result visibly self-corrected a sub-score mid-answer, so I omitted sub-scores I could not trust and kept only headline scores/dates).
- **Awwwards dates:** The 2026 SOTD dates (Spyker, Don't Look Up, Colombel) are as reported by the fetched pages; the session date is Nov 1, 2026.
- **Technique claims for Lusion v3 and the Lando Norris hero** are partly [prior]/[search] and are labelled as such. Awwwards tags (e.g. "WebGL", "Three.js") are creator-supplied and show intent, not proof of how much of the page is 3D.
- **Not covered:** Awwwards 3D pages 2-5, Dribbble 3d-website tag, labs.lusion.co, Porsche: Dream Machine, and any licensing review of Bruno Simon's repo (check its LICENSE before reusing any code).


---

## Addendum (2026-11-01): first-hand observations from a real browser

The earlier sections were written without being able to see the sites render. These notes come from opening the sites in the in-app Chromium (real GPU) and taking screenshots. They are observations of a few frames at a few scroll positions - not a full audit.

| Site | What I actually saw | Takeaway used in this project |
|---|---|---|
| **lusion.co** | A heavy numeric loader (000 → 100) on black, then a **light lavender page**; a large **rounded window** holding dozens of glossy interlocking pieces in black, white and electric blue; huge light-weight grotesk headline ("Bold Ideas, Brought to Life"); pill-shaped "Let's talk" / "Menu" buttons; "Scroll to explore" with small + markers. | Bright page + glossy toy-like objects in a few strong primaries; chunky pills; very large type. |
| **landonorris.com** | Loader is a **full-screen electric lime** with a tiny dark mark and small caps label. | Colour itself is the identity; full-bleed colour floods. |
| **bruno-simon.com** | Loader is a saturated **blue/violet** field with a neon ring and a grid of small blue crosses. | Saturated colour worlds; playful physical feel. |

**Not copied:** layouts, geometry, copy, interaction code or the specific colour sets. What carried over is generic: *colour as identity, glossy objects, big type, rounded windows/pills, physical play.* The implementation (swarm formations, colour stories, flood transitions) is original.

Search for further bright/colourful 2026 examples (Awwwards inspiration pages for a Google Cloud playful WebGL demo, Active Theory's BMO piece, etc.) returned titles only; I did not open them, and blog statistics about 3D's share of 2026 winners are unverified.
