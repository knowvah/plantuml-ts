/**
 * Builds every package's `generated/` tree ONCE, before any test worker starts.
 *
 * Three test files consume that tree -- `stdlib-packages.test.ts`,
 * `stdlib-package-files.test.ts` and `integration/stdlib-remote-e2e.test.ts`
 * -- and each used to call `buildStdlibPackages()` in its own `beforeAll`.
 * Vitest runs test files in PARALLEL WORKERS, and
 * `build-stdlib-packages.ts#freshGeneratedDir` opens with
 * `rmSync(generatedDir, { recursive: true, force: true })`, so one file was
 * deleting the tree while another was importing out of it:
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
 * @see ../../scripts/build-stdlib-packages.ts
 */

import { buildStdlibPackages } from '../../scripts/build-stdlib-packages.js';

export function setup(): void {
  buildStdlibPackages();
}
