import { test } from '@playwright/test';
import { gotoReady } from './helpers.js';

// Frame-rate probe per chapter. Run on a real GPU:  GPU=1 npx playwright test tests/perf.spec.js
// Output is printed (and attached) - nothing here asserts a number, because FPS depends on the machine.
const KFS = ['hero', 'meet', 'profile', 'cap1', 'cap3', 'play', 'great1', 'w2', 'w4', 'w6', 'xp3', 'xp7', 'contact'];

test('frame-rate probe', async ({ page }) => {
  test.setTimeout(300_000);
  await page.setViewportSize({ width: 1920, height: 1080 });
  await gotoReady(page, '?intro=0&gov=0&perf=1', { settle: 3000 });
  const gpu = await page.evaluate(() => {
    const gl = document.createElement('canvas').getContext('webgl2');
    const e = gl?.getExtension('WEBGL_debug_renderer_info');
    return e ? gl.getParameter(e.UNMASKED_RENDERER_WEBGL) : 'unknown';
  });
  const rows = [];
  for (const kf of KFS) {
    const r = await page.evaluate(async (id) => {
      const el = document.querySelector(`[data-kf="${id}"]`);
      scrollTo(0, window.__kfY(el));
      window.__world.snap();
      await new Promise((res) => setTimeout(res, 1200));
      const info = window.__world.renderer.info;
      let n = 0; let worst = 0; let last = performance.now(); const t0 = last;
      await new Promise((res) => { const f = (now) => { worst = Math.max(worst, now - last); last = now; n++; if (now - t0 < 3000) requestAnimationFrame(f); else res(); }; requestAnimationFrame(f); });
      const dt = performance.now() - t0;
      return { fps: Math.round((n * 1000) / dt), avgMs: +(dt / n).toFixed(1), worstMs: Math.round(worst), draws: info.render.calls, trisK: Math.round(info.render.triangles / 1000) };
    }, kf);
    rows.push({ kf, ...r });
  }
  console.log(`GPU: ${gpu}\n` + JSON.stringify(rows, null, 1));
});
