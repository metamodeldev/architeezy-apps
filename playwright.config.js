import { defineConfig } from '@playwright/test';

export default defineConfig({
  testMatch: '**/tests/e2e/**/*.spec.js',
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
          entryFilter: (entry) => entry.url.includes('/lens/js/') || entry.url.includes('/pivot/js/'),
          reports: ['v8', 'console-details'],
        },
      },
    ],
  ],
  webServer: {
    command: 'npx http-server src -p 4200',
    url: 'http://localhost:4200',
    reuseExistingServer: !process.env.CI,
    stdout: 'ignore',
  },
});
