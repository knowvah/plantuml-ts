# `with-stdlib-build-lock.test.ts:299` — the CI failure was measuring node
# startup, not the lock

Diagnosed and fixed 2026-08-23. The assertion failed on **three consecutive
CI runs** while passing locally every time.

## Observation: the threshold was fitted to a fast machine's spawn cost

- **Context**: `withStdlibBuildLock -- shared mode across processes (D1)`
  spawns two node workers that each acquire the lock in shared mode and hold
  for `holdMs = 400`. It asserted
  `expect(elapsed).toBeLessThan(holdMs * 1.6)` — 640 ms — where `elapsed` is
  timed from **before the two `spawnWorker` calls**.
- **Finding**: `elapsed` is `spawn + node boot + jiti import + jiti
  TRANSPILE of the helper module + acquire + holdMs + teardown`. Only
  `holdMs` and `acquire` have anything to do with the lock. The 1.6
  multiplier leaves just **240 ms** above `holdMs` for all of that startup.
  Instrumented (probe added, measured, reverted):

  | | quiet, load1 16 | under load1 41-50 |
  |---|---|---|
  | spawn → A acquired | 64 ms | 79-100 ms |
  | spawn → B acquired | 63 ms | 79-100 ms |
  | skew between workers | 1 ms | 1-21 ms |
  | **first acquire → both exited** | **420 ms** | **413 / 430 / 413 ms** |
  | `elapsed` (what was asserted) | 483 ms | 494-509 ms |

  The concurrent phase is **load-independent** — it is `holdMs` plus ~15-30 ms
  of teardown, and does not move. Startup is the only variable, and it is
  the thing the assertion was accidentally bounding.
- **CI evidence**: failures at **660, 769, 793 ms** (runs 32610244977,
  32601147447, 32594071295) against a 640 ms threshold. Subtracting the
  stable ~420 ms concurrent phase puts CI startup at **260-390 ms** versus
  64 ms on a 12-core dev machine — a 2-core `ubuntu-latest` runner doing the
  same node boot + TS transpile. Nothing about the lock changed between the
  machines.
- **Confidence**: High — measured on both axes, and the CI numbers subtract
  cleanly.

## The fix, and why it is not a loosening

Time the **concurrent phase** instead of the whole wall clock:

```ts
const firstAcquired = Math.min(acquiredA, acquiredB);
const concurrentPhaseMs = elapsed - (firstAcquired - start);
expect(concurrentPhaseMs).toBeLessThan(holdMs * 1.6);
```

The threshold, the multiplier and the serialisation floor are all unchanged.
Under serialisation the second worker cannot acquire until the first
releases, so this quantity becomes ~2*holdMs and still blows 640 ms.

**Red/green proof.** Forcing the worker to `{ lockPath, mode: 'exclusive' }`
— genuine serialisation — fails with
`AssertionError: expected 853 to be less than 640` (853 ≈ 2*holdMs plus
teardown, the exact serialisation signature). Restored to the shared default:
8 of 8 pass. So the assertion still catches the regression it exists to
catch; it no longer also fails when the runner is slow to fork a process.

The two overlap assertions below it —
`acquiredA < acquiredB + holdMs` and its mirror — were always the rigorous,
startup-independent proof of non-serialisation. They are untouched.

## Generalisable lesson

Any wall-clock assertion timed from before a `spawn`/`fork` is partly a
measure of the runner, not of the code under test. Time from the first
observable event *inside* the spawned work — here the acquisition timestamp
the worker already writes to its sentinel — and the confound disappears
without weakening what is being proven.
