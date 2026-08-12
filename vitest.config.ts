import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['tests/**/*.test.ts'],
    // Generates `packages/*/generated/` once, before any worker starts.
    // Three test files read that tree and each used to rebuild it in its own
    // `beforeAll`; since the build `rmSync`s the directory first, parallel
    // workers raced and the suite passed only ~every other run. See the
    // module's own comment for the failure signature (si11a T8).
    globalSetup: ['tests/helpers/build-stdlib-globalsetup.ts'],
    exclude: ['tests/e2e/**'],
    passWithNoTests: true,
    coverage: {
      provider: 'v8',
      // Vitest 4 removed `coverage.all` (and `coverage.extensions`): reports
      // now include only files the run actually touched, which is exactly
      // what `all: false` used to select. The behaviour is unchanged; the
      // option that expressed it is gone. `include` still scopes analysis to
      // src, and is now the only knob that does.
      include: ['src/**/*.ts'],
      thresholds: {
        lines: 90,
        branches: 90,
        functions: 90,
      },
    },
  },
});
