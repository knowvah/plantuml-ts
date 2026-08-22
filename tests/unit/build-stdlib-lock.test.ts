/**
 * stdlib-build-race, T4 -- the cross-process lock half of D3
 * (`plans/stdlib-build-race/decisions.md`). T2
 * (`tests/unit/build-stdlib-packages.test.ts`) proved the content-derived
 * up-to-date skip is correct but, by its own scope note, does not close the
 * race alone: a second run can still observe a first run's PARTIAL tree,
 * judge it stale, and `rmSync` it while the first run's workers are still
 * importing (`.agent-notes/sre-T0.md`). This file exercises
 * `acquireBuildLock` (`scripts/build-stdlib-packages/build-lock.ts`)
 * directly -- on-disk representation, stale-holder recovery, bounded
 * wait/timeout -- and composes it with the REAL `isGeneratedDirUpToDate`
 * (T2) to prove the thing D3 actually asks for: a second holder that
 * re-checks the predicate INSIDE the lock and skips instead of deleting.
 *
 * Same discipline as T2's test file: every fixture is an isolated
 * `mkdtempSync` directory, never the real shared `packages/*\/generated/`
 * tree, and this file never calls the real `buildStdlibPackages()`.
 *
 * Multi-process tests (the held-lock-then-skip and 3-concurrent-builders
 * acceptance clauses) spawn REAL child processes via the local `jiti`
 * binary, mirroring `tests/integration/stdlib-build-race.test.ts`'s
 * `resolveLocalJiti`/`spawnScript` pattern (duplicated here in miniature --
 * that file exports nothing and is outside this task's write-set). Worker
 * scripts are generated as strings and written to a scratch `mkdtempSync`
 * directory at test time, not committed: they exist only to prove genuine
 * OS-level concurrency around the lock, not to test anything themselves.
 */
import { spawn, type ChildProcess } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { afterEach, describe, expect, it } from 'vitest';

import { isGeneratedDirUpToDate } from '../../scripts/build-stdlib-packages.js';
import { acquireBuildLock } from '../../scripts/build-stdlib-packages/build-lock.js';
import { LOCK_PRESSURE_BUDGET_MS } from '../helpers/lock-pressure-budget.js';

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const BUILD_LOCK_MODULE_URL = pathToFileURL(
  join(REPO_ROOT, 'scripts', 'build-stdlib-packages', 'build-lock.ts'),
).href;
/** stdlib-lock-sharing T1 -- `build-lock.ts` gained a relative import
 * (`./reader-registry.ts`) once shared mode landed. Worker scripts below
 * live under a `mkdtempSync` scratch dir OUTSIDE this repo's `node_modules`
 * tree, so Node's native `import()` of a raw `build-lock.ts` file:// URL
 * can no longer resolve that nested `.js`-specifier-to-`.ts`-file mapping
 * (that remapping is a TypeScript/jiti convention, not something Node's
 * native ESM resolver or its built-in TS type-stripping performs). Routing
 * the import through jiti's OWN resolver (`createJiti(...).import(...)`)
 * fixes the nested resolution -- but bare-specifier `import 'jiti'` inside
 * a worker script resolves relative to THAT SCRIPT's own directory, which
 * is also outside `node_modules`. Importing jiti by its absolute `file://`
 * URL sidesteps both problems at once. */
const JITI_MODULE_URL = pathToFileURL(join(REPO_ROOT, 'node_modules', 'jiti', 'lib', 'jiti.mjs')).href;

// ---------------------------------------------------------------------------
// Fixture + process cleanup -- every temp dir and every child process this
// file creates is tracked here and torn down in `afterEach`, so a failing
// test never leaks a directory or a stray process.
// ---------------------------------------------------------------------------

const tempDirs: string[] = [];

