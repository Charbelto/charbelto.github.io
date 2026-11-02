import { test, expect } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';

// Phone QA harness. Real phone emulation (touch, mobile viewport, high-density screen), the default flow (no URL flags):
// it measures what a phone user would struggle with and writes screenshots + a JSON report to qa/phone/.
// Run: npx playwright test tests/phone-audit.spec.js     (SIZES=360x640,390x844 KFS=hero,cap1 to narrow)
const OUT = process.env.OUT || 'qa/phone';
mkdirSync(OUT, { recursive: true });
const SIZES = (process.env.SIZES || '320x568,360x640,360x780,375x667,390x844,412x915,430x932').split(',').map((s) => s.split('x').map(Number));
const KFS = (process.env.KFS || 'hero,profile,meet,dive,cap1,cap2,cap3,cap4,cap5,play,great1,great2,great3,w1,w2,w3,w4,w5,w6,arc,xp0,xp3,xp7,edu,contact').split(',');

for (const [w, h] of SIZES) {
  test.describe(`phone ${w}x${h}`, () => {
    test.use({ viewport: { width: w, height: h }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
    test(`audit ${w}x${h}`, async ({ page }) => {
      test.setTimeout(300_000);
      const errors = [];
      page.on('pageerror', (e) => errors.push(e.message));
      page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
      await page.goto('/?intro=0', { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('#loader', { state: 'detached', timeout: 60_000 });
      await page.waitForTimeout(2200);
      const report = { size: `${w}x${h}`, errors, chapters: {} };
      for (const kf of KFS) {
        for (let i = 0; i < 4; i++) {
          await page.evaluate((k) => { const el = k === 'arc' ? document.querySelector('.archive') : document.querySelector(`[data-kf="${k}"]`); scrollTo(0, k === 'arc' ? el.getBoundingClientRect().top + scrollY - 80 : window.__kfY(el)); }, kf);
          await page.waitForTimeout(700);
          if (await page.evaluate((k) => { const c = document.querySelector(`[data-kf="${k}"]`); return !c || !c.closest('.stepper') || c.classList.contains('is-active'); }, kf)) break;
        }
        await page.waitForTimeout(500);
        const m = await page.evaluate(() => {
          const vw = innerWidth; const vh = innerHeight;
          const visible = (el) => { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return r.width > 1 && r.height > 1 && r.bottom > 0 && r.top < vh && cs.visibility !== 'hidden' && cs.display !== 'none' && +cs.opacity > 0.05 && !el.closest('[aria-hidden="true"]') && !el.closest('.hud'); };
          const small = []; const tiny = []; const clipped = [];
          for (const el of document.querySelectorAll('main *, .head *, .sample *')) {
            if (!visible(el)) continue;
            const own = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 1);
            if (own) { const fs = parseFloat(getComputedStyle(el).fontSize); if (fs < 12) small.push(`${el.tagName.toLowerCase()}.${(el.className || '').toString().split(' ')[0]} ${fs.toFixed(1)}px "${el.textContent.trim().slice(0, 24)}"`); }
            const cs = getComputedStyle(el);
            if ((el.tagName === 'BUTTON' || el.tagName === 'A' || el.tagName === 'SUMMARY' || el.tagName === 'INPUT' || el.getAttribute('role') === 'tab') && !el.closest('.hud')) {
              const r = el.getBoundingClientRect();
              if ((r.height < 36 || r.width < 36) && cs.display !== 'inline') tiny.push(`${el.tagName.toLowerCase()}.${(el.className || '').toString().split(' ')[0]} ${Math.round(r.width)}x${Math.round(r.height)} "${(el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 20)}"`);
            }
            const r = el.getBoundingClientRect();
            if (r.right > vw + 2 && r.left < vw && !el.closest('.marquee, .menu, .loader')) clipped.push(`${el.tagName.toLowerCase()}.${(el.className || '').toString().split(' ')[0]} right=${Math.round(r.right)}`);
          }
          const win = document.querySelector('.chapter.is-active .sample') || [...document.querySelectorAll('.sample')].find(visible);
          const panel = [...document.querySelectorAll('.chapter.is-active .panel, .chapter .panel, .chapter .wide, .xp')].find(visible);
          const sr = win?.getBoundingClientRect(); const pr = panel?.getBoundingClientRect();
          return { overflowX: document.documentElement.scrollWidth - vw, small: [...new Set(small)].slice(0, 6), tiny: [...new Set(tiny)].slice(0, 6), clipped: [...new Set(clipped)].slice(0, 4), sample: sr ? { top: Math.round(sr.top), h: Math.round(sr.height), w: Math.round(sr.width) } : null, panel: pr ? { top: Math.round(pr.top), h: Math.round(pr.height) } : null, vh };
        });
        report.chapters[kf] = m;
        await page.screenshot({ path: `${OUT}/${w}x${h}-${kf}.png` });
      }
      writeFileSync(`${OUT}/report-${w}x${h}.json`, JSON.stringify(report, null, 1));
      expect(true).toBe(true);
    });
  });
}
