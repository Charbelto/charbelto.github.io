import { createGuard, exactHashGuard, PRESETS } from './lab/loopguard.js';

/**
 * "Try a sample": small interactive panels for the project chapters. Everything here is pre-computed or runs locally in the
 * browser: no live machine learning, no uploads, no network calls except two static files (a JSON and some figures).
 * Each panel says plainly what is real (your data, your figures) and what is an illustration.
 */
export const BASE = import.meta.env.BASE_URL;

export function h(tag, props = {}, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v; else if (k === 'on') for (const [ev, fn] of Object.entries(v)) el.addEventListener(ev, fn); else if (k === 'text') el.textContent = v; else el.setAttribute(k, v === true ? '' : v);
  }
  for (const kid of kids.flat()) if (kid != null && kid !== false) el.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
  return el;
}
export const rng = (seed) => () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
export const tabs = (items, on, current, auto = true) => {
  const wrap = h('div', { class: 'lab-tabs', role: 'tablist' });
  const set = (k, user) => { wrap.querySelectorAll('.lab-tab').forEach((b) => { const sel = b.dataset.k === k; b.setAttribute('aria-selected', String(sel)); b.tabIndex = sel || !wrap.querySelector('[aria-selected="true"]') ? 0 : -1; }); on(k, user); };
  items.forEach(([k, label]) => wrap.append(h('button', { class: 'lab-tab', type: 'button', role: 'tab', 'data-k': k, 'aria-selected': 'false', on: { click: () => set(k, true) } }, label)));
  if (auto) set(current ?? items[0][0], false);
  return wrap;
};

/* ───────────────────────── LoopGuard ───────────────────────── */
function loopguardDemo(root, ctx) {
  let key = 'rephrase'; let guard = createGuard(); let idx = 0; let timer = 0;
  const blurb = h('p', { class: 'lab-blurb' });
  const list = h('ol', { class: 'lg-steps' });
  const verdict = h('div', { class: 'lg-verdict', role: 'status', 'aria-live': 'polite' });
  const stateColour = (s) => `hsl(${(s * 67 + 210) % 360} 85% 52%)`;
  const S = (s) => `S${s + 1}`;
  const stop = () => { clearInterval(timer); timer = 0; play.textContent = 'Play'; };

  const render = () => {
    list.replaceChildren(...guard.steps.map((s, i) => h('li', { class: `lg-step${guard.tripped && i === guard.tripped.at - 1 ? ' is-trip' : ''}` },
      h('b', { class: 'lg-n' }, String(i + 1)),
      h('span', { class: 'lg-act' }, s.action),
      h('span', { class: 'lg-text' }, h('i', {}, s.input), s.obs ? h('small', {}, `→ ${s.obs}`) : null),
      h('span', { class: 'lg-state', style: `--c:${stateColour(s.state)}` }, S(s.state), s.simTo >= 0 && s.sim < 0.999 ? h('small', {}, ` ≈ ${s.sim.toFixed(2)}`) : null))));
    const t = guard.tripped; const total = (key === 'custom' ? guard.steps.length : PRESETS[key].steps.length);
    if (t) {
      const exact = exactHashGuard(guard.steps);
      verdict.className = 'lg-verdict is-trip';
      verdict.replaceChildren(h('b', {}, `Loop caught at step ${t.at}.`), ` States ${t.block.map(S).join(' → ')} repeated ${t.repeats} times, so the circuit breaker trips: ${Math.max(0, 20 - t.at)} further tool calls avoided against a 20-step cap. A plain exact-match guard ${exact ? `would have fired at step ${exact}` : 'would not have noticed'}.`);
      stop();
    } else if (key !== 'custom' && idx >= total) {
      verdict.className = 'lg-verdict is-ok'; verdict.replaceChildren(h('b', {}, 'No loop.'), ' Every step moved the task to a new state, so nothing is flagged.'); stop();
    } else {
      verdict.className = 'lg-verdict'; verdict.replaceChildren(guard.steps.length ? `Watching… ${guard.steps.length} step${guard.steps.length > 1 ? 's' : ''} so far, no loop yet.` : 'Press “Next step” to feed the agent’s steps to the guard one at a time.');
    }
  };
  const next = () => { ctx?.touched?.(); if (key === 'custom' || guard.tripped || idx >= PRESETS[key].steps.length) return; guard.add(PRESETS[key].steps[idx++]); render(); };
  const reset = () => { stop(); guard = createGuard(); idx = 0; render(); };
  const nextBtn = h('button', { class: 'btn btn--solid', type: 'button', on: { click: next } }, 'Next step');
  const play = h('button', { class: 'btn btn--ghost', type: 'button', on: { click: () => { if (timer) { stop(); return; } if (key === 'custom') return; play.textContent = 'Pause'; next(); timer = setInterval(() => { next(); }, 950); } } }, 'Play');
  const resetBtn = h('button', { class: 'btn btn--ghost', type: 'button', on: { click: reset } }, 'Reset');

  const actionSel = h('select', { 'aria-label': 'Action' }, ['web_search', 'query_db', 'wait', 'read_page'].map((a) => h('option', { value: a }, a)));
  const inText = h('input', { type: 'text', placeholder: 'what the agent sent, e.g. weather in chicago', 'aria-label': 'Step input', maxlength: '80' });
  const obsText = h('input', { type: 'text', placeholder: 'what came back (optional)', 'aria-label': 'Step observation', maxlength: '80' });
  const custom = h('form', { class: 'lg-custom', on: { submit: (e) => { e.preventDefault(); if (!inText.value.trim()) return; guard.add({ action: actionSel.value, input: inText.value.trim(), obs: obsText.value.trim() }); inText.value = ''; render(); inText.focus(); } } },
    actionSel, inText, obsText, h('button', { class: 'btn btn--solid', type: 'submit' }, 'Add step'));
  const ctrl = h('div', { class: 'lab-ctrl' }, nextBtn, play, resetBtn);

  const t = tabs([...Object.entries(PRESETS).map(([k, p]) => [k, p.title]), ['custom', 'Your own steps']], (k) => {
    key = k; blurb.textContent = k === 'custom' ? 'Type a few steps yourself. Try rephrasing the same search three or four times and watch the similarity scores.' : PRESETS[k].blurb;
    custom.hidden = k !== 'custom'; ctrl.hidden = k === 'custom'; reset();
  });
  root.append(t, blurb, ctrl, custom, list, verdict,
    h('p', { class: 'lab-fine' }, 'Method: tokenise, incremental TF-IDF, map each step to a state (same action and cosine similarity of 0.75 or more), then look for a block of 1 to 5 states repeated 3 times. This is a small JavaScript re-implementation of the idea for this page; the library itself is Python (MIT).'));
  return () => stop();
}

