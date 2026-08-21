# T4 — Serialize builds with a recoverable lock

## Context
Repo `/Users/scottseely/git/knowvah/plantuml-ts`, branch
`fix/stdlib-build-race`. **No `src/`** — stop 2.

T2 landed the content-derived up-to-date predicate. It is not enough on its
own: a second run can still observe a **partial** tree, judge it stale, and
`rmSync` it. This task adds the lock that makes that observation impossible,
completing D3.

## Task
1. Take a cross-process lock around the build, before any `rmSync`.
2. **Inside** the lock, re-check T2's predicate. The second holder must then
   find the tree complete and **skip** rather than rebuild — that is the
   sequence that actually closes the window: A builds under the lock, releases,
   B acquires, re-checks, skips, and A's workers import an intact tree.
3. **Stale-lock recovery is mandatory** (stop 6). If the holder died, a new run
   must detect it — PID liveness and/or an age threshold — and proceed. A lock
   that survives a crash and wedges every future run is a worse defect than the
   one being fixed.
4. **Bounded wait.** Never block indefinitely. On timeout, fail with a message
   naming the lock path and the wait duration, so a developer can act without
   reading this code.
5. Log when the lock is waited on and when a stale lock is reclaimed
   (Phase 4 detectability).
6. TDD: tests first, in `tests/unit/build-stdlib-lock.test.ts`.

Read-only git only; no commits.

## Write-set
- `scripts/build-stdlib-packages.ts`
- `tests/unit/build-stdlib-lock.test.ts`
- `.agent-notes/sre-T4.md`

## Read-set
- `.agent-notes/sre-T2.md` — the predicate's name and signature
- `.agent-notes/sre-T0.md` — the proven mechanism
- `scripts/build-stdlib-packages.ts` — as T2 left it
- `plans/stdlib-build-race/decisions.md` — D3 (including the residual hole), D4

## Acceptance
- Given a second builder, when the lock is held, then it waits, then re-checks
  inside the lock, finds the tree up to date, and performs **no `rmSync`**.
- Given a lock left behind by a dead process, when a new run starts, then it
  detects the stale lock and proceeds — assert it does not hang.
- Given a lock held past the timeout, then it fails with a message naming the
  lock path and the wait duration.
- Given 3 concurrent builders, then exactly one builds, none errors, and the
  output is byte-identical to a single-builder run.
- Given T1's guarded repro on this tree, then it now PASSES — run it and quote
  the result. (This is the first batch where that flip is expected.)

## Observability
Log lock waits and stale-lock reclaims with the lock path. No SLIs, no traces.

## Rollback
Reversible: one script plus its tests, one commit. Reverting restores the race,
not a broken build.

## Quality bar
Four gates green, coverage >= 90/90/90. TDD. `npm test` under 60.3 s on a
settled machine — the lock is taken on every run, so confirm it costs nothing
measurable in the uncontended case. Complexity hook: extract a NAMED helper.

## Boundaries
- **Always:** implement stale recovery and a bounded wait before considering
  the task done; re-check the predicate inside the lock.
- **Never:** touch `src/`; block unboundedly; hold the lock for the whole test
  run rather than the build (D3 rejected that as too coarse); run git write
  commands.

## Report (<=350 tokens)
The lock's on-disk representation; stale-recovery and timeout behaviour with
the tests that pin them; the quoted repro flip; the uncontended cost; the four
gates.
