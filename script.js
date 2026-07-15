/* ═══════════════════════════════════════════════════════════════
   CHARBEL TOUMIEH — PORTFOLIO v3 · charbel.os
   Vanilla interaction engine. One rAF scroll pipeline, IO reveals,
   canvas particle net, pinned horizontal gallery, scroll zoom,
   3D tilt, spotlight, exploding core. No dependencies.
   ═══════════════════════════════════════════════════════════════ */

document.documentElement.classList.add('js');
// ?flat — static render for visual QA / screenshot tooling
if (new URLSearchParams(location.search).has('flat')) {
  document.documentElement.classList.add('debug-flat');
}

const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const FINE = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const FLAT = document.documentElement.classList.contains('debug-flat');

document.addEventListener('DOMContentLoaded', () => {
  splitChars();
  // cards that "open" with a wipe instead of the default rise
  document.querySelectorAll('.xp-body, .profile-card, .edu-card, .case-terminal')
    .forEach(el => el.setAttribute('data-reveal', 'wipe'));
  initBoot();
  initClock();
  initVeil();
  initReveals();
  initCounters();
  initWorksPin();
  initScrollPipeline();
  initCore();
  initArchive();
  initCopyMail();
  if (FINE && !REDUCED && !FLAT) {
    initNet();
    initCursor();
    initMagnetic();
    initTilt();
    initSpot();
    initArchiveHover();
  }
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
});
/* ── Split headings into chars for immersive reveals ─────────── */
function splitChars() {
  document.querySelectorAll('[data-split]').forEach((el, elIndex) => {
    const text = el.textContent;
    el.textContent = '';
    const cd = el.classList.contains('hn-line') ? (0.25 + elIndex * 0.18) : 0;
    [...text].forEach((chr, i) => {
      const s = document.createElement('span');
      s.className = 'ch';
      s.textContent = chr;
      s.style.setProperty('--ci', i);
      if (cd) s.style.setProperty('--cd', cd + 's');
      el.appendChild(s);
    });
  });
}

/* ── Boot sequence (vertical column exit) ────────────────────── */
function initBoot() {
  const boot = document.getElementById('boot');
  if (!boot) return;
  const seen = sessionStorage.getItem('ct-boot');
  if (seen || REDUCED || FLAT) {
    document.body.classList.add('boot-skip', 'is-loaded');
    boot.remove();
    return;
  }
  try { sessionStorage.setItem('ct-boot', '1'); } catch (e) { /* private mode */ }

  const log = document.getElementById('bootLog');
  const bar = document.getElementById('bootBar');
  const lines = [
    '> loading vector index ... <b>OK</b>',
    '> spawning agents ... <b>24 tools connected</b>',
    '> attaching eval harness ... <b>OK</b>',
    '> render portfolio'
  ];
  let i = 0;
  const step = () => {
    if (i < lines.length) {
      log.innerHTML += '\n' + lines[i];
      i += 1;
      bar.style.transform = 'scaleX(' + (i / lines.length) + ')';
      setTimeout(step, 150);
    } else {
      requestAnimationFrame(() => document.body.classList.add('is-loaded'));
      setTimeout(() => boot.isConnected && boot.remove(), 1600);
    }
  };
  setTimeout(step, 220);
  // Hard cap — never hold the page hostage.
  setTimeout(() => {
    if (!document.body.classList.contains('is-loaded')) {
      document.body.classList.add('is-loaded');
      setTimeout(() => boot.isConnected && boot.remove(), 1600);
    }
  }, 2200);
}

/* ── Header clock (UK time) ──────────────────────────────────── */
function initClock() {
  const el = document.getElementById('headClock');
  if (!el) return;
  const fmt = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit', minute: '2-digit', timeZone: 'Europe/London'
  });
  const tick = () => { el.textContent = 'UK ' + fmt.format(new Date()); };
  tick();
  setInterval(tick, 30000);
}

/* ── Menu veil ───────────────────────────────────────────────── */
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

