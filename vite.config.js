import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
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