function makeTempDir(prefix: string): string {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  tempDirs.push(dir);
  return dir;
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

/** Mirrors `tests/integration/stdlib-build-race.test.ts`'s
 * `resolveLocalJiti`: execs the local `node_modules/.bin/jiti` shebang
 * directly rather than through `npx`, so there is no wrapper process
 * between this test's child handle and the actual worker. */
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
 * Synthetic "builder" worker: acquires the real `acquireBuildLock`, then
 * mirrors `writeOutputs`'s own shape -- read the expected output, skip if
 * it already matches, else `rmSync` + recreate + write + record a build --
 * all inside the lock. Logs `BUILD` or `SKIP` so the test can count which
 * happened without reading a log line as truth.
 */
function buildWorkerSource(): string {
  return `
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const [, , jitiModuleUrl, buildLockModuleUrl, lockPath, buildDir, expectedContent] = process.argv;

async function main() {
  const { createJiti } = await import(jitiModuleUrl);
  const { acquireBuildLock } = await createJiti(process.cwd()).import(buildLockModuleUrl);
  const release = acquireBuildLock('unused-repo-root', { lockPath, maxWaitMs: 15000, pollIntervalMs: 10 });
  try {
    const outputPath = join(buildDir, 'output.txt');
    let current;
    try {
      current = readFileSync(outputPath, 'utf8');
    } catch {
      current = undefined;
    }
    if (current === expectedContent) {
      console.log('SKIP');
    } else {
      rmSync(buildDir, { recursive: true, force: true });
      mkdirSync(buildDir, { recursive: true });
      writeFileSync(outputPath, expectedContent, 'utf8');
      const countPath = join(buildDir, 'build-count.txt');
      let count = 0;
      try {
        count = Number(readFileSync(countPath, 'utf8'));
      } catch {
        count = 0;
      }
      writeFileSync(countPath, String(count + 1), 'utf8');
      console.log('BUILD');
    }
  } finally {
    release();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
`;
}

/**
 * "Holder" worker: acquires the lock, signals `readySentinelPath` so the
 * test knows contention has genuinely begun, holds it for `holdMs` via a
 * real synchronous sleep, then releases. Models a first builder's
 * in-progress critical section for the "second builder waits" acceptance
 * clause.
 */
function holderWorkerSource(): string {
  return `
import { writeFileSync } from 'node:fs';

const [, , jitiModuleUrl, buildLockModuleUrl, lockPath, readySentinelPath, holdMsArg] = process.argv;
const holdMs = Number(holdMsArg);

function sleepSync(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

async function main() {
  const { createJiti } = await import(jitiModuleUrl);
  const { acquireBuildLock } = await createJiti(process.cwd()).import(buildLockModuleUrl);
  const release = acquireBuildLock('unused-repo-root', { lockPath, maxWaitMs: 15000, pollIntervalMs: 10 });
  writeFileSync(readySentinelPath, 'ready', 'utf8');
  sleepSync(holdMs);
  release();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
`;
}

/**
 * stdlib-lock-sharing T1 -- "shared reader" worker: acquires the lock in
 * shared mode, writes its acquisition timestamp (not just a sentinel) to
 * `readySentinelPath` so the test can check for genuine time-window
 * overlap between two such workers, holds for `holdMs`, then releases.
 */
function sharedReaderWorkerSource(): string {
  return `
import { writeFileSync } from 'node:fs';

const [, , jitiModuleUrl, buildLockModuleUrl, lockPath, readySentinelPath, holdMsArg] = process.argv;
const holdMs = Number(holdMsArg);

function sleepSync(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

async function main() {
  const { createJiti } = await import(jitiModuleUrl);
  const { acquireBuildLock } = await createJiti(process.cwd()).import(buildLockModuleUrl);
  const release = acquireBuildLock('unused-repo-root', {
    lockPath,
    mode: 'shared',
    maxWaitMs: 15000,
    pollIntervalMs: 10,
  });
  writeFileSync(readySentinelPath, String(Date.now()), 'utf8');
  sleepSync(holdMs);
  release();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
`;
}

async function waitForFile(path: string, timeoutMs: number): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (!existsSync(path)) {
    if (Date.now() > deadline) {
      throw new Error(`timed out after ${timeoutMs}ms waiting for ${path} to appear`);
    }
    await new Promise((resolve) => setTimeout(resolve, 5));
  }
}

// ---------------------------------------------------------------------------
// On-disk representation + uncontended cost
// ---------------------------------------------------------------------------

