const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const smooth = (t) => t * t * (3 - 2 * t);
const lerp = (a, b, t) => a + (b - a) * t;
const hex2 = (v) => Math.round(clamp(v, 0, 1) * 255).toString(16).padStart(2, '0');
const toHex = (r, g, b) => `#${hex2(r)}${hex2(g)}${hex2(b)}`;
const INK_DARK = [0.043, 0.043, 0.078];

/**
 * Publishes the interpolated page colours as CSS variables (--bg, --ink, --ac): the whole page re-themes as you scroll.
 * `cur` holds bgr/bgg/bgb and acr/acg/acb (0..1). Shared by the 3D director and the lightweight (no-GPU) director.
 */
export function createColourPublisher() {
  let last = '';
  return (cur) => {
    const lum = 0.2126 * cur.bgr + 0.7152 * cur.bgg + 0.0722 * cur.bgb;
    const k = smooth(clamp((lum - 0.27) / 0.07, 0, 1)); // 0 = white ink, 1 = near-black ink
    const ink = [lerp(1, INK_DARK[0], k), lerp(1, INK_DARK[1], k), lerp(1, INK_DARK[2], k)];
    const css = `${toHex(cur.bgr, cur.bgg, cur.bgb)}|${toHex(...ink)}|${toHex(cur.acr, cur.acg, cur.acb)}`;
    if (css === last) return;
    last = css;
    const [bg, inkH, ac] = css.split('|');
    const st = document.documentElement.style;
    st.setProperty('--bg', bg); st.setProperty('--ink', inkH); st.setProperty('--ac', ac);
    st.setProperty('--lum', lum.toFixed(3));
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', bg);
  };
}
