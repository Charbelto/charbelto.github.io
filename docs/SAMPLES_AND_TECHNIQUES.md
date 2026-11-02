# Project samples, and which techniques were used

## 1. "Try a sample" panels: feasibility and what shipped

Verdict: **feasible and worth doing, as pre-computed or locally-run samples (no live machine learning).** Honesty rule used throughout: each panel says what is real and what is an illustration, and nothing is invented to look like a result.

| Project | Shipped | What is real | What is an illustration | Why |
|---|---|---|---|---|
| LoopGuard | Interactive: feed an agent trace step by step, three example traces or your own steps | The detection computation runs for real in the browser (tokenise, TF-IDF cosine, state mapping at 0.75, cycle detection) | The example traces are written for the demo; it is a small JavaScript re-implementation of the idea (the library is Python, MIT) | Fully self-contained, no data issues, shows exactly why exact-match guards miss rephrased loops |
| DermSense | "Inside the pipeline": input, features (real HOG and colour histogram computed on the picture), the two models, an explain step | Hyper-parameters (HOG 9 orientations, 16 px cells, 32-bin histograms, C = 10, EfficientNet-B0 two-phase training), the seven HAM10000 classes | The lesion pictures are generated, the heat overlay is an edge/darkness saliency, not a trained Grad-CAM. **No prediction is shown.** | The repository has no trained weights or exported predictions (and its own web dashboard is a simulation), so any "prediction" would be invented. |
| OULAD | The three real result figures (feature importance, RFECV curve, confusion matrix) with plain explanations | Your own figures, re-encoded as WebP; the numbers quoted come from the figures (best cross-validated recall 0.9499 at 32 features) | Nothing | Real outputs already exist; dataset is CC BY 4.0 (attribution shown) |
| Supermarket graph | Explorable graph of the 14 most-bought items; click an item to see co-purchase ranking (hand-written quicksort) and breadth-first reach; a slider filters links | Aggregates computed from the repository's CSV: 38,765 purchases, 14,963 baskets (one customer on one day), 3,898 customers; no raw rows shipped | The 14-item subset (to keep it readable) | Real data, tiny file (1.4 KB), mirrors the project's graph + quicksort + BFS design |
| Cell Analyzer | Simulated signal strength reacting to distance from a tower | The RSRP quality bands are the common LTE ranges | The readings are simulated (clearly labelled) | The repository has no recorded telemetry to replay |

Not done yet (feasible): Commerce Microservices (a round-robin and health-check simulation of the HAProxy setup) and GREAT (a scoring-rubric walkthrough on **synthetic** conversations; real customer calls must never be used).

Things worth knowing:
- **Real lesion photos:** possible, but HAM10000 is CC BY-NC-SA 4.0 (non-commercial, share-alike, attribution), which sits awkwardly with a portfolio you use to get paid work. Safer options: your own generated images (as now), or CC0 ISIC images. **Real predictions** need your trained model: if you give me the weights or an `outputs/` folder, I can pre-compute real examples (probabilities and genuine Grad-CAM) and add them.
- **OULAD README vs figure:** the README says RFECV picked 23 features, the figure says 32. The site uses the figure. Worth fixing in the repo.
- Data for these panels is rebuilt with `python tools/make-lab-data.py` (needs the `gh` CLI).

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
