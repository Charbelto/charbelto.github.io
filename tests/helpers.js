export const IGNORE = [/\[vite\]/i, /favicon/i];

/** Collect console errors + uncaught page errors (ignoring Vite HMR chatter). */
export function trackErrors(page) {
  const errors = [];
  page.on('console', (m) => {
    if (m.type() !== 'error') return;
    const t = m.text();
    if (IGNORE.some((r) => r.test(t))) return;
    errors.push(`console.error: ${t}`);
  });
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('requestfailed', (r) => {
    const u = r.url();
    if (/fonts\.(googleapis|gstatic)\.com/.test(u)) return; // fonts have fallbacks
    errors.push(`requestfailed: ${u} ${r.failure()?.errorText}`);
  });
  return errors;
}

/** Navigate and wait for the loader to be gone + a few frames. */
export async function gotoReady(page, qs = '?intro=0&q=low&gov=0', { settle = 3000 } = {}) {
  if (!/[?&]lite=/.test(qs)) qs += (qs.includes('?') ? '&' : '?') + 'lite=0';
  if (!/[?&]smooth=/.test(qs)) qs += '&smooth=0'; // deterministic scrolling for tests (the smooth-wheel test turns it on)
  await page.goto('/' + qs, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#loader', { state: 'detached', timeout: 90_000 });
  await page.waitForTimeout(settle);
}

export const REPO_LINKS = [
  'https://github.com/Charbelto/loopguard',
  'https://github.com/Charbelto/DermSense-Skin-Disease-Classifier',
  'https://github.com/Charbelto/OULAD-Learning-Analytics',
  'https://github.com/Charbelto/ecommerce_Charbel_Toumieh',
  'https://github.com/Charbelto/Network-Cell-Analyzer',
  'https://github.com/Charbelto/DSA-Supermarket-Analysis',
];

/** Scroll so a chapter's camera marker is mid-screen (works for virtual steps inside pinned groups) and let it settle. */
export async function goKf(page, name, wait = 900) {
  await page.evaluate((n) => { scrollTo(0, window.__kfY(document.querySelector(`[data-kf="${n}"]`))); }, name);
  await page.waitForTimeout(wait);
}