/* ───────────────────────── DermSense ───────────────────────── */
function lesionCanvas(kind, size = 256) {
  const c = document.createElement('canvas'); c.width = c.height = size; const g = c.getContext('2d'); const r = rng({ regular: 11, irregular: 23, pearly: 37 }[kind]);
  const skin = { regular: [226, 176, 144], irregular: [216, 164, 134], pearly: [234, 192, 172] }[kind];
  g.fillStyle = `rgb(${skin})`; g.fillRect(0, 0, size, size);
  for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(${skin[0] - 30},${skin[1] - 40},${skin[2] - 40},${0.03 + r() * 0.05})`; g.beginPath(); g.arc(r() * size, r() * size, 1 + r() * 5, 0, 7); g.fill(); }
  const cx = size / 2; const cy = size / 2; const R = { regular: 58, irregular: 66, pearly: 56 }[kind]; const wob = { regular: 0.04, irregular: 0.3, pearly: 0.1 }[kind];
  const ph = [r() * 6, r() * 6, r() * 6];
  const radius = (a) => R * (1 + wob * (Math.sin(a * 3 + ph[0]) * 0.5 + Math.sin(a * 5 + ph[1]) * 0.35 + Math.sin(a * 9 + ph[2]) * 0.15));
  const path = () => { g.beginPath(); for (let i = 0; i <= 120; i++) { const a = (i / 120) * Math.PI * 2; const x = cx + Math.cos(a) * radius(a); const y = cy + Math.sin(a) * radius(a); i ? g.lineTo(x, y) : g.moveTo(x, y); } g.closePath(); };
  g.save(); g.shadowColor = 'rgba(70,40,30,.45)'; g.shadowBlur = 14;
  g.fillStyle = { regular: 'rgb(118,76,54)', irregular: 'rgb(64,38,30)', pearly: 'rgb(240,206,196)' }[kind]; path(); g.fill(); g.restore();
  g.save(); path(); g.clip();
  const blobs = { regular: [['rgba(92,58,42,.5)', 4]], irregular: [['rgba(150,72,60,.7)', 6], ['rgba(88,104,128,.65)', 5], ['rgba(30,18,16,.8)', 5], ['rgba(190,120,90,.6)', 4]], pearly: [['rgba(255,236,230,.7)', 6], ['rgba(222,150,150,.4)', 3]] }[kind];
  blobs.forEach(([col, n]) => { for (let i = 0; i < n; i++) { g.fillStyle = col; g.beginPath(); g.arc(cx + (r() - 0.5) * R * 1.3, cy + (r() - 0.5) * R * 1.3, 8 + r() * 20, 0, 7); g.fill(); } });
  g.restore();
  if (kind === 'pearly') { g.strokeStyle = 'rgba(200,60,70,.7)'; g.lineWidth = 1.4; for (let k = 0; k < 7; k++) { g.beginPath(); let a = r() * 6.28; let x = cx + Math.cos(a) * 6; let y = cy + Math.sin(a) * 6; g.moveTo(x, y); for (let s = 0; s < 6; s++) { a += (r() - 0.5) * 1.1; x += Math.cos(a) * 9; y += Math.sin(a) * 9; g.lineTo(x, y); } g.stroke(); } }
  g.strokeStyle = 'rgba(70,40,30,.25)'; g.lineWidth = 2; path(); g.stroke();
  return c;
}
const jet = (v) => { const r = Math.min(1, Math.max(0, 1.5 - Math.abs(4 * v - 3))); const gr = Math.min(1, Math.max(0, 1.5 - Math.abs(4 * v - 2))); const b = Math.min(1, Math.max(0, 1.5 - Math.abs(4 * v - 1))); return [r * 255, gr * 255, b * 255]; };

const PRED = { // pre-saved, SIMULATED outputs for the illustration (not from a real model)
  regular: { svm: [['nv', 0.58], ['bkl', 0.18], ['df', 0.09], ['mel', 0.07], ['vasc', 0.04], ['bcc', 0.02], ['akiec', 0.02]], cnn: [['nv', 0.91], ['bkl', 0.04], ['df', 0.02], ['mel', 0.02], ['vasc', 0.005], ['bcc', 0.003], ['akiec', 0.002]] },
  irregular: { svm: [['mel', 0.41], ['nv', 0.28], ['bkl', 0.14], ['akiec', 0.08], ['bcc', 0.05], ['df', 0.03], ['vasc', 0.01]], cnn: [['mel', 0.74], ['nv', 0.15], ['bkl', 0.05], ['akiec', 0.03], ['bcc', 0.02], ['df', 0.007], ['vasc', 0.003]] },
  pearly: { svm: [['bcc', 0.39], ['akiec', 0.21], ['bkl', 0.15], ['nv', 0.12], ['mel', 0.07], ['vasc', 0.04], ['df', 0.02]], cnn: [['bcc', 0.68], ['akiec', 0.17], ['bkl', 0.07], ['nv', 0.04], ['mel', 0.02], ['vasc', 0.015], ['df', 0.005]] },
};
const MALIGNANT = new Set(['mel', 'bcc']); const PRECANCER = new Set(['akiec']);

function dermDemo(root, ctx) {
  let kind = 'regular'; let step = 'look';
  const body = h('div', { class: 'derm-body' });
  const sample = { regular: 'Smooth, even border, one colour', irregular: 'Ragged border, several colours', pearly: 'Pale, pearly, visible small vessels' };
  const draw = () => {
    body.replaceChildren();
    const src = lesionCanvas(kind); src.className = 'derm-img'; src.setAttribute('role', 'img'); src.setAttribute('aria-label', `Generated illustration: ${sample[kind]}`);
    const small = document.createElement('canvas'); small.width = small.height = 128; const sg = small.getContext('2d'); sg.drawImage(src, 0, 0, 128, 128);
    const px = sg.getImageData(0, 0, 128, 128).data;
    if (step === 'look') {
      body.append(h('div', { class: 'derm-row' }, src, h('div', {}, h('p', {}, h('b', {}, 'Step 1, the input. '), 'The pipeline starts from a dermoscopic image. This one is a generated illustration, not a patient photo.'),
        h('p', {}, 'Everything is resized to 128 × 128 pixels first (right), the size the classical baseline works at.'), (() => { const z = small; z.className = 'derm-small'; return z; })())));
    } else if (step === 'features') {
      const bins = 32; const hist = [new Array(bins).fill(0), new Array(bins).fill(0), new Array(bins).fill(0)];
      for (let i = 0; i < px.length; i += 4) for (let c = 0; c < 3; c++) hist[c][Math.floor(px[i + c] / (256 / bins))]++;
      const hc = document.createElement('canvas'); hc.width = 320; hc.height = 120; const hg = hc.getContext('2d'); const mx = Math.max(...hist.flat());
      ['rgba(230,60,60,.75)', 'rgba(40,170,90,.7)', 'rgba(50,80,240,.7)'].forEach((col, c) => { hg.fillStyle = col; hist[c].forEach((v, i) => { const hh = (v / mx) * 112; hg.fillRect(i * 10, 118 - hh, 8, hh); }); });
      const gray = new Float32Array(128 * 128); for (let i = 0; i < gray.length; i++) gray[i] = 0.3 * px[i * 4] + 0.59 * px[i * 4 + 1] + 0.11 * px[i * 4 + 2];
      const hogC = document.createElement('canvas'); hogC.width = hogC.height = 256; const hgx = hogC.getContext('2d'); hgx.drawImage(src, 0, 0, 256, 256); hgx.fillStyle = 'rgba(255,255,255,.55)'; hgx.fillRect(0, 0, 256, 256);
      hgx.strokeStyle = 'rgba(30,40,200,.9)'; hgx.lineWidth = 1.2;
      for (let cy = 0; cy < 8; cy++) for (let cx = 0; cx < 8; cx++) {
        const o = new Array(9).fill(0);
        for (let y = cy * 16 + 1; y < cy * 16 + 15; y++) for (let x = cx * 16 + 1; x < cx * 16 + 15; x++) { const dx = gray[y * 128 + x + 1] - gray[y * 128 + x - 1]; const dy = gray[(y + 1) * 128 + x] - gray[(y - 1) * 128 + x]; const mag = Math.hypot(dx, dy); let a = Math.atan2(dy, dx); if (a < 0) a += Math.PI; o[Math.min(8, Math.floor((a / Math.PI) * 9))] += mag; }
        const om = Math.max(...o, 1);
        o.forEach((v, b) => { const a = ((b + 0.5) / 9) * Math.PI + Math.PI / 2; const L = (v / om) * 13; const x0 = cx * 32 + 16; const y0 = cy * 32 + 16; hgx.beginPath(); hgx.moveTo(x0 - Math.cos(a) * L, y0 - Math.sin(a) * L); hgx.lineTo(x0 + Math.cos(a) * L, y0 + Math.sin(a) * L); hgx.stroke(); });
      }
      hc.className = 'derm-hist'; hogC.className = 'derm-img';
      body.append(h('div', { class: 'derm-row' }, h('div', {}, hogC, h('p', { class: 'lab-fine' }, 'HOG: orientations = 9, 16 px cells, computed here from this picture.')), h('div', {}, hc, h('p', { class: 'lab-fine' }, 'Colour histogram, 32 bins per channel (red, green, blue), computed from this picture.'),
        h('p', {}, h('b', {}, 'Step 2, handcrafted features. '), 'The baseline turns an image into numbers: how colours are distributed and which directions the edges point.'))));
    } else if (step === 'predict') {
      const col = (label, rows) => h('div', { class: 'derm-pred' }, h('h4', {}, label),
        rows.map(([c, p], i) => h('div', { class: `derm-bar${i === 0 ? ' is-top' : ''}` }, h('span', {}, c), h('i', { style: '--w:0%', 'data-w': `${(p * 100).toFixed(0)}%` }), h('b', {}, `${(p * 100).toFixed(p < 0.1 ? 1 : 0)}%`))));
      const out = h('div', { class: 'derm-preds' });
      const run = () => { out.replaceChildren(col('SVM + HOG', PRED[kind].svm), col('EfficientNet-B0', PRED[kind].cnn)); requestAnimationFrame(() => requestAnimationFrame(() => out.querySelectorAll('i').forEach((i) => { i.style.setProperty('--w', i.dataset.w); }))); };
      const top = PRED[kind].cnn[0][0];
      body.append(h('div', { class: 'derm-row' }, src, h('div', {}, h('p', {}, h('b', {}, 'Step 4, the prediction. '), 'Press the button to run the sample. The two models give a probability for each of the seven classes.'),
        h('button', { class: 'btn btn--solid', type: 'button', on: { click: () => { run(); ctx?.touched?.(); } } }, 'Run the sample'),
        h('p', { class: 'lab-fine' }, `The deep model's top class here is “${top}” (${MALIGNANT.has(top) ? 'malignant' : PRECANCER.has(top) ? 'pre-cancerous' : 'benign'} group). These probabilities are pre-saved and simulated for this illustration: not the output of a real model, and not a diagnosis.`))), out);
    } else if (step === 'models') {
      body.append(h('div', { class: 'derm-cards' },
        h('div', { class: 'derm-card' }, h('h4', {}, 'Baseline: SVM + HOG'), h('ul', {}, h('li', {}, 'Image resized to 128 × 128'), h('li', {}, 'Colour histograms (32 bins per channel) + HOG features'), h('li', {}, 'SVC, RBF kernel, C = 10, balanced class weights'))),
        h('div', { class: 'derm-card' }, h('h4', {}, 'Deep model: EfficientNet-B0'), h('ul', {}, h('li', {}, 'Pretrained on ImageNet, new head with dropout 0.3'), h('li', {}, 'Phase 1: frozen backbone, head only, 20 epochs, learning rate 1e-4'), h('li', {}, 'Phase 2: whole network, learning rate 5e-5, plateau scheduler, early stopping'), h('li', {}, 'Weighted random sampling for the class imbalance')))),
        h('p', {}, h('b', {}, 'Step 3, two models, one question. '), 'Seven classes from HAM10000 (10,015 dermatoscopic images):'),
        h('div', { class: 'derm-classes' }, [['akiec', 'pre-cancerous'], ['bcc', 'malignant'], ['bkl', 'benign'], ['df', 'benign'], ['mel', 'malignant'], ['nv', 'benign'], ['vasc', 'benign']].map(([c, t]) => h('span', { class: `derm-chip is-${t.replace('pre-', 'pre')}` }, h('b', {}, c), ` ${t}`))),
        h('p', { class: 'lab-fine' }, 'Model settings as documented in the repository.'));
    } else {
      const N = 64; const t = document.createElement('canvas'); t.width = t.height = N; t.getContext('2d').drawImage(src, 0, 0, N, N); const d = t.getContext('2d').getImageData(0, 0, N, N).data;
      let s = new Float32Array(N * N); const lum = (i) => 0.3 * d[i * 4] + 0.59 * d[i * 4 + 1] + 0.11 * d[i * 4 + 2];
      for (let y = 1; y < N - 1; y++) for (let x = 1; x < N - 1; x++) { const i = y * N + x; const gx = lum(i + 1) - lum(i - 1); const gy = lum(i + N) - lum(i - N); s[i] = Math.hypot(gx, gy) + Math.max(0, 150 - lum(i)) * 0.5; }
      for (let pass = 0; pass < 4; pass++) { const o = new Float32Array(N * N); for (let y = 1; y < N - 1; y++) for (let x = 1; x < N - 1; x++) { let a = 0; for (let j = -1; j <= 1; j++) for (let k = -1; k <= 1; k++) a += s[(y + j) * N + x + k]; o[y * N + x] = a / 9; } s = o; }
      const mx = Math.max(...s) || 1; const heat = document.createElement('canvas'); heat.width = heat.height = N; const hd = heat.getContext('2d').createImageData(N, N);
      for (let i = 0; i < N * N; i++) { const v = s[i] / mx; const [r, g2, b] = jet(v); hd.data[i * 4] = r; hd.data[i * 4 + 1] = g2; hd.data[i * 4 + 2] = b; hd.data[i * 4 + 3] = Math.min(255, v * v * 340); }
      heat.getContext('2d').putImageData(hd, 0, 0);
      const out = document.createElement('canvas'); out.width = out.height = 256; out.className = 'derm-img'; const og = out.getContext('2d');
      const paint = (a) => { og.clearRect(0, 0, 256, 256); og.drawImage(src, 0, 0); og.globalAlpha = a; og.imageSmoothingEnabled = true; og.drawImage(heat, 0, 0, 256, 256); og.globalAlpha = 1; };
      paint(0.7);
      const sl = h('input', { type: 'range', min: '0', max: '100', value: '70', 'aria-label': 'Heat overlay strength', on: { input: () => paint(sl.value / 100) } });
      body.append(h('div', { class: 'derm-row' }, out, h('div', {}, h('p', {}, h('b', {}, 'Step 4, explain it. '), 'Grad-CAM paints where a network looked. Doctors can then check that it looked at the lesion, not at a ruler or a hair.'), h('label', { class: 'lab-slider' }, 'Heat overlay ', sl),
        h('p', { class: 'lab-fine' }, 'Simulated: this heat is computed from edges and darkness in this picture. A real Grad-CAM uses the trained network’s gradients on its last convolutional layer.'))));
    }
  };
  const kinds = tabs([['regular', 'Even lesion'], ['irregular', 'Irregular lesion'], ['pearly', 'Pearly lesion']], (k, u) => { kind = k; draw(); if (u) ctx?.touched?.(); });
  const steps = tabs([['look', '1 Input'], ['features', '2 Features'], ['models', '3 Models'], ['predict', '4 Predict'], ['explain', '5 Explain']], (k, u) => { step = k; draw(); if (u) ctx?.touched?.(); });
  root.append(kinds, steps, body, h('p', { class: 'lab-disclaimer' }, 'SIMULATED: generated images and pre-saved example outputs, labelled as such. Not a diagnostic tool and not medical advice.'));
}

