import './fonts.js';
import './style.css';
import gsap from 'gsap';


const root = document.documentElement;
root.classList.add('js');

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const params = new URLSearchParams(location.search);
if (params.get('qa') === '1') root.classList.add('qa'); // QA captures: reveals/intro skipped

/* ───────── capability + quality tier ───────── */
function hasWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGL2RenderingContext && c.getContext('webgl2'));
  } catch { return false; }
}
/** 'full' (real GPU), or 'lite' (software rendering / no WebGL / forced). ?lite=1 forces lite, ?lite=0 forces 3D when WebGL exists. */
function chooseMode() {
  const forced = params.get('lite');
  if (!hasWebGL()) return { lite: true, reason: 'nogl' };
  if (forced === '1') return { lite: true, reason: 'forced' };
  if (forced === '0') return { lite: false };
  // phones and small tablets: pre-rendered, looping scenes (sharp, cool, smooth). Live WebGL there is blurry (low pixel ratio) and laggy.
  // Chosen by window width, not by touch: a narrow or zoomed-in desktop window is a "phone" too (live WebGL there is drawn at a low
  // pixel ratio, which is what looked blurry).
  if (innerWidth < 820 || (matchMedia('(pointer: coarse)').matches && Math.min(innerWidth, innerHeight) < 820)) return { lite: true, reason: 'phone' };
  try {
    // a context that fails with failIfMajorPerformanceCaveat is a software rasteriser (SwiftShader, llvmpipe, WARP...)
    const c = document.createElement('canvas');
    const strict = c.getContext('webgl2', { failIfMajorPerformanceCaveat: true });
    if (!strict) return { lite: true, reason: 'software' };
    const gl = document.createElement('canvas').getContext('webgl2');
    const ext = gl && gl.getExtension('WEBGL_debug_renderer_info');
    const name = ext ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)) : '';
    if (/swiftshader|llvmpipe|softpipe|software|basic render|microsoft basic/i.test(name)) return { lite: true, reason: 'software' };
  } catch { /* fall through to 3D */ }
  return { lite: false };
}

function pickQuality() {
  const forced = params.get('q');
  if (['low', 'mid', 'high'].includes(forced)) return forced;
  const coarse = matchMedia('(pointer: coarse)').matches;
  const w = Math.min(innerWidth, innerHeight * 1.8);
  if (coarse && w < 820) return 'low';
  if (coarse || w < 1100 || (navigator.hardwareConcurrency || 8) <= 4) return 'mid';
  return 'high';
}

/* ───────── loader ───────── */
const loader = $('#loader');
const pct = $('#loaderPct');
const setPct = (v) => { pct.textContent = String(Math.round(v)); };
function finishLoader() {
  setPct(100);
  loader.classList.add('is-done');
  setTimeout(() => loader.remove(), 1200);
}

/* ───────── intro choreography ───────── */
function revealIntro(world) {
  const lines = $$('.bt-line');
  const items = $$('[data-intro]');
  if (reducedMotion) {
    gsap.set([...lines, ...items], { opacity: 1 });
    world?.setIntro(1);
    return;
  }
  const state = { v: 0 };
  const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });
  if (world) tl.to(state, { v: 1, duration: 3.4, ease: 'power3.inOut', onUpdate: () => world.setIntro(state.v) }, 0);
  // a blur filter animating over big type is heavy on phones: small screens get the plain rise
  const small = innerWidth < 820;
  tl.fromTo(lines, small ? { yPercent: 40, opacity: 0 } : { yPercent: 40, opacity: 0, filter: 'blur(14px)' }, small ? { yPercent: 0, opacity: 1, duration: 1.4, stagger: 0.14 } : { yPercent: 0, opacity: 1, filter: 'blur(0px)', duration: 1.8, stagger: 0.16 }, small ? 0.5 : 0.9);
  tl.fromTo(items, { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 1.1, stagger: 0.09 }, 1.9);
}

/* ───────── scroll reveals ─────────
   One IntersectionObserver and CSS transitions (compositor only): no per-element scroll triggers to evaluate on every
   scroll event. Panels replay when scrolled back out of view; list items reveal once. */
