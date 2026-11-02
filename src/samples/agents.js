import { h, tabs, rng } from '../lab.js';

/**
 * Interactive samples for the capability chapters. Every one of them is SIMULATED: scripted, pre-saved data, clearly labelled on
 * the page. They show how the thing works; they are not live models and make no network calls.
 * Each demo is (root, ctx) => dispose?  where ctx.active() says whether it is on screen and ctx.touched() marks a first interaction.
 */
const NS = 'http://www.w3.org/2000/svg';
const sv = (tag, attrs = {}, ...kids) => { const e = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v); kids.flat().forEach((k) => k != null && e.append(k.nodeType ? k : document.createTextNode(k))); return e; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const life = () => { const t = { dead: false, run: 0 }; t.next = () => ++t.run; t.ok = (id) => !t.dead && id === t.run; return t; };
const type = async (el, text, life_, id, speed = 14) => { el.textContent = ''; for (const ch of text) { if (!life_.ok(id)) return false; el.textContent += ch; await sleep(speed); } return true; };

/* ───────── profile: from notebook to production ───────── */
export function profileDemo(root, ctx) {
  const L = life(); let at = 0;
  const STAGES = [
    ['Notebook', 'It works on my machine.', ['In [14]: model.score(X_test)', '0.91   # looks great', 'In [15]: # now what?']],
    ['Evals', 'A test suite for behaviour, not just code.', ['$ pytest evals/', '128 passed, 0 failed', 'regression gate: ok']],
    ['Guardrails', 'Loops, bad output and unsafe input are caught.', ['loopguard ........ ok', 'schema check ..... ok', 'pii filter ....... ok']],
    ['Deploy', 'Containers, health checks, rollbacks.', ['$ docker compose up -d', 'api ......... healthy', 'worker ...... healthy']],
    ['Monitor', 'You find out before the user does.', ['p95 latency   1.4 s', 'error rate    0.3 %', 'alerts        none']],
  ];
  const track = h('ol', { class: 'sx-track' }, STAGES.map(([n], i) => h('li', {}, h('button', { type: 'button', 'data-i': i, class: 'sx-chip', on: { click: () => { show(i); ctx.touched(); } } }, `${i + 1} ${n}`))));
  const title = h('h4', { class: 'sx-title' }); const sub = h('p', { class: 'sx-sub' }); const term = h('pre', { class: 'sx-term' });
  const bar = h('div', { class: 'sx-progress' }, h('i', {}));
  const show = (i) => { at = i; track.querySelectorAll('.sx-chip').forEach((b, k) => { b.classList.toggle('is-on', k === i); b.classList.toggle('is-done', k < i); }); title.textContent = STAGES[i][0]; sub.textContent = STAGES[i][1]; term.textContent = STAGES[i][2].join('\n'); bar.firstChild.style.width = `${((i + 1) / STAGES.length) * 100}%`; };
  const ship = h('button', { class: 'btn btn--solid', type: 'button', on: { click: async () => { ctx.touched(); const id = L.next(); for (let i = 0; i < STAGES.length; i++) { if (!L.ok(id)) return; show(i); await sleep(900); } } } }, 'Ship it');
  root.append(track, h('div', { class: 'sx-card' }, title, sub, term), bar, h('div', { class: 'sx-row' }, ship, h('span', { class: 'sx-fine' }, 'Tap a stage, or ship the whole thing.')));
  show(0);
  return () => { L.dead = true; };
}

