import { test, expect } from '@playwright/test';
import { trackErrors, gotoReady } from './helpers.js';

test.use({ launchOptions: { args: ['--disable-gpu', '--disable-webgl', '--disable-3d-apis'] } });

test('content visible, .no-gl set, notice shown, no errors', async ({ page }) => {
  await page.addInitScript(() => {
    const orig = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...a) {
      if (/webgl/i.test(type)) return null;
      return orig.call(this, type, ...a);
    };
    delete window.WebGL2RenderingContext;
    delete window.WebGLRenderingContext;
  });
  const errors = trackErrors(page);
  await gotoReady(page, '?intro=0', { settle: 3500 });
  expect(await page.evaluate(() => document.documentElement.classList.contains('no-gl'))).toBe(true);
  await expect(page.locator('#noWebgl')).toBeVisible();
  await expect(page.locator('.bt-line').first()).toBeVisible();
  expect(+(await page.locator('.bt-line').first().evaluate((e) => getComputedStyle(e).opacity))).toBeGreaterThan(0.95);
  await expect(page.locator('.hero-statement')).toBeVisible();
  await page.locator('.profile .panel').scrollIntoViewIfNeeded();
  await page.waitForTimeout(1800);
  expect(+(await page.locator('.profile .panel').evaluate((e) => getComputedStyle(e).opacity))).toBeGreaterThan(0.95);
  expect(await page.evaluate(() => !!window.__world)).toBe(false);
  expect(errors, errors.join('\n')).toEqual([]);
});

test('no-GL: screenshots of hero and contact', async ({ page }) => {
  await page.addInitScript(() => { HTMLCanvasElement.prototype.getContext = () => null; delete window.WebGL2RenderingContext; });
  await gotoReady(page, '?intro=0', { settle: 3000 });
  await page.screenshot({ path: 'qa/screenshots/nogl-desktop-hero.png' });
  await page.locator('#contact').scrollIntoViewIfNeeded();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'qa/screenshots/nogl-desktop-contact.png' });
  await expect(page.locator('.contact .mail')).toBeVisible();
});