function setupReveals() {
  if (reducedMotion) return;
  const panels = $$('.panel, .wide').filter((el) => !el.closest('.hero') && !el.closest('.stepper')); // stepper chapters cross-fade with CSS
  const items = $$('.edu-grid article, .lead-list li, .arc-list li');
  const once = new Set(items);
  [...panels, ...items].forEach((el) => el.classList.add('rv'));
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) { e.target.classList.add('is-in'); if (once.has(e.target)) io.unobserve(e.target); }
      else if (e.boundingClientRect.top > 0) e.target.classList.remove('is-in'); // left through the bottom: play again next time
    }
  }, { rootMargin: '0px 0px -10% 0px' });
  [...panels, ...items].forEach((el) => io.observe(el));
  // the name drifts slowly as you leave the hero (parallax against the camera)
  const name = $('.bt-name');
  if (name) {
    let queued = false;
    const draw = () => { queued = false; const p = Math.min(1, Math.max(0, scrollY / innerHeight)); name.style.transform = `translate3d(0, ${(-12 * p).toFixed(2)}%, 0)`; };
    addEventListener('scroll', () => { if (!queued && scrollY < innerHeight * 1.2) { queued = true; requestAnimationFrame(draw); } }, { passive: true });
  }
}

/* ───────── full-width marquee bands: speed + direction react to scroll velocity ───────── */
function setupMarquee() {
  if (reducedMotion) return;
  const tweens = $$('.marquee-track').map((track, i) => (i % 2
    ? gsap.fromTo(track, { xPercent: -50 }, { xPercent: 0, ease: 'none', duration: 28, repeat: -1 })
    : gsap.fromTo(track, { xPercent: 0 }, { xPercent: -50, ease: 'none', duration: 28, repeat: -1 })));
  let boost = 0;
  let lastY = scrollY; let lastT = performance.now();
  addEventListener('scroll', () => {
    const t = performance.now();
    boost = Math.min(7, (Math.abs(scrollY - lastY) / Math.max(8, t - lastT)) * 1000 / 450);
    lastY = scrollY; lastT = t;
  }, { passive: true });
  gsap.ticker.add(() => {
    boost *= 0.94;
    tweens.forEach((t) => t.timeScale(1 + boost));
  });
}

/* ───────── playground: click ripples a full-screen colour flood from the cursor and re-colours the swarm ───────── */
const FLOODS = ['#ff1f8e', '#d4ff1f', '#2433ff', '#ffd21f', '#3df2b0', '#ff5a3c'];
let floodIdx = 0;
function colourFlood(x, y) {
  const el = document.createElement('div');
  el.className = 'flood';
  el.style.background = FLOODS[floodIdx++ % FLOODS.length];
  document.body.append(el);
  const max = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y)) * 1.05;
  if (reducedMotion) { setTimeout(() => el.remove(), 250); return; }
  gsap.fromTo(el, { clipPath: `circle(0px at ${x}px ${y}px)` }, {
    clipPath: `circle(${max}px at ${x}px ${y}px)`, duration: 0.7, ease: 'power3.in',
    onComplete: () => gsap.to(el, { opacity: 0, duration: 0.6, ease: 'power1.out', onComplete: () => el.remove() }),
  });
}
function setupPlayground() {
  const sec = $('#playground');
  if (!sec) return;
  const btn = $('#playBtn');
  btn?.addEventListener('click', (e) => {
    e.stopPropagation();
    window.__world?.recolor(1); window.__world?.kick(6);
    const r = btn.getBoundingClientRect(); colourFlood(r.left + r.width / 2, r.top + r.height / 2);
  });
  sec.addEventListener('pointerdown', (e) => {
    if (e.target.closest('a, button')) return;
    window.__world?.recolor(1); window.__world?.kick(5);
    colourFlood(e.clientX, e.clientY);
  });
}

/* ───────── Pip: click the section (or the button) and the character waves and hops ───────── */
function setupPip() {
  const sec = $('#meet');
  if (!sec) return;
  const wave = () => { window.__world?.wave(); window.__world?.kick(1.5); };
  $('#pipBtn')?.addEventListener('click', (e) => { e.stopPropagation(); wave(); });
  sec.addEventListener('pointerdown', (e) => { if (!e.target.closest('a, button, .panel')) wave(); });
}

