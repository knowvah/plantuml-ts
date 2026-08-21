/**
 * stdlib-build-race harness, writer half (promoted from T0's scratch
 * probe `scripts_scratch/T0/writer.ts`, semantics unchanged). Calls the
 * REAL `buildStdlibPackages()` (`scripts/build-stdlib-packages.ts`) in a
 * tight loop to simulate a second concurrent `npm test` run's
 * `globalSetup` rebuilding the shared `packages/*​/generated/` tree while
 * another process is importing out of it. Not a reimplementation --
 * imports the actual exported function.
 *
 * Committed (not scratch) per the stdlib-build-race mission's Batch 1:
 * this is the artifact `tests/integration/stdlib-build-race.test.ts`
 * spawns, so the race stays reproducible after `scripts_scratch/T0/` is
 * removed.
 *
 * Usage: jiti tests/helpers/stdlib-build-race-writer.ts <iterations> <delayMs>
 *
 * @see .agent-notes/sre-T0.md -- diagnosis artifact these constants proved
 */
import { buildStdlibPackages } from '../../scripts/build-stdlib-packages.js';

const iterations = Number(process.argv[2] ?? 50);
const delayMs = Number(process.argv[3] ?? 5);

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main(): Promise<void> {
  for (let i = 0; i < iterations; i++) {
    buildStdlibPackages();
    process.stdout.write(`writer: build ${i + 1}/${iterations} done at ${Date.now()}\n`);
    await sleep(delayMs);
  }
}

void main();
