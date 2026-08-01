/**
 * Builds every package's `generated/` tree, and populates the two
 * asset-bearing packages' `assets/` trees, ONCE -- before any test worker
 * starts.
 *
 * `generated/`: three test files consume that tree --
 * `stdlib-packages.test.ts`, `stdlib-package-files.test.ts` and
 * `integration/stdlib-remote-e2e.test.ts` -- and each used to call
 * `buildStdlibPackages()` in its own `beforeAll`. Vitest runs test files in
 * PARALLEL WORKERS, and `build-stdlib-packages.ts#freshGeneratedDir` opens
 * with `rmSync(generatedDir, { recursive: true, force: true })`, so one file
 * was deleting the tree while another was importing out of it:
 *
 *   Failed to load url .../packages/stdlib-aws/generated/awslib14.remote.js
 *   (resolved id: ...). Does the file exist?
 *
 * Intermittent by nature -- it depended on which worker won the race -- so it
 * surfaced as a suite that passed roughly every other run (si11a T8).
 *
 * Running the build in `globalSetup` fixes the class rather than the
 * instance: `globalSetup` completes before any worker spawns, so no test ever
 * observes a half-rebuilt tree, and the ~29 MB of generated output is written
 * once per suite instead of three times.
 *
 * `packages/{stdlib-aws,stdlib-tupadr3}/assets/`: the SAME failure class hit
 * this sibling tree (SI12 T8). SI12 ADR-2/ADR-5 stopped generating an eager
 * `generated/*.js` module for these two packages -- their VERBATIM
 * round-trip and alias-resolution tests instead read the shipped `assets/`
 * copy, populated by each package's own `scripts/copy-assets.mjs`
 * (`prepack`). Once `stdlib-packages.test.ts` (write, via that script) and
 * `stdlib-package-files.test.ts` (write, via `npm pack` triggering the same
 * `prepack`) both started touching that gitignored tree in parallel workers,
 * plus `stdlib-remote-e2e.test.ts` (read, summing the tree for its baseline),
 * the identical race reappeared: `copy-assets.mjs#copyBundleAssets` opens
 * with `rmSync(destDir)`, and its `isUpToDate()` guard is file-COUNT based --
 * it only short-circuits once the copy is ALREADY COMPLETE, so during any
 * partial state one worker's `rmSync` could delete another's in-flight copy,
 * and a concurrent reader could sum whatever partial tree existed at that
 * instant. Reproduced 3/3 on a cold tree: `stdlib-remote-e2e.test.ts`'s
 * logged baseline came out 8,195,997 / 7,399,179 / 8,315,921 B instead of
 * the correct 19,850,300 B. Populating `assets/` here, before any worker
 * spawns, closes the same window the `generated/` fix above closes: by the
 * time a worker runs `copy-assets.mjs` again (via `stdlib-packages.test.ts`'s
 * `beforeAll` or `stdlib-package-files.test.ts`'s `npm pack` -> `prepack`),
 * the tree is already complete, so `isUpToDate()` short-circuits and nothing
 * is deleted.
 *
 * @see ../../scripts/build-stdlib-packages.ts
 * @see ../../packages/stdlib-aws/scripts/copy-assets.mjs
 */
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildStdlibPackages } from '../../scripts/build-stdlib-packages.js';

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const PACKAGES_DIR = join(REPO_ROOT, 'packages');

/** The two packages whose `generated/` output has no eager module (SI12
 * ADR-2/ADR-5), so their tests instead read a shipped `assets/` copy --
 * mirrors `STDLIB_AWS_PACKAGE`/`STDLIB_TUPADR3_PACKAGE` in
 * `scripts/build-stdlib-packages/package-specs.ts`. */
const ASSET_BEARING_PACKAGES: readonly string[] = ['stdlib-aws', 'stdlib-tupadr3'];

function populateAssets(): void {
  for (const packageDir of ASSET_BEARING_PACKAGES) {
    execFileSync('node', [join(PACKAGES_DIR, packageDir, 'scripts', 'copy-assets.mjs')]);
  }
}

export function setup(): void {
  buildStdlibPackages();
  populateAssets();
}
