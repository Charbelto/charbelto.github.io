/* ═══════════════════════════════════════════════════════════════
   CHARBEL TOUMIEH — PORTFOLIO v4
   Vanilla interactions: reveals, counters, scroll-lit statement,
   project carousel, archive filter, search palette. No dependencies.
   ═══════════════════════════════════════════════════════════════ */

document.documentElement.classList.add('js');
// ?flat — static render for visual QA / screenshot tooling
if (new URLSearchParams(location.search).has('flat')) {
  document.documentElement.classList.add('debug-flat');
}

const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const FLAT = document.documentElement.classList.contains('debug-flat');
const MAIL = 'charbeltoumieh1@gmail.com';
const clamp01 = (v) => Math.min(Math.max(v, 0), 1);

document.addEventListener('DOMContentLoaded', () => {
  initMenu();
  initReveals();
  initCounters();
  initScroll();
  initNavSpy();
  initCarousel();
  initArchive();
  initCopyMail();
  initFAQ();
  initModal();
  initStickyMobileCTA();
  initCookieConsent();
  initPalette();
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
});

/* ── Phone menu ──────────────────────────────────────────────── */
function initMenu() {
  const btn = document.getElementById('menuBtn');
  const veil = document.getElementById('veil');
  if (!btn || !veil) return;
  const setOpen = (open) => {
    document.body.classList.toggle('veil-open', open);
    btn.setAttribute('aria-expanded', String(open));
    veil.setAttribute('aria-hidden', String(!open));
    veil.inert = !open;
  };
  veil.inert = true;
  btn.addEventListener('click', () => setOpen(!document.body.classList.contains('veil-open')));
  veil.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setOpen(false)));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && document.body.classList.contains('veil-open')) {
      setOpen(false);
      btn.focus();
    }
  });
  // leaving phone width closes it
  window.matchMedia('(min-width: 861px)').addEventListener('change', (m) => { if (m.matches) setOpen(false); });
}

/* ── Reveal on scroll, softly staggered ──────────────────────── */
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
  }, { rootMargin: '0px 0px -6% 0px', threshold: 0.05 });
  els.forEach(el => io.observe(el));
}

/* ── Number counters ─────────────────────────────────────────── */
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
      const dur = 1500;
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

