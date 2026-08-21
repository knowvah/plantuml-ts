/**
 * Cross-process build lock for `buildStdlibPackages()` (stdlib-build-race
 * T4 -- D3, `plans/stdlib-build-race/decisions.md`: "the fix is a
 * cross-process lock AND an idempotent up-to-date skip"). T2
 * (`isGeneratedDirUpToDate` / `isSpriteSplitUpToDate`, `../build-stdlib-packages.ts`)
 * makes a SECOND run recognise a byte-identical tree and skip its
 * destructive `rmSync` -- but only if it gets to look at a COMPLETE tree.
 * Without a lock, a second run can observe a first run's *partial*,
 * in-progress tree, judge it stale, and `rmSync` it out from under the
 * first run's still-importing workers (`.agent-notes/sre-T0.md`). This
 * module closes that: only one process holds the lock at a time, so
 * whichever holder runs T2's predicates next always sees either a
 * complete tree (the common case -- skip) or no tree at all (genuinely
 * first run -- build).
 *
 * On-disk representation: one file at `lockPath` (default: a deterministic,
 * repo-keyed path under `os.tmpdir()`, so it is never part of the git tree
 * and needs no `.gitignore` entry -- every process running this script
 * against the SAME repo computes the same path with no shared config).
 * Created with the `wx` flag (`O_CREAT | O_EXCL`) -- atomic create-if-absent
 * on every platform Node supports, so of any number of racing callers,
 * exactly one observes success. Its content is `{ pid, acquiredAt }` JSON,
 * used ONLY for stale-lock recovery below -- never for the up-to-date
 * decision itself, which stays exactly T2's content hash. D4 governs
 * whether build OUTPUT is up to date, never a count or an mtime; an
 * age/liveness check on the LOCK HOLDER is a different question about a
 * different thing and is not what D4 forbids.
 *
 * Stale recovery: a lock is reclaimed (deleted, then re-contended) if
 * either its `pid` is no longer alive (the holder crashed) or it is older
 * than `staleAgeMs` (a safety net for a live-but-wedged holder). Without
 * this, one crashed holder would wedge EVERY future run permanently --
 * strictly worse than the race this module exists to fix.
 *
 * A lock file can also exist but fail to `JSON.parse` -- a crash or a full
 * disk mid-`write()` leaves exactly this behind (`{"pid":12345,"acqui`).
 * Content-based liveness is then unavailable, so this is treated as stale
 * too, but ONLY once the file's own mtime has aged past
 * `staleUnparseableGraceMs` (short: 2s default). That grace period is
 * necessary because `writeFileSync(path, ..., {flag:'wx'})` is `open()`
 * then `write()` then `close()` -- not one atomic content-visible step --
 * so a racing reader can legitimately observe a still-empty/partial file
 * for a few microseconds right after a holder's `open()` wins. Reading the
 * grace period off the file's mtime (not the embedded `acquiredAt`, which
 * an unparseable file by definition doesn't have) is legitimate: as
 * already established above, D4 governs whether build OUTPUT is up to
 * date (content hash, never count/mtime); this is a liveness check on the
 * LOCK FILE ITSELF, the same distinction as the pid/`staleAgeMs` check
 * just above, not a second instance of the thing D4 forbids.
 *
 * Bounded wait: {@link acquireBuildLock} polls with a synchronous sleep
 * (`Atomics.wait`, so it genuinely blocks this thread rather than spinning
 * the CPU -- required because `buildStdlibPackages()` is called
 * synchronously, with no `await`, from `globalSetup`
 * (`tests/helpers/build-stdlib-globalsetup.ts`)) and throws, naming
 * `lockPath` and the elapsed wait, once `maxWaitMs` is exceeded. It never
 * blocks indefinitely.
 */
