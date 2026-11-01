import './fonts.js';
import './style.css';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

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
  tl.fromTo(lines, { yPercent: 40, opacity: 0, filter: 'blur(14px)' }, { yPercent: 0, opacity: 1, filter: 'blur(0px)', duration: 1.8, stagger: 0.16 }, 0.9);
  tl.fromTo(items, { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 1.1, stagger: 0.09 }, 1.9);
}

/* ───────── scroll reveals ───────── */
function setupReveals() {
  if (reducedMotion) return;
  $$('.panel, .wide').forEach((el) => {
    if (el.closest('.hero')) return;
    gsap.fromTo(el, { y: 56, opacity: 0 }, {
      y: 0, opacity: 1, duration: 1.1, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 86%', toggleActions: 'play none none reverse' },
    });
  });
  $$('.edu-grid article, .lead-list li, .arc-list li').forEach((el) => {
    gsap.fromTo(el, { y: 26, opacity: 0 }, {
      y: 0, opacity: 1, duration: 0.9, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 92%', toggleActions: 'play none none none' },
    });
  });
  // the name drifts slowly as you leave the hero (parallax against the camera)
  gsap.to('.bt-name', { yPercent: -12, ease: 'none', scrollTrigger: { trigger: '#top', start: 'top top', end: 'bottom top', scrub: true } });
}

/* ───────── full-width marquee bands: speed + direction react to scroll velocity ───────── */
function setupMarquee() {
  if (reducedMotion) return;
  const tweens = $$('.marquee-track').map((track, i) => (i % 2
    ? gsap.fromTo(track, { xPercent: -50 }, { xPercent: 0, ease: 'none', duration: 28, repeat: -1 })
    : gsap.fromTo(track, { xPercent: 0 }, { xPercent: -50, ease: 'none', duration: 28, repeat: -1 })));
  let boost = 0;
  ScrollTrigger.create({ onUpdate: (self) => { boost = Math.min(7, Math.abs(self.getVelocity()) / 450); } });
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

/* ───────── rail ───────── */
function setupRail() {
  const label = $('#railLabel');
  const rail = $('#rail');
  const chapters = $$('.chapter[data-label]');
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      label.textContent = e.target.dataset.label;
      // the label would print over the long list/FAQ panels, so tuck it away there
      rail.classList.toggle('is-hidden', ['Archive', 'Education'].includes(e.target.dataset.label));
    });
  }, { rootMargin: '-45% 0px -45% 0px' });
  chapters.forEach((c) => io.observe(c));
  addEventListener('scroll', () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    rail.style.setProperty('--p', (scrollY / Math.max(1, max)).toFixed(4));
  }, { passive: true });
}

/* ───────── menu ───────── */
function setupMenu() {
  const btn = $('#menuBtn');
  const menu = $('#menu');
  const set = (open) => {
    btn.setAttribute('aria-expanded', String(open));
    btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    menu.hidden = !open;
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) $('a', menu)?.focus();
  };
  btn.addEventListener('click', () => set(menu.hidden));
  menu.addEventListener('click', (e) => { if (e.target.closest('a')) set(false); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && !menu.hidden) { set(false); btn.focus(); } });
}

/* ───────── case modals ───────── */
const CASES = {
  great: {
    title: 'GREAT — Multi-Agent Evaluation & Analytics Platform',
    sub: 'Gabriel & Co. · New York, NY (Remote) · 2024 — Present',
    body: `<h4>The Challenge</h4><p>Evaluating customer interactions across 34+ agents and 3 communication channels manually was slow, inconsistent, and unscalable.</p>
      <h4>Architecture &amp; Solution</h4><p>Architected an automated multi-agent evaluation pipeline using custom LLM judge prompts, RAG context validation, and automated scoring metrics. Integrated with company telephony and CRM systems.</p>
      <h4>Key Outcomes</h4><p>• <strong>-90% Reduction in Manual QA Effort</strong>: Automated 100% of routine call reviews.<br/>• <strong>34+ Agents Monitored</strong>: Real-time scoring and sentiment analytics.<br/>• <strong>Actionable Insights</strong>: Instant compliance flagging and coaching recommendations.</p>`,
  },
  loopguard: {
    title: 'LoopGuard — Agentic Circuit Breaker & Safety Harness',
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
  // hovering an archive row nudges the rings a little — the list is wired into the same world
  $$('#arcList a').forEach((a) => a.addEventListener('pointerenter', () => window.__world?.kick(1.4)));
  const copy = $('#copyMail');
  copy?.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(copy.dataset.mail); copy.textContent = 'Copied ✓'; }
    catch { copy.textContent = copy.dataset.mail; }
    setTimeout(() => { copy.textContent = 'Copy address'; }, 2000);
  });
  $('#year').textContent = String(new Date().getFullYear());
}

/* ───────── perf overlay (?perf=1 or press P) — for measuring on real hardware ───────── */
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

/* ───────── boot ───────── */
async function boot() {
  setupMenu();
  setupModal();
  setupMisc();
  setupRail();

  const canGL = hasWebGL();
  if (!canGL) {
    root.classList.add('no-gl');
    $('#noWebgl').hidden = false;
    revealIntro(null);
    setupReveals();
    finishLoader();
    return;
  }

  setPct(8);
  const quality = pickQuality();
  root.dataset.q = quality;
  let world = null;
  try {
    const { createWorld } = await import('./scene/world.js');
    setPct(35);
    await new Promise((r) => requestAnimationFrame(r));
    const governor = params.get('gov') !== '0' && params.get('qa') !== '1';
    world = createWorld($('#world'), { quality, reducedMotion, governor });
    window.__world = world;
    setPct(62);
    await Promise.race([world.compile(), new Promise((r) => setTimeout(r, 6000))]);
    setPct(80);
    await new Promise((r) => requestAnimationFrame(r));
    world.warm();
    setPct(92);
  } catch (err) {
    console.error('[3D] failed to start, falling back to static layout', err);
    root.classList.add('no-gl');
    $('#noWebgl').hidden = false;
  }

  if (document.fonts?.ready) await Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1800))]);
  world?.remeasure();
  world?.start();
  if (world) setupPerfHud(world);
  setupReveals();
  setupMarquee();
  setupPlayground();
  ScrollTrigger.refresh();
  world?.remeasure();
  addEventListener('load', () => { ScrollTrigger.refresh(); world?.remeasure(); });
  new ResizeObserver(() => world?.remeasure()).observe(document.body);

  // QA hook: ?at=<keyframe> jumps straight to a chapter; ?intro=1 skips the opening animation
  const at = params.get('at');
  if (at) {
    const el = document.querySelector(`[data-kf="${at}"]`);
    if (el) { const r = el.getBoundingClientRect(); scrollTo(0, r.top + scrollY + r.height / 2 - innerHeight / 2); }
  }
  if (params.get('intro') === '0') world?.setIntro(1);

  finishLoader();
  setTimeout(() => revealIntro(params.get('intro') === '0' ? null : world), 250);
}

boot();
