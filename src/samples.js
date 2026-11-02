import { DEMOS as OLD, h } from './lab.js';
import * as A from './samples/agents.js';

/**
 * Inline interactive samples. Each listed chapter gets a window, placed opposite its text card, visible while you scroll through
 * the chapter: no button to find. The window and the chapter's 3D object trade places (a switch in the window's header):
 * in "sample" view the object steps aside, in "object" view the window collapses to a slim tab. Everything is simulated and says so.
 */
const REG = {
  profile: { run: A.profileDemo, title: 'From notebook to production', hint: 'Tap a stage, or press “Ship it”' },
  meet: { run: A.pipDemo, title: 'Ask Pip', hint: 'Tap a task and watch Pip work', pip: true },
  cap1: { run: A.orchestraDemo, title: 'Agents talking it through', hint: 'Tap a task' },
  cap2: { run: A.retrievalDemo, title: 'Retrieval with and without a re-ranker', hint: 'Switch the re-ranker on' },
  cap3: { run: A.toolsDemo, title: 'A model calling tools over MCP', hint: 'Tap a tool' },
  cap4: { run: A.evaluationDemo, title: 'A judge scoring answers', hint: 'Tap an answer' },
  cap5: { run: A.productionDemo, title: 'Failures that never reach the user', hint: 'Inject a failure' },
  great1: { run: A.greatDemo, title: 'GREAT scoring a call', hint: 'Pick a call' },
  great2: { run: A.greatArchDemo, title: 'The GREAT pipeline, stage by stage', hint: 'Press “Run the pipeline”' },
  great3: { run: A.greatOutcomeDemo, title: 'What the results mean in hours', hint: 'Tap a result, move a slider' },
  w1: { run: OLD.loopguard, title: 'LoopGuard catching a loop', hint: 'Press “Next step”' },
  w2: { run: OLD.derm, title: 'DermSense, step by step', hint: 'Open “4 Predict”, then run it' },
  w3: { run: OLD.oulad, title: 'What the OULAD model found', hint: 'Flip through the figures' },
  w4: { run: A.microDemo, title: 'Load balancing, live', hint: 'Send requests, then toggle a replica' },
  w5: { run: OLD.cell, title: 'Signal on the move', hint: 'Drag the slider' },
  w6: { run: OLD.market, title: 'Explore the baskets', hint: 'Click an item' },
};

export function initSamples() {
  const root = document.documentElement;
  const wanted = new URLSearchParams(location.search).get('view') === 'object' ? 'object' : 'sample';
  // chapters whose 3D object steps aside while the sample is showing (Pip is a character, not an object: he stays)
  window.__sampleKf = new Set(Object.entries(REG).filter(([, s]) => !s.pip).map(([k]) => k));
  root.dataset.view = wanted;

  const setView = (v) => {
    root.dataset.view = v;
    document.querySelectorAll('.sample-toggle').forEach((b) => { b.textContent = v === 'sample' ? 'See the 3D object' : 'Show the sample'; b.setAttribute('aria-pressed', String(v === 'object')); });
    window.dispatchEvent(new Event('viewchange'));
  };

  for (const [kf, spec] of Object.entries(REG)) {
    const chapter = document.querySelector(`[data-kf="${kf}"]`); const panel = chapter?.querySelector('.panel');
    if (!chapter || !panel) continue;
    const side = panel.classList.contains('panel--right') ? 'left' : 'right';
    const state = { vis: false, mounted: false, touched: false };
    const hint = h('p', { class: 'sample-hint' }, h('i', { 'aria-hidden': 'true' }, '👆'), ` ${spec.hint}`);
    const body = h('div', { class: 'sample-body' });
    const toggle = spec.pip ? null : h('button', { class: 'sample-toggle', type: 'button', 'aria-pressed': String(wanted === 'object'), on: { click: () => setView(root.dataset.view === 'sample' ? 'object' : 'sample') } }, wanted === 'sample' ? 'See the 3D object' : 'Show the sample');
    const win = h('aside', { class: `sample sample--${side}${spec.pip ? ' sample--pip' : ''}`, 'data-demo': kf, 'aria-label': `Interactive sample: ${spec.title}` },
      h('div', { class: 'sample-head' }, h('span', { class: 'sample-badge' }, h('i', { 'aria-hidden': 'true' }), 'Interactive sample', h('small', {}, ' · simulated data')), toggle),
      h('h3', { class: 'sample-title' }, spec.title), body, hint);
    chapter.append(win);

    const ctx = {
      active: () => state.vis && (chapter.classList.contains('is-active') || !chapter.closest('.stepper')),
      touched: () => { if (state.touched) return; state.touched = true; hint.hidden = true; win.classList.add('is-touched'); },
    };
    const mount = async () => { state.mounted = true; try { await spec.run(body, ctx); } catch (e) { console.warn('[sample]', kf, e); body.append(h('p', {}, 'This sample could not load.')); } };
    new IntersectionObserver((entries) => { for (const e of entries) { state.vis = e.isIntersecting; if (e.isIntersecting && !state.mounted) mount(); } }, { rootMargin: '300px' }).observe(win);

    // on phones the sample fills the band above the card: it needs the card's height
    new ResizeObserver(() => chapter.style.setProperty('--ph', `${panel.offsetHeight}px`)).observe(panel);
  }
  setView(wanted);
}
