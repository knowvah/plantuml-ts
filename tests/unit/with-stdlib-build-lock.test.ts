/**
 * stdlib-run-isolation T3 -- tests for `withStdlibBuildLock`
 * (`tests/helpers/with-stdlib-build-lock.ts`), the reader-side seam for
 * option D (`planning/adr/ADR-003-stdlib-run-isolation.md`). Every test
 * overrides `lockPath` to an isolated `mkdtempSync` scratch file, never the
 * real deterministic per-repo lock `buildStdlibPackages()` itself acquires
 * (same discipline as `tests/unit/build-stdlib-lock.test.ts:16`).
 *
 * stdlib-lock-sharing T2 -- the helper now requests shared mode by default
 * (`plans/stdlib-lock-sharing/decisions.md` D4), so most tests below assert
 * on a reader-entry file under `<lockPath>.readers` rather than on
 * `lockPath` itself -- shared mode never creates the writer mutex file.
 * `readersDirFor` is imported (read-only) from T1's `reader-registry.ts`
 * rather than hand-building the `${lockPath}.readers` string, to stay in
 * sync with that module's own naming if it ever changes.
 */
import { spawn, type ChildProcess } from 'node:child_process';
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { afterEach, describe, expect, it } from 'vitest';

import { readersDirFor } from '../../scripts/build-stdlib-packages/reader-registry.js';
import { withStdlibBuildLock } from '../helpers/with-stdlib-build-lock.js';

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const HELPER_MODULE_URL = pathToFileURL(join(REPO_ROOT, 'tests', 'helpers', 'with-stdlib-build-lock.ts')).href;
/** stdlib-lock-sharing T1's `.agent-notes/lsh-T1.md` gotcha applies here
 * too: the helper has its own relative import
 * (`../../scripts/build-stdlib-packages/build-lock.js`), so a worker script
 * living in a `mkdtempSync` scratch dir OUTSIDE this repo's `node_modules`
 * tree must resolve it through jiti's own resolver
 * (`createJiti(...).import(...)`), and must import jiti itself by an
 * absolute `file://` URL rather than a bare specifier. */
const JITI_MODULE_URL = pathToFileURL(join(REPO_ROOT, 'node_modules', 'jiti', 'lib', 'jiti.mjs')).href;

const tempDirs: string[] = [];

function makeTempDir(prefix: string): string {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  tempDirs.push(dir);
  return dir;
}

function readerCount(readersDir: string): number {
  return existsSync(readersDir) ? readdirSync(readersDir).length : 0;
}

let liveChildren: readonly ChildProcess[] = [];

