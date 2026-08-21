/**
 * stdlib-build-race harness, reader half (promoted from T0's scratch
 * probe `scripts_scratch/T0/reader.ts`; import-per-attempt semantics
 * unchanged). Repeatedly `import()`s the real `tupadr3.remote.js` the
 * writer half's `buildStdlibPackages()` emits, with a cache-busting query
 * string on every attempt (Node's ESM loader treats the query as part of
 * the module cache key, so each attempt is a fresh filesystem read, not a
 * cached hit) -- otherwise a single successful import would be served
 * from cache for the remainder of the run and the race would never be
 * observed after the first hit.
 *
 * Exits 1 and prints `FAIL at attempt N: <message>` on the first import
 * that throws -- this signature is the mission's evidence and must not
 * change.
 *
 * **Termination: killed by the spawning test with SIGKILL, not a graceful
 * stop flag.** An earlier version of this file tried a `SIGTERM` handler
 * that set a flag the loop checked between iterations, on the theory that
 * the writer's exit should bound a clean run's wall-clock. Measured
 * disproof (`.agent-notes/sre-T1.md`): the cache-busting query means every
 * attempt registers a NEW, never-evicted entry in Node's ESM loader
 * registry, and that registry's per-call cost grows with its size, so
 * later attempts take dramatically longer than early ones. Past a few
 * hundred attempts, a single in-flight `import()` can take tens of seconds
 * to over a minute, and Node cannot service a caught, JS-level signal
 * handler until the current synchronous/microtask work yields -- so
 * `SIGTERM` sat unactioned for 100+ seconds in a direct measurement.
 * `SIGKILL` cannot be caught, ignored, or deferred by the target process
 * at all, so the parent test kills this process outright once the writer
 * finishes, and reads whatever this process had already written to stdout
 * up to that instant (a `FAIL at attempt N:` line, if the race fired,
 * would already be flushed before the process could be killed). This file
 * therefore has NO signal handler; `maxAttempts` below is a pure safety
 * net in case the parent never gets to send anything at all, not the
 * intended stop condition.
 *
 * Usage: jiti tests/helpers/stdlib-build-race-reader.ts [maxAttempts]
 *
 * @see .agent-notes/sre-T0.md -- diagnosis artifact this signature came from
 * @see .agent-notes/sre-T1.md -- the fix-commit that re-tuned termination
 */
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const TUPADR3_REMOTE_MODULE = join(REPO_ROOT, 'packages', 'stdlib-tupadr3', 'generated', 'tupadr3.remote.js');

// Safety net only (see doc comment above) -- the spawning test's SIGKILL,
// sent once the writer exits, is the intended stop condition.
const maxAttempts = Number(process.argv[2] ?? 10_000_000);

async function main(): Promise<void> {
  for (let i = 1; i <= maxAttempts; i++) {
    const url = `${pathToFileURL(TUPADR3_REMOTE_MODULE).href}?t=${i}-${Date.now()}-${Math.random()}`;
    try {
      await import(url);
    } catch (err) {
      console.log(`FAIL at attempt ${i}: ${(err as Error).message}`);
      process.exit(1);
    }
  }
  console.log(`NO FAILURE after ${maxAttempts} attempts`);
  process.exit(0);
}

void main();
