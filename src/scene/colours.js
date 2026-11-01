const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const smooth = (t) => t * t * (3 - 2 * t);
const lerp = (a, b, t) => a + (b - a) * t;
const hex2 = (v) => Math.round(clamp(v, 0, 1) * 255).toString(16).padStart(2, '0');
const toHex = (r, g, b) => `#${hex2(r)}${hex2(g)}${hex2(b)}`;
const INK_DARK = [0.043, 0.043, 0.078];
const PAGE_EVERY_MS = 90; // the whole page re-themes at about 11 Hz; each change restyles every element, so it must not run per frame

/**
 * Publishes the interpolated page colours as CSS variables (--bg, --ink, --ac): the whole page re-themes as you scroll.
 * `cur` holds bgr/bgg/bgb and acr/acg/acb (0..1). Shared by the 3D director and the lightweight (no-GPU) director.
 * The full-screen backdrop follows every frame through a variable on its own element (cheap); the rest of the page
 * (text ink, accent, glass panels) is throttled, and a trailing update always lands the final colour.
 */
export function createColourPublisher() {
  let last = '';
  let applied = '';
  let lastT = -1e9;
  let timer = 0;
  const atmos = document.querySelector('.atmos');
  const meta = document.querySelector('meta[name="theme-color"]');
  const apply = (css) => {
    timer = 0;
    lastT = performance.now();
    if (css === applied) return;
    applied = css;
    const [bg, inkH, ac, lum] = css.split('|');
    const st = document.documentElement.style;
    st.setProperty('--bg', bg); st.setProperty('--ink', inkH); st.setProperty('--ac', ac);
    st.setProperty('--lum', lum);
    if (meta) meta.setAttribute('content', bg);
  };
  const publish = (cur) => {
    const lum = 0.2126 * cur.bgr + 0.7152 * cur.bgg + 0.0722 * cur.bgb;
    const k = smooth(clamp((lum - 0.27) / 0.07, 0, 1)); // 0 = white ink, 1 = near-black ink
    const ink = [lerp(1, INK_DARK[0], k), lerp(1, INK_DARK[1], k), lerp(1, INK_DARK[2], k)];
    const bg = toHex(cur.bgr, cur.bgg, cur.bgb);
    const css = `${bg}|${toHex(...ink)}|${toHex(cur.acr, cur.acg, cur.acb)}|${lum.toFixed(3)}`;
    if (css === last) return;
    last = css;
    atmos?.style.setProperty('--bg-live', bg);
    const wait = PAGE_EVERY_MS - (performance.now() - lastT);
    if (wait <= 0) { clearTimeout(timer); apply(css); }
    else if (!timer) timer = setTimeout(() => apply(last), wait);
  };
  publish.flush = () => { clearTimeout(timer); if (last) apply(last); }; // jump cuts (snap) and tests want the page colour right now
  return publish;
}
