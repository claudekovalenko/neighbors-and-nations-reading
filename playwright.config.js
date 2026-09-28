// End-to-end checks on simulated phones, tablets and desktop.
// Android devices run in Chromium (Chrome's engine); iPhone/iPad in WebKit
// (Safari's engine). Run: npm run test:e2e   (CI runs every project)
import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;

export default defineConfig({
  testDir: 'e2e',
  timeout: 30_000,
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : [['list']],
  use: {
    baseURL: `http://localhost:${PORT}`,
    serviceWorkers: 'block', // test the live files, not a cached copy
    trace: 'retain-on-failure',
  },
  webServer: {
    command: `node scripts/serve.mjs ${PORT}`,
    url: `http://localhost:${PORT}/index.html`,
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    { name: 'Android · Pixel 7', use: { ...devices['Pixel 7'] } },
    { name: 'Android · Galaxy S8 (small)', use: { ...devices['Galaxy S8'] } },
    { name: 'Android · Pixel 7 · dark', use: { ...devices['Pixel 7'], colorScheme: 'dark' } },
    { name: 'iPhone 14', use: { ...devices['iPhone 14'] } },
    { name: 'iPhone SE (small)', use: { ...devices['iPhone SE'] } },
    { name: 'iPhone 14 · dark', use: { ...devices['iPhone 14'], colorScheme: 'dark' } },
    { name: 'iPad', use: { ...devices['iPad (gen 7)'] } },
    { name: 'Desktop Chrome', use: { ...devices['Desktop Chrome'] } },
  ],
});
