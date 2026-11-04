import { test, expect } from '@playwright/test';
import { trackErrors, gotoReady, REPO_LINKS, goKf } from './helpers.js';

const MAIL = 'mailto:charbeltoumieh1@gmail.com';

test.describe('core / WebGL', () => {
  test('loads with no console errors and renders WebGL frames', async ({ page }) => {
    const errors = trackErrors(page);
    await gotoReady(page, '?intro=0&gov=0', { settle: 5000 });
    await expect(page.locator('canvas#world')).toHaveCount(1);
    const info = await page.evaluate(async () => {
      const w = window.__world;
      if (!w) return { ok: false, reason: 'no __world' };
      const r = w.renderer ?? w.three?.renderer;
      await new Promise((res) => setTimeout(res, 1500));
      const gl = r?.getContext?.();
      return {
        ok: true,
        keys: Object.keys(w),
        calls: r?.info?.render?.calls ?? null,
        triangles: r?.info?.render?.triangles ?? null,
        frame: r?.info?.render?.frame ?? null,
        lost: gl?.isContextLost?.() ?? null,
      };
    });
    console.log('world info', JSON.stringify(info));
    expect(info.ok, info.reason).toBe(true);
    expect(info.lost).toBe(false);
    expect(info.calls, 'renderer.info.render.calls').toBeGreaterThan(0);
    expect(await page.evaluate(() => document.documentElement.classList.contains('no-gl'))).toBe(false);
    expect(errors, errors.join('\n')).toEqual([]);
  });

  test('canvas is non-trivial', async ({ page }) => {
    await gotoReady(page, '?intro=0&q=low&gov=0', { settle: 4000 });
    const buf = await page.locator('canvas#world').screenshot();
    expect(buf.length).toBeGreaterThan(5000);
  });
});

test.describe('links', () => {
  test.beforeEach(async ({ page }) => { await gotoReady(page, '?intro=0&q=low', { settle: 500 }); });

  test('mailto, github, linkedin, resume', async ({ page }) => {
    expect(await page.locator(`a[href="${MAIL}"]`).count()).toBeGreaterThanOrEqual(2);
    expect(await page.locator('a[href="https://github.com/Charbelto"]').count()).toBeGreaterThanOrEqual(1);
    expect(await page.locator('a[href="https://www.linkedin.com/in/charbeltoumieh/"]').count()).toBeGreaterThanOrEqual(1);
    expect(await page.locator('a[href="Charbel_Toumieh_Resume.pdf"]').count()).toBeGreaterThanOrEqual(2);
    const res = await page.request.get('/Charbel_Toumieh_Resume.pdf');
    expect(res.status()).toBe(200);
    expect(res.headers()['content-type']).toMatch(/pdf/);
  });

  test('external links have rel=noopener', async ({ page }) => {
    const bad = await page.$$eval('a[target="_blank"]', (as) => as.filter((a) => !/noopener/.test(a.rel)).map((a) => a.href));
    expect(bad).toEqual([]);
  });

  test('6 project repo links', async ({ page }) => {
    for (const href of REPO_LINKS) await expect(page.locator(`.work a.btn[href="${href}"]`)).toHaveCount(1);
    await expect(page.locator('.work a.btn--solid')).toHaveCount(6);
  });

  test('18 archive links point to github', async ({ page }) => {
    const hrefs = await page.$$eval('#arcList a', (as) => as.map((a) => a.getAttribute('href')));
    expect(hrefs).toHaveLength(18);
    for (const h of hrefs) expect(h).toMatch(/^https:\/\/github\.com\/Charbelto\/[\w.-]+$/);
    expect(new Set(hrefs).size).toBe(18);
  });

  test('in-page anchors resolve to an element', async ({ page }) => {
    const missing = await page.$$eval('a[href^="#"]', (as) => as.map((a) => a.getAttribute('href')).filter((h) => h.length > 1 && !document.querySelector(h)));
    expect(missing).toEqual([]);
  });

  test('local pages exist (privacy, terms)', async ({ page }) => {
    for (const p of ['/privacy.html', '/terms.html']) expect((await page.request.get(p)).status()).toBe(200);
  });
});

