import { test } from '@playwright/test';
import { gotoReady } from './helpers.js';

// Visual review matrix. Run: npx playwright test tests/review.spec.js
// OUT=qa/review-a (default qa/review). KFS=hero,dive,... to restrict. SIZES=desktop1440,mobile390 to restrict.
const ALL_SIZES = {
  desktop1440: [1440, 900],
  desktop1280: [1280, 800],
  tablet768: [768, 1024],
  mobile390: [390, 844],
  mobile360: [360, 780],
};
const ALL_KFS = ['hero', 'profile', 'dive', 'cap1', 'cap2', 'cap3', 'cap4', 'cap5', 'great1', 'great2', 'great3',
  'w1', 'w2', 'w3', 'w4', 'w5', 'w6', 'archive', 'xp0', 'xp1', 'xp2', 'xp4', 'xp7', 'edu', 'contact'];
const OUT = process.env.OUT || 'qa/review';
const KFS = process.env.KFS ? process.env.KFS.split(',') : ALL_KFS;
const SIZES = process.env.SIZES ? process.env.SIZES.split(',') : Object.keys(ALL_SIZES);

for (const name of SIZES) {
  const [w, h] = ALL_SIZES[name];
  test.describe(`review ${name}`, () => {
    test.use({ viewport: { width: w, height: h }, isMobile: name.startsWith('mobile'), hasTouch: !name.startsWith('desktop'), deviceScaleFactor: 1 });
    test.setTimeout(900_000);
    test(`capture ${name}`, async ({ page }) => {
      const errors = [];
      page.on('pageerror', (e) => errors.push(e.message));
      page.on('console', (m) => { if (m.type() === 'error' && !/vite/i.test(m.text())) errors.push(m.text()); });
      await gotoReady(page, '?intro=0&qa=1', { settle: 2500 });
      for (const kf of KFS) {
        await page.evaluate((id) => {
          const el = id === 'archive' ? document.querySelector('.archive') : document.querySelector(`[data-kf="${id}"]`);
          const r = el.getBoundingClientRect();
          // archive is taller than a screen: show its top
          const y = id === 'archive' ? r.top + scrollY - 90 : r.top + scrollY + r.height / 2 - innerHeight / 2; // (archive: show the top of the list)
          scrollTo(0, y);
          window.__world?.snap();
        }, kf);
        await page.waitForTimeout(1800);
        await page.screenshot({ path: `${OUT}/${name}-${kf}.png` });
      }
      if (errors.length) console.log(name, 'errors', errors.slice(0, 5));
    });
  });
}