describe('acquireBuildLock -- on-disk representation', () => {
  // Asserts on the ONE deterministic default path, and on who owns it --
  // deliberately not on a count of matching files in `tmpdir()`. Since
  // stdlib-run-isolation option D, eight reader test files legitimately
  // contend on this exact lock, so a directory-wide count is shared mutable
  // state between workers: another worker may hold the lock when `before` is
  // sampled, and `acquireBuildLock` would then block and re-create the same
  // single path, leaving the count unchanged rather than incremented. The
  // count was never the property under test; the deterministic path and the
  // create/remove pair are.
  //
  // The 120s budget is for the same reason: this test acquires the REAL
  // default lock, so it can legitimately queue behind those eight readers,
  // and `maxWaitMs` alone is 30s -- well past vitest's 5s default.
  it('creates a lock file while held and removes it on release, at a deterministic default path', () => {
    const digest = createHash('sha256').update(REPO_ROOT).digest('hex').slice(0, 16);
    const defaultLockPath = join(tmpdir(), `plantuml-ts-stdlib-build-${digest}.lock`);
    const ownerPidAt = (path: string): number | undefined => {
      if (!existsSync(path)) {
        return undefined;
      }
      try {
        return (JSON.parse(readFileSync(path, 'utf8')) as { pid?: number }).pid;
      } catch {
        return undefined;
      }
    };

    const release = acquireBuildLock(REPO_ROOT);
    expect(existsSync(defaultLockPath)).toBe(true);
    expect(ownerPidAt(defaultLockPath)).toBe(process.pid);

    release();

    // Either the file is gone, or a contending worker acquired it in the
    // gap -- in which case it is no longer ours. Both prove OUR lock was
    // released; neither is satisfiable if `release()` were a no-op.
    expect(ownerPidAt(defaultLockPath)).not.toBe(process.pid);
  }, LOCK_PRESSURE_BUDGET_MS);

  it('costs no measurable overhead when uncontended', () => {
    const dir = makeTempDir('build-stdlib-lock-cost-');
    const lockPath = join(dir, 'uncontended.lock');
    const iterations = 200;

    const start = Date.now();
    for (let i = 0; i < iterations; i++) {
      const release = acquireBuildLock(REPO_ROOT, { lockPath, maxWaitMs: 5000, pollIntervalMs: 20 });
      release();
    }
    const perCycleMs = (Date.now() - start) / iterations;

    console.log(`[build-stdlib-lock.test] uncontended acquire+release: ${perCycleMs.toFixed(3)}ms/cycle`);
    expect(perCycleMs).toBeLessThan(20);
  });
});

// ---------------------------------------------------------------------------
// Bounded wait: fails fast, naming the lock path and the wait duration
// ---------------------------------------------------------------------------

describe('acquireBuildLock -- bounded wait', () => {
  it('throws, naming the lock path and the wait duration, once a live holder outlasts maxWaitMs', () => {
    const dir = makeTempDir('build-stdlib-lock-timeout-');
    const lockPath = join(dir, 'held.lock');
    writeFileSync(lockPath, JSON.stringify({ pid: 999_999, acquiredAt: 0 }), 'utf8');

    let clock = 0;
    let thrown: unknown;
    try {
      acquireBuildLock(REPO_ROOT, {
        lockPath,
        maxWaitMs: 100,
        pollIntervalMs: 20,
        now: () => clock,
        sleep: (ms) => {
          clock += ms;
        },
        isProcessAlive: () => true,
      });
    } catch (err) {
      thrown = err;
    }

    expect(thrown).toBeInstanceOf(Error);
    const message = (thrown as Error).message;
    expect(message).toContain(lockPath);
    expect(message).toContain('100ms');
  });
});

// ---------------------------------------------------------------------------
// Stale-lock recovery: a dead holder must not wedge a future run
// ---------------------------------------------------------------------------

