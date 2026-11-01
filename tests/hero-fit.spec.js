import { test, expect } from '@playwright/test';
import { gotoReady } from './helpers.js';

// The name must never overlap the statement above it or the buttons below it, at any window shape.
const SIZES = [[1851, 843], [1440, 900], [1366, 650], [1280, 720], [1024, 768], [1920, 1080], [2560, 1080], [1536, 730], [1280, 600], [768, 1024], [820, 1180], [390, 844], [360, 640]];
for (const [w, h] of SIZES) {
  test(`hero: name clear of the statement and buttons at ${w}x${h}`, async ({ page }) => {
    await page.setViewportSize({ width: w, height: h });
    await gotoReady(page, '?intro=0&lite=1&gov=0', { settle: 1200 });
    await page.evaluate(() => { document.querySelectorAll('[data-intro], .bt-line').forEach((e) => { e.style.opacity = 1; e.style.transform = 'none'; e.style.filter = 'none'; }); });
    await page.waitForTimeout(300);
    const r = await page.evaluate(() => {
      const q = (s) => document.querySelector(s).getBoundingClientRect();
      const lines = [...document.querySelectorAll('.bt-line')].map((e) => e.getBoundingClientRect());
      const fs = parseFloat(getComputedStyle(document.querySelector('.bt-name')).fontSize);
      return { top: q('.hero-top'), bottom: q('.hero-bottom'), name: q('.bt-name'), lines, fs, vw: innerWidth, hs: getComputedStyle(document.documentElement).getPropertyValue('--hs') };
    });
    const nameTop = r.name.top - r.fs * 0.1; // glyphs rise a little above the line box
    expect(r.top.bottom, `statement bottom ${r.top.bottom} vs name top ${nameTop} (hs ${r.hs})`).toBeLessThanOrEqual(nameTop + 1);
    expect(r.name.bottom, `name bottom ${r.name.bottom} vs buttons top ${r.bottom.top}`).toBeLessThanOrEqual(r.bottom.top + 1);
    for (const l of r.lines) expect(l.right, 'name inside the window').toBeLessThanOrEqual(r.vw + 1);
  });
}
