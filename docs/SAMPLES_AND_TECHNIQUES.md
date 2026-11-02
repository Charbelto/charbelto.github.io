# Project samples, and which techniques were used

## 1. Interactive samples: one per chapter, always visible

Every chapter below shows its own interactive sample **in the scene while you scroll**, opposite its text card. No button to find: the window is there, labelled "Interactive sample · simulated data", with a pulsing outline and a "tap here" hint until you touch it. A switch in each window ("See the 3D object" / "Show the sample") trades the sample for that chapter's Blender object and back. On phones the sample fills the space above the card.

**Everything is simulated and says so.** The data is scripted or pre-saved; nothing is a live model, nothing is uploaded, nothing calls a server.

| Chapter | The sample | Where the data comes from |
|---|---|---|
| Profile | "From notebook to production": five clickable stages and a "Ship it" run | Scripted |
| Meet Pip | Pip as a small agent: pick a task, watch think, tool call, result, answer (Pip waves at the end) | Scripted agent steps |
| Orchestration | Five agents pass messages along a diagram for three tasks (trip, pull-request review, ticket) | Scripted conversations |
| Retrieval | Same question, same documents, re-ranker off or on: top-3 precision and cited answer change | Pre-saved scores |
| Tool calling and MCP | The server lists three tools; pick one to see the JSON-RPC call, the result and the answer typed out | Pre-saved calls (MCP-style messages) |
| Evaluation | A judge scores four answers on a four-part rubric; run a 24-case regression for prompt v1 against v2 | Pre-saved scores |
| Reliability | A dashboard with a live-looking latency line; inject a timeout, prompt injection or malformed output and watch it handled | Simulated incidents |
| GREAT | Pick a call (billing, upset customer, sales): rubric bars fill, flagged for review or not | Made-up conversations; no real customer data |
| LoopGuard | Feed an agent trace step by step, or type your own | The detection runs for real in the browser (TF-IDF cosine, state mapping, cycle detection); example traces are written for the demo |
| DermSense | Input, features (real HOG and colour histogram of the picture), models, **a clickable simulated prediction** (SVM+HOG against EfficientNet-B0, seven classes), explain | Generated images; the probabilities are pre-saved and simulated, labelled as such. Not a diagnosis |
| OULAD | The three real result figures | Your own figures from the repository (CC BY 4.0 dataset) |
| Commerce Microservices | Round-robin load balancer across three replicas: send requests, take a replica down | Simulated traffic and counters |
| Cell Analyzer | Signal strength line that reacts to distance from a tower | Simulated telemetry (common LTE RSRP bands) |
| Supermarket graph | Explorable graph of the 14 most-bought items with quicksort ranking and breadth-first reach | Real aggregates computed from your dataset (14,963 baskets, 3,898 customers), no raw rows |

Notes:
- **Real lesion photos:** possible, but HAM10000 is CC BY-NC-SA 4.0 (non-commercial, share-alike), which sits awkwardly with a portfolio you use to get paid work. Real predictions would need your trained weights; if you provide them, real examples can replace the simulated probabilities.
- **OULAD README vs figure:** the README says RFECV picked 23 features, the figure says 32. The site uses the figure. Worth fixing in the repo.
- Data is rebuilt with `python tools/make-lab-data.py` (needs the `gh` CLI).
- Code: `src/samples.js` (placement, switch, lazy mount), `src/samples/agents.js` (new samples), `src/lab.js` (earlier samples and shared helpers), `src/lab/loopguard.js` (the detection method).

## 2. The 124-item list: what was used, skipped, and why

Used (chosen because they make the site faster or better, not because they are on the list):
- **Scroll-driven storytelling** (67-82): pinned sticky chapters, scroll scrubbing, progress indicators (top bar, coordinates), reversal, scene sequencing: already the backbone; extended with the HUD.
- **Ambient loops and hybrid autoplay + scroll** (83-94): rotating rings, floating posters, halftone sun; transform/opacity only.
- **Kinetic typography, split text, staggered reveals, text reveal masks** (16, 20-22, 77): headings reveal word by word out of masks (transform only, replays on stepper steps).
- **Oversized / condensed / outline typography, marquee, parallax type** (17, 18, 26, 27, 30): already present.
- **Halftone** (12): a static dot field behind the scene.
- **Texture overlay** (37): a static grain on desktop (the animated, blended version was a measured slowdown).
- **Neo-brutalist details** (6): hard offset shadow and 2 px border on the sample panels.
- **Smooth scrolling** (98): Lenis, desktop mouse wheel only; touch devices keep native momentum.
- **Magnetic buttons, custom cursor** (100, 101): desktop fine pointers only.
- **Modals, microinteractions, responsive and reduced-motion support** (104, 110-112): the sample panels, and every effect switches off under reduced motion.
- **Chapter navigation, animated menu, skip-friendly structure** (97, 105).

Skipped, with reasons:
- **Monochrome, grunge, xerox, vintage, dark cinematic, high-contrast black/white** (3, 7, 8, 10, 11): they contradict the bright full-colour identity you asked for ("I don't want it black").
- **Paper-tear, displacement, WebGL distortion, text warping, glitch, motion blur, depth of field** (24, 25, 36, 41, 45, 60): costly on phones for little gain here.
- **Horizontal scroll sections** (80): fights the pinned vertical chapters and phone gestures.
- **Sound toggle** (109): needs audio assets and consent; no benefit for a portfolio.
- **Rive / Lottie, After Effects, Photoshop, Figma** : no assets to feed them; the scenes are authored in Blender and rendered to WebP.
- **React / Next.js** : would not make the page faster (the 3D uses the same graphics layer); the site is static on purpose.
- **Collage with real photographs, symbolic religious imagery** (1, 15, 35): not relevant to this portfolio.

## 3. The phone version

Phones and any window narrower than 820 px (including a zoomed-in desktop browser, which is what looked blurry) get **pre-rendered scenes** instead of live 3D: 780 px wide posters (sharp on 2x and 3x screens), scrubbed by scroll, looping gently, with the HUD. No WebGL runs there. `?lite=0` forces live 3D, `?perf=1` shows a frame-rate readout so a real phone can report what it measures.