/* ───────────────────────── OULAD ───────────────────────── */
function ouladDemo(root, ctx) {
  const figs = {
    importance: ['Which signals matter', 'oulad-importance.webp', 'Feature importance of the features RFECV kept, from the XGBoost classifier. How recently a student last touched the course, and how long their engagement lasted, dwarf everything else.', '990 × 590'],
    rfecv: ['How many features', 'oulad-rfecv.webp', 'Recursive feature elimination with cross-validation: recall climbs steeply up to about 7 features, then flattens. The best cross-validated recall is 0.9499 at 32 features.', '1189 × 590'],
    confusion: ['How it did', 'oulad-confusion.webp', 'Confusion matrix of the XGBoost classifier on held-out students (classes 0 and 1 as labelled in the notebook): about 2,800 and 3,300 correct, about 310 and 140 wrong.', '793 × 602'],
  };
  const stage = h('figure', { class: 'oulad-fig' }); const cap = h('figcaption', {});
  const t = tabs(Object.entries(figs).map(([k, v]) => [k, v[0]]), (k, u) => {
    const [, file, text] = figs[k]; if (u) ctx?.touched?.();
    stage.replaceChildren(h('img', { src: `${BASE}lab/${file}`, alt: text, loading: 'lazy' }), cap); cap.textContent = text;
  });
  root.append(t, stage, h('p', { class: 'lab-fine' }, 'Your own figures from the repository, shown as saved. Data: Open University Learning Analytics Dataset (32,593 students, 7 modules), Kuzilek, Hlosta, Zdrahal, 2017, CC BY 4.0. Nothing here is computed live.'));
}