describe('acquireBuildLock -- stale recovery', () => {
  it(
    'reclaims a lock left behind by a dead process and does not hang',
    async () => {
      const dir = makeTempDir('build-stdlib-lock-dead-');
      const lockPath = join(dir, 'dead.lock');

      const deadChild = spawn(process.execPath, ['-e', 'process.exit(0)']);
      const deadPid = deadChild.pid;
      expect(deadPid).toBeDefined();
      await new Promise<void>((resolve) => deadChild.on('exit', () => resolve()));

      writeFileSync(lockPath, JSON.stringify({ pid: deadPid, acquiredAt: Date.now() }), 'utf8');

      const logs: string[] = [];
      const start = Date.now();
      const release = acquireBuildLock(REPO_ROOT, {
        lockPath,
        maxWaitMs: 5000,
        pollIntervalMs: 5,
        log: (message) => logs.push(message),
      });
      const elapsed = Date.now() - start;

      // Well under maxWaitMs -- proves it reclaimed rather than waited out
      // the timeout.
      expect(elapsed).toBeLessThan(1000);
      expect(logs.some((m) => m.includes('reclaiming stale lock'))).toBe(true);
      expect(logs.some((m) => m.includes(String(deadPid)))).toBe(true);
      // Tidied sequencing: a reclaim retries immediately, so a run that
      // never had to wait on a live holder must never log "waiting" --
      // logging it here would misreport a reclaim-and-proceed as a block.
      expect(logs.some((m) => m.includes('waiting for the stdlib build lock'))).toBe(false);

      release();
      expect(existsSync(lockPath)).toBe(false);
    },
    10_000,
  );

  it(
    'reclaims a corrupt (unparseable) lock file and proceeds without hanging',
    () => {
      const dir = makeTempDir('build-stdlib-lock-corrupt-');
      const lockPath = join(dir, 'corrupt.lock');
      // Truncated JSON -- exactly what a crash or a full disk mid-`write()`
      // leaves behind. Before this fix, `readLockContents` caught the
      // `JSON.parse` failure and returned `undefined`, which `reclaimIfStale`
      // treated as "nothing to reclaim" -- an unparseable lock was NEVER
      // stale, so it wedged every future run permanently.
      writeFileSync(lockPath, '{"pid":12345,"acqui', 'utf8');

      const logs: string[] = [];
      const start = Date.now();
      const release = acquireBuildLock(REPO_ROOT, {
        lockPath,
        maxWaitMs: 5000,
        pollIntervalMs: 10,
        staleUnparseableGraceMs: 50,
        log: (message) => logs.push(message),
      });
      const elapsed = Date.now() - start;

      expect(elapsed).toBeLessThan(1000);
      expect(logs.some((m) => m.includes('reclaiming stale lock'))).toBe(true);
      expect(logs.some((m) => m.includes('unparseable content'))).toBe(true);

      release();
      expect(existsSync(lockPath)).toBe(false);
    },
    10_000,
  );

  it('does not steal a corrupt lock that is still within its unparseable grace period', () => {
    const dir = makeTempDir('build-stdlib-lock-grace-');
    const lockPath = join(dir, 'fresh-corrupt.lock');
    const truncatedContent = '{"pid":12345,"acqui';
    // Same truncated content as above, but this time the grace period
    // (10s) is set far longer than the whole bounded wait (150ms) -- the
    // window a `wx` write's open-then-write leaves is a few microseconds,
    // not seconds, so a real racing reader would see this file corrupt for
    // only a moment. Modelling that moment directly (a live writer paused
    // mid-`write()`) is not reproducible on demand; the grace period turns
    // it into a deterministic threshold instead: this file's mtime must
    // never age past 10s during the test, so it must never be judged
    // stale, so it must never be reclaimed -- acquisition can only time
    // out, never steal it.
    writeFileSync(lockPath, truncatedContent, 'utf8');

    let thrown: unknown;
    try {
      acquireBuildLock(REPO_ROOT, {
        lockPath,
        maxWaitMs: 150,
        pollIntervalMs: 20,
        staleUnparseableGraceMs: 10_000,
      });
    } catch (err) {
      thrown = err;
    }

    expect(thrown).toBeInstanceOf(Error);
    expect(existsSync(lockPath)).toBe(true);
    expect(readFileSync(lockPath, 'utf8')).toBe(truncatedContent);
  });
});

// ---------------------------------------------------------------------------
// stdlib-run-isolation T3, hazard 1: `release()` must be ownership-safe.
// `isStale` (above) deliberately reclaims a lock older than `staleAgeMs`
// even from a still-live holder -- correct for a builder, but option D
// repurposes this lock for readers, whose critical section can outlive
// that window. Before this fix, `release()` was an unconditional
// `rmSync(opts.lockPath)`: a holder reclaimed out from under itself would,
// on release, delete whatever lock the reclaimer had since created --
// silently stealing mutual exclusion a second time. See
// `planning/adr/ADR-003-stdlib-run-isolation.md` and
// `plans/stdlib-run-isolation/decision-journal.md` (hazard 1 entry).
// ---------------------------------------------------------------------------

