import { test } from '@playwright/test';
import { gotoReady } from './helpers.js';

const SIZES = { desktop: [1440, 900], tablet: [820, 1180], mobile: [390, 844] };
const KFS = ['hero', 'dive', 'cap2', 'great2', 'w1', 'w3', 'xp', 'contact'];

for (const [name, [w, h]] of Object.entries(SIZES)) {
  test.describe(`shots ${name}`, () => {
    test.use({ viewport: { width: w, height: h }, isMobile: name === 'mobile', hasTouch: name !== 'desktop', deviceScaleFactor: 1 });
    test.setTimeout(500_000);
    test(`capture ${name}`, async ({ page }) => {
      const errors = [];
      page.on('pageerror', (e) => errors.push(e.message));
      for (const kf of KFS) {
        await gotoReady(page, `?intro=0&at=${kf}`, { settle: 6500 });
        // software rendering starves gsap (lagSmoothing), so wait for reveals to actually finish
        await page.waitForFunction(() => [...document.querySelectorAll('[data-intro], .bt-line, .panel, .wide')].every((e) => { const r = e.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) return true; return +getComputedStyle(e).opacity > 0.98; }), null, { timeout: 90_000 }).catch(() => {});
        await page.waitForTimeout(1500);
        await page.screenshot({ path: `qa/screenshots/${name}-${kf}.png` });
      }
      if (errors.length) console.log(name, 'pageerrors', errors);
    });
  });
}