import { createHash } from 'node:crypto';
import { readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const DEFAULT_STALE_AGE_MS = 60_000;
const DEFAULT_POLL_INTERVAL_MS = 50;
const DEFAULT_MAX_WAIT_MS = 30_000;
// Short by design: a `wx` write's open->write->close is sub-millisecond on
// any real filesystem, so 2s leaves ~1000x margin over the benign window
// while still reclaiming a genuinely abandoned corrupt lock in seconds,
// not permanently -- see the module doc comment above.
const DEFAULT_STALE_UNPARSEABLE_GRACE_MS = 2_000;

interface ResolvedBuildLockOptions {
  readonly lockPath: string;
  readonly staleAgeMs: number;
  readonly staleUnparseableGraceMs: number;
  readonly pollIntervalMs: number;
  readonly maxWaitMs: number;
  readonly now: () => number;
  readonly pid: number;
  readonly isProcessAlive: (pid: number) => boolean;
  readonly sleep: (ms: number) => void;
  readonly log: (message: string) => void;
}

/** Every field is optional -- a caller overrides only what a test (or a
 * future caller) needs; everything else falls back to {@link resolveOptions}'s
 * production defaults. */
export type BuildLockOptions = Partial<ResolvedBuildLockOptions>;

interface LockFileContents {
  readonly pid: number;
  readonly acquiredAt: number;
}

/** What reading `lockPath` finds: nothing at all (`'absent'`), a well-formed
 * `{pid, acquiredAt}` (`'parsed'`), or a file that exists but whose content
 * did not `JSON.parse` (`'corrupt'` -- carries the file's own `mtimeMs` in
 * place of a self-reported `acquiredAt`, since a corrupt file has none). */
type LockObservation =
  | { readonly kind: 'absent' }
  | { readonly kind: 'parsed'; readonly pid: number; readonly acquiredAt: number }
  | { readonly kind: 'corrupt'; readonly mtimeMs: number };

/** Deterministic per-repo lock path under `os.tmpdir()` -- every process
 * running this script against the SAME `repoRoot` computes the same path,
 * so no shared config and no repo-tracked file is needed. */
function defaultLockPath(repoRoot: string): string {
  const digest = createHash('sha256').update(repoRoot).digest('hex').slice(0, 16);
  return join(tmpdir(), `plantuml-ts-stdlib-build-${digest}.lock`);
}

/** Real liveness check: signal `0` sends no signal but still validates the
 * pid, per Node's `process.kill` semantics. `EPERM` means the process
 * exists but we lack permission to signal it -- still alive. Any other
 * error (`ESRCH`) means it is gone. */
function defaultIsProcessAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch (err) {
    return (err as NodeJS.ErrnoException).code === 'EPERM';
  }
}

/** Blocks the CALLING THREAD for `ms` via `Atomics.wait` on a scratch
 * buffer -- a genuine synchronous sleep, not a spin loop and not a timer. */
function sleepSync(ms: number): void {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, Math.max(0, ms));
}

function defaultLog(message: string): void {
  // eslint-disable-next-line no-console
  console.log(`[build-stdlib-lock] ${message}`);
}

function productionDefaults(repoRoot: string): ResolvedBuildLockOptions {
  return {
    lockPath: defaultLockPath(repoRoot),
    staleAgeMs: DEFAULT_STALE_AGE_MS,
    staleUnparseableGraceMs: DEFAULT_STALE_UNPARSEABLE_GRACE_MS,
    pollIntervalMs: DEFAULT_POLL_INTERVAL_MS,
    maxWaitMs: DEFAULT_MAX_WAIT_MS,
    now: Date.now,
    pid: process.pid,
    isProcessAlive: defaultIsProcessAlive,
    sleep: sleepSync,
    log: defaultLog,
  };
}

/** Merges `overrides` onto `defaults`, one key at a time, skipping any key
 * whose override value is `undefined` -- so a caller passing a partial
 * `BuildLockOptions` never blanks out a default it did not mean to touch. */
