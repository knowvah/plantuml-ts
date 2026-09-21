import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  // Playwright empties outputDir before every run. The default is
  // `test-results/`, which holds the committed dot-cache and gitignored
  // oracle baselines that cannot be regenerated -- never point it there.
  outputDir: 'playwright-results',
  use: {
    browserName: 'chromium',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    port: 5173,
    reuseExistingServer: !process.env['CI'],
  },
});
