import { defineConfig } from 'vitest/config';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Mission-scratch tooling for data-diagram-conformance (T0a): mirrors
 * `plans/gantt-divergence-drive/measurements/vitest.config.mts` — read
 * `plans/class-divergence-drive/tools/vitest.config.mts`'s doc comment for
 * why `root` is pinned to this file's own directory (a bare `include` glob
 * matches from the invocation cwd and silently pulls in the whole repo) and
 * why tests use `.test.mts` (the repo's `lint-staged` glob and every tsconfig
 * skip `plans/**`).
 *
 *   npx vitest run --config plans/data-diagram-conformance/measurements/vitest.config.mts
 */
export default defineConfig({
  root: dirname(fileURLToPath(import.meta.url)),
  test: {
    environment: 'node',
    include: ['**/*.test.mts'],
  },
});
