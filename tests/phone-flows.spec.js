import { test, expect } from '@playwright/test';
import { goKf, trackErrors } from './helpers.js';

// Everything a phone user can tap, with real touch events, at several phone sizes (default flow: no URL flags).
const SIZES = [[320, 568], [360, 640], [390, 844], [412, 915]];

const boot = async (page) => {
  await page.goto('/?intro=0', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#loader', { state: 'detached', timeout: 60_000 });
  await page.waitForTimeout(2000);
};
const toStep = async (page, kf) => {
  for (let i = 0; i < 5; i++) {
    await goKf(page, kf, 700);
    if (await page.evaluate((k) => { const c = document.querySelector(`[data-kf="${k}"]`); return !c.closest('.stepper') || c.classList.contains('is-active'); }, kf)) return;
  }
};

for (const [w, h] of SIZES) {
  test.describe(`phone flows ${w}x${h}`, () => {
    test.use({ viewport: { width: w, height: h }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });

    test('menu: opens, every link works and closes it; header button reaches Contact', async ({ page }) => {
      const errors = trackErrors(page);
      await boot(page);
      const ids = await page.evaluate(() => [...document.querySelectorAll('#menu ol a')].map((a) => a.getAttribute('href')));
      expect(ids.length).toBe(8);
      for (const id of ids) {
        await page.locator('#menuBtn').tap();
        await expect(page.locator('#menuBtn')).toHaveAttribute('aria-expanded', 'true');
        await page.waitForTimeout(900);
        const link = page.locator(`#menu ol a[href="${id}"]`);
        await link.scrollIntoViewIfNeeded();
        const box = await link.boundingBox();
        expect(box.height, `${id} tap target`).toBeGreaterThanOrEqual(36);
        expect(box.x + box.width, `${id} inside screen`).toBeLessThanOrEqual(w + 1);
        await link.tap();
        await expect(page.locator('#menuBtn')).toHaveAttribute('aria-expanded', 'false');
        await page.waitForTimeout(900);
        const top = await page.evaluate((sel) => { const el = document.querySelector(sel); return el ? el.getBoundingClientRect().top : null; }, id);
        expect(top, `${id} is on screen after the jump`).not.toBeNull();
        expect(top, `${id} top`).toBeLessThan(h * 0.8);
        expect(top, `${id} top`).toBeGreaterThan(-h * 1.2);
      }
      await page.locator('.head-cta').tap();
      await page.waitForTimeout(1200);
      expect(await page.evaluate(() => document.querySelector('#contact').getBoundingClientRect().top)).toBeLessThan(h * 0.5);
      expect(errors).toEqual([]);
    });

    test('step pips jump between steps; the compact card opens its details and returns to the sample', async ({ page }) => {
      await boot(page);
      await toStep(page, 'cap1');
      await page.locator('.chapter[data-kf="cap1"]').evaluate((c) => c.closest('.stepper').scrollIntoView());
      await toStep(page, 'cap1');
      const pip = await page.locator('.stepper .chapter[data-kf="cap1"]').evaluate((c) => { const b = c.closest('.stepper').querySelectorAll('.step-pips button')[2].getBoundingClientRect(); return [b.width, b.height]; });
      expect(pip[0], 'pip hit area').toBeGreaterThanOrEqual(10);
      await page.locator('.stepper:has([data-kf="cap1"]) .step-pips button').nth(2).tap({ force: true });
      await page.waitForTimeout(1600);
      await expect(page.locator('.chapter.is-active[data-kf="cap3"]')).toHaveCount(1);
      // compact card: details toggle
      const sample = page.locator('.sample[data-demo="cap3"]');
      await expect(sample).toBeVisible();
      const card = page.locator('.chapter[data-kf="cap3"] .panel');
      const compactH = (await card.boundingBox()).height;
      expect(compactH, 'compact card height').toBeLessThan(h * 0.36);
      await page.locator('.chapter[data-kf="cap3"] .panel-more').tap();
      await expect(card).toHaveClass(/is-open/);
      await expect(sample).toBeHidden();
      await expect(page.locator('.chapter[data-kf="cap3"] .panel .tags')).toBeVisible();
      const openBox = await card.boundingBox();
      expect(openBox.y, 'open card stays below the header').toBeGreaterThan(60);
      await page.locator('.chapter[data-kf="cap3"] .panel-more').tap();
      await expect(sample).toBeVisible();
    });

    test('samples: the window is usable (tabs reachable, big enough, tap targets), and the 3D switch works', async ({ page }) => {
      await boot(page);
      for (const kf of ['cap1', 'cap2', 'cap3', 'cap4', 'cap5', 'great1', 'w1', 'w2', 'w4', 'w6']) {
        await toStep(page, kf);
        const m = await page.evaluate((k) => {
          const win = document.querySelector(`.sample[data-demo="${k}"]`); const r = win.getBoundingClientRect(); const card = document.querySelector(`[data-kf="${k}"] .panel`).getBoundingClientRect();
          const first = win.querySelector('.lab-tab, .sx-chip, .btn, .sx-ans, .mk-node, input[type=range]'); const fr = first.getBoundingClientRect(); const body = win.querySelector('.sample-body').getBoundingClientRect();
          const tgt = [...win.querySelectorAll('button, [role=tab]')].filter((b) => b.getBoundingClientRect().width > 0).map((b) => Math.round(b.getBoundingClientRect().height));
          return { h: r.height, bottom: r.bottom, cardTop: card.top, firstVisible: fr.top >= body.top - 1 && fr.bottom <= body.bottom + 1, minTap: Math.min(...tgt), bodyH: body.height };
        }, kf);
        expect(m.h, `${kf}: window height`).toBeGreaterThanOrEqual(h < 600 ? 190 : 240);
        expect(m.bodyH, `${kf}: body height`).toBeGreaterThanOrEqual(130);
        expect(m.firstVisible, `${kf}: first control is visible without scrolling`).toBe(true);
        expect(m.minTap, `${kf}: smallest tap target`).toBeGreaterThanOrEqual(32);
        expect(m.bottom, `${kf}: no overlap with the card`).toBeLessThanOrEqual(m.cardTop + 2);
      }
      // the switch: 3D object appears, window collapses to a tab, and back
      await toStep(page, 'cap1');
      const w = page.locator('.sample[data-demo="cap1"]');
      await w.locator('.sample-toggle').tap();
      await expect(page.locator('html')).toHaveAttribute('data-view', 'object');
      await expect.poll(() => page.evaluate(() => [...document.querySelectorAll('.lite-img')].filter((i) => +i.style.opacity > 0.5).map((i) => i.getAttribute('src') || '').join()), { timeout: 6000 }).toContain('cap1');
      expect((await w.boundingBox()).height).toBeLessThan(80);
      await w.locator('.sample-toggle').tap();
      await expect(page.locator('html')).toHaveAttribute('data-view', 'sample');
    });

    test('case-breakdown modals, FAQ, archive filters, contact actions', async ({ page }) => {
      await boot(page);
      await toStep(page, 'w1');
      await page.locator('.chapter[data-kf="w1"] [data-modal="loopguard"]').tap();
      const modal = page.locator('#caseModal');
      await expect(modal).toBeVisible();
      const mb = await page.locator('#caseModal .modal-box').boundingBox();
      expect(mb.width).toBeLessThanOrEqual(w + 1); expect(mb.height).toBeLessThanOrEqual(h + 1);
      const cb = await page.locator('#caseModal .modal-close').boundingBox();
      expect(Math.min(cb.width, cb.height), 'close button size').toBeGreaterThanOrEqual(36);
      await page.locator('#caseModal .modal-close').tap();
      await expect(modal).toBeHidden();
      await toStep(page, 'great3');
      await page.locator('.chapter[data-kf="great3"] [data-modal="great"]').tap();
      await expect(modal).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(modal).toBeHidden();
      // FAQ
      await page.evaluate(() => document.querySelector('#faq').scrollIntoView());
      await page.waitForTimeout(600);
      const sum = page.locator('#faq summary').first();
      await sum.tap();
      await expect(page.locator('#faq details').first()).toHaveAttribute('open', '');
      expect((await sum.boundingBox()).height).toBeGreaterThanOrEqual(36);
      // archive filter chips
      await page.evaluate(() => document.querySelector('.archive').scrollIntoView());
      await page.waitForTimeout(600);
      const before = await page.locator('.arc-list li:visible').count();
      await page.locator('.chip', { hasText: 'systems' }).first().tap();
      await page.waitForTimeout(500);
      expect(await page.locator('.arc-list li:visible').count()).toBeLessThan(before);
      // contact
      await page.evaluate(() => document.querySelector('#contact').scrollIntoView());
      await page.waitForTimeout(900);
      const mail = await page.locator('a.mail').boundingBox();
      expect(mail.x + mail.width).toBeLessThanOrEqual(w);
      expect(mail.height).toBeGreaterThanOrEqual(36);
      await page.locator('#copyMail, #copyBtn, button:has-text("Copy address")').first().tap();
      await expect(page.locator('body')).toContainText(/copied|copy/i);
    });

    test('no sideways overflow anywhere in the page', async ({ page }) => {
      await boot(page);
      const total = await page.evaluate(() => document.documentElement.scrollHeight);
      let worst = 0;
      for (let y = 0; y < total; y += Math.round(h * 0.7)) { await page.evaluate((v) => scrollTo(0, v), y); await page.waitForTimeout(120); worst = Math.max(worst, await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)); }
      expect(worst).toBeLessThanOrEqual(0);
    });
  });
}

