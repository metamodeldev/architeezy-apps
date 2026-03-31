import { defineConfig } from '@playwright/test';

// oxlint-disable-next-line import/no-default-export
export default defineConfig({
  testMatch: '**/tests/e2e/**/*.spec.js',
  timeout: 10_000,
  retries: 1,
  use: {
    baseURL: 'http://localhost:4200',
  },
  reporter: [
    ['list'],
    [
      'monocart-reporter',
      {
        name: 'E2E Coverage',
        outputFile: './coverage/e2e/index.html',
        coverage: {
          entryFilter: (entry) =>
            entry.url.includes('/graph/js/') || entry.url.includes('/table/js/'),
          reports: ['v8', 'console-details'],
        },
      },
    ],
  ],
  webServer: {
    command: 'bunx http-server src -p 4200',
    url: 'http://localhost:4200',
    // oxlint-disable-next-line no-undef
    reuseExistingServer: !process.env.CI,
    stdout: 'ignore',
  },
});
