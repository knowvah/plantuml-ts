/**
 * stdlib-build-race harness, reader half (promoted from T0's scratch
 * probe `scripts_scratch/T0/reader.ts`, semantics unchanged). Repeatedly
 * `import()`s the real `tupadr3.remote.js` the writer half's
 * `buildStdlibPackages()` emits, with a cache-busting query string on
 * every attempt (Node's ESM loader treats the query as part of the
 * module cache key, so each attempt is a fresh filesystem read, not a
 * cached hit) -- otherwise a single successful import would be served
 * from cache for the remainder of the run and the race would never be
 * observed after the first hit.
 *
 * Exits 1 and prints `FAIL at attempt N: <message>` on the first import
 * that throws; exits 0 after `attempts` clean imports.
 *
 * Committed (not scratch) per the stdlib-build-race mission's Batch 1:
 * this is the artifact `tests/integration/stdlib-build-race.test.ts`
 * spawns, so the race stays reproducible after `scripts_scratch/T0/` is
 * removed.
 *
 * Usage: jiti tests/helpers/stdlib-build-race-reader.ts <attempts>
 *
 * @see .agent-notes/sre-T0.md -- diagnosis artifact this signature came from
 */
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const TUPADR3_REMOTE_MODULE = join(REPO_ROOT, 'packages', 'stdlib-tupadr3', 'generated', 'tupadr3.remote.js');

const attempts = Number(process.argv[2] ?? 2000);

async function main(): Promise<void> {
  for (let i = 1; i <= attempts; i++) {
    const url = `${pathToFileURL(TUPADR3_REMOTE_MODULE).href}?t=${i}-${Date.now()}-${Math.random()}`;
    try {
      await import(url);
    } catch (err) {
      console.log(`FAIL at attempt ${i}: ${(err as Error).message}`);
      process.exit(1);
    }
  }
  console.log(`NO FAILURE after ${attempts} attempts`);
  process.exit(0);
}

void main();
