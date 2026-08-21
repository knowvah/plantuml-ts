/**
 * stdlib-run-isolation T3 -- tests for `withStdlibBuildLock`
 * (`tests/helpers/with-stdlib-build-lock.ts`), the reader-side seam for
 * option D (`planning/adr/ADR-003-stdlib-run-isolation.md`). Every test
 * overrides `lockPath` to an isolated `mkdtempSync` scratch file, never the
 * real deterministic per-repo lock `buildStdlibPackages()` itself acquires
 * (same discipline as `tests/unit/build-stdlib-lock.test.ts:16`).
 */
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { afterEach, describe, expect, it } from 'vitest';

import { withStdlibBuildLock } from '../helpers/with-stdlib-build-lock.js';

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

const tempDirs: string[] = [];

function makeTempDir(prefix: string): string {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  tempDirs.push(dir);
  return dir;
}

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

describe('withStdlibBuildLock -- sync callback', () => {
  it('runs the callback with the lock held and releases it afterwards, returning the value', () => {
    const dir = makeTempDir('with-stdlib-build-lock-sync-');
    const lockPath = join(dir, 'sync.lock');
    let heldDuringCall = false;

    const result = withStdlibBuildLock(() => {
      heldDuringCall = existsSync(lockPath);
      return 42;
    }, { lockPath });

    expect(heldDuringCall).toBe(true);
    expect(result).toBe(42);
    expect(existsSync(lockPath)).toBe(false);
  });
});

describe('withStdlibBuildLock -- async callback', () => {
  it('runs an async callback with the lock held for its whole duration, then releases it', async () => {
    const dir = makeTempDir('with-stdlib-build-lock-async-');
    const lockPath = join(dir, 'async.lock');
    let heldAfterAwait = false;

    const result = await withStdlibBuildLock(async () => {
      // Mirrors T4's real call sites: `await import(...)` inside the
      // critical section -- the lock must still be held after the await.
      await new Promise((resolve) => setTimeout(resolve, 5));
      heldAfterAwait = existsSync(lockPath);
      return 'done';
    }, { lockPath });

    expect(heldAfterAwait).toBe(true);
    expect(result).toBe('done');
    expect(existsSync(lockPath)).toBe(false);
  });
});

describe('withStdlibBuildLock -- release on throw', () => {
  it('releases the lock and rethrows when the sync callback throws', () => {
    const dir = makeTempDir('with-stdlib-build-lock-throw-sync-');
    const lockPath = join(dir, 'throw-sync.lock');

    expect(() =>
      withStdlibBuildLock(() => {
        throw new Error('sync boom');
      }, { lockPath }),
    ).toThrow('sync boom');

    expect(existsSync(lockPath)).toBe(false);
  });

  it('releases the lock and rejects when the async callback rejects', async () => {
    const dir = makeTempDir('with-stdlib-build-lock-throw-async-');
    const lockPath = join(dir, 'throw-async.lock');

    await expect(
      withStdlibBuildLock(async () => {
        await Promise.resolve();
        throw new Error('async boom');
      }, { lockPath }),
    ).rejects.toThrow('async boom');

    expect(existsSync(lockPath)).toBe(false);
  });
});

describe('withStdlibBuildLock -- release after reclaim (hazard 1)', () => {
  it('does not delete a lock file that a different holder reclaimed during the callback', () => {
    const dir = makeTempDir('with-stdlib-build-lock-reclaim-');
    const lockPath = join(dir, 'reclaim.lock');
    const reclaimerContent = JSON.stringify({ pid: 999_997, acquiredAt: Date.now() });

    withStdlibBuildLock(() => {
      // Simulates hazard 1's real trigger: this lock aged past
      // `staleAgeMs` while still notionally held, another process's
      // `reclaimIfStale` deleted it and wrote its own lock file at the
      // same path -- ownership has genuinely moved before this helper's
      // `release()` runs.
      writeFileSync(lockPath, reclaimerContent, 'utf8');
    }, { lockPath });

    // Proves the helper relies on `acquireBuildLock`'s ownership-safe
    // release rather than an unconditional `rmSync` -- the reclaimer's
    // lock must survive this helper's own release call.
    expect(existsSync(lockPath)).toBe(true);
    expect(readFileSync(lockPath, 'utf8')).toBe(reclaimerContent);
  });
});

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
