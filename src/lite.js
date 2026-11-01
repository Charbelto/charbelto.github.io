import { KF } from './scene/keyframes.js';
import { createColourPublisher } from './scene/colours.js';

/**
 * Lightweight mode for devices without a usable GPU (software rendering, no WebGL, or a machine that cannot hold a
 * playable frame rate). No WebGL at all: each chapter shows a pre-rendered poster of its 3D object (public/posters,
 * made from the real scene by tools/make-posters.mjs) cross-fading as you scroll, while the full-page colour flood and
 * all content work exactly as in the 3D version. The only per-scroll work is a few CSS variables and two opacities.
 */
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const smooth = (t) => t * t * (3 - 2 * t);
const lerp = (a, b, t) => a + (b - a) * t;

export function createLite({ baseUrl, reducedMotion }) {
  const publish = createColourPublisher();
  const keys = Object.keys(KF.hero).filter((k) => typeof KF.hero[k] === 'number');
  const cur = { ...KF.hero };
  const tgt = { ...KF.hero };

  const stage = document.createElement('div');
  stage.className = 'lite-stage';
  stage.setAttribute('aria-hidden', 'true');
  const imgs = [0, 1].map(() => { const i = new Image(); i.className = 'lite-img'; i.alt = ''; i.decoding = 'async'; stage.append(i); return i; });
  document.body.prepend(stage);

  const portrait = () => innerWidth / innerHeight < 1.1;
  const url = (n) => `${baseUrl}posters/${portrait() ? 'p' : 'l'}-${n}.webp`;
  const asked = new Set();
  const preload = (n) => { if (!n) return; const u = url(n); if (asked.has(u)) return; asked.add(u); const im = new Image(); im.src = u; };

  let marks = [];
  let raf = 0;
  let names = [null, null];
  let target = { a: 'hero', b: 'hero', t: 0 };

  function measure() {
    marks = [...document.querySelectorAll('[data-kf]')].filter((el) => KF[el.dataset.kf]).map((el) => {
      if (el.dataset.vc) return { name: el.dataset.kf, center: Number(el.dataset.vc) }; // virtual step inside a pinned group
      const r = el.getBoundingClientRect();
      return { name: el.dataset.kf, center: r.top + window.scrollY + r.height / 2 };
    }).sort((a, b) => a.center - b.center);
  }

  function solve() {
    if (!marks.length) return;
    const m = window.scrollY + innerHeight * 0.5;
    let i = 0;
    while (i < marks.length - 1 && marks[i + 1].center <= m) i++;
    const a = marks[i]; const b = marks[Math.min(i + 1, marks.length - 1)];
    let t = b === a ? 0 : clamp((m - a.center) / (b.center - a.center), 0, 1);
    t = reducedMotion ? (t > 0.5 ? 1 : 0) : smooth(clamp((t - 0.1) / 0.8, 0, 1));
    const A = KF[a.name]; const B = KF[b.name];
    for (const k of keys) tgt[k] = lerp(A[k], B[k], t);
    target = { a: a.name, b: b.name, t };
    preload(marks[i + 1]?.name); preload(marks[i + 2]?.name);
  }

  function paint() {
    // colours chase the scroll target a little (so jumps from the menu ease instead of snapping)
    let moving = false;
    for (const k of keys) {
      const d = tgt[k] - cur[k];
      if (Math.abs(d) > 0.0008) { cur[k] += d * (reducedMotion ? 1 : 0.2); moving = true; } else cur[k] = tgt[k];
    }
    publish(cur);
    const want = target.a === target.b ? [target.a, null] : [target.a, target.b];
    want.forEach((n, i) => {
      if (n !== names[i]) { names[i] = n; if (n) imgs[i].src = url(n); }
      imgs[i].style.opacity = n ? String(i === 0 ? (target.a === target.b ? 1 : 1 - target.t) : target.t) : '0';
    });
    raf = moving ? requestAnimationFrame(paint) : 0;
  }

  function schedule() { solve(); if (!raf) raf = requestAnimationFrame(paint); }
  const onResize = () => { names = [null, null]; measure(); schedule(); };

  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', onResize, { passive: true });
  measure();
  Object.assign(cur, (solve(), tgt));

  return {
    start() { schedule(); },
    remeasure() { measure(); schedule(); },
    get names() { return names.slice(); },
    stage,
    dispose() { removeEventListener('scroll', schedule); removeEventListener('resize', onResize); cancelAnimationFrame(raf); stage.remove(); },
  };
}
