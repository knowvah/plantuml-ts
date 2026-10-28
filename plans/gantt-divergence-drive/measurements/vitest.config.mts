import { defineConfig } from 'vitest/config';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Mission-scratch tooling for gantt-divergence-drive (T0b): mirrors
 * `plans/class-divergence-drive/tools/vitest.config.mts` — read its doc
 * comment for why `root` is pinned to this file's own directory (a bare
 * `include` glob matches from the invocation cwd and silently pulls in the
 * whole repo) and why tests use `.test.mts` (the repo's `lint-staged` glob
 * and every tsconfig skip `plans/**`). That config cannot run
 * `pin-gantt.test.mts` itself: its `root` is `plans/class-divergence-drive/
 * tools/`, so a path filter outside it collects nothing.
 *
 *   npx vitest run --config plans/gantt-divergence-drive/measurements/vitest.config.mts
 */
export default defineConfig({
  root: dirname(fileURLToPath(import.meta.url)),
  test: {
    environment: 'node',
    include: ['**/*.test.mts'],
  },
});
