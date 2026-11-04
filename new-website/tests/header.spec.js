import { test, expect } from '@playwright/test';
import { gotoReady } from './helpers.js';

// The header must fit on small phones: brand, Contact and the menu button all fully on screen, nothing overlapping.
for (const w of [320, 360, 390]) {
  test(`header fits at ${w}px`, async ({ page }) => {
    await page.setViewportSize({ width: w, height: 800 });
    await gotoReady(page, '?intro=0&lite=1&gov=0', { settle: 600 });
    for (const sel of ['#menuBtn', '.head-cta']) {
      const b = await page.locator(sel).boundingBox();
      expect(b.x, sel).toBeGreaterThanOrEqual(0);
      expect(b.x + b.width, sel).toBeLessThanOrEqual(w - 4);
    }
    const brand = await page.locator('.brand').boundingBox(); const cta = await page.locator('.head-cta').boundingBox();
    expect(brand.x + brand.width, 'brand does not run into the buttons').toBeLessThanOrEqual(cta.x + 1);
  });
}
test('the design switch is gone, and so is the classic copy', async ({ page, request }) => {
  await gotoReady(page, '?intro=0&lite=1&gov=0', { settle: 600 });
  await expect(page.locator('#dswitch')).toHaveCount(0);
  await expect(page.locator('a[href*="classic"]')).toHaveCount(0);
  const r = await request.get('/classic/index.html');
  expect((await r.text()).includes('charbel<b>.toumieh</b>'), 'old design is not served').toBe(false);
});