test.describe('landscape phone', () => {
  test.use({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  test('card and sample sit side by side, both inside the short screen', async ({ page }) => {
    await boot(page);
    for (const kf of ['cap1', 'cap3', 'w2']) {
      await toStep(page, kf);
      const r = await page.evaluate((k) => { const s = document.querySelector(`.sample[data-demo="${k}"]`).getBoundingClientRect(); const p = document.querySelector(`[data-kf="${k}"] .panel`).getBoundingClientRect(); return { s, p, vw: innerWidth, vh: innerHeight, overlap: !(s.right <= p.left + 1 || s.left >= p.right - 1) && !(s.bottom <= p.top + 1 || s.top >= p.bottom - 1) }; }, kf);
      expect(r.overlap, `${kf}: sample and card overlap`).toBe(false);
      expect(r.s.top, `${kf} sample top`).toBeGreaterThanOrEqual(50); expect(r.s.bottom, `${kf} sample bottom`).toBeLessThanOrEqual(r.vh + 1);
      expect(r.s.height, `${kf} sample height`).toBeGreaterThan(200);
    }
    await page.locator('#menuBtn').tap();
    await expect(page.locator('#menuBtn')).toHaveAttribute('aria-expanded', 'true');
    const last = await page.locator('#menu ol a').last().boundingBox();
    expect(last).not.toBeNull();
  });
});