describe('acquireBuildLock -- ownership-safe release (hazard 1)', () => {
  it('does not delete the lock file once it has been reclaimed by a different holder', () => {
    const dir = makeTempDir('build-stdlib-lock-ownership-');
    const lockPath = join(dir, 'ownership.lock');

    const release = acquireBuildLock(REPO_ROOT, { lockPath });
    expect(existsSync(lockPath)).toBe(true);

    // Simulate hazard 1's real trigger: this lock aged past `staleAgeMs`
    // while still notionally "held" by us, a different process's
    // `reclaimIfStale` deleted it and created its OWN lock file at the
    // same path. That file now names a different pid/acquiredAt pair --
    // ownership has genuinely moved.
    const reclaimerContent = JSON.stringify({ pid: 999_998, acquiredAt: Date.now() });
    writeFileSync(lockPath, reclaimerContent, 'utf8');

    release();

    // Pre-fix, `release()` was `rmSync(opts.lockPath)` unconditionally and
    // would delete this regardless of who wrote it. An ownership-safe
    // release must recognise the file no longer names its own acquisition
    // and leave the reclaimer's lock untouched.
    expect(existsSync(lockPath)).toBe(true);
    expect(readFileSync(lockPath, 'utf8')).toBe(reclaimerContent);
  });

  it('still deletes the lock file when it still names this exact acquisition', () => {
    const dir = makeTempDir('build-stdlib-lock-ownership-self-');
    const lockPath = join(dir, 'self.lock');

    const release = acquireBuildLock(REPO_ROOT, { lockPath });
    expect(existsSync(lockPath)).toBe(true);
    release();
    expect(existsSync(lockPath)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// The actual D3 composition: second builder waits, re-checks inside the
// lock, and performs no rmSync -- proven on the filesystem, not a log line.
// ---------------------------------------------------------------------------

describe('acquireBuildLock -- composed with the real up-to-date predicate', () => {
  it(
    'a second builder waits for a held lock, then finds the tree up to date and performs no rmSync',
    async () => {
      const buildDir = makeTempDir('build-stdlib-lock-build-');
      const outputPath = join(buildDir, 'output.txt');
      const expectedContent = 'expected-fresh-output';
      writeFileSync(outputPath, expectedContent, 'utf8');
      const originalIno = statSync(outputPath).ino;

      const scratch = makeTempDir('build-stdlib-lock-scratch-');
      const holderScriptPath = join(scratch, 'holder.mjs');
      writeFileSync(holderScriptPath, holderWorkerSource(), 'utf8');
      const lockPath = join(scratch, 'shared.lock');
      const readySentinelPath = join(scratch, 'holder-ready');
      const holdMs = 200;

      const holder = spawnWorker(holderScriptPath, [
        JITI_MODULE_URL,
        BUILD_LOCK_MODULE_URL,
        lockPath,
        readySentinelPath,
        String(holdMs),
      ]);
      liveChildren = [holder];

      await waitForFile(readySentinelPath, 5000);

      const waitStart = Date.now();
      const release = acquireBuildLock(REPO_ROOT, { lockPath, maxWaitMs: 5000, pollIntervalMs: 10 });
      const waited = Date.now() - waitStart;
      expect(waited).toBeGreaterThanOrEqual(holdMs * 0.5);

      const upToDate = isGeneratedDirUpToDate(buildDir, new Map([['output.txt', expectedContent]]));
      expect(upToDate).toBe(true);
      if (!upToDate) {
        rmSync(buildDir, { recursive: true, force: true });
      }
      release();

      expect(statSync(outputPath).ino).toBe(originalIno);
      expect(readFileSync(outputPath, 'utf8')).toBe(expectedContent);

      await new Promise<void>((resolve) => holder.once('exit', () => resolve()));
    },
    15_000,
  );
});

// ---------------------------------------------------------------------------
// 3 concurrent builders: exactly one builds, none errors, output matches a
// single-builder run.
// ---------------------------------------------------------------------------

describe('acquireBuildLock -- concurrent builders', () => {
  it(
    'given 3 concurrent builders, exactly one builds, none errors, and output matches a single-builder run',
    async () => {
      const parent = makeTempDir('build-stdlib-lock-concurrent-');
      const buildDir = join(parent, 'generated');
      const scratch = makeTempDir('build-stdlib-lock-scratch-');
      const workerScriptPath = join(scratch, 'worker.mjs');
      writeFileSync(workerScriptPath, buildWorkerSource(), 'utf8');
      const lockPath = join(scratch, 'shared.lock');
      const expectedContent = 'expected-fresh-output-concurrent';

      const children = Array.from({ length: 3 }, () =>
        spawnWorker(workerScriptPath, [JITI_MODULE_URL, BUILD_LOCK_MODULE_URL, lockPath, buildDir, expectedContent]),
      );
      liveChildren = children;

      const results = await Promise.all(children.map((child) => collectExit(child)));

      for (const result of results) {
        expect(result.exitCode).toBe(0);
      }
      const buildCount = results.filter((r) => r.stdout.includes('BUILD')).length;
      const skipCount = results.filter((r) => r.stdout.includes('SKIP')).length;
      expect(buildCount).toBe(1);
      expect(skipCount).toBe(2);

      expect(readFileSync(join(buildDir, 'output.txt'), 'utf8')).toBe(expectedContent);
      expect(readFileSync(join(buildDir, 'build-count.txt'), 'utf8')).toBe('1');
      expect(existsSync(lockPath)).toBe(false);
    },
    20_000,
  );
});

// ---------------------------------------------------------------------------
// stdlib-lock-sharing T1 -- shared (reader) mode, D1-D4
// (`plans/stdlib-lock-sharing/decisions.md`). Readers never conflict with
// each other, only with a writer.
// ---------------------------------------------------------------------------

describe('acquireBuildLock -- shared mode: concurrency (D1)', () => {
  it(
    'two shared acquisitions in DIFFERENT processes both proceed concurrently, neither waiting on the other',
    async () => {
      const scratch = makeTempDir('build-stdlib-lock-shared-concurrent-');
      const workerScriptPath = join(scratch, 'shared-reader.mjs');
      writeFileSync(workerScriptPath, sharedReaderWorkerSource(), 'utf8');
      const lockPath = join(scratch, 'shared.lock');
      const holdMs = 400;
      const readyA = join(scratch, 'ready-a');
      const readyB = join(scratch, 'ready-b');

      const start = Date.now();
      const workerA = spawnWorker(workerScriptPath, [JITI_MODULE_URL, BUILD_LOCK_MODULE_URL, lockPath, readyA, String(holdMs)]);
      const workerB = spawnWorker(workerScriptPath, [JITI_MODULE_URL, BUILD_LOCK_MODULE_URL, lockPath, readyB, String(holdMs)]);
      liveChildren = [workerA, workerB];

      const [resultA, resultB] = await Promise.all([collectExit(workerA), collectExit(workerB)]);
      const elapsed = Date.now() - start;

      expect(resultA.exitCode).toBe(0);
      expect(resultB.exitCode).toBe(0);
      // Serialised acquisition would take at least 2*holdMs; concurrent
      // holding completes in about one holdMs plus process-spawn overhead.
      expect(elapsed).toBeLessThan(holdMs * 1.6);

      const acquiredA = Number(readFileSync(readyA, 'utf8'));
      const acquiredB = Number(readFileSync(readyB, 'utf8'));
      // Each holder's [acquired, acquired+holdMs] window must overlap the
      // other's -- proof neither waited for the other to release.
      expect(acquiredA).toBeLessThan(acquiredB + holdMs);
      expect(acquiredB).toBeLessThan(acquiredA + holdMs);
    },
    20_000,
  );

  it(
    'a writer waits for a held shared lock to drain, then proceeds',
    async () => {
      const scratch = makeTempDir('build-stdlib-lock-shared-drain-');
      const workerScriptPath = join(scratch, 'shared-reader.mjs');
      writeFileSync(workerScriptPath, sharedReaderWorkerSource(), 'utf8');
      const lockPath = join(scratch, 'shared.lock');
      const readySentinelPath = join(scratch, 'reader-ready');
      const holdMs = 200;

      const reader = spawnWorker(workerScriptPath, [
        JITI_MODULE_URL,
        BUILD_LOCK_MODULE_URL,
        lockPath,
        readySentinelPath,
        String(holdMs),
      ]);
      liveChildren = [reader];

      await waitForFile(readySentinelPath, 5000);

      const waitStart = Date.now();
      const release = acquireBuildLock(REPO_ROOT, { lockPath, maxWaitMs: 5000, pollIntervalMs: 10 });
      const waited = Date.now() - waitStart;
      expect(waited).toBeGreaterThanOrEqual(holdMs * 0.5);

      // The reader's presence entry must be gone by the time the writer
      // holds -- proof the writer actually drained rather than racing past.
      const readersDir = `${lockPath}.readers`;
      const remaining = existsSync(readersDir) ? readdirSync(readersDir) : [];
      expect(remaining).toEqual([]);

      release();
      await new Promise<void>((resolve) => reader.once('exit', () => resolve()));
    },
    15_000,
  );
});

describe('acquireBuildLock -- shared mode: writer priority (D3)', () => {
  it('a reader queues behind a published writer-intent marker rather than joining as a new reader', () => {
    const dir = makeTempDir('build-stdlib-lock-intent-');
    const lockPath = join(dir, 'intent.lock');
    const intentDir = `${lockPath}.writer-intent`;
    // Simulate a writer that has published intent but not yet won
    // `lockPath` -- D3: an arriving reader must queue behind it, not
    // register as a new reader. Uses this test's OWN pid so the default
    // liveness check recognises it as live without needing an override.
    mkdirSync(intentDir, { recursive: true });
    writeFileSync(
      join(intentDir, `${process.pid}-1`),
      JSON.stringify({ pid: process.pid, acquiredAt: Date.now() }),
      'utf8',
    );

    let clock = 0;
    let thrown: unknown;
    try {
      acquireBuildLock(REPO_ROOT, {
        lockPath,
        mode: 'shared',
        maxWaitMs: 100,
        pollIntervalMs: 20,
        now: () => clock,
        sleep: (ms) => {
          clock += ms;
        },
      });
    } catch (err) {
      thrown = err;
    }

    expect(thrown).toBeInstanceOf(Error);
    expect((thrown as Error).message).toContain('shared');
    // Proves the reader never registered as a live reader while intent stood.
    const readersDir = `${lockPath}.readers`;
    expect(existsSync(readersDir) ? readdirSync(readersDir) : []).toEqual([]);
  });
});

describe('acquireBuildLock -- shared mode: bounded wait', () => {
  it('throws, naming the lock path and the wait duration, once a live writer outlasts maxWaitMs (shared mode)', () => {
    const dir = makeTempDir('build-stdlib-lock-shared-timeout-');
    const lockPath = join(dir, 'held.lock');
    writeFileSync(lockPath, JSON.stringify({ pid: 999_999, acquiredAt: 0 }), 'utf8');

    let clock = 0;
    let thrown: unknown;
    try {
      acquireBuildLock(REPO_ROOT, {
        lockPath,
        mode: 'shared',
        maxWaitMs: 100,
        pollIntervalMs: 20,
        now: () => clock,
        sleep: (ms) => {
          clock += ms;
        },
        isProcessAlive: () => true,
      });
    } catch (err) {
      thrown = err;
    }

    expect(thrown).toBeInstanceOf(Error);
    const message = (thrown as Error).message;
    expect(message).toContain(lockPath);
    expect(message).toContain('100ms');
    expect(message).toContain('shared');
  });

  it('throws, naming the readers directory and the wait duration, once a live reader outlasts maxWaitMs while a writer drains', () => {
    const dir = makeTempDir('build-stdlib-lock-drain-timeout-');
    const lockPath = join(dir, 'drain.lock');
    const readersDir = `${lockPath}.readers`;
    mkdirSync(readersDir, { recursive: true });
    writeFileSync(join(readersDir, '999999-1'), JSON.stringify({ pid: 999_999, acquiredAt: 0 }), 'utf8');

    let clock = 0;
    let thrown: unknown;
    try {
      acquireBuildLock(REPO_ROOT, {
        lockPath,
        maxWaitMs: 100,
        pollIntervalMs: 20,
        now: () => clock,
        sleep: (ms) => {
          clock += ms;
        },
        isProcessAlive: () => true,
      });
    } catch (err) {
      thrown = err;
    }

    expect(thrown).toBeInstanceOf(Error);
    const message = (thrown as Error).message;
    expect(message).toContain(readersDir);
    expect(message).toContain('100ms');
    // A failed drain must not leave the mutex file behind for nobody to
    // release.
    expect(existsSync(lockPath)).toBe(false);
  });
});

describe('acquireBuildLock -- shared mode: stale reader reclamation', () => {
  it(
    'reclaims a reader entry left behind by a dead process and does not wedge a draining writer',
    async () => {
      const scratch = makeTempDir('build-stdlib-lock-reader-dead-');
      const workerScriptPath = join(scratch, 'shared-reader.mjs');
      writeFileSync(workerScriptPath, sharedReaderWorkerSource(), 'utf8');
      const lockPath = join(scratch, 'shared.lock');
      const readySentinelPath = join(scratch, 'reader-ready');

      // Long hold -- this worker is killed before it ever releases, so the
      // value only matters in that it never elapses naturally.
      const reader = spawnWorker(workerScriptPath, [JITI_MODULE_URL, BUILD_LOCK_MODULE_URL, lockPath, readySentinelPath, '30000']);
      liveChildren = [reader];
      await waitForFile(readySentinelPath, 5000);
      reader.kill('SIGKILL');
      await new Promise<void>((resolve) => reader.once('exit', () => resolve()));

      const readersDir = `${lockPath}.readers`;
      expect(readdirSync(readersDir).length).toBe(1);

      const start = Date.now();
      const release = acquireBuildLock(REPO_ROOT, { lockPath, maxWaitMs: 5000, pollIntervalMs: 10 });
      const elapsed = Date.now() - start;

      // Well under maxWaitMs -- proves reclaim, not a timed-out wait.
      expect(elapsed).toBeLessThan(2000);
      release();
      expect(existsSync(readersDir) ? readdirSync(readersDir).length : 0).toBe(0);
    },
    15_000,
  );
});

describe('acquireBuildLock -- shared mode: ownership-safe reader release', () => {
  it('does not delete a reader entry that has been reclaimed and reused by a different holder', () => {
    const dir = makeTempDir('build-stdlib-lock-reader-ownership-');
    const lockPath = join(dir, 'ownership.lock');

    const release = acquireBuildLock(REPO_ROOT, { lockPath, mode: 'shared' });
    const readersDir = `${lockPath}.readers`;
    const [entryName] = readdirSync(readersDir);
    const entryPath = join(readersDir, entryName as string);
    expect(existsSync(entryPath)).toBe(true);

    // Simulate the real trigger, the same way the writer-lock ownership
    // test above does: a stranger reclaimed this exact slot and wrote its
    // own content into it before this holder's release() ran.
    const strangerContent = JSON.stringify({ pid: 999_998, acquiredAt: Date.now() });
    writeFileSync(entryPath, strangerContent, 'utf8');

    release();

    // A naive `unregisterPresenceIfOwned` that does `rmSync(entryPath)`
    // unconditionally deletes the stranger's entry here -- verified by
    // temporarily swapping in that implementation and re-running this
    // test: it fails with `expect(existsSync(entryPath)).toBe(true)` --
    // "expected false to be true" -- because the unconditional version
    // removes the file regardless of its content.
    expect(existsSync(entryPath)).toBe(true);
    expect(readFileSync(entryPath, 'utf8')).toBe(strangerContent);
  });

  it('still deletes its own reader entry when it still names this exact acquisition', () => {
    const dir = makeTempDir('build-stdlib-lock-reader-ownership-self-');
    const lockPath = join(dir, 'self.lock');
    const readersDir = `${lockPath}.readers`;

    const release = acquireBuildLock(REPO_ROOT, { lockPath, mode: 'shared' });
    expect(readdirSync(readersDir).length).toBe(1);
    release();
    expect(existsSync(readersDir) ? readdirSync(readersDir).length : 0).toBe(0);
  });
});

describe('acquireBuildLock -- mode default and non-reentrancy', () => {
  it('defaults to exclusive mode when `mode` is not specified', () => {
    const dir = makeTempDir('build-stdlib-lock-default-mode-');
    const lockPath = join(dir, 'default.lock');

    const release = acquireBuildLock(REPO_ROOT, { lockPath });
    // Exclusive mode creates the mutex file itself, not a reader entry.
    expect(existsSync(lockPath)).toBe(true);
    expect(existsSync(`${lockPath}.readers`)).toBe(false);
    release();
  });

  it('does not silently succeed: a shared acquisition nested inside a held exclusive one, same process, times out', () => {
    const dir = makeTempDir('build-stdlib-lock-reentrant-');
    const lockPath = join(dir, 'reentrant.lock');

    const releaseExclusive = acquireBuildLock(REPO_ROOT, { lockPath });
    let clock = 0;
    let thrown: unknown;
    try {
      acquireBuildLock(REPO_ROOT, {
        lockPath,
        mode: 'shared',
        maxWaitMs: 100,
        pollIntervalMs: 20,
        now: () => clock,
        sleep: (ms) => {
          clock += ms;
        },
      });
    } catch (err) {
      thrown = err;
    } finally {
      releaseExclusive();
    }

    expect(thrown).toBeInstanceOf(Error);
    expect((thrown as Error).message).toContain(lockPath);
  });
});

describe('acquireBuildLock -- shared acquisitions are traced (STDLIB_LOCK_TRACE_DIR)', () => {
  it('emits an "acquired" trace record with the same shape a builder produces', () => {
    const traceDir = makeTempDir('build-stdlib-lock-shared-trace-');
    const dir = makeTempDir('build-stdlib-lock-shared-trace-lock-');
    const lockPath = join(dir, 'traced.lock');
    const previousEnv = process.env.STDLIB_LOCK_TRACE_DIR;
    process.env.STDLIB_LOCK_TRACE_DIR = traceDir;
    try {
      const release = acquireBuildLock(REPO_ROOT, { lockPath, mode: 'shared' });
      release();
    } finally {
      if (previousEnv === undefined) {
        delete process.env.STDLIB_LOCK_TRACE_DIR;
      } else {
        process.env.STDLIB_LOCK_TRACE_DIR = previousEnv;
      }
    }

    const traceFile = join(traceDir, `lock-trace-${process.pid}.jsonl`);
    const lines = readFileSync(traceFile, 'utf8').trim().split('\n');
    const record = JSON.parse(lines[lines.length - 1] as string) as Record<string, unknown>;
    expect(record.kind).toBe('acquired');
    expect(record.pid).toBe(process.pid);
    expect(typeof record.acquiredAtMs).toBe('number');
    expect(typeof record.waitMs).toBe('number');
    expect(typeof record.holdMs).toBe('number');
  });
});