/* ── One rAF scroll pipeline: nav edge, hero recede, lit statement ── */
function initScroll() {
  const head = document.getElementById('siteHead');
  const heroInner = document.getElementById('heroInner');
  const statement = document.getElementById('statement');
  let words = [];
  let lit = -1;

  if (statement && !REDUCED && !FLAT) {
    const parts = statement.textContent.trim().split(/\s+/);
    statement.textContent = '';
    parts.forEach((word, i) => {
      const s = document.createElement('span');
      s.className = 'w';
      s.textContent = word;
      statement.appendChild(s);
      if (i < parts.length - 1) statement.appendChild(document.createTextNode(' '));
      words.push(s);
    });
    statement.classList.add('is-scrub');
  }

  let ticking = false;
  const update = () => {
    ticking = false;
    const vh = window.innerHeight;
    const y = window.scrollY;
    if (head) head.classList.toggle('is-scrolled', y > 8);
    if (REDUCED || FLAT) return;

    if (heroInner && y < vh * 1.2) {
      heroInner.style.setProperty('--hp', clamp01(y / (vh * 0.75)).toFixed(4));
    }

    // words light up as the statement travels up the screen
    if (words.length) {
      const r = statement.getBoundingClientRect();
      if (r.bottom > -vh && r.top < vh * 2) {
        const p = clamp01((vh * 0.88 - r.top) / (vh * 0.5 + r.height));
        const n = Math.round(p * words.length);
        if (n !== lit) {
          lit = n;
          for (let i = 0; i < words.length; i++) words[i].classList.toggle('on', i < n);
        }
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

/* ── Nav: mark the section in view ───────────────────────────── */
function initNavSpy() {
  const links = [...document.querySelectorAll('#navLinks a')];
  if (!links.length || !('IntersectionObserver' in window)) return;
  const byId = new Map(links.map(a => [a.getAttribute('href').slice(1), a]));
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      links.forEach(a => a.classList.remove('is-active'));
      const a = byId.get(entry.target.id);
      if (a) a.classList.add('is-active');
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  document.querySelectorAll('main > section[id]').forEach(s => io.observe(s));
}

/* ── Project carousel: native scroll + paddles ───────────────── */
function initCarousel() {
  const track = document.getElementById('worksTrack');
  const prev = document.getElementById('worksPrev');
  const next = document.getElementById('worksNext');
  if (!track || !prev || !next) return;
  const step = () => {
    const card = track.querySelector('.work-panel');
    const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    return card ? card.getBoundingClientRect().width + gap : track.clientWidth * 0.8;
  };
  const go = (dir) => track.scrollBy({ left: dir * step(), behavior: REDUCED ? 'auto' : 'smooth' });
  const sync = () => {
    const max = track.scrollWidth - track.clientWidth;
    prev.disabled = track.scrollLeft <= 2;
    next.disabled = track.scrollLeft >= max - 2;
  };
  prev.addEventListener('click', () => go(-1));
  next.addEventListener('click', () => go(1));
  track.addEventListener('scroll', sync, { passive: true });
  window.addEventListener('resize', sync, { passive: true });
  sync();
}

/* ── Archive filter ──────────────────────────────────────────── */
function initArchive() {
  const chips = document.querySelectorAll('.arc-filters .chip');
  const rows = document.querySelectorAll('.arc-row');
  const empty = document.getElementById('arcEmpty');
  if (!chips.length) return;
  chips.forEach(chip => chip.addEventListener('click', () => {
    chips.forEach(c => { c.classList.remove('is-on'); c.setAttribute('aria-pressed', 'false'); });
    chip.classList.add('is-on');
    chip.setAttribute('aria-pressed', 'true');
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
    btn.textContent = ok ? 'Copied ✓' : mail;
    setTimeout(() => { btn.textContent = original; }, 2000);
  });
}

/* ── Questions accordion ─────────────────────────────────────── */
function initFAQ() {
  const items = document.querySelectorAll('.faq-item');
  items.forEach(item => {
    const q = item.querySelector('.faq-question');
    if (!q) return;
    q.addEventListener('click', () => {
      const isOpen = item.classList.contains('is-open');
      items.forEach(i => {
        i.classList.remove('is-open');
        i.querySelector('.faq-question')?.setAttribute('aria-expanded', 'false');
      });
      if (!isOpen) {
        item.classList.add('is-open');
        q.setAttribute('aria-expanded', 'true');
      }
    });
  });
}

/* ── Project breakdown dialog ────────────────────────────────── */
function initModal() {
  const overlay = document.getElementById('caseModal');
  if (!overlay) return;
  const closeBtn = overlay.querySelector('.modal-close');
  const modalTitle = document.getElementById('modalTitle');
  const modalSub = document.getElementById('modalSub');
  const modalBody = document.getElementById('modalBody');

  let lastFocus = null;
  const openModal = (data) => {
    lastFocus = document.activeElement;
    if (modalTitle) modalTitle.textContent = data.title;
    if (modalSub) modalSub.textContent = data.sub;
    if (modalBody) modalBody.innerHTML = data.body;
    overlay.classList.add('is-active');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    if (closeBtn) closeBtn.focus();
  };

  const closeModal = () => {
    if (!overlay.classList.contains('is-active')) return;
    overlay.classList.remove('is-active');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  };

  const CASES = {
    loopguard: {
      title: 'LoopGuard',
      sub: 'Agentic circuit breaker and safety harness · Open source · 2025',
      body: `
        <h4>The challenge</h4>
        <p>Autonomous LLM agents can easily enter infinite execution loops, consuming tokens rapidly and performing unintended actions.</p>
        <h4>Architecture and solution</h4>
        <p>Designed a lightweight Python circuit-breaker decorator that tracks execution graphs, detects state cycles via graph hashing, and halts rogue agents automatically.</p>
        <h4>Key outcomes</h4>
        <p><strong>Zero token runaway.</strong> Halts infinite recursion within 3 state iterations.</p>
        <p><strong>Zero-dependency core.</strong> Drop-in compatibility for LangChain, AutoGen, and custom loopers.</p>
        <p><a class="btn" href="https://github.com/Charbelto/loopguard" target="_blank" rel="noopener noreferrer">Open the repository ↗</a></p>
      `
    }
  };

  document.querySelectorAll('[data-modal]').forEach(trigger => {
    trigger.addEventListener('click', (e) => {
      const data = CASES[trigger.dataset.modal];
      if (!data) return;
      e.preventDefault();
      openModal(data);
    });
  });

  // keep Tab inside the dialog while it is open
  overlay.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;
    const f = overlay.querySelectorAll('a[href], button');
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });
}

/* ── Phone action bar: after the hero, out of the way at contact ── */
function initStickyMobileCTA() {
  const cta = document.getElementById('stickyMobileCTA');
  if (!cta) return;
  const contact = document.getElementById('contact');
  let ticking = false;
  const update = () => {
    ticking = false;
    const past = window.scrollY > 400;
    const atContact = contact ? contact.getBoundingClientRect().top < window.innerHeight * 0.6 : false;
    cta.classList.toggle('is-on', past && !atContact);
  };
  window.addEventListener('scroll', () => {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }, { passive: true });
  update();
}

/* ── Cookie consent (only once a real analytics ID exists) ───── */
const GA_ID = 'G-XXXXXXXXXX'; // replace with real GA4 Measurement ID when available
const GA_READY = !GA_ID.includes('XXXX'); // placeholder — no analytics, so no consent banner

function loadAnalytics() {
  if (window.__gaLoaded || !GA_READY) return;
  window.__gaLoaded = true;
  const s = document.createElement('script');
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(s);
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  gtag('js', new Date());
  gtag('config', GA_ID);
}

function initCookieConsent() {
  const banner = document.getElementById('cookieBanner');
  if (!banner || !GA_READY) return;
  const KEY = 'cookie-consent';
  let consent = null;
  try { consent = localStorage.getItem(KEY); } catch (e) { /* private mode */ }
  if (consent === 'accepted') { loadAnalytics(); return; }
  if (consent === 'declined') return;
  banner.hidden = false;
  const accept = document.getElementById('cookieAccept');
  const decline = document.getElementById('cookieDecline');
  accept?.addEventListener('click', () => {
    try { localStorage.setItem(KEY, 'accepted'); } catch (e) { /* private mode */ }
    banner.hidden = true;
    loadAnalytics();
  });
  decline?.addEventListener('click', () => {
    try { localStorage.setItem(KEY, 'declined'); } catch (e) { /* private mode */ }
    banner.hidden = true;
  });
}

/* ── Search palette (Ctrl/⌘ + K, or "/") ──────────────────────── */
function initPalette() {
  const root = document.getElementById('cmdk');
  const input = document.getElementById('cmdkInput');
  const list = document.getElementById('cmdkList');
  const btn = document.getElementById('cmdkBtn');
  if (!root || !input || !list) return;

  // instant jump, then re-align once late-rendered sections have settled
  const go = (hash) => () => {
    const el = document.querySelector(hash);
    if (!el) return;
    history.replaceState(null, '', hash);
    el.scrollIntoView({ behavior: 'instant', block: 'start' });
    setTimeout(() => el.scrollIntoView({ behavior: 'instant', block: 'start' }), 120);
  };
  const open = (url) => () => window.open(url, '_blank', 'noopener');
  const items = [...document.querySelectorAll('.veil-list .veil-link')].map(a => ({
    label: a.querySelector('span').textContent,
    hint: 'section',
    run: go(a.getAttribute('href'))
  }));
  items.push(
    { label: 'Project archive', hint: 'section', run: go('#archive') },
    { label: 'Copy email address', hint: 'action', run: () => navigator.clipboard && navigator.clipboard.writeText(MAIL) },
    { label: 'Write an email', hint: 'action', run: () => { location.href = 'mailto:' + MAIL; } },
    { label: 'Download résumé', hint: 'action', run: () => {
      const a = document.createElement('a');
      a.href = 'Charbel_Toumieh_Resume.pdf'; a.download = '';
      document.body.appendChild(a); a.click(); a.remove();
    } },
    { label: 'Open GitHub', hint: 'link', run: open('https://github.com/Charbelto') },
    { label: 'Open LinkedIn', hint: 'link', run: open('https://www.linkedin.com/in/charbeltoumieh/') },
    { label: 'Back to top', hint: 'section', run: () => window.scrollTo({ top: 0 }) }
  );

  let shown = [], sel = 0, lastFocus = null;
  const render = () => {
    const q = input.value.trim().toLowerCase();
    shown = items.filter(it => !q || it.label.toLowerCase().includes(q) || it.hint.includes(q));
    sel = Math.min(sel, Math.max(shown.length - 1, 0));
    list.textContent = '';
    if (!shown.length) {
      const li = document.createElement('li');
      li.className = 'cmdk-empty';
      li.textContent = 'No results';
      list.appendChild(li);
      return;
    }
    shown.forEach((it, i) => {
      const li = document.createElement('li');
      li.setAttribute('role', 'option');
      li.setAttribute('aria-selected', String(i === sel));
      li.dataset.i = i;
      const name = document.createElement('span');
      name.textContent = it.label;
      const hint = document.createElement('small');
      hint.textContent = it.hint;
      li.append(name, hint);
      list.appendChild(li);
    });
    const cur = list.querySelector('[aria-selected="true"]');
    if (cur) cur.scrollIntoView({ block: 'nearest' });
  };
  const isOpen = () => !root.hidden;
  const show = () => {
    if (isOpen()) return;
    lastFocus = document.activeElement;
    root.hidden = false;
    input.value = '';
    sel = 0;
    render();
    input.focus();
  };
  const hide = (restore) => {
    if (!isOpen()) return;
    root.hidden = true;
    if (restore && lastFocus && lastFocus.focus) lastFocus.focus();
  };
  const run = (i) => {
    const it = shown[i];
    if (!it) return;
    hide(false);
    it.run();
  };

  if (btn) btn.addEventListener('click', show);
  input.addEventListener('input', () => { sel = 0; render(); });
  root.addEventListener('click', (e) => {
    const li = e.target.closest('li[data-i]');
    if (li) run(Number(li.dataset.i));
    else if (e.target === root) hide(true);
  });
  list.addEventListener('pointermove', (e) => {
    const li = e.target.closest('li[data-i]');
    if (li && Number(li.dataset.i) !== sel) { sel = Number(li.dataset.i); render(); }
  });
  document.addEventListener('keydown', (e) => {
    const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) || e.target.isContentEditable;
    if ((e.key === 'k' || e.key === 'K') && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      isOpen() ? hide(true) : show();
      return;
    }
    if (e.key === '/' && !typing && !isOpen()) { e.preventDefault(); show(); return; }
    if (!isOpen()) return;
    if (e.key === 'Escape') { e.stopPropagation(); hide(true); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); sel = (sel + 1) % Math.max(shown.length, 1); render(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); sel = (sel - 1 + shown.length) % Math.max(shown.length, 1); render(); }
    else if (e.key === 'Enter') { e.preventDefault(); run(sel); }
    else if (e.key === 'Tab') { e.preventDefault(); }
  }, true);
}
