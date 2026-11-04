import { defineConfig } from '@playwright/test';

// Default: software WebGL (works anywhere, slow). GPU=1: use the machine's real GPU through ANGLE/D3D11 (much faster; use for screenshots).
export const GL_ARGS = process.env.GPU === '1'
  ? ['--enable-gpu', '--ignore-gpu-blocklist', '--use-angle=d3d11', '--enable-webgl']
  : ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl'];

export default defineConfig({
  testDir: './tests',
  timeout: 150_000,
  expect: { timeout: 20_000 },
  workers: 1,
  retries: 0,
  reporter: [['list'], ['json', { outputFile: 'qa/results.json' }]],
  outputDir: 'qa/test-output',
  use: {
    baseURL: process.env.BASE_URL || 'http://127.0.0.1:5173',
    viewport: { width: 1440, height: 900 },
    actionTimeout: 30_000,
    navigationTimeout: 60_000,
    launchOptions: { args: GL_ARGS },
  },
  webServer: {
    command: 'npx vite --port 5173 --host 127.0.0.1',
    url: 'http://127.0.0.1:5173',
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
