/* ═══════════════════════════════════════════════════════════════
   CHARBEL TOUMIEH — PORTFOLIO, MMXXVI
   Vanilla interaction layer. Transform/opacity only; rAF-throttled;
   everything respects prefers-reduced-motion. No dependencies.
   ═══════════════════════════════════════════════════════════════ */

document.documentElement.classList.add('js');
// ?flat — static render for visual QA / screenshot tooling
if (new URLSearchParams(location.search).has('flat')) {
  document.documentElement.classList.add('debug-flat');
}

const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const FINE_POINTER = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

document.addEventListener('DOMContentLoaded', () => {
  initCurtain();
  initClock();
  initVeil();
  initHeader();
  initReveals();
  initCounters();
  initScrollEffects();
  initCatalogueFilter();
  initCopyMail();
  if (FINE_POINTER && !REDUCED) {
    initCursor();
    initMagnetic();
  }
  document.getElementById('year').textContent = new Date().getFullYear();
});

/* ── Curtain: brief reveal, once per session ─────────────────── */
function initCurtain() {
  const seen = sessionStorage.getItem('ct-curtain');
  if (seen || REDUCED) {
    document.body.classList.add('curtain-skip', 'is-loaded');
    return;
  }
  try { sessionStorage.setItem('ct-curtain', '1'); } catch (e) { /* private mode */ }
  // Lift once fonts are ready — hard cap so slow connections never wait.
  const lift = () => document.body.classList.add('is-loaded');
  Promise.race([
    document.fonts ? document.fonts.ready : Promise.resolve(),
    new Promise(res => setTimeout(res, 900))
  ]).then(() => requestAnimationFrame(lift));
  const curtain = document.getElementById('curtain');
  curtain.addEventListener('transitionend', () => curtain.remove(), { once: true });
  setTimeout(() => curtain.isConnected && curtain.remove(), 3000);
}

/* ── Header clock (UK time) ──────────────────────────────────── */
function initClock() {
  const el = document.getElementById('headClock');
  if (!el) return;
  const fmt = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit', minute: '2-digit', timeZone: 'Europe/London'
  });
  const tick = () => { el.textContent = 'Coventry — ' + fmt.format(new Date()); };
  tick();
  setInterval(tick, 30000);
}

/* ── Index veil (fullscreen menu) ────────────────────────────── */
function initVeil() {
  const btn = document.getElementById('menuBtn');
  const veil = document.getElementById('veil');
  if (!btn || !veil) return;

  const setOpen = (open) => {
    document.body.classList.toggle('veil-open', open);
    btn.setAttribute('aria-expanded', String(open));
    veil.setAttribute('aria-hidden', String(!open));
  };
  btn.addEventListener('click', () => setOpen(!document.body.classList.contains('veil-open')));
  veil.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setOpen(false)));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && document.body.classList.contains('veil-open')) {
      setOpen(false);
      btn.focus();
    }
  });
}

/* ── Header shade: invert over ink rooms ─────────────────────── */
function initHeader() {
  const head = document.getElementById('siteHead');
  const rooms = [...document.querySelectorAll('[data-shade]')];
  if (!head || !rooms.length) return;

  let ticking = false;
  const update = () => {
    ticking = false;
    head.classList.toggle('is-scrolled', window.scrollY > 8);
    const probe = 40; // vertical centre of the header bar
    let shade = 'light';
    for (const room of rooms) {
      const r = room.getBoundingClientRect();
      if (r.top <= probe && r.bottom > probe) { shade = room.dataset.shade; break; }
    }
    head.classList.toggle('is-dark', shade === 'dark');
  };
  const onScroll = () => {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  update();
}

/* ── Reveal-on-scroll with soft stagger ──────────────────────── */
function initReveals() {
  const els = document.querySelectorAll('[data-reveal]');
  if (!('IntersectionObserver' in window) || REDUCED) {
    els.forEach(el => el.classList.add('is-in'));
    return;
  }
  let batch = 0;
  let batchReset = null;
  const io = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      // Elements entering in the same frame stagger 70ms apart.
      entry.target.style.setProperty('--d', (batch * 0.07) + 's');
      batch += 1;
      entry.target.classList.add('is-in');
      io.unobserve(entry.target);
    }
    clearTimeout(batchReset);
    batchReset = setTimeout(() => { batch = 0; }, 220);
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.05 });
  els.forEach(el => io.observe(el));
}

/* ── Stat count-up ───────────────────────────────────────────── */
function initCounters() {
  const nums = document.querySelectorAll('.stat-num');
  if (!nums.length) return;
  const render = (el, v) =>
    el.textContent = (el.dataset.prefix || '') + v + (el.dataset.suffix || '');
  if (REDUCED || !('IntersectionObserver' in window)) {
    nums.forEach(el => render(el, el.dataset.count));
    return;
  }
  nums.forEach(el => render(el, 0)); // HTML holds final values for no-JS; zero before animating
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = parseInt(el.dataset.count, 10);
      const t0 = performance.now();
      const dur = 1400;
      const step = (t) => {
        const p = Math.min((t - t0) / dur, 1);
        const eased = 1 - Math.pow(1 - p, 4);
        render(el, Math.round(target * eased));
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
      io.unobserve(el);
    });
  }, { threshold: 0.6 });
  nums.forEach(el => io.observe(el));
}

