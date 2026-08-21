# stdlib build lock — why the 30s budget is exceeded, measured

Measured 2026-08-21 by temporary instrumentation of `acquireBuildLock`
(appending `WAIT <pid> <ms>` at acquisition and `HOLD <pid> <ms>` at release).
The instrumentation was reverted immediately after; `git diff` on
`build-lock.ts` is empty.

## Observation: readers take an EXCLUSIVE lock, but readers do not conflict with readers

- **Context**: After `stdlib-run-isolation` (SI35) option D put 8 reader test
  files under the cross-process build lock, two concurrent full suites fail
  with `Timed out after 30000ms waiting for the stdlib build lock`
  (`build-lock.ts:315`).
- **Finding**: The lock is a plain mutex — `wx` create-if-absent, one holder.
  Every reader acquires it in the same exclusive mode a *builder* does. But a
  reader only needs to exclude a **builder**; it has no conflict with another
  reader. During the test phase the only writer that can appear is a *second
  process's* `globalSetup` build, which is exactly the residual SI35 closed.
  So the overwhelming majority of acquisitions serialise against peers they
  never needed to exclude.
- **Confidence**: High — measured, not inferred.

## The numbers

| | Single run | Two concurrent suites |
|---|---|---|
| Acquisitions | 288 | 573 |
| Total time **holding** | 12,370 ms | 35,921 ms |
| Total time **waiting** | **54,745 ms** | **229,592 ms** |
| Mean hold | 43 ms | 63 ms |
| Max hold | 7,515 ms | 12,179 ms |
| Max wait | 9,483 ms | **29,724 ms** |
| `maxWaitMs` timeouts | 0 | 3 (all in one run) |

Two readings dominate:

1. **229.6 s of cumulative waiting to protect 35.9 s of actual holding** — a
   6.4:1 waste ratio. That waiting is almost entirely reader-versus-reader,
   which is contention with no safety value.
2. **Max wait 29,724 ms against a 30,000 ms budget.** The suite is not
   comfortably inside the limit and occasionally over it; it is grazing the
   cliff on every concurrent run. That is why failures are intermittent
   (1-2 of 6 runs) rather than deterministic.

Also note **288 acquisitions in a single run**, not the 8 the conversion
implies: the wrapped calls sit inside `it.each`/parametrized cases, so each
converted file acquires many times.

## Why raising `maxWaitMs` is the wrong fix

It moves the cliff without removing it. The waiting is quadratic-ish in
concurrency — doubling the suites roughly quadrupled total wait (54.7 s →
229.6 s) — so a 60 s budget buys one more concurrent run at most, while
doubling how long a genuine deadlock takes to surface. The 2-minute test
timeouts SI35 already had to introduce came from the same pressure.

## Recommended fix: a shared/exclusive (readers–writer) lock

Readers acquire in **shared** mode and may hold concurrently; the builder
acquires in **exclusive** mode, waiting for readers to drain and blocking new
ones. This preserves the exact safety property option D bought — a reader is
never mid-read while a builder `rmSync`s the tree — while removing the
reader-versus-reader serialisation that produces essentially all 229.6 s of
waiting.

Sketch, on a filesystem with no native rwlock:

- Writer lock stays the existing `wx` file.
- Readers register a presence file under `<lock>.readers/<pid>-<seq>`.
- Reader acquire: verify no writer lock, create the presence file, re-verify
  no writer appeared (else remove, back off, retry).
- Writer acquire: take the `wx` lock, then wait for the readers directory to
  drain.
- Stale reader entries reclaimed by the same PID-liveness plus age rules the
  writer lock already uses, and `releaseIfOwned`'s ownership discipline
  applies unchanged.

This is a real design change — a new lock mode, its own tests, and the
call-site conversion — not a one-line tuning. It is mission-sized, not a
drive-by edit.

## Cheaper alternatives, and why they are worse

- **Acquire once per file rather than per case** (288 → ~8 per run). Cuts
  acquisition count but *widens* each hold to cover the whole file, so total
  hold grows toward total wait and a builder waits longer. Trades one cliff
  for another.
- **Drop the lock from the two `npm pack` tests** (max hold 7.5-12.2 s is
  almost certainly the `npm pack` subprocess). Recovers most of the hold time
  but reopens precisely the gap option D was chosen to close.
