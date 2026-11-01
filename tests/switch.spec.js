import { test, expect } from '@playwright/test';
import { gotoReady, trackErrors } from './helpers.js';

// Both designs ship together: the switch in the header goes classic (left) <-> 3D (right).
test.describe('design switch', () => {
  test('3D to classic and back: knob side, content, no errors, nothing third-party, no cookie banner', async ({ page }) => {
    const errors = trackErrors(page);
    const external = [];
    page.on('request', (r) => { const u = r.url(); if (!/^(http:\/\/127\.0\.0\.1|http:\/\/localhost|data:|blob:)/.test(u)) external.push(u); });
    await gotoReady(page, '?intro=0&lite=1&gov=0', { settle: 800 });
    const sw = page.locator('#dswitch');
    await expect(sw).toHaveAttribute('data-state', '3d');
    const knobRight = await sw.locator('i').evaluate((el) => el.getBoundingClientRect().left - el.parentElement.getBoundingClientRect().left);
    expect(knobRight, 'knob sits on the right in the 3D design').toBeGreaterThan(15);
    await sw.click();
    await page.waitForURL(/\/classic\/?$/, { timeout: 10_000 });
    await page.waitForLoadState('load');
    await expect(page.locator('#dswitch')).toHaveAttribute('data-state', 'classic');
    await expect(page.locator('h1').first()).toContainText(/Charbel|AI/i);
    const body = await page.evaluate(() => ({
      fonts: [...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family.replace(/"/g, '')),
      banner: document.getElementById('cookieBanner'),
      endorsements: getComputedStyle(document.getElementById('testimonials')).display,
      em: document.documentElement.outerHTML.includes(String.fromCharCode(0x2014)),
      knob: (() => { const i = document.querySelector('#dswitch i'); return i.getBoundingClientRect().left - i.parentElement.getBoundingClientRect().left; })(),
    }));
    expect(body.banner).toBeNull();
    expect(body.endorsements).toBe('none');
    expect(body.em).toBe(false);
    expect(body.knob, 'knob sits on the left in the classic design').toBeLessThan(5);
    await page.waitForTimeout(500);
    await page.locator('#dswitch').click();
    await page.waitForURL((u) => !/\/classic/.test(u.pathname), { timeout: 10_000 });
    await expect(page.locator('canvas#world, .lite-stage').first()).toHaveCount(1);
    expect(external, 'no third-party requests in either design').toEqual([]);
    expect(errors).toEqual([]);
  });

  test('classic page works on its own: menu opens, links resolve, résumé and privacy exist', async ({ page, request }) => {
    const errors = trackErrors(page);
    await page.goto('/classic/', { waitUntil: 'load' });
    await page.waitForTimeout(1500);
    await page.locator('#menuBtn').click();
    await expect(page.locator('#menuBtn')).toHaveAttribute('aria-expanded', 'true');
    for (const href of ['/Charbel_Toumieh_Resume.pdf', '/privacy.html', '/terms.html', '/classic/styles.css', '/classic/script.js', '/classic/fonts/sg-500.woff2']) {
      expect((await request.get(href)).status(), href).toBe(200);
    }
    expect(errors).toEqual([]);
  });

  for (const w of [320, 360, 390]) test(`header fits at ${w}px: switch and menu button fully on screen`, async ({ page }) => {
    await page.setViewportSize({ width: w, height: 800 });
    await gotoReady(page, '?intro=0&lite=1&gov=0', { settle: 600 });
    for (const sel of ['#dswitch', '#menuBtn', '.head-cta']) {
      const b = await page.locator(sel).boundingBox();
      expect(b.x, sel).toBeGreaterThanOrEqual(0);
      expect(b.x + b.width, sel).toBeLessThanOrEqual(w - 4);
    }
    const bx = await page.locator('.brand').boundingBox(); const sx = await page.locator('.head-cta').boundingBox();
    expect(bx.x + bx.width, 'brand does not run into the buttons').toBeLessThanOrEqual(sx.x + 1);
  });

  test('the switch is reachable on a phone and in the 3D menu', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await gotoReady(page, '?intro=0&lite=1&gov=0', { settle: 600 });
    const box = await page.locator('#dswitch').boundingBox();
    expect(box.x + box.width).toBeLessThanOrEqual(390);
    expect(box.width).toBeGreaterThan(30);
    await expect(page.locator('.menu-foot a[href="classic/"]')).toHaveCount(1);
  });
});