function applyOverrides(
  defaults: ResolvedBuildLockOptions,
  overrides: BuildLockOptions,
): ResolvedBuildLockOptions {
  const result = { ...defaults };
  for (const key of Object.keys(overrides) as (keyof ResolvedBuildLockOptions)[]) {
    const value = overrides[key];
    if (value !== undefined) {
      (result as Record<keyof ResolvedBuildLockOptions, unknown>)[key] = value;
    }
  }
  return result;
}

function resolveOptions(repoRoot: string, options: BuildLockOptions): ResolvedBuildLockOptions {
  return applyOverrides(productionDefaults(repoRoot), options);
}

/** Reads `lockPath` and its own mtime together (one `try`, so a file that
 * disappears between the two calls -- e.g. a concurrent release -- is
 * reported as `'absent'`, not `'corrupt'`): parses the content if it can,
 * else reports `'corrupt'` carrying the mtime the grace period below needs. */
function observeLock(lockPath: string): LockObservation {
  try {
    const raw = readFileSync(lockPath, 'utf8');
    const mtimeMs = statSync(lockPath).mtimeMs;
    try {
      const parsed: unknown = JSON.parse(raw);
      const candidate = parsed as Partial<LockFileContents>;
      if (typeof candidate.pid === 'number' && typeof candidate.acquiredAt === 'number') {
        return { kind: 'parsed', pid: candidate.pid, acquiredAt: candidate.acquiredAt };
      }
    } catch {
      // Falls through to 'corrupt' below -- unparseable JSON.
    }
    return { kind: 'corrupt', mtimeMs };
  } catch {
    return { kind: 'absent' };
  }
}

/** A `'parsed'` lock is stale if its holder is dead OR it has outlived
 * `staleAgeMs` -- either condition alone is enough to reclaim it: a
 * live-but-wedged holder is exactly as dangerous, for "never hangs
 * forever", as a dead one. A `'corrupt'` lock is stale once it has
 * outlived the short `staleUnparseableGraceMs` grace period (see the
 * module doc comment for why that grace period, not an immediate
 * reclaim, is required). `'absent'` is never stale -- there is nothing to
 * reclaim. */
function isStale(observation: LockObservation, opts: ResolvedBuildLockOptions): boolean {
  if (observation.kind === 'parsed') {
    return !opts.isProcessAlive(observation.pid) || opts.now() - observation.acquiredAt > opts.staleAgeMs;
  }
  if (observation.kind === 'corrupt') {
    return opts.now() - observation.mtimeMs > opts.staleUnparseableGraceMs;
  }
  return false;
}

/** `wx` (`O_CREAT | O_EXCL`): atomic create-if-absent on every platform Node
 * targets, so of any number of racing callers exactly one observes `true`.
 * Takes `acquiredAt` as a parameter (rather than calling `opts.now()`
 * itself) so the caller can remember the EXACT value written, to prove
 * ownership at release time -- see {@link releaseIfOwned}. */
function tryCreateLockFile(opts: ResolvedBuildLockOptions, acquiredAt: number): boolean {
  try {
    writeFileSync(opts.lockPath, JSON.stringify({ pid: opts.pid, acquiredAt }), { flag: 'wx' });
    return true;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'EEXIST') {
      return false;
    }
    throw err;
  }
}

/** Describes an observation for the "reclaiming stale lock" log line --
 * kept as its own small function so {@link reclaimIfStale} stays a single
 * `if`/`return` shape. */
function describeStaleObservation(observation: LockObservation, opts: ResolvedBuildLockOptions): string {
  if (observation.kind === 'parsed') {
    return `holder pid ${observation.pid}, age ${opts.now() - observation.acquiredAt}ms`;
  }
  if (observation.kind === 'corrupt') {
    return `unparseable content, age ${opts.now() - observation.mtimeMs}ms`;
  }
  return 'absent';
}