/* ── Reveal-on-scroll with soft stagger ──────────────────────── */
function initReveals() {
  const els = document.querySelectorAll('[data-reveal]');
  if (!('IntersectionObserver' in window) || REDUCED || FLAT) {
    els.forEach(el => el.classList.add('is-in'));
    return;
  }
  let batch = 0;
  let batchReset = null;
  const io = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.style.setProperty('--d', (batch * 0.07) + 's');
      batch += 1;
      entry.target.classList.add('is-in');
      io.unobserve(entry.target);
    }
    clearTimeout(batchReset);
    batchReset = setTimeout(() => { batch = 0; }, 220);
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
  els.forEach(el => io.observe(el));
}

/* ── HUD counters ────────────────────────────────────────────── */
function initCounters() {
  const nums = document.querySelectorAll('.stat-num');
  if (!nums.length) return;
  const render = (el, v) =>
    el.textContent = (el.dataset.prefix || '') + v + (el.dataset.suffix || '');
  if (REDUCED || FLAT || !('IntersectionObserver' in window)) {
    nums.forEach(el => render(el, el.dataset.count));
    return;
  }
  nums.forEach(el => render(el, 0)); // HTML holds final values for no-JS
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = parseInt(el.dataset.count, 10);
      const t0 = performance.now();
      const dur = 1300;
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

/* ── Pinned horizontal gallery sizing ────────────────────────── */
const worksState = { section: null, track: null, dist: 0, active: false };
function initWorksPin() {
  worksState.section = document.getElementById('works');
  worksState.track = document.getElementById('worksTrack');
  if (!worksState.section || !worksState.track) return;
  const media = window.matchMedia('(min-width: 901px)');
  const measure = () => {
    const on = media.matches && !REDUCED && !FLAT;
    worksState.active = on;
    if (!on) {
      worksState.section.style.height = '';
      worksState.track.style.transform = '';
      return;
    }
    worksState.track.style.transform = '';
    worksState.dist = Math.max(worksState.track.scrollWidth - window.innerWidth, 0);
    worksState.section.style.height = (worksState.dist + window.innerHeight * 1.35) + 'px';
  };
  measure();
  window.addEventListener('resize', measure, { passive: true });
  media.addEventListener ? media.addEventListener('change', measure) : media.addListener(measure);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
}

/* ── One rAF scroll pipeline ─────────────────────────────────── */
function initScrollPipeline() {
  const progress = document.getElementById('scrollProgress');
  const heroInner = document.getElementById('heroInner');
  const streamA = document.getElementById('streamA');
  const streamB = document.getElementById('streamB');
  const casefile = document.getElementById('casefile');
  const xpList = document.getElementById('xpList');
  const xpBar = document.getElementById('xpProgress');
  const ghosts = [...document.querySelectorAll('.xp-ghost')];
  const worksCount = document.getElementById('worksCount');
  const panels = worksState.track ? worksState.track.children.length : 0;
  const clamp01 = (v) => Math.min(Math.max(v, 0), 1);

  let ticking = false;
  const update = () => {
    ticking = false;
    const vh = window.innerHeight;
    const y = window.scrollY;

    if (progress) {
      const max = Math.max(document.documentElement.scrollHeight - vh, 1);
      progress.style.transform = 'scaleX(' + clamp01(y / max).toFixed(4) + ')';
    }
    if (REDUCED || FLAT) return;

    // Layer transformation: hero sinks + fades as content slides over
    if (heroInner) {
      heroInner.style.setProperty('--hp', clamp01(y / (vh * 0.9)).toFixed(4));
    }

    // Counter-parallax capability streams
    if (streamA) {
      const r = streamA.getBoundingClientRect();
      if (r.bottom > -40 && r.top < vh + 40) {
        const off = (r.top + r.height / 2 - vh / 2) * 0.16;
        streamA.style.setProperty('--sx', off.toFixed(1) + 'px');
        if (streamB) streamB.style.setProperty('--sx', (-off).toFixed(1) + 'px');
      }
    }

    // Immersive zoom: GREAT terminal
    if (casefile) {
      const r = casefile.getBoundingClientRect();
      if (r.bottom > 0 && r.top < vh) {
        const p = clamp01(-r.top / Math.max(r.height - vh, 1));
        casefile.style.setProperty('--cp', p.toFixed(4));
      }
    }

    // Experience rail + ghost-number parallax
    if (xpList && xpBar) {
      const r = xpList.getBoundingClientRect();
      if (r.bottom > 0 && r.top < vh) {
        const done = clamp01((vh * 0.7 - r.top) / Math.max(r.height - vh * 0.4, 1));
        xpBar.style.transform = 'scaleY(' + done.toFixed(4) + ')';
      }
    }
    for (const g of ghosts) {
      const r = g.parentElement.getBoundingClientRect();
      if (r.bottom > 0 && r.top < vh) {
        const depth = parseFloat(g.dataset.depth || '0.12');
        g.style.setProperty('--gy', ((r.top + r.height / 2 - vh / 2) * -depth).toFixed(1));
      }
    }

    // Horizontal gallery drive
    if (worksState.active && worksState.section) {
      const r = worksState.section.getBoundingClientRect();
      const p = clamp01(-r.top / Math.max(r.height - vh, 1));
      worksState.track.style.transform = 'translateX(' + (-p * worksState.dist).toFixed(1) + 'px)';
      if (worksCount && panels) {
        const idx = Math.min(panels, Math.max(1, Math.round(p * (panels - 1)) + 1));
        worksCount.textContent = '// scroll ⟷ drive · 0' + idx + ' / 0' + panels;
      }
    }
  };
  const onScroll = () => {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  update();
}

/* ── Hero particle network (explodes away from the cursor) ───── */
function initNet() {
  const canvas = document.getElementById('heroNet');
  const hero = canvas && canvas.parentElement;
  if (!canvas || !hero) return;
  const ctx = canvas.getContext('2d');
  const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
  let w = 0, h = 0, nodes = [], raf = null, inView = true;
  const mouse = { x: -9999, y: -9999 };

  const size = () => {
    const r = hero.getBoundingClientRect();
    w = r.width; h = r.height;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = Math.min(88, Math.round((w * h) / 16000));
    nodes = Array.from({ length: n }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.5, vy: (Math.random() - 0.5) * 0.5,
      r: 1 + Math.random() * 1.4,
      c: Math.random() < 0.22 ? '86,225,233' : '124,108,255'
    }));
  };

  const frame = () => {
    raf = null;
    ctx.clearRect(0, 0, w, h);
    const LINK = 130;
    for (const p of nodes) {
      // cursor repulsion — the "explode away" field
      const dx = p.x - mouse.x, dy = p.y - mouse.y;
      const d2 = dx * dx + dy * dy;
      if (d2 < 22500 && d2 > 1) {
        const d = Math.sqrt(d2);
        const f = (150 - d) / 150 * 0.9;
        p.vx += (dx / d) * f;
        p.vy += (dy / d) * f;
      }
      p.vx *= 0.96; p.vy *= 0.96;
      const sp = Math.hypot(p.vx, p.vy);
      if (sp < 0.12) { p.vx += (Math.random() - 0.5) * 0.06; p.vy += (Math.random() - 0.5) * 0.06; }
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > w) p.vx *= -1;
      if (p.y < 0 || p.y > h) p.vy *= -1;
      p.x = Math.min(Math.max(p.x, 0), w);
      p.y = Math.min(Math.max(p.y, 0), h);
    }
    ctx.lineWidth = 1;
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i], b = nodes[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < LINK * LINK) {
          const alpha = (1 - Math.sqrt(d2) / LINK) * 0.32;
          ctx.strokeStyle = 'rgba(124,108,255,' + alpha.toFixed(3) + ')';
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      }
    }
    for (const p of nodes) {
      ctx.fillStyle = 'rgba(' + p.c + ',0.85)';
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.2832); ctx.fill();
    }
    if (inView && !document.hidden) raf = requestAnimationFrame(frame);
  };
  const kick = () => { if (!raf && inView && !document.hidden) raf = requestAnimationFrame(frame); };

  size();
  kick();
  window.addEventListener('resize', () => { size(); kick(); }, { passive: true });
  hero.addEventListener('pointermove', (e) => {
    const r = canvas.getBoundingClientRect();
    mouse.x = e.clientX - r.left;
    mouse.y = e.clientY - r.top;
  }, { passive: true });
  hero.addEventListener('pointerleave', () => { mouse.x = -9999; mouse.y = -9999; }, { passive: true });
  new IntersectionObserver((entries) => {
    inView = entries[0].isIntersecting;
    kick();
  }).observe(hero);
  document.addEventListener('visibilitychange', kick);
}

