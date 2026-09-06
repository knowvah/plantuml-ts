/**
 * Cross-process build lock for `buildStdlibPackages()` (stdlib-build-race
 * T4 -- D3, `plans/stdlib-build-race/decisions.md`). T2
 * (`isGeneratedDirUpToDate` / `isSpriteSplitUpToDate`, `../build-stdlib-packages.ts`)
 * makes a second run recognise a byte-identical tree and skip its
 * destructive `rmSync` -- but only if it sees a COMPLETE tree. Without a
 * lock, a second run can observe a first run's partial tree, judge it
 * stale, and `rmSync` it out from under the first run's still-importing
 * workers (`.agent-notes/sre-T0.md`). This module closes that: only one
 * writer holds the lock at a time, so whichever holder runs T2's
 * predicates next always sees either a complete tree or none at all.
 *
 * On-disk representation: one file at `lockPath` (default: a
 * deterministic, repo-keyed path under `os.tmpdir()` -- every process
 * against the same repo computes the same path with no shared config),
 * created with `wx` (`O_CREAT | O_EXCL`) -- atomic create-if-absent, so of
 * any number of racing callers exactly one observes success. Content is
 * `{ pid, acquiredAt }` JSON, used ONLY for stale-lock recovery -- never
 * for T2's up-to-date decision, which stays exactly its content hash.
 *
 * Stale recovery: a lock is reclaimed if its `pid` is no longer alive or
 * it is older than `staleAgeMs` (a safety net for a live-but-wedged
 * holder) -- without this, one crashed holder wedges every future run
 * permanently. A lock file can also exist but fail to `JSON.parse` -- a
 * crash or full disk mid-`write()` leaves exactly this behind. That is
 * treated as stale too, but only once its mtime outlives
 * `staleUnparseableGraceMs` (2s default): `writeFileSync(..., {flag:'wx'})`
 * is open-then-write-then-close, not one atomic content-visible step, so a
 * racing reader can legitimately see a still-partial file for a few
 * microseconds right after a holder's `open()` wins.
 *
 * Bounded wait: {@link acquireBuildLock} polls with a synchronous sleep
 * (`Atomics.wait` -- required because `buildStdlibPackages()` runs
 * synchronously, with no `await`, from `globalSetup`) and throws, naming
 * the path and elapsed wait, once `maxWaitMs` is exceeded. Never blocks
 * indefinitely.
 *
 * stdlib-lock-sharing T1 -- `options.mode` (default `'exclusive'`) adds a
 * shared (reader) mode per `plans/stdlib-lock-sharing/decisions.md`
 * D1-D4: readers never conflict with each other, only with a writer, so
 * any number may hold concurrently across any number of processes. A
 * writer still excludes every other writer via `lockPath` as before,
 * additionally drains all current readers before proceeding, and
 * publishes a writer-intent marker (D3) for its whole attempt so
 * late-arriving readers queue behind it. Presence-directory mechanics
 * live in `./reader-registry.ts`, reused for both directories.
 */
import { createHash } from 'node:crypto';
import { appendFileSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  countLivePresence,
  drainPresence,
  readersDirFor,
  registerPresence,
  unregisterPresenceIfOwned,
  writerIntentDirFor,
} from './reader-registry.js';

const DEFAULT_STALE_AGE_MS = 60_000;
const DEFAULT_POLL_INTERVAL_MS = 50;
const DEFAULT_MAX_WAIT_MS = 30_000;
// Short by design: a `wx` write's open->write->close is sub-millisecond on
// any real filesystem, so 2s leaves ~1000x margin over the benign window
// while still reclaiming a genuinely abandoned corrupt lock in seconds,
// not permanently -- see the module doc comment above.
const DEFAULT_STALE_UNPARSEABLE_GRACE_MS = 2_000;

/**
 * stdlib-lock-sharing T0 -- OFF-by-default, env-gated acquisition tracing.
 * No production caller passes `now`/`log` overrides, so this is the only
 * seam a real multi-process `npm test` run can be observed through (see
 * `scripts/measure-lock-contention.ts`). Cost when unset: one
 * `process.env` read plus one `!== undefined` check per acquisition -- no
 * `fs` call, no behavioral change.
 */
const LOCK_TRACE_DIR_ENV_VAR = 'STDLIB_LOCK_TRACE_DIR';

/** One JSON line per acquisition, appended to `<dir>/lock-trace-<pid>.jsonl`
 * -- one file PER PROCESS, so concurrent processes never race on the same
 * file. `waitMs` is on both variants for one shared "slow" predicate. */
type LockTraceRecord =
  | {
      readonly kind: 'acquired';
      readonly pid: number;
      readonly acquiredAtMs: number;
      readonly waitMs: number;
      readonly holdMs: number;
    }
  | { readonly kind: 'timeout'; readonly pid: number; readonly waitMs: number };