/* ───────────────────────── Supermarket graph ───────────────────────── */
function quicksort(a, key) { // the idea from the project: no built-in sort, descending by weight
  if (a.length < 2) return a;
  const p = key(a[a.length >> 1]); const lo = []; const mid = []; const hi = [];
  for (const x of a) { const k = key(x); (k > p ? lo : k < p ? hi : mid).push(x); }
  return [...quicksort(lo, key), ...mid, ...quicksort(hi, key)];
}
async function marketDemo(root, ctx) {
  root.append(h('p', { class: 'lab-blurb' }, 'Loading the basket graph…'));
  const data = await (await fetch(`${BASE}lab/market.json`)).json();
  root.replaceChildren();
  const items = data.items; const n = items.length; const maxC = items[0].c; const maxW = Math.max(...data.edges.map((e) => e[2]));
  let sel = 0; let minW = 90;
  const pos = items.map((_, i) => { const a = (i / n) * Math.PI * 2 - Math.PI / 2; return [210 + Math.cos(a) * 150, 210 + Math.sin(a) * 150]; });
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); svg.setAttribute('viewBox', '0 0 420 420'); svg.setAttribute('class', 'mk-svg'); svg.setAttribute('role', 'img'); svg.setAttribute('aria-label', 'Graph of the 14 most-bought items; thicker lines mean more shared baskets');
  const side = h('div', { class: 'mk-side', 'aria-live': 'polite' });
  const slider = h('input', { type: 'range', min: '30', max: '200', value: String(minW), 'aria-label': 'Minimum shared baskets for an edge' });
  const sliderLabel = h('span', {}, String(minW));
  const NS = 'http://www.w3.org/2000/svg';
  const el = (tag, attrs) => { const e = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v); return e; };
  const render = () => {
    const edges = data.edges.filter((e) => e[2] >= minW);
    const adj = items.map(() => []); edges.forEach(([a, b, w]) => { adj[a].push([b, w]); adj[b].push([a, w]); });
    const depth = new Array(n).fill(-1); depth[sel] = 0; const q = [sel]; // breadth-first search: the indirect relationships
    while (q.length) { const u = q.shift(); for (const [v] of adj[u]) if (depth[v] < 0) { depth[v] = depth[u] + 1; q.push(v); } }
    svg.replaceChildren();
    data.edges.forEach(([a, b, w]) => { if (w < minW) return; const hot = a === sel || b === sel; svg.append(el('line', { x1: pos[a][0], y1: pos[a][1], x2: pos[b][0], y2: pos[b][1], stroke: hot ? '#2433ff' : 'currentColor', 'stroke-opacity': hot ? 0.85 : 0.2, 'stroke-width': (0.6 + (w / maxW) * 7).toFixed(2), 'stroke-linecap': 'round' })); });
    const fill = ['#2433ff', '#ff5a3c', '#ffd21f'];
    items.forEach((it, i) => {
      const g = el('g', { tabindex: '0', role: 'button', 'aria-label': `${it.n}, bought in ${it.c} baskets`, class: 'mk-node' });
      g.append(el('circle', { cx: pos[i][0], cy: pos[i][1], r: (9 + Math.sqrt(it.c / maxC) * 15).toFixed(1), fill: depth[i] >= 0 ? fill[Math.min(depth[i], 2)] : 'currentColor', 'fill-opacity': depth[i] >= 0 ? 0.95 : 0.18, stroke: i === sel ? '#0b0b14' : 'none', 'stroke-width': 2.5 }));
      const lab = el('text', { x: pos[i][0], y: pos[i][1] + (pos[i][1] > 210 ? 36 : -30), 'text-anchor': 'middle', 'font-size': 11, fill: 'currentColor' }); lab.textContent = it.n; g.append(lab);
      const go = () => { sel = i; render(); ctx?.touched?.(); }; g.addEventListener('click', go); g.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
      svg.append(g);
    });
    const ranked = quicksort(adj[sel].map(([v, w]) => ({ v, w })), (x) => x.w);
    const two = items.map((_, i) => i).filter((i) => depth[i] === 2).map((i) => items[i].n);
    side.replaceChildren(
      h('h4', {}, items[sel].n), h('p', { class: 'lab-fine' }, `bought in ${items[sel].c.toLocaleString()} of ${data.transactions.toLocaleString()} baskets`),
      h('p', {}, h('b', {}, 'Bought together most (quicksort, descending)')),
      ranked.length ? h('ol', { class: 'mk-rank' }, ranked.slice(0, 6).map((r) => h('li', {}, h('span', {}, items[r.v].n), h('i', { style: `--w:${(r.w / maxW * 100).toFixed(0)}%` }), h('b', {}, String(r.w))))) : h('p', { class: 'lab-fine' }, 'No partner at this threshold. Lower the slider.'),
      h('p', {}, h('b', {}, 'Breadth-first search: '), `${ranked.length} direct partner${ranked.length === 1 ? '' : 's'}${two.length ? `, then ${two.length} more two steps away: ${two.slice(0, 4).join(', ')}${two.length > 4 ? '…' : ''}` : ', none two steps away'}.`));
  };
  slider.addEventListener('input', () => { minW = +slider.value; sliderLabel.textContent = String(minW); render(); });
  root.append(h('p', { class: 'lab-blurb' }, 'Items are nodes, shared baskets are weighted edges. Click an item, then move the slider.'), h('div', { class: 'mk-wrap' }, svg, side),
    h('label', { class: 'lab-slider' }, 'Show links with at least ', sliderLabel, ' shared baskets ', slider),
    h('p', { class: 'lab-fine' }, `Real aggregates computed from the repository's dataset: ${data.rows.toLocaleString()} purchases, ${data.transactions.toLocaleString()} baskets (one customer on one day), the 14 most-bought items. Source: Groceries dataset (Kaggle). The ranking uses a hand-written quicksort in the spirit of the project, not the library sort.`));
  render();
}

