import { test, expect } from '@playwright/test';
import { gotoReady } from './helpers.js';

// The menu must work at any zoom level: every link reachable, nothing cut off, the colour wipe covers the whole window.
const SIZES = [[640, 300], [480, 240], [320, 480], [1280, 720], [1920, 900], [3840, 2160], [5000, 2400]];
for (const [w, h] of SIZES) {
  test(`menu at ${w}x${h}: all links reachable, wipe covers the window`, async ({ page }) => {
    await page.setViewportSize({ width: w, height: h });
    await gotoReady(page, '?intro=0&lite=1&gov=0', { settle: 600 });
    await page.locator('#menuBtn').click();
    await page.waitForTimeout(1500);
    const r = await page.evaluate(() => {
      const menu = document.getElementById('menu'); const links = [...menu.querySelectorAll('ol a')];
      const head = document.getElementById('head').getBoundingClientRect();
      const first = links[0].getBoundingClientRect(); menu.scrollTop = 0;
      const topOk = links[0].getBoundingClientRect().top >= head.bottom - 4;
      menu.scrollTop = menu.scrollHeight;
      const last = menu.querySelector('.menu-foot').getBoundingClientRect();
      const wipe = getComputedStyle(menu.querySelector('.menu-wipe--b')).clipPath;
      const radius = parseFloat((wipe.match(/circle\(([\d.]+)px/) || [])[1] || 0);
      const mx = parseFloat(menu.style.getPropertyValue('--mx')); const my = parseFloat(menu.style.getPropertyValue('--my'));
      const farthest = Math.hypot(Math.max(mx, innerWidth - mx), Math.max(my, innerHeight - my));
      return { n: links.length, topOk, footBottom: last.bottom, vh: innerHeight, scrollable: menu.scrollHeight > menu.clientHeight, radius, farthest, overflowX: menu.scrollWidth > menu.clientWidth + 1 };
    });
    expect(r.n).toBe(8);
    expect(r.topOk, 'first link sits below the header when scrolled to the top').toBe(true);
    expect(r.footBottom, 'the footer links are reachable at the bottom of the menu').toBeLessThanOrEqual(r.vh + 1);
    expect(r.radius, 'wipe radius reaches the farthest corner').toBeGreaterThanOrEqual(r.farthest - 2);
    expect(r.overflowX).toBe(false);
    // a link works from the open menu
    await page.evaluate(() => { document.getElementById('menu').scrollTop = 0; });
    await page.locator('#menu ol a[href="#contact"]').scrollIntoViewIfNeeded();
    await page.locator('#menu ol a[href="#contact"]').click();
    await page.waitForTimeout(600);
    await expect(page.locator('#menuBtn')).toHaveAttribute('aria-expanded', 'false');
  });
}