function appendLockTrace(dir: string, record: LockTraceRecord): void {
  appendFileSync(join(dir, `lock-trace-${record.pid}.jsonl`), `${JSON.stringify(record)}\n`, 'utf8');
}

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
  /** D4 -- `'shared'` (reader) or `'exclusive'` (writer); defaults to
   * `'exclusive'` so every pre-existing caller is untouched. */
  readonly mode: 'shared' | 'exclusive';
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
    mode: 'exclusive',
  };
}

/** Merges `overrides` onto `defaults`, one key at a time, skipping any key
 * whose override value is `undefined` -- so a caller passing a partial
 * `BuildLockOptions` never blanks out a default it did not mean to touch. */
function applyOverrides(defaults: ResolvedBuildLockOptions, overrides: BuildLockOptions): ResolvedBuildLockOptions {
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

/** Releases `opts.lockPath` ONLY if it still names the exact acquisition
 * identified by `ownerPid`/`ownerAcquiredAt`. Necessary because `isStale`
 * deliberately reclaims a lock older than `staleAgeMs` even from a
 * still-live holder; if that already happened, `lockPath` now belongs to
 * whoever reclaimed it, and an unconditional `rmSync` would delete that
 * stranger's lock. A mismatch (or the file already gone) is a no-op. */
function releaseIfOwned(opts: ResolvedBuildLockOptions, ownerPid: number, ownerAcquiredAt: number): void {
  const observation = observeLock(opts.lockPath);
  if (observation.kind === 'parsed' && observation.pid === ownerPid && observation.acquiredAt === ownerAcquiredAt) {
    rmSync(opts.lockPath, { force: true });
  }
}

/** Appends one `'acquired'` record; no-op when unset. Shared by both
 * modes' release closures so both trace the identical shape (T4). */
function appendAcquiredTrace(
  opts: ResolvedBuildLockOptions,
  acquiredAt: number,
  waitStart: number,
  traceDir: string | undefined,
): void {
  if (traceDir === undefined) {
    return;
  }
  appendLockTrace(traceDir, {
    kind: 'acquired',
    pid: opts.pid,
    acquiredAtMs: acquiredAt,
    waitMs: acquiredAt - waitStart,
    holdMs: opts.now() - acquiredAt,
  });
}

/** Appends one `'timeout'` record; no-op when `traceDir` is unset. Shared
 * by every throw site so all of them record the same shape. */
function appendTimeoutTrace(opts: ResolvedBuildLockOptions, waitStart: number, traceDir: string | undefined): void {
  if (traceDir === undefined) {
    return;
  }
  appendLockTrace(traceDir, { kind: 'timeout', pid: opts.pid, waitMs: opts.now() - waitStart });
}

/** `release()` for an EXCLUSIVE acquisition: releases `lockPath` if owned, plus the trace-append. */
function buildRelease(
  opts: ResolvedBuildLockOptions,
  acquiredAt: number,
  waitStart: number,
  traceDir: string | undefined,
): () => void {
  return () => {
    releaseIfOwned(opts, opts.pid, acquiredAt);
    appendAcquiredTrace(opts, acquiredAt, waitStart, traceDir);
  };
}

/** `release()` for a SHARED acquisition: removes this reader's own entry
 * if owned, plus the trace-append. Never touches `lockPath`. */
function buildSharedRelease(
  opts: ResolvedBuildLockOptions,
  entryPath: string,
  acquiredAt: number,
  waitStart: number,
  traceDir: string | undefined,
): () => void {
  return () => {
    unregisterPresenceIfOwned(entryPath, opts.pid, acquiredAt);
    appendAcquiredTrace(opts, acquiredAt, waitStart, traceDir);
  };
}

/** Is `lockPath` held by a live writer? A stale one is reclaimed here. */
function writerHoldsLock(opts: ResolvedBuildLockOptions): boolean {
  const observation = observeLock(opts.lockPath);
  if (observation.kind === 'absent') {
    return false;
  }
  if (isStale(observation, opts)) {
    reclaimIfStale(opts);
    return false;
  }
  return true;
}

/** No live writer and no published writer-intent (D3) -- checked before
 * AND after registering a reader entry (D2's re-check). */
function noWriterPresent(opts: ResolvedBuildLockOptions, intentDir: string): boolean {
  return !writerHoldsLock(opts) && countLivePresence(intentDir, opts) === 0;
}

/** The original exclusive acquisition loop, unchanged from before shared
 * mode existed. Returns the winning `acquiredAt`. */
function acquireWriterFile(
  opts: ResolvedBuildLockOptions,
  deadline: number,
  traceDir: string | undefined,
  waitStart: number,
): number {
  let hasLoggedWait = false;
  for (;;) {
    const acquiredAt = opts.now();
    if (tryCreateLockFile(opts, acquiredAt)) {
      return acquiredAt;
    }
    // A reclaim just cleared the path -- retry immediately, not a "waiting" wait.
    if (reclaimIfStale(opts)) {
      continue;
    }

    if (opts.now() >= deadline) {
      appendTimeoutTrace(opts, waitStart, traceDir);
      throw new Error(`Timed out after ${opts.maxWaitMs}ms waiting for the stdlib build lock at ${opts.lockPath}`);
    }

    if (!hasLoggedWait) {
      opts.log(`waiting for the stdlib build lock at ${opts.lockPath}`);
      hasLoggedWait = true;
    }
    opts.sleep(Math.min(opts.pollIntervalMs, Math.max(0, deadline - opts.now())));
  }
}

/** Exclusive acquisition -- D3/D4. Publishes writer-intent for the whole
 * attempt, wins `lockPath` as before, then drains readers (bounded by
 * `deadline`); a drain timeout releases `lockPath` before throwing. */
function acquireExclusive(
  opts: ResolvedBuildLockOptions,
  waitStart: number,
  deadline: number,
  traceDir: string | undefined,
): () => void {
  const intentDir = writerIntentDirFor(opts.lockPath);
  const intentAcquiredAt = opts.now();
  const intentEntryPath = registerPresence(intentDir, opts.pid, intentAcquiredAt);
  try {
    const acquiredAt = acquireWriterFile(opts, deadline, traceDir, waitStart);
    const readersDir = readersDirFor(opts.lockPath);
    if (!drainPresence(readersDir, opts, deadline)) {
      releaseIfOwned(opts, opts.pid, acquiredAt);
      appendTimeoutTrace(opts, waitStart, traceDir);
      throw new Error(`Timed out after ${opts.maxWaitMs}ms waiting for readers to drain at ${readersDir}`);
    }
    return buildRelease(opts, acquiredAt, waitStart, traceDir);
  } finally {
    unregisterPresenceIfOwned(intentEntryPath, opts.pid, intentAcquiredAt);
  }
}

/** D1/D2: registers a presence entry only once no writer is present, then
 * re-verifies (the D2 re-check); a writer that won that race causes the
 * entry to be removed. Returns the winning entry, or `undefined` to retry. */
function tryRegisterReader(
  opts: ResolvedBuildLockOptions,
  readersDir: string,
  intentDir: string,
): { readonly entryPath: string; readonly acquiredAt: number } | undefined {
  if (!noWriterPresent(opts, intentDir)) {
    return undefined;
  }
  const acquiredAt = opts.now();
  const entryPath = registerPresence(readersDir, opts.pid, acquiredAt);
  if (noWriterPresent(opts, intentDir)) {
    return { entryPath, acquiredAt };
  }
  unregisterPresenceIfOwned(entryPath, opts.pid, acquiredAt);
  return undefined;
}

/** Shared acquisition -- D1/D2 via {@link tryRegisterReader}, bounded by
 * `deadline` like every other wait path. Any number of shared
 * acquisitions, in any number of processes, proceed concurrently. */
function acquireShared(
  opts: ResolvedBuildLockOptions,
  waitStart: number,
  deadline: number,
  traceDir: string | undefined,
): () => void {
  const readersDir = readersDirFor(opts.lockPath);
  const intentDir = writerIntentDirFor(opts.lockPath);
  let hasLoggedWait = false;
  for (;;) {
    const registered = tryRegisterReader(opts, readersDir, intentDir);
    if (registered !== undefined) {
      return buildSharedRelease(opts, registered.entryPath, registered.acquiredAt, waitStart, traceDir);
    }

    if (opts.now() >= deadline) {
      appendTimeoutTrace(opts, waitStart, traceDir);
      throw new Error(
        `Timed out after ${opts.maxWaitMs}ms waiting for the stdlib build lock (shared) at ${opts.lockPath}`,
      );
    }

    if (!hasLoggedWait) {
      opts.log(`waiting for the stdlib build lock (shared) at ${opts.lockPath} -- a writer is present or waiting`);
      hasLoggedWait = true;
    }
    opts.sleep(Math.min(opts.pollIntervalMs, Math.max(0, deadline - opts.now())));
  }
}

/** Acquires the cross-process build lock in either mode (`options.mode`,
 * default `'exclusive'`) and returns a `release()` callback the caller
 * MUST invoke (in a `finally`) once done. Never blocks indefinitely, in
 * either mode: every wait path throws, naming the path and elapsed wait,
 * once `maxWaitMs` is exceeded. See {@link acquireExclusive} and
 * {@link acquireShared} for each mode's own bounded-wait behaviour. */
export function acquireBuildLock(repoRoot: string, options: BuildLockOptions = {}): () => void {
  const opts = resolveOptions(repoRoot, options);
  const traceDir = process.env[LOCK_TRACE_DIR_ENV_VAR];
  const waitStart = opts.now();
  const deadline = waitStart + opts.maxWaitMs;
  return opts.mode === 'shared'
    ? acquireShared(opts, waitStart, deadline, traceDir)
    : acquireExclusive(opts, waitStart, deadline, traceDir);
}
