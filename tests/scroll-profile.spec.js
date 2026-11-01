import { test } from '@playwright/test';
import { gotoReady } from './helpers.js';
test.use({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
test.setTimeout(300_000);
test('profile scroll', async ({ page }) => {
  await gotoReady(page, '?intro=0&gov=0', { settle: 2500 });
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Profiler.enable');
  await cdp.send('Profiler.setSamplingInterval', { interval: 200 });
  await page.evaluate(() => scrollTo(0, 0));
  await page.waitForTimeout(800);
  await cdp.send('Profiler.start');
  await page.evaluate(async () => {
    const total = document.documentElement.scrollHeight - innerHeight; const t0 = performance.now();
    await new Promise((res) => { const f = (now) => { scrollTo(0, Math.min(total, ((now - t0) / 9000) * total)); if (now - t0 < 9000) requestAnimationFrame(f); else res(); }; requestAnimationFrame(f); });
  });
  const { profile } = await cdp.send('Profiler.stop');
  const self = new Map(); const byId = new Map(profile.nodes.map((n) => [n.id, n]));
  const dt = profile.timeDeltas; let total = 0;
  profile.samples.forEach((id, i) => { const n = byId.get(id); const cf = n.callFrame; const key = `${cf.functionName || '(anon)'} ${cf.url.split('/').slice(-1)[0].split('?')[0]}:${cf.lineNumber}`; self.set(key, (self.get(key) || 0) + dt[i]); total += dt[i]; });
  const lines = new Map(); for (const n of profile.nodes) { if (n.callFrame.functionName === 'update' && n.callFrame.url.includes('main.js') && n.positionTicks) for (const t of n.positionTicks) lines.set(t.line, (lines.get(t.line) || 0) + t.ticks); }
  console.log('PROF lines', JSON.stringify([...lines.entries()].sort((a,b)=>b[1]-a[1]).slice(0,6)));
  const top = [...self.entries()].sort((a, b) => b[1] - a[1]).slice(0, 22);
  console.log('PROF total ms', (total / 1000).toFixed(0));
  for (const [k, v] of top) console.log('PROF', (v / 1000).toFixed(0).padStart(6), 'ms', k);
});
