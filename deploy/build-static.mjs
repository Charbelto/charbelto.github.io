// The live site is plain static files at the repository root (no build step). Both hosts expect `npm run build` to
// produce a `dist` folder (GitHub Actions uploads it, Cloudflare Pages serves it), so this copies the site files there.
import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';

const FILES = ['index.html', '404.html', 'privacy.html', 'terms.html', 'thank-you.html', 'styles.css', 'script.js', 'profile.jpg', 'Charbel_Toumieh_Resume.pdf', 'robots.txt', 'sitemap.xml', 'screenshots'];
rmSync('dist', { recursive: true, force: true });
mkdirSync('dist');
for (const f of FILES) {
  if (!existsSync(f)) throw new Error(`missing site file: ${f}`);
  cpSync(f, `dist/${f}`, { recursive: true });
}
console.log(`dist ready: ${FILES.length} entries`);