afterEach(() => {
  for (const child of liveChildren) {
    if (child.exitCode === null && child.signalCode === null) {
      child.kill('SIGKILL');
    }
  }
  liveChildren = [];
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

// ---------------------------------------------------------------------------
// Worker-process plumbing for the two-process proof below -- mirrors
// `tests/unit/build-stdlib-lock.test.ts`'s `resolveLocalJiti`/`spawnWorker`/
// `collectExit` (that file exports nothing and is outside this task's
// write-set, so this is a small, deliberate duplication, same discipline
// that file's own header comment documents).
// ---------------------------------------------------------------------------

function resolveLocalJiti(): { readonly cmd: string; readonly pre: readonly string[] } {
  const local = join(REPO_ROOT, 'node_modules', '.bin', 'jiti');
  if (existsSync(local)) return { cmd: local, pre: [] };
  return { cmd: 'npx', pre: ['--no-install', 'jiti'] };
}

function spawnWorker(scriptPath: string, args: readonly string[]): ChildProcess {
  const jiti = resolveLocalJiti();
  return spawn(jiti.cmd, [...jiti.pre, scriptPath, ...args], {
    cwd: REPO_ROOT,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

function collectExit(child: ChildProcess): Promise<{ stdout: string; exitCode: number | null }> {
  let stdout = '';
  child.stdout?.on('data', (chunk: Buffer) => {
    stdout += chunk.toString();
  });
  child.stderr?.on('data', (chunk: Buffer) => {
    stdout += chunk.toString();
  });
  return new Promise((resolve) => {
    child.on('close', (exitCode) => resolve({ stdout, exitCode }));
  });
}

/**
 * "Shared reader" worker: calls `withStdlibBuildLock` with NO `mode`
 * option -- proving the HELPER's own default, not an explicit caller
 * request for shared mode. Writes its acquisition timestamp (not just a
 * sentinel) so the test can check for genuine time-window overlap between
 * two such workers, holds for `holdMs`, then releases.
 */
function sharedReaderWorkerSource(): string {
  return `
import { writeFileSync } from 'node:fs';

const [, , jitiModuleUrl, helperModuleUrl, lockPath, readySentinelPath, holdMsArg] = process.argv;
const holdMs = Number(holdMsArg);

function sleepSync(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

async function main() {
  const { createJiti } = await import(jitiModuleUrl);
  const { withStdlibBuildLock } = await createJiti(process.cwd()).import(helperModuleUrl);
  withStdlibBuildLock(() => {
    writeFileSync(readySentinelPath, String(Date.now()), 'utf8');
    sleepSync(holdMs);
  }, { lockPath });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
`;
}

// ---------------------------------------------------------------------------
// Default (shared) mode -- D4: the helper opts in to shared mode itself.
// ---------------------------------------------------------------------------

describe('withStdlibBuildLock -- sync callback (default shared mode)', () => {
  it('registers a reader entry (no writer mutex file) while running, releases afterwards, returns the value', () => {
    const dir = makeTempDir('with-stdlib-build-lock-sync-');
    const lockPath = join(dir, 'sync.lock');
    const readersDir = readersDirFor(lockPath);
    let readerCountDuringCall = -1;
    let mutexExistedDuringCall = false;

    const result = withStdlibBuildLock(() => {
      readerCountDuringCall = readerCount(readersDir);
      mutexExistedDuringCall = existsSync(lockPath);
      return 42;
    }, { lockPath });

    expect(readerCountDuringCall).toBe(1);
    expect(mutexExistedDuringCall).toBe(false);
    expect(result).toBe(42);
    expect(readerCount(readersDir)).toBe(0);
  });
});

describe('withStdlibBuildLock -- async callback (default shared mode)', () => {
  it('holds the reader entry for an async callback whole duration, then releases it', async () => {
    const dir = makeTempDir('with-stdlib-build-lock-async-');
    const lockPath = join(dir, 'async.lock');
    const readersDir = readersDirFor(lockPath);
    let readerCountAfterAwait = -1;

    const result = await withStdlibBuildLock(async () => {
      // Mirrors T4's real call sites: `await import(...)` inside the
      // critical section -- the reader entry must still be registered
      // after the await.
      await new Promise((resolve) => setTimeout(resolve, 5));
      readerCountAfterAwait = readerCount(readersDir);
      return 'done';
    }, { lockPath });

    expect(readerCountAfterAwait).toBe(1);
    expect(result).toBe('done');
    expect(readerCount(readersDir)).toBe(0);
  });
});

describe('withStdlibBuildLock -- release on throw (default shared mode)', () => {
  it('releases the reader entry and rethrows when the sync callback throws', () => {
    const dir = makeTempDir('with-stdlib-build-lock-throw-sync-');
    const lockPath = join(dir, 'throw-sync.lock');
    const readersDir = readersDirFor(lockPath);

    expect(() =>
      withStdlibBuildLock(() => {
        throw new Error('sync boom');
      }, { lockPath }),
    ).toThrow('sync boom');

    expect(readerCount(readersDir)).toBe(0);
  });

  it('releases the reader entry and rejects when the async callback rejects', async () => {
    const dir = makeTempDir('with-stdlib-build-lock-throw-async-');
    const lockPath = join(dir, 'throw-async.lock');
    const readersDir = readersDirFor(lockPath);

    await expect(
      withStdlibBuildLock(async () => {
        await Promise.resolve();
        throw new Error('async boom');
      }, { lockPath }),
    ).rejects.toThrow('async boom');

    expect(readerCount(readersDir)).toBe(0);
  });
});

describe('withStdlibBuildLock -- release after reclaim (hazard 1, shared mode)', () => {
  it('does not delete a reader entry that a different holder reclaimed during the callback', () => {
    const dir = makeTempDir('with-stdlib-build-lock-reclaim-');
    const lockPath = join(dir, 'reclaim.lock');
    const readersDir = readersDirFor(lockPath);
    const reclaimerContent = JSON.stringify({ pid: 999_997, acquiredAt: Date.now() });
    let entryPath = '';

    withStdlibBuildLock(() => {
      // Simulates hazard 1's real trigger: this reader entry aged past
      // `staleAgeMs` while still notionally held, another process's stale-
      // entry reclaim deleted it and wrote its own entry at the same path
      // -- ownership has genuinely moved before this helper's release()
      // runs.
      const [entryName] = readdirSync(readersDir);
      entryPath = join(readersDir, entryName as string);
      writeFileSync(entryPath, reclaimerContent, 'utf8');
    }, { lockPath });

    // Proves the helper relies on `acquireBuildLock`'s ownership-safe
    // shared release (`unregisterPresenceIfOwned`) rather than an
    // unconditional delete -- the reclaimer's entry must survive this
    // helper's own release call.
    expect(existsSync(entryPath)).toBe(true);
    expect(readFileSync(entryPath, 'utf8')).toBe(reclaimerContent);
  });
});

// ---------------------------------------------------------------------------
// Explicit `mode` override -- D4: a caller-supplied mode must still win
// over the helper's new shared default.
// ---------------------------------------------------------------------------

describe('withStdlibBuildLock -- explicit mode override', () => {
  it('acquires in exclusive mode, beating the new shared default, when options.mode is "exclusive"', () => {
    const dir = makeTempDir('with-stdlib-build-lock-explicit-exclusive-');
    const lockPath = join(dir, 'explicit.lock');
    const readersDir = readersDirFor(lockPath);
    let mutexHeldDuringCall = false;
    let readerCountDuringCall = -1;

    withStdlibBuildLock(() => {
      mutexHeldDuringCall = existsSync(lockPath);
      readerCountDuringCall = readerCount(readersDir);
    }, { lockPath, mode: 'exclusive' });

    expect(mutexHeldDuringCall).toBe(true);
    expect(readerCountDuringCall).toBe(0);
    expect(existsSync(lockPath)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Two-process proof (stdlib-lock-sharing T2 acceptance): the HELPER's own
// default -- no `mode` option passed anywhere -- must let two concurrent
// readers, in two real OS processes, proceed without either waiting on the
// other. `tests/unit/build-stdlib-lock.test.ts` already proves this at the
// `acquireBuildLock` layer directly; this proves the helper actually
// requests that same behaviour by default, since that request
// (`{ mode: 'shared', ...options }` in `with-stdlib-build-lock.ts`) is
// exactly what this task changed.
// ---------------------------------------------------------------------------

describe('withStdlibBuildLock -- shared mode across processes (D1)', () => {
  it(
    'two default (no explicit mode) acquisitions in DIFFERENT processes both proceed concurrently',
    async () => {
      const scratch = makeTempDir('with-stdlib-build-lock-shared-concurrent-');
      const workerScriptPath = join(scratch, 'shared-reader.mjs');
      writeFileSync(workerScriptPath, sharedReaderWorkerSource(), 'utf8');
      const lockPath = join(scratch, 'shared.lock');
      const holdMs = 400;
      const readyA = join(scratch, 'ready-a');
      const readyB = join(scratch, 'ready-b');

      const start = Date.now();
      const workerA = spawnWorker(workerScriptPath, [JITI_MODULE_URL, HELPER_MODULE_URL, lockPath, readyA, String(holdMs)]);
      const workerB = spawnWorker(workerScriptPath, [JITI_MODULE_URL, HELPER_MODULE_URL, lockPath, readyB, String(holdMs)]);
      liveChildren = [workerA, workerB];

      const [resultA, resultB] = await Promise.all([collectExit(workerA), collectExit(workerB)]);
      const elapsed = Date.now() - start;

      expect(resultA.exitCode).toBe(0);
      expect(resultB.exitCode).toBe(0);

      const acquiredA = Number(readFileSync(readyA, 'utf8'));
      const acquiredB = Number(readFileSync(readyB, 'utf8'));

      // Serialised acquisition would take at least 2*holdMs; concurrent
      // holding completes in about one holdMs.
      //
      // Measured from the FIRST acquisition, not from `start`, and that
      // distinction is the whole point. Each worker boots node, imports
      // jiti, and has jiti TRANSPILE the helper module before it can
      // acquire anything -- startup cost that has nothing to do with the
      // lock. Timing from `start` charges that to the lock and makes the
      // threshold a measure of the runner's CPU: this assertion read
      // `expect(elapsed).toBeLessThan(holdMs * 1.6)` and failed on CI three
      // consecutive runs at 660, 769 and 793 ms while passing locally at
      // 483 ms, because startup costs ~64 ms on a 12-core dev machine and
      // 260-390 ms on a 2-core runner -- consuming the entire 240 ms of
      // slack the 1.6 multiplier leaves above holdMs.
      //
      // The concurrent phase itself is load-independent, which is what
      // makes it the right thing to bound. Instrumented locally
      // (`.agent-notes/shared-mode-timing-is-spawn-bound.md`): 420 ms quiet
      // at load1 16, and 413/430/413 ms at load1 41-50, while spawn moved
      // 64 -> 79-100 ms over the same range.
      //
      // Discrimination is unchanged: serialisation puts the second acquire
      // after the first release, so this quantity becomes ~2*holdMs and
      // still blows the same 1.6*holdMs threshold. Narrowing WHAT is timed
      // is not a loosening -- the serialisation floor it must stay under is
      // identical, and the overlap assertions below remain the rigorous
      // proof in any case.
      const firstAcquired = Math.min(acquiredA, acquiredB);
      const concurrentPhaseMs = elapsed - (firstAcquired - start);
      expect(concurrentPhaseMs).toBeLessThan(holdMs * 1.6);
      // Each holder's [acquired, acquired+holdMs] window must overlap the
      // other's -- proof neither waited for the other, with no `lockPath`-
      // adjacent `mode` override anywhere in this worker script.
      expect(acquiredA).toBeLessThan(acquiredB + holdMs);
      expect(acquiredB).toBeLessThan(acquiredA + holdMs);
    },
    20_000,
  );
});

// ---------------------------------------------------------------------------
// REPO_ROOT sanity -- unrelated to mode, unchanged from before this task.
// ---------------------------------------------------------------------------

describe('withStdlibBuildLock -- default repoRoot', () => {
  it('resolves repoRoot to the real repository root, matching build-lock.ts', () => {
    // Not exercising the real deterministic lock path directly (that would
    // contend with a genuinely concurrent build); instead proves the
    // computed REPO_ROOT constant this file's helper relies on is the
    // actual checkout root, the same string
    // `scripts/build-stdlib-packages.ts` computes for itself -- required
    // so both resolve to the SAME hashed lock path (`build-lock.ts:108`).
    expect(existsSync(join(REPO_ROOT, 'package.json'))).toBe(true);
    expect(existsSync(join(REPO_ROOT, 'scripts', 'build-stdlib-packages.ts'))).toBe(true);
  });
});
