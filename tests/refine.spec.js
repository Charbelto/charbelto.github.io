import { test, expect } from '@playwright/test';
import { gotoReady, trackErrors } from './helpers.js';

const ORIGIN = /^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?\//;

test.describe('privacy & content decisions', () => {
  test('endorsements are hidden (unverified provenance)', async ({ page }) => {
    await gotoReady(page, '?intro=0&qa=1', { settle: 1500 });
    await expect(page.locator('#endorsements')).toBeHidden();
    await expect(page.getByText('Engineering Operations')).toBeHidden();
    await expect(page.getByText('Faculty Collaborator')).toBeHidden();
  });

  for (const path of ['/?intro=0&qa=1', '/privacy.html', '/terms.html', '/404.html', '/thank-you.html']) {
    test(`no third-party requests, cookies, storage or analytics: ${path}`, async ({ page }) => {
      const external = [];
      page.on('request', (r) => { if (/^https?:/.test(r.url()) && !ORIGIN.test(r.url())) external.push(r.url()); });
      await page.goto(path, { waitUntil: 'domcontentloaded' });
      if (path.startsWith('/?')) await page.waitForSelector('#loader', { state: 'detached', timeout: 90_000 });
      await page.waitForTimeout(1500);
      expect(external, 'third-party requests').toEqual([]);
      const state = await page.evaluate(() => ({
        cookie: document.cookie,
        ls: localStorage.length,
        ss: sessionStorage.length,
        banner: !!document.querySelector('#cookieBanner, .cookie-banner'),
        ga: !!document.querySelector('script[src*="googletagmanager"], script[src*="google-analytics"]'),
      }));
      expect(state).toEqual({ cookie: '', ls: 0, ss: 0, banner: false, ga: false });
    });
  }

  test('privacy page states there is no analytics and no cookies', async ({ page }) => {
    await page.goto('/privacy.html');
    const t = (await page.locator('main').innerText()).toLowerCase();
    expect(t).toContain('does not use analytics');
    expect(t).toContain('sets no cookies');
    expect(t).not.toContain('google analytics ga4) to measure');
    await expect(page.locator('h1')).toHaveText(/Privacy Policy/);
  });

  for (const [path, h1] of [['/terms.html', /Terms/], ['/404.html', /404/], ['/thank-you.html', /Thank you/]]) {
    test(`legal/utility page renders: ${path}`, async ({ page }) => {
      const errors = trackErrors(page);
      await page.goto(path);
      await expect(page.locator('h1')).toHaveText(h1);
      await expect(page.locator('a[href="/"]').first()).toBeVisible();
      expect(errors).toEqual([]);
    });
  }
});

test.describe('experience, navigation, reversibility', () => {
  test('seven experience steps, each readable and keyframed', async ({ page }) => {
    await gotoReady(page, '?intro=0&qa=1', { settle: 1500 });
    const steps = page.locator('.xp-step[data-kf]');
    await expect(steps).toHaveCount(7);
    await expect(page.locator('.xp-step .xp').first()).toContainText('Gabriel');
    await expect(page.locator('.xp-step .xp').last()).toContainText('eMcREY');
  });

  test('reverse scrolling returns the camera to the same state (reversible, no drift)', async ({ page }) => {
    await gotoReady(page, '?intro=0&qa=1', { settle: 1500 });
    const snapAt = (kf) => page.evaluate(async (id) => {
      const el = document.querySelector(`[data-kf="${id}"]`);
      const r = el.getBoundingClientRect();
      scrollTo(0, r.top + scrollY + r.height / 2 - innerHeight / 2);
      window.__world.snap();
      // the camera transform is applied in the next frames
      await new Promise((res) => requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(res))));
      const c = window.__world.camera.position;
      return [c.x, c.y, c.z].map((v) => +v.toFixed(2));
    }, kf);
    const w3a = await snapAt('w3');
    const heroA = await snapAt('hero');
    const cap4 = await snapAt('cap4');
    const w3b = await snapAt('w3');
    const heroB = await snapAt('hero');
    expect(w3b).toEqual(w3a);
    expect(heroB).toEqual(heroA);
    expect(cap4).not.toEqual(heroA); // the camera really moves between chapters
  });

  test('nav link scrolls to its chapter', async ({ page }) => {
    await gotoReady(page, '?intro=0&qa=1', { settle: 1500 });
    await page.locator('.head-nav a[href="#works"]').click();
    await page.waitForTimeout(500);
    const top = await page.evaluate(() => document.querySelector('#works').getBoundingClientRect().top);
    expect(Math.abs(top)).toBeLessThan(5);
  });

  test('3D world exposes governor stats and a live pixel ratio', async ({ page }) => {
    await gotoReady(page, '?intro=0', { settle: 2500 });
    const s = await page.evaluate(() => ({ ...window.__world.stats }));
    expect(s.pr).toBeGreaterThan(0.5);
    expect(s.pr).toBeLessThanOrEqual(2);
  });

  test('perf HUD toggles with P and reports draws', async ({ page }) => {
    await gotoReady(page, '?intro=0&perf=1', { settle: 2500 });
    await expect(page.locator('.perf-hud')).toContainText('draws');
    await page.keyboard.press('p');
    await expect(page.locator('.perf-hud')).toHaveCount(0);
  });

  test('archive filter nudges the engine without errors', async ({ page }) => {
    const errors = trackErrors(page);
    await gotoReady(page, '?intro=0&qa=1', { settle: 1500 });
    await page.locator('.chip[data-filter="systems"]').click();
    await expect(page.locator('#arcList li:not([hidden])')).toHaveCount(await page.locator('#arcList li[data-cat="systems"]').count());
    expect(errors).toEqual([]);
  });
});
