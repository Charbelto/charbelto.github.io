import { test, expect } from '@playwright/test';
import { gotoReady, goKf, trackErrors } from './helpers.js';

// Inline interactive samples: every one is simulated and says so, sits opposite its text card, is visible while you scroll,
// and works with a click.
const toChapter = async (page, kf) => {
  for (let i = 0; i < 5; i++) { // layout can still be settling (fonts, steppers): jump again until the chapter really is the active step
    await goKf(page, kf, 700);
    if (await page.locator(`.chapter.is-active[data-kf="${kf}"]`).count() || (await page.evaluate((k) => !document.querySelector(`[data-kf="${k}"]`).closest('.stepper'), kf))) break;
  }
  return page.locator(`.sample[data-demo="${kf}"]`);
};
const KFS = ['profile', 'meet', 'cap1', 'cap2', 'cap3', 'cap4', 'cap5', 'great1', 'great2', 'great3', 'w1', 'w2', 'w3', 'w4', 'w5', 'w6'];

test.describe('inline samples on desktop', () => {
  test.use({ viewport: { width: 1440, height: 900 } });
  test.beforeEach(async ({ page }) => { await gotoReady(page, '?intro=0&lite=1&gov=0&view=sample', { settle: 2200 }); });

  test('every chapter shows its sample, labelled simulated, with a visible hint, not overlapping the text card', async ({ page }) => {
    const errors = trackErrors(page);
    for (const kf of KFS) {
      const win = await toChapter(page, kf);
      await expect(win, kf).toBeVisible();
      await expect(win.locator('.sample-badge'), kf).toContainText(/simulated/i);
      await expect(win.locator('.sample-hint'), kf).toBeVisible();
      const r = await page.evaluate((k) => {
        const w = document.querySelector(`.sample[data-demo="${k}"]`).getBoundingClientRect(); const p = document.querySelector(`[data-kf="${k}"] .panel`).getBoundingClientRect();
        const overlap = !(w.right <= p.left + 1 || w.left >= p.right - 1 || w.bottom <= p.top + 1 || w.top >= p.bottom - 1);
        return { overlap, inside: w.left >= 0 && w.right <= innerWidth && w.top >= 0 && w.bottom <= innerHeight, h: w.height };
      }, kf);
      if (kf !== 'meet') expect(r.overlap, `${kf}: sample overlaps the text card`).toBe(false);
      expect(r.inside, `${kf}: sample inside the window`).toBe(true);
    }
    expect(errors).toEqual([]);
  });

  test('profile, Pip, orchestration, retrieval', async ({ page }) => {
    let w = await toChapter(page, 'profile');
    await w.getByRole('button', { name: 'Ship it' }).click();
    await expect.poll(() => w.locator('.sx-chip.is-done').count(), { timeout: 8000 }).toBeGreaterThanOrEqual(3);
    await expect(w).toHaveClass(/is-touched/);
    w = await toChapter(page, 'meet');
    await w.getByRole('tab', { name: 'Summarise my day' }).click();
    await expect(w.locator('.sx-line.is-answer')).toContainText('focus block', { timeout: 9000 });
    w = await toChapter(page, 'cap1');
    await w.getByRole('tab', { name: 'Plan a trip' }).click();
    await expect.poll(() => w.locator('.sx-line').count(), { timeout: 8000 }).toBeGreaterThanOrEqual(3);
    w = await toChapter(page, 'cap2');
    await expect(w.locator('.sample-body')).toContainText('2 of 3');
    await w.getByRole('button', { name: /Re-ranker/ }).click();
    await expect(w.locator('.sample-body')).toContainText('3 of 3');
  });

  test('MCP tools, evaluation, production, GREAT', async ({ page }) => {
    let w = await toChapter(page, 'cap3');
    await w.getByRole('tab', { name: 'search_orders' }).click();
    await expect(w.locator('.sx-json')).toContainText('tools/call', { timeout: 6000 });
    await expect(w.locator('.sx-answer')).toContainText('A-77', { timeout: 9000 });
    w = await toChapter(page, 'cap4');
    await w.locator('.sx-ans').nth(1).click();
    await expect(w.locator('.sx-verdict')).toContainText('FAIL');
    await w.locator('.sx-ans').nth(0).click();
    await expect(w.locator('.sx-verdict')).toContainText('PASS');
    await w.getByRole('button', { name: /regression/i }).click();
    await expect(w.locator('.sx-reg').last()).toContainText('%', { timeout: 6000 });
    w = await toChapter(page, 'cap5');
    await w.getByRole('tab', { name: /Prompt injection/ }).click();
    await expect.poll(() => w.locator('.sx-line').count(), { timeout: 6000 }).toBe(4);
    w = await toChapter(page, 'great1');
    await w.getByRole('tab', { name: 'Upset customer' }).click();
    await expect(w.locator('.sx-verdict')).toContainText('flagged');
    w = await toChapter(page, 'great2');
    await w.getByRole('tab', { name: 'Outbound call' }).click();
    await w.getByRole('button', { name: 'Run the pipeline' }).click();
    await expect.poll(() => w.locator('.sx-chip.is-done').count(), { timeout: 9000 }).toBeGreaterThanOrEqual(3);
    await expect(w.locator('.sx-term')).toContainText('flagged for human review');
    w = await toChapter(page, 'great3');
    await expect(w.locator('.sx-big')).toContainText('−90%');
    await w.getByRole('button', { name: /Rep quality scores/ }).click();
    await expect(w.locator('.sx-big')).toContainText('80s');
    await w.locator('.lab-slider input').first().fill('3000');
    await expect(w.locator('.sx-verdict')).toContainText('review hours saved');
  });

  test('projects: LoopGuard, DermSense prediction, OULAD, microservices, cell analyzer, supermarket', async ({ page }) => {
    let w = await toChapter(page, 'w1');
    for (let i = 0; i < 4; i++) await w.getByRole('button', { name: 'Next step' }).click();
    await expect(w.locator('.lg-verdict.is-trip')).toContainText('Loop caught at step 4');
    w = await toChapter(page, 'w2');
    await w.getByRole('tab', { name: 'Irregular lesion' }).click();
    await w.getByRole('tab', { name: '4 Predict' }).click();
    await w.getByRole('button', { name: 'Run the sample' }).click();
    await expect(w.locator('.derm-bar')).toHaveCount(14);
    await expect(w.locator('.derm-bar.is-top').first()).toContainText('mel');
    await expect(w.locator('.sample-body')).toContainText('simulated');
    w = await toChapter(page, 'w3');
    await expect.poll(() => w.locator('.oulad-fig img').evaluate((i) => i.complete && i.naturalWidth > 500), { timeout: 8000 }).toBe(true);
    w = await toChapter(page, 'w4');
    await w.getByRole('button', { name: 'Toggle orders-2' }).click();
    await expect(w.locator('.sx-term')).toContainText('DOWN');
    await w.getByRole('button', { name: 'Send 9 requests' }).click();
    await expect.poll(() => w.locator('.sx-term').innerText(), { timeout: 8000 }).toMatch(/orders-1"\} [1-9]/);
    w = await toChapter(page, 'w5');
    await w.locator('.lab-slider input').fill('100');
    await expect.poll(() => w.locator('.cell-read').innerText(), { timeout: 8000 }).toMatch(/Poor|Fair/);
    w = await toChapter(page, 'w6');
    await expect(w.locator('.mk-node')).toHaveCount(14);
    await w.locator('.mk-node').nth(3).click();
    await expect(w.locator('.mk-side h4')).toHaveText('soda');
  });

  test('the switch trades the sample for the 3D object and back', async ({ page }) => {
    const w = await toChapter(page, 'cap1');
    const shown = () => page.evaluate(() => [...document.querySelectorAll('.lite-img')].filter((i) => +i.style.opacity > 0.5).map((i) => i.getAttribute('src') || '').join());
    await page.waitForTimeout(600);
    expect(await shown()).not.toContain('cap1');
    await w.getByRole('button', { name: 'See the 3D object' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-view', 'object');
    await expect.poll(shown, { timeout: 6000 }).toContain('cap1');
    await expect(w.locator('.sample-body')).toBeHidden();
    await w.getByRole('button', { name: 'Show the sample' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-view', 'sample');
    await expect(w.locator('.sample-body')).toBeVisible();
  });
});

test.describe('inline samples on a phone', () => {
  test.use({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  test('the sample fills the band above the card, never overlaps it, and works with a tap', async ({ page }) => {
    const errors = trackErrors(page);
    await page.goto('/?intro=0', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#loader', { state: 'detached', timeout: 60_000 });
    await page.waitForTimeout(2200);
    for (const kf of ['cap1', 'cap3', 'cap5', 'great1', 'great2', 'great3', 'w2', 'w6']) {
      const w = await toChapter(page, kf);
      await expect(w, kf).toBeVisible();
      const r = await page.evaluate((k) => { const a = document.querySelector(`.sample[data-demo="${k}"]`).getBoundingClientRect(); const p = document.querySelector(`[data-kf="${k}"] .panel`).getBoundingClientRect(); return { a, pTop: p.top, vw: innerWidth, over: document.documentElement.scrollWidth - innerWidth }; }, kf);
      expect(r.a.left, kf).toBeGreaterThanOrEqual(0); expect(r.a.right, kf).toBeLessThanOrEqual(r.vw);
      expect(r.a.bottom, `${kf}: sample bottom vs card top`).toBeLessThanOrEqual(r.pTop + 2);
      expect(r.a.height, `${kf}: sample height`).toBeGreaterThan(200);
      expect(r.over).toBeLessThanOrEqual(0);
    }
    const w = await toChapter(page, 'cap3');
    await w.getByRole('tab', { name: 'get_weather' }).tap();
    await expect(w.locator('.sx-json')).toContainText('get_weather', { timeout: 6000 });
    expect(errors).toEqual([]);
  });
  test('profile and Pip: the sample sits in the flow above the card', async ({ page }) => {
    await page.goto('/?intro=0', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#loader', { state: 'detached', timeout: 60_000 });
    await page.waitForTimeout(2200);
    for (const kf of ['profile', 'meet']) {
      const r = await page.evaluate((k) => { const a = document.querySelector(`.sample[data-demo="${k}"]`).getBoundingClientRect(); const p = document.querySelector(`[data-kf="${k}"] .panel`).getBoundingClientRect(); return { aBottom: a.bottom, pTop: p.top, aH: a.height, aW: a.width, vw: innerWidth }; }, kf);
      expect(r.aBottom, kf).toBeLessThanOrEqual(r.pTop + 2); expect(r.aH).toBeGreaterThan(250); expect(r.aW).toBeLessThanOrEqual(r.vw);
    }
  });
});
