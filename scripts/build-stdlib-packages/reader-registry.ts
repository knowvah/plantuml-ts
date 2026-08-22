/**
 * stdlib-lock-sharing T1 -- presence-directory primitive backing
 * {@link acquireBuildLock}'s shared (reader) mode
 * (`plans/stdlib-lock-sharing/decisions.md` D1). Deliberately generic: it
 * knows nothing about "readers" or "writers" specifically, only "who is
 * currently present in this directory" -- `build-lock.ts` uses ONE instance
 * of this primitive for the readers directory (who currently holds the
 * shared lock) and a SECOND, structurally identical instance for the
 * writer-intent directory (D3: who currently wants the exclusive lock),
 * without this module needing to know which is which.
 *
 * On-disk representation: one file per present holder, at
 * `<dir>/<pid>-<seq>`, created with the same `wx` (`O_CREAT | O_EXCL`)
 * atomicity `build-lock.ts`'s single mutex file already relies on. Unlike
 * that single file, every entry name is unique (pid plus a monotonic
 * in-process sequence number), so concurrent holders -- including several
 * from the SAME process -- never contend with each other to register; each
 * `registerPresence` call always succeeds on its first attempt. D1 rejected
 * a counter file (needs a non-atomic read-modify-write) and heartbeats
 * (wall-clock-dependent) for exactly this reason: one file per holder is
 * the shape that reuses `wx` atomicity instead of inventing a new one.
 *
 * Stale reclamation mirrors `build-lock.ts`'s `isStale`/`observeLock`
 * (same `{pid, acquiredAt}` content, same dead-pid-or-aged-out rule, same
 * unparseable-content grace period) but is reimplemented here rather than
 * imported: the two modules reclaim different things on a stale finding --
 * this one deletes one entry among many, `build-lock.ts` deletes the sole
 * mutex file -- and keeping each module's file-format primitives local
 * avoids a one-off private export across the module boundary for ~15 lines
 * of genuinely independent logic.
 */
import { mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

/** The subset of `build-lock.ts`'s `ResolvedBuildLockOptions` this module
 * needs -- structurally compatible, so callers pass their full options
 * object with no plucking required. Interface segregation (this module
 * must not depend on lock-file-specific fields like `lockPath`). */
export interface PresenceOptions {
  readonly staleAgeMs: number;
  readonly staleUnparseableGraceMs: number;
  readonly now: () => number;
  readonly isProcessAlive: (pid: number) => boolean;
  readonly log: (message: string) => void;
  readonly sleep: (ms: number) => void;
  readonly pollIntervalMs: number;
}

interface PresenceEntryContents {
  readonly pid: number;
  readonly acquiredAt: number;
}

type PresenceObservation =
  | { readonly kind: 'parsed'; readonly pid: number; readonly acquiredAt: number }
  | { readonly kind: 'corrupt'; readonly mtimeMs: number }
  | { readonly kind: 'absent' };

/** `<lockPath>.readers` -- who currently holds the shared lock. */
export function readersDirFor(lockPath: string): string {
  return `${lockPath}.readers`;
}

/** `<lockPath>.writer-intent` -- D3: who currently wants the exclusive
 * lock. A reader that sees a live entry here queues rather than joining
 * the current readers, even before any writer has won the mutex file. */
export function writerIntentDirFor(lockPath: string): string {
  return `${lockPath}.writer-intent`;
}

// Monotonic within this process -- combined with `pid`, guarantees every
// entry this process ever registers (across any number of concurrent
// shared acquisitions, in any directory) has a unique filename.
let sequence = 0;

/** Atomically registers presence: creates `dir` if needed, then creates a
 * uniquely-named entry file via `wx`. Never contends with a concurrent
 * registration -- by construction, no two calls (in this process or any
 * other) ever compute the same path. Returns the entry's full path so the
 * caller can later release ownership-safely via
 * {@link unregisterPresenceIfOwned}. */
export function registerPresence(dir: string, pid: number, acquiredAt: number): string {
  mkdirSync(dir, { recursive: true });
  sequence += 1;
  const entryPath = join(dir, `${pid}-${sequence}`);
  const content: PresenceEntryContents = { pid, acquiredAt };
  writeFileSync(entryPath, JSON.stringify(content), { flag: 'wx' });
  return entryPath;
}

/** Removes `entryPath` ONLY if it still names the exact registration
 * identified by `ownerPid`/`ownerAcquiredAt` -- the same ownership
 * discipline as `build-lock.ts`'s `releaseIfOwned`, and for the same
 * reason: a stale entry can be reclaimed by a different process while this
 * holder still believes it owns it (see the "reclaimed by a stranger" test
 * in `tests/unit/build-stdlib-lock.test.ts`). A mismatch, or the file
 * already being gone, is a no-op -- there is nothing this holder is
 * entitled to remove. */
export function unregisterPresenceIfOwned(entryPath: string, ownerPid: number, ownerAcquiredAt: number): void {
  let raw: string;
  try {
    raw = readFileSync(entryPath, 'utf8');
  } catch {
    return;
  }
  try {
    const parsed = JSON.parse(raw) as Partial<PresenceEntryContents>;
    if (parsed.pid === ownerPid && parsed.acquiredAt === ownerAcquiredAt) {
      rmSync(entryPath, { force: true });
    }
  } catch {
    // Unparseable -- not recognisably this holder's own content, so there
    // is nothing safe to remove.
  }
}

function observeEntry(entryPath: string): PresenceObservation {
  try {
    const raw = readFileSync(entryPath, 'utf8');
    const mtimeMs = statSync(entryPath).mtimeMs;
    try {
      const parsed = JSON.parse(raw) as Partial<PresenceEntryContents>;
      if (typeof parsed.pid === 'number' && typeof parsed.acquiredAt === 'number') {
        return { kind: 'parsed', pid: parsed.pid, acquiredAt: parsed.acquiredAt };
      }
    } catch {
      // Falls through to 'corrupt' below.
    }
    return { kind: 'corrupt', mtimeMs };
  } catch {
    return { kind: 'absent' };
  }
}

/** A dead-pid or aged-out entry is stale (mirrors `build-lock.ts`'s
 * `isStale`); an unparseable entry is stale only once it has outlived
 * `staleUnparseableGraceMs`, for the identical open-then-write-then-close
 * non-atomicity reason documented there. */
function isEntryStale(observation: PresenceObservation, opts: PresenceOptions): boolean {
  if (observation.kind === 'parsed') {
    return !opts.isProcessAlive(observation.pid) || opts.now() - observation.acquiredAt > opts.staleAgeMs;
  }
  if (observation.kind === 'corrupt') {
    return opts.now() - observation.mtimeMs > opts.staleUnparseableGraceMs;
  }
  return false;
}

/** Counts live (non-stale) entries in `dir`, reclaiming any stale one
 * found along the way -- a crashed reader's dead-pid entry is deleted here
 * rather than left to wedge a draining writer forever. Absent directory
 * (never registered against yet) counts as zero, not an error. */
export function countLivePresence(dir: string, opts: PresenceOptions): number {
  let names: string[];
  try {
    names = readdirSync(dir);
  } catch {
    return 0;
  }
  let live = 0;
  for (const name of names) {
    const entryPath = join(dir, name);
    const observation = observeEntry(entryPath);
    if (observation.kind === 'absent') {
      continue;
    }
    if (isEntryStale(observation, opts)) {
      opts.log(`reclaiming stale presence entry at ${entryPath}`);
      rmSync(entryPath, { force: true });
      continue;
    }
    live += 1;
  }
  return live;
}

/** Polls `dir` until it holds no live entries or `deadline` passes.
 * Returns whether it drained -- never throws; the caller (which knows
 * whether this is a reader drain, a writer-intent check, or something
 * else) decides what a timeout means. Bounded by `deadline`, exactly like
 * every other wait path in {@link acquireBuildLock}. */
export function drainPresence(dir: string, opts: PresenceOptions, deadline: number): boolean {
  let hasLoggedWait = false;
  for (;;) {
    if (countLivePresence(dir, opts) === 0) {
      return true;
    }
    if (opts.now() >= deadline) {
      return false;
    }
    if (!hasLoggedWait) {
      opts.log(`waiting for presence directory to drain at ${dir}`);
      hasLoggedWait = true;
    }
    opts.sleep(Math.min(opts.pollIntervalMs, Math.max(0, deadline - opts.now())));
  }
}