/* ───────── kinetic type: headings reveal word by word, each word rising out of its own mask ─────────
   Transform-only (compositor), so it is as cheap on a phone as on a desktop. Stepper chapters replay it every time
   a step becomes active; everything else plays once as it scrolls into view. */
function setupSplit() {
  if (reducedMotion) return;
  const targets = $$('.display, .xp h3, .panel h3').filter((h) => !h.closest('.hero'));
  const once = [];
  targets.forEach((h) => {
    let n = 0;
    const walk = (node) => {
      for (const c of [...node.childNodes]) {
        if (c.nodeType === 3) {
          const frag = document.createDocumentFragment();
          c.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.append(part); return; }
            const w = document.createElement('span'); w.className = 'sw';
            const i = document.createElement('i'); i.textContent = part; i.style.setProperty('--w', String(Math.min(n++, 14)));
            w.append(i); frag.append(w);
          });
          c.replaceWith(frag);
        } else if (c.nodeType === 1 && !c.classList.contains('sw')) walk(c);
      }
    };
    walk(h); h.classList.add('is-split');
    if (!h.closest('.stepper')) once.push(h);
  });
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) { e.target.classList.add('sw-in'); io.unobserve(e.target); }
  }, { rootMargin: '0px 0px -8% 0px' });
  once.forEach((h) => io.observe(h));
}

/* ───────── desktop pointer polish: magnetic buttons and a cursor ring (fine pointers only) ───────── */
function setupPointerPolish() {
  if (reducedMotion || !matchMedia('(hover: hover) and (pointer: fine)').matches || innerWidth < 960) return;
  $$('.btn, .head-cta, .menu-btn').forEach((el) => {
    el.classList.add('is-magnet');
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      el.style.transform = `translate(${(((e.clientX - r.left) / r.width) - 0.5) * 12}px, ${(((e.clientY - r.top) / r.height) - 0.5) * 9}px)`;
    });
    el.addEventListener('pointerleave', () => { el.style.transform = ''; });
  });
  const ring = document.createElement('div');
  ring.className = 'cursor-ring'; ring.setAttribute('aria-hidden', 'true');
  document.body.append(ring);
  let x = -100; let y = -100; let tx = -100; let ty = -100; let raf = 0;
  const loop = () => {
    x += (tx - x) * 0.22; y += (ty - y) * 0.22;
    ring.style.transform = `translate3d(${x - 18}px, ${y - 18}px, 0)`;
    raf = Math.abs(tx - x) + Math.abs(ty - y) > 0.3 ? requestAnimationFrame(loop) : 0;
  };
  addEventListener('pointermove', (e) => { tx = e.clientX; ty = e.clientY; ring.classList.add('is-on'); if (!raf) raf = requestAnimationFrame(loop); }, { passive: true });
  document.addEventListener('pointerleave', () => ring.classList.remove('is-on'));
  document.addEventListener('pointerover', (e) => ring.classList.toggle('is-hot', !!e.target.closest('a, button, .btn, summary, [data-lab]')), { passive: true });
}