/* ── Scroll-driven effects: progress, wordmark, engraving, rail ─ */
function initScrollEffects() {
  const progress = document.getElementById('scrollProgress');
  const wordmark = document.getElementById('wordmark');
  const engraving = document.getElementById('engraving');
  const provList = document.getElementById('provList');
  const provBar = document.getElementById('provProgress');

  let ticking = false;
  const update = () => {
    ticking = false;
    const vh = window.innerHeight;

    if (progress) {
      const max = Math.max(document.documentElement.scrollHeight - vh, 1);
      const p = Math.min(Math.max(window.scrollY / max, 0), 1);
      progress.style.transform = 'scaleX(' + p.toFixed(4) + ')';
    }
    if (REDUCED) return; // progress only; parallax and rail stay static

    if (wordmark) {
      const r = wordmark.getBoundingClientRect();
      if (r.bottom > 0 && r.top < vh) {
        wordmark.style.setProperty('--wm-shift', (window.scrollY * 0.08).toFixed(1));
      }
    }
    if (engraving) {
      const r = engraving.getBoundingClientRect();
      if (r.bottom > 0 && r.top < vh) {
        const centre = r.top + r.height / 2 - vh / 2;
        engraving.style.setProperty('--eng-shift', (centre * -0.08).toFixed(1));
      }
    }
    if (provList && provBar) {
      const r = provList.getBoundingClientRect();
      const total = r.height - vh * 0.4;
      const done = Math.min(Math.max((vh * 0.7 - r.top) / total, 0), 1);
      provBar.style.transform = 'scaleY(' + done.toFixed(4) + ')';
    }
  };
  const onScroll = () => {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  update();
}

/* ── Catalogue filter ────────────────────────────────────────── */
function initCatalogueFilter() {
  const chips = document.querySelectorAll('.chip');
  const rows = document.querySelectorAll('.cat-row');
  const empty = document.getElementById('catEmpty');
  if (!chips.length) return;
  chips.forEach(chip => chip.addEventListener('click', () => {
    chips.forEach(c => c.classList.remove('is-on'));
    chip.classList.add('is-on');
    const f = chip.dataset.filter;
    let shown = 0;
    rows.forEach(row => {
      const show = f === 'all' || row.dataset.cat === f;
      row.classList.toggle('is-hidden', !show);
      if (show) shown += 1;
    });
    if (empty) empty.hidden = shown > 0;
  }));
}

/* ── Copy e-mail address ─────────────────────────────────────── */
function initCopyMail() {
  const btn = document.getElementById('copyMail');
  if (!btn) return;
  const original = btn.textContent;
  btn.addEventListener('click', async () => {
    const mail = btn.dataset.mail;
    let ok = false;
    try {
      await navigator.clipboard.writeText(mail);
      ok = true;
    } catch (e) {
      const ta = document.createElement('textarea');
      ta.value = mail;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try { ok = document.execCommand('copy'); } catch (e2) { /* ignore */ }
      ta.remove();
    }
    btn.textContent = ok ? 'Copied ✓' : mail;
    setTimeout(() => { btn.textContent = original; }, 2000);
  });
}

/* ── Custom cursor ring (fine pointers only) ─────────────────── */
function initCursor() {
  const cursor = document.getElementById('cursor');
  if (!cursor) return;
  let x = -100, y = -100, cx = -100, cy = -100, raf = null;
  const loop = () => {
    cx += (x - cx) * 0.22;
    cy += (y - cy) * 0.22;
    cursor.style.transform = 'translate(' + cx.toFixed(1) + 'px,' + cy.toFixed(1) + 'px)';
    if (Math.abs(x - cx) > 0.1 || Math.abs(y - cy) > 0.1) {
      raf = requestAnimationFrame(loop);
    } else {
      raf = null;
    }
  };
  window.addEventListener('mousemove', (e) => {
    x = e.clientX; y = e.clientY;
    if (!document.body.classList.contains('cursor-on')) {
      cx = x; cy = y;
      document.body.classList.add('cursor-on');
    }
    if (!raf) raf = requestAnimationFrame(loop);
  }, { passive: true });
  document.addEventListener('mouseleave', () => document.body.classList.remove('cursor-on'));
  const HOT = 'a, button, .plate, .chip';
  document.addEventListener('mouseover', (e) => {
    cursor.classList.toggle('is-active', Boolean(e.target.closest(HOT)));
  }, { passive: true });
}

/* ── Magnetic pills ──────────────────────────────────────────── */
function initMagnetic() {
  document.querySelectorAll('.magnetic').forEach(el => {
    let raf = null;
    el.addEventListener('mousemove', (e) => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = null;
        const r = el.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        el.style.transform = 'translate(' + (dx * 0.22).toFixed(1) + 'px,' + (dy * 0.3).toFixed(1) + 'px)';
      });
    });
    el.addEventListener('mouseleave', () => {
      if (raf) { cancelAnimationFrame(raf); raf = null; }
      el.style.transform = '';
    });
  });
}
