// Renders the 3D scene alone (transparent page) for every chapter and viewport kind, for the lightweight (no-GPU) mode.
//   GPU needed to run this tool (not to view the site):  node tools/make-posters.mjs   (dev server on :5173)
//   Then: python tools/posters-to-webp.py   (resizes + converts to public/posters/*.webp)
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const BASE = process.env.BASE_URL || 'http://127.0.0.1:5173';
const OUT = 'qa/posters-raw';
mkdirSync(OUT, { recursive: true });
// captured sharp (portrait at 2x = 780 px wide, landscape at 1.5x = 1920 px wide); posters-to-webp.py sizes them for delivery
const KINDS = { l: { viewport: { width: 1280, height: 800 }, dpr: 1.5, mobile: false }, p: { viewport: { width: 390, height: 844 }, dpr: 2, mobile: true } };

const browser = await chromium.launch({ args: ['--enable-gpu', '--ignore-gpu-blocklist', '--use-angle=d3d11', '--enable-webgl'] });
for (const [kind, cfg] of Object.entries(KINDS)) {
  const page = await browser.newPage({ viewport: cfg.viewport, deviceScaleFactor: cfg.dpr, isMobile: cfg.mobile, hasTouch: cfg.mobile });
  await page.goto(`${BASE}/?intro=0&qa=1&poster=1&lite=0`);
  await page.waitForSelector('#loader', { state: 'detached', timeout: 90_000 });
  await page.waitForTimeout(1500);
  const names = await page.evaluate(async () => (await import('/src/scene/keyframes.js')).KF && Object.keys((await import('/src/scene/keyframes.js')).KF));
  for (const name of names) {
    await page.evaluate((n) => { const el = document.querySelector(`[data-kf="${n}"]`); scrollTo(0, window.__kfY(el)); window.__world.snap(); }, name);
    await page.waitForTimeout(2400); // props assemble and the camera settles
    await page.screenshot({ path: `${OUT}/${kind}-${name}.png`, omitBackground: true });
    process.stdout.write(`${kind}-${name} `);
  }
  await page.close();
}
await browser.close();
console.log('\ndone');
