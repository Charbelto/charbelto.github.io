import { test, expect } from '@playwright/test';
import { goKf, trackErrors } from './helpers.js';

// Phones play a pre-rendered loop of the 3D scene: forward while you scroll down, backward while you scroll up, gently looping when you stop.
test.describe('phone motion: scroll-driven frame loops', () => {
  test.use({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });

  const boot = async (page) => {
    await page.goto('/?intro=0', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#loader', { state: 'detached', timeout: 60_000 });
    await page.waitForTimeout(1500);
  };
  const pb = (page) => page.evaluate(() => window.__lite.playback);
  const waitReady = (page) => expect.poll(async () => (await pb(page)).ready[0], { timeout: 15_000 }).toBe(true);
  const hash = (page) => page.evaluate(() => {
    const cv = [...document.querySelectorAll('.lite-cv')].find((c) => +c.style.opacity > 0.5); if (!cv) return null;
    const d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data; let h = 0; for (let i = 0; i < d.length; i += 97) h = (h * 31 + d[i] + d[i + 3]) | 0; return h;
  });

  test('every chapter has a loop on screen (toys behind samples, object scenes elsewhere) and it moves when idle', async ({ page }) => {
    const errors = trackErrors(page);
    await boot(page);
    for (const kf of ['hero', 'cap1', 'w2', 'xp3']) {
      await goKf(page, kf, 700);
      await waitReady(page);
      const a = await hash(page); await page.waitForTimeout(900); const b = await hash(page);
      expect(a, `${kf} canvas has pixels`).not.toBeNull();
      expect(b, `${kf} frames change while standing still`).not.toBe(a);
    }
    expect(errors).toEqual([]);
  });

  test('scrolling down plays forward, scrolling up plays backward, stopping loops again', async ({ page }) => {
    await boot(page);
    await goKf(page, 'cap2', 700); await waitReady(page);
    await page.waitForTimeout(600);
    const idle = (await pb(page)).rate;
    expect(idle, 'idle loop runs forward at about real time').toBeGreaterThan(3);
    // a steady drag down
    let down = 0;
    for (let i = 0; i < 10; i++) { await page.evaluate(() => scrollBy(0, 28)); await page.waitForTimeout(16); down = Math.max(down, (await pb(page)).rate); }
    expect(down, 'scrolling down speeds the loop up (forward)').toBeGreaterThan(idle * 1.5);
    await page.waitForTimeout(900);
    let up = 0;
    for (let i = 0; i < 10; i++) { await page.evaluate(() => scrollBy(0, -28)); await page.waitForTimeout(16); up = Math.min(up, (await pb(page)).rate); }
    expect(up, 'scrolling up plays it backward').toBeLessThan(-1);
    await page.waitForTimeout(1500);
    expect((await pb(page)).rate, 'stopped: back to the gentle forward loop').toBeGreaterThan(3);
  });

  test('a device that cannot keep up hands the scene back to the still posters', async ({ page }) => {
    await boot(page);
    await goKf(page, 'cap2', 700); await waitReady(page);
    const cdp = await page.context().newCDPSession(page); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 20 });
    for (let i = 0; i < 40 && !(await pb(page)).off; i++) { await page.evaluate((d) => scrollBy(0, d), i % 2 ? 40 : -40); await page.waitForTimeout(250); }
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
    expect((await pb(page)).off, 'frames are switched off on a struggling device').toBe(true);
    await page.waitForTimeout(600);
    expect(await page.evaluate(() => [...document.querySelectorAll('.lite-cv')].every((c) => +c.style.opacity === 0))).toBe(true);
  });
});