/* ── Custom cursor: dot + ring + context tag ─────────────────── */
function initCursor() {
  const cursor = document.getElementById('cursor');
  const tag = document.getElementById('cursorTag');
  if (!cursor) return;
  let x = -100, y = -100, cx = -100, cy = -100, raf = null;
  const loop = () => {
    cx += (x - cx) * 0.24;
    cy += (y - cy) * 0.24;
    cursor.style.transform = 'translate(' + cx.toFixed(1) + 'px,' + cy.toFixed(1) + 'px)';
    raf = (Math.abs(x - cx) > 0.1 || Math.abs(y - cy) > 0.1) ? requestAnimationFrame(loop) : null;
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
  document.addEventListener('mouseover', (e) => {
    const view = e.target.closest('[data-cursor="view"]');
    const link = e.target.closest('a, button');
    cursor.classList.toggle('is-view', Boolean(view));
    cursor.classList.toggle('is-link', Boolean(link) && !view);
    if (view && tag) tag.textContent = 'view';
  }, { passive: true });
}

/* ── Magnetic buttons ────────────────────────────────────────── */
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

/* ── 3D tilt cards ───────────────────────────────────────────── */
function initTilt() {
  document.querySelectorAll('.tilt').forEach(el => {
    let raf = null;
    el.addEventListener('pointermove', (e) => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = null;
        const r = el.getBoundingClientRect();
        const nx = (e.clientX - r.left) / r.width;
        const ny = (e.clientY - r.top) / r.height;
        el.style.setProperty('--rx', ((0.5 - ny) * 7).toFixed(2) + 'deg');
        el.style.setProperty('--ry', ((nx - 0.5) * 9).toFixed(2) + 'deg');
      });
    });
    el.addEventListener('pointerleave', () => {
      if (raf) { cancelAnimationFrame(raf); raf = null; }
      el.style.setProperty('--rx', '0deg');
      el.style.setProperty('--ry', '0deg');
    });
  });
}

