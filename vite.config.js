import { defineConfig } from 'vite';
import { resolve } from 'node:path';

// /classic/ is a static copy of the original design (public/classic); make dev and preview serve its index like a real host does
const classicIndex = () => {
  const rewrite = (req, _res, next) => { if (/^\/classic\/?(\?.*)?$/.test(req.url || '')) req.url = '/classic/index.html'; next(); };
  return { name: 'classic-index', configureServer(s) { s.middlewares.use(rewrite); }, configurePreviewServer(s) { s.middlewares.use(rewrite); } };
};

export default defineConfig({
  plugins: [classicIndex()],
  base: '/',
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        privacy: resolve(__dirname, 'privacy.html'),
        terms: resolve(__dirname, 'terms.html'),
        notFound: resolve(__dirname, '404.html'),
        thanks: resolve(__dirname, 'thank-you.html'),
      },
    },
  },
  server: { host: '127.0.0.1' },
});