/* ───────── smooth wheel scrolling (desktop mouse only; phones keep native momentum) ───────── */
async function setupSmoothScroll() {
  if (reducedMotion || params.get('smooth') === '0' || innerWidth < 960 || !matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  const { default: Lenis } = await import('lenis');
  const lenis = new Lenis({ lerp: 0.11, wheelMultiplier: 0.95, anchors: { duration: 1.1 } });
  root.classList.add('lenis', 'lenis-smooth');
  window.__lenis = lenis;
  const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
  requestAnimationFrame(raf);
}

/* ───────── hybrid HUD: progress bar + live coordinates (one rAF-batched write per scroll burst) ───────── */
function setupHud() {
  const bar = $('#hudBar'); const coord = $('#hudCoord'); const label = $('#railLabel');
  if (!bar) return;
  const wide = matchMedia('(min-width: 961px)'); // the coordinate readout only exists on wide screens
  let max = 1; let queued = false; let lastText = '';
  const measure = () => { max = Math.max(1, document.documentElement.scrollHeight - innerHeight); };
  const draw = () => {
    queued = false;
    const p = Math.min(1, Math.max(0, scrollY / max));
    bar.style.transform = `scaleX(${p.toFixed(4)})`;
    if (coord && wide.matches) {
      const t = `Y ${String(Math.round(scrollY)).padStart(5, '0')} / ${String(Math.round(p * 100)).padStart(3, '0')}% / ${label?.textContent || ''}`;
      if (t !== lastText) { lastText = t; coord.textContent = t; }
    }
  };
  addEventListener('scroll', () => { if (!queued) { queued = true; requestAnimationFrame(draw); } }, { passive: true });
  addEventListener('resize', measure, { passive: true });
  new ResizeObserver(() => { measure(); draw(); }).observe(document.body);
  measure(); draw();
}

/* ───────── hero fit: the name, the statement and the buttons never overlap, at any window shape ─────────
   The name sits just above the buttons; if the statement above would still touch it (short or odd-shaped windows),
   both scale down a little until there is clear air between them. */
function fitHero() {
  const hero = $('#top'); const top = $('.hero-top'); const name = $('.bt-name'); const bottom = $('.hero-bottom'); const layer = $('.back-title');
  if (!hero || !top || !name || !bottom || !layer) return;
  const set = (k, v) => { if (root.style.getPropertyValue(k) !== v) root.style.setProperty(k, v); };
  const cs = getComputedStyle(hero);
  // height the hero needs to hold statement + name + buttons without touching
  const need = () => parseFloat(cs.paddingTop) + top.offsetHeight + 16 + name.offsetHeight * 1.1 + 22 + bottom.offsetHeight + parseFloat(cs.paddingBottom);
  set('--hero-need', '0px');
  let hs = 1;
  set('--hs', '1');
  // 1) shrink the name and statement a little (down to 0.62x) until everything fits in one screen
  while (need() > innerHeight && hs > 0.62) { hs = Math.max(0.62, hs - 0.06); set('--hs', hs.toFixed(2)); }
  // 2) still no room (very short or zoomed-in windows): let the hero grow taller than the screen instead of overlapping
  set('--hero-need', `${Math.ceil(need())}px`);
  set('--hero-h', `${hero.offsetHeight}px`); // the name layer follows the hero's real height
  const b = bottom.getBoundingClientRect();
  set('--hb', `${Math.round(layer.getBoundingClientRect().bottom - b.top + 22)}px`);
}

/* ───────── virtual scrolling: pinned groups that step through their chapters ─────────
   Each `.stepper` becomes a sticky 100svh stage; its chapters stack inside it and the scroll distance of the group is
   only (steps - 1) x a fraction of a screen. Every step gets a virtual camera marker (data-vc) so the 3D director
   follows the steps exactly as it follows normal chapters. Pips under the stage jump between steps. */
let layoutSteppers = () => {};
function setupSteppers() {
  const boxes = $$('.stepper').map((box) => {
    const steps = $$(':scope > .chapter', box);
    const stage = document.createElement('div');
    stage.className = 'stage';
    steps.forEach((s) => stage.append(s));
    const pips = document.createElement('div');
    pips.className = 'step-pips';
    pips.setAttribute('role', 'group');
    pips.setAttribute('aria-label', 'Steps');
    const buttons = steps.map((s, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('aria-label', `Step ${i + 1} of ${steps.length}: ${s.dataset.label || ''}`);
      b.addEventListener('click', () => {
        const g = box._g;
        scrollTo({ top: g.top + i * g.S, behavior: reducedMotion ? 'auto' : 'smooth' });
      });
      pips.append(b);
      return b;
    });
    const count = document.createElement('span');
    count.className = 'step-count';
    count.setAttribute('aria-hidden', 'true');
    pips.prepend(count);
    stage.append(pips);
    box.append(stage);
    box.classList.add('is-live');
    return { box, steps, buttons, pips, count, active: -1 };
  });

  const layout = () => {
    const vh = innerHeight;
    for (const o of boxes) {
      const S = (Number(o.box.dataset.step) || 0.3) * vh;
      o.box.style.height = `${(o.steps.length - 1) * S + vh}px`;
      const top = o.box.getBoundingClientRect().top + scrollY;
      o.box._g = { top, S, h: o.box.offsetHeight };
      o.steps.forEach((s, i) => { s.dataset.vc = String(Math.round(top + vh / 2 + i * S)); });
    }
  };
  const rail = $('#rail'); const label = $('#railLabel');
  const update = () => {
    for (const o of boxes) {
      const { top, S, h } = o.box._g;
      const idx = Math.max(0, Math.min(o.steps.length - 1, Math.round((scrollY - top) / S)));
      if (idx !== o.active) {
        o.active = idx;
        o.steps.forEach((s, i) => s.classList.toggle('is-active', i === idx));
        o.buttons.forEach((b, i) => b.setAttribute('aria-current', String(i === idx)));
        o.count.textContent = `${idx + 1} / ${o.steps.length}  ${o.steps[idx].dataset.label || ''}`;
      }
      // the pips belong to the pinned stage only: fade them as the group scrolls in or out
      o.pips.classList.toggle('is-away', scrollY < top - 40 || scrollY > top + h - innerHeight + 40);
      const inside = scrollY > top - innerHeight * 0.4 && scrollY < top + h - innerHeight * 0.6;
      if (inside) {
        const text = o.steps[idx].dataset.label || '';
        if (label.textContent !== text) label.textContent = text;
        if (rail.classList.contains('is-hidden')) rail.classList.remove('is-hidden');
      }
    }
  };
  layoutSteppers = () => { layout(); update(); };
  layout(); update();
  addEventListener('scroll', update, { passive: true });
  addEventListener('resize', () => { layout(); update(); }, { passive: true });
}

/** scroll position at which a chapter's camera marker sits at the middle of the screen (virtual steps included) */
window.__kfY = (el) => {
  if (el.dataset.vc) return Number(el.dataset.vc) - innerHeight / 2;
  const r = el.getBoundingClientRect();
  return r.top + scrollY + r.height / 2 - innerHeight / 2;
};

/* ───────── rail ───────── */
function setupRail() {
  const label = $('#railLabel');
  const rail = $('#rail');
  const chapters = $$('.chapter[data-label]').filter((c) => !c.closest('.stepper')); // stepper chapters set the label themselves
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      label.textContent = e.target.dataset.label;
      // the label would print over the long list/FAQ panels, so tuck it away there
      rail.classList.toggle('is-hidden', ['Archive', 'Education'].includes(e.target.dataset.label));
    });
  }, { rootMargin: '-45% 0px -45% 0px' });
  chapters.forEach((c) => io.observe(c));
  let max = 1; let queued = false;
  const measure = () => { max = Math.max(1, document.documentElement.scrollHeight - innerHeight); };
  const write = () => { queued = false; rail.style.setProperty('--p', (scrollY / max).toFixed(4)); };
  addEventListener('scroll', () => { if (!queued) { queued = true; requestAnimationFrame(write); } }, { passive: true });
  addEventListener('resize', measure, { passive: true });
  addEventListener('load', measure);
  new ResizeObserver(measure).observe(document.body);
  measure();
}

