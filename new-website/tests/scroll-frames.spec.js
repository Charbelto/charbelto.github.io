import { test } from '@playwright/test';
import { gotoReady } from './helpers.js';

const VARIANTS = {
  base: '',
  nograin: '.grain{display:none !important}',
  nobackdrop: '*{backdrop-filter:none !important;-webkit-backdrop-filter:none !important}',
  both: '.grain{display:none !important} *{backdrop-filter:none !important;-webkit-backdrop-filter:none !important}',
};
test.use({ viewport: { width: Number(process.env.VW || 1440), height: Number(process.env.VH || 900) }, deviceScaleFactor: Number(process.env.DSF || 2) });
test.setTimeout(400_000);
for (const [name, css] of Object.entries(VARIANTS)) {
  test(`scroll smoothness ${name}`, async ({ page }) => {
    await gotoReady(page, '?intro=0&gov=0' + (process.env.QS || ''), { settle: 2500 });
    if (css) await page.addStyleTag({ content: css });
    const cdp = await page.context().newCDPSession(page); await cdp.send('Emulation.setCPUThrottlingRate', { rate: Number(process.env.THROTTLE || 1) });
    await page.evaluate(() => scrollTo(0, 0));
    await page.waitForTimeout(1200);
    const r = await page.evaluate(async () => {
      const dts = []; let last = performance.now();
      const total = document.documentElement.scrollHeight - innerHeight;
      const speed = total / 9; // px per second: the whole page in 9 s
      const t0 = last;
      await new Promise((res) => {
        const f = (now) => { dts.push(now - last); last = now; scrollTo(0, Math.min(total, ((now - t0) / 1000) * speed)); if (now - t0 < 9000) requestAnimationFrame(f); else res(); };
        requestAnimationFrame(f);
      });
      dts.shift(); dts.sort((a, b) => a - b);
      const q = (p) => dts[Math.min(dts.length - 1, Math.floor(dts.length * p))];
      return { frames: dts.length, avg: +(dts.reduce((a, b) => a + b, 0) / dts.length).toFixed(1), p50: +q(0.5).toFixed(1), p95: +q(0.95).toFixed(1), p99: +q(0.99).toFixed(1), over25: dts.filter((d) => d > 25).length };
    });
    console.log('LAG', name, JSON.stringify(r));
  });
}