test.describe('keyboard & a11y', () => {
  test('skip link is first tab stop and targets main', async ({ page }) => {
    await gotoReady(page, '?intro=0&q=low', { settle: 500 });
    await page.keyboard.press('Tab');
    expect(await page.evaluate(() => document.activeElement?.className)).toContain('skip-link');
    await expect(page.locator('.skip-link')).toBeInViewport();
    await page.keyboard.press('Enter');
    expect(page.url()).toContain('#main');
  });

  test('Tab order reaches header nav links', async ({ page }) => {
    await gotoReady(page, '?intro=0&q=low', { settle: 500 });
    const seen = [];
    for (let i = 0; i < 8; i++) {
      await page.keyboard.press('Tab');
      seen.push(await page.evaluate(() => document.activeElement?.getAttribute('href') || document.activeElement?.id || document.activeElement?.tagName));
    }
    console.log('tab order', seen.join(' | '));
    for (const h of ['#top', '#capabilities', '#great', '#works', '#experience', '#contact']) expect(seen).toContain(h);
  });

  test('focused element has a visible outline', async ({ page }) => {
    await gotoReady(page, '?intro=0&q=low', { settle: 500 });
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    const o = await page.evaluate(() => { const s = getComputedStyle(document.activeElement); return { w: s.outlineWidth, st: s.outlineStyle }; });
    expect(o.st).not.toBe('none');
    expect(parseFloat(o.w)).toBeGreaterThan(0);
  });

  test('mobile menu opens and closes with Escape, focus returns to button', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await gotoReady(page, '?intro=0&q=low', { settle: 500 });
    const btn = page.locator('#menuBtn');
    await expect(btn).toBeVisible();
    await btn.click();
    await expect(btn).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('#menu')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('#menu')).toBeHidden();
    await expect(btn).toHaveAttribute('aria-expanded', 'false');
    expect(await page.evaluate(() => document.activeElement?.id)).toBe('menuBtn');
  });

  test('mobile menu: keyboard focus lands inside menu when opened', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await gotoReady(page, '?intro=0&q=low', { settle: 500 });
    await page.locator('#menuBtn').focus();
    await page.keyboard.press('Enter');
    await page.keyboard.press('Tab');
    const inMenu = await page.evaluate(() => !!document.activeElement?.closest('#menu'));
    expect(inMenu, 'after opening the menu with the keyboard, Tab should land inside it').toBe(true);
  });

  test('case modal opens/closes with Escape and returns focus', async ({ page }) => {
    await gotoReady(page, '?intro=0&q=low', { settle: 500 });
    const opener = page.locator('button[data-modal="great"]');
    await goKf(page, 'great3');
    await opener.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#caseModal')).toBeVisible();
    expect(await page.evaluate(() => document.activeElement?.className)).toContain('modal-close');
    await expect(page.locator('#modalTitle')).not.toBeEmpty();
    await page.keyboard.press('Escape');
    await expect(page.locator('#caseModal')).toBeHidden();
    expect(await page.evaluate(() => document.activeElement?.getAttribute('data-modal'))).toBe('great');
  });

  test('modal traps focus (Tab stays inside while open)', async ({ page }) => {
    await gotoReady(page, '?intro=0&q=low', { settle: 500 });
    const opener = page.locator('button[data-modal="loopguard"]');
    await goKf(page, 'w1');
    await opener.click();
    for (let i = 0; i < 4; i++) await page.keyboard.press('Tab');
    const inside = await page.evaluate(() => !!document.activeElement?.closest('#caseModal'));
    expect(inside, 'aria-modal dialog should trap focus').toBe(true);
  });

  test('landmarks and heading structure', async ({ page }) => {
    await gotoReady(page, '?intro=0&q=low', { settle: 500 });
    await expect(page.locator('main')).toHaveCount(1);
    await expect(page.locator('header')).toHaveCount(1);
    await expect(page.locator('body > footer')).toHaveCount(1);
    await expect(page.locator('h1')).toHaveCount(1);
    const levels = await page.$$eval('h1,h2,h3,h4', (hs) => hs.map((h) => +h.tagName[1]));
    for (let i = 1; i < levels.length; i++) expect(levels[i] - levels[i - 1], `heading jump at index ${i}`).toBeLessThanOrEqual(1);
  });

  test('every link and button has an accessible name', async ({ page }) => {
    await gotoReady(page, '?intro=0&q=low', { settle: 500 });
    const bad = await page.$$eval('a,button', (els) => els.filter((e) => !(e.getAttribute('aria-label') || e.textContent.trim() || e.querySelector('img[alt]'))).map((e) => e.outerHTML.slice(0, 80)));
    expect(bad).toEqual([]);
  });
});

