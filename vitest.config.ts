import { tmpdir } from 'node:os';

import { defineConfig } from 'vitest/config';

import {
  COVERAGE_ISOLATE_ENV_VAR,
  resolveCoverageReportsDirectory,
} from './tests/helpers/coverage-reports-directory.js';

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
      // Vitest derives its raw-shard scratch dir as `resolve(reportsDirectory,
      // '.tmp')` and `rm -rf`s it at run start, so two concurrent runs sharing
      // this value delete each other's shards mid-flight -- the second run's
      // start-of-run clean kills the first, which then dies during report
      // generation with `ENOENT ... .tmp/coverage-<n>.json`. Vitest documents
      // this as a usage constraint (it has a dedicated error for it) rather
      // than fixing it, so the caller must keep the directories apart.
      //
      // Off by default: an ordinary `npm test`, and CI, resolve the plain
      // 'coverage' default and are unaffected. Set COVERAGE_ISOLATE=1 when
      // deliberately running two suites at once. See
      // `.agent-notes/coverage-tmp-race.md`.
      reportsDirectory: resolveCoverageReportsDirectory({
        isolate: process.env[COVERAGE_ISOLATE_ENV_VAR],
        pid: process.pid,
        tmpDir: tmpdir(),
      }),
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
