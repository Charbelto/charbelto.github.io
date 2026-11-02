import { test, expect } from '@playwright/test';
import { gotoReady } from './helpers.js';

test.describe('phones: pre-rendered, looping, sharp', () => {
  test.use({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  test('a phone gets the lightweight scenes by default: no live WebGL, no banner, loops running, sharp posters, no overflow', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    await page.goto('/?intro=0', { waitUntil: 'domcontentloaded' }); // no ?lite flag: the phone decides by itself
    await page.waitForSelector('#loader', { state: 'detached', timeout: 60_000 });
    await page.waitForTimeout(1800);
    const r = await page.evaluate(async () => {
      const img = document.querySelector('.lite-img');
      await new Promise((res) => (img.complete ? res() : img.addEventListener('load', res, { once: true })));
      const ring = getComputedStyle(document.querySelector('.hud-ring--a'));
      const float = getComputedStyle(img);
      return {
        lite: document.documentElement.classList.contains('lite'), world: !!window.__world,
        canvas: getComputedStyle(document.getElementById('world')).display,
        bannerHidden: document.getElementById('noWebgl').hidden,
        ring: ring.animationName, ringS: ring.animationDuration, float: float.animationName,
        posterW: img.naturalWidth, dpr: devicePixelRatio, cssW: innerWidth,
        overflow: document.documentElement.scrollWidth - innerWidth,
        progress: !!document.getElementById('hudBar'),
      };
    });
    expect(r.lite, 'phones use the pre-rendered scenes').toBe(true);
    expect(r.world).toBe(false);
    expect(r.canvas).toBe('none');
    expect(r.bannerHidden, 'no banner on phones').toBe(true);
    expect(r.ring).toBe('hud-spin');
    expect(r.float).toBe('lite-float');
    expect(r.posterW, 'poster is at least 2x the CSS width (sharp on 2x and 3x screens)').toBeGreaterThanOrEqual(r.cssW * 2);
    expect(r.overflow).toBeLessThanOrEqual(0);
    expect(r.progress).toBe(true);
    expect(errors).toEqual([]);
  });

  test('scrolling a phone: posters cross-fade and scrub, the progress bar fills', async ({ page }) => {
    await page.goto('/?intro=0', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#loader', { state: 'detached', timeout: 60_000 });
    await page.waitForTimeout(1200);
    await page.evaluate(() => scrollTo(0, window.__kfY(document.querySelector('[data-kf="cap2"]'))));
    await page.waitForTimeout(1200);
    const r = await page.evaluate(() => ({
      src: [...document.querySelectorAll('.lite-img')].filter((i) => +i.style.opacity > 0.5).map((i) => i.getAttribute('src')),
      bar: document.getElementById('hudBar').style.transform,
    }));
    expect(r.src.join()).toContain('/posters/p-cap2.webp');
    expect(r.bar).toMatch(/scaleX\(0\.[1-9]/);
  });
});

test.describe('desktop: the hybrid layer on top of live 3D', () => {
  test.use({ viewport: { width: 1440, height: 900 } });
  test('guides, rings, grain, live coordinates and progress are present and cheap', async ({ page }) => {
    await gotoReady(page, '?intro=0&gov=0', { settle: 1200 });
    const a = await page.evaluate(() => ({
      guides: document.querySelectorAll('.hud-guide').length, rings: document.querySelectorAll('.hud-ring').length,
      grain: getComputedStyle(document.querySelector('.hud-grain')).display,
      blend: getComputedStyle(document.querySelector('.hud-grain')).mixBlendMode,
      anim: getComputedStyle(document.querySelector('.hud-grain')).animationName,
      coord: document.getElementById('hudCoord').textContent,
    }));
    expect(a.guides).toBe(4); expect(a.rings).toBe(2);
    expect(a.grain).toBe('block');
    expect(a.blend, 'grain must not blend with the canvas (that was slow)').toBe('normal');
    expect(a.anim, 'grain must be static').toBe('none');
    await page.evaluate(() => scrollTo(0, 2500));
    await page.waitForTimeout(500);
    const b = await page.evaluate(() => ({ coord: document.getElementById('hudCoord').textContent, bar: document.getElementById('hudBar').style.transform }));
    expect(b.coord).not.toBe(a.coord);
    expect(b.coord).toMatch(/^Y 0\d{4} \/ \d{3}% \//);
    expect(b.bar).toMatch(/scaleX\(0\.\d*[1-9]/);
  });
});

test('shipped files stay small: size budget for public/ and the tracked repo', async () => {
  const fs = await import('node:fs'); const path = await import('node:path'); const cp = await import('node:child_process');
  let total = 0; let biggest = { size: 0, file: '' };
  const walk = (d) => { for (const n of fs.readdirSync(d)) { const p = path.join(d, n); const st = fs.statSync(p); if (st.isDirectory()) walk(p); else { total += st.size; if (st.size > biggest.size) biggest = { size: st.size, file: p }; } } };
  walk('public');
  expect(total / 1e6, `public/ is ${(total / 1e6).toFixed(1)} MB`).toBeLessThan(9);
  expect(biggest.size / 1024, `largest public file ${biggest.file}`).toBeLessThan(600);
  const tracked = cp.execSync('git ls-files -z', { encoding: 'buffer', maxBuffer: 1 << 26 }).toString().split('\0').filter(Boolean);
  const bytes = tracked.reduce((s, f) => { try { return s + fs.statSync(f).size; } catch { return s; } }, 0);
  expect(bytes / 1e6, `tracked files are ${(bytes / 1e6).toFixed(1)} MB`).toBeLessThan(30);
});
