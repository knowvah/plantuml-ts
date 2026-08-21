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
import { existsSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { afterEach, describe, expect, it } from 'vitest';

import { isGeneratedDirUpToDate } from '../../scripts/build-stdlib-packages.js';
import { acquireBuildLock } from '../../scripts/build-stdlib-packages/build-lock.js';

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const BUILD_LOCK_MODULE_URL = pathToFileURL(
  join(REPO_ROOT, 'scripts', 'build-stdlib-packages', 'build-lock.ts'),
).href;

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

const [, , buildLockModuleUrl, lockPath, buildDir, expectedContent] = process.argv;

async function main() {
  const { acquireBuildLock } = await import(buildLockModuleUrl);
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

const [, , buildLockModuleUrl, lockPath, readySentinelPath, holdMsArg] = process.argv;
const holdMs = Number(holdMsArg);

function sleepSync(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

async function main() {
  const { acquireBuildLock } = await import(buildLockModuleUrl);
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
  }, 120_000);

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
        spawnWorker(workerScriptPath, [BUILD_LOCK_MODULE_URL, lockPath, buildDir, expectedContent]),
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
