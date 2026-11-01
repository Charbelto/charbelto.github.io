import { test, expect } from '@playwright/test';
import { gotoReady, trackErrors, goKf } from './helpers.js';

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
      await goKf(page, id === 'great' ? 'great3' : 'w1');
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
      await page.evaluate((id) => { const el = document.querySelector(`[data-kf="${id}"]`); scrollTo(0, window.__kfY(el)); window.__world.snap(); }, kf);
      await page.waitForFunction((n) => (window.__world.propWeights.get(n) || 0) > 0.95 && window.__world.props.has(n), prop, { timeout: 30_000 });
      const visible = await page.evaluate((n) => window.__world.props.entry(n).wrap.visible, prop);
      expect(visible, `${kf} -> ${prop}`).toBe(true);
    }
    expect(errors).toEqual([]);
  });

  test('assembly is scroll-driven and reversible', async ({ page }) => {
    await gotoReady(page, '?intro=0&qa=1', { settle: 1200 });
    const at = (id) => page.evaluate((k) => { const el = document.querySelector(`[data-kf="${k}"]`); scrollTo(0, window.__kfY(el)); window.__world.snap(); }, id);
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
    scrollTo(0, window.__kfY(el));
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
    await page.evaluate(() => { const el = document.querySelector('[data-kf="meet"]'); scrollTo(0, window.__kfY(el)); window.__world.snap(); });
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
    await page.evaluate(() => { const el = document.querySelector('[data-kf="meet"]'); scrollTo(0, window.__kfY(el)); window.__world.snap(); });
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
      scrollTo(0, window.__kfY(el));
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

test.describe('shorter page, virtual steps, quick navigation', () => {
  test('page is short: at most 20 screens on desktop and 21 on a phone (was 30)', async ({ page }) => {
    await gotoReady(page, '?intro=0&qa=1', { settle: 1500 });
    const screens = () => page.evaluate(() => document.documentElement.scrollHeight / innerHeight);
    expect(await screens()).toBeLessThan(20);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(600);
    expect(await screens()).toBeLessThan(21);
  });

  test('pinned groups step through their chapters: exactly one step is active per group, and it follows the scroll', async ({ page }) => {
    await gotoReady(page, '?intro=0&qa=1', { settle: 1500 });
    for (const [group, kf] of [['#capabilities', 'cap4'], ['#great', 'great2'], ['#works .stepper', 'w5'], ['#experience', 'xp6']]) {
      await goKf(page, kf, 1100);
      const active = await page.evaluate((g) => [...document.querySelectorAll(`${g} .chapter.is-active`)].map((c) => c.dataset.kf), group);
      expect(active, group).toEqual([kf]);
      const visible = await page.evaluate((g) => [...document.querySelectorAll(`${g} .chapter`)].filter((c) => getComputedStyle(c).visibility === 'visible' && +getComputedStyle(c).opacity > 0.9).length, group);
      expect(visible, `${group} visible steps`).toBe(1);
    }
  });

  test('step pips jump between steps (keyboard accessible)', async ({ page }) => {
    await gotoReady(page, '?intro=0&qa=1', { settle: 1500 });
    await goKf(page, 'w1', 800);
    const pips = page.locator('#works .step-pips button');
    await expect(pips).toHaveCount(6);
    await pips.nth(3).focus();
    await page.keyboard.press('Enter');
    await expect.poll(() => page.evaluate(() => document.querySelector('#works .chapter.is-active')?.dataset.kf), { timeout: 15_000 }).toBe('w4');
    await expect(pips.nth(3)).toHaveAttribute('aria-current', 'true');
  });

  test('quick-jump dots: six of them, and the Contact dot takes you to the contact chapter', async ({ page }) => {
    await gotoReady(page, '?intro=0&qa=1', { settle: 1500 });
    const dots = page.locator('#dots a');
    await expect(dots).toHaveCount(6);
    await dots.nth(5).click();
    await page.waitForTimeout(600);
    expect(await page.evaluate(() => document.querySelector('#contact').getBoundingClientRect().top < window.innerHeight)).toBe(true);
    await expect.poll(() => page.evaluate(() => document.querySelector('#dots a.is-on')?.getAttribute('href')), { timeout: 5000 }).toBe('#contact');
  });

  test('no horizontal overflow on phones (sticky stages must not break the layout)', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 });
    await gotoReady(page, '?intro=0&qa=1', { settle: 1200 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
  });
});

test.describe('the name is never hidden', () => {
  test('the name layer sits above the 3D canvas, so toys can only pass behind it', async ({ page }) => {
    await gotoReady(page, '?intro=0', { settle: 2500 });
    const z = await page.evaluate(() => ({ name: +getComputedStyle(document.querySelector('.back-title')).zIndex, canvas: +getComputedStyle(document.getElementById('world')).zIndex }));
    expect(z.name).toBeGreaterThan(z.canvas);
    await expect(page.locator('.bt-line').first()).toBeVisible();
  });
});

test.describe('lightweight mode (no GPU needed)', () => {
  test('?lite=1: no WebGL, posters cross-fade, the colour flood and all content still work, no errors, no third-party requests', async ({ page }) => {
    const errors = trackErrors(page);
    const external = [];
    page.on('request', (r) => { if (/^https?:/.test(r.url()) && !ORIGIN.test(r.url())) external.push(r.url()); });
    await page.goto('/?intro=0&lite=1', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#loader', { state: 'detached', timeout: 60_000 });
    await page.waitForTimeout(1200);
    expect(await page.evaluate(() => document.documentElement.classList.contains('lite'))).toBe(true);
    expect(await page.evaluate(() => !!window.__world)).toBe(false);
    expect(await page.evaluate(() => getComputedStyle(document.getElementById('world')).display)).toBe('none');
    await expect(page.locator('#noWebgl')).toContainText('Lightweight mode');
    await expect(page.locator('#noWebgl a')).toHaveAttribute('href', '?lite=0');
    const bgs = [];
    for (const kf of ['hero', 'dive', 'cap1', 'w2']) {
      await goKf(page, kf, 1400);
      bgs.push(await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--bg').trim().toLowerCase()));
      const shown = await page.evaluate(() => [...document.querySelectorAll('.lite-img')].filter((i) => +i.style.opacity > 0.5).map((i) => i.getAttribute('src')));
      expect(shown.join(), kf).toContain(`-${kf}.webp`);
      expect(await page.evaluate(() => [...document.querySelectorAll('.lite-img')].every((i) => !i.getAttribute('src') || i.complete))).toBe(true);
    }
    expect(new Set(bgs).size).toBe(4); // the page still floods from colour to colour
    await expect(page.locator('.hero-statement, .bt-line').first()).toBeAttached();
    expect(external).toEqual([]);
    expect(errors).toEqual([]);
  });

  test('a phone gets the portrait posters', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/?intro=0&lite=1', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#loader', { state: 'detached', timeout: 60_000 });
    await page.waitForTimeout(1200);
    expect(await page.evaluate(() => document.querySelector('.lite-img').getAttribute('src'))).toContain('/posters/p-hero.webp');
  });

  test('every poster exists and is a reasonable size', async ({ request }) => {
    const names = ['hero', 'profile', 'meet', 'dive', 'cap1', 'cap2', 'cap3', 'cap4', 'cap5', 'play', 'great1', 'great2', 'great3', 'w1', 'w2', 'w3', 'w4', 'w5', 'w6', 'xp0', 'xp1', 'xp2', 'xp3', 'xp4', 'xp5', 'xp6', 'xp7', 'arc', 'edu', 'contact'];
    for (const kind of ['l', 'p']) {
      for (const n of names) {
        const res = await request.get(`/posters/${kind}-${n}.webp`);
        expect(res.ok(), `${kind}-${n}`).toBe(true);
        expect((await res.body()).length, `${kind}-${n} size`).toBeLessThan(160 * 1024);
      }
    }
  });

  test('a software renderer (no GPU) is detected and gets the lightweight mode automatically', async ({ page }) => {
    test.skip(process.env.GPU === '1', 'this run has a real GPU; software rendering is only present in the default run');
    await page.goto('/?intro=0', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#loader', { state: 'detached', timeout: 60_000 });
    expect(await page.evaluate(() => document.documentElement.classList.contains('lite'))).toBe(true);
  });

  test('a GPU machine that cannot hold a playable frame rate falls back to the lightweight mode by itself', async ({ page }) => {
    test.skip(process.env.GPU !== '1', 'needs a real GPU run (CPU throttling is applied on top of it)');
    test.setTimeout(150_000);
    const cdp = await page.context().newCDPSession(page);
    await page.goto('/?intro=0&lite=0', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#loader', { state: 'detached', timeout: 90_000 });
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 60 });
    await page.waitForFunction(() => document.documentElement.classList.contains('lite'), null, { timeout: 120_000, polling: 1500 });
    expect(await page.evaluate(() => getComputedStyle(document.getElementById('world')).display)).toBe('none');
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
    await page.waitForTimeout(800);
    expect(await page.evaluate(() => document.querySelectorAll('.lite-img').length)).toBe(2);
  });
});

test.describe('smoothness guards', () => {
  test('nothing blurs or blends the live canvas; reveals use the observer, not scroll triggers', async ({ page }) => {
    await gotoReady(page, '?intro=0', { settle: 1500 });
    const r = await page.evaluate(() => {
      const bf = (sel) => { const el = document.querySelector(sel); return el ? getComputedStyle(el).backdropFilter : 'none'; };
      return {
        panel: bf('.panel'), wide: bf('.wide'), pips: bf('.step-pips'), menu: bf('.menu-btn'),
        grain: document.querySelector('.grain') ? getComputedStyle(document.querySelector('.grain')).display : 'none',
        reveals: document.querySelectorAll('.rv').length,
      };
    });
    for (const k of ['panel', 'wide', 'pips', 'menu']) expect(r[k], k).toBe('none');
    expect(r.grain).toBe('none');
    expect(r.reveals).toBeGreaterThan(10);
  });
});
