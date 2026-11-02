import { test, expect } from '@playwright/test';
import { gotoReady, goKf, trackErrors } from './helpers.js';

// "Try a sample" panels: each opens from its project chapter, works, closes with Escape and gives focus back.
const open = async (page, kf, lab) => {
  for (let i = 0; i < 4; i++) { // layout can still be settling (fonts, steppers): jump again until the chapter really is the active step
    await goKf(page, kf, 600);
    if (await page.locator(`.chapter.is-active[data-kf="${kf}"]`).count()) break;
  }
  const btn = page.locator(`[data-lab="${lab}"]`);
  await btn.click();
  await expect(page.locator('#lab')).toHaveJSProperty('open', true);
  return btn;
};

test.describe('project sample panels', () => {
  test.beforeEach(async ({ page }) => { await gotoReady(page, '?intro=0&lite=1&gov=0', { settle: 1800 }); });

  test('LoopGuard: a rephrased search is caught, a healthy run is not, and you can type your own steps', async ({ page }) => {
    const errors = trackErrors(page);
    const btn = await open(page, 'w1', 'loopguard');
    await expect(page.locator('#labTitle')).toContainText('LoopGuard');
    const next = page.getByRole('button', { name: 'Next step' });
    for (let i = 0; i < 4; i++) await next.click();
    await expect(page.locator('.lg-verdict.is-trip')).toContainText('Loop caught at step 4');
    await expect(page.locator('.lg-verdict')).toContainText('exact-match guard would not have noticed');
    await page.getByRole('tab', { name: 'Healthy run' }).click();
    for (let i = 0; i < 4; i++) await next.click();
    await expect(page.locator('.lg-verdict.is-ok')).toContainText('No loop');
    await page.getByRole('tab', { name: 'Your own steps' }).click();
    for (const q of ['weather chicago', 'chicago weather now', 'weather now chicago', 'chicago weather today now']) {
      await page.locator('.lg-custom input[type=text]').first().fill(q);
      await page.getByRole('button', { name: 'Add step' }).click();
    }
    await expect(page.locator('.lg-step')).toHaveCount(4);
    await page.keyboard.press('Escape');
    await expect(page.locator('#lab')).toHaveJSProperty('open', false);
    await expect(btn).toBeFocused();
    expect(errors).toEqual([]);
  });

  test('DermSense: four steps render from generated images; no prediction is shown; disclaimer present', async ({ page }) => {
    const errors = trackErrors(page);
    await open(page, 'w2', 'derm');
    await expect(page.locator('.derm-img')).toBeVisible();
    await page.getByRole('tab', { name: '2 Features' }).click();
    await expect(page.locator('.derm-hist')).toBeVisible();
    await page.getByRole('tab', { name: '3 Models' }).click();
    await expect(page.locator('.derm-chip')).toHaveCount(7);
    await expect(page.locator('#labBody')).toContainText('does not run a model');
    await page.getByRole('tab', { name: '4 Explain' }).click();
    await expect(page.locator('.lab-slider input')).toBeVisible();
    await page.getByRole('tab', { name: 'Irregular lesion' }).click();
    await expect(page.locator('.lab-disclaimer')).toContainText('Not a diagnostic tool');
    expect(errors).toEqual([]);
  });

  test('OULAD: the three real figures load', async ({ page }) => {
    await open(page, 'w3', 'oulad');
    for (const tab of ['Which signals matter', 'How many features', 'How it did']) {
      await page.getByRole('tab', { name: tab }).click();
      await expect.poll(() => page.locator('.oulad-fig img').evaluate((i) => i.complete && i.naturalWidth > 500), { timeout: 8000 }).toBe(true);
    }
    await expect(page.locator('#labBody')).toContainText('CC BY 4.0');
  });

  test('Supermarket graph: 14 items, click an item, ranking and breadth-first reach update, slider filters links', async ({ page }) => {
    await open(page, 'w6', 'market');
    await expect(page.locator('.mk-node')).toHaveCount(14);
    await expect(page.locator('.mk-side h4')).toHaveText('whole milk');
    const before = await page.locator('.mk-svg line').count();
    await page.locator('.mk-node').nth(3).click();
    await expect(page.locator('.mk-side h4')).toHaveText('soda');
    await expect(page.locator('.mk-rank li').first()).toBeVisible();
    await page.locator('.lab-slider input').fill('190');
    expect(await page.locator('.mk-svg line').count()).toBeLessThan(before);
    await expect(page.locator('#labBody')).toContainText('14,963 baskets');
  });

  test('Cell Analyzer: simulated signal reacts to distance and is labelled as simulated', async ({ page }) => {
    await open(page, 'w5', 'cell');
    await expect(page.locator('.cell-read')).toContainText('dBm', { timeout: 5000 });
    await page.locator('.lab-slider input').fill('100');
    await expect.poll(async () => (await page.locator('.cell-read').innerText()), { timeout: 8000 }).toMatch(/Poor|Fair/);
    await expect(page.locator('#labBody')).toContainText('Simulated telemetry');
    await page.keyboard.press('Escape');
    await expect(page.locator('#lab')).toHaveJSProperty('open', false);
  });
});

test.describe('sample panels on a phone', () => {
  test.use({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  test('the panel fills the screen, scrolls inside itself and does not overflow sideways', async ({ page }) => {
    await page.goto('/?intro=0', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#loader', { state: 'detached', timeout: 60_000 });
    await page.waitForTimeout(1800);
    await goKf(page, 'w6', 500);
    await page.locator('[data-lab="market"]').click();
    await expect(page.locator('.mk-node')).toHaveCount(14);
    const r = await page.evaluate(() => { const d = document.getElementById('lab').getBoundingClientRect(); const b = document.getElementById('labBody'); return { w: d.width, h: d.height, vw: innerWidth, vh: innerHeight, overflowX: b.scrollWidth - b.clientWidth, page: document.documentElement.scrollWidth - innerWidth }; });
    expect(r.w).toBeLessThanOrEqual(r.vw + 1);
    expect(r.h).toBeLessThanOrEqual(r.vh + 1);
    expect(r.overflowX).toBeLessThanOrEqual(1);
    expect(r.page).toBeLessThanOrEqual(0);
  });
});
