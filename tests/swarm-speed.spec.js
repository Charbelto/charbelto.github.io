import { test, expect } from '@playwright/test';
import { gotoReady } from './helpers.js';
test('toys glide calmly: no toy exceeds a gentle speed during a fast scroll', async ({ page }) => {
  await gotoReady(page, '?intro=0&gov=0', { settle: 2500 });
  const r = await page.evaluate(async () => {
    const meshes = window.__world.swarm.group.children.filter((c) => c.isInstancedMesh);
    const m0 = meshes[0]; const N = Math.min(60, m0.count);
    const read = () => { const a = m0.instanceMatrix.array; const o = []; for (let i = 0; i < N; i++) o.push(a[i * 16 + 12], a[i * 16 + 13], a[i * 16 + 14]); return o; };
    let prev = read(); let last = performance.now(); const speeds = [];
    const total = innerHeight * 6; const t0 = performance.now();
    await new Promise((res) => { const f = (now) => { scrollTo(0, Math.min(total, ((now - t0) / 2500) * total)); const cur = read(); const dt = (now - last) / 1000; let mx = 0; for (let i = 0; i < N; i++) { const d = Math.hypot(cur[i * 3] - prev[i * 3], cur[i * 3 + 1] - prev[i * 3 + 1], cur[i * 3 + 2] - prev[i * 3 + 2]); mx = Math.max(mx, d / dt); } speeds.push(mx); prev = cur; last = now; if (now - t0 < 3000) requestAnimationFrame(f); else res(); }; requestAnimationFrame(f); });
    speeds.shift(); speeds.sort((a, b) => a - b);
    return { p50: +speeds[Math.floor(speeds.length / 2)].toFixed(1), p95: +speeds[Math.floor(speeds.length * 0.95)].toFixed(1), max: +speeds[speeds.length - 1].toFixed(1) };
  });
  console.log('SPEED', JSON.stringify(r));
  expect(r.max, 'peak toy speed in world units per second').toBeLessThan(25);
});
