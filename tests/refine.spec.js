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

test.describe('bright colour worlds & playground', () => {
  const goto = (page, id) => page.evaluate((k) => {
    const el = document.querySelector(`[data-kf="${k}"]`);
    const r = el.getBoundingClientRect();
    scrollTo(0, r.top + scrollY + r.height / 2 - innerHeight / 2);
    window.__world.snap();
    return getComputedStyle(document.documentElement).getPropertyValue('--bg').trim().toLowerCase();
  }, id);

  test('the whole page floods from one colour world to the next as you scroll', async ({ page }) => {
    await gotoReady(page, '?intro=0&qa=1', { settle: 1500 });
    const hero = await goto(page, 'hero');
    const dive = await goto(page, 'dive');
    const cap1 = await goto(page, 'cap1');
    const contact = await goto(page, 'contact');
    expect(hero).toBe('#d4ff1f'); // lime
    expect(dive).toBe('#2433ff'); // electric blue
    expect(new Set([hero, dive, cap1]).size).toBe(3);
    expect(contact).toBe('#d4ff1f'); // bookend
    // ink flips for contrast: white on blue, near-black on lime
    await goto(page, 'dive');
    expect(await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--ink').trim().toLowerCase())).toBe('#ffffff');
    await goto(page, 'hero');
    expect(await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--ink').trim().toLowerCase())).toBe('#0b0b14');
  });

  test('playground: a click ripples a full-screen colour flood and then cleans up', async ({ page }) => {
    const errors = trackErrors(page);
    await gotoReady(page, '?intro=0&qa=1', { settle: 1500 });
    await goto(page, 'play');
    await page.waitForTimeout(400);
    await page.mouse.click(260, 260);
    await expect(page.locator('.flood')).toHaveCount(1);
    await expect(page.locator('.flood')).toHaveCount(0, { timeout: 8000 });
    await page.locator('#playBtn').click();
    await expect(page.locator('.flood')).toHaveCount(1);
    await expect(page.locator('.flood')).toHaveCount(0, { timeout: 8000 });
    expect(errors).toEqual([]);
  });

  test('swarm: 150 / 240 / 360 instances by tier, a handful of draw calls', async ({ page }) => {
    for (const [q, n] of [['low', 150], ['mid', 240], ['high', 360]]) {
      await gotoReady(page, `?intro=0&qa=1&q=${q}`, { settle: 1200 });
      const info = await page.evaluate(() => ({ count: window.__world.swarm.count, calls: window.__world.renderer.info.render.calls }));
      expect(info.count).toBe(n);
      expect(info.calls).toBeLessThan(12);
    }
  });
});

test.describe('Pip — the Blender-authored agent', () => {
  test('model loads (real glTF with the expected named nodes) and no errors', async ({ page }) => {
    const errors = trackErrors(page);
    await gotoReady(page, '?intro=0&qa=1', { settle: 2500 });
    await page.waitForFunction(() => window.__world.agentLoaded, null, { timeout: 30_000 });
    const names = await page.evaluate(() => { const n = []; window.__world.scene.traverse((o) => { if (o.name) n.push(o.name); }); return n; });
    for (const want of ['agent', 'head', 'eye_L', 'eye_R', 'arm_L', 'arm_R', 'antenna', 'jet']) expect(names).toContain(want);
    expect(errors).toEqual([]);
  });

  test('model file is a small valid GLB (< 700 KB)', async ({ request }) => {
    const res = await request.get('/models/agent.glb');
    expect(res.ok()).toBe(true);
    const buf = await res.body();
    expect(buf.subarray(0, 4).toString()).toBe('glTF');
    expect(buf.length).toBeLessThan(700 * 1024);
  });

  test('perceive → decide → act: head follows the cursor, click makes the right arm rise', async ({ page }) => {
    await gotoReady(page, '?intro=0&qa=1', { settle: 2000 });
    await page.waitForFunction(() => window.__world.agentLoaded, null, { timeout: 30_000 });
    await page.evaluate(() => { const el = document.querySelector('[data-kf="meet"]'); const r = el.getBoundingClientRect(); scrollTo(0, r.top + scrollY + r.height / 2 - innerHeight / 2); window.__world.snap(); });
    await page.waitForTimeout(1200);
    const read = () => page.evaluate(() => { let head; let arm; window.__world.scene.traverse((o) => { if (o.name === 'head') head = o; if (o.name === 'arm_R') arm = o; }); return { yaw: head.rotation.y, armZ: arm.rotation.z }; });
    await page.mouse.move(100, 450); await page.waitForTimeout(900);
    const left = await read();
    await page.mouse.move(1380, 450); await page.waitForTimeout(900);
    const right = await read();
    expect(right.yaw - left.yaw).toBeGreaterThan(0.3); // perceives
    await page.locator('#pipBtn').click(); await page.waitForTimeout(450);
    const waving = await read();
    expect(waving.armZ).toBeGreaterThan(1.8); // acts
  });

  test('Pip is hidden outside its chapter', async ({ page }) => {
    await gotoReady(page, '?intro=0&qa=1', { settle: 2000 });
    await page.waitForFunction(() => window.__world.agentLoaded, null, { timeout: 30_000 });
    await page.evaluate(() => { scrollTo(0, 0); window.__world.snap(); });
    await page.waitForTimeout(1200);
    // Pip's wrapper group is the ancestor of the 'agent' node that sits directly under the scene
    const visible = await page.evaluate(() => {
      const scene = window.__world.scene; let v = true;
      scene.traverse((o) => { if (o.name === 'agent') { let top = o; while (top.parent && top.parent !== scene) top = top.parent; v = top.visible; } });
      return v;
    });
    expect(visible).toBe(false);
    await page.evaluate(() => { const el = document.querySelector('[data-kf="meet"]'); const r = el.getBoundingClientRect(); scrollTo(0, r.top + scrollY + r.height / 2 - innerHeight / 2); window.__world.snap(); });
    await page.waitForTimeout(1500);
    const shown = await page.evaluate(() => {
      const scene = window.__world.scene; let v = false;
      scene.traverse((o) => { if (o.name === 'agent') { let top = o; while (top.parent && top.parent !== scene) top = top.parent; v = top.visible; } });
      return v;
    });
    expect(shown).toBe(true);
  });
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
