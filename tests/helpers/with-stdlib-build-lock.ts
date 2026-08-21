/**
 * stdlib-run-isolation T3 -- the reader-side seam for option D
 * (`planning/adr/ADR-003-stdlib-run-isolation.md`, approved by the user
 * 2026-08-21). Runs `fn` with the stdlib cross-process build lock
 * (`scripts/build-stdlib-packages/build-lock.ts`) held for the callback's
 * entire duration, so a concurrent `buildStdlibPackages()` run cannot
 * `rmSync`/rewrite `packages/<pkg>/generated/` while `fn` is reading it.
 *
 * Supports both a synchronous callback and one returning a `Promise` --
 * several of T4's 8 call sites `await import(...)` inside the critical
 * section -- and ALWAYS releases, in a `finally`-equivalent path, whether
 * `fn` returns, throws synchronously, or its returned `Promise` rejects.
 * `acquireBuildLock`'s `release()` is itself ownership-safe (hazard 1,
 * `build-lock.ts`'s `releaseIfOwned`): if this lock aged past
 * `staleAgeMs` and was reclaimed by a different holder before this
 * helper's release runs, release is a no-op rather than deleting a
 * stranger's lock. Keep the wrapped callback's critical section as narrow
 * as the call site allows -- this helper makes that the easy thing to do,
 * but cannot enforce it.
 *
 * `REPO_ROOT` is computed the SAME way `scripts/build-stdlib-packages.ts`
 * computes its own (this file's own directory, two levels up to the
 * checkout root): `defaultLockPath` (`build-lock.ts:108-111`) hashes the
 * repoRoot STRING to derive the deterministic lock path, so a
 * different-but-equivalent path string would silently produce a DIFFERENT
 * lock file and defeat option D entirely. Absent an `options.lockPath`
 * override, this helper therefore contends on exactly the same lock
 * `buildStdlibPackages()` acquires.
 */
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { acquireBuildLock, type BuildLockOptions } from '../../scripts/build-stdlib-packages/build-lock.js';

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

export function withStdlibBuildLock<T>(fn: () => Promise<T>, options?: BuildLockOptions): Promise<T>;
export function withStdlibBuildLock<T>(fn: () => T, options?: BuildLockOptions): T;
export function withStdlibBuildLock<T>(fn: () => T | Promise<T>, options: BuildLockOptions = {}): T | Promise<T> {
  const release = acquireBuildLock(REPO_ROOT, options);
  let result: T | Promise<T>;
  try {
    result = fn();
  } catch (err) {
    release();
    throw err;
  }
  if (result instanceof Promise) {
    return result.finally(release);
  }
  release();
  return result;
}
