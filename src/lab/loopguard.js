/**
 * A small JavaScript re-implementation of the LoopGuard idea, for the interactive sample on the portfolio page.
 * The real library is Python (github.com/Charbelto/loopguard, MIT). Same method, simplified:
 *   1. tokenise (lower-case, strip punctuation, drop stop words)
 *   2. incremental TF-IDF over every step seen so far
 *   3. map each step to a "state": same action AND cosine similarity of input (and observation, when both exist) >= threshold
 *   4. cycle detection on the sequence of states: a block of 1..5 states repeated `minRepeats` times
 */
const STOP = new Set('a an the in on at to of for and or is are was were be been it its this that with as by from i me my we you your please'.split(' '));
export const tokenize = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter((w) => w && !STOP.has(w));

/** cosine similarity of two token lists, with idf computed over `docs` (all token lists seen so far, incl. these two) */
export function cosine(a, b, docs) {
  if (!a.length || !b.length) return 0;
  const N = docs.length;
  const df = new Map();
  for (const d of docs) for (const t of new Set(d)) df.set(t, (df.get(t) || 0) + 1);
  const idf = (t) => Math.log((1 + N) / (1 + (df.get(t) || 0))) + 1;
  const vec = (toks) => { const m = new Map(); for (const t of toks) m.set(t, (m.get(t) || 0) + 1); for (const [t, c] of m) m.set(t, c * idf(t)); return m; };
  const va = vec(a); const vb = vec(b);
  let dot = 0; let na = 0; let nb = 0;
  for (const [t, w] of va) { na += w * w; if (vb.has(t)) dot += w * vb.get(t); }
  for (const w of vb.values()) nb += w * w;
  return dot / (Math.sqrt(na) * Math.sqrt(nb) || 1);
}

export function createGuard({ threshold = 0.75, minRepeats = 3, maxLen = 5 } = {}) {
  const steps = []; // { action, input, obs, tIn, tObs, state, sim, simTo }
  const states = []; // representative step index per state
  let tripped = null;

  function add({ action, input, obs = '' }) {
    const s = { action, input, obs, tIn: tokenize(input), tObs: tokenize(obs), state: -1, sim: 0, simTo: -1 };
    steps.push(s);
    const docs = steps.flatMap((x) => [x.tIn, x.tObs].filter((t) => t.length));
    let best = -1; let bestSim = 0;
    states.forEach((idx, sid) => {
      const r = steps[idx];
      if (r.action !== action) return;
      const simIn = cosine(s.tIn, r.tIn, docs);
      const sim = s.tObs.length && r.tObs.length ? Math.min(simIn, cosine(s.tObs, r.tObs, docs)) : simIn; // observations only count when both exist
      if (sim >= threshold && sim > bestSim) { best = sid; bestSim = sim; }
    });
    if (best === -1) { states.push(steps.length - 1); s.state = states.length - 1; } else { s.state = best; s.sim = bestSim; s.simTo = best; }
    if (!tripped) tripped = detect();
    return s;
  }

  function detect() {
    const seq = steps.map((s) => s.state);
    for (let L = 1; L <= maxLen; L++) {
      const need = L * minRepeats;
      if (seq.length < need) continue;
      const tail = seq.slice(-need);
      const block = tail.slice(0, L);
      let ok = true;
      for (let i = 0; i < need; i++) if (tail[i] !== block[i % L]) { ok = false; break; }
      // a block of one state repeated is only a loop if the steps really repeat; a block with all-distinct states of length > 1 is a cycle
      if (ok) return { at: steps.length, length: L, block, repeats: minRepeats };
    }
    return null;
  }

  return { steps, states, add, get tripped() { return tripped; } };
}

/** what a naive "exact same input three times in a row" guard would do with the same steps */
export function exactHashGuard(steps, repeats = 3) {
  let run = 1;
  for (let i = 1; i < steps.length; i++) {
    run = steps[i].action === steps[i - 1].action && steps[i].input === steps[i - 1].input ? run + 1 : 1;
    if (run >= repeats) return i + 1;
  }
  return null;
}

export const PRESETS = {
  rephrase: {
    title: 'Rephrased search',
    blurb: 'The agent keeps searching for the same thing in slightly different words. An exact-match guard never fires.',
    steps: [
      { action: 'web_search', input: 'weather chicago', obs: 'no results found' },
      { action: 'web_search', input: 'weather chicago now', obs: 'no results found' },
      { action: 'web_search', input: 'chicago weather now', obs: 'no results found for query' },
      { action: 'web_search', input: 'chicago weather today now', obs: 'no results found' },
      { action: 'web_search', input: 'weather now chicago', obs: 'no results found' },
    ],
  },
  oscillation: {
    title: 'Tool ping-pong',
    blurb: 'Query, lock warning, wait, query, lock warning, wait. Each step looks reasonable on its own.',
    steps: [
      { action: 'query_db', input: 'select orders where status pending', obs: 'database locked retry later' },
      { action: 'wait', input: 'wait 2 seconds', obs: 'done' },
      { action: 'query_db', input: 'select orders where status pending', obs: 'database locked retry later' },
      { action: 'wait', input: 'wait 2 seconds', obs: 'done' },
      { action: 'query_db', input: 'select orders where status pending', obs: 'database locked retry later' },
      { action: 'wait', input: 'wait 2 seconds', obs: 'done' },
    ],
  },
  healthy: {
    title: 'Healthy run',
    blurb: 'A normal task with real progress. Nothing should be flagged.',
    steps: [
      { action: 'web_search', input: 'quarterly revenue report 2025', obs: 'three relevant pages found' },
      { action: 'read_page', input: 'open first result revenue table', obs: 'revenue table with four quarters' },
      { action: 'calculate', input: 'sum quarterly revenue and growth rate', obs: 'total 4.2 million growth 12 percent' },
      { action: 'write_answer', input: 'summarise revenue growth for the user', obs: 'draft ready' },
    ],
  },
};