/* ── Spotlight hover (light follows the pointer) ─────────────── */
function initSpot() {
  document.querySelectorAll('.spot').forEach(el => {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100).toFixed(2) + '%');
      el.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100).toFixed(2) + '%');
    }, { passive: true });
  });
}

/* ── Exploding capability core ───────────────────────────────── */
function initCore() {
  const core = document.getElementById('core');
  const hint = document.getElementById('coreHint');
  if (!core) return;
  const set = (on) => {
    core.classList.toggle('is-x', on);
    if (hint) hint.textContent = on ? 'capability map — decomposed' : 'hover / tap the core to decompose';
  };
  if (FINE) {
    core.addEventListener('pointerenter', () => set(true));
    core.addEventListener('pointerleave', () => set(false));
  } else if ('IntersectionObserver' in window && !FLAT) {
    // touch devices: auto-decompose when the core is in view
    new IntersectionObserver((entries) => {
      entries.forEach(e => set(e.intersectionRatio > 0.55));
    }, { threshold: [0, 0.55, 1] }).observe(core);
  }
  core.addEventListener('click', () => set(!core.classList.contains('is-x')));
  core.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      set(!core.classList.contains('is-x'));
    }
  });
}

/* ── Archive: filters + floating hover chip ──────────────────── */
function initArchive() {
  const chips = document.querySelectorAll('.arc-filters .chip');
  const rows = document.querySelectorAll('.arc-row');
  const empty = document.getElementById('arcEmpty');
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
function initArchiveHover() {
  const chipEl = document.getElementById('arcHover');
  const list = document.getElementById('arcList');
  if (!chipEl || !list) return;
  list.addEventListener('pointerover', (e) => {
    const a = e.target.closest('a[data-info]');
    if (a) {
      chipEl.textContent = a.dataset.info;
      chipEl.classList.add('is-on');
    }
  });
  list.addEventListener('pointermove', (e) => {
    chipEl.style.left = e.clientX + 'px';
    chipEl.style.top = e.clientY + 'px';
  }, { passive: true });
  list.addEventListener('pointerleave', () => chipEl.classList.remove('is-on'));
}

/* ── Copy e-mail ─────────────────────────────────────────────── */
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
    btn.textContent = ok ? 'copied ✓' : mail;
    setTimeout(() => { btn.textContent = original; }, 2000);
  });
}
