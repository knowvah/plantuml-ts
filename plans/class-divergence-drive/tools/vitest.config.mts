import { defineConfig } from 'vitest/config';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Mission-scratch tooling isn't part of the main suite: the root
 * `vitest.config.ts`'s `include` is `tests/**\/*.test.ts` only, so these
 * `tools/*.test.mts` files never run under `npm test`. `root` is pinned to
 * this file's own directory (computed, never a hardcoded absolute path —
 * T0b correction 3) so a bare `vitest run --config
 * plans/class-divergence-drive/tools/vitest.config.mts` collects exactly the
 * three files here, not the whole repo (a plain `include` glob without a
 * scoped `root` matches from the invocation cwd, which silently pulled in
 * all 750+ files in `tests/` during T0b's own tooling — see
 * `.agent-notes/cdd-T0b.md`).
 *
 * Test files use the `.test.mts` extension, not the spec's literal
 * `.test.ts`: the repo's `lint-staged` config
 * (`package.json#lint-staged`) matches `*.{ts,tsx,mjs,js}` on every commit
 * — deliberately NOT `mts`/`cts` (existing `plans/**\/tools/*.mts` CLI
 * tools from prior missions rely on that exclusion, per `eslint.config.ts`'s
 * own comment about `docs-site/**` hitting the identical failure: a typed
 * ESLint rule throws instead of failing when the file is outside every
 * tsconfig's `include`, and no tsconfig here reaches `plans/`). A `.test.ts`
 * file trips that hook on every commit; `.test.mts` does not, and jiti/
 * vitest resolve it identically. See `.agent-notes/cdd-T0b.md`.
 */
export default defineConfig({
  root: dirname(fileURLToPath(import.meta.url)),
  test: {
    environment: 'node',
    include: ['**/*.test.mts'],
  },
});