/* ───────── menu ───────── */
function setupMenu() {
  const btn = $('#menuBtn');
  const menu = $('#menu');
  $$('.menu li').forEach((li, i) => li.style.setProperty('--i', String(i)));
  let open = false;
  const set = (next, { restoreFocus = false } = {}) => {
    if (next === open) return;
    open = next;
    btn.setAttribute('aria-expanded', String(open));
    btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    if (open) {
      // grow the wipe from the centre of the button, far enough to cover the farthest corner
      const r = btn.getBoundingClientRect();
      const cx = r.left + r.width / 2; const cy = r.top + r.height / 2;
      menu.style.setProperty('--mx', cx + 'px'); menu.style.setProperty('--my', cy + 'px');
      menu.style.setProperty('--r', Math.hypot(Math.max(cx, innerWidth - cx), Math.max(cy, innerHeight - cy)) * 1.05 + 'px');
      menu.inert = false;
      menu.classList.add('is-open');
      document.body.style.overflow = 'hidden';
      void menu.offsetWidth; // visibility must be applied before the first link can take focus
      $('a', menu)?.focus({ preventScroll: true });
    } else {
      menu.classList.remove('is-open');
      menu.inert = true;
      document.body.style.overflow = '';
      if (restoreFocus) btn.focus();
    }
  };
  btn.addEventListener('click', () => set(!open));
  menu.addEventListener('click', (e) => { if (e.target.closest('a')) set(false); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && open) set(false, { restoreFocus: true }); });
}

