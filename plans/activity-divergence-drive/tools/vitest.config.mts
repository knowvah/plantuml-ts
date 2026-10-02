import { defineConfig } from 'vitest/config';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Mission-scratch tooling isn't part of the main suite: the root
 * `vitest.config.ts`'s `include` is `tests/**\/*.test.ts` only, so
 * `tools/*.test.mts` files here never run under `npm test`. `root` is
 * pinned to this file's own directory (computed, never a hardcoded
 * absolute path — same correction `class-divergence-drive`'s own tools
 * config documents) so a bare `npx vitest run --config
 * plans/activity-divergence-drive/tools/vitest.config.mts` collects
 * exactly this directory's test files, not the whole repo.
 *
 * `.test.mts`, not `.test.ts`: the repo's `lint-staged` config
 * (`package.json#lint-staged`) matches `*.{ts,tsx,mjs,js}` on every commit,
 * deliberately NOT `mts`/`cts` — a typed ESLint rule throws (rather than
 * failing) on a file outside every tsconfig's `include`, and no tsconfig
 * reaches `plans/`. See `plans/class-divergence-drive/tools/
 * vitest.config.mts`'s identical note.
 */
export default defineConfig({
  root: dirname(fileURLToPath(import.meta.url)),
  test: {
    environment: 'node',
    include: ['**/*.test.mts'],
  },
});
