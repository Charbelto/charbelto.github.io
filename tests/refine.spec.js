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

const EM = String.fromCharCode(0x2014); // the em dash, written as a code point so this file stays clean
test.describe('house style: no em dashes anywhere', () => {
  test('no em dash in any source, doc or page file (legacy archive and the résumé PDF excluded)', async () => {
    const fs = await import('node:fs'); const path = await import('node:path');
    const skip = new Set(['node_modules', 'legacy', '.git', 'dist', 'package-lock.json', 'screenshots', 'test-output']);
    const hits = [];
    const walk = (d) => {
      for (const n of fs.readdirSync(d)) {
        if (skip.has(n) || n.startsWith('dist-') || n.startsWith('review')) continue;
        const p = path.join(d, n); const st = fs.statSync(p);
        if (st.isDirectory()) walk(p);
        else if (/\.(html|js|mjs|css|md|py|txt|json|yml)$/.test(n) && fs.readFileSync(p, 'utf8').includes(EM)) hits.push(p);
      }
    };
    walk(process.cwd());
    expect(hits, 'files containing an em dash').toEqual([]);
  });

  for (const route of ['/?intro=0&qa=1', '/privacy.html', '/terms.html', '/404.html', '/thank-you.html']) {
    test(`no em dash in the rendered page, title or meta: ${route}`, async ({ page }) => {
      await page.goto(route, { waitUntil: 'domcontentloaded' });
      if (route.startsWith('/?')) await page.waitForSelector('#loader', { state: 'detached', timeout: 90_000 });
      const text = await page.evaluate(() => [document.title, document.body.innerText, ...[...document.querySelectorAll('meta[content], [aria-label], [alt]')].map((e) => e.getAttribute('content') || e.getAttribute('aria-label') || e.getAttribute('alt'))].join('\n'));
      expect(text.includes(EM)).toBe(false);
    });
  }

  test('case-study modals contain no em dash either', async ({ page }) => {
    await gotoReady(page, '?intro=0&qa=1', { settle: 1200 });
    for (const id of ['great', 'loopguard']) {
      await page.locator(`[data-modal="${id}"]`).first().click();
      const t = await page.locator('#caseModal').innerText();
      expect(t.includes(EM)).toBe(false);
      await page.keyboard.press('Escape');
    }
  });
});

test.describe('chapter props: every chapter shows an object about its own topic', () => {
  const kfs = (page) => page.evaluate(async () => {
    const { KF } = await import('/src/scene/keyframes.js');
    return Object.fromEntries(Object.entries(KF).map(([k, v]) => [k, v.prop || null]));
  });

  test('keyframe map: projects and roles each get a different object; all objects ship as small valid GLBs', async ({ page, request }) => {
    await gotoReady(page, '?intro=0&qa=1', { settle: 800 });
    const map = await kfs(page);
    const projects = ['w1', 'w2', 'w3', 'w4', 'w5', 'w6'].map((k) => map[k]);
    const roles = ['xp1', 'xp2', 'xp3', 'xp4', 'xp5', 'xp6', 'xp7'].map((k) => map[k]);
    expect(projects.every(Boolean)).toBe(true);
    expect(new Set(projects).size).toBe(6);
    expect(roles.every(Boolean)).toBe(true);
    expect(new Set(roles).size).toBe(7);
    for (const k of ['cap1', 'cap2', 'cap3', 'cap4', 'cap5']) expect(map[k], k).toBeTruthy();
    expect(new Set(['cap1', 'cap2', 'cap3', 'cap4', 'cap5'].map((k) => map[k])).size).toBe(5);
    for (const name of new Set(Object.values(map).filter(Boolean))) {
      const res = await request.get(`/models/props/${name}.glb`);
      expect(res.ok(), name).toBe(true);
      const buf = await res.body();
      expect(buf.subarray(0, 4).toString(), name).toBe('glTF');
      expect(buf.length, `${name} size`).toBeLessThan(120 * 1024);
    }
  });

  test('every prop chapter assembles its object on scroll (no load errors)', async ({ page }) => {
    test.setTimeout(240_000);
    const errors = trackErrors(page);
    await gotoReady(page, '?intro=0&qa=1', { settle: 1200 });
    const map = await kfs(page);
    for (const [kf, prop] of Object.entries(map)) {
      if (!prop) continue;
      await page.evaluate((id) => { const el = document.querySelector(`[data-kf="${id}"]`); const r = el.getBoundingClientRect(); scrollTo(0, r.top + scrollY + r.height / 2 - innerHeight / 2); window.__world.snap(); }, kf);
      await page.waitForFunction((n) => (window.__world.propWeights.get(n) || 0) > 0.95 && window.__world.props.has(n), prop, { timeout: 30_000 });
      const visible = await page.evaluate((n) => window.__world.props.entry(n).wrap.visible, prop);
      expect(visible, `${kf} -> ${prop}`).toBe(true);
    }
    expect(errors).toEqual([]);
  });

  test('assembly is scroll-driven and reversible', async ({ page }) => {
    await gotoReady(page, '?intro=0&qa=1', { settle: 1200 });
    const at = (id) => page.evaluate((k) => { const el = document.querySelector(`[data-kf="${k}"]`); const r = el.getBoundingClientRect(); scrollTo(0, r.top + scrollY + r.height / 2 - innerHeight / 2); window.__world.snap(); }, id);
    const weight = () => page.evaluate(() => window.__world.propWeights.get('laptop') || 0);
    await at('hero'); await page.waitForTimeout(900);
    expect(await weight()).toBeLessThan(0.05);
    await at('profile'); await page.waitForFunction(() => (window.__world.propWeights.get('laptop') || 0) > 0.95, null, { timeout: 30_000 });
    await at('hero'); await page.waitForTimeout(1600);
    expect(await weight()).toBeLessThan(0.05); // disassembled again on the way back up
  });
});

test.describe('animated menu', () => {
  test('opens as a growing wipe (not a snap), links stagger in, closes smoothly, ends inert', async ({ page }) => {
    await gotoReady(page, '?intro=0&qa=1', { settle: 1200 });
    await page.setViewportSize({ width: 1280, height: 800 });
    const radius = () => page.evaluate(() => parseFloat((getComputedStyle(document.querySelector('.menu-wipe--a')).clipPath.match(/circle\(([\d.]+)px/) || [0, 0])[1]));
    expect(await radius()).toBe(0);
    await page.click('#menuBtn');
    await page.waitForTimeout(120);
    const early = await radius();
    await page.waitForTimeout(1100);
    const late = await radius();
    expect(early).toBeGreaterThan(0);
    expect(early).toBeLessThan(late * 0.6); // mid-animation, not already at full size
    expect(late).toBeGreaterThan(900); // reaches the far corner
    const first = await page.evaluate(() => getComputedStyle(document.querySelector('.menu li a')).opacity);
    expect(+first).toBeGreaterThan(0.95);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(250);
    const closing = await radius();
    expect(closing).toBeGreaterThan(0);
    expect(closing).toBeLessThan(late); // shrinking, not hidden instantly
    await page.waitForTimeout(1000);
    expect(await page.evaluate(() => getComputedStyle(document.getElementById('menu')).visibility)).toBe('hidden');
    expect(await page.evaluate(() => document.getElementById('menu').inert)).toBe(true);
  });
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

test.describe('Pip - the Blender-authored agent', () => {
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
