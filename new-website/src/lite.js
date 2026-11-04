import { KF } from './scene/keyframes.js';
import { createColourPublisher } from './scene/colours.js';

/**
 * Lightweight mode for devices without a usable GPU (software rendering, no WebGL, a machine that cannot hold a playable
 * frame rate) and for phones. No WebGL at all: each chapter shows a pre-rendered version of its 3D scene (made from the real
 * scene by tools/make-posters.mjs and tools/make-frames.mjs) cross-fading as you scroll, while the full-page colour flood and
 * all content work exactly as in the 3D version.
 *
 * Portrait screens get a short looping frame sequence per chapter instead of a still: it plays forward while you scroll
 * down, backward while you scroll up, and keeps looping gently when you stop. Frames are drawn to a canvas (the blend of two
 * neighbouring frames fills in the motion between them). Landscape screens and reduced motion keep the single still poster.
 */
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const smooth = (t) => t * t * (3 - 2 * t);
const lerp = (a, b, t) => a + (b - a) * t;

const FRAMES = 16; // frames per loop (tools/make-frames.mjs)
const BASE = 1 / 0.15; // frames per second at real time (the capture step is 0.15 s)
const PERIOD = 2 * (FRAMES - 1); // ping-pong: forward then back, so the loop has no seam
const pingpong = (p) => { const q = ((p % PERIOD) + PERIOD) % PERIOD; return q <= FRAMES - 1 ? q : PERIOD - q; };