/* ───────── case modals ───────── */
const CASES = {
  great: {
    title: 'GREAT: Multi-Agent Evaluation & Analytics Platform',
    sub: 'Gabriel & Co. · New York, NY (Remote) · 2024 to Present',
    body: `<h4>The Challenge</h4><p>Evaluating customer interactions across 34+ agents and 3 communication channels manually was slow, inconsistent, and unscalable.</p>
      <h4>Architecture &amp; Solution</h4><p>Architected an automated multi-agent evaluation pipeline using custom LLM judge prompts, RAG context validation, and automated scoring metrics. Integrated with company telephony and CRM systems.</p>
      <h4>Key Outcomes</h4><p>• <strong>-90% Reduction in Manual QA Effort</strong>: Automated 100% of routine call reviews.<br/>• <strong>34+ Agents Monitored</strong>: Real-time scoring and sentiment analytics.<br/>• <strong>Actionable Insights</strong>: Instant compliance flagging and coaching recommendations.</p>`,
  },
  loopguard: {
    title: 'LoopGuard: Agentic Circuit Breaker & Safety Harness',
    sub: 'Open Source AI Safety Framework · 2025',
    body: `<h4>The Challenge</h4><p>Autonomous LLM agents can easily enter infinite execution loops, consuming tokens rapidly and performing unintended actions.</p>
      <h4>Architecture &amp; Solution</h4><p>Designed a lightweight Python circuit-breaker decorator that tracks execution graphs, detects state cycles via graph hashing, and halts rogue agents automatically.</p>
      <h4>Key Outcomes</h4><p>• <strong>Zero Token Runaway</strong>: Halts infinite recursion within 3 state iterations.<br/>• <strong>Zero Dependency Core</strong>: Drop-in compatibility for LangChain, AutoGen, and custom loopers.</p>`,
  },
};
function setupModal() {
  const modal = $('#caseModal');
  let opener = null;
  const bg = () => [$('main'), $('#head'), $('.foot')].filter(Boolean);
  const close = () => { modal.hidden = true; document.body.style.overflow = ''; bg().forEach((el) => { el.inert = false; }); opener?.focus(); };
  // keep Tab inside the dialog while it is open
  modal.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;
    const f = $$('button, a[href]', modal).filter((el) => !el.disabled);
    if (!f.length) return;
    const first = f[0]; const last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
  $$('[data-modal]').forEach((b) => b.addEventListener('click', () => {
    const c = CASES[b.dataset.modal];
    if (!c) return;
    opener = b;
    $('#modalTitle').textContent = c.title;
    $('#modalSub').textContent = c.sub;
    $('#modalBody').innerHTML = c.body;
    modal.hidden = false;
    bg().forEach((el) => { el.inert = true; });
    document.body.style.overflow = 'hidden';
    $('.modal-close', modal).focus();
  }));
  $('.modal-close', modal).addEventListener('click', close);
  modal.addEventListener('click', (e) => { if (e.target === modal) close(); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && !modal.hidden) close(); });
}