/* ───────── Pip: a very small agent ───────── */
export function pipDemo(root, ctx) {
  const L = life();
  const TASKS = {
    day: ['Summarise my day', [['think', 'I need today’s calendar, then I can summarise.'], ['tool', 'calendar.list(date="today")'], ['result', '3 meetings, 2 free hours (14:00 to 16:00)'], ['answer', 'Busy morning, three meetings. Your best focus block is 14:00 to 16:00.']]],
    flight: ['Find the cheapest flight', [['think', 'Compare fares, then pick the cheapest that fits the dates.'], ['tool', 'flights.search(BEY→CDG, 12 Nov)'], ['result', '4 fares: 212, 236, 249, 301 EUR'], ['tool', 'flights.filter(max_stops=1)'], ['result', '212 EUR, 1 stop, arrives 18:40'], ['answer', 'Cheapest: 212 EUR with one stop, landing at 18:40.']]],
    build: ['Why is the build red?', [['think', 'Read the failing job log first.'], ['tool', 'ci.logs(job="test", tail=20)'], ['result', 'ImportError: no module named "yaml"'], ['tool', 'repo.search("requirements.txt")'], ['result', 'pyyaml missing from requirements'], ['answer', 'A dependency (pyyaml) is missing from requirements.txt. Add it and re-run.']]],
  };
  const log = h('ol', { class: 'sx-log', 'aria-live': 'polite' });
  const status = h('p', { class: 'sx-sub' }, 'Pick a task and watch Pip work: think, call a tool, read the result, answer.');
  const run = async (k) => {
    const id = L.next(); ctx.touched(); log.replaceChildren(); status.textContent = `Pip is working on: ${TASKS[k][0]}`;
    for (const [kind, text] of TASKS[k][1]) {
      if (!L.ok(id)) return; const li = h('li', { class: `sx-line is-${kind}` }, h('b', {}, kind), h('span', {})); log.append(li); log.scrollTop = log.scrollHeight;
      if (!(await type(li.lastChild, text, L, id, 11))) return; await sleep(kind === 'tool' ? 520 : 260);
    }
    if (L.ok(id)) { status.textContent = 'Done. Pip waves.'; window.__world?.wave?.(); }
  };
  const chips = tabs(Object.entries(TASKS).map(([k, v]) => [k, v[0]]), (k) => run(k), undefined, false);
  chips.querySelectorAll('.lab-tab').forEach((b) => b.setAttribute('aria-selected', 'false'));
  root.append(chips, status, log, h('p', { class: 'sx-fine' }, 'Scripted, simulated agent steps. Pip is the character; the task runs are pre-saved.'));
  return () => { L.dead = true; };
}

