import { defineConfig } from '@playwright/test';

// oxlint-disable-next-line no-undef
const isCoverage = process.env.COVERAGE === 'true';

const reporter = [['line']];

if (isCoverage) {
  reporter.push([
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
  ]);
}

// oxlint-disable-next-line import/no-default-export
export default defineConfig({
  testMatch: '**/tests/e2e/**/*.spec.js',
  timeout: 15_000,
  retries: 0,
  use: {
    baseURL: 'http://localhost:4200',
  },
  reporter,
  webServer: {
    command: 'bunx http-server src -p 4200',
    url: 'http://localhost:4200',
    // oxlint-disable-next-line no-undef
    reuseExistingServer: !process.env.CI,
    stdout: 'ignore',
  },
});
