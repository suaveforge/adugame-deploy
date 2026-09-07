const { defineConfig } = require('@playwright/test');
module.exports = defineConfig({
  testDir: './qa',
  testMatch: /v5-.*\.spec\.js/,
  timeout: 120000,
  expect: { timeout: 12000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  maxFailures: 1,
  reporter: [['list'], ['json', { outputFile: 'qa/reports/playwright-report.json' }]],
  use: {
    baseURL: 'http://127.0.0.1:4173',
    viewport: { width: 1440, height: 900 },
    headless: true,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure'
  },
  webServer: {
    command: 'python -m http.server 4173 -d .',
    url: 'http://127.0.0.1:4173/index.html',
    reuseExistingServer: false,
    timeout: 10000
  }
});
