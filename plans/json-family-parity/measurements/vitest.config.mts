import { defineConfig } from 'vitest/config';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Mission-scratch tooling for json-family-parity (T0a, copied from jse): mirrors
 * `plans/gantt-divergence-drive/measurements/vitest.config.mts` — read
 * `plans/class-divergence-drive/tools/vitest.config.mts`'s doc comment for
 * why `root` is pinned to this file's own directory (a bare `include` glob
 * matches from the invocation cwd and silently pulls in the whole repo) and
 * why tests use `.test.mts` (the repo's `lint-staged` glob and every tsconfig
 * skip `plans/**`).
 *
 *   npx vitest run --config plans/json-family-parity/measurements/vitest.config.mts
 */
export default defineConfig({
  // jfp T0a: root is the brief dir (one level up) so `tools/*.test.mts`
  // (T0b's extended-baseline test) runs under the same config.
  root: dirname(dirname(fileURLToPath(import.meta.url))),
  test: {
    environment: 'node',
    include: ['measurements/**/*.test.mts', 'tools/**/*.test.mts'],
    exclude: ['**/node_modules/**'],
  },
});