/* ───────── archive filter + copy ───────── */
function setupMisc() {
  const chips = $$('.chip');
  chips.forEach((c) => c.setAttribute('aria-pressed', String(c.classList.contains('is-on'))));
  const rows = $$('#arcList li');
  chips.forEach((chip) => chip.addEventListener('click', () => {
    chips.forEach((c) => { c.classList.toggle('is-on', c === chip); c.setAttribute('aria-pressed', String(c === chip)); });
    const f = chip.dataset.filter;
    rows.forEach((r) => { r.hidden = !(f === 'all' || r.dataset.cat === f); });
    window.__world?.remeasure();
    window.__world?.kick(5); // the swarm answers the filter: it bursts outward, then settles
  }));
  // hovering an archive row nudges the rings a little, the list is wired into the same world
  $$('#arcList a').forEach((a) => a.addEventListener('pointerenter', () => window.__world?.kick(1.4)));
  const copy = $('#copyMail');
  copy?.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(copy.dataset.mail); copy.textContent = 'Copied ✓'; }
    catch { copy.textContent = copy.dataset.mail; }
    setTimeout(() => { copy.textContent = 'Copy address'; }, 2000);
  });
  $('#year').textContent = String(new Date().getFullYear());
}

/* ───────── perf overlay (?perf=1 or press P), for measuring on real hardware ───────── */
function setupPerfHud(world) {
  let el = null; let raf = 0; let frames = 0; let t0 = performance.now(); let worst = 0; let lastF = t0;
  const loop = (now) => {
    raf = requestAnimationFrame(loop);
    worst = Math.max(worst, now - lastF); lastF = now; frames++;
    if (now - t0 < 500) return;
    const fps = (frames * 1000) / (now - t0);
    const i = world.renderer.info;
    el.textContent = `${fps.toFixed(0)} fps · ${(1000 / fps).toFixed(1)} ms avg · worst ${worst.toFixed(0)} ms\n`
      + `${i.render.calls} draws · ${(i.render.triangles / 1000).toFixed(0)}k tris · ${i.memory.geometries} geo · ${i.memory.textures} tex · ${i.programs?.length ?? '?'} progs\n`
      + `pixel ratio ${world.stats.pr} (gov steps ${world.stats.steps}) · ${innerWidth}×${innerHeight} @${devicePixelRatio}x`;
    frames = 0; t0 = now; worst = 0;
  };
  const toggle = (on) => {
    if (on && !el) {
      el = document.createElement('pre'); el.className = 'perf-hud'; el.setAttribute('aria-hidden', 'true'); document.body.append(el);
      lastF = t0 = performance.now(); frames = 0; raf = requestAnimationFrame(loop);
    } else if (!on && el) { cancelAnimationFrame(raf); el.remove(); el = null; }
  };
  if (params.get('perf') === '1') toggle(true);
  addEventListener('keydown', (e) => { if ((e.key === 'p' || e.key === 'P') && !e.metaKey && !e.ctrlKey && !/INPUT|TEXTAREA/.test(document.activeElement?.tagName)) toggle(!el); });
}

/* ───────── lightweight mode (no GPU needed) ───────── */
function showLiteBanner(reason) {
  if (reason === 'phone') return; // by design on phones: no banner
  const el = $('#noWebgl');
  el.replaceChildren();
  const span = document.createElement('span');
  span.textContent = reason === 'nogl'
    ? 'Interactive 3D is unavailable on this device. The full portfolio is below.'
    : 'Lightweight mode: interactive 3D is off on this device so everything stays smooth.';
  el.append(span);
  if (reason !== 'nogl') {
    const a = document.createElement('a');
    a.href = '?lite=0'; a.textContent = 'Try full 3D'; a.className = 'banner-link';
    el.append(' ', a);
  }
  el.hidden = false;
  if (reason !== 'forced') setTimeout(() => el.classList.add('is-quiet'), 9000);
}