/* ───────────────────────── Network Cell Analyzer ───────────────────────── */
function cellDemo(root, ctx) {
  let dist = 35; let raf = 0; const r = rng(5); const samples = []; let n = 0; let last = 0;
  const cv = h('canvas', { class: 'cell-cv', width: 640, height: 260, role: 'img', 'aria-label': 'Simulated signal strength over time' });
  const g = cv.getContext('2d'); const read = h('div', { class: 'cell-read', 'aria-live': 'polite' });
  const slider = h('input', { type: 'range', min: '0', max: '100', value: String(dist), 'aria-label': 'Distance from the tower', on: { input: () => { dist = +slider.value; ctx?.touched?.(); } } });
  const quality = (v) => (v > -80 ? ['Excellent', '#12b76a'] : v > -90 ? ['Good', '#7bbf2a'] : v > -100 ? ['Fair', '#f5a000'] : ['Poor', '#e5484d']);
  const tick = (t) => {
    raf = requestAnimationFrame(tick);
    if (ctx && !ctx.active()) return; // paused while off screen
    if (t - last > 250) { last = t; n++; const v = -72 - dist * 0.46 + Math.sin(n * 0.35) * 2.2 + (r() - 0.5) * 3.5; samples.push(v); if (samples.length > 64) samples.shift();
      const [q, col] = quality(v); read.replaceChildren(h('b', { style: `color:${col}` }, `${v.toFixed(0)} dBm`), ` RSRP, ${q}`, h('small', {}, ` · ${n} samples sent`));
      g.clearRect(0, 0, 640, 260); g.font = '11px monospace'; g.fillStyle = 'rgba(120,120,140,.9)';
      [[-70, 'rgba(18,183,106,.12)'], [-80, 'rgba(123,191,42,.12)'], [-90, 'rgba(245,160,0,.12)'], [-100, 'rgba(229,72,77,.12)']].forEach(([lv, c], i) => { const y0 = ((-lv - 70) / 60) * 240 + 10; const y1 = i === 3 ? 250 : ((-lv - 60) / 60) * 240 + 10; g.fillStyle = c; g.fillRect(0, y0, 640, y1 - y0); });
      g.strokeStyle = '#2433ff'; g.lineWidth = 2.5; g.lineJoin = 'round'; g.beginPath();
      samples.forEach((s, i) => { const x = (i / 63) * 636 + 2; const y = Math.min(250, Math.max(10, ((-s - 70) / 60) * 240 + 10)); i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.stroke();
    }
  };
  raf = requestAnimationFrame(tick);
  root.append(h('p', { class: 'lab-blurb' }, 'The Android client samples the radio every moment and streams readings to the Flask server. Drag the phone away from the tower and watch the dashboard react.'), cv, read, h('label', { class: 'lab-slider' }, 'Distance from the tower ', slider),
    h('p', { class: 'lab-fine' }, 'Simulated telemetry for illustration, not recorded data. Bands follow common LTE RSRP ranges (better than −80 dBm excellent, −80 to −90 good, −90 to −100 fair, below −100 poor).'));
  return () => cancelAnimationFrame(raf);
}

/* ───────────────────────── registry (mounted inline by samples.js) ───────────────────────── */
export const DEMOS = { loopguard: loopguardDemo, derm: dermDemo, oulad: ouladDemo, market: marketDemo, cell: cellDemo };