/* ───────── multi-agent orchestration ───────── */
export function orchestraDemo(root, ctx) {
  const L = life();
  const N = { planner: [180, 34, 'Planner'], research: [56, 118, 'Researcher'], coder: [180, 118, 'Builder'], critic: [304, 118, 'Critic'], writer: [180, 206, 'Writer'] };
  const TASKS = {
    trip: ['Plan a trip', [['planner', 'research', 'Find flights Beirut to Paris, under 400 EUR', 1], ['research', 'planner', '3 options found'], ['planner', 'coder', 'Build the itinerary table'], ['coder', 'critic', 'Draft v1'], ['critic', 'coder', 'Day 2 clashes with check-out. Fix it.'], ['coder', 'critic', 'Draft v2'], ['critic', 'writer', 'Approved'], ['writer', 'planner', 'Final answer ready']]],
    pr: ['Review a pull request', [['planner', 'research', 'Fetch the diff and the related issue', 1], ['research', 'planner', '12 files changed, issue #482'], ['planner', 'critic', 'Review for bugs and style'], ['critic', 'coder', 'Missing null check in parser.py'], ['coder', 'critic', 'Patched, tests added', 1], ['critic', 'writer', 'Approved with one comment'], ['writer', 'planner', 'Review summary posted']]],
    ticket: ['Resolve a ticket', [['planner', 'research', 'Look up the customer and order', 1], ['research', 'planner', 'Order A-77 delayed, carrier issue'], ['planner', 'coder', 'Prepare a refund and a new ETA', 1], ['coder', 'critic', 'Refund 12 EUR + ETA Friday'], ['critic', 'writer', 'Policy ok, tone check ok'], ['writer', 'planner', 'Reply sent to the customer']]],
  };
  const svg = sv('svg', { viewBox: '0 0 360 240', class: 'sx-svg sx-svg--wide', role: 'img', 'aria-label': 'Five agents passing messages' });
  Object.entries(N).forEach(([, a]) => Object.entries(N).forEach(([, b]) => { if (a !== b && a[1] <= b[1]) svg.append(sv('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1], stroke: 'currentColor', 'stroke-opacity': 0.12, 'stroke-width': 1 })); }));
  const nodeEls = {};
  Object.entries(N).forEach(([k, [x, y, name]]) => { const g = sv('g', { class: 'sx-node' }, sv('circle', { cx: x, cy: y, r: 27 }), sv('text', { x, y: y + 4, 'text-anchor': 'middle' }, name)); nodeEls[k] = g; svg.append(g); });
  const dot = sv('circle', { r: 6, fill: '#ff5a3c', opacity: 0 }); svg.append(dot);
  const log = h('ol', { class: 'sx-log', 'aria-live': 'polite' }); const stat = h('p', { class: 'sx-fine' }, 'Pick a task. The agents will talk it through.');
  const fly = (a, b) => new Promise((res) => { const t0 = performance.now(); const f = (t) => { const p = Math.min(1, (t - t0) / 520); dot.setAttribute('cx', N[a][0] + (N[b][0] - N[a][0]) * p); dot.setAttribute('cy', N[a][1] + (N[b][1] - N[a][1]) * p); if (p < 1 && !L.dead) requestAnimationFrame(f); else res(); }; dot.setAttribute('opacity', 1); requestAnimationFrame(f); });
  const run = async (k) => {
    const id = L.next(); ctx.touched(); log.replaceChildren(); let tools = 0;
    for (const [a, b, text, tool] of TASKS[k][1]) {
      if (!L.ok(id)) return; Object.values(nodeEls).forEach((g) => g.classList.remove('is-on')); nodeEls[a].classList.add('is-on'); await fly(a, b); if (!L.ok(id)) return;
      nodeEls[b].classList.add('is-on'); if (tool) tools++;
      log.append(h('li', { class: 'sx-line' }, h('b', {}, `${N[a][2]} → ${N[b][2]}`), h('span', {}, text), tool ? h('em', {}, 'tool call') : null)); log.scrollTop = log.scrollHeight; await sleep(340);
    }
    dot.setAttribute('opacity', 0); stat.textContent = `Done: ${TASKS[k][1].length} messages, ${tools} tool calls, one critic loop.`;
  };
  const chips = tabs(Object.entries(TASKS).map(([k, v]) => [k, v[0]]), (k) => run(k), undefined, false);
  root.append(chips, h('div', { class: 'sx-split' }, svg, log), stat, h('p', { class: 'sx-fine' }, 'Scripted, simulated conversations between agents.'));
  return () => { L.dead = true; };
}

/* ───────── retrieval (RAG) ───────── */
export function retrievalDemo(root, ctx) {
  const Q = {
    refund: ['What is the refund window?', [['policy.pdf §4', 'Refunds are accepted within 30 days of delivery.', 1, 0.81, 0.93], ['faq.md', 'Shipping usually takes three to five working days.', 0, 0.78, 0.31], ['policy.pdf §2', 'Digital goods cannot be refunded once downloaded.', 1, 0.74, 0.88], ['blog/returns-tips', 'Ten tips for packing a return neatly.', 0, 0.72, 0.22], ['terms.md', 'We may update these terms from time to time.', 0, 0.69, 0.15], ['policy.pdf §5', 'To start a refund, open the order page and press Return.', 1, 0.58, 0.84]]],
    warranty: ['How long is the warranty?', [['warranty.md', 'All devices carry a 24 month warranty.', 1, 0.8, 0.95], ['press/2024', 'Our new lineup was announced in March.', 0, 0.77, 0.2], ['warranty.md §3', 'Batteries are covered for 12 months.', 1, 0.73, 0.9], ['careers.md', 'We are hiring in three cities.', 0, 0.7, 0.1], ['faq.md', 'Warranty claims need the original receipt.', 1, 0.6, 0.86], ['about.md', 'Founded in 2011 by two engineers.', 0, 0.66, 0.12]]],
  };
  let q = 'refund'; let rerank = false;
  const list = h('ol', { class: 'sx-chunks' }); const stats = h('p', { class: 'sx-sub', 'aria-live': 'polite' }); const answer = h('p', { class: 'sx-answer' });
  const render = () => {
    const rows = Q[q][1].map((c, i) => ({ c, i, s: rerank ? c[4] : c[3] })).sort((a, b) => b.s - a.s);
    list.replaceChildren(...rows.map((r, rank) => h('li', { class: `sx-chunk${rank < 3 ? ' is-top' : ''}${r.c[2] ? ' is-rel' : ''}` }, h('b', {}, `#${rank + 1}`), h('span', {}, h('i', {}, r.c[0]), h('small', {}, r.c[1])), h('em', { style: `--w:${Math.round(r.s * 100)}%` }), h('u', {}, r.c[2] ? '✓' : '✕'))));
    const p3 = rows.slice(0, 3).filter((r) => r.c[2]).length;
    stats.textContent = `Precision in the top 3: ${p3} of 3 relevant. ${rerank ? 'The re-ranker pulled the right passages up.' : 'The vector search alone lets noise in.'}`;
    const cites = rows.slice(0, 3).filter((r) => r.c[2]);
    answer.textContent = `${cites.length ? cites.map((r, n) => `${r.c[1].replace(/\.$/, '')} [${n + 1}]`).join('. ') + '.' : 'No relevant evidence found.'}`;
  };
  const t = tabs(Object.entries(Q).map(([k, v]) => [k, v[0]]), (k, u) => { q = k; render(); if (u) ctx.touched(); });
  const tog = h('button', { class: 'btn btn--ghost', type: 'button', 'aria-pressed': 'false', on: { click: () => { rerank = !rerank; tog.setAttribute('aria-pressed', String(rerank)); tog.textContent = `Re-ranker: ${rerank ? 'on' : 'off'}`; render(); ctx.touched(); } } }, 'Re-ranker: off');
  root.append(t, h('div', { class: 'sx-row' }, tog, h('span', { class: 'sx-fine' }, 'Same question, same documents. Toggle the re-ranker.')), list, stats, h('div', { class: 'sx-card' }, h('b', {}, 'Answer with citations'), answer), h('p', { class: 'sx-fine' }, 'Simulated documents and scores, pre-saved for this sample.'));
  render();
}

/* ───────── tool calling and MCP ───────── */
export function toolsDemo(root, ctx) {
  const L = life();
  const T = {
    orders: ['search_orders', 'Find orders by customer and status', 'Which orders are still pending for C-1042?', { customer: 'C-1042', status: 'pending' }, { count: 2, orders: [{ id: 'A-77', total: '84.00' }, { id: 'A-81', total: '19.50' }] }, 'C-1042 has 2 pending orders: A-77 (84.00 EUR) and A-81 (19.50 EUR).'],
    weather: ['get_weather', 'Current weather for a city', 'Do I need an umbrella in Beirut?', { city: 'Beirut' }, { temp_c: 19, condition: 'rain', chance: 0.8 }, 'Yes: 19 degrees with an 80% chance of rain.'],
    ticket: ['create_ticket', 'Open a support ticket', 'Open a ticket: login fails on iOS', { title: 'Login fails on iOS', priority: 'high' }, { id: 'T-5031', status: 'open' }, 'Done. Ticket T-5031 is open with high priority.'],
  };
  const pane = h('pre', { class: 'sx-json' }); const ans = h('p', { class: 'sx-answer' });
  const flow = h('div', { class: 'sx-flow' }, h('span', {}, 'Client'), h('i', {}), h('span', {}, 'MCP server'));
  const run = async (k) => {
    const [name, , prompt, args, res, final] = T[k]; const id = L.next(); ctx.touched(); ans.textContent = ''; pane.textContent = ''; flow.classList.remove('is-live');
    const say = async (txt, ms = 7) => { for (const ch of txt) { if (!L.ok(id)) return false; pane.textContent += ch; await sleep(ms); } return true; };
    if (!(await say(`// user: "${prompt}"\n// model decides to call a tool\n\n`, 6))) return;
    flow.classList.add('is-live');
    if (!(await say(`→ ${JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name, arguments: args } }, null, 1)}\n\n`))) return;
    await sleep(500); if (!L.ok(id)) return;
    if (!(await say(`← ${JSON.stringify({ jsonrpc: '2.0', id: 1, result: { content: [{ type: 'json', data: res }] } }, null, 1)}\n`))) return;
    flow.classList.remove('is-live'); await sleep(250); if (L.ok(id)) { ans.textContent = ''; await type(ans, `Assistant: ${final}`, L, id, 12); }
  };
  const chips = tabs(Object.entries(T).map(([k, v]) => [k, v[0]]), (k) => run(k), undefined, false);
  root.append(h('p', { class: 'sx-sub' }, 'The server advertises three tools. Pick one to see the model call it over MCP.'), chips, flow, pane, ans, h('p', { class: 'sx-fine' }, 'Simulated tool server and responses, pre-saved. The message shapes follow the MCP JSON-RPC style.'));
  return () => { L.dead = true; };
}

/* ───────── evaluation you can trust ───────── */
export function evaluationDemo(root, ctx) {
  const ANS = [
    ['A', 'You can return items within 30 days of delivery, except digital goods that were downloaded.', [5, 5, 4, 5], 'Correct, grounded in policy §4 and §2.'],
    ['B', 'Refunds take up to 90 days.', [1, 1, 4, 5], 'Contradicts the policy (30 days, not 90). No source.'],
    ['C', 'Probably around a month, I think?', [3, 2, 2, 3], 'Hedging, no citation, vague.'],
    ['D', '30 days. See policy §4.', [5, 5, 3, 4], 'Correct and cited, but terse.'],
  ];
  const RUB = ['Accuracy', 'Grounding', 'Tone', 'Format'];
  const bars = h('div', { class: 'sx-rubric' }, RUB.map((r) => h('div', { class: 'sx-rb' }, h('span', {}, r), h('i', { style: '--w:0%' }), h('b', {}, '–'))));
  const verdict = h('p', { class: 'sx-verdict' }, 'Pick an answer to have the judge score it.');
  const list = h('ul', { class: 'sx-answers' }, ANS.map(([k, text], i) => h('li', {}, h('button', { type: 'button', class: 'sx-ans', on: { click: (e) => { score(i); list.querySelectorAll('.sx-ans').forEach((b) => b.classList.toggle('is-on', b === e.currentTarget)); ctx.touched(); } } }, h('b', {}, k), text))));
  const score = (i) => { const [, , s, note] = ANS[i]; bars.querySelectorAll('.sx-rb').forEach((row, j) => { row.querySelector('i').style.setProperty('--w', `${s[j] * 20}%`); row.querySelector('b').textContent = `${s[j]}/5`; }); const tot = s.reduce((a, b) => a + b, 0); const pass = tot >= 15 && s[0] >= 4; verdict.className = `sx-verdict ${pass ? 'is-pass' : 'is-fail'}`; verdict.textContent = `${pass ? 'PASS' : 'FAIL'} · ${tot}/20 · ${note}`; };
  // regression run: the same 24 test cases against prompt v1 and v2
  const r = rng(9); const v1 = Array.from({ length: 24 }, (_, i) => i % 24 < 17); const v2 = v1.map((x, i) => x || i % 24 < 21 || i === 23);
  const dots = (arr, label) => h('div', { class: 'sx-reg' }, h('b', {}, label), h('div', { class: 'sx-dots' }, arr.map(() => h('i', {}))), h('span', {}, '–'));
  const a = dots(v1, 'prompt v1'); const b = dots(v2, 'prompt v2');
  const fill = async (el, arr) => { const ds = el.querySelectorAll('.sx-dots i'); for (let i = 0; i < ds.length; i++) { ds[i].className = arr[i] ? 'is-ok' : 'is-bad'; await sleep(28); } el.lastChild.textContent = `${Math.round((arr.filter(Boolean).length / arr.length) * 100)}% pass`; };
  const reg = h('button', { class: 'btn btn--ghost', type: 'button', on: { click: async () => { ctx.touched(); a.querySelectorAll('i').forEach((i) => { i.className = ''; }); b.querySelectorAll('i').forEach((i) => { i.className = ''; }); await fill(a, v1); await fill(b, v2); } } }, 'Run the regression suite');
  void r;
  root.append(h('p', { class: 'sx-sub' }, h('b', {}, 'Question: '), 'What is the refund window?'), list, bars, verdict, h('div', { class: 'sx-row' }, reg, h('span', { class: 'sx-fine' }, '24 test cases, two prompt versions.')), a, b, h('p', { class: 'sx-fine' }, 'Simulated judge scores and test results, pre-saved for this sample.'));
}

/* ───────── reliable in production ───────── */
export function productionDemo(root, ctx) {
  const L = life();
  const INC = {
    timeout: ['Model timeout', [['0.0 s', 'request sent to model A'], ['8.0 s', 'timeout, retry with backoff (1 s)'], ['9.6 s', 'fallback model B answers'], ['9.9 s', 'user sees one slow answer, no error']]],
    inject: ['Prompt injection', [['0.0 s', 'input: “ignore previous instructions…”'], ['0.1 s', 'guardrail flags an instruction-override pattern'], ['0.1 s', 'request blocked, safe reply sent'], ['0.2 s', 'event logged, alert raised']]],
    json: ['Malformed output', [['0.0 s', 'model returns text instead of JSON'], ['0.1 s', 'schema validation fails'], ['0.2 s', 'repair prompt sent, one retry'], ['1.3 s', 'valid on attempt 2, passed downstream']]],
  };
  let handled = 0; const cv = h('canvas', { class: 'sx-spark', width: 480, height: 90, role: 'img', 'aria-label': 'Simulated latency' }); const g = cv.getContext('2d');
  const tiles = h('div', { class: 'sx-tiles' }, [['Uptime', '99.94%'], ['p95', '1.4 s'], ['Errors', '0.3%']].map(([k, v]) => h('div', {}, h('small', {}, k), h('b', {}, v))));
  const handledEl = h('b', {}, '0'); const log = h('ol', { class: 'sx-log', 'aria-live': 'polite' });
  const r = rng(3); const pts = Array.from({ length: 48 }, () => 1.2 + r() * 0.5); let spike = 0; let last = 0; let raf = 0;
  const tick = (t) => { raf = requestAnimationFrame(tick); if (!ctx.active() || t - last < 220) return; last = t; pts.push(1.2 + r() * 0.5 + spike); spike = Math.max(0, spike - 1.2); if (pts.length > 48) pts.shift(); g.clearRect(0, 0, 480, 90); g.strokeStyle = '#2433ff'; g.lineWidth = 2.5; g.lineJoin = 'round'; g.beginPath(); pts.forEach((p, i) => { const x = (i / 47) * 476 + 2; const y = 84 - Math.min(80, (p / 6) * 80); i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.stroke(); };
  raf = requestAnimationFrame(tick);
  const run = async (k) => { const id = L.next(); ctx.touched(); log.replaceChildren(); spike = k === 'timeout' ? 4.5 : 1; for (const [t, text] of INC[k][1]) { if (!L.ok(id)) return; log.append(h('li', { class: 'sx-line' }, h('b', {}, t), h('span', {}, text))); await sleep(560); } handled++; handledEl.textContent = String(handled); };
  const chips = tabs(Object.entries(INC).map(([k, v]) => [k, `Inject: ${v[0]}`]), (k) => run(k), undefined, false);
  root.append(tiles, cv, chips, log, h('p', { class: 'sx-row' }, h('span', { class: 'sx-fine' }, 'Incidents handled automatically: '), handledEl, h('span', { class: 'sx-fine' }, ' · user-facing errors: 0')), h('p', { class: 'sx-fine' }, 'Simulated dashboard and incidents, pre-saved for this sample.'));
  return () => { L.dead = true; cancelAnimationFrame(raf); };
}

/* ───────── GREAT: scoring a call ───────── */
export function greatDemo(root, ctx) {
  const CALLS = {
    billing: ['Billing question', [['Agent', 'Thanks for calling, this is Sam. How can I help?', 'Greeting'], ['Customer', 'I was charged twice this month.', ''], ['Agent', 'I am sorry about that, that is frustrating. Let me check.', 'Empathy'], ['Agent', 'I see the duplicate. I have refunded it, you will see it in 3 days.', 'Resolution'], ['Agent', 'This call is recorded. Anything else I can help with?', 'Compliance'], ['Customer', 'No, thanks.', ''], ['Agent', 'Thank you for your patience. Have a great day.', 'Closing']], [20, 18, 17, 20, 18]],
    angry: ['Upset customer', [['Agent', 'Support, what do you want?', 'Greeting'], ['Customer', 'My order is two weeks late!', ''], ['Agent', 'That is not my department.', 'Empathy'], ['Customer', 'Then who can fix it?', ''], ['Agent', 'I will transfer you. This call is recorded.', 'Compliance'], ['Agent', 'Bye.', 'Closing']], [9, 3, 6, 20, 5]],
    sales: ['Sales upsell', [['Agent', 'Hello, this is Maya, how can I help you today?', 'Greeting'], ['Customer', 'I want to upgrade my plan.', ''], ['Agent', 'Great choice, the premium plan fits you well.', 'Empathy'], ['Agent', 'I have upgraded you. Billing starts next month.', 'Resolution'], ['Agent', 'Thanks for choosing us, take care.', 'Closing']], [19, 14, 18, 6, 17]],
  };
  const CRIT = ['Greeting', 'Empathy', 'Resolution', 'Compliance', 'Closing'];
  const lines = h('ul', { class: 'sx-transcript' }); const bars = h('div', { class: 'sx-rubric' }, CRIT.map((c) => h('div', { class: 'sx-rb' }, h('span', {}, c), h('i', { style: '--w:0%' }), h('b', {}, '–')))); const verdict = h('p', { class: 'sx-verdict' });
  const show = (k) => {
    const [, tr, sc] = CALLS[k]; lines.replaceChildren(...tr.map(([who, text, tag]) => h('li', { class: who === 'Agent' ? 'is-agent' : '' }, h('b', {}, who), h('span', {}, text), tag ? h('em', {}, tag) : null)));
    bars.querySelectorAll('.sx-rb').forEach((row, i) => { row.querySelector('i').style.setProperty('--w', '0%'); requestAnimationFrame(() => requestAnimationFrame(() => { row.querySelector('i').style.setProperty('--w', `${(sc[i] / 20) * 100}%`); })); row.querySelector('b').textContent = `${sc[i]}/20`; });
    const tot = sc.reduce((a, b) => a + b, 0); const flag = tot < 70 || sc.some((x) => x < 8); verdict.className = `sx-verdict ${flag ? 'is-fail' : 'is-pass'}`; verdict.textContent = `${tot}/100 · ${flag ? `flagged for human review (${CRIT[sc.indexOf(Math.min(...sc))].toLowerCase()} is low)` : 'passes automatically, no review needed'}`;
  };
  const t = tabs(Object.entries(CALLS).map(([k, v]) => [k, v[0]]), (k, u) => { show(k); if (u) ctx.touched(); });
  root.append(t, lines, bars, verdict, h('p', { class: 'sx-fine' }, 'Made-up conversations and scores, pre-saved for this sample. No real customer data is shown.'));
}

/* ───────── commerce microservices ───────── */
export function microDemo(root, ctx) {
  const L = life(); const up = [true, true, true]; const counts = [0, 0, 0]; let rr = 0;
  const svg = sv('svg', { viewBox: '0 0 360 220', class: 'sx-svg sx-svg--micro', role: 'img', 'aria-label': 'A load balancer sending requests to three order-service replicas' });
  const X = [60, 180, 300]; const nodes = X.map((x, i) => { const g = sv('g', { class: 'sx-node is-up' }, sv('rect', { x: x - 42, y: 150, width: 84, height: 44, rx: 10 }), sv('text', { x, y: 176, 'text-anchor': 'middle' }, `orders-${i + 1}`)); svg.append(sv('line', { x1: 180, y1: 70, x2: x, y2: 150, stroke: 'currentColor', 'stroke-opacity': 0.15 })); return g; });
  svg.append(sv('rect', { x: 130, y: 36, width: 100, height: 36, rx: 10, class: 'sx-lb' }), sv('text', { x: 180, y: 59, 'text-anchor': 'middle', class: 'sx-lbt' }, 'HAProxy'), sv('text', { x: 180, y: 20, 'text-anchor': 'middle', class: 'sx-cap' }, 'requests'));
  nodes.forEach((n) => svg.append(n)); const dot = sv('circle', { r: 6, fill: '#ff5a3c', opacity: 0 }); svg.append(dot);
  const prom = h('pre', { class: 'sx-term' }); const log = h('p', { class: 'sx-sub', 'aria-live': 'polite' }, 'Send requests, then take a replica down and watch the traffic reroute.');
  const draw = () => { prom.textContent = counts.map((c, i) => `http_requests_total{instance="orders-${i + 1}"} ${c}${up[i] ? '' : '   # DOWN'}`).join('\n'); nodes.forEach((n, i) => n.classList.toggle('is-up', up[i])); };
  const fly = (to) => new Promise((res) => { const t0 = performance.now(); const f = (t) => { const p = Math.min(1, (t - t0) / 380); const y = p < 0.5 ? 70 + (p / 0.5) * 0 : 70 + ((p - 0.5) / 0.5) * 80; dot.setAttribute('cx', 180 + (X[to] - 180) * p); dot.setAttribute('cy', 70 + 80 * p); if (p < 1 && !L.dead) requestAnimationFrame(f); else res(); void y; }; dot.setAttribute('opacity', 1); requestAnimationFrame(f); });
  const send = async (n) => { const id = L.next(); ctx.touched(); for (let k = 0; k < n; k++) { if (!L.ok(id)) return; if (!up.some(Boolean)) { log.textContent = 'All replicas are down: HAProxy returns 503.'; return; } do { rr = (rr + 1) % 3; } while (!up[rr]); await fly(rr); counts[rr]++; draw(); } dot.setAttribute('opacity', 0); log.textContent = 'Round-robin across healthy replicas only.'; };
  const toggles = up.map((_, i) => h('button', { class: 'btn btn--ghost', type: 'button', on: { click: () => { ctx.touched(); up[i] = !up[i]; log.textContent = up[i] ? `orders-${i + 1} passed its health check and is back in rotation.` : `orders-${i + 1} failed its health check: removed from rotation.`; draw(); } } }, `Toggle orders-${i + 1}`));
  root.append(svg, h('div', { class: 'sx-row' }, h('button', { class: 'btn btn--solid', type: 'button', on: { click: () => send(9) } }, 'Send 9 requests'), ...toggles), log, prom, h('p', { class: 'sx-fine' }, 'Simulated traffic and counters, pre-saved logic. The real project runs this with HAProxy and Prometheus in Docker.'));
  draw();
  return () => { L.dead = true; };
}