/** ?perf=1 on the pre-rendered scenes: a tiny frame-rate readout, so a real phone can report what it measures */
function liteFps() {
  const el = document.createElement('pre');
  el.className = 'perf-hud';
  document.body.append(el);
  let n = 0; let t0 = performance.now(); let worst = 0; let last = t0;
  const tick = (now) => {
    n++; worst = Math.max(worst, now - last); last = now;
    if (now - t0 >= 1000) { el.textContent = `scenes (pre-rendered)
fps ${n}
worst frame ${worst.toFixed(0)} ms
${innerWidth}x${innerHeight} @${devicePixelRatio}x`; n = 0; worst = 0; t0 = now; }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

async function startLite(reason) {
  root.classList.add('lite');
  if (reason === 'nogl') root.classList.add('no-gl');
  root.dataset.q = 'low';
  const { createLite } = await import('./lite.js');
  const lite = createLite({ baseUrl: import.meta.env.BASE_URL, reducedMotion });
  window.__lite = lite;
  if (params.get('perf') === '1') liteFps();
  showLiteBanner(reason);
  return lite;
}

/* ───────── quick navigation dots ───────── */
function setupDots() {
  const wrap = $('#dots');
  if (!wrap) return;
  const targets = $$('a', wrap).map((a) => ({ a, el: document.querySelector(a.getAttribute('href')) })).filter((t) => t.el);
  let tops = [];
  let on = null;
  const measure = () => { tops = targets.map((t) => t.el.getBoundingClientRect().top + scrollY); update(); };
  const update = () => {
    const mid = scrollY + innerHeight * 0.45;
    let cur = 0;
    tops.forEach((y, i) => { if (y <= mid) cur = i; });
    if (cur === on) return;
    on = cur;
    targets.forEach((t, i) => t.a.classList.toggle('is-on', i === cur));
  };
  addEventListener('scroll', update, { passive: true });
  addEventListener('resize', measure, { passive: true });
  addEventListener('load', measure);
  new ResizeObserver(measure).observe(document.body);
  measure();
}

/* ───────── boot ───────── */
async function boot() {
  if (params.get('poster') === '1') root.classList.add('poster'); // tooling: render the 3D alone on a transparent page
  setupMenu();
  setupHud();
  setupSplit();
  setupModal();
  setupMisc();
  setupRail();
  setupSteppers();
  setupDots();

  const mode = chooseMode();
  let world = null;
  let lite = null;

  if (mode.lite) {
    setPct(40);
    lite = await startLite(mode.reason);
  } else {
    setPct(8);
    const quality = pickQuality();
    root.dataset.q = quality;
    try {
      const { createWorld } = await import('./scene/world.js');
      setPct(35);
      await new Promise((r) => requestAnimationFrame(r));
      const governor = params.get('gov') !== '0' && params.get('qa') !== '1';
      world = createWorld($('#world'), {
        quality, reducedMotion, governor,
        // a frame rate that stays unplayable even at the lowest resolution: switch to the lightweight mode, live
        onSlow: governor ? async () => {
          world?.dispose(); $('#world').style.display = 'none';
          delete window.__world; world = null;
          lite = await startLite('slow'); lite.start();
        } : null,
      });
      window.__world = world;
      setPct(62);
      await Promise.race([world.compile(), new Promise((r) => setTimeout(r, 6000))]);
      setPct(80);
      await new Promise((r) => requestAnimationFrame(r));
      world.warm();
      setPct(92);
    } catch (err) {
      console.error('[3D] failed to start, using the lightweight mode', err);
      world?.dispose?.(); world = null;
      lite = await startLite('nogl');
    }
  }

  if (document.fonts?.ready) await Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1800))]);
  world?.remeasure();
  world?.start();
  lite?.start();
  if (world) setupPerfHud(world);
  setupReveals();
  setupMarquee();
  setupPlayground();
  setupPip();
  setupPointerPolish();
  setupSmoothScroll();
  (window.requestIdleCallback || ((f) => setTimeout(f, 1200)))(() => import('./lab.js').then((m) => m.initLab())); // the sample panels: a small separate chunk
  const remeasure = () => { fitHero(); layoutSteppers(); world?.remeasure(); lite?.remeasure(); };
  remeasure();
  addEventListener('load', () => remeasure());
  new ResizeObserver(() => remeasure()).observe(document.body);

  // QA hook: ?at=<keyframe> jumps straight to a chapter; ?intro=0 skips the opening animation
  const at = params.get('at');
  if (at) {
    const el = document.querySelector(`[data-kf="${at}"]`);
    if (el) scrollTo(0, window.__kfY(el));
  }
  if (params.get('intro') === '0') world?.setIntro(1);

  finishLoader();
  setTimeout(() => revealIntro(params.get('intro') === '0' || !world ? null : world), 250);
}

boot();
