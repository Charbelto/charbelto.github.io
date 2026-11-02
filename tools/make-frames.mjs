// Renders short looping frame sequences of the real 3D scene for the phone (lite) mode.
//   GPU needed to run this tool (not to view the site):  node tools/make-frames.mjs   (dev server on :5173)
//   Then: python tools/frames-to-webp.py   (resizes + converts to public/frames/*.webp)
// Two variants per chapter: "full" (object + toys) and, for chapters that show an interactive sample, "bare" (toys only,
// which is what sits behind the sample window). Frames are captured at exact clock times (window.__clock), STEP seconds apart.
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const BASE = process.env.BASE_URL || 'http://127.0.0.1:5173';
const OUT = 'qa/frames-raw';
const N = Number(process.env.FRAMES || 16);
const STEP = Number(process.env.STEP || 0.15);
const ONLY = process.env.ONLY ? process.env.ONLY.split(',') : null;
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ args: ['--enable-gpu', '--ignore-gpu-blocklist', '--use-angle=d3d11', '--enable-webgl'] });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
await page.goto(`${BASE}/?intro=0&qa=1&poster=1&lite=0&gov=0`);
await page.waitForSelector('#loader', { state: 'detached', timeout: 90_000 });
await page.waitForTimeout(1500);
const names = await page.evaluate(async () => Object.keys((await import('/src/scene/keyframes.js')).KF));
const sampled = await page.evaluate(() => [...(window.__sampleKf || [])]);
const frame = () => page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));

for (const variant of ['full', 'bare']) {
  await page.evaluate((v) => { document.documentElement.dataset.view = v === 'full' ? 'object' : 'sample'; }, variant);
  for (const name of names) {
    if (ONLY && !ONLY.includes(name)) continue;
    if (variant === 'bare' && !sampled.includes(name)) continue;
    await page.evaluate(() => { window.__clock = undefined; });
    await page.evaluate((n) => { const el = document.querySelector(`[data-kf="${n}"]`); scrollTo(0, window.__kfY(el)); window.__world.snap(); }, name);
    await page.waitForTimeout(2600); // props assemble and the camera settles (real time)
    const t0 = await page.evaluate(() => performance.now() / 1000);
    for (let f = 0; f < N; f++) {
      await page.evaluate((t) => { window.__clock = t; }, t0 + f * STEP);
      await frame();
      await page.screenshot({ path: `${OUT}/${variant}-${name}-${String(f).padStart(2, '0')}.png`, omitBackground: true });
    }
    process.stdout.write(`${variant}-${name} `);
  }
}
await browser.close();
console.log('\ndone');