/** Reclaims (deletes) `opts.lockPath` if {@link observeLock} finds it stale,
 * and reports whether it did -- the caller uses this to retry immediately
 * rather than logging a misleading "waiting" line right after a reclaim. */
function reclaimIfStale(opts: ResolvedBuildLockOptions): boolean {
  const observation = observeLock(opts.lockPath);
  if (observation.kind === 'absent' || !isStale(observation, opts)) {
    return false;
  }
  opts.log(`reclaiming stale lock at ${opts.lockPath} (${describeStaleObservation(observation, opts)})`);
  rmSync(opts.lockPath, { force: true });
  return true;
}

/**
 * Releases `opts.lockPath` ONLY if it still names the exact acquisition
 * identified by `ownerPid`/`ownerAcquiredAt` -- the pid/timestamp pair
 * {@link tryCreateLockFile} wrote when this holder won the lock.
 *
 * Necessary because `isStale` (above) deliberately reclaims a lock older
 * than `staleAgeMs` even from a still-live holder (correct for a ~1s
 * builder; a real risk once this lock is held across a reader's critical
 * section, which can run longer -- stdlib-run-isolation option D,
 * `planning/adr/ADR-003-stdlib-run-isolation.md`). If that has already
 * happened by the time THIS holder calls `release()`, the file at
 * `lockPath` now belongs to whoever reclaimed it. An unconditional
 * `rmSync` would delete that stranger's lock, silently handing out a
 * second, overlapping grant of mutual exclusion -- worse than the original
 * problem this module exists to prevent. A mismatch (or the file already
 * being gone) is therefore a no-op, not an error: there is nothing this
 * holder is entitled to remove.
 */
function releaseIfOwned(opts: ResolvedBuildLockOptions, ownerPid: number, ownerAcquiredAt: number): void {
  const observation = observeLock(opts.lockPath);
  if (observation.kind === 'parsed' && observation.pid === ownerPid && observation.acquiredAt === ownerAcquiredAt) {
    rmSync(opts.lockPath, { force: true });
  }
}

/**
 * Acquires the cross-process build lock, waiting (bounded) for any current
 * holder to release, or be recognised as dead/stale and reclaimed. Returns
 * a `release()` callback the caller MUST invoke (in a `finally`) once its
 * critical section is done. `release()` is ownership-safe -- it removes
 * `lockPath` only if it still names THIS acquisition, and is a no-op if
 * `isStale` has already reclaimed it out from under a holder that outlived
 * `staleAgeMs` (see {@link releaseIfOwned}).
 *
 * Never blocks indefinitely: throws, naming `lockPath` and the elapsed
 * wait in milliseconds, once `maxWaitMs` is exceeded with the lock still
 * held by a live, non-stale holder.
 */
export function acquireBuildLock(repoRoot: string, options: BuildLockOptions = {}): () => void {
  const opts = resolveOptions(repoRoot, options);
  const deadline = opts.now() + opts.maxWaitMs;
  let hasLoggedWait = false;

  for (;;) {
    const acquiredAt = opts.now();
    if (tryCreateLockFile(opts, acquiredAt)) {
      return () => releaseIfOwned(opts, opts.pid, acquiredAt);
    }

    // A reclaim just cleared the path -- retry immediately. Neither
    // logging "waiting" nor sleeping first is honest here: we are not
    // blocked on a live holder, we are one `tryCreateLockFile` call away
    // from done.
    if (reclaimIfStale(opts)) {
      continue;
    }

    if (opts.now() >= deadline) {
      throw new Error(`Timed out after ${opts.maxWaitMs}ms waiting for the stdlib build lock at ${opts.lockPath}`);
    }

    if (!hasLoggedWait) {
      opts.log(`waiting for the stdlib build lock at ${opts.lockPath}`);
      hasLoggedWait = true;
    }
    opts.sleep(Math.min(opts.pollIntervalMs, Math.max(0, deadline - opts.now())));
  }
}