export function createLite({ baseUrl, reducedMotion }) {
  const publish = createColourPublisher();
  const keys = Object.keys(KF.hero).filter((k) => typeof KF.hero[k] === 'number');
  const cur = { ...KF.hero };
  const tgt = { ...KF.hero };

  const stage = document.createElement('div');
  stage.className = 'lite-stage';
  stage.setAttribute('aria-hidden', 'true');
  // each scene sits in a slot: the slot is scrubbed by scroll (zoom through the scene); inside it, the poster image loops on its
  // own (CSS) and the frame canvas replaces it once its sequence has loaded
  const slots = [0, 1].map((n) => {
    const slot = document.createElement('div'); slot.className = 'lite-slot';
    const i = new Image(); i.className = 'lite-img'; i.alt = ''; i.decoding = 'async'; i.style.animationDelay = `${-4 * n}s`;
    const c = document.createElement('canvas'); c.className = 'lite-cv';
    slot.append(i, c); stage.append(slot); return slot;
  });
  const imgs = slots.map((s) => s.firstChild);
  const cvs = slots.map((s) => s.lastChild);
  document.body.prepend(stage);

  const portrait = () => innerWidth / innerHeight < 1.1;
  const noFrames = new URLSearchParams(location.search).get('frames') === '0'; // QA switch: the still posters only
  let off = false; // set by the governor below when the loops make a slow device slower: back to the single stills
  const framed = () => portrait() && !reducedMotion && !noFrames && !off;
  const url = (n) => `${baseUrl}posters/${portrait() ? 'p' : 'l'}-${n}.webp`;
  // chapters that show an interactive sample show no 3D object in "sample" view (the switch in the sample brings it back);
  // in frames mode they show the toys alone ("bare") behind the sample window, so the page is never a flat colour
  const sampled = (n) => document.documentElement.dataset.view !== 'object' && window.__sampleKf?.has(n);
  const seqKey = (n) => `${sampled(n) ? 'bare' : 'full'}/${n}`;
  const frameUrl = (key, i) => `${baseUrl}frames/${key}-${String(i).padStart(2, '0')}.webp`;
  const asked = new Set();
  const preload = (n) => { if (!n || sampled(n)) return; const u = url(n); if (asked.has(u)) return; asked.add(u); const im = new Image(); im.src = u; };

  /* ───── frame sequences: decoded bitmaps for the (at most two) scenes on screen; the next one is only warmed in the cache ───── */
  const seqs = new Map(); // key -> { bm: [], ready, failed }
  let loadingCount = 0;
  const idle = () => new Promise((r) => (window.requestIdleCallback ? requestIdleCallback(() => r(), { timeout: 120 }) : setTimeout(r, 24)));
  const grab = async (u) => {
    const im = new Image(); im.decoding = 'async'; im.src = u; await im.decode();
    return typeof createImageBitmap === 'function' ? createImageBitmap(im) : im;
  };
  function ensure(key) {
    let s = seqs.get(key);
    if (s) return s;
    s = { bm: [], ready: false, failed: false, dead: false }; seqs.set(key, s); loadingCount++;
    // a few frames at a time, each decode followed by an idle gap, so a scene change never stalls scrolling
    let next = 0;
    const worker = async () => { while (next < FRAMES && !s.dead) { const i = next++; s.bm[i] = await grab(frameUrl(key, i)); await idle(); } };
    Promise.all([worker(), worker(), worker()])
      .then(() => { s.ready = !s.dead && s.bm.filter(Boolean).length === FRAMES; if (s.dead) closeBitmaps(s); })
      .catch(() => { s.failed = true; })
      .finally(() => { loadingCount--; schedule(); warm(); });
    return s;
  }
  function closeBitmaps(s) { for (const b of s.bm) b?.close?.(); s.bm = []; }
  function release(key) { const s = seqs.get(key); if (!s) return; s.dead = true; if (s.ready) closeBitmaps(s); seqs.delete(key); }
  const warmed = new Set();
  function warm() { // while nothing is loading, fetch the next scene's frames into the HTTP cache (decoded only when it comes on stage)
    if (!framed() || loadingCount > 0) return;
    for (const mk of [marks[mi + 1], marks[mi + 2]]) {
      if (!mk) continue;
      const key = seqKey(mk.name); if (warmed.has(key) || seqs.has(key)) continue;
      warmed.add(key);
      for (let i = 0; i < FRAMES; i++) { const im = new Image(); im.src = frameUrl(key, i); }
      return; // one scene at a time
    }
  }

  let marks = [];
  let mi = 0;
  let raf = 0;
  let names = [null, null]; // poster currently loaded in each slot
  let seqNow = [null, null]; // frame-sequence key wanted in each slot
  let target = { a: 'hero', b: 'hero', t: 0 };
  let sy = window.scrollY;

  function measure() {
    marks = [...document.querySelectorAll('[data-kf]')].filter((el) => KF[el.dataset.kf]).map((el) => {
      if (el.dataset.vc) return { name: el.dataset.kf, center: Number(el.dataset.vc) }; // virtual step inside a pinned group
      const r = el.getBoundingClientRect();
      return { name: el.dataset.kf, center: r.top + window.scrollY + r.height / 2 };
    }).sort((a, b) => a.center - b.center);
  }

  function solve() {
    if (!marks.length) return;
    sy = window.scrollY;
    const m = sy + innerHeight * 0.5;
    let i = 0;
    while (i < marks.length - 1 && marks[i + 1].center <= m) i++;
    mi = i;
    const a = marks[i]; const b = marks[Math.min(i + 1, marks.length - 1)];
    let t = b === a ? 0 : clamp((m - a.center) / (b.center - a.center), 0, 1);
    t = reducedMotion ? (t > 0.5 ? 1 : 0) : smooth(clamp((t - 0.1) / 0.8, 0, 1));
    const A = KF[a.name]; const B = KF[b.name];
    for (const k of keys) tgt[k] = lerp(A[k], B[k], t);
    target = { a: a.name, b: b.name, t };
    if (!framed()) { preload(marks[i + 1]?.name); preload(marks[i + 2]?.name); }
  }

  function paint() {
    // colours chase the scroll target a little (so jumps from the menu ease instead of snapping)
    let moving = false;
    for (const k of keys) {
      const d = tgt[k] - cur[k];
      if (Math.abs(d) > 0.0008) { cur[k] += d * (reducedMotion ? 1 : 0.2); moving = true; } else cur[k] = tgt[k];
    }
    publish(cur);
    const fr = framed();
    const want = target.a === target.b ? [target.a, null] : [target.a, target.b];
    want.forEach((n, i) => {
      const poster = n && !sampled(n) ? n : null;
      if (poster !== names[i]) { names[i] = poster; if (poster) imgs[i].src = url(poster); else imgs[i].removeAttribute('src'); }
      const key = fr && n ? seqKey(n) : null;
      seqNow[i] = key;
      const s = key && (calm || seqs.has(key)) ? ensure(key) : null; // a fast flick loads nothing (stills show); the scene it lands on loads once scrolling calms
      const ready = !!(s && s.ready);
      const op = n ? (i === 0 ? (target.a === target.b ? 1 : 1 - target.t) : target.t) : 0;
      imgs[i].style.opacity = poster && !ready ? String(op) : '0';
      cvs[i].style.opacity = ready ? String(op) : '0';
      cvs[i].dataset.seq = ready ? key : '';
      // scrub: the scene you leave swells toward you, the one you arrive at settles in from slightly farther away
      const z = reducedMotion || target.a === target.b ? 1 : (i === 0 ? 1 + target.t * 0.07 : 0.93 + target.t * 0.07);
      slots[i].style.transform = `scale(${z.toFixed(4)})`;
    });
    for (const k of [...seqs.keys()]) if (!seqNow.includes(k)) release(k); // only the scenes on screen stay decoded
    if (fr && !lp) lp = requestAnimationFrame(loop);
    raf = moving ? requestAnimationFrame(paint) : 0;
  }

  /* ───── the loop: scroll sets its direction and speed, standing still plays it gently forward ───── */
  let lp = 0; let calm = true; let accT = 0; let accN = 0; let strikes = 0; let lastT = 0; let prevY = sy; let rate = BASE; let phase = 0; let drawn = -9;
  function draw(i, idx) {
    const s = seqs.get(seqNow[i]); const cv = cvs[i];
    if (!s?.ready || +cv.style.opacity < 0.01) return;
    const a = Math.floor(idx); const f = idx - a; const b = Math.min(FRAMES - 1, a + 1);
    const A = s.bm[a]; const B = s.bm[b]; if (!A) return;
    if (cv.width !== A.width) { cv.width = A.width; cv.height = A.height; }
    const ctx = cv.getContext('2d');
    ctx.globalAlpha = 1; ctx.clearRect(0, 0, cv.width, cv.height); ctx.drawImage(A, 0, 0);
    if (f > 0.02 && B && B !== A) { ctx.globalAlpha = f; ctx.drawImage(B, 0, 0); }
  }
  function loop(now) {
    lp = requestAnimationFrame(loop);
    if (document.hidden) { lastT = now; return; }
    if (!framed()) { cancelAnimationFrame(lp); lp = 0; return; }
    const raw = (now - lastT) / 1000; const dt = Math.min(0.1, Math.max(0.001, raw)); lastT = now;
    // governor: a window of about 2 s averaging under roughly 22 fps, twice in a row, hands the scene back to the stills
    accT += Math.min(0.5, raw); accN++;
    if (accT >= 2) { strikes = accT / accN > 0.045 ? strikes + 1 : 0; accT = 0; accN = 0; if (strikes >= 2) { handBack(); return; } }
    const vy = (sy - prevY) / dt; prevY = sy; // px per second, signed
    const fast = Math.abs(vy) > 1100;
    if (fast === calm) { calm = !fast; if (calm) schedule(); }
    const s = clamp(Math.abs(vy) / 260, 0, 1);
    const want = BASE * (1 - s) + clamp(vy * 0.014, -28, 28); // scrolling down plays forward, up plays backward, still loops
    rate += (want - rate) * (1 - Math.exp(-dt * 9));
    phase += rate * dt;
    const idx = pingpong(phase);
    if (Math.abs(idx - drawn) < 0.1) return; // about 30 draws a second while idle
    drawn = idx;
    draw(0, idx); draw(1, idx);
  }

  function handBack() {
    off = true; cancelAnimationFrame(lp); lp = 0;
    for (const k of [...seqs.keys()]) release(k);
    seqNow = [null, null]; names = [null, null]; schedule();
  }

  function schedule() { solve(); if (!raf) raf = requestAnimationFrame(paint); }
  const onResize = () => { names = [null, null]; measure(); schedule(); };

  addEventListener('scroll', schedule, { passive: true });
  addEventListener('viewchange', () => { names = [null, null]; schedule(); });
  addEventListener('resize', onResize, { passive: true });
  measure();
  Object.assign(cur, (solve(), tgt));

  return {
    start() { schedule(); },
    remeasure() { measure(); schedule(); },
    get names() { return names.slice(); },
    get sequences() { return seqNow.slice(); },
    get playback() { return { off, phase, rate, idx: pingpong(phase), ready: seqNow.map((k) => !!seqs.get(k)?.ready) }; }, // QA/tests
    stage,
    dispose() {
      removeEventListener('scroll', schedule); removeEventListener('resize', onResize);
      cancelAnimationFrame(raf); cancelAnimationFrame(lp); lp = 0;
      for (const k of [...seqs.keys()]) release(k);
      stage.remove();
    },
  };
}
