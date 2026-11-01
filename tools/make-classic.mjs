// Builds public/classic/ (the original portfolio design) from the `main` branch, so both designs ship together.
// Changes from the original, on purpose: no Google Fonts (fonts are self-hosted), no cookie banner / analytics loader
// (the page sets no cookies and loads nothing third-party), no em dashes, the two unattributed endorsements stay hidden,
// links point at the shared résumé / privacy / terms, and a design switch sits in the header.
import { execSync } from 'node:child_process';
import { mkdirSync, writeFileSync, copyFileSync, existsSync } from 'node:fs';

const git = (p) => execSync(`git show main:${p}`, { encoding: 'utf8', maxBuffer: 1 << 26 });
const out = 'public/classic';
mkdirSync(`${out}/fonts`, { recursive: true });
const EM = String.fromCharCode(0x2014);

const noEm = (s) => s
  .split(` ${EM} `).join(', ')
  .split(EM).join('-');

/* ── html ── */
let html = git('index.html');
const cut = (re) => { if (!re.test(html)) throw new Error('classic: pattern not found ' + re); html = html.replace(re, ''); };
cut(/<link rel="preconnect" href="https:\/\/fonts\.googleapis\.com"\/>\s*/);
cut(/<link rel="preconnect" href="https:\/\/fonts\.gstatic\.com" crossorigin\/>\s*/);
cut(/<link rel="stylesheet" href="https:\/\/fonts\.googleapis\.com[^>]*>\s*/);
cut(/<!-- Google Analytics[^>]*-->\s*/);
cut(/<div class="cookie-banner"[\s\S]*?<\/div>\s*<\/div>\s*/);
html = html.replace('<meta name="theme-color"', '<meta name="robots" content="noindex, follow"/>\n<meta name="theme-color"');
// the two unattributed endorsement quotes stay hidden (same decision as the 3D design)
html = html.replace('<section class="section testimonials-sec" id="testimonials">', '<section class="section testimonials-sec" id="testimonials" hidden>');
cut(/\s*<li><a class="veil-link" href="#testimonials">[\s\S]*?<\/li>/);
cut(/\s*<a href="#testimonials">Reviews<\/a>/);
// shared files live one level up
html = html.split('href="privacy.html"').join('href="../privacy.html"').split('href="terms.html"').join('href="../terms.html"');
html = html.split('href="Charbel_Toumieh_Resume.pdf"').join('href="../Charbel_Toumieh_Resume.pdf"').split('src="profile.jpg"').join('src="../profile.jpg"');
html = html.replace('<link rel="stylesheet" href="styles.css?v=3.2.0"/>', '<link rel="stylesheet" href="styles.css?v=3.2.0"/>');
// the design switch (left = classic, right = 3D)
const sw = `<a class="dswitch" id="dswitch" href="../" data-state="classic" aria-label="Switch to the 3D design" title="Switch to the 3D design">
      <span class="dswitch-l">Classic</span><span class="dswitch-track" aria-hidden="true"><i></i></span><span class="dswitch-r">3D</span>
    </a>
    `;
if (!html.includes('<div class="head-icons">')) throw new Error('classic: header not found');
html = html.replace('<div class="head-icons">', sw + '<div class="head-icons">');
html = noEm(html);
writeFileSync(`${out}/index.html`, html);

/* ── css ── */
const face = (fam, w, file) => `@font-face { font-family: "${fam}"; font-style: normal; font-weight: ${w}; font-display: swap; src: url("fonts/${file}") format("woff2"); }\n`;
let css = noEm(git('styles.css'));
css = face('Space Grotesk', 400, 'sg-400.woff2') + face('Space Grotesk', 500, 'sg-500.woff2') + face('Space Grotesk', 600, 'sg-600.woff2') + face('Space Grotesk', 700, 'sg-700.woff2')
  + face('JetBrains Mono', 400, 'jb-400.woff2') + face('JetBrains Mono', 500, 'jb-500.woff2') + css;
css += `

[hidden] { display: none !important; }

/* ── design switch (shared with the 3D design: left = classic, right = 3D) ── */
.dswitch { display: inline-flex; align-items: center; gap: 9px; text-decoration: none; color: var(--text); font: 500 11px var(--font-m); letter-spacing: 0.1em; text-transform: uppercase; padding: 8px 4px; }
.dswitch-l, .dswitch-r { opacity: 0.5; transition: opacity 0.3s; }
.dswitch[data-state='classic'] .dswitch-l, .dswitch[data-state='3d'] .dswitch-r { opacity: 1; }
.dswitch-track { position: relative; width: 44px; height: 24px; border-radius: 999px; border: 1.5px solid currentColor; }
.dswitch-track i { position: absolute; top: 2px; left: 2px; width: 17px; height: 17px; border-radius: 50%; background: var(--accent-2); transition: transform 0.35s var(--ease); }
.dswitch[data-state='3d'] .dswitch-track i, .dswitch.is-flip .dswitch-track i { transform: translateX(20px); }
.dswitch:hover .dswitch-track, .dswitch:focus-visible .dswitch-track { border-color: var(--accent); }
.dswitch:focus-visible { outline: 2px solid var(--accent-2); outline-offset: 3px; border-radius: 999px; }
@media (max-width: 720px) { .dswitch-l, .dswitch-r { display: none; } .dswitch { padding: 6px 2px; } }
html.is-switching body { opacity: 0; transition: opacity 0.25s ease; }
`;
writeFileSync(`${out}/styles.css`, css);

/* ── js ── */
const js = noEm(git('script.js')) + `

/* ── design switch: slide the knob, fade, then go to the other design ── */
(function () {
  const a = document.getElementById('dswitch');
  if (!a) return;
  a.addEventListener('click', (e) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
    e.preventDefault();
    const slow = !matchMedia('(prefers-reduced-motion: reduce)').matches;
    a.classList.add('is-flip');
    document.documentElement.classList.add('is-switching');
    setTimeout(() => { location.href = a.href; }, slow ? 320 : 0);
  });
  addEventListener('pageshow', (e) => { if (e.persisted) { document.documentElement.classList.remove('is-switching'); a.classList.remove('is-flip'); } });
})();
`;
writeFileSync(`${out}/script.js`, js);

/* ── fonts (self-hosted from the @fontsource packages) ── */
const nm = 'node_modules/@fontsource';
for (const w of [400, 500, 600, 700]) copyFileSync(`${nm}/space-grotesk/files/space-grotesk-latin-${w}-normal.woff2`, `${out}/fonts/sg-${w}.woff2`);
for (const w of [400, 500]) copyFileSync(`${nm}/jetbrains-mono/files/jetbrains-mono-latin-${w}-normal.woff2`, `${out}/fonts/jb-${w}.woff2`);
console.log('classic written to', out);