test.describe('interactions', () => {
  test('archive filter chips filter rows', async ({ page }) => {
    await gotoReady(page, '?intro=0&q=low', { settle: 500 });
    const visible = () => page.locator('#arcList li:not([hidden])').count();
    expect(await visible()).toBe(18);
    const expected = await page.$$eval('#arcList li', (lis) => { const m = {}; lis.forEach((l) => { m[l.dataset.cat] = (m[l.dataset.cat] || 0) + 1; }); return m; });
    for (const [cat, n] of Object.entries(expected)) {
      await page.locator(`.chip[data-filter="${cat}"]`).click();
      expect(await visible(), `filter ${cat}`).toBe(n);
      await expect(page.locator(`.chip[data-filter="${cat}"]`)).toHaveClass(/is-on/);
    }
    await page.locator('.chip[data-filter="all"]').click();
    expect(await visible()).toBe(18);
  });

  test('chips expose pressed state to assistive tech', async ({ page }) => {
    await gotoReady(page, '?intro=0&q=low', { settle: 500 });
    const attr = await page.locator('.chip.is-on').getAttribute('aria-pressed');
    expect(attr, 'active filter chip should have aria-pressed').not.toBeNull();
  });

  test('FAQ details toggle', async ({ page }) => {
    await gotoReady(page, '?intro=0&q=low', { settle: 500 });
    const d = page.locator('.faq-list details').first();
    await d.scrollIntoViewIfNeeded();
    await expect(d).not.toHaveAttribute('open', '');
    await d.locator('summary').click();
    await expect(d).toHaveAttribute('open', '');
    await expect(d.locator('p')).toBeVisible();
    await d.locator('summary').click();
    await expect(d).not.toHaveAttribute('open', '');
  });

  test('FAQ summary operable by keyboard', async ({ page }) => {
    await gotoReady(page, '?intro=0&q=low', { settle: 500 });
    const s = page.locator('.faq-list summary').nth(1);
    await s.scrollIntoViewIfNeeded();
    await s.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('.faq-list details').nth(1)).toHaveAttribute('open', '');
  });
});

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });
  test('content is visible and readable without animation', async ({ page }) => {
    const errors = trackErrors(page);
    await gotoReady(page, '?q=low', { settle: 2000 });
    for (const sel of ['.bt-line >> nth=0', '.hero-statement', '.hero-cta', '.hero-stats']) {
      const o = await page.locator(sel).evaluate((e) => +getComputedStyle(e).opacity);
      expect(o, sel).toBeGreaterThan(0.95);
    }
    for (const sel of ['.profile .panel', '.great >> nth=1 >> .panel', '.work >> nth=2 >> .panel', '.archive .wide', '.xp >> nth=0']) {
      const loc = page.locator(sel).first();
      await loc.scrollIntoViewIfNeeded();
      const o = await loc.evaluate((e) => +getComputedStyle(e).opacity);
      expect(o, sel).toBeGreaterThan(0.95);
    }
    expect(await page.evaluate(() => getComputedStyle(document.querySelector('.dot')).animationName)).toBe('none');
    expect(errors, errors.join('\n')).toEqual([]);
  });
});
